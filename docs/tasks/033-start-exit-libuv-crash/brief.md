# Brief: 033 — Fix libuv double-close crash on `saci start` exit

> **Category:** L
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `fix/start-exit-libuv-crash`

---

## Context

`saci start <KEY>` (brief 032) aborts at process exit on Windows (Node
24.15.0) with `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING),
src\win\async.c:76` and exit code `0xC0000409` — but only on the two *fast*
paths: the `--blank` happy path and the collision path (fetch runs, no
template copy). The with-template happy path and plain `saci fetch` exit
cleanly.

Root cause (already investigated, mentor-ratified, read-only):

- `cli.ts:121` (`process.exit(EXIT_OK)`) and `cli.ts:125`
  (`process.exit(EXIT_RUNTIME)`) force an abrupt libuv teardown that does not
  drain the event loop.
- `http.ts:88` uses `globalThis.fetch` (undici) with default keep-alive; the
  socket is never disposed. Each request arms `AbortSignal.timeout(...)` at
  `http.ts:127` (POST `searchJql`) and `http.ts:168` (GET `getFields`).
- At `process.exit()` a keep-alive socket handle is still mid-close → the
  libuv double-close assertion on Windows.
- Why the slow paths mask it: the race is decided by post-network async work
  between the last network response and `process.exit()`. `start`
  with-template does a slow `copyFile` (`run-start.ts:142-146`, invoked at
  `run-start.ts:211`); `fetch` does an extra `getFields` round-trip plus a
  payload `writeFile` (`run-fetch.ts:110`). Those give libuv enough
  event-loop turns to finish closing the socket. The collision path
  (`run-start.ts:202-203` → `cli.ts:125`) and the `--blank` path
  (2× `mkdir` + one small `writeFile` at `run-start.ts:210,214`,
  `copyTemplate` skipped) do little/no post-network work and lose the race.
- `fetchIssueByKey` (`gateway.ts:131`) deliberately skips
  `getFields`/`validateFieldMapping`, so the start path makes 3 requests, one
  fewer than fetch.

This is a mentor-ratified decision set. The executor implements D1–D4 as
written; it does not re-decide the design.

## Goal

Eliminate the libuv `async.c:76` double-close assertion / `0xC0000409` on
`saci start` (and keep `saci fetch` clean) so all four exit paths terminate
with their correct semantic exit codes and no crash.

Out of scope (hard — do NOT touch):

- File-naming convention.
- `drivePath` semester segment.
- env-var error-message DX.
- ANY change under `packages/core` (R25 — the root cause requires none; core
  stays untouched).
- The synchronous `version`/`usage` paths (`cli.ts:110-117`) may stay as-is;
  they run before any async network work, so no keep-alive handle exists to
  double-close (D2).

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/033-start-exit-libuv-crash/brief.md` (this brief)
   - `packages/adapter-jira/src/http.ts` (Step 1a; Step 2 dispose seam)
   - `packages/cli/src/cli.ts` (Step 1b — both outcomes)
   - **Step 2 fallback only** (execute only if Step 1 fails the four-path
     matrix on Windows): `packages/adapter-jira/package.json`,
     `packages/adapter-jira/src/gateway.ts`,
     `packages/cli/src/run-start.ts`, `packages/cli/src/run-fetch.ts`.
   - Any new/updated `*.test.ts` colocated with the above (R23 `node:test`).

   If anything else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md` — especially R2 (no new runtime dependency
   without PR justification), R20/R24 (no `@ts-ignore`/`any`), R25
   (dependency direction: `core` never imports adapters; adapters never
   leak into `core`), R23 (`node:test`), R10/R11 (Conventional Commits and
   branch naming), R14 (see D4 — this is `fix:`, not `refactor:`).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `fix/start-exit-libuv-crash`.
   - Conventional Commits (G-R3); subjects ≤ 72 chars, imperative mood.
   - No `Co-authored-by` trailer (G-A7).
   - Commit freely; **DO NOT push** (G-R5 / R17). Rafael authorizes push.
4. Empirical verification is Windows-only and mandatory. The four-path exit
   matrix (Done criteria) must be executed on Windows / Node 24.15.0 — the
   platform where the assertion reproduces. A passing build/unit suite alone
   does NOT satisfy the Done criteria.

### Conventions

- Agent-consumed surface (code, comments, commit messages, this brief) is
  English-only (R9).
- Commit types: `fix` for the crash fix and the disposal wiring; `chore` for
  the dependency addition; `docs` for this brief.
- If Step 2 is taken, the R2 justification for `undici` is captured in the
  PR description (not this brief): it is the same engine Node embeds for
  global `fetch`; it is taken on solely for the connection-lifecycle API that
  Node does not expose (verified: `import('undici')` is `ERR_MODULE_NOT_FOUND`
  on Node 24.15).

