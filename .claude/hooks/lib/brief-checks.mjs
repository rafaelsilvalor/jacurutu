/**
 * The eleven brief checks, ported from `.claude/agents/brief-validator.md`.
 *
 * Every one of C1-C11 was already a shell one-liner written in prose and
 * executed by a model reading a markdown table. They are pure string
 * operations. Here they are code, they cost no tokens, and — the property the
 * agent never had — they carry fixtures.
 *
 * The port is behaviour-preserving on purpose. Where the agent's reasoning was
 * load-bearing it is repeated at the check it belongs to, because that
 * reasoning is why the implementation looks the way it does.
 */

const MAX_SUBJECT_LENGTH = 72;
const COMMIT_TYPES = "feat|fix|refactor|test|chore|docs|perf|ci";

const TITLE_LINE = /^# Brief: \d{4}-\d{2}-\d{2} — .+$/;
const CATEGORY_LINE = /^> \*\*Category:\*\* (M|L)$/;
const PLAN_REQUIRED_LINE = /^> \*\*Plan required:\*\* (yes|no)/;
const BRANCH_LINE = new RegExp(`^> \\*\\*Branch:\\*\\* \`(${COMMIT_TYPES})/[a-z0-9-]+\`$`);
const REQUIRED_SECTIONS = ["## Context", "## Goal", "## Constraints", "## Done criteria"];
const EDIT_HEADING = /^### Edit \d+ — .+$/;
// Anchored at both ends. Unanchored it also matches "### Commit sequence
// heading", the subsection brief-template defines and that briefs quote, and
// the range would then capture the wrong section and report a confident answer
// about it.
const COMMIT_SEQUENCE_HEADING = /^### Commit sequence$/;
const ANY_HEADING = /^#{2,3} /;
const NUMBERED_ITEM = /^\d+\.\s+/;
const CONVENTIONAL_SUBJECT = new RegExp(`^(${COMMIT_TYPES})(\\([a-z0-9-]+\\))?: `);
const SUBJECT_VERB = /^[a-z]+(\([a-z0-9-]+\))?: ([a-z]+)/;
const PAUSE_POINTS_HEADING = /^## Pause points/;
const PT_BR_PAUSE = /\bPausa\b/;
const CODE_FENCE = /^```/;
const PT_BR_MARKERS =
  /\b(não|para|que|também|então|mas|porque|quando|onde|apenas|sempre|nunca|deve|pode)\b/i;

const PASS = "PASS";
const FAIL = "FAIL";
const STOP = "STOP";

const result = (id, status, detail) => ({ id, status, detail });

/** C1 — the title line carries a dated task identifier. */
export function c1(lines) {
  // C1 accepted a three-digit identifier too, between 2026-08-03 and
  // 2026-08-07. Brief 052 cut new tasks over to a dated id while E9 kept the
  // numeric shape valid for any pre-cutover brief still in flight. Exactly one
  // was, and it was aborted on 2026-08-07, so the window closed.
  const first = lines[0] ?? "";
  return TITLE_LINE.test(first)
    ? result("C1", PASS, first)
    : result("C1", FAIL, `line 1 is not \`# Brief: YYYY-MM-DD — <title>\`; got: "${first}"`);
}

/** C2 — exactly one Category line, M or L. */
export function c2(lines) {
  const hits = lines.filter((line) => CATEGORY_LINE.test(line));
  if (hits.length === 1) return result("C2", PASS, hits[0]);
  return result("C2", FAIL,
    hits.length === 0
      ? "no line matches `> **Category:** M|L` exactly (an annotation on the line breaks it)"
      : `${hits.length} Category lines; exactly one is required`);
}

/** C3 — the Plan required flag is declared. */
export function c3(lines) {
  const hit = lines.find((line) => PLAN_REQUIRED_LINE.test(line));
  return hit
    ? result("C3", PASS, hit)
    : result("C3", FAIL, "no `> **Plan required:** yes|no` line (R15)");
}

/** C4 — the declared branch conforms to R11 / G-R2. */
export function c4(lines) {
  const hit = lines.find((line) => BRANCH_LINE.test(line));
  if (hit) return result("C4", PASS, hit);
  const declared = lines.find((line) => line.startsWith("> **Branch:**"));
  return result("C4", FAIL,
    declared
      ? `branch does not match \`<type>/<kebab>\` (R11 / G-R2); got: ${declared}`
      : "no `> **Branch:**` line");
}

/** C5 — the four required sections appear, in order. */
export function c5(lines) {
  const positions = REQUIRED_SECTIONS.map((section) => ({
    section,
    at: lines.findIndex((line) => line === section),
  }));
  const missing = positions.filter((p) => p.at === -1);
  if (missing.length > 0) {
    return result("C5", FAIL, `missing section(s): ${missing.map((m) => m.section).join(", ")}`);
  }
  for (let i = 1; i < positions.length; i += 1) {
    if (positions[i].at <= positions[i - 1].at) {
      return result("C5", FAIL,
        `${positions[i].section} (line ${positions[i].at + 1}) must follow ` +
        `${positions[i - 1].section} (line ${positions[i - 1].at + 1})`);
    }
  }
  return result("C5", PASS, positions.map((p) => `${p.section}@${p.at + 1}`).join(" "));
}

/** C6 — at least one Edit block. */
export function c6(lines) {
  const count = lines.filter((line) => EDIT_HEADING.test(line)).length;
  return count > 0
    ? result("C6", PASS, `${count} Edit block(s)`)
    : result("C6", FAIL, "no `### Edit <n> — <title>` heading");
}

