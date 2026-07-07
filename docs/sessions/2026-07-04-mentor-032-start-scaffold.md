# Mentor session recap — 2026-07-04 — 032 start-scaffold (start command v0)

> Session type: mentoring (design) + pipeline supervision (caminho A, brief 032).
> Outcome: D-set D1–D7 closed; brief 032 authored, validated (11/11), gated,
> and executed through implementation. Session loss interrupted close-out;
> recovery protocol issued. See "Execution status" below.
>
> NOTE TO COMMITTER: if PR merge completed before this file is committed,
> update the "Execution status" section with the PR number and merge SHA.

## Decisions taken (D-set, ratified one at a time in chat)

### D1 — `start` v0 is local-only

Scaffold = derivePath leaf folder + D-A internal structure (`editaveis/`,
`editaveis/assets/`) + template copied/renamed into `editaveis/` +
`.saci.json` at root. Drive is `ship` territory; no remote mirror at start
time. Rationale: `adapter-drive` does not exist; an empty remote folder
serves no one and complicates the `ship` create-vs-update contract; Drive
only sees delivered work. Cost accepted: between `start` and `ship` the
task exists locally only.

### D2 — Metadata via live Jira fetch at start time

No cache consumption. The month segment of derivePath comes from the
DELIVERY date (brief 030); stale cache would scaffold into the wrong month
folder — the exact manual pain Saci exists to remove. Fail-loud contract:
no Jira, no scaffold. The issue snapshot in the manifest is the
start-moment snapshot; continuous status tracking is a future command
(`status`/`list`), not a `start` concern.

### D3 — Open-in-software deferred (out of v0)

Platform-specific glue (R1 surface) with zero domain logic. `start` v0
ends by printing the created folder and editable paths. Follow-up brief.

### D4 — Template source: locally configured path; `--blank` in v0

Templates come from `templates/<vertical>/...` under a configured root.
Remote catalog/download is its own future brief. `--blank` flag ships in
v0: skips the template copy, everything else identical (designer creating
from zero).

### D5 — Collision: detect, explain, stop

Leaf folder already exists → explanatory report (does it contain
`.saci.json`? `editaveis/`?), list of user options, exit non-zero. Nothing
destructive, no interactive prompt in v0. Resume semantics belong to
`load`/Phase 3 state.

### D6 — New port method `fetchIssueByKey(key): Promise<Issue>`

Added to `JiraGateway`, implemented in `adapter-jira` via JQL
`key = <KEY>` over the existing `searchJql` wire operation — no new wire
ops, no single-issue REST endpoint. Fail-loud: zero or >1 results throws
naming the key; no `Issue | null`. Ground-truth inventory (executor-run)
confirmed no by-key path existed; the internal `key IN (...)` pattern
proved the JQL route.

### D7 — Two roots as CLI flags; app config file stays parked

`--workspace-root` (required) and `--templates-root`, following the
existing pattern (env for credentials, flags for the rest). An app-level
config file is a larger surface decision — parking lot, own session.
A3 (premature abstraction) applies to a "config just for two roots".

## Planner-unilateral decisions, explicitly ratified at the mentor gate

- **P1 — `--templates-root` optional, default = sibling `templates/` of
  the workspace root.** Common invocation works flagless; `--blank` needs
  no template source.
- **P3 — Single-key lookup skips `applyOwnFilters` /
  `applyParentTemplateFilter`.** Filters cut the working *set*; a
  user-named key means selection already happened. Designed behavior,
  recorded in the brief.
- **P4 — v0 template-source contract: exactly one file per
  `templates/<vertical>/`, fail-loud otherwise.** Any multi-file choice
  rule would be an improvised proto-catalog. Ratified with the cost named:
  a vertical with two legitimate templates must pick one until the catalog
  brief lands.
- **P6 — Build-integrity ripple: atomic commit #2.** Core port + adapter
  impl + adapter tests + the inline fake stub in `run-fetch.test.ts` land
  as one commit so every package stays green — mirrors brief 031's atomic
  pattern.
- **Template rename (v0): reuse the derivePath leaf stem `<KEY>_<slug>`**
  + original extension. No new core function; the full naming convention
  (vertical/desc/variation, separators, date format) remains the open
  ROADMAP pending decision and lands in its own brief together with the
  sanitization unification. Mass-rename at that point is acceptable.

## Pause 1 ruling — STATE.md skipped

Executor surfaced the Cat-L-vs-constraint-1 tension and stopped to ask
(correct Pause 1 behavior). Ruling: skip. (1) Source hierarchy — the
in-flight brief's allowed-path list excludes STATE.md and fixes 3 commits;
(2) G-R10 targets multi-session context preservation, and this is a
single-session run with a closed plan; (3) the offered alternative placed
STATE.md under `docs/tasks/`, diverging from G-R10's repo-root definition —
a sign the rule was being fitted, not applied. Cost accepted knowingly:
recovery after session loss leans on brief + git log. (That cost was then
paid — see below — and the brief proved prescriptive enough.)

