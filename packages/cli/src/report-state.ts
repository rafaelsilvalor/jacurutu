// Per-profile report state for `saci report` (D1): ONE production-state JSON file
// mapping an export profile name to the spreadsheet that profile's report lives in.
// Modelled on identity.ts — the path is always injected, this module reads no env and
// composes no default path (cli.ts resolves it) — with one deliberate divergence:
// identity.json is hand-seeded, so its absence means the operator has not set up yet
// and must be told, while report.json is app-written, so its absence only means no
// report exists yet, which is exactly what a first run looks like.
//
// This is the first production-state file in v2 the application itself writes — nobody
// can know a spreadsheet id before the spreadsheet exists — so all of its I/O lives
// here in the composition-root package (R18's principle at the seam that exists; R25).
//
// Absence is the ONLY tolerated anomaly. Every other bad shape throws naming the file
// and the offending field (R4): a state file that half-parses is worse than one that is
// missing, because the run continues on a partial answer and writes into whatever id it
// managed to read.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/** Default report-state filename under the identity dir (D1); cli.ts composes the full path. */
export const REPORT_STATE_FILENAME = "report.json";

/** On-disk indent, mirroring identity.ts's human-inspectable form. */
const STATE_INDENT = 2;

/** One profile's report: the spreadsheet it writes into, and when Saci created it. */
export interface ReportEntry {
  spreadsheetId: string;
  createdAt: string;
}

/**
 * The file's shape (D1): entries keyed by PROFILE NAME. Two profiles are two different
 * reports, so a single flat `spreadsheetId` would make the second run of a second
 * profile overwrite the first profile's report.
 */
export interface ReportState {
  reports: Record<string, ReportEntry>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Narrow one entry, fail-loud naming the profile and the field it failed on (R4). */
function asReportEntry(input: unknown, filePath: string, profileName: string): ReportEntry {
  const at = `Report state file ${filePath}: reports."${profileName}"`;
  if (!isRecord(input)) {
    throw new TypeError(`${at} must be a JSON object.`);
  }
  if (typeof input.spreadsheetId !== "string" || input.spreadsheetId.trim() === "") {
    throw new TypeError(`${at}.spreadsheetId must be a non-empty string.`);
  }
  if (typeof input.createdAt !== "string" || input.createdAt.trim() === "") {
    throw new TypeError(`${at}.createdAt must be a non-empty string.`);
  }
  return { spreadsheetId: input.spreadsheetId, createdAt: input.createdAt };
}

/** Narrow the parsed document; every entry is checked, not just the one being read. */
function asReportState(input: unknown, filePath: string): ReportState {
  if (!isRecord(input)) {
    throw new TypeError(`Report state file ${filePath} must hold a JSON object.`);
  }
  if (!isRecord(input.reports)) {
    throw new TypeError(`Report state file ${filePath}: reports must be a JSON object.`);
  }
  const reports: Record<string, ReportEntry> = {};
  for (const [profileName, entry] of Object.entries(input.reports)) {
    reports[profileName] = asReportEntry(entry, filePath, profileName);
  }
  return { reports };
}

/**
 * Read and validate the state file. A MISSING file answers an empty state: a first run
 * has no report, and that is the expected answer rather than a failure. Anything else —
 * an unreadable but present file, malformed JSON, a wrong shape — throws (R4).
 */
export async function readReportState(filePath: string): Promise<ReportState> {
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === "ENOENT") {
      return { reports: {} };
    }
    throw error;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error);
    throw new Error(`Malformed JSON in report state file ${filePath}: ${cause}`);
  }
  return asReportState(parsed, filePath);
}

/** The entry for one profile, or `null` when that profile has no report yet. */
export async function readReportEntry(
  filePath: string,
  profileName: string,
): Promise<ReportEntry | null> {
  const state = await readReportState(filePath);
  return state.reports[profileName] ?? null;
}

/**
 * Persist one profile's entry, PRESERVING every other profile's. Read-modify-write, not
 * a blind overwrite: another profile's entry names a spreadsheet the team is already
 * opening, and dropping it would leave that report alive in Drive with Saci unable to
 * find it again. The parent directory is created because this file is app-written and a
 * successful read does not precede its first write (identity.ts's opposite case).
 */
export async function writeReportEntry(
  filePath: string,
  profileName: string,
  entry: ReportEntry,
): Promise<void> {
  const state = await readReportState(filePath);
  const next: ReportState = { reports: { ...state.reports, [profileName]: entry } };
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(next, null, STATE_INDENT)}\n`, "utf8");
}
