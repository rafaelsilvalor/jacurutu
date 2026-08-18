# Brief: 2026-08-17 — Rename the product from Saci to Jacurutu

> **Category:** L
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `refactor/product-rename`

---

## Context

The product is renamed **Saci -> Jacurutu**, decided by the owner on
2026-08-16 with the target corrected on 2026-08-17. The reasoning, the measured
surface and the runtime traps live in `docs/explorations/product-rename.md`,
which this brief implements; read it first.

This brief was authored and merged on `docs/product-rename` before execution
began, so **it is already on `main` when the executor starts**. That differs
from the template's Edit 1, which has the executor commit its own brief.

The ordering matters and is measured, not preferred: `.saci.json` is written by
`packages/cli/src/run-start.ts:44` into local folders only, because `ship` does
not exist. Once `ship` ships, manifests live in Drive across designers and this
work stops being local.

## Goal

Rename every live surface of the product from `saci` to `jacurutu`, leaving the
historical record untouched.

Out of scope:

- `docs/tasks/**` and `docs/sessions/**` — the historical record. A recap
  describing what shipped as `saci` becomes false if rewritten.
- `automation/` — a frozen provenance snapshot; rewriting it falsifies what it
  records.
- Git history, merged PR titles, and the `experiments/harness-redesign-rejected`
  tag.
- `AGENTS.md`, `.agents/`, `.codex/` — settled by #157, and out of scope for a
  better reason than this brief first gave. `AGENTS.md` is now a tracked
  six-line pointer to `CLAUDE.md` carrying no occurrence of the product name;
  the two directories are unmanaged generator output and are gitignored, though
  they still exist on disk in every worktree. Nothing in any of them is renamed.
- The "feature orchestrator" framing. That is a fourth identity shift and a
  `core` question, not a naming one.
- Any behavior change beyond the renaming itself.

## Constraints

### Non-negotiable constraints

1. Only these paths may be modified: `package.json`, `packages/**`,
   `CLAUDE.md`, `README.md`, `docs/*.md`, `docs/explorations/*.md`,
   `.claude/**`, `harness/**`. Anything else — **STOP and ask**.
2. Follow `CLAUDE.md`, especially **R14** (a `refactor:` changes no behavior),
   **R9** (English on the agent-consumed surface), **R7** (named constants) and
   **A2** (no scope creep in a refactor).
3. Follow `docs/GIT_WORKFLOW.md` fully: branch `refactor/product-rename` cut
   from a verified `origin/main`; Conventional Commits (G-R3); no co-author
   trailer (G-A7); **DO NOT push** (G-R5).
4. The green boundary is unconditional before every commit: `npx tsc -b` and
   `npm test`, both green, both pasted at Pause 3.
5. `STATE.md` at the repo root is required for this task (G-R10, multi-session
   L), and deleted at close.

### Conventions

- Package scope becomes `@jacurutu/*`; the root package name becomes
  `jacurutu`; the `bin` becomes `jacurutu`.
- Runtime directory `~/.saci` becomes `~/.jacurutu`; `.saci.json` becomes
  `.jacurutu.json`; the five `SACI_*` variables become `JACURUTU_*`.
- Commit types are fixed by D3 below and are not a judgment call at commit time.

### Architectural decisions already made (do not revisit)

#### D1 — Clean break, no backward-compatible read paths

No fallback reads the old names. A fallback keeps `saci` in the code permanently
as the legacy name being read, which fails the owner's requirement; and
fallbacks protect installed users, of whom there is exactly one. The migration
is a one-time owner action, specified in Edit 5.

#### D2 — The record is retained, deliberately

`docs/tasks/**`, `docs/sessions/**` and `automation/` keep the old name. This is
a decision with a reason, not an omission: those files describe a past in which
the product was called Saci.

#### D3 — Commit types are fixed

- Mechanical surface -> **`refactor:`**. Same input, same output.
- Runtime surfaces -> **`feat:`**. R14 cannot cover it: after the change, an
  unchanged `~/.saci` and unchanged exported variables yield a fetch that
  cannot find its credentials. `feat:` overstates and `chore:` hides; between
  overstating and hiding, the one that warns is correct. The commit body must
  open by naming the breakage and the owner actions.
- Documentation -> **`docs:`**.

#### D4 — This is not a search-and-replace

