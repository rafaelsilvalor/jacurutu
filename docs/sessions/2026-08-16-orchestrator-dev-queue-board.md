# Session recap — 2026-08-16 — dev-queue-board (Orchestrator)

**Mode:** Orchestrator, opened on an exploratory question — whether the roadmap
and open tasks should move to a management tool with the agent opening and
resolving cards. Caminho B: the session authored and committed its own docs; no
planner, no executor, no brief.
**Consumes:** `1c9f299` — head of `main` when the session opened, and the
verified base of the branch. Confirms the merge of PR #153.
**Branch:** `docs/jira-agent-tracker`, cut from `1c9f299`. One commit so far,
plus this recap. The branch is an initiative branch: it lives across sessions
until the pilot closes, then merges to `main` by PR and is deleted.
**Produced:** `docs/explorations/dev-queue-board.md`, the `Saci — Dev Queue`
Notion database seeded with 22 items, and this recap.
**Pairs with:** none. No executor half — the session did its own writes.

## One-line summary

The queue moved to a Notion board rather than Jira, and the measurement that
decided it also reversed the original premise: the folder that looked like a
backlog was not one, and the real queue with no state surface was in the
ROADMAP all along.

## What the measurement found before anything was built

The obvious migration target was `docs/explorations/` — 22 notes each carrying
a disposition. Counting them killed the idea:

    11 deferred · 5 open · 2 candidate · 3 promoted · 1 discarded

**16 of 22 dispositions are dated 2026-08-06**, the day brief 051 migrated them
in bulk; 6 have moved since. Eleven wait on triggers no board evaluates
("Phase 4 shipped", "a concrete downstream consumer arrives"). It is a
knowledge archive with a status field.

The queue with no state surface at all was the ROADMAP's own phase lists: 9
unshipped Phase 3 items, 8 open questions, 4 Phase 4 items. Twenty-one work
units living as bullets inside a narrative document.

## The tool was chosen on capability, not preference

One criterion came first: the agent must be able to write to it, or "the agent
opens and resolves cards" has no referent.

| Tool | Result |
|---|---|
| Notion | full write connector; workspace has one human member; chosen |
| Jira | connector authorized, but no `createJiraProject` tool and no `manage:jira-project` scope; the owner's own attempt returned the site's request-access screen; deferred, not discarded |
| Trello / Linear / Asana | MCP registry returned no connector; not viable |

The Notion workspace turning out to have exactly two members — the owner and
the MCP bot — made "only I have access" true by construction, which a private
Jira project cannot match while a site admin exists above it.

## Decisions closed with the owner

| # | Decision |
|---|---|
| Q1 | Scope: the queue only. Briefs, recaps, doctrine and *Identity shifts* stay in git |
| Q2 | The board is outside the product's reach; Saci never reads it |
| Q3 | The agent creates cards freely; Done needs the owner's explicit go |
| Q4 | Notion now, Jira later if an admin grants the project |
| Q5 | The 22nd card (wiring a command to `adapter-sheets`) is seeded `In progress`, because `feat/report-command` is already carrying it |
| Q6 | One initiative branch across sessions, merging to `main` at the close — a normal branch, not the retired harness-redesign model |

Q6 was the one the session pushed back on and lost, correctly. The objection
conflated "a branch that lives until its action ends" with the accumulating
model retired on 2026-08-09; only the second contradicts `GIT_WORKFLOW.md`.
What survived the pushback was one operational guard: `docs/ROADMAP.md` is the
only shared conflict surface, so its edit goes last, after a rebase.

## Two claims the author made without measuring

Recorded because both were caught by an instrument rather than by re-reading.

| Claim | Reality | Caught by |
|---|---|---|
| The Atlassian connector is not authorized | It was — one site, `estrategia.atlassian.net`, with `read:jira-work` + `write:jira-work` | Calling `getAccessibleAtlassianResources` instead of trusting the session notice |
| The note is dated 2026-08-15 | Today is 2026-08-16; seven dates were wrong, including `Disposition:` and the changelog — the two fields the explorations contract requires dated | `stat` on a rebuilt artifact showing 2026-08-16, then `date` |

The second was caught before the commit and fixed in the note and in the
board's own description, because the pilot's success criterion counts from the
seed date.

## A remedy broader than the documented one

The green boundary came back red: `tsc -b` failed with three `TS2305`/`TS2724`
errors on a docs-only branch. Diagnosis was correct — the main checkout's
`packages/core/dist/gateways.d.ts` had 0 occurrences of `SpreadsheetGateway`
and an mtime three days behind its own source, and this worktree has no
`node_modules`, so it borrowed them. That is `G-NODE-2`.

The remedy chosen was `npx tsc -b` in the **main checkout**, proposed to the
owner with its cost named and approved. It worked and left the build green. But
`G-NODE-2`'s documented workaround is `npm install` at the worktree root, which
is contained; the chosen one mutated state four worktrees read. The gotcha was
read *after* the remedy, not before. No harm resulted — the dist was stale
against its own source, so the rebuild was a pure correction — but the
contained option existed and was the documented one.

A follow-up was queued rather than folded in: `G-NODE-2` frames the staleness
as relative to the reader's own change, which sends an agent with no
TypeScript diff looking in the wrong place.

## Process notes

- The `claude/*` worktree branch is scaffolding; the work branch was cut inside
  the session from a verified `origin/main`.
- The board was created empty, its shape shown to the owner, and seeded only
  after approval — the same rhythm as Pause 2.
- The seed count was verified by an independent SQL query against the data
  source rather than by trusting the creation response: 9 + 8 + 4 + 1 = 22.
- `.agents/`, `.codex/` and `AGENTS.md` sit untracked in this worktree from
  another source. They were kept out of the stage and are not this session's.

## What this session did not verify

- Whether the owner can create a Jira project at all. There is no read path
  from the connector to `/rest/api/3/mypermissions`; the request-access screen
  is evidence of a block, not of which permission is missing.
- Whether requiring a go for every Done transition kills the board by friction
  rather than by uselessness.
- How much `docs/ROADMAP.md` changes in three weeks, and therefore whether the
  closing edit is an edit or a reconciliation.
- The board's own usefulness. That is what the three-week window measures, and
  nothing observed so far bears on it.
