import { test } from "node:test";
import assert from "node:assert";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";

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
test("records from different hooks with no input share the empty sentinel, not a digest", () => {
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

/* ---------------------------------------------------------------------------
 * Integration: the shipped hook executables.
 *
 * Everything below spawns the real file `.claude/settings.json` registers, with
 * a real payload on stdin. Nothing here re-implements a hook's pipeline: a test
 * pipeline that differs from the shipped one passes while proving nothing,
 * which is the whole point of D5.
 * ------------------------------------------------------------------------ */

const TSC_SHIM_MARKER = "SACI-SHIM-TSC";
const NPM_SHIM_MARKER = "SACI-SHIM-NPM";
const NPM_SHIM_EXIT = 7;

/** Spawn a hook executable exactly as the harness does: stdin in, exit code out. */
function spawnHook(hook, payload, options = {}) {
  const hookPath = fileURLToPath(new URL(`../${hook}`, import.meta.url));
  // No `encoding`: stdout and stderr come back as Buffers so D5's comparison is
  // over bytes rather than over a decoded string.
  return spawnSync(process.execPath, [hookPath], {
    input: JSON.stringify(payload),
    cwd: options.cwd,
    env: options.env ?? { ...process.env, [TELEMETRY_DIR_ENV]: options.streamDir },
  });
}

/** Every line of `stderr` except the telemetry diagnostics: the verdict channel. */
function verdictChannel(stderr) {
  const kept = stderr
    .toString("utf8")
    .split("\n")
    .filter((line) => !line.startsWith(LOG_PREFIX));
  return Buffer.from(kept.join("\n"), "utf8");
}

function telemetryLines(stderr) {
  return stderr
    .toString("utf8")
    .split("\n")
    .filter((line) => line.startsWith(LOG_PREFIX));
}

function readStream(dir) {
  const path = join(dir, "gates.jsonl");
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line));
}

/** A directory whose parent is a regular file: ENOTDIR on every platform. */
function unwritableDir(root) {
  const blocker = join(root, "not-a-directory");
  writeFileSync(blocker, "a file cannot be a parent directory\n");
  return join(blocker, "stream");
}

