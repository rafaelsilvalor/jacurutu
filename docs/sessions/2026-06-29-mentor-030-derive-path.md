# Mentor session recap — 2026-06-29 — brief 030 `derivePath` + Drive convention

> Session type: mentoring (architectural design + mentor gate + execution
> oversight). Mentor in chat (pt-BR); this recap is English per R9 (`docs/**`).
> Pairs with the executor recap for the same session.

## One-line summary

Closed the full `derivePath` D-set, shepherded brief 030 (`feat/derive-path`)
through the mentor gate and the executor run to an approved commit #2 (PR
pending merge), and produced two human-facing artifacts (a Drive-organization
convention doc and a defense presentation) for the design team.

---

## Decisions taken (each with target)

### `derivePath` D-set — closed in chat, encoded in brief 030

Target: `docs/tasks/030-derive-path/brief.md`, implemented in
`packages/core/src/derive-path.ts`.

- **D1 — Pure core.** `derivePath` lives in `@saci/core`; no I/O, no clock, no
  network, no `customfield_*` literal (R25). Consumes resolved semantic fields.
- **D2 — Return type `readonly string[]` (segments), not a joined string.**
  Intentional deviation from `ROADMAP.md:184-186` (`→ string`); joining needs a
  platform separator and a root that `core` must not own (R1). ROADMAP
  reconciliation is a separate docs brief.
- **D3 — Path form (alpha target):**
  `<grouping> / <vertical> / <YYYY-MM> / <KEY>_<slug>`.
  Example: `AVULSAS / EC / 2026-06 / MCA-101_kv-aulao`. Ground-truth verified
  against the live Drive. Grouping sits **above** vertical (the old structure
  was `SEMESTRE / AVULSAS / <vertical> / <time…>`; the new one promotes vertical
  directly under grouping and collapses the time levels to one month).
- **grouping** = `campaign` when present, else the `"AVULSAS"` bucket constant.
  Contract `campaign: string | null`; in alpha (MCA) it is always `null`.
- **vertical** = short code extracted from the `[CODE] Name` form (FINDING 1).
  No `value→code` map in core (the codes live in Jira).
- **month** = `entrega` (delivery) → `YYYY-MM` (time discarded). `entrega` null →
  fall back to `jira_updated_at` month (FINDING 2). Both null → `UNDATED_MONTH`
  sentinel. Never reads a clock, never throws, never fabricates "today".
- **leaf** = `<KEY>_<slug>`. `KEY` guarantees uniqueness across sibling subtasks
  (including the rare non-campaign parent with multiple interlinked subtasks —
  each subtask derives its own path). `slug` = sanitized summary; empty slug →
  `KEY` only.
- **D4 — Slug sanitization (leaf only):** lowercase + NFKD diacritic strip (via
  reuse of `normalizeText` in `transform.ts` — anti-A3; NFKD is a benign
  superset of the D4-specified NFD), `[a-z0-9-]`, collapse hyphens, trim ends,
  cap 60. Grouping and vertical are codes, not free text — not sanitized.
- **D5 — Focused input type `DerivePathInput`**, not the shared `Issue` payload,
  so the `campaign` slot is satisfiable today without a speculative shared-payload
  field (A3).

### `derivePath` ratification at the mentor gate

Target: this session (gate decision).

- **FINDING 2 ratified:** `created` is absent from the payload contract, so the
  D3 "fall back to created" rule was unbuildable as written. Accepted the
  planner's resolution: fall back to **`jira_updated_at`** (in-contract,
  non-null). Conscious product call — a null-`entrega` task buckets by
  "last updated" month rather than a visible no-date bucket. The manifest
  freezes the path at `start`, so the field's mutability does not move folders.
- The gate caught this as a translation drift from the closed chat decision
  (`created` → `jira_updated_at`) even though the brief was mechanically clean
  (validator 11/11). Lesson #14 in practice.

### File-naming convention (separate concern; parked from `derivePath`)

Target: the convention doc (below); future `start`/export brief when built.

- Pattern: `<vertical>_<KEY>_<descricao>_<variante>.<ext>`.
- **Vertical as prefix** — added after Rafael tested live: Drive text search does
  **not** reliably match by folder path, so a file searched without the KEY and
  without navigating to its folder is only findable by what is in its name. The
  one field redundant with the folder that earns the duplication, because it
  serves search, not organization.
- **Demandante rejected** — the KEY already recovers it; it does not distinguish
  sibling pieces.
- **variante** = piece type (`feed`, `stories`, `carrossel`, `banner`); falls back
  to the dimension (`1080x1080`) when no type fits. Known limit: type and
  dimension share one slot, so filtering "all feeds" is not clean.
- **No version in the name** — Drive history covers it.
- Principle established: a file name carries only what distinguishes sibling
  pieces of the same task (descricao, variante) plus the KEY for traceability;
  fields constant within a task (vertical, campaign, demandante, entrega) belong
  to the KEY/folder, not the file name — unless they serve text search.

---

## Brief 030 lifecycle this session

- **Slug/number:** `030-derive-path`, P4 three-source verified (029 highest; no
  030 reserve in 029 or `CLAUDE.md` E*).
