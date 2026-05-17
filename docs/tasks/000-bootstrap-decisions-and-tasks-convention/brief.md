# Brief: 000 — Bootstrap decisions and tasks convention

> **Category:** L (5 files modified, mechanical edits, ~250 lines of changes)
> **Plan required:** No — see "Plan required justification" below
> **Branch:** `docs/bootstrap-decisions-and-tasks-convention`
>
> Paste this brief into Claude Code at session start. **First action: save this brief verbatim as `docs/tasks/000-bootstrap-decisions-and-tasks-convention/brief.md`** (creating the directory). All subsequent edits proceed from there.

---

## Context

A mentoring chat session on 2026-05-09 closed two architectural decisions for Saci that affect the upcoming refactor work (the 4 active focus items in `MENTOR_BRIEF.md` §2):

1. **Persistence will become hybrid** within ~6 months — local for personal preferences and cache; central (Estratégia infrastructure) for catalog, annotations, validations, asset links, and task→art linkage. Volume target: tens of thousands of files.
2. **Plugins will exist** at a 6–12-month horizon, dev-authored, Neovim-style (not end-user marketplace). Until then, three extension surfaces — file format dispatch, renderer view router, file action menu — already meet the "third use" criterion (`CLAUDE.md` A3) and warrant the registry pattern now.

The same session also adopted a per-task artifact convention (`docs/tasks/<NNN>-<slug>/brief.md` + `plan.md` + optional `notes.md`) and a new `Plan required: yes | no` flag on briefs, plus two minor consistency fixes in the harness prompts.

This brief consolidates all of that into the canonical docs **before** the refactor work starts (briefs 001 through 005). No code is touched.

## Goal

After this task:

- `CLAUDE.md` carries two new rules (R18, R19) that encode the architectural decisions, plus two new exceptions (E4, E5) documenting current debt against them.
- `docs/MENTOR_BRIEF.md` records the active architectural decisions (§2), references the new template (§7), and replaces its closing snippet with a session-context map (§8).
- `docs/prompts/task-brief-template.md` adopts the `docs/tasks/<NNN>-<slug>/` convention, adds the `Plan required` flag, and documents when Pause 1 may be skipped.
- `harness/init/07-create-brief.md` is aligned with the new task structure and the `Plan required` flag.
- `harness/init/04-create-git-workflow.md` no longer instructs the bootstrap to create a `Co-authored-by` rule (which contradicts the actual `GIT_WORKFLOW.md` G-R3 and `CLAUDE.md` R10).
- `docs/tasks/000-bootstrap-decisions-and-tasks-convention/brief.md` exists, containing this brief verbatim.

No code is modified. No new dependency is added.

## Constraints

### Files in scope

| # | File | Change type |
|---|---|---|
| 1 | `docs/tasks/000-bootstrap-decisions-and-tasks-convention/brief.md` | New file (this brief, saved verbatim) |
| 2 | `CLAUDE.md` | Add 2 rules (R18, R19), 2 exceptions (E4, E5), update Related Documents |
| 3 | `docs/MENTOR_BRIEF.md` | Augment §2; update §7 table; replace §8 entirely |
| 4 | `docs/prompts/task-brief-template.md` | Update template header; update "Como usar manualmente"; update "Pontos de pausa obrigatórios"; add new "Quando pular Pausa 1" section; update "Verificações de processo" checklist |
| 5 | `harness/init/07-create-brief.md` | Update PASSO 5, PASSO 6, "Resultado" line |
| 6 | `harness/init/04-create-git-workflow.md` | Replace G-R9 entry |

### Out of scope

- Any application code (`main.js`, `psd-worker.js`, `preload.js`, `renderer/app.js`, `renderer/index.html`, `renderer/styles.css`, anything under `assets/`, anything under `test/`)
- `package.json`, `package-lock.json`, `.gitignore`, `.githooks/` — not touched
- Renaming or migrating any existing brief file (none exist yet — `docs/tasks/` is being created by this task)
- Adding rules, anti-patterns, or exceptions beyond R18, R19, E4, E5
- Translating any pt-BR section of `task-brief-template.md`, `07-create-brief.md`, or `04-create-git-workflow.md` into English. The new section added to `task-brief-template.md` follows the existing language of that file (pt-BR) for consistency
- Refactoring prose in unrelated sections of any file
- Creating any other file under `docs/tasks/` (e.g. placeholder `001-storage-layer/`)
- Any `git push` (G-R5 / `CLAUDE.md` R17)

