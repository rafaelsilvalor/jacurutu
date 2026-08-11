#!/usr/bin/env node
/**
 * Stop hook: the turn does not end on a red build.
 *
 * PROCESS_MAP.md §6 states the green boundary as an unconditional Pause 3
 * precondition that the owner verifies by hand, because a worktree session may
 * never wire `core.hooksPath` and the G-R8 pre-commit hook may never fire.
 * Verifying it here removes both the manual step and the missed-hook hole.
 */

import { spawnSync } from "node:child_process";

import { readHookInput, allow, blockStop } from "./lib/hook-io.mjs";
import { emitGateRecord } from "./lib/telemetry.mjs";

const GATES = [
  { label: "npx tsc -b", command: "npx tsc -b", check: "green-tsc" },
  { label: "npm test", command: "npm test", check: "green-npm-test" },
];
const GATE_TIMEOUT_MS = 300_000;
const OUTPUT_BUDGET = 4000;
// Stop fires whenever Claude finishes responding, not only when work landed.
// Without this filter a conversational turn would pay for a full build.
const WATCHED_PREFIXES = ["packages/", ".claude/hooks/"];

const input = await readHookInput();
const cwd = input.cwd ?? process.cwd();

// Without this the block feeds itself: a blocked stop resumes the model, which
// stops again, which fires this hook again.
if (input.stop_hook_active) allow();

const watched = watchedChanges(cwd);
// The condition is spelled out rather than written as a truthiness test on
// purpose. `null` means the working tree could not be read, and it must reach
// the gates exactly as a non-empty list does; only a list that is genuinely
// empty ends the turn here. `if (!watched?.length) allow()` would read one
// character shorter and do the opposite on the null branch — a silently
// disabled green boundary, which looks identical to a passing one.
if (watched !== null && watched.length === 0) allow();

// The turn's fingerprint (D13): the watched paths that made the gates run.
const inspected = [...(watched ?? [])].sort().join("\n");

/**
 * The watched paths that changed, or `null` when the working tree is unreadable.
 *
 * R4: an unreadable tree is not "nothing changed" — the caller runs the gates,
 * because a false green is the expensive failure here.
 */
function watchedChanges(directory) {
  const status = spawnSync("git status --porcelain", {
    shell: true,
    encoding: "utf8",
    cwd: directory,
  });
  if (status.status !== 0) return null;
  return status.stdout
    .split(/\r?\n/)
    .map((line) => line.slice(3).trim().replace(/^"|"$/g, ""))
    .filter((file) => WATCHED_PREFIXES.some((prefix) => file.startsWith(prefix)));
}

for (const gate of GATES) {
  const result = spawnSync(gate.command, {
    shell: true,
    encoding: "utf8",
    timeout: GATE_TIMEOUT_MS,
    cwd,
  });

  // One record per gate actually run, before the block: a gate that never ran
  // has nothing to say, and blockStop exits the process.
  emitGateRecord({
    input,
    hook: "green-boundary",
    check: gate.check,
    decision: result.status === 0 ? "allow" : "deny",
    inputKind: "turn",
    inspected,
  });

  if (result.status === 0) continue;

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  blockStop(
    `The green boundary is red: \`${gate.label}\` exited ${result.status}. ` +
      `Fix it before ending the turn.\n\n${output.slice(-OUTPUT_BUDGET)}`,
  );
}

allow();
