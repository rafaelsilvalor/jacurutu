# Brief: 017 — Reposition Saci v2 as individual production assistant

> **Category:** L
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/repositioning-prod-assistant`

---

## Context

The 2026-05-28 mentor session
(`docs/sessions/2026-05-28-mentor-saci-repositioning-individual-prod-assistant.md`)
**repositioned the entire Saci v2 system**: from "Jira → Sheets coordination
pipeline with production as an annex" to "individual local production
assistant with coordination as a secondary aggregation surface". The
inversion is product-level, not technical — Phase 2 was about to be
modeled, and the upstream framing now requires reconciliation before any
code lands.

Key shifts decided in that session:

- **Primary identity:** Saci v2 automates the repetitive actions around a
  Jira task (create folder, find template, open Photoshop, upload to Drive)
  so the designer only does art. The pipeline Jira → Sheets becomes a
  **secondary** use case (aggregated view for coordination / non-designer
  audiences).
- **Per-machine local app; tasks portable via `TaskManifest`.** Each
  designer runs their own local instance. Tasks carry a JSON manifest in
  their Drive folder, enabling `saci load <url>` on a different machine —
  designer-to-designer handoff is promoted from parking lot to Phase 3
  primary use case.
- **Phase 2 expanded:** in addition to porting `lib_transform.py` (pure),
  Phase 2 designs the `Workspace` and `TaskManifest` types in `core` as TS
  interfaces. Still no I/O.
- **Phase 3 rewritten:** now the product core — local storage (two data
  categories), commands (`fetch` / `list` / `start` / `ship` / `load` /
  `status`), 3-level template match, pure Drive-path derivation, manifest
  read/write.
- **Phase 4 resized:** Sheets becomes a secondary aggregated view, fed
  unidirectionally by designer instances (designers publish, do not
  consume). Granularity left open.
- **Drive promoted to first-class integration** alongside Jira; Sheets
  drops to secondary.

This brief is docs-only. It updates `docs/ROADMAP.md` and
`docs/MENTOR_BRIEF.md` §2 to encode the new framing. No code, no adapter
work, no command implementation. The Phase 2 technical port
(`lib_transform.py` → `core`) is a separate brief authored after this one
merges.

`CLAUDE.md` is intentionally **out of scope**. Phase 2 / 3 names are still
firming up; any CLAUDE.md adjustment becomes its own future brief once the
domain types stabilize (same staging discipline as brief 008 deferred TS
rules to brief 009).

## Goal

After this task:

- `docs/ROADMAP.md` reflects the repositioning: a new dated entry under
  `## Identity shifts` (2026-05-28, additive — earlier entries untouched);
  Phase 2 expanded; Phase 3 rewritten as the product core (with the
  designer-handoff use case promoted in); Phase 4 redimensioned for
  aggregation; Parking lot loses the handoff bullet; Pending decisions
  gains three new entries (manifest format, local storage format, Sheets
  granularity) plus one entry for the Drive JS library.
- `docs/MENTOR_BRIEF.md` §2 reflects the new primary identity (individual
  production assistant) and the integration reordering (Jira REST direct
  preserved; Drive promoted; Sheets demoted to secondary); the package
  list gains `adapter-drive`; decisions still valid (Node ≥22, verb
  allowlist SSOT) are preserved.
- `docs/tasks/017-repositioning-prod-assistant/brief.md` exists at the
  expected path with commit #1 on the branch.

Out of scope:

- Any code change. Phase 2 technical port (`lib_transform.py` → `core`) is
  a separate brief authored after 017 merges.
- Implementation of `fetch` / `list` / `start` / `ship` / `load` /
  `status` commands (Phase 3 — separate brief).
- `adapter-drive` implementation (Phase 3+ — separate brief).
- JS library research for Google Drive API — **NOT VERIFIED**; not named
  in the brief.
- Fine design of Phase 3 internals (`claimed_by` semantics in the
  manifest, ship-conflict resolution, local-to-Drive folder renaming,
  secondary command set such as `cancel` / `reopen` / `archive` /
  `notes`) — Phase 3 modeling will resolve these.
- `CLAUDE.md` — deferred. R25 examples and any new rules tied to the
  repositioning enter a future brief once Phase 3 modeling closes domain
  type names. Mirrors brief 008's deferral of TS rules to brief 009.
- Any application code (`main.js`, `psd-worker.js`, `preload.js`,
  `renderer/*`, `packages/*`).
- Renaming or migrating existing briefs in `docs/tasks/`.
- Any `git push` (`CLAUDE.md` R17 / `GIT_WORKFLOW.md` G-R5).

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified by this brief:
   - `docs/tasks/017-repositioning-prod-assistant/brief.md` (this file)
   - `docs/ROADMAP.md`
   - `docs/MENTOR_BRIEF.md` (§2 only — see Edit 3 scope guard)

   If anything else needs changing, **STOP and ask**.

