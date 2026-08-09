# Brief: 2026-08-09 — Credential guard on the Jira read path

> **Category:** L
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `fix/fetch-credential-guard`

---

## Context

`saci fetch` can silently destroy a good `payload.json`. When the Jira
credentials are bad, the JQL search does not fail — it answers `200` with an
empty issue list, and `runFetch` (`packages/cli/src/run-fetch.ts:110`) writes
whatever it assembled, unconditionally. The next `saci export` then ships a
fact table with zero rows and nothing in the chain has reported an error.

This closes the Phase 3 ROADMAP item "Credential guard on `fetch`"
(`docs/ROADMAP.md:226`), queued by brief `2026-08-08-python-lane-and-fetch-guard`.
That brief deliberately left the guard's shape open; the shape is closed here
as D1–D3, owner-ratified 2026-08-09.

This is the first task to touch `packages/` since brief 047 and it spans three
packages — `core` (the port), `adapter-jira` (the implementation), `cli` (the
composition root and the CLI surface).

**Size note.** This brief runs ~750 lines total, over the ~500 the
`brief-template` skill indexes for a Category L planner-delegated brief. It
does **not** split, deliberately. The port method, its single implementation,
and the composition-root call that makes it fire are one another's
verification: a sub-brief shipping the port without a caller would close on
incomplete evidence, and a sub-brief shipping the non-destructive write alone
would leave standing the wrong-cause error message that motivated the task.
Two things drive the length rather than scope: the measured-evidence table and
its four consequences, which exist because the *point* of this task is that
the failure is invisible without them; and a test list specified case by case,
because R3 compliance here is the deliverable — a guard nobody proved fires is
not a guard.

### Measured evidence (2026-08-09, live)

Measured by the Orchestrator against `https://estrategia.atlassian.net` on
2026-08-09, with an invalid Basic credential **and** with no `Authorization`
header at all. This is the evidence this brief stands on. Do **not** cite
`docs/explorations/python-laboratory-lane.md` for it — that note carries a
second-hand claim from the Python lab, not this measurement.

| Request | Result |
|---|---|
| `POST /rest/api/3/search/jql`, jql `order by created DESC` | `400` — unbounded-JQL rejection, **not** an auth error |
| `POST /rest/api/3/search/jql`, jql `project = ECJ ORDER BY created` | `200` `{"issues":[],"isLast":true}` |
| `GET /rest/api/3/myself` | `401` `"Client must be authenticated to access this resource."` |
| `GET /rest/api/3/field` | `200` — array, 28 entries, **zero** `customfield_*` |

Four consequences:

1. **The silent-empty failure is real and reproducible.** A *bounded* JQL — the
   shape of every real Saci JQL — returns `200` with an empty list to an
   unauthenticated caller. `runFetch` then writes that payload unconditionally.
2. **On `fetch` there is an accidental guard, and it names the wrong cause.**
   `fetchIssues()` calls `validateFieldMapping()` first
   (`packages/adapter-jira/src/gateway.ts:103`), which throws because the
   configured `customfield_*` ids are absent from the anonymous 28-field
   catalog. Its message — `Configured entrega field "customfield_XXXXX" is not
   present in the Jira field catalog` — sends the operator hunting field ids
   while the real problem is the token.
3. **On `start` there is no guard at all.** `fetchIssueByKey` deliberately
   skips `validateFieldMapping` (`packages/adapter-jira/src/gateway.ts:129`),
   hits the `200`-empty, and dies with `expected exactly one issue, got 0` —
   also naming the wrong cause.
4. **Jira error messages come back localized.** The `400` above returned its
   message in Chinese. Any guard that keys on error-message text is broken by
   the operator's Atlassian locale. See constraint 5.

## Goal

Install a credential guard on the Jira read path so a bad token fails loud and
by name, and so a zero-issue fetch can never overwrite a non-empty
`payload.json`.

Out of scope:

- **`fetchIssueByKey` and the `start` path.** D3. `run-start.ts` is not
  touched. D1's placement on the port means `start` inherits the pre-flight
  when it is wired later.
- **Atlassian OAuth 2.0 3LO, and any unification of Jira and Google auth.**
  Explored separately on 2026-08-09; that exploration produces a Mentor note,
  not this brief. Nothing here migrates Jira off Basic auth or off the three
  `SACI_JIRA_*` env vars.
