# Session recap — 2026-06-29 — 030-derive-path (executor)

**Mode:** caminho-A handoff (planner-authored brief → brief-validator APPROVED →
executor run), orchestrated from Code with Rafael acting as mentor at every
Pause.
**Executor:** Claude Code executor subagent, driven by the Code main session.
**Merged via:** PR #75, squash merge → `main@147bbc6`.
**Pairs with:** `2026-06-29-mentor-030-derive-path.md` (design + gate). This is
the execution-side record only.

## One-line summary

Implemented the pure `derivePath` function in `@saci/core` — given a resolved
task, returns the relative workspace folder path as a `readonly string[]` of
four segments (`<grouping>/<vertical>/<YYYY-MM>/<KEY>_<slug>`), deterministic,
total, no I/O — with colocated `node:test` coverage; shipped green and merged.

## Built

- `packages/core/src/derive-path.ts` — 128 lines (implementation + the focused
  `DerivePathInput` interface + six named constants).
- `packages/core/src/derive-path.test.ts` — 123 lines, 13 tests.
- `packages/core/src/index.ts` — +12 lines (public re-export of `derivePath`
  and `DerivePathInput`, established re-export pattern).

## Findings confirmed live at Pause 1

- **FINDING 1 (`vertical_raw` is `[CODE] Name`, not a bare code) — CONFIRMED.**
  Checked via the Atlassian MCP (run by the Code main session; the executor has
  no Atlassian MCP in its environment, so it surfaced the gate and the check ran
  upstream). `customfield_10065` returns the `[CODE] Name` form in 100/100 of
  the most-recent MCA issues. Live codes observed: EC, ECJ, OAB, EE, ES, CFC,
  EEDU — 7 of D3's 8. `EPJ` is defined but used by no current MCA task; its
  absence does **not** trip FINDING 1's STOP-guard, which fires only on a
  no-embedded-code shape (long name / bare id), not on an unused-but-bracketed
  code. Bracket-extraction therefore stays valid and pure in `core`; no
  `value→code` map (cli) was needed.
- **FINDING 2 (`created` absent from the payload contract) — applied.** The
  naive D3 "fall back to created month" was unbuildable (no populating source).
  Resolution as built: month from `entrega_iso`, falling back to
  `jira_updated_at` (in-contract, non-null); if both are null/empty/unparseable,
  the month segment is the stable sentinel `UNDATED_MONTH = "undated"` — never a
  clock read, never a throw, never a fabricated "today".

## Decisions implemented (D1–D5, as built)

- **D1 — pure core.** No I/O, no clock, no network, no `customfield_*` literal
  (R25 greps empty). Consumes resolved semantic fields only.
- **D2 — return `readonly string[]`** (four segments, semester-root-downward);
  callers join against roots with `path.join`. Intentional deviation from
  ROADMAP's `→ string` (see Next step).
- **D3 — path form** `<grouping>/<vertical>/<YYYY-MM>/<KEY>_<slug>`; grouping =
  `campaign ?? AVULSAS_BUCKET` (always `AVULSAS` in alpha); vertical = code from
  `parseVertical`; month per FINDING 2; leaf = `<KEY>_<slug>`, or `KEY` only on
  empty slug (no trailing `_`).
- **D4 — slug sanitization (leaf only):** lowercase + NFKD diacritic strip (reuse
  of `normalizeText` from `transform.ts`), `[a-z0-9-]` replace, collapse hyphens,
  trim ends, cap `SLUG_MAX_LEN = 60`. Grouping/vertical are codes — not
  sanitized.
- **D5 — focused input `DerivePathInput`** local to `derive-path.ts` (`key`,
  `summary`, `vertical_raw`, `entrega_iso`, `jira_updated_at`, `campaign`);
  `campaign: string | null` lives on the focused input, never added to the
  shared `Issue` payload (A3 honored).
