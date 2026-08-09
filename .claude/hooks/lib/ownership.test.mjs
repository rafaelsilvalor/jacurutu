import { test } from "node:test";
import assert from "node:assert";

import { decideOwnership, isTestFile } from "./ownership.mjs";

const write = (agentType, filePath) => decideOwnership({ agentType, toolName: "Write", filePath });

// WHEN a path carries the `.test.<ext>` marker on its basename, it shall be
// recognized as a test file on either path separator.
test("isTestFile recognizes test files across separators and extensions", () => {
  assert.equal(isTestFile("packages/cli/src/run-start.test.ts"), true);
  assert.equal(isTestFile("packages\\cli\\src\\run-start.test.ts"), true);
  assert.equal(isTestFile(".claude/hooks/lib/ownership.test.mjs"), true);
  assert.equal(isTestFile("packages/cli/src/run-start.ts"), false);
  assert.equal(isTestFile("docs/test.md"), false);
  assert.equal(isTestFile(""), false);
  assert.equal(isTestFile(undefined), false);
});

// WHEN @code attempts to write a test file, the write shall be denied — this is
// the structural half of the competing-incentive design.
test("@code cannot write test files", () => {
  const verdict = write("code", "packages/cli/src/run-start.test.ts");
  assert.equal(verdict.allowed, false);
  assert.match(verdict.reason, /@code may not write test files/);
});

// WHEN @code writes implementation, the write shall proceed.
test("@code can write implementation files", () => {
  assert.equal(write("code", "packages/cli/src/run-start.ts").allowed, true);
});

// WHEN @test attempts to write implementation, the write shall be denied.
test("@test cannot write implementation files", () => {
  const verdict = write("test", "packages/cli/src/run-start.ts");
  assert.equal(verdict.allowed, false);
  assert.match(verdict.reason, /@test may not write implementation files/);
});

// WHEN @test writes a test, the write shall proceed.
test("@test can write test files", () => {
  assert.equal(write("test", "packages/cli/src/run-start.test.ts").allowed, true);
});

// WHEN the actor is the main thread or any agent outside the pair, the hook
// shall have no opinion — it must not become a global write filter.
test("actors outside the pair are untouched", () => {
  assert.equal(write(undefined, "packages/cli/src/run-start.test.ts").allowed, true);
  assert.equal(write("Explore", "packages/cli/src/run-start.ts").allowed, true);
  assert.equal(write("executor", "packages/cli/src/run-start.test.ts").allowed, true);
});

// WHEN the tool is not a write tool, the hook shall allow it regardless of
// agent or path: reading a test is how @code learns the specification.
test("non-write tools are always allowed", () => {
  const verdict = decideOwnership({
    agentType: "code",
    toolName: "Read",
    filePath: "packages/cli/src/run-start.test.ts",
  });
  assert.equal(verdict.allowed, true);
});

// WHEN the payload carries no usable path, the hook shall allow rather than
// deny on incomplete input.
test("a missing path is not a denial", () => {
  assert.equal(write("code", undefined).allowed, true);
  assert.equal(write("code", "").allowed, true);
});
