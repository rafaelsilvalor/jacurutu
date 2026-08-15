// Pure human-facing display layer for the `saci` CLI (brief 028). It maps the
// values runFetch (a Payload) and runExport (an ExportRunResult) already return
// to plain, aligned strings. No process, no stdout/stderr, no fs, no clock, no
// network (D3 purity): cli.ts owns the write. Plain text only, no color, no
// table/color dependency (D4). The displayed fetch columns are a declared id
// list referencing payload / EXPORT_COLUMNS ids (D2), so adding or removing a
// column is editing one list, not rewriting the formatter.

import type { ExportColumnId, Payload } from "@saci/core";
import type { ExportRunResult } from "./run-export.js";
import type { ReportRunResult } from "./run-report.js";
import type { StartRunResult } from "./run-start.js";

/**
 * The human-relevant fetch columns, declared as a list (D2). Each `id` is a
 * payload `Issue` field that is also an EXPORT_COLUMNS id; `header` is the
 * displayed label (R7). The displayed subset is all plain payload fields, so
 * the formatter reads them directly off the Issue (JC1 forward-constraint:
 * derived/projected columns stay out of this path until fetch carries an
 * ExportContext — do not synthesize one here). The `satisfies ExportColumnId`
 * clause anchors every id to the canonical column superset at compile time.
 */
const FETCH_COLUMNS = [
  { id: "key", header: "KEY" },
  { id: "status_jira", header: "STATUS" },
  { id: "entrega_iso", header: "DELIVERY" },
  { id: "parent_summary", header: "SUMMARY" },
] as const satisfies readonly { id: ExportColumnId; header: string }[];

/** The `Issue` keys the fetch listing reads — the declared column ids (D2). */
type FetchFieldId = (typeof FETCH_COLUMNS)[number]["id"];

/** Placeholder for a null/empty cell — never the literal string "null" (S2). */
const EMPTY_CELL = "—";
/** Gap between aligned columns (S1). */
const COLUMN_GAP = "  ";
/** Shown instead of a listing when no issues matched (S5). */
const EMPTY_STATE = "No issues matched.";
/** Trailing newline appended to every rendered block; cli.ts writes verbatim. */
const TRAILING_NEWLINE = "\n";

/**
 * Render one cell value from an Issue field. The two bare-nullable fields
 * (`entrega_iso`, `copy_url`) and any empty string render as the placeholder,
 * so a missing value never shows as a blank gap or the literal "null" (S2/S5).
 */
function renderCell(value: string | null): string {
  return value ? value : EMPTY_CELL;
}

/** Compute each column's display width from its header and rendered cells. */
function columnWidths(headers: string[], rows: string[][]): number[] {
  return headers.map((header, col) => {
    const cellMax = rows.reduce((max, row) => Math.max(max, row[col].length), 0);
    return Math.max(header.length, cellMax);
  });
}

/** Pad every cell to its column width and join with the gap (S1). */
function padRow(cells: string[], widths: number[]): string {
  return cells.map((cell, col) => cell.padEnd(widths[col])).join(COLUMN_GAP).trimEnd();
}

/** Build the aligned header + per-issue listing for a non-empty payload (S1). */
function renderListing(payload: Payload): string {
  const headers = FETCH_COLUMNS.map((column) => column.header);
  const ids: FetchFieldId[] = FETCH_COLUMNS.map((column) => column.id);
  const rows = payload.issues.map((issue) => ids.map((id) => renderCell(issue[id])));
  const widths = columnWidths(headers, rows);
  return [padRow(headers, widths), ...rows.map((row) => padRow(row, widths))].join("\n");
}

/**
 * One summary line after the listing (S3): the included-issue count, the
 * non-zero filtered-out and warning counts (S6 — counts, not row dumps), and
 * the resolved output path. The bare 026 line is subsumed here; the count and
 * the path remain present so no information is lost.
 */
function renderSummary(payload: Payload, outputPath: string): string {
  const parts = [`${payload.issues.length} issues`];
  if (payload.filtered_out.length > 0) {
    parts.push(`${payload.filtered_out.length} filtered out`);
  }
  if (payload.warnings.length > 0) {
    parts.push(`${payload.warnings.length} warnings`);
  }
  return `${parts.join(", ")} → ${outputPath}`;
}

/**
 * Render the full `fetch` status string from the Payload runFetch returns.
 * Empty `issues` yields the named empty-state line plus the path note (S5),
 * never a blank listing or a bare `wrote 0 issues`.
 */
export function renderFetch(payload: Payload, outputPath: string): string {
  const body =
    payload.issues.length === 0
      ? EMPTY_STATE
      : renderListing(payload);
  return `${body}\n${renderSummary(payload, outputPath)}${TRAILING_NEWLINE}`;
}

/**
 * Render the `export` confirmation from the ExportRunResult runExport returns
 * (S4). Single readable line carrying rowCount, outputPath, and format —
 * including the rowCount === 0 case, which is stated explicitly, not hidden.
 */
export function renderExport(result: ExportRunResult): string {
  return `wrote ${result.rowCount} rows to ${result.outputPath} (${result.format})${TRAILING_NEWLINE}`;
}

/**
 * The share clause of the report line. Three outcomes, but FOUR renderings: a run
 * that requested no share reads differently depending on whether it created the
 * report. On a creating run the operator needs to know the report is private to
 * them; on a refresh, sharing was never in question (D3 confines it to creation),
 * so the line says nothing about it rather than offering advice that cannot be
 * acted on for a report that already exists.
 */
function renderShare(result: ReportRunResult): string {
  switch (result.share) {
    case "granted":
      return "; shared as reader with the address you gave";
    case "skipped-existing":
      return "; not shared — --share-with applies only to the run that creates the report";
    case "not-requested":
      return result.created ? "; not shared, so only you can open it" : "";
  }
}

/**
 * Render the `report` confirmation from the ReportRunResult runReport returns: one
 * line carrying created-or-updated, the spreadsheet id, the row count, and the share
 * outcome.
 *
 * The id is printed because it is the only handle the operator has on the report —
 * composing a Google URL out of it was never measured, so this layer does not invent
 * one. The recipient address is never printed: it is a personal identifier, and a
 * result line is a log line waiting to happen (brief constraint 2).
 */
export function renderReport(result: ReportRunResult): string {
  const verb = result.created ? "Created" : "Updated";
  const opening = `${verb} report ${result.spreadsheetId} with ${result.rowCount} rows`;
  return `${opening}${renderShare(result)}.${TRAILING_NEWLINE}`;
}

/**
 * Render the `start` confirmation from the StartRunResult runStart returns. Paths
 * only — the created folder and the editable dir (D3: no "open" affordance). A
 * non-null `copiedFile` names the applied template; a null one is the --blank
 * path, stated explicitly rather than shown as a missing line. A non-null
 * `localKey` prepends a `Local key:` line (brief 036, D12) so the minted key is
 * explicit in the output, not only readable out of the folder name.
 */
export function renderStart(result: StartRunResult): string {
  const lines = [
    `Created ${result.folderPath}`,
    `Editables in ${result.editablePath}`,
  ];
  if (result.localKey !== null) {
    lines.unshift(`Local key: ${result.localKey}`);
  }
  lines.push(
    result.copiedFile ? `Template applied → ${result.copiedFile}` : "No template applied (--blank).",
  );
  return `${lines.join("\n")}${TRAILING_NEWLINE}`;
}

export { FETCH_COLUMNS, EMPTY_CELL, EMPTY_STATE };
