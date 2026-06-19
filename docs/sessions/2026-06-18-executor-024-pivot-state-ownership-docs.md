# Session recap — 2026-06-18 — 024-pivot-state-ownership-docs

**Mode:** Caminho B (brief pre-authored to disk by the user) executed directly
in Code — no planner/brief-validator run this session.
**Executor:** Claude Code (this session).
**Merged via:** PR #58 (squash → `main@42fd2ee`) and a follow-up PR #59
(squash → `main@fd71a35`).

## Context

Brief 024 is the docs half of the 2026-06-12 state-ownership pivot whose code
half shipped in brief 023 (PR #55). Brief 023 deliberately left the canonical
docs stale; this PR reconciles them: **the application owns production state**;
a spreadsheet is demoted from a state-holding surface to **one optional one-way
projection target among others** (flat files, BI platforms). With no production
users of the Python `automation/`, `sync.py` / `lib_sheets.py` are legacy
reference only — the sync diff engine is never ported; only the issue → row
projection survives, as `packages/core/src/export.ts`.

Two files moved as a pair (ROADMAP update protocol): `docs/ROADMAP.md` and
`docs/MENTOR_BRIEF.md` §2. No code touched.

## Decisions realized (closed in briefs 023 + this session; not revisited)

- **App owns production state** (local now, remote later).
- **A spreadsheet is one one-way projection target among others** — not a
  state-holding surface.
- **`sync.py` / `lib_sheets.py` are legacy reference only** — no
  behavior-preserving mandate; the sync diff engine is never ported.
- **Export is a fact table** — one row per issue, zero aggregation; aggregation
  and history belong to the BI layer and to Phase 3 state.
- **`adapter-sheets` moves to the parking lot** — built only when a concrete
  consumer (e.g. Looker Studio) exists.
- **XLSX export deferred** behind a separate R2 runtime-dependency decision;
  v1 export formats stay CSV + JSON.

### Open mentor judgment calls (from the brief), resolved this session

1. **Phase 4 refilled, not emptied** — rescoped to shared/remote state +
   coordination-view-as-projection-consumer (kept the brief's proposal).
2. **Phase 4 renamed** — `Coordination as aggregated view` →
   `Shared state and the coordination view` (kept).
3. **§2 "Active focus (Phase 1)" line left stale** — user chose to keep it out
   of scope; recorded as a follow-up.

## Edits applied

### ROADMAP (PR #58, one commit) — 5 sub-edits

- **2a** — new `### 2026-06-12` identity-shift subsection (last under
  `## Identity shifts`).
- **2b** — Phase 4 fully rescoped (heading + goal + items + exit + deps). The
  authored replacement also drops the old `adapter-jira` Phase 4 item (package
  already shipped, slot 020) — preserved verbatim as authored.
- **2c** — two new `[prod]` Phase 3 items (CLI human-facing display; state &
  history accumulation).
- **2d** — two parking-lot entries (Sheets one-way push; XLSX format).
- **2e** — annotation on the JS-libraries pending decision (Sheets half gated
  on parking-lot promotion, not on Phase 4 start).

### MENTOR_BRIEF §2 (PR #58, one commit) — 2 sub-edits

- **3a** — new dated "Pivot recorded 2026-06-12 (brief 023)" bullet after the
  2026-05-28 repositioning bullet.
- **3b** — planned-packages sentence rewritten: `adapter-sheets` demoted to the
  parking lot, no longer "serves the secondary aggregation surface".

### MENTOR_BRIEF §2 — pre-pivot bullets (PR #59, one commit, user-requested)

Three **present-tense** §2 sub-bullets that the brief's scope had not touched —
and that the dated 3a bullet *superseded but did not repair* — were rewritten
because they were now false:

- *Coordination mode (secondary)* — now consumes a projection of app-owned
  shared state; a Sheet is one optional one-way projection target (a reader),
  not a state holder.
- *First-class integrations* — Sheets is not first-class; demoted to a
  parking-lot one-way projection target. Also split the JS-libraries sentence:
  the Google Sheets library is no longer pre-adapter, gated on the parking-lot
  promotion.
- *Active product direction → Phase 4* — now consolidates app-owned shared
  state; any Sheets/BI surface is a projection consumer, not the aggregation
  source.

## Pauses honored

- **Pause 1 skipped** — `Plan required: no` (all text byte-exact inline;
  STOP-if-mismatch guards; no architectural choice).
- **Pause 2** — fired between ROADMAP (fully edited) and MENTOR_BRIEF; surfaced
  judgment call #3 (Active-focus staleness) for a decision before proceeding.
  A second Pause 2 in the follow-up cycle presented the three bullet rewrites
  before committing.
- **Pause 3** — before every commit (4 commits), each on explicit user go.

## Find-block discipline (brief's central hazard)

Every "Locate" anchor was confirmed against the real file before applying, since
the brief warned each anchor was the mentor's best transcription, not guaranteed
byte-exact. One real mismatch caught: the 3a insert anchor's continuation line
began with `preserved —`, not `what changed`; the full line was re-read and the
insert landed at the correct boundary. No block was regenerated from memory.

## pre-commit-self-audit results

- **Commit #1 (brief)** — not formally audited (brief is the artifact itself).
- **ROADMAP** — Check 3 **STOP** on `record` (brief's authored verb; not in the
  allowlist). Per the skill's substitution table `record → document`; user
  chose `document`. Final 5/5 PASS.
- **MENTOR_BRIEF 3a/3b** — Check 3 **STOP** on `demote` (not in allowlist —
  note: `promote` is present, `demote` is not). The obvious `document`-led
  reword ran to 73 chars (length FAIL by 1). Resolved to
  `docs(mentor-brief): document app-owns-state pivot; demote adapter-sheets`
  (72 chars, leads with allowlist verb). Final 5/5 PASS.
- **MENTOR_BRIEF pre-pivot bullets** — verb `update` (curated) → 5/5 PASS, no
  STOP.

## Artifacts produced

- **Commits (all 2026-06-18):**
  - `docs(tasks): add brief 024 pivot docs` (`c9726cb`)
  - `docs(roadmap): document app-owns-state pivot; rescope phase 4` (`384ad03`)
  - `docs(mentor-brief): document app-owns-state pivot; demote adapter-sheets`
    (`51d2a38`)
  - `docs(mentor-brief): update section 2 pre-pivot sheets bullets` (`5ff48e1`,
    later cherry-picked as `55ae0e4`)
- **PR #58** — `docs: document app-owns-state pivot in ROADMAP + MENTOR_BRIEF
  §2`; squash → `main@42fd2ee`.
- **PR #59** — `docs(mentor-brief): reconcile section 2 pre-pivot sheets
  bullets`; squash → `main@fd71a35`.
- **This recap** — `docs/sessions/2026-06-18-executor-024-pivot-state-ownership-docs.md`.

## Learnings

- **A dated identity-shift bullet supersedes but does not repair present-tense
  claims elsewhere in the doc.** The update protocol's "add a dated subsection,
  don't silently rewrite earlier ones" rule applies to *history*. Present-tense
  assertions of current state (the three §2 sub-bullets) become *false*, not
  merely outdated, and must be rewritten — which the brief had not scoped. The
  user caught this and #59 fixed it. Rule of thumb for future pivot-docs briefs:
  enumerate the present-tense current-state claims, not just where to drop the
  dated record.

- **Caminho B bypasses brief-validator C11, so authored commit verbs surface at
  Pause 3.** Both authored subjects (`record`, `demote`) tripped Check 3. C11
  would have caught them up front. Pre-checking a Caminho B brief's commit
  subjects against the allowlist SSOT before execution would avoid two Pause-3
  STOPs.

- **Verb allowlist asymmetry: `demote` is absent while `promote` is present.**
  `demote` is a valid imperative; its absence forced a reword. Candidate to add
  to the SSOT (`.claude/skills/pre-commit-self-audit/SKILL.md`) — flagged, not
  acted on (out of this brief's scope).

- **A squash merge mid-session orphans a re-created branch.** PR #58 was
  squash-merged (and its branch auto-deleted) between commit #4 and the push.
  The push re-created `docs/pivot-state-ownership` as a zombie with no open PR.
  Recovery: the net diff vs the squashed `main` was exactly the 4th commit, so a
  clean branch off `origin/main` + cherry-pick + new PR (#59) kept history
  tidy; the orphan branch was deleted remote + local.

## Verification summary

- **Boundary (brief Judgment Flag 3):** only `docs/ROADMAP.md`,
  `docs/MENTOR_BRIEF.md`, and the brief touched. No code, no `automation/**`,
  no `CLAUDE.md`.
- **English-only (R9):** both files are agent-consumed canonical docs; all
  inserted text English.
- **Pairing satisfied:** ROADMAP and MENTOR_BRIEF §2 now agree on the pivot
  (update protocol's pair requirement).
- **No stale phrases left:** grep for `secondary aggregation` /
  `aggregation surface` / `publish state to a Sheets` in MENTOR_BRIEF → empty
  after #59.
- **No push without instruction (R17):** each push and both PRs were on
  explicit user go.

## Pending items

### Product / docs line

- **§2 section header date stamps** still read `(refreshed 2026-05-28)` /
  `(refined 2026-05-28)` while the content now reflects 2026-06-12. User chose
  to leave the stamps; candidate for a future minimal refresh.
- **§2 "Active focus (Phase 1 — monorepo bootstrap)" line** stale (we are past
  brief 023). Left out of scope by user decision.
- **`CLAUDE.md` v1-era Architecture section** separately stale; explicitly not
  this PR.

### Harness line

- **`demote` → verb allowlist SSOT** — consider adding (asymmetry with
  `promote`).
- **Caminho B pre-flight** — a lightweight verb-subject check before executing a
  hand-authored brief would catch Check 3 STOPs earlier.

### Operational

- Post-merge cleanup done: branches `docs/pivot-state-ownership` and
  `docs/pivot-sheets-bullets` deleted (remote + local); refs pruned; `main`
  fast-forwarded to `fd71a35`; temp PR-body files removed.
- This recap merged via a separate docs PR per convention.

## Next concrete action

`main@fd71a35` carries the fully reconciled pivot docs. Candidates for the next
brief: the Phase-3 CLI command surface wiring `runFetch` + `runExport` into argv
dispatch (brief 023 D9's deferred half), or a small docs-hygiene brief folding
the remaining staleness (§2 date stamps, the Active-focus line, and the
`CLAUDE.md` Architecture section) into one reconciliation pass.

## Snippet for the next session

```
Olá. Modo: [continuar | modelar tarefa].

Continuação de 2026-06-18-executor-024-pivot-state-ownership-docs.
Brief 024 = docs do pivô app-owns-state (a metade de código foi a 023).
Caminho B (brief pré-escrito pelo usuário), executado direto no Code,
sem planner/validator. Reconciliou ROADMAP + MENTOR_BRIEF §2 ao pivô:
app é dono do estado; planilha = um alvo de projeção one-way opcional
no parking lot; adapter-sheets rebaixado; export = fact table.

Entregue (main@fd71a35):
- ROADMAP: nova subseção identity-shift 2026-06-12; Phase 4 rescopado
  (estado compartilhado + coordination-view-as-projection-consumer;
  derrubou o item adapter-jira antigo, já entregue na 020); 2 itens
  [prod] na Phase 3 (CLI display, state/history); 2 entradas parking
  lot (Sheets push, XLSX); anotação na pending decision de libs JS
- MENTOR_BRIEF §2: bullet datado 2026-06-12; adapter-sheets demovido
  na linha de pacotes planejados; e os TRÊS sub-bullets em tempo
  presente reescritos (eram afirmações de estado atual que ficaram
  FALSAS, não só superadas) — via PR #59
- 4 commits; PR #58 squash→42fd2ee e PR #59 squash→fd71a35

Aprendizados:
- bullet datado de identity-shift SUPERA mas não CONSERTA afirmações
  em tempo presente no mesmo doc — essas viram falsas e precisam ser
  reescritas (a 024 não tinha escopado isso; #59 corrigiu)
- Caminho B pula o C11 do brief-validator → verbos dos subjects
  aparecem só no Pause 3 (record e demote deram STOP no Check 3)
- demote não está na allowlist (promote está) — candidato ao SSOT
- squash merge no meio da sessão órfã um branch recriado pelo push;
  recuperado com branch limpo + cherry-pick + PR novo

Pendências (fora de escopo por decisão):
- carimbos de data dos headers de §2 (refreshed 2026-05-28)
- linha "Active focus (Phase 1)" stale
- Architecture v1-era do CLAUDE.md
- demote no SSOT da allowlist; pre-flight de verbo para Caminho B

Próximo passo provável: wiring argv de runFetch+runExport no cli.ts
(Phase 3, 023 D9) OU brief de higiene de docs juntando as pendências
stale acima.

Antes de propor próximo passo, confirma quem entendeu que sou e o
modo da sessão.
```
