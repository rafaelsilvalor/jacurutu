# Brief: 036 — Keyless `start` command (local-born tasks)

> **Category:** L
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `feat/keyless-start`

---

## Context

Today `saci start <KEY>` only works for Jira-born tasks: it fetches the issue
live, derives the workspace folder, scaffolds it, applies the vertical's
template, and writes the schemaVersion-2 `.saci.json` manifest. Local-born
tasks — work that starts before (or without) a Jira card — have no entry
point, even though the manifest contract already models them: `TaskManifest`
v2 (brief 035) carries nullable `jiraKey`/`localKey` with the invariant that
at least one is non-null, and `displayKey` is **derived** (`jiraKey ??
localKey`) in `packages/core/src/workspace.ts` — it is not a stored field.

This brief adds `saci start --local`, which mints a local key
`<prefix>-<seq>` from a per-designer identity file and scaffolds offline (no
Jira, no network, no credentials). Two facts shape the design:

1. **This is the FIRST production-state file in v2.** Nothing under
   `packages/` reads or writes home-dir/APPDATA/XDG state today; credentials
   are env-only, and every other file the CLI touches is passed by path. The
   identity file (designer prefix + sequence counter) is therefore a new
   seam: a dedicated module in `packages/cli` (the composition root owns I/O;
   `core` stays pure per R25), with a format the future `saci config` command
   will write without change (ratified decision D-prefix below).

2. **`--template <name>` interpretation (flagged for the mentor gate).** The
   ratified invocation contract writes `[--template <name>]`, but no
   `--template` flag exists in the codebase. The existing template mechanism
   is `--templates-root` + `--blank` + per-vertical one-file auto-resolution
   (`packages/cli/src/run-start.ts`, `resolveTemplateSource`). This brief
   interprets the contract's "works identically to Jira-born mode" as **reuse
   that existing mechanism unchanged** — local mode accepts the same
   `--templates-root`/`--blank` flags and resolves the vertical's single
   template file the same way. No by-name template selector is invented. This
   is the only reading under which "identically to Jira-born mode" is
   coherent; the mentor gate confirms it.

Ground truth (owner-verified 2026-07-13): no Jira project "RAF" or "ANA"
exists today, but a localKey like `RAF-1` is syntactically indistinguishable
from a real Jira issue key. Origin is therefore always declared (the
`--local` flag) or derived from manifest fields — never inferred from key
format, in any flow.

## Goal

Add a `--local` mode to `saci start` that mints `<prefix>-<seq>` from a
manually-seeded identity file, scaffolds the task folder offline through the
existing derive/collide/template/manifest pipeline, and writes a local-born
v2 manifest (`jiraKey: null`, `localKey` set).

Out of scope:

- Manual overrides in Jira-born mode (e.g. `saci start MCA-101 --title ...`):
  parked by owner decision 2026-07-13. Flags irrelevant to the chosen mode
  remain accepted-and-ignored per the existing on-ramp tolerance (D-a2).
- `saci config` (the identity-file writer), the `link` command, prefix
  validation against Jira project keys, claim/lock semantics.
- Any key-format validation in the manifest parser (v1 precedent holds).
- Counter recovery UX beyond the fail-loud collision check (session-035 D2
  layers 2–3 land with `saci config`).
- Any change under `packages/core/` — the 035 `started_at` month fallback
  already shipped; the core contract is sufficient as-is.
