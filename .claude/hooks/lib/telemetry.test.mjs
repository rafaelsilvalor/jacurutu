import { test } from "node:test";
import assert from "node:assert";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildRecord,
  emitGateRecord,
  emitRecord,
  hashInput,
  repoRelative,
  sessionOf,
  telemetryDir,
  telemetryPath,
  DIAGNOSTIC_MAX_LENGTH,
  EMPTY_INPUT_HASH,
  HASH_LENGTH,
  LOG_PREFIX,
  RECORD_KEYS,
  TELEMETRY_DIR_ENV,
  UNKNOWN_SESSION,
} from "./telemetry.mjs";

/**
 * Capture what the subject writes to stderr.
 *
 * `node:test` reports on stdout, so intercepting stderr cannot swallow the
 * runner's own output.
 */
function captureStderr(run) {
  const original = process.stderr.write;
  const chunks = [];
  process.stderr.write = (chunk) => {
    chunks.push(String(chunk));
    return true;
  };
  try {
    run();
  } finally {
    process.stderr.write = original;
  }
  return chunks.join("");
}

/** Run with the stream pointed at a fresh temp directory, restored afterwards. */
function withTempStream(run) {
  const previous = process.env[TELEMETRY_DIR_ENV];
  const dir = mkdtempSync(join(tmpdir(), "saci-telemetry-"));
  try {
    process.env[TELEMETRY_DIR_ENV] = dir;
    return run(dir);
  } finally {
    if (previous === undefined) delete process.env[TELEMETRY_DIR_ENV];
    else process.env[TELEMETRY_DIR_ENV] = previous;
    rmSync(dir, { recursive: true, force: true });
  }
}

const FULL_FIELDS = {
  ts: "2026-08-11T00:00:00.000Z",
  session: "s1",
  agent: "executor",
  hook: "file-ownership",
  event: "PreToolUse",
  check: "pair-ok",
  decision: "allow",
  inputKind: "file-path",
  inputHash: "abc123def456",
  label: "packages/cli/src/run-start.ts",
};

// WHEN a record is built, its keys shall appear in the D13 order regardless of
// the order the caller supplied them — the order is a guarantee carried by
// RECORD_KEYS, not an accident of an object literal at one of five call sites.
test("record keys follow the D13 order, whatever order the caller used", () => {
  const straight = buildRecord(FULL_FIELDS);
  assert.deepEqual(Object.keys(straight), RECORD_KEYS);

  const scrambled = buildRecord({
    label: FULL_FIELDS.label,
    decision: FULL_FIELDS.decision,
    ts: FULL_FIELDS.ts,
    inputHash: FULL_FIELDS.inputHash,
    hook: FULL_FIELDS.hook,
    agent: FULL_FIELDS.agent,
    inputKind: FULL_FIELDS.inputKind,
    session: FULL_FIELDS.session,
    check: FULL_FIELDS.check,
    event: FULL_FIELDS.event,
  });
  assert.deepEqual(Object.keys(scrambled), RECORD_KEYS);
  assert.equal(JSON.stringify(scrambled), JSON.stringify(straight));
});

// WHEN `label` is absent, the key shall not exist on the record. Asserted with
// `in` and Object.keys rather than on the serialized line: JSON.stringify drops
// an `undefined` value silently, so a serialized comparison passes for a record
// that carries the key and one that does not.
test("label is omitted, not set to undefined, when absent", () => {
  const record = buildRecord({ ...FULL_FIELDS, label: undefined });
  assert.equal("label" in record, false);
  assert.deepEqual(Object.keys(record), RECORD_KEYS.slice(0, -1));

  assert.equal("label" in buildRecord({}), false);
  assert.equal("label" in buildRecord({ label: null }), false);
  assert.equal("label" in buildRecord({ label: "" }), false);
  assert.equal("label" in buildRecord({ label: "docs/GOTCHAS.md" }), true);
});

// WHEN a required key is absent, it shall be present and empty: a record with a
// missing key would break the reader's aggregation, while an empty value is
// readable as "the payload did not carry this".
test("required keys are always present, empty when the payload lacked them", () => {
  const record = buildRecord({ hook: "commit-guard" });
  assert.deepEqual(Object.keys(record), RECORD_KEYS.slice(0, -1));
  assert.equal(record.hook, "commit-guard");
  assert.equal(record.session, "");
  assert.equal(record.agent, "");
});

