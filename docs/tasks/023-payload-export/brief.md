# Brief: 023 — Payload export (issue → flat record projection)

> **Category:** M
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `feat/payload-export`

---

## Context

Product pivot (supersedes the ROADMAP Phase 4 wording, which is stale until a
separate docs PR lands): the application — not the Google Sheet — owns
production state. A spreadsheet becomes one of several one-way projection
targets. There are no production users of the Python automation today, so the
legacy `automation/sync.py` / `lib_sheets.py` carry no behavior-preserving
mandate; they are legacy reference only.

This brief delivers a pure issue→flat-record projection in `@saci/core` plus a
`runExport` composition function in `@saci/cli`. `runExport` reads a
`payload.json`, applies a named export profile from a JSON config file, and
writes `.csv` / `.json` output. Fixture-tested end to end: no credentials, no
network. It builds directly on the payload v2.0 contract (`packages/core/src/
payload.ts`) and the `run-fetch.ts` composition precedent shipped by brief 022.

## Goal

Add a pure `Issue → flat record` projection (fixed canonical column superset
v1) and pure profile-driven selection/filter logic to `@saci/core`, and a
`runExport` composition function in `@saci/cli` that reads a payload, applies a
named profile from a JSON config, and writes a `.csv` or `.json` output file.

Out of scope:

- `cli.ts` — stays UNTOUCHED. `runExport` is a standalone testable composition
  function; argv/command wiring is Phase 3 (D9). Editing `cli.ts` → STOP.
- `docs/ROADMAP.md` — stale on the pivot; reconciled in a separate docs PR. Do
  NOT edit it here.
- `automation/**` (`sync.py`, `lib_sheets.py`, `lib_transform.py`) — legacy
  reference only; read for grounding, never modified (D1).
- Input-side per-project Jira customfield mapping — Phase 3 FieldMapping (D5).
- Sheets one-way push and the `SheetGateway` port in `core/gateways.ts` —
  parking lot; left untouched (D6).
- Aggregation, counts, sums, grouping, `update_hub`-style metrics — never
  ported; belongs to the BI layer (D7).
