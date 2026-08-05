# Workflow: Audit Merge

## Quando usar

Pós-merge de uma PR não-trivial, antes de fechar a sessão. Modo §8
do `MENTOR_BRIEF.md`: code review. Aplicar quando a PR mergeada
implementou um brief de categoria M ou L.

Para tarefas categoria S sem brief, auditoria formal é overkill —
basta uma checada visual no `git log` e no diff.

## Pré-requisitos

- PR mergeada em `main`.
- Recap do executor já mergeado em `main` (D2). Auditoria não roda
  contra branch ativa do executor.
- Brief original acessível (na project knowledge do Claude.ai ou
  no checkout local).

## --- COPIAR ---

```
Auditoria pós-merge da PR <NNN>. Modo: code review.

PASSO 1 — Carrega contexto:
  - Brief: docs/tasks/<NNN>-<slug>/brief.md
  - Recap do executor: docs/sessions/<date>-executor-<NNN>-<slug>.md
  - git log da branch: git log --oneline main..<merge-commit>^2
  - Diff total: git diff main~1..main -- <paths-tocados>

PASSO 2 — Dimensão 1 — Diff técnico:
Pra cada Edit do brief, compara prescrito vs. mergeado. Classifica em:
  - Match perfeito (silêncio)
  - Wording ajustado, semântica preservada (registra; aceitável)
  - Divergência semântica ou scope leak (escalar)

PASSO 3 — Dimensão 2 — Aderência ao processo:
  - Conventional Commits em todos os commits (R10)
  - Sequência de commits bate com "Suggested commit sequence" do brief
  - Pausa 2 e Pausa 3 registradas no recap do executor
  - Sem Co-authored-by (grep git log --format=%B | grep -i co-authored)
  - STATE.md start + remove (G-R10)
  - Sem --no-verify mencionado
  - Branch naming bate com R11

PASSO 4 — Dimensão 3 — Self-review do executor:
  - Decisões do recap são distintas das do brief (não paráfrase)
  - Pendências incluem itens não previstos no brief
  - Desvios reportados honestamente (não escondidos)
  - Carry-overs de sessões anteriores foram revisados (carry-over hygiene)

PASSO 5 — Veredicto:
Pra cada dimensão: pass | pass-with-note | fail
Se fail em qualquer dimensão, propõe ação:
  - Novo brief de correção
  - Pendência registrada no recap
  - Fix in-place na próxima sessão
```

## --- FIM COPIAR ---

## Princípio em jogo

**Pós-merge é a única janela barata pra correção.** Antes do merge,
mudanças custam revert. Depois do merge sem auditoria, drift acumula
silenciosamente. Auditoria explícita força os três eixos a se tornar
evidência registrada, não memória do mentor.

## Próximo workflow

- Pass nas três dimensões → `close-mentor-session.md` (modo code review).
- Fail em Dimensão 1 ou 3 → novo brief de correção via
  `init/07-create-brief.md` ou modelagem ad-hoc em sessão Orchestrator.
- Fail em Dimensão 2 → pendência registrada no recap; correção entra
  no próximo brief estrutural.
