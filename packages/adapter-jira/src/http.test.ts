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