- XLSX output — separate decision later; CSV + JSON only in v1 (D4).
- Spreadsheet formulas, rich/link cells, computed columns, expressions,
  templating — plain values only (D2, D3).

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/023-payload-export/brief.md` (this brief; commit #1)
   - `packages/core/src/**` (new projection/filter module + its test + index
     re-export)
   - `packages/cli/src/**` (new `run-export.ts` + its test)

   Any file write outside `packages/core`, `packages/cli`, and
   `docs/tasks/023-*/` → **STOP and surface** (Judgment Flag 3). A `cli.ts`
   edit → **STOP** (Judgment Flag 3 / D9).
2. Follow all rules in `CLAUDE.md` — especially R20 (strict TS), R21 (ESM,
   `.js` import extensions), R22 (`tsc` per package, no bundler), R23
   (`node:test`, colocated `*.test.ts`), R24 (no `any`), R25 (hexagonal:
   `core` never imports adapters; composition wires in `cli`).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `feat/payload-export`
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5 / R17)
4. **Purity (Judgment Flag 1).** The projection and filters are pure `core`
   functions over plain `Issue` / record values — no I/O, no clock, no
   filesystem, no network inside `core`. Any I/O need surfacing inside a
   `core` function → **STOP and surface**.
5. **No aggregation (Judgment Flag 2).** Any count / sum / grouping creeping
   into the export → **STOP and surface** (D7). The export is a fact table:
   one row per issue, zero aggregation.

### Conventions

- Language: agent-consumed surface is English-only (R9) — identifiers,
  comments, the brief, commit subjects. Column IDs in the superset are
  `snake_case` English.
- Commit type `feat`; scopes `core` and `cli` (and `core,cli` when a single
  commit spans both, matching the 022 precedent `feat(core,cli): ...`).
- Comments answer "why", not "what" (R8). Named constants for policy values —
  default CSV delimiter, BOM flag, column IDs (R7).
- CSV writer is hand-rolled, RFC 4180-style quoting, no new dependency (R2,
  D4).

### Architectural decisions already made (do not revisit)

Closed with the mentor in the 023 scope package. The executor implements; it
does not propose alternatives. If a decision needs to change mid-execution,
**STOP and report**.

#### D1 — New design, not a port

No production users exist. `automation/sync.py` and `automation/lib_sheets.py`
are legacy reference only — read for grounding the column superset, never as a
behavior-preserving contract.

#### D2 — Pure projection with a fixed canonical column superset v1

`core` gains a pure `Issue → flat record` projection. The superset is grounded
against `automation/sync.py` `build_new_row` (lines 47-87) and
`packages/core/src/payload.ts` on disk. Plain values only — no formulas, no
rich/link cells. Canonical superset v1 (ordered, `snake_case` IDs):

| # | Column ID | Source | Notes |
|---|---|---|---|
| 1 | `key` | `Issue.key` | issue key, identity |
| 2 | `parent_key` | `Issue.parent_key` | `""` when no parent |
| 3 | `summary` | `Issue.summary` | |
| 4 | `parent_summary` | `Issue.parent_summary` | |
| 5 | `vertical` | `parseVertical(Issue.vertical_raw)` | bracketed content |
| 6 | `entrega_iso` | `parseEntrega(Issue.entrega_iso)[0]` | `YYYY-MM-DD` or `""` (null → `""`) |
| 7 | `entrega_hora` | `parseEntrega(Issue.entrega_iso)[1]` | `"19h"` / `"19h30"` / `""` |
| 8 | `nome_curto` | `slugNomeCurto(parent_summary, summary)` | |
| 9 | `task_filha_url` | `jiraBrowseUrl(jiraBaseUrl, key)` | plain string URL; `""` when `jiraBaseUrl` absent |
| 10 | `task_pai_url` | `jiraBrowseUrl(jiraBaseUrl, parent_key)` | `""` when no parent or `jiraBaseUrl` absent |
| 11 | `copy_url` | `Issue.copy_url` | `null` → `""` |
| 12 | `copy_source` | `Issue.copy_source` | `sister` / `parent` / `fallback` |
| 13 | `status_jira` | `Issue.status_jira` | |
| 14 | `jira_updated_at` | `Issue.jira_updated_at` | raw Jira ISO; no reformatting |
| 15 | `operator` | export config top level | `""` if absent (D8) |
| 16 | `run_date` | `Payload.run_date` (envelope) | provenance (D8) |
| 17 | `generated_at` | `Payload.generated_at` (envelope) | provenance (D8) |

The Jira browse URL is produced by a pure helper `jiraBrowseUrl(baseUrl, key)`
that takes the base URL as a PARAMETER and normalizes trailing slashes,
mirroring the existing pattern in `packages/adapter-jira/src/http.ts`
(`replace(/\/+$/, "")`). No instance domain constant anywhere in
`packages/core` — the base URL is injected, following the 020 D2 precedent
(`JiraGatewayConfig`). It arrives via the optional top-level `jiraBaseUrl`
export-config field (D3); when absent, URL columns project to `""`. The column
is a plain string URL (grounded against `lib_sheets.jira_browse_url`, line
186 — not a spreadsheet link cell). Every record value is a `string`;
null/absent sources project to `""`.

#### D3 — Export config: JSON file with named profiles

The config is a JSON file with named profiles. Per-profile fields:

- `format`: `"csv" | "json"`.
- `columns`: ordered subset of the superset column IDs; each entry may carry an
  optional `rename` (output header label). Selection / order / rename ONLY — no
  computed columns, no expressions, no templating.
- `filters` (optional, see D3-filters).
- `csv` options (when `format` is `"csv"`): `delimiter`, `includeBom`.
- `output` path: stable, overwritten each run.

Two optional top-level fields live on the config root, outside the profiles:
`operator`, a string label (D8), and `jiraBaseUrl`, the Jira instance base URL
injected into the projection (D2). When `jiraBaseUrl` is absent, URL columns
project to `""`.

#### D3-filters — Optional filters (default = export everything)

Both optional; default behavior exports every issue.

- `status`: a set of strings matched against `status_jira`,
  case-insensitive and trimmed on both sides.
- `entrega` window: `{ from?, to? }` applied to the projected `entrega_iso`.
  Both ends are optional `YYYY-MM-DD` strings; bounds are INCLUSIVE; the
  comparison is plain lexicographic string comparison (valid for `YYYY-MM-DD`).
  When a window is set (either end present), rows with a null / empty
  `entrega_iso` are EXCLUDED (they cannot satisfy a window).

No numeric row limit. No other criteria.

#### D4 — Formats v1 = CSV + JSON

CSV writer is hand-rolled with RFC 4180-style quoting (no new dependency).
Default CSV options: `delimiter = ";"`, BOM on (pt-BR Excel). XLSX is OUT.

#### D5 — Input-side field mapping is OUT

Per-project Jira customfield mapping is Phase 3 FieldMapping. Not in scope.

#### D6 — Sheets one-way push is OUT

Parking lot (future consumer: Looker Studio reads a flat tab). The
`SheetGateway` port in `core/gateways.ts` stays untouched.

#### D7 — The export is a fact table

One row per issue, zero aggregation. `update_hub`-style metrics are never
ported; aggregation belongs to the BI layer (Looker / Power BI / Grafana).

#### D8 — Provenance stamped on every row

Every projected record carries: `operator` (string label from the export
config root, `""` if absent), `run_date`, and `generated_at` (both from the
payload envelope).

#### D9 — `cli.ts` stays untouched

`runExport` is delivered as a testable composition function (the `run-fetch.ts`
precedent from 022). Argv/command wiring is Phase 3. Editing `cli.ts` → STOP.

## Done criteria

### Edit 1 — Verify brief on disk (committed by @planner)

This brief was authored and committed by @planner via the pipeline (caminho A:
commit #1 `6b733aa`, followed by a mentor-gate revision commit on the same
branch). The executor only verifies it is present; it does NOT re-commit it.

P4 numbering evidence (recorded; three sources agree):

- `ls docs/tasks/` — highest existing slot is `022-coordination-envelope`.
- `git log --oneline main` — most recent merged work is 022 (`#52`/`#53`/`#54`);
  no merged-but-invisible brief shipped a higher slot.
