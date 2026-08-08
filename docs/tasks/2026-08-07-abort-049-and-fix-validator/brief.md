# Brief: 2026-08-07 — Abort 049, close E9, repair the validator extraction

> **Category:** M
> **Plan required:** no
> **Branch:** `docs/abort-049-and-fix-validator`

---

## Context

This is the first task born under the dated identifier. Brief 052 merged as
PR #124 (`3e829a0`) and E3 anchored the cutover there, so this task takes a
birth date rather than a number. It is also the task that finishes what 052
deliberately left half-open.

Two loose ends, and they are one another's cause. `049-init-six-role-bootstrap`
has sat unmerged on `docs/init-six-role-bootstrap` since 2026-08-04, carrying
one commit and a 253-line brief that was never executed. Because a pre-cutover
task is still alive, E9 keeps validator C1 accepting both identifier shapes.
Abort the task and the window closes; close the window without aborting and
the dual acceptance is live with nothing to serve.

The third change rides along because it lands in the same file. The
validator's C7 extraction is dead: `awk '/^### Commit sequence/,/^### /'` uses
an end pattern that matches its own start line, so the range collapses to the
heading and yields zero commit subjects. C8 and C11 consume C7's output, so
all three checks have been reporting PASS over an empty set. Measured against
this repo's own briefs on 2026-08-07:

```
$ awk '/^### Commit sequence/,/^### /' docs/tasks/052-task-identifier-cutover/brief.md \
    | grep -cE '^[0-9]+\. '
0
$ awk '/^### Commit sequence$/{f=1;next} f&&/^#{2,3} /{exit} f' \
    docs/tasks/052-task-identifier-cutover/brief.md | grep -cE '^[0-9]+\. '
7
```

Seven numbered commit lines present in the section, zero extracted. Every
brief this repo has validated was validated with three of eleven checks inert.

## Goal

Abort task 049 as a preserved record, close the E9 dual-acceptance window it
was keeping open, and repair the validator extraction so C7, C8 and C11 run
against real commit subjects.

Out of scope:

- **Executing 049's actual content.** `harness/init/` stays on the three-role
  model and still generates no `.claude/` machinery. That problem survives the
  abort and is recorded, not solved.
- **Re-auditing merged briefs against the repaired checks.** The repair
  protects forward. Looking backward is a separate decision with its own cost,
  and the owner scoped it out on 2026-08-07.
- **Deleting `docs/init-six-role-bootstrap`.** The branch becomes redundant
  once its brief is preserved here, but branch deletion is the owner's and
  happens from the main checkout.
- **Adding `close` to the commit verb allowlist.** Separate decision, separate
  commit.

## Constraints

### Non-negotiable constraints

1. Only these paths may be created or modified:
   `docs/tasks/2026-08-07-abort-049-and-fix-validator/`,
   `docs/tasks/049-init-six-role-bootstrap/`, `docs/PROCESS_MAP.md`,
   `.claude/agents/brief-validator.md`. Anything else, **STOP and ask**.
2. Follow `CLAUDE.md`, R9 and R10 especially.
3. Follow `docs/GIT_WORKFLOW.md`: branch `docs/abort-049-and-fix-validator`,
   Conventional Commits (G-R3), no co-author trailer (G-A7), commit freely,
   **do not push** (G-R5).
4. No `STATE.md` — single-session task.
5. The 049 brief body is **preserved verbatim**. The `ABORTED` block is
   prepended; not one line of the original is edited, reflowed or corrected.

### Conventions

- English throughout (R9 — `docs/**` and `.claude/**` are agent-consumed).
- Commit type `docs` for all four commits.

### Architectural decisions already made (do not revisit)

#### D1 — The abort preserves, it does not delete

E4 says an aborted task becomes a preserved folder carrying an `ABORTED`
marker and its reason. 049's folder has never existed on `main`, so the abort
means bringing it *to* `main` with the marker. Deleting the branch instead
would destroy exactly the record E4 exists to keep.

#### D2 — The marker's form is defined here, once

No file defines what an `ABORTED` marker looks like — E4 states the outcome
and nothing states the procedure. This task defines it in `docs/PROCESS_MAP.md`
§7 alongside the other artifact-naming facts, and 049 is its first instance.
The definition lives in one place; nothing restates it.

#### D3 — C1 drops the numeric alternative outright

With 049 aborted no pre-cutover task is alive, so E9's condition is met.
C1 accepts only `[0-9]{4}-[0-9]{2}-[0-9]{2}`. This is deliberate and
irreversible without another commit: after it, `# Brief: 053 — ...` is
rejected. Confirmed with the owner on 2026-08-07 before authoring.

Merged briefs keep their numeric folders and are never re-validated, so
nothing historical breaks. C1 audits a brief in flight, and every brief in
flight from here is dated.

#### D4 — The E9 paragraph is rewritten, not deleted

