// Failure classification for Sheets and Drive calls made by this adapter (R4 — every
// failure surfaces, named and actionable). The shape is adapter-drive's `errors.ts`;
// the rule list is this adapter's own, because the Sheets API adds a failure mode
// Drive does not have (see ORDER below).
//
// Duplicated from adapter-drive rather than shared: D8 pins what this package imports
// from that one to `authorize`, `defaultCredentialPaths` and the OAuth client type,
// and A3 puts the extraction of a common `adapter-google` at the THIRD consumer, not
// the second. The duplication is deliberate and recorded, not an oversight.
//
// ORDER IS LOAD-BEARING, and it is a correction the spike paid for. Its first probe
// called every 403 a scope signal; the 403 it actually met meant "the Sheets API is
// not enabled in this Cloud project" — and the same token, carrying the same granted
// scopes, made the same call succeed once the API was enabled, so the scopes were
// never the cause. Filing that as a scope answer is the
// assume-instead-of-measure failure the spike existed to prevent. Service-disabled is
// therefore tested BEFORE the scope signature, and a 401/403 matching no rule reports
// itself as unknown rather than borrowing the scope verdict.
//
// Credential hygiene, stated as invariants (binding — docs/explorations/drive-oauth.md
// §10, and the audit point G-DRIVE-3 names):
//
//   1. Nothing that leaves this module holds a reference to the library's error
//      object — that object carries the outgoing request, and the request carries
//      credentials the library does not redact.
//   2. That error is never mutated: readers copy values out, nothing writes back.
//   3. No credential material is read, logged, or composed into a message or a cause.

import path from "node:path";

/**
 * Credential locations quoted in hints — composed, never hardcoded as a platform path
 * (R1). Duplicated from adapter-drive's constants for the D8 reason above; they are
 * the same two names because there is one `~/.saci` and one token file per user.
 */
const CREDENTIALS_DIR_NAME = ".saci";
const TOKEN_FILENAME = "token.json";
const TOKEN_PATH_HINT = path.join(CREDENTIALS_DIR_NAME, TOKEN_FILENAME);

/** Status used when the error carries none — an offline failure, a thrown string, etc. */
const UNKNOWN_STATUS = "n/a";

/** Statuses that are about authorization, and so must never be classified by guess. */
const AUTHORIZATION_STATUSES: ReadonlySet<number> = new Set([401, 403]);

/**
 * Message-signature rules, in the order they are tested; first match wins. Reordering
 * them re-creates the misclassification recorded at the top of this file, which is why
 * `errors.test.ts` pins the first two against a message carrying BOTH signatures.
 */
const MESSAGE_RULES: readonly { pattern: RegExp; hint: string }[] = [
  {
    pattern: /has not been used in project|SERVICE_DISABLED|API .* is disabled/i,
    hint:
      "the Google Sheets API is not enabled in this Cloud project — enable it in the " +
      "Google Cloud console and retry. No token or grant needs changing: the same " +
      "token and the same granted scopes answered this call successfully once the " +
      "API was enabled (G-SHEETS-1)",
  },
  {
    pattern:
      /insufficient authentication scopes|ACCESS_TOKEN_SCOPE_INSUFFICIENT|invalid_scope|insufficient permission/i,
    hint:
      `the granted scopes do not cover this call — delete ${TOKEN_PATH_HINT} in your ` +
      "home directory and authorize again; a cached grant is never re-issued for a " +
      "changed scope list (G-DRIVE-1)",
  },
  {
    pattern: /invalid_grant|expired or revoked|consent/i,
    hint:
      `the stored grant is expired or revoked — delete ${TOKEN_PATH_HINT} in your home ` +
      "directory and authorize again in the browser",
  },
];

/**
 * Operation + status -> hint, consulted after the message rules and before the
 * status-only table. Keyed on the operation and the HTTP status, never on message
 * text: the 2026-08-15 live failure arrived as pt-BR prose, so a substring guard
 * would have worked for whoever wrote it and failed for the next account
 * (`G-JIRA-1`, now in a second vendor).
 *
 * The share entry names two candidate causes and picks neither. What was measured is
 * that the request was rejected — not why — and the two readings that fit are that
 * the address has no Google account behind it, or that the grant needed the
 * notification flag. Choosing one here would be an inference dressed as a finding.
 */
const OPERATION_STATUS_HINTS: ReadonlyMap<string, string> = new Map([
  [
    "shareAsReader:400",
    "Drive rejected the share as a bad request — the recipient may have no Google " +
      "account behind that address, or the grant may require the notification flag; " +
      "this was never measured, so check the address for a typo first. The report " +
      "itself is unaffected: only the share failed",
  ],
]);

/**
 * Status -> hint, for failures no message rule claimed. The 404 line states the
 * `drive.file` visibility caveat and stops there: what this scope does with items
 * created by other accounts was never measured (spike, "What was not measured"), so
 * no hint claims anything about it in either direction.
 */
const STATUS_HINTS: ReadonlyMap<number, string> = new Map([
  [
    404,
    "not found, or not visible under the granted scopes — drive.file exposes only " +
      "items this app created, so an item that exists in the Drive UI can still be " +
      "invisible here; check the id first",
  ],
  [429, "transient Google-side condition — retry with backoff; check status.cloud.google.com"],
]);

/** Hint for 5xx, which is a range rather than a single code. */
const SERVER_ERROR_HINT =
  "transient Google-side condition — retry with backoff; check status.cloud.google.com";

