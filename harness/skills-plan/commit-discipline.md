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
