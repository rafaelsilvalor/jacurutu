# Run instructions: 046 drive-probe evidence rounds

Owner-run procedure for `drive-probe.mjs` (Windows). The executor never
runs these steps — the Cowork sandbox blocks the relevant network paths
(brief 046, constraint 4). You run each round locally and paste the
labeled output back into the chat.

**Credential hygiene (binding — `docs/explorations/drive-oauth.md` §10):**
`oauth_client.json` and `token.json` never enter the repo, never appear
in chat, never get logged. Everything below keeps them outside
`D:\Projects\saci`.

## 1. One-time setup

### 1.1 OAuth client

Reuse the existing OAuth Desktop client from the Python-era validation if
you still have its `oauth_client.json`. If it needs recreating, follow
`docs/explorations/drive-oauth.md` §5 (Google Cloud Console → Drive API →
External consent screen with your e-mail as test user → OAuth client ID,
type **Desktop app** → download JSON).

### 1.2 Scratch directory (outside the repo)

Create a scratch directory **outside** `D:\Projects\saci` — for example
`D:\Scratch\saci-046-probe` — and set it up:

```powershell
mkdir D:\Scratch\saci-046-probe
cd D:\Scratch\saci-046-probe
npm init -y
npm install googleapis google-auth-library
copy D:\Projects\saci\docs\tasks\046-spike-adapter-drive\drive-probe.mjs .
```

The ad hoc `node_modules` lives here, never inside the repo (constraint 2).
Note the installed `googleapis` version (`npm ls googleapis`) — paste that
line back with round 1; the decision note records it.

### 1.3 Credential files (outside the repo)

Place the credentials in the scratch directory (or any other non-repo
location):

- `D:\Scratch\saci-046-probe\oauth_client.json`
- `D:\Scratch\saci-046-probe\token.json` — created automatically by the
  first run; do not create it by hand.

### 1.4 Probe targets

Edit the constants at the top of your scratch copy of `drive-probe.mjs`:

- `PROBE_FOLDER_ID` — ID of a Drive folder you can safely write a small
  text file into (the ID is the tail of the folder's URL). Prefer a
  human-created folder that resembles the real vertical structure.
- `VERIFY_CHILD_NAME` — exact name of an existing, human-created child
  (folder or file) inside that folder. It must NOT have been created by
  this probe app — op (b) simulates the verify-never-create read.

## 2. Running a round

From the scratch directory:

```powershell
node drive-probe.mjs --client=D:\Scratch\saci-046-probe\oauth_client.json --token=D:\Scratch\saci-046-probe\token.json
```

On the first run the script prints an authorization URL. Open it in the
browser, log in with the Estratégia account, pass the "unverified app"
warning (Advanced → Continue), and authorize. The terminal then resumes
and prints the evidence lines.

**Scope-change trap (note §4):** whenever the `SCOPES` constant changes
between rounds, **delete `token.json` first** and redo the browser
authorization. A token issued for one scope set does not serve another;
the failure it produces is confusing (`invalid_scope` / generic 403).

## 3. The rounds

### Round 1 — candidate scope combination (baseline)

`SCOPES` as committed (`drive.file` + `drive.metadata.readonly`),
`READ_FILE_ID = ""`. Run once. All four operations target your own
account; op (d) reads back the file op (c) uploaded.

### Round 2 — cross-user manifest-content gap (if testable)

Requires a second account (another designer) added as a test user on the
same OAuth client, running the same script against the same folder:

1. Second account runs round 1 (its own `token.json`, same
   `oauth_client.json`); its op (c) output includes the uploaded file id.
2. On your machine, set `READ_FILE_ID` to that id and re-run (same
   scopes, keep your `token.json`).

Op (d) now attempts to read *content written by another user under the
same client ID* — the known gap of spike question 3. A 404 here with the
file visible in the Drive UI is the gap confirmed, not a bug.

If no second account is available, say so — the decision note records
the gap as explicitly untested (brief 046, D7). Never improvise.

### Round 3 — broad-`drive` fallback (only if round 1 or 2 fails)

Edit `SCOPES` to `["https://www.googleapis.com/auth/drive"]`, **delete
`token.json`**, re-authorize, re-run the failing configuration.

### Longevity citation (question 5, D5)

No live wait. The executor gathers Google's published refresh-token
policy (URL + excerpt) if the sandbox reaches Google documentation;
otherwise you will be asked to paste the relevant paragraph. The
`[auth] token minted at:` line from your first round is the dated
observation start.

## 4. What to paste back

Paste **only** the script's terminal output — the `[probe]`, `[auth]`,
`[op-*]`, and `[error]` lines — plus the `npm ls googleapis` line from
setup. One fenced block per round.

Never paste:

- the contents of `oauth_client.json` or `token.json`;
- the authorization URL the script prints (it embeds the client ID);
- browser screenshots of the consent flow.

The script never prints secrets, so its output is safe to paste as-is.
If a paste accidentally includes secret material anyway, the run stops
and the credential gets rotated before anything continues (brief 046,
constraint 3).
