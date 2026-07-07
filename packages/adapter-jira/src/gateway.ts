// The JiraGateway implementation — the Phase-4 first consumer of the 019 ports.
// Behavior-preserving port of the seed's `main()` orchestration (automation/
// fetch.py): main design search -> status/Template filters -> sister (COPYWRITER)
// + parent searches -> second Template filter against real parent summaries ->
// per-issue mapping. The shape-independent decisions (copy precedence, token
// argmax) stay in @saci/core via the mapper/navigation layers (R25).
//
// D2: JQL, auth, baseUrl, and the field mapping are injected at CONSTRUCTION,
// not as method parameters; `fetchIssues()` takes none. Core never sees JQL.
// D3: the port returns `Issue[]`, not a `Payload`. The seed's `filtered_out` and
// `warnings` arrays are NOT serialized — every drop and every partial failure is
// LOGGED through an injected sink (R4 — no silent failure), then discarded.

import type { Issue, JiraGateway as JiraGatewayPort } from "@saci/core";

import {
  COPYWRITER_ISSUETYPE,
  DEFAULT_FIELD_MAPPING,
  DEFAULT_MAX_RESULTS,
  deriveDesignFields,
  FILTERED_STATUSES,
  PARENT_FIELDS,
  type ResolvedFieldMapping,
  SISTER_FIELDS,
  TEMPLATE_MARKER,
} from "./field-mapping.js";
import { JiraHttpClient, type JiraHttpConfig } from "./http.js";
import { buildIssueEntry, type IssueWarningLog } from "./mapper.js";

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

/**
 * Drop sink. Receives the issue key and the exclusion reason (mirrors the seed's
 * `filtered_out.append({key, reason})`, but logged rather than serialized — D3,
 * R4). Defaults to a console warning so a non-injecting caller still sees drops.
 */
export type IssueDropLog = (key: string, reason: string) => void;

const defaultDropLog: IssueDropLog = (key, reason) => {
  console.warn(`[adapter-jira] dropped issue ${key}: ${reason}`);
};

/**
 * Construction inputs for the gateway. Everything Jira-specific is injected here
 * (D2): credentials and base URL for the HTTP client, the main JQL, the field
 * mapping, the per-page cap, and the two log sinks. The field mapping defaults to
 * `DEFAULT_FIELD_MAPPING` (the D1 seam); a Phase-3 user config overrides it
 * without touching this class.
 */
export interface JiraGatewayConfig extends JiraHttpConfig {
  /** The main design-search JQL, fully resolved (no template placeholders left). */
  mainJql: string;
  /** Field-meaning -> custom-field id mapping (D1 seam). Defaults to the seed mapping. */
  fieldMapping?: ResolvedFieldMapping;
  /** Upper bound on issues fetched per search (seed `--max-results`). */
  maxResults?: number;
  /** Sink for filter drops (status / Template). Defaults to a console warning. */
  dropLog?: IssueDropLog;
  /** Sink for per-issue partial-extraction warnings. Defaults to a console warning. */
  warningLog?: IssueWarningLog;
}

export class JiraGateway implements JiraGatewayPort {
  private readonly http: JiraHttpClient;
  private readonly mainJql: string;
  private readonly fieldMapping: ResolvedFieldMapping;
  private readonly maxResults: number;
  private readonly dropLog: IssueDropLog;
  private readonly warningLog?: IssueWarningLog;

  constructor(config: JiraGatewayConfig) {
    this.http = new JiraHttpClient(config);
    this.mainJql = config.mainJql;
    this.fieldMapping = config.fieldMapping ?? DEFAULT_FIELD_MAPPING;
    this.maxResults = config.maxResults ?? DEFAULT_MAX_RESULTS;
    this.dropLog = config.dropLog ?? defaultDropLog;
    this.warningLog = config.warningLog;
  }

  /**
   * Fetch the current design issues as payload-v2.0 `Issue` records. Reproduces
   * the seed's `main()` flow (D3 — minus the envelope): the result is the kept
   * `Issue[]`; drops and warnings are logged, never serialized.
   */
  async fetchIssues(): Promise<Issue[]> {
    await this.validateFieldMapping();

    const designsRaw = await this.http.searchJql(
      this.mainJql,
      deriveDesignFields(this.fieldMapping),
      this.maxResults,
    );

    const designs = this.applyOwnFilters(designsRaw);
    const parentKeys = this.uniqueParentKeys(designs);
    const sistersByParent = await this.fetchSisters(parentKeys);
    const parentsByKey = await this.fetchParents(parentKeys);
    const kept = this.applyParentTemplateFilter(designs, parentsByKey);

    return this.mapIssues(kept, sistersByParent, parentsByKey);
  }

