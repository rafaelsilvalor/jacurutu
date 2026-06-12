import { test } from "node:test";
import assert from "node:assert";

import {
  EXPORT_COLUMNS,
  applyColumns,
  jiraBrowseUrl,
  matchesFilters,
  projectIssue,
} from "./export.js";
import type { ExportContext, ExportRecord } from "./export.js";
import type { Issue } from "./payload.js";

// Fully populated fixture: every nullable field carries a value, so the full
// projection asserts all 17 superset columns at once (023 D2).
const FIXTURE_ISSUE: Issue = {
  key: "MCA-12345",
  summary: "Artes - Criativos Estaticos | Concurso TJ SP",
  parent_key: "MC-1000",
  parent_summary: "[EC] Concurso TJ SP - Edital Publicado",
  status_jira: "FILA DE EXECUCAO",
  vertical_raw: "[EC] Concursos",
  entrega_iso: "2026-06-10T19:30:00.000-0300",
  copy_url: "https://docs.google.com/document/d/abc123",
  copy_source: "sister",
  jira_updated_at: "2026-06-09T08:15:22.000-0300",
};

const CONTEXT: ExportContext = {
  operator: "ana",
  runDate: "2026-06-10",
  generatedAt: "2026-06-10T12:00:00-03:00",
  jiraBaseUrl: "https://jira.example.com",
};

function projectFixture(overrides: Partial<ExportRecord> = {}): ExportRecord {
  return { ...projectIssue(FIXTURE_ISSUE, CONTEXT), ...overrides };
}

test("projectIssue maps a fully populated Issue to all 17 columns", () => {
  const record = projectIssue(FIXTURE_ISSUE, CONTEXT);
  assert.deepStrictEqual(record, {
    key: "MCA-12345",
    parent_key: "MC-1000",
    summary: "Artes - Criativos Estaticos | Concurso TJ SP",
    parent_summary: "[EC] Concurso TJ SP - Edital Publicado",
    vertical: "EC",
    entrega_iso: "2026-06-10",
    entrega_hora: "19h30",
    nome_curto: "tj-sp-publicado",
    task_filha_url: "https://jira.example.com/browse/MCA-12345",
    task_pai_url: "https://jira.example.com/browse/MC-1000",
    copy_url: "https://docs.google.com/document/d/abc123",
    copy_source: "sister",
    status_jira: "FILA DE EXECUCAO",
    jira_updated_at: "2026-06-09T08:15:22.000-0300",
    operator: "ana",
    run_date: "2026-06-10",
    generated_at: "2026-06-10T12:00:00-03:00",
  });
});

test("projected record key order matches EXPORT_COLUMNS", () => {
  // CSV/JSON writers iterate the record; key order must be the superset order.
  const record = projectIssue(FIXTURE_ISSUE, CONTEXT);
  assert.deepStrictEqual(Object.keys(record), [...EXPORT_COLUMNS]);
});

test("null entrega_iso and copy_url project to empty strings", () => {
  const issue: Issue = { ...FIXTURE_ISSUE, entrega_iso: null, copy_url: null };
  const record = projectIssue(issue, CONTEXT);
  assert.strictEqual(record.entrega_iso, "");
  assert.strictEqual(record.entrega_hora, "");
  assert.strictEqual(record.copy_url, "");
});

test("URL columns project to empty strings when jiraBaseUrl is absent", () => {
  const context: ExportContext = { ...CONTEXT, jiraBaseUrl: undefined };
  const record = projectIssue(FIXTURE_ISSUE, context);
  assert.strictEqual(record.task_filha_url, "");
  assert.strictEqual(record.task_pai_url, "");
});

test("task_pai_url is empty when the issue has no parent", () => {
  const issue: Issue = { ...FIXTURE_ISSUE, parent_key: "" };
  const record = projectIssue(issue, CONTEXT);
  assert.strictEqual(record.task_pai_url, "");
  assert.strictEqual(record.task_filha_url, "https://jira.example.com/browse/MCA-12345");
});

test("jiraBrowseUrl normalizes trailing slashes on the base URL", () => {
  assert.strictEqual(
    jiraBrowseUrl("https://jira.example.com", "MCA-1"),
    "https://jira.example.com/browse/MCA-1",
  );
  assert.strictEqual(
    jiraBrowseUrl("https://jira.example.com/", "MCA-1"),
    "https://jira.example.com/browse/MCA-1",
  );
  assert.strictEqual(
    jiraBrowseUrl("https://jira.example.com///", "MCA-1"),
    "https://jira.example.com/browse/MCA-1",
  );
});

