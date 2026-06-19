# Brief: 025 — Docs hygiene (v2 Architecture + §2 active focus reconciliation)

> **Category:** M
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/hygiene-reconciliation`
>
> Caminho B: this brief is pre-saved to disk by the user. The executor verifies
> it is present, runs the P4 slot check, commits it as commit #1, then applies
> the edits. Pasteable executor prompt:
> `Task: docs/tasks/025-docs-hygiene-reconciliation/brief.md. Read it in full and execute.`

---

## Context

Briefs 023 (code) and 024 (docs) closed the state-ownership pivot — **the
application owns production state; a spreadsheet is one optional one-way
projection target, not a state surface** — and reconciled `docs/ROADMAP.md` and
`docs/MENTOR_BRIEF.md` §2 to it. Two canonical-doc staleness items were
deliberately left out of 024's scope and are now the last grounding hazards for
the next code task:

1. `CLAUDE.md` `## Architecture` is still **v1-era**: it describes Saci as an
   Electron desktop app (`main.js`, `preload.js`, `psd-worker.js`, `ag-psd`,
   `jimp`, renderer, thumbnail cache), not the v2 TypeScript hexagonal monorepo.
   `CLAUDE.md` is read in full by any code agent before it edits; the next task
   (argv dispatch in `@saci/cli`) is the first code task to ground against this
   section, which is now actively false.
2. `docs/MENTOR_BRIEF.md` §2 "Active focus (Phase 1 — monorepo bootstrap)" line
   is stale — Phase 1 and Phase 2 are done, brief 023 shipped the export
   pipeline, and we are in Phase 3. 024 left this line on purpose: at that point
   what the active focus *was* depended on the very thread decision being
   deferred. That decision is now made (argv dispatch first), so the line is
   refreshable.

This PR reconciles both. The Hard Rules / Anti-patterns / Documented Exceptions
in `CLAUDE.md` (R1–R25 etc.) are **already v2-correct** and are not touched —
only the prose `## Architecture` section is stale.

This does **not** trigger the ROADMAP / §2 update-pairing protocol: there is no
identity shift and no phase rescope here, only a stale-line refresh. ROADMAP
(reconciled in 024) already describes Phase 3 with the `[prod]` CLI-display and
state/history items; the new §2 active-focus line is consistent with it and the
executor confirms that consistency at Pause 2.

## Goal

1. Replace the `CLAUDE.md` `## Architecture` section with a v2 description
   (TS monorepo, hexagonal, CLI-first, app-owns-state, the four packages).
2. Refresh the `docs/MENTOR_BRIEF.md` §2 "Active focus" line to Phase 3, and
   bump the §2 freshness date stamp.

## Out of scope (STOP and surface if any of these is touched)

- Any file other than `docs/tasks/025-docs-hygiene-reconciliation/brief.md`,
  `CLAUDE.md`, and `docs/MENTOR_BRIEF.md`.
- `README.md` — separately stale (still describes the v1 Electron app) but its
  audience is end users, and v1 Electron is the only currently runnable
  user-facing product. Its rewrite is a follow-up to the argv-dispatch task,
  not this PR.
- Root `package.json` — separately stale (v1 Electron runtime deps). Backlog,
  not this PR.
- `docs/ROADMAP.md` — not touched (no identity shift / phase rescope).
- Any `CLAUDE.md` content other than the `## Architecture` section. R1–R25, the
  Anti-patterns section, the Documented Exceptions section, and Related
  Documents must be byte-identical to before.
- Any per-decision dated history stamp in §2 (e.g. `recorded 2026-05-15`,
  `recorded 2026-06-12`). These are protected history (024 lesson) — do **not**
  rewrite them. Only the §2 *freshness* marker is bumped (Edit 3b).
- Any code, test, or `automation/**` file.

## Constraints

