# Session recap — 2026-08-14 — stale-followup-and-lab-figure (Orchestrator)

**Mode:** Orchestrator, opened at the close of `2026-08-14-stale-present-tense-claims`
(PR #146). Two low-priority items that three consecutive sessions had deferred by
explicit scope decision: a queue entry #145 had already closed, and a line count
stale by growth. Category S, so no brief and no `@executor`: the Orchestrator
wrote the edits itself under the write gate.
**Consumes:** `b63cbf6` — `origin/main`, with #144, #145 and #146 all merged.
**Branch:** `docs/stale-followup-and-lab-figure`, cut from `b63cbf6`.
**Produced:** the two edits and this recap.
**Pairs with:** nothing — one session, one role, no executor half.

## One-line summary

Item 1 was smaller than specified because its stated line drift never happened;
item 2 could not be re-measured as specified, and the honest output was a dated
figure plus a written account of which bucket the method fails to name — not a
replacement number.

## The gate was real and it cleared mid-session

The instruction made proceeding conditional on #146 having merged, because item 2
cites a figure #146's recap discusses. It had not, at the time it was checked:

```
$ gh pr view 146 --json state,mergedAt
{"mergedAt":null,"state":"OPEN"}
```

The session stopped and asked. The owner answered that it had merged, which by
then it had — at `21:43:14Z`, during the session, as `b63cbf6`. Both measurements
were correct at the moment they ran; re-verification, not deference, is what
resolved the disagreement.

```
$ gh pr view 146 --json state,mergedAt,mergeCommit --jq '{state,mergedAt,merge:.mergeCommit.oid}'
{"merge":"b63cbf68ee9a7a3368264ed02fa6212e81458f59","mergedAt":"2026-08-14T21:43:14Z","state":"MERGED"}
```

**`git switch main` was never run.** `main` is checked out in the primary clone,
so the worktree cannot switch to it; verification was `git rev-parse main
origin/main` returning one hash, and the fast-forward was run in the clone that
owns the checkout.

## The instruction's drift premise was false, and that shrank item 1

The instruction stated that #145 "added 13 lines above it, so `ROADMAP.md:49` is
no longer the sentence the entry names", and directed a re-location before
writing. The 13 lines went *below* line 49 — the superseding note is a blockquote
placed beneath the dated entry, at line 58, which is what #145 was asked to do.

```
$ git show bf057b0:docs/ROADMAP.md | sed -n '49p'   # before #145
The Python `automation/` codebase ... **Until v2's coordination adapters land
(Phase 4), the Python automation continues to operate** as the live coordination
pipeline.
$ git show 33b970b:docs/ROADMAP.md | sed -n '49p'   # after #145 — identical
$ grep -n "continues to operate" docs/ROADMAP.md    # after #146
49:The Python `automation/` codebase ...
```

#146 changed 28 lines in the same file and also left both positions unchanged.
The citation was re-verified after each merge rather than once, because the first
verification predated a merge. Item 1 therefore became a two-part edit with no
re-location in it: the heading's claim, and the record of the closure.

## Item 2: four of the five buckets re-measure, and the fifth names no file

The instruction was explicit that re-measuring means re-running the five-bucket
classification, not summing `wc -l`. The denominator reproduces exactly, and the
rule that reproduces it is `git ls-files '*.py'`:

```
$ cd /d/Projects/buraqueira && git ls-files '*.py' | xargs wc -l | tail -1
 15367 total
$ git ls-files '*.py' | awk -F/ '{ if (NF==1) print "ROOT"; else print $1 }' | sort -u
ROOT
scripts
tests
```

The note's own arithmetic is exact — `3750+2459+1082+367+160+4714 = 12532` — so
the buckets are a coherent snapshot, not an estimate. Four of the five re-measure
because the note names their file sets:

| Bucket | Written definition | 2026-08-08 | 2026-08-14 |
|---|---|---|---|
| pytest | `tests/**` | 3,750 | 4,656 |
| scripts | `scripts/**` | 2,459 | 2,712 |
| sentenced | `sync.py`, `lib_sheets.py` | 1,082 | 1,451 |
| already ported | `lib_transform.py` | 160 | 201 |
| Sheets-side runners | *no file named* | 367 | not derivable |
| portable surface | "the remaining" | 4,714 | not derivable |

## Why the figure was dated instead of replaced

Two measured reasons, either one sufficient:

- **"367 Sheets-side runners" names nothing.** The note points at the lab's
  `PORTING.md` for its Sheets classification, and `PORTING.md` marks exactly
  `sync.py` and `lib_sheets.py` as `NEVER PORTS` — which is already the sentenced
  bucket. It describes no separate runner set.
- **The portable remainder names "the two small adapters"** against five
  `adapter_*.py` in the tree today (`jira` 365, `cache` 149, `paths` 101,
  `esteira` 100, `receita` 87). Which pair was counted is not written.

The residual the two share is `15,367 − 9,020 = 6,347` lines. Splitting it needs a
rule the note never recorded, so `4,714` — and the `9,000-11,000` TS estimate and
`30-45` briefs derived from it — were left as dated 2026-08-08 measurements. **A
raw total substituted for a classified one would have read as a refresh while
silently changing what the number counted**, which is the failure the instruction
named in advance.

## One open question closed for free

`docs/tasks/2026-08-14-python-lab-of-record/notes.md` recorded that `buraqueira`'s
`.claude/` holds 46,101 lines of `.py`, "assumed to be worktrees or vendored code
and not opened", and warned that if any of it were laboratory code "every size
comparison in this task understates the lab". It is untracked, so it was never
inside the denominator and the warning does not apply. That bullet is now marked
resolved rather than left standing beside an edit that answers it.

The `~15,367` recorded in the same bullet is exact — `15,367` — and was corrected
in place.

## The cosmetic item is accurate about nine directories and silent about a tenth

The instruction described nine empty shells in `.claude/worktrees/` that no git
state depends on. Confirmed at 0 files each. But the directory holds eleven
entries, and two are live:

```
$ for d in .claude/worktrees/*/; do printf "%6s files  %s\n" "$(find "$d" -type f | wc -l)" "$(basename "$d")"; done
     0 files  agitated-napier-a9270c
     0 files  angry-swanson-d8d536
   672 files  blissful-benz-594a85
     0 files  brief-052-task-cutover-278d50
     0 files  eager-cartwright-d37b68
     0 files  exploracao-branch-especial-437e38
     0 files  gate-economics-runtime-instrumentation-8dfd8b
     0 files  harness-redesign-exploration-24a9a0
   409 files  intelligent-hopper-862ed3
     0 files  jira-google-art-generator-cb7ab8
     0 files  perse-brief-rules-20c160
$ ls -A .git/worktrees/
blissful-benz-594a85
intelligent-hopper-862ed3
```

`blissful-benz-594a85` carried #146's branch and is registered in
`.git/worktrees/`. **A glob-wide delete of `.claude/worktrees/*` would have taken a
live worktree with it.** No commit was spent here, per the instruction; the hazard
is recorded because the next session will read the same nine-shell description.

## `document` over `fix`, on semantic fit

`correct`, `record` and `supersede` are on neither the allowlist nor the denylist
in `.claude/hooks/lib/commit-message.mjs` and would have stopped the hook.
Of what remains, `fix` implies a defect: the queue entry was true when written and
`12,532` was true when measured, and neither was wrong. What this commit adds is
the record of what happened afterwards, which is `document`. `update` would have
been accepted and said nothing about what changed.

## What this session did not verify

- **Whether the residual grew in kind or only in size.** The 6,347 lines were
  measured as a total, not classified by module against 2026-08-08.
- **The counting rule the original note used.** `wc -l` (blank and comment lines
  included) is assumed because it is the only rule that reproduces `15,367`
  exactly; the note does not say.
- **The third and fourth bullets under `## Open` in that `notes.md`.** The
  `grep -c` counts-lines-not-occurrences caveat was not measured and stays open.
- **Anything in #146 beyond its `--stat` and the figure mention in its recap.**
  Its recap adds no method information for the five buckets — it restates the two
  items — so item 2 rests on this session's own measurement.
- **Whether the legacy Python coordination pipeline still runs.** Untouched here,
  as in #145 and #146.
