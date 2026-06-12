# Session recap — 2026-06-11 — 023-payload-export

**Mode:** full pipeline (planner → brief-validator → mentor gate → executor),
orchestrated from Code.
**Executor:** Claude Code (this session), driving the three orchestration
subagents.
**Orchestrator:** mentor scope handoff pasted into Code (caminho-A scope
package with decisions D1–D9 and three judgment flags).
**Merged via:** PR #55, squash merge → `main@6f54e3b`.

## Context

Brief 023 lands the export half of the product pivot: **the application owns
production state; any spreadsheet is a one-way projection target**, not the
state-holding surface. With no production users of the Python automation,
`sync.py` was demoted to legacy reference — this is a new design, not a port.
`docs/ROADMAP.md` is stale on the pivot until a separate docs PR lands; the
scope package's decisions prevailed within this brief.

The deliverable: a pure issue→flat-record projection in `@saci/core`
(canonical 17-column superset v1) plus a `runExport` composition in
`@saci/cli` that reads `payload.json`, applies a named profile from a JSON
config file, and writes CSV/JSON output files. Fixture-tested end to end; no
credentials, no network.

**Slot redefinition (P4):** 023 was reserved by brief 022 for "adapter-sheets
+ SheetGateway". The scope package explicitly redefined the reserve to
payload export; the decision is recorded in the brief. Numbering re-verified
against the three sources (docs/tasks/, git log, CLAUDE.md) — no conflict.

## Decisions realized

Decisions D1–D9 were closed in the mentor scope package; the executor
implemented, did not revisit.

- **D1 — new design, not a port.** `sync.py` / `lib_sheets.py` are legacy
  reference only; no behavior-preserving mandate.
- **D2 — pure projection in core.** `projectIssue(issue, context)` →
  17-column `ExportRecord`, grounded against `automation/sync.py
  build_new_row` and `packages/core/src/payload.ts`. Every value projects to
  a `string`; null/absent → `""`. Plain values only — no formulas, no link
  cells. **Mentor-gate amendment:** `jiraBrowseUrl(baseUrl, key)` takes the
  base URL as a parameter (trailing-slash normalization mirroring
  `adapter-jira/src/http.ts`); no instance domain constant anywhere in core
  (injection precedent: 020 D2 `JiraGatewayConfig`). `jiraBaseUrl` is an
  optional top-level config field; absent → URL columns project to `""`.
- **D3 — JSON config with named profiles.** Profile = format, ordered column
  subset with optional rename, optional filters, csv options, stable output
  path (overwritten each run). Selection/order/rename ONLY — no computed
  columns, no expressions. **Mentor-gate amendment:** entrega window pinned
  to `{ from?, to? }`, `YYYY-MM-DD`, both ends optional, inclusive,
  lexicographic comparison. Status filter: case-insensitive + trimmed both
  sides. Window present → rows with empty `entrega_iso` are excluded.
- **D4 — CSV + JSON only.** Hand-rolled RFC 4180 CSV writer (no new
  dependency, R2): quote on delimiter/quote/CR/LF, double inner quotes, CRLF
  line endings. Defaults: delimiter `";"`, BOM on (pt-BR Excel). XLSX is OUT
  (separate R2 decision later).
- **D5 — input-side field mapping OUT** (Phase 3 FieldMapping).
- **D6 — Sheets one-way push OUT** — parking lot (future consumer: Looker
  Studio reads a flat tab). `SheetGateway` port untouched.
- **D7 — fact table.** One row per issue, zero aggregation; metrics belong to
  the BI layer.
- **D8 — provenance columns.** `operator` (config top level, `""` if absent),
  `run_date` + `generated_at` from the payload envelope, stamped on every row.
- **D9 — `cli.ts` untouched.** `runExport` delivered as a testable
  composition function (run-fetch.ts precedent from 022); argv wiring is
  Phase 3.

### Superset v1 (17 ordered snake_case columns)