/**
 * Hint for a 401 or 403 that matched no rule. It names no cause on purpose: borrowing
 * the scope verdict for an unruled authorization failure is exactly the bug the order
 * above corrects, and a wrong cause costs more than an absent one.
 *
 * The word "scope" is absent from this text by design — `errors.test.ts` (h) asserts
 * its absence, so softening this to "may not be a scope problem" breaks that test for
 * a reason that reads like a test bug and is not.
 */
const UNKNOWN_AUTH_HINT =
  "authorization failure of unknown cause — no classification rule matched, so read " +
  "the status and message above before assuming what caused it";

/** Hint when the status is unknown or unmapped: report, never invent a cause. */
const UNCLASSIFIED_HINT = "unclassified — read the status and message above";

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

/** Stand-in for a recipient address removed from a message that leaves this module. */
const RECIPIENT_PLACEHOLDER = "<recipient>";

/**
 * Remove `secret` from a message Google composed. Measured need, not a precaution:
 * on 2026-08-15 a rejected share came back with the recipient's address quoted
 * inside Google's own text, which the adapter then carried into its message. The
 * previous task recorded that exact case as an uncovered bound; eight days later it
 * happened.
 *
 * The empty-string guard is load-bearing — `replaceAll("")` splices the placeholder
 * between every character, turning a leak into what reads like a corruption bug.
 */
function redact(message: string, secret: string | undefined): string {
  if (secret === undefined || secret === "") {
    return message;
  }
  return message.replaceAll(secret, RECIPIENT_PLACEHOLDER);
}

function errorMessage(error: unknown, secret?: string): string {
  return redact(error instanceof Error ? error.message : String(error), secret);
}

/**
 * Apply the ordered rules: message signatures first, then operation+status, then
 * status, then unknown. The message rules stay FIRST — that order is what the spike
 * paid for, and service-disabled must win over everything, including on a share.
 */
function hintFor(operation: string, status: number | string, message: string): string {
  for (const rule of MESSAGE_RULES) {
    if (rule.pattern.test(message)) {
      return rule.hint;
    }
  }
  if (typeof status !== "number") {
    return UNCLASSIFIED_HINT;
  }
  const byOperation = OPERATION_STATUS_HINTS.get(`${operation}:${status}`);
  if (byOperation !== undefined) {
    return byOperation;
  }
  const mapped = STATUS_HINTS.get(status);
  if (mapped !== undefined) {
    return mapped;
  }
  if (status >= 500) {
    return SERVER_ERROR_HINT;
  }
  return AUTHORIZATION_STATUSES.has(status) ? UNKNOWN_AUTH_HINT : UNCLASSIFIED_HINT;
}

/**
 * Compose the failure message: what was attempted, on what target, what Google
 * answered, and what to do about it. `operation` is the port method name; `target`
 * names the spreadsheet the call addressed — never the share recipient, whose address
 * is a personal identifier that must not reach a log line (brief constraint 2).
 */
export function sheetsErrorMessage(
  operation: string,
  target: string,
  error: unknown,
  secret?: string,
): string {
  const status = errorStatus(error);
  const message = errorMessage(error, secret);
  return `Sheets ${operation} failed for ${target}: status=${status} message="${message}". Hint: ${hintFor(
    operation,
    status,
    message,
  )}`;
}

/**
 * Build the credential-free stand-in carried as `cause`. Google's client attaches the
 * outgoing request to the error it throws, and Node's default error printing walks the
 * `cause` chain — so whatever rode on that request prints on the first
 * `console.error(err)` or unhandled rejection.
 *
 * gaxios's default redactor covers the `authorization` header, anything matching
 * `secret`, and the `grant_type` / `assertion` body keys. It does NOT cover
 * `refresh_token` or the consent `code`, both of which travel as own enumerable state
 * on a token-endpoint failure — and a token refresh runs inside an ordinary Sheets or
 * Drive call, so that error arrives at this adapter's normal failure seam (G-DRIVE-3).
 *
 * Three facts cross over: the message, the classified status, and the original stack
 * (the frames R4 wants kept). The incoming error is never mutated — it belongs to the
 * library.
 */
function sanitizedCause(error: unknown, secret?: string): Error {
  // Redacted HERE as well as in the composed message, and that is not belt-and-braces:
  // this is the object Node prints on an unhandled rejection, which is the path
  // G-DRIVE-3 exists for. Cleaning one and not the other closes nothing.
  const cause = new Error(errorMessage(error, secret));
  const status = errorStatus(error);
  if (status !== UNKNOWN_STATUS) {
    Object.assign(cause, { status });
  }
  if (error instanceof Error && typeof error.stack === "string") {
    // The stack is redacted too. A V8 stack string OPENS with the error's message,
    // so copying it raw re-imports the address the line above just removed — and the
    // stack is the part that actually prints. Caught by gateway.test.ts (i)'s
    // full-depth inspect, not by reasoning.
    cause.stack = redact(error.stack, secret);
  }
  return cause;
}

/**
 * Wrap a failure in an `Error` carrying the classified message, with a sanitized copy
 * of the original as `cause` so the stack is not lost (R4 — surfaced, never swallowed)
 * and no credential material travels with the thrown error.
 */
export function toSheetsError(
  operation: string,
  target: string,
  error: unknown,
  secret?: string,
): Error {
  return new Error(sheetsErrorMessage(operation, target, error, secret), {
    cause: sanitizedCause(error, secret),
  });
}
