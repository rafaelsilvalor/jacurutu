// Composition root for the `start` run (brief 032): pull one Jira task by key,
// derive its workspace folder, scaffold the D-A structure, apply a template
// (unless --blank), and write the v2 `.jacurutu.json` manifest. Local-only — Drive
// round-trip is `ship`'s job (D1). All fs/network lives here; path derivation
// and manifest assembly stay pure in @jacurutu/core (R25).
//
// The gateway is injected as a FACTORY (`makeGateway`, shared with run-fetch) so
// this function carries no credentials and is unit-testable with a fake. The
// clock is a single injectable `now` so the `start` history entry is
// deterministic in tests.
//
// Fail-loud, no partial scaffold (D2/D5, constraint 4): every validation that
// can fail — the credential pre-flight, the live fetch, the collision check,
// and (when not --blank) the template-source resolution — runs BEFORE any
// filesystem mutation. A failure throws and nothing is written; cli.ts maps the
// throw to a non-zero exit.
//
// `runStartLocal` (brief 036) is the keyless sibling: it mints `<prefix>-<seq>`
// from the identity file instead of fetching Jira — fully offline, no gateway —
// and feeds the same validate/execute pipeline. The sequence counter persists
// between the two stages (P2): after every validation, before the first
// workspace write, so a crash burns a number (gap, accepted) but never reuses one.

import { copyFile, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildEditableStem,
  derivePath,
  serializeManifest,
  TASK_MANIFEST_SCHEMA_VERSION,
  type DerivePathInput,
  type Issue,
  type TaskManifest,
} from "@jacurutu/core";
import type { IssueDropLog, IssueWarningLog } from "@jacurutu/adapter-jira";

import { readIdentityState, writeIdentityState } from "./identity.js";
import type { MakeGateway } from "./run-fetch.js";

/** Default templates root leaf: a `templates/` sibling of the workspace root (P1). */
const TEMPLATES_DIR_NAME = "templates";
/** Manifest filename written at the leaf-folder root (brief 031, D-A). */
const MANIFEST_FILENAME = ".jacurutu.json";
/** Editable-work subdir under the leaf folder (D-A). */
const EDITAVEIS_DIR = "editaveis";
/** Assets subdir under `editaveis/` (D-A). */
const ASSETS_DIR = "assets";
/** Template identifier recorded in the manifest on the --blank path (D4). */
const BLANK_TEMPLATE_ID = "blank";

/** What a successful `start` produced; cli.ts renders it, tests assert on it. */
export interface StartRunResult {
  /** Absolute path to the created leaf folder. */
  folderPath: string;
  /** Absolute path to the `editaveis/` subdir (the editable lives here). */
  editablePath: string;
  /** Absolute path to the copied template, or `null` on the --blank path. */
  copiedFile: string | null;
  /** The minted local key on the --local path (D12); `null` when Jira-born. */
  localKey: string | null;
}

/** Options for `runStartLocal` (D13): one object — eight positionals would bury the call sites. */
export interface StartLocalOptions {
  /** Resolved identity-file path (cli.ts owns the P1 default/env resolution). */
  identityFilePath: string;
  vertical: string;
  title: string;
  /** ISO delivery date; already format-validated by the parser (amended D11). */
  due?: string;
  workspaceRoot: string;
  templatesRoot?: string;
  /** Optional variation label for the editable file name (042 D3); sanitized in core. */
  variation?: string;
  blank: boolean;
  now?: Date;
}

/**
 * `start` does not serialize drops/warnings (only fetch assembles a payload), so
 * the sinks forward to stderr rather than capturing. R4: nothing is swallowed —
 * an unexpected drop/warning during the single-key lookup is still surfaced.
 */
const dropLogSink: IssueDropLog = (key, reason) => {
  console.error(`dropped ${key}: ${reason}`);
};
const warningLogSink: IssueWarningLog = (key, field, cause) => {
  console.error(`warning ${key}.${field}: ${cause}`);
};

/** Map the fetched `Issue` to `derivePath`'s resolved input; campaign is alpha-null (D5). */
function toDerivePathInput(issue: Issue): DerivePathInput {
  return {
    key: issue.key,
    summary: issue.summary,
    vertical_raw: issue.vertical_raw,
    entrega_iso: issue.entrega_iso,
    jira_updated_at: issue.jira_updated_at,
    campaign: null,
  };
}

/** True if `target` exists. An unexpected stat error is rethrown, never swallowed (R4). */
async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

/**
 * Build the D5 collision report: state whether the existing folder carries a
 * manifest and/or an `editaveis/`, then list the two non-destructive options.
 * `start` never overwrites and never prompts.
 */
