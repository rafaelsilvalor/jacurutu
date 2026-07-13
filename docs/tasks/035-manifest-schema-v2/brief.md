# Brief: 035 — TaskManifest schemaVersion 2 (schema + migration)

> **Category:** L
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `feat/manifest-schema-v2`

---

## Context

Brief 031 shipped the TaskManifest v0 contract (`schemaVersion: 1`) in
`packages/core/src/workspace.ts`; brief 032 wired it into `saci start`
(`packages/cli/src/run-start.ts`). Mentor session 035
(`docs/sessions/2026-07-10-mentor-035-keyless-schemaversion-2.md`) ratified
the D-set for keyless `start`. This brief consumes **D3** (the
`schemaVersion 2` contract: two-field key model, append-only `history`,
lazy v1→v2 migration) and **D4's core half** (the extended month-fallback
chain in `derivePath`). The keyless `start` command itself (session D1/D2:
prefixes, counter, command UX) is explicitly deferred to a later brief.

### P4 numbering evidence (three sources, run 2026-07-12)

- (a) `ls docs/tasks/` — highest directory is `033-start-exit-libuv-crash`.
- (b) `git log --oneline main` — tops at `52473ac` (PR #85, docs recap for
  session 035); no brief beyond 033 has shipped.
- (c) `CLAUDE.md` `E*` entries reserve no numbering slot (E5 records slots
  004-006 as historically burned; nothing reserves 034+).
- (d) Slot **034 is burned** (gap preserved per P4) by the brief-less docs
  session 034 — recorded in
  `docs/sessions/2026-07-08-mentor-034-docs-reconciliation.md`. Next free
  slot is therefore **035**.

## Goal

Upgrade the TaskManifest contract to `schemaVersion 2` — nullable
`jiraKey`/`localKey` pair (at least one non-null), a derived `displayKey`
helper, an append-only `history` log replacing `startedAt`/`shippedAt`, and
lazy in-memory v1→v2 migration in `parseManifest`. Extend `derivePath`'s
month-fallback chain with a start-timestamp link, keep the existing
Jira-born `start` command writing v2 manifests, and align the ROADMAP
Phase 3 derivePath bullet in the same PR.

Out of scope:

- The keyless `start` command (`saci start --local` or equivalent) — a later
  brief consumes session-035 D1/D2 (prefixes, counter, command UX).
- The `link` command, `saci config` (identity/prefix/actor source), the
  local sequence counter (D2 — instance state, never enters the manifest),
  and claim/lock semantics. `actor` is written as `null` everywhere here.
- Key format validation for `localKey`/`jiraKey` in the parser — none, per
  v1 precedent; format rules belong to the future config/start surface.
- Vertical validation — stays free-form string (verified 2026-07-12: no
  canonical vertical list exists in `packages/core`; `parseVertical` passes
  values through).
- Any mass rewrite of on-disk v1 manifests — migration is lazy; v2
  persistence happens naturally on the next write of an upgraded manifest.
- `packages/core/src/gateways.ts` (its 2026-06-06 TODO about the manifest
  shape is noted but not resolved here — report it, do not edit it).
- Any ROADMAP change beyond the single derivePath bullet named in Edit 4.
- `packages/adapter-sheets` (parking lot), `packages/adapter-jira`.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/035-manifest-schema-v2/brief.md` (this file; commit #1)
   - `packages/core/src/workspace.ts`
   - `packages/core/src/workspace.test.ts`
   - `packages/core/src/index.ts`
   - `packages/core/src/derive-path.ts`
   - `packages/core/src/derive-path.test.ts`
   - `packages/cli/src/run-start.ts`
   - `packages/cli/src/run-start.test.ts`
   - `docs/ROADMAP.md`
   If anything else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md` (especially R4 fail-loud, R7 named
   constants, R20 strict, R21 ESM `.js` imports, R24 no `any`, R25 core
   imports no adapter).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - Branch: `feat/manifest-schema-v2`
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
   - No `STATE.md` — single-session task expected; if a second session
     becomes necessary, STOP and ask before creating one (G-R10).
4. Every commit leaves the whole monorepo green: `npm run build` and
   `npm test` pass at each commit boundary — this is why the core schema
   change and the `run-start.ts` update share one commit (Edit 2). The
   pre-commit hook is not wired in this clone; run the checks manually.
