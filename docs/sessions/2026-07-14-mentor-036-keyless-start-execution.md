# Session recap — 2026-07-14 — 036-keyless-start execution (mentor)

**Mode:** continuar — supervised execution of brief 036 (amended), full
Pause protocol: Pause 3 × 5 commits, Pause 2 × 4 Edits, Pause 1 plan
approval.
**Consumes:** brief `docs/tasks/036-keyless-start/brief.md` (amended per
the D11 gate ruling, re-APPROVED by the validator), gate rulings from the
2026-07-13 mentor session
(`docs/sessions/2026-07-13-mentor-036-keyless-start.md`).
**Pairs with:** the executor 036 recap in this same PR.

## One-line summary

Supervised the full execution of brief 036 — keyless `start` (identity
state module, `--local` parser mode, local-born `runStart` with the P2
counter ordering, CLI shell wiring with offline E2E proof) — as 5 commits
on `feat/keyless-start`, 232/0 tests, not pushed; four evidence-close
lapses surfaced mid-run, root-caused as transport (not protocol
negligence), and queued as a pipeline hardening item.

## Pipeline events, in order

- **D11 amendment confirmed applied:** commit #1's Pause 3 verified the
  brief on disk carries the amended D11 (fail-loud `--due` validation at
  the CLI boundary). Validator re-APPROVED before execution (per the
  gate-session contract; no return to mentor chat was needed — the patch
  stayed within D11 + affected tests).
- **Pause 1 — plan APPROVED** with three executor-proposed decisions
  ratified:
  - (a) reuse `parseEntrega` from `@saci/core` for `--due` validation —
    validator and month chain coherent **by construction**; parser stays
    pure; anti-A3 (no reimplemented date parsing).
  - (b) the P2 test trio: pre-persist failure (collision → counter
    intact), at-persist failure (read-only identity file → workspace
    untouched), post-persist failure (crashing injected clock → gap
    burned, healthy re-run mints the next number, no reuse).
  - (c) E2E by spawning compiled `dist/cli.js` with a clean env — the
    only real proof of "100% offline" and of the P1 resolution.
- **Two binding guard-rails issued at plan approval:**
  1. E2E exit codes follow the **existing** `cli.ts` convention, verified
     on disk before writing tests. Outcome: `cli.ts:25-27` — 0/1/2
     (ok/runtime/usage, D-a4); matched the proposal, no plan adjustment.
  2. The `jira_updated_at: ""` why-comment must state the rationale
     (non-nullable `DerivePathInput` field + core out of scope) — honored
     — and a parking-lot item recorded (see below).

## Commits (all evidence-closed verbatim in mentor chat)

| # | SHA | Message |
|---|---------|---------|
| 1 | 0cb6864 | docs(tasks): add brief for 036-keyless-start |
| 2 | 3ba636c | feat(cli): add identity state module for local task keys |
| 3 | 74f8929 | feat(cli): add --local mode to start argv parsing |
| 4 | 14e4bba | feat(cli): support local-born tasks in runStart |
| 5 | d7229d1 | feat(cli): wire start --local through the CLI shell |

Final state: build exit 0, **232 tests / 0 fail** (baseline 206 → +6
identity, +11 argv, +6 run-start, +1 display, +3 E2E, −1 Phase-1
sentinel). Diff +1525/−61 across 11 files, all within the brief's allowed
paths; `packages/core/**` untouched. **Not pushed** (G-R5); no
`Co-authored-by`; no `STATE.md` (single session).

## Deviation (1, approved at Pause 2 / Edit 4)

`display.test.ts` fix (+2 lines, `localKey: null` in typed literals)
moved from planned commit 5 into commit 4 — signature-forced by
`StartRunResult.localKey`; the alternative was a red commit-4 boundary
(violates the green-boundary constraint). Annotated in the commit-4
staged scope.

## Recorded acceptances (Pause 2 / Edit 5)

1. **Mirrored exit-code constants in `cli.test.ts`** (not imported), with
   a "must mirror cli.ts (D-a4)" comment: the structurally correct
   consequence of decision (c) — a spawn-based E2E must not import the
   side-effectful entry module. Not an R7 lapse; recorded so future
   readers do not misread it.
2. **Phase-1 sentinel replaced, not kept:** the 3 E2E subsume the
   compile-and-run proof by construction.
3. (From Pause 2 / Edit 2) **Non-atomic `writeIdentityState` accepted:**
   corruption fails loud on next read with seed guidance; manual recovery
   per 035-D2. Temp-then-rename only if real pain emerges
   (below rule-of-three).

