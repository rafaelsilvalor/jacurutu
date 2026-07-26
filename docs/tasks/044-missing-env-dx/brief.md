# Brief: 044 — Name only the missing Jira env vars in the CLI error

> **Category:** M
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `feat/missing-env-dx`

---

## Context

The `saci` CLI's credential check in `packages/cli/src/cli.ts`
(`makeGatewayFactory`) throws a fixed-text error when any of the three Jira
env credentials is missing or empty: it names all three vars regardless of
which one is actually absent. This is real end-user friction: first recorded
in session 033 (the blanket message masked a `SACI_JIRA_TOKEN` vs
`SACI_JIRA_API_TOKEN` typo), second occurrence tracked through the
rule-of-three ledger, promoted to the slot-044 front-runner by the 043
orchestrator recap.

P4 numbering evidence (three sources, checked 2026-07-26): `ls docs/tasks/`
tops at `043-gotcha-worktree-resolution`; `git log --oneline` tops at
`1fc9ee8` (PR #102, the 043 orchestrator recap — no unlanded brief ahead);
`CLAUDE.md` documents exceptions E1, E2, E3, E5 only — no forward slot
reserves. All three sources agree: next slot is 044.

## Goal

Make the missing-credentials error name only the env var(s) that are actually
missing or empty, and cover the new behavior with end-to-end CLI tests.

Out of scope:

- `packages/cli/src/argv.ts` — the usage/exit-2 path is untouched.
- Any change to which env vars exist or their names.
- `SACI_IDENTITY_FILE` handling and the `start --local` path.
- Error handling of any other path (identity errors, gateway errors, etc.).
- Any refactor of `makeGatewayFactory` beyond the message construction —
  no error subclass, no new module, no exported helper (D2).
- Exit codes and all success paths: identical before and after.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/044-missing-env-dx/brief.md` (this file)
   - `packages/cli/src/cli.ts`
   - `packages/cli/src/cli.test.ts`
   If anything else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md` (especially R4, R9, R10, R14 boundary —
   this is a `feat`, behavior change limited to the stderr message content).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - Branch: `feat/missing-env-dx`, created from base `1fc9ee8` (D4)
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
4. **Branch guard (D4):** this session runs in a worktree whose original
   checked-out branch (`claude/missing-env-dx-e8d94f`) violates R11/G-R2 and
   fails validator check C4. All commits land on `feat/missing-env-dx`. If
   `git branch --show-current` prints anything else, run
   `git switch feat/missing-env-dx` (the planner created it from `1fc9ee8`)
   before any edit. Never commit on a `claude/*` branch.
5. **G-NODE-2 precondition (docs/GOTCHAS.md):** this worktree may have an
   empty `node_modules` that silently resolves `@saci/*` imports up-tree to
   the main checkout. Before the first build/test: run `npm install` at the
   worktree root, then verify `git status --short` shows **no tracked-file
   changes** (especially `package-lock.json`). If it shows drift, **STOP and
   report** — no lockfile drift may land.
6. **Green boundary:** full `npm run build` + `npm test` green before every
   Pause 3. The suite currently reports 255 passing tests; after Edit 3 it
   must report 257.

### Conventions

- All code, comments, and test names in English (R9).
- Commit scopes: `tasks` for the brief, `cli` for the code change.
- Named constants `ENV_BASE_URL` / `ENV_EMAIL` / `ENV_API_TOKEN` are reused
  in message construction and test assertions — no string literals for var
  names in `cli.ts` (R7 already holds; keep it that way).

### Architectural decisions already made (do not revisit)

#### D1 — Message names only the missing var(s)

The error message names only the vars that are missing or empty, preserving
the current falsy check (`!baseUrl || !email || !apiToken` — empty string
counts as missing). When multiple are missing, list all of the missing ones,
in declaration order (base URL, email, API token). Suggested shape:
`Missing required env: <names> is/are not set.` — exact grammar is the
executor's call, but the set/unset discrimination is mandatory, and the
message must contain the full names of the missing vars and none of the set
ones. Transport unchanged: plain `Error` thrown from `makeGatewayFactory`,
message to stderr via `main()`'s catch, exit code 1 (`EXIT_RUNTIME`, D-a4
boundary clause unchanged).

#### D2 — No new abstraction

