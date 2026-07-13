import { test } from "node:test";
import assert from "node:assert";

import {
  displayKey,
  HISTORY_EVENTS,
  parseManifest,
  serializeManifest,
  TASK_MANIFEST_SCHEMA_VERSION,
  type TaskManifest,
} from "./workspace.js";

/** A well-formed v2 Jira-born manifest; tests override only the fields they exercise. */
function makeManifest(overrides: Partial<TaskManifest> = {}): TaskManifest {
  return {
    schemaVersion: 2,
    jiraKey: "MCA-101",
    localKey: null,
    vertical: "OAB",
    slug: "kv-aulao",
    template: "kv-standard",
    drivePath: ["AVULSAS", "OAB", "2026-06", "MCA-101_kv-aulao"],
    history: [{ event: "start", actor: null, at: "2026-06-13T19:30:00.000Z" }],
    ...overrides,
  };
}

/**
 * The legacy v1 on-disk shape: scalar timestamps, no `localKey` or `history`
 * keys at all — exactly what a pre-v2 `.saci.json` carries. Kept as its own
 * builder so migration tests exercise the real legacy layout, not a v2
 * fixture with fields renamed.
 */
interface V1Manifest {
  schemaVersion: 1;
  jiraKey: string;
  vertical: string;
  slug: string;
  template: string;
  drivePath: readonly string[];
  startedAt: string;
  shippedAt: string | null;
}

function makeV1Manifest(overrides: Partial<V1Manifest> = {}): V1Manifest {
  return {
    schemaVersion: 1,
    jiraKey: "MCA-101",
    vertical: "OAB",
    slug: "kv-aulao",
    template: "kv-standard",
    drivePath: ["AVULSAS", "OAB", "2026-06", "MCA-101_kv-aulao"],
    startedAt: "2026-06-13T19:30:00.000Z",
    shippedAt: null,
    ...overrides,
  };
}

test("(a) happy path: a well-formed v2 object narrows with all fields intact", () => {
  const manifest = makeManifest();
  const parsed = parseManifest(manifest as unknown);
  assert.deepStrictEqual(parsed, manifest);
  assert.strictEqual(parsed.schemaVersion, TASK_MANIFEST_SCHEMA_VERSION);
  assert.strictEqual(parsed.localKey, null);
});

test("(a) happy path: a local-born manifest (jiraKey null, localKey set) parses", () => {
  const manifest = makeManifest({
    jiraKey: null,
    localKey: "RAF-1",
    drivePath: ["AVULSAS", "OAB", "2026-06", "RAF-1_kv-aulao"],
  });
  assert.deepStrictEqual(parseManifest(manifest as unknown), manifest);
});

test("(a) happy path: a linked manifest (both keys set) parses", () => {
  const manifest = makeManifest({ jiraKey: "MCA-101", localKey: "RAF-1" });
  assert.deepStrictEqual(parseManifest(manifest as unknown), manifest);
});

test("(a) happy path: every HISTORY_EVENTS member is accepted as an event", () => {
  const history = HISTORY_EVENTS.map((event, index) => ({
    event,
    actor: index % 2 === 0 ? null : "rafael",
    at: "2026-06-13T19:30:00.000Z",
  }));
  const manifest = makeManifest({ history });
  assert.deepStrictEqual(parseManifest(manifest as unknown).history, history);
});

test("(b) unsupported schemaVersion (3) fails loud, no migration", () => {
  const bad = { ...makeManifest(), schemaVersion: 3 };
  assert.throws(() => parseManifest(bad as unknown), /schemaVersion/);
});

test("(b) wrong schemaVersion (0) fails loud", () => {
  const bad = { ...makeManifest(), schemaVersion: 0 };
  assert.throws(() => parseManifest(bad as unknown), /schemaVersion/);
});

test("(b) missing schemaVersion fails loud", () => {
  const { schemaVersion: _omitted, ...rest } = makeManifest();
  assert.throws(() => parseManifest(rest as unknown), /schemaVersion/);
});

test("(b) schemaVersion gate rejects a non-object before field parsing", () => {
  assert.throws(() => parseManifest(null), /non-null object/);
  assert.throws(() => parseManifest("not-an-object"), /non-null object/);
});

test("(c) v1 migration: jiraKey kept, localKey null, startedAt becomes a start entry", () => {
  const v1 = makeV1Manifest();
  assert.ok(!("localKey" in v1), "fixture invariant: v1 has no localKey property at all");
  const migrated = parseManifest(v1 as unknown);
  assert.deepStrictEqual(migrated, {
    schemaVersion: 2,
    jiraKey: "MCA-101",
    localKey: null,
    vertical: "OAB",
    slug: "kv-aulao",
    template: "kv-standard",
    drivePath: ["AVULSAS", "OAB", "2026-06", "MCA-101_kv-aulao"],
    history: [{ event: "start", actor: null, at: "2026-06-13T19:30:00.000Z" }],
  });
});

