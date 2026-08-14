# Brief: 2026-08-13 — Suindara's place in the architecture

> **Category:** L
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/art-arm-doctrine`

---

## Context

Saci gained an art-generation arm on 2026-08-12, and the arm is recorded
nowhere a rule-reading agent would find it. "Suindara" appears in zero canonical
documents — not `CLAUDE.md`, not `docs/ROADMAP.md`, not `docs/explorations/`.
The only statement of the topology lives in a session recap, which is authority
level 6, and on 2026-08-13 the owner closed a decision that contradicts it: the
engine is **ported into this monorepo**, not called across a process boundary.
The owner had to ask which it was, because there was nowhere to read.

`CLAUDE.md`'s "Architecture" section describes five packages and three ports and
does not mention rendering. `docs/ROADMAP.md` carries four identity shifts and
stops at 2026-06-12. `docs/MENTOR_BRIEF.md` §2 still defines the product as one
where "the designer only does art" — a sentence the art arm makes false.

This brief writes the arm into the three canonical surfaces, fixes the
vocabulary before the first identifier is written, and adds the one rule the
port will be executed against. It writes no code and unblocks no measurement.

**Size note.** This brief does not split. Its five Edits are one another's
verification: the identity shift cites the vocabulary ruling, `CLAUDE.md`
implements it, `R26` is what the architecture paragraph points at, and
`docs/ROADMAP.md`'s own update protocol declares that it and `MENTOR_BRIEF` §2
"age alongside" as a pair and must be reconciled in the same PR. A sub-brief
delivering the identity shift without the vocabulary it depends on would close
on incomplete evidence — the brief-048 case, not the brief-049 case.

## Goal

Suindara, the art arm, and the `artTemplate` vocabulary are stated in
`docs/ROADMAP.md`, `CLAUDE.md` and `docs/MENTOR_BRIEF.md` §2, and `R26` governs
what code absorbed from a laboratory lane pays on arrival.

Out of scope:

- **No code.** No file under `packages/` is read, created or modified.
- **No port.** No Suindara file is copied, translated, or referenced by path.
- **No phase placement and no sequencing.** Which phase the arm belongs to, and
  which unit ports first, are a later decision (D4).
- **No new row in `docs/ROADMAP.md`'s "Layers & status" table.** That file's own
  rule of three governs it and art generation is on first mention (D4).
- **No `R26` for transport-agnostic composition functions.** Deferred with its
  measurement (D3).
- **No `E8` claim** (D5).
- **No edit to `docs/sessions/2026-08-12-orchestrator-spike-art-chain.md`.** A
  recap records what was true then; it is superseded by a dated statement
  elsewhere, never rewritten.
- **No edit to the dated `Phase transition (recorded 2026-05-15…)` bullet** in
  `MENTOR_BRIEF` §2. Its "Planned packages" list is a dated record of what was
  planned then; the new dated bullet above it names the three new packages.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/2026-08-13-art-arm-doctrine/brief.md`
   - `docs/ROADMAP.md`
   - `CLAUDE.md`
   - `docs/MENTOR_BRIEF.md`
   If anything else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md`, especially **R1/A4** (no hardcoded path —
   Suindara is named, its location on disk is never written), **R9** (this whole
   diff is agent-consumed surface and is English-only), and **R7**.
3. Follow `docs/GIT_WORKFLOW.md` fully:
   - Branch `docs/art-arm-doctrine` already exists at base `4840da5`; do not
     create or switch branches.
   - Conventional Commits (G-R3); subjects ≤ 72 chars.
   - No `Co-authored-by` trailer (G-A7).
   - Commit freely; **DO NOT push** (G-R5).
   - No `STATE.md` — this is a single-session L task.
4. Every prose block in "Done criteria" is **verbatim**. Do not rephrase,
   re-wrap, or improve it. If a block reads wrong, **STOP and report** rather
   than fixing it in place.
5. The insertion line numbers below were read on 2026-08-13 at `4840da5`. Anchor
   on the quoted surrounding text, not on the number. If the anchor text is not
   found, **STOP and report**.

### Conventions

- English only, everywhere in this diff (R9). No pt-BR reaches any of these
  files.
- Commit type `docs` throughout; scopes `tasks`, `roadmap`, `architecture`,
  `rules`, `mentor`.
- Commit verbs come from `VERB_ALLOWLIST` in
  `.claude/hooks/lib/commit-message.mjs`. The five subjects below were checked
  against it; `record` and `place` are not in it and are not used.

### Architectural decisions already made (do not revisit)

#### D1 — `template` stays; the incoming concept is `artTemplate`

This repository uses `template` for one thing: the source PSD/AI that `start`
copies into a task folder to produce the `editable`. Measured on 2026-08-13:
142 occurrences across 15 files (`templateSource`, `templatesRoot`,
`copyTemplate`, `templateFiles`). Suindara uses the same word for an HTML
package that renders a PNG from a spec — a different thing with no human
editing step, and zero sites in this repository.

The new word goes to the concept that arrives, because the rename cost is
asymmetric: 142 established sites against 0 unwritten ones. In prose, "art
template"; in identifiers, `artTemplate`. Code absorbed from Suindara is
renamed on arrival.

Note for the reader: `editable` was considered and is not the competitor.
`packages/core/src/file-name.ts` already uses it for the *output* file
(`buildEditableStem`, `editablePath`; 56 sites).

#### D2 — Ported, not integrated, and what that supersedes

The owner closed this on 2026-08-13 (`docs/sessions/2026-08-12-orchestrator-
measure-jira-copy-share.md` D7). The reason recorded is control, not size:
Suindara does not carry this project's rules, gates or test discipline.

It reverses the topology in
`docs/sessions/2026-08-12-orchestrator-spike-art-chain.md`, which justified a
separate repository as "an earned boundary" and had the chain spawning
`render.mjs` as a subprocess. That recap is **not edited**; the dated
subsection written by Edit 2 is what supersedes it.

#### D3 — `R26` is the absorption rule; the transport rule is deferred

`docs/sessions/2026-08-12-orchestrator-spike-art-chain.md` queued
"`R26` (composition functions are transport-agnostic), which is already true
and therefore cheap to freeze". Measured on 2026-08-13, it is not already true:

```
packages/cli/src/run-fetch.ts:112,123,130,137   console.warn(
packages/cli/src/run-start.ts:86,89             console.error(
```

Six sites in two of the three composition functions, and they exist *because*
R4 forbids silent swallowing — `run-start.ts:82-84` says so in a comment. A
transport rule phrased as "never writes to stdout" is born violated six times
and contradicts R4. It needs a diagnostics carve-out, which is design work, so
it leaves this brief and takes the next free number when it lands.

`R26` therefore names the absorption rule. Edit 4 states the supersession in
the rule's own text so the recap's dangling citation resolves.

#### D4 — No phase, no sequencing, no map row

`docs/ROADMAP.md` says the sequencing of the greenfield loop "is deliberately
**not fixed here**", and its update protocol admits a layer onto the
"Layers & status" map only under the rule of three. Art generation is on first
mention. This brief records an identity shift and nothing about order.

#### D5 — `E8` is not claimed

`CLAUDE.md` says the next free exception number is `E8`; the art-chain recap
earmarks it for a future `@saci/web` bundler exception; no `E8` entry exists on
disk. This brief creates no exception. If the port needs one, it takes a number
in the port brief, when the case is real (A3).

#### D6 — Suindara is named, never located

R1/A4. No absolute path, no drive letter, no `../suindara`. The repository is
referred to by name only, in all three files.

#### D7 — The doctrine unblocks nothing

The art chain stopped on two stacked blockers — `drive.file` grants no access
to a third party's file, and the copy is an uploaded `.docx` rather than text
(`docs/tasks/2026-08-12-spike-art-chain/notes.md` F3). Neither is touched by a
document, and Edit 2 says so in the shift's own text so nobody reads progress
into it.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The Orchestrator pre-saved this brief before invoking the executor (caminho B).

- [ ] Directory `docs/tasks/2026-08-13-art-arm-doctrine/` exists
- [ ] File `docs/tasks/2026-08-13-art-arm-doctrine/brief.md` exists; its first
      line is `# Brief: 2026-08-13 — Suindara's place in the architecture`
- [ ] `git add docs/tasks/2026-08-13-art-arm-doctrine/brief.md` is staged, and
      nothing else
- [ ] Commit #1 created

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

Commit: `docs(tasks): add brief for 2026-08-13-art-arm-doctrine`

### Edit 2 — Add the fifth identity shift to `docs/ROADMAP.md`

Insert the block below into `docs/ROADMAP.md`, after the last line of the
`### 2026-06-12 — Coordination state in the Sheet → the application owns state`
subsection (the line ending `and \`adapter-sheets\` moves to the parking lot.`)
and before the line `## Phases`. Leave one blank line on each side.

Verbatim block:

```markdown
### 2026-08-13 — Production assistant → production assistant with an art arm

The 2026-06-12 pivot settled who owns state. This one settles what the product
*makes*. Saci orchestrated files around a designer's work — pull the task,
scaffold the folder, copy the template, ship the result. It now also **generates
the art itself** from a structured brief, through a rendering arm.

The arm exists already, outside this repository: **Suindara**, an HTML art
laboratory that renders a PNG from a spec by driving a headless browser. Its
contract was defined before Saci had any consumer for it; the art-chain spike
(`docs/tasks/2026-08-12-spike-art-chain/`) measured the seam between the two.

**Suindara's engine is ported into this monorepo, not called across a process
boundary.** The reason is control, not size: Suindara carries none of this
project's rules, gates or test discipline — it is closer to a test bench than to
a product, and a product arm living outside every gate is an arm nobody can hold
to account.

This supersedes, on this point only, the topology in
`docs/sessions/2026-08-12-orchestrator-spike-art-chain.md`, which justified a
separate repository as "an earned boundary" and had the chain spawning
`render.mjs` as a subprocess. That recap is authority level 6 and stays on disk
unedited; this subsection is what supersedes it.

Two things the shift deliberately does **not** change:

- **The Python lane is untouched.** `automation/` was declared a permanent
  laboratory on 2026-08-08 and stays one. Suindara's status changed; no argument
  here reaches the Python lane.
- **The art-template repositories stay outside.** `suindara-tmpl-*` remains an
  installable versioned ecosystem with its own release rhythm. Only the engine
  moves.

Three things it does **not** decide, listed so nobody reads them into it: which
phase the arm belongs to, which units of the engine port first, and whether the
art chain works end to end. The spike stopped on two stacked blockers — the
granted Drive scope reaches no file this client did not create, and the copy is
an uploaded `.docx` rather than text — and a document touches neither.
```

Verification:

- [ ] `grep -c '^### 2026-' docs/ROADMAP.md` returns `5`
- [ ] `grep -n '2026-08-13 — Production assistant' docs/ROADMAP.md` returns a
      line number greater than the one for `2026-06-12 — Coordination state`
      and smaller than the one for `^## Phases`
- [ ] `grep -c 'Layers & status' docs/ROADMAP.md` returns `1` — the table gained
      no row (D4)
- [ ] `git diff --numstat docs/ROADMAP.md` shows `0` deletions

Commit: `docs(roadmap): document the art arm as the fifth identity shift`

### Edit 3 — Declare the arm and the vocabulary in `CLAUDE.md`

Insert the two blocks below into the `## Architecture` section of `CLAUDE.md`,
after the paragraph beginning `The Python \`automation/\` codebase is both the`
and before the paragraph beginning `Build: each workspace compiles`. Leave one
blank line on each side.

Verbatim block:

```markdown
The **art arm** is the product's second half: given a structured brief, Saci
renders the deliverable rather than only routing the file a designer made. Its
engine comes from **Suindara**, an HTML art laboratory that drives a headless
browser to turn a spec into a PNG. Suindara's engine is **ported into this
monorepo** (2026-08-13, `docs/ROADMAP.md`), one mechanism at a time under R26;
it is not spawned as a subprocess and it is not a dependency. The laboratory
itself, and the `suindara-tmpl-*` art-template repositories it publishes, stay
outside — they are an installable versioned ecosystem on their own release
rhythm.

**Vocabulary, fixed before the first identifier.** This repository uses
`template` for exactly one thing: the source PSD/AI that `start` copies into a
task folder to produce the `editable` (`templateSource`, `templatesRoot`,
`copyTemplate` — 142 sites as of 2026-08-13). An **`artTemplate`** is the other
thing entirely: an HTML package that renders a PNG from a spec, with no human
editing step. The two never share a word. Code absorbed from Suindara is renamed
on arrival — its `template` is our `artTemplate`. In prose, "art template" with
the space; in identifiers, `artTemplate`. Three packages are planned for the arm
and **none exists yet**: `adapter-render` (drives the headless browser),
`adapter-http` and `web` (the brief UI, which replaces Suindara's own panel
rather than porting it). Do not create them ahead of a brief that needs them
(A3).
```

Verification:

- [ ] `grep -c 'artTemplate' CLAUDE.md` returns `3`
- [ ] `grep -c 'Suindara' CLAUDE.md` returns `4` at this commit — two lines in
      the art-arm paragraph, two in the vocabulary paragraph
- [ ] every `Suindara` match falls between the `## Architecture` and
      `## Hard Rules` headings
- [ ] No line added by this Edit locates Suindara on disk (D6). Verify against
      the diff, not the file:
      `git diff -U0 CLAUDE.md | grep '^+' | grep -v '^+++' | grep -E '[A-Z]:\\\\|/Users/|\.\./suindara'`
      returns nothing. The file-scoped form cannot pass: R1 and A4 quote example
      paths in order to forbid them, and a path pattern cannot tell a
      prohibition from a violation.
- [ ] `git diff --numstat CLAUDE.md` shows `0` deletions

Commit: `docs(architecture): declare the art arm and its vocabulary`

### Edit 4 — Add `R26` to `CLAUDE.md`

Insert the block below in the `## Hard Rules` section, after the `**R25 —`
paragraph and before the `## Anti-patterns` heading. Leave one blank line on
each side.

Verbatim block:

```markdown
**R26 — Laboratory code is normalized on arrival, never carried raw.** Two
permanent laboratory lanes feed this repository: the Python `automation/` lane
and the Suindara art lane (see "Architecture"). Code leaves them one mechanism
at a time, as briefs, and whatever arrives is normalized in the same commit that
introduces it — never in a follow-up.

- **Language.** Identifiers, comments, log and error messages, and test
  descriptions are rewritten in English (R9). A laboratory's language convention
  does not travel with its code, and a half-translated file is worse than either
  end state: it teaches that the rule is optional.
- **Rule identifiers.** `R*`, `A*` and `E*` here mean what this file says they
  mean. A citation inherited from another repository's rulebook is a false
  citation however true it was at the origin — requalify it with the origin's
  name (`SUINDARA-R2`) or drop it and keep its reasoning in plain words.
- **Rationale.** Design reasoning carried in a laboratory's comments is
  preserved, not deleted to satisfy R8. Where it exceeds R8's one-short-line
  default it moves into the porting brief or the package's own doc, and the
  comment keeps a one-line pointer. R8 forbids restating *what* code does; it
  does not license discarding *why* — that reasoning is the most expensive thing
  a laboratory produces and the easiest to lose in transit.

Verification is per-brief, not global: a porting brief lists the units it moves
and each one's normalization is a Done-criteria checkbox.

Numbering note: `docs/sessions/2026-08-12-orchestrator-spike-art-chain.md`
queued `R26` for a different rule — composition functions being
transport-agnostic. That rule was measured on 2026-08-13 and is not yet true
(six `console` sites in `run-fetch.ts` and `run-start.ts`, all of them R4
compliance), so it was deferred and will take the next free number. That
citation is superseded.
```

Verification:

- [ ] `grep -c '^\*\*R2[0-9]' CLAUDE.md` returns `7` (R20–R26)
- [ ] `grep -n '^\*\*R26' CLAUDE.md` returns a line number greater than the one
      for `^\*\*R25` and smaller than the one for `^## Anti-patterns`
- [ ] `grep -c 'E8' CLAUDE.md` returns `2` — unchanged; no exception was created
      (D5)
- [ ] `git diff --numstat CLAUDE.md` shows `0` deletions for this commit

Commit: `docs(rules): add R26 for normalizing laboratory code`

### Edit 5 — Reconcile `docs/MENTOR_BRIEF.md` §2

Two changes in one commit.

#### 5a. Repair the false present-tense claim

In the `- **Project:**` bullet, the text currently reads
`ship the result to Drive — so the` / `designer only does art.` The art arm makes
that false. Replace the bullet's body, preserving its two-space list
indentation, with exactly:

```markdown
- **Project:** Saci — an **individual production assistant** for the
  Estratégia design team. Saci v2 automates the repetitive actions
  around a Jira task — create the local folder, find the right
  template, open it in the editor, ship the result to Drive — and,
  since 2026-08-13, renders the art itself from a structured brief
  through the art arm. A second use case rides on top: an
  aggregated Sheets view fed unidirectionally by the production
  instances, giving Rafael (and non-designer coordinators) a
  team-level picture without pulling designers into a coordination
  tool.
```

#### 5b. Add the dated bullet

Insert the block below as a new bullet immediately after the
`- **Per-project FieldMapping shipped 2026-06-21 (brief 029):**` bullet ends
(the line ending `validation (029 checks global field existence only).`) and
before the `- **Phase transition (recorded 2026-05-15, still in force):**`
bullet. The dated bullets in this section run in chronological order and this
keeps them so.

Verbatim block:

```markdown
- **Art arm added 2026-08-13:** the product gained a rendering arm —
  given a structured brief it produces the deliverable, instead of
  only routing the file a designer made. The engine comes from
  **Suindara**, an HTML art laboratory outside this repository, and it
  is **ported in, not called across a process boundary**: Suindara
  carries none of this project's rules or gates, and a product arm
  outside every gate is one nobody can hold to account. This reverses
  the "earned boundary" topology in
  `docs/sessions/2026-08-12-orchestrator-spike-art-chain.md`. Three
  packages are planned and none exists: `adapter-render`,
  `adapter-http`, `web`. The vocabulary is fixed — `template` stays
  the source PSD/AI, an `artTemplate` is the HTML renderer — and
  `R26` governs what absorbed laboratory code pays on arrival. The
  Python lane is unaffected and stays a permanent laboratory. Neither
  the phase placement nor the port's scope is decided, and the art
  chain's two stacked blockers (Drive scope, `.docx` format) are
  untouched by this. Full record: `docs/ROADMAP.md` identity shifts.
```

Verification:

- [ ] `grep -c 'designer only does art' docs/MENTOR_BRIEF.md` returns `0`
- [ ] `grep -c 'Art arm added 2026-08-13' docs/MENTOR_BRIEF.md` returns `1`
- [ ] `grep -n 'Planned packages' docs/MENTOR_BRIEF.md` still returns its
      original line content unchanged — the dated 2026-05-15 record was not
      rewritten (Out of scope)
- [ ] Both edits are inside §2: every changed line number falls between the
      `## 2. Where we are in the project` and `## 3. Observed patterns` headings

Commit: `docs(mentor): update the project state for the art arm`

### Commit sequence

1. `docs(tasks): add brief for 2026-08-13-art-arm-doctrine`
2. `docs(roadmap): document the art arm as the fifth identity shift`
3. `docs(architecture): declare the art arm and its vocabulary`
4. `docs(rules): add R26 for normalizing laboratory code`
5. `docs(mentor): update the project state for the art arm`
6. `docs(tasks): fix the D6 check scope in the art-arm brief`

All six verified ≤ 72 characters. All six verbs are in `VERB_ALLOWLIST`.

### Automated checks (run before each commit)

- [ ] `npx tsc -b` exits 0
- [ ] `npm test` passes
- [ ] Both results pasted into the Pause 3 block (the green boundary is
      unconditional; there is no docs-only exemption)

### Structural checks

- [ ] `git diff --name-only main..HEAD` lists exactly four paths:
      `CLAUDE.md`, `docs/MENTOR_BRIEF.md`, `docs/ROADMAP.md`,
      `docs/tasks/2026-08-13-art-arm-doctrine/brief.md`
- [ ] No file under `packages/` appears in any diff
- [ ] No pt-BR prose is introduced by this diff (R9). Verify by reading the
      added lines of `git diff main..HEAD`, not by a word pattern — a pattern
      spelled out here would itself put pt-BR on an English-only surface, which
      is what check C10 denies

### Behavior checks

Not applicable — no executable code is changed by this brief. Stated rather
than omitted.

### Git checks

- [ ] Branch used: `docs/art-arm-doctrine`, base `4840da5`
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed
- [ ] After each commit, `git log --format=%B -1` pasted and confirmed identical
      to the approved message; amended if it drifted

### Process checks

- [ ] `Plan required: no` — Pause 1 is skipped
- [ ] Pause 2 — the first modified file shown for review before proceeding
      (always required)
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message + the green
      boundary shown before each commit (always required)
- [ ] Staged set confirmed to match the current Edit's scope before each
      Pause 3 submission
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any change):** skipped — `Plan required: no`.
- **Pause 2 (after the first modified file):** always required. The first
  modified file here is `docs/ROADMAP.md` (Edit 2).
- **Pause 3 (before each commit):** always required, five times.

In case of:

- Unrelated bug found → report and ask. Do not fix.
- An anchor text in an Edit not found on disk → **STOP and report**. Do not
  search for a similar location.
- A verbatim block that reads wrong → **STOP and report**. Do not improve it.
- Undocumented gotcha discovered → report; document as a follow-up brief.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

- Every change is specified above as a verbatim block with an anchored insertion
  point and grep-checkable verification.
- All architectural decisions are closed (D1–D7) in the Constraints section.
- The judgment calls have explicit fallbacks, all of them STOP-and-report.
- Pause 2 and Pause 3 remain required regardless (Lesson #6).

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules; R1/A4, R7, R9 and R25 bear on this diff
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/PROCESS_MAP.md` §6 — the gates, and what is not a gate release
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6, Lesson #15
5. `docs/GOTCHAS.md` — G-NODE-2 before running the green boundary
6. `.claude/hooks/lib/commit-message.mjs` — `VERB_ALLOWLIST`
7. `docs/sessions/2026-08-12-orchestrator-measure-jira-copy-share.md` — D7, the
   decision this brief writes down
8. `docs/sessions/2026-08-12-orchestrator-spike-art-chain.md` — the topology
   being superseded; read, never edited

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (five commits, ordered)
2. `git diff --stat main...HEAD` (line counts per file)
3. Any verification checkbox that could not be met, with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step
