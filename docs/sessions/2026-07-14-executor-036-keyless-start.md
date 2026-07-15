# Session recap — 2026-07-14 — 036-keyless-start (executor)

**Mode:** caminho-B execution (owner pre-saved the brief; D11 gate amendment
applied and re-validated in-session, then full supervised execution: Pause 1
plan, Pause 2 × 4 Edits, Pause 3 × 5 commits, all driven by Rafael as mentor).
**Executor:** Claude Code main session (implementation + orchestration;
brief-validator subagent for the amendment re-audit), Rafael as mentor.
**Merged via:** PR #88, squash merge → `main@e1b73ab`.
**Pairs with:** `2026-07-14-mentor-036-keyless-start-execution.md` (same PR).
Consumes the 2026-07-13 gate rulings (P1/P2/--template confirmed, D11
reverted) and the session-035 D-set.

## One-line summary

Shipped `saci start --local`: a per-designer identity file
(`~/.saci/identity.json`, `SACI_IDENTITY_FILE` override) mints
`<prefix>-<seq>`, the parser gains a `start-local` variant with fail-loud
`--due` validation (amended D11, via core's `parseEntrega`), `runStartLocal`
scaffolds offline through a validate/persist/execute pipeline that burns
sequence numbers but never reuses them (P2), and the shell wires it all with
spawn-based offline E2E proof — 5 commits, 232/0 tests.

## Pre-execution: D11 amendment

The brief on disk was amended in-session per the owner ruling (D11 REVERTED:
`--due` format-validated fail-loud at the command boundary; core absorption
untouched, R25 unaffected). Patch stayed within D11 + Edit 3/Edit 4 text;
brief-validator re-audit: **APPROVED, 11/11**. Committed as commit #1 only
after the execution contract arrived with all four gate rulings filled.

## Built

- `packages/cli/src/identity.ts` (new, 82 lines) — the first production-state
  seam in v2: `IdentityState { prefix, nextSeq }`, `readIdentityState` with
  four fail-loud layers (ENOENT → resolved path + literal seed example;
  malformed JSON; non-object document; per-field shape errors),
  `writeIdentityState` (2-space JSON + trailing newline, mirroring
  `serializeManifest`), `IDENTITY_DIR_NAME`/`IDENTITY_FILENAME` constants
  consumed by cli.ts. `identity.test.ts` (6 tests) includes a byte-exact
  round-trip assertion — the format-stability contract for the future
  `saci config` writer. Non-atomic write accepted at Pause 2 (corruption
  fails loud on next read; temp-then-rename only on real pain).
- `packages/cli/src/argv.ts` — `start-local` variant (D8); `local`/`vertical`/
  `title`/`due` join the shared `CLI_OPTIONS` union (D-a2 tolerance);
  `routeStart`/`routeStartLocal` extracted (`routeCommand` pre-dated R6 at
  ~68 lines; now ~28); Jira-born key uppercased (D3, typo hygiene only);
  amended-D11 check `parseEntrega(due)[0] === null` → usage error naming
  `--due` and the ISO format; `USAGE` shows both start forms. Parser still
  pure (the new import is a pure core function). `argv.test.ts` +11, including
  the non-calendar `2026-02-30` rejection — the payoff of reusing
  `parseEntrega` instead of reimplementing date parsing (anti-A3).
- `packages/cli/src/run-start.ts` — D13 split: `validateScaffold` (collision +
  template resolution, throws before any write) / `executeScaffold` (mkdir →
  copy → manifest), with the P2 counter persist between them on the local
  path; `buildManifest` parameterized over `{jiraKey, localKey}` + displayKey
  (Jira-born manifest byte-identical); `StartRunResult.localKey` (D12);
  `runStartLocal(options)` maps D9 into `derivePath` — the
  `jira_updated_at: ""` why-comment states the guard-rail-2 rationale
  (non-nullable `DerivePathInput` field + core out of scope). No gateway on
  the local path. `run-start.test.ts` +6, including the **P2 trio** (see
  below).
- `packages/cli/src/cli.ts` — `ENV_IDENTITY_FILE` beside the other `ENV_*`
  constants; `resolveIdentityFilePath()` (P1: non-empty env → `path.resolve`,
  else `os.homedir()` + the identity.ts constants — no duplicated literals);
  `start-local` dispatch via `toStartLocalOptions` (keeps `runCommand` within
  R6); no `makeGatewayFactory`, no `SACI_JIRA_*` reads on this path.
- `packages/cli/src/display.ts` — `renderStart` prepends `Local key: <key>`
  when non-null (D12); Jira-born output byte-identical.
- `packages/cli/src/cli.test.ts` — Phase-1 sentinel replaced by 3 E2E tests
  spawning compiled `dist/cli.js` with every `SACI_*` env var scrubbed:
  offline success (exit 0, `Local key: RAF-1` first line, manifest on disk);
  missing identity file (exit 1, seed guidance, workspace untouched);
  key + `--local` (exit 2, usage). Exit-code constants mirrored, not imported
  (a spawn E2E must not import the side-effectful entry module — recorded
  acceptance, not an R7 lapse).

## The P2 test trio (ordering proven at three failure positions)

1. **Pre-persist** — folder collision: counter untouched on disk, nothing
   written (validation failures never consume a number).
2. **At-persist** — read-only identity file: the persist itself fails after
   validation, workspace left without even `AVULSAS/` (persist precedes the
   first workspace write).
3. **Post-persist** — injected `CrashingClock` (Date whose `toISOString`
   throws at manifest assembly): number burned (gap, 035-D2), and a healthy
   re-run mints the NEXT number with no collision — gaps possible, reuse
   impossible.

## Verification — the done criteria

- `npm run build` exit 0 and `npm test` green at every commit boundary; final
  **232 pass / 0 fail** (206 baseline → +6 identity, +11 argv, +6 run-start,
  +1 display, +3 E2E, −1 sentinel).
- Structural: diff exactly the brief's allowed paths (11 files, +1525/−61);
  `packages/core/**` untouched; `makeGateway` grep clean on the local path;
  every touched file within R5, every function within R6.
- `pre-commit-self-audit`: 25 PASS / 0 FAIL (5 checks × 5 commits).
- Guard-rail 1 (exit codes): verified on disk before writing E2E —
  `cli.ts:25-27`, 0/1/2 (ok/runtime/usage, D-a4); matched the plan, no
  adjustment.
- All five commit messages verified verbatim via `git log --format=%B -1`
  after each commit — no drift, no amends, no trailers. STATE.md not created
  (single session).

## Green mechanism (record integrity)

The pre-commit hook is **not wired in this clone** (`core.hooksPath` unset),
so green was proven by running build + full suite manually before each
commit. The PR template's hook checkbox carried that note rather than a
false tick (same discipline as 031–035).

## Process notes

1. **Four evidence-close lapses** (commit #1 twice, commit 3 twice), cleared
   under escalation. Root cause identified mid-run: evidence pastes were
   being emitted in intermediate text blocks between tool calls, which do not
   reliably reach the chat — transport, not protocol refusal. Self-correction
   applied from that point: all evidence goes in the turn's final message.
   Protocol hardening is queued as a pipeline item (mentor recap, caminho B).
2. **One approved deviation:** the +2-line signature-forced fix to
   `display.test.ts` (new `StartRunResult.localKey` in typed literals) rode
   commit 4 instead of planned commit 5 — the alternative was a red commit-4
   boundary. Annotated in the commit-4 staged scope at Pause 3.

## Commits (PR #88, squash-merged)

- `0cb6864` `docs(tasks): add brief for 036-keyless-start` (amended D11).
- `3ba636c` `feat(cli): add identity state module for local task keys`.
- `74f8929` `feat(cli): add --local mode to start argv parsing`.
- `14e4bba` `feat(cli): support local-born tasks in runStart`.
- `d7229d1` `feat(cli): wire start --local through the CLI shell`.

Squashed to `main@e1b73ab` as
`feat: add keyless start --local for local-born tasks (#88)`. Push and PR
executed only on explicit owner authorization ("go"); merge by owner.

## Post-merge cleanup (this session)

Checked out `main`, pulled `4326adb → e1b73ab` (squash landed exactly the 11
in-scope files), deleted the local branch (`-d`, upstream-merged), remote ref
already auto-deleted by GitHub. Working tree clean but for the pre-existing
untracked `payload.json`.

## Carried items (no action this session)

- **Parking lot:** align `DerivePathInput.jira_updated_at` to `string | null`
  (the `started_at` pattern) next time core opens — removes the `""` absence
  sentinel `runStartLocal` documents today.
- **`payload.json` untracked clutter** — 3rd sighting: rule-of-three reached,
  eligible for the next hygiene batch (`.gitignore`).
- **Pipeline protocol patch** (evidence-transport hardening) — owner decision
  pending; mentor authors on go.
- **2026-07-13 gate-session mentor recap** — still not on disk; not part of
  this docs PR.
- `gateways.ts` manifest-shape TODO and missing-env error DX — unchanged.

## Next step

Owner decides on the pipeline protocol patch, then the queue per the mentor
recap: open-in-software follow-up brief, hygiene batch, `ship` command
horizon. `saci config` now has a stable identity-file format waiting for it.
