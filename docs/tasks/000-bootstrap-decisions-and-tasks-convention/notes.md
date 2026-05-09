# Notes — 000 Bootstrap decisions and tasks convention

## Errata: path of `task-brief-template.md`

The `brief.md` in this directory references `docs/prompts/task-brief-template.md`
in Edits 2c, 3b, 3c, 5a, and 5b. That path was incorrect — the file lives at
`Agent-kit/docs/prompts/task-brief-template.md` and always has. The original
`07-create-brief.md` carried the same wrong path, which is what propagated into
the brief.

The execution applied the edits to the actual location
(`Agent-kit/docs/prompts/task-brief-template.md`) and updated all canonical
references (`CLAUDE.md` Related Documents, `MENTOR_BRIEF.md` §7 and §8,
`Agent-kit/init/07-create-brief.md` PASSO 5 and 6) to point there.

The brief file itself is preserved verbatim as the historical record of the
original instructions.

## Lesson

When authoring a brief that prescribes filesystem paths, validate each path
against `tree`/`ls` of the actual repo before locking the brief. Trusting a
referenced doc's path verbatim is overconfidence (D3 of `AGENT_PLAYBOOK.md`).
