# Session recap — 2026-08-14 — stale-present-tense-claims (Orchestrator)

**Mode:** Orchestrator, opened at the close of `2026-08-14-roadmap-operating-claim`
(PR #145). Two parts: worktree and branch housekeeping, then the three adjacent
stale claims #145 reported and deliberately left. Category S, so no brief and no
`@executor`: the Orchestrator wrote the three edits itself under the write gate.
**Consumes:** `33b970b` — `origin/main`, with #144 and #145 both merged.
**Branch:** `docs/stale-present-tense-claims`, cut from `33b970b`. Two commits.
**Produced:** the cleanup, the three edits in `0739c50`, and this recap.
**Pairs with:** nothing — one session, one role, no executor half.

## One-line summary

Two of the three claims #145 reported were repaired and the third was dropped by
measurement, not by scope — and both parts of the session found the instruction's
own premises had gone stale between being written and being executed.

## Four instruction premises measured false before anything ran

The cleanup half was specified from a measurement taken at #145's close. Three of
its claims no longer held, and none of the three was discovered by attempting the
command.

| Premise | Measured 2026-08-14 |
|---|---|
| `main` sits two commits behind `origin/main` | `rev-list --left-right --count` → `0 0`; already at `33b970b` |
| `origin/docs/python-lab-of-record` still present | `ls-remote --heads origin` → only `refs/heads/main` |
| `origin/docs/roadmap-operating-claim` still present | same |
| `fix/adf-text-fidelity` differs only in `packages/` being equal | 12 lines exist on the branch that `main` lacks |

```
$ git ls-remote --heads origin
33b970b990d324c3c1c377152294b5a27bf6677b	refs/heads/main
```

**`git push origin --delete` was dropped from the list and never executed.** The
approved set was six commands, all local.

The fourth premise is the one worth keeping: the 12 lines are not unlanded work.
They are the pre-#144 prose naming `automation/` as the permanent laboratory lane
— the branch is *behind* `main`, and reading "12 added lines" as "12 lines at
risk" would have blocked a correct `-D`. Verified before proposing it:

```
$ git diff origin/main..fix/adf-text-fidelity | grep -c '^+[^+]'
12
$ git diff --stat origin/main..fix/adf-text-fidelity -- packages/
(empty)
```

## `git worktree remove` succeeded three times and reported it once

One of the three removals errored; all three left the same residue.

```
$ git worktree remove .claude/worktrees/angry-swanson-d8d536
error: failed to delete '...angry-swanson-d8d536': Permission denied
```

```
$ for d in */; do echo "$(find "$d" -type f | wc -l) files  $d"; done
0 files  agitated-napier-a9270c/
0 files  angry-swanson-d8d536/
0 files  eager-cartwright-d37b68/
```

The content was removed in all three cases; a Windows directory handle blocks the
final `rmdir`, which then also fails by hand (`Device or resource busy`). Git's own
state is clean — `.git/worktrees/` holds one entry — so the shells are cosmetic and
clear on the next reboot. **The exit code of the two silent removals said nothing
about whether the directory went away.** Worth knowing before a future session
reads a clean exit as a clean disk.

Six further empty shells from earlier sessions were found on disk, tracked by no
worktree and named by no branch: `brief-052-task-cutover-278d50`,
`exploracao-branch-especial-437e38`,
`gate-economics-runtime-instrumentation-8dfd8b`,
`harness-redesign-exploration-24a9a0`, `jira-google-art-generator-cb7ab8`,
`perse-brief-rules-20c160`. Reported, not touched — outside the approved list.

## Item 2 was dropped by measurement, and for a stronger reason than the one offered

The instruction flagged `ROADMAP.md:47`'s "~3-4 months" prediction as *possibly*
correct because a dated entry recording a dated prediction is doing its job. That
reasoning holds, but it stops one step short: **the window is open at 4 of 4 live
sites**, including the two present-tense `**Status:**` lines that would be the real
defect if anything had expired.

```
$ git log --reverse --format='%h %ad %s' --date=short -- packages/ | head -1
3972f6b 2026-05-27 chore(phase-1): monorepo bootstrap — TS workspaces and CLI (#33)
```

| Site | Anchor | Window | On 2026-08-14 |
|---|---|---|---|
| `ROADMAP.md:47` | 2026-05-15 pivot | 08-15 → 09-15 | open, 1–32 days left |
| `ROADMAP.md:348` | Phase 1 start | 08-27 → 09-27 | open, 13–44 days left |
| `MENTOR_BRIEF.md:112` | Phase 1 start | same | open |
| `MENTOR_BRIEF.md:140` | Phase 1 start | same | open |

Nothing is false, so nothing was written. Measuring the anchor rather than
assuming it from the pivot date is what moved the earliest bound from tomorrow to
2026-08-27.

## Item 1 had a twin the instruction did not list

`#144` fixed five sites of the `automation/`-as-laboratory misattribution.
Measured across live docs, the claim "no production users" survived at **2 of 3**
sites, not 1:

```
$ grep -rn 'no production users' --include='*.md' . | grep -v 'docs/tasks/\|docs/sessions/'
./CLAUDE.md:21:...there are no production users...          <- subject is `buraqueira`, correct
./docs/MENTOR_BRIEF.md:49:...of the Python `automation/`...  <- not in the instruction
./docs/ROADMAP.md:114:...of the Python `automation/` today,  <- the listed one
```

The Update protocol opens with "This file ages alongside MENTOR_BRIEF §2; treat
them as a pair", which is the argument for taking the twin in the same commit
rather than queueing it. The owner chose that scope.

## The subject moves to the laboratory, not to the pipeline

`#144`'s own replacement subject was "the legacy Python coordination pipeline"
(`bf057b0`, `MENTOR_BRIEF.md:186`). Reused here it would have broken something:
#145 recorded that whether that pipeline still runs from any checkout **was never
measured**, so "no production users of the legacy pipeline" asserts the gap #145
declared. The laboratory is the safe subject because `CLAUDE.md:21` already
asserts it. Closing a misattribution must not open an unmeasured claim.

`#144`'s subject was correct in its own sentence — a forward-looking Phase 4 exit
criterion asserts nothing about today. The two sentences differ in what they
claim, not in what they name.

## Shape split by document, on a precedent rather than a reading

The owner chose the dated inline parenthetical for both `ROADMAP` items, matching
`ROADMAP.md:154-157`, which corrects this exact misattribution class in this exact
section. The twin needed its own answer, and the file supplied one:

```
$ git show bf057b0 -- docs/MENTOR_BRIEF.md
-    consumer, not the source of aggregation. Retires the Python
-    `automation/` for coordination.
+    consumer, not the source of aggregation. Retires the legacy
+    Python coordination pipeline.

$ grep -n -i 'do not silently\|rewrite' docs/MENTOR_BRIEF.md
226:**M-R6 — Disagree when warranted.** ... Do not silently comply with a bad plan...
```

`MENTOR_BRIEF` carries no anti-rewrite protocol — the "do not silently rewrite
earlier ones" clause is scoped to `ROADMAP`'s `## Identity shifts` — and #144 had
already fixed this class there in place. So the twin is a one-token rewrite with no
device, and the split is precedent, not judgment.

## Item 3 states a ruling and now reads as one

`is ported` → `will be ported`, two words, plus a parenthetical carrying the
measurement rather than an assertion of absence:

```
$ for p in adapter-render adapter-http web; do test -d packages/$p || echo "absent packages/$p"; done
absent packages/adapter-render
absent packages/adapter-http
absent packages/web
$ grep -rln 'artTemplate\|Suindara' packages/
(no matches in packages/)
```

The parenthetical sits at the end of the paragraph, not after the corrected
sentence, because "The reason is control, not size" answers that sentence directly
and an interruption between them costs more than the placement gains.

## `correct` is the right verb and is on neither list

```
$ grep -n 'VERB_ALLOWLIST' -A 4 .claude/hooks/lib/commit-message.mjs
39-  "add", "fix", "update", "remove", "refactor", "rename", "document", "migrate",
```

Four allowlist candidates were ranked rather than the first workable one taken:
`update` is a refresh, `document` a record, `declare` a new position — and both
positions here were already ruled. `fix` is the only one that means repair, and
`c4a3918 docs: fix Phase 4 to retire the pipeline, not the snapshot` is the same
class of error in the same file under the same verb.

## Category S was inherited, not re-measured

The owner chose S against #145's profile — no rule change, no code, no test, prose
only. This session's edit set came in smaller than #145's: 2 files and 18 inserted
lines against 1 file and 13. The gates did not scale down: write gate, Pause 2 on
verbatim before/after text, Pause 3 with the unconditional green boundary
(`112 of 112` tests, `tsc -b` exit 0, both run by hand because `core.hooksPath` is
unset in session worktrees), and the owner's push.

## What this session did not verify

- **No `buraqueira` checkout was read.** "There are no production users of the
  Python laboratory" rests on `CLAUDE.md:21`, not on a fresh measurement — the same
  gap #145 declared, carried forward unchanged.
- **Whether the legacy Python coordination pipeline still runs.** Untouched by
  design; no edit in `0739c50` claims it started or stopped.
- **The falsehood classification for items 1 and 3 is reading, not execution.** No
  tool decides whether a present-tense sentence is false. Item 2's is arithmetic
  over a measured commit date, which is why it is the one that changed the answer.
- **`CLAUDE.md:28` was not edited.** It carries the same `is ported` present tense,
  softened by "one mechanism at a time under R26" but not removed. Out of the
  chosen scope; not queued.
- **The six orphan worktree directories and the three from this cleanup remain on
  disk.** No git state depends on them.
- **Two items stayed open from the instruction's own low-priority list**:
  `docs/tasks/2026-08-14-python-lab-of-record/notes.md` still opens with a
  follow-up #145 closed, and `docs/explorations/python-laboratory-lane.md`'s
  12,532-line figure for `buraqueira` is stale by growth. Re-measuring the second
  means re-running the five-bucket classification, not summing.
