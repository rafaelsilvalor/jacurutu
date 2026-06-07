// Payload v2.0 domain types — the JiraGateway return contract.
// Field names, types, and nullability mirror automation/fetch.py build_issue_entry
// (frozen Python seed) and automation/payload.json exactly (D3 — no tidying).

import type { CopySource } from "./types.js";

/**
 * One design issue in the payload. Mirrors the dict returned by
 * `build_issue_entry` in fetch.py: fields the Python returns as `value or ""`
 * are non-null `string`; the two bare nullables stay `string | null`.
 */
export interface Issue {
  /** Jira issue key (e.g. `"MCA-12345"`). Non-null: a keyless issue is dropped upstream. */
  key: string;
  /** Issue summary. Non-null (`fields.summary or ""`). */
  summary: string;
  /** Parent issue key. Non-null (`parent_key or ""`); empty string when the issue has no parent. */
  parent_key: string;
  /** Parent issue summary. Non-null (`parent.fields.summary or ""`). */
  parent_summary: string;
  /** Jira status name (e.g. `"FILA DE EXECUCAO"`). Non-null (`status.name or ""`). */
  status_jira: string;
  /** Raw vertical tag (e.g. `"[EC] Concursos"`). Non-null (`vertical_raw or ""`). */
  vertical_raw: string;
  /**
   * Delivery datetime as Jira ISO, or `null`. Bare nullable in the Python: the
   * extraction sets `None` on failure and is returned without an `or ""` guard.
   */
  entrega_iso: string | null;
  /**
   * Resolved copy URL, or `null`. Bare nullable in the Python: `resolve_copy`
   * returns `None` for the fallback case and is returned without an `or ""` guard.
   */
  copy_url: string | null;
  /** Provenance of `copy_url` (sister / parent / fallback). */
  copy_source: CopySource;
  /** Jira `updated` timestamp, used for conditional writes. Non-null (`updated or ""`). */
  jira_updated_at: string;
}

/** A design issue dropped before payload assembly, with the reason (e.g. status filter). */
export interface FilteredOut {
  /** Jira issue key that was filtered out. */
  key: string;
  /** Why the issue was excluded (e.g. `"Backlog"`, `"Template"`). */
  reason: string;
}

/** A partial-failure note recorded while assembling an issue entry. */
export interface PayloadWarning {
  /** Jira issue key the warning concerns. */
  key: string;
  /** Field that failed to extract cleanly (e.g. `"entrega_iso"`). */
  field: string;
  /** Human-readable description of the extraction problem. */
  issue: string;
}

/**
 * The full payload v2.0 produced by a fetch run. `schema_version` is `"2.0"`.
 * Graceful-failure contract: issues with partial extraction failures still
 * appear in `issues` with fallback field values, and the problem is logged in
 * `warnings`; issues excluded by a filter appear in `filtered_out`.
 */
export interface Payload {
  /** Payload schema version. Always `"2.0"` for this shape. */
  schema_version: string;
  /** Run date (`YYYY-MM-DD`). */
  run_date: string;
  /** Generation timestamp (ISO with offset). */
  generated_at: string;
  /** The included design issues. */
  issues: Issue[];
  /** Issues excluded by a filter, with reasons. */
  filtered_out: FilteredOut[];
  /** Partial-extraction warnings collected during the run. */
  warnings: PayloadWarning[];
}
