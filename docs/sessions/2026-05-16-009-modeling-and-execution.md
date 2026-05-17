# Session recap — 2026-05-16 — 009-modeling-and-execution

**Mode:** modeling task → execution review (modeled brief 009 in chat; reviewed executor output before close).
**Mentor:** Claude (chat).
**Executor:** Claude Code (brief 009 execution).

## Decisions taken

- **Brief 009 numbered, slugged, scoped.** Numbering verified by P4 (`ls docs/tasks/`, `git log --oneline main`, reserves in `CLAUDE.md` E*) — slot 009 is the first free after the 004-006 burn and briefs 007, 008. Slug: `bundle-ts-rules-and-workflow`. Branch: `docs/bundle-ts-rules-and-workflow`. Category: L. `Plan required: no`. → `docs/tasks/009-bundle-ts-rules-and-workflow/brief.md`.

- **Minimum viable TS ruleset (R20-R25).** R20 strict mode + `@ts-ignore` discipline; R21 ESM with `.js` extensions in imports; R22 no bundler, `tsc` per package; R23 `node:test` only; R24 no `any`; R25 hexagonal dependency direction (`core` → none; adapters → `core`; `cli` composes). Larger ruleset (error handling, CLI library, branded types, file naming, import order) deferred to Phase 2+ per M-R8 — no decisions in vacuum. → `CLAUDE.md`.

- **CLAUDE.md structure decision.** Append R20-R25 after R19; do not reorganize R1-R19. Rationale: pivot is recent, v1 freeze is not removal; existing rules stay as legacy reference without restructuring. → `CLAUDE.md`.

- **E5 reconcile.** Rewrote E5 wholesale to reflect v1 freeze: removed wrong "brief 002" reference (storage-layer, not format-registry) and removed references to burned slots 004-005. Added a section-level "Note on v1 freeze" header on `## Documented Exceptions` clarifying all current exceptions apply to v1, with new v2 exceptions taking E6+. → `CLAUDE.md`.

- **Caminho B design — Option 2 (pointer + workflow).** Pasteable prompt is the existing `start-task.md` COPIAR block with updated paths, not a separate minimal prompt. The brief carries task content; the workflow carries operational process. Avoids boilerplate duplication across briefs. → `harness/workflows/start-task.md`, `harness/prompts/task-brief-template.md`.

- **Caminho B convention note.** Briefs 009+ no longer include the "Edit 1 — Save this brief verbatim" stub; replaced by "Edit 1 — Verify brief on disk and commit". Documented as a standalone paragraph in `task-brief-template.md` "Como usar manualmente" to prevent future authors from re-adding the stub by imitation. → `harness/prompts/task-brief-template.md`.

- **Caminho B companion is `start-task.md`, not `setup-code.md`.** Mid-modeling correction after inspecting the actual content of `setup-code.md`: that file carries only pre-flight setup and does not receive briefs. The brief invocation surface is `start-task.md`. → guided the scope of Edit 4 in brief 009.

- **Edit 5 sweep scope — initial decision.** `harness/workflows/*.md` (except `start-task.md`, handled in Edit 4) + `harness/init/*.md`. Expanded mid-flight via amendment to also include `harness/prompts/*.md` after sub-edit 4f finding.

- **Commit sequence — six commits, single PR.** R10 single-themed commits: brief add → R20-R25 → E5 reconcile → caminho B impl → sweep → ROADMAP parking lot. Squash-merge collapses to one commit on main (project convention). → executed cleanly.

- **In-flight finding 4f absorbed into commit #4.** Stale `BRIEF_<nome>.md` reference at line 5 of `task-brief-template.md` "Quando usar" section. Same theme as the rest of commit #4 (path convention shift); same file already being touched. Decision: extend Edit 4 with sub-edit 4f rather than defer to the cleanup brief. → applied.

- **Out-of-scope items deferred to future `harness-cleanup` brief.** Three items accumulated during this session (see Pending items below). Discipline: report, do not fix mid-flight. → tracked here.

- **Style directive: no unusual symbols.** Rafael explicitly requested plain labels ("option 1/2/3" or descriptive names) instead of greek letters or symbols (α, β, γ). Affects mentor communication style going forward. Candidate refinement for M-R7 (compact mode) or a new M-R in `MENTOR_BRIEF.md` — not yet committed. → tracked here.

- **Astro Starlight in parking lot.** Single-line entry appended to `## Parking lot` per the file's update protocol. → `docs/ROADMAP.md`.

## Pending items

### High-priority — affects next session

- **Cleanup brief 010 candidate — inventory:**
  - `harness/workflows/setup-code.md` Pattern 1 — "Apresenta plano numerado antes de qualquer mudança em código" contradicts the `Plan required: yes/no` flag (Pause 1 is conditional since brief 000).
  - `harness/workflows/setup-code.md` Pattern 5 — "Mensagens de commit incluem trailer Co-authored-by: Claude" contradicts `CLAUDE.md` R10 and `GIT_WORKFLOW.md` G-R3.
  - `harness/skills-plan/pause-3-protocol.md` lines 10 and 28 — `BRIEF_*.md` (glob form) stale refs. Escaped Edit 5's verification regex (`BRIEF_[A-Za-z0-9_-]*\.md` doesn't match `*`).
  - **Regex correction needed:** the cleanup brief should use `BRIEF_.*\.md` or `BRIEF_[*A-Za-z0-9_-]*\.md` for verification.
  - **Decision pending:** model brief 010 before or after Phase 1 monorepo bootstrap. Cleanup doesn't block bootstrap.

