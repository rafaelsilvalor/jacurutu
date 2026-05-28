# Session recap — 2026-05-28 — mentor — verb-allowlist-and-process-reset

**Mode:** mentoring.
**Continuation of:** `docs/sessions/2026-05-27-mentor-016-phase-1-execution-followup.md`.

Sessão começou pra fechar item 3 do bundle operational hygiene (verb
collision sistêmica). Fechou. Também produziu uma correção de processo:
mentor estava substituindo planner; vai parar.

## Decisões

### Produto

- **Caminho C (allowlist + validator check + SSOT)** decidido pro
  verb-collision gap. Allowlist vive em
  `.claude/skills/pre-commit-self-audit/SKILL.md` como single source of
  truth. Brief-validator ganha Check C11 que grepa a SSOT em runtime
  (não duplica).
- **5 verbos adicionados** ao allowlist (14→19): `deprecate`, `promote`,
  `wire`, `declare`, `canonicalize`. Critério: fit semântico não coberto
  pelos 14 existentes.
- **4 verbos explicitamente rejeitados** com substituições documentadas:
  `record`→`document`, `ignore`→`add`, `clean`→`remove`,
  `reduce`→`refactor`.
- **C11 emite FAIL (REJECTED)**, não STOP. STOP reservado pra falha
  estrutural (SSOT não-parseable).

### Processo

- **Mentor não escreve briefs.** Mentor produz prosa curta com decisão
  + contexto + escopo. Planner traduz em brief. Caminho B reservado pra
  bootstrap briefs (que modificam o próprio planner ou skills que ele
  usa) e casos onde a deliberação doutrinal é pesada o suficiente que
  faz sentido o user revisar antes de qualquer agent tocar — não
  default.
- **Pipeline é default só pra mudanças de risco médio-alto.** Pra
  mudanças pequenas e bem-definidas, manual via Claude Code curto é
  caminho de primeira classe.
- **Briefs e recaps encolhem.** Limite mental: recap ≤ 100 linhas,
  brief proporcional ao tamanho real do diff. Massa do repo deve ser
  código, não processo.

## Próxima ação

Executar a tarefa manualmente (sem pipeline, sem brief versionado):

1. Abrir Claude Code no repo root.
2. Colar o prompt de
   `/mnt/user-data/outputs/operational-hygiene-claude-code-prompt.md`.
3. Revisar 3 commits antes de cada Pause.
4. Push, PR, squash merge.
5. Opcional: `git config core.hooksPath .githooks` se quiser ativar o
   hook neste clone (recomendo dormant até Phase 2).

## Open items (carry-over enxuto)

- v1 transitive deps audit (11 findings de `npm audit` em 016). Status:
  assessment pendente; não é brief até saber se algum está em path prod
  do v1.
- Old 013 carry-over (executor memory, no-verbal-override, draft skill
  promotion). Deferido. Nova data de brief 016 não muda priorização.
- Candidato pra AGENT_PLAYBOOK Chapter 6 Lesson #14: "se mentor delivery
  > planner delivery, mentor está fora da pista." Não vira brief
  próprio — entra como adendo num PR futuro.

## Snippet pra próxima sessão

```
Olá. Modo: continuar (ou mentoria — tu escolhe).

Continuação de 2026-05-28-mentor-verb-allowlist-and-process-reset.
Mudanças do operational hygiene mergeadas em main. Allowlist expandido
14→19, C11 ativo, hook shipped dormant, MENTOR_BRIEF §2 atualizado.

Próxima decisão de produto: começar Phase 2 (port do lib_transform.py
em packages/core) ou outra coisa.

Re-upload no project knowledge: SKILL.md, brief-validator.md,
executor.md, MENTOR_BRIEF.md, .githooks/pre-commit. Este recap.

Antes de propor próximo passo, confirma M-R13.
```
