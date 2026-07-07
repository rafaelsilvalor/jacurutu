# Mentor session recap — 2026-07-07 — first live smoke run + 033 exit-crash fix

> Session type: mentoring (smoke-run triage) + pipeline supervision (caminho A,
> brief 033). Outcome: first live `saci start` run against a real Jira card;
> three findings triaged; root-cause investigation delegated and reviewed;
> conditional fix design (D1) ratified; brief 033 executed through the full
> 4-path verification matrix — Step 1 (zero-dep) sufficed.
> Pairs with the executor recap for 033 (execution-side record).

## Session opening

Close-out of 032 confirmed from the recaps (PR #79 → `main@85ff582`; recaps
merged via PR #80 → `55db16b`). The executor recap's suggested opener — a
first live `saci start` smoke run — was chosen over the queued docs
reconciliation on cost-asymmetry grounds: minutes of terminal work that could
reorder the queue vs. a full session of docs work that no smoke outcome would
invalidate.

## Smoke run — setup findings (before the command even ran)

- **Env var names verified from the fail-loud error itself:**
  `SACI_JIRA_BASE_URL`, `SACI_JIRA_EMAIL`, `SACI_JIRA_API_TOKEN`. Rafael
  initially set `SACI_JIRA_TOKEN` (no `API_`); the mismatch was caught by
  listing `Get-ChildItem env:SACI_JIRA*`.
- **DX note (1st occurrence, not rule-of-three):** the missing-env error
  lists all three var names as fixed text instead of naming which one is
  actually absent — real end-user friction, lived twice in this session.
  Candidate future DX improvement; recorded only.
- **Binary not linked:** `saci` is not on PATH; the smoke ran via
  `node packages\cli\dist\cli.js …`. `npm link` deliberately deferred —
  when day-to-day use starts it can be born as `cabu`, post-rename.

## Smoke run — the three findings and their verdicts

Card used: **MCA-63821** (root card, no parent, delivery field populated,
vertical ECJ). Runs: blank happy path, collision (with `--blank`), template
happy path, plus a pure `fetch` as discriminator.

### Finding 1 — `parent_key: issue has no parent` warning → benign, closed

Rafael confirmed the card is a parentless root card in Jira. The warning is
honest and correct. No action.

### Finding 2 — no `<SEMESTRE>` segment in derivePath / drivePath → contract, not gap

Rafael (product owner) confirmed: the semester folders pre-exist and are
**not created by Saci**; since all current work is AVULSAS, the derived path
starts at `AVULSAS`. The root the tool is pointed at (local workspace today,
Drive folder for `ship` tomorrow) lives *inside* the current semester.

Consequences recorded:

1. **Docs item** — the docs reconciliation must state the boundary
   explicitly: *derivePath derives from the semester downward; the semester
   segment is the responsibility of the pointed-at root.* One sentence,
   prevents a future `ship` planner from "fixing" what is not broken.
2. **Semester-rollover risk** — re-pointing the root at semester turnover is
   manual and silent today; a stale root writes into the wrong semester
   without failing. Feeds the parked **period→semester-folder config** item:
   when promoted, "detect/alert stale semester root" is a natural
   requirement. Annotation only.
3. **`ship` inherits the same contract** — the manifest's `drivePath`
   (starting at `AVULSAS`) resolves against a Drive root that already
   includes the semester. Recorded now to spare the rediscussion in the
   `ship` D-set.

### Finding 3 — libuv abort at process exit → real defect → brief 033

Symptom: `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING),
src\win\async.c:76`, exit `0xC0000409` (Windows fail-fast abort), on the
`--blank` happy path AND the collision path — masking the semantic exit code
on both. Template happy path and pure `fetch` exited 0 cleanly. Empirical
matrix built in-session pointed at the paths with **little or no post-network
work** (the "fast paths"), suggesting a termination race rather than a
`--blank` bug per se.

## Root-cause investigation (read-only, delegated to Code)

Report accepted. Root cause: **`process.exit()` at `cli.ts:121/125` races
libuv's teardown of the undici keep-alive socket** left open by
`globalThis.fetch` (`http.ts:88`); each request also arms a 30s
`AbortSignal.timeout`. Slow paths (template `copyFile`, fetch's extra
round-trip + payload write) give the event loop enough turns to settle the
socket close; fast paths don't. Explains every row of the empirical matrix,
including the counterintuitive "the path that does less crashes".

One report claim was ground-truth-checked before ratifying the fix: "undici
ships inside Node, zero net footprint" is only half true — **`import('undici')`
is `ERR_MODULE_NOT_FOUND` on Node 24.15** (verified in-session). A dedicated
Agent therefore requires `npm install undici`: a real first runtime
dependency, elevating the R2 cost from footnote to decision.

## D1 (fix design) — ratified

**Conditional two-step, no mentor return between steps:**

- **Step 1 (primary, zero-dep):** send `Connection: close` on both Jira
  requests so no keep-alive handle survives the response. Marginal cost:
  TCP/TLS re-handshake per request — irrelevant at 3 requests per command.
- **Step 2 (fallback, pre-ratified):** `undici` as the project's first
  runtime dependency (R2 justification: same engine Node embeds; we pay for
  the lifecycle API Node does not expose), dedicated Agent as dispatcher,
  disposed via the existing `fetchImpl` injectable seam, try/finally in the
  composition roots.
- **In both outcomes:** `cli.ts` migrates `process.exit(EXIT_OK/EXIT_RUNTIME)`
  to `process.exitCode` + natural return; synchronous version/usage exits
  stay (no async work precedes them, hence no handle).
- **Done criterion:** the 4-path exit-code matrix on Windows (collision,
  blank, template, fetch), semantic codes, no assertion.

Hard out-of-scope: file-naming convention, drivePath semester segment,
env-var message DX, anything under `packages/core` (R25 — root cause needs
none).

## Brief 033 — pipeline record

- Caminho A: planner → brief-validator → mentor gate → executor. Branch
  `fix/start-exit-libuv-crash` cut from `55db16b` (main after PR #80);
  brief commit `2ea3a69`.
- **Pause 1 rulings (three questions):** (1) credentials — provide live
  (option 2): the matrix is the done criterion; MCA-63821 + the smoke
  fixtures reused; (2) STATE.md — skip per the 032 precedent, reopen only
  if Step 2 fires; (3) regression test asserting the header in
  `http.test.ts` — not added: it locks implementation rather than behavior,
  and goes stale if Step 2 fires. Edit 1 verify-only deviation (brief
  already HEAD) acknowledged and accepted.
- **Execution:** Edit 2 (`http.ts` +2, header on both requests) → Edit 3
  (`cli.ts` +4/−2, exitCode migration) → Edit 4 matrix **4/4 PASS** with
  semantic exit codes ($LASTEXITCODE 1/0/0/0) and zero libuv assertions.
  **Step 1 sufficed; undici never installed; zero-deps invariant preserved.**
- Commits: `2ea3a69` brief → `18b1564` `fix(adapter-jira): add Connection:
  close to Jira requests` → `05c923b` `fix(cli): remove process.exit from
  async run paths`. Push + PR authorized explicitly (R17/G-R5).
- **PR #81 → `main@b05b688`** (squash merge).

## Process incidents (both recorded, neither formalized yet)

1. **Lost go at Pause 3 (Edit 2):** the commit was approved but never
   executed; no error surfaced. Detected only because Rafael ran
   `git log --oneline -2` in a parallel window (HEAD still at the brief
   commit). Recovery: re-issued go with mandatory evidence
   (`git log --oneline -3` pasted raw before proceeding). Doctrine
   extension observed: *ground-truth before asserting current state applies
   to the executor's own success confirmations, not just initial state.*
   First occurrence of this specific failure mode (distinct from the 032
   session loss). If it recurs: candidate mechanical check — Pause 3 closes
   only on pasted `git log -1` output.
2. **Wrong path in a mentor ruling:** the mentor's Pause 1 snippet gave
   `D:\Projects\cabu\templates` as templates root; the smoke fixture
   actually lives at `D:\Projects\cabu\smoke\templates` (the P1 sibling of
   the smoke workspace root `D:\Projects\cabu\smoke\smoke-start-032`).
   Mentor error — path reconstructed from memory instead of from the smoke
   transcript. Executor corrected it autonomously (verification only,
   nothing repo-touched) and reported the correction back: correct behavior
   on both counts.

## Carried inputs for future briefs (no action this session)

- **File-naming convention brief** gains a concrete target format from the
  product owner, with a real example:
  `vertical_key_descricao_variacao` → `ecj_mca-63821_informativo-893-…_carrossel.psd`.
  Note: **`variacao` does not exist anywhere in the manifest today** — the
  convention brief must decide where it comes from.
- **`payload.json` untracked-clutter** (2nd occurrence: smoke `?1` prompt
  noise + misread during 033 Pause 3): candidate `.gitignore` entry in a
  future chore. Verified NOT tracked (`git ls-files payload.json` empty) —
  the executor's "also on main" phrasing was imprecise, no repo cleanup
  needed.
- **Missing-env error DX** (1st occurrence): name the actually-missing var.

## Pending items (queue after this session)

1. **Docs reconciliation session (accumulating, one PR):** derivePath D2
   deviation (segments return type); Phase 2 exit criterion referencing the
   removed `Workspace` type; **new — the semester-boundary contract
   sentence (finding 2)**.
2. Keyless start / local task identity — schemaVersion 2 D-set, own mentor
   session.
3. Open-in-software (D3) — small follow-up brief.
4. Template naming convention + sanitization unification — now with the
   target format input above.
5. Parked cluster unchanged (template catalog, campaign resolution, copy
   ingestion, period→semester-folder config — now annotated with the
   stale-root alert idea —, Performance flow, PMA/Jornalismo fixed
   destination, EPJ consolidation, automatic file-name generation).

## Next concrete action

Complete 033 close-out: Rafael merges the PR (squash) → executor post-merge
cleanup (checkout main, pull, delete local branch, prune remote ref) →
cache-swap ritual (in: this recap + executor 033 recap + brief 033; out:
both 032 recaps + brief 032). Then the next mentor session front-runner:
**docs reconciliation** (now three items), with keyless start behind it.

## Paste-ready snippet for next session

```
Ola. Continuando o projeto Saci. Modo: [mentoria | modelar tarefa | ...]
Ultima entrega: brief 033 start-exit-libuv-crash — crash 0xC0000409 na
saida do `start` (fast paths) corrigido com Step 1 zero-dep (Connection:
close nos requests Jira + process.exitCode no cli); matriz de 4 caminhos
4/4 no Windows; undici nao foi necessario. Primeiro smoke run real do
`saci start` concluido (MCA-63821): estrutura D-A, manifest, colisao e
template OK; semestre ausente do drivePath confirmado como CONTRATO
(root aponta pra dentro do semestre). PR #81 mergeado a main@b05b688.
TEMA DESTA SESSAO: [docs reconciliation (D2 derivePath + Workspace no
Phase 2 exit + fronteira do semestre) | keyless start + schemaVersion 2 |
open-in-software brief | convencao de nomes de arquivo].
Carrega CLAUDE.md, MENTOR_BRIEF.md, ROADMAP.md e os recaps
docs/sessions/2026-07-07-mentor-033-smoke-run-and-exit-fix.md e
docs/sessions/<executor recap 033>.
Antes de propor proximo passo, confirma em uma frase quem sou e o modo.
```
