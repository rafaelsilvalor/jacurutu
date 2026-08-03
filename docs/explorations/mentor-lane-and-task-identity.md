# Mentor lane in Claude Code, and the task identifier

Status: exploration — possibilities only, NOT a commitment or spec
Disposition: candidate — 2026-08-03
Origin: mentor session 2026-08-03 (harness model; mode: exploring
possibilities). Consumes the parked "multi-contributor naming package"
of `docs/tasks/039-orchestrator-doctrine/brief.md` and the fused-model
design recap `docs/sessions/2026-07-25-mentor-fused-model-design.md`.
No source documents outside the conversation and the repo.
Roadmap link: none as a product item. Brief B below changes the
structure of the ROADMAP's Parking lot and Pending decisions sections.

The question this note holds: the Mentor role lives outside Claude Code,
on a surface that cannot read the repo. What does it cost to bring it in,
and what happens to the artifacts it produces? A second question rode
along and turned out to be downstream of the first: whether the task and
recap identifier should stop being a sequence number.

Contract note: this note records decisions the owner closed in session.
Under the current `README.md` contract that is a tension — notes are
said to hold possibilities, not decisions. D15 below resolves it by
rewriting the contract. Until Brief A lands, this note's authority stays
lowest: nothing here is implementable without a brief.

---

## 1. The problem behind both questions

Four registries answer "what comes next" in this repo, and they already
disagree.

| Registry | Where | Format |
|---|---|---|
| Parking lot | `ROADMAP.md` | one line per idea, enrichment forbidden by protocol |
| Pending decisions | `ROADMAP.md` | numbered question, struck through when resolved |
| Orchestrator queue | recap chain | numbered list, rewritten each session |
| Exploration notes | `docs/explorations/` | rich note, lowest authority |

Evidence of drift: the "multi-contributor naming package" — the origin of
the identifier question — lives only in the Orchestrator queue, echoed by
eight consecutive recaps, and never entered the Parking lot. A reader of
the ROADMAP alone would not know it exists.

The resolution reuses the product's own doctrine (2026-06-12: the
application owns state, the spreadsheet is a one-way projection):
`docs/explorations/` owns the state of each possibility; the ROADMAP
projects. Phases, identity shifts and the layer map stay in the ROADMAP —
those are committed structure, not possibilities.

## 2. Decision set A — the Mentor lane

| # | Decision |
|---|---|
| D1 | Chat is retired. Claude Code is the Mentor's only home; `harness/workflows/setup-chat.md` leaves the harness. |
| D2 | Vehicle: a `mentor-mode` skill invoked at session open, plus a thin `harness/workflows/setup-mentor.md`. Its own main session — not an Orchestrator mode, not a subagent. One session, one role. |
| D3 | Wide read, narrow write. Reads anything, runs non-mutating shell (`git log`, `ls`, `grep`, `npm test`); nothing that changes state. Writes only under `docs/explorations/`, through the write gate with read-back. Mechanically backed by a path `deny` in `.claude/settings.json`. |
| D4 | Plan mode is the Mentor session default. |
| D5 | Subagents are forbidden in a Mentor session. No planner, no executor, no gate, no pipeline. |
| D6 | The Mentor recap is retired. The session's only artifact is the topic note. Transport: `docs/<topic>` branch plus its own PR, self-served through the write gate. |
| D7 | `close-chat-session.md` becomes `close-mentor-session.md`, rewritten for the new close. |
| D8 | The four M-R13 modes collapse into two axes: a session with a topic produces or updates a note and proposes its disposition at close; a session without one produces no artifact. The four labels survive as opening intent, not as behavior classes. |
| D9 | `docs/explorations/` owns the state of possibilities; the ROADMAP projects. |
| D10 | Dispositions: `open`, `candidate`, `deferred` (declared trigger required), `discarded` (reason required), `promoted to brief <id>`. Every transition dated. Nothing is deleted. |
| D11 | The Mentor records and writes the ratified status; the owner ratifies; the Orchestrator consolidates — projection upkeep and note-to-brief promotion. The Mentor never touches the ROADMAP and never opens a brief. |
| D12 | Status lives at note level. Split rule: an internal item whose disposition diverges becomes its own note. |
| D13 | The ROADMAP points at the folder. No hand-maintained index — a second registry is what this note diagnosed. |
| D14 | M-R14 is rewritten: the close ritual stops producing a recap and starts proposing the disposition of the notes the session touched. |
| D15 | The `explorations/README.md` contract is rewritten: a note records closed decisions but still confers no implementation authority. The line "notes contain possibilities, not decisions" is dropped. |

Accepted price of D6: the Mentor loses its global temporal index. Today
`ls docs/sessions/` shows every Mentor session in order. Scattered across
topic notes, that history is discoverable only by opening files. Dated
`Origin` lines, dated changelogs and `git log` are the mitigation. The
loss is real and applies forward only.

