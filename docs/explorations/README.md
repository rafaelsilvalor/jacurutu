# Exploration notes

> **Authority: lowest.** Nothing in this folder is a commitment, a spec,
> or an instruction. If a note here conflicts with a brief, `CLAUDE.md`,
> `MENTOR_BRIEF.md`, or a session recap, the note loses — always.

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

1. **Never implement from a note.** Notes contain possibilities, not
   decisions. Implementation authority comes only from a brief.
2. **Consume as Context.** When a brief's topic has a note here, the
   planner cites it in the brief's Context section and extracts what the
   closed decisions need. The brief — not the note — is what the
   executor obeys.
3. **Do not "fix" notes during unrelated work.** Notes are updated in
   Mentor sessions (mode: exploring possibilities) and committed via
   caminho B, or amended by a brief that explicitly scopes them.
4. **Respect credential hygiene stated inside notes** (e.g. files never
   to commit or log). Those lines are binding even though the note's
   ideas are not.

## File contract

One file per topic, kebab-case, English (R9). Every note opens with:

```
Status: exploration — possibilities only, NOT a commitment or spec
Origin: <mentor session date(s), source documents>
Roadmap link: <parking lot entry | pending decision # | none>
```

And ends with a `## Changelog` (dated one-liners). When a topic
graduates into a brief, add a status line ("promoted to brief NNN —
<date>") — never delete the note; it remains the historical record of
the thinking.

Template promotion (rule-of-three): this README's contract is the
template for now. Formalize a dedicated template file (brief-template
skill pattern) only if structure drifts by the third note or an
automated checker enters the notes path.

## Lifecycle

Mentor chat (brainstorm) → note authored/updated by the Mentor →
caminho B commit (docs branch, own PR) → consumed as brief Context when
the topic activates → status line on promotion.

Notes stay **out of the claude.ai project-knowledge cache by default**
(the cache policy is canonical docs only). A note is uploaded on demand
when its topic is the active thread.
