# Brief: 041 — Scaffolding allowance in brief-template size guidance

> **Category:** M
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/brief-size-allowance`

---

## Context

The rule-of-three ledger in the orchestrator 040 recap
(`docs/sessions/2026-07-25-orchestrator-040-open-in-software.md`) triggered
on brief size over guidance: briefs 038 (210 lines, Category M), 039
(485 lines, Category L), and 040 (242 lines, Category M) all exceeded the
size ranges in `.claude/skills/brief-template/SKILL.md` (M: 80-150,
L: 200-400), with the same cause each time — the template's fixed
scaffolding plus a pre-closed D-set. The fixed scaffolding measures ~100
lines; discounting it, all three briefs sit inside their ranges (038 →
~110, 039 → ~385, 040 → ~142). The ranges are therefore correct as
measures of task substance; the guidance lacks only an explicit
scaffolding allowance.

The brief-validator has no size check (the 040 overage was flagged at the
orchestrator gate), so this change is confined to the skill file.

## Goal

Rewrite the `## Size guidance` section of
`.claude/skills/brief-template/SKILL.md` so the ranges measure task
substance and grant an explicit ~100-line scaffolding allowance.

Out of scope:

- `.claude/agents/brief-validator.md` — no size check exists and none is
  added.
- `CLAUDE.md`, `docs/AGENT_PLAYBOOK.md`, and every other section of
  `SKILL.md` — byte-identical outside `## Size guidance`.
- Historical briefs 038-040 — no retroactive edits; their sizes are
  recorded here as calibration history.
- The template structure itself — the scaffolding sections stay as they
  are; only the size guidance changes.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   `docs/tasks/041-brief-size-allowance/brief.md`,
   `.claude/skills/brief-template/SKILL.md`. If anything else needs
   changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md` (especially R9 — English-only
   agent-consumed surface — and R10).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `docs/brief-size-allowance` from `main@e6a4b35`
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
4. Edit 2 uses the exact replacement text specified below — no rewording,
   no paraphrase. If the current-text anchor does not match the file on
   disk, **STOP and report**.
5. The pre-commit hook is not wired in this clone and this is a docs-only
   change with no build/test surface — automated checks are n/a.

### Conventions

- English-only content (R9); the skill is agent-consumed surface.
- Commit scopes: `tasks` for the brief commit, `skills` for the guidance
  commit.

### Architectural decisions already made (do not revisit)

#### D1 — Substance semantics with ~100-line allowance

The size ranges keep their numbers (M: 80-150, L: 200-400) but measure
**task substance** — lines beyond the template's fixed scaffolding. The
scaffolding allowance is ~100 lines; effective totals are ~250 (M) and
~500 (L). The XL-in-disguise threshold reads substance > 400 (~500
total); the Category S threshold reads substance < 80.

#### D2 — Scaffolding is a named list

Scaffolding = the "Edit 1 — Verify brief on disk" block, the
Automated/Structural/Git/Process checks, "Pause points", "Plan required
justification", "Reference documents (read before starting)", and
"Expected output (end of session)". Behavior checks and the Commit
sequence are task-specific and count as substance.

#### D3 — History lives in this brief, not in the skill

The 038/039/040 trigger data is recorded in this brief's Context. The
skill states the rule only — no calibration history inside `SKILL.md`.

#### D4 — Single-section replacement

Only `## Size guidance` (the last section of `SKILL.md`) is replaced.
The file is byte-identical above it.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The Orchestrator pre-saved this brief to
`docs/tasks/041-brief-size-allowance/brief.md` before invoking the
executor (caminho B). The executor verifies presence and commits.

- [ ] Directory `docs/tasks/041-brief-size-allowance/` exists
- [ ] File `brief.md` exists; first line matches the title above
- [ ] `git add docs/tasks/041-brief-size-allowance/brief.md` is staged
- [ ] Commit #1 created with subject
      `docs(tasks): add brief for 041-brief-size-allowance`

If the file is missing or the first line does not match, **STOP and
report**. Do not regenerate the brief from memory.