### Conventions

- `CLAUDE.md` and `docs/MENTOR_BRIEF.md` content stays in English (R9 — dev surface)
- `docs/prompts/task-brief-template.md` and `harness/init/*.md` content stays in pt-BR (existing language of those files)
- All commits follow Conventional Commits (`CLAUDE.md` R10, `GIT_WORKFLOW.md` G-R3)
- No `Co-authored-by` trailer on any commit (`GIT_WORKFLOW.md` G-R3)
- Pre-commit hook is not yet installed in the repo at the time of this brief; if it is installed by then, do not bypass with `--no-verify` (`CLAUDE.md` R13)

---

## Done criteria

### Edit 1 — Save this brief

Create directory `docs/tasks/000-bootstrap-decisions-and-tasks-convention/` and save this brief (verbatim, the exact text the agent received in the chat) as `brief.md` inside it.

- [ ] Directory `docs/tasks/000-bootstrap-decisions-and-tasks-convention/` exists
- [ ] File `docs/tasks/000-bootstrap-decisions-and-tasks-convention/brief.md` exists and matches the brief content the agent received

### Edit 2 — `CLAUDE.md`: add R18, R19, E4, E5; update Related Documents

#### 2a. Add R18 and R19 at the end of the "Hard Rules" section (after R17, before "Anti-patterns")

Insert exactly:

```markdown
**R18 — Persistent application state goes through the `storage/` module.** Code that reads or writes user state (config, thumbnail cache, future catalog/annotations) routes through `storage.<method>(...)`, never via direct `fs.*` for those concerns. The module exposes a single public interface; concrete backends (file, SQLite, HTTP) live behind it. New persistence concerns add a method to `storage/`, never bypass it. Rationale: the project will evolve into a hybrid client (local + central catalog) within ~6 months — routing all persistence through one seam keeps callers stable when backends change.

**R19 — Extension points dispatch via registries (Map-backed).** When the codebase needs dispatch by key — file extension → handler, view id → view module, action id → action module — the dispatch is a registry that consumers query (`registry.get(key)`) and producers self-register into (`registry.register(key, handler)`). Consumer code does not enumerate producers. Three categories qualify under the "third use" criterion (A3): file format handlers (4 cases — PSD/PSB, AI, INDD, raster), renderer view router (3 cases — browser, file detail, settings), file action menu (3+ cases — open, reveal, etc.). Other extension surfaces (e.g. external integrations) are deferred until a real second case appears.
```

#### 2b. Add E4 and E5 at the end of the "Documented Exceptions" section (after E3b)

Insert exactly:

```markdown
**E4 — Persistent state not yet routed through `storage/` (R18).** Current `main.js` and `psd-worker.js` use direct `fs.*` for `config.json` and `thumb-cache/<sha1>.jpg`. Migration: brief 001 (`refactor/storage-layer`).

**E5 — Dispatch tables not yet routed through registries (R19).** Format dispatch is hardcoded in `main.js`; the renderer is monolithic in `renderer/app.js`; file actions are ad-hoc. Migrations: brief 002 (`refactor/format-registry`), brief 004 (`refactor/renderer-views`), brief 005 (`refactor/action-registry`).
```

#### 2c. Update the "Related Documents" section

Locate the bulleted list. Add two entries (preserve the existing order; insert these in a sensible spot — `docs/prompts/task-brief-template.md` near the other `docs/` entries, `docs/tasks/` after it):

```markdown
- `docs/prompts/task-brief-template.md` — task brief template (4 parts + `Plan required` flag); used to author `docs/tasks/<NNN>-<slug>/brief.md`
- `docs/tasks/<NNN>-<slug>/` — per-task artifacts: `brief.md`, optional `plan.md`, optional `notes.md`. Created when a task starts; preserved after merge as the historical record
```

#### Verification