## Evidence-close lapses — the run's process finding

Four lapses occurred: commit #1's paste skipped twice, commit 3's skipped
twice (the second time in a turn that acknowledged the demanded item
numbering without executing item 1). Escalation was issued (one more skip
→ run halt); the debt cleared fully and the remaining closes were
exemplary. **Root cause, reported by the executor and reclassified by the
mentor:** evidence pastes were emitted in intermediate blocks between
tool calls, which do not reliably reach the chat — a **transport failure,
not protocol negligence**. Executor self-corrected mid-run (all evidence
moved to the turn's final message).

**Queued pipeline item (caminho B, owner decision pending):** harden the
executor protocol with (1) the mechanical rule "all evidence goes in the
turn's final message, never in an intermediate block", and optionally
(2) the precondition "no new Pause opens while a prior evidence-close is
outstanding" — the manual enforcement mechanism that worked this run.
Four occurrences with identified cause: above rule-of-three, mature to
formalize.

## Parking lot

- Align `DerivePathInput.jira_updated_at` to `string | null` (the
  `started_at` pattern) next time core opens — eliminates the `""`
  absence sentinel `runStartLocal` uses today (why-comment in code
  references D9 and the rationale). Second member of the "lying fields"
  family; do not let it reach a third without action.

## Out-of-scope findings

None (no unrelated bugs). Minor: `argv.ts` `routeCommand` already
exceeded the R6 budget (~68 lines) before this brief — resolved in
passing by the `routeStart`/`routeStartLocal` extraction the Edit itself
required. Nothing new for `GOTCHAS.md`.

## Pending items (queue)

1. **Owner authorization: push `feat/keyless-start` + open PR** (mentor
   recommendation: go — run is clean, nothing blocks). Squash merge via
   GitHub UI; forced local branch delete after.
   [CONFIRMAR: feature PR #NN at main@<sha>.]
2. **Docs PR after the feature merge** (035 pattern): this recap + the
   executor 036 recap + the 2026-07-13 mentor recap (gate session, still
   not on disk).
   [CONFIRMAR: recaps PR #NN at main@<sha>.]
3. **Pipeline protocol patch** (evidence-transport hardening, caminho B)
   — mentor authors on owner go.
4. Open-in-software (D3 of session 032) — small follow-up brief.
5. Template naming convention + sanitization unification.
6. Hygiene below rule-of-three: `payload.json` in `.gitignore` (3rd
   sighting this run — NOW at rule-of-three, eligible for the next
   hygiene batch), missing-env error DX (2nd).
7. `gateways.ts` manifest-shape TODO (from 035 report).
8. Parked: Jira-born manual overrides; parking-lot `jira_updated_at`
   nullability (above); parked cluster unchanged.
9. Horizon unchanged: `ship` command, `@saci/*` → `@breu/*` rename
   (README rides it), `saci config` (now the identity-file writer with a
   stable on-disk format waiting for it).

## Next concrete action

Owner authorizes push → executor pushes and opens the PR → owner squash
merges → docs PR with the three recaps → owner decides on the protocol
patch (item 3).

## Paste-ready snippet for next mentor session

```
Ola. Continuando o projeto Saci. Modo: [mentoria | modelar tarefa | ...].
Ultima entrega: brief 036 keyless start executado integralmente — 5
commits em feat/keyless-start (identity state module ~/.saci/
identity.json + SACI_IDENTITY_FILE; --local no parser com parseEntrega
no --due; runStartLocal com ordem P2 persist-entre-validacao-e-mutacao
+ trio de testes; wiring no shell com 3 E2E offline por spawn). 232/0.
Gate rulings implementados como ratificados. 4 lapsos de evidence-close
root-caused como transporte; patch de protocolo pendente de decisao.
[CONFIRMAR: feature PR #NN a main@<sha>; recaps PR #NN a main@<sha>;
patch de protocolo autorizado/aplicado?]
TEMA DESTA SESSAO: [patch de protocolo do executor (caminho B) | proximo
item da fila: open-in-software / hygiene batch (payload.json no
.gitignore atingiu rule-of-three) | ship command | rename @breu].
Carrega CLAUDE.md, MENTOR_BRIEF.md, ROADMAP.md e os recaps
docs/sessions/2026-07-14-mentor-036-keyless-start-execution.md e
docs/sessions/2026-07-14-executor-036-keyless-start.md.
Antes de propor proximo passo, confirma em uma frase quem sou e o modo.
```
