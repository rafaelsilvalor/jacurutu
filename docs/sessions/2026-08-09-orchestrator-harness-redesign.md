# Session recap — 2026-08-09 — harness-redesign (Orchestrator)

**Mode:** exploration on a long-lived accumulating branch, with the process
rules deliberately relaxed by the owner — the session was redesigning the very
rules it would otherwise have followed. Pauses were dropped as formal
presentations; push, destructive actions and the green boundary were not.
**Consumes:** `main@073f2ea` — PR #128, the Jira read-path credential guard.
**Branch:** `experiment/harness-redesign`, 21 commits, 8 sub-branches merged
with `--no-ff`. Not pushed. Not merged to `main`.

## One-line summary

The harness was measured, and the measurement inverted the plan: the problem
was never too many gates, it was semantic gates carrying mechanical work — so
the mechanical work became code and the gates stayed.

## The branch model, which is not in GIT_WORKFLOW.md

`experiment/harness-redesign` **accumulates**. Work happens on sub-branches cut
from it, merged back with `--no-ff`, and it reaches `main` only when the whole
redesign is done. This contradicts `docs/GIT_WORKFLOW.md`, which says "one
in-flight branch at a time" and describes only sub-branch → `main`. It was the
owner's explicit instruction at session open, which outranks the document
(`PROCESS_MAP.md` §9.1), but it is written nowhere in the repo. **A session
reading only the doc will get this wrong.** If the model is adopted
permanently it belongs in `GIT_WORKFLOW.md` as its own task.

## What the measurement said

`docs/explorations/gate-economics.md` is the baseline and the reasoning. The
short version, because it is what changed the plan:

- 129 merges into `main`: 96 `docs`, 15 `feat`. Process-touching commits beat
  product commits 45 to 21, and that ratio held flat across the repository's
  whole life — a steady state, not a bootstrap curve.
- The **mechanical validator had low, half-self-inflicted yield**: 4 REJECTED
  in ~38 runs, two of them the validator tripping over its own extraction rules.
- **Pauses 2 and 3 had high yield** — at least 12 recorded catches, including
  ones no check could make ("caught at Pause 3 by reading the files, not by any
  check").
- There is no such thing as "a gate". There are three: mechanical filters,
  semantic filters, and decision points. Cutting gates by intuition would have
  removed the highest-yield layer.

## What was built

| Artifact | What it does |
|---|---|
| `.claude/hooks/commit-guard.mjs` | commit subject, type, verb, trailer — on `Bash` **and** `PowerShell` |
| `.claude/hooks/architecture-guard.mjs` | R25, R21, R24, R5/E6, secret scan, over the staged diff |
| `.claude/hooks/docs-guard.mjs` | path references resolve; pt-BR off English-only surfaces |
| `.claude/hooks/file-ownership.mjs` | `@code` cannot write tests, `@test` cannot write source |
| `.claude/hooks/green-boundary.mjs` | `tsc -b` + `npm test` before a turn may end |
| `.claude/hooks/validate-brief.mjs` | C1–C11 as a CLI |
| `.claude/agents/test.md`, `code.md` | the pair, for work that carries tests |

61 hook tests. The three retired artifacts had zero.

## What was retired, and what that cost

`pre-commit-self-audit`, `brief-validator` and `closer` are **tombstones**.
They still exist at their paths, say "do not invoke", and map where each check
went. Do not invoke them.

Two coverage gaps were accepted rather than papered over:

1. **Self-audit Check 5** — staged scope against the brief's declared edit
   scope. Its input came from the brief, which a hook cannot read. In the
   `@test`/`@code` lane the ownership hook is stronger; in the executor lane it
   falls back to Pause 3.
2. **The closer's judgment half** — R18 storage routing, R19 registry dispatch,
   R6's orchestration exception, R4 with N1, duplication against `core`. No
   successor. Encoding them badly is worse than not encoding them (A3).

`N1`–`N3` retired with the closer.

## What survived, against the plan

**The executor stays.** The session intended to retire it once a "docs lane"
existed. That was wrong, and the reasoning is worth keeping: the `@test`/`@code`
pair works because a test is a deterministic oracle one agent holds and the
other cannot touch. **Docs have no oracle.** A claim can be false while every
path it names resolves — the doctrine said "five mechanical checks run by the
executor" about a directory that existed and had become a tombstone. The docs
lane is a verification layer, not an agent replacement. Docs work stays on the
executor path.

## Proof the loop works

The pair produced one real product fix: Q4 of the 2026-08-09 task notes, wiring
`verifyCredentials` into `runStart`. A 16-line requirement replaced what had
been a 758-line brief for the same line of work. `@test` wrote three tests, two
failing for the right reason; `@code` made them pass on a fresh context without
seeing the requirement. Production diff: one line of code.

That commit is `b9804fe` here, and was cherry-picked onto
`fix/start-credential-guard` from `main` — self-contained, green, awaiting the
owner's push and PR.

## Rules changed

- **E6** — test files are measured against a 1:1 subject module, not R5's
  400-line budget. The 1:1 mapping is the precondition; 800 is a ceiling whose
  finding points at the subject.
- **E7** — the root `README.md` is pt-BR and stays pt-BR. One file, not a
  filename: `docs/explorations/README.md` is doctrine and stays English.

Numbering trap found while writing them: `E4`, `E8` and `E9` are **cited as
live** in `PROCESS_MAP.md` and elsewhere without ever being defined in
`CLAUDE.md`, and `E4` collides with a different namespace in
`AGENT_PLAYBOOK.md`. The next free number is **E10**; the note in `CLAUDE.md`
says so and says why.

## Open decisions — none of these is in flight

1. **The dead reference** at `docs/explorations/mentor-lane-and-task-identity.md:54`
   (`harness/workflows/setup-chat.md`). Left deliberately: notes are amended by
   a Mentor session or a brief that scopes them, not during unrelated work. It
   is the only finding the docs guard reports across 72 documents.
2. **The exception namespace** — `E4`/`E8`/`E9` cited without definition.
3. **The special branch itself** — 21 commits, unpushed. It needs a PR against
   `main` eventually, or decisions about what leaves earlier by cherry-pick.
4. `retire` was **considered and rejected** for the verb allowlist: `deprecate`
   is sufficient, and the allowlist's value is that it stays small. Recorded so
   the question is not reopened from zero.

## What went wrong in how this session ran

Seven fronts ran in one session with no rotation. The intended cadence was
merge → recap → new session, to keep context under control; it happened zero
times. This recap exists because that context would otherwise die with the
session. The lesson is about cadence, not about the work: a front that ends
green with no loose ends is a cheap place to rotate, and there were seven of
them.

## Next-session snippet

> Continue `experiment/harness-redesign` (21 commits, unpushed, green:
> `npx tsc -b && npm test` = 324 package tests + 61 hook tests). Read
> `docs/explorations/gate-economics.md` first — it is the measurement the whole
> redesign rests on. The branch accumulates: cut sub-branches from it, merge
> back with `--no-ff`, and it reaches `main` only when complete. Do not invoke
> `brief-validator`, `closer`, or `pre-commit-self-audit` — they are tombstones.
> Four open decisions are listed above; none is in flight.
