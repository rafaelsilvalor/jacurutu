# Skill candidata: pause-3-protocol

> **Status:** rascunho pra discussão. Ainda não é Skill ativa.

## Quando essa Skill ativaria

Quando o agente está executando tarefa de código com plano numerado
e múltiplos commits previstos. Triggers detectáveis:

- Existe `STATE.md` na raiz do projeto
- Branch atual começa com `feat/`, `fix/`, `refactor/`, etc.

## O que ela carregaria como contexto

Ao ativar, reforça o protocolo das 3 pausas do AGENT_PLAYBOOK:

- **Pausa 1:** antes de qualquer código, plano numerado
- **Pausa 2:** após primeiro arquivo significativo
- **Pausa 3:** antes de cada commit

## Como o SKILL.md ficaria

```markdown
---
name: pause-3-protocol
description: Ativa em sessões de tarefa estruturada (existe
  STATE.md ou branch começa com feat/fix/refactor). Enforça as 3
  pausas do AGENT_PLAYBOOK antes de cada commit. Use pra garantir
  que checkpoints humanos sejam respeitados.
---

# Protocolo das 3 pausas

Você está em sessão de tarefa estruturada. Antes de avançar:

## Pausa 1 — Antes de qualquer código

Apresenta plano numerado de passos commitáveis. Cada passo deve:
- Ter mini-marco claro
- Ser commitável em isolado
- Ter mensagem de commit prevista

Aguarda aprovação explícita do humano antes de tocar código.

## Pausa 2 — Após primeiro arquivo significativo

Quando o primeiro arquivo substancial foi modificado, mostra
resultado e aguarda revisão. Não avança pra próximo arquivo até
humano confirmar direção.

## Pausa 3 — Antes de cada commit

Antes de QUALQUER `git commit`:

1. Roda build do projeto (deve passar)
2. Roda `git status`
3. Roda `git diff --stat`
4. Propõe mensagem de commit
5. Aguarda autorização explícita

Se humano não respondeu, NÃO assuma "vai comitar". Espera resposta.

## Sinais de que você está pulando pausa

- Comitou sem mostrar diff antes → erro grave
- Avançou pra próximo passo sem pausa intermediária → erro médio
- Respondeu "ok" e seguiu sem pergunta clara → erro pequeno

Em qualquer caso, **pausa imediato** e reporta ao humano.
```

## Avaliação contra os 4 critérios

| Critério | Resposta |
|---|---|
| Situação se repete? | ✅ Sim — toda tarefa estruturada |
| Trigger é detectável? | ✅ Sim — presença de BRIEF/STATE/branch |
| Instrução é genérica? | ✅ Sim — vale pra qualquer projeto |
| Custo de errar baixo? | ✅ Sim — pior caso reforça disciplina |

**Recomendação:** vale criar.

## Riscos

- **Sobrepõe com `commit-discipline`** — as duas falam de Pausa 3
- **Pode ser preguiçoso:** se ativa em toda branch `feat/*`, pode
  ativar em situações pequenas onde Pausa 3 é overkill

## Mitigação

- Combinar com `commit-discipline` numa skill só, ou
- Garantir que descriptions não conflitam (uma específica pra
  commit, outra específica pra plano de tarefa)
