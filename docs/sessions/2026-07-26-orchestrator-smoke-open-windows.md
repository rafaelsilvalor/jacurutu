# Session recap — 2026-07-26 — smoke: `saci start --open` on Windows (Orchestrator)

**Mode:** retomada de follow-up — Category S manual verification (no
brief, no pipeline, no task slot consumed; slot 042 remains free).
**Consumes:** the 041 recaps and PR #98 at `main@41b63d4` (merge confirmed
via P4 this session; the 041 next-session snippet memory was consumed and
deleted per its own instruction).

## One-line summary

The 040 follow-up manual smoke of `saci start --open` on Windows passed on
both routes — the copied editable opened in the associated software and
the `--blank` route opened the `editaveis/` folder in Explorer, both
without a console flash (the windowsHide ruling validated on real
hardware) — closing the smoke item queued since the 040 recap.

## P4 slot evidence

Three sources, all agreeing 042 is next: `ls docs/tasks/` topped at 041
(gaps 004-006 and 034 preserved burns); `git log --oneline origin/main`
topped at `41b63d4` (PR #98 — the 041 merge confirmation); `CLAUDE.md` E*
and prior briefs held no forward reserves. This session consumed no slot:
Category S, no brief authored.

## Smoke protocol and evidence

- **Green anchor:** `npm run build` (`tsc -b`) exit 0; `npm test` 240/240
  pass on the session worktree at `main@41b63d4` — the same boundary as
  the 040 close.
- **Identity seeding (new machine state):** the local route fail-louded on
  the missing `C:\Users\rafae\.saci\identity.json` (exit 1, message with a
  copy-paste seed instruction — the 036 keyless design working as
  specified; the 032 smoke was Jira-born and never needed it). Seeded
  `{ "prefix": "RAF", "nextSeq": 1 }` per the CLI's own message; the
  counter ended the session at `nextSeq: 3`.
- **File route:** `saci start --local --vertical ECJ --title "smoke open
  042" --workspace-root D:\Projects\cabu\smoke\start-042 --open` — exit 0,
  key `RAF-1` minted, scaffold at
  `AVULSAS/ECJ/2026-07/RAF-1_smoke-open-042`, template
  `ecj_3tri-2026-v1.psd` (96 MB) copied and renamed to the leaf stem,
  `--templates-root` omitted (the P1 sibling default resolved to the
  fixture), stderr clean. **Owner observation: opened in the associated
  software, no console flash.**
- **Folder route:** same shape with `--blank`, key `RAF-2` — exit 0, no
  template applied. **Owner observation: `editaveis/` opened in Explorer,
  no console flash.**
- **Verdict: PASS on both routes.** The D5 failure path (stderr + exit 0)
  was not exercised — no launch failure occurred to observe.

## Rulings ledger

- Zero mid-run rulings. One deviation-adjacent note: seeding
  `identity.json` created persistent machine state outside the repo,
  performed as the smoke's own precondition per the CLI's instruction and
  reported live.

## Rule-of-three ledger (updated)

- **`saci start --open` Windows smoke: RESOLVED** (this session).
- **Missing-env DX: unchanged (2nd).** Note: the identity-file DX observed
  this session (fail-loud + copy-paste seed instruction) is the shape the
  missing-env item wants; adjacent evidence, not an occurrence.
- **Quoted-text-heavy briefs over effective ceiling:** unchanged (1st).
- **App subagent visibility:** unchanged (1st).

## Pending items (queue)

1. **This PR** (`docs/smoke-open-windows`): this recap only; push + PR on
   explicit owner instruction; owner squash-merges. Merge SHA recorded by
   the NEXT session per the recap policy.
2. Missing-env error DX — still 2nd occurrence.
3. Template naming convention + sanitization unification.
4. `gateways.ts` manifest-shape TODO (from 035 report).
5. Parked: multi-contributor naming package; Jira-born manual overrides;
   `jira_updated_at` nullability; parked cluster unchanged.
6. Horizon: `ship` command, `@saci/*` → `@breu/*` rename, `saci config`.

## Next concrete action

Push + PR on explicit owner instruction; owner squash-merges. Next session
opens via `harness/workflows/setup-orchestrator.md`, confirms this PR's
merge via P4, and picks the next task (front-runners: template naming +
sanitization, or a horizon item). Slot 042 is free.

## Paste-ready snippet for the next Orchestrator session

Use `harness/workflows/setup-orchestrator.md` with:

```
Modo desta sessao: [modelar tarefa (pipeline) | ...]
Ultima entrega: smoke manual de saci start --open no Windows — PASS nas
duas rotas (arquivo no software associado; pasta no Explorer; sem console
flash; windowsHide validado). Sem slot consumido; 042 livre. PR
[preencher #] contra main. Verifica o merge via P4 / git log antes de
consumir.
TEMA DESTA SESSAO: [template naming + sanitizacao | missing-env DX |
gateways.ts TODO | item do horizonte].
```
