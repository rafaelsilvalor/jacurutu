---
name: brief-template
description: Authoring template for task briefs in docs/tasks/<NNN>-<slug>/brief.md. Invoke when modeling a new Category M or L task that needs a brief written to disk.
---

# Skill: brief-template

## When to invoke

When the user (or a planner agent) is modeling a new task of Category M or L
that requires a structured brief to be written to
`docs/tasks/<NNN>-<slug>/brief.md`. Do not invoke for Category S tasks
(one-line chat is enough) or Category XL tasks (break into L tasks first).

## What this skill provides

The canonical template for `docs/tasks/<NNN>-<slug>/brief.md`. Includes:

- The 4-part structure: Context, Goal, Constraints, Done criteria.
- The `Plan required: yes | no` flag and when to skip Pause 1.
- The Pause-point conventions (Pause 1 conditional, Pause 2 and 3 always).
- Filled-out examples of Decision blocks and Done criteria checks (illustrative,
  not for verbatim reuse).

## Brief lifecycle (caminho B)

Briefs are pre-saved to disk by the user before the executor is invoked. The
executor reads from disk; the invocation prompt does not carry the brief text.

- **In-flight brief**: a brief in an open PR, not yet merged. Mutable; revisions
  via amend or new commits on the brief's branch are normal.
- **Historical brief**: a merged brief on `main`. Immutable record of what was
  modeled and executed. Errata applies as separate notes or future briefs, not
  retroactive edits.

When a brief operates against other briefs' artifacts (sweeps, renames,
references), it MUST distinguish in writing between in-flight and historical
briefs. In-flight briefs may be modified by the same PR; historical briefs are
preserved verbatim.

## Template

```markdown
# Brief: [NNN] — [Short task title]

> **Category:** [M | L]
> **Plan required:** [yes | no] — see "Plan required justification" below
> **Branch:** `[type]/[kebab-description]`

---

## Context

[2-4 sentences. Where this fits in the project. Why it exists. Relevant current
state. If already clear from the filename or task name, omit — do not pad.]

## Goal

[1-2 imperative sentences. What must be different at the end. Not how, just what.]

Out of scope:

- [Behavior that must NOT change]
- [Adjacent cleanup deferred to a future brief]
- [Files that are explicitly off-limits]

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified: [list]. If anything
   else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md` (especially [R-X], [R-Y]).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `[type]/[kebab-description]`
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
   - [STATE.md decision for L tasks]
4. [Other constraint specific to this task]

### Conventions

- [Language convention per R9]
- [Commit type, scope conventions]
- [Other project-specific conventions]

### Architectural decisions already made (do not revisit)

[Closed during the design session with the mentor. Executor implements;
does not propose alternatives. Omit this section if no decisions were
pre-closed — the agent then proposes a plan at Pause 1.]

#### D1 — [Decision title]

[Specific detail. Why this decision was made if useful.]

#### D2 — [Decision title]

[Specific detail.]

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The user pre-saved this brief to `docs/tasks/<NNN>-<slug>/brief.md` before
invoking the executor (caminho B). The executor verifies presence and commits.

- [ ] Directory `docs/tasks/<NNN>-<slug>/` exists
- [ ] File `docs/tasks/<NNN>-<slug>/brief.md` exists; first line matches the
      title above
- [ ] `git add docs/tasks/<NNN>-<slug>/brief.md` is staged
- [ ] Commit #1 created with subject `docs(tasks): add brief for <NNN>-<slug>`

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

### Edit 2 — [Title]

[Specification of the change — exact text, exact paths, exact insertion points.]

Verification:

- [ ] [Structural check — verifiable via grep, wc, ls]
- [ ] [Content check — exact match to specified text]
- [ ] [No-side-effects check — sweep negative]

Commit: `[type](<scope>): <imperative subject>`

### Edit 3 — [Title]

[As Edit 2.]

### Automated checks (run before each commit)

- [ ] Build passes without errors (if applicable to this task)
- [ ] Linter passes without warnings (if applicable)
- [ ] Tests pass (if applicable)

### Structural checks

- [ ] Expected files exist at expected paths
- [ ] Expected files have expected first line / shape
- [ ] No file outside the in-scope list was modified
      (verify via `git diff --name-only origin/main..HEAD`)

### Behavior checks

- [ ] [Specific testable behavior]
- [ ] [Specific edge case]

### Git checks

- [ ] Branch used: `[type]/[description]`
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed
- [ ] [STATE.md updated to `completed` or removed, if applicable]

### Process checks

- [ ] If `Plan required: yes` — numbered plan was presented and approved
      before any change (Pause 1)
- [ ] Pause 2 — first modified file shown for review before proceeding
      (always required)
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed commit message
      shown before each commit (always required)
- [ ] `pre-commit-self-audit` skill output reported in chat before each
      Pause 3 submission
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

Pauses are named in English ("Pause 1", "Pause 2", "Pause 3") on the
agent-consumed surface (R9). The pt-BR form "Pausa" appears only in
`harness/` human-edited prose (M-R10 / `CLAUDE.md` R9 — human-edited
interface allowance). When a brief uses pt-BR "Pausa", validator C9 emits
FAIL.

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code):** present a numbered plan and wait for
  approval. **Required if `Plan required: yes`; skipped if
  `Plan required: no`** (see "Plan required justification" below).
