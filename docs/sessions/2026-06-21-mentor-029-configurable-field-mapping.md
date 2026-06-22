# Mentor Recap — Brief 029: Configurable Field Mapping (Axis A)

- **Date:** 2026-06-21
- **Mode:** mentoring (D-set closure + live gate)
- **Continues:** 2026-06-19-mentor-028-cli-human-display
- **Outcome:** PR #71 squash-merged → `main@3b386e6`. 149 tests pass / 0 fail; every commit standalone-green; R25 verified.

## What shipped

Per-project configurable Jira field mapping for `fetch`, resolved at the CLI composition root and passed to `adapter-jira` (never reaching `@saci/core`). The mapping doubles as the fetch field-selection list (derived: mandatory natives ∪ entrega candidates ∪ vertical, dropping the dead `customfield_11035`/`customfield_10067`). Fail-loud global-catalog validation (R4/D7). The single-`entrega` collapse removes the previously coincidental cross-project fallback. `--field-config`/`--project` flags are both-or-neither (D8); the no-flags default path is backward-compatible.

## D-set (closed in chat, ratified by Rafael)

Project divergence has three distinct axes; **029 covers Axis A only**:
- **Axis A — field id** (`entrega` is `customfield_10031` in MC, `customfield_11080` in PMA) → resolved by `FieldMapping`.
- **Axis B — status value** (FEITO / Concluido / FINALIZADO, different ids, same `statusCategory`) → forward-item.
- **Axis C — representation/structure** (text-embedded vs structured; hierarchy level) → forward-item (`transform` in core).

- **Q1 (location):** per-project config at the composition root (`run-fetch.ts`) → adapter, never core. Mirrors how `export` consumes `--config`.
- **Q2 (schema + isolation):** `Record<SemanticFieldName, string>`; value is a Jira field id, native (`duedate`) or custom (`customfield_*`); config doubles as the fetch field-selection list; fail-loud on a mapped id absent from the catalog (R4); `customfield_*` confined to config + adapter, never core.
- **Q3 (earned abstraction):** confirmed concrete (MC `10031` vs PMA `11080`). **Reframed:** not "MC broken" — today both resolve via a coincidental primary→fallback chain in the single global default. The task's real value is explicit per-project declaration + fail-loud validation + a fetch list derived from the mapping. Abstraction earned (A3): two real projects, two real ids.
- **Collapse:** per-project override = single `entrega` (no fallback); the DEFAULT mapping may retain a multi-candidate chain (best-effort for unconfigured projects). Unified internally as `entregaCandidates: readonly string[]` (default length 2, override length 1).

## Live-Jira evidence (drove the D-set)

- Projects: **MC** (Marketing Concursos, `10034`, software), **MCA** (Avulsas, `10266`, software), **PMA** (Portal Marketing Avulsas, `10270`, **service_desk**).
- `entrega`: PMA = `customfield_11080` "Data/hora Entrega"; MC = `customfield_10031` — on the **subtask**, not the Story. This corrected the handoff hypothesis that MC's delivery was text-embedded (Axis C); Axis C is **not** needed for MC.
- `statusCategory` (`new`/`indeterminate`/`done`) is the stable cross-project anchor; status names/ids vary. (Axis B context only.)

## Gate rulings (in sequence)

