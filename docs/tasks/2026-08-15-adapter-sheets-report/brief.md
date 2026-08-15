# Brief: 2026-08-15 — Build the `@saci/adapter-sheets` report adapter

> **Category:** L
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `feat/adapter-sheets`

---

## Context

The spike `docs/tasks/2026-08-15-spike-sheets-report/` closed the scope question
by measurement (PR #152, merged): creating a spreadsheet, writing its cells, and
sharing it with a workspace user all work under the OAuth pair `adapter-drive`
already holds. No scope is added, no `DRIVE_SCOPES` edit is needed, and
`G-DRIVE-1` never fires — **this task carries no authorization change.**

This brief builds the adapter, mirroring the 046 → 047 decomposition: 047 shipped
the `DriveGateway` implementation and left the `ship` command to a later brief;
this one ships the `SpreadsheetGateway` implementation and leaves the `saci`
command that produces a real report to a later brief. Every external-risk choice
is closed and evidenced by the spike — do not re-open, re-research, benchmark, or
offer alternatives.

Three decisions the spike deliberately left open are closed here, in D1, D2 and
D3: the write path, the shape of the port that replaces `SheetGateway`, and the
Cloud-project prerequisite that follows from the write path.

**Size note.** At 828 lines this sits about 78 over the ~750 total guidance for a
doctrinal Category-L brief in `.claude/skills/brief-template/SKILL.md`, and it
does not split. The delivery unit is a whole
package: a port replacement, five source modules with their tests, one hygiene
export on a neighbouring package, two gotchas, an owner-run evidence round, and
the doc reconciliation this task makes unavoidable. A split was considered and
rejected: the live smoke can only run once the whole adapter exists, so no
sub-brief closes on its own evidence — the same reasoning 047 recorded. L is the
honest header; the deviation is declared here rather than hidden by thinning the
specification.

Context inputs (read all before starting):

1. `docs/tasks/2026-08-15-spike-sheets-report/notes.md` — **mandatory**: the
   verdict, both redacted transcripts, the answers S1-S5, and the explicit
   "What was not measured" list this brief must respect or close.
2. `docs/tasks/2026-08-15-spike-sheets-report/sheets-probe.mjs` — the proven call
   shapes: `files.create` with the spreadsheet MIME type,
   `spreadsheets.values.update` anchored at `A1`, `permissions.create` with
   `type=user` / `role=reader` / `sendNotificationEmail: false`.
3. `docs/tasks/047-adapter-drive/` — `brief.md` and `notes.md`. The package
   shape, the injected-seam test model, the credential hygiene and the
   owner-run evidence model are all reused verbatim from there.
4. `packages/adapter-drive/src/` — `client.ts` (the seam), `gateway.ts` (the
   failure seam), `errors.ts` (the sanitized `cause` discipline), `auth.ts`,
   `constants.ts`.
5. `packages/core/src/gateways.ts` (the port being replaced) and
   `packages/core/src/export.ts` (`ColumnSelection`, `ExportRecord`).
6. `docs/GOTCHAS.md` — `G-DRIVE-1`, `G-DRIVE-2`, `G-DRIVE-3`, `G-NODE-2`,
   `G-HOOK-1`.

P4 slug evidence (four sources, checked 2026-08-15, all clean for
`adapter-sheets-report`):

- `ls docs/tasks/` — only `2026-08-15-spike-sheets-report` matches `sheets`; no
  `adapter-sheets-report`.
- `git log --oneline main` — no commit references `adapter-sheets`.
- `grep -rln 'adapter-sheets-report' CLAUDE.md docs/` — no match.
- `git branch -a` plus `git worktree list` — the live sheets branches are
  `docs/spike-sheets-report` and `docs/lab-sheets-reversal-applied`; neither
  `feat/adapter-sheets` nor the slug is held in any of the four worktrees.

Baseline at `5fb27c6`: `npx tsc -b` exits 0; `npm test` runs two suites —
packages 329 (328 pass, 1 skipped, 0 fail) and hooks 112 (112 pass, 0 fail).
Both totals are reported at every Pause 3; reading either one alone hides the
other.

## Goal

Replace the `SheetGateway` port in `@saci/core` with a create-write-share
`SpreadsheetGateway`, and build `@saci/adapter-sheets` implementing it against
Google Sheets and Drive — unit tested on everything pure, evidenced end to end by
an owner-run live smoke that includes the shrinking-grid case.

Out of scope:

- **Any change under `packages/cli/**`.** No `saci report` command, no wiring, no
  subcommand, no composition. The command that produces a real report is the next
  brief, exactly as `ship` followed 047.
- **The report's columns, layout, refresh cadence, and its name.** The row source
  is settled (`projectIssue` / `applyColumns`); what the team wants to see is a
  product question and belongs to the command brief.
- **Placing the report inside a Drive folder.** Creation was measured only in the
  My Drive root, so the port carries no parent parameter (D2). A folder-placed
  report is a follow-up that starts with a measurement.
- **Sharing beyond one user as `reader`.** No `type=group`, no domain sharing, no
  `writer` or `commenter` — none of it was measured, and none of it becomes a
  parameter here (D2).
- **Writing to a spreadsheet this application did not create.** Not measured;
  `drive.file` is per-file access to files the app creates. No code path, comment
  or doc produced here may claim it works or that it fails.
- **Any read of spreadsheet content by the port.** `readRows` is the reversed
  decision, not a feature to port (spike S5). The smoke reads back as an
  instrument; the port does not (D5).
- **Widening `DRIVE_SCOPES`, or any edit to it.** The measurement says the
  current pair is enough.
- `packages/adapter-jira/**`, and every file of `packages/adapter-drive/**`
  except the single public-surface line named in Edit 3.
- Retroactive edits to historical briefs. Merged brief 019 defined
  `SheetGateway`; this task retires it. 019 stays verbatim — the supersession is
  recorded in this task's `notes.md`.

## Constraints

### Non-negotiable constraints

1. Only these paths may be created or modified:
   `docs/tasks/2026-08-15-adapter-sheets-report/**`,
   `packages/core/src/gateways.ts`, `packages/core/src/index.ts`,
   `packages/adapter-drive/src/index.ts` (Edit 3, one line),
   `packages/adapter-sheets/**`, `package-lock.json` (Edit 4 only),
   `docs/GOTCHAS.md`, `CLAUDE.md` (Edit 10, one bullet), `docs/ROADMAP.md`
   (Edit 10, one row). If anything else needs changing, **STOP and ask**.
2. **Credential hygiene (binding — `docs/explorations/drive-oauth.md` §10).**
   `oauth_client.json` and `token.json` never enter the repo, never appear in
   chat, never get logged. No log line, message, comment, doc, or fixture may
   contain a client secret, access token, or refresh token. The share recipient's
   address is a personal identifier: it arrives by flag, is never echoed by the
   smoke, and never enters a committed file. If a pasted evidence block contains
   secret material, **STOP**: do not echo it back, tell the owner to
   rotate/revoke, continue only after confirmation.
3. **No library error travels whole (`G-DRIVE-3`).** This adapter's failure seam
   must build a sanitized stand-in exactly as `packages/adapter-drive/src/errors.ts`
   does — message, classified status, original stack string, nothing else — and
   must never write `new Error(msg, { cause: libraryError })`. The assertion that
   a placeholder refresh token does not survive `util.inspect(wrapped, { depth: null })`
   is a required test, not an optional one.
4. **No network in tests.** No test under `packages/adapter-sheets/` may perform a
   network call or require credentials. The injected API seam (D6) exists so the
   gateway is testable without either.
5. **Execution model for anything live (D7).** The sandbox cannot reach Google and
   OAuth needs a real browser consent: the executor authors and interprets, the
   **owner runs the smoke on their machine and pastes the output back**. The
   executor **never** claims a live operation passed without pasted owner output,
   and never runs an OAuth flow, a Drive call, or a Sheets call itself.
6. **Unmeasured ground stays declared.** The spike's "What was not measured" list
   is binding. Where this task must pick a literal that no measurement covers —
   there is exactly one, `CLEAR_RANGE` in D4 — the brief says so, the code
   comments say so, and the live smoke closes it. Silence is the failure mode.
7. Follow `CLAUDE.md`, especially R1 (no hardcoded root, compose with
   `path.join`), R2 (dependency justification — D8), R4 (no silent catch),
   R5/R6 (size budgets), R7 (named constants for MIME types, ranges, field masks,
   share role and type), R9 (English-only), R20/R24 (strict TS, no `any`), R21
   (ESM, `.js` import extensions), R22 (`tsc -p .`), R23 (`node:test`, colocated
   `*.test.ts`), R25 (`core` never imports an adapter).
8. Follow `docs/GIT_WORKFLOW.md` fully: branch `feat/adapter-sheets`, created via
   `git switch -c feat/adapter-sheets` from the session HEAD **before Edit 1**
   (the `claude/*` worktree branch must never carry these commits — R11 / G-R2 /
   validator C4; if HEAD is already `feat/adapter-sheets`, confirm and continue);
   Conventional Commits (G-R3), subjects ≤ 72 chars; no `Co-authored-by` (G-A7);
   commit freely, **DO NOT push** (G-R5, R17).
9. **Worktree build guard (`G-NODE-2`, with a carve-out).** Run `npm install` at
   the worktree root so `@saci/*` resolves against this worktree. The gotcha's
   standard "STOP on any tracked-file change" guard is **carved out for Edit 4
   only** — the workspace link and the `googleapis` entry are intended lockfile
   drift. Tracked changes outside `packages/adapter-sheets/package.json` and
   `package-lock.json`, or lockfile changes touching a package other than
   `googleapis` and its transitives, mean **STOP and report**.
10. **Hook liveness (`G-HOOK-1`).** Before Edit 1, probe the guards with an
    unstaged `git commit -m "bogus: probe"`; a live `commit-guard` denies it on
    the invalid type. If the guards are dead, report it at Pause 1 and run the
    green boundary by hand at every Pause 3.

### Conventions

- All source, comments, docs, and commit messages in English (R9).
- Commit scopes: `core` for the port, `adapter-drive` for the one-line export,
  `adapter-sheets` for package files, `tasks` for
  `docs/tasks/2026-08-15-adapter-sheets-report/**`, `gotcha` for
  `docs/GOTCHAS.md`; the doc reconciliation commit is unscoped `docs:`.
- Tests colocate as `*.test.ts` (R23), following `packages/adapter-drive/src/`.
- Error messages name the operation and the target, then the status, then an
  actionable hint (R4). Precedent: `driveErrorMessage` in
  `packages/adapter-drive/src/errors.ts`.

### Architectural decisions already made (do not revisit)

#### D1 — Write path (a): update in place, not create-and-replace

The spike proved both routes. This adapter takes **path (a)**, the Sheets API v4
`values` surface, and does not use path (b), the CSV upload with conversion.

The reason is the consumer. The spreadsheet is a report read by people who never
run Saci: they receive a link once and open it thereafter. Path (b) produces a
**new file on every run** — a new id, a new URL, and a permission that has to be
granted again — so the link the team holds goes stale each time the report is
regenerated. Path (a) keeps one spreadsheet with one identity: created once,
shared once, rewritten on every run. Path (b)'s advantage, one Drive call and no
second API, buys nothing that offsets that.

The cost of (a) is D3, and it is a one-time console action, not a scope change.

#### D2 — The port that replaces `SheetGateway`: `SpreadsheetGateway`

Three methods — create and return identity, write the grid, grant a reader
permission — with the exact text in Edit 2. Four properties are load-bearing:

- **It is a replacement, not an extension** (spike S5). `readRows` had no consumer
  and must not acquire one; `writeRows(startRow, ...)` encodes the cell-by-cell
  reconciliation model that does not port. Both come off the port and the name
  changes with them, so that nothing reads as a patched `SheetGateway` and invites
  the old methods back.
- **It cannot express what was not measured.** No parent-folder parameter
  (creation was measured only in the My Drive root), and neither the role nor the
  grantee type is a parameter — the method is named `shareAsReader` and pins
  `type=user` / `role=reader` in the adapter. A wider grant is a new measurement,
  not a new argument.
- **It speaks `ColumnSelection`,** the type `applyColumns` in
  `packages/core/src/export.ts` already returns, so the report and the CSV export
  cannot drift in column selection or order. This is the "row type survives" half
  of S5, taken one step further into the type core already produces.
- **`SpreadsheetRef` carries `id` and `name` only.** No `mimeType` (no consumer),
  no URL: composing `https://docs.google.com/spreadsheets/d/<id>/edit` is an
  assumption about Google's URL format, and `webViewLink` was never requested by
  the probe. If the command brief needs a link, it measures first.

#### D3 — Enabling the Sheets API is a prerequisite, and it is not a scope

Path (a) requires the Google Sheets API to be enabled in the Cloud project. Run 1
of the spike failed on exactly this and run 2 passed after enabling it, with the
same token and the same granted scopes. It is a console action: it does not touch
the OAuth grant, does not invalidate `~/.saci/token.json`, and does not send any
user back through consent. It is already done in the owner's project, so it
blocks nothing here — it is documented as `G-SHEETS-1` (Edit 7) for the next
install, and named in the run instructions (Edit 8).

#### D4 — `writeGrid` replaces the grid, and the clear range is the one unmeasured literal

`values.update` anchored at `A1` writes over the cells the new grid covers and
**leaves everything below it untouched** — so a run with fewer rows than the last
would leave the previous run's tail visible in a report the team reads as current.
The port's contract is therefore replace, not overwrite: clear the first sheet,
then write.

Two literals, both named constants (R7):

- `VALUES_RANGE = "A1"` — unqualified on purpose. The spike's transcript echoes
  `updatedRange = 'Página1'!A1:Q3`: the default sheet is named in the account's
  locale, so any hardcoded sheet name is a latent failure on another account. An
  A1 range with no sheet name targets the first sheet. This is measured.
- `CLEAR_RANGE = "A:ZZZ"` — whole columns of that same first sheet, same
  no-sheet-name property. **This literal is not measured.** `values.clear` was
  never called by the probe. The live smoke closes it: if Google rejects the range
  as exceeding grid limits, the executor narrows it, records both the rejection and
  the accepted form in `notes.md`, and re-runs. It does not guess silently and it
  does not drop the clear.

The shrinking case is a mandatory smoke step, not a unit test: a fake cannot prove
what Google does with a range.

#### D5 — The port never reads; the smoke does, and says why

Verifying "no stale tail" requires reading the sheet back. That read is an
**instrument in the smoke script**, never a port method and never product code —
adding a read to the port is precisely the reversed decision S5 rejected. The
smoke reads back through `googleapis` directly, in one clearly-labelled helper.

#### D6 — Injected `SpreadsheetApi` seam, mirroring 047 D4

The gateway takes a narrow, adapter-owned interface at construction; one thin
module implements it over `googleapis`, and the tests inject a fake. Consequence,
intended and not a gap: everything decision-bearing is unit tested, and exactly
one module (the `googleapis` wrapper) is covered by the smoke instead.

#### D7 — Evidence model: unit tests plus an owner-run live smoke

The 046 / 047 model, unchanged. The executor authors the smoke and the run
instructions; the owner runs them and pastes output; the executor interprets and
records it in `notes.md`. Pastes follow the 037 evidence-close discipline:
final-message rule, single-block packaging, no new Pause over outstanding
evidence debt.

#### D8 — Authorization is reused from `adapter-drive`, not rebuilt

`@saci/adapter-sheets` depends on `@saci/adapter-drive` for `authorize`,
`defaultCredentialPaths`, and the OAuth client type. It imports **nothing else**
from it — not `DriveGateway`, not `DriveFilesApi`.

Three reasons, in order: there is one Google grant and one `~/.saci/token.json`,
and a second consent flow would be a second browser round-trip for the same user;
`G-DRIVE-2` makes two copies of the OAuth client type nominally incompatible, and
one shared definition removes the question instead of deferring it to whichever
brief first wires both adapters together; and the spike's own probe took this
route for the same reason. R25 governs the core↔adapter direction and is
untouched.

Extracting a shared `adapter-google` is the right move at the **third** consumer,
not the second (A3). Recorded as a follow-up in `notes.md`, not built here. The
same rule covers the failure-classification duplication between the two adapters'
`errors.ts`: duplicate now, extract at the third use.

R2 justification, for the future PR description: `googleapis@173.0.0` is already
in the tree at that exact pinned version (047 D7); adding it to a second workspace
package introduces no new dependency root and no new version.
`google-auth-library` is **not** added — the client type is derived from
`google.auth.OAuth2`, which is the copy `googleapis` itself uses (`G-DRIVE-2`).

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The brief is pre-saved before the executor is invoked; the executor verifies
presence and commits.

- [ ] Working branch is `feat/adapter-sheets` (constraint 8)
- [ ] `docs/tasks/2026-08-15-adapter-sheets-report/brief.md` exists; its first
      line is byte-identical to this brief's title heading
- [ ] `git add docs/tasks/2026-08-15-adapter-sheets-report/brief.md` staged
- [ ] Commit #1 subject matches the Commit sequence below

If the file is missing or the first line does not match, **STOP and report**. Do
not regenerate the brief from memory.

### Edit 2 — Replace `SheetGateway` with `SpreadsheetGateway` in `@saci/core`

**2a.** In `packages/core/src/gateways.ts`, replace the whole block from the
`/**` opening the `Port for the production-tracking spreadsheet.` comment through
the closing `}` of `export interface SheetGateway` (currently lines 37-48) with:

```ts
/**
 * A spreadsheet as the port surfaces it: identity only. Enough to write into it,
 * share it, and hand a person its id — and nothing about its content, because the
 * projection is one-way and the port never reads back.
 */
export interface SpreadsheetRef {
  id: string;
  name: string;
}

/**
 * Port for the team report: a spreadsheet Saci creates, fills, and shares with
 * people who never run Saci. It replaces the 019 `SheetGateway`, whose
 * `readRows` / `writeRows(startRow, ...)` pair existed only while the Sheet held
 * production state — the application has owned that state since the 2026-06-12
 * pivot, and the 2026-08-14 reversal made the spreadsheet a one-way report
 * instead. Every method is grounded in an operation measured live in the
 * 2026-08-15 spike, under the scopes `adapter-drive` already holds; the port
 * deliberately cannot express what that spike did not measure.
 */
export interface SpreadsheetGateway {
  /**
   * Create an empty spreadsheet named `name` and return its identity. It lands in
   * the account's My Drive root: creating inside a folder was not measured, so
   * there is no parent parameter to get wrong.
   */
  createSpreadsheet(name: string): Promise<SpreadsheetRef>;

  /**
   * Replace the first sheet's contents with `table` — header row, then one row
   * per record, anchored at A1. Replace, not append: a run with fewer rows must
   * not leave the previous run's tail below the new grid. `ColumnSelection` is
   * the export projection's own output type, so a report and a CSV of the same
   * profile cannot drift in column selection or order.
   */
  writeGrid(spreadsheetId: string, table: ColumnSelection): Promise<void>;

  /**
   * Grant one workspace user read access. One user as reader is exactly what was
   * measured, which is why neither the role nor the grantee type is a parameter.
   */
  shareAsReader(spreadsheetId: string, recipient: string): Promise<void>;
}
```

Add `import type { ColumnSelection } from "./export.js";` beside the existing
`Issue` import. If `SheetGateway` has any implementor or caller anywhere under
`packages/`, **STOP and report** — the sweep below says it has none.

**2b.** In `packages/core/src/index.ts`, remove `SheetGateway` from the
`export type { ... } from "./gateways.js";` block and add `SpreadsheetGateway`
and `SpreadsheetRef`, keeping the block's ordering style.

Verification:

- [ ] `grep -rn "SheetGateway\b" packages/` returns nothing outside
      `dist/` (the old name is gone from source)
- [ ] `grep -n "readRows\|writeRows\|startRow" packages/core/src/gateways.ts`
      returns nothing
- [ ] Each of the three method names appears exactly once in `gateways.ts`
- [ ] `grep -rn 'from.*adapter' packages/core/src/` returns nothing (R25)
- [ ] `npx tsc -b` and `npm test` pass, both suite totals reported — the port had
      zero implementors, so nothing should break; if something does, **STOP and
      report**

Commit: see the Commit sequence.

### Edit 3 — Publish the OAuth client type from `@saci/adapter-drive`

In `packages/adapter-drive/src/index.ts`, add `DriveAuthClient` to the existing
`export type { ... } from "./client.js";` line. One line, nothing else in that
package changes.

Verification:

- [ ] `git diff --stat packages/adapter-drive/` shows one file, one changed line
- [ ] `grep -n "DriveAuthClient" packages/adapter-drive/src/index.ts` returns one
      match
- [ ] `npx tsc -b` passes

### Edit 4 — Add `@saci/adapter-sheets` dependencies and build references

- `packages/adapter-sheets/package.json` — add dependencies
  `"@saci/adapter-drive": "*"` and `"googleapis": "173.0.0"` (exact, no caret —
  the evidence is version-specific), keeping `"@saci/core": "*"`.
- `packages/adapter-sheets/tsconfig.json` — add
  `{ "path": "../adapter-drive" }` to `references`, after the `core` entry. The
  root `tsconfig.json` already references `./packages/adapter-sheets`; do not
  touch it.
- Run `npm install` at the worktree root (constraint 9 carve-out).

If `npm install` cannot reach the registry, **STOP and report** — do not vendor,
stub, or skip the build. The owner then runs it locally and pastes the output.

Verification:

- [ ] `npm ls googleapis` reports `173.0.0` and no second version
- [ ] `git status --short` shows only `packages/adapter-sheets/package.json`,
      `packages/adapter-sheets/tsconfig.json`, and `package-lock.json`
- [ ] `google-auth-library` was **not** added to
      `packages/adapter-sheets/package.json` (D8)
- [ ] `npx tsc -b` and `npm test` pass, both suite totals reported
- [ ] No `node_modules` or `dist` path staged

### Edit 5 — Add `constants.ts` and `errors.ts` with tests

Under `packages/adapter-sheets/src/`. Named constants for every policy value (R7),
no `any` (R24), English-only (R9).

**`constants.ts`** (declarations only, no test): `SHEETS_API_VERSION` (`"v4"`),
`DRIVE_API_VERSION` (`"v3"`), `SPREADSHEET_MIME_TYPE`, `VALUES_RANGE` (`"A1"`),
`CLEAR_RANGE` (`"A:ZZZ"`), `VALUE_INPUT_OPTION` (`"RAW"`), `SHARE_TYPE`
(`"user"`), `SHARE_ROLE` (`"reader"`), `ITEM_FIELDS`, `PERMISSION_FIELDS`. Each of
`VALUES_RANGE` and `CLEAR_RANGE` carries the one-line "why" from D4: the locale-named
default sheet for the first, the unmeasured status for the second.

**`errors.ts` + test** (R4, constraint 3): `sheetsErrorMessage(operation, target, error)`
and `toSheetsError(...)`. The message names operation and target, then the status,
then an actionable hint chosen by an **ordered** rule list — the order is the
correction the spike paid for, and reversing it re-creates the bug that made a
disabled API look like a scope failure:

1. service disabled (`has not been used in project` / `SERVICE_DISABLED`) →
   enable the Sheets API in the Cloud project, pointing at `G-SHEETS-1`, and
   stating that this is **not** a scope failure;
2. scope-insufficient by message signature → the granted scopes do not cover the
   call; re-authorize after any scope change (`G-DRIVE-1`);
3. broken grant (`invalid_grant`, expired or revoked) → delete
   `~/.saci/token.json` and authorize again;
4. 404 → not found, or not visible: `drive.file` exposes only items this app
   created. State that and nothing about files other accounts created;
5. 429 / 5xx → transient Google-side condition;
6. an unclassified 401 or 403 → report it as an authorization failure of unknown
   cause. **Never borrow the scope verdict for a 403 that matches no rule.**

The sanitized-`cause` discipline of `packages/adapter-drive/src/errors.ts` is
reproduced here in full (constraint 3).

Tests: one per classification rule, in order, including a 403 that matches none
and must report as unknown; a non-`Error` input; an error with no status; that the
message contains operation and target; and the `G-DRIVE-3` assertion — a
placeholder refresh token and a placeholder authorization code do not appear in
`util.inspect(wrapped, { depth: null })`, each with an inline non-vacuity guard.

Verification:

- [ ] Every file ≤ 400 lines (R5), every function ≤ 50 lines (R6)
- [ ] `grep -rn ": any\|as any\|@ts-ignore\|@ts-expect-error" packages/adapter-sheets/src/`
      returns nothing (R20/R24)
- [ ] Every relative import carries `.js` (R21)
- [ ] No `*.test.ts` imports `googleapis` or performs a network call
      (constraint 4)
- [ ] The unknown-403 test exists and asserts the message does **not** name a
      scope cause
- [ ] `npx tsc -b` and `npm test` pass, with the new tests counted in the
      packages total

### Edit 6 — Add the `SpreadsheetGateway` implementation

**`client.ts`** — the `SpreadsheetApi` seam (D6): a narrow adapter-owned
interface — create the spreadsheet, clear the grid, write the grid, share as
reader — plus one factory implementing it over
`google.sheets({ version: SHEETS_API_VERSION, auth })` and
`google.drive({ version: DRIVE_API_VERSION, auth })`, reusing the call shapes
proven in the spike probe (`files.create` with `SPREADSHEET_MIME_TYPE` and
`supportsAllDrives`; `values.update` with `VALUE_INPUT_OPTION`;
`permissions.create` with `sendNotificationEmail: false`). The auth parameter is
typed as `DriveAuthClient` imported from `@saci/adapter-drive` (D8), aliased
locally to `GoogleAuthClient` with a one-line comment naming `G-DRIVE-2`. Not unit
tested — the smoke covers it.

**`gateway.ts` + test** — `class SpreadsheetGateway implements SpreadsheetGatewayPort`
(port imported aliased, the `adapter-drive` convention), constructed with an
injected `SpreadsheetApi`. `createSpreadsheet` returns `{ id, name }` and throws
when the response carries neither. `writeGrid` flattens `ColumnSelection` into
`[headers, ...rows]`, **clears before writing**, and is the only place that
ordering exists. `shareAsReader` passes the pinned type and role. Every call goes
through one private failure seam wrapping `toSheetsError` (R4) — no silent catch,
no `null` on failure.

Tests inject a fake `SpreadsheetApi`: create happy path; a create response missing
`id` throws naming the operation; `writeGrid` calls clear **before** update
(assert call order, not just occurrence); `writeGrid` sends header row first and
one row per record, in `ColumnSelection` order; an empty `rows` array still writes
the header; `shareAsReader` forwards the recipient and sends the pinned
`type`/`role`; a thrown API error surfaces a message naming operation and target.

**`index.ts`** — public surface: the class and its options type, the
`SpreadsheetApi` type, `createGoogleSpreadsheetApi(auth)`, and one convenience
factory `createSpreadsheetGateway(options)` that resolves credentials via
`defaultCredentialPaths()`, authorizes via `authorize()`, and returns the gateway —
mirroring `createDriveGateway`. Delete the Phase 1 placeholder export
`ADAPTER_SHEETS_PHASE` and the placeholder test `index.test.ts`, which exist only
to prove the empty package compiled.

Verification:

- [ ] `grep -rn "googleapis" packages/adapter-sheets/src/` matches `client.ts`
      only
- [ ] All three port methods implemented; `tsc` accepts the class as a
      `SpreadsheetGateway` implementation with no structural cast and no `as`
- [ ] `grep -rn "ADAPTER_SHEETS_PHASE" packages/` returns nothing outside `dist/`
- [ ] The call-order test fails if clear and update are swapped (verify by
      swapping them once, observing the failure, and restoring)
- [ ] Edit 5's size, `any` and import sweeps still pass over the new files
- [ ] `npx tsc -b` and `npm test` pass, both suite totals reported

### Edit 7 — Document the two Sheets traps in `docs/GOTCHAS.md`

Add a `G-SHEETS` row to the Categories table (`Google Sheets adapter — Sheets API
enablement, A1 ranges, values semantics`) and two entries in the file's four-field
format, placed after the last catalog entry and before the `---` preceding
`## Maintenance`:

`### G-SHEETS-1 — A disabled Sheets API answers 403 and reads exactly like a scope failure`

Symptom, cause and workaround from the spike: the first `values.update` against a
brand-new project answers `403 Google Sheets API has not been used in project
<n> before or it is disabled`; the call never reached authorization, so it says
nothing about scopes. Enable the API in the Cloud console; it does not touch the
OAuth grant, does not invalidate the token, and forces no re-consent. Evidence:
the two transcripts in `docs/tasks/2026-08-15-spike-sheets-report/notes.md` —
same token, same granted scopes, run 1 fails and run 2 passes.

`### G-SHEETS-2 — The default sheet is named in the account's locale`

Symptom: a range qualified with a hardcoded sheet name works for its author and
fails elsewhere. Cause: the spike's transcript echoes `updatedRange = 'Página1'!A1:Q3`
on a pt-BR account, so `Sheet1!A1` names a sheet that does not exist there.
Workaround: never qualify with a sheet name — an unqualified A1 range targets the
first sheet, which is what `VALUES_RANGE` and `CLEAR_RANGE` rely on. State in the
entry that the failure of a qualified name is **inferred from the observed echo,
not measured**; only the unqualified form was exercised.

Verification:

- [ ] `grep -n "G-SHEETS" docs/GOTCHAS.md` returns the category row and both
      entry headings
- [ ] Both entries carry all four format fields; no existing entry was modified
- [ ] `G-SHEETS-2` says in writing which half is inferred

### Edit 8 — Author the live smoke script and run instructions

**`docs/tasks/2026-08-15-adapter-sheets-report/sheets-smoke.mjs`** — throwaway
smoke, run from the repo root after `npx tsc -b`, importing the **built adapter**
(`packages/adapter-sheets/dist/index.js`) by relative path. It takes
`--share-with=<address>` (required; never echoed) and hardcodes no id, address, or
domain. Steps, one labelled evidence line each:

1. `createSpreadsheet` — print the id;
2. `writeGrid` with a header plus **three** fixture rows shaped like
   `ColumnSelection` over `EXPORT_COLUMNS`;
3. read back and print the row count and the last row's first cell — the D5
   instrument;
4. `writeGrid` again with a header plus **one** row — the shrinking case;
5. read back and assert **no stale tail**: exactly two rows survive. This is the
   step that closes `CLEAR_RANGE`;
6. `shareAsReader` with the `--share-with` address, printing the permission id,
   type and role, never the address.

Then print `[smoke] RESULT: N/6 ...` and the created spreadsheet id under
`CREATED — delete this by hand` (no delete call — deletion is not on the port).
Failures are classified loudly and do not abort the run (R4); a partial map is
data.

**`docs/tasks/2026-08-15-adapter-sheets-report/run-instructions.md`** — owner-facing
procedure, modelled on `docs/tasks/046-spike-adapter-drive/run-instructions.md`:
prerequisites (`~/.saci/oauth_client.json` present, `npm install`, `npx tsc -b`),
**the Sheets API enablement step with its `G-SHEETS-1` pointer** (D3), the exact
command line, what to paste back, and the never-paste list (credential file
contents, the authorization URL — it embeds the client id — the share recipient's
address, and consent screenshots). It states that **no scope changes**, so no
token deletion and no re-consent are required — and that if a browser consent
appears anyway, that is a finding to report, not a step to click through.

Verification:

- [ ] Both files exist under `docs/tasks/2026-08-15-adapter-sheets-report/`
- [ ] `node --check` passes on the smoke script
- [ ] `grep -n "googleapis" sheets-smoke.mjs` matches only inside the read-back
      helper, and that helper is labelled as the D5 instrument
- [ ] The smoke performs both writes and both read-backs; the shrink assertion is
      explicit
- [ ] The instructions name `G-SHEETS-1` and state that no re-consent is expected
- [ ] Secret sweep clean (see Structural checks)

### Evidence round (process, between Edit 8 and Edit 9)

The owner runs the smoke and pastes the output verbatim; the executor interprets
(D7). Expected: one round. On failure the executor diagnoses, revises the adapter
or the script, and requests a re-run — it never weakens the smoke and never
records a pass without pasted output. Revisions commit as
`docs(tasks): update the Sheets smoke script after the evidence round` and/or a
`fix(adapter-sheets): ...` subject approved at Pause 3.

**Two STOP-and-confirm guards.**

- If any step fails on **scope**, STOP and report with the pasted evidence. Do not
  add a scope, do not edit `DRIVE_SCOPES`, do not soften the smoke. The spike
  measured that pair as sufficient; a contradiction is the owner's call.
- If step 5 shows a stale tail, or `CLEAR_RANGE` is rejected, fix the range and
  re-run (D4). Do **not** relax the contract to "writes over the grid" — that
  ships a report that silently lies when the issue count drops.

### Edit 9 — Record the evidence in `notes.md`

Create `docs/tasks/2026-08-15-adapter-sheets-report/notes.md`, first line
`# Notes: 2026-08-15 — adapter-sheets evidence and decisions`, containing: the
smoke evidence (pasted excerpts, redacted per constraint 2, with date and platform
line and a per-step pass record, calling out step 5 as the one that closes
`CLEAR_RANGE`); the ready-to-paste **R2 justification** paragraph from D8 for the
future PR description; the supersession record for brief 019 (`SheetGateway`
retired, `readRows` never implemented) — stated here, never by editing 019; and
the follow-ups carried forward, each unclaimed and unbuilt: the shared
`adapter-google` extraction at the third consumer, folder placement, sharing
beyond one reader, and the report URL. Any Done-criteria checkbox that could not
be met is listed with its reason.

Verification:

- [ ] File exists; first line matches
- [ ] Each of the six smoke steps has an evidence line traceable to pasted owner
      output
- [ ] The stale-tail result is stated as measured, with the range literal that
      produced it
- [ ] The R2 paragraph names `googleapis@173.0.0` and states that
      `google-auth-library` was not added
- [ ] No sentence claims that writing to a foreign spreadsheet works or fails
- [ ] Secret sweep clean; no recipient address anywhere in the file

### Edit 10 — Reconcile `CLAUDE.md` and `docs/ROADMAP.md`

Two claims go false the moment Edit 6 lands, and both are present-tense
current-state claims, not dated history.

- `CLAUDE.md` line 18, the `@saci/adapter-sheets` bullet: rewrite it to describe
  the built adapter — the port it implements, the three operations, path (a) with
  the `G-SHEETS-1` prerequisite, the measured scope finding, and that no command
  wires it yet. Remove "a package shell, nothing built" and "No code exists yet".
  Keep the paragraph the same shape and length class as its neighbours; the
  `@saci/core` bullet on line 15 names `SheetGateway` among the three ports and
  is updated in the same edit.
- `docs/ROADMAP.md`, the `BI export` row status cell: replace the trailing
  sentence about nothing being built with one sentence naming this task, the port,
  and the absence of a command. One row. No phase restructuring.

Verification:

- [ ] `grep -n "SheetGateway" CLAUDE.md docs/ROADMAP.md` returns only
      `docs/ROADMAP.md`'s Phase-2 exit criterion, which is dated history and stays
      verbatim
- [ ] `git diff --stat CLAUDE.md docs/ROADMAP.md` shows two files and no more
      lines changed than the two bullets plus the one row
- [ ] No other row of the ROADMAP status table changed

### Commit sequence

1. `docs(tasks): add brief for 2026-08-15-adapter-sheets-report`
2. `refactor(core): declare SpreadsheetGateway as the report port`
3. `feat(adapter-drive): add the OAuth client type to the public surface`
4. `feat(adapter-sheets): add package dependencies and build references`
5. `feat(adapter-sheets): add constants and error classification`
6. `feat(adapter-sheets): add the SpreadsheetGateway implementation`
7. `docs(gotcha): add G-SHEETS-1 and G-SHEETS-2 for the Sheets API`
8. `docs(tasks): add the Sheets smoke script and run instructions`
9. `docs(tasks): add the Sheets adapter smoke evidence note`
10. `docs: update the adapter-sheets state in CLAUDE.md and the roadmap`

Conditional, only if the evidence round forces a revision (between 8 and 9, may
repeat): `docs(tasks): update the Sheets smoke script after the evidence round`
and/or a `fix(adapter-sheets): ...` subject the owner approves at Pause 3.

Every subject is ≤ 72 chars and its verb (`add`, `declare`, `update`, `fix`) is on
`VERB_ALLOWLIST` in `.claude/hooks/lib/commit-message.mjs`.

### Automated checks (run before each commit)

- [ ] `npx tsc -b` passes without errors
- [ ] `npm test` passes; **both** suite totals reported at every Pause 3 —
      packages and hooks. The packages total grows by the new adapter tests;
      the hooks total stays at 112
- [ ] Both run by hand — the pre-commit hook may not be wired in this clone
      (`G-HOOK-1`, constraint 10)

### Structural checks

- [ ] `git diff --name-only main..HEAD` shows only
      `docs/tasks/2026-08-15-adapter-sheets-report/**`,
      `packages/core/src/gateways.ts`, `packages/core/src/index.ts`,
      `packages/adapter-drive/src/index.ts`, `packages/adapter-sheets/**`,
      `package-lock.json`, `docs/GOTCHAS.md`, `CLAUDE.md`, `docs/ROADMAP.md`
- [ ] Nothing under `packages/cli/**`, `packages/adapter-jira/**`,
      `harness/**`, `.claude/**`; root `tsconfig.json` unmodified
- [ ] No `dist/`, `node_modules/`, `oauth_client.json`, or `token.json` tracked;
      `git status` clean at the end
- [ ] Secret sweep returns nothing:
      `grep -rnE "GOCSPX|ya29\.|\"refresh_token\"|\"client_secret\"|@estrategia" docs/tasks/2026-08-15-adapter-sheets-report/ packages/adapter-sheets/src/`

### Behavior checks

- [ ] `writeGrid` clears before it writes — asserted on call order in a unit test
      **and** evidenced live by the shrinking step
- [ ] A shorter second run leaves no row of the first run visible (live evidence)
- [ ] `createSpreadsheet` throws when the response carries no id (unit test)
- [ ] `shareAsReader` sends `type=user` and `role=reader` and cannot be asked for
      anything else (unit test plus the absence of a parameter)
- [ ] A disabled-Sheets-API 403 classifies as "enable the API", and a 403 matching
      no rule classifies as unknown (unit tests)
- [ ] A wrapped error does not carry a refresh token or an authorization code
      through `util.inspect` (unit test, `G-DRIVE-3`)
- [ ] No test performs a network call (constraint 4)
- [ ] Nothing produced claims that writing to a foreign spreadsheet works or fails

### Git checks

- [ ] Branch used: `feat/adapter-sheets` (not the `claude/*` worktree branch)
- [ ] Commits follow Conventional Commits (G-R3); subjects ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] Approved commit messages used verbatim; `git log -1` checked against the
      approved subject after each commit
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed; no PR opened

