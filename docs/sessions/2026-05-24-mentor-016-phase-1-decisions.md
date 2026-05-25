# Session recap — 2026-05-24 — mentor — 016-phase-1-decisions

**Mode:** mentoring (close open Phase 1 decisions before delegating to the pipeline).
**Mentor:** Claude Chat (this session).
**Continuation of:** `docs/sessions/2026-05-23-mentor-015-docs-reconciliation.md`.

Short focused session. Five Phase 1 implementation decisions closed (package boundaries, tsconfigs, test runner integration, CLI library, versioning policy). No briefs, no code, no PRs. Output is a delegation block for `@planner` (next concrete action). Two of the five decisions are flagged for promotion to `ROADMAP.md` §Pending decisions via an Edit prescribed in the upcoming brief.

## Decisions taken

- **D1 — Package boundaries fixed.** Layout `packages/<name>/` for the four workspaces. Names scoped under `@saci/`: `@saci/core`, `@saci/adapter-jira`, `@saci/adapter-sheets`, `@saci/cli`. All four `private: true`. Only `@saci/cli` declares `"bin": { "saci": "./dist/cli.js" }`. Internal dependencies declared explicitly in each `package.json` (e.g. `"@saci/core": "*"`). Rationale: scope removes ambiguity in imports (`from "@saci/core"` vs ambiguous `from "core"`); reserves namespace if any package goes public; rename cost (~30-60 min mechanical find-and-replace) is bounded and one-off. → `packages/*/package.json` (brief 016).

- **D2 — TS configs fixed.** Base config `tsconfig.base.json` at repo root; each package extends it. `target: ES2022`; `module: NodeNext`; `moduleResolution: NodeNext` (mandated by R21 ESM + `.js` import extensions). Project references enabled via `"composite": true` in every package tsconfig; root tsconfig declares `references` to the four packages; `tsc -b` orders the build. Base flags: `strict`, `esModuleInterop`, `skipLibCheck`, `forceConsistentCasingInFileNames`, `declaration`, `declarationMap`, `sourceMap`, `outDir: ./dist`, `rootDir: ./src`. `noUncheckedIndexedAccess` deferred to Phase 2 when there is real code to exercise it. → `tsconfig.base.json` and `packages/*/tsconfig.json` (brief 016).

- **D3 — Test runner integration: Option A (compile-and-test).** `tsc` compiles `*.test.ts` files alongside source into `dist/**/*.test.js`; `node --test` runs the compiled `.js` files. Zero new runtime dependencies (aligned with R2 and the "minimal stack" DNA). Type checking is unified with the build (impossible to have a test pass with a type error, unlike Options B and C). Migration path to `--experimental-strip-types` (Option C) remains open as a reversible future change when Node stabilizes the flag (≥ 23.6) and/or TDD loop friction becomes real. Option B (`tsx` loader) rejected: introduces a runtime dep without justification strong enough in Phase 1. → `package.json` scripts at root + per-package (brief 016).

- **D4 — CLI library: `node:util` `parseArgs` builtin.** Phase 1 only requires `saci --version`; any library is over-engineering now. `parseArgs` (Node 18.3+) covers flag parsing without deps. Subcommand dispatch handled manually (switch over `argv[0]` after parsing) — works up to ~5-7 commands. Decision to be revisited at Phase 2→3 transition when production flow commands arrive; commander vs. citty vs. continue-with-builtin will be decided then with real usage data. Future migration is mechanical and isolated in `@saci/cli`. → `packages/cli/src/cli.ts` (brief 016).

- **D5 — Versioning policy: defer.** All four `package.json` carry `version: "0.0.0"`. No release tooling (no changesets, no version bump scripts) introduced now. Milestones marked via git tags on root (`v0.1.0`, `v0.2.0`, ...) — tags identify the product, not the internal packages. `private: true` (D1) blocks accidental `npm publish`. Decision to be revisited at Phase 4 (or earlier if any package needs a real version) — choice between single (lockstep), independent, or continued defer happens then with adapter stability as input. → no concrete change in brief 016 beyond `"version": "0.0.0"` in each `package.json`.

- **ROADMAP promotion classification.** Of the five decisions, two are product-level gates of future phases and warrant promotion to `docs/ROADMAP.md` §Pending decisions: D4 (CLI library choice at Phase 2→3) and D5 (versioning policy at Phase 4). D3 has a future trigger (Node strip-types stabilization) but the trigger is an external event, not a decision pending on our side — stays as a brief 016 internal note. D1 and D2 are pure implementation detail; no ROADMAP entry. → brief 016 includes an Edit prescribing the §Pending decisions additions.