## Executed artifact

- **Brief 032** (`docs/tasks/032-start-scaffold/brief.md`), Category L,
  caminho A (planner → brief-validator APPROVED 11/11 → mentor gate →
  executor), branch `feat/start-scaffold` cut from `0efbad6`.
- P4 numbering: three sources agree on 032 (highest dir 031; tip
  `0efbad6` docs #78, parent `2071baf` #77 brief 031; no E-slot reserve).
- Commit plan: #1 `docs(tasks): add brief for 032-start-scaffold` →
  #2 `feat(core): add fetchIssueByKey to JiraGateway port` (atomic per P6)
  → #3 `feat(cli): add start subcommand for local scaffold`.
- All three judgment-flag guards verified HOLD at Pause 1:
  `buildIssueEntry` (mapper.ts:57) reusable as a factored unit;
  `ParsedCommand` union extends cleanly with a fifth kind; naming via
  leaf stem confirmed against derive-path.ts.

## Execution status at recap time

Executor reported **implementation complete**; the Code session was lost
**before close-out** (final report, PR, merge). A read-only recovery
inventory was issued from chat (branch state, commit count vs. the
3-commit plan, tree cleanliness, push status, test count, conformance
sample on `gateways.ts` and `argv.ts`). Recovery doctrine applied:
ground-truth before action; reconciliation against the brief, never
regeneration from memory. **Close-out completed (2026-07-07):** branch
pushed on explicit authorization, PR #79 opened with the template, squash
merged → `main@85ff582`; post-merge cleanup done (local branch deleted,
remote ref pruned). Execution-side detail: `2026-07-07-executor-032-start-scaffold.md`.

## Deferred / parked (new this session)

1. **Keyless start / local task identity** — Rafael raised hash-based IDs
   for tasks with no Jira card yet. Mentor direction recorded: hash is the
   wrong tool (no content to hash at start time; hostile as a folder
   name); explore a Jira-mimicking local key with a reserved prefix
   (e.g. `LOC-<seq>` or date+suffix), tension = sequential-needs-state vs.
   stateless-date-collides. Any variant makes `jiraKey` hold non-Jira
   values → field rename or `origin` discriminator → **schemaVersion 2**
   territory. Explicitly kept OUT of 032 (conflicts with D2). Own mentor
   session required.
2. **Open-in-software** (D3) — small follow-up brief.
3. **Template naming convention + sanitization unification** — unchanged
   ROADMAP pending decision; v0 leaf-stem reuse does not prejudge it.

## Pending items (carried, unchanged)

1. **Docs reconciliation session (accumulating, one PR):** derivePath D2
   deviation (segments return type) in ROADMAP/MENTOR_BRIEF §2; Phase 2
   exit criterion mentioning the removed `Workspace` type.
2. **Parked cluster:** template catalog, campaign resolution, copy
   ingestion, period→semester-folder config, Performance flow,
   PMA/Jornalismo fixed destination, EPJ consolidation, automatic
   file-name generation.

## Next concrete action

Complete brief 032 close-out: recovery inventory → reconcile against the
3-commit plan → (commit #3 completion if needed, with self-audit) → push
on explicit authorization → PR with template → squash-merge. Then the
post-merge cache-swap ritual. Front-runner for the next mentor session:
**keyless start / local task identity** (schemaVersion 2 D-set) or the
accumulated docs reconciliation.

## Paste-ready snippet for next session

```
Ola. Continuando o projeto Saci. Modo: [mentoria | revisar plano | ...]
Ultima entrega: brief 032 start-scaffold — comando `start` v0 implementado
(local-only: pasta derivePath + estrutura D-A + template copy/rename ou
--blank + .saci.json; fetchIssueByKey novo no port JiraGateway via JQL
key=<KEY>; colisao fail-loud explicativa; dois roots via flags,
--templates-root default irmao templates/). PR #79 mergeado a main@85ff582
(close-out feito apos recuperacao de sessao perdida).
TEMA DESTA SESSAO: [keyless start + schemaVersion 2 | docs reconciliation
(D2 derivePath + Workspace no Phase 2 exit) | open-in-software brief |
campaign resolution].
Carrega CLAUDE.md, MENTOR_BRIEF.md, ROADMAP.md e o recap
docs/sessions/2026-07-04-mentor-032-start-scaffold.md.
Antes de propor proximo passo, confirma em uma frase quem sou e o modo.
```
