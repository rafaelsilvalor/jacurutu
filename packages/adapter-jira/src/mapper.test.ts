import { test } from "node:test";
import assert from "node:assert";

import { buildIssueEntry, type IssueWarningLog } from "./mapper.js";

// Field ids are injected by the caller (D1 — no customfield_* literal lives in
// this module). The tests pass arbitrary ids to confirm the mapping logic, not
// the real Jira ids.
const MAPPING = {
  entregaCandidates: ["entregaFirstField", "entregaSecondField"],
  vertical: "verticalField",
};

const DRIVE_URL = "https://drive.google.com/file/d/sister456/view";
const PARENT_KEY = "MCA-100";

// A logger that records each call, so partial-failure logging is asserted
// instead of swallowed (R4 — no silent catch).
function recordingLog(): { calls: Array<[string, string, string]>; log: IssueWarningLog } {
  const calls: Array<[string, string, string]> = [];
  const log: IssueWarningLog = (key, field, cause) => {
    calls.push([key, field, cause]);
  };
  return { calls, log };
}

const NO_SISTERS = new Map<string, never[]>();
const NO_PARENTS = new Map<string, never>();

// --- keyless drop -----------------------------------------------------------

test("keyless issue is dropped (returns null)", () => {
  const result = buildIssueEntry({ fields: { summary: "x" } }, NO_SISTERS, NO_PARENTS, MAPPING);
  assert.strictEqual(result, null);
});

test("non-record issue is dropped (returns null)", () => {
  assert.strictEqual(buildIssueEntry(null, NO_SISTERS, NO_PARENTS, MAPPING), null);
  assert.strictEqual(buildIssueEntry("MCA-1", NO_SISTERS, NO_PARENTS, MAPPING), null);
});

// --- `or ""` string defaults ------------------------------------------------

test("absent string fields default to empty string (seed `or \"\"`)", () => {
  const { calls, log } = recordingLog();
  const result = buildIssueEntry({ key: "MCA-1" }, NO_SISTERS, NO_PARENTS, MAPPING, log);
  assert.ok(result);
  assert.strictEqual(result.key, "MCA-1");
  assert.strictEqual(result.summary, "");
  assert.strictEqual(result.parent_key, "");
  assert.strictEqual(result.parent_summary, "");
  assert.strictEqual(result.status_jira, "");
  assert.strictEqual(result.vertical_raw, "");
  assert.strictEqual(result.jira_updated_at, "");
  // Missing parent is logged, not swallowed (R4).
  assert.deepStrictEqual(calls, [["MCA-1", "parent_key", "issue has no parent"]]);
});

test("present string fields are carried through", () => {
  const result = buildIssueEntry(
    {
      key: "MCA-1",
      fields: {
        summary: "Banner concurso INSS",
        status: { name: "FILA DE EXECUCAO" },
        updated: "2026-06-01T12:00:00.000-0300",
        parent: { key: PARENT_KEY, fields: { summary: "Parent concurso" } },
      },
    },
    NO_SISTERS,
    NO_PARENTS,
    MAPPING,
  );
  assert.ok(result);
  assert.strictEqual(result.summary, "Banner concurso INSS");
  assert.strictEqual(result.status_jira, "FILA DE EXECUCAO");
  assert.strictEqual(result.parent_key, PARENT_KEY);
  assert.strictEqual(result.parent_summary, "Parent concurso");
  assert.strictEqual(result.jira_updated_at, "2026-06-01T12:00:00.000-0300");
});

// --- vertical_raw -----------------------------------------------------------

test("vertical_raw reads the injected vertical field, defaulting to empty", () => {
  const present = buildIssueEntry(
    { key: "MCA-1", fields: { verticalField: [{ value: "[EC] Concursos" }] } },
    NO_SISTERS,
    NO_PARENTS,
    MAPPING,
  );
  assert.strictEqual(present?.vertical_raw, "[EC] Concursos");

  const absent = buildIssueEntry({ key: "MCA-2" }, NO_SISTERS, NO_PARENTS, MAPPING);
  assert.strictEqual(absent?.vertical_raw, "");
});

// --- entrega_iso bare nullable + candidate-order resolution -----------------

test("entrega_iso is null when no candidate is present (bare nullable)", () => {
  const result = buildIssueEntry({ key: "MCA-1" }, NO_SISTERS, NO_PARENTS, MAPPING);
  assert.strictEqual(result?.entrega_iso, null);
});

test("entrega_iso reads the first candidate when present", () => {
  const result = buildIssueEntry(
    { key: "MCA-1", fields: { entregaFirstField: "2026-06-10T00:00:00.000-0300" } },
    NO_SISTERS,
    NO_PARENTS,
    MAPPING,
  );
  assert.strictEqual(result?.entrega_iso, "2026-06-10T00:00:00.000-0300");
});

test("entrega_iso reads a later candidate when the first is absent", () => {
  const result = buildIssueEntry(
    { key: "MCA-1", fields: { entregaSecondField: "2026-06-11T00:00:00.000-0300" } },
    NO_SISTERS,
    NO_PARENTS,
    MAPPING,
  );
  assert.strictEqual(result?.entrega_iso, "2026-06-11T00:00:00.000-0300");
});

// --- copy_url / copy_source provenance --------------------------------------

test("copy resolves to sister provenance via core policy", () => {
  const design = {
    key: "MCA-1",
    fields: { summary: "Banner concurso INSS", parent: { key: PARENT_KEY } },
  };
  const sister = {
    key: "MCA-2",
    fields: {
      summary: "Copy concurso INSS",
      description: { type: "doc", content: [{ type: "inlineCard", attrs: { url: DRIVE_URL } }] },
    },
  };
  const result = buildIssueEntry(
    design,
    new Map([[PARENT_KEY, [sister]]]),
    NO_PARENTS,
    MAPPING,
  );
  assert.strictEqual(result?.copy_url, DRIVE_URL);
  assert.strictEqual(result?.copy_source, "sister");
});

test("copy resolves to fallback null when no URL is found (bare nullable)", () => {
  const result = buildIssueEntry(
    { key: "MCA-1", fields: { summary: "Banner concurso INSS", parent: { key: PARENT_KEY } } },
    NO_SISTERS,
    NO_PARENTS,
    MAPPING,
  );
  assert.strictEqual(result?.copy_url, null);
  assert.strictEqual(result?.copy_source, "fallback");
});

// --- partial-failure logging (R4, D3) ---------------------------------------

test("a vertical extraction failure is logged, not swallowed; entry survives", () => {
  const { calls, log } = recordingLog();
  // A getter that throws drives safeGetVertical into the catch path.
  const fields: Record<string, unknown> = {
    summary: "Banner",
    parent: { key: PARENT_KEY },
  };
  Object.defineProperty(fields, "verticalField", {
    enumerable: true,
    get() {
      throw new Error("boom");
    },
  });
  const result = buildIssueEntry({ key: "MCA-1", fields }, NO_SISTERS, NO_PARENTS, MAPPING, log);
  assert.ok(result, "entry is kept despite the partial failure");
  assert.strictEqual(result.vertical_raw, "");
  const verticalCall = calls.find((c) => c[1] === "vertical_raw");
  assert.ok(verticalCall, "the vertical failure was logged");
  assert.strictEqual(verticalCall?.[2], "boom");
});
