# Brief: 013 — Foundations: agent skills (brief-template + pre-commit-self-audit)

> **Category:** M
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/foundations-agent-skills`

---

## Context

First brief of the orchestration cluster (013 → 014 → 015) designed in session `2026-05-22-mentor-013-orchestration-cluster-design.md` (D11). The cluster builds three Claude Code subagents (planner, brief-validator, executor) plus two supporting skills plus docs reconciliation. This brief covers the **foundations layer**: the two skills the subagents will depend on. Subagents themselves are out of scope for 013 (that's 014); docs reconciliation around the new pipeline is out of scope for 013 (that's 015).

Both skills already have closed designs from the cluster session:

1. **`brief-template`** — formalizes the brief authoring contract as a `.claude/skills/` artifact, derived from `harness/prompts/task-brief-template.md`. D9 of the cluster session decided this migration; this brief executes it.
2. **`pre-commit-self-audit`** — mechanical 5-check audit run by the executor before every Pausa 3 (per D7: validator does not intercept Pausas; executor self-audits). The 5 checks are listed in the session opener carry-over.

No application code is touched. No new dependency is added. Two new files are created in a new directory `.claude/skills/`; nothing else is modified.

This brief follows caminho B (briefs 009+): the user pre-saves the brief to disk; the executor verifies presence and commits as commit #1, rather than receiving the brief text in the invocation prompt.

## Goal

After this task:

- `.claude/skills/brief-template/SKILL.md` exists, in English, mirroring the structure and content of `harness/prompts/task-brief-template.md` adapted to the Claude Code skill format (YAML frontmatter + body), with two known ambiguities from the source resolved explicitly.
- `.claude/skills/pre-commit-self-audit/SKILL.md` exists, in English, with five mechanical checks documented in mixed format (1-line description + bash snippet + pass/fail interpretation per check), invocation criteria stated in frontmatter and body, output format fixed.
- The directory `.claude/skills/` is created if it did not exist; if either skill subdirectory already exists with content, the executor stops and reports.
- No file outside `.claude/skills/` and `docs/tasks/013-foundations-agent-skills/` is modified.

Out of scope:

- Any change to `harness/prompts/task-brief-template.md` (including deprecation, cross-references, or any acknowledgment that the skill now exists). Reconciliation is brief 015 work.
- Any change to `harness/workflows/start-task.md` or other workflow files referencing the brief template. Brief 015 work.
- Creating any `.claude/agents/*.md` (planner, brief-validator, executor). Brief 014 work.
- Modifying `MENTOR_BRIEF.md` §8 or `AGENT_PLAYBOOK.md`. Brief 015 work.
- Promoting draft skills (`commit-discipline.md`, `task-pauses-protocol.md` under `harness/skills-plan/`) to active skills. Deferred indefinitely (was carry-over of the "old 013"; superseded by this brief's scope).
- Any renumbering of historical references in recaps or briefs. None exists in canonical docs (`CLAUDE.md` E*, `ROADMAP.md`) to renumber.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/013-foundations-agent-skills/brief.md` (this file, already on disk)
   - `.claude/skills/brief-template/SKILL.md`
   - `.claude/skills/pre-commit-self-audit/SKILL.md`
   If anything else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md` — especially R9 (agent-consumed surface is English), R10 (Conventional Commits, no trailers), R13 (no `--no-verify`), R15 (plan-before-code threshold), R17 (no proactive push).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `docs/foundations-agent-skills`
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
   - No `STATE.md` (task is M, single-session; G-R10)
4. Both SKILL.md files contain English-only content (R9 — `.claude/skills/` is agent-consumed surface).
5. Pre-commit hook is not bypassed with `--no-verify` (R13).
6. The "When to invoke" section of each skill is informational only — does not modify or contradict any external file. Cross-referencing from workflows or templates is deferred to brief 015.

### Conventions

- All commits use type `docs:` (creating documentation skills, not code).
- Subject lines ≤ 72 chars (R10). Verify via `wc -L <(echo "<subject>")` before committing.
- Body explains *why* (R10 / G-R3); no boilerplate restating the diff.
- Skill YAML frontmatter follows Claude Code subagent skill format (verified in cluster session, source: `https://code.claude.com/docs/en/sub-agents`, fetched 2026-05-22): required fields are `name` and `description`. Body is markdown.

### Architectural decisions already made (do not revisit)

Closed in session 2026-05-22 (cluster design, D9 / D7) and ratified in this modeling session. Executor implements; does not propose alternatives.

- **D1 — caminho B.** Edit 1 verifies the brief on disk and commits it as commit #1. The executor does not regenerate the brief from memory.
- **D2 — `brief-template/SKILL.md` derivation: migration + ambiguity auto-resolve.** Copy the structural content of `harness/prompts/task-brief-template.md`; adapt frontmatter to skill format; resolve two named ambiguities (see D3). Do not rewrite from scratch; do not sweep for additional cleanups.
- **D3 — Two ambiguities resolved during the migration:**
  - "current `docs/tasks/<NNN>/brief.md`" (from session 012, resolved at runtime via reading (i)) → replace with explicit distinction: "in-flight brief" (in an open PR, not merged) vs. "historical brief" (merged, immutable).
  - "Edit 1 — Save this brief verbatim" stub → omit entirely. Caminho B is the default; not a footnote.
- **D4 — Skill content full English (R9).** Including the body of `brief-template/SKILL.md`, including the example-filled sections (Decision 1, Decision 2; Automated/Structural/Behavior/Git/Process checks). The pt-BR source remains untouched in `harness/prompts/`.
- **D5 — Example-filled sections migrate.** The agent-readable signal of "here's a worked example of the checklist" is preserved. Examples remain illustrative; agent does not copy them verbatim into a real brief.
- **D6 — `pre-commit-self-audit/SKILL.md` format: mixed.** Each check has (a) 1-line description of what it verifies, (b) bash snippet runnable as-is, (c) pass/fail interpretation. Structure mirrors `docs/GOTCHAS.md` entries.
- **D7 — Imperative mood check: allowlist + denylist of verbs.** Allowlist: `add, fix, update, remove, refactor, rename, document, migrate, port, bump, drop, restore, revert, support`. Denylist: `added, fixing, updates, fixes, adding, updating, removed, refactored, renamed, documented, migrated, ported, bumped, dropped, restored, reverted, supported`. Verbs not in either list trigger STOP-and-report (do not auto-classify).
- **D8 — Invocation criteria documented in each SKILL.md** (frontmatter `description` + body section "When to invoke"). No `.claude/skills/README.md` is created. AGENT_PLAYBOOK pipeline description is brief 015 work.
- **D9 — Self-audit invocation: every commit (Pausa 3).** Not per-edit, not final-only. Executor runs the audit, reports the formatted output in chat, then submits Pausa 3 for user approval.
- **D10 — Self-audit output format fixed.** Reported in chat, never in the commit message. Format specified in the SKILL.md body (see Edit 3 below). Failures show `FAIL` plus one-line cause and suggestion; executor does not auto-correct.
- **D11 — `.claude/skills/` may not exist yet.** Edit 2 creates the parent directory if absent. If either skill subdirectory already exists with any content, STOP and report — do not overwrite.
- **D12 — No cross-references from `harness/` files.** Cross-referencing the new skills from `harness/prompts/task-brief-template.md`, `harness/workflows/start-task.md`, or anywhere else is **brief 015 scope**, not 013.
- **D13 — "Old 013" carry-over (executor memory placement, no-verbal-override pattern, draft skill promotion) is not renumbered.** No structured slot reservation exists in `CLAUDE.md` E*, `ROADMAP.md`, or anywhere else. These items remain as pending notes in recaps; they will be revisited post-Phase-1 if still relevant.

---

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The user pre-saved this brief to `docs/tasks/013-foundations-agent-skills/brief.md` before invoking the executor (caminho B). The executor verifies presence and commits.

- [ ] Directory `docs/tasks/013-foundations-agent-skills/` exists
- [ ] File `docs/tasks/013-foundations-agent-skills/brief.md` exists; first line is `# Brief: 013 — Foundations: agent skills (brief-template + pre-commit-self-audit)`
- [ ] `git add docs/tasks/013-foundations-agent-skills/brief.md` is staged
- [ ] Commit #1 created with subject `docs(tasks): add brief for 013-foundations-agent-skills`

If the file is missing or the first line does not match, **STOP and report**. Do not regenerate the brief from memory.

---

### Edit 2 — Create `.claude/skills/brief-template/SKILL.md`

#### 2a. Directory creation and conflict check

Before creating the file:

```bash
# If the parent .claude/skills/ does not exist, create it.
mkdir -p .claude/skills

# Check for conflict: if .claude/skills/brief-template/ exists with any content, STOP.
if [ -d .claude/skills/brief-template ] && [ -n "$(ls -A .claude/skills/brief-template 2>/dev/null)" ]; then
  echo "STOP: .claude/skills/brief-template/ already exists with content"
  exit 1
fi

mkdir -p .claude/skills/brief-template
```

If STOP triggers, report and wait for user instruction. Do not overwrite.

#### 2b. File content

Create `.claude/skills/brief-template/SKILL.md` with the following exact content:

```markdown
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

## Size guidance

- **Category M task:** 80-150 lines of brief.
- **Category L task:** 200-400 lines of brief.

If the brief exceeds 400 lines, the task is likely XL in disguise — break it
into smaller briefs. If under 80 lines, the task is likely Category S — no
brief needed; a chat message is enough.
```

#### 2c. Verification

- [ ] `.claude/skills/brief-template/SKILL.md` exists
- [ ] File begins with YAML frontmatter (`---`) and contains `name: brief-template` and a `description:` field
- [ ] File body has sections: "When to invoke", "What this skill provides", "Brief lifecycle (caminho B)", "Template", "Authoring principles", "Size guidance"
- [ ] File contains no pt-BR text (R9; verify via spot-check or grep for common pt-BR words like "que", "para", "não" inside running prose — exclude code blocks where words coincide)
- [ ] File does not reference `harness/prompts/task-brief-template.md` (D12 — cross-referencing is brief 015 scope)
- [ ] File contains no "Edit 1 — Save this brief verbatim" stub (D3)

Commit: `docs(skills): add brief-template skill`

---

### Edit 3 — Create `.claude/skills/pre-commit-self-audit/SKILL.md`

#### 3a. Conflict check

```bash
# .claude/skills/ already exists from Edit 2; verify no conflict for the new subdir.
if [ -d .claude/skills/pre-commit-self-audit ] && [ -n "$(ls -A .claude/skills/pre-commit-self-audit 2>/dev/null)" ]; then
  echo "STOP: .claude/skills/pre-commit-self-audit/ already exists with content"
  exit 1
fi

mkdir -p .claude/skills/pre-commit-self-audit
```

If STOP triggers, report and wait. Do not overwrite.

#### 3b. File content

Create `.claude/skills/pre-commit-self-audit/SKILL.md` with the following exact content:

````markdown
---
name: pre-commit-self-audit
description: Mechanical 5-check audit run by the executor before every Pause 3 submission. Invoke after staging changes for a commit and before showing git status to the user.
---

# Skill: pre-commit-self-audit

## When to invoke

Before every Pause 3 submission. After `git add` has staged the files for the
proposed commit, before showing `git status` and the proposed commit message
to the user. The audit runs five mechanical checks against the staged state
and the proposed commit subject. Output is reported in chat; user reviews
output alongside `git status` and `git diff --stat`.

Do not invoke for `git commit --amend` without re-staging. Do not invoke as
part of `git push` flow (push has its own user authorization step per G-R5).

## What this skill provides

Five checks. Each has a runnable bash snippet and a pass/fail interpretation.
The first four checks operate on the proposed commit subject (passed in by the
caller). The fifth check operates on the currently staged files. All five run
sequentially; do not short-circuit on first failure — report all results.

The skill does NOT auto-correct on failure. On any FAIL, the executor pauses
and reports to the user; the user decides whether to amend the subject,
unstage files, or proceed knowing the cause.

## Inputs

- `SUBJECT` — the proposed commit subject line (single line, no body).
- `EDIT_SCOPE` — list of files the executor intends this commit to cover
  (paths relative to repo root).

## Checks

### Check 1 — Subject length ≤ 72 chars

**Rule:** `CLAUDE.md` R10, `GIT_WORKFLOW.md` G-R3. Subject lines longer than
72 chars break terminal display and `git log --oneline` readability.

```bash
SUBJECT_LEN=$(printf '%s' "$SUBJECT" | wc -L)
if [ "$SUBJECT_LEN" -le 72 ]; then
  echo "  subject length (≤72): PASS ($SUBJECT_LEN)"
else
  echo "  subject length (≤72): FAIL ($SUBJECT_LEN) — shorten subject"
fi
```

### Check 2 — Conventional Commits type prefix

**Rule:** `CLAUDE.md` R10, `GIT_WORKFLOW.md` G-R3. Subject must start with an
allowed type, optional scope in parens, then `: <imperative subject>`.
Allowed types: `feat, fix, refactor, test, chore, docs, perf, ci`.

```bash
if printf '%s' "$SUBJECT" | grep -qE '^(feat|fix|refactor|test|chore|docs|perf|ci)(\([a-z0-9-]+\))?: .+'; then
  TYPE=$(printf '%s' "$SUBJECT" | sed -E 's/^([a-z]+).*/\1/')
  echo "  conventional commits type: PASS ($TYPE)"
