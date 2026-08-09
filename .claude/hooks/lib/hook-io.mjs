/**
 * Shared plumbing for Claude Code hooks.
 *
 * Hooks communicate over stdin (JSON event payload), stderr (feedback the
 * model sees) and the exit code. Keeping that contract in one place means the
 * decision logic in the sibling modules stays pure and unit-testable — the
 * whole point of moving these checks off an agent and into code.
 */

const EXIT_ALLOW = 0;
const EXIT_DENY = 2;
const STDIN_ENCODING = "utf8";

/**
 * Read the hook event payload from stdin.
 *
 * Returns an empty object when stdin carries nothing or unparseable bytes: a
 * hook that cannot read its input must not crash the tool call it observes.
 * Callers decide what an empty payload means for them.
 */
export async function readHookInput() {
  const chunks = [];
  process.stdin.setEncoding(STDIN_ENCODING);
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const raw = chunks.join("").trim();
  if (raw === "") return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    // R4: never swallow silently. stderr on a non-blocking path is visible
    // under `claude --debug` without failing the tool call.
    process.stderr.write(`hook-io: unparseable stdin payload: ${error.message}\n`);
    return {};
  }
}

/** Block the observed action. `reason` is fed back to the model as feedback. */
export function deny(reason) {
  process.stderr.write(`${reason}\n`);
  process.exit(EXIT_DENY);
}

/** Report no objection. The normal permission flow still applies. */
export function allow() {
  process.exit(EXIT_ALLOW);
}

/**
 * Escalate to the owner instead of deciding. Used where the ported skill says
 * STOP rather than PASS/FAIL — an unclassifiable case is the owner's call, and
 * guessing it is exactly the failure mode this migration exists to remove.
 */
export function askOwner(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(EXIT_ALLOW);
}

/**
 * Stop-event equivalent of `deny`: the turn is not allowed to end, and `reason`
 * becomes the model's next instruction. Stop hooks use structured JSON on
 * stdout rather than exit 2.
 */
export function blockStop(reason) {
  process.stdout.write(JSON.stringify({ decision: "block", reason }));
  process.exit(EXIT_ALLOW);
}

export { EXIT_ALLOW, EXIT_DENY };