### Process checks

- [ ] Pause 1 — numbered plan presented and approved before any change
      (`Plan required: yes`)
- [ ] Pause 2 — first modified file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message + both test
      totals before each commit
- [ ] Staged set confirmed to match the current Edit's scope before each Pause 3
- [ ] The evidence round followed the 037 discipline: paste in the turn's final
      message block, single-block packaging, no new Pause over outstanding
      evidence debt
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code):** **required** — `Plan required: yes`. Present a
  numbered plan covering the module breakdown of Edits 5-6, the unit-test list,
  and the smoke's six steps. Wait for approval.
- **Pause 2 (after the first modified file):** show the result and wait for
  review. **Always required.**
- **Pause 3 (before each commit):** show `git status` + `git diff --stat` + the
  proposed message + both `npm test` suite totals. **Always required.**

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report (constraints 9 and 10
  cover the known environment cases).
- Undocumented gotcha discovered → report; Edit 7's two entries are the only ones
  in scope here.
- Live evidence contradicting the spike's scope finding → **STOP and report**.
  Never widen a scope on your own judgment.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: yes`. This task writes a new package of production code: module
boundaries, the fake-injection test list, the exact error-message wording, and the
smoke's assertions are real design work this brief scopes but does not hand over
as byte-exact text. The Pause 1 plan closes that gap before any file is created.

Decisions D1-D8 are **not** re-openable at Pause 1. The plan proposes the module
and test breakdown — not the write path, the port shape, the auth arrangement, or
the evidence model.

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — `G-DRIVE-1`, `G-DRIVE-2`, `G-DRIVE-3`, `G-NODE-2`,
   `G-HOOK-1` all bite this task directly
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6, Lesson #15
5. `.claude/skills/brief-template/SKILL.md` — template reference
6. `docs/tasks/2026-08-15-spike-sheets-report/notes.md` — the closed measurement
7. `docs/tasks/2026-08-15-spike-sheets-report/sheets-probe.mjs` — proven call
   shapes
8. `docs/tasks/047-adapter-drive/brief.md` — the structural precedent
9. `packages/adapter-drive/src/` — package, seam, and test conventions
10. `docs/tasks/037-evidence-close-protocol/brief.md` — evidence protocol

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat main...HEAD` (line counts per file)
3. The live smoke result, per step, with its pasted-evidence source — and the
   `CLEAR_RANGE` literal that survived step 5
4. Any verification checkbox that could not be met, with explanation
5. Confirmation that no `git push` was executed and no PR was opened
6. Suggested next step: owner authorizes push + PR (the description carries the R2
   justification transcribed in `notes.md`); then the command brief that wires
   this gateway into `saci` and decides what the report shows