Four groups contain `saci` **on purpose** and are edited by judgment, file by
file, never by sweep:

- `docs/explorations/product-rename.md` — discusses the rename; its
  `Saci -> Jacurutu`, `~/.saci` and `.saci.json` mentions are its subject
  matter.
- `docs/ROADMAP.md` — `## Identity shifts` holds dated historical entries.
  Their prose describes what was true then.
- `docs/GOTCHAS.md` — incident descriptions cite the paths as they were.
- `.claude/hooks/lib/*.test.mjs` — fixtures. A fixture asserting a path string
  changes only if the code it pins changed.

A blanket search-and-replace corrupts exactly the files that hold the history
this brief is trying to protect.

A live example, one directory over: the `AGENTS.md` that #157 replaced had been
generated by rewriting `.claude/` to `.Codex/` throughout, producing 8 paths
that never existed. The question when sweeping is never "does this string
match" but "does this sentence still describe something real".

## Done criteria

### Edit 1 — Verify the brief and open STATE.md

- [ ] `docs/tasks/2026-08-17-product-rename/brief.md` exists on `main`; first
      line matches this title
- [ ] Branch `refactor/product-rename` cut from a verified `origin/main` SHA,
      recorded in `STATE.md`
- [ ] `STATE.md` created at the repo root per G-R10

Commit: `chore(state): add STATE.md for the product rename`

### Edit 2 — Mechanical surface (`refactor:`)

Rename package identities and every import that follows from them.

- 6 `package.json` names: root `saci` -> `jacurutu`; the five workspaces
  `@saci/*` -> `@jacurutu/*`
- `packages/cli/package.json` `bin`: `saci` -> `jacurutu`
- 53 `@saci/` import specifiers across 28 files under `packages/`
- `package-lock.json` regenerated by `npm install`, not edited by hand

Verification:

- [ ] No `package.json` declares a name containing `saci`
- [ ] No source file imports from a specifier containing `saci`
- [ ] `npx tsc -b` green and `npm test` green — 377 + 112, 0 fail
- [ ] `git diff --name-only` touches nothing outside `package.json`,
      `package-lock.json` and `packages/**`

Commit: `refactor(packages): rename the package scope to jacurutu`

### Edit 3 — Runtime surfaces (`feat:`)

The four classes named in the note. Both declarations of
`CREDENTIALS_DIR_NAME` — `packages/adapter-drive/src/constants.ts:15` and the
local copy at `packages/adapter-sheets/src/errors.ts:36` — or it compiles and
fails at runtime.

- `CREDENTIALS_DIR_NAME`, both sites: `.saci` -> `.jacurutu`
- `IDENTITY_DIR_NAME` in `packages/cli/src/identity.ts`
- `MANIFEST_FILENAME` in `packages/cli/src/run-start.ts:44`:
  `.saci.json` -> `.jacurutu.json`
- Five variables: `SACI_TELEMETRY_DIR` (`.claude/hooks/lib/telemetry.mjs:28`),
  `SACI_JIRA_BASE_URL`, `SACI_JIRA_EMAIL`, `SACI_JIRA_API_TOKEN`,
  `SACI_IDENTITY_FILE` (`packages/cli/src/cli.ts`) -> `JACURUTU_*`
- **`README.md` gains a section documenting the five variables.** They are
  undocumented today, so the only copy of that contract is the code this Edit
  rewrites. A clean break plus an undocumented contract is how the fetch
  command breaks silently in the next session.

Verification:

- [ ] No runtime constant or environment-variable name contains `saci`
- [ ] The duplicated credentials constant is renamed at **both** sites
- [ ] `README.md` documents all five variables under their new names
- [ ] `npx tsc -b` green and `npm test` green

Commit: `feat(cli): migrate the runtime surfaces to the jacurutu names`

The body opens with the breakage and the two owner actions, verbatim:

```
mv ~/.saci ~/.jacurutu
re-export the five JACURUTU_* variables
```

### Edit 4 — Documentation (`docs:`)

`CLAUDE.md` (8), `README.md` (10), `docs/AGENT_PLAYBOOK.md` (4),
`docs/GIT_WORKFLOW.md` (2), `docs/GOTCHAS.md` (12), `docs/MENTOR_BRIEF.md` (16),
`docs/PROCESS_MAP.md` (3), `docs/ROADMAP.md` (20), `docs/explorations/*.md`,
`.claude/**` and `harness/**`.

