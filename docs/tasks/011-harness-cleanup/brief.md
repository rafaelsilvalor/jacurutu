# Brief: 011 — Harness cleanup: workflow patterns, glob refs, README reframe, style refinements

> **Category:** M
> **Plan required:** no — see "When to skip Pause 1" below
> **Branch:** `docs/harness-cleanup`
>
> Save this brief to `docs/tasks/011-harness-cleanup/brief.md`. Invoke the executor with the prompt in `harness/workflows/start-task.md`.

---

## Context

A cleanup-brief inventory has accumulated across three prior sessions:

- **Brief 009 (2026-05-16) explicitly deferred:** `harness/workflows/setup-code.md` Pattern 1 ("Apresenta plano numerado antes de qualquer mudança em código" — universal plan-always wording that contradicts `Plan required: yes/no` from brief 000 and `CLAUDE.md` R15) and Pattern 5 ("Mensagens de commit incluem trailer Co-authored-by: Claude" — contradicts `CLAUDE.md` R10, `GIT_WORKFLOW.md` G-R3, and anti-pattern G-A7). Plus `harness/skills-plan/pause-3-protocol.md` lines 10 and 28: `BRIEF_*.md` (glob form) references that escaped the brief 009 Edit 5 sweep regex.
- **Brief 010 (2026-05-17, Agent-kit → harness rename) recap noted:** `harness/README.md` body still uses bootstrap-kit framing ("Premissa", "Como usar (primeira vez no projeto)", "Princípio do kit") even though brief 010 already reframed the opening paragraph as permanent operational scaffolding. The two framings now coexist in the same file.
- **Carried from 2026-05-16-009 (chat-side):** style directive "no unusual symbols" (greek letters, drama-formatting glyphs) is still informal — needs to land in `MENTOR_BRIEF.md`. Best fit is refining M-R7 (compact mode / formatting density) rather than adding a new rule.
- **Carried from 2026-05-17-010 (chat-side):** M-R10 (pt-BR chat, English dev surface) is ambiguous against the newer `CLAUDE.md` R9, which already carves out `harness/` as a human-edited interface where pt-BR is acceptable. M-R10 should cross-reference R9 explicitly.

This brief closes those items. It does **not** touch Git line-endings (CRLF/LF — has real technical decisions about `.gitattributes` content and retroactive normalization) or the GOTCHAS candidate about literal sweeps colliding with derived identifiers (placement undecided: stack-traps file vs. orchestration playbook). Both are deferred to the next brief (cluster: workflow lifecycle).

Phase 1 monorepo bootstrap follows after this brief lands.

## Goal

After this task:

- `harness/workflows/setup-code.md` Pattern 1 reflects the `Plan required: yes/no` flag (conditional plan, not universal).
- `harness/workflows/setup-code.md` Pattern 5 is removed entirely (no co-author trailer; the rule is "no trailers", not "trailers configured elsewhere").
- The dangling "PERGUNTAS PRA REVISÃO FUTURA" question about Co-authored-by at the bottom of `setup-code.md` is removed — the question is resolved (G-A7).
- `harness/skills-plan/pause-3-protocol.md` no longer references `BRIEF_*.md` in either the "Quando essa Skill ativaria" list (line 10) or the embedded SKILL.md `description` field (line 28).
- `harness/README.md` reads coherently with harness as permanent scaffolding of the Saci repo, with the bootstrap-into-new-project pattern marked as a secondary use case rather than the primary framing.
- `docs/MENTOR_BRIEF.md` M-R7 includes a clause prohibiting unusual symbols (greek letters, decorative glyphs) in favor of descriptive labels.
- `docs/MENTOR_BRIEF.md` M-R10 cross-references `CLAUDE.md` R9 explicitly so the `harness/` pt-BR exception is not a tacit one.

No code is touched. No new dependency. No `git push`.

## Constraints

### Files in scope

| # | File | Change type |
|---|---|---|
| 1 | `docs/tasks/011-harness-cleanup/brief.md` | Pre-saved by user; verified + committed as commit #1 (caminho B) |
| 2 | `harness/workflows/setup-code.md` | Replace Pattern 1 wording; remove Pattern 5; remove dangling Co-authored-by question |
| 3 | `harness/skills-plan/pause-3-protocol.md` | Remove `BRIEF_*.md` bullet on line 10; rewrite SKILL.md `description` on line 28 |
| 4 | `harness/README.md` | Reorder use-case sections; relabel "Princípio do kit" as "Princípio"; trim bootstrap-kit framing in two paragraphs |
| 5 | `docs/MENTOR_BRIEF.md` | Replace M-R7 paragraph; replace M-R10 paragraph |