- **Any change to `adapter-drive`** or to `@saci/adapter-sheets`.
- **Editing `docs/explorations/python-laboratory-lane.md`.**
- **Re-writing the ROADMAP item's prose.** Edit 6 marks it shipped and changes
  nothing else. Planner finding, recorded so the executor does not re-derive
  it: `.claude/skills/brief-template/SKILL.md` carries no ROADMAP convention at
  all, but `docs/ROADMAP.md` itself does — `(shipped in brief NNN)` appended to
  the item name, at lines 106, 153, 187 and 208. Edit 6 follows that existing
  convention and stops there.
- **Retrying, backoff, or any transport-level resilience** on the new
  pre-flight call.
- **A new `docs/GOTCHAS.md` entry** for the localized-error-message trap, other
  than as the confirm point declared in Edit 5. The owner called it a
  *candidate*, not a decision; the executor asks rather than assumes.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/2026-08-09-fetch-credential-guard/**`
   - `packages/core/src/gateways.ts`
   - `packages/adapter-jira/src/http.ts`
   - `packages/adapter-jira/src/gateway.ts`
   - `packages/adapter-jira/src/gateway.test.ts`
   - `packages/adapter-jira/src/http.test.ts`
   - `packages/cli/src/argv.ts`
   - `packages/cli/src/argv.test.ts`
   - `packages/cli/src/cli.ts`
   - `packages/cli/src/run-fetch.ts`
   - `packages/cli/src/run-fetch.test.ts`
   - `packages/cli/src/run-start.test.ts` (port-ripple only — see Edit 2)
   - `docs/ROADMAP.md`

   If anything else needs changing, **STOP and ask**. In particular
   `packages/cli/src/run-start.ts` is off-limits (D3).

2. Follow all rules in `CLAUDE.md`. Load-bearing here: **R2** (no new runtime
   dependency — the pre-flight uses the existing injected `FetchLike`), **R3**
   (new tests are mandatory), **R4** (no silent catch), **R7** (named
   constants), **R8** (comments say why), **R20** (strict TS), **R21** (ESM,
   `.js` import extensions), **R23** (`node:test`, colocated `*.test.ts`),
   **R24** (no `any`), **R25** (dependency direction — `core` stays
   interface-only, zero implementation, zero library import).

3. Follow `docs/GIT_WORKFLOW.md` fully:
   - Branch `fix/fetch-credential-guard`, already created from base HEAD
     `b252d37` (= `origin/main`, PR #127). The session branch
     `claude/tarefas-do-dia-2badf8` violates R11 / G-R2 and carries no commit
     from this task.
   - Conventional Commits (G-R3), subjects ≤ 72 chars.
   - No `Co-authored-by` trailer (G-A7).
   - Commit freely; **DO NOT push** (G-R5 / R17). The executor commits and
     stops.
   - No `STATE.md`: this is a single-session task despite the L sizing.

4. **The guard must key on HTTP status codes only, never on error-message
   text.** Jira returns localized messages (evidence table above: a `400` came
   back in Chinese). Any `includes(...)` / regex against a Jira message body as
   a control-flow decision is a defect in this brief's terms.

5. **`packages/core` gains an interface member and nothing else.** No
   implementation, no import beyond the existing `type` imports. Verify with
   `grep -rn 'from.*adapter' packages/core/src/` returning no matches (R25).

6. **The happy path must not gain an extra file read.** The prior-payload check
   in D2 runs only when the assembled payload has zero issues.

7. `npm run build` then `npm test` must pass from the repo root before every
   commit that touches `packages/`. The pre-commit hook is **not** wired in
   this clone (`core.hooksPath` unset) — run both manually.

### Conventions

- All source, comments, identifiers and commit messages in English (R9).
- Commit scopes follow the existing log: `feat(cli)`, `feat(adapter-jira)`,
  `docs(tasks)`, `docs(roadmap)`. A change spanning `core` + `adapter-jira` +
  test fakes uses no scope (see the commit sequence).
- New named constants at module top in `SCREAMING_SNAKE_CASE` (R7).
- Tests use `node:test` + `node:assert`, colocated, exercising the existing
  injected seams: `FetchLike` for the adapter, an in-memory fake `JiraGateway`
  plus `mkdtempSync` for the composition root.

### Architectural decisions already made (do not revisit)

D1–D3 are owner-ratified (2026-08-09). D4–D8 are planner-closed shape
decisions; if the executor believes one is wrong, raise it at Pause 1 — do not
change it silently mid-execution.

#### D1 — The pre-flight auth check is a port method

A pre-flight auth check enters as a method on the `JiraGateway` **port** in
`@saci/core` (`packages/core/src/gateways.ts`), implemented by `adapter-jira`
against `GET /rest/api/3/myself`, and called by the composition root `runFetch`
**before** `fetchIssues()`.

Rationale for the port rather than adapter-internal: the composition root owns
the guard, the guard stays unit-testable against the existing in-memory fake,
and the future `start` wiring inherits it. Fail loud (R4) with a message that
names the credential as the cause. Note R25 — the port is interface-only, zero
implementation, zero library import.

#### D2 — A non-destructive write enters `runFetch`

This covers what the pre-flight cannot: a valid token with a wrong JQL, or a
revoked project permission, also yields an empty result.

Shape: when the assembled payload has zero issues **and** the file already at
`outputPath` parses as a payload with a non-empty `issues` array, refuse to
write, and fail with `EXIT_RUNTIME` (`packages/cli/src/cli.ts:33`) naming an
`--allow-empty` escape hatch.

`runFetch` today only writes and never reads, so reading the prior payload is
new behavior. A **missing, unreadable or unparseable prior file is NOT an
error** — there is nothing to protect, so the write proceeds. R4 applies to how
that case is logged: it is logged, never swallowed.

#### D3 — `fetchIssueByKey` / the `start` path is out of scope

D1's placement means `start` inherits the guard when it is wired later. Do not
touch `run-start.ts`. `run-start.test.ts` is touched only to satisfy the
widened port on its in-memory fake (Edit 2).

#### D4 — The port member is `verifyCredentials(): Promise<void>`

Void return, fail-loud. There is no `boolean` return and no
`CredentialStatus` object: a `false` a caller can ignore is exactly the silent
failure this brief exists to remove (R4).

#### D5 — The credential-rejected message is raised in `adapter-jira`, and names no env var

`401` and `403` both count as credential rejection. `403` on Atlassian covers a
blocked or CAPTCHA-challenged account, which is still an operator credential
problem, and lumping them keeps the check status-code-only (constraint 4).

The message does **not** name `SACI_JIRA_EMAIL` / `SACI_JIRA_API_TOKEN`: those
constants live in `packages/cli/src/cli.ts` and naming them from the adapter
would invert the layering (R25). Brief 044's env-naming message already covers
the *absent*-variable case at the CLI boundary; this covers the *rejected*
case at the adapter boundary.

#### D6 — `runFetch` gains a fourth positional parameter

`runFetch(makeGateway, outputPath, now = new Date(), allowEmpty = false)`. An
options object would rewrite both existing call sites and every existing test
for no behavioral gain (A3 — wait for the third use). `cli.ts` passes the clock
explicitly rather than `undefined`.

#### D7 — `--allow-empty` is a boolean flag on `fetch`, defaulting to `false`

It joins the single shared `CLI_OPTIONS` schema in `argv.ts` (the on-ramp
tolerance of D-a2: a flag irrelevant to another command is accepted and
ignored) and surfaces as `allowEmpty: boolean` on the `fetch` variant of
`ParsedCommand`.

#### D8 — The prior-payload read is local to `run-fetch.ts`

A module-private helper, not exported, not promoted to `core`. It is tested
through `runFetch`, which is the behavior that matters. No new file.

## Done criteria

### Edit 1 — Verify the branch and the brief commit

The planner created the branch and committed this brief as commit #1. The
executor verifies rather than re-creates.

- [ ] `git branch --show-current` is `fix/fetch-credential-guard`, with no
      upstream (`git branch -vv` shows no `[origin/...]`)
- [ ] `git log --oneline b252d37..HEAD` shows exactly one commit, subject
      `docs(tasks): add brief for 2026-08-09-fetch-credential-guard`
- [ ] `docs/tasks/2026-08-09-fetch-credential-guard/brief.md` exists; its first
      line matches the title above
- [ ] `git status` is clean

If the branch is `claude/tarefas-do-dia-2badf8`, or the brief is missing, or
the first line does not match, **STOP and report**. Do not regenerate the brief
from memory and do not commit onto the `claude/*` branch.

#### P4 — four-source slug check for `fetch-credential-guard`

Run by the planner on 2026-08-09, against the slug actually kept. Recorded so
the executor and the closer do not re-derive it. Verdict: **free, no suffix**.

1. **Task folders** — `ls docs/tasks/` lists 51 entries, from
   `000-bootstrap-decisions-and-tasks-convention` through
   `2026-08-08-python-lane-and-fetch-guard`. No entry contains
   `fetch-credential-guard`. The nearest neighbour is
   `2026-08-08-python-lane-and-fetch-guard` — a different slug
   (`python-lane-and-fetch-guard`), and the brief that queued this one.
2. **Shipped on `main`** — `git log --oneline main | head -50` tops out at
   `b252d37 docs: declare the Python lane permanent and queue the fetch guard
   (#127)`. No commit subject names `fetch-credential-guard`.
3. **Reserved in doctrine or an exploration note** —
   `grep -rn 'fetch-credential-guard' CLAUDE.md docs/` exits `1` with no
   output. No `E*` reserve and no exploration note claims it.
4. **Held on a branch or in a live worktree** — `git branch -a` lists
   `claude/tarefas-do-dia-2badf8`, `docs/python-lane-and-fetch-guard`, `main`,
   `remotes/origin/HEAD`, `remotes/origin/main`. `git worktree list` lists
   `D:/Projects/saci` at `b252d37 [main]` and
   `D:/Projects/saci/.claude/worktrees/brief-052-task-cutover-278d50` at
   `b252d37 [claude/tarefas-do-dia-2badf8]`. Neither holds the slug.

The four sources agree. The task id `2026-08-09` is the self-assigned birth
date (`docs/PROCESS_MAP.md` §7); nothing was looked up to obtain it.

### Edit 2 — Add `verifyCredentials` to the port and implement it

Four files move together because they are one compile unit: adding a member to
`JiraGateway` breaks `class JiraGateway implements JiraGatewayPort` and both
in-memory fakes until all four are updated. Splitting them would leave a commit
that does not build.

#### 2a. `packages/core/src/gateways.ts`

Add a member to the `JiraGateway` interface, above `fetchIssues`, with a
doc comment stating the port contract: void on success, throw on rejection,
and that the composition root calls it before any search. Interface-only — no
import is added to this file (R25, constraint 5).

Suggested shape (wording is the executor's, contract is not):

```ts
  /**
   * Verify the configured credentials before any search. Fail-loud (R4): a
   * rejected credential throws naming the credential as the cause; success
   * returns void. Exists because a bad token does not make a bounded JQL
   * search fail — it answers 200 with an empty issue list (measured
   * 2026-08-09), which would otherwise reach the caller as "no work today".
   */
  verifyCredentials(): Promise<void>;
