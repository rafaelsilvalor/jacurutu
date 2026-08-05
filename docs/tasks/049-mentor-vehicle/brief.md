# Brief: 049 — Bring the Mentor into Claude Code (vehicle)

> **Category:** L
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/mentor-vehicle`

---

## Context

The Mentor role lives in chat (claude.ai), on a surface that cannot read the
repo, cannot run `git log`, and cannot verify a claim against the code it is
reasoning about. The exploration note
`docs/explorations/mentor-lane-and-task-identity.md` — merged as PR #113,
`13e63d7` — closed fifteen decisions (D1–D15) that retire chat and rebuild the
Mentor as its own Claude Code main session, plus nine (E1–E9) on the task
identifier. The note names three follow-on briefs: A (Mentor doctrine), B
(ROADMAP migration), C (identifier cutover).

**Brief A was split during modeling on 2026-08-04.** As a single brief it
specified three new files plus four canonical-document rewrites — past 600
lines, which `.claude/skills/brief-template/SKILL.md` calls "XL in disguise".
The split is by surface:

- **049 (this brief) — the vehicle.** The `mentor-mode` skill, the two harness
  workflows that open and close a Mentor session, retirement of the two chat
  workflows they replace, and repair of every pointer that retirement breaks.
- **050 — the doctrine.** `docs/MENTOR_BRIEF.md` (M-R12 through M-R15, §5, §7,
  §8), `docs/AGENT_PLAYBOOK.md` chapter 6, `docs/explorations/README.md`
  contract, and the `CLAUDE.md` related-documents gloss.

**Size note.** Substance sits at roughly 480 lines against the Category-L
guide of 200-400 in `.claude/skills/brief-template/SKILL.md`. Two things carry
the excess and neither can be thinned without losing the specification: seven
owner-closed decisions (D1–D7), three of which — D3, D4, D6 — exist to record
*why a closed decision from the note could not be implemented as written*, and
three Edit blocks that specify new files as ordered section contracts rather
than by prose. A further split was considered and rejected: brief A was already
split once, and a third slice would separate a new file from the pointer
repairs that keep the repo consistent, closing on incomplete evidence. L is the
honest header; the deviation is declared here rather than hidden by thinning.

This task **modifies the pipeline itself**, so it takes caminho B per
`docs/AGENT_PLAYBOOK.md` "When NOT to use the pipeline": the Orchestrator
authored this brief directly, with the owner closing D1–D7 on 2026-08-04. The
planner was not invoked. The brief-validator **is** still invoked — its eleven
checks are mechanical and apply unchanged.

P4 slot evidence (three sources, checked 2026-08-04):

- `ls docs/tasks/` — highest existing slot `048-closer-agent`. Gaps 004-006
  (burned, `CLAUDE.md` E5) and 034 are preserved, not free.
- `git log --oneline main` — HEAD is `9e6d826 docs: add the 2026-08-03 mentor
  recap and fix the 047 status in the note (#114)`. Slots 047 and 048 are both
  merged (#110, #108/#109). No merged PR references a slot above 048.
- `grep -rn '\b049\b' docs/tasks/ CLAUDE.md docs/ROADMAP.md` — no forward
  reserve. `CLAUDE.md` E1–E5 are v1-freeze exceptions; none reserves a slot.

The three sources agree and yield **049**. No unmerged branch holds a higher
slot — the structural blind spot recorded at 048 does not apply here (zero open
PRs on 2026-08-04).

## Goal

Create the Mentor's vehicle inside Claude Code — the `mentor-mode` skill and
the two harness workflows that open and close a Mentor session — and retire the
two chat workflows they replace, leaving no reference to a deleted file
anywhere in the repo's live surface.

Out of scope:

- **All doctrine rewrites.** `docs/MENTOR_BRIEF.md`, `docs/AGENT_PLAYBOOK.md`
  and `docs/explorations/README.md` are **not** edited by this brief. Every
  M-R rule keeps its current text. Brief 050 owns them.
- **`CLAUDE.md` beyond one pointer.** Only the stale path inside R9's
  human-edited-interface bullet is repaired (Edit 4a). The R9 sentence claiming
  `--- COPIAR ---` blocks are English is **left alone** — see D4; brief 050
  reconciles it.
- **`harness/init/**`.** The bootstrap prompts target a *new* project and
  legitimately still point at claude.ai. `harness/README.md` lines 3 and 39-41,
  which frame that bootstrap flow, stay as they are for the same reason.
- **`harness/skills-plan/**`.** Drafts, not active surface.
- **`harness/workflows/setup-cowork.md`.** Cowork is a different surface and is
  not retired by D1.
- **`harness/workflows/close-task.md`.** Its claude.ai project-knowledge
  re-upload step (line 105) dies with the cache-swap ritual, which is doctrine —
  brief 050.
- **The permission-layer deny.** Deferred with a recorded reason — see D3.
- **Historical recaps and briefs.** `docs/sessions/**` and `docs/tasks/0NN/**`
  record what was true on their date. Never rewritten.
- **Exercising the new workflows.** Creating the vehicle and driving it are
  separate concerns; the first real Mentor session is the test.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created, modified or deleted:
   `docs/tasks/049-mentor-vehicle/**`, `.claude/skills/mentor-mode/SKILL.md`,
   `harness/workflows/setup-mentor.md`,
   `harness/workflows/close-mentor-session.md`,
   `harness/workflows/setup-chat.md` (delete),
   `harness/workflows/close-chat-session.md` (delete),
   `harness/workflows/README.md`, `harness/workflows/setup-orchestrator.md`,
   `harness/workflows/audit-merge.md`, `harness/README.md`, `CLAUDE.md`,
   `docs/explorations/mentor-lane-and-task-identity.md`.
   If anything else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md`, especially R9 (language surfaces — D4
   resolves a live edge case and must not be improvised on), R10 (Conventional
   Commits, no trailers), R13 (no `--no-verify`), R17 (no proactive push).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `docs/mentor-vehicle`, created from the verified base
     `9e6d826` **before Edit 1**. The session branch
     `claude/saci-mentor-doctrine-brief-a-050b04` violates `CLAUDE.md` R11 /
     G-R2 and fails validator C4; do not commit on it.
   - Conventional Commits (G-R3), subject ≤ 72 chars
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
4. **The test suite is not evidence for this task, and must not be run as if
   it were.** This brief's diff touches no file under `packages/**`, and this
   session worktree hits `docs/GOTCHAS.md` G-NODE-2. Both failure shapes were
   reproduced on 2026-08-04 while authoring this brief: with `node_modules`
   unmaterialized, `npm test` globs `packages/*/dist/**/*.test.js`, matches
   nothing, and exits `0` on zero tests — a vacuous green; after `npm run
   build` it resolves `@saci/*` to the main checkout and fails on
   `buildEditableStem` and `DriveItem`, symbols unrelated to this change. Do
   **not** run `npm install` to work around it — that is the G-NODE-2
   workaround for code tasks and risks lockfile drift on a docs branch.
   Instead, before every Pause 3, verify and report that
   `git diff --name-only main..HEAD` contains no `packages/` path. The
   pre-commit hook is not wired in this clone (`core.hooksPath` unset), so
   nothing runs the suite automatically either; this is not a G-R8 bypass —
   the hook is absent, not skipped.
5. Deletions use `git rm`, never a filesystem delete followed by `git add -A`.
   The two removals must appear in `git status` as `deleted:` before Pause 3.
6. Neither new workflow file, nor the skill, may instruct any agent to push,
   merge, open a PR, or create a branch without an explicit per-branch owner
   instruction.

### Conventions

- Commit type/scope: `docs(skills)` for the skill (matching the merged
  precedent `docs(agents):` for `.claude/agents/**`), `docs(harness)` for
  files under `harness/`, `docs(explorations)` for the note, `docs(tasks)` for
  this brief, bare `docs` when a commit spans `harness/` and `CLAUDE.md`.
- `.claude/skills/mentor-mode/SKILL.md` is agent-consumed surface: **English**
  (R9). The two `harness/workflows/*.md` files follow D4.

### Architectural decisions already made (do not revisit)

#### D1 — The skill is a shim, not a second doctrine

`.claude/skills/mentor-mode/SKILL.md` carries **session mechanics only**: how a
Mentor session opens, what it may read, what it may write, what it may not do,
how it closes. It carries **no behavior rule** — no restatement of M-R1 through
M-R15, no communication-style guidance, no user profile.

The skill names `docs/MENTOR_BRIEF.md` as the single source of truth for
behavior and instructs the session to read it in full at open. Rationale: two
files stating the same rule diverge the day one is edited, and this repo already
paid that cost — the verb allowlist was canonicalized to one SSOT on 2026-05-28
for exactly this reason.

#### D2 — Session shape: own main session, Plan mode, no subagents

From note D2, D4, D5. The Mentor is its own Claude Code **main session** — not
an Orchestrator mode, not a subagent. One session, one role. Plan mode is the
session default. Subagents are forbidden: no planner, no brief-validator, no
executor, no closer, no gate, no pipeline. If the owner asks for a task to be
modeled, a brief written, a ruling issued, or code edited, the session
**redirects to an Orchestrator session** and does not absorb the work.

#### D3 — Write policy is doctrinal; the mechanical deny is deferred

Note D3 specified "wide read, narrow write", mechanically backed by a path
`deny` in `.claude/settings.json`. **The mechanical half is not implementable
as specified** and is deferred by owner ruling on 2026-08-04:

- `.claude/settings.json` does not exist in this repo. The only settings file
  is `.claude/settings.local.json`, which `.gitignore` excludes (line 8).
- Project settings apply to **every** session opened in the project and are
  inherited by subagents. A deny restricting writes to `docs/explorations/`
  would break the executor (which writes `packages/**`) and the Orchestrator
  (which writes `docs/tasks/**`). The permission layer has no per-role
  condition.

What ships is the doctrinal half, stated in the skill and in
`setup-mentor.md`:

- **Read: wide.** Any file. Non-mutating shell only — `git log`, `git status`,
  `git diff`, `ls`, `grep`, `npm test`.
- **Write: narrow.** Only under `docs/explorations/`, and only through the
  write gate — show the full content, owner approves, write, read the file back
  from disk, confirm byte-match.
- **Forbidden outright:** `git add`, `git commit`, `git switch`, `git checkout`,
  `git branch`, `git push`, `npm install`, and any write outside
  `docs/explorations/`.

The skill records this as a **declared gap** in its own text, so a reader of
the doctrine meets the limitation rather than assuming enforcement. The gap
names one unverified candidate mechanism for the follow-up brief to test —
skill-level `allowed-tools` frontmatter — and states plainly that it was not
verified here. Shipping an unverified deny was rejected: a restriction that
silently does not apply is worse than none, because it is trusted.

#### D4 — `--- COPIAR ---` blocks stay pt-BR, and the tension is declared

`CLAUDE.md` R9 states that `--- COPIAR ---` blocks inside
`harness/workflows/*.md` are English. Every such block on disk today is pt-BR,
including `setup-orchestrator.md`, the file the new prompts sit beside and the
one the owner pastes to open the session that authored this brief.

Ruling: the two new files carry **pt-BR** blocks, matching their siblings and
M-R10 (the owner pastes them and reads them). This is a deliberate, recorded
deviation from R9's letter, not an oversight. Brief 050 reconciles the R9
sentence with reality; this brief does not edit it (Out of scope).

Surrounding usage prose is pt-BR under R9's human-edited-interface allowance,
as in every existing workflow file.

#### D5 — The close ritual proposes dispositions; it produces no recap

From note D6 and D14. `close-mentor-session.md` replaces
`close-chat-session.md`. The Mentor recap is retired — the session's only
artifact is the topic note.

The close ritual runs:

1. **Declare the axis.** A session **with** a topic produces or updates a note
   under `docs/explorations/`. A session **without** one produces no artifact
   and says so in one line, then ends.
2. **Write the note through the write gate** — full content shown, owner
   approves, write, read-back, byte-match confirmed.
3. **Propose a disposition** for every note the session touched, from the
   closed set: `open`, `candidate`, `deferred` (declared trigger required),
   `discarded` (reason required), `promoted to brief <id>`. Every transition is
   dated. Nothing is ever deleted. The **owner ratifies**; the Mentor writes the
   ratified status.
4. **Apply the split rule** (note D12): status lives at note level; an internal
   item whose disposition diverges from its note becomes its own note.
5. **Transport:** a `docs/<topic>` branch plus its own PR. Branch creation
   requires explicit owner approval from a verified base SHA; push and PR
   opening require an explicit per-branch instruction (R17 / G-R5).

The ritual states two boundaries in its own text: the Mentor never touches
`docs/ROADMAP.md` and never opens a brief (note D11), and the accepted price of
retiring the recap is the loss of the global temporal index — `ls
docs/sessions/` no longer lists every Mentor session — mitigated by dated
`Origin` lines, dated changelogs, and `git log` (note, §2).

#### D6 — The doctrine window between 049 and 050 is declared, not patched

Until brief 050 merges, `docs/MENTOR_BRIEF.md` still describes the Mentor as a
chat role, and `docs/AGENT_PLAYBOOK.md` chapter 6 still lists "Chat
(claude.ai)" as the Mentor's home. This brief does **not** soften those files.

Instead, `setup-mentor.md` and the skill each carry one visible line stating
that the doctrine documents are mid-migration and that where they say "chat",
the Mentor session in Claude Code is meant. The line names brief 050 and is
removed by it. A pointer to a known-stale claim beats a silent contradiction,
and beats a partial rewrite that would leave 050 editing half-migrated prose.

#### D7 — The note amendment is bounded to what this brief falsifies

`docs/explorations/mentor-lane-and-task-identity.md` is amended in exactly two
places, both falsified by this brief's existence:

- **E3's cutover anchor.** "Cutover at slot 049" cannot hold: this brief takes
  049, and `brief-validator` check C1 requires a three-digit id
  (`^# Brief: [0-9]{3} — `) until brief C rewrites it. Re-anchor to brief C's
  merge, with no fixed number, so it cannot be falsified again.
- **§6's brief table.** Brief A is now two briefs. The table gains a row and
  the slot assignments are recorded: A1 = 049, A2 = 050, B = 051, C = 052.

Plus one dated changelog entry. **Nothing else in the note is touched** — not
the D-set, not the E-set beyond E3, not the disposition line. The note stays
`candidate` until brief C lands; `promoted to brief <id>` is C's to write.

The amendment is authorized by `docs/explorations/README.md` rule 3, which
permits a note to be "amended by a brief that explicitly scopes them".

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The Orchestrator pre-saved this brief under the owner's write gate (caminho B).

- [ ] Branch `docs/mentor-vehicle` is checked out, created from `9e6d826`
- [ ] Directory `docs/tasks/049-mentor-vehicle/` exists
- [ ] File `docs/tasks/049-mentor-vehicle/brief.md` exists; its first line
      matches the title at the top of this brief
- [ ] `git add docs/tasks/049-mentor-vehicle/brief.md` staged
- [ ] Commit #1 subject: `docs(tasks): add brief for 049-mentor-vehicle`

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

### Edit 2 — Create `.claude/skills/mentor-mode/SKILL.md`

Create the file with this frontmatter, verbatim:

```yaml
---
name: mentor-mode
description: Open a Mentor session in Claude Code — the conceptual lane for learning, pre-task exploration and meta-discussion. Wide read, narrow write: the only artifact is a note under docs/explorations/. No subagents, no briefs, no code.
---
```

Body sections, **English** prose (R9), in this order:

1. **When to invoke** — at the open of a Mentor session, before any
   substantive reply. Not for task modeling, briefs, rulings or code: those are
   Orchestrator sessions.
2. **Read `docs/MENTOR_BRIEF.md` in full first** — it is the single source of
   truth for behavior (D1). This skill restates no M-R rule.
3. **Session opening** — the M-R13 declaration in one line: who the owner is,
   and which axis is active (D5 step 1). The four labels — mentoring, code
   review by reading, continuing a conceptual thread, exploring possibilities —
   survive as **opening intent, not behavior classes** (note D8). If the
   opening message is ambiguous, ask before acting.
4. **Session shape** — D2, stated as four flat prohibitions: own main session;
   Plan mode default; no subagents of any kind; redirect to an Orchestrator
   session when asked to model a task, author a brief, issue an operational
   ruling, or edit code.
5. **Read policy** — wide, per D3, with the non-mutating shell allowlist
   spelled out.
6. **Write policy** — narrow, per D3: only `docs/explorations/`, only through
   the write gate, with the four gate steps named (show, approve, write,
   read-back and byte-match), and the forbidden-command list verbatim.
7. **Known gap: the write policy is doctrinal only** — D3's reasoning in three
   or four sentences, including why a project-wide deny was rejected, the
   unverified `allowed-tools` candidate, and that a follow-up brief owns it.
   State plainly that no permission-layer enforcement exists today.
8. **Closing a session** — points at `harness/workflows/close-mentor-session.md`
   and names the disposition set from D5 step 3. Records that the Mentor recap
   is retired.
9. **Migration note** — the D6 line naming brief 050. Marked for removal by
   that brief.
10. **Hard rules** — never writes outside `docs/explorations/`; never runs a
    mutating git command; never invokes a subagent; never opens a brief; never
    touches `docs/ROADMAP.md`; never pushes.

Verification:

- [ ] `.claude/skills/mentor-mode/SKILL.md` exists
- [ ] `grep -c "^name: mentor-mode" .claude/skills/mentor-mode/SKILL.md`
      returns `1`
- [ ] All ten sections present, in the listed order
- [ ] `grep -c "docs/MENTOR_BRIEF.md" .claude/skills/mentor-mode/SKILL.md`
      returns at least `1`
- [ ] The file contains **no** line beginning `M-R` followed by a digit —
      no behavior rule is restated (D1)
- [ ] Section 7 exists and states that no permission-layer enforcement is in
      place
- [ ] Section 9 names brief 050
- [ ] The file is English throughout: no pt-BR sentence anywhere
- [ ] The file contains no instruction to push, merge, commit, or invoke a
      subagent, except as a prohibition
- [ ] `git diff --name-only main..HEAD` contains no `packages/` path
      (Constraint 4 — the suite is not evidence here)

Commit: `docs(skills): add the mentor-mode session skill`

### Edit 3 — Create the two harness workflows

Both files follow the existing workflow shape: pt-BR usage prose around one
`--- COPIAR ---` / `--- FIM COPIAR ---` block (D4). Model the structure on
`harness/workflows/setup-orchestrator.md`.

#### 3a. `harness/workflows/setup-mentor.md`

Sections, in this order:

```
## Quando usar
## Pré-requisitos
--- COPIAR --- block
## Avisos
## Próximo passo após setup
```

The COPIAR block must carry, at minimum:

- Invocation of the `mentor-mode` skill at session open.
- The read list: `CLAUDE.md`, `docs/MENTOR_BRIEF.md`, plus the existing note in
  `docs/explorations/` when the topic has one.
- The M-R13 declaration requirement before any substantive reply.
- The write policy in one paragraph (D3), including the write gate steps.
- The no-subagents prohibition (D2).
- The D6 migration line.

`## Avisos` must state the D3 gap in one bullet: the write restriction is
doctrine, not enforcement.

#### 3b. `harness/workflows/close-mentor-session.md`

Sections, in this order:

```
## Quando usar
## Pré-requisitos
## Trigger
--- COPIAR --- block
## Princípio em jogo
## Próximo workflow
```

`## Trigger` carries the hybrid trigger from the retired
`close-chat-session.md`: explicit invocation runs directly; detected signals
(farewell, structural closure, topic shift) prompt for confirmation first.

The COPIAR block implements D5 as numbered steps, and must carry the
disposition set verbatim: `open`, `candidate`, `deferred`, `discarded`,
`promoted to brief <id>`, with the trigger/reason requirements attached to
`deferred` and `discarded`.

Verification:

- [ ] Both files exist under `harness/workflows/`
- [ ] Each contains exactly one `--- COPIAR ---` and one `--- FIM COPIAR ---`
- [ ] `grep -c "mentor-mode" harness/workflows/setup-mentor.md` returns at
      least `1`
- [ ] `grep -c "docs/explorations/" harness/workflows/setup-mentor.md` returns
      at least `1`
- [ ] `setup-mentor.md` states the D3 gap under `## Avisos`
- [ ] `setup-mentor.md` carries the D6 migration line naming brief 050
- [ ] All five disposition values appear in `close-mentor-session.md`
- [ ] `grep -inE "recap" harness/workflows/close-mentor-session.md` shows the
      word only where the retirement is stated — the file specifies no recap
      to produce
- [ ] Neither file instructs an agent to push, merge, open a PR, or create a
      branch without an explicit owner instruction
- [ ] `git diff --name-only main..HEAD` contains no `packages/` path
      (Constraint 4 — the suite is not evidence here)

Commit: `docs(harness): add the setup-mentor and close-mentor workflows`

### Edit 4 — Retire the chat workflows and repair every pointer

Delete both files with `git rm`, then repair the five reference sites. The
deletions and the repairs are one commit: a dangling pointer is not a separate
concern from the deletion that created it.

```bash
git rm harness/workflows/setup-chat.md
git rm harness/workflows/close-chat-session.md
```

**4a. `CLAUDE.md`, R9 human-edited-interface bullet (line 50).** Replace the
list item `` `harness/setup-chat.md` `` with
`` `harness/workflows/setup-mentor.md` ``. Note the existing entry also carries
a stale path (the file lives under `harness/workflows/`, not `harness/`); the
replacement corrects both defects in one edit. **Do not touch any other part of
R9**, including the preceding bullet's claim about English `--- COPIAR ---`
blocks (D4, Out of scope).

**4b. `harness/README.md` line 30.** Replace
`- **Sessão nova de chat:** cola \`docs/workflows/setup-chat.md\`` with a
Mentor entry pointing at `harness/workflows/setup-mentor.md`. The two sibling
lines (31, 32) carry the same stale `docs/workflows/` prefix; correct the
prefix on those two lines as well — same defect, adjacent lines, no doctrinal
content. Change nothing else in the file; lines 3 and 39-41 are Out of scope.

**4c. `harness/workflows/README.md`.** Three repairs:
- The `### Setup de sessão` entry for `setup-chat.md` becomes an entry for
  `setup-mentor.md`, described as the Mentor session in Claude Code.
- The `### Continuidade` entry for `close-chat-session.md` becomes
  `close-mentor-session.md`, described as closing with a note disposition
  rather than a recap saved to `docs/sessions/`.
- Step 4 of `## Como usar` — `Cola no agente (Chat, Cowork ou Code)` — drops
  `Chat`.

**4d. `harness/workflows/setup-orchestrator.md` line 14.** The clause routing
conceptual work to `o Mentor no chat (\`setup-chat.md\`)` now routes it to the
Mentor session, citing `setup-mentor.md`.

**4e. `harness/workflows/audit-merge.md`, `## Próximo workflow`.** Line 71's
`close-chat-session.md` becomes `close-mentor-session.md`. Line 73's
`modelagem ad-hoc no chat` becomes ad-hoc modeling in an Orchestrator session —
the claim goes false the moment chat is retired.

Verification:

- [ ] `ls harness/workflows/setup-chat.md harness/workflows/close-chat-session.md`
      returns "No such file" for both
- [ ] `git status` showed both as `deleted:` before the commit (Constraint 5)
- [ ] `grep -rn "setup-chat\|close-chat-session" --include="*.md" . | grep -v
      "docs/sessions/" | grep -v "docs/tasks/"` returns **nothing**
- [ ] The same grep restricted to `docs/sessions/` and `docs/tasks/0`
      still returns matches — history was not rewritten
- [ ] `git diff --stat CLAUDE.md` shows exactly one line changed
- [ ] `grep -c 'are pasted into the agent as English instructions' CLAUDE.md`
      returns `1` — the R9 English claim survives verbatim (D4)
- [ ] `harness/README.md` lines 3 and 39-41 are unchanged
      (`git diff harness/README.md` touches only the three list entries)
- [ ] `git diff --name-only main..HEAD` contains no `packages/` path
      (Constraint 4 — the suite is not evidence here)

Commit: `docs: remove the retired chat session workflows`

### Edit 5 — Amend the exploration note

Two bounded edits plus a changelog entry in
`docs/explorations/mentor-lane-and-task-identity.md`, per D7.

**5a. E3, in the section 3 decision table.** Replace the current cell text
("Cutover at slot 049. Through 048, `NNN`; from 049 on, date. Forward only, no
retroactive migration.") with a re-anchored rule: the cutover takes effect on
brief C's merge — every task born before it keeps `NNN`, every task born after
it takes a date. State the reason the slot anchor failed: briefs A1, A2, B and
C take 049-052 under the old scheme because `brief-validator` check C1 requires
a three-digit id until brief C rewrites it. Use no fixed slot number in the new
text, so it cannot be falsified a second time.

**5b. Section 6, the brief table.** Split the `A` row into `A1` and `A2` with
their scopes as described in this brief's Context, and record the slots:
A1 = 049, A2 = 050, B = 051, C = 052. Keep the `Depends on` column coherent:
A2 depends on A1; B depends on A2 (the note contract); C depends on A1
(`close-mentor-session.md`).

**5c. Changelog.** Append one dated entry under `## Changelog`:
2026-08-04 — brief A split into A1 (049, vehicle) and A2 (050, doctrine);
E3's cutover re-anchored from slot 049 to brief C's merge.

Verification:

- [ ] `grep -c "049" docs/explorations/mentor-lane-and-task-identity.md`
      returns at least `2` (E3 rationale and the §6 table)
- [ ] The string `Cutover at slot 049` no longer appears in the file
- [ ] The §6 table has four data rows (A1, A2, B, C)
- [ ] The `## Changelog` section gained exactly one entry; the two existing
      2026-08-03 entries are unchanged
- [ ] `grep -n "Disposition: candidate" docs/explorations/mentor-lane-and-task-identity.md`
      still matches — the disposition line is untouched (D7)
- [ ] `git diff --stat docs/explorations/mentor-lane-and-task-identity.md`
      shows no change to the D-set table or to E1-E2, E4-E9
- [ ] `git diff --name-only main..HEAD` contains no `packages/` path
      (Constraint 4 — the suite is not evidence here)

Commit: `docs(explorations): update the cutover anchor and brief split`

### Commit sequence

1. `docs(tasks): add brief for 049-mentor-vehicle`
2. `docs(skills): add the mentor-mode session skill`
3. `docs(harness): add the setup-mentor and close-mentor workflows`
4. `docs: remove the retired chat session workflows`
5. `docs(explorations): update the cutover anchor and brief split`

All five subjects are ≤ 72 chars; all five verbs (`add`, `add`, `add`,
`remove`, `update`) are in the allowlist at
`.claude/skills/pre-commit-self-audit/SKILL.md`.

### Structural checks

- [ ] Expected files exist at expected paths; both deletions are gone
- [ ] No file outside the in-scope list of Constraint 1 was modified
      (`git diff --name-only main..HEAD`)

### Behavior checks

- [ ] Read `.claude/skills/mentor-mode/SKILL.md` as if opening a Mentor
      session: trace that a request to "model a task" reaches the redirect in
      section 4, and that a request to edit a file outside
      `docs/explorations/` reaches a prohibition in section 6 or 10. Report the
      trace.
- [ ] Read `harness/workflows/close-mentor-session.md` against a hypothetical
      session that touched one note and left one internal item diverging:
      confirm the steps produce a disposition for the note and the split rule
      for the item. Report the trace.
- [ ] Neither the skill nor either workflow gives an agent a route to push,
      merge, commit, or invoke a subagent.

### Git checks

- [ ] Branch used: `docs/mentor-vehicle`, created from `9e6d826`
- [ ] Commits follow Conventional Commits (G-R3); subjects ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 2 — first modified file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message +
      `pre-commit-self-audit` output shown before each commit
- [ ] The Constraint 4 no-`packages/` verification reported at every Pause 3,
      and the test suite was **not** run as evidence
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

- Every architectural decision is closed in D1–D7, each ruled by the owner
  during the caminho B session on 2026-08-04.
- Edit 2 specifies the frontmatter verbatim and the body as an ordered
  ten-section contract with grep-checkable verification.
- Edit 3 specifies both files as section lists with mandatory content clauses;
  Edits 4 and 5 name every line to change and every line not to.
- The judgment calls have explicit STOP-and-report fallbacks.

Pause 2 and Pause 3 remain required regardless (Lesson #6).

## Reference documents (read before starting)

1. `CLAUDE.md` — R9 (surfaces, and the D4 deviation), R10, R11, R13, R17
2. `docs/GIT_WORKFLOW.md` — G-R2, G-R3, G-R5, G-A7, and the `claude/*`
   scaffolding-branch section
3. `docs/explorations/mentor-lane-and-task-identity.md` — the D-set and E-set
   this brief implements
4. `docs/MENTOR_BRIEF.md` — read for the behavior rules the skill points at;
   **not edited** by this brief
5. `docs/AGENT_PLAYBOOK.md` — chapter 6, "When NOT to use the pipeline",
   Lesson #6
6. `harness/workflows/setup-orchestrator.md` — the file shape both new
   workflows mirror
7. `.claude/skills/pre-commit-self-audit/SKILL.md` — Pause 3 self-audit and the
   verb allowlist

## Expected output (end of session)

1. Branch name and `git log --oneline main..HEAD`
2. `git diff --stat main...HEAD`
3. Any verification checkbox that could not be met, with explanation
4. The two behavior-check traces from the Behavior checks section
5. Confirmation that no `git push` was executed
6. Suggested next step
