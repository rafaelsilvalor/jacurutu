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
| executor | `.claude/agents/executor.md` "Reference reading order" — it lists its own six inputs in order |
| test / code | `.claude/agents/test.md`, `.claude/agents/code.md` — the pair for work that carries tests |

**Tier 2 — on demand:**

- `docs/ROADMAP.md` — phases and identity shifts. Read before proposing anything forward-looking, together with `docs/explorations/` for parked ideas and open decisions.
- `docs/tasks/<task-id>-<slug>/brief.md` — the closest prior task to whatever you are doing. The single fastest way to learn the house style is to read two recent briefs.
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
  ROADMAP.md                   phases, identity shifts (possibility state: explorations/)
  PROCESS_MAP.md               this file
  tasks/<task-id>-<slug>/      per-task artifacts, preserved after merge
  sessions/                    one recap per session per role
  explorations/                findings without mandate — lowest authority
.claude/                     machine-loaded orchestration
  agents/                      planner, executor, test, code (+ retired tombstones)
  skills/                      brief-template, mentor-mode
  hooks/                       the executable checks — see §4.1
harness/                     human-driven, copy-paste surface
  workflows/                   16 scenario prompts (setup, continuity, git, review)
  init/                        7 prompts that bootstrap this system in a new repo
  skills-plan/                 candidate skills, not active
