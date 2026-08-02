# Agent Playbook

> **For you (the orchestrator), not the agent.** The other docs in this repo tell agents how to behave. This one tells *you* how to drive — how to size tasks, write briefs, watch for drift, and review what the agent produced.
>
> Numbered **lessons** throughout are anchors you can refer back to ("apply lesson #7"). They compress hard-won judgment into a sentence you can act on.

## Chapter 1 — Before the task

### 1.1 Size the task before writing the brief

Most failed sessions start with a wrongly-sized task. Categorize first.

| Size | Time | Characteristics | Example in Saci |
|---|---|---|---|
| **S** | < 30 min | One-line change, clear scope, low risk | Add a new file extension to `SUPPORTED_EXTS`. Rename a single function. |
| **M** | 30 min – 2 h | One file or two, contained scope, well-understood domain | Add a new IPC handler for "open last folder". Tighten a regex. Extract one helper from `main.js`. |
| **L** | 2 – 8 h | Multiple files, multi-session possible, behavior change visible | Refactor `renderer/app.js` into modules. Introduce the i18n layer. Add `node:test` and write the first 5 test files. |
| **XL** | > 1 day | Architectural, multi-session guaranteed, deserves a `STATE.md` and an ADR | Modularize all of `main.js` into `src/main/{ipc,scan,worker-pool,thumbnails,cache}.js`. Bring up GitHub Actions + branch protection + CI test pipeline end-to-end. |

> **Lesson #1 — Always break XL into a sequence of L tasks before starting.** XL "as one task" produces sprawling diffs the agent gets lost in and you can't review. Pre-decompose into L slices, each with its own brief, plan, and PR.

> **Lesson #2 — When in doubt, the task is bigger than you think.** Junior orchestrators consistently underestimate. If you wrote "S" but the brief required three paragraphs of context, it's M. If three constraints already, it's L.

### 1.2 Write the brief in four parts

A good brief is **shorter than you think and more specific than you think**. Four sections:

```markdown
## Context
<2–4 sentences: why this task matters, what surrounds it, what the user sees today>

## Goal
<1–2 sentences: what state the codebase should be in when this is done. Observable, not aspirational.>

## Constraints
- Files in scope: <list — anything outside is forbidden>
- Behavior change: <"none" for refactor, "describe X" for feat/fix>
- Out of scope: <list — things the agent might be tempted to also do>
- Conventions: <link to CLAUDE.md sections that apply, e.g. "follow R3 for new pure functions">

## Done criteria
- [ ] <observable check 1 — passes a test, file under 400 lines, etc.>
- [ ] <observable check 2>
- [ ] <observable check 3>
```

> **Lesson #3 — `Done criteria` is the contract.** If you can't write a checkbox you can later verify with your eyes or a command, you're not ready to start. Write the checkboxes first; the rest of the brief follows.

> **Lesson #4 — `Out of scope` is half the brief.** Agents add value by spotting nearby cleanups. That's also how scope creep starts. List explicitly what you do **not** want touched: "do not rename existing variables", "do not introduce new dependencies", "do not edit `psd-worker.js`".

### 1.3 References are inputs, not templates

When you point the agent at example code (a similar feature, an OSS project, a stack overflow answer), say what role it plays:

- *"Use this as a reference for the **shape** of the IPC handler, but the actual logic is different."*
- *"Don't copy this — it's a counterexample of what to avoid."*
- *"This pattern is the consensus solution; adapt it to our naming and our error-handling rules."*

> **Lesson #5 — A reference without instructions is an order to copy.** If you paste code and say "do this", the agent will mimic it line-for-line, including details that don't apply. Always name the *aspect* you want carried over.

## Chapter 2 — During the task

### 2.1 The three pause points

These are the only moments where you, the orchestrator, must intervene. Skipping them breaks the trust loop.

**Pause 1 — Before any code is written.** The agent presents a numbered plan. You read it. You either approve, ask for adjustments, or kill the task. *Do not let work start without this.*

