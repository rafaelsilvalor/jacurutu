# Brief: 018 — Pipeline authoring-gate

> **Category:** L
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/pipeline-authoring-gate`
>
> The user pre-saved this brief to `docs/tasks/018-pipeline-authoring-gate/brief.md`
> before invoking the executor (caminho B). The executor verifies presence and
> commits it as commit #1.

---

## Context

The planner → brief-validator → executor pipeline reliably applies mechanical
text edits but skips the judgment and cross-tool steps at authoring time. This
surfaced concretely in briefs 016 and 017: the planner asserted a brief number
without recording P4 evidence, prescribed a commit verb outside the allowlist
(`reposition`), and doubled down on a questionable parking-lot mapping instead
of inserting a protective guard.

The fix is not "tell the planner to use better judgment" — it already cannot.
It is to convert those judgment-laden steps into mechanical ones the planner
executes deterministically, and to make the validator a true gate on the verb
allowlist rather than a partial one.

## Goal

1. `.claude/agents/planner.md`: at authoring time, grep the verb allowlist SSOT
   for every prescribed commit subject; record the P4 three-source evidence in
   the brief; and convert each mentor-supplied `## Judgment flags` entry into a
   STOP-and-confirm guard rather than a stronger assertion.
2. `.claude/agents/brief-validator.md`: add check C11 that greps the prescribed
   commit-subject verbs against the same allowlist SSOT; FAIL on any verb
   outside it.
3. `harness/workflows/close-task.md`: formalize the reusable post-merge cleanup
   steps proven in session 017.

Out of scope:

- EARS adoption — deferred to the first Phase 2 code brief.
- `executor.md` STOP-guard calibration — still an observation, not a decision.
- Mentor-side documentation of the `## Judgment flags` block in
  `MENTOR_BRIEF.md` / `AGENT_PLAYBOOK.md` — deferred follow-up. The planner-side
  input contract installed by this brief is sufficient for the pipeline to
  function.
- Any change to `.claude/skills/brief-template/SKILL.md` or
  `.claude/skills/pre-commit-self-audit/SKILL.md`. The allowlist SSOT is **read**,
  never modified.
- Any application code; v2 has no domain code yet, v1 is in freeze.
- Any `git push` (`CLAUDE.md` R17 / `GIT_WORKFLOW.md` G-R5).

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified by this brief:
   - `docs/tasks/018-pipeline-authoring-gate/brief.md` (this file)
   - `.claude/agents/planner.md`
   - `.claude/agents/brief-validator.md`
   - `harness/workflows/close-task.md`

   If anything else needs changing, **STOP and ask**.

2. Follow all rules in `CLAUDE.md`, with particular attention to:
   - **R9** — agent-consumed surface is English-only. `.claude/agents/**` is
     English. `harness/workflows/close-task.md` is human-edited interface:
     pt-BR prose is acceptable, but any command block or `--- COPIAR ---`
     payload stays English.
   - **R10** — Conventional Commits, subject ≤ 72 chars, imperative.
   - **R13** — never bypass the pre-commit hook with `--no-verify`.
   - **R17** — never `git push` without explicit user instruction.

3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `docs/pipeline-authoring-gate`
   - Conventional Commits (G-R3); subject ≤ 72 chars verified before each
     commit (`pre-commit-self-audit` Check 1).
   - No `Co-authored-by` trailer (G-R3 / G-A7).
   - Commit freely; **DO NOT push** (G-R5).

4. **`/create-pr` automation, if invoked, is commit-only stop-and-report.**
   The authoring/executing agent must not push under automation. A verbal user
   instruction at the end of the session is the only way to authorize push.

5. **P4 numbering verification before commit #1.** The number 018 is the
   mentor's assertion under a stale project-knowledge snapshot. Before
   committing, confirm slot 018 is free using all three sources: `ls docs/tasks/`,
   `git log --oneline main` (merged PRs), and reserves in `CLAUDE.md` E* entries.
   If 018 is taken, **STOP and report** — do not renumber unilaterally.

6. **No STATE.md.** Category L, but single-session execution is expected; per
   `docs/GIT_WORKFLOW.md` G-R10 the STATE.md requirement is conditional on
   multi-session or structural complexity, neither of which applies. Skip
   unless the user explicitly requests it.

### Conventions

- All `.claude/agents/**` content in English (R9).
- Commit type for all changes: `docs`. Scopes: `tasks` (brief artifact),
  `agents` (planner / validator), `workflows` (close-task).
- No `Co-authored-by` trailers.

### Architectural decisions already made (do not revisit)

Closed in the mentor session (chat, 2026-05-31). Executor implements; does not
propose alternatives.

#### D1 — Allowlist SSOT is read, not duplicated

Both the new planner step and the new validator check grep
`.claude/skills/pre-commit-self-audit/SKILL.md` at runtime. Neither hardcodes
the verb list. Rationale: one source of truth; the allowlist already moved
(14 → 19 verbs) once, and a second copy would drift.

#### D2 — The mentor flags judgment via a `## Judgment flags` block

The delegation the mentor hands the planner may include a `## Judgment flags`
section. Each entry has three fields:

