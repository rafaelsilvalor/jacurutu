# Session recap — 2026-05-22 — mentor — 013-orchestration-cluster-design

**Mode:** mentoring (open exploration of three-agent orchestration).
**Mentor:** Claude Chat (this session).
**Continuation of:** `docs/sessions/2026-05-20-mentor-012-workflow-lifecycle-cleanup.md`.

Session purpose: design the transition from "chat models the brief, executor runs it" to "chat is pure mentoring; Claude Code runs a three-agent pipeline (planner → validator → executor)". No briefs, no code, no PRs from this session — only architectural decisions captured for downstream modeling.

## Decisions taken

Numbered for cross-reference in downstream briefs. Each decision below also includes target file when relevant.

- **D1 — Chat (mentor) remains the architectural surface.** Mentor produces a *design document* (not a brief) capturing closed decisions, scope, constraints, and architectural choices. Planner agent consumes the design doc and translates it into a `brief.md`. The architectural conversation does not move into the Claude Code session. → `docs/MENTOR_BRIEF.md` §8 (modeling-mode redefined); `docs/AGENT_PLAYBOOK.md` (new section on pipeline).

- **D2 — Topology is linear sequential, orchestrated by the Claude Code main session.** Forced by Claude Code constraint that subagents cannot spawn other subagents. Main session is the orchestrator: invokes planner, receives brief, invokes validator, receives verdict, invokes executor. No agent-to-agent direct handoff. → relevant for agent definitions and AGENT_PLAYBOOK.

- **D3 — Validator scope is narrow and mechanical.** Validates: naming conventions (NNN, slug, branch type/, commit types), template section presence, R9 language split, R10 subject ≤ 72 chars in prescribed examples, R15 `Plan required` flag, done criteria numbering, Pausas declaration. Does NOT validate: semantic coherence, roadmap alignment, architectural choices. Those stay in chat. → validator system prompt.

- **D4 — Validator rejection routes to user, not auto-loop to planner.** Verdict surfaces to user via main session. User decides whether to (a) return to chat to redesign, (b) fix directly in Claude Code, (c) override the validator. Auto-loop is rejected because (ii) bug-in-validator and (iii) deliberate-chat-decision are indistinguishable from (i) bug-in-brief without user judgment. → validator system prompt; AGENT_PLAYBOOK.

- **D5 — Executor behavior is identical to today.** Same Pausas 1/2/3, same STOP-and-report, same Conventional Commits, same `start-task.md` discipline. Only what it receives changes (brief comes from validator-approved planner output instead of caminho B manual save). → executor agent definition extracted from `harness/workflows/start-task.md` + `CLAUDE.md`.

- **D6 — Per-role memory is built via system prompt + skills preload, not by omitting CLAUDE.md.** Verified against Claude Code docs: CLAUDE.md auto-loads for every custom subagent (only Explore and Plan built-ins skip it). Per-role focus is achieved by (i) system prompt directing which docs the agent should actively consult, and (ii) `skills:` frontmatter field preloading specific skill content at startup. → all three agent definitions.

- **D7 — Validator does NOT intercept Pausas.** Considered and rejected. Reasons: (i) subagent invocation per Pausa would reset executor context between commits, fragilizing state; (ii) the motivating case (R10 char overflow in brief 012) is solved more cheaply by executor self-audit; (iii) pedagogically simpler — validator acting once on brief is the canonical pattern from Claude Code docs. Decision is reversible if empirical evidence later shows mechanical errors escaping self-audit. → executor agent definition (self-audit hook in system prompt); pre-commit-self-audit skill (see D13).

- **D8 — `commit-discipline.md` and `task-pauses-protocol.md` promotion stays deferred.** Versão 1 (validator audits brief once, executor self-audits Pausas) does NOT require these to be active skills. They remain in `harness/skills-plan/` as drafts. Re-evaluate after brief 015 lands. → no file change this cluster; deferral noted in 015 wrap-up.

- **D9 — `task-brief-template.md` migrates to a Claude Code skill.** New location: `.claude/skills/brief-template/SKILL.md`. Reason: the planner needs preload via the `skills:` frontmatter field (canonical pattern documented by Anthropic); this is exactly what the field is for. The old `harness/prompts/task-brief-template.md` is removed or repurposed in brief 015. → brief 013 creates the skill; brief 015 reconciles `harness/prompts/`.

- **D10 — Validator runs on Haiku.** Reason: validation is mechanical (regex, character counts, file existence). Haiku is faster and cheaper for this. Docs explicitly cite this as a cost-control pattern. Reversible to `inherit` if quality issues emerge. → `model: haiku` in validator frontmatter.

