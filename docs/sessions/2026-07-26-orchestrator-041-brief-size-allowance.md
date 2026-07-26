# Session recap — 2026-07-26 — 041-brief-size-allowance (orchestrator)

**Mode:** modelar tarefa — caminho B (pipeline-modifying skill edit;
planner skipped, brief-validator ran per 039 D6).
**Pairs with:** the executor 041 recap in this same PR.

## One-line summary

The rule-of-three item queued by the 040 recap (brief size over guidance,
3rd occurrence) was closed by rewriting the `## Size guidance` section of
`.claude/skills/brief-template/SKILL.md` to measure task substance (M
80-150, L 200-400) with an explicit ~100-line scaffolding allowance
(~250/~500 effective totals) — modeled as brief 041, validated APPROVED
11/11 first round, and executed in two docs commits with zero Pauses
crossed without an explicit owner go.

## P4 slot evidence

Three sources, all agreeing on 041: `ls docs/tasks/` topped at 040 (gaps
004-006 and 034 preserved burns); `git log --oneline main` topped at
`e6a4b35` (PR #97 — also the 040 merge confirmation consumed by the
opening snippet); `CLAUDE.md` E* and prior briefs held no forward
reserves. The 040 next-session snippet memory was consumed and deleted
per its own instruction.

## D-set (owner-ratified)

- **Owner choices at modeling:** allowance shape = substance ranges plus
  a ~100-line allowance (over raising raw ranges or per-audit discounts);
  path = caminho B with a Category M brief (over planner pipeline or an
  S-task without historical record).
- **D1 — Substance semantics:** ranges keep their numbers but measure
  substance; ~100-line scaffolding allowance; effective totals ~250 (M) /
  ~500 (L); XL threshold reads substance > 400; S threshold reads
  substance < 80.
- **D2 — Scaffolding is a named list:** Edit 1 verify block,
  Automated/Structural/Git/Process checks, Pause points, Plan required
  justification, Reference documents, Expected output. Behavior checks
  and the Commit sequence count as substance.
- **D3 — History placement:** the 038/039/040 trigger data lives in the
  brief's Context; the skill states the rule only.
- **D4 — Single-section replacement:** only `## Size guidance` changes;
  the file is byte-identical above it.
- **Slot/branch:** `041-brief-size-allowance`,
  `docs/brief-size-allowance` from `main@e6a4b35`; Category M,
  Plan required: no; 2 commits.

## Pipeline run and gate

- **Authoring (caminho B):** Orchestrator authored the brief under the
  write gate (full text shown and approved pre-write; read-back
  confirmed: 266 lines, first line matches). Left untracked on the
  `claude/*` session branch; the executor created the task branch and
  committed it as commit #1.
- **brief-validator:** APPROVED 11/11, first round, zero findings.
- **Orchestrator gate:** no translation drift possible (brief authored
  directly from the ratified D-set; owner approved the full text). One
  ratified overage: the brief itself measures 266 total / ~166 substance
  against its own new M guidance — cause is Edit 2's exact-text anchor +
  replacement blocks (~40 lines), accepted as the cost of
  `Plan required: no`.
- **executor:** run detail lives in the executor 041 recap (same PR).

## Rulings ledger

- Zero mid-run rulings; zero unratified deviations.
- One accepted note at Pause 2: git's "CRLF will be replaced by LF"
  normalization on the SKILL.md working copy — content unaffected.

## Rule-of-three ledger (updated)

- **Brief size over guidance: RESOLVED.** The 038/039/040 trigger closed
  by this task; the allowance is live in the skill.
- **New tracked observation (1st):** a brief whose Edits quote exact-text
  anchors/replacements can exceed the new effective ceiling (041: 266 vs
  ~250) — watch whether quoted-text-heavy briefs recur.
- **App subagent visibility:** unchanged (1st), mitigated by the
  announcement protocol.
- **Missing-env DX:** unchanged (2nd) — out until rule-of-three.

## Pending items (queue)

1. **This PR** (`docs/brief-size-allowance`): brief + skill edit + both
   041 recaps; push + PR authorized this session; owner squash-merges.
   Merge SHA recorded by the NEXT session per the recap policy.
2. Manual smoke of `saci start --open` on Windows (040 follow-up).
3. Missing-env error DX — still 2nd occurrence.
4. Template naming convention + sanitization unification.
5. `gateways.ts` manifest-shape TODO (from 035 report).
6. Parked: multi-contributor naming package; Jira-born manual overrides;
   `jira_updated_at` nullability; parked cluster unchanged.
7. Horizon: `ship` command, `@saci/*` → `@breu/*` rename, `saci config`.

## Next concrete action

Executor pushes the branch and opens the PR (authorized this session);
owner squash-merges. Next session opens via
`harness/workflows/setup-orchestrator.md`, confirms this PR's merge via
P4, and picks the next task (front-runners: the `--open` manual smoke on
Windows, or a product-queue item).

## Paste-ready snippet for the next Orchestrator session

Use `harness/workflows/setup-orchestrator.md` with:

```
Modo desta sessao: [modelar tarefa (pipeline) | ...]
Ultima entrega: brief 041 brief-size-allowance — Size guidance do
brief-template agora mede substancia (M 80-150, L 200-400) com
scaffolding allowance de ~100 linhas (~250/~500 totais). PR
[preencher #] contra main. Verifica o merge via P4 / git log antes
de consumir.
TEMA DESTA SESSAO: [smoke manual --open no Windows | missing-env DX
| template naming | item da fila de produto].
```
