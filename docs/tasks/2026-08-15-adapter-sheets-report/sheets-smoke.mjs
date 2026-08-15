#!/usr/bin/env node
// Throwaway live smoke for the 2026-08-15 adapter-sheets brief. NOT product code:
// nothing imports it, no package.json references it, and it is not promoted.
//
// It exercises the BUILT adapter — packages/adapter-sheets/dist — against real
// Google, because the three things this task must prove cannot be proved by a fake:
// that the call shapes in client.ts are the ones Google accepts, that CLEAR_RANGE is
// a range Google honours, and that a shorter second run leaves no row of the first
// one behind. Run it from the repository root after `npx tsc -b`; see
// run-instructions.md.
//
// Credential hygiene (binding — docs/explorations/drive-oauth.md §10): this script
// never prints a token value, a client secret, or the --share-with address. It DOES
// print the Drive id of the file it creates, because the owner has to delete it by
// hand — and it prints that id even when a later step fails, so a partial run never
// leaves an orphan spreadsheet the owner cannot find.
//
// The read-back in steps 3 and 5 is an INSTRUMENT, not a port method. Reading a
// spreadsheet back is the reversed decision the spike rejected: the port projects
// one way and never reads. Verifying "no stale tail" nevertheless requires reading,
// so the read lives here, in this script, clearly labelled, and never in the adapter.

import { google } from "googleapis";

import { EXPORT_COLUMNS } from "../../../packages/core/dist/index.js";
import {
  authorize,
  defaultCredentialPaths,
} from "../../../packages/adapter-drive/dist/index.js";
import {
  SpreadsheetGateway,
  createGoogleSpreadsheetApi,
} from "../../../packages/adapter-sheets/dist/index.js";

// --- Policy constants for the smoke itself (R7) ---

const SHEETS_API_VERSION = "v4";
const DRIVE_API_VERSION = "v3";
const CREATED_NAME_PREFIX = "saci-sheets-smoke";
const CREATED_HEADING = "CREATED — delete this by hand";
const PERMISSION_LIST_FIELDS = "permissions(id, type, role)";
const TOTAL_STEPS = 6;

/** Rows the first write sends; the second write sends only the first of them. */
const FIRST_RUN_ROW_COUNT = 3;
/** Header + one data row: what must survive the shrinking write, and nothing more. */
const EXPECTED_ROWS_AFTER_SHRINK = 2;

const USAGE = [
  "usage: node docs/tasks/2026-08-15-adapter-sheets-report/sheets-smoke.mjs \\",
  "         --share-with=<address>",
  "",
  "  --share-with  address step 6 shares the created spreadsheet with, as reader.",
  "                Required: without it step 6 stays UNMEASURED. Never echoed back.",
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

// --- Failure reporting (R4: never swallowed, always classified) ---

function describeError(error) {
  const status = error?.response?.status ?? error?.status ?? error?.code ?? "n/a";
  const message = String(error?.message ?? error);
  return `${status} ${message}`;
}

/**
 * Run one step, print its verdict, and never rethrow. A failing step is data: the
 * deliverable is a map of what works, so the run continues past every failure and
 * the summary reports how far it got.
 */
async function runStep(label, action) {
  try {
    const detail = await action();
    console.log(`[smoke] ${label}: PASS — ${detail}`);
    return true;
  } catch (error) {
    console.log(`[smoke] ${label}: FAIL ${describeError(error)}`);
    return false;
  }
}

// --- The fixture: a ColumnSelection over core's own EXPORT_COLUMNS ---

function fixtureRow(index) {
  return EXPORT_COLUMNS.map((column) => {
    if (column === "key") return `DES-100${index + 1}`;
    if (column === "summary") return `smoke row ${index + 1}`;
    if (column === "run_date") return "2026-08-15";
    return "";
  });
}

/** `headers` plus `count` rows, in the shape `applyColumns` returns (ColumnSelection). */
function fixtureTable(count) {
  return {
    headers: [...EXPORT_COLUMNS],
    rows: Array.from({ length: count }, (_, index) => fixtureRow(index)),
  };
}

// --- The D5 instrument: a direct read, deliberately outside the port ---

/**
 * Read the first sheet back through googleapis directly. THIS IS THE INSTRUMENT the
 * header comment describes — it exists to observe the effect of `writeGrid`, and it
 * must never migrate into the adapter.
 */
async function readBackRows(auth, spreadsheetId) {
  const sheets = google.sheets({ version: SHEETS_API_VERSION, auth });
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: "A:ZZZ" });
  return response.data.values ?? [];
}

/** Also an instrument: read the granted permission back so its id/type/role can be shown. */
async function readBackPermissions(auth, spreadsheetId) {
  const drive = google.drive({ version: DRIVE_API_VERSION, auth });
  const response = await drive.permissions.list({
    fileId: spreadsheetId,
    fields: PERMISSION_LIST_FIELDS,
    supportsAllDrives: true,
  });
  return response.data.permissions ?? [];
}

