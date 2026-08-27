---
paths: ["main.js", "psd-worker.js", "renderer/**", "automation/**"]
---

# Electron v1 — documented exceptions (E1, E2, E3, E5)

> These four entries left the root `CLAUDE.md` on 2026-08-27. They describe the
> **frozen** Electron-v1 codebase and were being read in every session, including
> the overwhelming majority that never open a v1 file. The `paths` frontmatter
> above loads them exactly when a v1 file is in play — which is the only moment
> their prohibitions apply.
>
> Nothing was reworded. `E6` and `E7` stayed in the root file: they are live
> v2 exceptions, not legacy debt.

**Note on v1 freeze:** these exceptions apply to the Electron-v1 codebase,
currently in freeze (`MENTOR_BRIEF.md` §2). No new work resolves them; they
remain documented for historical context and any critical-bug-only v1
maintenance. New v2 exceptions take fresh numbering.

**E1 — Renderer state in module globals (`renderer/app.js`).** The current renderer keeps state in module-level variables (`allGroups`, `activeGroupName`, `searchQuery`, `rootPath`). Tolerated until `refactor/renderer-into-modules`. New renderer code must not add to this pattern.

**E2 — `main.js` and `renderer/app.js` exceed R5 (400 lines).** Current sizes: `main.js` ≈ 456, `renderer/app.js` ≈ 329. Known debt, scheduled for `refactor/main-into-modules` and `refactor/renderer-into-modules`. Feature work is not blocked, but new code must not enlarge these files — extract into new modules instead.

**E3 — Existing pt-BR content predating R9.** Two legacy concerns, two separate migrations:

- **E3a — pt-BR comments and identifiers in source files** (`main.js`, `psd-worker.js`, `renderer/app.js`, etc.). Migration: `refactor/dev-surface-to-en` — translates comments, renames any pt-BR identifiers. Pure dev-surface refactor, no behavior change (R14).
- **E3b — pt-BR-only UI strings** in `renderer/index.html` and string literals in `renderer/app.js`. Migration: `feat/i18n-bilingual-ui` — introduces the i18n layer, extracts current pt-BR strings as the `pt-BR` locale, adds `en` translations.

Do not translate piecemeal during unrelated PRs.

**E5 — Dispatch tables in v1 codebase violate R19.** Format dispatch is hardcoded in `main.js`; the renderer is monolithic in `renderer/app.js`; file actions are ad-hoc. Originally scheduled migrations (`refactor/format-registry`, `refactor/renderer-views`, `refactor/action-registry` — slots 004-006) burned in v1→v2 pivot (`MENTOR_BRIEF.md` §2, recorded 2026-05-15). No new work against these violations during v1 freeze.
