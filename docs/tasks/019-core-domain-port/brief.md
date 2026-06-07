# Brief: 019 — Core domain port (Phase 2)

> **Category:** L
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `feat/core-domain-port`

---

## Context

Phase 2 of the v2 roadmap ports the Python automation seed's pure domain layer
into the `@saci/core` TypeScript package. The seed is vendored, read-only, at
`automation/` (see `automation/README.md` — frozen reference, not subject to
R9). This is the **first code brief** of the v2 effort: it establishes the
core/adapter boundary in real code. The brief specifies behavioral contracts
(EARS) and field contracts; the executor designs the implementation and
presents it at Pause 1.

The architectural cut is non-negotiable: `core` knows only plain values
(strings, token sets, value objects). It never navigates Jira-instance
accidents (`customfield_*` ids) or the Jira/ADF wire shape — that is the future
Jira adapter's job (Phase 3/4), explicitly out of scope here.

## Goal

Port the pure domain functions and the shape-independent policy from the Python
seed into `@saci/core`, with `node:test` coverage; define the payload v2.0
types, the three gateway port interfaces, and the `Workspace` / `TaskManifest`
type contracts; then widen the ROADMAP Phase 2 exit criterion to reflect that
pure policy also lives inside `fetch.py`, not only `lib_transform.py`.

Out of scope (STOP and report if approached):

- **Any adapter implementation.** `build_issue_entry`, `safe_get_entrega`,
  `safe_get_vertical`, `adf_extract_*`, `extract_urls_from_comments`, and the
  Jira-navigation halves of `resolve_copy` / `best_sister_match` all defer to
  the Jira adapter brief (Phase 3/4).
- **Editing `automation/`.** It is a frozen reference: read to ground the port,
  do not modify, do not add to the port's scope, do not R9-translate its pt-BR.
- **Any package other than `packages/core`** (plus the `docs/ROADMAP.md` fix).
  No work in `adapter-jira`, `adapter-sheets`, `cli`.
- **Any I/O** inside core (no filesystem, network, gspread, requests).
- **Consolidating** `summaryTokens` and `tokensForPairing` — they use different
  stopword sets and length thresholds; merging is a behavior change, defer.
- **`FieldMapping` type**, user-editable filter/JQL config — Phase 3.
- **`derivePath`** — pure, but ROADMAP scopes it to Phase 3.
- **Library naming / import choices** for Jira REST or Sheets — Phase 4 (Parking
  lot item 1).
- **`CLAUDE.md` edits.**

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   `docs/tasks/019-core-domain-port/**`, `packages/core/**`,
   `docs/ROADMAP.md`. If anything else needs changing, **STOP and ask**.
   (Judgment Flag 4 — package boundary guard, below.)
2. Follow all rules in `CLAUDE.md` — especially R20 (strict mode), R21 (ESM,
   `.js` extension in imports), R22 (no bundler; `tsc` per package), R23
   (`node:test`, colocated `*.test.ts`), R24 (no `any`), R25 (hexagonal
   dependency direction: `core` never imports from adapters).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `feat/core-domain-port`
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
4. **Core purity (Judgment Flag 1).** Every ported core function operates on
   plain values / strings / token-sets only. No dict navigation of raw
   Jira/ADF shapes inside core. If a function needs `issue["fields"]...`, it is
   adapter, not core — **STOP and confirm** before placing it in core.
5. **No source invention.** Constants, regexes, stopword sets, and payload
   field names/types/nullability are read verbatim from `automation/` on disk.
   Where the source is ambiguous, **STOP and report** — do not paraphrase or
   invent (Judgment Flags 2 and 3).
6. **No STATE.md.** Category L but single-session execution is expected; per
   `docs/GIT_WORKFLOW.md` G-R10, STATE.md is conditional on multi-session or
   structural complexity. Skip unless the user requests it.

### Conventions

