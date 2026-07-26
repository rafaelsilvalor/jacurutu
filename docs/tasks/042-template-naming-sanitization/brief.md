# Brief: 042 — Editable file naming convention and shared sanitizer

> **Category:** M
> **Plan required:** yes — see "Plan required justification" below
> **Branch:** `feat/template-naming-sanitization`

---

## Context

Brief 032 (P2) named the copied editable in `editaveis/` by reusing the leaf
folder stem (`<KEY>_<slug>` + source extension). Real usage in session 033
surfaced the owner's target format for the file itself:
`vertical_key_descricao[_variacao]` — e.g.
`ecj_mca-63821_informativo-893-avaliacao-de-titulos_carrossel.psd`. This brief
replaces the leaf-stem reuse with a purpose-built file name produced by a new
pure builder in `@saci/core`, and promotes the private `sanitizeSlug` in
`packages/core/src/derive-path.ts` to a shared core export so the leaf slug
and the file name use one sanitizer. The D-set below was ratified in the
Orchestrator session; encode as-is.

## Goal

Make both `saci start` routes (Jira-born and `--local`) name the copied
editable `vertical_key_descricao[_variacao]` + source extension, with the
variation supplied by a new optional `--variation <text>` flag, and with one
shared sanitizer exported from core feeding both the derivePath leaf slug and
the new file-name builder.

Out of scope:

- The leaf FOLDER name (`<KEY>_<slug>`) and every other `derivePath` segment —
  behavior unchanged (D5).
- The `.saci.json` manifest: `schemaVersion` stays 2; no `variation` field (D4).
- `slugNomeCurto` in `packages/core/src/transform.ts` — ported Python seed
  behavior serving the coordination payload; do not touch it (D6).
- Curated template files under the templates root — never renamed (D1).
- Mass-rename of previously scaffolded files/folders — moot, no production
  users, nothing versioned carries the old name (D7).
- `packages/cli/src/display.ts` — expected untouched (`renderStart` prints
  paths, not a name shape). If the plan requires touching it, **flag it at
  Pause 1**; do not silently expand scope.
- `docs/ROADMAP.md` and all other docs outside the task folder.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   `packages/core/src/file-name.ts` (new),
   `packages/core/src/file-name.test.ts` (new),
   `packages/core/src/derive-path.ts` (sanitizer import swap only),
   `packages/core/src/index.ts`,
   `packages/core/src/index.test.ts` (only if it enumerates exports),
   `packages/cli/src/argv.ts`, `packages/cli/src/argv.test.ts`,
   `packages/cli/src/run-start.ts`, `packages/cli/src/run-start.test.ts`,
   `packages/cli/src/cli.ts`, `packages/cli/src/cli.test.ts` (only if
   needed), and `docs/tasks/042-template-naming-sanitization/`. If anything
   else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md` (especially R3, R4, R7, R14 spirit for the
   sanitizer move, R20, R21, R23, R24, R25).
3. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - Branch: `feat/template-naming-sanitization` (already created from
     `main@345a366`)
   - Conventional Commits (G-R3); no `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
4. The new builder is pure core code: no I/O, no `path`, no clock (R25). It
   returns the stem only; the composition root appends the source extension
   via `path.extname`, as today.
5. The sanitizer promotion must not change `derivePath` output for any input:
   existing `derive-path.test.ts` cases pass unmodified.

### Conventions

- All code, comments, tests, and commit messages in English (R9).
- Commit scopes: `core`, `cli`. Types per R10.
- Module-top `SCREAMING_SNAKE_CASE` for any policy literal (R7).

### Architectural decisions already made (do not revisit)

#### D1 — Scope object: the copied editable only

Only the copied editable written into `editaveis/` by both start routes gets
the new name. Curated template files in the templates root are untouched
(catalog is parked). The leaf folder name does not change (D5).

#### D2 — Name format

All lowercase; `_` separates fields; `-` within fields; no date segment.
Stem = the non-empty segments below, in order, joined by `_`:

1. **vertical** — the parsed vertical code (derivePath `segments[1]`),
   lowercased: `ECJ` → `ecj`. The `UNKNOWN_VERTICAL` sentinel passes through
   as-is. Lowercase only — no sanitization (parallel to the folder segment).
2. **key** — the display key, lowercased: `MCA-63821` → `mca-63821`; local
   keys likewise (`RAF-1` → `raf-1`).
