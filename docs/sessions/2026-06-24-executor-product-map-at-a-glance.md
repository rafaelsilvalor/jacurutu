# Session recap — 2026-06-24 — product-map-at-a-glance

**Mode:** gate-driven docs task (no brief, no planner/brief-validator) — mentor
scope handoff pasted into Code, executor working under mentor gates at each step.
**Executor:** Claude Code (this session).
**Orchestrator:** mentor handoff — fill the product-map ground-truth the mentor
cannot see (no code in mentor context) + decide ROADMAP placement.
**Merged via:** PR #73, squash merge → `main@080dcca`.

## Context

The mentor authored a product-map skeleton (shape, alpha/beta framing, pointer
index, maintenance discipline) but cannot see code. The executor's job was the
ground-truth: fill the "Layers & status" table against the **actual v2 repo**
(verify, never infer), report the alpha gap precisely, and decide whether to
revive ROADMAP or adopt a new MAP file (one living artifact only).

No brief was written — this is a direct mentor→executor docs task. Slot
numbering N/A; the session file is numberless, matching the precedent of other
non-brief session recaps (e.g. `2026-05-28-mentor-verb-allowlist...`).

## Gate rulings (closed, not revisited)

- **Placement (a) — revive ROADMAP, no standalone MAP.** Insert the map as a new
  top section (`## Product map at a glance`) of the live ROADMAP; fold maintenance
  discipline into the existing Update protocol. ROADMAP's living body (phases,
  pending decisions, identity shifts) is untouched — it has no other home. The
  executor's argument (ROADMAP is live, reconciled at `15ab3fe`, not stale; a
  separate MAP would be the "parallel living ROADMAP" the constraint forbids and
  would orphan ROADMAP's living content) was accepted over the mentor's
  revive-vs-new framing.
- **Draft fresh** from the described shape — the mentor's literal skeleton text
  was not in repo or context, so the section was drafted from the shape spec.
- **Alpha line (gate-approved framing).** What runs today = read (`fetch`) + BI
  fact-table export; the production loop is **greenfield**, so alpha = building
  the loop (workflow actions + template mgmt + Drive adapter), not a validation
  pass. Loop task-state (local `WorkspaceEvent`) kept distinct from Jira status
  normalization (Axis B, read/BI-side). Loop sequencing left as the next scoping
  decision, not fixed here.
- **Axis-A nuance kept in the read/data cell**, tightened — not a footnote.

## Ground-truth verified (v2 source, not inferred)

Verified against the command surface (`argv.ts`/`cli.ts`), ports (`gateways.ts`),
domain types (`workspace.ts`), and adapter implementations:

- **Read / data (Jira fetch) — Built**, `saci fetch` (026/028/029). Per-project
  input resolution is **Axis A only** (`entregaCandidates` + `vertical` ids,
  `field-mapping.ts`); Axis B (status normalization — a fixed `FILTERED_STATUSES`
  constant), Axis C (delivery-from-text), and `config project add` not built.
- **Curated template management — Planned.** Only `appliedTemplate` /
  `templateUsed` type fields exist (`core/workspace.ts`); no catalog, match, or
  apply code anywhere.
- **Workflow actions (start / close / drive upload) — Planned (all three).** CLI
  surface is `fetch`, `export`, `--version` only. `DriveGateway` is a port
  interface with open TODOs; no `adapter-drive` package, no implementation.
  `WorkspaceEvent` enumerates `start|ship|load|handoff` as **types only**.
- **BI export — Built**, `saci export` CSV/JSON fact table. Sheets projection
  parked (`adapter-sheets` is a `SACI_*_PHASE` placeholder).

**Alpha gap (load-bearing):** none of start / close / drive-upload exist in v2
runtime — the entire production loop is to-build.

## Attribution correction (verified against git log, SSOT)

- **BI export `(023/028)` → `(023)`.** The export feature shipped in brief 023
  (`6f54e3b` #55: `core/export.ts` + `cli/run-export.ts`). Brief 028 (`65442e0`
  #69) added `display.ts` only — display, not export — so 028 was dropped from the
  export attribution. The mentor flagged the suspicion; `git show --stat`
  confirmed it.
- **Read/data fetch `(026/028/029)`** confirmed accurate: 026 argv dispatch, 028
  display, 029 field mapping — all genuinely touch fetch.

## Artifacts produced (1 commit on `docs/product-map-at-a-glance`)

- `c2350e9` `docs: add product map at-a-glance section to ROADMAP` — new top
  section (loop-first center, ground-truth Layers & status table, alpha line,
  pointer index) + maintenance discipline folded into Update protocol.
  (squash-merged as `080dcca` #73)
- **This recap** — `docs/sessions/2026-06-24-executor-product-map-at-a-glance.md`
  (separate docs PR).

## Deviation log (all caught, none silent)

1. **PR template bypassed, then corrected.** The first `gh pr create --body-file`
   replaced the mandatory template body (R12). Caught on a post-open read of
   `.github/pull_request_template.md`; PR #73 body rewritten to the template
   structure (What / Why / How tested / Notes / Checklist) via `gh pr edit`.
2. **Phantom brief number dropped.** A `(030)` was drafted into the commit subject;
   no brief 030 exists (gate-driven task, no brief), so asserting it would be
   false — removed before Pause 3.

## Verification summary

- **All gates honored.** Two mentor gates before commit (filled-map + placement
  recommendation; fresh-draft content approval), plus Pause 3.
- **`pre-commit-self-audit`: 5/5 PASS** — subject 52 ≤ 72, type `docs`, verb `add`
  (allowlist), no co-author trailer, staged scope = `docs/ROADMAP.md`.
- **Commit message verified verbatim** (`git log -1` vs approved text) after commit.
- **Green mechanism:** docs-only change, no code/tests affected; pre-commit hook
  not wired in this clone, the self-audit checks were run manually.
- **No `--no-verify`; no push/PR-open without explicit instruction** (R17 — both
  were explicit mentor/user gos). Rafael merged; executor did not auto-merge.

## Doctrine observations (this session)

- **`gh pr create --body-file` silently bypasses the repo PR template.** The
  template is enforced by convention (R12), not by a server check — opening a PR
  programmatically must reproduce the template sections explicitly. *GOTCHAS /
  AGENT_PLAYBOOK candidate.*
- **A map that points must verify its own pointers.** The export attribution
  looked plausible from the docs prose but was wrong against git log — the
  ground-truth mandate ("verify, do not infer") applies to attributions, not just
  build/plan status.

## Forward-items (registered, not this task)

- Sequence the greenfield production loop (which workflow action lands first) —
  the next scoping decision the map deliberately leaves open.
- Map maintenance is now ritualized in the Update protocol (refresh at
  recap/cache-swap; rule-of-three to graduate a row) — apply it next cache-swap.

## Next concrete action

`main@080dcca` carries the at-a-glance map. The map's alpha line frames the next
real work: scope the first workflow-loop brief (start/scaffold/template), the load
-bearing alpha gap.