### Architectural decisions already made (do not revisit)

#### D1 — Conditional two-step fix; do NOT return to mentor between steps

The fix is a pre-ratified conditional. Execute Step 1 first; branch to Step 2
only if Step 1 fails the four-path matrix on Windows. Do NOT pause to re-ask
the mentor at the Step-1 → Step-2 boundary — the fallback is already ratified.

- **Step 1 (primary, zero-dependency):** send `Connection: close` on the Jira
  HTTP requests so no keep-alive handle survives the response. Minimal, adds
  no runtime dependency (honors R2). The header belongs in the HTTP layer
  (`packages/adapter-jira/src/http.ts`), added to BOTH `searchJql` (POST,
  `http.ts:121-125`) and `getFields` (GET, `http.ts:164-167`) request
  headers.
- **Step 2 (fallback, pre-ratified — execute ONLY if Step 1 fails the
  four-path matrix on Windows):** add `undici` as the project's FIRST runtime
  dependency. Construct a dedicated undici `Agent`, wire it as the fetch
  `dispatcher` through the EXISTING injectable seam (`fetchImpl` in
  `JiraHttpConfig` / the `http.ts` construction at `http.ts:88`), and dispose
  it (`await agent.close()`) via an async dispose on the gateway / http
  client. The composition roots wrap gateway use in `try { … } finally {
  await …dispose() }` — `run-start.ts` around `run-start.ts:190`,
  `run-fetch.ts` around `run-fetch.ts:104`. Pin an `undici` version
  compatible with the undici embedded in Node 24.15's runtime.

**STOP-and-confirm guard (D1 Step-2 version pin):** if the `undici` version
compatible with Node 24.15's embedded undici cannot be determined with
confidence, STOP and report before pinning — do not guess a version. (This is
the one Step-2 judgment call that is NOT pre-authorized.)

#### D2 — `process.exit` → `process.exitCode` on the async paths (BOTH outcomes)

In both Step-1 and Step-2 outcomes, replace `process.exit(EXIT_OK)`
(`cli.ts:121`) and `process.exit(EXIT_RUNTIME)` (`cli.ts:125`) with
`process.exitCode = …` assignment plus a natural return, letting the
now-handle-free event loop exit on its own. The synchronous `version`/`usage`
paths (`cli.ts:110-117`) stay as-is — planner's call — because they run
before any async network work and hold no keep-alive handle to double-close.

#### D3 — `packages/core` stays untouched

The root cause is entirely in the adapter transport and the CLI process
control. No `core` change is required (R25). If any step appears to need a
`core` edit, STOP and report — the design is wrong.

#### D4 — This is `fix:` (behavior change), not `refactor:`

The crash going away is a user-visible behavior change, so this is a `fix:`
change. The `cli.ts` `process.exit` → `process.exitCode` change rides along
as part of the fix (D2); it is NOT a separate `refactor:` PR. R14's
no-behavior-change clause does not apply here.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The planner pre-saved this brief to
`docs/tasks/033-start-exit-libuv-crash/brief.md`. The executor verifies
presence and commits.

**P4 numbering evidence (recorded per authoring gate):**

- `ls docs/tasks/`: highest existing slot is `032-start-scaffold`.
- `git log --oneline main`: most recent merged work is
  `55db16b docs(sessions): add mentor and executor recaps for 032 (#80)` —
  session 032 is the latest completed slot; no higher slot shipped.
- `CLAUDE.md` E* check: E1/E2/E3/E5 are v1-freeze exceptions; none reserves a
  `docs/tasks/` numbering slot. Next free NNN is therefore `033`.

Verification:

- [ ] Directory `docs/tasks/033-start-exit-libuv-crash/` exists
- [ ] File `.../brief.md` exists; first line matches the title above
- [ ] `git add docs/tasks/033-start-exit-libuv-crash/brief.md` is staged
- [ ] Commit #1 created: `docs(tasks): add brief for 033-start-exit-libuv-crash`

If the file is missing or the first line does not match, **STOP and report**.

### Edit 2 — Step 1a: send `Connection: close` on both Jira requests

In `packages/adapter-jira/src/http.ts`, add `Connection: "close",` to the
request headers of BOTH `searchJql` (POST, at `http.ts:121-125`) and
`getFields` (GET, at `http.ts:164-167`).

Resulting POST headers (`searchJql`):

```ts
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: this.authHeader,
          Connection: "close",
        },
```

Resulting GET headers (`getFields`):

```ts
      headers: {
        Accept: "application/json",
        Authorization: this.authHeader,
        Connection: "close",
      },
```

Verification:

- [ ] `grep -n 'Connection: "close"' packages/adapter-jira/src/http.ts`
      returns exactly two matches (one per method)