  /**
   * Fetch a single design issue by its Jira key — the `start` command's D2 live
   * lookup. Fail-loud (R4 / D2): a `key = <KEY>` search that returns zero or
   * more than one result throws naming the key and the count; it never returns
   * a partial or ambiguous match. Reuses the per-issue enrichment pipeline
   * (`uniqueParentKeys` -> `fetchSisters`/`fetchParents` -> `buildIssueEntry`),
   * but deliberately skips `applyOwnFilters` / `applyParentTemplateFilter` (P3:
   * a user-named key means the design-search selection already happened, so the
   * status/Template filters that shape the search result set do not apply) and
   * `validateFieldMapping` (the start path uses the default mapping — keep the
   * single-key lookup lean; catalog validation is a configured-mapping concern).
   */
  async fetchIssueByKey(key: string): Promise<Issue> {
    const raw = await this.http.searchJql(
      `key = ${key}`,
      deriveDesignFields(this.fieldMapping),
      this.maxResults,
    );
    if (raw.length !== 1) {
      throw new Error(`fetchIssueByKey(${key}): expected exactly one issue, got ${raw.length}`);
    }
    const [design] = raw as JiraIssue[];
    const parentKeys = this.uniqueParentKeys([design]);
    const sistersByParent = await this.fetchSisters(parentKeys);
    const parentsByKey = await this.fetchParents(parentKeys);
    const entry = buildIssueEntry(design, sistersByParent, parentsByKey, this.fieldMapping, this.warningLog);
    if (!entry) {
      throw new Error(`fetchIssueByKey(${key}): resolved issue has no key`);
    }
    return entry;
  }

  /**
   * Fail loud (R4 / D7) when a configured mapping id does not exist in the Jira
   * field catalog. Fetches the global catalog once via `getFields()`, then
   * asserts every active-mapping id — all `entregaCandidates` plus `vertical` —
   * is present, throwing with the field MEANING + id so a typo never silently
   * degrades to a sibling field. Mandatory natives are not validated: they are
   * native fields, not configurable ids. This is a global existence check, not
   * a per-project applicability check (D7's documented limitation).
   */
  private async validateFieldMapping(): Promise<void> {
    const knownIds = new Set((await this.http.getFields()).map((field) => field.id));
    for (const id of this.fieldMapping.entregaCandidates) {
      if (!knownIds.has(id)) {
        throw new Error(`Configured entrega field "${id}" is not present in the Jira field catalog`);
      }
    }
    if (!knownIds.has(this.fieldMapping.vertical)) {
      throw new Error(
        `Configured vertical field "${this.fieldMapping.vertical}" is not present in the Jira field catalog`,
      );
    }
  }

  /**
   * Status filter + first Template filter (own + already-attached parent
   * summary), seed `main()` step 1. Drops are logged (D3, R4); kept issues pass
   * through. Returns the surviving raw issues.
   */
  private applyOwnFilters(designsRaw: readonly unknown[]): JiraIssue[] {
    const kept: JiraIssue[] = [];
    for (const issue of designsRaw) {
      const fields = issueFields(issue);
      const key = asString(isRecord(issue) ? issue.key : "");

      const statusObj = isRecord(fields.status) ? fields.status : {};
      const statusName = asString(statusObj.name);
      if (FILTERED_STATUSES.has(statusName)) {
        this.dropLog(key, statusName);
        continue;
      }

      const ownSummary = asString(fields.summary).toLowerCase();
      const parent = isRecord(fields.parent) ? fields.parent : {};
      const parentFields = isRecord(parent.fields) ? parent.fields : {};
      const parentSummary = asString(parentFields.summary).toLowerCase();
      if (ownSummary.includes(TEMPLATE_MARKER) || parentSummary.includes(TEMPLATE_MARKER)) {
        this.dropLog(key, "Template");
        continue;
      }

      kept.push(isRecord(issue) ? issue : {});
    }
    return kept;
  }

