# Create GIT_WORKFLOW.md

> **Contexto:** você está em sessão de bootstrap. Já gerou
> `CLAUDE.md` e `docs/MENTOR_BRIEF.md`. Agora vai gerar
> `docs/GIT_WORKFLOW.md`.

## O que é o `GIT_WORKFLOW.md`

Disciplina Git **operacional** do projeto. Define como branches,
commits, merges, recovery acontecem.

Diferente do `CLAUDE.md` (regras de código), esse é sobre
**versionamento e proteção contra acidentes**.

## Estrutura recomendada

```markdown
# Git Workflow

## Hard Rules (G-R1, G-R2...)
## Conventional Commits
## Branch Naming
## STATE.md Template
## Recovery Patterns
## Anti-patterns Git (G-A1, G-A2...)
```

## Sua tarefa

Gera por entrevista. Mas **muitas regras de Git são universais** —
você pode propor um conjunto base e perguntar se o usuário quer
ajustar.

### Passo 1 — Hard Rules de Git (proponha base, ajuste por entrevista)

Comece com **regras universais** que valem pra qualquer projeto:

**G-R1 — Toda mudança vai numa branch.** Nunca direto em main.

**G-R2 — Conventional Commits obrigatório.**
Formato: `<tipo>(<escopo>): <descrição imperativa>`

**G-R3 — Mensagem de commit reflete o conteúdo.** Não promete mais
nem menos do que de fato fez.

**G-R4 — `git push` em main é decisão humana.** Agente IA pode
comitar livremente, mas push em main exige autorização explícita.

**G-R5 — Branches nomeadas com prefixo de tipo.**
`<tipo>/<descricao-kebab>` onde tipo é feat | fix | refactor |
chore | docs | experiment.

**G-R6 — Experimentos rejeitados viram tag.** Antes de deletar
branch `experiment/*`, criar tag `experiments/<nome>-rejected` com
mensagem explicando.

**G-R7 — Não reescrever histórico empurrado.** Sem `push --force`
em main. Sem `rebase` em commits empurrados. Sempre rola pra frente
(`git revert` em vez de reescrever).

**G-R8 — `STATE.md` durante tarefas L.** Tarefa estrutural cria
`STATE.md` na raiz pra preservar contexto entre sessões.

**G-R9 — Commits de agente IA têm trailer Co-authored-by.**
```
Co-authored-by: Claude <noreply@anthropic.com>
```
Permite rastrear autoria via `git log --grep="Co-authored-by"`.

Pergunta ao usuário pra cada uma: **vale pra esse projeto?
Modificar? Adicionar?**

Pra projeto solo, todas essas valem. Pra projeto open-source com
muitos contribuidores, pode precisar adicionar regras de PR.

### Passo 2 — Conventional Commits

Lista os tipos válidos. Geralmente:

- `feat` — feature nova
- `fix` — correção de bug
- `refactor` — reescrita sem mudança de comportamento
- `chore` — infraestrutura, build, deps
- `docs` — só documentação
- `test` — só testes
- `experiment` — tentativa que pode ser descartada

Pergunta se quer adicionar tipos específicos do projeto (ex:
`style` pra CSS, `data` pra mudança em fixtures, etc.)

Sobre escopos: deixe livre nesse momento. Escopos emergem do uso.

### Passo 3 — Branch Naming

Formato `<tipo>/<descricao-kebab>`. Exemplos:

- `feat/user-authentication`
- `fix/login-button-not-clicking`
- `refactor/database-connection-pool`
- `experiment/native-css-grid-instead-of-flex`

Pergunta se tem nomenclatura específica que quer usar (algumas
empresas usam `JIRA-123-descricao`, etc.)

### Passo 4 — STATE.md Template

`STATE.md` é arquivo na raiz do projeto, durante tarefa L,
preservando estado entre sessões.

Template padrão:

```markdown
# Task State

## Goal
[O que essa tarefa pretende fazer, em 1-2 frases]

## Status
[in-progress | blocked | completed]

## Last Update
[Data e hora da última atualização]

## Done so far
- [x] Item completo
- [x] Outro item completo

## Next steps
- [ ] Próximo passo concreto
- [ ] Passo seguinte

## Blockers (se status = blocked)
[Descrição clara do bloqueio]

## Notes for next session
[Contexto não-óbvio que ajuda retomar — decisão tomada na cabeça
mas não no código, hipótese a testar, etc.]
```

Pergunta se quer ajustar o template.

### Passo 5 — Recovery Patterns

**Sequência completa de merge:**

```bash
git checkout main
git pull --ff-only origin main
git merge --no-ff [nome-branch] -m "Merge branch '[nome-branch]'"
git push origin main
git branch -d [nome-branch]
git push origin --delete [nome-branch]
```

**Descartar experimento:**

```bash
git tag -a experiments/[nome]-rejected experiment/[nome] -m "Razão"
git push origin experiments/[nome]-rejected
git checkout main
git branch -D experiment/[nome]
git push origin --delete experiment/[nome]
```

**Divergência local vs remoto (mesmo conteúdo):**

```bash
git tag safepoint/local-before-reset
git reset --hard origin/main
```

Lista esses padrões. Eles também ficam expandidos em
`docs/workflows/gitflow-*.md`.

### Passo 6 — Anti-patterns (G-A1, G-A2...)

Coisas a NÃO fazer com Git neste projeto:

- **G-A1 — `git push --force` em main** (viola G-R7)
- **G-A2 — Comitar `node_modules`, `dist`, `.env`** (deve estar em
  `.gitignore`)
- **G-A3 — Mensagem de commit "WIP" ou "fix"** sem contexto
- **G-A4 — Mergear sem `--no-ff`** quando vinha de branch de tarefa
- **G-A5 — `git stash` permanente** (stashes envelhecem mal —
  sempre comita ou descarta em até 1-2 sessões)

Pergunta se tem padrões problemáticos que ele já viu e quer evitar.

## Após gerar

- Confirma cobertura
- Cria `docs/GIT_WORKFLOW.md`
- **Próximo:** lê `init/05-create-gotchas.md`
