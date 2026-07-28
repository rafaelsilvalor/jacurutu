# Notes: 046 — Drive spike decision note

Date: 2026-07-27. Evidence base: three owner-side evidence rounds on
the owner's Windows machine (`drive-probe.mjs` + `run-instructions.md`,
this folder), per the D2 execution model — the executor authored and
interpreted; the owner (Orchestrator-assisted) ran and pasted. Round 1:
probe under the candidate scopes. Round 2: cross-user gap — resolved as
untested (no second account) + the question-5 policy citation. Round 3:
consent-mode conversion to Internal + probe re-run. All excerpts below
are from the pasted outputs and contain no secret material (paths, IDs,
scope strings, and expiry metadata only).

## Decision (resolves ROADMAP pending decision #11)

**`adapter-drive` will use `googleapis` + `google-auth-library` (user
OAuth, Desktop-app loopback flow) with the scope combination
`https://www.googleapis.com/auth/drive.file` +
`https://www.googleapis.com/auth/drive.metadata.readonly`.**

Proven versions: `googleapis@173.0.0`, `google-auth-library@10.9.1`
(also deduped at `10.5.0` inside `googleapis-common@8.0.3`), Node
v24.15.0 on win32. Operational setup: OAuth consent screen user type
**Internal** (converted during the spike — see question 5), which
removes the 7-day refresh-token cap and the unverified-app screen.

## Question 1 — Auth inventory (settled input, not re-researched)

User OAuth (Desktop app flow), not Service Account. Settled by
`docs/explorations/drive-oauth.md` §1 and §7, validated in real
execution in the Python era: the Estratégia Workspace allows external
OAuth Desktop apps for the user's account, and a Service Account cannot
see the user's Drive without per-folder manual sharing. Recorded here
per brief 046 D1; no new research was performed.

## Question 2 — Node library choice

**Chosen: `googleapis` + `google-auth-library`.** The OAuth loopback
(installed-app) flow was proven in Node — not assumed from the Python
PoC:

```
[auth] loopback server listening on http://127.0.0.1:61743/oauth2callback
[auth] loopback flow completed; token saved to D:\Scratch\saci-046-probe\token.json
[auth] refresh_token present: true
[auth] granted scope string: https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly
```

Weighing (dependency footprint vs. implementation cost):

- **Cost of the alternative (raw `fetch` REST, adapter-jira spirit):**
  Jira needed only Basic auth over a paginated JSON endpoint — raw
  `fetch` was near-free there. Drive is not comparable: the adapter
  would hand-roll the OAuth token exchange, refresh-token rotation and
  persistence, multipart/resumable media upload, and media download —
  exactly the error-prone surface `google-auth-library` and the
  `drive.files` client already provide (the probe used them end-to-end
  with zero auth plumbing of our own).
- **Footprint:** `googleapis` is a large package (it bundles every
  Google API surface), but it is a build-time size cost, not an
  architectural one: it stays inside `adapter-drive` behind the
  `DriveGateway` port (R25), and `google-auth-library` is already a
  transitive dependency of `googleapis` — the pair adds one effective
  dependency root. R2 justification for the adapter PR: auth lifecycle
  + resumable upload machinery outweigh minimal-stack pressure here.
- A middle path (raw `fetch` for Drive calls + `google-auth-library`
  for auth only) was considered and rejected for the MVP: it keeps the
  heaviest hand-rolled part (media upload) for a marginal footprint
  gain. Revisit only if `googleapis` install size becomes a real
  distribution problem.

## Question 3 — Minimal viable scope (central question)

**Chosen: `drive.file` + `drive.metadata.readonly`** (write only what
is yours + read structure). Round 1 passed 4/4 under this combination
(see question 4), including the D3-critical read of human-created
structure:

```
[op-b] PASS — child "MINHA-PASTA-RAFAEL" found: id=1YpGJkyKn9JYlCo6wuxyklClgr96YWsqf mimeType=application/vnd.google-apps.folder owner=n/a
```