test("jiraBrowseUrl returns empty string when base URL or key is missing", () => {
  assert.strictEqual(jiraBrowseUrl("", "MCA-1"), "");
  assert.strictEqual(jiraBrowseUrl("https://jira.example.com", ""), "");
});

test("status filter matches case-insensitively and trimmed on both sides", () => {
  const record = projectFixture({ status_jira: "  Fila de Execucao " });
  assert.strictEqual(
    matchesFilters(record, { status: ["  fila de execucao  "] }),
    true,
  );
  assert.strictEqual(
    matchesFilters(record, { status: ["EM EXECUCAO", "ENTREGUE"] }),
    false,
  );
});

test("empty status array applies no status constraint", () => {
  // Mentor rider (a): `status: []` means "no filter", not "match nothing".
  const record = projectFixture();
  assert.strictEqual(matchesFilters(record, { status: [] }), true);
});

test("absent filters export everything", () => {
  const record = projectFixture();
  assert.strictEqual(matchesFilters(record), true);
  assert.strictEqual(matchesFilters(record, {}), true);
  // No window set: an empty entrega_iso is not excluded.
  assert.strictEqual(matchesFilters(projectFixture({ entrega_iso: "" }), {}), true);
});

test("entrega window bounds are inclusive", () => {
  const record = projectFixture(); // entrega_iso = "2026-06-10"
  assert.strictEqual(
    matchesFilters(record, { entrega: { from: "2026-06-10", to: "2026-06-10" } }),
    true,
  );
  assert.strictEqual(
    matchesFilters(record, { entrega: { from: "2026-06-11", to: "2026-06-30" } }),
    false,
  );
  assert.strictEqual(
    matchesFilters(record, { entrega: { from: "2026-06-01", to: "2026-06-09" } }),
    false,
  );
});

test("entrega window with only `from` is inclusive at the lower bound", () => {
  // Mentor rider (c): each window end is independently optional.
  const record = projectFixture();
  assert.strictEqual(matchesFilters(record, { entrega: { from: "2026-06-10" } }), true);
  assert.strictEqual(matchesFilters(record, { entrega: { from: "2026-06-11" } }), false);
});

test("entrega window with only `to` is inclusive at the upper bound", () => {
  // Mentor rider (c): each window end is independently optional.
  const record = projectFixture();
  assert.strictEqual(matchesFilters(record, { entrega: { to: "2026-06-10" } }), true);
  assert.strictEqual(matchesFilters(record, { entrega: { to: "2026-06-09" } }), false);
});

test("entrega window excludes records with empty entrega_iso", () => {
  const record = projectFixture({ entrega_iso: "" });
  assert.strictEqual(matchesFilters(record, { entrega: { from: "2026-01-01" } }), false);
  assert.strictEqual(matchesFilters(record, { entrega: { to: "2026-12-31" } }), false);
});

test("applyColumns selects and orders columns from the superset", () => {
  const records = [projectFixture()];
  const selection = applyColumns(records, ["summary", "key", "entrega_iso"]);
  assert.deepStrictEqual(selection.headers, ["summary", "key", "entrega_iso"]);
  assert.deepStrictEqual(selection.rows, [
    ["Artes - Criativos Estaticos | Concurso TJ SP", "MCA-12345", "2026-06-10"],
  ]);
});

test("applyColumns renames headers without touching row values", () => {
  const records = [projectFixture()];
  const selection = applyColumns(records, [
    { id: "key", rename: "Issue Key" },
    "vertical",
    { id: "entrega_iso" },
  ]);
  assert.deepStrictEqual(selection.headers, ["Issue Key", "vertical", "entrega_iso"]);
  assert.deepStrictEqual(selection.rows, [["MCA-12345", "EC", "2026-06-10"]]);
});

test("applyColumns throws on an unknown column id, naming the offending id", () => {
  // Mentor rider (b): a typo'd profile fails loudly and the message says where.
  const records = [projectFixture()];
  assert.throws(
    () => applyColumns(records, ["key", "no_such_column"]),
    /no_such_column/,
  );
  assert.throws(
    () => applyColumns(records, [{ id: "also_unknown", rename: "X" }]),
    /also_unknown/,
  );
});
