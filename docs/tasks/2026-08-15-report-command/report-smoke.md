# Live smoke: the `saci report` command

Five numbered steps the owner runs against a real Google workspace. The executor never
runs them (D8): it authored this procedure, the owner runs it, and the pasted output
becomes `notes.md`.

**The artifact under test is the command, not a script.** There is no `report-smoke.mjs`
here and there deliberately is not one. The previous task's smoke was a bespoke runner
that authorized by hand, and a bespoke runner proves the parts work when assembled by
the runner — not that `saci report` assembles them. Every step below drives the built
CLI, which is the thing that ships.

What only a live run can prove, and no fake ever will:

- `createSpreadsheetGateway` composes — its three-line body has never executed anywhere
  in this repository's history (previous task, `notes.md` section 1.5, follow-up 5);
- a second run rewrites the SAME spreadsheet instead of creating a second one;
- the state file survives between two separate process invocations.

## Fixtures, committed beside this file

| File | Contents | Used by |
|---|---|---|
| `smoke-payload.json` | 3 fake issues, `DES-1001` to `DES-1003` | steps 1, 4 |
| `smoke-payload-trimmed.json` | the SAME first issue only, 1 row | steps 2, 5 |
| `smoke-export-config.json` | one profile, `smoke`, 5 renamed columns | every step |

The trimmed payload is a **committed second file**, not the first one edited between
runs. Hand-editing a fixture mid-procedure makes the shrink case unreproducible and
leaves the one step that proves `CLEAR_RANGE` at the mercy of whoever edits it next.

The config carries a `format` of `csv` and an `output` path, and both are **ignored** —
that is D2 being exercised, not an oversight. A report's destination is the spreadsheet,
and the command must not reject a profile for carrying fields `export` needs. No `.csv`
is written by any step below.

Nothing in the fixtures is real: `example.invalid` cannot resolve, and `DES-` is not a
project key in the owner's Jira.

## Before you start

```powershell
npm install
npx tsc -b
```

The steps run the built entry point at `packages\cli\dist\cli.js`, which is exactly what
the `saci` bin resolves to. A stale `dist` measures the wrong code.

**This writes to your real `~/.saci/report.json`.** It is created on step 1 if it does
not exist. Step 6 leaves a dead entry behind on purpose; the cleanup section removes it.

## Step 1 — first run: creates, shares, writes

Its own process. Replace the address placeholder with a real colleague's workspace
address.

```powershell
node packages\cli\dist\cli.js report --payload docs\tasks\2026-08-15-report-command\smoke-payload.json --config docs\tasks\2026-08-15-report-command\smoke-export-config.json --profile smoke --share-with ADDRESS
```

Expected, one line on stdout:

```
Created report SPREADSHEET-ID with 3 rows; shared as reader with the address you gave.
```

Then record that the state file now holds an entry:

```powershell
Get-Content $HOME\.saci\report.json
```

Expected: a `reports.smoke` object whose `spreadsheetId` equals the id printed above,
plus a `createdAt` timestamp.

**Record:** the printed line (id redacted), and the state file's `smoke` entry (id
redacted). Confirm the two ids are the same value.

The grid is written BEFORE the share is attempted (2026-08-15 evidence). Step 5 is what
makes that ordering observable; here it is invisible because both succeed.

## Step 2 — second run, a SEPARATE process: rewrites, creates nothing, shares again

Close the terminal from step 1 and open a new one, or at minimum run this as its own
process. The property under test is that state survives process exit — two runs sharing
one process would prove less than they appear to.

The payload is the **trimmed** one, and the share flag is passed again on purpose. The
brief's D3 confined sharing to the creating run; the 2026-08-15 evidence round withdrew
it, because one failed share left a report nobody could ever be granted access to. So
this run SHARES — and creates nothing, which is the pair of properties under test.

```powershell
node packages\cli\dist\cli.js report --payload docs\tasks\2026-08-15-report-command\smoke-payload-trimmed.json --config docs\tasks\2026-08-15-report-command\smoke-export-config.json --profile smoke --share-with ADDRESS
```

Expected, one line:

```
Updated report SPREADSHEET-ID with 1 rows; shared as reader with the address you gave.
```

`1 rows` is not a typo: the row count is rendered without pluralization, exactly as
`saci export`'s line has always done.

Then read the state file again with `Get-Content $HOME\.saci\report.json`.

**Record:** the printed line (id redacted); that the id is the SAME one as step 1; that
the word `Updated` appears and `Created` does not; that the line says the report was
shared, on a run that created nothing; and that the stored `spreadsheetId` is unchanged.

