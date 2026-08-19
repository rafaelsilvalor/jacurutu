# Dev queue board — frozen snapshot, 2026-08-19

**This file is data, not a note.** It carries no disposition, nothing consumes it
as brief Context, and **it is never updated.** It is the migration record of the
Notion database `Jacurutu — Dev Queue`
(`collection://33dffc98-4d7b-4b9b-9d70-098d4914a894`), read on 2026-08-19
immediately before the queue was seeded into the Jira space `JAC`.

Its job is layer 2 of the exit described in `dev-queue-board.md`: if the seeding
into Jira is wrong, this is what proves it. A maintained snapshot would be the
second registry that folder's contract forbids; a frozen one is evidence.

Two fields do not survive the migration and exist only here: the Notion `Ref`
auto-increment, and each item's original `Created` timestamp. Every seeded Jira
issue carries the seed date instead.

27 rows, ordered by `Ref`, verbatim.

---

### Ref 1 — Local storage with two data categories — Jira mirror and production state
- Status: Not started
- Source: Phase 3 — item
- Wave: Next
- Brief: —
- Roadmap anchor: Phase 3 → Items
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: Mirror is overwritable on every fetch; production state never is. Storage loss must not destroy work: issues are recreatable from Jira, active tasks from their Drive manifests.

### Ref 2 — Primary command set — fetch / list / start / ship / load / status
- Status: Not started
- Source: Phase 3 — item
- Wave: —
- Brief: —
- Roadmap anchor: Phase 3 → Items
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: SUPERSEDED 2026-08-17 — split into four cards: saci ship, saci list, saci load, saci status. Six commands in one card could not say what we were working on, which is the board's only job. Kept rather than trashed so the split is visible in the record; carries no Wave and is not work.

### Ref 3 — Per-project fetch input resolution — Axis B, Axis C, and saci config project add <KEY>
- Status: Not started
- Source: Phase 3 — item
- Wave: —
- Brief: —
- Roadmap anchor: Phase 3 → Items
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: Axis A (entrega + vertical field ids) is built. Axis B = status normalization anchored on statusCategory. Axis C = delivery dates embedded in summary/description text.

### Ref 4 — 3-level template match — deterministic, suggestion-with-confirmation, manual
- Status: Not started
- Source: Phase 3 — item
- Wave: —
- Brief: —
- Roadmap anchor: Phase 3 → Items
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: MVP covers levels 1 and 3; level 2 lands when heuristics mature. Bypass via saci start <key> --template <name>.

### Ref 5 — Manifest read / write, and designer-to-designer handoff
- Status: Not started
- Source: Phase 3 — item
- Wave: —
- Brief: —
- Roadmap anchor: Phase 3 → Items
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: The TaskManifest type exists from Phase 2 (brief 031). This turns it into a real file written on start and updated by ship / load.

### Ref 6 — saci config — per-machine identity
- Status: Not started
- Source: Phase 3 — item
- Wave: —
- Brief: —
- Roadmap anchor: Phase 3 → Items
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: Multi-tenant per machine, mono-user per instance. Day-1 requirement: 3+ designers running their own instances.

### Ref 7 — Designer-friendly packaging — Saci-desktop as a host for the CLI
- Status: Not started
- Source: Phase 3 — item
- Wave: —
- Brief: —
- Roadmap anchor: Phase 3 → Items
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: Electron returns as a host on non-technical designers' machines.

### Ref 8 — CLI human-facing display of open demands
- Status: Not started
- Source: Phase 3 — item
- Wave: —
- Brief: —
- Roadmap anchor: Phase 3 → Items
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: Distinct from runExport: the export feeds files and BI, the display feeds the operator's eyes.

### Ref 9 — State and history accumulation
- Status: Not started
- Source: Phase 3 — item
- Wave: —
- Brief: —
- Roadmap anchor: Phase 3 → Items
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: Precondition for any throughput or history view. Export snapshots alone cannot produce it.

### Ref 10 — Decide the exact shape of the Drive hierarchy formalization
- Status: Not started
- Source: Phase 3 — open question
- Wave: —
- Brief: —
- Roadmap anchor: Phase 3 → Open items inside this phase
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: vertical / campaign / date / name — but which separators, which date format, which fallback for missing fields. derivePath (brief 030) already fixed part of this.

### Ref 11 — Decide where the template catalog lives and what its metadata shape is
- Status: Not started
- Source: Phase 3 — open question
- Wave: —
- Brief: —
- Roadmap anchor: Phase 3 → Open items inside this phase
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: Where it lives, how it is edited, what its metadata shape is.

### Ref 12 — Decide the deterministic match rules for template level 1
- Status: Not started
- Source: Phase 3 — open question
- Wave: —
- Brief: —
- Roadmap anchor: Phase 3 → Open items inside this phase
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: Which issue signals pick which template. Code first, config later once the rules stabilize.

### Ref 13 — Decide claimed_by semantics in the manifest
- Status: Not started
- Source: Phase 3 — open question
- Wave: —
- Brief: —
- Roadmap anchor: Phase 3 → Open items inside this phase
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: How long a claim lasts, whether it auto-releases, how conflicts on ship are resolved.

### Ref 14 — Decide what ship uploads — the whole folder or a filtered set
- Status: Not started
- Source: Phase 3 — open question
- Wave: —
- Brief: —
- Roadmap anchor: Phase 3 → Open items inside this phase
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: Filtered would exclude things like .psd~ and swap files.

