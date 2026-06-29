# Brief: 030 — Pure `derivePath` folder-segment derivation in `@saci/core`

> **Category:** M
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `feat/derive-path`

---

## Context

The Drive (and local) workspace hierarchy for a design task is currently
tacit: a human places each task's folder by convention. `derivePath` turns
that convention into deterministic code. Given a resolved task, it returns the
relative folder-path **segments** where the task's workspace lives — joined by
the caller against the local root and against the Drive root respectively.
This is the first workflow-loop function and a prerequisite for the future
`start` command (it cannot scaffold a folder it cannot locate).

This is a **caminho-A handoff** brief (same model as brief 029): the planner
(main session) authored it from static code verification; the **executor**
must verify the live-Jira premises at Pause 1 before relying on them. The
`## Critical findings` section below records two static-verification results
(FINDING 1, FINDING 2) that the executor folds into the implementation and
confirms live where flagged.

`derivePath` is scoped to the **alpha target** (MCA tasks). Many adjacent
concerns (campaign resolution, copy ingestion, period→drive-root resolution,
file-name generation, scaffolding) are explicitly parked — see "Out of scope".

## Goal

Implement a pure function `derivePath` in `@saci/core` that, given a resolved
task input, returns the relative workspace folder-path as a
`readonly string[]` of segments, deterministically and without I/O. Cover the
function with colocated `node:test` unit tests.

Out of scope (park; do not build):

- **campaign resolution** — the `campaign` slot is a contract only; in alpha
  it is always `null`, so the grouping segment is always the `"avulsas"`
  bucket. No populating source exists. Do **not** add a speculative `campaign`
  field to the shared `Issue` payload (A3).
- **copy ingestion / resolution** — unrelated to folder location.
- **period → Drive-root resolution** — `derivePath` returns segments *from the
  semester root downward*; resolving the absolute Drive/local root is the
  caller's job.
- **file-name generation** — `derivePath` returns **folder** segments only,
  never a file name.
- **PMA / Jornalismo flow; Performance flow** — alpha is MCA only.
- **`start` / `ship` / `load` commands, manifest read/write, template apply,
  on-disk scaffolding** — all downstream of this function.
- Any `customfield_*` literal, Jira REST call, or adapter import in `core`
  (R25).

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `packages/core/src/derive-path.ts` (new — implementation)
   - `packages/core/src/derive-path.test.ts` (new — colocated tests)
   - `packages/core/src/index.ts` (modify — export the new public symbols,
     only if `core` re-exports its public surface there; if it does not,
     leave it untouched and note that)
   - `docs/tasks/030-derive-path/brief.md` (this file — commit #1 only)

   If anything else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md`, especially:
   - **R25** — `core` defines domain logic; it never imports an adapter and
     carries no `customfield_*` literal. Verify: `grep -rn 'from.*adapter'
     packages/core/src/derive-path.ts` returns nothing; `grep -n
     'customfield' packages/core/src/derive-path.ts` returns nothing.
   - **R20 / R24** — strict mode; no `any` (use `unknown` + narrowing where an
     input needs it). No `// @ts-ignore` / `// @ts-expect-error`.
   - **R21** — ESM only; `.js` extension in every relative import.
   - **R23** — `node:test`; test file colocated as `derive-path.test.ts`.
   - **R7** — named constants (`SCREAMING_SNAKE_CASE`) for the slug length cap,
     the `"avulsas"` bucket value, and the `YYYY-MM` month format identifier.
   - **R8** — comments answer "why" (invariants, the bracket-extraction
     workaround, the date-fallback rationale), not "what".
   - **R5 / R6** — source file ≤ 400 lines; functions ≤ 50 lines (split the
     slug sanitizer and the month deriver into helpers as needed).
   - **R4** — no silent `catch`; the deterministic fallbacks below are the
     documented contract, not swallowed errors.
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `feat/derive-path`
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5). Caminho-A: the executor commits,
     opens the PR, and hands the link to Rafael, who merges. Never auto-merge.
