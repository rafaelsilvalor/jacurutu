# Skill candidata: commit-discipline

> **Status:** rascunho pra discussão. Ainda não é Skill ativa.

## Quando essa Skill ativaria

Quando o agente está prestes a fazer ou propor um commit Git.
Triggers detectáveis:

- Comando que inclui `git commit`
- Frase do usuário: "comita", "comite", "faz o commit", "salva"
- Pausa 3 sendo apresentada (mensagem de commit proposta)

## O que ela carregaria como contexto

Ao ativar, reforçaria:

1. **Conventional Commits obrigatório**
2. **Trailer Co-authored-by** quando agente IA é o autor
3. **Pausa 3 antes do commit** — mostrar `git status` +
   `git diff --stat` e aguardar aprovação humana
4. **NÃO empurrar (`git push`) sem autorização**
5. **Mensagem reflete fielmente o conteúdo**

## Como o SKILL.md ficaria

```markdown
---
name: commit-discipline
description: Ativa quando você está prestes a fazer ou propor um
  git commit. Reforça Conventional Commits, trailer Co-authored-by
  quando aplicável, Pausa 3 antes do commit, e proibição de git
  push sem autorização. Use quando ver pedido pra "comitar",
  "salvar", ou quando você for apresentar mensagem de commit em
  Pausa 3.
---

# Disciplina de commit

Antes de qualquer commit:

## Conventional Commits obrigatório

Formato: `<tipo>(<escopo>): <descrição imperativa>`

Tipos válidos: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`,
`experiment`.

Exemplos válidos:
- `refactor(auth): split login flow into smaller functions`
- `chore(state): mark task as completed`
- `docs(readme): update setup instructions`

## Trailer obrigatório quando agente IA é autor

Toda mensagem de commit feita por agente IA inclui ao final:

```
Co-authored-by: Claude <noreply@anthropic.com>
```

Permite filtrar via `git log --grep="Co-authored-by: Claude"`.

## Pausa 3 antes do commit

Você NUNCA comita sem antes:

1. Rodar build do projeto — deve passar
2. Mostrar `git status`
3. Mostrar `git diff --stat`
4. Propor mensagem de commit
5. Aguardar autorização explícita do humano

## NÃO empurrar (git push) sem autorização

Push em main = checkpoint humano. Você nunca empurra
automaticamente. Mesmo se humano disser "comite e empurra", você
comita, mostra resultado, e pergunta antes do push.

## Mensagem reflete fielmente

Se o commit faz X e Y, a mensagem cita X e Y. Se faz X mas você
acha "mais limpo" descrever só X, peça permissão pra ajustar
escopo em vez de fingir.
```

## Avaliação contra os 4 critérios

| Critério | Resposta |
|---|---|
| Situação se repete? | ✅ Sim — todo commit |
| Trigger é detectável? | ✅ Sim — palavras-chave + Pausa 3 |
| Instrução é genérica? | ✅ Sim — vale pra todo projeto |
| Custo de errar baixo? | ✅ Sim — falso positivo só reforça boa prática |

**Recomendação:** vale criar como **primeira Skill universal**.

## Riscos

- **Excesso de cerimônia:** se ativa toda hora, pode irritar
- **Conflito com outras Skills:** múltiplas Skills falando de
  Pausa 3
