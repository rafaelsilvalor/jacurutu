# Brief: 040 — Add opt-in --open flag to saci start

> **Category:** M
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `feat/open-in-software`

---

## Context

Session 032 (`docs/sessions/2026-07-04-mentor-032-start-scaffold.md`, D3)
deferred open-in-software out of `start` v0: the scaffold ships the folder and
the copied editable, but the user still opens the file by hand. Brief 036
added the second start route (`start --local`). This brief delivers the
deferred capability: an opt-in `--open` flag on both start routes that, after
a fully successful scaffold, launches the OS-native opener on the produced
artifact. The D-set below was ratified in the Orchestrator session; encode
as-is.

## Goal

Add an opt-in `--open` boolean flag to `saci start <KEY>` and
`saci start --local` that opens the scaffold's editable artifact via the
platform opener after the scaffold succeeds. Without the flag, behavior is
byte-identical to today.

Out of scope:

- App-choice configuration (which app opens which extension).
- A `--no-open` flag (no default-on behavior exists to negate).
- Opening anything on `fetch` or `export`.
- Any change under `packages/core/` (including `gateways.ts`) — this is OS
  glue, not a port (R25).
- Electron shell APIs and the `open` npm package (R2: zero new runtime deps).
- `packages/cli/src/run-start.ts` and `packages/cli/src/display.ts` are
  expected to stay untouched — the open consumes the `StartRunResult` already
  returned. If the plan requires touching either, **flag it at Pause 1**; do
  not silently expand scope.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   `packages/cli/src/argv.ts`, `packages/cli/src/argv.test.ts`,
   `packages/cli/src/open-path.ts` (new),
   `packages/cli/src/open-path.test.ts` (new), `packages/cli/src/cli.ts`,
   `packages/cli/src/cli.test.ts` (only if needed), and
   `docs/tasks/040-open-in-software/`. If anything else needs changing,
   **STOP and ask**.
