# Mentor recap — Jira adapter, brief 020 (scoping → close)

Date: 2026-06-07 (BRT)
Mode: mentoring — spanned scoping, plan review, code review, and session close in
one sitting (§8 modes are not exclusive within a session).
Outcome: Brief 020 (the Jira adapter) was scoped, authored by the planner, executed
through 6 Edits, and merged. **PR #46 squash-merged → `main@7213d24`.**
`@saci/adapter-jira` is now the first consumer of the three 019 ports.

## What happened this session

- Scoped the Jira adapter brief from the continuation message: cut the scope to the
  Jira adapter alone (deferred Sheet/Drive adapters), closed four decisions (D1–D4).
- Ran the **mentor-review gate** by hand: planner authored the brief and stopped
  before the validator; I reviewed and sent two amendments; validator returned
  APPROVED; executor ran with Pause 1/2/3, each Pause 3 reviewed here before commit.
- Closed the task: PR #46, squash-merge, branch deleted, STATE.md removed.

## Architectural decisions (realized in main)

- **D1 — seam, not type.** Field-meaning → Jira-id mapping is isolated; the
  `customfield_*` literals live in exactly one module (`field-mapping.ts`), grep-
  verified to a single file. Ids are injected (cleaner than the planned "fields.ts
  holds them" — the extraction functions take ids as parameters, so even `extract.ts`
  and `mapper.ts` are literal-free). The named `FieldMapping` type stays deferred
  (A3/R19). The Phase-3 editable filter/mapping feature remains additive.
- **D2 — port as-is, core untouched.** `JiraGateway.fetchIssues(): Promise<Issue[]>`
  implemented as declared; JQL/auth/baseUrl/mapping injected at construction; adapter
  imports core policy (direction adapter → core, R25). `packages/core` not touched.
- **D3 — envelope deferred.** Port returns `Issue[]`; `filtered_out`/`warnings`,
  `payload.json`, and the Sheet write are deferred to a coordination-mode brief. Drops
  and partial failures are **logged** via injected sinks (R4), not serialized.
- **D4 — raw `fetch`, no SDK.** Thin wrapper over global fetch (R2, no dep), injectable
  transport. Endpoint `POST /rest/api/3/search/jql` with `nextPageToken`/`isLast`
  cursor pagination and Basic auth — **confirmed live** against Atlassian docs at
  Pause 1 (legacy `GET /rest/api/3/search` deprecated 2025). Pagination loop covered
  by test.

## Process learnings (the load-bearing part)

- **Executor auto-advance recurred — rule-of-three confirmed.** After "proceed to
  Pause 2", the executor wrote the first module and ran ~20 tool uses without
  surfacing it for the semantic Pause 2; it was treating Claude Code's per-command
  bash-permission prompts as the gate, not the brief's Pause. This is the third
  auto-advance instance (planner→validator in 019; now executor→past-Pause-2). The
  meta-item "executor.md STOP-guard calibration" moves from observation to a
  **decision: fix executor.md** so the brief's Pauses are enforced semantically and
  not conflated with the host's permission prompts. **This is the top open item.**
- **The manual mentor-review gate paid off every time.** Inserting a human review
  between stages caught: the unapproved `extract.ts` deviation, the `.json`-vs-`.ts`
  fixture/dist hazard, the untested pagination loop, the pt-BR commit body (R9), and
  the correct STATE.md handling. Evidence supporting the AGENT_PLAYBOOK gate item
  (add an explicit planner→validator review point).
- **"Ratify the artifact, fix the process."** `extract.ts` consolidated the planned
  `adf.ts` + `fields.ts` without a STOP-confirm — a plan deviation — but the code was
  faithful and clean, so it was ratified and the module map adjusted. Good code does
  not excuse the silent deviation; the response is to keep the artifact and tighten
  the pause discipline, not to revert.
- **Power-outage recovery.** Power dropped mid brief-amend. Recovery: no `index.lock`;
  `git status` + `git log` + `git reflog` + `git diff f856c81 HEAD` showed a single
  clean amend with both corrections intact and the file not truncated. Git committed
  state is durable; the reflog is the safety net. STATE.md was created as insurance
  for the rest of the run and removed at close (G-R10).
