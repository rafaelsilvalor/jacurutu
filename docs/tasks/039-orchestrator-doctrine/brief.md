# Brief: 039 — Orchestrator doctrine (fused model)

> **Category:** L
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `docs/orchestrator-doctrine`

---

## Context

The 2026-07-24/25 design window fused the mentor's operational duties with
the orchestrator inside Claude Code — a role now named the **Orchestrator**
— keeping chat as the purely conceptual surface (**Mentor**). The model was
mechanically tested at the permission layer and piloted end to end on task
038 with no design reservations. The ratified D-set, role taxonomy, recap
policy, and four structural findings currently live only in two session
recaps (`docs/sessions/2026-07-24-mentor-038-payload-gitignore.md` and
`docs/sessions/2026-07-25-mentor-fused-model-design.md`, merged as PRs #94
and #95). This brief encodes them into the canonical doctrine surface.

## Goal

Make the canonical docs describe the fused model: `docs/AGENT_PLAYBOOK.md`
defines the Orchestrator and a role-based pipeline chapter,
`docs/MENTOR_BRIEF.md` shrinks to the conceptual chat surface,
`docs/GIT_WORKFLOW.md` documents scaffolding branches and the fused-model
push policy, the executor agent gains the green-boundary rule, `CLAUDE.md`'s
index reflects the new roles, and a `setup-orchestrator` harness prompt
exists for opening future sessions.

Out of scope:

- `.claude/agents/planner.md` and `.claude/agents/brief-validator.md` — no
  changes.
- `.claude/skills/pre-commit-self-audit/` and `.claude/skills/brief-template/`
  — no changes.
- `docs/ROADMAP.md`, `docs/GOTCHAS.md`, `README.md`, and all source packages.
- Rule-of-three observations stay unpromoted (all 1st occurrences per the 038
  ledger): brief-internal decision renumbering; formal codification of the
  subagent Pause transport as a numbered subagent rule (chapter 6 *describes*
  the transport as operating knowledge — that description is in scope; a
  numbered rule is not); app-level subagent visibility tooling.
- Product queue items (open-in-software, missing-env DX, template naming,
  `ship` command, `@breu` rename).
- No behavior or code change anywhere — this task touches the docs/doctrine
  surface only.

Parked — owner-ratified scope delta (recorded in-flight, before the
orchestrator gate). **Multi-contributor naming package** — trigger: a second
regular contributor joins the repo; no interim mixed scheme. Parked, not
implemented by this brief:

1. Task naming migrates from `NNN-slug` to `YYYY-MM-DD-slug` (matching the
   session-recap convention). Burns then move from sequence gaps to
   preserved task folders carrying an `ABORTED` marker with the rationale.
   Until the trigger: `NNN` + P4 stay canonical.
2. Recap naming gains a dev token: `<date>-<dev>-<role>-<topic>`.
   `docs/sessions/` stays flat — no per-dev folders. Authorship ground
   truth remains the git author field.
3. Same-day collisions in date-based names resolve with a short ordinal
   suffix (`-2`, `-3`), applied only on collision; intra-day ordering is
   carried by the Consumes chain and git timestamps, not filenames.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/039-orchestrator-doctrine/brief.md` (this file)
   - `docs/AGENT_PLAYBOOK.md`
   - `docs/MENTOR_BRIEF.md`
   - `docs/GIT_WORKFLOW.md`
   - `.claude/agents/executor.md`
   - `CLAUDE.md`
   - `harness/workflows/setup-orchestrator.md` (new file)
   - `harness/workflows/README.md` (index entry for the new file only)
   If anything else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md` (especially R8, R9, R10).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - Branch: `docs/orchestrator-doctrine` (created from `main@bf45e72`)
   - Conventional Commits (G-R3); no `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5) — push/PR only on explicit owner
     instruction after the run
   - `STATE.md`: **opted out** by the owner at modeling time — single-session
     docs-only task (executor.md "When you do NOT touch STATE.md" applies)
4. Green-boundary invariant applies to THIS run: before every Pause 3, run
   the monorepo build and the full test suite (`npx tsc -b`; `npm test`) and
   include the results in the Pause 3 block; commit only on green. This
   preserves the 036–038 boundary invariant and exercises D8 while encoding
   it.
5. Preserve document structure everywhere: Lesson numbering in
   `docs/AGENT_PLAYBOOK.md`, M-R numbering in `docs/MENTOR_BRIEF.md`, rule
   IDs in `docs/GIT_WORKFLOW.md`. Renames are textual, not structural.

### Conventions

- Agent-consumed surface is English-only (R9). Exception per R9:
  `harness/workflows/setup-orchestrator.md` is human-edited interface —
  pt-BR prose and a pt-BR paste block are correct there; follow the
  `harness/workflows/setup-chat.md` precedent.
- Commit type: all `docs` (documentation-only task; precedent: brief 037
  used `docs:` for `.claude/agents/executor.md`).
- Session recaps for this run follow D6/D7: Orchestrator + executor recaps
  commit on this branch after the run and ride this PR.

### Architectural decisions already made (do not revisit)

Closed in the fused-model design session (recap 2026-07-25) and in the 039
modeling session. Executor implements; does not propose alternatives.

#### D1 — Role taxonomy (five roles)

**Mentor** = chat, conceptual only: learning, pre-task exploration,
meta-discussions. No gate, no task modeling, no operational rulings.
In Claude Code: **Orchestrator** (fused main session), **planner**,
**brief-validator**, **executor**.

#### D2 — The Orchestrator is the main session, not a subagent

Long-form dialogic session opened in Plan mode via a harness init prompt.
Opens with M-R13 identity + mode declaration; one task per session; closes
with a recap; never performs a subagent's work inline (fail-loud on
invocation failure).

#### D3 — Write policy

Plan mode is the session default. The Orchestrator writes ONLY under
`docs/`, per artifact, via the write gate: show full content → owner
approves → write → read back from disk → confirm byte-match. Source code
exists only behind `@executor`.

#### D4 — Git operations under the fused model

Writing a file ≠ committing it. Branch creation requires explicit owner
approval from a verified base SHA. Push and PR opening are allowed under
R17's letter: explicit per-branch owner instruction; never `main`, never
`--force`. Permission prompts are a second layer: plain "Accept"/"Allow
once" only; "Accept and auto mode" and "Always allow" are forbidden in
Orchestrator sessions.

#### D5 — Mid-run rulings become files

Owner rulings issued mid-run are written to
`docs/tasks/<NNN>-<slug>/notes.md` instead of being relayed as chat pastes
— byte-exact by construction, durable record for free.

#### D6 — Recap set (three) with narrowed scopes

Mentor (chat sessions; transport unchanged: own `docs/` branch + PR),
Orchestrator, executor. Planner and validator produce no recaps — the
committed brief and the recorded verdict are their record. Orchestrator
recap = decisions, gate, deviations, queue, next-session snippet. Executor
recap = pure execution log (Edits, Pauses, evidence, commits), no context
re-narration.

#### D7 — Recap transport rides the session PR

Standard sequence: brief → code (Pauses) → recaps (`docs(sessions):` commit
on the same branch) → push + PR on owner instruction → owner squash-merge.
A recap cannot cite its own PR's merge SHA; the NEXT session confirms the
merge via P4 / `git log` in its "Consumes" line. The separate docs PR for
task sessions is retired; the `[CONFIRMAR: docs PR]` pendency class dies.

#### D8 — Green boundary replaces the unwired hook

Worktree sessions do not wire `core.hooksPath`, so the G-R8 pre-commit hook
may never fire. Resolution: an executor rule — before every Pause 3, run
the monorepo build and the full test suite and include their results in the
Pause 3 block; commit only on green. Unconditional: no docs-only exemption
(the 038 Pause 3 ruling is the precedent). Complementary to G-R8, not a
substitute. Chosen over worktree hook wiring: protocol travels better than
per-clone config, and the pilot proved it works by ruling.

#### D9 — Bidirectional blindness rules

(a) Post-write read-back is mandatory — the agent cannot see the permission
layer, so a successful write is verified only by reading it back. (b) Every
subagent invocation is announced in one line before and summarized in one
line after. (c) Authority over gating claims is owner-only: the agent never
asserts that a permission prompt did or did not appear.

#### D10 — `claude/*` scaffolding branches

The desktop harness creates per-worktree branches prefixed `claude/`. They
are session scaffolding: outside R11/G-R2, carry zero commits, are never PR
targets, and are cleaned up post-session. The real work branch is
R11-conformant and created inside the session from a verified base SHA.

#### D11 — Gate rename

"Mentor gate" → **"orchestrator gate"** everywhere in
`docs/AGENT_PLAYBOOK.md`. Semantics unchanged: Lesson #14 stands; only the
owner's explicit go crosses the gate.

#### D12 — Cache-swap ritual is chat-only

The cache-swap ritual (swapping session recaps into the chat project
knowledge) serves only the chat (Mentor) surface. Orchestrator sessions
read recaps from disk. Noted in `docs/MENTOR_BRIEF.md` (M-R14 area).

#### D13 — Harness prompt for Orchestrator sessions

New `harness/workflows/setup-orchestrator.md` following the
`setup-chat.md` precedent, generalizing the paste-ready snippet from the
2026-07-25 recap: session mode selection, files to read from disk, rules in
force (Plan mode, write gate, announcement protocol, Allow once, code only
via `@executor`, push/PR per explicit instruction, recaps ride the session
PR), and the M-R13 + P4 opening sequence.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The Orchestrator pre-saved this brief to
`docs/tasks/039-orchestrator-doctrine/brief.md` before invoking the
executor (caminho B). The executor verifies presence and commits.

- [ ] Directory `docs/tasks/039-orchestrator-doctrine/` exists
- [ ] File `brief.md` exists; first line matches the title above
- [ ] `git add docs/tasks/039-orchestrator-doctrine/brief.md` is staged
- [ ] Commit #1 created with subject
      `docs(tasks): add brief for 039-orchestrator-doctrine`

If the file is missing or the first line does not match, **STOP and
report**. Do not regenerate the brief from memory.

### Edit 2 — Rewrite `docs/AGENT_PLAYBOOK.md` chapter 6 as role-based

Rewrite chapter 6 from surface-based (Chat vs Code) to role-based
separation, encoding D1, D2, D3, D4, D5, D7, D9, D11:

- Chapter 6 opens by naming the five roles (D1) and defining the
  Orchestrator (D2, D3): main session, not a subagent; Plan mode default;
  write gate for `docs/` artifacts; one task per session; M-R13 opening;
  recap close.
- Rename "mentor gate" → "orchestrator gate" everywhere, including the
  section heading "The mentor gate (APPROVED → executor)" (D11). Lesson #14
  text keeps its number and meaning.
- Describe the subagent Pause transport as operating knowledge (not a
  numbered rule): the executor cannot wait interactively; each Pause is a
  STOP-and-return with a single-block presentation; owner approvals are
  relayed as continuation messages; mid-run rulings become files (D5).
- Encode the recap policy (D6, D7): which roles produce recaps, the
  narrowed scopes, same-PR transport, next-session merge confirmation.
- Encode the blindness rules (D9) and the R17 restatement for the fused
  model (D4), including the "Allow once" discipline and the forbidden auto
  modes.
- Chat/Mentor references in chapter 6 shift to "conceptual surface"
  language consistent with D1.

Verification:

- [ ] `grep -ci "mentor gate" docs/AGENT_PLAYBOOK.md` returns 0
- [ ] `grep -ci "orchestrator gate" docs/AGENT_PLAYBOOK.md` returns ≥ 3
- [ ] Chapter 6 names all five roles from D1
- [ ] All Lessons #1–#15 still present, numbering unchanged
- [ ] Pause transport description present (STOP-and-return, single block,
      relayed go, rulings as files)
- [ ] Recap policy present (three recaps, scopes, same-PR transport)
- [ ] Blindness rules present (read-back, announcement, owner-only gating
      claims)
- [ ] R17 fused restatement present (per-branch instruction, Allow once,
      auto modes forbidden, never `main`, never `--force`)

Commit: `docs(playbook): document orchestrator role and role-based pipeline`

### Edit 3 — Slim `docs/MENTOR_BRIEF.md` to the conceptual Mentor

Encoding D1, D12:

- §4 M-R12 rewritten: the Mentor lane is conceptual only (learning,
  pre-task exploration, meta-discussions); task modeling, the gate, and
  operational rulings belong to the Orchestrator — pointer to
  `docs/AGENT_PLAYBOOK.md` chapter 6.
- §8 session-type table and M-R13's mode list updated to the conceptual
  modes; operational session types point to the Orchestrator. M-R13 itself
  stays (the Orchestrator opening reuses it, per the playbook).
- M-R15's caminho B note updated: doctrinal/pipeline-modifying briefs are
  authored by the Orchestrator under the write gate, not by chat.
- M-R14 gains the cache-swap note (D12).
- M-R numbering preserved; no rule is renumbered or deleted — rewritten in
  place with pointers.

Verification:

- [ ] M-R12 names the Orchestrator and points to the playbook
- [ ] M-R14 contains the cache-swap chat-only note
- [ ] M-R15 reflects Orchestrator authorship for caminho B
- [ ] All M-R1–M-R15 IDs still present
- [ ] No occurrence of "modeling a new task" as a chat mode remains

Commit: `docs(mentor): remove operational duties from mentor brief`

### Edit 4 — Document scaffolding branches and push policy in `docs/GIT_WORKFLOW.md`

Encoding D4, D10:

- New subsection under "Branch Naming": `claude/*` scaffolding branches —
  harness-created, outside R11/G-R2, zero commits, never PR targets,
  post-session cleanup; the real work branch is created inside the session
  from a verified base SHA.
- Note under G-R5 (or adjacent): the fused-model push policy (D4) — push
  and PR opening on explicit per-branch owner instruction; permission
  prompt is a second layer, "Allow once" only; never `main`, never
  `--force`.

Verification:

- [ ] `grep -c "claude/" docs/GIT_WORKFLOW.md` returns ≥ 2
- [ ] Scaffolding subsection states: outside R11, zero commits, never PR
      target, cleanup
- [ ] G-R5 area mentions per-branch instruction and "Allow once"
- [ ] G-R* rule IDs unchanged

Commit: `docs(git): document claude scaffolding branches and push policy`

### Edit 5 — Add the green-boundary rule to `.claude/agents/executor.md`

Encoding D8. New subsection inside "### Pause 3 — Before every commit"
(placed before the numbered steps or as a titled precondition block):

- Before presenting every Pause 3, run the monorepo build (`npx tsc -b`)
  and the full test suite (`npm test`); include both results in the Pause 3
  single-block presentation; commit only on green.
- Unconditional — no docs-only exemption (precedent: the 038 Pause 3
  ruling).
- Rationale line: worktree sessions may not wire `core.hooksPath`, so the
  G-R8 hook may never fire; this rule is the protocol-level guarantee,
  complementary to G-R8, not a substitute.

Verification:

- [ ] Pause 3 section contains the green-boundary precondition
- [ ] The rule states build + full suite + green-only commit
- [ ] The no-exemption clause is present
- [ ] The G-R8 complementarity note is present

Commit: `docs(executor): add green-boundary rule before every Pause 3`

### Edit 6 — Update `CLAUDE.md` Related Documents for the new roles

- Row `docs/MENTOR_BRIEF.md`: description becomes the conceptual Mentor
  surface (chat) — learning, exploration, meta-discussion.
- Row `docs/AGENT_PLAYBOOK.md`: description names the Orchestrator and the
  role-based pipeline (drop "Claude Chat / Code / Cowork" phrasing).
- Row `.claude/agents/`: mention that the main session acting as
  Orchestrator invokes them.
- No other CLAUDE.md content changes (rules R1–R25, A*, E* untouched).

Verification:

- [ ] Related Documents table mentions "Mentor" as conceptual/chat and
      "Orchestrator"
- [ ] `git diff` for `CLAUDE.md` touches only the Related Documents section

Commit: `docs: update related documents table for orchestrator model`

### Edit 7 — Add `harness/workflows/setup-orchestrator.md`

Encoding D13:

- New file following the `setup-chat.md` precedent: pt-BR usage prose and a
  pt-BR paste-ready block (R9 human-edited interface allowance),
  generalized from the 2026-07-25 recap snippet — session mode placeholder,
  files to read from disk, rules in force (Plan mode default, write gate
  show→approve→write→read-back, subagent announcement, Allow once, code
  only via `@executor`, push/PR per explicit per-branch instruction, recaps
  ride the session PR), and the M-R13 + P4 opening sequence.
- Add one index entry for the new file in `harness/workflows/README.md`,
  matching that file's existing list format.

Verification:

- [ ] `harness/workflows/setup-orchestrator.md` exists with a paste-ready
      block
- [ ] The block covers: Plan mode, write gate, announcement, Allow once,
      `@executor`-only code, push/PR per instruction, recap transport,
      M-R13 + P4 opening
- [ ] `harness/workflows/README.md` lists the new file
- [ ] No other README.md lines changed

Commit: `docs(harness): add setup-orchestrator session prompt`

### Commit sequence

1. `docs(tasks): add brief for 039-orchestrator-doctrine`
2. `docs(playbook): document orchestrator role and role-based pipeline`
3. `docs(mentor): remove operational duties from mentor brief`
4. `docs(git): document claude scaffolding branches and push policy`
5. `docs(executor): add green-boundary rule before every Pause 3`
6. `docs: update related documents table for orchestrator model`
7. `docs(harness): add setup-orchestrator session prompt`

All subjects ≤ 72 chars; verbs from the pre-commit-self-audit allowlist
(`add`, `document`, `remove`, `update`).

### Automated checks (run before each commit)

- [ ] `npx tsc -b` exits 0 (docs-only task, but the green boundary is
      unconditional per D8)
- [ ] `npm test` passes with 0 failures

### Structural checks

- [ ] All in-scope files exist at expected paths;
      `harness/workflows/setup-orchestrator.md` is new
- [ ] No file outside the in-scope list was modified
      (verify via `git diff --name-only main..HEAD`)

### Git checks

- [ ] Branch used: `docs/orchestrator-doctrine`
- [ ] Commits follow Conventional Commits (G-R3); subjects ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 1 — numbered plan presented and approved before any change
      (`Plan required: yes`)
- [ ] Pause 2 — first modified file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message +
      `pre-commit-self-audit` output shown before each commit
- [ ] Evidence-close (`git log --format=%B -1`) pasted verbatim after each
      commit, per the executor protocol
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any change):** present a numbered plan covering the
  attack order of Edits 2–7 and wait for approval. **Required.**
- **Pause 2 (after the first modified file):** show the result and wait for
  review. **Always required.**
- **Pause 3 (before each commit):** show `git status` + `git diff --stat` +
  proposed message + `pre-commit-self-audit` output + build/suite results
  (constraint 4). **Always required.**

In case of:

- Unrelated doc inconsistency found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md` as
  a follow-up brief.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: yes`. Six interdependent doc edits: the gate rename (Edit 2)
must precede the index refresh (Edit 6); the Mentor slim-down (Edit 3)
points at chapter 6 content created in Edit 2; the harness prompt (Edit 7)
summarizes rules encoded in Edits 2–5. The executor's numbered plan at
Pause 1 confirms the attack order and the placement choices left open by
the directive-level Edit specs (exact insertion points, subsection titles).

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — known traps
4. `docs/AGENT_PLAYBOOK.md` — chapters 2 and 6 (current state to be rewritten)
5. `docs/sessions/2026-07-25-mentor-fused-model-design.md` — **primary
   source**: ratified D-set, taxonomy, findings
6. `docs/sessions/2026-07-24-mentor-038-payload-gitignore.md` — pilot
   evidence and deviations ledger
7. `harness/workflows/setup-chat.md` — precedent for Edit 7
8. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit (Pause 3)

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat main...HEAD` (line counts per file)
3. Any verification checkbox from this brief that could not be met, with
   explanation
4. Confirmation that no `git push` was executed
5. Suggested next step: Orchestrator + executor recaps committed on this
   branch (`docs(sessions):`), then push + PR on explicit owner instruction
   (D7)