4. The function is **pure and total**: same input → same output; never throws;
   never performs I/O; never fabricates a date or emits an empty segment.

### Conventions

- Agent-consumed surface is English-only (R9): identifiers, comments, the test
  descriptions, and the commit messages are English.
- Commit type/scope: `feat(core)` for the implementation/test commit;
  `docs(tasks)` for the brief commit.
- Pause names are English ("Pause 1/2/3") per R9.

### Architectural decisions already made (do not revisit)

These were closed in the design session. The executor implements them; it does
not propose alternatives. If a decision proves unworkable mid-execution,
**STOP and report** — do not silently re-decide.

#### D1 — Pure core

`derivePath` lives in `@saci/core`. No I/O, no `fs`, no network, no
`customfield_*` literal (R25). It consumes already-resolved **semantic**
fields, never the raw Jira issue shape.

#### D2 — Return type: `readonly string[]` (segments), not a joined string

`derivePath` returns `readonly string[]` — the ordered path segments from the
semester root downward. Callers join them with `path.join` against the local
root and the Drive root respectively, which keeps the function cross-platform
(R1) and root-agnostic.

**Recorded deviation from ROADMAP:** `docs/ROADMAP.md:184-186` describes
`derivePath(issue) → string` (a joined string). This brief intentionally
returns **segments** instead, because joining requires a platform-specific
separator and a root that `core` must not own. The deviation is deliberate;
the executor does not "fix" the return type to match ROADMAP. (ROADMAP
reconciliation, if wanted, is a separate docs brief — out of scope here.)

#### D3 — Path form (alpha/beta target)

Relative, from the semester root downward, four segments:

```
<grouping> / <vertical> / <YYYY-MM> / <KEY>_<slug>
```

Concrete example (alpha target, MCA):
`AVULSAS / EC / 2026-06 / MCA-101_kv-aulao`

- **grouping** — `campaign` when present, else the bucket constant
  `"avulsas"`. Contract: `campaign: string | null`. In alpha scope (MCA)
  `campaign` is **always** `null` → grouping is always the constant. The
  grouping segment sits **above** vertical. (The old structure was
  `SEMESTRE / AVULSAS / <vertical> / <time…>`; the new one promotes vertical
  directly under grouping and collapses the time levels into one `YYYY-MM`.)
- **vertical** — the resolved vertical as a **short code** (e.g. `EC`). See
  **FINDING 1**: the payload field is `[CODE] Name`, not a bare code.
- **month** — derived from the `entrega` (delivery) datetime, formatted
  `YYYY-MM` (time discarded). When `entrega` is null, fall back per
  **FINDING 2** (resolved below). Deterministic; never throws, never
  fabricates a date.
- **leaf** — `<KEY>_<slug>`. `KEY` = the Jira issue key (guarantees
  uniqueness across sibling subtasks). `slug` = sanitized summary (D4).

#### D4 — Slug sanitization (leaf only)

Grouping and vertical are codes, not free text — only the leaf slug is
sanitized. Sanitizer steps, in order:

1. lowercase;
2. strip diacritics via Unicode NFD decomposition (drop combining marks);
3. replace any char outside `[a-z0-9-]` with a hyphen;
4. collapse repeated hyphens into one;
5. trim leading/trailing hyphens;
6. cap at the named length constant (~60 chars).

**Empty-slug fallback (judgment guard):** if the sanitized slug is empty (e.g.
a summary of only symbols/diacritics that reduce away), the leaf is `KEY`
**only** — `derivePath` must never emit an empty segment and never emit a
trailing `_`. The executor must include an explicit test for the empty-slug
case. This is a closed rule; do not invent a placeholder slug.

#### D5 — Input shape is the executor's design call