What you're checking: does the plan match the brief? Is the file list contained? Are the steps in a sensible order? Did the agent invent a step the brief didn't ask for?

**Pause 2 — After the first file.** When the agent finishes its first file (or first significant chunk), look at the diff before letting it move on.

What you're checking: is the *style* right? Are conventions being followed? Is the error handling shape what you expected? Catching drift after one file costs minutes; catching it after ten files costs hours.

**Pause 3 — Before every commit.** The agent runs `git status`, `git diff --stat`, and shows you the proposed commit message. You approve or reject.

What you're checking: are there *only* the files you expected? Does the message accurately describe what's there? Is the type prefix correct (`feat:` vs `refactor:` vs `fix:`)? Did unrelated changes sneak in?

> **Lesson #6 — Pause 3 catches more bugs than Pause 1.** Plans look fine on paper. The diff is reality. Force yourself to actually open every file in the diff, not just `git diff --stat`. The five-minute review at Pause 3 is the highest-ROI activity in your entire workflow.

> **Lesson #15 — A commit closes on evidence, not on assertion.** Four evidence-close lapses in the 036 run shared one root cause: evidence was pasted in intermediate blocks between tool calls, which do not reliably reach the chat — a transport failure, not protocol negligence. The executor protocol now codifies the Pause 3 evidence-close step (`git log --format=%B -1` pasted verbatim, confirmed against the approved message) plus three mechanical transport rules: the final-message rule, single-block packaging, and the no-debt precondition (no new Pause while an evidence-close is outstanding). The manual version of the precondition is what kept the 036 run recoverable — debt was settled before the run advanced. Numbering note: Lessons are numbered by discovery order, not position; #15 lives here because its subject is Pause 3.

### 2.2 Five signals the agent is drifting

Drift is when the agent stops working on what you asked and starts working on something adjacent. Five recognizable patterns:

**D1 — Cascade correction.** The agent tries to fix something, that fix breaks something else, the next fix breaks something else. Each commit message has "also" or "and now" in it. **Antidote:** stop. Revert to the last known-good commit. Re-write the brief with sharper constraints.

**D2 — Scope expansion.** The agent says "while I was here, I also...". You didn't ask. Even if the side change looks correct, accepting it sets the precedent that scope is negotiable. **Antidote:** ask the agent to revert the unrequested change in the same session and document the proposed change as a separate task.

**D3 — Overconfident output.** The agent writes assertions like "this is the standard way" or "everyone does it this way" without citing anything. Often the assertion is wrong, and even when right, the lack of citation prevents you from learning. **Antidote:** ask "where did you verify this?" — accept "I'd verify in docs X" but reject "trust me".

**D4 — Lost context.** The agent re-asks something already established, or proposes a pattern that contradicts `CLAUDE.md`. Often happens late in long sessions. **Antidote:** pause, re-paste the relevant rule, ask the agent to acknowledge it before continuing.

**D5 — Sycophancy spike.** "Great point!" "Excellent observation!" "You're absolutely right!" appearing in every reply. This is the agent in low-confidence mode trying to stay on your good side rather than thinking. **Antidote:** call it out directly: "skip the praise, just tell me what you think." Often resets the tone.

> **Lesson #7 — When you see drift, stop the session and start a new one.** It's cheaper than redirecting a derailed agent. New chat, paste the brief, paste the relevant CLAUDE.md sections, paste the last good commit SHA. The fresh context outperforms patching the broken one.

### 2.3 Redirecting without destroying work

When you catch drift early, you can redirect without scrapping. Two phrases that work:

- *"Stop. Before any more code, summarize where we are vs the brief and tell me what's out of scope."*
- *"Revert to the last commit. We'll re-plan."*

The second one feels brutal but is often the right call. The lost work is usually 20 minutes; the cost of carrying drift forward is hours.

## Chapter 3 — After the task — Review by symptoms

This is the **most useful chapter** for a solo dev with no human reviewer. When the agent says "done", run through these five symptom categories on the diff. They are JS/Electron-specific.

