# Task State

## Goal
Bundle docs-only de cinco follow-ups (TS rules R20-R25, E5 reconcile,
caminho B workflow, sweep de `BRIEF_<name>.md` em Agent-kit/, entrada de
Astro Starlight no parking lot) antes do bootstrap do monorepo Phase 1.

## Status
in-progress

## Last update
2026-05-16, Windows 11 (D:\Projects\saci)

## Done so far
- [x] Commit #1 (Edit 1): brief commitado pelo usuario em `a55b67f`
      (`docs(tasks): add brief for 009-bundle-ts-rules-and-workflow`).

## Next steps
- [ ] Commit #2 — `docs(claude): add v2 typescript rules R20-R25` (Edit 2:
      CLAUDE.md, R20-R25 apos R19). Pause 2 obrigatoria apos a edit.
- [ ] Commit #3 — `docs(claude): reconcile E5 and add v1-freeze note in exceptions`
      (Edit 3: CLAUDE.md, sub-edits 3a + 3b no mesmo commit).
- [ ] Commit #4 — `docs(workflows): implement caminho B for brief invocation`
      (Edit 4: cinco sub-edits em task-brief-template.md + start-task.md).
- [ ] Commit #5 — `docs(workflows): sweep agent-kit for stale BRIEF_<name>.md references`
      (Edit 5: sweep em Agent-kit/docs/workflows/ excepto start-task.md, e
      Agent-kit/init/; lista os ficheiros alterados no corpo do commit).
- [ ] Commit #6 — `docs(roadmap): add astro starlight to parking lot`
      (Edit 6: docs/ROADMAP.md, um bullet ao fim do parking lot).
- [ ] Relatorio final: branch, `git log --oneline main..HEAD`,
      `git diff --stat origin/main...HEAD`, verificacao do sweep
      (`grep -rn 'BRIEF_[A-Za-z0-9_-]*\.md' Agent-kit/` -> vazio),
      lista de ficheiros alterados pela Edit 5, confirmacao de nao-push.
- [ ] Remover STATE.md antes de abrir PR (G-R10).

## Blockers (if status = blocked)
n/a

## Notes for next session
- Caminho B: brief foi pre-salvo pelo usuario; nao regenerar a partir
  da memoria. Verificacao da Edit 1 ja confere (commit existe, primeira
  linha do ficheiro bate).
- `Plan required: no` no brief — cada edit tem texto exato e ancoras.
- Pause 2 obrigatoria apos Edit 2 (antes do commit #2); Pause 3
  obrigatoria antes dos commits #3-#6.
- Sem `git push` (CLAUDE.md R17 / G-R5).
- Edit 5: se um ficheiro tiver tambem debt setup-code-style (patterns
  1/5), corrigir apenas a ref de path e reportar o resto (fora de
  escopo deste brief).
