# Task State

## Goal

Land seven items of doctrine/workflow cleanup accumulated across sessions
007–011: formalize `audit-merge` workflow, add branch defense + naming
convention to `close-chat-session`, retroactively rename pre-convention
session recaps, resolve `commit-discipline` × `pause-3-protocol` overlap,
catalog `G-PROC-1` gotcha, add `.gitattributes` with LF normalization +
blame-ignore plumbing. Pure documentation/harness; no application code.

## Status

in-progress

## Last update

2026-05-21, Windows 11 / PowerShell

## Done so far

- [x] Pre-flight (git status / branch / log)
- [x] Branch created: `docs/workflow-lifecycle-cleanup`
- [x] STATE.md drafted

## Next steps

- [ ] Commit STATE.md (`chore(state): start 012-workflow-lifecycle-cleanup`)
- [ ] Present plan in chat; wait for explicit approval (Pausa 1)
- [ ] Edit 1 — verify brief on disk; commit #1 `docs(tasks): add brief for 012-workflow-lifecycle-cleanup`
- [ ] Edit 2 — create `harness/workflows/audit-merge.md`; **Pausa 2** (first significant file); commit #2
- [ ] Edit 3 — index `audit-merge.md` in `harness/workflows/README.md`; commit #3
- [ ] Edit 4 — `close-chat-session.md` branch defense + naming convention (4a + 4b); commit #4
- [ ] Edit 5 — enumerate `docs/sessions/`; `git mv` 4 files; sweep cross-refs; add executor recap line to `close-task.md`; commit #5
- [ ] Edit 6 — rewrite `commit-discipline.md`; `git mv` + rewrite `pause-3-protocol.md` → `task-pauses-protocol.md`; commit #6
- [ ] Edit 7 — `G-PROC` category + `G-PROC-1` entry in `docs/GOTCHAS.md`; commit #7
- [ ] Edit 8a — create `.gitattributes`; commit #8
- [ ] Edit 8b — `git add --renormalize .`; STOP if unexpected binary; commit #9 (or skip)
- [ ] Edit 8c — `.git-blame-ignore-revs` with SHA from 8b; commit #10 (or skip)
- [ ] Edit 8d — document `blame.ignoreRevsFile` in `docs/GIT_WORKFLOW.md`; commit #11
- [ ] Remove STATE.md before close (G-R10)
- [ ] Report final summary; **do not push** (R17 / G-R5)

## Blockers (if status = blocked)

None.

## Notes for next session

- Brief is caminho B (pre-saved by user). Edit 1 verifies on disk and
  commits as commit #1 — do not regenerate from memory.
- Pausa 1 is skipped per brief (`Plan required: no`), but mentor's
  start-task prompt asks for a plan presentation anyway — comply.
- Pausa 2 and Pausa 3 always required (AGENT_PLAYBOOK Lesson #6).
- STOP-and-report triggers cataloged in Pause points section of brief —
  do not improvise around them.
- D18: Edit 8 runs last, on a clean tree, so renormalization is the
  only diff staged at that point.
- D16: order matters in Edit 8 — 8a → 8b → 8c → 8d.
- Edit 5 / Edit 6 cross-reference sweeps must allow matches inside
  historical `docs/sessions/<date>-*.md` recap files (historical record).