// WHEN the same input is hashed twice it shall produce the same fingerprint,
// and different inputs shall differ — this is what makes "the same input denied
// twice" measurable, which is D1's self-inflicted fraction.
test("hashInput is stable, short, and different for different input", () => {
  assert.equal(hashInput("chore: x"), hashInput("chore: x"));
  assert.equal(hashInput("chore: x").length, HASH_LENGTH);
  assert.notEqual(hashInput("chore: x"), hashInput("chore: y"));
  assert.match(hashInput("chore: x"), /^[0-9a-f]+$/);
});

// WHEN there is no input to inspect, the hash shall be the explicit empty
// sentinel and never the digest of the empty string (finding F-4). That digest
// is a real, plausible-looking value, so two records from different hooks with
// different input kinds would collide on it and the reader would report a
// phantom recurring input.
test("an absent input hashes to the empty sentinel, not to the digest of nothing", () => {
  assert.equal(hashInput(undefined), EMPTY_INPUT_HASH);
  assert.equal(hashInput(null), EMPTY_INPUT_HASH);
  assert.equal(hashInput(""), EMPTY_INPUT_HASH);
  assert.equal(EMPTY_INPUT_HASH, "");
  assert.notEqual(hashInput("chore: x"), EMPTY_INPUT_HASH);
  // The value that must never appear again: SHA-256 of "", truncated.
  assert.notEqual(hashInput(undefined), "e3b0c44298fc");
});

// WHEN a record is composed with no input, two hooks shall not collide on one
// legitimate-looking hash — the failure mode F-4 describes, at record level.
test("records from different hooks with no input do not collide", () => {
  const a = emitGateRecord({ hook: "commit-guard", inputKind: "commit-subject" }, () => {});
  const b = emitGateRecord({ hook: "file-ownership", inputKind: "file-path" }, () => {});
  assert.equal(a.inputHash, EMPTY_INPUT_HASH);
  assert.equal(b.inputHash, EMPTY_INPUT_HASH);
  assert.notEqual(`${a.hook}/${a.inputKind}`, `${b.hook}/${b.inputKind}`);
});

// WHEN a session identifier is resolved, D12's order shall hold with no
// exceptions: payload, then environment, then the literal "unknown".
test("sessionOf resolves payload, then environment, then unknown", () => {
  const previous = process.env.CLAUDE_CODE_SESSION_ID;
  try {
    delete process.env.CLAUDE_CODE_SESSION_ID;
    assert.equal(sessionOf({ session_id: "from-payload" }), "from-payload");
    assert.equal(sessionOf({}), UNKNOWN_SESSION);
    assert.equal(sessionOf(undefined), UNKNOWN_SESSION);
    assert.equal(sessionOf({ session_id: "" }), UNKNOWN_SESSION);

    process.env.CLAUDE_CODE_SESSION_ID = "from-env";
    assert.equal(sessionOf({}), "from-env");
    assert.equal(sessionOf({ session_id: "from-payload" }), "from-payload");

    process.env.CLAUDE_CODE_SESSION_ID = "";
    assert.equal(sessionOf({}), UNKNOWN_SESSION);
  } finally {
    if (previous === undefined) delete process.env.CLAUDE_CODE_SESSION_ID;
    else process.env.CLAUDE_CODE_SESSION_ID = previous;
  }
});

// WHEN the override is absent, the stream shall resolve beside the executing
// hook module rather than from an environment variable (D3).
test("the default stream path is derived from the module's own location", () => {
  const previous = process.env[TELEMETRY_DIR_ENV];
  try {
    delete process.env[TELEMETRY_DIR_ENV];
    const resolved = telemetryPath().replace(/\\/g, "/");
    assert.match(resolved, /\/\.claude\/telemetry\/gates\.jsonl$/);
  } finally {
    if (previous !== undefined) process.env[TELEMETRY_DIR_ENV] = previous;
  }
});

// WHEN the override is supplied, the file path shall be composed with path.join
// so that a trailing separator and either separator style collapse to one path.
// String concatenation only appears to handle these.
test("the override composes one path across separator shapes", () => {
  const previous = process.env[TELEMETRY_DIR_ENV];
  try {
    const shapes = ["/tmp/scratch", "/tmp/scratch/", "/tmp/scratch//"];
    const resolved = new Set(
      shapes.map((shape) => {
        process.env[TELEMETRY_DIR_ENV] = shape;
        return telemetryPath().replace(/\\/g, "/");
      }),
    );
    assert.equal(resolved.size, 1);
    assert.match([...resolved][0], /scratch\/gates\.jsonl$/);

    process.env[TELEMETRY_DIR_ENV] = "/tmp/scratch";
    assert.equal(telemetryDir(), "/tmp/scratch");
  } finally {
    if (previous === undefined) delete process.env[TELEMETRY_DIR_ENV];
    else process.env[TELEMETRY_DIR_ENV] = previous;
  }
});

