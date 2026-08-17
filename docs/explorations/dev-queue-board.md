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

## The cost this accepts on purpose

For the duration of the pilot the 21 seeded items exist twice — as ROADMAP
bullets and as cards. That is the second registry the contract in
`docs/explorations/README.md` exists to prevent.

It is accepted with a deadline and a declared exit. The ROADMAP stays the
single source during the window; the board is a projection. If the pilot
passes, the phase-item bullets become a pointer to the board and the
duplication ends. If it fails, the board is deleted and nothing in git moved.

## How to back out, and what keeps it cheap

Today the exit is two actions and neither is a revert:

1. Trash the Notion database (`Jacurutu — Dev Queue`, under `Dev` in the
   `Jacurutu` teamspace).
2. Flip this note's disposition to `discarded — <date>` with the reason, and
   add the changelog line. The note itself is never deleted; the contract in
   `docs/explorations/README.md` keeps discarded notes as the record.

Nothing else moves, because nothing else was touched. `docs/ROADMAP.md` still
carries all 21 items as bullets, unedited. The board was seeded *from* them and
never replaced them.

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

## What is not known

- Whether requiring the owner's go for every Done transition kills the board by
  friction rather than by uselessness. The window tests this too.
- Whether the owner has permission to create a Jira project at all — there is
  no read path from the connector to `/rest/api/3/mypermissions`.
- How much `docs/ROADMAP.md` changes in three weeks, and therefore whether the
  closing edit is an edit or a reconciliation.

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
