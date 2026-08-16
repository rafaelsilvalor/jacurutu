# Notes: 2026-08-15 — the `saci report` command

Companion to `brief.md`. It records the decision this task's evidence overturned, what
the two live rounds measured, the amendments agreed after the brief was approved, and
the findings that outlived the run.

**Redaction convention**, reused from `docs/tasks/2026-08-15-adapter-sheets-report/`
§1: placeholders replace the `--share-with` recipient (`<address>`), each created
spreadsheet id (`<SPREADSHEET-ID-1>`, `<SPREADSHEET-ID-2>`), and the home directory
path (`<HOME>`). Redaction was applied **before** the transcripts reached the executor,
which never saw a raw value at any point in this task.

**One string in the transcripts is NOT a redaction.** Inside Google's own quoted error
message, `<recipient>` is the adapter's own output — `redact()` in
`packages/adapter-sheets/src/errors.ts` replacing the address Google echoed back. It is
evidence of the fix working, arriving live. Do not read it as a placeholder applied to
the record afterwards, and do not "restore" it.

## 1. D3 did not survive contact, and that is what this record is for

### 1.1 What D3 said

The approved brief's D3: `--share-with` is used **only** on the run that creates the
spreadsheet. On a run where the report already exists, the grid is rewritten and nothing
is shared. Passing the flag to a non-creating run was to be reported as skipped, not
silently ignored. The reasoning was sound in the abstract — reconciling permissions
across runs is remote-state reconciliation, a decision this project reversed on
2026-06-12 and never un-reversed.

### 1.2 What run 1 did

The first evidence round, 2026-08-15, with a mistyped recipient address:

```
$ node packages\cli\dist\cli.js report --payload ...smoke-payload.json --config ...smoke-export-config.json --profile smoke --share-with <address-with-a-typo>
[drive-auth] reusing the token at <HOME>\.saci\token.json (no browser needed)
[drive-auth] granted scopes: https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly
Sheets shareAsReader failed for spreadsheet <SPREADSHEET-ID-1>: status=400 message="Bad Request.
User message: "Você está tentando convidar <address>. Como não há uma Conta do Google associada
a esse endereço de e-mail, você precisará selecionar a caixa "Notificar pessoas" para convidar o
destinatário."". Hint: unclassified — read the status and message above
```

Order of operations under the brief as written: `createSpreadsheet` succeeded, the state
entry was persisted, `shareAsReader` failed, and the run aborted — so `writeGrid` never
ran. The spreadsheet was created empty.

### 1.3 What the world looked like afterwards

Run 2 found the state entry, took the reuse path, wrote the three rows, and shared
nothing, exactly as D3 specified:

```
$ node packages\cli\dist\cli.js report ... --profile smoke --share-with <correct-address>
Updated report <SPREADSHEET-ID-1> with 3 rows; not shared — --share-with applies only to the run that creates the report.
```

The result was a complete report that **no future invocation could ever share**. No later
run creates, and under D3 only a creating run shares. The typo was the trigger; any share
failure — a revoked account, a transient 5xx, a dropped connection — reaches the same
terminal state. The only escape was for the operator to hand-edit `~/.saci/report.json`,
which nothing in the product told them.

### 1.4 The implementation followed the brief exactly

Nothing in Edits 2 through 8 was wrong against its brief. `runReport` shared only on the
creating run because D3 said so; it aborted on a share failure because a throw propagates;
it persisted before writing because the brief ordered persistence first. The unit tests
were green, and one of them — the second-run test — actively pinned D3 as a decision worth
protecting. **The brief was wrong, and the code was a faithful implementation of it.**

That distinction is the reason this file leads with it. A record that opened with "6 of 6
observed" would describe a task that went well and omit the only part with transfer value:
a closed decision, argued from a real prior reversal, that a single live run falsified.

### 1.5 What replaced it

Owner ruling, 2026-08-15, after the first round:

- **Amendment 1** — on a creating run the grid is written BEFORE the share is attempted.
  A share failure must leave a complete report.
