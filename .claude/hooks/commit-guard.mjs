#!/usr/bin/env node
/**
 * PreToolUse hook: apply the commit-message rules before `git commit` runs.
 *
 * Replaces the manual invocation of the pre-commit-self-audit skill for checks
 * 1-4. The skill could be forgotten; this cannot.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { readHookInput, deny, allow, askOwner } from "./lib/hook-io.mjs";
import {
  isShellTool,
  isCommitCommand,
  extractCommitMessage,
  parseVerbLists,
  decideCommitMessage,
} from "./lib/commit-message.mjs";

const VERB_SSOT = path.join(".claude", "skills", "pre-commit-self-audit", "SKILL.md");

const input = await readHookInput();

if (!isShellTool(input.tool_name)) allow();

const command = input.tool_input?.command;
if (!isCommitCommand(command)) allow();

let skillSource = "";
try {
  skillSource = readFileSync(path.join(input.cwd ?? process.cwd(), VERB_SSOT), "utf8");
} catch (error) {
  // R4: an unreadable SSOT is reported, never treated as an empty allowlist
  // that would silently pass every verb.
  process.stderr.write(`commit-guard: cannot read verb SSOT: ${error.message}\n`);
}

const verdict = decideCommitMessage(extractCommitMessage(command), parseVerbLists(skillSource));

if (verdict.decision === "deny") deny(verdict.reason);
if (verdict.decision === "ask") askOwner(verdict.reason);
allow();
