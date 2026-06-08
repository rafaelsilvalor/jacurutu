# Brief: 020 — Jira adapter: `JiraGateway.fetchIssues`

> **Category:** L
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `feat/jira-adapter-fetch-issues`

---

## Context

Phase 3 of the v2 monorepo. Brief 019 ported the *shape-independent* domain
half of the Python automation seed into `@saci/core` (`pickCopy`,
`bestMatchByTokenOverlap`, `summaryTokens`, the payload-v2.0 `Issue` type, and
the `JiraGateway` port interface). The Jira-shape-coupled halves —
`customfield_*` reads, ADF tree-walking, copy navigation — were deliberately
left out of core.

This brief implements the first consumer of those 019 ports: the
`@saci/adapter-jira` package. It implements `JiraGateway.fetchIssues(): Promise<Issue[]>`
and ports the coupled halves from the frozen seed `automation/fetch.py`,
behavior-preserving. The package currently holds only a Phase-1 placeholder
(`src/index.ts`, `src/index.test.ts`).

P4 numbering evidence (three sources, all agree on `020`):
- `ls docs/tasks/` — highest entry is `019-core-domain-port`.
- `git log --oneline main` — highest merged task PR is 019 (`#43` feat/core
  port, `#44`/`#45` recaps); no `020` shipped.
- `CLAUDE.md` E* — exceptions run `E1`–`E5` (v1 freeze); none reserves `020`.

## Goal

Implement `JiraGateway.fetchIssues(): Promise<Issue[]>` in
`@saci/adapter-jira`, porting the Jira-shape-coupled extraction and navigation
from `automation/fetch.py` verbatim and behavior-preserving, so the
navigation → core-policy path yields the same `Issue[]` the Python yields on
the same input.

Out of scope:

- **The `payload.json` / Sheet write envelope.** The `filtered_out` and
  `warnings` arrays, the `Payload` wrapper, `generated_at`/`run_date`, and any
  serialization to disk or Sheet are DEFERRED to a future coordination-mode
  brief (D3). `fetchIssues` returns `Issue[]`, not `Payload`.
- **`derivePath`** and any path-derivation logic from the seed (D3).
- **`packages/core/**`.** Core is untouched. If the 019 port proves
  insufficient, STOP and report — a core edit is a separate decision (D2).
- **Any package other than `@saci/adapter-jira`.** No edits to
  `adapter-sheets`, `cli`, or `core` (D2, Judgment flag B).
- **The named `FieldMapping` type.** DEFERRED (A3/R19 — one adapter, one
  case). The mapping is a value/config inside the mapper module, not a public
  named type (D1).
- **Committing credentials.** Email/token/JQL/base URL are injected; no
  secret or env file is added to the repo (D2).

## Constraints

### Non-negotiable constraints

1. Only paths under `packages/adapter-jira/**` may be created or modified
   (plus this brief under `docs/tasks/020-jira-adapter/`). If anything else
   needs changing — especially `packages/core/**` — **STOP and ask**
   (Judgment flag B).
2. Follow all rules in `CLAUDE.md`, especially: R20 (strict TS), R21 (ESM,
   `.js` import extensions), R22 (`tsc` per package, no bundler), R23
   (`node:test`, `*.test.ts` colocated), R24 (no `any` — use `unknown`),
   R25 (hexagonal direction: adapter → core, never the reverse), R4 (no silent
   `catch`), R7 (named constants for policy values), R2 (no new runtime deps
   without PR justification).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - Branch: `feat/jira-adapter-fetch-issues` (G-R2).
   - Conventional Commits (G-R3); subject ≤ 72 chars; body explains *why*.
   - No `Co-authored-by` trailer (G-A7).
   - Commit freely; **DO NOT push** (G-R5 / R17).
   - This is a multi-file structural task — create `STATE.md` at repo root if
     execution spans sessions (G-R10); delete it on task close.
4. Behavior-preserving port (seed-fidelity). Every ported function reproduces
   `automation/fetch.py` on the same input. Where the seed reads VERBATIM from
   disk, transcribe — do not paraphrase logic (Judgment flag C).
5. No new runtime dependency (R2). The HTTP client is a thin typed wrapper over
   Node 22 global `fetch`; no Jira SDK, no `requests`-equivalent (D4).

