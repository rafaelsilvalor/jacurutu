// Payload v2.0 envelope assembler. Pure, no I/O. Closes the D3 half deferred by
// brief 020: `fetchIssues` returns `Issue[]`; the drop/warning decisions are
// captured by the composition root and handed here to be serialized into the
// full `Payload`. Behavior-preserving against the frozen seed
// (automation/fetch.py "Montar payload", automation/payload.json): top-level key
// order is schema_version, run_date, generated_at, issues, filtered_out,
// warnings; `schema_version` is "2.0"; inputs pass through unmodified.

import type { FilteredOut, Issue, Payload, PayloadWarning } from "./payload.js";

/** Payload schema version stamped on every assembled envelope (seed `SCHEMA_VERSION`). */
export const SCHEMA_VERSION = "2.0";

/** Run-time stamps for the envelope, supplied by the composition root. */
export interface PayloadMeta {
  /** Run date (`YYYY-MM-DD`), the seed's `now.date().isoformat()`. */
  runDate: string;
  /** Generation timestamp (ISO-8601 with offset), the seed's `now.isoformat(timespec="seconds")`. */
  generatedAt: string;
}

/**
 * Assemble the full payload-v2.0 envelope from the kept issues plus the captured
 * drop/warning arrays and the run-time stamps. Pure: it constructs and returns a
 * `Payload`, performing no filtering, sorting, or mutation of the inputs — order
 * and element identity are preserved. `schema_version` is fixed to
 * `SCHEMA_VERSION`; `run_date` / `generated_at` come straight from `meta`.
 */
export function assemblePayload(
  issues: Issue[],
  filteredOut: FilteredOut[],
  warnings: PayloadWarning[],
  meta: PayloadMeta,
): Payload {
  return {
    schema_version: SCHEMA_VERSION,
    run_date: meta.runDate,
    generated_at: meta.generatedAt,
    issues,
    filtered_out: filteredOut,
    warnings,
  };
}
