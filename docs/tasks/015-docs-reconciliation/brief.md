# Brief: 015 — Docs reconciliation (cluster closer)

> **Category:** L
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/orchestration-reconciliation`

---

## Context

Third and final brief of the orchestration cluster (013 → 014 → 015) designed in session `2026-05-22-mentor-013-orchestration-cluster-design.md` (D11). Brief 013 shipped the foundations layer (two skills); brief 014 shipped the agents layer (three subagents). This brief closes the cluster by reconciling the canonical documentation around the new pipeline: formalizing conventions left WARN-eligible in brief 014, redesigning `MENTOR_BRIEF.md` §8 modes, adding the pipeline chapter to `AGENT_PLAYBOOK.md`, wiring cross-references from canonical docs to the new agents and skills, absorbing `STATE.md` lifecycle into the executor agent, and deprecating two `harness/` artifacts that are now superseded.

Six frentes of work, sequenced so each Edit establishes anchors that the next can reference. After this brief merges, the cluster closes and Phase 1 monorepo bootstrap becomes the first task to use the new pipeline end-to-end.

This brief follows caminho B (briefs 009+): the user pre-saves the brief to disk; the executor verifies presence and commits as commit #1. The cluster decided (recap `2026-05-22-mentor-014-orchestration-agents.md`) that brief 015 itself uses caminho B and not the pipeline, for bootstrap reasons — the pipeline cannot model the brief that defines the pipeline's docs reconciliation.

## Goal

After this task:

- `.claude/skills/brief-template/SKILL.md` documents three conventions previously held informally: Edit blocks numbering (`### Edit N — <description>`), commit-sequence heading (`### Commit sequence` exact form), and Pause naming (English "Pause" on agent-consumed surface).
- `.claude/agents/brief-validator.md` tightens C6, C7, C9 from WARN-eligible to PASS/FAIL-only; the WARN state introduced in brief 014 (D11) is removed.
- `docs/AGENT_PLAYBOOK.md` has a new Chapter 6 documenting the orchestration pipeline: when to use the pipeline vs. caminho B, invocation patterns, verdict handling (APPROVED/REJECTED), when NOT to use the pipeline, and a troubleshooting table.
- `docs/MENTOR_BRIEF.md` §8 reduces session modes from 5 to 4 (removes "Modeling a new task"); a clarifying note explains the change; the embedded pt-BR chat-starter snippet is updated.
- `CLAUDE.md`, `docs/MENTOR_BRIEF.md` §7, `docs/GIT_WORKFLOW.md`, and `docs/AGENT_PLAYBOOK.md` (Related documents table) all cross-reference the three new agents and two new skills from briefs 013-014.
- `.claude/agents/executor.md` absorbs the STATE.md lifecycle previously documented in `harness/workflows/start-task.md` PASSO 4 (translated to English per R9).
- `harness/workflows/start-task.md` is deleted; its content lives in `.claude/agents/executor.md` (or in the pipeline-driven flow via planner agent).
- `harness/prompts/task-brief-template.md` is deleted along with `harness/prompts/README.md`; the `harness/prompts/` directory is removed entirely.
- `docs/tasks/015-docs-reconciliation/brief.md` exists, containing this brief verbatim.

Out of scope:

- Any change to the three agent files (`planner.md`, `brief-validator.md`, `executor.md`) beyond the targeted updates in Edits 2e (validator) and 6 (executor STATE.md lifecycle).
- Any change to the two skill files (`brief-template/SKILL.md`, `pre-commit-self-audit/SKILL.md`) beyond the targeted additions in Edit 2a-2d (brief-template conventions).
- Any errata or modification to brief 013, 014, or to historical briefs (009-014). Briefs in `main` are historical record (D13 of brief 013).
- Promotion of `harness/skills-plan/commit-discipline.md` or `task-pauses-protocol.md` from draft to active skill. Deferred per D8 of cluster session.
- Any change to other workflow files (`close-task.md`, `pause-task.md`, `resume-session.md`, `setup-code.md`, `setup-chat.md`, `setup-cowork.md`) beyond cross-reference sweeps in Edit 7c and Edit 8d.
- Any change to `harness/init/*.md` beyond cross-reference sweeps in Edit 7c and Edit 8d.
- The "old 013" carry-over items (executor memory placement, no-verbal-override pattern, draft skill promotion) — deferred post-Phase-1.
- Any application code (no code yet in v2; v1 in freeze per MENTOR_BRIEF §2).
- Any `git push` (CLAUDE.md R17 / G-R5).

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created, modified, or deleted:
   - `docs/tasks/015-docs-reconciliation/brief.md` (this file, already on disk via caminho B)
   - `.claude/skills/brief-template/SKILL.md` (modified — Edit 2a-2d)
   - `.claude/agents/brief-validator.md` (modified — Edit 2e)
   - `docs/AGENT_PLAYBOOK.md` (modified — Edit 3, Edit 5d)
   - `docs/MENTOR_BRIEF.md` (modified — Edit 4, Edit 5b)
   - `CLAUDE.md` (modified — Edit 5a)
   - `docs/GIT_WORKFLOW.md` (modified — Edit 5c)
   - `.claude/agents/executor.md` (modified — Edit 6)
   - `harness/workflows/start-task.md` (deleted — Edit 7)
   - `harness/workflows/README.md` (modified — Edit 7b)
   - `harness/prompts/task-brief-template.md` (deleted — Edit 8)
   - `harness/prompts/README.md` (deleted — Edit 8)
   - `harness/README.md` (modified — Edit 8c)
   - Plus any file discovered in sweep procedures (Edit 7c, Edit 8d) and classified as category A or B per the procedure tables.

   If anything else needs changing, **STOP and ask**.

2. Follow all rules in `CLAUDE.md` — especially R9 (agent-consumed surface is English), R10 (Conventional Commits, no trailers), R13 (no `--no-verify`), R15 (plan-before-code threshold), R17 (no proactive push).

3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `docs/orchestration-reconciliation`
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
   - STATE.md: **bootstrap exemption applies** — brief 015 defines STATE.md lifecycle in executor (Edit 6), so it cannot use STATE.md lifecycle on itself. Do not create STATE.md for this brief. Same pattern as brief 013 bootstrap exemption for `pre-commit-self-audit`.

4. Sweep procedures (Edit 7c, Edit 8d) classify matches into three categories (A active workflow, B init/setup, C historical). STOP-and-report on any match not classifiable into A/B/C or in a file not listed in the procedure's expected catalog.

5. Pre-commit hook is not bypassed with `--no-verify` (CLAUDE.md R13).

### Conventions

- All content additions in canonical docs (`CLAUDE.md`, `docs/**`, `.claude/**`): **English** (R9 — agent-consumed surface).
- Content additions in `harness/README.md`, `harness/workflows/README.md`: **pt-BR** (matches existing file language; R9 human-edited interface allowance).
- All commits follow Conventional Commits (`CLAUDE.md` R10, `GIT_WORKFLOW.md` G-R3).
- No `Co-authored-by` trailer (`GIT_WORKFLOW.md` G-R3).
- Pre-commit hook is not bypassed with `--no-verify` (`CLAUDE.md` R13).

### Architectural decisions already made (do not revisit)

Closed in the modeling session (chat, 2026-05-23). Executor implements; does not propose alternatives.