### Conventions

- Language: English-only on this surface (R9) — identifiers, comments,
  commit messages, this brief. The seed's pt-BR comments are NOT carried over;
  port the *behavior*, write English comments answering "why" (R8).
- Commit scope: `adapter-jira` (e.g. `feat(adapter-jira): ...`).
- Tests: `*.test.ts` colocated in `src/`, run via `node:test` (R23). The HTTP
  layer is injectable so tests run against recorded fixtures with no network.
- Constants (JIRA field ids, regexes, schema strings) live as named module-top
  constants in the mapper (R7), and `customfield_*` ids appear in ONE module
  only (D1, Judgment flag A).

### Architectural decisions already made (do not revisit)

Closed during the design session with the mentor. The executor implements; it
does not propose alternatives. If a decision must change mid-execution, STOP
and report.

#### D1 — Configurability seam, not the type

All field-meaning → Jira-id mapping lives in ONE mapper module inside the
adapter. The `customfield_*` ids (`customfield_10031`, `customfield_10065`,
`customfield_11080`, …) appear ONLY there — never in core, never in another
adapter file. The JQL / filter is **injected config**, never hardcoded in the
gateway. `JiraGateway.fetchIssues` returns clean payload-v2.0 `Issue`s. The
named `FieldMapping` type stays DEFERRED (A3/R19 — one adapter, one case): the
mapping is a value passed at construction, not a public exported type. The
Phase-3 editable filter/mapping feature is additive and must never reopen core.

#### D2 — Implement the port as-is; core untouched

The port is `fetchIssues(): Promise<Issue[]>` exactly as declared in
`packages/core/src/gateways.ts`. JQL, auth (email + API token), base URL, and
the field mapping are injected at **construction** — NOT method parameters;
core never sees JQL. The adapter imports core policy (`pickCopy`,
`bestMatchByTokenOverlap`, `summaryTokens`) and core types (`Issue`,
`CopySource`); dependency direction is adapter → core (R25). Credentials are
read from env / a gitignored config at the composition root or via injected
values — never committed. The brief touches ONLY `packages/adapter-jira/**`.
If the port proves insufficient, **STOP and report** — a `packages/core` edit
is a separate decision.

#### D3 — Coupled halves IN; envelope DEFERRED

IN scope (port from the seed, behavior-preserving):
- `build_issue_entry` — the mapper; the D1 seam lives here.
- `adf_extract_urls` / `adf_extract_drive_urls` / `adf_extract_text` — the
  hand-rolled ADF JSON tree-walk (no library).
- `safe_get_entrega` / `safe_get_vertical` — defensive `customfield_*` reads.
- `extract_urls_from_comments` — Drive/Docs URL harvest from the `comment`
  field.
- The **navigation halves** of `resolve_copy` (builds the sister/parent URL
  lists, then delegates precedence to core `pickCopy`) and `best_sister_match`
  (tokenizes summaries via core `summaryTokens`, then delegates argmax to core
  `bestMatchByTokenOverlap`).

OUT of scope (DEFERRED to a future coordination-mode brief):
- `derivePath`.
- The `filtered_out` / `warnings` envelope, the `Payload` wrapper, and the
  `payload.json` / Sheet write.

The port stays `Issue[]`. The adapter still **computes** the filter and
extraction decisions the seed makes (status filter, Template filter, partial
extraction failures) — but it **LOGS** them (R4 — no silent failure); it does
not serialize a `filtered_out`/`warnings` array. An issue that the seed would
drop is dropped here too; an issue the seed would keep-with-warning is kept and
the warning is logged.

#### D4 — Raw `fetch`, no Jira SDK

A thin, typed `fetch` wrapper (seed precedent — the seed uses raw HTTP; R2 /
minimal-stack). Auth is one Basic header (email + API token). Pagination is a
loop. ADF is hand-rolled. Node 22 provides global `fetch` — no dependency.

**REQUIRED research step before porting the HTTP layer** (executor step,
captured as Judgment flag D): confirm the current Jira Cloud REST JQL-search
endpoint, pagination model, and auth scheme against live Atlassian docs. The
seed already uses `POST /rest/api/3/search/jql` with `nextPageToken` /
`isLast` (the seed comments claim this replaced `/rest/api/3/search` in 2025) —
but this is UNVERIFIED at brief-authoring time. Do NOT port the seed's endpoint
blindly: confirm it is still current before committing the HTTP client. If it
cannot be confirmed against live docs, **STOP and report**.