The function's input type is the executor's call: full `Issue` payload vs. a
focused, purpose-built input type. Hard constraint: `campaign` has **no**
populating source yet (parked), so it is `null`/`"avulsas"` across all of
alpha. **Do not** add a speculative `campaign` field to the shared `Issue`
payload if nothing fills it (A3). Shape the input so the grouping slot is
satisfiable **today** (i.e. the input can express "no campaign" without a new
shared-payload field). A focused input type local to `derive-path.ts` is the
expected resolution, but the executor may justify reusing `Issue` if it avoids
the speculative-field trap. State the chosen shape at Pause 1/2.

## Critical findings

These were verified statically by the main session against the current code.
Fold them into the implementation. Do **not** contradict them. The two
live-confirmation flags (FINDING 1, FINDING 2) are the Pause-1 verification
obligations of this caminho-A handoff.

### FINDING 1 — `vertical_raw` is `[CODE] Name`, not a bare code

`packages/core/src/payload.ts:23` documents `vertical_raw: string` as e.g.
`"[EC] Concursos"` — a bracketed short code **plus** the full name.
`safeGetVertical` (`packages/adapter-jira/src/extract.ts:192`) reads `.value`
off the custom-field array/object shape and returns that raw string verbatim.

**Resolution to implement:** the vertical segment is the **code extracted from
the `[CODE] Name` form** — not the raw value used directly. The executor
decides where bracket-extraction lives:

- inside `derivePath` (consuming `vertical_raw` and extracting the code), or
- in an upstream resolver that feeds a pre-cleaned code into the focused input
  type (D5).

Either is acceptable; state which at Pause 1/2. The extraction is pure string
work, so it stays in `core` regardless.

**Pause-1 STOP-and-confirm guard (judgment flag):** before relying on the
`[CODE] Name` shape, the executor confirms via the Atlassian MCP that live MCA
tasks' `customfield_10065` actually return the `[CODE] Name` form, and that the
live code set matches D3's expected codes: **EC, ECJ, EPJ, OAB, EE, ES, CFC,
EEDU**. If the live field instead returns a long name or an id with **no**
embedded code, the segment needs a `value → code` map, which is **config
(cli), not core** → **STOP and confirm scope** with Rafael before writing any
mapping into `core`. Do not silently implement a value→code table in `core`.

### FINDING 2 — `created` is ABSENT from the payload `Issue` contract

`packages/core/src/payload.ts` carries `key, summary, parent_key,
parent_summary, status_jira, vertical_raw, entrega_iso, copy_url, copy_source,
jira_updated_at` and **no** `created` field (a grep over `core` + adapter
confirms zero matches). The naive D3 fallback "use the created month when
`entrega` is null" therefore references a field with **no populating source
today**.

**Resolution to implement — chosen option (b):** use **`jira_updated_at`** as
the month fallback when `entrega_iso` is null. Rationale: `jira_updated_at` is
already in the payload contract and is **non-null** (`updated or ""` in the
seed), so the fallback is satisfiable today with no payload-shape change and no
new extract/mapper work (which would be out of scope). The executor wires the
input (D5) so the fallback source is whichever field carries `jira_updated_at`.

- Options weighed and **not** chosen: **(a)** add a `created` field to the
  focused input and flag it needs a populating source — rejected because
  adding `created` to the shared `Issue` payload requires an extract/mapper
  change out of scope, and a focused-input `created` would have nothing to
  fill it; **(c)** park the fallback entirely — rejected because a null
  `entrega` is a real alpha case and the function must stay total.
- **Determinism guard (judgment flag):** the fallback is deterministic and
  **never fabricates a date**. If *both* `entrega` and the fallback source are
  null/empty/unparseable, `derivePath` must not throw and must not invent
  "today". The executor decides the degenerate-month behavior (e.g. a named
  sentinel segment) and **states it at Pause 2**; it must be a stable,
  documented constant, never a clock read. If the only safe behavior appears
  to be throwing, **STOP and report** instead.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The brief was authored to `docs/tasks/030-derive-path/brief.md` on branch
