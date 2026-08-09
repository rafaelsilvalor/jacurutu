import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";

import {
  c1, c2, c4, c5, c7, c9, c10, c11,
  extractCommitSubjects,
  validateBrief,
  PASS, FAIL, STOP,
} from "./brief-checks.mjs";
import { VERB_ALLOWLIST, VERB_DENYLIST } from "./commit-message.mjs";

const LISTS = { allow: VERB_ALLOWLIST, deny: VERB_DENYLIST };
const lines = (t) => t.split("\n");

/** A minimal brief that passes all eleven checks. */
function conformingBrief(overrides = {}) {
  const parts = {
    title: "# Brief: 2026-08-09 — a conforming brief",
    category: "> **Category:** M",
    plan: "> **Plan required:** yes",
    branch: "> **Branch:** `chore/a-slug`",
    body: [
      "## Context",
      "It exists.",
      "## Goal",
      "Make it so.",
      "## Constraints",
      "Stay small.",
      "## Done criteria",
      "It is so.",
      "### Edit 1 — do the thing",
      "Details.",
      "### Commit sequence",
      "1. `chore(scope): add the thing`",
      "## Pause points",
      "Pause 1, Pause 2 and Pause 3 all apply.",
    ].join("\n"),
    ...overrides,
  };
  return [parts.title, parts.category, parts.plan, parts.branch, parts.body].join("\n");
}

// WHEN every check holds, the verdict shall be APPROVED with eleven results.
test("a conforming brief is APPROVED 11/11", () => {
  const { checks, verdict } = validateBrief(conformingBrief(), LISTS);
  assert.equal(verdict, "APPROVED");
  assert.equal(checks.length, 11);
  assert.deepEqual(checks.filter((c) => c.status !== PASS), []);
});

// WHEN line 1 carries a pre-cutover numeric identifier, C1 shall fail. The
// three-digit shape was valid until 2026-08-07 and is not accepted for a brief
// in flight after it.
test("C1 requires the dated identifier", () => {
  assert.equal(c1(lines("# Brief: 2026-08-09 — x")).status, PASS);
  assert.equal(c1(lines("# Brief: 052 — x")).status, FAIL);
  assert.equal(c1(lines("# Brief 2026-08-09 — x")).status, FAIL);
});

// WHEN the Category line carries an annotation, C2 shall fail. This is the
// shape that produced a REJECTED cycle in the record: the metadata line is
// anchored at both ends and tolerates no trailer.
test("C2 rejects an annotated Category line", () => {
  assert.equal(c2(lines("> **Category:** M")).status, PASS);
  assert.equal(c2(lines("> **Category:** M — docs only")).status, FAIL);
  assert.equal(c2(lines("> **Category:** S")).status, FAIL);
});

// WHEN the declared branch is the session scaffolding branch, C4 shall fail
// and quote it. A brief that mandates work on `claude/*` is the one validator
// catch in the record that prevented real process damage.
test("C4 catches a claude/* scaffolding branch", () => {
  assert.equal(c4(lines("> **Branch:** `chore/a-slug`")).status, PASS);
  const scaffold = c4(lines("> **Branch:** `claude/worktree-gotcha-docs-614c09`"));
  assert.equal(scaffold.status, FAIL);
  assert.match(scaffold.detail, /claude\/worktree-gotcha-docs/);
});

// WHEN the four required sections are out of order, C5 shall name the pair.
test("C5 enforces section order, not just presence", () => {
  const ordered = ["## Context", "## Goal", "## Constraints", "## Done criteria"];
  assert.equal(c5(ordered).status, PASS);
  const swapped = ["## Goal", "## Context", "## Constraints", "## Done criteria"];
  assert.equal(c5(swapped).status, FAIL);
  assert.equal(c5(["## Context", "## Goal"]).status, FAIL);
});

// WHEN a Commit sequence item carries an annotation, C7 shall fail and quote
// the MEASURED string. The 2026-08-09 REJECTED cycle turned on exactly this:
// the subject was 57 and the line measured 73. Failing is correct — the format
// never licensed a trailer — and the diagnostic must not claim the subject is
// too long when it is not.
test("C7 measures the line and quotes what it measured", () => {
  // Built to length rather than asserted by eye: a subject that fits, and the
  // same subject with a trailer that pushes the LINE past the budget.
  const subject = `docs(explorations): ${"a".repeat(37)}`;
  const annotation = " — Edits 3 and 4";
  assert.equal(subject.length, 57);
  assert.equal(subject.length + annotation.length, 73, "the pair recorded on 2026-08-09");

  const verdict = c7(["### Commit sequence", `1. \`${subject}\`${annotation}`]);
  assert.equal(verdict.status, FAIL);
  assert.match(verdict.detail, /measured 73/);
  assert.match(verdict.detail, /Edits 3 and 4/);
  assert.doesNotMatch(verdict.detail, /subject is too long/);
});

