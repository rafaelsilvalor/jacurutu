# Session recap — 2026-06-19 — 027-playbook-mentor-gate

**Mode:** caminho B (mentor-authored brief, pre-saved to disk; **no planner, no
brief-validator**). This is a **pipeline-modifying** brief — it rewrites the
Chapter 6 the planner would otherwise read to plan, so per Chapter 6's own "When
NOT to use the pipeline" rule it cannot be planned by the agent reading the old
chapter.
**Executor:** Claude Code (this session), driving the `executor` subagent.
**Orchestrator:** mentor (chat session) authored the brief and gave the go at
each Pause; this Code session relayed each Pause and carried the approvals.
**Merged via:** not yet — **PR #67 open**, awaiting mentor-gate review. (Fitting:
the change documents the gate, and the PR now sits at its own gate.)

## Context

`docs/AGENT_PLAYBOOK.md` Chapter 6 documents the orchestration pipeline
`planner → brief-validator → executor`. Before this brief, invocation step 5
read: on `Verdict: APPROVED`, the main session **invokes the executor directly**
— no documented, mandatory human-review window between the validator's APPROVED
and the executor touching the working tree.

In practice that human review has been the catch across five sessions (019, 020,
021, 023, 026): recaps record "the manual mentor-review gate kept paying off" and
warn the orchestrator "can auto-advance past the human review window". The gate
was operating ad hoc, not as doctrine. This brief makes it required.

**Slot numbering (P4):** verified free across three sources before commit #1 —
`ls docs/tasks/` (highest was `026-cli-argv-dispatch`, no `027-*` other than this
one), `git log --oneline main` (newest merged was brief 026, PR #65 `3004e69`;
recap PRs do not consume slots), and `CLAUDE.md` `E*` block (stops at `E5`, no
nominal `027` reservation). No conflict.

## Decisions realized

Closed in chat (2026-06-19 mentor session, ratified) before delegation; the
executor implemented and did not revisit.

- **D1 — Single gate at `APPROVED → executor`.** No second gate at
  `planner → validator`: the validator is already the mechanical audit of the
  planner's output, so a human gate there would duplicate it without capture
  evidence. The evidenced auto-advance is at the post-APPROVED seam only.
- **D2 — The gate is a hard semantic STOP.** The orchestrator surfaces the
  artifacts and waits for an explicit human go. It must not treat Claude Code's
  per-command permission prompts as the go, and must not proceed on silence.
- **D3 — Rejection at the gate reuses the existing REJECTED protocol.** The
  three responses already under "Verdict handling" (return to chat, fix on
  branch, override) serve both a REJECTED verdict and a gate rejection. No new
  rejection path invented.
- **D4 — Documentation surface is `AGENT_PLAYBOOK.md` Chapter 6 only,** plus the
  new Lesson #14. Subagent files (`planner.md`, `brief-validator.md`,
  `executor.md`) and harness files are out of scope.
- **D5 — Scope stays tight to the gate.** No bundling of adjacent backlog items.

**Why subagents are untouched (D4 grounding):** the gate is enforced by the main
session (orchestrator). A subagent does not see parent-session history and cannot
enforce an orchestrator-level checkpoint, so there is nothing to change in
`planner.md` / `brief-validator.md` / `executor.md` — they were read for
grounding only.

## Micro-decisions ratified at the Pauses

- **Pause 1 — skipped** (no design left to plan; `Plan required: no`). All
  inserted/replacement text was specified inline as exact find/replace with
  STOP-if-mismatch guards; the design was closed and ratified in chat, leaving
  the executor no architectural choice.
- **Pause 2 — N/A.** One content file beyond the pre-saved brief
  (`AGENT_PLAYBOOK.md`), so there is no inter-file boundary to pause at; the two
  sub-edits (2a step-5 rewrite, 2b subsection insert) shipped in one commit.
- **Pause 3 ×2 — both honored on explicit go.** Commit #1 (the caminho-B brief,
  committed as-is, not regenerated) and commit #2 (the playbook edit) each gated
  on an explicit mentor go. Verb pre-flight done before authoring: `add` and
  `document` both confirmed on the allowlist SSOT
  (`.claude/skills/pre-commit-self-audit/SKILL.md`).

