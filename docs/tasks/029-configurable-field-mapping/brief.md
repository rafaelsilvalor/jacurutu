# Brief: 029 — Input-side per-project configurable FieldMapping (Axis A only)

> **Category:** L
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `feat/configurable-field-mapping`

---

## Context

`@saci/adapter-jira` resolves two domain fields from each Jira issue — the
delivery date (`entrega`) and the `vertical` — through a single global
`DEFAULT_FIELD_MAPPING` (`packages/adapter-jira/src/field-mapping.ts:20`):
`{ entregaPrimary: "customfield_10031", entregaFallback: "customfield_11080",
vertical: "customfield_10065" }`. The mapper tries the primary field, then
the fallback (`extract.ts:173` `safeGetEntrega`).

A live Jira probe (estrategia.atlassian.net, already done; do not re-probe)
established the real per-project shape:

- **MC** (subtask issuetype COPYWRITER): `entrega` is **structured** in
  `customfield_10031`; `customfield_11080` is null. `vertical` =
  `customfield_10065`.
- **PMA** (service desk): `entrega` is in `customfield_11080`;
  `customfield_10031` is **absent** from PMA screens. `vertical` =
  `customfield_10065` (the **same** field as MC).

So today both projects resolve correctly, but **only by a coincidental
cross-project fallback chain** `primary(10031) → fallback(11080)` inside the
single global default. Nothing is broken. This brief implements **Axis A**:
input-side per-project configurable field mapping. The Python `automation/`
codebase carries no behavior-preserving mandate here.

This task descends from the **mentor gate ruling for brief 029** (Axis A,
authoring approved with conditions). All discovery and the live probe are
DONE; the verified facts below are ground truth.

## Goal

Make the input-side `entrega`/`vertical` field mapping explicitly
configurable per project at the composition root, with fail-loud validation
against the Jira field catalog (R4), and derive the fetched field list from
the active mapping. Remove the coincidental cross-project fallback for the
configured (override) path while preserving today's behavior for the
unconfigured (default) path.

The value (the brief's "why", per the ruling):

1. Each project explicitly declares its own field — no reliance on a
   coincidental fallback across projects.
2. Fail-loud validation against the project's field metadata (R4): a declared
   field absent from the catalog is a hard error, never a silent fallback.
3. The fetch field list is derived from the mapping (mandatory natives ∪
   mapped ids), narrowing the request and dropping dead wire fields.

The coincidental fallback is a dormant silent-failure hazard (an empty
`10031` on an MC item would silently yield `11080`); removing it on the
override path is the point.

Out of scope:

- **Axis B** — status-value normalization (PMA `"Concluido"` / statusCategory
  done). Do not touch status handling.
- **Axis C** — text derivation of `entrega` from free text. The probe proved
  MC `entrega` is structured at the subtask level; Axis C is not needed.
- The `saci config project add <KEY>` config generator. Not in this brief.
- **Per-project / field-context validation** (`createmeta` / screen-scoped
  field presence). Registered as a forward-item (not this task) — see the
  residual design note in D7.
- `@saci/core` — must stay pure; this brief adds nothing to it (R25).
- Sister and parent searches (`SISTER_FIELDS` / `PARENT_FIELDS`) — unchanged.
- `@saci/adapter-sheets` — parking lot, untouched.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified. If anything else
   needs changing, **STOP and ask**.
   - `docs/tasks/029-configurable-field-mapping/brief.md`
   - `packages/adapter-jira/src/extract.ts` (+ `extract.test.ts`)
   - `packages/adapter-jira/src/field-mapping.ts`
   - `packages/adapter-jira/src/mapper.ts` (+ `mapper.test.ts`)
   - `packages/adapter-jira/src/http.ts`
   - `packages/adapter-jira/src/gateway.ts` (+ `gateway.test.ts`)
   - `packages/adapter-jira/src/index.ts`
   - `packages/cli/src/field-config.ts` (NEW) (+ `field-config.test.ts`)
   - `packages/cli/src/run-fetch.ts`
   - `packages/cli/src/argv.ts` (+ `argv.test.ts`)
   - `packages/cli/src/cli.ts`
   - a test fixture config JSON under the cli test directory (path chosen at
     Pause 1, mirroring the `run-export.test.ts` fixture style)
2. Follow all rules in `CLAUDE.md`, especially:
   - **R25** — hexagonal dependency direction. `core` never imports an
     adapter; no `customfield_*` literal enters `packages/core/src`.
     Customfield ids live ONLY in the adapter and in the config fixture
     (data, not code). Validation lives in the **adapter** (it owns
     customfield ids and the HTTP client), never in `core`.
   - **R4** — no silent failure. Config/metadata validation fails loud:
     a declared field absent from the catalog THROWS, naming the field
     meaning + id. Per-issue absence of a value is NOT an error (see D4).
   - **R7** — named constants for policy values (`MANDATORY_DESIGN_FIELDS`,
     `FIELD_CATALOG_PATH`).
   - **R20 / R24** — strict mode, no `any`. Narrow the field-catalog
     response from `unknown`.
   - **R21** — ESM, `.js` import extensions on all imports.
   - **R3 / R23** — `node:test`, tests colocated as `*.test.ts`, run against
     compiled `dist/`.
   - **R5 / R6** — file ≤ 400 lines, function ≤ 50 lines. If the cli loader
     would grow `run-fetch.ts`, it lives in its own `field-config.ts` module
     (this brief mandates the separate module — see D6).
   - **A3** — abstraction earned: two real projects, two real field ids
     justify the per-project shape. **Do NOT add a speculative fallback**
     "just in case" (see D2).
3. Follow `docs/GIT_WORKFLOW.md` fully:
   - New branch: `feat/configurable-field-mapping`
   - Conventional Commits (G-R3); subjects ≤ 72 chars
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5 / R17). The session ends
     commit-ready; opening the PR / pushing is the user's later call.
