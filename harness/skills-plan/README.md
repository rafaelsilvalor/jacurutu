# Skills — Plano

Esta pasta **não contém Skills ativas**. Contém **plano** de quais
Skills criar, com critério, ordem de prioridade.

Quando uma Skill for adotada, vai pra `.claude/skills/<nome>/SKILL.md`
(não nessa pasta).

## O que são Skills (revisão rápida)

Skills são pacotes de instruções que o Claude **carrega
automaticamente** quando o que você está pedindo bate com a
`description` da skill. Ativam sozinhas — você não invoca.

Estrutura:

```
.claude/skills/
└── nome-da-skill/
    └── SKILL.md          ← arquivo único, formato fixo
```

Conteúdo (frontmatter YAML + Markdown):

```markdown
---
name: nome-da-skill
description: Quando o usuário pede [X], esta skill carrega [Y]
  e guia [Z]. Use quando vir [trigger 1], [trigger 2].
---

# Conteúdo da skill em Markdown
```

Documentação oficial:
https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview

## Por que Skills > Workflows + Briefs em alguns casos

| Workflows / Briefs | Skills |
|---|---|
| Você cola manualmente | Ativa automática |
| Funciona em qualquer agente | Específico Claude Code / API |
| Você decide quando usar | Claude decide quando carregar |

**Princípio:** Skills servem quando o **trigger** é claro e
recorrente. Se você sempre tem que se lembrar de colar workflow X,
talvez X devesse virar Skill.

## ⚠️ Risco de Skills mal-feitas

Skill mal-descrita ativa em situação errada e polui contexto. Por
isso vale planejar antes de criar.

Sintomas de Skill ruim:
- Ativa em situações que não pediu
- Não ativa quando devia
- Polui resposta com instruções irrelevantes
- Conflita com outras Skills

## Candidatas universais (servem pra qualquer projeto)

Cada arquivo abaixo é **rascunho pra discussão**, não Skill pronta.

- **`commit-discipline.md`** — Skill que reforça Conventional
  Commits + Pausa 3 quando vê pedido pra comitar
- **`task-pauses-protocol.md`** — Skill que reforça Pausa 1 e
  Pausa 2 em sessão de tarefa estruturada (Pausa 3 fica em
  commit-discipline.md)
- **`mentor-handoff.md`** — Skill que ativa quando agente percebe
  que tarefa ficou complexa demais e sugere consultar mentor

## Candidatas específicas (cada projeto cria as suas)

Quando seu projeto tiver padrão recorrente que merece automação,
considere criar Skill específica. Exemplos típicos:

- Skill por tipo de arquivo (ex: "componente UI", "endpoint API")
- Skill por área (ex: "trabalho em CSS", "trabalho em testes")
- Skill por convenção (ex: "uso de framework X")

Não inclua templates específicos aqui. Cada projeto decide.

## Como decidir quais criar

Critério em ordem:

1. **A situação se repete?** (≥ 5 vezes em sessões diferentes)
2. **O trigger é detectável?** (palavras-chave, padrões de
   arquivo)
3. **A instrução é genérica?** (não específica de uma tarefa)
4. **Custo de errar é baixo?** (Skill ativa errado ≠ projeto
   quebra)

Se todos os 4 → vale criar. Se 2-3 → talvez. Se 1-0 → fica como
workflow.

## Estado do plano

- [ ] Discutir com mentor cada candidata abaixo
- [ ] Decidir conjunto inicial (recomendo 1-2 pra começar)
- [ ] Criar SKILL.md em `.claude/skills/<nome>/` no projeto
- [ ] Testar em sessões reais por 1-2 semanas
- [ ] Iterar ou descartar baseado em uso
