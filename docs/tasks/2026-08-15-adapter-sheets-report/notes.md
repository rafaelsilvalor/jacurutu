# Notes: 2026-08-15 — adapter-sheets evidence and decisions

Companion to `brief.md`. It records what the live run measured, what the run did
**not** measure, the errata this task accumulated against its own brief, and the
follow-ups it deliberately did not build.

## 1. The live evidence

Owner-run on 2026-08-15, Node v24.15.0 on win32, against the owner's real Google
workspace. The executor ran nothing live (brief D7): it authored the script and the
instructions, the owner ran them, and the transcript below is what came back.

**Redaction convention.** Placeholders replace, in this order of sensitivity: the
`--share-with` recipient (`<address>`), the created Drive file id
(`<SPREADSHEET-ID>`), the granted permission id (`<PERMISSION-ID>`), and the home
directory path (`<HOME>`). The redaction was applied before the transcript reached
the executor, which never saw the raw values (binding — brief constraint 2,
`docs/explorations/drive-oauth.md` §10). The script itself withholds the recipient
by design; the command line does not, which is why it is redacted here too.

```
$ node docs\tasks\2026-08-15-adapter-sheets-report\sheets-smoke.mjs --share-with=<address>
[smoke] node v24.15.0 on win32
[smoke] --share-with: supplied (never echoed)
[smoke] no scope change in this task: no browser consent is expected.
[drive-auth] reusing the token at <HOME>\.saci\token.json (no browser needed)
[drive-auth] refresh token present: true
[drive-auth] access token expiry: 2026-08-12T18:12:14.818Z
[drive-auth] granted scopes: https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly
[smoke] STEP 1 createSpreadsheet: PASS — spreadsheet created: id=<SPREADSHEET-ID> name=saci-sheets-smoke-2026-08-15T14-18-29-423Z
[smoke] STEP 2 writeGrid (3 rows): PASS — wrote a header plus 3 rows
[smoke] STEP 3 read back (instrument): PASS — sheet holds 4 rows; last row first cell="DES-1003"
[smoke] STEP 4 writeGrid (1 row, the shrinking case): PASS — wrote a header plus 1 row over the previous 3-row grid
[smoke] STEP 5 read back and assert no stale tail: PASS — exactly 2 rows survive (header + 1) — CLEAR_RANGE holds
[smoke] STEP 6 shareAsReader: PASS — permission granted to the supplied address (withheld by this script): id=<PERMISSION-ID> type=user role=reader
[smoke] RESULT: 6/6 steps passed
CREATED — delete this by hand
  spreadsheet: id=<SPREADSHEET-ID>
```

### 1.1 Per-step record

| Step | Operation | Result | What the line establishes |
|---|---|---|---|
| 1 | `createSpreadsheet` | PASS | the `files.create` shape in `client.ts` is one Google accepts; a native spreadsheet came back with an id and the requested name |
| 2 | `writeGrid`, header + 3 rows | PASS | the clear-then-update pair runs against a fresh sheet |
| 3 | read back (instrument) | PASS | `sheet holds 4 rows; last row first cell="DES-1003"` — the 3-row grid plus its header really landed, and the last row is the third fixture row |
| 4 | `writeGrid`, header + 1 row | PASS | the shrinking write executes over the larger grid |
| 5 | read back, assert no stale tail | PASS | `exactly 2 rows survive (header + 1)` — **this is the one that closes `CLEAR_RANGE`** |
| 6 | `shareAsReader` | PASS | `type=user role=reader`, granted, with the address withheld from the output |

### 1.2 `CLEAR_RANGE` is now measured, not inferred

`CLEAR_RANGE = "A:ZZZ"` was the single literal in this adapter that no measurement
covered: the 2026-08-15 spike never called `values.clear`, so nothing established
that Google accepts that range or that clearing it removes what a previous write
left behind.

