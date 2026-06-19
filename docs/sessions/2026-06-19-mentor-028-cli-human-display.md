# Session recap — 2026-06-19 — 028-cli-human-display

**Mode:** mentoring (thread ordering) → continuing, hosting the mentor
gate's first live run.
**Mentor:** Claude Chat (this session).
**Executor (separate Code session):** Claude Code — full caminho A
pipeline (planner → brief-validator → mentor gate → executor).
**Task status:** brief 028 complete on `feat/cli-human-display` (3
commits); not pushed, no PR — Rafael's call (R17 / G-R5).
**This recap merges via a single docs PR** alongside the executor 028
recap (026/027 precedent).

## Context

Closes the first item of the post-027 thread: the Phase 3 CLI
**human-facing display** layer. The 026 on-ramp printed one minimal line
per command; 028 turns that into readable output. Ordering ratified this
session: **display first** (delegate-ready, lower architectural risk,
field-agnostic so no churn from the next task), **then input-side
FieldMapping** (carries an open design sub-question), **then (b) state
design** (needs the `derivePath` D-set first). Both remaining items are
app-code → planner pipeline.

This was the **mentor gate's first live exercise** (the gate doc shipped
in 027).

## Decisions taken (mentor-side, this session)

- **Thread ordering ratified:** display → FieldMapping (micro-D-set
  first) → state design (`derivePath` D-set first). → this recap.
- **Gate verdict (028): proceed to executor as scoped** — no color, no
  new dep, no argv flag. The planner correctly routed the ⚠️ here
  (color / verbose-dump would need a dep [D4-blocked] or an argv flag
  [026-frozen]); ruled deferrable without churn — the pure formatter is
  the stable core, color/JSON are additive later — and keep the on-ramp's
  blast radius small. → AGENT_PLAYBOOK Ch. 6 gate (already SSOT).
- **Pause 2 R9 ruling: headers all-English** — `KEY / STATUS / DELIVERY /
  SUMMARY`. A mixed-language header fails R9 under either classification
  (console/agent-consumed → English-only; or UI → no inline pt-BR literal
  without an i18n layer). `ENTREGA → DELIVERY` reverted to the approved
  Pause-1 label. No i18n layer, no `TODO(i18n)` — bilingual designer
  labels are a deferred task. → this recap.
- **Parent column header = `SUMMARY`** (not `TASK`): honest to what
  renders today, since `parent_summary` is empty in practice and falls
  back to the issue's own `summary`. Revisit (`Parent` / `Epic`) when
  `parent_summary` is populated. → this recap.

## What shipped (028)

`feat/cli-human-display`, 3 commits:

1. `395f3fe` — docs(tasks): add brief for 028-cli-human-display
2. `a8c7b87` — feat(cli): add human-facing display formatter for fetch and export
3. `2227e31` — feat(cli): wire human-facing display into the cli shell

A pure, unit-tested `display.ts` (D3 boundary clean — no `process` / `fs`
/ clock; `cli.ts` owns the write), rendering an aligned `fetch` listing +
summary and a single `export` confirmation line. Displayed columns are a
declared id list anchored to `ExportColumnId` via `satisfies` (D2
enforced at compile time — an improvement over a runtime re-export).
Final fetch columns: `key`/KEY, `status_jira`/STATUS, `entrega_iso`/
DELIVERY (null → `—` placeholder, never literal "null"), `parent_summary`
/SUMMARY (fallback to `summary`). No color, no dep, no argv flag, no
width detection — the gate ruling held throughout.

Two judgment calls endorsed at Pause 1:

- **JC1 — render from Issue fields directly, not via `projectIssue`.**
  Correct: `projectIssue` needs an `ExportContext` (operator / baseUrl)
  the fetch path does not carry; the chosen subset is all plain payload
  fields, so id→field is an identity lookup with no duplicated mapping.
  **Forward-constraint:** derived/projected columns (browse / `copy_url`)
  stay out of the display path until the fetch path carries an
  `ExportContext` — do not synthesize one.
- **JC2 — export line keeps the 026 wording**, now produced by the
  formatter. Uniform seam, no info lost.

## Pipeline trace (gate's first live run)

P4 → slot 028 confirmed (three sources agreed). brief-validator →
APPROVED 11/11. **Mentor gate → authorized as scoped.** Pause 1 → plan
approved, JC1/JC2 endorsed. Pause 2 → **R9 violation caught** (pt-BR
`ENTREGA` in an English header row), ruled all-English; fixed before
Edit 3. Pause 3 ×2 → both commits clean, self-audit 5/0/0, R13 honored.

The one substantive intercept was the Pause-2 language regression —
exactly the semantic drift the gate + non-auto-advancing Pauses exist to
catch. The executor had initially folded the relabels in as "confirmed at
Pause 1" when Pause 1 had approved `Delivery` / `Summary`; the discipline
note (surface relabels as deviations, not "confirmed") was carried
forward to the executor.

## Deferred follow-ups (durable here; promote via a future docs PR or when the task opens)

