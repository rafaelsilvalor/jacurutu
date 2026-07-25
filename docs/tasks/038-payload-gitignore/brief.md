# Brief: 038 — Ignore the `saci fetch` root artifact `payload.json`

> **Category:** M
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `chore/payload-gitignore`

---

## Context

`saci fetch` writes its output artifact `payload.json` to the repo root. The
file is untracked and shows up as noise in `git status` at every pause of an
execution session. Rule-of-three reached: observed in the 036 run and in every
Pause of the 037 run (see
`docs/sessions/2026-07-23-mentor-037-evidence-close-protocol.md`, queue
item 3). This is a pipeline-run hygiene task (pilot exercise).

Slot 038 resolved via the P4 three-source check, performed and confirmed by
the owner:

1. `ls docs/tasks/` tops at `037-evidence-close-protocol` (gaps 004-006 and
   034 are preserved burns).
2. `git log --oneline main` tops at `7d71ced` (PR #92, the 037 recaps).
3. `CLAUDE.md` exceptions E1–E5 hold no forward slot reserves.

All three sources agree; slot resolution is closed — do not re-open it.

## Goal

Stop the `saci fetch` output artifact `payload.json` (repo root) from
appearing as untracked noise in `git status`, by ignoring it via `.gitignore`.

Out of scope:

- Missing-env error DX (2nd occurrence only, rule-of-three not reached —
  stays out per the 037 recap queue).
- `automation/payload.json` — it stays tracked and untouched; it is the
  Python seed payload contract.
- Any other hygiene-queue item.
- No `git rm --cached` anywhere — the root artifact is untracked.

## Constraints

### Non-negotiable constraints

1. Only `.gitignore` (repo root) may be modified. The brief itself
   (`docs/tasks/038-payload-gitignore/brief.md`) is already committed. If
   anything else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md` (especially R10, R16, R17).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - Branch: `chore/payload-gitignore` (already created at `main@7d71ced`;
     do not create another branch)
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
4. The ignore pattern MUST be root-anchored: `/payload.json`, NOT the
   unanchored `payload.json`. See D1.

### Conventions

- English-only content in `.gitignore` and all task artifacts (R9).
- Commit type `chore`, no scope, per the commit sequence below.

### Architectural decisions already made (do not revisit)

#### D1 — Root-anchored pattern `/payload.json`

`automation/payload.json` is a TRACKED file (the Python seed payload
contract) and must not be reported ignorable by `git check-ignore`. An
unanchored `payload.json` pattern would also silently cover future test
fixtures. Root-anchoring scopes the rule to the single fetch artifact.

#### D2 — Append at end of the flat list

`.gitignore` is currently 7 lines, a flat list with no section headers.
Append `/payload.json` as line 8, at the end, keeping the trailing newline.
Do not introduce section headers or reorder existing lines.

#### D3 — Commit verb `add`

Subject is exactly `chore: add payload.json to .gitignore`. The verb `add`
is the canonical allowlist substitution for `ignore` (rejected verb) per
`.claude/skills/pre-commit-self-audit/SKILL.md` Check 3.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The planner pre-saved this brief to
`docs/tasks/038-payload-gitignore/brief.md` and committed it as commit #1
(subject `docs(tasks): add brief for 038-payload-gitignore`). The executor
verifies presence.

- [ ] Directory `docs/tasks/038-payload-gitignore/` exists
- [ ] File `docs/tasks/038-payload-gitignore/brief.md` exists; first line
      matches the title above
- [ ] Commit #1 with subject `docs(tasks): add brief for
      038-payload-gitignore` is already on the branch

If the file is missing or the first line does not match, **STOP and
report**. Do not regenerate the brief from memory.

### Edit 2 — Append `/payload.json` to `.gitignore`

Append exactly one line, `/payload.json`, at the end of `.gitignore`,
preserving the trailing newline. No other line changes.

Verification (run from the repo root; `git check-ignore <path>` evaluates
ignore rules for the pathname whether or not the file exists in this
worktree — no extra flags needed):

- [ ] `wc -l .gitignore` reports 8 lines
- [ ] Last line of `.gitignore` is exactly `/payload.json`
- [ ] `git check-ignore -v payload.json` reports the `/payload.json` rule
- [ ] `git check-ignore automation/payload.json` exits 1 (not ignored)
- [ ] `git ls-files automation/payload.json` still returns the file
- [ ] `git diff --stat` shows only `.gitignore` changed (+1 line)

Commit: `chore: add payload.json to .gitignore` — body explains why: fetch
artifact noise, rule-of-three (036 run + every Pause of the 037 run),
root-anchored to protect the tracked seed contract
`automation/payload.json`.

### Structural checks

- [ ] `git diff --name-only main..HEAD` lists only
      `docs/tasks/038-payload-gitignore/brief.md` and `.gitignore`

### Git checks

- [ ] Branch used: `chore/payload-gitignore`
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 1 skipped (`Plan required: no`)
- [ ] Pause 2 — modified `.gitignore` shown for review before proceeding
      (always required)
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed commit message
      + `pre-commit-self-audit` output shown before the commit
      (always required)
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

- **Pause 1:** skipped — `Plan required: no`.
- **Pause 2:** required — after editing `.gitignore`, show the result and
  wait for review.
- **Pause 3:** required — before the commit, show `git status`,
  `git diff --stat`, the proposed message, and the `pre-commit-self-audit`
  output.

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md`
  as a follow-up brief.

**DO NOT proceed "fixing" things without permission.**

## Git workflow

### Branch

`chore/payload-gitignore`, created at `main@7d71ced`. Already checked out;
do not create another branch. Do not push.

### Commit sequence

1. `docs(tasks): add brief for 038-payload-gitignore` (planner, done)
2. `chore: add payload.json to .gitignore` (executor)

Both subjects verified ≤ 72 chars (R10).

## Plan required justification

- The single change is specified above with the exact line to append and
  verification checkboxes.
- All decisions are closed (D1–D3) in the Constraints section.
- Judgment calls have explicit STOP-and-report fallbacks.

**Pause 2 and Pause 3 remain required** — Lesson #6 of
`docs/AGENT_PLAYBOOK.md`.

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
4. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit skill (Pause 3)
5. `docs/sessions/2026-07-23-mentor-037-evidence-close-protocol.md` — queue
   item 3 (origin of this task)

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat main...HEAD` (line counts per file)
3. Any verification checkbox from this brief that could not be met, with
   explanation
4. Confirmation that no `git push` was executed
5. Suggested next step (open PR)
