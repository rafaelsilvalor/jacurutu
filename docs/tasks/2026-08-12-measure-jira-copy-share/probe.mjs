#!/usr/bin/env node
// Throwaway probe for the 2026-08-12 copy-locality measurement. NOT product code: never
// imported, never in a tsconfig, never in npm test. It answers one question over a page of
// real design cards — what share carry their copy text inside Jira rather than behind a
// Drive link — using only what adapter-jira already has.
//
// Why it exists: the 2026-08-12 art-chain spike stopped at SCOPE-BLOCKED, and every remedy
// for that is organizational (widen the OAuth scope, adopt the Picker, buy a service
// account). Before buying one, measure whether the Drive read is needed as often as the
// chain assumes. This probe can shrink the problem; it cannot solve it.
//
// Credential hygiene (binding): nothing is written to disk, no token and no Authorization
// header is ever printed, and at most FIRST_LINE_SAMPLE cards contribute a text sample
// truncated to HEAD_MAX characters. Everything else is counts, lengths and a truncated
// sha256. Unpublished campaign copy is sensitive (suindara's PORTING.md section 8).
//
// No Drive call is made anywhere in this file, deliberately: the question is what Jira
// alone can give. Jira is read-only here — three searches and a field-catalog read.

import { createHash } from "node:crypto";

import { JiraGateway } from "../../../packages/adapter-jira/dist/index.js";
// Deep imports, because none of these four are on the package's public surface (index.ts
// exports the gateway and the field-mapping policy, nothing else). Reimplementing them
// would measure a matcher Saci does not use — `bestSisterMatch` in particular carries the
// summary-token-overlap rule that decides WHICH sister a card's copy belongs to, and a
// hand-rolled substitute would silently measure a different pairing.
import { SISTER_FIELDS, PARENT_FIELDS, COPYWRITER_ISSUETYPE }
  from "../../../packages/adapter-jira/dist/field-mapping.js";
import { adfExtractText, adfExtractDriveUrls, extractUrlsFromComments }
  from "../../../packages/adapter-jira/dist/extract.js";
import { bestSisterMatch } from "../../../packages/adapter-jira/dist/navigation.js";
import { JiraHttpClient } from "../../../packages/adapter-jira/dist/http.js";

// --- Policy constants (R7) ---

const REQUIRED_FLAGS = ["jql"];
const JIRA_ENV_VARS = ["SACI_JIRA_BASE_URL", "SACI_JIRA_EMAIL", "SACI_JIRA_API_TOKEN"];
const [ENV_BASE_URL, ENV_EMAIL, ENV_API_TOKEN] = JIRA_ENV_VARS;
// A precondition failure (missing flag/env) versus a measured negative verdict.
const EXIT_PRECONDITION = 2, EXIT_VERDICT = 1;
const DEFAULT_MAX_CARDS = 50;
// Several COPYWRITER sisters can hang off one parent, so capping the sister search at the
// card count would truncate silently and undercount the very surface being measured.
const RELATED_FANOUT = 4;
// The design search deliberately omits `description` (adapter-jira field-mapping.ts:47:
// MANDATORY_DESIGN_FIELDS is summary/status/parent/updated). That omission is why this
// probe needs a second read at all, and is itself a finding.
const DESIGN_TEXT_FIELDS = ["summary", "parent", "description", "comment"];
// "Usable copy" needs a character cut, and choosing one before seeing the data would
// manufacture the answer. Every threshold is reported; DEFAULT_THRESHOLD only decides which
// one the cross-tab and the samples key on, and it must be a member of THRESHOLDS.
const THRESHOLDS = [100, 200, 500];
const DEFAULT_THRESHOLD = 200;
const LENGTH_BUCKETS = [
  { label: "0 (empty)", min: 0, max: 0 },
  { label: "1-99", min: 1, max: 99 },
  { label: "100-299", min: 100, max: 299 },
  { label: "300-999", min: 300, max: 999 },
  { label: "1000+", min: 1000, max: Infinity },
];
const HEAD_MAX = 60, FIRST_LINE_SAMPLE = 3, SHA_PREFIX_LEN = 12;
// Any URL, not just Drive/Docs: a description whose whole body is a bare link must measure
// as zero prose, or "the copy is in Jira" would count links as copy. Core's URL_DRIVE_RE is
// Drive-specific and is the wrong tool for this — the rule here is a measurement rule of
// this probe, not the domain's link rule, so it is local on purpose.
const URL_ANY = /https?:\/\/\S+/g;
// The relaxed form of the only strong signal of the only production template. The anchored
// production regex is /^\s*L\d+\s*:/m, and it CANNOT be evaluated here: adfExtractText joins
// every text node with a single space (extract.ts:131), so ADF-derived text has no line
// breaks at all and `^` matches only at position 0. Measured against the compiled adapter on
// 2026-08-12: a two-frame doc yields "L1: ... L2: ...", where the anchored form counts 1 and
// this one counts 2. The anchored count would therefore cap at one marker per card however
// many frames the copy has, and read as a finding about the copy rather than about the
// extraction. That the production signal does not survive the ADF path is itself a finding.
const LINE_MARKER = /\bL\d+\s*:/g;
const SURFACES = ["own.desc", "own.cmt", "sis.desc", "sis.cmt", "par.desc"];
const CRITERIA = [
  ["M1", "a JQL page of design cards fetched"],
  ["M2", "Jira-side copy surfaces read for every card"],
  ["M3", "prose-length distribution printed"],
  ["M4", "three-way classification printed at every threshold"],
  ["M5", "carousel line-marker count measured over the Jira text"],
];