No error subclass, no new module, no exported helper. Session 026 flagged
`UsageEnvError` as A3 (premature abstraction); this stays an inline check
inside `makeGatewayFactory`. Testing is end-to-end through the compiled CLI,
not via a unit-tested pure helper.

#### D3 — End-to-end tests via the existing `spawnSync` pattern

Extend `packages/cli/src/cli.test.ts` following its existing `spawnSync` +
scrubbed-env pattern. The `runCli` helper scrubs all `SACI_*` vars; give it
an optional parameter to inject selected `SACI_JIRA_*` values after the
scrub. Two cases minimum, both against `saci fetch --jql <anything>` (valid
argv, so the shell reaches the env check; the throw fires before any gateway
construction, so no network is touched). Substring-safety note: the three
var names share the `SACI_JIRA_` prefix but none is a prefix of another, so
absence assertions are safe **only** on full var names — never assert on the
shared prefix.

#### D4 — Branch and commit type

Branch `feat/missing-env-dx` from base `1fc9ee8` (see constraint 4). Commit
type `feat`: user-visible behavior improvement in the error output.

#### D5 — Category M, Plan required: no

Small contained scope: two source files plus this brief.

## Done criteria

### Edit 1 — Verify brief, branch, and commit #1

The planner authored this brief and committed it as commit #1 on
`feat/missing-env-dx`. The executor verifies before touching code:

- [ ] `git branch --show-current` prints `feat/missing-env-dx` (else switch
      per constraint 4)
- [ ] File `docs/tasks/044-missing-env-dx/brief.md` exists; first line
      matches the title above
- [ ] `git log --oneline -1` shows subject
      `docs(tasks): add brief for 044-missing-env-dx`
- [ ] G-NODE-2 precondition executed: `npm install` at worktree root, no
      tracked-file drift, then `npm run build` + `npm test` green (255)

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

### Edit 2 — Discriminate missing vars in `makeGatewayFactory`

In `packages/cli/src/cli.ts`, replace the throw inside the
`if (!baseUrl || !email || !apiToken)` block. Illustrative shape (grammar is
the executor's call per D1; the collection of missing names is mandatory):

```ts
  if (!baseUrl || !email || !apiToken) {
    const missing = [
      ...(baseUrl ? [] : [ENV_BASE_URL]),
      ...(email ? [] : [ENV_EMAIL]),
      ...(apiToken ? [] : [ENV_API_TOKEN]),
    ];
    throw new Error(
      `Missing required env: ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} not set.`,
    );
  }
```

Also update the `makeGatewayFactory` doc comment's first sentence if it
becomes inaccurate (it currently describes the resolution, which stays true —
touch it only if needed).

Verification:

- [ ] The guard condition is byte-identical:
      `if (!baseUrl || !email || !apiToken) {` (falsy semantics preserved)
- [ ] `grep -n "must all be set" packages/cli/src/cli.ts` returns no matches
- [ ] Message construction uses `ENV_BASE_URL` / `ENV_EMAIL` /
      `ENV_API_TOKEN`, in that order — no string-literal var names
- [ ] `grep -n "class .*Error" packages/cli/src/cli.ts` returns no matches;
      no new file, no new export (D2)
- [ ] `throw new Error(` remains inside `makeGatewayFactory`; `main()`'s
      catch and the exit-code constants are untouched

Commit: `feat(cli): update missing-env error to name absent vars`
(shared with Edit 3 — one commit for feature + tests)

### Edit 3 — End-to-end tests for the discriminated error

In `packages/cli/src/cli.test.ts`:

#### 3a. Extend `runCli` with optional env injection

Add a third optional parameter, e.g.
`extraEnv?: Record<string, string>`, applied after the `SACI_*` scrub (and
after `SACI_IDENTITY_FILE` is set), so tests can inject selected
`SACI_JIRA_*` dummies. Existing call sites remain valid (parameter optional);
existing tests unchanged.

#### 3b. Two new tests against `fetch --jql`

The fetch path never reads the identity file, so pass a throwaway path (e.g.
under `tmpdir()`) as `identityFilePath`; no sandbox is required, but reusing
`makeSandbox()` is acceptable.

Test (a) — none of the three set:
run `["fetch", "--jql", "project = X"]` with no injected env. Assert:

- exit status is `EXIT_RUNTIME` (1)
- stderr matches `/Missing required env:/`
- stderr contains all three full names: `SACI_JIRA_BASE_URL`,
  `SACI_JIRA_EMAIL`, `SACI_JIRA_API_TOKEN`

