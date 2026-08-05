# Process Map

> **For any AI agent entering this repository.** This file is the entry point to *how work happens here* — the roles, the gates, the artifacts, the naming. It is not about the product and not about the code.
>
> Read this first, then follow the reading order in §2 for whatever role you are in. Everything here points at a canonical file; nothing here restates a rule. When this file and a canonical file disagree, the canonical file wins and this file is the bug.

## 1. What this is, and what it is not

| This file answers | Read instead |
|---|---|
| Who does what, and in which order | — |
| Which gate stops me, and what closes it | — |
| Where an artifact goes and what it is named | — |
| What a rule ID like `G-R5` or `M-R12` means and where it lives | — |
| What the code rules are | `CLAUDE.md` |
| What Saci is and what it does | `README.md`, `docs/ROADMAP.md` |
| Where the code lives and how it is layered | `CLAUDE.md` "Architecture" |
| Which stack traps have already cost time | `docs/GOTCHAS.md` |

The process here is deliberately heavy for a one-person project. The reason is stated in `docs/MENTOR_BRIEF.md` §1: the owner is early-career and uses agents to compensate for inexperience while learning. Every gate below exists because an agent moving unchecked produced a specific bad outcome that is documented somewhere in `docs/sessions/`. Treat the gates as load-bearing, not ceremonial.

## 2. Read in this order

**Tier 0 — always, before any substantive action:**

1. `CLAUDE.md` — in full. Rules (R), anti-patterns (A), exceptions (E).
2. This file.

**Tier 1 — by role (see §4 for what the roles are):**

| Role | Add |
|---|---|
| Orchestrator (main Claude Code session) | `docs/AGENT_PLAYBOOK.md` chapters 2 and 6, `docs/GIT_WORKFLOW.md`, `docs/GOTCHAS.md`, the newest recaps in `docs/sessions/` |
| Mentor (its own Claude Code main session) | `docs/MENTOR_BRIEF.md` in full, `.claude/skills/mentor-mode/SKILL.md`, then its §8 table for what else to load |
| planner | `.claude/agents/planner.md`, `.claude/skills/brief-template/SKILL.md` |
| brief-validator | `.claude/agents/brief-validator.md`, `.claude/skills/brief-template/SKILL.md` |
| executor | `.claude/agents/executor.md` "Reference reading order" — it lists its own six inputs in order |
| closer | `.claude/agents/closer.md`, `CLAUDE.md` R18–R25 |

**Tier 2 — on demand:**

- `docs/ROADMAP.md` — phases, parking lot, pending decisions. Read before proposing anything forward-looking.
- `docs/tasks/<NNN>-<slug>/brief.md` — the closest prior task to whatever you are doing. The single fastest way to learn the house style is to read two recent briefs.
- `docs/sessions/` — how a session actually went, including what went wrong.
- `docs/explorations/` — accumulated findings with no implementation mandate. Read `docs/explorations/README.md` first; the authority contract matters.
- `harness/workflows/<scenario>.md` — the copy-paste prompt for a specific scenario.

## 3. The four surfaces

```
CLAUDE.md                    the rules. Highest authority on code.
docs/                        canonical documentation + the historical record
  AGENT_PLAYBOOK.md            the pipeline, the gates, the lessons (#1–#15)
  MENTOR_BRIEF.md              who the owner is, how the Mentor lane behaves (M-R*)
  GIT_WORKFLOW.md              branches, commits, hooks, PRs, recovery (G-R*/G-A*)
  GOTCHAS.md                   stack traps with permanent IDs (G-CAT-N)
  ROADMAP.md                   phases, parking lot, pending decisions
  PROCESS_MAP.md               this file
  tasks/<NNN>-<slug>/          per-task artifacts, preserved after merge
  sessions/                    one recap per session per role
  explorations/                findings without mandate — lowest authority
.claude/                     machine-loaded orchestration
  agents/                      planner, brief-validator, executor, closer
  skills/                      brief-template, pre-commit-self-audit, mentor-mode
harness/                     human-driven, copy-paste surface
  workflows/                   16 scenario prompts (setup, continuity, git, review)
  init/                        7 prompts that bootstrap this system in a new repo
  skills-plan/                 candidate skills, not active
```

