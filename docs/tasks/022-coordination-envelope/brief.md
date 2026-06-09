# Brief: 022 — Coordination envelope serialization

> **Category:** M
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `feat/coordination-envelope`

---

## Context

Brief 019 ported the shape-independent domain into `@saci/core` and defined the
payload-v2.0 types (`Payload`, `Issue`, `FilteredOut`, `PayloadWarning` in
`packages/core/src/payload.ts`). Brief 020 implemented
`JiraGateway.fetchIssues(): Promise<Issue[]>` in `@saci/adapter-jira`,
behavior-preserving against the frozen seed (`automation/payload.json`), and
deliberately **deferred** the envelope: `fetchIssues` returns `Issue[]`, while
the seed's drop and partial-failure decisions are **computed and logged**
through injected sinks (`IssueDropLog`, `IssueWarningLog`) rather than
serialized.

Brief 022 serializes that envelope. It assembles the full `Payload` from the
issues plus the captured drops/warnings, stamps `run_date` / `generated_at`,
and writes `payload.json` to disk. This closes the deferred D3 half of brief
020. No Sheet, no Drive, no path derivation.

## Goal

Add a pure `assemblePayload` function to `@saci/core` (with `node:test`
coverage against the frozen `automation/payload.json`), wire **capturing**
drop/warning sinks at the composition root (CLI), and serialize the assembled
`Payload` to `payload.json` on disk, behavior-preserving against the frozen
seed.

Out of scope:

- **Sheet write** → brief 023 (`adapter-sheets` package implementing the
  `SheetGateway` port — a full new-package effort on the scale of 020).
  `packages/adapter-sheets/` stays the Phase-1 placeholder; do not touch it.
- **`derivePath`** → Phase 3 `[prod]`. The seed coordination pipeline
  (`fetch.py` → `payload.json` → `sync.py`) never derives a Drive path;
  `derivePath(issue) → string` is a production-mode core function whose Drive
  hierarchy rule is an open Phase-3 design item in `docs/ROADMAP.md`. It does
  not belong in this brief.
- **`parent_summary` population** — stays behavior-preserving (the JQL-search
  endpoint omits the inline parent summary; current value is `""`). Any change
  is a separate docs/parking-lot PR carried from 020.
- **Any change to existing gateway port signatures** in `packages/core`
  (`JiraGateway.fetchIssues`, `SheetGateway`, `DriveGateway`). Adding the new
  pure `assemblePayload` function is permitted; changing a port signature is a
  STOP.
- **Committing credentials** — no real Jira/Google secrets enter the repo.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/022-coordination-envelope/brief.md` (this brief)
   - `packages/core/src/payload.ts` (add `assemblePayload`; do NOT redefine the
     existing `Payload` / `Issue` / `FilteredOut` / `PayloadWarning` types) —
     OR a new `packages/core/src/assemble.ts` re-exported via
     `packages/core/src/index.ts` (placement settled at Pause 1)
   - the matching `*.test.ts` colocated with the chosen core source file
   - `packages/core/src/index.ts` (export the new function)
   - the composition-root / disk-write file(s) under `packages/cli/src/`
     (placement settled at Pause 1)

   If anything else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md` — especially R20 (TS strict), R21 (ESM,
   `.js` import extensions), R22 (`tsc` per package, no bundler), R23
   (`node:test`, colocated `*.test.ts`), R24 (no `any`), R25 (hexagonal:
   `core` never imports from adapters), R7 (named constants), R4 (no silent
   catch), R9 (English-only on agent-consumed surface).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `feat/coordination-envelope`
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5 / R17)
4. **Behavior-preserving against the frozen seed is the acceptance bar
   throughout.** The serialized `payload.json` must mirror
   `automation/payload.json` exactly — same field names, same key order, same
   nullability, same JSON formatting (`indent=2`, non-ASCII preserved). No
   tidying (same fidelity bar as 019/D3).

### Conventions

- Commit type `feat`; scopes: `core` for the assembler/test edits, `cli` for
  the composition-root + disk-write edit.
- EARS phrasing for the behavioral criteria on `assemblePayload`
  (Phase 2/3 convention).
- All prose, identifiers, comments, and commit messages in English (R9).
- `schema_version` is a named constant (`SCHEMA_VERSION = "2.0"`) per R7,
  mirroring the seed's `SCHEMA_VERSION`.

### Architectural decisions already made (do not revisit)

Closed during the design session with the mentor (`SCOPE.md`). The executor
implements; it does not propose alternatives. **If implementing one would
force a change to a closed decision, STOP and report.**

#### D1 — Do not reopen the port

