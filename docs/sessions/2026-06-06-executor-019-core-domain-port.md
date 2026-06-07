# Session recap — 2026-06-06 — 019-core-domain-port

**Mode:** continue task (first v2 **code** brief; full pipeline planner → brief-validator → executor, orchestrated from Code).
**Executor:** Claude Code (this session), driving the three orchestration subagents.
**Orchestrator:** mentor delegation pasted into Code (the `@planner` delegation with the four Judgment flags and the EARS guidance).
**Merged via:** PR #43, squash-merge → `main@b7adcaf`.

## Context

This is the **first code of the v2 effort** and the **first EARS adoption** (slated since brief 018). It ports the pure domain layer out of the frozen Python seed (`automation/`) into `@saci/core`, establishing the core/adapter cut (D1) in real TypeScript. The brief fixed behavioral contracts (EARS) + field contracts; the executor designed the implementation and resolved it at Pause 1.

## Decisions taken

- **Seed-on-disk was a hard precondition; the first delegation correctly STOPped.**
  The initial `@planner` run halted because `automation/lib_transform.py`,
  `fetch.py`, `lib_sheets.py`, and `payload.json` did not exist on disk or in git
  history — Judgment Flags 2 (payload fidelity) and 3 (STOPWORDS_PT verbatim) were
  unsatisfiable, so authoring would have meant inventing the very shapes the flags
  forbid. The mentor vendored the seed (`chore/vendor-automation-seed`, `8fada81`,
  PR #42, `automation/` as a frozen reference) and re-delegated. Authoring then
  proceeded. **The STOP was the correct call, not an obstacle** — it surfaced a
  missing precondition before any fabrication.

- **Brief pre-validation: REJECTED → fixed → APPROVED, on a single amended commit.**
  First `brief-validator` run **REJECTED** on C11: commit #5's declared subject
  used the verb `widen`, which is not on the `pre-commit-self-audit` allowlist
  (declared in two places — the commit sequence and the Edit 5 block). Fixed to
  the allowlisted `update` at both sites + reworded the fallback note;
  **amended the single brief commit** (pre-validation discipline — stay on one
  commit until APPROVED) and re-validated → **APPROVED**. A second round of mentor
  content corrections (Edit 1 rewritten verify-only; `SheetGateway`
  `readRows`/`writeRows`; new non-negotiable #6 "No STATE.md") was amended onto the
  same brief commit and re-validated → **APPROVED** again (11/11).

- **Pause 1 modeling resolved three executor decisions (Q1–Q3).**
  - Q1 — **keep `SACI_CORE_PHASE` exported** from `index.ts`: the adapters import
    it, so removing it would break their compile (out of scope, Flag 4).
  - Q2 — **`CopySource` lives in a new `types.ts` staged in commit #3** (shared by
    `policy.ts` now and `payload.ts` in Edit 4), so each commit compiles
    independently without a forward dependency on a later file.
  - Q3 — **`index.ts` evolves incrementally** (each commit #2–#4 adds its own
    exports), keeping every commit green.

- **`parseEntrega` fidelity is the load-bearing port detail.** Hand-rolled,
  dependency-free; reads wall-clock components straight from the ISO string —
  **never `new Date()`**, which would reinterpret the offset and shift hour/date
  for inputs like `2026-05-13T19:30:00.000-0300`. Midnight → `""` (mirrors the
  Python comment). An `isValidYmd` helper reproduces `strptime`/`fromisoformat`
  rejection of impossible calendar dates on **both** branches (date-only and
  full-ISO); its `Date.UTC` use is pure days-in-month arithmetic (no I/O, no tz
  hazard). Mentor added impossible-date tests (`2026-13-40`, `2026-02-30` →
  `[null, ""]`).

- **Verbatim ports verified against disk at each gate (not just claimed).**
  `STOPWORDS_SLUG`, `STOPWORDS_PAIRING`, `STOPWORDS_PT`, all regexes, and the
  payload nullability were cross-checked line-by-line against `automation/`.
  `summaryTokens` deliberately does **not** strip diacritics — the Python
  `tokenize_summary` never calls `normalize_text`, so the port doesn't either.
  `bestMatchByTokenOverlap` uses strict `>` so the **first** max-overlap candidate
  wins ties (matches Python `score > best_score`); single-candidate wins directly
  even at zero overlap (`len(candidates) == 1`).

- **Payload v2.0 nullability grounded against `build_issue_entry` (Flag 2).**
  Only `entrega_iso` and `copy_url` are `string | null`; all other `Issue` fields
  are non-null `string` (Python `... or ""`). Confirmed against the return dict
  (`fetch.py` 486-497) and `payload.json` samples (`MCA-62539`: `entrega_iso:
  null`, `vertical_raw: ""`).

- **R25 grep false-positive resolved by JSDoc reword (mentor chose reword over
  accept-as-is).** The Edit 4 verification `grep -rn 'from.*adapter'
  packages/core/` matched a JSDoc prose line in `gateways.ts:9`
  ("...issues **from** Jira. The **adapter** maps..."), not an import. R25 itself
  held (zero adapter imports), but the literal checkbox could not be honestly
  marked. Reworded line 9 so `from`/`adapter` no longer co-occur; grep now returns
  zero matches. Eliminates a standing false-positive for future structural audits.

- **Adapter halves explicitly left out (D1 boundary held).** `build_issue_entry`,
  `adf_extract_*`, `safe_get_*`, and the Jira-navigation halves of `resolve_copy`
  / `best_sister_match` were NOT ported — they defer to the Phase 3/4 Jira adapter
  brief. No `issue["fields"]` access anywhere in core (Flag 1 held at every Edit).

## Pending items

### High-priority — affects next session

- **Jira adapter brief (Phase 3/4) is the natural next brief.** It implements the
  three ports and ports the deferred Jira-shape-coupled halves (`build_issue_entry`,
  ADF URL gathering, the navigation halves of `resolve_copy`/`best_sister_match`).
  `bestMatchByTokenOverlap` and `pickCopy` are waiting for their adapter-side
  navigation to feed them plain token sets / URL lists.

### Deferred — explicitly out of scope for 019

- **`claimed_by` concurrency semantics** — field defined doc-only on `TaskManifest`;
  behavior is Phase 3.
- **`derivePath`** — pure, but ROADMAP scopes it to Phase 3.
- **`FieldMapping` type and user-editable filter/JQL config** — Phase 3.
- **Consolidating `summaryTokens` and `tokensForPairing`** — different stopword
  sets and length thresholds; merging is a behavior change, deferred.

### Operational — pending before next session

- **PR #43 squash-merged → `main@b7adcaf`.** Close-task cleanup still to run: delete
  the local/remote `feat/core-domain-port` branch, and re-upload the canonical files
  to the claude.ai project knowledge (`packages/core/src/**`, `docs/ROADMAP.md`, the
  brief, and this recap).
- **This recap merged via a separate docs PR** per project convention.

## Artifacts produced

- **Five commits on `feat/core-domain-port`** (all 2026-06-06, BRT):
  - `804a426` — `docs(tasks): add brief for 019-core-domain-port` (#1, by @planner)
  - `a128a91` — `feat(core): port lib_transform pure functions to TypeScript` (#2)
  - `9f35d95` — `feat(core): add core copy-resolution and token policy functions` (#3)
  - `12f72c6` — `feat(core): add payload v2.0 types and gateway port interfaces` (#4)
  - `6cad1a8` — `docs(roadmap): update Phase 2 exit criterion to seed policy` (#5)
- **`@saci/core` source** (all ≤ 190 lines, R5-clean):
  - `transform.ts` (190) + `transform.test.ts` (128) — six pure transforms,
    five constants/regexes.
  - `policy.ts` (96) + `policy.test.ts` (91) — `summaryTokens`,
    `bestMatchByTokenOverlap`, `pickCopy`, `STOPWORDS_PT`.
  - `types.ts` (9) — `CopySource`.
  - `payload.ts` (78) — payload v2.0 types (`Issue` + top-level).
  - `gateways.ts` (47) — `JiraGateway`, `SheetGateway`, `DriveGateway` ports.
  - `workspace.ts` (54) — `Workspace`, `TaskManifest`, `WorkspaceEvent(Type)`.
  - `index.ts` (40) — incremental barrel; `SACI_CORE_PHASE` kept.
- **`docs/ROADMAP.md`** — Phase 2 exit criterion widened to the full Python seed
  (both `lib_transform.py` and the shape-independent policy in `fetch.py`).
- **PR #43** — https://github.com/rafaelsilvalor/saci/pull/43
  (`feat(core): port Python domain layer to @saci/core (019)`), filled per the
  template. Open, unmerged.
- **This recap** — `docs/sessions/2026-06-06-executor-019-core-domain-port.md`.

## Verification summary (brief 019 Edits 1–5)

- **All Pauses honored.** Pause 1 (`Plan required: yes`) — plan presented, three
  Q's resolved by mentor, approved. Pause 2 — fired after the first modified file
  (`transform.ts`) before tests/index. Pause 3 — gated every commit (#2–#5) on
  explicit mentor approval.
- **`pre-commit-self-audit`: all PASS** on commits #2–#5 (5 checks each), zero
  WARN/FAIL. Subjects ≤ 72 chars; verbs (`port`, `add` ×2, `update`) all inside the
  allowlist SSOT.
- **Build + test:** `tsc -p packages/core` exit 0 (strict, no `any`, no
  `@ts-ignore`); `node --test` against compiled `dist` → **34 pass / 0 fail**.
- **R25:** `grep -rn 'from.*adapter' packages/core/src/` → zero matches (after the
  JSDoc reword). Dependency direction holds.
- **`automation/` untouched** — `git diff --name-only main...HEAD` shows no
  `automation/` paths (frozen reference respected).
- **No co-author trailers; no `--no-verify`** — pre-commit hook ran on every commit.
- **All four Judgment flags held:** Flag 1 (purity — no dict navigation in core),
  Flag 2 (payload fidelity — grounded), Flag 3 (STOPWORDS_PT verbatim), Flag 4
  (package boundary — only `packages/core/**` + the one `docs/ROADMAP.md` fix).
- **Honest test correction noted:** while writing `transform.test.ts` the executor
  found two of its own expectations wrong (`concurso` is a STOPWORDS_SLUG entry;
  `"demanda"` fallback needs all-length-≤1 tokens) and **fixed the tests, not the
  source** — Python behavior preserved (D4).

## Next concrete action

PR #43 is merged (`main@b7adcaf`). Remaining: run close-task cleanup (delete the
`feat/core-domain-port` branch), re-upload the canonical `packages/core` files +
ROADMAP + brief + this recap to the claude.ai project knowledge, and model the
**Jira adapter brief** (Phase 3/4) — the first consumer of the three ports.

## Snippet for the next session

```
Olá. Modo: [continuar | modelar tarefa].

Continuação de 2026-06-06-executor-019-core-domain-port.
Brief 019 = PRIMEIRO brief de código v2 + primeira adoção de EARS.
Pipeline completo (planner → brief-validator → executor), 5 commits
em feat/core-domain-port, PR #43 squash-merged → main@b7adcaf.

Entregue em @saci/core (packages/core/src/):
- transform.ts/policy.ts/types.ts/payload.ts/gateways.ts/workspace.ts
- 6 transforms puros + summaryTokens/bestMatchByTokenOverlap/pickCopy
- tipos payload v2.0, ports Jira/Sheet/Drive, Workspace/TaskManifest
- ROADMAP: critério Fase 2 alargado pro seed completo
- tsc strict exit 0; node:test 34 pass/0 fail; R25 grep limpo

Decisões que valem carregar:
- seed Python (automation/) é FROZEN REFERENCE (PR #42) — não editar
- parseEntrega: parser wall-clock à mão, sem new Date(); midnight→"";
  isValidYmd rejeita datas impossíveis nos dois branches
- STOPWORDS_PT/regex portados verbatim; summaryTokens NÃO normaliza
  acento (o Python não normaliza); empate do argmax: primeiro vence (>)
- CopySource em types.ts (commit #3); SACI_CORE_PHASE mantido; index
  incremental
- metades acopladas ao Jira (build_issue_entry, adf_extract_*, navegação
  de resolve_copy/best_sister_match) FICARAM DE FORA → brief do adapter

Pendências carregadas:
- próximo brief natural: ADAPTER JIRA (Phase 3/4), primeiro consumidor
  dos ports; porta build_issue_entry + ADF + navegação
- claimed_by (concorrência), derivePath, FieldMapping, filtro/JQL: Phase 3
- consolidar summaryTokens/tokensForPairing: adiado (muda comportamento)
- pós-merge: deletar branch, re-upload no project knowledge, mergear recap

Antes de propor próximo passo, confirma quem entendeu que sou e
o modo da sessão.
```
