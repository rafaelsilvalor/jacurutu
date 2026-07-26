# Brief: 043 — Document worktree stale-resolution gotcha (G-NODE-2)

> **Category:** M
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/gotcha-worktree-resolution`

---

## Context

During task 042 execution, the executor hit a build failure (`TS2305` on
`buildEditableStem`) caused by a Claude Code session worktree resolving
`@saci/*` imports up-tree to the main checkout's `node_modules`. The owner
ruled a workaround mid-run (Ruling 1, 2026-07-26, in
`docs/tasks/042-template-naming-sanitization/notes.md`) and explicitly queued
this follow-up: document the trap as a `docs/GOTCHAS.md` entry (Ruling 1,
item 5). Task 042 landed as PR #100 (merge commit `dc854d9` on `main`).

Slot 043 numbering evidence (P4, three sources, checked 2026-07-26):
`ls docs/tasks/` — highest existing directory is
`042-template-naming-sanitization`; `git log --oneline main` — latest
task-related merge is `dc854d9` (042, PR #100), no 043 brief shipped;
`CLAUDE.md` E* exceptions — only slots 004-006 are reserved/burned (E5).
All sources agree: next free slot is 043.

## Goal

Add one new entry, `G-NODE-2`, to the Catalog section of `docs/GOTCHAS.md`
documenting the worktree stale-resolution trap, following the file's
established entry format and placement convention.

Out of scope:

- Any source-code change (no `packages/**`, no scripts, no config).
- Any change to other docs (`CLAUDE.md`, `docs/AGENT_PLAYBOOK.md`,
  `docs/GIT_WORKFLOW.md`, agent/skill files, etc.).
- Editing task 042's artifacts (`docs/tasks/042-template-naming-sanitization/**`
  is a historical record — read-only reference).
- Restructuring `docs/GOTCHAS.md` (no reordering of existing entries, no
  category-table changes beyond none needed — `G-NODE` already exists).
- Automating the workaround (e.g. a bootstrap script for worktrees) — future
  brief if recurrence warrants it.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/043-gotcha-worktree-resolution/brief.md` (this file, commit #1)
   - `docs/GOTCHAS.md` (the new entry, commit #2)

   If anything else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md` (especially R9 — English-only docs surface,
   R10 — Conventional Commits, R16 — Pause 3, R17 — no push).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `docs/gotcha-worktree-resolution` — created before Edit 1
     via `git switch -c docs/gotcha-worktree-resolution` from the current
     HEAD (`dc854d9`, which equals `origin/main`); see "Git workflow" below
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5). The executor ends at commit +
     report per Pause 3; the orchestrator/owner handles the PR.
4. Existing `docs/GOTCHAS.md` entries are preserved verbatim — the change is
   append-only within the Catalog section.

### Conventions

- English-only prose (R9): `docs/**` is agent-consumed surface.
- Entry format per `docs/GOTCHAS.md` "Format" section: `### G-CAT-N — title`,
  then **Symptom / Cause / Workaround / Evidence** bold labels, concrete and
  observable, ~15-25 lines (match the tone and depth of the existing catalog).
- Commit convention for gotcha entries is documented in `docs/GOTCHAS.md`
  itself: `docs(gotcha): add G-CAT-N — <short title>`.

### Architectural decisions already made (do not revisit)

#### D1 — Category is `G-NODE`, ID is `G-NODE-2`

The root cause is Node.js module resolution behavior (up-tree walking), so
the entry files under `G-NODE`. Next free number is 2 (only `G-NODE-1`
exists). `G-PROC` was considered and rejected: the trap is a runtime/
resolution quirk, not an agent-orchestration failure. The entry mentions
that it bites agent worktree sessions specifically, because that is the
discovery context — but the mention lives inside the entry body, not in the
category choice.

#### D2 — Placement: append at the end of the Catalog

The catalog appends chronologically by discovery (`G-PROC-1` is currently
last). The new entry goes after the `---` separator that follows
`G-PROC-1`'s Evidence line, and before the `## Maintenance` section, itself
followed by its own `---` separator — so every entry, including the new one,
remains delimited by `---` and `## Maintenance` stays last. Do not insert
next to `G-NODE-1`.

#### D3 — Entry content is fixed by Ruling 1 of task 042

The Symptom/Cause/Workaround/Evidence substance is the owner-approved record
in `docs/tasks/042-template-naming-sanitization/notes.md` (Ruling 1,
2026-07-26). Edit 2 below carries the exact text. The executor does not
re-derive or soften the workaround guard (the `git status --short` lockfile
check is part of the ruling).

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

This brief was pre-saved to
`docs/tasks/043-gotcha-worktree-resolution/brief.md` before the executor was
invoked (caminho B). The executor verifies presence and commits.

- [ ] Directory `docs/tasks/043-gotcha-worktree-resolution/` exists
- [ ] File `docs/tasks/043-gotcha-worktree-resolution/brief.md` exists; first
      line matches the title above
- [ ] `git add docs/tasks/043-gotcha-worktree-resolution/brief.md` is staged
- [ ] Commit #1 created with subject
      `docs(tasks): add brief for 043-gotcha-worktree-resolution`

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

### Edit 2 — Append G-NODE-2 to `docs/GOTCHAS.md`

Insert the following entry into `docs/GOTCHAS.md`, after the `---` separator
that closes `G-PROC-1` and before the `## Maintenance` heading (see D2).
Surround it so that the result reads: `---` (existing), blank line, the entry
below, blank line, `---` (new), blank line, `## Maintenance`.

Exact text to insert:

```markdown
### G-NODE-2 — Worktree sessions silently resolve `@saci/*` imports to the main checkout

**Symptom:** In a Claude Code session worktree (created under `.claude/worktrees/`), `npm run build` fails with `TS2305` on a symbol that exists in the worktree's own source — e.g. `Module '"@saci/core"' has no exported member 'buildEditableStem'` — even though the worktree's `core` package compiles cleanly. Worse, when no new symbol is involved, build and tests pass while silently exercising stale code.

**Cause:** A fresh session worktree starts with an empty or absent `node_modules`. Node's module resolution walks up the directory tree, so `@saci/*` imports resolve to the main checkout's `node_modules` workspace symlinks — which point at the main checkout's `packages/*`, not the worktree's. `npm run build` and `npm test` in the worktree therefore compile and test against the main checkout's (potentially pre-change) `dist`. The root cause is Node resolution behavior, but the trap bites agent worktree sessions specifically — that is where fresh worktrees with empty `node_modules` appear routinely.

**Workaround:** Run `npm install` at the worktree root to materialize workspace symlinks against the worktree's own `packages/*`. Guard: after the install, `git status --short` must show no tracked-file changes (especially `package-lock.json`); if it does, STOP and report — no lockfile drift may land. Then re-run `npm run build` and the full `npm test` suite.

**Evidence:** Ruling 1 (2026-07-26) in `docs/tasks/042-template-naming-sanitization/notes.md`; discovered during task 042, which landed as PR #100 (merge commit `dc854d9` on `main`).
```

Verification:

- [ ] `grep -c '^### G-NODE-2' docs/GOTCHAS.md` returns `1`
- [ ] The entry sits after `G-PROC-1` and before `## Maintenance`
      (verify by eye or `grep -n '^### G-PROC-1\|^### G-NODE-2\|^## Maintenance' docs/GOTCHAS.md`
      — line numbers strictly increasing in that order)
- [ ] The inserted text matches the block above exactly (all four bold labels
      present: Symptom, Cause, Workaround, Evidence)
- [ ] Every existing entry heading is unchanged:
      `grep -Ec '^### G-[A-Z]+-[0-9]+' docs/GOTCHAS.md` returns `13`
      (12 existing + 1 new; the pattern excludes the `G-CAT-N` format example
      in the fenced code block, which a plain `^### G-` grep would count)
- [ ] `git diff --stat` shows only `docs/GOTCHAS.md` for this commit

Commit: `docs(gotcha): add G-NODE-2 — worktree stale module resolution`

### Automated checks (run before each commit)

- [ ] Build/tests not applicable — docs-only change, no `packages/**` touched.
      If any non-docs path appears in `git status`, STOP and report.

### Structural checks

- [ ] `docs/tasks/043-gotcha-worktree-resolution/brief.md` exists with the
      expected first line
- [ ] No file outside the in-scope list was modified
      (verify via `git diff --name-only origin/main..HEAD` — exactly two
      paths: the brief and `docs/GOTCHAS.md`)

### Git checks

- [ ] Branch used: `docs/gotcha-worktree-resolution`
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 1 skipped (`Plan required: no`)
- [ ] Pause 2 — modified `docs/GOTCHAS.md` shown for review before committing
      (always required)
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed commit message
      shown before each commit (always required)
- [ ] `pre-commit-self-audit` skill output reported in chat before each
      Pause 3 submission
- [ ] If any criterion could not be met, it was reported explicitly

## Git workflow

### Branch

`docs/gotcha-worktree-resolution` (R11/G-R2). Setup step, before Edit 1:

```bash
git switch -c docs/gotcha-worktree-resolution
```

Run from the current HEAD (`dc854d9`, which equals `origin/main`), inside
this session worktree. No push (G-R5, R17).

### Commit sequence

1. `docs(tasks): add brief for 043-gotcha-worktree-resolution`
2. `docs(gotcha): add G-NODE-2 — worktree stale module resolution`

Both subjects ≤ 72 chars (58 and 62); both leading verbs (`add`) are on the
allowlist in `.claude/skills/pre-commit-self-audit/SKILL.md`.

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code):** skipped — `Plan required: no`.
- **Pause 2 (after the first modified file):** show the edited
  `docs/GOTCHAS.md` and wait for review. **Always required.**
- **Pause 3 (before each commit):** show `git status` + `git diff --stat`
  + proposed message + `pre-commit-self-audit` output. **Always required.**

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md`
  as a follow-up brief.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

- Every change is specified above with the exact text to insert, the exact
  insertion point (D2), and verification checkboxes.
- All decisions are closed (D1–D3); the entry substance is an owner-approved
  ruling carried verbatim (D3).
- Judgment calls have explicit STOP-and-report fallbacks (out-of-scope paths,
  first-line mismatch, non-docs files in `git status`).

**Pause 2 and Pause 3 remain required** regardless of `Plan required`
— Lesson #6 of `docs/AGENT_PLAYBOOK.md`.

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — the file being edited; read "Format", "Categories",
   and the Catalog tail before inserting
4. `docs/tasks/042-template-naming-sanitization/notes.md` — Ruling 1, the
   authoritative source of the entry's substance (read-only)
5. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
6. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit skill (Pause 3)

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Any verification checkbox from this brief that could not be met,
   with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step (hand branch to orchestrator/owner for PR)
