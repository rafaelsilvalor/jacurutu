#!/usr/bin/env node
// Throwaway probe for the 2026-08-15 Sheets report spike (D1). NOT product code:
// nothing imports it, no package.json references it, and it is not promoted.
// It answers S1-S4 by measurement — create, write, share, and read back the
// granted scope string — so that the CLAUDE.md claim "create-and-share exceeds
// adapter-drive's current OAuth scopes" is settled with evidence instead of
// assumption (D5).
//
// Run it from anywhere inside the repo after `npx tsc -b`; see run-instructions.md.
//
// Credential hygiene (binding — docs/explorations/drive-oauth.md §10): this script
// never prints a token value, a client secret, or the --share-with address. It DOES
// print the Drive ids of the files it creates, because the owner has to delete them
// by hand; those ids are redacted before any output enters the repository
// (brief constraint 4).
//
// Why it does not call adapter-drive's own `authorize()`: that function hardcodes
// DRIVE_SCOPES in the consent request, and D5 forbids editing DRIVE_SCOPES for the
// widened re-run. The consent flow below is therefore local, but the credential
// files, their parsing, and the scope list under test all come from the adapter —
// no competing credential file is written (D2).

import http from "node:http";

import { google } from "googleapis";

import {
  DRIVE_SCOPES,
  LOOPBACK_CALLBACK_PATH,
} from "../../../packages/adapter-drive/dist/constants.js";
import {
  defaultCredentialPaths,
  readOAuthClient,
  readStoredToken,
  writeStoredToken,
} from "../../../packages/adapter-drive/dist/credentials.js";

// --- Policy constants (R7) ---

const DRIVE_API_VERSION = "v3";
const SHEETS_API_VERSION = "v4";
/** The MIME type that makes Drive store a file as a native Google spreadsheet. */
const SPREADSHEET_MIME_TYPE = "application/vnd.google-apps.spreadsheet";
/** Upload MIME type for path (b): CSV bytes in, spreadsheet out (D7). */
const CSV_MIME_TYPE = "text/csv";
/** Anchor cell for `values.update`; the fixture defines the extent from there. */
const VALUES_RANGE = "A1";
const VALUE_INPUT_OPTION = "RAW";
const SHARE_ROLE = "reader";
const SHARE_TYPE = "user";
const ITEM_FIELDS = "id, name, mimeType";
const PERMISSION_FIELDS = "id, type, role";
const CREATED_NAME_PREFIX = "saci-sheets-probe";
const CREATED_HEADING = "CREATED — delete these by hand";

// Step labels. One per probe step, and the strings the run transcript is grepped by.
const STEP_CREATE = "STEP 1";
const STEP_VALUES_UPDATE = "STEP 2a";
const STEP_CSV_CONVERT = "STEP 2b";
const STEP_SHARE = "STEP 3";
const STEP_SCOPES = "STEP 4";

// Fixture rows (D4): shaped like core's `ExportRecord`, hardcoded on purpose — the
// spike does not call Jira and does not design a projection. Column ids are the
// EXPORT_COLUMNS superset from packages/core/src/export.ts, in its order.
const FIXTURE_HEADER = [
  "key", "parent_key", "summary", "parent_summary", "vertical",
  "entrega_iso", "entrega_hora", "nome_curto", "task_filha_url", "task_pai_url",
  "copy_url", "copy_source", "status_jira", "jira_updated_at", "operator",
  "run_date", "generated_at",
];

