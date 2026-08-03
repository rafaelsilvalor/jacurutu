# Session recap — 2026-08-03 — Mentor lane and task identity (Mentor)

**Mode:** exploring possibilities, closing into a decision set. Hybrid
session: the thinking is Mentor-lane, but the transport (branch, commit,
push, PR) was run in-session because the artifact is the Mentor's own
note and no Orchestrator session was open to carry it.
**Consumes:** `docs/sessions/2026-08-03-mentor-desktop-ui-host.md`
(PR #112 at `main@a6ee33c`, confirmed via `git log` this session) and the
parked multi-contributor naming package of brief 039.
**Produces:** `docs/explorations/mentor-lane-and-task-identity.md`
(PR #113, merged at `main@13e63d7`), corrected in this session's PR.

## One-line summary

Two questions — bringing the Mentor role into Claude Code, and replacing
the sequence-number identifier — were modeled to closure as 15 plus 9
decisions and a three-brief plan, with the second question turning out to
be downstream of the first.

## Decisions

They live in the note, sections 2 and 3. Not restated here: the note is
the record, this recap is the session log.

## Deviations and findings

1. **Hybrid role.** A Mentor session does not create branches, commit,
   push, or open PRs (M-R6, M-R11). This one did, for its own artifact.
   Under current doctrine that is a deviation; under D2 plus D3 of the
   note it becomes the defined shape. Recorded as evidence for Brief A,
   not as precedent.
2. **G-NODE-2 fired.** The worktree build resolved `@saci/*` to the main
   checkout and failed on symbols that exist. The documented workaround
   (`npm install` at the worktree root) cleared it; tracked-file guard
   passed. Boundary after the fix: 305 tests, 304 pass, 0 fail.
3. **Contract tension shipped knowingly.** The note carries ratified
   decisions while `explorations/README.md` still says notes hold
   possibilities, not decisions. Stated inside the note; resolved by D15.
4. **A stale claim shipped and was corrected in-session.** The note's E8
   cited 047 as alive on an unmerged branch. It merged as PR #110 on
   2026-08-03; no such branch exists. The claim was inherited from the
   desktop-ui-host recap, written in chat without `git` access, and was
   not checked against the repo before shipping. This is precisely the
   failure class Brief A targets, produced by the artifact arguing for
   it. Corrected in this session's PR; E9's dual-acceptance window is
   empty as a consequence.

> **Lesson candidate:** an inherited claim is not evidence. A session
> with disk access verifies every load-bearing fact it repeats from a
> recap, regardless of how recent the recap is.

## Queue

1. **Brief A** — Mentor doctrine in Claude Code. Next task, caminho B.
2. **Brief B** — migrate the 22 ROADMAP entries into notes. Depends on A.
3. **Brief C** — identifier cutover at 049. Depends on A.
4. Next free slot is **049**; 047 and 048 are both merged and there are
   no open PRs.
5. Parked: the multi-contributor naming package is partly superseded —
   clauses 1 and 3 are absorbed by the E-set; clause 2 (dev token) stays
   parked per E6. Also parked: manifest `variation` field (042 D4);
   Jira-born manual overrides; `jira_updated_at` nullability.
6. Horizon: `ship` command, `@saci/*` to `@breu/*` rename, `saci config`.

## Next concrete action

An Orchestrator session models Brief A, reading the note from disk. This
session's PR must be merged first, and the next session confirms its SHA
via `git log` before consuming it.

## Paste-ready snippet for the next session

```
Continuando o projeto Saci em sessao Orchestrator (modelo fundido,
docs/AGENT_PLAYBOOK.md capitulo 6).
Modo desta sessao: modelar tarefa — caminho B (brief doutrinario;
Orchestrator autora, planner NAO e invocado).
Le do disco: CLAUDE.md, docs/MENTOR_BRIEF.md, docs/AGENT_PLAYBOOK.md,
docs/GIT_WORKFLOW.md e docs/explorations/mentor-lane-and-task-identity.md
(fonte primaria: D-set de 15, E-set de 9, plano de tres briefs).
TEMA DESTA SESSAO: Brief A — doutrina do Mentor dentro do Claude Code.
[CONFIRMAR via git log: merge do PR de fecho da sessao 2026-08-03.]
```
