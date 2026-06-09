import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { assemblePayload, SCHEMA_VERSION } from "./assemble.js";
import type { FilteredOut, Issue, Payload, PayloadWarning } from "./payload.js";

// The frozen v2.0 acceptance fixture lives at the repo root, not in dist. This
// test compiles to packages/core/dist/assemble.test.js, so the root is three
// levels up (dist -> core -> packages -> root). Resolve cross-platform (R1).
const REPO_ROOT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
);
const FIXTURE_PATH = path.join(REPO_ROOT, "automation", "payload.json");

const frozen = JSON.parse(readFileSync(FIXTURE_PATH, "utf8")) as Payload;

function buildInputs(): {
  issues: Issue[];
  filteredOut: FilteredOut[];
  warnings: PayloadWarning[];
  meta: { runDate: string; generatedAt: string };
} {
  return {
    issues: frozen.issues,
    filteredOut: frozen.filtered_out,
    warnings: frozen.warnings,
    meta: { runDate: frozen.run_date, generatedAt: frozen.generated_at },
  };
}

test("assemblePayload reproduces the frozen v2.0 envelope", () => {
  const { issues, filteredOut, warnings, meta } = buildInputs();
  const payload = assemblePayload(issues, filteredOut, warnings, meta);
  assert.deepStrictEqual(payload, frozen);
});

test("assembled envelope top-level key order matches the seed order", () => {
  const { issues, filteredOut, warnings, meta } = buildInputs();
  const payload = assemblePayload(issues, filteredOut, warnings, meta);
  assert.deepStrictEqual(Object.keys(payload), [
    "schema_version",
    "run_date",
    "generated_at",
    "issues",
    "filtered_out",
    "warnings",
  ]);
});

test("schema_version is the constant \"2.0\"", () => {
  const { issues, filteredOut, warnings, meta } = buildInputs();
  const payload = assemblePayload(issues, filteredOut, warnings, meta);
  assert.strictEqual(SCHEMA_VERSION, "2.0");
  assert.strictEqual(payload.schema_version, "2.0");
});

test("run_date and generated_at pass through from meta unchanged", () => {
  const { issues, filteredOut, warnings } = buildInputs();
  const meta = { runDate: "2026-06-05", generatedAt: "2026-06-05T12:25:43-03:00" };
  const payload = assemblePayload(issues, filteredOut, warnings, meta);
  assert.strictEqual(payload.run_date, meta.runDate);
  assert.strictEqual(payload.generated_at, meta.generatedAt);
});

test("nullable entrega_iso and copy_url round-trip unchanged", () => {
  // Ground both polarities against the frozen fixture: MCA-62838 carries
  // copy_url: null, MCA-62539 carries entrega_iso: null, and MC-1049974 carries
  // a value for both. assemblePayload must preserve null as null and value as value.
  const withNullCopy = frozen.issues.find((i) => i.key === "MCA-62838");
  const withNullEntrega = frozen.issues.find((i) => i.key === "MCA-62539");
  const withValues = frozen.issues.find((i) => i.key === "MC-1049974");
  assert.ok(withNullCopy, "fixture should contain MCA-62838");
  assert.ok(withNullEntrega, "fixture should contain MCA-62539");
  assert.ok(withValues, "fixture should contain MC-1049974");
  assert.strictEqual(withNullCopy.copy_url, null);
  assert.strictEqual(withNullEntrega.entrega_iso, null);

  const issues: Issue[] = [withNullCopy, withNullEntrega, withValues];
  const meta = { runDate: frozen.run_date, generatedAt: frozen.generated_at };
  const payload = assemblePayload(issues, [], [], meta);

  assert.strictEqual(payload.issues[0].copy_url, null);
  assert.strictEqual(payload.issues[1].entrega_iso, null);
  assert.strictEqual(payload.issues[2].copy_url, withValues.copy_url);
  assert.strictEqual(payload.issues[2].entrega_iso, withValues.entrega_iso);
});

test("inputs pass through without mutation, reordering, or filtering", () => {
  const { issues, filteredOut, warnings, meta } = buildInputs();
  const payload = assemblePayload(issues, filteredOut, warnings, meta);
  // Same array references (no copy), so order and element identity are preserved.
  assert.strictEqual(payload.issues, issues);
  assert.strictEqual(payload.filtered_out, filteredOut);
  assert.strictEqual(payload.warnings, warnings);
  assert.strictEqual(payload.issues.length, frozen.issues.length);
  assert.strictEqual(payload.filtered_out.length, 5);
});

test("empty warnings input yields an empty warnings array", () => {
  const payload = assemblePayload([], [], [], {
    runDate: "2026-06-05",
    generatedAt: "2026-06-05T12:25:43-03:00",
  });
  assert.deepStrictEqual(payload.warnings, []);
  assert.deepStrictEqual(payload.filtered_out, []);
});
