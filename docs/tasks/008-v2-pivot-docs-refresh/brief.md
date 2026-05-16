# Brief: 008 — v2 pivot docs refresh

> **Category:** L (2 files modified — one wholesale rewrite, one with 3 targeted edits; ~350 lines of net changes)
> **Plan required:** No — see "Plan required justification" below
> **Branch:** `docs/v2-pivot-docs-refresh`
>
> Paste this brief into Claude Code at session start. **First action: save this brief verbatim as `docs/tasks/008-v2-pivot-docs-refresh/brief.md`** (creating the directory). All subsequent edits proceed from there.

---

## Context

Two mentoring chat sessions (2026-05-15 saci-v2-pivot; 2026-05-16 modeling) closed a set of architectural and product decisions for Saci that supersede the existing Electron-v1 plan recorded in `MENTOR_BRIEF.md` §2 and `ROADMAP.md`:

1. **Saci-Electron-v1 enters freeze** (critical bugs only) as **Saci v2** starts in a TypeScript monorepo (npm workspaces, strict, `node:test`, no bundler) following Hexagonal (Ports & Adapters) architecture.
2. **Two operating modes** are designed from day one: *coordination* (Rafael runs a centralized pipeline) and *production* (each designer runs locally).
3. **CLI-first, desktop-later** — desktop UI reconnects on top of CLI within ~3-4 months.
4. **Jira REST direct** (Cowork-as-Jira-bridge reverted; token cost made it unsustainable).
5. **Production workflow promoted to Phase 3** because Rafael is the manual bottleneck for the repetitive work the product is meant to eliminate.
6. **Designer-friendly packaging is a Phase 3 concern** (possibly via Saci-desktop as host for non-technical designers).
7. **Python `automation/` is the seed of v2's core** — it already implements hexagonal architecture intuitively.
8. **Brief slots 004-006 burned** (previously reserved for v1 refactors now superseded) — those numbers will not be reused.

The same 2026-05-16 session also closed three smaller docs items:
- **P4 — numbering verification protocol** drafted in session 2026-05-12, ready to land in `MENTOR_BRIEF.md` §3.
- **M-R7 refinement** to add a *compact mode* clause for sessions where the user requests tighter responses.
- **P5 — session-type separation pattern** ("hands-on" vs "clarify vague technical points"), surfaced 2026-05-16 as observation (not yet rule).

This brief consolidates all of the above into the canonical docs. No code is touched. `CLAUDE.md` is intentionally left untouched in this brief — R18, R19, E4, E5 continue to reflect v1 design until a separate brief introduces TypeScript-specific rules.

## Goal

After this task:

- `docs/MENTOR_BRIEF.md` §2 reflects the v2 pivot (TS monorepo, hexagonal, CLI-first, two modes, Jira direct, production-in-Phase-3, packaging-in-Phase-3, Python as seed); the obsolete v1 framing is gone.
- `docs/MENTOR_BRIEF.md` §3 has two new observed patterns: **P4** (numbering verification protocol) and **P5** (session-type separation).
- `docs/MENTOR_BRIEF.md` §4 has **M-R7** refined with a compact-mode clause.
- `docs/ROADMAP.md` is rewritten for v2: identity shift section becomes plural (preserving the 2026-05-10 entry, adding 2026-05-15); a new five-phase v2 trail with `[coord]`/`[prod]` tagging replaces the v1 phases; v1 phases move to a "Legacy / superseded" section (strikethrough); slots 004-006 are explicitly noted as burned; the estimates table is removed (estimates are set per-phase at phase start); parking lot and pending decisions are refreshed for v2.
- `docs/tasks/008-v2-pivot-docs-refresh/brief.md` exists, containing this brief verbatim.

No code is modified. No new dependency is added. `CLAUDE.md` is not modified by this brief.

## Constraints

### Files in scope

| # | File | Change type |
|---|---|---|
| 1 | `docs/tasks/008-v2-pivot-docs-refresh/brief.md` | New file (this brief, saved verbatim) |
| 2 | `docs/MENTOR_BRIEF.md` | Three targeted edits: §2 (wholesale replacement), §3 (insert P4 + P5), §4 (replace M-R7) |
| 3 | `docs/ROADMAP.md` | Wholesale rewrite (replace entire file content) |

### Out of scope

