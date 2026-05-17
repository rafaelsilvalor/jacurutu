# Brief: 003 — Add product roadmap and refine project identity
> **Category:** L (4 files modified, 1 file deleted/rewritten conditionally; mechanical doc edits with one narrative section)
> **Plan required:** No — see "Plan required justification" below
> **Branch:** `docs/roadmap-and-identity`
>
> Paste this brief into Claude Code at session start. **First action: save this brief verbatim as `docs/tasks/003-roadmap-and-identity/brief.md`** (creating the directory). All subsequent edits proceed from there.
---
## Context
A mentoring chat session on 2026-05-10 produced two deliverables that need to be wired into the canonical documentation:
1. **`docs/ROADMAP.md`** — a living product roadmap covering five phases (storage foundation → registries → command palette → multi-source abstraction → production workflow), with parking lot, pending decisions, and a deliberate identity statement (Saci shifts from **asset browser** to **workflow orchestrator** centered on tasks). The user already saved this file at its destination during the session.
2. **Refined project identity** — a Saci-folklore framing for the project name (Saci as the figure who *hides bureaucracy*, not files), to be reflected in the README's tagline and a new "Por que 'Saci'?" section.
This brief consolidates both into the canonical docs and reconciles them with the existing surfaces (`CLAUDE.md` Related Documents, `MENTOR_BRIEF.md` §2 and §7). It also handles the pending session handoff (`STATE.md` at repo root, currently describing the post-brief-002 state).
This brief is **the new brief 003**. The previously-anticipated "brief 003 = format-registry" (per `CLAUDE.md` E5 and `STATE.md` "Next task") shifts to **brief 004**. The mismatch in `CLAUDE.md` E5 is acknowledged debt; fixing it is out of scope for this brief (see "Out of scope").
No code is touched.
## Goal
After this task:
- `docs/ROADMAP.md` exists at its expected location and matches the version delivered in the chat session of 2026-05-10.
- `CLAUDE.md` Related Documents lists `docs/ROADMAP.md`.
- `docs/MENTOR_BRIEF.md` §2 references the new roadmap and records the source-of-truth split for tasks (Jira metadata / Saci production state) as an active decision. §7 lists `docs/ROADMAP.md` in its Related Documents table.
- `README.md` has an updated tagline, a new "Por que 'Saci'?" section, and a Roadmap section that defers to `docs/ROADMAP.md` instead of listing items inline.
- `STATE.md` at the repo root is removed (its content is fully captured by the merge log and the new roadmap).
- `docs/tasks/003-roadmap-and-identity/brief.md` exists, containing this brief verbatim.
## Constraints
### Files in scope
| # | File | Change type |
|---|---|---|
| 1 | `docs/tasks/003-roadmap-and-identity/brief.md` | New (this brief, saved verbatim) |
| 2 | `docs/ROADMAP.md` | **Verify exists** at this path with expected content (the user saved it in the chat session). If absent, **STOP and report** — do not regenerate from memory. |
| 3 | `CLAUDE.md` | Add one entry to "Related Documents" list |
| 4 | `docs/MENTOR_BRIEF.md` | Augment §2 (new bullet recording the identity shift + source-of-truth decision); add one row to §7 table |
| 5 | `README.md` | Replace tagline; add "Por que 'Saci'?" section; replace inline Roadmap section with deferral to `docs/ROADMAP.md` |
| 6 | `STATE.md` (repo root) | Delete |
### Out of scope
- **`README.md` translation to English.** R9 lists `README.md` as agent-consumed surface, but the file is currently pt-BR (pre-existing debt). New content added in this brief follows the existing language (pt-BR) for consistency, which violates A6 only on paper — the file is *uniformly* pt-BR. Translation is its own brief (`docs/readme-to-en` or similar). Add an explicit exception (e.g. **E6**) only if the user requests it; this brief does not introduce one.
- **`CLAUDE.md` E2 update.** E2 currently states `main.js ≈ 456`. After brief 002 it is 400 lines. This is unrelated to roadmap/identity work and should be cleaned in a separate small docs PR.
- **`CLAUDE.md` E5 numbering correction.** E5 references "brief 002 (`refactor/format-registry`), brief 004 (`refactor/renderer-views`), brief 005 (`refactor/action-registry`)" — wrong even before this brief (brief 002 was used by storage-layer). Correct numbering depends on the order chosen for the registry refactors. Out of scope here; fix in a separate small docs PR (`docs(claude): clean up E2 and E5 after brief 002`) before authoring brief 004.
- Any application code (`main.js`, `psd-worker.js`, `preload.js`, `renderer/**`, `storage/**`, anything under `assets/`).
- Any change to `package.json`, `package-lock.json`, `.gitignore`, `.githooks/`.
- Any rule, anti-pattern, or exception added/removed in `CLAUDE.md` beyond the Related Documents list (no new R, A, or E entries).
- Any change to `harness/**` files.
- Any change to existing prose in `docs/MENTOR_BRIEF.md` sections other than §2 and §7.
- Any `git push` (CLAUDE.md R17 / G-R5).
### Conventions
- `docs/ROADMAP.md`, `CLAUDE.md`, `docs/MENTOR_BRIEF.md` additions: **English** (R9 — `docs/**` and `CLAUDE.md` are agent-consumed surface).
- `README.md` additions: **pt-BR**, matching the file's existing language. R9-debt acknowledged in "Out of scope" above. Use proper Portuguese typography (em-dashes `—`, smart quotes when natural).
- Conventional Commits (R10, G-R3); type for all commits here is `docs:`.
- No `Co-authored-by` trailer (G-R3).
- No `--no-verify` (G-R8); pre-commit hook still not installed.
- File size budget R5 applies (none of these files approach the limit).
### Architectural decisions already made (do not revisit)
#### D1 — Identity shift recorded in `docs/ROADMAP.md` is canonical
Saci's stated identity is now: **workflow orchestrator with the asset browser as one view**, not standalone asset browser. The agent does not propose alternative framings, soften the statement, or hedge. The roadmap doc was reviewed and approved in the chat session; this brief propagates it to the README and MENTOR_BRIEF.
#### D2 — Source-of-truth split for tasks is adopted
Jira is the source of truth for **task metadata** (title, copy, deadline, assignee). Saci is the source of truth for **production state** (local folder path, files generated, upload status, local task state). This was pending decision #6 in `docs/ROADMAP.md` and is hereby promoted to adopted, recorded in `MENTOR_BRIEF.md` §2.
#### D3 — README stays pt-BR for now
The file is pre-existing pt-BR. R9 inclusion of `README.md` as agent-consumed is acknowledged debt, but mixing languages within the file (A6) is worse than uniform pt-BR. The migration to English is its own brief.
#### D4 — `STATE.md` is deleted at task close
The current `STATE.md` describes the post-brief-002 state. After this brief merges, that handoff is obsolete and the merge log + `docs/ROADMAP.md` capture everything needed for the next session. A fresh `STATE.md` will be created if and when a multi-session task starts (per `GIT_WORKFLOW.md` "STATE.md (long tasks)").
#### D5 — This brief is number 003
The brief at `docs/tasks/003-roadmap-and-identity/brief.md`. Format-registry, previously anticipated as brief 003, shifts to brief 004 when authored. `CLAUDE.md` E5's numbering is wrong regardless and is left for a separate cleanup PR (see "Out of scope").
---
## Done criteria
### Edit 1 — Save this brief
Create directory `docs/tasks/003-roadmap-and-identity/` and save this brief verbatim as `brief.md`.
- [ ] Directory `docs/tasks/003-roadmap-and-identity/` exists
- [ ] `docs/tasks/003-roadmap-and-identity/brief.md` matches the brief content the agent received (no edits, no formatting drift)
### Edit 2 — Verify `docs/ROADMAP.md` is in place
The user saved this file at `docs/ROADMAP.md` during the chat session of 2026-05-10. Verify:
- [ ] `docs/ROADMAP.md` exists
- [ ] First line of the file is `# Saci — Product Roadmap`
- [ ] File contains a "## Phases" section with five phases (storage foundation, registries, command palette, multi-source, production workflow)
- [ ] File contains a "## Parking lot" section
- [ ] File contains a "## Pending decisions" section listing at least 8 items
- [ ] File contains a "## Update protocol" section
- [ ] File contains a "## References" section
If any of the above is missing, **STOP and report** — do not regenerate the file from memory. The user has the source-of-truth version from the chat session and can re-save it.
### Edit 3 — `CLAUDE.md`: Related Documents entry
Locate the "Related Documents" list (near the end of the file). Add one entry in a sensible position with the existing `docs/` entries. Insert exactly:
```markdown
- `docs/ROADMAP.md` — product roadmap (phases, milestones, parking lot, pending decisions); ages in sync with `MENTOR_BRIEF.md` §2
```
- [ ] One new entry added under Related Documents
- [ ] No other section of `CLAUDE.md` modified
- [ ] No rule, anti-pattern, or exception added or removed
- [ ] Existing entries in Related Documents kept in their existing order; the new entry inserted where it reads naturally among the `docs/` group
### Edit 4 — `docs/MENTOR_BRIEF.md`: §2 and §7
#### 4a. Append a new bullet to §2 ("Where we are in the project"), inserted immediately before the `> ⚠️ This section ages fast.` blockquote
Insert exactly:
```markdown
- **Active product direction (recorded 2026-05-10 — refresh as it evolves):**
  - **Identity shift:** Saci is moving from standalone asset browser to **workflow orchestrator** centered on tasks (Jira → local production → Drive → close). The asset browser remains one view within the new shape. Full roadmap with phases, milestones, parking lot, and pending decisions: `docs/ROADMAP.md`.
  - **Source-of-truth split for tasks (adopted):** Jira is the source of truth for task **metadata** (title, copy, deadline, assignee). Saci is the source of truth for **production state** (local folder path, files generated, upload status, local task state). When they diverge: Jira wins for metadata, Saci wins for production state.
  - **Cowork-as-Jira-bridge:** the Jira read path enters Saci through Cowork-produced CSV/JSON imports rather than a direct Jira API client. Direct Jira integration stays parked unless the bridge proves insufficient.
```
- [ ] New bullet inserted immediately before the `> ⚠️ This section ages fast.` blockquote
- [ ] Existing bullets in §2 are byte-identical to before (no reordering, no rewording)
- [ ] The three sub-bullets (identity, source-of-truth, Cowork-bridge) are present in that order
#### 4b. Update §7 ("Related documents") table
Add one row to the existing table. Insert in a sensible spot — keep `docs/` entries grouped. The new row:
```markdown
| `docs/ROADMAP.md` | Both — product roadmap (phases, milestones, parking lot, pending decisions) |
```
- [ ] One new row added to the §7 table
- [ ] Existing rows are byte-identical to before (no reordering of the rest)
- [ ] Other sections of `MENTOR_BRIEF.md` (§1, §3, §4, §5, §6, §8) byte-identical to before
### Edit 5 — `README.md`: tagline, identity section, roadmap deferral
The current `README.md` is pt-BR (per D3 in this brief). All additions below are pt-BR.
#### 5a. Replace the tagline
Find the existing tagline block (a single blockquote immediately under the project description paragraph):
```markdown
> *"O Saci do designer — encontra seus arquivos antes de você lembrar onde guardou."*
```
Replace with:
```markdown
> *"O Saci esconde a burocracia. Você cuida da arte."*
```
If the user prefers a different tagline among the alternatives listed in the chat session (`"Quando a burocracia some, a arte aparece."` or `"O Saci do design — esconde o caminho, mostra o trabalho."`), use that one instead. The agent should ask once at Pause 2 if uncertain.
- [ ] Old tagline blockquote replaced with the new one
- [ ] Blockquote formatting preserved (italics inside quotes inside `> `)
#### 5b. Add a new "Por que 'Saci'?" section
Insert this section **immediately after the tagline blockquote** and **before** the current "## Funcionalidades atuais" section. Insert exactly:
```markdown
## Por que "Saci"?
O Saci-Pererê — figura travessa do folclore brasileiro de uma perna só, gorro vermelho e cachimbo — é famoso por esconder coisas. Chaves, dedais, ferramentas: o que você precisa, o Saci esconde. É uma travessura, não maldade — e por trás dela há um conhecimento profundo (na lenda, o Saci é guardião das ervas medicinais; decide o que se mostra e o que se guarda).
Aqui a metáfora se inverte: o Saci esconde a **burocracia**, não o trabalho. Caminhos de pasta, convenções de nome, links entre Jira e Drive, transições de status, uploads — tudo que separa "vou criar uma arte" de "a arte está entregue" desaparece dentro do redemoinho. O designer vê a tarefa e o arquivo; a infraestrutura some.
É a mesma força do personagem, mirando o alvo certo.
```
- [ ] Section header is `## Por que "Saci"?` (exact, including the smart-quoted "Saci")
- [ ] Section inserted between the tagline blockquote and the "## Funcionalidades atuais" heading
- [ ] No other section of `README.md` is modified by this edit
#### 5c. Replace the inline Roadmap section with a deferral
Find the existing `## Roadmap` section. It currently lists items inline (PSD diagnostics, production mode, mass audit, favorites, etc., with some numbering drift in the existing file). Replace the **entire** `## Roadmap` section (from the `## Roadmap` heading through to the next `##` heading, **exclusive of** that next heading) with:
```markdown
## Roadmap
Visão completa, fases e milestones: [`docs/ROADMAP.md`](docs/ROADMAP.md).
Resumo: o projeto está em transição de **navegador de assets** para **orquestrador de workflow** centrado em tasks (Jira → produção local → Drive → fechar task). A fundação (storage layer, registries, command palette, multi-source) precede as features de produção (M5.1 — tasks com import + cards; M5.2-5.5 — export, upload, fechar task). Os itens antes listados aqui (diagnóstico de PSD, auditoria em massa, favoritos) ficam preservados no parking lot do roadmap canônico.
```
- [ ] Old `## Roadmap` section fully replaced
- [ ] The replacement is exactly the markdown block above (header included)
- [ ] Sections before and after the Roadmap section (`## Arquitetura`, `## Como rodar em desenvolvimento`, etc.) are byte-identical to before
- [ ] The link to `docs/ROADMAP.md` uses relative path (works on GitHub)
### Edit 6 — Delete `STATE.md` (repo root)
Per D4 in this brief.
- [ ] `STATE.md` at the repo root no longer exists
- [ ] Committed with `docs(state): remove handoff after brief 002 closed; ROADMAP.md now covers next-task context`
- [ ] No reference to `STATE.md` content moved into other files (the merge log + ROADMAP.md already cover everything in it)
---
## Pause points
- **Pause 1 (before any change):** **Skipped** — `Plan required: no` (see justification below).
- **Pause 2 (after the first modified file):** **Required.** Suggest making the first file `docs/tasks/003-roadmap-and-identity/brief.md` (Edit 1), so the user can confirm the brief itself was saved cleanly before propagating to other files.
- **Pause 3 (before each commit):** **Required.** Six commits planned (see Git workflow below).
In case of:
- Unrelated bug or doc inconsistency found → report and ask. Do not fix.
- `docs/ROADMAP.md` missing or mismatched → STOP and report. The user has the source-of-truth version.
- README's existing Roadmap section having a different structure than expected → show the actual structure at Pause 2 and confirm the replacement strategy.
---
## Plan required
**No.**
Justification: every change is specified above with exact text snippets, insertion points, and verification checkboxes. The only judgment call is the README tagline choice (5a), which is handled by deferring to the user at Pause 2. There are no implementation decisions for the agent to design.
---
## Git workflow
### Branch
```bash
git checkout main
git pull --ff-only origin main
git checkout -b docs/roadmap-and-identity
```
### Commit sequence
Six commits, in this order. Each is a single thematic change.
```
1. docs(tasks): add brief for 003-roadmap-and-identity
   — touches only docs/tasks/003-roadmap-and-identity/brief.md (new file)
2. docs(claude): reference docs/ROADMAP.md in Related Documents
   — touches only CLAUDE.md (single new bullet in Related Documents)
3. docs(mentor): record identity shift and source-of-truth decision; reference roadmap
   — touches only docs/MENTOR_BRIEF.md (§2 augmentation + §7 row)
4. docs(readme): refresh tagline and add "Por que 'Saci'?" section
   — touches only README.md (5a + 5b above); does not touch the Roadmap section yet
5. docs(readme): defer Roadmap section to docs/ROADMAP.md
   — touches only README.md (5c above); split from commit 4 to keep narrative and structural changes separate
6. docs(state): remove handoff after brief 002 closed
   — touches only STATE.md (deletion)
```
Edit 2 (verify `docs/ROADMAP.md`) produces no commit — it is a verification step, not a change. If the file is missing, **STOP**; do not try to recreate it.
### Push
**Do not push.** The user authorizes push explicitly per `GIT_WORKFLOW.md` G-R5 / `CLAUDE.md` R17. Stop after the sixth commit and report.
---
## Output expected at the end of the session
A single message reporting:
1. Branch name and `git log --oneline main..HEAD` (should show 6 commits)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. Confirmation that `docs/ROADMAP.md` was verified (Edit 2), with the result of the structural check
4. Which tagline option was used in Edit 5a (the default or one of the alternatives, per user response at Pause 2)
5. Any verification checkbox from this brief that **could not** be met, with explanation
6. Confirmation that no `git push` was executed
7. Suggested next step:
   - Open PR on GitHub against `main` using the PR template
   - Once merged, author a small follow-up brief (or single-PR docs change) to fix `CLAUDE.md` E2 (line count) and E5 (numbering)
   - Then proceed to brief 004 (format-registry — first surface of R19), authoring via `harness/init/07-create-brief.md`
---
## References (read before starting)
In priority order:
1. `CLAUDE.md` — all technical rules (especially R9 — language convention; R10, R13, R17 for git discipline; A6 — language mixing). Related Documents list is what Edit 3 modifies.
2. `docs/MENTOR_BRIEF.md` — §2 and §7 are the targets of Edit 4. Read the full file to confirm structural expectations before editing.
3. `docs/ROADMAP.md` — read it (Edit 2 verification). Understanding the identity shift it states helps the agent confirm the propagation in MENTOR_BRIEF and README is faithful.
4. `README.md` — Edit 5 target. Read the current structure first so the replacements land in the right positions.
5. `docs/GIT_WORKFLOW.md` — operational discipline (G-R3, G-R5, G-R8, PR template).
6. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points, drift signals); Lessons #4 and #6.
7. `STATE.md` (repo root) — Edit 6 deletes it. Read it once to confirm its content is fully covered by the merge log and `docs/ROADMAP.md` before deletion.
If anything in the references contradicts a specific instruction in this brief, **stop and report** rather than choosing a side.
