# Session recap — 2026-08-11 — gate runtime instrumentation (Orchestrator)

**Mode:** Orchestrator, Plan mode. Decisions closed with the owner one at a
time, then delegated — first to `@planner` for the brief, then, after the owner
reopened the session, to `@executor` for the whole of it. The Orchestrator wrote
no code and touched no product file; `packages/` is untouched end to end.
**Consumes:** `4b43cc8` — the harness redesign, landed via PR #130. See the
correction below: this SHA cannot be produced the way the previous recap says.
**Branch:** `chore/gate-runtime-instrumentation`, cut from `4b43cc8` with the
owner's explicit approval. Nine commits. **Not pushed** — `origin` stands seven
behind at `8d12133`, which is where PR #131 was opened from.
**Produced:** the brief at `docs/tasks/2026-08-11-gate-runtime-instrumentation/`,
this recap, and then the executed task — the emission seam, check identifiers on
every verdict, the wiring of all five hooks, the `gate-yield` reader, and the
promotion of `docs/explorations/gate-economics.md`. Item 3 of what the harness
redesign still owed is built, not merely specified.
**Pairs with:** `docs/sessions/2026-08-11-executor-gate-runtime-instrumentation.md`.

> **This recap was written twice.** Everything from here to "What this session
> did NOT establish" was authored when the session closed on the brief, and is
> preserved as written. The owner then reopened the session with "aciona o
> executor", which made three claims in the original closing section false. They
> are corrected in place rather than left standing, and the execution window has
> its own section below. The lesson the 2026-08-09 recap recorded about itself —
> *a recap written while decisions are still open is a draft, and calling it done
> is what creates the corrections* — was quoted in this file before it happened
> to this file.

## One-line summary

The baseline note's own successor became a brief and then became real: thirteen
closed decisions, then seven executor commits that make every mechanical verdict
the five hooks reach durable, so Finding 1 can be re-tested against runtime data
instead of against prose written by the sessions being measured. The through-line
of both halves is the same — every finding worth keeping came from refusing to
take an assertion on trust, and the serious ones came from running the code
rather than reading it.

## Correction to the previous recap: it was a squash, not a merge commit

`docs/sessions/2026-08-09-orchestrator-harness-redesign-continued.md` records,
as the owner's call, that the redesign would land as **a merge commit, not a
squash**, and reasons at length about the consequence: twenty front merges
preserved, and `main` losing its linearity at that point, "a deliberate trade,
recorded because a future reader will notice the discontinuity".

The repository says otherwise. `4b43cc8` has exactly one parent, `93fa448`, and
`git log --merges -1 main` — the command that recap's own next-session snippet
tells the next session to run for its `Consumes:` line — returns nothing at all,
because `main` contains no merge commits. `main` is still linear and the
discontinuity never happened.

Two consequences, both live rather than historical:

1. **The instruction cannot be followed as written.** A session that runs
   `git log --merges -1 main` gets empty output and no obvious next move. The
   authoritative form is `git log -1 main`, or the SHA above.
2. **Preserving `experiment/harness-redesign` is now structural, not
   sentimental.** The twenty front merges exist nowhere else: the squash
   collapsed them into one subject, which is precisely the outcome the ruling
   was meant to prevent. `4ba57d7` is **not reachable from `main`**
   (`git merge-base --is-ancestor` says so), so no reachability check will ever
   confirm that branch is safe to delete — which is `G-GIT-1` arriving a second
   time, from the other direction. The branch and its worktree stay.

The older recap is not rewritten; `docs/sessions/` is a historical surface, which
is why the docs guard excludes it from inspection entirely. The correction lives
here.

## The thirteen decisions

Eleven were closed with the owner in this session, all on the proposed default.
Two more were closed by the planner because the executor would otherwise have
invented them.