Observation, not conclusion: `owner=n/a` — the `owners` field came back
empty on the list call. `owners` is legitimately absent for shared-drive
items and may be limited under metadata-readonly; flag for the adapter
brief if owner attribution is ever needed, but nothing in the ship
design depends on it.

### Cross-user manifest-content gap — EXPLICITLY UNTESTED (D7)

The known gap — reading manifest *content* written by another user
under the same OAuth client ID — could not be tested: no second
test-user account was available during the spike (owner statement,
2026-07-27). Per D7 this is recorded as untested, never claimed.

Hypothesis (expected but unverified): under the chosen combination the
content-read of any file not created/opened by this app instance fails
(`drive.metadata.readonly` grants no content access; `drive.file` is
per-user per-file). If true, the D4 prefix check — which reads a
manifest last written by *another* designer's instance — will not work
under the candidate combination, and the adapter brief must either
prove the same-client-ID case behaves differently or take the fallback.

**Watch item for the adapter-drive implementation brief:** run round 2
of `run-instructions.md` §3 as soon as a second designer account
exists, before the D4 prefix check is implemented. Fallback if the gap
is confirmed: broad `drive` scope with containment guaranteed by
adapter-level code policy (only `derivePath`-produced paths are ever
addressed); Google scope then bounds blast radius on bugs, not designed
behavior.

### Per-subtree scope — confirmed absent

