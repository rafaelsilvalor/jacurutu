# Session recap — 2026-05-27 — mentor — 016-phase-1-execution-followup

**Mode:** mentoring (chat-side accompaniment of the orchestration pipeline executing brief 016 end-to-end).
**Mentor:** Claude Chat (this session).
**Executor (separate Claude Code sessions):** `@planner` (multiple iterations), `@brief-validator`, `@executor`.
**Continuation of:** `docs/sessions/2026-05-24-mentor-016-phase-1-decisions.md` (closed via PR #31).

Long, dense session. First end-to-end use of the orchestration pipeline (planner → brief-validator → executor) on a real code-bearing brief. Brief 016 — Phase 1 monorepo bootstrap — merged via PR #33 with 7 commits. Pipeline produced functional output (all verification gates green) but surfaced 6+ systemic gaps catalogued for follow-up. Chat-side mentor role concentrated on three streams: (a) reviewing planner output before validator, (b) decision support at executor Pause 3 STOPs, (c) classifying findings for ROADMAP promotion and follow-up briefs.

## Decisions taken

### Brief 016 modeling (chat → planner iterations)

- **Brief split into `brief.md` + `snippets.md` sibling files.** Brief 016 first draft hit ~840 lines (vs SKILL guidance 200-400 for Category L). Resolution: moved code/JSON blocks to `snippets.md` sibling, brief.md kept verification matrix + Constraints + Edits. Pattern reusable for bootstrap-class briefs that hit guidance ceiling for legitimate reasons (verification density, not bloat). → applied to `docs/tasks/016-phase-1-monorepo-bootstrap/`.

- **Branch type `chore/`, not `docs/`.** Decision rule applied: branch type follows the majority of files modified, not the brief artifact. Phase 1 bootstrap is majority toolchain/scaffold (10+ files) vs minority docs (brief + ROADMAP + MENTOR_BRIEF, 3 files). Individual commits keep their own types (mix is normal). → `chore/phase-1-monorepo-bootstrap`.

- **Build script collision pinned inline, not deferred to Pause 2.** v1 had `build: electron-builder` script; v2 needed `build: tsc -b`. Resolution: rename v1 script to `build:electron` + add new `build: tsc -b` + add `test: node --test packages/*/dist/**/*.test.js`. Rationale: v1 freeze (CLAUDE.md E5) requires v1 build remain functional for hotfixes; overwrite would violate freeze semantic. Decision pinned in brief (Edit 3); executor had no runtime choice. → `package.json` Edit 3.

- **`@types/node` aligned to `^22`.** Initial planner output had `@types/node: ^20` with auto-defensive note. Verified: no technical reason for `^20`. Aligned to `^22` matching runtime engines. Note paragraph collapsed from 9→5 lines. → root `package.json` devDependencies.

- **Node version target pinned at ≥22.0.0.** Architectural decision missing from MENTOR_BRIEF §2 prior to brief 016. CLAUDE.md line 22 "Node 18+ required" was v1 Electron heritage, never bumped for v2. Pinned 22 (LTS) for three reasons: (i) enables ESM import attributes (`with { type: "json" }`) used in `cli.ts`; (ii) comfortable margin for Phase 3 production mode designers; (iii) Node 24 was rejected as cutting-edge for designer-facing runtime. Pinned in three places: root `package.json` engines, `.nvmrc`, `packages/cli/package.json` engines. → Edit 3 + Edit 7 of brief 016.

- **Sentinel tests with 3-anchor comment.** 4 sentinel tests (one per package) all carry the same canonical comment (`Phase 1 sentinel: confirms the package compiles, the test runner discovers this file, and node:test executes without error. Real tests arrive in Phase 2 with domain logic.`). R8 compliance + prevents future "this looks like debug, let me delete it" creep. → `packages/*/src/index.test.ts`.

- **CLI reads its own package.json via ESM import attribute, not `readFileSync`.** Initial planner output used `readFileSync(join(__dirname, "..", "package.json"))`. Replaced with `import pkg from "../package.json" with { type: "json" }` (Node 22+ feature enabled by Node version pin). Removed an orphan `resolveJsonModule: true` flag in `cli/tsconfig.json` from being dead code — now actively justifies the flag. Comment added explaining `0.0.0` is intentional per D5 versioning defer. → `packages/cli/src/cli.ts` snippet.

- **Pause-points "scope-adjacent finding" example rewritten.** First-draft example referenced `.gitignore` (which Edit 5 itself modifies); that's brief-defect territory, not scope-adjacent. Replaced with `package-lock.json` flat-structure observation example. Pattern: scope-adjacent examples must be outside *any* Edit. → brief 016 Pause-points section.

### Pre-execution friction resolution

- **`.claude/settings.local.json` untracked via separate PR #32 before invoking `@executor`.** File was tracked indevidamente (local-only by Claude Code convention, equivalent to `.env.local`). Working tree dirtiness from this file would block executor Pause 3 (Layer 3 STOP-on-git-status-dirt). Resolution: created `chore/gitignore-claude-local-settings` branch, added file to `.gitignore`, ran `git rm --cached`, merged via PR #32. Rebased brief 016 branch onto new `main` post-merge. Pattern: structural fixes that block executor should be resolved as separate PRs before invoking the pipeline, not patched in runtime via `git restore`. → PR #32 merged as `ae16118`; brief 016 branch rebased clean.

### Execution phase — chat-side decisions at Pause 3 STOPs

- **`pre-commit-self-audit` Check 3 verb allowlist enforced strictly, no ad-hoc extensions.** Four verb collisions occurred during execution: `declare` (#3), `ignore` (#5), `promote` (#6), `record` (#7). Each surfaced as STOP. Decision rule applied: revise commit subject to use an allowlist verb that semantically fits the action, not the first available verb. Rejected the alternative path (one-off override extending allowlist locally) because it would contradict Lesson #6 of brief 015 audit (67% STOP rate on Check 3 was the symptom of ad-hoc extensions creeping in). → 4 commit subjects revised in-flight.

  | Commit | Brief-proposed verb | Revised to | Verb fit rationale |
  |---|---|---|---|
  | #3 | declare | add | `add` is in allowlist; semantically equivalent for declaring config |
  | #5 | ignore | add | `add to ignore list` preserves semantics while using allowlist verb |
  | #6 | promote | update | `update` describes growing a list better than `add` (which was heavy in earlier commits) |
  | #7 | record | document | `document` names the action of registering a decision in a decision log |

- **Edit 5 (`*.tsbuildinfo` gitignore) ressuscitated mid-execution via Pause 2 bundle.** Executor surfaced two findings at Pause 2 of commit #4 (after scaffolding packages): (A) `package-lock.json` modified by `npm install` post-scaffold, not staged; (B) `*.tsbuildinfo` files generated by `tsc -b` with `composite: true`, not covered by existing `.gitignore`. Decided A1+B1 (bundle): A1 stages lockfile with commit #4 (causally Edit 4), B1 un-skips Edit 5 (originally no-op because `dist/` and `node_modules/` were already covered) to add `*.tsbuildinfo` to `.gitignore`. Total commits revised 6→7. Placement of new gitignore line: line 3 (grouped with `dist/`) per existing category-based ordering. → commit #4 + commit #5.

- **STATE.md not used.** Decision A from D5 protocol of brief 016. Single-session execution confirmed; no multi-session estimate triggered STOP at Pause 1. → no STATE.md commits.

### Post-execution classification

- **Two product-level decisions promoted to `docs/ROADMAP.md` §Pending decisions.** D4 (CLI library choice at Phase 2→3) and D5 (versioning policy at Phase 4) added as entries 6 and 7. D1, D2, D3 stayed implementation-only (no ROADMAP entry). → `docs/ROADMAP.md` Edit 6 of brief 016.

- **Pipeline does not auto-classify decisions for ROADMAP promotion.** Observation carried from 016-phase-1-decisions recap, confirmed during this execution. The `planner → validator → executor` pipeline is mechanical; mentor-side classification of "this decision deserves ROADMAP promotion" must be pre-classified in the delegation block. Catalog candidate for `AGENT_PLAYBOOK.md` Chapter 6 as a future lesson. → not in scope for any brief yet.

## Open items

### High-priority — next session

- **"Operational hygiene" follow-up brief** to model. Bundle of 4 items consolidated through this session and prior recaps:
  1. **Ship pre-commit hook canonical from G-R8** (`docs/GIT_WORKFLOW.md` lines 121-142 already document the script + setup instructions; mechanical ship, no design decisions). Slug candidate: `chore/setup-git-hooks`.
  2. **Doc-tighten `.claude/agents/executor.md` line 54.** Says "Required for Category L tasks" without the conditional that G-R10 has. 1-line correction.
  3. **Verb collision systemic gap** (the biggest item — surfaced 4× in this execution + 6× in 015 audit). Decide between: (a) expand allowlist with verbs commonly used in doc work (`declare`, `ignore`, `promote`, `record`, `canonicalize`, `reduce`, `wire`, `deprecate`, `clean`); (b) add a check in `brief-validator` that cross-checks brief-prescribed commit subjects against `pre-commit-self-audit` allowlist; (c) both. Decision is doctrinal — needs short chat-side mentoring before modeling.
  4. **Audit findings in v1 transitive deps** (4 moderate, 7 high reported by `npm install` during commit #3). Assess severity; if any high-severity CVE is in v1-prod path, becomes `fix(security)` brief instead of bundling here.

  Recommendation for next session: open in **mentoring** mode to close item 3 (verb collision strategy) before invoking the planner. Items 1, 2, 4 are mechanical or assessment work that the pipeline can handle.

### Pending from prior sessions (status)

- **"Old 013" carry-over** — executor memory placement, no-verbal-override pattern, draft skill promotion. Status: deferred post-Phase-1 still applies. Phase 1 is now closed; this can be revisited but with new data (4 verb collisions, lockfile/tsbuildinfo bundling, brief split pattern) that may change the priorities.
- **Brief 012 R10 subject-length errata.** Historical; no urgency.
- **Brief 013 verb-count errata.** Historical.
- **JS libraries for Jira REST and Google Sheets.** Pre-Phase-4 research; not blocking.
- **`ProductionFlow` / `Workspace` abstraction.** Surfaces in Phase 2 port.

### New gotchas observed (catalog candidates)

- **`.claude/settings.local.json` accumulating permissions per session.** Even with file properly gitignored, every session adds entries as Claude Code runs new commands. Not a problem when gitignored, but worth noting in `docs/GOTCHAS.md` as `G-PROC-3` candidate: "Claude Code regenerates and amends `.claude/settings.local.json` whenever it requests a new bash permission. Keep gitignored permanently; do not bother preserving its content between sessions."
- **`git restore` resurrecting deleted-from-disk files via gitignore.** During the gitignore-settings PR + rebase sequence, `.claude/settings.local.json` was deleted from disk (probably during rebase). Re-stubbing it manually was needed before invoking executor to avoid mid-execution permission prompts. Worth a one-line note that gitignored files deleted from disk don't auto-resurrect; create a stub if the tool needs the file present.
- **`tsc -b` with `composite: true` generates `*.tsbuildinfo` outside `dist/`.** Already gitignored now via Edit 5; but the gotcha is that "tsc output" doesn't mean only `dist/`. Catalog candidate: extend any future TS toolchain documentation to mention `*.tsbuildinfo` explicitly.

### Operational — pending before next session

- **PR #33 merged.** Squash commit on `main` as `3972f6b`.
- **This recap reviewed and merged via separate PR**, per project convention since session 010. Naming: `2026-05-27-mentor-016-phase-1-execution-followup.md` follows `<date>-<role>-<NNN>-<slug>` (close-chat-session.md PASSO 3).
- **Re-upload to claude.ai project knowledge** after recap PR lands. Files touched by PR #33 that should be re-synced:
  - Root: `package.json`, `tsconfig.base.json`, `tsconfig.json`, `.nvmrc`, `.gitignore`.
  - Packages: `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/cli/src/cli.ts` (one example of `packages/*/src/index.test.ts` since all 4 are byte-identical — `packages/core/src/index.test.ts` is fine), the 4 `packages/*/tsconfig.json` are also worth syncing if space allows.
  - Docs: `docs/ROADMAP.md`, `docs/MENTOR_BRIEF.md`, `docs/tasks/016-phase-1-monorepo-bootstrap/brief.md`, `docs/tasks/016-phase-1-monorepo-bootstrap/snippets.md`.
  - This recap, once committed.

## Artifacts produced

- **Brief 016** — `docs/tasks/016-phase-1-monorepo-bootstrap/brief.md` + `snippets.md` (modeled via the orchestration pipeline; merged via PR #33).
- **PR #32 (preparatory)** — `chore(gitignore): untrack .claude/settings.local.json`, merged as `ae16118`.
- **PR #33 (brief 016)** — `chore(phase-1): monorepo bootstrap — TS workspaces and CLI`, merged as `3972f6b`. 7 commits squashed.
- **Executor self-audit telemetry** — 35/0/0 PASS/WARN/FAIL after revisions; 4 STOPs in-flight on Check 3 (verb collisions), all resolved via Pause 3 revisions.
- **This mentor recap** — `docs/sessions/2026-05-27-mentor-016-phase-1-execution-followup.md` (delivered to `/mnt/user-data/outputs/`; user saves via caminho B on a separate recap branch).

## Pipeline performance — first end-to-end use

The orchestration pipeline (planner → brief-validator → executor) ran end-to-end for the first time on a real code-bearing brief. Observations:

- **Planner.** Multiple iterations needed (~5 amend cycles in chat-side review pre-validator). Most iterations were about catches the planner did not make (lockfile collision, tsbuildinfo, Node version missing from MENTOR_BRIEF, verb allowlist mismatches in commit subjects). Planner did well at: respecting closed decisions (D1-D5 never revisited), surfacing legitimate non-trivial decisions for user (build collision, brief line count, branch type), applying P4 numbering protocol cleanly.
- **Brief-validator.** Returned APPROVED on first run (10/10 PASS) and APPROVED on re-validation post-amend. Validator is doing what it was scoped to do (mechanical checks). Not what it doesn't (verb checks vs `pre-commit-self-audit` allowlist — confirmed gap).
- **Executor.** Excellent behavior at Pause 2 (surfaced scope-adjacent findings instead of unilateral bundling), Pause 3 (4 STOPs on Check 3 caught + reported + revised), and meta-observation (identified "fourth verb collision = systemic pattern" without prompting). Self-audit telemetry was reported accurately including correction to its own final report (4 STOPs vs originally reported "1 STOP").

Overall verdict: pipeline works. Friction is in the seams between agents (planner's commit subjects don't pre-check against executor's audit) and in places where the pipeline's mechanical nature meets decisions that require judgment (ROADMAP promotion, verb selection beyond allowlist). Both are addressable via the catalogued follow-ups.

## Next concrete action

Open a new chat session in **mentoring** mode. Target: close item 3 of the operational hygiene bundle (verb collision strategy: expand allowlist vs. brief-validator cross-check vs. both). Once decided, delegate operational hygiene brief modeling to `@planner` via Claude Code.

## Snippet for the next session

```
Olá. Modo: mentoria.

Continuação de 2026-05-27-mentor-016-phase-1-execution-followup.
Phase 1 monorepo bootstrap fechado (PR #33 mergeado em 3972f6b).
Pipeline orquestracional rodou end-to-end pela primeira vez —
funcionou, mas surfaceou 4 itens pra bundle "operational hygiene".

Próxima tarefa: fechar a decisão doutrinal do bundle (item 3 — verb
collision sistêmica) antes de delegar pro planner. Três caminhos:
(a) expandir allowlist com verbs comuns de doc work, (b) adicionar
check no brief-validator que cruza subjects contra allowlist do
pre-commit-self-audit, (c) ambos. Dataset disponível: 4 verb
collisions em brief 016 (declare, ignore, promote, record) +
6 collisions em brief 015 audit (canonicalize, reduce, wire,
deprecate, clean + 1 não-recapped).

Após item 3 fechado, modelar bundle "operational hygiene" via
pipeline. Itens 1, 2, 4 são mecânicos/assessment:
1. Ship hook canônico de G-R8 (chore/setup-git-hooks).
2. Doc-tighten executor.md linha 54.
3. Verb collision (esta sessão decide).
4. Audit findings v1 transitive deps (assess severity).

Recap mais recente: 2026-05-27-mentor-016-phase-1-execution-followup.md.
Re-upload no project knowledge: arquivos do PR #33 (root configs,
packages, docs), este recap.

Compact mode: [manter | trocar]

Antes de propor próximo passo, confirma quem entendeu que sou e o
modo da sessão (M-R13).
```
