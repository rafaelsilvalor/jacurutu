# Notes — 2026-08-12 spike-art-chain — pass 1 measured

Pass 1 ran on 2026-08-12 against `MC-1073960`, on the owner's Windows machine
(Node v24.15.0, win32), from `D:\Projects\saci` at `ca572f8`.

**It stopped at stage 4 with `SCOPE-BLOCKED`, which is a result, not a failure.**
The question that could invalidate the whole product is answered, and the answer
is the one the brief called the highest risk. S1-S5 are all `not measured`.

## What ran

```
node docs\tasks\2026-08-12-spike-art-chain\probe.mjs
  --key MC-1073960
  --suindara D:\Projects\suindara
  --template D:\Projects\suindara-tmpl-carrossel-concursos
  --brand D:\Projects\suindara\brands\estrategia-educacao.json
  --out D:\Temp\spike-art
  --drive-folder <folder id, redacted>
```

Preconditions were **not** satisfied on the first attempt and this is worth
recording: `D:\Projects\saci` had a `node_modules` that existed but predated
`adapter-drive`, so `googleapis` and `google-auth-library` were absent and
`tsc -b` failed. `npm install` then `npm run build` fixed it, both exit 0, with
no tracked-file drift. **Presence of `node_modules` is not the precondition;
being current is.** `run-instructions.md` §1 says "install first" and is right,
but a reader who checks whether the directory exists will conclude wrongly.

## Output, verbatim except for two redactions

The Drive file id and the OAuth app number are replaced below. Neither is a
credential, but the file id points at unpublished campaign copy
(`D:\Projects\suindara\PORTING.md` §8) and nothing in this note needs it.

```
[probe] node v24.15.0 on win32; drive scopes under test:
        .../auth/drive.file + .../auth/drive.metadata.readonly
[jira] MC-1073960 vertical_raw="[EC] Geral" copy_source=sister
       copy_url=https://docs.google.com/document/d/<FILE_ID>/edit?...&rtpof=true&sd=true
[url] kind=doc id=<FILE_ID>
[drive-auth] reusing the token at C:\Users\rafae\.saci\token.json (no browser needed)
[drive-auth] refresh token present: true
[drive-auth] access token expiry: 2026-08-02T23:52:41.157Z
[drive-auth] granted scopes: .../auth/drive.file .../auth/drive.metadata.readonly
[drive] mimeType=application/vnd.openxmlformats-officedocument.wordprocessingml.document
[drive] path=media -> HTTP 403
[drive] google said: Drive readFileContent failed for file <FILE_ID>: status=403
        message="{ "error": { "code": 403, "message": "The user has not granted
        the app <APP_ID> read access to the file <FILE_ID>.", "errors": [ {
        "reason": "appNotAuthorizedToFile", "domain": "global",
        "location": "Authorization", "locationType": "header" } ] } }"
[drive] verdict SCOPE-BLOCKED under .../auth/drive.file + .../auth/drive.metadata.readonly
[drive] widening the scopes means deleting C:\Users\rafae\.saci\token.json first
[verdict] S1 ...: not measured
[verdict] S2 ...: not measured
[verdict] S3 ...: not measured
[verdict] S4 ...: not measured
[verdict] S5 ...: not measured
```

## Findings

### F1 — The copy is an uploaded `.docx`, not a native Google Doc

`mimeType` is
`application/vnd.openxmlformats-officedocument.wordprocessingml.document`.

The brief's original D2 assumed a native Doc, where `alt=media` 403s and
`files.export` is required. That was inverted, and the `rtpof=true&sd=true` tail
on the URL — spotted before the run and used to rewrite D2 — was the correct
tell. The amended D2 branched on `mimeType` and chose the `media` path, which
was right.

### F2 — The 046 D7 cross-user gap is confirmed, and it is not a misconfiguration

`reason: "appNotAuthorizedToFile"`.

The distinguishing detail: **the granted scopes in the token are exactly the
requested ones.** This is not `G-DRIVE-1` — there is no stale grant. It is
`drive.file` behaving as designed: it grants access *per file*, only to files
the app created or that the user selected through the Google Picker. The copy
document was authored by a copywriter and this OAuth client has never touched
it.

