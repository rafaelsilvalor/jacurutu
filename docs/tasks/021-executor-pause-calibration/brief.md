# Brief: 021 — executor.md Pause semantics calibration

> **Category:** M
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/executor-pause-calibration`
>
> Pre-saved to disk by the user (caminho B). Paste the executor invocation
> after this brief is on disk and brief-validator has audited it.

---

## Context

The executor agent (`.claude/agents/executor.md`) honors three Pauses defined
in the brief and in `docs/AGENT_PLAYBOOK.md` Chapter 2. A Pause is meant to be
a **semantic** checkpoint: the executor stops, surfaces a specific artifact
(the plan, the first changed file, or `git status` + diff + message), and waits
for the orchestrator to review before proceeding.

Across three task runs the executor has **auto-advanced** past a Pause
(planner→validator in 019; executor→past-Pause-2 in 020 — the rule-of-three
threshold). The 020 failure is diagnostic: after "proceed to Pause 2" the
executor wrote the first module and ran roughly twenty tool uses without
surfacing the file for the semantic Pause 2. Root cause: it conflated the
**host's per-command tool-permission prompts** (Claude Code asking "run this
bash?") with the **brief's semantic Pause**. A stream of granted permissions
felt like a gate, so the Pause was never announced.

`executor.md` currently does not (a) distinguish a host permission prompt from
a semantic Pause, (b) define what signal actually satisfies a Pause, or
(c) require an unmistakable announcement when it pauses. It also has no STOP
guard for the related failure surfaced in 020 — a silent structural deviation
from the approved plan (the `extract.ts` consolidation, ratified after the fact
but never STOP-confirmed before writing).

This brief is pipeline/skill-modifying, so it is authored via caminho B
(M-R15). It touches one file: `.claude/agents/executor.md`.

## Goal

1. Add a "What a Pause is (and is not)" subsection to `## Pauses` in
   `executor.md` that distinguishes a semantic Pause from host tool-permission
   prompts, defines the go signal, and specifies a literal Pause marker.
2. Add a STOP condition to `## STOP conditions` covering silent structural
   deviation from the approved plan or the brief's Edit map.

## Constraints

### Non-negotiable constraints

1. Only `.claude/agents/executor.md` (and this brief file) may be modified. If
   anything else needs changing, STOP and report.
2. The `### Pause 1`, `### Pause 2`, and `### Pause 3` subsection bodies are
   **not** modified — Edit 2 inserts a new subsection ahead of them and amends
   only the `## Pauses` opener sentence.
3. `executor.md` stays English (R9 — agent-consumed surface; `.claude/**`).
4. Follow all of `CLAUDE.md` and `docs/GIT_WORKFLOW.md`: new branch,
   Conventional Commits (R10/G-R3), no `Co-authored-by` (G-A7), no `--no-verify`
   (R13/G-R8), no proactive push (R17/G-R5).
5. All commits in this brief use type `docs:` (scope `agents`).

### Out of scope (do not touch in this brief)

- `docs/AGENT_PLAYBOOK.md` — the planner→validator review-gate item is a
  separate change (different gate, different file).
- The `## Judgment flags` block convention on the mentor side — separate
  meta-item.
- `.claude/agents/planner.md`, `.claude/agents/brief-validator.md`.
- `.claude/skills/**` (including the `customfield_`/grep-tightening item).

### Architectural decisions already made (do not revisit)

Closed in the mentoring session (chat, 2026-06-08). Executor implements; does
not propose alternatives.

- **D1 — Scope is `executor.md` only.** Two changes: the Pause-semantics
  subsection and the plan-deviation STOP guard. The AGENT_PLAYBOOK gate and the
  Judgment-flags doc are explicitly deferred to their own items.
- **D2 — A Pause is satisfied only by an explicit chat go, distinct from any
  host tool-permission approval.** Approving N bash/edit prompts never advances
  a Pause. If the only input is tool-permission approvals, the executor remains
  paused and keeps waiting.
- **D3 — Pauses are announced with a literal marker:**
  `=== PAUSE <N> — <what is being surfaced> — awaiting explicit go ===`.

---

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The user pre-saved this brief to
`docs/tasks/021-executor-pause-calibration/brief.md` before invoking the
executor (caminho B). The executor verifies presence and commits.

- [ ] Directory `docs/tasks/021-executor-pause-calibration/` exists
- [ ] File `docs/tasks/021-executor-pause-calibration/brief.md` exists; first
      line is `# Brief: 021 — executor.md Pause semantics calibration`
- [ ] `git add docs/tasks/021-executor-pause-calibration/brief.md` is staged
- [ ] Commit #1 created with subject
      `docs(tasks): add brief for 021-executor-pause-calibration`

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

---

### Edit 2 — `executor.md`: Pause semantics subsection

In `.claude/agents/executor.md`, find:

```markdown
## Pauses

You honor three Pauses per `docs/AGENT_PLAYBOOK.md` Chapter 2:

### Pause 1 — Before any change
```

Replace with:

