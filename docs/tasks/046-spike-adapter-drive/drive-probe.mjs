#!/usr/bin/env node
// Throwaway probe for brief 046 (adapter-drive spike). NOT product code.
// Proves the OAuth loopback (installed-app) flow in Node with the
// hypothesis stack (googleapis + google-auth-library) and runs the four
// operations of spike question 4. Run it from a scratch directory OUTSIDE
// the repo, per docs/tasks/046-spike-adapter-drive/run-instructions.md.
//
// Credential hygiene (binding — docs/explorations/drive-oauth.md §10):
// oauth_client.json and token.json live OUTSIDE the repo; this script
// receives their paths via CLI args or environment variables and never
// prints their contents. Evidence lines carry paths, scope strings, and
// expiry metadata only.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import http from "node:http";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

// --- Policy constants (R7). Edit between evidence rounds as instructed. ---

// Round 1 candidate combination (spike question 3). Fallback round: replace
// with ["https://www.googleapis.com/auth/drive"]. Whenever SCOPES changes,
// DELETE token.json before re-running (scope-change trap, note §4).
const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
];

// Op (a) target. Fill with a real folder ID (the tail of its Drive URL).
const PROBE_FOLDER_ID = "REPLACE_WITH_FOLDER_ID";

// Op (b) target: name of an existing, HUMAN-created child (folder or file)
// inside PROBE_FOLDER_ID. The D3 verify-never-create policy depends on
// this read working — the child must NOT have been created by this app.
const VERIFY_CHILD_NAME = "REPLACE_WITH_CHILD_NAME";

// Op (c) creates this file inside PROBE_FOLDER_ID (harmless timestamp line).
const UPLOAD_FILE_NAME = "saci-046-probe.txt";

// Op (d) target: "" reads back the file op (c) just uploaded (baseline).
// Cross-user gap round: set to the ID of a file uploaded by the OTHER
// account's probe run under the same OAuth client ID.
const READ_FILE_ID = "";

const CALLBACK_PATH = "/oauth2callback";

// --- Failure classification (exploration note §6; no silent catch, R4) ---

const CLASSIFICATION_RULES = [
  [/access blocked|blocked by (your )?organi[sz]ation/i,
    "Workspace policy blocks the client — ask IT to allow the client ID (note §6)"],
  [/redirect_uri/i,
    "OAuth client has the wrong type — recreate as Desktop app (note §6)"],
  [/invalid_grant|expired or revoked/i,
    "refresh token revoked/expired — delete token.json and re-authenticate (note §6)"],
  [/invalid_scope|insufficient/i,
    "token/scope mismatch or scope too narrow — delete token.json, adjust SCOPES, re-authenticate (note §6)"],
];

function classifyError(err) {
  const status = err?.response?.status ?? err?.code ?? err?.status ?? "n/a";
  const message = String(err?.message ?? err);
  for (const [pattern, hint] of CLASSIFICATION_RULES) {
    if (pattern.test(message)) return { status, message, hint };
  }
  if (status === 404) {
    return { status, message, hint:
      "not found OR not visible under the current SCOPES — drive.file hides " +
      "items the app did not create; if the item exists in the Drive UI, " +
      "this is the scope-probe signal (spike question 3)" };
  }
  if (typeof status === "number" && status >= 500) {
    return { status, message, hint:
      "Google-side instability — retry with backoff; check status.cloud.google.com (note §6)" };
  }
  return { status, message, hint: "unclassified — read status/message above" };
}

function reportFailure(label, err) {
  const { status, message, hint } = classifyError(err);
  console.error(`[${label}] FAIL — status=${status} message="${message}"`);
  console.error(`[${label}] classification: ${hint}`);
}

// --- Credential path resolution (paths only; contents never printed) ---