// --- Helpers ---

const sha12 = (data) => createHash("sha256").update(data).digest("hex").slice(0, SHA_PREFIX_LEN);
const pct = (n, total) => (total === 0 ? "0%" : `${Math.round((n / total) * 100)}%`);
const summarize = (map) => [...map.entries()].map(([key, n]) => `${key}=${n}`).join(" ");

/**
 * A measured negative answer, not a crash. It carries its own already-printed verdict, so
 * the top-level handler must not report it as a probe failure — and the criteria table still
 * prints, because a late stop must not discard the stages that already succeeded.
 */
class VerdictStop extends Error {
  constructor(verdict, code = EXIT_VERDICT) {
    super(verdict);
    this.code = code;
  }
}

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const name = argv[i].startsWith("--") ? argv[i].slice(2) : null;
    // A value that is itself a flag means the previous one was given none. Leaving it unset
    // makes the presence check below report the real mistake, instead of the run proceeding
    // with `--jql` set to "--max" and Jira answering a syntax error.
    if (name && !argv[i + 1]?.startsWith("--")) flags[name] = argv[i + 1];
  }
  // Name every absent input individually (the cli.ts env-check pattern): one blanket usage
  // line hides which one was the typo.
  const missing = REQUIRED_FLAGS.filter((name) => !flags[name]);
  const missingEnv = JIRA_ENV_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0 || missingEnv.length > 0) {
    for (const name of missing) console.error(`missing required flag: --${name}`);
    for (const name of missingEnv) console.error(`missing required env var: ${name}`);
    console.error('usage: node probe.mjs --jql "<JQL>" [--max <n>]');
    throw new VerdictStop("USAGE", EXIT_PRECONDITION);
  }
  return flags;
}

/** A non-numeric `--max` must stop, not silently become NaN and cap every search at zero. */
function parseMaxCards(raw) {
  if (raw === undefined) return DEFAULT_MAX_CARDS;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    console.error(`--max must be a positive integer; got "${raw}"`);
    throw new VerdictStop("USAGE", EXIT_PRECONDITION);
  }
  return value;
}

/** Prose, for measurement: URLs removed, whitespace collapsed. Never printed in full. */
const proseOf = (text) => text.replace(URL_ANY, " ").replace(/\s+/g, " ").trim();

/**
 * Concatenated text of a Jira `comment` field. The two wire shapes (an object carrying
 * `.comments[]`, or a bare array) are handled here because `extractUrlsFromComments` returns
 * URLs and there is no text equivalent to reuse — the shape narrowing is duplicated, the
 * extraction is not.
 */
