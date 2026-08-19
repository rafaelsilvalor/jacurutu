import { test } from "node:test";
import assert from "node:assert";
import path from "node:path";
import { inspect } from "node:util";

import { sheetsErrorMessage, toSheetsError } from "./errors.js";

const OPERATION = "writeGrid";
const TARGET = "spreadsheet test-spreadsheet-id";

/** The relative token path the hints quote, composed the way errors.ts composes it (R1). */
const TOKEN_PATH_HINT = path.join(".jacurutu", "token.json");

// Obvious placeholders — no value here is shaped like a real credential (binding —
// docs/explorations/drive-oauth.md §10).
const PLACEHOLDER_REFRESH_TOKEN = "test-placeholder-refresh-token";
const PLACEHOLDER_AUTH_CODE = "test-placeholder-authorization-code";

/** gaxios's marker, verbatim from `defaultErrorRedactor`: what a redacted value reads. */
const GAXIOS_REDACTED =
  "<<REDACTED> - See `errorRedactor` option in `gaxios` for configuration>.";

/** The 403 the spike actually met: the Sheets API was not enabled in the Cloud project. */
const SERVICE_DISABLED_MESSAGE =
  "Google Sheets API has not been used in project 000000000000 before or it is " +
  "disabled. Enable it by visiting https://console.developers.google.com/apis/api/" +
  "sheets.googleapis.com/overview then retry.";

/** A Google-API-shaped failure: the status hangs off `response`. */
function apiError(status: number, message: string): Error & { response: { status: number } } {
  return Object.assign(new Error(message), { response: { status } });
}

/**
 * A token-refresh failure, modeled on the shape adapter-drive verified live on
 * 2026-08-03: `client_secret` and `grant_type` already read as redacted because
 * gaxios rewrote them, and `refresh_token` does not, because no redaction list
 * covers it. A refresh runs inside an ordinary API call, so this error reaches the
 * adapter through its normal failure seam (G-DRIVE-3).
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

/** A consent code-for-token failure: same shape, and the leak here is `code`. */
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
    response: { status: 400, data: { error: "invalid_grant" } },
  });
}

test("(a) a disabled Sheets API is reported as a project setting, not an auth problem", () => {
  const message = sheetsErrorMessage(OPERATION, TARGET, apiError(403, SERVICE_DISABLED_MESSAGE));
  assert.match(message, /status=403/);
  assert.match(message, /not enabled in this Cloud project/);
  assert.match(message, /G-SHEETS-1/);
  // The whole point of the rule: a 403 from a disabled API says nothing about the
  // grant — asserted on what the spike measured (same token, same granted scopes,
  // success once the API was enabled), never on where Google checks the grant.
  assert.match(message, /No token or grant needs changing/);
  assert.ok(!message.includes(TOKEN_PATH_HINT));
});

test("(b) service-disabled outranks the scope signature when a message carries both", () => {
  const both = `${SERVICE_DISABLED_MESSAGE} Request had insufficient authentication scopes.`;
  const message = sheetsErrorMessage(OPERATION, TARGET, apiError(403, both));
  assert.match(
    message,
    /not enabled in this Cloud project/,
    "A message carrying BOTH signatures classified as a scope failure. The rule " +
      "order is load-bearing and this is the exact misclassification the 2026-08-15 " +
      "spike paid to find: a disabled API answers 403 before authorization is ever " +
      "consulted, so calling it a scope problem sends the reader to re-authorize " +
      "against a grant that was never the cause. Service-disabled must be tested " +
      "BEFORE the scope signature in MESSAGE_RULES — restore that order.",
  );
  assert.ok(!message.includes(TOKEN_PATH_HINT));
});

test("(c) an insufficient-scopes failure points at the token file and re-consent", () => {
  const message = sheetsErrorMessage(
    OPERATION,
    TARGET,
    apiError(403, "Request had insufficient authentication scopes."),
  );
  assert.match(message, /status=403/);
  assert.match(message, /granted scopes do not cover this call/);
  assert.ok(message.includes(TOKEN_PATH_HINT));
  assert.match(message, /G-DRIVE-1/);
});