2. Follow all rules in `CLAUDE.md`, with particular attention to:
   - **R9** — agent-consumed surface is English-only; all brief content
     and edited docs are English.
   - **R10** — Conventional Commits, subject ≤ 72 chars.
   - **R13** — never bypass the pre-commit hook with `--no-verify`.
   - **R14** — this brief is docs-only; no behavior change framing
     applies. Equivalent here: do not silently rewrite earlier dated
     identity-shift entries (additive only, per ROADMAP §Update
     protocol).
   - **R17** — never `git push` without explicit user instruction.

3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `docs/repositioning-prod-assistant`
   - Conventional Commits (G-R3); subject ≤ 72 chars verified before
     each commit (`pre-commit-self-audit` Check 1).
   - No `Co-authored-by` trailer (G-R3 / G-A7).
   - Commit freely; **DO NOT push** (G-R5).
   - **`/create-pr` automation, if invoked, is treated as commit-only
     stop-and-report.** Authoring agent must not push under automation.
     A verbal user instruction at the end of the session is the only
     way to authorize push.

4. **Additive vs replacement is per-section.** For each ROADMAP edit
   below, the brief specifies either "insert" (additive) or "replace"
   (wholesale within that section). Do not extrapolate one mode to
   other sections.

5. **Identity shifts entries are immutable history.** The 2026-05-10
   and 2026-05-15 entries are preserved byte-for-byte. The 2026-05-28
   entry is appended below them. ROADMAP §Update protocol mandates
   this; brief reinforces it.

6. **P4 numbering verification before commit #1 (mentor review guard).**
   The number 017 is the planner's assertion. Before committing, confirm
   the slot is free using all three sources: `ls docs/tasks/`,
   `git log --oneline main` (merged PRs), and reserves in `CLAUDE.md`
   E* entries. If 017 is already taken (a reserve, or a merged-but-
   unsynced task at that number), **STOP and report** — do not renumber
   unilaterally.

### Conventions

- All edited content in English (R9). The 2026-05-28 session recap is
  bilingual (mentor recap convention) but this brief and the docs it
  edits are English-only.
- Commit type for docs changes: `docs`. Scopes used: `tasks` (brief
  artifact), `roadmap`, `mentor-brief`.
- No emojis added to ROADMAP or MENTOR_BRIEF prose. Existing emojis in
  the files (e.g. the warning blockquote at the end of §2) are
  preserved as-is.

### Architectural decisions already made (do not revisit)

Closed in the 2026-05-28 mentor session
(`docs/sessions/2026-05-28-mentor-saci-repositioning-individual-prod-assistant.md`).
Executor implements; does not propose alternatives. If a decision below
appears incoherent against the brief text, **STOP and report**.

#### D1 — Primary identity is individual production assistant

Saci v2 is an individual local production assistant for one designer at
a time. Coordination (Jira → Sheets aggregated view) is a secondary use
case fed unidirectionally by the production instances. This is the
load-bearing inversion versus the 2026-05-15 framing.

#### D2 — Per-machine app, tasks portable via Drive manifest

The application runs locally per designer (no server, no cross-machine
sync). Each task carries a `TaskManifest` (JSON file) in its Drive
folder that lets another machine reconstitute the context via
`saci load <drive-url>`. Designer-to-designer handoff is a Phase 3
primary use case.

#### D3 — Phase 2 designs `Workspace` and `TaskManifest` as types

Phase 2 scope expands: in addition to porting `lib_transform.py` (pure
domain) to `core`, Phase 2 defines `Workspace` and `TaskManifest` as TS
interfaces inside `core`. Implementation (serialization, persistence)
is Phase 3.

#### D4 — Phase 3 is the product core

Phase 3 covers: local storage (two categories — Jira mirror,
overwritable on fetch; production state, never overwritten by fetch),
commands (`fetch` / `list` / `start` / `ship` / `load` / `status`),
3-level template match (deterministic / suggestion-with-confirm /
manual; MVP covers levels 1 and 3), pure Drive-path derivation,
manifest read/write.

#### D5 — Drive is a first-class integration

The package list in MENTOR_BRIEF §2 grows from
`core` / `adapter-jira` / `adapter-sheets` / `cli` to include
`adapter-drive`. Sheets stays in the list but moves to secondary in the
prose.

#### D6 — Phase 4 is the aggregated Sheets view (unidirectional)

Phase 4 keeps Sheets, but its role changes: aggregated view fed by
production instances. Designers publish; they do not consume the Sheet
back. Granularity (per-event / daily-rollup / snapshot) is deferred —
new Pending decision entry covers this.

