import { test } from "node:test";
import assert from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  aggregate,
  formatReport,
  parseStream,
  RECURRING_MIN,
  WINDOW_EVENTS,
  WINDOW_SESSIONS,
} from "./gate-yield.mjs";

const CLI = fileURLToPath(new URL("../gate-yield.mjs", import.meta.url));

function record(overrides = {}) {
  return {
    ts: "2026-08-11T00:00:00.000Z",
    session: "s1",
    agent: "executor",
    hook: "commit-guard",
    event: "PreToolUse",
    check: "R10-ok",
    decision: "allow",
    inputKind: "commit-subject",
    inputHash: "aaaaaaaaaaaa",
    ...overrides,
  };
}

const streamOf = (records) => `${records.map((r) => JSON.stringify(r)).join("\n")}\n`;

function withTempDir(run) {
  const dir = mkdtempSync(join(tmpdir(), "saci-yield-"));
  try {
    return run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runCli(args, options = {}) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", ...options });
}

// WHEN the stream is read, every well-formed line shall become a record and
// blank lines shall be ignored — a JSONL file always ends with a newline.
test("parseStream reads records and ignores blank lines", () => {
  const { records, unparseable } = parseStream(streamOf([record(), record({ check: "R10-ok" })]));
  assert.equal(records.length, 2);
  assert.equal(unparseable.length, 0);
  assert.equal(parseStream("").records.length, 0);
  assert.equal(parseStream("\n\n\n").records.length, 0);
});

// WHEN a line cannot be parsed, it shall be counted and reported, never dropped
// (R4). Five processes append to this file concurrently, so a reader will
// eventually see a line mid-write; under-reporting it would corrupt the
// denominator every rate is computed from.
test("a truncated final line is kept as a finding, not silently skipped", () => {
  const truncated = `${JSON.stringify(record())}\n{"ts":"2026-08-11T00:00:00.000Z","sess`;
  const { records, unparseable } = parseStream(truncated);

  assert.equal(records.length, 1, "the intact record survives");
  assert.equal(unparseable.length, 1);
  assert.equal(unparseable[0].line, 2);
  assert.ok(unparseable[0].reason.length > 0);
});

// WHEN a line is valid JSON but not a record, it shall also be a finding: a
// bare number parses, and counting it as an event would be worse than skipping.
test("JSON that is not a record object is a finding", () => {
  const { records, unparseable } = parseStream(`123\n[]\n"text"\n${JSON.stringify(record())}\n`);
  assert.equal(records.length, 1);
  assert.equal(unparseable.length, 3);
  assert.deepEqual(unparseable.map((u) => u.reason), [
    "not a JSON object",
    "not a JSON object",
    "not a JSON object",
  ]);
});

// WHEN sessions are counted, an unresolved one shall be excluded from the
// distinct count and reported separately — D12's contract, and the reason a
// silent zero cannot corrupt D8's window without anyone noticing.
test("unresolved sessions are excluded from the distinct count and reported", () => {
  const summary = aggregate([
    record({ session: "s1" }),
    record({ session: "s1" }),
    record({ session: "s2" }),
    record({ session: "unknown" }),
    record({ session: "" }),
  ]);

  assert.equal(summary.total, 5);
  assert.equal(summary.sessions.distinct, 2);
  assert.equal(summary.sessions.unknown, 2);
});

// WHEN a record carries no inspected input, it shall be counted and reported the
// same way — the ruling behind F-4, one field over.
test("records with no inspected input are counted and reported", () => {
  const summary = aggregate([
    record({ inputHash: "" }),
    record({ inputHash: "" }),
    record({ inputHash: "bbbbbbbbbbbb" }),
  ]);
  assert.equal(summary.emptyInput, 2);
  assert.match(formatReport(summary), /Records with no inspected input: 2/);
});

// WHEN the empty sentinel recurs, it shall NOT be reported as a recurring input.
// Two records sharing "no input" share nothing; reporting them as one recurring
// input is the phantom F-4 exists to prevent.
test("the empty input hash never becomes a recurring input", () => {
  const summary = aggregate([
    record({ inputHash: "", hook: "commit-guard" }),
    record({ inputHash: "", hook: "file-ownership" }),
  ]);
  assert.deepEqual(summary.recurring, []);
});

// WHEN counts are reported, they shall break down per hook, per check and per
// decision — the three axes D1 asks for.
test("counts break down per hook, per check and per decision", () => {
  const summary = aggregate([
    record({ hook: "commit-guard", check: "R10-ok", decision: "allow" }),
    record({ hook: "commit-guard", check: "R10-subject-length", decision: "deny" }),
    record({ hook: "commit-guard", check: "R10-verb-unknown", decision: "ask" }),
    record({ hook: "docs-guard", check: "none", decision: "allow" }),
  ]);

  assert.deepEqual(summary.perHook.map((h) => [h.name, h.total]), [
    ["commit-guard", 3],
    ["docs-guard", 1],
  ]);
  assert.equal(summary.perHook[0].decisions.deny, 1);
  assert.equal(summary.perCheck.length, 4);
  assert.deepEqual(summary.perDecision, [
    { name: "deny", total: 1 },
    { name: "ask", total: 1 },
    { name: "allow", total: 2 },
  ]);
});

// WHEN one input is decided more than once, it shall be reported with its
// decisions — this is the section that carries D1's self-inflicted fraction,
// and the reason every record carries a hash at all.
test("an input decided twice is reported with its decisions and label", () => {
  const summary = aggregate([
    record({ inputHash: "dddddddddddd", decision: "deny", check: "R10-subject-length" }),
    record({ inputHash: "dddddddddddd", decision: "deny", check: "R10-subject-length" }),
    record({ inputHash: "eeeeeeeeeeee", decision: "allow" }),
    record({
      inputHash: "ffffffffffff",
      hook: "file-ownership",
      inputKind: "file-path",
      decision: "deny",
      label: "packages/cli/src/a.test.ts",
    }),
    record({
      inputHash: "ffffffffffff",
      hook: "file-ownership",
      inputKind: "file-path",
      decision: "allow",
      label: "packages/cli/src/a.test.ts",
    }),
  ]);

  assert.equal(summary.recurring.length, 2, `only inputs seen ${RECURRING_MIN}+ times`);
  assert.equal(summary.recurring[0].hash, "dddddddddddd");
  assert.equal(summary.recurring[0].decisions.deny, 2);
  const labelled = summary.recurring.find((r) => r.hash === "ffffffffffff");
  assert.equal(labelled.label, "packages/cli/src/a.test.ts");
  assert.equal(labelled.decisions.deny, 1);
  assert.equal(labelled.decisions.allow, 1);
});

// WHEN the window is computed, a committing session shall be one with at least
// one commit-guard allow, and unresolved sessions shall not count toward it.
test("the window counts committing sessions by the D8 definition", () => {
  const summary = aggregate([
    record({ session: "s1", hook: "commit-guard", decision: "allow" }),
    record({ session: "s1", hook: "commit-guard", decision: "allow" }),
    record({ session: "s2", hook: "commit-guard", decision: "deny" }),
    record({ session: "s3", hook: "green-boundary", decision: "allow" }),
    record({ session: "unknown", hook: "commit-guard", decision: "allow" }),
  ]);

  assert.equal(summary.window.committingSessions, 1, "s2 denied, s3 never committed");
  assert.equal(summary.window.events, 5);
  assert.equal(summary.window.closed, false);
});

// WHEN either threshold is reached, the window shall close — whichever comes
// first, and both are the SSOT here rather than in prose.
test("the window closes on sessions or on events, whichever comes first", () => {
  assert.equal(WINDOW_SESSIONS, 10);
  assert.equal(WINDOW_EVENTS, 150);

  const bySessions = aggregate(
    Array.from({ length: WINDOW_SESSIONS }, (_, i) =>
      record({ session: `s${i}`, hook: "commit-guard", decision: "allow" }),
    ),
  );
  assert.equal(bySessions.window.closed, true);

  const byEvents = aggregate(
    Array.from({ length: WINDOW_EVENTS }, () => record({ session: "s1", decision: "deny" })),
  );
  assert.equal(byEvents.window.committingSessions, 0);
  assert.equal(byEvents.window.closed, true);
});

// WHEN the report is rendered, it shall name the committing-session count as a
// proxy. The measurement is honest about what it cannot see, or it invites the
// reader to believe a certainty it does not have.
test("the report names the committing-session count as a proxy", () => {
  // The default fixture is a commit-guard allow, so it IS a committing session:
  // the count below is the proxy doing its work, not a zero.
  const text = formatReport(aggregate([record()]));
  assert.match(text, /proxy/);
  assert.match(text, /not proof that/);
  assert.match(text, /Committing sessions: 1 of 10/);
  assert.match(text, /Events: +1 of 150/);
  assert.match(formatReport(aggregate([record({ decision: "deny" })])), /Committing sessions: 0 of 10/);
});

// WHEN the stream is empty, the report shall render zeros rather than throw. A
// reader that crashes on an empty file is a reader nobody runs before the first
// commit of a window.
test("an empty stream renders a report rather than throwing", () => {
  const { records, unparseable } = parseStream("");
  const text = formatReport(aggregate(records), unparseable, "/tmp/gates.jsonl");
  assert.match(text, /Events: {26}0/);
  assert.match(text, /\(none\)/);
  assert.match(text, /\(none yet\)/);
  assert.match(text, /State: {15}OPEN/);
});

// WHEN lines could not be parsed, the report shall say so with their numbers.
test("the report lists the unparseable lines it kept", () => {
  const { records, unparseable } = parseStream(`${JSON.stringify(record())}\n{"broken`);
  const text = formatReport(aggregate(records), unparseable);
  assert.match(text, /Unparseable lines: {15}1/);
  assert.match(text, /line 2:/);
});

// WHEN the CLI is pointed at a stream that does not exist, it shall exit 1 with
// a message on stderr rather than a stack trace.
test("the CLI exits 1 with a message when the stream is absent", () => {
  const result = runCli(["/nonexistent-stream.jsonl"]);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /no telemetry stream at/);
  assert.doesNotMatch(result.stderr, /at Object|at Module|node:internal/, "a message, not a trace");
});