// WHEN a label is produced, it shall be the repository-relative path. A path
// that is already relative passes through unchanged, which is why this is a
// prefix strip and not path.relative — that resolves against process.cwd().
test("repoRelative strips the worktree root and leaves everything else alone", () => {
  const cwd = "D:/Projects/saci/wt";
  assert.equal(repoRelative("D:\\Projects\\saci\\wt\\packages\\a.ts", cwd), "packages/a.ts");
  assert.equal(repoRelative("D:/Projects/saci/wt/packages/a.ts", cwd), "packages/a.ts");
  assert.equal(repoRelative("packages/a.ts", cwd), "packages/a.ts");
  assert.equal(repoRelative("C:/elsewhere/a.ts", cwd), "C:/elsewhere/a.ts");
  // Windows reports drive letters in either case; the same file is one label.
  assert.equal(repoRelative("d:/Projects/saci/wt/packages/a.ts", cwd), "packages/a.ts");
  assert.equal(repoRelative("D:/Projects/saci/wt/packages/a.ts", "D:/Projects/saci/wt/"), "packages/a.ts");
  assert.equal(repoRelative("", cwd), "");
  assert.equal(repoRelative(undefined, cwd), "");
});

// WHEN the default writer is used, one call shall append exactly one line, and
// the directory shall be created on first use.
test("the default writer appends one line per record and creates the directory", () => {
  withTempStream((dir) => {
    const nested = join(dir, "nested");
    process.env[TELEMETRY_DIR_ENV] = nested;

    emitRecord(buildRecord({ ...FULL_FIELDS, hook: "commit-guard" }));
    emitRecord(buildRecord({ ...FULL_FIELDS, hook: "docs-guard" }));

    const content = readFileSync(join(nested, "gates.jsonl"), "utf8");
    const lines = content.split("\n");
    assert.equal(lines.at(-1), "", "every record ends with a newline");
    const records = lines.filter(Boolean).map((line) => JSON.parse(line));
    assert.equal(records.length, 2);
    assert.deepEqual(Object.keys(records[0]), RECORD_KEYS);
    assert.equal(records[0].hook, "commit-guard");
    assert.equal(records[1].hook, "docs-guard");
  });
});

// WHEN the writer throws, emitRecord shall return normally having written one
// stderr line. This is D5's invariant at unit level: the verdict survives
// whatever telemetry does.
test("a throwing writer produces a normal return and one stderr line", () => {
  const record = buildRecord(FULL_FIELDS);
  let returned = "not reached";
  const stderr = captureStderr(() => {
    returned = emitRecord(record, () => {
      throw new Error("ENOSPC no space left on device");
    });
  });
  assert.equal(returned, undefined);
  assert.equal(stderr.split("\n").filter(Boolean).length, 1);
  assert.ok(stderr.startsWith(LOG_PREFIX));
  assert.match(stderr, /ENOSPC no space left on device/);
});

// WHEN emission fails for any reason at all, it shall not throw. Eight paths,
// only the first of which a test naturally reaches for; the rest were found by
// running the module rather than reading it.
test("emitRecord never throws, on any failure path", () => {
  const record = buildRecord(FULL_FIELDS);
  const circular = { a: 1 };
  circular.self = circular;

  const paths = [
    ["a writer that throws", () => emitRecord(record, () => { throw new Error("boom"); })],
    ["a writer that is a number", () => emitRecord(record, 42)],
    ["a writer that is null", () => emitRecord(record, null)],
    ["a record that will not serialize", () => emitRecord(circular, (line) => line)],
    ["a thrown bare string", () => emitRecord(record, () => { throw "a bare string"; })],
    ["a thrown value with no message", () => emitRecord(record, () => { throw Object.create(null); })],
    ["emitGateRecord with a throwing writer", () => emitGateRecord(
      { input: { session_id: "s1" }, hook: "commit-guard", check: "R10-ok", decision: "allow",
        inputKind: "commit-subject", inspected: "chore: x" },
      () => { throw new Error("EACCES permission denied"); },
    )],
    ["emitGateRecord with no fields at all", () => emitGateRecord(undefined, (line) => line)],
  ];

  for (const [label, run] of paths) {
    assert.doesNotThrow(() => captureStderr(run), `${label} must not throw`);
  }
});

