# Google Drive automation via OAuth — Estratégia environment

Status: exploration — possibilities only, NOT a commitment or spec
Origin: Python-era `automation/` guide (owner-supplied); absorbed in the
mentor session 2026-07-27 (`ship` semantics exploration)
Roadmap link: pending decision #11 (Google Drive JS library); feeds the
adapter-drive spike (slot 046 candidate)

Context document for AI agents building or maintaining Google Drive
automation in this environment (account rafael.silva@estrategia.com).
Records what was tested, what works, and the known traps.

Status of the underlying work: **proof of concept validated** in the
Python-era environment. No upload bot was built there; the v2
adapter-drive spike inherits these findings.

---

## 1. Key finding

The Estratégia Google Workspace **allows** the user's account to
authorize external OAuth apps (Desktop type). Tested and confirmed in
real execution.

This means: Drive read/write automation is viable without a Service
Account, without IT approval, and without installing Drive Desktop
(which the user cannot install on his machine).

Practical implication: any agent can build upload/download/organization
against this account's Drive by reusing the proven flow.

## 2. What existed in the Python `automation/` folder

| File | Role | Commit to git? |
|---|---|---|
| `oauth_probe.py` | Test script validating the OAuth flow end to end | Yes |
| `oauth_client.json` | OAuth Desktop credential downloaded from Google Cloud Console | **NO** |
| `token.json` | Access + refresh token persisted after first login | **NO** — equivalent to a password |

`token.json` is generated automatically on the first run and reused
afterwards. While the refresh token is valid, the automation runs
without opening a browser — suitable for Windows Task Scheduler and
unattended execution.

## 3. Validated OAuth flow

```
1. Load oauth_client.json (type "Desktop app")
2. InstalledAppFlow.run_local_server(port=0) opens the browser
3. User logs in with the Estratégia account and authorizes
4. Token saved to token.json (includes refresh_token)
5. Subsequent runs: Credentials.from_authorized_user_file() + automatic refresh
```

Python dependencies (reference only — v2 uses Node; library choice is a
spike question):

```
pip install google-auth google-auth-oauthlib google-api-python-client
```

API client:

```python
from googleapiclient.discovery import build
service = build("drive", "v3", credentials=creds, cache_discovery=False)
```

`cache_discovery=False` avoids cache warnings in environments without
oauth2client.

## 4. Scopes

| Scope | Use | Status |
|---|---|---|
| `drive.metadata.readonly` | List files and metadata, no content read | **Tested, works** |
| `drive.file` | Create/read/edit only files created by the app itself | Recommended by the original guide for a simple upload bot |
| `drive` | Full access to the user's Drive | Avoid — excessive permission |

When changing scopes, **delete `token.json`** and redo the flow. A token
issued for one scope does not serve another, and the resulting error is
confusing (`invalid_scope` or a generic 403).

**v2 addendum (2026-07-27 session):** `drive.file` alone likely blinds
the app to (a) human-created structure that the ship verify-never-create
policy must read, and (b) manifests created by another designer's
instance. Candidate combination to test in the spike:
`drive.file` + `drive.metadata.readonly` (write only what is yours +
see structure read-only). Known gap to probe: reading manifest *content*
written by another user under the same client ID. Drive appears to offer
no per-subtree OAuth scope (unverified). Fallback: broad `drive` scope
with containment guaranteed by the adapter's code-level path policy.

## 5. OAuth client setup (if it needs recreating)

1. https://console.cloud.google.com — create or reuse a project
2. APIs & Services → Library → enable **Google Drive API**
3. APIs & Services → OAuth consent screen:
   - Type: **External**
   - App name: anything (e.g. `drive-bot-rafael`)
   - User support email and Developer contact: the user's e-mail
   - Under **Test users**: add the user's own e-mail (mandatory while
     the app is in testing mode; each designer must be added as a test
     user in the multi-designer scenario)
4. APIs & Services → Credentials → Create credentials → **OAuth client ID**
   - Application type: **Desktop app**
   - Download JSON → save as `oauth_client.json`

