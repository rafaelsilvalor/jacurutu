# Session recap — 2026-06-09 — 022-coordination-envelope

**Mode:** modeling + full pipeline (planner → brief-validator → executor),
orchestrated from Code.
**Executor:** Claude Code (this session), driving the three orchestration
subagents.
**Orchestrator:** mentor scope handoff pasted into Code (the caminho-A scope
package with decisions D1–D4 and three judgment flags).
**Merged via:** PR #52, fast-forward merge → `main@68559c9`.

## Context

Brief 022 closes the envelope half deferred by brief 020 (that brief's D3). 019
ported the shape-independent domain into `@saci/core` and defined the
payload-v2.0 types; 020 implemented `JiraGateway.fetchIssues(): Promise<Issue[]>`
behavior-preserving against the frozen seed, but deliberately deferred the
envelope — `fetchIssues` returns `Issue[]` while the seed's drop and
partial-failure decisions are **computed and logged** through injected sinks
rather than serialized.

022 serializes that envelope: a pure `assemblePayload` in core assembles the
full `Payload` (already typed in `core/payload.ts`) from the issues plus the
captured drops/warnings, stamps `run_date` / `generated_at`, and the
composition root writes `payload.json` to disk. No Sheet, no Drive, no path
derivation.

This was the **first task this session run through the full pipeline as an
app-code brief (caminho A)** — distinct from the pipeline/skill briefs (021)
authored via caminho B. The mentor handed a scope package, not a brief; the
planner authored `brief.md` from it.

## Decisions realized

Decisions D1–D4 were closed in the mentor scope package; the executor
implemented, did not revisit.

- **D1 — port not reopened; envelope assembled outside the gateway.**
  `JiraGateway.fetchIssues` stays frozen as in 020. The adapter's injected
  sinks map one-to-one onto the core envelope types: `IssueDropLog (key,
  reason)` → `FilteredOut { key, reason }`; `IssueWarningLog (key, field,
  cause)` → `PayloadWarning { key, field, issue }`. **The warning sink's third
  param is named `cause` in `mapper.ts` while the serialized JSON key is
  `issue`** — the `cause → issue` mapping is deliberate and seed-faithful, NOT a
  deviation. The composition root wires *capturing* sinks (push into arrays)
  instead of the default console-logging sinks.

- **D2 — pure assembler in core (additive, not a port change).**
  `assemblePayload(issues, filteredOut, warnings, meta): Payload` is pure, no
  I/O, in a NEW file `core/src/assemble.ts`. The 020/D2 "core edit is a separate
  decision" landmine was correctly scoped by the planner to "no change to
  existing gateway port signatures" — adding a new pure function to core is
  ordinary additive work (019 did exactly that). `payload.ts` is untouched; the
  types are reused, not redefined.

- **D3 — Sheet write OUT (→ brief 023).** 022 writes `payload.json` to disk
  only. The `adapter-sheets` package implementing `SheetGateway` is reserved as
  the next brief.

- **D4 — frozen v2.0, behavior-preserving.** Mirrors `automation/payload.json`
  exactly: top-level key order `schema_version, run_date, generated_at, issues,
  filtered_out, warnings`; `schema_version` `"2.0"`; `run_date` `YYYY-MM-DD`;
  `generated_at` ISO-8601 with explicit offset; `entrega_iso` / `copy_url` the
  only bare nullables; serialize with indent=2 and the `ensure_ascii=False`
  equivalent (`JSON.stringify(payload, null, 2)`), **no trailing newline**.

## Pending items

### High-priority — next brief

- **Brief 023 — `adapter-sheets` + `SheetGateway`** (the deferred Sheet write,
  D3). A full new-package effort on the scale of 020. The forward reserve was
  declared in the 022 scope package's P4.

### Deferred — explicitly out of scope for 022

- **`derivePath`** — a production-mode `[prod]` core function whose Drive
  hierarchy rule is an open Phase-3 design item in `docs/ROADMAP.md`. The
  carried shorthand "envelope + derivePath" did not match disk; the seed
  coordination pipeline never derives a Drive path. Not part of a coordination
  brief.
- **`parent_summary` population** — stays behavior-preserving (`""`); the
  JQL-search endpoint omits the inline parent summary. Carried from 020 as a
  separate docs/parking-lot item.
- **`cli.ts` argv dispatch wiring** — `runFetch` is the exercisable/testable
  composition function; wiring it into the CLI entrypoint (argv + credentials)
  was intentionally left out (no command surface exists yet). The mentor's bare
  "go" at Pause 1 ratified leaving `cli.ts` untouched.

### Operational — pending before next session

- **PR #52 fast-forward-merged → `main@68559c9`.** Post-merge cleanup done this
  session: branch deleted, stale remote refs pruned.
- **This recap** merged via a separate docs PR per project convention.

## Artifacts produced

- **Four commits on `feat/coordination-envelope`** (all 2026-06-09):
  - `docs(tasks): add brief for 022-coordination-envelope` (`3ab1fc6`, by @planner)
  - `feat(core): add assemblePayload envelope assembler` (`771d121`)
  - `test(core): add assemblePayload coverage vs frozen payload` (`ca27836`)
  - `feat(cli): wire envelope capture and write payload.json` (`e6df32e`)
- **`@saci/core` additions:**
  - `assemble.ts` (43) — `assemblePayload` + `SCHEMA_VERSION` + the named
    `PayloadMeta` interface (ratified at Pause 2 over the inline-literal D2
    signature; identical param shape, R7-style clarity). Pure; imports types
    from `./payload.js`; redefines nothing.
  - `assemble.test.ts` (112) — asserts the assembled `Payload` against the
    frozen `automation/payload.json`: full `deepStrictEqual`, top-level key
    order via `Object.keys`, and the `entrega_iso` / `copy_url` nullables
    grounded in both polarities (`MCA-62838` null `copy_url`, `MCA-62539` null
    `entrega_iso`, `MC-1049974` both populated).
  - `index.ts` (+4) — re-exports `assemblePayload` / `SCHEMA_VERSION` as values,
    `PayloadMeta` as a type, mirroring the package's value/type split.
- **`@saci/cli` additions:**
  - `run-fetch.ts` (113) — composition root `runFetch(makeGateway, outputPath,
    now?)`: capturing sinks, `cause → issue` mapping, `stampMeta(now)` deriving
    both timestamps from a single injected clock, `JSON.stringify(..., 2)` write
    with no trailing newline. No credential/path hardcoding (R1).
  - `run-fetch.test.ts` (108) — end-to-end with a fake gateway + fixed injected
    clock + temp output path: timestamp derivation (offset, not UTC `Z`),
    serialized-output fidelity (indent=2, non-ASCII preserved, key order on
    read-back, no trailing newline), and the `cause → warnings[].issue` path.
- **PR #52** — `feat(core,cli): serialize coordination payload envelope (022)`,
  filled per the template. Fast-forward merged → `main@68559c9`.
- **This recap** —
  `docs/sessions/2026-06-09-executor-022-coordination-envelope.md`.

## Learnings

- **The 020/D2 "no core edit" landmine was disarmed at authoring time, not
  execution.** A blanket "no `packages/core` change" STOP guard (carried from
  020) would have wrongly blocked this brief. The mentor's judgment flag scoped
  the core guard to "no change to existing gateway port signatures" — adding
  `assemblePayload` is permitted; changing a port signature is a STOP. Captured
  as a guard in the brief, so the executor never hit a false STOP.

- **`generated_at` needs an explicit offset — `toISOString()` is UTC-only.**
  The seed's `now.isoformat(timespec="seconds")` carries the local offset (e.g.
  `-03:00`); JS `Date.toISOString()` emits UTC `Z`. The composition root formats
  the offset from `-getTimezoneOffset()` (sign inverted). The injected clock
  makes this deterministically testable.

