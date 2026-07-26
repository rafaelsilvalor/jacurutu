// Pure editable file-name derivation (brief 042): the shared slug sanitizer
// (promoted from derive-path.ts, D6) and the stem builder for the copied
// editable in editaveis/. No I/O, no `path`, no clock (R25); the composition
// root appends the source extension.

import { normalizeText } from "./transform.js";

/** Slug length cap (sanitized summary); moved here with its only consumer (D6). */
export const SLUG_MAX_LEN = 60;

/** Field separator in the editable stem (D2); `sanitizeSlug` never emits it. */
const STEM_SEPARATOR = "_";

/**
 * Resolved input for `buildEditableStem` (D2). Callers pass already-derived
 * semantic fields — never the raw Jira shape.
 */
export interface EditableStemInput {
  /** Parsed vertical code (derivePath `segments[1]`); lowercased only, never sanitized. */
  readonly vertical: string;
  /** Display key (e.g. `"MCA-63821"`, `"RAF-1"`); lowercased. */
  readonly key: string;
  /** Issue summary / local title; sanitized into the descricao segment. */
  readonly summary: string;
  /** Optional variation label (`--variation`); sanitized; absent/empty → segment omitted (D3). */
  readonly variation?: string;
}

/**
 * Sanitize a summary into a slug (030 D4): lowercase, strip diacritics, replace
 * any char outside `[a-z0-9-]` with a hyphen, collapse repeats, trim ends, cap
 * length. Shared by `derivePath`'s leaf and the editable stem (042 D6), so the
 * descricao segment always equals the leaf slug for the same summary.
 */
export function sanitizeSlug(summary: string): string {
  // Reuse core's normalizeText (lowercase + diacritic strip) rather than
  // re-implementing D4 steps 1-2 here (anti-A3). It uses NFKD, a superset of
  // D4's NFD: both drop the combining marks D4 targets, so the choice is a
  // deliberate reuse, not a divergence.
  let slug = normalizeText(summary);
  slug = slug.replace(/[^a-z0-9-]+/g, "-");
  slug = slug.replace(/-+/g, "-");
  slug = slug.replace(/^-+|-+$/g, "");
  if (slug.length > SLUG_MAX_LEN) {
    slug = slug.slice(0, SLUG_MAX_LEN).replace(/-+$/g, "");
  }
  return slug;
}

/**
 * Build the copied editable's file stem (D2):
 * `vertical_key_descricao[_variacao]`, all lowercase, `_` between fields,
 * `-` within fields. Empty segments are dropped, so no doubled or trailing
 * separators ever — `sanitizeSlug` never emits `_` or uppercase, making `_`
 * an unambiguous field separator. The `UNKNOWN_VERTICAL` sentinel is already
 * lowercase and passes through unchanged.
 */
export function buildEditableStem(input: EditableStemInput): string {
  const segments = [
    input.vertical.toLowerCase(),
    input.key.toLowerCase(),
    sanitizeSlug(input.summary),
    sanitizeSlug(input.variation ?? ""),
  ];
  return segments.filter((segment) => segment !== "").join(STEM_SEPARATOR);
}
