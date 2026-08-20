# Brief: 2026-08-20 — Read the Jira credentials from a file under `~/.jacurutu/`

> **Category:** L
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `feat/jira-credentials-file`

---

## Context

`jacurutu fetch` and `jacurutu start <KEY>` cannot run on the owner's machine.
`docs/explorations/jira-credentials.md` §1 measured it on 2026-08-19: **0 of 4**
`JACURUTU_*` variables set in any of the three Windows environment scopes, and no
dotenv file anywhere in the worktree. The cause is not the product rename — the
same sweep covered the old `SACI_*` names and found nothing durable under those
either. The cause is that a credential has been living in a terminal session's
process memory since brief 026, and every terminal that closes takes it with it.

Jira is the only one of this product's four credential-or-state locations with no
file. Drive's credentials, the designer identity and the report state all survive
a new terminal because each has one; Jira's do not because it has none. That
asymmetry is the whole of the measured breakage, and this brief closes it.

The owner ratified **option A** on 2026-08-20 (note §6): the credential stays an
Atlassian API token used with HTTP Basic, and it moves from the environment into
a file. OAuth 2.0 (3LO) is a different, larger piece of work — `JAC-31`, behind
`JAC-29` and `JAC-30` — and **nothing here anticipates it**. The note's §0
correction stands and is restated because the phrasing keeps inviting the other
reading: Google does not authenticate Jira and cannot, so "like Drive" means the
shape of the flow and the location of the credential, never a shared login.

**One premise of the delegation is corrected here, in writing.** The note says
`adapter-jira` does not change, and for the credential plumbing that is exactly
right — `JiraHttpConfig` already takes `baseUrl` / `email` / `apiToken` and an
injected transport, so only the composition root changes. It stops being right
for the *expiry message*: the 401 that names the recorded expiry date is emitted
inside `packages/adapter-jira/src/http.ts`, and no amount of CLI-side wrapping
puts a date into it without either a new exported error class or string-matching
our own prose. D4 takes the smallest of the three routes — one optional field —
and says why.

**Size note — over the range, and it does not split.** Measured at **830 lines**
against the ~750 guidance for a Category L caminho-B brief, so roughly 730 lines
of substance against a 350-650 range. The declaration is owed and this is it.

The question the range asks is whether these edits could ship as two independent
PRs, each closing on its own evidence. They could not. The delivery unit is one
credential path end to end: a reader module that nothing calls, an adapter field
that nothing supplies, a composition root that reads a file no operator has been
told to create, and two documentation surfaces that still instruct an operator to
export three variables the binary no longer reads. Any cut through that list
ships a half-wired CLI — the reader alone changes no behavior, the adapter field
alone is dead code, and the rewiring alone breaks `fetch` for anyone following
the README. The owner-run smoke is the evidence for all of it at once, and there
is only one of it.

Where the extra length actually sits, measured rather than estimated: eight
decision blocks (D1-D8, ~150 lines) carrying the reasoning for choices the note
left open, and nine Edit blocks whose verification lists are the brief's
substance rather than its padding.

Context inputs (read all before starting):

1. `docs/explorations/jira-credentials.md` — **mandatory**. §1 (the
   measurement), §2 (location versus credential kind), §3 (the three options),
   §5 (the mandatory expiry ceiling) and §6 (the ratified recommendation). Its
   authority is Context only: this brief, not the note, is what is obeyed
   (`docs/explorations/README.md` rule 2). Its credential-hygiene lines are the
   exception and are binding (rule 4).
2. `docs/explorations/local-storage-format.md` — the coupling. `JAC-1` owns the
   layout of `~/.jacurutu/` and is in `Wave: Next`; this task needs a path now.
   D1 takes that decision for one file and prices the migration.
3. `packages/cli/src/identity.ts` — the seam this brief copies: injected path, no
   env read, no path composition, fail-loud narrowing, and a missing-file error
   that shows the exact JSON to create by hand.
4. `packages/cli/src/report-state.ts` — the same seam for an app-written file,
   and the reason the two diverge on what absence means.
5. `packages/adapter-drive/src/credentials.ts` — the credential-hygiene
   precedent: errors name the file and the fix, never the contents.
6. `packages/cli/src/cli.ts:27-74`, `packages/cli/src/cli.test.ts:128-154` — the
   three `process.env` reads and the two brief-044 tests that assert on them.
7. `docs/tasks/044-missing-env-dx/brief.md` — a **historical** brief, preserved
   verbatim. It is read for its principle, never edited by this task.
8. `docs/GOTCHAS.md` — `G-JIRA-1`, `G-NODE-2`, `G-HOOK-1`.

**The card.** `JAC-28`, in `To Do` / `Wave: Now`, `Blocks` → `JAC-22`. Its body
could not be read in the authoring session — the Atlassian connector is
unauthorized in a non-interactive session — and that costs nothing here: by the
card contract in `docs/explorations/dev-queue-board.md`, where the card and the
brief disagree the brief wins, and the card's own done-criteria block is a
literal translation of this brief's Done criteria. Reconciling the card, and
setting its `Brief` field to this path, is the owner's or the Orchestrator's
action after merge, never the executor's. The link runs one way: the card points
at the brief, and git never points at the card.

