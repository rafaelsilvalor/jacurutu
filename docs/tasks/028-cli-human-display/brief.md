# Brief: 028 — CLI human-facing display layer for @saci/cli

> **Category:** M
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `feat/cli-human-display`

---

## Context

Brief 026 wired `runFetch` / `runExport`
(`packages/cli/src/run-fetch.ts`, `packages/cli/src/run-export.ts`) into the
`saci fetch` / `saci export` commands behind the pure argv parser
(`packages/cli/src/argv.ts`). Per 026 D-a5 (the on-ramp decision), each command
prints one minimal result line — `wrote N issues to <path>` /
`wrote <rowCount> rows to <outputPath> (<format>)`. That on-ramp explicitly
deferred rich, human-facing display to "a separate Phase 3 CLI human-facing
display item" — which is this brief.

The user base is the non-technical Estratégia design team. The fetch result
line tells them a number but nothing about *what* was pulled. This task turns
the bare lines into a readable status surface a designer can act on: a per-issue
listing for `fetch`, a clearer export confirmation, and explicit handling for
empty results and partial-extraction warnings.

This is a **rendering layer**: it consumes the values `runFetch` / `runExport`
already return. It does not change the fetch contract, the payload data model,
the adapters, or `core`.

## Goal

Add a pure, unit-tested display/formatting module in `packages/cli/src/` and
wire it into `packages/cli/src/cli.ts` so that `saci fetch` and `saci export`
render readable, human-facing status output — a per-issue listing plus a
summary for `fetch`, a clearer confirmation for `export`, and explicit
empty-result and warning handling — without changing what `runFetch` /
`runExport` return.

Out of scope — touching any of these → **STOP and surface**:

- `packages/core/**`, `packages/adapter-jira/**`, `packages/adapter-sheets/**`
  — read for grounding only; never modified (D1).
- `packages/cli/src/run-fetch.ts` / `packages/cli/src/run-export.ts` internals
  — signatures frozen; consumed verbatim (D1). Read for grounding only.
- `packages/cli/src/argv.ts` (and `argv.test.ts`) — the parser/router is frozen
  by 026. **Do not add a display flag** (`--json`, `--no-color`, `--verbose`,
  `--quiet`, etc.) by editing `argv.ts`. If a display flag is genuinely needed,
  **STOP and raise it in chat for the mentor gate to decide** (Judgment Flag 1);
  do not edit `argv.ts` unilaterally.
- Input-side per-project Jira **FieldMapping** config — Phase 3 (023 D5);
  the next task, not this one. Rendering is field-agnostic (D2) precisely so it
  survives that change without rework.
