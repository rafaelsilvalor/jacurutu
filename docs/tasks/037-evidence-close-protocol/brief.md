# Brief 037 — evidence-close-protocol

Category: M
Plan required: no
Branch: `docs/executor-evidence-protocol`

## Context

The 036 run surfaced four evidence-close lapses with a single root cause:
evidence pastes were emitted in intermediate blocks between tool calls,
which do not reliably reach the chat — a transport failure, not protocol
negligence (see `docs/sessions/2026-07-14-mentor-036-keyless-start-execution.md`
and the executor recap, "Process notes"). The executor self-corrected
mid-run by moving all evidence to the turn's final message; the manual
precondition "no new Pause while evidence debt is outstanding" is what
kept the run recoverable. Four occurrences with an identified cause is
above rule-of-three; this brief formalizes the doctrine.

Ground-truth finding that widened the scope from two rules to three: the
evidence-close step itself is codified nowhere. `.claude/agents/executor.md`
"Pause 3 — Before every commit" ends at step 6 ("Wait for explicit user
approval before running `git commit`"); the practice of pasting
`git log --format=%B -1` verbatim after each commit exists only in session
recaps and runtime mentor instructions. The transport and precondition
rules would reference an unwritten step; this brief writes it first.

This is a pipeline-modifying brief: authored by the mentor (caminho B,
M-R15), owner pre-saves it, executor invoked directly — no planner, no
validator (precedent: brief 027).

P4 slot evidence (three sources, checked 2026-07-15):
- `ls docs/tasks/` — highest existing slot: `036-keyless-start`. Gaps
  004-006 (burned in the v1→v2 pivot, `CLAUDE.md` E5) and 034 (brief-less
  docs session) are preserved, not free.
- `git log --oneline main` — newest task work is 036 (PR #88 at
  `e1b73ab`); no reference to any slot above 036.
- `CLAUDE.md` E* — E1-E5 are v1-freeze exceptions, none reserves a
  forward slot.

## Out of scope

- Any change to the Pause semantics themselves (what Pauses 1/2/3 are,
  when they fire, what the go signal is).
- Any change to `pre-commit-self-audit`, the planner, the validator, or
  `.claude/skills/brief-template/SKILL.md`.
- Any tooling or automation to enforce the rules (hooks, scripts).
- Rewording of existing Lessons or renumbering of anything.

## Edits

### Edit 1 — Verify brief on disk and commit as commit #1

This brief was pre-saved by the owner at
`docs/tasks/037-evidence-close-protocol/brief.md`. Verify it exists at
that exact path and matches this content. Do not regenerate the brief
from memory. Commit it as commit #1.

Verification:

- [ ] `ls docs/tasks/037-evidence-close-protocol/brief.md` succeeds
- [ ] First line reads `# Brief 037 — evidence-close-protocol`

Commit: `docs(tasks): add brief for 037-evidence-close-protocol`

### Edit 2 — Codify the three rules in the executor agent file

Modify `.claude/agents/executor.md` with two find-block edits. If either
find block does not match byte-exact, STOP and report — do not adapt.

**Edit 2a.** Find:

```
6. Wait for explicit user approval before running `git commit`.

Do not put the audit report in the commit message body — it is chat-only.
```

Replace with:

```
6. Wait for explicit user approval before running `git commit`.
7. After `git commit` succeeds, run `git log --format=%B -1` and paste its
   output verbatim in chat — this is the **evidence-close** of the commit.
   The Pause is closed only when the pasted output is confirmed by the
   user against the approved message. An assertion that the commit was
   made ("committed as approved") does not close the Pause; only the
   pasted output does.

Do not put the audit report in the commit message body — it is chat-only.
```

**Edit 2b.** Insert a new subsection immediately after the "Pause 3 —
Before every commit" subsection (after the paragraph beginning "If any
audit check returns FAIL" and before the next `##` heading). Find:

```
If any audit check returns FAIL, do not auto-correct. Report the FAIL and let
the user decide whether to amend the subject, unstage files, or proceed
knowing the cause. If Check 3 (imperative mood) returns STOP because the verb
is unclassified, halt and wait for user instruction.
```

Replace with:

```
If any audit check returns FAIL, do not auto-correct. Report the FAIL and let
the user decide whether to amend the subject, unstage files, or proceed
knowing the cause. If Check 3 (imperative mood) returns STOP because the verb
is unclassified, halt and wait for user instruction.

### Evidence transport and Pause precondition

Two mechanical rules govern every piece of evidence this file requires —
evidence-closes (Pause 3 step 7), guard outputs, verification transcripts:

- **Final-message rule.** Evidence goes in the turn's **final message
  block**, never in an intermediate block between tool calls. Intermediate
  blocks do not reliably reach the chat; evidence emitted there is lost in
  transport and the Pause stays open. If tools must run after the evidence
  is produced, re-paste the evidence at the end of the turn.
- **Single-block packaging.** Every Pause presentation (marker,
  artifact, status, diff --stat, proposed message, audit report) and
  every evidence-close paste is emitted as ONE fenced code block, so
  the owner can copy it whole, in one click, into the mentor chat.
  Prose outside the block is allowed only before the marker or after
  the block ends.
- **No-debt precondition.** No new Pause opens while a prior
  evidence-close is outstanding. If evidence debt exists, settle it first
  — paste the missing output verbatim in a final message block and get it
  confirmed — before emitting the next Pause marker or starting the next
  Edit. Root cause and rationale: the 036 run
  (`docs/sessions/2026-07-14-executor-036-keyless-start.md`, Process
  notes).
```

Verification:

- [ ] `grep -n "evidence-close" .claude/agents/executor.md` shows the new
      step 7 and the new subsection
- [ ] `grep -n "Final-message rule" .claude/agents/executor.md` — 1 hit
- [ ] `grep -n "No-debt precondition" .claude/agents/executor.md` — 1 hit
- [ ] `grep -n "Single-block packaging" .claude/agents/executor.md` — 1 hit
- [ ] `git diff --name-only` shows only `.claude/agents/executor.md`
- [ ] Pause 1/2 subsections and "What a Pause is (and is not)" untouched

Commit: `docs(agents): add evidence-close rules to executor Pause 3`

### Edit 3 — Document the doctrine as a Lesson in the playbook

Modify `docs/AGENT_PLAYBOOK.md`. Before editing, run
`grep -n "Lesson #15" docs/AGENT_PLAYBOOK.md` — if it returns any hit,
STOP and report (numbering conflict; the mentor renumbers).

Find (the closing blockquote of the Pause section in Chapter 2):

```
> **Lesson #6 — Pause 3 catches more bugs than Pause 1.** Plans look fine on paper. The diff is reality. Force yourself to actually open every file in the diff, not just `git diff --stat`. The five-minute review at Pause 3 is the highest-ROI activity in your entire workflow.
```

Replace with:

```
> **Lesson #6 — Pause 3 catches more bugs than Pause 1.** Plans look fine on paper. The diff is reality. Force yourself to actually open every file in the diff, not just `git diff --stat`. The five-minute review at Pause 3 is the highest-ROI activity in your entire workflow.

> **Lesson #15 — A commit closes on evidence, not on assertion.** Four evidence-close lapses in the 036 run shared one root cause: evidence was pasted in intermediate blocks between tool calls, which do not reliably reach the chat — a transport failure, not protocol negligence. The executor protocol now codifies three rules: the Pause 3 evidence-close step (`git log --format=%B -1` pasted verbatim, confirmed against the approved message), the final-message transport rule, and the no-debt precondition (no new Pause while an evidence-close is outstanding). The manual version of the precondition is what kept the 036 run recoverable — debt was settled before the run advanced. Numbering note: Lessons are numbered by discovery order, not position; #15 lives here because its subject is Pause 3.
```

If the Lesson #6 find block does not match byte-exact (line wrapping may
differ on disk), STOP and report the actual text — do not adapt silently.

