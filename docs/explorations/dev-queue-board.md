# An external board as the agent work queue

Status: exploration — no implementation mandate
Disposition: open — 2026-08-16
Origin: Orchestrator session 2026-08-16, measured against `docs/ROADMAP.md`,
`docs/explorations/`, and the Atlassian and Notion MCP connectors
Roadmap link: projects the Phase 3 and Phase 4 item lists of `docs/ROADMAP.md`
for the duration of the pilot

## The question

Whether this repository's open work should move out of prose bullets into a
management tool, with the agent opening and resolving cards as needs surface.

Three decisions the owner closed on 2026-08-16:

| Decision | Choice |
|---|---|
| Scope | The queue only. Briefs, recaps, doctrine and the ROADMAP's *Identity shifts* stay in git. |
| Reach | Outside the product's. Saci never reads this board, so `adapter-jira` and the `saci export` fact table are untouched. |
| Authority | The agent creates cards freely; moving one to Done needs the owner's explicit go — the gate that closes Pause 3. |

## What the measurement changed

The obvious candidate for migration was `docs/explorations/` — 22 notes, each
carrying a disposition, which reads like a backlog with statuses. It is not one:

```
$ grep -h '^Disposition:' docs/explorations/*.md | sed 's/ *—.*//' \
    | sort | uniq -c | sort -rn
     11 Disposition: deferred
      5 Disposition: open
      2 Disposition: candidate
      3 Disposition: promoted to brief(s) ...
      1 Disposition: discarded
```

