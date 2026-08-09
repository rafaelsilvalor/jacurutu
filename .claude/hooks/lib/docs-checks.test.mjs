import { test } from "node:test";
import assert from "node:assert";

import {
  extractPathReferences,
  resolveReference,
  resolverFor,
  checkReferences,
  checkLanguage,
  inspectDocument,
} from "./docs-checks.mjs";

const io = (present) => resolverFor(present);

// WHEN a reference is path-shaped it shall be extracted; WHEN it is a bare
// filename in prose it shall not. Flagging names would produce noise at a rate
// that trains the reader to ignore the check.
test("only path-shaped references are extracted", () => {
  const found = extractPathReferences(
    "the contract (`payload.ts`) lives in `packages/core/src/payload.ts`",
  ).map((r) => r.path);
  assert.deepEqual(found, ["packages/core/src/payload.ts"]);
});

// WHEN a reference carries a placeholder segment, it shall be skipped: it names
// a shape, not a file.
test("placeholder paths are not references", () => {
  const found = extractPathReferences(
    "briefs live at `docs/tasks/<task-id>-<slug>/brief.md` and tests at `packages/*/dist/x.test.js`",
  );
  assert.deepEqual(found, []);
});

// WHEN a reference matches a tracked path exactly, or is a suffix of one, it
// resolves. harness/init/01-*.md cites its siblings as `init/02-*.md` — loose
// prose naming a real file. What must fail is a reference that matches nothing
// anywhere, which is what a deletion or a rename leaves behind.
test("a reference resolves exactly or as a suffix of a tracked path", () => {
  const r = resolverFor(["harness/init/02-create-claude-md.md"]);
  assert.equal(resolveReference("harness/init/02-create-claude-md.md", r), true);
  assert.equal(resolveReference("init/02-create-claude-md.md", r), true);
  assert.equal(resolveReference("harness/prompts/task-brief-template.md", r), false);
  // A suffix must break on a separator, so a shorter tail cannot masquerade.
  assert.equal(resolveReference("create-claude-md.md", r), false);
});

// WHEN a path resolves nowhere, it shall be denied and the line named.
test("an unresolvable reference is denied with its line", () => {
  const findings = checkReferences(
    "docs/A.md",
    "line one\nsee `harness/workflows/setup-chat.md` for that",
    io([]),
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].decision, "deny");
  assert.equal(findings[0].line, 2);
  assert.match(findings[0].reason, /setup-chat\.md/);
});

// WHEN the named file is deliberately absent — gitignored credentials, or a
// path inside a dependency — the absence IS the correct state, and reporting
// it would be noise on the check's very first run.
test("out-of-scope paths are the correct absence", () => {
  const content = "never commit `automation/credentials.json`\nthe trap is in `gaxios/build/cjs/src/common.js`";
  assert.equal(checkReferences("docs/A.md", content, io([])).length, 2);
  const scoped = {
    ...io([]),
    isOutOfScope: (p) => p.startsWith("automation/credentials") || p.startsWith("gaxios/"),
  };
  assert.deepEqual(checkReferences("docs/A.md", content, scoped), []);
});

// WHEN pt-BR appears on an English-only surface, it shall be raised; WHEN it
// appears under harness/, it shall not — R9 makes that surface pt-BR-tolerant,
// COPIAR payloads included.
test("R9 applies by surface, not by directory depth", () => {
  const ptbr = "esta linha nao deveria passar porque esta em portugues";
  assert.equal(checkLanguage("docs/PROCESS_MAP.md", ptbr).length, 1);
  assert.equal(checkLanguage("CLAUDE.md", ptbr).length, 1);
  assert.equal(checkLanguage(".claude/agents/executor.md", ptbr).length, 1);
  assert.equal(checkLanguage("harness/workflows/setup-code.md", ptbr).length, 0);
  assert.equal(checkLanguage("harness/README.md", ptbr).length, 0);
});

// WHEN the file is the root README, E7 exempts it: it is the product's front
// door for a Brazilian team, not an agent-consumed document. WHEN it is any
// other README, the surface still decides — `docs/explorations/README.md` is
// doctrine and stays English. The exception is one file, not a filename.
test("E7 exempts the root README and nothing else named README", () => {
  const ptbr = "esta linha nao deveria passar porque esta em portugues";
  assert.equal(checkLanguage("README.md", ptbr).length, 0);
  assert.equal(checkLanguage("docs/explorations/README.md", ptbr).length, 1);
});

// WHEN pt-BR sits inside a fenced block, it shall be ignored: quoted pt-BR is
// evidence, and harness prompts are quoted in the doctrine on purpose.
test("fenced pt-BR is quotation, not authorship", () => {
  const fenced = "prose\n```\ncola isso porque e um exemplo\n```\nmore prose";
  assert.equal(checkLanguage("docs/A.md", fenced).length, 0);
});

// WHEN the language check fires it shall ASK, never deny: marker matching is
// probabilistic and a false block on a legitimate quotation teaches the author
// to route around the guard.
test("a language finding escalates rather than blocking", () => {
  const findings = checkLanguage("docs/A.md", "isso nao pode passar porque falha");
  assert.equal(findings[0].decision, "ask");
  assert.equal(findings[0].rule, "R9");
});

// WHEN a document is clean, nothing is reported at all.
test("a conforming document produces no findings", () => {
  const content = "See `docs/GOTCHAS.md` for the traps.";
  assert.deepEqual(inspectDocument("docs/A.md", content, io(["docs/GOTCHAS.md"])), []);
});