- **D1 — D-α resolved as Option 1: deprecate `harness/workflows/start-task.md`** and absorb its STATE.md lifecycle into `.claude/agents/executor.md`. The pipeline (planner creates branch, executor reads brief from disk) makes start-task.md redundant; absorbing STATE.md keeps single source of truth in the agent.

- **D2 — D-β resolved as Category L, `Plan required: no`.** Eight Edits with exact text snippets and verification checkboxes; all judgment calls have STOP-and-report fallbacks. Pause 1 skipped; Pauses 2 and 3 always required per AGENT_PLAYBOOK Lesson #6.

- **D3 — D-γ resolved as 8-Edit sequence** (anchors before deletions): Edit 1 (verify brief) → Edit 2 (canonicalize brief conventions in SKILL.md + validator) → Edit 3 (AGENT_PLAYBOOK Chapter 6) → Edit 4 (MENTOR_BRIEF §8 redesign) → Edit 5 (cross-references to agents/skills) → Edit 6 (STATE.md lifecycle in executor) → Edit 7 (delete start-task.md) → Edit 8 (delete task-brief-template.md and harness/prompts/ directory). Each Edit establishes anchors the next can reference.

- **D4 — Edit 2 combines SKILL.md errata (2a-2d) and validator update (2e) into a single commit.** Atomicity: SKILL.md anchors and validator references stay in sync; no intermediate state where validator expects an anchor that doesn't exist yet.

- **D5 — WARN state removed from validator entirely.** Brief 014's D11 introduced WARN as a temporary marker until brief 015 reconciled conventions. With C6/C7/C9 now canonicalized in SKILL.md (Edit 2a-2d), the validator transitions to PASS/FAIL-only. The validator system prompt's three-state explanation and verdict-rules section are updated accordingly.

- **D6 — AGENT_PLAYBOOK Chapter 6 introduces Lessons #11, #12, #13.** Three new lessons cover: pipeline as default not mandate (#11), REJECTED as decision point not failure state (#12), pipeline runs on closed decisions (#13). Numbering continues from #10; no reset between chapters.

- **D7 — MENTOR_BRIEF §8 removes "Modeling a new task" mode.** Reduced from 5 to 4 modes: mentoring, reviewing a plan, code review, continuing a paused task. The clarifying note explains that brief authoring is now the planner agent's responsibility; chat-side modeling (caminho B) is a sub-form of mentoring, not a distinct mode.

- **D8 — Cross-references in Edit 5 are bundled into a single commit** across four files (CLAUDE.md, MENTOR_BRIEF.md, GIT_WORKFLOW.md, AGENT_PLAYBOOK.md). Atomicity: docs ecosystem coherence is the theme; splitting would create transient inconsistency where some docs reference agents and others don't.

- **D9 — STATE.md lifecycle in executor.md documents three commit types** (start / update / remove), all exempt from `pre-commit-self-audit`. The audit expects `EDIT_SCOPE` aligned with brief Edits; STATE.md commits are infrastructure outside the Edits. Documentation of the exemption is repeated in each subsection (Creation/Updates/Removal) for defense against partial reading.

- **D10 — `chore(state): start` precedes Edit 1's brief-verification commit.** Rationale: STATE.md captures task intent — if any subsequent Edit fails, the next session can resume from STATE.md alone. The brief's "Commit sequence" assumes this ordering.

- **D11 — STATE.md template stays in `docs/GIT_WORKFLOW.md` G-R10.** Executor.md references G-R10 instead of duplicating the template. Single source of truth.

- **D12 — `harness/prompts/` deleted entirely** (both `task-brief-template.md` and the local `README.md`), not just the template file. Without the template, the README has no purpose. Directory removed via implicit git behavior on empty directory.

- **D13 — Edit 5 sub-edit 5b removes the `harness/prompts/task-brief-template.md` row from MENTOR_BRIEF §7** in advance of Edit 8's deletion. This creates a dependency: Edit 5 must land before Edit 8. The 8-Edit sequence respects this. If Edit 8's sweep finds a residual match in MENTOR_BRIEF (Edit 5 failed), STOP-and-report.

- **D14 — Sweep procedures (Edit 7c, Edit 8d) are exploratory.** The executor runs `grep`, classifies matches into A/B/C, applies substitutions per the tables, and STOPs on ambiguous matches. The brief does not pre-list exhaustive file matches because project_knowledge may be stale; the sweep discovers actual state.

---

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The user pre-saved this brief to `docs/tasks/015-docs-reconciliation/brief.md` before invoking the executor (caminho B). The executor verifies presence and commits.

- [ ] Directory `docs/tasks/015-docs-reconciliation/` exists
- [ ] File `docs/tasks/015-docs-reconciliation/brief.md` exists; first line is `# Brief: 015 — Docs reconciliation (cluster closer)`
- [ ] `git add docs/tasks/015-docs-reconciliation/brief.md` is staged
- [ ] Commit #1 created with subject `docs(tasks): add brief for 015-docs-reconciliation`
- [ ] Pause 3 invokes `pre-commit-self-audit` with `SUBJECT="docs(tasks): add brief for 015-docs-reconciliation"` and `EDIT_SCOPE="docs/tasks/015-docs-reconciliation/brief.md"`; report all five checks in chat

If the file is missing or the first line does not match, **STOP and report**. Do not regenerate the brief from memory.

---

### Edit 2 — Canonicalize brief conventions (SKILL.md + validator)

Five sub-edits across two files. Combined into a single commit (D4).

#### 2a. Add "Edit blocks numbering" subsection to `brief-template/SKILL.md`

Locate the "Authoring principles" section in `.claude/skills/brief-template/SKILL.md`. Add the following new subsection at the end of "Authoring principles" (before the next top-level section):

```markdown
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
```

#### 2b. Add "Commit sequence heading" subsection to `brief-template/SKILL.md`

In the same "Authoring principles" section, after the new "Edit blocks numbering" subsection, add:

```markdown
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
```

#### 2c. Add Pause naming convention paragraph in "Pause points" section of `brief-template/SKILL.md`

Locate the "Pause points" section heading in `.claude/skills/brief-template/SKILL.md`.

Find:
```markdown
## Pause points
```

Add immediately below the heading, before the existing bullet list of Pauses:

```markdown
Pauses are named in English ("Pause 1", "Pause 2", "Pause 3") on the
agent-consumed surface (R9). The pt-BR form "Pausa" appears only in
`harness/` human-edited prose (M-R10 / `CLAUDE.md` R9 — human-edited
interface allowance). When a brief uses pt-BR "Pausa", validator C9 emits
FAIL.
```

#### 2d. Sub-verification (Edits 2a-2c)

- [ ] Heading "Edit blocks numbering" exists in `.claude/skills/brief-template/SKILL.md` under "Authoring principles"
- [ ] Heading "Commit sequence heading" exists in same section, after "Edit blocks numbering"
- [ ] Pause naming paragraph inserted at the top of "Pause points" section, before existing bullet list
- [ ] No other content of `.claude/skills/brief-template/SKILL.md` modified
- [ ] Frontmatter byte-identical to before

#### 2e. Promote C6, C7, C9 from WARN-eligible to PASS/FAIL-only in `.claude/agents/brief-validator.md`

Five find-and-replace operations on `.claude/agents/brief-validator.md`. Apply each in order.

