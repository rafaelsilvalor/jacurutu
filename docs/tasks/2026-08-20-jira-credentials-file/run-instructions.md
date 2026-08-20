# Run instructions: the Jira credentials file live smoke

Owner-run procedure (Windows / PowerShell). The executor never runs these steps:
it cannot reach Atlassian, must not read your `~/.jacurutu/`, and must not type a
token (brief constraint 4). You run them locally and paste the result back into
the chat; the executor interprets it and records the outcome in `notes.md`.

**Credential hygiene (binding — `docs/explorations/drive-oauth.md` section 10 and
`docs/explorations/README.md` rule 4):** `jira-credentials.json` never enters the
repository, never appears in chat, and never gets logged. Section 8 below is part
of the procedure, not advice.

Run the sections in order. Sections 3 and 4 decide whether the result means
anything at all: they put you in the one working tree that contains this code.

## 0. What this smoke proves, and what it cannot

**Proves:** `jacurutu fetch` resolves its credentials from a file rather than from
the environment, and a real Atlassian call succeeds with them. That is the thing
that has been broken since the credential lived only in a terminal session.

**Cannot prove:** the recorded-expiry sentence. That line appears only when Jira
*rejects* the credential (HTTP 401 or 403). A successful run never produces it.
Do not revoke or damage a token to see it — that is not asked for here, and
`notes.md` will record it as unexercised.

## 1. Create the credentials file

Path: `C:\Users\<you>\.jacurutu\jira-credentials.json` — that is
`~/.jacurutu/jira-credentials.json`, beside `identity.json`, `token.json` and
`report.json`. The directory already exists; only the file is new.

This file is per-user and lives outside any working tree, so it is created once
and section 3 does not affect it.

Four fields, all required:

| Field | What it is | Where you get it |
|---|---|---|
| `baseUrl` | your Jira Cloud site URL, no trailing slash | the address bar of your Jira |
| `email` | the Atlassian account email | the account the token belongs to |
| `apiToken` | the Atlassian API token | id.atlassian.com → Security → API tokens |
| `expiresAt` | the token expiry date, `YYYY-MM-DD` | **the Atlassian token screen** — it shows the expiry when the token is created, and the token list shows it afterwards |

`expiresAt` is required and has no default. Since December 2024 every Atlassian
API token expires within 365 days and there is no never-expires option, so a
token with no date does not exist. It is also the only field that makes a
rejected credential explain itself a year from now — omit it and the rest of this
task buys you nothing.

A date in the past is valid input. The CLI neither blocks nor warns on it.

Worked example. Every value below is a placeholder; replace all four:

```json
{
  "baseUrl": "https://your-site.atlassian.net",
  "email": "you@example.com",
  "apiToken": "<your Atlassian API token>",
  "expiresAt": "2027-08-19"
}
```

Save it as UTF-8. An editor that adds a BOM will make the run fail with a
malformed-JSON message naming the file.

## 2. Unset the three retired variables

`JACURUTU_JIRA_BASE_URL`, `JACURUTU_JIRA_EMAIL` and `JACURUTU_JIRA_API_TOKEN` are
no longer read by anything on this branch. Clear them from the current session:

```powershell
Remove-Item Env:JACURUTU_JIRA_BASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:JACURUTU_JIRA_EMAIL -ErrorAction SilentlyContinue
Remove-Item Env:JACURUTU_JIRA_API_TOKEN -ErrorAction SilentlyContinue
```

If any of them is persisted at user scope, clear that too:

```powershell
[Environment]::SetEnvironmentVariable("JACURUTU_JIRA_BASE_URL", $null, "User")
[Environment]::SetEnvironmentVariable("JACURUTU_JIRA_EMAIL", $null, "User")
[Environment]::SetEnvironmentVariable("JACURUTU_JIRA_API_TOKEN", $null, "User")
```

Confirm what is left:

```powershell
Get-ChildItem Env:JACURUTU_* | Format-Table Name
```

**If they are left set the run still works** — the file is the only source and
there is no fallback of any kind. But then the smoke stops distinguishing "read
the file" from "read the environment", so a pass would prove less than it could.
Clearing them is what makes the result mean what it says.

**Never re-export them to make an error go away.** If a run demands them, you are
in the wrong working tree, not missing a variable. Section 6 outcome (f) says so
in as many words.

## 3. Go to the working tree that has this code, and prove you are in it

`feat/jira-credentials-file` exists in exactly ONE working tree:

```
D:\Projects\jacurutu\.claude\worktrees\vigorous-yalow-685878
```

The path that reads like the obvious repository root — `D:\Projects\jacurutu` —
is a different working tree, checked out on `main`. `main` still reads the three
environment variables and has never heard of `jira-credentials.json`. Building
and running there would measure code this task did not write.

```powershell
cd D:\Projects\jacurutu\.claude\worktrees\vigorous-yalow-685878
git branch --show-current
git rev-parse --short HEAD
```

`git branch --show-current` must print exactly:

```
feat/jira-credentials-file
```

`git rev-parse --short HEAD` prints the branch tip; it should match the last
commit the executor reported. It is a second opinion, not the decision — the
branch name is what settles which code you are about to run.

**If the branch name is anything else — `main`, or a `claude/...` name — STOP and
`cd` to the path above.** Do not adjust anything else, and in particular do not
export credentials to get past an error; a wrong tree is a wrong tree.

Every command in sections 3, 4 and 5 runs from that directory. No command in this
procedure is ever run from `D:\Projects\jacurutu`.

## 4. Build, in that same tree

```powershell
npm install
npx tsc -b
```