- `CLAUDE.md` `E*` block — exceptions stop at `E5`; no nominal slot reservation
  there. The 023 reserve was held informally by brief 022 for
  "adapter-sheets + SheetGateway"; this scope package explicitly **redefines**
  023 = payload export. Decision recorded here (superseded reserve redefined).

- [ ] Directory `docs/tasks/023-payload-export/` exists
- [ ] File `docs/tasks/023-payload-export/brief.md` exists; first line matches
      the title above
- [ ] The brief is already committed by @planner (do NOT re-commit)

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

### Edit 2 — Add the pure projection + filter module in `@saci/core`

Create the export projection and filter logic as pure `core` functions
(suggested file `packages/core/src/export.ts`; the executor proposes the exact
layout at Pause 1):

- A fixed, ordered canonical column superset v1 (the 17 columns of D2), exposed
  as a named constant of column IDs.
- A pure projection `Issue + context → flat record`, where the context carries
  `operator`, `run_date`, `generated_at`, and the optional `jiraBaseUrl`.
  Produces a `Record<columnId, string>` (every value a `string`; null/absent →
  `""`; URL columns → `""` when `jiraBaseUrl` is absent). Uses `parseVertical`,
  `parseEntrega`, `slugNomeCurto`, and the pure `jiraBrowseUrl(baseUrl, key)`
  helper (base URL as a parameter, trailing-slash normalization mirroring
  `packages/adapter-jira/src/http.ts`). No instance domain constant in `core`
  (D2; injection precedent 020 D2 `JiraGatewayConfig`).
- Pure filter functions per D3-filters: `status` set (case-insensitive,
  trimmed) and `entrega` window `{ from?, to? }` (`YYYY-MM-DD`, both ends
  optional, inclusive bounds, lexicographic comparison; null `entrega_iso`
  excluded when a window is set).
- A pure profile applier: selection / ordering / rename of columns from the
  superset (no computed columns, expressions, or templating).
- Re-export the public surface from `packages/core/src/index.ts`.

Purity guard: no I/O, no clock, no `fs`, no network in any `core` function
(Judgment Flag 1 → STOP). No count/sum/grouping (Judgment Flag 2 → STOP).

Verification:

- [ ] New `core` module exists; `tsc -p packages/core` passes (R20-R24)
- [ ] Colocated `*.test.ts` covers projection of a fixture `Issue`, both
      filters (including null-`entrega_iso` exclusion), and rename/order
- [ ] `node:test` suite passes (R23)
- [ ] `grep -rn 'from.*adapter' packages/core/src/` returns no matches (R25)
- [ ] `grep -rni 'atlassian' packages/core/src/` returns no matches — no
      hardcoded instance domain in `core` (D2)
- [ ] No I/O / clock / fs / network primitive imported in the new `core` module
- [ ] Public surface re-exported from `packages/core/src/index.ts`

Commit: `feat(core): add issue-to-flat-record export projection`

### Edit 3 — Add the `runExport` composition function in `@saci/cli`

Create `packages/cli/src/run-export.ts` (the `run-fetch.ts` precedent, D9):

- Reads a `payload.json` and a JSON export-config file from disk.
- Resolves a named profile from the config; reads the top-level `operator` and
  `jiraBaseUrl` fields.
- Projects each `Payload.issues` entry via the pure `core` projection, passing
  the context: `run_date` / `generated_at` from the envelope, `operator` and
  `jiraBaseUrl` from the config root.
- Applies the profile filters and column selection/rename via the pure `core`
  helpers.
- Writes `.csv` (hand-rolled RFC 4180 quoting; default delimiter `";"`, BOM on)
  or `.json` to the profile's stable `output` path, overwriting each run.
- Carries no credentials and no network; I/O (read payload, read config, write
  output) lives here, not in `core`.

