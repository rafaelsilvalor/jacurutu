# Brief: 2026-08-14 — ADF text extraction keeps the source's structure

> **Category:** M
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `fix/adf-text-fidelity`

---

## Context

`adfExtractText` (`packages/adapter-jira/src/extract.ts`) projects an ADF tree
to plain text by joining **every** text node with a single space. Two defects
follow from that one join, and finding #6 of
`docs/explorations/jira-copy-locality.md` measured the first on 2026-08-12: a
two-frame document yields one flat line, so an anchored per-line marker regex
counts 1 where the source has 2. A Jira-authored carousel silently reads as a
one-frame piece.

The second defect is the same join seen from the other side. Inside a single
paragraph, adjacent inline runs — the two halves a bold mark leaves behind —
are also joined with a space, so a phrase split by formatting gains a space it
never had.

The function has **no production caller** today: `navigation.ts` imports
`adfExtractDriveUrls` and `extractUrlsFromComments`, not this one. It is fixed
now because the consumer that will call it is the art arm's copy read, and
porting a marker parser onto a lossy extractor bakes the defect underneath it.
That absence is why the Done criteria below prove the fix by unit test only —
there is no end-to-end path to run.

## Goal

Make `adfExtractText` preserve the block structure and the exact inline
spacing of the ADF source it reads.

Out of scope:

- **The frame-marker parser itself.** It has 0 sites in this repository; it
  lives in the Suindara laboratory and arrives with its own port brief.
- `adfExtractUrls`, `adfExtractDriveUrls`, `extractUrlsFromComments`,
  `safeGetEntrega`, `safeGetVertical` — untouched, and their tests unchanged.
- Wiring any consumer to `adfExtractText`.
- `automation/` — not read as authority, not modified, not cited as a reason
  to keep or change behavior. The laboratory lane doctrine is being restated
  by the owner and that restatement is its own task, not this one.
