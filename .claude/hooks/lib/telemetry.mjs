/**
 * The emission seam for gate telemetry.
 *
 * The five hooks already reach a verdict on every commit and every write; they
 * simply throw it away. This module makes the verdict durable — one JSON object
 * per line, append-only — so that yield per check can be measured from runtime
 * data instead of from prose written by the sessions being measured.
 *
 * The hard invariant is D5: emission never alters a verdict. Nothing exported
 * here throws, on any path. A hook calls into this module between reaching its
 * decision and exiting, and must be able to do so without a try/catch of its
 * own — a guard that can crash on its own instrumentation is worse than a guard
 * with no instrumentation at all.
 *
 * R18 does not apply. This is harness-local instrumentation of the development
 * process, not the product's application state, and there is no `storage/` seam
 * to route it through.
 */

import { appendFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const TELEMETRY_DIR_NAME = "telemetry";
const TELEMETRY_FILE_NAME = "gates.jsonl";
// The override exists for the tests. Production resolves from import.meta.url.
const TELEMETRY_DIR_ENV = "SACI_TELEMETRY_DIR";
const SESSION_ENV = "CLAUDE_CODE_SESSION_ID";
const UNKNOWN_SESSION = "unknown";
const HASH_ALGORITHM = "sha256";
const HASH_LENGTH = 12;
// Every diagnostic this module writes carries this prefix, and the D5
// integration test strips whole lines by it to compare the verdict channel.
// Changing it changes that test's contract.
const LOG_PREFIX = "telemetry:";
// A diagnostic is collapsed to one bounded line. Both halves are load-bearing,
// and neither is cosmetic: D5 promises "one line to stderr", and the D5 test
// strips whole lines BY THE PREFIX — so a message carrying its own newlines
// would leave unprefixed continuation lines behind and they would read as a
// difference on the verdict channel. V8 produces exactly such a message for a
// circular structure, in three lines.
//
// The length cap is pure defence and sits high on purpose: the one error class
// the D5 test exercises is a filesystem error whose most useful part — the path
// — sits at the tail, and a Windows path under os.tmpdir() is long enough that
// a tight bound would cut exactly where the information is.
const DIAGNOSTIC_MAX_LENGTH = 500;
/**
 * The `inputHash` of an absent input, per the 2026-08-11 ruling on finding F-4.
 *
 * Hashing nothing yields the SHA-256 of the empty string, which is a real,
 * legitimate-looking digest: two records from different hooks with different
 * input kinds would collide on it and the reader would report a phantom
 * recurring input — in the very section that carries D1's self-inflicted
 * fraction, which is the measure this whole stream exists to produce. An empty
 * hash is the same shape D12 already uses for an unresolved session: written,
 * counted, and reported as what it is rather than silently plausible.
 */
const EMPTY_INPUT_HASH = "";

/**
 * The D13 record shape. **This array is the guarantee, not documentation of
 * one.** `buildRecord` walks it in order, so key order cannot drift with the
 * order of an object literal at a call site, and a reordered record is a
 * one-line change here rather than five silent ones across the hooks.
 */
const RECORD_KEYS = [
  "ts",
  "session",
  "agent",
  "hook",
  "event",
  "check",
  "decision",
  "inputKind",
  "inputHash",
  "label",
];

/**
 * Keys that are omitted when absent rather than emitted empty. D13 confines
 * `label` to the `file-path` input kind, so for every other kind the key must
 * not exist — not exist as `undefined`, which is a different fact that
 * `JSON.stringify` happens to serialize the same way.
 */
const OPTIONAL_KEYS = new Set(["label"]);

/** The directory the stream lives in, resolved per D3. */
export function telemetryDir() {
  const override = process.env[TELEMETRY_DIR_ENV];
  if (typeof override === "string" && override !== "") return override;
  // Derived from this module's own location, not from ${CLAUDE_PROJECT_DIR}:
  // telemetry lands beside whichever hook file actually executed, which is
  // worktree-correct by construction and needs no environment variable.
  return fileURLToPath(new URL(`../../${TELEMETRY_DIR_NAME}/`, import.meta.url));
}

/**
 * The full path of the JSONL stream.
 *
 * `path.join` rather than string concatenation (R1): the override is supplied
 * by a caller and may carry a trailing separator, and on Windows the separator
 * a test supplies is rarely the one `fileURLToPath` produces. `join` normalizes
 * both cases; concatenation only appears to.
 */
export function telemetryPath() {
  return join(telemetryDir(), TELEMETRY_FILE_NAME);
}

/**
 * A stable, short fingerprint of the inspected input (D13).
 *
 * Hash-only is a hard constraint, not a preference: `scanSecrets` evidence
 * lines would otherwise reach a file nobody reviews. The hash is what makes
 * "the same input denied twice" distinguishable from "two inputs denied once",
 * which is the only way D1's self-inflicted fraction can be measured at all.
 *
 * An absent or empty input hashes to EMPTY_INPUT_HASH, never to the digest of
 * the empty string. See that constant for why the difference is load-bearing.
 */
export function hashInput(text) {
  const value = typeof text === "string" ? text : text === undefined || text === null ? "" : String(text);
  if (value === "") return EMPTY_INPUT_HASH;
  return createHash(HASH_ALGORITHM)
    .update(value, "utf8")
    .digest("hex")
    .slice(0, HASH_LENGTH);
}

/** The session identifier, resolved in D12's order, with no exceptions. */
export function sessionOf(input) {
  const fromPayload = input?.session_id;
  if (typeof fromPayload === "string" && fromPayload !== "") return fromPayload;
  const fromEnv = process.env[SESSION_ENV];
  if (typeof fromEnv === "string" && fromEnv !== "") return fromEnv;
  // Still written, still counted toward the window, excluded from the distinct
  // session count, and reported by the reader. A silent zero here would corrupt
  // D8's window without anyone noticing.
  return UNKNOWN_SESSION;
}

/**
 * Build a D13 record with its keys in D13 order.
 *
 * Required keys are always present, empty string when the payload lacked them;
 * optional keys are skipped outright when absent.
 */
export function buildRecord(fields = {}) {
  const record = {};
  for (const key of RECORD_KEYS) {
    const value = fields[key];
    if (OPTIONAL_KEYS.has(key)) {
      if (value === undefined || value === null || value === "") continue;
      record[key] = String(value);
      continue;
    }
    record[key] = value === undefined || value === null ? "" : String(value);
  }
  return record;
}

/**
 * The repository-relative form of a path, for D13's `label`.
 *
 * A prefix strip rather than `path.relative`, deliberately: `path.relative`
 * resolves both arguments against `process.cwd()`, so a payload that already
 * carries a repository-relative path would come back mangled. Comparison is
 * case-insensitive because Windows reports drive letters in either case.
 */
export function repoRelative(filePath, cwd) {
  if (typeof filePath !== "string" || filePath === "") return "";
  const normalized = filePath.replace(/\\/g, "/");
  if (typeof cwd !== "string" || cwd === "") return normalized;
  const root = cwd.replace(/\\/g, "/").replace(/\/+$/, "");
  if (root === "") return normalized;
  const inside = normalized.toLowerCase().startsWith(`${root.toLowerCase()}/`);
  return inside ? normalized.slice(root.length + 1) : normalized;
}

/**
 * Serialize one record and hand it to `writer`.
 *
 * `writer` is a parameter rather than an imported call so the D5 unit test can
 * inject a throwing one; the default is the filesystem appender.
 *
 * This function does not throw. Not for a writer that fails, and not for a
 * writer that is not a function, a record that will not serialize, or a
 * directory that cannot be created — every one of those is a real path to a
 * thrown error, and only the first is what a test naturally reaches for.
 */
export function emitRecord(record, writer = appendToStream) {
  try {
    if (typeof writer !== "function") {
      throw new TypeError(`writer is ${typeof writer}, not a function`);
    }
    // Inside the try on purpose: JSON.stringify throws on a circular structure
    // or a BigInt, and a malformed record must not be able to block a commit.
    writer(`${JSON.stringify(record)}\n`);
  } catch (error) {
    reportFailure(error);
  }
}

/**
 * Compose a D13 record from a hook payload and emit it. The one call the five
 * hooks make; nothing it does can throw.
 *
 * Returns the composed record, or `null` when composition itself failed — a
 * documented contract (R4) that exists for the tests, since no hook has
 * anything to do with the return value on the way to its own exit. A failed
 * *write* is reported and does not change the return value: the record is still
 * what the hook decided, and only the durability of it was lost.
 */
export function emitGateRecord(fields, writer) {
  try {
    const { input, hook, check, decision, inputKind, inspected, label } = fields ?? {};
    const record = buildRecord({
      ts: new Date().toISOString(),
      session: sessionOf(input),
      agent: input?.agent_type ?? "",
      hook,
      event: input?.hook_event_name ?? "",
      check,
      decision,
      inputKind,
      inputHash: hashInput(inspected),
      label,
    });
    emitRecord(record, writer);
    return record;
  } catch (error) {
    // Composition itself is the uncovered half: `emitRecord` guards the write,
    // but hashing and field extraction run before it.
    reportFailure(error);
    return null;
  }
}

/** The default writer: append one line, creating the directory on first use. */
function appendToStream(line) {
  const target = telemetryPath();
  mkdirSync(dirname(target), { recursive: true });
  appendFileSync(target, line, "utf8");
}

/**
 * Report an emission failure on stderr and return (D5, R4).
 *
 * The nested catch is the one place in this module where R4's letter and D5's
 * invariant meet: stderr is the last channel this process has, so a process
 * whose stderr write throws cannot be told that it cannot be told. The
 * alternative is letting the exception escape and take the verdict with it,
 * which D5 forbids outright. The attempt above it is the log R4 asks for.
 */
function reportFailure(error) {
  try {
    process.stderr.write(`${LOG_PREFIX} emission failed: ${oneLine(describe(error))}\n`);
  } catch {
    // Deliberately terminal. See the note above; there is no third channel.
  }
}

/** Collapse a diagnostic to a single bounded line. See DIAGNOSTIC_MAX_LENGTH. */
function oneLine(text) {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length > DIAGNOSTIC_MAX_LENGTH
    ? `${collapsed.slice(0, DIAGNOSTIC_MAX_LENGTH)}...`
    : collapsed;
}

/** Describe an error without assuming it is one. Never throws. */
function describe(error) {
  if (error && typeof error.message === "string" && error.message !== "") {
    return error.message;
  }
  try {
    return String(error);
  } catch {
    // Documented fallback (R4): a value whose own `toString` throws is still
    // worth one stderr line, and the caller handles this contract.
    return "an error that cannot be described";
  }
}

export {
  RECORD_KEYS,
  OPTIONAL_KEYS,
  TELEMETRY_DIR_ENV,
  TELEMETRY_FILE_NAME,
  UNKNOWN_SESSION,
  HASH_ALGORITHM,
  HASH_LENGTH,
  LOG_PREFIX,
  DIAGNOSTIC_MAX_LENGTH,
  EMPTY_INPUT_HASH,
};
