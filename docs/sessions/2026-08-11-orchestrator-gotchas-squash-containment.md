# Session recap — 2026-08-11 — G-GIT-1 squash containment correction (Orchestrator)

**Mode:** Orchestrator, `caminho B` — authored directly, no brief, no subagent.
The routing was closed with the owner at the top of the session rather than
defaulted either way.
**Consumes:** `d517144` — the gate runtime instrumentation, landed via PR #131.
**Branch:** `docs/gotchas-squash-containment`, cut from `d517144` with the
owner's explicit approval. One commit, `8dcf0a6`.
**Produced:** the correction to `G-GIT-1` in `docs/GOTCHAS.md`, shipped as
PR #132, squash-merged to `6b35abb` at 2026-08-12T00:05Z. Plus this recap, two
findings against the instrument that shipped the day before, and a third against
the entry this session had just finished correcting.
**Pairs with:** nothing. There is no executor recap for this session, and the
reason is structural — see "The pairing ruling has a precondition" below.

> **This recap was written before the session ended, and the session did not
> end.** Everything from here to "Next-session snippet" was authored when PR #132
> had just merged, and is preserved as written except where a later fact made it
> **false** — those are corrected in place and marked, never quietly edited. The
> owner then merged that recap, asked for the F-3 follow-up, and the session ran
> three more PRs and four branch cleanups. That window has its own section,
> "The post-merge window", below the original body.
>
> The irony is the point. This file's own lesson was *write the recap while the
> PR is still open*, and the reason it needed rewriting is that it was written
> while three more PRs were still ahead of it. The lesson was right about the
> vehicle and wrong about the timing: a recap is not finishable at the moment the
> first PR merges, because "the session" is not over until the owner says so.

## One-line summary

An entry warning that no commit-level check can confirm containment was itself
wrong about one of the three checks it named, in the direction that matters:
`git branch -d` does not refuse a squash-merged branch, it refuses a branch with
no matching upstream, and when the upstream matches it deletes without a word
while having verified nothing. The entry trained readers to expect a refusal; the
reader who got a clean deletion would have read it as authorisation. Two of the
three symptoms reproduced exactly, so the entry was extended rather than rewritten
— and the session then produced two findings about `gate-yield` that no session
reading its own prose could have produced.

## Route: why `caminho B` and not a Category M brief

The prompt sized this honestly and left the call open. It went to `caminho B` for
three reasons, all offered to the owner before any edit and approved:

- **One file, one entry.** The diff landed at 21 insertions and 5 deletions.
- **No modelling decision for a planner to make.** The three changes arrived
  specified, each with its own evidence, and the "which of these is real" work
  had already happened in the session that found them.
- **The evidence record arrived closed.** The measurements cannot be re-run, so
  there was nothing for a planner to verify independently — only prose to place
  correctly inside an existing four-part structure.

A brief would have been longer than the artifact it described. The consequence is
recorded plainly: **there is no `docs/tasks/` folder for this correction.** The
trail is `8dcf0a6`, PR #132, and this file. Anyone looking for a brief will not
find one, and its absence is a decision rather than an omission.

## What changed in `G-GIT-1`

Three changes were asked for. A fourth was forced by the first and is called out
because it was not on the list.

| # | Where | Change |
|---|---|---|
| 1 | Symptom | `-d` is no longer stated unconditionally, and gains its own sentence on why **success** is its dangerous answer |
| 1 | Cause | `-d` split out of the `--merged` bullet, with the upstream clause and the 2026-08-09 vs 2026-08-11 contrast |
| 2 | Cause | N=10 appended; the conditional-wrongness argument for `git cherry` now rests on three points, not two |
| 2 | Workaround | new paragraph scoping the two-part tree form to the non-empty case |
| 3 | Workaround | `-d` joins `cherry` and `--merged` in the proscription |
| — | Cause, opening line | **"the two checks then fail for different reasons" → "the three checks ... three different reasons"** |