| # | Decision | The reason it went this way |
|---|---|---|
| D1 | The question is **yield per check** | deny / ask / allow per check, plus the fraction of denials that were self-inflicted. Without a question, instrumentation is telemetry for its own sake |
| D2 | Scope is **the five hooks only** | Hook data is the only evidence in this system that is not self-report. Instrumenting the Pauses needs a human convention whose output inherits the exact bias the baseline declares |
| D3 | `.claude/telemetry/gates.jsonl`, **gitignored**, per worktree | A committed stream dirties the tree on every write, enters the staged diff, and makes the guards inspect their own output. **R18 does not apply** and the brief says so: R18 governs the product's application state, not harness instrumentation |
| D4 | **Only real decisions emit** | The guards fire on every Bash and every Write. An invocation that examined nothing is not a gate event, and writing there would make the guard the most expensive item in the turn |
| D5 | Emission is **best-effort and never alters a verdict** | A hook that denies a commit because its own log write failed is the worst available outcome. Failure writes one stderr line and continues (R4) |
| D6 | Verdicts gain a `check` id **and an input hash** | `decision` and `reason` stay byte-identical. Without the hash, "self-inflicted" has no measure: a retry is indistinguishable from a new event |
| D7 | A **minimal reader CLI** ships with the emission | Without it the data exists and nobody can answer D1 without ad-hoc code. This note was already the victim of measuring by reading prose afterwards |
| D8 | Window: **10 committing sessions or 150 events** | At the baseline's ~10% denial rate, 150 events yield ~15 denials — enough to separate "50% self-inflicted" from "10%". 80 would not |
| D9 | The digest becomes a **new note**, in a Mentor session | `gate-economics.md`'s disposition is spent by the promotion; a runtime measurement is a new topic, not an appendix to a consumed one |
| D10 | This brief **explicitly scopes** the note's amendment | Required by rule 3 of `docs/explorations/README.md`. Disposition becomes `promoted to brief 2026-08-11-gate-runtime-instrumentation`, dated. Nothing deleted |
| D11 | `chore/gate-runtime-instrumentation` from `4b43cc8` | Follows #130's own type for the same surface |
| D12 | Session identity is `session_id`, **verified** | See below — this one was checked, not assumed |
| D13 | The record shape, ten keys, fixed | Left open, the executor invents it; and a stream whose shape drifted mid-window is unanalysable |

Everything else the owner ruled: the builtin import surface (`node:fs`,
`node:crypto`, `node:url`, `node:child_process`) was ratified against the
Orchestrator's own narrower wording, on the ground that R2 governs npm
dependencies and a Node builtin is not one.

## What the planner verified instead of assuming, and why it mattered

D3 and D8 both depend on the hook payload carrying a session identifier. **No
hook in this repository reads one**, so nothing here proved it existed. Asked to
confirm rather than assume, the planner went to the shipped Claude Code 2.1.218
executable and found the single builder that produces the base payload for every
hook event, opening with `session_id` alongside `transcript_path`, `cwd`,
`prompt_id`, `permission_mode`, `agent_id`, `agent_type` and `effort`. It also
confirmed `CLAUDE_CODE_SESSION_ID` live in the hook child environment.

Had it come back absent, D8 would have collapsed: a window measured in sessions
is uncountable without a session key, and the honest outcome would have been to
change the window rather than to write a brief that mandates counting something
unavailable.

The same check produced a correction to D3's stated premise. The Orchestrator's
reasoning was that `${CLAUDE_PROJECT_DIR}` is fixed per worktree, so the file is
per worktree by construction — but that variable came back `undefined` in this
session's own Bash environment, so it is reliable on the hook path and not
generally. The brief resolves the telemetry directory from `import.meta.url`
instead, which is worktree-correct with no environment variable at all. The
landing, the gitignore entry and the per-worktree conclusion are unchanged; only
the mechanism is pinned differently, and the brief records why.

## What the gate caught

One defect, and its class is the point. The brief closed its P4 evidence with
"no ordinal suffix applies **(E5)**". The ordinal-suffix rule is indeed `E5` —
in the *note-local* decision table of
`docs/explorations/mentor-lane-and-task-identity.md`. In the `En` namespace,
`E5` is "Dispatch tables in v1 codebase violate R19".

`CLAUDE.md` and `docs/PROCESS_MAP.md` §8 both declare a bare `(En)` with no
entry in `CLAUDE.md` a bug. This was worse than bare: the number **resolves**,
to something unrelated, so a reader who follows it lands on v1 dispatch tables
and has no signal that they were misdirected. Fixed by citing
`docs/PROCESS_MAP.md` §7, where the rule lives on a canonical surface, in prose
rather than as an ID. The note was deliberately not cited: an exploration note is
the lowest authority and cannot be the citation for a naming rule.

Cheap to fix because the brief was staged and not yet committed — one pass, one
re-validation, one commit. Worth recording as a namespace hazard: **note-local
`D`/`E` tables collide with the global `En` and `Dn` namespaces**, and §8 already
documents two other live collisions of the same kind.

## What the gate verified instead of accepting

Two of the planner's assertions were load-bearing enough to check rather than
believe, and both survived:

- **D6 claims `docs-guard` inherits the check identifier "through the same
  `summarize`".** True: `.claude/hooks/docs-guard.mjs` imports `summarize` from
  `architecture.mjs`, and `docs-checks.mjs` emits findings carrying
  `rule: "ref"` and `rule: "R9"`. So the fifth guard gets real identifiers for
  free and the brief is right to keep `docs-checks.mjs` out of its editable
  paths. Had it been false, `docs-guard` would have emitted
  `check: undefined` and nobody would have noticed — a whole guard silently
  absent from the measurement.
