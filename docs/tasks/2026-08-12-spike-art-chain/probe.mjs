#!/usr/bin/env node
// Throwaway probe for the 2026-08-12 art-chain spike. NOT product code: never imported,
// never in a tsconfig, never in npm test (constraint 5). It carries one real Jira card to
// rendered PNGs in Drive using only the pieces that already exist, and measures the seam.
// Credential hygiene (binding, D6): no brief body, no token and no client secret reaches
// stdout — only counts, a truncated first line and a truncated sha256. The brief text
// itself lands under --out, outside the repo. Machine paths arrive as flags (R1); the
// imports resolve against THIS file, so cwd is free here — render.mjs is the one that
// cares (D3), and every path handed to it is absolute.

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";

import {
  authorize, createGoogleDriveFilesApi, defaultCredentialPaths, DriveGateway, DRIVE_SCOPES,
} from "../../../packages/adapter-drive/dist/index.js";
import { JiraGateway } from "../../../packages/adapter-jira/dist/index.js";
// derivePath is core's and stage 11 reports the segments it WOULD use; reimplementing it
// would prove a chain Saci does not have (D1), the same reason the adapters are imported.
import { derivePath } from "../../../packages/core/dist/index.js";

// --- Policy constants (R7) ---

const REQUIRED_FLAGS = ["key", "suindara", "template", "brand", "out", "drive-folder"];
const JIRA_ENV_VARS = ["SACI_JIRA_BASE_URL", "SACI_JIRA_EMAIL", "SACI_JIRA_API_TOKEN"];
const [ENV_BASE_URL, ENV_EMAIL, ENV_API_TOKEN] = JIRA_ENV_VARS;
// A precondition failure (missing flag/env) versus a measured negative verdict.
const EXIT_PRECONDITION = 2, EXIT_VERDICT = 1;
// D2: a .docx is a ZIP, so alt=media SUCCEEDS on it and returns bytes that are not text.
// One page of bytes is enough to see any container header.
const TEXT_PROBE_BYTES = 8192, MIN_PRINTABLE_RATIO = 0.85;
const FIRST_LINE_MAX = 60, SHA_PREFIX_LEN = 12, RENDER_SCALE = 2;
const NATIVE_DOCS_PREFIX = "application/vnd.google-apps.", EXPORT_MIME = "text/plain";
const DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";
const TRANSITIONS_PATH = "/rest/api/3/issue/{key}/transitions";
const TEMPLATE_DIR_PREFIX = "suindara-tmpl-", STABLE_STATUS = "stable";
const STRONG_SIGNAL = /^\s*L\d+\s*:/gm; // the only strong signal of the only prod template
const SPEC_SCHEMA_VERSION = "1.0", PACKAGE_DIR = "pkg", RERENDER_DIR = "pkg-recheck";
const NBSP = /\u00a0/g; // escaped, not literal: a raw NBSP in source is invisible
// `drive/folders/` is recognized in order to be REFUSED — a folder paste is plausible and
// reading one as a brief fails confusingly.
const URL_PATTERNS = [
  ["doc", /docs\.google\.com\/document\/d\/([\w-]+)/],
  ["binary", /drive\.google\.com\/file\/d\/([\w-]+)/],
  ["binary", /drive\.google\.com\/open\?id=([\w-]+)/],
  ["folder", /drive\.google\.com\/drive\/folders\/([\w-]+)/],
];
// 401/403 mean the grant does not cover the call; 404 means the same under drive.file,
// which hides what the app did not create (046 D7). Status codes only — Google localizes
// its messages, so matching on text breaks per operator (G-JIRA-1).
const SCOPE_BLOCKED_STATUSES = new Set([401, 403, 404]);
const WOULD_COMMENT = "Saci generated art: {n} file(s) uploaded to Drive folder {folder}.";
const CRITERIA = [
  ["S1", "brief text obtained from the real copy doc and verified to be text"],
  ["S2", "match reached a decision on a real card"],
  ["S3", "render.mjs exited 0 and produced N PNGs plus editables/spec.json"],
  ["S4", "re-render from the saved spec is byte-identical through the spawn boundary"],
  ["S5", "PNGs uploaded to Drive and returned ids"],
];

