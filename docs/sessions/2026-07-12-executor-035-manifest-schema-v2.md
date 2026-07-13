# Session recap — 2026-07-12 — 035-manifest-schema-v2 (executor)

**Mode:** caminho-A full pipeline run in one session (planner → brief-validator
APPROVED 11/11 → mentor gate → executor), all Pauses and both STOP-and-confirm
guards driven by Rafael as mentor.
**Executor:** Claude Code executor subagent (implementation) + Code main session
(orchestration / relay at every Pause), Rafael as mentor.
**Merged via:** PR #86, squash merge → `main@ba908a0`.
**Pairs with:** `2026-07-12-mentor-035-manifest-schema-v2.md` (same PR).
Consumes D3 and the core half of D4 from the session-035 D-set
(`2026-07-10-mentor-035-keyless-schemaversion-2.md`).

## One-line summary

Migrated `TaskManifest` to `schemaVersion 2` — nullable `jiraKey`/`localKey`
pair under an at-least-one-non-null invariant, derived `displayKey` helper,
append-only `history` log replacing the scalar `startedAt`/`shippedAt`, lazy
in-memory v1→v2 migration — and extended the `derivePath` month-fallback chain
with `started_at` as third source, with the coupled ROADMAP bullet in the same
PR. 4 commits on `feat/manifest-schema-v2`, pushed and PR-opened only on
explicit owner authorization.

## Built

- `packages/core/src/workspace.ts` (196 changed lines; 245 final, within R5) —
  rewritten around a two-version parser: `TASK_MANIFEST_SCHEMA_VERSION = 2`
  (exported) + module-private `LEGACY_SCHEMA_VERSION = 1`; `HISTORY_EVENTS`
  const array → `HistoryEvent` union → `HistoryEntry` interface; `TaskManifest`
  v2 with no scalar timestamps; new guards `isHistoryEvent` (type predicate),
  `asHistoryEntry` (indexed error paths, e.g. `TaskManifest.history[2].event
  must be one of ...`), `asHistory`; `parseManifestV2` (v2 shape + invariant);
  `migrateManifestV1` (validate-first, see below); `parseManifest` version gate
  (1 → migrate, 2 → validate, else fail-loud); `displayKey` helper with
  defensive throw. `serializeManifest` byte-identical.
- `packages/core/src/workspace.test.ts` (+176 net) — `makeManifest` rebased on
  v2; separate `makeV1Manifest` fixture typed as the exact legacy on-disk
  shape; behavior groups (a)–(f): v2 happy paths + round-trip, version gate
  (3 / 0 / missing / non-object fail loud), v1 migration, both-keys-null
  invariant, history-shape fail-loud cases, `displayKey`.
- `packages/core/src/index.ts` — export lines gain `displayKey`,
  `HISTORY_EVENTS`, `HistoryEntry`, `HistoryEvent`.
- `packages/cli/src/run-start.ts` — `buildManifest` emits the v2 shape
  (`localKey: null`, single `start` history entry); stale "v0 manifest"
  comments corrected. Rode the schema commit per the mentor's in-flight D3
  ratification so every commit boundary stayed green.
- `packages/cli/src/run-start.test.ts` — the two manifest assertions updated
  to the v2 shape.
- `packages/core/src/derive-path.ts` — `DerivePathInput` gains optional
  `readonly started_at?: string | null` (third month source); `deriveMonth`
  takes it after `jira_updated_at`, before `UNDATED_MONTH`; `monthFromIso`
  reused as-is.
- `packages/core/src/derive-path.test.ts` (+36/−0) — three added cases only.
- `docs/ROADMAP.md` — Phase 3 derivePath bullet: fallback clause extended to
  "Jira updated timestamp, then the task's start timestamp, then the `undated`
  sentinel"; only that bullet reflowed.

## Decisions implemented (as built)

- **D1 — invariant scoped to the v2 path.** The at-least-one-key check lives
  only in `parseManifestV2`; the migration path satisfies it structurally
  (`jiraKey` is `asString`-validated, always non-null), so no valid v1
  manifest can be rejected.
- **D2 — `displayKey` as a derived exported helper** (`jiraKey ?? localKey`),
  not a stored field; defensive throw if both null.
- **D3 — closed history event enum** `start|ship|load|handoff|link`; `link`
  included now to avoid a future schema bump; entries `{event, actor:
  string | null, at: ISO 8601}`.
- **D4 — lazy migration, validate-first.** Seven v1 guard reads before any
  construction; `startedAt` → `start` entry, non-null `shippedAt` → appended
  `ship` entry, `actor: null` (the time was witnessed, the author was not);
  upgraded object persists as v2 on the next write; `schemaVersion >= 3`
  fail-loud; version stays the first gate.
