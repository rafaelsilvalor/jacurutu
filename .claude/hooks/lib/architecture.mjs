/**
 * The mechanical half of the closer's Phase A, moved to commit time.
 *
 * The closer reviewed an assembled branch before push and was suspended for
 * being too slow (2026-08-09). The gate-economics measurement found its owner
 * gate had no recorded catch at all. But four of its architecture rules are
 * pure text operations, and a text operation does not need to wait for the end
 * of a branch: it can fire when the violation is born.
 *
 * What stays out is what genuinely needs judgment — R18 storage routing, R19
 * registry dispatch under the rule of three, R6's orchestration-handler
 * exception, and duplication against `core`. Those are not encoded here
 * because encoding them badly is worse than not encoding them (A3).
 */

const V2_SOURCE = /^packages\/.+\.(ts|mts|cts)$/;
const TEST_SOURCE = /\.test\.(ts|mts|cts)$/;
const MAX_FILE_LINES = 400;
// E6: the ceiling a test file may not pass even when it maps 1:1 to a subject.
const TEST_CEILING = 800;
const ADAPTER_IMPORT = /\bfrom\s+["'][^"']*adapter[^"']*["']/;
const CORE_SOURCE = /^packages\/core\/src\//;
const RELATIVE_IMPORT = /\bfrom\s+["'](\.[^"']*)["']|^\s*import\s+["'](\.[^"']*)["']/;
const RESOLVED_EXTENSION = /\.(js|mjs|cjs|json)$/;
const ANY_TYPE = /(:\s*any\b|\bas\s+any\b|<any>|\bany\[\])/;
const COMMENT_LINE = /^\s*(\/\/|\/\*|\*)/;
// Narrow on purpose. A broad secret regex trains you to skim its output, which
// is the failure mode the closer's own design section warned about.
const SECRET_PATTERNS = [
  { label: "Atlassian API token", pattern: /\bATATT[A-Za-z0-9_\-=]{20,}/ },
  { label: "Google OAuth client secret", pattern: /\bGOCSPX-[A-Za-z0-9_\-]{20,}/ },
  { label: "private key block", pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  {
    label: "assigned credential literal",
    pattern: /\b(secret|token|password|passwd|api[_-]?key)\s*[:=]\s*["'][^"'\s]{12,}["']/i,
  },
];
// Values that look like credentials but are the opposite: examples and blanks.
const PLACEHOLDER = /(xxx|placeholder|example|your[_-]|<[^>]+>|\$\{|process\.env|redacted|\.\.\.)/i;

/** R25 — `core` never imports an adapter. */
export function checkDependencyDirection(filePath, lines) {
  if (!CORE_SOURCE.test(filePath)) return [];
  return lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => ADAPTER_IMPORT.test(line) && !COMMENT_LINE.test(line))
    .map(({ line, index }) => finding("R25", filePath, index, line, "deny",
      "core must not import an adapter; the dependency direction is inward only"));
}

/** R21 — every relative import carries its resolved extension. */
export function checkImportExtensions(filePath, lines) {
  if (!V2_SOURCE.test(filePath)) return [];
  const findings = [];
  lines.forEach((line, index) => {
    if (COMMENT_LINE.test(line)) return;
    const match = RELATIVE_IMPORT.exec(line);
    const specifier = match?.[1] ?? match?.[2];
    if (specifier && !RESOLVED_EXTENSION.test(specifier)) {
      findings.push(finding("R21", filePath, index, line, "deny",
        `relative import "${specifier}" needs its compiled extension (.js), a Node ESM requirement`));
    }
  });
  return findings;
}

/**
 * R24 — no `any` without a rationale. The rule allows the escape hatch when it
 * carries a one-line comment, so a comment on the line or immediately above
 * clears it.
 */
export function checkNoAny(filePath, lines) {
  if (!V2_SOURCE.test(filePath)) return [];
  const findings = [];
  lines.forEach((line, index) => {
    if (COMMENT_LINE.test(line) || !ANY_TYPE.test(line)) return;
    const justifiedInline = line.includes("//");
    const justifiedAbove = index > 0 && COMMENT_LINE.test(lines[index - 1]);
    if (justifiedInline || justifiedAbove) return;
    findings.push(finding("R24", filePath, index, line, "deny",
      "`any` needs a one-line comment stating why; prefer `unknown` plus narrowing"));
  });
  return findings;
}

/**
 * R5 — source file size budget, with E6 for tests.
 *
 * R5 instructs "split by responsibility" when a file exceeds the budget. For a
 * test file already scoped to one subject module that instruction has no valid
 * move: the responsibility is "test this module", and splitting by line count
 * fragments the spec. E6 re-anchors the limit rather than waiving it —
 * 1:1 with a subject module is the precondition, and 800 lines is a ceiling
 * that says "your subject does too much", which is a defect with a remedy.
 *
 * Below the budget nothing applies. Above it, a test that is not 1:1 is denied,
 * because there the original instruction does have a valid move.
 */
export function checkFileSize(filePath, lines, io) {
  if (!V2_SOURCE.test(filePath) || lines.length <= MAX_FILE_LINES) return [];

  if (!TEST_SOURCE.test(filePath)) {
    return [finding("R5", filePath, lines.length - 1, "", "deny",
      `file is ${lines.length} lines, over the ${MAX_FILE_LINES} budget; split by responsibility`)];
  }

  const subject = filePath.replace(/\.test\.(ts|mts|cts)$/, ".$1");
  if (io?.exists && !io.exists(subject)) {
    return [finding("R5", filePath, lines.length - 1, "", "deny",
      `test file is ${lines.length} lines and has no 1:1 subject module (${subject}), ` +
      `so E6 does not apply; split by responsibility`)];
  }

  if (lines.length > TEST_CEILING) {
    return [finding("R5", filePath, lines.length - 1, "", "ask",
      `test file is ${lines.length} lines, over the E6 ceiling of ${TEST_CEILING}. ` +
      `E6 covers the budget, not this: a spec this large usually means the subject ` +
      `does too much. Split the subject, not the test`)];
  }

  return [];
}

/**
 * Secret hygiene. Escalates rather than denies: pattern matching on credentials
 * is probabilistic, and a false deny that blocks a legitimate commit teaches
 * you to route around the guard. A committed secret is irreversible, so a
 * false positive is the cheaper error — but only if it asks instead of blocks.
 */
export function scanSecrets(filePath, lines) {
  const findings = [];
  lines.forEach((line, index) => {
    if (PLACEHOLDER.test(line)) return;
    for (const { label, pattern } of SECRET_PATTERNS) {
      if (pattern.test(line)) {
        findings.push(finding("secret", filePath, index, line, "ask",
          `looks like a committed ${label}; a secret in history cannot be removed by a later commit`));
        return;
      }
    }
  });
  return findings;
}

function finding(rule, filePath, index, line, decision, reason) {
  return { rule, file: filePath, line: index + 1, decision, reason, evidence: line.trim() };
}

const CHECKS = [
  checkDependencyDirection,
  checkImportExtensions,
  checkNoAny,
  checkFileSize,
  scanSecrets,
];

/**
 * Run every check over one file's staged content.
 *
 * `io.exists` is consulted only by the E6 test-file rule; without it, a test
 * file over budget is treated as 1:1 rather than denied on missing information.
 */
export function inspectFile(filePath, content, io) {
  const lines = content.split(/\r?\n/);
  return CHECKS.flatMap((check) => check(filePath, lines, io));
}

/**
 * Fold findings into a single decision. `deny` wins over `ask` wins over
 * `allow`, matching how Claude Code combines hook results.
 */
export function summarize(findings) {
  if (findings.length === 0) return { decision: "allow", reason: "" };
  const denials = findings.filter((f) => f.decision === "deny");
  const chosen = denials.length > 0 ? denials : findings;
  const decision = denials.length > 0 ? "deny" : "ask";
  const body = chosen
    .map((f) => `  ${f.file}:${f.line} — ${f.rule}: ${f.reason}`)
    .join("\n");
  return {
    decision,
    reason: `${chosen.length} finding(s) in the staged diff:\n${body}`,
  };
}

export { MAX_FILE_LINES };