function commentsText(field) {
  if (!field) return "";
  const comments = Array.isArray(field) ? field
    : (Array.isArray(field?.comments) ? field.comments : []);
  return comments.map((c) => adfExtractText(c?.body)).filter(Boolean).join(" ");
}

const fieldsOf = (issue) => (issue && typeof issue === "object" && issue.fields) || {};

/** One surface's measurement: how much prose it carries, and whether it carries a link. */
const measure = (text, urls) => ({ chars: proseOf(text).length, urls: urls.length,
  prose: proseOf(text) });

/** Every Jira-side surface a card's copy could live on, measured the same way. */
function measureCard(design, sister, parent) {
  const d = fieldsOf(design), s = fieldsOf(sister), p = fieldsOf(parent);
  return {
    "own.desc": measure(adfExtractText(d.description), adfExtractDriveUrls(d.description)),
    "own.cmt": measure(commentsText(d.comment), extractUrlsFromComments(d.comment)),
    "sis.desc": measure(adfExtractText(s.description), adfExtractDriveUrls(s.description)),
    "sis.cmt": measure(commentsText(s.comment), extractUrlsFromComments(s.comment)),
    "par.desc": measure(adfExtractText(p.description), adfExtractDriveUrls(p.description)),
  };
}

/** Ranked by prose length; ties break on SURFACES order, so a re-run reports the same one. */
function bestSurface(surfaces) {
  let best = SURFACES[0];
  for (const name of SURFACES) {
    if (surfaces[name].chars > surfaces[best].chars) best = name;
  }
  return best;
}

// --- Reporting ---

function printCards(rows) {
  for (const row of rows) {
    const counts = SURFACES.map((name) => `${name}=${row.surfaces[name].chars}`).join(" ");
    console.log(`[card] ${row.key} copy_source=${row.copySource} ${counts} `
      + `best=${row.best}(${row.chars}) drive=${row.hasDrive ? "yes" : "no"} `
      + `markers=${row.markers} sha256=${row.sha}`);
  }
}

function printDistribution(rows) {
  console.log(`[dist] best-surface prose length over ${rows.length} card(s):`);
  for (const bucket of LENGTH_BUCKETS) {
    const n = rows.filter((r) => r.chars >= bucket.min && r.chars <= bucket.max).length;
    console.log(`[dist]   ${bucket.label.padEnd(11)} ${String(n).padStart(4)}  ${pct(n, rows.length)}`);
  }
}

/**
 * The three-way answer, at every threshold. A card is Jira-resolvable when its best surface
 * carries enough prose; otherwise it is Drive-only if a copy_url resolved, and neither if
 * not. Printing all three thresholds is the point: a number that moves a lot between them is
 * a weaker claim than one that does not, and that is invisible from a single percentage.
 */
function classify(rows, threshold) {
  const jira = rows.filter((r) => r.chars >= threshold);
  const rest = rows.filter((r) => r.chars < threshold);
  return { jira, drive: rest.filter((r) => r.hasDrive), neither: rest.filter((r) => !r.hasDrive) };
}

function printClassification(rows) {
  for (const threshold of THRESHOLDS) {
    const { jira, drive, neither } = classify(rows, threshold);
    console.log(`[class] threshold=${String(threshold).padStart(4)} `
      + `A jira-resolvable=${jira.length} (${pct(jira.length, rows.length)})  `
      + `B drive-only=${drive.length} (${pct(drive.length, rows.length)})  `
      + `C neither=${neither.length} (${pct(neither.length, rows.length)})`);
  }
  const { jira } = classify(rows, DEFAULT_THRESHOLD);
  const alsoLinked = jira.filter((r) => r.hasDrive).length;
  // The cross-tab is the honesty check on category A. A card whose Jira text is long AND
  // that still carries a Drive link is not proof the text is the copy — it may be a summary
  // sitting next to the real document, and only reading both would tell.
  console.log(`[class] cross-tab at threshold=${DEFAULT_THRESHOLD}: of ${jira.length} `
    + `A-card(s), ${alsoLinked} (${pct(alsoLinked, jira.length)}) also carry a Drive link`);
  const bySurface = new Map();
  for (const row of jira) bySurface.set(row.best, (bySurface.get(row.best) ?? 0) + 1);
  const where = SURFACES.filter((name) => bySurface.has(name))
    .map((name) => `${name}=${bySurface.get(name)}`).join(" ") || "(none)";
  console.log(`[class] where the winning text lives at threshold=${DEFAULT_THRESHOLD}: ${where}`);
}

