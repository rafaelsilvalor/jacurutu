// Composition-root config loader for the per-project input field mapping (029,
// D6). Lives in cli, NOT the adapter: the on-disk override shape and the
// project-selection policy are composition concerns, while the adapter owns the
// resolved shape and the customfield ids it validates (R25 / D6). The loader
// reads the `--field-config` file, selects the `--project` entry, fails loud on
// an unknown key (mirroring runExport's unknown-profile throw, naming key +
// path), and normalizes the single-`entrega` override into the adapter's
// `ResolvedFieldMapping` (a 1-element candidate list — D3, "no fallback").

import { readFile } from "node:fs/promises";

import type { ResolvedFieldMapping } from "@jacurutu/adapter-jira";

/**
 * One project's override entry on disk (D1 override shape): a SINGLE `entrega`
 * field id and a `vertical` field id. No fallback list — within-project variance
 * is not modeled speculatively (D2/A3). Normalized to `ResolvedFieldMapping` by
 * the loader below.
 */
export interface ProjectFieldConfig {
  entrega: string;
  vertical: string;
}

/** The `--field-config` file root: project KEY -> override entry (D6). */
export interface FieldConfigFile {
  projects: Record<string, ProjectFieldConfig>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Narrow the parsed JSON from `unknown` (R24 — no `any`) into the one project
// entry we need: both ids must be strings or the config is malformed.
function asProjectFieldConfig(value: unknown): ProjectFieldConfig | null {
  if (!isRecord(value)) {
    return null;
  }
  const { entrega, vertical } = value;
  if (typeof entrega !== "string" || typeof vertical !== "string") {
    return null;
  }
  return { entrega, vertical };
}

/**
 * Load the override field mapping for `project` from the JSON file at
 * `configPath`. Reads + parses the file, selects `projects[project]`, and
 * normalizes the single-`entrega` override to a 1-element `entregaCandidates`
 * list (D3 — faithfully "no fallback"). An unknown project key throws naming the
 * key + path (R4, runExport precedent). A malformed/absent entry throws too:
 * config is untrusted input and must fail loud, never degrade silently.
 */
export async function loadFieldMapping(
  configPath: string,
  project: string,
): Promise<ResolvedFieldMapping> {
  const parsed: unknown = JSON.parse(await readFile(configPath, "utf8"));
  const projects = isRecord(parsed) ? parsed.projects : undefined;
  const entry = isRecord(projects) ? projects[project] : undefined;

  const override = asProjectFieldConfig(entry);
  if (!override) {
    throw new Error(`Unknown project: "${project}" (${configPath})`);
  }

  return { entregaCandidates: [override.entrega], vertical: override.vertical };
}