- Language: English-only on this surface (R9 — `docs/tasks/**`, code,
  identifiers, comments, commit messages). The vendored `automation/` pt-BR is
  exempt (frozen reference) and must not be translated.
- Commit types: `feat(core)` for code and types; one final `docs(roadmap)`
  commit for the exit-criterion widening.
- TS naming: port Python `snake_case` to TS `camelCase` function names
  (`normalize_text` → `normalizeText`, `slug_nome_curto` → `slugNomeCurto`,
  etc.). Constants keep `SCREAMING_SNAKE_CASE` (R7).
- Tests colocate as `*.test.ts` and run via `node:test` (R23). The exact
  compile-and-test integration is whatever Phase 1 bootstrap fixed; do not
  introduce a new runner.

### Architectural decisions already made (do not revisit)

#### D1 — The core/adapter cut

`core` holds pure transforms and pure policy operating on plain values. The
Jira-shape-coupled halves (raw-JSON navigation, `customfield_*` mapping, ADF
URL gathering) belong to the future Jira adapter and are out of scope. The
executor does not port adapter functions into core "for completeness".

#### D2 — Policy functions are decoupled from Jira navigation

`bestMatchByTokenOverlap` and `pickCopy` are the shape-independent halves
lifted out of `best_sister_match` and `resolve_copy`. Their signatures take
already-extracted plain values (token sets, URL lists), not Jira issue dicts.
The navigation that produces those values is adapter work.

#### D3 — Payload v2.0 types mirror disk nullability exactly

The payload type shape is derived from `build_issue_entry`'s return dict
(`automation/fetch.py` lines ~486-497) and `automation/payload.json`. Fields
that the Python returns as `value or ""` are non-null `string`; fields returned
as a bare nullable (`entrega_iso`, `copy_url`) are `string | null`. Do not
"tidy" nullability.

#### D4 — Port functions are behavior-preserving

This is a port, not a redesign. Each TS function reproduces the observable
behavior of its Python source for the same input. Behavior changes (e.g.
merging stopword sets) are out of scope.

## Done criteria

### Edit 1 — Verify brief on disk (committed by @planner)

