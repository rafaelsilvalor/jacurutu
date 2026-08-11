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

// WHEN an implementation file passes the budget it shall be denied; WHEN a test
// file passes it and maps 1:1 to a subject module, E6 applies and nothing is
// reported — splitting a spec by line count fragments it, and "split by
// responsibility" has no valid move on a file already scoped to one subject.
test("E6 lets a 1:1 test file past the budget", () => {
  const big = new Array(MAX_FILE_LINES + 1).fill("const x = 1;");
  const io = { exists: (p) => p === "packages/cli/src/a.ts" };
  assert.equal(checkFileSize("packages/cli/src/a.ts", big, io)[0].decision, "deny");
  assert.deepEqual(checkFileSize("packages/cli/src/a.test.ts", big, io), []);
});

// WHEN a test file passes the budget with no 1:1 subject module, E6's
// precondition fails and the original instruction applies again — there the
// split does have a valid axis.
test("E6 does not cover a test with no subject module", () => {
  const big = new Array(MAX_FILE_LINES + 1).fill("const x = 1;");
  const verdict = checkFileSize("packages/cli/src/orphan.test.ts", big, { exists: () => false });
  assert.equal(verdict[0].decision, "deny");
  assert.match(verdict[0].reason, /no 1:1 subject module/);
});

// WHEN a 1:1 test file passes the E6 ceiling, it shall ask — and the finding
// shall point at the subject, not at the test. A spec that large is a signal
// about what it covers.
test("the E6 ceiling points at the subject, not the test", () => {
  const huge = new Array(801).fill("const x = 1;");
  const io = { exists: () => true };
  const verdict = checkFileSize("packages/cli/src/a.test.ts", huge, io);
  assert.equal(verdict[0].decision, "ask");
  assert.match(verdict[0].reason, /Split the subject, not the test/);
});

// WHEN no existence oracle is supplied, an over-budget test shall not be denied
// on missing information.
test("E6 does not deny for want of an oracle", () => {
  const big = new Array(MAX_FILE_LINES + 1).fill("const x = 1;");
  assert.deepEqual(checkFileSize("packages/cli/src/a.test.ts", big, undefined), []);
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

// WHEN findings are summarized, the verdict shall name which rules spoke: the
// distinct `rule` values of the findings it is actually built from, comma-joined,
// and `none` when there were none. This identifier costs nothing to derive
// because every finding already carries its rule — the asymmetry the D6 table
// records against the two modules that carried it only inside prose.
test("summarize carries the distinct rules as its D6 check identifier", () => {
  assert.equal(summarize([]).check, "none");

  const twoRules = inspectFile(
    "packages/core/src/a.ts",
    [
      `import { x } from "@saci/adapter-jira";`,
      `import { y } from "./y";`,
    ].join("\n"),
  );
  assert.equal(summarize(twoRules).check, "R25,R21");

  // The deny tier hides the ask tier's reason, so it hides its rule too:
  // the identifier describes the verdict, not everything that was found.
  const mixed = inspectFile(
    "packages/core/src/a.ts",
    [`import { x } from "@saci/adapter-jira";`, `const p = "ATATT3xFfGF0abcdefghijklmnop";`].join("\n"),
  );
  assert.equal(summarize(mixed).check, "R25");

  assert.equal(
    summarize(scanSecrets("x.ts", lines(`const secret = "abcdefghijklmnop";`))).check,
    "secret",
  );
});

// WHEN the docs guard folds its own findings through this same function, the
// identifier shall be the docs rules — which is why `docs-checks.mjs` needs no
// change of its own to appear in the stream.
test("summarize inherits identifiers from any finding shape", () => {
  const docsFindings = [
    { rule: "ref", file: "docs/A.md", line: 3, decision: "deny", reason: "resolves to no file" },
    { rule: "R9", file: "docs/A.md", line: 9, decision: "ask", reason: "pt-BR on an English surface" },
  ];
  assert.equal(summarize(docsFindings).check, "ref");
  assert.equal(summarize([docsFindings[1]]).check, "R9");
  assert.equal(summarize([docsFindings[1], docsFindings[1]]).check, "R9");
});

// WHEN the identifier is added, the decision and the reason shall be untouched.
test("adding check changes neither decision nor reason", () => {
  const empty = summarize([]);
  assert.equal(empty.decision, "allow");
  assert.equal(empty.reason, "");

  const findings = inspectFile(
    "packages/core/src/a.ts",
    [`import { x } from "@saci/adapter-jira";`].join("\n"),
  );
  const verdict = summarize(findings);
  assert.equal(verdict.decision, "deny");
  assert.equal(
    verdict.reason,
    "1 finding(s) in the staged diff:\n  packages/core/src/a.ts:1 — R25: " +
      "core must not import an adapter; the dependency direction is inward only",
  );
});
