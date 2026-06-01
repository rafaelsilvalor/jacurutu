# Workflow: Close Task

## Quando usar

Terminar tarefa, antes de mergear em main. Garante validação,
STATE.md atualizado, nada quebrado.

Use quando:
- Todos os passos do plano foram concluídos
- Validação manual foi feita (se aplicável)
- Você acha que tarefa está pronta

## Pré-requisitos

- Estar na branch da tarefa (não em main)
- Plano da tarefa concluído
- Critérios de pronto do brief atendidos

---

## --- COPIAR ---

```
Tarefa concluída. Antes de mergear, verificação final.

PASSO 1 — Verificações automáticas:
[Adapta conforme stack do projeto. Exemplos:]
- Build passa (npm run build, cargo build, go build, etc.)
- Linter passa (eslint, ruff, clippy, etc.)
- Testes passam (npm test, pytest, cargo test, etc.)

Se algum falhar, PARAR e reportar — não tente consertar sem
autorização.

PASSO 2 — Limpeza de stubs e TODOs:
grep -rn "TODO\|FIXME\|HACK" [pasta-de-código]/
Avalia cada um — eram da tarefa ou pré-existentes? Os da tarefa
devem estar resolvidos.

PASSO 3 — STATE.md:
Decide com humano se mantém ou remove:
- Manter: atualiza status para "completed", comita
- Remover: rm STATE.md, comita "chore(state): remove after completion"

PASSO 4 — Reporta git status final:
git status (deve estar limpo)
git log --oneline main..HEAD
git diff --stat origin/main

PASSO 5 — Reporta resumo:
- Quantos commits a tarefa gerou
- Quais arquivos foram modificados
- Pendências que ficaram (se houver, justifica)
- Observações relevantes pra revisão

Se vai produzir recap da execução, salva em:
docs/sessions/<YYYY-MM-DD>-executor-<NNN>-<slug>.md
  - <YYYY-MM-DD>: data do close
  - executor: papel fixo (este workflow roda no executor — Claude Code)
  - <NNN>: número da tarefa (mesmo do brief)
  - <slug>: slug curto-descritivo do tópico

PASSO 6 — PARAR:
- NÃO faz checkout pra main
- NÃO faz merge
- NÃO faz push
- Aguarda minha autorização pra próximo passo
```

## --- FIM COPIAR ---

## Após resposta do agente

Você revisa o reporte. Se tudo estiver ok, **você** executa o
merge manualmente seguindo `gitflow-merge-into-main.md`.

⚠️ **Não delegue merge pro agente.** Push é checkpoint humano.

## O que NÃO fazer

- ❌ Deixar agente fazer merge sozinho
- ❌ Pular verificações automáticas pra "ir mais rápido"
- ❌ Mergear se algum critério do brief não foi atendido
- ❌ Deletar branch antes de confirmar push

## Próximo workflow

- Tudo ok → `gitflow-merge-into-main.md`
- Experimento descartado → `gitflow-experiment-discard.md`
- Pendências precisam ser ajustadas → volta pra tarefa

## Limpeza pós-merge

Após o squash-merge do PR via GitHub UI:

1. **Delete a branch órfã local.** Squash-merge sempre orfaniza a branch local
   (o conteúdo entrou em `main` sob outro hash). Forced delete é sempre correto:

   ```bash
   git checkout main
   git pull
   git branch -D <branch>
   ```

2. **Re-upload dos docs canônicos no project knowledge do claude.ai.** O sync é
   manual. Re-suba os arquivos que o PR alterou (ex.: `CLAUDE.md`,
   `docs/MENTOR_BRIEF.md`, `docs/ROADMAP.md`, agentes ou skills tocados) mais o
   recap da sessão. Bloqueia a próxima sessão de chat de ler as versões frescas.
