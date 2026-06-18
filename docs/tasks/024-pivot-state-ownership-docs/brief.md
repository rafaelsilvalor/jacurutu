# Brief: 024 — Pivot docs (application owns state) — ROADMAP + MENTOR_BRIEF §2

> **Category:** M
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/pivot-state-ownership`
>
> Caminho B: this brief is pre-saved to disk by the user. The executor verifies
> it is present and commits it as commit #1, then applies the edits. Pasteable
> executor prompt: `Task: docs/tasks/024-pivot-state-ownership-docs/brief.md.`
> `Read it in full and execute.`

---

## Context

Brief 023 (PR #55, `main@6f54e3b`) closed a product pivot in chat but
deliberately did **not** touch the canonical docs: **the application — not the
Google Sheet — owns production state.** A spreadsheet is demoted from a
state-holding surface to one optional one-way projection target among others
(flat files, BI platforms). Grounding fact: there are no production users of the
Python `automation/` today, so `sync.py` / `lib_sheets.py` carry no
behavior-preserving mandate — they are legacy reference only.

`docs/ROADMAP.md` §Phase 4 and `docs/MENTOR_BRIEF.md` §2 still describe the prior
framing (Sheets-publish coordination pipeline as a phase; `adapter-sheets` as a
planned package). This staleness blocks new delegation: the planner grounds task
scope against the ROADMAP, and a stale ROADMAP grounds the wrong target. This
docs PR reconciles both files to the pivot. No code is touched.

The ROADMAP update protocol requires ROADMAP and MENTOR_BRIEF §2 to move
together in the same PR — they are a pair.

## Goal

1. Record the 2026-06-12 pivot in `docs/ROADMAP.md`:
   - a new dated subsection under `## Identity shifts`;
   - Phase 4 rescoped (Sheets-publish demoted; coordination becomes a reader of
     app-owned shared state);
   - Phase 3 gains a named "CLI human-facing display" item and a state/history
     note;
   - parking-lot entries for the demoted Sheets push and the deferred XLSX
     format;
   - one annotation on the JS-libraries pending decision.
2. Update `docs/MENTOR_BRIEF.md` §2 to record the same pivot in the active
   architectural decisions and demote `adapter-sheets` from the planned-packages
   line.

Out of scope (STOP and surface if any of these is touched):

- Any file other than `docs/ROADMAP.md`, `docs/MENTOR_BRIEF.md`, and this brief.
- `CLAUDE.md` — its v1-era Architecture section is separately stale; not this PR.
- Any code, test, or `automation/**` file.
- Re-titling or re-numbering phases beyond Phase 3 and Phase 4.

## Constraints

### Non-negotiable constraints

