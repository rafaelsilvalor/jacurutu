// Pure folder-segment derivation for a design task's workspace.
// No I/O, no clock, no network, no Jira field-id literal (R25, D1).
// Consumes already-resolved semantic fields (D5), never the raw Jira shape.

import { normalizeText, parseVertical, parseEntrega } from "./transform.js";

/** Grouping bucket when a task has no campaign (alpha: always this). */
export const AVULSAS_BUCKET = "AVULSAS";

/** Leaf slug length cap (sanitized summary). */
export const SLUG_MAX_LEN = 60;

/** Month segment format: year-month, time discarded. */
export const MONTH_FORMAT = "YYYY-MM";

/** Length of the `YYYY-MM` prefix to slice off a `YYYY-MM-DD` date (`MONTH_FORMAT`). */
export const MONTH_SLICE_LEN = 7;

/**
 * Stable sentinel for the vertical segment when `vertical_raw` is null/empty/
 * whitespace (parseVertical → ""). Guarantees a non-empty segment, parallel to
 * `UNDATED_MONTH`. Live MCA tasks are universally bracketed (Pause-1 check), so
 * this is a defensive-only path.
 */
export const UNKNOWN_VERTICAL = "unknown-vertical";

/**
 * Stable sentinel for the month segment when neither the delivery date nor the
 * fallback timestamp yields a parseable month. Never a clock read — the
 * function must stay total and deterministic (FINDING 2 determinism guard).
 */
export const UNDATED_MONTH = "undated";

/**
 * Resolved, purpose-built input for `derivePath` (D5). Field names mirror the
 * `Issue` payload so a caller maps trivially, but `campaign` lives here — not
 * on the shared `Issue` — because no source populates it yet (A3 / D5).
 */
export interface DerivePathInput {
  /** Jira issue key (e.g. `"MCA-101"`). Guarantees leaf uniqueness across siblings. */
  readonly key: string;
  /** Issue summary; sanitized into the leaf slug (D4). */
  readonly summary: string;
  /** Raw vertical tag in `[CODE] Name` form (e.g. `"[EC] Concursos"`) (FINDING 1). */
  readonly vertical_raw: string;
  /** Delivery datetime (Jira ISO) or `null`; primary month source (D3). */
  readonly entrega_iso: string | null;
  /** Jira `updated` timestamp; month fallback when `entrega_iso` is absent (FINDING 2). */
  readonly jira_updated_at: string;
  /**
   * Task start timestamp (the manifest's `start` history entry); third month
   * source, tried after `jira_updated_at` and before `UNDATED_MONTH` (brief
   * 035, D6). Optional: absent or unparseable falls through to the sentinel,
   * so Jira-born callers need not supply it.
   */
  readonly started_at?: string | null;
  /** Campaign grouping; `null` across alpha → the `AVULSAS_BUCKET` (D3 / D5). */
  readonly campaign: string | null;
}

/**
 * Derive the relative workspace folder-path segments for a resolved task,
 * from the semester root downward (D2): `[grouping, vertical, YYYY-MM, leaf]`.
 *
 * Pure and total: same input → same output; never throws, never reads a clock,
 * never performs I/O, never emits an empty segment. Callers join the result
 * against the local root and the Drive root with `path.join` (R1, root-agnostic).
 */
export function derivePath(input: DerivePathInput): readonly string[] {
  const grouping = input.campaign ?? AVULSAS_BUCKET;
  // parseVertical returns "" for null/empty/whitespace and the verbatim raw for
  // a no-bracket value; the sentinel guards the empty case (never sanitize the
  // vertical — D4 scopes sanitization to the leaf, and re-detecting brackets
  // here would duplicate transform.ts, anti-A3).
  const vertical = parseVertical(input.vertical_raw) || UNKNOWN_VERTICAL;
  const month = deriveMonth(input.entrega_iso, input.jira_updated_at, input.started_at ?? null);
  const leaf = deriveLeaf(input.key, input.summary);
  return [grouping, vertical, month, leaf];
}

/**
 * Month segment as `YYYY-MM`. Tries the delivery date first, then the Jira
 * fallback timestamp, then the task start timestamp (D6); all unparseable
 * yields the `UNDATED_MONTH` sentinel (FINDING 2).
 */
function deriveMonth(
  entregaIso: string | null,
  fallbackIso: string,
  startedAt: string | null,
): string {
  const primary = monthFromIso(entregaIso);
  if (primary) {
    return primary;
  }
  const fallback = monthFromIso(fallbackIso);
  if (fallback) {
    return fallback;
  }
  const started = monthFromIso(startedAt);
  if (started) {
    return started;
  }
  return UNDATED_MONTH;
}

/** Extract `YYYY-MM` from an ISO datetime via `parseEntrega`, or `null`. */
function monthFromIso(iso: string | null): string | null {
  const [datePart] = parseEntrega(iso);
  if (!datePart) {
    return null;
  }
  // parseEntrega guarantees a valid YYYY-MM-DD; the leading MONTH_SLICE_LEN
  // chars are the YYYY-MM prefix (MONTH_FORMAT).
  return datePart.slice(0, MONTH_SLICE_LEN);
}

/**
 * Leaf segment `<KEY>_<slug>`. When the sanitized slug is empty (a summary of
 * only symbols/diacritics that reduce away), the leaf is `KEY` alone — never a
 * trailing `_`, never an empty segment (D4 empty-slug fallback).
 */
function deriveLeaf(key: string, summary: string): string {
  const slug = sanitizeSlug(summary);
  return slug ? `${key}_${slug}` : key;
}

/**
 * Sanitize a summary into a slug (D4): lowercase, strip diacritics, replace any
 * char outside `[a-z0-9-]` with a hyphen, collapse repeats, trim ends, cap length.
 */
function sanitizeSlug(summary: string): string {
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
