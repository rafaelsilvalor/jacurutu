# `@jacurutu/adapter-sheets`

> Loaded when working under `packages/adapter-sheets/`. Moved out of the root
> `CLAUDE.md` on 2026-08-27: this is one adapter's design record, and the root
> file is read in every session regardless of what is being worked on.

implements `SpreadsheetGateway` against Google Sheets and Drive: create a spreadsheet, replace its grid, share it with one workspace user as reader. The spreadsheet is a **report for the team**, read by people who never run Jacurutu — a one-way projection target, never a return to state in the Sheet. Writes go through the Sheets API `values` surface (clear, then write anchored at an unqualified `A1`), which keeps one spreadsheet identity across runs so a shared link never goes stale; its one prerequisite is that the Sheets API is enabled in the Cloud project, a console action and not a scope (`G-SHEETS-1`). It adds **no OAuth scope**: create, write and share were all confirmed live under `adapter-drive`'s existing `drive.file` + `drive.metadata.readonly`, so `G-DRIVE-1` never fires. Authorization is reused from `adapter-drive` (one grant, one `~/.jacurutu/token.json`); the library is injected as a narrow seam, so every decision is unit tested and the seam itself is covered by an owner-run smoke. A failed share carries neither the recipient's address nor a borrowed verdict: the address is stripped from the message, the cause and the cause's stack (`G-DRIVE-3`), and a rejected share is classified by operation and status rather than by Google's prose, which arrives in the account's locale (`G-SHEETS-3`). **`jacurutu report --profile <name>` wires it** — the composition root builds the gateway and hands it the rows an export profile already selects, and the spreadsheet id persists in `~/.jacurutu/report.json` keyed by profile, so one report keeps one identity across runs. Evidenced by an owner-run live smoke of the command against synthetic fixtures; no production Jira data has passed through it. The report's folder and sharing beyond one reader remain unbuilt, and a report moved to Drive's trash still accepts writes while reporting success (`G-SHEETS-4`). Depends on `core` and `adapter-drive`.

## Gotcha ids referenced above

- `G-SHEETS-1` — the Sheets API must be enabled in the Cloud project. A console
  action, not an OAuth scope.
- `G-SHEETS-3` — a rejected share is classified by operation and status, never
  by Google's prose, which arrives in the account's locale.
- `G-SHEETS-4` — a report moved to Drive's trash still accepts writes and
  reports success.
- `G-DRIVE-1` — never fires here: this package adds no OAuth scope.
- `G-DRIVE-3` — the recipient's address is stripped from the message, the cause
  and the cause's stack.

Full entries live in `docs/GOTCHAS.md`.
