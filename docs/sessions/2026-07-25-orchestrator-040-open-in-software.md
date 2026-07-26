# Session recap — 2026-07-25 — 040-open-in-software (Orchestrator)

**Mode:** modelar tarefa — caminho A (pipeline: planner → brief-validator →
orchestrator gate → executor). First normal post-doctrine run under the
fused model.
**Consumes:** the 039 recaps and doctrine PR #96 at `main@88285a7` (merge
confirmed via P4 this session — discharging the 039 recap's [CONFIRMAR]).
**Pairs with:** the executor 040 recap in this same PR.

## One-line summary

The 032-deferred open-in-software capability (session 032, D3) was modeled
as a 7-decision D-set, delegated to the planner (brief `3ab6bbf`, validated
APPROVED 11/11 first round), gated with a no-drift translation check, and
executed in two feat commits (`5234aa3`, `659380e`) with a green 238→240
boundary and zero Pauses crossed without an explicit owner go — `saci start
--open` now opens the scaffolded editable via the platform opener on both
start routes.

## P4 slot evidence

Three sources, all agreeing on 040: `ls docs/tasks/` topped at 039 (gaps
004-006 and 034 preserved burns); `git log --oneline main` topped at
`88285a7` (PR #96 — also the 039 merge confirmation); `CLAUDE.md` E* and
prior briefs held no forward reserves.

## D-set (closed one decision at a time)

- **D1 — Slot/slug:** `040-open-in-software`.
- **D2 — UX:** `--open` opt-in on both start routes (Jira-born and
  `--local`); default byte-identical to today; no `--no-open`.
- **D3 — Target:** the copied editable with a template
  (`copiedFile ?? editablePath`); the `editaveis/` folder on `--blank`.
- **D4 — Mechanism:** new `packages/cli/src/open-path.ts` in `@saci/cli`;
  native opener spawn (`cmd /c start "" <path>` / `open` / `xdg-open`),
  detached + `unref()`; injectable platform and spawn for pure tests; OS
  glue, not a core port (R25); zero new runtime deps (R2).
- **D5 — Failure semantics:** open runs only post-scaffold; spawn-launch
  failure → stderr with path and cause, exit stays 0, no rollback;
  launch-failure-only detection declared as a limit.
- **D6 — Category:** M, Plan required: yes.
- **D7 — Branch:** `feat/open-in-software` from `main@88285a7`.

## Pipeline run and gate

- **planner:** brief authored and committed (`3ab6bbf`) on the branch it
  cut per its own contract. Two planner additions ratified as gain at the
  gate: constraint 5 (re-read GOTCHAS before wiring the spawn, anchored to
  the brief-033 Windows exit-path crash) and the manual-`npm test` note
  (pre-commit hook not wired in this clone).
- **brief-validator:** APPROVED 11/11, first round, no findings.
- **orchestrator gate:** translation check against the session D-set found
  no substantive drift; one cosmetic imprecision accepted (the brief's
  D-numbering disclosure calls D1 "the go decision"); size overage flagged
  (243 lines vs. the 80-150 M guidance) and ratified — see rule-of-three.
- **executor:** run detail lives in the executor 040 recap (same PR).

## Rulings ledger

- **Ruling 1 (Pause 1):** spawn options include `windowsHide: true` — full
  object `{ detached: true, stdio: "ignore", windowsHide: true }`.
  Transported as `docs/tasks/040-open-in-software/notes.md` under the write
  gate (read-back byte-match confirmed), left untracked during the run, and
  committed post-run as `d5d5a63`.
- Zero unratified deviations across the run.

## Rule-of-three ledger (updated)

- **Brief size over guidance: 3rd occurrence — TRIGGERED.** 038 (over M),
  039 (over L), 040 (243 lines over the 80-150 M guidance); same cause all
  three times (template scaffolding + pre-closed D-set). Per the ledger
  rule, the size guidance in `.claude/skills/brief-template/SKILL.md` gets
  a scaffolding allowance — queued below as its own task.
- **App subagent visibility:** unchanged (1st), mitigated by the
  announcement protocol.
- Other tracked items: no recurrence.

## Pending items (queue)

1. **This PR** (`feat/open-in-software`): planner brief + 2 feat commits +
   ruling notes commit + both 040 recaps; push + PR on explicit owner
   instruction; owner squash-merges. Merge SHA recorded by the NEXT session
   per the recap policy.
2. **brief-template SKILL scaffolding allowance** (rule-of-three triggered
   this session) — small docs/skill chore, own brief or S-task.
3. Missing-env error DX — still 2nd occurrence; out until rule-of-three.
4. Template naming convention + sanitization unification.
5. `gateways.ts` manifest-shape TODO (from 035 report).
6. Parked: multi-contributor naming package (trigger: second regular
   contributor); Jira-born manual overrides; `jira_updated_at` nullability;
   parked cluster unchanged.
7. Horizon: `ship` command, `@saci/*` → `@breu/*` rename, `saci config`.

## Next concrete action

Push + PR on explicit owner instruction; owner squash-merges. Next session
opens via `harness/workflows/setup-orchestrator.md`, confirms this PR's
merge via P4, and picks the next task (front-runner: the brief-template
scaffolding allowance, or a product-queue item).

## Paste-ready snippet for the next Orchestrator session

Use `harness/workflows/setup-orchestrator.md` with:

```
Modo desta sessao: [modelar tarefa (pipeline) | ...]
Ultima entrega: brief 040 open-in-software executado na branch
feat/open-in-software (planner 3ab6bbf, executor 5234aa3 + 659380e,
ruling d5d5a63): saci start --open abre o editavel copiado (ou
editaveis/ no --blank) via opener nativo detached, windowsHide por
ruling. [CONFIRMAR: PR #NN a main@<sha> via P4/git log.]
TEMA DESTA SESSAO: <tema>.
```
