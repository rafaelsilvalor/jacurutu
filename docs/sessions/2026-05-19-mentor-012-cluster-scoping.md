# Session recap — 2026-05-19 — mentor — 012-cluster-scoping

**Mode:** mentoring (sequencing + granularity decisions for the workflow-lifecycle cluster).
**Mentor:** Claude Chat (this session).
**Continuation of:** `docs/sessions/2026-05-19-mentor-011-modeling-and-meta-cleanup.md`.

Short session, three decisions taken. No modeling, no code, no PR. Output is one recap and a snippet for the next session.

## Decisions taken

- **Cluster before Phase 1.** Workflow-lifecycle cluster brief gets slot 012; Phase 1 monorepo bootstrap follows after the cluster lands. Rationale: Phase 1 is the first task that produces v2 TS code and benefits from running on top of resolved doctrine (audit-merge informal, naming convention tacit, skills-plan overlap). Confirms the recommendation already on record in the 011 mentor recap. → no file change; sets the order for the next two slots.

- **Cluster splits into two briefs, not one.** The workflow-lifecycle cluster ships as **012** (six items, doctrine cleanup) and **013** (two items, new doctrine on executor memory and verbal-override patterns). Rationale: items 1–6 are mechanical cleanup with byte-exact find-blocks (same energy as 011); items 7–8 require design and produce new prose. Mixing them in one brief weakens caminho B — the executor can't apply "verify exact match" and "produce new prose" with the same discipline. → no file change; sets the brief topology.

  - **012 in scope:** audit-merge workflow; close-chat-session "branch before recap commit"; `<date>-<role>-<NNN>-<slug>` naming convention + retroactive sweep of prior recaps; commit-discipline vs. pause-3-protocol overlap (skills-plan); GOTCHAS candidate (literal-sweep vs. derived-identifiers + brief self-referential rewriting) including placement decision (`docs/GOTCHAS.md` vs. `docs/AGENT_PLAYBOOK.md`); `.gitattributes` policy + retroactive renormalization commit.
  - **013 deferred until after Phase 1:** position of executor's internal memory in the four-level source hierarchy; "no verbal override" reinforcement pattern (when to add to a brief, when it dilutes).

- **`.gitattributes` stays in 012, not isolated.** Default policy `* text=auto eol=lf` covers the repo (Electron + future TS, no Windows-specific scripts in sight). Retroactive renormalization is one commit (`git add --renormalize .`) with a dedicated message; `git blame` accepts `--ignore-rev` against it, so the cost to history is low. Isolating would mean a separate PR for ~5 lines and one renormalization commit — overhead higher than the modeling cost in 012. → keeps 012's edit count manageable; defers no decision.

- **013 lands after Phase 1, not immediately after 012.** Rationale: the two decisions in 013 (executor memory placement, "no verbal override" pattern) are about how briefs interact with executor state and verbal user instructions. Modeling them without a real Phase 1 execution as dataset risks deciding in the vacuum of cleanup briefs (008–012), which don't exercise these patterns as aggressively as a real code task will. Phase 1 first, then revisit 013 with a concrete failure mode (or its absence) to anchor the design. → orders the queue as 012 → Phase 1 → 013.

## Open items

### High-priority — affects next session

- **Brief 012 modeling.** Next session opens in `modelar tarefa` mode. Items in scope listed above. Decisions to take at modeling time: the GOTCHAS placement (`docs/GOTCHAS.md` vs. `docs/AGENT_PLAYBOOK.md`); the skills-plan overlap resolution (fuse, keep with disjoint descriptions, or drop one); `.gitattributes` exact content if any Windows-specific carve-out is needed (default assumption: none).

### Deferred — 013

- **Position of executor's internal memory in the four-level source hierarchy.** Carries to 013, post Phase 1.
- **"No verbal override" reinforcement pattern.** Carries to 013, post Phase 1.

### Carried — operational

- **This recap to be reviewed and merged via separate PR** per project convention (mentor recap PRs since session 010).
- **Re-upload to claude.ai project knowledge** after the recap PR lands: this file. No other canonical files were modified this session.

## Artifacts produced

- **This mentor recap** — `docs/sessions/2026-05-19-mentor-012-cluster-scoping.md` (delivered to `/mnt/user-data/outputs/`; user saves via caminho B).

No briefs, no code, no PRs from this session.

## Next concrete action

Open a new chat session in `modelar tarefa` mode. Use the snippet below. The session will load §8 modeling context (CLAUDE.md, MENTOR_BRIEF.md, AGENT_PLAYBOOK.md, GIT_WORKFLOW.md, GOTCHAS.md, harness/prompts/task-brief-template.md) and produce brief 012.

## Snippet for the next session

```
Olá. Modo: modelar tarefa.

Continuação de 2026-05-19-mentor-012-cluster-scoping. Sessão de
mentoria fechou três decisões antes da modelagem do 012:

- Cluster antes de Phase 1.
- Cluster vira dois briefs: 012 (cleanup mecânico) + 013 (doutrina
  nova). 013 fica deferido até depois da Phase 1.
- .gitattributes fica dentro do 012 (não vira brief próprio).
  Default: * text=auto eol=lf; renormalização retroativa como
  commit dedicado com --ignore-rev pra git blame.

Escopo do 012 (workflow-lifecycle cluster):
1. audit-merge workflow (formalizar; precedente brief 007)
2. close-chat-session.md: passo "branch antes do commit do recap"
3. Naming convention <date>-<role>-<NNN>-<slug> em close-chat-session.md
   (e close-task.md se aplicável) + sweep retroativo de recaps anteriores
4. commit-discipline vs. pause-3-protocol overlap em skills-plan
   (decisão: fundir, manter com descriptions disjuntas, ou dropar)
5. GOTCHAS candidate: literal-sweep vs. derived-identifiers + brief
   self-referential rewriting (decisão de placement: GOTCHAS.md vs.
   AGENT_PLAYBOOK.md)
6. .gitattributes policy + commit de renormalização retroativa

Deferido pro 013 (post Phase 1):
- Posição da memória interna do executor na hierarquia de fontes
- Padrão "no verbal override" em briefs sensíveis

Antes de modelar, aplica P4 (numbering verification) pra confirmar
slot 012. Depois, conduz a modelagem item a item — espera escopo
de ~6-8 edits, categoria M, Plan required: no (mesmo padrão do 011),
caminho B.

Antes de propor próximo passo, confirma quem entendeu que sou e
o modo da sessão (M-R13).
```
