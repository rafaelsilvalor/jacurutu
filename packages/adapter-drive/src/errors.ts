// Failure classification for Drive calls (R4 — every failure surfaces, named and
// actionable). Ported from the 046 probe's `classifyError`, which was itself the
// Python-era `_diagnose_error` shape.
//
// Credential hygiene: only the HTTP status and the error message are read. Nothing
// here touches the token, the client secret, or any request header.

import path from "node:path";

import {
  CREDENTIALS_DIR_NAME,
  DRIVE_SCOPES,
  TOKEN_FILENAME,
} from "./constants.js";

/** Relative token location quoted in hints; composed, never a hardcoded separator (R1). */
const TOKEN_PATH_HINT = path.join(CREDENTIALS_DIR_NAME, TOKEN_FILENAME);

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
 * Wrap a Drive failure in an `Error` carrying the classified message, preserving the
 * original as `cause` so the stack is not lost (R4 — surfaced, never swallowed).
 */
export function toDriveError(operation: string, target: string, error: unknown): Error {
  return new Error(driveErrorMessage(operation, target, error), { cause: error });
}
