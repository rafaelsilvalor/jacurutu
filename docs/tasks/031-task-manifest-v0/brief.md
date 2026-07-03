# Brief: 031 — TaskManifest v0 contract in @saci/core

> **Category:** M
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `feat/task-manifest-v0`

---

## Context

This brief defines the **TaskManifest v0 contract** in `@saci/core`: the
`.saci.json` manifest that the future `start` command writes to a task
folder's root and that `ship` later updates. It is a pure domain contract —
the type plus a parse/validate function and a serialize function — with no
file I/O and no CLI wiring (those are composition-root concerns for a later
brief).

**This is a RECONCILE task, not a greenfield create.** A `TaskManifest` type
already exists in `packages/core/src/workspace.ts`, alongside a `Workspace`
type and event types. The existing design is superseded and must be replaced.

### Ground-truth inventory (run 2026-07-03; recorded verbatim)

`grep -rn "TaskManifest" packages/core/src/`:

- `packages/core/src/workspace.ts:40` — `export interface TaskManifest`
  (type ALREADY EXISTS)
- `packages/core/src/workspace.ts:1` — file header comment; `:33` —
  `Workspace.manifest: TaskManifest`
- `packages/core/src/index.ts:60` — re-exported
- `packages/core/src/gateways.ts:43` — TODO comment referencing "Phase 3
  TaskManifest" (KEEP AS-IS)

`grep -rn "Workspace" packages/core/src/`:

- `packages/core/src/workspace.ts:21` — `export interface Workspace`
  (embeds `manifest: TaskManifest`)
- `packages/core/src/workspace.ts:7` — `WorkspaceEventType`; `:10` —
  `WorkspaceEvent`
- `packages/core/src/index.ts:59,61,62` — `Workspace`, `WorkspaceEvent`,
  `WorkspaceEventType` re-exported
- `packages/core/src/gateways.ts:34,38` — TODO comments (KEEP AS-IS)

`ls packages/core/src/`: assemble.test.ts, assemble.ts, derive-path.test.ts,
derive-path.ts, export.test.ts, export.ts, gateways.ts, index.test.ts,
index.ts, payload.ts, policy.test.ts, policy.ts, transform.test.ts,
transform.ts, types.ts, workspace.ts

Current contents of `packages/core/src/workspace.ts` (to be replaced; field
JSDoc elided here — the real file has one-line JSDoc per field):

```ts
// Workspace and TaskManifest domain type contracts (2026-05-28 design,
// authoritative). Plain field-documented types — no methods, no I/O.

import type { Issue } from "./payload.js";

export type WorkspaceEventType = "start" | "ship" | "load" | "handoff";

export interface WorkspaceEvent {
  type: WorkspaceEventType;
  at: string;
}

export interface Workspace {
  jiraKey: string;
  localFolderPath: string;
  appliedTemplate: string;
  productionState: string;
  drivePath: string;
  manifest: TaskManifest;
}

export interface TaskManifest {
  issueSnapshot: Issue;
  templateUsed: string;
  drivePath: string;
  eventHistory: WorkspaceEvent[];
  claimed_by?: string;
}
```

Current `packages/core/src/index.ts` re-export block (lines 58-63):

```ts
export type {
  Workspace,
  TaskManifest,
  WorkspaceEvent,
  WorkspaceEventType,
} from "./workspace.js";
```

### Fork resolution + STOP guard resolution

- **Fork:** a `TaskManifest` type ALREADY exists → this is a reconcile/replace,
  not a create.
- **Judgment-flag STOP guard fired:** `Workspace` exists and overlaps the v0
  schema on ≥ 2 fields (`jiraKey` exact; `drivePath` same name, conflicting
  type `string` vs `readonly string[]`). Surfaced to the user; the user made
  the scope decision below.

### SCOPE DECISION (user-approved — rationale recorded verbatim)

**Replace workspace.ts (blast-radius option 3).**