else
  echo "  conventional commits type: FAIL — expected <type>(<scope>)?: <subject>"
fi
```

### Check 3 — Imperative mood verb (allowlist / denylist)

**Rule:** `CLAUDE.md` R10, `GIT_WORKFLOW.md` G-R3. The first word of the
subject (after the type prefix and colon) must be an imperative-mood verb.

Allowlist (PASS): `add, fix, update, remove, refactor, rename, document,
migrate, port, bump, drop, restore, revert, support`.

Denylist (FAIL): `added, fixing, updates, fixes, adding, updating, removed,
refactored, renamed, documented, migrated, ported, bumped, dropped, restored,
reverted, supported`.

Verb not in either list: STOP and report — do not auto-classify.

```bash
VERB=$(printf '%s' "$SUBJECT" | sed -E 's/^[a-z]+(\([a-z0-9-]+\))?: ([a-z]+).*/\2/' | tr '[:upper:]' '[:lower:]')
ALLOW="add fix update remove refactor rename document migrate port bump drop restore revert support"
DENY="added fixing updates fixes adding updating removed refactored renamed documented migrated ported bumped dropped restored reverted supported"

if printf '%s\n' $ALLOW | grep -qx "$VERB"; then
  echo "  imperative mood: PASS ($VERB)"
elif printf '%s\n' $DENY | grep -qx "$VERB"; then
  echo "  imperative mood: FAIL ($VERB) — use imperative form (e.g. 'add' not 'added')"