P4 slug evidence (four sources, checked 2026-08-20, all clean for
`jira-credentials-file`):

- `ls docs/tasks/` — no match; no `2026-08-20-*` folder exists, so no ordinal
  suffix is owed.
- `git log --oneline main` — no match.
- `grep -rln 'jira-credentials-file' CLAUDE.md docs/` — no match.
- `git branch -a` plus `git worktree list` — four worktrees, three `claude/*`
  scaffolding branches plus `main`; `feat/jira-credentials-file` is unheld.

**Baseline: unmeasured in the authoring session, and declared as such.** This
worktree has no `node_modules`, so neither `npx tsc -b` nor `npm test` was run
against `5ee2a08`. The executor establishes the baseline after `npm install`
(constraint 8) and reports both totals at Pause 1; every Pause 3 repeats them.

## Goal

Make `jacurutu fetch` and `jacurutu start <KEY>` read their Jira credentials
from `~/.jacurutu/jira-credentials.json`, a hand-seeded file that also records
the token's expiry date, and make a rejected credential name that date — so the
CLI survives a closed terminal and the mandatory annual expiry arrives as an
actionable line instead of a mystery 401.

Out of scope:

- **OAuth 2.0 (3LO), in every form.** No callback port, no `cloudId`, no
  `api.atlassian.com/ex/jira` base URL, no refresh-token handling, no scope list.
  That is `JAC-31`, and `JAC-29` and `JAC-30` sit in front of it.
- **The rotating-token write defect** at
  `packages/adapter-drive/src/auth.ts:149-160`. Dormant today, real, and carded
  as `JAC-29`. Do not fix it here.
- **The layout of `~/.jacurutu/`.** Subdirectories, a `cred-` prefix, a
  `JACURUTU_HOME` root override, and where the future Jira mirror lands are all
  `JAC-1`'s. This brief places one file and prices its move (D1).
- **A scoped API token (option B).** File-compatible with what ships here — same
  file, same fields — and needing no decision now.
- **Any expiry gate or expiry warning** (D5).
- **Writing the credentials file.** The reader never creates, repairs, migrates
  or re-modes it (D7).
- **`packages/core/`, `packages/adapter-drive/`, `packages/adapter-sheets/`.**
  No port change: `JiraGateway.verifyCredentials()` keeps its `core` signature.
- **`jacurutu export`, `jacurutu report`, `jacurutu start --local`.** These read
  no Jira credential today and read none after this task; the existing offline
  proof in `cli.test.ts` must keep passing unchanged.
- **Historical task artifacts.** `docs/tasks/044-missing-env-dx/`,
  `docs/tasks/2026-08-12-spike-art-chain/run-instructions.md` and every other
  merged brief or recap naming the retired variables stay verbatim. They record
  what was true then. `docs/MENTOR_BRIEF.md` §2's dated "shipped 2026-06-19"
  bullet is the same class of record and is not edited either.

## Constraints

### Non-negotiable constraints

1. Only these paths may be created or modified:
   `docs/tasks/2026-08-20-jira-credentials-file/`, `packages/cli/src/`,
   `packages/adapter-jira/src/http.ts`, `packages/adapter-jira/src/http.test.ts`,
   `packages/adapter-jira/src/gateway.ts`, `.gitignore`, `README.md`,
   `CLAUDE.md`, `docs/explorations/jira-credentials.md`,
   `docs/explorations/local-storage-format.md`. If anything else needs changing,
   **STOP and ask**.
2. **Credential hygiene (binding — `docs/explorations/drive-oauth.md` §10 and
   `docs/explorations/README.md` rule 4).** No credential value — token, email,
   site host — enters the repository, a log line, an error message, a test
   fixture or a committed evidence paste. Errors name the **file** and the
   **field**, never the contents. Every placeholder written into source or docs
   uses the `<...>` or `your-` form, which is what
   `.claude/hooks/lib/architecture.mjs` `PLACEHOLDER` recognises; a literal
   `ATATT` string trips the secret scan and is a STOP, not a retry.
3. **No network in tests.** No test under `packages/cli/` or
   `packages/adapter-jira/` may perform a network call, read `~`, or require a
   real credential. Every unit test injects a path into a temp directory; every
   end-to-end test spawns the compiled CLI with `JACURUTU_*` scrubbed and the
   path override pointed at a sandbox.
4. **Execution model for anything live (D8).** The executor authors and
   interprets; the **owner** seeds the real credentials file, runs the smoke and
   pastes the output back, redacted. The executor never reads the owner's
   `~/.jacurutu/`, never types a token, and never runs a command that reaches
   Atlassian.
5. **The reader fails loud and never repairs.** Absence, malformed JSON, a
   missing field, a wrong type and a malformed date each throw naming the
   absolute path and what is wrong. There is no default, no fallback and no
   partial credential — unlike `report.json`, whose absence is a legitimate first
   run, an absent credentials file means the CLI cannot proceed.
