# Decision note: the Google Sheets report spike (2026-08-15)

## Verdict

**Creating a spreadsheet, writing its cells, and sharing it with a workspace
user all work under the OAuth scopes `adapter-drive` already holds.** No scope
is added, no `DRIVE_SCOPES` edit is needed, and no existing user is forced back
through browser consent (`G-DRIVE-1` does not fire).

The claim this spike was written to test — that create-and-share "exceeds
`adapter-drive`'s current OAuth scopes, so the first brief carries an
authorization change, not only code" — is **false, measured**. It had already
been demoted from a certainty to an open question in `CLAUDE.md` before
execution; this note closes it.

### The scope list the first implementation brief must request

Exactly the current pair, unchanged:

```
https://www.googleapis.com/auth/drive.file
https://www.googleapis.com/auth/drive.metadata.readonly
```

One **project-level** prerequisite is not a scope and must not be confused with
one: the Google Sheets API has to be enabled in the Cloud project, and only if
the implementation uses write path (a). Enabling it is a console action that
does not touch the OAuth grant and does not invalidate any token.

## Evidence

Both runs used the narrow pair only. **The widened `--wide` re-run never
happened, and that is the headline** — D5 makes widening a consequence of a
measured failure, and no step failed on scope.

Redaction (brief constraint 4, `docs/explorations/drive-oauth.md` §10): Drive
file ids, the permission id, the Cloud project number, and the home-directory
path are replaced with placeholders. The share recipient never reaches stdout —
the probe withholds it by design.

Provenance: both transcripts were produced by the probe as committed in
`5f13430`. The later commit `4423995` changed only the failure classifier
(see "The instrument was wrong once" below) and made no call to Google.

### Run 1 — narrow scopes, STEP 2a blocked before authorization

```
[probe] node v24.15.0 on win32
[probe] mode: NARROW (current DRIVE_SCOPES only)
[probe]   scope under test: https://www.googleapis.com/auth/drive.file
[probe]   scope under test: https://www.googleapis.com/auth/drive.metadata.readonly
[probe] parent folder: (My Drive root)
[probe] --share-with: supplied
[probe] reusing the token at <HOME>\.saci\token.json (no browser needed)
STEP 1: PASS — spreadsheet created: id=<ID-1> mimeType=application/vnd.google-apps.spreadsheet
STEP 2a: FAIL 403 Google Sheets API has not been used in project <PROJECT-NUMBER> before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=<PROJECT-NUMBER> then retry. If you enabled this API recently, wait a few minutes for the action to propagate to our systems and retry. [scope-insufficient signal — this is an S-question answer, not a bug]
STEP 2b: PASS — CSV converted on upload: id=<ID-2> mimeType=application/vnd.google-apps.spreadsheet
STEP 3: PASS — permission granted: id=<PERMISSION-ID> type=user role=reader recipient=(withheld by the probe)
STEP 4: PASS — granted scope string: https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly
[probe] RESULT: 4/5 steps passed under: https://www.googleapis.com/auth/drive.file + https://www.googleapis.com/auth/drive.metadata.readonly
CREATED — delete these by hand
  STEP 1 spreadsheet: id=<ID-1>
  STEP 2b spreadsheet: id=<ID-2>
```

### Run 2 — same narrow scopes, after enabling the Sheets API

```
[probe] node v24.15.0 on win32
[probe] mode: NARROW (current DRIVE_SCOPES only)
[probe]   scope under test: https://www.googleapis.com/auth/drive.file
[probe]   scope under test: https://www.googleapis.com/auth/drive.metadata.readonly
[probe] parent folder: (My Drive root)
[probe] --share-with: supplied
[probe] reusing the token at <HOME>\.saci\token.json (no browser needed)
STEP 1: PASS — spreadsheet created: id=<ID-3> mimeType=application/vnd.google-apps.spreadsheet
STEP 2a: PASS — values.update wrote 51 cells at 'Página1'!A1:Q3
STEP 2b: PASS — CSV converted on upload: id=<ID-4> mimeType=application/vnd.google-apps.spreadsheet
STEP 3: PASS — permission granted: id=<PERMISSION-ID> type=user role=reader recipient=(withheld by the probe)
STEP 4: PASS — granted scope string: https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly
[probe] RESULT: 5/5 steps passed under: https://www.googleapis.com/auth/drive.file + https://www.googleapis.com/auth/drive.metadata.readonly
CREATED — delete these by hand
  STEP 1 spreadsheet: id=<ID-3>
  STEP 2b spreadsheet: id=<ID-4>
```

The token reused across both runs carried exactly the pair under test, which
STEP 4 prints — so no wider leftover grant could have made a step pass. The
probe refuses to run at all when the cached grant and the requested set differ
in either direction.

## The instrument was wrong once, and the transcript shows it

