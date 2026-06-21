import { test } from "node:test";
import assert from "node:assert";

import type { Issue } from "@saci/core";

import { JiraGateway, type IssueDropLog } from "./gateway.js";
import type { FetchLike } from "./http.js";
import type { IssueWarningLog } from "./mapper.js";
import {
  MAIN_SEARCH_RESPONSE,
  SISTER_SEARCH_RESPONSE,
  PARENT_SEARCH_RESPONSE,
  MAIN_PAGE_1,
  MAIN_PAGE_2,
  MAIN_PAGE_TOKEN,
  SISTER_DRIVE_URL,
  PARENT_DRIVE_URL,
  type RecordedSearchResponse,
} from "./fixtures/jira-responses.js";

// Fixture-backed transport: dispatch by the JQL in the request body, so the
// gateway's three searches (main / sister / parent) each receive their recorded
// page. ZERO network — this FetchLike never touches the wire (R23, D4). It also
// records the requested JQLs so the searches can be asserted.
function fixtureFetch(): { fetchImpl: FetchLike; jqls: string[]; mainFields: string[] } {
  const jqls: string[] = [];
  const capture = { mainFields: [] as string[] };
  const fetchImpl: FetchLike = async (_input, init) => {
    const body = JSON.parse(init.body) as { jql: string; fields: string[] };
    jqls.push(body.jql);
    let response: RecordedSearchResponse;
    if (body.jql.includes("issuetype = COPYWRITER")) {
      response = SISTER_SEARCH_RESPONSE;
    } else if (body.jql.startsWith("key IN")) {
      response = PARENT_SEARCH_RESPONSE;
    } else {
      capture.mainFields = body.fields;
      response = MAIN_SEARCH_RESPONSE;
    }
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify(response),
      json: async () => response,
    };
  };
  return {
    fetchImpl,
    jqls,
    get mainFields() {
      return capture.mainFields;
    },
  };
}

// Records every drop and warning so the LOGGED-not-serialized contract (D3, R4)
// is asserted directly on the injected sinks.
function recordingSinks(): {
  drops: Array<[string, string]>;
  warnings: Array<[string, string, string]>;
  dropLog: IssueDropLog;
  warningLog: IssueWarningLog;
} {
  const drops: Array<[string, string]> = [];
  const warnings: Array<[string, string, string]> = [];
  return {
    drops,
    warnings,
    dropLog: (key, reason) => drops.push([key, reason]),
    warningLog: (key, field, cause) => warnings.push([key, field, cause]),
  };
}

const MAIN_JQL = 'project = MCA AND issuetype = "Design"';

function buildGateway() {
  const transport = fixtureFetch();
  const sinks = recordingSinks();
  const gateway = new JiraGateway({
    baseUrl: "https://example.atlassian.net",
    email: "bot@example.com",
    apiToken: "token",
    mainJql: MAIN_JQL,
    fetchImpl: transport.fetchImpl,
    dropLog: sinks.dropLog,
    warningLog: sinks.warningLog,
  });
  return { gateway, transport, sinks };
}

function byKey(issues: Issue[]): Map<string, Issue> {
  return new Map(issues.map((i) => [i.key, i]));
}

// WHEN a design issue has a sister copywriter with a Drive URL in its
// description, the gateway shall resolve copy_source = "sister" with that URL.
test("resolves copy_source 'sister' from a sister description Drive URL", async () => {
  const { gateway } = buildGateway();
  const issues = byKey(await gateway.fetchIssues());
  const issue = issues.get("MCA-1001");
  assert.ok(issue);
  assert.strictEqual(issue.copy_source, "sister");
  assert.strictEqual(issue.copy_url, SISTER_DRIVE_URL);
});

// WHEN a design issue has no matching sister but its parent description carries
// a Drive URL, the gateway shall resolve copy_source = "parent".
test("resolves copy_source 'parent' from the parent description Drive URL", async () => {
  const { gateway } = buildGateway();
  const issues = byKey(await gateway.fetchIssues());
  const issue = issues.get("MCA-2001");
  assert.ok(issue);
  assert.strictEqual(issue.copy_source, "parent");
  assert.strictEqual(issue.copy_url, PARENT_DRIVE_URL);
});

// WHEN neither a sister nor a parent yields a Drive URL, the gateway shall
// resolve copy_url = null, copy_source = "fallback".
test("resolves copy_source 'fallback' with null url when no Drive URL exists", async () => {
  const { gateway } = buildGateway();
  const issues = byKey(await gateway.fetchIssues());
  const issue = issues.get("MCA-3001");
  assert.ok(issue);
  assert.strictEqual(issue.copy_source, "fallback");
  assert.strictEqual(issue.copy_url, null);
});