- **Location** — the Edit (or spot within an Edit) the flag applies to.
- **Risk** — one line naming what goes wrong if the spot is treated mechanically.
- **Action** — the literal guard to install at that location.

The planner converts each entry into a STOP-and-confirm guard at the named
location. The planner does **not** evaluate whether a flag "deserves" a guard
and does **not** substitute a stronger assertion. Absence of the block means no
judgment guards are required. This promotes the one-off fix that saved brief
017 (its Edit 2e became a STOP-and-confirm guard) into a standing convention.

#### D3 — Validator C11 is FAIL-eligible

A commit verb outside the allowlist hard-STOPs at the executor's
`pre-commit-self-audit` regardless, so catching it at validation is strictly
better than letting it through. WARN would defer the failure to execution.

#### D4 — close-task.md cleanup is mechanical only

Two steps proven in session 017: forced-delete of the squash-merged orphan
branch (`git branch -D`), and a reminder to re-upload canonical docs to the
claude.ai project knowledge. No design decisions, no new policy — just
formalizing a snippet.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The user pre-saved this brief to `docs/tasks/018-pipeline-authoring-gate/brief.md`
before invoking the executor (caminho B). The executor verifies presence and
commits.

- [ ] Directory `docs/tasks/018-pipeline-authoring-gate/` exists
- [ ] File `docs/tasks/018-pipeline-authoring-gate/brief.md` exists; first line
      is `# Brief: 018 — Pipeline authoring-gate`
- [ ] `git add docs/tasks/018-pipeline-authoring-gate/brief.md` is staged
- [ ] Commit #1 created with subject
      `docs(tasks): add brief for 018-pipeline-authoring-gate`

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

Run `pre-commit-self-audit` at Pause 3 with
`SUBJECT="docs(tasks): add brief for 018-pipeline-authoring-gate"` and
`EDIT_SCOPE="docs/tasks/018-pipeline-authoring-gate/brief.md"`; report all
checks in chat.

---

### Edit 2 — `.claude/agents/planner.md`: authoring-gate behavior

Three additions, one commit.

