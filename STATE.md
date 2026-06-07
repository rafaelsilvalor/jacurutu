# Task State

## Goal

Implement `JiraGateway.fetchIssues(): Promise<Issue[]>` in `@saci/adapter-jira`,
porting the Jira-shape-coupled extraction and copy-navigation from the frozen
seed `automation/fetch.py` behavior-preserving, delegating shape-independent
decisions to `@saci/core`.

## Status

in-progress

## Last update

2026-06-07, win32 (Windows 11)

## Done so far

- [x] Edit 1 — Verify brief on disk (commit #1 by @planner present)

## Next steps

- [ ] Edit 2 — Port ADF walker and defensive field reads (src/extract.ts)
- [ ] Edit 3 — Port copy-navigation halves over core policy (src/navigation.ts)
- [ ] Edit 4 — Implement issue mapper build_issue_entry -> Issue (src/mapper.ts)
- [ ] Edit 5 — Implement HTTP client + JiraGateway (src/http.ts, src/gateway.ts, src/index.ts)
- [ ] Edit 6 — Add fixture-backed end-to-end tests (src/fixtures/*.ts, src/gateway.test.ts)

## Notes for next session

- Module split (Pause 1 approved): extract.ts, navigation.ts, mapper.ts,
  http.ts, gateway.ts, index.ts (6 modules).
- Fixtures are TypeScript modules (`src/fixtures/*.ts` exporting typed
  constants), NOT `.json`. Reason: `npm test` runs `node --test
  packages/*/dist/**/*.test.js` against `dist/`; `tsc` does not copy `.json`
  into `dist/`, so `.ts` fixtures are dist-safe and typed (Pause 1 adjustment).
- HTTP transport is injected (a port/function) so tests run with no network.
- `customfield_*` ids live in exactly ONE adapter module (D1, flag A).
- flag-D finding (approved at Pause 1): Jira Cloud REST JQL search is
  `POST /rest/api/3/search/jql` with cursor pagination (`nextPageToken` /
  `isLast`) and HTTP Basic auth (email + API token, base64). This matches the
  seed; the legacy `/rest/api/3/search` with `startAt` was deprecated in 2025.
- `ADAPTER_JIRA_PHASE` has NO importer outside the package (grep-verified) ->
  Edit 5 removes it AND `src/index.test.ts` together in the same commit.
- Core is untouched (D2). If the 019 port proves insufficient, STOP and report.