| Item | Destination |
|---|---|
| CLI display polish & flags: terminal-width truncation, TTY-aware color, `fetch --json` + verbose warning dump | ROADMAP parking-lot / future brief (all behind the argv surface or a dep) |
| CLI i18n layer (bilingual designer labels) | future task — the trigger that flips CLI output from console/English to UI/bilingual |
| R9 does not classify CLI human-facing output (1st occurrence; working ruling = console/English until a CLI i18n layer exists) | observation; promote to `CLAUDE.md` R9 or GOTCHAS only on recurrence (rule-of-three) |
| JC1 forward-constraint: display reads raw payload fields; derived/projected columns need an `ExportContext` on the fetch path | GOTCHAS candidate |
| `parent_summary` populated → revisit the SUMMARY header (`Parent` / `Epic`) | ties to the existing `parent_summary` backlog item |

## Meta-items status

- **R9 / CLI-output classification — NEW, 1st occurrence.** Working
  ruling logged above; not yet promoted to a rule.
- **Executor relabel-as-"confirmed" — process note** carried to the
  executor this session. Watch for recurrence.
- **project-instruction §8 vs MENTOR_BRIEF §8** — the claude.ai
  project-instruction surface still lists "modelar tarefa" as a mode;
  §8 has four modes since 015. Not re-triggered this session (the opener
  offered the valid `[mentoria | continuar]`), but the drift in the
  instruction text persists. Still logged, not yet actioned.
- **Still open (unchanged from 027):** M-R15 wording loosening; caminho-B
  verb pre-flight → SSOT; `customfield_` / grep tightening; Judgment-flags
  mentor-side doc; orphaned `E4` grep; `C11` hygiene; "old 013"
  parking-lot; `parent_summary` parking-lot; resume-scoped-to-remaining-
  Edits + find-block-mismatch hazard doc.

## Operational — close-out pending

- **028:** push `feat/cli-human-display` and open the PR vs `main` with
  the template — Rafael's call. 028 touched no canonical doc (only
  `docs/tasks/028-*` + `packages/cli` code), so there is **no
  project-knowledge re-upload** for the task itself.
- **Recaps:** this mentor recap + the executor 028 recap merge via a
  single docs PR (026/027 precedent). After that PR merges, re-upload
  **both recaps** to project knowledge — no other canonical file changed.

## Next concrete action

Open the next chat session (mentoring / continuing) to close the
**input-side FieldMapping micro-D-set** before delegating to the planner.
Open sub-questions to decide in chat:

1. Where the per-project Jira customfield config lives (a CLI config
   file? a profile block like export's? environment?).
2. Its schema, and how `customfield_*` isolation from `core` is enforced
   at the boundary.
3. Whether this is the "second real use case" that finally names the
   `FieldMapping` type (deferred pending exactly that).

Then it goes to the planner pipeline (caminho A, the gate's second live
run). Last in the cluster: **(b) Phase 3 state design**, which needs the
`derivePath` D-set closed in chat first.

## Snippet for the next session

```
Olá. Continuando o projeto Saci. Modo: [mentoria | continuar].

Continuação de 2026-06-19-mentor-028-cli-human-display.
Brief 028 (CLI human-facing display) completo em feat/cli-human-display
(3 commits: 395f3fe brief, a8c7b87 formatter, 2227e31 wire). Caminho A
completo — primeiro exercício ao vivo do mentor gate: validator APPROVED
11/11 -> gate autorizou as scoped -> Pausa 1 (JC1 sem projectIssue + JC2
export 026 endossados) -> Pausa 2 (pego R9: ENTREGA pt-BR em header
English -> ruling all-English KEY/STATUS/DELIVERY/SUMMARY) -> Pausa 3 x2
limpas. Push/PR da 028 = tua chamada.

Decisoes da sessao (nao reabrir): ordem do thread display -> FieldMapping
(micro-D-set antes) -> state design (derivePath D-set antes); gate 028 as
scoped (sem cor/dep/flag/width); header SUMMARY (nao TASK), honesto ao
parent_summary vazio.

Operacional (confirmar no inicio):
- Docs PR unica (mentor + executor 028) mergeou? Pos-merge: re-upload dos
  dois recaps no project knowledge (nenhum outro canonico mudou).

Proximo: fechar o micro-D-set da input-side FieldMapping em chat -
(1) onde mora o config de customfields por projeto; (2) schema +
isolamento de customfield_ fora do core na fronteira; (3) se este e o
"segundo caso de uso" que nomeia o tipo FieldMapping. Depois -> planner
(2o gate ao vivo). Por ultimo do cluster: (b) state design (derivePath).

Backlog meta (carregado): CLI display polish & flags (parking-lot);
CLI i18n layer; R9/CLI-output (1a ocorrencia); JC1 forward-constraint
(GOTCHAS); M-R15 wording; project-instruction §8 vs MENTOR_BRIEF §8;
caminho-B verb pre-flight -> SSOT; customfield_ grep; Judgment-flags doc;
E4 orfao; C11; "old 013"; parent_summary; resume-scoped + find-block.

Compact mode ativo (M-R7). Sem simbolos incomuns.
Antes de propor proximo passo, confirma quem entendeu que sou e o
modo (M-R13).
```