/**
 * A bounded look at the actual text. Character counts cannot distinguish real copy from a
 * recurring delivery note, and that distinction decides whether the headline number means
 * anything — so a few heads travel, and the repeated-sha column catches boilerplate that
 * these three samples happen to miss.
 */
function printSamples(rows) {
  const { jira } = classify(rows, DEFAULT_THRESHOLD);
  const sample = jira.slice(0, FIRST_LINE_SAMPLE);
  console.log(`[sample] first ${sample.length} of ${jira.length} A-card(s), `
    + `head truncated to ${HEAD_MAX} chars (no line breaks survive ADF extraction):`);
  for (const row of sample) {
    console.log(`[sample] ${row.key} ${row.best} head="${row.prose.slice(0, HEAD_MAX)}"`);
  }
  const shas = new Map();
  for (const row of rows) {
    if (row.chars > 0) shas.set(row.sha, (shas.get(row.sha) ?? 0) + 1);
  }
  const repeated = [...shas.entries()].filter(([, n]) => n > 1);
  // Identical text across cards is boilerplate wearing copy's length, and it would inflate
  // category A silently.
  console.log(`[sample] repeated best-surface text: ${repeated.length} sha(s) appear on more `
    + `than one card${repeated.length > 0 ? ` (${repeated.map(([s, n]) => `${s}x${n}`).join(" ")})` : ""}`);
}

const printCriteria = (verdicts) => CRITERIA.forEach(([id, label]) =>
  console.log(`[verdict] ${id} ${label}: ${verdicts[id] ?? "not measured"}`));

// --- Entry point ---