**2e.i — C6 row in the rule-to-pattern table**

Find:
```markdown
| C6 (WARN-eligible) | `grep -nE '^### Edit [0-9]+ — .+$' <brief>` (at least one) | Convention; emit WARN until SKILL.md errata lands in brief 015 |
```

Replace with:
```markdown
| C6 | `grep -nE '^### Edit [0-9]+ — .+$' <brief>` (at least one) | `.claude/skills/brief-template/SKILL.md`, "Edit blocks numbering" subsection |
```

**2e.ii — C7 row in the rule-to-pattern table**

Find:
```markdown
| C7 (WARN-eligible) | Extract commit subjects via `awk '/^### (Suggested )?[Cc]ommit sequence/,/^### /' <brief> \| grep -E '^[0-9]+\. ' \| sed -E 's/^[0-9]+\. //'`; check each ≤ 72 chars via `wc -L` | `CLAUDE.md` R10 and `GIT_WORKFLOW.md` G-R3. WARN if heading format is non-canonical (variants); FAIL if any subject > 72 chars |
```

Replace with:
```markdown
| C7 | Extract commit subjects via `awk '/^### Commit sequence/,/^### /' <brief> \| grep -E '^[0-9]+\. ' \| sed -E 's/^[0-9]+\. //'`; check each ≤ 72 chars via `wc -L` | `CLAUDE.md` R10, `GIT_WORKFLOW.md` G-R3, and `.claude/skills/brief-template/SKILL.md`, "Commit sequence heading" subsection. FAIL if heading is non-canonical or any subject > 72 chars |
```

**2e.iii — C9 row in the rule-to-pattern table**

Find:
```markdown
| C9 (WARN-eligible) | `grep -nE '^## (Pause points\|Pausa)' <brief>` plus `grep -E 'Pause 1\|Pausa 1' <brief>`, `grep -E 'Pause 2\|Pausa 2' <brief>`, `grep -E 'Pause 3\|Pausa 3' <brief>` | `docs/AGENT_PLAYBOOK.md` Lesson #6. Emit WARN if pt-BR "Pausa" used (convention pending in brief 015) |
```

Replace with:
```markdown
| C9 | `grep -nE '^## Pause points' <brief>` plus `grep -E 'Pause 1' <brief>`, `grep -E 'Pause 2' <brief>`, `grep -E 'Pause 3' <brief>` | `docs/AGENT_PLAYBOOK.md` Lesson #6 and `.claude/skills/brief-template/SKILL.md`, "Pause points" section. FAIL if pt-BR "Pausa" used on agent-consumed brief (R9) |
```

**2e.iv — Update "The 10 checks" preamble**

Find:
```markdown
For each check, the verdict is one of:

- **PASS** — check satisfied.
- **WARN** — convention not yet formalized in canonical docs (brief 014's
  D11 marker — applies to C6, C7, C9 until brief 015 reconciles
  `brief-template/SKILL.md`). The brief is not blocked by WARN.
- **FAIL** — rule violated. Triggers REJECTED if any check is FAIL.
```

Replace with:
```markdown
For each check, the verdict is one of:

- **PASS** — check satisfied.
- **FAIL** — rule violated. Triggers REJECTED if any check is FAIL.

The WARN state defined in brief 014 (D11) is removed in brief 015: C6, C7,
and C9 now have canonical anchors in `.claude/skills/brief-template/SKILL.md`
and produce PASS or FAIL only.
```

**2e.v — Update the verdict-rules section**

Find:
```markdown
- **REJECTED** if any check is FAIL.
- WARN alone never triggers REJECTED.
```

Replace with:
```markdown
- **REJECTED** if any check is FAIL.
```

#### 2f. Verification

- [ ] Sub-edits 2a-2c applied to `.claude/skills/brief-template/SKILL.md`
- [ ] Sub-edit 2e (i-v) applied to `.claude/agents/brief-validator.md`
- [ ] All five find-blocks of 2e matched byte-for-byte on first attempt (no approximation; if any find-block fails, **STOP and report** — do not regenerate from memory)
- [ ] C6, C7, C9 rows in validator's rule-to-pattern table no longer contain "(WARN-eligible)"
- [ ] Each row's third column references the new canonical anchor in `brief-template/SKILL.md`
- [ ] "For each check" preamble lists only PASS and FAIL
- [ ] Verdict-rules section no longer mentions WARN
- [ ] No file modified outside the two listed
- [ ] Frontmatters of both files byte-identical to before
- [ ] Pause 2 fires after writing the SKILL.md changes (first file fully modified), before opening `brief-validator.md`

**Commit:** `docs(orchestration): canonicalize brief conventions in validator`

Run `pre-commit-self-audit` at Pause 3 with `SUBJECT="docs(orchestration): canonicalize brief conventions in validator"` and `EDIT_SCOPE=".claude/skills/brief-template/SKILL.md .claude/agents/brief-validator.md"`.

---

### Edit 3 — Add Chapter 6 (orchestration pipeline) to `docs/AGENT_PLAYBOOK.md`

#### 3a. Find and replace

Locate the end of Chapter 5 and the start of "Related documents".

Find:
```markdown
Read this file end-to-end every 4–6 weeks until lessons #1–#10 are reflexes. After that, scan the lesson titles only — they will trigger the right behavior on their own.

## Related documents
```

