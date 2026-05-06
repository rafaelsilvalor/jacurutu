# Workflow: GitFlow Merge into Main

## Quando usar

Mergear branch de tarefa em main após validação completa. Aplica
G-R5 (branches), G-R7 (sem destruir histórico).

Use somente após `close-task.md` ter sido executado e você ter
revisado tudo.

## ⚠️ Você executa, não o agente

Não delegue isso. Push em main = checkpoint humano (G-R4).

## Pré-requisitos

- Tarefa concluída e validada
- Você está em branch de tarefa (não em main)
- Working tree clean
- STATE.md atualizado pra `completed` ou removido

---

## Sequência de comandos

### 1. Memorize o nome da branch atual

```bash
git branch
```

Anota o nome.

### 2. Volta pra main e atualiza

```bash
git checkout main
git pull --ff-only origin main
```

`--ff-only` recusa se houver divergência. Se recusar, **pare** e
vai pra `gitflow-emergency-recovery.md`.

### 3. Mergeia com `--no-ff`

```bash
git merge --no-ff [nome-da-branch] -m "Merge branch '[nome-da-branch]'"
```

`-m` evita o Vim. `--no-ff` força merge commit pra preservar
história visual.

### 4. Empurra main pro remoto

```bash
git push origin main
```

Se aparecer `non-fast-forward` ou `rejected`, **pare** e vai pra
`gitflow-emergency-recovery.md`.

### 5. Deleta branch local

```bash
git branch -d [nome-da-branch]
```

`-d` minúsculo só deleta se mergeada. Se reclamar, há commits que
não foram pra main — investiga.

### 6. Deleta branch remota

```bash
git push origin --delete [nome-da-branch]
```

Se aparecer `remote ref does not exist`, ela só existia local —
ignora.

### 7. Verificação final

```bash
git status
git log --oneline -8
git branch -a
```

Esperado:
- Working tree clean, up to date with origin/main
- Merge commit no topo, depois commits da tarefa
- Só `main` local, só `origin/main` remoto

## Se merge der conflito

Vai pra `gitflow-emergency-recovery.md` (cenário E).

## Princípio em jogo

**Merge é compromisso público.** Antes do `git push origin main`,
trabalho é seu. Depois, é compartilhado. Por isso vale lentidão e
verificação.
