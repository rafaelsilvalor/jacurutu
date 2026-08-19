import { test } from "node:test";
import assert from "node:assert";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  readReportEntry,
  readReportState,
  writeReportEntry,
  REPORT_STATE_FILENAME,
} from "./report-state.js";

// Every case runs against a temp dir: no network, no credentials, no ~/.jacurutu. The
// path is injected exactly as cli.ts injects it (D1), so nothing here can reach the
// operator's real state file.

/** Sandbox holding one state file path; `content` seeds it, `null` leaves it missing. */
function makeSandbox(content: string | null): { base: string; filePath: string } {
  const base = mkdtempSync(path.join(tmpdir(), "jacurutu-report-state-"));
  // path.join, never a literal separator (R1) — and the same constant cli.ts uses.
  const filePath = path.join(base, REPORT_STATE_FILENAME);
  if (content !== null) {
    writeFileSync(filePath, content);
  }
  return { base, filePath };
}

function entry(spreadsheetId: string, createdAt = "2026-08-15T12:00:00.000Z") {
  return { spreadsheetId, createdAt };
}

test("an absent state file yields an empty state, not a failure (first run)", async () => {
  const { base, filePath } = makeSandbox(null);
  try {
    const state = await readReportState(filePath);
    assert.deepStrictEqual(state, { reports: {} });
    // The read must not create the file: a run that creates no report writes no state.
    assert.ok(!existsSync(filePath), "readReportState must not create the file");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("write then read round-trips the entry; on-disk form is 2-space JSON with a newline", async () => {
  const { base, filePath } = makeSandbox(null);
  try {
    await writeReportEntry(filePath, "looker", entry("sheet-abc"));

    const raw = readFileSync(filePath, "utf8");
    assert.strictEqual(
      raw,
      `{\n  "reports": {\n    "looker": {\n      "spreadsheetId": "sheet-abc",\n      "createdAt": "2026-08-15T12:00:00.000Z"\n    }\n  }\n}\n`,
    );

    const state = await readReportState(filePath);
    assert.deepStrictEqual(state, { reports: { looker: entry("sheet-abc") } });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("writing a second profile leaves the first profile's entry intact (D1)", async () => {
  const { base, filePath } = makeSandbox(null);
  try {
    await writeReportEntry(filePath, "looker", entry("sheet-first"));
    await writeReportEntry(filePath, "weekly", entry("sheet-second"));

    const state = await readReportState(filePath);
    // This is the decision this test exists to pin, not a behavior it happens to
    // cover. A blind overwrite here would erase the first profile's spreadsheet id
    // while that spreadsheet stays alive in Drive and the team keeps opening it —
    // Jacurutu would then create a second report nobody is shared into, and the team
    // would go on reading the first one as if it were current.
    assert.deepStrictEqual(
      state.reports["looker"],
      entry("sheet-first"),
      "writing profile B erased profile A's spreadsheet id: A's report is now orphaned in Drive and the next A run creates a second one",
    );
    assert.deepStrictEqual(state.reports["weekly"], entry("sheet-second"));
    assert.deepStrictEqual(Object.keys(state.reports).sort(), ["looker", "weekly"]);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("malformed JSON throws naming the state file path", async () => {
  const { base, filePath } = makeSandbox("{ not json");
  try {
    await assert.rejects(readReportState(filePath), (error: Error) => {
      assert.match(error.message, /Malformed JSON in report state file/);
      assert.match(error.message, new RegExp(filePath.replace(/\\/g, "\\\\")));
      return true;
    });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("a non-object root, and a non-object reports, both throw", async () => {
  for (const bad of [`"looker"`, `[1, 2]`, `null`, `42`]) {
    const { base, filePath } = makeSandbox(bad);
    try {
      await assert.rejects(readReportState(filePath), (error: Error) => {
        assert.match(error.message, /must hold a JSON object/);
        return true;
      });
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  }
  for (const bad of [`{}`, `{ "reports": [] }`, `{ "reports": "none" }`]) {
    const { base, filePath } = makeSandbox(bad);
    try {
      await assert.rejects(readReportState(filePath), (error: Error) => {
        assert.match(error.message, /reports must be a JSON object/);
        return true;
      });
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  }
});

test("an entry missing or malforming a field throws naming that field", async () => {
  const cases: [string, RegExp][] = [
    [`{ "reports": { "looker": { "createdAt": "2026-08-15T12:00:00.000Z" } } }`, /spreadsheetId must be a non-empty string/],
    [`{ "reports": { "looker": { "spreadsheetId": "", "createdAt": "x" } } }`, /spreadsheetId must be a non-empty string/],
    [`{ "reports": { "looker": { "spreadsheetId": 7, "createdAt": "x" } } }`, /spreadsheetId must be a non-empty string/],
    [`{ "reports": { "looker": { "spreadsheetId": "sheet-abc" } } }`, /createdAt must be a non-empty string/],
    [`{ "reports": { "looker": "sheet-abc" } }`, /must be a JSON object/],
  ];
  for (const [bad, expected] of cases) {
    const { base, filePath } = makeSandbox(bad);
    try {
      await assert.rejects(readReportState(filePath), (error: Error) => {
        assert.match(error.message, expected);
        // The offending profile is named, so the operator knows which line to fix.
        assert.match(error.message, /reports\."looker"/);
        return true;
      });
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  }
});

test("readReportEntry answers null for a profile with no report, and the entry otherwise", async () => {
  const { base, filePath } = makeSandbox(null);
  try {
    // Absent file: null, not a throw — the first run of the first profile.
    assert.strictEqual(await readReportEntry(filePath, "looker"), null);

    await writeReportEntry(filePath, "looker", entry("sheet-abc"));
    assert.deepStrictEqual(await readReportEntry(filePath, "looker"), entry("sheet-abc"));
    // Present file, unknown profile: still null, still not a throw.
    assert.strictEqual(await readReportEntry(filePath, "weekly"), null);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