1. Only these paths may be created or modified:
   - `docs/tasks/024-pivot-state-ownership-docs/brief.md` (this brief; commit #1)
   - `docs/ROADMAP.md`
   - `docs/MENTOR_BRIEF.md`
   Any write outside these → **STOP and surface** (Judgment Flag 3).
2. English only (R9 / M-R10): both files are agent-consumed canonical docs.
3. Follow `CLAUDE.md` and `docs/GIT_WORKFLOW.md` in full: new branch,
   Conventional Commits (`docs:` type), commit freely, **do not push**, STATE.md
   at session end if the workflow uses it.
4. **Find-block discipline (find-block mismatch hazard).** Every "Locate" anchor
   below is the mentor's best transcription, not a guaranteed byte-exact match.
   Before applying any sub-edit, confirm the located text exists in the file as
   described. If a heading, boundary, or anchor does **not** match, **STOP and
   report the actual text** — do not guess, do not regenerate from memory.
5. Additive replacement text below is byte-exact as authored. Preserve it
   verbatim except for trivial wrapping the file's existing style requires.

### Decisions already closed (do not revisit)

Closed in chat across briefs 023 and this session. The executor implements; it
does not propose alternatives.

- **The application owns production state** (local now, remote later).
- **A spreadsheet is one one-way projection target among others** — not a
  state-holding surface.
- **`sync.py` / `lib_sheets.py` are legacy reference only** — no production
  users, no behavior-preserving mandate; the sync diff engine is never ported.
- **Export is a fact table** — one row per issue, zero aggregation; aggregation
  and history belong to the BI layer and to Phase 3 state.
- **`adapter-sheets` moves to the parking lot** — built only when a concrete
  consumer (e.g. Looker Studio) exists.
- **XLSX export is deferred** behind a separate runtime-dependency (R2) decision;
  v1 export formats stay CSV + JSON.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

P4 numbering evidence (recorded; confirm against the three sources at the
machine before trusting `024`):

- `ls docs/tasks/` — highest existing slot should be `023-payload-export`.
- `git log --oneline main` — most recent merged work should be 023 (PR #55,
  `6f54e3b`); no merged-but-invisible brief at a higher slot.
- `CLAUDE.md` `E*` block — exceptions stop at `E5`; no nominal slot reservation
  there. The 024 candidates (argv dispatch, Phase 3 state, AGENT_PLAYBOOK meta)
  are informal forward reserves, not nominal — none claims `024`.

- [ ] Directory `docs/tasks/024-pivot-state-ownership-docs/` exists
- [ ] `docs/tasks/024-pivot-state-ownership-docs/brief.md` exists; first line
      matches the title above
- [ ] If `ls docs/tasks/` or `git log` shows `024` already taken → **STOP**

Commit the brief as commit #1: `docs(tasks): add brief 024 pivot docs`.

### Edit 2 — `docs/ROADMAP.md`

One commit. Five sub-edits, applied in order.

#### 2a — New identity-shift subsection

Locate the subsection `### 2026-05-28 — Coordination pipeline → individual
production assistant` and find where it ends (immediately before the next `##`
section, e.g. `## Phase 1` / the first phase heading). Insert the following
block as the **last** subsection under `## Identity shifts`, after the
2026-05-28 subsection and before the next `##` section. STOP if the 2026-05-28
subsection is not found.

```markdown
### 2026-06-12 — Coordination state in the Sheet → the application owns state

The 2026-05-28 repositioning made production primary and coordination a
secondary aggregated view, but it still treated the Google Sheet as the surface
that *held* coordination state: designer instances published into it. Brief 023
closed a sharper pivot — **the application owns production state** (local now,
remote later). A spreadsheet is no longer a state-holding surface; it becomes
**one optional one-way projection target among others** (flat files, BI
platforms).

Grounding fact: there are no production users of the Python `automation/` today,
so `sync.py` / `lib_sheets.py` carry no behavior-preserving mandate — they are
legacy reference only. The sync diff engine (cell ownership, write-conditionals,
formulas) existed solely because the Sheet held state; with the app owning
state, none of it is ported. What survives is the issue → row projection, now
`packages/core/src/export.ts` (shipped in brief 023).

The real target surfaced: feeding BI dashboards (Looker Studio / Power BI /
Grafana) and consolidating production across designers over time. Export is a
**fact table**; aggregation and history accumulation belong to the BI layer and
to Phase 3 state, not to the export. Phase 4 is rescoped accordingly and
`adapter-sheets` moves to the parking lot.
```

#### 2b — Rescope Phase 4

Locate the Phase 4 section. Its heading currently reads
`### Phase 4 — Coordination as aggregated view ` followed by an inline-code
`[coord]` tag. Replace the **entire** Phase 4 section — from that `### Phase 4`
heading through the end of its block (up to, but not including, the next
`### Phase 5` heading) — with the block below. STOP if the Phase 4 heading text
differs materially from the above or if the Phase 5 boundary is not found.

```markdown
### Phase 4 — Shared state and the coordination view `[coord]`

**Goal:** the app-owned production state becomes shareable across designer
instances, and the team-level coordination view is rebuilt as a **reader of a
projection off that shared state** — never a state holder. The Python
`automation/` retires once a coordination consumer reads Saci's state instead of
the legacy Sheet.

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
a projection of app-owned shared state; the Python `automation/` is archived.

**Dependencies:** Phase 3 — there is no shared state to consolidate until
production instances own and accumulate state at runtime. Phase 4 follows
Phase 3.
```

#### 2c — Phase 3 additions

Locate the Phase 3 section and its `**Items:**` list. Append the following two
bullets to the end of the Phase 3 items list, preserving the existing `[prod]`
tag style. STOP if the Phase 3 items list cannot be located.

```markdown
- `[prod]` CLI human-facing display — a read-side command that renders the
  current open demands to the terminal for a person to read. Distinct from the
  machine-readable export (`runExport`); the export feeds files and BI, the
  display feeds the operator's eyes.
- `[prod]` State and history accumulation — the app owns production state over
  time (not just point-in-time snapshots). This is the precondition for any
  throughput/history view; export snapshots alone cannot produce it.
```

#### 2d — Parking-lot additions

Locate the `## Parking lot` list. Append the following two bullets to the end of
that list. STOP if `## Parking lot` is not found.

```markdown
- **Sheets one-way push** — publish a flat projection tab for a downstream
  reader; named future consumer: Looker Studio. Was the Phase 4 `adapter-sheets`
  item; demoted by the 2026-06-12 pivot. Promotes when a concrete consumer
  exists.
- **XLSX export format** — a second export format beyond CSV + JSON, gated on a
  separate runtime-dependency (R2) decision. Promotes when demanded.
```

#### 2e — Annotate the JS-libraries pending decision

Locate the `## Pending decisions` list and its entry about JS libraries for Jira
REST and Google Sheets (the one referencing Python's `requests` and `gspread`).
Append the following sentence to the end of that entry's text, inline. STOP if
the entry is not found.

```
The Google Sheets (gspread-equivalent) half is no longer pre-Phase-4: after the 2026-06-12 pivot, Sheets is a parking-lot consumer, so its library choice is gated on that promotion, not on Phase 4 start.
```

#### 2f — Verification

- [ ] `## Identity shifts` ends with the new `### 2026-06-12` subsection;
      earlier subsections (2026-05-10, 2026-05-15, 2026-05-28) are byte-identical
- [ ] Phase 4 heading reads `### Phase 4 — Shared state and the coordination view`
- [ ] No `adapter-sheets` item remains inside any phase section (it lives only in
      Parking lot now)
- [ ] Phase 3 items list has the two new `[prod]` bullets appended
- [ ] Parking lot has the two new bullets
- [ ] The JS-libraries pending decision carries the appended sentence
- [ ] No other section changed

**Commit:** `docs(roadmap): record app-owns-state pivot; rescope phase 4`

Run `pre-commit-self-audit` at Pause 3 with the subject above and
`EDIT_SCOPE="docs/ROADMAP.md"`.

### Edit 3 — `docs/MENTOR_BRIEF.md` §2

One commit. Two sub-edits.

#### 3a — Record the pivot in §2

Locate, in §2, the bullet beginning `- **Repositioning recorded 2026-05-28:**`
and find its end (the next top-level `-` bullet). Insert the following new bullet
immediately after it. STOP if the 2026-05-28 bullet is not found.

```markdown
- **Pivot recorded 2026-06-12 (brief 023):** the **application owns production
  state** (local now, remote later). A spreadsheet is demoted from a
  state-holding surface to one optional one-way projection target among others
  (flat files, BI platforms). With no production users of the Python
  `automation/`, `sync.py` / `lib_sheets.py` are legacy reference only — the sync
  diff engine is never ported; only the issue → row projection survives, as
  `packages/core/src/export.ts`. Export is a fact table (one row per issue, zero
  aggregation); aggregation and history belong to the BI layer and to Phase 3
  state.
```

#### 3b — Demote `adapter-sheets` in the planned-packages line

Locate, in §2, the text describing planned packages — it lists
`core`, `adapter-jira`, `adapter-drive`, `adapter-sheets`, `cli`, and currently
states that `adapter-drive` was promoted to first class on 2026-05-28 while
`adapter-sheets` "stays in the list but serves the secondary aggregation
surface."

Find:
```
`adapter-drive` was promoted to first
    class on 2026-05-28 alongside the repositioning; `adapter-sheets`
    stays in the list but serves the secondary aggregation surface.
```

Replace with:
```
`adapter-drive` was promoted to first
    class on 2026-05-28 alongside the repositioning. `adapter-sheets`
    is demoted to the parking lot by the 2026-06-12 pivot: it is one
    one-way projection target, built only when a concrete consumer
    (e.g. Looker Studio) exists.
```

If the find block does not match byte-for-byte (line wrapping in the file may
differ), **STOP and report the actual lines** so the replacement can be aligned.

#### 3c — Verification

- [ ] The new "Pivot recorded 2026-06-12" bullet sits directly after the
      "Repositioning recorded 2026-05-28" bullet
- [ ] The planned-packages text no longer says `adapter-sheets` "serves the
      secondary aggregation surface"; it states the parking-lot demotion
- [ ] No other §2 content changed; §1 and §3+ byte-identical
- [ ] §2 and ROADMAP now agree on the pivot (update-protocol pairing satisfied)

**Commit:** `docs(mentor-brief): demote adapter-sheets; record state-ownership pivot`

Run `pre-commit-self-audit` at Pause 3 with the subject above and
`EDIT_SCOPE="docs/MENTOR_BRIEF.md"`.

---

## Plan required justification

`Plan required: no` because:

- All inserted/replacement text is specified inline and byte-exact.
- Edits are section-boundary inserts/replacements or list appends with explicit
  STOP-if-mismatch guards; there is no architectural choice for the executor.
- The pivot decisions are closed (briefs 023 + this session); no interpretation
  beyond locating the named anchors.

**Pause 1 is skipped. Pause 2 (after `docs/ROADMAP.md` is fully edited, before
touching `docs/MENTOR_BRIEF.md`) and Pause 3 (before every commit) remain
required.**

## Open mentor judgment calls (confirm before saving)

These were the mentor's calls, not closed decisions — sanity-check, then save:

1. **Phase 4's new goal.** "Coordination as aggregated view" was hollowed out by
   the pivot (Sheets left, state moved to Phase 3). I refilled Phase 4 as
   **shared/remote state + coordination-view-as-projection-consumer**. If you'd
   rather empty Phase 4 entirely (fold remote state into a later phase), say so.
2. **Phase 4 rename.** I renamed the heading
   (`Coordination as aggregated view` → `Shared state and the coordination
   view`). Revert if you want the old title kept.
3. **§2 "Active focus" line is stale** — it still reads "Phase 1 — monorepo
   bootstrap" while we are at brief 023. I did **not** touch it (out of the
   pivot's scope). Flagging it as a follow-up; say the word if you want a minimal
   refresh folded into Edit 3.