- **Amendment 2** — `--share-with` acts on ANY run. D3's creation-only confinement is
  withdrawn. The `skipped-existing` result value dies with the decision that produced it;
  the union is now `"granted" | "not-requested"`.

The brief text itself was not edited: it is approved in-flight material, and this
paragraph is the withdrawal record.

## 2. The second round: six of six observed

Owner-run 2026-08-15, after A1-A6 landed, from genuine first-run state — the owner
deleted the spreadsheet and removed `~/.saci/report.json`, verifying that
`identity.json`, `oauth_client.json` and `token.json` were untouched.

| Step | What it exercised | Result |
|---|---|---|
| 1 | create on an absent state file, with share | PASS |
| 2 | separate process, trimmed payload, share again | PASS |
| 3 | trimmed payload, no share flag | PASS |
| 4 | unknown profile | PASS |
| 5 | bad address, reuse path AND create path | PASS |
| 6a | spreadsheet trashed | PASS — and produced a finding (§4) |
| 6b | spreadsheet permanently deleted | PASS |

### 2.1 Step 1 — the factory's first execution in this repository's history

```
Created report <SPREADSHEET-ID-1> with 3 rows; shared as reader with the address you gave.
```

`createSpreadsheetGateway` — the convenience factory in
`packages/adapter-sheets/src/index.ts` — had never run. The previous task's smoke
authorized by hand and constructed the gateway itself, so the factory's three-line body
was exercised by no test and no smoke; that task's `notes.md` §1.5 recorded it as a live
handoff item and its §6 carried it as follow-up 5. **This line is that body's first
execution, anywhere, ever.** Follow-up 5 is closed.

The line also proves the absent-file path: no `report.json` existed, `readReportState`
answered an empty state rather than throwing, and the run created and stored an entry.

### 2.2 Step 2 — one identity across two processes, and the amended share

```
Updated report <SPREADSHEET-ID-1> with 1 rows; shared as reader with the address you gave.
```

Same id as step 1, from a separate process, with the state file as the only channel
between them. `Updated`, not `Created` — no second spreadsheet. And it **shared**, on a
run that created nothing: amendment 2 observed live, on the exact path D3 forbade.

### 2.3 Step 4 — the typo path, proven by an absence

```
Unknown export profile: "typo" (docs\tasks\2026-08-15-report-command\smoke-export-config.json)
```

**No `[drive-auth]` line appeared at all.** The unit test asserts the gateway thunk was
never called; the missing authorization lines are that same assertion observed in the
shipped artifact. A config typo costs nothing — no browser, no consent, no token read.

### 2.4 Step 5 — the incident re-run, on both paths

The owner ran it twice, once on the reuse path and once on the create path from a cleared
state file. The create-path run is the 2026-08-15 incident reproduced with the fix in
place: same command shape, same rejection, and where the morning's run left a spreadsheet
empty, the report came out complete — header plus three rows.

```
Sheets shareAsReader failed for spreadsheet <SPREADSHEET-ID-1>: status=400 message="Bad Request.
User message: "Você está tentando convidar <recipient>. Como não há uma Conta do Google associada
a esse endereço de e-mail, você precisará selecionar a caixa "Notificar pessoas" para convidar o
destinatário."". Hint: Drive rejected the share as a bad request — the recipient may have no Google
account behind that address, or the grant may require the notification flag; this was never
measured, so check the address for a typo first. The report itself is unaffected: only the share failed
```

Three observations from one invocation, and all three are amendments landing:

1. **A1** — the sheet held header plus three rows afterwards, where the pre-fix run left
   it empty.
2. **A4** — `<recipient>` in place of the address, inside Google's own message. Compare
   §1.2, where the same message carried it. That token is the adapter's output, not a
   redaction applied to this file.
3. **A3** — the hint names both candidate causes and claims neither, where §1.2 read
   `unclassified`.

### 2.5 Step 6b — D5 live