### A — Temporal instability (timing, async, races)

Look for:

- **A1 — Unawaited promises in handlers.** `ipcMain.handle('foo', async () => { doAsync(); return x; })` — the handler returns before `doAsync` finishes. Should be `await doAsync()`.
- **A2 — Worker task resolving twice.** Race between timeout firing (`task.resolve(null)`) and the real result arriving from `worker.on('message')`. Saci's `PsdWorkerPool` guards with `if (!task || task.id !== msg.id) return;` — verify any new task type preserves that guard.
- **A3 — Cache write/read races.** `fs.writeFileSync(cachePath, data)` immediately followed by another request reading the same path. Concurrent thumbnail requests for the same file race; the dedupe set `thumbInflight` in `renderer/app.js` is the guard. New caches need similar dedupe.
- **A4 — `setTimeout` without cleanup on cancellation.** A timeout that fires after the parent context is gone (worker terminated, IPC disconnected) can crash on undefined references. Always `clearTimeout` in the cancel path.
- **A5 — Sync FS in async function.** `async function foo() { fs.readFileSync(...) }` — works but blocks the event loop. Either commit to sync (and accept the block) or use `fs.promises.readFile`.

### B — Hidden errors

Look for:

- **B1 — Silent catch.** `catch {}` or `catch (e) { return null }` with no log. Violates `CLAUDE.md` R4. Every `catch` must log with context or rethrow.
- **B2 — Optional-chain swallowing real bugs.** `result?.foo?.bar?.baz` — if `result.foo` is supposed to exist and doesn't, the chain returns `undefined` and you debug the wrong layer. Use `?.` only where the absence is genuinely expected.
- **B3 — `try` around too much code.** A 30-line `try` block where line 5 throws — the catch logs the wrong context. Tighten the `try` to the smallest range that can throw.
- **B4 — Worker errors that never reach the renderer.** Worker `postMessage({ error: ... })` is sent but the main process maps it to `null` for the renderer. The renderer falls back to a placeholder. The actual error never reaches you. Solution: log worker errors in main with the file path that triggered them.
- **B5 — IPC handler crashes invisible to the user.** A handler that throws crashes the renderer's `await` silently (rejects with `Error: An object could not be cloned`). Always return `{ ok: boolean, error?: string }` and let the renderer handle both branches.

### C — Complexity (smells)

Look for:

- **C1 — Function over 50 lines.** Violates `CLAUDE.md` R6 (with the orchestration-handler exception). Pass: split by responsibility.
- **C2 — File over 400 lines.** Violates R5. Pass: extract a module.
- **C3 — More than four parameters.** A function taking `(filePath, mtime, size, ext, options, callback)` is doing too much. Group into one options object or split the function.
- **C4 — Nesting deeper than three levels.** `if (a) { for (...) { try { if (...) { ... } } } }`. Flatten with early returns or extracted functions.
- **C5 — Boolean trap.** `doThing(true)` — what is `true`? Use a named flag (`{ overwrite: true }`) or split into `doThingOverwrite()` / `doThingNoOverwrite()`.

### D — Inconsistency

Look for:

- **D1 — Different return shapes for similar IPC handlers.** Some return `{ ok, error }`, others `{ url, error }`, others throw. Pick one shape and migrate.
- **D2 — Mixed pt-BR / English in dev surface.** Violates A6. Mark as legacy under E3a if pre-existing; never introduced new.
- **D3 — Two ways to do the same thing.** `crypto.createHash('sha1')` in one place, `crypto.createHash('md5')` in another, both as cache keys. Pick one.
- **D4 — Drifting log format.** `console.error('Worker error:', err.message)` here, `console.error('[WORKER]', err)` there. Adopt one prefix and one shape.
- **D5 — Mixed quote styles or trailing-comma styles.** Trivial alone but signals that no auto-formatter is running. Resolve with a formatter (Prettier or `dprint`) when introduced.

### E — Scope blur

Look for:

