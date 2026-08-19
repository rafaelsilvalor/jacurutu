import { test } from "node:test";
import assert from "node:assert";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import type { Issue, JiraGateway, Payload } from "@jacurutu/core";
import type { IssueDropLog } from "@jacurutu/adapter-jira";
import type { IssueWarningLog } from "@jacurutu/adapter-jira";

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
    // Port ripple: the pre-flight the composition root now runs before every
    // search. This fake models a good credential, so it resolves.
    async verifyCredentials(): Promise<void> {},
    async fetchIssues(): Promise<Issue[]> {
      dropLog("MCA-99", "Template");
      warningLog("MCA-42", "vertical_raw", "vertical missing");
      return [sampleIssue("MCA-42")];
    },
    // Port ripple (P6): the fetch run never calls this, but the fake must
    // satisfy the widened JiraGateway. Explicit throw, not a silent stub (R4).
    async fetchIssueByKey(): Promise<Issue> {
      throw new Error("fetchIssueByKey is not exercised by the fetch run");
    },
  });
}

/**
 * A gateway factory with the pre-flight and the search independently scripted.
 * `verify` and `issues` are supplied per test so ordering, refusal and the
 * escape hatch can each be driven without a bespoke fake apiece.
 */
function gatewayWith(options: {
  verify?: () => Promise<void>;
  issues: Issue[] | (() => Promise<Issue[]>);
}): (dropLog: IssueDropLog, warningLog: IssueWarningLog) => JiraGateway {
  return () => ({
    async verifyCredentials(): Promise<void> {
      if (options.verify) {
        await options.verify();
      }
    },
    async fetchIssues(): Promise<Issue[]> {
      return typeof options.issues === "function" ? options.issues() : options.issues;
    },
    async fetchIssueByKey(): Promise<Issue> {
      throw new Error("fetchIssueByKey is not exercised by the fetch run");
    },
  });
}

/** Run `body` with console.warn captured, returning everything it emitted. */
async function captureWarnings(body: () => Promise<void>): Promise<string[]> {
  const captured: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]): void => {
    captured.push(args.map((arg) => String(arg)).join(" "));
  };
  try {
    await body();
  } finally {
    console.warn = original;
  }
  return captured;
}

function sandbox(): { dir: string; outputPath: string } {
  const dir = mkdtempSync(path.join(tmpdir(), "jacurutu-runfetch-"));
  return { dir, outputPath: path.join(dir, "payload.json") };
}

const FIXED_NOW = new Date("2026-06-05T12:25:43-03:00");

test("runFetch writes a payload with seed-order keys and the stamped clock", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "jacurutu-runfetch-"));
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
  const dir = mkdtempSync(path.join(tmpdir(), "jacurutu-runfetch-"));
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

// The two tests above are also the "pre-flight passes" case: their fake resolves
// verifyCredentials, and the happy path is unchanged by this brief.

