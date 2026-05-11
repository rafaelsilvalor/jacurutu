# Saci — Product Roadmap

> **Living document.** Pair with `MENTOR_BRIEF.md` §2 (active architectural decisions) and `CLAUDE.md` (technical rules). Update after every milestone or pivot — when this file disagrees with MENTOR_BRIEF §2, the more recent one wins and the other must be reconciled in the same PR.

## Identity shift

Saci was born as an asset browser for the Estratégia design team — pick a root folder, preview PSDs, open in the default editor. The production-flow direction (Jira task → local folder generation → export → Drive upload → task close) reframes Saci as a **workflow orchestrator** in which the asset browser is one view.

The introduction of `task` as a first-class entity alongside `file` is the load-bearing change. Most decisions in Phases 4 and 5 below trace back to it.

This is a deliberate identity shift, not a feature expansion. The roadmap reflects the new identity from Phase 2 onward.

## Phases

Phases are ordered by dependency, not by date. Each has an architectural goal; milestones inside ship value.

### Phase 1 — Storage layer foundation *(in progress)*

**Goal:** all persistence routes through `storage/` (R18 satisfied; E4 removed).
**Brief:** `002-storage-layer`.
**Exit criterion:** `main.js` no longer touches `fs.*` for config or thumb-cache; `CACHE_VERSION` preserved at 4; E4 removed from `CLAUDE.md`.

### Phase 2 — Registry foundations

**Goal:** the three R19 dispatch surfaces (file format, renderer view, file action) are registry-backed (E5 removed).
**Briefs:** `003-format-registry` (first per the exit notes of 002), then action registry, then renderer view router. Order may flex based on what unblocks Phase 3 fastest.
**Exit criterion:** R19 satisfied; new handlers self-register without consumer enumeration.

### Phase 3 — Command palette

**Goal:** every registered action becomes invokable via `/` in the search bar.
**Depends on:** Phase 2 (action registry specifically).
**Rationale:** with actions self-registering, the palette is "filter registered actions by typing". Built before the registry, it would hardcode a list that gets thrown away.

### Phase 4 — Multi-source abstraction

**Goal:** `root folder` becomes a special case of `source`. Local folders, Jira (read), Drive (read/write), Figma (read) all implement a `Source` interface (`scan`, `read`, `watch`, `write` where applicable).
**Depends on:** Phase 1 (storage schema), Phase 2 (source-specific actions self-register).
**Rationale:** validated by Phase 5 — Jira is a task source, Drive is an output destination, Figma is a file source. Generalizing here is cheaper than retrofitting after Phase 5 ships.

### Phase 5 — Production workflow

**Goal:** the freelancer onboarding pain is solved. Tasks flow Jira → Saci → local production → Drive → Jira close, with Saci as the orchestrator and Cowork as the Jira bridge until/unless a direct integration is justified.
**Depends on:** Phases 1–4.

Milestones, in order. Estimates assume current cadence (solo dev, agent-assisted, part-time-equivalent throughput).

#### M5.1 — Tasks: import + cards + "iniciar task" *(5–7 weeks)*

- New storage primitive: `storage.tasks` (JSON-backed initially; SQLite candidate once task volume justifies — see Phase 6).
- Importer for CSV/JSON with configurable column mapping. **Cowork export defines the canonical schema** (see Pending Decision 3).
- New `Tasks` view in the renderer (card layout). Becomes the default landing view for users in the production workflow; the asset browser remains accessible from each card.
- Per-card actions registered via the action registry: **start task** (generate local folder structure via template), **open folder**, **open Jira link**, **open copy**, **archive**.
- Template engine: per-product overrides on a base template, configurable via JSON in `userData`. The same engine powers folder generation and file naming.
- **External blockers:**
  - Naming convention defined and stable (Pending Decision 1).
  - Cowork export schema agreed (Pending Decision 3).

#### M5.2 — Export PSD via Photoshop scripting *(4–6 weeks)*

- New plugin: `plugin-export-psd`.
- JSX dispatched from main process to a running or invoked Photoshop instance.
- Action `export-as` registers for `.psd` / `.psb` extensions; offers JPG, PNG, WebP, with quality presets.
- **Trade-off:** full fidelity (smart objects, layer effects) requires Photoshop installed. Pure JS PSD parsing via `ag-psd` is a fallback for non-Photoshop machines and is honest about its limits. Photoshop scripting is the canonical path because every freelancer designer already has Photoshop.

#### M5.3 — Export Figma *(3–4 weeks)*

- New plugin: `plugin-export-figma`.
- Figma REST API call given a file or node ID. OAuth or PAT per user.
- Action `export-as` registers for Figma-sourced files.
- Tactically simpler than M5.2 — could swap order if Figma represents the majority of current tasks (see Pending Decision 5).

#### M5.4 — Drive upload *(4–5 weeks)*

- New plugin: `plugin-drive`.
- OAuth per user; each freelancer authenticates their own Drive for accountability. Tokens via Electron `safeStorage` / `keytar`.
- Action `upload-to-drive` on cards (whole task folder) and on individual files. Mirrors local folder structure on Drive.
- **Decision pending in scope:** duplicate handling on Drive (version-suffix, overwrite, or prompt). Default proposal: prompt on first occurrence per task, then remember the choice.

#### M5.5 — "Finalizar task" *(2–3 weeks)*

- Composite action that chains: export (M5.2 or M5.3) → upload (M5.4) → local task state → `done` → surface the generated Drive link for the user to paste or comment in Jira.
- Optional Jira write-back via Cowork (a Cowork automation triggered from a Saci-produced file). Direct Jira API write remains parked.
- Closes the round-trip Jira → Saci → Jira.