- **E1 — Refactor PR also contains a bug fix or a feature.** Violates `CLAUDE.md` R14. Reject and split.
- **E2 — Files modified outside the brief's "in scope" list.** Even harmless changes erode the brief's authority. Revert them in the same session.
- **E3 — New dependency added.** Check `package.json` and `package-lock.json`. Was it justified in the PR description? If not, reject (CLAUDE.md R2).
- **E4 — Style-only changes mixed with logic changes.** Reformatting a 200-line file makes the real diff invisible. Style passes are their own commit.
- **E5 — Renamed identifiers in unrelated code.** `s/oldName/newName/` across files that weren't part of the task. Revert; rename is its own task.

> **Lesson #8 — Run the full symptom list every time.** Even on small PRs. It takes 5 minutes once you internalize the categories. Skipping it once trains you to skip it forever, and that's how solo devs ship bugs.

## Chapter 4 — Orchestration anti-patterns (O*)

These are mistakes you (the orchestrator) can make. None of them are the agent's fault. All of them are detectable in real time.

**O1 — Sending a reference without adaptation instructions.**
*Symptom:* You paste code and say "do this". Agent copies line-for-line, including parts that don't fit Saci.
*Fix:* Always say what role the reference plays — see lesson #5.

**O2 — Over-explaining out of insecurity.**
*Symptom:* Brief grows past one page because you keep adding "and remember to consider X". Agent gets confused about what's primary.
*Fix:* Trim to the four sections (Context / Goal / Constraints / Done). If a "remember" doesn't fit one of those, it's not in this task's scope.

**O3 — Trusting without verifying.**
*Symptom:* Agent says "tests pass". You merge. Tests didn't actually pass; the agent confused "tests not red" with "tests not run".
*Fix:* `npm test` yourself. `cat .githooks/pre-commit` yourself. The agent's word is hypothesis until you confirm.

**O4 — Skipping the plan.**
*Symptom:* You're in a hurry. You say "just do it". Agent invents a plan you didn't see, makes 8 wrong assumptions, produces a diff you don't understand.
*Fix:* Pause 1 is non-negotiable, even on S tasks. The plan takes 30 seconds for an S task and saves 30 minutes of confusion.

**O5 — Continuing when the agent is in cascade.**
*Symptom:* Each commit fixes the previous commit. You hope the next one will stabilize. It won't.
*Fix:* See D1 / lesson #7. New session. Last good commit. Re-brief.

**O6 — Changing the goal mid-session.**
*Symptom:* You realize halfway that the task should also include X. You add X. Agent now juggles two goals; neither finishes well.
*Fix:* Finish the original task. Open a new task for X. The 30-minute boundary is real.

**O7 — Accepting a vague answer because it sounds technical.**
*Symptom:* Agent says "I refactored the worker pool to be more idiomatic." You don't know what changed. You merge.
*Fix:* "More idiomatic" is not an answer. Force concrete: "specifically, what changed in line numbers and why?"

**O8 — Not updating `STATE.md` before pausing.**
*Symptom:* You stop a long task at lunch. You come back three hours later. The next session can't reconstruct what was decided.
*Fix:* `STATE.md` updated at every pause point. Treat updating it as part of "done for now".

**O9 — Not documenting new learnings.**
*Symptom:* You hit the same gotcha twice in a month. The first time you solved it; the second time you forgot how.
*Fix:* When the session teaches you something the docs don't have, add it. New gotcha → `GOTCHAS.md`. New rule → `CLAUDE.md`. New mentor pattern → `MENTOR_BRIEF.md` §3.

> **Lesson #9 — Anti-pattern detection is faster than anti-pattern recovery.** Reading the O list once a week trains your reflexes. Each time you spot one in real time, you save the cost of recovering from it later.

## Chapter 5 — Continuous growth

This document — and `CLAUDE.md`, `MENTOR_BRIEF.md`, `GIT_WORKFLOW.md`, `GOTCHAS.md` — are alive. Their value comes from being updated as you learn.

### When a failure becomes a rule

