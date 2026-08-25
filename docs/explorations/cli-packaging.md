# CLI packaging — how the CLI reaches a designer's machine

Status: exploration — no implementation mandate
Disposition: candidate — 2026-08-24
Origin: the `JAC-35` discussion session, 2026-08-24, opened in Plan mode under a
no-implementation mandate. Seven decisions closed with the owner; the artifact's
weight measured from the lockfile. Consumes [[oauth-client-distribution]]
(2026-08-21) and the deferral carried at [[desktop-ui-host]] §176
Roadmap link: Phase 3 packaging item (`docs/ROADMAP.md:317`); this note is what
`JAC-16` asked for — "the decision is written, with the reason, and this card
points at where it landed" (translated)

## 0. Why this is a new note and not an amendment to desktop-ui-host

[[desktop-ui-host]] holds one question: what **hosts** a desktop UI — a local
server plus a browser, or Electron. Its line 176 carries a second question,
absorbed into it on 2026-08-06 by brief 051, that was never the same question:
*"Designer-friendly packaging format. Installer? Portable? Per-OS variants?"*

D1 below separates the two permanently. Writing the CLI's packaging decision
into the host note would re-merge what D1 just split.
`explorations/README.md` — *"Split when an item diverges."*

This follows the precedent [[oauth-client-distribution]] §0 set: **the new note
explains the split and the parent is left unedited.** `desktop-ui-host.md:176`
stays on disk as written and is superseded by this note on the packaging-format
half only. The host question that note actually owns is untouched, and it
belongs to `JAC-6`.

§10 of [[drive-oauth]] is inherited here unchanged and stays binding.

## 1. Where the board actually stood — and the sentence that was false

[[oauth-client-distribution]] §7 states, in the table row "Obtain the CLI", that
the step had **"none, until 2026-08-21"**.

Measured 2026-08-24 by reading all 35 cards in project `JAC`:

```
JAC-6   created 2026-08-19 09:36:33 -0300   Source: Fase 3 — item
        "Empacotar o CLI dentro de um host desktop para designers não técnicos"

JAC-16  created 2026-08-19 09:37:33 -0300   Source: Fase 3 — questão aberta
        "Decidir o formato de empacotamento e quais sistemas saem primeiro"

JAC-35  created 2026-08-21 20:26:24 -0300   Source: Descoberto no trabalho
        "Empacotar e distribuir o Jacurutu para a máquina do designer"
        issuelinks: [JAC-34]
```

Those three lines said `Wave` until 2026-08-25, which was wrong: the field ids
were read by position instead of with `expand=names`. Confirmed by asking —
`customfield_16745` is **Source** and `customfield_16746` is **Wave** — the
**`Wave` field is empty on all three cards**, which is the state the emptiness
was supposed to show. `JAC-35` is also the only one of the three carrying no
`Roadmap anchor`, while `JAC-6` has "Phase 3 → Items" and `JAC-16` has "Phase 3 →
Open items inside this phase".

`JAC-16` predates `JAC-35` by **2 days, 10 h and 48 min**, and `JAC-35` links
neither it nor `JAC-6` — its only `issuelink` is `JAC-34`. `JAC-35`'s own
description repeats the false claim, verbatim:

```
é a maior das quatro barreiras de onboarding e a única que não tinha card
```

The 2026-08-21 session named its own failure class: *"inferring where a
measurement was one API call away."* It made three `getJiraIssue` calls and no
board search. The class recurred one layer up, in the same session, in the act
of denouncing it. Recorded here because the recurrence is the reusable part.

**Consequence for ownership.** `JAC-16` is the decision card and this note is
its answer. `JAC-6` is the host card D1 defers to. `JAC-35` is the delivery
card, and the two claims listed in §4 need amending before it is briefed.

## 2. The artifact's weight, decomposed

The complete third-party runtime closure of the CLI, walked from
`package-lock.json` starting at `googleapis` and `google-auth-library`:

