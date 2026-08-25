# Session recap — 2026-08-24 — cli-packaging (Orchestrator)

**Mode:** discussion session, opened in Plan mode under an explicit
no-implementation mandate. The owner lifted it at the end and authorized the
note, its commit, and this recap. Nothing was written before that.
**Consumes:** `0768101` — head of `main` after #166.
**Branch:** `docs/cli-packaging`, cut from `0768101`.
**Produced:** `docs/explorations/cli-packaging.md` (`7f54040`, 289 lines) and
this recap.
**Cards:** none touched, in either direction. `JAC-16` was identified as the
card this session actually answers; `JAC-6` as the host card; the server card
`D7` calls for was specified and **not** opened.
**Span:** 2026-08-24 to 2026-08-25. This line read "one day" until the second
date was measured — `7f54040` is stamped `2026-08-25T07:42:45-03:00` and
`f8c7f76` `2026-08-25T10:40:18-03:00`, while the session opened on 2026-08-24.
The 2026-08-24 stamps on the note's disposition and on this file's name are
correct and stay: `PROCESS_MAP.md:191` fixes the recap's date as the *session's*.

## One-line summary

Seven decisions closed, and the reusable output is not any of them. It is the
rule the session had to invent to catch the previous session's error:
**a claim of absence requires an enumeration, not a lookup.**

## The decision chain, and why the order was not the card's order

`JAC-35` listed five open questions and named the packaging format as the one
that "determines all the others". It is not. Upstream of all five sat a question
the card did not contain: **what the package is a package of.** Three documents
answered it one way and the card's own done-criterion answered it the other:

- `MENTOR_BRIEF.md:153` — "CLI alone is not enough for non-devs"
- `ROADMAP.md:317` and `:336` — packaging means `Jacurutu-desktop`, and the
  Phase 3 exit criterion names it
- `desktop-ui-host.md:108` — terminal-bound invocation rejected "on sight for
  this audience"
- `JAC-35` — the designer reaches a first *command*, which presupposes a terminal

Those are two artifacts, not one. Once the owner ruled the object is the CLI, the
remaining four questions became answerable in a chain the card had not
anticipated: runtime → secret store → production client → OS coverage → update
channel → server. Seven decisions, recorded in
`docs/explorations/cli-packaging.md` §3, one owner ruling each.

## The failure this session contributes: absence needs enumeration

The 2026-08-21 session named its own class — *"inferring where a measurement was
one API call away"* — and recorded it as the load-bearing lesson. It then made
three `getJiraIssue` calls and no board search, and concluded the packaging step
had no card. Its note says so in §7; the `JAC-35` description it wrote says so
too.

Measured here by enumerating all **35** cards in project `JAC`:

- `JAC-6` — the desktop host card, created 2026-08-19 09:36:33 -0300
- `JAC-16` — the packaging-format and OS-coverage decision card, created
  2026-08-19 09:37:33 -0300, **2 days 10 h 48 min before `JAC-35`**
- `JAC-35` links neither; its only `issuelink` is `JAC-34`

The generalization, and it is sharper than the 2026-08-21 one because it says
what to *do*:

> **A targeted query can confirm presence. Only an enumeration can establish
> absence.** "There is no card for this" is a claim about a set, so it is
> answered by listing the set. Three lookups that each returned what they asked
> for cannot rule out a fourth thing nobody asked about.

This session almost repeated it. The first board query was `summary ~` with six
guessed terms; it happened to hit `JAC-6` and `JAC-16`, and only then was the
whole board enumerated — which is also what surfaced `JAC-17` and `JAC-30`. The
guess worked. That is not a method.

Two further attributions were wrong in the same note and are corrected in
`cli-packaging.md` §4: the server half was attributed to `JAC-18` (fact-table
consolidation) when `JAC-17` is the card that first makes a server exist — and
neither is an OAuth-brokering card, which is why `D7` opens one.

## Three things this session did to its own instrument, before being asked

1. **The 714 MiB figure was denounced before it was used.** The first dependency
   measurement came from the main checkout and included `electron` at 262 MiB,
   dev-only and belonging to v1. Reporting it as the artifact's weight would have
   been wrong by more than 2x. The number that survived — 89 packages,
   214.5 MiB — was walked from `package-lock.json` and is the *complete*
   third-party runtime closure, because `core` declares no dependencies and
   `adapter-jira` speaks REST over raw `fetch`.

2. **The R9 hook was run against the approved content before writing it.** Six
   lines carried pt-BR marker words in prose on an English-only surface and
   would have produced `decision: "ask"` — the same finding the 2026-08-21
   session took. The gate was reopened on a five-item delta that moved verbatim
   card text into fenced blocks, where `checkLanguage` exempts it, and the owner
   approved the delta separately. After writing: **0 findings** from
   `checkLanguage` and **0** from `checkReferences` over 453 tracked files.
   Writing content already known to fail a check, and then denouncing it, would
   have been worse than asking twice.

3. **A number measured after the gate was kept out of the note.** With `dist/`
   finally present, the compiled output measures 45 emitted `.js` files and
   220,563 bytes — **215 KiB**, against ~303 MiB of install, a ratio near
   1,400 to 1, and it is the number `D6` rests on. It came from a build that
   exited 1. The note still says "not measured", which is true and conservative;
   replacing an honest gap with a contaminated figure in a byte-approved file
   would have been a downgrade. The figure lives here instead, with its cause.

