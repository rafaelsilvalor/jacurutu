# Brief: 027 — Document the mentor gate in the pipeline (AGENT_PLAYBOOK Chapter 6)

> **Category:** M
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/playbook-mentor-gate`
>
> Caminho B: this brief is pre-saved to disk by the user (mentor-authored under
> the M-R15 pipeline-modifying exception). The executor verifies it is present,
> runs the P4 slot check, commits it as commit #1, then applies the edits.
> Pasteable executor prompt:
> `Task: docs/tasks/027-playbook-mentor-gate/brief.md. Read it in full and execute.`

---

## Context

The orchestration pipeline (`docs/AGENT_PLAYBOOK.md` Chapter 6) documents the
flow `planner → brief-validator → executor`, driven by the Claude Code main
session. Today its invocation pattern reads, at step 5: on `Verdict: APPROVED`
the main session **invokes the executor directly**. There is no documented,
mandatory human-review window between the validator's APPROVED and the executor
touching the working tree.

In practice a human review at that seam has been the catch across five sessions
(019, 020, 021, 023, 026): the recaps record it as "the manual mentor-review
gate kept paying off" and note that the orchestrator "can auto-advance past the
human review window". The gate has been operating ad hoc, not as doctrine. This
brief documents it so the behavior is required, not incidental.

This is a **pipeline-modifying** brief: it redesigns the pipeline chapter the
planner would otherwise read to plan. Per Chapter 6's own "When NOT to use the
pipeline" rule, such a brief cannot be planned by the agent reading the old
chapter — so it is authored via caminho B (mentor as writing partner) and run
through the executor directly, skipping planner and validator.

## Goal

Document a mandatory **mentor gate** at the `validator-APPROVED → executor`
seam in `docs/AGENT_PLAYBOOK.md` Chapter 6:

1. Rewrite invocation-pattern step 5 so APPROVED halts at the gate instead of
   auto-invoking the executor.
2. Add a new subsection, "The mentor gate (APPROVED → executor)", after
   "Verdict handling" and before "When NOT to use the pipeline", with a new
   Lesson #14.

The gate is enforced by the main session (orchestrator). The three subagents
(`planner.md`, `brief-validator.md`, `executor.md`) are **not** touched: a
subagent does not see parent-session history and cannot enforce an
orchestrator-level checkpoint, so there is nothing to change in them.

## Out of scope (STOP and surface if any of these is touched)

- Any file other than `docs/tasks/027-playbook-mentor-gate/brief.md` and
  `docs/AGENT_PLAYBOOK.md`.
- `.claude/agents/planner.md`, `.claude/agents/brief-validator.md`,
  `.claude/agents/executor.md` — the gate is orchestrator behavior, not subagent
  behavior. Read for grounding only; never modified.
- `harness/workflows/setup-code.md` and other harness invocation surfaces — the
  playbook is the orchestrator's operating manual (Chapter 6 opening: "This is
  **your** operating manual"); documenting the gate there is sufficient. A
  harness mirror is deliberately deferred (no second-occurrence evidence yet).
- `docs/MENTOR_BRIEF.md` §2 active-focus refresh — tracked separately; not part
  of this pipeline-doc brief.
- The M-R15 wording loosening and the caminho-B verb pre-flight SSOT candidate —
  separate backlog items; not bundled here.

## Constraints

### Non-negotiable constraints

1. Only these paths may be created or modified:
   - `docs/tasks/027-playbook-mentor-gate/brief.md` (this brief; commit #1)
   - `docs/AGENT_PLAYBOOK.md` (commit #2)
   Any write outside these two → **STOP and surface**.
2. Follow `CLAUDE.md` in full and `docs/GIT_WORKFLOW.md` (new branch,
   Conventional Commits, no `Co-authored-by` trailers, no `--no-verify`, no push).
3. All inserted text is English (R9 — `docs/**` is agent-consumed surface).
4. Run `pre-commit-self-audit` at every Pause 3. Commit-subject verbs are
   grepped from the allowlist SSOT in `.claude/skills/pre-commit-self-audit/SKILL.md`.
   The verbs used here are `add` (commit #1) and `document` (commit #2) — both
   verified on the allowlist before authoring; STOP if either is absent at audit.
5. Edits are exact find/replace against the quoted blocks below. If a find-block
   does not match the live file, **STOP and surface** the divergence — do not
   regenerate the replacement from memory or re-locate by approximation.

### Architectural decisions already made (do not revisit)

Closed in chat (2026-06-19 mentor session, ratified). Executor implements;
does not propose alternatives.

- **D1 — Single gate at `APPROVED → executor`.** No second gate at
  `planner → validator`: the validator is already the mechanical audit of the
  planner's output; a human gate there would duplicate it without evidence of
  capture. The evidenced auto-advance is at the post-APPROVED seam.
- **D2 — The gate is a hard semantic STOP.** The orchestrator surfaces the
  artifacts and waits for an explicit human go. It must not treat Claude Code's
  per-command permission prompts as the go, and must not proceed on silence.
- **D3 — Rejection at the gate reuses the existing REJECTED protocol.** The
  three responses already documented under "Verdict handling" (return to chat,
  fix on branch, override) serve both a REJECTED verdict and a gate rejection.
  No new rejection path is invented.
- **D4 — Documentation surface is `AGENT_PLAYBOOK.md` Chapter 6 only,** plus the
  new Lesson #14. Subagent files and harness files are out of scope (see above).
- **D5 — Scope stays tight to the gate.** No bundling of adjacent backlog items.

## Plan required justification

`Plan required: no`: all inserted/replacement text is specified inline; the two
edits are an exact-match step replacement and a section insertion with
STOP-if-mismatch guards; the design was closed in chat and ratified, leaving the
executor no architectural choice. Pause 3 catches commit-level mistakes; the
STOP guards catch any find-block divergence.

**Pause 1 is skipped** (no design left to plan). **Pause 2** is effectively N/A
— there is one content file (`AGENT_PLAYBOOK.md`) beyond the pre-saved brief, so
there is no inter-file boundary to pause at; the two sub-edits to that file ship
in one commit. **Pause 3 before every commit remains mandatory.**

---

## Edit 1 — Verify this brief on disk; P4 slot check; commit as commit #1

This brief is already saved at `docs/tasks/027-playbook-mentor-gate/brief.md`
(caminho B). Do **not** regenerate it from chat. Verify it is present and that
its first line matches the title above.

**P4 slot verification (three sources). STOP if `027` is already taken:**

- `ls docs/tasks/` — highest existing slot should be `026`
  (`026-cli-argv-dispatch`); no `027-*` directory other than this one.
- `git log --oneline main` — most recent merged task work should be brief 026
  (PR #65, `3004e69`); recap PRs do not consume task slots.
- `CLAUDE.md` `E*` block — exceptions stop at `E5`; no nominal `027` reservation.

- [ ] Directory `docs/tasks/027-playbook-mentor-gate/` exists
- [ ] `docs/tasks/027-playbook-mentor-gate/brief.md` exists; first line matches
      the title above
- [ ] If `ls docs/tasks/` or `git log` shows `027` already taken → **STOP**

Commit the brief as commit #1: `docs(tasks): add brief 027 playbook mentor gate`.

---

## Edit 2 — `docs/AGENT_PLAYBOOK.md` Chapter 6: rewrite step 5 and add the mentor-gate subsection

One commit, two sub-edits to the same file.

### 2a — Rewrite invocation-pattern step 5 (and confirm step 6 unchanged)

Locate the numbered list under "**Pipeline invocation (in the Claude Code main
session):**" → "The main session then:". STOP if it differs materially from:

```markdown
The main session then:
1. Invokes planner with the description.
2. Receives planner's final message (brief authored, branch, commit SHA).
3. Invokes `@brief-validator` with the brief path and branch.
4. Receives the validator's verdict report.
5. If `Verdict: APPROVED` — invokes `@executor` with the same brief path and branch.
6. If `Verdict: REJECTED` — surfaces the report to you. See "Verdict handling" below.
```

Replace the **entire** numbered list with:

```markdown
The main session then:
1. Invokes planner with the description.
2. Receives planner's final message (brief authored, branch, commit SHA).
3. Invokes `@brief-validator` with the brief path and branch.
4. Receives the validator's verdict report.
5. If `Verdict: APPROVED` — surfaces the brief, the validator's verdict report, and the brief commit's diff, then halts at the mentor gate (see "The mentor gate" below). The executor is invoked only after you give an explicit go.
6. If `Verdict: REJECTED` — surfaces the report to you. See "Verdict handling" below.
```

### 2b — Insert the "The mentor gate" subsection after Lesson #12

Locate the end of the "Verdict handling" subsection. It ends with the Lesson #12
blockquote, immediately followed by the "### When NOT to use the pipeline"
heading. STOP if that boundary does not match:

```markdown
> **Lesson #12 — REJECTED is a decision point, not a failure state.** The validator's job is to flag mechanical drift; your job is to decide whether the drift is the bug or the convention is the bug. Three responses, one chosen per case, none default. Auto-loop back to planner was rejected at cluster design (D4) precisely because the user-judgment step protects against silent validator errors.

### When NOT to use the pipeline
```

Replace that exact boundary with (Lesson #12 unchanged; new subsection inserted
between it and the "When NOT to use the pipeline" heading):

```markdown
> **Lesson #12 — REJECTED is a decision point, not a failure state.** The validator's job is to flag mechanical drift; your job is to decide whether the drift is the bug or the convention is the bug. Three responses, one chosen per case, none default. Auto-loop back to planner was rejected at cluster design (D4) precisely because the user-judgment step protects against silent validator errors.

### The mentor gate (APPROVED → executor)

A `Verdict: APPROVED` does not auto-advance to the executor. The orchestrator halts and surfaces three things to you: the brief, the validator's verdict report, and the brief commit's diff. You review and give an explicit go before the executor is invoked.

This is a semantic checkpoint, not a tool prompt. The orchestrator must not treat Claude Code's per-command permission prompts as the go, and must not proceed on silence — the same Pause semantics the executor obeys during a run apply here at the orchestration layer.

The gate is yours, not the validator's. The validator audits the brief mechanically against the brief-template conventions; the gate is where you judge whether the brief is the right thing to build — scope, grounding, and whether a closed decision drifted in translation between the delegation and the brief. A brief can be mechanically clean and still wrong; the gate is the catch the validator structurally cannot be.

If you reject at the gate, route through the same three responses as a `REJECTED` verdict (return to chat, fix on branch, or override). The gate and the verdict share one rejection protocol.

> **Lesson #14 — The gate is the human's, not the validator's.** APPROVED is the validator clearing mechanical drift; it is not a green light to the executor. Evidenced across sessions 019, 020, 021, 023, and 026: a human review window between validator and executor caught scope and translation slips that a mechanically-clean brief still carried. Auto-advancing past that window is the failure mode this gate closes — the cost of the gate is one review per task; the cost of skipping it is an executor run against the wrong brief.

### When NOT to use the pipeline
```

### Verification

- [ ] Step 5 of the invocation pattern no longer reads "invokes `@executor`
      ... directly"; it now halts at the mentor gate
- [ ] Step 6 (REJECTED) is byte-identical to before
- [ ] New subsection "### The mentor gate (APPROVED → executor)" sits between the
      Lesson #12 blockquote and "### When NOT to use the pipeline"
- [ ] Lesson #14 is present, inside the new subsection; no other lesson is
      renumbered or modified
- [ ] No content of Chapters 1–5, "When to use the pipeline vs. caminho B",
      "Verdict handling" (beyond Lesson #12 position), "When NOT to use the
      pipeline", "Troubleshooting", or "Related documents" is modified
- [ ] `grep -n "mentor gate" docs/AGENT_PLAYBOOK.md` returns the new heading and
      the step-5 reference
- [ ] All inserted text is English (R9)

Commit: `docs(playbook): document the mentor gate at the APPROVED seam`.

Run `pre-commit-self-audit` at Pause 3 with
`SUBJECT="docs(playbook): document the mentor gate at the APPROVED seam"` and
`EDIT_SCOPE="docs/AGENT_PLAYBOOK.md"`.

---

## Git workflow

### Branch

```
git checkout main
git pull --ff-only origin main
git checkout -b docs/playbook-mentor-gate
```

### Commit sequence

```
1. docs(tasks): add brief 027 playbook mentor gate
   — touches only docs/tasks/027-playbook-mentor-gate/brief.md
2. docs(playbook): document the mentor gate at the APPROVED seam
   — touches only docs/AGENT_PLAYBOOK.md
```

Both subjects verified ≤ 72 chars and lead with an allowlisted verb (`add`,
`document`).

### Push

**Do not push.** Push and PR creation are the user's call
(`CLAUDE.md` R17 / `GIT_WORKFLOW.md` G-R5). Stop after the final commit and report.

---

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat main..HEAD` (line counts per file)
3. Any verification checkbox that could not be met, with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step (open PR for mentor review)