```
pacotes no fecho: 89 | ausentes do disco: 0
TOTAL do fecho de runtime Google: 214.5 MiB

os 8 maiores:
    197.9 MiB  googleapis
      8.6 MiB  web-streams-polyfill
      0.8 MiB  lru-cache
      0.6 MiB  gaxios
      0.6 MiB  gaxios
      0.6 MiB  google-auth-library
      0.5 MiB  google-auth-library
      0.5 MiB  path-scurry
```

**That closure is the whole of it, not a part.** `core` declares
`dependencies: {}`; `adapter-jira` declares only `core` and speaks REST over
raw global `fetch`; `cli` adds nothing third-party. `googleapis` and
`google-auth-library` are the only two third-party runtime dependencies the
product has.

`googleapis` is 197.9 of those 214.5 MiB — **92%** — and ships **328** API
surfaces under `build/src/apis`, of which this repository uses **2**
(`drive_v3`, and `google.sheets()`), across three import sites.

The two duplicated copies of `google-auth-library` and of `gaxios` in that list
are `G-DRIVE-2` visible in the lockfile.

The Node runtime, measured on the owner's machine:

```
$ node -p "process.execPath"
C:\Program Files\nodejs\node.exe
$ du -m "C:\Program Files\nodejs\node.exe"
88
```

| Part | Size | Changes when |
|---|---|---|
| `googleapis` + closure | 214.5 MiB | a dependency version moves |
| `node.exe` | 88 MiB | the pinned runtime moves |
| compiled `dist/` | **not measured** — upper bound is the source: 76 files, 13,396 lines of TS | every release |
| `oauth_client.json` | one JSON file | **every secret rotation** |

**The install payload and the update payload differ by orders of magnitude.**
~303 MiB installs once. A normal release moves the compiled JS. A secret
rotation — the reason `JAC-35` wanted an update channel at all — moves one JSON
file. This is what D6 turns on.

Two more facts that bound the design space:

- **There is no CI.** `.github/` contains exactly one file,
  `pull_request_template.md`, and no `workflows/` directory. "Owner's machine or
  CI" was never a choice between two existing things.
- **`G-BUILD` has 0 entries.** The category exists at `docs/GOTCHAS.md:37`,
  scoped to `electron-builder`, and its catalog is empty. Anything built on this
  axis is this project's first.

## 3. The seven decisions the owner closed

**D1 — The package is the CLI. The desktop host is `JAC-6`.**
`JAC-35`'s done-criterion says the designer *"chega ao primeiro comando"*, which
presupposes a terminal, while `MENTOR_BRIEF.md:153` holds that *"CLI alone is
not enough for non-devs"* and [[desktop-ui-host]] §5.1 rejects terminal-bound
invocation *"on sight for this audience"*. Those describe two different
artifacts. The owner ruled the object is the CLI; the host is separate and
already carded. **Accepted cost, stated rather than discovered later:** a
packaged CLI does not satisfy `ROADMAP.md:336`, which names `Jacurutu-desktop`.
See §4, defect 3.

**D2 — The package embeds the Node runtime.** ~303 MiB. The alternative —
presupposing Node 22 or newer on the designer's machine — replaces one developer
step with a smaller developer step rather than deleting the class, and a
developer step in a designer's product is the defect this card exists to remove.
Accepted costs: the update channel has to move that once per install, and the
artifact becomes an executable, so code signing fires at full price.