- **FINDING 1 extraction site:** inside `core`, reusing the existing pure
  `parseVertical` from `transform.ts` — no new bracket logic, no duplication.

## In-scope fixes after Pause 2

All in `derive-path.ts` / `derive-path.test.ts`; **no `transform.ts` edit**.

- **Vertical guard:** `parseVertical(input.vertical_raw) || UNKNOWN_VERTICAL`
  (`"unknown-vertical"`). Closes a real gap where an empty/whitespace
  `vertical_raw` (`parseVertical` returns `""`) would have emitted an empty
  segment — violating the brief's "never an empty segment" contract. The
  no-bracket non-empty case passes through verbatim (D4 scopes sanitization to
  the leaf only).
- **`MONTH_SLICE_LEN = 7`** introduced and tied to `MONTH_FORMAT`, replacing the
  bare `7` magic number in the `YYYY-MM` slice.
- **NFKD "why" comment** in `sanitizeSlug`, noting the deliberate reuse of
  `normalizeText` (NFKD is a benign superset of D4's NFD; anti-A3) so it does not
  read as silent divergence from D4.
- **+2 tests:** no-bracket vertical → verbatim pass-through; empty/whitespace
  vertical → `UNKNOWN_VERTICAL`. Both assert exactly 4 non-empty segments.

## Verification

- `tsc -p packages/core` — clean (strict, R20).
- `node --test` over the core suite — 13/13 pass.
- Full repo `npm test` — 162/162 pass.
- R25 greps (`customfield`, `from.*adapter` in `derive-path.ts`) — empty.
  R24 (`: any`) — empty.
- R5 (`derive-path.ts` 128 ≤ 400) and R6 (every function ≤ 50:
  `derivePath` 9, `deriveMonth` 7, `monthFromIso` 5, `deriveLeaf` 3,
  `sanitizeSlug` 11) — met.
- R7 named constants (SCREAMING_SNAKE_CASE): `AVULSAS_BUCKET`, `SLUG_MAX_LEN`,
  `MONTH_FORMAT`, `MONTH_SLICE_LEN`, `UNDATED_MONTH`, `UNKNOWN_VERTICAL`.
- `pre-commit-self-audit` on commit #2: 5/5 PASS (subject 52 chars, type `feat`,
  verb `add`, no co-author trailer, staged scope = edit scope).

## Green mechanism (record integrity)

The pre-commit hook is **not wired in this clone** (`core.hooksPath` unset), so
`npm test` did **not** auto-run on commit. Green was proven by manually running
`tsc` + `node --test` (full repo 162/162). The PR template's "pre-commit hook
ran" checkbox was left unchecked with that note rather than falsely ticked.

## Commits (code PR #75, squash-merged)

- `949c1d0` `docs(tasks): add brief for 030-derive-path` (commit #1, pre-existed
  on branch; Edit 1 was verify-only).
- `8e31a97` `feat(core): add derivePath folder-segment derivation` (commit #2,
  the implementation).

Squashed to `main@147bbc6` as
`feat(core): add derivePath folder-segment derivation (#75)`.

## Anything that STOPped or was flagged

None beyond the EPJ note (unused-but-defined vertical; STOP-guard correctly did
not fire). No `transform.ts` change was needed for the vertical guard, so no
scope STOP was triggered. The executor correctly refused a coordinator-relayed
push authorization (only Rafael's direct instruction authorizes a push, R17);
the push + PR proceeded once Rafael authorized directly.

## Gotchas discovered

None new. (The `parseVertical` empty-return edge was caught at Pause 2 and fixed
in-window; it is documented above, not a latent trap.)

## Next step

ROADMAP / `MENTOR_BRIEF.md` §2 reconciliation for the **D2 deviation** —
`derivePath` returns segments, whereas `ROADMAP.md:184-186` still describes
`derivePath(issue) → string` — is **deferred to a follow-up docs session** and is
**not** part of this PR or this recap branch.
