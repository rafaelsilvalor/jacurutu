import { test } from "node:test";
import assert from "node:assert";
import path from "node:path";
import { inspect } from "node:util";

import { CREDENTIALS_DIR_NAME, DRIVE_SCOPES, TOKEN_FILENAME } from "./constants.js";
import { driveErrorMessage, toDriveError } from "./errors.js";

const OPERATION = "resolveFolder";
const TARGET = "folder test-folder-id";

// An obvious placeholder — no value here is shaped like a real credential (binding —
// docs/explorations/drive-oauth.md §10).
const PLACEHOLDER_ACCESS_TOKEN = "test-placeholder-access-token";

/** A Google-API-shaped failure: the status hangs off `response`. */
function apiError(status: number, message: string): Error & { response: { status: number } } {
  return Object.assign(new Error(message), { response: { status } });
}

/**
 * A gaxios-shaped failure: the outgoing request rides along on the error, headers and
 * all, and the same `config` object is reachable twice (directly and via `response`).
 * This is the shape googleapis actually throws — the reason `cause` is sanitized.
 */
function gaxiosLikeError(): Error & { config: { headers: Record<string, string> } } {
  const config = {
    url: "https://www.googleapis.com/drive/v3/files/test-file-id",
    headers: {
      authorization: `Bearer ${PLACEHOLDER_ACCESS_TOKEN}`,
      "content-type": "application/json",
    },
  };
  return Object.assign(new Error("File not found"), {
    config,
    response: { status: 404, config, data: { error: { message: "File not found" } } },
  });
}

test("(a) 401 points at the token file and re-authorization", () => {
  const message = driveErrorMessage(OPERATION, TARGET, apiError(401, "Invalid Credentials"));
  assert.match(message, /status=401/);
  assert.ok(message.includes(path.join(CREDENTIALS_DIR_NAME, TOKEN_FILENAME)));
  assert.match(message, /authorize again/);
});

test("(b) 403 names both requested scopes", () => {
  const message = driveErrorMessage(OPERATION, TARGET, apiError(403, "Insufficient Permission"));
  assert.match(message, /status=403/);
  for (const scope of DRIVE_SCOPES) {
    assert.ok(message.includes(scope));
  }
});

test("(c) 404 states the drive.file visibility caveat", () => {
  const message = driveErrorMessage(OPERATION, TARGET, apiError(404, "File not found"));
  assert.match(message, /status=404/);
  assert.match(message, /drive\.file exposes only items this app created/);
});

test("(d) 429 reads as a transient Google-side condition", () => {
  const message = driveErrorMessage(OPERATION, TARGET, apiError(429, "Rate Limit Exceeded"));
  assert.match(message, /status=429/);
  assert.match(message, /transient Google-side condition/);
});

test("(e) 5xx reads as a transient Google-side condition", () => {
  const message = driveErrorMessage(OPERATION, TARGET, apiError(503, "Backend Error"));
  assert.match(message, /status=503/);
  assert.match(message, /transient Google-side condition/);
});

test("(f) a non-Error input is reported verbatim, unclassified", () => {
  const message = driveErrorMessage(OPERATION, TARGET, "something went wrong");
  assert.match(message, /status=n\/a/);
  assert.match(message, /message="something went wrong"/);
  assert.match(message, /unclassified/);
});

test("(g) an error with no status is unclassified rather than invented", () => {
  const message = driveErrorMessage(OPERATION, TARGET, new Error("socket hang up"));
  assert.match(message, /status=n\/a/);
  assert.match(message, /message="socket hang up"/);
  assert.match(message, /unclassified/);
});

test("(h) a non-numeric code is surfaced but not classified", () => {
  const offline = Object.assign(new Error("getaddrinfo ENOTFOUND"), { code: "ENOTFOUND" });
  const message = driveErrorMessage(OPERATION, TARGET, offline);
  assert.match(message, /status=ENOTFOUND/);
  assert.match(message, /unclassified/);
});

test("(i) every message names the operation and the target", () => {
  const message = driveErrorMessage("uploadFile", 'file "brief.pdf"', apiError(500, "boom"));
  assert.match(message, /^Drive uploadFile failed for file "brief\.pdf": /);
});

test("(j) toDriveError keeps message, status and stack on a sanitized cause", () => {
  const original = apiError(404, "File not found");
  const wrapped = toDriveError(OPERATION, TARGET, original);
  assert.ok(wrapped instanceof Error);
  assert.strictEqual(wrapped.message, driveErrorMessage(OPERATION, TARGET, original));
  const cause = wrapped.cause as Error & { status?: number };
  assert.ok(cause instanceof Error);
  assert.notStrictEqual(cause, original);
  assert.strictEqual(cause.message, original.message);
  assert.strictEqual(cause.status, 404);
  assert.strictEqual(cause.stack, original.stack);
});

test("(k) a wrapped error prints no credential material, at any depth", () => {
  const original = gaxiosLikeError();
  const printed = inspect(toDriveError(OPERATION, TARGET, original), { depth: null });
  assert.doesNotMatch(printed, /authorization/i);
  assert.doesNotMatch(printed, /Bearer\s+\S/);
  assert.ok(!printed.includes(PLACEHOLDER_ACCESS_TOKEN));
  // The library's error is left exactly as it came: sanitizing copies, never mutates.
  assert.strictEqual(
    original.config.headers.authorization,
    `Bearer ${PLACEHOLDER_ACCESS_TOKEN}`,
  );
});