If the same mistake happens twice within a few weeks:
- **First time:** fix and move on.
- **Second time:** add to `CLAUDE.md` as a rule (Rn) or anti-pattern (An). Reference the two incidents in the rule's reasoning.
- **Third time:** it means the rule isn't being read. Move it into the agent's session-start checklist (`harness/workflows/setup-code.md`) so it's surfaced explicitly.

### When to expand vs simplify

The docs grow naturally. They also need pruning:

- **Expand:** when a rule is consistently surprising agents or you find yourself explaining it repeatedly. The rule is too short.
- **Simplify:** when a rule has not been violated in three months. Either it's so internalized it doesn't need words, or it's not relevant anymore. Trim.

> **Lesson #10 — Doc weight is a tax. The tax is worth paying for the right rules.** The wrong rules — vague ones, ones nobody reads, ones that no longer apply — are pure cost. Quarterly review: is each rule earning its keep?

### What this playbook is, and isn't

This is **your** operating manual. It is not the agent's instruction set — that's `CLAUDE.md`. It is not project-specific code documentation — that's `README.md` and the source. It is the meta-layer that lets you turn "I'm using AI agents" from a chaos into a craft.

Read this file end-to-end every 4–6 weeks until lessons #1–#10 are reflexes. After that, scan the lesson titles only — they will trigger the right behavior on their own.

## Chapter 6 — The roles and the orchestration pipeline (Orchestrator → planner → brief-validator → executor → closer)

The pipeline runs inside Claude Code under a role-based separation: roles, not surfaces, define who does what. Chat (claude.ai) is the conceptual surface — it hosts the Mentor role and stays out of the operational loop entirely. This chapter defines the six roles, then describes how to drive the pipeline and what to do when it surfaces a problem. The role model was ratified in the fused-model design session (`docs/sessions/2026-07-25-mentor-fused-model-design.md`) and piloted end to end on task 038.

### The six roles

| Role | Where | What it does |
|---|---|---|
| **Mentor** | Chat (claude.ai) — the conceptual surface | Learning, pre-task exploration, meta-discussions. No gate, no task modeling, no operational rulings. |
| **Orchestrator** | Claude Code — the main session | Task modeling, decision closure with the owner, delegation to subagents, the orchestrator gate, the write gate, session close-out. |
| **planner** | Claude Code — subagent | Authors briefs from delegation prompts. |
| **brief-validator** | Claude Code — subagent | Audits briefs mechanically; emits APPROVED or REJECTED. |
| **executor** | Claude Code — subagent | Runs approved briefs — Edits, Pauses, commits. |
| **closer** | Claude Code — subagent | Reviews the assembled diff before push; emits a report. Phase B pushes and opens the PR on explicit owner instruction. |

### The Orchestrator

The Orchestrator is the main session, not a subagent. Subagents get fresh context per invocation and are non-dialogic; the Orchestrator is a long-form dialogic session with the owner, opened in Plan mode via a harness init prompt (`harness/workflows/setup-orchestrator.md`). Session shape:

- Opens with the M-R13 identity + mode declaration (`docs/MENTOR_BRIEF.md`).
- Runs one task per session and closes with a recap (see "Recap policy" below).
- Never performs a subagent's work inline. If a subagent invocation fails, the session fails loud and reports; it does not absorb the work.

Write policy: Plan mode is the session default. The Orchestrator writes ONLY under `docs/`, per artifact, via the write gate — show the full content → owner approves → write → read back from disk → confirm byte-match. Source code exists only behind `@executor`; the Orchestrator never writes it.

### The closer