- **D11 — Cluster structure: three sub-briefs sequenced.**
  - **Brief 013 (foundations):** create the two skills (`brief-template`, `pre-commit-self-audit`).
  - **Brief 014 (agents):** create the three `.claude/agents/*.md` (planner, brief-validator, executor). Each references its skill via `skills:` preload.
  - **Brief 015 (docs reconciliation):** update `MENTOR_BRIEF.md` §8, add AGENT_PLAYBOOK section on the pipeline, deprecate/adjust `harness/workflows/start-task.md`, reorganize `harness/prompts/` if needed.

  Rationale: dependencies between items (agents reference skills) make monolithic risky; pause between briefs allows verifying each layer before the next. → ROADMAP needs to renumber the old "013" (executor memory placement, no-verbal-override, draft skills promotion) to a later slot (proposed: 016).

- **D12 — Sequence: orchestration cluster before Phase 1 monorepo bootstrap.** Phase 1 becomes the first task to use the new pipeline. Rationale: (i) explicit learning objective declared by user is multi-agent orchestration; (ii) Phase 1 is greenfield TS — bad time to learn two things at once; (iii) Phase 1 is an ideal first-use case for the pipeline (clear scope, no legacy). → ROADMAP order; brief 011-Phase-1 stays queued, modeled after 015 merges.

- **D13 — `pre-commit-self-audit` skill scope.** Location: `.claude/skills/pre-commit-self-audit/SKILL.md`. Content: mechanical checklist the executor runs before each Pausa 3, including: subject length ≤ 72 chars via `wc -L`; Conventional Commits type validation; imperative-mood heuristic; `Co-authored-by` absence; `--no-verify` absence; staged files match current edit scope. Exact text deferred to brief 013 modeling. → `.claude/skills/pre-commit-self-audit/SKILL.md`.

- **D14 — Validator emits clickable deep-links to violated rules.** Strategy: live grep at audit time. Validator runs `grep -n` on the canonical file to find the rule's current line number, then emits `https://github.com/rafaelsilvalor/saci/blob/main/<file>#L<line>` in markdown link format. Rationale: zero refactor cost (CLAUDE.md stays as-is); always-current (grep fresh on each audit); reversible to anchor-based links (Strategy B) if CLAUDE.md ever gets refactored to per-rule sub-headings. → validator system prompt instructs link generation.

- **D15 — Link emission scope: all canonical docs + template.** Validator links to violated rules in `CLAUDE.md`, `MENTOR_BRIEF.md`, `GIT_WORKFLOW.md`, `GOTCHAS.md`, and `task-brief-template` (skill). Same grep-based strategy across all. → validator system prompt.

## Verified facts (Claude Code subagents)

Logged here so future sessions don't re-verify. Source: `https://code.claude.com/docs/en/sub-agents` (fetched 2026-05-22).

- Subagents live in `.claude/agents/*.md` (project) or `~/.claude/agents/` (user). YAML frontmatter + markdown body (system prompt).
- Required frontmatter: `name`, `description`. Relevant optional: `tools`, `disallowedTools`, `model`, `permissionMode`, `skills`, `maxTurns`, `memory`.
- Each subagent runs in isolated context window. Does NOT see parent conversation history.
- CLAUDE.md and full memory hierarchy auto-load for every custom subagent. Only built-in Explore and Plan skip it. No frontmatter field to opt out.
- Parent → subagent communication is a single delegation prompt string. Subagent → parent is a single final message.
- **Subagents cannot spawn other subagents.** Explicit doc constraint.
- Invocation: natural language, `@agent-name`, or `--agent <name>` for session-wide.
- `tools` is allowlist; `disallowedTools` is denylist; both supported simultaneously.
- `skills:` field preloads full skill content into subagent context at startup.

## Pending items

### Open before brief 013 modeling

- **ROADMAP renumbering.** Old "013" (executor memory placement, no-verbal-override pattern, draft skill promotion) needs to move to 016 or later. Reflect in `docs/ROADMAP.md` parking lot / phases section and `CLAUDE.md` E5 (slot reservations). Resolve at the start of brief 013 modeling.

- **Exact slot numbering via P4.** Apply P4 (three sources: `ls docs/tasks/`, `git log --oneline main`, `CLAUDE.md` E5) at modeling time to confirm 013/014/015 are available. Brief 012 was 012; 013-015 expected free but verify.

### Deferred — surfaces in downstream briefs

- **Exact system prompt text for each of the three agents.** Planner, validator, executor. Brief 014 work.
- **Exact `brief-template` SKILL.md content.** Derive from current `harness/prompts/task-brief-template.md` plus any refinements needed for skill format. Brief 013 work.
- **Exact `pre-commit-self-audit` SKILL.md content.** Bash-runnable checklist. Brief 013 work.
- **MENTOR_BRIEF §8 redesign.** "Modeling a task" mode is removed (or repurposed); five modes become four: mentoring, reviewing a plan, code review, continuing. Brief 015 work.
- **AGENT_PLAYBOOK new section.** Pipeline description, when to invoke which subagent, troubleshooting. Brief 015 work.
- **`harness/workflows/start-task.md` reorganization.** Likely becomes obsolete or shrinks to "how to invoke executor agent". Brief 015 work.
- **`harness/prompts/` reorganization.** With `task-brief-template.md` gone, this directory may empty out or be repurposed. Brief 015 work.

### Pending from prior sessions (unchanged)