else
  echo "  imperative mood: STOP — verb '$VERB' not in allowlist or denylist; manual review required"
fi
```

### Check 4 — No `Co-authored-by` trailer staged

**Rule:** `CLAUDE.md` R10, `GIT_WORKFLOW.md` G-R3, G-A7. No commit in this
project carries the `Co-authored-by` trailer. Audit checks the proposed
commit message — at audit time, the message exists only as `SUBJECT` plus
whatever body the executor plans to attach. If the body is being assembled
in a temporary file, audit it.

```bash
# Subject alone cannot carry Co-authored-by (single line). If the executor
# uses a commit message file, audit it. Otherwise, this check is trivially PASS
# since `git commit -m "$SUBJECT"` has no body.

if [ -n "${COMMIT_MSG_FILE:-}" ] && [ -f "$COMMIT_MSG_FILE" ]; then
  if grep -qi '^co-authored-by:' "$COMMIT_MSG_FILE"; then
    echo "  no Co-authored-by: FAIL — remove trailer from commit message file"
  else
    echo "  no Co-authored-by: PASS"
  fi
else
  echo "  no Co-authored-by: PASS (subject-only commit)"
fi
```

### Check 5 — Staged scope matches edit scope

**Rule:** `CLAUDE.md` R15 / Lesson #6 of `docs/AGENT_PLAYBOOK.md`. Each
commit must cover exactly the files the executor declared as belonging to
the current edit. Unintended files in the staging area are scope leak;
missing files mean the commit is incomplete.

```bash
# EDIT_SCOPE is a newline-separated list passed by the caller.
STAGED=$(git diff --cached --name-only | sort)
EXPECTED=$(printf '%s\n' $EDIT_SCOPE | sort)