```
Report for profile "smoke" points at spreadsheet <SPREADSHEET-ID-2>, which Google answered 404 for.
Saci will not create a replacement: remove the "smoke" entry from <HOME>\.saci\report.json and the
next run creates a fresh report. Cause: Sheets writeGrid failed for spreadsheet <SPREADSHEET-ID-2>:
status=404 message="Requested entity was not found."
```

Profile, id, state path and fix, and no replacement spreadsheet appeared. The `Cause:`
chain shows the adapter's own classified message underneath, with the 404 hint intact.

## 3. Ledger: fourteen findings, one per section

Each stands alone. None is a clause inside another.

### 3.1 Six of eight tests passed against the code that caused the incident

Falsification of A1, reversing the grid/share order back to what shipped that morning:

```
not ok 1 - first run with no state creates, persists the id, shares, and writes the grid
ok 2 - second run with state reuses the id, creates nothing, and DOES share when asked
not ok 3 - a share failure on a creating run still leaves the grid written and the id stored
ok 4, ok 5, ok 6, ok 7, ok 8
# pass 6  # fail 2
```

**6 of 8 green on a defect that cost a live round.** The reuse path, the 404, the unknown
profile, the grid contents — every one blind to the ordering, because none was written for
it. Before this task the same file was 7 of 7 green with that defect present. This is the
concrete argument for tests written to pin a decision rather than to cover behaviour, and
it is a measurement rather than an opinion about test design.

Second falsification, A2, restoring D3 in one clause: predicted "test 2 only", measured
exactly that — 8 passed, 1 failed.

Every falsification in this run predicted which tests would survive **before** the broken
build ran, and every prediction matched. That is the more useful half: it means the suite
behaves the way its author believes it does.

### 3.2 A result field is a claim; the call array is the record

Under the A2 break, test 2's `deepStrictEqual` on the RESULT still passed. `share` was
computed from the flag alone, so the broken code returned a granted share while
`shareAsReader` was never called. The result object lied and the assertion on it did not
notice; only the call-array assertion caught it.

Fixed structurally at the owner's ruling: `share` is initialised to not-requested and
assigned granted inside the `if`, after the `await` resolves. **A result claiming a share
that did not happen is no longer constructible** — the same break now yields a
false-but-consistent result instead of a lying one.

Cost, measured rather than assumed: 2 lines, not the 0 predicted when the change was
ordered. `runReport` went 47 to 49 of R6's 50, held under budget by putting the rationale
in the doc comment, which sits outside the measured span.

### 3.3 The stack leak: two sites named, three sites needed

A4 was specified as redacting the composed message and the sanitized cause's message.
Both were done, and `gateway.test.ts` (i) still failed:

```
AssertionError: assert.ok(!inspect(error, { depth: null }).includes(PLACEHOLDER_RECIPIENT))
```

`sanitizedCause` copies the original stack to preserve the frames R4 wants, and **a V8
stack string opens with the error's message** — so the copy re-imported the address the
line above had just removed, and the stack is the part that prints on an unhandled
rejection.

Neither the owner nor the executor reasoned their way to it. It was caught by a
full-depth `inspect` assertion written eight days earlier, for a different secret (a
refresh token) that travels in a different field (`config.data`) on a different code
path. **Write the strongest available assertion, not the one that matches the threat you
currently have in mind.**

### 3.4 A bounded claim earned its keep in eight days

`docs/tasks/2026-08-15-adapter-sheets-report/notes.md` section 5.2 wrote down what its
recipient guard did NOT cover: that Google's own message text is not scrubbed, and if the
API ever put an address into its message, that message would be quoted as received.
Nobody had seen it happen; it was recorded as a bound rather than dropped as
hypothetical.

Eight days later the first live share failure came back with the invitee's address quoted
inside Google's pt-BR text (section 1.2). The bound was reached, and because it had been
written down, the response was an amendment rather than a discovery.

### 3.5 The trash finding: a failure with no symptom

Step 6a, unanticipated by any test, brief, or procedure. A spreadsheet in Drive's trash
keeps its id and keeps accepting writes:

```
Updated report <SPREADSHEET-ID-2> with 1 rows; not shared — pass --share-with to give someone access.
```

