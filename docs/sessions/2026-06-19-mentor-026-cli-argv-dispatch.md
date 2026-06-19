# Session recap — mentor — 2026-06-19 — 026 cli argv dispatch

**Session type:** decision closure (prior chat) → caminho-A delegation → gate reviews → merge.
**Continues:** docs/sessions/2026-06-12-mentor-023-payload-export.md (the D9 deferral this brief closes).
**Result:** brief 026 executed and merged (PR #65, squash → `main@3004e69`). Branch `feat/cli-argv-dispatch`, 3 commits: a pure argv parser/router (`argv.ts`) + the `cli.ts` shell wiring `runFetch` / `runExport` into `saci fetch` / `saci export`. `node --test` 19/0; no new runtime dependency (R2).

## What this brief delivers (Phase 3 on-ramp)

- The deferred half of 023 D9 and §2 active-focus item #1: the test-only `runFetch` (022) / `runExport` (023) composition functions become real CLI commands.
- Deliberately an **on-ramp**, not the full command surface: parse → dispatch → construct gateway from env → call run\* → print one minimal line. Rich human-facing display stays a separate, named Phase 3 item.
- `core` / `adapter-jira` / `run-*.ts` were frozen and consumed verbatim — this brief is purely the composition-root wiring (R25: `cli` is the only package importing the adapter).

## Decisions (closed in chat before delegation)

- **D-a1:** CLI lib = Node builtin `parseArgs` (`node:util`) + manual `switch`. No new runtime dependency (R2). Closes the 016 D4 defer.
- **D-a2:** command surface — `saci fetch --jql <s> [--out <p>]` (default out `payload.json`); `saci export --payload --config --profile` (output from the resolved profile, not a flag); `--version` / `-v` unchanged; missing/unknown command → usage to stderr, exit 2.
- **D-a3:** composition root reads env (`SACI_JIRA_BASE_URL` / `_EMAIL` / `_API_TOKEN`), constructs `JiraGateway`, injects via the `makeGateway` factory; `mainJql` from `--jql` (never hardcoded); `fieldMapping` defaults via omission (Phase 3 FieldMapping is 023 D5).
- **D-a4:** exit codes — success 0, usage 2, runtime/IO/network 1; all errors to stderr; a run\* throw caught at the top level → exit 1.
- **D-a5:** minimal output — `wrote N issues to <path>` / `wrote <rowCount> rows to <outputPath> (<format>)`. No table/color.
- **D-a6:** extract a PURE argv parser/router, unit-test it (valid commands, missing flag, unknown command, `--version`); thin shell not network-tested; no network in any test.

## Planner-side judgment ratified (D-a4 boundary)

The closed D-set did not assign a missing-env credential to exit 1 vs 2. The planner resolved it within D-a4's taxonomy: usage errors (exit 2) are argv-shape errors owned by the *pure parser*; a missing env credential is a runtime precondition owned by the *shell* → exit 1. Recorded in the brief as a clarification, not a new decision. Approved as written. **The exit-code boundary tracks the purity seam** — worth carrying as a reusable framing.

## Mentor gate interventions (during caminho-A execution — 2 fixes)

1. **Pause 2 — R6 overage.** `parseArgv` landed at 70 lines (R6 ≤ 50) and did **not** qualify for the orchestration-handler exception (that exception is for handlers *mostly making sequential calls*; this one inlined the `parseArgs` options, an inline `values` type, and the routing switch). Directed a behavior-preserving split: hoist options to a module-level `CLI_OPTIONS` constant (also satisfies R7) + extract `routeCommand(values, positionals)`. Result: `parseArgv` 20, `routeCommand` 34, both ≤ 50; public surface unchanged.
2. **Pause 3 — A3 (premature abstraction).** The shell introduced `class UsageEnvError extends Error {}` thrown on missing env. Flagged: misleading name (implied exit 2 while mapping to exit 1) and no `instanceof` discrimination at the catch site → the subclass earned nothing over `new Error(...)`. Directed its removal; behavior identical.

Both fixes applied before the respective commit; gates re-run green each time.

## Pause 1 riders (approved)

- `DEFAULT_FIELD_MAPPING` **omitted**, not imported-and-passed: the adapter already declares `config.fieldMapping ?? DEFAULT_FIELD_MAPPING`, so the composition root omits the key. Default-by-omission over default-by-re-injection. The brief's "Suggested shape" import line was explicitly overridden.
- Verb pre-flight pulled forward from Pause 3: `wire` confirmed in the allowlist SSOT, so commit #3 kept the `wire` subject (the `update …` fallback was unused).

## Meta-observations (rule-of-three ledger)

- **R6 orchestration-handler exception is narrowly scoped** — a CLI router is not automatically covered. Second-ish occurrence of "feels like a handler, isn't one"; candidate convention note if it recurs.
- **Single-use Error subclass with no catch-side `instanceof` = A3.** First occurrence; candidate GOTCHAS/convention note on the second.
- **Exit-code taxonomy falls out of the pure/impure split** (parser owns argv-shape errors / exit 2; shell owns runtime preconditions / exit 1). First occurrence; reusable framing for the eventual CLI-conventions doc.

## Workflow notes

- Caminho-A pipeline (planner → brief-validator APPROVED 11/11 → executor) ran clean; validator did not need a re-run (no post-approval brief amendment this time).
- No `SendMessage` in the Code environment again (as 022/023): each Pause→go relaunched a fresh executor with explicit resume state. Cost is re-stated context per turn; no work lost.

## Pending — next actions (ordered)

1. **Next CLI thread:** the human-facing display layer (turns the minimal one-liners into real `fetch` / `status` output) — the named Phase 3 "CLI human-facing display" item, now unblocked by the on-ramp.
2. **Input-side FieldMapping** for `fetch` (per-project Jira customfields) — Phase 3 (023 D5); `fetch` currently uses `DEFAULT_FIELD_MAPPING` only.
3. **Phase 3 state design** — app owns production state over time (local); `derivePath` hierarchy rule still unresolved.
4. **Meta backlog carried:** AGENT_PLAYBOOK planner→validator→mentor gate meta brief (evidence now 019/020/021/023/026); the R6-handler-exception and A3-single-use-Error convention notes pending their second occurrence; Sheets push / XLSX parking lot (023 D6/D4).
