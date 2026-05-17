# Brief: 010 — Rename harness to harness (refs sweep)

> **Category:** M
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `refactor/agent-kit-to-harness` (already created; commit #1 already on branch)

---

## Context

Session 2026-05-17 closed two related decisions about the `harness/` folder:

1. **Flatten Option A** — eliminate the `docs/` name collision between project canonicals (`docs/`) and the orchestration meta-tooling (`harness/`) by moving the three operational subfolders up one level.
2. **Rename harness → harness** — the `harness` name implied a one-shot bootstrap kit that would dissolve into the project; in practice `workflows/`, `prompts/`, and `skills-plan/` stayed alive and are used every session. `harness` reflects the actual function (operational scaffolding for AI agent work) and is established terminology in the AI agent research and tooling space.

The orchestrator has already landed commit #1, which:

- moved `harness/workflows/` → `harness/workflows/`
- moved `harness/prompts/` → `harness/prompts/`
- moved `harness/skills-plan/` → `harness/skills-plan/`
- removed `harness/README.md` (duplicate of `harness/README.md`)
- removed the empty `harness/` folder
- renamed `harness/` → `harness/`

This task closes the loop: sweep every cross-reference in the repo that still points to the old paths (`harness/...` or `harness/...`) and update to `harness/...`.

No file content beyond reference paths is touched. No new dependency. No architectural change.

## Goal

After this task:

- `grep -rn "harness" .` returns zero matches across the repo.
- `grep -rn "harness" .` returns zero matches (catches lowercase prose mentions in docs).
- All references to the moved subfolders use the new flattened paths under `harness/`.
- The `harness/README.md` "Estrutura" tree reflects the flattened layout AND the new name.
- Project canonicals under `docs/` (project root, not the renamed folder) are untouched in content; only references to the old name change.

## Constraints

### Non-negotiable constraints

1. **Substitution order matters.** Do the longer match first, then the shorter. In this order:
   - First pass: `harness/` → `harness/`
   - Second pass: `harness/` → `harness/`
   - Third pass: `harness` → `harness` (catches prose mentions without trailing slash)
   - Fourth pass: `harness` → `harness` (catches lowercase prose)
   Reversing the order corrupts paths — first pass would turn `harness/X` into `harness/docs/X` and the second pass wouldn't fix it.
2. **Update `harness/README.md` "Estrutura" tree** to reflect (a) the flattened layout (no nested `docs/`) and (b) the new name (`harness/` not `harness/`).
3. **Branch already has commit #1.** Do NOT redo the moves or the rename. Verify they are present at pre-flight (`ls harness/` should show README.md, init/, workflows/, prompts/, skills-plan/).
4. **Project canonicals under `docs/` (root-level) are NOT renamed** — they stay as `docs/MENTOR_BRIEF.md`, `docs/GIT_WORKFLOW.md`, `docs/AGENT_PLAYBOOK.md`, etc. The strings being replaced are unique to the old folder name; no false positives expected.
5. Follow `CLAUDE.md` and `docs/GIT_WORKFLOW.md` in full. Conventional Commits. Pausa 3 before every commit. No `git push`.
6. Only files containing one of the four substitution targets may be touched. If a file outside that scope needs changing, STOP and ask.

### Architectural decisions already made (do not revisit)

Closed in chat session 2026-05-17. Executor implements; does not propose alternatives.

- **D1 — Option A chosen** (flatten) over B/C/D after tradeoff discussion.
- **D2 — `harness` chosen** as the new name over `harness/` (lowercase, status quo), `orchestration/`, `practice/`, and others. Rationale: established term in AI agent space; describes function over format; lowercase aligns with repo convention.
- **D3 — Duplicate `harness/README.md` removed**, not preserved. `harness/README.md` (formerly `harness/README.md`) carries the canonical content.
- **D4 — Substitution is literal, not semantic.** Don't reword prose to "improve" the new name's context. Just replace the strings.
- **D5 — Edits grouped by directory** to keep commits reviewable.

## Plan

### Edit 1 — Verify state

The brief was committed together with the file moves and rename in commit #1 by the orchestrator. A follow-up commit #2 by the orchestrator adjusted this Edit to reflect that state. Both commits are already on the branch when you start.

No commit needed for this edit. Verify the following and proceed to Edit 2:

- Current branch: `refactor/agent-kit-to-harness`
- `git log --oneline -2` shows two commits: the flatten+rename and the brief adjustment
- Working tree is clean
- Directory check: `ls harness/` returns `README.md  init/  prompts/  skills-plan/  workflows/`
- Brief is present at `docs/tasks/010-agent-kit-to-harness/brief.md`

Executor commits start at #3 (Edit 2 onward).

### Edit 2 — Sweep refs in project canonicals (`docs/`)

Run `grep -rn "harness\|harness" docs/` to enumerate.

Apply the four-pass substitution (in order) to each matched file. Expected files include (verify, do not assume):

- `docs/MENTOR_BRIEF.md`
- `docs/AGENT_PLAYBOOK.md`
- `docs/tasks/*/brief.md` (multiple)
- `docs/sessions/*.md` (multiple)

Commit #3:

```
refactor(docs): rename harness references to harness
```

### Edit 3 — Sweep refs in `CLAUDE.md`

Run `grep -n "harness\|harness" CLAUDE.md`. Apply the four-pass substitution.

Commit #4:

```
refactor(claude-md): rename harness references to harness
```

### Edit 4 — Sweep refs inside `harness/` itself

Run `grep -rn "harness\|harness" harness/`. Expected files include (verify):

- `harness/README.md` — refs AND the "Estrutura" tree
- `harness/init/*.md` (multiple)
- `harness/workflows/*.md` (cross-refs between workflows)
- `harness/prompts/*.md`
- `harness/skills-plan/*.md`

Apply the four-pass substitution to each matched file.

**Special handling for `harness/README.md`:** the "Estrutura" section contains an ASCII tree. Update it to:

```
harness/
├── README.md
├── init/
├── workflows/
├── prompts/
└── skills-plan/
```

Also update prose mentions of the folder name in the README (e.g., "Copia a pasta harness/ pra raiz...") to reflect the new name. The prose semantics of the bootstrap instructions stay intact; only the literal name changes.

Replace the README's first paragraph (currently starting with "Kit de inicialização pra orquestrar agentes IA...") with the following disambiguation line, kept in pt-BR to match the rest of the README:

> Harness de orquestração — meta-tooling para trabalhar com agentes IA neste projeto (Claude Chat, Cowork, Code). Não é scaffolding programático; é doutrina, workflows e prompts.

This replaces the legacy "kit de inicialização" framing that no longer matches reality (the folder is permanent operational scaffolding, not a one-shot bootstrap kit).

Commit #5:

```
refactor(harness): rename internal references after flatten and rename
```

### Edit 5 — Final verification sweep

Run:

```
grep -rn "harness" .
grep -rn "harness" .
```

Expected: zero matches in both. If any match remains, STOP and report — do not commit until clean.

Also verify the four-pass logic didn't produce malformed paths like `harness/docs/X` (would mean Edit 2/3/4 applied the substitutions out of order). Quick check:

```
grep -rn "harness/docs" .
```

Expected: zero matches.

If clean, no commit needed for this edit; it's the green-light.

## Plan required justification

**No.** The substitution is mechanical (four-pass literal string replace in fixed order), the scope is bounded by `grep`, and the verification criterion is binary (zero matches across three greps). No design choices remain.

## Verification

- [ ] `git log --oneline` shows commits #1 through #5
- [ ] `grep -rn "harness" .` returns zero matches
- [ ] `grep -rn "harness" .` returns zero matches
- [ ] `grep -rn "harness/docs" .` returns zero matches (ordering sanity check)
- [ ] `harness/README.md` "Estrutura" tree reflects the flattened layout AND the new name
- [ ] No file outside the swept set was modified (`git diff --stat main..HEAD` to confirm)
- [ ] `STATE.md` updated if you pause mid-execution
