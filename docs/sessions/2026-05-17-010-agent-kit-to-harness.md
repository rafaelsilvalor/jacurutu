# Session recap — 2026-05-17 — 010-agent-kit-to-harness

**Mode:** continue task (executed pre-authored brief 010 in Code; no modeling step).
**Executor:** Claude Code (this session).
**Orchestrator (prior):** Claude Chat (commit #1 + brief author, commits 77c646b and 7f4d30f).

## Decisions taken

- **False-positive policy for pass 4 (`agent-kit` → `harness`).** Two literal substrings of unrenamed real-world identifiers preserved as-is: the task folder name `010-agent-kit-to-harness/` and the current branch name `refactor/agent-kit-to-harness`. Rationale: substituting them would create broken references (paths/branches that do not exist). Implemented via placeholder-protect-restore around the four-pass substitution. Documented in commit body of `0cd53fc` for audit. → relaxed Edit 5 verification: `grep -rn "agent-kit" .` returns only matches within those two identifiers.

- **`harness/README.md` title change beyond brief literal.** The brief specified replacing the first paragraph and the Estrutura tree but did not mention the title. Changed `# Agent Kit` → `# Harness` for coherence with the new disambiguation line. In-scope per the rename's spirit; flagged in PR notes for reviewer.

- **PR opened on explicit instruction.** Brief constraint #5 said "No `git push`". User then explicitly typed `abre o PR`, which executor treated as overriding the brief default (R17: push is the user's call, every time). Push + PR creation executed in one step rather than push-then-confirm-then-PR. See "Pending items" — this may be a small process question worth confirming.

- **Brief 010 itself subject to literal substitution.** Brief content describing the rename now reads tautologically in places (e.g., line 48: "first pass would turn `harness/X` into `harness/docs/X`" — the original described the corruption mode in terms of the old name). Accepted per D4 (literal not semantic); not corrected. Historical-record cost.

## Pending items

### High-priority — affects next session

- **Process question — explicit-instruction override of brief defaults.** When the brief says "no push" and the user later types `abre o PR`, executor took that as override and proceeded directly to push + PR. Memory `feedback_brief_overrides_create_pr.md` reads as "ask before opening PR" even after explicit instruction. Worth confirming the intended rule next session — if the memory means "always confirm scope once even with explicit instruction", update behavior; if it means "/create-pr automation only", clarify the memory wording.

- **`harness/README.md` body still uses bootstrap-kit framing.** The new first paragraph reframes harness as permanent operational scaffolding ("não é scaffolding programático; é doutrina, workflows e prompts"). The rest of the README still describes the bootstrap-into-new-projects pattern ("Copia a pasta `harness/` pra raiz do seu projeto e renomeia pra `docs/`..."). Per brief: "prose semantics of the bootstrap instructions stay intact". Tension is real; future cleanup if the bootstrap framing is no longer the primary use case.

### Operational — pending before next session

- **PR #14 review and merge.** Open at https://github.com/rafaelsilvalor/saci/pull/14. Squash-merge per project convention. After merge, refresh project knowledge if a downstream chat session needs current state.

- **Git line-ending config.** Pre-commit emitted CRLF/LF warnings on `harness/README.md` and `harness/workflows/setup-chat.md` ("LF will be replaced by CRLF the next time Git touches it"). Non-blocking but indicates `core.autocrlf` or `.gitattributes` is letting LF files convert on checkout. Investigate next time someone touches Git config.

### Carried — from prior sessions, not addressed here

- **Style directive (no unusual symbols)** — still pending formalization in `MENTOR_BRIEF.md` (refine M-R7 or new M-R). Inherited from 2026-05-16-009 recaps.
- **Cleanup brief candidates** from 2026-05-16-009-modeling-and-execution recap (Pattern 1 / Pattern 5 in `setup-code.md`, `BRIEF_*.md` glob refs in `skills-plan/pause-3-protocol.md`). Not touched by brief 010 — its scope was purely the `Agent-kit` → `harness` rename.

## Artifacts produced

- **Three executor commits on branch `refactor/agent-kit-to-harness`:**
  - `41d03d9` — refactor(docs): rename Agent-kit references to harness (13 files, 143/143)
  - `74238c0` — refactor(claude-md): rename Agent-kit references to harness (1 file, 5/5)
  - `0cd53fc` — refactor(harness): rename internal references after flatten and rename (4 files, 16/25; README special handling)
- **PR #14** — https://github.com/rafaelsilvalor/saci/pull/14 ("refactor: rename Agent-kit to harness, flatten subfolders"), filled per `.github/pull_request_template.md` (What / Why / How tested / Notes for reviewer / Checklist).
- **This recap file** — `docs/sessions/2026-05-17-010-agent-kit-to-harness.md`.

## Verification summary (brief 010 Edit 5)

- `grep -rn "Agent-kit" .` → zero matches ✓
- `grep -rn "agent-kit" .` → 3 matches, all within the two preserved identifiers ✓ (relaxed criterion)
- `grep -rn "harness/docs" .` → 4 matches, all in brief 010 as descriptive prose (no real paths) ✓
- `git diff --stat main..HEAD` → only swept/renamed files modified ✓

## Next concrete action

Review PR #14 and squash-merge. Then decide whether to open a follow-up "harness-cleanup" brief addressing (a) the bootstrap-vs-permanent-scaffolding tension in `harness/README.md` body and (b) the carried items from 2026-05-16-009 (setup-code.md patterns, BRIEF_*.md glob refs in skills-plan).

## Snippet for the next session

```
Olá. Modo: [continuar | modelar tarefa].

Continuação de 2026-05-17-010-agent-kit-to-harness. Brief 010
fechado: rename Agent-kit -> harness + flatten dos subfolders
(docs/workflows, docs/prompts, docs/skills-plan subiram um nível).
Refs sweep aplicado em CLAUDE.md, docs/, harness/. PR #14 aberta.

Identificadores preservados pelo pass 4 (substring "agent-kit"
em refs reais não renomeadas):
- 010-agent-kit-to-harness (task folder)
- refactor/agent-kit-to-harness (branch atual)

Pendências carregadas:
- Process question: explicit instruction override de brief default
  ("abre o PR" após "no git push" no brief). Confirmar regra.
- harness/README.md body ainda usa framing de bootstrap-kit
  enquanto o novo primeiro parágrafo enquadra como scaffolding
  permanente. Possível cleanup futuro.
- Style directive (sem α/β/γ) — formalizar em MENTOR_BRIEF.md.
- Cleanup brief candidates de 2026-05-16-009 não foram tocados.

Antes de propor próximo passo, confirma quem entendeu que sou e
o modo da sessão.
```
