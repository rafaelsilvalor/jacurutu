# Session recap — 2026-08-09 — fetch-credential-guard (executor)

**Mode:** executor run — full pipeline path (planner-authored brief,
brief-validator APPROVED 11/11 at `03a6471`, owner go at the Orchestrator gate).
**Brief:** `docs/tasks/2026-08-09-fetch-credential-guard/brief.md` (Category L,
Plan required: yes), branch `fix/fetch-credential-guard`, cut by the planner
from the verified base `b252d37` (= `origin/main`, PR #127), executed in the
session worktree.
**Pairs with:** `docs/sessions/2026-08-09-orchestrator-fetch-credential-guard.md`.

First `packages/` work since brief 047; first task under the dated identifier
that touches code rather than docs.

## Run shape

- Pause transport: STOP-and-return, single-block presentations; owner approvals
  relayed as continuation messages. Zero Pauses crossed without an explicit
  relayed go. One Pause 1 (`Plan required: yes`), one Pause 2 (after Edit 2,
  carrying the Edit 5 bundle question), and **six Pause 3 presentations for four
  gated commits** — commit #4 was presented three times (see "The G-JIRA-1
  rework").
- Four evidence-closes, each a verbatim `git log -1 --format=%B` pasted in the
  turn's final message block. 4/4 matched the approved bytes; zero amends, zero
  trailers.
- The no-debt precondition was honored literally: after commits #2, #3 and #4
  the run stopped on the evidence-close and did not open the next Pause until
  the paste was confirmed. Three extra round trips, upheld each time. Edits were
  written during those turns — work advanced, Pauses did not.
- `pre-commit-self-audit`: **6 invocations, 30 checks, 30 PASS / 0 WARN /
  0 FAIL.**
- Green boundary before all four commits, run by hand: `core.hooksPath` is unset
  in this clone, so the G-R8 hook never fires and the protocol rule is the only
  guarantee. Run on the two docs-only commits as well — the rule is
  unconditional.
- **G-NODE-2 checked and cleared before Edit 1**, not assumed: `node_modules/`
  already existed at the worktree root and `readlink node_modules/@saci/*`
  resolved `core`, `adapter-jira` and `cli` to this worktree's own `packages/`,
  not to the main checkout. No `npm install` was needed and no lockfile drift
  was possible.

## Commits

| # | SHA | Subject | Files (+/-) |
|---|---|---|---|
| 1 | `03a6471` | `docs(tasks): add brief for 2026-08-09-fetch-credential-guard` | brief.md (758) — planner's, verified not created |
| 2 | `9abafb2` | `feat: add a Jira credential pre-flight to the gateway port` | 6 files (192/2) |
| 3 | `2639d89` | `feat(cli): add the non-destructive payload write to fetch` | 5 files (342/6) |
| 4 | `63441b2` | `docs(gotchas): document the localized Jira error messages` | GOTCHAS.md (13/0) |
| 5 | `83ad6f9` | `docs(roadmap): update the credential guard item to shipped` | ROADMAP.md (3/1) |

Total against `b252d37`: 13 files, 1308 insertions, 9 deletions. Every file is
inside constraint 1's list, with `docs/GOTCHAS.md` added to it by the owner's
Pause 2 approval of Edit 5. `packages/cli/src/run-start.ts` appears in no diff
of the branch — D3 held.

## Edits, in the order they ran

**Edit 1 — verification, no commit.** Branch `fix/fetch-credential-guard` with
no upstream; exactly one commit in `b252d37..HEAD`; brief present with the
expected first line; tree clean. Baseline measured before touching anything:
`npx tsc -b` exit 0, `npm test` 305 / 304 pass / 0 fail / 1 skipped — matching
the figure carried in from `b252d37`.

**Pause 1 — numbered plan.** Carried the full port-ripple enumeration the
brief's justification asked for. Swept `packages/*/src/` for `JiraGateway` and
for `fetchIssueByKey` (the more reliable fake detector, since every fake of the
port must implement it): exactly three ripple points, exactly the three the
brief predicted — the adapter class and the two in-memory object-literal fakes.
No fourth fake existed. `cli.ts` and `gateway.test.ts` construct the real class
and inherit the new method for free.

Returned: plan approved as written; D4-D8 stay closed, none reopened; no
delegation test in `gateway.test.ts` (a test proving a delegation line delegates
verifies the language, not the behavior — the six `http.test.ts` cases are the
real coverage). `gateway.test.ts` was left untouched for the whole run. The
extra per-`fetch` round trip the pre-flight costs was accepted in advance.

**Edit 2 — port + implementation + ripple + tests.** Four production files and
two test files moved together because they are one compile unit. The port gained
`verifyCredentials(): Promise<void>` above `fetchIssues`, interface-only.
`http.ts` gained `MYSELF_PATH`, a `CREDENTIAL_REJECTED_STATUSES` set, and the
method. `gateway.ts` gained the delegation above `fetchIssues`, deliberately not
called from inside it. The `run-fetch.test.ts` fake resolves; the
`run-start.test.ts` fake throws, matching that file's existing convention for
methods the start run never exercises.

**Pause 2 — first modified file + the Edit 5 confirm question.** Presented
`packages/core/src/gateways.ts` (the first file changed) plus the substantive
`http.ts` method, the green counters, and three questions. Returned:

1. **Edit 5 — add it.** Write `G-JIRA-1` to `docs/GOTCHAS.md` in the existing
   `### G-CAT-N` format, add the `G-JIRA` row to the Categories table, ship as
   its own commit before the ROADMAP one.
2. **MYSELF_PATH divergence — keep the interpolation** in both places rather
   than re-typing the literal path to satisfy the checkbox.
3. **Stale comment — bundle it.** I had found that `JiraHttpClient`'s class doc
   said "One method, `searchJql`" — already wrong since `getFields` arrived in
   brief 029, and made worse by my own diff taking the class to three methods. I
   did not fix it silently; I surfaced it with three options. The owner chose
   bundle: it is a `feat` commit, not a `refactor`, and the comment describes
   exactly what the diff changes, so A2 does not apply. One sentence, no
   widening.

**Edit 3 — wiring in `runFetch`.** `await gateway.verifyCredentials()` between
`makeGateway(...)` and `fetchIssues()`, no `try`, so a rejected credential rides
to `main()`'s catch and `EXIT_RUNTIME` with no new exit code. Fourth positional
`allowEmpty` per D6. Module-private `priorIssueCount` per D8, with `isRecord` /
`hasIssuesArray` / `isEnoent` / `describeError` helpers — narrowed from
`unknown`, no cast to `any`. Four anomalous shapes each log; ENOENT alone
returns silently, with the one-line `why` the brief required for a non-logging
branch.

**Edit 4 — CLI surface and tests.** `--allow-empty` joined the shared
`CLI_OPTIONS`, `CliValues`, the `fetch` variant of `ParsedCommand`,
`routeCommand`'s return and the wrapped `USAGE` line; `cli.ts` passes the clock
explicitly. Three `argv.test.ts` cases, plus `allowEmpty: false` added to the
three pre-existing `deepStrictEqual` fetch assertions that the widened shape
would otherwise have broken. Seven new `run-fetch.test.ts` cases.

Edits 3 and 4 shared one commit and one Pause 3, as the brief's commit sequence
prescribes.

**Edit 5 — the GOTCHAS entry.** See below; this is where the run's rework
happened.

**Edit 6 — the ROADMAP line.** Single hunk, line 226 only. `grep -c 'Credential
guard on'` = 1, `grep -c 'shipped in brief'` = 5 (the four pre-existing plus
this one), everything from 227 onward untouched including the
`python-laboratory-lane.md` citation.

At Edit 6's Pause 3 the owner asked whether to re-wrap the bullet, whose reflow
leaves `answers` alone at the end of a line. I chose to keep it and said why:
the brief does not say "mark it shipped", it prints the three-line replacement
verbatim, ragged line included, and declares 227 onward untouched. Re-wrapping
would have meant swapping a prescribed artifact for one I preferred without
passing it by the owner — and, as the owner then confirmed, pulling `answers`
up would have required reflowing the very lines the Edit declares off-limits.

## Green before each commit

| Commit | `npx tsc -b` | `npm test` |
|---|---|---|
| baseline `b252d37` | exit 0 | 305 / 304 pass / 0 fail / 1 skipped |
| #2 `9abafb2` | exit 0 | 311 / 310 / 0 / 1 |
| #3 `2639d89` | exit 0 | 321 / 320 / 0 / 1 |
| #4 `63441b2` | exit 0 | 321 / 320 / 0 / 1 |
| #5 `83ad6f9` | exit 0 | 321 / 320 / 0 / 1 |

Net: **+16 tests, +16 passing, 0 failing**, skipped unchanged at 1. Six in
`http.test.ts`, three in `argv.test.ts`, seven in `run-fetch.test.ts`.

Two assertions carry the value of the code commits, and both are behavioral
rather than structural:

- **Ordering.** The pre-flight test's fake throws from *both* methods with
  distinguishable messages, and the test asserts the `verifyCredentials` error
  is the one that surfaces. Remove the pre-flight call, or move it after the
  search, and the `fetchIssues` error surfaces instead and the test fails. It
  also asserts the output file was never created.
- **Byte-identity.** The refusal test compares the file after the rejection
  against the exact string it seeded, not against a re-parse — so truncation,
  rewriting and reserialization all fail it, not only "still has one issue".

Smoke test against the freshly built `dist`: `node packages/cli/dist/cli.js
fetch` exits 2 and prints usage carrying `[--allow-empty]`.

## The G-JIRA-1 rework — two Pause 3 emissions for one commit

The only rework of the run, and it was mine to own.

**What I shipped first.** The entry's Cause asserted a mechanism: "Atlassian
renders REST error bodies in the *account's* language preference... The locale
lives on the Atlassian account behind the credential." Its Cause and Evidence
also placed the observation on "an English-speaking developer's terminal" and
"an English-locale developer machine".

**Why it came back.** Both claims are things the measurement cannot have
observed. The probe ran with an **invalid** credential and, in one case, with no
`Authorization` header at all — so there was no authenticated account for the
response to follow, which makes "it comes from the account behind the
credential" precisely the explanation that measurement cannot support. And
nobody measured the machine's locale; it is a Brazilian Windows box with a fair
chance of being pt-BR. Plausible inference presented as measured fact, in a
reference document — the exact failure mode the entry itself exists to warn
against.

**What the corrected version says.** Cause now opens "Not established — and that
is exactly the point", separates what *was* observed (no `Accept-Language` sent;
`400` in Chinese regardless; status stable, prose not) from the account
hypothesis, and kills the hypothesis with the fact that defeats it. The
machine-locale claim is gone from both sections and the Evidence says so
explicitly rather than silently dropping it. Workaround and title were left byte
for byte; grep confirmed the three rejected strings were at zero.

