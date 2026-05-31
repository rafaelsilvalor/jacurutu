# Session recap — 2026-05-31 — mentor — 017-repositioning-shepherd-and-sdd

**Mode:** mentoring (chat-side shepherding of brief 017 through the planner → brief-validator → executor pipeline, end to end; plus a methodology discussion on SDD).
**Mentor:** Claude Chat (this session).
**Executor (separate Claude Code sessions):** `@planner` (authored 017, multiple iterations), `@executor` (executed 017).
**Continuation of:** `docs/sessions/2026-05-28-mentor-saci-repositioning-individual-prod-assistant.md`.

Long, dense session. Brief 017 (docs repositioning of Saci v2 as an individual production assistant) was scoped, authored by the planner, reviewed, corrected, recreated via caminho B, executed, reviewed, PR'd, and merged. The session also surfaced a repeating planner behavioral gap, an executor calibration observation, and ran a substantial methodology discussion: Saci's process mapped against SDD / GitHub Spec Kit / EARS, plus what a future "consolidate into a reusable kit" effort would require.

## Decisões e eventos — pipeline (brief 017)

- **Path/mode clarified up front.** "Modelar tarefa" is no longer a §8 mode (folded into "mentoring" since brief 015). Brief 017 is **not** chat-authored: it goes through the `@planner`; the mentor produces scope only. M-R15 reserves caminho-B chat-authoring for planner/skill-modifying briefs, which 017 is not. → process clarification; confirmed path A by the user.

- **017 scope produced and handed to the planner.** Decisions + edit list + out-of-scope + references, with two scope defaults the user accepted: (a) `CLAUDE.md` stays out of scope (adapter-drive goes only in MENTOR_BRIEF §2 package list); (b) three Pending decisions recorded (later four, with Drive JS lib). → planner input.

- **Planner authored 017; mentor review found a repeating gap.** The planner applied the mechanical text fixes (item-count, "five→six", style note) but **skipped** the judgment / cross-tool items: verb `reposition` not swapped despite the allowlist, no parking-lot STOP-guard (it doubled down on a questionable mapping), no P4 evidence, no §2-vs-main guard. **Same systemic gap catalogued in brief 016** ("commit subjects don't pre-check against executor's audit"; "mechanical nature vs decisions requiring judgment"). → strengthens the deferred `planner.md` update.

- **Corrections issued; planner cherry-picked again → mentor recreated the brief via caminho B.** One-off lane exception (017 is docs, normally the planner's deliverable), taken because the user was blocked on logistics. The recreated `brief.md` applied: A1 (verbs `reposition`→`document`), B1 (2e turned into a STOP-and-confirm guard so it's safe even without verifying the parking lot from chat), B2 (P4 checkbox in Edit 1), B3 (§2-vs-main completeness check in Edit 3). → `docs/tasks/017-repositioning-prod-assistant/brief.md` (pre-saved on disk).

- **017 executed cleanly by `@executor`.** Three docs commits on `docs/repositioning-prod-assistant`, correct order, allowlist verbs (`add`, `document` — `reposition` never used), no Co-authored-by, no push. All guards resolved: P4 confirmed 017 free; the 2e parking-lot mapping was **verified correct against the live file** (the "Source-of-truth split formalization" bullet was the sole handoff carrier); §2 completeness confirmed. The upstream verb fix held — **zero Check 3 STOPs** (vs 4 in brief 016). → `docs/ROADMAP.md`, `docs/MENTOR_BRIEF.md` §2, `docs/tasks/017.../brief.md` merged to `main` (squash, GitHub UI).

- **Executor calibration observation.** The executor **softened a literal STOP guard to report-and-continue**: the §2 wholesale replacement dropped the old "Google Sheets stays as team-facing / won't be replaced by desktop UI" bullet; the executor judged it an intentional supersession (Sheets now secondary), disclosed it, and proceeded rather than stopping. Sound call here, but it is the **mirror image of the planner**: the planner skips judgment, the executor exercises it past a literal STOP. → calibration note for `executor.md` / guard wording.

