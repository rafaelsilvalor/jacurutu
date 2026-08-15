# Run instructions: the 2026-08-15 Sheets report probe

Owner-run procedure for `sheets-probe.mjs`. The executor never runs it (D6):
it writes the script, you run it against the real Google workspace, and you
paste the output back so Edit 4 can record the findings. **No result is
inferred, simulated or guessed — an unrun step is reported as unmeasured.**

**Credential hygiene (binding — `docs/explorations/drive-oauth.md` §10):**
`oauth_client.json` and `token.json` never enter the repository, never appear
in chat, and are never logged. The probe prints no token value, no client
secret, and not the `--share-with` address. It *does* print the Drive ids of
the files it creates, because you have to delete them by hand — those ids are
redacted before anything is committed (see §5).

## 1. Prerequisites

1. `~/.saci/oauth_client.json` exists — the same Desktop-app OAuth client
   `adapter-drive` already uses. If it is missing, create it per
   `docs/explorations/drive-oauth.md` §5. Do not create a second one for this
   probe (D2).
2. Dependencies installed and the workspace built, so
   `packages/adapter-drive/dist/` exists — the probe imports the adapter's
   credential handling and its `DRIVE_SCOPES` from there:

```bash
npm ci
```

```bash
npx tsc -b
```

3. A destination folder id, optional. Without `--parent` the probe creates its
   files in the account's My Drive root, which is also fine — it never touches
   a pre-existing item either way.

Run every command below **from the repository root**.

## 2. Run 1 — the narrow run (current `DRIVE_SCOPES` only)

This is the run that answers S1-S4. It requests exactly the scope pair in
`packages/adapter-drive/src/constants.ts` — `drive.file` +
`drive.metadata.readonly` — and nothing else. Widening is a finding, never a
premise (D5).

```bash
node docs/tasks/2026-08-15-spike-sheets-report/sheets-probe.mjs --share-with=<address>
```

With an explicit destination folder:

```bash
node docs/tasks/2026-08-15-spike-sheets-report/sheets-probe.mjs --share-with=<address> --parent=<folderId>
```

`<address>` is the workspace user or group STEP 3 tries to share with, as
`reader`. Supply it: without it the probe prints
`STEP 3: FAIL n/a --share-with was not supplied, so S3 is UNMEASURED` and S3
stays open. `sendNotificationEmail` is false, so the recipient gets no mail.

On the first run the probe prints an authorization URL. Open it in the
browser, sign in with the Estratégia account, pass the "unverified app"
warning (Advanced → Continue), and authorize. The terminal then resumes and
prints the five `STEP` lines.

**Individual steps are expected to fail.** A failing step prints its status
and reason and the run continues — a partial map is the deliverable. A FAIL
carrying `[scope-insufficient signal]` is an answer to an S-question, not a
bug in the script.

## 3. `G-DRIVE-1` — delete `token.json` before **every** scope change

`~/.saci/token.json` caches the grant issued for the *previous* scope set.
Google enforces the scope string in the cached token, not the constant in the
code, so a stale token produces confusing 403 / `invalid_scope` failures with
no browser consent in sight (`docs/GOTCHAS.md` `G-DRIVE-1`).

The probe refuses to measure through a mismatched grant: if the cached token's
scopes are not exactly the set under test it stops with exit code 2 and tells
you to delete the file. **That check fires in both directions on purpose** — a
token left over from a wide run would make the narrow run pass and be recorded
as "`drive.file` is enough", which is the one wrong answer this spike must not
produce.

So: delete `token.json` and re-consent **before run 2, and again before any
return to run 1**. Cross-platform, one command (R1):

```bash
node -e "const{rmSync}=require('fs'),{join}=require('path'),{homedir}=require('os');rmSync(join(homedir(),'.saci','token.json'),{force:true});console.log('token.json removed')"
```

The file it deletes is `%USERPROFILE%\.saci\token.json` on Windows and
`~/.saci/token.json` elsewhere. Deleting it removes only the cached grant —
`oauth_client.json` is untouched, and the next run reopens the browser.

## 4. Run 2 — the widened re-run (**only if run 1 left a step failing**)

If STEP 2a failed under the narrow pair, the candidate addition is the Sheets
API scope. Delete `token.json` first (§3), then:

```bash
node docs/tasks/2026-08-15-spike-sheets-report/sheets-probe.mjs --share-with=<address> --wide=https://www.googleapis.com/auth/spreadsheets
```

`--wide` **adds** to the current `DRIVE_SCOPES`; it does not replace them, and
it does not edit `constants.ts` (D5). Pass several as one comma-separated
list. Whatever ends up being needed is recorded as a finding, and the
authorization change it implies belongs to a later brief, not to this one.

If every step passed in run 1, **do not run 2** — there is nothing to widen,
and that is itself the headline finding.

## 5. What to paste back, and what to redact first

Paste the probe's terminal output — the `[probe]` and `STEP` lines plus the
final `CREATED — delete these by hand` block — as **one fenced block per run**,
labeled "run 1 (narrow)" / "run 2 (wide)".

Before pasting, redact:

- **every Drive file id** in the `STEP` and `CREATED` lines → replace with
  `<ID-1>`, `<ID-2>`, keeping them distinguishable;
- **the folder id** you passed to `--parent`, if you passed one;
- **any e-mail address or workspace domain** that a Google error message may
  have echoed back — scan the output for `@` and for the domain before pasting;
- **the authorization URL**, in full: it embeds the client id. Never paste it.

Never paste the contents of `oauth_client.json` or `token.json`, and never a
screenshot of the consent screen. The probe itself prints none of that; the
list above covers what Google's own error strings might carry.

If a paste accidentally carries secret material anyway, stop and rotate the
credential before anything continues (brief constraint 4).

## 6. After the runs — clean up by hand

The probe never deletes or modifies anything: it creates its own files and
reports their ids. Open Drive and delete every id listed under
`CREATED — delete these by hand`, from both runs.

Then confirm the repository is untouched — the probe writes only to `~/.saci/`
and to Drive:

```bash
git status --porcelain
```