// WHEN the same subject carries no trailer, C7 shall pass — the subject was
// never the problem, and the diagnostic above must not have implied it was.
test("C7 passes the same subject without its annotation", () => {
  const subject = `docs(explorations): ${"a".repeat(37)}`;
  const verdict = c7(["### Commit sequence", `1. \`${subject}\``]);
  assert.equal(verdict.status, PASS);
  assert.match(verdict.detail, /longest 57/);
});

// WHEN the heading is the quoted subsection rather than the section, the
// extractor shall not capture it — unanchored, it would report a confident
// answer about the wrong block.
test("the Commit sequence heading is anchored at both ends", () => {
  assert.equal(extractCommitSubjects(["### Commit sequence heading", "1. `chore: add x`"]), null);
  assert.deepEqual(extractCommitSubjects(["### Commit sequence", "1. `chore: add x`"]), ["chore: add x"]);
});

// WHEN items are backticked, the strip shall run before C8 and C11 see them.
// Without it their `^` anchors never match and both fail on every valid brief.
test("backticks are stripped before the anchored checks run", () => {
  assert.deepEqual(extractCommitSubjects(["### Commit sequence", "1. `feat(x): add y`"]), ["feat(x): add y"]);
});

// WHEN the brief writes pt-BR "Pausa", C9 shall fail: the brief is an
// agent-consumed surface and R9 makes it English-only.
test("C9 rejects pt-BR Pausa on an agent-consumed brief", () => {
  const ptbr = "## Pause points\nPause 1, Pause 2, Pause 3. A Pausa 3 vale.";
  assert.equal(c9(lines(ptbr), ptbr).status, FAIL);
  const en = "## Pause points\nPause 1, Pause 2 and Pause 3 apply.";
  assert.equal(c9(lines(en), en).status, PASS);
});

// WHEN pt-BR sits inside a fenced code block, C10 shall stay silent — quoted
// pt-BR is evidence, not authorship.
test("C10 ignores pt-BR inside code fences", () => {
  const fenced = ["```", "isso porque nao deve falhar dentro do bloco", "```"];
  assert.equal(c10(fenced).status, PASS);
  // The marker list is accented, faithfully to the original. "nao" is not on
  // it and must not be treated as one; "porque" is.
  assert.equal(c10(["este texto porque esta fora do bloco"]).status, FAIL);
  assert.equal(c10(["plain english prose with no markers"]).status, PASS);
  assert.equal(c10(["a line that says nao without the accent"]).status, PASS);
});

// WHEN a verb sits on neither list, C11 shall STOP rather than FAIL: the
// distinction between "violates a known rule" and "nobody has ruled" is the
// point of the allowlist.
test("C11 separates a denied verb from an unruled one", () => {
  const seq = (subject) => ["### Commit sequence", `1. \`${subject}\``];
  assert.equal(c11(seq("chore: add x"), "", LISTS).status, PASS);
  assert.equal(c11(seq("chore: added x"), "", LISTS).status, FAIL);
  assert.equal(c11(seq("chore: frobnicate x"), "", LISTS).status, STOP);
  assert.equal(c11(seq("chore: add x"), "", { allow: [], deny: [] }).status, STOP);
});

// WHEN any check fails the verdict is REJECTED; WHEN only a STOP is present it
// is STOP, so an unruled verb never reads as a rule violation.
test("the verdict mirrors the agent's precedence", () => {
  assert.equal(validateBrief(conformingBrief(), LISTS).verdict, "APPROVED");
  assert.equal(
    validateBrief(conformingBrief({ category: "> **Category:** M — annotated" }), LISTS).verdict,
    "REJECTED",
  );
  const unruled = conformingBrief().replace("add the thing", "frobnicate the thing");
  assert.equal(validateBrief(unruled, LISTS).verdict, "STOP");
});

// WHEN run against a real brief the agent APPROVED 11/11, the port shall reach
// the same verdict. A behaviour-preserving port is only as good as its
// agreement with the artifact it replaces.
test("the port agrees with the agent on a real approved brief", () => {
  const real = readFileSync("docs/tasks/2026-08-09-fetch-credential-guard/brief.md", "utf8");
  const { checks, verdict } = validateBrief(real, LISTS);
  const failures = checks.filter((c) => c.status !== PASS);
  assert.deepEqual(
    failures.map((f) => `${f.id}: ${f.detail}`),
    [],
    "the agent recorded APPROVED 11/11 for this brief",
  );
  assert.equal(verdict, "APPROVED");
});
