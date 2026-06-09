import { test } from "node:test";
import assert from "node:assert";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { Issue, JiraGateway, Payload } from "@saci/core";
import type { IssueDropLog } from "@saci/adapter-jira";
import type { IssueWarningLog } from "@saci/adapter-jira";

import { runFetch } from "./run-fetch.js";

function sampleIssue(key: string): Issue {
  return {
    key,
    summary: "Peça acentuada ção",
    parent_key: "MCA-1",
    parent_summary: "Parent",
    status_jira: "FILA DE EXECUCAO",
    vertical_raw: "[EC] Concursos",
    entrega_iso: null,
    copy_url: null,
    copy_source: "fallback",
    jira_updated_at: "2026-06-05T10:00:00-03:00",
  };
}

/**
 * Build a fake gateway factory that exercises BOTH capturing sinks end-to-end:
 * `fetchIssues` emits one drop via `dropLog` and one warning via `warningLog`,
 * then returns a single kept issue. The warning's `cause` ("vertical missing")
 * must surface as `warnings[].issue` in the written payload (D1).
 */
function fakeMakeGateway(): (dropLog: IssueDropLog, warningLog: IssueWarningLog) => JiraGateway {
  return (dropLog, warningLog) => ({
    async fetchIssues(): Promise<Issue[]> {
      dropLog("MCA-99", "Template");
      warningLog("MCA-42", "vertical_raw", "vertical missing");
      return [sampleIssue("MCA-42")];
    },
  });
}

test("runFetch writes a payload with seed-order keys and the stamped clock", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "saci-runfetch-"));
  const outputPath = path.join(dir, "payload.json");
  try {
    // Fixed clock: a local time with a known offset. The stamped timestamps must
    // derive from this `now`, not the wall clock.
    const now = new Date("2026-06-05T12:25:43-03:00");
    const payload = await runFetch(fakeMakeGateway(), outputPath, now);

    const written = readFileSync(outputPath, "utf8");
    const parsed = JSON.parse(written) as Payload;

    // (2) Serialization fidelity: top-level key order preserved in the SERIALIZED
    // output (parsed from the file, not the in-memory object).
    assert.deepStrictEqual(Object.keys(parsed), [
      "schema_version",
      "run_date",
      "generated_at",
      "issues",
      "filtered_out",
      "warnings",
    ]);

    // (1) Timestamp derivation from the injected clock. run_date is the local
    // date; generated_at is ISO with the explicit offset (not UTC `Z`).
    assert.strictEqual(parsed.run_date, "2026-06-05");
    assert.match(parsed.generated_at, /^2026-06-05T\d{2}:\d{2}:43[+-]\d{2}:\d{2}$/);
    assert.ok(!parsed.generated_at.endsWith("Z"), "generated_at must carry an offset, not UTC Z");
    assert.strictEqual(parsed.schema_version, "2.0");

    // (3) Sinks end-to-end: the drop landed in filtered_out, and the warning's
    // `cause` surfaced as warnings[].issue.
    assert.deepStrictEqual(parsed.filtered_out, [{ key: "MCA-99", reason: "Template" }]);
    assert.deepStrictEqual(parsed.warnings, [
      { key: "MCA-42", field: "vertical_raw", issue: "vertical missing" },
    ]);

    // The returned payload mirrors what was written.
    assert.deepStrictEqual(payload.warnings, parsed.warnings);
    assert.deepStrictEqual(payload.filtered_out, parsed.filtered_out);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("runFetch serialization is indent=2, preserves non-ASCII, and has no trailing newline", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "saci-runfetch-"));
  const outputPath = path.join(dir, "payload.json");
  try {
    const now = new Date("2026-06-05T12:25:43-03:00");
    await runFetch(fakeMakeGateway(), outputPath, now);

    const written = readFileSync(outputPath, "utf8");

    // indent=2: nested keys appear with a two-space lead.
    assert.match(written, /\n {2}"schema_version":/);
    // ensure_ascii=False equivalent: non-ASCII emitted verbatim, not \uXXXX.
    assert.ok(written.includes("Peça acentuada ção"), "non-ASCII must be preserved verbatim");
    assert.ok(!/\\u00/.test(written), "non-ASCII must not be escaped as \\uXXXX");
    // No trailing newline (matches automation/payload.json).
    assert.ok(!written.endsWith("\n"), "serialized payload must not end with a newline");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