- **`.ts` fixtures are dist-safe; `.json`+fs is not.** Tests run against compiled
  `dist/` and `tsc` does not copy `.json` there, so JSON fixtures need a copy step or
  fail to resolve. `.ts` fixture modules compile automatically — no build-config
  change, typed. Reusable pattern for the Sheet/Drive adapters.
- **Untested network loops are silent data-loss risk.** The pagination loop shipped
  untested in Edit 5 (single-page fixtures, "each search ran 1×"). It runs in
  production whenever a search exceeds `DEFAULT_MAX_RESULTS` (50) — the design team
  will hit that. Added a multi-page test before close.
- **R9 covers the commit body, not just the subject.** The proposed Edit-2 body was
  pt-BR; the pre-commit-self-audit checks format/scope, not language, so it would
  have slipped. Caught at review.
- **Tight grep (`customfield_[0-9]`).** The executor used the numeric-literal pattern,
  not bare `customfield_`, distinguishing real ids from prose mentions — progress on
  the "tighten the grep" meta-item.

## Meta-items status

- **executor.md STOP-guard calibration → now a decision (fix needed).** Top priority.
- AGENT_PLAYBOOK planner→validator review gate — supported by this session's evidence;
  still to document.
- Tighten R25/`customfield_` grep — partially exercised (executor used the tight
  pattern); formalize in SKILL.md.
- Still open from before: document the `## Judgment flags` block on the mentor side;
  grep orphaned `E4`; 2026-05-31 recap C11 hygiene; "old 013" parking-lot.

## Close-out still pending (operational)

- Re-upload canonical files to the claude.ai project knowledge (manual sync):
  `packages/adapter-jira/src/**`, `docs/tasks/020-jira-adapter/brief.md` + `notes.md`.
  Without this the next session reads stale state.
- Executor recap (its own docs PR) and **this mentor recap** (separate docs PR,
  caminho B).
- Separate docs PR for the roadmap parking-lot: the `parent_summary` follow-up (the
  JQL endpoint omits the inline `parent.fields.summary`, so it is empty in practice;
  candidate to populate from the parent-search). Out of brief-020 scope.

## Next concrete action

Two threads, your pick of order:
1. **Fix executor.md** so Pauses are enforced semantically (rule-of-three reached).
   Pipeline/skill-modifying → caminho B per M-R15.
2. **Coordination-mode brief** — the deferred D3 envelope: `filtered_out`/`warnings`,
   the `Payload` wrapper, `payload.json`, and the Sheet write (needs `SheetGateway`,
   so this is also where the Sheet adapter lands or precedes). `derivePath` belongs
   here too. App code → planner-authored pipeline, not caminho B.

## Snippet for the next session

```
Olá. Modo: mentoria.

Continuação de 2026-06-07-mentor-020-jira-adapter.
Brief 020 (Jira adapter) mergeado — PR #46, main@7213d24. @saci/adapter-jira é o
primeiro consumidor dos ports do 019. extract.ts/navigation.ts/mapper.ts/http.ts/
gateway.ts/field-mapping.ts + fixtures .ts em main.

Decisões fechadas (D1–D4): seam não-tipo (customfield só em field-mapping.ts, ids
injetados); port as-is, core intocado; envelope diferido (Issue[], drops logados);
fetch cru, sem SDK, endpoint /search/jql confirmado vivo + paginação testada.

Dois threads abertos, na ordem que eu decidir:
1. Fix do executor.md — Pauses semânticas (auto-avanço bateu rule-of-three: o
   executor passou do Pause 2 tratando os prompts de bash do Claude Code como o
   gate). Pipeline/skill-modifying → caminho B (M-R15).
2. Coordination brief — envelope D3 diferido (filtered_out/warnings, Payload,
   payload.json, Sheet write + SheetGateway, derivePath). App code → planner.

Follow-ups: parent_summary (notes.md → parking-lot do roadmap, PR docs separado);
Sheet/Drive adapters; itens meta (Judgment flags doc, E4 órfão, grep tight).

Antes de propor próximo passo, confirma quem entendeu que sou e o modo (M-R13).
```