## Judgment flags

The executor converts each entry into a STOP-and-confirm guard at the named
location.

- **A — seam isolation.**
  - *Location:* the mapper module (where `customfield_*` ids live).
  - *Risk:* a `customfield_*` id (or other Jira-wire field id) leaks into core
    or into another adapter file.
  - *Action:* STOP. Verify `customfield_` appears in exactly one adapter file
    via `grep -rn 'customfield_' packages/`; if it appears in core or a second
    adapter file, STOP and report.

- **B — package boundary.**
  - *Location:* `packages/**`.
  - *Risk:* an edit to `packages/core` (or any package other than
    `adapter-jira`).
  - *Action:* STOP and confirm before touching any file outside
    `packages/adapter-jira/**`.

- **C — seed fidelity.**
  - *Location:* the mapper / ADF walker / copy-navigation port.
  - *Risk:* inventing behavior absent from the seed.
  - *Action:* STOP if the seed shape is ambiguous on disk
    (`automation/fetch.py`); do not fill the gap by inference.

- **D — live endpoint.**
  - *Location:* the HTTP client.
  - *Risk:* porting a deprecated or wrong endpoint / pagination / auth scheme
    blindly from the seed.
  - *Action:* research the current Jira Cloud REST JQL-search endpoint,
    pagination model, and auth against live Atlassian docs FIRST; STOP and
    report if it cannot be confirmed.

## Done criteria

### Edit 1 — Verify brief on disk (committed by @planner) as commit #1

This is a PIPELINE brief: `@planner` authored AND committed `brief.md` as
commit #1 before the executor runs. The executor verifies presence and that
commit #1 exists.

- [ ] Directory `docs/tasks/020-jira-adapter/` exists
- [ ] File `docs/tasks/020-jira-adapter/brief.md` exists; first line is
      `# Brief: 020 — Jira adapter: \`JiraGateway.fetchIssues\``
- [ ] Commit #1 exists with subject `docs(tasks): add brief for 020-jira-adapter`
      (authored by @planner)

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

### Edit 2 — Port the ADF walker and defensive field reads

Port, behavior-preserving (D3, Judgment flag C):
- `adf_extract_urls` (recursive ADF tree-walk; yields URLs from
  `inlineCard`/`blockCard`/`embedCard`/`mediaSingle` `attrs.url`, from text
  `link` marks `attrs.href`, and from raw Drive/Docs URLs in text).
- `adf_extract_drive_urls` (Drive/Docs filter, markdown-suffix cleanup against
  `)`/`]`/`>`/`"`, order-preserving dedup).
- `adf_extract_text` (plain-text concatenation; fallback util).
- `extract_urls_from_comments` (handles the `comment` field as object with
  `.comments[]` or as a bare list; order-preserving dedup).
- `safe_get_entrega` (try `customfield_10031` then `customfield_11080`).
- `safe_get_vertical` (defensive `customfield_10065[0].value`).

Constraints: no `any` (R24 — ADF nodes typed as `unknown` and narrowed); the
`DRIVE_URL_RE` regex and `customfield_*` ids are named constants (R7); the ADF
input shape is whatever the Jira fixtures carry. Strict TS (R20). ESM `.js`
import extensions (R21).

Verification:
- [ ] `customfield_` appears only in this/the mapper module within
      `packages/adapter-jira/src/` — `grep -rn 'customfield_' packages/`
      returns matches only under `packages/adapter-jira/src/` (Judgment flag A)
- [ ] Unit tests (`*.test.ts`) cover: a Drive URL in an `inlineCard`, a Drive
      URL in a text `link` mark, a raw Drive URL in text, a non-Drive URL
      rejected, comment-field-as-object and comment-field-as-list, dedup order,
      `safe_get_entrega` primary/fallback/none, `safe_get_vertical`
      list/dict/none
- [ ] No `any` (`grep -n ': any\b' packages/adapter-jira/src/*.ts` empty, or
      each occurrence carries the R24 rationale comment)
