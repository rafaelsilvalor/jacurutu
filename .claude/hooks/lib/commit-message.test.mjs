import { test } from "node:test";
import assert from "node:assert";

import {
  isShellTool,
  isCommitCommand,
  extractCommitMessage,
  decideCommitMessage,
  VERB_ALLOWLIST,
  VERB_DENYLIST,
  MAX_SUBJECT_LENGTH,
} from "./commit-message.mjs";

const LISTS = { allow: ["add", "fix", "document", "wire"], deny: ["added", "fixing", "documented"] };

// WHEN a commit is issued through PowerShell rather than Bash, the guard shall
// still see it. This environment's primary shell is PowerShell, so matching
// Bash alone would have left every real commit unguarded.
test("both shell tools are inspected", () => {
  assert.equal(isShellTool("Bash"), true);
  assert.equal(isShellTool("PowerShell"), true);
  assert.equal(isShellTool("Write"), false);
  assert.equal(isShellTool(undefined), false);
});

// WHEN the command invokes `git commit`, it shall be recognized; sibling
// porcelain and unrelated commands shall not be.
test("isCommitCommand isolates git commit", () => {
  assert.equal(isCommitCommand('git commit -m "chore: add x"'), true);
  assert.equal(isCommitCommand('git add . && git commit -m "chore: add x"'), true);
  assert.equal(isCommitCommand("git -C /repo commit --amend"), true);
  assert.equal(isCommitCommand("git commit-tree abc123"), false);
  assert.equal(isCommitCommand("git log --oneline"), false);
  assert.equal(isCommitCommand(undefined), false);
});

// WHEN the message arrives via -m, --message, repeated flags or a here-string,
// it shall be extracted verbatim.
test("extractCommitMessage handles the shapes commits actually take", () => {
  assert.equal(extractCommitMessage('git commit -m "chore: add x"'), "chore: add x");
  assert.equal(extractCommitMessage("git commit -m 'chore: add x'"), "chore: add x");
  assert.equal(extractCommitMessage('git commit --message="chore: add x"'), "chore: add x");
  assert.equal(
    extractCommitMessage('git commit -m "chore: add x" -m "because y"'),
    "chore: add x\n\nbecause y",
  );
  assert.equal(
    extractCommitMessage("git commit -m @'\nchore: add x\n\nbecause y\n'@"),
    "chore: add x\n\nbecause y",
  );
  assert.equal(
    extractCommitMessage("git commit -F - <<'EOF'\nchore: add x\nEOF"),
    "chore: add x",
  );
});

// WHEN no message is inline — `-F <file>` or an editor commit — extraction
// shall return null and the guard shall allow rather than block blind.
test("an unreadable message is a documented gap, not a denial", () => {
  assert.equal(extractCommitMessage("git commit -F message.txt"), null);
  assert.equal(extractCommitMessage("git commit --amend"), null);
  assert.equal(decideCommitMessage(null, LISTS).decision, "allow");
});

// WHEN the verb lists are consulted, they shall come from this module. They
// used to be scraped out of a markdown file at runtime; pinning them here is
// what makes that relocation safe.
test("the verb lists are data, and internally consistent", () => {
  assert.ok(VERB_ALLOWLIST.includes("add"));
  assert.ok(VERB_ALLOWLIST.includes("wire"));
  assert.ok(VERB_DENYLIST.includes("added"));
  assert.equal(VERB_ALLOWLIST.length, 20);
  assert.equal(VERB_DENYLIST.length, 17);
  // No verb may sit on both lists, and every entry is lowercase — the subject
  // verb is lowercased before comparison, so an uppercase entry is unreachable.
  const overlap = VERB_ALLOWLIST.filter((v) => VERB_DENYLIST.includes(v));
  assert.deepEqual(overlap, []);
  for (const verb of [...VERB_ALLOWLIST, ...VERB_DENYLIST]) {
    assert.equal(verb, verb.toLowerCase());
  }
});

// WHEN no lists are supplied, the module defaults shall apply — the hook calls
// it with one argument.
test("decideCommitMessage defaults to the module lists", () => {
  assert.equal(decideCommitMessage("chore(hooks): add the guard").decision, "allow");
  assert.equal(decideCommitMessage("chore(hooks): added the guard").decision, "deny");
  assert.equal(decideCommitMessage("chore(hooks): frobnicate the guard").decision, "ask");
});