const FIXTURE_ROWS = [
  {
    key: "DES-1001", parent_key: "DES-900", summary: "Banner topo",
    parent_summary: "Campanha ECJ", vertical: "ECJ", entrega_iso: "2026-08-20",
    entrega_hora: "18:00", nome_curto: "campanha-ecj-banner-topo",
    task_filha_url: "https://example.invalid/browse/DES-1001",
    task_pai_url: "https://example.invalid/browse/DES-900",
    copy_url: "", copy_source: "none", status_jira: "Em andamento",
    jira_updated_at: "2026-08-15T09:00:00.000-0300", operator: "probe",
    run_date: "2026-08-15", generated_at: "2026-08-15T09:00:00.000-0300",
  },
  {
    key: "DES-1002", parent_key: "DES-900", summary: "Card carrossel",
    parent_summary: "Campanha ECJ", vertical: "ECJ", entrega_iso: "2026-08-21",
    entrega_hora: "", nome_curto: "campanha-ecj-card-carrossel",
    task_filha_url: "https://example.invalid/browse/DES-1002",
    task_pai_url: "https://example.invalid/browse/DES-900",
    copy_url: "", copy_source: "none", status_jira: "A fazer",
    jira_updated_at: "2026-08-15T09:00:00.000-0300", operator: "probe",
    run_date: "2026-08-15", generated_at: "2026-08-15T09:00:00.000-0300",
  },
];

const USAGE = [
  "usage: node docs/tasks/2026-08-15-spike-sheets-report/sheets-probe.mjs \\",
  "         --share-with=<address> [--parent=<folderId>] [--wide=<scope>[,<scope>]]",
  "",
  "  --share-with  address STEP 3 shares the created spreadsheet with, as reader.",
  "                Required: without it S3 stays unmeasured. Never echoed back.",
  "  --parent      optional Drive folder id to create the probe files in;",
  "                default is the account's My Drive root.",
  "  --wide        extra scopes ADDED to the current DRIVE_SCOPES, for the D5",
  "                re-run only. Delete ~/.saci/token.json first (G-DRIVE-1).",
].join("\n");

// --- Argument parsing ---

function parseArgs(argv) {
  const flags = new Map();
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [key, ...rest] = arg.slice(2).split("=");
    flags.set(key, rest.join("="));
  }
  return flags;
}

