# Git Workflow

> **Operational discipline for Saci.** This is the *how* — concrete commands, hook scripts, PR template, release process, recovery patterns.
> The *why* lives in `CLAUDE.md` rules R10–R17. Where this file overlaps with `CLAUDE.md`, both are authoritative — adjusting one without the other is a bug.

## Hard Rules (G-R*)

**G-R1 — Trunk-based: every change goes through a branch.** No direct work on `main`. Mirrors `CLAUDE.md` R12.

**G-R2 — Branch names: `<type>/<kebab-description>`.** Allowed types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `perf`, `ci`, `experiment`. Mirrors `CLAUDE.md` R11.

**G-R3 — Conventional Commits required.** Format: `<type>(<scope>)?: <imperative subject>`. Subject ≤ 72 chars. Body explains *why* (not *what*). No trailers — no `Co-authored-by`, no `Signed-off-by`. Mirrors `CLAUDE.md` R10.

**G-R4 — Commit messages reflect the diff.** Don't promise changes the diff doesn't contain. Don't omit changes the diff does contain. If the diff drifts, split the commit.

**G-R5 — `git push` requires explicit user authorization.** Agents may commit freely; pushing is the user's call, every time. Mirrors `CLAUDE.md` R17.

> **Note on the fused-model push policy (Orchestrator sessions, `docs/AGENT_PLAYBOOK.md` chapter 6):** push and PR opening are allowed under R17's letter — on explicit **per-branch** owner instruction only; never `main`, never `--force`. The Claude Code permission prompt is a second layer on top of that instruction, not a substitute for it: plain "Accept" / "Allow once" only. "Accept and auto mode" and "Always allow" are forbidden in Orchestrator sessions.

**G-R6 — Never rewrite pushed history.** No `push --force` on `main`. No `rebase` on commits already pushed. Roll forward with `git revert` instead.

**G-R7 — `main` is integrated only via pull request.** Direct push to `main` is blocked at the GitHub level (see "Branch Protection" below). Local push to `main` is also forbidden by convention.

**G-R8 — Pre-commit hook runs `npm test`.** Hook lives in `.githooks/pre-commit`, configured via `core.hooksPath`. Never bypass with `--no-verify`. Mirrors `CLAUDE.md` R13.

> **Note on executor self-audit:** the executor agent (`.claude/agents/executor.md`) additionally invokes the `pre-commit-self-audit` skill (`.claude/skills/pre-commit-self-audit/`) before every Pause 3. The skill runs five mechanical checks (subject length, Conventional Commits type, imperative mood, no `Co-authored-by`, staged scope). This is **complementary to** G-R8, not a substitute — `npm test` still runs via the git hook on commit. Manual-invocation surface does not run the self-audit; pipeline-invoked executor does.

**G-R9 — Releases are tagged with semver.** Format: `vMAJOR.MINOR.PATCH`. Tag from `main` after the release PR merges. `package.json` version stays in sync.

**G-R10 — `STATE.md` during long structural tasks.** Tasks expected to span multiple sessions create `STATE.md` at the repo root to preserve context. Deleted on task close. See template below.

**G-R11 — Experiments that are abandoned become tags, not deletions.** Before deleting an `experiment/*` branch, tag the tip as `experiments/<name>-rejected` with a one-line reason. Preserves the trail.

## Conventional Commit types

| Type | When | Example |
|---|---|---|
| `feat` | new user-visible capability | `feat(thumbnails): support TIFF previews` |
| `fix` | bug fix | `fix(cache): invalidate when mtime changes` |
| `refactor` | structure/clarity, **no behavior change** (`CLAUDE.md` R14) | `refactor(main): extract worker pool to its own module` |
| `test` | tests only | `test(parser): cover PSDs with no embedded JPEG` |
| `chore` | build, deps, tooling, infra | `chore(deps): bump electron to 31.3.0` |
| `docs` | documentation only | `docs(readme): add macOS install steps` |
| `perf` | performance, no behavior change | `perf(scan): cache directory entries between renders` |
| `ci` | CI/CD config | `ci: add GitHub Actions for npm test` |
| `experiment` | exploratory work that may be discarded | `experiment(renderer): try lit-html for cards` |

**Scope** is optional and free-form (e.g. `psd`, `cache`, `worker`, `renderer`, `i18n`). Use it when it helps; skip when the change is global.

**Subject:** imperative ("add", not "added"/"adds"), lowercase first word, no trailing period.

**Body** (when needed): wrap at 72 cols, explain *why this change*, what alternatives were considered, what risks remain. Empty body is fine for trivial fixes.

## Branch Naming

Format: `<type>/<kebab-description>` — short and specific.

```
feat/psd-diagnostics
feat/i18n-bilingual-ui
fix/cache-mtime-invalidation
refactor/main-into-modules
refactor/renderer-into-modules
refactor/dev-surface-to-en
test/psd-parser-fixtures
chore/setup-git-hooks
chore/build-mac-linux-targets
docs/agent-playbook
ci/github-actions-test
experiment/lit-html-renderer
```

