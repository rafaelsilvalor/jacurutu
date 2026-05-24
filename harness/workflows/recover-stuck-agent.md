# Workflow: Recover Stuck Agent

## Quando usar

Agente parou de responder, em loop, "trabalhando" sem output, ou
comportamento estranho.

Use quando:
- Sem resposta há > 2 min sem indicador de "thinking"
- Modo "correção em cascata" (errou, corrigiu, errou de novo)
- Comportamento inconsistente com pedidos anteriores
- Você não tem certeza se ele fez ou não fez algo

## ⚠️ Aviso: pode ser ilusão

"Agente travado" pode ser ilusão. Agente IA pode estar **trabalhando
em segundo plano** mesmo parecendo parado.

**Antes de assumir que travou, verifica estado real do projeto.**

## Pré-requisitos

- Acesso ao terminal (Git Bash, PowerShell, etc.)
- Tempo pra investigar

---

## Etapa 1 — Diagnóstico

No terminal, roda:

```bash
git status
git branch
git log --oneline -10
git diff --stat
git stash list
```

O que cada um te diz:

- `git status` — arquivos modificados, branch
- `git branch` — branches existentes (pode ter criado branch nova)
- `git log --oneline -10` — commits recentes (pode ter comitado
  sem você ver)
- `git diff --stat` — tamanho de mudanças não-comitadas
- `git stash list` — stashes pendentes

## Etapa 2 — Interpretação

Compara o que você **lembra ter autorizado** com o que **está no
disco**:

| Cenário | O que fazer |
|---|---|
| Tudo igual ao esperado | Agente realmente travou — feche e reabra |
| Commits novos não autorizados | Agente avançou em segundo plano — investigue cada commit (`git show <hash>`) |
| Branches novas inesperadas | Agente criou estado paralelo — pode deletar (`git branch -D`) se for lixo |
| Working tree com mudanças não-comitadas | Trabalho em progresso — preserva via `git stash push -m "backup"` antes de qualquer ação destrutiva |

## Etapa 3 — Decisão

### A. Continuar de onde parou

Estado coerente, contexto reconstruível:

1. Fecha o agente travado
2. Abre nova sessão
3. Usa `resume-session.md`
4. Continua a partir do estado real

### B. Reverter mudanças e recomeçar

Agente fez bagunça e prefere recomeçar:

```bash
# Backup do trabalho não-comitado
git stash push -m "backup-antes-de-recomecar-$(date +%Y%m%d-%H%M)"

# Volta pro último commit conhecido bom
git log --oneline -10
git reset --hard <hash-do-commit-bom>
```

⚠️ `git reset --hard` é destrutivo. Use **somente em local
não-empurrado** e **100% certo do hash bom**. Se já empurrou ao
remoto, vai pra `gitflow-emergency-recovery.md`.

### C. Descartar branch e começar do zero

Caso radical — tarefa toda bagunçada:

```bash
git checkout main
git branch -D [nome-da-branch-bagunçada]
git push origin --delete [nome-da-branch-bagunçada]   # se empurrou
```

E recomeça invocando o executor agent (`.claude/agents/executor.md` via pipeline, ou caminho B — brief pré-salvo + invocação direta). Ver `docs/AGENT_PLAYBOOK.md` Capítulo 6.

## Etapa 4 — Documenta o que aprendeu

Toda recuperação ensina algo. Anota em `docs/AGENT_PLAYBOOK.md`
Capítulo 4:

- O que disparou o travamento?
- O que o agente fez em segundo plano?
- Como você descobriu?
- Como recuperou?

## O que NÃO fazer

- ❌ `git push --force` em main (viola G-R7)
- ❌ Deletar arquivos manualmente sem entender o que faz
- ❌ Continuar autorizando ações antes de entender o estado
- ❌ Reiniciar o computador esperando "resolver sozinho"

## Princípio em jogo

**Agente travado é informação, não problema.** Avisa que tem
desalinhamento entre o que você pediu e o que ele entendeu.
Recupera **lentamente, com método**.
