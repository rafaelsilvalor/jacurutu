// Failure classification for Drive calls (R4 — every failure surfaces, named and
// actionable). Ported from the 046 probe's `classifyError`, which was itself the
// Python-era `_diagnose_error` shape.
//
// Credential hygiene: only the HTTP status and the error message are read, and only
// those two plus the original stack are carried out. Nothing that leaves this module
// holds a reference to the library's own error object, which carries the outgoing
// request body. `sanitizedCause` states which part of that body the library leaves
// unredacted, and is the reason the copy exists.

import path from "node:path";

import {
  CREDENTIALS_DIR_NAME,
  DRIVE_SCOPES,
  OAUTH_CLIENT_FILENAME,
  TOKEN_FILENAME,
} from "./constants.js";

/** Relative credential locations quoted in hints; composed, never hardcoded (R1). */
const TOKEN_PATH_HINT = path.join(CREDENTIALS_DIR_NAME, TOKEN_FILENAME);
const OAUTH_CLIENT_PATH_HINT = path.join(CREDENTIALS_DIR_NAME, OAUTH_CLIENT_FILENAME);

/** Status used when the error carries none — an offline failure, a thrown string, etc. */
const UNKNOWN_STATUS = "n/a";

/**
 * Status -> actionable hint. The 404 line states the `drive.file` visibility caveat
 * and stops there: what this scope does with items created by other accounts was
 * never tested (046 D7), so no hint claims anything about it.
 */
const STATUS_HINTS: ReadonlyMap<number, string> = new Map([
  [
    401,
    `the stored token is invalid or expired — delete ${TOKEN_PATH_HINT} in your home directory and authorize again`,
  ],
  [
    403,
    `permission denied, or the granted scopes do not cover this call — the app requests ${DRIVE_SCOPES.join(
      " + ",
    )}; confirm the account may access the target, and re-authorize after any scope change`,
  ],
  [
    404,
    "not found, or not visible under the granted scopes — drive.file exposes only items this app created, so an item that exists in the Drive UI can still be invisible here; check the id first",
  ],
  [429, "transient Google-side condition — retry with backoff; check status.cloud.google.com"],
]);

/** Hint for 5xx, which is a range rather than a single code. */
const SERVER_ERROR_HINT =
  "transient Google-side condition — retry with backoff; check status.cloud.google.com";

/** Hint when the status is unknown or unmapped: report, never invent a cause. */
const UNCLASSIFIED_HINT = "unclassified — read the status and message above";

/**
 * Hint for the code-for-token exchange. It names the ordinary cause first because that
 * is what the designer in front of the browser just did: an authorization code is
 * single-use and short-lived, so a slow or repeated consent is the likely failure and
 * re-running is the whole fix. The credential-mismatch case is second because it fails
 * every time rather than intermittently, which is how the reader tells them apart.
 */
const CONSENT_HINT = `the authorization code is single-use and expires within minutes — re-run the command and complete the browser consent again. If it fails immediately on every attempt, the client id, secret or redirect handling in ${OAUTH_CLIENT_PATH_HINT} does not match the Desktop OAuth client in Google Cloud`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Dig the HTTP status out of a googleapis error. The library surfaces it as
 * `response.status`, older shapes as `code` or `status`; a non-numeric `code`
 * (e.g. `ENOTFOUND`) is kept as-is for the message but classifies as unknown.
 */
