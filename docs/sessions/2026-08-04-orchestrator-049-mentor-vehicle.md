# Session recap — 2026-08-04 — 049-mentor-vehicle (Orchestrator)

**Mode:** task modeling via **caminho B** (AGENT_PLAYBOOK "When NOT to use the
pipeline" — the task modifies the pipeline itself). The Orchestrator authored
the brief directly under the owner's write gate, closing decisions one at a
time. planner NOT invoked; brief-validator invoked **twice**; executor invoked
normally.
**Consumes:** PR #113 at `main@13e63d7` (the exploration note) and PR #114 at
`main@9e6d826` (the 2026-08-03 mentor recap) — both merges confirmed via
`git log` at session open, as the opening snippet required.
**Pairs with:** `2026-08-04-executor-049-mentor-vehicle.md` — the execution log
lives there.

## One-line summary

Task 049 shipped on `docs/mentor-vehicle`: the Mentor moved off claude.ai and
into Claude Code as **its own main session**, carried by a new `mentor-mode`
skill plus `setup-mentor.md` and `close-mentor-session.md`. The two chat
workflows were deleted and every pointer to them repaired. Doctrine rewrites
were deliberately left out — brief 050 owns them.

## Brief A was split — the session's first decision

The exploration note planned three briefs (A, B, C). Measuring A against the
repo showed it specified three new files plus four canonical-document
rewrites: past 600 lines, which `brief-template` calls "XL in disguise". Split
by surface, and the note's §6 table was updated to record it:

| Brief | Slot | Scope |
|---|---|---|
| A1 | 049 | The vehicle — shipped this session |
| A2 | 050 | The doctrine — `MENTOR_BRIEF.md`, `AGENT_PLAYBOOK.md` ch. 6, `explorations/README.md`, `CLAUDE.md` gloss |
| B | 051 | The 22 ROADMAP entries migrate into notes |
| C | 052 | Identifier cutover across the 15 convention files |

## P4 slot evidence

Three sources, checked 2026-08-04: `ls docs/tasks/` topped at
`048-closer-agent`; `git log --oneline main` topped at `9e6d826` with 047 and
048 both merged (#110, #108/#109); no `CLAUDE.md` E* entry reserves a forward
slot. All three agreed on **049**.

The blind spot recorded at 048 — the three sources cannot see a slot held on an
unmerged branch — did not bite this time, because there were zero open PRs.
It remains a live trap, not a solved one.

## Three note decisions did not survive contact with the repo

The valuable half of this session. Each is recorded as a brief decision rather
than silently adapted:

- **D3 — the `settings.json` deny is not implementable as specified.** The note
  called for a path `deny` mechanically backing the Mentor's narrow write.
  `.claude/settings.json` does not exist here (only the gitignored
  `settings.local.json`), and project settings apply to **every** session and
  are inherited by subagents — a deny narrow enough to protect the Mentor would
  break the executor and the Orchestrator. The permission layer has no per-role
  condition. Ruled: ship the doctrinal half, record the gap inside the skill
  itself so a reader meets the limitation instead of assuming enforcement. One
  untested candidate named for the follow-up: skill-level `allowed-tools`.
- **D4 — the `--- COPIAR ---` blocks are pt-BR, against R9's letter.** R9 says
  those blocks are English; every one on disk is pt-BR, including the
  `setup-orchestrator.md` block the owner pastes to open this very session.
  Ruled pt-BR for consistency with the sibling the owner actually uses, with
  the deviation declared. Brief 050 reconciles the R9 sentence with reality.
- **D6 — the doctrine window is declared, not patched.** Until 050,
  `MENTOR_BRIEF.md` and `AGENT_PLAYBOOK.md` ch. 6 still call the Mentor a chat
  role. Rather than half-rewrite them, both new files carry one visible line
  naming brief 050. **050 must delete two things:** section 9 of the skill and
  the migration paragraph inside `setup-mentor.md`'s COPIAR block.

## Rulings ledger

- **Ruling 1 — transport.** The brief contradicted itself: D3's forbidden list
  banned `git branch` / `git commit` / `git push` outright, while D5 step 5
  said branch creation and PR opening happen "with explicit approval". Both
  shipped into the two workflow files, leaving it undefined who runs
  `git switch -c`. Caught at Pause 3 by reading the files, not by any check.
  Owner ruled **option (a): the Mentor writes the note and stops** — branch,
  commit, push and PR are the owner's or an Orchestrator's. One rule, no
  carve-out. **This supersedes brief D5 step 5**, and is recorded here because
  the brief was not amended for it.
- **Ruling 2 — the Edit 4 sweep.** The checkbox demanded the
  `setup-chat|close-chat-session` sweep return nothing outside `docs/sessions/`
  and `docs/tasks/`. It returned two matches, both D-set rows of the
  exploration note. The executor STOPped rather than edit the D-set that D7
  protects. Owner ruled **option (a)**, with the framing that matters: the
  checkbox did not fail — **the brief named the wrong exclusion set**, omitting
  the third historical surface, `docs/explorations/`. With it added, the sweep
  is clean. Option (b) — marking the two rows "superseded by brief 049" — was
  rejected on stronger ground than D7: it would be **false**. Note D1 and D7
  are *implemented* by this brief, not superseded.
- **Ruling 3 — bundle.** Editing the note's §6 table falsified its own section
  heading ("The three briefs") and the sentence below it. Owner ruled bundle
  into the same commit. Line 107 ("Why B depends on A") left alone — imprecise,
  not false. Line 164 explicitly protected: it sits inside the first changelog
  entry and records what was decided on 2026-08-03.

All three were relayed to the executor as continuation messages, not written to
`notes.md`. Justification: the two that changed shipped content were relayed
with the replacement text verbatim, and the Orchestrator verified the result on
disk before approving. The durable record is this recap, which the policy
already designates as the carrier of deviations.

## Four brief defects — all the Orchestrator's, none the executor's

The pattern worth carrying forward: **every defect was in the brief, and three
of the four were caught by running something rather than by re-reading.**

1. **Constraint 4 mandated `npm test` as commit evidence.** Running it exposed
   two failure shapes: on an unbuilt worktree it globs
   `packages/*/dist/**/*.test.js`, matches nothing and exits `0` — a vacuous
   green; after `npm run build` it resolves `@saci/*` to the main checkout and
   fails on unrelated symbols (G-NODE-2). Caught **before** the executor ran and
   rewritten to a scoped check. Had it shipped, five commits would have carried
   a "tests pass" line meaning nothing — textbook O3.
2. **The D3/D5-step-5 transport contradiction** (Ruling 1). Shipped into two
   files before it was caught.
3. **The Edit 4 exclusion set** (Ruling 2).
4. **The session date.** Eight lines dated 2026-08-03, inherited from the
   previous session's note without checking the calendar. Caught after the run;
   fixed in commit `03438b0`. Two occurrences were left at 08-03 on purpose —
   one quotes a commit subject genuinely about that day's recap, the other
   refers to the note's two pre-existing changelog entries.

Two more were caught before the first commit: a `## Quando usar` quoted outside
a code fence would have tripped validator C10 (the word "Quando" matches its
pt-BR marker list), and one verification checkbox carried a grep that could not
run.

## Deviations

- **Six commits, not the five in the brief's Commit sequence.** The extra is
  the date fix, authored by the Orchestrator. The five brief subjects were used
  verbatim.
- **The brief was modified after `Verdict: APPROVED`.** A new commit, not an
  amend. Re-validated rather than asserted safe: APPROVED at `a6929f5` and
  again at `03438b0`, 11/11 both times.
- **Category L, above range.** Substance ~480 against the 200-400 guide,
  declared in a size note. See the ledger below — this is the third occurrence.
- **Commit #1 was the Orchestrator's, not the executor's.** The validator
  requires a clean tree, so the brief had to be committed before the audit.
  Edit 1's checkboxes read as if the executor commits it; the invocation prompt
  named the mismatch explicitly and told it to verify and start at Edit 2.
  **Fix for future caminho B briefs:** write Edit 1 as a verification step, not
  a commit step.
- **No `STATE.md`.** Category L but single-session and docs-only; the path is
  not in Constraint 1. The executor flagged rather than decided.

## Rule-of-three ledger (updated)

- **Brief substance above the Category-L ceiling with a declared size note:
  3rd occurrence** (047 ~600, 048 ~430, 049 ~480). The 048 recap set the
  threshold itself: *"a third makes the ceiling itself the thing to revisit,
  not the briefs."* **Triggered.** The 200-400 guide in `brief-template` has
  not governed a single doctrinal brief. Revisit the ceiling — or split the
  guidance by brief class — before authoring 050.
- **Brief internal contradiction between a constraint list and a procedure
  step: 1st occurrence** (Ruling 1). Related in kind to 048's "absolute
  line-count verification" defect: both are verifications or rules written
  without enumerating the surface they govern.
- **Verification checkbox with an incomplete exclusion set: 1st occurrence**
  (Ruling 2).
- **P4 blind to unmerged-branch slot claims:** unchanged at 1st — did not
  recur, because there were zero open PRs. Not solved.
- **Recap policy doctrine-vs-practice divergence:** still a reconciliation
  candidate; this session again shipped two recaps per the policy as written.

## Pending items (queue)

1. **This session's PR** — not opened. Six commits plus two recaps on
   `docs/mentor-vehicle`, nothing pushed.
2. **Brief 050 (A2) — the doctrine.** Queue front, and it must delete skill
   section 9 and the `setup-mentor.md` migration paragraph. Two extra items to
   fold in: the R9 sentence about English `--- COPIAR ---` blocks (D4), and the
   skill's read policy listing `npm test`, which in a worktree yields the
   vacuous green described above.
3. **The mechanical write deny** — verify whether skill-level `allowed-tools`
   can scope a restriction to a session, then a follow-up brief. Until then the
   Mentor's narrow write is honor-system, and the skill says so.
4. **G-NODE-2 addendum candidate.** The gotcha covers "tests pass against stale
   `dist`". It does not cover the shape found here: `dist` absent entirely, so
   the glob matches zero files and `npm test` exits `0` on zero tests. A green
   that means "nothing ran" is worth its own line.
5. **F3** — `docs/AGENT_PLAYBOOK.md:388` still says brief-validator audits
   "10 mechanical checks"; it is 11 since C11. Carried from 048, still open.
6. **Closer checks (a) and (b) have never been executed.** Unchanged from 048 —
   the first real test is a branch touching `packages/**`. The five-finding
   ceiling remains unexercised.
7. ~~**OAuth token file mode**~~ — **closed.** `writeStoredToken` in
   `packages/adapter-drive/src/credentials.ts` now writes with
   `mode: TOKEN_FILE_MODE`. Verified this session; retired from the queue.
8. Parked, unchanged: local→Jira promotion; manifest `variation` field;
   multi-contributor naming (E6 keeps it parked); Jira-born manual overrides;
   `jira_updated_at` nullability. Horizon: `@saci/*` → `@breu/*`;
   `saci config` write surface.

## An observation worth keeping

The `mentor-mode` skill became invocable in this very session the moment the
file touched disk, before it was committed. Skills are picked up from the
working tree, not from `main`. Harmless here; worth knowing before a future
session writes a skill it does not intend to activate yet.

## Next concrete action

Open the PR against `main` from `docs/mentor-vehicle` — the owner's call and
the owner's hand. The PR body should carry Ruling 1 and Ruling 2, since neither
is recorded in the brief. Optionally invoke the closer's Phase A on the branch
first; it will scale out checks (a) and (b) on a docs-only diff and run secret
hygiene.

## Paste-ready snippet for the next Orchestrator session

Use `harness/workflows/setup-orchestrator.md` with:

```
Modo desta sessao: modelar tarefa — caminho B (brief doutrinario;
Orchestrator autora, planner NAO e invocado).

Ultima entrega: task 049 — o Mentor saiu do chat e virou main session
propria no Claude Code. Skill .claude/skills/mentor-mode/SKILL.md, mais
harness/workflows/setup-mentor.md e close-mentor-session.md; setup-chat.md
e close-chat-session.md deletados, todos os ponteiros reparados. 6 commits
+ 2 recaps no MESMO PR da branch docs/mentor-vehicle. CONFIRMA via git log
se esse PR ja mergeou antes de consumir — quando esta recap foi escrita ele
nao tinha sido nem aberto.

Brief A da nota virou dois: A1=049 (entregue), A2=050 (doutrina), B=051,
C=052. O cutover de identificador foi reancorado no merge do brief C — nao
existe mais "cutover no slot 049".

TEMA DESTA SESSAO: brief 050 — a doutrina. Reescreve MENTOR_BRIEF.md
(M-R12 a M-R15, §5, §7, §8), AGENT_PLAYBOOK.md cap. 6, o contrato do
explorations/README.md e o gloss do CLAUDE.md. OBRIGATORIO: apagar a secao
9 da skill mentor-mode e o paragrafo de migracao dentro do bloco COPIAR do
setup-mentor.md — os dois foram escritos pra morrer no 050.

ANTES DE AUTORAR: o teto de 200-400 linhas do brief-template estourou pela
terceira vez seguida (047 ~600, 048 ~430, 049 ~480). Decide se o 050 nasce
menor ou se o teto e que vai ser revisado.

Duas decisoes do 049 que NAO estao no brief, so nesta recap: (1) o Mentor
escreve a nota e para — branch, commit, push e PR sao meus ou de uma sessao
Orchestrator; (2) o conjunto de exclusao do sweep do Edit 4 estava
incompleto, faltava docs/explorations/.
```
