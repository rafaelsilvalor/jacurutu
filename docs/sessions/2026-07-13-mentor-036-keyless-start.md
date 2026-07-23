# Session recap — 2026-07-13 — 036-keyless-start (mentor)

> **Provenance note.** The original artifact was authored at session close
> but never reached the repository (delivered to the chat output area,
> lost before commit). Reconstructed on 2026-07-15 from the session's
> chat history; sections marked verbatim were recovered word-for-word.
> Both 2026-07-14 recaps reference this file by name.

**Mode:** modelar tarefa → revisar plano — ground-truth verification (Jira
item 2) → D-set ratification for the keyless `start` command → planner
delegation → validator APPROVED → executor STOP on unfilled gate
placeholders (correct behavior) → **mentor gate CLOSED** (four rulings
below).
**Consumes:** session-035 D-set
(`docs/sessions/2026-07-10-mentor-035-keyless-schemaversion-2.md`, D1/D2)
and the shipped brief 035 (`TaskManifest` schemaVersion 2).
**Consumed by:** the 2026-07-14 execution session (mentor + executor
recaps, PR #89).

## One-line summary

Closed the last open ground-truth item (Jira project-key charset vs.
RAF/ANA, verified live via read-only Atlassian MCP), ratified the D-set for
the keyless `start` command, delegated to the planner (brief 036 on disk,
validator APPROVED 11/11), and closed the mentor gate: P1/P2/template
confirmed, D11 reverted — a planner amendment + revalidation is required
before the executor runs.

## State confirmations

- Feature PR **#86** squash-merged at `main@ba908a0` (brief 035).
- Recaps PR **#87** squash-merged at `main@4326adb` (both 035 recaps) —
  evidence pasted by owner (`git log --oneline -2`).

## Ground-truth results

**Item 2 (session-035 checklist) — CLOSED.** Read-only Atlassian MCP check
against the live instance (cloudId `9795b90e-...`, 133 visible projects):

1. No project key `RAF` or `ANA` exists; no existing key starts with
   either string.
2. Observed key charset matches Jira's default `^[A-Z][A-Z0-9]*$`,
   lengths 2–9 in the sample (digits appear: `CPOLE2`, `FUK2`).
3. **Consequence recorded as doctrine:** a local key such as `RAF-1` is
   format-indistinguishable from a real Jira issue key. Task origin is
   therefore **always declared** (the `--local` flag) or derived from
   manifest fields (`jiraKey`/`localKey`), **never inferred from key
   format** — in `start` and in every future flow.

## Invocation contract (ratified in chat before delegation)

```
saci start --local --vertical <SIGLA> --title "<descricao>" [--due <ISO-date>] [--template <name>]
```

- `--local` with no positional key — `saci start MCA-123 --local` fails
  loud. A positional slot meaning "Jira key" in one mode and something
  else in another is a UX trap; key+local has no semantics today
  (retroactive linking belongs to a future `link`, not to `start`).
- `--title` required in local mode — it is the slug source (no Jira
  summary to derive from); goes through the existing leaf-slug
  sanitization (035-D4), nothing new.
- `--vertical` required in local mode, free-form value (e.g. `EC`),
  presence-only validation — consistent with ground-truth item 3 of
  session 035 (no canonical vertical list exists in code).
- `--due` optional → feeds `entrega_iso` in the `derivePath` month chain;
  absent, the month falls to the start timestamp (the chain brief 035
  extended).
- `--template` unchanged from the Jira-born mode — orthogonal to task
  origin.

**Identity source (pre-`saci config`):** prefix and counter co-located in
one local production-state file, manually seeded in v0; the future
`saci config` becomes merely the writer of that file (no format or
location change).

**Parked, not decided:** owner-raised idea of manual overrides in
Jira-born mode (`saci start MCA-101 --title "..."`). Recorded as explicit
out-of-scope in brief 036 so nobody implements it by accident. In its
favor, for the record: it is a natural consequence of the ratified design
(`--title` = "slug source" in any mode; Jira-born it would be a summary
override).

## Planner delegation and findings

Brief 036 authored by the planner (slot supplied explicitly with the
P4 three-source check), validator **APPROVED 11/11**. Brief saved to
`docs/tasks/036-keyless-start/brief.md`, **on disk, NOT committed** —
Edit 1 remains "verify brief on disk and commit as commit #1" (caminho B).
No executor ran this session; an executor invocation correctly **STOPPED**
on the unfilled gate placeholders.

Two planner findings flagged for the gate:

1. Proposed seam: `packages/cli/src/identity.ts` (composition root owns
   I/O; core untouched per R25), reading JSON `{ "prefix", "nextSeq" }`.
2. `--template <name>` does not exist verbatim today — the Jira-born
   mechanism is `--templates-root` + `--blank` + per-vertical
   auto-resolution. Brief interprets the ratified notation as "reuse that
   mechanism unchanged", flagged in Context for gate confirmation.

## Mentor gate — CLOSED (four rulings)

1. **P1 — identity file location: CONFIRMED.**
   `path.join(os.homedir(), ".saci", "identity.json")`, overridable by the
   `SACI_IDENTITY_FILE` env var, resolved in `cli.ts` — follows the
   env-credentials precedent (D-a3); R1-safe. Flag-based alternative
   rejected (machine configuration, not per-invocation input).
2. **P2 — counter increment ordering: CONFIRMED.**
   Persist `nextSeq + 1` after all pre-mutation validations (identity
   read, collision check, template resolution) and before the first
   workspace write. A mid-scaffold crash burns a number (gap accepted by
   035-D2) instead of reusing one; the collision backstop stays reserved
   for genuine anomalies.
3. **`--template` interpretation: CONFIRMED** — reuse the existing
   `--templates-root` + `--blank` + per-vertical resolution mechanism
   unchanged; no new flag surface.
4. **D11 — REVERTED.** As planned, `--due` passed without format
   validation (invalid values absorbed by the month chain). Owner ruling:
   `--due` is **format-validated fail-loud at the CLI boundary** (usage
   error naming the flag and the ISO format). Core absorption untouched;
   R25 unaffected. Consequence: a **planner amendment + validator
   revalidation is required before the executor runs** (single amended
   brief commit, patch confined to D11 + affected tests).

## Pending items (queue at session close)

1. Planner amendment for D11 + validator re-audit → executor run of
   brief 036 (Edit 1 = verify brief on disk, commit #1).
2. This recap to disk via docs branch/PR (owner sequencing).
3. Open-in-software (D3 of session 032) — small follow-up brief.
4. Template naming convention + sanitization unification.
5. Hygiene chores: `payload.json` in `.gitignore` (2nd occurrence),
   missing-env error DX — neither at rule-of-three as of this session.
6. `gateways.ts` manifest-shape TODO (from 035 report).
7. Parked: Jira-born manual overrides (this session); parked cluster
   unchanged.

## Next concrete action

Apply the D11 amendment, revalidate, then supervised execution of
brief 036 under the full Pause protocol.

## Paste-ready snippet for next session (as issued at session close)

```
Ola. Continuando o projeto Saci. Modo: [continuar (code review da execucao
036) | mentoria | ...].
Ultima entrega: sessao 2026-07-13 — ground-truth Jira fechado (RAF/ANA
livres; origem sempre declarada, nunca inferida do formato); D-set keyless
start ratificado; brief 036 APPROVED; mentor gate FECHADO: P1/P2/template
confirmados, D11 REVERTIDO (--due valida formato fail-loud na boundary do
CLI). [CONFIRMAR: amendment D11 aplicado e revalidado? Executor rodou?
Commits/SHAs? PR #NN? Recap 2026-07-13 mergeado? PR #NN.]
TEMA DESTA SESSAO: [code review da execucao do 036 | proximo item da fila].
Carrega CLAUDE.md, MENTOR_BRIEF.md,
docs/tasks/036-keyless-start/brief.md e o recap
docs/sessions/2026-07-13-mentor-036-keyless-start.md.
Antes de propor proximo passo, confirma em uma frase quem sou e o modo.
```