// WHEN the subject exceeds the limit, the commit shall be denied and the
// measured string quoted back — the reviewer must see what was measured.
test("an overlong subject is denied and quoted", () => {
  const subject = `chore: ${"a".repeat(MAX_SUBJECT_LENGTH)}`;
  const verdict = decideCommitMessage(subject, LISTS);
  assert.equal(verdict.decision, "deny");
  assert.match(verdict.reason, new RegExp(`${subject.length} chars`));
  assert.match(verdict.reason, /Measured: "chore: aaa/);
});

// WHEN the message has a body, only the first line shall be measured. This is
// the class of bug that cost a validator cycle on 2026-08-09: measuring more
// than the subject and reporting the subject as the offender.
test("only the first line counts as the subject", () => {
  const message = `chore: add the hook runtime\n\n${"long body ".repeat(40)}`;
  assert.equal(decideCommitMessage(message, LISTS).decision, "allow");
});

// WHEN the subject does not match Conventional Commits, it shall be denied.
test("a non-conventional subject is denied", () => {
  assert.equal(decideCommitMessage("WIP", LISTS).decision, "deny");
  assert.equal(decideCommitMessage("update stuff", LISTS).decision, "deny");
  assert.equal(decideCommitMessage("Feat: add x", LISTS).decision, "deny");
  assert.equal(decideCommitMessage("build: add x", LISTS).decision, "deny");
  assert.equal(decideCommitMessage("chore(hooks): add x", LISTS).decision, "allow");
});

// WHEN a Co-authored-by trailer is present anywhere in the message, the commit
// shall be denied (G-R3 / G-A7).
test("a co-author trailer is denied wherever it sits", () => {
  const message = "chore: add x\n\nbody\n\nCo-Authored-By: Someone <a@b.c>";
  const verdict = decideCommitMessage(message, LISTS);
  assert.equal(verdict.decision, "deny");
  assert.match(verdict.reason, /Co-authored-by/i);
});

// WHEN the verb is on the denylist, the commit shall be denied.
test("a non-imperative verb is denied", () => {
  const verdict = decideCommitMessage("chore: added the runtime", LISTS);
  assert.equal(verdict.decision, "deny");
  assert.match(verdict.reason, /"added"/);
});

// WHEN the verb is on neither list, the skill calls it a STOP — the hook shall
// escalate to the owner rather than classify it.
test("an unclassifiable verb escalates instead of guessing", () => {
  const verdict = decideCommitMessage("chore: frobnicate the runtime", LISTS);
  assert.equal(verdict.decision, "ask");
  assert.match(verdict.reason, /neither the allowlist nor the denylist/);
});

// WHEN a caller injects an empty allowlist, check 3 shall escalate rather than
// pass every verb by default.
test("an empty injected allowlist escalates, never passes", () => {
  const verdict = decideCommitMessage("chore: add x", { allow: [], deny: [] });
  assert.equal(verdict.decision, "ask");
  assert.match(verdict.reason, /empty/);
});

// WHEN everything holds, the commit shall proceed.
test("a conforming commit is allowed", () => {
  assert.equal(decideCommitMessage("chore(hooks): wire the green boundary", LISTS).decision, "allow");
});

// WHEN a verdict is reached, it shall carry a machine-readable identifier of the
// rule that spoke, for every row of the D6 table. Without it the reader would
// have to recover the rule's name from the prose of `reason`, which breaks
// silently the first time someone rewords an error message — the exact vice the
// gate-economics baseline criticises.
test("every commit-message verdict carries its D6 check identifier", () => {
  const overlong = `chore: add ${"x".repeat(MAX_SUBJECT_LENGTH)}`;
  const rows = [
    [null, LISTS, "commit-none", "allow"],
    [undefined, LISTS, "commit-none", "allow"],
    [overlong, LISTS, "R10-subject-length", "deny"],
    ["chore add x", LISTS, "R10-subject-shape", "deny"],
    ["nope(scope): add x", LISTS, "R10-subject-shape", "deny"],
    ["chore: add x\n\nCo-authored-by: Someone <s@example.com>", LISTS, "G-A7-coauthor-trailer", "deny"],
    ["chore: add x", { allow: [], deny: [] }, "R10-verb-list-empty", "ask"],
    ["chore: added x", LISTS, "R10-verb-imperative", "deny"],
    ["chore: frobnicate x", LISTS, "R10-verb-unknown", "ask"],
    ["chore(hooks): add x", LISTS, "R10-ok", "allow"],
  ];

  for (const [message, lists, check, decision] of rows) {
    const verdict = decideCommitMessage(message, lists);
    assert.equal(verdict.check, check, `check for ${JSON.stringify(message)}`);
    assert.equal(verdict.decision, decision, `decision for ${JSON.stringify(message)}`);
  }
});

// WHEN the identifier is added, the decision and the reason shall be untouched:
// `check` is for the reader, `reason` is for the human, and this task changes no
// verdict. Pinned here so a later edit cannot quietly reword one.
test("adding check changes neither decision nor reason", () => {
  const denied = decideCommitMessage("chore: added x", LISTS);
  assert.equal(denied.decision, "deny");
  assert.equal(
    denied.reason,
    'Commit verb "added" is not imperative mood (R10 / G-R3). Use the imperative form.',
  );

  const allowed = decideCommitMessage("chore(hooks): add x", LISTS);
  assert.equal(allowed.decision, "allow");
  assert.equal(allowed.reason, 'subject ok (19 chars, verb "add")');

  const none = decideCommitMessage(null, LISTS);
  assert.equal(none.reason, "no inline commit message to inspect");
});