- [ ] `tsc -p packages/adapter-jira` passes; `node:test` passes

Commit: `feat(adapter-jira): port ADF walker and field reads`

### Edit 3 — Port the copy-navigation halves over core policy

Port the navigation halves (D3), delegating the shape-independent decisions to
core (R25):
- The navigation half of `best_sister_match`: tokenize design + candidate
  summaries via core `summaryTokens`, build the
  `{ id, tokens }[]` candidate list, call core `bestMatchByTokenOverlap`, then
  map the winning id back to the candidate issue.
- The navigation half of `resolve_copy`: for the matched sister, extract Drive
  URLs from `description` then (if empty) from `comment`; for the parent,
  extract from `description`; pass the resulting `sisterUrls` / `parentUrls`
  lists to core `pickCopy` for the sister → parent → fallback precedence.

Constraints: import from `@saci/core` only (`summaryTokens`,
`bestMatchByTokenOverlap`, `pickCopy`, `CopySource`); never re-implement the
scoring/precedence locally (R25, D3). Strict TS, no `any`.

Verification:
- [ ] Imports resolve to `@saci/core` (`grep -n "@saci/core"
      packages/adapter-jira/src/*.ts` shows the policy import)
- [ ] No local re-implementation of token scoring or copy precedence
      (`bestMatchByTokenOverlap` / `pickCopy` logic is not duplicated in the
      adapter)
- [ ] Unit tests cover: single-candidate sister (direct pick), multi-candidate
      argmax, zero-overlap → no sister → parent fallback → `fallback`; sister
      URL from description vs. from comment
- [ ] `tsc` + `node:test` pass

Commit: `feat(adapter-jira): port copy navigation over core policy`

### Edit 4 — Implement the mapper (`build_issue_entry` → `Issue`)

Port `build_issue_entry` as the mapper that turns a raw Jira issue into a
payload-v2.0 `Issue` (D1 seam lives here). Behavior-preserving (Judgment flag
C): keyless issue → dropped; `parent_key`/`summary`/`status`/`vertical`
defaults to `""` per the seed's `or ""` guards; `entrega_iso` and `copy_url`
stay bare `string | null`; partial extraction failures are LOGGED (R4), not
serialized into a `warnings` array (D3). The field-meaning → `customfield_*`
mapping is a value injected at construction (D1) — the named `FieldMapping`
type stays deferred.

Verification:
- [ ] Mapper output matches the `Issue` field shape in
      `packages/core/src/payload.ts` (key, summary, parent_key,
      parent_summary, status_jira, vertical_raw, entrega_iso, copy_url,
      copy_source, jira_updated_at)
- [ ] Keyless issue returns dropped (no entry); partial failures are logged via
      a non-silent path (R4 — no empty `catch`)