### Phase 6 — Plugin maturation & central API integration *(deferred)*

**Goal:** plugin loader formalized (manifest, capabilities, lifecycle); SQLite local catalog; central catalog API plugged in.
**Status:** parking lot.
**Notes:** scope solidifies once the Estratégia central-infrastructure question (MENTOR_BRIEF §2 open item) resolves. Until then, the storage seam (R18) keeps the project ready without committing to a specific shape.

## Parking lot

Ideas anchored but unscheduled. Each evaluates against the current phase's goal before promotion.

- **PSD diagnostics** (original README roadmap item) — Smart Object analysis, hidden layer audit, embedded media size, color mode checks. Likely a plugin.
- **Mass audit** — generate JSX optimization scripts for batch processing. Depends on diagnostics.
- **Favorites and per-designer shortcuts** — depends on action registry (Phase 2) plus a `preferences` storage primitive.
- **File watcher** (`chokidar`) — auto-refresh on filesystem changes. Quick win once Phase 2 lands; risk to manage is Photoshop's `.tmp` save files masquerading as changes.
- **Workspace session** — save and restore last folder, expanded groups, filters, scroll. Natural extension of `storage/`.
- **Tags + saved filters** — local-first tagging. New primitive `storage.tags`. Migrates to central API in Phase 6 without API change.
- **Comments / annotations on assets** — collaborative; viable only post Phase 6.
- **Versioning / file history** — viable only with central API or a git-backed local store.
- **Asset reference graph** ("this PSD was used in this banner") — requires DB layer maturity; Phase 6+.
- **Direct Jira integration (read + write)** — possibly never needed if Cowork bridge holds. Evaluate after M5.5 ships and the bridge's limits are concrete.
- **i18n migration** — finish E3 (existing pt-BR in source) and E3b (UI literals). Independent of product work but eventually mandatory for cross-platform release.

## Pending decisions

Decisions that gate one or more phases. Resolve as they become blocking; do not pre-resolve speculatively.

1. **Naming convention for production files.** Owner: Estratégia design team. Blocks M5.1 *production rollout*, not its *construction*. Construction can start with a placeholder template; rollout cannot.
2. **Jira custom field for "copy".** Owner: Estratégia. If never created, the Cowork bridge handles freeform parsing and the gap is invisible to Saci. Not a hard blocker; just a quality/reliability concern for the import schema.
3. **Cowork → Saci export schema.** Owner: Rafael + whoever maintains Cowork automations. Must be agreed before M5.1 implementation. Initial proposal: `{ id, title, copy, project, type, deadline, links: { jira, brief, drive_parent } }`. Iterate.
4. **Central infrastructure / API ownership** at Estratégia. Owner: Estratégia leadership. Open item from MENTOR_BRIEF §2. Blocks Phase 6 only.
5. **PSD vs Figma export priority** (M5.2 vs M5.3 order). Owner: Rafael. Pick whichever represents more current tasks.
6. **Source-of-truth split for tasks.** Proposed: Jira is source of truth for task metadata (title, copy, deadline, assignee); Saci is source of truth for production state (local folder path, files generated, upload status, local task state). Adopt and document in MENTOR_BRIEF §2 on next refresh.
7. **Auth UX for freelancers.** Each user authenticates their own Jira (via Cowork) and their own Drive (via `plugin-drive`). First-run wizard scope to be defined in M5.4.
8. **Template config location.** Local per user, shared via a checked-in JSON, or shared via the central API (Phase 6). Recommendation: shared, starting with a checked-in JSON during Phase 5 and migrating to the API when Phase 6 lands.

## Time and reality check

Phase-level estimates, optimistic vs realistic.

| Phase | Optimistic | Realistic |
|---|---|---|
| 1 — Storage | 1 week | 2–3 weeks |
| 2 — Registries | 4 weeks | 6–8 weeks |
| 3 — Palette | 2 weeks | 3–4 weeks |
| 4 — Multi-source | 3 weeks | 4–6 weeks |
| 5 — Production (full) | 5 months | 6–8 months |
| 6 — Plugins / central API | open | open |

From current position to M5.5 functional: roughly **10–14 months** at current cadence. First production value (M5.1 shipped to a freelancer's machine) lands around **5–6 months** out — earlier if Phases 2 or 4 compress.

These are estimates, not commitments. Track actuals after each phase closes and recalibrate the next estimate. A pattern of consistent overrun is a signal to scope down, not to push harder.

## Update protocol

- This file ages alongside MENTOR_BRIEF §2; treat them as a pair.
- After each merged PR that closes a milestone or phase: update the relevant section's status line in the same PR.
- New ideas → **Parking lot** with a one-line rationale. Do not enrich parking-lot entries beyond a line until they are nominated for promotion.
- Resolved pending decisions → strike through with date and a one-line resolution (`~~Decision text~~ — *resolved 2026-XX-XX: <outcome>*`). Do not delete; they form the history.
- Identity-level shifts (like the asset-browser → orchestrator shift recorded above) get a dated subsection in this file when they happen; do not silently rewrite the existing identity statement.

## References

- `CLAUDE.md` — R9 (canonical surface in English), R18 (storage layer), R19 (registries), A3 (third-use criterion before abstracting).
- `docs/MENTOR_BRIEF.md` §2 — active architectural decisions, refreshed in sync with this file.
- `docs/tasks/<NNN>-<slug>/` — per-milestone briefs, written when each milestone is about to start.
- `docs/GIT_WORKFLOW.md` — operational discipline.
- `README.md` — current functionality and original roadmap (now superseded by this file from Phase 2 onward).
