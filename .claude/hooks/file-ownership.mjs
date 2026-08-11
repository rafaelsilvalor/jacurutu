#!/usr/bin/env node
/**
 * PreToolUse hook: enforce test/code file ownership for the agent pair.
 *
 * Wired against Write|Edit|MultiEdit. Silent for every actor outside the pair.
 */

import { readHookInput, deny, allow } from "./lib/hook-io.mjs";
import { decideOwnership } from "./lib/ownership.mjs";
import { emitGateRecord, repoRelative } from "./lib/telemetry.mjs";

const input = await readHookInput();

const filePath = input.tool_input?.file_path;
const verdict = decideOwnership({
  agentType: input.agent_type,
  toolName: input.tool_name,
  filePath,
});

// D4: `not-applicable` covers the three no-opinion paths — an actor outside the
// pair, a tool that does not write, a payload with no path. This hook fires on
// every Write and Edit in every session, so recording those would bury the
// handful of real pair events under the traffic of the main thread.
if (verdict.check !== "not-applicable") {
  // The repository-relative form is both the label and what gets hashed, so the
  // same file recurs under one hash across worktrees. A path is not a secret
  // and is the useful recurring key (D13).
  const label = repoRelative(filePath, input.cwd);
  emitGateRecord({
    input,
    hook: "file-ownership",
    check: verdict.check,
    decision: verdict.allowed ? "allow" : "deny",
    inputKind: "file-path",
    inspected: label,
    label,
  });
}

if (verdict.allowed) allow();
deny(verdict.reason);