**`npm install` here is not optional, and having run it in the main checkout does
not count.** `G-NODE-2` in `docs/GOTCHAS.md`: a worktree whose `node_modules` is
absent or empty makes Node resolve `@jacurutu/*` UP the directory tree into the
main checkout's workspace links, which point at the main checkout's `packages/*`
rather than this tree's. Because this worktree sits *inside*
`D:\Projects\jacurutu`, that walk always finds main and never fails loudly — the
gotcha's own words are that "build and tests pass while silently exercising stale
code". You would run this branch's `cli.js` against `main`'s adapters and be told
nothing.

After the install, confirm no tracked file moved — the same guard G-NODE-2
prescribes:

```powershell
git status --short
```

Expect empty output. **If `package-lock.json` appears, STOP and report it**: this
task adds no dependency, so lockfile drift means something else is wrong.

Then confirm the workspace links point inside this tree rather than up at main:

```powershell
Get-Item node_modules\@jacurutu\* | Select-Object Name, Target
```

Every `Target` must contain `worktrees\vigorous-yalow-685878\packages\`. A target
reading `D:\Projects\jacurutu\packages\...` means `npm install` has not taken
effect here and the run would measure main.

The procedure drives the **built** CLI at `packages\cli\dist\cli.js`. An unbuilt
or stale `dist` measures the wrong code just as surely as the wrong tree does.

## 5. Run the fetch

Create a destination outside the repository, then run — still from the worktree
directory of section 3:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\jacurutu-smoke" | Out-Null
node packages\cli\dist\cli.js fetch --jql "project = <KEY> AND updated >= -7d" --out "$env:USERPROFILE\jacurutu-smoke\payload.json"
```

Keep the JQL **narrow** — a week of one project is plenty. This smoke is about
credential resolution, not about volume, and a broad JQL only makes the redaction
work in section 8 longer.

The `--out` path sits outside the repository **on purpose**: the payload holds
real Jira content — issue keys, summaries, links — and it must never enter git.
`/payload.json` at the repository root is gitignored, but a path outside every
working tree cannot be committed by accident at all.

## 6. How to tell what happened

**Success — exit 0.** A table of issues on stdout, then a summary line, and
nothing on stderr:

```
<N> issues → C:\Users\<you>\jacurutu-smoke\payload.json
```

**Zero matches — exit 0.** The JQL matched nothing. This is *not* a credential
problem: the credential was accepted and the search was simply empty.

```
No issues matched.
0 issues → C:\Users\<you>\jacurutu-smoke\payload.json
```

**Every failure below exits 1 and prints to stderr.**

(a) The file is missing, or the path is not the one you think it is:

```
No Jira credentials file at <path>. Create it with:
{
  "baseUrl": "https://your-site.atlassian.net",
  ...
}
```

(b) The same, plus a retired variable still exported — section 2 was skipped:

```
... JACURUTU_JIRA_BASE_URL, JACURUTU_JIRA_EMAIL are set but no longer read; the value belongs in the file above.
```

(c) The file exists but a field is missing, empty, wrong-typed, or the date is
malformed:

```
Jira credentials file <path>: apiToken must be a non-empty string.
Jira credentials file <path>: expiresAt must be a calendar date in YYYY-MM-DD form.
```

(d) The file was read correctly and **Jira rejected the credential**:

```
Jira rejected the configured credentials (HTTP 401 on /rest/api/3/myself). The email / API token pair is invalid, expired, or revoked. The credentials file records this token as expiring on <date>.
```

(e) The site could not be reached at all — network, VPN, or a wrong `baseUrl`:

```
fetch failed
```

(f) **You are running `main`, not this branch.**

```
Missing required env: JACURUTU_JIRA_BASE_URL, JACURUTU_JIRA_EMAIL, JACURUTU_JIRA_API_TOKEN are not set.
```

This message means exactly one thing and nothing else. The code on this branch
cannot produce it — the block that emitted it was deleted, and no test on this
branch asserts that string any more. Seeing it proves you built or ran from the
wrong working tree, or from a stale `dist`. **Go back to section 3, check
`git branch --show-current`, and rebuild.** Do not export the three variables to
make it go away: that would produce a run that succeeds against `main`'s code and
proves nothing about this task.

Reading the rest: **(a), (b) and (c) mean the file never got read correctly** —
fix the file or the path and re-run, because nothing reached Atlassian. **(d)
means the file was read perfectly** and the credential itself is bad, which is a
real result worth reporting rather than a mistake. **(e) is a network answer**,
not a credential answer.

## 7. What to paste back

Three things, nothing else:

1. The **result line** — the summary line from stdout on success, or the whole
   stderr message on failure.
2. The **exit code**: `echo $LASTEXITCODE`
3. The **branch you ran from**: the output of `git branch --show-current`. One
   line, and it is what lets the executor record the evidence as belonging to
   this branch rather than assume it.

Do not paste the issue table, do not paste or attach `payload.json`, and do not
paste the credentials file.

## 8. Redact before pasting

Replace these in whatever you paste, **before** it goes into the chat:

- the site host → `your-site.atlassian.net`
- the account email → `you@example.com`
- the API token → `<token>`; it should never appear in any message at all, so if
  one shows up, stop and report that as a defect rather than redacting past it
- every issue key → `<KEY>-<n>`
- the Windows user name inside any path → `<you>`

`payload.json` is never added to git and never pasted, redacted or otherwise.

## 9. If the smoke is declined, or cannot run

Say so plainly. It is **not** a failure of this task: `notes.md` records the
absence in its first line, and the task closes on the offline evidence with a
declared gap. It is never recorded as passed, and never inferred from the tests.
