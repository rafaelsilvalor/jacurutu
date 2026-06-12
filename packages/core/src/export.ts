// Pure export projection: Issue → flat record, profile filters, column
// selection (brief 023). No I/O, no clock, no fs, no network in this module
// (Judgment Flag 1); one row per issue, zero aggregation (Judgment Flag 2).

import type { Issue } from "./payload.js";
import { parseEntrega, parseVertical, slugNomeCurto } from "./transform.js";

/** Canonical column superset v1, ordered (023 D2). Snake_case English IDs. */
export const EXPORT_COLUMNS = [
  "key",
  "parent_key",
  "summary",
  "parent_summary",
  "vertical",
  "entrega_iso",
  "entrega_hora",
  "nome_curto",
  "task_filha_url",
  "task_pai_url",
  "copy_url",
  "copy_source",
  "status_jira",
  "jira_updated_at",
  "operator",
  "run_date",
  "generated_at",
] as const;

export type ExportColumnId = (typeof EXPORT_COLUMNS)[number];

/** One projected row: every superset column present, every value a string. */
export type ExportRecord = Record<ExportColumnId, string>;

/** Per-row provenance (D8) plus the injected Jira base URL (D2). */
export interface ExportContext {
  /** Operator label from the export-config root; `""` when absent (D8). */
  operator: string;
  /** Payload envelope `run_date` (`YYYY-MM-DD`). */
  runDate: string;
  /** Payload envelope `generated_at` (ISO with offset). */
  generatedAt: string;
  /** Jira instance base URL; when absent, URL columns project to `""` (D2). */
  jiraBaseUrl?: string;
}

/**
 * Browse URL for an issue key. The base URL is injected, never an instance
 * constant in core (D2; 020 D2 precedent). Trailing slashes are normalized
 * exactly like adapter-jira's http.ts. `""` when either part is missing —
 * the projection's null/absent → `""` contract.
 */
export function jiraBrowseUrl(baseUrl: string, key: string): string {
  if (!baseUrl || !key) {
    return "";
  }
  return `${baseUrl.replace(/\/+$/, "")}/browse/${key}`;
}

/** Project one `Issue` into the flat superset record (D2). Null/absent → `""`. */
export function projectIssue(issue: Issue, context: ExportContext): ExportRecord {
  const [entregaIso, entregaHora] = parseEntrega(issue.entrega_iso);
  const baseUrl = context.jiraBaseUrl ?? "";
  return {
    key: issue.key,
    parent_key: issue.parent_key,
    summary: issue.summary,
    parent_summary: issue.parent_summary,
    vertical: parseVertical(issue.vertical_raw),
    entrega_iso: entregaIso ?? "",
    entrega_hora: entregaHora,
    nome_curto: slugNomeCurto(issue.parent_summary, issue.summary),
    task_filha_url: jiraBrowseUrl(baseUrl, issue.key),
    task_pai_url: jiraBrowseUrl(baseUrl, issue.parent_key),
    copy_url: issue.copy_url ?? "",
    copy_source: issue.copy_source,
    status_jira: issue.status_jira,
    jira_updated_at: issue.jira_updated_at,
    operator: context.operator,
    run_date: context.runDate,
    generated_at: context.generatedAt,
  };
}

/** Optional profile filters (D3-filters). Absent filters export everything. */
export interface ExportFilters {
  /** `status_jira` values to keep; matched case-insensitively and trimmed. */
  status?: readonly string[];
  /** Inclusive `YYYY-MM-DD` window on the projected `entrega_iso`. */
  entrega?: { from?: string; to?: string };
}

/**
 * True when the projected record passes the profile filters (D3-filters).
 * Operates on the projected record, not the raw Issue, so the window compares
 * against the same `entrega_iso` value the export emits. An empty `status`
 * array is treated as "no status constraint" (default = export everything).
 */
export function matchesFilters(record: ExportRecord, filters?: ExportFilters): boolean {
  if (!filters) {
    return true;
  }
  if (filters.status && filters.status.length > 0) {
    const wanted = filters.status.map((s) => s.trim().toLowerCase());
    if (!wanted.includes(record.status_jira.trim().toLowerCase())) {
      return false;
    }
  }
  const window = filters.entrega;
  if (window && (window.from !== undefined || window.to !== undefined)) {
    const iso = record.entrega_iso;
    // A row without a delivery date cannot satisfy a date window (D3-filters).
    if (!iso) {
      return false;
    }
    // Lexicographic comparison is valid for YYYY-MM-DD; bounds are inclusive.
    if (window.from !== undefined && iso < window.from) {
      return false;
    }
    if (window.to !== undefined && iso > window.to) {
      return false;
    }
  }
  return true;
}

/** Profile column entry: a bare column id, or an id with an output header rename. */
export type ColumnSpec = string | { id: string; rename?: string };

/** Tabular result of applying a profile's column selection. */
export interface ColumnSelection {
  headers: string[];
  rows: string[][];
}

function isExportColumnId(id: string): id is ExportColumnId {
  return (EXPORT_COLUMNS as readonly string[]).includes(id);
}

/**
 * Select, order, and rename columns from projected records (D3). Selection /
 * order / rename ONLY — no computed columns, no expressions. Unknown ids
 * throw: a typo'd profile must fail loudly, not emit an empty column.
 */
export function applyColumns(
  records: readonly ExportRecord[],
  columns: readonly ColumnSpec[],
): ColumnSelection {
  const resolved = columns.map((spec) => {
    const { id, rename } =
      typeof spec === "string" ? { id: spec, rename: undefined } : spec;
    if (!isExportColumnId(id)) {
      throw new Error(`Unknown export column id: "${id}"`);
    }
    return { id, rename };
  });
  const headers = resolved.map(({ id, rename }) => rename ?? id);
  const rows = records.map((record) => resolved.map(({ id }) => record[id]));
  return { headers, rows };
}