Replace with:
```markdown
Read this file end-to-end every 4–6 weeks until lessons #1–#10 are reflexes. After that, scan the lesson titles only — they will trigger the right behavior on their own.

## Chapter 6 — The orchestration pipeline (planner → brief-validator → executor)

The orchestration pipeline runs inside Claude Code. The main session is the orchestrator; three subagents handle the layers. Chat (claude.ai) stays out of this loop entirely — chat is the architectural surface (mentoring, design decisions, recaps).

This chapter describes how to drive the pipeline and what to do when it surfaces a problem.

### When to use the pipeline vs. caminho B

Two entry points coexist:

- **Pipeline (default for new tasks):** the main session invokes the planner with a task description; planner writes the brief, validator audits it, executor runs it. Use when the task started from a chat-side architectural discussion or a clear single-paragraph delegation.
- **Caminho B (fallback):** you author the brief manually (typically using the chat-mentor as a writing partner), pre-save it to `docs/tasks/<NNN>-<slug>/brief.md`, and invoke the executor directly. Use when the brief shape needs hand-tuning chat cannot guess (large structural edits, doctrinal briefs, bootstrap scenarios where the pipeline itself is being modified).

The pipeline and caminho B are not mutually exclusive: caminho B is what you reach for when the pipeline would loop on its own creation, or when the task carries decisions that didn't fit a delegation prompt.

> **Lesson #11 — The pipeline is a default, not a mandate.** Use it for clear delegations. Reach for caminho B when the brief needs the kind of judgment that doesn't compress into a prompt. The cost of the wrong choice is small; the cost of forcing the pipeline on a brief it can't handle is a rejected verdict and a redo.

### Invocation patterns

**Pipeline invocation (in the Claude Code main session):**

```
Open a new task: <task description in 1-2 paragraphs>.
Invoke @planner.
```

The main session then:
1. Invokes planner with the description.
2. Receives planner's final message (brief authored, branch, commit SHA).
3. Invokes `@brief-validator` with the brief path and branch.
4. Receives the validator's verdict report.
5. If `Verdict: APPROVED` — invokes `@executor` with the same brief path and branch.
6. If `Verdict: REJECTED` — surfaces the report to you. See "Verdict handling" below.

**Caminho B invocation (in the Claude Code main session):**

```
Execute brief at docs/tasks/<NNN>-<slug>/brief.md on branch <branch>.
Invoke @executor.
```

You skip planner and validator. The executor runs the brief as-is.

### Verdict handling

When the validator emits `Verdict: APPROVED`, the main session proceeds to executor invocation. You see the report but no action is required from you.

When the validator emits `Verdict: REJECTED`, the main session surfaces the report and waits. The report names each failed check, the violated rule with a GitHub deep-link, the observed vs. expected text, and the line in the brief where the failure was detected.

You then choose one of three responses:

1. **Return to chat (claude.ai) to redesign.** The cleanest path when the FAIL reveals an architectural gap — the brief asks for something the validator's checks correctly flag as out of convention. Take the validator report to the mentor; the mentor and you redesign the brief; pre-save the new brief via caminho B; re-invoke validator and executor.
2. **Fix directly on the branch.** Use when the FAIL is a small mechanical slip the planner introduced (subject overflow, missing section header, branch type mismatch). Edit the brief on disk; re-invoke `@brief-validator` to re-audit. If APPROVED, proceed to executor.
3. **Override the validator.** Use when you know the FAIL is correct under unusual circumstances the validator can't see (e.g. a brief that intentionally violates a convention to introduce its replacement — the cluster bootstrap case). Skip the validator and invoke `@executor` directly. Document the override in the brief's "Plan required justification" or a dedicated decision block; the mentor session recap should also capture the override.

> **Lesson #12 — REJECTED is a decision point, not a failure state.** The validator's job is to flag mechanical drift; your job is to decide whether the drift is the bug or the convention is the bug. Three responses, one chosen per case, none default. Auto-loop back to planner was rejected at cluster design (D4) precisely because the user-judgment step protects against silent validator errors.

### When NOT to use the pipeline

- **The task modifies the pipeline itself.** Cluster 013-015 is the canonical example: a brief that creates the validator can't be audited by the validator; a brief that redesigns AGENT_PLAYBOOK's pipeline chapter can't be planned by the agent reading the old chapter. Use caminho B for these.
- **The task is Category S.** A one-line chat message in the executor session is enough. No brief, no pipeline.
- **The task is exploratory.** Discovery work where the shape of the output is unclear belongs in chat first (mentoring mode); only after the shape stabilizes does it become a brief.
- **Multiple architectural decisions remain open.** The planner produces briefs from delegations, not from incomplete designs. If the delegation prompt would need to say "and decide between X and Y", the work isn't ready for the pipeline yet.

> **Lesson #13 — The pipeline runs on closed decisions.** Open decisions belong in chat. The planner faithfully encodes what you delegate; if the delegation has gaps, the brief has gaps; if the brief has gaps, the executor will either STOP or invent. None of those are good outcomes.

### Troubleshooting

| Symptom | Diagnosis | Response |
|---|---|---|
| Planner STOPs with "ambiguous input" | Delegation prompt lacked clear Goal | Return to chat; rewrite the delegation into 1-2 imperative sentences |
| Planner STOPs with "NNN resolution conflict" | P4 three-source check disagreed | Manually resolve the slot number; pass it explicitly in the next delegation |
| Validator REJECTED with FAILs you disagree with | Convention vs. intentional deviation tension | Use override path (option 3 above); document the override |
| Validator REJECTED with FAILs you didn't anticipate | Planner output drifted from brief-template SKILL | Fix on branch (option 2); re-validate |
| Executor STOPs at Pause 2 with "file outside scope" | Brief's scope didn't predict a required side-effect | Return to chat; revise scope; re-execute |
| Executor reports pre-commit-self-audit FAIL | Mechanical slip in commit subject or staging | Fix the subject or restage; re-run the audit; commit |

## Related documents
```

#### 3b. Verification

- [ ] `## Chapter 6` heading exists between Chapter 5 and "## Related documents"
- [ ] Chapter 6 has six subsections: "When to use the pipeline vs. caminho B", "Invocation patterns", "Verdict handling", "When NOT to use the pipeline", "Troubleshooting" (plus the chapter intro paragraph)
- [ ] Lessons #11, #12, #13 added (three new lessons; numbering picks up from #10)
- [ ] Troubleshooting table has six rows
- [ ] No content of Chapters 1-5 modified
- [ ] No content of "Related documents" or below modified
- [ ] All content in English (R9)

**Commit:** `docs(playbook): add Chapter 6 on the orchestration pipeline`

Run `pre-commit-self-audit` at Pause 3 with `SUBJECT="docs(playbook): add Chapter 6 on the orchestration pipeline"` and `EDIT_SCOPE="docs/AGENT_PLAYBOOK.md"`.

---

### Edit 4 — Redesign MENTOR_BRIEF.md §8 (5 modes → 4)

Three sub-edits in the same file. Combined into a single commit.

#### 4a. Replace the §8 table

Locate the table "Context to load per session type" in §8 of `docs/MENTOR_BRIEF.md`.

Find (the entire table, including header):
```markdown
| Session type | Always load | Add when relevant |
|---|---|---|
| Mentoring / architectural decision | `CLAUDE.md`, `MENTOR_BRIEF.md` | Topic-specific docs |
| Modeling a new task (generate brief) | `CLAUDE.md`, `MENTOR_BRIEF.md`, `AGENT_PLAYBOOK.md`, `GIT_WORKFLOW.md`, `GOTCHAS.md`, `harness/prompts/task-brief-template.md` | — |
| Reviewing an agent's plan | `CLAUDE.md`, `MENTOR_BRIEF.md`, `AGENT_PLAYBOOK.md` (chapters 2–3), the task's `brief.md` | The new `plan.md` |
| Code review by reading | `CLAUDE.md`, `MENTOR_BRIEF.md`, `GOTCHAS.md` | Code under review |
| Continuing a paused task | `CLAUDE.md`, `MENTOR_BRIEF.md`, the task's `brief.md`, `plan.md`, and `STATE.md` if present | — |
```

Replace with:
```markdown
| Session type | Always load | Add when relevant |
|---|---|---|
| Mentoring / architectural decision | `CLAUDE.md`, `MENTOR_BRIEF.md` | Topic-specific docs |
| Reviewing a plan | `CLAUDE.md`, `MENTOR_BRIEF.md`, `AGENT_PLAYBOOK.md` (chapters 2–3, 6), the task's `brief.md` | The validator verdict report; `plan.md` if present |
| Code review by reading | `CLAUDE.md`, `MENTOR_BRIEF.md`, `GOTCHAS.md` | Code under review; the executor's final report |
| Continuing a paused task | `CLAUDE.md`, `MENTOR_BRIEF.md`, the task's `brief.md`, and `STATE.md` if present | The latest session recap in `docs/sessions/` |
```

#### 4b. Insert clarifying note after the table

Find:
```markdown
### Default starting prompt for a fresh chat

Snippet to paste into a fresh Claude chat. Shown in pt-BR because chat operates in pt-BR (M-R10). The surrounding documentation is English (R9); the snippet itself is an embedded chat-starter example, not documentation prose.
```