- **The claim that `CLAUDE.md` currently produces zero docs findings.** Verified
  by running `inspectDocument` and `resolverFor` — the shipped functions the
  guard itself calls, not a reimplementation — against `CLAUDE.md` and
  `gate-economics.md` with the real tracked-file set: **0 findings each.** This
  matters because Edit 5 now stages `CLAUDE.md`; pre-existing drift there would
  have had the guard deny that commit for reasons unrelated to the change, and
  the executor would have hit a STOP it could not explain.

## The doctrine-pointer ruling, and the coupling it created

The reader CLI had no pointer on any doctrine surface, so nobody who had not read
the brief would learn it exists. The planner correctly declined to edit
`CLAUDE.md` on its own authority and raised it as a STOP inside Edit 5; the
Orchestrator pulled it forward to the gate rather than leaving a stop in the
middle of execution. **The owner ruled for the pointer, inside this task**: one
line under the `.claude/hooks/` bullet in "Related Documents". `PROCESS_MAP` §4.1
was rejected as the home with its reason recorded — that table is "the checks
that are no longer roles", and a reader decides nothing and blocks nothing, so it
fails the table's premise.

That ruling created an ordering coupling, now explicit in the brief: the pointer
line names `.claude/telemetry/gates.jsonl`, which resolves only as a *correct
absence* because it is gitignored — so Edit 5 depends on Edit 2 having landed the
`.gitignore` entry. Out of order, Edit 5's own commit is denied for an
unresolvable reference. The `CLAUDE.md` line ships in Edit 5's commit rather than
a separate `docs:` one, because the backticked `.claude/hooks/gate-yield.mjs`
resolves only by being staged in the same commit — splitting would work in one
direction only.

## G-HOOK-1: the live half is retired, confirmed rather than assumed

This worktree was cut from `main` before the redesign landed there, so the
guards' presence was a genuine question and not a formality. `npm install` ran
with the lockfile clean (G-NODE-2) and `git status --short` showed no tracked
file changed. The probe then answered: with nothing staged,
`git commit -m "bogus: probe"` was denied by `commit-guard` **before git ran**.
`.claude/settings.json` on `main` is what made that work, which was the merge's
stated payoff. Green re-established: `npx tsc -b` clean, 324 package tests
(323 pass, 1 skipped) plus 61 hook tests, 0 failures.

## Local state

- **Branches:** `main`, `experiment/harness-redesign` (preserved — see the
  correction above), `chore/gate-runtime-instrumentation` (this task, nine
  commits, `origin` seven behind), `docs/spike-art-chain` (another live session),
  and two `claude/*` scaffolding pointers. Nothing was deleted; `G-GIT-1` was
  never approached.
- **Worktrees:** four registered — `main`, this one, `harness-redesign-exploration`
  and `jira-google-art-generator`. The two empty directory entries the previous
  recap expected to vanish, `brief-052-task-cutover-278d50` and
  `exploracao-branch-especial-437e38`, are **still present**: the prediction that
  they would delete once those sessions closed has not come true, and the cause
  was never verified by inspecting process handles.
- **Green:** `tsc -b` clean; 324 package tests (323 pass, 1 skipped) unchanged
  from first measurement to last, plus hook tests **61 → 112**. Nothing in
  `packages/` was touched.
- **Not pushed.** The push and the PR are the owner's.

## The execution window — what the Orchestrator did after the session reopened

The owner reopened with "aciona o executor", and the rest of the session was
gate work rather than authoring: seven executor commits, one Pause 1, one
Pause 2, six Pause 3 presentations, and one `ask` escalated to the owner. The
detailed record is the executor's recap; what belongs here is what the
Orchestrator seat contributed and what it got wrong.

**What the gate caught that the pipeline had not.** The brief carried a
contradiction: D5 required the hook to log a failed telemetry write to stderr
(R4) and, one bullet later, required stderr to be byte-identical between a
writable and an unwritable run. Both cannot hold. It survived authoring, `11/11
PASS APPROVED` from `validate-brief.mjs`, and this Orchestrator's own full read
at the gate — and was found in the first ten minutes by an executor trying to
build the test. The mechanical validator cannot catch a semantic contradiction,
and neither did the reader who approved it.

**What the Orchestrator verified rather than relayed.** Three claims were
checked against the code instead of taken from a report, and one of them
mattered: that `docs-guard` inherits the new `check` field through
`architecture.mjs`'s `summarize`, which is true — had it not been, that guard
would have emitted `check: undefined` and gone silently missing from the
measurement. The other two: that `CLAUDE.md` produced zero docs findings before
Edit 5 staged it, so any finding would be attributable to the change; and that
no `reason` string moved across Edit 3, read deletion by deletion.

