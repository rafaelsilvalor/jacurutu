// Pure copy-resolution and token policy. No I/O, no Jira/ADF shape navigation.
// Ported from automation/fetch.py (frozen Python seed): tokenize_summary,
// the scoring core of best_sister_match, and the precedence of resolve_copy.

import type { CopySource } from "./types.js";

// Stopwords for token-overlap between design and copywriter summaries.
// Ported verbatim from fetch.py STOPWORDS_PT (order preserved).
export const STOPWORDS_PT: ReadonlySet<string> = new Set([
  "a", "o", "as", "os", "um", "uma", "uns", "umas",
  "de", "do", "da", "dos", "das",
  "em", "no", "na", "nos", "nas",
  "e", "ou", "mas", "que", "se",
  "para", "por", "com", "sem", "sobre", "sob",
  "sua", "seu", "suas", "seus", "ele", "ela", "eles", "elas",
  "este", "esta", "isto", "esse", "essa", "isso", "aquele", "aquela", "aquilo",
  "ao", "aos", "à", "às",
  "-", "|", "–", "—", ":", ";", "(", ")", "[", "]",
  // very generic domain tokens
  "arte", "artes", "card", "lamina", "laminas", "design",
]);

/**
 * Tokenize a summary for overlap scoring. Lowercases, splits on `\w` runs
 * (Unicode), drops STOPWORDS_PT and tokens of length ≤ 1. Does not strip
 * diacritics — mirrors the Python `tokenize_summary` exactly.
 */
export function summaryTokens(s: string): Set<string> {
  if (!s) {
    return new Set<string>();
  }
  const matches = s.toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? [];
  const result = new Set<string>();
  for (const t of matches) {
    if (!STOPWORDS_PT.has(t) && t.length > 1) {
      result.add(t);
    }
  }
  return result;
}

/**
 * Pick the candidate with the highest token overlap against the target.
 * A single candidate wins directly. Returns `null` when no candidate shares
 * a token (best overlap is 0). The scoring/argmax core of best_sister_match,
 * decoupled from Jira navigation: it takes plain token sets, never a dict.
 */
export function bestMatchByTokenOverlap(
  targetTokens: Set<string>,
  candidates: { id: string; tokens: Set<string> }[],
): string | null {
  if (candidates.length === 0) {
    return null;
  }
  if (candidates.length === 1) {
    return candidates[0].id;
  }

  let best: string | null = null;
  let bestScore = 0;
  for (const c of candidates) {
    let score = 0;
    for (const t of c.tokens) {
      if (targetTokens.has(t)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = c.id;
    }
  }

  return bestScore > 0 ? best : null;
}

/**
 * Resolve a copy URL by sister → parent → fallback precedence. Takes plain
 * URL lists (already extracted by the adapter); performs no ADF navigation.
 * The shape-independent half of resolve_copy.
 */
export function pickCopy({
  sisterUrls,
  parentUrls,
}: {
  sisterUrls: string[];
  parentUrls: string[];
}): { url: string | null; source: CopySource } {
  if (sisterUrls.length > 0) {
    return { url: sisterUrls[0], source: "sister" };
  }
  if (parentUrls.length > 0) {
    return { url: parentUrls[0], source: "parent" };
  }
  return { url: null, source: "fallback" };
}
