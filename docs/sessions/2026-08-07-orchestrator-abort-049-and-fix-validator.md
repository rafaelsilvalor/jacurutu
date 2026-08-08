# Session recap — 2026-08-07 — abort-049-and-fix-validator (Orchestrator)

**Mode:** task modeling via **caminho B**, then direct execution by owner
instruction. planner NOT invoked; brief-validator NOT invoked (the brief
rewrites the validator); executor NOT invoked either — the owner ruled
"escreve direto", so the Orchestrator authored the brief and ran the Edits
itself.
**Consumes:** `main@3e829a0` — PR #124 (task 052, the identifier cutover).
Merge confirmed by `gh pr view` and `git log --oneline origin/main` before
the branch was cut.
**Pairs with:** nothing. There is no executor recap for this task, because no
executor ran. The execution log is in this file, below the decisions, rather
than in a second one.

This is the first recap named under the convention 052 shipped: session date,
role, slug, no task number. The two recaps earlier in this same session kept
`052-` because E8 binds a pre-cutover task's identity for life. Both shapes
sit in `docs/sessions/` dated the same day, which is the cutover made visible.

## One-line summary

The first task born dated — `docs/tasks/2026-08-07-abort-049-and-fix-validator/`
— aborted task 049 as a preserved record, closed the E9 dual-acceptance window
049 alone was keeping open, defined the abort procedure E4 had only declared,
and repaired the validator's dead C7 extraction so three of eleven checks stop
reporting PASS without running.

## P4 — the first live run of the four-source check

Run before choosing the slug, against `origin/main@3e829a0`:

1. `ls docs/tasks/` — the only hit for the candidate terms was
   `task-identifier-cutover`, 052's own slug, matched on the word "cutover".
2. `git log --oneline main` — nothing.
3. `grep -rn '<slug>' CLAUDE.md docs/` — nothing.
4. `git branch -a` + `git worktree list` — no branch or worktree held it; a
   fourth worktree (`sharp-elgamal-2f9c49`) had appeared since the last check,
   holding a `claude/*` branch with no commits.

Sources agreed. That source-1 hit is worth keeping: it was not a collision,
but it retired the candidate `validator-cutover-close`, because "cutover" has
become a loaded word in this repo pointing at 052. The check earned its keep
on the first run, in a way the numeric protocol never could have.

Slug: `abort-049-and-fix-validator`, 27 chars.

## Decisions closed with the owner

1. **Discard 049 rather than execute it.** Its content — `harness/init/` on
   the six-role model, and bootstrap generating `.claude/` machinery — is
   still a real gap. The owner chose not to pay it now. The gap survives the
   abort and is recorded in the preserved brief.
2. **Discarding means preserving, not deleting.** E4 says an aborted task
   becomes a preserved folder with an `ABORTED` marker. 049's folder had never
   been on `main`, so the abort meant bringing it *to* `main`. Deleting the
   branch would have destroyed the record E4 exists to keep.
3. **The awk repair rides in the same dated task** rather than shipping as the
   Category S the owner first proposed. Both land in
   `.claude/agents/brief-validator.md`; separating them means two passes over
   one file for one reviewer.
4. **C1 drops the numeric shape outright**, confirmed before authoring because
   it is irreversible without another commit: after it, `# Brief: 053 — …` is
   rejected.
5. **Re-auditing merged briefs against the repaired checks is out of scope**
   and stays out. The repair protects forward; looking backward is a separate
   decision with its own cost.

## The five authoring defects

All mine. Four are in the brief I wrote and were caught before or during
execution. The fifth is in the artifact that shipped, was caught by nothing I
ran, and is described in its own section below because it is a different kind
of mistake.

1. **Edit 3 omitted the count line.** It prescribed a new table row and a
   fourth naming fact without the sentence introducing them as three. Shipping
   it as written would have reproduced the exact defect brief 050 left in
   `AGENT_PLAYBOOK.md`'s "Recap policy (three recaps)" and 052 fixed as errata.
2. **Edit 2 undercounted its own block** — 253 + 7 where it is 253 + 8, missing
   the blank line separating the block from the frontmatter.
3. **Edit 3's specification did not describe what shipped.** The deviation was
   recorded in commit #3's body, but the brief is the contract, so a reader
   comparing brief to diff would find an unexplained change.
4. **Edit 4b's prose carried the literal `[0-9]{3}` token** while the same
   Edit's checkbox demanded zero occurrences of it — the third instance this
   day of writing a checkbox against an Edit's *theme* while the prose beside
   it creates the exception.

Defect 4 is the one worth keeping, because it is the first time the fix was
better than the workaround. In 052 the same collision twice produced carved
exceptions — a checkbox reworded to admit the survivor. Here it produced a
rewrite: the sentence says "the three-digit alternative was removed" instead
of quoting the pattern, so the sweep stays clean and there is no exception to
carve. That technique came from the executor's `close-task.md` carve-out in
the 052 run, which I praised at the time and then failed to apply for two more
instances.

The generative error behind all four, and behind the `close` verb I handed the
executor earlier in the day, is one thing: **writing against remembered
context instead of against the file.**

## Defect 5 — the one my own checks could not catch

Six commits in, with the task declared executed and the recap written, the
closer's Phase A returned a **trava**. The C7 repair had left C8 and C11
broken in a worse state than it found them.

