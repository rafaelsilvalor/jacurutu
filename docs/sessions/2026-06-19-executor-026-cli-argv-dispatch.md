# Session recap — 2026-06-19 — 026-cli-argv-dispatch

**Mode:** full pipeline (planner → brief-validator → executor), orchestrated
from Code with the user acting as mentor at each Pause.
**Executor:** Claude Code (this session), driving the three orchestration
subagents.
**Orchestrator:** mentor scope handoff pasted into Code (caminho-A scope
package with closed decisions D-a1–D-a6).
**Merged via:** PR #65, squash merge → `main@3004e69`.

## Context

Brief 026 is the **Phase 3 on-ramp**: it wires the already-shipped, test-only
composition functions `runFetch` (brief 022) and `runExport` (brief 023) into
real `saci fetch` / `saci export` commands. This is the deferred half of 023 D9
and the `MENTOR_BRIEF.md` §2 active-focus item #1. Before this brief, `cli.ts`
was still the Phase-1 stub (`parseArgs` + `--version` + a "No commands yet"
fallback line).

Scope was deliberately an **on-ramp**: parse argv, dispatch on the command,
construct the Jira gateway from environment variables, call the run\* function,
print one minimal result line. No rich human-facing display — that stays a
separate Phase 3 item. The `runFetch` / `runExport` signatures were frozen and
consumed verbatim; no `core` or adapter code was touched.