async function buildCollisionReport(leafFolder: string): Promise<string> {
  const hasManifest = await pathExists(path.join(leafFolder, MANIFEST_FILENAME));
  const hasEditaveis = await pathExists(path.join(leafFolder, EDITAVEIS_DIR));
  return [
    `Refusing to scaffold: ${leafFolder} already exists.`,
    `  - ${MANIFEST_FILENAME}: ${hasManifest ? "present" : "absent"}`,
    `  - ${EDITAVEIS_DIR}/: ${hasEditaveis ? "present" : "absent"}`,
    "Options:",
    "  - keep working in the existing folder, or",
    "  - rename it manually and re-run `jacurutu start`.",
  ].join("\n");
}

/** P1: the flag wins; else default to a `templates/` sibling of the resolved workspace root. */
function resolveTemplatesRoot(templatesRoot: string | undefined, absWorkspaceRoot: string): string {
  return templatesRoot ?? path.join(path.dirname(absWorkspaceRoot), TEMPLATES_DIR_NAME);
}

/**
 * P4: resolve the vertical's default template — exactly one regular file directly
 * in `<templatesRoot>/<vertical>`. A missing dir, zero, or many files fails loud
 * naming the resolved path and what was found, before any scaffold is written.
 */
async function resolveTemplateSource(templatesRoot: string, vertical: string): Promise<string> {
  const sourceDir = path.join(templatesRoot, vertical);
  let files: string[];
  try {
    const entries = await readdir(sourceDir, { withFileTypes: true });
    files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  } catch (error) {
    if (error instanceof Error && (error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`No template directory at ${sourceDir} (create it, or pass --blank).`);
    }
    throw error;
  }
  if (files.length !== 1) {
    throw new Error(`Expected exactly one template file in ${sourceDir}, found ${files.length}.`);
  }
  return path.join(sourceDir, files[0]);
}

/** Create the leaf folder, `editaveis/`, and `editaveis/assets/` (D-A). */
async function scaffoldDirs(leafFolder: string, editablePath: string): Promise<void> {
  await mkdir(editablePath, { recursive: true });
  await mkdir(path.join(editablePath, ASSETS_DIR), { recursive: true });
}

/** Copy the template into `editaveis/`, renamed to the editable stem (042 D2) + the source's extension. */
async function copyTemplate(source: string, editablePath: string, stem: string): Promise<string> {
  const target = path.join(editablePath, `${stem}${path.extname(source)}`);
  await copyFile(source, target);
  return target;
}

/** The jiraKey/localKey pair stamped into the manifest (D13); exactly one is non-null today. */
interface ManifestKeys {
  jiraKey: string | null;
  localKey: string | null;
}

/** What `validateScaffold` resolved; `executeScaffold` consumes it verbatim. */
interface ScaffoldPlan {
  leafFolder: string;
  editablePath: string;
  templateSource: string | null;
  leaf: string;
}

/**
 * Assemble the v2 manifest (brief 035 D7, parameterized in 036 D13). History
 * opens with a single `start` entry (`actor: null` until identity config
 * exists — the identity file carries a prefix, not an actor name). Pure — no
 * I/O (R25). The leaf is `<displayKey>_<slug>` or `<displayKey>` alone
 * (derivePath empty-slug case), so the slug is a deterministic slice;
 * `template` is the source basename sans extension, or the blank sentinel.
 */
function buildManifest(
  keys: ManifestKeys,
  displayKey: string,
  segments: readonly string[],
  leaf: string,
  templateSource: string | null,
  now: Date,
): TaskManifest {
  const slug = leaf === displayKey ? "" : leaf.slice(displayKey.length + 1);
  const template = templateSource
    ? path.basename(templateSource, path.extname(templateSource))
    : BLANK_TEMPLATE_ID;
  return {
    schemaVersion: TASK_MANIFEST_SCHEMA_VERSION,
    jiraKey: keys.jiraKey,
    localKey: keys.localKey,
    vertical: segments[1],
    slug,
    template,
    drivePath: segments,
    history: [{ event: "start", actor: null, at: now.toISOString() }],
  };
}

/**
 * Shared pre-mutation stage (D13, constraint 5): resolve the target paths, run
 * the collision check, and (unless --blank) resolve the template source. Every
 * failure throws here, before anything is written. Split from executeScaffold
 * so the local path can persist its sequence counter between the two (P2).
 */
