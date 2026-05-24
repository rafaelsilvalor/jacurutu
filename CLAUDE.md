# CLAUDE.md

> **For AI agents coding in this project:** read this file in full before any code change.
> Rules (R) are mandatory. Anti-patterns (A) are forbidden. Exceptions (E) are the only tolerated violations.
> When you discover a new rule, add it here. When a rule becomes unworkable, add an exception rather than removing — preserves history.

## Architecture

Saci is a single-author Electron desktop app for the Estratégia design team — browses brand/category folders, previews PSD/PSB/AI/INDD/raster files, and opens them in the user's default tool. Target platforms: **Windows + macOS + Linux**.

Three-process split (standard Electron):

- **Main process** (`main.js`) — IPC handlers, folder scan, worker pool orchestration, thumbnail cache.
- **Preload** (`preload.js`) — narrow `window.api` surface via `contextBridge`. Renderer has no Node access.
- **Worker thread** (`psd-worker.js`) — runs `ag-psd` + `jimp` in parallel to keep the UI responsive.
- **Renderer** (`renderer/`) — vanilla HTML/CSS/JS. **No framework, no bundler.** Thumbnails load lazily via `IntersectionObserver`.

Persistent state lives in `app.getPath('userData')`:
- `config.json` — root folder picked on first run
- `thumb-cache/<sha1>.jpg` — derived, regenerable; key includes a `CACHE_VERSION` constant in `main.js`

Build: `electron-builder`. No transpilation step. Node 18+ required.

Detailed design notes (worker pool semantics, PSD binary parser, cache invalidation rules) live in `docs/GOTCHAS.md`.

## Hard Rules

