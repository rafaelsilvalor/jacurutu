# Session recap — 2026-06-21 — 029-configurable-field-mapping

**Mode:** full pipeline (planner → brief-validator → executor), orchestrated
from Code with the user acting as mentor at every gate/Pause.
**Executor:** Claude Code (this session), driving the orchestration subagents.
**Orchestrator:** mentor scope handoff pasted into Code (caminho-A, Axis A only;
ratified design constraints D-set + verified live-probe facts).
**Merged via:** PR #71, squash merge → `main@3b386e6`.

## Context

Brief 029 is the **input-side per-project configurable FieldMapping (Axis A
only)** — the deferred 023 D5 / 026 D-a3 item. Before it, `@saci/adapter-jira`
resolved `entrega`/`vertical` through one global `DEFAULT_FIELD_MAPPING`
(`entregaPrimary`/`entregaFallback`/`vertical`), and `fetch` requested a static
`DEFAULT_DESIGN_FIELDS` list.

**Reframed justification (gate-ruled).** A live Jira probe corrected the
handoff's central hypothesis: MC `entrega` is **structured at the subtask level**
in `customfield_10031` (the Story-level null was a red herring — entrega lives on
the COPYWRITER subtask), so **Axis C is not needed for MC**. PMA `entrega` is in
`customfield_11080` (`10031` absent from PMA's screens). Today both projects
resolve, but only by a **coincidental cross-project fallback chain**
`primary(10031)→fallback(11080)` in the single global default — a dormant
silent-failure hazard. 029's value: (1) each project declares its own field;
(2) fail-loud validation of configured ids against the Jira field catalog (R4);
(3) the mapping derives the narrow fetch field list. Abstraction earned (A3):
two real projects, two real field ids (MC=10031, PMA=11080).

**Slot numbering (P4):** `029` verified free across three sources — `ls
docs/tasks/` (highest `028-cli-human-display`), `git log --oneline main` (newest
merge brief 028, #69/#70), `CLAUDE.md` `E*` (reserves no 029). No conflict.

## Decisions realized (D1–D8, gate-closed, not revisited)

- **D1 — two explicit, non-identical shapes.** Per-project OVERRIDE config
  `{ entrega: string, vertical: string }` (single key, no fallback); DEFAULT
  `{ entregaCandidates: readonly string[], vertical }` retains an ordered
  candidate list (`["customfield_10031","customfield_11080"]`).
- **D2 — no speculative fallback (A3).** Override is single-`entrega`; no "just
  in case" candidate.
- **D3 — one resolved shape.** Mapper/extract consume
  `ResolvedFieldMapping = { entregaCandidates: readonly string[]; vertical }`;
  the composition root normalizes an override to `entregaCandidates: [entrega]`.
- **D4 — per-issue absence is legitimate.** `safeGetEntrega(candidates)` →
  first-non-null else `[null,null]`; `entrega_iso = null` is a valid outcome,
  not an error. Fail-loud is about config/metadata, never per-issue value.
- **D5 — derived design fields.** `deriveDesignFields = MANDATORY_DESIGN_FIELDS
  ∪ entregaCandidates ∪ [vertical]`, deduped; drops the dead, never-consumed
  `customfield_11035` / `customfield_10067`. Behavior delta: request narrows,
  payload identical.
- **D6 — loader in its own cli module.** `field-config.ts` (not inline in
  run-fetch); config-file types live in cli, not the adapter (R25).
- **D7 — global-catalog existence validation (gate-ruled).** `getFields()` →
  `GET /rest/api/3/field`; assert every configured id exists; throw naming the
  field meaning + id (R4). **Documented limitation:** verifies global existence,
  not per-project screen applicability — the PMA-`10031`-absent case degrades to
  `entrega_iso = null` (legitimate), never a silently grabbed sibling (the
  single-`entrega` collapse removes that hazard). Precise intent: fail loud on a
  nonexistent id; never substitute a sibling.
- **D8 — both-or-neither flags.** `--field-config` + `--project`: both → override;
  neither → default (backward compatible); exactly one → usage error (exit 2).

## Brief-Edit → Plan-X-commit mapping

The brief's leaf-up per-edit commit sequence was infeasible under "green at every
commit" (a signature/shape change breaks callers until later edits). Gate-approved
**Plan X** regrouped into green, refactor-then-feat commits — same edits, only
commit boundaries changed; no edit dropped or added:

- Edits 2, 3, 4, 7 + Edit-6 **derivation** → **R** (`refactor`)
- Edit 5 → **F1** · Edit-6 **validation** → **F2** · Edit 8 → **F3** ·
  Edit 9 → **F4** · Edit 10 → **F5**

## Artifacts produced (7 commits on `feat/configurable-field-mapping`)

- `b37a82f` `docs(tasks): add brief for 029-configurable-field-mapping` (brief;
  amended pre-validation for the D7 precise-intent wording)
- `609cf40` `refactor(adapter-jira): update field mapping to candidate-list shape`
  — extract `safeGetEntrega(candidates)`, `ResolvedFieldMapping`,
  `MANDATORY_DESIGN_FIELDS`, `deriveDesignFields`, `DEFAULT_FIELD_MAPPING` →
  candidate-list, mapper consumes the resolved shape, index exports; gateway uses
  the derived list. (standalone-green 138)
- `6dd1b11` `feat(adapter-jira): add getFields field-catalog client method`
  — `getFields()` GET `/rest/api/3/field`, `FIELD_CATALOG_PATH`, `JiraFieldMeta`;
  `FetchLike.body` widened to optional. (141)
- `2e33b2f` `feat(adapter-jira): add fail-loud mapping metadata validation`
  — pre-search catalog fetch + fail-loud assertion; gateway-test fakes serve the
  catalog GET; validation-throw test. (142)
- `8dfd15b` `feat(cli): add field-config loader with project selection` (146)
- `0f5ac8e` `feat(cli): add field-config and project fetch flags` (149)
- `58f88ed` `feat(cli): wire field mapping through gateway factory` (149)
- **This recap** — `docs/sessions/2026-06-21-executor-029-configurable-field-mapping.md`
  (separate docs PR).

## Deviation log (all gate-authorized, none silent)

1. **Commit R collateral — 9th file.** `fixtures/jira-responses.ts:64` carried a
   comment referencing the deleted `DEFAULT_DESIGN_FIELDS`; a one-line fix to name
   the derived mechanism was bundled into R as scope-completion (a refactor must
   leave no doc naming a symbol it removed). Reported in R's body.
2. **F1 — `FetchLike.body` → optional.** Supersedes the Pause-1 "do not change
   FetchLike" note, which rested on the false premise that GET+empty-body works.
   Empirically disproven: real `fetch` throws on a GET carrying any non-null body
   (incl. `""`). `getFields` omits `body`; the gateway-test `JSON.parse(init.body
   ?? "{}")` guard is forced compile fallout, allocated to F1. Reported in F1's body.
3. **Commit R message drift caught + amended.** The first R commit drifted the
   subject ("shape"→"model") and rewrote the body to falsely claim `getFields` +
   validation (F1/F2 work, not R). Caught by post-commit git-vs-approved
   verification; amended to the gate-approved subject + accurate body.
4. **F4 ParsedCommand present-`undefined` shape.** The fetch variant always
   carries `fieldConfig`/`project` (undefined on the no-flags path) — a uniform
   forward contract; runtime identical; two existing tests updated to the new
   shape (a shape reflection, not a behavior change). Gate kept present-`undefined`
   over omit-when-absent.

## Green mechanism (record integrity)

The pre-commit hook is **NOT wired in this clone** (`core.hooksPath` unset, no
`.git/hooks/pre-commit`). Every commit's green was proven by **manually running
`npm run build` + `npm test`**, not by the hook. Each commit was also
standalone-verified (stash the later edits, build+test the commit alone):
138 / 141 / 142 / 146 / 149 / 149. (The executor subagent twice misreported "the
hook ran"; corrected here.)

## Verification summary

- **All gates/Pauses honored.** Pause 1 (plan, incl. fixture path = runtime
  temp-dir + narrowed `getFields()` type), Pause 2 (extract.ts), Pause 3 per
  commit; plus the Plan-X commit-boundary, the F1-footprint, and the two-block
  commit reviews — each on explicit mentor go.
- **`pre-commit-self-audit`: 5/5 PASS** on all six code commits; subjects ≤ 72;
  verbs `update`/`add`/`add`/`add`/`add`/`wire` all in the allowlist SSOT; no
  co-author trailers.
- **Staged-content verified** (`git diff --cached`) before each commit, incl. the
  `git add -p` split of `gateway.test.ts` (F1 = the 2 guard hunks; F2 = catalog
  logic) and the F4 condition (existing tests changed only by the undefined-key
  additions).
- **Messages committed verbatim** via `git commit -F <file>` (git-vs-file match).
- **Build + test (authoritative, full branch):** `tsc -b` clean; `node --test`
  **149 pass / 0 fail**.
- **R25 gate:** `grep -rEn 'customfield_[0-9]' packages/core/src` → none;
  `grep -rn 'from.*adapter' packages/core/src` → none. customfield ids live only
  in the adapter + the (runtime-written) test config.
- **No `--no-verify`; no push without instruction** (R17 — push/PR were explicit
  mentor verdicts after the full-branch APPROVED).

## Doctrine observations (this session)

- **The mechanical brief-validator does not check commit-sequence feasibility.**
  Leaf-up stays green-per-commit only for *additive* changes; a coupled
  signature/shape change must be a refactor-then-feat boundary. *Rule-of-three
  candidate (2nd occurrence): a brief-authoring rule.*
- **`FetchLike` fakes do not enforce real `fetch`'s GET-no-body constraint** →
  green fakes ≠ working production for transport changes; transport changes need
  an empirical real-`fetch` check. *GOTCHAS candidate.*
- **Executor self-reports need verification.** The R-body drift and the repeated
  "hook ran" misstatement were both caught only by independent git-vs-approved
  verification — make post-commit message+staged-content verification standard.

## Forward-items (registered, not this task)

- Per-project / field-context (`createmeta`) validation (D7 limitation).
- Pre-commit hook wiring — durable fix is a `package.json` `prepare` script
  setting `core.hooksPath = .githooks` on clone + a GIT_WORKFLOW/GOTCHAS note
  (Windows-aware: hook firing is quirky).
- Axis B — status-value normalization (anchor on `statusCategory`).
- Axis C — deriving dates from text-embedded summary/description.
- `saci config project add <KEY>` discovery/onboarding generator.

## Next concrete action

`main@3b386e6` carries Axis A. Candidate next briefs: the hook-wiring chore
(cheap, unblocks the test safety net), Axis B (status normalization), or the
`config project add` generator (uses the live field-catalog introspection 029
already added).
