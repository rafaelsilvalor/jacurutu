# Mentor session recap — 2026-07-03 — 031 task-manifest-v0 + task folder internals

> Session type: mentoring (design) + pipeline supervision (caminho A, brief 031).
> Outcome: brief 031 executed, merged to main. Task-folder internal structure closed.

## Decisions taken

### D-A — Task folder internal structure (design decision; target: future `start` scaffold brief)

Ground-truth collected from Rafael (no legacy structure to preserve; redesign from zero authorized). Closed layout:

```
<KEY>_<slug>/                          <- derivePath leaf (brief 030)
+-- <vertical>_<KEY>_<desc>_<var>.<ext>  <- final exports at root
+-- editaveis/
|   +-- <vertical>_<KEY>_<desc>_<var>.psd  <- template copied + renamed on start
|   +-- assets/                        <- support files (fonts, refs, images)
+-- .saci.json                         <- TaskManifest v0
```

- Internal folder names are fixed literals, lowercase, unaccented: `editaveis`, `assets`. Code constants in English (R9); string values are designer-facing, pt-BR acceptable (same allowance as UI labels).
- Local template cache lives OUTSIDE task folders: `templates/<vertical>/...` under an app root resolved via `path.join` (R1); exact location is a config decision, not hardcoded. Flow: remote catalog list -> download on demand -> copy into `editaveis/` renamed to the naming convention.
- Local <-> Drive mirroring from `AVULSAS` down; the same derivePath serves both sides, only the prefixed root differs (Drive: `<drive>/<SEMESTRE>/`; local: designer workspace root).
- `ship` uploads the whole task folder, editables included. Closes the ROADMAP open item "what ship uploads". Known cost: large PSDs; filtering is a future brief only if it hurts.
- No app-owned versioning in alpha. Naming convention excludes version; `ship` overwrites by stable name; Drive native revisions provide history. Real local versioning is Phase 3 state (rule of three: wait for the third real pain).
- "Current month" clarification: the month segment is the DELIVERY month per derivePath (brief 030), not the upload month. Rafael confirmed his "mes vigente" phrasing meant delivery date; no derivePath errata.

### D-B — TaskManifest v0 schema (shipped in brief 031)

All fields required; camelCase keys; ISO 8601 UTC timestamps:

| Field | Type | Note |
|---|---|---|
| `schemaVersion` | `1` (literal) | first field; gates parsing before any other access; unknown version throws, no migration |
| `jiraKey` | `string` | |
| `vertical` | `string` | sigla, e.g. "OAB" |
| `slug` | `string` | derivePath leaf minus the key |
| `template` | `string` | catalog identifier, NOT a file path |
| `drivePath` | `readonly string[]` | segments, mirroring brief-030 contract; never pre-joined |
| `startedAt` | `string` | |
| `shippedAt` | `string \| null` | present with null until first ship (uniform forward contract, ParsedCommand pattern) |

Out of v0 by decision: `claimedBy`/handoff (enters with `load`), ship history (Phase 3 state), copy/briefing fields (copy ingestion parked).

### D-C — Blast radius: replace workspace.ts (shipped in brief 031)

Ground-truth inventory (executor-delegated, per standing practice) found a pre-existing `TaskManifest` inside the 2026-05-28 `workspace.ts` design, embedded in `Workspace` with `eventHistory`, `issueSnapshot`, `claimed_by`, and `drivePath: string`. Zero consumers (re-exports + one TODO comment only).

Decision: option 3 — full replace. Rationale: the 2026-05-28 design predates both the 2026-06-12 app-owns-state pivot (embedded eventHistory is Phase 3 accumulated state, not a portable-manifest concern) and the brief-030 segments contract; zero consumers means zero migration cost; keeping the shell would embed a known inconsistency (`drivePath` string vs segments, duplicated `jiraKey`) — playbook smell D3 introduced on purpose. A3 (premature abstraction) applies: the real `Workspace` type will be re-derived when the actual consumer (`start`) exists. Git history preserves the old design.

