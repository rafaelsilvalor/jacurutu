/**
 * Commit-message rules, ported from `.claude/skills/pre-commit-self-audit`
 * checks 1-4 (CLAUDE.md R10, GIT_WORKFLOW.md G-R3).
 *
 * The skill described these as shell one-liners and then asked a model to run
 * them and report. Every one is a pure string operation, so it belongs here:
 * it costs no tokens, cannot misread its own output, and — unlike the skill —
 * can be covered by fixtures.
 *
 * The skill's three-valued outcome maps onto the hook's permission decisions:
 * PASS -> allow, FAIL -> deny, STOP (verb in neither list) -> ask the owner.
 */

const MAX_SUBJECT_LENGTH = 72;
// Global options may carry a value (`git -C <path> commit`), so an option token
// is optionally followed by one non-flag token before the subcommand.
const GIT_COMMIT_INVOCATION = /(?:^|[\s;&|(])git\s+(?:-\S+\s+(?:[^-\s]\S*\s+)?)*commit(?![-\w])/;
const CONVENTIONAL_SUBJECT = /^(feat|fix|refactor|test|chore|docs|perf|ci)(\([a-z0-9-]+\))?: .+/;
const SUBJECT_VERB = /^[a-z]+(\([a-z0-9-]+\))?: ([a-z]+)/;
const COAUTHOR_TRAILER = /^\s*co-authored-by:/im;
const MESSAGE_FLAG = /(?:^|\s)(?:-m|--message)(?:=|\s+)("(?:[^"\\]|\\.)*"|'[^']*'|[^\s'"]+)/g;
const POWERSHELL_HEREDOC = /(?:-m|--message)\s+@'\r?\n([\s\S]*?)\r?\n'@/;
const POSIX_HEREDOC = /<<-?\s*'?(\w+)'?\r?\n([\s\S]*?)\r?\n\1/;
const ALLOWLIST_IN_SSOT = /^ALLOW="([^"]+)"/m;
const DENYLIST_IN_SSOT = /^DENY="([^"]+)"/m;
const SHELL_TOOLS = new Set(["Bash", "PowerShell"]);

/**
 * Tools that can run a commit. Matching `Bash` alone leaves a hole: this
 * environment's primary shell is PowerShell, and it arrives as its own tool
 * with the command in the same `tool_input.command` field.
 */
export function isShellTool(toolName) {
  return SHELL_TOOLS.has(toolName);
}

/**
 * True when the shell command is a commit that this guard should inspect.
 * The negative lookahead keeps sibling porcelain (`commit-tree`) out.
 */
export function isCommitCommand(command) {
  return typeof command === "string" && GIT_COMMIT_INVOCATION.test(command);
}

/**
 * Pull the commit message out of a shell command.
 *
 * Handles `-m`/`--message` with quoted or bare payloads, PowerShell here-strings
 * and POSIX heredocs. Returns null when no message is present inline — notably
 * `git commit -F <file>` and bare `git commit`, which open an editor. Those are
 * a known gap: the guard allows them rather than blocking on what it cannot read.
 */
export function extractCommitMessage(command) {
  if (typeof command !== "string") return null;

  const heredoc = POWERSHELL_HEREDOC.exec(command) ?? POSIX_HEREDOC.exec(command);
  if (heredoc) return heredoc[heredoc.length - 1];

  const parts = [];
  for (const match of command.matchAll(MESSAGE_FLAG)) {
    parts.push(unquote(match[1]));
  }
  return parts.length > 0 ? parts.join("\n\n") : null;
}

function unquote(token) {
  if (token.length >= 2 && token.startsWith('"') && token.endsWith('"')) {
    return token.slice(1, -1).replace(/\\(.)/g, "$1");
  }
  if (token.length >= 2 && token.startsWith("'") && token.endsWith("'")) {
    return token.slice(1, -1);
  }
  return token;
}

/**
 * Read the verb allowlist and denylist from their single source of truth.
 *
 * The lists stay in the skill file so the pipeline keeps one canonical copy
 * (PROCESS_MAP.md §7). Returning empty lists is a caller-handled contract:
 * an empty allowlist means the SSOT moved and the check must not silently pass.
 */
export function parseVerbLists(skillSource) {
  const allow = ALLOWLIST_IN_SSOT.exec(skillSource ?? "");
  const deny = DENYLIST_IN_SSOT.exec(skillSource ?? "");
  return {
    allow: allow ? allow[1].trim().split(/\s+/) : [],
    deny: deny ? deny[1].trim().split(/\s+/) : [],
  };
}

/**
 * Apply checks 1-4 to a commit message.
 *
 * `decision` is one of "allow", "deny" or "ask". The first failure wins: a
 * subject that is both overlong and misspelled only needs one round trip to
 * learn that, and stacking findings makes the feedback harder to act on.
 */
export function decideCommitMessage(message, verbLists) {
  if (message === null || message === undefined) {
    return { decision: "allow", reason: "no inline commit message to inspect" };
  }

  const subject = message.split(/\r?\n/)[0] ?? "";

  if (subject.length > MAX_SUBJECT_LENGTH) {
    return {
      decision: "deny",
      reason:
        `Commit subject is ${subject.length} chars, over the ${MAX_SUBJECT_LENGTH} ` +
        `limit (R10 / G-R3). Measured: "${subject}"`,
    };
  }

  if (!CONVENTIONAL_SUBJECT.test(subject)) {
    return {
      decision: "deny",
      reason:
        `Commit subject does not match <type>(<scope>)?: <subject> with an allowed ` +
        `type (feat, fix, refactor, test, chore, docs, perf, ci) — R10 / G-R3. ` +
        `Measured: "${subject}"`,
    };
  }

  if (COAUTHOR_TRAILER.test(message)) {
    return {
      decision: "deny",
      reason: "Commit carries a Co-authored-by trailer, forbidden by G-R3 / G-A7.",
    };
  }

  if (verbLists.allow.length === 0) {
    return {
      decision: "ask",
      reason:
        "The verb allowlist could not be read from its SSOT " +
        "(.claude/skills/pre-commit-self-audit/SKILL.md). Check 3 cannot run.",
    };
  }

  const verbMatch = SUBJECT_VERB.exec(subject);
  const verb = verbMatch ? verbMatch[2].toLowerCase() : "";

  if (verbLists.deny.includes(verb)) {
    return {
      decision: "deny",
      reason: `Commit verb "${verb}" is not imperative mood (R10 / G-R3). Use the imperative form.`,
    };
  }

  if (!verbLists.allow.includes(verb)) {
    return {
      decision: "ask",
      reason:
        `Commit verb "${verb}" is in neither the allowlist nor the denylist. The skill ` +
        `calls this a STOP, not a judgment call — the owner decides.`,
    };
  }

  return { decision: "allow", reason: `subject ok (${subject.length} chars, verb "${verb}")` };
}

export { MAX_SUBJECT_LENGTH, SHELL_TOOLS };
