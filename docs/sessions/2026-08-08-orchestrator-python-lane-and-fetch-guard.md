# Session recap — 2026-08-08 — python-lane-and-fetch-guard (Orchestrator)

**Mode:** task modeling via **caminho B**, then direct execution by owner
instruction. planner NOT invoked; brief-validator NOT invoked, its eleven
checks run by hand; executor NOT invoked — the owner had ruled "escreve
direto" earlier in the session and it carried.
**Consumes:** `main@4149c4a` — PR #126, the transport of two Mentor notes.
Merge confirmed by `gh pr view` and `git log --oneline origin/main` before the
branch was cut.
**Pairs with:** nothing. No executor ran, so the execution log is in this file.

Second task of this session to be born dated, and the first whose input came
from a Mentor session rather than from the Orchestrator's own queue.

## One-line summary

Three consequences of the 2026-08-08 Mentor decision moved out of exploration
notes and into the canonical docs that state them: `CLAUDE.md` now says the
Python repo does not migrate, the ROADMAP carries the fetch credential guard as
a Phase 3 item, and `v1-v2-overlap.md` closed as `discarded` because the
decision removed its premise.

## What came in, and how it was split

The owner handed over four pending items from a Mentor session. They split into
two units, and the split was doctrine's rather than a preference: PASSO 5 of
`close-mentor-session.md` says a note travels on its own `docs/<topic>` branch
with its own PR.

**Unit A** transported two notes that were written to disk and left
**untracked** when that Mentor session closed. They existed only inside the
worktree of `claude/saci-typescript-migration-cost-ba7e7b` — a scaffolding
branch, not a work branch — and were found during a routine worktree cleanup
that would have destroyed them. That is why A ran first and alone: PR #126,
merged as `4149c4a`, one commit, both notes carried verbatim.

**Unit B** is this task: the consolidation the Orchestrator owns per D11 of the
mentor-lane note — projection upkeep, and moving a decision from a note into
doctrine.

## The finding that outlives this task

`python-laboratory-lane.md` carries one item that bears on this repository
independently of any migration decision, and it is now a ROADMAP item rather
than a note's paragraph.

Jira's `POST /rest/api/3/search/jql` answers `200` with an empty list when the
token has expired, not `401`. An expired credential is therefore
indistinguishable from a project with no matching issues. `runFetch`
(`packages/cli/src/run-fetch.ts:110`) writes the payload unconditionally, so a
stale token overwrites a good payload with zero entries and the next export
ships empty with nothing having failed.

The Python lab carries two guards after a run went blind in production. This
repo carries none, measured while authoring:

```
$ grep -rn 'myself\|verifyAuth\|verify_auth' packages/ --include='*.ts'
(no output)
```

The item states the problem and points at the evidence. It does not prescribe
the guard's shape — pre-flight call, non-destructive write, or both is a
brief's decision, and a roadmap entry that picks the mechanism closes a
question nobody has examined.

## Decisions closed with the owner

1. **`v1-v2-overlap.md` becomes `discarded`, not `deferred`.** Ratified before
   authoring rather than defaulted. The note asked whether to keep
   `automation/` untouched during the overlap; the decision that the Python
   repo never migrates removes what the question stood on rather than answering
   it. `deferred` was rejected because it requires a declared trigger, and
   inventing one for a question that stopped applying puts a false condition
   into the record.
2. **The ROADMAP item is untagged.** `docs/ROADMAP.md:118` reserves `[coord]`
   and `[prod]` for the two modes and leaves foundational items bare. A guard
   on the read path serves both.
3. **The transport carried both notes verbatim.** Their changelogs still say
   the dispositions were proposed rather than ratified. Writing the ratified
   line is the Mentor's per `close-mentor-session.md` PASSO 3, not the
   transport's to invent — recorded in the PR body rather than fixed.

## Two authoring defects, both caught before committing

1. **The Commit sequence prescribed `discard`,** which is absent from the
   `ALLOW=` SSOT, while the prose beside it said to use `drop`. The list
   disagreeing with its own note — the same class this session met three times
   in the previous task, and caught here by the C7 extraction this repository
   repaired yesterday. The check paid for itself again, on the first brief
   authored after it landed.
2. **`drop` was wrong too.** It was the obvious substitute and it survived one
   pass before the second look: D10 says nothing is deleted, and the commit
   deletes nothing — the note, its entry text and its changelog all survive.
   What the commit does is declare a disposition. `declare` is the verb.

Both were fixed in the brief before commit #1, so neither reached a commit.

## Two checks that returned empty for the wrong reason

Neither changed what shipped, but both would have if read at face value, and
this session has already shown what that costs.

A `grep` for `permanent laboratory lane` in `python-laboratory-lane.md`
returned nothing, which looked like the note and `CLAUDE.md` disagreeing. The
phrase is split across two lines in the file; the search was naive, not the
file wrong.

A check for whether the new ROADMAP item sat inside Phase 3's `Items` list
reported FAIL. It used `grep -n '^\*\*Exit criterion:\*\*' | head -1`, which
finds the first such heading in the whole file — an earlier phase's. Re-run
with Phase 3's real boundaries: `**Items:**` at 164, the item at 226, exit
criterion at 234, Phase 4 at 259. It passes.

## Run facts

- Branch `docs/python-lane-and-fetch-guard` from `4149c4a`; 4 commits
  (`a631fc3`, `de97dc1`, `c628692`, `20e0e80`); 4 files, +303 −2 as of
  `20e0e80`, which excludes the commit carrying this file.
- `packages/` untouched: `git diff --name-only origin/main...HEAD | grep -c
  '^packages/'` returns 0. The finding is queued, not implemented.
- Green boundary before every commit: `npx tsc -b` clean, `npm test` at
  305 tests / 304 pass / 0 fail / 1 skipped.
- Every commit message verified byte-for-byte against its approved file after
  committing. Zero drift, zero amends.
- Pause 1 skipped (`Plan required: no`). Pause 2 after Edit 2. Pause 3 before
  all four commits.
- No push; `git reflog | grep -c push` returns 0.

## Open queue after this session

1. **Push + PR for `docs/python-lane-and-fetch-guard`** — owner instruction
   pending. `@closer` Phase A has not run.
2. **The credential guard itself** — now a ROADMAP item, needs its own brief.
   It is the first candidate that touches `packages/` rather than docs.
3. **The ratified-disposition lines** in both transported notes — a one-line
   changelog entry each, and the Mentor's to write.
4. **Worktree and branch cleanup**, unblocked now that PR #126 merged: four
   `claude/*` branches with no worktree, two clean worktrees, and
   `harness-workflow-guide-d9dc9c`, which no longer holds unique content. The
   branch of this session's worktree goes when the session ends.
5. **Six findings queued** in
   `docs/tasks/2026-08-07-abort-049-and-fix-validator/notes.md` from the
   previous task, two of which need owner decisions.
