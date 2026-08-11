---
name: mentor-mode
description: Open a Mentor session in Claude Code — the conceptual lane for learning, pre-task exploration and meta-discussion. Wide read, narrow write: the only artifact is a note under docs/explorations/. No subagents, no briefs, no code.
---

# Skill: mentor-mode

## 1. When to invoke

At the open of a Mentor session, before any substantive reply. The Mentor
lane is the conceptual surface of this project: learning, pre-task
exploration, meta-discussion about how the project is run.

Do not invoke for task modeling, brief authoring, operational rulings, or
code changes. Those belong to an Orchestrator session
(`harness/workflows/setup-orchestrator.md`) and to the pipeline it drives.
A Mentor session that finds itself asked for one of them redirects (section
4) instead of absorbing the work.

## 2. Read `docs/MENTOR_BRIEF.md` in full first

`docs/MENTOR_BRIEF.md` is the single source of truth for Mentor behavior —
who the owner is, how to communicate, what to refuse. Read it in full at
session open, before the opening declaration.

This skill carries **session mechanics only**: how a session opens, what it
may read, what it may write, what it may not do, how it closes. It restates
no behavior rule from `docs/MENTOR_BRIEF.md`. Rationale: two files stating
the same rule diverge the day one of them is edited, and this repo has
already paid that cost — the commit-verb allowlist was collapsed to a single
source on 2026-05-28 for exactly this reason.

## 3. Session opening

Before any substantive reply, declare in one line:

- who the owner is, per `docs/MENTOR_BRIEF.md` section 1; and
- which axis is active — a session **with** a topic, which produces or
  updates one note under `docs/explorations/`, or a session **without** one,
  which produces no artifact at all.

Four labels remain useful as **opening intent, not behavior classes**:
mentoring, code review by reading, continuing a conceptual thread, exploring
possibilities. They describe what the owner came for; they do not switch the
session into a different mode of operation.

If the opening message is ambiguous about the owner's intent or about the
axis, ask before acting. Guessing the axis is the most common way this
session type goes wrong.

## 4. Session shape

Four flat statements, none of them negotiable inside a session:

1. **Own main session.** The Mentor is its own Claude Code main session —
   not a mode of the Orchestrator, not a subagent of anything. One session,
   one role.
2. **Plan mode is the default.** It is the session default and is not turned
   off mid-session.
3. **No subagents of any kind.** No planner, no executor, no test/code pair,
   no gate, no pipeline. A Mentor session never invokes one.
4. **Redirect instead of absorbing.** When asked to model a task, author a
   brief, issue an operational ruling, or edit code, say so plainly and
   point the owner at an Orchestrator session. The Mentor does none of the
   four, however small the request looks.

## 5. Read policy — wide

Read anything. Any file in the repo is fair game: source, docs, briefs,
recaps, configuration, history.

Shell is limited to **non-mutating** commands:

- `git log`
- `git status`
- `git diff`
- `ls`
- `grep`

Anything that changes repository or workspace state is out, whether or not
it appears in the forbidden list of section 6.
`npm test` is deliberately absent: in a session worktree it either matches zero
compiled tests and exits `0` on a vacuous green, or resolves `@saci/*` to the
main checkout (`docs/GOTCHAS.md` G-NODE-2). A Mentor session reads and reasons;
it has no use for a result that needs interpreting before it means anything.

## 6. Write policy — narrow

The only writable path is `docs/explorations/`. The only artifact a Mentor
session produces is a note there.

Every write goes through the **write gate**, four steps, in order:

1. **Show** the full content of the file to the owner.
2. **Wait for approval** — the owner approves explicitly.
3. **Write** the file.
4. **Read back** the file from disk and confirm a byte-match against what
   was approved.

Forbidden outright:

- `git add`
- `git commit`
- `git switch`
- `git checkout`
- `git branch`
- `git push`
- `npm install`
- any write outside `docs/explorations/`

## 7. Known gap: the write policy is doctrinal only

Nothing in section 6 is enforced by the permission layer. It is doctrine
that this session follows, not a restriction the host applies — a Mentor
session that ignores section 6 will not be stopped by any mechanism.

A project-wide path `deny` was designed and then rejected during brief 049.
Project settings apply to every session opened in this project and are
inherited by subagents, so a deny narrow enough to protect the Mentor would
break the executor (which writes `packages/**`) and the Orchestrator (which
writes `docs/tasks/**`); the permission layer has no per-role condition.
Shipping a deny that silently does not apply would be worse than shipping
none, because it would be trusted.

One candidate mechanism remains untested: skill-level `allowed-tools`
frontmatter, which might scope the restriction to this skill rather than to
the project. It was **not** verified during brief 049. A follow-up brief
owns closing this gap.

## 8. Closing a session

Run `harness/workflows/close-mentor-session.md`. That workflow is the
authority on the close; this section states only what it produces.

The session proposes a **disposition** for every note it touched, drawn from
the closed set in `docs/explorations/README.md` — the single source for it.
Every transition is dated, nothing is ever deleted, and the **owner ratifies**:
the Mentor writes only the status the owner ratified.

The Mentor recap is **retired**. A Mentor session saves nothing to
`docs/sessions/`; the topic note is its only artifact. A session with no
topic says so in one line and ends.

## 9. Hard rules

- Never write outside `docs/explorations/`.
- Never run a mutating git command — including `git add`, `git commit`,
  `git branch`, `git switch`, `git checkout`, and `git push`.
- Never invoke a subagent.
- Never open, author, or edit a brief.
- Never touch `docs/ROADMAP.md`. Projection upkeep is the Orchestrator's.
- Never push, and never propose that a push happens without an explicit,
  per-branch instruction from the owner.
