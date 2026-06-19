# Session recap — 2026-06-19 — mentor — 027-playbook-mentor-gate

**Mode:** mentoring + caminho B (mentor-authored brief under the M-R15
pipeline-modifying exception). Chat closed the design and authored the brief;
Code ran the executor directly, skipping planner and validator.
**Merged via:** PR #67, squash → `main@218b0e4`.

## Context

Brief 027 is the **(c) thread item** — the planner→validator→mentor gate, the
leading meta candidate carried since brief 019 and evidenced across sessions
019, 020, 021, 023, and 026. It documents a mandatory **mentor gate** at the
`validator-APPROVED → executor` seam in `docs/AGENT_PLAYBOOK.md` Chapter 6.

Before 027, Chapter 6's invocation pattern read, at step 5: on `Verdict:
APPROVED` the orchestrator invokes the executor directly. No documented human
review window sat between the validator's pass and the executor touching the
tree. The gate had been operating ad hoc — the recaps call it "the manual
mentor-review gate kept paying off" — but it was not doctrine. 027 makes it
required.

This is a pipeline-modifying brief: it redesigns the chapter the planner would
read to plan. Per Chapter 6's own "When NOT to use the pipeline" rule, it cannot
be planned by the agent reading the old chapter, so it went caminho B (chat as
writing partner) and straight to the executor.

**Slot numbering (P4):** verified free across three sources before authoring —
`ls docs/tasks/` highest was `026-cli-argv-dispatch`; `git log --oneline main`
newest merged was brief 026 (PR #65, `3004e69`); `CLAUDE.md` `E*` block stops at
`E5`. Recap PRs do not consume task slots. No conflict; `027` was free.

## Decisions realized

Closed in chat and ratified before the brief was authored. The executor
implemented; it did not revisit.

- **D1 — Single gate at `APPROVED → executor`.** No second gate at
  `planner → validator`: the validator is already the mechanical audit of the
  planner's output, so a human gate there duplicates it without evidence of
  capture. The evidenced auto-advance is the post-APPROVED seam.
- **D2 — Hard semantic STOP.** The orchestrator surfaces the brief, the
  validator report, and the brief commit's diff, then waits for an explicit go.
  It must not read Claude Code's per-command permission prompts as the go, and
  must not proceed on silence — the same Pause semantics the executor obeys
  during a run, lifted to the orchestration layer.
- **D3 — Rejection reuses the existing REJECTED protocol.** The three responses
  under "Verdict handling" (return to chat, fix on branch, override) serve both
  a REJECTED verdict and a gate rejection. No new path invented.
- **D4 — Documentation surface is `AGENT_PLAYBOOK.md` Chapter 6 only,** plus the
  new Lesson #14. The three agent files are untouched: a subagent does not see
  parent-session history and cannot enforce an orchestrator-level checkpoint, so
  there is nothing to change in them. `harness/` invocation surfaces were
  considered and deliberately deferred (no second-occurrence evidence).
- **D5 — Scope kept tight to the gate.** No bundling of adjacent backlog items
  (M-R15 wording, verb pre-flight SSOT).

## Edits applied

- **Commit #1** — brief, committed verbatim after the on-disk verification + P4
  slot check (`docs(tasks): add brief 027 playbook mentor gate`).
- **Commit #2** — `docs/AGENT_PLAYBOOK.md` (+13 / -1), two sub-edits in one
  commit (`docs(playbook): document the mentor gate at the APPROVED seam`):
  - **2a** — invocation-pattern step 5 rewritten: APPROVED now halts at the gate
    and surfaces the three artifacts, instead of auto-invoking `@executor`. Step
    6 (REJECTED) byte-identical.
  - **2b** — new subsection "### The mentor gate (APPROVED → executor)" inserted
    between Lesson #12 and "When NOT to use the pipeline", carrying **Lesson
    #14 — The gate is the human's, not the validator's.** No other lesson
    renumbered.

## Process learnings (the load-bearing part)

- **The brief validated itself on its own run.** Brief 027 documents the gate;
  its commit #2 was held at Pause 3 for an explicit mentor go before committing.
  The brief that installs the gate passed through the gate it installs — the same
  self-validating shape as 021, where the auto-advance fix executed with zero
  auto-advance. When the next pipeline task runs through the full
  planner→validator path, its first APPROVED is the gate's first live exercise.
- **Verb pre-flight held.** Commit subjects led with `add` and `document`, both
  confirmed on the SKILL.md allowlist at Pause 3 — no STOP, unlike 024's
  `record`/`demote`. The caminho-B verb pre-flight (checking subject verbs before
  authoring, not at audit) again earned its place; still the SSOT candidate from
  025.
- **STOP guards held with zero divergence.** Both find-blocks in Edit 2 were
  built from the project-knowledge snapshot, not the live file; both matched the
  live `AGENT_PLAYBOOK.md` exactly. No regeneration from memory. The
  find-block-mismatch hazard did not fire this session, but the guard is why it
  was safe to author blind to the live bytes.
- **Mode/§8 drift caught at session start.** The chat project-instruction wording
  still lists "modelar tarefa" as a §8 mode; `MENTOR_BRIEF.md` §8 was redesigned
  in brief 015 to four modes (mentoring / reviewing a plan / code review /
  continuing), folding modeling and pipeline-doc authoring into mentoring +
  caminho B. Level-2 (MENTOR_BRIEF) prevailed over level-3 (project
  instructions) per the source hierarchy; the deviation was flagged, not
  silently resolved. New convention note below.

## Meta-items status

- **(c) planner→validator→mentor gate → DONE (merged in 027).** Removed from the
  active thread; the AGENT_PLAYBOOK chapter is now the SSOT for the gate.
- **M-R15 wording loosening** — still open; 027 is one more datapoint for the
  applied reading "pipeline agents or their skills" (the mentor authored a
  pipeline-doc brief under the exception). Evidence accumulates.
- **NEW — project-instruction §8 wording vs MENTOR_BRIEF §8.** The claude.ai
  project instructions still offer "modelar tarefa" as a live mode; §8 has four
  modes since 015. Not a repo file — it is the project-instruction surface the
  user edits — but worth aligning so the M-R13 mode declaration stops needing an
  in-line correction. First occurrence; logged, not yet actioned.
- **Still open (unchanged):** caminho-B verb pre-flight → SSOT (from 025; demote
  in allowlist); `customfield_`/grep tightening in SKILL.md; Judgment-flags
  mentor-side doc; orphaned `E4` grep; `C11` hygiene; "old 013" parking-lot;
  `parent_summary` parking-lot (separate docs PR); resume-scoped-to-remaining-
  Edits + find-block-mismatch hazard doc.

## Close-out pending (operational)

- `main@218b0e4` carries brief 027 + the gate doc. Branch cleanup done:
  `docs/playbook-mentor-gate` deleted local and remote.
- **Recaps via a single docs PR (caminho B), per the 026 convention.** This
  mentor recap joins the executor recap on `docs/session-recap-027`. Save this
  to `docs/sessions/2026-06-19-mentor-027-playbook-mentor-gate.md`, commit it
  onto that branch, then push and open the one docs PR. Push/PR are the user's
  call (R17 / G-R5).
- **§2 active-focus refresh rides this same docs PR** (026 precedent). Item #1
  (argv dispatch) shipped in 026; the gate shipped in 027. The next product
  focus is the Phase 3 CLI surface. Proposed replacement line is in chat for
  ratification before it is committed onto the branch.
- **Project-knowledge re-upload (manual sync) after merge:** `AGENT_PLAYBOOK.md`,
  the refreshed `MENTOR_BRIEF.md`, and both 027 recaps. Blocks the next chat
  session from reading fresh versions.

## Next thread

The (c) cluster item is closed. Ratified order from session 026, now advanced:

- **Next:** Phase 3 CLI surface — **human-facing display** (turn the on-ramp's
  one-line output into real status output) and **input-side per-project Jira
  FieldMapping for `fetch`** (023 D5; `fetch` currently uses
  `DEFAULT_FIELD_MAPPING`). Internal order between the two is still open — close
  it in chat before delegating.
- **Then:** **(b) Phase 3 state design** — the app owns production state over
  time (local now); the `derivePath` hierarchy rule is the open design question
  and needs its D-set closed in chat before any brief.

Both are app-code tasks → planner pipeline (not caminho B), and the next one to
run the full path is the mentor gate's first live exercise.

## Snippet for the next session

```
Olá. Continuando o projeto Saci. Modo: [mentoria | continuar].

