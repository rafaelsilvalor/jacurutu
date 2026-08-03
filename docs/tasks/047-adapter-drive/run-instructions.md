# Run instructions: 047 adapter-drive live smoke

Owner-run procedure for `drive-smoke.mjs` (Windows). The executor never runs
these steps — the sandbox cannot reach Google and OAuth consent needs a real
browser (brief 047, constraint 4 / D3). You run the smoke locally and paste the
output back into the chat; the executor interprets it and records the evidence
in `notes.md`.

The smoke exercises all five `DriveGateway` primitives **through the built
adapter** — it contains no Drive call of its own. What runs is the code that
ships.

**Credential hygiene (binding — `docs/explorations/drive-oauth.md` §10):**
`oauth_client.json` and `token.json` never enter the repo, never appear in
chat, never get logged. They live in `~/.saci/` — outside your checkout — and
the script only ever prints their *paths*.

## 1. One-time setup

### 1.1 OAuth client (user type **Internal**, application type **Desktop app**)

In Google Cloud Console, on the project used for the 046 spike:

1. **APIs & Services → Enabled APIs** — confirm the **Google Drive API** is
   enabled.
2. **APIs & Services → OAuth consent screen** — user type must be
   **Internal**. This is the mode the spike project was converted to (D6): it
   removes both the 7-day refresh-token cap and the "unverified app"
   interstitial. If the screen still says External, switch it to Internal
   before continuing.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID** —
   application type **Desktop app**. Any other type (notably "Web
   application") fails later with an opaque `redirect_uri` error, and the
   adapter rejects such a file up front with a Desktop-app pointer.
4. Download the client JSON.

If you still have the Desktop-app `oauth_client.json` from the 046 rounds,
reuse it — no new client is needed. The External + Testing walkthrough in
`docs/explorations/drive-oauth.md` §5 is **historical**: it documents the
Testing-era path and is not current guidance.

### 1.2 Credential placement (`~/.saci/`, outside the repo)

The adapter resolves both files under your home directory — on Windows,
`%USERPROFILE%\.saci\` (the same folder as the task-036 identity file). Place
the client JSON by hand:

```powershell
mkdir -Force $HOME\.saci
copy <path-to-downloaded-client>.json $HOME\.saci\oauth_client.json
```

- `~/.saci/oauth_client.json` — placed by you, by hand.
- `~/.saci/token.json` — **created automatically by the first run**. Do not
  create it by hand.

Nothing needs to be copied into the repo, and no `node_modules` is installed
outside it: unlike the 046 probe, the smoke runs against the workspace build.

### 1.3 Scope-change trap (`G-DRIVE-1`)

If `DRIVE_SCOPES` ever changes, **delete `~/.saci/token.json` before the next
run** and authorize again. A token issued for one scope set does not serve
another, and the adapter reuses a token file without re-running consent — the
failure it produces (403 / `insufficient` or `invalid_scope`, with no browser
prompt) is confusing. Full entry: `docs/GOTCHAS.md` → `G-DRIVE-1`.

The scopes are unchanged from the 046 rounds, so if you still have that
`token.json` and it is in `~/.saci/`, it should be reused as-is.

### 1.4 Pick the two targets

The smoke takes them as arguments — nothing is hardcoded in the committed
script.

- **Target folder id** — a Drive folder you can safely let the smoke create a
  throwaway subfolder and file inside. The id is the tail of the folder's URL.
  Prefer a folder that resembles the real vertical structure.
- **Existing child name** — the exact name of an existing, **human-created**
  child (folder or file) directly inside that folder. It must **not** have
  been created by this app: step 2 is the verify-never-create read the later
  `ship` policy depends on, and it is only meaningful against something the
  app did not create itself.

## 2. Build, then run

From your saci checkout, on `feat/adapter-drive`:

```powershell
cd <your saci checkout>
npm install
npm run build
node docs\tasks\047-adapter-drive\drive-smoke.mjs --folder=<FOLDER_ID> --child="<EXISTING CHILD NAME>"
```

Quote the child name if it contains spaces. Equivalent env-var form, if you
prefer not to put the id on the command line:

```powershell
$env:SACI_SMOKE_FOLDER_ID="<FOLDER_ID>"
$env:SACI_SMOKE_CHILD_NAME="<EXISTING CHILD NAME>"
node docs\tasks\047-adapter-drive\drive-smoke.mjs
```

`npm install` and `npm run build` are required before the **first** run —
the smoke imports `packages/adapter-drive/dist/index.js`, which only exists
after a build. It says so explicitly if the build is missing.

**First run:** the script waits for authorization. Because the authorization
URL embeds the client id, it is **not printed** — the script writes it to a
temp file and prints only the path:

```
[drive-auth] authorization URL written to <temp dir>\saci-047-auth-url.txt
[smoke] open that file, paste the URL into a browser, and authorize. ...
```

Open that file, paste the URL into a browser, sign in with the Estratégia
account, and authorize. The terminal then resumes and prints the six evidence
lines. With user type Internal there is no "unverified app" warning to click
through. The temp file holds a client-id-bearing URL: it is not repo material
and not paste material — delete it whenever you like; a later run overwrites
it.

**Later runs:** no browser. The script reports
`[drive-auth] reusing the token at ...` and goes straight to the steps.

## 3. What the six steps prove

| Step | Primitive | What it asserts |
|---|---|---|
| 1 | `resolveFolder` | the target folder resolves, and is a folder |
| 2 | `findChild` | an existing human-created child is found |
| 3 | `findChild` | a name that cannot exist returns `null` — the absence answer |
| 4 | `createFolder` | **first live evidence in the project** — the 046 probe never ran it |
| 5 | `uploadFile` | a local temp file uploads into the folder from step 4 |
| 6 | `readFileContent` | the uploaded bytes read back identical |

Step 4 is the reason this round exists. Steps 5 and 6 depend on it: if step 4
fails, both are reported `BLOCKED` rather than run.

## 4. Afterwards: delete the two throwaway items by hand

The smoke creates one folder (`saci-047-smoke-<timestamp>`) and one file
(`saci-047-smoke.txt`) inside it, and **does not delete them**. Deletion is
deliberately not one of the five port primitives, so the adapter has no way to
remove them — the script prints their ids instead:

```
[smoke] CLEANUP — delete by hand: folder id=... name="saci-047-smoke-..."
[smoke] CLEANUP — delete by hand: file id=... name="saci-047-smoke.txt"
```

Delete the folder in the Drive UI (removing the folder takes the file with
it). Each run leaves a new pair, so clean up after each round rather than
letting them accumulate in a real production folder.

## 5. What to paste back

Paste the script's terminal output **verbatim, in one fenced block**: every
`[smoke]`, `[drive-auth]`, and `[step-N]` line — `PASS`, `FAIL`, `BLOCKED` or
`ABORTED` alike — including the `RESULT` and `CLEANUP` lines. That block is the evidence — the
executor records nothing as passing without it.

**Never paste:**

- the contents of `oauth_client.json` or `token.json`;
- the contents of the authorization-URL temp file
  (`<temp dir>\saci-047-auth-url.txt`) — the script no longer prints the URL,
  it writes it there for you to open, and it embeds the client id;
- screenshots of the consent screen.

The terminal output itself is safe to paste **as-is**, with no line-by-line
editing: the URL is redacted at the source, not by you at paste time. That is
deliberate — a hygiene rule that depends on remembering to delete a line
eventually gets violated.

If a paste does include secret material anyway, stop: the credential gets
rotated or revoked before anything continues (constraint 2).

**One case where that changes.** If the script cannot write the temp file, it
cannot redact, so it says so and then prints the URL:

```
[smoke] REDACTION FAILED — do not paste the next line: it is the authorization
URL and it embeds the client id. Reason: <reason>
```

The URL is then printed on the very next line, and nowhere else. If you see
that marker, drop the single line that follows it before pasting, and mention
the marker fired. A related, milder line — "a URL line from the auth
flow does not start with `https://accounts.google.com/` ... this detector may
be stale" — means the URL was still redacted but the script no longer
recognizes Google's host; report it and nothing is at risk.

### A partial result is still the answer — paste it as-is

If the script prints, say, `RESULT: 4/6 steps passed`, that is the result of
the round. Do **not** re-run to get a cleaner number: a re-run creates a second
throwaway folder, and the failure that matters is in the output you already
have.

Use the table in §3 to read what a partial number leaves unproven — the
`[step-N] FAIL` / `BLOCKED` lines name the steps, and each step maps to exactly
one primitive. A missing step means that primitive is **unproven**, not
"probably fine": `createFolder` in particular has no prior live evidence
anywhere in the project, so if step 4 fails, nothing in 046 covers it.

The executor then diagnoses from the pasted lines and either fixes the adapter
or the script and asks for one more round. Two cases it will not decide on its
own, and will hand back to you instead:

- the evidence suggests the granted scope pair is **insufficient** for a
  primitive — widening a scope is your call, not the executor's;
- the failure implicates an account or Workspace policy rather than the code.