- `CLAUDE.md` — not modified. R18, R19, E4, E5 remain. A follow-up brief introduces TS-specific rules and reconciles the v1-era rules.
- Any application code (`main.js`, `psd-worker.js`, `preload.js`, `renderer/app.js`, `renderer/index.html`, etc.).
- Renaming or migrating existing briefs in `docs/tasks/`.
- Adding, removing, or renumbering rules in `CLAUDE.md`.
- Migrating estimates from the old `ROADMAP.md` estimates table (intentionally dropped).
- Filling in detailed milestones for v2 Phases 4-5 beyond the sketch in the new ROADMAP (each phase's milestones are designed when the phase starts).
- Re-creating any brief 004, 005, or 006 (burned per the v2 pivot decision).
- Any `git push` (`CLAUDE.md` R17 / `GIT_WORKFLOW.md` G-R5).

### Conventions

- All content in English (`CLAUDE.md` R9 — agent-consumed dev surface).
- All commits follow Conventional Commits (`CLAUDE.md` R10, `GIT_WORKFLOW.md` G-R3).
- No `Co-authored-by` trailer (`GIT_WORKFLOW.md` G-R3).
- Pre-commit hook is not bypassed with `--no-verify` (`CLAUDE.md` R13).

---

## Done criteria

### Edit 1 — Save this brief

Create directory `docs/tasks/008-v2-pivot-docs-refresh/` and save this brief (verbatim, the exact text the agent received in the chat) as `brief.md` inside it.

- [ ] Directory `docs/tasks/008-v2-pivot-docs-refresh/` exists
- [ ] `docs/tasks/008-v2-pivot-docs-refresh/brief.md` matches the brief content the agent received (no edits, no formatting drift)

### Edit 2 — `docs/MENTOR_BRIEF.md`: §2, §3, §4

#### 2a. Replace §2 entirely

Locate §2: starts at the line `## 2. Where we are in the project` and ends at the blockquote line `> ⚠️ This section ages fast. Update it after every significant milestone or pivot.` (inclusive).

Replace the entire range with this exact content:

```markdown
## 2. Where we are in the project

- **Project:** Saci — productivity and automation toolkit for the Estratégia design team. Coordinates a small team of non-technical designers managed by Rafael; reduces him as a bottleneck on both **coordination** (Jira → Google Sheets dashboard for team alignment) and **individual production** (folder scaffolding, templates, archiving standardization).
- **Phase transition (recorded 2026-05-15):**
  - **Saci-Electron-v1** (the existing pure-JS codebase) enters **freeze** — critical bugs only, no new features.
  - **Saci v2** rebuilds as a **TypeScript monorepo** (npm workspaces, `strict: true`, `node:test`, no bundler), following **Hexagonal (Ports & Adapters)** architecture. Planned packages: `core` (domain + ports), `adapter-jira`, `adapter-sheets`, `cli`.
  - The Python `automation/` codebase is the **seed** of v2's core — it already implements hexagonal architecture intuitively (`lib_transform.py` = pure domain; `fetch.py` = Jira adapter; `lib_sheets.py` = Sheets adapter; `payload.json` v2.0 = port contract; `run_local.py` = composition root). Porting is redesign with explicit vocabulary, not line-by-line translation.
- **Target platforms:** Windows + macOS + Linux. v2 ships as CLI first (cross-platform by default); desktop UI reconnects on top of the CLI within ~3-4 months.
- **Active focus (Phase 1 — monorepo bootstrap):**
  1. TS monorepo stand-up: package layout, `tsconfig.json`s, build chain, `node:test`, `--version` working on `cli`.
  2. **No domain logic in Phase 1** — strict scope to prevent creep. Domain work lands in Phase 2.
  3. Doc refreshes (MENTOR_BRIEF §2, ROADMAP) ahead of code work.
- **Active architectural decisions (recorded 2026-05-15 — refresh as they evolve):**
  - **Two operating modes, same core:**
    - *Coordination mode* — Rafael runs a centralized pipeline (Jira → Sheets dashboard); team consumes the Sheet.
    - *Production mode* — each designer runs locally, scoped to their own tasks, files, and identity. `saci config` per-machine is a day-1 requirement (multi-tenant per machine, mono-user per instance).
  - **CLI-first, desktop-later.** CLI is the canonical surface during core development (reduces iteration friction). Desktop UI (Electron host) reconnects on top within ~3-4 months — designers need the production flow soon and CLI alone is not enough for non-devs.
  - **Jira REST direct** (Cowork-as-Jira-bridge reverted on 2026-05-15). Rationale: token cost per Cowork run made the bridge unsustainable even in testing; preserving token budget for mentor + Claude Code yields higher ROI. JS equivalents for `requests` and `gspread` are pending research — required before Jira/Sheets adapter implementation, not before bootstrap.
  - **Google Sheets stays as the team-facing collective interface**, not a placeholder. It will not be replaced by the desktop UI later.
- **Active product direction (recorded 2026-05-15 — refresh as it evolves):**
  - **Production workflow promoted to Phase 3** (v2 numbering). Rationale: until production exists, Rafael is the manual bottleneck for the repetitive work the product is meant to eliminate. Phase 3 covers folder scaffolding, templates, archiving standardization — these are **domain concepts** (likely a `ProductionFlow` or `Workspace` abstraction), not tooling details.
  - **Designer-friendly packaging is a Phase 3 concern**, not end-of-roadmap. Possibly via the Saci-desktop Electron app as host for the CLI on non-technical designers' machines.
  - **Full v2 roadmap** with phases (tagged `[coord]` / `[prod]` per item), milestones, parking lot, and pending decisions: `docs/ROADMAP.md`. Legacy v1 phases are marked `superseded` in that file.

> ⚠️ This section ages fast. Update it after every significant milestone or pivot.
```

- [ ] §2 starts with the heading `## 2. Where we are in the project`
- [ ] §2 ends with the `> ⚠️ This section ages fast.` blockquote
- [ ] The body content between matches the block above byte-for-byte
- [ ] §1 (the section before §2) and §3 (the section after §2) are byte-identical to before

#### 2b. Insert P4 and P5 in §3

Locate the P3 bullet in §3 ("Observed patterns"). It ends with `The Pause-3 moment is where he wants to feel in control.` and is followed by the heading `## 4. Behavior rules`.

Insert immediately after the P3 bullet and immediately before the `## 4. Behavior rules` heading the following two bullets (preserving one blank line between P3 and P4, and one blank line between P5 and `## 4.`):

```markdown
- **P4 — Numbering verification protocol for new briefs.** Before picking a brief number, consult three sources: `ls docs/tasks/`, `git log --oneline main` of merged PRs, and reserves declared in prior briefs or in `CLAUDE.md` E* entries. `ls` alone misses forward reserves and unsynced merged work — see session 2026-05-12 for the incident that motivated this protocol. Forward reserves that get superseded should be explicitly burned (gap preserved) or released, with the decision recorded in the brief that supersedes them.
- **P5 — Session-type separation pays off** (surfaced 2026-05-15). "Hands-on" sessions (modeling tasks, drafting docs, code review) and "clarify vague technical points" sessions (exploratory discussion, sketches, decisions not ripe for a brief) run cleaner when kept apart. When a session drifts between the two, propose a checkpoint: finish the current type or split. Pattern under observation; not yet a behavior rule.
```

- [ ] P4 appears immediately after P3
- [ ] P5 appears immediately after P4
- [ ] P1, P2, P3 are byte-identical to before
- [ ] `## 4. Behavior rules` heading and everything after it is byte-identical to before

#### 2c. Replace M-R7 in §4

Locate the current M-R7 paragraph. Its current text is:

```markdown
**M-R7 — Default to medium-density responses.** Headers + bullets + short paragraphs. Tables for comparisons of 3+ options. Code blocks for anything ≥ 2 lines of code or commands. No emojis except sparingly for status (✓, ⚠️) when they aid scanning.
```

Replace the entire M-R7 paragraph (one paragraph, from `**M-R7 —` to the end of that paragraph) with:

```markdown
**M-R7 — Default to medium-density responses; compact mode on request.** Headers + bullets + short paragraphs. Tables for comparisons of 3+ options. Code blocks for anything ≥ 2 lines of code or commands. No emojis except sparingly for status (✓, ⚠️) when they aid scanning. **Compact mode** activates when the user signals he wants tighter responses ("respostas mais enxutas", "direto ao ponto", or similar): shrink to the minimum useful answer plus short expansion markers ("posso aprofundar"). Compact mode persists for the session; default density returns next session unless reasserted.
```

- [ ] M-R7 matches the new text byte-for-byte
- [ ] M-R6 (above M-R7) and M-R8 (below M-R7) are byte-identical to before
- [ ] No other M-R rule was modified

### Edit 3 — `docs/ROADMAP.md`: wholesale rewrite

Replace the entire content of `docs/ROADMAP.md` with the following block. Do not preserve any existing content beyond what is shown below (the entire old file is intentionally superseded; legacy v1 phases are captured inside the new file under "Legacy / superseded").

```markdown
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
```

- [ ] `docs/ROADMAP.md` file content matches the block above byte-for-byte
- [ ] No content from the previous `docs/ROADMAP.md` remains except as captured inside the new "Legacy / superseded" section
- [ ] First line of the file is `# Saci — Product Roadmap`

---

## Plan required justification

`Plan required: no` because:

- All replacement text is specified inline in this brief.
- All find-and-replace anchors are concrete and uniquely identifiable in the target files.
- The ROADMAP rewrite is wholesale (no merge with existing content needed).
- There is no architectural choice for the agent to make, no ambiguity about which file to edit, and no interpretation needed beyond locating the exact strings.

⚠️ **Pause 1 is skipped. Pause 2 (after the first modified file is fully changed, before moving to the next) and Pause 3 (before every commit) remain required** — Lesson #6 of `AGENT_PLAYBOOK.md`.

## Pause points

- **Pause 1 (before any change):** **Skipped** — `Plan required: no` (justification above).
- **Pause 2 (after the first modified file):** **Required.** After Edit 2 (`docs/MENTOR_BRIEF.md` fully modified across §2, §3, §4), stop and present the diff for review before proceeding to Edit 3 (`docs/ROADMAP.md`).
- **Pause 3 (before each commit):** **Required.** Show `git status`, `git diff --stat`, and the proposed commit message; wait for explicit approval. Three commits expected (see "Git workflow" below).

---

## Git workflow

### Branch

```bash
git checkout main
git pull --ff-only origin main
git checkout -b docs/v2-pivot-docs-refresh
```

### Commit sequence

Three commits, in this order. Each is a single thematic change touching a single file.

```
1. docs(tasks): add brief for 008-v2-pivot-docs-refresh
   — touches only docs/tasks/008-v2-pivot-docs-refresh/brief.md (new file)

2. docs(mentor-brief): refresh for v2 pivot — §2 redesign, P4/P5 patterns, M-R7 compact mode
   — touches only docs/MENTOR_BRIEF.md

3. docs(roadmap): redesign for v2 — coord/prod tags; mark v1 phases superseded
   — touches only docs/ROADMAP.md
```

Commit bodies should explain *why* in 1-2 short paragraphs (G-R3, G-R4). For commits 2 and 3, reference the v2 pivot decision recorded in chat session 2026-05-15 and the modeling session 2026-05-16. For commit 3, mention the slot 004-006 burn explicitly.

### Push

**Do not push.** The user authorizes push explicitly per `GIT_WORKFLOW.md` G-R5 / `CLAUDE.md` R17. Stop after the third commit and report.

---

## Output expected at the end of the session

A single message reporting:

1. Branch name and `git log --oneline main..HEAD` (should show 3 commits)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Any verification checkbox from this brief that **could not** be met, with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step: open PR on GitHub against `main` using the PR template; once merged, re-upload `docs/MENTOR_BRIEF.md` and `docs/ROADMAP.md` to the Claude.ai project knowledge before the next chat session

---

## References (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules (especially R9, R10, R13, R14, R17 for this task; R18, R19, E4, E5 are not modified but stay aware they exist and contradict the new v2 framing pending a separate brief)
2. `docs/GIT_WORKFLOW.md` — operational discipline (G-R3, G-R5, G-R8, PR template)
3. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points, drift signals); Lessons #4 and #6 in particular
4. `docs/MENTOR_BRIEF.md` — context on the user and the relationship; especially M-R3 (Pause-3), M-R10 (pt-BR chat / English dev surface), and patterns P1–P3
5. `docs/sessions/2026-05-15-saci-v2-pivot.md` — the recap that authorized this brief; useful if any wording in the new §2 or ROADMAP sections feels under-specified

If anything in the references contradicts a specific instruction in this brief, **stop and report** rather than choosing a side. The brief is the more recent decision; canonical docs may need a follow-up update that this brief did not anticipate.
