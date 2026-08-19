// Composition root for the payload export (brief 023, the run-fetch.ts
// precedent). Reads a payload.json and a JSON export config from disk,
// resolves a named profile, projects each issue via the pure core projection,
// applies the profile's filters and column selection, and writes the .csv /
// .json output. All I/O lives here, never in core (R25 / D9). No credentials,
// no network: the function is fixture-testable end to end.
//
// The projection half now lives in profile-projection.ts, because `jacurutu report`
// runs the same pipeline into a spreadsheet instead of a file. What remains here
// is the file half: format dispatch, the two serializers, and the output path.

import { writeFile } from "node:fs/promises";
import path from "node:path";

import { projectProfile, type CsvOptions } from "./profile-projection.js";

// The three config types moved with the pipeline they describe. Re-exported so
// this module's public type surface is what it was before the extraction —
// a caller cannot tell the move happened (R14).
export type { CsvOptions, ExportConfig, ExportProfile } from "./profile-projection.js";

/** Default CSV delimiter — pt-BR Excel expects ";" (D4). */
const DEFAULT_CSV_DELIMITER = ";";
/** BOM is on by default so pt-BR Excel detects UTF-8 (D4). */
const DEFAULT_CSV_INCLUDE_BOM = true;
/** UTF-8 byte order mark prepended when `includeBom` is on. */
const CSV_BOM = "\uFEFF";
/** RFC 4180 record terminator. */
const CSV_LINE_TERMINATOR = "\r\n";
/** JSON serialization indent, mirroring the run-fetch precedent. */
const JSON_INDENT = 2;

/** Run summary returned to the caller. */
export interface ExportRunResult {
  outputPath: string;
  format: "csv" | "json";
  rowCount: number;
}

// RFC 4180 quoting: quote a field containing the delimiter, a quote, CR, or
// LF; double inner quotes. Everything else passes through verbatim.
function csvField(value: string, delimiter: string): string {
  const needsQuoting =
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes("\r") ||
    value.includes("\n");
  if (!needsQuoting) {
    return value;
  }
  return `"${value.replace(/"/g, '""')}"`;
}

function toCsv(headers: string[], rows: string[][], options?: CsvOptions): string {
  const delimiter = options?.delimiter ?? DEFAULT_CSV_DELIMITER;
  const includeBom = options?.includeBom ?? DEFAULT_CSV_INCLUDE_BOM;
  const body = [headers, ...rows]
    .map(
      (cells) =>
        cells.map((cell) => csvField(cell, delimiter)).join(delimiter) + CSV_LINE_TERMINATOR,
    )
    .join("");
  return includeBom ? CSV_BOM + body : body;
}

// JSON output: array of objects keyed by the OUTPUT header (post-rename), in
// profile column order. indent=2, no trailing newline (run-fetch precedent).
function toJson(headers: string[], rows: string[][]): string {
  const objects = rows.map((row) =>
    Object.fromEntries(headers.map((header, i) => [header, row[i]])),
  );
  return JSON.stringify(objects, null, JSON_INDENT);
}

/**
 * Run the export: project the named profile, write the output file, and return
 * a summary. The profile lookup (in profile-projection.ts) and the format
 * dispatch both fail loudly — a typo'd config must never silently produce an
 * empty or mis-formatted export.
 */
export async function runExport(
  payloadPath: string,
  configPath: string,
  profileName: string,
): Promise<ExportRunResult> {
  const { profile, selection } = await projectProfile(payloadPath, configPath, profileName);
  const { headers, rows } = selection;

  let content: string;
  if (profile.format === "csv") {
    content = toCsv(headers, rows, profile.csv);
  } else if (profile.format === "json") {
    content = toJson(headers, rows);
  } else {
    // The config file is untrusted input: a format outside v1 (D4) fails loudly.
    throw new Error(`Unknown export format: "${String(profile.format)}" (profile "${profileName}")`);
  }

  // Relative output paths resolve against the CONFIG file's directory, so a
  // config and its outputs travel together regardless of the process cwd.
  const outputPath = path.resolve(path.dirname(configPath), profile.output);
  await writeFile(outputPath, content, "utf8");

  return { outputPath, format: profile.format, rowCount: rows.length };
}