// --- Entry point ---

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.has("help")) {
    console.log(USAGE);
    return;
  }
  const shareWith = flags.get("share-with") ?? "";
  if (!shareWith) {
    console.error("[smoke] --share-with is required; step 6 cannot be measured without it.");
    console.error(USAGE);
    process.exitCode = 2;
    return;
  }

  console.log(`[smoke] node ${process.version} on ${process.platform}`);
  console.log("[smoke] --share-with: supplied (never echoed)");
  console.log("[smoke] no scope change in this task: no browser consent is expected.");

  const paths = defaultCredentialPaths();
  const auth = await authorize({ paths, log: (line) => console.log(line) });
  const gateway = new SpreadsheetGateway({ api: createGoogleSpreadsheetApi(auth) });

  const name = `${CREATED_NAME_PREFIX}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  let spreadsheetId = "";
  let failures = 0;
  const record = async (label, action) => {
    if (!(await runStep(label, action))) failures += 1;
  };

  try {
    await record("STEP 1 createSpreadsheet", async () => {
      const created = await gateway.createSpreadsheet(name);
      spreadsheetId = created.id;
      return `spreadsheet created: id=${created.id} name=${created.name}`;
    });

    await record(`STEP 2 writeGrid (${FIRST_RUN_ROW_COUNT} rows)`, async () => {
      if (!spreadsheetId) throw new Error("no spreadsheet id — step 1 did not produce one");
      await gateway.writeGrid(spreadsheetId, fixtureTable(FIRST_RUN_ROW_COUNT));
      return `wrote a header plus ${FIRST_RUN_ROW_COUNT} rows`;
    });

    await record("STEP 3 read back (instrument)", async () => {
      if (!spreadsheetId) throw new Error("no spreadsheet id — step 1 did not produce one");
      const rows = await readBackRows(auth, spreadsheetId);
      const last = rows.at(-1) ?? [];
      return `sheet holds ${rows.length} rows; last row first cell="${last[0] ?? ""}"`;
    });

    await record("STEP 4 writeGrid (1 row, the shrinking case)", async () => {
      if (!spreadsheetId) throw new Error("no spreadsheet id — step 1 did not produce one");
      await gateway.writeGrid(spreadsheetId, fixtureTable(1));
      return "wrote a header plus 1 row over the previous 3-row grid";
    });

    await record("STEP 5 read back and assert no stale tail", async () => {
      if (!spreadsheetId) throw new Error("no spreadsheet id — step 1 did not produce one");
      const rows = await readBackRows(auth, spreadsheetId);
      if (rows.length !== EXPECTED_ROWS_AFTER_SHRINK) {
        const survivors = rows.slice(EXPECTED_ROWS_AFTER_SHRINK).map((row) => row[0] ?? "");
        throw new Error(
          `STALE TAIL: the sheet holds ${rows.length} rows where ${EXPECTED_ROWS_AFTER_SHRINK} ` +
            "were expected (header + 1). The shorter second run did NOT replace the first " +
            "run's grid: rows from the 3-row write are still visible below the new data, " +
            `starting with key="${survivors[0] ?? "(blank)"}". A team reading this report ` +
            "would see stale issues as current. Either the clear did not run, or " +
            "CLEAR_RANGE does not cover the cells that were written — narrow the range, " +
            "record the rejected and the accepted form, and re-run. Do not weaken the " +
            "contract to 'writes over the grid'.",
        );
      }
      return `exactly ${rows.length} rows survive (header + 1) — CLEAR_RANGE holds`;
    });

    await record("STEP 6 shareAsReader", async () => {
      if (!spreadsheetId) throw new Error("no spreadsheet id — step 1 did not produce one");
      await gateway.shareAsReader(spreadsheetId, shareWith);
      let granted = "";
      try {
        const permissions = await readBackPermissions(auth, spreadsheetId);
        const last = permissions.at(-1);
        granted = last ? ` id=${last.id} type=${last.type} role=${last.role}` : "";
      } catch (error) {
        // The grant itself succeeded; only the instrument failed (R4 — reported, not hidden).
        granted = ` (permission read-back unavailable: ${describeError(error)})`;
      }
      return `permission granted to the supplied address (withheld by this script):${granted}`;
    });
  } finally {
    // Printed in `finally` on purpose: an unexpected throw must not cost the owner the
    // id of a file this script created in their Drive.
    console.log(`[smoke] RESULT: ${TOTAL_STEPS - failures}/${TOTAL_STEPS} steps passed`);
    console.log(CREATED_HEADING);
    console.log(spreadsheetId ? `  spreadsheet: id=${spreadsheetId}` : "  (nothing was created)");
    if (failures > 0) process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`[smoke] ABORTED before or during the step loop: ${describeError(error)}`);
  process.exitCode = 1;
});
