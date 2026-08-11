#!/usr/bin/env node
/**
 * Validate a task brief against C1-C11.
 *
 * Replaces invoking the `brief-validator` subagent. Run it directly:
 *
 *   node .claude/hooks/validate-brief.mjs docs/tasks/<task-id>-<slug>/brief.md
 *
 * Exits 0 on APPROVED, 1 on REJECTED or STOP.
 *
 * Deliberately a CLI rather than a commit hook. A brief is validated once, on
 * purpose, before execution — and the brief commit is routinely amended during
 * pre-validation, so a commit-time guard would fight the very loop it is meant
 * to serve.
 */

import { readFileSync } from "node:fs";

import { validateBrief, PASS, FAIL } from "./lib/brief-checks.mjs";
import { VERB_ALLOWLIST, VERB_DENYLIST } from "./lib/commit-message.mjs";

const EXIT_APPROVED = 0;
const EXIT_NOT_APPROVED = 1;
const MARK = { PASS: "PASS", FAIL: "FAIL", STOP: "STOP" };

const [, , briefPath] = process.argv;

if (!briefPath) {
  process.stderr.write("usage: node .claude/hooks/validate-brief.mjs <path-to-brief.md>\n");
  process.exit(EXIT_NOT_APPROVED);
}

let source;
try {
  source = readFileSync(briefPath, "utf8");
} catch (error) {
  process.stderr.write(`cannot read ${briefPath}: ${error.message}\n`);
  process.exit(EXIT_NOT_APPROVED);
}

const { checks, verdict } = validateBrief(source, { allow: VERB_ALLOWLIST, deny: VERB_DENYLIST });

process.stdout.write(`${briefPath}\n\n`);
for (const check of checks) {
  process.stdout.write(`  ${check.id.padEnd(4)} ${MARK[check.status].padEnd(5)} ${check.detail}\n`);
}

const failed = checks.filter((c) => c.status !== PASS);
process.stdout.write(`\n  ${checks.length - failed.length}/${checks.length} PASS\n`);
process.stdout.write(`  VERDICT: ${verdict}\n`);

if (verdict !== "APPROVED") {
  process.stdout.write(
    `\n  ${failed.some((c) => c.status === FAIL)
      ? "A FAIL is a rule violation: fix the brief and re-run."
      : "A STOP is not a rule violation: it needs a ruling from the owner."}\n`,
  );
}

process.exit(verdict === "APPROVED" ? EXIT_APPROVED : EXIT_NOT_APPROVED);
