# Workflow: GitFlow Emergency Recovery

## Quando usar

Git em estado inesperado — divergência, conflito de merge, push
rejeitado, branch zumbi, qualquer caos.

## Princípio antes de tudo

**Não entre em pânico. Git não perde dados facilmente.** O que
parece "perdido" geralmente está em:

- `git reflog` (TUDO que aconteceu, mesmo deletado)
- Stashes (`git stash list`)
- Branches que ainda existem em outro lugar
- Tags que você (ou agente) criou

**Antes de fazer qualquer coisa destrutiva, leia esse workflow
inteiro.**

## Pré-requisitos

- Acesso ao terminal
- Tempo pra investigar (não tente recuperar com pressa)

---

## Etapa 1 — Diagnóstico

```bash
git status
git branch -a
git log --oneline -10
git fetch origin
git log origin/main..main --oneline
git log main..origin/main --oneline
git stash list
git tag -l
```

A partir dos outputs, identifica o cenário:

### Cenário A — Local atrás do remoto (`behind by N`)

`git log main..origin/main` mostra commits, `origin/main..main`
está vazio.

**Solução:**
```bash
git pull --ff-only origin main
```

### Cenário B — Local à frente do remoto (`ahead by N`)

`git log origin/main..main` mostra commits, `main..origin/main`
está vazio.

**Solução:**
```bash
git push origin main
```

### Cenário C — Local e remoto divergiram

Ambos `git log` mostram commits diferentes. Push rejeita.

**Análise primeiro:** o que você tem que o remoto não tem é
**único** ou **duplicata**?

```bash
git log origin/main..main --oneline
git log main..origin/main --oneline
git diff origin/main main
```

Se `git diff` retornar **vazio** ou trivial, conteúdo é o mesmo:

```bash
git tag -a safepoint/local-before-reset -m "Local state before reset"
git reset --hard origin/main
git status
git log --oneline -5
```

Se `git diff` mostrar mudanças reais que quer preservar, vai pro
Cenário D.

### Cenário D — Merge real necessário

Trabalho local único E remoto também tem trabalho que você não
tem.

```bash
git tag -a safepoint/before-merge -m "Local state before merging origin"
git pull --no-rebase origin main
```

Vai gerar merge commit. Conflito? Cenário E.

### Cenário E — Conflito de merge

```bash
git status   # lista arquivos com conflito
```

Pra cada arquivo:
1. Abre no editor
2. Procura `<<<<<<<`, `=======`, `>>>>>>>`
3. Resolve manualmente
4. `git add <arquivo>`

Quando todos resolvidos:
```bash
git commit
```

Se conflito é confuso e quer cancelar:
```bash
git merge --abort
```

### Cenário F — Branch zumbi

Branch existe mas não lembra propósito ou parada > 7 dias.

```bash
git log [nome-branch] --oneline
git log main..[nome-branch] --oneline
```

- Lixo de teste → delete (`git branch -D`)
- Experimento descartado → preserva como tag
  (`gitflow-experiment-discard.md`)
- Trabalho legítimo parado → continua ou mergeia

### Cenário G — Estado catastrófico

Não consegue identificar. Working tree bizarro, commits aleatórios,
conflitos misteriosos.

```bash
git reflog
```

Mostra **TUDO**. Identifica última linha que faz sentido. Anota o
hash.

```bash
git tag -a safepoint/recovery-attempt -m "State before recovery"
git reset --hard <hash-do-reflog>
```

⚠️ Use `reset --hard` **somente em local não-empurrado**.

## O que NUNCA fazer

- ❌ `git push --force` em main (G-R7)
- ❌ `git rebase` em commits empurrados
- ❌ Deletar `.git/` manualmente
- ❌ "Tentar de novo" com mais força

## Quando chamar mentor

Se após Etapa 1 você não consegue identificar o cenário, **não
prossiga**. Cola os outputs em chat com mentor sênior antes de
qualquer ação.

Diagnóstico errado leva a reset errado. Reset errado em commit
empurrado é catástrofe real.

## Princípio em jogo

**Git é conservador por design.** Recusa operações destrutivas
porque te protege. Quando recusa (`rejected`, `non-fast-forward`,
`would lose changes`), o instinto certo é **investigar, não
forçar**.
