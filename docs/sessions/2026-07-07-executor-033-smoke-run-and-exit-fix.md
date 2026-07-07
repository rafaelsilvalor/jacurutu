# Session recap — 2026-07-07 — 033-start-exit-libuv-crash (executor)

**Mode:** caminho-A executor handoff (planner → brief-validator APPROVED 11/11 →
mentor gate → executor) run start-to-finish in one session, all Pauses driven by
Rafael as mentor. Root-cause investigation (read-only) preceded the brief and set
the fix design; this record covers the execution side of brief 033.
**Executor:** Claude Code executor subagent (implementation) + Code main session
(orchestration / relay at every Pause), Rafael as mentor.
**Merged via:** PR #81, squash merge → `main@b05b688`.
**Pairs with:** `2026-07-07-mentor-033-smoke-run-and-exit-fix.md` (smoke-run
triage + D1 ratification + gate). This is the execution-side record only.

## One-line summary

Fixed the `0xC0000409` libuv double-close abort (`src\win\async.c:76`) at
`saci start` process exit on Windows/Node 24.15 — a termination race between
`process.exit()` and the undici keep-alive socket left open by `globalThis.fetch`.
Step 1 (zero-dependency) sufficed: send `Connection: close` on both Jira requests
and migrate the async run paths from `process.exit()` to `process.exitCode`. The
pre-ratified Step 2 (`undici` as a runtime dependency) was **not** triggered.

## Root cause (from the read-only investigation, confirmed by the fix)

`process.exit()` at `cli.ts:121/125` forces an abrupt libuv teardown that skips
draining the event loop. `globalThis.fetch` (`http.ts:88`) leaves a keep-alive
socket in undici's pool after each response; at forced exit that handle is still
mid-close, tripping the libuv double-close assertion on Windows. The crash
appeared **only on the fast paths** (`--blank` happy path, collision) because they
do little/no post-network work; the with-template path (`copyFile`) and pure
`fetch` (extra round-trip + payload write) give the loop enough turns to settle
the socket, masking the race. `packages/core` needed no change (R25).

## Built

- `packages/adapter-jira/src/http.ts` (+2) — `Connection: "close"` added to the
  header block of both requests: `searchJql` (POST) and `getFields` (GET), each
  after `Authorization`. No other line touched; `AbortSignal.timeout` / `body`
  left as-is.
- `packages/cli/src/cli.ts` (+2/−2) — `process.exit(EXIT_OK)` → `process.exitCode
  = EXIT_OK` and `process.exit(EXIT_RUNTIME)` → `process.exitCode = EXIT_RUNTIME`
  on the async run paths (lines 121/125). The synchronous `version` / `usage`
  exits (111/116) stay `process.exit(...)` (D2 — no async network work precedes
  them, so no keep-alive handle exists there).

No new files, no new tests (see "Regression test" below), no dependency added.

## Decisions implemented (as built)

- **D1 — conditional two-step, no mentor return between steps.** Step 1
  (zero-dep) attempted first; the 4-path Windows matrix was the decision gate.
  Matrix passed 4/4 → **Step 1 sufficed; Edits 5–7 (Step 2) skipped**; `undici`
  never installed; the zero-runtime-dependency invariant (R2) is preserved.
- **D2 — sync exits stay.** Only the async success/error paths migrated to
  `process.exitCode`; version/usage `process.exit()` unchanged.
- **Step 1 mechanism.** `Connection: close` makes the server close the connection
  after each response, so no keep-alive handle survives to be double-closed at
  exit; `process.exitCode` + natural return lets the now-handle-free loop drain
  and exit with the same semantic code.

## Pause 1 rulings (three questions) — as decided by the mentor

1. **Credentials — provide live (option 2).** The matrix is the done criterion;
   Rafael set `SACI_JIRA_*` and the run reused the smoke fixtures.
2. **STATE.md — skip**, per the 032 precedent (single-session, closed plan,
   commit sequence excludes it); reopen only if Step 2 fired (it did not).
3. **Regression test asserting the header in `http.test.ts` — not added.** It
   locks implementation rather than behavior and goes stale if Step 2 fires; the
   empirical matrix is the behavior guarantee.

Edit 1 verify-only deviation (brief already at HEAD, `2ea3a69`) acknowledged and
accepted — no re-commit possible.