Continuação de 2026-06-19-mentor-027-playbook-mentor-gate.
Brief 027 mergeado (PR #67 squash → main@218b0e4): documenta o mentor
gate no seam validator-APPROVED → executor do AGENT_PLAYBOOK Chapter 6
(passo 5 reescrito + subseção "The mentor gate" + Lesson #14). Era o
item (c) do thread (evidência 019/020/021/023/026) — agora SHIPPED.
Caminho B, mentor-authored (exceção M-R15), executor direto sem
planner/validator.

Decisões realizadas (D1–D5, não reabrir): gate único em APPROVED →
executor (D1); STOP semântico duro, sem auto-advance, prompt de bash
do Code != go (D2); rejeição no gate reusa o protocolo REJECTED
(D3); superfície só AGENT_PLAYBOOK Chapter 6 + Lesson #14, agent
files intocados (D4); escopo estreito ao gate (D5).

THREAD — ordem ratificada (026), agora avançada:
- (c) gate: FEITO (027).
- Próximo: Phase 3 CLI surface — human-facing display E input-side
  FieldMapping p/ fetch (023 D5). Ordem interna entre os dois EM
  ABERTO; fechar em chat antes de delegar. App code → planner
  pipeline (não caminho B); é o primeiro exercício ao vivo do gate.
- Por último do cluster: (b) Phase 3 state design — precisa do D-set
  do derivePath fechado em chat antes.

Operacional (confirmar no início):
- Recap PR único (mentor + executor 027 + refresh §2) mergeou?
- Pós-merge: re-upload AGENT_PLAYBOOK.md + MENTOR_BRIEF.md + recaps
  no project knowledge.

Backlog meta (carregado): M-R15 wording; project-instruction §8 vs
MENTOR_BRIEF §8 (drift novo, 1ª ocorrência); caminho-B verb
pre-flight → SSOT; customfield_ grep; Judgment-flags doc; E4 órfão;
C11 hygiene; "old 013"; parent_summary; resume-scoped + find-block
hazard doc.

Compact mode ativo (M-R7). Sem símbolos incomuns.
Antes de propor próximo passo, confirma quem entendeu que sou e o
modo (M-R13).
```
