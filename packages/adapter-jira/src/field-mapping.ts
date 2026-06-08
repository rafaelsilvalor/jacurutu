// The D1 configurability seam, materialized. This is the ONLY adapter module
// that carries Jira `customfield_*` wire ids and the JQL/filter policy strings.
// Every other module (extract.ts, mapper.ts, navigation.ts, gateway.ts, http.ts)
// stays literal-free and receives these values by injection at construction.
// Keeping them here means the Phase-3 editable-mapping feature is additive: swap
// this default for user config without reopening core (R25) or touching the
// extraction/navigation code.
//
// The named `FieldMapping` type stays DEFERRED (A3/R19 — one adapter, one case).
// `DefaultFieldMapping` below is a value with an inferred shape that structurally
// satisfies the mapper's inline `FieldMappingConfig` parameter; it is not a
// public exported type.

/**
 * Default field-meaning -> Jira custom-field id mapping. Mirrors the seed's
 * `safe_get_entrega` (primary `customfield_10031`, fallback `customfield_11080`)
 * and `safe_get_vertical` (`customfield_10065`). Injected into the mapper at
 * gateway construction; never read directly by extract.ts/mapper.ts.
 */
export const DEFAULT_FIELD_MAPPING = {
  entregaPrimary: "customfield_10031",
  entregaFallback: "customfield_11080",
  vertical: "customfield_10065",
} as const;

/**
 * Default `fields` list requested from the main design search. Verbatim from the
 * seed's `JIRA_FIELDS` (R7 — named policy constant). The trailing
 * `customfield_11035` / `customfield_10067` are requested by the seed though not
 * consumed by the mapper; carried over to preserve the wire request shape.
 */
export const DEFAULT_DESIGN_FIELDS: readonly string[] = [
  "summary",
  "status",
  "parent",
  "updated",
  "customfield_10031",
  "customfield_10065",
  "customfield_11080",
  "customfield_11035",
  "customfield_10067",
];

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
