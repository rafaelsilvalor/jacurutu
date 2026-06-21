// Jira-shape-coupled issue mapper. Ported behavior-preserving from
// automation/fetch.py (frozen seed): build_issue_entry. Turns a raw Jira issue
// into a payload-v2.0 `Issue`. This is the D1 seam: the field-meaning -> Jira
// custom-field id mapping is INJECTED at the call site (no customfield_* literal
// lives here). The shape-independent copy precedence is delegated to core via
// the navigation layer (resolveCopy -> core pickCopy), never re-implemented.
//
// Graceful-failure contract (D3, R4 — no silent catch): a keyless issue is
// dropped (returns null); a per-field extraction failure does NOT abort the
// entry — the field falls back to its default and the failure is LOGGED through
// the injected logger. The seed's `warnings` array is DEFERRED (D3), so the
// problem is logged, not serialized.

import type { Issue } from "@saci/core";

import { safeGetEntrega, safeGetVertical } from "./extract.js";
import type { ResolvedFieldMapping } from "./field-mapping.js";
import { resolveCopy } from "./navigation.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** A raw Jira issue as it arrives on the wire: an untyped `fields` bag. */
type JiraIssue = Record<string, unknown>;

/**
 * Per-issue partial-failure sink. Receives the issue key, the field that failed,
 * and a human-readable cause (mirrors the seed's `warnings.append({key, field,
 * issue})` payload, but logged rather than serialized — D3, R4). Defaults to a
 * console warning so callers that do not inject one still surface the failure.
 */
export type IssueWarningLog = (key: string, field: string, cause: string) => void;

const defaultWarningLog: IssueWarningLog = (key, field, cause) => {
  console.warn(`[adapter-jira] issue ${key}: ${field} warning: ${cause}`);
};

function errorCause(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Build one payload-v2.0 `Issue` from a raw Jira issue. Behavior-preserving
 * port of the seed's `build_issue_entry`:
 * - A keyless issue is non-processable -> returns `null` (dropped upstream).
 * - `summary`/`parent_key`/`parent_summary`/`status_jira`/`vertical_raw`/
 *   `jira_updated_at` follow the seed's `... or ""` defaults (non-null strings).
 * - `entrega_iso` and `copy_url` stay bare nullable (`string | null`).
 * - A missing parent and per-field extraction failures are LOGGED (D3, R4),
 *   not serialized into a warnings array; the entry is still returned.
 */
export function buildIssueEntry(
  issue: unknown,
  sistersByParent: ReadonlyMap<string, readonly JiraIssue[]>,
  parentsByKey: ReadonlyMap<string, JiraIssue>,
  fieldMapping: ResolvedFieldMapping,
  warningLog: IssueWarningLog = defaultWarningLog,
): Issue | null {
  const issueRecord = isRecord(issue) ? issue : {};
  const key = asString(issueRecord.key);
  if (!key) {
    return null;
  }

  const fields = isRecord(issueRecord.fields) ? issueRecord.fields : {};
  const summary = asString(fields.summary);

  const parent = isRecord(fields.parent) ? fields.parent : {};
  const parentKey = asString(parent.key);
  const parentFields = isRecord(parent.fields) ? parent.fields : {};
  const parentSummary = asString(parentFields.summary);
  if (!parentKey) {
    warningLog(key, "parent_key", "issue has no parent");
  }

  const statusObj = isRecord(fields.status) ? fields.status : {};
  const statusJira = asString(statusObj.name);

  let verticalRaw: string | null;
  try {
    verticalRaw = safeGetVertical(fields, fieldMapping.vertical);
  } catch (error) {
    verticalRaw = null;
    warningLog(key, "vertical_raw", errorCause(error));
  }

  let entregaIso: string | null;
  try {
    // The seed discards the source-field id (`_src`); only the value is kept.
    [entregaIso] = safeGetEntrega(fields, fieldMapping.entregaCandidates);
  } catch (error) {
    entregaIso = null;
    warningLog(key, "entrega_iso", errorCause(error));
  }

  let copyUrl: string | null;
  let copySource: Issue["copy_source"];
  try {
    const resolved = resolveCopy(issue, sistersByParent, parentsByKey);
    copyUrl = resolved.url;
    copySource = resolved.source;
  } catch (error) {
    copyUrl = null;
    copySource = "fallback";
    warningLog(key, "copy_url", errorCause(error));
  }

  const jiraUpdatedAt = asString(fields.updated);

  return {
    key,
    summary,
    parent_key: parentKey,
    parent_summary: parentSummary,
    status_jira: statusJira,
    vertical_raw: verticalRaw ?? "",
    entrega_iso: entregaIso,
    copy_url: copyUrl,
    copy_source: copySource,
    jira_updated_at: jiraUpdatedAt,
  };
}
