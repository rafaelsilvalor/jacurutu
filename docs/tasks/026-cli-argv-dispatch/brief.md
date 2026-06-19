# Brief: 026 — argv dispatch for @saci/cli (Phase 3 on-ramp)

> **Category:** M
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `feat/cli-argv-dispatch`

---

## Context

Briefs 022 and 023 shipped the two composition functions — `runFetch`
(`packages/cli/src/run-fetch.ts`) and `runExport`
(`packages/cli/src/run-export.ts`) — as standalone, fixture-tested units, and
explicitly deferred the argv/command wiring (023 D9). `cli.ts` is still the
Phase-1 stub: `parseArgs` + `--version` + a "No commands yet" fallback line.

This brief is the deferred half of 023 D9 and the `MENTOR_BRIEF.md` §2 active
focus item. It wires the already-shipped `runFetch` / `runExport` into real
`saci fetch` / `saci export` commands. It is an **on-ramp**: parse argv,
dispatch on the command, construct the Jira gateway from environment variables,
call the run\* function, print one minimal result line. No rich, human-facing
display — that is a separate Phase 3 "CLI human-facing display" item.

The `runFetch` / `runExport` signatures are frozen and consumed verbatim
(grounding below); this brief does not modify them or any `core` / adapter code.

## Goal

Wire `runFetch` and `runExport` into `saci fetch` and `saci export` commands in
`packages/cli/src/cli.ts`, behind a new **pure** argv parser/router module in
`packages/cli/src/` (unit-tested with `node:test`). The CLI reads credentials
from the environment, constructs the `JiraGateway`, dispatches by command,
calls the run\* function, prints a minimal result line, and sets correct exit
codes.

Out of scope — touching any of these → **STOP and surface**:

- `packages/core/**`, `packages/adapter-jira/**`, `packages/adapter-sheets/**`
  — read for grounding only; never modified.
- `run-fetch.ts` / `run-export.ts` internals — their signatures are frozen and
  consumed as-is (D-a/grounding).
- Input-side per-project Jira **FieldMapping** config — Phase 3 (023 D5).
  `fieldMapping` defaults to `DEFAULT_FIELD_MAPPING`.
- Rich / human-facing display — tables, color, summaries. On-ramp prints one
  line per command (D-a5).
