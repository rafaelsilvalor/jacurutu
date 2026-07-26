# Session recap — 2026-07-26 — 042-template-naming-sanitization (Orchestrator)

**Mode:** task modeling via pipeline (fused model, AGENT_PLAYBOOK ch. 6) —
full path: D-set closure → planner → brief-validator → orchestrator gate →
executor, all four Pauses honored under STOP-and-return transport.
**Consumes:** the smoke-open-windows recap and PR #99 at `main@345a366`
(merge confirmed via P4 this session).
**Pairs with:** the executor 042 recap in this same PR.

## One-line summary

Task 042 shipped on `feat/template-naming-sanitization`: `saci start` now
names the copied editable `vertical_key_descricao[_variacao]` + source
extension (owner format from session 033) via a new pure core builder, with
`--variation` on both routes and one shared sanitizer exported from core —
three commits, 255/255 green, no push.

## P4 slot evidence

Three sources agreeing 042 was next: `ls docs/tasks/` topped at 041 (gaps
004-006 and 034 preserved burns); `git log --oneline origin/main` topped at
`345a366` (PR #99 — the smoke recap merge, confirmed); no forward reserves
in `CLAUDE.md` E* or prior briefs. Slot 042 is now consumed; next free
slot is 043.

## D-set (closed in-session, encoded in the brief)

- D1 — scope object: only the copied editable in `editaveis/`; templates
  root and leaf folder untouched.
- D2 — format: lowercase; `_` between fields, `-` within; vertical + key
  lowercased; descricao = the shared slug; no date segment; extension
  appended by the composition root.
- D3 — variacao from a new optional `--variation <text>` flag on both
  routes; absent or empty-after-sanitization → omitted.
- D4 — no manifest change (schemaVersion stays 2); manifest `variation`
  field parked.
- D5 — derivePath leaf unchanged (`<KEY>_<slug>`, uppercase key).
- D6 — unification: `sanitizeSlug` promoted to a core export in new
  `file-name.ts` (placement planner-closed), consumed by the leaf and the
  new `buildEditableStem`; `slugNomeCurto` untouched.
- D7 — mass-rename window moot; recorded, no rename edits.

## Pipeline record

- planner: brief authored on owner-approved branch from verified base
  `345a366`, commit `f4b9768`, Category M, Plan required yes.
- brief-validator: APPROVED, 11/11 PASS, zero findings.
- Orchestrator gate: passed after drift review; four planner refinements
  ratified (file-name.ts placement; cli.ts/cli.test.ts/index.test.ts added
  to allowed scope; --blank+--variation tolerance; empty-descricao
  fallback).
- executor: Pause 1 plan (P-a…P-f) approved unmodified; Pause 2 approved
  with one comment correction (032 → 030 D4); two Pause 3s approved;
  commits `33ab873` (core) and `0e20c7f` (cli); both evidence-closes
  independently verified by the Orchestrator against `git log`.

## Rulings ledger

- **Ruling 1** (`docs/tasks/042-template-naming-sanitization/notes.md`):
  mid-run executor STOP — the session worktree's empty `node_modules`
  resolved `@saci/*` up-tree to the main checkout's pre-042 core dist.
  Approved `npm install` at the worktree root with a lockfile guard
  (PASS — no tracked-file changes); commit #2 evidence ruled valid for
  Edit 2; the full-suite re-run closed the Edit-2 cli-resolution gap;
  GOTCHAS.md entry queued as a follow-up docs brief (out of 042 scope).
  The ruling-as-file transport (notes.md, write-gated) was exercised live.
- **In-run ratification:** the `SLUG_MAX_LEN` re-export in
  `derive-path.ts` — the only resolution satisfying constraints 1 and 5
  together (executor flagged instead of silently expanding scope).

## Rule-of-three ledger (updated)

- **Template naming + sanitization unification: RESOLVED** (this session).
- **Worktree stale-resolution gotcha: 1st occurrence**, but already queued
  as its own follow-up docs brief per Ruling 1 (severity, not recurrence,
  drove the promotion).
- Missing-env DX: unchanged (2nd).
- Quoted-text-heavy briefs over effective ceiling: unchanged (1st).
- App subagent visibility: unchanged (1st).

## Pending items (queue)

1. **This PR** (`feat/template-naming-sanitization`): 3 task commits +
   session-close commits (notes.md, both recaps); push + PR on explicit
   owner instruction; owner squash-merges. Merge SHA recorded by the NEXT
   session per the recap policy.
2. **NEW — GOTCHAS.md follow-up docs brief:** "worktree sessions must
   `npm install` locally or cross-package imports silently resolve to the
   main checkout" (from Ruling 1).
3. Missing-env error DX — still 2nd occurrence.
4. `gateways.ts` manifest-shape TODO (from 035 report).
5. Parked: manifest `variation` field (042 D4); multi-contributor naming
   package; Jira-born manual overrides; `jira_updated_at` nullability;
   parked cluster unchanged.
6. Horizon: `ship` command, `@saci/*` → `@breu/*` rename, `saci config`.

## Next concrete action

Owner Pause 3 for the two session-close commits (notes.md; recaps), then
push + PR on explicit owner instruction; owner squash-merges. Next session
opens via `harness/workflows/setup-orchestrator.md`, confirms this PR's
merge via P4, and picks the next task (front-runner: the GOTCHAS.md
worktree entry as a small docs brief; then missing-env DX or a horizon
item). Slot 043 is next.

## Paste-ready snippet for the next Orchestrator session

Use `harness/workflows/setup-orchestrator.md` with:

```
Modo desta sessao: [modelar tarefa (pipeline) | ...]
Ultima entrega: task 042 — template naming + sanitizacao unificada.
saci start nomeia o editavel como vertical_key_descricao[_variacao] +
extensao, flag --variation nas duas rotas, sanitizador compartilhado
exportado do core (file-name.ts). 3 commits + notes.md (Ruling 1: gotcha
de worktree com node_modules vazio resolvendo @saci/* no checkout
principal — npm install local; entrada no GOTCHAS.md ficou como
follow-up). PR [preencher #] contra main. Verifica o merge via P4 /
git log antes de consumir. Slot 043 e o proximo.
TEMA DESTA SESSAO: [gotcha GOTCHAS.md worktree (docs brief pequeno) |
missing-env DX | gateways.ts TODO | item do horizonte].
```