This brief was authored and committed by @planner via the pipeline (commit #1).
The executor only verifies it is present; it does NOT re-commit it.

**P4 numbering evidence (recorded by the planner; re-verify on disk):**

- `ls docs/tasks/` highest entry: `018-pipeline-authoring-gate` → next is 019.
- `git log --oneline main` highest merged task: 018 (PR #40/#41). The most
  recent commit `8fada81 chore: vendor Python automation seed ... (#42)` added
  only `automation/`, no `docs/tasks/019`.
- `CLAUDE.md` `E*` exceptions: E1, E2, E3, E5 — none reserve a slot ≥ 019.

All three sources agree on 019. If `docs/tasks/019-core-domain-port/brief.md`
is missing or its first line does not match this title, **STOP and report**.

- [ ] Directory `docs/tasks/019-core-domain-port/` exists
- [ ] File `docs/tasks/019-core-domain-port/brief.md` exists; first line matches
      the title above
- [ ] The brief is already committed by @planner (do NOT re-commit)

### Edit 2 — Port the pure transforms from `lib_transform.py`

Port these pure functions (all I/O-free) from `automation/lib_transform.py`
into `packages/core`, with their constants and regexes. Read each verbatim from
disk; do not infer from this brief.

Functions: `normalizeText`, `slugNomeCurto`, `parseVertical`, `parseEntrega`,
`extractFirstDriveUrl`, `tokensForPairing`.

Constants / regexes: `STOPWORDS_SLUG`, `STOPWORDS_PAIRING`,
`MC_PARENT_GENERIC_RE`, `DAYS_PT_RE`, `URL_DRIVE_RE`.

**Judgment Flag 1 (purity) applies here.** Each function must operate on plain
strings / values only. None of these navigates a Jira dict — confirm that
before porting. If any candidate touches `issue["fields"]`, **STOP and confirm**
it does not belong in core.

EARS behavior criteria (one happy-path + one unwanted-behavior per function;
derive the remainder from the source). Examples — the executor maps each to
≥ 1 `node:test`:

- The `parseEntrega` function shall return `(date, "")` given a date-only ISO
  input (no `T`).
- If the ISO input is unparseable, then `parseEntrega` shall return
  `(null, "")`.
- While minutes are zero, `parseEntrega` shall format the time as `"<H>h"`;
  while minutes are non-zero, as `"<H>h<MM>"`.
- While the hour and minute are both zero (midnight), `parseEntrega` shall
  return an empty time string.
- The `slugNomeCurto` function shall fall back to `childSummary` when the parent
  summary is generic (matches `MC_PARENT_GENERIC_RE`) or empty.
- The `slugNomeCurto` function shall return `"demanda"` when no usable tokens
  remain.
- The `parseVertical` function shall return the bracketed content given
  `"[EC] Concursos"`, and the trimmed raw string when no brackets are present.
- The `extractFirstDriveUrl` function shall return `null` when the text contains
  no Drive/Docs URL, and strip trailing markdown/punctuation from a found URL.
- The `normalizeText` function shall lowercase and strip diacritics.
- The `tokensForPairing` function shall drop stopwords in `STOPWORDS_PAIRING`
  and tokens of length ≤ 2.

Verification:

- [ ] All six functions exist in `packages/core/src/**` with the listed names
- [ ] All five constants/regexes present, values matching `lib_transform.py`
      verbatim
- [ ] `node:test` cases cover each EARS criterion above (happy + unwanted per
      function)
- [ ] No function in this Edit reads a filesystem/network/dict-shape input
      (purity holds)
- [ ] `tsc -p packages/core` builds; tests pass

Commit: `feat(core): port lib_transform pure functions to TypeScript`

### Edit 3 — Port the shape-independent policy from `fetch.py`

Port the pure halves of the copy-resolution policy. Read sources from
`automation/fetch.py`: `tokenize_summary` (~line 335), `best_sister_match`
(~line 344), `resolve_copy` (~line 370), and `STOPWORDS_PT` (~line 123).

#### 3a — `summaryTokens` (port of `tokenize_summary`)

Port `tokenize_summary` as `summaryTokens`, bringing `STOPWORDS_PT`.

**Judgment Flag 3 (STOPWORDS_PT provenance) applies here.** Read `STOPWORDS_PT`
**verbatim** from `automation/fetch.py` lines ~123-135. Do not paraphrase,
reorder for "tidiness", or invent entries. If the set is unclear on disk,
**STOP and report**.

#### 3b — `bestMatchByTokenOverlap`

Signature: `bestMatchByTokenOverlap(targetTokens: Set<string>, candidates:
{ id: string; tokens: Set<string> }[]): string | null`. This is the
scoring/argmax core of `best_sister_match`, decoupled from Jira navigation. It
returns the best candidate `id`, or `null` when no candidate shares a token
(overlap `0`). A single candidate wins directly (mirrors the Python
`len(candidates) == 1` branch).

**Judgment Flag 1 (purity) applies here.** The function takes already-extracted
token sets — it must NOT accept or navigate a Jira issue dict. If the design
drifts toward passing `design_issue` / `candidates` as raw Jira dicts, **STOP
and confirm** the decoupled signature.

#### 3c — `pickCopy`

Signature: `pickCopy({ sisterUrls, parentUrls }: { sisterUrls: string[];
parentUrls: string[] }): { url: string | null; source: CopySource }`. This is
the sister → parent → fallback precedence policy from `resolve_copy`, with URL
gathering (ADF extraction) removed — that is adapter work.

- Sister URLs non-empty → `{ url: sisterUrls[0], source: "sister" }`.
- Else parent URLs non-empty → `{ url: parentUrls[0], source: "parent" }`.
- Else → `{ url: null, source: "fallback" }`.

**Judgment Flag 1 (purity) applies here.** `pickCopy` receives plain URL lists,
never a Jira issue dict and never performs ADF navigation. If the design pulls
ADF extraction into core, **STOP and confirm**.

EARS behavior criteria (examples; derive the rest):

- If no candidate shares a token with the target, then
  `bestMatchByTokenOverlap` shall return `null`.
- The `bestMatchByTokenOverlap` function shall return the single candidate's id
  when exactly one candidate is supplied.
- The `summaryTokens` function shall drop `STOPWORDS_PT` entries and tokens of
  length ≤ 1.
- The `pickCopy` function shall return `source: "sister"` with the first sister
  URL when sister URLs are present.
- If neither sister nor parent URLs are present, then `pickCopy` shall return
  `{ url: null, source: "fallback" }`.

Verification:

- [ ] `summaryTokens`, `bestMatchByTokenOverlap`, `pickCopy` exist in
      `packages/core/src/**`
- [ ] `STOPWORDS_PT` matches `automation/fetch.py` verbatim
- [ ] No function in this Edit accepts or navigates a Jira issue dict (purity)
- [ ] `node:test` cases cover each EARS criterion above
- [ ] `tsc -p packages/core` builds; tests pass

Commit: `feat(core): add core copy-resolution and token policy functions`

### Edit 4 — Define domain types and gateway port interfaces

Define the type contracts. These are plain types — document fields in JSDoc; do
NOT restate type shapes as EARS sentences.

#### 4a — Payload v2.0 types (JiraGateway return contract)

**Judgment Flag 2 (payload v2.0 fidelity) applies here.** Read the field names,
types, and nullability from `automation/fetch.py` `build_issue_entry` return
dict (lines ~486-497), the `fetch.py` header schema (lines ~10-33), and
`automation/payload.json`. If any field's nullability is ambiguous on disk,
**STOP and report** — do not invent.

Grounded shape (verified against `build_issue_entry` on disk):

- Top-level payload: `{ schema_version: string; run_date: string;
  generated_at: string; issues: Issue[]; filtered_out: { key: string; reason:
  string }[]; warnings: { key: string; field: string; issue: string }[] }`.
  `schema_version` is `"2.0"`.
- `Issue`: `{ key: string; summary: string; parent_key: string;
  parent_summary: string; status_jira: string; vertical_raw: string;
  entrega_iso: string | null; copy_url: string | null; copy_source: CopySource;
  jira_updated_at: string }`. Nullability rationale (D3): the Python returns
  `parent_key or ""`, `vertical_raw or ""`, `summary`, `parent_summary`,
  `status_jira`, `jira_updated_at` as non-null strings; `entrega_iso` and
  `copy_url` are bare nullables.
- `CopySource = "sister" | "parent" | "fallback"`.

#### 4b — Gateway port interfaces (interface only, zero impl, zero lib)

- `JiraGateway` — returns the payload-v2.0 `Issue[]` (the adapter maps raw Jira
  → `Issue`; `build_issue_entry` is that future adapter impl, NOT ported here).
- `SheetGateway` — port methods named in domain terms: `readRows` (read all
  rows as records) and `writeRows` (write rows). Grounded in
  `automation/lib_sheets.py` `read_rows` / `write_rows_native`, but the port
  must not carry the gspread-specific `native` qualifier. Mirror the operations,
  not the gspread types.
- `DriveGateway` — no Python precursor. Minimal surface: only ship-implied
  (upload folder) and load-implied (read manifest) operations. Mark
  Phase-3-dependent contracts as `TODO`. No speculative methods.

#### 4c — `Workspace` and `TaskManifest` interfaces (documented field contracts)

`Workspace` (2026-05-28 design — authoritative). Five facets keyed by Jira key;
no methods; no I/O. Document each field:

- `jiraKey`
- `localFolderPath`
- `appliedTemplate`
- `productionState`
- `drivePath`
- manifest reference (reference to the `TaskManifest`)

`TaskManifest` (2026-05-28 design — authoritative). Document each field:

- `issueSnapshot` — the Jira issue captured at start
- `templateUsed`
- `drivePath`
- `eventHistory` — start / ship / load / handoff events
- `claimed_by` — **OPTIONAL** field; concurrency-defense whose semantics are
  Phase 3. Define the optional field with a doc comment only; no behavior.

Verification:

- [ ] Payload types, `CopySource`, `JiraGateway`, `SheetGateway`,
      `DriveGateway`, `Workspace`, `TaskManifest` all defined in
      `packages/core/src/**`
- [ ] `Issue` field names/types/nullability match `build_issue_entry` on disk
- [ ] Gateway interfaces carry zero implementation and import no library
- [ ] `SheetGateway` exposes `readRows` / `writeRows` (no gspread `native`
      qualifier in the port method names)
- [ ] `DriveGateway` Phase-3-dependent methods marked `TODO`; no speculative
      methods present
- [ ] Every field of `Workspace` and `TaskManifest` has a JSDoc contract;
      `claimed_by` documented as optional / Phase-3 semantics
- [ ] `grep -rn 'from.*adapter' packages/core/` returns no matches (R25)
- [ ] `tsc -p packages/core` builds (strict, no `any`, no `@ts-ignore`)

Commit: `feat(core): add payload v2.0 types and gateway port interfaces`

### Edit 5 — Widen the ROADMAP Phase 2 exit criterion

In `docs/ROADMAP.md`, the Phase 2 exit criterion currently begins (lines
~90-91):

> **Exit criterion:** every pure-domain function in `lib_transform.py`
> has a TS equivalent in `core` with `node:test` coverage;

Widen the scope to acknowledge that pure policy also lives inside `fetch.py`.
Replace the `lib_transform.py`-only phrasing with wording equivalent to:

> every pure-domain function in the Python seed — currently split between
> `lib_transform.py` and the shape-independent policy inside `fetch.py`;
> Jira-shape-coupled functions remain in the adapter —

Read the exact current wording from disk before editing; preserve the rest of
the exit-criterion sentence (the `JiraGateway` / `SheetGateway` / Drive port /
payload / `Workspace` / `TaskManifest` clauses) unchanged.

Verification:

- [ ] `docs/ROADMAP.md` Phase 2 exit criterion mentions both `lib_transform.py`
      and the `fetch.py` shape-independent policy
- [ ] The remainder of the exit-criterion sentence is unchanged
- [ ] No other line of `docs/ROADMAP.md` is modified
      (`git diff docs/ROADMAP.md` shows only the exit-criterion change)

Commit: `docs(roadmap): update Phase 2 exit criterion to seed policy`

### Automated checks (run before each commit)

- [ ] `tsc -p packages/core` builds without errors (strict mode)
- [ ] `node:test` suite for `packages/core` passes
- [ ] No `any`, no unjustified `// @ts-ignore` / `// @ts-expect-error` (R20/R24)

### Structural checks

- [ ] Expected files exist under `packages/core/src/**`
- [ ] No file outside the in-scope list was modified
      (`git diff --name-only origin/main..HEAD` ⊆
      {`docs/tasks/019-core-domain-port/**`, `packages/core/**`,
      `docs/ROADMAP.md`})
- [ ] `automation/` is untouched (`git diff --name-only` shows no `automation/`)

### Behavior checks

- [ ] Each ported function reproduces its Python source's behavior for the
      sampled inputs (D4)
- [ ] `parseEntrega` midnight, date-only, and unparseable edge cases covered
- [ ] `bestMatchByTokenOverlap` zero-overlap and single-candidate cases covered
- [ ] `pickCopy` sister / parent / fallback precedence covered

### Git checks

- [ ] Branch used: `feat/core-domain-port`
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] `Plan required: yes` — numbered plan presented and approved before any
      change (Pause 1)
- [ ] Pause 2 — first modified file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message shown
      before each commit
- [ ] `pre-commit-self-audit` skill output reported in chat before each Pause 3
- [ ] Each of the four Judgment-flag STOP-and-confirm guards honored at its
      location
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

Pauses are named in English (R9). The pt-BR form "Pausa" appears only in
`harness/` human-edited prose.

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code):** present a numbered implementation plan and
  wait for approval. **Required** (`Plan required: yes`) — this is the first
  code brief; the executor designs file layout, function placement, and the
  test structure, then waits.
