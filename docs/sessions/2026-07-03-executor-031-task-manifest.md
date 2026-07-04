# Session recap — 2026-07-03 — 031-task-manifest-v0 (executor)

**Mode:** caminho-B executor handoff — the planner-authored, brief-validator
APPROVED brief (11/11; see the paired mentor recap) was pre-saved to disk, so the
executor's Edit 1 was verify-only. Orchestrated from Code with Rafael acting as
mentor at every Pause.
**Executor:** Claude Code executor subagent, driven by the Code main session.
**Merged via:** PR #77, squash merge → `main@2071baf`.
**Pairs with:** `2026-07-03-mentor-031-task-manifest.md` (design + gate). This
is the execution-side record only.

## One-line summary

Replaced the superseded `packages/core/src/workspace.ts` (2026-05-28 design)
with the v0 `TaskManifest` contract — an eight-field record plus a fail-loud
`parseManifest` (`unknown → TaskManifest`) and a round-tripping
`serializeManifest` — removing the dead `Workspace` / `WorkspaceEvent` /
`WorkspaceEventType` types, with colocated `node:test` coverage; shipped green
and merged.

## Built

- `packages/core/src/workspace.ts` — 114 lines, fully replaced. `TaskManifest`
  interface (8 fields, D1 order), `TASK_MANIFEST_SCHEMA_VERSION = 1`,
  `parseManifest`, `serializeManifest`, and four private field-guard helpers
  (`asObject`, `asString`, `asStringArray`, `asStringOrNull`).
- `packages/core/src/workspace.test.ts` — 89 lines, 12 tests.
- `packages/core/src/index.ts` — re-export block adjusted: dropped `Workspace`,
  `WorkspaceEvent`, `WorkspaceEventType`; kept `TaskManifest` under
  `export type {`; added a value export for `parseManifest`,
  `serializeManifest`, `TASK_MANIFEST_SCHEMA_VERSION`.

## Scope decision honored (reconcile, not create)

The brief was a **RECONCILE/replace** (a `TaskManifest` already existed at
`workspace.ts:40`). Per the user-approved scope decision (blast-radius option 3),
`workspace.ts` was fully replaced: `Workspace`, `WorkspaceEvent`, and
`WorkspaceEventType` were removed (zero consumers, superseded by the
app-owns-state pivot — `eventHistory` is Phase 3 accumulated state, not a
portable-manifest concern), and the `import type { Issue }` line was dropped
(no v0 field references `Issue`). `gateways.ts` (`:34/:38/:43` TODOs) left
untouched.

## Decisions implemented (D1–D4, as built)

- **D1 — v0 schema.** Eight required fields, camelCase, in order:
  `schemaVersion: 1` (literal), `jiraKey`, `vertical`, `slug`, `template`,
  `drivePath: readonly string[]`, `startedAt`, `shippedAt: string | null`.
- **D1 — `drivePath` as segments.** Typed `readonly string[]`, mirroring
  `derivePath`'s brief-030 contract; stored verbatim, root-agnostic; callers
  join with `path.join`. A bare joined string is rejected at parse.
- **D1 — `shippedAt` present-with-null.** `string | null`, present with `null`
  until first ship — the uniform forward contract paralleling `ParsedCommand`'s
  optional-shape discipline (`packages/cli/src/argv.ts`).
- **D2 — core-pure.** Type + parse + serialize only. No file I/O, no Drive, no
  CLI wiring. R25 greps (`from.*adapter`) empty.
- **D3 — deferred fields absent.** No `claimedBy`/handoff, no ship-history
  accumulation, no copy/briefing fields, no folder scaffolding.
- **D4 — version gate first, no migration.** `parseManifest` compares
  `record.schemaVersion !== TASK_MANIFEST_SCHEMA_VERSION` and throws BEFORE any
  other field is read; an unknown version fails loud with no migration attempt.

## Fail-loud design (R4 / R24)

