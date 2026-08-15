import { test } from "node:test";
import assert from "node:assert";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { ColumnSelection, Issue, Payload, SpreadsheetGateway, SpreadsheetRef } from "@saci/core";

import { runReport, type MakeSpreadsheetGateway } from "./run-report.js";
import { readReportEntry } from "./report-state.js";
import type { ExportConfig } from "./run-export.js";

// No network and no credentials anywhere in this file (constraint 3): the gateway is a
// fake, the state file is a temp file, and nothing imports @saci/adapter-sheets.

/** A fixed clock, so the stored createdAt is asserted exactly rather than by shape. */
const FIXED_NOW = "2026-08-15T12:00:00.000Z";
const CREATED_ID = "sheet-created-001";
const STORED_ID = "sheet-stored-002";
const RECIPIENT = "teammate@example.invalid";

// Same fixture shape run-export.test.ts uses, so the grid this command hands to the
// gateway is comparable against the CSV the same profile would have produced.
function sampleIssue(key: string, overrides: Partial<Issue> = {}): Issue {
  return {
    key,
    summary: "Banner principal",
    parent_key: "MCA-1",
    parent_summary: "Concurso PF 2026",
    status_jira: "FILA DE EXECUCAO",
    vertical_raw: "[EC] Concursos",
    entrega_iso: "2026-06-10T19:00:00.000-0300",
    copy_url: null,
    copy_source: "fallback",
    jira_updated_at: "2026-06-05T10:00:00-03:00",
    ...overrides,
  };
}

function samplePayload(issues: Issue[]): Payload {
  return {
    schema_version: "2.0",
    run_date: "2026-06-05",
    generated_at: "2026-06-05T12:25:43-03:00",
    issues,
    filtered_out: [],
    warnings: [],
  };
}

interface Sandbox {
  base: string;
  payloadPath: string;
  configPath: string;
  statePath: string;
}

/** Temp dir with a payload, an export config, and a state path that may not exist. */
function makeSandbox(issues: Issue[] = [sampleIssue("MCA-100"), sampleIssue("MCA-101")]): Sandbox {
  const base = mkdtempSync(path.join(tmpdir(), "saci-run-report-"));
  const payloadPath = path.join(base, "payload.json");
  const configPath = path.join(base, "export-config.json");
  const statePath = path.join(base, "report.json");
  const config: ExportConfig = {
    profiles: {
      // `format` and `output` are ignored by report and present anyway (D2): a profile
      // is shared with `export`, and the command must not reject one because of them.
      team: {
        format: "csv",
        columns: ["key", { id: "summary", rename: "Resumo" }],
        output: "out.csv",
      },
    },
  };
  writeFileSync(payloadPath, JSON.stringify(samplePayload(issues)), "utf8");
  writeFileSync(configPath, JSON.stringify(config), "utf8");
  return { base, payloadPath, configPath, statePath };
}

interface Fake {
  gateway: SpreadsheetGateway;
  calls: string[];
  grids: ColumnSelection[];
  recipients: string[];
}

/** In-memory SpreadsheetGateway recording every call in order. */
function makeFake(writeGridError?: unknown, shareError?: unknown): Fake {
  const calls: string[] = [];
  const grids: ColumnSelection[] = [];
  const recipients: string[] = [];
  const gateway: SpreadsheetGateway = {
    async createSpreadsheet(name: string): Promise<SpreadsheetRef> {
      calls.push(`createSpreadsheet:${name}`);
      return { id: CREATED_ID, name };
    },
    async writeGrid(spreadsheetId: string, table: ColumnSelection): Promise<void> {
      calls.push(`writeGrid:${spreadsheetId}`);
      if (writeGridError !== undefined) {
        throw writeGridError;
      }
      grids.push(table);
    },
    async shareAsReader(spreadsheetId: string, recipient: string): Promise<void> {
      calls.push(`shareAsReader:${spreadsheetId}`);
      if (shareError !== undefined) {
        throw shareError;
      }
      recipients.push(recipient);
    },
  };
  return { gateway, calls, grids, recipients };
}

/** The thunk plus its call counter — D7's "constructed once, lazily". */
function makeThunk(gateway: SpreadsheetGateway): {
  make: MakeSpreadsheetGateway;
  counter: { calls: number };
} {
  const counter = { calls: 0 };
  const make: MakeSpreadsheetGateway = async () => {
    counter.calls += 1;
    return gateway;
  };
  return { make, counter };
}

/**
 * The error shape adapter-sheets' `toSheetsError` produces: a classified message with a
 * sanitized `cause` carrying the numeric status (errors.ts `sanitizedCause`). Built by
 * hand so this file imports nothing from the adapter and touches no network.
 */