```

`.claude/` and `harness/` are **parallel surfaces for the same process**: `.claude/agents/` is invoked programmatically by the main session; `harness/workflows/` is pasted by hand by the owner. Neither is a fallback for the other — they serve different transports.

Language split, per `CLAUDE.md` R9: everything under `docs/`, `CLAUDE.md`, and `.claude/` is agent-consumed and therefore **English-only**. `harness/` is human-edited and may be pt-BR, the `--- COPIAR ---` blocks inside `harness/workflows/*.md` included. Session replies to the owner are pt-BR (`docs/MENTOR_BRIEF.md` M-R10).

## 4. The roles

Roles, not surfaces, define who does what. Canonical definition: `docs/AGENT_PLAYBOOK.md` chapter 6.

| Role | Where it runs | Writes | Never does |
|---|---|---|---|
| **Mentor** | Claude Code — its own main session | `docs/explorations/` only, via the write gate | task modeling, briefs, operational rulings, code (M-R12, M-R15) |
| **Orchestrator** | Claude Code main session, Plan mode | `docs/` only, via the write gate | source code — that is the executor's |
| **planner** | Claude Code subagent | `docs/tasks/<task-id>-<slug>/` only | execute the brief it just wrote |
| **executor** | Claude Code subagent | code + docs per the brief's Edits | push; fix anything outside the brief's scope |
| **test** | Claude Code subagent | `*.test.*` only — enforced by hook | write implementation; weaken an assertion to make it pass |
| **code** | Claude Code subagent | source only — enforced by hook | edit a test; read the prose requirement |

Two roles were retired on 2026-08-09 and are **not** invoked: `brief-validator`
and `closer`. Their files remain as tombstones that say where each check went.
The reasoning is in `docs/explorations/gate-economics.md`.

### 4.1 The checks that are no longer roles

What used to be a subagent reading a checklist is now code the harness runs.
These fire whether or not anyone remembers them, and they carry fixtures.

| Check | Runs as | When |
|---|---|---|
| Commit subject, type, verb, trailer | `.claude/hooks/commit-guard.mjs` | before every `git commit` |
| R25, R21, R24, R5, secret scan | `.claude/hooks/architecture-guard.mjs` | before every `git commit`, over the staged diff |
| Test/code file ownership | `.claude/hooks/file-ownership.mjs` | before any write by `@test` or `@code` |
| Green boundary (`tsc -b`, `npm test`) | `.claude/hooks/green-boundary.mjs` | before a turn may end |
| C1–C11 on a brief | `node .claude/hooks/validate-brief.mjs <brief>` | on demand, before execution |

A hook returns one of three answers, preserving the distinction the skills drew:
**deny** for a rule violation, **ask** for a case nobody has ruled on, allow
otherwise. An `ask` is the owner's, not the model's.

Two structural facts about subagents that shape everything else:

- **Subagents get fresh context and cannot wait for chat input.** A Pause under subagent transport is a STOP-and-return: the subagent stops, returns the whole Pause presentation as one fenced block, and resumes only when the owner's approval is relayed back as a continuation message. Same semantics, different transport (`docs/AGENT_PLAYBOOK.md` "Subagent Pause transport").
- **Mid-run owner rulings become files**, not chat pastes — written to `docs/tasks/<task-id>-<slug>/notes.md`. Byte-exact by construction, and a durable record.

## 5. One task, end to end

Three entry points coexist. All end in the same place.

**Pipeline** (default for new tasks):

```
Orchestrator session opens (harness/workflows/setup-orchestrator.md, Plan mode)
  ↓  decisions closed with the owner, one at a time
@planner            → resolves the slug via P4, creates branch, authors brief, commits it
  ↓
validate-brief.mjs  → 11 mechanical checks → APPROVED | REJECTED | STOP
  ↓  APPROVED
ORCHESTRATOR GATE   → owner reviews brief + verdict + brief diff, gives explicit go
  ↓
@executor           → Edits in order, Pause 1 (conditional) / 2 / 3, commits, no push
                      commit-guard and architecture-guard fire on every commit
  ↓
recaps              → Orchestrator recap + executor recap, docs(sessions): on the same branch
  ↓
owner               → push, open the PR, squash-merge in the GitHub UI
```

**The pair, for work that carries tests.** Where the change is code with a
testable contract, the brief collapses to a short requirement and the two
agents replace the executor:

```
requirement (context / WHEN-THEN behavior / out of scope)
  ↓
@test               → failing tests, from the requirement, never the implementation
  ↓  fresh context
@code               → makes them pass; cannot edit a test; a wrong test is a finding
  ↓
owner               → one gate at the commit
```

The pair cannot carry a docs task, which has no test to write. That work stays
on the executor path above.

**Caminho B** (fallback): the Orchestrator authors the brief itself via the write gate, then invokes `@executor` directly. planner and brief validation are skipped. Use it when the brief needs judgment a delegation prompt cannot carry — doctrinal briefs, structural edits, or any task that modifies the pipeline itself. Conditions and rationale: `docs/AGENT_PLAYBOOK.md` "When to use the pipeline vs. caminho B" and "When NOT to use the pipeline".

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
| **`ask` from a hook** — a case nobody has ruled on | owner | a ruling, in chat. Never a model's guess |
| **Push / PR** | owner | explicit instruction, every time, per branch |

Five things that are **not** a gate release, each of which has already caused a real failure:

1. **A host tool-permission prompt is never a Pause.** You can run twenty approved `Bash` calls and still owe a Pause. The go signal is an affirmative chat message responding to the Pause you announced (`.claude/agents/executor.md` "What a Pause is (and is not)").
2. **Silence is not approval.** Not at a Pause, not at the orchestrator gate.
3. **An assertion is not evidence.** "Committed as approved" does not close Pause 3; the pasted output of `git log --format=%B -1` does. Evidence goes in the turn's **final message block** as **one fenced code block**, and no new Pause opens while an evidence-close is outstanding (`.claude/agents/executor.md` "Evidence transport and Pause precondition"; root cause in `docs/sessions/2026-07-14-executor-036-keyless-start.md`).
4. **A green hook does not authorize a push.** Every check passing means no rule was mechanically broken; it says nothing about whether the change should ship. Push is the owner's, per branch, every time.
5. **APPROVED is not a green light.** It is `validate-brief.mjs` clearing *mechanical* drift. A brief can be mechanically perfect and still be the wrong thing to build — that judgment is structurally outside what any check can see.

Pause 3 additionally has a **green boundary**: run `npx tsc -b` and `npm test`, include both results in the Pause 3 block, and commit only on green. Unconditional — there is no docs-only exemption. This exists because worktree sessions may not wire `core.hooksPath`, so the G-R8 pre-commit hook may never fire.

## 7. Artifact naming

| Artifact | Path / format | Notes |
|---|---|---|
| Task brief | `docs/tasks/<task-id>-<slug>/brief.md` | `<task-id>` is the birth date `YYYY-MM-DD` for a task born on or after brief 052's merge, and a zero-padded `NNN` for one born before it. `<slug>` is kebab-case, ≤ 30 chars, and globally unique across all of `docs/tasks/`. Same-day collisions take a short ordinal suffix, applied only on collision. Preserved after merge as the historical record |
| Task notes | `docs/tasks/<task-id>-<slug>/notes.md` | optional; where mid-run owner rulings land |
| Aborted task | `docs/tasks/<task-id>-<slug>/brief.md`, `ABORTED` block after line 1 | the block is dated, states the reason, and preserves the brief body verbatim; the folder is never deleted (E4) |
| Session recap | `docs/sessions/<YYYY-MM-DD>-<role>-<slug>.md` | the date is the *session's*, not the task's; `<role>` is `orchestrator` or `executor`. A recap of a pre-cutover task keeps that task's number in the slug position — `<NNN>-<slug>` — for life (E8) |
| Exploration note | `docs/explorations/<topic>.md` | opens with `Status:` / `Origin:` / `Roadmap link:`, ends with a `## Changelog` |
| Branch | `<type>/<kebab-description>` | types per `GIT_WORKFLOW.md` G-R2 |
| Commit | `<type>(<scope>)?: <imperative subject>` | subject ≤ 72 chars, body explains *why*, no trailers |
| Long-task state | `STATE.md` at repo root | only for multi-session or structurally complex tasks; deleted on close (G-R10) |

Four naming facts worth internalizing:

- **The slug is verified by P4, a four-source check** — `ls docs/tasks/`, `git log --oneline main`, a grep for the candidate slug across `CLAUDE.md` and `docs/`, and `git branch -a` plus `git worktree list`. Only the fourth sees a slug held on an unmerged branch or in a live worktree, which concurrent worktree sessions make routine rather than exceptional. If a source shows the slug taken, choose another and re-run all four; if the sources disagree, STOP. There is no number to resolve: the id is self-assigned, and a task is born under one scheme and dies under it. (`docs/MENTOR_BRIEF.md` P4; `.claude/agents/planner.md` step 2.)
- **Commit verbs come from an allowlist with one SSOT** — `VERB_ALLOWLIST` in `.claude/hooks/lib/commit-message.mjs`. It moved there from the retired self-audit skill on 2026-08-09: it is data pinned by tests, not prose recovered by a regex. Both consumers read it, and nothing duplicates it. A verb outside both lists is a STOP, not a judgment call — and the choice among allowlisted verbs is semantic, not convenience (`document` ≠ `update` ≠ `add`).
- **`claude/*` branches are session scaffolding, not work branches.** The desktop harness creates one per worktree. They carry zero commits, are never PR targets, and sit outside R11/G-R2. The real work branch is created inside the session from a verified base SHA with explicit owner approval (`docs/GIT_WORKFLOW.md` "`claude/*` scaffolding branches").
- **An aborted task is preserved, not erased.** Its folder lands on `main` with a dated `ABORTED` block after the title and its body untouched. There is no sequence left to puncture, so there is no burn to record — the folder itself is the record. First instance: `docs/tasks/049-init-six-role-bootstrap/`.

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
| `C1`–`C11` | the brief's mechanical checks | `.claude/hooks/lib/brief-checks.mjs` |
| `D1`, `D2`, … inside a brief | architectural decisions already closed for *that* task | the brief itself |
| `N1`–`N3` | *retired 2026-08-09* — the closer's finding-suppression rules, with nothing left to suppress | `.claude/agents/closer.md` (tombstone) |

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
ls docs/tasks/                              # every task ever, in lexical order
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
5. **Writing pt-BR into `docs/`, a commit, a branch name, or an identifier.** R9. `harness/` is the only pt-BR-tolerant surface, `--- COPIAR ---` payloads included.
6. **Fixing something adjacent because it was obviously broken.** Out of scope ≠ out of mind: report it, do not silently fix. A refactor commit that also fixes a bug violates R14 and gets rejected.
7. **Structural deviation from the brief's Edit map** — merging, splitting, renaming, or relocating planned files, even when the result is cleaner. STOP and confirm before writing.
8. **Implementing from an exploration note.** Notes carry no mandate. See §9.7.
9. **Pushing, or offering to push, or appending a recommended push command.** Push is the owner's call, per branch, every time.
10. **Skipping the plan on a small task.** R15's threshold is 2 files or 50 lines. `O4` in the playbook is exactly this mistake: the plan takes 30 seconds and saves 30 minutes.

## 13. Related documents

| File | What it owns |
|---|---|
| `CLAUDE.md` | code rules, architecture, exceptions |
| `docs/AGENT_PLAYBOOK.md` | the pipeline, the roles, the gates, lessons #1–#15 |
| `docs/MENTOR_BRIEF.md` | who the owner is; Mentor-lane behavior (`M-R*`) |
| `docs/GIT_WORKFLOW.md` | branches, commits, hooks, PRs, releases, recovery |
| `docs/GOTCHAS.md` | stack traps (`G-CAT-N`) |
| `docs/ROADMAP.md` | phases, identity shifts; possibility state lives in `docs/explorations/` |
| `docs/explorations/README.md` | the authority contract for notes |
| `.claude/agents/*.md` | the four subagent contracts |
| `.claude/skills/brief-template/SKILL.md` | how a brief is structured |
| `.claude/hooks/` | the executable checks: commit guard, architecture guard, file ownership, green boundary, brief validation |
| `.claude/hooks/lib/commit-message.mjs` | the verb allowlist SSOT |
| `harness/README.md` | what the harness is; how to bootstrap it elsewhere |
| `harness/workflows/README.md` | the scenario catalog |
| `README.md` | what Saci is, for end users |
