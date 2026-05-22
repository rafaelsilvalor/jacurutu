# Session recap — 2026-05-19 — 011-harness-cleanup

**Mode:** continue task (executed pre-authored brief 011 in Code; no modeling step).
**Executor:** Claude Code (this session).
**Orchestrator (prior):** Claude Chat (brief 011 author; design closed in chat session 2026-05-18 — D1–D7).

## Decisions taken

- **`grep -n 'Co-authored-by' harness/workflows/setup-code.md` was not empty after the sweep — accepted as expected.** Brief's expected output said "empty"; one match remained on line 60. But the match is in the **new** Pattern 4 text, in a negation context: "sem trailers — sem `Co-authored-by`, sem `Signed-off-by`". The trailer prescription is gone; the term survives only as a literal prohibition mandated by Edit 3a itself. Flagged in the session report and the PR notes; not corrected.

- **`abre o PR` (verbal instruction) honored by R17 / G-R5 directly — no tension with the brief.** Brief 011 said "Push is the user's call (R17 / G-R5). Stop after commit 5 and report." That language **defers to R17 / G-R5**, not adds a new constraint: those rules literally read "push is the user's call, every time" — they reserve push to explicit user instruction. The user's typed `abre o PR` (post-session-report) **is** that explicit instruction, so push + `gh pr create` followed without ambiguity. The memory `feedback_brief_overrides_create_pr.md` covers a different scenario — `/create-pr` invocation as harness automation, where the trigger is mechanical and the brief's "Do not push" is the override; its body says: "Treat `/create-pr` in that context as 'stage and commit what's ready, then stop and report' — never run git push, never call gh pr create." Verbal user instruction is outside that scope. The "process question" carried from session 010 is resolved by literal reading of both R17/G-R5 and the memory body: no tension, no rule conflict.

- **Brief-on-disk verified, not regenerated (caminho B path).** First line of `docs/tasks/011-harness-cleanup/brief.md` matched byte-for-byte. No regeneration attempt; brief committed as commit #1 per the caminho B convention defined in `harness/prompts/task-brief-template.md`.

## Pending items

### High-priority — affects next session

- **Workflow-lifecycle cluster brief.** Brief 011 explicitly deferred a set of related items to "the next brief":
  - Git line-endings policy — `.gitattributes` content + retroactive normalization. LF→CRLF warnings emit on every new file Git touches during this session (`STATE.md`, `docs/tasks/011-harness-cleanup/brief.md`). Non-blocking; the policy decision shapes the fix.
  - GOTCHAS candidate: literal sweeps colliding with derived identifiers (carried from 010). Placement undecided — stack-traps file (`docs/GOTCHAS.md`) vs. orchestration playbook (`docs/AGENT_PLAYBOOK.md`).
  - `audit-merge` workflow (formalization).
  - `close-chat-session.md` "branch before recap commit" step.
  - `<date>-<role>-...` naming convention for session recaps.
  - `commit-discipline` vs. `pause-3-protocol` overlap (skills-plan).

- **Phase 1 monorepo bootstrap.** Brief 011 said: "Phase 1 monorepo bootstrap follows after this brief lands." Sequencing relative to the workflow-lifecycle cluster brief is the next chat-side decision: workflow-lifecycle first (smaller, doctrine cleanup) or Phase 1 first (larger, structural).

### Operational — pending before next session

- **PR #17 merged.** `main` fast-forwarded to `fa5466c`. Local branch `docs/harness-cleanup` deleted. Working tree clean.

- **This recap to be reviewed and merged via separate PR** per project convention (see `docs(sessions): add recap …` precedents).

### Carried — from prior sessions, partially or fully addressed here

- **Style directive (no unusual symbols).** Addressed by Edit 6 (M-R7 refinement). M-R7 now prohibits greek letters (α, β, γ), decorative glyphs, and emphasis-by-symbol; mandates descriptive labels instead. Closed.

- **M-R10 cross-reference to `CLAUDE.md` R9.** Addressed by Edit 7. M-R10 now explicitly references the three-surface split and names the `harness/` carve-out. Closed.

- **`setup-code.md` Pattern 1 / Pattern 5 + `pause-3-protocol.md` `BRIEF_*.md` glob refs.** Addressed by Edits 2–4. Closed.