- **Pipeline does not auto-update ROADMAP.** Observation surfaced during the session: the `planner → validator → executor` pipeline is mechanical and has no judgment for "this decision deserves ROADMAP §Pending decisions promotion". That classification is mentor-side. The delegation block must pre-classify and prescribe the Edit explicitly. Catalog candidate for `AGENT_PLAYBOOK.md` Chapter 6 as a future lesson. → not in scope for brief 016; recorded here.

## Open items

### High-priority — affects next session

- **Brief 016 (Phase 1 monorepo bootstrap) to be opened in the next Claude Code session via the `@planner` agent.** Delegation block prepared in this session (see "Snippet for the next session" below). Brief NNN to be confirmed by planner via P4 at modeling time (likely 016; reserve verification through `ls docs/tasks/`, `git log --oneline main`, `CLAUDE.md` E*).

- **R23 runner-integration decision recorded as D3.** Per the executor 009 recap, `ROADMAP.md ## Pending decisions` was to be updated "accordingly" when R23 resolved. Resolution: stays as internal brief 016 note, not a §Pending decisions entry — the choice is closed for now, and the future migration is gated on an external event (Node flag stabilization), not on a pending decision.

### Pending from prior sessions (unchanged)

- **Brief 012 R10 subject-length errata.** Three subjects in brief 012 on-disk text still > 72 chars. No urgency unless brief 012 is cloned as template.
- **Brief 013 verb-count errata.** Historical; documented in prior recaps.
- **JS libraries for Jira REST and Google Sheets.** Pre-Phase-4 research; not blocking Phase 1.
- **`ProductionFlow` / `Workspace` abstraction.** Surfaces during Phase 2 port.
- **"Old 013" carry-over** — executor memory placement, no-verbal-override pattern, draft skill promotion. Deferred post-Phase-1.
- **Operational hygiene catalog candidates from 015 audit:** `pre-commit-self-audit` Check 3 allowlist extension (canonicalize, reduce, wire, deprecate, clean); CLAUDE.md line 49 stale ref (`harness/setup-chat.md` → `harness/workflows/setup-chat.md`); G-PROC-1 complement on `grep | head` truncation. Bundled "operational hygiene" follow-up brief candidate; not blocking Phase 1.

### New (from this session)

- **AGENT_PLAYBOOK Chapter 6 catalog candidate.** "Mentor pre-classifies decisions for ROADMAP promotion; pipeline does not infer this." Lesson formulation pending. Not blocking Phase 1.

### Operational — pending before next session

- **This recap reviewed and merged via separate PR**, per project convention since session 010. Naming: `2026-05-24-mentor-016-phase-1-decisions.md` follows `<date>-<role>-<NNN>-<slug>` (close-chat-session.md PASSO 3).
- **Re-upload to claude.ai project knowledge** after recap PR lands: this file. No other canonical files modified this session.

## Artifacts produced

- **This mentor recap** — `docs/sessions/2026-05-24-mentor-016-phase-1-decisions.md` (delivered to `/mnt/user-data/outputs/`; user saves via caminho B on a separate recap branch).
- **Delegation block for `@planner`** — embedded below in "Snippet for the next session". Contains the five D1-D5 decisions, ROADMAP promotion sinalization for D4/D5, and Phase 1 scope reminders.

No briefs, no code, no PRs from this session.

## Next concrete action

Open a new Claude Code session. Invoke `@planner` with the delegation block below. Planner produces `docs/tasks/<NNN>-phase-1-monorepo-bootstrap/brief.md` (NNN via P4). `@brief-validator` runs. On PASS, `@executor` runs the brief end-to-end. Phase 1 closes with `saci --version` green, `node --test` green on placeholder suite.

## Snippet for the next session

Paste-ready block for the next Claude Code session (invokes `@planner`):

