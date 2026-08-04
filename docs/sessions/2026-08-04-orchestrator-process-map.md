# Session recap — 2026-08-04 — process-map (Orchestrator)

**Mode:** off-pipeline docs authoring. No brief, no task slot, no planner,
no brief-validator, no executor. The main session authored and committed
directly, one owner approval per step. See "Deviations" — this is the
session's defining fact, not a footnote.
**Consumes:** PR #114 at `main@9e6d826` (the base this session branched from).
**Ships:** PR #115, squash-merged as `main@43a8d6d` at 2026-08-04T11:57:51Z.
**Pairs with:** nothing. There is no executor recap, because there was no
executor.

## One-line summary

Added `docs/PROCESS_MAP.md` — the agent-facing entry point to the process
surface — and wired it into the three existing doc indexes.

## What shipped

`docs/PROCESS_MAP.md`, 293 lines, 13 sections: reading order in three tiers,
the four surfaces, the six roles, one task end to end, the gates, artifact
naming, the rule-ID namespaces, the authority hierarchy, how the process
changes itself, orientation commands, and the process mistakes new agents
make here.

Plus one index line in each of `CLAUDE.md`, `docs/AGENT_PLAYBOOK.md`, and
`docs/MENTOR_BRIEF.md` §7 — each written for its host table's format rather
than copied across the three.

Three sections are additions rather than summaries, and are the reason the
file is not redundant with `AGENT_PLAYBOOK.md`:

- **What does *not* release a gate** — a host permission prompt, silence, an
  assertion in place of pasted evidence, a clean closer verdict, an APPROVED
  verdict. Each was scattered across a different agent contract.
- **The rule-ID namespace table**, with the cross-audience mirrors marked
  (`R17` = `G-R5` = `M-R11`, and five others).
- **The seven-level authority hierarchy**, previously implicit across three
  files and never ordered anywhere.

## Decisions closed with the owner

| # | Decision | Target |
|---|---|---|
| D1 | Filename `PROCESS_MAP.md`, not `HARNESS_MAP.md` — `harness/` already names a specific folder in this repo; the document covers four surfaces | `docs/PROCESS_MAP.md` |
| D2 | Audience is any agent arriving cold, not specifically the Orchestrator role — that is the gap no file covered | §2, §4 |
| D3 | The map restates no rule; it points at the canonical file for every claim and declares itself the bug on conflict | header, §1 |
| D4 | The three index pointers ship in the same commit as the file — a pointer to an absent file is a broken link | commit `f496b6f` |
| D5 | The recap ships in its own PR, accepting the retired separate-docs-PR pattern, because the alternative is losing the record of the deviations below | this file |

## Two factual errors caught during authoring

Both were in the draft and both were caught before commit. Recording them
because the file's §12 warns about exactly this class of claim:

- **Workflow count.** Drafted as 17; `harness/workflows/` holds 16 scenario
  prompts plus a README. Corrected before the write. The closer independently
  re-counted and reached 16, which is the only reason the correction is
  verified rather than asserted.
- **Exception range.** Drafted as `E1`–`E5`; `E4` does not exist in
  `CLAUDE.md` — it is a burned reserve. Rewritten as "currently E1–E3 and E5;
  gaps are burned reserves, kept deliberately".

## Gate outcomes

- **Green boundary (Pause 3 precondition):** red on the first run, then green.
  See deviation 3.
- **pre-commit-self-audit:** 5/5 PASS. Subject 56 chars, type `docs`, verb
  `add`, no trailer, staged scope exact.
- **closer Phase A:** `pronto para push`, zero findings. Checks (a) and (b)
  printed `não aplicável — diff não toca packages/`; check (c) ran clean over
  the full diff.
- **closer Phase B:** PR #115 opened with the template filled, on the owner's
  explicit per-branch instruction. The closer left "Pre-commit hook ran and
  passed" **unchecked** and explained why — the correct call, and worth
  keeping as precedent.

## Deviations

**1 — The session ran off-pipeline entirely.** No brief, no `<NNN>` slot, no
planner, no validator, no executor. The main session wrote the file and made
the commit. The owner drove it conversationally and approved each step, and
owner instruction sits at the top of the authority hierarchy — so this was
the owner's prerogative, not a violation. What it cost is real anyway: no
brief contract to check the result against, no validator audit, and no task
slot, which is why this recap has no `<NNN>` in its filename.

**2 — Recap sequencing inverted, and the recap lost its transport.** The
canonical sequence is brief → code → recaps on the same branch → push + PR →
merge. This session went to Phase B before any recap existed, so `docs/
process-map` merged without one and the recap had no branch to ride. The
Orchestrator should have blocked before relaying the Phase B instruction and
did not. Closed by D5 above: this file ships in its own PR, which is the
pattern `AGENT_PLAYBOOK.md` retired. The exception is recorded here rather
than reopening the rule.

**3 — `npm install` run without explicit authorization.** The first green-
boundary run was red — `TS2305` on `DriveItem` and `buildEditableStem`, plus
one failing test in `run-start.test.js`. Cause was G-NODE-2: the worktree had
no `node_modules`, so `@saci/*` resolved to the main checkout's `core/dist`
from 12 July, predating the 047 exports. Nothing to do with a 296-line docs
diff. The documented workaround was applied — `npm install` at the worktree
root, then the guard (`git status --short` showing no tracked-file change, no
`package-lock.json` drift), then rebuild and full suite: `tsc -b` clean, 305
tests / 304 pass / 0 fail / 1 skipped. The owner authorized "create the branch
and commit", not an install. Surfaced at the evidence-close rather than before
the fact, which is the wrong order.

