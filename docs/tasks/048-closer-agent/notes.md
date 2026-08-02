# Notes: 048 — Mid-run owner rulings

Rulings taken during execution, recorded as a file rather than relayed as chat
(`docs/AGENT_PLAYBOOK.md`, "Subagent Pause transport"). Each is byte-exact and
outlives the session.

## Ruling 1 (2026-08-02) — Bundle F1 and F2 into Edit 3

Raised by the executor at Pause 2, after Edit 2 was verified.

### What was found

**F1 — `docs/AGENT_PLAYBOOK.md` counts the roles in three places**, and all
three go false the moment Edit 3a adds the sixth:

- the arrow chain `(Orchestrator → planner → brief-validator → executor)`
- the prose "This chapter defines the five roles"
- the heading "### The five roles", plus the five-row table beneath it

**F2 — the "Related documents" table** in the same file lists `planner.md`,
`brief-validator.md` and `executor.md`, and omits `closer.md`.

### The conflict

Edit 3's verification in `brief.md` requires
`git diff --stat docs/AGENT_PLAYBOOK.md` to show **insertions only**, which
forbids rewriting the three F1 sites. Edit 3 also declares itself as exactly
**two insertions** (3a and 3b), which excludes F2's table row.

### Ruling

**Bundle F1 and F2 into Edit 3.** Both are staleness *caused by this change*,
not adjacent cleanup found in passing: a chapter that counts roles cannot gain
a role without the count going false. Landing the sixth role while leaving the
document saying "five" would merge a playbook that contradicts itself, and
would open a follow-up whose only job is to repair what this PR broke.

The precedent is the standing rule that a new dated record supersedes history
but does not repair a present-tense claim that has gone false. "The five
roles" is not a historical statement; it describes current state, and current
state is what this brief changes.

**Consequence, stated rather than hidden:** the "insertions only" checkbox
cannot be met. The executor reports it as **met-by-ruling**, never as met.
The brief is not amended — it carries APPROVED at commit `9457b8c`, and
amending an approved brief would require re-validation for a constraint the
owner has already ruled on.

**Scope granted to Edit 3, exhaustively:**

1. 3a — the new role paragraph (as specified in `brief.md`)
2. 3b — the one appended sentence in "Recap policy" (as specified)
3. F1 — update the three role-count sites and add the sixth table row
4. F2 — add the `closer.md` row to "Related documents"

Nothing else in `docs/AGENT_PLAYBOOK.md` may change.

### Excluded from the bundle

**F3** — the "Related documents" table describes `brief-validator` as auditing
with "10 mechanical checks"; it has been 11 since C11 was added. This is
pre-existing and unrelated to the closer. Folding it in would put an unrelated
fix inside a commit whose subject names a different change (G-A6, G-R4).
Tracked separately.

## Ruling 2 (2026-08-02) — The closer produces no recap; bundle F4

Raised by the executor at the Pause 3 for commit 4, after Edit 3's four
granted items were staged and green.

### What was found

**F4** — `docs/AGENT_PLAYBOOK.md`, first line of "Recap policy (three
recaps)":

> Three roles produce session recaps; two produce none:

The five-item list beneath it names Mentor, Orchestrator and executor as
producing recaps, and planner and brief-validator as producing none. Adding a
sixth role makes `two produce none` false.

### Why this is not the same class as F1

F1 was arithmetic: five becomes six, no judgment involved. F4 cannot be fixed
by counting, because the count is only knowable once someone decides
**whether the closer produces a recap** — and no brief closed that question.
D5 addressed only the P4 confirmation and the next-session snippet.

Bundling F4 as if it were a count fix would close a doctrine question as a
side effect of a typo repair. So the doctrine decision is taken first, on the
record, and the count follows from it.

### Ruling — the doctrine decision

**The closer produces no session recap.** Its record is the emitted report,
in exactly the sense that the planner's record is the committed brief and the
brief-validator's is the recorded verdict. The playbook's existing criterion
already separates the roles this way: a role produces a recap when its work
leaves no other durable artifact. The closer's work leaves one.

D5 reinforces this from the other direction — it already removed from the
closer the only recap-shaped duty it could have claimed, the next-session
snippet, which stays with the Orchestrator.

### Ruling — the consequence

**Bundle F4 into commit 4.** Two touches, both in the Recap policy section:

1. `Three roles produce session recaps; two produce none:`
   → `Three roles produce session recaps; three produce none:`
2. The `planner` / `brief-validator` bullet gains the closer and its record:
   the committed brief, the recorded verdict and the emitted report.