### And a fourth, found after the merge, which is the one worth keeping

Preparing the board actions after `#167` merged, the Jira field ids were finally
read with `expand=names`:

```
customfield_16743 = Roadmap anchor
customfield_16744 = Brief
customfield_16745 = Source
customfield_16746 = Wave
```

`customfield_16745` is **Source**. Three lines of the note's §1 had labelled it
**Wave** — and `Wave` is null on all three cards, which is exactly the state the
session had been told mattered. This line's own `Span` was wrong in the same
commit, asserted as "one day" against two commit timestamps that say otherwise.

Both were inferred: one from a field's position in a JSON object, one from an
impression of elapsed time. Both were one parameter and one `git log` away. So
this is the **third** occurrence of the class this recap opened by denouncing in
its predecessor, and the first with this session as the author rather than the
critic. Denouncing a class does not exempt you from it; only measuring does.

The rule, stated so the next session can apply it without re-deriving it:
**a field's name is data, not position, and a span is a timestamp, not a
feeling.** Corrected on the branch `docs/cli-packaging-field-labels`.

One self-correction, recorded once: the approved plan proposed a one-line
amendment to `desktop-ui-host.md`. The house precedent is the opposite —
`oauth-client-distribution.md` §0 split from `drive-oauth.md` by explaining the
split and leaving the parent unedited. The precedent was followed and the plan
was wrong.

## The green boundary did not close, and the cause is catalogued

```
$ npm run build
packages/cli/src/cli.ts(67,7): error TS2353: Object literal may only specify
known properties, and 'credentialExpiry' does not exist in type 'JiraGatewayConfig'.
exit: 1   (stable across two runs, one error each)
```

This is **`G-NODE-2`** live. The worktree has no `node_modules`, so
`@jacurutu/adapter-jira` resolves through the main checkout's symlink, whose
`dist/http.d.ts` is stamped 2026-08-20 14:39 against a `src/http.ts` of
2026-08-21 06:58 and does not know `credentialExpiry`. The main checkout sits on
the same commit `0768101`, clean. **There is no evidence that `main` is broken —
only evidence that this worktree cannot prove it is not.**

`npm test` closed green: **393** package tests plus **112** hook tests, zero
failures, exit 0. Both summaries were checked, because a single tail would have
shown one and hidden the other.

Second live confirmation: **`G-HOOK-1`** — `core.hooksPath` is `UNSET` here and
`.githooks/pre-commit` exists on disk without firing. Second consecutive session
observing it. The guard libraries were therefore called by hand: `scanSecrets`
and `checkFileSize` returned empty, and `decideCommitMessage` returned
`allow / R10-ok / subject ok (56 chars, verb "document")`.

**A side effect this session caused:** running `npm run build` created
`packages/*/dist` in a worktree that had none. It is gitignored and outside the
commit, and it is why the 215 KiB above became measurable at all.

## The gates, and one declared deviation

The write gate ran **twice** for one file: once on the full proposed content,
once on the five-item delta the R9 prediction forced. Read-back from disk
confirmed all five delta items present, all three superseded forms absent, and
all five wikilinks resolving to real notes. Pause 3 ran once, carrying the failed
build verbatim ahead of the passing tests.

**One declared process deviation.** `docs/explorations/` belongs to the Mentor
lane (`PROCESS_MAP.md` §4, `explorations/README.md` rule 3) and this was an
Orchestrator session. The owner's instruction in the session outranks it (§9.1).
Named before executing, not discovered afterwards — the same shape the
2026-08-21 session used, and the second consecutive session to use it. **If the
next one needs it too, the rule is what should change, not the exception.**

## What this session did not verify

- **No designer machine was touched.** Fourth consecutive session, and this time
  it bit: `D5` chose OS coverage with no machine inventory in existence.
- **`main`'s green boundary.** See above; unprovable from this worktree.
- **The price of an Authenticode certificate.** `D5` commits to buying one and
  no number was obtained.
- **`drive.file` across accounts.** The conclusion that it cannot carry an
  update channel rests on documented semantics plus `ROADMAP.md:184`, not a probe.
- **Node's single-executable-application facility with ESM.** Not measured and
  not claimed.
- **Whether a client secret expires on its own.** Open since 2026-08-21, and
  `D6` turns on exactly this unknown.
- **Whether the repository is public.** Asserted by the input note, relied on by
  its D2, unverified here.

## Queue state

`docs/explorations/cli-packaging.md` is committed with disposition `candidate`,
**proposed and not ratified** (M-R14). No push, no PR. The board is untouched:
six owner actions are listed in the note and in the session's closing table —
four in the Google console, and on the board the links from `JAC-35` to `JAC-16`
and `JAC-6`, the two description corrections, and the new server card.

## Next session

Ratify or change the disposition, then decide whether `JAC-35` gets a brief —
noting that `JAC-16`, not `JAC-35`, is the card this note closes, and that
`JAC-35`'s two false claims should be fixed before it is briefed. Two
`README.md` defects reported by the 2026-08-21 session are still open and still
belong to another owner.
