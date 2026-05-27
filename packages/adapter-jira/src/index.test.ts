import { test } from "node:test";
import assert from "node:assert";

// Phase 1 sentinel: confirms the package compiles, the test
// runner discovers this file, and node:test executes without
// error. Real tests arrive in Phase 2 with domain logic.
test("package compiles and runs", () => {
  assert.strictEqual(true, true);
});