- `README.md` and root `package.json` — left untouched.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/026-cli-argv-dispatch/brief.md` (this brief; commit #1)
   - `packages/cli/src/cli.ts`
   - a new pure argv-parser module in `packages/cli/src/` + its colocated
     `*.test.ts`

   Any write outside `packages/cli/src/` and `docs/tasks/026-*/` → **STOP and
   surface**. Any edit to `core`, an adapter, or to `run-fetch.ts` /
   `run-export.ts` → **STOP** (Judgment Flag 1).
2. Follow all rules in `CLAUDE.md` — especially R4 (no silent catch), R7 (named
   constants for policy values: env var names, exit codes, default out path),
   R20 (strict TS), R21 (ESM, `.js` import extensions), R22 (`tsc` per package,
   no bundler), R23 (`node:test`, colocated `*.test.ts`), R24 (no `any`), R25
   (hexagonal: `cli` is the composition root; it wires the adapter into the
   run\* functions — the adapter is imported only here, never in `core`).
3. **No new runtime dependency (R2, D-a1).** The argv layer is Node's builtin
   `parseArgs` (`node:util`) + a manual `switch`. No `commander`, `yargs`,
   `minimist`, or similar. Adding one → **STOP**.
4. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `feat/cli-argv-dispatch`
   - Conventional Commits (G-R3); verb allowlist SSOT
     (`.claude/skills/pre-commit-self-audit/SKILL.md`)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5 / R17)
5. **No hardcoded JQL or instance domain (D-a3).** `mainJql` comes from
   `--jql`; `baseUrl` / `email` / `apiToken` come from env. No instance literal
   anywhere in `packages/cli/src/` — same principle that keeps `customfield_*`
   ids out of source.
6. **No network in any test (D-a6).** The pure parser/router is unit-tested
   with no I/O; the thin shell (read env + construct gateway + call run\*) is
   not network-tested. Real-Jira smoke stays a throwaway script outside the
   repo (the 023 expectation).

### Conventions

- Language: agent-consumed surface is English-only (R9) — identifiers,
  comments, the brief, commit subjects, the usage string, all
  `console`/stderr messages (R9 lists log/console messages as agent-consumed).
- Commit type `feat`; scope `cli`.
- Comments answer "why", not "what" (R8). Named constants for policy values
  (R7): env var names, exit codes, the default `--out` path.
- The argv parser/router is **pure** (no I/O, no `process.env`, no `process.exit`,
  no `fs`): it maps `argv: string[]` to a result value. All I/O and process
  control live in `cli.ts` (the shell). This is what makes the parser
  unit-testable (D-a6).

### Architectural decisions already made (do not revisit)

Closed with the mentor in chat. The executor implements; it does not propose
alternatives. If a decision needs to change mid-execution, **STOP and report**.

#### D-a1 — CLI lib: builtin `parseArgs` + manual `switch`

The argv layer uses Node's builtin `parseArgs` (`node:util`) plus a manual
`switch` over the command positional. No new runtime dependency (R2). This
closes the 016 D4 defer.

#### D-a2 — Command surface

- `saci fetch --jql <string> [--out <path>]` — default `--out` is `payload.json`
  in the current working directory.
- `saci export --payload <path> --config <path> --profile <name>` — the output
  path comes from the resolved profile (`runExport` returns it), NOT a flag.
- `saci --version` / `saci -v` — keep the existing behavior unchanged (print the
  `@saci/cli` package version, exit 0).
- Missing or unknown command, or a missing required flag → print usage to
  **stderr**, exit **2**.

#### D-a3 — Credentials + JQL injected by the composition root

`cli.ts` (the composition root) reads the environment, constructs the
`JiraGateway`, and injects it via a `makeGateway` factory into `runFetch`.

- Env vars: `SACI_JIRA_BASE_URL`, `SACI_JIRA_EMAIL`, `SACI_JIRA_API_TOKEN`.
- `mainJql` comes from `--jql` (never hardcode an instance JQL).
- `fieldMapping` = `DEFAULT_FIELD_MAPPING` (exported by `adapter-jira`) — i.e.
  omitted from the config so the gateway's default applies. FieldMapping config
  is out of scope (Phase 3, 023 D5).
- The `makeGateway` factory has the shape `MakeGateway` from `run-fetch.ts`:
  `(dropLog, warningLog) => JiraGateway`. The factory closes over the env
  credentials and the `--jql` string and passes the two sinks straight through
  to the `JiraGatewayConfig`.
- Any missing env credential: error to **stderr**, non-zero exit (see D-a4).

#### D-a4 — Errors / exit codes (R4 — no silent catch)

- Success → exit **0**.
- Usage error (missing/unknown command, missing required flag, unknown flag)
  → exit **2**.
- Runtime / IO / network failure → exit **1**.
- All error messages go to **stderr**.
- A throw from `runFetch` / `runExport` is caught at the top level of `cli.ts`,
  printed to stderr, exit **1**.

Boundary clarification (planner, within D-a4's taxonomy — not a new decision):
the pure parser is the **only** source of usage errors (exit 2), because usage
errors are argv-shape errors and the parser is the only code that inspects
argv. A **missing env credential** is an environment/runtime precondition, not
an argv-shape error, so it is reported by the shell and maps to exit **1**
(the "runtime / IO" bucket), consistent with D-a3's "non-zero exit".

#### D-a5 — Minimal output (on-ramp)

- `fetch` → `wrote N issues to <path>` where `N` is the count of issues in the
  returned payload (`payload.issues.length`) and `<path>` is the resolved out
  path. Printed to **stdout**.
- `export` → `wrote <rowCount> rows to <outputPath> (<format>)` from the
  `ExportRunResult` returned by `runExport`. Printed to **stdout**.
- No table, color, or rich display — that is the separate Phase 3 "CLI
  human-facing display" item.

#### D-a6 — Test boundary

Extract a **pure** argv parser/router function and unit-test it with
`node:test`. Required cases: each valid command (`fetch` with `--jql`,
`fetch` with `--jql` + `--out`, `export` with all three flags), a missing
required flag, an unknown command, and `--version` (both `--version` and `-v`).
The thin shell (read env + construct gateway + call run\*) is not
network-tested. No network in any test.

## Suggested implementation shape (executor confirms exact layout at Pause 1)

Closed decisions D-a1..D-a6 fix the behavior; the module name and exact symbol
layout are the executor's to confirm at Pause 1. A concrete suggestion that
satisfies every decision:

- New module `packages/cli/src/argv.ts` exporting:
  - A discriminated union `ParsedCommand`, e.g.
    - `{ kind: "version" }`
    - `{ kind: "fetch"; jql: string; out: string }`
    - `{ kind: "export"; payload: string; config: string; profile: string }`
    - `{ kind: "usage"; message: string }`
  - A pure `parseArgv(argv: string[]): ParsedCommand`. It calls `parseArgs`
    once with `allowPositionals: true` and the union of option flags
    (`jql`, `out`, `payload`, `config`, `profile` as `string`; `version` as
    `boolean`, short `v`). A `parseArgs` throw (e.g. an unknown flag) is caught
    and mapped to a `usage` result carrying the message — never rethrown
    (R4: the catch produces a handled result, not a silent swallow). `version`
    wins first; then the command positional is switched: `fetch` requires
    `jql` and defaults `out` to `DEFAULT_OUT`; `export` requires `payload`,
    `config`, and `profile`; anything else (including no command) → `usage`.
  - `DEFAULT_OUT = "payload.json"` and the usage string live in this module
    (the parser owns argv defaults and the usage text).
  - On-ramp tolerance: with a single union of options, a flag irrelevant to
    the chosen command (e.g. `--jql` passed to `export`) is accepted and
    ignored. Cross-command flag strictness is out of scope for the on-ramp;
    do not add per-command option schemas.
- `packages/cli/src/argv.test.ts` — the `node:test` suite for D-a6.
- `packages/cli/src/cli.ts` (the shell) imports `parseArgv` from `./argv.js`,
  `pkg` for the version string, `runFetch` + `MakeGateway` from `./run-fetch.js`,
  `runExport` from `./run-export.js`, and `JiraGateway` + `DEFAULT_FIELD_MAPPING`
  from `@saci/adapter-jira`. It:
  - declares the env var names and exit codes as named constants (R7);
  - calls `parseArgv(process.argv.slice(2))` and switches on `kind`;
  - `version` → write `pkg.version`, exit 0;
  - `usage` → write the message to stderr, exit 2;
  - `fetch` → read the three env vars; if any is missing, write an error to
    stderr and exit 1; build the `makeGateway` factory closing over the
    credentials + `--jql`; `await runFetch(makeGateway, out)`; write
    `wrote N issues to <out>`; exit 0;
  - `export` → `await runExport(payload, config, profile)`; write
    `wrote <rowCount> rows to <outputPath> (<format>)`; exit 0;
  - wraps the `fetch` / `export` execution in a top-level `try/catch` that
    prints to stderr and exits 1 on any throw (D-a4, R4).

## Grounding (signatures already verified — consume, do not modify)

- `packages/cli/src/run-fetch.ts`:
  `runFetch(makeGateway: MakeGateway, outputPath: string, now?: Date): Promise<Payload>`;
  `type MakeGateway = (dropLog: IssueDropLog, warningLog: IssueWarningLog) => JiraGateway`.
  The returned `Payload` carries `issues` (use `.length` for `N`).
- `packages/cli/src/run-export.ts`:
  `runExport(payloadPath: string, configPath: string, profileName: string): Promise<ExportRunResult>`
  where `ExportRunResult = { outputPath: string; format: "csv" | "json"; rowCount: number }`.
- `packages/adapter-jira/src/gateway.ts`:
  `JiraGatewayConfig { baseUrl, email, apiToken, mainJql, fieldMapping?, maxResults?, dropLog?, warningLog?, fetchImpl? }`;
  `class JiraGateway implements JiraGateway` (the `core` port). `fetchImpl`
  defaults to the global `fetch`; `fieldMapping` defaults to
  `DEFAULT_FIELD_MAPPING`. `DEFAULT_FIELD_MAPPING` is exported by the adapter.
- `packages/cli/src/cli.ts`: current Phase-1 entry — `parseArgs` + `--version`
  print + the "No commands yet" fallback line, which this brief replaces with
  the dispatch + usage message.

## Done criteria

### Edit 1 — Verify brief on disk (committed by @planner)

This brief was authored and committed by @planner on `feat/cli-argv-dispatch`
(caminho A, commit #1). The executor only verifies it is present; it does NOT
re-commit it.

P4 numbering evidence (recorded; three sources agree slot 026 is free):

- `ls docs/tasks/` — highest existing slot is `025-docs-hygiene-reconciliation`.
- `git log --oneline main` — most recent merged work is brief 025 (`#62`–`#64`);
  no merged-but-invisible brief shipped a higher slot.
