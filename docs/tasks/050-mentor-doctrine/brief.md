# Brief: 050 — The Mentor doctrine

> **Category:** L
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/mentor-doctrine`

---

## Context

Task 049 moved the Mentor off claude.ai into Claude Code as its own main
session — the `mentor-mode` skill plus `setup-mentor.md` and
`close-mentor-session.md`. It shipped the **vehicle** and deliberately left the
**doctrine**: `MENTOR_BRIEF.md` and `AGENT_PLAYBOOK.md` chapter 6 still call the
Mentor a chat role on claude.ai. Rather than half-rewrite them, 049 declared a
migration window with two visible notices — section 9 of the skill, and a
paragraph inside `setup-mentor.md`'s COPIAR block — both written to be deleted
by this brief (`docs/sessions/2026-08-04-orchestrator-049-mentor-vehicle.md`,
D6).

This brief closes that window. It is brief A2 of the four in
`docs/explorations/mentor-lane-and-task-identity.md` §6, implementing decision
set A — principally D8 (the four §8 modes collapse into two axes), D14 (the
close ritual proposes dispositions instead of a recap) and D15 (the note
contract is rewritten). It also carries four debts 049 left marked, plus one
correction only a repo-wide sweep could see: `docs/PROCESS_MAP.md` landed
2026-08-04, a day after the note measured its migration surface, and restates
the chat-Mentor doctrine in nine places — one of them a literal mirror of the
false R9 sentence this brief fixes.

**Size note — measurement, not justification.** Substance measures **~1115**
against the 350-650 range for a doctrinal caminho B brief
(`.claude/skills/brief-template/SKILL.md`): 72% over, and the fourth
consecutive overrun (047 ~600, 048 ~430, 049 ~480, this one). The owner ruled
in the authoring session that **the size guidance does not govern this brief**,
and that the guidance itself is to be reformulated as a separate piece of work.
This brief is therefore written at full fidelity and the figure is recorded
here as input to that reformulation, not as a defense.

Two facts the reformulation should have. First, the composition: of the 1115,
~280 lines are literal text — current wording quoted so the executor can match
on it, the replacement prose itself, and the repair tables — and ~120 more are
verification checkboxes. A compression pass over Context, Goal and the decision
blocks recovered 28 lines before it started costing fidelity. Second, the split
test came out no in both directions: chapter 6 describes the roles
`MENTOR_BRIEF.md` defines, and the 049 notices are a reader's only warning that
the doctrine is stale, so removing them ahead of the rewrite would be
false-by-deletion. The one clean seam — the note contract (Edits 5 and 9b) —
was measured and rejected: M-R14 points at that contract, so splitting would
ship a rule whose pointer dangles until the second brief lands, and would put a
mutual cross-reference across two briefs that no single validator pass can
audit. That is exactly 049's number-one defect class (D3 against D5 step 5, one
brief, caught only at Pause 3).

## Goal

Rewrite the Mentor's doctrine for a lane that lives in Claude Code, leave no
live document asserting the Mentor runs in chat, and delete the two migration
notices 049 wrote for this brief to remove.

Out of scope:

- **`harness/init/**` and `harness/README.md`** — chat-Mentor language
  throughout, owned by the parked `049-init-six-role-bootstrap` task's declared
  scope (its Edits 5 and 7).
- **`harness/skills-plan/`** — candidate skills, not active.
- **The identifier convention.** `NNN`, the P4 protocol and
  `docs/tasks/<NNN>-<slug>/` are brief C's (052). This brief is authored under
  the old scheme and changes nothing about it, including inside the files it
  otherwise edits.
- **The 22 ROADMAP entries.** Brief B (051) migrates them. This brief writes
  the contract those notes will obey; it moves no entry and never opens
  `docs/ROADMAP.md`.
- **The `brief-validator` C11 extraction defect.** Known, impact nil.
- **The mechanical write deny.** Still untested; the skill's section 7 says so.
- **Any file under `packages/`.**

## Constraints

### Non-negotiable constraints

1. Only the following paths may be modified. If anything else needs changing,
   **STOP and ask**:
   - `docs/MENTOR_BRIEF.md`
   - `docs/AGENT_PLAYBOOK.md`
   - `docs/explorations/README.md`
   - `docs/PROCESS_MAP.md`
   - `docs/GIT_WORKFLOW.md`
   - `CLAUDE.md`
   - `.claude/skills/mentor-mode/SKILL.md`
   - `harness/workflows/setup-mentor.md`
   - `harness/workflows/close-task.md`
   - `harness/workflows/audit-merge.md`
   - `harness/workflows/setup-cowork.md`
   - `harness/workflows/gitflow-emergency-recovery.md`
   - `.claude/agents/executor.md`
   - `.claude/agents/closer.md`
   - `docs/tasks/050-mentor-doctrine/brief.md` (this file, commit #1)

   No file is created and no file is deleted by this brief.

2. Follow `CLAUDE.md` in full, **R9** (language surfaces) and **R10**
   (Conventional Commits) especially, and `docs/GIT_WORKFLOW.md` in full:
   branch `docs/mentor-doctrine` from the verified base `418da64`; Conventional
   Commits (G-R3), subjects ≤ 72 chars, imperative; no `Co-authored-by` (G-A7);
   commit freely but **DO NOT push** (G-R5 / R17). The session's `claude/*`
   branch is scaffolding and must not receive commits. No `STATE.md` —
   Category L but single-session and docs-only, and the path is not in
   constraint 1.

3. **`npm test` is not evidence here and must not be run as if it were.** The
   diff touches no `packages/` path, and in a session worktree the suite either
   matches zero compiled tests and exits `0` on a vacuous green, or resolves
   `@saci/*` to the main checkout and fails on unrelated symbols (G-NODE-2).
   Report this at every Pause 3 instead, expecting `0` against both the branch
   diff and the staged set:

   ```bash
   git diff --name-only main..HEAD | grep -c '^packages/'
   ```

   `core.hooksPath` is unset in this clone, so the G-R8 hook never fires —
   absent, not bypassed. Never `--no-verify`.

4. **Every replacement is specified verbatim below.** Write replacement text
   exactly; in a repair table, change exactly the span named and nothing else
   on the line. If the text on disk does not match a "current" quote, **STOP
   and report** — do not reconcile by judgment.

   *Verbatim means wording, not whitespace* (errata E4). Line-wrapping follows
   the target file's own convention: hard-wrap where the file hard-wraps, one
   long line where its neighbours are long lines. The rule exists to stop the
   text being paraphrased or "improved", not to freeze column positions.

5. **Do not renumber, retire, or add an `M-R` rule.** The namespace stays
   `M-R1`–`M-R15` (`docs/PROCESS_MAP.md` §8): four rewritten in place, three
   given phrase-level repairs.

6. **Do not reuse the Edit 4 sweep from brief 049.** Its `grep -v` filters
   matched line *content* instead of path and hid a real dangling pointer (the
   closer's finding at `MENTOR_BRIEF.md:211`). Edit 10's sweep anchors on
   `^\./path/` and enumerates every excluded surface.

### Conventions

- English on every file this brief touches except `harness/workflows/*.md`,
  which is the human-edited interface and stays pt-BR — COPIAR blocks included
  (R9 as this brief rewrites it).
- Commit type `docs`; scopes drawn from those already in use
  (`skills`, `harness`, `explorations`, `tasks`) or omitted.
- Commit verbs come from the allowlist in
  `.claude/skills/pre-commit-self-audit/SKILL.md`; the choice among them is
  semantic, not convenience.

### Architectural decisions already made (do not revisit)

#### D1 — The sweep is a full live-surface repair, not the note's literal A2 list

The note's A2 row names four surfaces. Three more documents assert the
chat-Mentor doctrine and go false the day this brief merges —
`docs/PROCESS_MAP.md`, `docs/GIT_WORKFLOW.md`, and `AGENT_PLAYBOOK.md`'s
Related-documents table (outside chapter 6) — and four more lines sit inside
`MENTOR_BRIEF.md` but outside the sections the note named: the header, M-R2,
M-R3, M-R10. All are repaired here.

The precedent is 049's Edit 4, which repaired every pointer its deletions
broke; its single escape became the closer's only finding.
`docs/PROCESS_MAP.md:73` matters most — a literal mirror of the false R9
sentence this brief fixes.

#### D2 — `npm test` leaves the Mentor's read policy

Section 5 of the skill lists it among the non-mutating commands a Mentor
session may run; in a worktree it yields a vacuous green (G-NODE-2). Removed,
not caveated — the Mentor has no use for a result that needs interpreting
before it means anything.

#### D3 — M-R13 covers both lanes

D8 collapses the four modes into two axes, and neither axis describes an
Orchestrator session — yet chapter 6 says an Orchestrator session opens with
the M-R13 declaration. M-R13 is rewritten in two parts: the Mentor's axes, and
a clause for operational sessions declaring their operational mode instead.
Two rules in two files is the divergence this repo already paid for once, when
the commit-verb allowlist was collapsed to a single source on 2026-05-28.

#### D4 — `docs/explorations/README.md` is the SSOT for the disposition set

The five dispositions are enumerated twice today: the skill's section 8, and
PASSO 3 of `close-mentor-session.md`. The state lives on the note, so the
notes' contract owns it — and that contract is canonical `docs/`, not
`harness/`.

- `docs/explorations/README.md` — enumerates. Canonical.
- `close-mentor-session.md` — keeps its copy; it is a paste-ready script and
  stripping the list would make the paste unusable. **Not edited here.**
- The skill's section 8 — the redundant middle copy, neither contract nor
  script. Becomes a pointer, per the skill's own section 2 principle.
- M-R14 — points, does not enumerate.

#### D5 — `MENTOR_BRIEF.md` owns behavior; the skill owns mechanics

The skill states it "carries session mechanics only" and "restates no behavior
rule". Held in both directions: the rewritten M-R rules restate no read policy,
write gate, forbidden-command list or no-subagents rule, and the skill gains no
behavior rule. The one existing overlap (M-R12's redirect against the skill's
section 4 statement 4) is left as found — narrowing it is not this brief's job
and neither file is wrong.

#### D6 — The cache-swap ritual dies with chat

M-R14 says the claude.ai project-knowledge cache-swap "serves only the chat
(Mentor) surface". With chat retired it has no consumer, yet two live workflows
still prescribe it: `close-task.md` step 2 of "Limpeza pós-merge", and a
prerequisite bullet in `audit-merge.md`. Both repaired in Edit 7. Recorded as a
decision because it surfaced *after* the owner ruled on D1's scope, and was
accepted at the write gate rather than folded in silently.

#### D7 — Three registration gaps repaired in passing

Each sits on a line this brief already edits, and each is a factual error:
`CLAUDE.md` "Related Documents" omits `.claude/skills/mentor-mode/`;
`docs/PROCESS_MAP.md` §3's tree has the same omission; and `AGENT_PLAYBOOK.md`
says `brief-validator` audits "10 mechanical checks" when it is 11 since C11
(open since 048, F3). None expands the file set. If any does not match the text
quoted in its Edit, **STOP and report** rather than hunting for the equivalent.

#### D8 — Nothing here changes the identifier convention

`docs/PROCESS_MAP.md` §7 and its three naming facts describe `NNN` and the
three-source P4 as current. They are current; this brief leaves them exactly as
found. Brief C (052) owns that cutover, and editing it here would buy the
rewrite twice — the reason this brief runs before C.

## Done criteria

### Edit 1 — Verify the brief on disk

The Orchestrator pre-saved this brief to `docs/tasks/050-mentor-doctrine/brief.md`
and committed it as commit #1 before the executor was invoked (caminho B). The
executor **verifies and does not re-commit**.

- [ ] `git log --oneline main..HEAD` shows exactly one commit,
      `docs(tasks): add brief for 050-mentor-doctrine`
- [ ] `docs/tasks/050-mentor-doctrine/brief.md` exists and its first line is
      `# Brief: 050 — The Mentor doctrine`
- [ ] `git status` is clean
- [ ] Current branch is `docs/mentor-doctrine`

If any check fails, **STOP and report**. Do not regenerate the brief from
memory, do not re-stage, do not re-commit. Begin work at Edit 2.

### Edit 2 — Rewrite the Mentor doctrine in `docs/MENTOR_BRIEF.md`

Nine changes in one file. Line numbers are as of base `418da64` and are
orientation only — match on the quoted text.

#### 2a. The file header (line 3)

Current:

```
> **For an AI agent in chat (claude.ai or similar):** read this in full before any reply in this conversation.
```

Replacement:

```
> **For an AI agent in a Mentor session (Claude Code):** read this in full before any reply in this session.
```

Then, after the existing line 5 (`> Pair it with 'CLAUDE.md' …`), append one
line to the same blockquote:

```
> Session mechanics — how a Mentor session opens, what it may read, what it may write, how it closes — are in `.claude/skills/mentor-mode/SKILL.md`. This file owns behavior; that one owns mechanics; neither restates the other.
```

#### 2b. §2, the verb-allowlist bullet

Find the sentence ending `…four rejected with substitutions ('record'→'document', 'ignore'→'add', 'clean'→'remove', 'reduce'→'refactor').` and append, inside the same bullet:

```
    `start` was added 2026-08-04 (PR #117), after
    `.claude/agents/executor.md` was found prescribing
    `chore(state): start <NNN>-<slug>` verbatim while the SSOT omitted the
    verb.
```

Do not alter the "Five verbs added on this date" count — it records 2026-05-28.

#### 2c. M-R2 (line 185)

Replace the trailing sentence only.

| Current | Replacement |
|---|---|
| `Mirror this in chat: outline the approach, get an "ok", then go.` | `Mirror this in conversation: outline the approach, get an "ok", then go.` |

#### 2d. M-R3 (line 187) — full replacement

```
**M-R3 — Pause-3 before commit.** A Mentor session never commits
(`.claude/skills/mentor-mode/SKILL.md` §6), so this rule survives as the
Mentor's half of the mirror `R16` = `M-R3` rather than as an instruction to
follow: when a commit is under discussion, the presentation the owner expects
is `git status`, `git diff --stat`, and the proposed message, followed by
explicit approval. The session that shows it is an Orchestrator or executor
session.
```

#### 2e. M-R10 (line 201) — full replacement

```
**M-R10 — Operate in pt-BR in session, English on the agent-consumed dev surface; the `harness/` human-edited interface may be pt-BR.** Replies, plans, summaries, walkthroughs: pt-BR. Anything written to disk on the agent-consumed dev surface (code, commits, canonical docs, `docs/tasks/**`, `docs/explorations/**`, branch names): English. The human-edited interface inside `harness/` may be pt-BR — the init prompts, the workflow prose, and the `--- COPIAR ---` blocks themselves, which are pasted into a session where pt-BR is already mandated. The three-surface split is canonical in `CLAUDE.md` R9; this rule mirrors it for the Mentor lane. UI strings are bilingual EN + pt-BR via the i18n layer.
```

#### 2f. M-R12 (line 205) — full replacement

```
**M-R12 — Stay in the Mentor lane: conceptual only.** The Mentor lane is a Claude Code main session of its own — opened via `harness/workflows/setup-mentor.md`, governed by `.claude/skills/mentor-mode/SKILL.md`, one session and one role. It is the conceptual surface: learning, pre-task exploration, meta-discussion about how the project is run. Task modeling, the orchestrator gate, and operational rulings belong to the **Orchestrator** (`docs/AGENT_PLAYBOOK.md` chapter 6). Coding, editing and running commands belong to the executor subagent; brief authoring belongs to the planner, or to the Orchestrator via caminho B. If asked to model a task, issue an operational ruling, write a brief, or edit code, redirect to an Orchestrator session instead of absorbing the work — however small the request looks.
```

#### 2g. M-R13 (line 209) — full replacement

```
**M-R13 — Declare identity and mode before substantive action.** Before any non-trivial response, declare in one line: (a) who the owner is, per §1, and (b) the mode.

In a **Mentor session** the mode is one of two axes: a session **with** a topic, which produces or updates exactly one note under `docs/explorations/`, or a session **without** one, which produces no artifact at all. The four labels of §8 — mentoring, code review by reading, continuing a conceptual thread, exploring possibilities — survive as *opening intent*, not as behavior classes. They say what the owner came for; they do not switch the session into a different mode of operation.

In an **Orchestrator session** the axes do not apply. The declaration names the operational mode instead: task modeling (pipeline or caminho B), plan or brief review at the orchestrator gate, or resuming a paused task. `docs/AGENT_PLAYBOOK.md` chapter 6 reuses this rule for its opening sequence rather than defining a second one.

If the opening message is ambiguous about the owner's intent or about the mode, ask before acting. Guessing the mode is the most common way either session type goes wrong.
```

#### 2h. M-R14 (line 211) — full replacement

```
**M-R14 — Session-close ritual: dispositions, not a recap.** When the owner signals the end of a Mentor session — explicitly ("encerrar", "fechar sessão") or through detected signals followed by confirmation — run `harness/workflows/close-mentor-session.md`, which is the authority on the close. The ritual proposes a **disposition** for every note the session touched, drawn from the closed set defined in `docs/explorations/README.md`. The owner ratifies; the Mentor writes the ratified status and never the proposed one; every transition is dated; nothing is ever deleted. A session that had no topic says so in one line and ends.

The Mentor recap is **retired**, and with it the project-knowledge cache-swap: the session reads the repo directly, so there is nothing to re-upload. Nothing is saved to `docs/sessions/`; the topic note is the session's only artifact.

Transport is not the Mentor's. The session finishes at the write gate's read-back, with the note on disk, and reports in one line what is waiting. Branch, commit, push and PR are the owner's or an Orchestrator session's. If a code task is paused in another session, run `pause-task.md` there first — code before concept.
```

#### 2i. M-R15 (line 213) — full replacement

```
**M-R15 — Mentor produces prose and notes, not operational artifacts.** The Mentor's output is decisions, context, scope, out-of-scope items and references — carried in conversation and, when the session has a topic, in one exploration note.

The old ~50-line artifact-size signal is retired. It predates the note as a first-class Mentor artifact and would now fire on every substantive one. What replaces it is **shape, not length**: a Mentor artifact that specifies Edits, exact paths, commit subjects or verification checkboxes is the Mentor doing the planner's work, at any size. Stop and hand off.

Caminho B briefs — doctrinal, pipeline-modifying, bootstrap — are authored by the Orchestrator under the write gate. The Mentor contributes conceptual groundwork at most (`docs/AGENT_PLAYBOOK.md` chapter 6).
```

The note above M-R13 about exceeding the 8–12 guideline is **kept unchanged**.

Verification for Edit 2:

- [ ] `grep -c 'claude\.ai' docs/MENTOR_BRIEF.md` returns `0`
- [ ] `grep -niE '\bchat\b' docs/MENTOR_BRIEF.md` returns nothing
- [ ] `grep -c '^\*\*M-R' docs/MENTOR_BRIEF.md` returns `15`
- [ ] `grep -c 'mentor-mode' docs/MENTOR_BRIEF.md` returns at least `3`
- [ ] `grep -c 'promoted to brief' docs/MENTOR_BRIEF.md` returns `0` — M-R14
      points at the set, it does not enumerate it (D4). **True only at this
      point in the run** (errata E7): Edit 3c reintroduces one occurrence in
      §8's blockquote, which mentions a single value rather than enumerating
      the set and is therefore consistent with D4. Re-running this checkbox
      after Edit 3 correctly returns `1`
- [ ] The §2 allowlist bullet contains both `2026-05-28` and `2026-08-04`

Commit: `docs: migrate the Mentor doctrine to the Claude Code lane`

### Edit 3 — Rewrite `docs/MENTOR_BRIEF.md` §5, §7 and §8

Same file, separate commit: sections rather than rules.

#### 3a. §5, the Language bullet

Current:

```
- **Language:** pt-BR in chat. English-only when generating any dev-surface file (code, commits, docs, branches). Bilingual EN + pt-BR for UI strings, routed through the i18n layer.
```

Replacement:

```
- **Language:** pt-BR in session replies. English-only when writing any agent-consumed dev-surface file (code, commits, canonical docs, `docs/tasks/**`, `docs/explorations/**`, branch names). `harness/` is the human-edited interface and may be pt-BR, `--- COPIAR ---` blocks included. Bilingual EN + pt-BR for UI strings, routed through the i18n layer.
```

#### 3b. §7, the Related documents table

Three rows are corrected and three are added. Leave every other row untouched,
and keep the existing row order; new rows go where indicated.

| Current row | Action |
|---|---|
| `\| 'docs/MENTOR_BRIEF.md' \| Mentor agent (Claude in chat) — this file \|` | replace the audience cell with `Mentor session (Claude Code) — this file. Behavior, not mechanics` |
| `\| 'docs/AGENT_PLAYBOOK.md' \| The user — the Orchestrator role and the role-based pipeline; Chapter 6 defines the five roles \|` | replace `five roles` with `six roles` |
| `\| '.claude/agents/' \| The orchestration subagents (planner, brief-validator, executor) invoked by the main session acting as Orchestrator \|` | replace `(planner, brief-validator, executor)` with `(planner, brief-validator, executor, closer)` |

Add, immediately after the `docs/MENTOR_BRIEF.md` row:

```
| `.claude/skills/mentor-mode/SKILL.md` | Mentor session mechanics — opening, read and write policy, close |
| `harness/workflows/setup-mentor.md`, `close-mentor-session.md` | The user — opening and closing a Mentor session |
```

Add, immediately after the `docs/GOTCHAS.md` row:

```
| `docs/explorations/README.md` | The note authority contract and the disposition set |
```

#### 3c. §8 — full replacement of the section

Replace everything from the `## 8. Context to load per session type` heading
through the end of the file (the fenced pt-BR starter snippet included) with:

```
## 8. Context to load per session

A Mentor session runs on two axes, not four modes (M-R13). What to load varies
by topic, not by axis.

| Always load | Add when relevant |
|---|---|
| `CLAUDE.md`, this file in full, `.claude/skills/mentor-mode/SKILL.md` | The matching note in `docs/explorations/` when the topic has one; `docs/GOTCHAS.md` plus the code under review for a read-through; the newest recaps in `docs/sessions/` when continuing a thread; topic-specific docs otherwise |

Load only what is needed — oversharing dilutes attention. The full reading
order for any role, this one included, is `docs/PROCESS_MAP.md` §2.

> **On task modeling:** brief authoring lives in an Orchestrator session — the
> planner via the pipeline, or the Orchestrator via caminho B under the write
> gate (`docs/AGENT_PLAYBOOK.md` chapter 6). The Mentor lane hosts only the
> conceptual work that *precedes* it. When an exploration stabilizes into
> buildable shape it moves to an Orchestrator session, and the note's
> disposition records the handoff as `promoted to brief <id>`.

### Opening a session

The paste-ready opener lives in `harness/workflows/setup-mentor.md`, which is
its single source. It is pt-BR because the session operates in pt-BR (M-R10).
Closing runs `harness/workflows/close-mentor-session.md` (M-R14).
```

Verification for Edit 3:

- [ ] `docs/MENTOR_BRIEF.md` ends with the line
      `Closing runs \`harness/workflows/close-mentor-session.md\` (M-R14).`
- [ ] `grep -c 'Default starting prompt' docs/MENTOR_BRIEF.md` returns `0`
- [ ] `grep -c 'Olá. Estou continuando o projeto Saci' docs/MENTOR_BRIEF.md`
      returns `0` — the duplicated starter snippet is gone
- [ ] `grep -c 'six roles' docs/MENTOR_BRIEF.md` returns `2` (errata E1) — 3b's
      corrected `AGENT_PLAYBOOK.md` row, plus the `PROCESS_MAP.md` row that
      already said "six roles" in `main` and is not touched by this brief
- [ ] `grep -niE '\bchat\b|claude\.ai' docs/MENTOR_BRIEF.md` still returns
      nothing
- [ ] The three added §7 rows are present:
      `grep -c 'mentor-mode/SKILL.md'`, `grep -c 'close-mentor-session.md'` and
      `grep -c 'explorations/README.md'` each return at least `1`
- [ ] §8 holds exactly one table, of three lines:
      `sed -n '/^## 8\./,$p' docs/MENTOR_BRIEF.md | grep -c '^|'` returns `3`

Commit: `docs: update the Mentor brief sections for the two-axis lane`

### Edit 4 — Update `docs/AGENT_PLAYBOOK.md` chapter 6

Six changes.

#### 4a. Chapter 6 opening (line 234)

| Current span | Replacement |
|---|---|
| `Chat (claude.ai) is the conceptual surface — it hosts the Mentor role and stays out of the operational loop entirely.` | `The Mentor is its own main session and the conceptual surface — it stays out of the operational loop entirely.` |

#### 4b. The six-roles table, Mentor row (line 240)

Current:

```
| **Mentor** | Chat (claude.ai) — the conceptual surface | Learning, pre-task exploration, meta-discussions. No gate, no task modeling, no operational rulings. |
```

Replacement:

```
| **Mentor** | Claude Code — its own main session | Learning, pre-task exploration, meta-discussion. Writes only `docs/explorations/`. No gate, no task modeling, no operational rulings, no subagents. |
```

#### 4c. A new `### The Mentor` subsection

Insert immediately **before** the existing `### The Orchestrator` heading:

```
### The Mentor

The Mentor is a main session like the Orchestrator, not a subagent and not an
Orchestrator mode — one session, one role. It is opened in Plan mode via
`harness/workflows/setup-mentor.md`, which invokes
`.claude/skills/mentor-mode/SKILL.md`; that skill carries the session mechanics
and `docs/MENTOR_BRIEF.md` carries the behavior.

Read is wide: any file in the repo, plus non-mutating shell. Write is narrow:
`docs/explorations/` only, through the write gate, and nothing else — the
Mentor runs no mutating git and invokes no subagent. It finishes with the note
on disk; branch, commit, push and PR are yours or an Orchestrator session's.
The restriction is doctrine, not enforcement — the permission layer has no
per-role condition, and the skill's section 7 says so plainly.

Sessions close by proposing a disposition for each note touched, which you
ratify (`docs/MENTOR_BRIEF.md` M-R14). There is no Mentor recap.
```

#### 4d. Recap policy (line 332 and the bullet at line 334)

| Current | Replacement |
|---|---|
| `Three roles produce session recaps; three produce none:` | `Two roles produce session recaps; four produce none:` |
| `- **Mentor** (chat sessions): transport unchanged — the recap travels on its own 'docs/' branch + PR.` | `- **Mentor**: no recap. The session's only artifact is the topic note under 'docs/explorations/', which travels on its own 'docs/<topic>' branch and PR — created by you or by an Orchestrator session, never by the Mentor ('docs/MENTOR_BRIEF.md' M-R14).` |

Also in that section, the bullet reading `- **planner**, **brief-validator**
and **closer**: no recaps.` is left unchanged — the arithmetic of "four produce
none" is Mentor plus those three.

#### 4e. "When NOT to use the pipeline" (line 362)

| Current span | Replacement |
|---|---|
| `belongs on the conceptual surface first (Mentor, in chat); only after the shape stabilizes` | `belongs in a Mentor session first; only after the shape stabilizes` |

#### 4f. The Related documents table (lines 384 and 389)

| Current | Replacement |
|---|---|
| `\| 'docs/MENTOR_BRIEF.md' \| Behavioral rules for the mentor agent (Claude in chat) \|` | `\| 'docs/MENTOR_BRIEF.md' \| Behavioral rules for the Mentor session (Claude Code) \|` |
| `\| '.claude/agents/brief-validator.md' \| Brief-validator subagent — audits briefs with 10 mechanical checks \|` | `\| '.claude/agents/brief-validator.md' \| Brief-validator subagent — audits briefs with 11 mechanical checks \|` |

Add, immediately after the `.claude/skills/pre-commit-self-audit/` row:

```
| `.claude/skills/mentor-mode/` | Mentor session mechanics (skill invoked at session open) |
```

Verification for Edit 4:

- [ ] `grep -niE 'claude\.ai' docs/AGENT_PLAYBOOK.md` returns nothing
- [ ] `grep -ncE '\bchat\b' docs/AGENT_PLAYBOOK.md` returns `5`, and each is a
      pre-existing generic use of the word: lesson #15, lesson #7, the two in
      "Subagent Pause transport", and "one-line chat message" under "When NOT
      to use the pipeline". None asserts where the Mentor runs. A sixth hit is
      a **STOP**
- [ ] `grep -c '### The Mentor' docs/AGENT_PLAYBOOK.md` returns `1`
- [ ] `grep -c '10 mechanical checks' docs/AGENT_PLAYBOOK.md` returns `0`
- [ ] `grep -c 'Two roles produce session recaps' docs/AGENT_PLAYBOOK.md`
      returns `1`
- [ ] Chapters 1–5 are untouched: `git diff main..HEAD -- docs/AGENT_PLAYBOOK.md`
      shows no hunk before the line `## Chapter 6`, except the three
      Related-documents hunks at the end of the file (errata E3) — 4f is two
      replacements plus one addition, so three is the correct result

Commit: `docs: update playbook chapter 6 for the Mentor main session`

### Edit 5 — Rewrite the contract in `docs/explorations/README.md`

Four changes. The file's `## What this folder is` section and the
`drive-oauth.md` seed example are **kept unchanged**.

#### 5a. The authority blockquote at the top

Current:

```
> **Authority: lowest.** Nothing in this folder is a commitment, a spec,
> or an instruction. If a note here conflicts with a brief, `CLAUDE.md`,
> `MENTOR_BRIEF.md`, or a session recap, the note loses — always.
```

Replacement:

```
> **Authority: lowest.** A note may record decisions the owner closed in
> session, but recording them confers no implementation authority. If a note
> conflicts with a brief, `CLAUDE.md`, `MENTOR_BRIEF.md`, `AGENT_PLAYBOOK.md`,
> `GIT_WORKFLOW.md`, or a session recap, the note loses — always
> (`docs/PROCESS_MAP.md` §9).
```

#### 5b. Rules 1 and 3 under `## Rules for agents`

| Current | Replacement |
|---|---|
| `1. **Never implement from a note.** Notes contain possibilities, not decisions. Implementation authority comes only from a brief.` | `1. **Never implement from a note.** A note records what was explored and, often, what the owner decided while exploring. Neither is a mandate: implementation authority comes only from a brief.` |
| `3. **Do not "fix" notes during unrelated work.** Notes are updated in Mentor sessions (mode: exploring possibilities) and committed via caminho B, or amended by a brief that explicitly scopes them.` | `3. **Do not "fix" notes during unrelated work.** Notes are written and updated in a Mentor session, through the write gate, or amended by a brief that explicitly scopes them. The Mentor writes the file and stops; transport is the owner's or an Orchestrator session's.` |

Rules 2 and 4 are unchanged.

#### 5c. A new `## Status and dispositions` section

Insert immediately **before** the existing `## File contract` heading:

```
## Status and dispositions

This folder owns the state of each possibility; `docs/ROADMAP.md` projects it.
The pattern is the product's own doctrine, applied to documentation: one
surface holds state, the others read from it. A hand-maintained index here
would be the second registry this contract exists to prevent — the ROADMAP
points at the folder, not at a list of its files.

Every note carries exactly one disposition, at note level, drawn from this
closed set. **This list is the single source; anything else that names a
disposition points here.**

| Disposition | Meaning | Required with it |
|---|---|---|
| `open` | live, still being explored | — |
| `candidate` | shaped enough to become a brief | — |
| `deferred` | not now | a declared trigger |
| `discarded` | will not happen | a reason |
| `promoted to brief <id>` | a brief now carries it | the brief's id |

Four invariants:

- **The owner ratifies.** A Mentor session *proposes* a disposition at close
  (`docs/MENTOR_BRIEF.md` M-R14); the status written is the ratified one, never
  the proposed one.
- **Every transition is dated,** in the note's `## Changelog`.
- **Nothing is deleted.** A discarded note stays, carrying its reason. The
  record of the thinking is the point.
- **Split when an item diverges.** Status lives at note level, so an internal
  item whose disposition diverges from its note becomes its own note.
```

#### 5d. `## File contract` and `## Lifecycle`

In `## File contract`, replace the fenced header block:

```
Status: exploration — possibilities only, NOT a commitment or spec
Origin: <mentor session date(s), source documents>
Roadmap link: <parking lot entry | pending decision # | none>
```

with:

```
Status: exploration — no implementation mandate
Disposition: <open | candidate | deferred | discarded | promoted to brief <id>> — <date>
Origin: <Mentor session date(s), source documents>
Roadmap link: <parking lot entry | pending decision # | none>
```

In the paragraph below it, replace `When a topic graduates into a brief, add a
status line ("promoted to brief NNN — <date>") — never delete the note; it
remains the historical record of the thinking.` with `When a topic graduates
into a brief, the disposition becomes 'promoted to brief <id>' with its date —
the note is never deleted; it remains the historical record of the thinking.`

Replace the whole `## Lifecycle` section, its trailing claude.ai
project-knowledge paragraph included, with:

```
## Lifecycle

Mentor session (a topic is in play) → note authored or updated through the
write gate → disposition proposed at close and ratified by the owner → the
owner or an Orchestrator session carries the file to a `docs/<topic>` branch
and its own PR → consumed as brief Context when the topic activates →
disposition becomes `promoted to brief <id>`.

The Mentor never runs the transport step, and never opens the brief.
```

Verification for Edit 5:

- [ ] `grep -c 'possibilities, not' docs/explorations/README.md` returns `0`
- [ ] `grep -c 'claude\.ai' docs/explorations/README.md` returns `0`
- [ ] All five dispositions appear: `grep -cE 'open|candidate|deferred|discarded|promoted to brief' docs/explorations/README.md` returns at least `5`
- [ ] `grep -c '## Status and dispositions' docs/explorations/README.md`
      returns `1`
- [ ] `grep -c 'drive-oauth.md' docs/explorations/README.md` returns `1` — the
      seed example survived
- [ ] The three existing notes still parse against the contract: each of
      `desktop-ui-host.md`, `drive-oauth.md`, `mentor-lane-and-task-identity.md`
      has a `Status:` line and a `## Changelog`. If a note lacks
      `Disposition:`, that is **expected and not repaired here** — the contract
      applies forward; report which ones lack it, do not edit them

Commit: `docs(explorations): update the note authority contract`

### Edit 6 — Fix the two false claims in `CLAUDE.md`

#### 6a. R9, the agent-consumed bullet

Remove the trailing sentence. Current bullet text ends with:

```
Includes any block inside `harness/` that produces canonical output — e.g. the `--- COPIAR ---` blocks inside `harness/workflows/*.md` are pasted into the agent as English instructions, so those blocks are English even though the surrounding usage notes are pt-BR.
```

Delete that sentence entirely. The bullet now ends at `…log/console messages.`

The quote above was corrected as errata E5: it originally read
`…workflows/*.md`, which are pasted…`, with a comma and a `which` that the file
on disk does not carry. The wrong version was transcribed from the copy of
`CLAUDE.md` loaded into the authoring session's context rather than read from
disk, and it produced a STOP mid-run. **A "current" quote is read from the
file, never from a context copy of it.**

#### 6b. R9, the human-edited bullet

Current:

```
- *Human-edited interface* (pt-BR is acceptable): the prompts in `harness/init/*.md`, `harness/workflows/setup-mentor.md`, `harness/workflows/README.md`, and the prose around `--- COPIAR ---` blocks in `harness/workflows/`. Rationale: the user reads, copies, and customizes these directly; pt-BR reduces friction for the user without affecting agent quality, because these files are typically pasted into chat (where M-R10 already mandates pt-BR).
```

Replacement:

```
- *Human-edited interface* (pt-BR is acceptable): everything under `harness/` — the prompts in `harness/init/*.md`, the workflow files in `harness/workflows/`, their `README.md`, and the `--- COPIAR ---` blocks themselves. Rationale: the user reads, copies, and customizes these directly, and every block lands in a session where M-R10 already mandates pt-BR — so pt-BR reduces friction without affecting agent quality. This bullet was corrected on 2026-08-04 (brief 049, D4): it previously claimed the COPIAR blocks were English, while every one on disk was pt-BR, including the `setup-orchestrator.md` block the owner pastes to open an Orchestrator session.
```

#### 6c. The `Related Documents` gloss

| Current | Replacement |
|---|---|
| `- 'docs/MENTOR_BRIEF.md' — the conceptual Mentor surface (chat): learning, pre-task exploration, meta-discussion` | `- 'docs/MENTOR_BRIEF.md' — the Mentor lane, its own Claude Code main session: who the owner is and how the conceptual surface behaves (M-R*)` |

Add, immediately after the `.claude/skills/pre-commit-self-audit/` line in the
same list:

```
- `.claude/skills/mentor-mode/` — session mechanics for the Mentor lane; invoked at the open of a Mentor session
```

Verification for Edit 6:

- [ ] `grep -c 'those blocks are English' CLAUDE.md` returns `0`
- [ ] `grep -c 'mentor-mode' CLAUDE.md` returns `1`
- [ ] `grep -niE 'Mentor surface \(chat\)' CLAUDE.md` returns nothing
- [ ] No rule, anti-pattern or exception was added, removed or renumbered:
      `grep -cE '^\*\*R[0-9]+' CLAUDE.md` = `25`,
      `grep -cE '^\*\*A[0-9]+' CLAUDE.md` = `8`,
      `grep -cE '^\*\*E[0-9]+' CLAUDE.md` = `4`

Commit: `docs: fix the R9 language claim and the Mentor gloss in CLAUDE.md`

### Edit 7 — Repair the remaining chat-Mentor pointers

Three files, all one-line or one-span changes.

#### 7a. `docs/PROCESS_MAP.md`

| Line | Current span | Replacement |
|---|---|---|
| §2 Tier 1 table | `\| Mentor (chat) \|` | `\| Mentor (its own Claude Code main session) \|` |
| §2 Tier 1 table, same row | `'docs/MENTOR_BRIEF.md' in full, then its §8 table for what else to load` | `'docs/MENTOR_BRIEF.md' in full, '.claude/skills/mentor-mode/SKILL.md', then its §8 table for what else to load` |
| §3 tree | `MENTOR_BRIEF.md              who the owner is, how the chat lane behaves (M-R*)` | `MENTOR_BRIEF.md              who the owner is, how the Mentor lane behaves (M-R*)` |
| §3 tree | `  skills/                      brief-template, pre-commit-self-audit` | `  skills/                      brief-template, pre-commit-self-audit, mentor-mode` |
| §3 language split | `'harness/' is human-edited and may be pt-BR — except the '--- COPIAR ---' blocks inside 'harness/workflows/*.md', which are pasted into an agent and are English.` | `'harness/' is human-edited and may be pt-BR, the '--- COPIAR ---' blocks inside 'harness/workflows/*.md' included.` |
| §3 language split, next sentence | `Chat replies to the owner are pt-BR` | `Session replies to the owner are pt-BR` |
| §4 roles table, Mentor row | `\| **Mentor** \| chat (claude.ai) \| nothing — produces prose \|` | `\| **Mentor** \| Claude Code — its own main session \| 'docs/explorations/' only, via the write gate \|` |
| §8 namespaces table | `\| 'M-R1'–'M-R15' \| chat-mentor behavior rules \|` | `\| 'M-R1'–'M-R15' \| Mentor-lane behavior rules \|` |
| §13 table | `\| 'docs/MENTOR_BRIEF.md' \| who the owner is; chat-lane behavior ('M-R*') \|` | `\| 'docs/MENTOR_BRIEF.md' \| who the owner is; Mentor-lane behavior ('M-R*') \|` |

Everything else in `docs/PROCESS_MAP.md` is untouched — §7's naming table and
its `NNN` / P4 facts especially (D8).

#### 7b. `docs/GIT_WORKFLOW.md`, Related documents

| Current | Replacement |
|---|---|
| `- 'docs/MENTOR_BRIEF.md' — chat-mentor behavior; M-R3 mirrors Pause-3.` | `- 'docs/MENTOR_BRIEF.md' — Mentor-lane behavior; M-R3 mirrors Pause-3.` |

#### 7c. The cache-swap ritual (D6) and one missed surface (D1) — `harness/workflows/`

In `close-task.md`, under `## Limpeza pós-merge`, delete item **2** in full —
the `**Re-upload dos docs canônicos no project knowledge do claude.ai.**`
paragraph. Item 1 then stands alone: drop its `1. ` numbering and keep it as a
bold paragraph with its code block, so a one-item numbered list is not left
behind.

In `audit-merge.md`, under `## Pré-requisitos`:

| Current | Replacement |
|---|---|
| `- Brief original acessível (na project knowledge do Claude.ai ou\n  no checkout local).` | `- Brief original acessível no checkout local.` |

In `setup-cowork.md`, inside the `Importante:` list of its COPIAR block:

| Current | Replacement |
|---|---|
| `  arquitetural, vou usar Claude Chat (claude.ai) e voltar pra você` | `  arquitetural, vou abrir uma sessão Mentor e voltar pra você` |

The following line (`  com decisão tomada.`) is unchanged. This file was missed
when D1's surface list was enumerated: it is live, referenced from
`harness/README.md` and `harness/workflows/README.md`, and asserts the Mentor
runs in chat. Same defect class as brief 049's Edit 4 exclusion set — a
surface omitted while enumerating.

These three files are pt-BR by R9 and stay pt-BR.

Verification for Edit 7:

- [ ] The same sweep as Edit 11c, with the same exclusion set, returns nothing
      for `claude\.ai`. Corrected as errata E6: this checkbox originally swept
      `docs/` whole, with no exclusions, and therefore demanded zero across
      `docs/sessions/` and `docs/tasks/` — historical surfaces this brief
      declares are never rewritten. As written it returned 58 hits and was
      unsatisfiable. **A brief with more than one sweep defines the exclusion
      set once; the others reference it.**
- [ ] `grep -c 'mentor-mode' docs/PROCESS_MAP.md` returns at least `2`
- [ ] `git diff main..HEAD -- docs/PROCESS_MAP.md` contains no hunk touching
      `§7`, the P4 paragraph, or any line containing `NNN`
- [ ] `harness/workflows/close-task.md` has no `2.` under
      `## Limpeza pós-merge`, and no orphan `1.`
- [ ] `grep -c 'Claude Chat' harness/workflows/setup-cowork.md` returns `0`,
      and the line below the replaced one still reads `  com decisão tomada.`
- [ ] `harness/init/` and `harness/README.md` are unmodified:
      `git diff --name-only main..HEAD | grep -cE '^harness/(init/|README)'`
      returns `0`

Commit: `docs: fix the stale chat-Mentor pointers across the doc surface`

### Edit 8 — Close the 049 migration window

#### 8a. `.claude/skills/mentor-mode/SKILL.md` — delete section 9

Delete the whole `## 9. Migration note` section, heading and body. Renumber
`## 10. Hard rules` to `## 9. Hard rules`. No other section is renumbered,
because 9 was the second-to-last.

#### 8b. `harness/workflows/setup-mentor.md` — delete the migration paragraph

Inside the `--- COPIAR ---` block, delete the final paragraph in full:

```
Nota de migração: docs/MENTOR_BRIEF.md e docs/AGENT_PLAYBOOK.md capítulo
6 ainda descrevem o Mentor como papel de chat. Onde eles dizem "chat",
lê "esta sessão Mentor no Claude Code". O brief 050 reescreve os dois e
remove esta nota.
```

Delete the blank line that preceded it too, so the block ends on the
`Nenhum subagent nesta sessão…` paragraph and the closing fence follows
directly.

Verification for Edit 8:

- [ ] `grep -c 'brief 050' .claude/skills/mentor-mode/SKILL.md` returns `0`
- [ ] `grep -c 'brief 050' harness/workflows/setup-mentor.md` returns `0`
- [ ] `grep -c '^## ' .claude/skills/mentor-mode/SKILL.md` returns `9`
- [ ] `grep -c '^## 9. Hard rules' .claude/skills/mentor-mode/SKILL.md`
      returns `1`; `grep -c '^## 10' …` returns `0`
- [ ] `setup-mentor.md` still has exactly one COPIAR pair:
      `grep -c 'COPIAR' harness/workflows/setup-mentor.md` returns `2`
- [ ] Nothing else in either file changed:
      `git diff main..HEAD -- .claude/skills/mentor-mode/SKILL.md harness/workflows/setup-mentor.md`
      shows deletions plus the single renumbered heading, and no additions
      beyond it

Commit: `docs: remove the brief 049 migration notices`

### Edit 9 — Fix the Mentor read policy and the disposition duplication

Both changes are in `.claude/skills/mentor-mode/SKILL.md`. The closing sweep is
**not** here — it moved to Edit 10c so that it runs after every repair.

#### 9a. Section 5 — drop `npm test` (D2)

In the non-mutating shell list, delete the `- 'npm test'` line. Then append one
sentence to the paragraph directly below the list:

```
`npm test` is deliberately absent: in a session worktree it either matches zero
compiled tests and exits `0` on a vacuous green, or resolves `@saci/*` to the
main checkout (`docs/GOTCHAS.md` G-NODE-2). A Mentor session reads and reasons;
it has no use for a result that needs interpreting before it means anything.
```

#### 9b. Section 8 — point at the contract instead of enumerating (D4)

Replace the enumerated list and its lead-in:

```
The session proposes a **disposition** for every note it touched, drawn from
a closed set:

- `open`
- `candidate`
- `deferred` — a declared trigger is required
- `discarded` — a reason is required
- `promoted to brief <id>`

Every transition is dated, nothing is ever deleted, and the **owner
ratifies** — the Mentor writes only the status the owner ratified.
```

with:

```
The session proposes a **disposition** for every note it touched, drawn from
the closed set in `docs/explorations/README.md` — the single source for it.
Every transition is dated, nothing is ever deleted, and the **owner ratifies**:
the Mentor writes only the status the owner ratified.
```

Verification for Edit 9:

- [ ] `grep -c 'npm test' .claude/skills/mentor-mode/SKILL.md` returns `1` — the
      explanatory sentence, not a list entry. `grep -c '^- \`npm test\`'`
      returns `0`
- [ ] `grep -c 'G-NODE-2' .claude/skills/mentor-mode/SKILL.md` returns `1`
- [ ] Section 8 no longer enumerates: `grep -c '^- \`candidate\`' …` returns `0`,
      and `grep -c 'docs/explorations/README.md' …` returns at least `1`
- [ ] The five dispositions appear exactly once in the repo's live surface, in
      `docs/explorations/README.md`, plus the operational copy in
      `harness/workflows/close-mentor-session.md` that D4 preserves. That
      workflow is **not** edited

Commit: `docs(skills): drop npm test from the Mentor read policy`

### Edit 10 — Repair the last two chat-Mentor pointers, then sweep

Two one-line repairs, then the sweep that closes the task. Both files were
missed when D1's surface list was enumerated — the third such omission in this
brief, after `setup-cowork.md` and cb1's absent exclusion set. Root cause in
every case: the list was written from memory instead of derived from a search.

#### 10a. `.claude/agents/executor.md`

| Current | Replacement |
|---|---|
| `  the owner can copy it whole, in one click, into the mentor chat.` | `  the owner can copy it whole, in one click.` |

The destination is what went false, not the reason. Naming a replacement
destination would assert a fact this brief has not established, so the clause
is dropped rather than redirected.

#### 10b. `harness/workflows/gitflow-emergency-recovery.md`

| Current | Replacement |
|---|---|
| `prossiga**. Cola os outputs em chat com mentor sênior antes de` | `prossiga**. Cola os outputs numa sessão Orchestrator antes de` |
| `## Quando chamar mentor` | `## Quando chamar o Orchestrator` |

The heading row was added as errata E8, under an owner ruling taken mid-run.
Without it the section shipped with a heading promising "mentor" over a body
redirecting to an Orchestrator session — an incoherence this brief created.

The following line (`qualquer ação.`) is unchanged. Orchestrator, not Mentor:
diagnosing a git-recovery scenario is an operational ruling, which M-R12 — as
rewritten by this brief — places outside the Mentor lane. pt-BR by R9, stays
pt-BR.

#### 10c. The closing sweep

Run, from the repository root:

```bash
grep -rniE 'claude\.ai|mentor.{0,20}\bchat\b|\bchat\b.{0,20}mentor' \
  --include="*.md" . \
  | grep -vE '^\./(docs/sessions|docs/tasks|docs/explorations|harness/init|harness/skills-plan)/' \
  | grep -v '^\./harness/README.md' \
  | grep -v '^\./node_modules/'
```

Each exclusion has a stated reason: `docs/sessions/`, `docs/tasks/` and
`docs/explorations/` are the three historical surfaces, never rewritten — the
third is the one 049's sweep omitted, causing its STOP; `harness/init/` and
`harness/README.md` are the parked init task's scope; `harness/skills-plan/` is
not active. The filters anchor on `^\./path/` and match the path, not the line
content — the defect that let 049's sweep pass clean while hiding
`MENTOR_BRIEF.md:211`.

Verification for Edit 10:

- [ ] `grep -c 'mentor chat' .claude/agents/executor.md` returns `0`
- [ ] `grep -c 'Cola os outputs numa sessão Orchestrator' harness/workflows/gitflow-emergency-recovery.md`
      returns `1`, and the line after it still reads `qualquer ação.`
- [ ] The sweep returns **nothing**. Any hit is a **STOP and report**, with the
      path and line quoted — do not repair it silently

Commit: `docs: fix the last two chat-Mentor pointers`

### Edit 11 — Fix the last two R9 claims, and prove the fix

This brief carries two claims, and until this Edit only one of them was proven.
Edit 10c's sweep establishes that no live document says the Mentor runs in chat.
Nothing established that `CLAUDE.md` R9 and the repository agree about the
language of `--- COPIAR ---` blocks — 10c's pattern matches `claude.ai` and
`mentor` near `chat`, and is structurally blind to that assertion. Two live
documents still contradict the corrected R9, one of them contradicting itself.

Found by deriving the list from a search instead of enumerating from memory,
which is what the previous three omissions (`setup-cowork.md`, E6's absent
exclusion set, E8's heading) all had in common.

#### 11a. `docs/PROCESS_MAP.md` §12, item 5

| Current | Replacement |
|---|---|
| `R9. \`harness/\` prose is the only pt-BR-tolerant surface, and its \`--- COPIAR ---\` payloads are still English.` | `R9. \`harness/\` is the only pt-BR-tolerant surface, \`--- COPIAR ---\` payloads included.` |

Without this the file contradicts itself: §3, as Edit 7a rewrote it, says the
blocks are pt-BR; §12 still says English.

#### 11b. `.claude/agents/closer.md`

**Restore the file first if a previous attempt modified it:**
`git checkout -- .claude/agents/closer.md`. The "current" block below is the
text as it stands in `main@418da64`.

Current — the four lines beginning `is chat output read by the owner`:

```
is chat output read by the owner, and chat is pt-BR under M-R10. This inverts
the `harness/` pattern (pt-BR prose wrapping an English `--- COPIAR ---`
payload) for the same reason it exists there — the payload is written in the
language of its consumer.
```

Replacement:

```
is output read by the owner, and owner-facing output is pt-BR under M-R10. The
`harness/` surface is pt-BR throughout — prose and `--- COPIAR ---` payload
alike — for the same reason: text is written in the language of its consumer.
```

Four lines become three. The two preceding lines of the paragraph
(`Emit exactly this template…` and `agent-consumed surface and therefore
English…`) are unchanged.

**The analogy is dropped, not flipped** — errata E12, the worst defect of this
brief's authoring. An earlier version of 11b replaced only the polarity, giving
`English prose wrapping a pt-BR payload`. That is also false, and it made the
sentence self-contradictory: `closer.md` *is* English prose wrapping a pt-BR
payload, so it cannot invert that pattern. Measured on disk, `harness/` is
pt-BR **throughout** — every workflow's prose (`## Quando usar`, `Abrir sessão
Mentor no Claude Code`) and every COPIAR payload. It is not a mixed pattern at
all, so no inversion of it exists to name. Root cause: the polarity was flipped
from memory instead of measured against the files, inside the Edit whose whole
purpose is removing claims made that way.

#### 11c. Proving the R9 claim — directed, because it is not sweepable

This assertion cannot be proven by a repo-wide grep, and the attempt to write
one is errata **E11**. A first version matched any line mentioning both `COPIAR`
and `English`; it returned five lines, four of which state the *correct* rule —
because a correct statement of R9 must name both languages in one sentence. A
narrower version keyed on `COPIAR … are/is/were English` still matches
`CLAUDE.md:50`, which deliberately records that the old claim was false. Both
sweeps test co-occurrence, not assertion. Widening the exclusions to force a
zero would be the E6 defect committed a second time.

The proof is therefore directed. Enumerate every live line that mentions
`--- COPIAR ---` alongside a language name, and confirm by reading that none
asserts the blocks are English:

```bash
grep -rniE 'COPIAR' --include="*.md" . \
  | grep -vE '^\./(docs/sessions|docs/tasks|node_modules)/' \
  | grep -iE 'english|inglês'
```

Expected: five lines, and every one of them either states that COPIAR blocks
are pt-BR or records that the opposite claim used to be made and was wrong.
Paste the output and say, line by line, which of the two it is. **A sixth line,
or any line asserting the blocks are English, is a STOP and report.**

Verification for Edit 11:

- [ ] `grep -c 'payloads are still English' docs/PROCESS_MAP.md` returns `0` —
      §3 and §12 now make the same claim
- [ ] `grep -c 'pt-BR prose wrapping an English' .claude/agents/closer.md`
      returns `0`
- [ ] `grep -c 'English prose wrapping a pt-BR' .claude/agents/closer.md`
      returns `0` — the flipped-polarity version is also absent (E12)
- [ ] `grep -c 'pt-BR throughout' .claude/agents/closer.md` returns `1`
- [ ] The 11c enumeration returns exactly five lines, each classified in the
      report as stated above
- [ ] Edit 10c's sweep still returns nothing — this Edit must not reintroduce
      a chat-Mentor claim while fixing an R9 one

Commit: `docs: fix the last two R9 claims about COPIAR language`

### Commit sequence

1. `docs(tasks): add brief for 050-mentor-doctrine` — 46 chars *(Orchestrator's, already on the branch)*
2. `docs: migrate the Mentor doctrine to the Claude Code lane` — 57
3. `docs: update the Mentor brief sections for the two-axis lane` — 60
4. `docs: update playbook chapter 6 for the Mentor main session` — 59
5. `docs(explorations): update the note authority contract` — 54
6. `docs: fix the R9 language claim and the Mentor gloss in CLAUDE.md` — 65
7. `docs: fix the stale chat-Mentor pointers across the doc surface` — 63
8. `docs: remove the brief 049 migration notices` — 44
9. `docs(skills): drop npm test from the Mentor read policy` — 55
10. `docs: fix the last two chat-Mentor pointers` — 43
11. `docs: fix the last two R9 claims about COPIAR language` — 54

Every verb — `add`, `migrate`, `update`, `fix`, `remove`, `drop` — is in the
allowlist at `.claude/skills/pre-commit-self-audit/SKILL.md`. Every subject is
≤ 72 chars.

### Automated checks

- [ ] **Not applicable, and deliberately so.** No build, no linter, no test
      suite runs for this task. Constraint 3 governs; report the
      `grep -c '^packages/'` count of `0` in its place at every Pause 3

### Structural checks

- [ ] Every modified path is in constraint 1's list:
      `git diff --name-only main..HEAD` matched against it, one by one
- [ ] Exactly 15 files changed, this brief included
- [ ] No file was created and none deleted:
      `git diff --name-status main..HEAD | grep -cE '^[AD]'` returns `0` except
      for the brief's own `A` in commit #1
- [ ] `git diff --name-only main..HEAD | grep -c '^packages/'` returns `0`

### Behavior checks

- [ ] **A Mentor session reading only the rewritten doctrine never concludes it
      runs in chat.** Trace `MENTOR_BRIEF.md` header → M-R12 → §8: three
      independent statements place the lane in Claude Code, so no single edit
      carries the claim alone
- [ ] **An Orchestrator session still has an opening protocol.** M-R13's third
      paragraph names its three operational modes, and
      `AGENT_PLAYBOOK.md` chapter 6's "Opens with the M-R13 identity + mode
      declaration" resolves against it
- [ ] **The disposition set has exactly one canonical statement.**
      `docs/explorations/README.md` enumerates; `MENTOR_BRIEF.md` M-R14 and the
      skill's section 8 point at it; `close-mentor-session.md`'s COPIAR block
      keeps its operational copy by D4 and is not edited
- [ ] **No new duplication of behavior into the skill, or of mechanics into
      `MENTOR_BRIEF.md`** (D5): `grep -c '^M-R[0-9]' .claude/skills/mentor-mode/SKILL.md`
      returns `0`, and the rewritten M-R rules state no read policy, write gate,
      forbidden-command list or no-subagents rule
- [ ] **The R9 fix and its mirror agree.** `CLAUDE.md` R9 and
      `docs/PROCESS_MAP.md` §3 now make the same claim about COPIAR blocks:
      pt-BR

### Git checks

- [ ] Branch used: `docs/mentor-doctrine`, created from `418da64`
- [ ] No commit landed on the session's `claude/*` scaffolding branch
- [ ] Commits follow Conventional Commits (G-R3); subjects ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean at the end
- [ ] **NO** `git push` was executed; `git log origin/main..HEAD` shows every
      commit local
- [ ] No `STATE.md` created

### Process checks

- [ ] `Plan required: no` — Pause 1 skipped
- [ ] Pause 2 — the first modified file (`docs/MENTOR_BRIEF.md` after Edit 2)
      shown in full for review before proceeding
- [ ] Pause 3 before every commit — `git status`, `git diff --stat`, the
      proposed message, the `pre-commit-self-audit` output, and the
      constraint-3 count
- [ ] Every commit closed on evidence: `git log --format=%B -1` pasted verbatim
      in the turn's **final message block**, as one fenced block, confirmed
      against the approved subject. No new Pause opens while an evidence-close
      is outstanding
- [ ] Any criterion that could not be met was reported explicitly rather than
      forced

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1** — skipped (`Plan required: no`).
- **Pause 2** — after the first modified file. **Always required.**
- **Pause 3** — before each commit. **Always required.**

Under subagent transport a Pause is a STOP-and-return: stop, return the whole
presentation as one fenced block, resume only when the owner's approval is
relayed back.

In case of:

- Text on disk not matching a "current" quote → **STOP and report**. Do not
  reconcile by judgment (constraint 4).
- A sweep hit in Edit 10 → **STOP and report** with the path and line.
- An unrelated defect found → report, do not fix.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

- Every change is specified with exact replacement text or an exact
  current→replacement span, and every Edit carries verification checkboxes.
- All decisions are closed (D1–D8) with the owner, in the Orchestrator session
  that authored this brief.
- Judgment calls have explicit STOP fallbacks: text mismatch (constraint 4),
  sweep hit (Edit 10), registration gap not matching its quote (D7).
- Pause 2 and Pause 3 remain required regardless — Lesson #6.

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules, R9 especially
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — G-NODE-2 in particular (constraint 3)
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pauses), Lesson #6, Chapter 6
5. `.claude/skills/pre-commit-self-audit/SKILL.md` — Pause-3 self-audit
6. `docs/explorations/mentor-lane-and-task-identity.md` — decision set A, the
   source of D8, D14 and D15. **Not editable by this brief**
7. `docs/sessions/2026-08-04-orchestrator-049-mentor-vehicle.md` and
   `docs/sessions/2026-08-04-executor-049-mentor-vehicle.md` — what 049 left
   marked for this brief, and the two rulings that live only there

## Expected output (end of session)

1. Branch name and `git log --oneline main..HEAD` — commit count, ordered
2. `git diff --stat main...HEAD` — line counts per file
3. Any verification checkbox that could not be met, with explanation
4. The Edit 10 sweep result, pasted
5. Confirmation that no `git push` was executed
6. Suggested next step
