# Template: Task Brief

## Quando usar

Criar `BRIEF_<nome>.md` pra tarefa nova de categoria M ou L.

> **Recomendação:** prefira usar `init/07-create-brief.md` —
> agente entrevista você e gera brief adequado. Use template manual
> só se preferir trabalhar sozinho.

Tarefas categoria S não precisam de brief — basta uma frase no
chat. Tarefas XL não devem ter brief ainda — quebra primeiro em
tarefas L.

## Como usar manualmente

1. Copia o template abaixo
2. Salva como `docs/tasks/<NNN>-<slug>/brief.md` (cria a pasta;
   numeração `NNN` zero-padded em ordem cronológica, slug
   curto-descritivo em kebab-case)
3. Preenche cada seção (instruções inline em `[colchetes]`)
4. Remove instruções e colchetes antes de finalizar
5. Comita o brief antes de iniciar a tarefa

---

## --- TEMPLATE PARA COPIAR ---

```markdown
# Brief: [Short task title]

> **Category:** [M | L]
> **Plan required:** [yes | no] — see "When to skip Pause 1" below
> **Branch:** `[type]/[kebab-description]`
>
> Paste this brief into the executor agent (Claude Code, Cowork)
> at task start.

---

## Context

[2-4 sentences. Where this fits in the project. Why it exists.
Relevant current state. If already clear from the filename or
task name, omit — don't pad.]

## Goal

[1-2 imperative sentences. What needs to be different at the end.
Not how, just what.]

## Constraints

### Non-negotiable constraints

1. [Behavior that must not change]
2. [API that must not break]
3. Follow all rules in `CLAUDE.md` (especially [R-X], [A-Y])
4. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `[type]/[kebab-description]`
   - Conventional Commits
   - Commit freely; **DO NOT push**
   - Update `STATE.md` at session end
5. Only files directly related to the task may be modified. If
   you discover something else needs changing, **STOP and ask**.

### Architectural decisions already made (do not revisit)

[List decisions closed in a design session with the mentor. The
agent implements, does not propose alternatives. If no decisions
were pre-closed, omit this section — the agent will propose a
plan you review at Pause 1.]

#### [Decision 1]

[Specific detail]

#### [Decision 2]

[Specific detail]

## Done criteria

The task is complete only when **all** items are true:

### Automated checks

- [ ] Build passes without errors
- [ ] Linter passes without warnings
- [ ] Tests pass (if applicable)
- [ ] [Other automatable checks]

### Structural checks

- [ ] [Specific expected structure]
- [ ] [Size limits]
- [ ] [Anti-patterns absent — verifiable via `grep` or similar]

### Behavior checks

- [ ] [Testable behavior]
- [ ] [Specific edge cases]

### Git checks

- [ ] Branch used: `[type]/[description]`
- [ ] Commits follow Conventional Commits
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed
- [ ] `STATE.md` updated to `completed` or removed

### Process checks

- [ ] If `Plan required: yes` — numbered step plan was presented
      and approved before any change (Pause 1)
- [ ] Pause 2 — first modified file shown for review before
      proceeding (always required)
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed
      message before each commit (always required)
- [ ] If any criterion could not be met, it was reported
      explicitly

## Pause points

From `AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code):** present a numbered plan and wait
  for approval. **Required if `Plan required: yes`; skipped if
  `Plan required: no`** (see "When to skip Pause 1" below).
- **Pause 2 (after the first modified file):** show the result
  and wait for review. **Always required.**
- **Pause 3 (before each commit):** show `git status` +
  `git diff --stat` + proposed message. **Always required.**

In case of:
- Unrelated bug found → report and ask
- Technical limitation preventing a done criterion → report
- Undocumented gotcha discovered → report and document

**DO NOT proceed "fixing" things without permission.**

## When to skip Pause 1 (`Plan required: no`)

Pause 1 ("the agent presents a numbered plan before any code") guards against the agent inventing an approach the brief did not specify. It is overhead when the brief itself **is** the plan — when all decisions are closed and the agent's job is to execute, not design.

**Skip Pause 1 only when ALL hold:**

- All architectural decisions are recorded in this brief or in canonical docs (`CLAUDE.md`, `MENTOR_BRIEF.md`)
- Done criteria are concrete and verifiable without interpretation
- No ambiguity about which files to touch or how

**Typical `Plan required: no` tasks:**
- Doc updates with text already specified in the brief
- Mechanical edits (rename, format, move files)
- Adding a rule to a structured file at a specified location

**Typical `Plan required: yes` tasks:**
- Refactor with implementation choices to make
- New feature with design decisions
- Bug fix where the root cause is hypothesized, not confirmed

⚠️ **Pause 2 (after the first file) and Pause 3 (before each commit) are ALWAYS required, regardless of `Plan required`.** They catch drift the brief did not anticipate (Lesson #6 of `AGENT_PLAYBOOK.md`).

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational workflow
3. `docs/GOTCHAS.md` — known traps
4. [Other specific relevant files]

## Expected output

1. Branch `[type]/[description]` created and working tree clean
2. Commits describing each milestone of the task
3. `STATE.md` at the end indicating completed (or removed)
4. [Main file of the task] modified per spec
5. Brief summary reported in the final message:
   - How many commits, which
   - Lines added/removed (`git diff --stat origin/main`)
   - Any checklist item not met (with justification)
   - Suggested next step
```

## --- FIM TEMPLATE ---

## Princípios pra preencher bem

### O que ENTRA no brief

- ✅ Restrições verificáveis
- ✅ Comportamentos exatos a preservar
- ✅ Decisões já tomadas que agente não deve revisar
- ✅ Critérios de pronto testáveis
- ✅ Referências a outros docs

### O que NÃO entra

- ❌ Soluções específicas ("use uma classe Foo...")
- ❌ Justificativas longas de por que a tarefa importa
- ❌ História do projeto que não é restrição ativa
- ❌ Especulação sobre futuro distante

## Tamanho ideal

- **Tarefa M:** 80-150 linhas
- **Tarefa L:** 200-400 linhas

Se passar disso, ou tarefa é XL disfarçada (quebra), ou brief
está sobre-explicando.