`feat/derive-path` before the executor was invoked. The executor verifies
presence and commits it as commit #1.

- [ ] Directory `docs/tasks/030-derive-path/` exists
- [ ] File `docs/tasks/030-derive-path/brief.md` exists; first line is
      `# Brief: 030 — Pure \`derivePath\` folder-segment derivation in \`@saci/core\``
- [ ] `git add docs/tasks/030-derive-path/brief.md` is staged
- [ ] Commit #1 created with subject `docs(tasks): add brief for 030-derive-path`

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

**P4 numbering evidence (recorded per authoring gate):**

- `ls docs/tasks/` → highest existing is `029-configurable-field-mapping`.
- `git log --oneline main` → newest task brief is 029 (`docs: recaps +
  §2/ROADMAP reconciliation for brief 029 (#72)`); no 030 merged.
- `CLAUDE.md` E* exceptions → none reserve slot 030; the 029 brief reserves no
  030 successor.

All three sources agree → `030`.

### Edit 2 — Implement `derivePath` and colocated tests

Create `packages/core/src/derive-path.ts` implementing `derivePath` per
D1–D5 and FINDING 1–2, and `packages/core/src/derive-path.test.ts` covering
the cases below. Export the public symbols (the function and its input type)
from `core`'s public surface (via `index.ts` if that is how `core` re-exports;
otherwise leave `index.ts` untouched and note it).

Named constants (R7): the slug length cap, the `"avulsas"` grouping bucket,
and the `YYYY-MM` month format identifier are declared as
`SCREAMING_SNAKE_CASE` module constants.

Verification:

- [ ] `packages/core/src/derive-path.ts` exists; exports `derivePath` and its
      input type
- [ ] Return type is `readonly string[]` (D2)
- [ ] `grep -n 'customfield' packages/core/src/derive-path.ts` → no matches (R25)
- [ ] `grep -rn 'from.*adapter' packages/core/src/derive-path.ts` → no matches (R25)
- [ ] `grep -n ': any' packages/core/src/derive-path.ts` → no matches (R24)
- [ ] Slug cap, `"avulsas"` bucket, and month format declared as named
      constants (R7)
- [ ] Source file ≤ 400 lines (R5); every function ≤ 50 lines (R6)
- [ ] `tsc -p packages/core` builds with no errors (strict, R20)

Test coverage (R3 / R23 — `node:test`, colocated):

- [ ] Happy path: MCA task with `entrega` present and a normal summary →
      `["AVULSAS", "EC", "2026-06", "MCA-101_kv-aulao"]` (or the agreed casing)
- [ ] FINDING 1: `vertical_raw` of the form `"[EC] Concursos"` yields the code
      segment `EC`
- [ ] FINDING 2: `entrega` null → month derived from the `jira_updated_at`
      fallback (deterministic, no clock read)
- [ ] Degenerate date: both `entrega` and the fallback null/empty → the agreed
      stable behavior (no throw, no fabricated "today")
- [ ] Slug: diacritics stripped, non-`[a-z0-9-]` replaced, repeats collapsed,
      ends trimmed, capped at the named length
- [ ] Empty-slug fallback (D4): summary sanitizes to empty → leaf is `KEY`
      only, with no trailing `_` and no empty segment
- [ ] `campaign` null → grouping segment is the `"avulsas"` constant (D3/D5)
- [ ] `node --test` over compiled `dist/` passes

Commit: `feat(core): add derivePath folder-segment derivation`

### Automated checks (run before each commit)

- [ ] `tsc -p packages/core` passes without errors
- [ ] `node --test` over `packages/core/dist/**/*.test.js` passes
- [ ] No new runtime dependency added (R2)

### Structural checks

- [ ] Expected files exist at expected paths
- [ ] `packages/core/src/derive-path.ts` first symbols match the spec
- [ ] No file outside the in-scope list was modified
      (`git diff --name-only origin/main..HEAD`)

### Behavior checks