**The tail I raised myself.** With the account mechanism removed from Cause and
Evidence, it was still implicit in the Symptom three paragraphs above ("on
another operator's account the same failure arrives worded in another
language"). I was told the Symptom stayed as written, and it would have been
easy to shelter behind that instruction. I flagged it instead, with the exact
four-word replacement ready. Approved: it now reads "on another machine, or
another day". The lesson is cheap and general — when you remove a claim from a
document, grep the document for the claim, not just the paragraph.

The commit message needed the same correction: its second paragraph had repeated
the inferred cause. It was rewritten alongside, and a third paragraph now records
*why* the entry refuses to explain the mechanism.

## Verification checkboxes not met as worded — 2

Both were reported with the measured number at their Pause and accepted; neither
file was bent to fit.

1. **Edit 2** — "`grep -n 'MYSELF_PATH'` shows the constant declared at module
   top and **used once**". Real: **3 lines** in
   `packages/adapter-jira/src/http.ts` — declaration at 13, the URL at 119, and
   the error message at 132. The brief's own reference wording for that message
   includes the path; writing the literal a second time would create two copies
   that can drift, which is what R7 exists to prevent.
2. **Edit 4** — "`grep -c 'allow-empty' packages/cli/src/argv.ts` returns 3".
   Real: **4** (lines 16, 73, 95, 236). The checkbox enumerated `CLI_OPTIONS`,
   `CliValues` and `USAGE` and forgot the fourth line Edit 4a itself prescribes,
   `allowEmpty: values["allow-empty"] ?? false` inside `routeCommand`.

Both are defects in the checkbox text, not in the code. No other checkbox in the
brief went unmet.

## Declared omission — 1

**Edit 4d's optional no-read assertion** (that the happy path does not read the
prior payload) was skipped. Proving a *non*-read requires injecting an `fs` seam
into `runFetch` that does not exist today; the brief authorizes skipping rather
than "building a read-spy for one assertion". A seam used by exactly one
assertion is machinery that mostly verifies itself.