- `CLAUDE.md` `E*` block — exceptions stop at `E5`; `E5` references slots
  004-006 only; no nominal reservation of 026.

- [ ] Directory `docs/tasks/026-cli-argv-dispatch/` exists
- [ ] File `docs/tasks/026-cli-argv-dispatch/brief.md` exists; first line
      matches the title above
- [ ] The brief is already committed by @planner (do NOT re-commit)

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

### Edit 2 — Add the pure argv parser/router module + its test

Create the pure parser/router module (suggested `packages/cli/src/argv.ts`;
exact layout confirmed at Pause 1) and its colocated `*.test.ts`, per D-a1,
D-a2, D-a4 (usage cases), D-a6, and the "Suggested implementation shape"
section. The module is pure: no `process.env`, no `process.exit`, no `fs`, no
network.

Verification:

- [ ] New module exists in `packages/cli/src/`; `tsc -p packages/cli` passes
      (R20-R24)
- [ ] Colocated `*.test.ts` covers: `fetch` with `--jql`; `fetch` with `--jql`
      + `--out`; `export` with all three flags; a missing required flag; an
      unknown command; `--version` and `-v`
- [ ] `node --test` suite passes for `packages/cli` (R23)
- [ ] The module imports no I/O / process / fs / network primitive
      (`process.env`, `process.exit`, `node:fs`, `fetch` absent from the
      parser module)