5. `core` stays pure: no I/O, no clock reads. Timestamps enter as data.

### Conventions

- All code, comments, tests, and docs in English (R9 — everything touched
  here is agent-consumed surface).
- Commit types/scopes per the Commit sequence below; subjects ≤ 72 chars,
  leading verbs from the allowlist SSOT in
  `.claude/skills/pre-commit-self-audit/SKILL.md`.
- Test style mirrors the existing suites: `node:test` + `node:assert`, a
  `makeX(overrides)` fixture builder, behavior-labeled test names.

### Architectural decisions already made (do not revisit)

Closed in mentor session 035 (D3/D4) and at delegation time. Executor
implements; does not propose alternatives.

#### D1 — Two-field key model, both nullable, at least one set

`jiraKey: string | null` and `localKey: string | null` on `TaskManifest`.
Invariant: **at least one non-null**, enforced in `parseManifest` (fail-loud
`TypeError` naming both fields). Jira-born: `jiraKey` set, `localKey: null`.
Local-born: the inverse. Linked: both set. No `origin` discriminator field —
derivable, rejected in session 035.

#### D2 — `displayKey` is a derived helper, not a stored field

Export `displayKey(manifest: TaskManifest): string` from `workspace.ts`,
returning `manifest.jiraKey ?? manifest.localKey` with a defensive fail-loud
throw if both are null (unreachable after `parseManifest`, but the type
system cannot prove it). Never stored in the manifest — one less field to
desync.

#### D3 — Append-only `history` replaces `startedAt`/`shippedAt`

Entry shape `{ event, actor, at }`: `event` is the closed enum
`start | ship | load | handoff | link` (declare the values as a `const`
array per R7, derive the union type from it); `actor: string | null`; `at`
ISO 8601 string. `link` enters the enum now even though no command emits it
— retrofitting a fail-loud parser would cost another schema bump. The scalar
`startedAt`/`shippedAt` fields are removed from the v2 interface.

#### D4 — Lazy v1→v2 migration in `parseManifest`

`schemaVersion` stays the **first gate**, before any other field is read.
- `schemaVersion === 1`: validate the v1 shape with the existing guards,
  then upgrade in memory: `jiraKey` kept, `localKey: null`, `startedAt` →
  `{ event: "start", actor: null, at: <startedAt> }`, non-null `shippedAt`
  → an analogous `ship` entry appended after it. `actor: null` because the
  time was witnessed, the author was not — nothing is fabricated.
- `schemaVersion === 2`: validate the v2 shape directly.
- Anything else (≥ 3, 0, missing, non-number): fail-loud, no migration.
`TASK_MANIFEST_SCHEMA_VERSION` becomes `2`; `serializeManifest` is
unchanged, so an upgraded manifest persists as v2 on its next write.

#### D5 — Parser validates shape, not semantics

No key-format validation (v1 precedent), no history-ordering or
non-emptiness semantics beyond shape: `history` must be an array whose every
entry has a valid `event` enum member, `actor` string-or-null, `at` string.
Unknown `event` values fail loud.

#### D6 — `derivePath` month chain gains one explicit link

Chain becomes `entrega_iso` → `jira_updated_at` → start timestamp →
`UNDATED_MONTH`. `DerivePathInput` gains an **optional** field
`started_at?: string | null` (snake_case, matching the sibling
`entrega_iso`/`jira_updated_at` source-field naming). Absent or unparseable
→ falls through to the sentinel exactly as today; existing Jira-born
behavior is unchanged. No smuggling the start date into `entrega_iso` /
`jira_updated_at` (rejected in session 035 as a lying field).

#### D7 — `run-start.ts` writes v2, minimally

`buildManifest` produces the v2 shape for the Jira-born path: `jiraKey:
issue.key`, `localKey: null`, `history: [{ event: "start", actor: null,
at: now.toISOString() }]`. No other behavior change in `start`; stale
header/doc comments referring to "v0" and `startedAt` are corrected in the
same edit (they describe the code being changed, not adjacent cleanup).

#### D8 — ROADMAP coupling in the same PR

The Phase 3 derivePath bullet (the one session 034 aligned) documents the
extended chain — and nothing else in ROADMAP changes.

## Done criteria

### Edit 1 — Verify brief on disk (commit #1 by the planner)

The planner authored this brief and committed it as commit #1 on
`feat/manifest-schema-v2`. The executor verifies before proceeding:

- [ ] Directory `docs/tasks/035-manifest-schema-v2/` exists
- [ ] File `docs/tasks/035-manifest-schema-v2/brief.md` exists; first line
      matches the title above
- [ ] Commit #1 with subject `docs(tasks): add brief for
      035-manifest-schema-v2` is the branch's first commit past `main`

If missing or mismatched, **STOP and report**; do not regenerate the brief.

### Edit 2 — TaskManifest schemaVersion 2 with lazy v1 migration

One commit spanning core and cli so the monorepo stays green (constraint 4).

#### 2a — `packages/core/src/workspace.ts`

- Bump `TASK_MANIFEST_SCHEMA_VERSION` to `2`.
- Declare the history event enum per D3 (`export const HISTORY_EVENTS =
  ["start", "ship", "load", "handoff", "link"] as const;`, derived
  `HistoryEvent` union) and an exported `HistoryEntry` interface
  `{ event: HistoryEvent; actor: string | null; at: string }`.
- Rewrite `TaskManifest` per D1 + D3: `schemaVersion: 2`, `jiraKey: string |
  null`, `localKey: string | null`, `vertical`, `slug`, `template`,
  `drivePath: readonly string[]`, `history: readonly HistoryEntry[]`. No
  `startedAt`/`shippedAt`.
- `parseManifest` per D4/D5: version gate first (1 → validate v1 shape,
  upgrade in memory; 2 → validate v2 shape; else throw); at-least-one-key
  invariant on the v2 path; history entries shape-validated with fail-loud
  messages naming the offending field.
- `displayKey` helper per D2, exported; header comment no longer says "v0".

> **STOP-and-confirm guard (judgment flag 1):** at the `parseManifest`
> invariant edit, before finalizing Edit 2, demonstrate (test run or REPL
> transcript in chat) that every valid v1 manifest — including one with
> only `jiraKey` and no `localKey` field at all — passes the migration
> path, and wait for confirmation. Guarded risk: the new invariant
> rejecting legacy v1 manifests that only have `jiraKey`.

#### 2b — `packages/core/src/workspace.test.ts`

- Rebase `makeManifest` on the v2 shape; keep a separate v1 fixture builder
  for migration tests. Cover at minimum: v2 happy path + round-trip; v1
  migration (jiraKey kept, `localKey: null`, `startedAt` → `start` entry,
  non-null `shippedAt` → appended `ship` entry, null `shippedAt` →
  single-entry history); `schemaVersion` 3 / 0 / missing fail-loud; both
  keys null fail-loud; unknown `event` and malformed history entry
  fail-loud; `displayKey` precedence (jira-born, local-born, both set →
  `jiraKey` wins) and defensive throw.

#### 2c — `packages/core/src/index.ts`

- Extend the workspace export line: add `displayKey` and `HISTORY_EVENTS`
  to the value exports; add `HistoryEntry` and `HistoryEvent` to the type
  exports.

#### 2d — `packages/cli/src/run-start.ts` + `run-start.test.ts`

- `buildManifest` per D7; correct the stale "v0"/`startedAt` comments.
- Update the two manifest assertions in `run-start.test.ts` to the v2 shape
  (`jiraKey`, `localKey: null`, `history` with the single `start` entry at
  `FIXED_NOW`; `shippedAt` assertion replaced by a history-shape assertion).

Verification:

- [ ] `grep -n 'startedAt\|shippedAt' packages/core/src/workspace.ts`
      matches only migration-path code/comments (v1 field reads), not the
      v2 interface
- [ ] `grep -n 'displayKey' packages/core/src/index.ts` shows the export
- [ ] `npm run build` and `npm test` pass across the workspace
- [ ] `grep -rn 'from.*adapter' packages/core/src/` returns no matches (R25)

Commit: `feat: migrate TaskManifest to schemaVersion 2 with history log`

### Edit 3 — Extend the derivePath month-fallback chain

`packages/core/src/derive-path.ts`:

- Add `readonly started_at?: string | null` to `DerivePathInput` with a doc
  comment naming it the third month source (D6).
- Extend `deriveMonth` to try `started_at` after `jira_updated_at` and
  before `UNDATED_MONTH`. `monthFromIso` is reused as-is.

`packages/core/src/derive-path.test.ts` — add cases:

- `entrega_iso: null`, unparseable `jira_updated_at`, valid `started_at` →
  month from `started_at`.
- All three absent/unparseable → `UNDATED_MONTH`.
- `started_at` omitted entirely → output identical to today's behavior.

> **STOP-and-confirm guard (judgment flag 2):** at the derivePath edit,
> before committing, show the `derive-path.test.ts` diff and confirm every
> existing test expectation is untouched — the diff adds cases only.
> Guarded risk: changing output for existing Jira-born inputs.

Verification:

- [ ] All pre-existing `derive-path.test.ts` assertions byte-identical
      (verify via `git diff` — deletions only in unavoidable import lists,
      none in test bodies)
- [ ] `npm run build` and `npm test` pass

Commit: `feat(core): add startedAt fallback to derivePath month chain`

### Edit 4 — Update the ROADMAP Phase 3 derivePath bullet

In `docs/ROADMAP.md`, in the `[prod]` bullet beginning "Pure Drive-path
derivation in `core` (shipped in brief 030)", replace the fallback clause
"(falling back to the Jira updated timestamp, then the `undated` sentinel)"
with "(falling back to the Jira updated timestamp, then the task's start
timestamp, then the `undated` sentinel)", reflowing the paragraph as
needed. No other ROADMAP line changes.

Verification:

- [ ] `grep -n 'start timestamp' docs/ROADMAP.md` matches inside that bullet
- [ ] `git diff --stat` for this commit touches only `docs/ROADMAP.md`

Commit: `docs(roadmap): update derivePath bullet to extended month chain`

### Automated checks (run before each commit)

- [ ] `npm run build` passes without errors
- [ ] `npm test` passes (hook not wired in this clone — run manually)

### Structural checks

- [ ] No file outside the constraint-1 list was modified
      (verify via `git diff --name-only origin/main..HEAD`)
- [ ] `payload.json` (untracked local file) was never staged

### Behavior checks

- [ ] `parseManifest` upgrades v1 per D4; v2 round-trips deep-equal
- [ ] `parseManifest` throws on `schemaVersion` 3, on both keys null, and
      on an unknown history event
- [ ] `derivePath` output for inputs without `started_at` is unchanged
- [ ] `saci start` writes a v2 manifest with a single `start` history entry

### Git checks

- [ ] Branch used: `feat/manifest-schema-v2`
- [ ] Commits follow Conventional Commits (G-R3); subjects ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 1 — numbered plan presented and approved before any change
      (`Plan required: yes`)
- [ ] Pause 2 — first modified file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message shown
      before each commit
- [ ] `pre-commit-self-audit` skill output reported in chat before each
      Pause 3 submission
- [ ] Both STOP-and-confirm guards (Edits 2 and 3) were honored
- [ ] If any criterion could not be met, it was reported explicitly

### Commit sequence

1. `docs(tasks): add brief for 035-manifest-schema-v2`
2. `feat: migrate TaskManifest to schemaVersion 2 with history log`
3. `feat(core): add startedAt fallback to derivePath month chain`
4. `docs(roadmap): update derivePath bullet to extended month chain`

All subjects verified ≤ 72 chars; leading verbs (`add`, `migrate`, `update`)
verified against the allowlist SSOT in
`.claude/skills/pre-commit-self-audit/SKILL.md`.

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code):** present a numbered plan and wait for
  approval. **Required** (`Plan required: yes`).
- **Pause 2 (after the first modified file):** show the result and wait for
  review. **Always required.**
- **Pause 3 (before each commit):** show `git status` + `git diff --stat` +
  proposed message + `pre-commit-self-audit` output. **Always required.**

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md`
  as a follow-up brief.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: yes` because, while the contract decisions are fully closed
(D1–D8), the code text is not snippet-complete: guard-function decomposition
in `workspace.ts` (R6 budget across the two-version parse), exact test
wording, and error-message phrasing remain executor judgment. The Pause 1
plan closes those before any edit. Pause 2 and Pause 3 remain required
regardless — Lesson #6 of `docs/AGENT_PLAYBOOK.md`.

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/sessions/2026-07-10-mentor-035-keyless-schemaversion-2.md` — the
   ratified D-set this brief consumes (D3, D4)
4. The six source/test files listed in constraint 1 — current contracts
5. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
6. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit (Pause 3)

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Any verification checkbox that could not be met, with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step (open PR; follow-up brief: keyless `start` command
   consuming session-035 D1/D2)