**R1 — Cross-platform from day one.** All paths via `path.join` and `app.getPath(...)`. No hardcoded `D:\`, `/Users/`, or `%APPDATA%`. UI and behavior must work on Windows, macOS, Linux.

**R2 — No new runtime dependencies without justification in the PR description.** The DNA is "minimal stack". Dev-time tools (test runners, linters, formatters) are fine.

**R3 — Pure-logic functions are unit-tested.** A function is "pure logic" if it has no Electron, IPC, filesystem, or DOM dependency. Tests live in `test/<module>.test.js` and run via `node --test`. The pre-commit hook runs them.

**R4 — No silent `catch`.** Every `catch` block either logs the error with context or rethrows. Returning `null`/`undefined` on failure is allowed only when the caller documents and handles that contract.

**R5 — File size budget: source file ≤ 400 lines.** When exceeded, split by responsibility. Files currently over budget are listed in `E2` — split during a `refactor:` PR, not while doing feature work.

**R6 — Function size budget: ≤ 50 lines.** Exception: top-level orchestration handlers (e.g. `ipcMain.handle` callbacks) may exceed when they are mostly sequential calls to other functions.

**R7 — Named constants for policy values.** Timeouts, sizes, format identifiers, version numbers: declare at module top with `SCREAMING_SNAKE_CASE`. One-off literals are fine inline.

**R8 — Comments answer "why", not "what".** No comments restating what code does. Allowed: invariants, hidden constraints, workarounds for specific bugs (with reference). One short line is the default; no multi-paragraph docstrings.

**R9 — Language convention: agent-consumed surface is English-only; human-edited interfaces in `harness/` may be pt-BR; user-facing UI is bilingual EN + pt-BR.**

The dev surface splits by *audience*, not by directory.

- *Agent-consumed surface* (English-only): code identifiers, comments, file/folder names, commit messages, branch names, PR titles/descriptions, canonical documentation (`CLAUDE.md`, `README.md`, `docs/**`), task artifacts (`docs/tasks/**`), config keys, log/console messages. Includes any block inside `harness/` that produces canonical output — e.g. the `--- COPIAR ---` blocks inside `harness/workflows/*.md` are pasted into the agent as English instructions, so those blocks are English even though the surrounding usage notes are pt-BR.
- *Human-edited interface* (pt-BR is acceptable): the prompts in `harness/init/*.md`, `harness/setup-chat.md`, `harness/workflows/README.md`, and the prose around `--- COPIAR ---` blocks in `harness/workflows/`. Rationale: the user reads, copies, and customizes these directly; pt-BR reduces friction for the user without affecting agent quality, because these files are typically pasted into chat (where M-R10 already mandates pt-BR).
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

**Note on v1 freeze:** all exceptions below apply to the Electron-v1 codebase, currently in freeze (`MENTOR_BRIEF.md` §2). No new work resolves them; they remain documented for historical context and any critical-bug-only v1 maintenance. New v2 exceptions, if needed, take fresh numbering starting at E6.

**E1 — Renderer state in module globals (`renderer/app.js`).** The current renderer keeps state in module-level variables (`allGroups`, `activeGroupName`, `searchQuery`, `rootPath`). Tolerated until `refactor/renderer-into-modules`. New renderer code must not add to this pattern.

**E2 — `main.js` and `renderer/app.js` exceed R5 (400 lines).** Current sizes: `main.js` ≈ 456, `renderer/app.js` ≈ 329. Known debt, scheduled for `refactor/main-into-modules` and `refactor/renderer-into-modules`. Feature work is not blocked, but new code must not enlarge these files — extract into new modules instead.

**E3 — Existing pt-BR content predating R9.** Two legacy concerns, two separate migrations:

- **E3a — pt-BR comments and identifiers in source files** (`main.js`, `psd-worker.js`, `renderer/app.js`, etc.). Migration: `refactor/dev-surface-to-en` — translates comments, renames any pt-BR identifiers. Pure dev-surface refactor, no behavior change (R14).
- **E3b — pt-BR-only UI strings** in `renderer/index.html` and string literals in `renderer/app.js`. Migration: `feat/i18n-bilingual-ui` — introduces the i18n layer, extracts current pt-BR strings as the `pt-BR` locale, adds `en` translations.

Do not translate piecemeal during unrelated PRs.

**E5 — Dispatch tables in v1 codebase violate R19.** Format dispatch is hardcoded in `main.js`; the renderer is monolithic in `renderer/app.js`; file actions are ad-hoc. Originally scheduled migrations (`refactor/format-registry`, `refactor/renderer-views`, `refactor/action-registry` — slots 004-006) burned in v1→v2 pivot (`MENTOR_BRIEF.md` §2, recorded 2026-05-15). No new work against these violations during v1 freeze.

## Related Documents

- `docs/MENTOR_BRIEF.md` — how the AI agent acts as senior mentor for a junior solo dev
- `docs/GIT_WORKFLOW.md` — branching, PRs, hooks, release tags
- `docs/GOTCHAS.md` — known traps: worker pool timeouts, PSD binary parser, cache versioning, cross-platform pitfalls
- `docs/AGENT_PLAYBOOK.md` — orchestration between Claude Chat / Code / Cowork
- `docs/ROADMAP.md` — product roadmap (phases, milestones, parking lot, pending decisions); ages in sync with `MENTOR_BRIEF.md` §2
- `docs/tasks/<NNN>-<slug>/` — per-task artifacts: `brief.md`, optional `plan.md`, optional `notes.md`. Created when a task starts; preserved after merge as the historical record
- `harness/` — workflow prompts (`setup-code.md`, `pause-task.md`, etc.) for new sessions; parallel manual surface to `.claude/agents/`
- `.claude/agents/` — orchestration subagents: `planner.md`, `brief-validator.md`, `executor.md`; invoked by the Claude Code main session (`docs/AGENT_PLAYBOOK.md` Chapter 6)
- `.claude/skills/brief-template/` — authoring template for `docs/tasks/<NNN>-<slug>/brief.md`; preloaded by planner and brief-validator
- `.claude/skills/pre-commit-self-audit/` — five mechanical checks run by the executor before every Pause 3
- `README.md` — user-facing project description