One in-flight branch at a time when possible. If you need to context-switch, commit or stash first; long-lived parallel branches drift hard.

### `claude/*` scaffolding branches

The Claude Code desktop harness creates a per-worktree branch prefixed `claude/` for each session. These branches are **session scaffolding, not work branches**: they sit outside R11/G-R2 (the prefix is harness-imposed, not a Conventional Commit type), carry **zero commits**, are **never PR targets**, and are cleaned up post-session. The real work branch is R11/G-R2-conformant and is created **inside the session** from a verified base SHA, with explicit owner approval (see the G-R5 note above and `docs/AGENT_PLAYBOOK.md` chapter 6).

## Pull Request workflow

Solo dev means **PRs are reviewed by you, against yourself**. The PR is the structured pause where you re-read your own diff before it touches `main`.

**Lifecycle:**

1. `git checkout main && git pull --ff-only origin main`
2. `git checkout -b <type>/<desc>`
3. Work in small commits. Each commit passes the pre-commit hook.
4. `git push -u origin <branch>` (first push — explicit authorization required, see G-R5)
5. Open PR on GitHub against `main`. Fill the template (below).
6. Re-read your own diff in the GitHub UI. Catch what you missed locally.
7. Wait for status checks (CI, when configured). Merge only when green.
8. Use **Squash and merge** by default — keeps `main` history linear and one commit per intent. Use **Create merge commit** only when the branch has multiple individually meaningful commits worth preserving.
9. Delete the merged branch (`git branch -d <branch>` and on GitHub).
10. `git checkout main && git pull --ff-only`.

## PR template

Lives at `.github/pull_request_template.md` (created in `chore/setup-git-hooks` or earlier). Required sections:

```markdown
## What
<one line: what this PR changes from the user's perspective>

## Why
<motivation, linked issue, or context — answer "why now?">

## How tested
- [ ] Unit tests added or updated; `npm test` green
- [ ] Manual test (note OS): Windows / macOS / Linux
- [ ] Cross-platform paths verified — no hardcoded `D:\`, `~/`, etc.
- [ ] Pre-commit hook ran and passed

## Notes for reviewer (you)
<edge cases, follow-ups, debt added or paid down>

## Checklist
- [ ] Branch name follows `<type>/<kebab>` (G-R2)
- [ ] Commits use Conventional Commits format (G-R3)
- [ ] No co-author trailer (G-R3)
- [ ] No `--no-verify` used (G-R8)
- [ ] Files within R5 (≤ 400 lines) or covered by E2
- [ ] No new runtime dependency without justification (CLAUDE.md R2)
- [ ] Dev surface in English (CLAUDE.md R9); UI strings via i18n layer
- [ ] If `refactor:` — no behavior change (CLAUDE.md R14)
```

## Pre-commit hook

Hook lives in `.githooks/pre-commit` (committed to the repo, so every clone gets it).

```bash
#!/usr/bin/env bash
set -e

echo "[pre-commit] running tests..."
npm test --silent

echo "[pre-commit] ok."
```

**Setup (once per clone):**

```bash
git config core.hooksPath .githooks
# Windows: Git for Windows respects the executable bit stored in the index.
# macOS/Linux: also run:
chmod +x .githooks/pre-commit
```

The hook will fail the commit if tests fail. To investigate, run `npm test` directly. **Never use `--no-verify` to push past it** (G-R8).

## Per-clone configuration: blame ignore file

After cloning the repo, run once:

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

This makes `git blame` skip commits registered in
`.git-blame-ignore-revs`. The file is created on the first
renormalization commit; it does not exist in the repo today.
Setting is per-clone and is not versioned. Without it, `git blame`
still works but will attribute lines to the renormalization
commit instead of the original author for any line that was
retouched by LF/CRLF normalization.

## Branch protection on GitHub

Configure on `github.com/rafaelsilvalor/saci` → Settings → Branches → Add rule for `main`:

- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging *(enable when CI is set up; pick the `npm test` job)*
- ✅ Require linear history *(matches Squash-and-merge default)*
- ✅ Do not allow bypassing the above settings *(even for repo admin — the rule is the rail)*
- ✅ Restrict force pushes *(blocks `push --force` to `main`)*
- ✅ Restrict deletions *(blocks accidental `main` deletion)*

These settings are not in code — set them once in the GitHub UI.

## Releases (semver tags)