No amount of re-consent under `drive.file` changes this. The hypothesis recorded
as explicitly untested in `docs/tasks/046-spike-adapter-drive/notes.md` (D7) is
now tested, and it failed.

### F3 — There are two blockers stacked, and only the first was reached

This is the finding that matters most for planning, and it is invisible from the
output alone.

| # | Blocker | Why |
|---|---|---|
| 1 | **Scope** | `drive.file` cannot reach a third party's file (F2) |
| 2 | **Format** | Even with access, a `.docx` is a ZIP. `files.export` rejects non-Docs-Editors files; `alt=media` returns binary and the probe's text check would answer `BINARY-NOT-TEXT` (F1) |

**Fixing the scope alone does not make the chain work.** Any plan that treats
this run as "one permission away" is wrong.

### F4 — The review fixes worked, exercised for real on the first run

The run took the `SCOPE-BLOCKED` path, which before commit `1b1b935` called
`process.exit()` immediately after writing the verdict and never printed the
criteria table. Here the verdict printed, the table printed with five honest
`not measured` rows, and the process ended on `process.exitCode`. Two of the six
review findings are now confirmed fixed against reality rather than by reading.

The other four remain verified by reading only: the `statusOf` string-status
coercion (this 403 arrived as a number), the determinism count check, the
re-render exit check, and the flag-value guard.

### F5 — Token refresh works unattended, which matters for the server path

`access token expiry: 2026-08-02` — ten days stale — and the run proceeded
without a browser because the refresh token was present and used. That is one
small piece of evidence for the eventual headless-server question, though it
does not answer the consent-bootstrap problem.

## Decisions this opens — owner's, not the model's

Both must be answered; neither is answered by code.

**Scope.** Options, with their real costs:

- **`drive.readonly` (or `drive`)** — re-consent required, and `token.json` must
  be deleted first (G-DRIVE-1). Grants the app read access to everything the
  account can see. This is the fallback already documented in
  `docs/explorations/drive-oauth.md`. Note that Google classes `drive.readonly`
  as a restricted scope for published apps; for an internal Workspace app in
  testing it is usually unremarkable, but it is a policy question, not a
  technical one.
- **Google Picker** — `drive.file` *does* grant access to user-picked files.
  Works in an assisted flow where the designer selects the document; does not
  work in the unattended flow the product goal describes.
- **Service account with domain-wide delegation** — needs Workspace admin. The
  Python lane already uses a service account for Sheets, so the pattern exists
  in the organisation.

**Format.** Options:

- **Ask the copy team to author in Google Docs** rather than uploading Word
  files. Cheapest, removes the problem permanently, and needs no code. It is a
  process change and therefore also not the model's call.
- **Add a conversion step** — `files.copy` with
  `mimeType: application/vnd.google-apps.document`, export the copy, delete it.
  Requires read access to the source, so the scope decision comes first
  regardless.

**A third path worth measuring before buying either.**
`adapter-jira`'s `adfExtractText` already reads the issue description. If some
share of cards carry their copy in the Jira body rather than a Drive link, those
need no Drive read at all. Nobody has measured that share. A cheap follow-up
probe over a JQL page of recent cards would answer it, and it could shrink the
problem rather than solve it.

## Still unmeasured

Everything downstream of the read: normalization damage (BOM / CRLF / NBSP
counts), whether match is deterministic on a real brief, whether the strong
signal `^\s*L\d+\s*:` survives real copy, whether determinism holds across the
spawn boundary, and the Drive upload. Pass 2, which needs a card whose copy is
actually a carousel, has not been scheduled.

## What this changes in the plan

The brief sequence recorded in the session plan put "Core: brief-seam pure
functions" and "Drive text primitives" as briefs 2 and 3, both assuming the read
would work once `exportFileText` existed. F3 says otherwise: `exportFileText` is
necessary but not sufficient, and neither brief should start until the scope
decision lands, because the decision changes what the primitive must do —
`files.export` for a native Doc, a copy-convert-export sequence for a `.docx`,
or nothing at all if the copy moves into Jira.

The doctrine brief (identity shift, `CLAUDE.md`, `R26`) is unaffected and can
still go first: none of its content depends on how the brief text is fetched.