## Artifacts produced

- **Two commits on `docs/playbook-mentor-gate`** (2026-06-19):
  - `docs(tasks): add brief 027 playbook mentor gate` (`4d08c46`)
  - `docs(playbook): document the mentor gate at the APPROVED seam` (`3d2e9a6`)
- **`docs/AGENT_PLAYBOOK.md` Chapter 6 edits** (+13 / −1):
  - **2a** — invocation step 5 rewritten: `APPROVED` no longer auto-invokes
    `@executor`; it surfaces the brief + validator verdict report + brief commit
    diff, then halts at the mentor gate. Step 6 (REJECTED) left byte-identical.
  - **2b** — new subsection `### The mentor gate (APPROVED → executor)` inserted
    between the Lesson #12 blockquote and the `### When NOT to use the pipeline`
    heading. Carries **Lesson #14** ("The gate is the human's, not the
    validator's"). No other lesson renumbered (#12 and #13 intact).
- **PR #67** — `docs(playbook): document the mentor gate at the APPROVED seam`,
  filled per the template; docs-only test rows marked N/A. **Open, not merged.**
- **This recap** — `docs/sessions/2026-06-19-executor-027-playbook-mentor-gate.md`,
  on its own branch `docs/session-recap-027` per the recap convention (recaps
  ride a separate docs PR, not the task PR — cf. brief 026: recap PR #66 followed
  feature PR #65).

## Learnings

- **A pipeline-modifying brief cannot be self-planned — caminho B is the
  mechanism.** When the artifact under change is the very chapter the planner
  reads to plan, the planner would plan against stale doctrine. Chapter 6's own
  "When NOT to use the pipeline" rule names this; the brief was authored by the
  mentor as writing partner and run through the executor directly, skipping
  planner and validator. The brief itself was then committed as commit #1
  (verify-on-disk, not regenerate).

- **The gate is the catch the validator structurally cannot be.** APPROVED is
  the validator clearing *mechanical* drift; it is not a green light. A brief can
  be mechanically clean and still wrong — scope, grounding, or a closed decision
  that drifted in translation between delegation and brief. That judgment is the
  human's, which is why auto-loop-back to the planner was rejected at cluster
  design and the gate is documented as a hard semantic STOP (D2).

- **Exact find/replace with STOP-if-mismatch beats regenerate-from-memory.** Both
  find-blocks (the step-5 list, the Lesson #12 → heading boundary) matched the
  live file verbatim, so the replacements were surgical and the diff stayed
  confined to the two intended regions. The guard's value is the discipline:
  on a mismatch the executor STOPs and surfaces rather than re-locating by
  approximation.

- **No `SendMessage` in this environment (as in 022/023/026).** The executor
  subagent reported its agentId for resumption, but no `SendMessage` tool exists
  here. Commit #1's Pause→go was handled by re-spawning a fresh executor seeded
  with explicit resume state (branch already created, brief already staged,
  commit #1 pre-approved). Commit #2, already staged and audited by the subagent,
  was committed directly from the orchestrator after the go rather than paying
  for a third spawn. No work lost; cost is re-stated context per Pause.

## Verification summary (brief 027 Edits 1–2)

- **All Pauses honored.** Pause 1 skipped (no design), Pause 2 N/A (single
  content file), Pause 3 ×2 each gated on explicit mentor go.
- **`pre-commit-self-audit`: 5/5 PASS** on both commits. Subjects ≤ 72 chars (47
  and 61); types `docs`; verbs `add` and `document` inside the allowlist SSOT;
  no co-author trailers; staged scope = edit scope.
- **STOP guards clean.** Both find-blocks matched the live file exactly — no
  divergence, no regeneration from memory.
- **Boundary gate.** `git diff --name-only main..HEAD` on the task branch =
  exactly `docs/tasks/027-playbook-mentor-gate/brief.md` +
  `docs/AGENT_PLAYBOOK.md`. No subagent file, no harness file, no
  `MENTOR_BRIEF.md` touched.
- **Edit-2 checklist met.** Step 5 halts at the gate; step 6 byte-identical; new
  subsection sits between Lesson #12 and "When NOT to use the pipeline"; Lesson
  #14 present, no other lesson renumbered; `grep "mentor gate"` returns the
  heading + the step-5 reference; all inserted text English (R9).
- **No build/test gate** — docs-only change.
- **No push without instruction (R17).** Push and PR #67 were an explicit user
  instruction ("open a PR") after acceptance.

## Pending items

### This task

- **PR #67 awaiting mentor-gate review** — open, not merged. Its own gate.
- **Mentor recap** — the chat session's to write (it is the mentor); not part of
  this executor session.

### Deliberately out of scope (named in the brief, separate backlog)

- **Harness mirror of the gate** (`harness/workflows/setup-code.md` etc.) —
  deferred; no second-occurrence evidence yet. The playbook is the orchestrator's
  operating manual, so documenting the gate there is sufficient for now.
- **M-R15 wording loosening** — separate backlog item.
- **Caminho-B verb pre-flight SSOT candidate** — separate backlog item.
- **`MENTOR_BRIEF.md` §2 active-focus refresh** — tracked separately.

### Operational

- Post-merge (after #67): delete local + remote `docs/playbook-mentor-gate`;
  re-upload `docs/AGENT_PLAYBOOK.md` + this recap to the claude.ai project
  knowledge (manual sync). The recap branch `docs/session-recap-027` becomes its
  own docs PR, joining the chat's mentor recap.

## Next concrete action

Mentor reviews PR #67 at its own gate and merges (or routes a rejection through
the three REJECTED responses). After merge, the recap docs PR lands. Candidate
next briefs remain the Phase 3 ones carried from 026: the CLI human-facing
display layer, or opening the Phase 3 state design (`derivePath` hierarchy rule
still unresolved).

## Snippet for the next session

```
Olá. Modo: [continuar | modelar tarefa].

Continuação de 2026-06-19-executor-027-playbook-mentor-gate.
Brief 027 = documenta o mentor gate no seam validator-APPROVED →
executor (docs/AGENT_PLAYBOOK.md Cap. 6). Caminho B (brief autorado
pelo mentor, sem planner/validator) porque é brief que modifica o
próprio pipeline. 2 commits em docs/playbook-mentor-gate, PR #67
ABERTO (ainda não mergeado — está no próprio gate).

Entregue:
- AGENT_PLAYBOOK.md Cap. 6: step 5 reescrito (APPROVED não auto-invoca
  mais o executor; surfaceia brief + verdict + diff e PARA no gate);
  nova subseção "### The mentor gate (APPROVED → executor)" entre
  Lesson #12 e "When NOT to use the pipeline"; Lesson #14 nova. Step 6
  (REJECTED) byte-idêntico; nenhuma outra lesson renumerada.
- Subagentes (planner/validator/executor) e harness INTOCADOS: o gate
  é comportamento do orquestrador (main session), subagente não vê
  histórico da sessão pai.

Decisões realizadas (D1–D5, não reabrir): gate único no APPROVED→
executor (D1); STOP semântico, não prompt de permissão, não silêncio
(D2); rejeição no gate reusa protocolo REJECTED — 3 respostas (D3);
superfície só Cap. 6 + Lesson #14 (D4); escopo justo no gate, sem
bundling (D5).

Pausas: 1 pulada (sem design), 2 N/A (1 arquivo de conteúdo), 3 ×2
honradas. audit 5/5 nos dois commits (verbos add/document na
allowlist). STOP guards limpos (ambos find-blocks casaram exato).

Aprendizados:
- brief que modifica o pipeline não se auto-planeja → caminho B
- o gate é o catch que o validator estruturalmente não pode ser
  (clean mecânico ≠ certo)
- find/replace exato com STOP-if-mismatch > regenerar de memória
- sem SendMessage: Pause→go re-spawna executor fresco (commit #2 feito
  direto pelo orquestrador, já staged/auditado — sem 3º spawn)

Pendências:
- PR #67 aguardando review do mentor (seu próprio gate)
- mentor recap é do chat (ele é o mentor), não desta sessão
- harness mirror do gate (adiado, sem 2ª ocorrência)
- M-R15 loosening / verb pre-flight SSOT / §2 refresh (backlog separado)

Antes de propor próximo passo, confirma quem entendeu que sou e
o modo da sessão.
```