- [ ] No new runtime dependency added (R2); `package.json` files unchanged

Commit: `feat(cli): add argv parser and router for fetch and export`

### Edit 3 — Wire fetch and export commands into the CLI entry

Modify `packages/cli/src/cli.ts` to consume the parser, dispatch by command,
construct the gateway from env, call `runFetch` / `runExport`, print the
minimal result line, and set exit codes, per D-a3, D-a4, D-a5, and the
"Suggested implementation shape" section. Named constants (R7) for the env var
names, exit codes, and (if not already owned by the parser module) any policy
literal. The `--version` path keeps its existing output (D-a2).

Verification:

- [ ] `packages/cli/src/cli.ts` consumes the parser module; `tsc -p packages/cli`
      passes
- [ ] `saci --version` and `saci -v` still print the package version (D-a2)
- [ ] Missing/unknown command and missing required flag print usage to stderr
      and would exit 2 (verifiable by running the built `cli.js`, or by reading
      the dispatch — no network needed)
- [ ] Missing env credential on `fetch` prints an error to stderr and exits 1
      (D-a3 / D-a4)
- [ ] Env var names, exit codes, and the default out path are named constants
      (R7)
- [ ] No silent `catch` — the top-level handler logs to stderr and exits 1
      (R4)
- [ ] `grep -rn 'atlassian' packages/cli/src/cli.ts` returns no matches — no
      hardcoded instance domain (D-a3)

Commit: `feat(cli): wire fetch and export commands into cli entry`

### Automated checks (run before each commit)

- [ ] `tsc -p packages/cli` passes without errors
- [ ] `node --test` suite passes for `packages/cli`

### Structural checks

- [ ] Expected files exist at expected paths
- [ ] No file outside the in-scope list was modified
      (`git diff --name-only main..HEAD` ⊆ in-scope list)