- `docs/GOTCHAS.md` — a defect fixed in the same commit that names it is not
  a trap anybody will step in again.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/2026-08-14-adf-text-fidelity/brief.md`
   - `packages/adapter-jira/src/extract.ts`
   - `packages/adapter-jira/src/extract.test.ts`
   - `docs/explorations/jira-copy-locality.md`

   If anything else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md`, especially **R3** (pure logic is unit
   tested), **R7** (named constants for policy values), **R8** (comments answer
   *why*), **R9** (English-only on this surface), **R14** (a `refactor:` has no
   behavior change — this task is a `fix:` precisely because it does),
   **R20**/**R24** (strict, no `any`), **R23** (`node:test`).
3. Follow `docs/GIT_WORKFLOW.md` fully:
   - The session opens on a `claude/*` scaffolding branch. Before Edit 1, run
     `git switch -c fix/adf-text-fidelity` from `19bdafc` — the verified base.
   - Conventional Commits (G-R3), subjects ≤ 72 chars
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
4. **The tree is green at every pause.** The test change and the source change
   ship in **one commit**, not two. `green-boundary.mjs` is a Stop hook: it runs
   `npx tsc -b` and `npm test` whenever the working tree touches `packages/`,
   and a turn cannot end red. A test-first commit would leave Pause 3 red and
   block the turn that presents it.

### Conventions

- English on every surface this task touches (R9), including test descriptions.
- Commit scope is `adapter-jira` for the code commit, `explorations` for the
  doc commit.
- Verbs come from `VERB_ALLOWLIST` in `.claude/hooks/lib/commit-message.mjs`.
  A verb on neither list is a STOP, not a judgment call.

### Architectural decisions already made (do not revisit)

#### D1 — Block-level nodes end a line

These ADF node types emit a line break after their content:
`paragraph`, `heading`, `blockquote`, `codeBlock`, `listItem`, `panel`,
`tableCell`, `tableHeader`, `rule`. A `hardBreak` node emits a line break in
place of its (absent) content. The set is declared as a module-level named
constant (R7), next to the existing `URL_ATTR_NODE_TYPES`.

The list is derived from the ADF specification by reading, not from a sample of
real board descriptions. A node type absent from the set degrades to the old
behavior for that node — it joins inline — which is the safe direction.

#### D2 — Inline runs join with nothing

Sibling text nodes concatenate with the empty string. ADF text nodes carry
their own whitespace; the space this function used to insert was never in the
source. This is the fix for the second defect and it rewrites the existing test
at `extract.test.ts:116`, which pins the wrong behavior by name
(`"concatenates text nodes with single spaces"`).

#### D3 — Output is normalized per line

After the walk, the result is split on the line break, each line is trimmed,
empty lines are dropped, and the lines rejoin with a single line break. This
absorbs the double break a nested `listItem > paragraph` produces and the
trailing spaces a block's last text node may carry, in one pass.

Consequence, accepted: an intentionally empty paragraph does not survive as a
blank line. No consumer needs one.

#### D4 — The Python seed is not a constraint

`adfExtractText` was ported behavior-preserving from a Python seed, and the
header comment says so. That provenance is a historical fact and stays in the
comment; it is **not** a reason to preserve the flattening. Nothing in
`automation/` is read, modified, or cited by this task.

#### D5 — The commit verb is `support`

`fix(adapter-jira): support block structure in ADF text extraction` (65 chars).
`preserve` is the more precise verb and is on neither list, which makes it a
C11/check-3 STOP; `support` is allowlisted and semantically defensible — the
function gains handling for block nodes and `hardBreak` that it did not have.
Do not substitute `update`.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The brief was pre-saved to `docs/tasks/2026-08-14-adf-text-fidelity/brief.md`
before execution (caminho B). The executor verifies presence and commits.

- [ ] Branch `fix/adf-text-fidelity` exists and is checked out, cut from
      `19bdafc`
- [ ] Directory `docs/tasks/2026-08-14-adf-text-fidelity/` exists
- [ ] File `brief.md` exists; first line matches the title above
- [ ] `git add docs/tasks/2026-08-14-adf-text-fidelity/brief.md` is staged
- [ ] Commit #1 created

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

Commit: `docs(tasks): add brief for 2026-08-14-adf-text-fidelity`

### Edit 2 — Rewrite the walk and its tests in one commit

Two files, one commit, per non-negotiable constraint 4. Pause 2 falls after the
first of them.

#### 2a. `packages/adapter-jira/src/extract.ts`

Add a module-level `BLOCK_NODE_TYPES` constant carrying D1's nine types, typed
`ReadonlySet<string>`, placed beside `URL_ATTR_NODE_TYPES`, with a one-line
comment stating *why* the set exists (the anchored-regex measurement), not what
it contains.

Replace the body of `adfExtractText` with a two-part shape:

- a private recursive walk that returns `node.text` for a text node, a line
  break for a `hardBreak`, and otherwise the concatenation of its children —
  appending one line break when the node's own type is in `BLOCK_NODE_TYPES`;
- a private normalizer implementing D3, applied once by the exported function.

Both helpers stay in this file, unexported, above or below the exported
function as the file's existing order suggests. `isRecord` and `asString` are
reused, not duplicated. No `any`, no `@ts-ignore`.

Update the doc comment on `adfExtractText`: it must state that block nodes end
a line and inline runs do not gain a space, and that this diverges from the
seed deliberately (D4). Keep it short — R8.

#### 2b. `packages/adapter-jira/src/extract.test.ts`

The existing test named `"adfExtractText concatenates text nodes with single
spaces"` is **replaced**, not kept alongside a new one: its name and its
assertion both encode the defect. The test named
`"adfExtractText returns empty for a non-record node"` stays as is.

Add tests covering, one assertion each:

1. Two sibling paragraphs project to two lines.
2. Two inline runs inside one paragraph join with no inserted space — the
   fixture's own trailing space is the only space in the expected value.
3. A `hardBreak` between two runs projects to a line break.
4. A nested `bulletList > listItem > paragraph` projects to one line per item,
   with no blank line between them.
5. **The F6 regression**: a document whose paragraphs each open with a frame
   marker yields a match count equal to the number of frames under a
   line-anchored global regex. Assert the count, and write the regex into the
   test rather than importing one — the production parser is out of scope and
   does not exist here.
6. A non-record child and an empty paragraph are both absorbed without
   throwing and without emitting a blank line.

Verification:

- [ ] `grep -c 'join(" ")' packages/adapter-jira/src/extract.ts` returns `0`
- [ ] `grep -n 'BLOCK_NODE_TYPES' packages/adapter-jira/src/extract.ts` shows
      the declaration and exactly one use inside the walk
- [ ] `grep -n 'concatenates text nodes with single spaces'
      packages/adapter-jira/src/extract.test.ts` returns nothing
- [ ] `npx tsc -b` exits 0
- [ ] `npm run test:packages` reports **0 fail**, and the adapter-jira test
      count is higher than the 324-total baseline recorded at `19bdafc`
- [ ] `git diff --name-only` lists exactly the two files of this Edit
- [ ] `wc -l packages/adapter-jira/src/extract.ts` stays under 400 (R5) and
      `extract.test.ts` under 800 (E6)

Commit: `fix(adapter-jira): support block structure in ADF text extraction`

### Edit 3 — Close finding F6 in the exploration note

`docs/explorations/jira-copy-locality.md` records F6 as brief-shaped and open.
Add one dated bullet to its `## Changelog` stating that F6 is fixed, naming
this task id and the commit's scope, and — in the F6 section itself — a single
closing line pointing at this task. Do not rewrite the finding's measurement:
it was true when measured and the note is the historical record of that run.

Verification:

- [ ] The `## Changelog` carries a new `- 2026-08-14 — …` bullet naming
      `2026-08-14-adf-text-fidelity`
- [ ] The F6 section carries a closing pointer and its original measurement
      paragraphs are byte-identical to `19bdafc` (`git diff` shows additions
      only in that section)
- [ ] No other exploration note is touched

Commit: `docs(explorations): document the F6 fix in the copy-locality note`

### Commit sequence

1. `docs(tasks): add brief for 2026-08-14-adf-text-fidelity`
2. `fix(adapter-jira): support block structure in ADF text extraction`
3. `docs(explorations): document the F6 fix in the copy-locality note`

### Automated checks (run before each commit)

- [ ] `npx tsc -b` passes without errors
- [ ] `npm test` passes (packages plus hooks)

### Structural checks

- [ ] Expected files exist at expected paths
- [ ] No file outside the in-scope list was modified
      (verify via `git diff --name-only main..HEAD`)

### Behavior checks

- [ ] A two-paragraph document projects to two lines
- [ ] A phrase split by a bold mark projects with the source's spacing, not
      one space more
- [ ] A line-anchored global marker regex counts one match per frame
- [ ] A non-record input still returns the empty string

### Git checks

- [ ] Branch used: `fix/adf-text-fidelity`, cut from `19bdafc`
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 2 — first modified file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed commit message
      shown before each commit
- [ ] Staged set confirmed to match the current Edit's scope before each
      Pause 3 submission
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

- **Pause 1 (before any code):** skipped — `Plan required: no`.
- **Pause 2 (after the first modified file):** required, after `extract.ts`.
- **Pause 3 (before each commit):** required, three times.

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document as a follow-up brief.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

- Every change is specified above: D1 names the node set, D2 the join, D3 the
  normalization, D5 the commit subject.
- The one judgment call inside the code — where the two private helpers sit in
  the file — cannot change behavior.
- The file scope is four paths, and anything outside them is a STOP.

Pause 2 and Pause 3 remain required regardless — Lesson #6 of
`docs/AGENT_PLAYBOOK.md`.

## Reference documents (read before starting)

1. `CLAUDE.md` — R3, R7, R8, R9, R14, R20, R23, R24
2. `docs/GIT_WORKFLOW.md` — the `claude/*` scaffolding branch section
3. `docs/explorations/jira-copy-locality.md` — finding F6, the measurement
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2, Lesson #6
5. `.claude/hooks/green-boundary.mjs` — why Edit 2 is one commit
6. `packages/adapter-jira/src/navigation.ts` — the callers this task does not
   touch

## Expected output (end of session)

1. Branch name and `git log --oneline main..HEAD`
2. `git diff --stat main...HEAD`
3. Any verification checkbox that could not be met, with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step
