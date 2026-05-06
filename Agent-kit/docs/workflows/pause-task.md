# Workflow: Pause Task

## Quando usar

Pausar tarefa em andamento (fim do dia, sair do projeto, mudar pra
outra coisa). Garante que retomar depois seja seguro.

## Pré-requisitos

- Tarefa em andamento (provavelmente em branch de tarefa, com
  STATE.md ativo)

---

## --- COPIAR ---

```
Pausando tarefa. Antes de fechar a sessão, garante estado
retomável:

PASSO 1 — Atualiza STATE.md:
- Status: in-progress (ou blocked, se houver impedimento)
- Last update: [data e hora atual]
- Done so far: marca [x] em tudo feito desde último update
- Next steps: deixa explícito o próximo passo concreto
- Notes for next session: anota contexto não-óbvio que ajudaria
  retomar

PASSO 2 — Comita STATE.md atualizado:
git add STATE.md
git commit -m "chore(state): pause [nome-tarefa] - [próximo-passo-curto]"

PASSO 3 — Reporta git status final:
git status (deve estar limpo)
git log --oneline -3
Confirma que estamos em branch de tarefa (não em main)

PASSO 4 — Sobre push:
Push de branch de tarefa (não de main) é seguro pra ter backup
remoto. Se trabalho durou mais de uma sessão, recomendo. Se foi
curto, opcional.

Me confirma se quer fazer push da branch antes de eu fechar.
```

## --- FIM COPIAR ---

## Após confirmação

### Push da branch (recomendado pra trabalho longo)

```bash
git push -u origin [nome-da-branch]
```

Preserva trabalho em backup remoto. Útil se:
- Trabalho durou várias sessões
- Você muda de máquina
- Quer poder olhar diff no GitHub/etc.

### Manter só local

Aceitável pra tarefas curtas (1-2 sessões). Risco baixo se você
não formatar o disco.

## Como retomar

Próxima sessão, usa `resume-session.md`. STATE.md atualizado vai
dizer onde retomar.

## O que NÃO fazer ao pausar

- ❌ Deixar mudanças não-comitadas no working tree
- ❌ Pausar sem atualizar STATE.md
- ❌ Mergear em main "por garantia" (tarefa pode estar inacabada)
- ❌ Deletar a branch (perde trabalho não-mergeado)

## Princípio em jogo

**Trabalho não-comitado não existe.** Se você fechar o terminal e
o PC pegar fogo, só sobrevive o que está no Git.