#### D7 — Drive JS library is unverified; do not name

Google Drive API JS library has not been researched. The brief and the
edited docs MUST NOT name a specific library. The new Pending decision
entry for Drive integration leaves the library open.

#### D8 — Out-of-scope sweeps preserve in-flight referents

This brief edits two historical-on-`main` files (ROADMAP, MENTOR_BRIEF
§2). It does not modify any other historical brief, recap, or doc. If
a sweep would touch anything outside the in-scope list,
**STOP and report** — do not silently extend scope.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The user pre-saved this brief to
`docs/tasks/017-repositioning-prod-assistant/brief.md` before invoking
the executor (caminho B). The executor verifies presence and commits.

- [ ] P4 numbering confirmed: 017 is free per `ls docs/tasks/`,
      `git log --oneline main`, and `CLAUDE.md` E* (no collision). If
      017 is taken, **STOP and report** — do not renumber unilaterally.
- [ ] Directory `docs/tasks/017-repositioning-prod-assistant/` exists
- [ ] File `docs/tasks/017-repositioning-prod-assistant/brief.md`
      exists; first line is exactly
      `# Brief: 017 — Reposition Saci v2 as individual production assistant`
- [ ] `git add docs/tasks/017-repositioning-prod-assistant/brief.md` is
      staged
- [ ] Commit #1 created with subject
      `docs(tasks): add brief for 017-repositioning-prod-assistant`
      (59 chars; ≤ 72)

If the file is missing or the first line does not match,
**STOP and report**. Do not regenerate the brief from memory.

Commit: `docs(tasks): add brief for 017-repositioning-prod-assistant`

### Edit 2 — `docs/ROADMAP.md`: targeted section edits

Six sub-edits, each anchored to an exact location. Apply in the order
2a → 2b → 2c → 2d → 2e → 2f. After all six are complete, the file is
committed as one atomic ROADMAP commit. Do not commit between
sub-edits.

#### 2a — Append new entry under `## Identity shifts`

Locate the existing `## Identity shifts` block. The last current entry
is `### 2026-05-15 — v1 (Electron-JS) → v2 (TS monorepo, hexagonal,
CLI-first)`, which ends with the line
`The same core serves both modes; each mode has its own command set.`
(immediately followed by a blank line and then the `## Phases`
heading).

Insert the following block **between** that closing line and the
`## Phases` heading. Preserve exactly one blank line above and one
below the new entry.

```markdown
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
```

Verification:

- [ ] The new `### 2026-05-28 — ...` heading appears immediately after
      the closing line of the 2026-05-15 entry
- [ ] The 2026-05-10 and 2026-05-15 entries are byte-identical to
      before (verify via `git diff docs/ROADMAP.md` — those ranges
      show no changes)
- [ ] The `## Phases` heading immediately follows the new entry's last
      paragraph (one blank line between them)

#### 2b — Expand Phase 2

Locate the section `### Phase 2 — Domain port (foundational)` and its
body. Current body starts with `**Goal:**` and ends with the
`**Exit criterion:**` paragraph. The section ends at the blank line
before `### Phase 3 — ...`.

Replace the entire Phase 2 body (from `**Goal:**` through the
`**Exit criterion:**` paragraph, **inclusive of all its lines**) with:

```markdown
**Goal:** the Python `automation/lib_transform.py` is ported to
TypeScript as the `core` package — pure domain functions, no I/O.
Ports (interfaces) for the Jira and Sheets adapters are defined as TS
interfaces, even though the adapters themselves come later.
Additionally, the central production-mode types — `Workspace` (the
per-task abstraction tying Jira key, local folder, applied template,
state, Drive path, and manifest) and `TaskManifest` (the portable JSON
unit that lives in the Drive folder of a task) — are designed as TS
interfaces in `core`. Implementation (serialization, persistence,
command wiring) is Phase 3.

**Strict scope:** `core` package only. No adapter implementations. No
CLI commands using the domain yet. Type design is allowed; runtime
code that reads or writes manifests is Phase 3.

**Exit criterion:** every pure-domain function in `lib_transform.py`
has a TS equivalent in `core` with `node:test` coverage;
`JiraGateway`, `SheetGateway`, and a Drive gateway port are defined as
TS interfaces; `payload.json` v2.0 represented as TS types; `Workspace`
and `TaskManifest` defined as TS interfaces with documented field
contracts.
```

Verification:

- [ ] The Phase 2 heading itself (`### Phase 2 — Domain port
      (foundational)`) is byte-identical to before
- [ ] The Phase 1 section (above Phase 2) is byte-identical to before
- [ ] The Phase 3 heading line (which 2c will replace next) is reached
      cleanly with one blank line separating it from the new Phase 2
      body

