# Session recap — 2026-07-27 — 046-spike-adapter-drive (Orchestrator)

**Mode:** task modeling via pipeline (fused model, AGENT_PLAYBOOK ch. 6) —
planner → brief-validator → executor as in-session subagents, Pauses
honored under STOP-and-return transport relayed by the Orchestrator.
**Consumes:** the mentor ship-semantics recap and PR #106 at
`main@b26ddb7` (merge confirmed via P4 this session).
**Pairs with:** `2026-07-27-executor-046-spike-adapter-drive.md` — the
execution log lives there (owner ruling this session: two recaps per the
playbook policy as written; see Rulings ledger).

## One-line summary

Task 046 shipped on `docs/spike-adapter-drive`: the adapter-drive
research spike closed ROADMAP pending decision #11 — **googleapis +
google-auth-library, user OAuth (Desktop loopback), scopes `drive.file`
+ `drive.metadata.readonly`, consent mode Internal** — with all four
Drive operations proven live in three evidence rounds, and the `ship`
MVP brief unblocked. Category S research modeled as a full Category L
brief (validator C2); no product code touched.

## P4 slot evidence

Three sources agreeing 046 was next: `ls docs/tasks/` topped at 045;
`git log --oneline origin/main` topped at `b26ddb7` (PR #106, which
itself declares slot 046 free); no forward reserves in `CLAUDE.md` E*.
Slot 046 is now consumed; next free slot is 047.

## Pipeline record (orchestrator scope)

- Delegation (caminho A): the five spike questions from the mentor D6
  recap, D3/D4 dependencies, `docs/explorations/drive-oauth.md` as
  Context input under the explorations README contract (note = 
  possibilities; §10 credential hygiene binding), 037 evidence-round
  execution model, bundled ROADMAP map-row reconciliation.
- planner: brief authored to `docs/tasks/046-spike-adapter-drive/brief.md`,
  Category L (deliberate escape from the delegation's M default —
  substance ~395 lines), Plan required no, 5 Edits, D1–D7 closed.
- brief-validator, round 1: APPROVED, 11/11 PASS.
- Orchestrator gate catch: D4 block still read "Category M header" while
  the header read L — prose drift the validator structurally cannot see.
  Corrected at the gate (4 prose lines); re-audit: APPROVED, 11/11 PASS.
- executor: 5 brief commits + executor recap commit, all Pauses honored;
  see the paired executor recap for the execution log.

## Rulings ledger

- **Ruling 1 (category header):** the mentor recap's "Category S" label
  became a Category L header — validator C2 admits only M/L; the
  research nature is stated in the brief's Context. Encoded in the
  delegation, not improvised by the planner.
- **Ruling 2 (cross-user gap):** owner: no second account available →
  the drive.file cross-user content-read gap is recorded as EXPLICITLY
  UNTESTED per brief D7, with hypothesis and pre-ship watch item.