- **Byte-fidelity is in the serialization, not just the object.** The frozen
  `payload.json` has no trailing newline and serializes non-ASCII literally
  (`ensure_ascii=False`). `assemble.test.ts` proves the in-memory key order;
  `run-fetch.test.ts` proves it survives `JSON.stringify` + read-back, plus the
  no-newline and non-ASCII guarantees — key order asserted on the *serialized*
  output, not only the object.

- **A scope handoff package (`SCOPE.md`) is not a repo artifact.** It seeds the
  planner, then is deleted before execution — the scope record lives in the
  brief's "decisions already made" section + this recap. Committing it would
  mint an off-convention precedent (neither `brief-template` nor `AGENT_PLAYBOOK`
  defines `SCOPE.md`). The tree was cleaned by deletion, not by commit.

- **Pause discipline held end-to-end — dogfooding brief 021.** Every Pause was
  satisfied only by an explicit mentor chat go relayed through the orchestrator,
  never by host tool-permission approvals — the exact doctrine 021 installed.
  Pause 1 (plan + the `cli.ts` open question), Pause 2 (`assemble.ts` + the
  `PayloadMeta` refinement surfaced), and each of the four Pause 3s were gated
  individually, one commit at a time.

## Incidents recovered

- **No `SendMessage` to continue subagents.** The orchestrator could not
  continue a paused executor with its context intact, so each Pause→go cycle
  spawned a *fresh* executor seeded with an explicit resume state (approved
  decisions re-stated, prior files confirmed on disk). No work lost; each resume
  re-read the brief and the on-disk artifacts. Cost: re-stated context per turn.

