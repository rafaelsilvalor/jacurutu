# Brief: 009 — TS rules, caminho B workflow, E5 reconcile, Starlight parking lot

> **Category:** L
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/bundle-ts-rules-and-workflow`

---

## Context

Bundle of five docs-only follow-ups consolidated from session 2026-05-16-008-modeling-and-followups. All preparation work ahead of the Phase 1 monorepo bootstrap brief (next code-writing task). Sources of each item:

1. **TS-specific rules for `CLAUDE.md`** — pending since 2026-05-15 (Saci v2 TypeScript monorepo pivot). Current `CLAUDE.md` rules R1–R19 target the Electron-v1 JavaScript codebase; v2 needs an additive ruleset for TypeScript.
2. **`CLAUDE.md` E5 reconcile** — E5 references brief 002 (incorrectly — that became `storage-layer`) and briefs 004/005 (slot reservations burned in v1→v2 pivot on 2026-05-15). Cleanup blocked in previous briefs; resolved here.
3. **Caminho B workflow** — agreed on 2026-05-16. Briefs are pre-saved to disk by the user; the executor reads from disk rather than receiving the full brief in the chat prompt. Saves ~one brief's worth of output tokens per execution.
4. **Pasteable prompt convention** — formalize how the executor is invoked under caminho B (uses the `COPIAR` block of `start-task.md`, updated for the new path).
5. **Astro Starlight docs site** — surfaced 2026-05-16 as a candidate post-Phase-1 tooling task. Enters the ROADMAP parking lot as a single line.

Two stale-debt items surfaced while modeling this brief:

- `start-task.md` and other `Agent-kit/**` files still reference the deprecated `BRIEF_<name>.md` path (the `docs/tasks/<NNN>-<slug>/brief.md` convention was introduced in brief 000 but not propagated everywhere). Sweep included here.
- `setup-code.md` patterns 1 ("plan always required") and 5 ("Co-authored-by trailer") contradict canonical rules. **Out of scope** for this brief — deferred to a future `agent-kit-cleanup` task.

No application code is touched. No new dependency is added.

This brief is the first to use caminho B; it is pre-saved to disk by the user and the executor verifies presence as commit #1, rather than receiving the brief text in the invocation prompt.

## Goal

After this task:

- `CLAUDE.md` contains rules R20–R25 (TypeScript strict mode, ESM imports, no bundler, `node:test`, no `any`, hexagonal dependency direction).
- `CLAUDE.md` E5 is rewritten to reflect v1 freeze status; a section-level note clarifies that all current exceptions apply to v1.
- `Agent-kit/docs/prompts/task-brief-template.md` instructs caminho B invocation, includes a new step 6 in "Como usar manualmente", and carries a convention note documenting the "Edit 1" pattern shift.
- `Agent-kit/docs/workflows/start-task.md` references `docs/tasks/<NNN>-<slug>/brief.md` consistently.
- All other `Agent-kit/docs/workflows/*.md` and `Agent-kit/init/*.md` files have any remaining `BRIEF_<name>.md` references replaced with the canonical path.
- `docs/ROADMAP.md` parking lot lists Astro Starlight as a candidate.
- `docs/tasks/009-bundle-ts-rules-and-workflow/brief.md` is the brief on disk, committed as commit #1.

## Constraints

### Files in scope

| # | File | Change type |
|---|---|---|
| 1 | `docs/tasks/009-bundle-ts-rules-and-workflow/brief.md` | Pre-saved by user; verified + committed as commit #1 |
| 2 | `CLAUDE.md` | Add R20–R25 (after R19); rewrite E5; add header note to "Documented Exceptions" section |
| 3 | `Agent-kit/docs/prompts/task-brief-template.md` | Update header note in TEMPLATE PARA COPIAR; add step 6 to "Como usar manualmente"; add caminho B convention note |
| 4 | `Agent-kit/docs/workflows/start-task.md` | Update Pré-requisitos #3 path; update COPIAR block (2 spots) |
| 5 | `Agent-kit/docs/workflows/*.md` (other) | Sweep + replace `BRIEF_<name>.md` references |
| 6 | `Agent-kit/init/*.md` | Sweep + replace `BRIEF_<name>.md` references |
| 7 | `docs/ROADMAP.md` | Append one entry to `## Parking lot` |

### Out of scope

- Any application code (`main.js`, `psd-worker.js`, `preload.js`, `renderer/**`, `storage/**`, anything under `assets/`, anything under `automation/`). v1 is in freeze (MENTOR_BRIEF §2); v2 has no code yet.
- `package.json`, `package-lock.json`, `.gitignore`, `.githooks/`.
- `Agent-kit/docs/workflows/setup-code.md` patterns 1 ("plan always required") and 5 ("Co-authored-by trailer"). Both contradict canonical rules but are unrelated to caminho B and the new TS rules. Deferred to a separate brief (proposed: `agent-kit-cleanup`).
- Translating any pt-BR section of `task-brief-template.md`, `start-task.md`, or `Agent-kit/init/*.md` into English. R9 explicitly carves these out as human-edited interface.
- Reorganizing `CLAUDE.md` into v1 / v2 sections. R1–R19 remain in place; R20–R25 are appended.
- Adding TypeScript rules beyond R20–R25. Error handling, CLI library, file naming, branded types, and other refinements are deferred to Phase 2+ when context informs the decision (M-R8).
- Any `git push` (CLAUDE.md R17 / GIT_WORKFLOW.md G-R5).

### Conventions

- `CLAUDE.md` and `docs/ROADMAP.md` additions: **English** (R9 — agent-consumed surface).
- `Agent-kit/docs/prompts/task-brief-template.md` and `Agent-kit/docs/workflows/start-task.md` additions: **pt-BR** in surrounding prose (existing language of those files); the English block inside the `--- TEMPLATE PARA COPIAR ---` markers stays English.
- All commits follow Conventional Commits (CLAUDE.md R10, GIT_WORKFLOW.md G-R3); all commits in this brief use type `docs:`.
- No `Co-authored-by` trailer (GIT_WORKFLOW.md G-R3).
- Pre-commit hook is not bypassed with `--no-verify` (CLAUDE.md R13).

### Architectural decisions already made (do not revisit)

Closed in the design session (chat, 2026-05-16). Executor implements; does not propose alternatives.

- **D1 — Minimum viable TS ruleset.** R20–R25 only. Larger ruleset (error handling, CLI library, branded types, file naming, import order) deferred to Phase 2+ when contextualized.
- **D2 — Append, do not reorganize.** R20–R25 land after R19 in the same Hard Rules section. R1–R19 are not moved or restructured.
- **D3 — E5 rewrite + section header note are separate sub-edits but the same commit** (both belong to the "Documented Exceptions cleanup" theme).
- **D4 — Caminho B companion is `start-task.md`, not `setup-code.md`.** `setup-code.md` carries pre-flight only and does not receive briefs.
- **D5 — Pasteable prompt is the existing `start-task.md` COPIAR block with updated paths.** Not a separate minimal prompt; the workflow file remains the single source of truth for executor invocation.
- **D6 — Sweep scope is `Agent-kit/docs/workflows/**.md` (except `start-task.md`, already handled in Edit 4) and `Agent-kit/init/**.md`.** Other locations (e.g. `docs/`) are not swept. Existing briefs 000–008 are historical and left as-is.

---

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The user pre-saved this brief to `docs/tasks/009-bundle-ts-rules-and-workflow/brief.md` before invoking the executor (caminho B). The executor verifies presence and commits.

- [ ] Directory `docs/tasks/009-bundle-ts-rules-and-workflow/` exists
- [ ] File `docs/tasks/009-bundle-ts-rules-and-workflow/brief.md` exists; first line is `# Brief: 009 — TS rules, caminho B workflow, E5 reconcile, Starlight parking lot`
- [ ] `git add docs/tasks/009-bundle-ts-rules-and-workflow/brief.md` is staged
- [ ] Commit #1 created with subject `docs(tasks): add brief for 009-bundle-ts-rules-and-workflow`

If the file is missing or the first line does not match, **STOP and report**. Do not regenerate the brief from memory.

---

### Edit 2 — `CLAUDE.md`: add R20–R25

Insert the following six rules in `CLAUDE.md`, in order, **after the existing R19 entry and before the `## Anti-patterns` heading**. Keep R19 unchanged.

```markdown
**R20 — TypeScript strict mode (project-wide).** Every `tsconfig.json` in the v2 monorepo extends a base config with `"strict": true`. The directives `// @ts-ignore` and `// @ts-expect-error` are forbidden without a one-line comment explaining the reason and a TODO with date.

**R21 — ESM only; `.js` extension in imports.** All packages declare `"type": "module"` in `package.json`. Imports reference the compiled output name (e.g. `import { foo } from "./bar.js"` even when the source is `bar.ts`). This is a Node ESM requirement, not a stylistic choice.

**R22 — No bundler; `tsc` per package.** Each workspace compiles via `tsc -p .` into its own `dist/`. No esbuild, rollup, webpack, or similar. Bundling is a Phase 3+ packaging concern, not part of the core build chain.

**R23 — `node:test` for testing.** No jest, vitest, mocha, ava. Test files colocate with their source as `*.test.ts`. The exact runner integration (compile-and-test, `tsx` loader, or `--experimental-strip-types`) is fixed during Phase 1 bootstrap. Rationale: zero-dependency testing keeps the monorepo lean.

**R24 — No `any` type.** Use `unknown` for inputs requiring type narrowing. `any` is reserved for justified escape hatches and requires a one-line comment with the rationale.

**R25 — Hexagonal architecture: dependency direction.** The `core` package defines domain logic and port interfaces. Adapter packages (`adapter-jira`, `adapter-sheets`, future others) implement ports and depend on `core`. The `core` package never imports from adapters. The composition root (currently `cli`) wires adapters into `core`. Verification: `grep -rn 'from.*adapter' core/` returns no matches.
```

#### Verification

- [ ] R20–R25 are present in `CLAUDE.md`, in order, after R19
- [ ] No existing rule (R1–R19) is modified, moved, or renumbered
- [ ] Section structure (Hard Rules → Anti-patterns → Documented Exceptions) is preserved

Commit: `docs(claude): add v2 typescript rules R20-R25`

---

### Edit 3 — `CLAUDE.md`: reconcile E5 and add v1-freeze header note

Two sub-edits, same commit (both belong to "Documented Exceptions cleanup").

#### 3a. Rewrite E5

Locate the existing E5 entry in the `## Documented Exceptions` section. Find this exact block:

```markdown
**E5 — Dispatch tables not yet routed through registries (R19).** Format dispatch is hardcoded in `main.js`; the renderer is monolithic in `renderer/app.js`; file actions are ad-hoc. Migrations: brief 002 (`refactor/format-registry`), brief 004 (`refactor/renderer-views`), brief 005 (`refactor/action-registry`).
```

Replace with:

```markdown
**E5 — Dispatch tables in v1 codebase violate R19.** Format dispatch is hardcoded in `main.js`; the renderer is monolithic in `renderer/app.js`; file actions are ad-hoc. Originally scheduled migrations (`refactor/format-registry`, `refactor/renderer-views`, `refactor/action-registry` — slots 004-006) burned in v1→v2 pivot (`MENTOR_BRIEF.md` §2, recorded 2026-05-15). No new work against these violations during v1 freeze.
```

#### 3b. Add v1-freeze header note to `## Documented Exceptions`

Locate the `## Documented Exceptions` heading line. Immediately after this heading and before the first exception entry (E1), insert this paragraph followed by a blank line:

```markdown
**Note on v1 freeze:** all exceptions below apply to the Electron-v1 codebase, currently in freeze (`MENTOR_BRIEF.md` §2). No new work resolves them; they remain documented for historical context and any critical-bug-only v1 maintenance. New v2 exceptions, if needed, take fresh numbering starting at E6.
```

#### Verification (Edit 3)

- [ ] 3a: Old E5 block replaced with the new block
- [ ] 3b: Header note inserted between the `## Documented Exceptions` heading and E1
- [ ] No other exception entry (E1, E2, E3a, E3b, E4 if still present) is modified
- [ ] R19 unchanged

Commit (3a + 3b together): `docs(claude): reconcile E5 and add v1-freeze note in exceptions`

---

### Edit 4 — Caminho B in `task-brief-template.md` and `start-task.md`

Five sub-edits across two files. All five go in a single commit.

#### 4a. `Agent-kit/docs/prompts/task-brief-template.md` — header note in TEMPLATE PARA COPIAR

Inside the `## --- TEMPLATE PARA COPIAR ---` block, locate this exact text (the brief intro blockquote, in English):

```markdown
> Paste this brief into the executor agent (Claude Code, Cowork)
> at task start.
```

Replace with:

```markdown
> Save this brief to `docs/tasks/<NNN>-<slug>/brief.md`. Invoke
> the executor with the prompt in
> `Agent-kit/docs/workflows/start-task.md`.
```

#### 4b. `Agent-kit/docs/prompts/task-brief-template.md` — "Como usar manualmente" step 6

Locate the "Como usar manualmente" numbered list. After step 5 (`Comita o brief antes de iniciar a tarefa`), insert this new step 6:

```markdown
6. Iniciar a tarefa via `Agent-kit/docs/workflows/start-task.md`
   (cola o COPIAR block desse workflow no executor; o workflow
   aponta pro brief já no disco).
```

(Language: pt-BR, matching the surrounding section.)

#### 4c. `Agent-kit/docs/prompts/task-brief-template.md` — caminho B convention note

After the new step 6 (4b above) and before the next section heading in the file, insert this standalone paragraph (not a numbered step), preceded and followed by a blank line:

```markdown
> **Sobre o "Edit 1 — Save this brief":** briefs 009+ usam caminho B
> (usuário salva o brief no disco antes de invocar o executor). O
> stub "Edit 1 — Save this brief verbatim" foi descontinuado e
> substituído por "Edit 1 — Verify brief on disk and commit":
> executor confirma presença e faz `git add` + commit como commit
> #1. Briefs 000-008 usaram caminho A e ficam como estão no
> histórico.
```

(Language: pt-BR.)

#### 4d. `Agent-kit/docs/workflows/start-task.md` — Pré-requisitos #3

Locate the "Pré-requisitos" section. Find this exact line:

```
3. Salvado o brief na raiz do projeto (`BRIEF_<nome-curto>.md`)
```

Replace with:

```
3. Salvado o brief em `docs/tasks/<NNN>-<slug>/brief.md`
```

#### 4e. `Agent-kit/docs/workflows/start-task.md` — COPIAR block (2 spots)

Inside the `## --- COPIAR ---` block:

First, find this two-line opening:

```
Iniciando tarefa nova no projeto. Brief específico salvo em
BRIEF_[nome-da-tarefa].md.
```

Replace with:

```
Iniciando tarefa nova no projeto. Brief em
docs/tasks/<NNN>-<slug>/brief.md.
```

Second, in the same COPIAR block, find PASSO 1 bullet #4:

```
4. BRIEF_[nome-da-tarefa].md
```

Replace with:

```
4. docs/tasks/<NNN>-<slug>/brief.md
```

#### Verification (Edit 4)

- [ ] 4a: header note in TEMPLATE PARA COPIAR replaced
- [ ] 4b: step 6 added to "Como usar manualmente"
- [ ] 4c: caminho B convention note inserted as a standalone paragraph after step 6
- [ ] 4d: Pré-requisitos #3 path updated
- [ ] 4e: COPIAR block opening and PASSO 1.4 path updated (both spots)
- [ ] No other section of either file modified

Commit (all five sub-edits together): `docs(workflows): implement caminho B for brief invocation`

---

### Edit 5 — Sweep `Agent-kit/**` for stale `BRIEF_<name>.md` references

Run a search and replace across:

- `Agent-kit/docs/workflows/*.md` — **except** `start-task.md` (already handled in Edit 4)
- `Agent-kit/init/*.md`

For each occurrence of the pattern `BRIEF_<something>.md` (the old per-brief filename convention from before brief 000), replace it with the canonical `docs/tasks/<NNN>-<slug>/brief.md` pattern. Adapt the surrounding phrasing to read naturally in the new context.

**Examples** (illustrative; actual matches may differ):

- `Salva o brief como BRIEF_storage-layer.md na raiz` → `Salva o brief em docs/tasks/<NNN>-<slug>/brief.md`
- `Lê BRIEF_<nome>.md` → `Lê docs/tasks/<NNN>-<slug>/brief.md`

If a reference appears in prose discussing "the brief" generally (without the `BRIEF_<name>.md` filename pattern), it does not need a path change — only filename-pattern references require replacement.

**Stop and report** if:

- An occurrence has ambiguous context (e.g. the line is also stale for an unrelated reason).
- The file containing the match also has setup-code-style debt (patterns 1 or 5 — plan-always-required, or Co-authored-by trailer instructions). Those are explicitly out of scope; fix the path ref only and report the co-incident issue.

#### Verification (Edit 5)

- [ ] `grep -rn 'BRIEF_[A-Za-z0-9_-]*\.md' Agent-kit/` returns no matches
- [ ] List of files modified is reported in the commit body
- [ ] No file outside `Agent-kit/docs/workflows/` (except `start-task.md`, already handled) or `Agent-kit/init/` is touched

Commit: `docs(workflows): sweep agent-kit for stale BRIEF_<name>.md references`

---

### Edit 6 — `docs/ROADMAP.md`: parking lot entry

Locate the `## Parking lot` section. At the end of the existing bullet list (after the entry on "Source-of-truth split formalization for tasks"), append this single bullet:

```markdown
- **Docs site (Astro Starlight)** — post-Phase-1 tooling task; enters as a workspace, same npm/TS ecosystem as v2 monorepo.
```

The entry follows the file's update protocol: "Do not enrich parking-lot entries beyond a line until they are nominated for promotion."

#### Verification (Edit 6)

- [ ] One new bullet added at the end of `## Parking lot` list
- [ ] Existing bullets in the section are unchanged
- [ ] No other section of `ROADMAP.md` modified

Commit: `docs(roadmap): add astro starlight to parking lot`

---

## Pause points

- **Pause 1 (before any change):** **Skipped** — `Plan required: no` (see justification below).
- **Pause 2 (after the first modified file is fully changed):** **Required.** Recommended first modified file: `CLAUDE.md` after Edit 2 (R20–R25 inserted), so the user can confirm the rules are in the right place before the E5 work begins.
- **Pause 3 (before each commit):** **Required.** Six commits planned (Edits 1–6).

In case of:

- Unrelated bug or doc inconsistency found in a file being edited → report and ask. Do not fix.
- A swept file has both a stale `BRIEF_<name>.md` ref **and** a setup-code-style pattern-1/pattern-5 issue → fix only the path ref; leave the other untouched and report it for the deferred brief.
- `CLAUDE.md` E5 already updated (e.g. by a parallel session) → **STOP and report**.

---

## Plan required justification

`Plan required: no` because:

- Every change is specified above with exact text snippets, insertion points, and verification checkboxes.
- The only judgment call is the sweep (Edit 5), where the agent adapts phrasing in flow. Brief includes worked examples and a stop-and-report rule for ambiguous cases.
- There are no architectural choices left for the agent to design (all design decisions D1–D6 closed in the Constraints section).
- Subject lines, file paths, and edit anchors are explicit.

⚠️ **Pause 2 and Pause 3 remain required** — Lesson #6 of `AGENT_PLAYBOOK.md`.

---

## Git workflow

### Branch

```bash
git checkout main
git pull --ff-only origin main
git checkout -b docs/bundle-ts-rules-and-workflow
```

### Commit sequence

Six commits, in this order:

```
1. docs(tasks): add brief for 009-bundle-ts-rules-and-workflow
   — touches only docs/tasks/009-bundle-ts-rules-and-workflow/brief.md

2. docs(claude): add v2 typescript rules R20-R25
   — touches only CLAUDE.md

3. docs(claude): reconcile E5 and add v1-freeze note in exceptions
   — touches only CLAUDE.md

4. docs(workflows): implement caminho B for brief invocation
   — touches Agent-kit/docs/prompts/task-brief-template.md
     and Agent-kit/docs/workflows/start-task.md

5. docs(workflows): sweep agent-kit for stale BRIEF_<name>.md references
   — touches files identified by the sweep (list each in the commit body)

6. docs(roadmap): add astro starlight to parking lot
   — touches only docs/ROADMAP.md
```

All subject lines are ≤ 72 chars (R10).

### Push

**Do not push.** Push is the user's call (CLAUDE.md R17 / GIT_WORKFLOW.md G-R5). Stop after commit 6 and report.

---

## Output expected at the end of the session

A single message reporting:

1. Branch name and `git log --oneline main..HEAD` (should show 6 commits in the order above)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Result of the sweep verification: `grep -rn 'BRIEF_[A-Za-z0-9_-]*\.md' Agent-kit/` (expected: empty)
4. List of files modified by Edit 5
5. Any out-of-scope items encountered, with the reason they were paused per Pause 2 / Pause 3 protocol
6. Confirmation that no `git push` was run

---

## Reference documents (read before starting)

- `CLAUDE.md` — R9 (English on dev surface), R10 (Conventional Commits), R13 (no `--no-verify`), R17 (no proactive push)
- `docs/MENTOR_BRIEF.md` — §2 (v2 pivot context), §3 P4 (numbering protocol)
- `docs/GIT_WORKFLOW.md` — G-R3 (no co-author trailer), G-R5 (push is the user's call)
- `Agent-kit/docs/prompts/task-brief-template.md` — template being modified
- `Agent-kit/docs/workflows/start-task.md` — workflow being modified