### Out of scope

- Any application code (`main.js`, `psd-worker.js`, `preload.js`, `renderer/**`, `storage/**`, `automation/**`, anything under `assets/` or `test/`). v1 is in freeze; v2 has no code yet.
- `CLAUDE.md`, `docs/GIT_WORKFLOW.md`, `docs/GOTCHAS.md`, `docs/AGENT_PLAYBOOK.md`, `docs/ROADMAP.md`. Byte-identical to before.
- `package.json`, `package-lock.json`, `.gitignore`, `.githooks/`, `.gitattributes`. Line-endings policy is the next brief.
- Adding new GOTCHAS entries. The literal-sweep × derived-identifiers gotcha is the next brief; placement (GOTCHAS.md vs. AGENT_PLAYBOOK.md) is undecided.
- Modeling `audit-merge` workflow, the `close-chat-session.md` "branch before recap commit" step, the `<date>-<role>-...` naming convention formalization, or the `commit-discipline × pause-3-protocol` overlap. All defer to the next brief (workflow lifecycle cluster).
- Translating any pt-BR prose in `harness/` to English. R9 explicitly carves `harness/` out as human-edited interface; pt-BR is fine.
- Renumbering, reordering, or adding new M-R rules. M-R7 and M-R10 are refined in place.
- Any `git push` (CLAUDE.md R17 / GIT_WORKFLOW.md G-R5).

### Conventions

- `docs/MENTOR_BRIEF.md` additions: **English** (R9 — agent-consumed surface).
- `harness/workflows/setup-code.md`, `harness/skills-plan/pause-3-protocol.md`, `harness/README.md` additions: **pt-BR** in the surrounding prose (existing language of those files; R9 carves them out as human-edited interface).
- All commits follow Conventional Commits (CLAUDE.md R10, GIT_WORKFLOW.md G-R3); all commits in this brief use type `docs:`.
- No `Co-authored-by` trailer (G-A7, G-R3).
- Pre-commit hook is not bypassed with `--no-verify` (R13).

### Architectural decisions already made (do not revisit)

Closed in the design session (chat, 2026-05-18). Executor implements; does not propose alternatives.

- **D1 — Pattern 1 wording reflects the flag, not a universal plan rule.** New wording references `Plan required: yes/no` from the brief and `CLAUDE.md` R15 (≥ 2 files or ≥ 50 lines).
- **D2 — Pattern 5 is removed, not replaced.** The rule across the project is "no co-author trailers" (R10, G-R3, G-A7). No `.git/config` workaround is endorsed. The "PERGUNTAS PRA REVISÃO FUTURA" question that asked whether Co-authored-by should be `.git/config`-managed is also removed for the same reason — the question is closed.
- **D3 — Replace the `BRIEF_*.md` trigger in pause-3-protocol with no trigger from briefs at all.** Briefs now live in `docs/tasks/<NNN>-<slug>/brief.md` and exist for every past and future task, so brief presence is not a signal of "task in progress". Reliable triggers are `STATE.md` at repo root and the active branch prefix.
- **D4 — README reframe is structural, not a rewrite.** Reorder "Como usar (em projeto já configurado)" above "Como usar (primeira vez no projeto)"; relabel the latter as "Bootstrap em projeto novo (caso de uso secundário)"; rename "Princípio do kit" to "Princípio"; rewrite the one-paragraph framing inside. Other paragraphs unchanged.
- **D5 — M-R7 refinement adds one sentence at the end about symbol hygiene; numbering and surrounding rules are byte-identical to before.**
- **D6 — M-R10 refinement adds an explicit reference to `CLAUDE.md` R9's three-surface split; numbering and surrounding rules are byte-identical to before.**
- **D7 — Five commits, one PR, squash-merged into `main` per project convention.** Commit grouping in "Suggested commit sequence" below.

---

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The user pre-saved this brief to `docs/tasks/011-harness-cleanup/brief.md` before invoking the executor (caminho B). The executor verifies presence and commits.

- [ ] Directory `docs/tasks/011-harness-cleanup/` exists
- [ ] File `docs/tasks/011-harness-cleanup/brief.md` exists; first line is `# Brief: 011 — Harness cleanup: workflow patterns, glob refs, README reframe, style refinements`
- [ ] `git add docs/tasks/011-harness-cleanup/brief.md` is staged
- [ ] Commit #1 created with subject `docs(tasks): add brief for 011-harness-cleanup`

