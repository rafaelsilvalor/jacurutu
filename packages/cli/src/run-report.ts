// Composition root for the report run (D7, the run-fetch.ts precedent): project a
// payload through an export profile and write it into ONE spreadsheet that persists
// across runs — created and shared on first use, rewritten thereafter.
//
// The gateway is injected as a thunk so every decision below is unit tested against a
// fake, with no credentials and no network; `createSpreadsheetGateway` is called in
// cli.ts and nowhere else (D7). The thunk is awaited only after the profile and the
// state file have both been read, so a config typo can never open a browser.

import type { SpreadsheetGateway } from "@saci/core";

import { projectProfile } from "./profile-projection.js";
import { readReportEntry, writeReportEntry } from "./report-state.js";

/** Build the authorized gateway. cli.ts supplies the real one; tests supply a fake. */
export type MakeSpreadsheetGateway = () => Promise<SpreadsheetGateway>;

/**
 * Name of a created spreadsheet (D6, R7). The stored key is the spreadsheet's ID, so a
 * designer renaming the file in Drive breaks nothing — which is the reason this name
 * needs no configuration.
 */
const SPREADSHEET_NAME_TEMPLATE = "Saci report: {profile}";
/** The single substitution point in SPREADSHEET_NAME_TEMPLATE. */
const PROFILE_PLACEHOLDER = "{profile}";
/** Google's answer for a spreadsheet that is deleted, trashed, or another account's. */
const NOT_FOUND_STATUS = 404;

export interface ReportRunInput {
  payloadPath: string;
  configPath: string;
  profileName: string;
  statePath: string;
  shareWith?: string;
  /** Injected clock for the stored `createdAt` (run-fetch.ts precedent); defaults to now. */
  now?: () => string;
}

export interface ReportRunResult {
  spreadsheetId: string;
  created: boolean;
  rowCount: number;
  share: "granted" | "skipped-existing" | "not-requested";
}

function spreadsheetName(profileName: string): string {
  return SPREADSHEET_NAME_TEMPLATE.replace(PROFILE_PLACEHOLDER, profileName);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The numeric status carried on a value, or undefined when it carries none. */
function statusOf(value: unknown): number | undefined {
  return isRecord(value) && typeof value.status === "number" ? value.status : undefined;
}

/**
 * Whether a gateway failure was a 404, decided on the STATUS and never on the message
 * text (G-JIRA-1: Google's prose is not a control-flow input). adapter-sheets attaches
 * the classified status to the sanitized `cause` it builds (G-DRIVE-3); the error's own
 * status is read as well, so a gateway that throws unwrapped still classifies.
 */
function isNotFound(error: unknown): boolean {
  if (statusOf(error) === NOT_FOUND_STATUS) {
    return true;
  }
  return isRecord(error) && statusOf(error.cause) === NOT_FOUND_STATUS;
}

/**
 * The D5 failure: the stored id no longer resolves. It names the profile, the id, the
 * state file and the one-line fix, because the operator reading it has to decide what
 * to do next and nothing else on the machine knows which entry to remove.
 */
function notFoundError(
  profileName: string,
  spreadsheetId: string,
  statePath: string,
  error: unknown,
): Error {
  const cause = error instanceof Error ? error.message : String(error);
  return new Error(
    `Report for profile "${profileName}" points at spreadsheet ${spreadsheetId}, which Google answered 404 for. Saci will not create a replacement: remove the "${profileName}" entry from ${statePath} and the next run creates a fresh report. Cause: ${cause}`,
    // Safe to carry: adapter-sheets already replaced the library's error with a
    // sanitized stand-in before it reached this module (G-DRIVE-3).
    { cause: error },
  );
}

/**
 * Run the report. A stored id that Google answers 404 for FAILS and creates nothing
 * (D5): a silent recreate would produce a second report nobody is shared into, while
 * the team keeps opening the old link and reading data that stopped moving.
 */
export async function runReport(
  makeGateway: MakeSpreadsheetGateway,
  input: ReportRunInput,
): Promise<ReportRunResult> {
  const { profileName, statePath, shareWith } = input;
  const now = input.now ?? ((): string => new Date().toISOString());

  // Both reads precede authorization: an unknown profile or a malformed state file
  // must fail before a browser consent window can open on a designer's machine.
  const { selection } = await projectProfile(input.payloadPath, input.configPath, profileName);
  const existing = await readReportEntry(statePath, profileName);

  const gateway = await makeGateway();

  if (existing !== null) {
    const { spreadsheetId } = existing;
    try {
      await gateway.writeGrid(spreadsheetId, selection);
    } catch (error) {
      // Only a 404 carries D5's meaning; every other failure travels unchanged (R4).
      throw isNotFound(error)
        ? notFoundError(profileName, spreadsheetId, statePath, error)
        : error;
    }
    return {
      spreadsheetId,
      created: false,
      rowCount: selection.rows.length,
      share: shareWith === undefined ? "not-requested" : "skipped-existing",
    };
  }

  const created = await gateway.createSpreadsheet(spreadsheetName(profileName));
  // Persist BEFORE writing the grid: a failure after this line leaves an id the next
  // run reuses, instead of a spreadsheet nothing points at and a duplicate beside it.
  await writeReportEntry(statePath, profileName, {
    spreadsheetId: created.id,
    createdAt: now(),
  });
  if (shareWith !== undefined) {
    await gateway.shareAsReader(created.id, shareWith);
  }
  await gateway.writeGrid(created.id, selection);
  return {
    spreadsheetId: created.id,
    created: true,
    rowCount: selection.rows.length,
    share: shareWith === undefined ? "not-requested" : "granted",
  };
}
