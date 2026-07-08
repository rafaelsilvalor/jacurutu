# Session recap — 2026-07-08 — 034-docs-reconciliation (mentor)

**Mode:** modelar tarefa → amended in-session to supervised interactive docs
edit (no brief; see D1 amendment). Mentor ratified each target text in chat
before application; Claude Code applied edits with ground-truth verification
at every step.
**Merged via:** PR #83 (this PR — merge SHA recorded in the next session's
opening snippet, not here).
**Pairs with:** the executor 034 recap in this same PR.

## One-line summary

Cleared the three-item docs-reconciliation debt accumulated since session
032: the `derivePath` bullet in `docs/ROADMAP.md` Phase 3 now matches the
shipped brief-030 contract; the dropped `Workspace` type is removed from
ROADMAP Phase 2 (Goal + exit criterion) and `MENTOR_BRIEF.md` §2 with the
real brief-031 rationale; the semester-boundary contract sentence is
single-sourced in the Phase 3 derivePath bullet.

## Session numbering (recorded decision)

This session produced **no brief**; `docs/tasks/` slot **034 is burned**
(gap preserved per P4) so that session numbering stays sequential without a
future brief 034 colliding with these recaps. The next brief runs P4 fresh
and is expected to land at **035**.

## D-set

### D1 — Task shape (ratified, then amended)

Ratified: one docs-only change, one PR, scope closed to `docs/ROADMAP.md` +
`docs/MENTOR_BRIEF.md` §2, three items. Explicitly out: `payload.json` /
`.gitignore` (repo chore, not docs), formalizing the 033 process incidents
(rule-of-three not reached), any edit to `CLAUDE.md`/`GOTCHAS.md`.

**Amendment (owner-ratified in-session):** caminho A with a brief was
downgraded to a supervised interactive edit — with every target text
ratified in chat and verified against code/briefs before application, a
brief would have been pure overhead for a docs-only Categoria S. Deviation
recorded, not doctrine: brief-less execution remains the exception, granted
per-task by the owner.

### D2 — derivePath bullet (ROADMAP Phase 3) — applied

Old text described `derivePath(issue) → string` with a
"vertical / campaign / date / name" hierarchy and a still-tacit contract.
Replaced with the shipped brief-030 contract: `derivePath(input:
DerivePathInput) → readonly string[]`, hierarchy
`AVULSAS / <vertical> / <YYYY-MM> / <KEY>_slug`, month fallback chain
(`entrega_iso` → `jira_updated_at` → `undated` sentinel — chain order
verified against `packages/core/src/derive-path.ts:78-88` before writing),
`campaign` on `DerivePathInput` (null in alpha), formalized-in-code pointer.

Two executor observations, both ruled on:

1. **Month fallback added** — `undated` is a real folder segment a future
   `ship` planner must know about; the full chain went into the bullet.
2. **Shipped notation** — house style `(shipped in brief 030)` in prose
   (line-105 precedent) won over the mentor's italic proposal.

### D3 — `Workspace` removal (two files, three passages) — applied

Removed with a short historical parenthetical (no strikethrough — that
convention is scoped to Pending decisions):

- ROADMAP Phase 2 Goal: names only `TaskManifest`; parenthetical records
  the drop with the **real brief-031 rationale**.
- ROADMAP Phase 2 exit criterion: `TaskManifest` only,
  "(shipped in brief 031; the planned `Workspace` type was dropped — see
  Goal note)".
- MENTOR_BRIEF §2: "**Phase 2 designs `TaskManifest`** … (the planned
  `Workspace` type was dropped in brief 031)".

**M-R4 catch (positive):** the mentor's placeholder rationale ("the
manifest is the portable unit") was flagged as reconstruction and
ground-truth-checked against `docs/tasks/031-task-manifest-v0/brief.md`.
The brief records a different rationale — the 2026-05-28 `workspace.ts`
shape predated the 2026-06-12 app-owns-state pivot and had zero consumers —
and the agent substituted it, condensed, in Edit A. Exactly the behavior
the verify-before-writing step exists for.

### D4 — Semester-boundary contract sentence — applied

Anchored **only** in the Phase 3 derivePath bullet (single-source; the
ship planner is the reader it protects). Final wording, appended to the
bullet:

> derivePath derives from the semester downward; the semester segment is
> the responsibility of the pointed-at root (the local workspace root
> today, the Drive root at `ship` time), which lives inside the current
> semester folder.

The "(the local workspace root today, the Drive root at `ship` time)"
clause pre-answers the ship-inherits-the-contract rediscussion the 033
recap predicted.

## Pause 3 record

- **Verb STOP fired correctly:** `reconcile` is not on the allowlist;
  `update` chosen (most of the diff corrects stale text; `document` would
  cover only the new sentence).
- **R12 branch catch (executor):** the session was sitting on `main`;
  commit was redirected to a new branch
  `docs/reconcile-roadmap-briefs-030-031` before anything landed. Verb
  allowlist governs commit subjects, not branch slugs — `reconcile` in the
  slug is fine.
- Commit message ratified: subject
  `docs: update Phase 2/3 text for briefs 030-031 and semester contract`
  (68 chars, no scope — the change crosses ROADMAP + MENTOR_BRIEF, so an
  unscoped `docs:` was accepted over the recent `docs(<scope>)` precedent).
- Go issued with **evidence-closed Pause 3** (post-033 doctrine): commit
  closes only on pasted raw `git log --oneline -2` + `git status`.
- Diff at Pause 3: `docs/ROADMAP.md` +23/−13, `docs/MENTOR_BRIEF.md` +4/−3.
  `payload.json` untracked, excluded.

## Process deviations recorded (neither formalized)

1. **Brief-less docs PR** (D1 amendment) — first occurrence of this exact
   shape; if it recurs twice more, candidate for a formal "docs-only
   fast path" in AGENT_PLAYBOOK per rule-of-three.
2. **Recaps riding the content PR** instead of a separate docs PR — owner
   call for a docs-only PR; consequence: this recap carries the PR number
   but not its own merge SHA.

## Pending items (queue after this session)

1. **Keyless start / local task identity** — schemaVersion 2 D-set, own
   mentor session. **Now the front-runner.**
2. Open-in-software (D3 of session 032) — small follow-up brief.
3. Template naming convention + sanitization unification — target format
   `vertical_key_descricao_variacao` on record; `variacao` absent from the
   manifest today.
4. Repo hygiene chore candidates: `payload.json` in `.gitignore` (2nd
   occurrence), missing-env error DX (1st/2nd occurrence) — neither at
   rule-of-three.
5. Parked cluster unchanged (template catalog, campaign resolution, copy
   ingestion, period→semester-folder config + stale-root alert idea,
   Performance flow, PMA/Jornalismo fixed destination, EPJ consolidation,
   automatic file-name generation).

## Next concrete action

Executor pastes commit evidence → mentor verifies → explicit go for push +
PR (title/body supplied then) → squash-merge → post-merge cleanup →
cache-swap ritual (in: both 034 recaps; out: both 033 recaps + brief 033).
Next mentor session: **keyless start / schemaVersion 2** D-set.

## Paste-ready snippet for next session

```
Ola. Continuando o projeto Saci. Modo: [mentoria | modelar tarefa | ...]
Ultima entrega: sessao 034 docs-reconciliation — divida de 3 itens quitada
(bullet derivePath do ROADMAP alinhado ao contrato do brief 030 com cadeia
de fallback de mes; tipo Workspace removido de ROADMAP Phase 2 e
MENTOR_BRIEF §2 com a rationale real do brief 031; frase do contrato de
fronteira do semestre single-sourced no bullet derivePath). Sem brief
(desvio D1 registrado); slot 034 de docs/tasks/ queimado — proximo brief
e 035. PR #83 mergeado a main@aadd92a.
TEMA DESTA SESSAO: [keyless start + schemaVersion 2 | open-in-software |
convencao de nomes de arquivo | chore de higiene (.gitignore payload.json
+ missing-env DX)].
Carrega CLAUDE.md, MENTOR_BRIEF.md, ROADMAP.md e os recaps
docs/sessions/2026-07-08-mentor-034-docs-reconciliation.md e
docs/sessions/2026-07-08-executor-034-docs-reconciliation.md.
Antes de propor proximo passo, confirma em uma frase quem sou e o modo.
```