// WHEN the credentials are rejected, runFetch shall fail with THAT error before
// the search runs. The fake's fetchIssues throws a distinguishable error, so the
// assertion proves ordering rather than merely that something threw.
test("runFetch runs the credential pre-flight before fetchIssues", async () => {
  const { dir, outputPath } = sandbox();
  try {
    const makeGateway = gatewayWith({
      verify: async () => {
        throw new Error("credentials rejected by the pre-flight");
      },
      issues: async () => {
        throw new Error("fetchIssues must not run after a failed pre-flight");
      },
    });

    await assert.rejects(
      () => runFetch(makeGateway, outputPath, FIXED_NOW),
      /credentials rejected by the pre-flight/,
    );
    assert.ok(!existsSync(outputPath), "a failed pre-flight must not create the output file");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// WHEN the fetch returns zero issues over a payload that holds issues, runFetch
// shall refuse. This is the failure the brief exists to remove: an expired token
// or a wrong JQL silently replacing a good payload with an empty one.
test("runFetch refuses to overwrite a non-empty payload with an empty result", async () => {
  const { dir, outputPath } = sandbox();
  try {
    const seed = JSON.stringify({ schema_version: "2.0", issues: [sampleIssue("MCA-7")] }, null, 2);
    writeFileSync(outputPath, seed, "utf8");

    await assert.rejects(
      () => runFetch(gatewayWith({ issues: [] }), outputPath, FIXED_NOW),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /Refusing to overwrite/);
        assert.ok(
          error.message.includes("--allow-empty"),
          "the refusal must name the escape hatch that unblocks the operator",
        );
        return true;
      },
    );

    assert.strictEqual(readFileSync(outputPath, "utf8"), seed, "the prior payload must be byte-identical");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// WHEN the operator opts in, the empty payload shall be written: some days the
// answer really is zero, and the guard must not become unbypassable.
test("runFetch with allowEmpty overwrites a non-empty payload", async () => {
  const { dir, outputPath } = sandbox();
  try {
    writeFileSync(
      outputPath,
      JSON.stringify({ schema_version: "2.0", issues: [sampleIssue("MCA-7")] }, null, 2),
      "utf8",
    );

    await runFetch(gatewayWith({ issues: [] }), outputPath, FIXED_NOW, true);

    const parsed = JSON.parse(readFileSync(outputPath, "utf8")) as Payload;
    assert.deepStrictEqual(parsed.issues, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// WHEN there is no prior file, there is nothing to protect: a first run must not
// be blocked by a guard aimed at destruction.
test("runFetch writes an empty payload when no prior file exists", async () => {
  const { dir, outputPath } = sandbox();
  try {
    const payload = await runFetch(gatewayWith({ issues: [] }), outputPath, FIXED_NOW);
    assert.deepStrictEqual(payload.issues, []);
    assert.ok(existsSync(outputPath), "the empty payload must be written");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// WHEN the prior file cannot be parsed, there is nothing to protect — but the
// reason is logged rather than swallowed (R4 / A1), because an unreadable
// payload is itself worth an operator's attention.
test("runFetch writes over an unparseable prior file and logs why", async () => {
  const { dir, outputPath } = sandbox();
  try {
    writeFileSync(outputPath, "not json at all", "utf8");

    const warnings = await captureWarnings(async () => {
      await runFetch(gatewayWith({ issues: [] }), outputPath, FIXED_NOW);
    });

    const parsed = JSON.parse(readFileSync(outputPath, "utf8")) as Payload;
    assert.deepStrictEqual(parsed.issues, []);
    assert.ok(
      warnings.some((line) => line.includes("not valid JSON")),
      `expected a warning naming the cause, got ${JSON.stringify(warnings)}`,
    );
    assert.ok(warnings.some((line) => line.includes(outputPath)), "the warning must name the path");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// WHEN the prior payload is valid but already empty, nothing is lost by writing.
test("runFetch writes when the prior payload has an empty issues array", async () => {
  const { dir, outputPath } = sandbox();
  try {
    writeFileSync(outputPath, JSON.stringify({ schema_version: "2.0", issues: [] }), "utf8");

    const payload = await runFetch(gatewayWith({ issues: [] }), outputPath, FIXED_NOW);

    assert.deepStrictEqual(payload.issues, []);
    const parsed = JSON.parse(readFileSync(outputPath, "utf8")) as Payload;
    assert.deepStrictEqual(parsed.issues, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// WHEN the fetch returns issues, the prior file is irrelevant: the happy path
// overwrites exactly as it did before this brief.
test("runFetch overwrites a prior file unchanged when the fetch returns issues", async () => {
  const { dir, outputPath } = sandbox();
  try {
    writeFileSync(
      outputPath,
      JSON.stringify({ schema_version: "2.0", issues: [sampleIssue("MCA-7")] }, null, 2),
      "utf8",
    );

    await runFetch(gatewayWith({ issues: [sampleIssue("MCA-42")] }), outputPath, FIXED_NOW);

    const parsed = JSON.parse(readFileSync(outputPath, "utf8")) as Payload;
    assert.deepStrictEqual(
      parsed.issues.map((issue) => issue.key),
      ["MCA-42"],
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