### Edit 2 — Replace `## Size guidance` in `brief-template/SKILL.md`

In `.claude/skills/brief-template/SKILL.md`, replace the entire current
section (the last 9 lines of the file):

```
## Size guidance

- **Category M task:** 80-150 lines of brief.
- **Category L task:** 200-400 lines of brief.

If the brief exceeds 400 lines, the task is likely XL in disguise — break it
into smaller briefs. If under 80 lines, the task is likely Category S — no
brief needed; a chat message is enough.
```

with exactly:

```
## Size guidance

The ranges below measure **task substance**: the lines a brief adds beyond
the template's fixed scaffolding. Scaffolding means the sections a brief
carries near-verbatim from this template — the "Edit 1 — Verify brief on
disk" block, the Automated/Structural/Git/Process checks, "Pause points",
"Plan required justification", "Reference documents (read before starting)",
and "Expected output (end of session)". Together these amount to a
**scaffolding allowance of ~100 lines** on top of the substance range.
Behavior checks and the Commit sequence are substance, not scaffolding.

- **Category M task:** 80-150 lines of substance (~250 total with full
  scaffolding).
- **Category L task:** 200-400 lines of substance (~500 total with full
  scaffolding).

If substance exceeds 400 lines (~500 total), the task is likely XL in
disguise — break it into smaller briefs. If substance is under 80 lines, the
task is likely Category S — no brief needed; a chat message is enough.
```

Verification:

- [ ] `grep -c "scaffolding allowance of ~100 lines"
      .claude/skills/brief-template/SKILL.md` → 1
- [ ] `grep -c "lines of substance" .claude/skills/brief-template/SKILL.md`
      → 2
- [ ] `grep -c "lines of brief." .claude/skills/brief-template/SKILL.md`
      → 0
- [ ] `wc -l .claude/skills/brief-template/SKILL.md` → 301 (was 291; the
      section grows from 9 to 19 lines)
- [ ] `git diff --stat` for this commit shows only
      `.claude/skills/brief-template/SKILL.md`

Commit: `docs(skills): add scaffolding allowance to brief size guidance`

### Commit sequence

1. `docs(tasks): add brief for 041-brief-size-allowance`
2. `docs(skills): add scaffolding allowance to brief size guidance`

Both subjects ≤ 72 chars.

### Automated checks (run before each commit)

- [ ] n/a — docs-only change; no build, linter, or test surface (see
      constraint 5).

### Structural checks

- [ ] `docs/tasks/041-brief-size-allowance/brief.md` exists
- [ ] `.claude/skills/brief-template/SKILL.md` has 301 lines
- [ ] No file outside the in-scope list was modified
      (verify via `git diff --name-only main..HEAD`)

### Behavior checks

- [ ] `SKILL.md` above `## Size guidance` is byte-identical to `main`
      (verify: `git diff main..HEAD --
      .claude/skills/brief-template/SKILL.md` shows a single hunk, located
      at the `## Size guidance` section)

### Git checks

- [ ] Branch used: `docs/brief-size-allowance`
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Plan required: no — Pause 1 skipped
- [ ] Pause 2 — first modified file shown for review before proceeding
      (always required)
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed commit message
      shown before each commit (always required)
- [ ] `pre-commit-self-audit` skill output reported in chat before each
      Pause 3 submission
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1:** skipped (`Plan required: no`).
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

- The single content change (Edit 2) is specified with an exact
  current-text anchor and exact replacement text — zero drafting latitude.
- All decisions are closed (D1-D4); the judgment calls have explicit
  STOP-and-report fallbacks (constraint 4).

**Pause 2 and Pause 3 remain required** regardless of `Plan required`
— Lesson #6 of `docs/AGENT_PLAYBOOK.md`.

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
4. `.claude/skills/brief-template/SKILL.md` — the target file
5. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit skill
   (Pause 3)

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat main...HEAD` (line counts per file)
3. Any verification checkbox from this brief that could not be met,
   with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step (push + PR on owner instruction)
