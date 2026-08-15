// The projection half of the export pipeline, extracted from run-export.ts so that
// `saci export` and `saci report` run the same one: read a payload.json and a JSON
// export config from disk, resolve a named profile, project every issue through the
// pure core projection, apply the profile's filters, and select its columns.
//
// The sharing is the point (D2). A report and a CSV of the same profile cannot drift
// in column selection or order when there is one pipeline instead of two. What stays
// in run-export.ts is everything downstream of the selection — the format dispatch,
// the CSV/JSON serializers, and the output path — none of which a report has, because
// a report's destination is a spreadsheet rather than a file.
//
// All I/O lives here, never in core (R25 / D9). No credentials, no network: every
// decision in this module is fixture-testable.

import { readFile } from "node:fs/promises";

import {
  applyColumns,
  matchesFilters,
  projectIssue,
  type ColumnSelection,
  type ColumnSpec,
  type ExportContext,
  type ExportFilters,
  type Payload,
} from "@saci/core";

/** Per-profile CSV options (D4). Defaults: delimiter ";", BOM on. */
export interface CsvOptions {
  delimiter?: string;
  includeBom?: boolean;
}

/** One named export profile (D3): selection / order / rename only. */
export interface ExportProfile {
  format: "csv" | "json";
  columns: ColumnSpec[];
  filters?: ExportFilters;
  csv?: CsvOptions;
  /** Stable output path, overwritten each run; relative paths resolve against the config file's directory. */
  output: string;
}

/** Export config root (D3): provenance fields live outside the profiles. */
export interface ExportConfig {
  /** Operator label stamped on every row; `""` when absent (D8). */
  operator?: string;
  /** Jira base URL injected into the projection; URL columns are `""` when absent (D2). */
  jiraBaseUrl?: string;
  profiles: Record<string, ExportProfile>;
}

/**
 * What the shared pipeline hands back. `selection` is what both commands write;
 * `profile` is returned because `export` still needs `format`, `csv` and `output`
 * from it. A report reads neither of those three — it consumes `columns` and
 * `filters`, both already applied here.
 */
export interface ProfileProjection {
  profile: ExportProfile;
  selection: ColumnSelection;
}

/**
 * Read the payload and the config, resolve the named profile, and project it. The
 * profile lookup fails loudly naming the config path (R4): a typo'd profile name must
 * never silently produce an empty export, and — now that a second command shares this
 * path — must never silently produce an empty report either.
 */
export async function projectProfile(
  payloadPath: string,
  configPath: string,
  profileName: string,
): Promise<ProfileProjection> {
  const payload = JSON.parse(await readFile(payloadPath, "utf8")) as Payload;
  const config = JSON.parse(await readFile(configPath, "utf8")) as ExportConfig;

  const profile = config.profiles?.[profileName];
  if (!profile) {
    throw new Error(`Unknown export profile: "${profileName}" (${configPath})`);
  }

  const context: ExportContext = {
    operator: config.operator ?? "",
    runDate: payload.run_date,
    generatedAt: payload.generated_at,
    jiraBaseUrl: config.jiraBaseUrl,
  };

  const records = payload.issues
    .map((issue) => projectIssue(issue, context))
    .filter((record) => matchesFilters(record, profile.filters));

  return { profile, selection: applyColumns(records, profile.columns) };
}
