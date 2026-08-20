# Jira credentials — where they live, and what kind they are

Status: exploration — no implementation mandate
Disposition: candidate — 2026-08-20 (was `open` 2026-08-19; the owner ratified
the A-now recommendation and put `JAC-28` in `Wave: Now`)
Origin: the 3LO feasibility probe run on 2026-08-09
(`docs/sessions/2026-08-09-orchestrator-fetch-credential-guard.md`, "The
unplanned half of the day"), which queued this note as its own item; topic
re-raised by `docs/sessions/2026-08-14-orchestrator-adf-text-fidelity.md` ("Next
session"); written 2026-08-19 against the live machine, the Atlassian developer
docs, and `docs/explorations/drive-oauth.md`
Roadmap link: none — this is a Phase 3 precondition, not a roadmap item; it sits
beside the `jacurutu config` item (board `JAC-5`) without being it

## 0. The correction that has to come first

**Google does not authenticate Jira, and cannot.** Atlassian is its own identity
provider. There is no configuration, scope, or consent screen under which the
Drive OAuth grant reaches a Jira API — the two are separate authorizations to
separate providers, and they will always be two grants.

So "Jira credentials should work the way Drive's do" can only mean **the shape of
the flow and the location of the credential**, never a unified login. This was
already corrected once, in the 2026-08-09 session, and it is restated here
because the phrasing keeps inviting the other reading — the prompt that opened
the 2026-08-19 session did not make it clear either.

## Why this is a new note and not an addendum to drive-oauth

Two reasons, the first decisive.

**The record already names it as its own item.** The 2026-08-09 session closed by
queueing "**The 3LO exploration note** — a Mentor session, carrying the five
findings above". This file is that item, written ten days late. It was verifiably
never written before: `git grep -Iil -iE "3LO|jira.*oauth" -- docs/explorations`
returned nothing against `HEAD`, so the five findings lived only in a session
recap, which is the shape of record this folder exists to replace.

**And the folder's contract would have forced the split anyway.**
`drive-oauth.md`'s disposition is `promoted to brief 046`, a closed value, while
this question needs `open`. `docs/explorations/README.md`: *"Split when an item
diverges. Status lives at note level, so an internal item whose disposition
diverges from its note becomes its own note."*

A third reason, weaker but real: the two providers do not share their mechanics,
and one note would blur exactly the differences that decide the cost — §4.2.

## 1. What was measured, and what it corrects

`jacurutu fetch` and `jacurutu start <KEY>` cannot run on the owner's machine.
Measured 2026-08-19, all three Windows environment scopes:

```
JACURUTU_JIRA_BASE_URL  | Process=- | User=- | Machine=-
JACURUTU_JIRA_EMAIL     | Process=- | User=- | Machine=-
JACURUTU_JIRA_API_TOKEN | Process=- | User=- | Machine=-
JACURUTU_IDENTITY_FILE  | Process=- | User=- | Machine=-
```

A second sweep for any variable whose name contains `JACURUTU`, `SACI`, `JIRA` or
`ATLASSIAN` returned nothing, and a recursive search for `.env*` outside
`node_modules` returned nothing. **0 of 4 variables set in any scope; no dotenv
file anywhere in the worktree.**

**One premise this corrects.** The natural reading is *the rename renamed the
variables and nobody re-exported them*, which implies the old names were durable
and got orphaned. They were not — the sweep covers `SACI` too, and finds nothing
durable under the old names either. The rename is not the cause. The cause is
upstream of it and is documented in our own instructions:
`docs/tasks/2026-08-12-spike-art-chain/run-instructions.md` §2 tells the owner
"Three Jira variables, read by the probe on every run" and never says how to set
them durably — no `setx`, no User scope. Session 033's own diagnostic was
`Get-ChildItem env:SACI_JIRA*`, which reads process scope. The credential has
been living in a terminal session's memory since brief 026, and every terminal
that closes takes it with it. The rename is when we noticed, not when it broke.

**The asymmetry, in one table.** Four credential-or-state locations in this
product, one convention each:

| What | Env vars | File | Survives a new terminal |
|---|---|---|---|
| Jira credentials | 3 (`JACURUTU_JIRA_*`) | none | **no** |
| Drive credentials | 0 | `oauth_client.json`, `token.json` | yes |
| Designer identity | 1 override (`JACURUTU_IDENTITY_FILE`) | `identity.json` | yes |
| Report state | 0 | `report.json` | yes |

Jira is the only one of the four with no file, and the only one that is broken.
That is the finding; everything below is about what to do with it.

## 2. The question, split in two

Given §0, the request contains two questions that have been travelling together
and have very different prices:

- **(a) Where does the credential live?** Shell environment, or a file under
  `~/.jacurutu/`. This is the whole of the measured breakage.
- **(b) What kind of credential is it?** An Atlassian API token used with HTTP
  Basic, or an OAuth 2.0 (3LO) access/refresh pair.

Drive answers both at once because Google left no choice: there is no API-token
equivalent, so `adapter-drive` had to do OAuth, and doing OAuth forced a token
file. Reading that as *"OAuth is why Drive works"* inverts the causation. What
makes Drive survive a new terminal is the **file**, not the protocol.

Question (a) is cheap and is the fix. Question (b) is expensive and buys one
thing that (a) does not — §5.

## 3. Three options

| | **A** — API token in a file | **B** — scoped API token in a file | **C** — OAuth 2.0 (3LO) loopback |
|---|---|---|---|
| Fixes the measured breakage | yes | yes | yes |
| Atlassian setup, owner-side | none — the token already exists | create a scoped token | register an app in the developer console |
| Feasibility gate | n/a | n/a | **measured open, 2026-08-09** — §4.1 |
| `adapter-jira` change | **zero** | zero | large — §4.2 |
| Credential expiry | ≤ 365 days, mandatory | ≤ 365 days, mandatory | 90-day rolling inactivity, self-renewing |
| Least privilege | no — full user permissions | yes, per scope | yes, per scope |
| Reuses `adapter-drive` machinery | the credential-file seam | the same seam | the loopback server, but **not** its ephemeral port |

`JiraHttpConfig` (`packages/adapter-jira/src/http.ts:52-62`) takes `baseUrl`,
`email`, `apiToken` and an injected transport. Under A and B **the adapter does
not change at all** — only the composition root changes, from three `process.env`
reads (`packages/cli/src/cli.ts:47-49`) to one file read. That is the entire
distance between broken and working.

## 4. What C costs, measured rather than assumed

### 4.1 The gate is open, and was measured by running it

**Measured 2026-08-09, the same way `drive-oauth.md` §1 measured the Google one:
by running it.** A Resource-level 3LO app (`saci-jira-probe`) reached a consent
screen and completed the round trip, so **the Estratégia organization permits
user-created external OAuth apps.** Recorded in
`docs/sessions/2026-08-09-orchestrator-fetch-credential-guard.md`.

Two things this closes, both of which were live questions until the probe ran:

- **Registering the app needs no admin**, which the Atlassian docs also state
  (a 3LO integration is created from a personal developer account, is private by
  default, and needs neither distribution nor Atlassian approval for its own
  author to use). This is *not* the wall recorded in
  `docs/explorations/dev-queue-board.md`, "Where the board lives, and why not
  Jira" — that one was the absence of a `manage:jira-project` scope plus a site
  permission the owner did not hold.
- **Consent is not blocked at this organization.** Atlassian ships an
  organization-level control that can turn off end-user installation of OAuth
  2.0 (3LO) apps ("Block user apps", under Connected apps in
  `admin.atlassian.com`), readable only from an admin page the owner does not
  hold. The probe answers it without needing that page: consent completed, so
  the control is not blocking this account today.

Recorded as method, because this folder has been burned twice by fields that
answer without carrying the meaning we assigned them (`ancestor-path`,
`isPrivate` — `dev-queue-board.md`): **this was not inferred from an API
response.** The consent screen is the only surface that reports it honestly, and
it was driven by hand. Re-measuring it is not work — it is a closed question.

### 4.1b The probe registration survives, and reuse is the only option

Measured 2026-08-19, after this note's first draft. The probe app
`saci-jira-probe` (App ID `3fae9200-df98-4b92-8686-fab11b6a64c8`) still exists in
`developer.atlassian.com`, and its state is not what the 2026-08-09 instruction
("delete with the note, or revoke at `id.atlassian.com`") anticipated:

| Property | Measured value |
|---|---|
| Grant on the owner's account | **revoked** — `id.atlassian.com/manage-profile/apps` lists 4 apps, none of them ours |
| Deletion | **refused by the server**, four attempts: *"We couldn't delete this app, as it is currently installed somewhere. Uninstall it from all applications and try again."* |
| Distribution | `private`, `Not sharing` — "only you can install and use it". No third party ever could. |
| Permissions | `Jira API`, `Jira Service Management API`, `User identity API` |
| Access type | `Resource-level` |
| Local artefact | **none.** `~/.jacurutu/token.json` and `oauth_client.json` are Google's (`accounts.google.com`, scopes `drive.file` + `drive.metadata.readonly`), not Atlassian's. |

**The owner confirmed reuse. It is not the preferred option — it is the only
one.** The registration cannot be deleted by anybody this project has access to,
and the reasoning is fully established rather than inferred:

- Atlassian's own documentation: *"You can only delete an app if it's not
  installed anywhere"*, and *"OAuth 2.0 (3LO) apps are installed on a per-user
  basis"*
  (`developer.atlassian.com/cloud/oauth/getting-started/managing-oauth-apps/`,
  both quoted verbatim and re-verified 2026-08-19).
- **Revoking the grant is necessary but not sufficient.** It was done and
  verified at `id.atlassian.com/manage-profile/apps`; deletion kept refusing
  afterwards with the same message.
- What remains is a **site-level** connected-app uninstall in
  `admin.atlassian.com`, which requires an organization administrator (the
  accepted answer on `community.atlassian.com/forums/Jira-questions/Can-t-remove-created-App/qaq-p/1293860`;
  the developer doc above does not cover this half).
- **The owner is not an administrator of this site.** The organization they do
  administer (`estrategia-team-w5gieqzt`) holds one site,
  `estrategia-team-b54c6iq3.atlassian.net`, with cloudIds `b9717961-…` and
  `f9ffae26-…`. The probe's site is `9795b90e-d410-4737-a422-a7c15f9eadf0` —
  a different site, not in their organization.

This turns reuse from convenience into the argument: **creating a fresh
registration would leave two registrations, one of them permanently
un-cleanable.** Waiting does not help either — this is not propagation delay.

**Correction, and it matters more than the fact.** An earlier revision of this
section said no console page lists installations, that there is no force-uninstall
control, and that the refusal was either a stale record or an error string
inherited from Connect/Forge — then filed it as the third member of the family
`dev-queue-board.md` names with `ancestor-path` and `isPrivate`: *"a field that
exists, answers, and does not carry the meaning we assigned it."*

**All of that was wrong, and the classification was wrong in the most damaging
direction.** The install is real, the control exists, and it is simply not in the
owner's hands. So the message `We couldn't delete this app, as it is currently
installed somewhere` was **telling the exact truth** — and it got recorded as a
lying field. That is the inverse of the named pattern, and admitting a false
member into a named pattern is worse than missing a true one: the pattern's whole
value is that it makes you distrust a specific class of answer, and padding it
with an honest message trains distrust of honest messages. The family stays at two
members.

The reusable lesson is the opposite one: **before calling a surface unreliable,
establish that you can see everything it is reporting about.** Here the refusal
referred to a page the reader had no access to, which reads identically to a
refusal about nothing.

**Discovery cost, recorded so it is paid once.** Establishing this took one grant
revocation, four deletion attempts, and a documentation and forum search. A future
reader trying to delete a 3LO app deserves to find this written down instead of
walking the same path.

So the question is no longer *can we do 3LO* — measured yes — nor *which
registration* — there is one. It is **what this registration has to become.**
Four decisions, §4.1c.

### 4.1c The four things the registration needs, and what this note proposes

Proposals, not decisions. Each is a done-criteria line on `JAC-30`.

**1. The name.** `saci-jira-probe` is the last living artefact carrying the old
product name, and an OAuth app name is a long-lived identifier — it appears on
the consent screen every designer will read. Proposed: **`jacurutu-cli`**. It
names what authenticates rather than what was being tested, and it stays true if
the desktop host arrives later, because the host would embed the same CLI.

**2. The callback URL — the central design problem, and not solvable by
analogy.** Atlassian registers **one exact** callback; `adapter-drive` binds an
ephemeral port. A fixed port can be registered but can be occupied; an ephemeral
port cannot be registered at all. There is no configuration that satisfies both.

Proposed: **one fixed high port, plus a manual-paste fallback.** The loopback
server is an optimisation, not a requirement — if the port is free, the browser
redirect lands on it and the flow completes silently, exactly like Drive. If the
bind fails, the browser still lands on the registered URL and the authorization
code is sitting in the address bar; the CLI asks the operator to paste it. This
converts the one unrecoverable failure into a degraded path, and it costs a
prompt and a parser.

Two facts make this proportionate rather than over-engineered: the consent flow
runs **once per 90+ days**, so a collision is a rare event on a rare operation;
and the fallback needs no port at all, so it cannot fail for the same reason the
primary did. Also worth stating because it is a new coupling this repository has
not had: the port becomes a policy constant (`R7`) whose value is **also** stored
in an external console, so changing it is a two-place edit and the constant's
comment must say so.

**3. The scopes.** The three enabled products were a probe's guess.
`Jira Service Management API` is not touched by anything in this product and
should go — that one is certain. `User identity API` is probably unnecessary,
because the credential pre-flight uses `/rest/api/3/myself`, which belongs to the
Jira API; but "probably" is not good enough when the cost of being wrong is a
re-consent, so it should be verified before removal rather than dropped on this
reasoning. Classic-scope shape for what the adapter actually does:
`read:jira-work` (search + field catalog) and `read:jira-user`, plus
`offline_access` for the refresh token. Changing the scope list invalidates the
stored token — the same rule `drive-oauth.md` §4 records for Google, and the
`G-DRIVE-1` analogue.

**Read-only, and the future cost of that is known.** The list above carries no
`write:jira-work`, because this product reads Jira and does not write it. Writing
is parked in [[jira-write-back]] behind a declared trigger (`Phase 4 shipped`),
and on 2026-08-19 the owner considered bringing it forward and chose to honour the
trigger instead.

The cost that choice defers, recorded as a known price rather than as an argument
for taking the scope now: **adding a scope later requires a fresh consent.** An
existing grant does not grow on its own, so when write arrives the designer
authorises in the browser again. That is one browser round trip on a day already
spent on a new capability, and it is cheap next to carrying a write permission for
months with nothing using it — a token that can write is a token that can write by
accident, and the separation between reading and writing commands is **not
expressible in OAuth at all**, because the grant is per app rather than per
command.

**4. The client secret.** Recommended: rotate it in the console, which has a
button beside the field. **This is hygiene, not incident response**, and the
distinction matters enough to state: no secret exposure is established. What the
2026-08-09 record documents is a *client id* transcribed by eye from a screenshot
and transcribed wrong (`I` for `l`) — and a client id is not a secret. The
console masks the secret by default. The argument for rotating is simply that a
credential minted for a throwaway probe should not become the production
credential unchanged.

### 4.2 Three concrete divergences from the Drive flow

These are why one note would have misled. "Same shape as Drive" is not on the
menu; a similar-looking flow with three different failure modes is. All three
were measured by the probe, not read off documentation.

**The loopback port cannot be ephemeral.** `adapter-drive` starts its callback
server on `port=0` (`packages/adapter-drive/src/auth.ts`,
`startLoopbackServer`), because Google's loopback redirect ignores the port. 3LO
requires an **exact pre-registered callback**, so the Drive flow's ephemeral port
does not transfer. C must register one fixed port and bind it, and a port
collision then has no fallback — a hard failure where Drive simply picks another
port. **Any design that reuses the Drive loopback as it stands starts wrong.**

**The API base URL changes, and `cloudId` enters the design.** With a 3LO token,
Jira Cloud REST is not reached at the site host but at
`https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/...`. For this site the
value is known — `9795b90e-d410-4737-a422-a7c15f9eadf0`, captured by the probe
and independently confirmed on 2026-08-19 as the same value the Atlassian MCP
connector returns. Knowing it does not remove the design question: `baseUrl` in
`JiraHttpConfig` stops meaning "the site URL", and a brief has to choose between
resolving `cloudId` at runtime via `GET /oauth/token/accessible-resources` and
carrying it as configuration. All three paths in `http.ts` move (`/search/jql`,
`/field`, `/myself`). One thing still to verify, not assumable: an operation
documented as *"Apps can't access this REST resource"* is unavailable to 3LO, so
each of those three needs checking against its own reference page rather than
against the pattern.

**Rotating refresh tokens are mandatory for new integrations**, which makes the
token file hot state: each refresh returns a new refresh token and disables the
one just used, and the 90-day clock is an *inactivity* window that each rotation
resets. Drive's refresh token is stable and its `token.json` is written rarely.
Jira's would be rewritten on every refresh. See §4.3 — this one is not just a
design constraint, it is already a latent defect in shipped code.

### 4.3 The rotating-token consequence is a real defect, dormant today

`persistRefreshedTokens` (`packages/adapter-drive/src/auth.ts:149-160`) subscribes
to the library's `tokens` event and writes the refreshed credential back. A write
failure is logged and **the accompanying call still succeeds** — deliberately, and
documented as such in the comment: it is R4-compliant and, under Google, merely
suboptimal. A stable refresh token is still sitting in the file, so the next run
recovers.

Under Atlassian that same code is **credential-losing.** By the time the write is
attempted, the refresh token in the file has already been disabled server-side by
the refresh that produced the new one. The replacement exists only in memory. A
failed write therefore destroys the grant permanently and costs a full
re-consent, silently, behind a log line and a successful command.

Two consequences worth separating:

- **Nothing is broken today.** Only Drive uses this path, and Google's tokens do
  not rotate. This is a trap, not an incident.
- **It is a copy-paste trap of the worst kind.** A future 3LO port that models
  itself on `adapter-drive` — which is exactly what "make Jira work like Drive"
  invites — inherits a non-fatal write on a credential that cannot survive one.
  The fix is cheap and belongs in the Drive adapter, ahead of any 3LO work, so
  the pattern being copied is the correct one. Carded separately (§7, card 2).

### 4.4 What C actually buys

Two things, and precision matters because one of them is commonly over-claimed.

**It does not remove the long-lived secret at rest.** A rotating refresh token in
`~/.jacurutu/` is a long-lived credential in a file, exactly like an API token in
a file. C changes the *shape* of the secret, not its existence. Anyone reasoning
"OAuth, so that no password sits on disk" is describing something neither option
delivers.

**It does buy least privilege** — also available from B, far cheaper — and, the
one thing only C buys, **operation with no manual expiry cliff**. Which is §5.

## 5. The expiry cliff, which is dated and is not hypothetical

Atlassian API tokens changed policy in December 2024. A token created today
carries a **mandatory expiry, one year maximum, with no never-expires option**;
tokens created before 2024-12-15 were force-expired between 2026-03-14 and
2026-05-12. An Atlassian Guard admin can shorten the ceiling further through
authentication policy, from an admin surface the owner does not read.

So option A hands the owner a CLI that dies once a year on a schedule nobody
watches, and the failure arrives as

```
Jira rejected the configured credentials (HTTP 401 on /rest/api/3/myself).
The email / API token pair is invalid, expired, or revoked.
```

(`packages/adapter-jira/src/http.ts:130-134`) — correct, and unhelpful: three
causes, no date, no remediation. Under the env-var contract there was nowhere to
put an expiry date. Under a credential file there is, which turns "diagnose an
annual mystery 401" into "print the date the file says the token dies". That is
why expiry handling belongs *inside* card 1 rather than in a card of its own: the
file is what makes it possible, and the same commit should do both.

C avoids the cliff entirely, as long as the CLI is used at least once every 90
days. That is C's real and only unique value for this product.

## 6. Where this lands

**Ratified by the owner on 2026-08-20: A now, C as a real queued brief.** This
section proposed it; the owner closed it and put `JAC-28` in `Wave: Now`, which
makes A the next thing built rather than the next thing argued about. The open
gate changed C's status — from "possibly impossible, measure before designing" to
"feasible, and schedulable" — without changing which one goes first. One line
each:

- A closes the measured breakage, changes no adapter, needs nothing from
  Atlassian, and is the smallest unit that can be evidenced.
- The gap between A and the owner's stated want is the *file*, and A delivers the
  file. Per §0 and §2, the protocol was never the part that worked.
- C is now unblocked but is not small: fixed callback port, `cloudId` in the
  design, `api.atlassian.com/ex/jira` base URL, atomic rotating-token writes, and
  three endpoints to re-verify for 3LO availability. That is a spike plus a
  brief, not an afternoon, and `fetch` is dead the whole time.
- C's unique value is the expiry cliff, which A can mitigate with a date and a
  message but not remove.
- B is a strict improvement on A for the price of one Atlassian screen, and it is
  file-compatible with A: same file, same fields. It needs no decision now, as
  long as A's file shape does not assume a full-permission token.

**What A costs if C lands later, stated so it is not discovered as a surprise:**
the *file-reading seam* survives C unchanged — same directory, same hygiene, same
error shape. The *field shape* does not: `email` + `apiToken` + expiry is not an
OAuth token record. So A throws away a few dozen lines of field handling and
keeps everything structural. Against a CLI that is dead until C ships, that is a
cheap trade, but it is a trade.

Not decided here, and not a note's decision to take: whether the credential file
is `~/.jacurutu/jira.json` or a section inside one config file, and whether the
directory gains subfolders. That is the coupling point with
[[local-storage-format]], which now carries it — the moment Jira's credential
becomes a file, that directory holds three credential files and the flat layout
needs a rule.

Related: [[drive-oauth]] (the model, and its §7 for why a Service Account is not
the path — note that its §7 "v2 addendum" about adding scopes to "the designer's
existing OAuth" applies to Google APIs only, never to Jira, per §0),
[[jira-copy-locality]] (the other live Jira-side question),
[[task-manifest-format]].

## 7. Cards this surfaced

Created on the board 2026-08-19, every field verified back by JQL, all four born
in `To Do` with `Wave` empty and `Source: Descoberto no trabalho`.

| Card | What | Blocks |
|---|---|---|
| `JAC-28` | Ler as credenciais do Jira de um arquivo em `~/.jacurutu/` | `JAC-22` (`jacurutu ship`) |
| `JAC-29` | Tornar fatal a falha de escrita do token rotacionado no adapter-drive | `JAC-31` |
| `JAC-30` | Converter o registro OAuth 3LO do probe em registro de produção | `JAC-31` |
| `JAC-31` | Autenticar no Jira via OAuth 2.0 (3LO) em vez de token Basic | — |

`JAC-28` is option A (§6), plus the expiry date and the message that names it.
Its `Blocks` on `JAC-22` is a judgement, not a fact, and is recorded as such:
`ship` does not need this to compile, but every live smoke of it starts at
`jacurutu start <KEY>`, and that path is dead today. This project evidences by
running, so a dead `start` blocks `ship`'s evidence even though it does not block
its code.

`JAC-29` and `JAC-30` block `JAC-31` rather than blocking `ship`. Neither is
urgent on its own — `JAC-29`'s defect is dormant (§4.3) and `JAC-30` is console
work — but doing `JAC-31` before either means porting a credential-losing write
pattern and authorising against a probe's registration.

**Not carded, and deliberately:** a card to measure the 3LO feasibility gate.
That measurement happened on 2026-08-09 and the gate is open. Carding it would
have bought a re-run of a closed question — the first draft of this note did
exactly that, before the 2026-08-09 record was found. Also not carded: revoking
the probe grant, which §4.1b measures as already revoked.

Also not carded: the third category of file in `~/.jacurutu/`. It belongs to
`JAC-1`, which already owns that directory's layout question, and a new card
would be the duplicate the board's contract asks us to check for. `JAC-1`'s body
wants amending instead — see [[local-storage-format]] §3.

## 8. Two cards created and retracted the same day

`JAC-32` and `JAC-33` were created on 2026-08-19 under a premise withdrawn within
the hour: that this product would start writing to Jira. It will not, until the
[[jira-write-back]] trigger fires. Both are retracted in place — `RETRATADO` in
the title, the reason and the withdrawn premise in the body, the original text
preserved below it. `JAC-33` also keeps the transition measurement, because that
finding survives the retraction and will be wanted when the trigger does fire.

**Ratified by the owner on 2026-08-19: keep both as tombstones, remove only the
links.** So the cards stay, on the same reasoning the board used for the Notion
Ref 2 tombstone — deleting them erases the record that they existed and that the
deferral's trigger was honoured rather than quietly overridden.

The three false `Blocks` links were a separate matter, and the owner removed them
in the Jira UI on 2026-08-20 — `2360694` (`JAC-32` → `JAC-30`, the harmful one,
which made `JAC-30` read as blocked), `2360693` (`JAC-32` → `JAC-33`) and
`2360695` (`JAC-2` → `JAC-33`). Verified by JQL: `JAC-2`, `JAC-32` and `JAC-33`
all carry `issuelinks: []`, and the four real links are intact — `JAC-28` blocks
`JAC-22`, `JAC-29` and `JAC-30` block `JAC-31`.

**Why it had to be the owner, recorded because it is a boundary of the agent's
reach and not an oversight.** Measured after the obvious attempt:

```
$ editJiraIssue JAC-32 {"issuelinks": []}
{"errors":{"issuelinks":"Field does not support update 'issuelinks'"}}
```

There is no `deleteIssueLink` in this MCP surface, the issue-type metadata offers
`issuelinks` only the operations `add` and `copy`, and the field rejects update
outright. So an agent on this surface can create a dependency it cannot retract —
which is the asymmetry above, in its sharpest form.

**Recorded because it is the more useful lesson of the day: creating a card is
cheap and un-creating one is not.** The board's authority rule says the agent
creates freely, and that reads as low-risk until a premise is withdrawn. Three
costs turned up, none of them visible before:

- **A false `Blocks` link cannot be withdrawn with the tools an agent has.** The
  MCP surface creates issue links and does not delete them, so
  `JAC-32 blocks JAC-30` and `JAC-2 blocks JAC-33` are still on the board,
  neutralised by prose rather than removed. A false blocker is worse than a
  stray card: it stops real work. Removing them needs the Jira UI and is the
  owner's action.
- **Deleting an issue is not an agent action** either — no tool offers it, and it
  would destroy the record of what happened. Retraction in place is what is
  available, and it matches what the board already did for the Notion Ref 2
  tombstone.
- **The board has a second reader.** A card that appears and is retracted the
  same day costs that reader's attention, which the queue exists to protect.

The operative rule this suggests, stated as a proposal for the owner rather than
as doctrine: create freely for work discovered *in* the work, as the contract
says — but a card whose premise is a decision the owner has not yet confirmed can
wait for the confirmation. Nothing was lost here except tidiness; the point is
that the asymmetry exists and was not priced in.

## Changelog

- 2026-08-19 — authored, discharging the note queued by the 2026-08-09
  orchestrator session ten days earlier; its five findings are carried here
  rather than left in a recap. Restated the correction that Google cannot
  authenticate Jira at all, so "Drive style" means flow shape and credential
  location only. The env-var contract was measured broken across all three
  Windows scopes (0 of 4 set) and the cause traced to process-scope exports
  taught by our own run-instructions rather than to the rename. The question was
  split into location and credential kind; three options costed. The 3LO
  feasibility gate is recorded as **measured open** by the 2026-08-09 probe, not
  as an open question — an earlier draft of this note had it backwards and
  proposed re-measuring it. Three divergences from the Drive loopback recorded
  (exact pre-registered callback, `cloudId`
  `9795b90e-d410-4737-a422-a7c15f9eadf0` and the `api.atlassian.com/ex/jira`
  base URL, mandatory rotating refresh tokens), and the rotating-token
  consequence traced to a latent credential-losing defect at
  `adapter-drive/src/auth.ts:149`. The mandatory ≤ 365-day API-token expiry
  recorded as the one thing option A cannot remove. Recommendation A-now /
  C-as-queued-brief proposed, not ratified — disposition `open` because the
  owner has decided nothing here yet.
- 2026-08-19 — the probe registration was measured (§4.1b): grant already
  revoked, deletion refused by the server as "currently installed somewhere"
  with no console page listing any installation, and no local Atlassian artefact
  in `~/.jacurutu/`. The owner decided to **reuse** the registration rather than
  recreate it. Four design decisions the reuse now requires were
  written with proposals (§4.1c): the name `jacurutu-cli`, a fixed high port plus
  a manual-paste fallback for the callback, dropping `Jira Service Management
  API` with `User identity API` to be verified before removal, and rotating the
  client secret as hygiene rather than as incident response — no secret exposure
  is established, and the 2026-08-09 screenshot incident concerned a client id,
  which is not secret. Four cards were created and verified: `JAC-28` … `JAC-31`
  (§7).
- 2026-08-20 — **the owner ratified A-now** (§6) and put `JAC-28` in `Wave: Now`,
  verified by JQL; the disposition moved `open` → `candidate`, since the note is
  now brief material rather than a live question. The owner also removed the
  three false `Blocks` links, verified: `JAC-2`, `JAC-32` and `JAC-33` carry no
  links, the four real ones stand. §8 keeps the reason it had to be the owner —
  this MCP surface can create an issue link and cannot retract one.
- 2026-08-19 — a write-to-Jira scope expansion was raised and **withdrawn the
  same day**: the owner had forgotten that [[jira-write-back]] already carries a
  deferral with a declared trigger (`Phase 4 shipped`), and on being reminded
  chose to honour it. That note is unchanged and its disposition stays
  `deferred`. The scope list in §4.1c is read-only, with the deferred cost —
  adding a scope later needs a fresh consent — recorded where the decision is.
  Two cards created under the withdrawn premise (`JAC-32`, `JAC-33`) were
  retracted in place rather than deleted; see §8.
- 2026-08-19 — §4.1b was corrected and strengthened. Reuse of the probe
  registration is now recorded as the **only** option rather than the preferred
  one: deletion requires a site-level connected-app uninstall by an organization
  administrator, and the owner does not administer this site — the probe's
  cloudId belongs to a site outside their organization. Documentation quotes were
  verified verbatim against the source. **Two claims of mine were retracted:**
  that no console control exists (it does, out of reach), and that the deletion
  refusal was a field answering about an inapplicable concept — it was telling the
  literal truth, so it was removed from the `ancestor-path` / `isPrivate` family,
  which stays at two members. The discovery cost was recorded so a future reader
  does not repeat the revocation, the four attempts and the search.
