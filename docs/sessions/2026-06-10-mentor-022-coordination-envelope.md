# Session recap — 2026-06-10 — mentor — 022-coordination-envelope

**Mode:** mentoring (scope decision) → modeling task (scope handoff to planner) →
plan/brief review → per-commit code review at Pause 3 → merge authorization.
**Mentor:** Claude Chat (this session).
**Pipeline (separate Claude Code session):** `@planner` (authored 022) →
`@brief-validator` (APPROVED 11/11) → `@executor` (executed, 4 commits).
**Continuation of:** `docs/sessions/2026-06-09-mentor-021-executor-pause-calibration.md`.

Brief 022 (coordination envelope serialization) was scoped, delegated via caminho A,
authored by the planner, validated, executed end-to-end with per-commit mentor review
at each Pause 3, and merged. This closes the deferred D3 half of brief 020: the full
v2.0 `Payload` is now assembled and written to `payload.json`, behavior-preserving
against the frozen seed. The session also produced one significant grounding
correction (`derivePath` out of coordination scope) and one process lesson (invented
SCOPE.md artifact — caught, reverted, rule reaffirmed).

## Decisions taken

- **D0 — Split envelope / Sheet adapter into separate briefs.** Envelope (022) is a
  self-contained close of the Jira line, acceptable with zero Sheet work; the Sheet
  adapter is a new-package effort on the scale of 020. **Brief 023 reserved** for
  `adapter-sheets` + `SheetGateway` implementation. → forward reserve declared.

- **Grounding correction — `derivePath` is NOT coordination scope.** The carried
  shorthand "envelope + derivePath" did not match disk: the seed coordination
  pipeline (`fetch.py` → `payload.json` → `sync.py`) never derives a Drive path.
  `derivePath(issue) → string` is a Phase-3 `[prod]` core function whose Drive
  hierarchy rule (separators, date format, missing-field fallback) is an open
  Phase-3 design item in `docs/ROADMAP.md`. Removed from 022 scope; stays Phase 3.
  P4-style grounding against seed+ROADMAP beat the carried recap shorthand
  (recap is state, not rule).

- **D1 — Port not reopened.** `JiraGateway.fetchIssues(): Promise<Issue[]>` stayed
  frozen (020/D2 holds). Envelope assembled outside the gateway: capturing sinks at
  the composition root (`IssueDropLog` → `FilteredOut`; `IssueWarningLog` →
  `PayloadWarning`, with mapper param `cause` → `PayloadWarning.issue`).

- **D2 — Pure assembler in core.** `assemblePayload(issues, filteredOut, warnings,
  meta) → Payload` added to `@saci/core` as a pure function with `node:test`
  coverage against the frozen `automation/payload.json`. Distinguished from the
  020/D2 landmine: that guarded *changes to existing port signatures*; additive
  pure functions in core are ordinary work. The brief's core STOP guard was scoped
  accordingly.

- **D3 — Sheet write OUT.** 022 writes `payload.json` to disk only. Sheet → 023.

- **D4 — Envelope shape frozen v2.0, behavior-preserving.** Exact mirror of
  `automation/payload.json`, no tidying. `run_date` = YYYY-MM-DD; `generated_at` =
  ISO with offset, seconds precision, no `Z` (seed `isoformat(timespec="seconds")`);
  `schema_version` = `"2.0"`.

- **Executor scope inference ratified.** `run-fetch.test.ts` was not named
  explicitly in Edit 4; the executor judged it in-scope (brief said "file(s)" and
  anticipated "cli if it gains a test") and surfaced the reasoning at Pause 3
  before committing instead of silently including or STOPping. Mentor ratified:
  authored intent, not scope creep. The surface-before-commit discipline (post-021)
  worked as designed.

## Execution summary (branch `feat/coordination-envelope`)

| # | Commit | Subject | Review note |
|---|---|---|---|
| 1 | 3ab1fc6 | docs(tasks): add brief for 022 (planner) | Validator APPROVED 11/11; all 3 judgment-flag guards installed |
| 2 | 771d121 | feat(core): add assemblePayload envelope assembler | Byte-identical to Pause-2 approval; no port signature touched |
| 3 | ca27836 | test(core): add assemblePayload coverage vs frozen payload | Full deepStrictEqual vs fixture + explicit `Object.keys` order assert; nullables grounded both polarities (MCA-62838, MCA-62539, MC-1049974) |
| 4 | `<hash>` | feat(cli): wire envelope capture and write payload.json | `stampMeta(now)` clock-injectable (offset sign inverted from `getTimezoneOffset()`, seconds precision, no `Z`); serialization fidelity proven by file read-back (`Object.keys(parsed)`, `ção` unescaped = `ensure_ascii=False`, indent=2, no trailing newline); sinks end-to-end `cause`→`warnings[].issue` via fake gateway |

