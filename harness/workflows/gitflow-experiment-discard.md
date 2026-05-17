# Workflow: GitFlow Discard Experiment

## Quando usar

Descartar branch `experiment/*` que foi testada mas não funcionou
(ou foi superada). Aplica G-R6 — preservar evidência.

## Pré-requisitos

- Branch ativa começa com `experiment/`
- Decidiu que **não vai pra main**
- Razão clara pra descarte

---

## Sequência de comandos

### 1. Verifica os commits da branch

```bash
git log main..experiment/[nome] --oneline
```

Lista commits únicos. Vão sumir quando deletar.

### 2. Cria tag de preservação

Convenção: `experiments/[nome]-[resultado]`

Resultados: `rejected`, `superseded`, `paused`.

```bash
git tag -a experiments/[nome]-rejected experiment/[nome] -m "Mensagem clara explicando teste e resultado."
```

### 3. Empurra a tag pro remoto

```bash
git push origin experiments/[nome]-rejected
```

Esperado: `* [new tag] experiments/[nome]-rejected -> ...`

### 4. Verifica tag criada

```bash
git tag -l "experiments/*"
```

### 5. Deleta branch local

```bash
git checkout main
git branch -D experiment/[nome]
```

`-D` maiúsculo = force delete (commits não-mergeados).

### 6. Deleta branch remota

```bash
git push origin --delete experiment/[nome]
```

Se a branch só existia local, ignora o erro.

### 7. Verificação final

```bash
git status
git branch -a
git tag -l "experiments/*"
```

Esperado:
- Working tree clean
- Branch experimental sumiu
- Tag aparece na listagem

## Como ressuscitar o experimento depois

```bash
git checkout -b experiment/[nome]-revisited experiments/[nome]-rejected
```

Tag preservou tudo.

## Quando NÃO usar esse workflow

- ❌ Branch que foi mergeada em main → usa
  `gitflow-merge-into-main.md`
- ❌ Branch de tarefa real (não é "experimento")
- ❌ Branch criada por engano sem nada relevante → delete simples

## Princípio em jogo

**Conhecimento negativo é conhecimento.** Saber que algo NÃO
funciona evita re-investigação futura. Tag preserva sem manter
branch viva.