/** Requested scope list: the shipped pair, plus whatever `--wide` names (D5). */
function resolveScopes(flags) {
  const base = [...DRIVE_SCOPES];
  if (!flags.has("wide")) return base;
  const extra = (flags.get("wide") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (extra.length === 0) {
    console.error("[probe] --wide was passed with no scope. Name at least one, comma-separated.");
    process.exit(2);
  }
  return [...base, ...extra];
}

// --- Failure reporting (R4: status and reason always logged, never swallowed) ---

const SCOPE_SIGNAL = /insufficient|invalid_scope|PERMISSION_DENIED|forbidden|not authorized/i;

function describeError(error) {
  const status = error?.response?.status ?? error?.status ?? error?.code ?? "n/a";
  const message = String(error?.message ?? error);
  const scopeHint =
    SCOPE_SIGNAL.test(message) || status === 403 || status === 401
      ? " [scope-insufficient signal — this is an S-question answer, not a bug]"
      : "";
  return `${status} ${message}${scopeHint}`;
}

/**
 * Run one step, print its verdict, and never rethrow. A failing step is data: the
 * brief's deliverable is a partial map, so the run continues past every failure.
 */
async function runStep(label, action) {
  try {
    const detail = await action();
    console.log(`${label}: PASS ${detail}`);
    return true;
  } catch (error) {
    console.log(`${label}: FAIL ${describeError(error)}`);
    return false;
  }
}

// --- OAuth: the adapter's credential files, the scope list under test ---

function startLoopbackServer() {
  return new Promise((ready) => {
    let settle;
    const code = new Promise((resolve, reject) => {
      settle = { resolve, reject };
    });
    const server = http.createServer((request, response) => {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      if (url.pathname !== LOOPBACK_CALLBACK_PATH) {
        response.writeHead(404);
        response.end();
        return;
      }
      response.writeHead(200, { "Content-Type": "text/plain" });
      response.end("Authorization response received. Return to the terminal.");
      server.close();
      const denied = url.searchParams.get("error");
      const granted = url.searchParams.get("code");
      if (denied) settle.reject(new Error(`OAuth consent was denied: ${denied}`));
      else if (!granted) settle.reject(new Error("OAuth callback carried no code parameter"));
      else settle.resolve(granted);
    });
    server.listen(0, "127.0.0.1", () => ready({ port: server.address().port, code }));
  });
}

async function runConsentFlow(credentials, scopes, tokenPath) {
  const { port, code } = await startLoopbackServer();
  const redirectUri = `http://127.0.0.1:${port}${LOOPBACK_CALLBACK_PATH}`;
  const client = new google.auth.OAuth2({
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    redirectUri,
  });
  const authUrl = client.generateAuthUrl({
    access_type: "offline", // required for a refresh token to be issued
    prompt: "consent",
    scope: scopes,
  });
  console.log(`[probe] loopback server listening on ${redirectUri}`);
  console.log("[probe] open the URL below in a browser and authorize. Do not paste it back — it carries the client id:");
  console.log(authUrl);
  const { tokens } = await client.getToken(await code);
  await writeStoredToken(tokenPath, tokens);
  console.log(`[probe] consent completed; token written to ${tokenPath}`);
  return tokens;
}

/**
 * Refuse to measure through a token whose grant is not exactly the requested set.
 * Both directions are fatal, and the narrower one is why this check exists: a token
 * left over from a `--wide` run would let STEP 1-3 pass and be recorded as
 * "drive.file is enough", which is the one wrong answer this spike must not produce.
 */
function assertGrantMatches(granted, requested, tokenPath) {
  const grantedSet = new Set((granted ?? "").split(/\s+/).filter(Boolean));
  const requestedSet = new Set(requested);
  const missing = requested.filter((s) => !grantedSet.has(s));
  const extra = [...grantedSet].filter((s) => !requestedSet.has(s));
  if (missing.length === 0 && extra.length === 0) return;
  console.error("[probe] STOP: the cached grant does not match the scopes under test (G-DRIVE-1).");
  if (missing.length > 0) console.error(`[probe]   requested but not granted: ${missing.join(" ")}`);
  if (extra.length > 0) console.error(`[probe]   granted but not requested: ${extra.join(" ")}`);
  console.error(`[probe] Delete ${tokenPath} and re-run, then authorize again in the browser.`);
  process.exit(2);
}

async function authorizeForScopes(scopes) {
  const paths = defaultCredentialPaths();
  const credentials = await readOAuthClient(paths.oauthClientPath);
  let token = await readStoredToken(paths.tokenPath);
  if (token === null) {
    console.log(`[probe] no token at ${paths.tokenPath}; starting the consent flow`);
    token = await runConsentFlow(credentials, scopes, paths.tokenPath);
  } else {
    console.log(`[probe] reusing the token at ${paths.tokenPath} (no browser needed)`);
  }
  assertGrantMatches(token.scope, scopes, paths.tokenPath);
  const client = new google.auth.OAuth2({
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
  });
  client.setCredentials(token);
  return { client, paths };
}

// --- The five steps ---

function csvCell(value) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** The fixture as a grid: header row first, then one row per record (D4). */
function fixtureGrid() {
  return [FIXTURE_HEADER, ...FIXTURE_ROWS.map((row) => FIXTURE_HEADER.map((id) => row[id]))];
}

function fixtureCsv() {
  return `${fixtureGrid().map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

function createRequestBody(name, parentId, media) {
  const requestBody = { name, mimeType: SPREADSHEET_MIME_TYPE };
  if (parentId) requestBody.parents = [parentId];
  const params = { requestBody, fields: ITEM_FIELDS, supportsAllDrives: true };
  if (media) params.media = media;
  return params;
}

async function stepCreate(drive, name, parentId) {
  const response = await drive.files.create(createRequestBody(name, parentId));
  const { id, mimeType } = response.data;
  return { detail: `— spreadsheet created: id=${id} mimeType=${mimeType}`, id };
}

async function stepValuesUpdate(sheets, spreadsheetId) {
  if (!spreadsheetId) throw new Error("no spreadsheet id — STEP 1 did not produce one");
  const response = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: VALUES_RANGE,
    valueInputOption: VALUE_INPUT_OPTION,
    requestBody: { values: fixtureGrid() },
  });
  const { updatedCells, updatedRange } = response.data;
  return { detail: `— values.update wrote ${updatedCells} cells at ${updatedRange}` };
}

async function stepCsvConvert(drive, name, parentId) {
  const media = { mimeType: CSV_MIME_TYPE, body: fixtureCsv() };
  const response = await drive.files.create(createRequestBody(name, parentId, media));
  const { id, mimeType } = response.data;
  return { detail: `— CSV converted on upload: id=${id} mimeType=${mimeType}`, id };
}

async function stepShare(drive, fileId, shareWith) {
  if (!shareWith) throw new Error("n/a --share-with was not supplied, so S3 is UNMEASURED, not answered");
  if (!fileId) throw new Error("no spreadsheet id — STEP 1 did not produce one");
  const response = await drive.permissions.create({
    fileId,
    requestBody: { type: SHARE_TYPE, role: SHARE_ROLE, emailAddress: shareWith },
    sendNotificationEmail: false,
    supportsAllDrives: true,
    fields: PERMISSION_FIELDS,
  });
  const { id, type, role } = response.data;
  // The recipient address is deliberately not echoed (brief constraint 4).
  return { detail: `— permission granted: id=${id} type=${type} role=${role} recipient=(withheld by the probe)` };
}

async function stepScopes(tokenPath) {
  const token = await readStoredToken(tokenPath);
  if (token === null) throw new Error(`no token file at ${tokenPath} to read the grant from`);
  return { detail: `— granted scope string: ${token.scope ?? "(not recorded in the token)"}` };
}

// --- Entry point ---

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.has("help")) {
    console.log(USAGE);
    return;
  }
  const scopes = resolveScopes(flags);
  const shareWith = flags.get("share-with") ?? "";
  const parentId = flags.get("parent") ?? "";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  console.log(`[probe] node ${process.version} on ${process.platform}`);
  console.log(`[probe] mode: ${flags.has("wide") ? "WIDE (D5 re-run)" : "NARROW (current DRIVE_SCOPES only)"}`);
  for (const scope of scopes) console.log(`[probe]   scope under test: ${scope}`);
  console.log(`[probe] parent folder: ${parentId ? "supplied by --parent" : "(My Drive root)"}`);
  console.log(`[probe] --share-with: ${shareWith ? "supplied" : "MISSING — STEP 3 will report UNMEASURED"}`);

  const { client, paths } = await authorizeForScopes(scopes);
  const drive = google.drive({ version: DRIVE_API_VERSION, auth: client });
  const sheets = google.sheets({ version: SHEETS_API_VERSION, auth: client });

  const created = [];
  let spreadsheetId = "";
  let failures = 0;

  const record = (label) => async (action) => {
    const outcome = { detail: "", id: "" };
    const ok = await runStep(label, async () => {
      const result = await action();
      Object.assign(outcome, result);
      return result.detail;
    });
    if (!ok) failures += 1;
    return outcome;
  };

  const createResult = await record(STEP_CREATE)(() => stepCreate(drive, `${CREATED_NAME_PREFIX}-step1-${stamp}`, parentId));
  if (createResult.id) {
    spreadsheetId = createResult.id;
    created.push(`${STEP_CREATE} spreadsheet: id=${createResult.id}`);
  }
  await record(STEP_VALUES_UPDATE)(() => stepValuesUpdate(sheets, spreadsheetId));
  const csvResult = await record(STEP_CSV_CONVERT)(() => stepCsvConvert(drive, `${CREATED_NAME_PREFIX}-step2b-${stamp}`, parentId));
  if (csvResult.id) created.push(`${STEP_CSV_CONVERT} spreadsheet: id=${csvResult.id}`);
  await record(STEP_SHARE)(() => stepShare(drive, spreadsheetId, shareWith));
  await record(STEP_SCOPES)(() => stepScopes(paths.tokenPath));

  console.log(`[probe] RESULT: ${5 - failures}/5 steps passed under: ${scopes.join(" + ")}`);
  console.log(CREATED_HEADING);
  if (created.length === 0) console.log("  (nothing was created)");
  for (const line of created) console.log(`  ${line}`);
  if (failures > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[probe] ABORTED before the step loop: ${describeError(error)}`);
  process.exitCode = 1;
});