If the file is missing or the first line does not match, **STOP and report**. Do not regenerate the brief from memory.

---

### Edit 2 — `harness/workflows/setup-code.md`: Pattern 1

Inside the `## --- COPIAR ---` block, find this exact line:

```
1. Apresenta plano numerado antes de qualquer mudança em código
```

Replace with:

```
1. Apresenta plano numerado antes de qualquer mudança em código
   se o brief indicar `Plan required: yes` (ou na ausência de
   brief, se a mudança tocar ≥ 2 arquivos ou ≥ 50 linhas — R15)
```

- [ ] Line replaced byte-for-byte with the new wording
- [ ] Indentation matches the rest of the numbered list (two-space continuation aligned with the `1.`)
- [ ] No other line in the `--- COPIAR ---` block is modified

---

### Edit 3 — `harness/workflows/setup-code.md`: Pattern 5 and the dangling question

#### 3a. Remove Pattern 5 from the `--- COPIAR ---` block

Find this exact block:

```
4. Mensagens de commit seguem Conventional Commits
5. Mensagens de commit incluem trailer
   "Co-authored-by: Claude <noreply@anthropic.com>"
```

Replace with:

```
4. Mensagens de commit seguem Conventional Commits (R10) sem
   trailers — sem `Co-authored-by`, sem `Signed-off-by` (G-R3, G-A7)
```

- [ ] The block above is replaced; the list ends at item 4 (no item 5)
- [ ] No other line in the `--- COPIAR ---` block is modified

#### 3b. Remove the dangling Co-authored-by question

At the bottom of the file, find this section heading and the bullet beneath it:

```
## ❓ PERGUNTAS PRA REVISÃO FUTURA

- A regra de Co-authored-by deveria ser configurada via
  `.git/config` em vez de exigir do agente toda vez?
- Vale documentar mais opções de configuração do Claude Code
  (model selection, context limits, etc.)?
```

Replace with:

```
## ❓ PERGUNTAS PRA REVISÃO FUTURA

- Vale documentar mais opções de configuração do Claude Code
  (model selection, context limits, etc.)?
```

- [ ] The Co-authored-by bullet is gone
- [ ] The Claude Code config bullet is unchanged and remains as the only item under the heading
- [ ] The section heading is preserved

---

### Edit 4 — `harness/skills-plan/pause-3-protocol.md`: line 10 and line 28

#### 4a. Remove the `BRIEF_*.md` trigger on line 10

In the section `## Quando essa Skill ativaria`, find this exact bullet block:

```
- Existe `BRIEF_*.md` na raiz do projeto
- Existe `STATE.md` na raiz do projeto
- Branch atual começa com `feat/`, `fix/`, `refactor/`, etc.
```

Replace with:

```
- Existe `STATE.md` na raiz do projeto
- Branch atual começa com `feat/`, `fix/`, `refactor/`, etc.
```

- [ ] The `BRIEF_*.md` bullet is removed
- [ ] The two remaining bullets are byte-identical to before
- [ ] No other line in the "Quando essa Skill ativaria" section is modified

#### 4b. Rewrite the SKILL.md `description` field on line 28

Inside the fenced ```markdown` block showing the SKILL.md, find this exact `description` line:

```
description: Ativa em sessões de tarefa estruturada (existe
  BRIEF_*.md, STATE.md, ou branch começa com feat/fix/refactor).
  Enforça as 3 pausas do AGENT_PLAYBOOK antes de cada commit. Use
  pra garantir que checkpoints humanos sejam respeitados.
```

Replace with:

```
description: Ativa em sessões de tarefa estruturada (existe
  STATE.md ou branch começa com feat/fix/refactor). Enforça as 3
  pausas do AGENT_PLAYBOOK antes de cada commit. Use pra garantir
  que checkpoints humanos sejam respeitados.
```

- [ ] The `BRIEF_*.md` reference inside the description is removed
- [ ] Indentation inside the fenced block is preserved (two-space continuation aligned with `description:`)
- [ ] No other line of the embedded SKILL.md example is modified

#### 4c. Verification grep (after both sub-edits)

Run:

```
grep -n 'BRIEF_' harness/skills-plan/pause-3-protocol.md
```

- [ ] Output is empty (zero matches)

---

