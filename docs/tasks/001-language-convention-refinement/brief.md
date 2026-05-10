# Brief: 001 — Language convention refinement

> **Category:** M (3 files modified + 1 new; ~120 lines of net changes)
> **Plan required:** No — see "Plan required justification" below
> **Branch:** `docs/language-convention-refinement`
>
> Paste this brief into Claude Code at session start. **First action: save this brief verbatim as `docs/tasks/001-language-convention-refinement/brief.md`** (creating the directory). All subsequent edits proceed from there.

---

## Context

Rule R9 of `CLAUDE.md` mandates "all documentation" to be English. Strict reading puts the prompts in `Agent-kit/init/*.md`, `Agent-kit/setup-chat.md`, and the prose around `Agent-kit/docs/prompts/task-brief-template.md` in violation, since those are pt-BR.

A 2026-05-09 mentoring session re-examined the rule's intent. The conclusion: R9 was authored with two distinct audiences conflated. Files that the **agent** consumes directly (canonical docs, code, commits, briefs that get committed) benefit from English (better LLM reasoning). Files that the **user** edits and pastes into chat directly (Agent-kit prompts, copy-paste templates) are *interfaces*, not documentation; pt-BR there reduces friction for the user without affecting agent quality (the user pastes them into chat, where M-R10 already mandates pt-BR).

Two specific consequences:

1. R9 is restated to articulate the *audience-based* split (agent-consumed vs human-edited), not a directory-based one.
2. The `## --- TEMPLATE PARA COPIAR ---` block inside `task-brief-template.md` is not "the template's text the user reads" — it is the *content that becomes a committed `brief.md`*, which is agent-consumed. So that specific block belongs in English, even though the surrounding usage notes ("Como usar manualmente", "Princípios pra preencher bem", etc.) stay in pt-BR.

A small explanatory note is also added to `MENTOR_BRIEF.md` §8 to clarify why the chat-starter snippet there stays in pt-BR despite the file being English.

## Goal

After this task:

- `CLAUDE.md` R9 distinguishes three surfaces: agent-consumed (English), human-edited interface in `Agent-kit/` (pt-BR acceptable), UI (bilingual).
- The template body inside `Agent-kit/docs/prompts/task-brief-template.md` (the block between `## --- TEMPLATE PARA COPIAR ---` and `## --- FIM TEMPLATE ---`) is fully in English.
- `docs/MENTOR_BRIEF.md` §8 has a one-sentence note explaining the embedded pt-BR snippet.

No code is touched. No new dependency. No translation of `Agent-kit/init/*.md` prompts (out of scope under the new R9).

## Constraints

### Files in scope

| # | File | Change type |
|---|---|---|
| 1 | `docs/tasks/001-language-convention-refinement/brief.md` | New file (this brief, saved verbatim) |
| 2 | `CLAUDE.md` | Replace the entire R9 block |
| 3 | `Agent-kit/docs/prompts/task-brief-template.md` | Replace the content between the `--- TEMPLATE PARA COPIAR ---` and `--- FIM TEMPLATE ---` markers with an English version |
| 4 | `docs/MENTOR_BRIEF.md` | Replace one paragraph in §8 |

### Out of scope

- Translating any pt-BR prose **around** the template in `task-brief-template.md` ("Quando usar", "Como usar manualmente", "Princípios pra preencher bem", "O que ENTRA no brief", "O que NÃO entra", "Tamanho ideal"). Those are user-facing instructions and stay pt-BR per the new R9.
- Translating `Agent-kit/init/01-bootstrap-project.md` through `Agent-kit/init/07-create-brief.md`. Out of scope under the new R9.
- Translating `Agent-kit/setup-chat.md` or `Agent-kit/docs/prompts/README.md`. Same reason.
- Translating the chat-starter snippet inside `MENTOR_BRIEF.md` §8. The snippet stays pt-BR — it is an embedded example of a chat message, and chat is pt-BR per M-R10. Only the surrounding intro paragraph is updated.
- Any application code (`main.js`, `psd-worker.js`, `preload.js`, `renderer/app.js`, `renderer/index.html`, etc.).
- Adding, removing, or renumbering any other rule, anti-pattern, or exception in `CLAUDE.md`.
- Any `git push`.

### Conventions

- `CLAUDE.md` and `docs/MENTOR_BRIEF.md` content stays in English (the new R9 still mandates it).
- The translated TEMPLATE block in `task-brief-template.md` is in English; surrounding pt-BR prose stays pt-BR.
- All commits follow Conventional Commits (`CLAUDE.md` R10, `GIT_WORKFLOW.md` G-R3).
- No `Co-authored-by` trailer (`GIT_WORKFLOW.md` G-R3).
- Pre-commit hook is still not installed; if it is by now, do not bypass with `--no-verify`.