- [ ] `packages/core/**`, `packages/adapter-jira/**`,
      `packages/adapter-sheets/**` absent from the diff
- [ ] `run-fetch.ts` / `run-export.ts` absent from the diff
- [ ] `README.md` and root `package.json` absent from the diff

### Behavior checks

- [ ] `parseArgv` returns a `fetch` result with the parsed `jql` and the
      default out (`payload.json`) when `--out` is omitted
- [ ] `parseArgv` returns an `export` result with all three flags parsed
- [ ] `parseArgv` returns a `usage` result for a missing required flag, an
      unknown command, and an unknown flag
- [ ] `parseArgv` returns a `version` result for `--version` and `-v`
- [ ] The shell maps `usage` → stderr + exit 2, `version` → stdout + exit 0,
      a run\* throw → stderr + exit 1, a missing env credential → stderr +
      exit 1

### Git checks

- [ ] Branch used: `feat/cli-argv-dispatch`
- [ ] Commits follow Conventional Commits (G-R3); subjects ≤ 72 chars
- [ ] Commit verbs are in the allowlist SSOT (`add`, `wire`)
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] `Plan required: yes` — numbered plan presented and approved before any
      change (Pause 1)
- [ ] Pause 2 — first modified file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message shown
      before each commit
- [ ] `pre-commit-self-audit` output reported in chat before each Pause 3
- [ ] Any unmet criterion reported explicitly

## Pause points

Pauses are named in English on the agent-consumed surface (R9).

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code):** present a numbered plan and wait for approval.
  **Required** (`Plan required: yes` — new module name + function signatures
  are the executor's to confirm).
- **Pause 2 (after the first modified file):** show the result and wait for
  review. **Always required.**
- **Pause 3 (before each commit):** show `git status` + `git diff --stat` +
  proposed message + `pre-commit-self-audit` output. **Always required.**

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md` as a
  follow-up brief.
- Judgment Flag 1 (out-of-scope edit: `core`, an adapter, or `run-*.ts`
  internals) hit → **STOP and surface**.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: yes`:

- The task introduces a new module (the pure parser/router) — its exact name,
  the `ParsedCommand` union shape, and the `parseArgv` signature are the
  executor's to confirm at Pause 1.
- It spans 2+ files (`cli.ts` + the new module + its test) and likely ≥ 50
  lines (R15), so a numbered plan precedes any edit.
- Decisions D-a1..D-a6 are closed, but the *how* (module split, where the
  named constants live, the test fixture shape) benefits from review before
  coding.

**Pause 2 and Pause 3 remain required** regardless — Lesson #6 of
`docs/AGENT_PLAYBOOK.md`.

## Git workflow

### Branch

`feat/cli-argv-dispatch` — branched from up-to-date `main`. No push (G-R5 / R17).

### Commit sequence

Already on the branch (caminho A; planner-authored — executor does NOT
re-commit):

1. `docs(tasks): add brief for 026-cli-argv-dispatch`

Executor-authored:

2. `feat(cli): add argv parser and router for fetch and export`
3. `feat(cli): wire fetch and export commands into cli entry`

Each subject is ≤ 72 chars (verified) and leads with an allowlisted verb
(`add`, `wire`).

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules (R2, R4, R7, R20-R25 especially)
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — known traps
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
5. `.claude/skills/brief-template/SKILL.md` — template reference
6. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit + verb
   allowlist SSOT (Pause 3)
7. `packages/cli/src/run-fetch.ts` — `runFetch` / `MakeGateway` (consumed as-is)
8. `packages/cli/src/run-export.ts` — `runExport` / `ExportRunResult`
   (consumed as-is)
9. `packages/adapter-jira/src/gateway.ts` — `JiraGatewayConfig`, `JiraGateway`,
   `DEFAULT_FIELD_MAPPING`
10. `packages/cli/src/cli.ts` — the Phase-1 entry this brief replaces

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat main..HEAD` (line counts per file)
3. Any verification checkbox that could not be met, with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step (open PR for mentor review, follow-up brief, etc.)