On first authorization Google shows "unverified app" — expected for a
personal app. Path: **Advanced → Continue anyway**.

**v2 addendum:** External + Testing consent mode may cap refresh-token
lifetime (~7 days per Google policy — unverified; the original guide
gives no duration). Weekly re-consent would be unacceptable for the
unattended designer flow. Spike question: confirm longevity; if capped,
evaluate an Internal app (if the GCP project can live in the Estratégia
org) or publishing the app.

## 6. Error diagnosis

The original `oauth_probe.py` had a `_diagnose_error()` classifier.
Quick map:

| Symptom | Probable cause | Action |
|---|---|---|
| "Access blocked by organization" | Workspace policy changed | Ask IT to allow the client ID |
| "Unverified app" | Normal for a personal app | Advanced → Continue |
| `invalid_grant` / `expired` | Refresh token revoked or expired | Delete `token.json`, re-authenticate |
| Error mentioning `scope` | Token issued for a different scope | Delete `token.json`, adjust SCOPES, re-authenticate |
| Error mentioning `redirect_uri` | OAuth client created with wrong type | Recreate as **Desktop app** |
| HTTP 500 | Google-side instability | Retry with backoff; check status.cloud.google.com |

## 7. This OAuth vs. the Sheets Service Account

The Jira→Sheets sync pipeline uses a **Service Account**
(`credentials.json`) — a different, independent mechanism.

| | Service Account (Sheets) | User OAuth (Drive) |
|---|---|---|
| Identity | Robot with its own e-mail | The user himself |
| Access | Only resources explicitly shared with the robot | Everything the user sees |
| Interactive login | Never | Once, then automatic refresh |
| Credential file | `credentials.json` | `oauth_client.json` + `token.json` |

Do not mix the two. For Drive on this account, user OAuth is the path:
a Service Account cannot see the user's Drive without manual per-folder
sharing.

**v2 addendum:** the same user-OAuth mechanism works for any Google API
— if the parked Sheets projection ever promotes in v2, adding the
`spreadsheets` scope to the designer's existing OAuth is configuration,
not new infrastructure. The Python pipeline's Service Account stays
untouched (ROADMAP pending decision #4 default).

## 8. Known environment constraint

The Cowork sandbox **blocks** calls to `estrategia.atlassian.net`
(403 Forbidden Tunnel). The user is not an Atlassian Workspace admin and
cannot allowlist the domain.

Therefore the whole pipeline runs **locally on the user's Windows
machine** (`run_local.py` / `run_local.ps1` wrapper for Task Scheduler
in the Python era). An agent must not attempt the Jira fetch from inside
a sandbox — it will fail. If Drive automation runs under the same
scheme, assume local execution.

## 9. Next steps recorded by the original guide (not implemented)

Preserved as historical context from the Python-era plan; the v2
equivalents live in the ship decision set (mentor recap 2026-07-27):

- Upload bot: switch scope to `drive.file`, implement
  `files().create(media_body=...)` with resumable upload
- Spreadsheet integration: when `linkDrive` (column N) is empty and
  `status` indicates delivery, upload the file and write the link back
  to the cell — superseded in v2 by the app-owns-state pivot
- Naming: use `nomePasta` (column I) and `nomeArquivo` (column J) from
  the sheet — superseded in v2 by `derivePath`
- Scheduling: Task Scheduler task

## 10. Rules for agents (binding — see folder README)

- **Never** commit `token.json` or `oauth_client.json`
- **Never** print the contents of those files in logs or responses
- When changing `SCOPES`, warn the user he will need to re-authorize in
  the browser
- Prefer the most restrictive scope that solves the task
- Before destructive Drive operations (move, delete, overwrite), run in
  `--dry-run` mode and show the plan to the user

## Changelog

- 2026-07-27 — Translated to English from the owner's Python-era guide;
  v2 addenda added (scope combination candidate, refresh-token longevity
  question, Sheets-scope door, superseded next steps). First occupant of
  `docs/explorations/`.