- **D6 — month chain** `entrega_iso → jira_updated_at → started_at →
  UNDATED_MONTH`; Jira-born callers pass nothing and their output is
  unchanged.
- **No key-format validation in the parser** (v1 precedent; format rules
  belong to the future config/start surface). Vertical stays free-form.

## Guards (both mentor-confirmed before proceeding)

- **Guard 1 — v1 preservation.** Full suite green first (203/0 at that point);
  migration tests shown passing with the fixture asserting
  `!("localKey" in v1)` — the property absent entirely, not `null`; plus a
  REPL transcript against compiled `dist/` (raw JSON in, migrated v2 out,
  `displayKey` resolved, shipped-manifest two-entry history).
- **Guard 2 — add-only test diff.** Full `git diff` of `derive-path.test.ts`:
  a single hunk, +36/−0, imports and `makeInput` untouched, all 13
  pre-existing tests byte-identical.

## Verification — the done criteria

- `npm run build` clean and `npm test` green at every commit boundary; final
  state **206 pass / 0 fail** (203 + 3 new derivePath cases).
- Brief greps: `startedAt|shippedAt` in `workspace.ts` confined to the
  migration path and its docs; `displayKey` exported in `index.ts`; R25
  `grep -rn 'from.*adapter' packages/core/src/` empty; `'start timestamp'`
  present inside the ROADMAP derivePath bullet (line 191).
- Structural: `git diff --name-only origin/main..HEAD` listed exactly the 9
  constraint-1 paths; `payload.json` never staged.
- `pre-commit-self-audit`: 15 PASS / 0 FAIL (5 checks × 3 executor commits).
- All four commit messages verified verbatim via `git log -1` after each
  commit — no drift, no amends, no trailers.
- STATE.md not created, per brief constraint 3 (single-session task).

## Green mechanism (record integrity)

The pre-commit hook is **not wired in this clone** (`core.hooksPath` unset),
so green was proven by running the full suite manually before each commit.
The PR template's hook checkbox carried that note rather than a false tick
(same discipline as briefs 031–033).

## Process notes

1. **Commit 2 evidence-close lapse, closed retroactively.** The commit was
   authorized, executed, and message-verified, but its `git log` evidence was
   not presented until the mentor requested it at the next Pause 3
   (`git log --oneline -2` + `--format=%B` verbatim check). Post-033
   doctrine held: Pause 3 closes on pasted evidence, not on the executor's
   own confirmation.
2. **Burned-slot delegation worked first try:** slot 035 was supplied
   explicitly with the slot-034 burn evidence, overriding the planner's
   mechanical NNN formula; the planner recorded the P4 evidence in the
   brief's Context (see mentor recap D2).

## Commits (PR #86, squash-merged)

- `ba86ad0` `docs(tasks): add brief for 035-manifest-schema-v2` (planner).
- `d429a30` `feat: migrate TaskManifest to schemaVersion 2 with history log`
  (Edit 2: core + cli in one commit, mentor-ratified D3 scope delta).
- `57d422f` `feat(core): add startedAt fallback to derivePath month chain`
  (Edit 3).
- `8b9b322` `docs(roadmap): update derivePath bullet to extended month chain`
  (Edit 4).

Squashed to `main@ba908a0` as
`feat: add TaskManifest schemaVersion 2 and derivePath start fallback (#86)`.

## Post-merge cleanup (this session)

Checked out `main`, fast-forwarded `52473ac → ba908a0` (squash landed exactly
the 9 in-scope files, 809 insertions / 77 deletions), verified
`git diff main feat/manifest-schema-v2` empty before force-deleting the local
branch (`-d` refuses a squash-merged branch), remote ref already deleted by
GitHub and pruned. Working tree clean but for the pre-existing untracked
`payload.json`.

## Carried items (no action this session)

- **`gateways.ts` manifest-shape TODO (2026-06-06)** — reported per the brief,
  not resolved; the v2 schema likely resolves or reframes it. Needs a
  follow-up decision.
- **`payload.json` untracked clutter** (2nd occurrence) — `.gitignore`
  candidate, below rule-of-three.
- **Missing-env error DX** — unchanged from 033.

## Next step

Brief 036 — keyless `start` command (consumes session-035 D1/D2 + command UX
decision). Blocked on ground-truth item 2 (Jira project-key charset vs.
RAF/ANA prefixes, read-only Atlassian MCP check on owner go).
