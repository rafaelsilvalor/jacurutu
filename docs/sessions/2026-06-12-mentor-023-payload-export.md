# Session recap — mentor — 2026-06-12 — 023 payload export

**Session type:** mentoria → decision closure → caminho-A delegation → gate reviews → merge.
**Continues:** docs/sessions/2026-06-10-mentor-022-coordination-envelope.md
**Result:** brief 023 executed and merged (PR #<NN>, squash). Branch `feat/payload-export`, 4 commits, +1259 lines: pure projection in `@saci/core` (`export.ts`, 17-column canonical superset v1) + `runExport` composition in `@saci/cli` (CSV/JSON writers, named profiles). 120/120 tests, R25/D2 greps clean.

## Product pivot (supersedes prior Phase 4 framing — ROADMAP update still pending)

- The application owns production state (local now, remote later). The Google Sheet is demoted from state-holding UI to one optional one-way projection target among others (files, BI platforms).
- Grounding fact: there are NO production users of the Python `automation/` today. No behavior-preserving mandate exists for `sync.py`; it is legacy reference only. This corrected a stale mentor assumption.
- Consequence: the sync.py diff engine (cell ownership, write-conditionals, copyPaste moves, formulas) is never ported — it existed solely because the sheet held state. What survives: the issue→row projection (now `core/export.ts`).
- Real goal surfaced: feeding BI dashboards (Looker Studio / Power BI / Grafana) and consolidating production across multiple individuals in the future. Export = fact table; aggregation belongs to the BI layer.

## Decisions (closed in chat before delegation)

- D1: no production users → new design, not a port; sync.py/lib_sheets = legacy reference.
- D2: pure projection Issue → flat record, fixed 17-column superset v1 (snake_case, all-string, null → ""), plain URLs, no formulas/link cells.
- D3: JSON export config with named profiles (format, ordered column subset with optional rename, csv options, stable output path). Selection/order/rename only — no computed columns/expressions.
- D3-filters (nominal, optional, default = export everything): status set (case-insensitive/trim vs status_jira) + entrega window `{ from?, to? }` YYYY-MM-DD inclusive, lexicographic; null entrega excluded when a window is set. No numeric limit.
- D4: formats v1 = CSV (hand-rolled RFC 4180, default ";" + BOM, CRLF) + JSON. XLSX out — separate R2 dependency decision when demanded.
- D5: input-side field mapping (per-project Jira customfields) out — Phase 3 FieldMapping.
- D6: Sheets one-way push → parking lot; named future consumer: Looker Studio reads a flat tab. SheetGateway port in core stays untouched until a consumer exists.
- D7: export is a fact table — one row per issue, zero aggregation; update_hub metrics never ported.
- D8: provenance in superset: operator (config top level, "" if absent) + run_date + generated_at.
- D9: cli.ts untouched — runExport as testable composition (run-fetch precedent); argv command surface is Phase 3.
- Reserve redefinition: slot 023 ("adapter-sheets + SheetGateway", inherited from 022) redefined to payload export; recorded in the brief per P4.

## Mentor gate interventions (brief review — 2 blocks + 1 pin)

1. Hardcoded instance domain in core (`estrategia.atlassian.net` as a core constant) → `jiraBrowseUrl(baseUrl, key)` pure with baseUrl as parameter; `jiraBaseUrl` optional top-level config field (absent → URL columns ""). Injection precedent: 020 D2.
2. Edit 1 described caminho B ("executor commits the pre-saved brief") while the brief was caminho A (planner-authored and committed). Reworded to the 019 pattern (verify, do NOT re-commit).
3. Entrega window shape pinned: `{ from?, to? }`, both ends optional, inclusive.

## Local decisions ratified at Pauses (now contractual, all test-covered)

- `status: []` = no filter (empty set excluding everything would be a config mistake; matches D3 default).
- `ColumnSpec.id: string` + boundary throw + `isExportColumnId` type-guard narrowing (runtime JSON config: validate at the boundary, never cast — R20/R24).
- Unknown export format throws (fails-loudly, defense in depth).
- Relative output paths resolve against the config file's directory (config and outputs travel together); pre-existing e2e test confirmed.

## Meta-observations (rule-of-three ledger — first occurrences)

- Validator (11/11 mechanical checks) cannot detect divergence between Edit 1's declared authorship mode (caminho A/B) and the actual path taken. First occurrence; candidate check if it recurs.
- Runtime-config → boundary-validation → type-guard-narrowing is a reusable pattern; candidate GOTCHAS/convention note on second occurrence.

## Workflow refinements this session

- Standing practice (recorded in memory): every mentor verdict requiring pipeline action ships with a ready-to-paste English snippet inline in chat.
- Mentor review gate (planner→validator→mentor→executor) exercised again — 4th consecutive evidence point (019/020/021/023) for the pending AGENT_PLAYBOOK meta brief.

## Expectations set

- Exports are snapshots of currently open demands (JQL-filtered payload). Throughput/history dashboards require state accumulation over time = Phase 3 state concern, not export.
- Manual smoke testing of runFetch against real Jira is possible today via a throwaway script outside the repo (real JiraGateway + env-var credentials + runFetch factory injection); no command surface until Phase 3.

## Pending — next actions (ordered)

1. **Pivot docs PR (deferred from this session, now top of queue):** ROADMAP — Phase 4 rescoped (app owns state; Sheets = unidirectional push in parking lot w/ Looker consumer; XLSX = deferred R2 decision; history accumulation = Phase 3 state; "CLI human-facing display" as named Phase 3 item) + MENTOR_BRIEF.md §2 product model update. Caminho B, mentor-drafted. Do this FIRST — planner grounding depends on a non-stale ROADMAP.
2. Next code thread candidates: (a) small brief — cli.ts argv dispatch (`parseArgs`) wiring `fetch` + `export` commands (anticipates Phase 3 command surface; unblocks real manual use); (b) Phase 3 state design opening (derivePath hierarchy rule still unresolved); (c) meta brief — AGENT_PLAYBOOK planner→validator→mentor gate (evidence now 4 sessions strong).
3. Meta backlog carried (unchanged unless listed above): resume scoped-to-remaining-Edits + find-block mismatch hazard; M-R15 wording; customfield_ grep tightening in SKILL.md; Judgment-flags doc mentor-side; orphaned E4 grep; C11 hygiene; "old 013" parking lot; parent_summary parking lot.
