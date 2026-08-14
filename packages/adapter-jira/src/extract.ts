// Jira-shape-coupled extraction: the ADF (Atlassian Document Format) tree-walk
// and the defensive custom-field reads. Ported behavior-preserving from
// automation/fetch.py (frozen seed): adf_extract_urls, adf_extract_drive_urls,
// adf_extract_text, extract_urls_from_comments, safe_get_entrega,
// safe_get_vertical. ADF nodes arrive as untyped Jira wire data, so they are
// `unknown` and narrowed at each step (R24 — no `any`). One exception to the
// behavior-preserving port: adfExtractText, which diverged on 2026-08-14 for
// the reason its own doc comment states.

// Google Drive/Docs URL pattern. Same pattern as the seed's DRIVE_URL_RE; the
// `g` flag supports finditer-style scanning of raw text, and `match` semantics
// (anchored at index 0) are reproduced explicitly below (R7).
const DRIVE_URL_RE = /https?:\/\/(?:drive\.google\.com|docs\.google\.com)\/[^\s)>"\]]+/gi;

// ADF node types whose URL lives at `attrs.url` (seed: inlineCard/blockCard/
// embedCard/mediaSingle). Named for R7 and to keep the walker readable.
const URL_ATTR_NODE_TYPES: ReadonlySet<string> = new Set([
  "inlineCard",
  "blockCard",
  "embedCard",
  "mediaSingle",
]);

// Markdown-ish suffix separators stripped from a captured URL (seed clean-up
// against trailing `)`, `]`, `>`, `"`). Order matches the seed.
const URL_SUFFIX_SEPARATORS: readonly string[] = [")", "]", ">", '"'];

// ADF block-level node types: each one ends a line in the plain-text
// projection. Measured 2026-08-12 — with every node joined by a space instead,
// a line-anchored marker regex counted 1 however many frames the source
// carried (F6, docs/explorations/jira-copy-locality.md).
const BLOCK_NODE_TYPES: ReadonlySet<string> = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "codeBlock",
  "listItem",
  "panel",
  "tableCell",
  "tableHeader",
  "rule",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * True when `url` is a Drive/Docs URL anchored at its start. Mirrors the seed's
 * `DRIVE_URL_RE.match(url)` (Python `match` anchors at index 0).
 */
function isDriveUrl(url: string): boolean {
  // Fresh regex per call: the shared `g`-flagged RE carries `lastIndex` state.
  return new RegExp(DRIVE_URL_RE.source, "i").test(url) && url.search(/https?:\/\//i) === 0;
}

/**
 * Recursive ADF tree-walk. Yields every URL found in attr-bearing card nodes,
 * in text `link` marks, and as raw Drive/Docs URLs inside text. Permissive by
 * design — Drive/Docs filtering is the caller's job (seed: adf_extract_urls).
 */
export function adfExtractUrls(node: unknown): string[] {
  if (!isRecord(node)) {
    return [];
  }

  const out: string[] = [];
  const nodeType = asString(node.type);

  if (URL_ATTR_NODE_TYPES.has(nodeType)) {
    const attrs = isRecord(node.attrs) ? node.attrs : {};
    const url = attrs.url;
    if (typeof url === "string" && url) {
      out.push(url);
    }
  }

  if (nodeType === "text") {
    const text = asString(node.text);
    const marks = Array.isArray(node.marks) ? node.marks : [];
    for (const mark of marks) {
      if (isRecord(mark) && mark.type === "link") {
        const markAttrs = isRecord(mark.attrs) ? mark.attrs : {};
        const href = markAttrs.href;
        if (typeof href === "string" && href) {
          out.push(href);
        }
      }
    }
    // Raw Drive/Docs URLs in the text body (seed: DRIVE_URL_RE.finditer).
    const scanner = new RegExp(DRIVE_URL_RE.source, "gi");
    for (const m of text.matchAll(scanner)) {
      out.push(m[0]);
    }
  }

  const content = Array.isArray(node.content) ? node.content : [];
  for (const child of content) {
    out.push(...adfExtractUrls(child));
  }

  return out;
}

/**
 * Drive/Docs-only URLs from an ADF node, in appearance order, deduplicated.
 * Strips markdown-style trailing suffixes before dedup (seed:
 * adf_extract_drive_urls).
 */
export function adfExtractDriveUrls(node: unknown): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of adfExtractUrls(node)) {
    if (!isDriveUrl(url)) {
      continue;
    }
    let clean = url;
    for (const sep of URL_SUFFIX_SEPARATORS) {
      clean = clean.split(sep)[0];
    }
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      out.push(clean);
    }
  }
  return out;
}

