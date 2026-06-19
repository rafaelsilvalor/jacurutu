# Session recap — 2026-06-19 — 028-cli-human-display

**Mode:** caminho A — full pipeline `planner → brief-validator → mentor
gate → executor`. This was the **mentor gate's first live run** (the gate
shipped in 027).
**Executor:** Claude Code (this session), driving the `planner`,
`brief-validator`, and `executor` subagents in sequence.
**Orchestrator:** this Code session hosted the pipeline and relayed each
mentor ruling; the mentor (chat session) gave the gate verdict and every
Pause go.
**Task status:** brief 028 complete, **merged** — PR #69 (squash) on
`main` (`65442e0`); branch `feat/cli-human-display` deleted local + remote.
**This recap merges via a single docs PR** alongside the mentor 028 recap
(026/027 precedent).

## Context

First item of the post-027 thread: the Phase 3 CLI **human-facing
display** layer. Brief 026 wired `runFetch` / `runExport` into `saci
fetch` / `saci export`, each printing one minimal result line (the
on-ramp). Brief 028 turns that into readable status output for the
designer — the non-technical user base — without touching the fetch
contract or the data model. It consumes what `runFetch` / `runExport`
already return.

Display was sequenced first in the cluster (delegate-ready, lower
architectural risk, field-agnostic so no churn from the next task), ahead
of input-side FieldMapping and Phase 3 state design.

## Mentor-closed decisions carried into the brief (D1–D4, not reopened)

- **D1 — Rendering layer inside `@saci/cli` only.** Consumes the current
  return values of `runFetch` / `runExport`; does not touch `core`, the
  adapters, or `run-fetch.ts` / `run-export.ts` internals (read for
  grounding only).
- **D2 — Field-agnostic rendering.** Render against the payload contract /
  `EXPORT_COLUMNS` as the column reference, not a hardcoded field list —
  so the layer survives the next task (input-side FieldMapping) without
  rework.
- **D3 — Formatting logic is a pure, unit-tested module** in
  `@saci/cli/src/`, mirroring the 026 `argv.ts` pure-parser pattern. Real
  I/O (the console write) stays in the shell (`cli.ts`).
- **D4 — No new runtime dependency (R2).** Plain string formatting; no
  table/color library.

## Pipeline trace (gate's first live run)

- **P4 (planner)** → slot **028** confirmed across three sources: `ls
  docs/tasks/` topped at `027-playbook-mentor-gate`; `git log --oneline
  main` showed 027 merged via #67–#68, nothing higher; `CLAUDE.md` E-block
  stops at `E5`, reserves no slot ≥ 026.
- **brief-validator** → **APPROVED 11/11**, commit `395f3fe`.
- **Mentor gate** → **authorized as scoped** (no color, no dep, no argv
  flag). The planner correctly routed the ⚠️ to the gate (rich color /
  verbose warning dump would need a dep [D4-blocked] or an argv flag
  [026-frozen]); ruled deferrable.
- **Pause 1** → plan approved; **JC1 / JC2 endorsed** (below).
- **Pause 2** → **R9 violation caught** (pt-BR `ENTREGA` in an otherwise
  English header row); ruled all-English; fixed before Edit 3.
- **Pause 3 ×2** → both commits clean, `pre-commit-self-audit` 5/0/0, R13
  honored (no `--no-verify`).

## Micro-decisions ratified at the Pauses

- **Pause 1 — two judgment calls endorsed.**
  - **JC1 — render from `Issue` fields directly, not via `projectIssue`.**
    Correct: `projectIssue` needs an `ExportContext` (operator / baseUrl)
    the fetch path does not carry; the chosen subset is all plain payload
    fields, so id→field is an identity lookup with no duplicated mapping.
    **Forward-constraint logged:** derived/projected columns (browse /
    `copy_url`) stay out of the display path until the fetch path carries
    an `ExportContext` — do not synthesize one.
  - **JC2 — export line keeps the 026 wording**, now produced by the
    formatter. Uniform seam, no info lost.
  - One executor improvement on the Pause-1 sketch, surfaced and accepted:
    dropped the contrived runtime `EXPORT_COLUMNS` re-export in favor of a
    **type-only `import type { ExportColumnId }` + `satisfies`** clause —
    same D2 anchoring, enforced at compile time, no unused-value
    workaround.
- **Pause 2 — R9 header ruling.** A mixed-language header fails R9 under
  either classification (console / agent-consumed → English-only; or UI →
  no inline pt-BR literal without an i18n layer). Headers reverted to
  all-English: `KEY / STATUS / DELIVERY / SUMMARY`. `ENTREGA → DELIVERY`
  (the approved Pause-1 label); parent column header `SUMMARY` (not
  `TASK`) — honest to what renders today, since `parent_summary` is empty
  in practice and falls back to the issue's own `summary`. No i18n layer,
  no `TODO(i18n)` — bilingual designer labels are a deferred task. The
  `entrega_iso` **field id** stays as-is (established domain vocabulary;
  the ruling is headers only).
- **Pause 3 ×2 — both honored on explicit go.** Commit #2 (formatter +
  test) and commit #3 (cli.ts wire) each gated on an explicit mentor go.

