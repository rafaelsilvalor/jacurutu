# Brief: 2026-08-11 — Instrument the mechanical gates at runtime

> **Category:** L
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `chore/gate-runtime-instrumentation`

---

## Context

`docs/explorations/gate-economics.md` measured the harness before it was rebuilt
and named its own successor: "a stronger measurement would instrument the gates
at runtime rather than read their prose afterwards. That is possible now that
hooks exist." Every number in that baseline came from recaps written by the
sessions being measured, which is the limitation the note declares about itself
under "What this does NOT establish". The successor has not started, and
`docs/sessions/2026-08-09-orchestrator-harness-redesign-continued.md` records it
as item 3 of what the redesign still owes.

The five hooks landed on `main` at `4b43cc8` (#130). They already reach a
verdict on every commit and every write; they simply throw it away. This task
makes the verdict durable so Finding 1 — "the mechanical validator has low,
partly self-inflicted yield" — can be re-tested against runtime data instead of
against prose.

P4 evidence for the slug `gate-runtime-instrumentation`, re-run on 2026-08-11
against the four sources:

1. `ls docs/tasks/` — 51 entries; the three carrying the word "gate" are
   `018-pipeline-authoring-gate`, `027-playbook-mentor-gate` and
   `045-gateway-manifest-shape`. No match.
2. `git log --oneline main` — 130 merges, no occurrence of the slug.
3. `grep -rn 'gate-runtime-instrumentation' CLAUDE.md docs/` — exit 1, no
   output. No `E*` reserve and no exploration note claims it.
4. `git branch -a` and `git worktree list` — no match. The near neighbour is
   this session's scaffolding worktree, `gate-economics-runtime-instrumentation`
   at 37 chars, a different string and not a slug claim.

Four sources agree the slug is free, so no ordinal suffix applies — the
suffix rule is `docs/PROCESS_MAP.md` §7, which applies it only on collision.

**Size note.** This brief runs past the Category L planner-delegated range in
`.claude/skills/brief-template/SKILL.md` and does not split. Two reasons, and
the first is structural: although a planner authored it, the brief carries
thirteen owner-closed decisions with their rationale and specifies verbatim
prose for the files it touches, which is the doctrinal shape the skill measures
at 350-650 lines of substance rather than the delegated shape at 200-400. The
second is the split test. Edits 2 through 4 — the emission seam, the check
identifiers and the wiring — are one another's verification: a seam that emits
nothing proves nothing, identifiers nobody records are dead fields, and wiring
without the D5 invariant test is a change to five live gates on trust. Edit 5
closes on the stream's real shape, and Edit 6 is the disposition amendment D10
requires of this brief specifically. A sub-brief delivering any one of them
would close on incomplete evidence.

## Goal

Make every mechanical verdict the five hooks reach observable after the fact:
each hook records which check spoke, what it decided, and a stable fingerprint
of the input it inspected, into an append-only local stream that a reader
aggregates into yield per check.

Out of scope:

- **Pauses and decision points.** Pause 1, Pause 2, Pause 3, the write gate and
  the push gate are not instrumented (D2).
- **The digest note itself.** `docs/explorations/gate-runtime-yield.md` is the
  declared destination of the data, authored at window close in a Mentor
  session. This task does not author it (D9).
- **Any change to a verdict.** No check is added, retired, loosened or
  tightened. `decision` and `reason` stay byte-identical (D6).
- **`packages/**`.** No product code is touched. The green boundary must stay
  green, and it stays green by not being disturbed.
- **Doctrine surfaces, with one ruled exception.** `CLAUDE.md` gains exactly
  one line — the pointer to the reader CLI, in the `.claude/hooks/` bullet
  under "Related Documents", specified verbatim in Edit 5. Nothing else in that
  file changes, and `docs/PROCESS_MAP.md`, `docs/AGENT_PLAYBOOK.md` and
  `docs/GIT_WORKFLOW.md` stay untouched. `docs/PROCESS_MAP.md` §4.1 was
  considered as the home and rejected: that table is "the checks that are no
  longer roles", and the reader is not a check — it decides nothing and blocks
  nothing, so it would enter a table whose premise it does not satisfy.
- **Any edit to the 61 existing hook test blocks** (D6).

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/2026-08-11-gate-runtime-instrumentation/brief.md`
   - `docs/tasks/2026-08-11-gate-runtime-instrumentation/notes.md` (new) —
     added by owner ruling on 2026-08-11 (finding F-3 in that file): it is a
     canonical task artifact under `docs/PROCESS_MAP.md` §7 and is created by
     protocol, so the list names it rather than leaving a permanent asterisk on
     the structural check below
   - `.claude/hooks/lib/telemetry.mjs` (new)
   - `.claude/hooks/lib/telemetry.test.mjs` (new)
   - `.claude/hooks/lib/gate-yield.mjs` (new)
   - `.claude/hooks/lib/gate-yield.test.mjs` (new)
   - `.claude/hooks/gate-yield.mjs` (new)
   - `.claude/hooks/lib/commit-message.mjs`
   - `.claude/hooks/lib/commit-message.test.mjs` (append only)
   - `.claude/hooks/lib/ownership.mjs`
   - `.claude/hooks/lib/ownership.test.mjs` (append only)
   - `.claude/hooks/lib/architecture.mjs`
   - `.claude/hooks/lib/architecture.test.mjs` (append only)
   - `.claude/hooks/commit-guard.mjs`
   - `.claude/hooks/architecture-guard.mjs`
   - `.claude/hooks/docs-guard.mjs`
   - `.claude/hooks/file-ownership.mjs`
   - `.claude/hooks/green-boundary.mjs`
   - `.gitignore`
   - `docs/explorations/gate-economics.md`
   - `CLAUDE.md` — **qualified**: exactly one line added to the
     `.claude/hooks/` bullet under "Related Documents", verbatim as given in
     Edit 5. No other line of that file may change.

   If anything else needs changing, **STOP and ask**. `.claude/settings.json`
   in particular is out of scope: no new hook is registered, so no wiring
   changes.
2. Follow all rules in `CLAUDE.md`, especially R2 (no new runtime
   dependencies), R4 (no silent catch), R5 (400-line source budget), R7 (named
   constants for policy values), R9 (English on the agent-consumed surface) and
   R17 (never push).
3. Follow `docs/GIT_WORKFLOW.md` fully:
   - Branch `chore/gate-runtime-instrumentation`, cut from `4b43cc8` (D11)
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5 / R17). The owner pushes and opens
     the PR.
   - No `STATE.md`: this is a single-session task.
4. **Builtins only.** `node:fs`, `node:crypto`, `node:child_process`,
   `node:url`, `node:os` and `node:path` are the whole import surface for the
   new code. This closed list is owner-ratified: R2 governs npm runtime
   dependencies and a Node builtin is not one; `node:crypto` is required by
   D6's hash, and hand-rolling one would be worse code whose cross-version
   stability nobody verified — and the historical series would depend on it.
   The delegation's narrower "`node:fs` only" wording was imprecise, not
   restrictive by design. `node:os` and `node:path` were added by owner ruling
   R-2 on 2026-08-11, recorded in
   `docs/tasks/2026-08-11-gate-runtime-instrumentation/notes.md`: `os.tmpdir()`
   keeps test scratch out of the very directory the measurement reads, and R1
   asks for `path.join` in those words. If a builtin outside this list is
   needed, **STOP and ask**.
5. **The green boundary must stay green**: 324 package tests (323 pass, 1 skip)
   plus 61 hook tests, 0 failures. New tests add to that count. Not one of the
   61 existing test blocks may be edited (D6); appending new `test(...)` blocks
   to an existing file is expected and is not an edit to an existing block.
6. **No record ever carries file content.** Only a hash, a coarse input kind,
   and — for one input kind — a repository-relative path. `scanSecrets`
   evidence lines are the reason this is a hard rule and not a preference.

### Conventions

- Hook code is ESM `.mjs`. The decision logic lives in pure, injectable modules
  under `.claude/hooks/lib/` with `node:test` fixtures beside them; the
  executable at `.claude/hooks/` stays a thin shell that reads stdin, calls the
  module, and exits. That split is what makes D5's test possible at all.
- Test files map 1:1 to a subject module and carry the subject's name plus
  `.test.mjs`. `npm run test:hooks` globs `.claude/hooks/lib/*.test.mjs`, so a
  new test file lands in `lib/` or it does not run.
- E6 governs test file size: 1:1 with a subject is the precondition, 800 lines
  is the ceiling.
- Commit scope is `hooks` for the instrumentation commits and `explorations`
  for the note amendment.
- `brief-validator`, `closer` and `pre-commit-self-audit` are tombstones as of
  2026-08-09 and are not live actors. Mechanical brief validation is the CLI
  `node .claude/hooks/validate-brief.mjs <brief>`.

### Architectural decisions already made (do not revisit)

#### D1 — The question the measurement answers is yield per check

For each mechanical check: how often it denied, how often it escalated (`ask`),
how often it allowed — and what fraction of the denials were *self-inflicted*
(the same input denied again, meaning the check tripped over its own extraction
rules or the model worked around it) rather than a real defect that got fixed.
This re-tests Finding 1 of `docs/explorations/gate-economics.md` with runtime
data instead of prose written by the sessions being measured. Every design
choice below serves this question; a field that does not serve it is not added.

#### D2 — Scope is the five hooks only

Pauses and decision points stay out. Hook data is the only evidence in this
system that is not self-report, and instrumenting the Pauses would require a
new human convention whose output would inherit exactly the bias the baseline
declares as its own limitation. The digest note records this as a declared
follow-up, not as an omission.

#### D3 — Landing is append-only JSONL under `.claude/telemetry/`, gitignored

One file, `.claude/telemetry/gates.jsonl`, one JSON object per line, opened in
append mode. The directory is resolved from the executing hook module's own
location — `new URL("../../telemetry/", import.meta.url)` from
`.claude/hooks/lib/telemetry.mjs` — with `process.env.SACI_TELEMETRY_DIR` as an
override that exists for the tests. Deriving from `import.meta.url` rather than
from `${CLAUDE_PROJECT_DIR}` is deliberate: telemetry lands beside whichever
hook file actually executed, which is worktree-correct by construction and
needs no environment variable. Every record carries a session identifier
anyway, so streams can be concatenated later even if two worktrees share a
root.

**R18 does not apply, and this brief says so explicitly.** R18 governs the
*product's* persistent application state, routed through the packages' storage
seam. This is harness-local instrumentation of the development process — not
application state, not user state, and not reachable from any package. A
misreading here would send a future session looking for a `storage/` module
inside the hooks, where none belongs.

`.gitignore` gains an explicit `.claude/telemetry/` entry. The existing `*.log`
line does not cover `.jsonl`.

#### D4 — Only real decisions emit

A hook that exits early emits nothing. Concretely, no record is written when:

- the tool is not a shell tool, or the command is not a `git commit`
  (`commit-guard`, `architecture-guard`, `docs-guard`);
- no inline commit message could be extracted, so no rule ran
  (`commit-guard`);
- the actor is outside the `@test`/`@code` pair, the tool is not a write tool,
  or no path is present (`file-ownership`);
- nothing is staged, or the filtered staged set this hook inspects is empty
  (`architecture-guard`, `docs-guard`);
- `stop_hook_active` is set, or the unwatched-changes filter short-circuits
  (`green-boundary`).

The guards fire on every Bash call and every Write. An invocation that examined
nothing is not a gate event, and writing on that path would make the guard the
most expensive item in the turn. Emission happens exactly where the hook
examined an input and produced deny, ask or allow.

#### D5 — Emission is best-effort and never alters a verdict

This is a hard invariant. On a write failure the hook writes one line to
stderr, naming the error, and continues to the verdict it would have reached
anyway — logged, not swallowed (R4). Emission never throws out of
`emitRecord`.

Design consequence: the emission seam is injectable. The write goes behind a
writer function passed as an argument, defaulted to the filesystem appender,
rather than an imported function called directly.

The invariant is covered two ways, both required:

- a unit test that injects a throwing writer and asserts `emitRecord` returns
  normally, having written one stderr line;
- an integration test that spawns the real hook executable twice with an
  identical stdin payload — once with a writable telemetry directory, once with
  `SACI_TELEMETRY_DIR` pointed at an unwritable path — and asserts that the exit
  code is byte-identical between the two runs, and that stderr is byte-identical
  **over the verdict channel**: identical once whole lines carrying the
  `telemetry:` prefix are removed, with the writable run producing exactly zero
  such lines and the unwritable run exactly one, naming the error. The
  comparison is over buffers, never substrings. Spawning the shipped hook is the
  point: a test pipeline that differs from the shipped one passes while proving
  nothing.

  This bullet asked for whole-stderr byte identity until owner ruling R-1 on
  2026-08-11 (`docs/tasks/2026-08-11-gate-runtime-instrumentation/notes.md`),
  which the first sentence of D5 makes impossible: the R4 diagnostic line **is**
  a stderr byte difference. Moving the diagnostic to stdout was rejected — a
  bare line there prepends to `askOwner`'s JSON payload and destroys an `ask`
  escalation, so a telemetry failure would change a verdict, the exact inversion
  D5 exists to prevent.

#### D6 — Verdicts gain a machine-readable check identifier plus an input hash

`decision` and `reason` stay **byte-identical**. Every existing test keeps
passing untouched.

Two additions:

- a stable `check` field naming which rule spoke;
- a hash of the inspected input — the commit subject, the file path, the staged
  set — so the same input denied twice is distinguishable from two different
  inputs denied once. Without the hash, "self-inflicted" from D1 has no
  measure.

The asymmetry to expect: `.claude/hooks/lib/architecture.mjs` already carries
`rule` on every finding, so its verdict inherits the identifier almost for
free, and `.claude/hooks/lib/docs-checks.mjs` inherits it through the same
`summarize`. That inheritance is verified, not assumed:
`.claude/hooks/docs-guard.mjs` imports `summarize` from `architecture.mjs` at
its line 17, and `docs-checks.mjs` emits findings carrying `rule: "ref"`
(line 85) and `rule: "R9"` (line 105) — so the fifth guard gets real check
identifiers with no change to `docs-checks.mjs`, which is why constraint 1
omits that file. Do not STOP asking to modify it.
`.claude/hooks/lib/commit-message.mjs` and
`.claude/hooks/lib/ownership.mjs` carry the identifier only inside the prose of
`reason`. Reading it back out of prose is the exact vice the baseline note
criticises, and it would break silently the first time an error message is
reworded.

The identifiers are fixed here, and are the SSOT for the reader:

| Module and outcome | `check` |
|---|---|
| `commit-message.mjs` — no inline message | `commit-none` |
| `commit-message.mjs` — subject over 72 chars | `R10-subject-length` |
| `commit-message.mjs` — subject not Conventional | `R10-subject-shape` |
| `commit-message.mjs` — `Co-authored-by` trailer | `G-A7-coauthor-trailer` |
| `commit-message.mjs` — injected allowlist empty | `R10-verb-list-empty` |
| `commit-message.mjs` — verb on the denylist | `R10-verb-imperative` |
| `commit-message.mjs` — verb on neither list | `R10-verb-unknown` |
| `commit-message.mjs` — subject accepted | `R10-ok` |
| `ownership.mjs` — hook has no opinion | `not-applicable` |
| `ownership.mjs` — `@code` writes a test file | `pair-code-writes-test` |
| `ownership.mjs` — `@test` writes an implementation | `pair-test-writes-impl` |
| `ownership.mjs` — write accepted inside the pair | `pair-ok` |
| `architecture.mjs` — `summarize`, findings present | distinct `rule` values of the chosen findings, comma-joined |
| `architecture.mjs` — `summarize`, no findings | `none` |
| `green-boundary.mjs` — per gate | `green-tsc`, `green-npm-test` |

Adding a field to these return values is safe: no existing test asserts deep
equality against a verdict object. The nine `deepEqual` assertions in the four
hook test files compare empty arrays or extracted strings.

#### D7 — The deliverable includes a minimal reader CLI

`.claude/hooks/gate-yield.mjs`, with its aggregation logic in
`.claude/hooks/lib/gate-yield.mjs` — the same shape as
`.claude/hooks/validate-brief.mjs` over
`.claude/hooks/lib/brief-checks.mjs`. It reports counts per hook, per check and
per verdict, plus the recurring inputs and the window state.

Without a reader the data exists and nobody can answer D1 without writing
ad-hoc code in the moment — and this note was already the victim of measuring
by reading prose after the fact.

#### D8 — The window closes at 10 committing sessions or 150 decision events

Whichever comes first. Both are policy values and get named constants (R7):
`WINDOW_SESSIONS = 10`, `WINDOW_EVENTS = 150`.

Operational definition, mechanically countable by the reader: a session counts
toward `WINDOW_SESSIONS` when the stream holds at least one record with
`hook: "commit-guard"` and `decision: "allow"` for its session identifier. That
is a proxy — the guard allowing a commit is not proof `git commit` then
succeeded — and the reader names it as a proxy in its output rather than
implying a certainty it does not have.

Reasoning to preserve: at the baseline's roughly 10% denial rate, 150 events
yield about 15 denials — enough to separate "50% self-inflicted" from "10%",
which is the claim under test. 80 events would not.

#### D9 — At window close the digest becomes a new note

`docs/explorations/gate-runtime-yield.md`, authored in a Mentor session through
the write gate, after which `docs/explorations/gate-economics.md` gains one
dated changelog line pointing at it. **This brief does not author that note**;
it names the destination so the deliverable has an address.

Trap for whoever writes that changelog line: the docs guard resolves any
path-shaped reference inside backticks against the index. Naming the new note
in backticks before it is tracked is a deny. Name it in plain prose, or commit
the note in the same commit as the line.

Precision added under owner ruling R-3, from finding F-1
(`docs/tasks/2026-08-11-gate-runtime-instrumentation/notes.md`): "any
path-shaped reference" means any reference whose extension sits in
`PATH_REFERENCE`'s closed alternation — `md`, `ts`, `mts`, `cts`, `mjs`, `cjs`,
`js`, `json`, `py`, `sh`, `yml`, `yaml`. The trap applies in full to the `.md`
note D9 is about. An extension outside that list is never extracted at all, and
`.jsonl` is one such: it matches as far as `.json` and dies on the trailing `l`.

#### D10 — This brief explicitly scopes the amendment of the baseline note

`docs/explorations/gate-economics.md` has its `Disposition:` line changed to
`promoted to brief 2026-08-11-gate-runtime-instrumentation — 2026-08-11`, and
gains one dated line in its `## Changelog`. Nothing is deleted; no finding is
rewritten.

This is required by rule 3 of `docs/explorations/README.md` — a note is amended
only in a Mentor session through the write gate, or by a brief that explicitly
scopes it. This clause is that explicit scope.

#### D11 — Branch `chore/gate-runtime-instrumentation`, cut from `4b43cc8`

The type follows the direct precedent of #130, `chore(harness): port the
mechanical gates into hooks` — same surface, same type. `4b43cc8` is HEAD,
`main` and `origin/main`; the branch was created before Edit 1, because
`claude/*` is session scaffolding and a brief mandating work on it fails C4.

#### D12 — The session identifier is `session_id`, verified empirically

D3 and D8 depend on the payload carrying a session identifier, and no hook in
this repository reads one, so nothing here proved it was available. Verified on
2026-08-11 against the shipped Claude Code 2.1.218 executable: every hook
payload is built by one shared function whose return value opens with
`session_id`, alongside `transcript_path`, `cwd`, `prompt_id`,
`permission_mode`, `agent_id`, `agent_type` and `effort`; the `PreToolUse`
payload spreads that base and adds `tool_name`, `tool_input` and
`tool_use_id`. The hook child process additionally receives
`CLAUDE_CODE_SESSION_ID` in its environment, confirmed live in this session.

Resolution order, in this order, no exceptions: `input.session_id`, then
`process.env.CLAUDE_CODE_SESSION_ID`, then the literal `"unknown"`. A record
whose session resolves to `"unknown"` is still written — it counts toward
`WINDOW_EVENTS` and is excluded from the distinct-session count, and the reader
reports how many such records it saw. A silent zero there would corrupt D8's
window without anyone noticing.

#### D13 — The record shape

Exactly these keys, in this order, one object per line:

| Key | Value |
|---|---|
| `ts` | ISO 8601 UTC timestamp |
| `session` | resolved per D12 |
| `agent` | `agent_type` from the payload; empty string when absent |
| `hook` | `commit-guard`, `architecture-guard`, `docs-guard`, `file-ownership` or `green-boundary` |
| `event` | `hook_event_name` from the payload |
| `check` | the identifier from the D6 table |
| `decision` | `deny`, `ask` or `allow` |
| `inputKind` | `commit-subject`, `file-path`, `staged-set` or `turn` |
| `inputHash` | first 12 hex chars of the SHA-256 of the inspected input |
| `label` | the repository-relative path — present only when `inputKind` is `file-path`; omitted otherwise |

What each hook hashes: `commit-guard`, the subject line. `file-ownership`, the
file path. `architecture-guard` and `docs-guard`, the newline-joined sorted
list of the staged paths they inspected. `green-boundary`, the newline-joined
sorted list of the watched changed paths.

`label` is confined to `file-path` because a path is not a secret and is the
useful recurring key. A commit subject is hash-only: a denied subject never
becomes a public artifact, and constraint 6 keeps content out of the stream
entirely.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

- [ ] Branch `chore/gate-runtime-instrumentation` is checked out, cut from
      `4b43cc8`; `git branch --show-current` confirms it
- [ ] Directory `docs/tasks/2026-08-11-gate-runtime-instrumentation/` exists
- [ ] File `docs/tasks/2026-08-11-gate-runtime-instrumentation/brief.md`
      exists; first line matches the title above
- [ ] `node .claude/hooks/validate-brief.mjs docs/tasks/2026-08-11-gate-runtime-instrumentation/brief.md`
      reports `VERDICT: APPROVED`
- [ ] The brief file is staged and committed as commit #1

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

Commit: `docs(tasks): add brief for gate runtime instrumentation`

### Edit 2 — Add the telemetry emission seam

Create `.claude/hooks/lib/telemetry.mjs` exporting, at minimum:

- `telemetryPath()` — the resolved JSONL path per D3
- `hashInput(text)` — per D13
- `buildRecord(fields)` — the D13 shape, keys in the D13 order, `label` omitted
  when absent
- `emitRecord(record, writer)` — serializes to one line plus `\n` and calls
  `writer`; `writer` defaults to the filesystem appender, which creates the
  directory when missing
- `sessionOf(input)` — the D12 resolution order

Named constants at module top (R7): the directory name, the file name, the hash
algorithm and the hash length.

`emitRecord` catches every writer failure, writes one stderr line naming the
error, and returns (D5, R4). It never throws.

Create `.claude/hooks/lib/telemetry.test.mjs` covering: the record key order
and the omission of `label`; `hashInput` stability and difference; the D12
resolution order including the `"unknown"` fallback; and a throwing writer
producing a normal return plus one stderr line.

Add `.claude/telemetry/` to `.gitignore`, below `.claude/settings.local.json`.

Verification:

- [ ] `.claude/hooks/lib/telemetry.mjs` exists, under 400 lines (R5), imports
      only `node:fs`, `node:crypto`, `node:url` and `node:path` — the fourth
      added by owner ruling R-2, which routes path composition through
      `path.join` per R1
- [ ] `.claude/hooks/lib/telemetry.test.mjs` exists and maps 1:1 to it (E6)
- [ ] `grep -n 'telemetry' .gitignore` shows `.claude/telemetry/`
- [ ] `git check-ignore -q .claude/telemetry/gates.jsonl` exits 0
- [ ] `npm run test:hooks` passes; the count is above 61 and no prior test
      changed
- [ ] No file outside this Edit's scope is modified

Commit: `chore(hooks): add the telemetry emission seam`

### Edit 3 — Add check identifiers to the hook verdicts

Add the `check` field to every verdict-returning function per the D6 table:
`decideCommitMessage` in `.claude/hooks/lib/commit-message.mjs`,
`decideOwnership` in `.claude/hooks/lib/ownership.mjs`, and `summarize` in
`.claude/hooks/lib/architecture.mjs`.

`decision` and `reason` are not touched — not reworded, not reordered, not
reformatted. `decideOwnership` keeps `allowed` and gains `check`; its three
early returns take `not-applicable`, which is what lets `file-ownership.mjs`
tell "no opinion" apart from "allowed" in Edit 4.

Append new `test(...)` blocks to `commit-message.test.mjs`,
`ownership.test.mjs` and `architecture.test.mjs` asserting the identifier for
each row of the D6 table. Do not modify any existing block.

Verification:

- [ ] Every row of the D6 table has an asserting test
- [ ] `git diff` on the three test files shows additions only, no deletions
      inside existing `test(...)` blocks
- [ ] `npm run test:hooks` passes with 0 failures
- [ ] `npx tsc -b` clean and `npm test` green
- [ ] No verdict `reason` string differs from `4b43cc8`, verified with
      `git diff 4b43cc8 -- .claude/hooks/lib/` read line by line

Commit: `chore(hooks): add check identifiers to the hook verdicts`

### Edit 4 — Wire telemetry into the five hooks

In each of `commit-guard.mjs`, `architecture-guard.mjs`, `docs-guard.mjs`,
`file-ownership.mjs` and `green-boundary.mjs`: emit one record at the point the
hook has a verdict and before it calls `deny`, `askOwner`, `allow` or
`blockStop`, which all exit the process. Respect D4's silence list exactly; add
no early exit that does not already exist. `green-boundary` emits one record
per gate it actually ran.

Add the D5 integration tests to `.claude/hooks/lib/telemetry.test.mjs`: spawn
`commit-guard.mjs` with a fixed stdin payload, once with a writable
`SACI_TELEMETRY_DIR` and once with an unwritable one, and assert byte-identical
exit code and stderr. Assert the writable run appended exactly one line and
that the line parses as the D13 shape.

Verification:

- [ ] Each of the five hooks emits on its decision paths and stays silent on
      every path listed in D4
- [ ] The D5 integration test passes, comparing buffers rather than substrings:
      the exit code is identical, and stderr is identical over the verdict
      channel per D5 as amended by owner ruling R-1 — with exactly zero
      `telemetry:` lines in the writable run and exactly one in the unwritable
      run
- [ ] `npm test` green; package tests still 324 (323 pass, 1 skip)
- [ ] `.claude/telemetry/gates.jsonl` exists after the run and every line
      parses as JSON with the D13 keys
- [ ] `git status --short` does not list `.claude/telemetry/`
- [ ] This Edit's own commit produced a `commit-guard` record with
      `check: "R10-ok"`, shown as evidence at Pause 3

Commit: `chore(hooks): wire telemetry into the five hooks`

### Edit 5 — Add the gate-yield reader CLI

Create `.claude/hooks/lib/gate-yield.mjs` with the pure aggregation —
`parseStream`, `aggregate`, `formatReport` — and
`.claude/hooks/lib/gate-yield.test.mjs` beside it. Create
`.claude/hooks/gate-yield.mjs` as the thin CLI: it reads the default stream
path or an explicit path from `argv[2]`, prints the report, exits 0, and exits
1 with a message on stderr when the stream is absent.

The report carries: total events; distinct sessions and how many resolved to
`"unknown"`; counts per hook, per check and per decision; the inputs recurring
at least twice, with their hash, count, decisions and label when present; and
the window state — committing sessions against `WINDOW_SESSIONS`, events
against `WINDOW_EVENTS`, and whether the window is closed. Unparseable lines
are counted and reported, never silently dropped (R4).

`WINDOW_SESSIONS` and `WINDOW_EVENTS` are named constants in the lib module and
are the SSOT for D8.

**Add the doctrine pointer. Owner-ruled on 2026-08-11, in favour, inside this
task rather than as a follow-up** — a tool nobody can find measures nothing,
and the #130 retirement sweep already produced five real cases of doctrine
describing a surface that had moved. Append this line to `CLAUDE.md` under
"Related Documents", immediately after the existing `.claude/hooks/` bullet,
matching the shape of its neighbours:

```
- `.claude/hooks/gate-yield.mjs` — the reader over the gate telemetry stream. Aggregates the append-only `.claude/telemetry/gates.jsonl` into yield per hook, per check and per verdict; the stream is gitignored and local to the worktree that produced it
```

Nothing else in `CLAUDE.md` changes. The line lands in this Edit's commit,
alongside the reader files.

Docs-guard interaction, because this is the first commit in the task that
stages a markdown file outside `docs/tasks/`: `CLAUDE.md` is inspected, and it
is on the `ENGLISH_ONLY` list in `.claude/hooks/lib/docs-checks.mjs`, so the
line is English. The load-bearing reference is the backticked
`.claude/hooks/gate-yield.mjs`: `.mjs` sits inside `PATH_REFERENCE`'s
alternation, so the guard does extract and resolve it, and it resolves only
because that file is staged in the same commit — the same trap D9 records, one
commit earlier than expected. The backticked `.claude/telemetry/gates.jsonl` is
never extracted at all, per finding F-1
(`docs/tasks/2026-08-11-gate-runtime-instrumentation/notes.md`), so nothing
about it is checked and Edit 2's `.gitignore` entry is belt-and-braces rather
than the load path. The mandated Edit 2 before Edit 5 order stands regardless:
it costs nothing, and the `.mjs` reference genuinely needs same-commit staging.
`CLAUDE.md` was
verified clean against both docs checks on 2026-08-11 before this Edit was
written, so any finding the guard reports is caused by this change.

Verification:

- [ ] `node .claude/hooks/gate-yield.mjs` runs against the real stream and
      prints the report
- [ ] `node .claude/hooks/gate-yield.mjs /nonexistent.jsonl` exits 1 with a
      message on stderr
- [ ] The window state is computed from the D8 operational definition and the
      output names it as a proxy
- [ ] `.claude/hooks/lib/gate-yield.mjs` is under 400 lines (R5) and maps 1:1
      to its test (E6)
- [ ] `npm test` green
- [ ] `CLAUDE.md` carries the pointer line verbatim, immediately after the
      `.claude/hooks/` bullet
- [ ] `git diff --stat CLAUDE.md` shows exactly 1 insertion and 0 deletions
- [ ] The docs guard allowed the commit with `CLAUDE.md` staged

Commit: `chore(hooks): add the gate-yield reader CLI`

### Edit 6 — Promote the gate-economics note

In `docs/explorations/gate-economics.md`, exactly two changes. Line 4 is
replaced, and one line is appended to the `## Changelog` section:

```
Disposition: promoted to brief 2026-08-11-gate-runtime-instrumentation — 2026-08-11
```

```
- 2026-08-11 — promoted; the runtime instrumentation this note names as its successor is specified in `docs/tasks/2026-08-11-gate-runtime-instrumentation/brief.md`.
```

Nothing else changes. No finding is rewritten, nothing is deleted, and the
`Status:` line stays as it is.

Verification:

- [ ] `git diff --stat docs/explorations/gate-economics.md` shows 2 insertions
      and 1 deletion
- [ ] The `Disposition:` value is one of the closed set in
      `docs/explorations/README.md`
- [ ] The changelog line's backticked reference resolves, because the brief was
      committed in Edit 1 — the docs guard checks it against the index
- [ ] The docs guard allows the commit; if it denies or asks, **STOP and
      report** rather than reshaping the note to satisfy it
- [ ] No other line of the note differs from `4b43cc8`

Commit: `docs(explorations): promote the gate-economics note`

### Commit sequence

1. `docs(tasks): add brief for gate runtime instrumentation`
2. `chore(hooks): add the telemetry emission seam`
3. `chore(hooks): add check identifiers to the hook verdicts`
4. `chore(hooks): wire telemetry into the five hooks`
5. `chore(hooks): add the gate-yield reader CLI`
6. `docs(explorations): promote the gate-economics note`

### Automated checks (run before each commit)

- [ ] `npx tsc -b` clean
- [ ] `npm test` green: 324 package tests (323 pass, 1 skip) plus the hook
      tests, 0 failures
- [ ] `node .claude/hooks/validate-brief.mjs` reports APPROVED for this brief

### Structural checks

- [ ] The six new or modified hook files exist at the paths in constraint 1
- [ ] No file outside the constraint-1 list was modified
      (`git diff --name-only 4b43cc8..HEAD`)
- [ ] `.claude/settings.json` is unmodified
- [ ] `packages/` is unmodified

### Behavior checks

- [ ] A `git commit` with a valid subject emits one `commit-guard` record with
      `decision: "allow"` and `check: "R10-ok"`
- [ ] A `git commit` with a subject over 72 chars is still denied, with the
      same `reason` bytes as at `4b43cc8`, and emits `R10-subject-length`
- [ ] A Bash call that is not a commit emits nothing
- [ ] A turn with no watched changes emits nothing from `green-boundary`
- [ ] An unwritable telemetry directory changes no verdict, no exit code and no
      stderr byte on the verdict channel; it adds exactly one `telemetry:`
      diagnostic line, which D5 and R4 require (owner ruling R-1)

### Git checks

- [ ] Branch used: `chore/gate-runtime-instrumentation`, based on `4b43cc8`
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on the branch at the end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 1 — the numbered plan was presented and approved before any change
- [ ] Pause 2 — the first modified file was shown for review before proceeding
- [ ] Pause 3 — `git status`, `git diff --stat` and the proposed message shown
      before each commit
- [ ] The staged set was confirmed to match the current Edit's scope before
      each Pause 3 submission
- [ ] The Edit 5 doctrine pointer landed as ruled, and no other line of
      `CLAUDE.md` changed
- [ ] Any criterion that could not be met was reported explicitly

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code):** present a numbered plan and wait for approval.
  **Required** — `Plan required: yes`.
- **Pause 2 (after the first modified file):** show the result and wait for
  review. **Always required.**
- **Pause 3 (before each commit):** show `git status` and `git diff --stat` plus
  the proposed message. The hooks run themselves. **Always required.**

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md` as a
  follow-up brief.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: yes`. The thirteen decisions close the record shape, the check
identifiers, the emission policy and the failure invariant, but three things
stay open and are worth ratifying before code: the test structure that proves
D5 end to end, the reader's output format, and the order in which five live
hooks are rewired while the same hooks gate the commits doing the rewiring.
Pause 2 and Pause 3 are required regardless — Lesson #6 of
`docs/AGENT_PLAYBOOK.md`.

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules
2. `docs/explorations/gate-economics.md` — the note being promoted; Findings
   1-3 and "What this does NOT establish" are the reason this task exists
3. `docs/GIT_WORKFLOW.md` — G-R3, G-R5, G-A7, and the `claude/*` scaffolding
   section
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 and Lesson #6
5. `docs/PROCESS_MAP.md` — §6 the gates, §7 artifact naming
6. `.claude/hooks/` and `.claude/hooks/lib/` — the five hooks and every module;
   the verdict shapes are the subject of this task
7. `docs/explorations/README.md` — the disposition contract, rule 3
8. `.claude/skills/brief-template/SKILL.md` — template reference

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD`
2. `git diff --stat 4b43cc8..HEAD`
3. Any verification checkbox that could not be met, with explanation
4. `git diff 4b43cc8..HEAD -- CLAUDE.md`, confirming the ruled pointer line and
   nothing else
5. Confirmation that no `git push` was executed
6. Suggested next step: the owner pushes and opens the PR
