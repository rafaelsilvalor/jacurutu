# Setup: Cowork

## Quando usar

Iniciar sessão nova em **Cowork** — geralmente pra:

- Trabalho que envolve múltiplos arquivos do projeto
- Tarefas que misturam leitura/edição de arquivos diversos
- Pesquisa estruturada que produz documento
- Trabalho não-código (planejamento, organização, documentação)

Cowork **toca seu disco** mas tende a "entregar trabalho pronto".
Por isso é melhor pra **delegar tarefa definida** do que **discutir
abertamente**.

## Pré-requisitos

- Cowork instalado e com acesso à pasta do projeto
- Permissões de arquivo configuradas
- Projeto tem documentação canônica

---

## --- COPIAR ---

```
Estou começando sessão de trabalho em Cowork no projeto [NOME].

Você tem acesso à pasta deste projeto. Antes de qualquer ação:

PASSO 1 — Lê os arquivos canônicos do projeto:
- CLAUDE.md
- docs/MENTOR_BRIEF.md
- docs/GIT_WORKFLOW.md
- docs/GOTCHAS.md

PASSO 2 — Estado do projeto:
- Roda git status
- Roda git branch
- Roda git log --oneline -5
- Verifica se existe STATE.md na raiz; se sim, lê

PASSO 3 — Reporta:
- Em qual branch estou
- Último commit
- Há trabalho pendente em STATE.md?
- Há mudanças não-comitadas?

PASSO 4 — Aguarda:
- Não execute nenhuma ação além de leitura
- Não modifique nenhum arquivo
- Aguarde minha instrução específica

Importante:
- Você é executor, não mentor. Se eu precisar discutir decisão
  arquitetural, vou abrir uma sessão Mentor e voltar pra você
  com decisão tomada.
- Você comita livremente quando autorizado, mas NÃO faz git push
  (push é decisão minha).
- Pausa antes de cada commit pra eu autorizar (Pausa 3 do
  AGENT_PLAYBOOK).
```

## --- FIM COPIAR ---

## Diferença Cowork vs Claude Code

| | Cowork | Claude Code |
|---|---|---|
| Foco | Trabalho geral | Código |
| Tendência | Entregar pronto | Conversar passo-a-passo |
| Use pra | Tarefa definida | Refator, debug, exploração |

Se o trabalho é puramente código (escrever, refatorar, debugar),
prefira Claude Code. Cowork é melhor pra trabalho que mistura
código com análise, documentação, ou processamento de dados.

## Cuidados específicos

- ⚠️ **Cowork pode entregar mais do que pediu.** Sua tendência é
  "completar o trabalho". Se você pede tarefa pequena, ele pode
  expandir. Seja explícito sobre escopo.
- ⚠️ **Pausa 3 é mais difícil de impor em Cowork** — ele entrega
  resultado e você revisa post-hoc. Vale escrever no setup que
  ele DEVE pausar antes de comitar.
- ⚠️ **Cowork não substitui modelagem.** Se você está confuso sobre
  o que pedir, primeiro abre uma sessão Orchestrator pra modelar,
  depois Cowork pra executar.

## Próximo passo após setup

- **Tarefa definida com brief** → cola o brief
- **Tarefa exploratória** → descreve o objetivo e pede plano antes
  de execução
- **Setup falhou (Cowork não acha arquivos)** → resolve permissões
  antes de seguir

## ❓ PERGUNTAS PRA REVISÃO FUTURA

- Cowork tem features que mudam rápido. Vale o setup ser mais
  abstrato pra envelhecer melhor?
- A tendência de "entregar pronto" é mitigável via prompt ou é
  comportamento intrínseco?
