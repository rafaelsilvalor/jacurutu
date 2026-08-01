# Brief: 047 — Build the `@saci/adapter-drive` package

> **Category:** L
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `feat/adapter-drive`

---

## Context

Task 046 was a directed research spike that closed ROADMAP pending decision
#11: `adapter-drive` uses `googleapis` + `google-auth-library` with a user
OAuth Desktop loopback flow under the scope pair `drive.file` +
`drive.metadata.readonly`. Four Drive operations were proven live on the
owner's machine under exactly that combination.

This brief builds the adapter. It is the **first of a two-brief decomposition**
the owner approved: 047 delivers the `DriveGateway` implementation — the only
piece carrying external risk — and a later brief delivers the `ship` command
that orchestrates it. Every technical choice named above is **closed and
evidenced**: do not re-open, re-research, benchmark, or offer alternatives.

**Size note.** Substance sits above the Category-L range in
`.claude/skills/brief-template/SKILL.md` (~600 lines against the 200-400
guide) because the delivery unit is a whole package: a port revision, six
source modules with their tests, two hygiene edits, and an owner-run evidence
round. A further split was considered and rejected — the owner already
decomposed this work into 047 (adapter) plus a later `ship` brief, and the
live smoke can only run once the whole adapter exists, so no sub-brief could
close on its own evidence. L is the honest header; the deviation is declared
here rather than hidden by thinning the specification.

Context inputs (read all before starting):

1. `docs/tasks/046-spike-adapter-drive/` — **mandatory**: `notes.md` (library,
   scope pair, proven versions, the Internal consent-mode conversion, the
   cross-user gap recorded as untested), `drive-probe.mjs` (proven call
   shapes), `run-instructions.md` (the owner-run evidence procedure reused
   here).
2. `docs/explorations/drive-oauth.md` — exploration note, **background only**:
   per `docs/explorations/README.md` it carries no implementation mandate and
   sits below briefs in the authority hierarchy. Exception: its
   credential-hygiene rules (§10) are binding. Its §5 walkthrough is the
   historical Testing-era path — see D6.
3. `packages/adapter-jira/` (shape reference) and
   `packages/core/src/gateways.ts` (the port being revised).
4. `docs/sessions/2026-07-27-mentor-ship-semantics.md` — the closed ship
   semantics the five primitives serve.

P4 slot evidence (three sources, checked 2026-08-01):

- `ls docs/tasks/` — highest existing slot `046-spike-adapter-drive`; gaps
  004-006 (burned, `CLAUDE.md` E5) and 034 are preserved, not free.
- `git log --oneline main | head -3` — HEAD is `d8426ce docs: add drive spike
  046 decision note and resolve ROADMAP #11 (#107)`; no merged PR references a
  slot above 046.
- `grep -nE '^\*\*E[0-9]+' CLAUDE.md` — E1, E2, E3, E5 are v1-freeze
  exceptions; none reserves a forward slot.

## Goal

Revise the `DriveGateway` port in `@saci/core` to five Drive primitives, and
create `@saci/adapter-drive` implementing it against Google Drive — unit
tested on everything pure, evidenced end-to-end by an owner-run live smoke
over all five primitives.

Out of scope:

- The `ship` command and every policy that belongs to it: verify-never-create
  (which segments are verified vs. created), the optimistic history-prefix
  check, incremental upload, lean mode, retry/backoff policy. Do not
  implement, stub, or pre-shape them.
- Any change under `packages/cli/**` (no wiring, no subcommand),
  `packages/adapter-jira/**`, `packages/adapter-sheets/**`.
- `saci config`, the identity file, and `run-start.ts`. Ground truth, already
  verified — do not re-verify, do not touch: the local manifest is written as
  `.saci.json` in the task's leaf folder (`MANIFEST_FILENAME` in
  `packages/cli/src/run-start.ts`).
- Manifest validation: `parseManifest` stays a caller concern (D2).
- Retroactive edits to historical briefs. Merged brief 045 typed
  `readManifest` against `TaskManifest`; this task retires that method. 045
  stays verbatim — the supersession is recorded in this task's `notes.md`.
- **Documentation reconciliation is deferred.** A fourth package makes the
  `CLAUDE.md` Architecture package list and the `docs/ROADMAP.md` "Workflow
  actions" row one bullet stale. Surfacing both at Pause 2 as bundling
  candidates for the owner to decide is allowed; editing either file without
  that explicit approval is out of scope.

## Constraints

### Non-negotiable constraints