## 3. Decision set B — task and recap identifier

The recap's `NNN` was never a session identifier. It is a foreign key
into `docs/tasks/<NNN>-<slug>/`. There is no isolated recap migration;
there is a task-identifier migration that the recap inherits.

What the sequence number costs today: the whole P4 protocol in
`.claude/agents/planner.md`; a "P4 slot evidence" section in every
Orchestrator recap; a troubleshooting row in the playbook; burns
(004-006, 034) that need prose so they do not read as mistakes; a
recorded collision (035, two recaps on one slot); and a structural
failure logged at 048 — the three canonical sources cannot see a slot
held only on an unmerged branch, which is exactly what 047 was doing.
A date is self-assigned: no lookup, no protocol, no conflict, no gap.

| # | Decision |
|---|---|
| E1 | The target is the task identifier; the recap inherits it. |
| E2 | Task: `docs/tasks/YYYY-MM-DD-slug/`. Recap: `docs/sessions/<session-date>-<role>-<slug>.md`, role in {orchestrator, executor}. |
| E3 | Cutover at slot 049. Through 048, `NNN`; from 049 on, date. Forward only, no retroactive migration. |
| E4 | An aborted task becomes a preserved folder carrying an `ABORTED` marker and its reason. Burns stop existing as a concept — there is no sequence left to puncture. |
| E5 | Same-day collisions take a short ordinal suffix, applied only on collision. Intra-day ordering rides the Consumes chain and git, not the filename. |
| E6 | The dev token stays out. The original trigger of the 039 package — a second regular contributor — remains parked. |
| E7 | Global slug uniqueness becomes a system invariant: it carries the task-to-recap join now that the two dates diverge. The numeric P4 dies; a slug-collision check against the whole history of `docs/tasks/` replaces it. |
| E8 | A task born before the cutover keeps its `NNN` identity for life, including its later recaps. Not hypothetical: 047 is alive on an unmerged branch. |
| E9 | While any pre-049 task is alive, planner and validator accept both shapes. Support for the old shape is removed when the last pre-049 task merges. |

Cutover rule in one sentence: a task is born under one scheme and dies
under it; the cutover governs birth, never a task in flight.

## 4. Why B depends on A

The identifier argument inverted once D6 landed. With the Mentor recap
retired, both surviving recap classes are task-bound, which strengthens
the case for a task-anchored identifier rather than weakening it. The
E-set has the shape it has because of D6; recorded here so a future
reader does not re-derive it from scratch.

## 5. Migration surface

Measured on 2026-08-03.

| Surface | Count | In scope |
|---|---|---|
| Files carrying the `NNN` convention outside `docs/tasks/` and `docs/sessions/` | 15 | yes (Brief C) |
| Task folders | 45 | no |
| Session files (43 of them Mentor recaps) | 86 | no |
| Prose references to numbered briefs and sessions, across 127 files | 750 | no |
| ROADMAP parking lot plus pending decisions entries | 22 | yes (Brief B) |

The 750 prose references are the reason the retroactive rename was
rejected. Most live inside historical recaps, which record what was said
on a given day; rewriting them is falsification, not migration. Renaming
files without sweeping the references produces 750 dangling pointers,
which is worse than two schemes coexisting. A dated cutover is how this
repo already handles regime change — identity shifts, preserved burns,
struck-through decisions, superseded phases.

Collateral gain: the two slot-less recaps that exist today
(`2026-07-26-orchestrator-smoke-open-windows.md` and
`2026-06-24-executor-product-map-at-a-glance.md`) stop being exceptions —
the new shape absorbs that class.

## 6. The three briefs

| Brief | Scope | Depends on |
|---|---|---|
| A | Mentor doctrine in Claude Code: skill, harness prompt, `MENTOR_BRIEF.md`, `AGENT_PLAYBOOK.md` ch. 6, `close-mentor-session.md`, `settings.json` deny, `explorations/README.md` contract, `CLAUDE.md` related documents | none |
| B | Migration of the 22 ROADMAP entries into notes; both sections become pointers | A, for the note contract |
| C | Identifier cutover at 049 across the 15 convention files | A, for `close-mentor-session.md` |

All three are Category L and caminho B — they modify the pipeline itself,
so the planner is not invoked (M-R15).

## 7. Risks accepted

1. Mentor history stops being indexable by directory listing (D6).
2. Two identifier schemes coexist permanently, separated by a dated
   cutover rather than by a migration (E3).
3. This note carries ratified decisions before the contract that allows
   it exists (D15). If Brief A never lands, the note reverts to being a
   record of a conversation and nothing binds.

## Changelog

- 2026-08-03 — note created. Decision sets A (15) and B (9) closed in
  session; three briefs identified with their dependency order;
  disposition set to `candidate`.