#### 2c — Rewrite Phase 3

Locate the section
`### Phase 3 — Production workflow + designer packaging \`[prod]\``
and its body. The section currently runs from its heading to the blank
line before `### Phase 4 — Coordination adapters \`[coord]\``.

Replace the entire Phase 3 section (heading **and** body) with:

```markdown
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
- `[prod]` 3-level template match: (1) deterministic — strong explicit
  signals pick a template with no confirmation; (2) suggestion-with-
  confirmation — medium signals propose a template, designer confirms
  or picks another; (3) manual — designer picks from the list. MVP
  covers levels 1 and 3; level 2 lands when heuristics mature. Bypass
  available via `saci start <key> --template <name>`.
- `[prod]` Pure Drive-path derivation in `core`: given a Jira issue,
  `derivePath(issue) → string` returns a deterministic path under the
  Drive hierarchy (vertical / campaign / date / name). The current
  hierarchy is tacit; Phase 3 formalizes it as code.
- `[prod]` Manifest read / write: the `TaskManifest` type from Phase 2
  becomes a real file written to the task's Drive folder on `start`
  and updated by `ship` / `load`. Designer-to-designer handoff
  (designer B picking up a task started by designer A) is a primary
  use case.
- `[prod]` `saci config` — per-machine identity (multi-tenant per
  machine, mono-user per instance). Day-1 requirement: 3+ designers
  running their own instances.
- `[prod]` Drive adapter (`adapter-drive`) — Google Drive read / write
  for templates, manifests, and ship uploads. JS library not yet
  researched (Pending decision).
- `[prod]` Designer-friendly packaging — Saci-desktop (Electron)
  returns as a host for the CLI on non-technical designers' machines.

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
```

Verification:

- [ ] The Phase 3 heading now reads exactly
      `### Phase 3 — Individual production assistant (product core) \`[prod]\``
- [ ] The Phase 2 section (above) is byte-identical to its 2b state
- [ ] The Phase 4 heading line is reached cleanly with one blank line
      separating it from the new Phase 3 body

#### 2d — Rewrite Phase 4

Locate the section `### Phase 4 — Coordination adapters \`[coord]\``
and its body. The section currently runs from its heading to the blank
line before `### Phase 5 — Desktop UI on top of CLI`.

Replace the entire Phase 4 section (heading **and** body) with:

```markdown
### Phase 4 — Coordination as aggregated view `[coord]`

**Goal:** the Sheets dashboard becomes a real aggregated view of what
is happening across designer instances. Production instances publish
their state unidirectionally; the Sheet is read-only from the
designer's perspective. The Python `automation/` retires once this
lands.

**Items:**

- `[coord]` `adapter-jira` — Jira REST direct (Cowork bridge
  reverted). JS equivalent of Python's `requests` chosen and
  committed.
- `[coord]` `adapter-sheets` — Google Sheets write (publish only;
  designer instances do not read the Sheet back). JS equivalent of
  Python's `gspread` chosen and committed.
- `[coord]` Aggregation strategy — granularity is open: per-event
  push (each `start` / `ship` triggers a Sheet write), daily rollup,
  or point-in-time snapshot. Decided during Phase 4 modeling, not
  now.
- `[coord]` CLI commands or a background loop for the publish
  pipeline, depending on the granularity choice.
- `[coord]` Composition root for coord mode in the `cli` package.

**Exit criterion:** Rafael's coordination view runs entirely on TS
Saci; Python `automation/` archived. The Sheet content reflects the
state across designer instances at the chosen granularity.

**Dependencies:** Phase 2 (ports defined) and Phase 3 (production
instances generate the state being aggregated). The aggregation has
nothing to aggregate until Phase 3 has runtime use, so Phase 4
follows Phase 3.
```

Verification:

- [ ] The Phase 4 heading now reads exactly
      `### Phase 4 — Coordination as aggregated view \`[coord]\``
- [ ] The Phase 3 section is byte-identical to its 2c state
- [ ] The Phase 5 heading line is reached cleanly with one blank line
      separating it from the new Phase 4 body
- [ ] The Phase 5 section is byte-identical to the version on `main`
      before this brief

#### 2e — Remove the handoff bullet from `## Parking lot`

Locate the `## Parking lot` section. The candidate bullet to remove —
the one the planner identified as carrying the designer-to-designer
handoff concept — is:

```markdown
- **Source-of-truth split formalization for tasks** — concept carried from the 2026-05-10 product direction (Jira = task metadata; Saci = production state). Encoded in domain types as Phase 3 designs `ProductionFlow`.
```