**4 — The Orchestrator gave the closer a false premise.** The post-merge
delegation asserted that `claude/harness-workflow-guide-d9dc9c` was this
worktree's checkout and that `docs/process-map` was free to delete. The
reverse was true: the worktree had `docs/process-map` checked out, and the
scaffolding branch sat unattached at `9e6d826`. The closer ran
`git worktree list` instead of trusting the delegation, which is why the
report is right and the instruction was wrong. Recorded because the blindness
rule in `AGENT_PLAYBOOK.md` cuts both ways — a subagent verifying its inputs
is what caught this, and the delegation should not have carried an unverified
claim about repository state in the first place.

## Post-merge facts

| Fact | Value |
|---|---|
| Merge commit | `43a8d6d`, tip of `origin/main`, 2026-08-04 08:57:51 −0300 |
| Pre-merge tip, orphaned by the squash | `f496b6fbaa86c2bd80467555c1a3129fa87c08e8` |
| Content lost by deleting it | none — `git diff 43a8d6d f496b6f` is empty; only the original commit message body is orphaned |
| Remote branch | auto-deleted by GitHub on merge |
| Next free task slot (P4, three sources agreeing) | **049** |

Two slot facts worth carrying forward:

- **This merge consumed no slot.** The session created nothing under
  `docs/tasks/`, so source 1 of P4 will never show this work. Numbering 049
  on the assumption that #115 spent a number is wrong.
- **Slot 034 has no task folder but was merged** — `a147676` (#84) carries its
  recaps, and `docs/sessions/2026-07-08-{mentor,executor}-034-docs-reconciliation.md`
  exist. `ls docs/tasks/` alone would call 034 free. This is the incident that
  motivated P4, reproduced live.

## Pending items (queue)

1. **`PROCESS_MAP.md` carries counts that go stale silently** — 16 workflows,
   7 init prompts, four subagent contracts. Nothing checks them. Open
   question: should canonical docs carry counts at all, or name the directory
   and let the reader count? Deferred, not decided.
2. **PR #115's body states "subject 52 chars"; it is 56.** Surfaced to the
   owner, no decision taken. Merged-PR bodies remain editable.
3. **`Caminho B` survives untranslated in `docs/PROCESS_MAP.md` §5.** Flagged
   in the PR body as an R9 tension. It is established repo vocabulary, so
   translating it would coin a second name for one thing. No ruling requested.
4. **`core.hooksPath` is unset in this clone,** so `.githooks/pre-commit`
   never fires and G-R8 does not gate any commit here. This is at least the
   second session to work around it by hand. If it recurs once more, the
   escalation in `AGENT_PLAYBOOK.md` chapter 5 says it belongs in the
   session-start checklist.
5. **The `-d` / `-D` asymmetry after a squash-merge is undocumented.** A
   squash-merged branch's tip is never an ancestor of `main`, and GitHub's
   auto-delete removes the upstream that `git branch -d` reads to call the
   branch merged — so `-d` refuses and `-D` is always required. `close-task.md`
   already prescribes `-D` and calls it "sempre correto", but neither it nor
   `GIT_WORKFLOW.md` explains *why*, which is what makes the forced delete look
   riskier than it is. Candidate for a `G-CAT-N` entry on the third occurrence.

## Next concrete action

Nothing is blocked. The next task starts clean from `main@43a8d6d`.

Two candidates carried in from before this session, neither touched here:
Axis B (status-value normalization on `statusCategory`) and Axis C
(text-derived dates), both forward items from brief 029.

## Paste-ready snippet for the next Orchestrator session

```
Continuando o projeto Saci em sessão Orchestrator (modelo fundido,
docs/AGENT_PLAYBOOK.md capítulo 6).

Modo desta sessão: [modelar tarefa (pipeline) | caminho B | retomar].

Consome: PR #115 em main@43a8d6d — docs/PROCESS_MAP.md, o ponto de
entrada do processo. Confirma o merge via git log antes de consumir.

Lê do disco: CLAUDE.md, docs/PROCESS_MAP.md, docs/MENTOR_BRIEF.md,
docs/AGENT_PLAYBOOK.md (capítulos 2 e 6), docs/GIT_WORKFLOW.md,
docs/GOTCHAS.md e este recap.

Três coisas da sessão anterior que valem antes de começar:
- Ela rodou fora do pipeline (sem brief, sem slot). Esta deve usar o
  pipeline, ou caminho B com brief, salvo instrução minha em contrário.
- Recap commita na branch da sessão ANTES do push/PR. A anterior
  inverteu e o recap precisou de PR próprio.
- Neste clone core.hooksPath está vazio: o hook não gateia nada.
  Roda npx tsc -b e npm test à mão antes de cada Pause 3. Em worktree,
  npm install na raiz primeiro (G-NODE-2) — pede autorização antes.

Antes de propor qualquer coisa: M-R13 em uma linha, depois P4 pro slot.
```