## Verification — the done criterion

**Edit 4 — 4-path exit-code matrix, Windows / Node 24.15.0, card MCA-63821:**

| Path | Expected | `$LASTEXITCODE` | `async.c:76` / `0xC0000409` |
| --- | --- | --- | --- |
| collision (rerun, leaf exists) | 1 | **1** | none |
| `--blank` happy | 0 | **0** | none |
| with-template happy | 0 | **0** | none |
| `fetch` | 0 | **0** | none |

Every path returned its correct semantic exit code with zero libuv assertions.
The only stderr on the start paths was the benign `warning MCA-63821.parent_key:
issue has no parent` sink message (PowerShell re-wraps stderr as
`NativeCommandError`; the true code was read via `$LASTEXITCODE`).

- `npm test` (all workspaces, compiled `dist/`) — **189 pass / 0 fail**.
- R25: `grep -rn 'from.*adapter' packages/core/` — empty; `packages/core`
  untouched.
- R24 (`\bany\b`) / R20 (`@ts-ignore` / `@ts-expect-error`) — clean in the diff.
- `tsc -b` clean.
- `pre-commit-self-audit` at each Pause 3 (Edits 2 & 3): 10 checks total, 10 PASS.

## Green mechanism (record integrity)

The pre-commit hook is **not wired in this clone** (`core.hooksPath` unset), so
`npm test` did not auto-run on commit; green was proven by running the full suite
manually (189/0). The PR template's "pre-commit hook ran" checkbox was left
unchecked with that note rather than falsely ticked (same discipline as briefs
031/032).

## Process incidents (both recorded)

1. **Lost go at Pause 3 (Edit 2):** the commit was approved but the executor's
   round ended without the `git commit` executing; no error surfaced. Detected
   because the mentor asked for evidence. Recovery: re-issued go and required
   **raw `git log --oneline -3` pasted before proceeding to Edit 4** — Pause 3
   now closes on evidence, not on the executor's own confirmation. Doctrine
   extension: *ground-truth before asserting current state applies to the
   executor's success confirmations, not just initial state.* If it recurs:
   candidate mechanical check — Pause 3 closes only on pasted `git log -1`.
2. **Wrong path in a mentor ruling:** the Pause 1 snippet gave templates root
   `D:\Projects\cabu\templates`, which does not exist; the smoke fixture lives at
   `D:\Projects\cabu\smoke\templates` (`ECJ/ecj_3tri-2026-v1.psd`). The executor
   corrected it autonomously for the verification run only (nothing repo-touched)
   and reported the correction — correct on both counts.

## Commits (PR #81, squash-merged)

- `2ea3a69` `docs(tasks): add brief for 033-start-exit-libuv-crash` (commit #1;
  caminho-A — brief pre-saved, Edit 1 verify-only).
- `18b1564` `fix(adapter-jira): add Connection: close to Jira requests` (Edit 2).
- `05c923b` `fix(cli): remove process.exit from async run paths` (Edit 3).

Squashed to `main@b05b688` as
`fix(start): resolve libuv double-close crash at process exit on Windows (#81)`.

## Post-merge cleanup (this session)

Checked out `main`, fast-forwarded to `b05b688` (squash landed exactly the 3
in-scope files: brief.md, `http.ts` +2, `cli.ts` +4/−2), force-deleted the local
`fix/start-exit-libuv-crash` branch (`git branch -d` refuses a squash-merged
branch — content verified present in `b05b688` first), remote ref already pruned.
Working tree clean but for the pre-existing untracked `payload.json`.

## Carried items (no action this session)

- **`payload.json` untracked clutter** (recurring): candidate `.gitignore` entry
  in a future chore. Verified NOT tracked; no repo cleanup needed now.
- **Missing-env error DX:** name the actually-missing var, not all three (1st/2nd
  occurrence; recorded, not rule-of-three yet).
- **Stale-fixture path** now captured so the next smoke run points at
  `D:\Projects\cabu\smoke\templates`.

## Next step

Mentor's front-runner for the next session: **docs reconciliation** (derivePath
D2 segments deviation + the removed `Workspace` type in the Phase 2 exit criterion
+ the new semester-boundary contract sentence), with keyless start /
schemaVersion 2 behind it. Not part of this PR or this recap.