Per the 2026-05-28 recap (decision: handoff becomes a Phase 3 primary
use case, captured by `TaskManifest`), this bullet is to be removed.

**STOP-and-confirm before removing (mentor review guard).** The mapping
"this bullet == the designer-to-designer handoff concept" is an
inference, not a certainty: the bullet's literal text is about a
source-of-truth split (Jira = metadata, Saci = production state) and
the superseded `ProductionFlow` abstraction, not explicitly about
handoff. Before deleting, verify against the live `## Parking lot`:

1. This bullet is in fact the carrier of the designer-to-designer
   handoff concept (no other bullet covers handoff more directly).
2. No separate, distinct handoff bullet exists that would be orphaned
   by this removal.

If either check fails — the bullet is about something else, or a
separate handoff bullet is present — **STOP and report** instead of
removing. Do not remove a bullet whose role you cannot confirm against
the actual file.

Once confirmed: **remove this entire bullet line** from the Parking
lot list. Do not remove any other bullet. The bullets immediately
above and below it remain in place; the list reflows naturally.

Verification:

- [ ] STOP-and-confirm guard above was satisfied (bullet confirmed as
      the handoff carrier; no separate handoff bullet orphaned)
- [ ] The bullet text starting `- **Source-of-truth split
      formalization for tasks**` is no longer present in
      `docs/ROADMAP.md`
- [ ] All other parking-lot bullets are byte-identical to before
- [ ] The `## Pending decisions` heading is reached cleanly

#### 2f — Append four entries to `## Pending decisions`

Locate the `## Pending decisions` ordered list. The list currently
ends at item 7 (`Versioning policy.`). Append four new items as 8, 9,
10, and 11 (continuing the existing numbered list).

Insert these four items at the end of the numbered list, before the
next heading (`## Legacy / superseded — Saci-Electron-v1 phases`):

```markdown
8. **`TaskManifest` format.** Exact JSON shape of the manifest file
   that lives in each task's Drive folder: required fields, optional
   fields, versioning strategy, file name convention (`.saci.json`
   or similar). Designed in Phase 2 (type) and finalized in Phase 3
   (serialization).
9. **Local storage format.** On-disk layout for the two data
   categories (Jira mirror — overwritable; production state — never
   overwritten by fetch). SQLite, JSON files per task, or a hybrid.
   Decided at Phase 3 start.
10. **Sheets aggregation granularity.** Per-event push, daily
    rollup, or point-in-time snapshot. Decided during Phase 4
    modeling when real usage data from Phase 3 informs the choice.
11. **Google Drive JS library.** Equivalent for Drive read / write
    (templates, manifests, ship uploads). Not yet researched.
    Required before Phase 3 `adapter-drive` work; not blocking
    Phase 2.
```

Verification:

- [ ] Items 8, 9, 10, and 11 appear in `## Pending decisions` in that
      order
- [ ] Items 1-7 are byte-identical to before
- [ ] The `## Legacy / superseded — Saci-Electron-v1 phases` heading
      immediately follows item 11's last line (one blank line
      between)
- [ ] No other section of `docs/ROADMAP.md` is modified by 2f

Commit: `docs(roadmap): document v2 repositioning as production assistant`

(64 chars; ≤ 72 — re-verify with `pre-commit-self-audit` Check 1. Verb
`document` per the verb-allowlist SSOT; do NOT revert to `reposition`,
which is not in the allowlist. Body explains the 2026-05-28 mentor
session as authorization and cross-references the new Identity shifts
entry.)

### Edit 3 — `docs/MENTOR_BRIEF.md` §2: replace the body

Locate §2: starts at the line `## 2. Where we are in the project` and
ends at the blockquote line
`> ⚠️ This section ages fast. Update it after every significant milestone or pivot.`
(inclusive).

Replace the entire range with this exact content:

```markdown
## 2. Where we are in the project

- **Project:** Saci — an **individual production assistant** for the
  Estratégia design team. Saci v2 automates the repetitive actions
  around a Jira task — create the local folder, find the right
  template, open it in the editor, ship the result to Drive — so the
  designer only does art. A second use case rides on top: an
  aggregated Sheets view fed unidirectionally by the production
  instances, giving Rafael (and non-designer coordinators) a
  team-level picture without pulling designers into a coordination
  tool.
- **Repositioning recorded 2026-05-28:** the 2026-05-15 framing kept
  coordination and production as parallel modes; the 2026-05-28
  mentor session inverted the priority. Production is primary;
  coordination is a derived aggregation. The two-modes design is
  preserved — what changed is which mode drives the architecture.
- **Phase transition (recorded 2026-05-15, still in force):**
  - **Saci-Electron-v1** (the existing pure-JS codebase) is in
    **freeze** — critical bugs only, no new features.
  - **Saci v2** is being built as a **TypeScript monorepo** (npm
    workspaces, `strict: true`, `node:test`, no bundler), following
    **Hexagonal (Ports & Adapters)** architecture. Planned packages:
    `core` (domain + ports), `adapter-jira`, `adapter-drive`,
    `adapter-sheets`, `cli`. `adapter-drive` was promoted to first
    class on 2026-05-28 alongside the repositioning; `adapter-sheets`
    stays in the list but serves the secondary aggregation surface.
  - The Python `automation/` codebase remains the **seed** of v2's
    `core` for the coordination side (`lib_transform.py` = pure
    domain; `fetch.py` = Jira adapter; `lib_sheets.py` = Sheets
    adapter; `payload.json` v2.0 = port contract; `run_local.py` =
    composition root). Porting is redesign with explicit vocabulary,
    not line-by-line translation. The production-side types
    (`Workspace`, `TaskManifest`) are new in v2 and have no Python
    precursor.
- **Target platforms:** Windows + macOS + Linux. v2 ships as CLI
  first (cross-platform by default); desktop UI reconnects on top of
  the CLI within ~3-4 months.
- **Active focus (Phase 1 — monorepo bootstrap):**
  1. TS monorepo stand-up: package layout, `tsconfig.json`s, build
     chain, `node:test`, `--version` working on `cli`.
  2. **No domain logic in Phase 1** — strict scope to prevent creep.
     Domain work lands in Phase 2.
  3. Doc refreshes (MENTOR_BRIEF §2, ROADMAP) ahead of code work.
- **Active architectural decisions (refresh as they evolve):**
  - **Two operating modes, same core (recorded 2026-05-15, refined
    2026-05-28):**
    - *Production mode (primary)* — each designer runs locally,
      scoped to their own tasks, files, and identity. `saci config`
      per-machine is a day-1 requirement (multi-tenant per machine,
      mono-user per instance). Tasks are portable via `TaskManifest`
      in their Drive folder; another designer can pick up a task
      with `saci load <drive-url>`.
    - *Coordination mode (secondary)* — production instances
      publish state to a Sheets aggregated view. Designers publish;
      they do not consume the Sheet back. Granularity (event /
      rollup / snapshot) is a Phase 4 modeling decision.
  - **CLI-first, desktop-later.** CLI is the canonical surface
    during core development (reduces iteration friction). Desktop UI
    (Electron host) reconnects on top within ~3-4 months — designers
    need the production flow soon and CLI alone is not enough for
    non-devs.
  - **First-class integrations: Jira REST direct + Google Drive.**
    Jira REST direct (Cowork-as-Jira-bridge reverted on 2026-05-15;
    token cost made it unsustainable). Drive promoted to first-class
    on 2026-05-28 because the production loop (find template, upload
    ship) is Drive-bound. Sheets is the secondary aggregation
    integration. JS libraries for Jira REST, Google Drive, and
    Google Sheets are pending research — required before their
    respective adapters, not before bootstrap.
  - **Node runtime target: ≥22.0.0** (pinned 2026-05-27 in task
    016). Saci v2 runs on Node 22 LTS — enables ESM import
    attributes (`with { type: "json" }`) and gives comfortable
    margin for Phase 3 production. Pinned in three places: root
    `package.json` `engines`, `.nvmrc` at repo root, and
    `packages/cli/package.json` `engines`.
  - **Verb allowlist as SSOT (canonicalized 2026-05-28).** The
    allowlist consumed by `pre-commit-self-audit` Check 3 and
    `brief-validator` Check C11 lives in
    `.claude/skills/pre-commit-self-audit/SKILL.md`. The validator
    greps it at runtime; it does not duplicate. Five verbs added on
    this date (`deprecate`, `promote`, `wire`, `declare`,
    `canonicalize`); four rejected with substitutions
    (`record`→`document`, `ignore`→`add`, `clean`→`remove`,
    `reduce`→`refactor`).
- **Active product direction (refreshed 2026-05-28):**
  - **Phase 2 designs `Workspace` and `TaskManifest`** as TS
    interfaces in `core`, in addition to porting `lib_transform.py`.
    Pure types only; serialization and persistence are Phase 3.
  - **Phase 3 is the product core** — local storage, primary command
    set (`fetch`, `list`, `start`, `ship`, `load`, `status`),
    3-level template match, pure Drive-path derivation, manifest
    read/write, `adapter-drive`, designer-friendly packaging.
    Designer-to-designer handoff is a primary use case.
  - **Phase 4 is the aggregation surface** — Sheets fed
    unidirectionally by production instances. Retires the Python
    `automation/` for coordination.
  - **Full v2 roadmap** with phases (tagged `[coord]` / `[prod]` per
    item), parking lot, and pending decisions: `docs/ROADMAP.md`.
    Legacy v1 phases are marked `superseded` in that file.

> ⚠️ This section ages fast. Update it after every significant milestone or pivot.
```

