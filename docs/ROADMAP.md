# Saci — Product Roadmap

> **Living document.** Pair with `MENTOR_BRIEF.md` §2 (active architectural decisions) and `CLAUDE.md` (technical rules). Update after every milestone or pivot — when this file disagrees with MENTOR_BRIEF §2, the more recent one wins and the other must be reconciled in the same PR.

## Product map at a glance

The **production loop is the core**: pull a Jira task → scaffold its folder (template applied, opened in the editor) → work → close → upload the result to Drive. Read/data (the Jira fetch) is the **fuel** that feeds the loop; BI/export is the **periphery** that drains it into fact tables for downstream dashboards. The loop is what makes Saci a production assistant rather than a reporting tool — everything else exists to serve it.

### Layers & status

| Layer | Role | Status |
|---|---|---|
| Read / data (Jira fetch) | Fuel | **Built** — `saci fetch` (026/028/029); per-project input resolution is **Axis A only** (entrega + vertical field ids). Axis B/C and `config project add` not built. |
| Curated template management | Loop | **Planned** — only `appliedTemplate` / `templateUsed` type fields exist; no catalog, match, or apply code. |
| Workflow actions — start / close / drive upload | Loop | **In progress** — `saci start --local` shipped (036, smoke-confirmed 2026-07-26); `close` / `ship` not built; `DriveGateway` is a five-primitive port implemented by `adapter-drive` (047, all five confirmed live 2026-08-02), not yet wired into a command. |
| BI export | Periphery | **Built** — `saci export` CSV/JSON fact table (023). Sheets projection parked (`adapter-sheets` is a placeholder). |

(Status cells reflect the v2 source as of this writing, verified against the command surface and adapter implementations — not the prose elsewhere in this doc.)

### Where we are: alpha = building the loop

What **runs today** is the two ends, not the middle: read (`fetch`) and BI fact-table export. The **production loop itself is greenfield** — no scaffold, no template management, no start/close, no Drive round-trip exists yet. So **alpha is the build-out of the loop** (workflow actions + template management + the Drive adapter), not a validation pass over something already standing.

One distinction the map keeps straight: the loop's own task-state is **local** (`WorkspaceEvent`: start / ship / load / handoff) and is a loop concern. It is *not* the same as Jira **status normalization** (Axis B), which lives on the read/BI side. Conflating them would misplace work. The sequencing of the greenfield loop — which action lands first — is the next scoping decision and is deliberately **not fixed here**.

### Pointer index

This section is the one-screen orientation; the detail lives where it already does.

- **Phases and identity shifts** — this ROADMAP, below.
- **Possibility state (parked ideas, open decisions)** — `docs/explorations/`, one note per topic.
- **Per-task specs / briefs** — `docs/tasks/<task-id>-<slug>/`.
- **Session recaps (orchestrator + executor)** — `docs/sessions/`.
- **Doctrine** — `CLAUDE.md` (rules), `MENTOR_BRIEF.md` (mentoring), `docs/GOTCHAS.md` (traps).
- **Active focus / current architectural decisions** — `MENTOR_BRIEF.md` §2.

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