function resolvePaths() {
  const args = new Map(
    process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => {
      const [key, ...rest] = a.slice(2).split("=");
      return [key, rest.join("=")];
    }),
  );
  const clientPath = args.get("client") ?? process.env.OAUTH_CLIENT_PATH;
  const tokenPath = args.get("token") ?? process.env.TOKEN_PATH;
  if (!clientPath || !tokenPath) {
    console.error("usage: node drive-probe.mjs --client=<path-to-oauth_client.json> --token=<path-to-token.json>");
    console.error("   or: set OAUTH_CLIENT_PATH and TOKEN_PATH environment variables.");
    console.error("Both paths must point OUTSIDE the saci repo (hygiene, note §10).");
    process.exit(2);
  }
  return { clientPath, tokenPath };
}

// --- OAuth loopback (installed-app) flow ---

function startCallbackServer() {
  return new Promise((resolveServer) => {
    let settle;
    const codePromise = new Promise((resolve, reject) => {
      settle = { resolve, reject };
    });
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://127.0.0.1");
      if (url.pathname !== CALLBACK_PATH) {
        res.writeHead(404);
        res.end();
        return;
      }
      const errParam = url.searchParams.get("error");
      const code = url.searchParams.get("code");
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Authorization response received. Return to the terminal.");
      server.close();
      if (errParam) settle.reject(new Error(`consent denied: ${errParam}`));
      else if (!code) settle.reject(new Error("callback carried no code parameter"));
      else settle.resolve(code);
    });
    server.listen(0, "127.0.0.1", () =>
      resolveServer({ port: server.address().port, codePromise }));
  });
}

async function authorizeInteractive(clientId, clientSecret, tokenPath) {
  const { port, codePromise } = await startCallbackServer();
  const redirectUri = `http://127.0.0.1:${port}${CALLBACK_PATH}`;
  const client = new OAuth2Client({ clientId, clientSecret, redirectUri });
  const authUrl = client.generateAuthUrl({
    access_type: "offline", // ensures a refresh_token is issued
    prompt: "consent",
    scope: SCOPES,
  });
  console.log(`[auth] loopback server listening on ${redirectUri}`);
  console.log("[auth] open this URL in your browser and authorize (do NOT paste the URL back into chat):");
  console.log(authUrl);
  const code = await codePromise;
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  await writeFile(tokenPath, JSON.stringify(tokens, null, 2));
  console.log(`[auth] loopback flow completed; token saved to ${tokenPath}`);
  console.log(`[auth] token minted at: ${new Date().toISOString()} (longevity observation start, D5)`);
  return client;
}

async function getAuthorizedClient(clientPath, tokenPath) {
  const raw = JSON.parse(await readFile(clientPath, "utf8"));
  const key = raw.installed ?? raw.web;
  if (!key) {
    throw new Error('oauth_client.json has neither "installed" nor "web" section — recreate as Desktop app (note §5)');
  }
  if (!raw.installed) {
    console.warn('[auth] WARNING: client is not Desktop type ("installed") — redirect_uri errors likely (note §6)');
  }
  let client;
  if (existsSync(tokenPath)) {
    client = new OAuth2Client({ clientId: key.client_id, clientSecret: key.client_secret });
    client.setCredentials(JSON.parse(await readFile(tokenPath, "utf8")));
    console.log(`[auth] reusing existing token at ${tokenPath} (no browser needed)`);
  } else {
    client = await authorizeInteractive(key.client_id, key.client_secret, tokenPath);
  }
  client.on("tokens", (fresh) => {
    const merged = { ...client.credentials, ...fresh };
    writeFile(tokenPath, JSON.stringify(merged, null, 2)).catch((e) =>
      console.error(`[auth] failed to persist refreshed token: ${e.message}`));
  });
  const creds = client.credentials;
  console.log(`[auth] refresh_token present: ${Boolean(creds.refresh_token)}`);
  console.log(`[auth] access token expiry: ${creds.expiry_date ? new Date(creds.expiry_date).toISOString() : "n/a"}`);
  console.log(`[auth] granted scope string: ${creds.scope ?? "(not recorded in token)"}`);
  return client;
}

// --- The four operations (spike question 4) ---