Verification:

- [ ] `grep -c "Lesson #15" docs/AGENT_PLAYBOOK.md` returns 1
- [ ] `git diff --name-only` shows only `docs/AGENT_PLAYBOOK.md`
- [ ] Lesson #6 text unchanged except the appended blockquote after it

Commit: `docs(playbook): document evidence-close doctrine as Lesson 15`

## Automated checks (run before each commit)

- [ ] `npm run build` passes (no source touched; sanity only)
- [ ] `npm test` passes (no source touched; sanity only)

## Structural checks

- [ ] `git diff --name-only origin/main..HEAD` shows exactly:
      `docs/tasks/037-evidence-close-protocol/brief.md`,
      `.claude/agents/executor.md`, `docs/AGENT_PLAYBOOK.md`
- [ ] No file under `packages/**` or `harness/**` modified

## Git checks

- [ ] Branch used: `docs/executor-evidence-protocol`
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

## Process checks

- [ ] Pause 2 — first modified file shown for review before proceeding
- [ ] Pause 3 — status + diff --stat + message + self-audit before each
      commit
- [ ] The rules this brief introduces are honored **during this run**:
      every commit evidence-closed via `git log --format=%B -1` verbatim
      in the turn's final message; no Pause opened over outstanding debt

## Plan required justification

- Three fixed Edits with byte-exact find blocks and STOP guards; no
  design freedom remains.
- Docs-only; no source, no tests, no build surface.
- The brief itself is the plan (027 precedent for pipeline briefs).