Step 4 wrote a header plus one row over a grid that held a header plus three, and
step 5 read the sheet back and found **exactly 2 rows** where 4 had been. The two
rows the previous run contributed below the new grid are gone. The literal holds,
Google did not reject the range, and the port's replace-not-overwrite contract is
evidenced end to end rather than asserted.

**Text this makes stale, for the next brief to correct.** The doc comment on
`CLEAR_RANGE` in `packages/adapter-sheets/src/constants.ts` says "THIS LITERAL IS
NOT MEASURED" and points at the smoke as the thing that would close it. The smoke
has now closed it. That comment is committed code, outside this Edit's declared
paths, and this is a docs Edit — so it is recorded here as a correction the next
brief makes, not one this task performs.

### 1.3 The scope finding, reconfirmed by the shipped adapter

```
[drive-auth] granted scopes: https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly
```

Every operation above succeeded under exactly that pair — printed by the adapter's
own authorization layer at run time — with no browser consent, no `DRIVE_SCOPES`
edit, and no new token. This is a stronger claim than the spike could make on its
own: the spike proved the operations were possible under those scopes using a
throwaway probe, and this run proves the **shipped adapter** performs them under
the same grant. `G-DRIVE-1` never came into play, and no existing user is sent back
through consent by this task.

### 1.4 Unpredicted: the token was expired and refreshed silently mid-run

```
[drive-auth] access token expiry: 2026-08-12T18:12:14.818Z
```

The run happened on 2026-08-15. The stored access token had expired three days
earlier, and `google-auth-library` refreshed it during the run without the script,
the adapter, or the owner doing anything — which is `persistRefreshedTokens` in
`packages/adapter-drive/src/auth.ts` doing its job, and the reason the refreshed
token is written back to disk instead of being lost at process exit.

Recorded because nobody predicted it and it changes what the run covers: the
**refresh path executed**, which is the path `G-DRIVE-3` exists because of — a
refresh failure is exactly where an unredacted refresh token would surface on the
thrown error.

**What this does not establish.** The refresh *succeeded*, so no error travelled
that path. Nothing about the failure branch was exercised live, and the
credential-leak guard remains proven only by `errors.test.ts` (n) and (o) against
fixtures. Do not read "the refresh path ran" as "the leak guard was proven live".

### 1.5 What the smoke did not exercise

Stated beside the 6/6 so that "the adapter is proven end to end" never stands
unqualified:

- **`createSpreadsheetGateway`, the convenience factory in `index.ts`.** The smoke
  authorizes explicitly and constructs the gateway by hand, because the read-back
  instrument needs the same auth client and the factory does not hand it back.
  Every piece the factory composes — `authorize()`, `createGoogleSpreadsheetApi()`,
  `new SpreadsheetGateway()` — was exercised; its own three-line body was not. This
  is a **live handoff item**: the command brief that wires this gateway into `saci`
  touches that factory first.
- **Every failure path.** All six steps passed, so no classification rule in
  `errors.ts` was exercised against a real Google error. The rules are covered by
  unit tests only.
- **Writing to a spreadsheet this application did not create.** Out of scope by the
  brief, unmeasured by the spike, and nothing here claims it works or that it fails.
- **Sharing beyond one user as reader**, folder placement, and report-sized volume
  (the fixture is three rows).

## 2. R2 justification, for the PR description

Ready to paste, and it cites measurements rather than reasoning:

> `googleapis@173.0.0` was already resolved in this repository's dependency tree for
> `@saci/adapter-drive`, at exactly the version added here — the evidence is
> version-specific, so the pin is exact rather than a caret. Adding it to a second
> workspace package introduced **no new dependency root and no new version**, and
> that is measured, not argued: the lockfile diff for Edit 4 is 3 lines, all inside
> the `packages/adapter-sheets` workspace entry, and
> `git diff -U0 --cached package-lock.json | grep -E '^[+-] +"(node_modules|packages)/'`
> returns empty — not one package was added, dropped, or re-versioned. `npm ls
> googleapis` reports `173.0.0` deduped, with no second version at any depth.
> `google-auth-library` is deliberately **not** a dependency of this package: the
> OAuth client type is imported from `@saci/adapter-drive`, which derives it from
> `google.auth.OAuth2` — the copy `googleapis` itself uses (`G-DRIVE-2`).

