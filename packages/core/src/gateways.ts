// Gateway port interfaces (hexagonal ports). Interface-only: zero implementation,
// zero library import. Adapter packages implement these and depend on core; core
// never depends on an adapter (R25). The Jira/Sheets/Drive wire concerns live in
// the future adapters, not here.

import type { Issue } from "./payload.js";
import type { TaskManifest } from "./workspace.js";

/**
 * Port for reading the current design issues. An adapter maps the raw Jira
 * wire shape (`customfield_*`, ADF, etc.) to payload-v2.0 `Issue` values — that
 * mapping is the future Jira adapter's `build_issue_entry` equivalent, not core.
 */
export interface JiraGateway {
  /** Fetch the current design issues as payload-v2.0 `Issue` records. */
  fetchIssues(): Promise<Issue[]>;

  /**
   * Fetch a single design issue by its Jira key. Fail-loud (R4): zero results
   * or more than one both throw an error naming `key` — never returns
   * `Issue | null`. The `start` command relies on this to refuse to scaffold a
   * task it cannot uniquely resolve.
   */
  fetchIssueByKey(key: string): Promise<Issue>;
}

/**
 * Port for the production-tracking spreadsheet. Methods are named in domain
 * terms; the gspread-specific `native` qualifier from the seed
 * (`write_rows_native`) is an adapter concern and does not appear here.
 * Grounded in automation/lib_sheets.py `read_rows` / `write_rows_native`.
 */
export interface SheetGateway {
  /** Read all data rows (header skipped) as string-keyed records. */
  readRows(): Promise<Record<string, string>[]>;
  /** Write rows starting at the given 1-based row index. */
  writeRows(startRow: number, rows: Record<string, string>[]): Promise<void>;
}

/**
 * Port for the Drive-backed asset store. No Python precursor — the seed does not
 * touch Drive. Minimal surface: one ship-implied operation and one load-implied
 * operation. The upload contract still depends on the Phase 3 Workspace
 * production-state semantics and is intentionally left open; the manifest
 * shape is fixed by `TaskManifest` (schemaVersion 2, `./workspace.js`).
 */
export interface DriveGateway {
  // TODO(2026-06-06): finalize folder-upload contract once Phase 3 Workspace
  // production-state semantics land (ship operation).
  /** Upload a local task folder to Drive; returns the resulting Drive path. */
  uploadFolder(localFolderPath: string): Promise<string>;

  /**
   * Read the task manifest stored at a Drive path. Implementation contract:
   * adapters validate the raw Drive bytes via `parseManifest` (fail-loud,
   * R4) before returning — the port never surfaces an unvalidated object.
   */
  readManifest(drivePath: string): Promise<TaskManifest>;
}
