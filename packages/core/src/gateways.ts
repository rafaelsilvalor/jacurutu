// Gateway port interfaces (hexagonal ports). Interface-only: zero implementation,
// zero library import. Adapter packages implement these and depend on core; core
// never depends on an adapter (R25). The Jira/Sheets/Drive wire concerns live in
// the future adapters, not here.

import type { Issue } from "./payload.js";

/**
 * Port for reading the current design issues. An adapter maps the raw Jira
 * wire shape (`customfield_*`, ADF, etc.) to payload-v2.0 `Issue` values — that
 * mapping is the future Jira adapter's `build_issue_entry` equivalent, not core.
 */
export interface JiraGateway {
  /** Fetch the current design issues as payload-v2.0 `Issue` records. */
  fetchIssues(): Promise<Issue[]>;
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
 * operation. The concrete payload shapes depend on the Phase 3 Workspace /
 * manifest design and are intentionally left open here.
 */
export interface DriveGateway {
  // TODO(2026-06-06): finalize folder-upload contract once Phase 3 Workspace
  // production-state semantics land (ship operation).
  /** Upload a local task folder to Drive; returns the resulting Drive path. */
  uploadFolder(localFolderPath: string): Promise<string>;

  // TODO(2026-06-06): finalize manifest shape once Phase 3 TaskManifest is fixed
  // (load operation).
  /** Read the task manifest stored at a Drive path. */
  readManifest(drivePath: string): Promise<unknown>;
}
