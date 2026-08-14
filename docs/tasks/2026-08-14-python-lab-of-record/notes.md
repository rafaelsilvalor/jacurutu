# Notes — 2026-08-14-python-lab-of-record

## Closed follow-up — `docs/ROADMAP.md:49`

**Closed 2026-08-14 by #145 (`33b970b`).** The superseding note the owner
specified is in place, as a blockquote beneath the dated entry, at
`docs/ROADMAP.md:58`. The citation in this heading still resolves: #145 added its
13 lines *below* line 49, and #146 (`b63cbf6`) left both positions unchanged, so
line 49 is still the sentence this entry names. The closure was recorded in
#145's recap (`docs/sessions/2026-08-14-orchestrator-roadmap-operating-claim.md`)
and is recorded here now.

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

- **Closed 2026-08-14 — the classification was rebuilt and the figure replaced.**
  The note's 12,532-line figure for `buraqueira` was measured 2026-08-08 and has
  grown since — root + `tests/` + `scripts/` measured 15,367 on 2026-08-14
  (exactly, not the `~15,367` first recorded here). Re-measuring meant re-running
  the five-bucket classification, not summing, and it initially failed: two of the
  five buckets named no files, so the figure was dated in place with a freshness
  note instead. Both were recovered afterwards by reconstruction against
  `27ca450`, the tree the 2026-08-08 figures were taken from — the four named
  buckets reproduce to the unit and serve as an oracle, and exactly one subset of
  the residual sums to the recorded 367. The rule is now written into the note as
  file sets, and the portable surface is **7,251** — 5,796 of it under the
  2026-08-08 doctrine plus 1,451 from the owner's 2026-08-14 ruling that the
  Sheets code ports (`docs/explorations/python-laboratory-lane.md`).
- **Resolved 2026-08-14 — it was never in the denominator.** `buraqueira`'s
  `.claude/` holds 46,101 lines of `.py`, assumed here to be worktrees or vendored
  code and not opened. It is untracked, so the question is moot:
  `git ls-files '*.py'` returns 47 files totalling 15,367 lines across root,
  `tests/` and `scripts/` only. No size comparison in this task understated the
  lab.
- The `grep -c` verifications in this brief count *lines*, not occurrences. They
  were cross-checked site by site with `grep -n`, but a future brief wanting an
  occurrence count must say so explicitly.