// WHEN the diagnostic describes a multi-line error, it shall still be exactly
// one line. The D5 integration test strips whole lines by the telemetry prefix,
// so an unprefixed continuation line would survive the strip and read as a
// difference on the verdict channel — the thing that test exists to disprove.
// V8's circular-structure message is three lines and is the live case.
test("a diagnostic is one line even when the error message is not", () => {
  const circular = { a: 1 };
  circular.self = circular;
  const stderr = captureStderr(() => emitRecord(circular, (line) => line));

  assert.equal(stderr.split("\n").filter(Boolean).length, 1);
  assert.equal(stderr.at(-1), "\n");
  assert.match(stderr, /Converting circular structure to JSON/);
  for (const line of stderr.split("\n").filter(Boolean)) {
    assert.ok(line.startsWith(LOG_PREFIX), `unprefixed line would break D5: "${line}"`);
  }
});

// WHEN an error message is very long, the diagnostic shall stay bounded. The cap
// is defence, not the D5 contract; the newline collapse above is that contract.
test("a diagnostic is bounded in length", () => {
  const stderr = captureStderr(() =>
    emitRecord(buildRecord(FULL_FIELDS), () => {
      throw new Error("x".repeat(DIAGNOSTIC_MAX_LENGTH * 4));
    }),
  );
  assert.ok(stderr.length < DIAGNOSTIC_MAX_LENGTH + LOG_PREFIX.length + 64);
  assert.match(stderr, /\.\.\.\n$/);
});

// WHEN the telemetry directory cannot be created, the failure shall be reported
// and swallowed. A parent that is a regular file fails with ENOTDIR on every
// platform, where chmod is a no-op on Windows and would pass vacuously.
test("an unwritable stream directory is reported, never thrown", () => {
  withTempStream((dir) => {
    const blocker = join(dir, "not-a-directory");
    writeFileSync(blocker, "this is a file, so it cannot be a parent directory\n");
    process.env[TELEMETRY_DIR_ENV] = join(blocker, "stream");

    let returned = "not reached";
    const stderr = captureStderr(() => {
      returned = emitRecord(buildRecord(FULL_FIELDS));
    });

    assert.equal(returned, undefined);
    assert.equal(stderr.split("\n").filter(Boolean).length, 1);
    assert.ok(stderr.startsWith(LOG_PREFIX));
  });
});

// WHEN a hook composes a record from its payload, the D12 and D13 fields shall
// be taken from the payload and the record written through the injected writer.
test("emitGateRecord composes a D13 record from a hook payload", () => {
  const written = [];
  const record = emitGateRecord(
    {
      input: {
        session_id: "session-abc",
        agent_type: "executor",
        hook_event_name: "PreToolUse",
      },
      hook: "file-ownership",
      check: "pair-code-writes-test",
      decision: "deny",
      inputKind: "file-path",
      inspected: "packages/cli/src/run-start.test.ts",
      label: "packages/cli/src/run-start.test.ts",
    },
    (line) => written.push(line),
  );

  assert.deepEqual(Object.keys(record), RECORD_KEYS);
  assert.equal(record.session, "session-abc");
  assert.equal(record.agent, "executor");
  assert.equal(record.event, "PreToolUse");
  assert.equal(record.hook, "file-ownership");
  assert.equal(record.check, "pair-code-writes-test");
  assert.equal(record.decision, "deny");
  assert.equal(record.inputKind, "file-path");
  assert.equal(record.inputHash, hashInput("packages/cli/src/run-start.test.ts"));
  assert.equal(record.label, "packages/cli/src/run-start.test.ts");
  assert.match(record.ts, /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/);

  assert.equal(written.length, 1);
  assert.equal(written[0].at(-1), "\n");
  assert.deepEqual(JSON.parse(written[0]), record);
});

// WHEN the record carries no label, the serialized line shall not carry the key
// either — the omission has to survive serialization, not only the object.
test("a record without a label serializes without the key", () => {
  const written = [];
  emitGateRecord(
    { input: {}, hook: "commit-guard", check: "R10-ok", decision: "allow",
      inputKind: "commit-subject", inspected: "chore(hooks): add the seam" },
    (line) => written.push(line),
  );
  assert.equal(written.length, 1);
  assert.equal("label" in JSON.parse(written[0]), false);
  assert.deepEqual(Object.keys(JSON.parse(written[0])), RECORD_KEYS.slice(0, -1));
});

// WHEN the module is used the way the hooks use it, the directory shall not be
// created until something is actually emitted — D4's silence has to cost
// nothing on disk, or the guard becomes the most expensive item in the turn.
test("resolving the path does not create anything", () => {
  withTempStream((dir) => {
    const unused = join(dir, "never-created");
    process.env[TELEMETRY_DIR_ENV] = unused;
    telemetryPath();
    assert.throws(() => readFileSync(join(unused, "gates.jsonl"), "utf8"));
    mkdirSync(unused, { recursive: true });
  });
});