/**
 * A node's text, with one line break after every block node and in place of
 * every `hardBreak`. Breaks are emitted unconditionally; the runs that nesting
 * produces (`listItem > paragraph`) are collapsed downstream.
 */
function walkText(node: unknown): string {
  if (!isRecord(node)) {
    return "";
  }
  const nodeType = asString(node.type);
  if (nodeType === "text") {
    return asString(node.text);
  }
  if (nodeType === "hardBreak") {
    return "\n";
  }
  const content = Array.isArray(node.content) ? node.content : [];
  let out = "";
  for (const child of content) {
    out += walkText(child);
  }
  return BLOCK_NODE_TYPES.has(nodeType) ? `${out}\n` : out;
}

/** Trimmed non-empty lines, joined by one break. Collapses nesting's runs. */
function normalizeLines(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line)
    .join("\n");
}

/**
 * Plain-text projection of an ADF tree: block nodes end a line, inline runs
 * concatenate with nothing between them, and no line carries surrounding
 * whitespace.
 *
 * Diverges from the seed's `adf_extract_text` deliberately. The seed joins
 * every text node with a space, which drops the source's line structure and
 * inserts a space wherever a mark splits a phrase in two.
 */
export function adfExtractText(node: unknown): string {
  return normalizeLines(walkText(node));
}

/**
 * Drive/Docs URLs from the Jira `comment` field, in order, deduplicated. The
 * field may be an object with `.comments[]` or a bare list (seed:
 * extract_urls_from_comments).
 */
export function extractUrlsFromComments(commentsField: unknown): string[] {
  if (!commentsField) {
    return [];
  }

  let comments: unknown[];
  if (isRecord(commentsField)) {
    comments = Array.isArray(commentsField.comments) ? commentsField.comments : [];
  } else if (Array.isArray(commentsField)) {
    comments = commentsField;
  } else {
    return [];
  }

  const seen = new Set<string>();
  const urls: string[] = [];
  for (const c of comments) {
    const body = isRecord(c) ? c.body : null;
    for (const url of adfExtractDriveUrls(body)) {
      if (!seen.has(url)) {
        seen.add(url);
        urls.push(url);
      }
    }
  }
  return urls;
}

/**
 * Read the delivery datetime from an ordered list of candidate custom fields.
 * Iterates `candidates` in order and returns the first truthy value together
 * with the field id it came from, or `[null, null]` when none is present
 * (seed: safe_get_entrega). Field ids are injected (D1) — they are not
 * hardcoded here; the candidate order encodes primary-then-fallback intent.
 */
export function safeGetEntrega(
  fields: Record<string, unknown>,
  candidates: readonly string[],
): [string | null, string | null] {
  for (const srcId of candidates) {
    const value = fields[srcId];
    if (value) {
      return [asString(value), srcId];
    }
  }
  return [null, null];
}

/**
 * Defensive read of the vertical tag from a custom field. Handles the array
 * shape (`[{ value }]`), the bare object shape (`{ value }`), and absence
 * (seed: safe_get_vertical). Field id is injected (D1).
 */
export function safeGetVertical(
  fields: Record<string, unknown>,
  verticalFieldId: string,
): string | null {
  const raw = fields[verticalFieldId];
  if (!raw) {
    return null;
  }
  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0];
    if (isRecord(first)) {
      const value = first.value;
      return typeof value === "string" ? value : null;
    }
  }
  if (isRecord(raw)) {
    const value = raw.value;
    return typeof value === "string" ? value : null;
  }
  return null;
}