/**
 * Extract the Commit sequence items.
 *
 * The measurement is of the **line**, not of a parsed subject: whatever
 * survives prefix and backtick removal is what gets measured. That equals the
 * subject only when the line carries nothing else, which is what the format
 * intends. A brief that appends an annotation therefore measures long while
 * its subject fits — and failing it is correct. The gap belongs to
 * brief-template, which never spelled out that the line may carry nothing but
 * the subject. A check may not invent the rule it claims to enforce.
 *
 * The backtick strip is load-bearing: briefs write each item as
 * `` 1. `type(scope): subject` ``, and without it C8 and C11 receive a leading
 * backtick, their `^` anchors never match, and both fail on every valid brief.
 */
export function extractCommitSubjects(lines) {
  const start = lines.findIndex((line) => COMMIT_SEQUENCE_HEADING.test(line));
  if (start === -1) return null;
  const subjects = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (ANY_HEADING.test(lines[i])) break;
    if (!NUMBERED_ITEM.test(lines[i])) continue;
    subjects.push(lines[i].replace(NUMBERED_ITEM, "").replace(/`/g, "").trim());
  }
  return subjects;
}

/** C7 — every Commit sequence line measures within the subject budget. */
export function c7(lines) {
  const subjects = extractCommitSubjects(lines);
  if (subjects === null) return result("C7", FAIL, "no `### Commit sequence` heading");
  if (subjects.length === 0) return result("C7", FAIL, "Commit sequence carries no numbered items");
  const long = subjects.filter((s) => s.length > MAX_SUBJECT_LENGTH);
  return long.length === 0
    ? result("C7", PASS, `${subjects.length} subject(s), longest ${Math.max(...subjects.map((s) => s.length))}`)
    : result("C7", FAIL,
        long.map((s) => `measured ${s.length}: "${s}"`).join("; "));
}

/** C8 — every extracted subject is Conventional Commits shaped. */
export function c8(lines) {
  const subjects = extractCommitSubjects(lines) ?? [];
  const bad = subjects.filter((s) => !CONVENTIONAL_SUBJECT.test(s));
  return bad.length === 0
    ? result("C8", PASS, `${subjects.length} subject(s)`)
    : result("C8", FAIL, bad.map((s) => `"${s}"`).join("; "));
}

/** C9 — the Pause points section exists and names all three, in English. */
export function c9(lines, text) {
  if (!lines.some((line) => PAUSE_POINTS_HEADING.test(line))) {
    return result("C9", FAIL, "no `## Pause points` section");
  }
  const missing = [1, 2, 3].filter((n) => !text.includes(`Pause ${n}`));
  if (missing.length > 0) {
    return result("C9", FAIL, `Pause points does not name: ${missing.map((n) => `Pause ${n}`).join(", ")}`);
  }
  return PT_BR_PAUSE.test(text)
    ? result("C9", FAIL, 'pt-BR "Pausa" on an agent-consumed brief (R9)')
    : result("C9", PASS, "Pause 1, 2 and 3 named");
}

/** C10 — no pt-BR prose outside fenced code blocks (R9). */
export function c10(lines) {
  let inCode = false;
  const hits = [];
  lines.forEach((line, index) => {
    if (CODE_FENCE.test(line)) {
      inCode = !inCode;
      return;
    }
    if (!inCode && PT_BR_MARKERS.test(line)) hits.push(`${index + 1}: ${line.trim()}`);
  });
  return hits.length === 0
    ? result("C10", PASS, "no pt-BR markers outside code")
    : result("C10", FAIL, hits.slice(0, 5).join(" | "));
}

/**
 * C11 — every commit verb sits on the allowlist.
 *
 * A verb on neither list is a STOP, not a judgment call. The agent version
 * emitted FAIL here; the STOP status is preserved so the distinction between
 * "violates a known rule" and "nobody has ruled on this verb" survives.
 */
export function c11(lines, _text, verbLists) {
  if (!verbLists || verbLists.allow.length === 0) {
    return result("C11", STOP, "the verb allowlist could not be read from its SSOT");
  }
  const subjects = extractCommitSubjects(lines) ?? [];
  const verbs = subjects.map((s) => SUBJECT_VERB.exec(s)?.[2]?.toLowerCase() ?? "");
  const denied = verbs.filter((v) => verbLists.deny.includes(v));
  if (denied.length > 0) {
    return result("C11", FAIL, `non-imperative verb(s): ${[...new Set(denied)].join(", ")}`);
  }
  const unknown = verbs.filter((v) => v && !verbLists.allow.includes(v));
  if (unknown.length > 0) {
    return result("C11", STOP, `verb(s) on neither list: ${[...new Set(unknown)].join(", ")}`);
  }
  return result("C11", PASS, `${verbs.length} verb(s) on the allowlist`);
}

const CHECKS = [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11];

/**
 * Run all eleven checks. The verdict mirrors the agent's rules: any FAIL is
 * REJECTED, any STOP with no FAIL is STOP, otherwise APPROVED.
 */
export function validateBrief(text, verbLists) {
  const lines = text.split(/\r?\n/);
  const checks = CHECKS.map((check) => check(lines, text, verbLists));
  const verdict = checks.some((c) => c.status === FAIL)
    ? "REJECTED"
    : checks.some((c) => c.status === STOP)
      ? "STOP"
      : "APPROVED";
  return { checks, verdict };
}

export { MAX_SUBJECT_LENGTH, PASS, FAIL, STOP };
