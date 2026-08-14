# CLAUDE.md

> **For AI agents coding in this project:** read this file in full before any code change.
> Rules (R) are mandatory. Anti-patterns (A) are forbidden. Exceptions (E) are the only tolerated violations.
> When you discover a new rule, add it here. When a rule becomes unworkable, add an exception rather than removing — preserves history.

## Architecture

Saci v2 is a TypeScript monorepo (npm workspaces, Node ≥22, ESM-only with `.js` import extensions, `tsc` per package, no bundler) following Hexagonal (Ports & Adapters) architecture. It is **CLI-first**; the desktop UI is a later phase that reconnects on top of the CLI. The product is an individual production assistant for the Estratégia design team — pull a Jira task, scaffold its folder, apply the right template, ship the result to Drive — with a secondary team-level coordination view layered on top.

**The application owns production state** (local now, remote later). A spreadsheet is not a state-holding surface; it is one optional one-way projection target among others (flat files, BI platforms). Export is a **fact table**: one row per issue, zero aggregation — aggregation and history belong to the BI layer and to Phase 3 state.

Packages:

- **`@saci/core`** — pure domain logic and port interfaces. No I/O, clock, `fs`, or network. Holds the payload contract (`payload.ts`), the transform/policy domain (`transform.ts`, `policy.ts`), the three ports (`gateways.ts` — `JiraGateway`, `SheetGateway`, `DriveGateway`), and the export projection (`export.ts`). Never imports an adapter (R25).
- **`@saci/adapter-jira`** — implements `JiraGateway` against the Jira REST API directly (`POST /rest/api/3/search/jql`, `nextPageToken` / `isLast` cursor pagination, Basic auth, raw global `fetch`). Depends on `core`.
- **`@saci/adapter-drive`** — implements `DriveGateway` against Google Drive via `googleapis` + `google-auth-library` under a user OAuth Desktop loopback flow (scopes `drive.file` + `drive.metadata.readonly`; credentials in `~/.saci/`, never in the repo). Five one-Drive-call primitives — resolve folder, find child, create folder, upload file, read file content — all confirmed live in brief 047; folder-tree composition and the verify-never-create policy sit above it, in the future `ship` layer. No command wires it yet. Depends on `core`.
- **`@saci/adapter-sheets`** — a package shell, nothing built. It left the parking lot on 2026-08-14: the rule was "build a Sheets projection only when a concrete consumer exists", and one now exists — the spreadsheet is a **report for the team**, read by people who never run Saci, and Saci is to create spreadsheets and share them inside the Google workspace. That is still a one-way projection target, not a return to state in the Sheet. No brief is written and no code exists yet; note that create-and-share exceeds `adapter-drive`'s current OAuth scopes, so the first brief carries an authorization change, not only code.
- **`@saci/cli`** — the composition root and the only package with a `bin` (`saci`). Wires adapters into `core`. Composition functions live in `run-fetch.ts` / `run-export.ts`; `cli.ts` is the entry point.

The **Python laboratory lane** is the `buraqueira` repository — it does not migrate. It stays Python, and this monorepo absorbs proven mechanisms from it one at a time, as briefs (lane declared permanent 2026-08-08, `docs/explorations/python-laboratory-lane.md`; laboratory of record ruled 2026-08-14). It carries no behavior-preserving mandate — there are no production users. `sync.py` / `lib_sheets.py` were legacy reference only and the sync diff engine was never to be ported; the owner reversed that on 2026-08-14 and both files are now portable, into the Google layer, because the spreadsheet became a team report. What ports is the projection, not the mechanism: a report Saci creates and shares needs create/write/share, not the cell-by-cell reconciliation that existed only because the Sheet held state.

The `automation/` folder **in this repository** is a different thing: a frozen snapshot of that lab, vendored once in `8fada81` (2026-06-06) and untouched since — 15 files, 3,490 lines, no test suite. It is the **seed reference** of v2's core (its `lib_transform.py` was ported into `core` in Phase 2) and is cited for the provenance of code already ported, never as authority over what the laboratory does today. When a brief needs to know what the lab does, it reads `buraqueira`.