6. Follow `CLAUDE.md`, especially R1 (`os.homedir()` + `path.join`, no hardcoded
   root), R4 (no silent catch), R5/R6 (size budgets — `cli.ts` is at 221 lines
   and must stay under 400), R7 (named constants), R9 (English on every
   agent-consumed surface; `README.md` is pt-BR under `E7` and stays pt-BR),
   R20/R24 (strict TS, no `any`), R21 (ESM, `.js` import extensions), R23
   (`node:test`, colocated `*.test.ts`), R25 (`cli` is the composition root and
   the only package importing an adapter).
7. Follow `docs/GIT_WORKFLOW.md` fully: branch `feat/jira-credentials-file`,
   created with `git switch -c feat/jira-credentials-file` from the session HEAD
   **before Edit 1** — never commit on the `claude/*` scaffolding branch;
   Conventional Commits (G-R3); subjects measured with
   `printf '%s' "<subject>" | wc -c`, never counted by eye; no `Co-authored-by`
   (G-A7); commit freely, **DO NOT push** (G-R5, R17).
8. **Worktree guard (`G-NODE-2`) and hook liveness (`G-HOOK-1`).** Before Edit 1,
   run `npm install` at the worktree root — any tracked change,
   `package-lock.json` included, is a STOP, because this task adds no dependency
   (R2) — then probe the guards with an unstaged `git commit -m "bogus: probe"`,
   which a live `commit-guard` denies. Report both results at Pause 1 together
   with the baseline `npx tsc -b` and `npm test` totals.
9. **`git commit -F <file>` is not covered by the guard.** `commit-guard` reads
   the message only from `-m` / `--message` and heredoc forms; with `-F` it
   returns `null` and allows the commit without running R10's three checks. Use
   `-m`. If a body forces `-F`, run `decideCommitMessage` from
   `.claude/hooks/lib/commit-message.mjs` over the real message and paste the
   verdict into that Pause 3.

### Conventions

- English on every agent-consumed surface (R9). The one pt-BR surface this task
  touches is `README.md`, which is pt-BR by `E7` and whose replacement text is
  given verbatim in Edit 6.
- Commit scopes: `cli` for the composition root and the reader,
  `adapter-jira` for the expiry field, `tasks` for the task folder,
  `explorations` for the note; `.gitignore` is unscoped `chore:` and the
  README / `CLAUDE.md` pass is unscoped `docs:`.
- Tests colocate as `*.test.ts` (R23), following `identity.test.ts` and
  `report-state.test.ts`.
- Error messages name the operation and the target, then an actionable fix (R4).

### Architectural decisions already made (do not revisit)

#### D1 — The file is `~/.jacurutu/jira-credentials.json`, flat, and `JAC-1` may move it

Flat beside `identity.json`, `report.json`, `oauth_client.json` and `token.json`,
because that is the layout that exists and `JAC-1` owns changing it.

The name is **not** `jira.json`, and that is the whole of the naming decision.
`JAC-1` also carries the Jira *mirror* — the regenerable local copy of fetched
issues, the one category in `~/.jacurutu/` that still has no file — and
`jira.json` is the name that mirror will want. Naming the credential file after
its category instead of its provider keeps the two from colliding and survives
either layout `JAC-1` picks: under subdirectories it becomes
`credentials/jira.json`, under a naming convention it becomes `cred-jira.json`.

**Migration cost, priced now rather than discovered later:** one file, one
rename or move, and one constant. The filename lives in a single exported
constant in one module, and exactly one function composes the path. `JAC-1`
moving it is a two-line change plus whatever migration it decides to give the
four other files.

#### D2 — The file is the only source of the credential values; the three env vars are retired

`JACURUTU_JIRA_BASE_URL`, `JACURUTU_JIRA_EMAIL` and `JACURUTU_JIRA_API_TOKEN` are
**removed** from `cli.ts`. There is no precedence rule, because there is only one
source. Two sources with a precedence rule would put the CLI back into exactly
the failure brief 044 was written about — an operator looking at a value that is
not the one being used — and would make every credential error ambiguous about
which source it is complaining about.

Retiring them costs nothing measured: §1 of the note found **0 of 3** set in any
scope on the only machine that has ever run this CLI. What it could cost is a
silent regression on some machine that did export them, and that is closed by a
migration line rather than by a fallback: **when the credentials file is missing
and any retired variable is set, the error names the ones that are set and says
they are no longer read.** Names only, never values, and only the ones present —
brief 044's principle, preserved after its literal message is gone.

`docs/tasks/044-missing-env-dx/` is a historical brief and is not edited. Its
per-variable discrimination does not vanish; it moves inward, to per-field
narrowing inside the file.

#### D3 — The record is `baseUrl`, `email`, `apiToken`, `expiresAt`, all four required

`expiresAt` is an ISO `YYYY-MM-DD` calendar date, the form Atlassian shows the
operator on the token screen, and it is **required**.

Required, not optional, because it is the only reason this file beats the
environment on anything except survival. Since December 2024 every Atlassian API
token carries a mandatory expiry of at most 365 days with no never-expires
option (note §5), so a token that has no date does not exist; an optional field
would simply be omitted, and the one capability this card was carded for would
evaporate on the first hand-seeded file.

Validation is shape only — four digits, a hyphen, two digits, a hyphen, two
digits, parsing to a real calendar date. **A date in the past is valid input.**
Blocking it would make the one state the operator most needs to diagnose the one
state the CLI refuses to enter.