if [ "$STAGED" = "$EXPECTED" ]; then
  echo "  staged scope = edit scope: PASS"
else
  EXTRA=$(comm -23 <(printf '%s' "$STAGED") <(printf '%s' "$EXPECTED"))
  MISSING=$(comm -13 <(printf '%s' "$STAGED") <(printf '%s' "$EXPECTED"))
  echo "  staged scope = edit scope: FAIL"
  [ -n "$EXTRA" ]   && echo "    extra (staged but not in scope):   $EXTRA"
  [ -n "$MISSING" ] && echo "    missing (in scope but not staged): $MISSING"
fi
```

## Output format

The executor reports the audit output as a fenced block in chat, immediately
before submitting Pause 3:

```
pre-commit-self-audit:
  subject length (≤72): PASS (54)
  conventional commits type: PASS (docs)
  imperative mood: PASS (add)
  no Co-authored-by: PASS
  staged scope = edit scope: PASS
```

On failure, the failed check shows `FAIL` plus a one-line cause and a brief
suggestion (as shown in each check's snippet above). Multiple FAILs are all
reported — no short-circuit. STOP on Check 3 (verb not classifiable) halts
the audit; the executor reports the STOP and waits.

## Failure handling

- **Any FAIL:** the executor pauses, reports the audit output, and waits for
  the user to decide. The executor does not auto-amend the subject, unstage
  files, or modify the message file. The user may instruct a fix (e.g.
  "shorten to <new subject>") or proceed with the FAIL knowing the cause.
- **STOP on Check 3:** the executor reports the unclassifiable verb and
  waits. User either confirms the verb is intentional (and the audit relaxes
  for this commit) or proposes an alternative.

## Invariants

- The audit never blocks a commit on its own — the user is the gate.
- The audit never modifies any file or runs any git command beyond
  read-only inspection.
- The audit output goes in chat, never in the commit message.
````

#### 3c. Verification

- [ ] `.claude/skills/pre-commit-self-audit/SKILL.md` exists
- [ ] File begins with YAML frontmatter (`---`) and contains `name: pre-commit-self-audit` and a `description:` field
- [ ] File body has sections: "When to invoke", "What this skill provides", "Inputs", "Checks" (with 5 numbered checks), "Output format", "Failure handling", "Invariants"
- [ ] All 5 checks present, in order: subject length, Conventional Commits type, imperative mood, no Co-authored-by, staged scope
- [ ] Each check has a runnable bash block
- [ ] Allowlist and denylist of verbs match D7 of this brief (14 verbs each)
- [ ] File contains no pt-BR text (R9)
- [ ] File does not reference `harness/skills-plan/commit-discipline.md` or any external draft skill (D12 — those are deferred indefinitely)

Commit: `docs(skills): add pre-commit-self-audit skill`

---

## Pause points

- **Pause 1 (before any change):** **Skipped** — `Plan required: no` (see justification below).
- **Pause 2 (after the first modified file is fully changed):** **Required.** First modified file: `.claude/skills/brief-template/SKILL.md` after Edit 2. Show the full file content for review before proceeding to Edit 3.
- **Pause 3 (before each commit):** **Required.** Three commits planned (Edits 1, 2, 3). Run `pre-commit-self-audit` against each commit's proposed subject and staged files before submitting Pause 3.

> **Self-audit bootstrap note:** the `pre-commit-self-audit` skill is being created by this brief. Commit #1 and Commit #2 cannot invoke it (it does not exist yet at those points). Commit #3 (which creates the audit skill itself) is also exempt — the skill cannot audit its own creation commit reliably. From the next brief onward, the audit is invoked every Pause 3.

In case of:

- Unrelated bug or doc inconsistency found in a file being edited → report and ask. Do not fix.
- `.claude/skills/brief-template/` or `.claude/skills/pre-commit-self-audit/` already exists with any content → **STOP and report**. Do not overwrite (per D11).
- Source file `harness/prompts/task-brief-template.md` differs structurally from what this brief assumes (e.g. section names changed since modeling) → **STOP and report**. Do not silently adapt.
- Any file outside `.claude/skills/` or `docs/tasks/013-foundations-agent-skills/` shows in `git diff --name-only` → **STOP and report**. Do not commit until resolved.

---

## Plan required justification

`Plan required: no` because:

- Both SKILL.md files are specified above with exact full content. No structural choice is delegated to the executor.
- All architectural decisions are closed (D1–D13) in the Constraints section.
- The migration from `harness/prompts/task-brief-template.md` to the new skill is not a sweep — it is a fresh authoring of the skill with two named ambiguities pre-resolved (D3). The source file is read as reference only; this brief specifies the target content.
- The two judgment calls (directory conflict, source structure unexpected) have explicit STOP-and-report fallbacks.

**Pause 2 and Pause 3 remain required** — Lesson #6 of `docs/AGENT_PLAYBOOK.md`.

---

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — R9 (agent-consumed surface is English), R10 (Conventional Commits, no trailers), R13 (no `--no-verify`), R15 (plan-before-code threshold), R17 (no proactive push)
2. `docs/MENTOR_BRIEF.md` — M-R10 (language split mirroring R9), M-R12 (mentor lane), M-R13 (session mode), §8 (modes)
3. `docs/GIT_WORKFLOW.md` — G-R1 (main via PR), G-R3 (Conventional Commits, no trailers), G-R5 (push authorization), G-A7 (Co-authored-by anti-pattern)
4. `docs/GOTCHAS.md` — format reference for mixed bash+prose skill documentation (G-CACHE-1 entry shape used as model for Check format in Edit 3)
5. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6 (Pause 2 and 3 always required)
6. `harness/prompts/task-brief-template.md` — read-only reference; source of structural content for Edit 2. **Not modified by this brief.**

---

## Git workflow

### Branch

```bash
git checkout main
git pull --ff-only origin main
git checkout -b docs/foundations-agent-skills
```

### Commit sequence

Three commits, in this order:

```
1. docs(tasks): add brief for 013-foundations-agent-skills
   — touches only docs/tasks/013-foundations-agent-skills/brief.md