// --- Helpers ---

const yn = (value) => (value ? "yes" : "no");
const sha12 = (data) => createHash("sha256").update(data).digest("hex").slice(0, SHA_PREFIX_LEN);
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

/**
 * The adapter hangs the classified status on the error's `cause` (adapter-drive errors.ts),
 * and `errorStatus` there returns `error.status` when it is a number **or a string** — so
 * coerce instead of filtering on type. Filtering dropped a string "403" on the floor and
 * turned the SCOPE-BLOCKED verdict into a generic crash on the very path a `.docx` takes.
 */
const statusOf = (error) => {
  for (const value of [error?.cause?.status, error?.response?.status, error?.status,
    error?.code]) {
    if (value === null || value === undefined || value === "") continue;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return "n/a";
};

function parseFlags(argv) {
  const flags = { force: argv.includes("--force") };
  for (let i = 0; i < argv.length; i += 1) {
    const name = argv[i].startsWith("--") ? argv[i].slice(2) : null;
    // A value that is itself a flag means the previous one was given none. Leaving it
    // unset makes the presence check below report the real mistake, instead of the run
    // proceeding with `--key` set to "--suindara" and Jira answering not-found.
    if (name && name !== "force" && !argv[i + 1]?.startsWith("--")) flags[name] = argv[i + 1];
  }
  // Name every absent input individually (the cli.ts env-check pattern): one blanket usage
  // line hides which of the six was the typo.
  const missing = REQUIRED_FLAGS.filter((name) => !flags[name]);
  const missingEnv = JIRA_ENV_VARS.filter((name) => !process.env[name]);
  if (missing.length === 0 && missingEnv.length === 0) return flags;
  for (const name of missing) console.error(`missing required flag: --${name}`);
  for (const name of missingEnv) console.error(`missing required env var: ${name}`);
  console.error(`usage: node probe.mjs ${REQUIRED_FLAGS.map((n) => `--${n} <value>`).join(" ")} [--force]`);
  throw new VerdictStop("USAGE", EXIT_PRECONDITION);
}

function parseDriveUrl(url) {
  for (const [kind, pattern] of URL_PATTERNS) {
    const found = pattern.exec(url);
    if (found) return { kind, id: found[1] };
  }
  return { kind: "unknown", id: "" };
}

/** Is the payload text? An empty read fails too — there is nothing usable either way. */
function inspectText(text) {
  const head = text.slice(0, TEXT_PROBE_BYTES);
  let printable = 0, nulByte = false;
  for (let i = 0; i < head.length; i += 1) {
    const code = head.charCodeAt(i);
    if (code === 0) nulByte = true;
    if (code === 9 || code === 10 || code === 13 || code >= 32) printable += 1;
  }
  // A .docx can still report a high ratio: gaxios decodes its ZIP bytes as UTF-8 and every
  // invalid sequence becomes U+FFFD, which counts as printable. The NUL check is what
  // catches that case, so read `printableRatio=0.92 nulByte=true` as the NUL doing the work.
  const ratio = head.length === 0 ? 0 : printable / head.length;
  return { ok: !nulByte && ratio >= MIN_PRINTABLE_RATIO, ratio, nulByte };
}

// `files.export` is not on `DriveFilesApi` — the port has no export primitive yet, which is
// a finding of this spike, not a gap to patch here. So it rides the authorized client the
// adapter returned rather than a second library import.
async function exportPlainText(auth, fileId) {
  const url = `${DRIVE_FILES_ENDPOINT}/${fileId}/export?mimeType=${encodeURIComponent(EXPORT_MIME)}`;
  const response = await auth.request({ url, responseType: "text" });
  return typeof response.data === "string" ? response.data : JSON.stringify(response.data);
}

/** Stage 4, the read experiment: branch on mimeType (D2), never try both blind. */
async function readBrief(drive, auth, fileId, mimeType) {
  const native = mimeType.startsWith(NATIVE_DOCS_PREFIX);
  const path = native ? "export" : "media";
  let raw;
  try {
    raw = native ? await exportPlainText(auth, fileId) : await drive.readFileContent(fileId);
  } catch (error) {
    console.error(`[drive] path=${path} -> HTTP ${statusOf(error)}`);
    console.error(`[drive] google said: ${error.message}`);
    if (!SCOPE_BLOCKED_STATUSES.has(statusOf(error))) throw error; // not a scope answer (R4)
    console.error(`[drive] verdict SCOPE-BLOCKED under ${DRIVE_SCOPES.join(" + ")}`);
    console.error(`[drive] widening the scopes means deleting ${defaultCredentialPaths().tokenPath}`
      + " first — a scope change silently reuses the old grant (G-DRIVE-1)");
    throw new VerdictStop("SCOPE-BLOCKED");
  }
  console.log(`[drive] path=${path} -> ok`);
  const { ok, ratio, nulByte } = inspectText(raw);
  console.log(`[drive] textCheck=${ok ? "pass" : "fail"} printableRatio=${ratio.toFixed(2)} nulByte=${nulByte}`);
  if (ok) return raw;
  // Distinct from SCOPE-BLOCKED on purpose: the grant worked and the content is unusable,
  // which is a different problem with a different fix.
  console.error(`[drive] verdict BINARY-NOT-TEXT mimeType=${mimeType}`);
  throw new VerdictStop("BINARY-NOT-TEXT");
}

function normalizeBrief(raw) {
  const bom = raw.charCodeAt(0) === 0xfeff;
  const crlf = (raw.match(/\r\n/g) ?? []).length, nbsp = (raw.match(NBSP) ?? []).length;
  const text = (bom ? raw.slice(1) : raw).replace(/\r\n|\r/g, "\n").replace(NBSP, " ");
  return { text, bom, crlf, nbsp };
}

// --- Stage 6: match, categorical and never a score (D7) ---

async function loadManifests(templatesRoot) {
  const found = [];
  for (const entry of await readdir(templatesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith(TEMPLATE_DIR_PREFIX)) continue;
    const dir = join(templatesRoot, entry.name), manifestPath = join(dir, "template.json");
    // A sibling without a manifest is not a template, so skipping it hides nothing. A
    // malformed manifest throws, by not being caught (R4).
    if (existsSync(manifestPath)) {
      found.push({ dir, manifest: JSON.parse(await readFile(manifestPath, "utf8")) });
    }
  }
  return found;
}

/** `issue.labels` is always empty here: `Issue` carries no labels field. */
function signalFires(signal, context, where) {
  const value = { brief: context.brief, "issue.summary": context.summary,
    "issue.labels": context.labels.join("\n") }[signal.field];
  if (value === undefined) throw new Error(`${where} reads an unknown field "${signal.field}"`);
  const pattern = signal.matches ?? signal.contains;
  if (typeof pattern !== "string") throw new Error(`${where} declares no matches/contains`);
  if (signal.mode !== "regex") return value.toLowerCase().includes(pattern.toLowerCase());
  try {
    return new RegExp(pattern, "m").test(value);
  } catch (cause) {
    // Never a silent skip: a dropped signal downgrades a deterministic match to a manual
    // prompt with no explanation.
    throw new Error(`${where} carries an invalid regex ${JSON.stringify(pattern)}: ${cause.message}`);
  }
}

/** A non-stable template never decides alone, so a strong hit on `alpha` is a suggestion. */
function decideFor(status, counts) {
  if (counts.strong > 0 && status === STABLE_STATUS) return "deterministic";
  if (counts.strong > 0) return `suggested(strong hit, status=${status})`;
  return counts.medium > 0 ? "suggested(medium hits only)" : "manual";
}

function scoreTemplate(entry, context) {
  const { id, status } = entry.manifest;
  const counts = { strong: 0, medium: 0, weak: 0 }, hits = [];
  for (const [index, signal] of (entry.manifest.match?.signals ?? []).entries()) {
    const where = `template "${id}" signal[${index}]`;
    if (!(signal.weight in counts)) throw new Error(`${where} declares weight "${signal.weight}"`);
    if (!signalFires(signal, context, where)) continue;
    counts[signal.weight] += 1;
    hits.push(`${signal.field} ~ ${signal.matches ?? signal.contains} (${signal.weight})`);
  }
  return { ...entry, id, status, ...counts, hits, decision: decideFor(status, counts) };
}

// Ranked, not scored: strong hits, then medium, then weak, then id — a tie breaks the same
// way on every run, and the printed rows stay the whole reason for the choice.
function pickTemplate(rows) {
  const ranked = rows.filter((row) => row.strong > 0 || row.medium > 0);
  ranked.sort((a, b) => b.strong - a.strong || b.medium - a.medium || b.weak - a.weak
    || a.id.localeCompare(b.id));
  return ranked[0] ?? null;
}

// --- Stages 7-10: spec, render, package, determinism ---

const buildSpec = (row, issue, brief, brandId) => ({
  schemaVersion: SPEC_SCHEMA_VERSION, template: row.id,
  templateVersion: row.manifest.templateVersion, brand: brandId, content: { brief },
  task: { key: issue.key, title: issue.summary, vertical: issue.vertical_raw },
  output: { scale: RENDER_SCALE, format: "png", filename: null },
});

const renderArgs = (spec, template, brand, out, force) => ["--spec", spec, "--template",
  template, "--brand", brand, "--out", out, ...(force ? ["--force"] : [])];

// D3, belt and braces: absolute --template and --brand AND cwd at the Suindara root.
// render.mjs resolves a missing template as `resolve('..', 'suindara-tmpl-' + id)` and the
// brand pack as `brands/<id>.json`, both against cwd — a spawn from elsewhere silently
// renders the wrong thing.
function runRender(suindara, args) {
  return new Promise((done, failed) => {
    const child = spawn(process.execPath, [join(suindara, "tools", "render.mjs"), ...args],
      { cwd: suindara, stdio: "inherit" });
    child.on("error", failed); // a spawn that never started has no exit code (R4)
    child.on("close", (code) => done(code ?? -1));
  });
}

async function inspectPackage(dir) {
  // An absent directory is an answer, not a crash: an aborted render writes nothing, and a
  // thrown ENOENT here would take the whole criteria table down with it.
  if (!existsSync(dir)) return { pngs: [], specPath: join(dir, "editables", "spec.json"),
    hasSpec: false, hasDiagnostics: false };
  const names = (await readdir(dir)).filter((name) => name.toLowerCase().endsWith(".png")).sort();
  const pngs = [];
  for (const name of names) pngs.push({ name, sha: sha12(await readFile(join(dir, name))) });
  const specPath = join(dir, "editables", "spec.json");
  return { pngs, specPath, hasSpec: existsSync(specPath),
    hasDiagnostics: existsSync(join(dir, "diagnostics.json")) };
}

/** Stage 12: transitions are READ and the comment is printed; nothing is posted (D4). */
async function readTransitions(baseUrl, key) {
  const pair = `${process.env[ENV_EMAIL]}:${process.env[ENV_API_TOKEN]}`;
  const response = await fetch(`${baseUrl}${TRANSITIONS_PATH.replace("{key}", key)}`, {
    headers: { Authorization: `Basic ${Buffer.from(pair, "utf-8").toString("base64")}`,
      Accept: "application/json" },
  });
  // Status only: Jira answers in the operator's Atlassian locale (G-JIRA-1).
  if (!response.ok) throw new Error(`transitions read for ${key} failed: HTTP ${response.status}`);
  return ((await response.json()).transitions ?? []).map((item) => `${item.id}:${item.name}`);
}

const printCriteria = (verdicts) => CRITERIA.forEach(([id, label]) =>
  console.log(`[verdict] ${id} ${label}: ${verdicts[id] ?? "not measured"}`));

// --- Entry point ---

async function run(flags, verdicts) {
  const suindara = resolve(flags.suindara), brandPath = resolve(flags.brand);
  const outDir = resolve(flags.out), folderId = flags["drive-folder"];
  // The match step scans the template repos as siblings of the one it was handed, which is
  // the layout render.mjs itself assumes (its `resolve('..', 'suindara-tmpl-' + id)`).
  const templatesRoot = dirname(resolve(flags.template));
  const baseUrl = process.env[ENV_BASE_URL];
  console.log(`[probe] node ${process.version} on ${process.platform}; `
    + `drive scopes under test: ${DRIVE_SCOPES.join(" + ")}`);

  const jira = new JiraGateway({ baseUrl, email: process.env[ENV_EMAIL],
    apiToken: process.env[ENV_API_TOKEN],
    mainJql: `key = ${flags.key}` }); // unused by fetchIssueByKey; construction demands one
  await jira.verifyCredentials();
  const issue = await jira.fetchIssueByKey(flags.key);
  console.log(`[jira] ${issue.key} vertical_raw="${issue.vertical_raw}" `
    + `copy_source=${issue.copy_source} copy_url=${issue.copy_url ?? "none"}`);
  if (!issue.copy_url) {
    console.error("[jira] no copy_url — verdict NO-BRIEF");
    throw new VerdictStop("NO-BRIEF");
  }
  const target = parseDriveUrl(issue.copy_url);
  console.log(`[url] kind=${target.kind} id=${target.id || "none"}`);
  if (target.kind !== "doc" && target.kind !== "binary") {
    console.error(`[url] a ${target.kind} link is not a readable brief — verdict NO-BRIEF`);
    throw new VerdictStop("NO-BRIEF");
  }

  const auth = await authorize({ paths: defaultCredentialPaths() });
  const files = createGoogleDriveFilesApi(auth), drive = new DriveGateway({ files });
  const { mimeType } = await files.getItem(target.id);
  console.log(`[drive] mimeType=${mimeType}`);
  const raw = await readBrief(drive, auth, target.id, mimeType);
  verdicts.S1 = `PASS (${mimeType} under ${DRIVE_SCOPES.join(" + ")})`;

  const norm = normalizeBrief(raw);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, "brief.txt"), norm.text, "utf8");
  const lines = norm.text.split("\n");
  console.log(`[norm] bom=${norm.bom} crlf=${norm.crlf} nbsp=${norm.nbsp} lines=${lines.length} `
    + `bytes=${Buffer.byteLength(norm.text)} sha256=${sha12(norm.text)}`);
  console.log(`[norm] firstLine="${lines[0].slice(0, FIRST_LINE_MAX)}"`);
  console.log(`[norm] strongSignalMatches=${(norm.text.match(STRONG_SIGNAL) ?? []).length}`);

  const context = { brief: norm.text, summary: issue.summary, labels: [] };
  const rows = (await loadManifests(templatesRoot)).map((entry) => scoreTemplate(entry, context));
  for (const row of rows) {
    console.log(`[match] ${row.id} strong=${row.strong} medium=${row.medium} weak=${row.weak} `
      + `status=${row.status} -> ${row.decision}`);
    for (const hit of row.hits) console.log(`[match]   hit ${hit}`);
  }
  const chosen = pickTemplate(rows);
  verdicts.S2 = chosen ? `PASS (${chosen.id}: ${chosen.decision})` : "PASS (manual: none applies)";
  if (!chosen) {
    // The expected pass-1 outcome (D9), not an error: a plain return leaves the exit code
    // at 0, and `main` prints the criteria on every path.
    console.log("[match] no template applies; stopping before render (D9 pass 1)");
    return;
  }
  // The chosen manifest wins over --template, so spec.template and the served folder can
  // never disagree; --template anchors the scan and names the expected default.
  console.log(`[match] chosen=${chosen.id} dir=${chosen.dir}`);

  const brandId = basename(brandPath, ".json"), specPath = join(outDir, "spec.json");
  await writeFile(specPath, JSON.stringify(buildSpec(chosen, issue, norm.text, brandId), null, 2));
  console.log(`[render] spec=${specPath} template=${chosen.id} brand=${brandId} task=${issue.key}`);
  const packageDir = join(outDir, PACKAGE_DIR);
  const args = renderArgs(specPath, chosen.dir, brandPath, packageDir, flags.force);
  const exit = await runRender(suindara, args);
  console.log(`[render] exit=${exit}`);
  const pkg = await inspectPackage(packageDir);
  console.log(`[pkg] pngs=${pkg.pngs.length} editables/spec.json=${yn(pkg.hasSpec)} `
    + `diagnostics.json=${yn(pkg.hasDiagnostics)}`);
  for (const png of pkg.pngs) console.log(`[pkg] ${png.name} sha256=${png.sha}`);
  const rendered = exit === 0 && pkg.pngs.length > 0 && pkg.hasSpec;
  verdicts.S3 = rendered ? `PASS (${pkg.pngs.length} pngs)`
    : `FAIL (exit=${exit}, pngs=${pkg.pngs.length}, editables/spec.json=${yn(pkg.hasSpec)})`;
  if (!rendered) throw new VerdictStop("RENDER-FAILED");

  const recheckDir = join(outDir, RERENDER_DIR);
  const again = renderArgs(pkg.specPath, chosen.dir, brandPath, recheckDir, flags.force);
  const againExit = await runRender(suindara, again);
  console.log(`[render] exit=${againExit} (re-render for D5)`);
  if (againExit !== 0) {
    // Read from the code that reported it, not inferred from a missing directory: an
    // aborted re-render and a hash mismatch are different answers.
    verdicts.S4 = `FAIL (re-render exited ${againExit})`;
    throw new VerdictStop("RE-RENDER-FAILED");
  }
  const recheck = await inspectPackage(recheckDir);
  const identical = pkg.pngs.filter((png, index) => recheck.pngs[index]?.name === png.name
    && recheck.pngs[index]?.sha === png.sha).length;
  console.log(`[det] ${identical}/${pkg.pngs.length} identical; re-render produced ${recheck.pngs.length}`);
  // Counting by index over the FIRST package cannot see a re-render that added frames, and
  // `agenda-semana` derives its frame count from measured pagination — exactly the quantity
  // that drifts between runs. Equal counts are part of "identical", not a separate nicety.
  verdicts.S4 = recheck.pngs.length === pkg.pngs.length && identical === pkg.pngs.length
    ? "PASS"
    : `FAIL (${identical}/${pkg.pngs.length} matched, re-render produced ${recheck.pngs.length})`;

  const uploads = [...pkg.pngs.map((png) => join(packageDir, png.name)), pkg.specPath];
  for (const file of uploads) {
    const uploaded = await drive.uploadFile(folderId, basename(file), file);
    console.log(`[upload] ${basename(file)} -> ${uploaded.id}`);
  }
  // Computed, never created: the folder-tree walk is ship's policy, in a later brief.
  const segments = derivePath({ key: issue.key, summary: issue.summary, campaign: null,
    vertical_raw: issue.vertical_raw, entrega_iso: issue.entrega_iso,
    jira_updated_at: issue.jira_updated_at });
  console.log(`[upload] derivePath=${segments.join("/")}`);
  verdicts.S5 = `PASS (${uploads.length} files)`;

  console.log(`[jira-close] transitions=${(await readTransitions(baseUrl, issue.key)).join(", ")}`);
  console.log(`[jira-close] would-comment: `
    + WOULD_COMMENT.replace("{n}", uploads.length).replace("{folder}", folderId));
  printCriteria(verdicts);
}

/**
 * The criteria table prints on every path, including the failing ones. The measurements
 * this probe produces are expensive — S1 alone costs a browser consent round-trip — and a
 * late throw discarding the stages that already succeeded is the worst outcome available:
 * the operator would re-run the whole chain to recover a number they had already paid for.
 *
 * `process.exitCode` rather than `process.exit()` throughout: the latter does not wait for
 * asynchronous stderr to drain, and stderr is asynchronous whenever it is a pipe or a file
 * rather than a TTY. The run instructions ask the operator to paste this output, which
 * invites a redirect — and the lines most likely to be lost are the verdicts.
 */
async function main() {
  const verdicts = {};
  let started = false;
  try {
    const flags = parseFlags(process.argv.slice(2));
    started = true;
    await run(flags, verdicts);
  } catch (error) {
    // A VerdictStop already printed its own verdict; anything else is a genuine failure.
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