The closer is the sixth role and the only one that acts on the assembled result rather than on the plan. It reads `git diff main...HEAD` on a task branch and runs three narrow checks — architecture against `CLAUDE.md` R18–R25, duplication against what `core` actually exports, and secret/path hygiene — then emits one pt-BR report and stops. Phase A is strictly read-only: the closer creates, modifies and stages nothing, and it never merges. Its verdict is **input to your judgment, not a gate that opens itself**: a clean report does not authorize the push, and a `trava` finding is a recommendation, not a veto the closer enforces (lesson #14 again, one role further down the line). When you disagree with the report, route through the same three responses as a REJECTED verdict or a rejected orchestrator gate — redesign with the Orchestrator, fix directly on the branch, or override the finding and record why. Phase B — push the branch, open the PR, and post-merge confirm the merge SHA — runs only on your explicit per-branch instruction, never inferred from a clean Phase A.

### When to use the pipeline vs. caminho B

Two entry points coexist:

- **Pipeline (default for new tasks):** the Orchestrator invokes the planner with a task description; planner writes the brief, validator audits it, executor runs it. Use when the task started from a conceptual-surface discussion (Mentor) or a clear single-paragraph delegation.
- **Caminho B (fallback):** the brief is authored without the planner — under the fused model, the Orchestrator authors it via the write gate, with you closing decisions one at a time — pre-saved to `docs/tasks/<NNN>-<slug>/brief.md`, and the executor is invoked directly. Use when the brief shape needs hand-tuning a delegation prompt cannot carry (large structural edits, doctrinal briefs, bootstrap scenarios where the pipeline itself is being modified).

The pipeline and caminho B are not mutually exclusive: caminho B is what you reach for when the pipeline would loop on its own creation, or when the task carries decisions that didn't fit a delegation prompt.

> **Lesson #11 — The pipeline is a default, not a mandate.** Use it for clear delegations. Reach for caminho B when the brief needs the kind of judgment that doesn't compress into a prompt. The cost of the wrong choice is small; the cost of forcing the pipeline on a brief it can't handle is a rejected verdict and a redo.

### Invocation patterns

**Pipeline invocation (in the Orchestrator session):**

```
Open a new task: <task description in 1-2 paragraphs>.
Invoke @planner.
```

The Orchestrator then:
1. Invokes planner with the description.
2. Receives planner's final message (brief authored, branch, commit SHA).
3. Invokes `@brief-validator` with the brief path and branch.
4. Receives the validator's verdict report.
5. If `Verdict: APPROVED` — surfaces the brief, the validator's verdict report, and the brief commit's diff, then halts at the orchestrator gate (see "The orchestrator gate" below). The executor is invoked only after you give an explicit go.
6. If `Verdict: REJECTED` — surfaces the report to you. See "Verdict handling" below.

**Caminho B invocation (in the Orchestrator session):**

```
Execute brief at docs/tasks/<NNN>-<slug>/brief.md on branch <branch>.
Invoke @executor.
```

You skip planner and validator. The executor runs the brief as-is.

### Verdict handling

When the validator emits `Verdict: APPROVED`, the Orchestrator surfaces the result and halts at the orchestrator gate (below).

When the validator emits `Verdict: REJECTED`, the Orchestrator surfaces the report and waits. The report names each failed check, the violated rule with a GitHub deep-link, the observed vs. expected text, and the line in the brief where the failure was detected.

You then choose one of three responses:

1. **Redesign with the Orchestrator.** The cleanest path when the FAIL reveals a design gap — the brief asks for something the validator's checks correctly flag as out of convention. Re-open the affected decisions in the Orchestrator session (conceptual exploration, if any, goes to the Mentor on the conceptual surface); the Orchestrator authors the corrected brief via caminho B; re-invoke validator and executor.
2. **Fix directly on the branch.** Use when the FAIL is a small mechanical slip the planner introduced (subject overflow, missing section header, branch type mismatch). Edit the brief on disk; re-invoke `@brief-validator` to re-audit. If APPROVED, proceed to executor.
3. **Override the validator.** Use when you know the FAIL is correct under unusual circumstances the validator can't see (e.g. a brief that intentionally violates a convention to introduce its replacement — the cluster bootstrap case). Skip the validator and invoke `@executor` directly. Document the override in the brief's "Plan required justification" or a dedicated decision block; the mentor session recap should also capture the override.

> **Lesson #12 — REJECTED is a decision point, not a failure state.** The validator's job is to flag mechanical drift; your job is to decide whether the drift is the bug or the convention is the bug. Three responses, one chosen per case, none default. Auto-loop back to planner was rejected at cluster design (D4) precisely because the user-judgment step protects against silent validator errors.

### The orchestrator gate (APPROVED → executor)

A `Verdict: APPROVED` does not auto-advance to the executor. The Orchestrator halts at the orchestrator gate and surfaces three things to you: the brief, the validator's verdict report, and the brief commit's diff. You review and give an explicit go before the executor is invoked.

This is a semantic checkpoint, not a tool prompt. The Orchestrator must not treat Claude Code's per-command permission prompts as the go, and must not proceed on silence — the same Pause semantics the executor obeys during a run apply here at the orchestration layer.

The gate is yours, not the validator's. The validator audits the brief mechanically against the brief-template conventions; the gate is where you judge whether the brief is the right thing to build — scope, grounding, and whether a closed decision drifted in translation between the delegation and the brief. A brief can be mechanically clean and still wrong; the gate is the catch the validator structurally cannot be.

If you reject at the orchestrator gate, route through the same three responses as a `REJECTED` verdict (redesign with the Orchestrator, fix on branch, or override). The gate and the verdict share one rejection protocol.

> **Lesson #14 — The gate is the human's, not the validator's.** APPROVED is the validator clearing mechanical drift; it is not a green light to the executor. Evidenced across sessions 019, 020, 021, 023, and 026: a human review window between validator and executor caught scope and translation slips that a mechanically-clean brief still carried. Auto-advancing past that window is the failure mode this gate closes — the cost of the gate is one review per task; the cost of skipping it is an executor run against the wrong brief.

### Subagent Pause transport (operating knowledge)

This is operating knowledge, not a numbered rule: subagents cannot wait interactively for chat input, so Pause semantics ride a different transport. A Pause under subagent transport is a STOP-and-return — the executor stops, returns with the whole Pause presentation as one fenced block, and the run resumes only when your approval is relayed back as a continuation message. Zero Pauses may be crossed without an explicit relayed go; the semantics are identical to an interactive Pause, only the transport is swapped.

Mid-run owner rulings become files: instead of relaying a ruling as a chat paste, the Orchestrator writes it to `docs/tasks/<NNN>-<slug>/notes.md` (write gate applies). Byte-exact by construction, and a durable record for free.

### Recap policy (three recaps)

Three roles produce session recaps; three produce none:

- **Mentor** (chat sessions): transport unchanged — the recap travels on its own `docs/` branch + PR.
- **Orchestrator**: decisions, gate outcome, deviations, queue state, next-session snippet. No execution log.
- **executor**: pure execution log — Edits, Pauses, evidence, commits. No context re-narration.
- **planner**, **brief-validator** and **closer**: no recaps. The committed brief, the recorded verdict and the emitted report are their record.

Transport: Orchestrator and executor recaps ride the session PR. Standard sequence: brief → code (executor, Pauses) → recaps (`docs(sessions):` commit on the same branch) → push + PR on owner instruction → owner squash-merge. Consequence: a recap cannot cite its own PR's merge SHA; the NEXT session confirms the merge via P4 / `git log` in its "Consumes" line. The separate docs PR for task sessions is retired, and the `[CONFIRMAR: docs PR]` pendency class dies with it. Post-merge, the closer's Phase B confirms the merge SHA in-session (brief 048, D5), while authoring the next-session snippet remains the Orchestrator recap's duty.

### Blindness rules

The agent cannot see the permission layer, and you have low native visibility into session/subagent boundaries. Three rules compensate:

- **Post-write read-back is mandatory.** An owner-approved write returns to the agent as a plain success, indistinguishable from an ungated one — a write is verified only by reading the file back from disk and confirming the content.
- **Every subagent invocation is announced**: one line before (who is being invoked, for what) and one line after (what came back).
- **Authority over gating claims is owner-only.** The agent never asserts that a permission prompt did or did not appear; only your observation counts.

### Git operations under the fused model

R17 restated for Orchestrator sessions — the letter of the rule holds; the fused model adds precision:

- Writing a file is not committing it. Each is its own approved step.
- Branch creation requires explicit owner approval from a verified base SHA.
- Push and PR opening are allowed only on explicit per-branch owner instruction — never `main`, never `--force`.
- Permission prompts are a second layer, not a substitute for instruction: plain "Accept" / "Allow once" only. "Accept and auto mode" and "Always allow" are forbidden in Orchestrator sessions — each silently dismantles the prompt layer.

### When NOT to use the pipeline

- **The task modifies the pipeline itself.** Cluster 013-015 is the canonical example: a brief that creates the validator can't be audited by the validator; a brief that redesigns AGENT_PLAYBOOK's pipeline chapter can't be planned by the agent reading the old chapter. Use caminho B for these.
- **The task is Category S.** A one-line chat message in the executor session is enough. No brief, no pipeline.
- **The task is exploratory.** Discovery work where the shape of the output is unclear belongs on the conceptual surface first (Mentor, in chat); only after the shape stabilizes does it come back to an Orchestrator session as a brief.
- **Multiple architectural decisions remain open.** The planner produces briefs from delegations, not from incomplete designs. If the delegation prompt would need to say "and decide between X and Y", the work isn't ready for the pipeline yet.

> **Lesson #13 — The pipeline runs on closed decisions.** Open decisions close before delegation — in the Orchestrator's decision modeling with you, or on the conceptual surface (Mentor) while still exploratory. The planner faithfully encodes what you delegate; if the delegation has gaps, the brief has gaps; if the brief has gaps, the executor will either STOP or invent. None of those are good outcomes.

### Troubleshooting

| Symptom | Diagnosis | Response |
|---|---|---|
| Planner STOPs with "ambiguous input" | Delegation prompt lacked clear Goal | Rework the delegation in the Orchestrator session; rewrite it into 1-2 imperative sentences |
| Planner STOPs with "NNN resolution conflict" | P4 three-source check disagreed | Manually resolve the slot number; pass it explicitly in the next delegation |
| Validator REJECTED with FAILs you disagree with | Convention vs. intentional deviation tension | Use override path (option 3 above); document the override |
| Validator REJECTED with FAILs you didn't anticipate | Planner output drifted from brief-template SKILL | Fix on branch (option 2); re-validate |
| Executor STOPs at Pause 2 with "file outside scope" | Brief's scope didn't predict a required side-effect | Revise the scope in the Orchestrator session; re-execute |
| Executor reports pre-commit-self-audit FAIL | Mechanical slip in commit subject or staging | Fix the subject or restage; re-run the audit; commit |

## Related documents

| File | Purpose |
|---|---|
| `CLAUDE.md` | Code rules for the executor agent (Claude Code) |
| `docs/MENTOR_BRIEF.md` | Behavioral rules for the mentor agent (Claude in chat) |
| `docs/GIT_WORKFLOW.md` | Operational git discipline — branches, PRs, hooks, releases |
| `docs/GOTCHAS.md` | Stack-specific traps catalog (`G-CAT-N` IDs) |
| `docs/AGENT_PLAYBOOK.md` | This file — orchestration manual for the user |
| `.claude/agents/planner.md` | Planner subagent — authors briefs from delegation prompts |
| `.claude/agents/brief-validator.md` | Brief-validator subagent — audits briefs with 10 mechanical checks |
| `.claude/agents/executor.md` | Executor subagent — runs briefs (pipeline-invoked) |
| `.claude/agents/closer.md` | Closer subagent — reviews the assembled diff before push |
| `.claude/skills/brief-template/` | Brief authoring template (preloaded by planner and brief-validator) |
| `.claude/skills/pre-commit-self-audit/` | Executor's Pause-3 self-audit checklist |
| `harness/workflows/` | Pre-built session templates for manual invocation (parallel surface to `.claude/agents/`) |
| `README.md` | End-user description of Saci |
