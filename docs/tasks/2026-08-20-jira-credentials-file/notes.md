# Live smoke evidence: the Jira credentials file

**The smoke RAN and it PASSED, on 2026-08-20.** `jacurutu fetch` reached real
Atlassian with credentials read from `~/.jacurutu/jira-credentials.json` and no
`JACURUTU_JIRA_*` variable supplying any value.

## 1. The result

Pasted by the owner, redacted before it entered the chat (run-instructions
section 8):

```
200 issues, 62 warnings → C:\Users\<you>\jacurutu-smoke\payload.json
```

The command that produced it:

```
node packages\cli\dist\cli.js fetch --jql "project = <PROJ> AND updated >= -7d" --out "$env:USERPROFILE\jacurutu-smoke\payload.json"
```

| | |
|---|---|
| Date | 2026-08-20 |
| Branch | `feat/jira-credentials-file`, read from the owner's shell prompt |
| Measured against | `09d659d` — commit #7, the run-instructions commit |
| Exit code | **not captured** — see section 2 |

The branch is recorded because the evidence has to say what it is evidence *of*.
`main` still reads the three retired variables, so a result measured there would
look identical on the success line and mean the opposite thing.

## 2. The exit code was not captured, and 0 is inferred rather than measured

Run-instructions section 7 asks for `echo $LASTEXITCODE`. It was not run. **This
record therefore carries no measured exit code, and does not claim one.**

Zero is *inferred*, and the inference is stated so it can be checked:
`renderFetch`'s summary line is written at `packages/cli/src/cli.ts:149`,
`runCommand` returns at line 150, and `main` sets `process.exitCode = EXIT_OK` at
line 229, where `EXIT_OK = 0` (line 34). Nothing sits between the write and the
assignment. The only route to a non-zero code is the `catch` at line 230, which
writes the error to stderr — and would have produced a message instead of the
summary line above.

The inference is sound. It is still an inference, and it is labelled as one
because this task's whole value is that it measured things: an inferred claim
typeset like a measured one costs the measured ones their meaning.

## 3. What was deliberately not recorded

The owner pasted the full issue table the run printed — roughly 190 rows of real
Jira keys and real content-calendar summaries. **None of it is in this file, and
none of it will be.**

No credential was in that table: no token, no email address, no password. It is
internal business content, and constraint 2 keeps real Jira content out of the
repository regardless of whether it is a secret. Counts are safe and are recorded
— "200 issues", "62 warnings" — because a count is not content. Keys and
summaries are content. The table stayed in the chat and dies there.

The payload file itself was written to `$env:USERPROFILE\jacurutu-smoke\`, which
is outside every working tree, and was never added to git.

## 4. What the run proves

Each of these was false, or unproven against a real host, before this run:

- the credentials file was read from `~/.jacurutu/jira-credentials.json`
- HTTP Basic auth was built from its `email` and `apiToken`
- `GET /rest/api/3/myself` accepted that credential — the pre-flight passed
- the JQL ran against real Atlassian and returned 200 issues
- the payload was written to a path outside the repository
- and no `JACURUTU_JIRA_*` variable supplied any value at any point

That is the card's entire subject: `jacurutu fetch` runs again on the owner's
machine, from a file that survives a closed terminal. It had not run since the
credential started living in a terminal session's process memory.

## 5. What the run did NOT exercise

**The D4 recorded-expiry sentence was not produced by any live run in this task,
and none was attempted.** The sentence — `The credentials file records this token
as expiring on <date>.` — is appended only inside the
`CREDENTIAL_REJECTED_STATUSES` branch of `verifyCredentials`
(`packages/adapter-jira/src/http.ts`), which fires on HTTP 401 or 403. A valid
token cannot produce it: the successful pre-flight took the other branch. This is
structural, not an oversight, and run-instructions section 0 tells the owner
explicitly not to damage a token to see it.

Its only coverage is two offline unit tests against an injected transport, in
`packages/adapter-jira/src/http.test.ts`:

- `a rejected credential with no recorded expiry throws the unchanged message` (line 211)
- `a rejected credential with a recorded expiry names that date (D4)` (line 228)

Also unexercised live, for the same reason — none of them reaches Atlassian by
design: every failure path of the reader (missing file, malformed JSON,
non-object document, missing or wrong-typed field, malformed `expiresAt`) and the
migration hint that names retired variables still exported. All are covered
offline by 13 unit tests in `packages/cli/src/jira-credentials.test.ts` and 3
end-to-end tests in `packages/cli/src/cli.test.ts` that spawn the built binary,
and three of them were demonstrated against the built CLI during Edit 5.

## 6. Observations the first live run surfaced

Three things this run exposed that are **not** defects of this brief and are
**not** fixed here. They are recorded because the first real call against a
production Jira is where they became visible, and they go to the task's
follow-up list rather than into this scope.

1. **62 warnings against 200 issues** — roughly a third of the result set.
   Partial-extraction warnings, collected by design and logged rather than
   serialized (`packages/cli/src/run-fetch.ts:181`, R4). Nobody has looked at
   what they actually are. A third is high enough that it is either a real
   mapping problem or a warning that fires too eagerly, and the two need
   different fixes.

2. **Many empty SUMMARY cells**, rendering as the `EMPTY_CELL` dash. Could be an
   absent Jira field, or a gap in the field mapping. Not diagnosable from the
   rendered table alone — it needs the raw payload, which is outside the
   repository and stays there.

3. **`runFetch` fails with a bare Node `ENOENT`** when the `--out` parent
   directory does not exist. The owner hit this on the first attempt. It is a
   jarring exception in this task's own terms: every error path this brief wrote
   names the file and the fix, and this one names neither. Section 6 of
   `run-instructions.md` has no outcome for it either, which is a gap in a
   document this task shipped.

## 7. Status

The brief's live-evidence requirement is **met**. The offline evidence stands
alongside it: `npx tsc -b` exits 0, 393 tests in the packages suite (392 pass, 0
fail, 1 pre-existing skip) and 112 in the hooks suite (112 pass, 0 fail), green
at every one of this branch's commits.

The declared gap is section 5: the expiry sentence has unit coverage and no live
coverage, and will not get live coverage until a token is actually rejected —
which, if the recorded date is honest, happens once a year.
