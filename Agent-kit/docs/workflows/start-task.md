# Workflow: Start Task

## Quando usar

Iniciar tarefa nova de código (refator, feature, fix). Aplica
conjunto completo de regras: branch nova, brief, plano, pausas,
STATE.md.

## Pré-requisitos

Antes de usar, você precisa **já ter**:

1. Decidido categoria da tarefa (S/M/L do AGENT_PLAYBOOK)
2. Escrito brief da tarefa (use `init/07-create-brief.md` se não
   tiver)
3. Salvado o brief na raiz do projeto (`BRIEF_<nome-curto>.md`)

Se ainda não tem brief, **pare** — escreva primeiro.

Se a tarefa é categoria S, não precisa desse workflow nem de
brief — basta uma frase no chat.

---

## --- COPIAR ---

```
Iniciando tarefa nova no projeto. Brief específico salvo em
BRIEF_[nome-da-tarefa].md.

PASSO 1 — Leitura obrigatória:
1. CLAUDE.md
2. docs/GIT_WORKFLOW.md
3. docs/GOTCHAS.md
4. BRIEF_[nome-da-tarefa].md

PASSO 2 — Pre-flight:
- git status (working tree deve estar limpo)
- git branch (deve estar em main)
- git log --oneline -3

PASSO 3 — Criar branch:
- git checkout -b [tipo]/[descricao-kebab]
  (tipo: feat | fix | refactor | docs | chore — escolhe melhor)

PASSO 4 — Criar STATE.md:
- Cria STATE.md na raiz seguindo template do GIT_WORKFLOW.md
- Status: in-progress
- Goal extraído do brief
- Done so far: vazio
- Next steps: copia passos do plano que vai apresentar
- git add STATE.md
- git commit -m "chore(state): start [nome-da-tarefa]"

PASSO 5 — Apresentar plano:
- Lê o brief inteiro
- Apresenta plano em passos numerados (mini-marcos commitáveis)
- Estima quantos commits prevê
- Identifica os 3 pontos de pausa

PASSO 6 — Aguardar:
- Não tocar em arquivo de código
- Aguardar minha aprovação explícita do plano
```

## --- FIM COPIAR ---

## O que esperar

O agente devolve:

1. **Confirmação de leitura** com referência específica
2. **Output do pre-flight** real (não palavra de honra)
3. **Comando da branch criada**
4. **Conteúdo do STATE.md** comitado
5. **Plano em passos numerados** com estimativa de commits

## O que NÃO autorizar

- ❌ Avançar pro código antes do plano aprovado
- ❌ Plano vago tipo "vou refatorar X" sem passos
- ❌ Plano que ignora restrições do brief
- ❌ Mensagens de commit fora do Conventional Commits

## Tabela de tipos de branch

| Tipo | Quando |
|---|---|
| `feat/` | Funcionalidade nova |
| `fix/` | Correção de bug |
| `refactor/` | Reescrita sem mudança de comportamento |
| `chore/` | Tarefa de infraestrutura |
| `docs/` | Apenas documentação |
| `experiment/` | Tentativa que pode ser rejeitada |

## Próximo workflow

- Plano aprovado → `review-pause3.md` no primeiro commit
- Tarefa terminou → `close-task.md`
- Travou no meio → `recover-stuck-agent.md`