`.claude/` and `harness/` are **parallel surfaces for the same process**: `.claude/agents/` is invoked programmatically by the main session; `harness/workflows/` is pasted by hand by the owner. Neither is a fallback for the other — they serve different transports.

Language split, per `CLAUDE.md` R9: everything under `docs/`, `CLAUDE.md`, and `.claude/` is agent-consumed and therefore **English-only**. `harness/` is human-edited and may be pt-BR, the `--- COPIAR ---` blocks inside `harness/workflows/*.md` included. Session replies to the owner are pt-BR (`docs/MENTOR_BRIEF.md` M-R10).

## 4. The six roles

Roles, not surfaces, define who does what. Canonical definition: `docs/AGENT_PLAYBOOK.md` chapter 6.

| Role | Where it runs | Writes | Never does |
|---|---|---|---|
| **Mentor** | Claude Code — its own main session | `docs/explorations/` only, via the write gate | task modeling, briefs, operational rulings, code (M-R12, M-R15) |
| **Orchestrator** | Claude Code main session, Plan mode | `docs/` only, via the write gate | source code — that is the executor's |
| **planner** | Claude Code subagent | `docs/tasks/<NNN>-<slug>/` only | execute the brief it just wrote |
| **brief-validator** | Claude Code subagent | nothing — read-only | judge semantics, roadmap fit, or whether the task is a good idea |
| **executor** | Claude Code subagent | code + docs per the brief's Edits | push; fix anything outside the brief's scope |
| **closer** | Claude Code subagent | nothing in Phase A | merge; infer Phase B from a clean Phase A verdict |

Two structural facts about subagents that shape everything else:

- **Subagents get fresh context and cannot wait for chat input.** A Pause under subagent transport is a STOP-and-return: the subagent stops, returns the whole Pause presentation as one fenced block, and resumes only when the owner's approval is relayed back as a continuation message. Same semantics, different transport (`docs/AGENT_PLAYBOOK.md` "Subagent Pause transport").
- **Mid-run owner rulings become files**, not chat pastes — written to `docs/tasks/<NNN>-<slug>/notes.md`. Byte-exact by construction, and a durable record.

## 5. One task, end to end

Two entry points coexist. Both end in the same place.

**Pipeline** (default for new tasks):

```
Orchestrator session opens (harness/workflows/setup-orchestrator.md, Plan mode)
  ↓  decisions closed with the owner, one at a time
@planner            → resolves NNN via P4, creates branch, authors brief, commits it
  ↓
@brief-validator    → 11 mechanical checks → APPROVED | REJECTED
  ↓  APPROVED
ORCHESTRATOR GATE   → owner reviews brief + verdict + brief diff, gives explicit go
  ↓
@executor           → Edits in order, Pause 1 (conditional) / 2 / 3, commits, no push
  ↓
recaps              → Orchestrator recap + executor recap, docs(sessions): on the same branch
  ↓
@closer Phase A     → reads git diff main...HEAD, 3 checks, pt-BR report, STOP
  ↓  owner's explicit per-branch go
@closer Phase B     → push, open PR filling the template, hand the link over
  ↓
owner squash-merges in the GitHub UI
  ↓
@closer post-merge  → local branch cleanup, P4 re-check, merge SHA confirmation
```

**Caminho B** (fallback): the Orchestrator authors the brief itself via the write gate, then invokes `@executor` directly. planner and validator are skipped. Use it when the brief needs judgment a delegation prompt cannot carry — doctrinal briefs, structural edits, or any task that modifies the pipeline itself (a brief that creates the validator cannot be audited by the validator). Conditions and rationale: `docs/AGENT_PLAYBOOK.md` "When to use the pipeline vs. caminho B" and "When NOT to use the pipeline".

Category S tasks skip all of this — one chat message is enough. No brief, no pipeline.

When a verdict comes back REJECTED, or when the owner rejects at the orchestrator gate, there are exactly three responses and none is the default: redesign with the Orchestrator, fix directly on the branch and re-validate, or override the finding and record why. Both rejection points share one protocol (`docs/AGENT_PLAYBOOK.md` "Verdict handling").

## 6. The gates

Every gate below stops work until the **owner** releases it. No gate releases itself.

