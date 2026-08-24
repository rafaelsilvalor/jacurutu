# OAuth client distribution — how the Google client secret reaches a designer

Status: exploration — no implementation mandate
Disposition: candidate — 2026-08-21
Origin: the `JAC-34` discussion session, 2026-08-21, which measured the PKCE
question live against the spike's Internal Desktop client and closed six
decisions with the owner. The barrier itself was surfaced on 2026-08-20 while
closing `JAC-28` — `docs/sessions/2026-08-20-orchestrator-jira-credentials-file.md`,
"What the owner's question surfaced, outside the task"
Roadmap link: none — a Phase 3 exit-criterion precondition, not a roadmap item

## 0. Why this is a new note and not an addendum to drive-oauth

[[drive-oauth]] owns the OAuth client setup, and its §5 is the manual walkthrough
this question exists to delete. It is still the wrong home, for exactly the
reason [[jira-credentials]] gave for the same split: that note's disposition is
`promoted to brief 046`, a closed value, and this question needs an open one.
`docs/explorations/README.md` — *"Split when an item diverges. Status lives at
note level, so an internal item whose disposition diverges from its note becomes
its own note."*

Its §10 credential-hygiene rules are inherited here unchanged and stay binding.

## 1. The barrier, measured

`~/.jacurutu/oauth_client.json` exists only because someone opened the Google
Cloud Console and downloaded it. That is a developer step in a product for
designers, and Phase 3's exit criterion is three or more designers running on
their own machines.

Measured 2026-08-21:

- **1 of 4 shipped commands already requires the file.** `report` →
  `createSpreadsheetGateway` → `authorize` → `readOAuthClient`. `CLAUDE.md` says
  no command wires `adapter-drive`; that is true of the gateway and false of the
  authorization, which `adapter-sheets` reuses. The barrier is not future.
- **The repository is public.** So `drive-oauth.md` §10's "never commit
  `oauth_client.json`" — binding per `PROCESS_MAP.md` §9.7 — forbids the obvious
  answer outright. Embedding in the repo is committing.
- **No install artifact exists for the CLI.** `packages/cli` is `private: true`
  at version `0.0.0`, there is no packaging in the v2 chain, and the only
  installer in the repository is v1's Electron one, in freeze.
- **The client is Internal** (brief 047, D6), so one client serves the whole
  organization. `drive-oauth.md` §5's "each designer must be added as a test
  user" describes the retired External + Testing mode and is not current
  guidance.
- **The flow sends the secret on every call and uses no PKCE.**
  `packages/adapter-drive/src/auth.ts:117,186` construct `OAuth2` with a
  `clientSecret`; `code_challenge` appears zero times in the file.

## 2. The cheap option, tested and dead

If Google's token endpoint accepted a Desktop client with PKCE and no secret,
only the `client_id` would need to reach a machine — and a `client_id` is not a
secret, as `auth.ts` itself states when it prints the consent URL. It would fit
in a named constant (R7) beside `DRIVE_SCOPES`, and the file would stop existing.

Measured by running it, on the owner's machine, against the spike's Internal
Desktop client:

```
verifier length: 43  challenge length: 43
client_id loaded: True  length: 72
authorization code captured: True
HTTP 400

{
  "error": "invalid_request",
  "error_description": "client_secret is missing."
}
```

`token.json`'s `LastWriteTime` was identical before and after, so the probe wrote
nothing, and the exchange failed before any token was issued — there was no
residual credential to discard.

**The `client_secret` is mandatory. PKCE does not substitute.** The error names
the missing parameter, so there is no alternative reading.

### 2.1 Google's documentation is wrong, and the discrepancy is live

The parameter table under "Step 5" of
`developers.google.com/identity/protocols/oauth2/native-app` marks
`client_secret` **Optional**, with a footnote excluding only Android, iOS and
Chrome clients. The client measured above is a Desktop client on Windows.

A report on Google's own developer forum dated 2026-08-17 describes the same
result — Desktop client, PKCE, no secret, `invalid_request` — and carries no
official answer. Recorded here because a future reader will find the same
documentation and reach the same wrong conclusion.

## 3. Is the secret confidential? Three clauses, all required

The question the card asked cannot be answered with one word.

1. **It is mandatory** for the flow. Measured, §2.
2. **It is not confidential in the authentication sense.** RFC 8252 §8.5: a
   secret statically included in an app distributed to multiple users "should not
   be treated as confidential", and a server that requires one "MUST treat the
   client as a public client ... and not accept the secret as proof of the
   client's identity".
3. **It still must not enter the repository.** The practical difference is not
   between secret and public — it is between "extractable by someone who tries"
   and "indexed by every secret scanner in the world". Google states the same
   rule in its own console UI: client secrets must never be checked into code
   repositories. Reported rather than quoted, because that prose arrives in the
   account's locale — the same locale dependence `G-SHEETS-3` catalogues, so a
   verbatim quote would pin the sentence to one reader's language and be
   unfindable for the next.

The three coexist: the secret is required, it authenticates nobody, and it has a
place it cannot be.

**A tension that is not ours.** Google says to guard the secret with extreme
care; RFC 8252 says a static secret in a distributed native app cannot be
guarded. Embedding in an installer sits exactly in that gap. What limits the
damage is already decided: the client is Internal, so the reach stops at the
organization's accounts, and rotation is graceful (§4).

## 4. Rotation is graceful, confirmed in the console

