import { test } from "node:test";
import assert from "node:assert";

import {
  checkDependencyDirection,
  checkImportExtensions,
  checkNoAny,
  checkFileSize,
  scanSecrets,
  inspectFile,
  summarize,
  MAX_FILE_LINES,
} from "./architecture.mjs";

const lines = (text) => text.split("\n");

// WHEN core imports an adapter, R25 shall deny; WHEN any other package does,
// it shall stay silent — the direction is inward only, not import-free.
test("R25 fires only inside core", () => {
  const offending = lines(`import { x } from "@saci/adapter-jira";`);
  assert.equal(checkDependencyDirection("packages/core/src/policy.ts", offending).length, 1);
  assert.equal(checkDependencyDirection("packages/core/src/policy.ts", offending)[0].decision, "deny");
  assert.equal(checkDependencyDirection("packages/cli/src/run-fetch.ts", offending).length, 0);
  assert.equal(
    checkDependencyDirection("packages/core/src/policy.ts", lines(`import { x } from "./derive.js";`)).length,
    0,
  );
});

// WHEN the adapter word appears in a comment, R25 shall not fire — the rule is
// about imports, and commentary about the rule is not a violation of it.
test("R25 ignores comments", () => {
  const commented = lines(`// core never imports from an adapter package`);
  assert.equal(checkDependencyDirection("packages/core/src/policy.ts", commented).length, 0);
});

// WHEN a relative import omits its compiled extension, R21 shall deny.
test("R21 requires the resolved extension on relative imports", () => {
  assert.equal(checkImportExtensions("packages/cli/src/a.ts", lines(`import { x } from "./b";`)).length, 1);
  assert.equal(checkImportExtensions("packages/cli/src/a.ts", lines(`import { x } from "../c/d";`)).length, 1);
  assert.equal(checkImportExtensions("packages/cli/src/a.ts", lines(`import "./side-effect";`)).length, 1);
  assert.equal(checkImportExtensions("packages/cli/src/a.ts", lines(`import { x } from "./b.js";`)).length, 0);
  assert.equal(checkImportExtensions("packages/cli/src/a.ts", lines(`import data from "./x.json";`)).length, 0);
});

// WHEN the specifier is a bare package name, R21 shall stay silent — the
// extension requirement is for relative paths only.
test("R21 leaves bare specifiers alone", () => {
  assert.equal(checkImportExtensions("packages/cli/src/a.ts", lines(`import { x } from "@saci/core";`)).length, 0);
  assert.equal(checkImportExtensions("packages/cli/src/a.ts", lines(`import path from "node:path";`)).length, 0);
});

// WHEN `any` appears with no rationale, R24 shall deny; WHEN a comment sits on
// the line or immediately above it, the documented escape hatch shall pass.
test("R24 denies unjustified any and accepts a justified one", () => {
  assert.equal(checkNoAny("packages/cli/src/a.ts", lines(`function f(x: any) {}`)).length, 1);
  assert.equal(checkNoAny("packages/cli/src/a.ts", lines(`const y = z as any;`)).length, 1);
  assert.equal(checkNoAny("packages/cli/src/a.ts", lines(`let v: any[] = [];`)).length, 1);
  assert.equal(
    checkNoAny("packages/cli/src/a.ts", lines(`function f(x: any) {} // untyped third-party payload`)).length,
    0,
  );
  assert.equal(
    checkNoAny("packages/cli/src/a.ts", lines(`// untyped third-party payload\nfunction f(x: any) {}`)).length,
    0,
  );
});

// WHEN the word "any" appears in prose, R24 shall not fire on it.
test("R24 does not fire on the English word", () => {
  assert.equal(checkNoAny("packages/cli/src/a.ts", lines(`const msg = "pick any template";`)).length, 0);
});

// WHEN a v2 source file exceeds the budget, R5 shall fire; the v1 files under
// E2 are out of scope because the check never leaves packages/.
test("R5 applies to v2 packages only", () => {
  const big = new Array(MAX_FILE_LINES + 1).fill("const x = 1;");
  assert.equal(checkFileSize("packages/cli/src/a.ts", big).length, 1);
  assert.equal(checkFileSize("packages/cli/src/a.ts", new Array(MAX_FILE_LINES).fill("x")).length, 0);
  assert.equal(checkFileSize("main.js", big).length, 0);
  assert.equal(checkFileSize("renderer/app.js", big).length, 0);
});

// WHEN the overlong file is an implementation file, R5 shall deny; WHEN it is a
// test, it shall ask. No implementation file was near the budget on
// 2026-08-09 while two test files had drifted past it, and R5 records no
// exception for tests — so the guard escalates rather than deciding.
test("R5 denies implementation and asks on tests", () => {
  const big = new Array(MAX_FILE_LINES + 1).fill("const x = 1;");
  assert.equal(checkFileSize("packages/cli/src/a.ts", big)[0].decision, "deny");
  assert.equal(checkFileSize("packages/cli/src/a.test.ts", big)[0].decision, "ask");
  assert.match(checkFileSize("packages/cli/src/a.test.ts", big)[0].reason, /your call/);
});

// WHEN a credential-shaped literal is staged, the scan shall ASK rather than
// deny: the match is probabilistic, and a false block teaches the author to
// route around the guard.
test("secret scanning escalates instead of blocking", () => {
  const hit = scanSecrets("packages/cli/src/a.ts", lines(`const t = "ATATT3xFfGF0abcdefghijklmnopqrstuv";`));
  assert.equal(hit.length, 1);
  assert.equal(hit[0].decision, "ask");
  assert.equal(scanSecrets("x.ts", lines(`-----BEGIN PRIVATE KEY-----`)).length, 1);
  assert.equal(scanSecrets("x.ts", lines(`const password = "hunter2hunter2hunter2";`)).length, 1);
});

// WHEN the value is obviously an example or comes from the environment, the
// scan shall stay quiet — these are the lines that make a scanner ignorable.
test("secret scanning skips placeholders and env reads", () => {
  assert.equal(scanSecrets("x.ts", lines(`const token = process.env.SACI_JIRA_TOKEN;`)).length, 0);
  assert.equal(scanSecrets("x.ts", lines(`const token = "your-token-here";`)).length, 0);
  assert.equal(scanSecrets("x.ts", lines(`SACI_JIRA_TOKEN=<your token>`)).length, 0);
  assert.equal(scanSecrets("x.ts", lines(`const secret = "xxxxxxxxxxxxxxxx";`)).length, 0);
});

// WHEN a file is clean, inspectFile shall return nothing at all.
test("a conforming file produces no findings", () => {
  const content = [
    `import path from "node:path";`,
    `import { derive } from "./derive.js";`,
    `export function f(x: unknown): string { return String(x); }`,
  ].join("\n");
  assert.deepEqual(inspectFile("packages/cli/src/a.ts", content), []);
});

// WHEN findings mix severities, the summary shall take the most restrictive and
// report only that tier, so an ask never hides behind a deny.
test("summarize takes the most restrictive tier", () => {
  assert.equal(summarize([]).decision, "allow");
  const mixed = inspectFile(
    "packages/core/src/a.ts",
    [`import { x } from "@saci/adapter-jira";`, `const p = "ATATT3xFfGF0abcdefghijklmnop";`].join("\n"),
  );
  const verdict = summarize(mixed);
  assert.equal(verdict.decision, "deny");
  assert.match(verdict.reason, /R25/);
  assert.doesNotMatch(verdict.reason, /secret/);
  assert.equal(summarize(scanSecrets("x.ts", lines(`const secret = "abcdefghijklmnop";`))).decision, "ask");
});