Briefs write each Commit sequence line as `` 1. `type(scope): subject` ``. The
repaired C7 stripped the numeric prefix and nothing else, so what reached C8
and C11 still began with a backtick, and the `^` anchors in both could never
match. Before the repair the two checks passed vacuously over an empty set;
after it they failed on every valid brief in the repository — measured, 7 of 7
subjects in 052 and 4 of 4 in this task's own brief. The next brief through the
pipeline would have been REJECTED for nothing.

Why nothing I ran caught it: **my verification used a different pipeline than
the one I shipped.** The ad-hoc command I tested with carried `s/\`//g`; the
validator I wrote did not. Every check I ran passed, and every one of them
tested an artifact that does not exist. This is not the same class as defects
1 through 4 — those were checkboxes written against an Edit's theme while the
prose beside them created an exception, which careful reading catches. This one
survives careful reading, because the thing read and the thing shipped were
different objects.

The correction is commit `a67bd6b`: C7 strips backticks, and its heading
pattern is anchored at both ends so it stops matching the
`### Commit sequence heading` subsection that `brief-template/SKILL.md` defines
and that briefs quote. After it, C8 passes on every subject of all 41 briefs
carrying the section.

Two findings rode in on the correction. C11, now discriminating, surfaces 20
out-of-allowlist verbs across briefs 000 to 016 — `record`, `adopt`, `align`,
`refine`, `translate`, `introduce`, `route` — all predating the allowlist and
all in merged briefs that are never re-validated. And C7's length rule now
trips six merged briefs, five with genuinely long subjects and one (050) whose
Commit sequence line carries an annotation after the subject rather than the
subject alone.

The lesson is not about backticks. It is that **an agent auditing its own work
converges on its own blind spot**, and the only thing that broke the loop was a
role with a separate context reading the artifact rather than the intent. Six
gates, thirty-five self-audit checks and a written recap all passed over this.

## What the repaired check caught, immediately

C7's extraction was repaired in this task, and the repair paid for itself
before commit #1. Running C11 with the working extraction against this brief's
own Commit sequence surfaced that commit 2's proposed verb `preserve` is in
neither the allowlist nor the denylist. It was replaced with `add` before
anything was committed.

A second finding rode along: the brief's `Commit sequence` heading was H2 where
C7 anchors on H3, so even the repaired extraction returned zero. Both were
fixed at authoring.

Measured across four real briefs, repaired versus dead:

```
2026-08-07-abort-049-and-fix-validator   4  vs  0
052-task-identifier-cutover              7  vs  0
051-parking-pending-migration            7  vs  0
048-closer-agent                         4  vs  0
```

Every brief this repo has ever validated was validated with C7, C8 and C11
inert.

## Run facts

- Branch `docs/abort-049-and-fix-validator` from `3e829a0`; 8 commits
  (`8983bd4`, `a92a6eb`, `1a0b416`, `ada36e9`, `ad2913c`, `e2a0c5f`,
  `a67bd6b`, plus this recap update); 5 files, +782 −9 as of `a67bd6b` —
  this file cannot count its own commit, the same self-reference that stops a
  recap citing its own merge SHA.
- The four task files match the brief's in-scope list exactly. The fifth,
  this recap under `docs/sessions/`, is **outside** it: the brief's
  non-negotiable constraint 1 enumerated four paths and omitted the recap,
  even though every task produces one and doctrine puts it on the session
  branch (`docs/AGENT_PLAYBOOK.md` "Recap policy"). The scope list was wrong,
  not the recap's location — worth fixing in the brief template's guidance
  rather than in this brief.
- Green boundary before every commit: `npx tsc -b` clean, `npm test` at
  305 tests / 304 pass / 0 fail / 1 skipped, unchanged throughout.
- Every commit message verified byte-for-byte against its approved file after
  committing. Zero drift, zero amends.
- Pause 1 skipped (`Plan required: no`; a numbered plan was approved in
  session first). Pause 2 after Edit 2. Pause 3 before all five commits.
- The branch was created with `git switch -c … origin/main`, which set its
  upstream to `origin/main`. That was unset immediately: in a repo where
  `main` only enters by PR, a new branch tracking `main` is one distracted
  `git push` from an accident.
- No push; `git reflog | grep -c push` returns 0.

## Two environment facts worth carrying forward

**Local `main` is stale.** The main checkout at `D:\Projects\saci` sits at
`9d5e1f3` while `origin/main` is at `3e829a0`. Measuring with `main...HEAD`
reported 24 files and +1891 for this branch, silently folding 052 in; the true
figure comes from `origin/main...HEAD`. Same family as G-NODE-2 — the
environment making a measurement look like something else.

**Pre-merge tip of the 052 branch is `a5754e2`.** Its tree is byte-identical
to the squash commit `3e829a0`, so deleting the branch discards granularity
and no state. The delete needs `-D`, not `-d`, because the squash broke
ancestry.

## Open queue after this session

1. **Push + PR for `docs/abort-049-and-fix-validator`** — owner instruction
   pending. `@closer` Phase A has not run for this branch.
2. **`git -C D:/Projects/saci pull --ff-only`**, then delete the two merged
   local branches (`docs/task-identifier-cutover` needs `-D`).
3. **`harness/init/` is still on the three-role model** and still generates no
   `.claude/` machinery. 049 was aborted, not solved; the gap is now recorded
   in a preserved folder rather than a parked branch.
4. **Re-auditing merged briefs against the repaired C7/C8/C11** — deliberately
   out of scope here. Now cheap to do, since the checks work.
5. **`close` in the `ALLOW=` SSOT** — the executor argued it names a workflow
   act `fix` does not carry. Changes a file two consumers read at runtime, so
   it needs its own decision.