3. **descricao** — the sanitized summary/title slug, same sanitizer (and
   therefore same value) as the derivePath leaf slug. Empty after
   sanitization → segment omitted (defensive parallel to the empty-slug leaf
   fallback).
4. **variacao** — see D3; omitted when absent or empty. No trailing or
   doubled underscores ever.

The extension is appended from the source file by the composition root, as
today. `sanitizeSlug` never emits `_`, so `_` is an unambiguous field
separator.

#### D3 — `--variation <text>` flag on both routes

New optional `--variation <text>` flag on BOTH start routes (Jira-born and
`--local`), sanitized with the same shared sanitizer. Absent flag OR
empty-after-sanitization → segment omitted (no trailing underscore). The
parser stays format-agnostic (no validation of the value). On the `--blank`
path no file is copied, so `--variation` has no effect — accepted and
ignored, per the existing on-ramp tolerance (026 D-a2).

#### D4 — No manifest change

`schemaVersion` stays 2; no `variation` field; `buildManifest` inputs and
output are unchanged (the `slug` field remains leaf-derived; `template`
remains the source basename). The copied file's name diverging from the leaf
stem is intentional. Parked: a manifest `variation` field, if ever needed, is
a future schema decision.

#### D5 — derivePath untouched except the sanitizer's home

The leaf stays `<KEY>_<slug>` (uppercase key — the folder and the file
intentionally differ in case). `derivePath` behavior is unchanged; only the
sanitizer's module home and export status change.

#### D6 — Sanitization unification via a shared core export

Promote the private `sanitizeSlug` (`packages/core/src/derive-path.ts:131`)
to a public core export, consumed by both `derivePath`'s leaf and the new
pure file-name builder. Placement (planner-closed, delegated by the D-set):
new module `packages/core/src/file-name.ts` holding `sanitizeSlug`,
`SLUG_MAX_LEN` (moves with its only consumer), and the builder;
`derive-path.ts` imports `sanitizeSlug` from `./file-name.js`; `index.ts`
re-exports `SLUG_MAX_LEN` from its new home (public surface unchanged) and
adds the two new exports. `slugNomeCurto` in `transform.ts` is out of scope.

#### D7 — Mass-rename window: moot

No production users; nothing versioned carries the old name. Recorded here;
no rename edits anywhere.

## Done criteria

### Edit 1 — Verify brief on disk (commit #1, authored by planner)

The planner committed this brief as commit #1 on
`feat/template-naming-sanitization`. P4 numbering evidence recorded at
authoring time:

- `ls docs/tasks/` — highest existing slot: `041-brief-size-allowance`;
  gaps 004-006 (E5 burns) and 034 (recorded burn) are preserved.
- `git log --oneline origin/main` — tip `345a366 docs(sessions): add
  orchestrator recap for open-flag windows smoke (#99)`; no unmerged brief
  beyond 041.
- `CLAUDE.md` E* exceptions (E1, E2, E3, E5) reserve no slot at 042.

- [ ] File `docs/tasks/042-template-naming-sanitization/brief.md` exists;
      first line matches the title above
- [ ] Commit #1 subject is
      `docs(tasks): add brief for 042-template-naming-sanitization`

If the file is missing or the first line does not match, **STOP and report**.

### Edit 2 — Create `file-name.ts` in core; promote the sanitizer

Create `packages/core/src/file-name.ts` per D2/D6 with colocated
`file-name.test.ts`; swap `derive-path.ts` to import `sanitizeSlug` from the
new module (private copy deleted); update `index.ts` exports. Exact builder
name and input shape are proposed at Pause 1 (suggestion:
`buildEditableStem`).

Verification:

- [ ] Builder returns `ecj_mca-63821_informativo-893-avaliacao-de-titulos_carrossel`
      for vertical `ECJ`, key `MCA-63821`, summary
      `Informativo 893 - Avaliação de Títulos`, variation `Carrossel`
      (session-033 shape)
- [ ] No variation → no trailing underscore; variation sanitizing to empty
      (e.g. `"!!!"`) → segment omitted; empty descricao → omitted;
      `UNKNOWN_VERTICAL` passes through as-is
- [ ] `sanitizeSlug` and the builder are exported from
      `packages/core/src/index.ts`; `SLUG_MAX_LEN` still exported
