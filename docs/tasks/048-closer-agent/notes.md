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

## Brief defect noted for the recap

The brief specified "insertions only" as an absolute verification for Edit 3.
That was never satisfiable: adding a sixth role to a chapter that enumerates
roles necessarily rewrites the enumeration. The defect is in the brief's
verification design, not in the executor's reading of it.

## Deviation from the approved commit sequence

This file is committed as an extra commit not present in the four-commit
sequence in `brief.md` — five commits instead of four. Recorded here as a
declared deviation.

Ruling 2 was added to this file after that commit had already landed, so the
commit was amended rather than followed by a sixth. Both rulings therefore
travel in one commit, which keeps the sequence at five.
