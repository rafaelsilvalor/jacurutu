# Brief: 052 — Task identifier cutover

> **Category:** L
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/task-identifier-cutover`

---

## Context

`docs/explorations/mentor-lane-and-task-identity.md` closed two decision sets on
2026-08-03 and designed four briefs. Three have merged: 049 (the Mentor vehicle,
PR #119), 050 (the doctrine, PR #122), 051 (parking lot and pending decisions
migrated into notes, PR #123). This is the fourth and last — Brief C, the
identifier cutover.

The note's decisions E1–E9 are closed. This brief implements them; it does not
reopen them. In one sentence: **a task is born under one scheme and dies under
it; the cutover governs birth, never a task in flight.**

052 is the last task born under `NNN`.

This is a caminho B brief. It rewrites `.claude/agents/planner.md` and
`.claude/agents/brief-validator.md` — the pipeline cannot audit a brief that
rewrites its own auditor (`docs/PROCESS_MAP.md` §5).

### What the sequence number costs today, measured

Two facts were measured in the Orchestrator session that authored this brief
(2026-08-07, base `9d5e1f3`), and both are new relative to the note:

**The E9 dual-acceptance window is not empty.** The note asserts (E8, E9,
2026-08-03) that no pre-cutover task is in flight, so dual-shape support "may
never be exercised". That is false as of 2026-08-07:

```
$ git log --oneline main..docs/init-six-role-bootstrap
0f93156 docs(tasks): add brief for 049-init-six-role-bootstrap

$ git diff --name-only main...docs/init-six-role-bootstrap
docs/tasks/049-init-six-role-bootstrap/brief.md
```

**Slot 049 is claimed twice.** `049-mentor-vehicle` is on `main`;
`049-init-six-role-bootstrap` is on the unmerged branch above. This is the
second recorded slot collision (the first was 035) and it is precisely the
failure mode E7 cites to justify killing the numeric protocol. Dual acceptance
**will** be exercised, and the old shape cannot be removed by this brief.

Resolving the 049 collision is out of scope — see below.

### Migration surface, remeasured

The note's §5 measured 15 convention-carrying files outside `docs/tasks/` and
`docs/sessions/` on 2026-08-03. Briefs 050 and 051 touched that surface
afterwards, so it was remeasured on 2026-08-07:

```
$ grep -rlE '<NNN>|\bNNN\b' --include='*.md' --include='*.json' . \
    | grep -vE '^\./(docs/tasks/|docs/sessions/|node_modules|\.git/)' | sort
$ grep -rlE '\bP4\b|\[0-9\]\{3\}' --include='*.md' . \
    | grep -vE '^\./(docs/tasks/|docs/sessions/|node_modules|\.git/)' | sort
