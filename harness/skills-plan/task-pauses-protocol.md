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

**Pulável** se o brief declara `Plan required: no` — ver
`.claude/skills/brief-template/SKILL.md`, que substituiu o antigo
`harness/prompts/task-brief-template.md` (removido em 2026-05-23).

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
