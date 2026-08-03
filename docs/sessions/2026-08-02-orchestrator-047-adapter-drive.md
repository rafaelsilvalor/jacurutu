# Session recap — 2026-08-02 — 047-adapter-drive (Orchestrator)

**Mode:** model a task (pipeline), then drive its execution across two
executor invocations.
**Consumes:** PR #107 at `main@d8426ce` (merge confirmed by P4 at session
open). Mid-session, `origin/main` was found to have advanced to `62e9afc`
— PRs #108 and #109, brief 048 — which changed the pipeline this session
was running. See "Doctrine absorbed mid-session".
**Pairs with:** the executor 047 recap in this same PR.

## One-line summary

`@saci/adapter-drive` exists and is proven: the `DriveGateway` port was
re-declared as five primitives and implemented over `googleapis` +
`google-auth-library` with user OAuth, all five confirmed live 6/6 against
real Drive — 12 commits on `feat/adapter-drive` plus an `origin/main`
merge, nothing pushed, and the first task in the project to face the new
`closer` role.

## P4 slot evidence

Three sources at session open: `ls docs/tasks/` — highest slot
`046-spike-adapter-drive`; `git log --oneline main` — HEAD `d8426ce`
(#107); `grep -nE '^\*\*E[0-9]+' CLAUDE.md` — E1/E2/E3/E5, none reserving
a forward slot. Slot **047** assigned explicitly to the planner.

**Slot 048 was consumed mid-session** by a parallel session (brief 048,
the closer agent). The `ship` brief is therefore **049**, not 048.

## Pipeline record (orchestrator scope)

planner → brief `e9aec85` (Category L, 733 lines, `Plan required: yes`) →
brief-validator **APPROVED, 11/11 PASS** → orchestrator gate → executor
invocation 1 (Edits 2-5) → executor invocation 2 (Edits 6-10 + evidence
round) → executor recap.

**Gate outcome: approved, with three items surfaced to the owner.** Edit 1
was already satisfied by the planner's own commit (the brief assumed the
caminho B path where the owner pre-saves the brief); the run was split in
two invocations because nine Pause 3s under STOP-and-return transport plus
an owner-run smoke is a long single session; and the brief's declared size
deviation (~600 substance lines against the Category-L guide) was accepted
on its stated justification — the live smoke cannot close until the whole
adapter exists.

## Rulings ledger

Decisions closed with the owner, in order:

1. **Port surface: five primitives** (`resolveFolder`, `findChild` →
   `DriveItem | null`, `createFolder`, `uploadFile`, `readFileContent`),
   retiring `uploadFolder`, `readManifest` and the `TODO(2026-06-06)`.
   Composition — folder-tree walking, verify-never-create, manifest
   parsing — belongs to the ship layer, not to a port method.
2. **Evidence model: unit tests + owner-side live smoke**, the 046 D2
   shape. Everything decision-bearing is unit tested behind the injected
   `DriveFilesApi` seam; only the library wrapper and the OAuth flow are
   left to the smoke.
3. **`STATE.md` skipped.** G-R10 targets multi-*session* tasks; this split
   was two invocations inside one live session, and the brief's
   constraint-1 path list is the more specific instruction — creating it
   would have failed the task's own structural check.
4. **Two structural checks ruled unsatisfiable as written**, not
   implementation defects: the secret sweep matches its own regex inside
   `brief.md`, and the library grep matches the `googleapis.com` scope
   URLs that a D-closed decision put in `constants.ts`. Recorded as
   documented false positives.
5. **The `google.auth.OAuth2` fix accepted as implementation latitude** —
   required to compile, no cast, no structural change, both declared
   dependencies still genuinely used.
6. **`G-DRIVE-2` authorized**, widening Edit 7 beyond the brief's
   G-DRIVE-1-only spec.
7. **Edit 10 authorized**, admitting `CLAUDE.md` and `docs/ROADMAP.md`
   past the constraint-1 path list — and deliberately sequenced *after*
   the evidence round, so its wording could claim only what the six steps
   proved.
8. **URL redaction moved to the source** (smoke revision 2) and **the
   stale preamble suppressed** (revision 3), both implemented in the
   injected log sink with no product code touched.
9. **A8 exception accepted** for the sink's module-level `heldPreamble`,
   recorded with its reasoning rather than silently passed.
10. **Two commit subjects changed at Pause 3**: #7 to name both GOTCHAS
    entries (G-R4 — the approved subject had gone dishonest once the diff
    carried two), and #10 as `update` over `document`, because the ROADMAP
    clauses were false rather than merely unrecorded.
11. **`origin/main` merged into the branch, not rebased.** The closer's own
    definition (`.claude/agents/closer.md`) landed in `main` after this
    branch forked, so the branch had to take it before the role could be
    invoked at all. Merge over rebase, deliberately: both recaps cite
    commit SHAs nominally, and rewriting them would turn this task's own
    historical record into fiction. The merge is clean — `CLAUDE.md` was
    auto-merged, the two sides having edited different sections — and it
    makes `main` the comparison base, so `git diff main...HEAD` now shows
    exactly this task's files.

## Deviations

- **D3 execution model deviated.** The owner instructed the Orchestrator
  session to run the smoke rather than running it themselves. Credential
  placement stayed with the owner; the executor ran nothing. What D3
  protects — no live claim without a real run and a verbatim transcript —
  held. Recorded in `notes.md` §1 with that provenance, never as
  "owner-run".