test("(d) a broken grant points at deleting the token and authorizing again", () => {
  const message = sheetsErrorMessage(OPERATION, TARGET, apiError(400, "invalid_grant"));
  assert.match(message, /expired or revoked/);
  assert.ok(message.includes(TOKEN_PATH_HINT));
  assert.match(message, /authorize again/);
});

test("(e) 404 states the drive.file visibility caveat and claims nothing beyond it", () => {
  const message = sheetsErrorMessage(OPERATION, TARGET, apiError(404, "File not found"));
  assert.match(message, /status=404/);
  assert.match(message, /drive\.file exposes only items this app created/);
  // Nothing is claimed about files other accounts created — that was never measured.
  assert.doesNotMatch(message, /other account|another account|foreign/i);
});

test("(f) 429 reads as a transient Google-side condition", () => {
  const message = sheetsErrorMessage(OPERATION, TARGET, apiError(429, "Rate Limit Exceeded"));
  assert.match(message, /status=429/);
  assert.match(message, /transient Google-side condition/);
});

test("(g) 5xx reads as a transient Google-side condition", () => {
  const message = sheetsErrorMessage(OPERATION, TARGET, apiError(503, "Backend Error"));
  assert.match(message, /status=503/);
  assert.match(message, /transient Google-side condition/);
});

test("(h) a 403 matching no rule reports unknown and never borrows the scope verdict", () => {
  const message = sheetsErrorMessage(
    OPERATION,
    TARGET,
    apiError(403, "The caller does not have permission for this operation."),
  );
  assert.match(message, /status=403/);
  assert.match(message, /authorization failure of unknown cause/);
  assert.doesNotMatch(
    message,
    /scope/i,
    "An unruled 403 named scopes as its cause. That is the spike's original " +
      "instrument bug: the first probe called every 403 a scope signal, and the 403 " +
      "it met was a disabled API. A wrong cause costs more than an absent one — an " +
      "unmatched authorization failure must say it is unknown and stop there.",
  );
  assert.ok(!message.includes(TOKEN_PATH_HINT));
});

test("(i) an unclassified 401 reports unknown rather than inventing a cause", () => {
  const message = sheetsErrorMessage(
    OPERATION,
    TARGET,
    apiError(401, "Request had invalid authentication credentials."),
  );
  assert.match(message, /status=401/);
  assert.match(message, /authorization failure of unknown cause/);
  assert.doesNotMatch(message, /scope/i);
});

test("(j) a non-Error input is reported verbatim and unclassified", () => {
  const message = sheetsErrorMessage(OPERATION, TARGET, "something went wrong");
  assert.match(message, /status=n\/a/);
  assert.match(message, /message="something went wrong"/);
  assert.match(message, /unclassified/);
});

test("(k) an error with no status is unclassified rather than guessed at", () => {
  const message = sheetsErrorMessage(OPERATION, TARGET, new Error("socket hang up"));
  assert.match(message, /status=n\/a/);
  assert.match(message, /unclassified/);
});

test("(l) every message names the operation and the target it addressed", () => {
  const message = sheetsErrorMessage(
    "shareAsReader",
    "spreadsheet test-id",
    apiError(500, "boom"),
  );
  assert.match(message, /^Sheets shareAsReader failed for spreadsheet test-id: /);
});

test("(m) toSheetsError keeps message, status and stack on a sanitized cause", () => {
  const original = apiError(404, "File not found");
  const wrapped = toSheetsError(OPERATION, TARGET, original);
  assert.strictEqual(wrapped.message, sheetsErrorMessage(OPERATION, TARGET, original));
  const cause = wrapped.cause as Error & { status?: number };
  assert.ok(cause instanceof Error);
  assert.notStrictEqual(cause, original, "the library's own error must never be the cause");
  assert.strictEqual(cause.message, original.message);
  assert.strictEqual(cause.status, 404);
  assert.strictEqual(cause.stack, original.stack);
});

