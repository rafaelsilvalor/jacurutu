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