## What shipped (028)

`feat/cli-human-display`, 3 commits:

1. `395f3fe` — docs(tasks): add brief for 028-cli-human-display
2. `a8c7b87` — feat(cli): add human-facing display formatter for fetch and export
3. `2227e31` — feat(cli): wire human-facing display into the cli shell

A pure, unit-tested `packages/cli/src/display.ts` (110 lines) + colocated
`display.test.ts` (112 lines):

- **Public surface:** `renderFetch(payload, outputPath): string` and
  `renderExport(result): string`. Both return strings; `cli.ts` owns the
  `process.stdout.write` (D3 — the module imports no `process` / `fs` /
  clock / network).
- **`fetch`:** aligned header + one padded line per issue, then a summary
  line `N issues[, M filtered out][, K warnings] → <path>` (counts only
  when non-zero — S3/S6, counts not row dumps). Empty `issues` → named
  `No issues matched.` line + path note (S5), never a blank listing.
- **Columns (D2):** declared `FETCH_COLUMNS` list anchored to
  `ExportColumnId` via `satisfies` — `key`/KEY, `status_jira`/STATUS,
  `entrega_iso`/DELIVERY (null/empty → `—` placeholder, never literal
  `"null"`), `parent_summary`/SUMMARY (fallback to `summary`). Adding or
  removing a column is a one-line edit; a typo'd id fails at compile time.
- **`export`:** single `wrote N rows to <path> (<format>)` line through
  the same formatter, including the `rowCount === 0` case stated
  explicitly.
- No color, no dep, no argv flag, no terminal-width detection — the gate
  ruling held end to end. `argv.ts`, `run-fetch.ts`, `run-export.ts`,
  `core`, and the adapters are absent from the diff. `cli.ts` change is
  +3 / −4 (import + two write-site swaps); exit-code taxonomy and the
  top-level try/catch untouched (R4).

## Verification summary (brief 028 Edits 1–3)

- **All Pauses honored.** Pause 1 (plan + JC1/JC2), Pause 2 (R9 fix), Pause
  3 ×2 each gated on explicit mentor go.
- **`pre-commit-self-audit`: 5/5 PASS** on both code commits. Subjects ≤ 72
  (66 and 55); type `feat`; verbs `add` / `wire` (both on the allowlist
  SSOT; `wire` consistent with the 026 dispatch-wiring commit); no
  co-author trailer; staged scope = edit scope.
- **Build/test gate green.** `tsc -b` clean; `node --test` full suite pass
  at each commit (136/136 after the wire commit).
- **Boundary gate.** Final `git diff --name-only main..HEAD` (pre-merge) =
  `docs/tasks/028-cli-human-display/brief.md`,
  `packages/cli/src/display.ts`, `packages/cli/src/display.test.ts`,
  `packages/cli/src/cli.ts`. Nothing else.
- **R13 honored** — pre-commit hook ran, no `--no-verify`.

## Learnings

- **`SendMessage` works in this environment — a change from 022/023/026/
  027.** Those sessions recorded "no `SendMessage` tool" and re-spawned a
  fresh executor per Pause, re-stating resume context each time. This
  session relayed every Pause go via `SendMessage` to the **persistent**
  planner/executor subagents (by agentId), so the subagent kept its full
  context across Pauses 1→2→3→3. Cheaper and lower-risk than re-seeding;
  the per-Pause context re-statement cost is gone. Worth confirming it
  persists next session before assuming it.

- **The mentor gate earned its first catch immediately.** APPROVED 11/11
  was mechanically clean, yet the Pause-2 `ENTREGA` header was a real R9
  regression the validator structurally cannot see. The gate + the
  non-auto-advancing Pauses are exactly what surfaced it before it reached
  `main` — the 027 doctrine validated on its first live run.

- **Relabel-as-"confirmed" is a drift to watch.** The executor initially
  presented `ENTREGA` / `TASK` as "confirmed at Pause 1" when Pause 1 had
  approved `Delivery` / `Summary`. Corrected at the Pause, and the
  discipline note (surface relabels as **deviations**, not "confirmed")
  was carried forward to the executor. Same note the mentor recap logs;
  recorded here for the executor side.

- **A `satisfies` type anchor beats a runtime re-export for D2.** The
  Pause-1 sketch reached for a runtime `EXPORT_COLUMNS` re-export to "use"
  the contract; the implemented `import type … + satisfies` gives the same
  compile-time guarantee with no runtime value and no unused-value smell.
  Field-agnostic anchoring is a type-level concern, not a value-level one.

- **Squash merge ⇒ `git branch -d` refuses; `-D` is correct and safe
  here.** PR #69 squashed the three branch commits into one `main` commit
  (`65442e0`), so Git did not see the branch's own commits as merged and
  `-d` declined. Verified the four files were already on `main` (via the
  `git pull` fast-forward) before forcing with `-D`. Expected behavior for
  squash, not a loss.

## Pending items

### This task