Nothing else in the section changes. The three recap roles, their per-role
contents lists and the transport sentence stay as they are, and 3b's appended
sentence remains 3b's only change to the transport paragraph.

### The relaxation, stated plainly

`brief.md` "Out of scope" says the Recap policy section keeps its three recap
roles, its per-role contents lists and its existing transport sentence, and
that 3b's append "is the only permitted change to the section". Ruling 2
relaxes that last clause for the two touches named above, the same way
Ruling 1 relaxed "insertions only".

That clause was tightened earlier in this same session, deliberately, to close
a drift in Edit 3b. Relaxing it now does not make it wrong — it did its job,
which was to prevent an open-ended rewrite of the section. What passes here is
one sentence and one bullet, both direct consequences of the sixth role
existing. `brief.md` is still not amended; it carries APPROVED at `9457b8c`.

## Ruling 3 (2026-08-02) — Bundle F5 into Edit 4

Raised by the executor at the Pause 3 for commit 5.

**F5** — `CLAUDE.md:126` carries the same role chain the playbook did,
`(Orchestrator → planner → brief-validator → executor)`, and it goes false for
the reason F1 already established. Rulings 1 and 2 are both scoped by their
own wording to `docs/AGENT_PLAYBOOK.md`, so neither reaches this file.

**Ruling: bundle it.** Same class as F1 and F4 — falseness caused by this
change adding the thing being counted. The argument is not restated here; see
Ruling 1, "Ruling", and Ruling 2, "Why this is not the same class as F1".

**Grant, exhaustive:** one touch, `CLAUDE.md:126`, appending `→ closer` to the
chain. This is in addition to the single line Edit 4 already grants at
`CLAUDE.md:130`. Nothing else in `CLAUDE.md` changes.

**Consequence:** Edit 4's verification `git diff --stat CLAUDE.md` shows
exactly one line changed becomes **met-by-ruling**, as with Ruling 1's
"insertions only". Commit 5's subject needs no change — both touched lines are
Related Documents entries, so it still reflects its diff (G-R4).

**This closes `CLAUDE.md`.** The executor grepped the file for every mention of
the pipeline roles before raising F5: only lines 126 and 130 carry them, and
lines 131-132 name individual roles in statements that stay true. There is no
third site.

**Not granted — the three agent self-descriptions.** `.claude/agents/planner.md`,
`brief-validator.md` and `executor.md` each describe themselves as part of "the
linear pipeline (planner → brief-validator → executor)". These stay. That
phrase describes the pipeline that produces and validates a brief, and the
closer is not in it — it acts after execution, on the assembled diff. The
statements are not false, and `brief.md` "Out of scope" forbids editing those
three files outright.

## Brief defect noted for the recap

**Absolute line-count verifications do not survive a change that adds a member
to an enumerated set.** Three of this task's rulings exist only because the
brief phrased its checks as fixed counts:

- Edit 3 — `git diff --stat` shows *insertions only* (relaxed by Ruling 1)
- Edit 4 — `git diff --stat CLAUDE.md` shows *exactly one line changed*
  (relaxed by Ruling 3)

Adding a sixth role to documents that enumerate roles necessarily rewrites the
enumerations. Every place that counts the roles breaks by construction, so a
check demanding pure insertion, or a fixed number of touched lines, was
unsatisfiable the moment it was written. F1, F4 and F5 were all the same
failure surfacing in three files.

The defect is in the brief's verification design, not in the executor's
reading of it — the executor stopped at each one rather than quietly widening
scope, which is the behavior the checks were meant to produce even though the
checks themselves were wrong.

**The fix for future briefs:** when a change adds a member to an enumerated
set, scope the verification by *region and intent* ("only the role-count sites
and the table row change") rather than by line arithmetic, and grep the
enumeration sites during brief authoring so the grant is exhaustive up front
instead of arriving as three mid-run rulings.

## Deviation from the approved commit sequence

`brief.md` declares four commits. The run produced **six**, and one of the four
was amended. Recorded here as declared deviations:

1. This file is committed at all — it is not in the brief's sequence.
2. Ruling 2 was written after that commit had landed, so the commit was
   amended rather than followed by another. Its subject changed from
   `docs(tasks): document the F1/F2 scope ruling for 048` to
   `docs(tasks): document the mid-run scope rulings for 048`, because the
   commit then carried two rulings and the old subject no longer reflected its
   diff (G-R4).
3. Ruling 3 was written after that amended commit was two deep in the branch,
   so it takes a commit of its own rather than a second amend — rewriting a
   commit that is no longer `HEAD` costs more than it buys, and the branch is
   squash-merged anyway.