---

## Done criteria

### Edit 1 — Save this brief

Create directory `docs/tasks/001-language-convention-refinement/` and save this brief (verbatim, the exact text the agent received in the chat) as `brief.md` inside it.

- [ ] Directory `docs/tasks/001-language-convention-refinement/` exists
- [ ] File `docs/tasks/001-language-convention-refinement/brief.md` exists and matches the brief content the agent received

### Edit 2 — `CLAUDE.md`: replace R9

Find this exact block (the entirety of the current R9 entry, from the bold rule line to the line about E3 migration):

```
**R9 — Language convention: development surface is English-only; user-facing UI is bilingual EN + pt-BR.**

- *Development surface* (English-only): code identifiers, comments, file/folder names, commit messages, branch names, PR titles/descriptions, all documentation (`CLAUDE.md`, `README.md`, `docs/**`), config keys, log/console messages.
- *UI surface* (EN + pt-BR): visible labels, button text, placeholders, tooltips, error toasts, empty states, menu items. Stored in an i18n layer keyed by string ID, with both locales defined. **Never inline a pt-BR-only literal in new HTML/JSX/template code** — route through the i18n layer (or add a `TODO(i18n)` if the layer is not yet in place).
- Default locale is auto-detected from the OS (`app.getLocale()` in main, `navigator.language` in renderer); the user may override in settings.
- Existing pt-BR content predates this rule and is tracked as `E3` for migration.
```

Replace with exactly:

```
**R9 — Language convention: agent-consumed surface is English-only; human-edited interfaces in `Agent-kit/` may be pt-BR; user-facing UI is bilingual EN + pt-BR.**

The dev surface splits by *audience*, not by directory.

- *Agent-consumed surface* (English-only): code identifiers, comments, file/folder names, commit messages, branch names, PR titles/descriptions, canonical documentation (`CLAUDE.md`, `README.md`, `docs/**`), task artifacts (`docs/tasks/**`), config keys, log/console messages. Includes any block inside `Agent-kit/` that produces canonical output — e.g. the template body inside `Agent-kit/docs/prompts/task-brief-template.md` becomes a committed `brief.md`, so that block is English even though the surrounding usage notes are pt-BR.
- *Human-edited interface* (pt-BR is acceptable): the prompts in `Agent-kit/init/*.md`, `Agent-kit/setup-chat.md`, `Agent-kit/docs/prompts/README.md`, and the prose around copy-paste templates in `Agent-kit/docs/prompts/`. Rationale: the user reads, copies, and customizes these directly; pt-BR reduces friction for the user without affecting agent quality, because these files are typically pasted into chat (where M-R10 already mandates pt-BR).
- *UI surface* (EN + pt-BR): visible labels, button text, placeholders, tooltips, error toasts, empty states, menu items. Stored in an i18n layer keyed by string ID, with both locales defined. **Never inline a pt-BR-only literal in new HTML/JSX/template code** — route through the i18n layer (or add a `TODO(i18n)` if the layer is not yet in place).
- Default locale is auto-detected from the OS (`app.getLocale()` in main, `navigator.language` in renderer); the user may override in settings.
- Existing pt-BR content in source files (`main.js`, `psd-worker.js`, `renderer/app.js`) predates this rule and is tracked as `E3` for migration.
```

#### Verification

- [ ] R9 in `CLAUDE.md` matches the new text byte-for-byte
- [ ] R8 (above R9) and R10 (below R9) are unchanged
- [ ] No other rule, anti-pattern, or exception was modified
- [ ] Total file diff for this commit shows only the R9 region changed

### Edit 3 — `Agent-kit/docs/prompts/task-brief-template.md`: translate the TEMPLATE block

Locate the section that begins with the marker `## --- TEMPLATE PARA COPIAR ---` and ends with the marker `## --- FIM TEMPLATE ---`. Between those two markers, there is a fenced markdown code block (opened with ` ```markdown ` and closed with ` ``` `) containing the brief template body, currently in pt-BR.

Replace the **entire content of that fenced code block** (everything between the opening ` ```markdown ` line and the closing ` ``` ` line, exclusive of the fence markers themselves) with the English version below. Do not touch:

- The `## --- TEMPLATE PARA COPIAR ---` heading line
- The `## --- FIM TEMPLATE ---` heading line
- The opening ` ```markdown ` fence line
- The closing ` ``` ` fence line
- Anything before `## --- TEMPLATE PARA COPIAR ---` or after `## --- FIM TEMPLATE ---`

The new content of the fenced code block (English, replaces all pt-BR template body):

```markdown
# Brief: [Short task title]

> **Category:** [M | L]
> **Plan required:** [yes | no] — see "When to skip Pause 1" below
> **Branch:** `[type]/[kebab-description]`
>
> Paste this brief into the executor agent (Claude Code, Cowork)
> at task start.

---

## Context

[2-4 sentences. Where this fits in the project. Why it exists.
Relevant current state. If already clear from the filename or
task name, omit — don't pad.]

## Goal

[1-2 imperative sentences. What needs to be different at the end.
Not how, just what.]

## Constraints

### Non-negotiable constraints

1. [Behavior that must not change]
2. [API that must not break]
3. Follow all rules in `CLAUDE.md` (especially [R-X], [A-Y])
4. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `[type]/[kebab-description]`
   - Conventional Commits
   - Commit freely; **DO NOT push**
   - Update `STATE.md` at session end
5. Only files directly related to the task may be modified. If
   you discover something else needs changing, **STOP and ask**.

### Architectural decisions already made (do not revisit)

[List decisions closed in a design session with the mentor. The
agent implements, does not propose alternatives. If no decisions
were pre-closed, omit this section — the agent will propose a
plan you review at Pause 1.]

#### [Decision 1]

[Specific detail]

#### [Decision 2]

[Specific detail]

## Done criteria

The task is complete only when **all** items are true:

### Automated checks

- [ ] Build passes without errors
- [ ] Linter passes without warnings
- [ ] Tests pass (if applicable)
- [ ] [Other automatable checks]

### Structural checks

- [ ] [Specific expected structure]
- [ ] [Size limits]
- [ ] [Anti-patterns absent — verifiable via `grep` or similar]

### Behavior checks

- [ ] [Testable behavior]
- [ ] [Specific edge cases]

### Git checks

- [ ] Branch used: `[type]/[description]`
- [ ] Commits follow Conventional Commits
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed
- [ ] `STATE.md` updated to `completed` or removed

### Process checks

- [ ] If `Plan required: yes` — numbered step plan was presented
      and approved before any change (Pause 1)
- [ ] Pause 2 — first modified file shown for review before
      proceeding (always required)
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed
      message before each commit (always required)
- [ ] If any criterion could not be met, it was reported
      explicitly

## Pause points

From `AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code):** present a numbered plan and wait
  for approval. **Required if `Plan required: yes`; skipped if
  `Plan required: no`** (see "When to skip Pause 1" below).
- **Pause 2 (after the first modified file):** show the result
  and wait for review. **Always required.**
- **Pause 3 (before each commit):** show `git status` +
  `git diff --stat` + proposed message. **Always required.**

In case of:
- Unrelated bug found → report and ask
- Technical limitation preventing a done criterion → report
- Undocumented gotcha discovered → report and document

**DO NOT proceed "fixing" things without permission.**

## When to skip Pause 1 (`Plan required: no`)

Pause 1 ("the agent presents a numbered plan before any code") guards against the agent inventing an approach the brief did not specify. It is overhead when the brief itself **is** the plan — when all decisions are closed and the agent's job is to execute, not design.

**Skip Pause 1 only when ALL hold:**

- All architectural decisions are recorded in this brief or in canonical docs (`CLAUDE.md`, `MENTOR_BRIEF.md`)
- Done criteria are concrete and verifiable without interpretation
- No ambiguity about which files to touch or how

**Typical `Plan required: no` tasks:**
- Doc updates with text already specified in the brief
- Mechanical edits (rename, format, move files)
- Adding a rule to a structured file at a specified location

**Typical `Plan required: yes` tasks:**
- Refactor with implementation choices to make
- New feature with design decisions
- Bug fix where the root cause is hypothesized, not confirmed

⚠️ **Pause 2 (after the first file) and Pause 3 (before each commit) are ALWAYS required, regardless of `Plan required`.** They catch drift the brief did not anticipate (Lesson #6 of `AGENT_PLAYBOOK.md`).

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational workflow
3. `docs/GOTCHAS.md` — known traps
4. [Other specific relevant files]

## Expected output

1. Branch `[type]/[description]` created and working tree clean
2. Commits describing each milestone of the task
3. `STATE.md` at the end indicating completed (or removed)
4. [Main file of the task] modified per spec
5. Brief summary reported in the final message:
   - How many commits, which
   - Lines added/removed (`git diff --stat origin/main`)
   - Any checklist item not met (with justification)
   - Suggested next step
```

#### Verification

- [ ] Inside the `## --- TEMPLATE PARA COPIAR ---` section, the fenced markdown block contains only the English content above
- [ ] The `## --- TEMPLATE PARA COPIAR ---` and `## --- FIM TEMPLATE ---` markers are intact
- [ ] The opening ` ```markdown ` fence and closing ` ``` ` fence are intact
- [ ] All sections of the file before `## --- TEMPLATE PARA COPIAR ---` and after `## --- FIM TEMPLATE ---` are byte-identical to before — no pt-BR prose was translated
- [ ] No headers, lists, or instructions in the surrounding prose were modified

### Edit 4 — `docs/MENTOR_BRIEF.md`: clarify §8 snippet note

In §8, locate this exact line (the introductory line right before the fenced pt-BR chat-starter snippet):

```
Snippet to paste into a fresh Claude chat (pt-BR because chat is pt-BR; files referenced are English):
```

Replace with exactly:

```
Snippet to paste into a fresh Claude chat. Shown in pt-BR because chat operates in pt-BR (M-R10). The surrounding documentation is English (R9); the snippet itself is an embedded chat-starter example, not documentation prose.
```

#### Verification

- [ ] The introductory line above the fenced snippet matches the new text byte-for-byte
- [ ] The fenced pt-BR snippet itself is unchanged
- [ ] The rest of §8 (the heading, the table, the heading "### Default starting prompt for a fresh chat") is byte-identical to before
- [ ] §1 through §7 are byte-identical to before

---

## Plan required

**No.**

Justification: Edit 2, Edit 3, and Edit 4 are full-text replacements with the new content given verbatim. There is no architectural choice for the agent to make, no ambiguity about which file to edit, and no interpretation needed beyond locating the exact strings in the find-and-replace blocks.

⚠️ **Pause 1 is therefore skipped.** **Pause 2 (after Edit 2 / `CLAUDE.md` is fully modified, before moving to Edit 3) and Pause 3 (before every commit) remain required and must not be skipped** — Lesson #6 of `AGENT_PLAYBOOK.md`.

For Pause 2: after completing Edit 2, stop and present the diff of `CLAUDE.md` for the user to review before proceeding to Edit 3.

For Pause 3: before each commit, run `git status`, `git diff --stat`, and present the proposed commit message for explicit approval.

---

## Git workflow

### Branch

```bash
git checkout main
git pull --ff-only origin main
git checkout -b docs/language-convention-refinement
```

### Commit sequence

Four commits, in this order. Each is a single thematic change.

```
1. docs(tasks): add brief for 001-language-convention-refinement
   — touches only docs/tasks/001-language-convention-refinement/brief.md (new file)

2. docs(claude): refine R9 to articulate agent-consumed vs human-edited surfaces
   — touches only CLAUDE.md

3. docs(prompts): translate task-brief-template TEMPLATE block to English
   — touches only Agent-kit/docs/prompts/task-brief-template.md

4. docs(mentor-brief): clarify §8 snippet as embedded chat-starter example
   — touches only docs/MENTOR_BRIEF.md
```

Commit bodies should explain *why* in 1-2 short paragraphs (G-R3, G-R4). For commits 2 and 3, reference the audience-based rationale (agent-consumed vs human-edited). For commit 4, mention that the snippet stays pt-BR by intent, not oversight.

### Push

**Do not push.** The user authorizes push explicitly per `GIT_WORKFLOW.md` G-R5 / `CLAUDE.md` R17. Stop after the fourth commit and report.

---

## Output expected at the end of the session

A single message reporting:

1. Branch name and `git log --oneline main..HEAD` (should show 4 commits)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Any verification checkbox from this brief that **could not** be met, with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step: open PR on GitHub against `main` using the PR template; once merged, proceed to brief 002 (storage layer refactor)

---

## References (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules (especially R9 itself, R10, R13, R14, R17 for this task; R18 and R19 are not directly involved but stay aware they exist)
2. `docs/GIT_WORKFLOW.md` — operational discipline (G-R3, G-R5, G-R8, PR template)
3. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points, drift signals); Lessons #4 and #6 in particular
4. `docs/MENTOR_BRIEF.md` — context on the user and the relationship; especially M-R10 and patterns P1–P3
5. `Agent-kit/docs/prompts/task-brief-template.md` — the file being modified by Edit 3; useful to read **before** editing to understand the existing structure (the markers, the surrounding pt-BR prose that stays put)

If anything in the references contradicts a specific instruction in this brief, **stop and report** rather than choosing a side. The brief is the more recent decision; canonical docs may need a follow-up update this brief did not anticipate.
