# Session recap — 2026-05-17 — mentor — 010-harness-rename

**Mode:** mentoring → modeling task → execution review.
**Author:** Claude (chat).
**Companion:** executor recap `docs/sessions/2026-05-17-010-agent-kit-to-harness.md` (#15).
**Implementation:** PR #14 (`refactor: rename Agent-kit to harness, flatten subfolders`).

Same session, complementary perspectives. The executor recap documents on-disk execution (commits, verifications, edge case resolution). This recap documents chat-side reasoning: design decisions, trade-offs evaluated, orchestration patterns observed.

## Decisions taken (meta and architectural)

### Mentor lane vs executor lane: keep current separation

Opening mentor inside Claude Code is technically possible (same model, paste `MENTOR_BRIEF.md`). Inadvisable by default: Code's defaults push toward action; chat protects deliberation. The friction "discuss in chat → take plan to Code" is feature, not bug. Two scenarios where crossing makes sense: short mentoring about code not in project knowledge; quick mid-execution pause to discuss an unexpected decision. → no file change; reaffirms `docs/MENTOR_BRIEF.md` M-R12.

### Reviewer agent design space mapped

Three moments analyzed (pre-merge, post-merge, continuous) × three hosts (mentor-chat, dedicated `REVIEWER_BRIEF.md`, programmatic tooling). 007 post-merge audit is the existing precedent. Mentor-as-reviewer carries skin-in-the-game bias but acceptable at solo-dev scale. → candidate workflow `harness/workflows/audit-merge.md` (not modeled this session).

### Workflows vs skills: complementary, not migration target

Workflow = human-pulls (manual paste); skill = agent-pulls (automatic via description). Analyzed all 13 current workflows against the `skills-plan/README.md` 4 criteria. Setup-* and recover-* are naturally workflow; `commit-discipline` and `pause-3-protocol` are naturally skills (already in plan); `close-chat-session` already operates as embedded skill via M-R14. `MENTOR_BRIEF.md` carries skills implicitly through M-R13/M-R14 — more portable across agents than `.claude/skills/`. → no file change; affirms `harness/skills-plan/README.md` as-is; first skill adoption deferred.

### Agent-kit dual-`docs/` collision: Option A chosen

Root cause: original `Agent-kit/README.md` prescribed "rename to `docs/`" on adoption; Saci kept the `Agent-kit/` folder verbatim, producing two `docs/` (project canonicals vs orchestration tooling). Four options evaluated:

- **A) Flatten** — move `Agent-kit/docs/{workflows,prompts,skills-plan}/` up one level. **chosen.**
- **B) Move into project root** — folders side-by-side with `docs/`; cleaner conceptually but adds root noise.
- **C) Consolidate inside `docs/`** — mixes canonicals with method; loses kit as separable entity.
- **D) Separate Git repo** — submodule complexity; deferred until a second project surfaces.

Rationale for A: resolves the executor confusion with minimum invasion; preserves kit as separable entity; reversible to D later via `git subtree split`. → implemented in brief 010.

### Rename Agent-kit → harness

"Kit" framing implied one-shot bootstrap that would dissolve into the project; reality became permanent operational scaffolding used every session. "Harness" is established terminology in the AI-agent space for scaffolding around an agent. Lowercase aligns with the repo's folder-naming convention; resolves the `Agent-kit` capitalization inconsistency.

Alternatives evaluated: `agent-kit/` (status quo lowercase), `orchestration/` (formal), `practice/` (vague), `method/` (abstract), `meta/` (cryptic), `playbook/` (collided with `AGENT_PLAYBOOK.md`). → implemented in brief 010.

### Disambiguation in README, not in folder name

Considered qualifying the folder (`agent-harness/`, `orchestration-harness/`, `process-harness/`). Recurring path-typing cost outweighed one-time README read cost. Instead, first paragraph of `harness/README.md` carries:

> "Harness de orquestração — meta-tooling para trabalhar com agentes IA neste projeto (Claude Chat, Cowork, Code). Não é scaffolding programático; é doutrina, workflows e prompts."

→ applied in brief 010 Edit 4.

### Caminho B with brief bundled into commit #1 — recovery pattern

Orchestrator committed the brief together with the file moves and rename in commit #1 (off-script — under caminho B, the brief was supposed to be commit #2 by the executor). Recovery:

- `git commit --amend` on commit #1 to update message
- Manual rewrite of brief Edit 1 to be honest about state ("brief already on disk and committed")
- Orchestrator commit #2 `docs(tasks): adjust brief 010 to reflect committed state`
- Executor picked up from commit #3

Pattern works but cost two extra orchestrator commits. Lesson: if bundling brief with prep commits, do it deliberately and write Edit 1 to match the bundle from the start, instead of recovering after the fact. → candidate clarification in `harness/prompts/task-brief-template.md` "Como usar manualmente".

### Edge case resolution: executor's Pausa 3 caught substring collision; mentor chose Option 1

