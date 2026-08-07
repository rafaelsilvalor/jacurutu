# Notes — 052 task-identifier-cutover

Owner rulings issued mid-run (Orchestrator session, 2026-08-07). Numbered in
issue order; the executor consumes these as brief-level decisions.

## Ruling 1 — Edit 3d: the closer runs four sources and scans for duplicates

The executor STOPped before writing Edit 3d, having found that the brief
contradicts itself there. The finding is correct and the defect is the
brief's.

**What is wrong.** `closer.md`'s existing post-merge block runs three
commands: `ls docs/tasks/`, `git log --oneline origin/main | head -20`, and
`grep -nE '^\*\*E[0-9]+' CLAUDE.md`. Edit 3d prescribes replacing that block
with `ls docs/tasks/`, `git log --oneline origin/main | head -20`, and
`git branch -a && git worktree list` — dropping the reserve grep instead of
adding to it — while retitling the prose "four-source slug check (P4)". That
is three sources wearing a four-source label. The brief's own Behavior check
forbids exactly this outcome: "If the closer runs three sources while the
planner runs four, the cutover ships inconsistent."

**Second, deeper problem.** The closer runs *after* the merge, with no
candidate slug in hand. "Verify the slug is free" is not an operation it can
perform — free for what? The planner and the closer consult the same four
surfaces but ask different questions: the planner asks whether candidate slug
X is available; the closer asks whether anything collided.

**Ruling: option A′.** Two changes to what Edit 3d prescribes.

First, the block keeps the reserve grep and gains the branch/worktree line,
so four commands answer to four sources:

```bash
ls docs/tasks/
git log --oneline origin/main | head -20
grep -nE '^\*\*E[0-9]+' CLAUDE.md
git branch -a && git worktree list
```

Second, the prose says what the closer is actually doing. Retitle duty 2 from
"The three-source slot check (P4)" to a four-source **duplicate-slug** scan,
and word the duty so it reports whether any slug appears more than once
across the four surfaces — not so it verifies a candidate. Source 3 for the
closer is the reserve grep it already had, not the per-slug grep that
planner step 2 runs; that asymmetry is intended and follows from the closer
having no candidate.

Everything else in 3d is unchanged, including the merge-SHA duty.

**Why this is a ruling and not errata.** It changes what ships. Edit 7's
errata commit is only for findings that change nothing that ships.

## Ruling 2 — Edit 3c's "five sites" is a miscount; six is right

Edit 3c's prose says "Five `<NNN>` sites" and then enumerates six:
`description`, the Inputs delegation string, reading-order item 5, and the
three `chore(state):` subjects (`start`, `update`, `remove after`). The
brief's own migration-surface table records 6 hits for
`.claude/agents/executor.md`, so the table and the prose contradict each
other and the table is right.

**Ruling: six is correct, all six are changed, and the word "five" is
errata.** It changes nothing that ships — the enumeration that follows it was
always complete — so it goes into Edit 7's batched errata commit rather than
interrupting Edit 3. Recorded here so the count is not re-litigated when Edit
7 comes around.