Replace with:
```markdown
> **On "modeling a new task":** earlier versions of this table included a fifth mode for modeling new task briefs. Since brief 015 (cluster closer), brief authoring is the planner agent's responsibility inside Claude Code (`docs/AGENT_PLAYBOOK.md` Chapter 6). Chat still hosts architectural design that *precedes* the planner — that work is "mentoring", not "modeling". When the brief shape needs hand-tuning the planner cannot produce (doctrinal briefs, pipeline-modifying briefs, bootstrap scenarios), the user authors the brief via caminho B with chat as a writing partner; this is also a mentoring session, not a separate mode.

### Default starting prompt for a fresh chat

Snippet to paste into a fresh Claude chat. Shown in pt-BR because chat operates in pt-BR (M-R10). The surrounding documentation is English (R9); the snippet itself is an embedded chat-starter example, not documentation prose.
```

#### 4c. Update the pt-BR snippet

Find:
```
Tipo de sessão: [mentoria | modelar tarefa | revisar plano | code review | continuar tarefa]
```

Replace with:
```
Tipo de sessão: [mentoria | revisar plano | code review | continuar tarefa]
```

#### 4d. Verification

- [ ] The §8 table has exactly 4 rows (excluding header)
- [ ] "Modeling a new task" row removed
- [ ] "Reviewing a plan" row references AGENT_PLAYBOOK Chapter 6
- [ ] "Continuing a paused task" row no longer references `plan.md`
- [ ] Clarifying note "On modeling a new task" inserted between table and "Default starting prompt" subheading
- [ ] pt-BR snippet updated to 4 options (no "modelar tarefa")
- [ ] No other section of MENTOR_BRIEF modified (§1-§7 byte-identical; §3 P4 retained; §4 M-R1 through M-R14 byte-identical)
- [ ] Frontmatter / file header byte-identical to before

**Commit:** `docs(mentor-brief): reduce session modes from 5 to 4`

Run `pre-commit-self-audit` at Pause 3 with `SUBJECT="docs(mentor-brief): reduce session modes from 5 to 4"` and `EDIT_SCOPE="docs/MENTOR_BRIEF.md"`.

---

### Edit 5 — Cross-references from canonical docs to agents and skills

Four sub-edits across four files. Combined into a single commit (D8).

#### 5a. CLAUDE.md "Related Documents"

Locate the "Related Documents" list at the end of `CLAUDE.md`.

Find:
```markdown
- `harness/` — workflow prompts (`start-task.md`, `setup-code.md`, etc.) for new sessions
- `README.md` — user-facing project description
```

Replace with:
```markdown
- `harness/` — workflow prompts (`start-task.md`, `setup-code.md`, etc.) for new sessions
- `.claude/agents/` — orchestration subagents: `planner.md`, `brief-validator.md`, `executor.md`; invoked by the Claude Code main session (`docs/AGENT_PLAYBOOK.md` Chapter 6)
- `.claude/skills/brief-template/` — authoring template for `docs/tasks/<NNN>-<slug>/brief.md`; preloaded by planner and brief-validator
- `.claude/skills/pre-commit-self-audit/` — five mechanical checks run by the executor before every Pause 3
- `README.md` — user-facing project description
```

#### 5b. MENTOR_BRIEF.md §7 table

Locate the "Related documents" table in §7 of `docs/MENTOR_BRIEF.md`.

Find:
```markdown
| `docs/AGENT_PLAYBOOK.md` | The user — orchestration between Chat / Code / Cowork |
| `harness/prompts/task-brief-template.md` | Both agents and the user — task brief template (4 parts + `Plan required` flag) |
| `docs/tasks/<NNN>-<slug>/` | Per-task artifacts: `brief.md`, `plan.md`, optional `notes.md` |
| `harness/` | The user — workflow prompts to start sessions and tasks |
| `README.md` | End users — what Saci is and how to install it |
```

Replace with:
```markdown
| `docs/AGENT_PLAYBOOK.md` | The user — orchestration between Chat / Code / Cowork; Chapter 6 covers the pipeline |
| `.claude/agents/` | The orchestration subagents (planner, brief-validator, executor) invoked from Claude Code main session |
| `.claude/skills/brief-template/` | Authoring template for `docs/tasks/<NNN>-<slug>/brief.md`; preloaded by planner and brief-validator |
| `.claude/skills/pre-commit-self-audit/` | Five mechanical checks run by the executor before every Pause 3 |
| `docs/tasks/<NNN>-<slug>/` | Per-task artifacts: `brief.md`, optional `notes.md` (per-session recaps live in `docs/sessions/`) |
| `harness/` | The user — workflow prompts to start sessions and tasks (parallel manual surface to `.claude/agents/`) |
| `README.md` | End users — what Saci is and how to install it |
```

#### 5c. GIT_WORKFLOW.md — note after G-R8

Locate G-R8 in `docs/GIT_WORKFLOW.md`.

Find:
```markdown
**G-R8 — Pre-commit hook runs `npm test`.** Hook lives in `.githooks/pre-commit`, configured via `core.hooksPath`. Never bypass with `--no-verify`. Mirrors `CLAUDE.md` R13.
```

Replace with:
```markdown
**G-R8 — Pre-commit hook runs `npm test`.** Hook lives in `.githooks/pre-commit`, configured via `core.hooksPath`. Never bypass with `--no-verify`. Mirrors `CLAUDE.md` R13.

> **Note on executor self-audit:** the executor agent (`.claude/agents/executor.md`) additionally invokes the `pre-commit-self-audit` skill (`.claude/skills/pre-commit-self-audit/`) before every Pause 3. The skill runs five mechanical checks (subject length, Conventional Commits type, imperative mood, no `Co-authored-by`, staged scope). This is **complementary to** G-R8, not a substitute — `npm test` still runs via the git hook on commit. Manual-invocation surface does not run the self-audit; pipeline-invoked executor does.
```

#### 5d. AGENT_PLAYBOOK.md "Related documents" table

Locate the "Related documents" table at the end of `docs/AGENT_PLAYBOOK.md`.

Find:
```markdown
## Related documents

| File | Purpose |
|---|---|
| `CLAUDE.md` | Code rules for the executor agent (Claude Code) |
| `docs/MENTOR_BRIEF.md` | Behavioral rules for the mentor agent (Claude in chat) |
| `docs/GIT_WORKFLOW.md` | Operational git discipline — branches, PRs, hooks, releases |
| `docs/GOTCHAS.md` | Stack-specific traps catalog (`G-CAT-N` IDs) |
| `docs/AGENT_PLAYBOOK.md` | This file — orchestration manual for the user |
| `harness/workflows/` | Pre-built session templates for common situations |
| `README.md` | End-user description of Saci |
```

Replace with:
```markdown
## Related documents

| File | Purpose |
|---|---|
| `CLAUDE.md` | Code rules for the executor agent (Claude Code) |
| `docs/MENTOR_BRIEF.md` | Behavioral rules for the mentor agent (Claude in chat) |
| `docs/GIT_WORKFLOW.md` | Operational git discipline — branches, PRs, hooks, releases |
| `docs/GOTCHAS.md` | Stack-specific traps catalog (`G-CAT-N` IDs) |
| `docs/AGENT_PLAYBOOK.md` | This file — orchestration manual for the user |
| `.claude/agents/planner.md` | Planner subagent — authors briefs from delegation prompts |
| `.claude/agents/brief-validator.md` | Brief-validator subagent — audits briefs with 10 mechanical checks |
| `.claude/agents/executor.md` | Executor subagent — runs briefs (pipeline-invoked) |
| `.claude/skills/brief-template/` | Brief authoring template (preloaded by planner and brief-validator) |
| `.claude/skills/pre-commit-self-audit/` | Executor's Pause-3 self-audit checklist |
| `harness/workflows/` | Pre-built session templates for manual invocation (parallel surface to `.claude/agents/`) |
| `README.md` | End-user description of Saci |
```