Rationale: the 2026-05-28 `workspace.ts` design predates both the 2026-06-12
app-owns-state pivot (`eventHistory` is Phase 3 accumulated state, not a
portable-manifest concern) and the brief-030 segments contract. It has zero
consumers. Remove `Workspace`, `WorkspaceEvent`, and `WorkspaceEventType`;
`workspace.ts` becomes the v0 `TaskManifest` + `parseManifest` +
`serializeManifest` only. Adjust `index.ts` re-exports accordingly. Keep the
`gateways.ts:43` TODO comment as-is. Do NOT update ROADMAP/MENTOR_BRIEF in
this brief — the Phase 2 exit-criterion mention of `Workspace` is reconciled
in the pending docs session alongside the derivePath D2 deviation.

### P4 numbering evidence (three-source, run 2026-07-03)

- `ls docs/tasks/`: highest existing directory is `030-derive-path`.
- `git log --oneline main`: latest brief-bearing merge is
  `147bbc6 feat(core): add derivePath folder-segment derivation (#75)`
  (brief 030); no merged PR ships a 031 brief.
- `CLAUDE.md` E* reservations: E1–E5 carry no nominal slot for 031.
- Sources agree → next NNN is `031`.

## Goal

Replace `packages/core/src/workspace.ts` with the v0 `TaskManifest` type plus
a fail-loud `parseManifest` (`unknown → TaskManifest`) and a `serializeManifest`
function, add colocated `node:test` coverage, and adjust `index.ts` re-exports.

Out of scope:

- File I/O, Drive access, and CLI wiring (`start` / `ship` commands) — later
  composition-root briefs.
- `claimedBy` / handoff semantics (enters with `load`).
- Ship-history accumulation (Phase 3 state).
- Copy/briefing fields (copy ingestion is parked).
- Folder scaffolding (separate brief).
- `packages/core/src/gateways.ts` — the `:34/:38/:43` TODO comments are
  KEPT AS-IS; do not touch this file.
