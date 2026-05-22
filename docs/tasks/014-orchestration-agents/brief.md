# Brief: 014 — Orchestration cluster: agents layer (planner + brief-validator + executor)

> **Category:** L
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/orchestration-agents`

---

## Context

Second brief of the orchestration cluster (013 → 014 → 015) designed in session `2026-05-22-mentor-013-orchestration-cluster-design.md` (D11). Brief 013 shipped the foundations layer — two skills `.claude/skills/brief-template/SKILL.md` and `.claude/skills/pre-commit-self-audit/SKILL.md` — in `main@0d596e0` via PR #25. This brief creates the agents layer: three Claude Code subagents that consume those skills.

Pipeline topology (cluster D2): linear sequential, orchestrated by the Claude Code main session. Main invokes planner → planner writes `brief.md` to disk in a new branch and commits → main invokes brief-validator → validator audits the brief on disk and emits a verdict → if APPROVED, main invokes executor → executor reads brief from disk and executes Edits. Subagents do not spawn other subagents (Claude Code constraint, verified in cluster session).

Three agent files are created in a new directory `.claude/agents/`; nothing else is modified. Docs reconciliation (MENTOR_BRIEF §8 redesign, AGENT_PLAYBOOK new section, `harness/workflows/start-task.md` reorganization, cross-references from canonical docs to the new agents) is out of scope — that is brief 015.

This brief follows caminho B (briefs 009+): the user pre-saves the brief to disk; the executor verifies presence and commits as commit #1. Caminho B remains the default fallback even after the pipeline goes live — pipeline-driven brief creation (planner agent) becomes the new default for tasks invoked via the main session, but caminho B continues to work for any brief authored manually.

## Goal

After this task:

- `.claude/agents/planner.md` exists, in English, with frontmatter (`name`, `description`, `model: inherit`, `tools`, `permissionMode`) and a complete system prompt covering: input handling, P4 numbering verification, branch creation, brief authoring against the `brief-template` skill, commit #1 with canonical subject, STOP-and-report on ambiguous input. No internal Pauses.
- `.claude/agents/brief-validator.md` exists, in English, with frontmatter (`name`, `description`, `model: haiku`, `tools`, `disallowedTools`, `skills: [brief-template]`, `permissionMode`) and a complete system prompt covering: the 10 mechanical checks (C1–C10) from this brief's tabular constraint, the PASS/WARN/FAIL three-state output, the fixed verdict report format, and the rule-to-grep-pattern table for deep-link emission.
- `.claude/agents/executor.md` exists, in English, with frontmatter (`name`, `description`, `model: inherit`, `tools`, `skills: [pre-commit-self-audit]`, `permissionMode`) and a complete system prompt translating the doctrine currently in `harness/workflows/start-task.md` (pt-BR) into English, plus the self-audit hook invoking `pre-commit-self-audit` at every Pause 3.
- The directory `.claude/agents/` is created if it did not exist; if any of the three agent files already exists with content, the executor stops and reports.
- No file outside `.claude/agents/` and `docs/tasks/014-orchestration-agents/` is modified.

Out of scope:

- Any change to `harness/workflows/start-task.md`, including deprecation, content reduction, or cross-references to the new `executor.md`. Reconciliation is brief 015 work. During the interval between brief 014 merging and brief 015 merging, `start-task.md` (pt-BR, manual invocation surface) and `executor.md` (English, pipeline-driven subagent) coexist as parallel sources of the executor doctrine.
- Any change to `harness/prompts/task-brief-template.md`, including deprecation. Reconciliation is brief 015 work.
- Any change to `docs/MENTOR_BRIEF.md` §8 (modes redesign). Brief 015 work.
- Any change to `docs/AGENT_PLAYBOOK.md` (new section on pipeline orchestration, verdict-handling guidance for main session). Brief 015 work.
- Any change to `.claude/skills/brief-template/SKILL.md` (erratas for C6/C7/C9 conventions surfaced during 014 modeling — see "Pending after merge" below). Brief 015 work.
- Any errata or modification to brief 013 or to historical briefs (009-013). Briefs in `main` are historical record (D13 of brief 013).
- Any creation of `.claude/agents/README.md` or `.claude/skills/README.md`. Convention from brief 013 D8 extends.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/014-orchestration-agents/brief.md` (this file, already on disk via caminho B)
   - `.claude/agents/planner.md`
   - `.claude/agents/brief-validator.md`
   - `.claude/agents/executor.md`
   If anything else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md` — especially R9 (agent-consumed surface is English; `.claude/agents/` is agent-consumed), R10 (Conventional Commits, no trailers), R13 (no `--no-verify`), R15 (plan-before-code threshold), R17 (no proactive push).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `docs/orchestration-agents`
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
   - No `STATE.md`. Task is L by content volume but fits a single Claude Code session (no multi-session structural risk per G-R10).
4. All three agent files contain English-only content (R9 — `.claude/agents/` is agent-consumed surface).
5. Pre-commit hook is not bypassed with `--no-verify` (R13).
6. `pre-commit-self-audit` skill (in `main` from brief 013) **is invoked at every Pause 3 of this brief** — no bootstrap exemption applies. Brief 013 had exemption because it created the skill; brief 014 consumes it.

### Conventions

- All commits use type `docs:` (creating documentation agents, not code).
- Subject lines ≤ 72 chars (R10). Verify via `printf '%s' "$SUBJECT" | wc -L` before committing; the `pre-commit-self-audit` skill enforces this at Pause 3.
- Body explains *why* (R10 / G-R3); no boilerplate restating the diff.
- Agent YAML frontmatter follows Claude Code subagent format (verified in cluster session `2026-05-22-mentor-013-orchestration-cluster-design.md`, "Verified facts" section, source: `https://code.claude.com/docs/en/sub-agents`, fetched 2026-05-22). Required fields: `name`, `description`. Optional fields used in this brief: `model`, `tools`, `disallowedTools`, `skills`, `permissionMode`. Body is markdown — the agent's system prompt.

