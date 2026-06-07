// Thin typed HTTP layer for the Jira Cloud REST API. No new runtime dependency
// (R2, D4): the transport is Node's global `fetch`, and it is INJECTED so tests
// run against recorded fixtures with no network call.
//
// Flag-D research finding (confirmed against live Atlassian docs at Pause 1):
// the current JQL-search endpoint is `POST /rest/api/3/search/jql` with cursor
// pagination (`nextPageToken` / `isLast`) and HTTP Basic auth (email + API
// token, base64). The legacy `POST /rest/api/3/search` with `startAt` offset
// pagination was deprecated in 2025. This matches the seed's JiraClient.

const SEARCH_JQL_PATH = "/rest/api/3/search/jql";
const PAGE_SIZE_CAP = 100;
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * The injectable transport. Structurally a subset of the global `fetch`
 * signature, so `globalThis.fetch` satisfies it directly and a test double can
 * stand in with no network. Kept narrow on purpose: only what `searchJql` needs.
 */
export type FetchLike = (
  input: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
    signal?: AbortSignal;
  },
) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}>;

/** Construction inputs for the Jira HTTP client. Credentials are injected, never read from disk here. */
export interface JiraHttpConfig {
  /** Jira Cloud base URL, e.g. `https://your-domain.atlassian.net`. */
  baseUrl: string;
  /** Atlassian account email for Basic auth. */
  email: string;
  /** Atlassian API token for Basic auth. */
  apiToken: string;
  /** Injected transport; defaults to the global `fetch`. */
  fetchImpl?: FetchLike;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Base64-encode the `email:token` Basic-auth credential. Browser-free, Node `Buffer`. */
function basicAuthHeader(email: string, apiToken: string): string {
  const encoded = Buffer.from(`${email}:${apiToken}`, "utf-8").toString("base64");
  return `Basic ${encoded}`;
}

/**
 * Typed wrapper over the Jira Cloud JQL-search endpoint. One method, `searchJql`,
 * reproduces the seed's cursor pagination loop. The transport is injected at
 * construction so the gateway and its tests share one seam.
 */
export class JiraHttpClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly fetchImpl: FetchLike;

  constructor(config: JiraHttpConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.authHeader = basicAuthHeader(config.email, config.apiToken);
    // The global `fetch` matches FetchLike structurally (Response is a superset
    // of the narrowed return type); cast through the shared port shape.
    this.fetchImpl = config.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
  }

  /**
   * Run a JQL search and return the raw issue records, following cursor
   * pagination to `maxResults`. Behavior-preserving port of the seed's
   * `JiraClient.search_jql`: page size is capped at 100, the loop stops on
   * `isLast`, a missing `nextPageToken`, or reaching `maxResults`, and the
   * result is sliced to `maxResults`. A non-OK response throws (R4 — surfaced,
   * not swallowed).
   */
  async searchJql(
    jql: string,
    fields: readonly string[],
    maxResults: number,
  ): Promise<unknown[]> {
    const url = `${this.baseUrl}${SEARCH_JQL_PATH}`;
    const pageSize = Math.min(maxResults, PAGE_SIZE_CAP);
    const allIssues: unknown[] = [];
    let nextToken: string | null = null;

    for (;;) {
      const body: Record<string, unknown> = {
        jql,
        fields,
        maxResults: pageSize,
      };
      if (nextToken) {
        body.nextPageToken = nextToken;
      }

      const response = await this.fetchImpl(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: this.authHeader,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const detail = (await response.text()).slice(0, 500);
        throw new Error(`Jira API error ${response.status}: ${detail}`);
      }

      const data: unknown = await response.json();
      const dataRecord = isRecord(data) ? data : {};
      const issues = Array.isArray(dataRecord.issues) ? dataRecord.issues : [];
      allIssues.push(...issues);

      nextToken = typeof dataRecord.nextPageToken === "string" ? dataRecord.nextPageToken : null;
      const isLast = typeof dataRecord.isLast === "boolean" ? dataRecord.isLast : nextToken === null;

      if (isLast || !nextToken || allIssues.length >= maxResults) {
        break;
      }
    }

    return allIssues.slice(0, maxResults);
  }
}