2. docs(skills): add brief-template skill
   — touches only .claude/skills/brief-template/SKILL.md

3. docs(skills): add pre-commit-self-audit skill
   — touches only .claude/skills/pre-commit-self-audit/SKILL.md
```

All subject lines ≤ 72 chars (R10). Verify before each commit.

### Push

**Do not push.** Push is the user's call (`CLAUDE.md` R17 / `GIT_WORKFLOW.md` G-R5). Stop after the final commit and report.

---

## Output expected at the end of the session

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (should show exactly 3 commits in the order above)
2. `git diff --stat origin/main...HEAD` — should show 3 files added, all under `docs/tasks/013-foundations-agent-skills/` and `.claude/skills/`
3. `git diff --name-only origin/main..HEAD` — sweep negative check; confirm no file outside the two in-scope directories
4. Any verification checkbox from this brief that could not be met, with explanation
5. Confirmation that no `git push` was executed
6. Suggested next step: open PR on GitHub against `main` using the PR template; once merged, proceed to modeling brief 014 (agents)

---

## Carry-over context (informational only, not in scope)

Tracked for awareness across the cluster; not actionable in this brief.

- **Brief 012 R10 errata.** Three subjects in brief 012 on-disk text still > 72 chars; commits shipped corrected via in-flight catch. Decision pending; no urgency unless brief 012 is cloned as template before resolution.
- **"Old 013" deferred items.** Executor memory placement, no-verbal-override reinforcement pattern, draft skill promotion. Carried as pending notes in recaps; no canonical-doc slot reservation exists. Revisit post-Phase-1 if still relevant.
- **JS libraries for Jira REST and Google Sheets adapters.** Pre-Phase-4 research; not blocking the orchestration cluster.
- **`ProductionFlow` / `Workspace` abstraction.** Surfaces during Phase 2 port.