async function run(flags, verdicts) {
  const baseUrl = process.env[ENV_BASE_URL], email = process.env[ENV_EMAIL];
  const apiToken = process.env[ENV_API_TOKEN];
  const maxCards = parseMaxCards(flags.max);
  console.log(`[probe] node ${process.version} on ${process.platform}; `
    + `read-only, no Drive call; max=${maxCards}`);

  // The default sinks print one line per drop and per warning, which on a 50-card page
  // buries the measurement. Tallied and reported below instead — aggregated, never silent (R4).
  const drops = new Map(), warnings = new Map();
  const tally = (map) => (key) => map.set(key, (map.get(key) ?? 0) + 1);
  const gateway = new JiraGateway({
    baseUrl, email, apiToken, mainJql: flags.jql, maxResults: maxCards,
    dropLog: (_key, reason) => tally(drops)(reason),
    warningLog: (_key, field) => tally(warnings)(field),
  });
  await gateway.verifyCredentials();

  const issues = await gateway.fetchIssues();
  console.log(`[jira] ${issues.length} design card(s) after the adapter's own filters`);
  verdicts.M1 = `PASS (${issues.length} cards)`;
  if (issues.length === 0) {
    console.error("[jira] the JQL matched no design card — verdict NO-CARDS");
    throw new VerdictStop("NO-CARDS");
  }

  const keys = issues.map((issue) => issue.key);
  const parentKeys = [...new Set(issues.map((issue) => issue.parent_key).filter(Boolean))];
  const http = new JiraHttpClient({ baseUrl, email, apiToken });
  const relatedMax = maxCards * RELATED_FANOUT;
  // Three reads, because `Issue` carries no text: the design bodies the main search omits,
  // the sisters, and the parents. Field lists are the adapter's own, not restated here.
  const designRaw = await http.searchJql(`key IN (${keys.join(",")})`, DESIGN_TEXT_FIELDS, maxCards);
  const sistersRaw = parentKeys.length === 0 ? [] : await http.searchJql(
    `parent IN (${parentKeys.join(",")}) AND issuetype = ${COPYWRITER_ISSUETYPE}`,
    SISTER_FIELDS, relatedMax);
  const parentsRaw = parentKeys.length === 0 ? [] : await http.searchJql(
    `key IN (${parentKeys.join(",")})`, PARENT_FIELDS, relatedMax);
  console.log(`[fetch] bodies read: designs=${designRaw.length} sisters=${sistersRaw.length} `
    + `parents=${parentsRaw.length} (for ${parentKeys.length} distinct parent(s))`);

  const designByKey = new Map(designRaw.map((issue) => [issue.key, issue]));
  const parentsByKey = new Map(parentsRaw.map((issue) => [issue.key, issue]));
  const sistersByParent = new Map();
  for (const sister of sistersRaw) {
    const parentKey = fieldsOf(sister).parent?.key;
    if (!parentKey) continue;
    sistersByParent.set(parentKey, [...(sistersByParent.get(parentKey) ?? []), sister]);
  }

  const rows = [];
  for (const issue of issues) {
    const design = designByKey.get(issue.key);
    // A card whose body did not come back cannot be measured, and counting it as "no text"
    // would put it in category B or C on the strength of a fetch gap (R4).
    if (!design) throw new Error(`no body returned for ${issue.key}; the measurement would be wrong`);
    const candidates = sistersByParent.get(issue.parent_key) ?? [];
    const sister = bestSisterMatch(design, candidates);
    const surfaces = measureCard(design, sister, parentsByKey.get(issue.parent_key));
    const best = bestSurface(surfaces);
    const prose = surfaces[best].prose;
    rows.push({
      key: issue.key, copySource: issue.copy_source, hasDrive: issue.copy_url !== null,
      surfaces, best, prose, chars: surfaces[best].chars,
      markers: (prose.match(LINE_MARKER) ?? []).length,
      sha: surfaces[best].chars === 0 ? "-".repeat(SHA_PREFIX_LEN) : sha12(prose),
    });
  }
  verdicts.M2 = `PASS (${rows.length} cards x ${SURFACES.length} surfaces)`;

  if (drops.size > 0) console.log(`[jira] filtered before mapping: ${summarize(drops)}`);
  if (warnings.size > 0) console.log(`[jira] extraction warnings: ${summarize(warnings)}`);
  printCards(rows);
  printDistribution(rows);
  verdicts.M3 = "PASS";
  printClassification(rows);
  verdicts.M4 = `PASS (thresholds ${THRESHOLDS.join("/")})`;
  printSamples(rows);
  const withMarkers = rows.filter((row) => row.markers > 0).length;
  console.log(`[signal] ${withMarkers}/${rows.length} card(s) carry a line marker (\\bL\\d+\\s*:) `
    + `in their best surface; the anchored production regex cannot be evaluated on ADF text`);
  verdicts.M5 = `PASS (${withMarkers}/${rows.length})`;
  // The criteria table is `main`'s to print, on every path. Printing it here too put it
  // twice on the success path — the failing paths hid the duplicate, because they throw
  // before reaching this line. Measured on the 2026-08-12 run.
}

/**
 * The criteria table prints on every path, including the failing ones — a late throw must
 * not discard measurements that already succeeded and would cost another live run to
 * recover.
 *
 * `process.exitCode` rather than `process.exit()`: the latter does not wait for asynchronous
 * stderr to drain, and stderr is asynchronous whenever it is a pipe or a file rather than a
 * TTY. The run instructions ask for this output to be pasted, which invites a redirect.
 */
async function main() {
  const verdicts = {};
  let started = false;
  try {
    const flags = parseFlags(process.argv.slice(2));
    started = true;
    await run(flags, verdicts);
  } catch (error) {
    if (!(error instanceof VerdictStop)) {
      console.error(`[probe] FAILED — ${error.message}`);
      if (error.cause instanceof Error) console.error(`[probe] cause: ${error.cause.message}`);
    }
    process.exitCode = error instanceof VerdictStop ? error.code : EXIT_VERDICT;
  }
  // Not printed for a usage error: nothing was attempted, so five "not measured" rows would
  // suggest a run that never happened.
  if (started) printCriteria(verdicts);
}

await main();