#### D4 — The recorded expiry reaches the 401 through one optional adapter field

`JiraHttpConfig` gains `credentialExpiry?: string`, threaded from
`JiraGatewayConfig` (which already extends it) into `JiraHttpClient`. When set,
the credential-rejection message appends one sentence naming it. When absent,
the message is byte-identical to today's — so every existing `http.test.ts`
assertion holds and the adapter stays constructible without the field.

The adapter **never parses, compares or formats** the value: it receives a string
and concatenates it. No clock enters `adapter-jira`, and no file path does
either. The composition root owns the file and passes only what it read.

Two rejected alternatives, recorded so they are not re-proposed. Exporting a
`JiraCredentialRejectedError` for the CLI to catch and re-wrap is a larger
adapter change than the one it avoids, and a re-wrap that drops `cause` is the
`G-DRIVE-3` shape of mistake. Matching the message text in the CLI is
string-keying on prose, which is the habit `G-JIRA-1` exists to break — our own
prose is in English rather than the operator's locale, so it is less dangerous
than Jira's, but the habit is the problem.

The file path is deliberately absent from the 401. There is exactly one
credentials file, every file-shaped failure already names its absolute path, and
a second path in a message the operator reads once a year buys nothing.

#### D5 — There is no expiry gate and no expiry warning

The CLI does not refuse to run because the recorded date has passed, and prints
no warning as it approaches. Both were considered and both are wrong here.

A gate would refuse a run that Atlassian would have accepted: an operator who
rotated the token and did not update the file has a working credential and a
stale date, and the file is hand-maintained precisely because nothing keeps it in
sync. A warning needs a threshold constant (R7) that nobody has ruled on, and a
display decision in `display.ts` that this brief does not open. The recorded date
appears where it is decisive — in the message you get when the credential is
actually rejected.

Whether a warning arrives later is a follow-up, reported at the end of the run,
not folded in.

#### D6 — `JACURUTU_JIRA_CREDENTIALS_FILE` overrides the path, never the values

Exactly the `JACURUTU_IDENTITY_FILE` precedent (brief 036, P1): a non-empty value
is resolved with `path.resolve` and wins; otherwise the per-user default is
composed from `os.homedir()` and the module's constants (R1). It carries a path
and never a credential — a credential in an environment variable is what this
task is removing.

It exists because `cli.test.ts` spawns the compiled binary, and without a path
override the end-to-end tests would have to reach into the developer's real
`~/.jacurutu/`. Constraint 3 forbids that.

**Declared cost, not discovered later:** this is the third per-file path override
against five files, and `docs/explorations/local-storage-format.md` §4 already
names four-files-four-overrides as the wrong end state and proposes one
`JACURUTU_HOME` root instead. That consolidation is `JAC-1`'s, and adopting it
here would change how `identity.json` and `report.json` resolve — scope this task
does not own. Edit 9 records the arrival in that note rather than leaving it to
be re-measured.

#### D7 — The reader reads; it never writes, and it binds no file mode

No `writeFile`, no `mkdir`, no `chmod`. `identity.json` is hand-seeded and so is
this file, which means the application has no creation moment — and creation is
the only moment a mode can be bound at all
(`packages/adapter-drive/src/credentials.ts`, `CREDENTIALS_DIR_MODE` /
`TOKEN_FILE_MODE`, both documented as create-time-only).

So the `0600` protection `token.json` gets is **structurally unavailable** to a
hand-seeded file, and this brief does not fake it by checking a mode after the
fact and warning: that would be inert on win32, the platform this ships to first,
and would report a security property the product does not provide. Recorded as a
known gap for `JAC-1`, which owns whether `~/.jacurutu/` gains a `0700`
credentials directory that makes the per-file mode moot.

#### D8 — Evidence model: offline tests, plus one owner-run live smoke

Unit and end-to-end tests prove every decision offline and are the executor's
whole surface. They cannot prove the thing the card is about: that
`jacurutu fetch` runs again on the owner's machine against real Atlassian.

That proof is one owner-run smoke — seed the file, run `jacurutu fetch`, paste
the result line back redacted — and its absence is what `JAC-28 blocks JAC-22`
records. The fetched payload never enters the repository (`/payload.json` is
already gitignored); the pasted evidence carries no site host, no email, no
token and no issue key.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The owner pre-saved this brief to
`docs/tasks/2026-08-20-jira-credentials-file/brief.md` before invoking the
executor (caminho B). The executor verifies presence and commits.

- [ ] Branch `feat/jira-credentials-file` created from the session HEAD, and
      `git branch --show-current` confirms it is not a `claude/*` branch
- [ ] Directory `docs/tasks/2026-08-20-jira-credentials-file/` exists
- [ ] File `brief.md` exists; its first line matches the title above
- [ ] `git add docs/tasks/2026-08-20-jira-credentials-file/brief.md` is staged
- [ ] Commit #1 subject is exactly
      `docs(tasks): add brief for 2026-08-20-jira-credentials-file`

If the file is missing or the first line does not match, **STOP and report**. Do
not regenerate the brief from memory.

### Edit 2 — Add the credentials file to `.gitignore`