> **Superseded on the operating claim, 2026-08-14.** This entry stays as
> written; the note records that one sentence in it was overtaken — "Until v2's
> coordination adapters land (Phase 4), the Python automation continues to
> operate as the live coordination pipeline." The seed-of-v2's-core claim beside
> it holds. This one does not: `automation/` is a frozen snapshot of the Python
> laboratory — vendored once in `8fada81` (2026-06-06), untouched since — and
> the laboratory of record is the `buraqueira` repository (ruled 2026-08-14,
> `CLAUDE.md` "Architecture"). Phase 4 no longer names the folder either:
> `bf057b0` (#144) rewrote its goal and exit criterion to retire **the legacy
> Python coordination pipeline**, which is what the sentence was always about.
> Whether that pipeline still runs from any checkout was not measured; what is
> corrected here is its identification with this repository's `automation/`.

### 2026-05-28 — Coordination pipeline → individual production assistant

The 2026-05-15 framing kept coordination (Jira → Sheets) and production
(per-designer local) as parallel modes of the same product. Live use
proved this symmetric framing wrong: production is where Rafael remains
the bottleneck and where designers spend most of their time. Saci v2 is
therefore repositioned as an **individual production assistant**.

The primary loop is per-designer: pull a Jira task, scaffold its
folder, apply the right template, open it in the editor, ship the
result to Drive. Coordination (the Jira → Sheets dashboard) becomes a
**secondary aggregated view**, fed unidirectionally by the production
instances (designers publish state; they do not consume the Sheet
back).

Two derived shifts follow:

- **Tasks are portable, the app is not.** Each task carries a
  `TaskManifest` (JSON in its Drive folder) so another machine can
  reconstitute the context via `saci load`. Designer-to-designer
  handoff is promoted from parking lot to a Phase 3 primary use case.
- **Drive is a first-class integration.** The repositioning makes the
  Drive round-trip (find template, upload result, read manifest)
  load-bearing for the primary loop. Sheets stays in the system as the
  aggregation surface but drops to secondary.

The previous two identity shifts (2026-05-10 asset-browser →
workflow-orchestrator; 2026-05-15 v1 → v2 technical pivot) are not
invalidated. The product framing carried in 2026-05-15 (two operating
modes, same core) is refined here: the modes remain, but the production
mode is now primary and the coordination mode is a derived aggregation
built on top of it.

### 2026-06-12 — Coordination state in the Sheet → the application owns state

The 2026-05-28 repositioning made production primary and coordination a
secondary aggregated view, but it still treated the Google Sheet as the surface
that *held* coordination state: designer instances published into it. Brief 023
closed a sharper pivot — **the application owns production state** (local now,
remote later). A spreadsheet is no longer a state-holding surface; it becomes
**one optional one-way projection target among others** (flat files, BI
platforms).

Grounding fact: there are no production users of the Python laboratory today, so
`sync.py` / `lib_sheets.py` carry no behavior-preserving mandate — they are
legacy reference only. (This sentence named `automation/` when it was written,
which was a misattribution: that folder is a frozen snapshot, not the lab, and
the laboratory of record is the `buraqueira` repository. What it grounds is
unchanged. Corrected 2026-08-14.) The sync diff engine (cell ownership,
write-conditionals, formulas) existed solely because the Sheet held state; with
the app owning state, none of it is ported. What survives is the issue → row
projection, now `packages/core/src/export.ts` (shipped in brief 023).

The real target surfaced: feeding BI dashboards (Looker Studio / Power BI /
Grafana) and consolidating production across designers over time. Export is a
**fact table**; aggregation and history accumulation belong to the BI layer and
to Phase 3 state, not to the export. Phase 4 is rescoped accordingly and
`adapter-sheets` moves to the parking lot.

### 2026-08-13 — Production assistant → production assistant with an art arm

The 2026-06-12 pivot settled who owns state. This one settles what the product
*makes*. Saci orchestrated files around a designer's work — pull the task,
scaffold the folder, copy the template, ship the result. It now also **generates
the art itself** from a structured brief, through a rendering arm.

The arm exists already, outside this repository: **Suindara**, an HTML art
laboratory that renders a PNG from a spec by driving a headless browser. Its
contract was defined before Saci had any consumer for it; the art-chain spike
(`docs/tasks/2026-08-12-spike-art-chain/`) measured the seam between the two.

**Suindara's engine will be ported into this monorepo, not called across a
process boundary.** The reason is control, not size: Suindara carries none of
this project's rules, gates or test discipline — it is closer to a test bench
than to a product, and a product arm living outside every gate is an arm nobody
can hold to account. (This sentence read "is ported" when it was written, which
puts a ruling in the tense of a status. Nothing had been ported: on 2026-08-14
`packages/` held no `adapter-render`, `adapter-http` or `web`, and no
Suindara-derived source. Corrected 2026-08-14.)

This supersedes, on this point only, the topology in
`docs/sessions/2026-08-12-orchestrator-spike-art-chain.md`, which justified a
separate repository as "an earned boundary" and had the chain spawning
`render.mjs` as a subprocess. That recap is authority level 6 and stays on disk
unedited; this subsection is what supersedes it.

Two things the shift deliberately does **not** change:

- **The Python lane is untouched.** The Python laboratory — the `buraqueira`
  repository — was declared permanent on 2026-08-08 and stays one. (This bullet
  named `automation/` when it was written, which was a misattribution: that
  folder is a frozen snapshot, not the lab. Corrected 2026-08-14.) Suindara's
  status changed; no argument here reaches the Python lane.
- **The art-template repositories stay outside.** `suindara-tmpl-*` remains an
  installable versioned ecosystem with its own release rhythm. Only the engine
  moves.

Three things it does **not** decide, listed so nobody reads them into it: which
phase the arm belongs to, which units of the engine port first, and whether the
art chain works end to end. The spike stopped on two stacked blockers — the
granted Drive scope reaches no file this client did not create, and the copy is
an uploaded `.docx` rather than text — and a document touches neither.

## Phases

Phases are ordered by dependency, not by date. Items are tagged `[coord]`, `[prod]`, or untagged (foundational, serves both modes). Estimates are set at each phase's start, not in a central table — that pattern proved hard to keep current under v1.

> **Notation:** `[coord]` = coordination mode (Rafael's centralized pipeline). `[prod]` = production mode (per-designer local). Untagged items are foundational and serve both.

### Phase 1 — Monorepo bootstrap *(in progress)*

**Goal:** the TS monorepo compiles, the `cli` package prints `--version`, `node:test` runs an empty suite green. Nothing else.

**Strict scope:** no domain logic, no adapters, no CLI commands beyond `--version`. Any additional work is a separate phase, even if it would be "easy to add" — this scope discipline is the whole point of Phase 1.

**Exit criterion:** `npm install` at repo root succeeds; `npm run build` succeeds across all workspaces; `node packages/cli/dist/cli.js --version` prints a version; `node --test` runs and passes a placeholder suite.

### Phase 2 — Domain port (foundational)

**Goal:** the Python `automation/lib_transform.py` is ported to
TypeScript as the `core` package — pure domain functions, no I/O.
Ports (interfaces) for the Jira and Sheets adapters are defined as TS
interfaces, even though the adapters themselves come later.
Additionally, the central production-mode type — `TaskManifest` (the
portable JSON unit that lives in the Drive folder of a task) — is
designed as a TS interface in `core`. Implementation (serialization,
persistence, command wiring) is Phase 3. (A separate `Workspace` type
was originally planned here; it was dropped in the brief-031 design —
its 2026-05-28 shape predated the 2026-06-12 app-owns-state pivot and
had zero consumers.)

**Strict scope:** `core` package only. No adapter implementations. No
CLI commands using the domain yet. Type design is allowed; runtime
code that reads or writes manifests is Phase 3.

**Exit criterion:** every pure-domain function in the Python seed —
currently split between `lib_transform.py` and the shape-independent
policy inside `fetch.py`; Jira-shape-coupled functions remain in the
adapter — has a TS equivalent in `core` with `node:test` coverage;
`JiraGateway`, `SheetGateway`, and a Drive gateway port are defined as
TS interfaces; `payload.json` v2.0 represented as TS types;
`TaskManifest` defined as a TS interface with documented field
contracts (shipped in brief 031; the planned `Workspace` type was
dropped — see Goal note).

### Phase 3 — Individual production assistant (product core) `[prod]`

**Goal:** the per-designer local app runs the full production loop
end-to-end on one machine — pull tasks, scaffold folders, apply
templates, ship to Drive, and let any other designer pick the task up
from its Drive manifest. This is the core of the product after the
2026-05-28 repositioning.

**Items:**

- `[prod]` Local storage with two data categories: (a) Jira mirror —
  overwritable on every fetch; (b) production state — never
  overwritten by fetch. Storage loss never destroys work: Jira issues
  are recreatable from Jira; active tasks are recreatable from their
  Drive manifests.
- `[prod]` Primary command set: `fetch` (refresh Jira mirror), `list`
  (browse local tasks), `start <key>` (scaffold + apply template +
  open editor + write manifest), `ship <key>` (upload local folder to
  Drive, update manifest), `load <drive-url>` (reconstitute a task on
  this machine from its Drive manifest), `status` (one-task overview).
- `[prod]` Per-project `fetch` input resolution (remaining axes) — **Axis B**
  (status-value normalization anchored on `statusCategory`; status names vary
  per project), **Axis C** (delivery dates derived from text-embedded
  summary/description where no structured field exists), and
  `saci config project add <KEY>` (field-discovery onboarding generator).
- `[prod]` 3-level template match: (1) deterministic — strong explicit
  signals pick a template with no confirmation; (2) suggestion-with-
  confirmation — medium signals propose a template, designer confirms
  or picks another; (3) manual — designer picks from the list. MVP
  covers levels 1 and 3; level 2 lands when heuristics mature. Bypass
  available via `saci start <key> --template <name>`.
- `[prod]` Pure Drive-path derivation in `core` (shipped in brief 030):
  `derivePath(input: DerivePathInput) → readonly string[]` returns
  deterministic folder segments under the Drive hierarchy —
  `AVULSAS / <vertical> / <YYYY-MM> / <KEY>_slug` — with the month taken
  from the delivery date (falling back to the Jira updated timestamp,
  then the task's start timestamp, then the `undated` sentinel).
  `campaign` lives on `DerivePathInput`, not on `Issue` (null in alpha;
  campaign resolution is parked). The hierarchy is no longer tacit; it
  is formalized in `packages/core/src/derive-path.ts`. derivePath
  derives from the semester downward; the semester segment is the
  responsibility of the pointed-at root (the local workspace root
  today, the Drive root at `ship` time), which lives inside the current
  semester folder.
- `[prod]` Manifest read / write: the `TaskManifest` type from Phase 2
  becomes a real file written to the task's Drive folder on `start`
  and updated by `ship` / `load`. Designer-to-designer handoff
  (designer B picking up a task started by designer A) is a primary
  use case.
- `[prod]` `saci config` — per-machine identity (multi-tenant per
  machine, mono-user per instance). Day-1 requirement: 3+ designers
  running their own instances.
- `[prod]` Drive adapter (`adapter-drive`, shipped in brief 047) — Google
  Drive read / write for templates, manifests, and ship uploads. Five
  one-call primitives implementing the `DriveGateway` port — resolve
  folder, find child, create folder, upload file, read file content —
  over `googleapis` + `google-auth-library` with a user OAuth Desktop
  loopback flow; all five confirmed live on 2026-08-02. The library
  question was decision #11, closed by spike 046. No command wires it
  yet: composition (folder-tree walking, verify-never-create, manifest
  parsing) belongs to `ship`, a later brief.
- `[prod]` Designer-friendly packaging — Saci-desktop (Electron)
  returns as a host for the CLI on non-technical designers' machines.
- `[prod]` CLI human-facing display — a read-side command that renders the
  current open demands to the terminal for a person to read. Distinct from the
  machine-readable export (`runExport`); the export feeds files and BI, the
  display feeds the operator's eyes.
- `[prod]` State and history accumulation — the app owns production state over
  time (not just point-in-time snapshots). This is the precondition for any
  throughput/history view; export snapshots alone cannot produce it.
- Credential guard on `fetch` (shipped in brief
  2026-08-09-fetch-credential-guard). Jira's `POST /rest/api/3/search/jql`
  answers
  `200` with an empty list when the token has expired, not `401`, and
  `runFetch` writes the payload unconditionally — so an expired token silently
  overwrites a good payload with zero entries and the next export ships empty.
  The Python lab added two guards after a run went blind in production; this
  repo has neither. Evidence and the lab's shape:
  `docs/explorations/python-laboratory-lane.md`.

**Exit criterion:** Rafael's designers can install Saci-desktop, run
their daily production flow end-to-end on three or more machines, and
Rafael does no manual scaffolding for that flow. A task started on one
machine can be loaded and continued on another via its Drive manifest.

**Open items inside this phase** (resolve at phase start):

- Exact shape of the Drive hierarchy formalization (vertical /
  campaign / date / name — but with which separators, which date
  format, which fallback for missing fields).
- Template catalog: where it lives, how it is edited, what its
  metadata shape is.
- Deterministic match rules for level 1: which issue signals pick
  which template (code first, config later when the rules stabilize).
- `claimed_by` semantics in the manifest: how long a claim lasts,
  whether it auto-releases, how conflicts on `ship` are resolved.
- What `ship` uploads: the whole folder, or filtered (no `.psd~`, no
  swap files).
- Local folder naming vs Drive folder naming: same name, or
  transformation between local and Drive.
- Secondary commands (`cancel`, `reopen`, `archive`, `notes`) — which
  enter the MVP, which wait for a real second case.
- Packaging format and OS coverage (Windows first probably; Mac/Linux
  follow).

### Phase 4 — Shared state and the coordination view `[coord]`

**Goal:** the app-owned production state becomes shareable across designer
instances, and the team-level coordination view is rebuilt as a **reader of a
projection off that shared state** — never a state holder. The legacy Python
coordination pipeline retires once a coordination consumer reads Saci's state
instead of the legacy Sheet.

**Items:**

- `[coord]` Shared/remote state backend — production instances sync their
  app-owned state to a shared store. Local-only state (Phase 3) is the
  precondition; the remote backend is designed here.
- `[coord]` Consolidation across designers — many instances' fact tables roll up
  into one team-level dataset. Granularity (per-event push, daily rollup,
  point-in-time snapshot) is decided during Phase 4 modeling, not now.
- `[coord]` Coordination view as a projection consumer — the team-level picture
  reads an export/projection of the shared state. Any spreadsheet or BI surface
  is one such consumer (see Parking lot), not the source of truth.
- `[coord]` Composition root for coordination mode in the `cli` package.

**Exit criterion:** Rafael's coordination view runs entirely on TS Saci, reading
a projection of app-owned shared state; the legacy Python coordination pipeline
is archived.

**Dependencies:** Phase 3 — there is no shared state to consolidate until
production instances own and accumulate state at runtime. Phase 4 follows
Phase 3.

### Phase 5 — Desktop UI on top of CLI

**Goal:** the desktop UI is reconnected as a thin layer over the CLI / core, supporting both modes. Coordination mode gets a desktop interface to operate the pipeline; production mode gets a richer surface than the bare CLI.

**Status:** sketch only. Reconnection happens **within ~3-4 months** of Phase 1 start — earlier if Phase 3 packaging requires it. Detailed scope drafted when Phase 4 closes.

### Phase 6+ — Open

Beyond the desktop reconnect, the next directions are open. See **Parking lot** for candidates that may promote.

## Parking lot

Ideas anchored but unscheduled live as exploration notes in
`docs/explorations/` — since brief 051 (2026-08-06) that folder owns each
possibility's state (disposition, trigger, changelog) under the contract in
`docs/explorations/README.md`; this file only points. New ideas start as a
note there, not as a line here.

## Pending decisions

Open questions that gate or shape upcoming phases live in the same
`docs/explorations/` notes: each question carries its disposition and its
resolution history. Resolutions are recorded as dated disposition transitions
in the note's changelog, never by deletion. The numbered list that lived here
(decisions #1–#11) migrated into notes on 2026-08-06; the D1 table of
`docs/tasks/051-parking-pending-migration/brief.md` maps each number to its
note.

## Legacy / superseded — Saci-Electron-v1 phases

The following phases were planned under the Electron-v1 codebase. With v1 entering freeze on 2026-05-15, they are **superseded** by the v2 phases above. Brief slot reservations 004-006 (`refactor/format-registry`, `refactor/renderer-views`, `refactor/action-registry`) were **burned** as part of the v2 pivot — those slot numbers will not be reused.

- ~~**Phase 1 — Storage layer foundation**~~ — superseded; in v2, persistence is per-adapter, not a single seam.
- ~~**Phase 2 — Registry foundations**~~ — superseded; v2 doesn't have the dispatch-table problem R19 was solving.
- ~~**Phase 3 — Command palette**~~ — superseded; revisit if the desktop UI requires it (v2 Phase 5).
- ~~**Phase 4 — Multi-source abstraction**~~ — superseded; the `Source` interface idea survives in `docs/explorations/multi-source-adapters.md`.
- ~~**Phase 5 — Production workflow**~~ — superseded by **v2 Phase 3** (promoted in priority).
- ~~**Phase 6 — Plugin maturation & central API**~~ — superseded; survives in `docs/explorations/plugin-system.md` and `docs/explorations/central-catalog.md`.

Estimates and the M5.x milestone breakdown from the v1 plan are not migrated — v2 starts with new estimates, set at each phase's start.

## Update protocol

- This file ages alongside MENTOR_BRIEF §2; treat them as a pair.
- After each merged PR that closes a milestone or phase: update the relevant section's status line in the same PR.
- New ideas and new open decisions → a note in `docs/explorations/` under its README contract (header, disposition, changelog). This file is not the surface for them; the two pointer sections above list nothing.
- Resolving a decision → a dated disposition transition in the note's changelog (`docs/explorations/README.md`). Do not delete notes; they form the history.
- Identity-level shifts get a dated subsection in `## Identity shifts`; do not silently rewrite earlier ones.
- Phase-level shifts (a phase being superseded by another, like the v1 → v2 pivot) move the old phases to `## Legacy / superseded` with a one-line rationale per phase; do not delete them.
- The **Product map at a glance** section is single-source — it points, it does not restate. Phase/decision/identity content lives in the body below and in the pointed-to docs; never duplicate it into the map.
- Refresh the map at the **recap / cache-swap ritual**, alongside the per-milestone status update — not as a separate cadence.
- A layer or status only **graduates onto the map** under the rule of three: a concern earns a map row when it is real and load-bearing, not on first mention.

## References

- `CLAUDE.md` — technical rules (TS-specific rules pending; see MENTOR_BRIEF §2).
- `docs/MENTOR_BRIEF.md` §2 — active architectural decisions, refreshed in sync with this file.
- `docs/tasks/<task-id>-<slug>/` — per-task briefs; written when a task is about to start.
- `docs/explorations/` — possibility state (parked ideas, open decisions); read its README contract first.
- `docs/GIT_WORKFLOW.md` — operational discipline.
- `README.md` — current functionality (v1 asset browser side).
