// The Jira credential record, read from ONE hand-seeded JSON file (brief
// 2026-08-20-jira-credentials-file, D1/D2/D3). Before this, the three
// JACURUTU_JIRA_* variables were the only source, so the credential lived in a
// terminal's process memory and every closed terminal took it with it.
//
// Modelled line-for-line on identity.ts's seam: the path is always INJECTED,
// this module reads no environment of its own and composes no default path
// (cli.ts resolves it per D6), so the one place that decides where the file
// lives stays the composition root. The `env` parameter of readJiraCredentials
// is not an exception to that — it is consulted for ONE purpose, naming retired
// variables in the missing-file message (D2), and never for a credential value.
//
// D7: the reader reads and never writes — it creates no file, creates no
// directory, and binds no file mode. A hand-seeded file has no creation moment
// inside the application, and creation is the only moment a file mode can be
// bound at all — so the 0600 that token.json gets is structurally unavailable
// here rather than merely skipped.
//
// D5: no expiry gate and no expiry warning. A past `expiresAt` is valid input;
// the operator who rotated the token without updating the file has a working
// credential and a stale date, and refusing that run would block the very state
// the date exists to diagnose. No clock is imported here for the same reason.

import { readFile } from "node:fs/promises";

/** Credentials filename under the identity dir (D1); cli.ts composes the full path. */
export const JIRA_CREDENTIALS_FILENAME = "jira-credentials.json";

/**
 * The env vars retired on 2026-08-20 (D2). Read for their NAMES only, to tell an
 * operator whose shell still exports them that they are no longer consulted —
 * never for their values, which is the failure this task removes.
 */
export const RETIRED_JIRA_ENV_VARS: readonly string[] = [
  "JACURUTU_JIRA_BASE_URL",
  "JACURUTU_JIRA_EMAIL",
  "JACURUTU_JIRA_API_TOKEN",
];

/** Literal seed shown when the file is missing: the exact JSON to create by hand. */
const SEED_EXAMPLE = `{
  "baseUrl": "https://your-site.atlassian.net",
  "email": "you@example.com",
  "apiToken": "<your Atlassian API token>",
  "expiresAt": "2027-08-19"
}`;

/** `expiresAt` shape: the ISO calendar date Atlassian shows on the token screen (D3). */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Days per month, index 0 = January. February is corrected for leap years below. */
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const FEBRUARY = 2;
const FEBRUARY_LEAP_DAYS = 29;
const MONTHS_IN_YEAR = 12;

/**
 * The file's shape (D3): the Basic-auth pair, its site, and the token's recorded
 * expiry. All four are required — `expiresAt` is the only reason this file beats
 * the environment on anything except survival, and an optional field would simply
 * be omitted on the first hand-seeded file.
 */
export interface JiraCredentials {
  baseUrl: string;
  email: string;
  apiToken: string;
  expiresAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Shape validation only (D3): four digits, a hyphen, two digits, a hyphen, two
 * digits, denoting a day that exists. Deliberately no `Date` construction — a
 * real calendar is arithmetic, and reaching for `Date` here is how a clock gets
 * into a module that must not have one.
 */
function isCalendarDate(value: string): boolean {
  if (!ISO_DATE.test(value)) {
    return false;
  }
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (month < 1 || month > MONTHS_IN_YEAR) {
    return false;
  }
  const lastDay =
    month === FEBRUARY && isLeapYear(year) ? FEBRUARY_LEAP_DAYS : DAYS_IN_MONTH[month - 1];
  return day >= 1 && day <= lastDay;
}

/** Narrow one field, fail-loud naming the file and the field, never the value (R4). */
function requireString(
  record: Record<string, unknown>,
  field: string,
  filePath: string,
): string {
  const value = record[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`Jira credentials file ${filePath}: ${field} must be a non-empty string.`);
  }
  return value;
}

/** Narrow the parsed document to a JiraCredentials, in field-declaration order. */
function asJiraCredentials(input: unknown, filePath: string): JiraCredentials {
  if (!isRecord(input)) {
    throw new TypeError(`Jira credentials file ${filePath} must hold a JSON object.`);
  }
  const baseUrl = requireString(input, "baseUrl", filePath);
  const email = requireString(input, "email", filePath);
  const apiToken = requireString(input, "apiToken", filePath);
  const expiresAt = requireString(input, "expiresAt", filePath);
  if (!isCalendarDate(expiresAt)) {
    throw new TypeError(
      `Jira credentials file ${filePath}: expiresAt must be a calendar date in YYYY-MM-DD form.`,
    );
  }
  return { baseUrl, email, apiToken, expiresAt };
}

/**
 * Parse and validate the credential bytes. Pure: the caller supplies the content
 * and the path, and the path is used ONLY to name the file in messages — nothing
 * here opens it (parseOAuthClient's shape).
 */
export function parseJiraCredentials(raw: string, filePath: string): JiraCredentials {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error);
    throw new Error(`Malformed JSON in Jira credentials file ${filePath}: ${cause}`);
  }
  return asJiraCredentials(parsed, filePath);
}

/**
 * The missing-file message: the resolved path, the exact JSON to create, and —
 * only when the operator's shell still exports one — the retired variables that
 * are set, by name (D2). Names only, and only the ones actually present: a
 * blanket list would mask the typo brief 044 was written about.
 */
function missingFileMessage(filePath: string, env: NodeJS.ProcessEnv): string {
  const head = `No Jira credentials file at ${filePath}. Create it with:\n${SEED_EXAMPLE}`;
  const stillSet = RETIRED_JIRA_ENV_VARS.filter((name) => env[name]);
  if (stillSet.length === 0) {
    return head;
  }
  const verb = stillSet.length === 1 ? "is" : "are";
  return `${head}\n${stillSet.join(", ")} ${verb} set but no longer read; the value belongs in the file above.`;
}

/**
 * Read and validate the credentials file, fail-loud (constraint 5). Absence is a
 * hard failure rather than a first run: unlike report.json, which the app writes,
 * this file is the operator's only way to supply a credential, so an empty state
 * would leave the CLI with nothing to proceed on. Unexpected I/O errors are
 * rethrown, never swallowed (R4).
 */
export async function readJiraCredentials(
  filePath: string,
  env: NodeJS.ProcessEnv,
): Promise<JiraCredentials> {
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(missingFileMessage(filePath, env));
    }
    throw error;
  }
  return parseJiraCredentials(raw, filePath);
}