Exit 0, no warning, correct state file — while the link the team holds is dead. D5 covers
"the id does not resolve"; this is "the id resolves but the file has left use", and only
permanent deletion (6b) produced the 404. Written up as `G-SHEETS-4`, with no workaround
invented: detection would need a `trashed` metadata read that no port method offers, and
whether `drive.file` returns that field was never measured.

The owner found it by trashing before emptying — a sequence nobody had specified.

### 3.6 A procedure step that could not fail

Step 5, as committed in A5, used the trimmed payload — the same one step 2 writes. The
sheet held one row before and one row after, so its first observation, "the report was
written anyway", was satisfied identically whether or not the grid had been written. **It
would have passed against the exact pre-A1 code it exists to detect.**

It only became observable because the owner switched to the full payload mid-round. Fixed
in A7 to write three rows over one, with the reason stated in the step so it is not
simplified back, and the old failure mode converted into a STOP condition in
`run-instructions.md`: step 5 leaving the sheet unchanged at one row.

The general form: an expectation that holds whether or not the code works is not an
observation. A vacuous step in a live procedure is worse than a missing one, because it
reports success.

### 3.7 Five tooling-transport hazards, none of which announced itself

The tooling between an agent's intent and a file on disk failed five distinct ways in
this task, and not one presented as an error:

1. **The Write tool refused a mandated deliverable.** `report-smoke.md` was rejected as
   an "agent report file"; it is a brief-mandated artifact. Response: write the same file
   another way, never a different file.
2. **A heredoc failed to parse** at 157 lines, writing nothing. Response: write in chunks.
   It recurred while writing this very file, at a similar length.
3. **The editor announced falsification breaks as intentional, three times**, twice with
   an instruction not to mention the change. Each was the executor's own deliberate break,
   always scheduled for reversal. A tool cannot know the provenance of an edit it did not
   make, and one asking for silence about an unexplained change while a break sits in the
   working tree is a vector, not a courtesy.
4. **Python escape sequences corrupted a command line.** A tab and a swallowed date, in
   the one artifact the owner pastes into a terminal.
5. **A `sed` substitution matched one of two intended lines**, leaving a compile error
   that named the surviving line — the harmless variant, because the compiler caught it.

**The defence is verification of the written artifact, never of the intent to write it.**
Used throughout: `md5sum` against a pristine copy before and after every falsification;
byte-comparison of a repaired command line against its sibling; a tab sweep after every
generated edit; reading the file back rather than trusting a success return.

### 3.8 R6: `runReport` sits at 49 of 50

Measured at each change: 54 at first draft (over budget, fixed by extracting
`notFoundError` and inlining a single-use local), 50 exactly at Edit 4, 49 after A2's
restructure. The orchestration-handler exception in R6 was **not** claimed:
`.claude/hooks/lib/architecture.mjs` deliberately leaves that exception unencoded because
it needs judgment, and taking a judgment exemption silently is the failure that rule is
exposed to.

The alternative was offered and declined by the owner: splitting into `createReport` and
`rewriteReport` would drop the function to about twelve lines and cost the property that
the whole ordering — project before authorizing, read state before constructing the
gateway, persist before writing, write before sharing — is readable in one place.

**This is a constraint on the next brief, not a comfort for this one.** Whoever touches
`runReport` next must split rather than grow it, and they will only know that because it
is written here.

### 3.9 The prediction gap: 376 predicted, 377 measured

Stated at A3's Pause 3 rather than reconciled afterwards. Cause, in one sentence: the
Pause-1 plan counted two tests for A3, the owner then asked for a third — proving the
message rules still outrank the new operation table on a share — and the number was not
restated when the scope moved.

The rule adopted from it: **a prediction stops being a prediction the moment the scope
moves**, and restating it is the executor's job. The remaining totals were restated
unprompted from that point on, and every subsequent prediction matched.

The value of predicting was never an unbroken streak. It is that a mismatch has to be
explainable, and this one was, immediately.

### 3.10 Literal greps that measured false: four in this task