1. Only these paths may be created or modified: `docs/tasks/047-adapter-drive/**`,
   `packages/core/src/gateways.ts`, `packages/core/src/index.ts`,
   `packages/adapter-drive/**` (new), root `tsconfig.json`,
   `package-lock.json` (Edit 3 only), `.gitignore`, `docs/GOTCHAS.md`. If
   anything else needs changing, **STOP and ask**.
2. **Credential hygiene (binding — `docs/explorations/drive-oauth.md` §10).**
   `oauth_client.json` and `token.json` never enter the repo, never appear in
   chat, never get logged. No log line, message, comment, doc, or fixture may
   contain a client secret, access token, or refresh token. If a pasted
   evidence block contains secret material, **STOP**: do not echo it back,
   tell the owner to rotate/revoke, continue only after confirmation.
3. **No network in tests.** No test in `packages/adapter-drive/` may perform a
   network call or require credentials. Filesystem temp-dir tests are allowed.
   The `DriveFilesApi` seam (D4) exists so the gateway is testable without
   either.
4. **Execution model for anything live (D3).** The sandbox cannot reach Google
   and OAuth needs a real browser consent: the executor authors and
   interprets, the **owner runs the smoke on their Windows machine and pastes
   the output back**. The executor **never** claims a live operation passed
   without pasted owner output.
5. **The cross-user gap stays untested and unclaimed (spike D7).** Reading
   file *content* written by another designer's account under the same OAuth
   client id was never tested; the hypothesis is that it fails under the
   chosen scope pair. No code path, comment, doc, or note produced here may
   assert that it works — or that it fails. The recorded fallback (broad
   `drive` scope with adapter-level containment) is carried as a watch item,
   **not implemented**.
6. Follow `CLAUDE.md`, especially R1 (`os.homedir()` + `path.join`, no
   hardcoded root), R2 (dependency justification — D8), R4 (no silent catch),
   R5/R6 (size budgets), R7 (named constants for scopes, filenames, field
   masks, MIME types), R9 (English-only), R20/R24 (strict TS, no `any`), R21
   (ESM, `.js` import extensions), R22 (`tsc -p .`, no bundler), R23
   (`node:test`, colocated `*.test.ts`), R25 (`core` never imports an adapter).
7. Follow `docs/GIT_WORKFLOW.md` fully: branch `feat/adapter-drive`, created
   via `git switch -c feat/adapter-drive` from the session HEAD **before Edit
   1** (the `claude/*` worktree branch must never carry these commits — R11 /
   G-R2 / validator C4; if HEAD is already `feat/adapter-drive`, confirm and
   continue); Conventional Commits (G-R3), subjects ≤ 72 chars; no
   `Co-authored-by` (G-A7); commit freely, **DO NOT push** (G-R5, R17) — push
   and PR happen later on explicit owner instruction.
8. **Worktree build guard (G-NODE-2, with a carve-out).** Run `npm install` at
   the worktree root so `@saci/*` resolves against this worktree. The gotcha's
   standard "STOP on any tracked-file change, especially `package-lock.json`"
   guard is **carved out for Edit 3 only** — the two new dependencies are
   intended lockfile drift. It still bites elsewhere: tracked changes outside
   `package.json` / `package-lock.json`, or lockfile changes touching a
   package other than `googleapis` / `google-auth-library` and their
   transitives, mean **STOP and report**.
9. **Registry-reachability contingency.** If `npm install` cannot reach the
   npm registry from the executor's environment, **STOP and report** — do not
   vendor, stub the libraries, or skip the build. The owner then runs
   `npm install`, `npm run build`, and `npm test` locally and pastes the
   output; the executor continues on that evidence under the D3 model.

### Conventions

- All source, comments, docs, and commit messages in English (R9).
- Commit scopes: `core` for the port, `adapter-drive` for package files,
  `tasks` for `docs/tasks/047-adapter-drive/**`, `gotcha` for
  `docs/GOTCHAS.md`; the `.gitignore` commit is unscoped `chore:`.
- Tests colocate as `*.test.ts` (R23), following
  `packages/adapter-jira/src/*.test.ts`.
- Error messages name the operation and the target (R4) and end with an
  actionable hint. Style precedent: task 044 (`Missing required env: ...`) and
  `packages/cli/src/identity.ts` (`No identity file at <path>. Seed it ...`).

### Architectural decisions already made (do not revisit)

#### D1 — Port surface: five primitives