Add one entry beside the existing `oauth_client.json` and `token.json` lines,
with a one-line comment saying what it holds. Bare filename, matching the shape
of its two neighbours so it matches wherever it appears.

Verification:

- [ ] `grep -n 'jira-credentials.json' .gitignore` returns exactly one line
- [ ] The entry sits adjacent to `oauth_client.json` / `token.json`
- [ ] `git check-ignore -v jira-credentials.json` reports the new rule
- [ ] No other `.gitignore` line changed (the diff is two added lines)

Commit: `chore: add the Jira credentials file to gitignore`

### Edit 3 — Add the credentials reader module and its tests

Create `packages/cli/src/jira-credentials.ts`, modelled line-for-line on the
`identity.ts` seam: the path is always injected, the module reads **no** env and
composes **no** default path, and every narrowing failure throws naming the
absolute path and the offending field (R4).

Surface:

- `export const JIRA_CREDENTIALS_FILENAME = "jira-credentials.json"` — the single
  constant D1 prices the migration against.
- `export const RETIRED_JIRA_ENV_VARS: readonly string[]` — the three retired
  names, used only to build the migration hint.
- `export interface JiraCredentials` with `baseUrl`, `email`, `apiToken` and
  `expiresAt`, every one a `string`.
- `export function parseJiraCredentials(raw: string, filePath: string): JiraCredentials`
  — pure; the caller supplies the bytes and the path used in messages
  (`parseOAuthClient`'s shape).
- `export async function readJiraCredentials(filePath: string, env: NodeJS.ProcessEnv): Promise<JiraCredentials>`
  — the env bag is a **parameter**, not a `process.env` read, and is consulted
  for one purpose only: naming retired variables in the missing-file message.

Messages, exact prose:

- Missing file: `No Jira credentials file at <path>. Create it with:` followed by
  the seed JSON below, then — only when at least one retired variable is set in
  the supplied env — a sentence naming those variables and stating they are no
  longer read and that the value belongs in the file above. Names only, and only
  the ones actually present.
- Malformed JSON: `Malformed JSON in Jira credentials file <path>: <cause>`
- Not an object: `Jira credentials file <path> must hold a JSON object.`
- Missing or non-string field:
  `Jira credentials file <path>: <field> must be a non-empty string.`
- Bad date: `Jira credentials file <path>: expiresAt must be a calendar date in
  YYYY-MM-DD form.`

Seed JSON, verbatim (every value is a placeholder the secret scan recognises —
constraint 2):

```json
{
  "baseUrl": "https://your-site.atlassian.net",
  "email": "you@example.com",
  "apiToken": "<your Atlassian API token>",
  "expiresAt": "2027-08-19"
}
```

Colocated `packages/cli/src/jira-credentials.test.ts` covering: a well-formed
file parses to all four fields; a missing file names the path and shows the seed;
a missing file **with retired variables set** names exactly those variables and
no others; a missing file with none set carries no migration sentence; malformed
JSON, a non-object document, each missing field, each wrong-typed field, an empty
string, a malformed `expiresAt` (`2027-8-9`, `19/08/2027`, `2027-13-01`) and a
**past** `expiresAt` that parses successfully (D3).

Verification:

- [ ] `grep -c 'process\.env' packages/cli/src/jira-credentials.ts` returns `0`
      — the module reads no environment (D6 keeps that decision in `cli.ts`)
- [ ] `grep -c 'homedir\|path\.join' packages/cli/src/jira-credentials.ts`
      returns `0` — the module composes no path
- [ ] `grep -cE 'writeFile|mkdir|chmod' packages/cli/src/jira-credentials.ts`
      returns `0` (D7)
- [ ] The file is under 400 lines (R5) and every function under 50 lines (R6)
- [ ] No `any` (R24); every relative import carries `.js` (R21)
- [ ] `npx tsc -b` exits 0 and `npm test` is green, both totals pasted
- [ ] No test in the new file touches the network, the home directory, or a real
      credential

Commit: `feat(cli): add the Jira credentials file reader`

### Edit 4 — Thread the recorded expiry into the credential-rejection message

Three touches, no more.

1. `packages/adapter-jira/src/http.ts` — add `credentialExpiry?: string` to
   `JiraHttpConfig` with a doc comment stating it is opaque to the adapter:
   supplied by the composition root, never parsed, never compared, never used
   for a decision. Store it on the client. In `verifyCredentials`, when the
   status is in `CREDENTIAL_REJECTED_STATUSES` and the field is set, append one
   sentence: `The credentials file records this token as expiring on <value>.`
2. `packages/adapter-jira/src/gateway.ts` — no code change is needed if
   `JiraGatewayConfig extends JiraHttpConfig` already passes the whole config to
   `new JiraHttpClient(config)`. **Verify this by reading it**; if a field-by-field
   copy is in the way, add the one passthrough and nothing else.
3. `packages/adapter-jira/src/http.test.ts` — two tests: with no
   `credentialExpiry`, the 401 message is unchanged from today's assertion; with
   one, the message carries the recorded date. The existing 401 / 403 / 500 /
   localized-body tests pass **unmodified** — if any needs changing, that is a
   deviation, and it is a STOP.

Verification:

- [ ] `git diff --stat packages/adapter-jira/` shows only `http.ts`,
      `http.test.ts` and at most `gateway.ts`
- [ ] `grep -n 'credentialExpiry' packages/adapter-jira/src/http.ts` shows the
      field, the assignment and the message concatenation — nothing else
- [ ] No date parsing and no comparison was added to `packages/adapter-jira/`
      (`grep -n 'new Date' packages/adapter-jira/src/http.ts` returns nothing)
- [ ] The four pre-existing `verifyCredentials` tests are byte-identical
      (`git diff` on `http.test.ts` shows additions only)
- [ ] No credential value appears in any assertion or fixture (constraint 2)
- [ ] `npx tsc -b` exits 0 and `npm test` is green, both totals pasted

Commit: `feat(adapter-jira): add the recorded token expiry to the 401 message`

### Edit 5 — Rewire the composition root and replace the env tests

`packages/cli/src/cli.ts`:

- Delete `ENV_BASE_URL`, `ENV_EMAIL`, `ENV_API_TOKEN` and the whole
  missing-env block inside `makeGatewayFactory`.
- Add `const ENV_JIRA_CREDENTIALS_FILE = "JACURUTU_JIRA_CREDENTIALS_FILE"` beside
  `ENV_IDENTITY_FILE`.
- Add `resolveJiraCredentialsPath()`, the fourth and last path composer in this
  file, mirroring `resolveIdentityFilePath()` exactly: a non-empty override wins
  via `path.resolve`; otherwise `path.join` over `os.homedir()`,
  `IDENTITY_DIR_NAME` and `JIRA_CREDENTIALS_FILENAME`.
- Make `makeGatewayFactory` `async`, reading the file through
  `readJiraCredentials(resolveJiraCredentialsPath(), process.env)` and passing
  `baseUrl`, `email`, `apiToken` and `credentialExpiry: expiresAt` into
  `new JiraGateway({...})`. Both call sites — `case "fetch"` and `case "start"` —
  become `await`; both are already inside an `async` function.
- Update the file-header comment, whose "read env credentials" clause stops being
  true, and the `start-local` comment at line 180, which cites `JACURUTU_JIRA_*`
  reads that will not exist.

`packages/cli/src/cli.test.ts`:

- `runCli` keeps the `JACURUTU_*` scrub and gains a credentials-path parameter,
  set on every spawn so no test can reach the developer's real home directory.
- **Replace** the two brief-044 tests. New coverage: a missing credentials file
  fails at `EXIT_RUNTIME` naming the absolute path; the same case with all three
  retired variables set in the spawn env still fails on the file and names those
  three as no longer read; a seeded sandbox file plus three retired variables
  holding different values proves the env is not a fallback — resolution passes
  the file stage and the run fails later, never with a missing-credential error.
- **Keep** the existing offline test, and extend its assertion: `start --local`
  still succeeds with the credentials-path override pointed at a path that does
  not exist.
- Update the header comment, which currently explains the scrub in terms of
  injecting selected `JACURUTU_JIRA_*` values.

Verification:

- [ ] No `JACURUTU_JIRA_BASE_URL`, `JACURUTU_JIRA_EMAIL` or
      `JACURUTU_JIRA_API_TOKEN` literal remains in `packages/cli/src/cli.ts`
- [ ] `grep -n 'JACURUTU_JIRA_CREDENTIALS_FILE' packages/cli/src/cli.ts` returns
      exactly one line (the constant)
- [ ] `packages/cli/src/cli.ts` is under 400 lines (R5), reported as a number
- [ ] `packages/cli/src/run-start.test.ts` passes **unmodified** — its
      `JACURUTU_JIRA_` scrub still proves the local path reads nothing
- [ ] `npx tsc -b` exits 0 and `npm test` is green, both totals pasted, and the
      packages total is compared against the Pause 1 baseline with the delta
      explained
- [ ] No test spawns the CLI without a credentials-path override

Commit: `feat(cli): wire the credentials file into the composition root`

### Edit 6 — Reconcile `README.md` and `CLAUDE.md`

`README.md` is pt-BR under `E7` and stays pt-BR. Its CLI environment section
currently claims the CLI reads all its configuration from the environment and
lists five variables, three of which this task deletes. Replace the section's
opening sentence, the three `JACURUTU_JIRA_*` table rows and the paragraph
beneath the table with:

```markdown
A CLI `jacurutu` (v2) lê as credenciais do Jira de um arquivo e o resto da sua
configuração do ambiente — nenhum segredo fica no repositório.

As credenciais do Jira ficam em `~/.jacurutu/jira-credentials.json`, criado à
mão, com quatro campos: `baseUrl`, `email`, `apiToken` e `expiresAt` (a data de
validade do token, no formato `AAAA-MM-DD`). Todo token de API da Atlassian
criado hoje expira em no máximo 365 dias; se o Jira recusar a credencial, a
mensagem de erro cita essa data. O arquivo guarda um segredo e nunca entra no
repositório.
```

The table keeps `JACURUTU_IDENTITY_FILE` and `JACURUTU_TELEMETRY_DIR` and gains
one row for `JACURUTU_JIRA_CREDENTIALS_FILE`, described as a path override with
the default `~/.jacurutu/jira-credentials.json`. The inventory sentence listing
what lives under `~/.jacurutu/` gains the credentials file. The 2026-08-19
rename note stays verbatim.

`CLAUDE.md`, Architecture, the `@jacurutu/cli` bullet: append one sentence naming
where the Jira credentials come from and that the three `JACURUTU_JIRA_*`
variables were retired on 2026-08-20 by this brief. Nothing else in `CLAUDE.md`
changes — no new rule, no new exception. `docs/ROADMAP.md` is **not** touched:
the note records this as a Phase 3 precondition rather than a roadmap item, and
the ROADMAP never named the variables.

Verification:

- [ ] No `JACURUTU_JIRA_BASE_URL`, `JACURUTU_JIRA_EMAIL` or
      `JACURUTU_JIRA_API_TOKEN` literal remains in `README.md`
- [ ] `grep -n 'jira-credentials.json' README.md CLAUDE.md` returns at least one
      line in each
- [ ] `README.md` is still pt-BR end to end — no English sentence was introduced
      (`E7`)
- [ ] `git diff --stat docs/` shows nothing at this commit
- [ ] The docs guard's `ENGLISH_ONLY` check passes on the staged diff

Commit: `docs: update the credential surface for the Jira file`

### Edit 7 — Author the live smoke run instructions

Create `docs/tasks/2026-08-20-jira-credentials-file/run-instructions.md`, for the
**owner**, following the shape of the run instructions in
`docs/tasks/2026-08-15-report-command/`: what to seed, what to run, what to paste
back, and what must be redacted before pasting.

It must state, in order: create `~/.jacurutu/jira-credentials.json` with the four
fields, reading `expiresAt` off the Atlassian token screen; unset the three
retired variables if any are still exported; run `jacurutu fetch` with a narrow
JQL and an `--out` path outside the repository; paste the result line and the
exit code. It must state explicitly that the site host, the account email, the
token and every issue key are replaced by placeholders before pasting, and that
the payload file is never added to git.

Verification:

- [ ] The file exists and names all four fields
- [ ] It names an `--out` path outside the repository
- [ ] It carries the redaction instruction as its own paragraph, not a footnote
- [ ] It contains no real host, email, token or issue key

Commit: `docs(tasks): add the smoke run instructions for the credentials file`

### Evidence round (process, between Edit 7 and Edit 8)

The executor stops and hands the run instructions to the owner. The owner seeds
the file, runs the command and pastes the redacted output back as a continuation
message. The executor runs nothing live and reads nothing under the home
directory.

If the owner declines the smoke or it cannot be run, that is **not** a failure of
this brief: Edit 8 records the absence and says so plainly, and the brief closes
with the offline evidence and a declared gap. It is never recorded as passed, and
never inferred from the tests.

### Edit 8 — Record the evidence

Create `docs/tasks/2026-08-20-jira-credentials-file/notes.md` carrying: the
owner's pasted output verbatim after redaction, the exit code, the date, and one
paragraph on what the smoke did **not** exercise — a rejected credential, an
expired token, and therefore the expiry sentence D4 adds, which no live run in
this task will have produced.

Verification:

- [ ] `notes.md` exists and carries the pasted block inside a fence
- [ ] It contains no host, email, token or issue key — a grep for `atlassian.net`
      and for `ATATT` returns only placeholder forms
- [ ] The unexercised-paths paragraph is present and names the expiry message
- [ ] If the smoke did not run, that is stated in the first line of the file

Commit: `docs(tasks): add the live smoke evidence for the credentials file`

### Edit 9 — Promote the exploration note and correct its coupled note

`docs/explorations/jira-credentials.md`: change the `Disposition:` line from
`candidate` to the promoted form carrying this brief's id and today's date, and
add one dated `## Changelog` entry recording the promotion and that option A
shipped as this brief. The body is **not** rewritten — the note is the historical
record of the thinking, and only the four cards it surfaced remain its live
content.

`docs/explorations/local-storage-format.md` §3: two measured claims stop being
true when this brief lands, and both are corrected in place with a dated
changelog line. The third credential file is no longer proposed — it exists, and
`A3`'s third use has arrived. The directory root is composed in **four** places,
not three, and the fourth is `resolveJiraCredentialsPath` in `cli.ts`. Its
disposition stays `open`: this brief moved the trigger, not the SQLite-or-JSON
question the note is about.

Verification:

- [ ] `grep -n '^Disposition:' docs/explorations/jira-credentials.md` shows the
      promoted form with this brief's id
- [ ] Both notes carry a new dated `## Changelog` entry
- [ ] `git diff docs/explorations/jira-credentials.md` touches the header and the
      changelog only — no body paragraph changed
- [ ] `local-storage-format.md` still reads `Disposition: open`
- [ ] Both files are English (R9) and neither gained a credential value

Commit: `docs(explorations): promote the Jira credentials note to a brief`

### Commit sequence

1. `docs(tasks): add brief for 2026-08-20-jira-credentials-file`
2. `chore: add the Jira credentials file to gitignore`
3. `feat(cli): add the Jira credentials file reader`
4. `feat(adapter-jira): add the recorded token expiry to the 401 message`
5. `feat(cli): wire the credentials file into the composition root`
6. `docs: update the credential surface for the Jira file`
7. `docs(tasks): add the smoke run instructions for the credentials file`
8. `docs(tasks): add the live smoke evidence for the credentials file`
9. `docs(explorations): promote the Jira credentials note to a brief`

Every subject is measured with `printf '%s' "<subject>" | wc -c` before its
Pause 3, and the measurement is pasted into that Pause. Every verb — `add`,
`update`, `promote` — is on the `VERB_ALLOWLIST` in
`.claude/hooks/lib/commit-message.mjs`.

### Automated checks (run before each commit)

- [ ] `npx tsc -b` exits 0
- [ ] `npm test` green, both suite totals pasted (packages and hooks)
- [ ] The packages total is compared against the Pause 1 baseline and any delta
      is explained by the tests this brief added or replaced

### Structural checks

- [ ] Expected files exist: `packages/cli/src/jira-credentials.ts` and its test,
      and `brief.md`, `run-instructions.md` and `notes.md` under
      `docs/tasks/2026-08-20-jira-credentials-file/`
- [ ] No file outside constraint 1's list was modified
      (`git diff --name-only origin/main..HEAD`)
- [ ] `git grep -n 'ATATT'` returns nothing outside a placeholder form
- [ ] No file under `packages/core/`, `packages/adapter-drive/` or
      `packages/adapter-sheets/` was touched

### Behavior checks

- [ ] A well-formed credentials file resolves all four fields
- [ ] A missing file fails at exit 1 naming the absolute path and showing the
      seed JSON
- [ ] A missing file with retired variables set names exactly the ones set
- [ ] A missing file with none set carries no migration sentence
- [ ] Malformed JSON, a non-object document, each missing or wrong-typed field,
      and a malformed `expiresAt` each throw naming the file and the field
- [ ] A past `expiresAt` parses successfully and does not block the run (D3, D5)
- [ ] A rejected credential with `credentialExpiry` set names the recorded date;
      without it, the message is unchanged from today
- [ ] With a valid file present and the three retired variables set to different
      values, the run does not fail on credential resolution (D2 — no fallback)
- [ ] `jacurutu start --local` succeeds with the credentials path pointed at a
      file that does not exist
- [ ] No credential value appears in stdout, stderr, a log line or a test fixture

### Git checks

- [ ] Branch used: `feat/jira-credentials-file`, created before Edit 1, never a
      `claude/*` branch
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines within 72 chars, each measured with `wc -c`
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on the branch at the end
- [ ] **NO** `git push` was executed
- [ ] No `STATE.md` was created — this task is one session

### Process checks

- [ ] `Plan required: yes` — a numbered plan was presented and approved before
      any change (Pause 1), carrying the `npm install`, hook-probe and baseline
      results required by constraint 8
- [ ] Pause 2 — the first modified file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + the proposed message shown
      before each of the nine commits
- [ ] Staged set confirmed to match the current Edit's scope before each Pause 3
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any change):** present a numbered plan and wait for
  approval. **Required** — see the justification below.