The **art arm** is the product's second half: given a structured brief, Saci
renders the deliverable rather than only routing the file a designer made. Its
engine comes from **Suindara**, an HTML art laboratory that drives a headless
browser to turn a spec into a PNG. Suindara's engine is **ported into this
monorepo** (2026-08-13, `docs/ROADMAP.md`), one mechanism at a time under R26;
it is not spawned as a subprocess and it is not a dependency. The laboratory
itself, and the `suindara-tmpl-*` art-template repositories it publishes, stay
outside — they are an installable versioned ecosystem on their own release
rhythm.

**Vocabulary, fixed before the first identifier.** This repository uses
`template` for exactly one thing: the source PSD/AI that `start` copies into a
task folder to produce the `editable` (`templateSource`, `templatesRoot`,
`copyTemplate` — 142 sites as of 2026-08-13). An **`artTemplate`** is the other
thing entirely: an HTML package that renders a PNG from a spec, with no human
editing step. The two never share a word. Code absorbed from Suindara is renamed
on arrival — its `template` is our `artTemplate`. In prose, "art template" with
the space; in identifiers, `artTemplate`. Three packages are planned for the arm
and **none exists yet**: `adapter-render` (drives the headless browser),
`adapter-http` and `web` (the brief UI, which replaces Suindara's own panel
rather than porting it). Do not create them ahead of a brief that needs them
(A3).

Build: each workspace compiles via `tsc -p .` into its own `dist/`; tests are `*.test.ts` colocated with source, run via `node:test` against compiled `dist/`. No transpilation shortcut, no bundler.

Detailed domain notes and known traps live in `docs/GOTCHAS.md`; product roadmap and phase state live in `docs/ROADMAP.md` and `MENTOR_BRIEF.md` §2.

## Hard Rules