That last row is the interesting one. Splitting `-d` into its own bullet made a
sentence three paragraphs away go false — a count that had been correct since the
entry was written. It was caught by re-reading the rendered entry end to end after
the edits rather than by reading the diff, which is the only reason it was caught
at all: a diff of the bullet list does not show the sentence that counts the
bullets.

Nothing existing was softened or deleted. The N=6 and N=1 measurements stand
verbatim, and the warning the entry was written to carry is the part that
reproduced.

## Why the `-d` correction is not a nitpick

`git branch -d` does not ask "is this merged into `main`?". It asks "is this
merged into its **upstream**, or into `HEAD`?". The 2026-08-09 branches had no
matching upstream, so it refused, and the entry recorded that as the behaviour.
The 2026-08-11 branch had `origin/chore/gate-runtime-instrumentation` at the same
commit, so the check passed trivially — `main` was never consulted.

The failure mode inverts. A refusal makes a reader stop and think. A clean
`Deleted branch <name> (was c4ebae3)` reads as git having confirmed containment,
when all it confirmed is that a local ref matched its remote-tracking ref — a
thing equally true of a branch whose work never reached anywhere. This is why
`-d` also had to enter the Workaround's proscription: it is the *last* remaining
commit-level check, the one a reader reaches for after `cherry` and `--merged`
have lost their trust, and it is the one that will agree with whatever they
already wanted to do.

## Two findings against `gate-yield`, one day old

The instrument that shipped in PR #131 was read in this session, and it was read
by running it rather than by trusting the recap that described it. Both findings
below are about the D8 window accounting, not about the emission seam, which did
exactly what it claims.

### F-1 — an `ask`-then-proceed commit is invisible to the committing-session proxy

This session committed. `.claude/telemetry/gates.jsonl` holds exactly two records
and **neither is an `allow`**:

```
commit-guard  R10-subject-shape  deny   (the G-HOOK-1 probe)
commit-guard  R10-verb-unknown   ask    (the real commit, 8dcf0a6)
```

`gate-yield` reports `Committing sessions: 0 of 10`. A committing session is
defined as one with at least one `commit-guard` allow, and this one has none —
its commit was permitted through the `ask` path. The tool already prints the
caveat that the proxy is "not a fact", and the caveat is correct, but the failure
is sharper than the wording suggests: the window's own closing condition
undercounts, and it undercounts *specifically* on the commits interesting enough
to have made the guard hesitate. A window at 0 of 10 after a session that shipped
a merged PR is not a rounding error.

### F-2 — the stream is per-worktree, so the window fragments and cannot accumulate

`gate-yield` resolves its stream from the module's own location, and the file is
gitignored. This session's worktree therefore started the count at zero. The
2026-08-11 gate-runtime session recorded twelve records in *its* worktree; this
one shows two, not fourteen. Two disjoint streams already exist, one day in.

This was designed and is documented as "local to the worktree that produced it",
so it is not a defect in the emission. The consequence for **D8** is the finding:
a window scoped at 150 events or 10 committing sessions is counted per worktree,
and this project opens a fresh worktree per session. On current practice the
window never fills — every session restarts it. Either the threshold is per
worktree and should say so and shrink, or the reader needs to aggregate across
worktrees before the window means anything. Not resolved here; recorded so the
Mentor session that closes the window does not close it against one worktree's
two records.

Both findings belong to `docs/explorations/gate-economics.md`'s successor and are
left as findings, not fixed. **F-10 of the previous session applies to them
doubly** — the first session in the window built the instrument, and the second
one is this one, which read it while doing something else entirely.

## F-3 — `G-GIT-1`'s own Workaround does not say *which* `main`, and it matters

Found by running the corrected workaround against this session's own task branch,
to check a claim this recap had already asserted. The claim was wrong, and it was
wrong in the entry's own failure shape.

The Workaround prescribes `git diff --stat main <branch>`. Run literally, in this
worktree, it reported 21 insertions and 5 deletions — the branch appearing to
carry unique work. It does not. The local ref named `main` was stale at
`d517144`, because nothing in this session ever advanced it: the branch was cut
from `d517144`, the merge happened on the server, and `git fetch` moves
`origin/main` while leaving `main` exactly where it was. Against `origin/main`
the same command is empty and both trees are `b7f8fcf2e997`, so the branch is
contained and safe to delete.