- [ ] No other line in `http.ts` changed (`git diff` shows only the two added
      header lines)
- [ ] `tsc -p packages/adapter-jira` passes
- [ ] `node:test` suite for `adapter-jira` passes

Commit: `fix(adapter-jira): add Connection: close to Jira requests`

### Edit 3 — Step 1b: replace `process.exit` with `process.exitCode` (both outcomes)

In `packages/cli/src/cli.ts`, replace the two force-exit calls on the async
`try/catch` (D2). Current (`cli.ts:119-126`):

```ts
  try {
    await runCommand(command);
    process.exit(EXIT_OK);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(EXIT_RUNTIME);
  }
```

Replace with:

```ts
  try {
    await runCommand(command);
    process.exitCode = EXIT_OK;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = EXIT_RUNTIME;
  }
```

The synchronous `version`/`usage` `process.exit(...)` calls (`cli.ts:110-117`)
are left unchanged (D2). Update the R8-style comment on the exit codes only if
it becomes stale; do not restate what the code does.

Verification:

- [ ] `grep -n 'process.exit(' packages/cli/src/cli.ts` returns only the two
      synchronous `version`/`usage` calls (no `process.exit(` on the async
      path)
- [ ] `grep -n 'process.exitCode' packages/cli/src/cli.ts` returns exactly
      two matches
- [ ] `tsc -p packages/cli` passes
- [ ] `node:test` suite for `cli` passes

Commit: `fix(cli): remove process.exit from async run paths`

### Edit 4 — Verify the four-path exit matrix on Windows (Step-1/Step-2 decision gate)

After Edits 2–3 (Step 1), run all four paths on Windows / Node 24.15.0 and
confirm each exits with its correct semantic code and NO libuv assertion. This
Edit is the decision gate for D1: if all four pass, the fix is complete
(skip Edits 5–7); if any path still throws the assertion, execute Step 2
(Edits 5–7) without returning to the mentor.

The four-path matrix (verify exit code AND absence of `async.c:76` /
`0xC0000409`):

- [ ] `saci start <KEY>` collision path → exits `1` (runtime error), no
      assertion
- [ ] `saci start <KEY> --blank` happy path → exits `0`, no assertion
- [ ] `saci start <KEY>` with template happy path → exits `0`, no assertion
      (regression guard)
- [ ] `saci fetch` → exits `0`, no assertion (regression guard)

Verification:

- [ ] All four paths ran on Windows / Node 24.15.0
- [ ] No `async.c:76` assertion / `0xC0000409` on any path
- [ ] Result recorded (which step satisfied the matrix) for the PR description

No commit for this Edit — it is a verification gate. If Step 1 passes, proceed
to the final checks. If Step 1 fails, proceed to Edit 5.

### Edit 5 — [Step 2 fallback] Add `undici` as the first runtime dependency

Execute only if Edit 4 failed on Windows. Add `undici`, pinned to a version
compatible with Node 24.15's embedded undici, to
`packages/adapter-jira/package.json` `dependencies`. Honor the D1 Step-2
STOP-and-confirm guard: if the compatible version cannot be determined with
confidence, STOP and report before pinning.

Verification:

- [ ] `undici` appears in `packages/adapter-jira/package.json` `dependencies`
      with an exact pinned version
- [ ] `npm install` resolves without adding unrelated dependencies
- [ ] R2 justification drafted for the PR description

Commit: `chore(deps): add undici runtime dependency`

### Edit 6 — [Step 2 fallback] Wire undici `Agent` with async dispose in adapter

Execute only if Edit 4 failed. In `packages/adapter-jira`, construct a
dedicated undici `Agent`, pass it as the fetch `dispatcher` through the
existing `fetchImpl` seam (`http.ts:88`), and expose an async dispose
(`await agent.close()`) on the gateway / http client. No `any`, no
`@ts-ignore` (R20/R24). `core` stays untouched (R25 / D3).

Verification:

- [ ] `Agent` is constructed and wired via the existing `fetchImpl` seam (not
      a new bypass of the port shape)
- [ ] An async dispose method is exposed and calls `agent.close()`
- [ ] `grep -rn 'from.*adapter' packages/core/` returns no matches (R25)
- [ ] No `any` / `@ts-ignore` introduced
- [ ] `tsc -p packages/adapter-jira` and its `node:test` suite pass

Commit: `fix(adapter-jira): wire undici Agent with async dispose`

### Edit 7 — [Step 2 fallback] Dispose the gateway in the composition roots

Execute only if Edit 4 failed. Wrap gateway use in `try { … } finally { await
…dispose() }` in `run-start.ts` (around `run-start.ts:190`) and `run-fetch.ts`
(around `run-fetch.ts:104`), then re-run the Edit 4 four-path matrix on Windows
and confirm it now passes.

