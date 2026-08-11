#!/usr/bin/env node
/**
 * Read the gate telemetry stream and report yield per hook, per check and per
 * verdict.
 *
 * Not a hook: nothing registers this in `.claude/settings.json` and it decides
 * nothing. It is the CLI over `.claude/hooks/lib/gate-yield.mjs`, the same
 * shape `validate-brief.mjs` has over `brief-checks.mjs`, and it exists so the
 * question the stream was collected for can be answered without writing ad-hoc
 * code in the moment.
 *
 *   node .claude/hooks/gate-yield.mjs [path-to-stream]
 */

import { existsSync, readFileSync } from "node:fs";

import { telemetryPath } from "./lib/telemetry.mjs";
import { aggregate, formatReport, parseStream } from "./lib/gate-yield.mjs";

const EXIT_OK = 0;
const EXIT_NO_STREAM = 1;

const path = process.argv[2] ?? telemetryPath();

if (!existsSync(path)) {
  process.stderr.write(
    `gate-yield: no telemetry stream at ${path}\n` +
      `The stream is written by the five hooks and is gitignored, so a fresh ` +
      `worktree has none until a gate fires.\n`,
  );
  process.exit(EXIT_NO_STREAM);
}

let content;
try {
  content = readFileSync(path, "utf8");
} catch (error) {
  // R4: an unreadable stream is reported with its cause, never treated as empty
  // — an empty report and a failed read look identical to whoever ran this.
  process.stderr.write(`gate-yield: cannot read ${path}: ${error.message}\n`);
  process.exit(EXIT_NO_STREAM);
}

const { records, unparseable } = parseStream(content);
process.stdout.write(formatReport(aggregate(records), unparseable, path));
process.exit(EXIT_OK);
