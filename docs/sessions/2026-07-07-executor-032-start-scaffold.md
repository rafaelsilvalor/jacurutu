# Session recap — 2026-07-07 — 032-start-scaffold (executor)

**Mode:** caminho-A executor handoff (planner → brief-validator APPROVED 11/11 →
mentor gate → executor) completed across a **session boundary**. The
implementation ran to completion in an earlier Code session that was **lost
before close-out**; this record's session performed the **recovery + close-out**
(read-only inventory → push on explicit authorization → PR → post-merge cleanup).
**Executor:** Claude Code executor subagent (implementation) + Code main session
(recovery/close-out), driven by Rafael as mentor at every Pause.
**Merged via:** PR #79, squash merge → `main@85ff582`.
**Pairs with:** `2026-07-04-mentor-032-start-scaffold.md` (design D1–D7 + gate).
This is the execution-side record only.

## One-line summary

Added `saci start <KEY>` — the first production-loop command: fetch one Jira
issue live by key (new `fetchIssueByKey` port method), derive its workspace
folder via `derivePath`, refuse to overwrite an existing one, scaffold the D-A
structure (`editaveis/` + `editaveis/assets/`), copy the vertical's template
(skipped with `--blank`), and write a v0 `.saci.json` manifest — all local-only,
validated fail-loud before any write; shipped green and merged.

## Built

- `packages/core/src/gateways.ts` (+8) — one interface-only method on
  `JiraGateway`: `fetchIssueByKey(key: string): Promise<Issue>`, documented
  fail-loud (never `Issue | null`). No import, no impl (R25).
- `packages/adapter-jira/src/gateway.ts` (+32, now 334) — `fetchIssueByKey`
  implemented via a `key = <KEY>` search over the existing `this.http.searchJql`
  wire op (no new wire op, no single-issue REST endpoint). Asserts exactly one
  raw result; reuses `uniqueParentKeys` → `fetchSisters`/`fetchParents` →
  `buildIssueEntry`; deliberately skips `applyOwnFilters` /
  `applyParentTemplateFilter` (P3) and `validateFieldMapping`.
- `packages/adapter-jira/src/gateway.test.ts` (+97) — 4 cases (below).
- `packages/cli/src/argv.ts` (+32, now 165) — a fifth `ParsedCommand` kind
  `start`, the `workspace-root` / `templates-root` / `blank` options, the
  `routeCommand` `case "start"` (required `<KEY>` and `--workspace-root`;
  `templatesRoot` forwarded unresolved), and the `USAGE` line.
- `packages/cli/src/argv.test.ts` (+47) — 5 cases (below).
- `packages/cli/src/run-start.ts` (**new, 217**) — the `runStart` composition
  function + `StartRunResult`, mirroring `run-fetch.ts` (injected `makeGateway`
  factory, injected `now: Date`). Named constants at top (R7); eight small
  helpers, each ≤ 50 lines (R6).
- `packages/cli/src/run-start.test.ts` (**new, 183**) — 4 cases (below), real
  `mkdtemp` temp dirs, fake `makeGateway`, injected fixed `now`.
- `packages/cli/src/display.ts` (+18, now 128) — pure `renderStart` ending in
  `TRAILING_NEWLINE`; paths only (D3), states the blank path.
- `packages/cli/src/display.test.ts` (+31) — 2 cases (with-template, blank).
- `packages/cli/src/cli.ts` (+17) — `case "start"` wired: gateway built with an
  **empty `mainJql`** (P5, one-line "why" comment), `runStart(...)` →
  `renderStart(...)`; failures ride the existing `main()` catch → non-zero exit.
- `packages/cli/src/run-fetch.test.ts` (+5) — the inline fake gained a
  `fetchIssueByKey` throw-stub (P6 ripple — an explicit throw, R4, not a silent
  stub); no other assertion changed.

## Recovery + close-out (this session)

The implementation session was lost after all three commits existed but before
the final report, PR, and merge. Recovery doctrine applied — **ground-truth
before action, reconcile against the brief, never regenerate from memory**:

1. Read-only inventory: branch `feat/start-scaffold` at `37a054c`, working tree
   clean, all 3 planned commits present with exact subjects, no remote branch,
   `npm test` 189/0, conformance sample confirmed `fetchIssueByKey` in
   `gateways.ts` and the `start` kind in `argv.ts`. Nothing partial or damaged.
2. On Rafael's explicit authorization (R17), pushed the branch and opened PR #79
   with the mandatory template filled (the "pre-commit hook ran" box left
   unchecked with the not-wired note; the manual-OS box left unchecked — no live
   `saci start` smoke run was done against Jira).
3. After Rafael merged (squash → `main@85ff582`): checked out `main`, pulled,
   deleted the local branch, pruned the GitHub-auto-deleted remote ref, verified
   the tree clean.

## Decisions implemented (as built)

- **D1 — local-only.** No Drive, no `adapter-drive`. `start` ends by returning
  the created folder + editable paths; `cli` prints them.
- **D2 — live fetch, fail-loud.** `fetchIssueByKey` runs every time; zero or >1
  results throw naming the key and count. No cache. No Jira → no scaffold.
- **D-A — folder structure.** Leaf + `editaveis/` + `editaveis/assets/` created;
  `.saci.json` at the leaf root. No placeholder finals.
- **D4 / `--blank`.** Template copied from `<templatesRoot>/<vertical>/` into
  `editaveis/`; `--blank` skips only the copy — same dirs, same manifest,
  `template === "blank"` (`BLANK_TEMPLATE_ID`).
- **D5 — collision.** Existing leaf folder → explanatory report (states
  `.saci.json` / `editaveis/` presence) + options, throw, non-zero exit, never
  overwrites, never prompts. Report built **before** any write.