**16 of the 22 dispositions are dated 2026-08-06** — the day brief 051 migrated
them in bulk. Six have moved since. Eleven sit in `deferred` behind triggers no
board can evaluate ("Phase 4 shipped", "a concrete downstream consumer
arrives"). This folder is a knowledge archive with a status field, and seeding
it wholesale would trade prose for cards and gain nothing.

Refined on 2026-08-17, when the rename became a card: the cut is not the folder,
it is the disposition. A `deferred` note waits on a trigger no board evaluates
and stays out. A `candidate` note is, by this folder's own contract, "shaped
enough to become a brief" — that is queue material and belongs on the board.
Two notes are candidates today.

The queue with no state surface at all is in the ROADMAP: the unshipped `[prod]`
items of Phase 3, its eight *Open items inside this phase*, and the four
`[coord]` items of Phase 4. Twenty-one work units that exist only as bullets
inside a narrative document — no status, no query, no per-item history. That
is the layer a board serves.

## Where the board lives, and why not Jira

Three tools were evaluated on one criterion first: **the agent must be able to
write to it**. Without that, "the agent opens and resolves cards" has no
referent and the owner maintains a board by hand — worse than the bullets.

| Tool | Write connector | Admin dependency | Verdict |
|---|---|---|---|
| Notion | full — database, pages, views | none; the owner is workspace owner | **chosen** |
| Jira | issues only, no project creation | blocked on a site admin | deferred |
| Trello / Linear / Asana | none in the registry | — | not viable |

Measured on 2026-08-16:

- The Atlassian connector is authorized and reaches exactly one site,
  `estrategia.atlassian.net`, with scopes `read:jira-work` + `write:jira-work`.
  There is no `createJiraProject` tool and no `manage:jira-project` scope, so
  the agent cannot create a project; the owner's own attempt returned the
  site's request-access screen. Project key `SACI` is free.
- The MCP registry returns no connector for Trello, Linear or Asana.
- The Notion workspace has **two members: the owner and the MCP bot**
  (`has_more: false`). "Only I have access" is true by construction there,
  which is stronger than a private Jira project — a site admin still reads one
  of those.

The owner chose Notion now, Jira later if an admin grants the project. Twenty-two
items are cheap to migrate; waiting on an admin is not.

## The board

`Jacurutu — Dev Queue`, a Notion database seeded on 2026-08-16 with 22 items:
9 Phase 3 items, 8 Phase 3 open questions, 4 Phase 4 items, and one discovered
in the work (wiring a `saci` command to `adapter-sheets`, already in flight on
`feat/report-command`, seeded as In progress). It was seeded under the name
`Saci — Dev Queue`, as a workspace-level private page; on 2026-08-17 it was
renamed and moved into the `Jacurutu` teamspace, under a page named `Dev`.

The link between the two surfaces runs one way only: **the card points at the
brief; git never points at the card.** When a card becomes a brief, the card
carries the brief's path, and that is the whole of it. A brief wanting
traceability cites its ROADMAP anchor, which is durable.

The card holds the state; the brief holds the contract — and the contract has
to outlive the card. A Notion `Ref` (`SACI-n`) does not survive a move to Jira,
which is a live enough possibility to design against: a `SACI-n` written into a
brief or a commit message is a dead pointer inside a permanent artifact, aimed
at a board the rollback section below says may be deleted. Git must not depend
on the board, for the same reason the ROADMAP bullets stay where they are.

## What changed after the seed

Recorded because the window is judged on whether the board moved, and none of
this is movement.

On 2026-08-17, before any real use had accumulated:

- Two properties were added. `Wave` (`Now` / `Next`, blank meaning later) marks
  what is in flight. `Must land before` is a self-relation stating timing as a
  relation between cards rather than as a date — a date ages unread, a relation
  stays evaluable, and it maps to a Jira issue link if the board ever moves.
- A `Source` option `Exploration — candidate` was added, for the refined rule
  above.
- The card "Primary command set — fetch / list / start / ship / load / status"
  was split into four: `saci ship`, `saci list`, `saci load`, `saci status`.
  Six commands in one card, two of them already shipped, could not answer what
  we are working on — which is the board's only job. It had inherited the
  ROADMAP's granularity, which groups by theme rather than by investment.
- That card was kept as a tombstone carrying a `SUPERSEDED` note rather than
  trashed, because deleting it erases the record of the split.
- The rename card was created under the new source, `Wave: Now`, with
  `Must land before` pointing at `saci ship`.
- The board took the new product name while this repository still carries the
  old one. That is deliberate: the board is a live surface the rename brief
  cannot reach, and renaming it twice costs more than a few days of mismatch.

The count went from 22 to 27 — 22 seeded, 4 from the split, 1 for the rename —
one of which is the tombstone.

**None of that is a status transition and none of it counts as pilot activity.**
Adding a property, splitting a card and writing a tombstone are changes to the
instrument, not readings from it. When the window is judged, what counts is a
card changing `Status`, or a card born of the work rather than of this
bookkeeping. Exactly one real transition has happened so far: Ref 22 reached
`Done` when the report command shipped as `0a7f05f` (#154).

One tooling trap, recorded because it gave a wrong answer twice in one session:
**`ancestor-path` cannot distinguish a workspace-level private page from a page
at the top of a teamspace.** Neither has a *page* ancestor, so both come back
empty, and reading it as "not in the teamspace" is reading a signal that cannot
carry that meaning. What discriminates is `notion-list-private-pages`: present
means private, absent means it lives somewhere else.

A second trap of the same family, found on 2026-08-19: **`isPrivate` in Jira's
REST project search does not report a next-gen space's access level.** The space
below was created private — the UI's three-level dialog shows `Private`
selected and its *Change* button disabled — while the API kept answering
`isPrivate: false`. It is a legacy flag the team-managed model left behind.

Two occurrences make this a pattern worth naming rather than two anecdotes: a
field that exists, answers, and does not carry the meaning we assigned it is
more dangerous than a missing one, because a wrong answer arrives with the
confidence of a measurement. Before reading a boolean as a verdict, establish
that the field is the one the surface actually writes to.

## The move to Jira, 2026-08-19

The owner closed on Jira three days into the window, and not for the reason the
pilot was measuring. Access to project creation appeared, and with it a fact the
Notion board cannot accommodate at any quality: **the queue has a second
reader.** The owner's direct manager — not a contributor today, expected to be
one later — is to follow the work. In Notion that means inviting a company
manager into a personal workspace whose entire privacy argument was "two
members, the owner and the MCP bot". In Jira it means adding a colleague to a
company space, which is what a company space is for.

So the surface changed on a criterion the seed never named, and the honest record
is that the pilot did not conclude — it was superseded. See *How the pilot is
judged*.

The space, measured after creation:

| Property | Value |
|---|---|
| Key / id | `JAC` / 14869 |
| Style | `next-gen`, `simplified: true` — team-managed |
| Work types | `Task` only; `Epic` and `Subtask` remain, unused |
| Statuses | `To Do`, `In Progress`, `Done` — 1:1 with the Notion `Status` |
| Views | List, Board, Summary; the site's Marketplace apps add four more that are not ours |
| Access | Private, plus the manager as `Member` |

Two capabilities were declined rather than forgotten. **The GitHub connection**
does nothing until the issue key appears in a branch name or a commit subject,
and that means amending `R10` and `R11` — a doctrine change with its own
reasoning, not a checkbox inside a setup wizard. It also grants the Estratégia
site's administrators read visibility of a personal repository. **Automation**
was declined on cost: the site's execution quota is readable only from an admin
page the owner does not hold, and the one rule worth having — fill an empty
description from the template — would fire only on hand-created cards. A rule
that pastes three headings does not justify a consumption question nobody in
this lane can answer.

What the move costs, stated so it is not discovered later:

- **The `Ref` numbers do not travel.** `SACI-n` dies with the Notion database and
  nothing in git breaks, which is the 2026-08-17 rule paying out exactly as
  designed. Had one brief cited `SACI-14`, this migration would have orphaned a
  pointer inside a permanent artifact.
- **`Created` does not travel either.** Every seeded issue carries the seed date,
  so item age before 2026-08-19 survives only in the snapshot named below. Cycle
  time is measurable forward from the seed, not backward.

**Seeded the same day, and verified rather than assumed.** 26 cards as `JAC-1`
through `JAC-26`, every field checked back by JQL: `Source is EMPTY` returns
zero, and the four cards carrying `Wave` or `Brief` are the same four the
snapshot names. `JAC-21` (the report command) was created and moved straight to
`Done`; `JAC-26` (the rename) sits in `In Progress` with `Wave: Now`. Eleven
`Blocks` links carry the dependencies the Notion notes stated, five of them into
`JAC-22` (`saci ship`) — which the graph exposes as the product's bottleneck,
and **three of those five blockers are decisions, not code.** The shortest path
to unblocking `ship` is a session of deciding, not of building.

The tombstone did not travel. Notion's Ref 2 existed only to keep the record of
a four-way split, and the snapshot above now holds that record in git — a better
home than a card parked in `To Do` forever on a board whose one job is saying
what is in play. 26 seeded out of 27 rows, by decision.

## The card contract

The board acquired a reader who does not hold `docs/ROADMAP.md` in their head,
which changes what a card must say. Two rules, both cheap.

**The language is pt-BR**, decided on 2026-08-19 when the reader turned out not
to read English. That reader is the whole of the criterion this board now rests
on — an English board would serve the agent at the cost of the only human who
opens it. This is not an exception to `R9`; it is `E7`'s reasoning applied to
another surface. `E7` keeps the root `README.md` in pt-BR because it is the
product's front door and the team is Brazilian, and it says the scope is a file
rather than a filename. A Jira card is the same class of thing: not code, not
doctrine, something people read.

The cut runs by audience, not by file:

| pt-BR | English, and why |
|---|---|
| Card titles | Field names (`Wave`, `Source`, `Brief`, `Roadmap anchor`) — structural identifiers, four of them, written by id |
| Card bodies | Statuses `To Do` / `In Progress` / `Done`, and `Wave`'s `Now` / `Next` — transparent to a Brazilian reader, and renaming them touches the board columns |

Names of our own things are never translated — `fetch`, `ship`, `manifesto`,
`fact table`, `composition root`, `claimed_by`. Translating an identifier is
worse than leaving it: the reader meets the same word in the code and the
commits.

**The title.** Imperative verb plus object, ≤ 72 characters. The test is one
sentence: *read the title alone, out of context — does it say what will exist
once this lands?* A bare noun (`Sheets`, `saci list`) never passes; it names a
subject, not a unit of work.

The ≤ 72 and the imperative are borrowed from `R10`'s commit subject on purpose,
but the earlier claim that this makes the card, the branch and the commit read
alike **died with the language decision**, and is recorded rather than quietly
dropped: commit subjects stay English under `R9`. The symmetry was worth having;
the reader is worth more.

**The body.** Three blocks, and no more — a longer template in a one-person
queue becomes a form left blank:

```
**O que é** — duas frases, sem jargão: o que passa a existir quando isso
entrar, que hoje não existe.
**Por que está na fila** — o gatilho. O que fica travado, quebra ou é pago
duas vezes enquanto isso espera.
**Pronto quando** — linhas verificáveis.
```

`Roadmap anchor` and `Brief` stay out of the body: they are fields, and the same
fact in two places is the start of two versions of it. A PR link arrives as a
comment, because it accumulates.

Where a brief exists, **Pronto quando** carries that brief's Done criteria
translated literally, and **the `Brief` field is the authority: where the card
and the brief disagree, the brief wins.** The rule was "copied, never
paraphrased" until 2026-08-19; briefs are English, so copying verbatim would
have handed the reader the one language they cannot read. Naming the brief as
the authority keeps what the rule protected — there is still only one definition
of done — without making the card unreadable to the person it exists for.

The contract is applied by hand — by the agent on every card it creates through
MCP, by the owner on the rare card typed into the UI. That is the cost decision
above, recorded here so the absence of enforcement does not read as an oversight.

**Work discovered mid-flight.** A card under way regularly surfaces something
new, most often a decision. Which relation it gets is settled by one test: *is
this part of finishing the card, or something the card is now waiting on?*

| What surfaced | Relation | Why |
|---|---|---|
| A decision or task that stops the card | a sibling `Task`, `Source: Descoberto no trabalho`, `Blocks` → the card that surfaced it | a subtask does not appear on the board, and an invisible decision is one nobody takes; one blocker often blocks several cards, which a parent-child relation cannot express |
| An internal step with no schedule of its own | a `Subtask` of the card | it dies with its parent and nobody needs it in the queue |
| The card turning out to be two cards | new `Task`s plus `Issue split` links (`10103`) | the Notion board had no relation for this and used a `SUPERSEDED` tombstone instead |

The default is the first row, and the board was seeded that way: `JAC-9`,
`JAC-13` and `JAC-14` are decisions blocking `saci ship`, as siblings rather
than as children.

Every such card is born in `To Do` with `Wave` empty. The agent creates without
asking — asking each time would restore the friction the queue exists to remove
— and whether the thing enters `Now` stays the owner's call, which is the
authority rule from 2026-08-16 unchanged.

## The cost this accepts on purpose

For the duration of the pilot the 21 seeded items exist twice — as ROADMAP
bullets and as cards. That is the second registry the contract in
`docs/explorations/README.md` exists to prevent.

From 2026-08-19 the second surface is the `JAC` space rather than the Notion
database. The count and the argument are unchanged: changing which board holds
the projection does not reduce the duplication, and does not close the window
below.

It is accepted with a deadline and a declared exit. The ROADMAP stays the
single source during the window; the board is a projection. If the pilot
passes, the phase-item bullets become a pointer to the board and the
duplication ends. If it fails, the board is deleted and nothing in git moved.

## How to back out, and what keeps it cheap

The owner asked, before agreeing to migrate, whether the work could still be
moved out one day. It can, and the exit is layered rather than single, because
each layer covers a different failure:

1. **`docs/ROADMAP.md` still carries all 21 items as bullets, unedited.** This is
   the rollback image, unchanged by the move: the board was seeded *from* those
   bullets and never replaced them. It covers the case where boards turn out to
   be the wrong instrument entirely.
2. **A frozen snapshot of the Notion board**, taken at migration and committed
   once as `dev-queue-board-snapshot-2026-08-19.md` beside this note. It is dated
   in its own filename and **never updated** — that is what keeps it a record
   rather than the second registry this folder's contract forbids. A maintained
   snapshot is a registry; a frozen one is evidence. It covers a seeding error.
   The file is data, not a note: it carries no disposition and nothing consumes
   it as Context.
3. **Jira's CSV export** (`project = JAC` in the issue navigator, or the same
   query through the API) is the ongoing exit. Fields leave as columns and import
   into another Jira, Linear, GitHub Issues or a spreadsheet. Attachments and
   comment threads do not survive that path faithfully; in a queue whose cards
   carry three headings and a link, nothing of value lives in either. It covers
   leaving Jira.

The Notion database is **frozen, not trashed** — read-only in practice, deleted
only once the Jira board has carried real transitions. Deleting the old surface
on the day the new one is seeded removes the only thing that could prove a
seeding error.

Flipping this note's disposition to `discarded — <date>` with its reason, plus
the changelog line, remains part of any exit. The note itself is never deleted;
the contract in `docs/explorations/README.md` keeps discarded notes as the
record.

**That is not an accident, and it is the reason the duplication above is
tolerable.** The ROADMAP bullets are the rollback image. The moment the closing
edit replaces them with a pointer to the board, backing out stops being a
disposition flip and becomes reconstructing 21 bullets out of a Notion
database — a reconciliation with no source of truth to check against.

So the rule for the window is narrow and worth stating on its own: **do not
remove the ROADMAP bullets before the window closes, however well the board is
working.** The cheap exit and the early cleanup are the same lever pulled in
opposite directions, and the exit is worth more until the pilot has a verdict.

## How the pilot is judged

Window: three weeks of work from the 2026-08-16 seed.

Success: the board **diverged** from the seed — at least 5 status transitions
and at least 3 cards created during the work that were not among the 22. A
board identical to its seed proves nobody consulted it, however comfortable the
idea felt. The `Created` and `Source` properties are what make this countable.

Counter-evidence to watch: commits landing on `docs/ROADMAP.md` that change
item status while the board sits still. That is the queue staying in the
document.

**Closed early on 2026-08-19 — superseded, not passed.** At the move to Jira the
count stood at one status transition and zero cards born of the work, against
five and three. By its own criteria the pilot was failing, and those criteria
were answering a question that had stopped being the deciding one: *does a board
help this work?* was overtaken by *does the queue need an audience?*, which the
Notion board cannot answer at all. The divergence criteria are retired unmet.
Recording that is the point — a criterion quietly restated to match its outcome
teaches nothing on the next adoption.

The audience criterion replaces them and is judged differently: whether the
manager reads the board without being walked through it. The counter-evidence
changes with it — from ROADMAP commits moving item status, to the owner
explaining in conversation a card that the card should have explained on its own.

## What is not known

- Whether requiring the owner's go for every Done transition kills the board by
  friction rather than by uselessness. Unchanged by the move: the gate now exists
  mechanically, since the agent transitions `To Do → In Progress` and never
  touches `Done`.
- Whether the manager reads the board unprompted, which is the whole of the
  criterion the move now rests on.
- How much `docs/ROADMAP.md` changes before the closing edit, and therefore
  whether that edit is an edit or a reconciliation.

Answered on 2026-08-19: whether the owner could create a Jira project. They
could — `JAC` exists, created by hand in the UI. The connector still cannot: with
`read:jira-work` + `write:jira-work` and no `manage:jira-project`, creating a
space and creating a field stay the owner's actions, and the agent's reach begins
at the issue.

## Changelog

- 2026-08-16 — authored during an Orchestrator session; the owner closed scope,
  reach and authority; Notion chosen over Jira and Trello on measured
  connector capability; board seeded with 22 items; disposition proposed
  `open` pending the pilot's verdict.
- 2026-08-17 — the card/repo link was corrected to run one way only; the seeding
  rule was refined from "no exploration notes" to "candidate notes only"; two
  properties, one source option and a four-way split took the board to 27 cards;
  the board was renamed `Jacurutu — Dev Queue` and moved into the `Jacurutu`
  teamspace under a page named `Dev`; Ref 22 reached `Done` — the first, and so
  far only, real transition.
- 2026-08-19 — the owner closed on Jira and the `JAC` space was created, on the
  audience criterion rather than on the pilot's; the divergence criteria were
  retired unmet and recorded as superseded, not passed; the exit was restated in
  three layers and the Notion database frozen rather than trashed; the card
  contract was written; the GitHub connection and every automation rule were
  declined, with their reasons; a second field-meaning trap (`isPrivate`) joined
  the `ancestor-path` one and the pair was named as a pattern. Disposition stays
  `open`: the closed set in `docs/explorations/README.md` has no value for
  "adopted", and inventing one to fit the news would cost more than the news is
  worth.
- 2026-08-19 — the card contract turned pt-BR: the second reader does not read
  English, which is `E7`'s reasoning rather than an `R9` exception. The
  card/branch/commit symmetry was retired with the reason recorded, and
  **Pronto quando** became a literal translation with the `Brief` field named as
  the authority. The Notion board was read and frozen as
  `dev-queue-board-snapshot-2026-08-19.md`, 27 rows verbatim — layer 2 of the
  exit.
- 2026-08-19 — the queue was seeded into `JAC`: 26 cards, 11 `Blocks` links, the
  Ref 2 tombstone left behind with the snapshot holding its record, every field
  verified by JQL. The mid-flight rule was fixed — a decision that stops a card
  becomes a sibling `Task` with a `Blocks` link, not a subtask — and `Issue
  split` was adopted for the case Notion had to fake with a tombstone.