Pass 4 of the literal substitution (`agent-kit → harness`) would have corrupted `010-agent-kit-to-harness/` (task folder) and `refactor/agent-kit-to-harness` (branch name) — substrings of identifiers derived from the operation itself.

Three options considered (mentor side):
- **1) Preserve identifiers verbatim**; relax final grep. **chosen.**
- **2) Literal without exceptions** — corrupts real paths. **rejected.**
- **3) Rename branch + use relative paths** — extends scope; doesn't fully resolve task folder. **rejected.**

Implementation detail in executor recap. The meta-lesson is in `GOTCHAS.md` candidate below.

### G-R1 violated in session-close

Post-merge cleanup of PR #14 entered automatic-mode; the mentor recap was committed directly to `main` locally before being moved to a branch. Caught before push; recovered via `git checkout -b` from HEAD and `git reset --hard origin/main`.

Mitigation candidate: `harness/workflows/close-chat-session.md` should include an explicit "create new branch before committing the recap" step, parallel to the cleanup workflow's structure.

### Two recaps per session — naming convention needed

The executor recap was already in main (#15) when the mentor recap was being prepared. Both files cover the same date and task without indicating authorship. Tacit pattern exists (mentor uses "brief NNN"; executor uses "NNN-slug") but is invisible at the file-listing level.

Convention introduced this session: prefix the slug with role.
- Executor: `<date>-executor-<NNN>-<slug>.md`
- Mentor: `<date>-mentor-<NNN>-<slug>.md`

This recap saved as `2026-05-17-mentor-010-harness-rename.md` to establish the new convention. Retroactive rename of older recaps pending.

## Pending items

### New (from this session)

- **`audit-merge.md` workflow** — brief candidate; rooted in 007 precedent.
- **Sobreposição `commit-discipline` × `pause-3-protocol`** in `harness/skills-plan/` — fund into one skill or keep separate with disjoint descriptions. Decide before adopting first skill.
- **Naming convention `<date>-<role>-<NNN>-<slug>` formalization** in `harness/workflows/close-chat-session.md` and `close-task.md`. Retroactive rename of older session files — executor recap #15 first candidate.
- **`close-chat-session.md` should remind orchestrator to create branch before committing recap.** Mitigation for the G-R1 violation that happened in this session-close.
- **`GOTCHAS.md` candidate `G-CAT-N` — literal sweeps and derived identifiers.** Two failure modes observed in brief 010:
  - Substring collision with identifiers derived from the operation (task folder, branch name).
  - Descriptive prose about the rename itself gets rewritten tautologically (brief 010's own text now reads "Rename harness → harness" — preserved per D4 but at historical-record cost).
  Enumerate the operation's own artifacts before declaring zero-match verification.
- **M-R10 inconsistency:** `harness/` and descendants live in pt-BR on disk; M-R10 says English on dev surface. Formalize as tácit exception or unify.
- **Process question — explicit-instruction override of brief defaults.** Brief 010 constraint #5 said "No `git push`"; user typed "abre o PR" and executor took it as override. Process clarity pending — flagged in executor recap and worth addressing meta-level.

### Carried (also in executor recap; tracked here for chat-side awareness)

- `harness/README.md` body still uses bootstrap-kit framing — cleanup brief candidate.
- Git line-ending config (CRLF/LF warnings) — investigate `.gitattributes` / `core.autocrlf`.
- Style directive (no unusual symbols) — pending formalization in `MENTOR_BRIEF.md`.
- Cleanup brief candidates from 2026-05-16-009 — `setup-code.md` Patterns 1/5, `BRIEF_*.md` glob refs in `skills-plan/pause-3-protocol.md`.

## Snippet for the next session

```
Olá. Modo: [continuar | modelar tarefa | mentoria].

Última sessão (2026-05-17) renomeou Agent-kit/ → harness/, achatou
o docs/ aninhado e adicionou disambiguation line no README. PR #14
(implementação) e #15 (executor recap) mergeados. Mentor recap em
PR #<pending>.

Convenção introduzida nesse close: nomes de session recap ganham
prefixo de papel — <date>-mentor-... ou <date>-executor-...
Retroativo pendente.

Pendências meta:
- audit-merge workflow (formalizar post-merge audit; 007 precedente)
- close-chat-session.md: passo "branch antes do commit do recap"
- naming convention <date>-<role>-... formalizar em workflows
- GOTCHAS candidate: literal sweep × derived identifiers + brief
  self-referential rewriting
- M-R10 ambiguidade: harness/ pt-BR vs dev surface inglês
- Sobreposição commit-discipline × pause-3-protocol no skills-plan
- Process question: explicit instruction × brief defaults

Carregadas do executor recap:
- harness/README.md body ainda usa framing de bootstrap-kit
- Git line-endings (CRLF/LF warnings)
- Style directive (sem símbolos incomuns) em MENTOR_BRIEF.md
- Cleanup brief candidates de 2026-05-16-009

Próximo foco prioritário: [Phase 1 bootstrap | harness-cleanup brief
| uma das pendências meta].
```
