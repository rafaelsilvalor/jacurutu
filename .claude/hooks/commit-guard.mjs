#!/usr/bin/env node
/**
 * PreToolUse hook: apply the commit-message rules before `git commit` runs.
 *
 * Replaces the pre-commit-self-audit skill for checks 1-4. The skill could be
 * forgotten; this cannot.
 */

import { readHookInput, deny, allow, askOwner } from "./lib/hook-io.mjs";
import {
  isShellTool,
  isCommitCommand,
  extractCommitMessage,
  decideCommitMessage,
} from "./lib/commit-message.mjs";

const input = await readHookInput();

if (!isShellTool(input.tool_name)) allow();

const command = input.tool_input?.command;
if (!isCommitCommand(command)) allow();

const verdict = decideCommitMessage(extractCommitMessage(command));

if (verdict.decision === "deny") deny(verdict.reason);
if (verdict.decision === "ask") askOwner(verdict.reason);
allow();