**Slot numbering (P4):** verified free across three sources before authoring —
`ls docs/tasks/` (highest was `025-docs-hygiene-reconciliation`), `git log
--oneline main` (newest merged was brief 025, #62–#64), and `CLAUDE.md` `E*`
block (stops at `E5`, which references slots 004–006 only). No conflict.

## Decisions realized

Decisions D-a1–D-a6 were closed in chat before delegation; the executor
implemented, did not revisit.

- **D-a1 — CLI lib: builtin `parseArgs` + manual switch.** Node's `node:util`
  `parseArgs` plus a manual `switch` over the command positional. No new
  runtime dependency (R2). Closes the 016 D4 defer.
- **D-a2 — command surface.** `saci fetch --jql <string> [--out <path>]`
  (default `--out` = `payload.json`); `saci export --payload <path> --config
  <path> --profile <name>` (output path comes from the resolved profile, not a
  flag); `saci --version` / `-v` unchanged; missing/unknown command → usage to
  stderr, exit 2.
- **D-a3 — credentials + JQL injected by the composition root.** `cli.ts`
  reads env (`SACI_JIRA_BASE_URL`, `SACI_JIRA_EMAIL`, `SACI_JIRA_API_TOKEN`),
  constructs the `JiraGateway`, and injects it via the `makeGateway` factory
  into `runFetch`. `mainJql` comes from `--jql` (never hardcoded).
  `fieldMapping` is omitted so the adapter's `DEFAULT_FIELD_MAPPING` applies
  (per-project FieldMapping is Phase 3, 023 D5).
- **D-a4 — errors / exit codes (R4).** Success 0; usage error 2; runtime /
  IO / network failure 1. All error messages to stderr. A throw from
  `runFetch` / `runExport` is caught at the top level and exits 1.
  **Boundary clarification implemented as written:** the pure parser is the
  only source of usage errors (exit 2 — argv-shape); a missing env credential
  is a runtime precondition reported by the shell → exit 1.
- **D-a5 — minimal output.** `fetch` → `wrote N issues to <path>`; `export` →
  `wrote <rowCount> rows to <outputPath> (<format>)`. No table/color/rich
  display.
- **D-a6 — test boundary.** A pure argv parser/router unit-tested with
  `node:test` (valid commands, missing flag, unknown command, `--version`).
  The thin shell is not network-tested; real-Jira smoke stays a throwaway
  script outside the repo. No network in any test.

## Micro-decisions ratified at the Pauses

**Pause 1 (plan approved with two riders):**
- (a) `DEFAULT_FIELD_MAPPING` **omitted** from the `JiraGatewayConfig` (key not
  passed) rather than imported and passed explicitly — the adapter's internal
  `?? DEFAULT_FIELD_MAPPING` default applies. Mentor confirmed: passing it
  would re-thread the adapter's own default through the composition root for no
  behavioral gain. The brief's "Suggested shape" import line was explicitly
  overridden.
- (b) Verb pre-flight pulled forward from Pause 3: `wire` confirmed present in
  the allowlist SSOT, so commit #3 kept the `wire` subject.

**Pause 2 (first file `argv.ts` — one mentor-required refactor):**
`parseArgv` came in at **70 lines**, over the R6 ≤50 budget, and did not fit
the R6 exception (the exception is for orchestration handlers that are *mostly
sequential calls*; this one inlined the `parseArgs` options block, a verbose
inline `values` type, and the routing switch). Mentor directed a
behavior-preserving split: hoist the options object to a module-level
`CLI_OPTIONS` constant (also satisfies R7) and extract the post-parse routing
into a pure `routeCommand(values, positionals)` helper. Result: `parseArgv` 20
lines, `routeCommand` 34 lines, both ≤ 50. Public surface unchanged.

**Pause 3 cli (one mentor-directed cleanup before commit #3):**
the shell had introduced a single-use `class UsageEnvError extends Error {}`
thrown on missing env. Mentor flagged it as **A3 (premature abstraction)** —
the name misleadingly implied the usage/exit-2 family while it deliberately
maps to `EXIT_RUNTIME` (1), and the top-level catch had no `instanceof`
discrimination, so the subclass earned nothing over `new Error(...)`. Dropped:
`throw new Error(...)` with the same env-naming message, behavior identical.

## Artifacts produced

- **Three commits on `feat/cli-argv-dispatch`** (2026-06-19):
  - `docs(tasks): add brief for 026-cli-argv-dispatch` (`e569d3b`, by @planner)
  - `feat(cli): add argv parser and router for fetch and export` (`c88578b`)
  - `feat(cli): wire fetch and export commands into cli entry` (`a6dcec1`)
- **`@saci/cli` additions:**
  - `argv.ts` (119) — the pure parser/router. Exports `DEFAULT_OUT`, `USAGE`,
    the `ParsedCommand` discriminated union (`version` / `fetch` / `export` /
    `usage`), and `parseArgv(argv)`. Calls `parseArgs` once with the
    module-level `CLI_OPTIONS` (R7); a `parseArgs` throw (unknown flag) is
    caught into a `usage` result (R4 — handled, not swallowed); `version` wins
    first; `routeCommand` does the command switch. Pure: no `process.env`,
    `process.exit`, `fs`, or `fetch`.
  - `argv.test.ts` (73) — 8 `node:test` cases on the public `parseArgv`: fetch
    with `--jql`; fetch with `--jql` + `--out` (default-vs-override); export
    with all three flags; missing required flag → usage; unknown command →
    usage; unknown flag → usage; `--version` → version; `-v` → version.
  - `cli.ts` (rewritten, ~104 lines) — the shell. R7 named constants
    (`ENV_BASE_URL` / `ENV_EMAIL` / `ENV_API_TOKEN`; `EXIT_OK` / `EXIT_RUNTIME`
    / `EXIT_USAGE`). `main()` resolves `version`/`usage` synchronously then runs
    `runCommand` inside a top-level try/catch → stderr + exit 1 (R4).
    `makeGatewayFactory(jql)` reads env, throws a plain `Error` naming the
    missing vars, returns the `MakeGateway` factory; `fieldMapping` omitted.
- **PR #65** — `feat(cli): wire fetch and export argv dispatch (026)`, filled
  per the template. Squash-merged → `main@3004e69`.
- **This recap** — `docs/sessions/2026-06-19-executor-026-cli-argv-dispatch.md`.

## Learnings

- **R6's orchestration-handler exception is narrow.** A CLI router *feels* like
  a top-level handler, but the exception is specifically for handlers that are
  *mostly sequential calls to other functions*. A function carrying inlined
  config + branching logic does not qualify, regardless of where it sits.
  Hoisting policy literals to a named constant (R7) and extracting the branch
  logic to a pure helper fixed both the size and the readability in one move.

- **A single-use Error subclass is abstraction without a caller (A3).** If the
  catch site does no `instanceof` discrimination, a custom error class is
  `new Error()` with a misleading name. The name `UsageEnvError` actively hurt
  — it implied exit 2 while the error mapped to exit 1.

- **Default-by-omission beats default-by-re-injection.** When an adapter already
  declares `config.x ?? DEFAULT_X`, the composition root should omit `x`, not
  import `DEFAULT_X` and pass it through. Passing it duplicates the default and
  couples the root to a symbol it does not meaningfully use.

- **Keep the usage-vs-runtime exit-code boundary on the purity seam.** Usage
  errors (exit 2) are argv-shape errors, and the *pure parser* is the only code
  that inspects argv — so it owns exit 2. Environment preconditions (missing
  credentials) are runtime failures the *shell* owns → exit 1. The exit-code
  taxonomy falls out of the pure/impure split cleanly.

- **No `SendMessage` in this environment (as in 022/023).** Each Pause→go cycle
  spawned a fresh executor seeded with explicit resume state (approved
  decisions re-stated, prior commits/files confirmed on disk). No work lost;
  cost is re-stated context per turn.

## Verification summary (brief 026 Edits 1–3)

- **All Pauses honored.** Pause 1 (`Plan required: yes`) — numbered plan + two
  riders (fieldMapping omission, verb pre-flight), explicit mentor go. Pause 2
  — fired after `argv.ts`; the R6 overage surfaced and was fixed under mentor
  direction before tests were written. Pause 3 ×2 — each commit gated on
  explicit mentor go; the cli go carried the `UsageEnvError` cleanup.
- **`pre-commit-self-audit`: 5/5 PASS** on both code commits. Subjects ≤ 72
  chars; verbs `add` and `wire` inside the allowlist SSOT; no co-author
  trailers.
- **Build + test:** `tsc -p packages/cli` exit 0 (strict, no `any`); `node
  --test` → **19 pass / 0 fail** (8 new argv cases + the existing suite).
- **Purity gate (D-a6):** `argv.ts` imports only `node:util`; no `process.env`
  / `process.exit` / `fs` / `fetch` call (the only textual matches are the
  invariant comment).
- **Boundary gate:** `git diff --name-only main..HEAD` = exactly the brief +
  `argv.ts` + `argv.test.ts` + `cli.ts`. No `core`, no adapter, no
  `run-fetch.ts` / `run-export.ts`, no `README.md`, no root `package.json`.
- **No push without instruction (R17)** — push and PR were explicit mentor
  verdicts after acceptance.

## Pending items

### Product line (Phase 3 CLI surface + state)

- **CLI human-facing display** — the on-ramp prints one minimal line per
  command; tables / richer status output is a separate, named Phase 3 item.
- **Input-side FieldMapping config for `fetch`** — per-project Jira customfields
  are Phase 3 (023 D5); `fetch` currently uses `DEFAULT_FIELD_MAPPING` only.
- **Phase 3 state design** — the app owns production state over time (local
  now); the `derivePath` hierarchy rule is the open design question.
- **Sheets one-way push / XLSX** — parking lot (023 D6 / D4), unchanged.

### Operational

- Post-merge: `main` fast-forwarded to `3004e69`. Local + remote
  `feat/cli-argv-dispatch` branch cleanup is the user's call.
- This recap + the mentor recap merge via a separate docs PR per convention;
  the §2 active-focus reconciliation rides the same PR.

## Next concrete action

`main@3004e69` carries the CLI on-ramp. Candidates for the next brief: the CLI
human-facing display layer (turns the minimal lines into real status output),
or opening the Phase 3 state design (the `derivePath` hierarchy rule remains
unresolved).

## Snippet for the next session

```
Olá. Modo: [continuar | modelar tarefa].

Continuação de 2026-06-19-executor-026-cli-argv-dispatch.
Brief 026 = on-ramp Phase 3: runFetch/runExport (test-only, briefs
022/023) ligados em comandos reais `saci fetch` / `saci export`.
Metade adiada da 023 D9 e item #1 do foco ativo (§2). Pipeline
completo caminho A (planner → validator APPROVED → executor),
3 commits em feat/cli-argv-dispatch, PR #65 squash → main@3004e69.

Entregue:
- @saci/cli: argv.ts (parser/router PURO — parseArgs node:util +
  CLI_OPTIONS const R7 + routeCommand; ParsedCommand union
  version/fetch/export/usage; throw de parseArgs → usage result R4),
  argv.test.ts (8 casos D-a6), cli.ts reescrito (shell: lê env
  SACI_JIRA_*, makeGatewayFactory, dispatch, try/catch top-level →
  stderr+exit 1)
- node --test 19 pass/0 fail; tsc strict; sem dependência nova (R2);
  core/adapters/run-*.ts INTOCADOS

Decisões realizadas (D-a1–D-a6, não reabrir): parseArgs builtin +
switch (D-a1); superfície fetch/export/--version (D-a2); credenciais
+ JQL injetados pelo cli, fieldMapping OMITIDO (default do adapter)
(D-a3); exit 0/2/1, env ausente = exit 1 no shell, usage = exit 2 no
parser (D-a4); saída mínima 1 linha (D-a5); parser puro testado, sem
rede (D-a6).

Correções nas Pausas: parseArgv 70→20 linhas (R6, split routeCommand
+ CLI_OPTIONS); classe UsageEnvError descartada (A3, sem instanceof,
nome enganoso → exit 1).

Aprendizados:
- exceção de R6 p/ handler é estreita: só p/ chamadas sequenciais
- subclasse de Error de uso único sem instanceof = A3
- default-por-omissão > re-injetar o default do adapter
- fronteira exit 2 (usage/argv, parser) vs exit 1 (runtime/env, shell)
  cai do split puro/impuro
- sem SendMessage: cada Pause→go relança executor fresco (igual
  022/023)

Pendências:
- display human-facing do CLI (Phase 3, item nomeado)
- FieldMapping input-side p/ fetch (Phase 3, 023 D5)
- design de estado Phase 3 (derivePath ainda em aberto)
- Sheets push / XLSX (parking lot, 023 D6/D4)

Antes de propor próximo passo, confirma quem entendeu que sou e
o modo da sessão.
```