- **Pause 2 (after the first modified file):** show the result and wait for
  review. **Always required.**
- **Pause 3 (before each commit):** show `git status` + `git diff --stat` + the
  proposed message, plus the green-boundary results. **Always required.**

Under subagent transport a Pause is a STOP-and-return: stop, return the whole
Pause presentation as one fenced block, and resume only on a relayed explicit go.
A host tool-permission prompt is never a go, and silence is never approval.

In case of:

- Unrelated bug found — report and ask. Do not fix.
- Technical limitation preventing a done criterion — report.
- Undocumented gotcha discovered — report, and document it in `docs/GOTCHAS.md`
  as a follow-up brief rather than inside this one.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: yes`, for three reasons:

- The change spans two packages and nine commits, well past R15's threshold of
  two files or fifty lines.
- Edit 4 depends on a fact this brief asserts but did not execute: that
  `JiraGatewayConfig` passes its whole config into `new JiraHttpClient(config)`.
  The plan is where the executor reports what it actually found.
- Constraint 8's `npm install`, hook probe and green baseline all land at Pause 1,
  and a wrong answer to any of them changes what happens next.

**Pause 2 and Pause 3 remain required** regardless — Lesson #6 of
`docs/AGENT_PLAYBOOK.md`.

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — `G-JIRA-1`, `G-NODE-2`, `G-HOOK-1`
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
5. `.claude/skills/brief-template/SKILL.md` — the template reference
6. `.claude/hooks/` — the commit-time checks, and
   `.claude/hooks/lib/architecture.mjs` for the placeholder form the secret scan
   recognises
7. `docs/explorations/jira-credentials.md` and
   `docs/explorations/local-storage-format.md` — Context only; the brief is what
   is obeyed, and only the credential-hygiene lines bind
8. `packages/cli/src/identity.ts`, `packages/cli/src/report-state.ts`,
   `packages/adapter-drive/src/credentials.ts` — the three seams this copies

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Any verification checkbox that could not be met, with the reason — including,
   explicitly, whether the live smoke ran
4. Confirmation that no `git push` was executed
5. Follow-ups surfaced and deliberately not folded in: the expiry warning D5
   defers, and the `JACURUTU_HOME` consolidation D6 hands to `JAC-1`