function withTempDir(run) {
  const dir = mkdtempSync(join(tmpdir(), "saci-hook-"));
  try {
    return run(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function git(dir, args) {
  return spawnSync("git", ["-C", dir, ...args], { encoding: "utf8" });
}

/** A git repository of its own, so `git status` answers about it and not about us. */
function initRepo(dir) {
  git(dir, ["init", "-q", "."]);
  return dir;
}

/**
 * Put fast shims for `npx` and `npm` first on PATH.
 *
 * The alternative is the real toolchain: measured at 3.8s for `npx tsc -b`,
 * paid on every run of a suite that itself gates every turn. The hook still
 * executes its own code path — it spawns the same literal command strings — and
 * every assertion below checks for the shim's marker, so a shim that failed to
 * resolve fails the test loudly instead of silently falling back to the real
 * binary and passing slowly.
 */
function withGateShims(run) {
  const bin = mkdtempSync(join(tmpdir(), "saci-shim-"));
  writeShim(bin, "npx", 0, TSC_SHIM_MARKER);
  writeShim(bin, "npm", NPM_SHIM_EXIT, NPM_SHIM_MARKER);
  const env = { ...process.env };
  // Windows reports the variable as `Path`; leaving both spellings in the child
  // environment makes which one wins a coin flip.
  for (const key of Object.keys(env)) {
    if (key.toLowerCase() === "path") delete env[key];
  }
  env.PATH = `${bin}${delimiter}${process.env.PATH ?? ""}`;
  try {
    return run(env);
  } finally {
    rmSync(bin, { recursive: true, force: true });
  }
}

function writeShim(dir, name, code, marker) {
  writeFileSync(join(dir, name), `#!/bin/sh\necho "${marker}"\nexit ${code}\n`);
  chmodSync(join(dir, name), 0o755);
  writeFileSync(join(dir, `${name}.cmd`), `@echo off\r\necho ${marker}\r\nexit /b ${code}\r\n`);
}

const OVERLONG_SUBJECT = `chore(hooks): ${"x".repeat(80)}`;

function commitPayload(command) {
  return {
    session_id: "integration-session",
    hook_event_name: "PreToolUse",
    agent_type: "executor",
    tool_name: "Bash",
    tool_input: { command },
  };
}

// WHEN the telemetry stream cannot be written, the verdict shall be untouched:
// same exit code, same verdict bytes on stderr. This is D5's hard invariant,
// measured against the shipped executable rather than against a rehearsal of it.
// The payload is a denied commit on purpose — two empty stderrs would compare
// equal while proving nothing.
test("D5: an unwritable stream changes no verdict byte on the deny path", () => {
  withTempDir((root) => {
    const writable = join(root, "writable");
    const payload = commitPayload(`git commit -m "${OVERLONG_SUBJECT}"`);

    const ok = spawnHook("commit-guard.mjs", payload, { streamDir: writable });
    const broken = spawnHook("commit-guard.mjs", payload, { streamDir: unwritableDir(root) });

    assert.equal(ok.status, 2, "an overlong subject is denied");
    assert.equal(broken.status, ok.status, "exit code must not depend on telemetry");
    assert.equal(Buffer.compare(verdictChannel(broken.stderr), verdictChannel(ok.stderr)), 0);
    assert.equal(Buffer.compare(broken.stdout, ok.stdout), 0);

    assert.equal(telemetryLines(ok.stderr).length, 0, "a healthy write is silent");
    const diagnostics = telemetryLines(broken.stderr);
    assert.equal(diagnostics.length, 1, "one line, and only one");
    assert.match(diagnostics[0], /emission failed:/);

    const records = readStream(writable);
    assert.equal(records.length, 1);
    assert.deepEqual(Object.keys(records[0]), RECORD_KEYS.slice(0, -1));
    assert.equal(records[0].check, "R10-subject-length");
    assert.equal(records[0].decision, "deny");
    assert.equal(records[0].session, "integration-session");
    assert.equal(records[0].agent, "executor");
    assert.equal(records[0].event, "PreToolUse");
    assert.equal(records[0].inputKind, "commit-subject");
    assert.equal(records[0].inputHash, hashInput(OVERLONG_SUBJECT));
  });
});

// WHEN the commit is allowed, the same invariant shall hold, and the allowed
// verdict shall still be recorded — an allow is a gate event, not silence.
test("D5: the invariant holds on the allow path, and the allow is recorded", () => {
  withTempDir((root) => {
    const writable = join(root, "writable");
    const subject = "chore(hooks): wire telemetry into the five hooks";
    const payload = commitPayload(`git commit -m "${subject}"`);

    const ok = spawnHook("commit-guard.mjs", payload, { streamDir: writable });
    const broken = spawnHook("commit-guard.mjs", payload, { streamDir: unwritableDir(root) });

    assert.equal(ok.status, 0);
    assert.equal(broken.status, ok.status);
    assert.equal(Buffer.compare(verdictChannel(broken.stderr), verdictChannel(ok.stderr)), 0);
    assert.equal(telemetryLines(broken.stderr).length, 1);

    const records = readStream(writable);
    assert.equal(records.length, 1);
    assert.equal(records[0].check, "R10-ok");
    assert.equal(records[0].decision, "allow");
    assert.equal(records[0].inputHash, hashInput(subject));
  });
});

// WHEN a hook exits before inspecting anything, it shall write nothing (D4).
// These guards fire on every Bash call in every session; recording an
// invocation that examined nothing would inflate the denominator of every rate
// the reader computes, and make the guard the most expensive item in the turn.
test("D4: commit-guard is silent on every path where no rule ran", () => {
  withTempDir((root) => {
    const cases = [
      ["not a shell tool", { ...commitPayload("git commit -m \"chore: add x\""), tool_name: "Read" }],
      ["not a commit", commitPayload("git status --porcelain")],
      ["no inline message", commitPayload("git commit -F message.txt")],
    ];

    for (const [label, payload] of cases) {
      const dir = join(root, label.replace(/\s+/g, "-"));
      const result = spawnHook("commit-guard.mjs", payload, { streamDir: dir });
      assert.equal(result.status, 0, `${label} is allowed`);
      assert.equal(readStream(dir).length, 0, `${label} must emit nothing`);
      assert.equal(existsSync(join(dir, "gates.jsonl")), false, `${label} must not create the stream`);
    }
  });
});

// WHEN the pair writes, the verdict shall be recorded with the file path as its
// label; WHEN anyone else writes, the hook has no opinion and stays silent.
test("file-ownership records pair verdicts and stays silent outside the pair", () => {
  withTempDir((root) => {
    const denied = join(root, "denied");
    const result = spawnHook(
      "file-ownership.mjs",
      {
        session_id: "integration-session",
        hook_event_name: "PreToolUse",
        agent_type: "code",
        cwd: "D:/repo",
        tool_name: "Write",
        tool_input: { file_path: "D:\\repo\\packages\\cli\\src\\run-start.test.ts" },
      },
      { streamDir: denied },
    );

    assert.equal(result.status, 2, "@code writing a test is denied");
    const records = readStream(denied);
    assert.equal(records.length, 1);
    assert.deepEqual(Object.keys(records[0]), RECORD_KEYS);
    assert.equal(records[0].check, "pair-code-writes-test");
    assert.equal(records[0].decision, "deny");
    assert.equal(records[0].inputKind, "file-path");
    assert.equal(records[0].label, "packages/cli/src/run-start.test.ts");
    assert.equal(records[0].inputHash, hashInput("packages/cli/src/run-start.test.ts"));

    const quiet = join(root, "quiet");
    const outside = spawnHook(
      "file-ownership.mjs",
      {
        session_id: "integration-session",
        hook_event_name: "PreToolUse",
        agent_type: "executor",
        tool_name: "Write",
        tool_input: { file_path: "packages/cli/src/run-start.test.ts" },
      },
      { streamDir: quiet },
    );
    assert.equal(outside.status, 0);
    assert.equal(readStream(quiet).length, 0, "no opinion is not a gate event");
  });
});

// WHEN a commit stages nothing this guard inspects, it shall stay silent; WHEN
// it stages something, the verdict shall carry the staged set as its input.
test("architecture-guard records the staged set it inspected, and only then", () => {
  withTempDir((root) => {
    const repo = initRepo(join(mkdtempSync(join(root, "repo-")), ""));
    const empty = join(root, "empty");
    const staged = join(root, "staged");
    const payload = commitPayload('git commit -m "chore: add x"');

    const nothing = spawnHook("architecture-guard.mjs", { ...payload, cwd: repo }, { streamDir: empty });
    assert.equal(nothing.status, 0);
    assert.equal(readStream(empty).length, 0, "an empty index is not a gate event");

    writeFileSync(join(repo, "a.md"), "# a\n");
    writeFileSync(join(repo, "b.txt"), "b\n");
    git(repo, ["add", "a.md", "b.txt"]);

    const result = spawnHook("architecture-guard.mjs", { ...payload, cwd: repo }, { streamDir: staged });
    assert.equal(result.status, 0);
    const records = readStream(staged);
    assert.equal(records.length, 1);
    assert.equal(records[0].hook, "architecture-guard");
    assert.equal(records[0].check, "none", "no findings is a named outcome, not an absence");
    assert.equal(records[0].decision, "allow");
    assert.equal(records[0].inputKind, "staged-set");
    assert.equal(records[0].inputHash, hashInput("a.md\nb.txt"), "sorted, newline-joined");
    assert.equal("label" in records[0], false, "only file-path carries a label");
  });
});

// WHEN a commit stages no reviewable markdown, the docs guard shall stay silent
// — most commits here stage none, and every one of them fires this hook.
test("docs-guard records only when it inspected a document", () => {
  withTempDir((root) => {
    const repo = initRepo(join(mkdtempSync(join(root, "repo-")), ""));
    const quiet = join(root, "quiet");
    const loud = join(root, "loud");
    const payload = commitPayload('git commit -m "docs: add x"');

    writeFileSync(join(repo, "b.txt"), "b\n");
    git(repo, ["add", "b.txt"]);
    const nothing = spawnHook("docs-guard.mjs", { ...payload, cwd: repo }, { streamDir: quiet });
    assert.equal(nothing.status, 0);
    assert.equal(readStream(quiet).length, 0);

    writeFileSync(join(repo, "notes.md"), "# notes\n\nNothing to resolve here.\n");
    git(repo, ["add", "notes.md"]);
    const result = spawnHook("docs-guard.mjs", { ...payload, cwd: repo }, { streamDir: loud });
    assert.equal(result.status, 0);
    const records = readStream(loud);
    assert.equal(records.length, 1);
    assert.equal(records[0].hook, "docs-guard");
    assert.equal(records[0].check, "none");
    assert.equal(records[0].inputHash, hashInput("notes.md"), "only the documents it inspected");
  });
});

// WHEN the green boundary runs a gate, it shall record that gate by name — the
// two identifiers of the D6 table that are born in the executable rather than
// in a decision module.
test("green-boundary records one verdict per gate it actually ran", () => {
  withTempDir((root) => {
    const repo = initRepo(join(mkdtempSync(join(root, "repo-")), ""));
    mkdirSync(join(repo, "packages"), { recursive: true });
    writeFileSync(join(repo, "packages", "a.ts"), "export const a = 1;\n");
    // Staged, not merely written: `git status --porcelain` collapses an
    // untracked directory to `?? packages/`, so an unstaged file would make the
    // hook hash the directory. Both run the gates; only one is a stable input.
    git(repo, ["add", "packages/a.ts"]);
    const stream = join(root, "stream");

    const result = withGateShims((env) =>
      spawnHook(
        "green-boundary.mjs",
        { session_id: "integration-session", hook_event_name: "Stop", cwd: repo },
        { cwd: repo, env: { ...env, [TELEMETRY_DIR_ENV]: stream } },
      ),
    );

    assert.equal(result.status, 0, "a blocked stop still exits 0; the block rides stdout");
    const decision = JSON.parse(result.stdout.toString("utf8"));
    assert.equal(decision.decision, "block");
    assert.match(decision.reason, /npm test/);
    assert.match(decision.reason, new RegExp(NPM_SHIM_MARKER), "the shim ran, not the real npm");

    const records = readStream(stream);
    assert.deepEqual(
      records.map((r) => [r.check, r.decision]),
      [["green-tsc", "allow"], ["green-npm-test", "deny"]],
      "one record per gate, in the order the gates ran",
    );
    assert.equal(records[0].hook, "green-boundary");
    assert.equal(records[0].event, "Stop");
    assert.equal(records[0].inputKind, "turn");
    assert.equal(records[0].inputHash, hashInput("packages/a.ts"), "the watched paths that made it run");
  });
});

// WHEN the working tree cannot be read, the gates shall run anyway. R4 calls a
// false green the expensive failure, and `null` must reach the gates exactly as
// a non-empty list does — a truthiness test here would end the turn instead,
// which looks identical to a passing boundary and is the opposite of one.
test("green-boundary runs the gates when the working tree is unreadable", () => {
  withTempDir((root) => {
    const notARepo = join(mkdtempSync(join(root, "bare-")), "");
    // The precondition, asserted rather than assumed: if this ever becomes a
    // repository, the test would pass for the wrong reason.
    assert.notEqual(git(notARepo, ["status", "--porcelain"]).status, 0, "must not be a git repository");
    const stream = join(root, "stream");

    const result = withGateShims((env) =>
      spawnHook(
        "green-boundary.mjs",
        { session_id: "integration-session", hook_event_name: "Stop", cwd: notARepo },
        { cwd: notARepo, env: { ...env, [TELEMETRY_DIR_ENV]: stream } },
      ),
    );

    const records = readStream(stream);
    assert.deepEqual(
      records.map((r) => r.check),
      ["green-tsc", "green-npm-test"],
      "an unreadable tree runs the gates; it is not treated as nothing to do",
    );
    assert.equal(records[0].inputHash, "", "no readable paths is an empty input, not a hash of none");
    assert.equal(JSON.parse(result.stdout.toString("utf8")).decision, "block");
  });
});

// WHEN nothing watched changed, or the block would feed itself, the boundary
// shall end the turn without running or recording anything (D4).
test("green-boundary is silent on both of its early exits", () => {
  withTempDir((root) => {
    const repo = initRepo(join(mkdtempSync(join(root, "repo-")), ""));
    writeFileSync(join(repo, "README.md"), "# not a watched prefix\n");

    const unwatched = join(root, "unwatched");
    const quiet = withGateShims((env) =>
      spawnHook(
        "green-boundary.mjs",
        { session_id: "s", hook_event_name: "Stop", cwd: repo },
        { cwd: repo, env: { ...env, [TELEMETRY_DIR_ENV]: unwatched } },
      ),
    );
    assert.equal(quiet.status, 0);
    assert.equal(quiet.stdout.length, 0, "no block, no output");
    assert.equal(readStream(unwatched).length, 0);

    const reentrant = join(root, "reentrant");
    mkdirSync(join(repo, "packages"), { recursive: true });
    writeFileSync(join(repo, "packages", "a.ts"), "export const a = 1;\n");
    const looped = withGateShims((env) =>
      spawnHook(
        "green-boundary.mjs",
        { session_id: "s", hook_event_name: "Stop", cwd: repo, stop_hook_active: true },
        { cwd: repo, env: { ...env, [TELEMETRY_DIR_ENV]: reentrant } },
      ),
    );
    assert.equal(looped.status, 0);
    assert.equal(readStream(reentrant).length, 0, "the re-entrancy guard runs no gate to record");
  });
});