// WHEN multiple sister candidates exist, the gateway shall select the highest
// token-overlap candidate (core bestMatchByTokenOverlap).
test("selects the highest token-overlap sister among multiple candidates", async () => {
  const { gateway } = buildGateway();
  const issues = byKey(await gateway.fetchIssues());
  const issue = issues.get("MCA-4001");
  assert.ok(issue);
  // The matching sister (MCA-4003, "edital prefeitura saude municipal") carries
  // SISTER_DRIVE_URL; the decoy (MCA-4002) shares no token with the design.
  assert.strictEqual(issue.copy_source, "sister");
  assert.strictEqual(issue.copy_url, SISTER_DRIVE_URL);
});

// WHEN an issue's status is in the filtered set, OR "template" appears in its
// own or parent summary, the gateway shall exclude it and LOG the drop.
test("drops a filtered-status issue and logs the drop", async () => {
  const { gateway, sinks } = buildGateway();
  const issues = byKey(await gateway.fetchIssues());
  assert.strictEqual(issues.has("MCA-5001"), false);
  const drop = sinks.drops.find((d) => d[0] === "MCA-5001");
  assert.ok(drop, "the Backlog drop was logged on the injected sink");
  assert.strictEqual(drop[1], "Backlog");
});

test("drops a Template-parent issue and logs the drop", async () => {
  const { gateway, sinks } = buildGateway();
  const issues = byKey(await gateway.fetchIssues());
  assert.strictEqual(issues.has("MCA-5002"), false);
  const drop = sinks.drops.find((d) => d[0] === "MCA-5002");
  assert.ok(drop, "the Template drop was logged on the injected sink");
  assert.match(drop[1], /Template/);
});

// WHEN customfield_10031 is absent but customfield_11080 is present, the gateway
// shall set entrega_iso from the fallback field.
test("reads entrega_iso from the customfield_11080 fallback field", async () => {
  const { gateway } = buildGateway();
  const issues = byKey(await gateway.fetchIssues());
  const issue = issues.get("MCA-6001");
  assert.ok(issue);
  assert.strictEqual(issue.entrega_iso, "2026-06-09T00:00:00.000-0300");
});

// WHEN no field mapping override is supplied, the gateway shall request exactly
// the derived design fields — MANDATORY ∪ entregaCandidates ∪ [vertical], deduped
// — and NOT the dead customfield_11035 / customfield_10067 the seed once sent.
test("requests the derived design field set, not the dead seed fields", async () => {
  const { gateway, transport } = buildGateway();
  await gateway.fetchIssues();
  assert.deepStrictEqual(transport.mainFields, [
    "summary",
    "status",
    "parent",
    "updated",
    "customfield_10031",
    "customfield_11080",
    "customfield_10065",
  ]);
  assert.ok(!transport.mainFields.includes("customfield_11035"), "dead field 11035 is not requested");
  assert.ok(!transport.mainFields.includes("customfield_10067"), "dead field 10067 is not requested");
});

// WHILE a per-issue extraction fails (here: a missing parent), the gateway shall
// KEEP the issue with fallback values and LOG the warning (no warnings array).
test("keeps a partial-failure issue with fallback values and logs the warning", async () => {
  const { gateway, sinks } = buildGateway();
  const issues = byKey(await gateway.fetchIssues());
  const issue = issues.get("MCA-7001");
  assert.ok(issue, "the partial-failure issue is kept, not dropped");
  assert.strictEqual(issue.parent_key, "");
  assert.strictEqual(issue.copy_source, "fallback");
  const warning = sinks.warnings.find((w) => w[0] === "MCA-7001" && w[1] === "parent_key");
  assert.ok(warning, "the missing-parent warning was logged on the injected sink");
});