test("(c) v1 migration: non-null shippedAt appends a ship entry after start", () => {
  const v1 = makeV1Manifest({ shippedAt: "2026-06-20T12:00:00.000Z" });
  const migrated = parseManifest(v1 as unknown);
  assert.deepStrictEqual(migrated.history, [
    { event: "start", actor: null, at: "2026-06-13T19:30:00.000Z" },
    { event: "ship", actor: null, at: "2026-06-20T12:00:00.000Z" },
  ]);
});

test("(c) v1 migration: null shippedAt yields a single-entry history", () => {
  const migrated = parseManifest(makeV1Manifest({ shippedAt: null }) as unknown);
  assert.strictEqual(migrated.history.length, 1);
  assert.strictEqual(migrated.history[0].event, "start");
});

test("(c) v1 migration: an upgraded manifest persists as v2 on its next write", () => {
  const migrated = parseManifest(makeV1Manifest() as unknown);
  const rewritten = parseManifest(JSON.parse(serializeManifest(migrated)));
  assert.strictEqual(rewritten.schemaVersion, 2);
  assert.deepStrictEqual(rewritten, migrated);
});

test("(c) v1 migration: a malformed v1 (missing startedAt) still fails loud", () => {
  const { startedAt: _omitted, ...rest } = makeV1Manifest();
  assert.throws(() => parseManifest(rest as unknown), /startedAt/);
});

test("(c) v1 migration: a mistyped v1 shippedAt (number) still fails loud", () => {
  const bad = { ...makeV1Manifest(), shippedAt: 0 };
  assert.throws(() => parseManifest(bad as unknown), /shippedAt/);
});

test("(d) invariant: both jiraKey and localKey null fails loud naming both fields", () => {
  const bad = makeManifest({ jiraKey: null, localKey: null });
  assert.throws(() => parseManifest(bad as unknown), /jiraKey, localKey/);
});

test("(e) history: unknown event fails loud with the indexed field path", () => {
  const bad = {
    ...makeManifest(),
    history: [{ event: "restart", actor: null, at: "2026-06-13T19:30:00.000Z" }],
  };
  assert.throws(() => parseManifest(bad as unknown), /history\[0\]\.event/);
});

test("(e) history: mistyped actor (number) fails loud", () => {
  const bad = {
    ...makeManifest(),
    history: [{ event: "start", actor: 7, at: "2026-06-13T19:30:00.000Z" }],
  };
  assert.throws(() => parseManifest(bad as unknown), /history\[0\]\.actor/);
});

test("(e) history: missing at fails loud", () => {
  const bad = { ...makeManifest(), history: [{ event: "start", actor: null }] };
  assert.throws(() => parseManifest(bad as unknown), /history\[0\]\.at/);
});

test("(e) history: a non-array history fails loud", () => {
  const bad = { ...makeManifest(), history: "start" };
  assert.throws(() => parseManifest(bad as unknown), /history must be an array/);
});

test("(e) history: a non-object entry fails loud with its index", () => {
  const validEntry = { event: "start", actor: null, at: "2026-06-13T19:30:00.000Z" };
  const bad = { ...makeManifest(), history: [validEntry, "ship"] };
  assert.throws(() => parseManifest(bad as unknown), /history\[1\] must be a non-null object/);
});

test("(f) displayKey: jira-born manifest yields the jiraKey", () => {
  assert.strictEqual(displayKey(makeManifest()), "MCA-101");
});

test("(f) displayKey: local-born manifest yields the localKey", () => {
  const manifest = makeManifest({ jiraKey: null, localKey: "RAF-1" });
  assert.strictEqual(displayKey(manifest), "RAF-1");
});

test("(f) displayKey: linked manifest prefers the jiraKey", () => {
  const manifest = makeManifest({ jiraKey: "MCA-101", localKey: "RAF-1" });
  assert.strictEqual(displayKey(manifest), "MCA-101");
});

test("(f) displayKey: defensive throw when both keys are null (bypassing the parser)", () => {
  const invalid = { ...makeManifest(), jiraKey: null, localKey: null } as TaskManifest;
  assert.throws(() => displayKey(invalid), /displayKey/);
});

test("(g) round-trip: parseManifest(serializeManifest(m)) deep-equals m", () => {
  const manifest = makeManifest();
  const roundTripped = parseManifest(JSON.parse(serializeManifest(manifest)));
  assert.deepStrictEqual(roundTripped, manifest);
});

test("(h) serialize output contract: trailing newline and 2-space indentation", () => {
  const output = serializeManifest(makeManifest());
  assert.ok(output.endsWith("}\n"), "output must end with a closing brace and newline");
  assert.ok(output.includes('\n  "jiraKey"'), "fields must be indented with two spaces");
});
