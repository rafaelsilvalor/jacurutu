# Session recap — 2026-07-23 — 037-evidence-close-protocol (mentor)

**Mode:** modelar tarefa → continuar — state verification → recovery of the
missing 2026-07-13 gate-session recap (reconstruction, PR #90) → caminho-B
authoring of brief 037 (pipeline-modifying, M-R15; precedent 027) → fully
supervised execution: Pause 2 × 2 Edits, Pause 3 × 3 commits, one owner
STOP, two owner-ruled deviations → post-merge record reconciliation on an
executor STOP backed by git evidence → session-date correction (owner
catch).
**Consumes:** the two 036 recaps (PR #89) and the reconstructed
`docs/sessions/2026-07-13-mentor-036-keyless-start.md` (PR #90).
**Pairs with:** the executor 037 recap in this same PR.
**Date note:** earlier drafts of this recap (never committed) were
mis-dated 2026-07-15 — the mentor assumed the date from the prior chat
window's last-activity timestamp instead of verifying. Session closed
2026-07-23; that date governs.

## One-line summary

Settled the two open debts of the 036 cycle — the missing gate-session
recap (reconstructed from chat history with a provenance note, merged as
PR #90 at `main@53c3bb0`) and the executor protocol patch (brief 037:
evidence-close codified as Pause 3 step 7, plus three mechanical transport
rules, executed as 3 commits, 232/0 at every boundary, squash-merged as
**PR #91 at `main@b73c311`**) — and closed with a post-merge record
reconciliation in which the executor's git evidence refuted a
mentor-originated amend narrative before it reached a durable artifact.

## Part 1 — The missing 2026-07-13 recap (debt settled)

- State check opened the session: PR #88 (`main@e1b73ab`) and PR #89
  (`main@730463d`) confirmed by owner evidence. PR #89's subject revealed
  only the two 2026-07-14 recaps had landed; the gate-session recap
  referenced by both was still not on disk.
- Root cause reconstructed from chat history: the original artifact WAS
  authored at the gate session's close but never reached the repo; the
  chat output container does not persist across sessions. The owner
  searched the original chat window and could not recover the file.
- Mentor re-authored the recap from conversation history (several sections
  recovered verbatim), with an explicit **provenance note** at the top and
  no re-enumeration of D6-D13 (their canonical record is the committed
  brief — do not reconstruct what has a better source).
- Merged as **PR #90 → `main@53c3bb0`**
  (`docs(sessions): add mentor recap for 036 gate session`). The dangling
  cross-reference in both 036 recaps now resolves.
- **Known defect on `main`, fix rides this docs PR:** the merged
  provenance note reads "Reconstructed on 2026-07-15"; the reconstruction
  happened in this session. One-line find-block fix (see queue item 1).

## Part 2 — Brief 037: evidence-close protocol (authored and executed)

### Scope evolution (three ratification points)

1. **Original two-rule scope** (from the 036 queue): final-message
   transport rule + no-debt precondition, both ratified mandatory.
2. **Ground-truth finding widened it to three items:** the evidence-close
   step itself was codified nowhere — `.claude/agents/executor.md` Pause 3
   ended at step 6; the practice of pasting `git log --format=%B -1`
   verbatim lived only in recaps and runtime mentor instructions. The two
   rules would have referenced an unwritten step. Ratified: codify step 7
   first.
3. **Owner mid-run addition, ratified pre-commit at commit #1's Pause 3:**
   **Single-block packaging** — every Pause presentation and every
   evidence-close paste is emitted as ONE fenced code block, so the owner
   can copy it whole into the mentor chat. The amendment was applied to
   the brief on disk (207 → 214 lines) before commit #1 existed; Pause 3
   was re-presented on the amended file and commit #1 was created once.

### P4 slot evidence

Three sources checked by owner command output: `ls docs/tasks/` (highest
036; gaps 004-006 and 034 preserved as burns), `git log --oneline main`
(nothing above 036), `CLAUDE.md` E* (v1-freeze exceptions only, no forward
reserves). Slot 037 confirmed.

### Pipeline events, in order

- Caminho B: brief pre-saved by owner; executor invoked directly (no
  planner, no validator — pipeline-modifying, precedent 027).
- **Pause 3 #1 (pre-ruling) STOPped by owner** to apply the packaging
  amendment; re-presented on the amended file and approved; commit #1
  created once (`09e0a02`).
- **Evidence debt occurred mid-run:** commit #1's evidence-close did not
  reach chat; the next turn opened Edit 2's Pause 2 over the outstanding
  debt — a live violation of the (reflexively binding) no-debt
  precondition. Caught by mentor. The debt was settled by the verbatim
  `%B` paste of commit #1, confirmed in chat. One **stale Pause 2
  re-emission** (pre-ruling artifact) was REJECTED and superseded by the
  complete Edit 2 presentation.
- **Deviation 1 — Edit 2b intro line ("Three mechanical rules").** The
  executor's mismatch note at Edit 2's Pause 2 was correct: the packaging
  amendment had left the brief's Edit 2b intro reading "Two mechanical
  rules" over three bullets. The mentor's mid-run ruling prescribed
  fixing the brief and amending commit #1; **as executed, no amend
  occurred and the brief was never edited again** — the corrected intro
  landed only in `.claude/agents/executor.md` via Edit 2b, inside
  commit #2 (`8d4ffa3`). Net effect: an owner-sanctioned deviation from
  the committed brief (annotated in the final report's Edit 2 checkbox).
  See "Record reconciliation" below for how this was established.
- **Edit 2 (executor.md):** step 7 (evidence-close) + new subsection
  "Evidence transport and Pause precondition" with the three bullets.
  Verification greps 4/1/1/1. Commit #2 evidence-closed clean.
- **Deviation 2 — Lesson #15 enumeration.** Translation drift caught at
  Edit 3's Pause 2 gate, mentor-originated: the brief's Lesson text
  labeled "three rules" as {evidence-close, final-message, no-debt} while
  executor.md's "Three mechanical rules" means {final-message,
  single-block packaging, no-debt}. Owner-ruled deviation without
  touching the committed brief: Lesson relabeled as "the Pause 3
  evidence-close step plus three mechanical transport rules". Annotated
  at Pause 2, at commit #3's Pause 3, and in the final report.
  Commit #3 (`cb3ffad`) evidence-closed clean.
- Reflexive requirement held from ratification onward: every subsequent
  Pause and evidence-close arrived as one fenced block.

### Commits (all evidence-closed verbatim in mentor chat)

| # | SHA | Message |
|---|---------|---------|
| 1 | 09e0a02 | docs(tasks): add brief for 037-evidence-close-protocol |
| 2 | 8d4ffa3 | docs(agents): add evidence-close rules to executor Pause 3 |
| 3 | cb3ffad | docs(playbook): document evidence-close doctrine as Lesson 15 |

Final state: 3 files, +246/-0 (brief 214, executor.md +30,
AGENT_PLAYBOOK.md +2); build + 232/0 tests at every commit boundary;
self-audit 15 PASS / 0 FAIL. Squash-merged as **PR #91 →
`main@b73c311`** (`docs: add evidence-close protocol to executor and
playbook (brief 037)`); post-merge cleanup done (local branch force-
deleted, remote ref auto-removed).

## Record reconciliation (post-merge, git-evidence-based)

At close-out the executor raised a **STOP backed by three independent git
evidences** against a mentor-issued "binding correction" that claimed
commit #1 had been amended (`--amend --no-edit`) to carry the intro fix:

1. Reflog: commit #1 appears exactly once, plain commit, no amend entry.
2. SHA stability: `09e0a02` unchanged from creation through the merged PR.
3. Merged brief content: the Edit 2b replace block on `main@b73c311`
   still reads "Two mechanical rules" — no intro fix ever entered the
   brief.

**The STOP was upheld; the amend narrative is retracted.** The
reconciled record:

- The mid-run mentor ruling (fix brief + amend commit #1) was **not
  executed as issued**; whether it reached the executor verbatim is not
  determinable from the mentor side (rulings are owner-relayed).
- The corrected intro landed only in executor.md inside commit #2 —
  Deviation 1 above. The brief on `main` prescribing "Two" while
  executor.md reads "Three" is a **recorded deviation, not a defect**.
- The mentor confirmed an "amended commit #1" evidence-close on `%B`
  output — evidence that **cannot distinguish an amend**, since
  `--amend --no-edit` preserves the message byte-exact. The confirmation
  verified message integrity, not operation execution.
- The executor's final-report sentence "no history rewrite needed since
  nothing was committed" was wrong in its reasoning (commit #1 WAS
  committed and its evidence-close was outstanding) but right in its
  conclusion (no rewrite occurred).

**Correction binding for the executor recap (revised):** record the
mid-run no-debt violation accurately — one Pause 2 opened over
commit #1's outstanding evidence-close; caught, rejected, settled before
the run advanced. A caught violation, not a clean checkbox — evidence FOR
the patch, stated accurately. (The former "correction #1" — the amend
narrative — is retracted and replaced by this section.)

## Process observations (rule-of-three ledger)

- **Message-evidence is not operation-evidence** (1st occurrence).
  `git log --format=%B` proves the message, not the operation that
  produced it. Rulings involving history operations (amend, rebase)
  require operation-specific evidence: a reflog line or a before/after
  SHA comparison. Formalize on third occurrence.
- **Ground-truth-by-assumption, two variants this session:** (a) the
  amend narrative (above); (b) **the session date** — the mentor dated
  all session artifacts 2026-07-15 by assuming continuity from the prior
  chat window's last-activity timestamp; the owner caught it at recap
  review (session actually closed 2026-07-23). The mis-date leaked into
  one durable artifact: the PR #90 provenance note (fix rides this docs
  PR, queue item 1). Parent pattern already known; the dates variant is
  now on record.
- **Mentor-originated amendment drift** (1st occurrence of the pattern):
  an in-flight scope addition amended one Edit and missed its
  cross-references in sibling Edits (the Edit 2b intro and the Lesson #15
  enumeration were both siblings of the packaging amendment). Informal
  habit from now: sweep all Edits for cross-references when amending.
- **Executor stale re-emission** (1st occurrence): a previously-emitted
  Pause artifact was re-sent unchanged instead of reflecting current
  state. Caught by owner.
- The evidence-transport doctrine proved itself in vivo twice: the
  mid-run debt was caught and settled with the rules being codified, and
  the executor's git-evidence STOP blocked a false mentor claim from
  reaching a durable artifact — the gate works in both directions.

## Pending items (queue)

1. **Docs PR (this recap + executor 037 recap + provenance-date fix)**
   on its own branch. The fix: in
   `docs/sessions/2026-07-13-mentor-036-keyless-start.md`, find
   `Reconstructed on 2026-07-15` and replace with
   `Reconstructed on 2026-07-23` (STOP-if-mismatch).
   [CONFIRMAR: docs PR #NN at `main@<sha>`.]
2. Open-in-software (D3 of session 032) — small follow-up brief.
3. **Hygiene batch — now actionable:** `payload.json` in `.gitignore`
   (rule-of-three reached in the 036 run; confirmed untracked again in
   every Pause of this run); missing-env error DX still at 2nd occurrence
   (stays out).
4. Template naming convention + sanitization unification.
5. `gateways.ts` manifest-shape TODO (from 035 report).
6. Parked: Jira-born manual overrides; `jira_updated_at` nullability
   parking-lot; parked cluster unchanged.
7. Horizon unchanged: `ship` command, `@saci/*` → `@breu/*` rename
   (README rides it), `saci config` (identity-file writer).

## Next concrete action

Executor authors its recap (with the revised correction), commits both
recaps + the provenance-date fix on `docs/session-recaps-037`, owner
merges the docs PR, project knowledge cache-swap → next session picks
from the queue (mentor recommendation: hygiene batch — smallest item,
rule-of-three reached).

## Paste-ready snippet for next mentor session

```
Ola. Continuando o projeto Saci. Modo: [mentoria | modelar tarefa | ...].
Ultima entrega: brief 037 evidence-close-protocol executado e mergeado
(PR #91 a main@b73c311): executor.md ganhou passo 7 evidence-close + 3
regras mecanicas de transporte (final-message, single-block packaging,
no-debt); AGENT_PLAYBOOK Lesson #15; duas deviations owner-ruled (intro
do Edit 2b; enumeracao do Lesson #15). Recap 07-13 reconstruido e
mergeado (PR #90 a main@53c3bb0; provenance-date corrigida no docs PR).
Reconciliacao de registro pos-merge: STOP do executor com evidencia git
derrubou narrativa de amend do mentor; owner pegou mis-date de sessao
(07-15 vs 07-23 real). Ledger: "message-evidence is not
operation-evidence" (1a), variante datas do ground-truth-by-assumption.
[CONFIRMAR: docs PR #NN a main@<sha>; cache-swap feito?]
TEMA DESTA SESSAO: [hygiene batch (payload.json, rule-of-three) |
open-in-software | template naming | ship command | rename @breu].
Carrega CLAUDE.md, MENTOR_BRIEF.md, ROADMAP.md e os recaps
docs/sessions/2026-07-23-mentor-037-evidence-close-protocol.md e
docs/sessions/2026-07-23-executor-037-evidence-close-protocol.md.
Antes de propor proximo passo, confirma em uma frase quem sou e o modo.
```