#### 5e. Verification

- [ ] CLAUDE.md "Related Documents": 3 new entries (`.claude/agents/`, `.claude/skills/brief-template/`, `.claude/skills/pre-commit-self-audit/`)
- [ ] MENTOR_BRIEF §7: `harness/prompts/task-brief-template.md` row removed; 3 new rows added; `docs/tasks/<NNN>-<slug>/` row no longer mentions `plan.md`; `harness/` row qualified as "parallel manual surface"
- [ ] GIT_WORKFLOW.md: note inserted after G-R8 referencing pre-commit-self-audit as complementary to the git hook
- [ ] AGENT_PLAYBOOK.md "Related documents": 5 new rows (3 agents + 2 skills); `harness/workflows/` row qualified as "parallel surface"
- [ ] No rule (R/G-R/M-R), anti-pattern (A/G-A/O), or exception (E) added or removed in any file
- [ ] Other sections of all four files byte-identical to before
- [ ] Frontmatters byte-identical to before
- [ ] Pause 2 fires after CLAUDE.md is modified (first file of Edit 5), before opening MENTOR_BRIEF.md

**Commit:** `docs(cross-refs): wire canonical docs to agents and skills`

Run `pre-commit-self-audit` at Pause 3 with `SUBJECT="docs(cross-refs): wire canonical docs to agents and skills"` and `EDIT_SCOPE="CLAUDE.md docs/MENTOR_BRIEF.md docs/GIT_WORKFLOW.md docs/AGENT_PLAYBOOK.md"`.

---

### Edit 6 — Add STATE.md lifecycle section to `.claude/agents/executor.md`

#### 6a. Find and replace

Locate the boundary between "Reference reading order" and "Pauses" in `.claude/agents/executor.md`.

Find:
```markdown
`.claude/skills/pre-commit-self-audit/SKILL.md` is preloaded; no need to
re-read.

## Pauses
```

Replace with:
```markdown
`.claude/skills/pre-commit-self-audit/SKILL.md` is preloaded; no need to
re-read.

## STATE.md lifecycle

Before starting any Edit, decide whether the task requires `STATE.md`:

- **Required for Category L tasks** (per `docs/GIT_WORKFLOW.md` G-R10):
  multi-session tasks or those with structural complexity create
  `STATE.md` at the repo root to preserve context across sessions.
- **Optional for Category M tasks**: single-session and short scope —
  skip unless the user explicitly requests it.
- **Not used for Category S tasks**: those don't reach this agent.

The brief's `Category:` frontmatter field tells you which applies.

### Creation (before Pause 1, or before Edit 2 if Pause 1 is skipped)

If `STATE.md` is required and does not yet exist:

1. Create `STATE.md` at the repo root, using the template documented in
   `docs/GIT_WORKFLOW.md` "STATE.md (long tasks)" section.
2. Populate the fields:
   - `Goal`: copy from the brief's `## Goal` section (one or two sentences).
   - `Status`: `in-progress`.
   - `Last update`: current date/time and the OS you are running on.
   - `Done so far`: empty (no items yet).
   - `Next steps`: copy the planned Edit titles from the brief in order.
3. Stage and commit:
   ```bash
   git add STATE.md
   git commit -m "chore(state): start <NNN>-<slug>"
   ```
   Subject must be ≤ 72 chars (R10). This commit precedes Edit 1's
   brief-verification commit. Rationale: STATE.md captures task intent —
   if any subsequent Edit fails, the next session can resume from
   STATE.md alone. Place this commit first; the brief's "Commit
   sequence" section assumes this ordering.

This commit is **exempt from `pre-commit-self-audit`** because the audit
expects `EDIT_SCOPE` to align with a brief Edit's declared file list;
`STATE.md` lifecycle commits are infrastructure outside the Edits.

### Updates (between Edits, on session boundaries)

Between Edits or when pausing a session, update `STATE.md`:

- `Status`: keep `in-progress` (or change to `blocked` with a `Blockers`
  section if a STOP condition required user input).