This is not a new mechanism — it is the direction-of-difference problem the
Workaround already warns about, arriving through a door the Workaround left open.
The entry says to read the direction "because `main` being ahead looks exactly
like the branch having unique work", and then hands the reader a command whose
`main` is, in a per-session-worktree project, **behind by construction**. Every
session here opens a fresh worktree, cuts from a SHA, and never checks out `main`
at all. A stale local `main` is the default state, not an edge case.

Recommended hardening, not applied here: `G-GIT-1`'s Workaround should read
`origin/main`, with one sentence on why the local ref cannot be trusted for this
question. It is a fourth change to an entry that merged twenty minutes ago, and
it wants its own PR and the owner's call — folding it in silently would make this
recap the record of an edit nobody reviewed. Flagged, queued, not done.

> **Corrected — this was done.** The owner called it in the same session and it
> shipped as PR #134, `1437a8c`'s parent. The queue item is closed; see "The
> post-merge window". One thing was added beyond the finding as stated above:
> `origin/main` is itself only as fresh as the last fetch, so `git fetch origin`
> immediately before the check is part of the check. Without that, the fix would
> have swapped one untrustworthy reference for another.

The uncomfortable part is worth stating plainly: this recap asserted the branch
was safe to delete *before* checking, and the check contradicted it. The claim
was written from the reasonable inference that a squash-merged branch has an
identical tree — which is true, against the right reference. Running it is what
found the wrong reference.

## What was verified instead of assumed

- **Hooks are live in this worktree.** Not inferred from the files being present.
  The `G-HOOK-1` probe ran: `git commit -m "bogus: probe"` with nothing staged was
  denied by `commit-guard` on the invalid type, before git ran. That denial is the
  first of the two telemetry records above.
- **`npm install` left no tracked drift.** G-NODE-2's guard — `git status --short`
  empty afterwards, `package-lock.json` untouched.
- **Green ran twice**, before and after the edit, not once: `npx tsc -b` clean,
  324 package tests (323 pass, 1 skipped) and 112 hook tests, zero failures. A
  docs-only change cannot break them, which is exactly why running it before the
  edit was worth it — it establishes that the number in the prompt is the number
  this worktree actually produces.
- **The committed message matches the approved one.** Verified with
  `git log -1 --format='%s%n%n%b'` against the Pausa 3 text, subject and body.

## The pairing ruling has a precondition, and this session lacked it

Two standing rulings could not both be honoured, and this is the record of which
gave way.

**"Both recaps per session."** There is one recap for this session, not two. The
ruling assumes the Orchestrator → executor pipeline; `caminho B` has no executor,
so there is no second window to recap. Writing a stub executor recap would
manufacture an artifact for a role nobody played.

**"Recaps ride the session PR; a separate docs PR is retired."** This recap does
not ride PR #132, because PR #132 was merged before the recap was written. Its
branch is `docs/session-recap-gotchas-squash-containment`, cut from `6b35abb`, and
it needs its own PR. That is the retired pattern, arrived at not by preference but
because the ruling's precondition — an open session PR — was gone.

The preventive lesson is not "un-retire the separate docs PR". It is **write the
recap before the PR merges**. The 2026-08-09 recap already recorded that a recap
written while decisions are still open is a draft; this session found the opposite
edge, where waiting until everything is settled means waiting until the vehicle
has left. The session PR is open for a window, and the recap has to be inside it.

## What this session did NOT establish

- **Why the 2026-08-09 branches had no upstream** was not investigated. The entry
  states the fact and its consequence; it does not claim to know whether those
  branches were never pushed, or pushed and pruned.
- **Whether `-d`'s `HEAD` fallback has its own trap** is unexamined. The entry
  names the fallback because it is part of what `-d` actually checks, but every
  measurement here is of the upstream path. *(Corrected: the fallback was
  measured after all, three times, in the post-merge window — it refuses, which
  is the safe direction.)*