- [ ] `derivePath` is total: every test input returns without throwing
- [ ] Output is always exactly 4 non-empty segments
- [ ] Same input → same output (no clock, no randomness, no I/O)

### Git checks

- [ ] Branch used: `feat/derive-path`
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] `Plan required: no` — Pause 1 is the **mandatory live-Jira
      verification** (FINDING 1 code set + `[CODE] Name` shape) and the
      input-shape statement, not a full numbered plan
- [ ] Pause 2 — first modified file (`derive-path.ts`) shown for review;
      degenerate-month behavior (FINDING 2) and input shape (D5) stated
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message shown
      before each commit
- [ ] `pre-commit-self-audit` skill output reported in chat before each Pause 3
- [ ] Any criterion that could not be met was reported explicitly

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code): REQUIRED.** Although `Plan required: no`, this
  caminho-A handoff makes Pause 1 a **mandatory live-Jira verification gate**,
  not a skip. The executor must, before writing code:
  1. Confirm via Atlassian MCP that live MCA `customfield_10065` returns the
     `[CODE] Name` form and that the code set matches D3 (EC, ECJ, EPJ, OAB,
     EE, ES, CFC, EEDU). If not → **STOP** per FINDING 1's scope guard.
  2. State the chosen input shape (D5) and where bracket-extraction lives
     (FINDING 1).
  3. State the resolved FINDING 2 fallback wiring and the degenerate-month
     behavior.
- **Pause 2 (after the first modified file): always required.** Show
  `derive-path.ts` and confirm the FINDING 2 degenerate behavior and D5 shape.
- **Pause 3 (before each commit): always required.** Show `git status` +
  `git diff --stat` + proposed message + `pre-commit-self-audit` output.

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md` as a
  follow-up brief.
- Live Jira contradicts FINDING 1's expected shape/code set → **STOP and
  confirm scope** (a value→code map is config, not core).

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: no` because:

- Every change is specified above with exact paths, the D3 path form, the D4
  sanitizer steps, the named-constant requirements, and the test-case list.
- All architectural decisions are closed (D1–D5) and the two open code
  questions (FINDING 1, FINDING 2) have closed resolutions with explicit
  STOP-and-report fallbacks.
- The remaining judgment calls (input shape D5, bracket-extraction site,
  degenerate-month behavior) are bounded and surfaced at Pause 1/2.

**Pause 1 (live-Jira verification) is nonetheless REQUIRED** for this
caminho-A handoff, and **Pause 2 and Pause 3 remain required** regardless
(Lesson #6 of `docs/AGENT_PLAYBOOK.md`).

## Git workflow

### Branch

`feat/derive-path` — cut from up-to-date `main`. Type `feat` (the brief adds a
new capability to `core`).

### Commit sequence

1. `docs(tasks): add brief for 030-derive-path`
2. `feat(core): add derivePath folder-segment derivation`

Both subjects verified ≤ 72 chars. Leading verbs (`add`, `add`) are on the
`pre-commit-self-audit` allowlist. **DO NOT push** — the executor opens the PR
and hands the link to Rafael, who merges.

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules (esp. R25, R20/R24, R21, R23, R7, R5/R6)
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — known traps
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6, caminho-A
5. `packages/core/src/payload.ts` — the `Issue` contract (FINDING 1, FINDING 2)
6. `packages/adapter-jira/src/extract.ts` — `safeGetVertical` (FINDING 1)
7. `docs/tasks/029-configurable-field-mapping/brief.md` — caminho-A precedent
8. `.claude/skills/brief-template/SKILL.md` — template reference
9. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit (Pause 3)

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. The Pause-1 live-Jira verification result (FINDING 1 confirmed or STOP)
4. The resolved input shape (D5), bracket-extraction site (FINDING 1), and
   degenerate-month behavior (FINDING 2)
5. Any verification checkbox that could not be met, with explanation
6. Confirmation that no `git push` was executed
7. Suggested next step (open PR for Rafael to merge)
