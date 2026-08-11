#!/usr/bin/env node
/**
 * PreToolUse hook: check staged documentation before `git commit` runs.
 *
 * The docs counterpart to architecture-guard, and deliberately smaller. There
 * is no docs equivalent of a test suite: a claim can be false while every path
 * it names resolves. What this catches is the breakage a deletion or a rename
 * leaves behind, and pt-BR crossing onto an English-only surface. What it
 * cannot catch — a sentence that was true last week — stays with the reader.
 */

import { spawnSync } from "node:child_process";

import { readHookInput, deny, allow, askOwner } from "./lib/hook-io.mjs";
import { isShellTool, isCommitCommand } from "./lib/commit-message.mjs";
import { inspectDocument, resolverFor } from "./lib/docs-checks.mjs";
import { summarize } from "./lib/architecture.mjs";
import { emitGateRecord } from "./lib/telemetry.mjs";

// Historical surfaces. Recaps and task artifacts record what was true when they
// were written and are never rewritten, so a reference that has since died is
// the record working, not a defect.
const HISTORICAL = [/^docs\/sessions\//, /^docs\/tasks\//];

const input = await readHookInput();

if (!isShellTool(input.tool_name)) allow();
if (!isCommitCommand(input.tool_input?.command)) allow();

const cwd = input.cwd ?? process.cwd();

const tracked = (git(["ls-files"]) ?? "").split(/\r?\n/).filter(Boolean);
const topLevel = new Set(tracked.map((f) => f.split("/")[0]));
const resolver = resolverFor(tracked);

const io = {
  ...resolver,
  isOutOfScope: (path) => !topLevel.has(path.split("/")[0]) || isGitIgnored(path),
};

const staged = git(["diff", "--cached", "--name-only", "--diff-filter=ACM"]);
if (staged === null) allow();

const documents = staged
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((file) => file.endsWith(".md") && !HISTORICAL.some((h) => h.test(file)));

const findings = documents.flatMap((file) => {
  const content = git(["show", `:${file}`]);
  return content === null ? [] : inspectDocument(file, content, io);
});

const verdict = summarize(findings);

// D4: a commit that stages no reviewable markdown is not a docs-gate event.
// Most commits in this repository stage none, and every one of them fires this
// hook.
if (documents.length > 0) {
  emitGateRecord({
    input,
    hook: "docs-guard",
    check: verdict.check,
    decision: verdict.decision,
    inputKind: "staged-set",
    inspected: [...documents].sort().join("\n"),
  });
}

if (verdict.decision === "deny") deny(verdict.reason);
if (verdict.decision === "ask") askOwner(verdict.reason);
allow();

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8", cwd });
  return result.status === 0 ? result.stdout : null;
}

/** `check-ignore` answers for paths that do not exist, which `ls-files` cannot. */
function isGitIgnored(path) {
  return spawnSync("git", ["check-ignore", "-q", path], { cwd }).status === 0;
}
