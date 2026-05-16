# Saci — Product Roadmap

> **Living document.** Pair with `MENTOR_BRIEF.md` §2 (active architectural decisions) and `CLAUDE.md` (technical rules). Update after every milestone or pivot — when this file disagrees with MENTOR_BRIEF §2, the more recent one wins and the other must be reconciled in the same PR.

## Identity shifts

### 2026-05-10 — Asset browser → workflow orchestrator

Saci was born as an asset browser for the Estratégia design team — pick a root folder, preview PSDs, open in the default editor. The production-flow direction (Jira task → local folder generation → export → Drive upload → task close) reframed Saci as a **workflow orchestrator** in which the asset browser is one view.

The introduction of `task` as a first-class entity alongside `file` was the load-bearing change. This was a deliberate identity shift, not a feature expansion.

### 2026-05-15 — v1 (Electron-JS) → v2 (TS monorepo, hexagonal, CLI-first)

The product framing held; the technical foundation pivoted. **Saci-Electron-v1** (pure JS, asset-browser-centered) enters freeze — critical bugs only, no new features. **Saci v2** rebuilds as a TypeScript monorepo with npm workspaces and explicit Hexagonal (Ports & Adapters) architecture, starting CLI-first with the desktop UI reconnecting on top within ~3-4 months.

The Python `automation/` codebase (Jira → Google Sheets sync) — which already implemented hexagonal architecture intuitively — is the seed of v2's core. **Until v2's coordination adapters land (Phase 4), the Python automation continues to operate** as the live coordination pipeline.

Two operating modes are designed from day one:

- **Coordination mode** — Rafael runs a centralized pipeline (Jira → Sheets dashboard); team consumes the Sheet.
- **Production mode** — each designer runs locally, scoped to their own tasks, files, and identity.

The same core serves both modes; each mode has its own command set.

## Phases

Phases are ordered by dependency, not by date. Items are tagged `[coord]`, `[prod]`, or untagged (foundational, serves both modes). Estimates are set at each phase's start, not in a central table — that pattern proved hard to keep current under v1.