`key`, `parent_key`, `summary`, `parent_summary`, `vertical`, `entrega_iso`,
`entrega_hora`, `nome_curto`, `task_filha_url`, `task_pai_url`, `copy_url`,
`copy_source`, `status_jira`, `jira_updated_at`, `operator`, `run_date`,
`generated_at`. Notable planner grounding calls: `jira_updated_at` projected
as the raw Jira ISO (no `dd/mm/yyyy` reformat — faithful payload
pass-through, flagged for mentor override and not overridden);
spreadsheet-only columns from `build_new_row` (`nomefinal` formula,
`Demandante`, `laminas`, `entregue`, `linkDrive`, `status`) excluded as
spreadsheet artifacts, not issue facts.

## Micro-decisions ratified at the Pauses

**Pause 1 (six, all approved):** (a) `matchesFilters` operates on the
*projected* record, not the raw `Issue`; (b) `ColumnSpec` accepts a plain
string OR `{ id, rename? }`; (c) `applyColumns` throws on unknown column id;
(d) CSV line terminator is CRLF; (e) relative `output` paths resolve against
the config file's directory; (f) pre-existing untracked
`Projects - Shortcut.lnk` stays untouched.

**Pause 2 (two local decisions, ratified):** `status: []` = no filter (guard
`length > 0` — an empty set excluding all rows would be a config mistake, not
intent); `ColumnSpec.id` typed `string` with boundary throw +
`isExportColumnId` type-guard narrowing (correct R20/R24 pattern for runtime
JSON config — validate at the boundary, never cast). **Mentor rider (now
contractual, all covered by tests):** `status: []` projects every issue; the
unknown-id error message names the offending id; `from`-only and `to`-only
windows each tested inclusive.

**Pause 3 cli (two implementation notes, ratified):** unknown-format `else`
throw in the dispatch (fails-loudly defense in depth); `CSV_BOM` written as
the visible `"﻿"` escape rather than the invisible literal. **Mentor
pre-commit check:** the relative-path contract claimed in the commit body had
to be test-covered — it already was (config in tmpdir, `output: "out.csv"`,
assert lands next to the config, not the CWD).

## Artifacts produced

- **Four commits on `feat/payload-export`** (2026-06-11):
  - `docs(tasks): add brief for 023-payload-export` (`6b733aa`, by @planner)
  - `docs(tasks): update 023 brief per mentor review gate` (`352fd4e`, by
    @planner — post-approval amendments on a NEW commit, not amended)
  - `feat(core): add issue-to-flat-record export projection` (`9eccdcc`)
  - `feat(cli): add runExport composition for payload export` (`38b27f7`)
- **`@saci/core` additions:**
  - `export.ts` (159) — `EXPORT_COLUMNS` (`as const`, derived
    `ExportColumnId` / `ExportRecord`), `jiraBrowseUrl`, `ExportContext`,
    `projectIssue`, `ExportFilters` + `matchesFilters`, `ColumnSpec` +
    `applyColumns`. Pure: only imports are `Issue` (type-only) and the three
    pure helpers from `transform.js`.
  - `export.test.ts` (204) — 17 `node:test` cases: full-fixture projection
    (`deepStrictEqual` across 17 columns, key order = `EXPORT_COLUMNS`),
    null → `""`, URLs without `jiraBaseUrl`, trailing-slash normalization,
    status case/trim, inclusive window bounds + empty-iso exclusion,
    rename/order, unknown-id throw (both `ColumnSpec` forms), plus the three
    rider cases.
  - `index.ts` (+17) — public re-exports, value/type split.
- **`@saci/cli` additions:**
  - `run-export.ts` (147) — `runExport(payloadPath, configPath, profileName)`
    → `{ outputPath, format, rowCount }`. All I/O here: reads payload +
    config, resolves named profile (clear throw if absent), builds
    `ExportContext`, projects → filters → selects via core, writes CSV
    (RFC 4180, BOM, CRLF) or JSON (indent 2, no trailing newline).
  - `run-export.test.ts` (302) — e2e in `mkdtempSync`: byte-level CSV asserts
    (BOM, quoting of `;`/quotes/newline values, CRLF), JSON shape, one row
    per issue without filters, filters applied, rename/order in headers,
    output overwrite, unknown profile throws, relative output path lands next
    to the config.
