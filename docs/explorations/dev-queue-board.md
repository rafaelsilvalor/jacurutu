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
arrives"). This folder is a knowledge archive with a status field, and moving
it to a board would trade prose for cards and gain nothing.

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

`Saci — Dev Queue`, a Notion database seeded on 2026-08-16 with 22 items:
9 Phase 3 items, 8 Phase 3 open questions, 4 Phase 4 items, and one discovered
in the work (wiring a `saci` command to `adapter-sheets`, already in flight on
`feat/report-command`, seeded as In progress).

The link between the two surfaces is a one-way pointer: when a card becomes a
brief, the card carries the brief's path and the brief's Context cites the
card's `Ref`. **The card holds the state; the brief holds the contract.**

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

1. Trash the Notion database (`Saci — Dev Queue`).
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