- **PR + cleanup.** PR opened against `main` with a corrected body (real template; added the §2 dropped-bullet note for the reviewer; un-checked the R5 ≤400 line item as N/A since `brief.md` is a 921-line docs artifact, not source). Reusable post-merge cleanup snippet produced (auto-detect branch, `git branch -D` after squash, `--ff-only`, no remote push, confirm-before-delete). → cleanup snippet; candidate home is `harness/workflows/close-task.md`.

- **§2 content note.** The 921-line `brief.md` traces to the mentor recreating it monolithically instead of `brief.md` + `snippets.md` (the 016 seam). Not worth re-splitting a merged artifact; recorded so it is not repeated for code briefs.

## Decisões de método (SDD discussion)

- **Saci's process IS SDD, specifically the spec-anchored / near "Constitutional SDD" variant.** The brief = a spec carrying the six elements (outcomes, scope boundaries, constraints, prior decisions, task breakdown, verification criteria); the pipeline = Coordinator/Implementor/Verifier (planner/validator/executor); the constitution = `CLAUDE.md` + `MENTOR_BRIEF` + `GIT_WORKFLOW` + verb-allowlist SSOT; pauses/PR/no-push = the governance layer. Saci independently reinvented GitHub Spec Kit's pipeline (`constitution → specify → clarify → plan → tasks → analyze → implement`), with a richer mentor layer in front.

- **What to import when Phase 2/3 arrive (decided):**
  - **EARS notation** for behavioral / acceptance criteria in **code briefs only** (Phase 2/3) — `WHEN <trigger>, the system SHALL ...`; `IF <condition>, THEN ...`; `WHERE <feature>, ...`. Strong fit for Phase 3 command semantics and template-match rules. **Not** for docs briefs (byte-match criteria, not system behavior).
  - **A comprehensive upstream "analyze" gate** — close the `brief-validator` gap so it greps the verb allowlist (C11 should run Check 3), making it a real pre-implement consistency check like Spec Kit's `/analyze`. This is the existing deferred validator/`planner.md` work; Spec Kit only confirms the shape.
  - **Consider:** automate P4 numbering (Spec Kit auto-numbers; the planner skips manual P4). Low priority.
  - **Reject (modismo):** splitting `spec.md`/`tasks.md`; a formal `/clarify` command; adopting Spec Kit tooling wholesale.

- **Context-window verdict:** the combined `brief.md` beats separate `spec.md`/`tasks.md` for Saci's shape — locality (task + constraint + criterion adjacent), no cross-reference/sync tax, fresh-session loads, and it eliminates an entire class of validator drift-checking. Saci's `brief`/`snippets` split (reasoning vs verbatim bulk) is a **better seam** than spec/tasks (what vs how).

- **Consolidation into a reusable kit (future):** requires separating *process* (reusable) from *project instance* (Saci-specific) — today entangled in `CLAUDE.md`. Needs: a parameterized constitution template; domain-agnostic agents/skills (reference conventions, not "CLAUDE.md R19"); a bootstrap/init (template-repo, not necessarily a CLI); an "invariants vs knobs" doc. **Two gates before freezing:** close the known gaps first; prove on a second project (N=1 ≠ methodology). **Cheap habit now:** tag each rule touched as *generic* vs *Saci-specific* as tasks run, so the separation is pre-mapped.

## Pendências abertas

### Alta prioridade — afeta a próxima sessão
- **Re-upload `MENTOR_BRIEF.md` + `ROADMAP.md` to claude.ai project knowledge** (post-merge). Manual, user. Blocks the next chat reading the fresh versions.
- **This recap** → save to `docs/sessions/`, merge via separate PR (convention since session 010).
- **`planner.md` update — now with two sessions of evidence (016, 017).** Planner must, at authoring time: run the verb-allowlist grep + P4 three-source check; and **add STOP-guards when the mentor flags a judgment risk** instead of asserting harder. This gap will bite Phase 2 **code** briefs harder than docs.
- **`brief-validator` gap (C11 vs Check 3):** the validator does not grep the verb allowlist. Make it a true comprehensive analyze gate. Bundle with the `planner.md` work and/or the EARS/analyze import.