Verification:

- [ ] §2 starts with the heading `## 2. Where we are in the project`
- [ ] §2 ends with the warning blockquote
      (`> ⚠️ This section ages fast...`), byte-identical to before
      this edit
- [ ] The body content between matches the block above byte-for-byte
- [ ] §1 (above §2) is byte-identical to before
- [ ] §3 (`## 3. Observed patterns`) is byte-identical to before
- [ ] No other section of `docs/MENTOR_BRIEF.md` is modified
      (verify via `git diff docs/MENTOR_BRIEF.md` — only the §2 range
      appears)
- [ ] **§2-vs-main completeness check (mentor review guard):** confirm
      via `git diff docs/MENTOR_BRIEF.md` that no bullet present in §2
      on `main` was silently dropped by this wholesale replacement
      (the replacement is complete, not a memory reconstruction).
      Required preserved bullets: Node ≥22; verb allowlist SSOT; Jira
      REST direct; the package list (now including `adapter-drive`).
      If any pre-existing §2 bullet is missing from the block above,
      **STOP and report**.

Commit: `docs(mentor-brief): document §2 production-assistant focus`

(58 chars; ≤ 72 — re-verify with `pre-commit-self-audit` Check 1. Verb
`document` per the verb-allowlist SSOT; do NOT revert to `reposition`.
Body cross-references the 2026-05-28 mentor session and the new
Identity shifts entry in ROADMAP.)

### Automated checks (run before each commit)

- [ ] Pre-commit hook runs and passes (`.githooks/pre-commit` if
      present; `npm test` if a test script exists in the repo at
      HEAD). The brief touches docs only, so any test suite should
      remain green without intervention.

### Structural checks

- [ ] Expected files exist at expected paths:
  - `docs/tasks/017-repositioning-prod-assistant/brief.md`
  - `docs/ROADMAP.md` (modified)
  - `docs/MENTOR_BRIEF.md` (modified)
- [ ] No file outside the in-scope list was modified — verify with
      `git diff --name-only origin/main..HEAD` and confirm the output
      is exactly the three files above (in any order).

### Behavior checks (docs-only equivalent)

- [ ] `docs/ROADMAP.md` `## Identity shifts` lists three dated entries
      in chronological order: 2026-05-10, 2026-05-15, 2026-05-28.
- [ ] `docs/ROADMAP.md` Phase 3 heading is the new
      `### Phase 3 — Individual production assistant (product core) \`[prod]\``.
- [ ] `docs/MENTOR_BRIEF.md` §2 first bullet (after the heading) names
      Saci as "an **individual production assistant**".
- [ ] `docs/MENTOR_BRIEF.md` §2 package list reads
      `core` / `adapter-jira` / `adapter-drive` / `adapter-sheets` /
      `cli`.

### Git checks

- [ ] Branch used: `docs/repositioning-prod-assistant`
- [ ] Three commits total on the branch, in this order:
  1. `docs(tasks): add brief for 017-repositioning-prod-assistant`
  2. `docs(roadmap): document v2 repositioning as production assistant`
  3. `docs(mentor-brief): document §2 production-assistant focus`
- [ ] All commits follow Conventional Commits (G-R3)
- [ ] All commit verbs are in the `pre-commit-self-audit` SSOT
      allowlist (`add`, `document` confirmed; `reposition` is NOT —
      do not use it)
- [ ] All subject lines ≤ 72 chars (verified with
      `git log --format='%s' main..HEAD | awk '{ print length, $0 }'`)
- [ ] No `Co-authored-by` trailer in any commit (G-R3 / G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed (R17 / G-R5)

### Process checks

- [ ] Pause 1 — **skipped** (`Plan required: no`); justification below
- [ ] Pause 2 — first modified file shown for review before
      proceeding (always required; the first modified file here is
      `docs/ROADMAP.md` after Edit 2 completes, before Edit 3 starts)
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed commit
      message + `pre-commit-self-audit` output shown before each
      commit (always required)
- [ ] `pre-commit-self-audit` skill output reported in chat before
      each Pause 3 submission

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code):** **Skipped.** `Plan required: no`
  (justification below).
- **Pause 2 (after the first modified file):** **Required.** The
  first modified file here is `docs/ROADMAP.md`. After Edit 2 (all
  six sub-edits 2a-2f applied), stop and present the cumulative diff
  of `docs/ROADMAP.md` for review. Do not start Edit 3 until
  approved.