// End-to-end: fetchIssues() returns the kept Issue[] in payload-v2.0 shape,
// matching the Python on the same input (the two dropped issues excluded).
test("fetchIssues returns the kept Issue[] in payload-v2.0 shape", async () => {
  const { gateway, transport } = buildGateway();
  const issues = await gateway.fetchIssues();

  // Two issues dropped (Backlog + Template); six kept.
  assert.deepStrictEqual(
    issues.map((i) => i.key).sort(),
    ["MCA-1001", "MCA-2001", "MCA-3001", "MCA-4001", "MCA-6001", "MCA-7001"],
  );

  // Every kept entry carries the full payload-v2.0 field set with the seed's
  // nullability contract (strings non-null; entrega_iso/copy_url bare nullable).
  const fieldKeys: Array<keyof Issue> = [
    "key",
    "summary",
    "parent_key",
    "parent_summary",
    "status_jira",
    "vertical_raw",
    "entrega_iso",
    "copy_url",
    "copy_source",
    "jira_updated_at",
  ];
  for (const issue of issues) {
    assert.deepStrictEqual(Object.keys(issue).sort(), [...fieldKeys].sort());
    for (const k of ["summary", "parent_key", "parent_summary", "status_jira", "vertical_raw", "jira_updated_at"] as const) {
      assert.strictEqual(typeof issue[k], "string", `${k} is a non-null string`);
    }
    assert.ok(["sister", "parent", "fallback"].includes(issue.copy_source));
  }

  // The first kept issue matches the seed's resolved values exactly.
  const first = byKey(issues).get("MCA-1001");
  assert.deepStrictEqual(first, {
    key: "MCA-1001",
    summary: "Artes - Banner concurso INSS analista tributario",
    parent_key: "MCA-1000",
    // The mapper reads parent_summary from the design issue's inline parent
    // (fields.parent.fields.summary), like the seed's build_issue_entry. The new
    // JQL endpoint omits the inline parent summary, so it is "" here; the
    // separate parent search feeds only the Template filter, not the payload.
    parent_summary: "",
    status_jira: "FILA DE EXECUCAO",
    vertical_raw: "[EC] Concursos",
    entrega_iso: "2026-06-05T00:00:00.000-0300",
    copy_url: SISTER_DRIVE_URL,
    copy_source: "sister",
    jira_updated_at: "2026-06-01T12:00:00.000-0300",
  });

  // The main, sister, and parent searches each ran exactly once (no network).
  assert.strictEqual(transport.jqls.filter((j) => j === MAIN_JQL).length, 1);
  assert.strictEqual(transport.jqls.filter((j) => j.includes("issuetype = COPYWRITER")).length, 1);
  assert.strictEqual(transport.jqls.filter((j) => j.startsWith("key IN")).length, 1);
});

// Paginating transport double: the MAIN search spans two pages. Page 1 (no
// nextPageToken in the request) carries issue A and a cursor; page 2 (request
// echoes that cursor) carries issue B and isLast. Sister/parent searches stay
// single-page. Counts every MAIN call so the loop's exactly-twice and
// terminate-on-isLast guarantees can be asserted (no infinite loop).
function paginatingFetch(): { fetchImpl: FetchLike; mainCalls: number } {
  const counter = { mainCalls: 0 };
  const fetchImpl: FetchLike = async (_input, init) => {
    const body = JSON.parse(init.body) as { jql: string; nextPageToken?: string };
    let response: RecordedSearchResponse;
    if (body.jql.includes("issuetype = COPYWRITER")) {
      response = SISTER_SEARCH_RESPONSE;
    } else if (body.jql.startsWith("key IN")) {
      response = PARENT_SEARCH_RESPONSE;
    } else {
      counter.mainCalls += 1;
      // The second page is returned ONLY when the request carries the page-1
      // cursor; without it the double must serve page 1 (guards against the
      // loop skipping the cursor round-trip).
      response = body.nextPageToken === MAIN_PAGE_TOKEN ? MAIN_PAGE_2 : MAIN_PAGE_1;
    }
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify(response),
      json: async () => response,
    };
  };
  return {
    fetchImpl,
    get mainCalls() {
      return counter.mainCalls;
    },
  };
}

// WHEN a search exceeds a single page, the gateway shall follow nextPageToken,
// accumulate every page, and terminate on isLast (no infinite loop). This is the
// only test exercising the http.ts cursor loop, which runs in production
// whenever a search returns more than one page.
test("follows nextPageToken across pages and terminates on isLast", async () => {
  const transport = paginatingFetch();
  const sinks = recordingSinks();
  const gateway = new JiraGateway({
    baseUrl: "https://example.atlassian.net",
    email: "bot@example.com",
    apiToken: "token",
    mainJql: MAIN_JQL,
    fetchImpl: transport.fetchImpl,
    dropLog: sinks.dropLog,
    warningLog: sinks.warningLog,
  });

  const issues = byKey(await gateway.fetchIssues());

  // Both pages accumulated: issue A (page 1) and issue B (page 2) are returned.
  assert.ok(issues.get("MCA-8001"), "page-1 issue A is present (cursor followed)");
  assert.ok(issues.get("MCA-8002"), "page-2 issue B is present (pages accumulated)");

  // The loop terminated on isLast after exactly two MAIN transport calls — it
  // did not stop after page 1, and it did not spin past the last page.
  assert.strictEqual(transport.mainCalls, 2, "MAIN search ran exactly twice");
});