- Planner handoff (caminho A) with mandatory verification: read `DEFAULT_FIELD_MAPPING`, confirm the semantic-field set against the payload contract, probe an MC subtask.
- **Verification corrections (accepted):** the SemanticFieldName source is `mapper.ts` + `field-mapping.ts`, not `payload.ts`; `fetch` already requested a named list (not `*all` — the "~150 fields" premise was a probe artifact); Axis C not needed for MC.
- **D7 — validation scope:** GLOBAL-catalog (`GET /rest/api/3/field`), fail-loud on nonexistent id. Corrected my prior wording ("project's field metadata") which leaned per-project. The collapse — not the validation — removes the silent-wrong-value hazard; global catalog catches the typo case; per-project/createmeta is heavier, imperfect (create-screen-only), false-positive-prone → forward-item.
- **Plano X — commit boundaries:** refactor-then-feat regrouping (6 commits). Leaf-up additive ordering is green-per-commit only for additive changes; a coupled signature/shape change breaks callers immediately, so the coupled edits form one minimal green refactor unit. Shim alternative rejected (A3 throwaway).
- **F1 `FetchLike.body` → optional:** supersedes the Pause-1 "do not change FetchLike" note, which rested on a false premise — real `fetch` rejects GET with a body (empirically verified). The 2-site compile guard in `gateway.test.ts` is forced fallout of the type change, allocated to F1; substantive catalog guarding to F2.
- **R collateral:** the `jira-responses.ts` comment naming `DEFAULT_DESIGN_FIELDS` — scope-completion (R's own collateral), gate-authorized, reported.
- **R message amend:** committed subject drifted ("shape"→"model") and the body falsely claimed F1/F2 work; caught via git-vs-approved verification; amended (message-only).
- **F4 `ParsedCommand` shape:** present-undefined (uniform forward contract). Runtime backward-compat is satisfied either way; the shape choice is internal-design, and uniform scales better for a growing CLI parser.
- **Gating cadence:** two blocks at the package seam — adapter (F1/F2) fast, cli (F3-F5) scrutinized (F4 argv-surface + backward-compat).
- **Standing:** mandatory `npm test` at every Pause 3 (pre-commit hook unwired); gate-approved commit messages committed verbatim; post-commit git-vs-approved verification standard.

## Deviations (all gate-authorized, none silent)

1. R collateral 9th file (`jira-responses.ts` comment fix).
2. F1 `FetchLike.body` → optional (supersedes Pause-1 note; empirical GET-no-body reason).
3. R message drift caught + amended.
4. F4 `ParsedCommand` present-undefined shape (existing argv tests updated to the new uniform shape; runtime identical).

## Forward-items

- Per-project / createmeta (field-context) validation (D7 limitation).
- Pre-commit hook wiring (durable fix: `prepare`-script so fresh clones auto-set `core.hooksPath`; GIT_WORKFLOW/GOTCHAS note, Windows-aware).
- Axis B — status-value normalization (anchor on `statusCategory`).
- Axis C — text-derivation in the core `transform` layer.
- `saci config project add <KEY>` discovery/onboarding generator (introspect → suggest → confirm → persist).
- Phase 3 state design (blocked on `derivePath` hierarchy D-set).

## Doctrine observations (rule-of-three status)

- **Mechanical validator does not check commit-sequence feasibility;** leaf-up stays green-per-commit only for additive changes. *Rule-of-three candidate:* a brief-authoring rule — "coupled signature/shape changes → refactor-then-feat boundaries." (2nd validator-mechanical-limit observation, after the payload.ts source correction.)
- **`FetchLike` fakes do not enforce real `fetch`'s GET-no-body constraint** → green fakes ≠ working production for transport changes. *GOTCHAS candidate:* transport changes need an empirical real-fetch check.
- **Executor self-reports need verification:** the R-body drift and the "hook ran" misstatement were both caught by git-vs-approved verification. Keep that verification standard at every Pause.
- **Mentor self-note (M-R4):** do not bless a runtime/transport premise as "acceptable" without empirical verification or an explicit unverified flag (the "~150 fields" and GET-no-body misses).

## Cache hygiene

This recap swaps into the project-knowledge cache as the newest mentor recap; `2026-06-19-mentor-028` drops out. Git remains SSOT for all recaps and briefs.

## Next

Cluster remaining: Axis B (status-value), Axis C (text-derivation), the `saci config project add` generator, and Phase 3 state design (`derivePath` D-set). The next active focus is a fresh scoping/D-set decision in chat — not prescribed here.