- `docs/ROADMAP.md` and `docs/MENTOR_BRIEF.md` — the Phase 2 exit-criterion
  `Workspace` mention is reconciled in the pending docs session, not here.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   `docs/tasks/031-task-manifest-v0/brief.md`,
   `packages/core/src/workspace.ts` (replaced),
   `packages/core/src/workspace.test.ts` (new),
   `packages/core/src/index.ts` (re-export block edited).
   If anything else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md` — especially R4 (no silent catch), R5
   (≤ 400 lines), R6 (≤ 50 lines/function), R7 (SCREAMING_SNAKE_CASE named
   constants), R8 (comments answer "why"), R20 (strict, no `@ts-ignore`),
   R21 (ESM, `.js` import extensions), R23 (`node:test`), R24 (no `any`),
   R25 (core imports no adapter).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `feat/task-manifest-v0`
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
4. `parseManifest` must fail loud (R4): throw on invalid input, or return a
   typed result the caller must handle. Do NOT silently return
   `null`/`undefined` without a documented, caller-handled contract. Input is
   `unknown` and narrowed (R24: no `any`).
5. `schemaVersion === 1` is checked BEFORE any other field parsing (D1 + D4).
   An unknown `schemaVersion` fails loud; parse does NOT attempt migration.

### Conventions

- English-only on this surface (R9: `docs/tasks/**`, code identifiers,
  comments, commit messages).
- Commit type `feat`, scope `core`. Verb `add` (allowlisted).
- Function-naming: match the existing core surface. `derive-path.ts` exports
  `derivePath` (value) with types re-exported via `export type`; `assemble.ts`
  exports `assemblePayload` + a `SCHEMA_VERSION` constant; `export.ts` exports
  verb-named functions (`projectIssue`, `applyColumns`). `parseManifest` /
  `serializeManifest` follow the verb-noun value-export precedent.
- `index.ts` re-export style: functions and runtime constants via `export {`;
  types via `export type {` (mirrors the existing block for `derive-path.js`
  and `assemble.js`).

### Architectural decisions already made (do not revisit)

#### D1 — v0 schema

All fields required; keys camelCase; timestamps ISO 8601 UTC. Fields, in order:

- `schemaVersion: 1` (literal type; FIRST field; checked before any other
  parsing)
- `jiraKey: string`
- `vertical: string` (sigla, e.g. `"OAB"`)
- `slug: string`
- `template: string` (catalog identifier, NOT a file path)
- `drivePath: readonly string[]` (segments, mirroring derivePath's contract
  from brief 030 — a segment array, not a joined string)
- `startedAt: string` (ISO 8601 UTC)
- `shippedAt: string | null` (present with `null` until first ship — uniform
  forward contract, same present-with-null pattern as `ParsedCommand`'s
  optional-shape discipline in `packages/cli/src/argv.ts`)

The `drivePath` segments shape mirrors `derivePath`'s return type in
`packages/core/src/derive-path.ts`: `derivePath(...) : readonly string[]`
returning `[grouping, vertical, YYYY-MM, leaf]`, root-agnostic; callers join
with `path.join`. The manifest stores the derived segments verbatim, not a
joined string.

#### D2 — Scope is core-pure

The type, a parse/validate function (`unknown → TaskManifest`, fail-loud per
R4, no `any` per R24), and a serialize function. NO file I/O, NO Drive access,
NO CLI wiring — those are composition-root concerns for a later brief.

#### D3 — Deferred fields (out of the v0 schema)

`claimedBy` / handoff semantics (enters with `load`), ship-history
accumulation (Phase 3 state), copy/briefing fields (copy ingestion parked),
folder scaffolding (separate brief).

#### D4 — parse rejects unknown schemaVersion, fail-loud, no migration

`parseManifest` rejects any `schemaVersion` value other than `1` fail-loud.
It does NOT attempt migration. The version check runs before any other field
parsing.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The user pre-saved this brief to `docs/tasks/031-task-manifest-v0/brief.md`
before invoking the executor (caminho B). The executor verifies presence and
commits.

- [ ] Directory `docs/tasks/031-task-manifest-v0/` exists
- [ ] File `docs/tasks/031-task-manifest-v0/brief.md` exists; first line matches
      the title above
- [ ] `git add docs/tasks/031-task-manifest-v0/brief.md` is staged
- [ ] Commit #1 created with subject `docs(tasks): add brief for 031-task-manifest-v0`

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

Commit: `docs(tasks): add brief for 031-task-manifest-v0`

### Edit 2 — Replace workspace.ts with the v0 TaskManifest + parse/serialize

Replace the entire contents of `packages/core/src/workspace.ts`. The new file
contains ONLY:

1. A schema-version constant at module top per R7 (used as a runtime value in
   the version check), e.g. `export const TASK_MANIFEST_SCHEMA_VERSION = 1;`.
2. The `TaskManifest` interface per D1 — all eight fields, in the D1 order,
   with a one-line JSDoc per field explaining "why" where non-obvious (R8).
   `schemaVersion` typed as the literal `1`. `drivePath: readonly string[]`.
   `shippedAt: string | null`.
3. `parseManifest(input: unknown): TaskManifest` — fail-loud (R4), narrows
   from `unknown` (no `any`, R24), checks `schemaVersion === 1` BEFORE any
   other field parsing (D1 + D4), rejects unknown versions without migration
   (D4). Each function ≤ 50 lines (R6); split validation helpers if needed.
4. `serializeManifest(manifest: TaskManifest): string` — produces the
   `.saci.json` string form (round-trips with `parseManifest`).

The file header comment must be rewritten (the current "Workspace and
TaskManifest domain type contracts (2026-05-28 design, authoritative)" header
no longer describes the file). `Workspace`, `WorkspaceEvent`, and
`WorkspaceEventType` are REMOVED. The `import type { Issue }` line is removed
unless a remaining field references `Issue` (v0 schema does not — remove it).

**STOP-and-confirm guard (judgment flag — `drivePath` type conflict):** the
existing `Workspace.drivePath` and old `TaskManifest.drivePath` are typed
`string`; the v0 schema types `drivePath` as `readonly string[]`. If, while
implementing, any consumer of the old `string`-typed `drivePath` is discovered
(the inventory reports zero consumers), **STOP and report** before proceeding
— do not silently coerce a joined string into segments.

Verification:

- [ ] `grep -n "export interface TaskManifest" packages/core/src/workspace.ts`
      returns exactly one match
- [ ] `grep -cE "Workspace|WorkspaceEvent|WorkspaceEventType" packages/core/src/workspace.ts`
      returns `0`
- [ ] `grep -n "readonly string\[\]" packages/core/src/workspace.ts` shows
      `drivePath: readonly string[]`
- [ ] `grep -n "shippedAt" packages/core/src/workspace.ts` shows
      `shippedAt: string | null`
- [ ] `grep -nE "parseManifest|serializeManifest" packages/core/src/workspace.ts`
      shows both exported as functions (values)
- [ ] The version check on `schemaVersion === 1` textually precedes any other
      field access in `parseManifest`
- [ ] `grep -cE "\bany\b" packages/core/src/workspace.ts` returns `0`
      (no `any` type; R24)
- [ ] `grep -c "@ts-ignore\|@ts-expect-error" packages/core/src/workspace.ts`
      returns `0` (R20)
- [ ] File ≤ 400 lines (R5); every function ≤ 50 lines (R6)

Commit: covered by Edit 4's single commit (see Commit sequence).

### Edit 3 — Add colocated workspace.test.ts (node:test)

Create `packages/core/src/workspace.test.ts` (R3/R23: `*.test.ts`,
`node:test`, run against compiled `dist/`). Cover at minimum:

- `parseManifest` happy path — a well-formed v0 object narrows to
  `TaskManifest` with all fields intact (including `shippedAt: null`).
- `parseManifest` rejection on wrong `schemaVersion` (e.g. `2`, `0`, missing)
  — fails loud per D4, no migration.
- `parseManifest` rejection on missing/mistyped required fields (e.g.
  `drivePath` given as a `string` instead of `string[]`; missing `slug`).
- `serializeManifest` round-trip — `parseManifest(serializeManifest(m))`
  deep-equals `m`.

Verification:

- [ ] File `packages/core/src/workspace.test.ts` exists
- [ ] `grep -c "node:test" packages/core/src/workspace.test.ts` ≥ 1
- [ ] Test cases cover: parse happy-path, wrong-version rejection,
      missing/mistyped-field rejection, serialize round-trip
- [ ] Build + tests pass (see Automated checks)

Commit: covered by Edit 4's single commit.

### Edit 4 — Adjust index.ts re-exports and commit the code change

Edit the re-export block in `packages/core/src/index.ts` (currently lines
58-63):

- Remove `Workspace`, `WorkspaceEvent`, `WorkspaceEventType` from the
  `export type { ... } from "./workspace.js"` block.
- Keep `TaskManifest` in the `export type { ... }` block.
- Add a value export block for the functions and the constant:
  `export { parseManifest, serializeManifest, TASK_MANIFEST_SCHEMA_VERSION } from "./workspace.js";`
  (`export {` for values; `export type {` for the `TaskManifest` type —
  confirm against the existing `derive-path.js` / `assemble.js` blocks).

Then stage Edits 2, 3, and 4 together and commit as commit #2.

Verification:

- [ ] `grep -nE "Workspace|WorkspaceEvent|WorkspaceEventType" packages/core/src/index.ts`
      returns `0`
- [ ] `grep -n "TaskManifest" packages/core/src/index.ts` shows it under an
      `export type {` block
- [ ] `grep -nE "parseManifest|serializeManifest|TASK_MANIFEST_SCHEMA_VERSION" packages/core/src/index.ts`
      shows them under an `export {` (value) block
- [ ] `grep -rn 'from.*adapter' packages/core/` returns no matches (R25)

Commit: `feat(core): add TaskManifest v0 contract with parse and serialize`

### Automated checks (run before the code commit)

- [ ] `npm run build` (or `tsc -p .` in `packages/core`) passes without errors
- [ ] `node --test` against compiled `dist/` passes (all `workspace.test.ts`
      cases green)
- [ ] No TypeScript strict violations (R20)

### Structural checks

- [ ] Expected files exist: `packages/core/src/workspace.ts` (replaced),
      `packages/core/src/workspace.test.ts` (new), `packages/core/src/index.ts`
      (edited)
- [ ] `packages/core/src/gateways.ts` UNCHANGED (TODO comments at `:34/:38/:43`
      kept as-is)
- [ ] No file outside the in-scope list was modified
      (verify via `git diff --name-only origin/main..HEAD`)

### Behavior checks

- [ ] `parseManifest` on a valid v0 object returns the narrowed `TaskManifest`
- [ ] `parseManifest` on `schemaVersion !== 1` fails loud, no migration
- [ ] `parseManifest` on a `string`-typed `drivePath` fails loud
- [ ] `serializeManifest` → `parseManifest` round-trips to the original

### Git checks

- [ ] Branch used: `feat/task-manifest-v0`
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] `Plan required: yes` — numbered plan presented and approved before any
      change (Pause 1)
- [ ] Pause 2 — `workspace.ts` (first modified file) shown for review before
      proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message shown
      before each commit
- [ ] `pre-commit-self-audit` skill output reported in chat before each Pause 3
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code):** REQUIRED (`Plan required: yes`). Present a
  numbered plan and wait for approval.
- **Pause 2 (after the first modified file):** REQUIRED. Show the replaced
  `packages/core/src/workspace.ts` and wait for review.
- **Pause 3 (before each commit):** REQUIRED. Show `git status` +
  `git diff --stat` + proposed message + `pre-commit-self-audit` output.

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md` as a
  follow-up brief.
- A `string`-typed `drivePath` consumer discovered → STOP and report (Edit 2
  guard).

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: yes`. Although D1–D4 close the schema and scope, this task:

- Touches 2 source files plus a new test file and REMOVES three exported types
  (`Workspace`, `WorkspaceEvent`, `WorkspaceEventType`) — R15 territory
  (≥ 2 files, an exported-surface removal with public-API implications).
- Replaces an existing type contract rather than adding a fresh one; the
  executor should confirm the removal + re-export edits as a plan before
  editing.

Pause 2 and Pause 3 remain required regardless of `Plan required`
(Lesson #6 of `docs/AGENT_PLAYBOOK.md`).

## Git workflow

### Branch

`feat/task-manifest-v0` (type `feat` — adds a new domain contract; G-R2).
Branched from up-to-date `main`.

### Commit sequence

1. `docs(tasks): add brief for 031-task-manifest-v0`
2. `feat(core): add TaskManifest v0 contract with parse and serialize`

Both subjects verified ≤ 72 chars (47 and 65) and lead with the allowlisted
verb `add` (`.claude/skills/pre-commit-self-audit/SKILL.md` Check 3). Edits 2,
3, and 4 share commit #2 (the type replacement, its tests, and the re-export
adjustment are one atomic contract change).

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules (esp. R4, R5, R6, R7, R8, R20, R21, R23,
   R24, R25)
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — known traps
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
5. `.claude/skills/brief-template/SKILL.md` — template reference
6. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit (Pause 3)
7. `packages/core/src/derive-path.ts` — `drivePath` segments contract (D1
   `readonly string[]` mirror)
8. `packages/cli/src/argv.ts` — `ParsedCommand` present-with-null forward
   pattern precedent (`shippedAt`)
9. `packages/core/src/index.ts` — re-export style (value vs `export type`)

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (2 commits, ordered)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Any verification checkbox that could not be met, with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step (open PR; the deferred ROADMAP/MENTOR_BRIEF
   reconciliation of the Phase 2 `Workspace` exit-criterion mention is a
   separate pending docs session)