- **PR #55** — `feat: payload export — pure projection in core + runExport in
  cli (023)`, filled per the template. Squash-merged → `main@6f54e3b`.
- **This recap** — `docs/sessions/2026-06-11-executor-023-payload-export.md`.

## Learnings

- **A superseded forward reserve is redefined explicitly, not silently
  reused.** 022 reserved 023 for adapter-sheets; the pivot made payload
  export the priority. The scope package named the redefinition and the brief
  recorded it under P4 — the numbering audit trail stays coherent even when
  product direction changes between briefs.

- **Post-approval amendments go on a new commit, then re-validate.** The
  brief was APPROVED at `6b733aa`; the mentor gate then required three
  amendments. Per the pre-validation-amend rule's flip side, they landed as a
  new commit (`352fd4e`) and the validator re-ran (APPROVED 11/11 again).
  One amended commit *before* approval, new commits *after*.

- **Runtime-config types validate at the boundary, not in the type system.**
  `ColumnSpec.id: string` + throw + type-guard narrowing beats typing the id
  as the literal union — JSON config arrives untyped at runtime; a literal
  type would force a caller cast and mask the real validation.

- **Contractual claims in commit bodies get test-verified before committing.**
  The mentor's pre-commit check ("relative paths resolve against the config
  dir — is that tested?") is a cheap gate: if the body asserts behavior, a
  test must witness it.

- **No `SendMessage` in this environment (again, as in 022).** Each Pause→go
  cycle spawned a fresh executor seeded with explicit resume state (approved
  decisions re-stated, prior commits/files confirmed on disk). No work lost;
  cost is re-stated context per turn.

## Incidents recovered

- **`api.github.com` unreachable from the dev machine at PR time.** DNS
  resolved correctly (Azure-range IP confirmed via Cloudflare; hosts file
  clean) but TCP to `:443` timed out, while `github.com:443` and SSH worked —
  a route/firewall failure on the API endpoint only. Push succeeded over SSH;
  `gh pr create` could not. Recovery: PR title + template-filled body handed
  to the user, who opened PR #55 manually via the web UI. A background retry
  loop was started and then cancelled once the manual path was chosen.

## Verification summary (brief 023 Edits 1–3)

- **All Pauses honored.** Pause 1 (`Plan required: yes`) — numbered plan +
  six micro-decisions, explicit mentor go. Pause 2 — fired after the first
  file (`export.ts`); two local decisions surfaced and ratified; test rider
  attached to the go. Pause 3 ×2 — each commit gated on explicit mentor go;
  the cli go carried a pre-commit test-coverage check (satisfied, no
  addition needed).
- **`pre-commit-self-audit`: 5/5 PASS** on both code commits, 0 WARN/FAIL.
  Subjects ≤ 72 chars, verb `add` ×2 inside the allowlist SSOT, no co-author
  trailers.
- **Build + test:** `tsc -b` green (strict, no `any`, no `@ts-ignore`);
  `npm test` → **120 pass / 0 fail** (17 new core + 7 new cli tests).
- **Purity gates (Flag 1):** `grep -rn 'from.*adapter' packages/core/src/` →
  empty (R25); `grep -rni 'atlassian' packages/core/src/` → empty (D2); no
  fs/clock/network primitive in `export.ts`.
- **Boundary gates (Flag 3):** `git diff --name-only main..HEAD` = exactly
  the brief + 5 source files. No `cli.ts`, no `automation/**`, no
  `docs/ROADMAP.md`, no `.lnk`.
- **No aggregation (Flag 2):** one row per issue throughout; rowCount is a
  return value, not a column.
- **No push without instruction (R17)** — push and PR were explicit mentor
  verdicts after acceptance.

## Pending items

### Product line

- **ROADMAP update** — separate docs PR to record the pivot (app owns state;
  spreadsheet = one-way projection; Phase 4 wording superseded). ROADMAP was
  deliberately NOT touched in 023.
- **argv wiring for `runExport` into `cli.ts`** — Phase 3 (D9). The export is
  currently reachable programmatically/by test only.
- **Sheets one-way push** — parking lot (D6; future consumer: Looker Studio).
- **XLSX format** — out pending a separate R2 dependency decision (D4).
- **Input-side FieldMapping** (per-project Jira customfields) — Phase 3 (D5).

### Operational

- Post-merge cleanup done this session: local + remote branch deleted, refs
  pruned, `main` fast-forwarded to `6f54e3b`, temp PR-body file removed.
- Untracked `Projects - Shortcut.lnk` at repo root — pre-existing, never
  staged; user's call to delete or exclude.
- This recap merged via a separate docs PR per convention; mentor recap comes
  from the Chat session.

## Next concrete action

`main@6f54e3b` carries the export pipeline. Candidates for the next brief:
the ROADMAP pivot docs PR (small, unblocks stale Phase-4 wording) or the
Phase-3 CLI command surface that wires `runFetch` + `runExport` into argv
dispatch (D9's deferred half).

## Snippet for the next session

```
Olá. Modo: [continuar | modelar tarefa].

Continuação de 2026-06-11-executor-023-payload-export.
Brief 023 = payload export — pivô realizado: o app é dono do estado;
planilha vira alvo de projeção one-way. Slot 023 REDEFINIDO (era
adapter-sheets, reserva da 022; redefinição registrada no brief, P4).
Pipeline completo caminho A (planner → validator → mentor gate com 3
emendas → executor), 4 commits em feat/payload-export, PR #55 squash
→ main@6f54e3b.

Entregue:
- @saci/core: export.ts (EXPORT_COLUMNS superset v1 de 17 colunas,
  jiraBrowseUrl(baseUrl, key) — domínio injetado, zero constante em
  core —, projectIssue puro, matchesFilters, applyColumns com throw
  em id desconhecido), export.test.ts (17 casos + rider do mentor),
  index.ts (re-export)
- @saci/cli: run-export.ts (runExport: config JSON com profiles,
  CSV RFC 4180 hand-rolled — ";" + BOM default pt-BR Excel, CRLF —,
  JSON indent=2 sem newline, output relativo resolve contra o dir da
  config), run-export.test.ts (e2e tmpdir, asserts byte-level)
- npm test 120 pass/0 fail; tsc strict; cli.ts INTOCADO (D9)

Decisões realizadas (D1–D9, não reabrir): novo design não-port (D1);
projeção pura superset v1 (D2); profiles seleção/ordem/rename apenas,
janela entrega {from?,to?} YYYY-MM-DD inclusiva lexicográfica (D3);
CSV+JSON, XLSX fora (D4); FieldMapping Phase 3 (D5); Sheets push
parking lot → Looker Studio (D6); fact table sem agregação (D7);
proveniência operator/run_date/generated_at (D8); argv wiring
Phase 3 (D9).

Aprendizados:
- reserva de slot superada é redefinida explicitamente (P4), nunca
  reutilizada em silêncio
- emenda pós-APPROVED = commit novo + re-validação (amend só
  pré-aprovação)
- config runtime valida na fronteira (string + throw + type guard),
  não no sistema de tipos
- claim contratual em corpo de commit exige teste-testemunha antes
  do commit
- sem SendMessage: cada Pause→go relança executor fresco com estado
  explícito (igual 022)

Pendências:
- docs PR do pivô no ROADMAP (Phase 4 superado; NÃO tocado na 023)
- wiring argv de runFetch+runExport no cli.ts (Phase 3, D9)
- Sheets one-way push (parking lot, D6); XLSX (decisão R2, D4);
  FieldMapping (Phase 3, D5)
- incidente: api.github.com inacessível na criação do PR (rota, não
  DNS); push SSH ok; PR #55 aberto manualmente pelo usuário

Antes de propor próximo passo, confirma quem entendeu que sou e
o modo da sessão.
```
