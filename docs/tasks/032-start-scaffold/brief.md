# Brief: 032 — `start` command v0 (local-only scaffold)

> **Category:** L
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `feat/start-scaffold`

---

## Context

`start` is the first **production-loop** command (`docs/ROADMAP.md` §"Product
map at a glance": the loop is the core). It pulls one Jira task by key,
scaffolds its local folder, applies a template, and writes the `.saci.json`
manifest — all **local-only**. Drive round-trip is `ship`'s job, deferred.

It stands on two merged briefs: **030** (`derivePath` → `readonly string[]`
folder segments; `packages/core/src/derive-path.ts`) and **031** (`TaskManifest`
v0 + `parseManifest`/`serializeManifest`; `packages/core/src/workspace.ts`).
Both are exported from `@saci/core` (`packages/core/src/index.ts:58-72`).

Designed in the 2026-07-04 mentor session (D-set D1–D7); the task-folder
internal structure was closed in the 2026-07-03 recap (D-A). The 2026-07-04
session doc is not yet committed to `docs/sessions/` — this brief is the
design record for that D-set.

### P4 numbering evidence (three-source, run 2026-07-06)

- `ls docs/tasks/`: highest existing directory is `031-task-manifest-v0`.
- `git log --oneline main`: tip is `0efbad6 docs(sessions): add mentor and
  executor recaps for 031 (#78)`, whose parent is `2071baf feat(core): add
  TaskManifest v0 contract … (#77)` (brief 031). The tip is a **docs recap**,
  not a brief-bearing merge; no merged PR ships a 032 brief.
- `CLAUDE.md` E* reservations: E1–E5 carry no nominal slot for 032.
- Sources agree → next NNN is `032`.

## Goal

Add a `saci start <KEY>` subcommand that fetches the named issue live from
Jira, derives its workspace folder via `derivePath`, refuses to overwrite an
existing folder, scaffolds the D-A folder structure, applies a template
(unless `--blank`), and writes a v0 `.saci.json` manifest — with all path
derivation and manifest assembly kept in `@saci/core` and all fs/network in
the composition root (R25).

Out of scope (park; do not build):

- **Drive upload / mirroring** — `ship` territory (D1). No `adapter-drive`.
- **Open-in-software** — the "open the editable in the design app" step is a
  follow-up brief (D3). `start` prints paths only.
- **Remote template catalog / download / match heuristics** — templates are
  read from a local root only; no catalog, no level-1/2 match (D4). No
  `--template <name>` selection flag in v0.
- **The full template file-naming convention** (vertical / description /
  variation, separators, date format) — an open `docs/ROADMAP.md` pending
  decision (§"Pending decisions"). v0 reuses `derivePath`'s leaf stem (P2); the
  convention and the slug-sanitization unification land together in a later
  brief, where a mass-rename is acceptable.
- **App-level config file for the two roots** — parking lot (D7). Roots come
  from flags / the P1 default only.
- **`resume` / `load` semantics, `claimedBy`/handoff, ship-history** — later.
- **campaign / parent-task resolution** — `campaign` is always `null` in alpha
  (brief 030 D5); grouping is always the `AVULSAS_BUCKET`.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/032-start-scaffold/brief.md` (this file — commit #1)
   - `packages/core/src/gateways.ts` (add one port method)
   - `packages/adapter-jira/src/gateway.ts` (implement it)
   - `packages/adapter-jira/src/gateway.test.ts` (add coverage)
   - `packages/cli/src/run-fetch.test.ts` (fake gateway gains a stub — see
     Edit 3 rationale; this keeps the tree green, it is not a fetch change)
   - `packages/cli/src/argv.ts` (add the `start` command kind + flags)
   - `packages/cli/src/argv.test.ts` (add coverage)
   - `packages/cli/src/run-start.ts` (new — composition function)
   - `packages/cli/src/run-start.test.ts` (new — coverage)
   - `packages/cli/src/display.ts` (add `renderStart`)
   - `packages/cli/src/display.test.ts` (add coverage)
   - `packages/cli/src/cli.ts` (wire the `start` case)

   If anything else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md`, especially **R1** (`path.join` /
   `path.resolve`, no hardcoded separators or roots), **R4** (no silent catch;
   fail-loud contracts below are documented, not swallowed), **R5/R6** (≤ 400
   lines/file, ≤ 50 lines/function — split composition helpers), **R7** (named
   constants for the manifest sentinels, the default templates dir name, exit
   semantics), **R8** (comments answer "why"), **R20/R24** (strict, no `any` /
   no `@ts-ignore`), **R21** (ESM, `.js` import extensions), **R23**
   (`node:test`, colocated `*.test.ts`), **R25** (core imports no adapter;
   derivation + manifest assembly stay in core, fs/network only in `cli`).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `feat/start-scaffold`
   - Conventional Commits (G-R3); no `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5). Open the PR and hand the link to
     Rafael, who merges; never auto-merge.
4. **Fail-loud, no partial scaffold (D2/D5):** all validation that can fail
   (live-Jira fetch, the exactly-one-result check, the collision check, and —
   when not `--blank` — template-source resolution) runs **before** any
   filesystem mutation. If any fails, nothing is written and the process exits
   non-zero. A missing/failed Jira response never yields a scaffold.

### Conventions

- Agent-consumed surface is English-only (R9): identifiers, comments, test
  names, commit messages, pause names ("Pause 1/2/3").
- Commit types/scopes: `docs(tasks)` for the brief; `feat(core)` for the port +
  adapter atomic change (rationale in Commit sequence); `feat(cli)` for the
  command surface. Leading verb `add` (self-audit Check 3 allowlist).
- Match the existing composition-root idiom: `run-start.ts` mirrors
  `run-fetch.ts` (injected `makeGateway` factory, injected `now: Date`);
  `renderStart` mirrors `renderFetch`/`renderExport` (pure, returns a string
  ending in `TRAILING_NEWLINE`; `cli.ts` owns the write).

### Architectural decisions already made (do not revisit)

Design-session decisions (2026-07-04 D-set + 2026-07-03 D-A) and the
planner-resolved decisions (P1–P6, ratified where noted). The executor
implements; it does not re-decide. If one proves unworkable mid-execution,
**STOP and report**.

#### D-A — Task-folder internal structure (2026-07-03, closed)

Under the derived leaf folder: **finals at the folder root**, an `editaveis/`
subdir, an `editaveis/assets/` subdir, and `.saci.json` **at the leaf-folder
root**. v0 creates the three directories (leaf, `editaveis`,
`editaveis/assets`) and writes `.saci.json`; it does not create placeholder
finals.

#### D1 — Drive is out of scope

No upload, no mirroring, no manifest read-back. `start` is local-only.

#### D2 — Live fetch, no cache, fail loud

`start` fetches the issue live from Jira every time. There is no local issue
cache. A missing issue, a Jira error, or a not-exactly-one result **fails loud
with no scaffold** (constraint 4).

#### D3 — No open-in-software

`start` prints the created folder path and the editable path and stops. Opening
the editable in the design application is a follow-up brief.

#### D4 — Template: local copy, `--blank` skips it

The template is copied from the local templates root into `editaveis/`. With
`--blank`, the copy is skipped and **everything else is identical** (same dirs,
same manifest, `template` field records the blank sentinel). No remote catalog,
no download, no match heuristics, no `--template` selection flag.

#### D5 — Collision: explanatory report, never overwrite, no prompt

Before any write, if the derived leaf folder already exists, `start` prints an
explanatory report — stating whether the folder contains a `.saci.json` and/or
an `editaveis/` — lists the user's options (keep working in it, or rename it
manually and re-run), and exits non-zero. It **never** overwrites and **never**
prompts interactively.

#### D7 — No app-level config for the roots

The workspace root and templates root are not read from a config file in v0.
`--workspace-root` is required; the templates root comes from `--templates-root`
or the P1 default.

#### P1 — `--templates-root` is optional; default is a sibling `templates/`

**Decision:** `--templates-root` is **optional**. When omitted (and not
`--blank`), it defaults to a `templates/` directory that is a **sibling of the
resolved workspace root**: `path.join(path.dirname(pathResolve(workspaceRoot)),
TEMPLATES_DIR_NAME)` with `TEMPLATES_DIR_NAME = "templates"` (R7).

**Rationale (stated per the brief's open question):** a required flag was
rejected because `--blank` needs no template source, so requiring the flag
would force an irrelevant argument on the blank path; and because the common
case `saci start KEY --workspace-root X` should work with no template flag,
which needs a default (D7 parks the config file that would otherwise supply
it). A **sibling** dir (not one nested under the workspace root) keeps the
curated template library separate from generated task folders and matches the
session's example. The default is fully overridable by the flag. The default is
computed in the composition root (it needs `path.resolve`/`path.dirname`), not
in the pure parser — `argv.ts` forwards `templatesRoot?: string` unresolved.

#### P2 — Template file naming reuses `derivePath`'s leaf stem (ratified)

The copied template file is renamed to `derivePath`'s **leaf stem**
(`<KEY>_<slug>`, or `<KEY>` alone in the empty-slug case) with the **source
file's original extension appended** by the composition root. No new core
function: the leaf is `segments[3]` from the existing `derivePath` output; the
`cli` only appends `path.extname(sourceFile)`. The richer naming convention
remains the open ROADMAP pending decision and lands in its own brief with the
sanitization unification (mass-rename acceptable then).

#### P3 — Single-key lookup skips the design filters (ratified)

`fetchIssueByKey` does **not** apply `applyOwnFilters` /
`applyParentTemplateFilter`. Those filters exist to select the design-search
result set; a user-named key means the selection already happened. This is
**designed behavior, not an omission** — state it as such. Sister/parent
enrichment (`fetchSisters`/`fetchParents`) and the per-issue mapper
(`buildIssueEntry`) ARE reused.

#### P4 — v0 template-source resolution contract

The template source directory is `path.join(templatesRoot, vertical)` where
`vertical = segments[1]` from `derivePath`. v0 expects **exactly one regular
file** directly in that directory (the vertical's default template). Zero,
more than one, or a missing directory **fails loud** with a message naming the
resolved path and what was found, before any scaffold is written (constraint
4). This defers `--template` selection and the catalog without guessing.

#### P5 — `mainJql` is unused on the start path

`fetchIssueByKey` builds its own `key = <KEY>` JQL and never reads the
gateway's `mainJql`. The composition root constructs the gateway with an empty
`mainJql` for `start`, with a one-line comment. (Making `mainJql` optional on
the adapter config is deferred — it would touch the `fetchIssues` contract.)

#### P6 — The port addition is atomic with its consumers

Adding a **required** method to the `JiraGateway` port makes the adapter class
and every test double that implements the port fail to compile until the method
exists. So the core port change, the adapter implementation, its tests, and the
`run-fetch.test.ts` fake-gateway stub land in **one commit** (commit #2) to keep
every package's build green. This mirrors brief 031's atomic type+test+re-export
commit.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The user pre-saved this brief to `docs/tasks/032-start-scaffold/brief.md`
before invoking the executor (caminho B). The executor verifies presence and
commits.

- [ ] Directory `docs/tasks/032-start-scaffold/` exists
- [ ] File `docs/tasks/032-start-scaffold/brief.md` exists; first line matches
      the title above
- [ ] `git add docs/tasks/032-start-scaffold/brief.md` is staged
- [ ] Commit #1 created with subject `docs(tasks): add brief for 032-start-scaffold`

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

Commit: `docs(tasks): add brief for 032-start-scaffold`

### Edit 2 — Add `fetchIssueByKey` to the `JiraGateway` port

In `packages/core/src/gateways.ts`, add one method to the `JiraGateway`
interface (interface-only; no implementation, no import — R25):

```ts
/**
 * Fetch a single design issue by its Jira key. Fail-loud (R4): zero results
 * or more than one both throw an error naming `key` — never returns
 * `Issue | null`. The `start` command relies on this to refuse to scaffold a
 * task it cannot uniquely resolve.
 */
fetchIssueByKey(key: string): Promise<Issue>;
```

Verification:

- [ ] `grep -n "fetchIssueByKey" packages/core/src/gateways.ts` shows it inside
      `interface JiraGateway`, returning `Promise<Issue>`
- [ ] `grep -rn 'from.*adapter' packages/core/` returns no matches (R25)
- [ ] `SheetGateway` / `DriveGateway` and their TODO comments are unchanged

Commit: covered by commit #2 (see Commit sequence).

### Edit 3 — Implement `fetchIssueByKey` in the Jira adapter

In `packages/adapter-jira/src/gateway.ts`, add the method to the `JiraGateway`
class. Requirements:

- JQL is `key = <KEY>` run through the existing `this.http.searchJql(...)`
  wire operation with `deriveDesignFields(this.fieldMapping)` — **no new wire
  operation, no single-issue REST endpoint** (reuse only).
- Assert **exactly one** raw result; on `0` or `> 1`, throw an `Error` naming
  the key and the count (D2 fail-loud).
- Reuse the existing per-issue pipeline as factored units: `uniqueParentKeys`,
  `fetchSisters`, `fetchParents`, then `buildIssueEntry(design,
  sistersByParent, parentsByKey, this.fieldMapping, this.warningLog)`. If the
  mapper returns `null` (keyless), throw naming the key.
- **Do not** call `applyOwnFilters` / `applyParentTemplateFilter` (P3) and
  **do not** call `validateFieldMapping` (that is a design-search /
  configured-mapping concern; the start path uses the default mapping — keep
  the single-key lookup lean; note this in a "why" comment).
- The method is ≤ 50 lines (R6); factor a private helper if needed.

**STOP-and-confirm guard (judgment flag 1):** the resolution above assumes
`buildIssueEntry` and the parent/sister helpers are reusable as-is (verified by
the planner — `buildIssueEntry` is already an exported unit taking a single
issue). If, while implementing, the mapper or the enrichment helpers turn out
**not** to be reusable without dragging the multi-search orchestration into the
single-key path or duplicating mapping logic, **STOP and confirm** — extraction
of the mapping pipeline then enters scope as its own Edit before this one.

In `packages/adapter-jira/src/gateway.test.ts`, add coverage using the existing
recorded-fixture transport pattern (`buildGateway` / injected `FetchLike`):

- happy path: `key = <KEY>` returns exactly one issue → mapped `Issue` with the
  expected fields (parent/sister enrichment exercised);
- zero results → rejects, error message contains the key;
- more-than-one result → rejects, error message contains the key;
- the design filters are **not** applied (an issue that `fetchIssues` would
  drop on status/Template is still returned by `fetchIssueByKey`).

Verification:

- [ ] `grep -n "fetchIssueByKey" packages/adapter-jira/src/gateway.ts` shows the
      method on the class
- [ ] `grep -n "key = " packages/adapter-jira/src/gateway.ts` shows the JQL uses
      `key = <KEY>` via `searchJql` (no new `http` method added)
- [ ] `grep -nE "applyOwnFilters|applyParentTemplateFilter|validateFieldMapping" packages/adapter-jira/src/gateway.ts`
      shows they are NOT referenced inside `fetchIssueByKey`
- [ ] `grep -c "@ts-ignore\|@ts-expect-error\|\bany\b" packages/adapter-jira/src/gateway.ts` returns `0`
- [ ] New `gateway.test.ts` cases cover: happy, zero (rejects, names key),
      many (rejects, names key), filter-skip

Commit: covered by commit #2.

#### 3a. Keep the tree green — `run-fetch.test.ts` fake stub (P6)

The inline fake at `packages/cli/src/run-fetch.test.ts:35` implements
`JiraGateway` with only `fetchIssues`. Add a `fetchIssueByKey` stub so the fake
still satisfies the (now-larger) port and the `cli` package compiles:

```ts
async fetchIssueByKey(): Promise<Issue> {
  throw new Error("fetchIssueByKey is not exercised by the fetch run");
},
```

This is the minimal ripple of the port change (R4: an explicit throw, not a
silent stub); it is not a behavior change to `runFetch`.

Verification:

- [ ] `packages/cli/src/run-fetch.test.ts` fake gains a `fetchIssueByKey` stub
- [ ] No other assertion in `run-fetch.test.ts` changed
- [ ] `npm run build` + `node --test` across `core`, `adapter-jira`, and `cli`
      pass on commit #2's tree

Commit: covered by commit #2.

### Edit 4 — Add the `start` command kind to the pure parser

In `packages/cli/src/argv.ts`:

- Add to `CLI_OPTIONS` and `CliValues`: `"workspace-root": { type: "string" }`,
  `"templates-root": { type: "string" }`, `blank: { type: "boolean" }`.
- Add a fifth member to `ParsedCommand`, following the existing union shape
  (judgment flag 2 — optional fields are already used by `fetch`, so no
  restructuring of the shared type is needed):
  ```ts
  | { kind: "start"; key: string; workspaceRoot: string; templatesRoot?: string; blank: boolean }
  ```
- In `routeCommand`, add a `case "start"`: the `<KEY>` positional is
  `positionals[1]` and is **required** (undefined → `usage`); `--workspace-root`
  is **required** (undefined → `usage`); `templatesRoot` forwards
  `values["templates-root"]` unresolved (P1 default is a composition-root
  concern); `blank` is `values.blank ?? false`.
- Extend `USAGE` with the `start` line, e.g.:
  `saci start <KEY> --workspace-root <path> [--templates-root <path>] [--blank]`

**STOP-and-confirm guard (judgment flag 2):** if the new kind cannot follow the
existing `ParsedCommand` union pattern without restructuring the shared
`CliValues`/`CLI_OPTIONS` types, **STOP and confirm**. (Planner-verified: it
can — `fetch` already carries optional `fieldConfig?`/`project?`.)

In `packages/cli/src/argv.test.ts`, add cases: valid `start` parse; missing
`<KEY>` → `usage`; missing `--workspace-root` → `usage`; `--blank` sets
`blank: true`; `--templates-root` populates `templatesRoot`.

Verification:

- [ ] `grep -n '"start"' packages/cli/src/argv.ts` shows the routed command
- [ ] `grep -n 'kind: "start"' packages/cli/src/argv.ts` shows the union member
- [ ] `USAGE` includes a `start` line
- [ ] New `argv.test.ts` cases pass (valid, missing-key, missing-root, blank,
      templates-root)

Commit: covered by commit #3.

### Edit 5 — Add the `run-start` composition function

Create `packages/cli/src/run-start.ts` mirroring `run-fetch.ts` (injected
`makeGateway: MakeGateway` from `run-fetch.js`, injected `now: Date = new
Date()` for deterministic tests). Named constants at top (R7):
`TEMPLATES_DIR_NAME = "templates"`, `MANIFEST_FILENAME = ".saci.json"`,
`EDITAVEIS_DIR = "editaveis"`, `ASSETS_DIR = "assets"`, `BLANK_TEMPLATE_ID =
"blank"`. Export a `StartRunResult` type, e.g.
`{ folderPath: string; editablePath: string; copiedFile: string | null }`.

Behavior, in strict order (constraint 4 — validate before any write):

1. Construct the gateway via `makeGateway(dropLog, warningLog)` (simple
   console-forwarding sinks are fine; `start` does not serialize drops/warnings)
   and `await gateway.fetchIssueByKey(key)` (D2 live fetch; a throw propagates).
2. Build `DerivePathInput` from the fetched `Issue` — `campaign: null` (alpha;
   `campaign` lives on `DerivePathInput`, not `Issue`) — and call
   `derivePath(input)` → `segments`. `vertical = segments[1]`, `leaf =
   segments[3]`.
3. Resolve `workspaceRoot` to absolute (`path.resolve`); `leafFolder =
   path.join(absWorkspaceRoot, ...segments)`.
4. **Collision check (D5):** if `leafFolder` exists, build the explanatory
   report (does it contain `MANIFEST_FILENAME`? an `EDITAVEIS_DIR`?), append the
   options text, and **throw** an `Error` carrying that report (cli prints it,
   exits non-zero). No write has happened.
5. If not `blank`: resolve the templates root (flag or P1 default), then the
   template source per P4 (`path.join(templatesRoot, vertical)`, exactly one
   regular file). Missing dir / zero / many → **throw** naming the resolved path
   and what was found. (Still before any write.)
6. Scaffold (only now): `mkdir` recursive for `leafFolder`,
   `path.join(leafFolder, EDITAVEIS_DIR)`, and
   `path.join(leafFolder, EDITAVEIS_DIR, ASSETS_DIR)`.
7. If not `blank`: copy the template source into `editaveis/` renamed to the
   leaf stem + the source's original extension (P2): target basename = `leaf +
   path.extname(source)`; `copiedFile` = that path.
8. Assemble the manifest object (core-pure assembly; R25 — no I/O here) and
   write it via `serializeManifest` to `path.join(leafFolder,
   MANIFEST_FILENAME)`. Fields (brief 031 schema):
   - `schemaVersion: TASK_MANIFEST_SCHEMA_VERSION`
   - `jiraKey: issue.key`
   - `vertical: segments[1]`
   - `slug`: `leaf === issue.key ? "" : leaf.slice(issue.key.length + 1)`
     (the leaf is `<KEY>_<slug>` or `<KEY>`; deterministic per `derivePath`)
   - `template`: the source filename **without extension** when not blank, else
     `BLANK_TEMPLATE_ID` (v0 stand-in for the future catalog identifier)
   - `drivePath: segments`
   - `startedAt: now.toISOString()` (UTC ISO 8601, `Z` form)
   - `shippedAt: null`
9. Return `{ folderPath: leafFolder, editablePath:
   path.join(leafFolder, EDITAVEIS_DIR), copiedFile }`.

Split steps into ≤ 50-line helpers (R6): e.g. a collision-report builder, a
template-source resolver, a scaffold-and-write step. No `catch` swallows an
error (R4). No hardcoded separators/roots (R1).

Create `packages/cli/src/run-start.test.ts` (`node:test`) using a fake
`makeGateway` (its `fetchIssueByKey` returns a canned `Issue`) and a real temp
dir (mirror `run-fetch.test.ts`'s `mkdtemp` pattern; a temp templates dir too).
Inject a fixed `now` for a deterministic `startedAt`. Cover at minimum:

- happy scaffold: leaf, `editaveis/`, `editaveis/assets/` created; `.saci.json`
  parses via `parseManifest` with all fields correct (incl. `shippedAt: null`,
  `startedAt` = the injected time);
- template copy: the editable is renamed to `<KEY>_<slug><ext>`;
- `--blank`: no file copied into `editaveis/`, `template === "blank"`, all dirs
  and the manifest still created;
- collision: pre-create the leaf folder → `runStart` **throws**, the message
  reports `.saci.json`/`editaveis` presence, and **nothing new is written**;
- template-source failure (P4): zero or many files in the vertical dir →
  **throws** before any scaffold (assert the leaf folder was NOT created).

Verification:

- [ ] `packages/cli/src/run-start.ts` and `run-start.test.ts` exist
- [ ] Named constants declared (R7); `grep -c "\bany\b" run-start.ts` → `0`
- [ ] `grep -n "path.join\|path.resolve" run-start.ts` shows paths composed
      OS-agnostically (R1); no hardcoded `D:\` / `/Users/` (A4)
- [ ] Validation precedes writes: collision + template-source checks throw
      before any `mkdir`/`copyFile`/`writeFile`
- [ ] `.saci.json` round-trips through `parseManifest` in the happy-path test
- [ ] All `run-start.test.ts` cases pass

Commit: covered by commit #3.

### Edit 6 — Add `renderStart` to the display layer

In `packages/cli/src/display.ts`, add a pure `renderStart(result:
StartRunResult): string` mirroring `renderFetch`/`renderExport` (no I/O; ends in
`TRAILING_NEWLINE`). It prints the created folder path and the editable path
(D3 — paths only, no "open" affordance); when `copiedFile` is non-null it also
names the copied editable, and on `--blank` it states no template was applied.
Add `renderStart` cases to `packages/cli/src/display.test.ts` (with-template and
blank).

Verification:

- [ ] `grep -n "renderStart" packages/cli/src/display.ts` shows the exported fn
- [ ] Output ends in `TRAILING_NEWLINE`; no `process`/`fs`/`console` used in
      `display.ts` (purity preserved)
- [ ] `display.test.ts` covers the with-template and blank renderings

Commit: covered by commit #3.

### Edit 7 — Wire the `start` case in the composition root

In `packages/cli/src/cli.ts`:

- Import `runStart` (and `StartRunResult` if needed) and `renderStart`.
- Add `case "start":` to `runCommand`: construct the gateway factory with an
  **empty `mainJql`** (P5 — `fetchIssueByKey` ignores it; add a one-line "why"
  comment), call `runStart(makeGateway, command.key, command.workspaceRoot,
  command.templatesRoot, command.blank)`, and `process.stdout.write(
  renderStart(result))`.
- A collision (D5) or any validation failure throws from `runStart` and is
  caught by `main()`'s existing catch → stderr + `EXIT_RUNTIME` (non-zero). No
  new exit code is required; do not add an interactive prompt.
- The credential env check in `makeGatewayFactory` already fails loud when
  creds are absent — reuse it unchanged.

Verification:

- [ ] `grep -n 'case "start"' packages/cli/src/cli.ts` shows the wired case
- [ ] `grep -n "mainJql" packages/cli/src/cli.ts` shows the empty-`mainJql`
      construction for start, with a comment
- [ ] Manual smoke (documented in the summary, not committed): `saci start`
      with a missing `--workspace-root` prints usage and exits `2`; a collision
      prints the report and exits non-zero; a clean run scaffolds and exits `0`

Commit: `feat(cli): add start subcommand for local scaffold`

### Automated checks (run before each code commit)

- [ ] `npm run build` (all workspaces) passes without errors (strict, R20)
- [ ] `node --test` over compiled `dist/` passes for every touched package
- [ ] No new runtime dependency added (R2) — only Node built-ins
      (`node:fs/promises`, `node:path`, `node:util`)

### Structural checks

- [ ] Expected files exist at expected paths (Edits 2–7)
- [ ] No file outside the in-scope list was modified
      (`git diff --name-only origin/main..HEAD`)
- [ ] `grep -rn 'from.*adapter' packages/core/` returns no matches (R25)

### Behavior checks

- [ ] `fetchIssueByKey`: exactly one → mapped `Issue`; zero/many → throws naming
      the key; design filters NOT applied
- [ ] `start` refuses to overwrite an existing leaf folder (D5): report + exit
      non-zero, no write
- [ ] `start` scaffolds leaf + `editaveis/` + `editaveis/assets/` and writes a
      `parseManifest`-valid `.saci.json` (D-A / brief 031 schema)
- [ ] Template applied → renamed to `<KEY>_<slug><ext>` (P2); `--blank` → no
      copy, `template === "blank"`, everything else identical
- [ ] Template-source failure (P4) throws before any scaffold is created

### Git checks

- [ ] Branch used: `feat/start-scaffold`
- [ ] Commits follow Conventional Commits (G-R3); subjects ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] `Plan required: yes` — numbered plan presented and approved before any
      change (Pause 1)
- [ ] Pause 2 — first modified code file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message shown
      before each commit
- [ ] `pre-commit-self-audit` skill output reported in chat before each Pause 3
- [ ] Any criterion that could not be met was reported explicitly

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code): REQUIRED.** Present the numbered plan (edit
  order, the commit-#2 atomicity per P6, the P1/P4 resolutions). Confirm the
  three judgment-flag guards will hold (flag 1: `buildIssueEntry` reuse; flag 2:
  `ParsedCommand` shape; flag 3: naming via leaf stem — already ratified). If
  any guard fires (mapper not reusable, union needs restructuring, or naming
  needs a hardcoded format), **STOP** instead of proceeding.
- **Pause 2 (after the first modified code file): REQUIRED.** Show the first
  code file (Edit 2, `gateways.ts`) and confirm the port shape before the
  adapter/cli work.
- **Pause 3 (before each commit): REQUIRED.** Show `git status` +
  `git diff --stat` + proposed message + `pre-commit-self-audit` output.

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md` as a
  follow-up brief.
- Any judgment-flag guard (Edits 3, 4; P2) fires → **STOP and confirm scope**.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: yes`. Although D1–D7, D-A, and P1–P6 close the design, this
task touches **three packages and ~11 files**, adds a **required method to a
shared port** (a public-API change that ripples to consumers and test doubles,
P6), and introduces a new command surface — squarely R15 territory. The
executor confirms the edit order and the commit-#2 atomicity as a plan before
editing. Pause 2 and Pause 3 remain required regardless (Lesson #6).

## Git workflow

### Branch

`feat/start-scaffold` — cut from up-to-date `main` (tip `0efbad6`). Type `feat`
(adds a new command + a new port capability).

### Commit sequence

1. `docs(tasks): add brief for 032-start-scaffold`
2. `feat(core): add fetchIssueByKey to JiraGateway port`
3. `feat(cli): add start subcommand for local scaffold`

Subjects verified ≤ 72 chars (45 / 51 / 50) and lead with the allowlisted verb
`add`. Commit #2 is **cross-package and atomic** (Edits 2, 3, 3a): the core port
addition, the adapter-jira implementation + tests, and the `run-fetch.test.ts`
fake stub land together because the port method makes the adapter class and the
fake fail to compile until implemented (P6) — scope `core` because the port
contract is the driving change; the commit body notes the adapter impl and
test-fake ripple. Commit #3 is the `cli` command surface (Edits 4–7). **DO NOT
push** — open the PR and hand the link to Rafael.

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules (esp. R1, R4, R5/R6, R7, R20/R24, R21,
   R23, R25)
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — known traps
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
5. `packages/core/src/gateways.ts` — the port being extended (Edit 2)
6. `packages/adapter-jira/src/gateway.ts` / `mapper.ts` / `http.ts` — the
   pipeline reused by `fetchIssueByKey` (Edit 3; flag 1)
7. `packages/core/src/derive-path.ts` — `derivePath` segments + `DerivePathInput`
   (P2/P4; folder + leaf)
8. `packages/core/src/workspace.ts` — `TaskManifest` + `serializeManifest`
   (brief 031 schema; Edit 5)
9. `packages/cli/src/argv.ts` — `ParsedCommand` union pattern (Edit 4; flag 2)
10. `packages/cli/src/run-fetch.ts` — composition idiom mirrored by
    `run-start.ts` (Edit 5); `run-fetch.test.ts:35` — the fake to patch (3a)
11. `packages/cli/src/display.ts` / `cli.ts` — render + wiring idioms (Edits 6–7)
12. `.claude/skills/brief-template/SKILL.md` — template reference
13. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit (Pause 3)

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (3 commits, ordered)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Which judgment-flag guards were checked and that none fired (or, if one did,
   the STOP and the scope question raised)
4. Any verification checkbox that could not be met, with explanation
5. Confirmation that no `git push` was executed
6. Suggested next step (open PR for Rafael to merge; follow-ups: open-in-software
   (D3), the naming-convention + sanitization-unification brief, `ship`)
