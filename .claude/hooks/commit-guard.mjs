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
import { emitGateRecord } from "./lib/telemetry.mjs";

const input = await readHookInput();

if (!isShellTool(input.tool_name)) allow();

const command = input.tool_input?.command;
if (!isCommitCommand(command)) allow();

const message = extractCommitMessage(command);
const verdict = decideCommitMessage(message);

// D4: `commit-none` means no rule ran — `git commit -F` and bare `git commit`
// open an editor this guard cannot read. An invocation that examined nothing is
// not a gate event, and recording it would inflate the denominator of every
// rate the reader computes.
if (verdict.check !== "commit-none") {
  emitGateRecord({
    input,
    hook: "commit-guard",
    check: verdict.check,
    decision: verdict.decision,
    inputKind: "commit-subject",
    // The subject only, and hashed: a denied subject never becomes a public
    // artifact, and constraint 6 keeps content out of the stream entirely.
    inspected: (message ?? "").split(/\r?\n/)[0] ?? "",
  });
}

if (verdict.decision === "deny") deny(verdict.reason);
if (verdict.decision === "ask") askOwner(verdict.reason);
allow();