### Edit 5 — `harness/README.md`: reframe

#### 5a. Swap the two "Como usar" sections

Currently the file shows, in order: `## Como usar (primeira vez no projeto)` then `## Como usar (em projeto já configurado)`.

Reorder so that "em projeto já configurado" comes first and "primeira vez no projeto" comes second. Relabel the latter heading from `## Como usar (primeira vez no projeto)` to `## Bootstrap em projeto novo (caso de uso secundário)`.

The bodies of both sections move with their headings. No body content is modified in this sub-edit.

- [ ] Section `## Como usar (em projeto já configurado)` now appears before `## Bootstrap em projeto novo (caso de uso secundário)`
- [ ] Both section bodies move intact with their headings
- [ ] No content from either body is added or removed in this sub-edit

#### 5b. Trim the "Premissa" blockquote

Find this exact block:

```
> **Premissa:** este kit não te dá documentos prontos. Te dá
> **prompts que fazem o agente gerar os documentos certos pro seu
> projeto específico**. O que você ganha é metodologia + sequência —
> os arquivos finais nascem da sua primeira conversa com o agente.
```

Replace with:

```
> **Premissa:** o harness é o scaffolding de orquestração permanente
> deste repositório — workflows, prompts e doutrina pra trabalhar
> com agentes IA no Saci. O caso de uso primário é operar o projeto
> dia a dia; o bootstrap em projeto novo (seção secundária abaixo)
> reaproveita os mesmos artefatos como ponto de partida.
```

- [ ] The blockquote text matches the new content byte-for-byte
- [ ] The blockquote remains immediately below the first paragraph (no structural move)

#### 5c. Rename and rewrite "Princípio do kit"

Find this exact section:

```
## Princípio do kit

**Documentos vivos > templates estáticos.** Templates envelhecem.
Documentos vivem porque foram criados pro contexto deles.

Esse kit te dá o **processo**. Os artefatos vêm depois.
```

Replace with:

```
## Princípio

**Documentos vivos > templates estáticos.** Templates envelhecem.
Documentos vivem porque foram criados pro contexto deles.

O harness te dá o **processo** de orquestração — workflows
copiáveis, prompts de bootstrap, doutrina de pausa. Os artefatos
canônicos (`CLAUDE.md`, `docs/MENTOR_BRIEF.md`, etc.) nascem desse
processo e evoluem com o projeto.
```

- [ ] Heading is now `## Princípio` (not `## Princípio do kit`)
- [ ] Body matches the new content byte-for-byte

---

### Edit 6 — `docs/MENTOR_BRIEF.md`: refine M-R7

Find the current M-R7 paragraph in §4:

```
**M-R7 — Default to medium-density responses; compact mode on request.** Headers + bullets + short paragraphs. Tables for comparisons of 3+ options. Code blocks for anything ≥ 2 lines of code or commands. No emojis except sparingly for status (✓, ⚠️) when they aid scanning. **Compact mode** activates when the user signals he wants tighter responses ("respostas mais enxutas", "direto ao ponto", or similar): shrink to the minimum useful answer plus short expansion markers ("posso aprofundar"). Compact mode persists for the session; default density returns next session unless reasserted.
```

Replace with:

```
**M-R7 — Default to medium-density responses; compact mode on request.** Headers + bullets + short paragraphs. Tables for comparisons of 3+ options. Code blocks for anything ≥ 2 lines of code or commands. No emojis except sparingly for status (✓, ⚠️) when they aid scanning. **No unusual symbols** for labels or grouping — no greek letters (α, β, γ), no decorative glyphs, no emphasis-by-symbol. Use descriptive labels instead ("option 1 / option 2", "cluster A / cluster B", "the workflow option / the policy option"). **Compact mode** activates when the user signals he wants tighter responses ("respostas mais enxutas", "direto ao ponto", or similar): shrink to the minimum useful answer plus short expansion markers ("posso aprofundar"). Compact mode persists for the session; default density returns next session unless reasserted.
```

- [ ] M-R7 matches the new text byte-for-byte
- [ ] M-R6 (above M-R7) and M-R8 (below M-R7) are byte-identical to before
- [ ] No other M-R rule was modified

---

### Edit 7 — `docs/MENTOR_BRIEF.md`: refine M-R10

Find the current M-R10 paragraph in §4:

```
**M-R10 — Operate in pt-BR for chat, English-only on the dev surface.** Replies, plans, summaries, walkthroughs: pt-BR. Anything written to disk on the dev surface (code, commits, docs, branch names): English. UI strings are bilingual EN + pt-BR via the i18n layer (see `CLAUDE.md` R9).
```

Replace with:

```
**M-R10 — Operate in pt-BR for chat, English on the agent-consumed dev surface; `harness/` human-edited interface may be pt-BR.** Replies, plans, summaries, walkthroughs: pt-BR. Anything written to disk on the agent-consumed dev surface (code, commits, canonical docs, `docs/tasks/**`, branch names): English. Human-edited interface inside `harness/` (init prompts, workflow prose around `--- COPIAR ---` blocks, prompt-template usage notes) may be pt-BR — these files are pasted into chat where pt-BR is already mandated. The three-surface split is canonical in `CLAUDE.md` R9; this rule mirrors it for the chat-mentor lane. UI strings are bilingual EN + pt-BR via the i18n layer.
```

- [ ] M-R10 matches the new text byte-for-byte
- [ ] M-R9 (above M-R10) and M-R11 (below M-R10) are byte-identical to before
- [ ] No other M-R rule was modified

---

## Suggested commit sequence

Per R10 single-themed commits. Five commits, one PR, squash-merged on the GitHub side.

1. `docs(tasks): add brief for 011-harness-cleanup` (Edit 1)
2. `docs(setup-code): align patterns with Plan required flag and no-trailer policy` (Edits 2 + 3 — same file, same theme)
3. `docs(skills-plan): replace stale BRIEF glob refs in pause-3-protocol` (Edit 4)
4. `docs(harness-readme): reframe harness as permanent scaffolding` (Edit 5 — all three sub-edits)
5. `docs(mentor-brief): refine M-R7 with style hygiene and M-R10 with harness split` (Edits 6 + 7 — same file, same theme)

Push is the user's call (CLAUDE.md R17 / GIT_WORKFLOW.md G-R5). Stop after commit 5 and report.

---

## Output expected at the end of the session

A single message reporting:

1. Branch name and `git log --oneline main..HEAD` (should show 5 commits in the order above)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Result of the sweep verification: `grep -rn 'BRIEF_' harness/skills-plan/pause-3-protocol.md` (expected: empty)
4. Result of the sweep verification: `grep -n 'Co-authored-by' harness/workflows/setup-code.md` (expected: empty)
5. List of files modified by each commit
6. Any out-of-scope items encountered, with the reason they were paused per Pause 2 / Pause 3 protocol
7. Confirmation that no `git push` was run

---

## When to skip Pause 1 (`Plan required: no`)

This brief sets `Plan required: no` because all three criteria from `harness/prompts/task-brief-template.md` hold:

- **All architectural decisions are recorded** in D1–D7 above.
- **Done criteria are concrete and verifiable** — every Edit specifies Find/Replace blocks with the exact text on both sides, plus a verification checklist.
- **No ambiguity about which files to touch or how** — the in-scope table lists five files; the out-of-scope list explicitly enumerates what stays untouched.

**Pause 2 (after the first modified file) and Pause 3 (before each commit) remain mandatory.** They catch drift the brief did not anticipate (Lesson #6 of `AGENT_PLAYBOOK.md`).

If during execution the executor finds that any Find block does not match the actual file content byte-for-byte, **STOP and report**. Do not "fix" the file from memory or approximate the replacement.

---

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — R9 (three-surface language split), R10 (Conventional Commits, no trailers), R13 (no `--no-verify`), R15 (plan-before-code threshold), R17 (no proactive push)
2. `docs/MENTOR_BRIEF.md` — current M-R7 and M-R10 (to be replaced)
3. `docs/GIT_WORKFLOW.md` — G-R3 (no co-author trailer), G-R5 (push authorization), G-A7 (Co-authored-by anti-pattern)
4. `harness/prompts/task-brief-template.md` — caminho B convention (Edit 1 = verify on disk + commit), `Plan required` flag definition
5. `harness/workflows/start-task.md` — the invocation surface for this brief
6. `harness/workflows/setup-code.md`, `harness/skills-plan/pause-3-protocol.md`, `harness/README.md` — the files being modified

---

## Expected output

1. Branch `docs/harness-cleanup` created and working tree clean at session end
2. Five commits as specified in "Suggested commit sequence"
3. `STATE.md` at the end indicating completed (or removed)
4. All five in-scope files modified per spec
5. Brief summary reported in the final message per "Output expected at the end of the session" above