async function validateScaffold(
  segments: readonly string[],
  workspaceRoot: string,
  templatesRoot: string | undefined,
  blank: boolean,
): Promise<ScaffoldPlan> {
  const vertical = segments[1];
  const leaf = segments[3];
  const absWorkspaceRoot = path.resolve(workspaceRoot);
  const leafFolder = path.join(absWorkspaceRoot, ...segments);
  const editablePath = path.join(leafFolder, EDITAVEIS_DIR);

  if (await pathExists(leafFolder)) {
    throw new Error(await buildCollisionReport(leafFolder));
  }
  const templateSource = blank
    ? null
    : await resolveTemplateSource(resolveTemplatesRoot(templatesRoot, absWorkspaceRoot), vertical);

  return { leafFolder, editablePath, templateSource, leaf };
}

/**
 * Shared mutation stage (D13): create the dirs, copy the template (unless
 * blank), write the manifest. No validation lives here — validateScaffold
 * already ran (constraint 5).
 */
async function executeScaffold(
  plan: ScaffoldPlan,
  keys: ManifestKeys,
  displayKey: string,
  segments: readonly string[],
  editableStem: string,
  now: Date,
): Promise<StartRunResult> {
  await scaffoldDirs(plan.leafFolder, plan.editablePath);
  const copiedFile = plan.templateSource
    ? await copyTemplate(plan.templateSource, plan.editablePath, editableStem)
    : null;

  const manifest = buildManifest(keys, displayKey, segments, plan.leaf, plan.templateSource, now);
  await writeFile(path.join(plan.leafFolder, MANIFEST_FILENAME), serializeManifest(manifest), "utf8");

  return {
    folderPath: plan.leafFolder,
    editablePath: plan.editablePath,
    copiedFile,
    localKey: keys.localKey,
  };
}

/**
 * Run `start`: verify the credential, fetch the issue, derive its folder,
 * validate (collision + template source) fully before any write, then scaffold,
 * copy the template, and write the manifest. Returns the created paths for the
 * display layer.
 */
export async function runStart(
  makeGateway: MakeGateway,
  key: string,
  workspaceRoot: string,
  templatesRoot: string | undefined,
  blank: boolean,
  variation: string | undefined,
  now: Date = new Date(),
): Promise<StartRunResult> {
  const gateway = makeGateway(dropLogSink, warningLogSink);
  // Pre-flight before the single-key lookup: a bad token answers that lookup
  // with "issue not found", which names the wrong cause. No try — a rejected
  // credential propagates unwrapped to main()'s catch, same as run-fetch.
  await gateway.verifyCredentials();
  const issue = await gateway.fetchIssueByKey(key);

  const segments = derivePath(toDerivePathInput(issue));
  const plan = await validateScaffold(segments, workspaceRoot, templatesRoot, blank);
  // 042 D2: the copied editable is named from semantic fields, not the leaf
  // stem — the folder and the file intentionally differ (D5).
  const stem = buildEditableStem({
    vertical: segments[1],
    key: issue.key,
    summary: issue.summary,
    variation,
  });
  return executeScaffold(plan, { jiraKey: issue.key, localKey: null }, issue.key, segments, stem, now);
}

/**
 * Run `start --local` (brief 036): mint `<prefix>-<seq>` from the identity
 * file and scaffold offline through the same pipeline — no gateway, no env, no
 * network (constraint 4). P2 ordering: read identity → derive → validate →
 * persist `nextSeq + 1` → mutate. A crash after the persist burns a sequence
 * number (gap, accepted per 035-D2); a validation failure before it consumes
 * nothing; numbers are never reused.
 */
export async function runStartLocal(options: StartLocalOptions): Promise<StartRunResult> {
  const now = options.now ?? new Date();
  const identity = await readIdentityState(options.identityFilePath);
  const localKey = `${identity.prefix}-${identity.nextSeq}`;

  const segments = derivePath({
    key: localKey,
    summary: options.title,
    vertical_raw: options.vertical,
    entrega_iso: options.due ?? null,
    // "" is an absence sentinel, not a value: DerivePathInput types
    // jira_updated_at as a non-nullable string and core is out of scope in
    // this brief (D9). An empty string yields no month, so absent --due falls
    // through to the started_at month (the 035 third source).
    jira_updated_at: "",
    started_at: now.toISOString(),
    campaign: null,
  });

  const plan = await validateScaffold(
    segments,
    options.workspaceRoot,
    options.templatesRoot,
    options.blank,
  );

  // P2: burn the number only after every validation passed, before the first
  // workspace write.
  await writeIdentityState(options.identityFilePath, {
    prefix: identity.prefix,
    nextSeq: identity.nextSeq + 1,
  });

  // 042 D2: same semantic naming as the Jira-born route, keyed off the minted key.
  const stem = buildEditableStem({
    vertical: segments[1],
    key: localKey,
    summary: options.title,
    variation: options.variation,
  });
  return executeScaffold(plan, { jiraKey: null, localKey }, localKey, segments, stem, now);
}