```markdown
## Pauses

You honor three Pauses per `docs/AGENT_PLAYBOOK.md` Chapter 2. Each Pause
follows the semantics in "What a Pause is (and is not)" below: emit its marker,
surface its artifact, and wait for an explicit chat go before proceeding.

### What a Pause is (and is not)

A Pause is a **semantic checkpoint**, not a mechanical one. At a Pause you:

1. STOP — write no further file and run no further command toward the next Edit.
2. Emit the Pause marker on its own line (see below), followed by the artifact
   the Pause requires (the plan, the changed file, or `git status` +
   `git diff --stat` + the proposed message).
3. WAIT for an explicit go from the user in chat before proceeding.

**The host's tool-permission prompts are not Pauses and never satisfy one.**
Under Claude Code (or any host), each `Bash`, `Write`, or `Edit` call may
trigger a per-command permission prompt. Approving those prompts authorizes
individual tool calls — it does not authorize advancing past a Pause. You may
run twenty approved commands and still owe the user a Pause. Do not treat a
sequence of granted permissions as the go signal.

**The go signal is an explicit affirmative chat message** from the user ("ok",
"segue", "aprovado", "go", or equivalent) responding to the Pause you
announced. If the only input you receive is host tool-permission approvals, you
remain paused — keep waiting.

**Pause marker.** Announce every Pause with a literal marker line:

```
=== PAUSE <N> — <what is being surfaced> — awaiting explicit go ===
```

Examples:
`=== PAUSE 1 — numbered plan — awaiting explicit go ===`
`=== PAUSE 2 — first modified file — awaiting explicit go ===`
`=== PAUSE 3 — git status + diff + message — awaiting explicit go ===`

### Pause 1 — Before any change
```

Verification:

- [ ] A `### What a Pause is (and is not)` subsection exists between the
      `## Pauses` opener and `### Pause 1`
- [ ] The subsection states host tool-permission prompts are not Pauses and do
      not satisfy one
- [ ] The subsection defines the go signal as an explicit chat affirmative,
      distinct from tool approvals
- [ ] The literal marker format
      `=== PAUSE <N> — ... — awaiting explicit go ===` is specified, with
      examples for Pauses 1, 2, and 3
- [ ] The `### Pause 1`, `### Pause 2`, `### Pause 3` subsection bodies are
      byte-identical to before (only the opener sentence changed + the new
      subsection was inserted)
- [ ] No pt-BR in the edited region (R9)

Commit: `docs(agents): add Pause semantics to executor`

Run `pre-commit-self-audit` at Pause 3 with
`SUBJECT="docs(agents): add Pause semantics to executor"` and
`EDIT_SCOPE=".claude/agents/executor.md"`.

---

### Edit 3 — `executor.md`: plan-deviation STOP guard

In `.claude/agents/executor.md`, find:

```markdown
- An undocumented gotcha surfaces.
- Any file outside the brief's declared scope shows up in `git status` or
  `git diff --name-only`.
```

Replace with:

```markdown
- An undocumented gotcha surfaces.
- You are about to deviate structurally from the approved plan or the brief's
  Edit map — merging, splitting, renaming, or relocating planned modules or
  files, or changing agreed file boundaries — even when the deviation looks
  cleaner. A faithful, clean artifact does not excuse a silent structural
  deviation: STOP and confirm before writing.
- Any file outside the brief's declared scope shows up in `git status` or
  `git diff --name-only`.
```

Verification:

- [ ] The `## STOP conditions` list contains a bullet covering structural
      deviation from the approved plan / Edit map
- [ ] The bullet states a clean artifact does not excuse a silent deviation and
      requires STOP-and-confirm before writing
- [ ] The other `## STOP conditions` bullets are byte-identical to before
- [ ] No pt-BR in the edited region (R9)

Commit: `docs(agents): add plan-deviation STOP guard to executor`

Run `pre-commit-self-audit` at Pause 3 with
`SUBJECT="docs(agents): add plan-deviation STOP guard to executor"` and
`EDIT_SCOPE=".claude/agents/executor.md"`.

---

### Structural checks

- [ ] `.claude/agents/executor.md` exists and parses (YAML frontmatter intact)
- [ ] No file outside the in-scope list was modified:
      `git diff --name-only origin/main..HEAD` shows only
      `.claude/agents/executor.md` and
      `docs/tasks/021-executor-pause-calibration/brief.md`

### Git checks

- [ ] Branch used: `docs/executor-pause-calibration`
- [ ] Commits follow Conventional Commits (G-R3); subjects ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed
- [ ] `STATE.md` removed if it was created (G-R10)

### Process checks

- [ ] Pause 2 — first modified file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message +
      `pre-commit-self-audit` output shown before each commit
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

- **Pause 1 (before any change):** **Skipped** — `Plan required: no`.
- **Pause 2 (after the first modified file):** **Required.** Fires after
  Edit 2 writes `executor.md` (between writing the file and staging for
  Pause 3). Show the full edited `## Pauses` region for review.
- **Pause 3 (before each commit):** **Required.** Three commits (Edits 1, 2,
  3). Run `pre-commit-self-audit` against each.

> **Meta-execution note.** This brief edits the Pause doctrine the executor
> itself follows. The executor running this brief loaded the **pre-edit**
> `executor.md`, so it must honor Pauses 2 and 3 by this brief's explicit
> instruction — not by the new marker convention, which only binds future runs.
> Do not skip the Pauses on the grounds that the marker text is "not yet
> committed".

In case of:

- Either find-block does not match byte-for-byte → **STOP and report**. Do not
  regenerate from memory.
- Any file outside the declared scope shows up in `git diff --name-only` →
  **STOP and report**.
- Technical limitation preventing a Done criterion → report.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: no` because:

- Both content edits are specified above with exact find/replace blocks,
  insertion points, and verification checkboxes.
- All architectural decisions are closed (D1–D3) in the Constraints section.
- The judgment calls (find-block mismatch, out-of-scope file) have explicit
  STOP-and-report fallbacks.

**Pause 2 and Pause 3 remain required** — Lesson #6 of
`docs/AGENT_PLAYBOOK.md`, reinforced by the Meta-execution note above.

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — R9, R10, R11, R13, R15, R17
2. `docs/GIT_WORKFLOW.md` — G-R1, G-R3, G-R5, G-R8, G-R10, G-A7
3. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
4. `.claude/agents/executor.md` — the file being modified
5. `.claude/skills/pre-commit-self-audit/SKILL.md` — preloaded; runs at Pause 3