`JiraGateway.fetchIssues(): Promise<Issue[]>` stays frozen exactly as in brief
020 (that brief's D2 holds). The envelope is assembled **outside** the gateway.
The adapter's already-injected sinks line up with the core envelope types
one-to-one:

- `IssueDropLog(key, reason)` (in `packages/adapter-jira/src/gateway.ts`) →
  `FilteredOut { key, reason }`
- `IssueWarningLog(key, field, cause)` (in
  `packages/adapter-jira/src/mapper.ts`) → `PayloadWarning { key, field, issue }`
  (the warning sink's third parameter `cause` maps to the `issue` field of
  `PayloadWarning`)

The composition root wires **capturing** sinks (push into arrays) instead of
the default console-logging sinks, then hands the captured arrays to the
assembler.

#### D2 — Pure assembler in core

Add a pure function to `@saci/core`:

```
assemblePayload(
  issues: Issue[],
  filteredOut: FilteredOut[],
  warnings: PayloadWarning[],
  meta: { runDate: string; generatedAt: string },
): Payload
```

Pure, no I/O. The function only constructs and returns a `Payload` object;
`schema_version` is set to `"2.0"`, and `run_date` / `generated_at` come from
`meta`. `node:test` coverage asserts against the frozen `automation/payload.json`.

> **Not the 020/D2 landmine.** Brief 020's "core edit is a separate decision"
> referred to *changing the existing port contract*. Adding a new pure function
> to core is ordinary additive work (brief 019 added to core). The STOP-guard
> on `packages/core/**` is scoped to "no change to existing gateway port
> signatures", **not** "no new core code".

#### D3 — Sheet write is OUT (→ brief 023)

The Sheet write needs an `adapter-sheets` package implementing the
`SheetGateway` port — a full new-package effort reserved as **brief 023**.
Brief 022 writes **`payload.json` to disk only**.

#### D4 — Envelope shape is the frozen v2.0, behavior-preserving

Mirror `automation/payload.json` exactly. The top-level key order is
`schema_version`, `run_date`, `generated_at`, `issues`, `filtered_out`,
`warnings` (verified against `automation/fetch.py` lines 630-637 and
`automation/payload.json`). The two values not already produced by
`fetchIssues`:

- `run_date` — `YYYY-MM-DD` (the seed uses `now.date().isoformat()`).
- `generated_at` — ISO timestamp **with offset**, stamped at run time (the seed
  uses `now.astimezone().isoformat(timespec="seconds")`, e.g.
  `2026-06-05T12:25:43-03:00`).

`schema_version` is `"2.0"`. Field names and nullability are grounded from disk
(`packages/core/src/payload.ts` + `automation/payload.json`):
`entrega_iso` and `copy_url` are the only bare nullables (`string | null`);
all other `Issue` fields are non-null strings. **If any field's name,
nullability, or format is ambiguous on disk, STOP and report — do not invent.**

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The planner authored this brief at `docs/tasks/022-coordination-envelope/brief.md`.
The executor verifies presence and commits.

> **P4 numbering evidence** (three-source check re-run on the live repo;
> recorded here per the authoring gate):
> - `ls docs/tasks/` — highest numbered dir is `021-executor-pause-calibration`;
>   `022-coordination-envelope` is this task's own dir (created with `SCOPE.md`).
>   No other `022`.
> - `git log --oneline main` — highest merged task work = `021` (PR #49,
>   `main@fb5bb1d`); `020` = PR #46 (`main@7213d24`). No `022`.
> - `CLAUDE.md` exceptions = `E1`, `E2`, `E3`, `E5` (v1 freeze); no forward
>   task-slot reserve; v2 exceptions start at `E6`. No `022` reserve.
>   → Envelope = **022**. Sheet adapter = **023** (forward reserve).

- [ ] Directory `docs/tasks/022-coordination-envelope/` exists
- [ ] File `docs/tasks/022-coordination-envelope/brief.md` exists; first line
      matches the title above
- [ ] `git add docs/tasks/022-coordination-envelope/brief.md` is staged
- [ ] Commit #1 created with subject `docs(tasks): add brief for 022-coordination-envelope`

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

### Edit 2 — Add the `assemblePayload` pure function to `@saci/core`

Add the pure `assemblePayload` function (signature per D2) to `@saci/core`,
either in `packages/core/src/payload.ts` or a new
`packages/core/src/assemble.ts` (placement settled at Pause 1). Export it from
`packages/core/src/index.ts`. Declare `SCHEMA_VERSION = "2.0"` as a named
constant (R7).

Behavioral criteria (EARS):

- When `assemblePayload` is called with `issues`, `filteredOut`, `warnings`,
  and `meta`, the system shall return a `Payload` whose `schema_version` is
  `"2.0"`.
- When `assemblePayload` is called, the system shall set the returned
  `Payload.run_date` to `meta.runDate` and `Payload.generated_at` to
  `meta.generatedAt`, without transforming either value.
- When `assemblePayload` is called, the system shall set `Payload.issues`,
  `Payload.filtered_out`, and `Payload.warnings` to the corresponding input
  arrays, preserving order and element identity (no filtering, sorting, or
  mutation of the inputs).
- When `assemblePayload` is called with empty `filteredOut` and `warnings`
  arrays, the system shall return a `Payload` whose `filtered_out` and
  `warnings` are empty arrays (mirrors the frozen seed's `"warnings": []`).

Reuse the existing `core/payload.ts` types verbatim — **do NOT redefine**
`Payload`, `Issue`, `FilteredOut`, or `PayloadWarning`. **Do NOT change any
existing gateway port signature** in `packages/core`. If the function cannot be
added without altering an existing type or port, **STOP and report**.

Verification:

- [ ] `assemblePayload` is exported from `@saci/core`
      (`grep -n "assemblePayload" packages/core/src/index.ts`)
- [ ] The function signature matches D2 exactly (4 params; returns `Payload`)
- [ ] No existing type in `payload.ts` was redefined or modified
      (`git diff packages/core/src/payload.ts` shows only additive changes, if
      any, to that file)
- [ ] `core` imports nothing from any adapter (R25:
      `grep -rn 'from.*adapter' packages/core/src/` returns no matches)
- [ ] `SCHEMA_VERSION` declared as a named constant

Commit: `feat(core): add assemblePayload envelope assembler`

### Edit 3 — Add `node:test` coverage for `assemblePayload`

Add a colocated `*.test.ts` (next to the chosen core source file from Edit 2)
that asserts `assemblePayload` reproduces the frozen `automation/payload.json`
envelope.

The test constructs the inputs (`issues`, `filteredOut`, `warnings`, `meta`)
from the frozen fixture's contents and asserts the returned `Payload` deep-
equals the fixture object (modulo how the fixture is loaded). At minimum it
covers: `schema_version === "2.0"`, `run_date` / `generated_at` pass-through,
the populated `filtered_out` (the 5 `"Template"` entries), and the empty
`warnings` array.

Verification:

- [ ] Test file colocated with the source (R23) and named `*.test.ts`
- [ ] `node:test` run for the `core` package passes (build then test per the
      package's configured runner integration)
- [ ] The test asserts against the frozen `automation/payload.json` shape (not
      the simplified `automation/SKILL_TEMPLATE.md` `{ run_date, issues }`
      shape)

Commit: shares Edit 2's commit, OR a separate
`test(core): add assemblePayload coverage vs frozen payload` (executor
proposes at Pause 1; default is a separate test commit).

### Edit 4 — Wire capturing sinks + serialize `payload.json` at the composition root

In the composition root / CLI layer (`packages/cli/src/`, file placement
settled at Pause 1), wire the run:

1. Construct capturing sinks: an `IssueDropLog` that pushes
   `{ key, reason }` into a `FilteredOut[]`, and an `IssueWarningLog` that
   pushes `{ key, field, issue: cause }` into a `PayloadWarning[]` — replacing
   the default console-logging sinks (D1 one-to-one mapping).
2. Call `fetchIssues()` to get `Issue[]`.
3. Stamp `meta`: `runDate` = `YYYY-MM-DD` for today; `generatedAt` = ISO
   timestamp with offset, both from a single run-time `now` (mirror the seed's
   `now = datetime.now().astimezone()`).
4. Call `assemblePayload(issues, filteredOut, warnings, meta)`.
5. Serialize the result to `payload.json` with `JSON.stringify(payload, null, 2)`
   (2-space indent) plus a trailing newline if the seed file has one; non-ASCII
   preserved (UTF-8, no escaping — matches the seed's `ensure_ascii=False`).
   The output path is configurable; do not hardcode an OS-specific absolute
   path (R1). No real credentials are committed.

Verification:

- [ ] The default console sinks are replaced by capturing sinks at the
      composition root (the captured arrays feed `assemblePayload`)
- [ ] Top-level key order in the serialized payload is `schema_version`,
      `run_date`, `generated_at`, `issues`, `filtered_out`, `warnings`
- [ ] Serialization uses 2-space indent and preserves non-ASCII characters
- [ ] No hardcoded platform-specific path (R1 / A4); output path composed via
      `path.join` / `app`-style root or passed in
- [ ] No existing gateway port signature was changed
- [ ] No credentials staged (`git diff --cached` shows no secrets)

Commit: `feat(cli): wire envelope capture and write payload.json`

### Automated checks (run before each commit)

- [ ] `tsc -p .` passes for each touched package (R22, no bundler)
- [ ] `node:test` passes for the `core` package (and `cli` if it gains a test)
- [ ] No `any` introduced (R24); no `// @ts-ignore` / `// @ts-expect-error`
      without justified comment + dated TODO (R20)

### Structural checks

- [ ] Expected files exist at expected paths
- [ ] `core` never imports from adapters
      (`grep -rn 'from.*adapter' packages/core/src/` empty — R25)
- [ ] No file outside the in-scope list was modified
      (`git diff --name-only origin/main..HEAD`)
- [ ] `packages/adapter-sheets/` untouched (D3)

### Behavior checks

- [ ] `assemblePayload` output deep-equals the frozen `automation/payload.json`
      envelope for the fixture inputs
- [ ] Empty `warnings` input yields `"warnings": []` in the output
- [ ] `entrega_iso` and `copy_url` round-trip as `null` where the fixture has
      `null` (bare nullables preserved)

### Git checks

- [ ] Branch used: `feat/coordination-envelope`
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 1 — numbered plan presented and approved before any change
      (`Plan required: yes`)
- [ ] Pause 2 — first modified file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed commit message
      shown before each commit
- [ ] `pre-commit-self-audit` skill output reported in chat before each Pause 3
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

Pauses are named in English ("Pause 1", "Pause 2", "Pause 3") on the
agent-consumed surface (R9).

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code):** present a numbered plan and wait for approval.
  **Required** (`Plan required: yes`). The plan must settle: (a) core
  placement — extend `payload.ts` vs. new `assemble.ts`; (b) whether Edit 3 is
  a separate `test(core)` commit; (c) the composition-root file layout and how
  the output path is supplied.
- **Pause 2 (after the first modified file):** show the result and wait for
  review. **Always required.**
- **Pause 3 (before each commit):** show `git status` + `git diff --stat` +
  proposed message + `pre-commit-self-audit` output. **Always required.**

In case of:

- Unrelated bug found → report and ask. Do not fix.
- A closed decision (D1–D4) would have to change to proceed → **STOP and
  report**.
- An on-disk field name / nullability / format ambiguous against
  `automation/payload.json` → **STOP and report; do not invent.**
- An on-disk sink signature does not match the D1 one-to-one mapping →
  **STOP and report.**
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md` as a
  follow-up brief.

**DO NOT proceed "fixing" things without permission.**

## Git workflow

### Branch

`feat/coordination-envelope` — branched from up-to-date `main`. Per G-R5 / R17,
the executor commits freely but never pushes; push is the user's call.

### Commit sequence

1. `docs(tasks): add brief for 022-coordination-envelope`
2. `feat(core): add assemblePayload envelope assembler`
3. `test(core): add assemblePayload coverage vs frozen payload` *(optional —
   may fold into commit #2; settled at Pause 1)*
4. `feat(cli): wire envelope capture and write payload.json`

All subjects verified ≤ 72 chars (R10). All leading verbs (`add`, `wire`) are
in the `pre-commit-self-audit` allowlist SSOT.

## Plan required justification

`Plan required: yes`. The decisions D1–D4 are closed, but the file/Edit layout
has a small amount to settle that warrants a Pause-1 plan:

- Core placement of `assemblePayload` (extend `payload.ts` vs. new
  `assemble.ts`) is the executor's call within scope.
- Whether the test is its own commit or folds into the assembler commit.
- The composition-root file layout in `packages/cli/src/` and how the
  `payload.json` output path is supplied are not fully pinned by this brief.

**Pause 2 and Pause 3 remain required** regardless — Lesson #6 of
`docs/AGENT_PLAYBOOK.md`.

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules (esp. R20–R25, R4, R7, R9)
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — known traps
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
5. `automation/payload.json` — the frozen v2.0 acceptance fixture
6. `automation/fetch.py` — payload-assembly section in `main()` (lines ~613-640):
   how `filtered_out` / `warnings` accumulate and how
   `schema_version` / `run_date` / `generated_at` are stamped
7. `packages/core/src/payload.ts` — `Payload` / `Issue` / `FilteredOut` /
   `PayloadWarning` (do not redefine)
8. `packages/adapter-jira/src/gateway.ts` — `IssueDropLog`,
   `JiraGatewayConfig` (sink injection point)
9. `packages/adapter-jira/src/mapper.ts` — `IssueWarningLog` signature
10. `.claude/skills/brief-template/SKILL.md` — template reference
11. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit skill (Pause 3)

> **Hazard — two payload shapes exist in the repo.**
> `automation/SKILL_TEMPLATE.md` shows a *simplified* `{ run_date, issues }`
> payload (Cowork-bridge era). Ground against the **full v2.0**
> (`automation/payload.json` + `packages/core/src/payload.ts`), NOT the
> SKILL_TEMPLATE variant.

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Any verification checkbox from this brief that could not be met, with
   explanation
4. Confirmation that no `git push` was executed
5. Suggested next step (open PR; brief 023 for the Sheet write)