Verification:

- [ ] `packages/cli/src/run-export.ts` exists; `tsc -p packages/cli` passes
- [ ] Colocated `run-export.test.ts` runs the function end to end against
      fixtures (a payload + a config), asserting CSV and JSON output bytes
- [ ] CSV output begins with a BOM when `includeBom` is true; quoting handles
      delimiter, quote, and newline per RFC 4180
- [ ] `node:test` suite passes (R23)
- [ ] `packages/cli/src/cli.ts` is unmodified
      (`git diff --name-only origin/main..HEAD` excludes `cli.ts`)

Commit: `feat(cli): add runExport composition for payload export`

### Automated checks (run before each commit)

- [ ] `tsc -p packages/core` and `tsc -p packages/cli` pass without errors
- [ ] `node:test` suites pass for both touched packages

### Structural checks

- [ ] Expected files exist at expected paths
- [ ] No file outside the in-scope list was modified
      (`git diff --name-only origin/main..HEAD` ⊆ in-scope list)
- [ ] `cli.ts` absent from the diff
- [ ] `automation/**` absent from the diff
- [ ] `docs/ROADMAP.md` absent from the diff

### Behavior checks

- [ ] Default profile (no filters) projects every issue, one row per issue
- [ ] `status` filter matches case-insensitively and trimmed
- [ ] `entrega` window bounds are inclusive (`from` / `to` dates themselves
      match) and compared lexicographically
- [ ] `entrega` window excludes rows with null/empty `entrega_iso`
- [ ] Column rename/order reflected in output headers and column order
- [ ] CSV BOM + RFC 4180 quoting verified on a value containing the delimiter

### Git checks

- [ ] Branch used: `feat/payload-export`
- [ ] Commits follow Conventional Commits (G-R3); subjects ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] `Plan required: yes` — numbered plan presented and approved before any
      change (Pause 1)
- [ ] Pause 2 — first modified file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message shown
      before each commit
- [ ] `pre-commit-self-audit` output reported in chat before each Pause 3
- [ ] Any unmet criterion reported explicitly

## Pause points

Pauses are named in English on the agent-consumed surface (R9).

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code):** present a numbered plan and wait for approval.
  **Required** (`Plan required: yes` — new module layout in `core` + `cli`).
- **Pause 2 (after the first modified file):** show the result and wait for
  review. **Always required.**
- **Pause 3 (before each commit):** show `git status` + `git diff --stat` +
  proposed message + `pre-commit-self-audit` output. **Always required.**

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md` as a
  follow-up brief.
- Judgment Flag 1 (purity), Flag 2 (aggregation), or Flag 3 (boundary /
  `cli.ts` edit) hit → **STOP and surface**.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: yes`:

- The task introduces a new module layout in `core` (projection + filters +
  profile applier) and a new composition file in `cli` — the exact file
  boundaries and function signatures are the agent's to propose at Pause 1.
- It spans ≥ 2 files and likely ≥ 50 lines (R15), so a numbered plan precedes
  any edit.
- Decisions D1-D9 are closed, but the *how* (module split, helper placement,
  fixture shape) is still open and benefits from review before coding.

**Pause 2 and Pause 3 remain required** regardless — Lesson #6 of
`docs/AGENT_PLAYBOOK.md`.

## Git workflow

### Branch

`feat/payload-export` — branched from up-to-date `main`. No push (G-R5 / R17).

### Commit sequence

Already on the branch (caminho A; planner-authored — executor does NOT
re-commit):

1. `docs(tasks): add brief for 023-payload-export`
2. `docs(tasks): update 023 brief per mentor review gate`

Executor-authored:

3. `feat(core): add issue-to-flat-record export projection`
4. `feat(cli): add runExport composition for payload export`

Each subject is ≤ 72 chars (verified) and leads with an allowlisted verb
(`add`, `update`).

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules (R20-R25 especially)
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — known traps
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
5. `.claude/skills/brief-template/SKILL.md` — template reference
6. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit skill (Pause 3)
7. `packages/cli/src/run-fetch.ts` — composition-function precedent (D9)
8. `packages/core/src/payload.ts` — the `Issue` / `Payload` contract
9. `packages/core/src/transform.ts` — `parseVertical`, `parseEntrega`,
   `slugNomeCurto`
10. `packages/adapter-jira/src/http.ts` — trailing-slash normalization pattern
    mirrored by `jiraBrowseUrl` (D2)
11. `automation/sync.py` (`build_new_row`, lines 47-87) and
    `automation/lib_sheets.py` (`jira_browse_url`, line 186) — legacy
    grounding only (D1), not a behavior contract

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Any verification checkbox that could not be met, with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step (open PR for mentor review, follow-up brief, etc.)