`DriveGateway` is replaced by five one-Drive-call primitives plus a
`DriveItem` type; exact text in Edit 2. `uploadFolder` and `readManifest`
come off the port — folder-tree orchestration and manifest validation belong
to the `ship` layer. The `TODO(2026-06-06)` deferring the upload contract is
retired: it resolved when the Phase 3 ship semantics closed (mentor session
2026-07-27). `findChild` returns `null` for absence — absence is an expected
answer, not a failure, and it is the read the later verify-never-create policy
is built on; ambiguity throws (R4). The revision lives in `core`; `core` still
imports nothing from any adapter (R25).

#### D2 — `readFileContent` returns raw UTF-8 text

No parsing, no `parseManifest`, no JSON handling in the adapter — the `ship`
layer parses and validates. This is what retires `readManifest` and its 045
`TaskManifest` return contract.

#### D3 — Evidence model: unit tests + owner-run live smoke (046 D2 shape)

Proven across three rounds in task 046. The executor authors the smoke script
and run instructions; the owner runs them on Windows and pastes output; the
executor interprets and records evidence in `notes.md`. The executor never
runs the OAuth flow or any Drive call. Pastes follow the 037 evidence-close
discipline (final-message rule, single-block packaging, no-debt precondition).

#### D4 — Injected `DriveFilesApi` seam