The property is guaranteed structurally instead, and is legible in the diff: the
read sits inside `if (payload.issues.length === 0 && !allowEmpty)`, with a
comment saying so. Constraint 6 is satisfied by construction rather than by
assertion.

## Findings queued, not fixed

Six, recorded by the Orchestrator in
`docs/tasks/2026-08-09-fetch-credential-guard/notes.md`. Not restated here.

The one worth naming as *process*: the ROADMAP item's pre-existing "when the
token has expired" is the same defect class as the G-JIRA-1 Cause above —
inference standing where a measurement should be — but it arrived from brief
2026-08-08 and Edit 6 declares itself "mark it shipped and change nothing else".
It was reported at the Pause and left alone. Two instances of one defect class in
one run, one of them mine, is the kind of pattern worth watching rather than
filing twice.

## Handoff state

- Branch `fix/fetch-credential-guard`, 5 commits ahead of `origin/main`, working
  tree clean apart from the untracked `notes.md` and the two recaps, which the
  Orchestrator commits together.
- **Not pushed.** `git reflog | grep -c push` = 0; `git branch -vv` shows no
  upstream (R17 / G-R5).
- No `STATE.md` created — constraint 3 of the brief waives it for a
  single-session task despite the L sizing. Nothing landed on
  `claude/tarefas-do-dia-2badf8`.
- Next: PR against `main` using `.github/pull_request_template.md`, on the
  owner's per-branch instruction.
- The guard is on `fetch` only. `runStart` still does not call the pre-flight it
  inherits from the port, so `saci start` with a bad token continues to die with
  `expected exactly one issue, got 0` — the wrong cause, exactly as before. That
  is D3 working as designed, and it is the next brief in this line.