4. Behavior on the **default (unconfigured)** path must be preserved: with no
   `--field-config`/`--project`, fetch behaves as today (first-non-null over
   `["customfield_10031","customfield_11080"]` === current primary→fallback).

### Conventions

- All prose and identifiers English-only (R9 — `docs/tasks/**` and code are
  agent-consumed surface).
- Commit type: mostly `refactor(adapter-jira)` and `feat(cli)`; the
  fail-loud validation and new client method are `feat(adapter-jira)`.
- Scope tags: `adapter-jira`, `cli`, `tasks`.
- Mirror `runExport`'s `--config`/`--profile` precedent exactly for the new
  fetch flags: `readFile` + `JSON.parse`, fail-loud on unknown key naming
  key + path, relative paths resolved against the config dir.

### Architectural decisions already made (do not revisit)

These were closed by the mentor gate ruling. The executor implements; it does
not propose alternatives. If a decision must change mid-execution, **STOP and
report**.

#### D1 — Two explicit, non-identical shapes

The default shape and the per-project override shape are **deliberately
different objects**. Do not assume one shape.

- **Per-project OVERRIDE config** (on disk + the selected value):
  `{ entrega: string, vertical: string }` — a **single** `entrega` key, no
  fallback.
- **DEFAULT (unconfigured)** `DEFAULT_FIELD_MAPPING`: a separate object
  retaining a best-effort ordered candidate list:
  `{ entregaCandidates: readonly string[], vertical: string }` with
  `entregaCandidates = ["customfield_10031","customfield_11080"]`,
  `vertical = "customfield_10065"`. First-non-null over this ordered list is
  behavior-equivalent to today's primary→fallback.

#### D2 — No speculative fallback (A3)

Do NOT add a fallback candidate to the override path "just in case". Only a
real **within-project** variance would justify >1 candidate per project, and
there is **no evidence** of that. If ever confirmed, it would be modeled as
an explicit ordered candidate list resolved first-non-null with
fail-loud-if-ALL-absent (never a silent primary/fallback) — and only then.