Nothing is deleted (D10 of the note's own contract). The paragraph explaining
why C1 accepted both shapes becomes a dated record that the window opened on
2026-08-03, was kept open by 049 alone, and closed on 2026-08-07 when 049 was
aborted.

#### D5 — The awk fix rides in the validator commit

C7's repair and the C1/E9 change land in `.claude/agents/brief-validator.md`
together. Splitting them means two passes over one file for one reviewer, and
the fix is verified by the same run that verifies C1.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

- [ ] `git branch --show-current` is `docs/abort-049-and-fix-validator`
- [ ] Branch has no upstream (`git branch -vv` shows no `[origin/...]`) —
      it was created from `origin/main` and the tracking was unset, so a bare
      `git push` has no default target
- [ ] `docs/tasks/2026-08-07-abort-049-and-fix-validator/brief.md` exists;
      first line matches the title above
- [ ] Commit #1 subject:
      `docs(tasks): add brief for 2026-08-07-abort-049-and-fix-validator`

### Edit 2 — Preserve 049 as an aborted task

Bring the folder across without editing its content:

```bash
git checkout docs/init-six-role-bootstrap -- docs/tasks/049-init-six-role-bootstrap/
```

Prepend an `ABORTED` block immediately after the brief's title line, before
the `> **Category:**` frontmatter, in this shape:

```markdown
> **ABORTED — 2026-08-07.** Never executed. Aborted by the owner rather than
> deprioritised: `harness/init/` remains on the three-role model and still
> generates no `.claude/` machinery, and that problem is real, but the owner
> chose not to pay it now. The task was also the last pre-cutover task alive,
> so aborting it closed E9's dual-acceptance window
> (`docs/tasks/2026-08-07-abort-049-and-fix-validator/`). The brief below is
> preserved verbatim as the record of what was planned.
```

Verification:

- [ ] `git diff --stat` shows `docs/tasks/049-init-six-role-bootstrap/brief.md`
      added with 253 + 8 lines — seven of prose plus the blank line separating
      the block from the frontmatter — for 261, and no other file
- [ ] `grep -c '^> \*\*ABORTED' docs/tasks/049-init-six-role-bootstrap/brief.md`
      returns 1
- [ ] The original body is untouched: diffing the file against
      `docs/init-six-role-bootstrap:docs/tasks/049-init-six-role-bootstrap/brief.md`
      shows only the inserted block

Commit: see Commit sequence #2.

### Edit 3 — Define the abort procedure in `docs/PROCESS_MAP.md`

In §7's artifact table, add one row after `Task notes`:

```markdown
| Aborted task | `docs/tasks/<task-id>-<slug>/brief.md`, `ABORTED` block after line 1 | the block is dated, states the reason, and preserves the brief body verbatim; the folder is never deleted (E4) |
```

Then change the line introducing the naming facts from `Three naming facts
worth internalizing:` to `Four`, and add a fourth fact below the existing
three. The count line was missing from this Edit's first draft; adding a
fourth item to a list introduced as three would have shipped a heading
disagreeing with its own enumeration, which is the defect brief 050 left in
`AGENT_PLAYBOOK.md`'s "Recap policy (three recaps)" and 052 fixed as errata.

```markdown
- **An aborted task is preserved, not erased.** Its folder lands on `main`
  with a dated `ABORTED` block after the title and its body untouched. There
  is no sequence left to puncture, so there is no burn to record — the folder
  itself is the record. First instance:
  `docs/tasks/049-init-six-role-bootstrap/`.
```

Verification:

- [ ] `grep -c 'Aborted task' docs/PROCESS_MAP.md` returns 1
- [ ] `grep -c 'aborted task is preserved' docs/PROCESS_MAP.md` returns 1
- [ ] The three existing naming facts are unchanged:
      `grep -c '^- \*\*' docs/PROCESS_MAP.md` is one higher than before
- [ ] The stated count matches the enumeration: the section says `Four` and
      four bullets follow it
- [ ] No other section of the file is touched

Commit: see Commit sequence #3.

### Edit 4 — Close E9 and repair the extraction

**4a — C1 drops the numeric alternative.** Line 71's pattern becomes:

```
grep -nE '^# Brief: [0-9]{4}-[0-9]{2}-[0-9]{2} — .+$' <brief> | head -1
```

**4b — the E9 paragraph becomes a dated record.** Replace it with:

```markdown
C1 accepted both identifier shapes between 2026-08-03 and 2026-08-07. Brief
052 cut new tasks over to a dated `<task-id>` while E9 kept the numeric shape
valid for any pre-cutover task still alive. Exactly one was —
`049-init-six-role-bootstrap` — and it was aborted on 2026-08-07, so the
window closed and the `[0-9]{3}` alternative was removed. Merged briefs keep
their numeric folders; C1 audits a brief in flight, and every brief in flight
from here is dated.
```

**4c — repair C7's extraction.** The range's end pattern matches its own start
line. Replace the extraction in C7's row with:

```
awk '/^### Commit sequence/{f=1;next} f&&/^#{2,3} /{exit} f' <brief> | grep -E '^[0-9]+\. ' | sed -E 's/^[0-9]+\. //'
```

C8 and C11 consume C7's output and need no edit; they start working because
their input stops being empty.

Verification — run against real briefs and paste the output, do not assert:

- [ ] The repaired extraction returns 7 subjects from
      `docs/tasks/052-task-identifier-cutover/brief.md`, not 0 — 7 is the
      count inside the `### Commit sequence` section; a whole-file grep for
      numbered lines returns 11 and is the wrong measurement
- [ ] It returns a non-zero count for at least two other merged briefs
- [ ] Every extracted subject from 052 is ≤ 72 chars (C7 would now pass it)
- [ ] Every extracted verb is in the `ALLOW=` SSOT (C11 would now pass it)
- [ ] C1's new pattern matches `# Brief: 2026-08-07 — Abort 049, close E9,
      repair the validator extraction` and **rejects** `# Brief: 053 — x`
- [ ] `grep -c '0-9]{3}' .claude/agents/brief-validator.md` returns 0

Commit: see Commit sequence #4.

### Automated checks (run before each commit)

- [ ] `npx tsc -b` passes — unconditional, no docs-only exemption
- [ ] `npm test` passes — this worktree may not have `core.hooksPath` wired,
      so the G-R8 pre-commit hook may never fire

Baseline at authoring: `tsc -b` clean, 305 tests / 304 pass / 0 fail /
1 skipped.

### Structural checks

- [ ] Every modified file is in the Non-negotiable constraint list
- [ ] `git diff --name-only origin/main...HEAD` returns exactly four paths
- [ ] The 049 brief body differs from its source only by the `ABORTED` block

### Behavior checks

- [ ] A dated brief passes C1 and a numeric one fails it — both run, both
      pasted
- [ ] C7 extracts subjects from every brief tested, and the count matches the
      brief's own numbered commit lines

### Git checks

- [ ] Branch `docs/abort-049-and-fix-validator`, never `claude/*`
- [ ] Conventional Commits, subjects ≤ 72 chars via `printf '%s' "<s>" | wc -L`
- [ ] Commit verbs in the `ALLOW=` SSOT — neither `abort` nor `preserve` is in
      it, which the repaired C7 extraction caught during authoring; check
      before prescribing and substitute if absent
- [ ] The `### Commit sequence` heading is H3, the canonical level C7 anchors
      on — an H2 makes the extraction return nothing and C7 FAIL on a
      non-canonical heading
- [ ] No co-author trailer (G-A7)
- [ ] `git log -1 --format=%B` matches the approved message after each commit
- [ ] **NO** `git push`

### Process checks

- [ ] Pause 1 skipped (`Plan required: no`; the owner approved a numbered plan
      in session before authoring)
- [ ] Pause 2 after Edit 2, the first fully changed file
- [ ] Pause 3 before every commit
- [ ] Any criterion not met was reported explicitly

### Commit sequence

1. `docs(tasks): add brief for 2026-08-07-abort-049-and-fix-validator`
2. `docs(tasks): add 049 as an aborted task`
3. `docs: document how an aborted task is recorded`
4. `docs(agents): remove dual acceptance and fix the C7 extraction`

Measure each with `printf '%s' "<subject>" | wc -L` rather than trusting this
list. All four verbs were checked against the `ALLOW=` SSOT during authoring
with the repaired C7 extraction, which is how commit 2's first draft — the
verb `preserve` — was caught: it is in neither the allowlist nor the denylist.
`add` replaced it because the folder is genuinely new on `main`, and the
`ABORTED` state is content the body carries rather than the action the commit
performs.

## Pause points

- **Pause 1 — skipped.** `Plan required: no`. A numbered plan was presented
  and approved in session on 2026-08-07 before this brief was written.
- **Pause 2 — required.** After Edit 2.
- **Pause 3 — required before every commit.** `git status`, `git diff --stat`,
  the proposed message, `pre-commit-self-audit` output, and both
  green-boundary results in one fenced block.

An assertion does not close Pause 3. The pasted output of
`git log --format=%B -1` does.

## Plan required justification

- Every change is specified above with its exact target and replacement text.
- All decisions are closed: D1-D5.
- The one irreversible change (D3) was confirmed with the owner before
  authoring.
- The remaining judgment calls are verb choices, which have a STOP at Check 3.

## Reference documents (read before starting)

1. `CLAUDE.md` — R9, R10
2. `docs/PROCESS_MAP.md` §7
3. `docs/GIT_WORKFLOW.md`
4. `docs/explorations/mentor-lane-and-task-identity.md` — E4, E9
5. `.claude/skills/pre-commit-self-audit/SKILL.md`

## Expected output (end of session)

1. Branch name and `git log --oneline main..HEAD`
2. `git diff --stat origin/main...HEAD`
3. Any verification checkbox not met, with the reason
4. Confirmation that no `git push` was executed