**Anchor pre-check (this brief's own application of D2).** The planner body is
expected to contain the sections "Role", "Inputs", "Procedure" (numbered steps),
"STOP conditions", and "Hard rules". Before editing, confirm these anchors
exist. **If any anchor named below is absent or materially different from the
description, STOP and report — do not improvise placement.**

#### 2a. "Inputs" — recognize the `## Judgment flags` block

In the "Inputs" section, add the following subsection at its end:

```markdown
### Judgment flags (optional delegation input)

The delegation may include a `## Judgment flags` block. Each entry has three
fields:

- **Location** — the Edit (or spot within an Edit) the flag applies to.
- **Risk** — one line naming what goes wrong if the spot is treated mechanically.
- **Action** — the literal guard to install at that location.

For every entry, install a STOP-and-confirm guard at the named location in the
brief you author. Do not evaluate whether a flag "deserves" a guard; do not
replace it with a stronger assertion. If the block is absent, no judgment
guards are required.
```

#### 2b. Add an "Authoring gate" subsection immediately after the "Procedure" section (before "STOP conditions")

```markdown
## Authoring gate

Run this gate before writing the brief's commit subjects and before any commit.

1. **Verb allowlist.** For every commit subject you intend to prescribe,
   extract the leading verb — the first word after `type(scope): `. Grep it
   against the allowlist in `.claude/skills/pre-commit-self-audit/SKILL.md`
   (the SSOT — read it at runtime; do not hardcode the list). If a verb is
   absent, substitute a documented allowlisted verb. If no clear substitute
   exists, STOP and report.
2. **P4 evidence.** Record the three-source numbering check in the brief (in
   the P4 constraint or Edit 1): the relevant lines of `ls docs/tasks/`, the
   relevant `git log --oneline main` entry, and the `CLAUDE.md` E* reserve
   check. Do not assert the number without the recorded evidence.
3. **Judgment flags.** Convert each `## Judgment flags` entry from the
   delegation into a STOP-and-confirm guard at its named location (see Inputs).
```

#### 2c. "STOP conditions" — add two entries to the existing list

```markdown
- A prescribed commit verb is absent from the allowlist SSOT and no clear
  allowlisted substitute exists.
- A `## Judgment flags` entry references a brief location that does not exist
  in the planned edits.
```

#### Verification

- [ ] "Inputs" section ends with the new `### Judgment flags` subsection,
      byte-matching 2a
- [ ] A new `## Authoring gate` section sits between "Procedure" and "STOP
      conditions", byte-matching 2b
- [ ] "STOP conditions" list contains the two new entries from 2c
- [ ] File contains no pt-BR text (R9)
- [ ] No existing Procedure step was renumbered or modified
- [ ] Pause 2 fires after this file is saved, before opening
      `brief-validator.md`

Commit: `docs(agents): add authoring-gate steps to planner`

Run `pre-commit-self-audit` at Pause 3 with
`SUBJECT="docs(agents): add authoring-gate steps to planner"` and
`EDIT_SCOPE=".claude/agents/planner.md"`.

---

### Edit 3 — `.claude/agents/brief-validator.md`: add check C11

**Pre-check (D2 guard).** The validator is expected to emit checks C1–C10. If a
check already greps the verb allowlist (the gap may have been closed since this
brief was authored), **STOP and report — do not add a duplicate C11.**

#### 3a. Checks table — add the C11 row at the end of the table

```markdown
| C11 | Extract commit-subject verbs as in C7/C8 (first word after `type(scope): `); grep each against the verb allowlist in `.claude/skills/pre-commit-self-audit/SKILL.md`. FAIL if any verb is absent from the allowlist | `.claude/skills/pre-commit-self-audit/SKILL.md` (allowlist SSOT); `CLAUDE.md` R10 |
```

#### 3b. Output format — add the C11 line under "## Checks", after the C10 line

```
C11 — Commit verb allowlist: <PASS | WARN | FAIL>
```

#### 3c. Reconcile any check-count reference

Run `grep -niE 'ten checks|10 checks|C1[^0-9].{0,6}C10' .claude/agents/brief-validator.md`.
If a reference to the number of checks is found (e.g. "ten mechanical checks"),
update it to eleven / C1–C11. If the grep returns an ambiguous or unexpected
match, **STOP and report** rather than editing blindly.

The verdict rules need no change: C11 is FAIL-eligible and the existing rule
("REJECTED if any check is FAIL") already covers it.

#### Verification

- [ ] Checks table has a C11 row byte-matching 3a
- [ ] "## Checks" output block lists C11 after C10, byte-matching 3b
- [ ] Any check-count reference reads eleven / C1–C11 (or sweep confirmed none
      existed)
- [ ] No existing check (C1–C10) was modified
- [ ] File contains no pt-BR text (R9)

Commit: `docs(agents): add verb-allowlist check to validator`

Run `pre-commit-self-audit` at Pause 3 with
`SUBJECT="docs(agents): add verb-allowlist check to validator"` and
`EDIT_SCOPE=".claude/agents/brief-validator.md"`.

---

### Edit 4 — `harness/workflows/close-task.md`: post-merge cleanup

**Pre-check (D2 guard).** If `close-task.md` already contains a post-merge
cleanup / "limpeza pós-merge" section, **STOP and report** — reconcile instead
of duplicating.

Add the following section. Place it where the file already documents post-merge
or closing steps; if no such anchor exists, append it at the end. Prose is
pt-BR (human-edited interface, R9); command blocks stay English.

```markdown
## Limpeza pós-merge

Após o squash-merge do PR via GitHub UI:

1. **Delete a branch órfã local.** Squash-merge sempre orfaniza a branch local
   (o conteúdo entrou em `main` sob outro hash). Forced delete é sempre correto:

   ```bash
   git checkout main
   git pull
   git branch -D <branch>
   ```

2. **Re-upload dos docs canônicos no project knowledge do claude.ai.** O sync é
   manual. Re-suba os arquivos que o PR alterou (ex.: `CLAUDE.md`,
   `docs/MENTOR_BRIEF.md`, `docs/ROADMAP.md`, agentes ou skills tocados) mais o
   recap da sessão. Bloqueia a próxima sessão de chat de ler as versões frescas.
```

#### Verification

- [ ] `close-task.md` contains the `## Limpeza pós-merge` section byte-matching
      the block above
- [ ] The two command blocks are English; surrounding prose is pt-BR
- [ ] No other section of the file was modified

Commit: `docs(workflows): add post-merge cleanup to close-task`

Run `pre-commit-self-audit` at Pause 3 with
`SUBJECT="docs(workflows): add post-merge cleanup to close-task"` and
`EDIT_SCOPE="harness/workflows/close-task.md"`.

---

## Commit sequence

1. `docs(tasks): add brief for 018-pipeline-authoring-gate`
2. `docs(agents): add authoring-gate steps to planner`
3. `docs(agents): add verb-allowlist check to validator`
4. `docs(workflows): add post-merge cleanup to close-task`

All four subjects use the verb `add` (canonical in the allowlist) and are
≤ 72 chars.

## Plan required justification

- Every change is specified with exact text snippets and exact anchor
  descriptions.
- All architectural decisions are closed (D1–D4).
- The judgment calls (stale anchors, a possibly pre-existing C11, ambiguous
  verb substitution, an existing cleanup section) all have explicit
  STOP-and-report fallbacks — this brief applies its own D2.

**Pause 2** (after `planner.md`, the first modified file) and **Pause 3**
(before each commit) remain mandatory regardless of `Plan required: no`
(`docs/AGENT_PLAYBOOK.md` Lesson #6).

## Reference documents (read before starting)

1. `CLAUDE.md` — all technical rules (R9, R10, R13, R17)
2. `docs/GIT_WORKFLOW.md` — branching, commits, G-R10
3. `.claude/skills/pre-commit-self-audit/SKILL.md` — verb allowlist SSOT (read only)
4. `.claude/skills/brief-template/SKILL.md` — authoring conventions
5. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (ordered commit list)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Any verification checkbox that could not be met, with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step (open PR, follow-up brief, etc.)
