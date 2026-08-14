# Brief: 2026-08-14 — Declare buraqueira the Python laboratory of record

> **Category:** M
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/python-lab-of-record`

---

## Context

On 2026-08-14 the owner ruled that the Python laboratory of record is the
`buraqueira` repository, and that this repo's `automation/` folder is a frozen
snapshot — citable as provenance for code already ported, never as authority
over what the laboratory does today. The ruling is recorded in
`docs/sessions/2026-08-14-orchestrator-adf-text-fidelity.md`, "A standing ruling
the owner gave mid-session", which names the consequence and queues it: two
doctrine sites are false and were left standing.

Measured before this brief was written:

- `automation/` is one commit (`8fada81`, 2026-06-06), never touched since:
  15 `.py` files, 3,490 lines, no `tests/` directory.
- `buraqueira` today: 7,999 lines in root `.py`, 4,656 in `tests/`, 2,712 in
  `scripts/`, plus the chainable verb layer (`core.py`, `flow.py`,
  `adapter_*.py`, `map_parent.py`) that `automation/` does not contain at all.
- Three sites assert the false claim, not two: `CLAUDE.md:21`, `CLAUDE.md:111`
  (R26), and `docs/ROADMAP.md:140`.
- A second, distinct falsehood exists in three further sites: prose that has
  `automation/` *operating*, *retiring*, or being *archived*. A snapshot frozen
  for 69 days does none of those; the subject of those sentences is the legacy
  Python coordination pipeline.
- `docs/explorations/python-laboratory-lane.md` measured buraqueira correctly —
  its bucket split sums to 12,532 exactly, and `automation/` (3,490 lines total)
  cannot contain the note's 3,750 lines of pytest. The note declares its origin
  as buraqueira on line 6 but never names the repo in its body, saying only
  "The Python repo".

**Size note.** This brief runs 476 lines against Category M's ~350 ceiling, and
it does not split. The split test — "could these edits ship as two PRs, each
closing on its own evidence?" — fails here: the Done criteria for Edit 2 is that
*no* sentence in doctrine still calls `automation/` a laboratory, and that is
only checkable across `CLAUDE.md`, `ROADMAP.md` and `MENTOR_BRIEF.md` at once.
A PR fixing `CLAUDE.md` alone would close green while `ROADMAP.md:140` still
asserted the opposite. The overage is verbatim find-and-replace text, which is
the mechanism that makes `Plan required: no` safe; by the size table's own
indexing this is a doctrinal caminho-B brief, whose range it sits inside.

## Goal

Make the laboratory of record unambiguous in doctrine: name `buraqueira` where
the lab is meant, declare `automation/` as a frozen snapshot where it is meant,
and separate the legacy coordination pipeline from the snapshot in the Phase 4
prose that talks about retiring it.

Out of scope:

- **`docs/ROADMAP.md:49`** — inside the dated `### 2026-05-15` identity-shift
  entry. Its claims were accurate on their date; a dated entry is the historical
  record and is not rewritten. Its forward-looking half ("continues to operate
  ... until Phase 4") is superseded by the Phase 4 prose that Edit 3 corrects,
  which is the current-state surface a reader acts on.
- **`docs/ROADMAP.md:101` and `docs/MENTOR_BRIEF.md:50`** — "there are no
  production users of the Python `automation/`". True of the snapshot and true
  of the lab; the reasoning it grounds (no behavior-preserving mandate for
  `sync.py` / `lib_sheets.py`) holds either way. No edit.
- **`docs/ROADMAP.md:169` and `docs/MENTOR_BRIEF.md:102`** — `automation/` as
  the **seed** of v2's `core`. True, and the ruling explicitly preserves the
  provenance role. No edit.
- **`docs/explorations/v1-v2-overlap.md:12`** — already superseded by its own
  changelog (lines 21-24). No edit.
- **`automation/**`** — the snapshot is not modified, not moved, not deleted.
  Its own `SKILL_TEMPLATE.md` mentions are snapshot content, not this repo's
  doctrine.
- **The note's 12,532 figure** — it is buraqueira's, measured 2026-08-08, and
  has grown since (root + tests + scripts ≈ 15,367 today). Re-measuring means
  re-running the five-bucket classification, which is a separate task. This
  brief adds no number it did not measure.
- `docs/sessions/**` and `docs/tasks/**` from prior tasks — historical record,
  never retro-edited.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/2026-08-14-python-lab-of-record/brief.md`
   - `CLAUDE.md`
   - `docs/ROADMAP.md`
   - `docs/MENTOR_BRIEF.md`
   - `docs/explorations/python-laboratory-lane.md`

   If anything else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md`, especially R9 (English-only on this
   surface), R8, R10.
3. **Create the work branch before Edit 1.** The session runs in a worktree
   whose `claude/*` branch is scaffolding and violates R11 / validator C4. From
   a verified `main` (`git fetch origin main`, confirm HEAD is `4652d2a` or
   later on `origin/main`), run `git switch -c docs/python-lab-of-record`.
4. Follow `docs/GIT_WORKFLOW.md` fully:
   - Conventional Commits (G-R3), subjects ≤ 72 chars
   - No `Co-authored-by` trailer, no "Generated with" footer (G-A7)
   - Commit freely; **DO NOT push** (G-R5). Do not open a PR.
5. This is a text reconciliation. **No line count, measurement, or date may be
   introduced that this brief did not measure.** Where a replacement needs a
   number, it is given verbatim below.

### Conventions

- English on every edited surface (R9); all five files are agent-consumed.
- Commit type `docs` for every content commit.
- Replacement text is given verbatim. Match existing line wrapping in the file
  being edited: `CLAUDE.md`'s Architecture section and `docs/ROADMAP.md`'s
  Identity shifts use long unwrapped lines; `CLAUDE.md`'s R26 block,
  `docs/MENTOR_BRIEF.md` and `docs/explorations/python-laboratory-lane.md` wrap
  near 79 columns. **Follow the file, not this brief's own wrapping.**

### Architectural decisions already made (do not revisit)

#### D1 — `automation/` stays in the repository, declared as a snapshot

Owner-closed 2026-08-14. It is not deleted, not moved, not tagged-and-removed.
Rationale: 3,490 lines cost nothing on disk, and keeping it preserves the
traceable provenance of `packages/core/src/transform.ts`. The doctrine text
changes; the folder does not.

#### D2 — `ROADMAP.md:140` is corrected, even though it sits in a dated entry

The repo's convention is that a dated identity-shift entry is history and is not
rewritten. This bullet is the exception, on a narrow ground: it does not record
a decision that was accurate on its date and later changed — it **misnamed the
subject at the moment it was written**. What was declared permanent on
2026-08-08 was the Python laboratory, and the note that declared it measured
buraqueira. Correcting the noun repairs the attribution; it does not revise what
was decided, and the sentence's actual claim ("the Suindara shift does not reach
the Python lane") is untouched and still true.

`ROADMAP.md:49` fails this test — its claims were accurate as of 2026-05-15 —
and is therefore out of scope. If the owner rejects D2 at the gate, drop that
one hunk from Edit 2 and ship the rest; nothing else depends on it.

#### D3 — The operational sites name the pipeline, not a repository

`ROADMAP.md:305`, `ROADMAP.md:322` and `MENTOR_BRIEF.md:190` say `automation/`
retires or is archived. The replacement is **"the legacy Python coordination
pipeline"**, not "buraqueira". Reason: that buraqueira is the laboratory of
record is ruled and measured; that a coordination pipeline currently *runs* from
any particular checkout is **not measured in this session**. The pipeline-level
wording is true regardless of which checkout hosts it, and asserting the
checkout would introduce an unverified fact — which constraint 5 forbids.

#### D4 — The exploration note is disambiguated, not corrected

Its measurements are right and its origin line already names buraqueira. It gets
one clause naming the repo in the body, plus a changelog entry. Its numbers,
buckets, ratios and conclusions are not touched.

#### D5 — R26 still counts two lanes

R26 says "Two permanent laboratory lanes". After the correction there are still
two — the Python `buraqueira` lane and the Suindara art lane. The count is
correct; only the name of the first changes.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The Orchestrator pre-saved this brief (caminho B). The executor verifies
presence and commits it, on the branch created per constraint 3.

- [ ] Branch `docs/python-lab-of-record` exists and is checked out, created from
      a verified `origin/main`
- [ ] Directory `docs/tasks/2026-08-14-python-lab-of-record/` exists
- [ ] File `brief.md` exists in it; first line matches the title above
- [ ] `git add docs/tasks/2026-08-14-python-lab-of-record/brief.md` is staged
- [ ] Commit #1 subject: `docs(tasks): add brief for python-lab-of-record`

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

### Edit 2 — Declare buraqueira the laboratory in all three authority sites

Three sites, one claim, one commit.

#### 2a. `CLAUDE.md` line 21 — replace the whole paragraph

Find, verbatim (one long line):

```
The Python `automation/` codebase is both the **seed reference** of v2's core (its `lib_transform.py` was ported into `core` in Phase 2) and a **permanent laboratory lane** — it does not migrate. Proven mechanisms are absorbed here one at a time, as briefs; the lab stays Python (decided 2026-08-08, `docs/explorations/python-laboratory-lane.md`). It carries no behavior-preserving mandate — there are no production users — and `sync.py` / `lib_sheets.py` are legacy reference only; the sync diff engine is never ported.
```

Replace with two paragraphs (long unwrapped lines, blank line between them):

```
The **Python laboratory lane** is the `buraqueira` repository — it does not migrate. It stays Python, and this monorepo absorbs proven mechanisms from it one at a time, as briefs (lane declared permanent 2026-08-08, `docs/explorations/python-laboratory-lane.md`; laboratory of record ruled 2026-08-14). It carries no behavior-preserving mandate — there are no production users — and `sync.py` / `lib_sheets.py` are legacy reference only; the sync diff engine is never ported.

The `automation/` folder **in this repository** is a different thing: a frozen snapshot of that lab, vendored once in `8fada81` (2026-06-06) and untouched since — 15 files, 3,490 lines, no test suite. It is the **seed reference** of v2's core (its `lib_transform.py` was ported into `core` in Phase 2) and is cited for the provenance of code already ported, never as authority over what the laboratory does today. When a brief needs to know what the lab does, it reads `buraqueira`.
```

#### 2b. `CLAUDE.md` R26, line 111 — one noun

Find, verbatim:

```
permanent laboratory lanes feed this repository: the Python `automation/` lane
```

Replace with:

```
permanent laboratory lanes feed this repository: the Python `buraqueira` lane
```

The surrounding wrapped block is otherwise untouched; the replacement is the
same length class, so no re-wrap is needed.

#### 2c. `docs/ROADMAP.md` lines 140-142 — the misattributed bullet (D2)

Find, verbatim:

```
- **The Python lane is untouched.** `automation/` was declared a permanent
  laboratory on 2026-08-08 and stays one. Suindara's status changed; no argument
  here reaches the Python lane.
```

Replace with:

```
- **The Python lane is untouched.** The Python laboratory — the `buraqueira`
  repository — was declared permanent on 2026-08-08 and stays one. (This bullet
  named `automation/` when it was written, which was a misattribution: that
  folder is a frozen snapshot, not the lab. Corrected 2026-08-14.) Suindara's
  status changed; no argument here reaches the Python lane.
```

Verification (run after Edit 2, before Edit 3):

- [ ] `grep -c buraqueira CLAUDE.md` returns **3** — two lines in the
      Architecture paragraphs from 2a, one in R26 from 2b
- [ ] `grep -c automation/ CLAUDE.md` returns **1** — the snapshot paragraph in
      2a, and nothing in R26
- [ ] `grep -n 'was declared a permanent' docs/ROADMAP.md` returns nothing
- [ ] R26 still reads "Two permanent laboratory lanes" (D5)
- [ ] No other line of `CLAUDE.md` or `docs/ROADMAP.md` changed:
      `git diff --stat` shows only these two files, and
      `git diff -U0 CLAUDE.md docs/ROADMAP.md` contains only the hunks above

Commit: `docs: declare buraqueira the Python laboratory of record`

### Edit 3 — Separate the frozen snapshot from the retiring pipeline

Three sites, one claim (D3), one commit.

#### 3a. `docs/ROADMAP.md` lines 304-306 (Phase 4 goal)

Find, verbatim:

```
projection off that shared state** — never a state holder. The Python
`automation/` retires once a coordination consumer reads Saci's state instead of
the legacy Sheet.
```

Replace with:

```
projection off that shared state** — never a state holder. The legacy Python
coordination pipeline retires once a coordination consumer reads Saci's state
instead of the legacy Sheet.
```

#### 3b. `docs/ROADMAP.md` lines 321-322 (Phase 4 exit criterion)

Find, verbatim:

```
a projection of app-owned shared state; the Python `automation/` is archived.
```

Replace with:

```
a projection of app-owned shared state; the legacy Python coordination pipeline
is archived.
```

#### 3c. `docs/MENTOR_BRIEF.md` lines 189-190

Find, verbatim:

```
    consumer, not the source of aggregation. Retires the Python
    `automation/` for coordination.
```

Replace with:

```
    consumer, not the source of aggregation. Retires the legacy
    Python coordination pipeline.
```

Note the four-space indent — this is a nested list item. Preserve it exactly.

Verification (run after Edit 3):

- [ ] `grep -n retires docs/ROADMAP.md` shows the Phase 4 line naming the
      pipeline, not `automation/`
- [ ] `grep -n 'is archived' docs/ROADMAP.md` likewise
- [ ] `grep -n 'Retires the Python' docs/MENTOR_BRIEF.md` returns nothing
- [ ] `grep -c automation/ docs/ROADMAP.md` returns **4** — the three
      out-of-scope sites (lines 49, 101, 169, unchanged) plus the one
      introduced by 2c's parenthetical
- [ ] `grep -c automation/ docs/MENTOR_BRIEF.md` returns **2** — lines 50 and
      102, both out of scope, both unchanged
- [ ] The string `buraqueira` does **not** appear in Edit 3's diff (D3).
      `git diff -U0 docs/MENTOR_BRIEF.md | grep buraqueira` returns nothing
- [ ] Indentation of 3c matches the surrounding nested list

Commit: `docs: fix Phase 4 to retire the pipeline, not the snapshot`

### Edit 4 — Document which repo the Python lane note measures

#### 4a. `docs/explorations/python-laboratory-lane.md` lines 13-15

Find, verbatim:

```
The Python repo is not a temporary overlap awaiting Phase 4. It is a permanent
laboratory lane: it stays Python, and this monorepo absorbs proven mechanisms
one at a time, as briefs.
```

Replace with:

```
The Python repo measured throughout this note is `buraqueira` — not this
repository's `automation/` snapshot, which is a different and much smaller
thing. It is not a temporary overlap awaiting Phase 4. It is a permanent
laboratory lane: it stays Python, and this monorepo absorbs proven mechanisms
one at a time, as briefs.
```

#### 4b. Append to the `## Changelog` section, after the existing 2026-08-08 entry

```
- 2026-08-14 — named `buraqueira` in the body. The measurements were always
  buraqueira's, as the `Origin:` line said, but the body called it only "the
  Python repo" while `CLAUDE.md` named `automation/` as the lab — so a reader
  arriving from there read 12,532 lines as the snapshot's. The laboratory of
  record was ruled the same day; the doctrine correction is task
  `2026-08-14-python-lab-of-record`.
```

Verification:

- [ ] The `Roadmap link:` line (line 11), which credits `automation/` as v2's
      seed, is **unchanged** — that claim is true
- [ ] Every number in the note is unchanged:
      `git diff docs/explorations/python-laboratory-lane.md` contains no
      addition or removal of a digit outside the new changelog entry's dates
      and the figure `12,532`
- [ ] The note still ends with its `## Changelog` section, now two entries
- [ ] Lines wrap at ≤ 79 columns, matching the file

Commit: `docs: document which repo the Python lane note measures`

### Commit sequence

1. `docs(tasks): add brief for python-lab-of-record`
2. `docs: declare buraqueira the Python laboratory of record`
3. `docs: fix Phase 4 to retire the pipeline, not the snapshot`
4. `docs: document which repo the Python lane note measures`

Measured 47, 56, 58 and 55 chars — all ≤ 72 (R10). The verbs were checked
against `VERB_ALLOWLIST` in `.claude/hooks/lib/commit-message.mjs` while
authoring, and chosen for semantic fit rather than availability: `declare` for
the doctrine statement (the precedent is `19bdafc`, "declare the art arm"),
`fix` for #3 because that prose is false and a false statement is fixed rather
than updated, and `document` for #4 because the note's subject was never
recorded in its body — only in its `Origin:` line. Do not substitute `update`
for any of the three; if a hook rejects one, **STOP and report**.

### Automated checks (run before each commit)

- [ ] No build, lint or test applies — no file under `packages/` is touched.
      Confirm with `git diff --name-only origin/main..HEAD | grep packages/`
      returning nothing.
- [ ] The repo's write-time and commit-time hooks pass unassisted. If the
      docs-checks hook flags a line-length or language finding, fix it in the
      same commit.

### Structural checks

- [ ] `git diff --name-only origin/main..HEAD` lists exactly five paths:
      the brief, `CLAUDE.md`, `docs/ROADMAP.md`, `docs/MENTOR_BRIEF.md`,
      `docs/explorations/python-laboratory-lane.md`
- [ ] `automation/` has zero changes: `git diff --stat origin/main..HEAD -- automation/`
      is empty
- [ ] `CLAUDE.md` R26 numbering note (lines 134-139) is untouched

### Behavior checks

- [ ] Reading `CLAUDE.md`'s Architecture section top to bottom, a reader who has
      never seen this ruling can answer "which repo do I read to learn what the
      Python lab does today?" without following a link
- [ ] No sentence anywhere in the five files now claims `automation/` is a
      laboratory, operates, retires, or is archived
- [ ] No sentence anywhere in the five files now denies `automation/` is the
      seed of `core` — that role is preserved in all three of its sites

### Git checks

- [ ] Branch used: `docs/python-lab-of-record`, created from verified `origin/main`
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer, no "Generated with" footer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed; **NO** PR was opened

### Process checks

- [ ] `Plan required: no` — Pause 1 skipped by design
- [ ] Pause 2 — `CLAUDE.md` shown for review after Edit 2 completes, before
      proceeding to Edit 3 (always required)
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message shown
      before each of the four commits (always required)
- [ ] Staged set confirmed to match the current Edit's scope before each
      Pause 3 submission
- [ ] The approved commit message is used verbatim; after each commit,
      `git log -1` is compared against it and amended if it drifted
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any change):** skipped — `Plan required: no`.
- **Pause 2 (after the first modified file):** **required.** The first modified
  file is `CLAUDE.md`; show it after Edit 2 and wait.