- [ ] Mapper unit tests cover the Issue mapping against inline issue inputs:
      keyless issue dropped; `or ""` string defaults; bare-nullable
      `entrega_iso`/`copy_url`; `copy_source` provenance. (The fixture-backed
      EARS end-to-end suite is Edit 6's scope — not verified at this commit.)
- [ ] `customfield_` confined to the mapper/extract module (Judgment flag A
      re-check)
- [ ] `tsc` + `node:test` pass

Commit: `feat(adapter-jira): add issue mapper for payload v2.0`

### Edit 5 — Implement the HTTP client and `JiraGateway`

Implement the thin typed `fetch` wrapper and the `JiraGateway` class that
implements the 019 port (D2, D4). JQL, auth, base URL, and field mapping are
injected at construction. `fetchIssues` runs the main search, the sister
(`COPYWRITER`) search, and the parent search, applies the status/Template
filters (logging drops per D3), and returns `Issue[]`. The HTTP layer is
**injectable/mockable** so tests run against fixtures with no network.

**Before writing the endpoint:** complete the Judgment flag D research — confirm
the current Jira Cloud REST JQL-search endpoint, pagination
(`nextPageToken`/`isLast`), and Basic-auth scheme against live Atlassian docs.
STOP and report if unconfirmed.

Step: Update `src/index.ts` to export the gateway public surface (the
`JiraGateway` implementation and/or its construction factory). Remove the
`ADAPTER_JIRA_PHASE` placeholder export AND its sentinel `index.test.ts` in
this same commit — ONLY IF `grep -rn 'ADAPTER_JIRA_PHASE' packages/` shows no
importer outside this package. If any package imports it, KEEP the constant
(cross-boundary symbol — Judgment flag B / the 019 `SACI_CORE_PHASE`
precedent) and only add the gateway exports. Keep this commit green: do the
export removal and the sentinel-test removal TOGETHER, in this same commit.

Verification:
- [ ] `JiraGateway` implements `fetchIssues(): Promise<Issue[]>` from
      `@saci/core` `gateways.ts`; JQL/auth/baseUrl/mapping are constructor
      inputs, not method params (D2)
- [ ] No new runtime dependency added to `package.json` (R2, D4); HTTP uses
      global `fetch`
- [ ] HTTP transport is injected (a port/function), so a fixture-backed test
      double satisfies it with no network call
- [ ] Endpoint/pagination/auth match the flag-D research finding (recorded in
      `notes.md` or the PR body), not blindly the seed
- [ ] No committed credential or secret (`git diff --name-only` shows no env /
      credentials file)
- [ ] `src/index.ts` exports the gateway surface; `ADAPTER_JIRA_PHASE` and its
      sentinel test removed together unless a cross-package import exists
      (grep-verified)
- [ ] `tsc` + `node:test` pass

Commit: `feat(adapter-jira): add Jira HTTP client and gateway`

### Edit 6 — Add fixture-backed end-to-end tests

Add the recorded fixtures (Jira response JSON and/or the seed's
`automation/payload.json` excerpt) and the EARS end-to-end tests asserting the
navigation → core-policy path equals the Python on the same input. The Phase-1
sentinel test was already removed in Edit 5; Edit 6 only ADDS the
fixture-backed EARS tests.

EARS behavioral criteria (assert each):
- **WHEN** a design issue has a sister copywriter with a Drive URL in its
  description, **the** gateway **shall** resolve `copy_source = "sister"` with
  that URL.
- **WHEN** a design issue has no matching sister but its parent description
  carries a Drive URL, **the** gateway **shall** resolve
  `copy_source = "parent"`.
- **WHEN** neither a sister nor a parent yields a Drive URL, **the** gateway
  **shall** resolve `copy_url = null`, `copy_source = "fallback"`.
- **WHEN** multiple sister candidates exist, **the** gateway **shall** select
  the highest token-overlap candidate (core `bestMatchByTokenOverlap`),
  matching the Python on the same summaries.
- **WHEN** an issue's status is in the configured filtered set, OR `template`
  appears in its own or its parent summary, **the** gateway **shall** exclude
  it from the returned `Issue[]` and LOG the drop (D3, R4).
- **WHEN** `customfield_10031` is absent but `customfield_11080` is present,
  **the** gateway **shall** set `entrega_iso` from the fallback field.
- **WHILE** any per-issue extraction fails, **the** gateway **shall** keep the
  issue with fallback field values and LOG the warning (it shall not serialize
  a `warnings` array — D3).

Verification:
- [ ] Fixtures live under `packages/adapter-jira/src/` (or a `fixtures/`
      subfolder within the package) — no path outside the package
- [ ] Every EARS criterion above has a corresponding passing test
- [ ] Tests run with no network (HTTP double injected)
- [ ] `npm test` (workspace) passes; `tsc -p packages/adapter-jira` passes

Commit: `test(adapter-jira): add fixture-backed gateway tests`

### Automated checks (run before each commit)

- [ ] `tsc -p packages/adapter-jira` passes (R20, R22)
- [ ] `node:test` for the package passes (R23)
- [ ] Workspace `npm test` (pre-commit hook, G-R8) passes

### Structural checks

- [ ] Expected files exist under `packages/adapter-jira/src/`
- [ ] `customfield_` confined to a single adapter module (Judgment flag A):
      `grep -rn 'customfield_' packages/` matches only
      `packages/adapter-jira/src/`
- [ ] `grep -rn 'from.*adapter' packages/core/` returns no matches (R25
      unchanged)
- [ ] No file outside `packages/adapter-jira/**` (and this brief) modified:
      `git diff --name-only origin/main..HEAD`

### Behavior checks

- [ ] Each EARS criterion in Edit 6 passes against fixtures
- [ ] Output `Issue[]` matches `payload.ts` field shape and nullability
- [ ] Filter/Template drops and partial failures are LOGGED, not serialized
      (D3, R4)

### Git checks

- [ ] Branch used: `feat/jira-adapter-fetch-issues`
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed
- [ ] `STATE.md` removed if it was created (G-R10)

### Process checks

- [ ] `Plan required: yes` — numbered plan presented and approved before any
      change (Pause 1), including the internal structure
      (mapper/navigation/HTTP split) and the flag-D research outcome
- [ ] Pause 2 — first modified file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message +
      `pre-commit-self-audit` output shown before each commit
- [ ] Each Judgment flag (A–D) honored: STOP-and-confirm at its location
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

Pauses are named in English (R9). The pt-BR form "Pausa" appears only in
`harness/` human-edited prose.

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code): REQUIRED.** `Plan required: yes`. The executor
  presents a numbered plan — including the internal structure (testable
  mapper/navigation vs. thin HTTP client), the fixture strategy, and the
  outcome of the flag-D live-endpoint research — and waits for approval. The
  user reviews the seam (D1) and the envelope boundary (D3) at this pause.
