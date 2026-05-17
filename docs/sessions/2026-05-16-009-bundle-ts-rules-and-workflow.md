# Session recap — 2026-05-16 — 009-bundle-ts-rules-and-workflow

**Mode:** executor task (brief 009) — first run under caminho B.
**Mentor:** Claude (chat).
**Executor:** Claude Code (brief 009 execution).

## Decisions taken

- **First caminho B execution worked end-to-end.** User pre-saved brief 009 to `docs/tasks/009-bundle-ts-rules-and-workflow/brief.md` and made commit #1 (`a55b67f`) manually before invoking the executor. Executor verified presence at pre-flight, skipped the regenerate-from-memory path, and proceeded to STATE.md + Edit 2. Pattern works as designed; ~one brief's worth of output tokens saved.
- **In-flight amendment pattern proven.** During Pause 3 of Edit 4, the executor reported an out-of-scope stale `BRIEF_<nome>.md` reference at `harness/prompts/task-brief-template.md:5`. User issued an amendment adding sub-edit 4f and expanding Edit 5 scope to include `harness/prompts/*.md`. Executor folded the fix into the same commit (`6f92ac3`). Pattern: out-of-scope finding → user amendment → executor applies in same commit. Worth keeping for future briefs.
- **PR #11 squash-merged**, not "Create merge commit" as the PR body recommended. The six-commit story is preserved inside the squash body (visible via `git show ac239be`); `git log --oneline main` shows one entry. Trade-off acceptable for solo dev; flag for the next multi-commit docs bundle if per-commit history on `main` becomes valuable.
- **TS rules R20-R25 landed in `CLAUDE.md`** (after R19, no reorganization per D2): strict mode, ESM with `.js` imports, no bundler, `node:test`, no `any`, hexagonal dependency direction.
- **`CLAUDE.md` E5 reconciled.** Burned slots 004-006 documented inline; v1-freeze header note prepended to `## Documented Exceptions`. Future v2 exceptions start at E6.
- **Caminho B formalized in `task-brief-template.md` and `start-task.md`.** Pasteable prompt is the existing `start-task.md` COPIAR block with updated paths (D5 — no separate minimal prompt). `task-brief-template.md` gained a step 6 in "Como usar manualmente" and a convention note about the "Edit 1 — Save this brief verbatim" stub being discontinued.
- **Astro Starlight parked** as a single-line entry in `docs/ROADMAP.md` parking lot. Post-Phase-1 tooling task.

## Pending items

- **`setup-code.md` patterns 1 & 5** — pattern 1 ("plan always required") contradicts R15; pattern 5 (Co-authored-by trailer instruction) contradicts G-R3. Explicitly out of scope of brief 009. Deferred to a future `harness-cleanup` brief.
- **`harness/skills-plan/pause-3-protocol.md` lines 10, 28** — `BRIEF_*.md` glob references missed by both the brief's verification regex and the (already-expanded) Edit 5 scope. Bundle with the `setup-code.md` cleanup in the `harness-cleanup` brief.
- **R23 test runner integration** (compile-and-test vs `tsx` loader vs `--experimental-strip-types`) — decision deferred to Phase 1 bootstrap. Add to ROADMAP `## Pending decisions` when the Phase 1 brief opens.
- **R25 `core/` verification grep is forward-looking** — meaningful only after Phase 1 bootstraps the monorepo. Not a fix item; just a note for whoever runs the verification before Phase 1 lands.
- **JS libraries for Jira REST and Google Sheets** — research pending pre-Phase 4 (carried from 2026-05-15).
- **`ProductionFlow` / `Workspace` exact abstraction** — surfaces during Phase 2 port (carried from 2026-05-15).

## Pending items inherited from 2026-05-16-008 (audit pass)

- **Resolved this session:** TS rules R20-R25 in `CLAUDE.md`; E5 reconcile + v1-freeze note; caminho B workflow (template + start-task); pasteable prompt formalized via D5 (reuse `start-task.md` COPIAR block); Astro Starlight parking-lot entry; sweep of stale `BRIEF_<name>.md` references in harness (3 files + the in-flight 4f fix in `task-brief-template.md`).
- **Carried:** JS libs for Jira/Sheets adapters (pre-Phase-4 research); `ProductionFlow` / `Workspace` abstraction (surfaces in Phase 2).
- **Newly surfaced:** `setup-code.md` patterns 1/5; `pause-3-protocol.md` residual `BRIEF_*.md` glob references.

## Artifacts produced

- PR #11 squash-merged into `main` as `ac239be`. Eight files: `CLAUDE.md`, `docs/ROADMAP.md`, `docs/tasks/009-bundle-ts-rules-and-workflow/brief.md`, `harness/prompts/README.md`, `harness/prompts/task-brief-template.md`, `harness/workflows/review-final-task.md`, `harness/workflows/start-task.md`, `harness/init/07-create-brief.md`.
- Sweep verification `grep -rn 'BRIEF_[A-Za-z0-9_-]*\.md' harness/` returns zero matches.
- This recap file (when saved).

## Next concrete action

Open the **Phase 1 monorepo bootstrap brief** — the next code-writing task. Brief 009 was deliberately the last docs-prep before the bootstrap; caminho B is now the standard invocation path.

The bootstrap brief should:

- Live at `docs/tasks/010-phase-1-monorepo-bootstrap/brief.md` (next free NNN).
- Implement only the Phase 1 exit criterion in ROADMAP: TS monorepo compiles; `cli --version` prints; `node:test` runs an empty placeholder suite green.
- Hold strict scope: no domain logic, no adapters, no CLI commands beyond `--version`.
- Apply R20-R25 from day one.
- Resolve the R23 runner-integration decision as part of its design (and update ROADMAP `## Pending decisions` accordingly).
- Use caminho B for invocation.

## Snippet for the next session

```
Olá. Modo: modelar tarefa.

Continuação de 2026-05-16-009-bundle-ts-rules-and-workflow. Brief 009 mergeado (PR #11): TS rules R20-R25 em CLAUDE.md, E5 reconciliada com nota v1-freeze, caminho B implementado (task-brief-template.md + start-task.md), sweep de BRIEF_<name>.md em harness, Astro Starlight no parking lot do ROADMAP.

Próxima ação: abrir brief Phase 1 monorepo bootstrap (slot 010). Scope estrito por ROADMAP §Phase 1: monorepo TS compila, `cli --version` imprime, `node:test` verde com suite placeholder. Sem domain logic, sem adapters, sem comandos CLI além de --version. Aplicar R20-R25 desde o dia 1. Resolver R23 (integração do runner) no design da bootstrap e atualizar ROADMAP §Pending decisions. Caminho B pra invocação.

Pendências carregadas: setup-code.md patterns 1/5 + skills-plan/pause-3-protocol.md residual BRIEF_*.md (harness-cleanup brief separado); R23 runner-integration decision (entra na bootstrap); JS libs pra Jira/Sheets adapters (pre-Phase-4 research); ProductionFlow abstraction (surface em Phase 2).

⚠️ Compact mode ativo (M-R7) — respostas enxutas com markers expansíveis sob pedido.

Antes de propor próximo passo, confirma quem entendeu que sou e o modo da sessão.
```