- Any new runtime dependency (table libraries, color libraries) — R2 / D4.
- `README.md` and root `package.json` — left untouched.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/028-cli-human-display/brief.md` (this brief; commit #1,
     authored by @planner)
   - a new pure display/formatting module in `packages/cli/src/` + its
     colocated `*.test.ts`
   - `packages/cli/src/cli.ts` (the shell — call sites only)

   Any write outside `packages/cli/src/` and `docs/tasks/028-*/` → **STOP and
   surface**. Any edit to `core`, an adapter, `run-fetch.ts` /
   `run-export.ts`, or `argv.ts` → **STOP** (Judgment Flag 1).
2. Follow all rules in `CLAUDE.md` — especially R2 (no new runtime dependency),
   R4 (no silent catch), R6 (function ≤ 50 lines; split the renderer by
   responsibility), R7 (named constants for policy values: column ids/headers,
   padding, separators), R8 (comments answer "why"), R9 (English-only
   agent-consumed surface — including all console/stderr strings), R20 (strict
   TS), R21 (ESM, `.js` import extensions), R22 (`tsc` per package, no bundler),
   R23 (`node:test`, colocated `*.test.ts`), R24 (no `any`), R25 (hexagonal —
   `cli` is the composition root; the display module lives in `cli`, never in
   `core`).
3. **No new runtime dependency (R2 / D4).** Plain string formatting only — no
   `chalk`, `cli-table`, `cli-table3`, `columnify`, `ansi-*`, or similar.
   Adding one → **STOP**. If a concrete second need for color/tables emerges,
   surface the justification at the mentor gate; do not assume it (D4).
4. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `feat/cli-human-display`
   - Conventional Commits (G-R3); verb allowlist SSOT
     (`.claude/skills/pre-commit-self-audit/SKILL.md`)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5 / R17)
5. **Field-agnostic rendering (D2).** The displayed columns are declared as a
   render-column list referencing payload `Issue` field ids (and/or
   `EXPORT_COLUMNS` ids), not a hand-inlined sequence of field accesses
   scattered through format code. Adding/removing a displayed column is editing
   one list, not rewriting the formatter.
6. **Purity boundary (D3).** The formatting module is pure: it maps the value
   `runFetch` returns (a `Payload`) — and the value `runExport` returns (an
   `ExportRunResult`) — to **strings**. No `process`, no `process.stdout`/
   `stderr`, no `process.exit`, no `node:fs`, no network, no clock. The console
   write stays in `cli.ts` (the shell). This is what makes the module
   unit-testable with `node:test` and no I/O (mirrors the 026 `argv.ts`
   pure-parser pattern).

### Conventions

- Language: agent-consumed surface is English-only (R9) — identifiers,
  comments, the brief, commit subjects, and every rendered console string
  (R9 lists console messages as agent-consumed). The team is pt-BR, but CLI
  output is on the agent-consumed surface and stays English until a real UI
  i18n layer exists; do not introduce a pt-BR-only literal here.
- Commit type `feat`; scope `cli`.
- Comments answer "why", not "what" (R8). Named constants for policy values
  (R7): the render-column ids/headers, padding/gap widths, empty-state and
  warning-summary strings.

### Architectural decisions already made (do not revisit)

Closed with the mentor in chat (caminho A). The executor implements; it does
not propose alternatives. If a decision needs to change mid-execution, **STOP
and report**.

#### D1 — Display is a rendering layer inside `@saci/cli` only

The layer consumes the **current return values** of `runFetch` (a `Payload`)
and `runExport` (an `ExportRunResult`). It does not touch `packages/core`, the
adapters, or `run-fetch.ts` / `run-export.ts` internals (read for grounding
only). It does not change the fetch contract or the data model.

#### D2 — Field-agnostic rendering

Render against the payload contract / `EXPORT_COLUMNS` as the column reference,
not a hardcoded field list buried in the formatter. The displayed columns are a
declared list of column ids; the formatter iterates that list. Rationale: this
is what lets the layer survive the next task (input-side FieldMapping, 023 D5)
without rework — FieldMapping changes how much of the payload is *populated*,
not its *shape*.

#### D3 — Pure formatter module + I/O in the shell

The formatting logic lives in a pure, unit-tested module in
`packages/cli/src/` (`node:test`, colocated `*.test.ts`), mirroring the
`argv.ts` pure-parser pattern from 026. Real I/O (the console write) stays in
the shell (`cli.ts`). R6 / purity / testability stay intact: the module
returns strings; `cli.ts` writes them.

#### D4 — No new runtime dependency

Plain string formatting; no table or color library unless a second concrete
need justifies it — and that justification, if any, is surfaced at the mentor
gate, not assumed (R2). The on-ramp default is plain, uncolored, aligned text.

### Planner scoping decisions (within D1–D4; confirm exact layout at Pause 1)

These resolve the "shape — open to your judgment" items the planner was asked
to propose. They are scoping choices inside the closed decisions, not new
architecture; the executor confirms the exact module/symbol layout at Pause 1.

- **S1 — Output format: aligned list, not a bordered table.** `fetch` renders
  one line per included issue as a left-aligned, space-padded column listing,
  plus a summary line. An aligned list (compute each column's width from the
  rendered cells, pad with spaces, single-space-or-fixed gap between columns)
  needs no box-drawing and no dependency (D4), and degrades gracefully on a
  narrow terminal. No terminal-width detection in the on-ramp (would need
  `process.stdout.columns`, which is I/O and breaks D3 purity); long values are
  emitted verbatim. If terminal-aware truncation is later wanted, it is a
  follow-up brief.
- **S2 — Displayed columns for `fetch` (the render-column list, D2).** A small
  human-relevant subset, declared as a list of payload/`EXPORT_COLUMNS` ids:
  `key`, `status_jira`, `entrega_iso`, and a short label
  (`parent_summary`/`summary`). The exact subset and header labels are the
  executor's to confirm at Pause 1; the **mechanism** (a declared id list the
  formatter iterates) is fixed by D2. Do not inline a hardcoded field sequence.
- **S3 — `fetch` summary line.** After the per-issue list, a summary derived
  from the `Payload`: count of included issues (`payload.issues.length`), and
  the counts of `payload.filtered_out` and `payload.warnings` when non-zero,
  plus the resolved output path. The bare 026 line (`wrote N issues to <path>`)
  is subsumed by this summary; the path and the count remain present so no
  information is lost.
- **S4 — `export` confirmation.** `export` keeps a single readable confirmation
  line built from `ExportRunResult` (`outputPath`, `format`, `rowCount`),
  routed through the same formatter module (so the rendering seam is uniform).
  No per-row listing for `export` — the file on disk is the artifact; the CLI
  confirms it. This is in scope because the on-ramp line is replaced by a
  formatter-produced string, not because the export contract changes.
- **S5 — Empty-result handling.** When `payload.issues` is empty, `fetch`
  renders an explicit empty-state line (a named constant string, e.g.
  "No issues matched.") plus the output-path note — never a blank listing or a
  bare `wrote 0 issues`. When `rowCount` is `0`, `export` says so explicitly.
- **S6 — Warning / filtered-out surfacing.** `payload.warnings` and
  `payload.filtered_out` are summarized as counts in the `fetch` summary (S3),
  not dumped row-by-row in the on-ramp. A detailed `--verbose` dump would need
  an argv flag (frozen, Judgment Flag 1) and is a follow-up; surface the idea at
  the gate if wanted, do not add the flag here.
- **S7 — Error display stays in the shell.** Runtime/usage errors continue to
  be handled by `cli.ts`'s existing taxonomy (026 D-a4: usage → stderr/exit 2;
  runtime → stderr/exit 1). The display module does not catch or format
  exceptions; it only renders successful results. No change to exit codes.
- **S8 — No color.** The on-ramp emits plain, uncolored text (D4). Color is a
  potential second need to raise at the gate, not an assumption here.

## Grounding (signatures already verified — consume, do not modify)

- `packages/cli/src/run-fetch.ts`:
  `runFetch(makeGateway, outputPath, now?): Promise<Payload>`. The returned
  `Payload` is the render input for `fetch`.
- `packages/cli/src/run-export.ts`:
  `runExport(payloadPath, configPath, profileName): Promise<ExportRunResult>`
  where `ExportRunResult = { outputPath: string; format: "csv" | "json";
  rowCount: number }`. This is the render input for `export`.
- `packages/core/src/payload.ts` — the `Payload` / `Issue` contract:
  `Payload` carries `schema_version`, `run_date`, `generated_at`,
  `issues: Issue[]`, `filtered_out: FilteredOut[]`, `warnings:
  PayloadWarning[]`. `Issue` fields include `key`, `summary`, `parent_key`,
  `parent_summary`, `status_jira`, `vertical_raw`, `entrega_iso` (`string |
  null`), `copy_url` (`string | null`), `copy_source`, `jira_updated_at`. Two
  fields are bare-nullable — the formatter renders `null` as a placeholder
  (e.g. `""` or `"—"`), never the literal string `"null"`.
- `packages/core/src/export.ts` — `EXPORT_COLUMNS` (the ordered canonical
  column id superset) and `ExportColumnId`. Imported as the **column-id
  reference** for D2; `core` is not modified.
- `packages/cli/src/cli.ts` — the current shell. `runCommand` already switches
  on `command.kind`; the `fetch` and `export` cases each `process.stdout.write`
  one bare line. This brief replaces the bare-line construction with a call to
  the formatter, keeping the `write` in the shell (D3). The version/usage paths
  and the exit-code/try-catch taxonomy (026 D-a4) are unchanged.

## Done criteria

### Edit 1 — Verify brief on disk (committed by @planner)

This brief was authored and committed by @planner on `feat/cli-human-display`
(caminho A, commit #1). The executor only verifies it is present; it does NOT
re-commit it.

P4 numbering evidence (recorded; three sources agree slot 028 is free):

- `ls docs/tasks/` — highest existing slot is `027-playbook-mentor-gate`.
- `git log --oneline main` — most recent merged work is brief 027 (`#67`–`#68`);
  no merged-but-invisible brief shipped a higher slot.