`support.google.com/cloud/answer/15549257`: *"You can only have two client
secrets at maximum"* and *"Both secrets can be used until you manually disable
them."* The documented procedure is create → migrate → disable → delete.

Confirmed by looking, 2026-08-21: the client's page on the new console surface
(Google Auth Platform → Clients) offers **Add Secret**, and one secret is listed
against the maximum of two.

So with an update channel, rotation never drops anyone: publish the new secret,
ship the update, wait, then disable the old one. **Rotation was the expensive
half of embedding the secret in a package, and it is not expensive.**

Two things rotation does *not* fix, both measured:

- **Changing the `client_id` is not rotation.** A new client invalidates every
  stored `token.json`, so it costs one browser re-authorization per installed
  designer. An update channel cannot click consent for a person — that is OAuth
  by design.
- **First install is untouched.** An updater updates; it does not install.

## 5. The secret is visible exactly once

The console states that viewing and downloading client secrets is no longer
available, and that a lost secret is replaced rather than recovered. After
creation only the last four characters are shown.

Two consequences.

**A production client must capture its secret at creation.** That instant is the
only one in which the value is available, so it has to go straight into whatever
store the build reads — never a home directory, never a chat, never a temporary
place, which is how temporary places become production.

**Two sentences in [[local-storage-format]] are false, and are reported here
rather than fixed.** §1 says losing `oauth_client.json` costs "re-download from
the console"; there is no re-download. §2 classifies credentials as
"Recreatable: **yes**, from Google / Atlassian"; for this file, no. That note and
`JAC-1` own the correction (`PROCESS_MAP.md` §12.6 — report, do not silently
fix).

This is the third instance in two sessions of the failure class the 2026-08-20
session named: the sentence was not edited, so no diff shows it; the world moved
underneath it.

## 6. The decisions the owner closed

**D1 — The secret is mandatory.** §2.

**D2 — Not confidential, and still never in the repository.** §3.

**D3 — The secret lives in the installer now; a server comes later.** The
destination is a hybrid installed app plus server, already sketched by `JAC-18`.
A server-side flow would hold the secret and never ship it — but it needs a
client of type "web application", which is a different client with a different
`client_id`, so that transition costs one re-authorization per installed
designer. Today that is one. It is cheapest before designers onboard.

**D4 — The file does not disappear; it changes owner.** It moves off the
designer's machine and onto the machine that builds the package, read by the
build and kept out of git. `~/.jacurutu/` therefore drops to two credential
files, which is one fewer category instance for `JAC-1` to classify. D4 is what
makes D3 compliant with §3's third clause rather than a violation of it.

**D5 — Accepted costs, stated rather than discovered later.** The secret is
extractable from a distributed package; rotation requires shipping an update;
and the eventual server transition costs one re-authorization per installed
designer.

**D6 — `JAC-34` is not a credential card.** It is blocked on packaging, and
closing it does not move Phase 3's exit criterion.

## 7. Why JAC-34 could not close, and what was done about it

A designer's onboarding has four manual steps, not one:

| Step | How it is done today | Card |
|---|---|---|
| Obtain the CLI | clone the repository and compile | **none, until 2026-08-21** |
| `oauth_client.json` | download from the Cloud Console | `JAC-34` |
| `jira-credentials.json` | hand-written, with an Atlassian token | `JAC-31` |
| `identity.json` | hand-written | `JAC-5` |
| `token.json` | the app writes it | — |

The largest step had no card, which repeats exactly the discovery that produced
`JAC-34` one layer up. And `JAC-34`'s own done-criteria contained a
contradiction: "without opening the console" costs no engineering, while "the
README does not ask for a manual download" requires a build artifact whose format
is deferred (`desktop-ui-host.md:176`). One card cannot hold both.

Acted on the same day: `JAC-35` was opened for packaging, update channel, code
signing and the production OAuth client, and it `blocks` `JAC-34`. The
"no manual download" criterion moved to `JAC-35`; `JAC-34` keeps "no console".

## 8. What this note does not answer

- **Whether a client secret expires on its own.** Not measured; the client
  management page does not mention expiry.
- **The packaging format.** Deferred in [[desktop-ui-host]] §176 and owned by
  `JAC-35`, not by this note.
- **Whether the legacy console surface's download still yields a secret.** Not
  measured, and now low-stakes: a lost secret costs one rotation.
- **The consent screen's displayed app name.** It is user-facing — a designer
  reads it while authorizing — and both the project and the client are named
  after the probe. The displayed name lives under Branding and was not inspected.
- **Anything about a designer's machine.** Every measurement here came from the
  owner's machine, the only one that has ever run this CLI.

Related: [[drive-oauth]] (§10 binding hygiene, §5 superseded by brief 047 D6),
[[jira-credentials]] (§0 and §2, the same where-versus-what-kind split, and the
precedent for splitting this note out), [[local-storage-format]] (`JAC-1`, and the
two false sentences reported in §5), [[desktop-ui-host]] (the deferred packaging
format), [[central-catalog]] (`JAC-18`, where the server half goes).

## Changelog

- 2026-08-21 — created from the `JAC-34` discussion session. The PKCE-without-
  secret path was measured live and is dead; Google's native-app documentation is
  wrong about it. Graceful rotation confirmed in the console. Six decisions
  recorded. Two false sentences in [[local-storage-format]] reported as findings.
  `JAC-35` opened and linked as blocking `JAC-34`. Disposition proposed as
  `candidate`, for the owner to ratify (M-R14).