test("(p) a 400 on shareAsReader names both candidate causes and picks neither", () => {
  // The 2026-08-15 live failure, verbatim in shape: Google answered 400 and its
  // message arrived in pt-BR. Nothing here reads that message — the rule is keyed on
  // the operation and the status, which is the only pair that survives a locale.
  const portuguese =
    'Bad Request. User message: "Voce esta tentando convidar <address>. Como nao ha ' +
    'uma Conta do Google associada a esse endereco de e-mail, voce precisara ' +
    'selecionar a caixa Notificar pessoas para convidar o destinatario."';
  const message = sheetsErrorMessage("shareAsReader", TARGET, apiError(400, portuguese));

  assert.match(message, /status=400/);
  assert.match(message, /rejected the share as a bad request/);
  // Both candidate causes present, neither asserted: the run measured that the
  // request was refused, never why.
  assert.match(message, /may have no Google account/);
  assert.match(message, /may require the notification flag/);
  assert.match(message, /never measured/);
  // It must not read as unclassified any more, which is what it did live.
  assert.ok(!message.includes("unclassified"));
});

test("(q) a 400 on another operation does not borrow the share hint", () => {
  const message = sheetsErrorMessage("writeGrid", TARGET, apiError(400, "Bad Request."));
  assert.ok(
    !message.includes("rejected the share as a bad request"),
    "a 400 on writeGrid borrowed shareAsReader's hint: the rule is keyed on the " +
      "operation AND the status, and keying it on status alone would tell a reader " +
      "to check an address that no writeGrid call ever had",
  );
  assert.match(message, /unclassified/);
});

test("(r) service-disabled still outranks the operation rule on a share", () => {
  // The order the spike paid for, re-asserted at the seam A3 added: a message rule
  // must win over operation+status, or a disabled API on a share would be reported
  // as a bad address.
  const message = sheetsErrorMessage(
    "shareAsReader",
    TARGET,
    apiError(400, SERVICE_DISABLED_MESSAGE),
  );
  assert.match(
    message,
    /not enabled in this Cloud project/,
    "the operation+status rule outranked the message rules: MESSAGE_RULES must be " +
      "consulted first, or service-disabled stops being the first answer",
  );
  assert.ok(!message.includes("rejected the share as a bad request"));
});

test("(n) a wrapped refresh failure prints no refresh token (G-DRIVE-3)", () => {
  const original = refreshFailureError();
  // Non-vacuity guard: if the fixture does not carry the leak, the assertion below
  // passes against nothing and this test proves nothing.
  assert.ok(
    inspect(original, { depth: null }).includes(PLACEHOLDER_REFRESH_TOKEN),
    "the fixture no longer carries a refresh token, so this test cannot fail",
  );

  const printed = inspect(toSheetsError(OPERATION, TARGET, original), { depth: null });
  assert.ok(!printed.includes(PLACEHOLDER_REFRESH_TOKEN));
  assert.doesNotMatch(printed, /refresh_token/);
  // Copied, never mutated: the library's error still holds what the library put there.
  assert.strictEqual(original.config.data.get("refresh_token"), PLACEHOLDER_REFRESH_TOKEN);
});

test("(o) a wrapped consent failure prints no authorization code (G-DRIVE-3)", () => {
  const original = consentFailureError();
  // Same guard as (n), for the other credential gaxios leaves unredacted.
  assert.ok(
    inspect(original, { depth: null }).includes(PLACEHOLDER_AUTH_CODE),
    "the fixture no longer carries an authorization code, so this test cannot fail",
  );

  const printed = inspect(toSheetsError(OPERATION, TARGET, original), { depth: null });
  assert.ok(!printed.includes(PLACEHOLDER_AUTH_CODE));
  assert.strictEqual(original.config.data.get("code"), PLACEHOLDER_AUTH_CODE);
});