// WHEN the CLI is pointed at a real stream, it shall print the report and exit 0
// — including when that stream is empty, or its last line is half-written.
test("the CLI reports on a real stream, an empty one, and a truncated one", () => {
  withTempDir((dir) => {
    const full = join(dir, "full.jsonl");
    writeFileSync(full, streamOf([record(), record({ decision: "deny", check: "R10-verb-imperative" })]));
    const reported = runCli([full]);
    assert.equal(reported.status, 0);
    assert.match(reported.stdout, /Events: {26}2/);
    assert.match(reported.stdout, /R10-verb-imperative/);
    assert.match(reported.stdout, new RegExp(full.replace(/[\\.]/g, "\\$&")));

    const empty = join(dir, "empty.jsonl");
    writeFileSync(empty, "");
    const emptyRun = runCli([empty]);
    assert.equal(emptyRun.status, 0);
    assert.match(emptyRun.stdout, /Events: {26}0/);

    const truncated = join(dir, "truncated.jsonl");
    writeFileSync(truncated, `${JSON.stringify(record())}\n{"ts":"2026-08-1`);
    const truncatedRun = runCli([truncated]);
    assert.equal(truncatedRun.status, 0, "a half-written line is a finding, not a crash");
    assert.match(truncatedRun.stdout, /Unparseable lines: {15}1/);
  });
});

// WHEN no path is given, the CLI shall read the default stream. Pointed at a
// directory with no stream it exits 1, which is the same contract as above and
// proves the default is resolved rather than assumed.
test("the CLI falls back to the default stream path", () => {
  withTempDir((dir) => {
    const result = runCli([], { env: { ...process.env, JACURUTU_TELEMETRY_DIR: dir } });
    assert.equal(result.status, 1);
    assert.match(result.stderr, new RegExp("gates\\.jsonl"));
  });
});