- **P1 — `--templates-root` optional.** Defaults to a `templates/` **sibling** of
  the resolved workspace root, computed in the composition root.
- **P2 — template rename.** Copied file renamed to the `derivePath` leaf stem +
  the source's original extension; no new core function.
- **P3 — filters skipped on the single-key path** (designed, commented).
- **P4 — template-source contract.** Exactly one regular file in the vertical
  dir; missing dir / zero / many throw naming the resolved path and what was
  found, before any scaffold.
- **P5 — empty `mainJql` for start** (`fetchIssueByKey` ignores it).
- **P6 — atomic commit #2** (core port + adapter impl + adapter tests + fetch
  fake-stub) so every package stays green.

## Fail-loud design (R4)

Every failure path throws; nothing is swallowed. `pathExists` rethrows any non-
`ENOENT` stat error rather than reporting "absent"; `resolveTemplateSource`
distinguishes a missing dir (`ENOENT` → guidance message) from a bad file count.
Ordering is the contract (constraint 4): fetch → derive → collision check →
template-source resolution all precede the first `mkdir`. `run-start.ts` proves
this in its structure — the two `throw` sites sit above the "Only now mutate the
filesystem" comment.

## STOP guards — none fired

All three judgment-flag guards held (verified at Pause 1, confirmed by the built
code): `buildIssueEntry` and the sister/parent helpers were reusable as-is
without dragging multi-search orchestration into the single-key path;
`ParsedCommand` extended cleanly with a fifth kind (no shared-type
restructuring); naming reused the `derivePath` leaf stem (no hardcoded format).
No out-of-scope path was touched.

## Verification

- `npm test` (all workspaces, compiled `dist/`) — **189 pass / 0 fail** on the
  merged tree.
- R25: `grep -rn 'from.*adapter' packages/core/` — empty; core derivation +
  manifest assembly stay pure, all fs/network in `cli`.
- R24 (`\bany\b`) / R20 (`@ts-ignore` / `@ts-expect-error`) — empty in the new
  files.
- R1: paths composed with `path.join` / `path.resolve` throughout; no hardcoded
  `D:\` / `/Users/` (A4).
- R5: every source file ≤ 400 (largest touched: `gateway.ts` 334, `run-start.ts`
  217). R6: `run-start.ts` split into eight ≤ 50-line helpers.
- R7 named constants: `TEMPLATES_DIR_NAME`, `MANIFEST_FILENAME`, `EDITAVEIS_DIR`,
  `ASSETS_DIR`, `BLANK_TEMPLATE_ID`.
- `pre-commit-self-audit` reported at each Pause 3 in the implementation session
  (per the brief's process checks).

## Test coverage (added this task)

- **`fetchIssueByKey` (gateway.test.ts, 4):** single mapped issue with sister
  enrichment; rejects on zero (names key); rejects on >1 (names key); design
  filters NOT applied (an issue `fetchIssues` would drop is still returned) — P3.
- **`start` parser (argv.test.ts, 5):** valid parse (key + root + defaults);
  `--blank` sets `blank: true`; `--templates-root` forwarded unresolved; missing
  `<KEY>` → usage; missing `--workspace-root` → usage.
- **`runStart` (run-start.test.ts, 4):** happy scaffold — dirs created,
  `.saci.json` round-trips through `parseManifest` with the injected `startedAt`
  and `shippedAt: null`, template renamed to `<KEY>_<slug><ext>`; `--blank` —
  no copy, `template === "blank"`, same dirs/manifest; collision (D5) — throws,
  report names `.saci.json`/`editaveis` presence, nothing new written; bad
  template source (P4) — throws before any scaffold (leaf folder NOT created).
- **`renderStart` (display.test.ts, 2):** with-template (names folder, editable
  dir, applied template); blank (states no template applied).

## Green mechanism (record integrity)

The pre-commit hook is **not wired in this clone** (`core.hooksPath` unset), so
`npm test` did not auto-run on commit. Green was proven by running the full suite
manually (189/0). The PR template's "pre-commit hook ran" checkbox was left
unchecked with that note rather than falsely ticked (same discipline as brief
031). No live end-to-end `saci start` run against Jira was performed — the
command is exercised by `run-start.test.ts` against a fake gateway + temp dirs,
not a real card; a first live smoke run is a reasonable next-session opener.

## Commits (PR #79, squash-merged)

- `6b482f1` `docs(tasks): add brief for 032-start-scaffold` (commit #1;
  caminho-A — brief pre-saved, Edit 1 verify-only).
- `f7c3cd8` `feat(core): add fetchIssueByKey to JiraGateway port` (commit #2 —
  atomic per P6: core port + adapter impl + adapter tests + fetch fake-stub).
- `37a054c` `feat(cli): add start subcommand for local scaffold` (commit #3 —
  Edits 4–7: argv, run-start, display, cli wiring + tests).

Squashed to `main@85ff582` as
`feat(cli): add start subcommand for local scaffold (#79)`.

## Gotchas discovered

None new. One process note carried forward: the session-loss recovery confirmed
the Pause-1 STATE.md ruling's accepted cost was survivable — the brief + git log
were prescriptive enough to reconcile the interrupted run without regeneration.

## Next step

Front-runners for the next session (mentor's list, unchanged): **keyless start /
local task identity** (schemaVersion 2 D-set — explicitly out of 032), the
accumulated **docs reconciliation** (derivePath D2 segments deviation + the
removed `Workspace` type in the Phase 2 exit criterion), **open-in-software**
(D3), or the **template naming-convention + sanitization-unification** brief. A
first live `saci start` smoke run against a real Jira card is a low-cost opener.
Not part of this PR or this recap.