## 3. Supersession: brief 019's `SheetGateway`

Brief 019 defined `SheetGateway` with `readRows()` and
`writeRows(startRow, rows)`. This task retires that port and replaces it with
`SpreadsheetGateway`.

- **019 stays verbatim.** It is a merged historical record and is not edited
  retroactively. This paragraph is the supersession record.
- **`readRows` was never implemented.** No adapter ever provided it, and no caller
  ever used it; the port had zero implementors at the moment it was replaced
  (measured during Edit 2 — `grep` returned only its declaration and the `index.ts`
  re-export).
- **Why replace rather than extend:** both methods encoded a spreadsheet that held
  production state. `readRows` existed to reconcile against a Sheet, and
  `writeRows`'s 1-based `startRow` only means something when patching cells in
  place. The application has owned that state since the 2026-06-12 pivot, and the
  2026-08-14 reversal made the spreadsheet a one-way report. Extending the old port
  would have left both methods available to be invited back.

## 4. Errata against this brief

Recorded here rather than by editing `brief.md`: the brief is committed, approved
in-flight text, and errata belong in notes.

### 4.1 Edit 2's two grep checkboxes are met in substance, not literally

The brief prescribes **byte-exact** port text whose own prose names what it
replaces — "It replaces the 019 `SheetGateway`, whose `readRows` /
`writeRows(startRow, ...)` pair existed only while..." — and then asks for a
literal grep of those same strings to return nothing. Both instructions are in the
same Edit and cannot both hold.

What is measurably true: there is no declaration and no caller. The tightened
commands that established it, run after Edit 2b:

```
$ grep -rnE "SheetGateway|readRows|writeRows|startRow" packages/ --include=*.ts \
    | grep -v "/dist/" | grep -vE ":[0-9]+: *(\*|//)"
(empty)
$ grep -rn "export interface SheetGateway" packages/ | grep -v "/dist/"
(empty)
```

The four strings survive only inside one doc comment in
`packages/core/src/gateways.ts` (lines 50-51), which is the supersession record the
brief itself asked for. The comment was not edited to make a grep green: that would
have made the check pass by destroying the reason the port changed.

### 4.2 Edit 6's `googleapis` checkbox is met in substance, not literally

The checkbox says `grep -rn "googleapis" packages/adapter-sheets/src/` matches
`client.ts` only. Measured, it matches four files — prose in two comments, fixture
URLs in two test files. The intent holds exactly:

```
$ grep -rn "^import.*googleapis\|from \"googleapis\"" packages/adapter-sheets/src/
packages/adapter-sheets/src/client.ts:23:import { google } from "googleapis";
```

One import, in `client.ts`, and no test imports the library (brief constraint 4).
Nothing was renamed to satisfy the literal form.

### 4.3 The general shape: a literal sweep cannot separate an object from the discourse about it

This happened **four times in one task**, which is why it is stated once here
rather than four times in passing. It is `G-PROC-1`'s shape, arriving in checks
rather than in rename sweeps:

1. **Edit 2's `SheetGateway` sweep** (§4.1) — the forbidden strings appear in the
   brief's own byte-exact port text, as the record of what was replaced.
2. **The secret sweep matching `brief.md:724`** — the line that *defines* the sweep,
   quoting its own pattern.
3. **The secret sweep matching `errors.test.ts:218`** — `"refresh_token"` as a
   string **key** being read out of a fixture whose value is
   `"test-placeholder-refresh-token"`.
4. **Edit 6's `googleapis` checkbox** (§4.2) — the library named in prose and in
   fixture URLs, not imported.

**A fifth instance arrived while this section was being written.** Running the
secret sweep over the task folder after saving this file matched
`notes.md:217` — the line immediately above, which quotes `"refresh_token"` in
order to explain instance 3. The paragraph documenting the shape reproduced the
shape. It is left exactly as it is: rewording it to dodge the pattern would make
the sweep quieter while making the record worse, which is the trade this whole
section exists to refuse.

