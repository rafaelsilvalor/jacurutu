import { test } from "node:test";
import assert from "node:assert";

import { JiraHttpClient, type FetchLike } from "./http.js";

// Capturing transport double for the field-catalog GET. Records the init it was
// called with so the no-body contract can be asserted, and serves a canned
// response. ZERO network (R23, D4).
function catalogFetch(
  response: { ok: boolean; status: number; payload: unknown },
): { fetchImpl: FetchLike; calls: Array<{ input: string; init: Parameters<FetchLike>[1] }> } {
  const calls: Array<{ input: string; init: Parameters<FetchLike>[1] }> = [];
  const fetchImpl: FetchLike = async (input, init) => {
    calls.push({ input, init });
    return {
      ok: response.ok,
      status: response.status,
      text: async () => JSON.stringify(response.payload),
      json: async () => response.payload,
    };
  };
  return { fetchImpl, calls };
}

// Transport double for the myself GET. Separate from `catalogFetch` because the
// credential contract turns on `status` and on the RAW body text (which must be
// allowed to be non-JSON and non-English), not on a JSON payload.
function myselfFetch(
  response: { ok: boolean; status: number; body: string },
): { fetchImpl: FetchLike; calls: Array<{ input: string; init: Parameters<FetchLike>[1] }> } {
  const calls: Array<{ input: string; init: Parameters<FetchLike>[1] }> = [];
  const fetchImpl: FetchLike = async (input, init) => {
    calls.push({ input, init });
    return {
      ok: response.ok,
      status: response.status,
      text: async () => response.body,
      json: async () => JSON.parse(response.body) as unknown,
    };
  };
  return { fetchImpl, calls };
}

function buildClient(fetchImpl: FetchLike): JiraHttpClient {
  return new JiraHttpClient({
    baseUrl: "https://example.atlassian.net",
    email: "bot@example.com",
    apiToken: "token",
    fetchImpl,
  });
}

// WHEN getFields issues its request, the GET shall carry NO body key. Node's
// global fetch throws on a GET with any non-null body, so the no-body contract
// is load-bearing, not cosmetic.
test("getFields issues a GET with no request body", async () => {
  const transport = catalogFetch({ ok: true, status: 200, payload: [] });
  await buildClient(transport.fetchImpl).getFields();

  assert.strictEqual(transport.calls.length, 1);
  const { input, init } = transport.calls[0];
  assert.strictEqual(init.method, "GET");
  assert.strictEqual(init.body, undefined, "GET must omit the body");
  assert.ok(input.endsWith("/rest/api/3/field"), "hits the field-catalog path");
});

// WHEN the catalog responds with field records, getFields shall return the
// narrowed { id } list, dropping malformed entries (R24 — narrow from unknown).
test("getFields returns the narrowed { id } list from the catalog", async () => {
  const payload = [
    { id: "customfield_10031", name: "Entrega" },
    { id: "customfield_10065", name: "Vertical" },
    { name: "no-id-here" },
    "not-an-object",
    { id: 42 },
  ];
  const transport = catalogFetch({ ok: true, status: 200, payload });
  const fields = await buildClient(transport.fetchImpl).getFields();

  assert.deepStrictEqual(fields, [
    { id: "customfield_10031" },
    { id: "customfield_10065" },
  ]);
});

// WHEN the catalog response is non-OK, getFields shall throw (R4 — surfaced,
// not swallowed), mirroring searchJql's error contract.
test("getFields throws on a non-OK catalog response", async () => {
  const transport = catalogFetch({ ok: false, status: 403, payload: "Forbidden" });
  await assert.rejects(
    () => buildClient(transport.fetchImpl).getFields(),
    /Jira API error 403/,
  );
});

// WHEN the credentials are good, verifyCredentials shall resolve without
// inspecting the account record. A 200 is the entire success contract.
test("verifyCredentials resolves on a 200", async () => {
  const transport = myselfFetch({ ok: true, status: 200, body: '{"accountId":"abc"}' });
  await buildClient(transport.fetchImpl).verifyCredentials();
  assert.strictEqual(transport.calls.length, 1);
});

// WHEN Jira answers 401, verifyCredentials shall throw an error that names the
// CREDENTIAL as the cause. The negative assertion is the point of the task: the
// accidental guard this replaces said "customfield_XXXXX is not present in the
// Jira field catalog", sending the operator hunting field ids for a token bug.
test("verifyCredentials throws naming the credential on a 401", async () => {
  const transport = myselfFetch({
    ok: false,
    status: 401,
    body: '{"message":"Client must be authenticated to access this resource."}',
  });
  await assert.rejects(
    () => buildClient(transport.fetchImpl).verifyCredentials(),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /credentials/);
      assert.ok(
        !error.message.includes("customfield"),
        "must not send the operator hunting field ids for a credential problem",
      );
      return true;
    },
  );
});

