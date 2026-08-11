/**
 * File-ownership rules for the test/code agent pair.
 *
 * The pair only reduces hallucination if the two agents have genuinely
 * competing incentives: an agent that can edit both the test and the
 * implementation will drift the test toward whatever it happened to build.
 * Instructing it not to is a request the model may reinterpret. Denying the
 * write is not.
 */

const TEST_AGENT = "test";
const CODE_AGENT = "code";
const WRITE_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);
const TEST_FILE_PATTERN = /\.test\.(ts|mts|cts|js|mjs|cjs)$/;

/** A path is a test file when its basename carries the `.test.<ext>` marker. */
export function isTestFile(filePath) {
  if (typeof filePath !== "string" || filePath === "") return false;
  const basename = filePath.split(/[\\/]/).pop() ?? "";
  return TEST_FILE_PATTERN.test(basename);
}

/**
 * Decide whether a write may proceed.
 *
 * Returns `{ allowed: true }` for every actor outside the pair — the main
 * thread and unrelated subagents keep their normal permission flow. The hook
 * has an opinion only about `@test` and `@code`.
 *
 * `check` is additive and for the telemetry stream only; `allowed` keeps both
 * its name and its value, because `.claude/hooks/file-ownership.mjs` branches
 * on it. The three early returns take `not-applicable`, which is what lets that
 * executable tell "this hook had no opinion" apart from "this hook allowed the
 * write" — the first must stay silent (D4), the second is a real gate event.
 * Identifiers are fixed by the D6 table of
 * `docs/tasks/2026-08-11-gate-runtime-instrumentation/brief.md`.
 */
export function decideOwnership({ agentType, toolName, filePath }) {
  if (!WRITE_TOOLS.has(toolName)) return { allowed: true, check: "not-applicable" };
  if (agentType !== TEST_AGENT && agentType !== CODE_AGENT) {
    return { allowed: true, check: "not-applicable" };
  }
  if (typeof filePath !== "string" || filePath === "") {
    return { allowed: true, check: "not-applicable" };
  }

  const writingATest = isTestFile(filePath);

  if (agentType === CODE_AGENT && writingATest) {
    return {
      allowed: false,
      check: "pair-code-writes-test",
      reason:
        `Denied: @code may not write test files (${filePath}). The tests are the ` +
        `specification for this cycle and belong to @test. If a test looks wrong, ` +
        `stop and report it instead of changing it — that report is a real finding.`,
    };
  }

  if (agentType === TEST_AGENT && !writingATest) {
    return {
      allowed: false,
      check: "pair-test-writes-impl",
      reason:
        `Denied: @test may not write implementation files (${filePath}). Express the ` +
        `requirement as a failing test; making it pass is @code's job.`,
    };
  }

  return { allowed: true, check: "pair-ok" };
}

export { TEST_AGENT, CODE_AGENT, WRITE_TOOLS };