- [ ] `derive-path.test.ts` passes unmodified (constraint 5)
- [ ] Builder has no I/O and no `path` import;
      `grep -rn 'from.*adapter' packages/core/` returns no matches (R25)

Commit: `feat(core): add editable file-name builder with shared sanitizer`

### Edit 3 — Wire `--variation` and the new name through the CLI

In `packages/cli/src/argv.ts`: add `variation` to `CLI_OPTIONS` /
`CliValues`, carry `variation?: string` on both the `start` and
`start-local` variants of `ParsedCommand`, and update `USAGE` to show
`[--variation <text>]` on both start lines. In
`packages/cli/src/run-start.ts`: name the copied editable with the core
builder (vertical from `segments[1]`, key = the display key, descricao from
`issue.summary` / `options.title`, variacao from the flag) + source
extension, replacing the leaf-stem reuse in `copyTemplate`; thread
`variation` through `runStart` and `StartLocalOptions`. In
`packages/cli/src/cli.ts`: pass `command.variation` through on both routes.
Update `argv.test.ts` and `run-start.test.ts` (`cli.test.ts` only if
needed). Exact threading (parameter vs. plan field) is proposed at Pause 1.

Verification:

- [ ] `parseArgv` yields the variation on both routes only when the flag is
      present; omitted flag → `undefined`; `USAGE` shows
      `[--variation <text>]` on both start lines
- [ ] `runStart`/`runStartLocal` tests assert the copied file is
      `<vertical>_<key>_<descricao>[_<variacao>]<ext>` (lowercase), not the
      leaf stem; with and without `--variation`
- [ ] Leaf folder name is unchanged (`<KEY>_<slug>`, uppercase key); manifest
      bytes are unchanged for the same inputs (D4/D5)
- [ ] `--blank` path: no file copied, `--variation` accepted and ignored (D3)

Commit: `feat(cli): wire --variation and editable file naming into start`

### Automated checks (run before each commit)

- [ ] `npm run build` passes (workspace `tsc -p .`)
- [ ] `npm test` passes (run manually — the pre-commit hook is not wired in
      this clone)

### Structural checks

- [ ] `packages/core/src/file-name.ts` and `file-name.test.ts` exist
- [ ] No file outside the constraint-1 list was modified
      (`git diff --name-only origin/main..HEAD`)

### Git checks

- [ ] Branch used: `feat/template-naming-sanitization`; subjects ≤ 72 chars;
      no `Co-authored-by` trailer; `git status` clean at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 1 — numbered plan presented and approved before any change
- [ ] Pause 2 — first modified file shown for review
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message +
      `pre-commit-self-audit` output before each commit
- [ ] Any unmet criterion reported explicitly

## Pause points

- **Pause 1 (before any code): required** (`Plan required: yes`).
- **Pause 2 (after the first modified file): required.**
- **Pause 3 (before each commit): required.**

Unrelated bug found → report and ask. Technical limitation → report.
Undocumented gotcha → report; document in `docs/GOTCHAS.md` as a follow-up
brief. **DO NOT proceed "fixing" things without permission.**

## Plan required justification

`Plan required: yes` — the D-set closes format, flag, and sanitizer home, but
exact placement is left open: the builder's name and input shape, how the
stem threads through `ScaffoldPlan`/`copyTemplate`, whether `runStart` grows
a positional parameter or an options object, and whether `index.test.ts` /
`cli.test.ts` need updates. The executor proposes these at Pause 1.

## Git workflow

### Branch

`feat/template-naming-sanitization`, created from `main@345a366`. No push
(G-R5).

### Commit sequence

1. `docs(tasks): add brief for 042-template-naming-sanitization`
2. `feat(core): add editable file-name builder with shared sanitizer`
3. `feat(cli): wire --variation and editable file naming into start`

## Reference documents (read before starting)

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — known traps
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6
5. `.claude/skills/pre-commit-self-audit/SKILL.md` — Pause 3 audit
6. `packages/core/src/derive-path.ts` — the sanitizer being promoted
7. `packages/cli/src/run-start.ts` — `copyTemplate` and the scaffold pipeline

## Expected output (end of session)

1. Branch name and `git log --oneline origin/main..HEAD`
2. `git diff --stat origin/main...HEAD`
3. Any unmet checkbox, with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step (open PR)
