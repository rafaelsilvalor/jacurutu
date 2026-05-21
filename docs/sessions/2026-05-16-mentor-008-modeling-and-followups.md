# Session recap — 2026-05-16 — 008-modeling-and-followups

**Mode:** modeling task (brief 008) → workflow follow-ups (caminho B; docs site).
**Mentor:** Claude (chat).
**Executor:** Claude Code (brief 008 execution).

## Decisions taken

- **Slot decision: 004-006 burned**, not released. Rationale: preserves the historical trace of the v1→v2 pivot; cheaper than rewriting `CLAUDE.md` E5 mid-pivot. → `docs/ROADMAP.md` Legacy section; `docs/MENTOR_BRIEF.md` §3 P4.
- **Brief 008 scope: 4 frentes.** F1 — MENTOR_BRIEF §2 wholesale replacement for v2 pivot; F2 — ROADMAP rewrite with `[coord]`/`[prod]` tag pattern; F3 — P4 (numbering verification protocol) added to §3; F4 — M-R7 refined for compact mode + P5 added as observed pattern (session-type separation). → `docs/tasks/008-v2-pivot-docs-refresh/brief.md`, merged via PR #9.
- **ROADMAP v2 structure**: Identity shifts becomes plural (preserves 2026-05-10, adds 2026-05-15); five new phases (1 bootstrap, 2 domain port, 3 production+packaging `[prod]`, 4 coord adapters `[coord]`, 5 desktop UI reconnect); old v1 phases in `## Legacy / superseded` with strikethrough; estimates table dropped (now per-phase at phase start). → `docs/ROADMAP.md`.
- **PR #9 merged via squash** with PR template checklist filled (R2/R9/G-R2/G-R3/G-R8). Project knowledge re-uploaded post-merge per operational protocol from 2026-05-12 / 2026-05-15.
- **Workflow change agreed for next brief — caminho B.** Instead of pasting full brief into executor (where content tokenizes twice — once on ingestion, once when executor calls `create_file` to save), user saves the brief manually to disk; executor receives a minimal pasteable prompt pointing to the file. Estimated savings: ~one brief's worth of output tokens per execution. Not implemented this session. → candidate for next docs brief.
- **Pasteable prompt template (caminho B) proposed**: `Task: docs/tasks/<NNN>-<slug>/brief.md. Lê o arquivo integralmente e executa.` Companion change in `task-brief-template.md`: Edit 1 changes from "save verbatim" to "verify presence + stage for commit #1". Possible companion change in `setup-code.md`. → candidate for next docs brief.
- **Docs site recommendation for future tooling**: Astro Starlight, same npm/TS ecosystem as v2 monorepo. Enters as a workspace; no Python toolchain to maintain. ~2-4h basic setup; ~1d polish; curation is the larger work. **Not** a roadmap phase — tooling task, post-Phase-1. → candidate for `docs/ROADMAP.md` parking lot.

## Pending items

- **`CLAUDE.md` E5 still references burned slots 004-006.** Out-of-scope for brief 008 (explicit). Reconcile in next docs brief.
- **TS-specific rules pending in `CLAUDE.md`** (inherited from 2026-05-15). Next docs brief.
- **Caminho B workflow change** (brief auto-save) agreed but not implemented. Bundle with TS rules + E5 cleanup.
- **Pasteable prompt template + `task-brief-template.md` Edit 1 change** — same bundle.
- **Docs site (Astro Starlight)** — parking-lot candidate, post-Phase-1.
- **JS libraries for Jira REST and Google Sheets adapters** — pending research; required pre-Phase-4, not blocking 1-3.
- **`ProductionFlow` / `Workspace` exact abstraction** — surfaces during Phase 2 port; refined in Phase 3 design.

## Pending items inherited from 2026-05-15 (audit pass)

- **Carried:** TS-specific rules in `CLAUDE.md` (still pending).
- **Resolved this session:** slots 004-006 decision (burned); style directive (M-R7 refined + P5 added); MENTOR_BRIEF §2 + ROADMAP v2 redesign; P4 (numbering verification protocol).
- **Operational, executed this session:** project knowledge re-upload post-merge.

## Artifacts produced

- PR #9 merged: `docs/MENTOR_BRIEF.md` (modified — §2, §3, §4), `docs/ROADMAP.md` (rewritten), `docs/tasks/008-v2-pivot-docs-refresh/brief.md` (new).
- Squashed commit on `main` (PR #9).
- Project knowledge re-synced: `MENTOR_BRIEF.md`, `ROADMAP.md`, brief 008.
- This recap file (when saved).

## Next concrete action

Open next docs brief — bundle of:

1. Add TS-specific rules to `CLAUDE.md` (concrete list TBD in modeling).
2. Reconcile `CLAUDE.md` E5 — remove references to burned slots 004-006; revise to reflect v2 design state.
3. Implement caminho B workflow: update `task-brief-template.md` (Edit 1 changes from "save verbatim" to "verify presence + stage"); update `setup-code.md` if needed.
4. Formalize the pasteable prompt template (inside `task-brief-template.md` or `setup-code.md`).
5. (Optional) Add docs site (Astro Starlight) as parking-lot entry in `docs/ROADMAP.md`.

Recommendation: run this docs brief **before** opening the Phase 1 monorepo bootstrap brief. Rationale: the workflow change (caminho B) reorganizes how briefs are run; Phase 1 should land using the new workflow.

## Snippet for the next session

```
Olá. Modo: modelar tarefa.

Continuação de 2026-05-16-008-modeling-and-followups. Brief 008 mergeado (PR #9): MENTOR_BRIEF §2/§3/§4 atualizados pra v2 pivot, ROADMAP redesenhado com tags [coord]/[prod] e v1 phases marcadas legacy. Slots 004-006 queimados.

Próxima ação: abrir brief docs bundle cobrindo:
1. CLAUDE.md — adicionar TS-specific rules (herdado da 2026-05-15).
2. CLAUDE.md — reconciliar E5 (remover refs a slots 004-006 queimados; ajustar pro design v2).
3. Workflow change pra caminho B: brief é salvo manualmente; executor lê do disco. Ajuste em task-brief-template.md (Edit 1 muda de "save verbatim" pra "verify + stage"). Possível ajuste em setup-code.md.
4. Pasteable prompt template formalizado (proposto: "Task: docs/tasks/<NNN>-<slug>/brief.md. Lê o arquivo integralmente e executa.").
5. (Opcional) Adicionar docs site (Astro Starlight) como parking-lot em ROADMAP.

Recomendação carregada da sessão anterior: rodar esse docs brief antes do Phase 1 (monorepo bootstrap), pra que Phase 1 já use a workflow nova.

Pendências carregadas: docs site (parking-lot); JS libs pra Jira/Sheets adapters (pre-Phase-4 research); ProductionFlow abstraction (surface em Phase 2).

⚠️ Compact mode ativo (M-R7) — respostas enxutas com markers expansíveis sob pedido.

Antes de propor próximo passo, confirma quem entendeu que sou e o modo da sessão.
```