### Média / deferida
- **`executor.md` calibration:** executor softens literal STOP guards on judgment. Decide whether that is desired, or whether guards need harder/unambiguous wording.
- **`close-task.md`:** formalize the reusable post-merge cleanup steps (the snippet from this session).
- **EARS adoption** for Phase 2/3 code briefs — when those are modeled.
- **JS libraries** for Jira REST, **Google Drive** (now first-class), and Google Sheets — pre-Phase-3/4 research; Drive is the new addition.

### Carry-over (não-bloqueante)
- "Old 013": executor memory placement, no-verbal-override pattern, draft skill promotion — Phase 2 will give more data.
- Brief 012 R10 subject-length errata; brief 013 verb-count errata — historical.

## Artefatos gerados

- **Merged to `main` (PR, squash):** `docs/ROADMAP.md` (repositioned), `docs/MENTOR_BRIEF.md` §2 (rewritten), `docs/tasks/017-repositioning-prod-assistant/brief.md` (new, 921 lines).
- **This mentor recap** — delivered to `/mnt/user-data/outputs/`; user saves via caminho B on a separate recap branch.
- **Mentor-produced in chat (not repo):** 017 scope block; corrections block for the planner; recreated `brief.md` (caminho B); executor invocation snippet; corrected PR title/body; reusable post-merge cleanup snippet.

## Próxima ação concreta

Two candidates — recommendation included:

- **(Recommended) Close the `planner.md` + `brief-validator` gap before Phase 2.** Rationale: the gap cost real friction in 017 (cherry-picking, manual recreate), it will hurt more on Phase 2 **code**, and the EARS/analyze import wants the validator to be a proper gate anyway. Small, high-leverage. Could be one bundled brief: planner runs verb-grep + P4 + adds STOP-guards on mentor flags; validator greps the allowlist (C11→Check 3); optionally fold in `close-task.md` cleanup + the EARS convention for code briefs.
- **(Alternative) Go straight to the Phase 2 technical brief** (`lib_transform.py` → `core`; design `Workspace` + `TaskManifest` as TS interfaces; define Jira/Sheets/Drive gateway ports). Accept the planner gap will bite again and catch it at review.

Either way the next session is **mentoring** (design/scope), handing the brief to the `@planner`. Apply P4 before fixing the NNN.

## Snippet pra colar na próxima sessão

```
Olá. Modo: mentoria.

Continuação de 2026-05-31-mentor-017-repositioning-shepherd-and-sdd.
Brief 017 mergeado: ROADMAP + MENTOR_BRIEF §2 reposicionados pra "assistente
individual de produção"; Phase 3 virou núcleo do produto, Phase 4 agregação,
adapter-drive na lista de packages. Pipeline rodou limpo (sem STOPs de verbo —
o fix upstream segurou).

Decisão pendente pra esta sessão: ou (A) fechar o gap do planner/validator
antes da Phase 2 — planner roda grep do allowlist + P4 e adiciona STOP-guards
quando o mentor sinaliza julgamento; validator grepa o allowlist (C11→Check 3);
+ EARS pra briefs de código e cleanup no close-task.md — ou (B) ir direto pro
brief técnico de Phase 2 (port de lib_transform.py → core; tipos Workspace e
TaskManifest; ports Jira/Sheets/Drive). Recomendação do recap: (A) primeiro.

Aplica P4 antes de fixar o NNN. Mentoria produz escopo; planner autora o brief.

Pendências carregadas: re-upload de MENTOR_BRIEF/ROADMAP no project knowledge
(se ainda não feito); executor.md calibration (amolece STOP em julgamento);
EARS pra Phase 2/3; JS libs Jira/Drive/Sheets; "old 013".

Antes de propor próximo passo, confirma quem entendeu que sou e o modo (M-R13).
```