function errorStatus(error: unknown): number | string {
  if (!isRecord(error)) {
    return UNKNOWN_STATUS;
  }
  if (isRecord(error.response) && typeof error.response.status === "number") {
    return error.response.status;
  }
  if (typeof error.code === "number" || typeof error.code === "string") {
    return error.code;
  }
  if (typeof error.status === "number" || typeof error.status === "string") {
    return error.status;
  }
  return UNKNOWN_STATUS;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Google's `error_description` from a token-endpoint failure — the one human-readable
 * sentence the raw error carries that neither the status nor the message repeats
 * ("Token has been expired or revoked."). Read as narrowly as the status is: one string
 * field, nothing else out of the response body.
 */
function errorDescription(error: unknown): string | null {
  if (!isRecord(error) || !isRecord(error.response) || !isRecord(error.response.data)) {
    return null;
  }
  const description = error.response.data.error_description;
  return typeof description === "string" ? description : null;
}

function hintForStatus(status: number | string): string {
  if (typeof status !== "number") {
    return UNCLASSIFIED_HINT;
  }
  return STATUS_HINTS.get(status) ?? (status >= 500 ? SERVER_ERROR_HINT : UNCLASSIFIED_HINT);
}

/**
 * Compose the failure message for a Drive call: what was attempted, on what target,
 * what Google answered, and what to do about it. `operation` is the port method name,
 * `target` names the id or path the call addressed.
 */
export function driveErrorMessage(operation: string, target: string, error: unknown): string {
  const status = errorStatus(error);
  return `Drive ${operation} failed for ${target}: status=${status} message="${errorMessage(
    error,
  )}". Hint: ${hintForStatus(status)}`;
}

/**
 * Build the credential-free stand-in carried as `cause`. Google's client attaches the
 * outgoing request to the error it throws, and Node's default error printing walks the
 * `cause` chain — so whatever rides on that request prints on the first
 * `console.error(err)` or unhandled rejection.
 *
 * What is already safe, and why the loose version of this warning is wrong: gaxios
 * installs `defaultErrorRedactor` on every request unless the caller opts out, so an
 * `authorization` header, any header or body key matching `secret`, and the
 * `grant_type` / `assertion` body keys all arrive here reading `<<REDACTED> ...>`. No
 * access token survives that far.
 *
 * What is not safe: `refresh_token` is on no redaction list. `google-auth-library`'s
 * `refreshTokenNoCache` posts `URLSearchParams({ refresh_token, client_id,
 * client_secret, grant_type })`, and the redactor's `URLSearchParams` branch rewrites
 * only the keys named above — so an `invalid_grant` refresh (an expired or revoked
 * token: the ordinary failure) throws carrying the long-lived refresh token in clear,
 * as own enumerable state. That refresh runs inside a Drive call, so the error reaches
 * here through `gateway.call`. The consent exchange leaks its authorization `code` the
 * same way. Verified 2026-08-03 against a stub token endpoint; the earlier, wrong
 * version of this claim is recorded in `docs/tasks/047-adapter-drive/notes.md` §7.
 *
 * Three facts cross over: the message, the classified status, and the original stack
 * (the frames R4 wants kept). The incoming error is never mutated — it belongs to the
 * library.
 */
function sanitizedCause(error: unknown): Error {
  const cause = new Error(errorMessage(error));
  const status = errorStatus(error);
  if (status !== UNKNOWN_STATUS) {
    Object.assign(cause, { status });
  }
  if (error instanceof Error && typeof error.stack === "string") {
    cause.stack = error.stack;
  }
  return cause;
}

/**
 * Wrap a Drive failure in an `Error` carrying the classified message, with a sanitized
 * copy of the original as `cause` so the stack is not lost (R4 — surfaced, never
 * swallowed) and no credential material travels with the thrown error.
 */
export function toDriveError(operation: string, target: string, error: unknown): Error {
  return new Error(driveErrorMessage(operation, target, error), {
    cause: sanitizedCause(error),
  });
}

/**
 * Wrap a failure of the OAuth code-for-token exchange (`auth.ts`), the one library call
 * in this package that is not a Drive call. Same sanitized `cause` as `toDriveError`:
 * the exchange body carries the authorization `code` in clear — the redactor rewrites
 * `client_secret` and `grant_type` and leaves `code` alone — so the doctrine that no
 * library error travels whole applies here too.
 *
 * It does not reuse `driveErrorMessage`, which would mislead twice over: the failure
 * would read as a Drive call, and 400 is unmapped there, so the hint would say
 * "unclassified" to a designer whose consent just failed for an ordinary reason. This
 * message keeps the one detail the raw error had and the classified path drops —
 * Google's `error_description` — and names the fix instead.
 */
export function toConsentError(error: unknown): Error {
  const description = errorDescription(error);
  const detail = description === null ? "" : ` (${description})`;
  return new Error(
    `OAuth consent exchange failed: status=${errorStatus(error)} message="${errorMessage(
      error,
    )}"${detail}. Hint: ${CONSENT_HINT}`,
    { cause: sanitizedCause(error) },
  );
}