function sheetsError(status: number, message: string): Error {
  const cause = new Error(message);
  Object.assign(cause, { status });
  return new Error(`Sheets writeGrid failed: status=${status} message="${message}".`, { cause });
}

/** Seed the state file as a previous run would have left it. */
function seedState(statePath: string, profileName: string, spreadsheetId: string): void {
  writeFileSync(
    statePath,
    `${JSON.stringify({ reports: { [profileName]: { spreadsheetId, createdAt: FIXED_NOW } } }, null, 2)}\n`,
    "utf8",
  );
}

test("first run with no state creates, persists the id, shares, and writes the grid", async () => {
  const { base, payloadPath, configPath, statePath } = makeSandbox();
  try {
    const fake = makeFake();
    const { make, counter } = makeThunk(fake.gateway);

    const result = await runReport(make, {
      payloadPath,
      configPath,
      profileName: "team",
      statePath,
      shareWith: RECIPIENT,
      now: () => FIXED_NOW,
    });

    assert.deepStrictEqual(result, {
      spreadsheetId: CREATED_ID,
      created: true,
      rowCount: 2,
      share: "granted",
    });
    // Grid BEFORE share: the report is complete before the share is attempted.
    assert.deepStrictEqual(fake.calls, [
      `createSpreadsheet:Saci report: team`,
      `writeGrid:${CREATED_ID}`,
      `shareAsReader:${CREATED_ID}`,
    ]);
    assert.deepStrictEqual(fake.recipients, [RECIPIENT]);
    // The exact stored string, against the injected clock — not a shape check.
    assert.deepStrictEqual(await readReportEntry(statePath, "team"), {
      spreadsheetId: CREATED_ID,
      createdAt: FIXED_NOW,
    });
    assert.strictEqual(counter.calls, 1, "the gateway thunk must be awaited exactly once");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("second run with state reuses the id, creates nothing, and shares nothing", async () => {
  const { base, payloadPath, configPath, statePath } = makeSandbox();
  try {
    seedState(statePath, "team", STORED_ID);
    const before = readFileSync(statePath, "utf8");
    const fake = makeFake();
    const { make, counter } = makeThunk(fake.gateway);

    const result = await runReport(make, {
      payloadPath,
      configPath,
      profileName: "team",
      statePath,
      // --share-with on a run that creates nothing is not an error and not silent (D3).
      shareWith: RECIPIENT,
      now: () => "2026-09-01T00:00:00.000Z",
    });

    assert.deepStrictEqual(result, {
      spreadsheetId: STORED_ID,
      created: false,
      rowCount: 2,
      share: "skipped-existing",
    });
    // One identity across runs: no second spreadsheet, and no second share.
    assert.deepStrictEqual(
      fake.calls,
      [`writeGrid:${STORED_ID}`],
      "a second run created or shared something: the team's link now points at a report Saci stopped updating",
    );
    assert.deepStrictEqual(fake.recipients, []);
    assert.strictEqual(
      readFileSync(statePath, "utf8"),
      before,
      "a run that created nothing rewrote the state file",
    );
    assert.strictEqual(counter.calls, 1, "the gateway thunk must be awaited exactly once");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("a share failure on a creating run still leaves the grid written and the id stored", async () => {
  const { base, payloadPath, configPath, statePath } = makeSandbox();
  try {
    // The 2026-08-15 live failure, reproduced: a mistyped recipient, answered 400.
    const fake = makeFake(undefined, sheetsError(400, "Bad Request. User message: ..."));
    const { make } = makeThunk(fake.gateway);

    await assert.rejects(
      runReport(make, {
        payloadPath,
        configPath,
        profileName: "team",
        statePath,
        shareWith: RECIPIENT,
        now: () => FIXED_NOW,
      }),
      /status=400/,
    );

    // What the live incident cost, and what this pins: the share threw, but the
    // report is COMPLETE. Before the fix the run aborted before writeGrid and left
    // an empty spreadsheet that no later run could fill, because the state entry
    // was already stored and every later run took the reuse path.
    assert.deepStrictEqual(
      fake.calls,
      [
        `createSpreadsheet:Saci report: team`,
        `writeGrid:${CREATED_ID}`,
        `shareAsReader:${CREATED_ID}`,
      ],
      "the share was attempted before the grid was written: a share failure now leaves an empty report behind",
    );
    assert.strictEqual(fake.grids.length, 1, "the grid never reached the spreadsheet");
    assert.deepStrictEqual(await readReportEntry(statePath, "team"), {
      spreadsheetId: CREATED_ID,
      createdAt: FIXED_NOW,
    });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("first run without --share-with creates and writes but never calls shareAsReader", async () => {
  const { base, payloadPath, configPath, statePath } = makeSandbox();
  try {
    const fake = makeFake();
    const { make } = makeThunk(fake.gateway);

    const result = await runReport(make, {
      payloadPath,
      configPath,
      profileName: "team",
      statePath,
      now: () => FIXED_NOW,
    });

    assert.strictEqual(result.created, true);
    assert.strictEqual(result.share, "not-requested");
    assert.deepStrictEqual(fake.calls, [
      `createSpreadsheet:Saci report: team`,
      `writeGrid:${CREATED_ID}`,
    ]);
    assert.strictEqual(fake.grids.length, 1);
    assert.deepStrictEqual(
      fake.recipients,
      [],
      "an address reached the gateway on a run that requested no share",
    );
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("the grid handed to writeGrid is the profile's ColumnSelection, header first", async () => {
  const { base, payloadPath, configPath, statePath } = makeSandbox([
    sampleIssue("MCA-100", { summary: "Banner A" }),
    sampleIssue("MCA-101", { summary: "Banner B" }),
  ]);
  try {
    const fake = makeFake();
    const { make } = makeThunk(fake.gateway);

    await runReport(make, {
      payloadPath,
      configPath,
      profileName: "team",
      statePath,
      now: () => FIXED_NOW,
    });

    assert.strictEqual(fake.grids.length, 1);
    // Renamed header applied, profile column order preserved, one row per issue —
    // the same selection the CSV of this profile would carry.
    assert.deepStrictEqual(fake.grids[0], {
      headers: ["key", "Resumo"],
      rows: [
        ["MCA-100", "Banner A"],
        ["MCA-101", "Banner B"],
      ],
    });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("a 404 on a stored id fails naming the fix, creates nothing, and leaves state untouched", async () => {
  const { base, payloadPath, configPath, statePath } = makeSandbox();
  try {
    seedState(statePath, "team", STORED_ID);
    const before = readFileSync(statePath, "utf8");
    const fake = makeFake(sheetsError(404, "File not found."));
    const { make } = makeThunk(fake.gateway);

    await assert.rejects(
      runReport(make, {
        payloadPath,
        configPath,
        profileName: "team",
        statePath,
        now: () => FIXED_NOW,
      }),
      (error: Error) => {
        assert.match(error.message, /"team"/, "the message must name the profile");
        assert.match(error.message, new RegExp(STORED_ID), "the message must name the id");
        assert.match(
          error.message,
          new RegExp(statePath.replace(/\\/g, "\\\\")),
          "the message must name the state file's path",
        );
        assert.match(error.message, /remove the "team" entry/, "the message must name the fix");
        return true;
      },
    );

    // D5 is about what does NOT happen: no replacement spreadsheet, and no state edit.
    assert.deepStrictEqual(
      fake.calls,
      [`writeGrid:${STORED_ID}`],
      "a 404 was answered by creating a second spreadsheet — the team keeps opening the dead link",
    );
    assert.strictEqual(
      readFileSync(statePath, "utf8"),
      before,
      "the failing run rewrote the state file: one bad run became a permanent inconsistency",
    );
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("an unknown profile fails before the gateway thunk is ever called", async () => {
  const { base, payloadPath, configPath, statePath } = makeSandbox();
  try {
    const fake = makeFake();
    const { make, counter } = makeThunk(fake.gateway);

    await assert.rejects(
      runReport(make, {
        payloadPath,
        configPath,
        profileName: "typo",
        statePath,
        shareWith: RECIPIENT,
        now: () => FIXED_NOW,
      }),
      /Unknown export profile: "typo"/,
    );

    assert.strictEqual(
      counter.calls,
      0,
      "a mistyped --profile constructed the gateway: a config typo would open a browser consent window on the designer's machine",
    );
    assert.deepStrictEqual(fake.calls, []);
    assert.ok(!existsSync(statePath), "a failed run must not create the state file");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("a non-404 gateway failure propagates unchanged, and writes no state", async () => {
  const { base, payloadPath, configPath, statePath } = makeSandbox();
  try {
    seedState(statePath, "team", STORED_ID);
    const before = readFileSync(statePath, "utf8");
    const fake = makeFake(sheetsError(500, "Backend error."));
    const { make } = makeThunk(fake.gateway);

    // Only 404 carries D5's meaning; a 500 must not be dressed up as a missing report.
    await assert.rejects(
      runReport(make, {
        payloadPath,
        configPath,
        profileName: "team",
        statePath,
        now: () => FIXED_NOW,
      }),
      (error: Error) => {
        assert.match(error.message, /status=500/);
        assert.ok(
          !error.message.includes("remove the"),
          "a 500 was reported as D5's deleted-spreadsheet case",
        );
        return true;
      },
    );
    assert.strictEqual(readFileSync(statePath, "utf8"), before);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