- **Pause 2 (after the first modified file): REQUIRED.** Show the first
  modified source file and wait for review.
- **Pause 3 (before each commit): REQUIRED.** Show `git status` +
  `git diff --stat` + proposed message + `pre-commit-self-audit` output.

In case of:
- Unrelated bug found → report and ask. Do not fix.
- A Judgment flag (A–D) triggers → STOP and confirm per its Action.
- The 019 port proves insufficient (would require a `packages/core` edit) →
  STOP and report (D2).
- Seed shape ambiguous on disk → STOP and report (flag C).
- Live endpoint unconfirmable → STOP and report (flag D).

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: yes` because:

- The executor designs the internal structure (testable mapper / navigation /
  thin injectable HTTP client) — not pre-specified as exact text in this brief.
- The flag-D live-endpoint research must complete and be reviewed before the
  HTTP layer is written; its outcome shapes the plan.
- The user reviews the D1 seam and the D3 envelope boundary at Pause 1 before
  any code lands.

Pause 2 and Pause 3 remain required regardless (Lesson #6 of
`docs/AGENT_PLAYBOOK.md`).

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules (R20–R25, R4, R7, R2)
2. `docs/GIT_WORKFLOW.md` — operational discipline (G-R2, G-R3, G-R5, G-R10)
3. `docs/GOTCHAS.md` — known traps
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
5. `.claude/skills/brief-template/SKILL.md` — template reference
6. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit (Pause 3)
7. `automation/fetch.py` — the frozen seed: `build_issue_entry`,
   `adf_extract_*`, `safe_get_entrega`/`safe_get_vertical`,
   `extract_urls_from_comments`, `resolve_copy`, `best_sister_match`,
   `JiraClient.search_jql`
8. `automation/payload.json` — the v2.0 output shape (fixture source)
9. `packages/core/src/gateways.ts` — the `JiraGateway` port
10. `packages/core/src/payload.ts` — the `Issue` type and nullability contract
11. `packages/core/src/policy.ts` — `summaryTokens`,
    `bestMatchByTokenOverlap`, `pickCopy`

## Git workflow

### Branch

`feat/jira-adapter-fetch-issues` (G-R2 / R11). Created off `main`.

### Commit sequence

1. `docs(tasks): add brief for 020-jira-adapter` (commit #1, by @planner)
2. `feat(adapter-jira): port ADF walker and field reads`
3. `feat(adapter-jira): port copy navigation over core policy`
4. `feat(adapter-jira): add issue mapper for payload v2.0`
5. `feat(adapter-jira): add Jira HTTP client and gateway`
6. `test(adapter-jira): add fixture-backed gateway tests`

All subjects verified ≤ 72 chars (R10 / G-R3). Leading verbs (`add`, `port`)
are in the `pre-commit-self-audit` allowlist SSOT.

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Any verification checkbox that could not be met, with explanation
4. The flag-D live-endpoint research finding (endpoint, pagination, auth)
5. Confirmation that no `git push` was executed
6. Suggested next step (open PR, follow-up coordination-mode brief for the
   envelope, etc.)