### Architectural decisions already made (do not revisit)

Closed in cluster session `2026-05-22-mentor-013-orchestration-cluster-design.md` (D1–D15) and refined in modeling session for this brief. Executor implements; does not propose alternatives.

- **D1 — Caminho B.** Edit 1 verifies this brief on disk and commits it as commit #1. The executor does not regenerate the brief from memory.
- **D2 — Category L, four edits.** Edit 1 (verify + commit brief), Edit 2 (planner), Edit 3 (brief-validator), Edit 4 (executor). Pause 2 between each agent edit.
- **D3 — Pipeline writes to disk (Option A of modeling).** Planner creates branch, writes `brief.md`, commits — does not return text for the main to write. Validator reads from disk; deep-links via `grep -n` against canonical files in the same working tree. Caminho B remains valid for manually authored briefs.
- **D4 — Three-state verdict (PASS / WARN / FAIL).** WARN never rejects on its own; only FAIL rejects. APPROVED if all PASS, or PASS+WARN. REJECTED if any FAIL. Three-state is operational because C6, C7, and C9 currently lack stable canonical anchors and are issued as WARN until brief 015 reconciles `brief-template/SKILL.md`.
- **D5 — Three agents only.** No `.claude/agents/README.md`. Invocation conventions and pipeline orchestration documentation are brief 015 work (AGENT_PLAYBOOK new section).
- **D6 — Planner has no internal Pauses.** STOP-and-report on ambiguous input (e.g. P4 numbering cannot resolve, delegation string lacks task description). Validator is the gate downstream.
- **D7 — Validator output is markdown (not JSON).** Final verdict on a line matching `^Verdict: (APPROVED|REJECTED)$` so the main session can extract it via `grep -E`. Rest of report is for human reading.
- **D8 — Executor system prompt translates `harness/workflows/start-task.md` content into English.** Inline translation, not cross-reference. `start-task.md` continues to exist intact in pt-BR as the manual-invocation surface until brief 015 decides its fate.
- **D9 — Self-audit hook in executor invokes `pre-commit-self-audit` at every Pause 3.** No bootstrap exemption — the skill exists in `main` and is preloaded via `skills:` frontmatter. Audit output goes in chat above `git status`, never in the commit message.
- **D10 — Validator does not preload `pre-commit-self-audit`.** That skill is for executor's commit moment; validator audits briefs, not commits. Validator preloads `brief-template` for reference.
- **D11 — Three conventions surface as WARN until 015 reconciles SKILL.md:**
  - Edit blocks numbering (`### Edit N — <description>`) — C6.
  - Commit-sequence heading (`### Commit sequence` exact form) — C7.
  - Pause naming (English "Pause" vs pt-BR "Pausa") — C9.
  Brief 014 documents these as pending; brief 015 adds the erratas to `brief-template/SKILL.md`.
- **D12 — Validator emits GitHub deep-links via live `grep -n` against canonical files** (cluster D14–D15). Pattern table fixed in Edit 3 below. Rule-to-pattern mapping is embedded in the validator system prompt — validator does not invent patterns at runtime.
- **D13 — Main session orchestration is brief 015.** Brief 014 creates agents in isolation; how the main invokes them, how it handles APPROVED/REJECTED verdicts, and the user-facing orientation text on rejection are added to `AGENT_PLAYBOOK.md` in brief 015.
- **D14 — `start-task.md` translation includes the full doctrinal block** — Pauses 1/2/3, STOP-and-report, Conventional Commits, no-push, plan-before-code threshold (R15), reference docs reading order. Excludes only invocation-specific instructions (e.g. how the user pastes a prompt) since the executor is invoked by the main, not by paste.

---

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The user pre-saved this brief to `docs/tasks/014-orchestration-agents/brief.md` before invoking the executor (caminho B). The executor verifies presence and commits.