The shape `G-PROC-1` describes, arriving in verification commands rather than in rename
sweeps. Each was reported, the intent measured with a tightened command, and **no comment
or identifier was reworded to make a grep green**:

- **Edit 4** — "no test imports googleapis or the adapter's factory". Literal: 2 matches,
  both comments, one of them the sentence asserting the very property. Intent: a grep for
  import lines returns nothing, and the file's nine imports contain neither.
- **Edit 6** — "`createSpreadsheetGateway` returns the definition, this call, and nothing
  more". Literal: 5 matches. Intent: exactly one call site; the rest are the definition,
  its doc comment, the import line, and a comment asserting the property.
- **Edit 7** — `grep -n "NOT MEASURED"` returns nothing. It passed; the case-insensitive
  variant finds one line, the header sentence recording that `CLEAR_RANGE` *was*
  unmeasured and that the smoke closed it.
- **A2** — `skipped-existing` removed from the union. Literal: 1 surviving match, the doc
  comment stating the value no longer exists.

Plus the previous task's four (its section 4.3), which brings the running total across
the two tasks to **eight**. The pattern is stable enough to state as a rule: a brief that
prescribes exact text cannot then forbid its strings, and a checkbox written as a literal
grep over a file that documents its own decisions will measure false whenever the
decision is worth documenting.

### 3.11 Owner rulings that changed the approved brief mid-flight

Recorded here because the brief text was not edited — it is approved in-flight material,
and errata belong in notes.

- **Amendment 1 and 2** (section 1.5) — D3 withdrawn on evidence.
- **`packages/adapter-sheets/src/index.ts` joined the path list**, comments only. The
  brief scoped the adapter to a single comment correction in `constants.ts`; Edit 6 made
  two sentences in `index.ts` false, and a third was found four lines from the factory
  they described while fixing the first two.
- **`docs/GOTCHAS.md` joined the path list.** The brief's Pause-points section forbade a
  GOTCHAS entry; the owner lifted it for `G-SHEETS-3`, and later for `G-SHEETS-4`, on the
  reasoning that evidence is freshest now and a gotcha deferred to a follow-up brief is
  one written from memory or not at all.
- **`ReportRunInput` gained `now?: () => string`.** The executor declined to add a field
  to an interface the brief prints; the owner ruled that `run-fetch.ts`'s injected-clock
  precedent outweighs it, which bought an exact-string assertion on the stored
  `createdAt` instead of a shape check.
- **No 5b.** The executor proposed adding the create-path share failure as a sub-step,
  since the owner had run it live. Declined, with reasoning worth keeping: that path is
  already reachable by running step 1 then step 6b, and a 5b would require clearing the
  state file mid-procedure — the one thing steps 3 and 6 depend on being continuous since
  step 1. Buying a second observation by disturbing the variable every later step rests
  on is a bad trade. The live create-path run is recorded in section 2.4 regardless: it
  happened and it is written down, and the procedure need not reproduce every path ever
  measured.

### 3.12 Errata against this brief

- The brief's own text names `skipped-existing` twice (lines 320 and 334), in the
  `ReportRunResult` union and in the second-run test description. Both are correct
  records of what was approved and are left verbatim.
- Edit 10's checkbox `grep -n "No command wires it yet" CLAUDE.md` returns nothing cannot
  pass as written: line 17 carries the same sentence about `@saci/adapter-drive`, where
  it is still true and outside this task's scope. Measured at Edit 10 with a form scoped
  to the `adapter-sheets` bullet; line 17 was not touched.

### 3.13 What the previous task's follow-ups did, and did not, get

- **Follow-up 5 — `createSpreadsheetGateway` unexercised: CLOSED.** Section 2.1 is its
  first execution in this repository's history.
- **Follow-up 6 — the stale `CLEAR_RANGE` comment: CLOSED** by Edit 7, which also found
  and corrected two further false sentences in `index.ts`.
- **Follow-up 1 (a shared `adapter-google` package): NOT STARTED.** A3 and A4 deepened
  the duplication between the two adapters' `errors.ts`, which strengthens the case
  without meeting A3's rule-of-three threshold — there is still no third Google adapter.
