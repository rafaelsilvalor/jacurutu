# Session recap — 2026-08-09 — harness-redesign, continued (Orchestrator)

**Mode:** exploration on the accumulating branch, process rules relaxed by the
owner as in the previous window. Push and destructive actions still gated.
**Consumes:** `experiment/harness-redesign@32d2fbc` — the handoff state left by
`2026-08-09-orchestrator-harness-redesign.md`.
**Branch:** `experiment/harness-redesign`, still accumulating, pushed to
`origin`. Not merged to `main`.

## One-line summary

A short window that closed the three open decisions and found that the redesign
had quietly disarmed itself: the hooks live on a branch, so any session opened
in a worktree cut from `main` runs with every guard dead and no error to say so.

## The deferred cleanup, done

The ten merged sub-branch pointers listed by the previous recap are deleted.
They were removed with `git branch -d` run from the worktree where `HEAD` was
the experimental branch, so the merge check was real rather than forced with
`-D`. `fix/start-credential-guard` and `fix/fetch-credential-guard` were
verified un-merged and left alone.

The previous recap's own count was stale: its heading said "eight merged
sub-branches" while the list under it named ten. Ten is correct.

## G-HOOK-1 — the finding that matters most here

The session opened in a worktree created from `main`, where none of the five
hooks exist. Hooks are registered in `.claude/settings.json` and resolved via
`${CLAUDE_PROJECT_DIR}/.claude/hooks/`; `CLAUDE_PROJECT_DIR` is fixed at session
start to the directory the session opened in, not to the branch it later checks
out. So the guards were absent, and absence is silent — nothing fails when a
hook is merely not registered.

This is a trap the redesign created. Every hook is a file on an unmerged
branch, which means **every session opened from `main` until that branch lands
is unguarded**, and the symptom of being unguarded is that everything looks
fine. It is catalogued as `G-HOOK-1`, with the non-destructive probe that
distinguishes a live guard from a dead one: with nothing staged, a `git commit`
carrying an invalid type is denied by `commit-guard` *before* git runs, whereas
a dead harness lets git answer "nothing to commit".

Resolution here: the branch was moved into this session's own worktree
(`git -C <old> switch --detach`, then `git switch`), `npm install` was run with
G-NODE-2's lockfile guard clean, and the probe confirmed the guards live. Green
re-established in the new worktree: `tsc -b` clean, 324 package tests
(323 pass, 1 skipped) + 61 hook tests, 0 failures.

## The three open decisions, ruled

**1 — the dead reference: fixed** (`59cd2b2`). The finding was better than the
previous recap framed it. The docs guard only inspects *staged* `.md` files and
excludes `docs/sessions/` and `docs/tasks/`, so this was never permanent visible
noise — it was a latent block on the next Mentor session that legitimately
amended that note, on a line it did not write.

The fix is not a repointing, because there is no successor: D1 records the
*deletion* of the chat setup workflow, so the path it named must correctly
resolve to nothing. `harness/workflows/setup-chat.md` became `setup-chat.md` —
a backticked name with no separator falls outside `PATH_REFERENCE` by
construction, and the guard already declares that category ("a bare filename in
prose is a name, not a reference"). The filename survives for anyone searching
why the file vanished; only the false path claim is gone.

The general question is left open rather than answered by invention: a note that
records a deletion is a **third kind of correct absence**, alongside the
gitignored and out-of-repo cases the guard already exempts. No convention was
created for it. One note needed one word removed; inventing a marker nobody
knows would have been the worse trade (A3).

**2 — `fix/start-credential-guard`: pushed, PR #129 open.** Verified identical
to `b9804fe` first (`git range-diff` reports `=`), then green on its own branch,
then pushed. The PR is the owner's to merge.

It carries one honest finding. `run-start.test.ts` goes 450 → 560 lines against
R5's 400-line budget — and it was *already* over on `main`, as is
`gateway.test.ts` at 476. The exception that legitimizes an over-budget test
measured against its 1:1 subject is **E6**, which was written on this
experimental branch and has not reached `main`; on `main`, `E6` exists only as
the next free number reserved by the v1-freeze note. **The PR is correct under a
rule `main` cannot see.** Two ways out were put to the owner, who **ruled to
accept the finding in #129** rather than land E6 on `main` ahead of the rest of
the redesign. The finding stays recorded in the PR body, and the redesign PR
covers E6 retroactively when it merges. Recorded so it is not reopened from zero.

**3 — the branch model: deferred, deliberately.** It stays undocumented until
the redesign closes; documenting a temporary model before knowing whether it
survives records something that may not. The risk the previous recap named is
unchanged and still real: a session reading only `GIT_WORKFLOW.md` gets this
wrong, because that document says the opposite.

## Local state

- The old worktree `.claude/worktrees/exploracao-branch-especial-437e38` was
  **removed** on the owner's call, once the branch had moved out of it and it was
  a stale detached checkout. `git worktree remove` took it without `--force`:
  nothing tracked had changed and nothing was untracked but its `node_modules`.
- `claude/exploracao-branch-especial-437e38` and
  `claude/harness-redesign-exploration-24a9a0` are scaffolding branch pointers
  at `main`'s content, with no unique commits. Harmless; not this session's to
  judge.
- `fix/fetch-credential-guard` remains a live worktree from another session.
  Untouched, as before.

## Next-session snippet

> Continue `experiment/harness-redesign`. **Open the session in a worktree that
> already has the branch checked out, or expect every hook to be dead** — see
> `G-HOOK-1` in `docs/GOTCHAS.md` and run its probe before trusting any guard.
> Green: `npx tsc -b && npm test` = 324 package tests + 61 hook tests. The
> branch accumulates: cut sub-branches from it, merge back with `--no-ff`, and
> it reaches `main` only when complete. Do not invoke `brief-validator`,
> `closer`, or `pre-commit-self-audit` — they are tombstones. One thing waits on
> the owner: PR #129, to merge. Nothing else is in flight.