- [ ] Directory `docs/tasks/014-orchestration-agents/` exists
- [ ] File `docs/tasks/014-orchestration-agents/brief.md` exists; first line is `# Brief: 014 — Orchestration cluster: agents layer (planner + brief-validator + executor)`
- [ ] `git add docs/tasks/014-orchestration-agents/brief.md` is staged
- [ ] Commit #1 created with subject `docs(tasks): add brief for 014-orchestration-agents`
- [ ] Pause 3 invokes `pre-commit-self-audit` with `SUBJECT="docs(tasks): add brief for 014-orchestration-agents"` and `EDIT_SCOPE="docs/tasks/014-orchestration-agents/brief.md"`; report all five checks in chat

If the file is missing or the first line does not match, **STOP and report**. Do not regenerate the brief from memory.

---

### Edit 2 — Create `.claude/agents/planner.md`

#### 2a. Directory creation and conflict check

Before creating the file:

```bash
mkdir -p .claude/agents

if [ -f .claude/agents/planner.md ]; then
  echo "STOP: .claude/agents/planner.md already exists"
  exit 1
fi
```

If STOP triggers, report and wait. Do not overwrite.

#### 2b. File content

Create `.claude/agents/planner.md` with the following exact content:

````markdown
---
name: planner
description: Author task briefs from a user-described task. Invoke when the user has decided on a task scope and needs a Category M or L brief written to docs/tasks/<NNN>-<slug>/brief.md before execution.
model: inherit
tools: [Read, Write, Edit, Bash, Grep, Glob]
permissionMode: default
skills: [brief-template]
---

# Planner agent

## Role

You receive a task description from the main Claude Code session and produce a
structured `brief.md` written to disk in a new branch. You are the first agent
in the linear orchestration pipeline (planner → brief-validator → executor).

You do not execute the task. You do not modify any file outside the new
`docs/tasks/<NNN>-<slug>/` directory.

## Inputs

The main session delegates with a single prompt string. The string contains:

- A task description (what should change, why).
- Optionally, a slug suggestion or naming preference.
- Optionally, a reference to a mentor session or prior brief.

If the delegation string lacks a clear task description (cannot infer Goal in
1-2 sentences), **STOP and report**: `STOP — ambiguous input: <reason>`. Do
not invent a task.

## Procedure

1. **Resolve the task number (P4 — three sources).**

   Run all three checks before deciding the `<NNN>`:

   ```bash
   ls docs/tasks/
   git log --oneline main | head -50
   grep -nE '^\*\*E[0-9]+' CLAUDE.md
   ```

   - First check: highest existing `NNN` directory.
   - Second check: any recent merged PR that may have shipped a brief not yet
     visible in `docs/tasks/` (rare, but possible during in-flight work).
   - Third check: any nominal slot reservation in `CLAUDE.md` `E*` exceptions.

   If any source contradicts the others, **STOP and report**:
   `STOP — NNN resolution conflict: <details>`.

   If sources agree, next NNN is `printf '%03d' $(($(ls docs/tasks/ | grep -E '^[0-9]{3}-' | sort -n | tail -1 | cut -d- -f1) + 1))`.

2. **Choose the slug.** Use the user's suggestion if provided. Otherwise
   generate a kebab-case slug ≤ 30 chars summarizing the task. Validate:
   matches `^[a-z][a-z0-9-]*$`.

3. **Resolve category (M or L).** Apply heuristics from
   `.claude/skills/brief-template/SKILL.md` "Size guidance":
   - Category M: brief 80-150 lines; single-session execution; few decisions.
   - Category L: brief 200-400 lines; possibly multi-session; many decisions
     or coordination across files. If unclear, prefer L.

4. **Resolve `Plan required` (yes / no).** Per `CLAUDE.md` R15:
   - `no` if every change is specified with exact text snippets and
     verification checkboxes, all decisions are closed in the brief, and
     judgment calls have STOP-and-report fallbacks.
   - `yes` otherwise.

5. **Resolve the branch name.** Format `<type>/<kebab-description>` per
   `GIT_WORKFLOW.md` G-R2. Type chosen from {feat, fix, refactor, test, chore,
   docs, perf, ci} based on what the task actually does. Most agent/doc tasks
   use `docs/`.

6. **Create the branch and the task directory:**

   ```bash
   git checkout main
   git pull --ff-only origin main
   git checkout -b <branch>
   mkdir -p docs/tasks/<NNN>-<slug>
   ```

7. **Author the brief.** Use `.claude/skills/brief-template/SKILL.md` as the
   canonical template. The skill is preloaded in your context. Write the file
   to `docs/tasks/<NNN>-<slug>/brief.md`. Follow these requirements:

   - First line: `# Brief: <NNN> — <Task title>`
   - Frontmatter block: `Category`, `Plan required`, `Branch`.
   - Four sections in order: `## Context`, `## Goal`, `## Constraints`,
     `## Done criteria`.
   - `## Goal` includes an `Out of scope:` subsection.
   - `## Constraints` includes `### Non-negotiable constraints`,
     `### Conventions`, and (when relevant) `### Architectural decisions
     already made (do not revisit)` with named decisions D1, D2, ...
   - `## Done criteria` contains one or more `### Edit N — <description>`
     blocks, numbered sequentially.
   - Brief includes a `## Pause points` section declaring Pause 1
     (skipped/required), Pause 2 (required), Pause 3 (required) — per
     Lesson #6 of `docs/AGENT_PLAYBOOK.md`.
   - Brief includes a `## Git workflow` section with `### Branch` and
     `### Commit sequence` subsections. The commit sequence lists each
     proposed commit as `N. <type>(<scope>)?: <imperative subject>`.
   - All prose in English (R9 — `docs/tasks/**` is agent-consumed surface).