  /** Collect the unique non-empty parent keys across the kept design issues. */
  private uniqueParentKeys(designs: readonly JiraIssue[]): string[] {
    const keys = new Set<string>();
    for (const design of designs) {
      const parent = issueFields(design).parent;
      const parentKey = asString(isRecord(parent) ? parent.key : "");
      if (parentKey) {
        keys.add(parentKey);
      }
    }
    return [...keys];
  }

  /**
   * Sister (COPYWRITER) search grouped by parent key (seed step 2a). A search
   * failure is logged and yields an empty map — the seed catches and continues.
   */
  private async fetchSisters(parentKeys: readonly string[]): Promise<Map<string, JiraIssue[]>> {
    const byParent = new Map<string, JiraIssue[]>();
    if (parentKeys.length === 0) {
      return byParent;
    }
    const jql = `parent IN (${parentKeys.join(",")}) AND issuetype = ${COPYWRITER_ISSUETYPE}`;
    try {
      const raw = await this.http.searchJql(jql, SISTER_FIELDS, this.maxResults);
      for (const sister of raw) {
        const parent = issueFields(sister).parent;
        const parentKey = asString(isRecord(parent) ? parent.key : "");
        if (!parentKey) {
          continue;
        }
        const group = byParent.get(parentKey) ?? [];
        group.push(isRecord(sister) ? sister : {});
        byParent.set(parentKey, group);
      }
    } catch (error) {
      this.dropLog("(sisters)", `sister search failed: ${errorCause(error)}`);
    }
    return byParent;
  }

  /**
   * Parent-description search keyed by parent key (seed step 2b). A failure is
   * logged and yields an empty map — the seed catches and continues.
   */
  private async fetchParents(parentKeys: readonly string[]): Promise<Map<string, JiraIssue>> {
    const byKey = new Map<string, JiraIssue>();
    if (parentKeys.length === 0) {
      return byKey;
    }
    const jql = `key IN (${parentKeys.join(",")})`;
    try {
      const raw = await this.http.searchJql(jql, PARENT_FIELDS, this.maxResults);
      for (const parent of raw) {
        const key = asString(isRecord(parent) ? parent.key : "");
        if (key) {
          byKey.set(key, isRecord(parent) ? parent : {});
        }
      }
    } catch (error) {
      this.dropLog("(parents)", `parent search failed: ${errorCause(error)}`);
    }
    return byKey;
  }

  /**
   * Second Template filter against the REAL parent summaries (seed step:
   * "Segundo filtro de Template usando parent.summary REAL"). The new JQL-search
   * endpoint does not return `parent.fields.summary`, so the parent name is read
   * from the separate parent search. Drops are logged (D3, R4).
   */
  private applyParentTemplateFilter(
    designs: readonly JiraIssue[],
    parentsByKey: ReadonlyMap<string, JiraIssue>,
  ): JiraIssue[] {
    const kept: JiraIssue[] = [];
    for (const issue of designs) {
      const parent = issueFields(issue).parent;
      const parentKey = asString(isRecord(parent) ? parent.key : "");
      let parentSummary = "";
      if (parentKey && parentsByKey.has(parentKey)) {
        parentSummary = asString(issueFields(parentsByKey.get(parentKey)).summary).toLowerCase();
      }
      if (parentSummary.includes(TEMPLATE_MARKER)) {
        const key = asString(isRecord(issue) ? issue.key : "");
        this.dropLog(key, "Template (no parent)");
        continue;
      }
      kept.push(issue);
    }
    return kept;
  }

  /**
   * Map each kept design issue to an `Issue` via the mapper (seed payload-build
   * loop). A keyless issue is dropped (mapper returns null); a catastrophic
   * per-issue failure is logged and the issue skipped (seed `warnings` "ALL"
   * entry, logged not serialized — D3, R4).
   */
  private mapIssues(
    designs: readonly JiraIssue[],
    sistersByParent: ReadonlyMap<string, readonly JiraIssue[]>,
    parentsByKey: ReadonlyMap<string, JiraIssue>,
  ): Issue[] {
    const issues: Issue[] = [];
    for (const design of designs) {
      try {
        const entry = buildIssueEntry(
          design,
          sistersByParent,
          parentsByKey,
          this.fieldMapping,
          this.warningLog,
        );
        if (entry) {
          issues.push(entry);
        }
      } catch (error) {
        const key = asString(isRecord(design) ? design.key : "") || "?";
        this.dropLog(key, `processing failure: ${errorCause(error)}`);
      }
    }
    return issues;
  }
}

function errorCause(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