`parseManifest(input: unknown)` narrows without `any` (R24): `asObject` rejects
non-objects/`null`, then each field passes through a typed guard
(`asString` / `asStringArray` / `asStringOrNull`) that throws a `TypeError`
carrying the field name and observed type (R4 — no silent null return).
`serializeManifest` pretty-prints (2-space) with a trailing newline — readable
because the `.saci.json` is human-inspected and diffed by Drive's native
revision history — and round-trips with `parseManifest`.

## STOP guards — none fired

- **`drivePath` type-conflict guard (Edit 2):** the old `Workspace.drivePath`
  and old `TaskManifest.drivePath` were `string`; v0 is `readonly string[]`. The
  guard would fire if any consumer of the old `string` shape were found. The
  inventory reported zero consumers and none surfaced during implementation — no
  silent coercion of a joined string into segments was done.
- No out-of-scope path needed changing; no scope STOP triggered.

## Verification

- `tsc -p packages/core` — clean (strict, R20).
- `node --test` over `workspace.test.js` — 12/12 pass.
- R25 grep (`from.*adapter` in `packages/core/`) — empty.
- R24 grep (`\bany\b` in `workspace.ts`) — empty. R20 (`@ts-ignore` /
  `@ts-expect-error`) — empty.
- `grep "export interface TaskManifest" workspace.ts` — exactly one match;
  `grep -cE "Workspace|WorkspaceEvent|WorkspaceEventType" workspace.ts` — `0`.
- R5 (`workspace.ts` 114 ≤ 400) and R6 (every function ≤ 50: `parseManifest`
  ~17, `serializeManifest` 2, `asObject` 7, `asString` 6, `asStringArray` 6,
  `asStringOrNull` 6) — met.
- R7 named constant (SCREAMING_SNAKE_CASE): `TASK_MANIFEST_SCHEMA_VERSION`.
- `index.ts`: `export {` for the two functions + the constant; `export type {`
  for `TaskManifest` — mirrors the `derive-path.js` / `assemble.js` blocks.
- `pre-commit-self-audit` on commit #2: 5/5 PASS (subject 65 chars, type `feat`,
  verb `add`, no co-author trailer, staged scope = edit scope).

## Test coverage (12 cases)

- **(a) happy path** — well-formed v0 object narrows with all fields intact
  (incl. `shippedAt: null`); a shipped manifest keeps its `shippedAt` timestamp.
- **(b) version gate** — `schemaVersion` of `2`, `0`, and missing all fail loud;
  non-object (`null`, `"string"`) rejected before field parsing.
- **(c) field guards** — `drivePath` as a string, missing `slug`, numeric
  `startedAt`, numeric `shippedAt` all fail loud with field-named errors.
- **(d) round-trip** — `parseManifest(JSON.parse(serializeManifest(m)))`
  deep-equals `m`.
- **(e) serialize contract** — trailing newline, 2-space indentation.

## Green mechanism (record integrity)

The pre-commit hook is **not wired in this clone** (`core.hooksPath` unset), so
`npm test` did **not** auto-run on commit. Green was proven by manually running
`tsc -p packages/core` + `node --test` (12/12). The PR template's "pre-commit
hook ran" checkbox was left unchecked with that note rather than falsely ticked.

## Commits (code PR #77, squash-merged)

- `33fef28` `docs(tasks): add brief for 031-task-manifest-v0` (commit #1;
  caminho-B — brief pre-saved by the user, Edit 1 was verify-only).
- `137e430` `feat(core): add TaskManifest v0 contract with parse and serialize`
  (commit #2 — Edits 2, 3, 4 as one atomic contract change).

Squashed to `main@2071baf` as
`feat(core): add TaskManifest v0 contract with parse and serialize (#77)`.

## Anything that STOPped or was flagged

None. No consumer of the old `string`-typed `drivePath` existed, so the Edit 2
guard correctly did not fire. No push proceeded without Rafael's direct
authorization (R17).

## Gotchas discovered

None new.

## Next step

ROADMAP / `MENTOR_BRIEF.md` §2 reconciliation of the Phase 2 exit-criterion
mention of `Workspace` (now removed) — **deferred to the pending docs session**,
alongside the derivePath D2 deviation carried over from brief 030. Not part of
this PR or this recap.