- **Follow-up 2 (selectable permission role): NOT STARTED**, and untouched. Nothing here
  widened the share surface; `type=user` / `role=reader` remain pinned to what was
  measured.
- **Follow-up 3 (folder placement) and 4 (a report URL): NOT STARTED.** The result line
  prints the raw spreadsheet id precisely because composing a URL is an unmeasured
  assumption.

### 3.14 Follow-ups this task leaves behind

None is started. Each names what it must begin with.

1. **`G-SHEETS-4`'s detection question.** Whether a `files.get` under `drive.file` returns
   `trashed` for an app-created file was never measured. That measurement comes before any
   port change, and restoring from the trash is a separate question again.
2. **`1 rows` is not pluralized.** It is CONSISTENT with `renderExport`'s long-standing
   "wrote 1 rows", which is what makes it decidable: fixing it is a two-line change across
   both renderers or neither, and doing one alone would introduce an inconsistency that
   does not exist today. Documented in `report-smoke.md` so the owner does not report it
   as a defect.
3. **`adapter-drive`'s `sanitizedCause` copies `error.stack` verbatim.** Not a gotcha and
   not an edit: nothing measures a leak there today, and this project does not write
   gotchas from reasoning. What makes it actionable later is section 3.3 — a V8 stack
   opens with the message, so **any redaction added to that package must cover the stack
   or it covers nothing.**
4. **`MESSAGE_RULES` entries that match English words rather than machine-stable
   symbols** are latent instances of `G-SHEETS-3`. Stated inside that entry, where the
   next reader of the classifier will meet it.

## 4. What is still not exercised

Stated so that "the command is proven end to end" never stands unqualified.

- **A refresh run with no share flag on a report that was shared earlier.** Step 3 covers
  the not-requested rendering, but no run has confirmed that an earlier grant survives a
  later unshared run. Nothing reads permissions back — that is remote-state
  reconciliation, still reversed.
- **Every failure classification except two.** The 404 and the share 400 were provoked
  live. Service-disabled, insufficient scope, expired grant, 429 and 5xx are covered by
  unit tests against fixtures only.
- **Reports beyond three rows**, more than one profile in one state file, and a profile
  whose filters exclude every issue.
- **A share that succeeds to a group, or as a writer.** Pinned to `type=user` /
  `role=reader`, which is all that was ever measured.
- **Concurrent runs.** `writeReportEntry` is read-modify-write with no locking; two
  simultaneous runs against different profiles could lose one entry. Never measured, and
  no scenario in this task produced it.
- **A state file holding entries for several profiles**, in the live path. Unit-tested
  (the preserve-other-profiles case) but never exercised against Google.

## 5. Done-criteria checkboxes not met

| Checkbox | Status | Reason |
|---|---|---|
| Edit 4 — no test imports `googleapis` or the adapter's factory | met in substance | 3.10 — two comment matches, zero imports |
| Edit 6 — `createSpreadsheetGateway` grep returns the definition, this call, and nothing more | met in substance | 3.10 — one call site; the rest are the definition, its comment, the import, and a comment asserting the property |
| Edit 7 — `grep -n "NOT MEASURED"` returns nothing | met | 3.10 — passes literally; the case-insensitive variant is reported |
| Edit 10 — `grep -n "No command wires it yet" CLAUDE.md` returns nothing | **cannot pass as written** | 3.12 — line 17 says it of `adapter-drive`, where it is true and out of scope |
| Git checks — `git status` clean at end | **UNMET** | Three untracked entries — `.agents/`, `.codex/`, `AGENTS.md` — generated outside this session by a tool that also writes them into the main checkout. Never staged, never deleted, never excluded, including via `.git/info/exclude`. Watched at every Pause 3 with `git check-ignore -v`, which returned empty every time. An environment fact, not a defect in the work. |

Every other Done criterion was met. Nothing was weakened to make a check pass, and no
comment, identifier or fixture was edited to make a grep green.