// WHEN Jira answers 403 — a blocked or CAPTCHA-challenged account — that is
// still an operator credential problem and shall take the same branch as 401.
test("verifyCredentials throws naming the credential on a 403", async () => {
  const transport = myselfFetch({ ok: false, status: 403, body: "Forbidden" });
  await assert.rejects(
    () => buildClient(transport.fetchImpl).verifyCredentials(),
    /Jira rejected the configured credentials \(HTTP 403/,
  );
});

// WHEN the failure is not credential-shaped, verifyCredentials shall fall back
// to the generic error form the other two methods already use.
test("verifyCredentials throws the generic Jira API error form on a 500", async () => {
  const transport = myselfFetch({ ok: false, status: 500, body: "boom" });
  await assert.rejects(
    () => buildClient(transport.fetchImpl).verifyCredentials(),
    /Jira API error 500: boom/,
  );
});

// WHEN verifyCredentials issues its request, it shall be an authenticated GET to
// the myself path carrying NO body key — Node's global fetch throws on a GET
// with any non-null body, so the no-body contract is load-bearing.
test("verifyCredentials issues an authenticated GET with no request body", async () => {
  const transport = myselfFetch({ ok: true, status: 200, body: "{}" });
  await buildClient(transport.fetchImpl).verifyCredentials();

  assert.strictEqual(transport.calls.length, 1);
  const { input, init } = transport.calls[0];
  assert.strictEqual(init.method, "GET");
  assert.ok(!("body" in init), "GET must omit the body key entirely");
  assert.ok(input.endsWith("/rest/api/3/myself"), "hits the myself path");
  assert.match(init.headers.Authorization, /^Basic /);
});

// WHEN Jira answers 401 with a message in the operator's own locale, the thrown
// message shall still be the English credential message. This is the
// status-code-only contract under test rather than merely asserted in prose:
// Jira localizes its error bodies (a 400 came back in Chinese on 2026-08-09),
// so any guard keyed on message text breaks on the operator's locale.
test("verifyCredentials ignores a localized error body and still names the credential", async () => {
  const transport = myselfFetch({
    ok: false,
    status: 401,
    body: '{"errorMessages":["客户端必须经过身份验证才能访问此资源。"]}',
  });
  await assert.rejects(
    () => buildClient(transport.fetchImpl).verifyCredentials(),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /Jira rejected the configured credentials \(HTTP 401/);
      assert.match(error.message, /invalid, expired, or revoked/);
      return true;
    },
  );
});

// The rejection message this adapter has thrown since brief
// 2026-08-09-fetch-credential-guard, pinned as a literal. Written out in full
// rather than matched by pattern: the property under test is BYTE-IDENTITY, and
// a regex cannot fail on a word that quietly changed.
const REJECTION_401 =
  "Jira rejected the configured credentials (HTTP 401 on /rest/api/3/myself). " +
  "The email / API token pair is invalid, expired, or revoked.";

// Same construction as `buildClient`, plus the recorded expiry. A SECOND helper
// rather than a parameter on the first: the four pre-existing verifyCredentials
// tests must keep constructing the adapter exactly as they did before this
// field existed, which is what proves the field is optional in practice.
function buildClientWithExpiry(fetchImpl: FetchLike, credentialExpiry: string): JiraHttpClient {
  return new JiraHttpClient({
    baseUrl: "https://example.atlassian.net",
    email: "you@example.com",
    apiToken: "<a placeholder token>",
    fetchImpl,
    credentialExpiry,
  });
}

// WHEN no credentialExpiry is supplied, the credential-rejection message shall
// be byte-identical to the one thrown before the field existed (D4). An adapter
// constructed without it must be indistinguishable from the adapter that could
// not accept it.
test("a rejected credential with no recorded expiry throws the unchanged message", async () => {
  const transport = myselfFetch({ ok: false, status: 401, body: "{}" });
  await assert.rejects(
    () => buildClient(transport.fetchImpl).verifyCredentials(),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.strictEqual(error.message, REJECTION_401);
      return true;
    },
  );
});

// WHEN the composition root supplied the expiry it read from the credentials
// file, the same rejection shall append one sentence naming that date (D4). The
// adapter concatenates an opaque string: it parses nothing, compares nothing,
// and names no file path — there is one credentials file, and a second path in
// a message read once a year buys nothing.
test("a rejected credential with a recorded expiry names that date (D4)", async () => {
  const transport = myselfFetch({ ok: false, status: 401, body: "{}" });
  await assert.rejects(
    () => buildClientWithExpiry(transport.fetchImpl, "2027-08-19").verifyCredentials(),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.strictEqual(
        error.message,
        `${REJECTION_401} The credentials file records this token as expiring on 2027-08-19.`,
      );
      assert.ok(!error.message.includes("jira-credentials.json"), "no file path in the 401");
      return true;
    },
  );
});