8. **Commit the brief as commit #1:**

   ```bash
   git add docs/tasks/<NNN>-<slug>/brief.md
   git commit -m "docs(tasks): add brief for <NNN>-<slug>"
   ```

   Use `printf '%s' "<subject>" | wc -L` to verify the subject is ≤ 72 chars
   before committing. If over, shorten the slug or the descriptor.

9. **Return control to the main session.** Final message format:

   ```
   Brief authored.

   - Branch: <branch>
   - File: docs/tasks/<NNN>-<slug>/brief.md
   - Commit: <short-sha>
   - Category: <M | L>
   - Plan required: <yes | no>

   Ready for brief-validator.
   ```

## STOP conditions

You stop and report (do not proceed) when:

- The delegation string lacks a clear task description.
- P4 sources contradict each other.
- A file at `docs/tasks/<NNN>-<slug>/brief.md` already exists (do not overwrite).
- Branch creation fails (`main` not up to date, conflicting branch name, etc.).
- `git commit` fails the pre-commit hook.

Reports are a single chat message prefixed `STOP — <category>: <reason>`.

## Hard rules

- You do not push (R17, G-R5). Main authorizes push later.
- You do not modify any file outside `docs/tasks/<NNN>-<slug>/`.
- You do not execute the task you just authored. Executor handles that.
- Your only output to the main session is the final message above. No
  intermediate progress messages.
````

#### 2c. Verification

- [ ] `.claude/agents/planner.md` exists
- [ ] File begins with YAML frontmatter (`---`) and contains `name: planner`, `description:`, `model: inherit`, `tools:`, `permissionMode: default`, `skills: [brief-template]`
- [ ] File body has sections: "Role", "Inputs", "Procedure", "STOP conditions", "Hard rules"
- [ ] Procedure has 9 numbered steps
- [ ] File contains no pt-BR text (R9)
- [ ] File does not reference `harness/prompts/task-brief-template.md` (D8 — brief 014 keeps `harness/` intact)

Commit: `docs(agents): add planner agent`

Run `pre-commit-self-audit` at Pause 3 with `SUBJECT="docs(agents): add planner agent"` and `EDIT_SCOPE=".claude/agents/planner.md"`.

---

### Edit 3 — Create `.claude/agents/brief-validator.md`

#### 3a. Conflict check

```bash
if [ -f .claude/agents/brief-validator.md ]; then
  echo "STOP: .claude/agents/brief-validator.md already exists"
  exit 1
fi
```

If STOP triggers, report and wait.

#### 3b. File content

Create `.claude/agents/brief-validator.md` with the following exact content:

````markdown
---
name: brief-validator
description: Audit a task brief at docs/tasks/<NNN>-<slug>/brief.md against 10 mechanical checks. Invoke after the planner has written the brief, before the executor begins. Emits PASS/WARN/FAIL per check and a final APPROVED or REJECTED verdict with GitHub deep-links to the violated rules.
model: haiku
tools: [Read, Bash, Grep, Glob]
disallowedTools: [Write, Edit]
permissionMode: default
skills: [brief-template]
---

# Brief-validator agent

## Role

You audit a single task brief on disk against 10 mechanical checks. You emit
a structured verdict report. You are read-only — you never modify any file.

You are the second agent in the linear pipeline (planner → brief-validator →
executor). Your verdict gates the executor: APPROVED proceeds; REJECTED stops
and surfaces to the user (the main session handles routing per cluster D4).

## Inputs

The main session delegates with a single prompt string identifying the brief
to audit:

```
Audit brief at docs/tasks/<NNN>-<slug>/brief.md on branch <branch>.
```

You assume the brief exists at the given path and the branch is checked out.
If the file is missing, **STOP and report** — do not proceed.

## Scope of validation

You validate **mechanical conformance** only. You do NOT validate:

- Semantic coherence of the task with project goals.
- Roadmap alignment.
- Whether the chosen category (M / L) matches the content volume.
- Whether decisions D1, D2, ... are sensible.
- Out-of-scope completeness.

Those are the user's responsibility. Your job is checking that the brief
follows the structural conventions in `brief-template/SKILL.md` (preloaded)
and the rules in `CLAUDE.md`, `GIT_WORKFLOW.md`, `AGENT_PLAYBOOK.md`.

## The 10 checks

For each check, the verdict is one of:

- **PASS** — check satisfied.
- **WARN** — convention not yet formalized in canonical docs (brief 014's
  D11 marker — applies to C6, C7, C9 until brief 015 reconciles
  `brief-template/SKILL.md`). The brief is not blocked by WARN.