- `CLAUDE.md` `E*` block — exceptions stop at `E5`; none nominally reserves a
  numeric slot ≥ 026 (E1–E3 are named-branch debts; E5 references slots
  004-006). No reservation of 028.

- [ ] Directory `docs/tasks/028-cli-human-display/` exists
- [ ] File `docs/tasks/028-cli-human-display/brief.md` exists; first line
      matches the title above
- [ ] The brief is already committed by @planner (do NOT re-commit)

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

### Edit 2 — Add the pure display/formatting module + its test

Create the pure formatting module (suggested
`packages/cli/src/display.ts`; exact name/layout confirmed at Pause 1) and its
colocated `*.test.ts`, per D2, D3, D4, and S1–S6. The module:

- exports a function rendering a `Payload` to the `fetch` status string
  (per-issue aligned listing + summary + empty/warning handling), and a
  function rendering an `ExportRunResult` to the `export` confirmation string;
- declares the displayed `fetch` columns as a list of column ids (D2) with
  named header labels (R7);
- declares padding/gap and empty-state/summary strings as named constants (R7);
- is pure: no `process`, `process.stdout`/`stderr`, `process.exit`, `node:fs`,
  `fetch`, or clock (D3);
- splits responsibilities so no function exceeds 50 lines (R6).

Verification:

- [ ] New module exists in `packages/cli/src/`; `tsc -p packages/cli` passes
      (R20–R24)
- [ ] Colocated `*.test.ts` covers: a non-empty `Payload` (alignment +
      summary), an empty `Payload` (empty-state line), a `Payload` with
      non-zero `filtered_out` / `warnings` (counts surfaced), a `Payload` with
      a `null` `entrega_iso` (placeholder, not `"null"`), and an
      `ExportRunResult` (confirmation string incl. `rowCount` 0)
- [ ] `node --test` suite passes for `packages/cli` (R23)
- [ ] The module imports no I/O / process / fs / network / clock primitive
      (`process`, `process.exit`, `node:fs`, `fetch`, `new Date` absent from
      the module)
- [ ] Displayed columns are a declared id list referencing payload /
      `EXPORT_COLUMNS` ids, not an inlined field sequence (D2)
- [ ] No new runtime dependency added (R2); `package.json` files unchanged

Commit: `feat(cli): add human-facing display formatter for fetch and export`

### Edit 3 — Wire the formatter into the CLI shell

Modify `packages/cli/src/cli.ts` so the `fetch` and `export` cases of
`runCommand` build their output via the formatter module and `process.stdout.
write` the returned string (D3). Replace the two bare 026 lines with the
formatter calls; preserve no information loss (the resolved output path and the
issue count remain present, S3). The version/usage paths, the exit-code
taxonomy, and the top-level try/catch (026 D-a4) are unchanged. `argv.ts` is
not edited (Judgment Flag 1).

Verification:

- [ ] `packages/cli/src/cli.ts` imports the formatter from the new module and
      writes its result via `process.stdout.write`; `tsc -p packages/cli` passes
- [ ] The `fetch` case passes the returned `Payload` to the formatter; the
      `export` case passes the returned `ExportRunResult`
- [ ] `saci --version` / `saci -v` output unchanged (026 D-a2)
- [ ] Exit codes unchanged: usage → 2, runtime → 1, success → 0 (026 D-a4)
- [ ] No silent `catch` introduced; the top-level handler is untouched (R4)
- [ ] `argv.ts` / `argv.test.ts` absent from the diff (Judgment Flag 1)
- [ ] `run-fetch.ts` / `run-export.ts` absent from the diff

Commit: `feat(cli): wire human-facing display into the cli shell`

### Automated checks (run before each commit)

- [ ] `tsc -p packages/cli` passes without errors
- [ ] `node --test` suite passes for `packages/cli`

### Structural checks