`MAJOR.MINOR.PATCH` per [semver.org](https://semver.org/):

- **MAJOR** — breaking change to user-facing behavior, config, or distribution format
- **MINOR** — new feature, backward-compatible
- **PATCH** — bug fix, backward-compatible

**Release flow:**

1. Open `chore/release-vX.Y.Z` branch.
2. Bump `package.json` version. Update `README.md` and any user-facing changelog.
3. Open PR. Squash-merge.
4. From `main`:
   ```bash
   git checkout main && git pull --ff-only
   git tag -a vX.Y.Z -m "Release vX.Y.Z — <one-line summary>"
   git push origin vX.Y.Z
   ```
5. Build artifacts: `npm run build:win` (and later `build:mac`, `build:linux`). Attach to a GitHub Release tied to the tag.

`electron-builder` reads `package.json` version, so step 2 + 4 keep the installer and tag aligned.

## STATE.md (long tasks)

Created at the repo root **only when** a task spans multiple sessions or has structural complexity (refactor/main-into-modules, feat/i18n-bilingual-ui). Deleted when the task closes (its content moves into the merge PR description).

Template:

```markdown
# Task State

## Goal
<one or two sentences: what this task is intended to achieve>

## Status
<in-progress | blocked | completed>

## Last update
<YYYY-MM-DD HH:MM, machine and OS if relevant>

## Done so far
- [x] <item>
- [x] <item>

## Next steps
- [ ] <concrete next action>
- [ ] <action after that>

## Blockers (if status = blocked)
<clear description of what is blocking and what would unblock>

## Notes for next session
<non-obvious context: a decision made in your head but not in code yet,
a hypothesis to test, a tradeoff you postponed deciding>
```

`STATE.md` is in `.gitignore`? **No** — commit it. Branch `STATE.md` lives only on the task branch and is removed before the PR merges.

## Recovery patterns

Concrete sequences. When in doubt, run `git status` first.

**Standard merge of a task branch (when not using Squash-and-merge from the GitHub UI):**

```bash
git checkout main
git pull --ff-only origin main
git merge --no-ff <branch> -m "Merge branch '<branch>'"
git push origin main
git branch -d <branch>
git push origin --delete <branch>
```

Default is GitHub Squash-and-merge; this manual sequence applies only if you're merging locally.

**Revert a bad commit already on `main`:**

```bash
git checkout main && git pull --ff-only
git revert <bad-sha>      # creates a new commit that undoes <bad-sha>
git push origin main      # requires authorization (G-R5)
```

Never amend or `--force`-push to fix a `main` commit; always roll forward.

**Discard an experiment safely (preserve as tag):**

```bash
git tag -a experiments/<name>-rejected experiment/<name> \
  -m "Rejected: <one-line reason>"
git push origin experiments/<name>-rejected
git checkout main
git branch -D experiment/<name>
git push origin --delete experiment/<name>
```

**Local branch diverged from `origin` but content is identical (e.g. line endings):**

```bash
git tag safepoint/local-before-reset
git reset --hard origin/<branch>
```

Tag first; the safepoint lets you recover if the divergence wasn't actually identical.

**Stuck mid-rebase or mid-merge with no idea what's going on:**

```bash
git status                 # read carefully — git tells you the state
git rebase --abort         # if mid-rebase
git merge --abort          # if mid-merge
```

When more recovery is needed, see `harness/workflows/gitflow-emergency-recovery.md`.

## Anti-patterns (G-A*)

**G-A1 — `git push --force` (or `--force-with-lease`) on `main`.** Violates G-R6. Branch protection blocks it; if you find yourself wanting it, stop and `git revert` instead.

**G-A2 — Committing `node_modules/`, `dist/`, `*.log`, `.DS_Store`, `config.json`.** All in `.gitignore`. If something leaked in, remove with `git rm --cached` and tighten `.gitignore`.

**G-A3 — Vague commit messages.** `"fix"`, `"update"`, `"WIP"`, `"changes"`. Violates G-R3 + G-R4. The future you reading `git log` deserves better.

**G-A4 — Bypassing the pre-commit hook with `--no-verify`.** Violates G-R8. If the hook is broken, fix it in a `chore:` PR, don't route around it.

**G-A5 — Long-lived `git stash` entries.** Stashes age badly: context fades, the diff drifts. Within 1–2 sessions either commit on a branch or `git stash drop`.

**G-A6 — Mixing unrelated changes in one commit.** A `refactor:` commit that also fixes a bug, or a `feat:` commit that bumps a dep. Split before committing — the diff stays reviewable.

**G-A7 — Adding the `Co-authored-by` trailer.** This project's commits are attributed to the human author only. Violates G-R3.

**G-A8 — Merging without filling the PR template.** Skipping the template defeats the point of the structured pause. Violates the lifecycle in "Pull Request workflow".

## Related documents

- `CLAUDE.md` — code rules. R10–R17 cover the principles behind this file.
- `docs/MENTOR_BRIEF.md` — Mentor-lane behavior; M-R3 mirrors Pause-3.
- `docs/GOTCHAS.md` — codebase traps that interact with git workflow (e.g. `CACHE_VERSION` bump as its own commit).
- `harness/workflows/` — pre-built session templates: `setup-code.md`, `gitflow-merge-into-main.md`, `gitflow-emergency-recovery.md`, etc.
