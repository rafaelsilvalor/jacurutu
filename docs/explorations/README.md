# Exploration notes

> **Authority: lowest.** A note may record decisions the owner closed in
> session, but recording them confers no implementation authority. If a note
> conflicts with a brief, `CLAUDE.md`, `MENTOR_BRIEF.md`, `AGENT_PLAYBOOK.md`,
> `GIT_WORKFLOW.md`, or a session recap, the note loses — always
> (`docs/PROCESS_MAP.md` §9).

## What this folder is

A knowledge type between the ROADMAP parking lot (one line per idea, by
protocol) and session recaps (session state): **rich, agent-consumable
insight with no implementation mandate**. Possibilities discussed,
findings validated, traps discovered — accumulated so that when a topic
activates, the planner starts from evidence instead of from zero.

The seed example is `drive-oauth.md`: a validated proof-of-concept
(OAuth flow, scopes, error taxonomy, environment constraints) recorded
long before any adapter brief existed. When the adapter-drive spike was
modeled, that note answered questions the spike would otherwise have had
to research.

## Rules for agents

1. **Never implement from a note.** A note records what was explored and,
   often, what the owner decided while exploring. Neither is a mandate:
   implementation authority comes only from a brief.
2. **Consume as Context.** When a brief's topic has a note here, the
   planner cites it in the brief's Context section and extracts what the
   closed decisions need. The brief — not the note — is what the
   executor obeys.
3. **Do not "fix" notes during unrelated work.** Notes are written and
   updated in a Mentor session, through the write gate, or amended by a
   brief that explicitly scopes them. The Mentor writes the file and
   stops; transport is the owner's or an Orchestrator session's.
4. **Respect credential hygiene stated inside notes** (e.g. files never
   to commit or log). Those lines are binding even though the note's
   ideas are not.

## Status and dispositions

This folder owns the state of each possibility, and `docs/ROADMAP.md` is to
project it. The pattern is the product's own doctrine, applied to
documentation: one surface holds state, the others read from it. A
hand-maintained index here would be the second registry this contract exists to
prevent — once the projection lands, the ROADMAP points at the folder, not at a
list of its files. That projection does not exist yet: brief B migrates the
parking-lot and pending-decision entries into notes and turns both sections
into pointers, and until it merges the ROADMAP does not reference this folder
at all.

Every note carries exactly one disposition, at note level, drawn from this
closed set. **This list is the single source; anything else that names a
disposition points here.**

| Disposition | Meaning | Required with it |
|---|---|---|
| `open` | live, still being explored | — |
| `candidate` | shaped enough to become a brief | — |
| `deferred` | not now | a declared trigger |
| `discarded` | will not happen | a reason |
| `promoted to brief <id>` | a brief now carries it | the brief's id |

Four invariants:

- **The owner ratifies.** A Mentor session *proposes* a disposition at close
  (`docs/MENTOR_BRIEF.md` M-R14); the status written is the ratified one, never
  the proposed one.
- **Every transition is dated,** in the note's `## Changelog`.
- **Nothing is deleted.** A discarded note stays, carrying its reason. The
  record of the thinking is the point.
- **Split when an item diverges.** Status lives at note level, so an internal
  item whose disposition diverges from its note becomes its own note.

## File contract

One file per topic, kebab-case, English (R9). Every note opens with:

```
Status: exploration — no implementation mandate
Disposition: <open | candidate | deferred | discarded | promoted to brief <id>> — <date>
Origin: <Mentor session date(s), source documents>
Roadmap link: <parking lot entry | pending decision # | none>
```

And ends with a `## Changelog` (dated one-liners). When a topic
graduates into a brief, the disposition becomes `promoted to brief
<id>` with its date — the note is never deleted; it remains the
historical record of the thinking.

Template promotion (rule-of-three): this README's contract is the
template for now. Formalize a dedicated template file (brief-template
skill pattern) only if structure drifts by the third note or an
automated checker enters the notes path.

## Lifecycle

Mentor session (a topic is in play) → note authored or updated through the
write gate → disposition proposed at close and ratified by the owner → the
owner or an Orchestrator session carries the file to a `docs/<topic>` branch
and its own PR → consumed as brief Context when the topic activates →
disposition becomes `promoted to brief <id>`.

The Mentor never runs the transport step, and never opens the brief.