Verification:

- [ ] Both composition roots dispose the gateway in a `finally` block
- [ ] The Edit 4 four-path matrix now passes on Windows (no assertion)
- [ ] `tsc` and `node:test` pass across `cli` and `adapter-jira`

Commit: `fix(cli): wire gateway disposal in start and fetch roots`

### Automated checks (run before each commit)

- [ ] `tsc -p .` passes for each touched package (no errors)
- [ ] `node:test` suites pass for each touched package (R23)
- [ ] No `any` / `@ts-ignore` / `@ts-expect-error` introduced (R20/R24)

### Structural checks

- [ ] Expected files exist at expected paths
- [ ] No file outside the in-scope list was modified
      (`git diff --name-only origin/main..HEAD`)
- [ ] `grep -rn 'from.*adapter' packages/core/` returns no matches (R25 / D3)

### Behavior checks

- [ ] The four-path exit matrix (Edit 4) passes on Windows / Node 24.15.0
- [ ] No `async.c:76` assertion / `0xC0000409` on any path
- [ ] `saci fetch` and `saci start` (with template) still produce their prior
      output and exit codes (regression)

### Git checks

- [ ] Branch used: `fix/start-exit-libuv-crash`
- [ ] Commits follow Conventional Commits (G-R3); subjects ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 1 — numbered plan presented and approved before any change
      (required; `Plan required: yes`)
- [ ] Pause 2 — first modified file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message +
      `pre-commit-self-audit` output shown before each commit
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2 (Lesson #6):

- **Pause 1 (before any code):** present a numbered plan and wait for
  approval. **Required** (`Plan required: yes`). The plan states the Step-1
  edits and the four-path matrix; it need not pre-plan Step-2 edits beyond
  noting the D1 fallback (executor branches to them only if Edit 4 fails).
- **Pause 2 (after the first modified file):** show the result and wait for
  review. **Always required.**
- **Pause 3 (before each commit):** show `git status` + `git diff --stat` +
  proposed message + `pre-commit-self-audit` output. **Always required.**

Note on D1: the Step-1 → Step-2 boundary is NOT a mentor pause. The fallback
is pre-ratified; the executor branches on the Edit 4 result and continues.
Pauses 2 and 3 still apply to every Step-2 edit and commit.

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md` as a
  follow-up brief.
- Undici version-pin uncertainty (D1 Step-2 guard) → STOP and report.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: yes` because:

- The Step-1 → Step-2 branch is decided empirically at runtime on Windows;
  the executor should present the plan and the four-path matrix before
  editing (Pause 1).
- Step 2's edits are specified as a ratified approach (D1), not as exact text
  snippets, and would touch ≥ 2 files plus add the project's first runtime
  dependency — so a plan is warranted if that branch is taken.
- Step 1 alone is specified with near-exact text (Edits 2–3), but the flag
  covers the whole conditional task.

Pause 2 and Pause 3 remain required regardless (Lesson #6).

## Git workflow

### Branch

`fix/start-exit-libuv-crash` off `main`. No push (R17 / G-R5).

### Commit sequence

Expected (Step 1 satisfies Edit 4):

1. `docs(tasks): add brief for 033-start-exit-libuv-crash`
2. `fix(adapter-jira): add Connection: close to Jira requests`
3. `fix(cli): remove process.exit from async run paths`

If Step 1 fails Edit 4 on Windows (Step 2 fallback — appended after 1–3):

4. `chore(deps): add undici runtime dependency`
5. `fix(adapter-jira): wire undici Agent with async dispose`
6. `fix(cli): wire gateway disposal in start and fetch roots`

Each subject is imperative mood, ≤ 72 chars, and its leading verb (`add`,
`remove`, `wire`) is in the `pre-commit-self-audit` allowlist SSOT.

## Reference documents (read before starting)

1. `CLAUDE.md` — R2, R9, R10, R11, R14, R20, R23, R24, R25
2. `docs/GIT_WORKFLOW.md` — G-R3, G-R5, G-A7
3. `docs/GOTCHAS.md` — known traps
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
5. `.claude/skills/brief-template/SKILL.md` — template reference
6. `.claude/skills/pre-commit-self-audit/SKILL.md` — Pause 3 self-audit
7. `packages/adapter-jira/src/http.ts`, `packages/cli/src/cli.ts`,
   `packages/cli/src/run-start.ts`, `packages/cli/src/run-fetch.ts`,
   `packages/adapter-jira/src/gateway.ts` — the files in scope

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Which step satisfied the four-path matrix (Step 1 or Step 2), with the
   Windows verification result
4. Any verification checkbox that could not be met, with explanation
5. Confirmation that no `git push` was executed
6. Suggested next step (open PR; if Step 2, capture the R2 undici
   justification in the PR description)