#### D3 — One resolved shape consumed by mapper/extract

The mapper and extract consume a single normalized type:
`ResolvedFieldMapping = { entregaCandidates: readonly string[]; vertical: string }`.

- The composition root normalizes an override `{ entrega, vertical }` to
  `{ entregaCandidates: [entrega], vertical }` (a 1-element list — faithfully
  "no fallback").
- `DEFAULT_FIELD_MAPPING` already has this shape, so it is passed through
  unchanged.

#### D4 — Per-issue absence is legitimate, not an error

`safeGetEntrega(fields, candidates)` iterates the candidate ids and returns
the first truthy `[value, srcId]`, else `[null, null]`. An issue with no
`entrega` value → `entrega_iso = null` is a **legitimate** payload outcome,
not an error. The fail-loud rule (R4) is about CONFIG/METADATA validation,
never per-issue value absence.

#### D5 — Derived design-field list

Replace the hardcoded `DEFAULT_DESIGN_FIELDS` with a derivation:

`designFields = MANDATORY_DESIGN_FIELDS ∪ entregaCandidates ∪ [vertical]`,
deduped, where `MANDATORY_DESIGN_FIELDS = ["summary","status","parent",
"updated"]` (new R7 constant — these natives are always needed: `summary`
for summary + Template filter, `status` for the status filter, `parent` for
parent key / grouping / Template, `updated` for `jira_updated_at`).

This intentionally **drops** the dead `customfield_11035` and
`customfield_10067` fields (requested today but never consumed by the
mapper) — note that narrowing as a benefit. `SISTER_FIELDS` / `PARENT_FIELDS`
are unchanged.

#### D6 — Config loader in its own composition-root module

The cli config loader lives in a NEW module `packages/cli/src/field-config.ts`
(not inline in `run-fetch.ts`), to respect R5/R6 and keep `run-fetch.ts`
small. It reads `--field-config` via `readFile` + `JSON.parse`, selects
`--project`, throws on an unknown project key (mirror `runExport`'s
unknown-profile throw, naming key + path), and produces the normalized
`ResolvedFieldMapping`. `cli.ts` wires the result through
`makeGatewayFactory` into `JiraGatewayConfig.fieldMapping`.

Config file shape:

```json
{
  "projects": {
    "MC":  { "entrega": "customfield_10031", "vertical": "customfield_10065" },
    "PMA": { "entrega": "customfield_11080", "vertical": "customfield_10065" }
  }
}
```

#### D7 — Validation scope: global catalog existence check (gate-ruled)

**Precise intent (gate ruling update):** fail loud when a configured field id
does **not exist** (a typo / nonexistent id); never silently substitute a
value from a sibling field. This is an *existence* check, not a
*project-applicability* check.

Before the main design search, the gateway fetches the Jira field catalog
once via a NEW http method `getFields()` → `GET /rest/api/3/field` (returns
all fields in one response; no pagination), builds a `Set` of known field
ids, and asserts every active-mapping id (all `entregaCandidates` + `vertical`)
is present. A missing id THROWS, naming the field meaning + id (R4).

**Documented limitation:** the global check verifies field **existence**, not
**project applicability**. A field that exists globally but is not on a
specific project's screens (the "PMA has `10031` globally but not on its
screens" case) is **NOT** rejected by this check; at runtime it degrades to
`entrega_iso = null` — the legitimate D4 outcome, visible in the payload —
never a silently grabbed sibling value. The silent-WRONG-value hazard is
removed by the `entrega` collapse (single key, no fallback — D1/D2), **not** by
validation. Per-project / field-context validation is a **forward-item, not
this task**: `createmeta` reflects create screens only → false negatives for
edit-only fields and false-positive rejection of valid configs; the
field-context API is heavier still. Poor cost/benefit; not required here.

**Orthogonal (note, no action):** a configured field that exists but is
*semantically wrong* (e.g. `entrega` pointing at the `vertical` id) is caught
by neither check — a human-review concern, orthogonal to D7.

