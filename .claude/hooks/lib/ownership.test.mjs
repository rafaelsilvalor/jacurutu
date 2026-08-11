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

// WHEN a write is decided, the verdict shall carry its D6 check identifier. The
// three no-opinion returns take `not-applicable`, which is what lets the
// executable tell "this hook had nothing to say" apart from "this hook allowed
// the write" — the first is silence, the second is a gate event.
test("every ownership verdict carries its D6 check identifier", () => {
  const read = decideOwnership({
    agentType: "code",
    toolName: "Read",
    filePath: "packages/cli/src/run-start.test.ts",
  });
  assert.equal(read.check, "not-applicable");
  assert.equal(write("executor", "packages/cli/src/run-start.test.ts").check, "not-applicable");
  assert.equal(write("code", "").check, "not-applicable");

  assert.equal(write("code", "packages/cli/src/run-start.test.ts").check, "pair-code-writes-test");
  assert.equal(write("test", "packages/cli/src/run-start.ts").check, "pair-test-writes-impl");
  assert.equal(write("code", "packages/cli/src/run-start.ts").check, "pair-ok");
  assert.equal(write("test", "packages/cli/src/run-start.test.ts").check, "pair-ok");
});

// WHEN the identifier is added, `allowed` shall keep its name and its value on
// every path. `.claude/hooks/file-ownership.mjs` branches on `allowed` alone, so
// `check` is additive or it is a behavior change wearing a new field's clothes.
test("adding check leaves allowed untouched on every path", () => {
  assert.equal(write("executor", "packages/cli/src/run-start.test.ts").allowed, true);
  assert.equal(write("code", "").allowed, true);
  assert.equal(write("code", "packages/cli/src/run-start.test.ts").allowed, false);
  assert.equal(write("test", "packages/cli/src/run-start.ts").allowed, false);
  assert.equal(write("code", "packages/cli/src/run-start.ts").allowed, true);
  assert.equal(write("test", "packages/cli/src/run-start.test.ts").allowed, true);

  const denied = write("code", "packages/cli/src/run-start.test.ts");
  assert.match(denied.reason, /^Denied: @code may not write test files/);
});