Apply **D4**: the four judgment groups are read and edited individually. Where
a sentence describes the past, it keeps the old name and, if the reader could
be misled, gains a clause saying the product was renamed.

`docs/ROADMAP.md` additionally gains a fourth entry under `## Identity shifts`,
dated, recording the rename and pointing at
`docs/explorations/product-rename.md`.

Verification:

- [ ] No canonical doc refers to the product's current name as Saci
- [ ] Every remaining occurrence outside the record is historical by
      construction — a dated entry, an incident description, or the rename note
      discussing its own subject — and each was reviewed individually
- [ ] `docs/tasks/**`, `docs/sessions/**` and `automation/` are untouched
      (`git diff --name-only origin/main..HEAD` shows none of them)
- [ ] The ROADMAP carries a dated fourth identity shift

Commit: `docs: rename the product to jacurutu across the canonical docs`

### Edit 5 — Owner actions, reported not executed

The executor does **not** run these. It reports them as the closing message,
and `STATE.md` records that they are outstanding:

```
mv ~/.saci ~/.jacurutu
re-export the five JACURUTU_* variables in the shell profile
gh repo rename jacurutu          # then update the local remote
mv D:/Projects/saci D:/Projects/jacurutu
git worktree repair              # absolute paths break on the directory move
```

The last two are why `git worktree repair` is in this brief rather than being
discovered live.

### Commit sequence

1. `chore(state): add STATE.md for the product rename`
2. `refactor(packages): rename the package scope to jacurutu`
3. `feat(cli): migrate the runtime surfaces to the jacurutu names`
4. `docs: rename the product to jacurutu across the canonical docs`

### Automated checks (before each commit)

- [ ] `npx tsc -b` — no errors
- [ ] `npm test` — 377 + 112, 0 fail, both summary blocks pasted
- [ ] `git diff --name-only` matches the current Edit's scope

### Structural checks

- [ ] Nothing outside the in-scope list was modified
- [ ] `docs/tasks/**`, `docs/sessions/**`, `automation/`, `AGENTS.md`,
      `.agents/`, `.codex/` untouched

### Behavior checks

- [ ] The built CLI runs and prints its version after Edit 2
- [ ] With `~/.saci` still in place and no `JACURUTU_*` exported, the CLI fails
      with a message that names the new path — not a silent empty result

### Git checks

- [ ] Branch `refactor/product-rename`
- [ ] Conventional Commits, subjects <= 72 chars, no co-author trailer
- [ ] `git status` clean at the end
- [ ] **NO** `git push`
- [ ] `STATE.md` removed at close

### Process checks

- [ ] Pause 1 — numbered plan presented and approved
- [ ] Pause 2 — first modified file shown
- [ ] Pause 3 — before every commit, with both green-boundary blocks
- [ ] Any criterion that could not be met was reported explicitly

## Pause points

Pause 1 required. Pause 2 and Pause 3 always required
(`docs/AGENT_PLAYBOOK.md` Chapter 2, Lesson #6).

Unrelated bug found -> report, do not fix. Undocumented gotcha -> report for a
follow-up brief.

## Plan required justification

`Plan required: yes`. The surface is 335 measured occurrences across four
directories, and D4 makes part of it judgment rather than substitution — the
executor must show which files it will treat as historical before touching any
of them. That list is exactly what Pause 1 is for, and getting it wrong
corrupts the record this brief exists to protect.

## Reference documents (read before starting)

1. `docs/explorations/product-rename.md` — the measured surface and the traps
2. `CLAUDE.md` — R14, R9, R7, A2
3. `docs/GIT_WORKFLOW.md` — G-R3, G-R5, G-R10
4. `docs/GOTCHAS.md` — `G-NODE-2` (worktrees resolve the package scope to the
   main checkout; after Edit 2 the scope changes and stale `dist/` will bite)
5. `docs/AGENT_PLAYBOOK.md` — Chapter 2, Lesson #6

## Expected output (end of session)

1. Branch and `git log --oneline main..HEAD`
2. `git diff --stat origin/main...HEAD`
3. Any checkbox not met, with explanation
4. Confirmation that no `git push` ran
5. The Edit 5 owner actions, verbatim, as the closing message
