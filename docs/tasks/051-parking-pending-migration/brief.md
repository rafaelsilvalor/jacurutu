# Brief: 051 — Migrate the parking lot and pending decisions into exploration notes

> **Category:** L (doctrinal, caminho B)
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/parking-pending-migration`

---

## Context

Brief B of `docs/explorations/mentor-lane-and-task-identity.md` (D9, D13, §6):
`docs/explorations/` owns the state of each possibility; `docs/ROADMAP.md`
projects. This brief migrates the 21 entries of the ROADMAP's Parking lot (10)
and Pending decisions (11) into exploration notes under the contract brief 050
rewrote in `docs/explorations/README.md`, and turns both ROADMAP sections into
pointers at the folder. It is the product's own 2026-06-12 doctrine — one
surface holds state, the others read from it — applied to documentation.

Counts measured against disk on 2026-08-06 at `main@26272cb`:

```bash
awk '/^## Parking lot/,/^## Pending decisions/' docs/ROADMAP.md | grep -c '^- \*\*'   # 10
awk '/^## Pending decisions/,/^## Legacy/' docs/ROADMAP.md | grep -cE '^[0-9]+\. '     # 11
```

The source note's §5 says 22; the measured total is 21. The discrepancy is
recorded as an errata changelog line in Edit 4d, not by rewriting §5.

The in-scope pointer surface was derived by search, not enumerated from
memory. The command and its full classification are in D6.

## Goal

Every parking-lot and pending-decision entry lives as (or inside) an
exploration note carrying the README contract (header, disposition, changelog);
both ROADMAP sections point at `docs/explorations/` and list nothing; every
non-historical reference to the two sections as lists is repaired.

Out of scope:

- `docs/sessions/**` and `docs/tasks/**` (historical surfaces) — their
  references to "parking lot" / "pending decision #N" are records of what was
  said and stay verbatim. This brief's own folder is the only exception.
- `docs/explorations/mentor-lane-and-task-identity.md` beyond the single
  changelog line in Edit 4d — no §5 rewrite, no other body edit.
- Enriching migrated entries. A note's body is the migrated text verbatim plus
  the contract scaffolding (D2). No new analysis, no elaboration.
- Vocabulary uses of "parked"/"parking lot" that do not present the ROADMAP
  sections as lists — classified `keep` in D6. Notably `CLAUDE.md:18`
  (adapter-sheets) and `docs/MENTOR_BRIEF.md` §2 prose.
- The identifier cutover (brief C, slot 052) and everything else in the source
  note's decision sets.
- `docs/ROADMAP.md` phases, identity shifts, product map — untouched except
  the exact lines named in Edit 5.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified (complete list, also
   the Structural-check reference):
   - `docs/tasks/051-parking-pending-migration/brief.md` (new)
   - 15 new files under `docs/explorations/` (named in D1)
   - `docs/explorations/README.md`, `docs/explorations/desktop-ui-host.md`,
     `docs/explorations/drive-oauth.md`,
     `docs/explorations/mentor-lane-and-task-identity.md`
   - `docs/ROADMAP.md`
   - `CLAUDE.md`, `docs/PROCESS_MAP.md`, `docs/MENTOR_BRIEF.md`, `README.md`
   If anything else needs changing, **STOP and ask**.
2. Before Edit 1, create the work branch from the current HEAD
   (`main@26272cb`): `git switch -c docs/parking-pending-migration`. The
   `claude/*` worktree branch is session scaffolding (R11 / G-R2); no commit
   lands on it.
3. Follow all rules in `CLAUDE.md` (especially R9 — English-only under
   `docs/`, except the pt-BR edit in Edit 6d which lives in the pt-BR
   `README.md`; R17 — no push).
4. Follow `docs/GIT_WORKFLOW.md` fully: Conventional Commits (G-R3), no
   trailers (G-A7), commit freely, **DO NOT push** (G-R5). No STATE.md — the
   task is single-session.
5. Old-text blocks in Edits 4–6 must match the file on disk exactly. If any
   old-text block does not match, **STOP and report** — do not adapt it.
6. Green boundary at every Pause 3: run `npx tsc -b` and `npm test`, paste
   both results. No docs-only exemption.

### Conventions

- New note files: kebab-case, English, one topic per file
  (`docs/explorations/README.md` file contract).
- Migrated entry text is preserved **verbatim including its original list
  marker and line wrapping** — parking-lot entries keep their `- ` bullet,
  pending decisions keep their `N. ` number. The number is the historical
  identity of the entry; renumbering or unwrapping is falsification.
- Commit scopes: `tasks`, `explorations`, `roadmap`, or none (cross-file
  commit #6).

### Architectural decisions already made (do not revisit)

#### D1 — Grouping: 21 entries → 15 new notes + 2 absorptions (owner-ratified 2026-08-06)

Merge criterion: two entries share a note only when one entry's own text names
the other as its precondition. The full map:

| New file | Absorbs |
|---|---|
| `asset-browser-revival.md` | PL "Asset browser (v1 feature)" + PL "PSD diagnostics, mass audit, favorites" |
| `central-catalog.md` | PL "Central catalog API" + PL "Tags, comments, versioning" + PD #5 |
| `sheets-projection.md` | PL "Sheets one-way push" + PD #10 |
| `multi-source-adapters.md` | PL "Multi-source adapters" |
| `plugin-system.md` | PL "Plugin system" |
| `jira-write-back.md` | PL "Direct Jira write-back" |
| `docs-site.md` | PL "Docs site (Astro Starlight)" |
| `xlsx-export.md` | PL "XLSX export format" |
| `js-client-libraries.md` | PD #1 |
| `production-flow-abstraction.md` | PD #3 |
| `v1-v2-overlap.md` | PD #4 |
| `cli-library.md` | PD #6 |
| `versioning-policy.md` | PD #7 |
| `task-manifest-format.md` | PD #8 |
| `local-storage-format.md` | PD #9 |

Absorbed into existing notes: PD #2 → `desktop-ui-host.md` (its `Roadmap
link:` already names it); PD #11 → `drive-oauth.md` (already promoted to
brief 046). Total: 7 merged + 2 absorbed + 12 standalone = 21.

#### D2 — Verbatim bodies, nothing invented

A note's body is: one optional one-line merge/join sentence (merged notes
only), the migrated entry text verbatim, and at most one clearly-labeled
`Migration observation (2026-08-06):` line whose exact text this brief
specifies. Nothing else. The entries are one-liners by the old protocol; the
notes stay short. An executor adding analysis, background, or restated
context violates this brief.

#### D3 — Dispositions assigned at migration, ratified by this brief's approval

The owner gate on this brief is the ratification (source note D11). The
disposition of each note is fixed in its Edit block below. Summary: the eight
parking-lot-derived notes are `deferred`, each with the trigger its own text
declares (or the minimal trigger this brief states); the seven
decision-derived notes are `open` (#1, #3, #4, #8, #9) or `deferred` (#6,
#7 — both declare phase-anchored revisit triggers).

#### D4 — `Roadmap link:` format after migration

Migrated notes carry: `Roadmap link: migrated from ROADMAP <Parking lot |
Pending decisions #N> — 2026-08-06`. The README format line becomes
`Roadmap link: <ROADMAP item/phase reference | migrated-from origin | none>`.

#### D5 — Nothing deleted

PD #11's struck-through text and resolution move verbatim into
`drive-oauth.md`. The ROADMAP keeps zero entries; resolutions live on as
dated disposition transitions in note changelogs. This brief's D1 table is
the permanent map from "pending decision #N" to its note.

#### D6 — Pointer-repair surface, derived by search

```bash
grep -rniE "pending decision|parking.lot" --include="*.md" . | grep -vE "^\./(docs/sessions|docs/tasks|node_modules)"
```

Classification of every hit (line numbers as of `main@26272cb`):

| Hit | Class |
|---|---|
| `CLAUDE.md:129` | repair (Edit 6a) |
| `docs/PROCESS_MAP.md:42,57,286` | repair (Edit 6b) |
| `docs/MENTOR_BRIEF.md:171,267` | repair (Edit 6c) |
| `README.md:32` | repair (Edit 6d, pt-BR file) |
| `docs/explorations/README.md:48,83` | repair (Edit 4a) |
| `docs/explorations/desktop-ui-host.md:6` | repair (Edit 4b) |
| `docs/explorations/drive-oauth.md:7,154` | repair (Edit 4c) |
| `docs/ROADMAP.md:30,289–343,351,353,361–362` | repair (Edit 5) |
| `CLAUDE.md:18` | keep — "parking lot" as status vocabulary, not the section as a list |
| `docs/MENTOR_BRIEF.md:81,131,135` | keep — §2 prose about demotion/gating, vocabulary |
| `docs/ROADMAP.md:77,111` | keep — historical prose inside dated identity shifts |
| `docs/ROADMAP.md:269,287` | keep — they point at the section, which survives as a pointer |
| `docs/explorations/mentor-lane-and-task-identity.md:11,34–35,41,125` | keep — the note's own historical analysis; only the count errata (Edit 4d) is added |

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The user pre-saved this brief to
`docs/tasks/051-parking-pending-migration/brief.md` before invoking the
executor (caminho B). The executor verifies presence and commits.

- [ ] Branch `docs/parking-pending-migration` created from `26272cb` and
      checked out (constraint 2) before this commit
- [ ] Directory `docs/tasks/051-parking-pending-migration/` exists
- [ ] `brief.md` exists; first line matches the title above
- [ ] Commit #1: `docs(tasks): add brief for 051-parking-pending-migration`

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

### Edit 2 — Create the three merged notes

Create each file with exactly the content below.

#### 2a. `docs/explorations/asset-browser-revival.md`

```
# Asset browser revival

Status: exploration — no implementation mandate
Disposition: deferred — 2026-08-06; trigger: the asset browser view earning
its place inside v2
Origin: migrated from `docs/ROADMAP.md` Parking lot by brief 051
(2026-08-06); entry text preserved verbatim
Roadmap link: migrated from ROADMAP Parking lot — 2026-08-06

Two parking-lot entries merged into one note: the second exists only for the
case the first restores.

- **Asset browser (v1 feature)** — preserved as a candidate view inside v2 if it earns its place; not migrated automatically.
- **PSD diagnostics, mass audit, favorites** (from v1 roadmap) — preserved in case the asset browser view is restored.

## Changelog

- 2026-08-06 — migrated from the ROADMAP Parking lot (two entries) by
  brief 051; disposition set to `deferred`.
```

#### 2b. `docs/explorations/central-catalog.md`

```
# Central catalog

Status: exploration — no implementation mandate
Disposition: deferred — 2026-08-06; trigger: Estratégia central
infrastructure exists and volume justifies it
Origin: migrated from `docs/ROADMAP.md` Parking lot (two entries) and Pending
decisions #5 by brief 051 (2026-08-06); entry text preserved verbatim
Roadmap link: migrated from ROADMAP Parking lot and Pending decisions #5 —
2026-08-06

Three entries merged into one dependency chain: the feature set depends on
the catalog, and the catalog depends on the central infrastructure.

- **Central catalog API** — when Estratégia central infrastructure exists and volume justifies it (tens of thousands of files).
- **Tags, comments, versioning** — depend on central catalog.
5. **Estratégia central infrastructure** (carried from previous ROADMAP) — open item from MENTOR_BRIEF §2; tracked outside code.

## Changelog

- 2026-08-06 — migrated from the ROADMAP Parking lot (two entries) and
  Pending decisions #5 by brief 051; disposition set to `deferred`.
```

#### 2c. `docs/explorations/sheets-projection.md`

```
# Sheets projection

Status: exploration — no implementation mandate
Disposition: deferred — 2026-08-06; trigger: a concrete downstream consumer
exists (Looker Studio is the named candidate)
Origin: migrated from `docs/ROADMAP.md` Parking lot and Pending decisions #10
by brief 051 (2026-08-06); entry text preserved verbatim
Roadmap link: migrated from ROADMAP Parking lot and Pending decisions #10 —
2026-08-06

Two entries merged into one note: the granularity question designs a surface
that exists only if the push promotes.

- **Sheets one-way push** — publish a flat projection tab for a downstream
  reader; named future consumer: Looker Studio. Was the Phase 4 `adapter-sheets`
  item; demoted by the 2026-06-12 pivot. Promotes when a concrete consumer
  exists.
10. **Sheets aggregation granularity.** Per-event push, daily
    rollup, or point-in-time snapshot. Decided during Phase 4
    modeling when real usage data from Phase 3 informs the choice.

The Sheets half of [[js-client-libraries]] is gated on this promotion.

## Changelog

- 2026-08-06 — migrated from the ROADMAP Parking lot and Pending
  decisions #10 by brief 051; disposition set to `deferred`.
```

Verification:

- [ ] Three files exist; each first line matches its `# ` title above
- [ ] Each contains one `Disposition:` line and one `## Changelog` heading
- [ ] `grep -F "preserved as a candidate view inside v2" docs/explorations/asset-browser-revival.md` matches

Commit: `docs(explorations): add the three merged possibility notes`

### Edit 3 — Create the twelve standalone notes

Create each file with exactly the content below.

#### 3a. `docs/explorations/multi-source-adapters.md`

```
# Multi-source adapters

Status: exploration — no implementation mandate
Disposition: deferred — 2026-08-06; trigger: a concrete need to read a second
source beyond Jira
Origin: migrated from `docs/ROADMAP.md` Parking lot by brief 051
(2026-08-06); entry text preserved verbatim
Roadmap link: migrated from ROADMAP Parking lot — 2026-08-06

- **Multi-source adapters** — Figma (read), Drive (read/write), other input sources. Generalizing a `Source` interface beyond Jira.

## Changelog

- 2026-08-06 — migrated from the ROADMAP Parking lot by brief 051;
  disposition set to `deferred`.
```

#### 3b. `docs/explorations/plugin-system.md`

```
# Plugin system

Status: exploration — no implementation mandate
Disposition: deferred — 2026-08-06; trigger: a second concrete extension case
appears (declared in the entry)
Origin: migrated from `docs/ROADMAP.md` Parking lot by brief 051
(2026-08-06); entry text preserved verbatim
Roadmap link: migrated from ROADMAP Parking lot — 2026-08-06

- **Plugin system** — dev-authored (Neovim-style), not end-user marketplace. Surfaces when a second concrete extension case appears.

## Changelog

- 2026-08-06 — migrated from the ROADMAP Parking lot by brief 051;
  disposition set to `deferred`.
```

#### 3c. `docs/explorations/jira-write-back.md`

```
# Direct Jira write-back

Status: exploration — no implementation mandate
Disposition: deferred — 2026-08-06; trigger: Phase 4 shipped (declared in the
entry)
Origin: migrated from `docs/ROADMAP.md` Parking lot by brief 051
(2026-08-06); entry text preserved verbatim
Roadmap link: migrated from ROADMAP Parking lot — 2026-08-06

- **Direct Jira write-back** — currently parked; the coordination pipeline reads Jira but doesn't write. Evaluate after Phase 4 ships.

## Changelog

- 2026-08-06 — migrated from the ROADMAP Parking lot by brief 051;
  disposition set to `deferred`.
```

#### 3d. `docs/explorations/docs-site.md`

```
# Docs site (Astro Starlight)

Status: exploration — no implementation mandate
Disposition: deferred — 2026-08-06; trigger: owner demand after Phase 1
closes
Origin: migrated from `docs/ROADMAP.md` Parking lot by brief 051
(2026-08-06); entry text preserved verbatim
Roadmap link: migrated from ROADMAP Parking lot — 2026-08-06

- **Docs site (Astro Starlight)** — post-Phase-1 tooling task; enters as a workspace, same npm/TS ecosystem as v2 monorepo.

## Changelog

- 2026-08-06 — migrated from the ROADMAP Parking lot by brief 051;
  disposition set to `deferred`.
```

#### 3e. `docs/explorations/xlsx-export.md`

```
# XLSX export format

Status: exploration — no implementation mandate
Disposition: deferred — 2026-08-06; trigger: a demand for the format arrives;
promotion also requires the runtime-dependency (R2) decision declared in the
entry
Origin: migrated from `docs/ROADMAP.md` Parking lot by brief 051
(2026-08-06); entry text preserved verbatim
Roadmap link: migrated from ROADMAP Parking lot — 2026-08-06

- **XLSX export format** — a second export format beyond CSV + JSON, gated on a
  separate runtime-dependency (R2) decision. Promotes when demanded.

## Changelog

- 2026-08-06 — migrated from the ROADMAP Parking lot by brief 051;
  disposition set to `deferred`.
```

#### 3f. `docs/explorations/js-client-libraries.md`

```
# JS client libraries (Jira REST, Google Sheets)

Status: exploration — no implementation mandate
Disposition: open — 2026-08-06
Origin: migrated from `docs/ROADMAP.md` Pending decisions #1 by brief 051
(2026-08-06); entry text preserved verbatim
Roadmap link: migrated from ROADMAP Pending decisions #1 — 2026-08-06

1. **JS libraries for Jira REST and Google Sheets.** Equivalents to Python's `requests` and `gspread` not yet researched. Required before Phase 4 starts; not blocking Phases 1-3. The Google Sheets (gspread-equivalent) half is no longer pre-Phase-4: after the 2026-06-12 pivot, Sheets is a parking-lot consumer, so its library choice is gated on that promotion, not on Phase 4 start.

Migration observation (2026-08-06): the Jira half is answered by shipped
code — `adapter-jira` implements `JiraGateway` against the REST API over raw
global `fetch`, no client library (`CLAUDE.md`, Architecture). The Sheets
half is gated on the [[sheets-projection]] promotion, as the entry already
states.

## Changelog

- 2026-08-06 — migrated from the ROADMAP Pending decisions #1 by brief 051;
  disposition set to `open`.
```

#### 3g. `docs/explorations/production-flow-abstraction.md`

```
# ProductionFlow / Workspace abstraction

Status: exploration — no implementation mandate
Disposition: open — 2026-08-06
Origin: migrated from `docs/ROADMAP.md` Pending decisions #3 by brief 051
(2026-08-06); entry text preserved verbatim
Roadmap link: migrated from ROADMAP Pending decisions #3 — 2026-08-06

3. **`ProductionFlow` / `Workspace` exact abstraction.** Likely surfaces during Phase 2 port; refined in Phase 3 design.

Migration observation (2026-08-06): the planned `Workspace` type was dropped
in the brief-031 design (`docs/ROADMAP.md`, Phase 2 Goal note).

## Changelog

- 2026-08-06 — migrated from the ROADMAP Pending decisions #3 by brief 051;
  disposition set to `open`.
```

#### 3h. `docs/explorations/v1-v2-overlap.md`

```
# v1 ↔ v2 overlap coordination

Status: exploration — no implementation mandate
Disposition: open — 2026-08-06
Origin: migrated from `docs/ROADMAP.md` Pending decisions #4 by brief 051
(2026-08-06); entry text preserved verbatim
Roadmap link: migrated from ROADMAP Pending decisions #4 — 2026-08-06

4. **Coordination of v1 ↔ v2 during overlap.** While v2's Phase 4 is unfinished, Python `automation/` runs coord mode. Decide: keep automation untouched, or accept small patches? Default: untouched.

## Changelog

- 2026-08-06 — migrated from the ROADMAP Pending decisions #4 by brief 051;
  disposition set to `open`.
```

#### 3i. `docs/explorations/cli-library.md`

```
# CLI library — final choice

Status: exploration — no implementation mandate
Disposition: deferred — 2026-08-06; trigger: the Phase 2→3 transition brings
real commands (declared in the entry)
Origin: migrated from `docs/ROADMAP.md` Pending decisions #6 by brief 051
(2026-08-06); entry text preserved verbatim
Roadmap link: migrated from ROADMAP Pending decisions #6 — 2026-08-06

6. **CLI library — final choice.** Phase 1 uses the `node:util` `parseArgs`
   builtin (D4). Revisit at the Phase 2→3 transition when production flow
   brings real commands — choice between `commander`, `citty`, or
   continuing with the builtin will be informed by real usage data.

## Changelog

- 2026-08-06 — migrated from the ROADMAP Pending decisions #6 by brief 051;
  disposition set to `deferred`.
```

#### 3j. `docs/explorations/versioning-policy.md`

```
# Versioning policy

Status: exploration — no implementation mandate
Disposition: deferred — 2026-08-06; trigger: Phase 4 adapter stability
provides input (declared in the entry)
Origin: migrated from `docs/ROADMAP.md` Pending decisions #7 by brief 051
(2026-08-06); entry text preserved verbatim
Roadmap link: migrated from ROADMAP Pending decisions #7 — 2026-08-06

7. **Versioning policy.** Phase 1–3 use `"version": "0.0.0"` on every
   `package.json` plus git tags on the root (D5). Decide single vs.
   independent vs. continued defer in Phase 4 when adapter stability
   provides input.

## Changelog

- 2026-08-06 — migrated from the ROADMAP Pending decisions #7 by brief 051;
  disposition set to `deferred`.
```

#### 3k. `docs/explorations/task-manifest-format.md`

```
# TaskManifest format

Status: exploration — no implementation mandate
Disposition: open — 2026-08-06
Origin: migrated from `docs/ROADMAP.md` Pending decisions #8 by brief 051
(2026-08-06); entry text preserved verbatim
Roadmap link: migrated from ROADMAP Pending decisions #8 — 2026-08-06

8. **`TaskManifest` format.** Exact JSON shape of the manifest file
   that lives in each task's Drive folder: required fields, optional
   fields, versioning strategy, file name convention (`.saci.json`
   or similar). Designed in Phase 2 (type) and finalized in Phase 3
   (serialization).

Migration observation (2026-08-06): the Phase 2 half is done —
`TaskManifest` shipped as a TS interface in brief 031 (`docs/ROADMAP.md`,
Phase 2 exit criterion); the Phase 3 serialization half remains open.

## Changelog

- 2026-08-06 — migrated from the ROADMAP Pending decisions #8 by brief 051;
  disposition set to `open`.
```

#### 3l. `docs/explorations/local-storage-format.md`

```
# Local storage format

Status: exploration — no implementation mandate
Disposition: open — 2026-08-06
Origin: migrated from `docs/ROADMAP.md` Pending decisions #9 by brief 051
(2026-08-06); entry text preserved verbatim
Roadmap link: migrated from ROADMAP Pending decisions #9 — 2026-08-06

9. **Local storage format.** On-disk layout for the two data
   categories (Jira mirror — overwritable; production state — never
   overwritten by fetch). SQLite, JSON files per task, or a hybrid.
   Decided at Phase 3 start.

## Changelog

- 2026-08-06 — migrated from the ROADMAP Pending decisions #9 by brief 051;
  disposition set to `open`.
```

Verification:

- [ ] Twelve files exist; each first line matches its `# ` title above
- [ ] `ls docs/explorations/ | wc -l` returns 19 (15 new + 3 pre-existing
      notes + README.md)
- [ ] `grep -L "Disposition:" docs/explorations/*.md` returns only
      `docs/explorations/README.md`
- [ ] `grep -cL "## Changelog" docs/explorations/*.md` — every note file has
      one (README excluded from the requirement)

Commit: `docs(explorations): add the twelve standalone possibility notes`

### Edit 4 — Update the contract and the legacy notes

#### 4a. `docs/explorations/README.md` — two edits

Old (in "Status and dispositions"):

```
This folder owns the state of each possibility, and `docs/ROADMAP.md` is to
project it. The pattern is the product's own doctrine, applied to
documentation: one surface holds state, the others read from it. A
hand-maintained index here would be the second registry this contract exists to
prevent — once the projection lands, the ROADMAP points at the folder, not at a
list of its files. That projection does not exist yet: brief B migrates the
parking-lot and pending-decision entries into notes and turns both sections
into pointers, and until it merges the ROADMAP does not reference this folder
at all.
```

New:

```
This folder owns the state of each possibility, and `docs/ROADMAP.md`
projects it. The pattern is the product's own doctrine, applied to
documentation: one surface holds state, the others read from it. A
hand-maintained index here would be the second registry this contract exists
to prevent — the ROADMAP points at the folder, not at a list of its files.
The projection landed with brief 051 (2026-08-06): the former parking-lot and
pending-decision entries live here as notes, and both ROADMAP sections are
pointers.
```

Old (in "File contract"):

```
Roadmap link: <parking lot entry | pending decision # | none>
```

New:

```
Roadmap link: <ROADMAP item/phase reference | migrated-from origin | none>
```

#### 4b. `docs/explorations/desktop-ui-host.md` — header to the 050 contract, absorb PD #2

Old (lines 3–7):

```
Status: exploration — possibilities only, NOT a commitment or spec
Origin: mentor session 2026-08-03 (UI host evaluation; mode: exploring
possibilities). No source documents outside the conversation.
Roadmap link: pending decision #2 (designer-friendly packaging format);
Phase 3 packaging item; Phase 5 (Desktop UI on top of CLI)
```

New:

```
Status: exploration — no implementation mandate
Disposition: open — 2026-08-06
Origin: mentor session 2026-08-03 (UI host evaluation; mode: exploring
possibilities). No source documents outside the conversation. Absorbed
pending decision #2 at its 2026-08-06 migration (brief 051).
Roadmap link: absorbed ROADMAP Pending decisions #2 (designer-friendly
packaging format) — 2026-08-06; Phase 3 packaging item; Phase 5 (Desktop UI
on top of CLI)
```

Insert immediately before `## Changelog`:

```
## Absorbed roadmap entry (2026-08-06, brief 051)

2. **Designer-friendly packaging format.** Installer? Portable? Per-OS variants? Deferred to Phase 3 planning.
```

Append to `## Changelog`:

```
- 2026-08-06 — header updated to the 050 contract (disposition `open`);
  absorbed pending decision #2 at its migration (brief 051).
```

#### 4c. `docs/explorations/drive-oauth.md` — header to the 050 contract, absorb PD #11, fix the #4 pointer

Old (lines 3–8):

```
Status: exploration — possibilities only, NOT a commitment or spec
Promotion: promoted to brief 046 — 2026-07-27
Origin: Python-era `automation/` guide (owner-supplied); absorbed in the
mentor session 2026-07-27 (`ship` semantics exploration)
Roadmap link: pending decision #11 (Google Drive JS library); feeds the
adapter-drive spike (slot 046 candidate)
```

New:

```
Status: exploration — no implementation mandate
Disposition: promoted to brief 046 — 2026-07-27
Origin: Python-era `automation/` guide (owner-supplied); absorbed in the
mentor session 2026-07-27 (`ship` semantics exploration)
Roadmap link: absorbed ROADMAP Pending decisions #11 (Google Drive JS
library, resolved 2026-07-27) — 2026-08-06; fed the adapter-drive spike
(brief 046)
```

Old (§7 v2 addendum, last sentence):

```
The Python pipeline's Service Account stays
untouched (ROADMAP pending decision #4 default).
```

New:

```
The Python pipeline's Service Account stays
untouched (the [[v1-v2-overlap]] note's default).
```

Insert immediately before `## Changelog`:

```
## Absorbed roadmap entry (2026-08-06, brief 051)

11. ~~**Google Drive JS library.** Equivalent for Drive read / write
    (templates, manifests, ship uploads). Not yet researched.
    Required before Phase 3 `adapter-drive` work; not blocking
    Phase 2.~~ — *resolved 2026-07-27: googleapis + google-auth-library
    with scopes drive.file + drive.metadata.readonly (brief 046, see
    `docs/tasks/046-spike-adapter-drive/notes.md`)*
```

Append to `## Changelog`:

```
- 2026-08-06 — header updated to the 050 contract (`Promotion:` line renamed
  to `Disposition:`, same value); absorbed the resolved pending decision #11
  at its migration (brief 051).
```

#### 4d. `docs/explorations/mentor-lane-and-task-identity.md` — count errata

Append to `## Changelog`:

```
- 2026-08-06 — brief 051 measured the §5 migration surface at 21 ROADMAP
  entries (10 parking lot + 11 pending decisions), not 22.
```

Verification:

- [ ] Every old-text block above matched disk exactly before replacement
- [ ] `grep -c "possibilities only, NOT a commitment" docs/explorations/*.md`
      returns matches only in `mentor-lane-and-task-identity.md` (out of
      scope, Edit 4d only)
- [ ] `grep -rn "pending decision #" docs/explorations/` — remaining hits are
      only in `mentor-lane-and-task-identity.md` (historical analysis) and
      inside the two `Absorbed roadmap entry` / `Roadmap link:` blocks that
      record the migration itself

Commit: `docs(explorations): update the contract and the legacy notes`

### Edit 5 — `docs/ROADMAP.md`: both sections become pointers

#### 5a. Pointer index line

Old:

```
- **Phases, pending decisions, identity shifts** — this ROADMAP, below.
```

New:

```
- **Phases and identity shifts** — this ROADMAP, below.
- **Possibility state (parked ideas, open decisions)** — `docs/explorations/`, one note per topic.
```

#### 5b. Replace the `## Parking lot` section body

Old: everything from the line after `## Parking lot` down to (not including)
`## Pending decisions` — the preamble line and all 10 bullets.

New:

```

Ideas anchored but unscheduled live as exploration notes in
`docs/explorations/` — since brief 051 (2026-08-06) that folder owns each
possibility's state (disposition, trigger, changelog) under the contract in
`docs/explorations/README.md`; this file only points. New ideas start as a
note there, not as a line here.

```

#### 5c. Replace the `## Pending decisions` section body

Old: everything from the line after `## Pending decisions` down to (not
including) `## Legacy / superseded — Saci-Electron-v1 phases` — the preamble
line and all 11 numbered items (including struck-through #11).

New:

```

Open questions that gate or shape upcoming phases live in the same
`docs/explorations/` notes: each question carries its disposition and its
resolution history. Resolutions are recorded as dated disposition transitions
in the note's changelog, never by deletion. The numbered list that lived here
(decisions #1–#11) migrated into notes on 2026-08-06; the D1 table of
`docs/tasks/051-parking-pending-migration/brief.md` maps each number to its
note.

```

#### 5d. Update protocol bullets

Old:

```
- New ideas → **Parking lot** with a one-line rationale. Do not enrich parking-lot entries beyond a line until they are nominated for promotion.
- Resolved pending decisions → strike through with date and a one-line resolution (`~~Decision text~~ — *resolved 2026-XX-XX: <outcome>*`). Do not delete; they form the history.
```

New:

```
- New ideas and new open decisions → a note in `docs/explorations/` under its README contract (header, disposition, changelog). This file is not the surface for them; the two pointer sections above list nothing.
- Resolving a decision → a dated disposition transition in the note's changelog (`docs/explorations/README.md`). Do not delete notes; they form the history.
```

#### 5e. Legacy present-tense claims

Old:

```
- ~~**Phase 4 — Multi-source abstraction**~~ — superseded; the `Source` interface idea survives in the v2 Parking lot.
```

New:

```
- ~~**Phase 4 — Multi-source abstraction**~~ — superseded; the `Source` interface idea survives in `docs/explorations/multi-source-adapters.md`.
```

Old:

```
- ~~**Phase 6 — Plugin maturation & central API**~~ — superseded; survives in v2 Parking lot.
```

New:

```
- ~~**Phase 6 — Plugin maturation & central API**~~ — superseded; survives in `docs/explorations/plugin-system.md` and `docs/explorations/central-catalog.md`.
```

#### 5f. References section

After the line `- \`docs/tasks/<NNN>-<slug>/\` — per-task briefs; written when
a task is about to start.` insert:

```
- `docs/explorations/` — possibility state (parked ideas, open decisions); read its README contract first.
```

Verification:

- [ ] `awk '/^## Parking lot/,/^## Pending decisions/' docs/ROADMAP.md | grep -c '^- \*\*'`
      returns 0
- [ ] `awk '/^## Pending decisions/,/^## Legacy/' docs/ROADMAP.md | grep -cE '^[0-9]+\. '`
      returns 0
- [ ] `grep -c 'docs/explorations/' docs/ROADMAP.md` returns 6 (pointer
      index, both section bodies, two update-protocol bullets counted as
      written, references) — recount against the final text and report the
      actual number with the command output
- [ ] Lines classified `keep` in D6 (`docs/ROADMAP.md:77,111,269,287` at old
      numbering) are untouched

Commit: `docs(roadmap): migrate the two possibility sections to pointers`

### Edit 6 — External pointers

#### 6a. `CLAUDE.md` (Related Documents)

Old:

```
- `docs/ROADMAP.md` — product roadmap (phases, milestones, parking lot, pending decisions); ages in sync with `MENTOR_BRIEF.md` §2
```

New:

```
- `docs/ROADMAP.md` — product roadmap (phases, milestones; parked ideas and open decisions live as notes in `docs/explorations/`); ages in sync with `MENTOR_BRIEF.md` §2
```

#### 6b. `docs/PROCESS_MAP.md` — three lines

Old:

```
- `docs/ROADMAP.md` — phases, parking lot, pending decisions. Read before proposing anything forward-looking.
```

New:

```
- `docs/ROADMAP.md` — phases and identity shifts. Read before proposing anything forward-looking, together with `docs/explorations/` for parked ideas and open decisions.
```

Old:

```
  ROADMAP.md                   phases, parking lot, pending decisions
```

New:

```
  ROADMAP.md                   phases, identity shifts (possibility state: explorations/)
```

Old:

```
| `docs/ROADMAP.md` | phases, parking lot, pending decisions |
```

New:

```
| `docs/ROADMAP.md` | phases, identity shifts; possibility state lives in `docs/explorations/` |
```

#### 6c. `docs/MENTOR_BRIEF.md` — two edits

Old:

```
  - **Full v2 roadmap** with phases (tagged `[coord]` / `[prod]` per
    item), parking lot, and pending decisions: `docs/ROADMAP.md`.
    Legacy v1 phases are marked `superseded` in that file.
```

New:

```
  - **Full v2 roadmap** with phases (tagged `[coord]` / `[prod]` per
    item): `docs/ROADMAP.md`. Parked ideas and open decisions live as
    notes in `docs/explorations/` (brief 051). Legacy v1 phases are
    marked `superseded` in that file.
```

Old:

```
| `docs/ROADMAP.md` | Both — product roadmap (phases, milestones, parking lot, pending decisions) |
```

New:

```
| `docs/ROADMAP.md` | Both — product roadmap (phases, milestones; possibility state in `docs/explorations/`) |
```

#### 6d. `README.md` (pt-BR user-facing; minimal in-place edit, language kept)

Old (final sentence of the Roadmap summary paragraph):

```
Os itens antes listados aqui (diagnóstico de PSD, auditoria em massa, favoritos) ficam preservados no parking lot do roadmap canônico.
```

New:

```
Os itens antes listados aqui (diagnóstico de PSD, auditoria em massa, favoritos) ficam preservados como nota de exploração (`docs/explorations/asset-browser-revival.md`).
```

Verification:

- [ ] Re-run the D6 search and classify every hit: each `repair` hit is gone
      or rewritten as specified; each `keep` hit is byte-identical to before.
      Paste the classified output — enumeration, not a green/red sweep.

Commit: `docs: update the parking-lot pointers across the doc surface`

### Commit sequence

1. `docs(tasks): add brief for 051-parking-pending-migration`
2. `docs(explorations): add the three merged possibility notes`
3. `docs(explorations): add the twelve standalone possibility notes`
4. `docs(explorations): update the contract and the legacy notes`
5. `docs(roadmap): migrate the two possibility sections to pointers`
6. `docs: update the parking-lot pointers across the doc surface`

All subjects ≤ 72 chars; verbs `add` / `update` / `migrate` are on the
allowlist SSOT (`.claude/skills/pre-commit-self-audit/SKILL.md`).

### Automated checks (run before each commit)

- [ ] `npx tsc -b` passes
- [ ] `npm test` passes

### Structural checks

- [ ] `git diff --name-only main..HEAD | sort` equals exactly the 25-file
      in-scope list (constraint 1: 1 brief + 15 new notes + 4 explorations
      files + `docs/ROADMAP.md` + 4 pointer files)
- [ ] Every new note opens with its `# ` title and the four contract header
      lines, and ends with `## Changelog`

### Behavior checks

- [ ] Both awk entry counts (Context) return 0 against the final
      `docs/ROADMAP.md`
- [ ] Every entry text is findable verbatim in its note:
      `grep -F "<distinctive fragment>" docs/explorations/<file>` for each of
      the 21 entries (the executor picks one distinctive fragment per entry
      and pastes the 21 grep results)
- [ ] The D6 re-run classification (Edit 6 verification) is pasted in full

### Git checks

- [ ] Branch used: `docs/parking-pending-migration`, created from `26272cb`
- [ ] Commits follow Conventional Commits (G-R3); subjects ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 2 — first created note shown in full before proceeding (it fixes
      the format for the other fourteen)
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message +
      `pre-commit-self-audit` output before each commit
- [ ] Errata found mid-run that change nothing shipping are batched for one
      errata commit at the end, not amend-cycled (owner ruling)
- [ ] If any criterion could not be met, it was reported explicitly

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1:** skipped — `Plan required: no`.
- **Pause 2 (after the first created note):** show the file and wait for
  review. **Always required.**
- **Pause 3 (before each commit):** show `git status` + `git diff --stat` +
  proposed message + `pre-commit-self-audit` output. **Always required.**

In case of:

- Old-text mismatch against disk → STOP and report (constraint 5).
- Unrelated bug found → report and ask. Do not fix.
- Undocumented gotcha discovered → report; document as a follow-up.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

- Every file creation carries its full content; every modification carries
  exact old → new text read from disk at authoring time.
- All decisions are closed as D1–D6 (grouping, verbatim rule, dispositions,
  link format, preservation, scope classification).
- The one judgment surface (old-text mismatch) has an explicit STOP fallback.

**Pause 2 and Pause 3 remain required** — Lesson #6 of
`docs/AGENT_PLAYBOOK.md`.

## Reference documents (read before starting)

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/explorations/README.md` — the note contract this brief writes against
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
5. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit (Pause 3)
6. `docs/explorations/mentor-lane-and-task-identity.md` — the source note
   (D9–D13); context only, this brief is the mandate

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD`
2. `git diff --stat main...HEAD`
3. The 21 verbatim-fragment grep results and the D6 re-run classification
4. Any verification checkbox that could not be met, with explanation
5. Confirmation that no `git push` was executed
6. Suggested next step (recaps, then closer Phase A on owner instruction)