No fix is proposed to any of the sweeps: that is a future brief's call, and the
value of naming the shape is that the next one is recognized rather than
rationalized. What the run did each time: measure the intent with a tightened
command, record both results, and change no artifact to make a literal pass.

### 4.4 "`git status` clean on branch at end" is UNMET

Three untracked entries sit in the worktree throughout: `.agents/`, `.codex/`, and
`AGENTS.md`. They are generated **outside this session** by a tool of the owner's
that writes them into the main checkout as well (25800 bytes there, 26009 here,
same 09:36:59 mtime), they were present in the session-open `git status` snapshot,
and they were rewritten mid-run while the executor was editing `packages/core`. No
Edit of this brief produces them and nothing of theirs was ever staged — every
commit's staged set was verified against its Edit's declared paths.

They were not deleted, staged, relocated, read, or added to any ignore file,
including `.git/info/exclude`: making the check pass by excluding the files would
have fixed the instrument instead of the fact. Standing watch throughout used
`git check-ignore -v .agents .codex AGENTS.md`, which returned empty at every gate.

This is an environment fact, not a defect in the work.

### 4.5 One commit outside the brief's declared sequence

`fix(adapter-sheets): state only what the spike measured in the hint` (`e414594`)
is an eleventh commit, between Edits 7 and 8.

Reason: the service-disabled hint shipped in Edit 5 told the reader the failing call
"never reached authorization". Nothing measured that — it is a claim about Google's
internal order of checks. What the spike observed is that one cached token with one
granted scope string failed before the API was enabled and succeeded after, which
rules scopes out and is the whole job of the hint. The text now says that and stops.

It was corrected in its own commit rather than carried as an erratum because it
shipped in the message a designer reads at the moment a call fails — read under
pressure, by someone deciding what to do next, which is the worst place to leave an
unmeasured assertion.

### 4.6 The provenance of that claim: three artifacts, one origin, no measurement

The unmeasured claim was not three independent slips. It has a chain, and the
origin is the document whose entire purpose was to separate the measured from the
assumed:

1. **Origin** — `docs/tasks/2026-08-15-spike-sheets-report/notes.md:100`, the
   spike's own decision note.
2. **Inherited** — `docs/tasks/2026-08-15-adapter-sheets-report/brief.md:546`.
3. **Shipped** — three sites in `packages/adapter-sheets/src/`: the module header,
   the hint itself, and an assertion in `errors.test.ts` that matched the phrase.

Each took it from the one before; none measured it. Only the code sites were
corrected. The two documentation sites stand: the spike note is a merged artifact
and the brief is approved in-flight text, and retroactive edits to either would
destroy the record this paragraph is made of.

## 5. What the tests prove, and what they do not

### 5.1 A test that covers behavior is not a test that pins a decision

Two decisions in this adapter are load-bearing and reversible by a one-line edit:
the classification rule order in `errors.ts`, and the clear-before-write order in
`gateway.ts`. Each was falsified by reversing it and running the suite. The
interesting result both times is **which tests did not notice**:

- **Rule order (Edit 5).** Swapped rules 1 and 2. Test (a), which sends a pure
  service-disabled message, **kept passing** — a message matching only one rule
  classifies correctly under either order. Only (b), the case built from a message
  carrying *both* signatures, failed. 14 of 15 passed with the bug in place.
- **Call order (Edit 6).** Swapped `clearValues` and `updateValues`. Test (e),
  which asserts the exact grid contents — header first, then one row per record —
  **kept passing**, because *what* is written does not change when the clear happens
  afterwards. 7 of 9 passed with the bug in place.

The two that failed on the call-order swap were (d) and (f), and they are not
equivalent: (d) exists to pin the decision and carries the explanation a future
reader needs, while (f) checks the empty-row case and caught the swap incidentally
through a secondary assertion on the call array. **(f) is redundancy, not a second
pin** — calling it a pin would overstate the coverage.

