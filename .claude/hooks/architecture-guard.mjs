#!/usr/bin/env node
/**
 * PreToolUse hook: run the mechanical architecture checks over the staged diff
 * before `git commit` executes.
 *
 * This is the closer's Phase A, shifted left. The closer read an assembled
 * branch before push; these rules do not need the branch assembled, and a
 * violation caught at the commit that introduced it costs one edit instead of
 * a review cycle.
 */

import { spawnSync } from "node:child_process";

import { readHookInput, deny, allow, askOwner } from "./lib/hook-io.mjs";
import { isShellTool, isCommitCommand } from "./lib/commit-message.mjs";
import { inspectFile, summarize } from "./lib/architecture.mjs";
import { emitGateRecord } from "./lib/telemetry.mjs";

const input = await readHookInput();

if (!isShellTool(input.tool_name)) allow();
if (!isCommitCommand(input.tool_input?.command)) allow();

const cwd = input.cwd ?? process.cwd();

const staged = git(["diff", "--cached", "--name-only", "--diff-filter=ACM"]);
if (staged === null) allow();

// E6 asks whether a test file has a 1:1 subject module. The index is the right
// source: a subject added in this same commit counts, and one deleted in it
// does not.
const tracked = new Set((git(["ls-files"]) ?? "").split(/\r?\n/).filter(Boolean));
const io = { exists: (path) => tracked.has(path) };

const files = staged
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const findings = files.flatMap((file) => {
  const content = git(["show", `:${file}`]);
  // A file that cannot be read from the index (binary, or removed under a
  // race) is skipped rather than reported: this hook has no opinion it can
  // defend about content it never saw.
  return content === null ? [] : inspectFile(file, content, io);
});

const verdict = summarize(findings);

// D4: nothing staged means nothing was inspected, and this guard fires on every
// Bash call. Sorted so the same staged set hashes the same however git ordered
// it; a copy, because `files` fixed the inspection order above.
if (files.length > 0) {
  emitGateRecord({
    input,
    hook: "architecture-guard",
    check: verdict.check,
    decision: verdict.decision,
    inputKind: "staged-set",
    inspected: [...files].sort().join("\n"),
  });
}

if (verdict.decision === "deny") deny(verdict.reason);
if (verdict.decision === "ask") askOwner(verdict.reason);
allow();

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8", cwd });
  return result.status === 0 ? result.stdout : null;
}
