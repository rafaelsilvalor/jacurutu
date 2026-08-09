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

const GATES = [
  { label: "npx tsc -b", command: "npx tsc -b" },
  { label: "npm test", command: "npm test" },
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
if (!hasWatchedChanges(cwd)) allow();

function hasWatchedChanges(directory) {
  const status = spawnSync("git status --porcelain", {
    shell: true,
    encoding: "utf8",
    cwd: directory,
  });
  // R4: an unreadable working tree is not treated as "nothing changed" — the
  // gates run, because a false green is the expensive failure here.
  if (status.status !== 0) return true;
  return status.stdout
    .split(/\r?\n/)
    .map((line) => line.slice(3).trim().replace(/^"|"$/g, ""))
    .some((file) => WATCHED_PREFIXES.some((prefix) => file.startsWith(prefix)));
}

for (const gate of GATES) {
  const result = spawnSync(gate.command, {
    shell: true,
    encoding: "utf8",
    timeout: GATE_TIMEOUT_MS,
    cwd,
  });

  if (result.status === 0) continue;

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  blockStop(
    `The green boundary is red: \`${gate.label}\` exited ${result.status}. ` +
      `Fix it before ending the turn.\n\n${output.slice(-OUTPUT_BUDGET)}`,
  );
}

allow();