2. Follow all rules in `CLAUDE.md` (especially R2, R3, R4, R7, R20, R21,
   R23, R24, R25).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - Branch: `feat/open-in-software` (already created from `main@88285a7`)
   - Conventional Commits (G-R3); no `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
4. Tests must not launch any application: command selection is a pure
   function of an injectable platform value, and the spawn function is
   injectable (D4). No test may depend on a real opener existing.
5. Read `docs/GOTCHAS.md` before wiring the spawn — brief 033 fixed a libuv
   double-close crash at process exit on Windows; the detached spawn must not
   reintroduce an exit-path hang or crash.

### Conventions

- All code, comments, tests, and commit messages in English (R9).
- Commit scope: `cli`. Types per R10.
- Module-top `SCREAMING_SNAKE_CASE` for any policy literal (R7).

### Architectural decisions already made (do not revisit)

Numbering preserved from the ratified D-set (D1 closed the go decision in
the Orchestrator session; it prescribes no code).

#### D2 — UX: opt-in, both routes, byte-identical default

`--open` is opt-in and valid on BOTH start routes (Jira-born
`saci start <KEY>` and `saci start --local`). Default behavior without the
flag is byte-identical to today. No `--no-open`.

#### D3 — Target selection

With a template applied, open `StartRunResult.copiedFile` (the copied
editable file — OS extension association picks the app); on the `--blank`
path open `StartRunResult.editablePath` (the `editaveis/` folder). Same
native mechanism handles both (i.e. `copiedFile ?? editablePath`).

#### D4 — Mechanism: `open-path.ts` spawning the platform opener

New module `packages/cli/src/open-path.ts` in `@saci/cli`. Spawns the
platform opener via `node:child_process` — Windows:
`cmd /c start "" <path>` (`start` is a cmd builtin; the empty `""` is the
mandatory title argument when the path is quoted); macOS: `open`; Linux:
`xdg-open`. Detached + `unref()` so the CLI exits without waiting. Zero new
runtime dependencies (R2). Not a core port — OS glue with zero domain logic;
`core` and `gateways.ts` stay untouched (R25). Command selection is a pure
function of an injectable platform value, and the spawn function is
injectable, so tests assert command/args per platform without launching
anything (R3).

#### D5 — Failure semantics: report to stderr, still exit 0

The open runs only after the scaffold fully succeeded. A spawn-launch
failure (spawn `error` event — missing opener, EPERM) is reported to stderr
with the attempted path and cause, and the process still exits 0. No
rollback. Declared limit: we detect launch failure only, not whether the app
actually opened (detached makes app-level success unobservable by design).

## Done criteria

### Edit 1 — Verify brief on disk (commit #1, authored by planner)

The planner committed this brief as commit #1 on `feat/open-in-software`.
P4 numbering evidence recorded at authoring time:

- `ls docs/tasks/` — highest existing slot: `039-orchestrator-doctrine`.
- `git log --oneline main` — tip `88285a7 docs: document fused-model
  orchestrator doctrine (brief 039) (#96)`; no unmerged brief beyond 039.
- `CLAUDE.md` E* exceptions (E1, E2, E3, E5) reserve no slot at 040 (E5's
  burned slots are 004-006).

- [ ] File `docs/tasks/040-open-in-software/brief.md` exists; first line
      matches the title above
- [ ] Commit #1 subject is `docs(tasks): add brief for 040-open-in-software`

If the file is missing or the first line does not match, **STOP and report**.

### Edit 2 — Create `open-path.ts` with colocated tests

Implement D4/D5 in `packages/cli/src/open-path.ts` plus
`packages/cli/src/open-path.test.ts`. Exact function names and signatures
are proposed at Pause 1.

Verification:

- [ ] Pure command-selection function returns, per platform value:
      `win32` → `cmd` with `["/c", "start", "", <path>]`; `darwin` →
      `open` with `[<path>]`; other → `xdg-open` with `[<path>]`
- [ ] Spawn is injectable; module defaults to `node:child_process` `spawn`
      with `detached: true` and `unref()` (stdio not inherited)
- [ ] Spawn `error` event writes attempted path + cause to stderr and does
      not change the exit code (D5)
- [ ] Tests cover all three platforms and the error path without spawning
      any real process
- [ ] `grep -rn 'from.*adapter' packages/core/` still returns no matches;
      no `packages/core/` file modified

Commit: `feat(cli): add open-path platform opener module`

### Edit 3 — Wire `--open` through argv and cli

In `packages/cli/src/argv.ts`: add `open` to `CLI_OPTIONS` / `CliValues`,
carry `open: boolean` on both the `start` and `start-local` variants of
`ParsedCommand`, and update `USAGE` to show `[--open]` on both start lines.
In `packages/cli/src/cli.ts`: after the `renderStart` output write on each
start route, when `open` is set, invoke the opener on
`result.copiedFile ?? result.editablePath` (D3). Update `argv.test.ts`
(and `cli.test.ts` only if needed).

Verification:

- [ ] `parseArgv` yields `open: true` only when the flag is present, on
      both routes; `open: false` otherwise (D2)
- [ ] `USAGE` shows `[--open]` on both `saci start` lines
- [ ] Without `--open`, stdout/stderr and exit codes are unchanged and no
      opener is invoked (D2 byte-identical default)
- [ ] The opener runs only after a successful scaffold; never on the
      usage/error paths (D5)

Commit: `feat(cli): wire --open flag into both start routes`

### Automated checks (run before each commit)

- [ ] `npm run build` passes (workspace `tsc -p .`)
- [ ] `npm test` passes (run manually — the pre-commit hook is not wired
      in this clone)

### Structural checks

- [ ] `packages/cli/src/open-path.ts` and `open-path.test.ts` exist
- [ ] No file outside the constraint-1 list was modified
      (`git diff --name-only main..HEAD`)

### Git checks

- [ ] Branch used: `feat/open-in-software`; subjects ≤ 72 chars; no
      `Co-authored-by` trailer; `git status` clean at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 1 — numbered plan presented and approved before any change
- [ ] Pause 2 — first modified file shown for review
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message +
      `pre-commit-self-audit` output before each commit
- [ ] Any unmet criterion reported explicitly

## Pause points

- **Pause 1 (before any code): required** (`Plan required: yes`).
- **Pause 2 (after the first modified file): required.**
- **Pause 3 (before each commit): required.**

Unrelated bug found → report and ask. Technical limitation → report.
Undocumented gotcha → report; document in `docs/GOTCHAS.md` as a follow-up
brief. **DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: yes` — the D-set closes mechanism and semantics, but exact
placement is left open: `open-path.ts` function signatures, how the spawn
injection threads into `cli.ts`'s two start cases, and whether `cli.test.ts`
needs an end-to-end case. The executor proposes these at Pause 1.

## Git workflow

### Branch

`feat/open-in-software`, created from `main@88285a7`. No push (G-R5).

### Commit sequence

1. `docs(tasks): add brief for 040-open-in-software`
2. `feat(cli): add open-path platform opener module`
3. `feat(cli): wire --open flag into both start routes`

## Reference documents (read before starting)

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — known traps (Windows exit-path crash, brief 033)
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
5. `.claude/skills/pre-commit-self-audit/SKILL.md` — Pause 3 audit
6. `packages/cli/src/run-start.ts` — `StartRunResult` contract (read-only)

## Expected output (end of session)

1. Branch name and `git log --oneline main..HEAD`
2. `git diff --stat main...HEAD`
3. Any unmet checkbox, with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step (open PR)