## Verification summary (brief 022 Edits 1–4)

- **All Pauses honored.** Pause 1 (`Plan required: yes`) — plan presented
  (core-vs-cli placement, factory-injected gateway, injected clock, no-newline
  decision), `cli.ts`-untouched default ratified by the mentor's go. Pause 2 —
  fired after the first modified file (`assemble.ts`); the `PayloadMeta` naming
  refinement surfaced and ratified. Pause 3 — gated each of the four commits on
  explicit mentor go.
- **`pre-commit-self-audit`: all PASS** on every commit (5 checks each), 0
  WARN/FAIL. Subjects ≤ 72 chars; verbs `add` ×2, `wire`, plus the brief `add`
  — all inside the allowlist SSOT (the planner substituted `cover` → `add` for
  the test commit at authoring time).
- **Build + test:** `tsc -p` per package green (strict, no `any`, no
  `@ts-ignore`); `npm test` → **96 pass / 0 fail** across the touched packages.
- **D2 test gate (mentor-required):** the `assemblePayload` `node:test` against
  the frozen `automation/payload.json` is present (Edit 3) and asserts top-level
  key order + the `entrega_iso` / `copy_url` nullables — not cut.
- **Scope clean:** `git diff --name-only origin/main..HEAD` showed only the
  brief + the 5 source files. No `cli.ts`, no `payload.ts`, no `dist/`, no
  `SCOPE.md`, no out-of-scope file.
- **R25:** `grep -rn 'from.*adapter' packages/core/` → no matches; core
  untouched by adapters, port signatures unchanged.
- **R1:** no hardcoded platform path; output path injected.
- **No committed credential; no co-author trailer; no `--no-verify`** — the
  pre-commit hook ran on every commit.

## Next concrete action

`main@68559c9` carries the serialized envelope. The reserved follow-up is
**brief 023 — `adapter-sheets` + `SheetGateway`** (the deferred Sheet write,
D3), a new-package effort on the scale of 020. `derivePath` remains a Phase-3
`[prod]` design item, not a coordination concern.

## Snippet for the next session

```
Olá. Modo: [continuar | modelar tarefa].

Continuação de 2026-06-09-executor-022-coordination-envelope.
Brief 022 = serialização do envelope de coordenação — fecha a metade
adiada por 020 (D3). Pipeline completo caminho A (planner →
brief-validator → executor), 4 commits em feat/coordination-envelope,
PR #52 fast-forward → main@68559c9.

Entregue:
- @saci/core: assemble.ts (assemblePayload + SCHEMA_VERSION +
  PayloadMeta), assemble.test.ts (deepStrictEqual vs payload.json
  congelado + key order + nullables), index.ts (re-export)
- @saci/cli: run-fetch.ts (composition root: sinks capturadores,
  cause→issue, clock injetado, JSON.stringify indent=2 sem newline),
  run-fetch.test.ts (timestamps com offset, fidelidade serializada,
  caminho cause→warnings[].issue fim-a-fim)
- npm test 96 pass/0 fail; tsc strict; cli.ts INTOCADO

Decisões realizadas (D1–D4, não reabrir):
- D1: port 020 intocado; envelope montado FORA do gateway; sinks 1-a-1
  (cause→PayloadWarning.issue deliberado, casa com o seed)
- D2: assemblePayload puro em core (additivo, NÃO mexe em port
  signature — landmine do 020/D2 desarmada no authoring)
- D3: Sheet write FORA → brief 023 (adapter-sheets + SheetGateway)
- D4: v2.0 congelado byte-a-byte (key order, indent=2,
  ensure_ascii=False equiv, sem trailing newline, generated_at com
  offset explícito — toISOString() é UTC-only)

Aprendizados:
- generated_at precisa de offset explícito (getTimezoneOffset invertido)
- fidelidade é na serialização: key order assertada na saída escrita,
  não só no objeto
- SCOPE.md não é artefato de repo (apaga antes da execução; registro
  mora no brief + recap)
- sem SendMessage, cada Pause→go relançou executor fresco com estado de
  retomada explícito

Pendências:
- brief 023: adapter-sheets + SheetGateway (Sheet write, D3)
- derivePath (Phase-3 [prod], item aberto no ROADMAP)
- parent_summary "" behavior-preserving (parking lot, de 020)
- pós-merge feito: branch deletada, refs podadas; recap em docs PR

Antes de propor próximo passo, confirma quem entendeu que sou e
o modo da sessão.
```
