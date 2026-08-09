// Composition root for the fetch run. Closes the D3 half deferred by brief 020:
// it wires CAPTURING drop/warning sinks (replacing the adapter's default
// console-logging sinks), runs the gateway, stamps the run-time envelope meta,
// assembles the full payload-v2.0 via the pure core `assemblePayload`, and
// serializes it to disk. Behavior-preserving against the frozen seed
// (automation/fetch.py "Montar payload" + the json.dump call, automation/
// payload.json): same key order, indent=2, non-ASCII preserved, no trailing
// newline.
//
// The gateway is injected as a FACTORY (`makeGateway`) so this function carries
// no credentials and stays unit-testable with an in-memory fake. The clock is a
// single injectable `now` so the stamped timestamps are deterministic in tests.

import { readFile, writeFile } from "node:fs/promises";

import {
  assemblePayload,
  type FilteredOut,
  type Issue,
  type JiraGateway,
  type Payload,
  type PayloadMeta,
  type PayloadWarning,
} from "@saci/core";
import type { IssueDropLog } from "@saci/adapter-jira";
import type { IssueWarningLog } from "@saci/adapter-jira";

/** JSON serialization indent, mirroring the seed's `json.dump(..., indent=2)`. */
const PAYLOAD_INDENT = 2;

/**
 * Build the gateway given the two capturing sinks. The real wiring supplies the
 * `JiraGateway` constructed with credentials, base URL, and JQL (none of which
 * belong in this function); tests supply an in-memory fake. The factory shape is
 * exactly the adapter's two sink types (D1 one-to-one mapping).
 */
export type MakeGateway = (
  dropLog: IssueDropLog,
  warningLog: IssueWarningLog,
) => JiraGateway;

/**
 * Stamp the envelope meta from a single clock. Mirrors the seed's
 * `now = datetime.now().astimezone()`:
 * - `runDate` is the local-date `YYYY-MM-DD` (seed `now.date().isoformat()`).
 * - `generatedAt` is ISO-8601 WITH the explicit local timezone offset and
 *   seconds precision (seed `now.isoformat(timespec="seconds")`), NOT the UTC
 *   `Z` form that `Date.prototype.toISOString()` produces.
 */
function stampMeta(now: Date): PayloadMeta {
  const pad = (n: number): string => String(n).padStart(2, "0");

  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const runDate = `${year}-${month}-${day}`;

  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  // getTimezoneOffset() is minutes BEHIND UTC: positive west of UTC. ISO-8601
  // wants the opposite sign (offset ahead of UTC), hence the inverted sign here.
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absOffset = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.trunc(absOffset / 60));
  const offsetMins = pad(absOffset % 60);
  const offset = `${sign}${offsetHours}:${offsetMins}`;

  const generatedAt = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;

  return { runDate, generatedAt };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Narrow the parsed prior file to the only part of `Payload` this guard reads. */
function hasIssuesArray(value: unknown): value is Pick<Payload, "issues"> {
  return isRecord(value) && Array.isArray(value.issues);
}

/** A filesystem error meaning "the file is not there", as opposed to any other failure. */
function isEnoent(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * How many issues the payload already on disk holds, or `null` when there is
 * nothing to protect. Module-private (D8): the behavior worth testing is
 * `runFetch`'s refusal, not this function.
 *
 * Every anomalous shape — unreadable file, invalid JSON, a parse that is not an
 * object, an `issues` that is not an array — answers `null` AND logs (R4 / A1:
 * nothing is swallowed). A MISSING file is the one case that is expected rather
 * than anomalous, so ENOENT alone returns `null` silently: a first run has no
 * prior payload, and warning on it would train the operator to skim past the
 * warnings that do mean something.
 */
async function priorIssueCount(outputPath: string): Promise<number | null> {
  let raw: string;
  try {
    raw = await readFile(outputPath, "utf8");
  } catch (error) {
    if (!isEnoent(error)) {
      console.warn(
        `[run-fetch] cannot read the existing payload at ${outputPath} (${describeError(error)}); nothing to protect, writing anyway`,
      );
    }
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.warn(
      `[run-fetch] the existing payload at ${outputPath} is not valid JSON (${describeError(error)}); nothing to protect, writing anyway`,
    );
    return null;
  }

  if (!isRecord(parsed)) {
    console.warn(
      `[run-fetch] the existing payload at ${outputPath} is not a JSON object; nothing to protect, writing anyway`,
    );
    return null;
  }

  if (!hasIssuesArray(parsed)) {
    console.warn(
      `[run-fetch] the existing payload at ${outputPath} has no issues array; nothing to protect, writing anyway`,
    );
    return null;
  }

  return parsed.issues.length;
}

/**
 * Run the fetch, assemble the payload, and write it to `outputPath`.
 *
 * Capturing sinks: the `dropLog` pushes `{ key, reason }` into a `FilteredOut[]`
 * and the `warningLog` pushes `{ key, field, issue: cause }` into a
 * `PayloadWarning[]` (D1 — the warning sink's `cause` maps to `issue`). These
 * replace the adapter's default console-logging sinks, then feed the assembler.
 *
 * The output is `JSON.stringify(payload, null, 2)`: insertion key order is
 * preserved (the assembler builds the keys in seed order), non-ASCII is emitted
 * verbatim (the `ensure_ascii=False` equivalent — JSON.stringify does not escape
 * non-ASCII), and no trailing newline is appended (matches automation/payload.json).
 *
 * Two guards stand between a bad run and a destroyed payload. FIRST, the port
 * pre-flight runs before any search, because a bad token does not make a bounded
 * JQL search fail — it answers 200 with an empty issue list, which would arrive
 * here indistinguishable from a legitimate "no work today". SECOND, a zero-issue
 * result refuses to overwrite a prior payload that holds issues, because the
 * pre-flight cannot cover a valid token aimed at the wrong JQL or at a project
 * whose permission was revoked. `allowEmpty` is the operator's escape hatch for
 * the day the answer really is zero.
 */
export async function runFetch(
  makeGateway: MakeGateway,
  outputPath: string,
  now: Date = new Date(),
  allowEmpty = false,
): Promise<Payload> {
  const filteredOut: FilteredOut[] = [];
  const warnings: PayloadWarning[] = [];

  const dropLog: IssueDropLog = (key, reason) => {
    filteredOut.push({ key, reason });
  };
  const warningLog: IssueWarningLog = (key, field, cause) => {
    warnings.push({ key, field, issue: cause });
  };

  const gateway = makeGateway(dropLog, warningLog);
  // Pre-flight before any search (D1). No try: a rejected credential propagates
  // to main()'s catch, which prints it and sets EXIT_RUNTIME — the failure needs
  // no new exit code, only a message that names the right cause.
  await gateway.verifyCredentials();
  const issues: Issue[] = await gateway.fetchIssues();

  const meta = stampMeta(now);
  const payload = assemblePayload(issues, filteredOut, warnings, meta);

  // The prior file is read ONLY on the zero-issue path: the happy path must not
  // gain a file read it never needed.
  if (payload.issues.length === 0 && !allowEmpty) {
    const priorCount = await priorIssueCount(outputPath);
    if (priorCount !== null && priorCount > 0) {
      throw new Error(
        `Refusing to overwrite ${outputPath}: the fetch returned 0 issues but the existing payload holds ${priorCount}. Re-run with --allow-empty to write the empty payload.`,
      );
    }
  }

  await writeFile(outputPath, JSON.stringify(payload, null, PAYLOAD_INDENT), "utf8");

  return payload;
}
