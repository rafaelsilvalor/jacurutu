# Notes — 2026-08-14-python-lab-of-record

## Queued follow-up — `docs/ROADMAP.md:49`

**Owner ruling, 2026-08-14, at the close of this task:** queue it; do not
rewrite the dated entry.

The line reads, inside the dated `### 2026-05-15` identity-shift entry:

> The Python `automation/` codebase (Jira → Google Sheets sync) — which already
> implemented hexagonal architecture intuitively — is the seed of v2's core.
> **Until v2's coordination adapters land (Phase 4), the Python automation
> continues to operate** as the live coordination pipeline.

It is the last surviving sentence of the falsehood class this task removed
everywhere else. Its first half is true and stays. Its second half is a bold,
present-tense claim that a folder frozen since `8fada81` (2026-06-06) is a live
pipeline.

**The shape the owner chose:** a superseding note placed *beneath* the dated
entry, not an edit to the entry's own prose. The 2026-05-15 record keeps saying
what it said; the note records that the operating claim was overtaken — by
Phase 4's prose, corrected in `c4a3918`, and by the laboratory-of-record ruling.

**Why it was not done here.** This brief excluded `ROADMAP.md:49` by name in
its Out-of-scope section, on the ground that a dated entry is the historical
record. Editing it under a brief that forbids it would have been the executor
overriding its own scope rule.

**A defect in this brief, recorded rather than hidden.** The brief also carried
a behavior check reading "No sentence anywhere in the five files now claims
`automation/` is a laboratory, operates, retires, or is archived." That checkbox
and the Out-of-scope rule contradict each other: the `operates` half cannot be
met without editing the line the brief forbids. The executor followed the scope
rule and reported the contradiction instead of resolving it, which was correct.
The checkbox was the defective half. A future brief should not restate a
behavior check whose scope is narrower than the sentence describing it.

## Open, from this task's measurement

- The note's 12,532-line figure for `buraqueira` was measured 2026-08-08 and has
  grown since — root + `tests/` + `scripts/` measured ~15,367 on 2026-08-14.
  Re-measuring means re-running the five-bucket classification, not summing.
  Deliberately untouched here (constraint 5).
- `buraqueira`'s `.claude/` holds 46,101 lines of `.py`, assumed to be worktrees
  or vendored code and not opened. If any of it is laboratory code, every size
  comparison in this task understates the lab.
- The `grep -c` verifications in this brief count *lines*, not occurrences. They
  were cross-checked site by site with `grep -n`, but a future brief wanting an
  occurrence count must say so explicitly.