- **Pause 2 (after the first modified file):** show the result and wait
  for review. **Always required.**
- **Pause 3 (before each commit):** show `git status` + `git diff --stat`
  + proposed message + `pre-commit-self-audit` output.
  **Always required.**

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in
  `docs/GOTCHAS.md` as a follow-up brief.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

[If `Plan required: no`, justify here in 2-4 bullets. Typical justifications:
- "Every change is specified above with exact text snippets and verification
  checkboxes."
- "All architectural decisions are closed (D1–Dn) in the Constraints section."
- "The judgment calls have explicit fallbacks (STOP-and-report)."

**Pause 2 and Pause 3 remain required** regardless of `Plan required`
— Lesson #6 of `docs/AGENT_PLAYBOOK.md`.]

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — known traps
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
5. `.claude/skills/brief-template/SKILL.md` — this skill (template reference)
6. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit skill (Pause 3)
7. [Other specific relevant files]

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Any verification checkbox from this brief that could not be met,
   with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step (open PR, follow-up brief, etc.)
```

## Authoring principles

- **Constraints over solutions.** Brief lists what must hold; agent proposes
  how. Exception: when all decisions are closed (`Plan required: no`), brief
  specifies exact text snippets and the agent executes.
- **Out of scope is half the brief.** List explicitly what NOT to touch.
  Adjacent cleanups are separate briefs.
- **Verifiable Done criteria.** Each checkbox must be checkable by eye or by
  a command. If you cannot write a checkbox you can verify, the brief is not
  ready.
- **Architectural decisions are listed and named (D1, D2, ...).** Agent does
  not revisit them. If a decision needs to change mid-execution, agent stops
  and reports.

### Edit blocks numbering

Each Edit in the "Done criteria" section uses the heading form:

`### Edit N — <description>`

Where:
- `N` is a positive integer starting at 1.
- `<description>` is a short imperative phrase summarizing the change
  (e.g. "Create `.claude/agents/planner.md`").
- The em-dash (`—`, U+2014) separates `N` from `<description>`, with one
  space on each side.

Edit numbers are sequential and contiguous within a brief. Sub-edits within
one Edit use lettered subsections (e.g. `#### 2a.`, `#### 2b.`); they share
the parent Edit's commit unless the brief explicitly splits them.

### Commit sequence heading

Briefs with multiple commits list the planned commits under a single heading:

`### Commit sequence`

The heading appears once per brief, typically near the end of "Done criteria"
or in a dedicated section. The list is numbered, each item carries the exact
Conventional Commits subject the executor will use, and each subject is
verified ≤ 72 chars per `CLAUDE.md` R10.

Per-Edit `Commit:` annotations inside Edit blocks remain valid; the
`### Commit sequence` heading provides the consolidated view the validator
audits in one pass.

## Size guidance

The ranges below measure **task substance**: the lines a brief adds beyond
the template's fixed scaffolding. Scaffolding means the sections a brief
carries near-verbatim from this template — the "Edit 1 — Verify brief on
disk" block, the Automated/Structural/Git/Process checks, "Pause points",
"Plan required justification", "Reference documents (read before starting)",
and "Expected output (end of session)". Together these amount to a
**scaffolding allowance of ~100 lines** on top of the substance range.
Behavior checks and the Commit sequence are substance, not scaffolding.

Ranges are indexed on **brief class**, not on task category alone. A doctrinal
brief is structurally longer than a delegated one at the same task size: it
specifies verbatim prose for the files it creates and carries owner-closed
decision blocks with their rationale. A delegation prompt produces neither.

| Brief class | Substance | Total, with scaffolding |
|---|---|---|
| Category M | 80-250 | ~350 |
| Category L, planner-delegated | 200-400 | ~500 |
| Category L, doctrinal (caminho B) | 350-650 | ~750 |

Under 80 lines of substance the task is likely Category S — no brief needed;
a chat message is enough.

### Crossing the range is a trigger, not a violation

Above the range, a brief does one of two things and says which:

- **splits**, or
- **declares why it does not**, in a short size note in its Context section.

Neither is a failure state. The failure is silence — an oversized brief that
neither splits nor explains reads as an author who did not measure.

The number's job is to force the question, not to answer it. The question is
qualitative:

> Could these edits ship as two independent PRs, each closing on its own
> evidence?

If yes, split. If no, declare and continue. Two worked examples:

- **Brief 049 split**, into a vehicle brief and a doctrine brief. The vehicle
  — a skill, two workflows, and the deletions they replace — closes on its own
  evidence; the doctrine rewrites close on theirs.
- **Brief 048 did not split**, and was right not to. The agent file, its
  registration in the playbook and its line in `CLAUDE.md` are one another's
  verification; a sub-brief delivering the agent without its registration
  would close on incomplete evidence.

### Where these numbers come from

Measured across all 46 briefs in `docs/tasks/` on 2026-08-04. Median totals
ran 342 for Category M and 523 for Category L, against previous ceilings of
~250 and ~500 that 83% and 64% of briefs respectively exceeded. Within
Category L the split by class is decisive: planner-delegated briefs run a
median of 467 and fit the old range; caminho B briefs run 641 and never did.

These ranges track the observed medians, not an aspiration. Re-measure before
changing them again: the previous adjustment (the ~100-line scaffolding
allowance, PR #98) raised the effective ceiling without closing the gap.