General form, for the next adapter: a test written for the behavior and a test
written for the decision look alike in a green suite and differ completely when the
decision is reversed. Only the second one protects it.

### 5.2 Test (i)'s claim is bounded, and the bound is written into the test

`gateway.test.ts` (i) asserts that a failed `shareAsReader` carries no recipient
address out of the adapter. What it proves: the adapter **strips** it — the fixture
failure's own payload carries the address (with a non-vacuity guard asserting the
fixture carries it before asserting the wrapped error does not), so it cannot pass
merely because the address was never there.

What it does **not** claim: that Google's own message text is scrubbed. If the API
ever puts an address into its message, that message is quoted as received. Recorded
as bounded so that "no recipient leaks" never stands unqualified.

### 5.3 A count asserted from memory is not a measurement

Three times in this run the executor stated a number from memory that was wrong
while the claim it supported was right: a commit subject called 57 characters that
measured 59; a comment called "one line" that was one sentence across three; and
"googleapis appears at four lines in the smoke" when the string appears at two (the
two instrument functions call `google.sheets(...)` and `google.drive(...)`, which do
not contain it). Each was caught by the owner re-measuring.

Recorded next to the falsification results because it is the same failure in a
different place: everything in this run was verified with an instrument except the
descriptions of the instruments' own output. The remedy adopted mid-run —
`printf '%s' "<subject>" | wc -c` pasted into every Pause 3 — closed it for commit
subjects only.

## 6. Follow-ups: unclaimed, unbuilt

None of these is started. Each names what it must begin with.

1. **A shared `adapter-google` package.** `adapter-sheets` duplicates
   `adapter-drive`'s failure-classification shape and its credential-path hints. That
   is deliberate: A3 puts extraction at the **third** consumer, not the second.
   Starts when a third Google-facing adapter exists — not before.
2. **Selectable permission role at the command level.** Requested by the owner
   during this task. **Constraint attached, and it is the whole point:** role and
   grantee type are not parameters today because only `type=user` / `role=reader`
   was ever measured. This work starts with a **measurement** of `writer`,
   `commenter`, and `type=group` under the current scopes — not with adding an
   argument to the port. Widening the signature first would ship a parameter whose
   values nobody has tested.
3. **Placing the report inside a Drive folder.** Creation was measured only in the
   My Drive root, so the port carries no parent parameter. Starts with a
   measurement of `files.create` with `parents` for a *spreadsheet* — brief 046
   proved it for a plain upload, which is not the same call.
4. **A report URL.** `SpreadsheetRef` carries `id` and `name` only. Composing
   `https://docs.google.com/spreadsheets/d/<id>/edit` is an assumption about
   Google's URL format, and `webViewLink` was never requested by any probe. If the
   command brief needs a link, it measures first.
5. **`createSpreadsheetGateway` is unexercised** (§1.5). The command brief touches
   it first; the smoke does not cover its body.
6. **`CLEAR_RANGE`'s "not measured" comment is now stale** (§1.2). A code change,
   outside this docs Edit's declared paths.

## 7. Done-criteria checkboxes not met

| Checkbox | Status | Reason |
|---|---|---|
| Edit 2 — `grep -rn "SheetGateway\b" packages/` returns nothing outside `dist/` | met in substance | §4.1 — no declaration, no caller; four strings survive in one supersession doc comment the brief's own byte-exact text prescribes |
| Edit 2 — `grep -n "readRows\|writeRows\|startRow" gateways.ts` returns nothing | met in substance | §4.1 — same doc comment, same reason |
| Edit 6 — `grep -rn "googleapis" packages/adapter-sheets/src/` matches `client.ts` only | met in substance | §4.2 — one import, in `client.ts`; the other matches are prose and fixture URLs |
| Git checks — `git status` clean on branch at end | **UNMET** | §4.4 — three untracked entries generated outside this session; never staged, never excluded |

Every other Done criterion in `brief.md` was met. Nothing was weakened to make a
check pass.