Removed: `Workspace`, `WorkspaceEvent`, `WorkspaceEventType`. Kept: `gateways.ts:43` forward TODO.

### D-D — Human-readable serialize (gate amendment, promoted to test invariant)

`serializeManifest` emits `JSON.stringify(manifest, null, 2)` + trailing newline — the `.saci.json` is human-inspected and diffed by Drive native revisions (the versioning mechanism chosen in D-A), so compact output defeats both uses. Amendment was a Pause-1 gate decision, not in the original brief; locked as test case (e) so a future refactor cannot silently regress it. Session decisions become invariants through tests.

## Executed artifact

- **Brief 031** (`docs/tasks/031-task-manifest-v0/`), caminho A (planner -> validator APPROVED, 11/11 -> mentor gate -> executor), squash-merged to main.
- Files: `packages/core/src/workspace.ts` (replaced, 114 lines), `workspace.test.ts` (new, 12 cases a-e), `index.ts` (re-exports adjusted). +194/-48. Build clean; 174 tests pass.
- Audit: all PASS across commits. One accepted deviation (below).

## Accepted deviation (recorded, not debt)

The brief's Edit 2 check `grep -cE "\bany\b" workspace.ts == 0` returned 3 — all three the English word "any" in comments (including R24 self-references "no any"). The precise type-level pattern (`:\s*any\b`, `as any`) returned 0; substantive R24 rule met. Accepted as-is; the check text was coarse, the code was not degraded to satisfy it.

**Pattern watch (rule-of-three, occurrence 2 of 3):** literal word-boundary greps colliding with meta-discourse prose. First occurrence: brief 010 sweep (G-PROC-1). Second: this brief's `\bany\b` check. If a third brief trips on a bare-word grep against comments, formalize — likely as a brief-template note: type-level checks use positional patterns (`:\s*any\b`), never bare `\b<word>\b`.

## Observations (not pending items)

- `parseManifest` validates shape, not value: empty `jiraKey` or empty `drivePath` array passes. Deliberate v0 boundary — value semantics belong to the producer, and the producer (`start`) does not exist yet. Revisit with the use case in hand, same principle as the Workspace decision.

## Pending items

1. **Docs reconciliation session (accumulating, one PR):** (a) derivePath D2 deviation (segments return type) in ROADMAP/MENTOR_BRIEF §2 — carried from session 030; (b) Phase 2 exit criterion in ROADMAP mentions `Workspace` as delivered — record the deliberate removal.
2. **Parked cluster (unchanged):** template management (curated catalog), campaign resolution, copy ingestion, period->semester-folder config, Performance flow, PMA/Jornalismo fixed destination, EPJ consolidation, automatic file-name generation (unify sanitization with derivePath leaf slug).

## Next concrete action

Natural front-runner: **`start` scaffold brief** — everything it needs is now closed (derivePath = destination, naming convention = base-file names, D-A = internal structure, TaskManifest v0 = the control file it writes). Alternative opener: campaign resolution. Rafael picks at next session start.

## Paste-ready snippet for next session

```
Ola. Continuando o projeto Saci. Modo: [mentoria | revisar plano | ...]
Ultima entrega: brief 031 task-manifest-v0 MERGEADO — TaskManifest v0 em
@saci/core (parse fail-loud + serialize legivel), workspace.ts pre-pivo
substituido (Workspace/WorkspaceEvent removidos, zero consumidores).
Estrutura interna da task FECHADA: finais na raiz, editaveis/,
editaveis/assets/, .saci.json na raiz; cache de templates por vertical
fora da task; ship sobe a pasta inteira; sem versionamento proprio
(Drive revisions); espelhamento local<->Drive a partir de AVULSAS.
TEMA DESTA SESSAO: [scaffold do `start` | campaign resolution | docs
reconciliation (D2 derivePath + remocao Workspace do Phase 2 exit)].
Carrega CLAUDE.md, MENTOR_BRIEF.md, ROADMAP.md e o recap
docs/sessions/2026-07-03-mentor-031-task-manifest.md.
Antes de propor proximo passo, confirma em uma frase quem sou e o modo.
```
