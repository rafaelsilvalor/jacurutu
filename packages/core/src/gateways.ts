// Gateway port interfaces (hexagonal ports). Interface-only: zero implementation,
// zero library import. Adapter packages implement these and depend on core; core
// never depends on an adapter (R25). The Jira/Sheets/Drive wire concerns live in
// the future adapters, not here.

import type { ColumnSelection } from "./export.js";
import type { Issue } from "./payload.js";

/**
 * Port for reading the current design issues. An adapter maps the raw Jira
 * wire shape (`customfield_*`, ADF, etc.) to payload-v2.0 `Issue` values — that
 * mapping is the future Jira adapter's `build_issue_entry` equivalent, not core.
 */
export interface JiraGateway {
  /**
   * Verify the configured credentials before any search. Fail-loud (R4): a
   * rejected credential throws naming the credential as the cause; success
   * returns void. Exists because a bad token does not make a bounded JQL
   * search fail — it answers 200 with an empty issue list (measured
   * 2026-08-09), which would otherwise reach the caller as "no work today".
   * The composition root calls this before any search; the adapter must not
   * fold it into `fetchIssues`.
   */
  verifyCredentials(): Promise<void>;

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
 * A spreadsheet as the port surfaces it: identity only. Enough to write into it,
 * share it, and hand a person its id — and nothing about its content, because the
 * projection is one-way and the port never reads back.
 */
export interface SpreadsheetRef {
  id: string;
  name: string;
}

/**
 * Port for the team report: a spreadsheet Jacurutu creates, fills, and shares with
 * people who never run Jacurutu. It replaces the 019 `SheetGateway`, whose
 * `readRows` / `writeRows(startRow, ...)` pair existed only while the Sheet held
 * production state — the application has owned that state since the 2026-06-12
 * pivot, and the 2026-08-14 reversal made the spreadsheet a one-way report
 * instead. Every method is grounded in an operation measured live in the
 * 2026-08-15 spike, under the scopes `adapter-drive` already holds; the port
 * deliberately cannot express what that spike did not measure.
 */
export interface SpreadsheetGateway {
  /**
   * Create an empty spreadsheet named `name` and return its identity. It lands in
   * the account's My Drive root: creating inside a folder was not measured, so
   * there is no parent parameter to get wrong.
   */
  createSpreadsheet(name: string): Promise<SpreadsheetRef>;

  /**
   * Replace the first sheet's contents with `table` — header row, then one row
   * per record, anchored at A1. Replace, not append: a run with fewer rows must
   * not leave the previous run's tail below the new grid. `ColumnSelection` is
   * the export projection's own output type, so a report and a CSV of the same
   * profile cannot drift in column selection or order.
   */
  writeGrid(spreadsheetId: string, table: ColumnSelection): Promise<void>;

  /**
   * Grant one workspace user read access. One user as reader is exactly what was
   * measured, which is why neither the role nor the grantee type is a parameter.
   */
  shareAsReader(spreadsheetId: string, recipient: string): Promise<void>;
}

/**
 * A Drive item as the port surfaces it: identity and kind only. `mimeType` is an
 * opaque passthrough — core never interprets Drive wire values.
 */
export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
}

/**
 * Port for the Drive-backed asset store. No Python precursor — the seed does not
 * touch Drive. Five primitives, one Drive call each: composition (folder-tree
 * walking, the verify-never-create policy, manifest validation) belongs to the
 * ship layer. Grounded in the operations proven live in the 046 spike.
 */
export interface DriveGateway {
  /** Resolve a folder by id. Fail-loud (R4): a missing id, or a non-folder, throws. */
  resolveFolder(folderId: string): Promise<DriveItem>;

  /**
   * Find the direct child named `name` under `parentId`. `null` means absent —
   * an expected answer, not a failure. More than one match throws (R4).
   */
  findChild(parentId: string, name: string): Promise<DriveItem | null>;

  /** Create a folder named `name` under `parentId`; returns the created folder. */
  createFolder(parentId: string, name: string): Promise<DriveItem>;

  /** Upload a local file into `parentId`. Always creates; replace is a ship concern. */
  uploadFile(parentId: string, name: string, localFilePath: string): Promise<DriveItem>;

  /** Read a file's content as UTF-8 text. Parsing/validation is the caller's job (D2). */
  readFileContent(fileId: string): Promise<string>;
}