**R1 — Cross-platform from day one.** All paths via `path.join` and `app.getPath(...)`. No hardcoded `D:\`, `/Users/`, or `%APPDATA%`. UI and behavior must work on Windows, macOS, Linux.

**R2 — No new runtime dependencies without justification in the PR description.** The DNA is "minimal stack". Dev-time tools (test runners, linters, formatters) are fine.

**R3 — Pure-logic functions are unit-tested.** A function is "pure logic" if it has no Electron, IPC, filesystem, or DOM dependency. Tests live in `test/<module>.test.js` and run via `node --test`. The pre-commit hook runs them.

**R4 — No silent `catch`.** Every `catch` block either logs the error with context or rethrows. Returning `null`/`undefined` on failure is allowed only when the caller documents and handles that contract.

**R5 — File size budget: source file ≤ 400 lines.** When exceeded, split by responsibility. Files currently over budget are listed in `E2` — split during a `refactor:` PR, not while doing feature work. Test files are measured differently, per `E6`.

**R6 — Function size budget: ≤ 50 lines.** Exception: top-level orchestration handlers (e.g. `ipcMain.handle` callbacks) may exceed when they are mostly sequential calls to other functions.

**R7 — Named constants for policy values.** Timeouts, sizes, format identifiers, version numbers: declare at module top with `SCREAMING_SNAKE_CASE`. One-off literals are fine inline.

**R8 — Comments answer "why", not "what".** No comments restating what code does. Allowed: invariants, hidden constraints, workarounds for specific bugs (with reference). One short line is the default; no multi-paragraph docstrings.

**R9 — Language convention: agent-consumed surface is English-only; human-edited interfaces in `harness/` may be pt-BR; user-facing UI is bilingual EN + pt-BR.**

The dev surface splits by *audience*, not by directory.

- *Agent-consumed surface* (English-only): code identifiers, comments, file/folder names, commit messages, branch names, PR titles/descriptions, canonical documentation (`CLAUDE.md`, `docs/**`), task artifacts (`docs/tasks/**`), config keys, log/console messages. The root `README.md` was listed here until 2026-08-09 and is now exempt under `E7` — it is a product surface, not an agent-consumed one. Every other `README.md` is decided by the directory it sits in.
- *Human-edited interface* (pt-BR is acceptable): everything under `harness/` — the prompts in `harness/init/*.md`, the workflow files in `harness/workflows/`, their `README.md`, and the `--- COPIAR ---` blocks themselves. Rationale: the user reads, copies, and customizes these directly, and every block lands in a session where M-R10 already mandates pt-BR — so pt-BR reduces friction without affecting agent quality. This bullet was corrected on 2026-08-04 (brief 049, D4): it previously claimed the COPIAR blocks were English, while every one on disk was pt-BR, including the `setup-orchestrator.md` block the owner pastes to open an Orchestrator session.
- *UI surface* (EN + pt-BR): visible labels, button text, placeholders, tooltips, error toasts, empty states, menu items. Stored in an i18n layer keyed by string ID, with both locales defined. **Never inline a pt-BR-only literal in new HTML/JSX/template code** — route through the i18n layer (or add a `TODO(i18n)` if the layer is not yet in place).
- Default locale is auto-detected from the OS (`app.getLocale()` in main, `navigator.language` in renderer); the user may override in settings.
- Existing pt-BR content in source files (`main.js`, `psd-worker.js`, `renderer/app.js`) predates this rule and is tracked as `E3` for migration.

**R10 — Commit messages follow Conventional Commits.** Allowed types: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `perf`, `ci`. Subject ≤ 72 chars, imperative mood. Body explains *why*. No co-author trailers.

**R11 — Branches follow `<type>/<short-description>`** using the same type set as commits. Examples: `feat/psd-diagnostics`, `fix/cache-mtime-invalidation`, `refactor/main-into-modules`.

**R12 — `main` is integrated only through pull requests.** No direct push to `main`. The PR template (`.github/pull_request_template.md`) is mandatory and must be filled.

**R13 — Never bypass the pre-commit hook (`--no-verify`).** If the hook is wrong, fix the hook in a separate `chore:` commit.

**R14 — `refactor:` means no behavior change.** A refactor PR must produce identical user-visible output for the same input. If you find a bug while refactoring, fix it in a separate `fix:` PR.

**R15 — Plan before code.** For any change touching ≥ 2 files or ≥ 50 lines, the agent presents a numbered plan and waits for approval before editing.

**R16 — Pause-3 before every commit.** The agent shows `git status`, `git diff --stat`, and the proposed message, then waits for explicit approval.

**R17 — Never `git push` without explicit instruction.** Push is the user's call, every time.

**R18 — Persistent application state goes through the `storage/` module.** Code that reads or writes user state (config, thumbnail cache, future catalog/annotations) routes through `storage.<method>(...)`, never via direct `fs.*` for those concerns. The module exposes a single public interface; concrete backends (file, SQLite, HTTP) live behind it. New persistence concerns add a method to `storage/`, never bypass it. Rationale: the project will evolve into a hybrid client (local + central catalog) within ~6 months — routing all persistence through one seam keeps callers stable when backends change.

**R19 — Extension points dispatch via registries (Map-backed).** When the codebase needs dispatch by key — file extension → handler, view id → view module, action id → action module — the dispatch is a registry that consumers query (`registry.get(key)`) and producers self-register into (`registry.register(key, handler)`). Consumer code does not enumerate producers. Three categories qualify under the "third use" criterion (A3): file format handlers (4 cases — PSD/PSB, AI, INDD, raster), renderer view router (3 cases — browser, file detail, settings), file action menu (3+ cases — open, reveal, etc.). Other extension surfaces (e.g. external integrations) are deferred until a real second case appears.

**R20 — TypeScript strict mode (project-wide).** Every `tsconfig.json` in the v2 monorepo extends a base config with `"strict": true`. The directives `// @ts-ignore` and `// @ts-expect-error` are forbidden without a one-line comment explaining the reason and a TODO with date.

**R21 — ESM only; `.js` extension in imports.** All packages declare `"type": "module"` in `package.json`. Imports reference the compiled output name (e.g. `import { foo } from "./bar.js"` even when the source is `bar.ts`). This is a Node ESM requirement, not a stylistic choice.

**R22 — No bundler; `tsc` per package.** Each workspace compiles via `tsc -p .` into its own `dist/`. No esbuild, rollup, webpack, or similar. Bundling is a Phase 3+ packaging concern, not part of the core build chain.

**R23 — `node:test` for testing.** No jest, vitest, mocha, ava. Test files colocate with their source as `*.test.ts`. The exact runner integration (compile-and-test, `tsx` loader, or `--experimental-strip-types`) is fixed during Phase 1 bootstrap. Rationale: zero-dependency testing keeps the monorepo lean.

**R24 — No `any` type.** Use `unknown` for inputs requiring type narrowing. `any` is reserved for justified escape hatches and requires a one-line comment with the rationale.

**R25 — Hexagonal architecture: dependency direction.** The `core` package defines domain logic and port interfaces. Adapter packages (`adapter-jira`, `adapter-sheets`, future others) implement ports and depend on `core`. The `core` package never imports from adapters. The composition root (currently `cli`) wires adapters into `core`. Verification: `grep -rn 'from.*adapter' core/` returns no matches.

**R26 — Laboratory code is normalized on arrival, never carried raw.** Two
permanent laboratory lanes feed this repository: the Python `buraqueira` lane
and the Suindara art lane (see "Architecture"). Code leaves them one mechanism
at a time, as briefs, and whatever arrives is normalized in the same commit that
introduces it — never in a follow-up.

- **Language.** Identifiers, comments, log and error messages, and test
  descriptions are rewritten in English (R9). A laboratory's language convention
  does not travel with its code, and a half-translated file is worse than either
  end state: it teaches that the rule is optional.
- **Rule identifiers.** `R*`, `A*` and `E*` here mean what this file says they
  mean. A citation inherited from another repository's rulebook is a false
  citation however true it was at the origin — requalify it with the origin's
  name (`SUINDARA-R2`) or drop it and keep its reasoning in plain words.
- **Rationale.** Design reasoning carried in a laboratory's comments is
  preserved, not deleted to satisfy R8. Where it exceeds R8's one-short-line
  default it moves into the porting brief or the package's own doc, and the
  comment keeps a one-line pointer. R8 forbids restating *what* code does; it
  does not license discarding *why* — that reasoning is the most expensive thing
  a laboratory produces and the easiest to lose in transit.

Verification is per-brief, not global: a porting brief lists the units it moves
and each one's normalization is a Done-criteria checkbox.

Numbering note: `docs/sessions/2026-08-12-orchestrator-spike-art-chain.md`
queued `R26` for a different rule — composition functions being
transport-agnostic. That rule was measured on 2026-08-13 and is not yet true
(six `console` sites in `run-fetch.ts` and `run-start.ts`, all of them R4
compliance), so it was deferred and will take the next free number. That
citation is superseded.

## Anti-patterns

**A1 — Silent error swallowing.** `catch {}` or `catch (e) { return null }` without log. Violates R4.

**A2 — Scope creep in refactor.** Renaming variables, fixing unrelated bugs, or adding features inside a `refactor:` PR. Violates R14.

**A3 — Premature abstraction.** Extracting a "BaseSomethingManager" class for two callers. Three similar lines beats a wrong abstraction. Wait for the third use.

**A4 — Hardcoded paths or platform-specific separators.** `'D:\\Content\\...'`, `'~/Library/...'`. Always compose with `path.join` and OS-aware roots. Violates R1.

**A5 — Reaching across the security boundary.** The renderer must not gain Node access. New main↔renderer features go through `ipcMain.handle` in `main.js` and `contextBridge.exposeInMainWorld` in `preload.js`. Never widen `nodeIntegration` or disable `contextIsolation`.

**A6 — Mixing pt-BR and English on the development surface.** Code identifiers, comments, and docs are English-only (R9). UI translation files (which carry both locales by design) are exempt — they are the i18n layer, not "mixed code".

**A7 — Bumping `CACHE_VERSION` for non-format reasons.** That constant invalidates every user's thumbnail cache. Bump only when the on-disk format or dimensions actually change.

**A8 — Module-level mutable globals in new code.** Tolerated in `renderer/app.js` as legacy (`E1`). Not introduced anywhere new — pass state explicitly or wrap in a module/closure.

## Documented Exceptions

**Note on v1 freeze:** all exceptions below apply to the Electron-v1 codebase, currently in freeze (`MENTOR_BRIEF.md` §2). No new work resolves them; they remain documented for historical context and any critical-bug-only v1 maintenance. New v2 exceptions take fresh numbering. `E6` and `E7` were claimed on 2026-08-09 and are the first in this list that are not about the v1 freeze — they are live, not legacy debt.

**Numbers not in this list, reconciled 2026-08-09.** `E4` was "persistent state not yet routed through `storage/` (R18)", defined in briefs 000 and 002 and burned in the v1→v2 pivot. `E9` kept the three-digit task identifier valid for pre-cutover briefs still in flight; it closed on 2026-08-07 when task 049 was aborted (`357cc43`). Burned and closed numbers are never reused, so **the next free number is `E8`**.

`E4` and `E8` were also being cited in `docs/PROCESS_MAP.md` §7 — for the aborted-task folder and for recap naming — against entries that never existed here. Both citations were removed rather than turned into entries: neither is an exception. "An aborted task's folder is never deleted" is a rule, stated in full where it belongs, and giving it an `En` would inflate this namespace to justify a parenthesis. **A bare `(En)` anywhere with no entry in this list is a bug.**

**E1 — Renderer state in module globals (`renderer/app.js`).** The current renderer keeps state in module-level variables (`allGroups`, `activeGroupName`, `searchQuery`, `rootPath`). Tolerated until `refactor/renderer-into-modules`. New renderer code must not add to this pattern.

**E2 — `main.js` and `renderer/app.js` exceed R5 (400 lines).** Current sizes: `main.js` ≈ 456, `renderer/app.js` ≈ 329. Known debt, scheduled for `refactor/main-into-modules` and `refactor/renderer-into-modules`. Feature work is not blocked, but new code must not enlarge these files — extract into new modules instead.

**E3 — Existing pt-BR content predating R9.** Two legacy concerns, two separate migrations:

- **E3a — pt-BR comments and identifiers in source files** (`main.js`, `psd-worker.js`, `renderer/app.js`, etc.). Migration: `refactor/dev-surface-to-en` — translates comments, renames any pt-BR identifiers. Pure dev-surface refactor, no behavior change (R14).
- **E3b — pt-BR-only UI strings** in `renderer/index.html` and string literals in `renderer/app.js`. Migration: `feat/i18n-bilingual-ui` — introduces the i18n layer, extracts current pt-BR strings as the `pt-BR` locale, adds `en` translations.

Do not translate piecemeal during unrelated PRs.

**E5 — Dispatch tables in v1 codebase violate R19.** Format dispatch is hardcoded in `main.js`; the renderer is monolithic in `renderer/app.js`; file actions are ad-hoc. Originally scheduled migrations (`refactor/format-registry`, `refactor/renderer-views`, `refactor/action-registry` — slots 004-006) burned in v1→v2 pivot (`MENTOR_BRIEF.md` §2, recorded 2026-05-15). No new work against these violations during v1 freeze.

**E6 — Test files are measured against a subject, not against R5's 400-line budget.** A test file that maps 1:1 to a subject module (`x.test.ts` beside `x.ts`) may exceed 400 lines. Two further conditions hold: the 1:1 mapping is the *precondition* — an over-budget test with no subject module is denied, because there "split by responsibility" does have a valid axis — and a ceiling of **800 lines** still applies, escalating to the owner with a finding that points at the subject rather than the test.

Rationale, recorded because this exception inverts the rule's own remedy: R5 says "when exceeded, split by responsibility". For a test file already scoped to one subject that instruction has no valid move — the responsibility *is* "test this module", and splitting by line count fragments the spec across files, so reading what a function guarantees would mean opening three of them. A check whose finding has no available remedy is worse than no check: it trains you to ignore checks.

Measured on 2026-08-09 before adopting this: no implementation file in `packages/` came near the budget (largest 363 of 400), while two test files had drifted past it unnoticed — the limit works where it was designed to work and fails where it was extrapolated. All 27 test files map 1:1 today. Enforced by `.claude/hooks/lib/architecture.mjs`; the ceiling is `TEST_CEILING`.

**E7 — The root `README.md` is pt-BR, and stays pt-BR.** R9 listed it as an English-only agent-consumed surface; it is not one. It is the product's front door, read by the Estratégia design team, and the team is Brazilian. An English README would serve the agents at the cost of the only humans who open it.

Scope is exactly one file. Every other `README.md` is decided by the directory it sits in: `docs/explorations/README.md` is doctrine and stays English, `harness/**/README.md` is already pt-BR-tolerant under R9. The exception is a file, not a filename.

This was a standing violation, not a new allowance — the R9 language check surfaced it on its first run (2026-08-09, 13 lines) after being invisible since R9 was written. `E3` covers legacy pt-BR in `main.js`, `psd-worker.js` and `renderer/`, and never covered the README. Migration path, if the product ever leaves the Estratégia team: bilingual, per R9's UI-surface rule — not a translation. Enforced by the `ENGLISH_ONLY` list in `.claude/hooks/lib/docs-checks.mjs`.

## Related Documents

- `docs/PROCESS_MAP.md` — entry point to *how work happens here*: reading order, the roles, the gates, artifact naming, rule-ID namespaces, authority hierarchy. Read it after this file, before acting
- `docs/MENTOR_BRIEF.md` — the Mentor lane, its own Claude Code main session: who the owner is and how the conceptual surface behaves (M-R*)
- `docs/GIT_WORKFLOW.md` — branching, PRs, hooks, release tags
- `docs/GOTCHAS.md` — known traps: worker pool timeouts, PSD binary parser, cache versioning, cross-platform pitfalls
- `docs/AGENT_PLAYBOOK.md` — the Orchestrator role and the role-based pipeline (Orchestrator → planner → executor), plus the `@test`/`@code` pair for work that carries tests
- `docs/ROADMAP.md` — product roadmap (phases, milestones; parked ideas and open decisions live as notes in `docs/explorations/`); ages in sync with `MENTOR_BRIEF.md` §2
- `docs/tasks/<task-id>-<slug>/` — per-task artifacts: `brief.md`, optional `plan.md`, optional `notes.md`. Created when a task starts; preserved after merge as the historical record
- `harness/` — workflow prompts (`setup-code.md`, `pause-task.md`, etc.) for new sessions; parallel manual surface to `.claude/agents/`
- `.claude/agents/` — orchestration subagents: `planner.md`, `executor.md`, and the `test.md`/`code.md` pair; invoked by the main session acting as Orchestrator (`docs/AGENT_PLAYBOOK.md` Chapter 6). `brief-validator.md` and `closer.md` are retired tombstones — do not invoke them
- `.claude/skills/brief-template/` — authoring template for `docs/tasks/<task-id>-<slug>/brief.md`; preloaded by planner
- `.claude/hooks/` — the executable checks. They run in the harness, not the model, so they fire on every commit and every write whether or not anyone remembers them: commit message, architecture rules, test/code file ownership, the green boundary, and `validate-brief.mjs` for C1–C11
- `.claude/hooks/gate-yield.mjs` — the reader over the gate telemetry stream. Aggregates the append-only `.claude/telemetry/gates.jsonl` into yield per hook, per check and per verdict; the stream is gitignored and local to the worktree that produced it
- `.claude/skills/mentor-mode/` — session mechanics for the Mentor lane; invoked at the open of a Mentor session
- `README.md` — user-facing project description