### Ref 15 — Decide local folder naming vs Drive folder naming
- Status: Not started
- Source: Phase 3 — open question
- Wave: —
- Brief: —
- Roadmap anchor: Phase 3 → Open items inside this phase
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: Same name, or a transformation between local and Drive.

### Ref 16 — Decide which secondary commands enter the MVP — cancel / reopen / archive / notes
- Status: Not started
- Source: Phase 3 — open question
- Wave: —
- Brief: —
- Roadmap anchor: Phase 3 → Open items inside this phase
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: Which enter the MVP, which wait for a real second case (A3).

### Ref 17 — Decide the packaging format and OS coverage
- Status: Not started
- Source: Phase 3 — open question
- Wave: —
- Brief: —
- Roadmap anchor: Phase 3 → Open items inside this phase
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: Windows first probably; Mac and Linux follow.

### Ref 18 — Shared / remote state backend
- Status: Not started
- Source: Phase 4 — item
- Wave: —
- Brief: —
- Roadmap anchor: Phase 4 → Items
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: Production instances sync app-owned state to a shared store. Local-only state (Phase 3) is the precondition.

### Ref 19 — Consolidation across designers
- Status: Not started
- Source: Phase 4 — item
- Wave: —
- Brief: —
- Roadmap anchor: Phase 4 → Items
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: Many instances' fact tables roll up into one team-level dataset. Granularity decided during Phase 4 modeling.

### Ref 20 — Coordination view as a projection consumer
- Status: Not started
- Source: Phase 4 — item
- Wave: —
- Brief: —
- Roadmap anchor: Phase 4 → Items
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: The team-level picture reads an export or projection of shared state; it never holds it.

### Ref 21 — Composition root for coordination mode in the cli package
- Status: Not started
- Source: Phase 4 — item
- Wave: —
- Brief: —
- Roadmap anchor: Phase 4 → Items
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: Coordination mode needs its own wiring in the composition root.

### Ref 22 — Wire a saci command to the adapter-sheets report
- Status: Done
- Source: Discovered in work
- Wave: —
- Brief: docs/tasks/2026-08-15-report-command/
- Roadmap anchor: Layers & status → BI export
- Must land before: —
- Created: 2026-08-16 01:01:55Z
- Notes: In flight on branch feat/report-command (tip 2f1d510, 10 commits ahead of main, smoke evidence note committed). adapter-sheets shipped in #153 with no command wired; this is that wiring. Seeded as In progress because the work predates the board.

### Ref 23 — saci ship — upload the local task folder to Drive and update its manifest
- Status: Not started
- Source: Phase 3 — item
- Wave: Next
- Brief: —
- Roadmap anchor: Phase 3 → Items
- Must land before: —
- Created: 2026-08-17 11:23:43Z
- Notes: Split out of the old bundled command-set card on 2026-08-17. Prerequisite, not a parallel item: "Manifest read / write, and designer-to-designer handoff". Composition sits above adapter-drive's five primitives (folder-tree walking, verify-never-create, manifest parsing). Blocked by the rename: once this runs, .saci.json lives in Drive across designers.

### Ref 24 — saci list — browse local tasks
- Status: Not started
- Source: Phase 3 — item
- Wave: —
- Brief: —
- Roadmap anchor: Phase 3 → Items
- Must land before: —
- Created: 2026-08-17 11:23:43Z
- Notes: Split out of the old bundled command-set card on 2026-08-17. Depends on local storage (the two-category card), which does not exist yet.

### Ref 25 — saci load <drive-url> — reconstitute a task on this machine from its Drive manifest
- Status: Not started
- Source: Phase 3 — item
- Wave: —
- Brief: —
- Roadmap anchor: Phase 3 → Items
- Must land before: —
- Created: 2026-08-17 11:23:43Z
- Notes: Split out of the old bundled command-set card on 2026-08-17. The designer-to-designer handoff use case rests on this; it needs ship to have put a manifest in Drive first.

### Ref 26 — saci status — one-task overview
- Status: Not started
- Source: Phase 3 — item
- Wave: —
- Brief: —
- Roadmap anchor: Phase 3 → Items
- Must land before: —
- Created: 2026-08-17 11:23:43Z
- Notes: Split out of the old bundled command-set card on 2026-08-17. Depends on local storage (the two-category card), which does not exist yet.

### Ref 27 — Rename the product from Saci to Jacurutu
- Status: In progress
- Source: Exploration — candidate
- Wave: Now
- Brief: docs/tasks/2026-08-17-product-rename/
- Roadmap anchor: docs/explorations/product-rename.md
- Must land before: Ref 23 (saci ship)
- Created: 2026-08-17 11:24:01Z
- Notes: Decided 2026-08-16; target corrected from Nacurutu to Jacurutu on 2026-08-17 (no online references to Nacurutu; Jacurutu is the common Brazilian name for the owl). Specified in #156 and now In progress — the brief is on main and execution is the next session, on branch refactor/product-rename. Scope: every live surface, never the record. Measured 1273 tracked occurrences, 938 (74%) in docs/tasks + docs/sessions + automation, 335 live. Clean break, no backward-compatible read paths: the runtime commit is feat: because R14 cannot cover a change that leaves an unchanged ~/.saci without credentials. Must land before ship, because ship is what puts .saci.json into Drive across designers.
