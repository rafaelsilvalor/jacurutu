# Brief: 012 — Workflow lifecycle cleanup

> **Category:** M
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/workflow-lifecycle-cleanup`

---

## Context

Consolidates seven items of doctrine and workflow cleanup that accumulated across sessions 007–011. Sources:

1. **`audit-merge` workflow formalization** — three-dimension post-merge audit (technical diff vs. brief, process adherence, executor self-review quality) was first executed informally in brief 007 and reused ad-hoc in sessions 010 and 011. Never formalized as a workflow file. Cluster scoping session 012 confirmed: formalize now.
2. **`close-chat-session.md` "branch before recap commit" step** — mitigation for the G-R1 violation in session 2026-05-17 close (mentor recap committed directly to `main` locally; caught before push and recovered).
3. **Naming convention `<date>-<role>-<NNN>-<slug>` formalization** — convention introduced in session 010 close, applied forward-compatible since, never landed in workflow files. Retroactive sweep of pre-convention recap filenames pending.
4. **`commit-discipline` × `pause-3-protocol` overlap resolution** — both skill-plan drafts cover Pausa 3. Cluster scoping closed: keep both with disjoint descriptions (option B).
5. **GOTCHAS candidate — literal-sweep × derived-identifiers + brief self-referential rewriting** — surfaced in brief 010 rename operation (caught at executor's Pausa 3). Placement decision (`docs/GOTCHAS.md` vs. `docs/AGENT_PLAYBOOK.md`) closed at modeling: `docs/GOTCHAS.md` with new category `G-PROC`.
6. **`.gitattributes` policy** — LF/CRLF warnings emit on every new file Git touches across sessions. Default `* text=auto eol=lf` was closed at cluster scoping. Retroactive renormalization as a dedicated commit registered in `.git-blame-ignore-revs`.

Three items from the workflow-lifecycle cluster are deferred to brief 013, post Phase 1: position of executor's internal memory in the four-level source hierarchy; "no verbal override" reinforcement pattern; promotion of `commit-discipline.md` / `task-pauses-protocol.md` from draft to active Skill. Brief 012 leaves those untouched.

No application code is touched. No new dependency. This brief is caminho B (pre-saved by user; executor verifies on disk + commits as commit #1).

## Goal

After this task:

- `harness/workflows/audit-merge.md` exists with the three-dimension audit procedure formalized.
- `harness/workflows/README.md` indexes the new workflow under the section containing `review-pause3.md` and `review-final-task.md`, positioned chronologically after `review-final-task.md`.
- `harness/workflows/close-chat-session.md` PASSO 5 instructs branch creation before listing commit candidates (defensive against the G-R1 violation pattern); PASSO 3 reflects the `<date>-mentor-<NNN>-<slug>` convention.
- `harness/workflows/close-task.md` PASSO 5 prescribes the executor recap filename convention `<date>-executor-<NNN>-<slug>.md`.
- All pre-convention recap files in `docs/sessions/` are renamed to the canonical form via `git mv` + sweep of cross-references.
- `harness/skills-plan/commit-discipline.md` is rewritten to focus on the commit moment (Conventional Commits, message fidelity, no-push, no co-author trailer); `harness/skills-plan/pause-3-protocol.md` is renamed to `task-pauses-protocol.md` and rewritten to focus on session-level pauses 1 and 2, with Pausa 3 reduced to a cross-reference.
- `docs/GOTCHAS.md` has a new `G-PROC` category and entry `G-PROC-1` documenting literal-sweep collisions with derived identifiers and brief self-referential rewriting.
- `.gitattributes` exists at repo root with `* text=auto eol=lf` plus a guarded binary list; a renormalization commit is registered in `.git-blame-ignore-revs`; `docs/GIT_WORKFLOW.md` documents the per-clone `git config blame.ignoreRevsFile` step.
- `docs/tasks/012-workflow-lifecycle-cleanup/brief.md` exists on disk and is committed as commit #1.

## Constraints

### Files in scope

| # | File | Change type |
|---|---|---|
| 1 | `docs/tasks/012-workflow-lifecycle-cleanup/brief.md` | Pre-saved by user; verified + committed as commit #1 |
| 2 | `harness/workflows/audit-merge.md` | New file |
| 3 | `harness/workflows/README.md` | Add catalog entry for `audit-merge.md` |
| 4 | `harness/workflows/close-chat-session.md` | PASSO 5 prep (branch check); PASSO 3 + PASSO 4 naming convention update |
| 5 | `harness/workflows/close-task.md` | PASSO 5 — add executor recap filename convention line |
| 6 | `docs/sessions/*.md` (specific files, enumerated below) | `git mv` rename per convention; sweep cross-references |
| 7 | `harness/skills-plan/commit-discipline.md` | Rewrite per Edit 6 spec |
| 8 | `harness/skills-plan/pause-3-protocol.md` → `task-pauses-protocol.md` | Rename + rewrite per Edit 6 spec |
| 9 | `docs/GOTCHAS.md` | Add category `G-PROC` + entry `G-PROC-1` |
| 10 | `.gitattributes` | New file at repo root |
| 11 | `.git-blame-ignore-revs` | New file at repo root |
| 12 | `docs/GIT_WORKFLOW.md` | Operational note about per-clone `blame.ignoreRevsFile` setting |

### Out of scope

- Any application code (`main.js`, `psd-worker.js`, `preload.js`, `renderer/**`, `storage/**`, `automation/**`, `assets/**`). v1 is in freeze (`MENTOR_BRIEF.md` §2); v2 has no code yet.
- `package.json`, `package-lock.json`, `.gitignore`, `.githooks/`.
- Promotion of `commit-discipline.md` and `task-pauses-protocol.md` from draft to active Skill (frontmatter, SKILL.md formalization). Deferred to brief 013 or later.
- Position of executor's internal memory in the source hierarchy. Deferred to brief 013.
- "No verbal override" reinforcement pattern in briefs. Deferred to brief 013.
- Adding pt-BR carve-outs for Windows-specific files (`.bat`, `.cmd`) in `.gitattributes`. No such files exist today; add when the first real case appears.
- Translating any pt-BR section of `harness/**` into English. R9 explicitly carves these out.
- Any `git push` (`CLAUDE.md` R17 / `GIT_WORKFLOW.md` G-R5).

### Conventions

- `docs/GOTCHAS.md`, `docs/GIT_WORKFLOW.md`, `docs/sessions/**` content additions: **English** (R9 — agent-consumed surface).
- `harness/workflows/**.md`, `harness/skills-plan/**.md`, `harness/workflows/README.md` additions: **pt-BR** in surrounding prose (existing language of those files; R9 human-edited interface carve-out). English inside any block that produces canonical output.
- All commits follow Conventional Commits (`CLAUDE.md` R10, `GIT_WORKFLOW.md` G-R3); commits in this brief use `docs:` or `chore:`.
- No `Co-authored-by` trailer (`GIT_WORKFLOW.md` G-R3, G-A7).
- Pre-commit hook is not bypassed with `--no-verify` (`CLAUDE.md` R13).

### Architectural decisions already made (do not revisit)

Closed in the design sessions (chat, 2026-05-19 cluster scoping and 2026-05-20 modeling). Executor implements; does not propose alternatives.

- **D1 — `audit-merge.md` is invoked by mentor in chat, not by executor.** Mode §8: "code review". Output lives in the session recap, not in a separate `docs/audits/` file.
- **D2 — `audit-merge.md` PASSO 1 expects the executor recap to be in `main` already.** Audit does not run against a moving target on the executor's branch.
- **D3 — `audit-merge.md` Dimensão 3 keeps interpretive criteria.** Not reformulated as objective checklist; subjective judgment is part of the audit's value.
- **D4 — Carry-over hygiene lives inside Dimensão 3,** not as a separate fourth dimension.
- **D5 — `audit-merge.md` output is part of the chat session recap (mode "code review").** Not a separate artifact in `docs/audits/`.
- **D6 — `close-chat-session.md` branch step lives inside PASSO 5** (not as a new PASSO 6). Uses the expanded form (`git branch --show-current` + conditional `git checkout -b`) for explicit defense.
- **D7 — Edit 4 touches only `close-chat-session.md`, not `close-task.md`** for the branch defense. `close-task.md` is pre-merge and not vulnerable to the same pattern.
- **D8 — Branch name template for session recap commits is `docs/session-recap-<date>-<slug>`.**
- **D9 — Naming convention also touches `close-task.md`** (Edit 5 sub-edit), via a short line in PASSO 5 prescribing the executor recap filename. No new template file is created.
- **D10 — Retroactive sweep uses `git mv` + cross-reference sweep,** not forward-only. Ironic but justified: applying the G-PROC-1 workaround (enumerate artifacts, prescribe each name) makes the sweep robust.
- **D11 — Brief enumerates the rename inventory explicitly.** Executor verifies enumeration matches reality (Edit 5 PASSO 1 — `ls docs/sessions/`); stops if a file appears that isn't in the brief's table.
- **D12 — Skill overlap resolution is option (B) — keep both with disjoint descriptions.** `pause-3-protocol.md` renames to `task-pauses-protocol.md`. `commit-discipline.md` drops co-author trailer instruction, gains explicit reference to `R10`/`G-R3`/`G-A7`. Status stays "rascunho" — promotion to active Skill is out of scope.
- **D13 — GOTCHAS placement is option (A) — `docs/GOTCHAS.md` with new category `G-PROC`.** Single entry `G-PROC-1` covering both failure modes (derived identifiers + meta-discourse) under a common cause.
- **D14 — Brief 012 itself cross-references G-PROC-1 in Edit 5** (sweep applies the workaround) and Edit 7 (catalogs the trap).
- **D15 — `.gitattributes` uses the expanded binary list** (option a of Edit 8 Q1) with a guard-rail: executor stops and reports if `git add --renormalize` touches an extension not in the binary list that is likely binary.
- **D16 — Three separate commits for the `.gitattributes` flow:** 8a (`.gitattributes`), 8b (renormalize), 8c (`.git-blame-ignore-revs` with 8b's SHA). Order matters.
- **D17 — `blame.ignoreRevsFile` documentation lives in `docs/GIT_WORKFLOW.md`,** not in `CLAUDE.md` or `README.md`.
- **D18 — Edit 8 runs last in the brief,** after Edits 2–7. Renormalization on a clean tree; otherwise `--ignore-rev` loses its point.
- **D19 — Brief stays category M.** All sub-edits are mechanical with prescribed content; no Pausa 1 required.

---

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The user pre-saved this brief to `docs/tasks/012-workflow-lifecycle-cleanup/brief.md` before invoking the executor (caminho B). The executor verifies presence and commits.

- [ ] Directory `docs/tasks/012-workflow-lifecycle-cleanup/` exists
- [ ] File `docs/tasks/012-workflow-lifecycle-cleanup/brief.md` exists; first line is `# Brief: 012 — Workflow lifecycle cleanup`
- [ ] `git add docs/tasks/012-workflow-lifecycle-cleanup/brief.md` is staged
- [ ] Commit #1 created with subject `docs(tasks): add brief for 012-workflow-lifecycle-cleanup`

If the file is missing or the first line does not match, **STOP and report**. Do not regenerate the brief from memory.

---

### Edit 2 — Create `harness/workflows/audit-merge.md`

Create new file `harness/workflows/audit-merge.md` with the content below. Surrounding prose pt-BR (R9 human-edited interface carve-out); COPIAR block also pt-BR (read and pasted by Rafael in chat for an audit session).

```markdown
# Workflow: Audit Merge

## Quando usar

Pós-merge de uma PR não-trivial, antes de fechar a sessão. Modo §8
do `MENTOR_BRIEF.md`: code review. Aplicar quando a PR mergeada
implementou um brief de categoria M ou L.

Para tarefas categoria S sem brief, auditoria formal é overkill —
basta uma checada visual no `git log` e no diff.

## Pré-requisitos

- PR mergeada em `main`.
- Recap do executor já mergeado em `main` (D2). Auditoria não roda
  contra branch ativa do executor.
- Brief original acessível (na project knowledge do Claude.ai ou
  no checkout local).

## --- COPIAR ---

```
Auditoria pós-merge da PR <NNN>. Modo: code review.

PASSO 1 — Carrega contexto:
  - Brief: docs/tasks/<NNN>-<slug>/brief.md
  - Recap do executor: docs/sessions/<date>-executor-<NNN>-<slug>.md
  - git log da branch: git log --oneline main..<merge-commit>^2
  - Diff total: git diff main~1..main -- <paths-tocados>

PASSO 2 — Dimensão 1 — Diff técnico:
Pra cada Edit do brief, compara prescrito vs. mergeado. Classifica em:
  - Match perfeito (silêncio)
  - Wording ajustado, semântica preservada (registra; aceitável)
  - Divergência semântica ou scope leak (escalar)

PASSO 3 — Dimensão 2 — Aderência ao processo:
  - Conventional Commits em todos os commits (R10)
  - Sequência de commits bate com "Suggested commit sequence" do brief
  - Pausa 2 e Pausa 3 registradas no recap do executor
  - Sem Co-authored-by (grep git log --format=%B | grep -i co-authored)
  - STATE.md start + remove (G-R10)
  - Sem --no-verify mencionado
  - Branch naming bate com R11

PASSO 4 — Dimensão 3 — Self-review do executor:
  - Decisões do recap são distintas das do brief (não paráfrase)
  - Pendências incluem itens não previstos no brief
  - Desvios reportados honestamente (não escondidos)
  - Carry-overs de sessões anteriores foram revisados (carry-over hygiene)

PASSO 5 — Veredicto:
Pra cada dimensão: pass | pass-with-note | fail
Se fail em qualquer dimensão, propõe ação:
  - Novo brief de correção
  - Pendência registrada no recap
  - Fix in-place na próxima sessão
```

## --- FIM COPIAR ---

## Princípio em jogo

**Pós-merge é a única janela barata pra correção.** Antes do merge,
mudanças custam revert. Depois do merge sem auditoria, drift acumula
silenciosamente. Auditoria explícita força os três eixos a se tornar
evidência registrada, não memória do mentor.

## Próximo workflow

- Pass nas três dimensões → `close-chat-session.md` (modo code review).
- Fail em Dimensão 1 ou 3 → novo brief de correção via
  `init/07-create-brief.md` ou modelagem ad-hoc no chat.
- Fail em Dimensão 2 → pendência registrada no recap; correção entra
  no próximo brief estrutural.
```

#### Verification

- [ ] File `harness/workflows/audit-merge.md` exists
- [ ] All seven required sections present (Quando usar, Pré-requisitos, `--- COPIAR ---`, `--- FIM COPIAR ---`, Princípio em jogo, Próximo workflow)
- [ ] COPIAR block contains all five PASSO entries
- [ ] No other file modified in this commit

Commit: `docs(workflows): add audit-merge workflow`

---

### Edit 3 — Index `audit-merge.md` in `harness/workflows/README.md`

Locate the section in `harness/workflows/README.md` that contains entries for `review-pause3.md` and `review-final-task.md`. The section is likely named "### Revisão" but the name is not verified — **if the section name is unrecognizable or those two entries are absent, STOP and report**.

After the entry for `review-final-task.md`, add this new entry (preserve the existing entry style — one bullet, no hierarchy):

```markdown
- **`audit-merge.md`** — auditoria pós-merge de tarefa (modo code
  review do §8): três dimensões — diff técnico, aderência ao
  processo, qualidade do self-review do executor
```

#### Verification

- [ ] Section containing `review-pause3.md` and `review-final-task.md` located
- [ ] New entry for `audit-merge.md` added immediately after `review-final-task.md`
- [ ] Entry style (bullet format, indentation, length) matches the existing entries in the section
- [ ] No other section of the README modified

Commit: `docs(workflows): catalog audit-merge in README`

---

### Edit 4 — `close-chat-session.md` branch defense + naming convention

Two sub-edits in the same file, same commit.

#### 4a — PASSO 5 branch defense

Locate the current PASSO 5 of the COPIAR block in `harness/workflows/close-chat-session.md`. Its current text starts with `PASSO 5 — Lista "vale commitar agora?" candidatos:` and continues with the bullet list of files.

Replace the entire PASSO 5 with:

```
PASSO 5 — Lista "vale commitar agora?" candidatos:

Antes de listar, verifica estado da branch:

  1. git branch --show-current
  2. Se = main: git checkout -b docs/session-recap-<date>-<slug>
     Razão: commit do recap não pode ir direto em main (G-R1).
  3. Se != main: confirma que a branch é apropriada pro recap
     (não é a branch da tarefa de código já mergeada — recap mora
     em branch dedicada).

Candidatos:
- STATE.md (se existir)
- MENTOR_BRIEF.md (novo padrão ou regra nasceu na sessão?)
- GOTCHAS.md (armadilha nova descoberta?)
- CLAUDE.md (regra ou exceção nasceu?)
- brief de tarefa em curso (correção de escopo?)
NÃO comita — só lista. Decisão e Pausa 3 são humanas (M-R3).
```

#### 4b — PASSO 3 and PASSO 4 naming convention

Locate PASSO 3 of the same COPIAR block. Its current text is:

```
PASSO 3 — Propõe slug pro arquivo de recap baseado no tópico.
Caminho default: docs/sessions/YYYY-MM-DD-<slug>.md
Pede confirmação do slug antes de finalizar.
```

Replace with:

```
PASSO 3 — Propõe slug pro arquivo de recap baseado no tópico.
Caminho default: docs/sessions/<YYYY-MM-DD>-mentor-<NNN>-<slug>.md
  - <YYYY-MM-DD>: data da sessão
  - mentor: papel fixo (este workflow roda no chat — M-R12)
  - <NNN>: número da tarefa relacionada (zero-padded). Omite se
    a sessão não está atrelada a brief específico
  - <slug>: tópico curto-descritivo em kebab-case
Pede confirmação do slug antes de finalizar.
```

Locate PASSO 4 of the same COPIAR block. The optional executor snippet currently uses `docs/sessions/YYYY-MM-DD-<slug>.md`. Update the path in the example to `docs/sessions/<YYYY-MM-DD>-mentor-<NNN>-<slug>.md` (consistent with the new PASSO 3).

#### Verification

- [ ] PASSO 5 starts with the new branch-defense block before the candidate list
- [ ] PASSO 3 reflects the new naming convention
- [ ] PASSO 4 example path updated consistently
- [ ] All other sections of `close-chat-session.md` are byte-identical to before (PASSO 1, PASSO 2, Trigger, Princípio em jogo, Próximo workflow, Quando usar, Pré-requisitos)
- [ ] No other file modified in this commit

Commit: `docs(workflows): add branch defense and naming convention to close-chat-session`

---

### Edit 5 — Naming convention sweep + `close-task.md` executor recap line

Three sub-edits combined; sub-edit 5a runs first because the executor must enumerate before any rename.

#### 5a — Enumerate `docs/sessions/` and verify

Run `ls docs/sessions/`. Compare the actual file list against this expected table:

| Current filename | Action | New filename |
|---|---|---|
| `2026-05-12-session-rituals-bootstrap.md` | rename | `2026-05-12-mentor-007-session-rituals-bootstrap.md` |
| `2026-05-16-008-modeling-and-followups.md` | rename | `2026-05-16-mentor-008-modeling-and-followups.md` |
| `2026-05-16-009-modeling-and-execution.md` | rename | `2026-05-16-mentor-009-modeling-and-execution.md` |
| `2026-05-17-mentor-010-harness-rename.md` | leave as-is | (already in canonical form) |
| `2026-05-19-011-harness-cleanup.md` | rename | `2026-05-19-executor-011-harness-cleanup.md` |
| `2026-05-19-mentor-011-modeling-and-meta-cleanup.md` | leave as-is | (already in canonical form) |
| `2026-05-19-mentor-012-cluster-scoping.md` | leave as-is | (already in canonical form) |

If `ls docs/sessions/` returns a file that is **not** in this table (e.g. an executor recap for brief 007, 008, 009, or 010 that wasn't visible during modeling), **STOP and report**. Do not invent a name. Mentor will decide the canonical name in the next session.

If a file in the table is **missing** from `ls docs/sessions/`, also **STOP and report**.

#### 5b — Rename and sweep cross-references

For each file with action `rename`:

1. `git mv <current> <new>`.
2. Search the entire repo for cross-references to the old filename. Use a strict literal grep (the filename as a whole token):

   ```
   grep -rn '<current-filename>' . \
     --exclude-dir=.git \
     --exclude-dir=node_modules
   ```

3. For each match, update the reference to the new filename. Adapt surrounding phrasing if needed for grammar.

> **Cross-reference to `G-PROC-1` (catalogued in Edit 7 of this same brief):** this sweep applies the workaround. The list above enumerates each rename by exact source and target, so the sweep doesn't operate on a generative rule against derived identifiers. If unexpected files surface, the brief stops rather than rewriting blindly.

After the sweep, verify:

```
grep -rn '2026-05-12-session-rituals-bootstrap' . \
  --exclude-dir=.git --exclude-dir=node_modules
# expected: matches only inside the renamed file's own content and any historical recap

grep -rn '2026-05-16-008-modeling-and-followups' . \
  --exclude-dir=.git --exclude-dir=node_modules
# similar

grep -rn '2026-05-16-009-modeling-and-execution' . \
  --exclude-dir=.git --exclude-dir=node_modules
# similar

grep -rn '2026-05-19-011-harness-cleanup' . \
  --exclude-dir=.git --exclude-dir=node_modules
# similar
```

If a match remains in canonical documentation (`CLAUDE.md`, `MENTOR_BRIEF.md`, `GIT_WORKFLOW.md`, `AGENT_PLAYBOOK.md`, `ROADMAP.md`, any current `docs/tasks/<NNN>/brief.md`, any `harness/**`), update it. Matches inside historical recap files (`docs/sessions/<date>-*.md` files that describe past sessions) are acceptable — those are historical record; the rename does not retroactively edit history.

#### 5c — `close-task.md` PASSO 5 executor recap convention line

Locate PASSO 5 of the COPIAR block in `harness/workflows/close-task.md`. Its current text reports the summary. After the existing PASSO 5 content (before PASSO 6), insert this paragraph:

```
Se vai produzir recap da execução, salva em:
docs/sessions/<YYYY-MM-DD>-executor-<NNN>-<slug>.md
  - <YYYY-MM-DD>: data do close
  - executor: papel fixo (este workflow roda no executor — Claude Code)
  - <NNN>: número da tarefa (mesmo do brief)
  - <slug>: slug curto-descritivo do tópico
```

#### Verification

- [ ] `ls docs/sessions/` enumerated and verified against the table; no unexpected files
- [ ] Four `git mv` operations completed
- [ ] Cross-reference sweep returned no matches in canonical docs or active task briefs/harness for the four old filenames
- [ ] Historical references inside `docs/sessions/<date>-*.md` files left untouched
- [ ] `close-task.md` PASSO 5 has the new executor recap convention paragraph
- [ ] No other file modified beyond what is listed in the table or the `close-task.md` edit

Commit: `docs(sessions): rename pre-convention recaps and formalize naming in workflows`

---

### Edit 6 — Skill overlap resolution

Three sub-edits in two files (and one rename). Combined into one commit.

#### 6a — Rewrite `harness/skills-plan/commit-discipline.md`

Replace the entire content of `harness/skills-plan/commit-discipline.md` with:

```markdown
# Skill candidata: commit-discipline

> **Status:** rascunho pra discussão. Ainda não é Skill ativa.

## Quando essa Skill ativaria

Quando o agente está prestes a fazer ou propor um commit Git.
Triggers detectáveis:

- Comando que inclui `git commit`
- Frase do usuário: "comita", "comite", "faz o commit", "salva"
- Pausa 3 sendo apresentada (mensagem de commit proposta)

## O que ela carregaria como contexto

Ao ativar, reforça apenas a disciplina do momento commit:

1. Conventional Commits formal (R10)
2. Mensagem reflete fielmente o conteúdo do commit
3. NÃO empurrar (`git push`) sem autorização (R17 / G-R5)
4. Sem trailer `Co-authored-by` (R10 / G-R3 / G-A7)

> **Sobre as pausas estruturais (1 e 2) da tarefa:** elas vivem em
> `task-pauses-protocol.md`. Esta skill cobre só o momento commit;
> a Pausa 3 em si está documentada lá com a mecânica completa
> (status + diff --stat + mensagem + aprovação humana).

## Como o SKILL.md ficaria

```markdown
---
name: commit-discipline
description: Ativa quando você está prestes a fazer ou propor um
  git commit. Reforça Conventional Commits, mensagem fiel ao
  conteúdo, proibição de git push sem autorização, e ausência de
  trailer Co-authored-by. Use quando ver pedido pra "comitar",
  "salvar", ou quando você for apresentar mensagem de commit.
---

# Disciplina de commit

Antes de qualquer commit:

## Conventional Commits obrigatório

Formato: `<tipo>(<escopo>): <descrição imperativa>`

Tipos válidos: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`,
`perf`, `ci` (R10).

Subject ≤ 72 chars, imperative mood. Body explica *why*.

Exemplos válidos:
- `refactor(auth): split login flow into smaller functions`
- `chore(state): mark task as completed`
- `docs(readme): update setup instructions`

## Sem trailer Co-authored-by

Os commits desse projeto são atribuídos só ao autor humano. Trailer
`Co-authored-by` é proibido (R10 / G-R3 / G-A7).

## NÃO empurrar (git push) sem autorização

Push em main = checkpoint humano. Você nunca empurra
automaticamente. Mesmo se humano disser "comite e empurra", você
comita, mostra resultado, e pergunta antes do push (R17 / G-R5).

## Mensagem reflete fielmente

Se o commit faz X e Y, a mensagem cita X e Y. Se faz X mas você
acha "mais limpo" descrever só X, peça permissão pra ajustar
escopo em vez de fingir.

## Sobre Pausa 3 (mecânica de pré-commit)

Documentada em `task-pauses-protocol.md`. Esta skill foca só na
mensagem e nas regras do momento commit.
```

## Avaliação contra os 4 critérios

| Critério | Resposta |
|---|---|
| Situação se repete? | Sim — todo commit |
| Trigger é detectável? | Sim — palavras-chave + comando git |
| Instrução é genérica? | Sim — vale pra todo projeto |
| Custo de errar baixo? | Sim — falso positivo só reforça boa prática |

**Recomendação:** vale criar como primeira Skill universal.

## Riscos

- Excesso de cerimônia: se ativa toda hora, pode irritar
- Conflito com `task-pauses-protocol`: descrições devem ser
  disjuntas — esta cobre commit, aquela cobre pausas 1 e 2.
```

#### 6b — Rename and rewrite `harness/skills-plan/pause-3-protocol.md`

1. `git mv harness/skills-plan/pause-3-protocol.md harness/skills-plan/task-pauses-protocol.md`.

2. Replace the entire content of the renamed file with:

```markdown
# Skill candidata: task-pauses-protocol

> **Status:** rascunho pra discussão. Ainda não é Skill ativa.

## Quando essa Skill ativaria

Quando o agente está em sessão de tarefa estruturada. Triggers
detectáveis:

- Existe `STATE.md` na raiz do projeto
- Branch atual começa com `feat/`, `fix/`, `refactor/`, etc.

## O que ela carregaria como contexto

Ao ativar, reforça o ritmo da sessão — Pausa 1 e Pausa 2 do
`AGENT_PLAYBOOK.md` Cap. 2. Pausa 3 é coberta por
`commit-discipline.md`.

## Como o SKILL.md ficaria

```markdown
---
name: task-pauses-protocol
description: Ativa em sessão de tarefa estruturada (existe
  STATE.md ou branch começa com feat/fix/refactor). Reforça Pausa
  1 (plano antes do código) e Pausa 2 (após primeiro arquivo
  significativo). Pausa 3 fica em commit-discipline.md. Use pra
  garantir que checkpoints estruturais sejam respeitados.
---

# Protocolo das pausas estruturais

Você está em sessão de tarefa estruturada. Duas pausas estruturais
existem antes da Pausa 3 (commit):

## Pausa 1 — Antes de qualquer código

Apresenta plano numerado de passos commitáveis. Cada passo deve:
- Ter mini-marco claro
- Ser commitável em isolado
- Ter mensagem de commit prevista

Aguarda aprovação explícita do humano antes de tocar código.

**Pulável** se o brief declara `Plan required: no` — ver seção
"Quando pular Pausa 1" em `harness/prompts/task-brief-template.md`.

## Pausa 2 — Após primeiro arquivo significativo

Quando o primeiro arquivo substancial foi modificado, mostra
resultado e aguarda revisão. Não avança pra próximo arquivo até
humano confirmar direção.

**Sempre obrigatória**, mesmo com `Plan required: no`.

## Pausa 3 — Antes de cada commit

Coberta por `commit-discipline.md`. Mecânica resumida:
1. Build do projeto passa
2. `git status`
3. `git diff --stat`
4. Mensagem proposta
5. Aguarda autorização explícita

## Sinais de que você está pulando pausa

- Apresentou plano e seguiu sem aguardar "ok" → erro médio
- Modificou múltiplos arquivos antes da Pausa 2 → erro médio
- Comitou sem mostrar diff antes (Pausa 3) → erro grave

Em qualquer caso, **pausa imediato** e reporta ao humano.
```

## Avaliação contra os 4 critérios

| Critério | Resposta |
|---|---|
| Situação se repete? | Sim — toda tarefa estruturada |
| Trigger é detectável? | Sim — STATE.md ou branch prefix |
| Instrução é genérica? | Sim — vale pra qualquer projeto |
| Custo de errar baixo? | Sim — pior caso reforça disciplina |

**Recomendação:** vale criar.

## Riscos

- Pode ser preguiçoso: se ativa em toda branch `feat/*`, pode
  ativar em situações pequenas onde as pausas são overkill
- Sobreposição com `commit-discipline`: resolvida via descrições
  disjuntas (esta cobre Pausa 1 e 2; aquela cobre o momento commit)

## Mitigação

- Description específica pra reduzir falso positivo
- Cross-reference clara com `commit-discipline.md` no SKILL.md
- Testar em projeto real antes de promover a Skill ativa
```

#### Verification

- [ ] `harness/skills-plan/commit-discipline.md` matches the new content
- [ ] `harness/skills-plan/pause-3-protocol.md` no longer exists in the working tree
- [ ] `harness/skills-plan/task-pauses-protocol.md` exists with the new content
- [ ] Status header on both files remains "rascunho pra discussão. Ainda não é Skill ativa." (promotion is out of scope)
- [ ] No references to the old filename `pause-3-protocol.md` remain in canonical documentation or in `harness/**` files (run `grep -rn 'pause-3-protocol' . --exclude-dir=.git --exclude-dir=node_modules`)
- [ ] If matches remain inside historical recap files (`docs/sessions/<date>-*.md`), leave them — historical record
- [ ] No co-author trailer instruction remains in `commit-discipline.md`

Commit: `docs(skills-plan): resolve commit-discipline and task-pauses overlap`

---

### Edit 7 — `docs/GOTCHAS.md`: add `G-PROC` category and `G-PROC-1` entry

Two sub-edits in the same file, same commit.

#### 7a — Category table

Locate the category table in `docs/GOTCHAS.md` (lines beginning with `| Code | Domain |`). Append one new row at the end of the table, preserving alignment:

```markdown
| `G-PROC` | Process/orchestration traps when working with AI agents on briefs |
```

#### 7b — Catalog entry

Locate the `## Catalog` section. Append at the end (after the last existing entry, separated by the standard `---` divider):

```markdown
### G-PROC-1 — Literal sweeps collide with derived identifiers and meta-discourse in briefs

**Symptom:** A find-and-replace sweep prescribed in a brief corrupts files that should be left intact. Three concrete failure modes:

1. Task folder name `010-agent-kit-to-harness/` becomes `010-harness-to-harness/` after a literal `agent-kit → harness` pass.
2. Branch name `refactor/agent-kit-to-harness` becomes `refactor/harness-to-harness`.
3. Prose in the brief itself describing the rename — e.g. "rename agent-kit to harness" — gets rewritten to "rename harness to harness", losing the historical record.

**Cause:** Two failure modes share a root: literal sweeps cannot distinguish between (a) the object of the operation (the rename target — mutate) and (b) meta-discourse about the operation (identifiers derived from the operation; the brief's own prose describing what it does — preserve verbatim). Find-and-replace operates on raw strings without semantic context.

**Workaround:**

1. Before declaring a sweep complete, enumerate the operation's own artifacts (task folder, branch name, brief filename, brief self-references) and exclude them from the sweep explicitly.
2. For derived identifiers (task folders, branches, prior recap filenames): treat as verbatim records of history; never mutate. Relax the final verification grep to allow them.
3. For meta-discourse in the brief: list the literal phrases to preserve in a "Do not rewrite" subsection of the brief's "Architectural decisions already made". Or rephrase the brief itself to avoid embedding the old term in normative prose.
4. When the brief operates on names that appear inside it, distinguish in writing between "the old name" and "the new name" using stable referents (e.g. quote the literal old name with backticks; never let the brief say "rename X to X" after sweep).
5. When the sweep targets historical artifacts that must be renamed (e.g. retroactive recap rename), enumerate each source-target pair in a table inside the brief. The executor verifies the enumeration matches reality (`ls`) and stops if unexpected files appear; the brief never operates against a generative rule on derived identifiers.

**Evidence:** Brief 010 (`010-agent-kit-to-harness/`), session recap `2026-05-17-mentor-010-harness-rename.md`. Executor's Pausa 3 caught both failure modes before merge. Workaround #5 added during brief 012 modeling, applied immediately in Edit 5 of that same brief.
```

#### Verification

- [ ] Category table contains the new `G-PROC` row at the end
- [ ] Catalog has new entry `G-PROC-1` at the end, preceded by `---`
- [ ] Entry follows the file's standard format (Symptom / Cause / Workaround / Evidence)
- [ ] No other content of `GOTCHAS.md` modified

Commit: `docs(gotcha): add G-PROC-1 — literal sweeps and meta-discourse`

---

### Edit 8 — `.gitattributes` + retroactive renormalization

**Runs last in the brief** (D18). Working tree must be clean before sub-edit 8a; Edits 2–7 must be committed and verified.

#### 8a — Create `.gitattributes`

Create `.gitattributes` at the repo root with this exact content:

```
# Default: auto-detect text files, normalize to LF
* text=auto eol=lf

# Explicitly binary (no normalization, no diff)
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.webp binary
*.ico binary
*.psd binary
*.psb binary
*.ai binary
*.indd binary
*.pdf binary
*.zip binary
*.tar.gz binary
*.woff binary
*.woff2 binary
*.ttf binary
*.otf binary
```

Commit only `.gitattributes`:

```
chore(repo): add .gitattributes with LF normalization and binary list
```

#### 8b — Renormalize and commit

Run:

```bash
git add --renormalize .
git status
```

**STOP and report if:**

- `git status` shows a file with an extension **not** in the binary list above that is staged for change and is likely binary (e.g. `.eps`, `.sketch`, `.fig`, `.bin`, `.dmg`, `.exe`, anything unrecognized by content). Do not commit until the binary list is updated by Rafael.
- `git status` shows zero files modified. Skip the commit; renormalization had nothing to fix. Note this in the final report so Edit 8c can be skipped consistently.

Otherwise, commit:

```
chore(repo): renormalize line endings after .gitattributes

This commit normalizes all text files to LF per .gitattributes.
Registered in .git-blame-ignore-revs so `git blame` skips it
(requires per-clone: git config blame.ignoreRevsFile .git-blame-ignore-revs).
```

Capture the resulting commit SHA. It will be used in sub-edit 8c.

#### 8c — Create `.git-blame-ignore-revs`

Create `.git-blame-ignore-revs` at the repo root with:

```
# Line-ending renormalization after .gitattributes (012-workflow-lifecycle-cleanup)
<SHA-from-8b>
```

Substitute `<SHA-from-8b>` with the actual commit SHA from sub-edit 8b. Use the full 40-character SHA.

If sub-edit 8b was skipped (zero files modified), skip sub-edit 8c as well.

Commit:

```
chore(repo): register renormalization commit in blame ignore
```

#### 8d — Document the per-clone config step in `docs/GIT_WORKFLOW.md`

Locate `docs/GIT_WORKFLOW.md`. Find an appropriate operational section (likely near branch setup, pre-commit hook, or PR workflow — verify which section is most operational). Add a short subsection or note (English, R9):

```markdown
### Per-clone configuration: blame ignore file

After cloning the repo, run once:

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

This makes `git blame` skip commits registered in `.git-blame-ignore-revs` (currently: the line-ending renormalization commit). Setting is per-clone and is not versioned. Without it, `git blame` still works but will attribute lines to the renormalization commit instead of the original author for any line that was retouched by LF/CRLF normalization.
```

If the location is genuinely ambiguous (no operational subsection that fits), place the subsection after the "Pull Request workflow" section if it exists, or at the end of the file otherwise. **STOP and report** if `docs/GIT_WORKFLOW.md` has no clear structure to follow.

Commit only the `GIT_WORKFLOW.md` change:

```
docs(git-workflow): document per-clone blame.ignoreRevsFile setup
```

#### Verification

- [ ] `.gitattributes` exists at repo root with the prescribed content
- [ ] If sub-edit 8b produced changes: `.git-blame-ignore-revs` exists at repo root with a single SHA (40 chars) on its own line, preceded by the comment line
- [ ] If sub-edit 8b produced no changes: 8b and 8c skipped, reported in final summary
- [ ] `docs/GIT_WORKFLOW.md` has the new subsection on `blame.ignoreRevsFile`
- [ ] `git status` is clean after all four sub-edits
- [ ] `git diff` is empty after all four sub-edits

Commits in Edit 8 (in order):
1. `chore(repo): add .gitattributes with LF normalization and binary list`
2. `chore(repo): renormalize line endings after .gitattributes` (skip if 8b had no changes)
3. `chore(repo): register renormalization commit in blame ignore` (skip if 8b was skipped)
4. `docs(git-workflow): document per-clone blame.ignoreRevsFile setup`

---

## Pause points

- **Pause 1 (before any change):** **Skipped** — `Plan required: no` (see justification below).
- **Pause 2 (after the first modified file is fully changed):** **Required.** First modified file: `harness/workflows/audit-merge.md` after Edit 2. Show full file content for review before proceeding to Edit 3.
- **Pause 3 (before each commit):** **Required.** Eight to ten commits planned (Edits 1–7 are one commit each; Edit 8 is up to four commits with conditional skipping).

In case of:

- Unrelated bug or doc inconsistency found in a file being edited → report and ask. Do not fix.
- `ls docs/sessions/` (Edit 5 PASSO 1) returns a file not in the expected table → **STOP and report**.
- The section name in `harness/workflows/README.md` cannot be matched against `review-pause3.md` + `review-final-task.md` neighborhood → **STOP and report**.
- `docs/GIT_WORKFLOW.md` has no operational section fitting Edit 8d → **STOP and report**.
- `git add --renormalize` (Edit 8b) stages a likely-binary file with extension not in the binary list → **STOP and report**.
- `harness/workflows/close-task.md` or `close-chat-session.md` content does not match the find-blocks in Edits 4 and 5c → **STOP and report**. Do not regenerate from memory.

---

## Plan required justification

`Plan required: no` because:

- Every change is specified above with exact text snippets, insertion points, file paths, and verification checkboxes.
- All architectural decisions are closed (D1–D19) in the Constraints section.
- The retroactive recap rename (Edit 5) enumerates each source-target pair explicitly. The executor verifies enumeration matches reality and stops on mismatch; it does not invent names.
- Edit 8 (`.gitattributes`) has conditional skipping rules for the renormalization commit, made explicit in sub-edit 8b's STOP-and-report conditions.

The only judgment calls are:

1. The section name in `harness/workflows/README.md` (Edit 3) — fallback is stop-and-report.
2. The operational section in `docs/GIT_WORKFLOW.md` (Edit 8d) — fallback is stop-and-report.

Both fallbacks defer judgment to the user rather than improvising.

**Pause 2 and Pause 3 remain required** — Lesson #6 of `docs/AGENT_PLAYBOOK.md`.

---

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — R9 (three-surface language split), R10 (Conventional Commits, no trailers), R13 (no `--no-verify`), R15 (plan-before-code threshold), R17 (no proactive push)
2. `docs/MENTOR_BRIEF.md` — M-R7 (style hygiene), M-R10 (language split mirroring R9), M-R12 (mentor lane), M-R13 (session mode), §8 (modes)
3. `docs/GIT_WORKFLOW.md` — G-R1 (main via PR), G-R3 (Conventional Commits, no trailers), G-R5 (push authorization), G-R10 (STATE.md lifecycle), G-A7 (Co-authored-by anti-pattern)
4. `docs/GOTCHAS.md` — current category table and entry format
5. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6 (Pausa 2 and 3 always required)
6. `harness/prompts/task-brief-template.md` — caminho B convention (Edit 1 = verify on disk + commit); `Plan required` flag definition
7. `harness/workflows/start-task.md` — the invocation surface
8. All files in scope listed in the table above (sections of those files cited in Edits 4, 5c, 6a, 6b, 7a, 7b, 8d)

---

## Git workflow

### Branch

```bash
git checkout main
git pull --ff-only origin main
git checkout -b docs/workflow-lifecycle-cleanup
```

### Suggested commit sequence

Eight to ten commits, in this order:

```
1. docs(tasks): add brief for 012-workflow-lifecycle-cleanup
   — touches only docs/tasks/012-workflow-lifecycle-cleanup/brief.md

2. docs(workflows): add audit-merge workflow
   — touches only harness/workflows/audit-merge.md (new)

3. docs(workflows): catalog audit-merge in README
   — touches only harness/workflows/README.md

4. docs(workflows): add branch defense and naming convention to close-chat-session
   — touches only harness/workflows/close-chat-session.md

5. docs(sessions): rename pre-convention recaps and formalize naming in workflows
   — touches docs/sessions/* (4 git mv operations), cross-references swept,
     harness/workflows/close-task.md (PASSO 5 addition)

6. docs(skills-plan): resolve commit-discipline and task-pauses overlap
   — touches harness/skills-plan/commit-discipline.md (rewritten),
     harness/skills-plan/pause-3-protocol.md → task-pauses-protocol.md
     (git mv + rewritten)

7. docs(gotcha): add G-PROC-1 — literal sweeps and meta-discourse
   — touches only docs/GOTCHAS.md

8. chore(repo): add .gitattributes with LF normalization and binary list
   — touches only .gitattributes (new)

9. chore(repo): renormalize line endings after .gitattributes
   — touches files identified by `git add --renormalize .`
   — SKIP if `git status` shows zero changes after renormalize

10. chore(repo): register renormalization commit in blame ignore
    — touches only .git-blame-ignore-revs (new)
    — SKIP if commit 9 was skipped

11. docs(git-workflow): document per-clone blame.ignoreRevsFile setup
    — touches only docs/GIT_WORKFLOW.md
```

All subject lines ≤ 72 chars (R10).

### Push

**Do not push.** Push is the user's call (`CLAUDE.md` R17 / `GIT_WORKFLOW.md` G-R5). Stop after the final commit and report.

---

## Output expected at the end of the session

A single message reporting:

1. Branch name and `git log --oneline main..HEAD` (should show 8–11 commits in the order above, with explicit notes if commits 9 or 10 were skipped)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Sweep verification results for Edit 5 (`grep -rn` of the four old recap filenames; should show only historical references inside `docs/sessions/<date>-*.md`)
4. Sweep verification result for Edit 6 (`grep -rn 'pause-3-protocol'`; should show only historical references)
5. List of files staged by Edit 8b's renormalization (or note that 8b was skipped)
6. SHA of the renormalization commit registered in `.git-blame-ignore-revs` (or note that 8c was skipped)
7. Any out-of-scope items encountered, with the reason they were paused per Pause 2 / Pause 3 protocol
8. Final `git status` (must be clean)
