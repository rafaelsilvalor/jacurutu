# Session recap — 2026-08-14 — python-lab-of-record (Orchestrator)

**Mode:** Orchestrator, opened on a scoped task-modeling request with the
laboratory-of-record ruling already closed and marked non-relitigable. Three
questions to close, then caminho B. The same session executed the brief it
wrote; the executor half is recorded separately.
**Consumes:** `4652d2a` — head of `main` when the session opened, and the
verified base of the branch. Confirms the merge of PR #143.
**Branch:** `docs/python-lab-of-record`, cut from `4652d2a`. Four commits, plus
these recaps.
**Produced:** `docs/tasks/2026-08-14-python-lab-of-record/brief.md` and its
`notes.md`, the corrections in `CLAUDE.md`, `docs/ROADMAP.md`,
`docs/MENTOR_BRIEF.md` and `docs/explorations/python-laboratory-lane.md`, and
these recaps.
**Pairs with:** `docs/sessions/2026-08-14-executor-python-lab-of-record.md`.

## One-line summary

The doctrine now names `buraqueira` as the Python laboratory and `automation/`
as a frozen snapshot — and the modeling found the falsehood had three authority
sites rather than the two the ruling named, plus a second falsehood class
nobody had counted.

## What the measurement found before the brief was written

The session opened naming two false lines. Both were real. Neither was the
whole set.

1. **A third authority site.** `docs/ROADMAP.md:140` repeats the claim
   verbatim — "`automation/` was declared a permanent laboratory on 2026-08-08
   and stays one" — inside the dated 2026-08-13 art-arm entry. It was invisible
   to a search of `CLAUDE.md` alone.
2. **A second, distinct falsehood class.** Five sites have `automation/`
   *operating*, *retiring*, or being *archived*. A snapshot frozen for 69 days
   does none of those; the subject of those sentences is the legacy Python
   coordination pipeline. This class had never been named.
3. **The snapshot is literally a snapshot.** One commit (`8fada81`,
   2026-06-06), never touched: 15 files, 3,490 lines, no `tests/`. Against
   `buraqueira`'s 7,999 root lines, 4,656 in `tests/`, 2,712 in `scripts/`, and
   an entire chainable verb layer (`core.py`, `flow.py`, `adapter_*.py`,
   `map_parent.py`) that `automation/` does not contain at all. The ruling is
   the only reading the disk supports.
4. **The exploration note was already right.** Its bucket split sums to 12,532
   exactly, and `automation/` at 3,490 lines total cannot hold the note's 3,750
   lines of pytest. It measured `buraqueira` and said so on its `Origin:` line.
   What it lacked was the repo's name in its body, where it said only "The
   Python repo" — so a reader arriving from the false `CLAUDE.md` read 12,532 as
   the snapshot's.

## Decisions closed with the owner

| # | Decision |
|---|---|
| Q1 | `automation/` stays in the repo, declared a frozen snapshot. The operational falsehood class comes into scope with it |
| Q2 | The note is disambiguated, not corrected — its measurements were always right |
| Q3 | Category M, caminho B. Doctrinal edit; the planner is not used |
| D2 | `ROADMAP.md:140` is corrected despite sitting in a dated entry — it misnamed its subject when written, which is not a decision that aged |
| D3 | The operational sites name "the legacy Python coordination pipeline", not `buraqueira` — that a pipeline runs from any given checkout was not measured this session |

D2 was the one contestable call and shipped with an explicit fallback (drop
hunk 2c, keep the rest). The owner kept it at the gate.

## The instruments caught four defects the author did not

Recorded because the pattern, not any single defect, is the finding: **not one
was caught by re-reading the finished text.**

| Defect | Caught by |
|---|---|
| Three of four `grep -c` assertions wrong — the replacement text reintroduced tokens the author had not counted | Self-audit, before validation |
| Title line carried the full task id, not the date (C1) | `validate-brief.mjs` |
| Commit-sequence lines carried `(NN chars)` annotations that broke subject parsing (C7) | `validate-brief.mjs` |
| Commit verbs `name` and `retire` on neither list (C11) | `validate-brief.mjs` |
| Commit #1 subject stated as 46 chars; it is 47 | The executor, at Pause 3 |

The verb STOP forced a real semantic choice rather than a convenient one:
`declare` for the doctrine statement (precedent `19bdafc`), `fix` for the Phase
4 prose because a false statement is fixed rather than updated, and `document`
for the note because its subject had never been recorded in its body. The
brief records that reasoning so a future reader does not re-derive it.

## A defect in the brief that shipped

The brief carried a behavior check — "No sentence anywhere in the five files
now claims `automation/` is a laboratory, operates, retires, or is archived" —
whose `operates` half cannot be met without editing `ROADMAP.md:49`, which the
same brief excludes by name. The executor followed the scope rule, left the
line, and reported the contradiction rather than resolving it. That was the
right call; the checkbox was the defective half.

The owner queued `ROADMAP.md:49` as a follow-up, to take a superseding note
beneath the dated entry rather than a rewrite. Recorded in the task's
`notes.md`.

## Process notes

- The `claude/*` worktree branch is scaffolding; the work branch was cut inside
  the session from a verified `origin/main` per the brief's constraint 3.
- Pause 3 for commit #1 ran as a full gate. Commits #2-#4 were pre-authorized
  by the owner on one condition — every `grep -c` returning exactly the stated
  number — which is a conditional release, not a waiver: any deviation was a
  STOP. All four matched.
- Pause 2's material was delivered in the final report as the full
  `git diff CLAUDE.md` rather than mid-run, because a subagent cannot reach the
  owner while executing.
- The brief ran 476 lines against Category M's ~350 ceiling and declared why it
  did not split rather than staying silent: Edit 2's Done criterion is only
  checkable across three files at once, so a per-file PR would close green while
  another file asserted the opposite.

## What this session did not verify

- No `buraqueira` checkout was read during execution. The line counts cited in
  the modeling were measured at session open and not re-verified after.
- `buraqueira`'s `.claude/` (46,101 lines of `.py`) was assumed to be worktrees
  or vendored code and never opened.
- The note's 12,532 figure is stale by growth (~15,367 today) and was
  deliberately left alone — re-measuring means re-running the classification,
  not summing. Queued in `notes.md`.