The gateway takes a narrow, adapter-owned `DriveFilesApi` interface at
construction (mirroring `adapter-jira`'s injected `FetchLike`); the
`googleapis`-backed implementation lives in one thin wrapper module and tests
inject a fake. Consequence: everything decision-bearing is unit tested and
exactly two modules (the googleapis wrapper, the OAuth flow) are covered by
the smoke instead. That split is intended, not a gap to close.

#### D5 — Credentials live in `~/.saci/`

`oauth_client.json` and `token.json` sit alongside the task-036 identity file.
Paths compose via `os.homedir()` + `path.join` (R1); dir leaf and filenames
are named constants (R7). Every path-taking function accepts the home
directory explicitly so it is unit-testable; one default resolver calls
`os.homedir()` (the `identity.ts` seam shape). Missing-credential failures are
loud and actionable: they name the absent file, its expected absolute path,
and the fix.

#### D6 — Consent screen: Internal user type

The OAuth client uses user type **Internal**; the probe project was converted
during the spike, removing both the 7-day refresh-token cap and the
unverified-app interstitial. Every setup instruction this task produces says
Internal. The External + Testing walkthrough in
`docs/explorations/drive-oauth.md` §5 **must not** be reproduced as current
guidance.

#### D7 — Exact dependency versions

`googleapis@173.0.0` and `google-auth-library@10.9.1` — the spike-proven
versions — pinned exactly (no caret). The evidence is version-specific; a
range would let the adapter drift from what was proven.

#### D8 — R2 justification is transcribed, not re-derived

The reasoning exists in `docs/tasks/046-spike-adapter-drive/notes.md` question
2: hand-rolling OAuth refresh rotation and resumable media upload is the cost
avoided, and `google-auth-library` is already transitive under `googleapis`,
so the pair adds one effective dependency root. The executor transcribes a
ready-to-paste R2 paragraph into `notes.md` for the future PR description (no
PR is opened in this run).

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The brief is pre-saved before the executor is invoked (caminho B); the
executor verifies presence and commits.

- [ ] Working branch is `feat/adapter-drive` (constraint 7)
- [ ] `docs/tasks/047-adapter-drive/brief.md` exists; its first line is
      byte-identical to this brief's title heading (`# Brief: 047 — ...`)
- [ ] `git add docs/tasks/047-adapter-drive/brief.md` staged
- [ ] Commit #1 subject: `docs(tasks): add brief for 047-adapter-drive`

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

### Edit 2 — Revise the `DriveGateway` port in `@saci/core`

**2a.** In `packages/core/src/gateways.ts`, replace the whole block from the
`/**` opening the `Port for the Drive-backed asset store.` comment through the
closing `}` of `export interface DriveGateway` (currently lines 40-59) with:

```ts
/**
 * A Drive item as the port surfaces it: identity and kind only. `mimeType` is an
 * opaque passthrough — core never interprets Drive wire values.
 */
export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
}

/**
 * Port for the Drive-backed asset store. No Python precursor — the seed does not
 * touch Drive. Five primitives, one Drive call each: composition (folder-tree
 * walking, the verify-never-create policy, manifest validation) belongs to the
 * ship layer. Grounded in the operations proven live in the 046 spike.
 */
export interface DriveGateway {
  /** Resolve a folder by id. Fail-loud (R4): a missing id, or a non-folder, throws. */
  resolveFolder(folderId: string): Promise<DriveItem>;

  /**
   * Find the direct child named `name` under `parentId`. `null` means absent —
   * an expected answer, not a failure. More than one match throws (R4).
   */
  findChild(parentId: string, name: string): Promise<DriveItem | null>;

  /** Create a folder named `name` under `parentId`; returns the created folder. */
  createFolder(parentId: string, name: string): Promise<DriveItem>;

  /** Upload a local file into `parentId`. Always creates; replace is a ship concern. */
  uploadFile(parentId: string, name: string, localFilePath: string): Promise<DriveItem>;

  /** Read a file's content as UTF-8 text. Parsing/validation is the caller's job (D2). */
  readFileContent(fileId: string): Promise<string>;
}
```

Also remove the now-unused `import type { TaskManifest } from "./workspace.js";`.
If `TaskManifest` has another use in the file, **STOP and report**.

**2b.** Add `DriveItem` to the existing
`export type { ... } from "./gateways.js";` block in
`packages/core/src/index.ts`, keeping the block's ordering style.

Verification:

- [ ] `grep -n "uploadFolder\|readManifest\|TODO(2026-06-06)\|TaskManifest" packages/core/src/gateways.ts`
      returns nothing
- [ ] Each of the five primitive names appears exactly once in `gateways.ts`
- [ ] `grep -n "DriveItem" packages/core/src/index.ts` returns one match
- [ ] `grep -rn 'from.*adapter' packages/core/src/` returns nothing (R25)
- [ ] `npm run build` and `npm test` pass — the port had zero implementors, so
      nothing should break; if something does, **STOP and report**

Commit: `refactor(core): declare DriveGateway as five drive primitives`

### Edit 3 — Scaffold `@saci/adapter-drive` and install dependencies

Mirror `packages/adapter-jira/`:

- `packages/adapter-drive/package.json` — `@saci/adapter-drive`, `0.0.0`,
  `private`, `"type": "module"`, `main`/`types` at `./dist/index.js` /
  `./dist/index.d.ts`, `"build": "tsc -p ."`; dependencies `@saci/core: "*"`,
  `googleapis: "173.0.0"`, `google-auth-library: "10.9.1"` (exact — D7).
- `packages/adapter-drive/tsconfig.json` — byte-identical to
  `packages/adapter-jira/tsconfig.json`.
- `packages/adapter-drive/src/index.ts` — placeholder export allowed in this
  commit only so the project compiles; the real surface lands in Edit 5.
- Root `tsconfig.json` — add `{ "path": "./packages/adapter-drive" }` to
  `references`, after the `adapter-sheets` entry.
- Run `npm install` at the worktree root (constraint 8 carve-out; constraint 9
  contingency).

Verification:

- [ ] `npm ls googleapis google-auth-library` reports `173.0.0` / `10.9.1`
- [ ] `git status --short` shows only `package.json`, `package-lock.json`,
      `tsconfig.json`, and new `packages/adapter-drive/**` files
- [ ] `npm run build` passes (new project in the `tsc -b` graph); `npm test`
      passes
- [ ] No `node_modules` or `dist` path staged

Commit: `feat(adapter-drive): add package scaffold and dependencies`

### Edit 4 — Add the pure modules and their tests

Four modules under `packages/adapter-drive/src/`. Named constants for every
policy value (R7); no `any` (R24); English-only (R9).

**`constants.ts`** (declarations only, no test): `DRIVE_SCOPES` (the closed
pair, 046 order), `CREDENTIALS_DIR_NAME` (`".saci"`), `OAUTH_CLIENT_FILENAME`,
`TOKEN_FILENAME`, `FOLDER_MIME_TYPE`, `DEFAULT_UPLOAD_MIME_TYPE`,
`ITEM_FIELDS`, `CHILD_LIST_FIELDS`, `CHILD_PAGE_SIZE` (2 — one match plus one,
enough to detect ambiguity), `LOOPBACK_CALLBACK_PATH`.

**`credentials.ts` + test** (D5): `oauthClientPath(homeDir)`,
`tokenPath(homeDir)`, `defaultCredentialPaths()` (the only `os.homedir()`
caller); `parseOAuthClient(raw, filePath)` — pure, accepts the Desktop-app
`installed` section, fail-loud on malformed JSON or missing section/fields,
naming `filePath`, rejecting a `web`-only client with a Desktop-app pointer;
`readOAuthClient(filePath)` — thin I/O wrapper whose `ENOENT` produces the
loud actionable message naming the absolute path; token read/write helpers
with the same discipline. Tests: happy parse; malformed JSON; missing
`installed`; `web`-only; missing `client_id`/`client_secret`; path composition
against an injected home dir (asserted via `path.join`, never a literal
separator — R1). Fixtures use obvious placeholders (`"test-client-id"`), never
real secret-shaped values.

**`errors.ts` + test** (R4): `driveErrorMessage(operation, target, error)` and
a `toDriveError(...)` returning an `Error` that preserves `cause`. The message
names operation and target, then status, then an actionable hint from a named
mapping table — 401: token invalid/expired, delete `~/.saci/token.json` and
re-authorize; 403: permission or granted-scope problem, naming the two
requested scopes; 404: not found **or not visible under `drive.file`**, which
only exposes items this app created (state the scope caveat and nothing about
other users' files — constraint 5); 429/5xx: transient Google-side condition;
unknown: status and message verbatim, no invention. Reads status and message
only — never credential material. Tests: one per status class, a non-`Error`
input, an error without a status, and that the message contains operation and
target.

**`query.ts` + test**: `childByNameQuery(parentId, name)` producing the
`'<parent>' in parents and name = '<name>' and trashed = false` form proven in
the spike probe, escaping backslashes and apostrophes;
`uploadMimeType(fileName)` — extension → MIME via a small named map, falling
back to `DEFAULT_UPLOAD_MIME_TYPE`. Tests: plain name; apostrophe; backslash;
uppercase extension; unknown extension → default.

Verification:

- [ ] Every file ≤ 400 lines (R5), every function ≤ 50 lines (R6)
- [ ] `grep -rn ": any\|as any\|@ts-ignore\|@ts-expect-error" packages/adapter-drive/src/`
      returns nothing (R20/R24)
- [ ] Every relative import carries `.js` (R21) — grep sweep over `src/`
- [ ] No `*.test.ts` imports `googleapis`, `google-auth-library`, or
      `node:http` (constraint 3)
- [ ] `npm run build` and `npm test` pass, with the new tests counted

Commit: `feat(adapter-drive): add credential, error and query modules`

### Edit 5 — Add the `DriveGateway` implementation

**`client.ts`** — the `DriveFilesApi` seam (D4): the narrow adapter-owned
interface the gateway depends on (`getItem(fileId)`, `getText(fileId)`,
`listByQuery(query, pageSize)`, `createItem(input)`) plus one factory
implementing it over `google.drive({ version: "v3", ... }).files`, reusing the
call shapes proven in `docs/tasks/046-spike-adapter-drive/drive-probe.mjs`
(`supportsAllDrives`, `includeItemsFromAllDrives`, `alt: "media"` with a text
response type, `media` with a read stream for uploads). Not unit tested — the
smoke covers it.

**`auth.ts`** — the OAuth loopback flow: loopback server on `127.0.0.1` with
an ephemeral port and `LOOPBACK_CALLBACK_PATH`, `access_type: "offline"`,
`DRIVE_SCOPES`, token persistence to `~/.saci/token.json`, and
`client.on("tokens", ...)` refresh persistence; an existing token skips the
browser. Progress lines carry paths, scope strings, and expiry metadata only —
never token or client-secret material (constraint 2). Not unit tested — the
smoke covers it.

**`gateway.ts` + test** — `class DriveGateway implements DriveGatewayPort`
(import the port aliased, the `adapter-jira` convention), constructed with an
injected `DriveFilesApi`: `resolveFolder` via `getItem`, throwing when the
`mimeType` is not `FOLDER_MIME_TYPE` and naming id and actual type;
`findChild` via `listByQuery(childByNameQuery(...), CHILD_PAGE_SIZE)` — 0 →
`null`, 1 → the item, >1 → throw naming parent, name, count; `createFolder`
via `createItem` with `FOLDER_MIME_TYPE`; `uploadFile` via `createItem` with
`uploadMimeType(name)` and the local path; `readFileContent` via `getText`.
Every call wraps failures through `toDriveError` (R4) — no silent catch, no
`null` on failure except the documented `findChild` absence. Tests inject a
fake `DriveFilesApi`: folder resolve happy; non-folder id rejected; child
found / absent (`null`) / ambiguous (throws); `createFolder` passes the folder
MIME type; `uploadFile` resolves MIME from the extension and forwards the
path; `readFileContent` passthrough; a thrown API error surfaces a message
naming operation and target.

**`index.ts`** — public surface: the `DriveGateway` class and its construction
options, the `DriveFilesApi` / `CreateItemInput` types, the constants
consumers need (`DRIVE_SCOPES`, `FOLDER_MIME_TYPE`), and one convenience
factory (e.g. `createDriveGateway`) that resolves credentials, authorizes,
builds the googleapis-backed `DriveFilesApi`, and returns the gateway — what
the smoke and the future `ship` brief call.

Verification:

- [ ] `grep -rn "googleapis\|google-auth-library" packages/adapter-drive/src/`
      matches only `client.ts` and `auth.ts`
- [ ] All five port methods implemented; `tsc` accepts the class as a
      `DriveGateway` implementation with no structural cast and no `as`
- [ ] `index.ts` exports the class and the factory
- [ ] `grep -rn 'from.*adapter' packages/core/src/` still returns nothing (R25)
- [ ] Edit 4's size and no-`any` sweeps still pass over the new files
- [ ] `npm run build` and `npm test` pass, new gateway tests counted

Commit: `feat(adapter-drive): add the DriveGateway implementation`

### Edit 6 — Ignore the credential files

Append to `.gitignore`, after the existing `config.json` line:

```
oauth_client.json
token.json
```

Verification:

- [ ] `git check-ignore -v oauth_client.json token.json` reports both ignored
- [ ] `git diff .gitignore` shows two added lines and nothing else

Commit: `chore: add Drive credential files to gitignore`

### Edit 7 — Document the scope-change trap in `docs/GOTCHAS.md`

Add a `G-DRIVE` row to the Categories table (`Google Drive adapter — OAuth
scopes, tokens, Drive API semantics`) and, after the last catalog entry and
before the `---` preceding `## Maintenance`, an entry in the file's format:

`### G-DRIVE-1 — Changing the requested OAuth scopes silently reuses the old grant`

- **Symptom:** after editing `DRIVE_SCOPES`, Drive calls keep failing with
  403 / `insufficient` or `invalid_scope`, and no browser consent appears.
- **Cause:** `~/.saci/token.json` caches the grant issued for the *previous*
  scope set; the adapter finds a token file, reuses it, and never re-runs
  consent. Google enforces the granted scope string in the cached token, not
  the constant in the code.
- **Workaround:** delete `~/.saci/token.json` and re-run; authorize again in
  the browser. Every scope change requires this.
- **Evidence:** `docs/tasks/046-spike-adapter-drive/run-instructions.md` §2
  and `docs/explorations/drive-oauth.md` §4; adopted by brief 047.

Verification:

- [ ] `grep -n "G-DRIVE" docs/GOTCHAS.md` returns the category row and the
      entry heading
- [ ] The entry carries all four format fields (Symptom / Cause / Workaround /
      Evidence); no existing entry was modified

Commit: `docs(gotcha): add G-DRIVE-1 — scope change needs token delete`

### Edit 8 — Author the live smoke script and run instructions

**`docs/tasks/047-adapter-drive/drive-smoke.mjs`** — throwaway smoke, run from
the repo root after `npm run build`, importing the built adapter
(`packages/adapter-drive/dist/index.js`) by relative path. It must: take the
target folder id and the name of an existing **human-created** child as CLI
args or env vars (no folder id, file id, or account identifier hardcoded in
the committed file); read credentials from `~/.saci/` through the adapter's
own resolver (R1), composing no path of its own beyond `os.tmpdir()` for the
upload fixture; exercise all five primitives with one labeled evidence line
each —

1. `resolveFolder` on the target folder;
2. `findChild` for the human-created child — expects present;
3. `findChild` for a name that cannot exist — expects `null` (the absence path
   the later verify-never-create policy depends on);
4. `createFolder` of a timestamped throwaway folder — **the one primitive the
   046 probe never exercised**, so it is mandatory here;
5. `uploadFile` of a small temp file into the folder from step 4;
6. `readFileContent` of that file, compared against what was written;

then print `[smoke] RESULT: N/6 ...` plus the created folder and file ids so
the owner can delete them by hand (no delete call — deletion is not on the
port). Never print token or client-secret material; classify failures loudly
(R4).

**`docs/tasks/047-adapter-drive/run-instructions.md`** — owner-facing
procedure (Windows): OAuth client setup with user type **Internal** and
application type **Desktop app** (D6, and do not reproduce the External +
Testing walkthrough); credential placement (`~/.saci/oauth_client.json` by
hand, `~/.saci/token.json` created by the first run); the scope-change trap
pointing at `G-DRIVE-1`; `npm install` + `npm run build` before the first run,
then the exact command line; exactly which output to paste back, and the
never-paste list (credential file contents, the authorization URL — it embeds
the client id — and consent screenshots).

Verification:

- [ ] Both files exist under `docs/tasks/047-adapter-drive/`
- [ ] `grep -n "googleapis" docs/tasks/047-adapter-drive/drive-smoke.mjs`
      returns nothing — the smoke calls the built adapter, it does not
      re-implement any Drive call
- [ ] All five primitives appear in the script, `createFolder` included
- [ ] The instructions say **Internal**; nothing in them reads as current
      guidance for External / Testing
- [ ] Secret sweep clean (see Structural checks)

Commit: `docs(tasks): add drive smoke script and run instructions for 047`

### Evidence round (process, between Edit 8 and Edit 9)

The owner runs the smoke locally and pastes the output verbatim; the executor
interprets (D3). Expected: one round. If an operation fails, the executor
diagnoses, revises the adapter or the script, and requests a re-run — it never
weakens the smoke and never records a pass without pasted output. Revisions
are committed as `docs(tasks): update drive smoke script after evidence round`
and/or a `fix(adapter-drive): ...` commit before Edit 9.

**STOP-and-confirm guard.** If the evidence suggests the chosen scope pair is
insufficient for any of the five primitives, **STOP and report** with the
pasted evidence. Do not switch to the broad `drive` scope, do not add a scope,
do not soften the smoke — the fallback is recorded in 046 and taking it is the
owner's decision, not the executor's.

### Edit 9 — Record the evidence in `notes.md`

Create `docs/tasks/047-adapter-drive/notes.md`, first line
`# Notes: 047 — adapter-drive evidence and decisions`, containing: the smoke
evidence (pasted excerpts without secrets, date, platform line, per-primitive
pass record, explicitly noting that `createFolder` is newly evidenced here);
the ready-to-paste **R2 justification** paragraph for the future PR
description, transcribed per D8 and naming both pinned versions; the
supersession record for brief 045 (`readManifest` retired; the `TaskManifest`
contract moves to the ship layer's `parseManifest` over `readFileContent`) —
stated here, never by editing 045; the watch items carried forward unchanged
and unclaimed (the cross-user content-read gap per constraint 5 with its
recorded fallback, and the Internal-mode refresh-longevity corroboration); and
any Done-criteria checkbox that could not be met, with the reason.

Verification:

- [ ] File exists; first line matches
- [ ] Each of the five primitives has an evidence line traceable to pasted
      owner output
- [ ] `grep -ni "cross-user" docs/tasks/047-adapter-drive/notes.md` shows the
      gap recorded as untested — no sentence claims it works or fails
- [ ] The R2 paragraph names `googleapis@173.0.0` and
      `google-auth-library@10.9.1`
- [ ] Secret sweep clean

Commit: `docs(tasks): add drive adapter smoke evidence note for 047`

### Automated checks (run before each commit)

- [ ] `npm run build` passes without errors
- [ ] `npm test` passes; the suite total grew by the new adapter tests
- [ ] Both run manually — the pre-commit hook is not wired in this clone

### Structural checks

- [ ] `git diff --name-only main..HEAD` shows only
      `docs/tasks/047-adapter-drive/**`, `packages/core/src/gateways.ts`,
      `packages/core/src/index.ts`, `packages/adapter-drive/**`,
      `tsconfig.json`, `package-lock.json`, `.gitignore`, `docs/GOTCHAS.md`
- [ ] Nothing under `packages/cli/**`, `packages/adapter-jira/**`,
      `packages/adapter-sheets/**`, `harness/**`, `.claude/**`; `CLAUDE.md`
      and `docs/ROADMAP.md` unmodified (deferred — see Out of scope)
- [ ] No `dist/`, `node_modules/`, `oauth_client.json`, or `token.json`
      tracked anywhere; `git status` clean at the end
- [ ] Secret sweep returns nothing:
      `grep -rnE "GOCSPX|ya29\.|\"refresh_token\"|\"client_secret\"" docs/tasks/047-adapter-drive/ packages/adapter-drive/src/`

### Behavior checks

- [ ] `findChild` returns `null` for an absent child — asserted in unit tests
      **and** evidenced live
- [ ] `findChild` throws on more than one match (unit test)
- [ ] `resolveFolder` rejects an id whose `mimeType` is not the folder type
      (unit test)
- [ ] `createFolder` is evidenced live (the 046 coverage gap closed)
- [ ] `uploadFile` + `readFileContent` round-trip the same content live
- [ ] A missing `~/.saci/oauth_client.json` produces a message naming the
      absolute path and the fix (unit test)
- [ ] No test performs a network call (constraint 3)
- [ ] Nothing produced by this task claims the cross-user content read works
      (constraint 5)

### Git checks

- [ ] Branch used: `feat/adapter-drive` (not the `claude/*` worktree branch)
- [ ] Commits follow Conventional Commits (G-R3); subjects ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed; no PR opened

### Process checks

- [ ] Pause 1 — numbered plan presented and approved before any change
      (`Plan required: yes`)
- [ ] Pause 2 — first modified file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message +
      `pre-commit-self-audit` output before each commit
- [ ] Approved commit messages used verbatim; `git log -1` checked against the
      approved subject after each commit
- [ ] The evidence round followed the 037 discipline: paste in the turn's
      final message block, single-block packaging, no new Pause over
      outstanding evidence debt
- [ ] If any criterion could not be met, it was reported explicitly

## Git workflow

### Branch

`feat/adapter-drive` — created via `git switch -c feat/adapter-drive` from the
session HEAD before Edit 1 (constraint 7). The `claude/*` worktree branch must
not carry these commits.

### Commit sequence

1. `docs(tasks): add brief for 047-adapter-drive`
2. `refactor(core): declare DriveGateway as five drive primitives`
3. `feat(adapter-drive): add package scaffold and dependencies`
4. `feat(adapter-drive): add credential, error and query modules`
5. `feat(adapter-drive): add the DriveGateway implementation`
6. `chore: add Drive credential files to gitignore`
7. `docs(gotcha): add G-DRIVE-1 — scope change needs token delete`
8. `docs(tasks): add drive smoke script and run instructions for 047`
9. `docs(tasks): add drive adapter smoke evidence note for 047`

Conditional, only if the evidence round forces a revision (between 8 and 9,
may repeat): `docs(tasks): update drive smoke script after evidence round`
and/or a `fix(adapter-drive): ...` commit whose subject the owner approves at
Pause 3.

All subjects verified ≤ 72 chars. Leading verbs (`add`, `declare`, `update`)
are on the Check 3 allowlist in
`.claude/skills/pre-commit-self-audit/SKILL.md`; a conditional `fix(...)`
subject must clear the same allowlist before use.

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code):** **required** — `Plan required: yes`. Present
  a numbered plan covering the module breakdown of Edits 4-5 and the test
  list, and wait for approval.
- **Pause 2 (after the first modified file):** show the result and wait for
  review. **Always required.**
- **Pause 3 (before each commit):** show `git status` + `git diff --stat` +
  proposed message + `pre-commit-self-audit` output. **Always required.**

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report (constraints 8 and
  9 cover the known environment cases).
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md` as a
  follow-up brief (Edit 7's entry is the only one in scope here).
- Live evidence contradicting the closed scope pair → **STOP and report** (see
  the Evidence round guard). Never widen a scope on your own judgment.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: yes`. This task writes a new package of production code:
module boundaries, the fake-injection test list, and the exact error-message
wording are real design work this brief scopes but does not hand over as
byte-exact text. The Pause 1 plan closes that gap before any file is created.

Decisions D1-D8 are **not** re-openable at Pause 1: the plan proposes the
module and test breakdown, not the library, the scopes, the port shape, or the
evidence model.

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — known traps (G-NODE-2 bites this task directly)
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6, Lesson #15
5. `.claude/skills/brief-template/SKILL.md` — template reference
6. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit (Pause 3)
7. `docs/tasks/046-spike-adapter-drive/notes.md` — the closed decisions
8. `docs/tasks/046-spike-adapter-drive/drive-probe.mjs` — proven call shapes
9. `packages/adapter-jira/` — package and test conventions
10. `docs/explorations/drive-oauth.md` — background only; §10 binding
11. `docs/tasks/037-evidence-close-protocol/brief.md` — evidence protocol

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat main...HEAD` (line counts per file)
3. The live smoke result, per primitive, with its pasted-evidence source
4. Any verification checkbox that could not be met, with explanation
5. Confirmation that no `git push` was executed and no PR was opened
6. Suggested next step: owner authorizes push + PR (the PR description carries
   the R2 justification transcribed in `notes.md`); then the `ship` command
   brief, which consumes these five primitives
