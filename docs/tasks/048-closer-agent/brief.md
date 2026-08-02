# Brief: 048 — Add the `closer` pre-push diff-review agent

> **Category:** L
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `feat/closer-agent`

---

## Context

The orchestration cluster has five roles: Mentor, Orchestrator, planner,
brief-validator, executor. All five act *before* the merge. Nothing reviews the
assembled diff between the executor's last commit and the owner's push, and
nothing exists after the squash-merge to confirm it landed.

This brief adds the sixth role: `closer`. It reads `git diff main...HEAD`, runs
three narrow checks, and hands the owner a report. It never decides — the
verdict is input to the owner's judgment, never a gate that opens itself
(Lesson #14).

This task **modifies the pipeline itself**, so it takes caminho B per
`docs/AGENT_PLAYBOOK.md` "When NOT to use the pipeline": the Orchestrator
authored this brief directly, with the owner closing D1–D8 one at a time. The
planner was not invoked. The brief-validator **is** still invoked — its eleven
checks are mechanical (header, category, sections, commit subjects, language)
and apply unchanged to a brief that creates an agent.

**Size note.** Substance sits at roughly 430 lines against the Category-L
guide of 200-400 in `.claude/skills/brief-template/SKILL.md`. Three things
carry the excess and none can be thinned without losing the specification:
eight owner-closed decisions (D1–D8), the report template embedded verbatim
because its wording *is* the deliverable, and a P4 section that must argue an
unusual slot resolution rather than assert it. A split was considered and
rejected — the agent file, its playbook registration and the `CLAUDE.md` line
are one another's verification, and a sub-brief delivering the agent without
its registration would close on incomplete evidence. L is the honest header;
the deviation is declared here rather than hidden by thinning.

P4 slot evidence (three sources, checked 2026-08-02):

- `ls docs/tasks/` — highest existing slot `046-spike-adapter-drive`. Gaps
  004-006 (burned, `CLAUDE.md` E5) and 034 are preserved, not free.
- `git log --oneline origin/main` — HEAD is `d8426ce docs: add drive spike 046
  decision note and resolve ROADMAP #11 (#107)`. No merged PR references a slot
  above 046; `gh pr list` stops at #107.
- `grep -nE '^\*\*E[0-9]+' CLAUDE.md` — E1, E2, E3, E5 are v1-freeze
  exceptions; none reserves a forward slot.

**The three sources agree with each other and would yield 047.** Slot 047 is
nevertheless taken, by evidence outside the three sources: branch
`feat/adapter-drive` carries `e9aec85 docs(tasks): add brief for
047-adapter-drive` and three implementation commits, unmerged, checked out in a
sibling worktree at `e3a4dbd`. The owner ruled on 2026-08-02 that 048 is
correct and that this brief must record the branch evidence explicitly rather
than let the P4 section imply the three sources alone produced it. Task 047 is
**mid-execution, not consumed** — there is no merge SHA and no 047 recap.

## Goal

Create `.claude/agents/closer.md` implementing the two-phase pre-push diff
reviewer specified in D1–D8, and register the role in `docs/AGENT_PLAYBOOK.md`
and `CLAUDE.md`.

Out of scope:

- **Any change to the other five roles.** `planner.md`, `brief-validator.md`,
  `executor.md` are not edited. The Mentor and Orchestrator doctrine chapters
  are not rewritten.
- **Rewriting the recap policy.** `docs/AGENT_PLAYBOOK.md` "Recap policy
  (three recaps)" keeps its three recap roles, its per-role contents lists,
  and its existing transport sentence. Edit 3b appends **exactly one
  sentence** to that paragraph, recording the D5 division; that append is the
  only permitted change to the section. The Orchestrator's next-session
  snippet duty stays where it is — D5 divides the work without moving it.
- **Broadening the checks.** No OWASP sweep, no generic clone detection, no
  test-coverage or performance review. D1 is the whole surface.
- **Automating the merge.** The squash-merge on `main` stays the owner's, via
  the GitHub UI. The closer never merges.
- **Running the closer on this branch.** Creating the agent and exercising it
  are separate concerns; the calibration in D8 already stands in for a first
  run.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   `docs/tasks/048-closer-agent/**`, `.claude/agents/closer.md`,
   `docs/AGENT_PLAYBOOK.md`, `CLAUDE.md`. If anything else needs changing,
   **STOP and ask**.
2. Follow all rules in `CLAUDE.md`, especially R9 (language surfaces — see D4,
   which resolves a genuine edge case and must not be improvised on), R10
   (Conventional Commits, no trailers), R13 (no `--no-verify`), R17 (no
   proactive push).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `feat/closer-agent`, created from the verified base
     `d8426ce` **before Edit 1**. The session branch
     `claude/closer-subagent-diff-review-c483dd` violates `CLAUDE.md` R11 /
     G-R2 and fails validator C4; do not commit on it.
   - Conventional Commits (G-R3), subject ≤ 72 chars
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
4. The pre-commit hook is not wired in this clone (`core.hooksPath` unset), so
   run `npm test` by hand before every Pause 3 and report the result. This is
   not a G-R8 bypass — the hook is absent, not skipped.
5. `.claude/agents/closer.md` must not, in its own instructions, direct any
   agent to push, merge, or force-push. Phase B exists in the file as a
   procedure the owner triggers, never as an autonomous step.

### Conventions

- Commit type/scope: `docs(agents)` for `.claude/agents/closer.md`, matching
  the merged precedent `c9a4c4e docs(agents): add orchestration agents layer
  (014)`; `docs(playbook)` for `docs/AGENT_PLAYBOOK.md`; `docs` for
  `CLAUDE.md`; `docs(tasks)` for this brief.
- The agent file's own prose is English (R9, agent-consumed). The report
  template embedded inside it is pt-BR (D4).

### Architectural decisions already made (do not revisit)

#### D1 — Three check targets, deliberately narrow

The closer checks exactly three things. Breadth was rejected: a reviewer that
reports everything trains the owner to skim.

**(a) Architecture — conformance with `CLAUDE.md` R18–R25**, plus the
general-hygiene rules that carry into any diff: hexagonal dependency direction
(R25), persistence through `storage/` (R18), registry dispatch (R19), no `any`
(R24), ESM with `.js` import extensions (R21), file and function size budgets
(R5/R6), and silent `catch` (R4).

**(b) Duplication — one question only:** *does this reimplement something that
already exists in `core`?* Generic block-similarity is explicitly **not** in
scope; the project's rule-of-three (A3) makes near-duplicate blocks a
deliberate choice, so reporting them is noise.

**(c) Secret hygiene and path safety** — credentials committed, logged, or
embedded in an error message; path traversal in paths derived from Drive or the
filesystem. Broad OWASP-style security review is **not** in scope.

Three negative rules, each earned against the 047 diff (see D8). They are as
binding as the positive checks:

- **N1 — Read the docstring before flagging R4.** A function returning `null`
  on absence with the contract documented at its definition is R4-*compliant*;
  R4 permits exactly that. Flagging it is a false positive.
- **N2 — Match exported symbols, not themes.** Check (b) fires only when the
  diff reimplements something actually exported from
  `packages/core/src/index.ts`. Verify with `grep` before reporting. Thematic
  proximity ("core has a `file-name.ts` and this touches file names") is not
  evidence.
- **N3 — Incompleteness on a mid-execution branch is not a finding.** A
  declared-but-unimported dependency, a placeholder module, a stub export:
  *observação* at most, never higher. The closer reviews what the diff does,
  not what it has yet to do.

#### D2 — Two phases with an owner gate between them

**Phase A — read-only.** Read `git diff main...HEAD`, run the D1 checks, emit
the D3 report, **STOP**. Tooling mirrors `brief-validator`:
`tools: [Read, Bash, Grep, Glob]` with `disallowedTools: [Write, Edit]`.

**Owner gate.** The owner reads the report and decides. The verdict never
auto-advances (Lesson #14). Symmetrically, the closer never blocks on its own
authority: a `trava` finding is a recommendation to the owner, not a veto.

**Phase B — mechanical, only after an explicit per-branch "vai".** Push the
branch, open the PR. The squash-merge on `main` remains the owner's, in the
GitHub UI. After the merge: local branch cleanup (`git branch -D`, note the
orphaned SHA), the three-source P4, and the merge-SHA confirmation of D5.

R17 / G-R5 / G-R7 stay intact: push only on explicit per-branch instruction,
never to `main`, never `--force`.

#### D3 — Report format

- **Term definitions inline**, on the line where the term first appears. No
  appendix glossary — a glossary at the bottom is read after the decision is
  already made.
- A **"termos novos nesta sessão"** section carrying only what earlier sessions
  have not already defined. It shrinks over time; that is the intent.
- **Three severities, in plain Portuguese** — `trava`, `precisa da sua
  decisão`, `observação`. Not P0/P1/P2: severity codes need their own glossary.
- **Ceiling of five findings in the body**; the remainder goes in a collapsed
  `<details>` block.
- Every finding carries a **"Por que isso importa"** line.
- Checks that produced nothing are **listed as such**, not omitted. A silent
  check is indistinguishable from a check that did not run.
- **Stated design intent:** the report exists to raise the owner's ceiling of
  understanding, not to enable approval on autopilot.

#### D4 — Language: English instructions, pt-BR report

A genuine R9 edge case. `.claude/agents/closer.md` is agent-consumed surface
(English), but the report template inside it produces chat output read by a
human (pt-BR under M-R10).

Resolution: the file's frontmatter, section headers, rules and logic are
**English**. The emitted report template — its headers, labels, severity names
and the "Por que isso importa" line — is **pt-BR**. This inverts the harness
pattern (pt-BR prose wrapping English `--- COPIAR ---` payload): here an
English wrapper carries a pt-BR payload, for the same reason in both cases —
the payload is written in the language of its consumer.

This diverges from `brief-validator`, whose report is fully English. The
divergence is correct: that report's consumer is the main session
("The verdict report is your only output to the main session"), while the
closer's consumer is the owner.

#### D5 — P4 duty: divided, not migrated or duplicated

`docs/AGENT_PLAYBOOK.md` records the pendency: *"a recap cannot cite its own
PR's merge SHA; the NEXT session confirms the merge via P4 / `git log` in its
'Consumes' line."*

The closer is the only role that runs **after** the merge, so it can cite the
SHA the recap structurally cannot. Division:

- **The closer confirms.** Post-merge it runs the three-source P4 and records
  the merge SHA — closing the pendency in the same session that created it.
- **The recap projects.** Authoring the next-session snippet stays the
  Orchestrator recap's duty, unchanged.

Migration was rejected (it would require rewriting the recap policy, growing
this task from "new agent" into "doctrine revision"); duplication was rejected
(two sources for one fact diverge the day one goes stale).

#### D6 — Trigger: always, with checks scaled to the diff

The closer runs on every branch. Check (c) always runs — a brief or a notes
file can leak a token, which is why brief 046 grepped `GOCSPX|ya29\.` across
`docs/`. Checks (a) and (b) run only when the diff touches `packages/**`;
otherwise the report prints, verbatim and visibly,
`não aplicável — diff não toca packages/`.

Gating the whole agent on `packages/**` was rejected: it would exempt
docs-only briefs (043, 046) from secret triage, and would leave this very
brief's diff unreviewable.

#### D7 — Invocation contract

The main session delegates with a single prompt string:

```
Review the diff on branch <branch> against main. Phase A only.
```

Phase B is a separate, later invocation carrying the owner's explicit go and
the branch name. The closer never infers Phase B from a clean Phase A verdict.

#### D8 — Calibration evidence

The checks were calibrated against `main...feat/adapter-drive` @ `e3a4dbd`
(15 files, +2011/−62) on 2026-08-02, before this brief was written. Results,
which the agent file cites as its worked example:

*Would catch (2):* the OAuth refresh token written with the default file mode
in `packages/adapter-drive/src/credentials.ts` (`writeStoredToken` calls
`writeFile` with no `mode: 0o600`, while the module header declares credential
hygiene that turns out to cover logging, not at-rest permissions) — *precisa da
sua decisão*, check (c). And `@saci/core` declared in the package's
dependencies but imported nowhere — *observação*, check (a), bounded by N3.

*Passes clean (5):* R25 (`grep -rn 'from.*adapter' packages/core/src/` returns
nothing), R21, R24, R1, R5/R6.

*Noise the negative rules suppress (3):* `readStoredToken`'s documented
null-on-ENOENT (N1); the shared token-path constants across `credentials.ts`
and `errors.ts` (check (b) scope); and `uploadMimeType` versus
`core/file-name.ts`, where `grep -n "lastIndexOf|extname|extension"` across
`file-name.ts`, `derive-path.ts` and `workspace.ts` confirms core has no
extension logic at all (N2).

**Declared gap:** the diff produced two findings, so the five-finding ceiling
and its collapsed-overflow block are specified but **not exercised**. First
real overflow is the test.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The Orchestrator pre-saved this brief under the owner's write gate (caminho B).

- [ ] Branch `feat/closer-agent` is checked out, created from `d8426ce`
- [ ] Directory `docs/tasks/048-closer-agent/` exists
- [ ] File `docs/tasks/048-closer-agent/brief.md` exists; its first line
      matches the title at the top of this brief
- [ ] `git add docs/tasks/048-closer-agent/brief.md` staged
- [ ] Commit #1 subject: `docs(tasks): add brief for 048-closer-agent`

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

### Edit 2 — Create `.claude/agents/closer.md`

Create the file with this frontmatter, verbatim:

```yaml
---
name: closer
description: Review the assembled diff on a task branch against main before push. Phase A audits architecture, core duplication, and secret/path hygiene, then emits a pt-BR report and STOPs at the owner gate. Phase B pushes and opens the PR, only on explicit per-branch owner instruction.
model: inherit
tools: [Read, Bash, Grep, Glob]
disallowedTools: [Write, Edit]
permissionMode: default
---
```

`model: inherit` — unlike `brief-validator`'s `haiku`, the checks require
reading code for intent (N1 turns on a docstring, N2 on symbol provenance).

Body sections, English prose (D4), in this order:

1. **Role** — sixth agent; runs after the executor, before push; read-only in
   Phase A; the verdict is input to the owner's judgment, never a gate that
   opens itself.
2. **Inputs** — the D7 invocation contract. Missing branch or unresolvable
   `main...HEAD` → STOP and report.
3. **Scope of review** — D1 (a)(b)(c) with their exclusions stated as
   explicitly as the inclusions.
4. **Negative rules** — N1, N2, N3, each with its 047 evidence from D8.
5. **Trigger scaling** — D6, including the verbatim
   `não aplicável — diff não toca packages/` string.
6. **Output format** — the pt-BR template below, verbatim.
7. **The owner gate** — Phase A ends with STOP. Cross-reference Lesson #14.
8. **Phase B** — D2's procedure, explicitly conditional on an owner "vai" for
   the named branch. Restates R17 / G-R5 / G-R7. Includes the D5 post-merge
   duty (three-source P4 + merge SHA) and states that the next-session
   snippet is **not** the closer's to write.
9. **STOP conditions** — dirty working tree; branch not found; diff empty;
   `main` not resolvable.
10. **Hard rules** — read-only in Phase A; never merges; never `--force`;
    never pushes `main`; never infers Phase B from a clean verdict.

The output template, embedded verbatim:

````
# Revisão de diff — <branch>

**Base:** `main` @ `<sha>` · **HEAD:** `<branch>` @ `<sha>`
**Arquivos:** `<n>` · **Linhas:** `+<a> −<b>`

## Veredito

<pronto para push | precisa da sua decisão | tem trava>

## Achados

### 1. <título> — <trava | precisa da sua decisão | observação>

`<arquivo>:<linha>`

<Descrição. Todo termo técnico é definido na própria linha em que aparece.>

**Por que isso importa:** <uma linha>

## Checks sem achado

- **Arquitetura (R18–R25):** <resultado | não aplicável — diff não toca packages/>
- **Duplicação vs core:** <resultado | não aplicável — diff não toca packages/>
- **Segredo e caminho:** <resultado>

## Termos novos nesta sessão

- **<termo>** — <definição em uma linha>

<!-- Only when findings exceed five: -->
<details>
<summary>Mais <n> achados</summary>

<blocos no mesmo formato>

</details>
````

Below the template, state the design intent in the file itself: the report
exists to raise the owner's ceiling of understanding, not to enable approval
on autopilot.

Verification:

- [ ] `.claude/agents/closer.md` exists
- [ ] `grep -c "^name: closer" .claude/agents/closer.md` returns `1`
- [ ] `grep -c "disallowedTools: \[Write, Edit\]" .claude/agents/closer.md`
      returns `1`
- [ ] All ten body sections present, in the listed order
- [ ] N1, N2 and N3 each appear with their 047 evidence
- [ ] `grep -c "não aplicável — diff não toca packages/" .claude/agents/closer.md`
      returns at least `2` (D6 section and template)
- [ ] `grep -nE "trava|precisa da sua decisão|observação" .claude/agents/closer.md`
      matches — severity labels are pt-BR
- [ ] English prose outside the template: no pt-BR sentence appears in
      sections 1–5 or 7–10
- [ ] The file contains no instruction to merge, and no `--force` except in a
      prohibition
- [ ] `npm test` passes

Commit: `docs(agents): add closer pre-push diff-review agent`

### Edit 3 — Register the sixth role in `docs/AGENT_PLAYBOOK.md`

Two insertions, both additive. 3b touches the recap policy paragraph, and the
one sentence it appends is the only change permitted there (see Out of scope).

**3a.** In the chapter that enumerates the orchestration roles, add `closer`
as the sixth, one paragraph: what it reviews, that Phase A is read-only, that
its verdict is owner input rather than a gate, and that it takes the same
three-response rejection protocol as the orchestrator gate.

**3b.** At the "Recap policy" paragraph recording that *"a recap cannot cite
its own PR's merge SHA; the NEXT session confirms the merge via P4"*, append
one sentence: post-merge the closer's Phase B confirms the merge SHA in-session
(D5), while authoring the next-session snippet remains the Orchestrator
recap's duty. Do not restructure the paragraph or alter the recap contents
list.

Verification:

- [ ] `grep -c "closer" docs/AGENT_PLAYBOOK.md` returns at least `3`
- [ ] The role paragraph states Phase A is read-only and the verdict does not
      auto-advance
- [ ] The recap-policy paragraph keeps its three recap roles and its existing
      transport sentence intact
      (`git diff` on that paragraph shows only the appended sentence)
- [ ] No other section of the file is modified
      (`git diff --stat docs/AGENT_PLAYBOOK.md` shows insertions only)
- [ ] `npm test` passes

Commit: `docs(playbook): document the closer as the sixth agent role`

### Edit 4 — Update the agents entry in `CLAUDE.md`

In "Related Documents", the `.claude/agents/` line currently names
`planner.md`, `brief-validator.md`, `executor.md`. Add `closer.md` with a
four-word gloss. Do not touch any other line.

Verification:

- [ ] `grep -n "closer.md" CLAUDE.md` returns exactly one line
- [ ] `git diff --stat CLAUDE.md` shows exactly one line changed
- [ ] `npm test` passes

Commit: `docs: add the closer agent to related documents`

### Commit sequence

1. `docs(tasks): add brief for 048-closer-agent`
2. `docs(agents): add closer pre-push diff-review agent`
3. `docs(playbook): document the closer as the sixth agent role`
4. `docs: add the closer agent to related documents`

All four subjects are ≤ 72 chars.

### Structural checks

- [ ] Expected files exist at expected paths
- [ ] No file outside the in-scope list of Constraint 1 was modified
      (`git diff --name-only main..HEAD`)

### Behavior checks

- [ ] Read `.claude/agents/closer.md` as if invoked, against the D8 diff
      (`git diff main...feat/adapter-drive`): the two D8 findings are
      reachable from the instructions, and each of the three noise cases is
      suppressed by a named negative rule. Report the trace; do not fix the
      047 branch.
- [ ] The file gives the agent no route to push, merge, or `--force` without
      an explicit per-branch owner instruction.

### Git checks

- [ ] Branch used: `feat/closer-agent`, created from `d8426ce`
- [ ] Commits follow Conventional Commits (G-R3); subjects ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 2 — first modified file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message +
      `pre-commit-self-audit` output shown before each commit
- [ ] `npm test` run and reported by hand at every Pause 3 (Constraint 4)
- [ ] Any criterion that could not be met was reported explicitly

## Pause points

- **Pause 1:** skipped (`Plan required: no`).
- **Pause 2 (after the first modified file):** always required.
- **Pause 3 (before each commit):** always required.

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md` as a
  follow-up brief.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

- Every architectural decision is closed in D1–D8, each ruled by the owner
  during the caminho B session on 2026-08-02.
- Edit 2 specifies the frontmatter and the report template verbatim, and the
  body as an ordered ten-section contract with grep-checkable verification.
- Edits 3 and 4 are bounded insertions with explicit do-not-touch limits.
- The judgment calls have explicit STOP-and-report fallbacks.

Pause 2 and Pause 3 remain required regardless (Lesson #6).

## Reference documents (read before starting)

1. `CLAUDE.md` — R4, R5, R6, R9, R10, R13, R17, R18–R25
2. `docs/GIT_WORKFLOW.md` — G-R2, G-R3, G-R5, G-R7, G-A7
3. `docs/AGENT_PLAYBOOK.md` — role chapter, orchestrator gate, Lesson #14,
   recap policy, "When NOT to use the pipeline"
4. `.claude/agents/brief-validator.md` — the read-only agent shape this file
   mirrors (frontmatter, STOP conditions, hard rules)
5. `.claude/skills/pre-commit-self-audit/SKILL.md` — Pause 3 self-audit
6. `docs/tasks/047-adapter-drive/brief.md` (on `feat/adapter-drive`) — context
   for the D8 calibration diff

## Expected output (end of session)

1. Branch name and `git log --oneline main..HEAD`
2. `git diff --stat main...HEAD`
3. Any verification checkbox that could not be met, with explanation
4. The behavior-check trace from Edit 2 against the D8 diff
5. Confirmation that no `git push` was executed
6. Suggested next step
