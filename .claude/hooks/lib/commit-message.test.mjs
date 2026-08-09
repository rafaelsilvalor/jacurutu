import { test } from "node:test";
import assert from "node:assert";

import {
  isShellTool,
  isCommitCommand,
  extractCommitMessage,
  parseVerbLists,
  decideCommitMessage,
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

// WHEN the SSOT is read, both lists shall come back parsed; WHEN it is missing
// or restructured, they shall come back empty rather than partially guessed.
test("parseVerbLists reads the SSOT and fails loudly when it moves", () => {
  const source = 'text\nALLOW="add fix update"\nDENY="added fixing"\nmore text';
  assert.deepEqual(parseVerbLists(source).allow, ["add", "fix", "update"]);
  assert.deepEqual(parseVerbLists(source).deny, ["added", "fixing"]);
  assert.deepEqual(parseVerbLists("no lists here").allow, []);
  assert.deepEqual(parseVerbLists(undefined).allow, []);
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

// WHEN the allowlist could not be read, check 3 shall escalate rather than
// pass every verb by default.
test("an unreadable allowlist escalates, never passes", () => {
  const verdict = decideCommitMessage("chore: add x", { allow: [], deny: [] });
  assert.equal(verdict.decision, "ask");
  assert.match(verdict.reason, /SSOT/);
});

// WHEN everything holds, the commit shall proceed.
test("a conforming commit is allowed", () => {
  assert.equal(decideCommitMessage("chore(hooks): wire the green boundary", LISTS).decision, "allow");
});
