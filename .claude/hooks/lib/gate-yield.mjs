/**
 * The reader over the gate telemetry stream.
 *
 * Without a reader the data exists and nobody can answer the question it was
 * collected for without writing ad-hoc code in the moment — and the note that
 * commissioned this stream was itself the victim of measuring by reading prose
 * after the fact. This module is the aggregation; `.claude/hooks/gate-yield.mjs`
 * is the CLI over it, the same split as `validate-brief.mjs` over
 * `brief-checks.mjs`.
 *
 * The question, from D1: for each mechanical check, how often it denied, how
 * often it escalated, how often it allowed — and what fraction of the denials
 * were self-inflicted, meaning the same input denied again rather than a real
 * defect that got fixed. The recurring-inputs section is where that last part
 * lives, and it is the reason every record carries a hash.
 */

import { EMPTY_INPUT_HASH, UNKNOWN_SESSION } from "./telemetry.mjs";

/**
 * D8's window, and the SSOT for it. Whichever comes first.
 *
 * The reasoning, preserved because the numbers look arbitrary without it: at
 * the baseline's roughly 10% denial rate, 150 events yield about 15 denials —
 * enough to separate "50% self-inflicted" from "10%", which is the claim under
 * test. 80 events would not.
 */
const WINDOW_SESSIONS = 10;
const WINDOW_EVENTS = 150;

/** An input has to appear at least this many times to be worth naming. */
const RECURRING_MIN = 2;

const DECISIONS = ["deny", "ask", "allow"];
const LABEL_WIDTH = 22;
const COUNT_WIDTH = 5;
const HASH_WIDTH = 14;
const KIND_WIDTH = 15;

/**
 * Parse a JSONL stream into records, keeping what would not parse.
 *
 * Unparseable lines are counted and reported, never dropped (R4). This is not
 * defensive decoration: five processes append to this file concurrently, so a
 * reader will eventually see a line mid-write. A reader that throws on that is
 * a reader nobody runs twice, and one that silently skips it under-reports the
 * very denominator the yield is computed from.
 */
export function parseStream(text) {
  const records = [];
  const unparseable = [];

  text.split(/\r?\n/).forEach((line, index) => {
    if (line.trim() === "") return;
    try {
      const record = JSON.parse(line);
      if (record === null || typeof record !== "object" || Array.isArray(record)) {
        unparseable.push({ line: index + 1, reason: "not a JSON object" });
        return;
      }
      records.push(record);
    } catch (error) {
      unparseable.push({ line: index + 1, reason: error.message });
    }
  });

  return { records, unparseable };
}

