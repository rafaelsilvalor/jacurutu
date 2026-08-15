# Brief: 2026-08-15 — Google Sheets report spike for adapter-sheets

> **Category:** M
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/spike-sheets-report`

---

## Context

The owner reversed the Sheets sentence on 2026-08-14: the spreadsheet becomes a
**report for the team**, read by people who never run Saci, and Saci is to create
spreadsheets and share them inside the Google workspace (`CLAUDE.md`,
`docs/ROADMAP.md` 2026-06-12 supersession, and
`docs/explorations/python-laboratory-lane.md`). That gave `adapter-sheets` the
concrete consumer its parking decision was waiting for.

Nothing is built. `packages/adapter-sheets/src/index.ts` is a three-line Phase 1
shell. This is a **directed research spike**, modeled on brief 046: no product
code is created or modified, and the exit artifact is a decision note that
unlocks the first implementation brief.

**The spike exists because a claim now on `main` is unverified.** `CLAUDE.md`
states that create-and-share "exceeds `adapter-drive`'s current OAuth scopes, so
the first brief carries an authorization change, not only code". That was written
as a certainty and is an assumption: `drive.file` is per-file access to files the
app creates, which may already cover creating a spreadsheet and sharing it. The
cost of being wrong is asymmetric and falls on users — under `G-DRIVE-1`, every
scope change invalidates `~/.saci/token.json` and forces every existing user
through browser consent again. Measuring before widening is the whole point of
this task.

**Size note.** At 359 lines this sits about 9 over the ~350 guidance for Category
M, and it does not split. The probe, its run instructions and its findings are
one another's evidence: a PR delivering the script without the answers closes on
nothing, and a findings PR with no script in the record cannot be re-run. Brief
046 kept the same four artifacts together for the same reason. The overage is the
five-question table and the seven decision blocks, which are substance.

Context inputs (read all before starting):

1. `docs/explorations/drive-oauth.md` — the validated OAuth proof-of-concept.
   Consumed per `docs/explorations/README.md`: **possibilities, not spec** —
   except its credential-hygiene rules (§10), which are **binding**.
2. `docs/tasks/046-spike-adapter-drive/` — the precedent this brief mirrors:
   `brief.md`, `drive-probe.mjs`, `run-instructions.md`, `notes.md`.
3. `docs/GOTCHAS.md` — `G-DRIVE-1` (scope change invalidates the cached grant)
   and `G-DRIVE-2` (duplicate `google-auth-library` copies).
4. `packages/adapter-drive/src/constants.ts` — `DRIVE_SCOPES`, the pair proven
   live in 046.
5. `packages/core/src/gateways.ts` — the existing `SheetGateway`, and
   `packages/core/src/export.ts` — `projectIssue` / `ExportRecord`.

P4 slug evidence (four sources, checked 2026-08-15, all clean for
`spike-sheets-report`): `ls docs/tasks/` shows no match; `git log --oneline main`
shows no match; `grep -rn` across `CLAUDE.md` and `docs/` shows no match;
`git branch -a` plus `git worktree list` show no match across the three live
worktrees.

## Goal

Answer five closed questions with live evidence against a real Google workspace,
and record the answers as a decision note that specifies what the first
`adapter-sheets` implementation brief must build and which OAuth scopes it needs.

Out of scope:

- **Any file under `packages/`.** No production code, no test, no `SheetGateway`
  change, no scope change. The spike records findings; a later brief acts on them.
- **Designing the report's columns or layout.** The row source is settled (D4);
  what the team wants to see is a separate product question.
- **Wiring a `saci` command.** No `cli` change of any kind.
- **`docs/ROADMAP.md` phase restructuring.** Edit 5 adds one dated line, nothing
  more.
- **The `buraqueira` repository.** Its `PORTING.md` already reflects the ruling.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   `docs/tasks/2026-08-15-spike-sheets-report/**` and `docs/ROADMAP.md`
   (Edit 5, one line). If anything else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md`, especially R1 (cross-platform paths), R4
   (no silent catch), R7 (named constants), R9 (English dev surface) and R24
   (no `any`).
3. Follow `docs/GIT_WORKFLOW.md` fully:
   - New branch: `docs/spike-sheets-report`
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
4. **No credential, token, spreadsheet id, email address or workspace domain
   may enter the repository.** Probe output pasted into `notes.md` is redacted
   per `drive-oauth.md` §10 before it is committed.
5. The probe must not delete or modify any pre-existing Drive item. It creates
   its own artifacts and reports their ids to stdout for the owner to clean up
   by hand.

### Conventions

- English on every surface this task touches (R9); the probe's log lines
  included.
- Commit type `docs`, scope `tasks` for Edits 1-4 and no scope for Edit 5.
- The probe is a standalone `.mjs` script under the task folder, run with plain
  `node`. It is not a workspace package and nothing imports it.

### Architectural decisions already made (do not revisit)

#### D1 — No product code, and the probe lives with the brief

The exit artifact is `notes.md`. The probe script sits at
`docs/tasks/2026-08-15-spike-sheets-report/sheets-probe.mjs`, exactly as 046 put
`drive-probe.mjs` beside its brief. It is throwaway evidence-gathering, not a
prototype to be promoted.

#### D2 — Reuse the existing OAuth flow; do not build a second one

The probe authenticates through the same loopback flow and the same
`~/.saci/oauth_client.json` / `~/.saci/token.json` that `adapter-drive` uses. It
may import from `packages/adapter-drive/dist/` to avoid duplicating the flow. It
must not write a competing credential file.

#### D3 — The spreadsheet is a one-way projection, permanently

The spike never reads state back from a Sheet to drive behavior. The application
owns production state (2026-06-12 pivot, unreversed). Question S5 asks what shape
the port should be, not whether the Sheet may hold state.

#### D4 — The row source is the existing export projection

Rows come from `projectIssue` / `ExportRecord` in `packages/core/src/export.ts`.
The spike may use a hardcoded two-row fixture shaped like `ExportRecord`; it does
not design a new projection and does not call Jira.

#### D5 — Scopes are measured, not widened

The probe's first run uses **only** the current `DRIVE_SCOPES`
(`drive.file` + `drive.metadata.readonly`). Only if a step fails under that pair
does the probe re-run with a widened set, and the widened set is recorded as a
finding. `DRIVE_SCOPES` itself is not edited by this task.

#### D6 — The owner runs the probe; the executor never touches live Google

Execution model from briefs 037 and 046: the executor writes the script and the
run instructions, the owner runs it against the real workspace, and the evidence
is pasted back for Edit 4. The executor must not attempt a live call.

#### D7 — Two candidate write paths are both in scope for S2

Writing cell content has two plausible routes and the spike measures both rather
than assuming: (a) the Sheets API v4 `values.update`, which likely needs a
`spreadsheets` scope; (b) uploading CSV to Drive with conversion to
`application/vnd.google-apps.spreadsheet`, which may stay inside `drive.file`.
Path (b) existing is why the `CLAUDE.md` claim is an assumption.

### The five questions

| Id | Question | Closed by |
|---|---|---|
| S1 | Can a spreadsheet be **created** under `drive.file` alone? | probe step 1 |
| S2 | Can cell content be **written** under `drive.file` alone, by either path in D7? | probe steps 2a / 2b |
| S3 | Can the file be **shared** with a workspace user or group under `drive.file` alone? | probe step 3 |
| S4 | If a scope must be added, exactly which, and what is the re-auth blast radius? | probe step 4 + `G-DRIVE-1` |
| S5 | Does the existing `SheetGateway` (`readRows` / `writeRows`) fit a create-and-share report, or must it be replaced? | reading, not the probe |

S5 is answered by reading `packages/core/src/gateways.ts` against the findings
of S1-S3. It is a written argument in `notes.md`, not a measurement, and it must
say so.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The brief was pre-saved to `docs/tasks/2026-08-15-spike-sheets-report/brief.md`
before the executor was invoked (caminho B). The executor verifies and commits.

- [ ] Directory `docs/tasks/2026-08-15-spike-sheets-report/` exists
- [ ] File `brief.md` exists; first line matches the title above
- [ ] `git add docs/tasks/2026-08-15-spike-sheets-report/brief.md` is staged
- [ ] Commit #1 created with the subject in the Commit sequence below

If the file is missing or the first line does not match, **STOP and report**. Do
not regenerate the brief from memory.

### Edit 2 — Write the probe script

Create `docs/tasks/2026-08-15-spike-sheets-report/sheets-probe.mjs`.

Required behavior:

- Authenticates via the flow named in D2, requesting exactly the current
  `DRIVE_SCOPES` on the first run. A `--wide` flag adds the scopes named on the
  command line, for the D5 re-run.
- Runs four numbered steps, each printing `STEP n: PASS` or
  `STEP n: FAIL <status> <reason>`, and continues to the next step after a
  failure rather than aborting — a partial map is the deliverable.
  - Step 1 (S1): create a spreadsheet, print its id.
  - Step 2a (S2, path a): write two fixture rows via Sheets API `values.update`.
  - Step 2b (S2, path b): upload the same two rows as CSV with conversion, print
    the resulting id.
  - Step 3 (S3): share the step-1 file with an address supplied by
    `--share-with`, as `reader`.
  - Step 4 (S4): print the granted scope string from the cached token.
- Prints a final summary block listing every created file id, under the heading
  `CREATED — delete these by hand`.
- Every failure path logs status and reason (R4). No silent catch. No `any`.
- Named constants at module top for the MIME types and the fixture (R7).

Verification:

- [ ] File exists and `node --check` passes on it
- [ ] `grep -c "STEP" sheets-probe.mjs` shows a line for each of the five steps
- [ ] No credential, id, address or domain is hardcoded — every one arrives by
      flag or from `~/.saci/`
- [ ] The script is not referenced from any `package.json`

Commit: see the Commit sequence.

### Edit 3 — Write the run instructions

Create `docs/tasks/2026-08-15-spike-sheets-report/run-instructions.md`, modeled
on `docs/tasks/046-spike-adapter-drive/run-instructions.md`.

It must state: the prerequisites (`~/.saci/oauth_client.json` present, `npx tsc -b`
run so `adapter-drive/dist` exists), the exact command lines for the narrow run
and the `--wide` re-run, what `G-DRIVE-1` requires between the two (delete
`~/.saci/token.json`, re-consent), what to paste back, and what to redact before
pasting.

Verification:

- [ ] File exists
- [ ] It names `G-DRIVE-1` and the `token.json` deletion step explicitly
- [ ] It names the redaction rule from `drive-oauth.md` §10
- [ ] Every command shown is copy-pasteable and cross-platform (R1)

### Edit 4 — Record the findings

**This Edit runs only after the owner has pasted the probe output.** If the
output is not present, **STOP and report** — do not infer results.

Create `docs/tasks/2026-08-15-spike-sheets-report/notes.md` containing: the
redacted probe output verbatim in a fenced block, one section per question S1-S5
with its answer, and a closing recommendation naming the scope set the first
implementation brief must request.

Verification:

- [ ] Every question S1-S5 has a section with an explicit answer
- [ ] S5's section states in writing that it is a reading, not a measurement
- [ ] The probe output appears verbatim in a fenced block, redacted
- [ ] `grep -rn` for `@` and for the workspace domain over the file returns
      nothing that identifies a real person or tenant
- [ ] The recommendation names an exact scope list

### Edit 5 — Record the outcome in the roadmap

Append one dated line to the `BI export` row's status cell in `docs/ROADMAP.md`
naming the spike and its scope conclusion. One line. No phase restructuring, no
other row touched.

Verification:

- [ ] `git diff --stat docs/ROADMAP.md` shows a single-line change
- [ ] No other row of the status table changed

### Commit sequence

1. `docs(tasks): add brief for 2026-08-15-spike-sheets-report`
2. `docs(tasks): add the Google Sheets probe script`
3. `docs(tasks): add run instructions for the Sheets probe`
4. `docs(tasks): document the Sheets probe findings`
5. `docs: document the Sheets spike outcome in the roadmap`

Each subject is ≤ 72 chars and its verb (`add`, `document`) is on
`VERB_ALLOWLIST` in `.claude/hooks/lib/commit-message.mjs`.

### Automated checks (run before each commit)

- [ ] `npx tsc -b` passes (unchanged by this task, but must not regress)
- [ ] `npm test` passes — 112/112 at `b287eb4`
- [ ] `node --check` passes on the probe script

### Structural checks

- [ ] Expected files exist at expected paths
- [ ] No file under `packages/` was modified:
      `git diff --name-only origin/main..HEAD | grep '^packages/'` returns nothing
- [ ] No file outside the in-scope list was modified

### Behavior checks

- [ ] The probe runs to completion under the narrow scope pair without throwing,
      even when individual steps fail
- [ ] A failing step prints its status and reason and does not abort the run
- [ ] The final `CREATED` block lists every id the run produced

### Git checks

- [ ] Branch used: `docs/spike-sheets-report`
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 2 — first modified file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed commit message shown
      before each commit
- [ ] Staged set confirmed to match the current Edit's scope before each Pause 3
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code):** skipped — `Plan required: no`.
- **Pause 2 (after the first modified file):** show the result and wait for
  review. **Always required.**
- **Pause 3 (before each commit):** show `git status` + `git diff --stat` + the
  proposed message. **Always required.**

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md` as a
  follow-up brief.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

- The five questions are closed and enumerated; the executor answers them, it
  does not choose them.
- Seven decisions (D1-D7) are closed, including the execution model and both
  candidate write paths.
- Every Edit names its exact path and its verification checkboxes.
- The one genuine judgment call — what to do when a step fails — has an explicit
  rule: continue, record, never infer.

Pause 2 and Pause 3 remain required regardless.

## Reference documents (read before starting)

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — `G-DRIVE-1`, `G-DRIVE-2`
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
5. `docs/explorations/drive-oauth.md` — §10 binding credential hygiene
6. `docs/tasks/046-spike-adapter-drive/` — the precedent, all four files
7. `packages/adapter-drive/src/constants.ts`, `packages/core/src/gateways.ts`,
   `packages/core/src/export.ts`

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD`
2. `git diff --stat origin/main...HEAD`
3. Any verification checkbox that could not be met, with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step — normally the first `adapter-sheets` implementation
   brief, scoped by the recommendation in `notes.md`