- **F-1 and F-2 are one session each.** F-1 rests on a single `ask` record and
  F-2 on two worktrees. Neither is a pattern yet, and `G-GIT-1` is itself the
  cautionary example of an entry generalised from two measurements — it took a
  third to find the error. *(Corrected: F-1 now rests on four `ask` records and
  zero `allow`s across four merged PRs. It is no longer a single observation.)*
- ~~**F-3 is not fixed.**~~ **Corrected — F-3 was fixed**, as PR #134, later in
  the same session. `G-GIT-1` now says `origin/main` in all three Workaround
  commands. The original text of this bullet claimed a future reader would be
  handed the stale reference; that stopped being true at `821e91a`.
- **No product code was touched.** `packages/` is untouched end to end; the only
  file changed on the task branch was `docs/GOTCHAS.md`.

## The post-merge window

Everything above was written when PR #132 merged. The owner then merged this
recap as PR #133, called the queued F-3 follow-up, and the session ran on. Final
state: `main` at `1437a8c`, four merged PRs, four branches cut and deleted, zero
lines of `packages/` touched.

| PR | Merge | What |
|---|---|---|
| #132 | `6b35abb` | the `-d` correction and N=10 — the original ask |
| #133 | `adb74e4` | this recap, with F-1, F-2, F-3 |
| #134 | `821e91a` | `origin/main` in the Workaround — the F-3 queue item |
| #135 | `1437a8c` | the `git branch -d` warning quoted verbatim |

Only #132 was in the original request. The other three came out of checking
assertions instead of accepting them, and in two cases the assertion being
checked was **this file's own**.

### The fourth error, and what it cost

`G-GIT-1` was wrong a third time. The entry — as corrected by #132, by this
session, hours earlier — said `-d` deletes "without a word" and called the
success line "clean". Both false. Git prints a warning immediately above it,
naming the reference it actually consulted:

```
warning: deleting branch 'docs/gotchas-squash-containment' that has been merged to
         'refs/remotes/origin/docs/gotchas-squash-containment', but not yet merged to HEAD
```

This inverted the entry's argument rather than decorating it. The claim had been
that a successful `-d` reads as confirmation *because git is silent*. Git is not
silent; the warning appears **only** in this exact case, which makes its presence
a positive signal that the wanted check did not happen, and its absence beside a
deletion a real all-clear. The failure is presentation — stderr, wrapped across
two lines, with the reassuring `Deleted branch ...` directly underneath. Shipped
as #135, which had to correct two of #132's own sentences to make room.

### The cleanup that produced the entry's best measurement

Deleting this session's four branches ran `G-GIT-1` end to end, and produced the
tightest demonstration the entry has. Three branches went into one
`git branch -d`. All three were verified contained first — remainder empty against
`origin/main`, led files at `0/260` and `4/8` added-over-deleted. `-d` then
answered in **opposite directions**:

| Branch | tip | `-d` |
|---|---|---|
| `docs/gotchas-squash-containment` | `8dcf0a6` | deleted, over the warning |
| `docs/session-recap-gotchas-squash-containment` | `f7e2ed6` | refused, needed `-D` |
| `docs/gotchas-origin-main-reference` | `4bbc897` | refused, needed `-D` |
| `docs/gotchas-d-warning` (later) | `cd2ee6f` | refused, needed `-D` |

Same repository, same minute, identical containment. The variable was whether
GitHub had auto-deleted the remote branch on merge and a `git fetch --prune` had
removed the tracking ref. #132's remote survived; the rest did not. **This closes
the "`HEAD` fallback unexamined" gap** listed above: the fallback refuses, which
is the safe direction — the danger is entirely on the upstream path.

Had the corrected doctrine not been followed, the three refusals would have read
as "these carry unique work" and the one deletion as "this one was safe". Every
one of those readings would have been wrong.

### F-1 is no longer a single observation