> **Notation:** `[coord]` = coordination mode (Rafael's centralized pipeline). `[prod]` = production mode (per-designer local). Untagged items are foundational and serve both.

### Phase 1 — Monorepo bootstrap *(in progress)*

**Goal:** the TS monorepo compiles, the `cli` package prints `--version`, `node:test` runs an empty suite green. Nothing else.

**Strict scope:** no domain logic, no adapters, no CLI commands beyond `--version`. Any additional work is a separate phase, even if it would be "easy to add" — this scope discipline is the whole point of Phase 1.

**Exit criterion:** `npm install` at repo root succeeds; `npm run build` succeeds across all workspaces; `node packages/cli/dist/cli.js --version` prints a version; `node --test` runs and passes a placeholder suite.

### Phase 2 — Domain port (foundational)

**Goal:** the Python `automation/lib_transform.py` is ported to TypeScript as the `core` package — pure domain functions, no I/O. Ports (interfaces) for the Jira and Sheets adapters are defined as TS interfaces, even though the adapters themselves come later. The schema-as-port-contract pattern from `payload.json` v2.0 maps to TS types.

**Strict scope:** `core` package only. No adapter implementations. No CLI commands using the domain yet.

**Exit criterion:** every pure-domain function in `lib_transform.py` has a TS equivalent in `core` with `node:test` coverage; `JiraGateway` and `SheetGateway` ports defined as TS interfaces; `payload.json` v2.0 represented as TS types.

### Phase 3 — Production workflow + designer packaging `[prod]`

**Goal:** designers run a CLI on their own machines that scaffolds task folders, applies templates, and standardizes archiving — eliminating Rafael as the manual bottleneck for production tasks.

**Items:**

- `[prod]` `ProductionFlow` / `Workspace` domain abstraction in `core`. Templates and archival standardization are domain concepts, not tooling details.
- `[prod]` `saci config` — per-machine identity (multi-tenant per machine, mono-user per instance). Day-1 requirement: 3+ designers running their own flows.
- `[prod]` CLI commands for scaffolding, template application, archiving.
- `[prod]` Designer-friendly packaging — Saci-desktop (Electron) returns as a host for the CLI on non-technical designers' machines.

**Exit criterion:** Rafael's designers can install Saci-desktop, run their daily production flow end-to-end, and Rafael does no manual scaffolding for that flow.

**Open items inside this phase** (resolve at phase start):

- Exact shape of the `ProductionFlow` / `Workspace` abstraction (likely surfaces during Phase 2 port).
- Packaging format and OS coverage (Windows first probably; Mac/Linux follow).

### Phase 4 — Coordination adapters `[coord]`

**Goal:** the coordination pipeline (Jira → Sheets dashboard) is operational in TS, retiring the Python `automation/`.

**Items:**

- `[coord]` `adapter-jira` — Jira REST direct (Cowork bridge reverted). JS equivalent of Python's `requests` chosen and committed.
- `[coord]` `adapter-sheets` — Google Sheets write/sync. JS equivalent of Python's `gspread` chosen and committed.
- `[coord]` CLI commands for the coordination pipeline (run sync, dry-run, diff, etc.).
- `[coord]` Composition root for coord mode in the `cli` package.

**Exit criterion:** Rafael's coordination flow runs entirely on TS Saci; Python `automation/` archived. Same Sheet output as before, ideally indistinguishable.

**Dependencies:** Phase 2 (ports defined). Could in principle run in parallel with Phase 3, but Rafael's bottleneck is production, so Phase 3 takes priority for solo-dev throughput.

### Phase 5 — Desktop UI on top of CLI

**Goal:** the desktop UI is reconnected as a thin layer over the CLI / core, supporting both modes. Coordination mode gets a desktop interface to operate the pipeline; production mode gets a richer surface than the bare CLI.

**Status:** sketch only. Reconnection happens **within ~3-4 months** of Phase 1 start — earlier if Phase 3 packaging requires it. Detailed scope drafted when Phase 4 closes.

### Phase 6+ — Open

Beyond the desktop reconnect, the next directions are open. See **Parking lot** for candidates that may promote.

## Parking lot

Ideas anchored but unscheduled. Each evaluates against the current phase's goal before promotion.

- **Multi-source adapters** — Figma (read), Drive (read/write), other input sources. Generalizing a `Source` interface beyond Jira.
- **Asset browser (v1 feature)** — preserved as a candidate view inside v2 if it earns its place; not migrated automatically.
- **PSD diagnostics, mass audit, favorites** (from v1 roadmap) — preserved in case the asset browser view is restored.
- **Plugin system** — dev-authored (Neovim-style), not end-user marketplace. Surfaces when a second concrete extension case appears.
- **Central catalog API** — when Estratégia central infrastructure exists and volume justifies it (tens of thousands of files).
- **Tags, comments, versioning** — depend on central catalog.
- **Direct Jira write-back** — currently parked; the coordination pipeline reads Jira but doesn't write. Evaluate after Phase 4 ships.
- **Source-of-truth split formalization for tasks** — concept carried from the 2026-05-10 product direction (Jira = task metadata; Saci = production state). Encoded in domain types as Phase 3 designs `ProductionFlow`.
- **Docs site (Astro Starlight)** — post-Phase-1 tooling task; enters as a workspace, same npm/TS ecosystem as v2 monorepo.

## Pending decisions

Open questions that will gate or shape upcoming phases.

1. **JS libraries for Jira REST and Google Sheets.** Equivalents to Python's `requests` and `gspread` not yet researched. Required before Phase 4 starts; not blocking Phases 1-3.
2. **Designer-friendly packaging format.** Installer? Portable? Per-OS variants? Deferred to Phase 3 planning.
3. **`ProductionFlow` / `Workspace` exact abstraction.** Likely surfaces during Phase 2 port; refined in Phase 3 design.
4. **Coordination of v1 ↔ v2 during overlap.** While v2's Phase 4 is unfinished, Python `automation/` runs coord mode. Decide: keep automation untouched, or accept small patches? Default: untouched.
5. **Estratégia central infrastructure** (carried from previous ROADMAP) — open item from MENTOR_BRIEF §2; tracked outside code.

## Legacy / superseded — Saci-Electron-v1 phases

The following phases were planned under the Electron-v1 codebase. With v1 entering freeze on 2026-05-15, they are **superseded** by the v2 phases above. Brief slot reservations 004-006 (`refactor/format-registry`, `refactor/renderer-views`, `refactor/action-registry`) were **burned** as part of the v2 pivot — those slot numbers will not be reused.

- ~~**Phase 1 — Storage layer foundation**~~ — superseded; in v2, persistence is per-adapter, not a single seam.
- ~~**Phase 2 — Registry foundations**~~ — superseded; v2 doesn't have the dispatch-table problem R19 was solving.
- ~~**Phase 3 — Command palette**~~ — superseded; revisit if the desktop UI requires it (v2 Phase 5).
- ~~**Phase 4 — Multi-source abstraction**~~ — superseded; the `Source` interface idea survives in the v2 Parking lot.
- ~~**Phase 5 — Production workflow**~~ — superseded by **v2 Phase 3** (promoted in priority).
- ~~**Phase 6 — Plugin maturation & central API**~~ — superseded; survives in v2 Parking lot.

Estimates and the M5.x milestone breakdown from the v1 plan are not migrated — v2 starts with new estimates, set at each phase's start.

## Update protocol

- This file ages alongside MENTOR_BRIEF §2; treat them as a pair.
- After each merged PR that closes a milestone or phase: update the relevant section's status line in the same PR.
- New ideas → **Parking lot** with a one-line rationale. Do not enrich parking-lot entries beyond a line until they are nominated for promotion.
- Resolved pending decisions → strike through with date and a one-line resolution (`~~Decision text~~ — *resolved 2026-XX-XX: <outcome>*`). Do not delete; they form the history.
- Identity-level shifts get a dated subsection in `## Identity shifts`; do not silently rewrite earlier ones.
- Phase-level shifts (a phase being superseded by another, like the v1 → v2 pivot) move the old phases to `## Legacy / superseded` with a one-line rationale per phase; do not delete them.

## References

- `CLAUDE.md` — technical rules (TS-specific rules pending; see MENTOR_BRIEF §2).
- `docs/MENTOR_BRIEF.md` §2 — active architectural decisions, refreshed in sync with this file.
- `docs/tasks/<NNN>-<slug>/` — per-task briefs; written when a task is about to start.
- `docs/GIT_WORKFLOW.md` — operational discipline.
- `README.md` — current functionality (v1 asset browser side).