Test (b) — exactly two set, one absent:
inject `SACI_JIRA_BASE_URL: "https://example.atlassian.net"` and
`SACI_JIRA_API_TOKEN: "dummy-token"`; leave `SACI_JIRA_EMAIL` unset. Assert:

- exit status is `EXIT_RUNTIME` (1)
- stderr contains `SACI_JIRA_EMAIL`
- stderr does **not** contain `SACI_JIRA_BASE_URL`
- stderr does **not** contain `SACI_JIRA_API_TOKEN`

(Substring safety per D3: all assertions use full var names; with
`SACI_JIRA_EMAIL` as the missing var, neither set var's name is a substring
of the message, so the negative assertions cannot false-positive.)

Verification:

- [ ] Both tests pass against the compiled `dist/` output
- [ ] `npm test` reports 257 passing tests, 0 failing
- [ ] The three pre-existing tests in `cli.test.ts` are unmodified (diff
      touches only `runCli`'s signature/body and the appended tests)
- [ ] No test performs network I/O (the throw fires before gateway
      construction)

Commit: `feat(cli): update missing-env error to name absent vars`
(same commit as Edit 2)

### Commit sequence

1. `docs(tasks): add brief for 044-missing-env-dx`
2. `feat(cli): update missing-env error to name absent vars`

Both subjects ≤ 72 chars; verbs `add` and `update` are on the allowlist in
`.claude/skills/pre-commit-self-audit/SKILL.md` (Check 3 SSOT).

### Automated checks (run before each commit)

- [ ] `npm run build` passes without errors
- [ ] `npm test` passes (257 after Edit 3)
- [ ] No lockfile drift from the G-NODE-2 `npm install` (constraint 5)

### Structural checks

- [ ] `git diff --name-only 1fc9ee8..HEAD` lists exactly:
      `docs/tasks/044-missing-env-dx/brief.md`, `packages/cli/src/cli.ts`,
      `packages/cli/src/cli.test.ts`
- [ ] No new files under `packages/cli/src/` (D2)

### Behavior checks

- [ ] With all three vars unset, `saci fetch --jql x` exits 1 and stderr
      names all three vars
- [ ] With exactly one var unset, stderr names only that var
- [ ] Empty-string values count as missing (falsy check preserved)
- [ ] `saci --version`, usage errors (exit 2), and `start --local` behavior
      are byte-identical to before

### Git checks

- [ ] Branch used: `feat/missing-env-dx`
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 1 skipped (`Plan required: no`)
- [ ] Pause 2 — first modified source file (`cli.ts`) shown for review
      before proceeding (always required)
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed commit message
      shown before each commit (always required)
- [ ] `pre-commit-self-audit` skill output reported in chat before each
      Pause 3 submission
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1:** skipped — `Plan required: no`.
- **Pause 2 (after the first modified file):** show the `cli.ts` diff and
  wait for review. **Always required.**
- **Pause 3 (before each commit):** show `git status` + `git diff --stat`
  + proposed message + `pre-commit-self-audit` output. **Always required.**

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md` as
  a follow-up brief.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

- Every change is specified above with exact guard text, an illustrative
  code shape, and verification checkboxes.
- All architectural decisions are closed (D1–D5) in the Constraints section.
- The judgment calls (message grammar, sandbox reuse) are bounded by
  mandatory invariants with STOP-and-report fallbacks.

**Pause 2 and Pause 3 remain required** regardless of `Plan required` —
Lesson #6 of `docs/AGENT_PLAYBOOK.md`.

## Git workflow

### Branch

`feat/missing-env-dx`, created from base `1fc9ee8` (the tip of `main` at
authoring time). See constraint 4 for the worktree branch guard.

### Commit sequence

1. `docs(tasks): add brief for 044-missing-env-dx`
2. `feat(cli): update missing-env error to name absent vars`

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — G-NODE-2 (worktree module resolution)
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
5. `.claude/skills/brief-template/SKILL.md` — template reference
6. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit (Pause 3)
7. `packages/cli/src/cli.ts` and `packages/cli/src/cli.test.ts` — the two
   files in scope

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat 1fc9ee8...HEAD` (line counts per file)
3. Any verification checkbox from this brief that could not be met, with
   explanation
4. Confirmation that no `git push` was executed
5. Suggested next step (open PR for Rafael to review; never auto-merge)
