# Brief: 2026-08-15 — Wire the SpreadsheetGateway into a `saci report` command

> **Category:** L
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `feat/report-command`

---

## Context

`docs/tasks/2026-08-15-adapter-sheets-report/` shipped `@saci/adapter-sheets`
(PR #153): a `SpreadsheetGateway` that creates a spreadsheet, replaces its grid,
and shares it with one workspace user as reader, evidenced by an owner-run live
smoke, 6 of 6 steps, under the OAuth pair `adapter-drive` already holds. Its
closing sentence is the reason this brief exists: **no command wires it yet.**

This is the second half of the same decomposition 046 → 047 used, and 047 → this
one repeats: the adapter carried the external risk and shipped alone; the command
that orchestrates it ships now. The gateway is **not** re-opened here. Its port,
its write path, its pinned share role, and its failure classification are settled
and evidenced — do not revisit, benchmark, or offer alternatives.

Four decisions were closed by the owner before this brief was written, and they
are D1-D4: the spreadsheet id lives in a new `~/.saci/report.json`; rows and
columns come from an existing export profile; sharing happens on creation only,
by flag; and the command is `saci report --profile <name>`.

**Size note.** Measured at 604 lines, inside the ~750 guidance for a doctrinal
Category-L brief, so no split declaration is owed. Recorded anyway because the
delivery unit is one command end to end — a parser case, a state module, a
composition function, a display line, the composition-root wiring, and an
owner-run smoke that is the only thing able to prove the parts compose — and a
sub-brief delivering the state module without the command would close on
nothing.

Context inputs (read all before starting):

1. `docs/tasks/2026-08-15-adapter-sheets-report/notes.md` — **mandatory**. §1.5
   lists what the previous run did NOT exercise; §6 carries the six follow-ups,
   two of which this brief closes (follow-up 5, the unexercised factory, and
   follow-up 6, the stale `CLEAR_RANGE` comment).
2. `packages/adapter-sheets/src/index.ts` — `createSpreadsheetGateway`, the
   factory this command is the first caller of, and whose body no test or smoke
   has ever run.
3. `packages/cli/src/run-export.ts` — the projection pipeline this command
   reuses, and `packages/cli/src/run-export.test.ts`, which is the proof that
   Edit 2's extraction changed no behavior.
4. `packages/cli/src/identity.ts` — the precedent for local production state:
   injected path, no env read, fail-loud narrowing, seed example in the error.
5. `packages/cli/src/argv.ts`, `packages/cli/src/cli.ts`,
   `packages/cli/src/display.ts` — the parser, the composition root, the
   one-line renderers.
6. `docs/GOTCHAS.md` — `G-SHEETS-1`, `G-SHEETS-2`, `G-DRIVE-1`, `G-DRIVE-3`,
   `G-NODE-2`, `G-HOOK-1`.

P4 slug evidence (four sources, checked 2026-08-15, all clean for
`report-command`):

- `ls docs/tasks/` — no match.
- `git log --oneline main` — no match.
- `grep -rln 'report-command' CLAUDE.md docs/` — no match.
- `git branch -a` plus `git worktree list` — the only branch carrying "report" is
  `docs/spike-sheets-report`; `feat/report-command` is unheld across all four
  worktrees.

Baseline at `8f91ca7`: `npx tsc -b` exits 0; `npm test` runs two suites —
packages 352 (351 pass, 1 skipped, 0 fail) and hooks 112 (112 pass, 0 fail).
Both totals are reported at every Pause 3.

## Goal

Add `saci report --profile <name>`, which projects a payload through an existing
export profile and writes it into one Google spreadsheet that persists across
runs — created and shared on first use, rewritten thereafter — evidenced by an
owner-run live smoke of the command itself.

Out of scope:

- **Any change to the `SpreadsheetGateway` port or its adapter**, except the
  single comment correction in Edit 7. The port's shape, the pinned
  `type=user` / `role=reader`, the clear-then-write contract, and the ordered
  failure classification are settled and evidenced.
- **Selectable permission role.** Follow-up 2 of the previous task, and it starts
  with a measurement of `writer` / `commenter` / `type=group`, not with an
  argument. Nothing here widens the share surface.
- **Folder placement, a report URL, and the shared `adapter-google` extraction.**
  Follow-ups 1, 3 and 4, each unstarted and each beginning with a measurement.
- **Reconciling permissions across runs.** Sharing happens on creation only
  (D3). Reading back who currently has access is remote-state reconciliation —
  the decision reversed on 2026-06-12 and never un-reversed.
- **Reading spreadsheet content back.** The port projects one way. The smoke may
  read as an instrument, exactly as the previous task's smoke did.
- **A new export profile, or new columns.** The command consumes profiles that
  already exist; what the team wants to see is settled per profile by whoever
  writes the config.
- **`saci export` behavior.** Edit 2 is a pure extraction: `run-export.test.ts`
  must pass unchanged, and that is the whole proof (R14).
- **`packages/adapter-jira/**`, `packages/adapter-drive/**`, `packages/core/**`.**
  No port change, no projection change; `applyColumns` and `projectIssue` are
  consumed as they are.

## Constraints

### Non-negotiable constraints

1. Only these paths may be created or modified:
   `docs/tasks/2026-08-15-report-command/**`, `packages/cli/src/**`,
   `packages/adapter-sheets/src/constants.ts` (Edit 7, comment only),
   `CLAUDE.md` (Edit 10, one bullet), `docs/ROADMAP.md` (Edit 10, one row). If
   anything else needs changing, **STOP and ask**.
2. **Credential hygiene (binding — `docs/explorations/drive-oauth.md` §10).** No
   credential, token, spreadsheet id, email address or workspace domain enters
   the repository. The share recipient arrives by flag, is never logged by the
   command, and never reaches a committed file. Probe output pasted for Edit 9
   is redacted before it is committed — the previous task's `notes.md` §1 states
   the placeholder convention to reuse.
3. **No network in tests.** No test under `packages/cli/` may perform a network
   call or require credentials. The gateway is injected into `runReport` exactly
   as `MakeGateway` is injected into `runFetch`, so every decision is unit tested
   against a fake.
4. **Execution model for anything live (D8).** The executor authors and
   interprets; the **owner runs the smoke and pastes the output back**. The
   executor never runs an OAuth flow, a Drive call, or a Sheets call.
5. **The state file is the app's first written production state, and it fails
   loud.** Every failure names the file's absolute path and what to do. It is
   never silently recreated, never repaired, and never written on a run that did
   not create a spreadsheet.
6. Follow `CLAUDE.md`, especially R1 (`os.homedir()` + `path.join`, no hardcoded
   root), R4 (no silent catch), R5/R6 (size budgets), R7 (named constants), R9
   (English-only), R14 (Edit 2 changes no behavior), R20/R24 (strict TS, no
   `any`), R21 (ESM, `.js` extensions), R23 (`node:test`, colocated), R25 (`cli`
   is the composition root and the only package importing an adapter).
7. Follow `docs/GIT_WORKFLOW.md` fully: branch `feat/report-command`, created via
   `git switch -c feat/report-command` from the session HEAD **before Edit 1**;
   Conventional Commits (G-R3), subjects ≤ 72 chars measured with
   `printf '%s' "<subject>" | wc -c`, never counted by eye; no `Co-authored-by`
   (G-A7); commit freely, **DO NOT push** (G-R5, R17).
8. **Worktree guard (`G-NODE-2`) and hook liveness (`G-HOOK-1`).** Before Edit 1,
   run `npm install` at the worktree root under the standard guard — any tracked
   change, `package-lock.json` included, is a STOP — and probe the guards with an
   unstaged `git commit -m "bogus: probe"`, which a live `commit-guard` denies.
   No dependency is added by this task, so any lockfile movement at all is a STOP.

### Conventions

- English on every surface (R9). Commit scopes: `cli` for the command,
  `adapter-sheets` for Edit 7, `tasks` for the task folder; Edit 10 is unscoped
  `docs:`.
- Tests colocate as `*.test.ts` (R23), following `run-export.test.ts` and
  `identity.test.ts`.
- Error messages name the operation and the target, then an actionable fix (R4).

### Architectural decisions already made (do not revisit)

#### D1 — The spreadsheet id lives in `~/.saci/report.json`, keyed by profile

A new state module in `packages/cli/src/`, modelled on `identity.ts`: the path is
always injected, the module reads no env and composes no default path (`cli.ts`
resolves it), parsing narrows fail-loud naming the offending field, and the
missing-file message shows what the file will look like.

**Keyed by profile name**, because two profiles are two different reports and a
single flat `spreadsheetId` would make the second run of a second profile
overwrite the first profile's report. Shape:

```json
{
  "reports": {
    "<profile-name>": { "spreadsheetId": "<id>", "createdAt": "<ISO-8601>" }
  }
}
```

Unlike `identity.json`, this file is **written by the application**, not seeded by
hand — nobody can know a spreadsheet id before the spreadsheet exists. It is the
first production-state file in v2 the app itself writes, and all of its I/O lives
in this one module (R18's principle, applied at the seam that exists).

#### D2 — Rows and columns come from an existing export profile

`saci report --profile <name>` reads the same `payload.json` and the same export
config as `saci export`, and consumes the profile's `columns` and `filters`.
`format`, `csv` and `output` are **ignored** — a report's destination is the
spreadsheet, not a file — and the command does not reject a profile because its
`format` says `csv`. The reuse is the point: a report and a CSV of the same
profile cannot drift in column selection or order.

#### D3 — Sharing happens on creation only, by flag

`--share-with=<address>` is used **only** on the run that creates the
spreadsheet. On a run where the report already exists, the grid is rewritten and
nothing is shared. Passing `--share-with` to a run that did not create anything
is not an error and is not silent either: the result line says the share was
skipped because the report already existed. Reconciling permissions across runs
would be remote-state reconciliation, which is the reversed decision.

`--share-with` is **optional**. Omitting it on a creating run produces a report
nobody but the operator can open, which is a legitimate first step; the result
line says so.

#### D4 — The command is `saci report --profile <name>`

Its own case in `argv.ts` beside `fetch` / `export` / `start`, not a flag on
`export`. `export` always writes a local file and its profile's `output` means a
path; overloading it would change what `output` means. Flags: `--payload`,
`--config`, `--profile` (all required, mirroring `export`) and `--share-with`
(optional).

#### D5 — A stored id that no longer resolves fails loud; it is never recreated

If `report.json` names a spreadsheet that Drive answers 404 for — deleted,
trashed, or created by another account — the command **fails**, naming the
profile, the id, the state file's absolute path, and the fix: remove that
profile's entry to let the next run create a fresh report. It must never create a
second spreadsheet silently. A silent recreate produces a new report nobody is
shared into, while the team keeps opening the old link and reading stale data —
the exact failure the one-identity design exists to prevent.

#### D6 — The created spreadsheet's name is a constant template, and renaming it is safe

`SPREADSHEET_NAME_TEMPLATE` at module top (R7), producing a name from the profile
name. The stored key is the **id**, so a designer renaming the file in Drive
breaks nothing — state that property in the module's comment, because it is the
reason the name needs no configuration.

#### D7 — The gateway is injected; the factory is called only in `cli.ts`

`runReport` takes a `MakeSpreadsheetGateway` thunk exactly as `runFetch` takes
`MakeGateway`, so every decision in it is unit tested against a fake with no
credentials and no network. `createSpreadsheetGateway` — unexercised by the
previous task, its follow-up 5 — is called in exactly one place, `cli.ts`, and
the live smoke is what finally runs its body.

#### D8 — Evidence model: unit tests plus an owner-run live smoke

The 046 / 047 / adapter-sheets model, unchanged. What the smoke must prove is
what a fake cannot: that the factory composes, that a second run rewrites the
same spreadsheet rather than creating another, and that the state file survives
between two separate process invocations.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

- [ ] Working branch is `feat/report-command` (constraint 7)
- [ ] `docs/tasks/2026-08-15-report-command/brief.md` exists; first line is
      byte-identical to this brief's title heading
- [ ] `git add` stages that one file
- [ ] Commit #1 subject matches the Commit sequence

If the file is missing or the first line does not match, **STOP and report**.

### Edit 2 — Extract the profile projection shared by `export` and `report`

Create `packages/cli/src/profile-projection.ts` holding the pipeline currently
inline in `runExport`: resolve the named profile (fail-loud on an unknown name,
naming the config path), build the `ExportContext` from the payload envelope and
the config root, project every issue, filter, and apply the profile's columns —
returning core's `ColumnSelection` plus whatever `runExport` still needs.

`runExport` is rewritten to call it. **This Edit changes no behavior (R14).**

Verification:

- [ ] `packages/cli/src/run-export.test.ts` passes **unchanged** — not one
      assertion edited. That is the whole proof; if a test needs changing, the
      extraction is not behavior-preserving and this is a **STOP**
- [ ] The packages total is unmoved at 352 — an extraction adds no test
- [ ] `run-export.ts` no longer contains the projection inline
- [ ] `grep -rn 'from.*adapter' packages/core/src/` still returns nothing (R25)

Commit: see the Commit sequence.

### Edit 3 — Add the report state module

Create `packages/cli/src/report-state.ts` + test. Per D1:

- `REPORT_STATE_FILENAME` (`"report.json"`) as a named constant beside the
  existing `IDENTITY_DIR_NAME` convention; the module composes no path.
- `readReportState(filePath)` — returns the parsed state, or an empty state when
  the file is absent. Absence is an expected answer on a first run, not a
  failure; malformed JSON, a non-object root, or a malformed entry all throw
  naming the file and the offending field (R4).
- `readReportEntry(filePath, profileName)` — the entry, or `null`.
- `writeReportEntry(filePath, profileName, entry)` — read-modify-write that
  **preserves other profiles' entries**, creating the directory if needed.

Tests, against a temp dir, no network: absent file yields an empty state; a
round-trip returns what was written; writing a second profile leaves the first
intact; malformed JSON throws naming the path; a missing `spreadsheetId` throws
naming the field; paths are composed with `path.join`, never a literal separator
(R1).

Verification:

- [ ] Every listed test exists and passes
- [ ] The module reads no env and calls `os.homedir()` nowhere
- [ ] The write preserves an unrelated profile's entry — asserted, not assumed
- [ ] Sizes within R5/R6; no `any`; `.js` on every relative import

### Edit 4 — Add the `report` composition function

Create `packages/cli/src/run-report.ts` + test.

```ts
export type MakeSpreadsheetGateway = () => Promise<SpreadsheetGateway>;

export interface ReportRunInput {
  payloadPath: string;
  configPath: string;
  profileName: string;
  statePath: string;
  shareWith?: string;
}

export interface ReportRunResult {
  spreadsheetId: string;
  created: boolean;
  rowCount: number;
  share: "granted" | "skipped-existing" | "not-requested";
}
```

Behavior, in order: project rows through Edit 2's extraction; read the state
entry; when absent, create the spreadsheet (D6's name), persist the entry, and
share when `--share-with` was given; when present, reuse the id and share
nothing; then `writeGrid` in both paths. The gateway is constructed **once**,
lazily, through the injected thunk.

Tests inject a fake gateway and a temp state file, no network:

- first run with no state → creates, persists the id, shares, writes the grid
- second run with state → does **not** create, does **not** share, writes the
  grid, and `share` is `skipped-existing`
- first run without `--share-with` → creates, writes, `share` is
  `not-requested`, and `shareAsReader` is never called
- the grid handed to `writeGrid` is the profile's `ColumnSelection`, header
  first — asserted against the same fixture `run-export.test.ts` uses
- a 404 from `writeGrid` on a stored id fails naming the profile, the id, the
  state path, and the remove-the-entry fix (D5); the state file is **not**
  modified
- an unknown profile name fails before the gateway is constructed — assert the
  thunk was never called, so a config typo never opens a browser
- the state file is not written on a run that created nothing

Verification:

- [ ] Every listed test exists and passes; the packages total grows by their count
- [ ] No test imports `googleapis` or `@saci/adapter-sheets`'s factory
- [ ] `runReport` calls the thunk at most once, asserted
- [ ] Sizes within R5/R6; no `any`

### Edit 5 — Add the parser case and the result line

**5a.** `packages/cli/src/argv.ts`: add
`{ kind: "report"; payload: string; config: string; profile: string; shareWith?: string }`
to `ParsedCommand`, a `case "report"` mirroring `export`'s required-flag
handling plus the optional `--share-with`, and a `report` line in `USAGE`.

**5b.** `packages/cli/src/display.ts`: `renderReport(result)`, one line in the
existing renderers' style, stating created-or-updated, the row count, and the
share outcome in words a designer reads — including, when the share was skipped,
why.

Tests extend `argv.test.ts` and `display.test.ts`: all three required flags
missing → usage; `--share-with` absent → `shareWith` undefined; the three
`share` outcomes each render distinctly.

Verification:

- [ ] `USAGE` names `report` and its flags
- [ ] Each new test exists and passes
- [ ] No existing argv or display test was modified

### Edit 6 — Wire the command into the composition root

`packages/cli/src/cli.ts`: a `case "report"` that resolves the state path beside
the identity file (`IDENTITY_DIR_NAME` + `REPORT_STATE_FILENAME`, composed with
`os.homedir()` and `path.join` — R1), builds the `MakeSpreadsheetGateway` thunk
over `createSpreadsheetGateway`, calls `runReport`, and prints
`renderReport(result)`. Exit codes follow the existing D-a4 split: usage errors
`EXIT_USAGE`, everything else `EXIT_RUNTIME`.

Verification:

- [ ] `createSpreadsheetGateway` is imported and called in `cli.ts` and nowhere
      else — `grep -rn "createSpreadsheetGateway" packages/` outside `dist/`
      returns the adapter's definition, this call, and nothing more
- [ ] `cli.test.ts` still passes; extend it only if it already covers dispatch
- [ ] `npx tsc -b` and `npm test` pass, both totals reported

### Edit 7 — Correct the stale `CLEAR_RANGE` comment

`packages/adapter-sheets/src/constants.ts` says `CLEAR_RANGE` is not measured.
The 2026-08-15 smoke measured it: a one-row grid written over a three-row grid
read back as exactly two rows. Rewrite the comment to say it was measured, by
what, and on what date; keep the operational warning that dropping the clear
leaves a stale tail. **Comment only — the literal does not change.**

Verification:

- [ ] `git diff --stat packages/adapter-sheets/` shows one file, comment lines only
- [ ] `grep -n "NOT MEASURED" packages/adapter-sheets/src/constants.ts` returns
      nothing
- [ ] Both suite totals unmoved

### Edit 8 — Author the live smoke and run instructions

**`docs/tasks/2026-08-15-report-command/report-smoke.md`** — this smoke drives
the **built CLI**, not a script: the artifact under test is `saci report`, and a
bespoke runner would prove something else (the "verify the artifact you ship"
rule). It is a numbered procedure the owner follows, with a fixture payload and a
fixture export config committed beside it, both carrying obviously fake issue
data and no real key, URL, or address.

The procedure must prove what a fake cannot:

1. first run with `--share-with` → creates, shares, writes; record the printed
   line and that `~/.saci/report.json` now holds an entry for the profile;
2. second run, a **separate process**, with a payload trimmed to fewer issues →
   rewrites the same spreadsheet, creates nothing, shares nothing, and the id in
   the state file is unchanged;
3. open the spreadsheet once and confirm no row of the first run survives below
   the second run's grid — the clear-then-write contract, now through the
   command;
4. an unknown `--profile` → fails without opening a browser;
5. delete the spreadsheet in Drive, run again → fails with D5's message naming
   the id and the fix, and creates nothing.

**`docs/tasks/2026-08-15-report-command/run-instructions.md`** — prerequisites,
the exact command lines, what to paste, and the never-paste list: credential file
contents, the authorization URL, the `--share-with` address, the real spreadsheet
id, and consent screenshots. It must state that **the command line itself carries
the address**, so it is retyped with a placeholder or omitted when quoting.

Verification:

- [ ] Both files exist; the fixtures carry no real key, URL, address or id
- [ ] Step 5 is present — the deleted-spreadsheet case is the only live proof of
      D5, and it is also the case the owner will hit for real
- [ ] The instructions name the address-in-the-command-line hole explicitly

### Evidence round (process, between Edit 8 and Edit 9)

The owner runs the procedure and pastes the output; the executor interprets (D8).
The executor runs nothing live.

**Three STOP-and-confirm guards.** A failure on scope → STOP and report; do not
widen a scope or edit `DRIVE_SCOPES`. A second spreadsheet appearing on the
second run → STOP: the one-identity design failed and the cause is diagnosed
before any fix. A 404 path that recreates instead of failing → STOP; D5 is not
negotiable at the evidence round.

### Edit 9 — Record the evidence

Create `docs/tasks/2026-08-15-report-command/notes.md` containing: the redacted
output per step; an explicit statement of which of the previous task's follow-ups
this run closed (5, the factory, now exercised live) and which it did not; what
was still not exercised; and any Done criterion not met, with its reason. Reuse
the placeholder convention from the previous task's `notes.md` §1.

Verification:

- [ ] Every procedure step has an evidence line traceable to pasted output
- [ ] The second-run result states the id was unchanged, quoting it as a placeholder
- [ ] No address, real id, or domain anywhere in the file
- [ ] The factory's first live execution is stated as such

### Edit 10 — Reconcile `CLAUDE.md` and `docs/ROADMAP.md`

`CLAUDE.md`'s `@saci/adapter-sheets` bullet says **"No command wires it yet"**;
that goes false with Edit 6. Rewrite that clause and name the command. The
ROADMAP `BI export` row's sentence saying no `saci` command is wired gains the
same correction. Two files, current-state only; dated history stays verbatim.

Verification:

- [ ] `grep -n "No command wires it yet" CLAUDE.md` returns nothing
- [ ] `git diff --stat` shows exactly the two files
- [ ] No other ROADMAP row changed

### Commit sequence

1. `docs(tasks): add brief for 2026-08-15-report-command`
2. `refactor(cli): extract the profile projection shared by two commands`
3. `feat(cli): add the report state file reader and writer`
4. `feat(cli): add the report composition function`
5. `feat(cli): add the report command to the parser and the display`
6. `feat(cli): wire the report command into the composition root`
7. `fix(adapter-sheets): update the CLEAR_RANGE note to the measured result`
8. `docs(tasks): add the report smoke procedure and run instructions`
9. `docs(tasks): add the report command smoke evidence note`
10. `docs: update the wired-command state in CLAUDE.md and the roadmap`

Every subject is measured with `printf '%s' "<subject>" | wc -c` before use, and
every verb (`add`, `extract`, `wire`, `fix`, `update`) is on `VERB_ALLOWLIST` in
`.claude/hooks/lib/commit-message.mjs`.

### Automated checks (run before each commit)

- [ ] `npx tsc -b` passes
- [ ] `npm test` passes; **both** suite totals reported at every Pause 3 —
      packages and hooks. Predict the packages total before running it and
      compare; a gap is a finding, not something to reconcile afterwards
- [ ] Both run by hand — the pre-commit hook may not be wired (`G-HOOK-1`)

### Structural checks

- [ ] `git diff --name-only main..HEAD` shows only
      `docs/tasks/2026-08-15-report-command/**`, `packages/cli/src/**`,
      `packages/adapter-sheets/src/constants.ts`, `CLAUDE.md`, `docs/ROADMAP.md`
- [ ] `package-lock.json` unmodified — no dependency is added
- [ ] No `dist/`, `node_modules/`, `oauth_client.json`, `token.json`, or
      `report.json` tracked
- [ ] Secret sweep clean over the task folder and `packages/cli/src/`

### Behavior checks

- [ ] A second run rewrites the same spreadsheet — unit test **and** live evidence
- [ ] A run that creates nothing writes no state and shares nothing (unit test)
- [ ] A stored id that 404s fails naming the fix and creates nothing (unit test
      and live evidence)
- [ ] An unknown profile fails before the gateway thunk is called (unit test)
- [ ] Writing a second profile's entry preserves the first's (unit test)
- [ ] `run-export.test.ts` passes unchanged after Edit 2 (R14)
- [ ] No test performs a network call

### Git checks

- [ ] Branch used: `feat/report-command`
- [ ] Conventional Commits (G-R3); subjects ≤ 72 chars, measured not counted
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] Approved commit messages used verbatim; `git log -1` checked after each
- [ ] `git status` clean apart from the environment-generated untracked entries
      documented in the previous task's `notes.md` §4
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 1 — numbered plan presented and approved (`Plan required: yes`)
- [ ] Pause 2 — first modified file shown before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message + both totals
- [ ] Staged set confirmed against the Edit's scope before each Pause 3
- [ ] Every stated count is measured, never asserted from memory
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code):** **required**. Present a numbered plan covering
  Edit 2's extraction boundary, the state module's function list, and the
  `runReport` test list. Wait for approval.
- **Pause 2 (after the first modified file):** show the result and wait.
  **Always required.**
- **Pause 3 (before each commit):** `git status` + `git diff --stat` + the
  proposed message + both suite totals. **Always required.**

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Edit 2 requiring a test change → **STOP**; the extraction is not
  behavior-preserving and the boundary is wrong.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha → report; do not add a `docs/GOTCHAS.md` entry, no Edit
  here covers that file.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: yes`. Edit 2's extraction boundary — what moves into
`profile-projection.ts` and what stays in `run-export.ts` — is real design work
this brief scopes but does not hand over as byte-exact text, and getting it wrong
is the one way this task can break a shipped command. The state module's function
list and `runReport`'s test list are likewise proposed at Pause 1.

D1-D8 are **not** re-openable: the plan proposes boundaries and tests, not where
the id lives, where the rows come from, when sharing happens, or the command's
shape.

## Reference documents (read before starting)

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — `G-SHEETS-1`, `G-SHEETS-2`, `G-DRIVE-1`, `G-NODE-2`,
   `G-HOOK-1`
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2, Lesson #6, Lesson #15
5. `.claude/skills/brief-template/SKILL.md` — template reference
6. `docs/tasks/2026-08-15-adapter-sheets-report/notes.md` — §1.5 and §6
7. `packages/cli/src/run-export.ts`, `identity.ts`, `argv.ts`, `cli.ts`
8. `packages/adapter-sheets/src/index.ts` — the factory

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD`
2. `git diff --stat main...HEAD`
3. The live evidence, per procedure step, with its pasted source
4. Which of the previous task's follow-ups this run closed, and which it did not
5. Any verification checkbox not met, with its reason
6. Confirmation that no `git push` was executed and no PR was opened
7. Suggested next step: owner authorizes push and PR
