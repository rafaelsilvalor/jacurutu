# Workflows

Templates copiáveis pra cenários recorrentes de orquestração.

## Como usar

1. Identifica o cenário (setup? tarefa? recuperação?)
2. Abre o workflow correspondente
3. Copia o bloco entre `--- COPIAR ---`
4. Cola no agente (Chat, Cowork ou Code)
5. Adapta partes em `[colchetes]`

## Catálogo

### Setup de sessão (escolha pela interface)

- **`setup-chat.md`** — iniciar sessão de mentoria/discussão em
  claude.ai
- **`setup-cowork.md`** — iniciar sessão de trabalho em Cowork
- **`setup-code.md`** — iniciar sessão de código em Claude Code

### Continuidade

- **`close-chat-session.md`** — encerrar sessão de chat (mentoria,
  modelar tarefa, revisar plano, code review) com recap salvo em
  docs/sessions/
- **`resume-session.md`** — retomar trabalho do dia anterior
  (qualquer interface)
- **`recover-stuck-agent.md`** — agente travou ou estado inesperado

### Tarefas

- **`task-pre-flight.md`** — checklist antes de mexer em código
- **`pause-task.md`** — pausar preservando estado
- **`close-task.md`** — fechar tarefa pra mergear

> **Nota:** `start-task.md` foi removido em 2026-05-23 (brief 015).
> Seu conteúdo está absorvido em `.claude/agents/executor.md`
> (reading order, pre-flight, STATE.md lifecycle, plan + wait).
> Invocação pipeline-driven via main session do Claude Code é o
> caminho default; caminho B (brief pré-salvo + invocação direta
> do executor) continua válido. Ver `docs/AGENT_PLAYBOOK.md`
> Capítulo 6.

### Git operations

- **`gitflow-merge-into-main.md`** — merge da branch em main
- **`gitflow-experiment-discard.md`** — descartar experimento
- **`gitflow-emergency-recovery.md`** — recuperação de divergência

### Revisão

- **`review-pause3.md`** — checklist Pausa 3 (antes de cada commit)
- **`review-final-task.md`** — revisão completa antes do merge
- **`audit-merge.md`** — auditoria pós-merge de tarefa (modo code
  review do §8): três dimensões — diff técnico, aderência ao
  processo, qualidade do self-review do executor

## Princípios

- **Curtos** (≤ 60 linhas)
- **Bloco copiável claro**
- **Não duplicam regras** — referenciam CLAUDE.md, GIT_WORKFLOW.md
- **Substituíveis** — se descobre cenário não coberto, cria novo
