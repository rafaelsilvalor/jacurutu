#!/usr/bin/env node
/**
 * PreToolUse hook: enforce test/code file ownership for the agent pair.
 *
 * Wired against Write|Edit|MultiEdit. Silent for every actor outside the pair.
 */

import { readHookInput, deny, allow } from "./lib/hook-io.mjs";
import { decideOwnership } from "./lib/ownership.mjs";

const input = await readHookInput();

const verdict = decideOwnership({
  agentType: input.agent_type,
  toolName: input.tool_name,
  filePath: input.tool_input?.file_path,
});

if (verdict.allowed) allow();
deny(verdict.reason);