- `Last update`: refresh the timestamp.
- `Done so far`: add an `[x]` line for each completed Edit.
- `Next steps`: remove completed items; refine the next concrete action.
- `Notes for next session`: capture non-obvious context (decisions taken
  in chat that the brief doesn't yet reflect, hypotheses to test).

Stage and commit each update with subject `chore(state): update <NNN>-<slug>`.
This commit is also exempt from `pre-commit-self-audit`.

### Removal (after the final Edit's commit, before the Final report)

After the brief's last Edit is committed and verified:

1. Confirm `Status: completed` if you choose to leave `STATE.md` in place
   for a final summary commit; otherwise skip step 2 and remove directly.
2. Delete the file:
   ```bash
   git rm STATE.md
   git commit -m "chore(state): remove after <NNN>-<slug>"
   ```
   Subject ≤ 72 chars.

This commit is exempt from `pre-commit-self-audit`. After this commit,
proceed to the Final report.

### When you do NOT touch STATE.md

- Category M task where the user did not request it.
- Category L task where the user explicitly opted out at delegation time.
  (Rare; ask if uncertain before skipping.)
- The file already exists with a different `Goal` — **STOP and report**.
  Do not overwrite or merge content; the user reconciles.

## Pauses
```

#### 6b. Verification

- [ ] New section `## STATE.md lifecycle` inserted between "Reference reading order" and "Pauses"
- [ ] Four subsections present: "Creation", "Updates", "Removal", "When you do NOT touch STATE.md"
- [ ] Section references `docs/GIT_WORKFLOW.md` G-R10 and the "STATE.md (long tasks)" section for the template (does not duplicate the template)
- [ ] Category L marked as required, M optional, S not-applicable
- [ ] Three STATE.md commit types documented (start, update, remove) — all exempt from pre-commit-self-audit (exemption stated three times, once per subsection)
- [ ] Each STATE.md commit subject ≤ 72 chars verifiable
- [ ] STOP-and-report condition included for STATE.md already existing with different Goal
- [ ] Rest of `.claude/agents/executor.md` byte-identical to before
- [ ] Frontmatter byte-identical to before

**Commit:** `docs(agents): add STATE.md lifecycle section to executor`

Run `pre-commit-self-audit` at Pause 3 with `SUBJECT="docs(agents): add STATE.md lifecycle section to executor"` and `EDIT_SCOPE=".claude/agents/executor.md"`.

---

### Edit 7 — Deprecate `harness/workflows/start-task.md`

Three sub-edits: file deletion, README update, sweep.

#### 7a. Delete the file

```bash
git rm harness/workflows/start-task.md
```

#### 7b. Update `harness/workflows/README.md`

Locate the "Tarefas" section catalog.

Find:
```markdown
### Tarefas

- **`task-pre-flight.md`** — checklist antes de mexer em código
- **`start-task.md`** — iniciar tarefa nova com brief
- **`pause-task.md`** — pausar preservando estado
- **`close-task.md`** — fechar tarefa pra mergear
```

Replace with:
```markdown
### Tarefas

- **`task-pre-flight.md`** — checklist antes de mexer em código
- **`pause-task.md`** — pausar preservando estado
- **`close-task.md`** — fechar tarefa pra mergear

> **Nota:** `start-task.md` foi removido em 2026-05-23 (brief 015).
> Seu conteúdo está absorvido em `.claude/agents/executor.md`
> (reading order, pre-flight, STATE.md lifecycle, plan + wait).
> Invocação pipeline-driven via main session do Claude Code é o
> caminho default; caminho B (brief pré-salvo + invocação direta
> do executor) continua válido. Ver `docs/AGENT_PLAYBOOK.md`
> Capítulo 6.
```

#### 7c. Sweep obsolete cross-references

Run:
```bash
grep -rn "start-task" . --include="*.md" --exclude-dir=.git --exclude-dir=node_modules
```

For each match, classify into one of three categories:

- **A — Active reference in active workflow file** (e.g. `harness/workflows/close-chat-session.md`, `harness/workflows/resume-session.md`, `harness/workflows/review-pause3.md`, `harness/workflows/review-final-task.md`).
- **B — Active reference in init/setup file** (e.g. `harness/init/07-create-brief.md`, `harness/init/*.md`).
- **C — Historical reference** (in `docs/sessions/<date>-*.md`, in post-merge briefs `docs/tasks/<NNN>-<slug>/brief.md`).

For matches in category A or B, apply the substitution table:

| Context | Replace with |
|---|---|
| "use o start-task.md pra iniciar tarefa" or equivalent | "use `.claude/agents/executor.md` (pipeline) ou caminho B (`docs/AGENT_PLAYBOOK.md` Capítulo 6)" |
| "próximo workflow: start-task.md" or equivalent | "próximo: invocar pipeline (planner → validator → executor) via main session" |
| Link `harness/workflows/start-task.md` in catalog/list | remove the line; add historical note if contextually useful |

For matches in category C, **preserve verbatim** (G-PROC-1).

**STOP-and-report** if:
- A match is in a file not listed in the expected catalog above (categories A or B).
- A match is ambiguous and cannot be classified into A/B/C.
- A match is found in `.claude/agents/executor.md` (this would violate brief 014's D8 — start-task.md should not be referenced from executor.md).

#### 7d. Verification

- [ ] `harness/workflows/start-task.md` no longer exists (`ls harness/workflows/start-task.md` returns error)
- [ ] `harness/workflows/README.md` "Tarefas" section no longer lists `start-task.md` as active entry
- [ ] `harness/workflows/README.md` contains the historical note referencing 2026-05-23, brief 015, and `.claude/agents/executor.md`
- [ ] `grep -rn "start-task" . --include="*.md" --exclude-dir=.git` was executed and matches classified per procedure 7c
- [ ] All category A (active workflow) and category B (init/setup) matches updated per the substitution table
- [ ] Category C matches (historical sessions/ + post-merge briefs) preserved verbatim
- [ ] No new match in `.claude/agents/executor.md` (sweep confirms D8 of brief 014)
- [ ] List of files modified by Edit 7 reported at Pause 3 (may include beyond start-task.md and README.md: any category A/B files discovered in the sweep)

**Commit:** `docs(workflows): deprecate start-task; use executor agent`

Run `pre-commit-self-audit` at Pause 3 with `SUBJECT="docs(workflows): deprecate start-task; use executor agent"` and `EDIT_SCOPE` equal to all files modified in Edit 7 (minimum: `harness/workflows/start-task.md harness/workflows/README.md`, plus any category A/B files discovered).

**Pause 2** fires after the sweep (7c) completes and category A/B files are updated, before Pause 3.

---

### Edit 8 — Deprecate `harness/prompts/task-brief-template.md` and remove `harness/prompts/` directory

Four sub-edits: two file deletions, README update, sweep.

#### 8a. Conflict check

Verify the directory contains only the two expected files:

```bash
ls -la harness/prompts/
```

If files other than `README.md` and `task-brief-template.md` exist in `harness/prompts/`, **STOP and report**. Do not delete unknown files.

#### 8b. Delete the two files

```bash
git rm harness/prompts/task-brief-template.md
git rm harness/prompts/README.md
```

After both removals, the directory `harness/prompts/` should be empty and removed implicitly by git.

#### 8c. Update `harness/README.md` "Estrutura" tree

Locate the "Estrutura" section in `harness/README.md`.

Find:
```markdown
## Estrutura

```
harness/
├── README.md
├── init/
├── workflows/
├── prompts/
└── skills-plan/
```
```

Replace with:
```markdown
## Estrutura

```
harness/
├── README.md
├── init/
├── workflows/
└── skills-plan/
```

> **Nota:** `harness/prompts/` foi removido em 2026-05-23 (brief 015).
> Continha `task-brief-template.md` (superseded por
> `.claude/skills/brief-template/SKILL.md` desde brief 013) e seu
> README local. Sem outros artefatos, o diretório foi excluído.
```

#### 8d. Sweep obsolete cross-references

Run two greps:
```bash
grep -rn "task-brief-template" . --include="*.md" --exclude-dir=.git --exclude-dir=node_modules
grep -rn "harness/prompts" . --include="*.md" --exclude-dir=.git --exclude-dir=node_modules
```

For each match, classify into one of three categories:

- **A — Active reference in active workflow file** (e.g. `harness/workflows/*.md`).
- **B — Active reference in init/setup file** (e.g. `harness/init/07-create-brief.md`, `harness/init/*.md`).
- **C — Historical reference** (in `docs/sessions/<date>-*.md`, in post-merge briefs `docs/tasks/<NNN>-<slug>/brief.md`).

For matches in category A or B, apply the substitution table:

| Context | Replace with |
|---|---|
| "use o task-brief-template.md pra escrever brief" or equivalent | "use the `brief-template` skill in `.claude/skills/brief-template/SKILL.md`" (translate to file's existing language) |
| Link `harness/prompts/task-brief-template.md` in catalog/list | remove the line; add historical note if contextually useful |
| "reading order: ... harness/prompts/task-brief-template.md" | replace with "reading order: ... .claude/skills/brief-template/SKILL.md" |

For matches in category C, **preserve verbatim** (G-PROC-1).

**STOP-and-report** if:
- A match is in a file not listed in the expected catalog above.
- A match is ambiguous and cannot be classified into A/B/C.
- A match is found in `.claude/skills/brief-template/SKILL.md` or `.claude/agents/*.md` (this would violate D12 of brief 013 — SKILL.md should not reference the old template).
- A match is found in `docs/MENTOR_BRIEF.md` after Edit 5 of this brief already removed the `harness/prompts/task-brief-template.md` row from §7 — this indicates Edit 5 failed or incomplete.

#### 8e. Verification

- [ ] `harness/prompts/task-brief-template.md` no longer exists (`ls harness/prompts/task-brief-template.md` returns error)
- [ ] `harness/prompts/README.md` no longer exists
- [ ] Directory `harness/prompts/` no longer exists (`ls harness/prompts/` returns error — empty directory removed implicitly by git)
- [ ] `harness/README.md` "Estrutura" tree no longer lists `prompts/`
- [ ] `harness/README.md` contains the historical note referencing 2026-05-23, brief 015, and `.claude/skills/brief-template/SKILL.md`
- [ ] `grep -rn "task-brief-template" . --include="*.md" --exclude-dir=.git` was executed and matches classified per procedure 8d
- [ ] All category A (active workflow) and category B (init/setup) matches updated per the substitution table
- [ ] Category C matches (historical) preserved verbatim
- [ ] Sweep confirmation: zero matches in `.claude/skills/brief-template/SKILL.md` and `.claude/agents/*.md`
- [ ] Sweep confirmation: zero matches in CLAUDE.md, MENTOR_BRIEF.md, GIT_WORKFLOW.md, AGENT_PLAYBOOK.md (reflects Edit 5 of this brief already applied)
- [ ] List of files modified by Edit 8 reported at Pause 3

**Commit:** `docs(prompts): deprecate task-brief-template; use skill`

Run `pre-commit-self-audit` at Pause 3 with `SUBJECT="docs(prompts): deprecate task-brief-template; use skill"` and `EDIT_SCOPE` equal to all files modified in Edit 8 (minimum: `harness/prompts/task-brief-template.md harness/prompts/README.md harness/README.md`, plus any category A/B files discovered).

**Pause 2** fires after the sweep (8d) completes and category A/B files are updated, before Pause 3.

---

## Pause points

- **Pause 1 (before any change):** **Skipped** — `Plan required: no` (see justification below).
- **Pause 2 (after the first modified file is fully changed):** **Required.** Fires multiple times — once after the first file of each multi-file Edit (Edit 2 between SKILL.md and validator; Edit 5 between CLAUDE.md and MENTOR_BRIEF.md; Edit 7 after the sweep completes; Edit 8 after the sweep completes). Show the full file content (or diff) for review before moving to the next file or to Pause 3.
- **Pause 3 (before every commit):** **Required.** Eight commits planned. Run `pre-commit-self-audit` against each commit's proposed subject and staged files before submitting Pause 3.

In case of:

- Unrelated bug or doc inconsistency found in a file being edited → report and ask. Do not fix.
- Any find-block in Edits 2, 3, 4, 5, 6, 7b, 8c does not match byte-for-byte → **STOP and report**. Do not regenerate from memory.
- Sweep procedures (7c, 8d) encounter ambiguous matches or matches in unexpected files → **STOP and report**. Do not silently classify.
- Any file outside the brief's declared scope shows up in `git status` or `git diff --name-only` → **STOP and report**. Do not commit until resolved.
- Technical limitation preventing a done criterion → report.

**DO NOT proceed "fixing" things without permission.**

---

## Plan required justification

`Plan required: no` because:

- All eight Edits are specified with exact text snippets (find/replace blocks), insertion points, file paths, and verification checkboxes.
- All architectural decisions are closed (D1–D14) in the Constraints section.
- The two sweep procedures (Edit 7c, Edit 8d) explicitly define classification categories (A/B/C) and substitution tables, with STOP-and-report fallbacks on ambiguity.
- The judgment calls (sweep classification, find-block mismatch, file conflict) all have explicit STOP-and-report fallbacks rather than silent improvisation.

**Pause 2 and Pause 3 remain required** — Lesson #6 of `docs/AGENT_PLAYBOOK.md`. Pause 2 fires at the boundaries identified in "Pause points" above; Pause 3 fires before every commit and invokes `pre-commit-self-audit`.

---

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — R9 (agent-consumed surface English), R10 (Conventional Commits), R11 (branch naming), R13 (no `--no-verify`), R15 (plan-before-code threshold), R17 (no proactive push)
2. `docs/MENTOR_BRIEF.md` — M-R10 (language split mirroring R9), M-R12 (mentor lane), §8 (modes — the section this brief redesigns)
3. `docs/GIT_WORKFLOW.md` — G-R1 (main via PR), G-R2 (branch type set), G-R3 (Conventional Commits, no trailers), G-R5 (push authorization), G-R8 (pre-commit hook), G-R10 (STATE.md lifecycle), G-A7 (Co-authored-by anti-pattern)
4. `docs/GOTCHAS.md` — G-PROC-1 (literal sweeps and historical record; relevant for Edits 7c and 8d)
5. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Chapter 4 (orchestration anti-patterns), Lesson #6 (Pauses 2 and 3 always required)
6. `.claude/skills/brief-template/SKILL.md` — the file being modified in Edit 2a-2d
7. `.claude/skills/pre-commit-self-audit/SKILL.md` — preloaded; runs at every Pause 3
8. `.claude/agents/brief-validator.md` — the file being modified in Edit 2e
9. `.claude/agents/executor.md` — the file being modified in Edit 6
10. `docs/sessions/2026-05-22-mentor-013-orchestration-cluster-design.md` — cluster design context (D1-D15)
11. `docs/sessions/2026-05-22-mentor-014-orchestration-agents.md` — brief 014 carry-overs (the six frentes of work in this brief)
12. `docs/tasks/014-orchestration-agents/brief.md` — D11 of brief 014 (WARN-eligible markers being removed in Edit 2e)

---

## Commit sequence

Eight commits, in this order:

```
1. docs(tasks): add brief for 015-docs-reconciliation
2. docs(orchestration): canonicalize brief conventions in validator
3. docs(playbook): add Chapter 6 on the orchestration pipeline
4. docs(mentor-brief): reduce session modes from 5 to 4
5. docs(cross-refs): wire canonical docs to agents and skills
6. docs(agents): add STATE.md lifecycle section to executor
7. docs(workflows): deprecate start-task; use executor agent
8. docs(prompts): deprecate task-brief-template; use skill
```

All subject lines ≤ 72 chars (R10). Verify before each commit via `pre-commit-self-audit`.

**STATE.md bootstrap exemption:** brief 015 defines STATE.md lifecycle in Edit 6 (executor.md). It cannot use STATE.md lifecycle on itself (dependency loop). No `chore(state): start` commit precedes Edit 1; no `chore(state): remove` commit follows Edit 8. Same pattern as brief 013 bootstrap exemption for `pre-commit-self-audit`.

### Branch

```bash
git checkout main
git pull --ff-only origin main
git checkout -b docs/orchestration-reconciliation
```

### Push

**Do not push.** Push is the user's call (`CLAUDE.md` R17 / `GIT_WORKFLOW.md` G-R5). Stop after the final commit and report.

---

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (should show 8 commits in the order above)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Any verification checkbox from this brief that could not be met, with explanation
4. Aggregated `pre-commit-self-audit` results across the 8 Pause 3 runs (count PASS / count FAIL — no WARN, since the WARN state is removed in Edit 2e and the executor's own self-audit skill never used WARN)
5. Sweep results from Edit 7c and Edit 8d:
   - Files matched in each category (A/B/C)
   - Files modified in categories A and B (with substitutions applied)
   - Any STOP-and-report invocations from the sweeps
6. Confirmation that no `git push` was executed
7. Confirmation that no STATE.md was created (bootstrap exemption)
8. Suggested next step: open PR on GitHub against `main` using the PR template; once merged, the orchestration cluster (013→014→015) is closed and Phase 1 monorepo bootstrap can begin as the first task to use the new pipeline end-to-end.
