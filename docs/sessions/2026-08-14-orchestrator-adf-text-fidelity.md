# Session recap — 2026-08-14 — adf-text-fidelity (Orchestrator)

**Mode:** Orchestrator, opened on an unscoped question ("what is there to do
today"), then board triage, then task modeling, then caminho B. The same
session executed the brief it wrote; the executor half is recorded separately.
**Consumes:** `19bdafc` — head of `main` when the session opened, and the
verified base of the branch. Confirms the merge of PR #142.
**Branch:** `fix/adf-text-fidelity`, cut from `19bdafc`. Three commits, plus
these recaps. **Not pushed; no PR opened.**
**Produced:** `docs/tasks/2026-08-14-adf-text-fidelity/brief.md`, the fix in
`packages/adapter-jira/src/extract.ts`, the F6 closure in
`docs/explorations/jira-copy-locality.md`, and these recaps.
**Pairs with:** `docs/sessions/2026-08-14-executor-adf-text-fidelity.md`.

## One-line summary

F6 is closed, and the modeling found that the finding as recorded was two
defects in two repositories rather than one defect in one — the half that lives
here shipped, the half that lives in the laboratory did not and could not.

## The triage that chose the task

Five candidates were on the board at session open. Three were blocked and two
were not:

| # | Item | Verdict at triage |
|---|---|---|
| 1 | Suindara engine port | Blocked on the scope re-cut question, unanswered since 2026-08-13 |
| 2 | Drive-scope decision | Blocked — owner's, and stacked behind a second `.docx` blocker |
| 3 | **F6 — ADF line breaks** | **Chosen.** Code, measured, no pending decision |
| 4 | Transport rule + `E8` | Available; needs an R4 diagnostics carve-out first |
| 5 | F3 — 26% of cards with no copy pointer | Doubtful: the note itself says the *why* cannot be inferred from Jira |

The owner chose #3 with a stated reason — the workflow half of the product,
automatic and manual, is what Saci still has to control — and named the next
task in the same message (Jira auto-login, on the model of the Google auth).

## Decisions closed with the owner

| # | Decision |
|---|---|
| D1 | Nine ADF block types end a line; `hardBreak` too. Declared as a named constant (R7) |
| D2 | Inline runs join with the empty string. **Carried into this brief rather than deferred** — the owner's call at the modeling gate |
| D3 | Output normalized per line: trim, drop empties, single break |
| D4 | The Python seed is not a constraint; nothing in `automation/` is read or modified |
| D5 | Commit verb is `support`. `preserve` is more precise and sits on neither list, which is a C11 STOP |

## What the measurement found before a line was written

1. **`adfExtractText` has zero production callers.** `navigation.ts` imports
   its two siblings, not it. This is the same callerless shape the 2026-08-13
   session flagged in the port's scope C — declared in the brief's Context
   rather than discovered mid-execution, and it is why the Done criteria
   promise unit evidence only.
2. **The note recorded one defect; the join produces two.** The inline
   space — two text nodes split by a mark, rejoined with a space the source
   never had — is not in `jira-copy-locality.md` at all. It cannot be fixed
   separately: it is the same `join(" ")`.
3. **F6 spans two repositories.** The frame regex has **0 sites here**
   (`grep -rn 'L\\d'` over `*.ts`, `*.mjs`, `*.py` returns one fixture URL).
   It lives in the Suindara laboratory and arrives with the port. Only the
   extractor half was actionable today, and the recap of 2026-08-13 calling F6
   "brief-shaped" was therefore half right.
4. **The existing test pinned the defect by name** —
   `"adfExtractText concatenates text nodes with single spaces"` — so the fix
   had to delete a green test, not just add one.

## A standing ruling the owner gave mid-session

`automation/` is no longer the source of truth for experimentation; the Python
laboratory of record is the `buraqueira` repository. Applied immediately in
this brief (D4 and the out-of-scope list). **Consequence not resolved:**
`CLAUDE.md`'s Architecture section still names `automation/` as the permanent
laboratory lane, and `R26` repeats it. Both are false as of today and are a
doctrine task, queued, not started.

## Gate outcome

`validate-brief.mjs` returned **APPROVED 11/11 on the first run** — no
rejection cycle. The brief measures **320 lines** against Category M's ~350
ceiling; counted with `wc -l`, not estimated, which is the specific lapse the
two previous orchestrator recaps each recorded as their own first error.

P4 ran clean on all four sources for the slug `adf-text-fidelity`: 0 in
`ls docs/tasks/`, 0 in `git log --oneline main`, 0 in a grep across `CLAUDE.md`
and `docs/`, 0 across branches and worktrees.

## What this session got wrong

1. **The brief shipped an internal contradiction.** Pause 2 was placed "after
   the first modified file" while non-negotiable constraint 4 required a green
   tree at every pause. With `extract.ts` fixed and its test not yet rewritten,
   `npm test` fails and `green-boundary.mjs` blocks the turn that would present
   the pause. Execution hit it within minutes. The constraint that caught it
   was in the same brief, four sections earlier — writing both and noticing
   neither is a review failure, not a knowledge gap.
2. **The brief specified the function's doc comment and forgot the file's own
   header**, which claimed a behavior-preserving port and named
   `adf_extract_text` among the ported functions. Execution had to extend
   scope by three lines to keep the file from carrying a false statement.
3. **A subject length was reported as 63 characters at a gate; it is 65.** No
   consequence — the budget is 72 — but it was stated as a count and was not
   one.

Items 1 and 2 share the root the 2026-08-13 recap already named: the checks
nobody runs before trusting them.

## Open items carried forward

- **The Suindara port is still blocked** on the same unanswered scope question.
  Nothing today changed it, except that the extractor it will sit on is no
  longer lossy.
- **`CLAUDE.md` and `R26` are stale** on the laboratory lane, as of today's
  ruling. Doctrine task, unwritten.
- **F3** — 26% of cards with no copy pointer — remains open and brief-shaped,
  and the note now says so explicitly.
- **The transport rule** still needs its R4 diagnostics carve-out and the next
  free rule number. **`E8` remains free and unwritten.**
- **The Drive-scope decision** remains the owner's, unchanged in urgency.
- **`adfExtractText` still has no caller.** The fix is correct and unexercised
  outside its tests.

## Next session

The owner named it in this session: Jira authentication on the model of the
Google OAuth flow — today `saci fetch` reads `SACI_JIRA_*` from the
environment, while `adapter-drive` runs a loopback OAuth flow with credentials
under `~/.saci/`. Suggested opener:

> Continuing Saci in an Orchestrator session. Mode: task modeling — bring Jira
> authentication onto the same footing as the Drive OAuth flow. Read
> `docs/sessions/2026-08-14-orchestrator-adf-text-fidelity.md`,
> `docs/explorations/drive-oauth.md`, the three `SACI_JIRA_*` reads at
> `packages/cli/src/cli.ts:25-27` and the pre-flight at
> `packages/cli/src/run-fetch.ts:185` first. The open question before any
> brief: does Jira get a
> stored-credential flow of its own, or does `~/.saci/` become one credential
> store both adapters read?
