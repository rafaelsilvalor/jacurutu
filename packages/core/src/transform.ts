// Pure transform functions: slug, time parse, vertical parse, URL extraction.
// No I/O. Ported from automation/lib_transform.py (frozen Python seed).

export const STOPWORDS_SLUG: ReadonlySet<string> = new Set([
  "criativo", "criativos", "clone", "artes", "tarefas", "avulsas",
  "performance", "parte", "concurso", "edital", "prefeitura",
  "de", "do", "da", "dos", "das", "para", "com", "por", "em",
  "remarketing", "copy", "design",
]);

// Matches the generic MC parent summary "Criativos Estáticos | Performance - Parte XXX".
const MC_PARENT_GENERIC_RE = /^\s*criativos\s+est[aá]ticos\s*\|\s*performance\s*-\s*parte\s+\d+/i;

// Portuguese weekday names, used to strip weekdays from a slug base.
const DAYS_PT_RE = /\b(segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo)\b/gi;

/** Lowercase + strip diacritics (NFKD, drop combining marks). */
export function normalizeText(s: string): string {
  if (!s) {
    return "";
  }
  let out = s.toLowerCase();
  out = out.normalize("NFKD");
  // Strip Unicode combining marks (the diacritics separated by NFKD).
  out = out.replace(/\p{M}/gu, "");
  return out;
}

/**
 * Build the nomeCurto (3-5 tokens) from the parent summary.
 * Falls back to childSummary when the parent is generic or empty.
 */
export function slugNomeCurto(parentSummary: string, childSummary = ""): string {
  let base = parentSummary || "";

  // Generic MC parent ("Criativos Estáticos | Performance - Parte XXX") → use the child.
  if (!base.trim() || MC_PARENT_GENERIC_RE.test(base)) {
    base = childSummary || base;
    // Remove the common CLONE prefix.
    base = base.replace(
      /^clone\s*-\s*artes\s*-\s*criativos\s+est[aá]ticos\s*\|\s*performance\s*-\s*concurso\s+/i,
      "",
    );
  }

  // Remove [...], (...).
  base = base.replace(/\[[^\]]*\]/g, " ");
  base = base.replace(/\([^)]*\)/g, " ");
  // Remove dates dd/mm and times HHh.
  base = base.replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g, " ");
  base = base.replace(/\b\d{1,2}h(?:\d{2})?\b/gi, " ");
  // Remove weekdays.
  base = base.replace(DAYS_PT_RE, " ");

  // Normalize.
  base = normalizeText(base);
  // Replace non-alphanumerics with hyphens.
  base = base.replace(/[^a-z0-9]+/g, "-");

  const parts = base.split("-");
  let tokens = parts.filter((t) => t.length > 1 && !STOPWORDS_SLUG.has(t));
  if (tokens.length === 0) {
    tokens = parts.filter((t) => t.length > 1);
  }

  let joined = tokens.slice(0, 5).join("-");
  if (joined.length > 50) {
    joined = joined.slice(0, 50).replace(/-+$/, "");
  }
  return joined || "demanda";
}

/** customfield value like "[EC] Concursos" — extract the bracketed content. */
export function parseVertical(raw: string | null): string {
  if (!raw) {
    return "";
  }
  const m = /^\s*\[([^\]]+)\]/.exec(raw);
  return m ? m[1].trim() : raw.trim();
}

// Drive/Docs URL matcher.
const URL_DRIVE_RE = /https?:\/\/(?:drive\.google\.com|docs\.google\.com)\/[^\s)>"']+/i;

/**
 * Parse an ISO datetime (e.g. "2026-05-13T19:30:00.000-0300" or "2026-05-13").
 * Returns [date YYYY-MM-DD, formatted time].
 * Time: "19h" when minutes are zero, "19h30" when minutes are non-zero,
 * "" when there is no time component (or midnight, treated as no specific time).
 *
 * Hand-rolled and dependency-free: the wall-clock components are read straight
 * from the ISO string. Using `new Date()` would reinterpret the offset and
 * shift the hour/date away from the source's local wall-clock value.
 */
export function parseEntrega(isoDt: string | null): [string | null, string] {
  if (!isoDt) {
    return [null, ""];
  }

  // Date-only (no T) → return without a time.
  if (!isoDt.includes("T")) {
    const datePart = isoDt.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart) && isValidYmd(datePart)) {
      return [datePart, ""];
    }
    return [null, ""];
  }

  // Full ISO. Normalize Z → +00:00 and +HHMM → +HH:MM, then read wall-clock parts.
  let s = isoDt.replace("Z", "+00:00");
  s = s.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");

  // Match YYYY-MM-DDTHH:MM(:SS(.fff)?)?(offset)? — read the local wall-clock fields.
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?/.exec(s);
  if (!m) {
    return [null, ""];
  }
  const year = m[1];
  const month = m[2];
  const day = m[3];
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  const dateStr = `${year}-${month}-${day}`;
  if (!isValidYmd(dateStr)) {
    return [null, ""];
  }

  let timeStr: string;
  if (hour === 0 && minute === 0) {
    timeStr = ""; // midnight normally means "no specific time"
  } else if (minute === 0) {
    timeStr = `${hour}h`;
  } else {
    timeStr = `${hour}h${String(minute).padStart(2, "0")}`;
  }

  return [dateStr, timeStr];
}

/** Validate a YYYY-MM-DD string's calendar components (mirrors Python strptime rejection). */
function isValidYmd(dateStr: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) {
    return false;
  }
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1) {
    return false;
  }
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth;
}

/** Extract the first Drive/Docs URL from text. Strips markdown/punctuation suffixes. */
export function extractFirstDriveUrl(text: string): string | null {
  if (!text) {
    return null;
  }
  const m = URL_DRIVE_RE.exec(text);
  if (!m) {
    return null;
  }
  let url = m[0];
  // Strip markdown suffixes.
  url = url.split(/[\])>"']/)[0];
  // Trim trailing punctuation.
  url = url.replace(/[.,;]+$/, "");
  return url;
}

// Additional stopwords for sibling-summary pairing (copy Rule 1).
export const STOPWORDS_PAIRING: ReadonlySet<string> = new Set([
  ...STOPWORDS_SLUG,
  "estatico", "estaticos", "estática", "estáticos",
]);

/** Tokenize for sibling pairing: normalize, drop stopwords and tokens of length ≤ 2. */
export function tokensForPairing(s: string): Set<string> {
  let norm = normalizeText(s);
  norm = norm.replace(/[^a-z0-9]+/g, " ");
  const result = new Set<string>();
  for (const t of norm.split(" ")) {
    if (t.length > 2 && !STOPWORDS_PAIRING.has(t)) {
      result.add(t);
    }
  }
  return result;
}
