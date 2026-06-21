// The D1 configurability seam, materialized. This is the ONLY adapter module
// that carries Jira `customfield_*` wire ids and the JQL/filter policy strings.
// Every other module (extract.ts, mapper.ts, navigation.ts, gateway.ts, http.ts)
// stays literal-free and receives these values by injection at construction.
// Keeping them here means the Phase-3 editable-mapping feature is additive: swap
// this default for user config without reopening core (R25) or touching the
// extraction/navigation code.
//
// The default mapping and the resolved mapping share ONE shape:
// `{ entregaCandidates: readonly string[]; vertical: string }` (D1/D3). The
// per-project OVERRIDE config on disk is a different, single-`entrega` shape;
// the composition root normalizes it into this resolved shape (D3). The named
// `FieldMapping` type stays DEFERRED (A3/R19 — one adapter, one case).

/**
 * The single resolved field mapping consumed by the mapper and extract (D3).
 * `entregaCandidates` is an ordered candidate list resolved first-non-null;
 * `vertical` is a single custom-field id. The default below has this shape, and
 * an override `{ entrega, vertical }` is normalized to a 1-element candidate
 * list at the composition root.
 */
export interface ResolvedFieldMapping {
  entregaCandidates: readonly string[];
  vertical: string;
}

/**
 * Default field-meaning -> Jira custom-field id mapping (the D1 unconfigured
 * path). The ordered `entregaCandidates` reproduce the seed's
 * `safe_get_entrega` primary `customfield_10031` -> fallback `customfield_11080`
 * as first-non-null; `vertical` mirrors `safe_get_vertical` (`customfield_10065`).
 * Injected into the mapper at gateway construction; never read directly by
 * extract.ts/mapper.ts.
 */
export const DEFAULT_FIELD_MAPPING = {
  entregaCandidates: ["customfield_10031", "customfield_11080"],
  vertical: "customfield_10065",
} as const;

/**
 * Native Jira fields the design search always needs regardless of mapping (R7 —
 * named policy constant): `summary` for the summary + Template filter, `status`
 * for the status filter, `parent` for parent key / grouping / Template, and
 * `updated` for `jira_updated_at`. Mapped custom-field ids are unioned on top by
 * `deriveDesignFields` (D5).
 */
export const MANDATORY_DESIGN_FIELDS = ["summary", "status", "parent", "updated"] as const;

/**
 * Derive the `fields` list requested from the main design search (D5):
 * `MANDATORY_DESIGN_FIELDS ∪ entregaCandidates ∪ [vertical]`, deduplicated and
 * in that order. This intentionally drops the dead `customfield_11035` /
 * `customfield_10067` that the seed requested but the mapper never consumed —
 * narrowing the wire request without changing the produced payload.
 */
export function deriveDesignFields(mapping: ResolvedFieldMapping): string[] {
  return [...new Set([...MANDATORY_DESIGN_FIELDS, ...mapping.entregaCandidates, mapping.vertical])];
}

/** `fields` list for the sister (COPYWRITER) search. Verbatim from the seed. */
export const SISTER_FIELDS: readonly string[] = [
  "summary",
  "parent",
  "description",
  "comment",
];

/** `fields` list for the parent search. Verbatim from the seed. */
export const PARENT_FIELDS: readonly string[] = ["summary", "description"];

/** Jira issuetype for the copywriter sister search (seed: `issuetype = COPYWRITER`). */
export const COPYWRITER_ISSUETYPE = "COPYWRITER";

/**
 * Marker substring that excludes an issue when present (case-insensitively) in
 * its own summary or its parent summary (seed: `"template" in ... .lower()`).
 */
export const TEMPLATE_MARKER = "template";

/**
 * Status names that exclude a design issue from the payload (seed:
 * `cfg.get("filtered_statuses", ["Backlog"])`). Default mirrors the seed default.
 */
export const FILTERED_STATUSES: ReadonlySet<string> = new Set(["Backlog"]);

/** Default page size cap for a single search request (seed: `min(max_results, 100)`). */
export const DEFAULT_MAX_RESULTS = 200;
