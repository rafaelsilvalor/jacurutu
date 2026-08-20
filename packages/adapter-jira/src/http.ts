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
const FIELD_CATALOG_PATH = "/rest/api/3/field";
const MYSELF_PATH = "/rest/api/3/myself";
const PAGE_SIZE_CAP = 100;
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Statuses that mean "Jira rejected this credential". `403` joins `401` because
 * on Atlassian it also covers a blocked or CAPTCHA-challenged account, which is
 * still an operator credential problem. Status codes ONLY: Jira returns its
 * error messages in the operator's Atlassian locale (a `400` came back in
 * Chinese on 2026-08-09), so keying on message text would break per-operator.
 */
const CREDENTIAL_REJECTED_STATUSES: ReadonlySet<number> = new Set([401, 403]);

/**
 * The injectable transport. Structurally a subset of the global `fetch`
 * signature, so `globalThis.fetch` satisfies it directly and a test double can
 * stand in with no network. Kept narrow on purpose: only what the client needs.
 *
 * `body` is OPTIONAL because a real GET must omit it: Node's global `fetch`
 * THROWS ("Request with GET/HEAD method cannot have body") on a GET carrying any
 * non-null body, including an empty string. `getFields` is a GET and supplies no
 * `body` key at all; `searchJql` (POST) still always sets one.
 */
export type FetchLike = (
  input: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body?: string;
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
  /**
   * The token expiry the composition root read out of the credentials file.
   * OPAQUE to this adapter (D4): it is never parsed, never compared, never
   * reformatted and never used for a decision — it is received as a string and
   * concatenated into the credential-rejection message. No clock and no file
   * path belong here; both stay with the composition root that owns the file.
   */
  credentialExpiry?: string;
}

/**
 * The single field of a Jira field-catalog entry this adapter consumes: the
 * field `id` (e.g. `customfield_10031`). The catalog carries more (name, schema,
 * etc.), but mapping validation (D7) only needs id existence, so the narrowed
 * type stays minimal (R24 — narrow from `unknown`, no `any`).
 */
export interface JiraFieldMeta {
  id: string;
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
 * Typed wrapper over the three Jira Cloud endpoints this adapter reaches: the
 * credential pre-flight, the JQL search (whose cursor pagination loop is ported
 * from the seed), and the field catalog. The transport is injected at
 * construction so the gateway and its tests share one seam.
 */
export class JiraHttpClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly fetchImpl: FetchLike;
  private readonly credentialExpiry?: string;

  constructor(config: JiraHttpConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.authHeader = basicAuthHeader(config.email, config.apiToken);
    // The global `fetch` matches FetchLike structurally (Response is a superset
    // of the narrowed return type); cast through the shared port shape.
    this.fetchImpl = config.fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
    this.credentialExpiry = config.credentialExpiry;
  }

  /**
   * Verify the configured Basic credentials against `GET /rest/api/3/myself`,
   * the one Jira endpoint that answers `401` to an anonymous caller. Resolves on
   * success, throws naming the credential on rejection (R4).
   *
   * Exists because a bounded JQL search does NOT fail on a bad token — it
   * answers `200` with an empty issue list (measured 2026-08-09), so the caller
   * cannot tell a revoked token from a quiet day.
   *
   * The decision is taken on `response.status` alone and the success body is not
   * parsed: nothing here needs the account record, and reading it would invite a
   * dependency on message text that the operator's Atlassian locale can break.
   *
   * No `body` key is set: this is a GET, and Node `fetch` rejects a GET carrying
   * any body (see `FetchLike`).
   */
  async verifyCredentials(): Promise<void> {
    const url = `${this.baseUrl}${MYSELF_PATH}`;
    const response = await this.fetchImpl(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: this.authHeader,
        Connection: "close",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (CREDENTIAL_REJECTED_STATUSES.has(response.status)) {
      // Appended only when the composition root supplied a recorded expiry, so
      // an adapter constructed without one throws the byte-identical message it
      // always threw. Every Atlassian API token issued since December 2024
      // expires within 365 days, and this is the one moment that date is
      // decisive for the operator.
      const recordedExpiry = this.credentialExpiry
        ? ` The credentials file records this token as expiring on ${this.credentialExpiry}.`
        : "";
      throw new Error(
        `Jira rejected the configured credentials (HTTP ${response.status} on ${MYSELF_PATH}). ` +
          "The email / API token pair is invalid, expired, or revoked." +
          recordedExpiry,
      );
    }

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      throw new Error(`Jira API error ${response.status}: ${detail}`);
    }
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
          Connection: "close",
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

  /**
   * Fetch the global Jira field catalog (`GET /rest/api/3/field`) and return the
   * narrowed `{ id }` list. The endpoint returns every field in ONE response —
   * no pagination. Used by the gateway to fail loud (D7, R4) when a configured
   * mapping id does not exist. A non-OK response throws, like `searchJql`.
   *
   * No `body` key is set: this is a GET, and Node `fetch` rejects a GET carrying
   * any body (see `FetchLike`).
   */
  async getFields(): Promise<JiraFieldMeta[]> {
    const url = `${this.baseUrl}${FIELD_CATALOG_PATH}`;
    const response = await this.fetchImpl(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: this.authHeader,
        Connection: "close",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      throw new Error(`Jira API error ${response.status}: ${detail}`);
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      return [];
    }
    const fields: JiraFieldMeta[] = [];
    for (const entry of data) {
      if (isRecord(entry) && typeof entry.id === "string") {
        fields.push({ id: entry.id });
      }
    }
    return fields;
  }
}
