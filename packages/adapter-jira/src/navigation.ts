// Jira-shape-coupled copy navigation. Ported behavior-preserving from
// automation/fetch.py (frozen seed): the navigation halves of best_sister_match
// and resolve_copy. The shape-independent decisions — token-overlap argmax and
// sister/parent/fallback precedence — are delegated to @saci/core policy
// (R25 — policy lives in core, the adapter only adapts data shape). No scoring
// or precedence logic is re-implemented here.

import {
  summaryTokens,
  bestMatchByTokenOverlap,
  pickCopy,
  type CopySource,
} from "@saci/core";

import { adfExtractDriveUrls, extractUrlsFromComments } from "./extract.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** A raw Jira issue as it arrives on the wire: an untyped `fields` bag. */
type JiraIssue = Record<string, unknown>;

function issueFields(issue: unknown): Record<string, unknown> {
  if (!isRecord(issue)) {
    return {};
  }
  return isRecord(issue.fields) ? issue.fields : {};
}

function issueSummary(issue: unknown): string {
  return asString(issueFields(issue).summary);
}

/**
 * Pick the sister copywriter issue with the highest summary token overlap
 * against the design issue. Navigation half of the seed's best_sister_match:
 * it builds the `{ id, tokens }[]` candidate list (id = list index, so the
 * winner maps back to the candidate issue) and delegates the argmax to core
 * `bestMatchByTokenOverlap`. Returns the matched candidate, or `null` when none
 * overlaps (or the candidate list is empty). The single-candidate direct pick
 * and the zero-overlap → `null` rule are core's, not duplicated here.
 */
export function bestSisterMatch(
  designIssue: unknown,
  candidates: readonly JiraIssue[],
): JiraIssue | null {
  if (candidates.length === 0) {
    return null;
  }

  const targetTokens = summaryTokens(issueSummary(designIssue));
  const candidateTokens = candidates.map((candidate, index) => ({
    id: String(index),
    tokens: summaryTokens(issueSummary(candidate)),
  }));

  const winnerId = bestMatchByTokenOverlap(targetTokens, candidateTokens);
  if (winnerId === null) {
    return null;
  }
  return candidates[Number(winnerId)];
}

/**
 * Resolve a design issue's copy URL by sister → parent → fallback precedence.
 * Navigation half of the seed's resolve_copy: it extracts the candidate Drive
 * URL lists (sister description, then sister comments; parent description) and
 * delegates the precedence decision to core `pickCopy`. Building both lists and
 * passing them to `pickCopy` preserves the seed's fall-through — a sister that
 * matches but yields no URL falls through to the parent.
 */
export function resolveCopy(
  designIssue: unknown,
  sistersByParent: ReadonlyMap<string, readonly JiraIssue[]>,
  parentsByKey: ReadonlyMap<string, JiraIssue>,
): { url: string | null; source: CopySource } {
  const fields = issueFields(designIssue);
  const parent = isRecord(fields.parent) ? fields.parent : {};
  const parentKey = asString(parent.key);

  let sisterUrls: string[] = [];
  if (parentKey && sistersByParent.has(parentKey)) {
    const candidates = sistersByParent.get(parentKey) ?? [];
    const sister = bestSisterMatch(designIssue, candidates);
    if (sister) {
      const sisterFields = issueFields(sister);
      sisterUrls = adfExtractDriveUrls(sisterFields.description);
      if (sisterUrls.length === 0) {
        sisterUrls = extractUrlsFromComments(sisterFields.comment);
      }
    }
  }

  let parentUrls: string[] = [];
  if (parentKey && parentsByKey.has(parentKey)) {
    const parentIssue = parentsByKey.get(parentKey);
    parentUrls = adfExtractDriveUrls(issueFields(parentIssue).description);
  }

  return pickCopy({ sisterUrls, parentUrls });
}