- **Ruling 3 (mid-pause evidence, the session's key finding):** while
  Pause 3 of the decision-note commit was open, the owner discovered in
  the GCP console that the OAuth project already lives in the
  estrategia.com org and converted the app External→Internal. The open
  pause absorbed the new evidence (note updated, pause refreshed, then
  approved): question 5 closed RESOLVED — the 7-day refresh-token cap
  binds only External+Testing; Internal mode removes it, kills the
  test-user list, and drops the unverified-app screen. Residual: light
  corroboration watch (~2026-08-04), not an open decision.
- **Ruling 4 (Edit 5 spec artifact):** the brief's own case-sensitive
  grep cannot match its own byte-exact 5b text ("Promoted" vs
  "promoted"). Owner ruled option (a): texts stand byte-exact, checkbox
  recorded as explicitly-not-met (intent satisfied, `grep -ci` = 2).
- **Ruling 5 (recap policy):** owner ruled two recaps (playbook policy
  as written) over the 043–045 fused-session practice of absorbing the
  executor log into the orchestrator recap. See rule-of-three ledger.

## Deviations

- **D2 execution model adapted:** the brief prescribed owner-runs-
  locally with pasted evidence. In practice the Orchestrator (running on
  the owner's Windows machine, unlike the sandboxed executor) performed
  the mechanical setup and script launches itself — scratch dir, ad hoc
  npm install, constants, background runs — while the owner supplied
  credentials placement, target IDs, browser consents, and the GCP
  console actions. Hygiene held: credential files outside the repo,
  contents never read or printed, auth URLs opened via `Start-Process`
  instead of pasted into chat. Faster than the letter of D2, faithful to
  its intent (executor never touched Google APIs).
- **Question 5 Part B:** the policy citation was fetched by the
  Orchestrator via web access instead of owner-pasted (the executor's
  sandbox has none; the Orchestrator does).

## Rule-of-three ledger (updated)

- **Recap policy doctrine-vs-practice divergence: 3 occurrences**
  (043, 044, 045 all shipped "Pairs with: no separate executor recap"
  against the playbook's three-recaps policy). Threshold met —
  reconciliation candidate for a future docs brief: either the playbook
  sanctions the absorbed form for fused sessions, or sessions return to
  two recaps (this session did the latter by owner ruling).
- Quoted-text-heavy briefs over effective ceiling: unchanged (1st).
- App subagent visibility: unchanged (1st).

## Pending items (queue)

1. **This session's PR** (task 046 + both recaps): push + PR on explicit
   owner instruction; owner squash-merges. Merge SHA recorded by the
   NEXT session per the recap policy.
2. **Queue front: `ship` MVP brief** — unblocked by this spike. The
   mentor recap's D1–D5 are its delegation payload; the spike's watch
   items (notes.md) feed its Constraints: cross-user round 2 before the
   D4 prefix check is trusted, Internal consent instructed from the
   start, `.gitignore` + GOTCHAS entries for credential files and the
   scope-change trap.
3. **Playbook recap-policy reconciliation** (rule-of-three met, above).
4. Parked (unchanged from the mentor recap): local→Jira promotion
   (known common demand); manifest `variation` field (042 D4);
   multi-contributor naming; Jira-born manual overrides;
   `jira_updated_at` nullability.
5. Horizon: `@saci/*` → `@breu/*` rename; `saci config` write surface.

## Next concrete action

Owner instructs push + PR for `docs/spike-adapter-drive` (both recaps
aboard), then squash-merges. Next session confirms the merge via P4 /
`git log` and models the `ship` MVP brief (pipeline delegation carrying
the mentor D1–D5 plus this spike's decision note as Context input).

## Paste-ready snippet for the next Orchestrator session

Use `harness/workflows/setup-orchestrator.md` with:

```
Modo desta sessao: modelar tarefa (pipeline).
Ultima entrega: task 046 — spike adapter-drive fechou o pending decision
#11 do ROADMAP: googleapis + google-auth-library, user OAuth (loopback
Desktop), escopos drive.file + drive.metadata.readonly, consent Interno
(convertido durante o spike; cap de 7 dias eliminado). 4 operacoes
provadas ao vivo em 3 rodadas; gap cross-user registrado nao-testado
(D7) com watch item. 6 commits + 2 recaps no MESMO PR [preencher #].
Verifica o merge via P4 / git log antes de consumir. Slot 047 e o
proximo.
TEMA DESTA SESSAO: brief do ship MVP (Category M/L, caminho A pro
planner). Payload: D1-D5 do recap mentor 2026-07-27 (evento repetivel;
deny-list + omissao ledgered; anchor unico verify-never-create;
concorrencia otimista por prefixo; caminho unico Jira/local-born) +
decision note docs/tasks/046-spike-adapter-drive/notes.md como Context
input (watch items viram Constraints). Ver secao "Pending items" da
recap orchestrator 046 para a lista completa.
```