async function opResolveFolder(drive) {
  const res = await drive.files.get({
    fileId: PROBE_FOLDER_ID,
    fields: "id, name, mimeType",
    supportsAllDrives: true,
  });
  console.log(`[op-a] PASS — folder resolved: id=${res.data.id} name="${res.data.name}" mimeType=${res.data.mimeType}`);
}

async function opVerifyChild(drive) {
  const safeName = VERIFY_CHILD_NAME.replace(/'/g, "\\'");
  const res = await drive.files.list({
    q: `'${PROBE_FOLDER_ID}' in parents and name = '${safeName}' and trashed = false`,
    fields: "files(id, name, mimeType, owners(emailAddress))",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    pageSize: 10,
  });
  const files = res.data.files ?? [];
  if (files.length === 0) {
    throw new Error(`child "${VERIFY_CHILD_NAME}" not visible in folder ${PROBE_FOLDER_ID} under the current SCOPES — if it exists in the Drive UI, the scope hides it (spike question 3)`);
  }
  const owner = files[0].owners?.[0]?.emailAddress ?? "n/a";
  console.log(`[op-b] PASS — child "${files[0].name}" found: id=${files[0].id} mimeType=${files[0].mimeType} owner=${owner}`);
}

async function opUpload(drive) {
  const body = `saci 046 probe upload — ${new Date().toISOString()}\n`;
  const res = await drive.files.create({
    requestBody: { name: UPLOAD_FILE_NAME, parents: [PROBE_FOLDER_ID] },
    media: { mimeType: "text/plain", body },
    fields: "id, name, parents",
    supportsAllDrives: true,
  });
  console.log(`[op-c] PASS — uploaded "${res.data.name}": id=${res.data.id} parents=${JSON.stringify(res.data.parents)}`);
  return res.data.id;
}

async function opReadContent(drive, ownUploadId) {
  const target = READ_FILE_ID || ownUploadId;
  const label = READ_FILE_ID ? "cross-user target" : "own upload";
  if (!target) {
    throw new Error("no read target: op (c) failed and READ_FILE_ID is empty");
  }
  const res = await drive.files.get(
    { fileId: target, alt: "media", supportsAllDrives: true },
    { responseType: "text" },
  );
  const text = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
  console.log(`[op-d] PASS — read ${label} id=${target}: ${Buffer.byteLength(text)} bytes, first line: "${text.split("\n")[0]}"`);
}

// --- Entry point ---

async function main() {
  const { clientPath, tokenPath } = resolvePaths();
  console.log(`[probe] node ${process.version} on ${process.platform}`);
  console.log("[probe] scopes under test:");
  for (const s of SCOPES) console.log(`[probe]   ${s}`);
  console.log(`[probe] client file: ${clientPath} (exists: ${existsSync(clientPath)})`);
  console.log(`[probe] token file:  ${tokenPath} (exists: ${existsSync(tokenPath)})`);
  if (PROBE_FOLDER_ID.startsWith("REPLACE") || VERIFY_CHILD_NAME.startsWith("REPLACE")) {
    console.error("[probe] PROBE_FOLDER_ID / VERIFY_CHILD_NAME still hold placeholders — edit the constants at the top first (run-instructions.md step 4)");
    process.exit(2);
  }

  const auth = await getAuthorizedClient(clientPath, tokenPath);
  const drive = google.drive({ version: "v3", auth });

  const failures = [];
  let ownUploadId = null;
  try { await opResolveFolder(drive); } catch (e) { failures.push("a"); reportFailure("op-a", e); }
  try { await opVerifyChild(drive); } catch (e) { failures.push("b"); reportFailure("op-b", e); }
  try { ownUploadId = await opUpload(drive); } catch (e) { failures.push("c"); reportFailure("op-c", e); }
  try { await opReadContent(drive, ownUploadId); } catch (e) { failures.push("d"); reportFailure("op-d", e); }

  console.log(`[probe] RESULT: ${4 - failures.length}/4 operations passed under: ${SCOPES.join(" + ")}`);
  if (failures.length > 0) {
    console.log(`[probe] failed operations: ${failures.join(", ")}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  reportFailure("probe", e);
  process.exitCode = 1;
});
