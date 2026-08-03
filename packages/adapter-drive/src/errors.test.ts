import { test } from "node:test";
import assert from "node:assert";
import path from "node:path";
import { inspect } from "node:util";

import {
  CREDENTIALS_DIR_NAME,
  DRIVE_SCOPES,
  OAUTH_CLIENT_FILENAME,
  TOKEN_FILENAME,
} from "./constants.js";
import { driveErrorMessage, toConsentError, toDriveError } from "./errors.js";

const OPERATION = "resolveFolder";
const TARGET = "folder test-folder-id";

// Obvious placeholders — no value here is shaped like a real credential (binding —
// docs/explorations/drive-oauth.md §10).
const PLACEHOLDER_ACCESS_TOKEN = "test-placeholder-access-token";
const PLACEHOLDER_REFRESH_TOKEN = "test-placeholder-refresh-token";
const PLACEHOLDER_AUTH_CODE = "test-placeholder-authorization-code";
/** Stands in for Google's `error_description`; its wording on a reused code is unverified. */
const PLACEHOLDER_DESCRIPTION = "test-placeholder description from the token endpoint";

/** gaxios's marker, verbatim from `defaultErrorRedactor`: what a redacted value reads. */
const GAXIOS_REDACTED =
  "<<REDACTED> - See `errorRedactor` option in `gaxios` for configuration>.";

/** A Google-API-shaped failure: the status hangs off `response`. */
function apiError(status: number, message: string): Error & { response: { status: number } } {
  return Object.assign(new Error(message), { response: { status } });
}

// Two fixtures below guard two different things, and which is which matters — the round
// that corrected `notes.md` §7 exists because a fixture was mistaken for the library's
// behavior. `refreshFailureError` carries the leak verified against a real request error.
// `gaxiosLikeError` carries one the library's own redactor already closes, and is kept as
// defence in depth only.

/**
 * A gaxios-shaped failure with an *unredacted* authorization header, the same `config`
 * reachable twice (directly and via `response`). Not what googleapis throws today: its
 * default `errorRedactor` rewrites that header before the error escapes. Kept because the
 * assertion still has to hold if a caller ever passes `errorRedactor: false` or a future
 * version narrows what it covers.
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

/**
 * A token-refresh failure, modeled on the shape observed on 2026-08-03 against a stub
 * token endpoint: own keys `config`, `response`, `code`, `status`, message
 * `invalid_grant`, and the same `URLSearchParams` reachable as both `config.data` and
 * `config.body`. Two details in that body are the whole point of the fixture:
 * `client_secret` and `grant_type` already read as redacted, because gaxios's default
 * redactor rewrote them, and `refresh_token` does not, because no redaction list covers
 * it. A refresh runs inside a Drive call, so this error arrives through `gateway.call`.
 */
function refreshFailureError(): Error & { config: { data: URLSearchParams } } {
  const body = new URLSearchParams({
    refresh_token: PLACEHOLDER_REFRESH_TOKEN,
    client_id: "test-placeholder-client-id",
    client_secret: GAXIOS_REDACTED,
    grant_type: GAXIOS_REDACTED,
  });
  return Object.assign(new Error("invalid_grant"), {
    code: 400,
    status: 400,
    config: { method: "POST", url: "https://oauth2.googleapis.com/token", data: body, body },
    response: {
      status: 400,
      data: { error: "invalid_grant", error_description: "Token has been expired or revoked." },
    },
  });
}

/**
 * A consent code-for-token failure: same endpoint and same observed error shape as
 * `refreshFailureError`, with the body `getTokenAsync` actually posts. The leak here is
 * `code` — the redactor rewrites `client_secret` and `grant_type` and has no rule for
 * it. The `error_description` text is a stand-in: what Google words it as on a reused
 * code was not observed, only that the field is there and is a string.
 */
function consentFailureError(): Error & { config: { data: URLSearchParams } } {
  const body = new URLSearchParams({
    client_id: "test-placeholder-client-id",
    code: PLACEHOLDER_AUTH_CODE,
    grant_type: GAXIOS_REDACTED,
    redirect_uri: "http://127.0.0.1:54321/oauth2callback",
    client_secret: GAXIOS_REDACTED,
  });
  return Object.assign(new Error("invalid_grant"), {
    code: 400,
    status: 400,
    config: { method: "POST", url: "https://oauth2.googleapis.com/token", data: body, body },
    response: {
      status: 400,
      data: { error: "invalid_grant", error_description: PLACEHOLDER_DESCRIPTION },
    },
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

test("(k) defence in depth: a wrapped error prints no authorization header", () => {
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

test("(l) the verified leak: a wrapped refresh failure prints no refresh token", () => {
  const original = refreshFailureError();
  // Non-vacuity guard: the fixture must actually carry the leak, or (l) proves nothing.
  assert.ok(inspect(original, { depth: null }).includes(PLACEHOLDER_REFRESH_TOKEN));

  const wrapped = toDriveError(OPERATION, TARGET, original);
  const printed = inspect(wrapped, { depth: null });
  assert.ok(!printed.includes(PLACEHOLDER_REFRESH_TOKEN));
  assert.doesNotMatch(printed, /refresh_token/);
  // What R4 wants kept survives the sanitizing: the status classifies, the message names.
  assert.match(wrapped.message, /status=400/);
  assert.match(wrapped.message, /message="invalid_grant"/);
  // Copied, never mutated — the body still holds what the library put there.
  assert.strictEqual(original.config.data.get("refresh_token"), PLACEHOLDER_REFRESH_TOKEN);
});

test("(m) toConsentError says what failed and what to do, without a Drive frame", () => {
  const message = toConsentError(consentFailureError()).message;
  assert.match(message, /^OAuth consent exchange failed: /);
  assert.doesNotMatch(message, /^Drive /);
  assert.match(message, /status=400/);
  assert.match(message, /message="invalid_grant"/);
  // The description is the one detail the classified Drive path would have dropped.
  assert.ok(message.includes(PLACEHOLDER_DESCRIPTION));
  assert.match(message, /single-use/);
  assert.match(message, /re-run the command/);
  assert.ok(message.includes(path.join(CREDENTIALS_DIR_NAME, OAUTH_CLIENT_FILENAME)));
  assert.doesNotMatch(message, /unclassified/);
});

test("(n) a wrapped consent failure prints no authorization code", () => {
  const original = consentFailureError();
  // Non-vacuity guard, as in (l): the fixture must carry the leak it claims to guard.
  assert.ok(inspect(original, { depth: null }).includes(PLACEHOLDER_AUTH_CODE));

  const printed = inspect(toConsentError(original), { depth: null });
  assert.ok(!printed.includes(PLACEHOLDER_AUTH_CODE));
  assert.doesNotMatch(printed, /code=/);
  assert.strictEqual(original.config.data.get("code"), PLACEHOLDER_AUTH_CODE);
});

test("(o) toConsentError omits the parenthetical when no description is carried", () => {
  const message = toConsentError(new Error("socket hang up")).message;
  assert.match(message, /^OAuth consent exchange failed: status=n\/a message="socket hang up"\. /);
  assert.match(message, /single-use/);
});