- **Brief 012 R10 subject-length errata.** Three subjects in brief 012 on-disk text still > 72 chars; commits shipped corrected via in-flight catch. Decision pending: errata note vs. rely on Pausa 3 in reuse. No urgency unless brief 012 is cloned as template before resolution.
- **"Current `docs/tasks/<NNN>/brief.md`" ambiguity** in `harness/prompts/task-brief-template.md` (resolved at runtime via reading (i) in brief 012 execution). Will be auto-resolved when the file becomes the brief-template skill in brief 013 (rewrite forces clarification).
- **JS libraries for Jira REST and Google Sheets adapters.** Pre-Phase-4 research; not blocking the orchestration cluster.
- **`ProductionFlow` / `Workspace` abstraction.** Surfaces during Phase 2 port.

### Operational — pending before next session

- **This recap reviewed and merged via separate PR**, per project convention since session 010. Naming: `2026-05-22-mentor-013-orchestration-cluster-design.md` follows `<date>-<role>-<NNN>-<slug>` (close-chat-session.md PASSO 3).
- **Re-upload to claude.ai project knowledge** after recap PR lands: this file. No other canonical files modified this session.

## Artifacts produced

- **This mentor recap** — `docs/sessions/2026-05-22-mentor-013-orchestration-cluster-design.md` (delivered to `/mnt/user-data/outputs/`; user saves via caminho B).

No briefs, no code, no PRs from this session.

## Next concrete action

Open a new chat session in **modelar tarefa** mode. Target: **brief 013 — foundations: agent skills**. Session will load §8 modeling context (CLAUDE.md, MENTOR_BRIEF.md, AGENT_PLAYBOOK.md, GIT_WORKFLOW.md, GOTCHAS.md, harness/prompts/task-brief-template.md) plus this recap and produce brief 013.

Brief 013 scope (per D11):
- Create `.claude/skills/brief-template/SKILL.md` (migrating content from `harness/prompts/task-brief-template.md`, format-adapted for skill).
- Create `.claude/skills/pre-commit-self-audit/SKILL.md` (mechanical checklist; bash-runnable steps).
- Renumber old "013" in ROADMAP / E5 to a later slot.

Brief 013 does NOT yet:
- Create any `.claude/agents/*.md` (that's brief 014).
- Modify `MENTOR_BRIEF.md` §8 or `AGENT_PLAYBOOK.md` (that's brief 015).
- Remove `harness/prompts/task-brief-template.md` (that's brief 015, after the skill is verified working in brief 014).

## Snippet for the next session

```
Olá. Modo: modelar tarefa.

Continuação de 2026-05-22-mentor-013-orchestration-cluster-design.
Sessão de mentoria fechou 15 decisões (D1–D15) desenhando o cluster
de orquestração de três agentes Claude Code (planner, brief-validator,
executor) + dois skills de apoio (brief-template, pre-commit-self-audit)
+ docs reconciliation.

Cluster vira três sub-briefs sequenciais:
- 013 (foundations): cria os dois skills.
- 014 (agents): cria os três .claude/agents/*.md.
- 015 (docs reconciliation): MENTOR_BRIEF §8, AGENT_PLAYBOOK, deprecate
  start-task.md, reorganiza harness/prompts/.

Próxima tarefa: modelar brief 013 (foundations).

Escopo do 013:
- .claude/skills/brief-template/SKILL.md (migra de
  harness/prompts/task-brief-template.md, adaptado pra formato skill).
- .claude/skills/pre-commit-self-audit/SKILL.md (checklist mecânica
  pré-Pausa 3: subject ≤ 72 chars via wc -L, Conventional Commits type,
  imperative mood heurística, sem Co-authored-by, sem --no-verify,
  staged files = escopo do edit corrente).
- Renumeração no ROADMAP: o "013" antigo (executor memory, no-verbal-
  override, promoção de skills antigos) move pra 016 ou parking lot.

Sequência: orquestração primeiro (cluster 013–015), depois Phase 1
monorepo bootstrap (que estreia o pipeline novo).

Pendências carry-over:
- Brief 012 R10 errata (não-bloqueante).
- Brief 012 brief.md "current" ambiguity (auto-resolve em 013).
- JS libs Jira/Sheets (pre-Phase-4).
- ProductionFlow / Workspace (Phase 2).

Decisões fechadas no recap acima — D1 a D15. NÃO revisitar:
- Topologia linear orquestrada pelo principal (D2).
- Validator escopo mecânico (D3); rejeição sobe ao usuário (D4).
- Validator NÃO intercepta Pausas; executor faz self-audit (D7).
- task-brief-template vira skill (D9).
- Validator no Haiku (D10).
- Validator emite GitHub deep-links via grep -n (D14, D15).
- Cluster 013→014→015 (D11); orquestração antes de Phase 1 (D12).

Aplica P4 antes de fixar o NNN de 013 no brief — três fontes:
ls docs/tasks/, git log --oneline main, CLAUDE.md E5.

Antes de propor próximo passo, confirma quem entendeu que sou
e o modo da sessão (M-R13).
```