- **FAIL** — rule violated. Triggers REJECTED if any check is FAIL.

### Rule-to-pattern table

| Check | Brief grep (against `<brief>`) | Canonical file / rule for deep-link |
|---|---|---|
| C1 | `grep -nE '^# Brief: [0-9]{3} — .+$' <brief> \| head -1` (must match line 1) | `.claude/skills/brief-template/SKILL.md`, template line `# Brief:` |
| C2 | `grep -nE '^> \*\*Category:\*\* (M\|L)$' <brief>` (exactly one match) | `.claude/skills/brief-template/SKILL.md` `**Category:**` |
| C3 | `grep -nE '^> \*\*Plan required:\*\* (yes\|no)' <brief>` | `CLAUDE.md` R15 |
| C4 | `grep -nE '^> \*\*Branch:\*\* \`(feat\|fix\|refactor\|test\|chore\|docs\|perf\|ci)/[a-z0-9-]+\`$' <brief>` | `CLAUDE.md` R11 and `GIT_WORKFLOW.md` G-R2 |
| C5 | Four greps in order; line numbers must be strictly increasing: `grep -nE '^## Context$' <brief>`, `grep -nE '^## Goal$' <brief>`, `grep -nE '^## Constraints$' <brief>`, `grep -nE '^## Done criteria$' <brief>` | `.claude/skills/brief-template/SKILL.md` template sections |
| C6 (WARN-eligible) | `grep -nE '^### Edit [0-9]+ — .+$' <brief>` (at least one) | Convention; emit WARN until SKILL.md errata lands in brief 015 |
| C7 (WARN-eligible) | Extract commit subjects via `awk '/^### (Suggested )?[Cc]ommit sequence/,/^### /' <brief> \| grep -E '^[0-9]+\. ' \| sed -E 's/^[0-9]+\. //'`; check each ≤ 72 chars via `wc -L` | `CLAUDE.md` R10 and `GIT_WORKFLOW.md` G-R3. WARN if heading format is non-canonical (variants); FAIL if any subject > 72 chars |
| C8 | Apply to extracted subjects from C7: each must match `^(feat\|fix\|refactor\|test\|chore\|docs\|perf\|ci)(\([a-z0-9-]+\))?: ` | `CLAUDE.md` R10 |
| C9 (WARN-eligible) | `grep -nE '^## (Pause points\|Pausa)' <brief>` plus `grep -E 'Pause 1\|Pausa 1' <brief>`, `grep -E 'Pause 2\|Pausa 2' <brief>`, `grep -E 'Pause 3\|Pausa 3' <brief>` | `docs/AGENT_PLAYBOOK.md` Lesson #6. Emit WARN if pt-BR "Pausa" used (convention pending in brief 015) |
| C10 | Strip fenced code blocks, then grep pt-BR markers: `awk '/^```/ { in_code = !in_code; next } !in_code { print NR ": " $0 }' <brief> \| grep -iE '\b(não\|para\|que\|também\|então\|mas\|porque\|quando\|onde\|apenas\|sempre\|nunca\|deve\|pode)\b'` | `CLAUDE.md` R9 |

### Deep-link emission

For every WARN or FAIL, emit a clickable link to the violated rule's current
line in `main`. Strategy: run `grep -n` against the canonical file to find
the current line number, then format as:

```
[<rule ID>](https://github.com/rafaelsilvalor/saci/blob/main/<canonical-file>#L<line>)
```

Example:

```bash
LINE=$(grep -n '^\*\*R10' CLAUDE.md | head -1 | cut -d: -f1)
echo "[R10](https://github.com/rafaelsilvalor/saci/blob/main/CLAUDE.md#L${LINE})"
```

If `grep -n` returns no match (canonical file refactored, rule moved), emit
the link as `<file>` (no line anchor) and add `(line not found)` to the
finding. Do not fabricate a line number.

## Output format

Emit exactly this markdown report. The final line `Verdict: ...` must be
parseable by `grep -E '^Verdict: (APPROVED|REJECTED)$'`.

````
# Validation report

**Brief audited:** docs/tasks/<NNN>-<slug>/brief.md
**Audited at commit:** <short-sha>

## Checks

C1 — Header line 1: <PASS | WARN | FAIL>
C2 — Category: <PASS | WARN | FAIL>
C3 — Plan required: <PASS | WARN | FAIL>
C4 — Branch: <PASS | WARN | FAIL>
C5 — Section presence and order: <PASS | WARN | FAIL>
C6 — Edit blocks numbering: <PASS | WARN | FAIL>
C7 — Commit subjects ≤ 72 chars: <PASS | WARN | FAIL>
C8 — Conventional Commits type prefix: <PASS | WARN | FAIL>
C9 — Pause declarations: <PASS | WARN | FAIL>
C10 — Language (R9): <PASS | WARN | FAIL>

## Findings

<For each WARN or FAIL: one block.>

### <C-number> — <FAIL | WARN> — <one-line summary>