- **Style directive (no unusual symbols)** — needs formalization in `MENTOR_BRIEF.md`. Two options: refine M-R7 (compact mode) to include symbol avoidance, or add a new M-R for formatting hygiene. Decide next session.

### Carried — surfaces in Phase 2+

- **JS libraries for Jira REST and Google Sheets adapters** — pre-Phase-4 research; not blocking Phases 1-3.
- **`ProductionFlow` / `Workspace` exact abstraction** — surfaces during Phase 2 port; refined in Phase 3 design.

### Operational — pending before next chat session

- **PR opening flow (Rafael's hands-on):** review `git diff origin/main...HEAD` → `chore(state): remove STATE.md after 009-bundle-ts-rules-and-workflow` commit → `git push -u origin docs/bundle-ts-rules-and-workflow` → fill `.github/pull_request_template.md` (R2/R9/G-R2/G-R3/G-R8 per brief 008 PR #9 precedent) → squash-merge.
- **Project knowledge re-upload post-merge.** Files to refresh: `CLAUDE.md`, `harness/prompts/task-brief-template.md`, `harness/prompts/README.md`, `harness/workflows/start-task.md`, `harness/workflows/review-final-task.md`, `harness/init/07-create-brief.md`, `docs/ROADMAP.md`. Without this, the next session reads stale.

## Pending items inherited from 2026-05-16-008 (audit pass)

- **Carried into brief 009 and resolved:** TS-specific rules in `CLAUDE.md` (R20-R25 landed); E5 reconcile (rewritten with v1-freeze note); caminho B workflow (implemented); pasteable prompt convention (formalized via Option 2 + convention note); Astro Starlight parking-lot entry (added).
- **Operational, executed during brief 009 flow:** caminho B itself (brief 009 was the first to use it — pre-saved by user, executor verified + committed as commit #1).

## Artifacts produced

- **Chat-generated file:** `009-bundle-ts-rules-and-workflow-brief.md` (delivered via `/mnt/user-data/outputs/`; Rafael saved as `docs/tasks/009-bundle-ts-rules-and-workflow/brief.md` per caminho B).
- **Executor output — branch `docs/bundle-ts-rules-and-workflow`:** eight commits total (six brief commits + STATE.md start + STATE.md remove pending). Files modified per executor's `git diff --stat`:
  - `harness/prompts/README.md`
  - `harness/prompts/task-brief-template.md`
  - `harness/workflows/review-final-task.md`
  - `harness/workflows/start-task.md`
  - `harness/init/07-create-brief.md`
  - `CLAUDE.md`
  - `STATE.md` (workflow artifact — pending removal)
  - `docs/ROADMAP.md`
  - `docs/tasks/009-bundle-ts-rules-and-workflow/brief.md` (new)
- **This recap file** (when saved).

## Next concrete action

Rafael closes the brief 009 lifecycle operationally: review diff → `chore(state): remove STATE.md` commit → push → PR (template + R2/R9/G-R2/G-R3/G-R8 checklist) → squash-merge → re-upload project knowledge. Then opens the next chat session to decide cleanup brief 010 vs Phase 1 monorepo bootstrap.

## Snippet for the next session

```
Olá. Modo: [modelar tarefa | continuar].

Continuação de 2026-05-16-009-modeling-and-execution. Brief 009
mergeado: CLAUDE.md ganhou R20-R25 (TS rules mínimo viável) + E5
reconciliado com v1-freeze note; caminho B implementado (briefs
009+ pre-saved pelo usuário, executor lê do disco); sweep dos
stale BRIEF_<name>.md refs em harness/; Astro Starlight no
parking-lot do ROADMAP.

Próxima decisão: cleanup brief 010 vs Phase 1 monorepo bootstrap.

Inventário do cleanup brief acumulado:
1. setup-code.md Pattern 1 — plan-always-required contradiz flag
   Plan required.
2. setup-code.md Pattern 5 — trailer Co-authored-by contradiz
   G-R3/R10.
3. skills-plan/pause-3-protocol.md linhas 10, 28 — BRIEF_*.md
   (glob form) escapou pelo regex da Edit 5; cleanup precisa
   regex mais largo (BRIEF_.*\.md).

Pendências carregadas:
- Style directive: sem símbolos incomuns (α/β/γ) — candidato pra
  refinamento de M-R7 ou novo M-R em MENTOR_BRIEF.md.
- JS libs Jira/Sheets (pre-Phase-4 research).
- ProductionFlow / Workspace abstraction (Phase 2).

⚠️ Compact mode ativo (M-R7) — respostas enxutas com markers
expansíveis sob pedido. Sem símbolos incomuns — usa labels
descritivos.

Antes de propor próximo passo, confirma quem entendeu que sou e
o modo da sessão.
```