- **Edit 10 is not in the brief**, and two commit subjects differ from its
  declared sequence. All three by explicit in-session authorization.
- **The brief's structural check was executed three-dot**
  (`main...HEAD`), because local `main` advanced past this branch's base;
  the two-dot form now reports brief 048's files as if this task had
  touched them.
- **The brief's own window for surfacing the docs reconciliation was
  missed.** It allowed surfacing at Pause 2 — but Pause 2 fired at Edit 2,
  before the fourth package existed. Handled by the Edit 10 authorization
  instead. A brief that defers a decision to a Pause should name a Pause
  that occurs after the decision is knowable.

## Doctrine absorbed mid-session — the `closer`

Brief 048 (PRs #108, #109, merged today by a parallel session) added a
sixth role. The closer reads `git diff main...HEAD` on the task branch and
runs three checks — architecture against R18-R25, duplication against what
`core` exports, secret/path hygiene — then emits one report. Phase A is
read-only and its verdict is input to the owner's judgment, not a gate that
opens itself. **Phase B pushes and opens the PR on explicit per-branch
owner instruction.**

Brief 047 was written before the closer existed, so its "Expected output"
does not mention it. The gap was closed at the Orchestrator level, not by
amending the brief. **047 is the first task to pass through this role.**

## Rule-of-three ledger (updated)

- **Brief-authored structural checks that cannot pass as written: 2
  occurrences**, both in this task (secret sweep; library grep). Both are
  bare substring greps where the intent was about imports or values.
  Candidate rule when a third appears: anchor structural greps on
  `^import`, or require a value after the colon.
- **A brief check that breaks when its base moves: 1st occurrence** (the
  two-dot `main..HEAD` form).
- Recap policy divergence: unchanged (threshold met at 046; this session
  produced both recaps, per policy).

## Pending items (queue)

1. **This session's PR** — closer Phase A over the assembled diff, then
   push + PR on explicit owner instruction; owner squash-merges. The merge
   SHA is confirmed by the NEXT session.
2. **Queue front: the `ship` MVP brief — slot 049.** Payload: D1-D5 from
   the 2026-07-27 mentor recap, plus `docs/tasks/046-spike-adapter-drive/notes.md`
   and `docs/tasks/047-adapter-drive/notes.md` as Context inputs. The five
   primitives are its building blocks; three sentences in `CLAUDE.md` and
   `docs/ROADMAP.md` assert the adapter is unwired and each names `ship`,
   so a grep finds all three when they go false.
3. **Cross-user content-read gap (spike D7)** — still untested, needs a
   second `@estrategia.com` account. Must run before the D4 prefix check
   is implemented.
4. **Internal-mode refresh longevity** — partial evidence only. The
   2026-08-02 run refreshed an expired access token unattended at day 6,
   which a 7-day cap would also have allowed; a corroborating run after
   **~2026-08-04** is still required.
5. **Orphan remote branch** `origin/docs/explorations-desktop-ui-host`
   (`ef3551e`, "docs(explorations): add desktop-ui-host note") — pushed,
   no PR open, not in `main`. Decision pending.
6. **Two stale worktrees**: `closer-subagent-diff-review-c483dd` (its
   branch merged as #109) and `gifted-mccarthy-1330bc` (a `claude/*`
   branch at the old base).
7. **`CLAUDE.md` R25 adapter list** does not name `adapter-drive`. Its
   wording is non-exhaustive, so it is not false — but a third concrete
   adapter now exists. Candidate for a later edit.
8. **Playbook recap-policy reconciliation** (carried from 046;
   rule-of-three met there).
9. Parked (unchanged): local→Jira promotion (known common demand);
   manifest `variation` field (042 D4); multi-contributor naming;
   Jira-born manual overrides; `jira_updated_at` nullability.
10. Horizon: `@saci/*` → `@breu/*` rename; the `saci config` write
    surface.

## Next concrete action

Invoke the `closer` for Phase A over `feat/adapter-drive` (12 task commits
plus the `origin/main` merge, 28 files against the merge base, both recaps
aboard). Read its report, decide, then instruct Phase B — push and PR —
explicitly. The next session confirms the merge SHA via P4 / `git log`
before consuming anything.

## Paste-ready snippet for the next Orchestrator session

Use `harness/workflows/setup-orchestrator.md` with:

```
Modo desta sessao: modelar tarefa (pipeline).
Ultima entrega: task 047 — @saci/adapter-drive implementado e provado ao
vivo. Porta DriveGateway redeclarada como cinco primitivas; adapter sobre
googleapis + google-auth-library com user OAuth (escopos drive.file +
drive.metadata.readonly, credenciais em ~/.saci/); smoke 6/6 em
2026-08-02, com createFolder ganhando a primeira evidencia viva do
projeto. 12 commits (os dois recaps inclusos) mais um merge de origin/main
no MESMO PR [preencher #]. Verifica o merge via P4 / git log antes de
consumir.
ATENCAO: o slot 048 foi consumido por outra sessao (agente closer, sexto
papel do pipeline — revisa o diff montado antes do push, Fase B empurra e
abre a PR). O proximo slot livre e 049.
TEMA DESTA SESSAO: brief do ship MVP (Category M/L, caminho A pro
planner). Payload: D1-D5 do recap mentor 2026-07-27 + notes.md do 046 e do
047 como Context inputs. Watch items que viram Constraints: gap cross-user
nao testado (roda a rodada 2 antes do prefix check do D4) e corroboracao
de longevidade do refresh depois de ~2026-08-04.
```