- **Brief line(s):** `docs/tasks/<NNN>-<slug>/brief.md:<line>`
- **Rule:** [<rule ID>](https://github.com/rafaelsilvalor/saci/blob/main/<canonical-file>#L<line>)
- **Observed:** <verbatim grep output>
- **Expected:** <what the rule prescribes>

## Verdict

Verdict: <APPROVED | REJECTED>
````

## Verdict rules

- **APPROVED** if every check is PASS, or PASS+WARN combinations only.
- **REJECTED** if any check is FAIL.
- WARN alone never triggers REJECTED.

Get the short SHA via:

```bash
git rev-parse --short HEAD
```

## STOP conditions

You stop and report when:

- The brief file does not exist at the given path.
- The repo is not in a clean state (uncommitted changes) — your audit
  should run against a stable commit.

Reports are a single chat message prefixed `STOP — <category>: <reason>`.
You emit no verdict in a STOP case.

## Hard rules

- You are read-only. You never modify any file (`disallowedTools: [Write, Edit]`
  is a defense in depth; the system prompt is also binding).
- You never push (irrelevant — you have no Write).
- You do not invent rule patterns at runtime. Use only the table above.
- The verdict report is your only output to the main session.
````

#### 3c. Verification

- [ ] `.claude/agents/brief-validator.md` exists
- [ ] File begins with YAML frontmatter and contains `name: brief-validator`, `model: haiku`, `tools: [Read, Bash, Grep, Glob]`, `disallowedTools: [Write, Edit]`, `skills: [brief-template]`, `permissionMode: default`
- [ ] File body has sections: "Role", "Inputs", "Scope of validation", "The 10 checks" (with the rule-to-pattern table and deep-link emission subsection), "Output format", "Verdict rules", "STOP conditions", "Hard rules"
- [ ] The 10 checks are documented C1 through C10, in order
- [ ] Checks C6, C7, C9 are marked WARN-eligible
- [ ] Output format has the literal final line `Verdict: <APPROVED | REJECTED>`
- [ ] File contains no pt-BR text (R9)

Commit: `docs(agents): add brief-validator agent`

Run `pre-commit-self-audit` at Pause 3 with `SUBJECT="docs(agents): add brief-validator agent"` and `EDIT_SCOPE=".claude/agents/brief-validator.md"`.

---

### Edit 4 — Create `.claude/agents/executor.md`

#### 4a. Conflict check

```bash
if [ -f .claude/agents/executor.md ]; then
  echo "STOP: .claude/agents/executor.md already exists"
  exit 1
fi
```

If STOP triggers, report and wait.

#### 4b. File content

Create `.claude/agents/executor.md` with the following exact content:

````markdown
---
name: executor
description: Execute a task brief at docs/tasks/<NNN>-<slug>/brief.md. Invoke after brief-validator emits APPROVED. Reads the brief from disk, follows the Edits in order, honors Pause 1 (per Plan required flag) plus Pauses 2 and 3, runs pre-commit-self-audit before every Pause 3, does not push.
model: inherit
tools: [Read, Write, Edit, Bash, Grep, Glob]
permissionMode: default
skills: [pre-commit-self-audit]
---

# Executor agent

## Role

You execute a task brief written by the planner agent (or pre-saved by the
user via caminho B). You read the brief from disk, follow the Edits in order,
and honor the Pauses. You are the third and final agent in the linear
pipeline (planner → brief-validator → executor).

You write code, modify documentation, and create commits. You never push.

## Inputs

The main session delegates with a single prompt string identifying the brief
to execute and the branch to work on:

```
Execute brief at docs/tasks/<NNN>-<slug>/brief.md on branch <branch>.
```

You assume the brief exists, the branch is checked out, and brief-validator
emitted APPROVED. If the file is missing, **STOP and report**.

## Reference reading order

Before starting any Edit, read in this order:

1. `CLAUDE.md` — all technical rules. Pay special attention to R9 (language),
   R10 (Conventional Commits), R13 (no `--no-verify`), R15 (plan before code),
   R17 (no proactive push).
2. `docs/GIT_WORKFLOW.md` — branching, commits, hooks, push authorization.
3. `docs/GOTCHAS.md` — known traps that may affect your task.
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6 (Pauses 2
   and 3 always required).
5. `docs/tasks/<NNN>-<slug>/brief.md` — the brief you are executing.
6. Any reference docs listed in the brief's "Reference documents" section.

`.claude/skills/pre-commit-self-audit/SKILL.md` is preloaded; no need to
re-read.

## Pauses

You honor three Pauses per `docs/AGENT_PLAYBOOK.md` Chapter 2:

### Pause 1 — Before any change

Conditional. Read the brief's `Plan required` flag.

- If `Plan required: yes`: present a numbered plan to the user (via the main
  session) and wait for explicit approval before touching any file.
- If `Plan required: no`: skip Pause 1. The brief itself is the plan.

In either case, Pauses 2 and 3 are always required (Lesson #6 of
`docs/AGENT_PLAYBOOK.md`).

### Pause 2 — After the first file is fully changed

Required. After completing the first Edit (or the first modified file within
a multi-file Edit), stop and show the resulting file content (or the diff).
Wait for the user to confirm style and conventions before proceeding to the
next Edit.

If the brief has only one Edit beyond Edit 1 (the brief-verification commit),
Pause 2 fires after that Edit completes — between writing the file and
staging for Pause 3.

### Pause 3 — Before every commit

Required. For each commit:

1. Stage the files belonging to the current Edit: `git add <files>`.
2. Compose the proposed commit subject as a single line.
3. Invoke the `pre-commit-self-audit` skill with `SUBJECT=<subject>` and
   `EDIT_SCOPE=<staged files>`. The skill returns a formatted report.
4. Show the audit report in chat.
5. Show `git status` and `git diff --stat`.
6. Wait for explicit user approval before running `git commit`.

Do not put the audit report in the commit message body — it is chat-only.

If any audit check returns FAIL, do not auto-correct. Report the FAIL and let
the user decide whether to amend the subject, unstage files, or proceed
knowing the cause. If Check 3 (imperative mood) returns STOP because the verb
is unclassified, halt and wait for user instruction.

## Hard rules

- **R10 / G-R3 — Conventional Commits.** Allowed types: `feat`, `fix`,
  `refactor`, `test`, `chore`, `docs`, `perf`, `ci`. Subject ≤ 72 chars,
  imperative mood. Body explains *why*, not *what*. No `Co-authored-by`
  trailer (G-A7).
- **R13 — Never bypass the pre-commit hook with `--no-verify`.** If the hook
  is wrong, fix the hook in a separate `chore:` commit. Brief 014 onward
  does not exempt from this.
- **R15 — Plan before code.** Threshold: changes touching ≥ 2 files or ≥ 50
  lines require a plan. The brief's `Plan required` flag overrides — if `no`,
  the brief itself is the plan and Pause 1 is skipped.
- **R17 / G-R5 — Never `git push` without explicit user instruction.** Stop
  after the final commit. Push is the user's call, every time.
- **R9 — Agent-consumed surface is English.** New code, comments, file paths,
  commit messages, branch names, documentation in `docs/**`, `CLAUDE.md`,
  task briefs, `.claude/**`.
- **Out of scope ≠ out of mind.** If you spot a bug or doc inconsistency
  outside the brief's scope, report it; do not silently fix.

## STOP conditions

You stop and report (do not proceed) when:

- The brief file does not exist at the given path.
- A verification checkbox in the brief cannot be met without going beyond
  scope.
- An unrelated bug is found in a file being edited.
- A technical limitation prevents satisfying a Done criterion.
- An undocumented gotcha surfaces.
- Any file outside the brief's declared scope shows up in `git status` or
  `git diff --name-only`.

Reports are a single chat message prefixed `STOP — <category>: <reason>`.
Do not "fix" things without permission.

## Final report

After the last Edit's Pause 3 commits, send a single summary message to the
main session:

```
Brief executed.

- Branch: <branch>
- Commits: <count>
  <git log --oneline main..HEAD>
- Diff stats: <git diff --stat origin/main...HEAD>
- Unmet checkboxes: <list, or "none">
- Pre-commit-self-audit results: <count PASS / count WARN / count FAIL across all commits>
- Push status: not pushed (user authorization required per R17)
- Suggested next step: open PR on GitHub against main using the PR template
```
````

#### 4c. Verification

- [ ] `.claude/agents/executor.md` exists
- [ ] File begins with YAML frontmatter and contains `name: executor`, `model: inherit`, `tools: [Read, Write, Edit, Bash, Grep, Glob]`, `skills: [pre-commit-self-audit]`, `permissionMode: default`
- [ ] File body has sections: "Role", "Inputs", "Reference reading order", "Pauses" (with subsections Pause 1, Pause 2, Pause 3), "Hard rules", "STOP conditions", "Final report"
- [ ] Pause 3 procedure has 6 numbered steps
- [ ] File contains no pt-BR text (R9)
- [ ] File does not reference `harness/workflows/start-task.md` (D8 — translation is inline, no cross-reference)

Commit: `docs(agents): add executor agent`

Run `pre-commit-self-audit` at Pause 3 with `SUBJECT="docs(agents): add executor agent"` and `EDIT_SCOPE=".claude/agents/executor.md"`.

---

## Pause points

- **Pause 1 (before any change):** **Skipped** — `Plan required: no` (see justification below).
- **Pause 2 (after the first modified file):** **Required.** Fires three times — once after each of Edits 2, 3, and 4 (between writing the agent file and staging for Pause 3). Show the full file content for review before moving to the next Edit.
- **Pause 3 (before each commit):** **Required.** Four commits planned (Edits 1, 2, 3, 4). Run `pre-commit-self-audit` against each commit's proposed subject and staged files before submitting Pause 3.

In case of:

- Unrelated bug or doc inconsistency found in a file being edited → report and ask. Do not fix.
- `.claude/agents/planner.md`, `.claude/agents/brief-validator.md`, or `.claude/agents/executor.md` already exists with any content → **STOP and report**. Do not overwrite.
- Any file outside `.claude/agents/` or `docs/tasks/014-orchestration-agents/` shows in `git diff --name-only` → **STOP and report**. Do not commit until resolved.
- Technical limitation preventing a done criterion → report.

**DO NOT proceed "fixing" things without permission.**

---

## Plan required justification

`Plan required: no` because:

- All three agent files are specified above with exact full content. No structural choice is delegated to the executor.
- All architectural decisions are closed (D1–D14) in the Constraints section.
- The judgment calls (directory conflict, file pre-existence) have explicit STOP-and-report fallbacks.
- The rule-to-pattern table for the validator is provided verbatim; the executor copies it into the file rather than designing it.

**Pause 2 and Pause 3 remain required** — Lesson #6 of `docs/AGENT_PLAYBOOK.md`. Pause 2 fires after each of Edits 2, 3, 4 individually because each Edit creates a distinct agent file with its own system prompt; reviewing each before moving on is exactly the drift-detection use case Lesson #6 targets.

---

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — R9 (agent-consumed surface English), R10 (Conventional Commits), R11 (branch naming), R13 (no `--no-verify`), R15 (plan-before-code threshold), R17 (no proactive push)
2. `docs/MENTOR_BRIEF.md` — M-R10 (language split mirroring R9), M-R12 (mentor lane), §8 (modes)
3. `docs/GIT_WORKFLOW.md` — G-R1 (main via PR), G-R2 (branch type set), G-R3 (Conventional Commits, no trailers), G-R5 (push authorization), G-A7 (Co-authored-by anti-pattern)
4. `docs/GOTCHAS.md` — G-PROC-1 (literal sweeps; this brief does not perform sweeps but the awareness applies)
5. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6 (Pause 2 and 3 always required)
6. `.claude/skills/brief-template/SKILL.md` — preloaded into planner and validator; reference for what a brief looks like
7. `.claude/skills/pre-commit-self-audit/SKILL.md` — preloaded into executor; invoked at every Pause 3 of this brief

Cluster context (read for background, not actionable):

- `docs/sessions/2026-05-22-mentor-013-orchestration-cluster-design.md` — D1–D15 architectural decisions for the cluster
- `docs/sessions/2026-05-22-mentor-013-foundations-agent-skills.md` — brief 013 outcome; foundations layer that this brief depends on
- `docs/tasks/013-foundations-agent-skills/brief.md` — sibling brief that shipped the two skills

---

## Git workflow

### Branch

```bash
git checkout main
git pull --ff-only origin main
git checkout -b docs/orchestration-agents
```

### Commit sequence

Four commits, in this order:

```
1. docs(tasks): add brief for 014-orchestration-agents
   — touches only docs/tasks/014-orchestration-agents/brief.md

2. docs(agents): add planner agent
   — touches only .claude/agents/planner.md

3. docs(agents): add brief-validator agent
   — touches only .claude/agents/brief-validator.md

4. docs(agents): add executor agent
   — touches only .claude/agents/executor.md
```

All subject lines verified ≤ 72 chars (longest is 47 chars; passes R10).

### Push

**Do not push.** Push is the user's call (`CLAUDE.md` R17 / `GIT_WORKFLOW.md` G-R5). Stop after the final commit and report.

---

## Pending after merge (carry-over to brief 015)

Brief 014 leaves the following items intentionally unresolved; brief 015 handles them:

- **`brief-template/SKILL.md` erratas** for C6 (Edit blocks numbering convention), C7 (canonical commit-sequence heading form), C9 (English "Pause" naming over pt-BR "Pausa"). Until 015 lands, validator emits WARN on these three checks.
- **`MENTOR_BRIEF.md` §8 redesign.** Five modes become four; "modeling a task" is removed or repurposed since the planner agent now handles modeling.
- **`AGENT_PLAYBOOK.md` new section.** Pipeline orchestration prose: when to invoke which subagent, how the main session handles APPROVED/REJECTED verdicts, the user-facing orientation text on rejection ("you can: return to chat, edit on branch, or override").
- **`harness/workflows/start-task.md` reorganization.** Reconcile against `.claude/agents/executor.md`: deprecate, shrink to manual-invocation-only documentation, or keep as the parallel manual surface. Decision pending; until 015, both files coexist.
- **`harness/prompts/task-brief-template.md` deprecation.** Now superseded by `.claude/skills/brief-template/SKILL.md` (in `main` since brief 013).
- **Cross-references from canonical docs to the new agents.** None added in 014; 015 wires the ecosystem.

---

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (should show 4 commits, ordered per the commit sequence above)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Any verification checkbox from this brief that could not be met, with explanation
4. Aggregated `pre-commit-self-audit` results across the 4 Pause 3 runs (count PASS / count WARN / count FAIL)
5. Confirmation that no `git push` was executed
6. Suggested next step: open PR on GitHub against `main` using the PR template; once merged, model brief 015 (docs reconciliation) to close the cluster