1. Only these paths may be created or modified:
   - `docs/tasks/025-docs-hygiene-reconciliation/brief.md` (this brief; commit #1)
   - `CLAUDE.md`
   - `docs/MENTOR_BRIEF.md`
   Any write outside these → **STOP and surface**.
2. English only (R9 / M-R10): both target files are agent-consumed canonical docs.
3. Conventional Commits (R10). Subject verbs MUST be on the allowlist SSOT
   (`.claude/skills/pre-commit-self-audit/SKILL.md`). Caminho-B verb pre-flight
   (done at authoring, since the brief-validator C11 does not run on caminho B):
   the three commit subjects below use `add`, `update`, `update` — all on the
   allowlist. No `record` / `demote` / other off-allowlist verbs appear.
4. No `Co-authored-by` trailer (`GIT_WORKFLOW.md` G-R3).
5. Pre-commit hook is not bypassed with `--no-verify` (R13).
6. **Find-block discipline:** locate each target by its anchor and compare to the
   quoted block. If the on-disk text differs materially from what is quoted here,
   **STOP and surface** — do not regenerate the replacement from memory, and do
   not force a near-match. (The quoted blocks were authored from project-knowledge
   snapshots, not the live file.)

## Plan required justification

`Plan required: no` because all inserted/replacement text is specified inline;
edits are section-boundary replacements / single-line replacements with explicit
STOP-if-mismatch guards; the architectural content was decided in chat
(2026-06-19 mentor session) and there is no design choice left for the executor.

**Pause 1 is skipped. Pause 2 (after `CLAUDE.md` is edited, before touching
`docs/MENTOR_BRIEF.md`) and Pause 3 (before every commit) remain required.**

---

## Edit 1 — Verify this brief on disk; P4 slot check; commit as commit #1

This brief is already saved at `docs/tasks/025-docs-hygiene-reconciliation/brief.md`
(caminho B). Do **not** regenerate it from the chat. Verify it is present and
matches the title above.

**P4 slot verification (three sources). STOP if `025` is already taken:**

- `ls docs/tasks/` — the highest existing slot should be `024`
  (`024-pivot-state-ownership-docs`); no `025-*` directory other than this one.
- `git log --oneline main` — most recent merged work should be 024
  (PR #58 `42fd2ee`, PR #59 `fd71a35`); no merged-but-invisible brief at a
  higher slot.
- `CLAUDE.md` `E*` block — exceptions stop at `E5`; no nominal slot reservation.
  The 025 candidate is an informal forward reserve, not nominal.

- [ ] Directory `docs/tasks/025-docs-hygiene-reconciliation/` exists
- [ ] `docs/tasks/025-docs-hygiene-reconciliation/brief.md` exists; first line
      matches the title above
- [ ] If `ls docs/tasks/` or `git log` shows `025` already taken → **STOP**

Commit the brief as commit #1: `docs(tasks): add brief 025 docs-hygiene reconciliation`.

---

## Edit 2 — `CLAUDE.md`: replace the `## Architecture` section

One commit. Locate the `## Architecture` section: it begins at the `## Architecture`
heading and ends immediately before the `## Hard Rules` heading. Replace the
**entire** range (heading included, up to but not including `## Hard Rules`) with
the new block below.

STOP if the section boundaries are not found, or if the current text differs
materially from this quoted block:

```markdown
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
```

Replacement block:

```markdown
## Architecture

Saci v2 is a TypeScript monorepo (npm workspaces, Node ≥22, ESM-only with `.js` import extensions, `tsc` per package, no bundler) following Hexagonal (Ports & Adapters) architecture. It is **CLI-first**; the desktop UI is a later phase that reconnects on top of the CLI. The product is an individual production assistant for the Estratégia design team — pull a Jira task, scaffold its folder, apply the right template, ship the result to Drive — with a secondary team-level coordination view layered on top.

**The application owns production state** (local now, remote later). A spreadsheet is not a state-holding surface; it is one optional one-way projection target among others (flat files, BI platforms). Export is a **fact table**: one row per issue, zero aggregation — aggregation and history belong to the BI layer and to Phase 3 state.

Packages:

- **`@saci/core`** — pure domain logic and port interfaces. No I/O, clock, `fs`, or network. Holds the payload contract (`payload.ts`), the transform/policy domain (`transform.ts`, `policy.ts`), the three ports (`gateways.ts` — `JiraGateway`, `SheetGateway`, `DriveGateway`), and the export projection (`export.ts`). Never imports an adapter (R25).
- **`@saci/adapter-jira`** — implements `JiraGateway` against the Jira REST API directly (`POST /rest/api/3/search/jql`, `nextPageToken` / `isLast` cursor pagination, Basic auth, raw global `fetch`). Depends on `core`.
- **`@saci/adapter-sheets`** — parking lot. A package shell exists, but a Sheets projection is built only when a concrete consumer (e.g. Looker Studio) exists. Not on the active path.
- **`@saci/cli`** — the composition root and the only package with a `bin` (`saci`). Wires adapters into `core`. Composition functions live in `run-fetch.ts` / `run-export.ts`; `cli.ts` is the entry point.

The Python `automation/` codebase is the **seed reference** of v2's core (its `lib_transform.py` was ported into `core` in Phase 2). It carries no behavior-preserving mandate — there are no production users — and `sync.py` / `lib_sheets.py` are legacy reference only; the sync diff engine is never ported.

Build: each workspace compiles via `tsc -p .` into its own `dist/`; tests are `*.test.ts` colocated with source, run via `node:test` against compiled `dist/`. No transpilation shortcut, no bundler.

Detailed domain notes and known traps live in `docs/GOTCHAS.md`; product roadmap and phase state live in `docs/ROADMAP.md` and `MENTOR_BRIEF.md` §2.
```

### Verification

- [ ] The `## Architecture` section is the new v2 block above
- [ ] `## Hard Rules` and everything after it (R1–R25, Anti-patterns, Documented
      Exceptions, Related Documents) is byte-identical to before
- [ ] No rule, anti-pattern, or exception was modified, moved, or renumbered
- [ ] `grep -n 'Electron' CLAUDE.md` returns matches only inside Documented
      Exceptions / Related Documents context that legitimately reference v1 — not
      in the Architecture section (the Architecture section no longer calls Saci
      an Electron app)

**Pause 2 fires here** — after `CLAUDE.md` is edited and committed, before
touching `docs/MENTOR_BRIEF.md`. Confirm at Pause 2 that the new §2 active-focus
wording (Edit 3a) is consistent with `docs/ROADMAP.md` Phase 3 (CLI-display and
state/history `[prod]` items present).

Commit: `docs(claude): update architecture section for v2 monorepo`.

---

## Edit 3 — `docs/MENTOR_BRIEF.md` §2: active focus + freshness stamp

One commit. Two sub-edits.

### 3a — Replace the "Active focus" line

Locate the "Active focus" bullet in §2. STOP if it differs materially from:

```markdown
- **Active focus (Phase 1 — monorepo bootstrap):**
  1. TS monorepo stand-up: package layout, `tsconfig.json`s, build chain, `node:test`, `--version` working on `cli`.
  2. **No domain logic in Phase 1** — strict scope to prevent creep. Domain work lands in Phase 2.
  3. Doc refreshes (MENTOR_BRIEF §2, ROADMAP) ahead of code work.
```

Replace with:

```markdown
- **Active focus (Phase 3 — production state and CLI surface):**
  1. Wire `runFetch` + `runExport` into argv dispatch in `@saci/cli` (`cli.ts`) — the manual on-ramp that turns the shipped, test-only composition functions into real `saci fetch` / `saci export` commands.
  2. Phase 3 state design — the app owns production state over time (local now); the `derivePath` hierarchy rule is the open design question.
  3. No remote/shared state yet — that is Phase 4.
```

### 3b — Bump the §2 freshness date stamp

Locate the §2 *freshness* marker (the stamp that says when §2 itself was last
refreshed; it currently reads `2026-05-28`). This is distinct from the
per-decision `recorded YYYY-MM-DD` history stamps, which must NOT be touched.

Update the `2026-05-28` freshness value to the date this PR is authored.

**STOP and surface at Pause 2 if:** the freshness marker is absent, appears in a
form materially different from a single `2026-05-28` stamp, or matches more than
one location (ambiguous target). This sub-edit was authored without the exact
on-disk string visible; confirm the literal before editing.

### Verification

- [ ] §2 "Active focus" line is the new Phase 3 block
- [ ] §2 freshness stamp reads the PR-authoring date (or 3b was surfaced as a
      STOP and resolved with the user)
- [ ] All per-decision `recorded YYYY-MM-DD` stamps in §2 are byte-identical to
      before
- [ ] §1, §3, §4, §5, §6, §7 are byte-identical to before
- [ ] The dated 2026-06-12 pivot bullet and its sub-bullets (from 024) are
      byte-identical to before

Commit: `docs(mentor-brief): update active focus and freshness stamp`.

---

## Open mentor judgment calls (confirm during execution)

1. **Edit 3b literal.** The freshness-stamp target was authored without the exact
   on-disk string. If the executor cannot locate a single unambiguous
   `2026-05-28` freshness marker, it STOPs at Pause 2 rather than guessing.
2. **`grep 'Electron'` expectation (Edit 2 verification).** If `Electron` still
   appears in the Documented Exceptions block (E3/E5 legitimately reference the
   v1 Electron codebase), that is expected and not a failure — the check is only
   that the *Architecture* section no longer calls Saci an Electron app.