- **`harness/README.md` bootstrap-vs-permanent-scaffolding tension** (from 010 recap). Addressed by Edit 5 — README now leads with "operate the project day-to-day" use case; "bootstrap em projeto novo" relabeled as secondary. "Princípio do kit" renamed to "Princípio" with rewritten body. Closed.

## Artifacts produced

- **Seven commits on branch `docs/harness-cleanup`** (squash-merged) — 5 `docs:` per brief's "Suggested commit sequence" (D7) plus 2 `chore(state):` brackets (start + remove) per G-R10 lifecycle. Squash collapses to a single commit on `main`.
  - `71ba534` — `docs(tasks): add brief for 011-harness-cleanup` (1 file, +400)
  - `321b645` — `chore(state): start 011-harness-cleanup` (1 file, +28)
  - `7bf44fc` — `docs(setup-code): align patterns with Plan required flag and no-trailer policy` (1 file, +4/-5)
  - `c40468f` — `docs(skills-plan): replace stale BRIEF glob refs in pause-3-protocol` (1 file, +3/-4)
  - `c38ac00` — `docs(harness-readme): reframe harness as permanent scaffolding` (1 file, +20/-16)
  - `2b88606` — `docs(mentor-brief): refine M-R7 with style hygiene and M-R10 with harness split` (1 file, +2/-2)
  - `98af77e` — `chore(state): remove STATE.md after 011-harness-cleanup` (1 file, -28)
- **PR #17** — https://github.com/rafaelsilvalor/saci/pull/17 (`docs: harness cleanup (workflow patterns, glob refs, README reframe, M-R7/M-R10)`), filled per `.github/pull_request_template.md`. Squash-merged into `fa5466c`.
- **This recap file** — `docs/sessions/2026-05-19-011-harness-cleanup.md`.

## Verification summary (brief 011 Edits 1–7)

- `grep -rn 'BRIEF_' harness/skills-plan/pause-3-protocol.md` → zero matches ✓
- `grep -n 'Co-authored-by' harness/workflows/setup-code.md` → 1 match in **new** negation text (Edit 3a output); prescription removed ✓ (relaxed criterion)
- `git diff --stat origin/main...HEAD` (pre-merge) → only 5 in-scope files modified per brief, plus `STATE.md` (lifecycle, expected) ✓
- Find blocks for Edits 2–7 all matched byte-for-byte on first attempt — no regeneration, no approximation ✓
- M-R6, M-R8, M-R9, M-R11 byte-identical to before (visible in the M-R7/M-R10 diff) ✓
- No `--no-verify`, no co-author trailer, no out-of-scope file modified ✓

## Next concrete action

Chat-side: decide whether to author the workflow-lifecycle cluster brief next (smaller, closes the carried doctrine cleanup) or jump to the Phase 1 monorepo bootstrap brief (larger, opens v2 code). Brief 011 leaves the order open; both are queued.

## Snippet for the next session

```
Olá. Modo: [continuar | modelar tarefa].

Continuação de 2026-05-19-011-harness-cleanup. Brief 011 fechado:
- setup-code.md Pattern 1 agora condiciona o plano à flag
  Plan required (R15); Pattern 5 (Co-authored-by trailer) removida;
  pergunta órfã sobre .git/config removida
- pause-3-protocol.md: BRIEF_*.md refs removidas (line 10 + SKILL.md
  description)
- harness/README.md: reordenado — "em projeto já configurado"
  primeiro, "Bootstrap em projeto novo" como secundário; Premissa
  reescrita como scaffolding permanente; "Princípio do kit" →
  "Princípio"
- MENTOR_BRIEF.md: M-R7 + style hygiene (sem símbolos incomuns;
  ver M-R7); M-R10 com referência explícita à R9 e ao carve-out
  do harness/

Pendências carregadas pra próximo brief:
- Workflow-lifecycle cluster: .gitattributes (line endings),
  GOTCHAS literal-sweep vs. derived-identifiers, audit-merge,
  close-chat-session branch-before-recap, naming convention,
  commit-discipline vs. pause-3-protocol overlap
- Phase 1 monorepo bootstrap — sequência (workflow-lifecycle
  primeiro ou Phase 1 primeiro) é decisão pendente

PR #17 mergeada (fa5466c). Recap em
docs/sessions/2026-05-19-011-harness-cleanup.md.

Antes de propor próximo passo, confirma quem entendeu que sou e
o modo da sessão.
```
