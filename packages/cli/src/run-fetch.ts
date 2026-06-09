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

import { writeFile } from "node:fs/promises";

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
 */
export async function runFetch(
  makeGateway: MakeGateway,
  outputPath: string,
  now: Date = new Date(),
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
  const issues: Issue[] = await gateway.fetchIssues();

  const meta = stampMeta(now);
  const payload = assemblePayload(issues, filteredOut, warnings, meta);

  await writeFile(outputPath, JSON.stringify(payload, null, PAYLOAD_INDENT), "utf8");

  return payload;
}
