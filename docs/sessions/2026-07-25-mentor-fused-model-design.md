# Session recap — 2026-07-25 — fused Orchestrator model (design + pilot post-mortem)

**Mode:** mentoria — architectural design of the harness itself, conducted
in chat (Mentor, conceptual surface). Covers the 2026-07-24/25 window.
**Consumes:** the 037 recaps; produced and supervised the 038 pilot
(`2026-07-24-mentor-038-payload-gitignore.md`, PR #94 at `main@ac85201`).
**Feeds:** the doctrine-rewrite brief (next session, caminho B).

## One-line summary

Designed, mechanically tested, piloted (task 038), and post-mortemed a new
operating model: the mentor's operational duties fused with the
orchestrator inside a Claude Code session — now named the **Orchestrator**
— with chat retained as the conceptual surface (**Mentor**); full pipeline
validated end to end, four structural findings plus a consolidated role
taxonomy and recap policy queued for the doctrine brief.

## Ratified decisions (fusion D-set, closed in chat)

1. **Role taxonomy (5 roles).** **Mentor** = chat, conceptual only:
   learning, pre-task exploration, meta-discussions — no gate, no task
   modeling, no operational rulings. In Claude Code: **Orchestrator**
   (the fused main session: task modeling, D-set closure with the owner,
   delegation, the gate — renamed *orchestrator gate* — write gate,
   session close-out), **planner**, **validator**, **executor**.
2. **The Orchestrator is NOT a subagent.** Subagents get fresh context per
   invocation and are non-dialogic; the Orchestrator is the main session,
   opened in Plan mode via a harness init prompt, in long-form dialogue
   with the owner.
3. **Write policy:** Plan mode as session default; the Orchestrator may
   write ONLY under `docs/`, per-artifact, via the write gate (show full
   content → owner approves → write → read back from disk and confirm
   byte-match). Never source code — code exists only behind `@executor`.
   Transcription via planner was considered and rejected (reintroduces
   translation drift; transcription is not authorship).
4. **Git operations:** writing a file ≠ committing it. Branch creation
   with explicit owner approval. Push and PR opening allowed under R17's
   letter — explicit per-branch owner instruction; never `main`, never
   `--force`; the permission prompt is a second layer, "Allow once" only.
5. **Mid-run rulings become files** (e.g. `docs/tasks/<NNN>/notes.md`)
   instead of owner-relayed pastes — byte-exact by construction, durable
   record for free.
6. **Orchestrator ≠ executor.** One task per Orchestrator session; opens
   with M-R13 identity + mode, closes with recap. The session never
   performs a subagent's work inline (fail-loud on invocation failure).
7. **Recap set (3):** Mentor (chat sessions, caminho B, own `docs/`
   branch + PR — unchanged), Orchestrator, executor. Planner and
   validator have no recaps — their artifacts (committed brief, recorded
   verdict) are their record. Scope narrowing to kill overlap:
   Orchestrator recap = decisions, gate, deviations, queue, next-session
   snippet; executor recap = pure execution log (Edits, Pauses, evidence,
   commits), no context re-narration.
8. **Recap transport: Orchestrator + executor recaps ride the session
   PR** — the separate docs PR for task sessions is retired. Standard
   session commit sequence: brief (planner) → code (executor, Pauses) →
   recaps (`docs(sessions):` commit on the same branch; Orchestrator's
   via write gate) → push + PR on owner instruction → owner squash-merge.
   Consequence: a recap cannot cite its own PR's merge SHA; the NEXT
   session records the merge in its "Consumes" line after confirming via
   P4/`git log`. The `[CONFIRMAR: docs PR]` pendency class dies with the
   separate PR.
9. **Migration path:** mechanical test → pilot (038) → doctrine brief.
   Steps 1 and 2 completed; step 3 is next.

## Mechanical test findings (permission layer, desktop app, 2026-07-24)

- **Plan mode enforcement is two-regime:** paths inside the repo/worktree
  are prompt-gated per action ("Allow once"/"Deny" on the owner's screen);
  paths outside the repo passed without any prompt (advisory only).
  Out-of-repo behavior is irrelevant to us (all Orchestrator artifacts
  live in `docs/`).
- **Agent-observed enforcement is not enforcement evidence.** The agent
  cannot see the permission layer: an owner-approved write returns as a
  plain success, indistinguishable from an ungated one. The agent
  confidently reported "no prompt" while the owner's screen showed prompts.
  Sibling lesson to 037's "message-evidence is not operation-evidence".
  Consequences: (a) gating claims come only from the owner's observation;
  (b) post-write read-back is mandatory, not optional.
- **Owner-side blindness mirrors it:** the desktop app gives low native
  visibility into session/subagent boundaries. Compensation adopted:
  textual announcement protocol — every subagent invocation announced in
  one line before, summarized in one line after.
- **Desktop worktree mechanics:** each session gets its own worktree on an
  auto-branch prefixed `claude/` (settings: Branch prefix = `claude`,
  deliberately kept). Two-layer branch model adopted: `claude/*` branches
  are session scaffolding — outside R11, zero commits, never PR targets,
  cleaned up post-session; the real work branch (R11-conformant) is
  created inside the session from a verified base SHA.
- **"Accept and auto mode" / "Always allow" are forbidden** in
  Orchestrator sessions — each silently dismantles the prompt layer
  (per-session and per-command-pattern respectively). Plain "Accept" /
  "Allow once" only.

## Pilot post-mortem (task 038 — full detail in its own recaps)

Verdict: success, no design reservations. Every abort criterion tested,
none triggered. Validated end to end: M-R13 + one-decision-at-a-time
D-set modeling; disk-native ground truth (produced the model finding —
tracked `automation/payload.json` — before the D-set, killing
ground-truth-by-assumption at the source); same-window gate with HALT +
explicit go; executor-subagent Pause transport (STOP-and-return
single-block, zero Pauses crossed, one conditional ruling faithfully
executed); write gate with byte-identical read-back; containment
(`claude/*` branches carried zero commits); executor-run cleanup with
`-D` justified by PR evidence over squash-merged tips.

## Findings for the doctrine brief (structural — decide there)

1. **Pre-commit hooks are not wired in worktrees** (`core.hooksPath`
   unset) — the mechanical layer behind R13/R3 is absent in the fused
   model. Decide: worktree setup step wiring hooks, OR executor rule
   making build + full suite mandatory before every Pause 3 (Mentor
   inclination: the latter — protocol travels better than clone config,
   and the pilot proved it works by ruling).
2. **Bidirectional blindness rules:** mandatory post-write read-back;
   subagent invocation announcement protocol; owner-only authority over
   gating claims.
3. **`GIT_WORKFLOW.md` note:** `claude/*` scaffolding branches — outside
   R11, never PR targets, post-session cleanup.
4. **R17 restated for the fused model:** push/PR per-branch on explicit
   instruction + prompt as second layer; `main` and force-push excluded.

Doctrine brief scope: slim `MENTOR_BRIEF.md` down to the conceptual Mentor
role (chat); define the **Orchestrator** in `AGENT_PLAYBOOK.md` alongside
planner/validator/executor, with ch. 6 rewritten to role-based (not
surface-based) separation and the Pause transport described; rename
"mentor gate" → "orchestrator gate"; encode the recap set, recap scopes,
and same-PR recap transport (decisions 7-8); the four findings above;
note that the cache-swap ritual now serves only the chat (Mentor)
surface. Caminho B (M-R15 — pipeline-modifying; the planner is NOT
invoked). NOT promoted (rule-of-three pending, in the 038 recap ledger):
brief decision renumbering (1st), boundary-invariant erosion reasoning
(1st), subagent Pause transport codification (1st), app subagent
visibility (1st).

## Next concrete action

Orchestrator session models the doctrine brief — first caminho B task
under the new model, and its natural second validation round. Then
open-in-software (D3 of session 032) as the first normal post-doctrine
task.

## Paste-ready snippet for the doctrine-brief session (Claude Code, Plan mode)

```
Continuando o projeto Saci em sessao Orchestrator (modelo fundido,
piloto validado na 038). Modo: modelar tarefa — caminho B (brief
doutrinario, M-R15: Orchestrator autora, planner NAO e invocado).
Le do disco: CLAUDE.md, docs/MENTOR_BRIEF.md, docs/AGENT_PLAYBOOK.md,
docs/GIT_WORKFLOW.md, e os recaps
docs/sessions/2026-07-24-mentor-038-payload-gitignore.md e
docs/sessions/2026-07-25-mentor-fused-model-design.md (fonte primaria:
D-set da fusao, taxonomia de papeis, politica de recaps, achados
estruturais).
Regras vigentes: Plan mode default; escrita so em docs/ via write gate
(mostrar → aprovar → escrever → read-back); anuncio de invocacao de
subagent; Allow once sempre; codigo so via @executor; push/PR por
instrucao explicita por branch; recaps Orchestrator + executor commitam
na branch da sessao e viajam no PR dela.
Antes de propor qualquer coisa: M-R13 em uma linha, depois P4 para o
slot do brief doutrinario.
```