- **Branch / commit #1:** `feat/derive-path` · brief at `949c1d0`.
- **Validator:** 11/11 PASS → APPROVED.
- **Mentor gate:** APPROVED (after FINDING 2 ratification above).
- **Executor run:**
  - Pause 1 (live-Jira): FINDING 1 confirmed — `[CODE] Name` universal, 7/8 codes
    live, `EPJ` absent (a new vertical, currently filed under OAB, future
    consolidation — see parked). STOP-guard correctly did not fire (absence of a
    live task is not a malformed field). Items 2–4 approved as proposed.
  - Pause 2 (`derive-path.ts`): confirmed `parseVertical` comes from
    `transform.ts` (core), not the adapter — R25 preserved. Flagged the
    no-bracket vertical case as a gap.
  - Post-Pause-2 fix (in scope, no `transform.ts` edit): vertical guard
    `parseVertical(...) || UNKNOWN_VERTICAL`; `MONTH_SLICE_LEN = 7` tied to
    `MONTH_FORMAT`; NFKD "why" comment; +2 tests (no-bracket, empty→sentinel),
    both asserting 4 non-empty segments.
  - Pause 3: commit #2 approved — `feat(core): add derivePath folder-segment
    derivation`. `derive-path.ts` (128 lines), `derive-path.test.ts` (123 lines,
    13 tests), `index.ts` export. `tsc` clean; full repo suite 162/162; greps
    R25/R24 empty; R5/R6/R7 satisfied.
- **Status at session end:** commit #2 done; executor opening the PR; **awaiting
  Rafael's squash-merge** (caminho-A, no auto-merge).

---

## Artifacts produced (human-facing, pt-BR — not yet committed)

In `/mnt/user-data/outputs`; destination in-repo is undecided (these are
pt-BR human-facing for the design team, not dev surface):

- `convencao-organizacao-drive.md` — folder + file-naming convention for the
  design team, with the rationale (six pillars + name-standardization section).
- `defesa-organizacao-drive.html` — slide presentation defending the
  organization (Saci logo embedded inline, contrast-corrected, examples faithful
  to the live ground-truth path
  `SEMESTRE / AVULSAS / Estratégia Carreiras Jurídicas / Junho / 28.06 / 14h`).

---

## Pending / parked (non-blocking)

- **campaign resolution** — registry of parent-tasks marked as campaign + adapter
  resolution. Contract (`campaign: string | null`) only. Mechanism sketched: mark
  a parent as campaign → its subtasks inherit it; unmarked → `avulsas`.
- **copy ingestion / resolution** — copy lives across the issue graph (parent
  body, attached docs, sibling/related comments). New adapter capability.
  Strategy (resolve multi-source vs standardize upstream) undecided.
- **period → drive-root resolution** — which semester drive. Near-term config
  item (Rafael is about to switch drives). `derivePath` returns a relative path;
  roots are prepended outside it.
- **file-name generation** — when `start`/export are built; unify the file-name
  sanitizer with the `derivePath` leaf-slug sanitizer.
- **Performance flow** — derives a path (unlike PMA), but post-alpha.
- **PMA / Jornalismo** — fixed destination, single JPG, no derived path; out of
  the per-task model.
- **EPJ consolidation** — `EPJ` (Estratégia Prática Jurídica) is a new vertical
  whose demands currently file under OAB; future consolidation. `derivePath`
  already supports `EPJ` when the field returns it; migrating already-archived
  OAB folders is a separate future task (manifest freezes old paths).
- **ROADMAP reconciliation** — record the D2 deviation (`string` → segments) in a
  separate docs brief.

## Meta backlog (rule-of-three; not promoted)

Carried from recap 029 + product-map, plus this session:

- validator-does-not-check-commit-viability → refactor-then-feat rule
- FetchLike-fake-fidelity → GOTCHAS
- verify-self-reports
- M-R4 do-not-bless-a-runtime-premise-without-verification
- gh-pr-body-file-bypasses-template (R12)
- a-map-that-points-verifies-its-own-pointers
- **(new)** ground-truth-before-asserting-current-state — this session the mentor
  repeatedly mis-modeled the live Drive/Jira structure from assumption; only the
  screenshots/MCP checks corrected it. Candidate GOTCHAS/MENTOR_BRIEF note if it
  recurs.

---

## Next concrete action

1. **Merge the brief 030 PR** (squash) once reviewed in the GitHub UI; fill the
   PR template (R12). Two commits: `docs(tasks): add brief for 030-derive-path`
   and `feat(core): add derivePath folder-segment derivation`.
2. **After merge — cache-swap ritual:** this mentor recap swaps into the working
   set; brief 030 drops (merged); the executor recap does not persist. Also still
   pending from this session's open: prune brief 029 (merged) and the executor
   product-map recap, if not already done.
3. **Next workflow-loop brief scoping (next session):** `derivePath` unblocks the
   `start` command, the natural next loop action. But `start` also depends on
   template management (greenfield) and the period→drive-root config. Sequencing
   the next brief is the next mentoring decision — not fixed here.

---

## Paste-ready snippet for the next session

```
Olá. Continuando o projeto Saci. Modo: mentoria.

Última entrega: brief 030 derive-path mergeado (derivePath puro em @saci/core —
forma <grouping>/<vertical>/<YYYY-MM>/<KEY>_<slug>, segmentos, total). Primeiro
tijolo do loop de produção.

Estado: sem brief ativo. Loop ainda greenfield exceto derivePath. Próximo passo
é escopar o próximo brief do loop — start (scaffold) é o candidato natural, mas
depende de template management (greenfield) e de period→drive-root (config).
Sequenciar isso é a decisão de abertura.

Parqueados: campaign resolution, copy ingestion, period→drive-root, Performance,
PMA fixo, file-name generation, consolidação EPJ.

Carrega CLAUDE.md, MENTOR_BRIEF.md e o recap mais recente em docs/sessions/.
Antes de propor próximo passo, confirma em uma frase quem entendeu que sou e o modo.
```
