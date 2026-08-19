// Credential location and parsing for the Drive adapter (D5). Credentials live in
// ~/.jacurutu/, alongside the task-036 identity file, and every path-taking function
// receives the home dir explicitly so it is unit-testable; `defaultCredentialPaths`
// is the single `os.homedir()` caller (the identity.ts seam shape).
//
// Credential hygiene (binding — docs/explorations/drive-oauth.md §10): nothing in
// this module logs, echoes, or embeds a client secret or a token value. Errors name
// the FILE and the fix, never the contents.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

import {
  CREDENTIALS_DIR_NAME,
  OAUTH_CLIENT_FILENAME,
  TOKEN_FILENAME,
} from "./constants.js";

/**
 * Owner-only POSIX modes for credential material (R7). Both bind at creation time
 * only: an existing directory or token file keeps whatever permissions it already
 * has. Inert on win32, load-bearing on the macOS and Linux instances this project
 * ships to as well (R1).
 */
const CREDENTIALS_DIR_MODE = 0o700;
const TOKEN_FILE_MODE = 0o600;

/** Where the two credential files live for one user. */
export interface CredentialPaths {
  oauthClientPath: string;
  tokenPath: string;
}

/** The two fields the adapter needs out of a Desktop-app OAuth client JSON. */
export interface OAuthClientCredentials {
  clientId: string;
  clientSecret: string;
}

/**
 * The persisted OAuth token, in Google's wire field names so it round-trips through
 * `google-auth-library` without a cast. Every field is optional: the file is written
 * from whatever the token endpoint returned.
 */
export interface StoredToken {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
  expiry_date?: number;
}

/** Directory holding the credential files under the given home dir (R1). */
export function credentialsDir(homeDir: string): string {
  return path.join(homeDir, CREDENTIALS_DIR_NAME);
}

/** Absolute path of the Desktop-app OAuth client JSON under the given home dir. */
export function oauthClientPath(homeDir: string): string {
  return path.join(credentialsDir(homeDir), OAUTH_CLIENT_FILENAME);
}

/** Absolute path of the token cache under the given home dir. */
export function tokenPath(homeDir: string): string {
  return path.join(credentialsDir(homeDir), TOKEN_FILENAME);
}

/** The only `os.homedir()` caller in the adapter (D5) — everything else takes the dir. */
export function defaultCredentialPaths(): CredentialPaths {
  const home = homedir();
  return { oauthClientPath: oauthClientPath(home), tokenPath: tokenPath(home) };
}

const DESKTOP_CLIENT_HINT =
  "Create an OAuth client with user type Internal and application type " +
  '"Desktop app" in Google Cloud Console, download the JSON, and save it there.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonFile(raw: string, kind: string, filePath: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error);
    throw new Error(`Malformed JSON in ${kind} file ${filePath}: ${cause}`);
  }
}

function requireStringField(
  section: Record<string, unknown>,
  field: string,
  filePath: string,
): string {
  const value = section[field];
  if (typeof value !== "string" || value === "") {
    throw new Error(
      `OAuth client file ${filePath}: "installed.${field}" is missing or not a string. ${DESKTOP_CLIENT_HINT}`,
    );
  }
  return value;
}

/**
 * Parse a Desktop-app OAuth client JSON. Pure — the caller supplies the bytes and the
 * path used in messages. Fail-loud (R4) on malformed JSON, a missing `installed`
 * section, or a missing id/secret; a `web`-only client is rejected with the
 * Desktop-app pointer, because that is the mistake that later surfaces as an opaque
 * `redirect_uri` error at consent time.
 */
export function parseOAuthClient(raw: string, filePath: string): OAuthClientCredentials {
  const parsed = parseJsonFile(raw, "OAuth client", filePath);
  if (!isRecord(parsed)) {
    throw new Error(`OAuth client file ${filePath} must hold a JSON object. ${DESKTOP_CLIENT_HINT}`);
  }
  if (!isRecord(parsed.installed)) {
    const detail = isRecord(parsed.web)
      ? 'has a "web" section but no "installed" section'
      : 'has no "installed" section';
    throw new Error(`OAuth client file ${filePath} ${detail}. ${DESKTOP_CLIENT_HINT}`);
  }
  return {
    clientId: requireStringField(parsed.installed, "client_id", filePath),
    clientSecret: requireStringField(parsed.installed, "client_secret", filePath),
  };
}

/**
 * Read and parse the OAuth client file. A missing file is the common first-run
 * failure, so it names the absolute path and the fix (R4); any other I/O error is
 * rethrown untouched.
 */
export async function readOAuthClient(filePath: string): Promise<OAuthClientCredentials> {
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`No OAuth client file at ${filePath}. ${DESKTOP_CLIENT_HINT}`);
    }
    throw error;
  }
  return parseOAuthClient(raw, filePath);
}

/**
 * Narrow parsed JSON to the token shape field by field, dropping anything unexpected
 * (R24 — no `any`, no blanket cast). Values are copied, never inspected or logged.
 */
function narrowStoredToken(parsed: Record<string, unknown>): StoredToken {
  const token: StoredToken = {};
  if (typeof parsed.access_token === "string") token.access_token = parsed.access_token;
  if (typeof parsed.refresh_token === "string") token.refresh_token = parsed.refresh_token;
  if (typeof parsed.scope === "string") token.scope = parsed.scope;
  if (typeof parsed.token_type === "string") token.token_type = parsed.token_type;
  if (typeof parsed.id_token === "string") token.id_token = parsed.id_token;
  if (typeof parsed.expiry_date === "number") token.expiry_date = parsed.expiry_date;
  return token;
}

/**
 * Read the cached token, or `null` when the file does not exist. Absence is the
 * documented, expected first-run answer (R4) and means "run the consent flow";
 * malformed content is a real failure and throws.
 */
export async function readStoredToken(filePath: string): Promise<StoredToken | null> {
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
  const parsed = parseJsonFile(raw, "token", filePath);
  if (!isRecord(parsed)) {
    throw new Error(
      `Token file ${filePath} must hold a JSON object. Delete it and authorize again.`,
    );
  }
  return narrowStoredToken(parsed);
}

/**
 * Create the credentials directory owner-only, if it is not there already. First run
 * on a fresh machine has no `~/.jacurutu`, and creation is the only moment the mode can be
 * set at all — an existing directory keeps its current permissions untouched.
 */
export async function ensureCredentialsDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true, mode: CREDENTIALS_DIR_MODE });
}

/**
 * Persist the token as 2-space JSON with a trailing newline (the identity.ts style),
 * readable by its owner only. The file holds a long-lived refresh token, and the
 * default 0644 would leave it readable by every other account on a shared POSIX
 * machine. The mode binds only when this call creates the file: a `token.json` that
 * already exists keeps the permissions it was written with.
 */
export async function writeStoredToken(filePath: string, token: StoredToken): Promise<void> {
  await ensureCredentialsDir(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(token, null, 2)}\n`, {
    encoding: "utf8",
    mode: TOKEN_FILE_MODE,
  });
}
