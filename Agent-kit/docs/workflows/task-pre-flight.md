# Workflow: Task Pre-Flight

## Quando usar

Antes de qualquer mexida em código (do agente ou sua), pra
confirmar estado do projeto.

Use:
- Toda vez que abrir agente numa sessão de trabalho real
- Antes de iniciar tarefa nova
- Após qualquer evento que pode ter mudado estado

## Pré-requisitos

Nenhum. Esse workflow é o "primeiro passo".

---

## --- COPIAR ---

```
Pre-flight antes de prosseguir. Roda em sequência e me reporta
cada output (não resuma):

git status
git branch
git fetch origin
git log --oneline -5
git log origin/main..HEAD --oneline   (se em branch que não é main)

Aguardo output completo antes de qualquer ação.
```

## --- FIM COPIAR ---

## Como interpretar

| Sinal | Interpretação |
|---|---|
| `working tree clean` | ✅ Pode prosseguir |
| `Changes not staged for commit` | ⚠️ Mudança local pendente — investigar |
| `Untracked files` | ⚠️ Arquivo novo não-rastreado — decidir se inclui |
| `Your branch is behind by N` | ⚠️ Remoto tem novidade — `git pull --ff-only` |
| `Your branch is ahead by N` | ⚠️ Local tem commits não-empurrados — esperado em branch de tarefa |
| `Your branch and origin/X have diverged` | 🚨 Vai pra `gitflow-emergency-recovery.md` |
| Branch errada | 🚨 Investigar antes de mexer |

## Sinais de alerta

Se aparecer qualquer um, **NÃO prosseguir**:

- Mudanças não-comitadas que você não fez
- Branch que não reconhece
- Commits no log que não lembra ter feito
- `STATE.md` modificado mas você não mexeu
- Working tree em estado de merge ou rebase incompleto (presença
  de `MERGE_HEAD`, `REBASE_HEAD`)

## Princípio em jogo

**Antes de tocar em código, confirme o estado.** Cinco segundos
de pre-flight evitam horas de debug depois.