Run 1's STEP 2a carries the label `[scope-insufficient signal — this is an
S-question answer, not a bug]`. **That label is wrong and is preserved above
rather than edited**, because the transcript is evidence and evidence is not
retouched.

The 403 meant the Sheets API was not enabled in the Cloud project: the call
never reached authorization, so it said nothing about scope. The probe's first
classifier treated every 403 as a scope signal. Had run 2 not happened, S2 path
(a) would have been recorded as needing a wider scope — an assumption filed as
a measurement, which is the exact failure this spike was written to prevent.

Fixed in `4423995`: classification is now an ordered rule list — service
disabled, then scope-insufficient by message signature, then a broken grant —
and a 403 matching none of them reports itself as an unknown authorization
failure instead of borrowing the scope verdict.

## The five questions

### S1 — Can a spreadsheet be **created** under `drive.file` alone?

**Yes.** STEP 1 passed in both runs. A Drive `files.create` carrying
`mimeType: application/vnd.google-apps.spreadsheet` produces a native Google
spreadsheet, and Drive returns that same mimeType on the created item. No
Sheets API involvement, no additional scope.

### S2 — Can cell content be **written** under `drive.file` alone?

**Yes, by both paths in D7.**

- **Path (a), Sheets API v4 `values.update`** — PASS in run 2: 51 cells at
  `A1:Q3`, which is the 17-column `ExportRecord` header plus the two fixture
  rows, intact. This is the result that settles D7: the Sheets API honors
  `drive.file`'s per-file access for a file the application itself created; it
  does not demand a `spreadsheets` scope for that case. Its only extra cost is
  enabling the Sheets API in the Cloud project.
- **Path (b), CSV upload with conversion** — PASS in both runs. `files.create`
  with `text/csv` media and the spreadsheet mimeType converts on upload and
  returns a native spreadsheet. It needs neither the Sheets API nor any scope
  beyond the pair.

Path (b) is the cheaper of the two: one Drive call, no second API to enable.
Path (a) is the one that can update a spreadsheet in place rather than produce
a new one.

### S3 — Can the file be **shared** under `drive.file` alone?

**Yes**, with a workspace **user**. STEP 3 passed in both runs: a
`permissions.create` with `type=user`, `role=reader` and
`sendNotificationEmail: false` against the spreadsheet created in STEP 1. The
recipient is a real person in the workspace, supplied by flag and never echoed.

Group sharing, domain sharing, and anything above `reader` were not exercised —
see "What was not measured".

### S4 — If a scope must be added, which, and what is the blast radius?

**No scope must be added, so the blast radius is zero.** STEP 4 confirms the
grant that produced every PASS above was exactly:

```
https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly
```

`G-DRIVE-1` therefore never comes into play for this feature: no
`~/.saci/token.json` is invalidated, and no existing user re-consents in the
browser. That is the cost this spike existed to avoid paying blindly, and it
does not have to be paid.

### S5 — Does the existing `SheetGateway` fit a create-and-share report?

**No — it must be replaced, not extended.** *This section is a reading of
`packages/core/src/gateways.ts` against the findings of S1-S3. It is a written
argument, not a measurement: nothing below was executed.*

The port is two methods:

```typescript
readRows(): Promise<Record<string, string>[]>;
writeRows(startRow: number, rows: Record<string, string>[]): Promise<void>;
```

Three mismatches, in order of severity:

1. **`readRows` has no consumer and must not acquire one.** Its own doc comment
   grounds it in `lib_sheets.py` `read_rows`, which existed to reconcile against
   a Sheet that held state. D3 makes the spreadsheet a one-way projection
   permanently, and the application owns production state. Reading rows back to
   drive behavior is the reversed decision, not a feature to port.
2. **`writeRows(startRow, ...)` encodes the reconciliation model.** A 1-based
   row offset is meaningful only when you are patching an existing sheet in
   place, which is the cell-by-cell diff engine CLAUDE.md says does *not* port.
   A report has no meaningful `startRow`.
3. **The port has no vocabulary for what was measured.** S1 creates and returns
   an identity; S3 grants a permission to a recipient. Neither creation nor
   sharing exists anywhere in the interface, and both are the reason the Sheets
   work left the parking lot.

What survives is the row type: `Record<string, string>[]` maps onto
`ExportRecord` without a change, which is consistent with D4 keeping
`projectIssue` as the row source.

So the replacement port needs, at minimum, to create a spreadsheet and return
its identity, write a full grid into it, and grant a reader permission to a
recipient. Naming it and fixing its exact signature belongs to the
implementation brief, not to this note.

## What was not measured

Named explicitly, because a spike that lists only what it proved is
indistinguishable from one that assumed the rest.

- **Sharing beyond one user as `reader`.** No `type=group`, no domain-wide
  sharing, no `writer` or `commenter`. The probe pins `type: "user"` and
  `role: "reader"`.
- **Creation inside a pre-existing folder.** Both runs used the My Drive root;
  `--parent` was never passed. Brief 046 did prove `files.create` into a
  human-created folder under this same scope pair (its op (c)), but for a
  plain upload, not for a spreadsheet.
- **Writing to a spreadsheet the application did not create.** Path (a) was
  proven against a file created moments earlier in the same run. By
  `drive.file`'s definition it should fail for a foreign file, and 046 already
  recorded the matching limitation for content reads.
- **Anything about the report's columns, layout, or refresh cadence.** Out of
  scope by the brief; the row source is settled and the rest is product design.
- **Behavior at report-sized volume.** The fixture is two rows.

## Next step

The first `adapter-sheets` implementation brief is unblocked and carries **no
authorization change**. It should decide between write path (a) and path (b) —
in-place update versus create-and-replace — define the replacement port S5
argues for, and treat enabling the Sheets API as a prerequisite only if it
chooses path (a).