- **Done:** PR #69 pushed, opened, and **squash-merged** to `main`
  (`65442e0`) on explicit user instruction. Branch `feat/cli-human-display`
  deleted local + remote; working tree clean on `main`. This **updates**
  the mentor recap's "close-out pending" — the 028 task lifecycle is
  closed.
- **Recaps:** this executor recap + the mentor 028 recap merge via a single
  docs PR (026/027 precedent). 028 touched no canonical doc (only
  `docs/tasks/028-*` + `packages/cli` code), so the only post-merge project
  re-upload is the two recaps.

### Deferred follow-ups (durable in both recaps; promote via a future docs PR or when the task opens)

| Item | Destination |
|---|---|
| CLI display polish & flags: terminal-width truncation, TTY-aware color, `fetch --json` + verbose warning dump | ROADMAP parking-lot / future brief (behind the argv surface or a dep) |
| CLI i18n layer (bilingual designer labels) | future task — the trigger that flips CLI output from console/English to UI/bilingual |
| R9 does not classify CLI human-facing output (1st occurrence; working ruling = console/English until a CLI i18n layer exists) | observation; promote to `CLAUDE.md` R9 / GOTCHAS only on recurrence (rule-of-three) |
| JC1 forward-constraint: display reads raw payload fields; derived/projected columns need an `ExportContext` on the fetch path | GOTCHAS candidate |
| `parent_summary` populated → revisit the SUMMARY header (`Parent` / `Epic`) | ties to the existing `parent_summary` backlog item |

### Still open (carried, unchanged)

M-R15 wording loosening; caminho-B verb pre-flight → SSOT; `customfield_`
grep tightening; Judgment-flags mentor-side doc; orphaned `E4` grep; `C11`
hygiene; "old 013" parking-lot; resume-scoped-to-remaining-Edits +
find-block-mismatch hazard doc; project-instruction §8 vs MENTOR_BRIEF §8
drift.

## Next concrete action

Open the next chat session (mentoring / continuing) to close the
**input-side FieldMapping micro-D-set** before delegating to the planner
(the gate's second live run):

1. Where the per-project Jira customfield config lives (CLI config file? a
   profile block like export's? environment?).
2. Its schema, and how `customfield_*` isolation from `core` is enforced
   at the boundary.
3. Whether this is the "second real use case" that finally names the
   `FieldMapping` type.

Last in the cluster: **(b) Phase 3 state design**, which needs the
`derivePath` D-set closed in chat first.

## Snippet for the next session

```
Olá. Continuando o projeto Saci. Modo: [continuar | modelar tarefa].

Continuação de 2026-06-19-executor-028-cli-human-display.
Brief 028 (CLI human-facing display) COMPLETO e MERGEADO — PR #69
(squash) em main (65442e0). Branch feat/cli-human-display deletada
(local + remoto). 3 commits originais: 395f3fe brief, a8c7b87 formatter,
2227e31 wire.

Caminho A completo — 1º run ao vivo do mentor gate: validator APPROVED
11/11 -> gate as scoped (sem cor/dep/flag/width) -> Pausa 1 (JC1 sem
projectIssue + JC2 export 026 endossados; satisfies em vez de re-export
runtime) -> Pausa 2 (R9: ENTREGA pt-BR em header English -> ruling
all-English KEY/STATUS/DELIVERY/SUMMARY) -> Pausa 3 x2 limpas, audit
5/5, verbos add/wire na allowlist.

Aprendizados:
- SendMessage FUNCIONA neste ambiente (mudança vs 022/023/026/027):
  subagentes persistentes, Pause->go por agentId, sem re-spawn. Confirmar
  que persiste antes de assumir.
- mentor gate pegou o catch logo no 1º run (R9 que o validator não vê)
- relabel-as-"confirmed" é drift a vigiar (nota carregada ao executor)
- satisfies type-anchor > re-export runtime para o D2
- squash merge -> branch -d recusa; -D é correto (verificar arquivos já
  em main antes)

Decisões (não reabrir): ordem do thread display -> FieldMapping
(micro-D-set antes) -> state design (derivePath antes); header SUMMARY
(não TASK), honesto ao parent_summary vazio; sem i18n/TODO(i18n).

Operacional (confirmar no início):
- Docs PR única (mentor + executor 028) mergeou? Pós-merge: re-upload dos
  dois recaps no project knowledge (nenhum outro canônico mudou).

Próximo: fechar o micro-D-set da input-side FieldMapping em chat —
(1) onde mora o config de customfields por projeto; (2) schema +
isolamento de customfield_ fora do core; (3) se é o "2º caso de uso" que
nomeia o tipo FieldMapping. Depois -> planner (2º gate ao vivo). Por
último do cluster: (b) state design (derivePath).

Backlog meta (carregado): CLI display polish & flags (parking-lot); CLI
i18n layer; R9/CLI-output (1a ocorrência); JC1 forward-constraint
(GOTCHAS); M-R15 wording; verb pre-flight -> SSOT; customfield_ grep;
Judgment-flags doc; E4 órfão; C11; "old 013"; parent_summary;
resume-scoped + find-block; project-instruction §8 vs §8.

Antes de propor próximo passo, confirma quem entendeu que sou e o modo.
```