/** Count occurrences of `key`, with a per-decision breakdown. */
function tally(records, key) {
  const table = new Map();
  for (const record of records) {
    const name = record[key] ?? "";
    const entry = table.get(name) ?? { name, total: 0, decisions: {} };
    entry.total += 1;
    entry.decisions[record.decision] = (entry.decisions[record.decision] ?? 0) + 1;
    table.set(name, entry);
  }
  return [...table.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

/** Inputs seen more than once: the raw material of D1's self-inflicted fraction. */
function recurringInputs(records) {
  const table = new Map();
  for (const record of records) {
    if (record.inputHash === EMPTY_INPUT_HASH || record.inputHash === undefined) continue;
    const entry = table.get(record.inputHash) ?? {
      hash: record.inputHash,
      inputKind: record.inputKind ?? "",
      label: record.label,
      total: 0,
      decisions: {},
    };
    entry.total += 1;
    entry.decisions[record.decision] = (entry.decisions[record.decision] ?? 0) + 1;
    entry.label = entry.label ?? record.label;
    table.set(record.inputHash, entry);
  }
  return [...table.values()]
    .filter((entry) => entry.total >= RECURRING_MIN)
    .sort((a, b) => b.total - a.total || a.hash.localeCompare(b.hash));
}

/**
 * D8's window state.
 *
 * A session counts as committing when the stream holds at least one
 * `commit-guard` `allow` for its session identifier. That is a proxy, and the
 * report says so rather than implying a certainty it does not have: the guard
 * allowing a commit is not proof that `git commit` then succeeded.
 */
function windowState(records) {
  const committing = new Set(
    records
      .filter((r) => r.hook === "commit-guard" && r.decision === "allow")
      .map((r) => r.session)
      .filter((session) => session && session !== UNKNOWN_SESSION),
  );
  const events = records.length;
  return {
    committingSessions: committing.size,
    events,
    closed: committing.size >= WINDOW_SESSIONS || events >= WINDOW_EVENTS,
  };
}

/** Fold the stream into every number the report prints. */
export function aggregate(records) {
  const sessions = new Set(records.map((r) => r.session).filter((s) => s && s !== UNKNOWN_SESSION));
  return {
    total: records.length,
    sessions: {
      distinct: sessions.size,
      unknown: records.filter((r) => !r.session || r.session === UNKNOWN_SESSION).length,
    },
    // The same shape D12 gives an unresolved session, for the same reason: a
    // silent zero would corrupt the measure without anyone noticing (F-4).
    emptyInput: records.filter((r) => r.inputHash === EMPTY_INPUT_HASH).length,
    perHook: tally(records, "hook"),
    perCheck: tally(records, "check"),
    perDecision: DECISIONS.map((decision) => ({
      name: decision,
      total: records.filter((r) => r.decision === decision).length,
    })),
    recurring: recurringInputs(records),
    window: windowState(records),
  };
}

function decisionSummary(decisions) {
  return DECISIONS.filter((decision) => decisions[decision])
    .map((decision) => `${decision} ${decisions[decision]}`)
    .join("  ");
}

function countSection(title, entries) {
  if (entries.length === 0) return [`${title}`, "  (none)", ""];
  return [
    title,
    ...entries.map(
      (entry) =>
        `  ${entry.name.padEnd(LABEL_WIDTH)}${String(entry.total).padStart(COUNT_WIDTH)}` +
        `${entry.decisions ? `   ${decisionSummary(entry.decisions)}` : ""}`,
    ),
    "",
  ];
}

function recurringSection(recurring) {
  if (recurring.length === 0) {
    return [`Recurring inputs (${RECURRING_MIN} or more events)`, "  (none yet)", ""];
  }
  return [
    `Recurring inputs (${RECURRING_MIN} or more events)`,
    ...recurring.map((entry) => {
      const head =
        `  ${entry.hash.padEnd(HASH_WIDTH)}${entry.inputKind.padEnd(KIND_WIDTH)}` +
        `${String(entry.total).padStart(3)}x   ${decisionSummary(entry.decisions)}`;
      return entry.label ? `${head}\n      ${entry.label}` : head;
    }),
    "",
  ];
}

function windowSection(window) {
  return [
    "Window (D8)",
    `  Committing sessions: ${window.committingSessions} of ${WINDOW_SESSIONS}`,
    `  Events:              ${window.events} of ${WINDOW_EVENTS}`,
    `  State:               ${window.closed ? "CLOSED — time to write the digest" : "OPEN"}`,
    "",
    "  A committing session is one with at least one commit-guard allow. That",
    "  is a proxy, not a fact: the guard allowing a commit is not proof that",
    "  git commit then succeeded.",
    "",
  ];
}

/** Render the report. Pure string work over the aggregate. */
export function formatReport(summary, unparseable = [], path = "") {
  const lines = [
    `Gate telemetry${path ? ` — ${path}` : ""}`,
    "",
    `Events:                          ${summary.total}`,
    `Distinct sessions:               ${summary.sessions.distinct}`,
    `Records with unresolved session: ${summary.sessions.unknown}`,
    `Records with no inspected input: ${summary.emptyInput}`,
    `Unparseable lines:               ${unparseable.length}`,
    "",
    ...countSection("Per hook", summary.perHook),
    ...countSection("Per check", summary.perCheck),
    ...countSection("Per decision", summary.perDecision),
    ...recurringSection(summary.recurring),
    ...windowSection(summary.window),
  ];

  if (unparseable.length > 0) {
    lines.push(
      "Unparseable lines, kept rather than dropped",
      ...unparseable.map((entry) => `  line ${entry.line}: ${entry.reason}`),
      "",
    );
  }

  return `${lines.join("\n")}\n`;
}

export { WINDOW_SESSIONS, WINDOW_EVENTS, RECURRING_MIN };
