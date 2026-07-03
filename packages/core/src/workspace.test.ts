import { test } from "node:test";
import assert from "node:assert";

import {
  parseManifest,
  serializeManifest,
  TASK_MANIFEST_SCHEMA_VERSION,
  type TaskManifest,
} from "./workspace.js";

/** A well-formed v0 manifest; tests override only the fields they exercise. */
function makeManifest(overrides: Partial<TaskManifest> = {}): TaskManifest {
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

test("(a) happy path: a well-formed v0 object narrows with all fields intact", () => {
  const manifest = makeManifest();
  const parsed = parseManifest(manifest as unknown);
  assert.deepStrictEqual(parsed, manifest);
  assert.strictEqual(parsed.schemaVersion, TASK_MANIFEST_SCHEMA_VERSION);
  assert.strictEqual(parsed.shippedAt, null);
});

test("(a) happy path: a shipped manifest keeps its shippedAt timestamp", () => {
  const manifest = makeManifest({ shippedAt: "2026-06-20T12:00:00.000Z" });
  assert.deepStrictEqual(parseManifest(manifest as unknown), manifest);
});

test("(b) wrong schemaVersion (2) fails loud, no migration", () => {
  const bad = { ...makeManifest(), schemaVersion: 2 };
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

test("(c) drivePath given as a string (not string[]) fails loud", () => {
  const bad = { ...makeManifest(), drivePath: "AVULSAS/OAB/2026-06/MCA-101_kv-aulao" };
  assert.throws(() => parseManifest(bad as unknown), /drivePath/);
});

test("(c) missing slug fails loud", () => {
  const { slug: _omitted, ...rest } = makeManifest();
  assert.throws(() => parseManifest(rest as unknown), /slug/);
});

test("(c) mistyped startedAt (number, not string) fails loud", () => {
  const bad = { ...makeManifest(), startedAt: 1718304600000 };
  assert.throws(() => parseManifest(bad as unknown), /startedAt/);
});

test("(c) mistyped shippedAt (number, not string|null) fails loud", () => {
  const bad = { ...makeManifest(), shippedAt: 0 };
  assert.throws(() => parseManifest(bad as unknown), /shippedAt/);
});

test("(d) round-trip: parseManifest(serializeManifest(m)) deep-equals m", () => {
  const manifest = makeManifest();
  const roundTripped = parseManifest(JSON.parse(serializeManifest(manifest)));
  assert.deepStrictEqual(roundTripped, manifest);
});

test("(e) serialize output contract: trailing newline and 2-space indentation", () => {
  const output = serializeManifest(makeManifest());
  assert.ok(output.endsWith("}\n"), "output must end with a closing brace and newline");
  assert.ok(output.includes('\n  "jiraKey"'), "fields must be indented with two spaces");
});