The telemetry now reads **five events: one `deny`, four `ask`, zero `allow`** —
across four commits that all merged. `gate-yield` still reports
`Committing sessions: 0 of 10`. F-1 was written from one record and hedged as
"not a pattern yet"; it is now 4 of 4, and the D8 window is not undercounting at
the margin, it is counting nothing at all.

### F-4 — the R10 verb allowlist has no verb for "this was wrong"

New, and the cause of all four `ask`s. `VERB_ALLOWLIST` in
`.claude/hooks/lib/commit-message.mjs` holds 21 verbs. This session's four
subjects used `correct` (twice), `record` and `quote`. None is on the list, so
every commit stopped on `R10-verb-unknown`.

The gap is not vocabulary breadth, it is a missing category. The list is shaped
for code — `fix`, `refactor`, `port`, `wire`, `bump` — and its nearest
documentation verbs are `document` (implies it was not written down) and `update`
(implies it was current and aged). Neither fits a doctrine file that stated
something **false**. `correct` is the precise word and it is absent, which means
every future correction to `CLAUDE.md`, `GOTCHAS.md` or `PROCESS_MAP.md` trips
the same ask. In a repository whose central artifacts are documents that get
things wrong and then get fixed, that is the wrong 21 verbs.

Left as a finding. Adding a verb to a gate's SSOT is the owner's call, and the
`ask` verdict is arguably correct behaviour — it stopped and asked, which is what
it is for. What it should not do is stop and ask the same question four times in
one session with the same answer each time.

## Next-session snippet

> **Consumes:** `1437a8c` — `G-GIT-1` after four PRs (#132, #133, #134, #135).
> Use `git log -1 main`, not `git log --merges -1 main`: `main` still has no
> merge commits.
>
> Green is `npx tsc -b && npm test` = 324 package tests (323 pass, 1 skip) + 112
> hook tests. A fresh worktree inherits the guards from `main` but starts without
> `node_modules` — `npm install` at the root, then confirm `git status --short` is
> empty (G-NODE-2). Confirm the guards with the `G-HOOK-1` probe rather than
> assuming: `git commit -m "bogus: probe"` with nothing staged must be denied by
> `commit-guard` before git runs. Do not invoke `brief-validator`, `closer` or
> `pre-commit-self-audit` — tombstones; mechanical brief validation is
> `node .claude/hooks/validate-brief.mjs <brief>`.
>
> **Before deleting any branch, read `G-GIT-1` as corrected.** `git branch -d`
> deletes a squash-merged branch whenever its upstream matches, and refuses when
> the upstream is gone — measured four times here, both directions, with
> containment identical throughout. It is not a containment check in either
> direction. Watch for the `warning:` line above a successful deletion; it names
> the ref git actually used. Ask about trees instead, and ask against
> **`origin/main`**, never the local `main`, which is stale by construction in a
> per-session worktree (F-3): `git fetch origin` then
> `git diff --stat origin/main <branch>`. Empty means safe, and after a clean
> squash empty is the common answer.
>
> **The D8 telemetry window counts per worktree** (F-2) and does not count
> `ask`-permitted commits at all (F-1, now 4 of 4 — four merged PRs, zero
> `allow`s, window still reading `0 of 10`). Do not treat `gate-yield`'s window
> state as a measurement of the project.
>
> **Expect `R10-verb-unknown` on any documentation correction** (F-4). `correct`,
> `record` and `quote` are not on `VERB_ALLOWLIST`, and there is no allowlisted
> verb meaning "this was wrong". The `ask` is not a bug — decide whether the list
> should grow before assuming your subject is malformed.
>
> `experiment/harness-redesign` must not be deleted: `4ba57d7` is unreachable
> from `main` and holds the only record of its twenty front merges. Every other
> branch this session created is gone, verified contained before deletion.
> `docs/gotchas-squash-containment` **is** safe to delete — verified, not
> inferred: `git diff --stat origin/main docs/gotchas-squash-containment` is
> empty and both trees are `b7f8fcf2e997`.