- Any change to `fetch`/`export` behavior.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/036-keyless-start/brief.md` (this file)
   - `packages/cli/src/identity.ts` (new), `packages/cli/src/identity.test.ts` (new)
   - `packages/cli/src/argv.ts`, `packages/cli/src/argv.test.ts`
   - `packages/cli/src/run-start.ts`, `packages/cli/src/run-start.test.ts`
   - `packages/cli/src/cli.ts`, `packages/cli/src/cli.test.ts`
   - `packages/cli/src/display.ts`, `packages/cli/src/display.test.ts`

   If anything else needs changing, **STOP and ask**. In particular,
   `packages/core/**` is off-limits (R25; see D9 for why no core change is
   needed).
2. Follow all rules in `CLAUDE.md` — especially R1 (cross-platform paths: the
   identity-file default composes from `os.homedir()` with `path.join`, never
   a hardcoded root), R2 (no new runtime deps), R4 (fail-loud, no silent
   catch), R7 (named constants), R20/R24 (strict TS, no `any`), R23
   (`node:test`, colocated `*.test.ts`, run against compiled `dist/`), R25
   (core stays pure; all identity-file I/O lives in `packages/cli`).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `feat/keyless-start`
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
4. The local path must work fully offline: no gateway construction, no
   `SACI_JIRA_*` env reads, no network. Do not call `makeGatewayFactory` on
   the `--local` path.
5. Fail-loud, no partial scaffold (brief-032 invariant, preserved): every
   validation that can fail — identity read, folder collision, template
   resolution — runs BEFORE any filesystem mutation of the workspace.
6. The `argv.ts` parser stays pure (no fs/env/exit/clock). Identity-file path
   resolution and all I/O live in `cli.ts` / `identity.ts` / `run-start.ts`.
7. File budgets: R5 (≤ 400 lines) and R6 (≤ 50-line functions) hold for every
   touched file. If `run-start.ts` would exceed 400 lines, STOP and propose a
   split at Pause 1 rather than improvising one.

### Conventions

- English throughout — code, comments, tests, commit messages (R9).
- Commit scope: `cli` for code commits, `tasks` for the brief commit.
- Error messages name the offending path/flag and the remedy (existing
  house style: see the collision report and env-check messages).
- Slot 036 evidence (P4, three sources, 2026-07-13): highest `docs/tasks/`
  folder is `035-manifest-schema-v2`; `git log --oneline main` shows 035
  merged (PRs #86/#87, head `4326adb`) with no slot burned after it; the only
  `CLAUDE.md` exception reserves are the burned 004–006 (E5).

### Architectural decisions already made (do not revisit)

Ratified in the mentor session of 2026-07-13 (D1–D7) and consumed from
session 035 (`docs/sessions/2026-07-10-mentor-035-keyless-schemaversion-2.md`).

#### D1 — Invocation contract (D-UX)

```
saci start --local --vertical <SIGLA> --title "<description>"
           --workspace-root <path> [--due <ISO-date>]
           [--templates-root <path>] [--blank]
```

- With `--local`, the positional `<key>` is forbidden: fail-loud usage error
  (exit 2). Key+local has no semantics today (retroactive linking belongs to
  the future `link` command).
- `--title` is required in local mode; it is the slug source through the
  existing leaf-slug sanitization in `derivePath` (session-035 D4; nothing
  new).
- `--vertical` is required in local mode; free-form value (e.g. `EC`),
  presence-only validation — no canonical vertical list exists. An empty or
  whitespace-only value counts as missing.
- `--due` is optional; maps to `entrega_iso` in the derivePath month chain.
  Absent → the month falls to the start timestamp (chain shipped in 035).

#### D2 — Template mechanism reused unchanged

The contract's `[--template <name>]` notation means the existing mechanism:
`--templates-root` (optional, defaulting to the `templates/` sibling of the
workspace root) + `--blank` + one-file auto-resolution under
`<templatesRoot>/<vertical>`. Local mode threads its `--vertical` value into
that resolution exactly as the Jira-born vertical is threaded today. No new
flag, no by-name selector. (Interpretation flagged in Context for the mentor
gate.)

#### D3 — Jira-born key normalized to uppercase

The positional key is uppercased in the parser before use (pure string op —
typo hygiene, NOT format validation; the parser stays format-agnostic per v1
precedent).

#### D4 — Identity source in v0 (D-prefix)

The designer prefix and the sequence counter are co-located in ONE local
production-state JSON file, manually seeded in v0. The future `saci config`
becomes the writer of this file; the on-disk format does not change. Prefix
validation against Jira project keys (session-035 D1) is deferred with `saci
config` and must be re-runnable when it lands; the v0 defense is the
fail-loud folder-collision check at start (session-035 D2, backstop layer 1).

#### D5 — Origin is declared, never inferred from key format

`RAF-1` is syntactically indistinguishable from a Jira key. Origin comes from
the `--local` flag at start time and from manifest fields (`jiraKey` /
`localKey`) afterwards. No code path may infer origin from key shape.

#### D6 — Local-born manifest field values

`schemaVersion: 2`, `jiraKey: null`, `localKey: "<prefix>-<seq>"`, `history:
[{ event: "start", actor: null, at: <now ISO> }]` (`actor` stays null until
identity config exists — the identity file carries a prefix, not an actor
name). `vertical`, `slug`, `template`, `drivePath` are filled exactly as the
Jira-born path fills them. Counter gaps are accepted; recovery is manual
(session-035 D2).

#### D7 — Sequence counter semantics (session-035 D2)

Read state file → build localKey → fail-loud collision check as backstop →
persist incremented counter around the scaffold. Gaps accepted (a failed run
after increment is fine). The exact increment-vs-scaffold ordering is P2
below (open, planner-recommended, mentor gate decides).

### Planner-closed implementation decisions (executor implements)

#### D8 — `ParsedCommand` gains a separate `start-local` variant

`{ kind: "start-local"; vertical: string; title: string; due?: string;
workspaceRoot: string; templatesRoot?: string; blank: boolean }`, alongside
the untouched `start` variant. A discriminated variant keeps `cli.ts`
dispatch flat and avoids optional-field soup on the Jira-born shape. The new
flags (`local` boolean; `vertical`, `title`, `due` strings) join the single
shared `CLI_OPTIONS` union (on-ramp tolerance D-a2 preserved).

#### D9 — `derivePath` input mapping for local mode (no core change)

`key ← localKey`, `summary ← --title`, `vertical_raw ← --vertical`,
`entrega_iso ← --due ?? null`, `jira_updated_at ← ""` (empty string),
`started_at ← now.toISOString()`, `campaign ← null`. `derivePath` is total
and never throws; an empty `jira_updated_at` yields no month and falls
through to `started_at` (the 035 third source), which realizes D1's "absent
`--due` → start-timestamp month" without touching the core contract. The
empty-string choice gets a why-comment referencing this decision. (Passing
plain `"EC"` as `vertical_raw` is safe: `parseVertical` returns a no-bracket
value verbatim.)

#### D10 — Identity module seam: `packages/cli/src/identity.ts`

- `interface IdentityState { prefix: string; nextSeq: number }` — the exact
  on-disk JSON field names are `prefix` and `nextSeq` (D4 fixes co-location
  and stability; this fixes the names).
- `readIdentityState(filePath)`: fail-loud. A missing file (ENOENT) throws an
  error that names the resolved path and shows the exact JSON to seed
  manually (e.g. `{ "prefix": "RAF", "nextSeq": 1 }`). Malformed JSON or a
  wrong shape (prefix not a non-empty string; nextSeq not an integer ≥ 1)
  throws naming the offending field. No prefix charset validation — that
  arrives with `saci config` (D4).
- `writeIdentityState(filePath, state)`: pretty-printed 2-space JSON with a
  trailing newline (mirrors `serializeManifest` style). No directory
  creation: a successful read precedes every write, so the parent exists.

#### D11 — `--due` is format-validated fail-loud at the command boundary

Owner ruling at the mentor gate (2026-07-13): the original pass-through
design is REVERTED. An invalid or unparseable `--due` value fails loud with
a clear error naming the flag and the expected format (ISO date,
`YYYY-MM-DD`) before any mutation — no identity-file write, no workspace
write. The check lives at the command boundary in the CLI layer: the same
parsing layer that validates `--title`/`--vertical` presence performs it (a
pure string check — constraint 6 unaffected), so rejection is a usage error
(exit 2 via the shell, D-a4) and structurally precedes any filesystem
mutation. Pinned by a test alongside the local-start parsing tests.

Rationale (recorded per the ruling): `--due` is the only free-typed human
date input; the month-chain absorption was designed for upstream-source
data (Jira), not for designer typos. A typo silently filing the task under
the wrong Drive month is real operational pain — the same argument that won
the explicit `--local` flag: typos fail loud, never degrade silently.

Core untouched: `derivePath`'s absorption behavior remains as shipped in
035 — it still serves upstream-source data. The validation lives in the CLI
boundary only (R25 unaffected). This does not reopen key-format validation:
D3 and the Out-of-scope list hold unchanged.

#### D12 — `StartRunResult` gains `localKey: string | null`

`null` on the Jira-born path. `renderStart` prepends a `Local key: <key>`
line when non-null, so the minted key is explicit in the output rather than
only readable out of the folder name.

#### D13 — `runStart` refactor shape

Extract the shared post-derivation pipeline (collision check → template
resolution → scaffold → template copy → manifest write) into an internal
helper both paths call. Add `runStartLocal(options)` taking a single options
object (`identityFilePath`, `vertical`, `title`, `due`, `workspaceRoot`,
`templatesRoot`, `blank`, `now`) — eight positionals would violate the house
style and R6 readability. `buildManifest` is parameterized over the key pair
(`jiraKey`/`localKey`) and the display key used for the leaf-slug slice,
instead of hardcoding `issue.key`. Jira-born behavior is byte-identical
(existing tests must pass unmodified except where signatures force it).

### Open decisions proposed for the mentor gate (ratify or amend before execution)

These two points were explicitly left open in the scope handoff. The
recommendations below are the planner's; the mentor gate decides. Once
ratified, this brief is amended to record the outcome (single amended brief
commit pre-validation) and each `P` becomes a closed `D`.

#### P1 — Identity-file on-disk location and lookup rule

**Recommendation:** default path `path.join(os.homedir(), ".saci",
"identity.json")`; overridable by the env var `SACI_IDENTITY_FILE` (absolute
or cwd-relative path, resolved in `cli.ts`). No per-command flag.

Rationale: env-based configuration matches the only existing precedent
(`SACI_JIRA_*` credentials, D-a3 — resolved in the shell, not the parser);
`os.homedir()` + `path.join` satisfies R1 on all three OSes; a dotfile under
the home dir is the simplest v0 shape and `saci config` later writes the same
path without a format or location change. Alternative considered: an
`--identity-file` flag — rejected because identity is per-machine
configuration, not per-invocation input, and a flag invites divergent
identities across runs.

#### P2 — Counter increment ordering

**Recommendation:** persist the incremented counter AFTER all pre-mutation
validations pass (identity read, collision check, template resolution) and
BEFORE the first workspace filesystem mutation. Sequence: read identity →
mint `<prefix>-<nextSeq>` → derivePath → collision check → template
resolution → write identity with `nextSeq + 1` → scaffold → copy → manifest.

Rationale: the two failure windows are asymmetric. Increment-first makes a
crash mid-scaffold burn a sequence number — a gap, explicitly accepted by
session-035 D2. Increment-last (after scaffold) makes the same crash reuse
the number on the next run, forcing the collision backstop to fire on a
routine failure and requiring manual recovery. Gaps are cheap; collisions
are not. The backstop stays reserved for genuine anomalies (mis-seeded
counter, restored-from-backup identity file).

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The owner pre-saved this brief to `docs/tasks/036-keyless-start/brief.md`
before invoking the executor (path B). The executor verifies presence and
commits.

- [ ] Directory `docs/tasks/036-keyless-start/` exists
- [ ] File `docs/tasks/036-keyless-start/brief.md` exists; first line matches
      the title above
- [ ] `git add docs/tasks/036-keyless-start/brief.md` is staged
- [ ] Commit #1 created with subject `docs(tasks): add brief for 036-keyless-start`

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

### Edit 2 — Create the identity state module

Create `packages/cli/src/identity.ts` per D10 and colocated
`packages/cli/src/identity.test.ts`. Named constants (R7) for the default
directory/filename leaves used by `cli.ts` path resolution (per P1 as
ratified). Doc comment states the D4 contract: manually seeded in v0, future
`saci config` is the writer, format stable.

Verification:

- [ ] `readIdentityState` on a missing file throws; the message contains the
      resolved path and the literal seed example `{ "prefix": ..., "nextSeq": ... }`
- [ ] Malformed JSON, non-string/empty `prefix`, and non-integer or `< 1`
      `nextSeq` each throw naming the field (tests cover all)
- [ ] `writeIdentityState` → `readIdentityState` round-trips; output is
      2-space pretty JSON with trailing newline
- [ ] No import from `@saci/core` adapters, no network, no env reads in the
      module (path is injected)
- [ ] `npm run build` and `npm test` pass

Commit: `feat(cli): add identity state module for local task keys`

### Edit 3 — Extend the argv surface for `--local`

Modify `packages/cli/src/argv.ts` and `argv.test.ts`:

- Add `local` (boolean), `vertical`, `title`, `due` (strings) to
  `CLI_OPTIONS` and `CliValues`.
- Add the `start-local` variant per D8 with conflict checks: positional key
  with `--local` → usage error; `--local` missing/empty `--title` or
  `--vertical` → usage error (message names the missing flag); `--local`
  with an invalid or unparseable `--due` → usage error naming `--due` and
  the expected ISO date format (amended D11). Usage errors exit 2 via the
  shell (D-a4), as today.
- Uppercase the Jira-born positional key (D3).
- Update the `USAGE` string to show both `start` forms.

Verification:

- [ ] Parser remains pure: no `fs`/`process.env`/`process.exit`/clock imports
- [ ] Tests cover: local happy path (with and without `--due`,
      `--templates-root`, `--blank`); key + `--local` conflict; missing
      `--title`; missing `--vertical`; empty-string `--vertical`; invalid
      `--due` (e.g. `15/08/2026`) → usage error naming `--due` and the ISO
      format; lowercase Jira key normalized to uppercase; Jira-born parse
      unchanged otherwise
- [ ] `USAGE` lists the local form with required and optional flags
- [ ] `npm run build` and `npm test` pass

Commit: `feat(cli): add --local mode to start argv parsing`

### Edit 4 — Local-born path in `run-start`

Modify `packages/cli/src/run-start.ts` and `run-start.test.ts` per D6, D7,
D9, D12, D13 and the ratified P2:

- Extract the shared scaffold pipeline; add `runStartLocal(options)`.
- No gateway construction on the local path (constraint 4).
- Manifest per D6; leaf-slug slice keyed off `localKey`.
- Counter persisted per P2 (as ratified at the mentor gate).
- `StartRunResult.localKey` per D12 (`null` set on the Jira-born path).

Verification:

- [ ] Local run with a fake identity file creates
      `AVULSAS/<vertical>/<month>/<prefix>-<seq>_<slug>/editaveis/assets/`
      and `.saci.json` with `jiraKey: null`, `localKey` set, one `start`
      history entry with `actor: null`
- [ ] `--due 2026-08-15` → month segment `2026-08`; `--due` absent → month
      from the injected `now` (an unparseable `--due` never reaches this
      layer — rejected at the command boundary per amended D11)
- [ ] Identity file's `nextSeq` is incremented on disk after a successful
      run; ordering vs scaffold matches ratified P2 (test simulates a
      scaffold failure and asserts the counter state P2 prescribes)
- [ ] Existing-folder collision throws the existing report; no workspace
      mutation and counter state consistent with P2 (validation failures
      before the persist point must NOT consume a sequence number)
- [ ] Jira-born path: existing tests pass unmodified except
      signature-forced edits; manifest output byte-identical for the same
      inputs
- [ ] `grep -n "makeGateway" packages/cli/src/run-start.ts` shows no gateway
      use on the local path
- [ ] `git diff --name-only` shows no change under `packages/core/`
- [ ] `npm run build` and `npm test` pass

Commit: `feat(cli): support local-born tasks in runStart`

### Edit 5 — Wire the shell and the display layer

Modify `packages/cli/src/cli.ts`, `display.ts`, and their tests:

- `cli.ts`: dispatch `start-local` → resolve the identity-file path per
  ratified P1 (env override, else default composed with `os.homedir()` +
  `path.join`) → call `runStartLocal`. No `makeGatewayFactory` call and no
  `SACI_JIRA_*` reads on this path; runtime errors map to exit 1 as today.
- `display.ts`: `renderStart` prepends `Local key: <key>` when
  `result.localKey` is non-null (D12); Jira-born output unchanged.

Verification:

- [ ] With all `SACI_JIRA_*` env vars unset, `saci start --local ...`
      succeeds end-to-end against a temp workspace and temp identity file
      (offline proof)
- [ ] Missing identity file → exit 1 with the D10 seeding guidance on stderr
- [ ] `key + --local` → exit 2 with usage on stderr
- [ ] `renderStart` tests cover both the `localKey` line and the unchanged
      Jira-born rendering
- [ ] `npm run build` and `npm test` pass

Commit: `feat(cli): wire start --local through the CLI shell`

### Automated checks (run before each commit)

- [ ] `npm run build` passes without errors
- [ ] `npm test` passes (run manually — the pre-commit hook may not be wired
      in this clone)

### Structural checks

- [ ] `packages/cli/src/identity.ts` and `identity.test.ts` exist
- [ ] No file outside the constraint-1 list was modified
      (`git diff --name-only origin/main..HEAD`)
- [ ] `packages/core/**` untouched
- [ ] Every touched source file ≤ 400 lines (R5); functions ≤ 50 lines (R6)

### Behavior checks

- [ ] Offline local start works (no Jira env, no network)
- [ ] Jira-born `start` behavior is unchanged for the same inputs
- [ ] Lowercase Jira key is uppercased before the fetch
- [ ] Sequence gaps are possible; sequence reuse is not (per ratified P2)

### Git checks

- [ ] Branch used: `feat/keyless-start`
- [ ] Commits follow Conventional Commits (G-R3); subjects ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 1 — numbered plan presented and approved before any change
      (`Plan required: yes`)
- [ ] Pause 2 — first modified file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message +
      `pre-commit-self-audit` output shown before each commit
- [ ] If any criterion could not be met, it was reported explicitly

### Commit sequence

1. `docs(tasks): add brief for 036-keyless-start`
2. `feat(cli): add identity state module for local task keys`
3. `feat(cli): add --local mode to start argv parsing`
4. `feat(cli): support local-born tasks in runStart`
5. `feat(cli): wire start --local through the CLI shell`

All subjects ≤ 72 chars; leading verbs (`add`, `support`, `wire`) are on the
allowlist in `.claude/skills/pre-commit-self-audit/SKILL.md`.

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
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md` as a
  follow-up brief.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: yes`:

- Edits 4 and 5 involve a refactor of `runStart` (D13) whose exact extraction
  shape the executor proposes — the brief fixes constraints and contracts,
  not line-level snippets.
- P1 and P2 must be ratified at the mentor gate before execution; the Pause-1
  plan confirms the ratified outcomes are reflected in the brief.
- Test design (fake identity files, temp workspaces, injected `now`) is
  executor-proposed within R23 constraints.

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — known traps
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
5. `.claude/skills/brief-template/SKILL.md` — template reference
6. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit skill (Pause 3)
7. `docs/sessions/2026-07-10-mentor-035-keyless-schemaversion-2.md` —
   session-035 D-set consumed by this brief
8. `packages/core/src/workspace.ts` — TaskManifest v2 contract (read-only)
9. `packages/core/src/derive-path.ts` — month chain incl. `started_at`
   (read-only)
10. `packages/cli/src/run-start.ts`, `argv.ts`, `cli.ts` — the surfaces this
    brief extends

## Git workflow

### Branch

`feat/keyless-start` off up-to-date `main`.

### Commit sequence

See "Commit sequence" under Done criteria — five commits, brief first,
then one commit per Edit (2–5).

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Any verification checkbox from this brief that could not be met, with
   explanation
4. Confirmation that no `git push` was executed
5. Suggested next step (open PR, follow-up brief, etc.)