**D3 — The build reads the secret from a file in `~/.jacurutu/`, on the owner's
machine.** The house pattern is **3 of 3**: every environment variable in this
project carries a *path*, never a secret value — `JACURUTU_IDENTITY_FILE`,
`JACURUTU_JIRA_CREDENTIALS_FILE`, `JACURUTU_TELEMETRY_DIR`. `oauth_client.json`
already is that file and is already in `.gitignore`, so
[[oauth-client-distribution]] D4 ("the file does not disappear; it changes
owner") is satisfied structurally today — what changes is the status of the
secret inside it, not the mechanism. A vault is the right answer if and when the
build machine stops being the owner's; today there is no CI to host one.

**D4 — The production client is the probe client, promoted: renamed and its
secret rotated.** The probe client is already Desktop plus Internal (brief 047,
D6), which is the configuration production needs. Renaming does not change the
`client_id`; rotating the secret does not change the `client_id`; and an
unchanged `client_id` is an unchanged `token.json`.

| Path | Re-authorizations | APIs to re-enable | New project |
|---|---|---|---|
| **Promote the current client** | **0** | 0 | no |
| New client, current project | 1 | 0 | no |
| New client, new project | 1 | 2, with `G-SHEETS-1` armed | yes |

Rotation is precisely the remedy for a secret that was handled loosely, which is
the only real objection to reusing the probe's client, and
[[oauth-client-distribution]] §4 already confirmed in the console that rotation
drops nobody. What promotion does not fix: the Cloud project's own name and
number stay probe-flavoured, and the number appears in error text
(`G-SHEETS-1`).

**D5 — Windows only on day 1. One Authenticode certificate.**
`JAC-16` was born carrying this position — *"Windows primeiro, provavelmente;
Mac e Linux depois"* (board snapshot 2026-08-16, Ref 17) — and every measurement
this project owns was taken on Windows. **A reading this invites and which is
wrong:** `R1` is a *code* rule (`path.join`, no hardcoded roots) and
`MENTOR_BRIEF.md:122`'s "Target platforms: Windows + macOS + Linux" stays true
for the code even when only the Windows artifact ships first. Shipping one
artifact is not narrowing the supported platforms. **No certificate price was
obtained.**

**D6 — The "no manual reinstall" criterion is amended, with a named trigger.**
`JAC-35` carries this criterion, verbatim:

```
existe um caminho de atualização que entrega uma versão nova sem reinstalação manual
```

The channel exists to make secret rotation painless, and the *cadence* of
rotation is unmeasured — whether a client secret expires on its own is still
open ([[oauth-client-distribution]] §8). Building an updater against an
unmeasured need, with `G-BUILD` at zero entries, is `A3` literally ("wait for
the third use"), while the fallback at three designers is three messages.
**Trigger that reopens it:** the first rotation actually needed, or designer
number four. Until then, a rotation costs one manual re-download per person.

**D7 — The server transition becomes its own card, dependent on `JAC-17`.**
[[oauth-client-distribution]] D3 says the secret lives in the installer now and
a server comes later, and in the same breath that the transition *"costs one
re-authorization per installed designer. Today that is one. It is cheapest
before designers onboard."* Those pull in opposite directions, and the cost is
monotonic: onboarding three designers prices the future transition at four. D5
of that note accepted the cost inside a note, which is authority level 7 — and
§1 above is what happens to things that live only in notes. The card carries the
sentence no card carries today: *the price of this transition is one
re-authorization per already-installed designer, and today it is one.*

## 4. Four defects in the inputs, reported and not fixed

`PROCESS_MAP.md` §12.6 — report, do not silently fix.

1. **[[oauth-client-distribution]] §7, "none, until 2026-08-21"** — false.
   `JAC-6` and `JAC-16` existed. §1 above.
2. **[[oauth-client-distribution]] §6 D3 and §8 Related attribute the server
   half to `JAC-18`.** `JAC-18` is "Consolidar a fact table de cada designer em
   um dataset do time" (Fase 4) and contains no server. `JAC-17` —
   "Sincronizar o estado da aplicação com um backend remoto compartilhado",
   Fase 4, blocked by `JAC-1` — is what first makes a server exist, but its
   purpose is state sync, not OAuth brokering. **Neither card is the server
   card**, which is why D7 opens one.
3. **`JAC-35`, the queue-rationale paragraph** claims the card unblocks the
   Phase 3 exit criterion. Under D1 it does not: `ROADMAP.md:336` names
   `Jacurutu-desktop`. Either the criterion or the card needs amending — not
   both left silent.
4. **`JAC-35`, production-client criterion** reads *"existe e foi criado"*.
   Under D4 the client is promoted, not created; what is created is the rotated
   secret.

## 5. What this note does not answer

- **The wrapper's exact shape.** D2 fixes self-contained and D5 fixes Windows;
  whether the ~303 MiB arrives as an NSIS installer or an unpacked directory was
  not decided, and D6 removed the updater that would have forced a known install
  location.
- **The price of an Authenticode certificate.** No number was obtained.
- **Whether `googleapis` can be dropped for raw `fetch`.** The ratio invites it
  — 197.9 MiB for 2 of 328 surfaces, with in-house precedent in `adapter-jira`,
  which has zero third-party dependencies — and it would cut the artifact by
  roughly three. It is a refactor of two adapters and belongs to its own card.
- **Whether `drive.file` can carry an update channel.** `drive.file` is
  per-file access granted per user, so an artifact uploaded by one account is
  not reachable by another designer's grant merely because both authorized the
  same `client_id`. This is documented semantics plus `ROADMAP.md:184`, **not a
  probe** — it was not measured. Widening the scope fires `G-DRIVE-1`: browser
  re-consent for every installed designer.
- **Node's single-executable-application facility with ESM.** Not measured, and
  therefore not claimed either way. It interacts with `R21` and `R22`.
- **Anything about a designer's machine.** No designer machine was touched —
  the fourth consecutive session with this gap. D5 chose OS coverage without a
  machine inventory.
- **Whether the repository is public.** Asserted by
  [[oauth-client-distribution]] §1 and relied on by its D2; not verified in this
  session.

## Credential hygiene

Binding, inherited from [[drive-oauth]] §10. No credential value was read,
printed, or transported by the session that produced this note. The staged-diff
scanner at `.claude/hooks/lib/architecture.mjs` recognises
`GOCSPX-[A-Za-z0-9_-]{20,}`, the literal shape of a Google client secret; note
that `process.env` sits in its `PLACEHOLDER` allowlist, so a line reading an
environment variable is exempt by construction — the scanner cannot be the guard
for that path, which is one reason D3 chose a file.

Related: [[oauth-client-distribution]] (the direct input; four defects reported
in §4), [[desktop-ui-host]] (§176, the packaging-format half this note takes
over; its host question stays there and belongs to `JAC-6`),
[[drive-oauth]] (§10 binding hygiene), [[jira-credentials]] (§4.1c, the
promote-the-probe-registration pattern D4 mirrors, and the `jacurutu-cli` name
proposed for the sibling consent screen), [[local-storage-format]] (`JAC-1`,
which `JAC-17` is blocked by).

## Changelog

- 2026-08-24 — created from the `JAC-35` discussion session. Seven decisions
  closed with the owner; the runtime closure measured at 89 packages and
  214.5 MiB from the lockfile; the board measured at 35 cards, which surfaced
  `JAC-6` and `JAC-16` and falsified §7 of [[oauth-client-distribution]]. Four
  defects reported rather than fixed. Split from [[desktop-ui-host]] §176 on the
  packaging-format half only, following the §0 precedent of
  [[oauth-client-distribution]] — the parent note is not edited. Disposition
  proposed as `candidate`, for the owner to ratify (M-R14).
- 2026-08-25 — §1 corrected: three lines labelled the `Source` field as `Wave`.
  The field ids had been read by position rather than with `expand=names`, so
  the note asserted a value for the one field that is empty on all three cards.
  This is the third instance of the failure class §1 itself denounces, and the
  first with this note's own author as the source. The rule it yields: **a
  field's name is data, not position.** The `Roadmap anchor` observation was
  added in the same pass, from the same measurement.
