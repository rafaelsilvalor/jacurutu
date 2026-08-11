# Session recap — 2026-08-11 — gate runtime instrumentation (Orchestrator)

**Mode:** Orchestrator, Plan mode. Decisions closed with the owner one at a
time, then delegated. No code was written and no product file was touched.
**Consumes:** `4b43cc8` — the harness redesign, landed via PR #130. See the
correction below: this SHA cannot be produced the way the previous recap says.
**Branch:** `chore/gate-runtime-instrumentation`, cut from `4b43cc8` with the
owner's explicit approval. One commit, `989cb8a`. **Not pushed.**
**Produced:** `docs/tasks/2026-08-11-gate-runtime-instrumentation/brief.md`, the
promotion of `docs/explorations/gate-economics.md` into a mandate. Item 3 of what
the harness redesign still owed is now specified rather than owed.

## One-line summary

The baseline note's own successor became a brief: thirteen closed decisions that
make every mechanical verdict the five hooks reach durable, so Finding 1 can be
re-tested against runtime data instead of against prose written by the sessions
being measured — and the two findings worth keeping came from refusing to take
an assertion on trust, once by the planner and once at the gate.

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
  correction above), `chore/gate-runtime-instrumentation` (this task, one
  commit, no upstream), `docs/spike-art-chain` (another live session), and two
  `claude/*` scaffolding pointers. Nothing was deleted; `G-GIT-1` was never
  approached.
- **Worktrees:** four registered — `main`, this one, `harness-redesign-exploration`
  and `jira-google-art-generator`. The two empty directory entries the previous
  recap expected to vanish, `brief-052-task-cutover-278d50` and
  `exploracao-branch-especial-437e38`, are **still present**: the prediction that
  they would delete once those sessions closed has not come true, and the cause
  was never verified by inspecting process handles.
- **Green:** unchanged from the numbers above. Nothing in `packages/` was
  touched.
- **Not pushed.** The push and the PR are the owner's.

## What this session did NOT establish

- **Nothing was executed.** The brief is a mandate, not an outcome. No hook
  emits anything today, `.claude/telemetry/` does not exist, and
  `gate-economics.md` still carries `Disposition: open` — the promotion to
  `promoted to brief 2026-08-11-gate-runtime-instrumentation` is Edit 6 of the
  brief, deliberately not performed here. Promoting the disposition before the
  work exists would record a state that has not happened.
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

> **The gate-economics note is promoted.** Its brief is
> `docs/tasks/2026-08-11-gate-runtime-instrumentation/brief.md`, committed as
> `989cb8a` on `chore/gate-runtime-instrumentation`, validated 11/11 APPROVED,
> **not pushed**. If it has not merged yet, the owner's push and PR are the next
> step; nothing else waits on anyone.
>
> To execute it, invoke `@executor` against that brief. `Plan required: yes`, so
> Pause 1 is mandatory — and the thing to present there is the order in which
> five live hooks get rewired while those same hooks gate the commits doing the
> rewiring. Edit 2 must land before Edit 5 or Edit 5's commit is denied.
>
> Green is `npx tsc -b && npm test` = 324 package tests (323 pass, 1 skip) + 61
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