Google's published Drive scope catalog
(https://developers.google.com/workspace/drive/api/guides/api-specific-auth)
enumerates only drive-wide scopes (`drive`, `drive.file`,
`drive.readonly`, `drive.metadata.readonly`, `drive.appdata`, ...);
no folder- or subtree-bounded OAuth scope exists. Confirmed against
documentation — a runtime probe cannot prove this negative. Subtree
containment is therefore always a code-policy concern, never a
Google-scope concern.

## Question 4 — Four-operation proof

All four operations evidenced under the chosen library and scope
combination, round 1 (2026-07-27):

```
[op-a] PASS — folder resolved: id=1rdxsTkKBCh-a9eU7hDwcThxBzEj6_JBb name="TEST-APP" mimeType=application/vnd.google-apps.folder
[op-b] PASS — child "MINHA-PASTA-RAFAEL" found: id=1YpGJkyKn9JYlCo6wuxyklClgr96YWsqf mimeType=application/vnd.google-apps.folder owner=n/a
[op-c] PASS — uploaded "saci-046-probe.txt": id=19EaOSkhcXBpXx1bDyZBZPzkkgxNYGY9N parents=["1rdxsTkKBCh-a9eU7hDwcThxBzEj6_JBb"]
[op-d] PASS — read own upload id=19EaOSkhcXBpXx1bDyZBZPzkkgxNYGY9N: 51 bytes, first line: "saci 046 probe upload — 2026-07-27T23:36:09.230Z"
[probe] RESULT: 4/4 operations passed under: https://www.googleapis.com/auth/drive.file + https://www.googleapis.com/auth/drive.metadata.readonly
```

Mapping to the ship design: (a) anchor resolution by folder ID (D3
config shape — folder ID confirmed workable); (b) verify-child-by-name
(D3 verify-never-create); (c) upload; (d) content read-back. Scope
limitation on (d): proven against the app's **own** upload only — the
cross-user case is the untested gap above.

Round 3 (2026-07-27, after the consent-mode conversion to Internal —
see question 5) re-proved all four operations with a fresh
Internal-mode token:

```
[op-c] PASS — uploaded "saci-046-probe.txt": id=1dJC7nLhu_4xq61breqdWfnB0hgKB45O7 parents=["1rdxsTkKBCh-a9eU7hDwcThxBzEj6_JBb"]
[probe] RESULT: 4/4 operations passed under: https://www.googleapis.com/auth/drive.file + https://www.googleapis.com/auth/drive.metadata.readonly
```

## Question 5 — Refresh-token longevity (closed per D5)

**Policy citation** (Google, "Using OAuth 2.0 to Access Google APIs",
https://developers.google.com/identity/protocols/oauth2#expiration,
retrieved 2026-07-27):

> "A Google Cloud Platform project with an OAuth consent screen
> configured for an external user type and a publishing status of
> 'Testing' is issued a refresh token expiring in 7 days, unless the
> only OAuth scopes requested are a subset of name, email address, and
> user profile (through the userinfo.email, userinfo.profile, openid
> scopes, or their OpenID Connect equivalents)."

**Consequence:** the Drive scopes are not in the exempt userinfo
subset, so **the 7-day cap is real for an External + Testing client** —
the consent mode under which round 1 ran. Weekly re-consent would be
unacceptable for the unattended designer flow.

Other expiration causes on the same page (summarized): user revocation;
token unused for six months; password change (Gmail scopes only —
inapplicable); exceeding the per-client limit ("There is currently a
limit of 100 refresh tokens per Google Account per OAuth 2.0 client
ID." — irrelevant at 3-designer scale); time-based access expiry;
Workspace admin policies (`admin_policy_enforced`); GCP session-length
policies.

**Mitigation — RESOLVED during the spike (2026-07-27): converted to
Internal.** Evidence round 3 (owner-performed in the GCP console,
screenshot-verified):

- The GCP project `drive-probe-rafael` (project number 346615203711,
  matching the probe client ID prefix) shows **Local: estrategia.com**
  in IAM & admin → Settings — the project already lives inside the
  Estratégia organization; the "if the GCP project can live in the org"
  condition is confirmed, not hypothetical.
- In Google Auth Platform → Audience the user type was switched to
  **Internal** ("Tornar interno"). The 7-day clause no longer applies:
  the cited policy sentence binds only "an external user type and a
  publishing status of 'Testing'".
- The Testing-era `token.json` was deleted and the probe re-run under
  Internal mode: the consent screen showed **no "unverified app"
  interstitial** and rendered both scopes (with Google's own
  containment wording for `drive.file` — "only the files you use with
  this app"). The re-run re-proved **4/4 operations** (see question 4).
- Observation only: the pre-conversion Audience page listed 0 test
  users even though round 1 had succeeded — the project owner evidently
  authorizes without being listed.

**Multi-designer implication:** under Internal, no test-user list is
needed — any `@estrategia.com` account can authorize, with no
unverified-app screen. The adapter-drive implementation brief should
instruct the Internal user type from the start (the External + Testing
walkthrough in the exploration note §5 is now the historical,
Testing-era path).

The alternative mitigation (publish to Production, keeping External)
was made moot by the conversion and was not pursued.

Neither the cap nor the mitigation changes library or scope choice —
#11 closes regardless.

**Dated observation start (D5):** the Internal-mode token was minted at
`2026-07-27T23:53:13.851Z` (round-3 `[auth] token minted at:` evidence
line; supersedes the Testing-era mint of 2026-07-27T23:36:08.440Z,
whose token was deleted at conversion). Honest residual: the no-cap
behavior under Internal is documentation-derived, not yet observed past
7 days — light watch note: confirm an unattended refresh still works
after ~2026-08-04. This is a corroboration check, not an open
mitigation decision.

## Watch items (consolidated)

1. Cross-user manifest-content gap — untested (D7); run round 2 when a
   second designer account exists, before implementing the D4 prefix
   check.
2. Internal-mode refresh longevity corroboration — confirm an
   unattended refresh still works after ~2026-08-04 (Internal-mode
   token minted 2026-07-27T23:53:13.851Z); documentation says no cap
   applies, not yet observed past 7 days.
3. Adapter brief must instruct the **Internal** consent-screen user
   type from the start (conversion already done for the probe project;
   exploration note §5 describes the historical External + Testing
   path).
4. Adapter brief must add `oauth_client.json` / `token.json` to
   `.gitignore` and a GOTCHAS entry for the scope-change trap (delete
   `token.json` when scopes change) — mentor recap 2026-07-27.
5. `owner=n/a` on `files.list` owners field — observation only; revisit
   if owner attribution is ever needed.
