# Session recap — 2026-05-15 — saci-v2-pivot

**Mode:** mentoring → modeling task.
**Mentor:** Claude (chat).
**Executor:** none yet (next session opens brief 008 for Claude Code).

## Decisions taken

- **Saci v2 starts as a TypeScript monorepo.** npm workspaces, `strict: true`, `node:test`, no bundler. → `docs/MENTOR_BRIEF.md` §2, future `CLAUDE.md` TS rules.
- **CLI first; desktop reconnects within ~3-4 months.** Earlier than the previous "much later" framing — designers need the production flow soon and CLI alone is not enough for non-devs. → `docs/ROADMAP.md`.
- **Saci-Electron-v1 enters freeze when v2 starts.** Critical bugs only; new feature work moves to v2. → `docs/MENTOR_BRIEF.md` §2, `docs/ROADMAP.md`.
- **Cowork-as-Jira-bridge reverted; direct Jira REST adopted.** Reason: token cost per run made Cowork-bridge unsustainable even in testing; preserving token budget for mentor + Claude Code yields higher ROI. → `docs/MENTOR_BRIEF.md` §2, `docs/ROADMAP.md` Phase 5 M5.5 (remove "Optional Jira write-back via Cowork").
- **Saci has two operating modes, not one:** *coordination* (operator runs sync, team consumes the Sheet) and *production* (each designer runs locally, scoped to their own tasks, files, identity). Same core, two command sets. → `docs/MENTOR_BRIEF.md` §2, `docs/ROADMAP.md`.
- **Production workflow promoted from Phase 5 → Phase 3.** Rationale: until production exists, Rafael is the manual bottleneck for the repetitive work the product is meant to eliminate. → `docs/ROADMAP.md`.
- **Templates and archival standardization are domain concepts**, not tooling. Likely surface as a `ProductionFlow` (or `Workspace`) abstraction. → `docs/ROADMAP.md`, future `core/` design.
- **CLI identity (`saci config`) is a day-1 requirement.** Multi-tenant per machine, mono-user per instance. Required because 3+ designers will run their own production flows. → `docs/ROADMAP.md`.
- **Google Sheets stays as the team-facing collective interface.** Not to be replaced by a desktop UI later. → `docs/ROADMAP.md`.
- **Designer-friendly packaging is a Phase 3 concern** (possibly via Saci-desktop as host of the CLI). → `docs/ROADMAP.md`.
- **Python `automation/` codebase is the seed of Saci v2.** It already implements hexagonal architecture intuitively (`lib_transform.py` = pure domain; `fetch.py` = Jira adapter; `lib_sheets.py` = Sheets adapter; payload.json schema v2.0 = port contract; `run_local.py` = composition root). Porting is redesign with explicit vocabulary, not line-by-line translation.

## Pending items

- **Slots 004-006** were reserved by brief 003 for Electron-v1 refactors (`format-registry`, `renderer-views`, `action-registry`) that are now legacy/superseded. Decide: burn (preserve as historical gap) or release back to the pool. **Blocks numbering of the next brief.**
- **Re-upload canonical files (`MENTOR_BRIEF.md`, `ROADMAP.md`) to Claude.ai project knowledge immediately after each merge.** Otherwise the next chat session reads stale docs and work gets repeated. Operational item, not a rule (yet).
- **P4 candidate (numbering verification protocol)** — drafted in session 2026-05-12, not yet committed to `MENTOR_BRIEF.md` §3. Should land together with the next docs brief.
- **JS libraries for Jira REST and Google Sheets adapters** — not yet researched. Required before writing the Jira/Sheets adapters but not before the bootstrap brief.
- **Designer-friendly packaging format** — deferred to Phase 3 modeling.
- **Style directive recorded this session (see "Snippet" below):** Rafael requested shorter, more direct mentor replies with brief markers where he can ask for deeper detail. Likely lands as either a refinement of M-R7 or a new M-R15. Also: separate "hands-on" sessions from "clarify vague technical points" sessions. Should be incorporated into the next docs brief.

## Pending items inherited from 2026-05-12 (audit pass)

Per the criterion "only carry over what affects the current direction":

- **Carried:** P4 (numbering protocol) — affects the next briefs being opened.
- **Carried:** re-upload canonical files post-merge — affects every subsequent doc edit.
- **Not carried:** PR #6 retroactive audit, close-chat-session.md "Quando usar" clarification, push/PR/merge familiarization. None of these block v2 work; they remain as general project debt.

## Artifacts produced

None on disk in the repo. This recap file is the only output and must be moved into the repo by Rafael.

## Next concrete action

Rafael decides whether slots 004-006 are burned or released. Then opens brief 008 (docs-only): redesign `MENTOR_BRIEF.md` §2 + redesign `ROADMAP.md` (legacy phases marked + v2 phases written) + add P4 to §3 + incorporate the style directive (M-R7 refinement or new M-R15).

## Snippet for the next session

```
Olá. Modo: modelar tarefa.

Continuação de 2026-05-15-saci-v2-pivot. Decisões fechadas: TS + npm
workspaces, CLI first com desktop religando em ~3-4 meses, 2 modos
(coordenação / produção), Jira REST direto (Cowork revertido),
production workflow promovida pra Phase 3, Saci-Electron-v1 entra em
freeze, packaging amigável é Phase 3. O automation Python é o seed do
core do v2.

Pendente antes do brief: slots 004-006 — decisão é [queimar | liberar].

Próxima ação: abrir brief 008 (docs-only) cobrindo:
1. Redesign de MENTOR_BRIEF.md §2 (substituição completa do bloco
   atual de "Active architectural decisions" e "Active product
   direction" pelo novo).
2. Redesign de ROADMAP.md (Phases 1-2 antigas marcadas como
   `legacy / superseded`; nova trilha v2 com modo coordenação +
   modo produção em paralelo).
3. Adicionar P4 (numbering verification protocol) em §3 do
   MENTOR_BRIEF.md — herdado da sessão 2026-05-12.
4. Incorporar diretiva de estilo desta sessão: respostas mais enxutas,
   com marcadores curtos pra aprofundamento sob pedido. Decidir se vira
   refinement de M-R7 ou novo M-R15. Considerar também separação de
   sessões "mão na massa" vs "esclarecer questões técnicas vagas".

⚠️ Operacional: após mergear o brief 008, re-upload de
MENTOR_BRIEF.md e ROADMAP.md no project knowledge do Claude.ai
*imediatamente* — senão a sessão seguinte lê doc velho.
```

## "Worth committing now?" candidates

- This recap file (`docs/sessions/2026-05-15-saci-v2-pivot.md`) — yes, this is the only commit in scope right now.
- `docs/MENTOR_BRIEF.md`, `docs/ROADMAP.md`, `CLAUDE.md` — **no**, those land in brief 008+.
