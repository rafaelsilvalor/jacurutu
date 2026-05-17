# Workflow: Review Pause 3

## Quando usar

Agente terminou um passo do plano e está apresentando Pausa 3
(`git status` + `git diff --stat` + mensagem proposta). Você
decide se autoriza commit.

## O que esse workflow faz

Checklist objetivo de revisão pré-commit. Complementa o Capítulo 3
do AGENT_PLAYBOOK (revisão por sintomas).

## Pré-requisitos

- Agente apresentou Pausa 3 com:
  - Output de `git status` ou `git diff --stat`
  - Resumo do que foi feito
  - Mensagem de commit proposta

---

## Checklist de revisão

### Verificações automáticas

```
[ ] Build passa? (adapta pro stack: npm run build, cargo build, etc.)
[ ] Lint passa? (eslint, ruff, clippy, etc.)
[ ] Apenas arquivos esperados foram modificados?
```

### Verificações estruturais

```
[ ] Mensagem de commit segue Conventional Commits?
[ ] Mensagem reflete fielmente o conteúdo (não promete mais ou
    menos)?
[ ] Tipo do commit (feat/refactor/fix/chore/docs) bate com a
    natureza?
[ ] Escopo é coerente com convenções do projeto?
```

### Verificações de comportamento (se aplicável)

```
[ ] Funções respeitam limites do CLAUDE.md?
[ ] Anti-patterns do CLAUDE.md ausentes?
[ ] Listeners e timers respeitam padrão (se houver regra)?
```

### Verificações de escopo

```
[ ] Mudanças são apenas do escopo do passo atual?
[ ] Stubs/TODOs introduzidos são intencionais e rastreáveis?
[ ] Nada foi deletado que não devia?
```

## Sinais de alerta

Se aparecer qualquer um, **NÃO autoriza** imediatamente:

- ⚠️ Arquivo modificado fora do escopo
- ⚠️ Build ou check falhando
- ⚠️ Mensagem de commit ambígua ou genérica
- ⚠️ Mudanças de comportamento em refator (que devia ser
  estrutural)
- ⚠️ Nova dependência adicionada sem você saber
- ⚠️ Estilo de código diverge do resto do projeto

Quando aparecer alerta, **questiona** o agente antes de autorizar.

## Modelos de resposta

### Tudo ok

```
Verificações ok. Mensagem reflete o conteúdo. Autorizado a
comitar.

Após commit:
1. Confirma o hash
2. Prossegue pro [próximo passo do plano]
```

### Quase ok, ajuste pequeno

```
Quase tudo ok. Antes de comitar, ajusta [X específico]:
[descreve o ajuste]

Depois mostra git status atualizado e segue o commit.
```

### Bloqueio, precisa investigação

```
Espera. Antes de autorizar, preciso entender:

1. [pergunta específica]
2. [outra pergunta]

Não comita ainda. Me responde primeiro.
```

### Reverter e refazer

```
Esse passo precisa ser refeito. Razão: [específica].

Reverte com git checkout . (ou git stash) e me apresenta nova
proposta considerando [o que ficou faltando].
```

## Princípio em jogo

**Cada Pausa 3 é checkpoint humano.** Aprovação fácil é tentadora
mas é onde bugs futuros entram. Cinco minutos por Pausa 3
economizam horas de debug depois.