- [ ] Expected files exist at expected paths
- [ ] No file outside the in-scope list was modified
      (`git diff --name-only main..HEAD` ⊆ in-scope list)
- [ ] `packages/core/**`, `packages/adapter-jira/**`,
      `packages/adapter-sheets/**` absent from the diff
- [ ] `run-fetch.ts` / `run-export.ts` / `argv.ts` / `argv.test.ts` absent from
      the diff
- [ ] `README.md` and root `package.json` absent from the diff

### Behavior checks

- [ ] The `fetch` formatter aligns columns (each column padded to its widest
      rendered cell) and appends a summary line with the included-issue count
      and the output path
- [ ] An empty `payload.issues` renders the named empty-state string, not a
      blank listing or a bare `wrote 0 issues`
- [ ] Non-zero `filtered_out` / `warnings` counts appear in the `fetch` summary
- [ ] A `null` `entrega_iso` (or `copy_url`) renders as the placeholder, never
      the literal `"null"`
- [ ] The `export` formatter renders `rowCount`, `outputPath`, and `format`,
      including the `rowCount === 0` case

### Git checks

- [ ] Branch used: `feat/cli-human-display`
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
  **Required** (`Plan required: yes` — the module name, the formatter function
  signatures, the displayed-column subset (S2), and the exact summary/empty
  strings are the executor's to confirm).
- **Pause 2 (after the first modified file):** show the result and wait for
  review. **Always required.**
- **Pause 3 (before each commit):** show `git status` + `git diff --stat` +
  proposed message + `pre-commit-self-audit` output. **Always required.**

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md` as a
  follow-up brief.
- **Judgment Flag 1** (any out-of-scope edit: `core`, an adapter,
  `run-fetch.ts` / `run-export.ts` internals, or `argv.ts` — including adding a
  display flag) hit → **STOP and surface to the mentor gate.** Do not edit
  `argv.ts` to add `--json` / `--no-color` / `--verbose`; raise the need in
  chat instead.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: yes`:

- The task introduces a new module (the pure formatter) — its exact name, the
  rendering function signatures, the displayed-column subset (S2), and the
  exact summary/empty-state strings are the executor's to confirm at Pause 1.
- It spans 2+ files (`cli.ts` + the new module + its test) and likely ≥ 50
  lines (R15), so a numbered plan precedes any edit.
- Decisions D1–D4 and scoping S1–S8 are closed, but the *how* (module split to
  satisfy R6, where the named column list and constants live, the test fixture
  shape) benefits from review before coding.

**Pause 2 and Pause 3 remain required** regardless — Lesson #6 of
`docs/AGENT_PLAYBOOK.md`.

## Git workflow

### Branch

`feat/cli-human-display` — branched from up-to-date `main`. No push
(G-R5 / R17).

### Commit sequence

Already on the branch (caminho A; planner-authored — executor does NOT
re-commit):

1. `docs(tasks): add brief for 028-cli-human-display`

Executor-authored:

2. `feat(cli): add human-facing display formatter for fetch and export`
3. `feat(cli): wire human-facing display into the cli shell`

Each subject is ≤ 72 chars (verified) and leads with an allowlisted verb
(`add`, `wire`).

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules (R2, R4, R6, R7, R9, R20–R25 especially)
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — known traps
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6, Chapter 6
   (the mentor gate governs APPROVED → executor)
5. `.claude/skills/brief-template/SKILL.md` — template reference
6. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit + verb
   allowlist SSOT (Pause 3)
7. `packages/cli/src/run-fetch.ts` — `runFetch` / `Payload` (consumed as-is)
8. `packages/cli/src/run-export.ts` — `runExport` / `ExportRunResult`
   (consumed as-is)
9. `packages/core/src/payload.ts` — the `Payload` / `Issue` contract (render
   input shape)
10. `packages/core/src/export.ts` — `EXPORT_COLUMNS` (the column-id reference,
    D2)
11. `packages/cli/src/cli.ts` — the shell this brief wires the formatter into
12. `packages/cli/src/argv.ts` — frozen; read only to confirm it is NOT edited

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat main..HEAD` (line counts per file)
3. Any verification checkbox that could not be met, with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step (open PR for mentor review, follow-up brief, etc.)