#### D8 — CLI flags: both-or-neither

New `argv.ts` `CLI_OPTIONS`: `field-config` (string, path) and `project`
(string, KEY). The fetch branch of `routeCommand` and the fetch
`ParsedCommand` variant carry optional `fieldConfig?` + `project?`.

- Both present → override mode.
- Neither present → default mapping (current behavior preserved).
- Exactly one present → usage error (exit code 2).

`USAGE` text is updated. Mirror the existing `--config`/`--profile` parsing
exactly.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The brief is pre-saved to `docs/tasks/029-configurable-field-mapping/brief.md`.
The executor verifies presence and commits.

P4 numbering evidence recorded at authoring time (three sources, all agree):

- `ls docs/tasks/` highest existing slot = `028-cli-human-display`.
- `git log --oneline main` most recent feature merge = brief 028
  (`65442e0` PR #69, `d4f7680` PR #70). No gap before 029.
- `CLAUDE.md` `E*` exceptions reserve no slot 029 (E1, E2, E3, E5 only).

Next NNN = `029`. No conflict.

- [ ] Directory `docs/tasks/029-configurable-field-mapping/` exists
- [ ] File `brief.md` exists; first line matches the title above
- [ ] `git add docs/tasks/029-configurable-field-mapping/brief.md` staged
- [ ] Commit #1 created

Commit: `docs(tasks): add brief for 029-configurable-field-mapping`

### Edit 2 — `extract.ts`: entrega via candidate list

Change `safeGetEntrega` (`extract.ts:173`) from the
`(fields, primaryFieldId, fallbackFieldId)` signature to
`safeGetEntrega(fields, candidates: readonly string[]): [string | null, string | null]`.
Iterate `candidates` in order, returning the first truthy `[value, srcId]`;
return `[null, null]` if none match (D4). `safeGetVertical` (`extract.ts:194`)
is unchanged. Update `extract.test.ts` to cover: first-candidate hit,
later-candidate hit, all-absent → `[null, null]`, single-element list.

Verification:

- [ ] `safeGetEntrega` takes a `readonly string[]` candidates param
- [ ] No `primaryFieldId`/`fallbackFieldId` params remain in `extract.ts`
- [ ] `extract.test.ts` covers ordered iteration + all-absent + single-element
- [ ] `npm test` passes

Commit: `refactor(adapter-jira): support entrega candidate list in extract`

### Edit 3 — `field-mapping.ts`: default shape, mandatory natives, derivation

- Change `DEFAULT_FIELD_MAPPING` (`field-mapping.ts:20`) to the new shape
  `{ entregaCandidates: ["customfield_10031","customfield_11080"], vertical:
  "customfield_10065" }` (D1).
- Add `MANDATORY_DESIGN_FIELDS = ["summary","status","parent","updated"]`
  as a named R7 constant.
- Add a `deriveDesignFields(mapping: ResolvedFieldMapping): string[]` helper
  computing `MANDATORY_DESIGN_FIELDS ∪ entregaCandidates ∪ [vertical]`,
  deduped (D5).
- Remove `DEFAULT_DESIGN_FIELDS` (and with it the dead `customfield_11035`
  / `customfield_10067` request entries). `SISTER_FIELDS`, `PARENT_FIELDS`,
  `COPYWRITER_ISSUETYPE`, `TEMPLATE_MARKER`, `FILTERED_STATUSES`,
  `DEFAULT_MAX_RESULTS` are unchanged.

Verification:

- [ ] `DEFAULT_FIELD_MAPPING` has `entregaCandidates` + `vertical`; no
      `entregaPrimary`/`entregaFallback`
- [ ] `MANDATORY_DESIGN_FIELDS` declared in `SCREAMING_SNAKE_CASE` (R7)
- [ ] `deriveDesignFields` dedupes and contains no `11035`/`10067`
- [ ] `DEFAULT_DESIGN_FIELDS` no longer exists (grep returns nothing)

Commit: `refactor(adapter-jira): add derived design field list`

### Edit 4 — `mapper.ts`: consume `ResolvedFieldMapping`

- Replace `interface FieldMappingConfig { entregaPrimary; entregaFallback;
  vertical }` (`mapper.ts:50`) with
  `interface ResolvedFieldMapping { entregaCandidates: readonly string[];
  vertical: string }`.
- `buildIssueEntry` (`mapper.ts:73`) calls
  `safeGetEntrega(fields, fieldMapping.entregaCandidates)` and
  `safeGetVertical(fields, fieldMapping.vertical)`.
- Update `mapper.test.ts` accordingly.

Verification:

- [ ] `ResolvedFieldMapping` defined; `FieldMappingConfig` gone
- [ ] `buildIssueEntry` passes `entregaCandidates` to `safeGetEntrega`
- [ ] `mapper.test.ts` passes

Commit: `refactor(adapter-jira): update mapper to ResolvedFieldMapping`

### Edit 5 — `http.ts`: `getFields()` field-catalog method

Add `getFields()` to `JiraHttpClient` → `GET /rest/api/3/field` via the
injected `FetchLike` transport, behind a named constant
`FIELD_CATALOG_PATH = "/rest/api/3/field"` (R7). Narrow the response from
`unknown` (R24 — no `any`); return the parsed catalog (e.g. an array of
`{ id: string }`). No pagination (the endpoint returns all fields in one
response).

Verification:

- [ ] `FIELD_CATALOG_PATH` declared as a named constant (R7)
- [ ] `getFields()` uses the injected `FetchLike`, returns a narrowed type
- [ ] No `any` (R24); response narrowed from `unknown`
- [ ] `.js` import extensions preserved (R21)

Commit: `feat(adapter-jira): add getFields field-catalog client method`

### Edit 6 — `gateway.ts`: typed mapping, derived fields, fail-loud validation

- Change `JiraGatewayConfig.fieldMapping?` (`gateway.ts:69`) to
  `ResolvedFieldMapping`; default applied (`gateway.ts:89`) remains
  `DEFAULT_FIELD_MAPPING`.
- In `fetchIssues` (`gateway.ts:100`): before the MAIN design search, call
  `getFields()` once, build a `Set` of known ids, and assert every active id
  (all `entregaCandidates` + `vertical`) is present; a missing id THROWS,
  naming the field meaning + id (R4 / D7).
- Then derive the design field list via `deriveDesignFields(fieldMapping)`
  and pass it (instead of `DEFAULT_DESIGN_FIELDS`) to
  `this.http.searchJql(...)`. Sister/parent searches unchanged.
- Update `gateway.test.ts`: (a) derived-fields assertion (request carries
  `MANDATORY_DESIGN_FIELDS ∪ candidates ∪ vertical`, no `11035`/`10067`),
  (b) validation-throw test for a missing mapping id, using the injected
  `FetchLike` fake to stub both `getFields()` and the search.

Verification:

- [ ] `JiraGatewayConfig.fieldMapping?: ResolvedFieldMapping`
- [ ] Validation runs before the main search and throws on a missing id,
      message naming meaning + id (R4)
- [ ] `searchJql` receives `deriveDesignFields(...)` output, not
      `DEFAULT_DESIGN_FIELDS`
- [ ] `gateway.test.ts` covers derived fields + validation throw
- [ ] `npm test` passes

Commit: `feat(adapter-jira): add fail-loud mapping metadata validation`

### Edit 7 — `index.ts`: export new types and helpers

Export from `packages/adapter-jira/src/index.ts` what the composition root
needs: the `ResolvedFieldMapping` type, `DEFAULT_FIELD_MAPPING` (new shape),
the per-project override config type, and `deriveDesignFields` (and any other
helper the loader uses). Keep existing exports (`JiraGateway`,
`JiraGatewayConfig`, `IssueDropLog`, `JiraHttpConfig`, `FetchLike`,
`IssueWarningLog`, field-mapping constants).

Verification:

- [ ] `ResolvedFieldMapping`, `DEFAULT_FIELD_MAPPING`, override type, and the
      derivation helper are exported
- [ ] Existing exports intact

Commit: `refactor(adapter-jira): add field-mapping type and helper exports`

### Edit 8 — `field-config.ts` (NEW): loader + project selection + fixture

Create `packages/cli/src/field-config.ts` (D6). Export a loader that:

- Reads the `--field-config` path via `readFile(path,"utf8")` + `JSON.parse`.
- Selects the `--project` entry from `projects`.
- Throws on an unknown project key, message naming key + path (mirror
  `runExport`'s `Unknown export profile: "x" (path)` style).
- Normalizes the override `{ entrega, vertical }` to a `ResolvedFieldMapping`
  `{ entregaCandidates: [entrega], vertical }` (D3).

Add a fixture config JSON under the cli test dir (path chosen at Pause 1,
mirroring `run-export.test.ts` fixtures) with the shape from D6 (MC + PMA).
Add `field-config.test.ts`: happy path (MC → 1-element candidates), unknown
project throws with key + path, malformed JSON surfaces (fail-loud).

Verification:

- [ ] `field-config.ts` exists; reads via `readFile` + `JSON.parse`
- [ ] Unknown project key throws naming key + path
- [ ] Override normalized to single-element `entregaCandidates`
- [ ] Fixture JSON present; `field-config.test.ts` passes
- [ ] `field-config.ts` ≤ 400 lines, loader fn ≤ 50 lines (R5/R6)

Commit: `feat(cli): add field-config loader with project selection`

### Edit 9 — `argv.ts`: new flags + both-or-neither + USAGE

Add `field-config` and `project` to `CLI_OPTIONS` (`argv.ts:35`). Extend the
fetch `ParsedCommand` variant (`argv.ts:23`) with optional `fieldConfig?` +
`project?`. In `routeCommand` (`argv.ts:60`), the fetch branch enforces
both-or-neither (D8): both → carry them; neither → default; exactly one →
usage error (exit 2). Update `USAGE` text. Update `argv.test.ts`: both
present, neither present, only `--field-config`, only `--project`.

Verification:

- [ ] `field-config` + `project` in `CLI_OPTIONS`
- [ ] fetch `ParsedCommand` carries `fieldConfig?` + `project?`
- [ ] Exactly-one-present → usage error path
- [ ] `USAGE` text updated
- [ ] `argv.test.ts` covers all four combinations

Commit: `feat(cli): add field-config and project fetch flags`

### Edit 10 — `cli.ts` + `run-fetch.ts`: thread mapping through

In `cli.ts` (`makeGatewayFactory`, `cli.ts:34`): when `fieldConfig` +
`project` are present, call the loader (Edit 8) and pass the resulting
`ResolvedFieldMapping` into `JiraGatewayConfig.fieldMapping`; otherwise omit
it (default applies). Update `run-fetch.ts` only as needed to pass the parsed
values through to `makeGatewayFactory` (keep `run-fetch.ts` thin per D6).
The Phase-3 comment on `cli.ts:34` that currently omits `fieldMapping` is
superseded — update it.

Verification:

- [ ] `cli.ts` wires loader output into `fieldMapping` when flags present
- [ ] Default path (no flags) unchanged — no `fieldMapping` passed
- [ ] `cli.test.ts` / `run-fetch.test.ts` pass
- [ ] Exit codes 0/1/2 preserved

Commit: `feat(cli): wire field mapping through gateway factory`

### Automated checks (run before each commit)

- [ ] `tsc -p .` builds each touched package without errors (R20 strict)
- [ ] `npm test` passes (node:test against compiled `dist/`, R3/R23)

### Structural checks

- [ ] Expected files exist at expected paths; new `field-config.ts` + fixture
      present
- [ ] No file outside the in-scope list modified
      (`git diff --name-only origin/main..HEAD`)
- [ ] `@saci/core` untouched: `git diff --name-only origin/main..HEAD` shows
      no `packages/core/` path

### Behavior checks

- [ ] Default path (no `--field-config`/`--project`): fetch resolves `entrega`
      via `["customfield_10031","customfield_11080"]` first-non-null — same as
      today
- [ ] Override path MC: `entrega` resolves from `customfield_10031` only
      (single-element candidates, no fallback)
- [ ] Override path PMA: `entrega` resolves from `customfield_11080` only
- [ ] A mapping id absent from the field catalog → hard error naming the
      field (R4); never a silent fallback
- [ ] Exactly one of `--field-config`/`--project` → usage error, exit 2

### R25 / hexagonal check

- [ ] `grep -rEn 'customfield_[0-9]' packages/core/src` returns nothing
      (customfield ids live only in the adapter + the config fixture; data,
      not core)
- [ ] `grep -rn 'from.*adapter' packages/core/src` returns nothing (R25)

### Git checks

- [ ] Branch used: `feat/configurable-field-mapping`
- [ ] Commits follow Conventional Commits (G-R3); subjects ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean at end
- [ ] **NO** `git push` was executed (G-R5 / R17)

### Process checks

- [ ] `Plan required: yes` — numbered plan presented and approved before any
      change (Pause 1)
- [ ] Pause 2 — first modified file shown for review
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message +
      `pre-commit-self-audit` output shown before each commit
- [ ] Any unmet criterion reported explicitly

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code):** REQUIRED (`Plan required: yes`). Present a
  numbered plan — including the chosen fixture path and the exact narrowed
  type for the `getFields()` response — and wait for approval.
- **Pause 2 (after the first modified file):** REQUIRED. Show the result and
  wait for review.
- **Pause 3 (before each commit):** REQUIRED. Show `git status` +
  `git diff --stat` + proposed message + `pre-commit-self-audit` output.

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md` as a
  follow-up brief.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: yes`. Although the design is fully closed in D1–D8, the task
spans two packages, ten edits, and a new module/fixture whose exact
placement and the narrowed `getFields()` response type benefit from a plan
checkpoint. Pause 1 confirms the fixture path, the response narrowing, and
the edit order before any code. Pause 2 and Pause 3 remain required
regardless (Lesson #6 of `docs/AGENT_PLAYBOOK.md`).

## Git workflow

### Branch

`feat/configurable-field-mapping` (off `main`). The brief commit (#1) is
already authored on this branch by the planner.

### Commit sequence

1. `docs(tasks): add brief for 029-configurable-field-mapping`
2. `refactor(adapter-jira): support entrega candidate list in extract`
3. `refactor(adapter-jira): add derived design field list`
4. `refactor(adapter-jira): update mapper to ResolvedFieldMapping`
5. `feat(adapter-jira): add getFields field-catalog client method`
6. `feat(adapter-jira): add fail-loud mapping metadata validation`
7. `refactor(adapter-jira): add field-mapping type and helper exports`
8. `feat(cli): add field-config loader with project selection`
9. `feat(cli): add field-config and project fetch flags`
10. `feat(cli): wire field mapping through gateway factory`

All subjects ≤ 72 chars; leading verbs (`add`, `support`, `update`, `wire`)
are in the `pre-commit-self-audit` allowlist (SSOT). Commit only; **do not
push** (G-R5 / R17).

## Reference documents (read before starting)

1. `CLAUDE.md` — R3, R4, R5, R6, R7, R20, R21, R23, R24, R25; A3
2. `docs/GIT_WORKFLOW.md` — branching, commits, hooks (G-R3, G-R5, G-A7)
3. `docs/GOTCHAS.md` — known traps
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pauses), Lesson #6
5. `.claude/skills/brief-template/SKILL.md` — template reference
6. `.claude/skills/pre-commit-self-audit/SKILL.md` — Pause 3 self-audit + verb SSOT
7. `packages/cli/src/run-export.ts` — the config-loading precedent to mirror

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Any verification checkbox that could not be met, with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step (open PR / follow-up brief, e.g. `createmeta`
   per-project validation, Axis B, or the `saci config project add` generator)