```

No change to `packages/core/src/index.ts` — `JiraGateway` is already exported
as a type.

#### 2b. `packages/adapter-jira/src/http.ts`

- Add `const MYSELF_PATH = "/rest/api/3/myself";` beside the existing path
  constants (R7).
- Add a `verifyCredentials(): Promise<void>` method to `JiraHttpClient`: a
  `GET` shaped exactly like `getFields` — same headers, same
  `AbortSignal.timeout(REQUEST_TIMEOUT_MS)`, **no `body` key** (Node `fetch`
  throws on a GET with any body; see the `FetchLike` comment).
- Branch on `response.status` only (constraint 4):
  - `401` or `403` → throw the credential-named error.
  - any other non-`ok` → throw the existing generic
    `Jira API error ${status}: ${detail}` form, consistent with the other two
    methods.
  - `ok` → return; the response body is not parsed. Nothing in this codebase
    needs the account record, and parsing it would invite a message-text
    dependency.

The credential-rejected message must name the credential as the cause and must
mention neither an env var (D5) nor a field id. Reference wording:

```
Jira rejected the configured credentials (HTTP 401 on /rest/api/3/myself). The email / API token pair is invalid, expired, or revoked.
```

The `401` is the actual status; interpolate it.

#### 2c. `packages/adapter-jira/src/gateway.ts`

Add `async verifyCredentials(): Promise<void>` to the `JiraGateway` class,
delegating to `this.http.verifyCredentials()`. Place it **above** `fetchIssues`
so the reading order matches the call order. Do **not** call it from inside
`fetchIssues` — the composition root owns the call (D1). Do not touch
`fetchIssueByKey` or `validateFieldMapping` (D3).

Also update the file's header comment block, which enumerates the port
contract, if and only if it goes stale — otherwise leave it.

#### 2d. Port ripple — the two in-memory fakes

- `packages/cli/src/run-fetch.test.ts:34` — `fakeMakeGateway` gains an
  `async verifyCredentials(): Promise<void> {}` that resolves.
- `packages/cli/src/run-start.test.ts:43` — `fakeMakeGateway` gains an
  `async verifyCredentials(): Promise<void>` that **throws**, matching the
  file's existing convention for methods the start run never exercises
  (`fetchIssues` there already throws "is not exercised by the start run" —
  explicit throw, not a silent stub, R4).

This is the only permitted change to `run-start.test.ts`.

#### 2e. New adapter tests — `packages/adapter-jira/src/http.test.ts`

Using the existing injected `FetchLike` (zero network):

- `verifyCredentials` resolves on a `200`.
- `verifyCredentials` throws on `401`, and the message names the credential —
  assert on a stable substring such as `credentials`, and assert it does
  **not** contain `customfield`.
- `verifyCredentials` throws on `403`.
- `verifyCredentials` throws the generic `Jira API error` form on `500`.
- The request is a `GET` to a URL ending `/rest/api/3/myself`, carries an
  `Authorization` header, and its `init` has **no** `body` key
  (`assert.ok(!("body" in init))`).
- At least one negative case where the response body text is non-English
  (e.g. a Chinese message on the `401`) and the thrown message is still the
  English credential message — the status-code-only contract (constraint 4)
  under test, not just in prose.

Verification:

- [ ] `grep -c 'verifyCredentials' packages/core/src/gateways.ts` returns `1`
- [ ] `grep -rn 'from.*adapter' packages/core/src/` returns no matches (R25)
- [ ] `grep -n 'MYSELF_PATH' packages/adapter-jira/src/http.ts` shows the
      constant declared at module top and used once
- [ ] No `includes(`, `match(`, `test(` or `indexOf(` is applied to a Jira
      response body as a control-flow decision in the new code (constraint 4)
- [ ] `packages/cli/src/run-start.ts` appears in no diff:
      `git diff --name-only b252d37..HEAD` does not list it
- [ ] `npm run build` passes
- [ ] `npm test` passes, and the new `verifyCredentials` tests appear in the
      output

Commit: `feat: add a Jira credential pre-flight to the gateway port`

### Edit 3 — Wire the pre-flight and the non-destructive write into `runFetch`

`packages/cli/src/run-fetch.ts` only.

#### 3a. Call the pre-flight

Between `const gateway = makeGateway(...)` and `await gateway.fetchIssues()`,
insert `await gateway.verifyCredentials();`. A throw propagates untouched to
`main()`'s catch, which prints it and sets `EXIT_RUNTIME` — no `try` here, and
no new exit code.

#### 3b. Add the `allowEmpty` parameter

Signature becomes, per D6:

```ts
export async function runFetch(
  makeGateway: MakeGateway,
  outputPath: string,
  now: Date = new Date(),
  allowEmpty = false,
): Promise<Payload>
```

#### 3c. Add the module-private prior-payload helper (D8)

A function that, given a path, returns the number of issues in the payload
already on disk, or `null` when there is nothing to protect. It must treat
**all** of the following as "nothing to protect": the file does not exist, it
cannot be read, it is not valid JSON, it parses to something that is not an
object, or its `issues` is not an array. Each of those paths **logs** — one
`console.warn` naming the path and the cause — and returns `null`. Nothing is
swallowed (R4, A1). `ENOENT` is the one case that is expected rather than
anomalous and may log at a lower key or not at all — if the executor chooses
not to log `ENOENT`, say so in a one-line `why` comment (R8), because a
non-logging branch is exactly what R4 exists to make deliberate.

Types: narrow from `unknown`, no `any` (R24). Reuse the `Payload` type from
`@saci/core` for the successful narrow.

#### 3d. Gate the write

Immediately before `writeFile`:

- If `payload.issues.length > 0` → write, unchanged. Do not read the prior
  file (constraint 6).
- Else if `allowEmpty` → write.
- Else read the prior payload; if it has a non-empty `issues` array, **throw**
  and do not write. Reference wording:

```
Refusing to overwrite <outputPath>: the fetch returned 0 issues but the existing payload holds <n>. Re-run with --allow-empty to write the empty payload.
```

  Interpolate the real path and count. The message must contain the literal
  string `--allow-empty`.
- Else → write.

Update the function's doc comment to state the two new behaviors and why (R8).

Verification:

- [ ] `grep -n 'verifyCredentials' packages/cli/src/run-fetch.ts` shows the
      call, and it precedes the `fetchIssues` line
- [ ] `grep -c 'allow-empty' packages/cli/src/run-fetch.ts` returns `1`
      (the escape-hatch mention in the refusal message)
- [ ] No `catch` block in the new code is empty or returns without logging
      (R4 / A1)
- [ ] `grep -c ': any' packages/cli/src/run-fetch.ts` returns `0` (R24)
- [ ] `npm run build` passes

Commit: `feat(cli): add the non-destructive payload write to fetch`

### Edit 4 — Surface `--allow-empty` on the CLI and cover it with tests

#### 4a. `packages/cli/src/argv.ts`

- `CLI_OPTIONS` gains `"allow-empty": { type: "boolean" },`.
- `CliValues` gains `"allow-empty"?: boolean;`.
- The `fetch` variant of `ParsedCommand` gains `allowEmpty: boolean`.
- `routeCommand`'s `fetch` return gains
  `allowEmpty: values["allow-empty"] ?? false`.
- `USAGE`'s first command line wraps, matching the `start` lines' existing
  continuation style:

```
  saci fetch --jql <string> [--out <path>] [--allow-empty]
             [--field-config <path> --project <KEY>]
```

#### 4b. `packages/cli/src/cli.ts`

The `fetch` case passes the flag through, with the clock explicit (D6):

```ts
const payload = await runFetch(makeGateway, command.out, new Date(), command.allowEmpty);
```

No other change to `cli.ts`. `EXIT_RUNTIME` already covers the throw from
Edit 3 via `main()`'s existing catch.

#### 4c. `packages/cli/src/argv.test.ts`

- `saci fetch --jql X` yields `allowEmpty: false`.
- `saci fetch --jql X --allow-empty` yields `allowEmpty: true`.
- `USAGE` contains `[--allow-empty]`.

#### 4d. `packages/cli/src/run-fetch.test.ts`

New tests, using the existing `mkdtempSync` + fake-gateway pattern. Each fake
supplies `verifyCredentials` explicitly.

- **Pre-flight fires first**: a fake whose `verifyCredentials` throws and whose
  `fetchIssues` throws a *different*, distinguishable error. `runFetch`
  rejects with the `verifyCredentials` error, proving the ordering; and the
  output file is not created.
- **Pre-flight passes**: the existing happy-path tests still pass unchanged
  except for the added fake method.
- **Refusal**: seed `outputPath` with a payload holding one issue; run a fake
  returning zero issues; assert `runFetch` rejects, the message contains
  `--allow-empty`, and the file on disk is **byte-identical** to the seed.
- **Escape hatch**: same setup with `allowEmpty = true`; assert the file is
  overwritten and its `issues` array is empty.
- **Nothing to protect — missing file**: zero issues, no file at `outputPath`;
  assert the empty payload is written and `runFetch` resolves.
- **Nothing to protect — unparseable file**: seed `outputPath` with
  `not json at all`; zero issues; assert the empty payload is written,
  `runFetch` resolves, and a warning was emitted (capture `console.warn`).
- **Nothing to protect — prior payload with an empty `issues` array**: zero
  issues, prior file valid but empty; assert the write proceeds.
- **Happy path does not read the prior file**: a fake returning one issue,
  with a prior file present; assert the write happened. Optionally assert the
  no-read property directly if it can be done without new machinery — if it
  cannot, skip it rather than build a read-spy for one assertion, and say so
  in the final report.

Verification:

- [ ] `npm run build` passes
- [ ] `npm test` passes from the repo root; every new test above appears in the
      output by name
- [ ] `grep -c 'allow-empty' packages/cli/src/argv.ts` returns `3` — the
      `CLI_OPTIONS` key, the `CliValues` key, and the `USAGE` line (it returns
      `0` on `b252d37`). If the real count differs, report the actual number
      rather than editing the file to force it
- [ ] `node packages/cli/dist/cli.js fetch` (no `--jql`) still exits `2` and
      prints the usage text including `[--allow-empty]`

Commit: `feat(cli): add the non-destructive payload write to fetch` — see the
commit sequence: Edits 3 and 4 share one commit. Stage them together and run
Pause 3 once.

### Edit 5 — Confirm point: the localized-message GOTCHA

**STOP and confirm before acting.** The owner named the localized-error-message
trap "a candidate GOTCHAS entry", not a decision. The executor does not decide
it.

At Pause 2, present this as a bundle question with the recommended default:

> Constraint 4 is now enforced in code and tested. Jira returns localized
> error messages (a `400` came back in Chinese on 2026-08-09), so any guard
> keyed on message text breaks on the operator's Atlassian locale.
> **Recommended:** add `G-JIRA-1 — Jira error messages are localized; key on
> status codes` to `docs/GOTCHAS.md`, in the existing `### G-CAT-N` format,
> as its own `docs(gotchas):` commit. **Alternative:** leave it out of this
> brief and queue it.

- [ ] The question was asked at Pause 2
- [ ] The owner's answer is recorded in the final report
- [ ] If the answer is "add it": the entry follows the `## Format` section of
      `docs/GOTCHAS.md`, uses a category consistent with the existing
      `G-DRIVE-*` / `G-NODE-*` naming, cites the 2026-08-09 measurement, and
      ships as a separate commit `docs(gotchas): document the localized Jira
      error messages` — added to the commit sequence at that point, with
      `docs/GOTCHAS.md` added to constraint 1's path list by the same approval
- [ ] If the answer is "leave it out": nothing is written, and the final report
      names it as queued

### Edit 6 — Mark the ROADMAP item shipped

`docs/ROADMAP.md` only. Replace line 226 exactly:

```
- Credential guard on `fetch`. Jira's `POST /rest/api/3/search/jql` answers
```

with:

```
- Credential guard on `fetch` (shipped in brief
  2026-08-09-fetch-credential-guard). Jira's `POST /rest/api/3/search/jql`
  answers
```

Everything from line 227 onward is untouched, so the paragraph still reads
"... `POST /rest/api/3/search/jql` answers `200` with an empty list when the
token has expired, not `401` ...". That sentence stays: the live measurement
confirms it for bounded JQL, which is the only JQL shape Saci issues. Do not
rewrite it, do not touch the
`docs/explorations/python-laboratory-lane.md` citation on line 232, and do not
edit any other ROADMAP line — including the layer-status table.

Verification:

- [ ] `grep -c 'Credential guard on' docs/ROADMAP.md` returns `1`
- [ ] `grep -n 'shipped in brief' docs/ROADMAP.md` shows five occurrences (the
      four pre-existing plus this one)
- [ ] `git diff --stat docs/ROADMAP.md` shows a single hunk

Commit: `docs(roadmap): update the credential guard item to shipped`

### Commit sequence

1. `docs(tasks): add brief for 2026-08-09-fetch-credential-guard`
2. `feat: add a Jira credential pre-flight to the gateway port`
3. `feat(cli): add the non-destructive payload write to fetch`
4. `docs(roadmap): update the credential guard item to shipped`

Commit #1 was already created by the planner. Commit #2 carries Edit 2, commit
#3 carries Edits 3 and 4, and commit #4 carries Edit 6.

Plus, only if Edit 5 is approved by the owner at Pause 2, inserted before the
ROADMAP commit:

- `docs(gotchas): document the localized Jira error messages`

All subjects verified ≤ 72 chars (measured with
`printf '%s' "<subject>" | wc -L`: 60, 58, 57, 58). All leading verbs are on
the `pre-commit-self-audit` allowlist: `add`, `add`, `add`, `update`,
`document`.

### Automated checks (run before each commit)

- [ ] `npm run build` passes from the repo root, no errors
- [ ] `npm test` passes from the repo root, no failures
- [ ] `tsc` reports no `strict`-mode error and no `@ts-ignore` /
      `@ts-expect-error` was introduced (R20)

### Structural checks

- [ ] No file outside constraint 1's list was modified — verify via
      `git diff --name-only b252d37..HEAD`
- [ ] `packages/cli/src/run-start.ts` is not in that list (D3)
- [ ] No new entry in any `package.json` `dependencies` (R2) —
      `git diff b252d37..HEAD -- '**/package.json'` is empty
- [ ] Every new file, if any, is colocated per R23 (no new file is expected)

### Behavior checks

- [ ] A gateway whose `verifyCredentials` throws makes `runFetch` reject before
      `fetchIssues` runs, and leaves `outputPath` untouched
- [ ] A zero-issue fetch against a non-empty existing `payload.json` rejects,
      names `--allow-empty`, and leaves the file byte-identical
- [ ] The same run with `--allow-empty` overwrites
- [ ] A zero-issue fetch with no existing file writes and resolves
- [ ] A zero-issue fetch against an unparseable existing file writes, resolves,
      and logs
- [ ] A non-empty fetch behaves exactly as before this brief

### Git checks

- [ ] Branch used: `fix/fetch-credential-guard`, based on `b252d37`
- [ ] No commit landed on `claude/tarefas-do-dia-2badf8`
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] Commit subjects are verbatim what was approved at Pause 3 — verify with
      `git log -1` after each commit and amend if drifted
- [ ] `git status` clean on the branch at the end
- [ ] **NO** `git push` was executed
- [ ] No `STATE.md` created

### Process checks

- [ ] `Plan required: yes` — a numbered plan was presented and approved before
      any change (Pause 1)
- [ ] Pause 2 — the first modified source file shown for review before
      proceeding, and the Edit 5 confirm question asked
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed commit message
      shown before each commit
- [ ] `pre-commit-self-audit` skill output reported in chat before each
      Pause 3 submission
- [ ] Any criterion that could not be met was reported explicitly

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code):** present a numbered plan and wait for approval.
  **Required** — `Plan required: yes`.
- **Pause 2 (after the first modified file):** show the result and wait for
  review. **Always required.** The Edit 5 confirm question is asked here.
- **Pause 3 (before each commit):** show `git status` + `git diff --stat` +
  proposed message + `pre-commit-self-audit` output. **Always required.**

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document as a follow-up brief
  (except the one Edit 5 already covers).

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: yes`, for three reasons:

- The change spans three packages and eleven files, well past R15's
  "≥ 2 files or ≥ 50 lines" threshold.
- It widens a **port**. Every implementer and every in-memory fake ripples;
  the executor should show the full ripple list at Pause 1 before touching
  anything, in case a fake exists that this brief did not find.
- This is the first `packages/` work since brief 047. The build/test loop is
  cold, and Pause 1 is where a stale `dist/` or a worktree module-resolution
  trap (`docs/GOTCHAS.md` G-NODE-2) surfaces cheaply rather than at commit
  time.

D1–D8 are closed regardless; Pause 1 is for sequencing and ripple, not for
re-opening decisions.

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules (R2, R3, R4, R7, R8, R20, R21, R23, R24,
   R25)
2. `docs/GIT_WORKFLOW.md` — G-R2, G-R3, G-R5, G-A7
3. `docs/GOTCHAS.md` — especially **G-NODE-2** (worktree sessions silently
   resolve `@saci/*` imports to the main checkout) and the `## Format` section
   if Edit 5 is approved
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
5. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit (Pause 3)
6. `docs/tasks/2026-08-08-python-lane-and-fetch-guard/brief.md` — the brief
   that queued this one
7. `packages/adapter-jira/src/http.ts` and `http.test.ts` — the `FetchLike`
   seam the new adapter tests reuse
8. `packages/cli/src/run-fetch.test.ts` — the in-memory-fake +
   `mkdtempSync` pattern the new composition-root tests reuse

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline b252d37..HEAD` (commit count, ordered)
2. `git diff --stat b252d37..HEAD` (line counts per file)
3. The owner's answer to the Edit 5 confirm question, and what was done with it
4. Any verification checkbox above that could not be met, with explanation —
   including the optional no-read assertion in Edit 4d
5. Confirmation that no `git push` was executed
6. Suggested next step (open PR, follow-up brief, etc.)