**STOP if a second spreadsheet appears in your Drive.** The one-identity design failed
and the cause is diagnosed before anything is fixed.

## Step 3 — open the spreadsheet once: no stale tail

Open the report in Drive and look at the grid.

Expected: a header row plus **exactly one** data row, `DES-1001`. The rows `DES-1002`
and `DES-1003`, written by step 1, must be gone — not blanked, not sitting below the new
grid, gone.

**Record:** how many rows the sheet holds, and the first cell of the last row.

This is the clear-then-write contract, now proven **through the command** rather than
through a script that called the gateway directly.

## Step 4 — an unknown profile fails without opening a browser

```powershell
node packages\cli\dist\cli.js report --payload docs\tasks\2026-08-15-report-command\smoke-payload.json --config docs\tasks\2026-08-15-report-command\smoke-export-config.json --profile typo
```

Expected on stderr, and **no browser window**:

```
Unknown export profile: "typo" (...\smoke-export-config.json)
```

**Record:** the message, and explicitly that no consent screen appeared. A config typo
must never cost a designer a browser round-trip.

## Step 5 — a share that fails, with the report intact: the 2026-08-15 regression

This step re-runs the exact failure that produced the amendments, now with the fix in
place. It is not destructive — the report survives, which is the whole point.

Run step 2's command again, but put a deliberately malformed address after
`--share-with`: a string that is not an address at all, or an address at a domain with
no Google account behind it. Do NOT use a real colleague's address here.

```powershell
node packages\cli\dist\cli.js report --payload docs\tasks\2026-08-15-report-command\smoke-payload-trimmed.json --config docs\tasks\2026-08-15-report-command\smoke-export-config.json --profile smoke --share-with BAD-ADDRESS
```

The command FAILS, and there are **three separate things to look for** in what it
printed. Check all three; "did it fail" is not the observation.

1. **The report was written anyway.** Open the spreadsheet: it still holds the header
   plus the single `DES-1001` row. Before the fix the run aborted before writing and
   left the sheet empty. The share is not the deliverable; the report is.
2. **The address is NOT in the message.** Google quotes the invitee back inside its own
   text; the adapter now strips it and prints `<recipient>` in its place. Read the whole
   line: if the address you typed appears anywhere in it, that is a STOP and a finding.
3. **The 400 arrives classified, not unclassified.** The hint should name the two
   candidate causes — no Google account behind the address, or a grant needing the
   notification flag — and claim neither. If it says `unclassified`, the operation rule
   did not fire.

**Record:** all three observations, plus the failure line itself with the bad address
replaced by a placeholder. This is a regression step for a regression that actually
happened, so a partial pass is worth recording exactly as it comes.

## Step 6 — DESTRUCTIVE, RUN LAST: delete the spreadsheet, then run again

**This step destroys the report on purpose.** It is the only live proof of D5, and it is
also the case the owner will eventually hit for real — someone tidies Drive and the
stored id stops resolving. Run it only after steps 1 to 5 are recorded, because every
one of them needs the spreadsheet this step deletes.

1. In Drive, delete the report created in step 1, and empty the trash so the id
   genuinely stops resolving.
2. Run step 2's command again, unchanged.

Expected: a failure on stderr naming four things — the profile, the id, the state file's
path, and the fix:

```
Report for profile "smoke" points at spreadsheet SPREADSHEET-ID, which Google answered 404 for. Saci will not create a replacement: remove the "smoke" entry from HOME\.saci\report.json and the next run creates a fresh report. Cause: ...
```

**Record:** the message (id and home path redacted), and that **no new spreadsheet
appeared in Drive**.

**STOP if a replacement was created.** D5 is not negotiable at the evidence round: a
silent recreate produces a report nobody is shared into while the team keeps opening the
dead link.

## Cleanup

Step 6 leaves a dead entry in the real state file. Remove it, or delete the file:

```powershell
Remove-Item $HOME\.saci\report.json
```

Nothing else persists: no `.csv` is written, no scope changed, and `~/.saci/token.json`
is untouched by every step above.

## What this procedure does not exercise

Stated so that "the command is proven end to end" never stands unqualified:

- **A refresh run without the share flag.** Step 2 passes it, so the `Updated ... not
  shared` rendering is covered by unit test only.
- **Every failure classification.** Only the 404 and the share 400 are provoked.
  Service-disabled, scope and 5xx rules are covered by unit tests against fixtures in
  `adapter-sheets`.
- **A report with more than three rows**, more than one profile, or a profile whose
  filters exclude everything.
- **Sharing beyond one reader**, folder placement, and a report URL — follow-ups 1 to 4
  of the previous task, each unstarted.