**What the Orchestrator got wrong.** Two things, both corrected by the executor.
Told at Pause 2 that the empty-input hash fix "eliminated the collision" — it did
not; two input-less records still share one value, and what changed is that the
value became unmistakably "no input" rather than a plausible digest. And a grep
counting exit call sites in `green-boundary` returned 4 → 5 by counting a comment;
the executor's own count of 3 → 3 was also wrong, and the truth is 4 → 4. The
claim underneath — no exit added or removed — held both times. All three
occurrences are consolidated as `F-7` in the task's `notes.md`, and the pattern
is worth more than the instances: **a number keeps looking right when the scope
of the sentence around it narrows, because nothing about the number changes when
its subject does.**

**Four verification checkboxes could not be met as written**, all reported as
findings rather than ticked: E6's 800-line ceiling (`telemetry.test.mjs` at 823,
owner-ruled, cause recorded as `F-8`); Edit 3's last D6 row, closed in Edit 4;
D5's byte-identity assertion, amended to the verdict channel and **weaker than
the brief's original words**; and constraint 1, amended to admit `notes.md`.

## What this session did NOT establish

- **Twelve events establish that the pipe works, and nothing else.** All twelve
  are allows, so the denial rate is 0/12 and Finding 1 is neither supported nor
  refuted. That is what the window exists to collect, and it stands at 12 of 150
  events and 1 of 10 committing sessions.
- **The first session in the window is the one that built the instrument.**
  Recorded as `F-10`: those records come from a session doing harness work, with
  the guards themselves changing between commits, under a Pause cadence no
  ordinary task has. Whoever writes the digest decides whether to separate them;
  the point is that the option is visible rather than buried.
- **D8's window is arithmetic on one prior rate.** The "~15 denials from 150
  events" projection rests on the baseline's approximate 4-in-38 validator
  rejection rate — a figure the baseline itself marks as approximate and
  possibly double-counted. If the hooks' real denial rate is materially lower,
  150 events will not settle the question and the window will need extending.
  That is a known risk, not a solved one.
- **D1's "self-inflicted" measure is a proxy.** A repeated input hash shows the
  same input was denied twice; it does not show *why*. Distinguishing "the model
  fixed the defect" from "the model worked around the check" still needs a human
  reading the pair. The instrumentation narrows the question; it does not answer
  it.
- **The 2.1.218 payload shape is a fact about one harness version.** `session_id`
  was read out of the shipped executable, not out of a published contract. A
  future version could rename it, and the brief's fallback chain
  (`input.session_id` → `CLAUDE_CODE_SESSION_ID` → `"unknown"`, counted and
  reported) is what keeps that from silently zeroing the window.
- **No claim about what the measurement will find.** The brief is built to be
  able to falsify Finding 1, including in the direction that porting the checks
  into hooks already fixed the self-inflicted half.

## Next-session snippet

> **The gate-economics note is promoted and its brief is executed.** Nine commits
> on `chore/gate-runtime-instrumentation`, **not pushed** — `origin` is seven
> behind at `8d12133`, and PR #131 was opened from there while the branch still
> held documentation only, so its title and body describe a state that no longer
> exists. Rewriting it and pushing are the owner's.
>
> **The gates now instrument themselves.** Five hooks append one JSON record per
> real decision to `.claude/telemetry/gates.jsonl`, gitignored and local to the
> worktree that produced it. Read it any time with
> `node .claude/hooks/gate-yield.mjs` — no arguments, and it reports the window
> state. Nothing is emitted by a hook that examined nothing, which is why a
> session of dozens of Bash calls produced twelve records.
>
> **The window is open at 12 of 150 events and 1 of 10 committing sessions**,
> whichever comes first. At close, `docs/explorations/gate-runtime-yield.md` is
> authored in a Mentor session through the write gate, and `gate-economics.md`
> gains one dated changelog line pointing at it. Read `F-10` before treating the
> early records as representative — the first session in the window is the one
> that built the instrument — and `F-9` for a grouping axis already present in
> the data.
>
> Green is `npx tsc -b && npm test` = 324 package tests (323 pass, 1 skip) + 112
> hook tests. A fresh worktree inherits the guards from `main`; confirm with the
> `G-HOOK-1` probe rather than assuming. Do not invoke `brief-validator`,
> `closer` or `pre-commit-self-audit` — tombstones; mechanical brief validation
> is `node .claude/hooks/validate-brief.mjs <brief>`.
>
> **`main` has no merge commits.** Use `git log -1 main`, not
> `git log --merges -1 main`, for a `Consumes:` line. Do not delete
> `experiment/harness-redesign`: `4ba57d7` is not reachable from `main` and the
> squash did not preserve its twenty front merges, so it is the only record of
> them.
