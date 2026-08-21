# Session recap — 2026-08-20 — jira-credentials-file (Orchestrator)

**Mode:** Orchestrator, pipeline transport: this session modelled the task,
authored the brief itself (caminho B), then drove `@executor` through ten gates.
**Consumes:** `5ee2a08` — head of `main` after #163, which merged the
`jira-credentials` exploration note this task consumed as Context.
**Branch:** `feat/jira-credentials-file`, 10 commits, unpushed.
**Produced:** `docs/tasks/2026-08-20-jira-credentials-file/` (brief,
run-instructions, notes), the credentials reader and its wiring, and the
promotion of two exploration notes.
**Card:** `JAC-28`, `Brief` field set to the brief's path; status left `To Do`.

## One-line summary

`jacurutu fetch` runs again on the owner's machine from a file instead of a
terminal's memory — but the session's reusable output is a failure class it hit
three times and finally named: **a sentence goes false when the thing it points
at changes, without the sentence being edited, and no diff can show it.**

## The decisions the brief closed, and the one that was reopened

Eight (D1-D8). Two carry the weight:

- **D2 — the file is the only source of the credential values.** The three
  `JACURUTU_JIRA_*` variables are deleted; there is no precedence rule because
  there is no second source. Reopened at the Edit-5 gate at the owner's request
  and closed unchanged, on an argument the brief had not written down:
  reversibility is asymmetric. Adding a fallback later breaks nobody; removing
  one later breaks whoever came to depend on it.
- **D3 — `expiresAt` is required.** It is the only reason this file beats the
  environment on anything except survival, and an optional field would be
  omitted on the first hand-seeded file.

D5 (no expiry gate, no warning) and D7 (the reader never writes, so `0600` is
structurally unavailable to a hand-seeded file) were both preserved as written.

## Ten gates, two rejections, and neither was mechanical

`validate-brief.mjs` returned APPROVED on the first run and stayed APPROVED
after the one post-hoc brief correction. Every mechanical check passed at every
commit. **Both rejections came from reading, not from a check.**

| Gate | Verdict | What was wrong |
|---|---|---|
| Edit 6, first presentation | REJECTED | A README sentence had become false without being edited |
| Edit 7, first presentation | REJECTED | The procedure could record a PASS without exercising this task's code |

The Edit-7 rejection is the more serious of the two. The run instructions said
"from the repository root" and there are five working trees; the obvious one is
on `main`, which still reads the retired variables. The failure chain ended in a
green result pasted for code the run never touched — and the cheapest escape
from its own error message (`Missing required env:`) was to re-export the three
variables, which is precisely the action that invalidates the result. The fix
made that message an unambiguous diagnostic: this branch's code cannot emit it,
so seeing it means one thing only.

## The failure class this session named

Three instances, all the same shape:

| Where | The sentence | What moved under it |
|---|---|---|
| `README.md` | "export, report and start --local read none of them" | the table lost three rows, so "them" acquired a new referent |
| `README.md` | a table cell reading `jacurutu start` | new prose two lines below said `start --local` |
| `local-storage-format.md` §3 | "Adding a per-file override **would make** three conventions" | this branch added it; the conditional became false |

None was caught by a check, and none could be: **the lines were unchanged, so
they were not in any diff.** The remedy the executor generalised without being
asked, and then applied twice more: after removing or reordering a list, read
the prose that points at the list — "delas", "as três", "would make" — because a
deletion silently re-binds every one of them. Read the file, not the diff.

## Checks that measure prose instead of code

Two of the brief's own verification checkboxes were defective, both mine:

1. `grep -cE 'writeFile|mkdir|chmod' <file>` returned 1 against a module that
   never writes. The hit was the module's own comment naming the identifiers the
   check forbids.
2. `grep -n 'JACURUTU_JIRA_CREDENTIALS_FILE' cli.ts` expects one line and gets
   two — the constant and the doc comment that names the variable it documents.

The executor's first instinct was to reword the comment. **The ruling was the
opposite: report it as a finding about the check and leave the prose alone.** A
check that dictates what a file may say about itself has stopped measuring what
it was written to measure. The second instance was reported and not engineered
around, so the ruling held.

## A defect the brief's own validator structurally could not see

The brief's Commit-sequence section asserted "every verb — `add`, `update`,
`promote` — is on the allowlist" while the sequence uses four, `wire` being the
fourth. `C11` passed at every run, correctly: it reads the sequence and measures
the verbs, never the prose *about* the sequence. **A check that validates a list
cannot validate a claim about the list.** Corrected as commit #10, an isolated
`docs(tasks):` outside the nine-Edit map, because inserting it into the map
would have been the structural deviation the brief calls a STOP.

## Estimate versus measurement, corrected once and held

At Pause 1 the executor reported the two longest commit subjects as 67 and 70
characters, inside a block shaped like a measurement. Both are 68. No rule was
broken — but it was counted by eye where doctrine says `wc -c`. Corrected once,
and every subsequent gate pasted the actual command output. The executor
extended the same discipline to the smoke's exit code without being asked: it
was not captured, and `notes.md` labels zero as *inferred* with the control-flow
citation rather than writing "exit 0" as a measurement.

## What the owner's question surfaced, outside the task

Mid-execution the owner asked whether every designer would have to hand-create a
JSON with a secret, annually. The answer is yes, and it exposed two board gaps
this task did not own:

- **`JAC-31` is under-priced.** Its "why" cites only the annual 401. The
  stronger argument — that without it no designer can onboard — is written
  nowhere, and the card carries no `Blocks` link to anything.
- **`oauth_client.json` has no card at all.** It is hand-placed from the Google
  Cloud Console, which is the second onboarding barrier and the one nobody is
  looking at.

Neither was acted on. Both are queue work, and the second is the one to open
first, because it is not even in the queue.

## Queue state

`JAC-28` is done pending merge; its `Brief` field points at the brief and its
status was deliberately left `To Do`. Nine follow-ups are recorded in the
executor's final report, three of which exist only because the smoke ran against
production data: 62 warnings against 200 issues, empty SUMMARY cells, and
`runFetch` failing with a bare Node `ENOENT` when the `--out` parent is missing.

## What this session did not verify

- **The expiry sentence has no live coverage** and structurally cannot get any
  until a token is actually rejected. Two offline unit tests are all it has.
- **The smoke's exit code was never captured.** Zero is inferred, and labelled
  as inferred.
- **No designer machine was tested.** The whole task was evidenced on one
  machine, by the one person who has ever run this CLI.
- **The 62 warnings were not investigated.** A third of a production result set
  is either a mapping problem or an over-eager warning; nobody looked.

## Next session

Push `feat/jira-credentials-file` and open the PR against `main` with the
template. After merge, move `JAC-28` to `Done` — that is the owner's explicit
go, not an inference from a merged PR. Then the first queue decision is whether
`oauth_client.json` gets a card before `JAC-31` gets its argument rewritten.