```

The union is **16 files**, not 15, with hit counts from `grep -rcE`:

| File | Hits | Edit |
|---|---|---|
| `.claude/agents/planner.md` | 18 | 3 |
| `docs/PROCESS_MAP.md` | 10 | 4 |
| `.claude/skills/brief-template/SKILL.md` | 9 | 3 |
| `harness/init/07-create-brief.md` | 7 | 5 |
| `.claude/agents/executor.md` | 6 | 3 |
| `.claude/agents/brief-validator.md` | 5 | 3 |
| `docs/AGENT_PLAYBOOK.md` | 5 | 4 |
| `docs/MENTOR_BRIEF.md` | 4 | 2 |
| `harness/workflows/audit-merge.md` | 3 | 5 |
| `CLAUDE.md` | 2 | 4 |
| `docs/ROADMAP.md` | 2 | 4 |
| `harness/workflows/close-task.md` | 2 | 5 |
| `harness/workflows/setup-orchestrator.md` | 2 | 5 |
| `harness/README.md` | 1 | 5 |
| `harness/workflows/review-final-task.md` | 1 | 5 |
| `.claude/agents/closer.md` | 1 | 3 |

The note gave no file list for its 15, so the delta to 16 is **not attributable
file by file**. Only the total is known to have moved. Do not invent the
attribution.

### Hits the search returned that are deliberately NOT changed

Every one is enumerated, because a green sweep proves nothing:

- `packages/adapter-drive/src/client.ts:7`, `packages/adapter-drive/src/errors.ts:155`,
  `packages/cli/src/open-path.ts:28`, `packages/cli/src/open-path.test.ts:85`,
  `docs/tasks/046-spike-adapter-drive/drive-probe.mjs:6`,
  `docs/tasks/047-adapter-drive/drive-smoke.mjs:25` and `:61` — prose references
  to real numbered tasks (040, 046, 047). E8 keeps those identities for life.
- `CLAUDE.md:120` (E5, slots 004-006 burned in the v1→v2 pivot) and
  `docs/ROADMAP.md:310` (the same burn) — historical records. E4 stops burns
  *forward*; it does not erase the ones that happened.
- `docs/PROCESS_MAP.md:177` — "gaps are burned reserves, kept deliberately"
  describes burned **exception numbers** (`E4`), not task slots. Unrelated to
  this cutover. Leave it alone.
- `docs/MENTOR_BRIEF.md:153` — quotes the commit subject
  `chore(state): start <NNN>-<slug>` inside a historical incident account.
  Rewriting a quotation falsifies the record.
- `.claude/skills/pre-commit-self-audit/SKILL.md`,
  `.claude/skills/mentor-mode/SKILL.md`, `harness/workflows/setup-mentor.md`,
  `harness/workflows/close-mentor-session.md` — grepped explicitly, **zero**
  convention hits. Their only matches are bare `docs/tasks/**` and
  `docs/sessions/` paths, which survive the cutover unchanged.
- `docs/explorations/mentor-lane-and-task-identity.md` lines 78, 79, 96, 101
  and 121 — the note's own body. Structural check 3's exclusion is anchored on
  `docs/tasks/`, `docs/sessions/`, `node_modules` and `.git/`, so
  `docs/explorations/` is in the swept set and these five lines are returned by
  design. They stay: the note is a historical record of what was decided on
  2026-08-03, and Edit 6 scopes this brief to its header block and changelog
  while explicitly forbidding body edits. Lines 78-79 describe the recap
  foreign key under the old scheme, 96 and 101 are E3 and E8 stating the rule
  in terms of `NNN`, and 121 is the dated migration-surface measurement.
  Rewriting any of them would falsify the record rather than migrate it.

### Size note

Measured on the finished file, not estimated:

```
total 706  |  scaffolding 100  |  substance 606
```

Scaffolding is the Edit 1 block, the four check blocks, and everything from
`## Pause points` to the end — the sections carried near-verbatim from
`.claude/skills/brief-template/SKILL.md`. Those blocks span 117 lines here, but
17 of them are the authored G-NODE-2 baseline paragraph sitting inside
"Automated checks"; authored prose counts as substance wherever it lands, so
scaffolding is 100. At 606 lines of substance the brief
sits **inside** the Category L doctrinal range (350-650), and its 706-line
total sits under the ~750 guideline, so no split trigger fires and no
declaration is owed. (That range was under owner review as of brief 051; the
brief fits it either way, which is why the pending re-measurement does not
change this section.)

Worth saying anyway, since the question is the point rather than the number:
these edits could not ship as two independent PRs each closing on its own
evidence. A `planner.md` that emits a dated identifier while
`brief-validator.md` still requires three digits is a broken pipeline; a
`PROCESS_MAP.md` naming table defining `<task-id>` while the agents still say
`<NNN>` documents a convention nothing implements. The files are one another's
verification, exactly as brief 048 argued when it declined to split.

## Goal

Cut the task and recap identifier over from a sequence number to a
self-assigned date, across the 16 convention-carrying files, so that a task born
after this brief merges takes `docs/tasks/YYYY-MM-DD-slug/` and its recaps take
`docs/sessions/<session-date>-<role>-<slug>.md`. Replace the numeric P4 with a
global slug-collision check, and retire the burn as a forward concept.

Out of scope:

- **Renaming any existing folder under `docs/tasks/` or any file under
  `docs/sessions/`.** The cutover is forward-only (E3). The ~750 prose
  references measured in the note's §5 are the reason: renaming files without
  sweeping references produces 750 dangling pointers, and sweeping them means
  rewriting historical recaps, which is falsification rather than migration.
- **Correcting a numbered reference inside a historical recap or a merged
  brief.** Those record what was true on their day.
- **Resolving the 049 slot collision** on `docs/init-six-role-bootstrap`. The
  finding is recorded above as evidence; what to do about that stalled task is
  the owner's call in a separate session.
- **Removing dual-shape support.** E9 permits removal only when the last
  pre-cutover task merges, and one is alive.
- **The historical burns** (`CLAUDE.md:120`, `docs/ROADMAP.md:310`) and the
  burned-exception-number gloss (`docs/PROCESS_MAP.md:177`).
- **Any file under `packages/`.** No source code changes in this brief.
- **The validator's dead C7/C8/C11 extraction**, found while authoring this
  brief and recorded here so the executor does not fix it in passing. C7
  extracts commit subjects with `awk '/^### Commit sequence/,/^### /'`. An awk
  range tests its end pattern on the start line itself, and the heading
  `### Commit sequence` matches `^### `, so the range is **one line long** and
  yields zero subjects. C8 and C11 consume C7's output, so all three checks
  pass vacuously on every brief:

  ```
  $ for f in 048-closer-agent 050-mentor-doctrine 051-parking-pending-migration; do
      awk '/^### Commit sequence/,/^### /' docs/tasks/$f/brief.md | grep -cE '^[0-9]+\. '
    done
  0
  0
  0
  ```

  A corrected range (`/^### Commit sequence/{f=1;next} f&&/^### /{exit} f`)
  yields 7 subjects on 051. Downstream of the range bug there is a second one:
  house style backticks each subject, and C7's `sed -E 's/^[0-9]+\. //'` does
  not strip backticks, so C8's `^(feat|fix|…)` anchor would still fail once the
  range is fixed. Neither has ever fired, because 048-052 are all caminho B,
  which skips the validator.

  This is a validator-mechanics defect with no connection to the identifier,
  and fixing it changes what ships — so it is neither in scope here nor errata
  (Edit 7). It needs its own brief, and that brief should re-audit every
  merged brief against the repaired checks.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified. If anything else needs
   changing, **STOP and ask**:
   - `docs/tasks/052-task-identifier-cutover/` (this brief, and `notes.md` if
     the owner issues a mid-run ruling)
   - `docs/MENTOR_BRIEF.md`
   - `.claude/agents/planner.md`, `.claude/agents/brief-validator.md`,
     `.claude/agents/executor.md`, `.claude/agents/closer.md`
   - `.claude/skills/brief-template/SKILL.md`
   - `CLAUDE.md`, `docs/PROCESS_MAP.md`, `docs/AGENT_PLAYBOOK.md`,
     `docs/ROADMAP.md`
   - `harness/README.md`, `harness/init/07-create-brief.md`,
     `harness/workflows/audit-merge.md`, `harness/workflows/close-task.md`,
     `harness/workflows/review-final-task.md`,
     `harness/workflows/setup-orchestrator.md`
   - `docs/explorations/mentor-lane-and-task-identity.md`,
     `docs/explorations/README.md`
   - `docs/sessions/` (the two recaps, at the end)
2. Follow all rules in `CLAUDE.md`, especially R9 (language), R10 (Conventional
   Commits), R13 (never `--no-verify`), R17 (no proactive push).
3. Follow `docs/GIT_WORKFLOW.md` fully:
   - Branch `docs/task-identifier-cutover` already exists, created from
     `9d5e1f3`. **Never commit on `claude/brief-052-task-cutover-278d50`** —
     that is session scaffolding and violates R11/G-R2.
   - Conventional Commits (G-R3), no `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
   - No `STATE.md` for this task: it is single-session and the Edit map is
     fully specified, so G-R10's trigger does not fire.
4. **Never assert a count without measuring it against the file at that
   moment, and paste the command next to the number.** This brief's own counts
   were measured on 2026-08-07; re-run before relying on them.
5. **Every in-scope file list comes from a pasted search, never from memory.**
6. **Enumerate and classify every hit.** A sweep reported as clean without a
   hit-by-hit account is not evidence. When a search returns a hit that this
   brief's tables drop, re-read the pasted output hit by hit and say why.
7. **Errata that changes nothing that ships is batched into one commit at the
   end** (Edit 7), never an amend cycle per finding.

### Conventions

- `docs/**`, `CLAUDE.md` and `.claude/**` are agent-consumed: **English only**
  (R9). `harness/**` is the human-edited surface and its pt-BR prose is
  preserved — Edit 5 changes the convention inside pt-BR sentences without
  translating them.
- Commit type `docs` throughout; scopes `tasks`, `mentor`, `agents`, `harness`,
  `explorations`, or none.
- Commit verbs come from the `ALLOW=` line in
  `.claude/skills/pre-commit-self-audit/SKILL.md`, the SSOT.

### Architectural decisions already made (do not revisit)

#### D1 — The generic placeholder in prose is `<task-id>`, not `<YYYY-MM-DD>`

Both shapes coexist permanently (E3, E8, E9), so prose that says
`docs/tasks/<YYYY-MM-DD>-<slug>/` would be as wrong as prose that says
`docs/tasks/<NNN>-<slug>/` — each names one of two live schemes. Every generic
path reference becomes `docs/tasks/<task-id>-<slug>/`, and `<task-id>` is
defined **once**, canonically, in `docs/PROCESS_MAP.md` §7. Everywhere else
uses the placeholder without redefining it.

This is what keeps the brief mechanical: most of the 78 hits are one
substitution, and only six sites need authored prose.

#### D2 — P4 is rewritten in place; the ID survives

`P4` is cited from six places (`MENTOR_BRIEF.md` §3, `PROCESS_MAP.md` §5, §7
and §8, `planner.md`, `closer.md`, `setup-orchestrator.md`). Deleting it would
renumber `P5` and break every historical citation of both. P4 keeps its ID and
becomes the slug-collision protocol. This follows the repo's standing doctrine:
supersede, never delete.

#### D3 — The new P4 runs four sources, not three

`ls docs/tasks/`, `git log --oneline main`, the `CLAUDE.md` `E*` / note reserve
grep, and **`git branch -a` plus `git worktree list`**. The fourth is the source
whose absence caused the 048 structural failure and the 049 collision recorded
in Context: a slug held only on an unmerged branch is invisible to the other
three. Concurrent worktree sessions make this the normal case, not the edge.

#### D4 — Validator C1 accepts both shapes; removal is a future brief

C1's regex becomes `^# Brief: ([0-9]{3}|[0-9]{4}-[0-9]{2}-[0-9]{2}) — .+$`.
E9 allows dropping the `[0-9]{3}` alternative only when the last pre-cutover
task merges. One is alive (Context), so it stays, with a comment naming the
condition for its removal.

#### D5 — The note is promoted to `promoted to briefs 049-052`

The note produced four briefs and disposition lives at note level, so naming
only 052 would erase 049-051 from its record. `docs/explorations/README.md`
gains explicit permission for a plural `<id>` in the same Edit, so the contract
and the note do not contradict each other.

#### D6 — `harness/init/07-create-brief.md` is in scope

It bootstraps this process into a *new* repository. Left alone, it would seed
the dead scheme into every repo bootstrapped after today.

#### D7 — Historical numbered references and burns are preserved verbatim

Enumerated in Context. E4 retires the burn as a forward concept — the sentence
in `MENTOR_BRIEF.md` P4 that instructs future authors to burn superseded
reserves is deleted. The records of burns that already happened are not touched.

#### D8 — The recap role set narrows to `{orchestrator, executor}`

E2 fixes the role set, and brief 050 already retired the Mentor recap.
`docs/PROCESS_MAP.md:157` still lists `mentor` as a valid recap role; that line
becomes correct as a side effect of this Edit, not as a separate fix.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The Orchestrator pre-saved this brief to
`docs/tasks/052-task-identifier-cutover/brief.md` before invoking the executor
(caminho B). The executor verifies presence and commits.

- [ ] `git branch --show-current` returns `docs/task-identifier-cutover`
- [ ] Directory `docs/tasks/052-task-identifier-cutover/` exists
- [ ] File `brief.md` exists; first line is `# Brief: 052 — Task identifier cutover`
- [ ] `git add docs/tasks/052-task-identifier-cutover/brief.md` is staged
- [ ] Commit #1 created with the subject from the Commit sequence

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

### Edit 2 — Rewrite P4 in `docs/MENTOR_BRIEF.md`

This is the doctrinal SSOT; every other file cites it, so it lands first.

**2a.** Replace the whole `P4` bullet (currently line 184, `## 3. Observed
patterns`) with:

> - **P4 — Slug-collision verification protocol for new tasks.** A task
>   identifier is self-assigned — a birth date, nothing to look up. What must be
>   verified is that the **slug** is free, because global slug uniqueness is
>   what joins a task to its recaps once the task date and the session date
>   diverge. Before fixing a slug, consult four sources: `ls docs/tasks/` for
>   existing task folders under either scheme; `git log --oneline main` for a
>   slug that shipped but is not visible in a stale checkout; a grep for the
>   candidate slug across `CLAUDE.md` and `docs/` for one named in an `E*`
>   reserve or an exploration note; and `git branch -a` plus `git worktree list`
>   for a slug claimed only on an unmerged branch or a live worktree. The fourth
>   source is the one the old three-source numeric protocol structurally lacked:
>   it could not see slot 047 held on an unmerged branch on 2026-08-02, and on
>   2026-08-07 two tasks were found holding slot 049 at once. Concurrent
>   worktree sessions make that the normal case. If a source shows the slug
>   taken, choose another; if the sources disagree, STOP.

Note what is **absent**: the sentence about burning superseded forward reserves.
It is deleted, not reworded (E4, D7).

**2b.** In §7's table, change the two `docs/tasks/<NNN>-<slug>/` cells to
`docs/tasks/<task-id>-<slug>/`.

**2c.** Leave line 153 untouched — it quotes a commit subject inside a
historical incident account.

Verification:

- [ ] `grep -n 'P4 —' docs/MENTOR_BRIEF.md` returns exactly one line, naming
      the slug protocol
- [ ] `grep -in 'burn' docs/MENTOR_BRIEF.md` returns nothing
- [ ] `grep -n 'worktree list' docs/MENTOR_BRIEF.md` returns the P4 bullet
- [ ] `grep -n '<NNN>' docs/MENTOR_BRIEF.md` returns only line ~153, the quote
- [ ] `grep -nE '^- \*\*P5' docs/MENTOR_BRIEF.md` still matches — P5 not renumbered

Commit: see Commit sequence #2.

### Edit 3 — Cut the pipeline over (`.claude/`)

The four agents and the skill are one another's verification, so they share one
commit (D1 rationale, and the size note).

**3a. `.claude/agents/planner.md`.** Swap steps 1 and 2 so the slug is chosen
before it is verified, then rewrite both:

- **Step 1 — Choose the slug.** Current step 2's text, plus: the slug must be
  globally unique across the whole history of `docs/tasks/` (E7).
- **Step 2 — Verify the slug and form the task id (P4 — four sources).** The
  four commands of D3, one bullet each explaining what the source catches, the
  same-day ordinal-suffix rule from E5 (`-2`, applied *only* on collision), and
  the STOP form `STOP — slug resolution conflict: <details>`. The task id is
  today's date in `YYYY-MM-DD`; there is no number to compute, so the
  `printf '%03d'` line is deleted.

Steps 3-5 keep their numbers and text. Then:

- **Step 6** — `mkdir -p docs/tasks/<task-id>-<slug>`
- **Step 7** — first line becomes `# Brief: <task-id> — <Task title>`; the
  `docs/tasks/<NNN>-<slug>/` path becomes `<task-id>`
- **Step 8** — subject becomes `docs(tasks): add brief for <task-id>-<slug>`,
  with a note that a dated id makes this subject longer, so the ≤ 72-char
  `wc -L` check matters more than it used to
- **Step 9** — the `File:` line uses `<task-id>`
- **Authoring gate item 2** — retitle to "P4 evidence (slug)" and require the
  four-source check to be recorded in the brief
- **STOP conditions** — "P4 sources contradict each other" becomes "the four
  slug sources contradict each other"; the "already exists" condition now keys
  on the task directory rather than the number
- **Hard rules** — path placeholder only

**3b. `.claude/agents/brief-validator.md`.**

- C1's pattern becomes
  `grep -nE '^# Brief: ([0-9]{3}|[0-9]{4}-[0-9]{2}-[0-9]{2}) — .+$' <brief> | head -1`
- Add one sentence under the rule-to-pattern table, in the same register as the
  existing C11 paragraph, recording that C1 accepts both shapes per E9 and that
  the `[0-9]{3}` alternative is removed when the last pre-cutover task merges —
  naming `049-init-six-role-bootstrap` as the one currently keeping the window
  open
- `description`, Inputs, and the two Output-format paths use `<task-id>`

**3c. `.claude/agents/executor.md`.** Six `<NNN>` sites become `<task-id>`:
`description`, the Inputs delegation string, reading-order item 5, and the three
`chore(state):` subjects (`start`, `update`, `remove after`).

**3d. `.claude/agents/closer.md`.** The post-merge duty 2 block becomes the
four-source slug check:

```bash
ls docs/tasks/
git log --oneline origin/main | head -20
git branch -a && git worktree list
```

with its prose retitled from "three-source slot check" to "four-source slug
check (P4)". The merge-SHA duty is unchanged.

**3e. `.claude/skills/brief-template/SKILL.md`.** Nine sites:
`description`, "When to invoke", "What this skill provides", the template's
`# Brief: [task-id] — [Short task title]` line, and the five Edit-1 block
references. Add one line under the template's frontmatter block defining
`[task-id]` by pointing at `docs/PROCESS_MAP.md` §7 — pointing, not restating
(D1).

Verification:

- [ ] `grep -rn '<NNN>' .claude/` returns nothing
- [ ] `grep -n '0-9]{3}' .claude/agents/brief-validator.md` shows C1's
      alternation, and `grep -n '049-init-six-role-bootstrap'` finds the
      removal condition
- [ ] `grep -n 'worktree list' .claude/agents/planner.md .claude/agents/closer.md`
      returns a hit in each
- [ ] `grep -cn 'task-id' .claude/skills/brief-template/SKILL.md` ≥ 9
- [ ] `grep -n "printf '%03d'" .claude/agents/planner.md` returns nothing

**STOP-and-confirm before writing 3a.** Swapping planner steps 1 and 2 is a
structural change to a numbered procedure, not a substitution. Show the
reordered step list and wait for the owner's go (`docs/PROCESS_MAP.md` §12.7).

Commit: see Commit sequence #3.

### Edit 4 — Cut the canonical docs over

**4a. `docs/PROCESS_MAP.md` — the canonical definition lives here.**

In §7's table:

> | Task brief | `docs/tasks/<task-id>-<slug>/brief.md` | `<task-id>` is the birth date `YYYY-MM-DD` for a task born on or after brief 052's merge, and a zero-padded `NNN` for one born before it. `<slug>` is kebab-case, ≤ 30 chars, and globally unique across all of `docs/tasks/`. Same-day collisions take a short ordinal suffix, applied only on collision. Preserved after merge as the historical record |
> | Task notes | `docs/tasks/<task-id>-<slug>/notes.md` | optional; where mid-run owner rulings land |
> | Session recap | `docs/sessions/<YYYY-MM-DD>-<role>-<slug>.md` | the date is the *session's*, not the task's; `<role>` is `orchestrator` or `executor`. A recap of a pre-cutover task keeps that task's number in the slug position — `<NNN>-<slug>` — for life (E8) |

Replace the first of the three naming facts with the slug-collision fact,
pointing at `docs/MENTOR_BRIEF.md` P4 and `.claude/agents/planner.md` step 2,
and stating that a task is born under one scheme and dies under it. Keep the
other two facts.

Then: §3's tree line, §5's pipeline diagram line (`@planner → resolves the slug
via P4, ...`) and its `@closer post-merge` line, §2's Tier-2 bullet, §4's
planner row, and §4's owner-rulings bullet all take `<task-id>`. **§8's `En`
row stays exactly as it is** — it describes burned exception numbers, not task
slots.

**4b. `CLAUDE.md`.** Two "Related Documents" bullets take `<task-id>`.

**4c. `docs/AGENT_PLAYBOOK.md`.** The caminho B bullet, the caminho B
invocation string, the mid-run-rulings sentence, and the recap-transport
sentence take `<task-id>`. The troubleshooting row
`| Planner STOPs with "NNN resolution conflict" | P4 three-source check
disagreed | ... |` becomes the slug-conflict row against the four-source check.

**4d. `docs/ROADMAP.md`.** Two path pointers take `<task-id>`.

Verification:

- [ ] `grep -rn '<NNN>' CLAUDE.md docs/PROCESS_MAP.md docs/AGENT_PLAYBOOK.md docs/ROADMAP.md`
      returns only `docs/PROCESS_MAP.md` §7's Session recap row, whose
      `<NNN>-<slug>` is the E8 carve-out this same Edit prescribes verbatim
- [ ] `grep -n 'task-id' docs/PROCESS_MAP.md` shows the §7 definition
- [ ] `grep -n 'burned reserves' docs/PROCESS_MAP.md` still returns the §8 `En`
      row, unchanged
- [ ] `grep -n 'mentor' docs/PROCESS_MAP.md | grep -i recap` shows no `mentor`
      in the recap role set
- [ ] `git diff --stat docs/ROADMAP.md` shows 3 changed lines, not more: the
      two path pointers, plus the recap role set (`mentor + executor` ->
      `orchestrator + executor`) bundled here by owner ruling during the run

Commit: see Commit sequence #4.

### Edit 5 — Cut the harness over (pt-BR surface preserved)

Six files. **Change the convention inside the pt-BR sentences; do not translate
them** (R9 — `harness/` is the human-edited surface).

- `harness/README.md` — one path
- `harness/init/07-create-brief.md` — seven sites. The "determina o próximo
  número livre" step becomes choosing a free slug and verifying it against the
  four sources; the rest are paths and the commit subject
- `harness/workflows/audit-merge.md` — the brief path and the executor recap
  path; the standalone `PR <NNN>` on line 22 refers to a **pull request number**,
  not a task id — leave it
- `harness/workflows/close-task.md` — the recap naming block becomes
  `docs/sessions/<YYYY-MM-DD>-executor-<slug>.md`, and its field gloss loses the
  `<NNN>` line and gains the E8 carve-out for pre-cutover tasks
- `harness/workflows/review-final-task.md` — one path
- `harness/workflows/setup-orchestrator.md` — the notes path, and the closing
  line `depois P4 pro slot do brief (...)` becomes `depois P4 pro slug do brief`
  with the fourth source added to its parenthetical

Verification:

- [ ] `grep -rn '<NNN>' harness/` returns only `audit-merge.md` line ~22, the
      PR number
- [ ] `grep -n 'worktree list' harness/workflows/setup-orchestrator.md` hits
- [ ] `grep -niE '\b(the|and|with|before|after)\b' harness/workflows/close-task.md`
      returns, inside the `--- COPIAR ---` block, only the quoted English
      commit subject `chore(state): remove after completion` — which R9
      requires to be English. Anything else is accidental translation

Commit: see Commit sequence #5.

### Edit 6 — Promote the note and widen the disposition contract

**6a. `docs/explorations/README.md`.** In the disposition table, the
`promoted to brief <id>` row's "Required with it" cell gains: the brief's id, or
the id range when one note produced a series. Add `promoted to briefs <id>-<id>`
as the plural form in the same row (D5).

**6b. `docs/explorations/mentor-lane-and-task-identity.md`.**

- `Disposition: candidate — 2026-08-03` becomes
  `Disposition: promoted to briefs 049-052 — <execution date>`
- The `Status:` line currently reads `exploration — possibilities only, NOT a
  commitment or spec`. The contract that brief 050 installed in
  `docs/explorations/README.md` fixes it as `exploration — no implementation
  mandate`. Align it. This is drift 050/051 left behind, and it is corrected
  here rather than batched into Edit 7 because Edit 6 is already rewriting the
  header block.
- Append one dated `## Changelog` line recording the promotion and naming the
  four briefs.
- **Do not** correct E8/E9's "the window is empty" claim in the body. The note
  records what was believed on 2026-08-03; the correction belongs in this
  brief's Context and in the recap, which is where it is.

Verification:

- [ ] `grep -n 'Disposition:' docs/explorations/mentor-lane-and-task-identity.md`
      shows `promoted to briefs 049-052` with a date
- [ ] `grep -n 'Status:' docs/explorations/mentor-lane-and-task-identity.md`
      matches the README's contract line byte for byte
- [ ] `grep -c '^- 2026-' docs/explorations/mentor-lane-and-task-identity.md`
      is one higher than before the Edit
- [ ] `grep -n 'window is empty\|may never be exercised'` still returns the
      original body text — not rewritten

Commit: see Commit sequence #6.

### Edit 7 — Errata, batched

One commit, at the end, only if there is anything in it. Findings that change
nothing that ships do not get their own amend cycle.

Known candidate, found while authoring:

- `docs/AGENT_PLAYBOOK.md` — the heading `### Recap policy (three recaps)`
  introduces a section that lists **two** recap-producing roles. Brief 050
  retired the Mentor recap and left the count in the heading.

Anything else discovered during Edits 2-6 is added to this list at Pause 2 and
surfaced before the commit. If the list is empty, skip the Edit and say so.

Verification:

- [ ] Each errata item names its file and line, and states what it does not change
- [ ] `git diff --stat` for this commit touches only files already in scope

Commit: see Commit sequence #7 (conditional).

### Commit sequence

Verbs checked against the `ALLOW=` line in
`.claude/skills/pre-commit-self-audit/SKILL.md`: `add`, `migrate`, `promote`,
`fix` are all present. `replace` and `cut` were considered and rejected — both
are outside the allowlist. `migrate` is also the verb briefs 049, 050 and 051
used for this same cycle, so it fits by precision and by precedent.

1. `docs(tasks): add brief for 052-task-identifier-cutover`
2. `docs(mentor): migrate P4 to a global slug-collision check`
3. `docs(agents): migrate the pipeline to the dated identifier`
4. `docs: migrate the canonical docs to the dated identifier`
5. `docs(harness): migrate the harness to the dated identifier`
6. `docs(explorations): promote the mentor-lane note to briefs 049-052`
7. `docs: fix errata found during the 052 cutover`

Commit 7 is conditional on Edit 7 finding anything. Measure each subject with
`printf '%s' "<subject>" | wc -L` before committing rather than trusting this
list.

### Automated checks (run before each commit)

- [ ] `npx tsc -b` passes — unconditional, no docs-only exemption
- [ ] `npm test` passes — this worktree may not have `core.hooksPath` wired, so
      the G-R8 pre-commit hook may never fire

The worktree started with no `node_modules`, so the first `npx tsc -b` failed
with `TS2305` on `@saci/core` symbols resolved from the *main* checkout — the
G-NODE-2 trap exactly. The Orchestrator applied that gotcha's documented
workaround (`npm install` at the worktree root) while authoring this brief, and
its guard held: `git status --short` showed no tracked-file change, no
`package-lock.json` drift. Baseline recorded at that point, against an
unmodified tree plus this untracked brief:

```
npx tsc -b   -> clean
npm test     -> tests 305 | pass 304 | fail 0 | skipped 1
```

If the executor sees `tsc` fail on `@saci/*` resolution, the cause is the
environment, not the Edit — re-run `npm install` and re-check the guard. Do not
commit on red either way.

### Structural checks

- [ ] Every file in the Non-negotiable constraint list exists at its path
- [ ] No file outside that list was modified:
      `git diff --name-only origin/main...HEAD`
- [ ] The full sweep returns only the classified survivors:
      `grep -rnE '<NNN>|\bNNN\b' --include='*.md' . | grep -vE '^\./(docs/tasks/|docs/sessions/|node_modules)'`

### Behavior checks

- [ ] `planner.md` step 2 and `closer.md`'s post-merge duty describe the **same**
      four-source check. Read them side by side. If the closer runs three
      sources while the planner runs four, the cutover ships inconsistent.
- [ ] `brief-validator.md` C1 would accept both this brief's own header
      (`# Brief: 052 — ...`) and a dated one (`# Brief: 2026-08-20 — ...`).
      Verify by running C1's regex against both strings.
- [ ] `<task-id>` is defined in exactly one place (`docs/PROCESS_MAP.md` §7) and
      used without redefinition everywhere else

### Git checks

- [ ] Branch used: `docs/task-identifier-cutover`, never the `claude/*` branch
- [ ] Commits follow Conventional Commits (G-R3); subjects ≤ 72 chars, verified
      with `printf '%s' "<subject>" | wc -L`
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git log -1 --format=%B` matches the gate-approved message verbatim after
      every commit; amend if it drifted
- [ ] `git status` clean at the end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 1 skipped (`Plan required: no`)
- [ ] Pause 2 taken after Edit 2, the first fully changed file
- [ ] Pause 3 taken before every commit, with `pre-commit-self-audit` output
- [ ] The STOP-and-confirm in Edit 3a was honored before any write to
      `planner.md`
- [ ] Any criterion that could not be met was reported explicitly

## Pause points

- **Pause 1 — skipped.** `Plan required: no`.
- **Pause 2 — required.** After Edit 2, the first fully changed file.
- **Pause 3 — required before every commit.** `git status`, `git diff --stat`,
  the proposed message, `pre-commit-self-audit` output, and both green-boundary
  results in one fenced block.
- **One extra STOP** inside Edit 3a, before reordering planner's steps.

An assertion does not close Pause 3. The pasted output of
`git log --format=%B -1` does, in the turn's final message, as one fenced block.

## Plan required justification

- Every change is specified above with its exact target, and the six authored
  rewrites carry their replacement prose verbatim.
- All decisions are closed: E1-E9 in the note, D1-D8 in this brief.
- The one genuine judgment call — reordering planner's numbered steps — has an
  explicit STOP-and-confirm guard rather than a default.
- Ambiguity elsewhere resolves to a mechanical substitution defined once in D1.

**Pause 2 and Pause 3 remain required** regardless (Lesson #6).

## Reference documents (read before starting)

1. `CLAUDE.md` — all rules, R9 and R10 especially
2. `docs/PROCESS_MAP.md` §7 and §11
3. `docs/GIT_WORKFLOW.md`
4. `docs/AGENT_PLAYBOOK.md` chapter 2, Lesson #6
5. `docs/explorations/mentor-lane-and-task-identity.md` §3 (E1-E9), §5, §6
6. `.claude/skills/brief-template/SKILL.md`
7. `.claude/skills/pre-commit-self-audit/SKILL.md`

## Expected output (end of session)

1. Branch name and `git log --oneline main..HEAD`
2. `git diff --stat origin/main...HEAD`
3. Any verification checkbox that could not be met, with the reason
4. Confirmation that no `git push` was executed
5. The errata list from Edit 7, or a statement that it was empty