- **Pause 3 (before each commit):** show `git status` + `git diff --stat` +
  proposed message. **Always required**, all four commits.

In case of:

- Verbatim find-text not matching the file → **STOP and report** with the
  actual line. Do not fuzzy-match; the line numbers in this brief were measured
  against `4652d2a` and a later `main` may have moved them.
- Unrelated bug found → report and ask. Do not fix.
- Owner rejects D2 at the gate → drop hunk 2c only, ship Edits 2a/2b/3/4.
- A `grep -c` verification returns a different count than stated → **STOP and
  report the actual count.** Do not adjust the brief's number to match.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

- Every change is specified above as verbatim find-and-replace text with exact
  paths and insertion points.
- All decisions are closed (D1–D5), including the one contestable call (D2),
  which carries its own fallback.
- Every judgment call has an explicit STOP-and-report fallback.
- Pause 2 and Pause 3 remain required regardless — Lesson #6 of
  `docs/AGENT_PLAYBOOK.md`.

## Reference documents (read before starting)

1. `CLAUDE.md` — R9, R8, R10, R26
2. `docs/GIT_WORKFLOW.md` — G-R2, G-R3, G-R5, G-A7, and the `claude/*`
   scaffolding-branch section
3. `docs/PROCESS_MAP.md` §7 — artifact naming, the commit-verb allowlist SSOT
4. `docs/sessions/2026-08-14-orchestrator-adf-text-fidelity.md` — "A standing
   ruling the owner gave mid-session"
5. `docs/explorations/python-laboratory-lane.md` — the note being disambiguated
6. `docs/AGENT_PLAYBOOK.md` — Chapter 2, Lesson #6

## Expected output (end of session)

1. Branch name and `git log --oneline main..HEAD` (four commits, ordered)
2. `git diff --stat origin/main...HEAD` (line counts per file, five paths)
3. Every `grep -c` verification from this brief, run and pasted verbatim
4. Any checkbox that could not be met, with explanation — including whether D2
   was accepted or dropped
5. Confirmation that no `git push` was executed and no PR was opened
6. Suggested next step
