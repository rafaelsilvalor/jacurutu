// Composition root for the `start` run (brief 032): pull one Jira task by key,
// derive its workspace folder, scaffold the D-A structure, apply a template
// (unless --blank), and write the v2 `.saci.json` manifest. Local-only — Drive
// round-trip is `ship`'s job (D1). All fs/network lives here; path derivation
// and manifest assembly stay pure in @saci/core (R25).
//
// The gateway is injected as a FACTORY (`makeGateway`, shared with run-fetch) so
// this function carries no credentials and is unit-testable with a fake. The
// clock is a single injectable `now` so the `start` history entry is
// deterministic in tests.
//
// Fail-loud, no partial scaffold (D2/D5, constraint 4): every validation that
// can fail — the live fetch, the collision check, and (when not --blank) the
// template-source resolution — runs BEFORE any filesystem mutation. A failure
// throws and nothing is written; cli.ts maps the throw to a non-zero exit.

import { copyFile, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  derivePath,
  serializeManifest,
  TASK_MANIFEST_SCHEMA_VERSION,
  type DerivePathInput,
  type Issue,
  type TaskManifest,
} from "@saci/core";
import type { IssueDropLog, IssueWarningLog } from "@saci/adapter-jira";

import type { MakeGateway } from "./run-fetch.js";

/** Default templates root leaf: a `templates/` sibling of the workspace root (P1). */
const TEMPLATES_DIR_NAME = "templates";
/** Manifest filename written at the leaf-folder root (brief 031, D-A). */
const MANIFEST_FILENAME = ".saci.json";
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
    "  - rename it manually and re-run `saci start`.",
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

/** P2: copy the template into `editaveis/`, renamed to the leaf stem + the source's extension. */
async function copyTemplate(source: string, editablePath: string, leaf: string): Promise<string> {
  const target = path.join(editablePath, `${leaf}${path.extname(source)}`);
  await copyFile(source, target);
  return target;
}

/**
 * Assemble the v2 manifest (brief 035, D7): Jira-born, so `jiraKey` is set,
 * `localKey` is null, and history opens with a single `start` entry
 * (`actor: null` until identity config exists). Pure — no I/O (R25). The leaf
 * is `<KEY>_<slug>` or `<KEY>` alone (derivePath empty-slug case), so the slug
 * is a deterministic slice; `template` is the source basename sans extension,
 * or the blank sentinel on --blank.
 */
function buildManifest(
  issue: Issue,
  segments: readonly string[],
  leaf: string,
  templateSource: string | null,
  now: Date,
): TaskManifest {
  const slug = leaf === issue.key ? "" : leaf.slice(issue.key.length + 1);
  const template = templateSource
    ? path.basename(templateSource, path.extname(templateSource))
    : BLANK_TEMPLATE_ID;
  return {
    schemaVersion: TASK_MANIFEST_SCHEMA_VERSION,
    jiraKey: issue.key,
    localKey: null,
    vertical: segments[1],
    slug,
    template,
    drivePath: segments,
    history: [{ event: "start", actor: null, at: now.toISOString() }],
  };
}

/**
 * Run `start`: fetch the issue, derive its folder, validate (collision +
 * template source) fully before any write, then scaffold, copy the template,
 * and write the manifest. Returns the created paths for the display layer.
 */
export async function runStart(
  makeGateway: MakeGateway,
  key: string,
  workspaceRoot: string,
  templatesRoot: string | undefined,
  blank: boolean,
  now: Date = new Date(),
): Promise<StartRunResult> {
  const gateway = makeGateway(dropLogSink, warningLogSink);
  const issue = await gateway.fetchIssueByKey(key);

  const segments = derivePath(toDerivePathInput(issue));
  const vertical = segments[1];
  const leaf = segments[3];

  const absWorkspaceRoot = path.resolve(workspaceRoot);
  const leafFolder = path.join(absWorkspaceRoot, ...segments);
  const editablePath = path.join(leafFolder, EDITAVEIS_DIR);

  // Validate everything that can fail BEFORE any mutation (constraint 4).
  if (await pathExists(leafFolder)) {
    throw new Error(await buildCollisionReport(leafFolder));
  }
  const templateSource = blank
    ? null
    : await resolveTemplateSource(resolveTemplatesRoot(templatesRoot, absWorkspaceRoot), vertical);

  // Only now mutate the filesystem.
  await scaffoldDirs(leafFolder, editablePath);
  const copiedFile = templateSource ? await copyTemplate(templateSource, editablePath, leaf) : null;

  const manifest = buildManifest(issue, segments, leaf, templateSource, now);
  await writeFile(path.join(leafFolder, MANIFEST_FILENAME), serializeManifest(manifest), "utf8");

  return { folderPath: leafFolder, editablePath, copiedFile };
}