- **Pause 3 (before each commit):** **Required.** Show `git status`,
  `git diff --stat`, the proposed commit message, and the
  `pre-commit-self-audit` output. Three commits expected.

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document in
  `docs/GOTCHAS.md` as a follow-up brief.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: no` because:

- Every change is specified above with exact text snippets and
  verification checkboxes for each anchor.
- All architectural decisions are closed (D1–D8) in the Constraints
  section. Executor implements; does not propose alternatives.
- The judgment calls have explicit STOP-and-report fallbacks
  (out-of-scope guard in non-negotiable constraint #1; D8 sweep
  guard; the "if decision appears incoherent" guard above the D1–D8
  list; the 2e parking-lot STOP-and-confirm guard; the §2-vs-main
  completeness guard in Edit 3).
- The replacement targets (§2 in MENTOR_BRIEF; six anchored
  sub-edits in ROADMAP) are concrete and uniquely identifiable in
  the target files at HEAD.

**Pause 2 and Pause 3 remain required** regardless of
`Plan required` — Lesson #6 of `docs/AGENT_PLAYBOOK.md`.

## Git workflow

### Branch

```bash
git checkout main
git pull --ff-only origin main
git checkout -b docs/repositioning-prod-assistant
```

(The planner created this branch as part of authoring the brief; the
executor inherits it via `git status` / `git branch --show-current`
verification at session start.)

### Commit sequence

Three commits, in this order. Each touches a single thematic surface.

1. `docs(tasks): add brief for 017-repositioning-prod-assistant`
   — touches only
   `docs/tasks/017-repositioning-prod-assistant/brief.md` (new
   file). Created during Edit 1.
2. `docs(roadmap): document v2 repositioning as production assistant`
   — touches only `docs/ROADMAP.md`. Covers all six sub-edits
   2a → 2f as one atomic commit.
3. `docs(mentor-brief): document §2 production-assistant focus`
   — touches only `docs/MENTOR_BRIEF.md`. Covers Edit 3.

Each commit body explains *why* in 1-2 short paragraphs (G-R3,
G-R4). Commits 2 and 3 reference the 2026-05-28 mentor session
recap as authorization:
`docs/sessions/2026-05-28-mentor-saci-repositioning-individual-prod-assistant.md`.

All three subjects use allowlist verbs (`add`, `document`) and are
verified ≤ 72 chars; re-verify with `pre-commit-self-audit` Check 1
and Check 3 before each Pause 3.

### Push

**Do not push.** The user authorizes push explicitly per
`GIT_WORKFLOW.md` G-R5 / `CLAUDE.md` R17. If `/create-pr` is invoked,
treat as commit-only stop-and-report (memory:
`feedback_brief_overrides_create_pr`). After the third commit, report
and stop.

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules; especially R9 (English on the
   agent-consumed surface), R10 (Conventional Commits), R13 (no
   `--no-verify`), R14 (no behavior change — docs-only equivalent
   applies), R17 (no push).
2. `docs/GIT_WORKFLOW.md` — operational discipline; especially G-R3
   (Conventional Commits), G-R5 (push authorization), G-A7 (no
   `Co-authored-by`).
3. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points); Lesson #6
   (Pause 2 / Pause 3 required regardless of `Plan required`).
4. `.claude/skills/brief-template/SKILL.md` — template reference.
5. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit
   skill, run before each Pause 3 (Check 1 = subject length; Check 3
   = verb allowlist).
6. `docs/sessions/2026-05-28-mentor-saci-repositioning-individual-prod-assistant.md`
   — the mentor session that authorized this repositioning. Useful
   if any wording in the new entries feels under-specified.
7. `docs/tasks/008-v2-pivot-docs-refresh/brief.md` — precedent shape
   for ROADMAP + MENTOR_BRIEF §2 docs edits.
8. `docs/tasks/016-phase-1-monorepo-bootstrap/brief.md` — precedent
   for a docs edit landing via pipeline.

If anything in the references contradicts a specific instruction in
this brief, **STOP and report** rather than choosing a side. The
brief is the more recent decision; canonical docs may need a
follow-up update that this brief did not anticipate.

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (should show 3
   commits in the order specified above).
2. `git diff --stat origin/main...HEAD` (line counts per file).
3. Any verification checkbox from this brief that could not be met,
   with explanation — including the result of the 2e parking-lot
   STOP-and-confirm guard and the Edit 3 §2-vs-main completeness
   check.
4. Confirmation that no `git push` was executed.
5. Suggested next step: open PR on GitHub against `main` using the
   PR template; once merged, re-upload `docs/MENTOR_BRIEF.md` and
   `docs/ROADMAP.md` to the Claude.ai project knowledge before the
   next chat session that designs the Phase 2 technical brief.