- **Pause 2 (after the first modified file):** show the result and wait for
  review. **Always required.**
- **Pause 3 (before each commit):** show `git status` + `git diff --stat` +
  proposed message + `pre-commit-self-audit` output. **Always required.**

Judgment-flag guards (STOP and confirm at the named location):

- **Flag 1 — purity at port time:** at every Edit porting a core function
  (Edits 2, 3a, 3b, 3c). If a function silently performs I/O or needs
  `issue["fields"]...` navigation, STOP and confirm — it is adapter, not core.
- **Flag 2 — payload v2.0 fidelity:** at Edit 4a. Read `payload.json` +
  `fetch.py` header + `build_issue_entry` from disk; if nullability is
  ambiguous, STOP and report.
- **Flag 3 — STOPWORDS_PT provenance:** at Edit 3a. Read `STOPWORDS_PT`
  verbatim from `fetch.py`; do not paraphrase.
- **Flag 4 — package boundary:** at any file write outside `packages/core`
  (other than `docs/tasks/019-core-domain-port/**` and the `docs/ROADMAP.md`
  Edit 5 fix). STOP and report — this brief touches `packages/core`
  exclusively plus that one ROADMAP fix.

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md` as a
  follow-up brief.

**DO NOT proceed "fixing" things without permission.**

## Git workflow

### Branch

`feat/core-domain-port`, branched from up-to-date `main`. Commit freely; **do
not push** (G-R5 / R17). Push is the user's call.

### Commit sequence

1. `docs(tasks): add brief for 019-core-domain-port`
2. `feat(core): port lib_transform pure functions to TypeScript`
3. `feat(core): add core copy-resolution and token policy functions`
4. `feat(core): add payload v2.0 types and gateway port interfaces`
5. `docs(roadmap): update Phase 2 exit criterion to seed policy`

Commit #1 (the brief) was authored and committed by @planner; the executor runs
commits #2–#5 only.

Each subject is imperative, ≤ 72 chars (verified by the planner), and its
leading verb (`add`, `port`, `update`) is on the `pre-commit-self-audit`
allowlist. Note: commit 5's intended sense is "widen the criterion" — that verb
is not on the allowlist, so the subject uses the allowlisted `update`.

## Plan required justification

`Plan required: yes`:

- First code brief — the executor designs the file layout within
  `packages/core/src/**`, the function/type placement, and the `node:test`
  structure. The brief fixes contracts (EARS, field shapes) and the
  core/adapter boundary, not the implementation.
- Multiple porting decisions (how to split files, how to represent the
  date-time parsing, how to model the gateway ports) remain open for the
  executor to propose at Pause 1.
- Four Judgment-flag guards require live judgment against disk during
  execution.

**Pause 2 and Pause 3 remain required** regardless — Lesson #6 of
`docs/AGENT_PLAYBOOK.md`.

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules (esp. R20-R25, R9)
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — known traps
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
5. `.claude/skills/brief-template/SKILL.md` — template reference
6. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit (Pause 3)
7. `automation/README.md` — frozen-reference posture
8. `automation/lib_transform.py`, `automation/fetch.py`,
   `automation/lib_sheets.py`, `automation/payload.json` — port sources
9. `docs/ROADMAP.md` — Phase 2 goal / exit criterion

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Any verification checkbox from this brief that could not be met, with
   explanation
4. Confirmation that no `git push` was executed
5. Suggested next step (open PR, follow-up brief, etc.)