```
@planner

Modelar brief Phase 1 — monorepo bootstrap.

Escopo (estrito, per ROADMAP §Phase 1):
- npm workspaces stand-up dos 4 packages: @saci/core, @saci/adapter-jira,
  @saci/adapter-sheets, @saci/cli.
- tsconfig base + per-package compilando via `tsc -b`.
- node:test integration funcionando com suite placeholder vazia (verde).
- `saci --version` imprimindo a versão.

Fora de escopo (rejeitar tentação de "fácil de adicionar"):
- Domain logic (Phase 2).
- Adapters (Phase 4).
- CLI commands além de --version.
- Bundling, packaging, signing (Phase 3+).

Decisões já fechadas em chat (não revisitar — passar como D-prefix no brief):

D1 — Package boundaries.
- Layout: packages/<name>/ (4 pacotes).
- Names: @saci/core, @saci/adapter-jira, @saci/adapter-sheets, @saci/cli.
- private: true em todos.
- Apenas @saci/cli tem "bin": { "saci": "./dist/cli.js" }.
- Deps internas declaradas explicitamente em cada package.json
  (ex: "@saci/core": "*").

D2 — Tsconfigs.
- tsconfig.base.json na raiz; cada package estende.
- target: ES2022; module: NodeNext; moduleResolution: NodeNext.
- Project references com "composite": true em todos os tsconfigs do
  package; root tsconfig declara "references" pros 4.
- Base flags: strict, esModuleInterop, skipLibCheck,
  forceConsistentCasingInFileNames, declaration, declarationMap,
  sourceMap, outDir: ./dist, rootDir: ./src.
- noUncheckedIndexedAccess: ADIADO pra Phase 2 (não incluir no base agora).

D3 — Test runner integration.
- Option A (compile-and-test): tsc compila *.test.ts pra dist/**/*.test.js;
  node --test roda os .js.
- Zero deps novas (aderente a R2).
- Type check unificado com o build.
- Migração futura pra --experimental-strip-types (Node ≥ 23.6) fica como
  caminho reversível; não incluir nada agora.

D4 — CLI library.
- node:util parseArgs builtin (Node 18.3+).
- Subcomandos manuais (switch sobre argv) — Phase 1 só precisa --version.
- Decisão final (commander / citty / continuar builtin) adiada pra
  transição Phase 2→3.

D5 — Versioning policy.
- version: "0.0.0" em todos os 4 package.json.
- Sem changesets, sem version bump scripts agora.
- Milestones marcados via git tags no root (v0.1.0, etc.).
- Decisão final (single vs independent vs continuar defer) adiada pra
  Phase 4.

Edit obrigatório a incluir no brief (promoção ROADMAP):

- docs/ROADMAP.md §Pending decisions ganha duas entradas novas
  (numeradas continuando a lista atual):
  - "CLI library escolha definitiva. Phase 1 usa node:util parseArgs
    builtin. Revisar na transição Phase 2→3 quando production flow
    trouxer comandos reais (commander vs citty vs continuar builtin)."
  - "Versioning policy (single vs independent vs defer). Phase 1-3 usa
    version: '0.0.0' + git tags no root. Decidir na Phase 4 quando
    adapters estabilizarem."
- D3 NÃO promove (trigger é evento externo, não decisão pendente nossa).
- D1, D2 NÃO promovem (implementação, não produto).

Constraints obrigatórias (canônicas — não revisitar):
- CLAUDE.md R20-R25 aplicáveis desde o dia 1.
- MENTOR_BRIEF §2 (active architectural decisions) intacto.
- R9 — agent-consumed surface em English.
- Caminho B se aplicável; STATE.md lifecycle per executor.md.
- pre-commit-self-audit em cada Pausa 3.

Aplica P4 antes de fixar o NNN do brief — três fontes:
ls docs/tasks/, git log --oneline main (último merge: PR de brief 015),
CLAUDE.md E*.

Recap-fonte: docs/sessions/2026-05-24-mentor-016-phase-1-decisions.md.

Compact mode da sessão de chat: ativo (referência; não afeta brief
authoring, que segue o template canônico full).
```

---

**Snippet alternativo (caso a próxima sessão volte ao chat antes do pipeline):**

```
Olá. Modo: mentoria (continuação curta — ou continuar tarefa, se o
pipeline já tiver rodado e produzido brief 016).

Continuação de 2026-05-24-mentor-016-phase-1-decisions. Cinco decisões
de Phase 1 fechadas (D1 package boundaries, D2 tsconfigs, D3 test runner
compile-and-test, D4 CLI parseArgs builtin, D5 versioning defer).
Delegação pro @planner pronta no recap acima.

Próxima ação (se ainda não rodou): abrir sessão Claude Code, invocar
@planner com o bloco de delegação do recap. Esperar brief 016 + veredicto
do @brief-validator + execução do @executor.

Próxima ação (se já rodou e mergeou): audit-merge do brief 016
(três dimensões); decidir se cluster Phase 1 fechou ou tem follow-ups
imediatos.

Compact mode: [manter | trocar]

Antes de propor próximo passo, confirma quem entendeu que sou e o
modo da sessão (M-R13).
```
