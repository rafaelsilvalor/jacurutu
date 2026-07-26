# Brief: 045 — Declare `readManifest` return as `TaskManifest`

> **Category:** M
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `refactor/gateway-manifest-shape`

---

## Context

`packages/core/src/gateways.ts` carries two `TODO(2026-06-06)` markers on the
`DriveGateway` port. The second — on `readManifest(drivePath: string):
Promise<unknown>`, "finalize manifest shape once Phase 3 TaskManifest is
fixed" — had its precondition satisfied by session 035: the `TaskManifest`
contract (schemaVersion 2) now lives in `packages/core/src/workspace.ts` with
a fail-loud `parseManifest(unknown): TaskManifest` validator. The 035
executor report queued this as "needs a follow-up decision"; the Orchestrator
closed that decision this session. `DriveGateway` has zero implementors and
zero call sites (verified: only the interface declaration in `gateways.ts`
and the re-export in core's `index.ts`), so the contract refinement is
compile-safe.

P4 numbering evidence (three sources, checked 2026-07-26): `ls docs/tasks/`
tops at `044-missing-env-dx`; `git log --oneline origin/main` tops at
`b291f49` (PR #104, the 044 orchestrator recap — no unlanded brief ahead);
`CLAUDE.md` documents exceptions E1, E2, E3, E5 only — no forward slot
reserves. All three sources agree: next slot is 045.

## Goal

Refine the `DriveGateway.readManifest` port contract so its return type is
`Promise<TaskManifest>` (imported from `./workspace.js`), remove the resolved
TODO, and state the implementation contract (adapters validate via
`parseManifest` before returning) in the port's doc comment.

Out of scope:

- `packages/core/src/workspace.ts` — the `TaskManifest` contract is consumed,
  not modified.
- `packages/core/src/index.ts` — `DriveGateway` is already re-exported;
  `TaskManifest`'s export status must be checked but **NOT** changed. If
  `TaskManifest` is not already exported from core's index, **STOP and
  report** rather than widening scope. (Planner pre-check: it is exported —
  `export type { HistoryEntry, HistoryEvent, TaskManifest }` at
  `index.ts:66`.)
- `uploadFolder`'s signature and its TODO — its precondition (Phase 3
  Workspace production-state / ship semantics) has not landed (D2).
- The `drivePath: string` parameter of `readManifest` (D3).
- `JiraGateway`, `SheetGateway`, and all adapter packages.
- Any runtime behavior: this is a type-level contract refinement only (R14).

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/045-gateway-manifest-shape/brief.md` (this file)
   - `packages/core/src/gateways.ts`
   If anything else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md` (especially R14 — no behavior change;
   R21 — `.js` extension in imports; R25 — core never imports an adapter;
   R9 — English-only).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - Branch: `refactor/gateway-manifest-shape`, created from base `b291f49`
     (D4)
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
4. **Branch guard (D4):** this session runs in a worktree whose original
   checked-out branch violates R11/G-R2 and fails validator check C4. All
   commits land on `refactor/gateway-manifest-shape`. If
   `git branch --show-current` prints anything else, run
   `git switch refactor/gateway-manifest-shape` (the planner created it from
   `b291f49`) before any edit. Never commit on a `claude/*` branch.
5. **G-NODE-2 precondition (docs/GOTCHAS.md):** the worktree `npm install` +
   lockfile guard was already applied this session; the executor still
   verifies before the first build/test that `node_modules` is present and
   `@saci/core` resolves inside the worktree. If not, run `npm install` at
   the worktree root and confirm `git status --short` shows **no
   tracked-file changes** (especially `package-lock.json`). On drift,
   **STOP and report**.
6. **Green boundary:** full `npm run build` + `npm test` green before
   Pause 3. The suite currently reports 257 passing tests; the count must be
   unchanged (D5 — no new tests: an interface has no runtime to test).

### Conventions

- All code and comments in English (R9).
- Commit scopes: `tasks` for the brief, `core` for the port change.
- Type-only import (`import type`) for `TaskManifest` — the port file stays
  interface-only, zero runtime imports.

### Architectural decisions already made (do not revisit)

#### D1 — `readManifest` returns `Promise<TaskManifest>`

The return type becomes `Promise<TaskManifest>`, importing the type from
`./workspace.js` (R21: `.js` extension; type-only import is fine). The
port's doc comment states the implementation contract: adapters validate the
raw Drive bytes via `parseManifest` (fail-loud, R4) before returning — the
port never surfaces an unvalidated object.

#### D2 — Remove the resolved TODO only

The resolved TODO comment on `readManifest` is removed. The `uploadFolder`
TODO stays untouched: its precondition (Phase 3 Workspace production-state /
ship semantics) has not landed.

#### D3 — `drivePath: string` stays as-is

Reshaping the parameter without a concrete Drive adapter is premature (A3);
the manifest-shape TODO covers the return type only.

#### D4 — Commit type `refactor`, branch from `b291f49`

R14 holds: no behavior change — the port has no implementors, no call sites,
no runtime path; user-visible output is identical. Branch
`refactor/gateway-manifest-shape` created from base `b291f49`. Subject:
`refactor(core): declare readManifest return as TaskManifest` (verb
`declare` is on the Check 3 allowlist).

#### D5 — Category S by size; standard pipeline anyway

S by size, but per the 038 precedent the task still gets a slot, a brief,
and the standard pipeline (recorded as Category M for template
compatibility). Plan required: no. No new tests: an interface has no runtime
to test; the green boundary (full build + `npm test`, currently 257 passing)
still gates the commit.

## Done criteria

### Edit 1 — Verify brief, branch, and commit #1

The planner authored this brief and committed it as commit #1 on
`refactor/gateway-manifest-shape`. The executor verifies before touching
code:

- [ ] `git branch --show-current` prints `refactor/gateway-manifest-shape`
      (else switch per constraint 4)
- [ ] File `docs/tasks/045-gateway-manifest-shape/brief.md` exists; first
      line matches the title above
- [ ] `git log --oneline -1` shows subject
      `docs(tasks): add brief for 045-gateway-manifest-shape`
- [ ] G-NODE-2 precondition verified per constraint 5, then
      `npm run build` + `npm test` green (257)

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

### Edit 2 — Refine `readManifest` contract in `gateways.ts`

In `packages/core/src/gateways.ts`, three changes:

#### 2a. Add the type-only import

After the existing `import type { Issue } from "./payload.js";` line, add:

```ts
import type { TaskManifest } from "./workspace.js";
```

#### 2b. Update the `DriveGateway` interface doc comment

The interface-level doc comment currently ends with "The concrete payload
shapes depend on the Phase 3 Workspace / manifest design and are
intentionally left open here." — half-resolved now. Replace that final
sentence with:

```
 * The upload contract still depends on the Phase 3 Workspace
 * production-state semantics and is intentionally left open; the manifest
 * shape is fixed by `TaskManifest` (schemaVersion 2, `./workspace.js`).
```

The preceding sentences ("Port for the Drive-backed asset store. No Python
precursor — the seed does not touch Drive. Minimal surface: one ship-implied
operation and one load-implied operation.") stay byte-identical.

#### 2c. Replace the `readManifest` block

Replace the TODO comment, doc comment, and signature of `readManifest`
(the two `// TODO(2026-06-06): finalize manifest shape ...` lines, the
one-line doc comment, and the signature) with:

```ts
  /**
   * Read the task manifest stored at a Drive path. Implementation contract:
   * adapters validate the raw Drive bytes via `parseManifest` (fail-loud,
   * R4) before returning — the port never surfaces an unvalidated object.
   */
  readManifest(drivePath: string): Promise<TaskManifest>;
```

The `uploadFolder` block — its TODO, doc comment, and signature — stays
byte-identical (D2).

Verification:

- [ ] `grep -n 'Promise<unknown>' packages/core/src/gateways.ts` returns no
      matches
- [ ] `grep -c 'TODO' packages/core/src/gateways.ts` returns exactly `1`,
      and that match is the `uploadFolder` folder-upload TODO
- [ ] `grep -n 'import type { TaskManifest } from "./workspace.js"'
      packages/core/src/gateways.ts` returns one match
- [ ] `grep -n 'parseManifest' packages/core/src/gateways.ts` matches only
      inside the `readManifest` doc comment (documentation reference, not a
      runtime import — the file keeps zero runtime imports)
- [ ] `uploadFolder(localFolderPath: string): Promise<string>;` is unchanged
- [ ] `grep -rn 'from.*adapter' packages/core/src/` returns no matches (R25)
- [ ] `git diff b291f49 -- packages/core/src/index.ts
      packages/core/src/workspace.ts` is empty (out-of-scope files untouched)
- [ ] `npm run build` green; `npm test` reports 257 passing, 0 failing
      (count unchanged)

Commit: `refactor(core): declare readManifest return as TaskManifest`

### Commit sequence

1. `docs(tasks): add brief for 045-gateway-manifest-shape`
2. `refactor(core): declare readManifest return as TaskManifest`

Both subjects ≤ 72 chars (53 and 60); verbs `add` and `declare` are on the
allowlist in `.claude/skills/pre-commit-self-audit/SKILL.md` (Check 3 SSOT).

### Automated checks (run before each commit)

- [ ] `npm run build` passes without errors
- [ ] `npm test` passes (257, unchanged)
- [ ] No lockfile drift from any G-NODE-2 `npm install` (constraint 5)

### Structural checks

- [ ] `git diff --name-only b291f49..HEAD` lists exactly:
      `docs/tasks/045-gateway-manifest-shape/brief.md`,
      `packages/core/src/gateways.ts`
- [ ] No new files under `packages/core/src/`

### Behavior checks

- [ ] No behavior change (R14): `DriveGateway` has zero implementors and
      zero call sites, so the compiled output has no runtime path through
      this port; `saci fetch` / `saci export` / `saci start` behavior is
      byte-identical to before
- [ ] `packages/core/dist/gateways.d.ts` (after build) declares
      `readManifest(drivePath: string): Promise<TaskManifest>;`

### Git checks

- [ ] Branch used: `refactor/gateway-manifest-shape`
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 1 skipped (`Plan required: no`)
- [ ] Pause 2 — first modified source file (`gateways.ts`) shown for review
      before proceeding (always required)
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed commit message
      shown before each commit (always required)
- [ ] `pre-commit-self-audit` skill output reported in chat before each
      Pause 3 submission
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1:** skipped — `Plan required: no`.
- **Pause 2 (after the first modified file):** show the `gateways.ts` diff
  and wait for review. **Always required.**
- **Pause 3 (before each commit):** show `git status` + `git diff --stat`
  + proposed message + `pre-commit-self-audit` output. **Always required.**

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md` as
  a follow-up brief.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

- Every change is specified above with exact text snippets and verification
  checkboxes (Edit 2a-2c).
- All architectural decisions are closed (D1–D5) in the Constraints section.
- The judgment calls (out-of-scope export status, lockfile drift) have
  explicit STOP-and-report fallbacks.

**Pause 2 and Pause 3 remain required** regardless of `Plan required` —
Lesson #6 of `docs/AGENT_PLAYBOOK.md`.

## Git workflow

### Branch

`refactor/gateway-manifest-shape`, created from base `b291f49` (the tip of
`origin/main` at authoring time). See constraint 4 for the worktree branch
guard.

### Commit sequence

1. `docs(tasks): add brief for 045-gateway-manifest-shape`
2. `refactor(core): declare readManifest return as TaskManifest`

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules (R14, R21, R25 especially)
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — G-NODE-2 (worktree module resolution)
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
5. `.claude/skills/brief-template/SKILL.md` — template reference
6. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit (Pause 3)
7. `packages/core/src/gateways.ts` — the one source file in scope
8. `packages/core/src/workspace.ts` — the `TaskManifest` contract (read-only)

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline b291f49..HEAD` (commit count, ordered)
2. `git diff --stat b291f49...HEAD` (line counts per file)
3. Any verification checkbox from this brief that could not be met, with
   explanation
4. Confirmation that no `git push` was executed
5. Suggested next step (open PR for Rafael to review; never auto-merge)