- Builds green throughout; `node --test` core 7/0, cli 3/0; pre-commit-self-audit
  5/5 PASS on every commit; no dist/ leak, no credentials; `cli.ts` untouched.
- **PR `<#NN>`** — `<PR title>` — squash-merged into `main@<hash>`.
- Untracked `SCOPE.md` deleted from the working tree before execution (see lesson
  below); never committed.

## Process lessons

- **Invented conventions don't enter the repo — even from the mentor.** The mentor
  produced the planner handoff as a file artifact named `SCOPE.md` and embedded
  "save it to docs/tasks/" in the planner invocation. Neither the artifact type nor
  the filename exists in the established workflow (planner consumes a pasted
  *delegation*, not a versioned scope file; the scope record lives in the brief's
  "decisions already made" section + the session recap). Caught by the user;
  reverted; the stray untracked file was deleted, not committed — committing it
  would have minted an ad-hoc precedent in `docs/tasks/` ripe for future
  pattern-matching drift. Standing rule reaffirmed: **caminho-A handoff = inline
  snippet/delegation in chat by default; file artifacts only for briefs (caminho B),
  recaps, and byte-exact/non-markdown deliverables.**

- **Planner grounding over delegation detail.** The delegation named the
  `IssueWarningLog` third param `issue`; disk says `cause`. The planner grounded
  against disk, kept the correct serialized target (`PayloadWarning.issue`), and
  the validator pre-flagged the name mismatch so execution wouldn't mistake it for
  a deviation. Pipeline behaving as designed.

- **Test key-order assertions need `Object.keys`, not just `deepStrictEqual`** —
  deep equality is key-order-insensitive; serialized-output order must be asserted
  on the read-back parse.

## Pending items

### Product line

- **Brief 023 — `adapter-sheets` / `SheetGateway`** (reserved this session). Next
  product brief; new-package effort, caminho A.
- **`derivePath`** — Phase 3 `[prod]`; open design item: Drive hierarchy rule
  (separators, date format, missing-field fallback). Decide in chat before any
  brief touches it.
- **`parent_summary` parking-lot** — JQL search endpoint omits inline parent
  summary; stays `""` (behavior-preserving). Candidate: populate from
  parent-search in a future brief. Separate docs PR for the roadmap parking-lot
  entry (carried from 020).
- **Latent, non-blocking:** `stampMeta` inherits machine TZ (as does the seed —
  same behavior class); fine for the single-operator context. Noted only so a
  future multi-machine setup revisits it consciously.

### Meta backlog (carried, untouched this session)

- AGENT_PLAYBOOK: document the planner→validator mentor-review gate (evidence
  019/020/021 — strong).
- `executor.md` / docs: "resume scoped to remaining Edits" pattern + find-block
  mismatch hazard.
- M-R15 wording: "planner itself or its skills" → "pipeline agents or their
  skills".
- `customfield_`/grep tightening in SKILL.md; `## Judgment flags` mentor-side doc;
  orphaned E4; C11 hygiene; "old 013" parking-lot.

### Operational

- Post-merge cleanup: `git branch -D feat/coordination-envelope` (squash orphan).
- Re-upload canonical files changed by the 022 PR to claude.ai project knowledge
  (none of the canonical docs changed in 022 — app code only — so the re-upload
  set is this recap once merged, plus any ROADMAP touch if the 023 reserve gets
  written down).
- This recap to be reviewed and merged via separate docs PR per convention.

## Artifacts produced

- **Branch `feat/coordination-envelope`** — 4 commits, squash-merged via
  PR `<#NN>` into `main@<hash>`.
- **New code:** `packages/core/src/assemble.ts` (+ index re-exports),
  `packages/core/src/assemble.test.ts`, `packages/cli/src/run-fetch.ts`,
  `packages/cli/src/run-fetch.test.ts`.
- **This recap file** — `docs/sessions/2026-06-10-mentor-022-coordination-envelope.md`.