- [ ] R18 and R19 present, in that order, immediately after R17
- [ ] E4 and E5 present, in that order, after E3b
- [ ] Related Documents has two new entries
- [ ] No other rule, anti-pattern, or exception was added or removed
- [ ] Existing prose in unrelated sections is byte-identical to before

### Edit 3 — `docs/MENTOR_BRIEF.md`: §2, §7, §8

#### 3a. Append a new bullet to §2 ("Where we are in the project"), inserted immediately before the `> ⚠️ This section ages fast.` blockquote

Insert exactly:

```markdown
- **Active architectural decisions (recorded 2026-05-09 — refresh as they evolve):**
  - **DB / persistence:** the project will evolve into a hybrid client within ~6 months — local for personal preferences and cache; central (Estratégia infrastructure) for catalog, annotations, validations, asset links, and task→art linkage. Volume target: tens of thousands of files. Mitigation: route all persistence through a `storage/` interface from day one (`CLAUDE.md` R18; current debt under E4). Open item: who maintains the central infrastructure and whether an API exists — tracked outside code.
  - **Plugins / extensibility:** plugin model is dev-authored (Neovim-style, not end-user marketplace). Horizon ~6–12 months for a real plugin API; today the work is preparing terrain via registries for format / view / action dispatch (`CLAUDE.md` R19; current debt under E5). External-integration registry is deferred until a real second case appears.
```

#### 3b. Update §7 ("Related documents") table