| Gate | Whose | Closed by |
|---|---|---|
| **Pause 1** — numbered plan, before any change | executor | explicit go. Conditional on the brief's `Plan required` flag |
| **Pause 2** — first file fully changed | executor | explicit go. Always required |
| **Pause 3** — before every commit | executor | explicit go, then the evidence-close |
| **Orchestrator gate** — APPROVED → executor | owner | explicit go after reading brief + verdict + diff |
| **Write gate** — Orchestrator writing under `docs/` | owner | show full content → approve → write → read back from disk → confirm byte-match |
| **Owner gate** — closer Phase A → Phase B | owner | explicit per-branch instruction |
| **Push / PR** | owner | explicit instruction, every time, per branch |

Five things that are **not** a gate release, each of which has already caused a real failure:

1. **A host tool-permission prompt is never a Pause.** You can run twenty approved `Bash` calls and still owe a Pause. The go signal is an affirmative chat message responding to the Pause you announced (`.claude/agents/executor.md` "What a Pause is (and is not)").
2. **Silence is not approval.** Not at a Pause, not at the orchestrator gate.
3. **An assertion is not evidence.** "Committed as approved" does not close Pause 3; the pasted output of `git log --format=%B -1` does. Evidence goes in the turn's **final message block** as **one fenced code block**, and no new Pause opens while an evidence-close is outstanding (`.claude/agents/executor.md` "Evidence transport and Pause precondition"; root cause in `docs/sessions/2026-07-14-executor-036-keyless-start.md`).
4. **A clean closer verdict does not authorize a push,** and a `trava` finding is a recommendation, not a veto the closer enforces. Symmetric in both directions (`docs/AGENT_PLAYBOOK.md` Lesson #14).
5. **APPROVED is not a green light.** It is the validator clearing *mechanical* drift. A brief can be mechanically perfect and still be the wrong thing to build — that judgment is structurally outside what the validator can see.

Pause 3 additionally has a **green boundary**: run `npx tsc -b` and `npm test`, include both results in the Pause 3 block, and commit only on green. Unconditional — there is no docs-only exemption. This exists because worktree sessions may not wire `core.hooksPath`, so the G-R8 pre-commit hook may never fire.

## 7. Artifact naming

| Artifact | Path / format | Notes |
|---|---|---|
| Task brief | `docs/tasks/<NNN>-<slug>/brief.md` | `<NNN>` zero-padded, `<slug>` kebab-case ≤ 30 chars. Preserved after merge as the historical record |
| Task notes | `docs/tasks/<NNN>-<slug>/notes.md` | optional; where mid-run owner rulings land |
| Session recap | `docs/sessions/<YYYY-MM-DD>-<role>-<NNN>-<slug>.md` | `<role>` is `mentor`, `orchestrator`, or `executor` |
| Exploration note | `docs/explorations/<topic>.md` | opens with `Status:` / `Origin:` / `Roadmap link:`, ends with a `## Changelog` |
| Branch | `<type>/<kebab-description>` | types per `GIT_WORKFLOW.md` G-R2 |
| Commit | `<type>(<scope>)?: <imperative subject>` | subject ≤ 72 chars, body explains *why*, no trailers |
| Long-task state | `STATE.md` at repo root | only for multi-session or structurally complex tasks; deleted on close (G-R10) |

Three naming facts worth internalizing:

- **The task number is resolved by P4, a three-source check** — `ls docs/tasks/`, `git log --oneline main`, and `grep -nE '^\*\*E[0-9]+' CLAUDE.md` for forward reserves. `ls` alone misses reserves and unsynced merged work. If the sources disagree, STOP. (`docs/MENTOR_BRIEF.md` P4; `.claude/agents/planner.md` step 1.)
- **Commit verbs come from an allowlist with one SSOT** — the `ALLOW=` line in `.claude/skills/pre-commit-self-audit/SKILL.md`. Two consumers read it at runtime: that skill's Check 3 and brief-validator's C11. Nothing duplicates it. A verb outside both the allowlist and the denylist is a STOP, not a judgment call — and the choice among allowlisted verbs is semantic, not convenience (`document` ≠ `update` ≠ `add`).
- **`claude/*` branches are session scaffolding, not work branches.** The desktop harness creates one per worktree. They carry zero commits, are never PR targets, and sit outside R11/G-R2. The real work branch is created inside the session from a verified base SHA with explicit owner approval (`docs/GIT_WORKFLOW.md` "`claude/*` scaffolding branches").

## 8. Rule ID namespaces

Knowing which file owns an ID saves a search every time one is cited.

| Namespace | Meaning | Lives in |
|---|---|---|
| `R1`–`R25` | mandatory code rules | `CLAUDE.md` "Hard Rules" |
| `A1`–`A8` | forbidden code anti-patterns | `CLAUDE.md` "Anti-patterns" |
| `En` | tolerated violations, with a migration plan | `CLAUDE.md` "Documented Exceptions" — currently E1–E3 and E5; gaps are burned reserves, kept deliberately. New v2 exceptions start at E6 |
| `G-R1`–`G-R11` | git operational rules | `docs/GIT_WORKFLOW.md` |
| `G-A1`–`G-A8` | git anti-patterns | `docs/GIT_WORKFLOW.md` |
| `G-CAT-N` | a stack trap, e.g. `G-DRIVE-1`, `G-NODE-2` | `docs/GOTCHAS.md` catalog |
| `M-R1`–`M-R15` | Mentor-lane behavior rules | `docs/MENTOR_BRIEF.md` §4 |
| `P1`–`P5` | observed patterns about the owner | `docs/MENTOR_BRIEF.md` §3 |
| Lessons `#1`–`#15` | orchestration judgment, numbered by discovery order | `docs/AGENT_PLAYBOOK.md` |
| `D1`–`D5` | the five drift signals | `docs/AGENT_PLAYBOOK.md` §2.2 |
| `O1`–`O9` | orchestrator's own anti-patterns | `docs/AGENT_PLAYBOOK.md` chapter 4 |
| `A`–`E` symptom groups | post-task review by symptom | `docs/AGENT_PLAYBOOK.md` chapter 3 |
| `C1`–`C11` | the validator's mechanical checks | `.claude/agents/brief-validator.md` |
| `D1`, `D2`, … inside a brief | architectural decisions already closed for *that* task | the brief itself |
| `N1`–`N3` | the closer's finding-suppression rules | `.claude/agents/closer.md` |

Some IDs are deliberate mirrors of one principle across audiences. Changing one without the other is a bug, stated as such in `docs/GIT_WORKFLOW.md`:

- no proactive push → `R17` = `G-R5` = `M-R11`
- Conventional Commits → `R10` = `G-R3`
- branch naming → `R11` = `G-R2`
- pause before commit → `R16` = `M-R3`
- never bypass the hook → `R13` = `G-R8` = `G-A4`
- PR-only integration → `R12` = `G-R7`

Note the collision: `D1`–`D5` means drift signals in the playbook, and `D1`, `D2`, … means closed decisions inside a brief. Context disambiguates; if you cite one, say which.

## 9. Authority hierarchy

When sources conflict, higher wins:

1. **The owner's explicit instruction in the current session.** Overrides automation, including a brief's own text.
2. **`CLAUDE.md`** — for anything touching code.
3. **The brief for the task in flight** — it is the contract; its `Done criteria` is what "done" means.
4. **`docs/GIT_WORKFLOW.md`, `docs/MENTOR_BRIEF.md`, `docs/AGENT_PLAYBOOK.md`** — co-authoritative in their own lanes.
5. **`docs/GOTCHAS.md`, `docs/ROADMAP.md`** — reference.
6. **`docs/sessions/`** — historical. Records what was true then, not necessarily now.
7. **`docs/explorations/`** — lowest. Possibilities only. Never implement from a note; implementation authority comes only from a brief. The one exception: credential-hygiene lines inside a note are binding even though its ideas are not.

Recaps and notes age. Before acting on anything you read in `docs/sessions/` or `docs/explorations/`, verify the file, symbol, or flag it names still exists.

## 10. How the process changes itself

The docs are alive by design. `docs/AGENT_PLAYBOOK.md` chapter 5 sets the escalation:

- **first time** a mistake happens — fix it and move on
- **second time** — it becomes a rule (`Rn`) or anti-pattern (`An`) in `CLAUDE.md`, citing both incidents
- **third time** — the rule is not being read; move it into the session-start checklist in `harness/workflows/setup-code.md`

Where new knowledge goes:

| Discovery | Destination |
|---|---|
| A stack trap that cost time | `docs/GOTCHAS.md`, new `G-CAT-N` |
| A code rule | `CLAUDE.md`, new `Rn` or `An` |
| A rule that became unworkable | a new `En` exception — never delete the rule; history is preserved |
| An orchestration lesson | `docs/AGENT_PLAYBOOK.md`, next lesson number |
| Something about how the owner works | `docs/MENTOR_BRIEF.md` §3 (`Pn`) or §4 (`M-Rn`) |
| A validated finding with no mandate yet | `docs/explorations/<topic>.md` |
| A recurring scenario needing a paste-ready prompt | `harness/workflows/<scenario>.md`, ≤ 60 lines, referencing rules rather than restating them |
| A recurring auto-triggering behavior | `.claude/skills/<name>/SKILL.md` — but read `harness/skills-plan/README.md` first; a badly described skill fires at the wrong time |

If you discover a new rule while working, `CLAUDE.md` says to add it. That does not exempt you from scope discipline: surface it, do not silently fold it into an unrelated diff.

## 11. Orienting yourself with commands

```bash
git log --oneline -15                       # what just landed
ls docs/tasks/                              # every task ever, newest number last
ls -t docs/sessions/ | head -5              # the five most recent recaps
git branch --show-current                   # am I on claude/* scaffolding?
```

```bash
grep -nE '^\*\*R[0-9]+' CLAUDE.md           # every rule with its line number
```

```bash
grep -rn 'from.*adapter' packages/core/src/ # R25 check: must return nothing
```

```bash
npx tsc -b && npm test                      # the green boundary
```

Two environment facts that are easy to get wrong: the pre-commit hook exists at `.githooks/pre-commit` but `core.hooksPath` may be unset in a given clone, so `npm test` may never run automatically — run it yourself. And in a worktree session, `@saci/*` imports can silently resolve to the main checkout (`docs/GOTCHAS.md` G-NODE-2).

## 12. Process mistakes new agents make here

Each of these has happened and is documented. They are process failures, not code failures.

1. **Treating permission prompts as the go signal.** See §6.1. The single most common failure.
2. **Asserting instead of pasting.** Evidence-close requires the verbatim command output, in the final message block, in one fenced block. See §6.3.
3. **Committing on the `claude/*` session branch.** It is scaffolding. Create the real branch first.
4. **Drifting the approved commit message at commit time.** Gate-approved subjects and bodies are verbatim; verify with `git log -1` after committing and amend if it drifted.
5. **Writing pt-BR into `docs/`, a commit, a branch name, or an identifier.** R9. `harness/` prose is the only pt-BR-tolerant surface, and its `--- COPIAR ---` payloads are still English.
6. **Fixing something adjacent because it was obviously broken.** Out of scope ≠ out of mind: report it, do not silently fix. A refactor commit that also fixes a bug violates R14 and gets rejected.
7. **Structural deviation from the brief's Edit map** — merging, splitting, renaming, or relocating planned files, even when the result is cleaner. STOP and confirm before writing.
8. **Implementing from an exploration note.** Notes carry no mandate. See §9.7.
9. **Pushing, or offering to push, or appending a recommended push command.** Push is the owner's call, per branch, every time.
10. **Skipping the plan on a small task.** R15's threshold is 2 files or 50 lines. `O4` in the playbook is exactly this mistake: the plan takes 30 seconds and saves 30 minutes.

## 13. Related documents

| File | What it owns |
|---|---|
| `CLAUDE.md` | code rules, architecture, exceptions |
| `docs/AGENT_PLAYBOOK.md` | the pipeline, the six roles, the gates, lessons #1–#15 |
| `docs/MENTOR_BRIEF.md` | who the owner is; Mentor-lane behavior (`M-R*`) |
| `docs/GIT_WORKFLOW.md` | branches, commits, hooks, PRs, releases, recovery |
| `docs/GOTCHAS.md` | stack traps (`G-CAT-N`) |
| `docs/ROADMAP.md` | phases, parking lot, pending decisions |
| `docs/explorations/README.md` | the authority contract for notes |
| `.claude/agents/*.md` | the four subagent contracts |
| `.claude/skills/brief-template/SKILL.md` | how a brief is structured |
| `.claude/skills/pre-commit-self-audit/SKILL.md` | the five Pause-3 checks; the verb allowlist SSOT |
| `harness/README.md` | what the harness is; how to bootstrap it elsewhere |
| `harness/workflows/README.md` | the scenario catalog |
| `README.md` | what Saci is, for end users |
