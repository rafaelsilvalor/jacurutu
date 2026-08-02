#!/usr/bin/env node
// Throwaway live smoke for brief 047 (@saci/adapter-drive). NOT product code.
// Exercises all five DriveGateway primitives against real Drive, through the built
// adapter — it re-implements no Drive call of its own (that is the point: what runs
// here is the code that ships).
//
// Execution model (brief 047 D3): the owner runs this on their Windows machine and
// pastes the output back. The executor never runs it — the sandbox cannot reach
// Google and OAuth needs a real browser.
//
// Credential hygiene (binding — docs/explorations/drive-oauth.md §10): credentials
// are read from ~/.saci/ through the adapter's own resolver. This script never reads,
// prints, or embeds their contents. Evidence lines carry ids, names, paths, byte
// counts, and scope strings only.
//
// The authorization URL embeds the client id, so it is redacted out of the terminal:
// the adapter's progress sink is injected here (`AuthorizeLog`), and this script writes
// the URL to a temp file and prints only its path. The whole terminal output is then
// safe to paste with no line-by-line judgement — see `redactingLog` below.
//
// Targets arrive as CLI args or environment variables — no folder id, file id, or
// account identifier is hardcoded in this committed file.
//
// Usage (from the repo root, after `npm install` and `npm run build`):
//   node docs/tasks/047-adapter-drive/drive-smoke.mjs --folder=<FOLDER_ID> --child=<EXISTING_CHILD_NAME>
//   ...or set SACI_SMOKE_FOLDER_ID and SACI_SMOKE_CHILD_NAME instead.

import { existsSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";

const ADAPTER_ENTRY = "../../../packages/adapter-drive/dist/index.js";
const STEP_COUNT = 6;
const UPLOAD_FILE_NAME = "saci-047-smoke.txt";
/** Host every Google consent URL starts with — the content test, not a line position. */
const AUTH_URL_HOST = "https://accounts.google.com/";
/** Where the redacted authorization URL goes. Outside the repo, and never paste material. */
const AUTH_URL_FILE = path.join(tmpdir(), "saci-047-auth-url.txt");
/**
 * Phrases identifying the adapter's "open the URL below" preamble. Either match is
 * enough; both are content tests, so a reworded auth.ts makes the line print
 * unnecessarily — it can never make a URL leak, since the URL is detected separately.
 */
const AUTH_PREAMBLE_MARKERS = ["open the URL below", "carries the client id"];

function fail(message) {
  console.error(`[smoke] ${message}`);
  process.exit(2);
}

/** Read one target from `--flag=value` or an environment variable; neither is optional. */
function readTarget(flag, envVar, description) {
  const prefix = `--${flag}=`;
  const fromArgv = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  const value = fromArgv ? fromArgv.slice(prefix.length) : (process.env[envVar] ?? "");
  if (value.trim() === "") {
    fail(
      `missing ${description}: pass ${prefix}<value> or set ${envVar}. ` +
        "See docs/tasks/047-adapter-drive/run-instructions.md.",
    );
  }
  return value.trim();
}

// The built adapter, not the source — the smoke's whole value is exercising shipped code.
let adapter;
try {
  adapter = await import(ADAPTER_ENTRY);
} catch (error) {
  fail(
    `cannot load the built adapter (${ADAPTER_ENTRY}): ${error.message}. ` +
      "Run `npm install` and `npm run build` at the repo root first.",
  );
}

const { createDriveGateway, defaultCredentialPaths, DRIVE_SCOPES } = adapter;

const folderId = readTarget("folder", "SACI_SMOKE_FOLDER_ID", "target folder id");
const childName = readTarget("child", "SACI_SMOKE_CHILD_NAME", "existing human-created child name");

const failures = [];
const created = { folderId: null, folderName: null, fileId: null, fileName: null };

/** Run one numbered step; a failure is recorded and reported, never swallowed (R4). */
async function step(number, label, run) {
  try {
    const line = await run();
    console.log(`[step-${number}] PASS — ${label}: ${line}`);
    return true;
  } catch (error) {
    // The adapter's message already names operation, target, status and a hint.
    console.error(`[step-${number}] FAIL — ${label}: ${error.message}`);
    failures.push(`${number} (${label})`);
    return false;
  }
}

/**
 * A held-back preamble line, waiting to learn whether the URL it announces gets
 * redacted. `null` means nothing is held. Never dropped without a decision: it is
 * either replaced by the redaction notice or flushed verbatim.
 */
let heldPreamble = null;

function flushHeldPreamble() {
  if (heldPreamble !== null) {
    console.log(heldPreamble);
    heldPreamble = null;
  }
}

function isPreamble(line) {
  return AUTH_PREAMBLE_MARKERS.some((marker) => line.includes(marker));
}

/**
 * Write the URL out of the terminal. Returns `null` on success, or the reason it could
 * not be redacted — returned rather than printed so the caller controls line order:
 * the REDACTION FAILED marker has to sit directly above the URL it warns about.
 */
function redactAuthUrl(line) {
  if (!line.includes(AUTH_URL_HOST)) {
    console.log(
      `[smoke] a URL line from the auth flow does not start with ${AUTH_URL_HOST} — ` +
        "redacting it anyway; this detector may be stale, tell the executor",
    );
  }
  try {
    writeFileSync(AUTH_URL_FILE, `${line}\n`, "utf8");
    return null;
  } catch (error) {
    return `could not write ${AUTH_URL_FILE}: ${error.message}`;
  }
}

/**
 * The adapter's authorization progress sink, with the URL line redacted. Detection is by
 * content — any bare `https://` line out of the auth flow is URL material — because a
 * position-based rule breaks the moment the adapter logs one more line.
 *
 * The "open the URL below ... it carries the client id" preamble is held back one line
 * and then dropped, but ONLY when the redaction succeeded: with the URL gone, "below"
 * points at nothing, and the notice printed instead carries the same instruction and the
 * same client-id warning. When redaction fails and the raw URL is printed, the preamble
 * is correct again and is flushed ahead of it.
 *
 * Deliberate coupling, visible here for whoever edits `auth.ts` next: the preamble is
 * only suppressed when the URL is the very next logged line. Any other line in between
 * flushes it, and a preamble with no URL after it is flushed when authorization ends —
 * so nothing is ever silently swallowed.
 *
 * Two loud-failure paths, because a redactor that quietly stops redacting is worse than
 * none: a URL whose host is not the expected one is still redacted but reported as a
 * possibly-stale detector, and a failed write prints the REDACTION FAILED marker before
 * the raw URL — warning the owner in the same place the risk appears rather than
 * blocking the run.
 */
function redactingLog(line) {
  if (isPreamble(line)) {
    flushHeldPreamble();
    heldPreamble = line;
    return;
  }
  if (!line.trimStart().startsWith("https://")) {
    flushHeldPreamble();
    console.log(line);
    return;
  }
  const failure = redactAuthUrl(line);
  if (failure !== null) {
    flushHeldPreamble();
    console.log(
      "[smoke] REDACTION FAILED — do not paste the next line: it is the authorization " +
        `URL and it embeds the client id. Reason: ${failure}`,
    );
    console.log(line);
    return;
  }
  heldPreamble = null;
  console.log(`[drive-auth] authorization URL written to ${AUTH_URL_FILE}`);
  console.log(
    "[smoke] open that file, paste the URL into a browser, and authorize. The file holds " +
      "a client-id-bearing URL: never paste its contents and never copy it into the repo.",
  );
}

function skip(number, label, reason) {
  console.error(`[step-${number}] BLOCKED — ${label}: ${reason}`);
  failures.push(`${number} (${label}, blocked)`);
}

function reportEnvironment() {
  const paths = defaultCredentialPaths();
  console.log(`[smoke] brief 047 adapter-drive live smoke — ${new Date().toISOString()}`);
  console.log(`[smoke] node ${process.version} on ${process.platform} (${process.arch})`);
  console.log("[smoke] requested scopes:");
  for (const scope of DRIVE_SCOPES) {
    console.log(`[smoke]   ${scope}`);
  }
  console.log(
    `[smoke] oauth client file: ${paths.oauthClientPath} (exists: ${existsSync(paths.oauthClientPath)})`,
  );
  console.log(`[smoke] token file: ${paths.tokenPath} (exists: ${existsSync(paths.tokenPath)})`);
  console.log(`[smoke] target folder id: ${folderId}`);
  console.log(`[smoke] expected existing child: "${childName}"`);
}

async function main() {
  reportEnvironment();

  const drive = await createDriveGateway({ log: redactingLog });
  // Authorization is over: a preamble still held here announced a URL that never came.
  flushHeldPreamble();

  await step(1, "resolveFolder on the target folder", async () => {
    const item = await drive.resolveFolder(folderId);
    return `id=${item.id} name="${item.name}" mimeType=${item.mimeType}`;
  });

  await step(2, `findChild finds the human-created "${childName}"`, async () => {
    const item = await drive.findChild(folderId, childName);
    if (item === null) {
      throw new Error(
        `expected a child named "${childName}" under ${folderId}, got null — either the name ` +
          "differs from what is in Drive, or the granted scopes do not expose it",
      );
    }
    return `id=${item.id} name="${item.name}" mimeType=${item.mimeType}`;
  });

  const absentName = `saci-047-absent-${randomUUID()}`;
  await step(3, "findChild returns null for a name that cannot exist", async () => {
    const item = await drive.findChild(folderId, absentName);
    if (item !== null) {
      throw new Error(`expected null for "${absentName}", got id=${item.id} — name collision`);
    }
    return `null for "${absentName}" (the absence answer the ship layer reads)`;
  });

  // Step 4 is the reason this smoke exists: the 046 probe never exercised createFolder,
  // so this is its first live evidence anywhere in the project.
  const folderName = `saci-047-smoke-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const createdFolder = await step(
    4,
    "createFolder — NEWLY EVIDENCED HERE (the 046 probe never ran it)",
    async () => {
      const item = await drive.createFolder(folderId, folderName);
      created.folderId = item.id;
      created.folderName = item.name;
      return `id=${item.id} name="${item.name}" mimeType=${item.mimeType}`;
    },
  );

  const localFilePath = path.join(tmpdir(), UPLOAD_FILE_NAME);
  const body = `saci 047 adapter-drive smoke — ${new Date().toISOString()}\n`;
  let uploaded = false;

  if (!createdFolder) {
    skip(5, "uploadFile into the created folder", "step 4 did not create a folder");
  } else {
    uploaded = await step(5, "uploadFile into the created folder", async () => {
      await writeFile(localFilePath, body, "utf8");
      const item = await drive.uploadFile(created.folderId, UPLOAD_FILE_NAME, localFilePath);
      created.fileId = item.id;
      created.fileName = item.name;
      return `id=${item.id} name="${item.name}" mimeType=${item.mimeType} from ${localFilePath}`;
    });
  }

  if (!uploaded) {
    skip(6, "readFileContent round-trips the uploaded bytes", "step 5 did not upload a file");
  } else {
    await step(6, "readFileContent round-trips the uploaded bytes", async () => {
      const text = await drive.readFileContent(created.fileId);
      if (text !== body) {
        throw new Error(
          `content mismatch: wrote ${Buffer.byteLength(body)} bytes, read ${Buffer.byteLength(text)} bytes`,
        );
      }
      return `${Buffer.byteLength(text)} bytes identical to what was uploaded, first line: "${text.split("\n")[0]}"`;
    });
  }

  console.log(`[smoke] RESULT: ${STEP_COUNT - failures.length}/${STEP_COUNT} steps passed`);
  if (failures.length > 0) {
    console.log(`[smoke] failed steps: ${failures.join(", ")}`);
    process.exitCode = 1;
  }

  // No delete call: deletion is not on the port (five primitives, brief 047 D1). The ids
  // are printed so the owner can remove the leftovers by hand in the Drive UI.
  console.log(
    `[smoke] CLEANUP — delete by hand: folder id=${created.folderId ?? "(none created)"} ` +
      `name="${created.folderName ?? "-"}"`,
  );
  console.log(
    `[smoke] CLEANUP — delete by hand: file id=${created.fileId ?? "(none created)"} ` +
      `name="${created.fileName ?? "-"}"`,
  );
}

main().catch((error) => {
  // Anything reaching here failed outside a step — most likely authorization.
  console.error(`[smoke] ABORTED — ${error.message}`);
  process.exitCode = 1;
});