Add two rows to the existing table (preserve the table's structure; insert these in a sensible spot — keep `docs/` entries grouped):

```markdown
| `docs/prompts/task-brief-template.md` | Both agents and the user — task brief template (4 parts + `Plan required` flag) |
| `docs/tasks/<NNN>-<slug>/` | Per-task artifacts: `brief.md`, `plan.md`, optional `notes.md` |
```

#### 3c. Replace §8 entirely

Find the current §8 — it starts with the heading `## 8. How the user invokes this brief in a new chat session` and ends at the end of the file (or before any later section, if any).

Replace the entire section with:

```markdown
## 8. Context to load per session type

Different chat sessions need different context. Load only what is needed; oversharing dilutes the agent's attention.

| Session type | Always load | Add when relevant |
|---|---|---|
| Mentoring / architectural decision | `CLAUDE.md`, `MENTOR_BRIEF.md` | Topic-specific docs |
| Modeling a new task (generate brief) | `CLAUDE.md`, `MENTOR_BRIEF.md`, `AGENT_PLAYBOOK.md`, `GIT_WORKFLOW.md`, `GOTCHAS.md`, `docs/prompts/task-brief-template.md` | — |
| Reviewing an agent's plan | `CLAUDE.md`, `MENTOR_BRIEF.md`, `AGENT_PLAYBOOK.md` (chapters 2–3), the task's `brief.md` | The new `plan.md` |
| Code review by reading | `CLAUDE.md`, `MENTOR_BRIEF.md`, `GOTCHAS.md` | Code under review |
| Continuing a paused task | `CLAUDE.md`, `MENTOR_BRIEF.md`, the task's `brief.md`, `plan.md`, and `STATE.md` if present | — |

### Default starting prompt for a fresh chat

Snippet to paste into a fresh Claude chat (pt-BR because chat is pt-BR; files referenced are English):

```
Olá. Estou continuando o projeto Saci.

Tipo de sessão: [mentoria | modelar tarefa | revisar plano | code review | continuar tarefa]

Carrega os arquivos correspondentes ao tipo de sessão na tabela §8 do MENTOR_BRIEF.md.
Eu também colei [lista do que colei diretamente].

Depois de ler, age como meu mentor sênior técnico seguindo o MENTOR_BRIEF.md.
Onde paramos foi: [última coisa].

Antes de propor próximo passo, confirma em uma frase quem você entendeu que eu sou
e onde estamos.
```
```

#### Verification

- [ ] §2 has the new "Active architectural decisions" bullet, placed immediately before the `> ⚠️` blockquote
- [ ] §7 table has the two new rows
- [ ] §8 is the new "Context to load per session type" section, with the table and snippet shown above
- [ ] §1, §3, §4, §5, §6 are byte-identical to before
- [ ] The single triple-backtick fenced code block inside the new §8 contains the pt-BR snippet exactly as shown

### Edit 4 — `docs/prompts/task-brief-template.md`

Several changes inside this file. Apply them in the order below.

#### 4a. Replace the template header (inside the `## --- TEMPLATE PARA COPIAR ---` section)

Find this exact block:

```markdown
# Brief: [Título curto da tarefa]

> Cole este brief inteiro no agente executor (Claude Code, Cowork)
> ao iniciar a tarefa. Tarefa categoria [M ou L].
```

Replace with:

```markdown
# Brief: [Título curto da tarefa]

> **Categoria:** [M | L]
> **Plan required:** [yes | no] — ver "Quando pular Pausa 1" abaixo
> **Branch:** `[tipo]/[descricao-kebab]`
>
> Cole este brief inteiro no agente executor (Claude Code, Cowork)
> ao iniciar a tarefa.
```

#### 4b. Update step 2 of "Como usar manualmente"

Find:

```
2. Salva como `BRIEF_<nome-curto>.md` na raiz do projeto
```

Replace with:

```
2. Salva como `docs/tasks/<NNN>-<slug>/brief.md` (cria a pasta;
   numeração `NNN` zero-padded em ordem cronológica, slug
   curto-descritivo em kebab-case)
```

#### 4c. Update the "Pontos de pausa obrigatórios" section (inside the template, in the bottom half of the template body)

Find:

```markdown
## Pontos de pausa obrigatórios

Pelo `AGENT_PLAYBOOK.md` Capítulo 2:

- **Pausa 1 (antes de qualquer código):** apresentar plano numerado
  e aguardar aprovação
- **Pausa 2 (após primeiro arquivo modificado):** mostrar resultado
  e aguardar revisão
- **Pausa 3 (antes de cada commit):** mostrar `git status` +
  `git diff --stat` + mensagem proposta
```

Replace with:

```markdown
## Pontos de pausa

Pelo `AGENT_PLAYBOOK.md` Capítulo 2:

- **Pausa 1 (antes de qualquer código):** apresentar plano numerado
  e aguardar aprovação. **Obrigatória se `Plan required: yes`;
  pulada se `Plan required: no`** (ver "Quando pular Pausa 1"
  abaixo).
- **Pausa 2 (após primeiro arquivo modificado):** mostrar resultado
  e aguardar revisão. **Sempre obrigatória.**
- **Pausa 3 (antes de cada commit):** mostrar `git status` +
  `git diff --stat` + mensagem proposta. **Sempre obrigatória.**
```

#### 4d. Update the "Verificações de processo" sub-section (inside the template's "Critério de pronto" → "Verificações de processo")

Find:

```markdown
### Verificações de processo

- [ ] Antes de tocar código, plano em passos numerados foi
      apresentado e aprovado
- [ ] Pausa 3 (git status + git diff --stat) antes de cada commit
- [ ] Se algum critério não pôde ser atendido, foi reportado
      explicitamente
```

Replace with:

```markdown
### Verificações de processo

- [ ] Se `Plan required: yes` — plano em passos numerados foi
      apresentado e aprovado antes de qualquer mudança (Pausa 1)
- [ ] Pausa 2 — primeiro arquivo modificado mostrado pra revisão
      antes de seguir (sempre obrigatória)
- [ ] Pausa 3 — `git status` + `git diff --stat` + mensagem
      proposta antes de cada commit (sempre obrigatória)
- [ ] Se algum critério não pôde ser atendido, foi reportado
      explicitamente
```

#### 4e. Add a new section "Quando pular Pausa 1" between "Pontos de pausa" and "Documentos de referência (leia antes de começar)"

Insert this entire section verbatim:

```markdown
## Quando pular Pausa 1 (`Plan required: no`)

Pausa 1 ("agente apresenta plano numerado antes de qualquer código") protege contra agente inventar abordagem que o brief não especificou. É overhead quando o brief **é** o plano — quando todas as decisões estão fechadas e o trabalho do agente é executar, não desenhar.

**Pular Pausa 1 só quando TODOS os critérios valem:**

- Todas as decisões arquiteturais estão registradas neste brief ou em docs canônicos (`CLAUDE.md`, `MENTOR_BRIEF.md`)
- Os critérios de pronto são concretos e verificáveis sem interpretação
- Não há ambiguidade sobre quais arquivos tocar nem como

**Tarefas típicas `Plan required: no`:**
- Atualizar docs com texto já especificado no brief
- Edições mecânicas (rename, format, mover arquivos)
- Adicionar regra a arquivo estruturado em local especificado

**Tarefas típicas `Plan required: yes`:**
- Refactor com escolhas de implementação a fazer
- Feature nova com decisões de design
- Bug fix onde causa raiz é hipótese, não confirmação

⚠️ **Pausa 2 (após primeiro arquivo) e Pausa 3 (antes de cada commit) são SEMPRE obrigatórias, independente de `Plan required`.** Elas pegam drift que o brief não previu (Lição #6 do `AGENT_PLAYBOOK.md`).
```

#### Verification

- [ ] Template header in `## --- TEMPLATE PARA COPIAR ---` shows the three new metadata lines (Categoria, Plan required, Branch)
- [ ] Step 2 of "Como usar manualmente" references `docs/tasks/<NNN>-<slug>/brief.md`, not `BRIEF_<nome-curto>.md`
- [ ] "Pontos de pausa" section (no longer "obrigatórios" alone) reflects the conditional-on-flag wording for Pausa 1; sempre obrigatórias for Pausa 2 and Pausa 3
- [ ] New section "Quando pular Pausa 1" exists between "Pontos de pausa" and "Documentos de referência (leia antes de começar)"
- [ ] "Verificações de processo" checklist has the new wording (4 items)
- [ ] All other sections of the file (`O que ENTRA no brief`, `O que NÃO entra`, `Tamanho ideal`, etc.) are byte-identical to before

### Edit 5 — `harness/init/07-create-brief.md`

#### 5a. Replace PASSO 5

Find:

```
PASSO 5 — Compilação do brief:
Gera o BRIEF_<nome-curto>.md seguindo o template de
docs/prompts/task-brief-template.md. Use as decisões da entrevista
pra preencher cada seção.
```

Replace with:

```
PASSO 5 — Compilação do brief:
- Determina o próximo número livre em `docs/tasks/` (NNN com
  zero-padding, ex.: 001, 002) e um slug curto descritivo em
  kebab-case
- Determina `Plan required: yes | no` baseado no critério em
  `docs/prompts/task-brief-template.md` (seção "Quando pular
  Pausa 1")
- Gera o brief seguindo o template de
  `docs/prompts/task-brief-template.md`. Use as decisões da
  entrevista pra preencher cada seção
- Caminho de saída: `docs/tasks/<NNN>-<slug>/brief.md`
```

#### 5b. Replace PASSO 6

Find:

```
PASSO 6 — Revisão final:
Mostra o brief gerado. Pergunta se há algo a ajustar. Quando
aprovado, cria o arquivo e sugere próximo passo (commitar o brief
e iniciar a tarefa com docs/workflows/start-task.md).
```

Replace with:

```
PASSO 6 — Revisão final:
Mostra o brief gerado. Pergunta se há algo a ajustar. Quando
aprovado, salva como `docs/tasks/<NNN>-<slug>/brief.md`. Sugere
próximo passo: commitar o brief com mensagem
`docs(tasks): add brief for <NNN>-<slug>` e iniciar a tarefa via
`harness/workflows/start-task.md` no Claude Code.
```

#### 5c. Update the "O que esperar" section's "Resultado:" line

Find:

```
Resultado: `BRIEF_<nome>.md` na raiz do projeto, pronto pra ser
referenciado pelo agente executor.
```

Replace with:

```
Resultado: `docs/tasks/<NNN>-<slug>/brief.md`, pronto pra ser
referenciado pelo agente executor. O `plan.md` (se
`Plan required: yes`) e quaisquer `notes.md` ficam na mesma pasta.
```

#### Verification

- [ ] PASSO 5 has the four-bullet structure including "Determina o próximo número livre…"
- [ ] PASSO 6 references `docs/tasks/<NNN>-<slug>/brief.md` and the suggested commit message
- [ ] "Resultado:" line under "O que esperar" mentions the new path
- [ ] Other sections of the file (Variantes, Princípio em jogo, etc.) byte-identical to before

### Edit 6 — `harness/init/04-create-git-workflow.md`

#### 6a. Replace the G-R9 entry inside "Passo 1 — Hard Rules de Git"

Find this exact block:

```
**G-R9 — Commits de agente IA têm trailer Co-authored-by.**
```
Co-authored-by: Claude <noreply@anthropic.com>
```
Permite rastrear autoria via `git log --grep="Co-authored-by"`.
```

Replace with:

```
**G-R9 — Sem trailer Co-authored-by.** Commits são atribuídos ao
autor humano. Espelha `CLAUDE.md` R10 ("No co-author trailers")
e `GIT_WORKFLOW.md` G-R3.
```

#### Verification

- [ ] G-R9 in this file no longer instructs creating a `Co-authored-by` rule
- [ ] G-R9 now states the prohibition and references R10 / G-R3
- [ ] No fenced code block referencing `Co-authored-by: Claude` remains in this file
- [ ] Other rules (G-R1 through G-R8) and other sections byte-identical to before

---

## Plan required

**No.**

Justification: every change is specified above with exact text snippets and verification checkboxes. There is no architectural choice for the agent to make, no ambiguity about which file to edit or where, and the criteria are mechanical to verify.

⚠️ **Pause 1 is therefore skipped.** **Pause 2 (after the first file is fully modified, before moving to the second) and Pause 3 (before every commit) remain required and must not be skipped** — Lesson #6 of `AGENT_PLAYBOOK.md`.

For Pause 2: after completing Edit 1 (saving the brief itself) plus Edit 2 (`CLAUDE.md`), stop and present a summary diff for the human to review before proceeding to Edit 3.

For Pause 3: before each commit, run `git status`, `git diff --stat`, and present the proposed commit message for explicit approval.

---

## Git workflow

### Branch

```bash
git checkout main
git pull --ff-only origin main
git checkout -b docs/bootstrap-decisions-and-tasks-convention
```

### Commit sequence

Six commits, in this order. Each commit is a single thematic change. **Do not bundle.** **Do not reorder** without raising it at Pause 3.

```
1. docs(tasks): add brief for 000-bootstrap-decisions-and-tasks-convention
   — touches only docs/tasks/000-bootstrap-decisions-and-tasks-convention/brief.md (new file)

2. docs(claude): add R18-R19 (storage, registries) and E4-E5 (current debt)
   — touches only CLAUDE.md

3. docs(mentor-brief): record arch decisions and add session context map
   — touches only docs/MENTOR_BRIEF.md

4. docs(prompts): adopt docs/tasks structure and add Plan required flag
   — touches only docs/prompts/task-brief-template.md

5. chore(harness): align init/07-create-brief with new tasks structure
   — touches only harness/init/07-create-brief.md

6. chore(harness): remove Co-authored-by from init/04 prompt
   — touches only harness/init/04-create-git-workflow.md
```

Each commit body should explain *why* in one or two short paragraphs (G-R3, G-R4). For commits 2 and 3, reference the chat session date (2026-05-09) and the architectural decisions consolidated.

### Push

**Do not push.** The user authorizes push explicitly per `GIT_WORKFLOW.md` G-R5 / `CLAUDE.md` R17. Stop after the sixth commit and report.

---

## Output expected at the end of the session

A single message reporting:

1. Branch name and current `git log --oneline main..HEAD` (should show 6 commits)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Any verification checkbox from this brief that **could not** be met, with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step: open PR on GitHub against `main` using the PR template; once merged, proceed to brief 001 (storage layer refactor)

---

## References (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules (especially R5, R9, R10, R13, R14, R17 for this task)
2. `docs/GIT_WORKFLOW.md` — operational discipline (G-R3, G-R5, G-R8, PR template)
3. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points, drift signals); Lessons #4 and #6 in particular
4. `docs/MENTOR_BRIEF.md` — context on the user and the relationship; especially M-R3 (Pause-3) and the patterns P1–P3
5. `docs/prompts/task-brief-template.md` — the file being modified by Edit 4; useful to read **before** editing to understand the existing structure

If anything in the references contradicts a specific instruction in this brief, **stop and report** rather than choosing a side. The brief is the more recent decision; the canonical docs may need a follow-up update that this brief did not anticipate.
