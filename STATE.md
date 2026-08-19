# Task State

## Goal
Rename every live surface of the product from `saci` to `jacurutu`, leaving the
historical record (`docs/tasks/**`, `docs/sessions/**`, `automation/`, git
history) untouched. Implements `docs/tasks/2026-08-17-product-rename/brief.md`.

## Status
in-progress

## Last update
2026-08-19, Windows 11 Pro 10.0.26200, worktree
`.claude/worktrees/jovial-hofstadter-a30541`

## Done so far
- [x] Base verified: `origin/main` = `73ca7fe`; branch `refactor/product-rename`
      cut from that SHA
- [x] `npm install` run at the worktree root, so `@saci/*` resolves locally and
      not to the main checkout (`docs/GOTCHAS.md` G-NODE-2). No tracked change,
      `package-lock.json` untouched
- [x] Baseline green measured before any edit: `npx tsc -b` exit 0;
      `npm test` 377 (376 pass, 1 skipped) + 112, 0 fail
- [x] Live surface measured at `73ca7fe`: 1322 total, 972 record, **350 live**
      across 325 lines in 77 files. The brief measured 335 live at `5ffbede`;
      the whole delta is `docs/explorations/product-rename.md` growing from 7 to
      18 lines, and that file is preserved
- [x] Pause 1 approved, including the five judgment decisions below

## Next steps
- [ ] Edit 2 — `refactor(packages): rename the package scope to jacurutu`
- [ ] Edit 3 — `feat(cli): migrate the runtime surfaces to the jacurutu names`
- [ ] Edit 4 — `docs: rename the product to jacurutu across the canonical docs`
- [ ] Delete this file at close; **no `git push`** (G-R5)

## Blockers (if status = blocked)
None.

## Notes for next session

### Edit 5 is the owner's, and it is still outstanding
The executor never runs these. Until they run, a `jacurutu` build cannot find
its credentials:

```
mv ~/.saci ~/.jacurutu
re-export the five JACURUTU_* variables in the shell profile
gh repo rename jacurutu          # then update the local remote
mv D:/Projects/saci D:/Projects/jacurutu
git worktree repair              # absolute paths break on the directory move
```

### The 59 lines that keep `saci` on purpose (D4, approved at Pause 1)
`main.js:161`; `renderer/index.html:6,13,25` (both outside the brief's
modifiable paths) · `package.json:36,37` (`appId`, `productName` — v1 packaging
identity; `productName` decides `%APPDATA%\Saci`, so changing it would orphan
the frozen v1 config and thumb-cache) · `docs/explorations/product-rename.md`
(all 18 — the rename is its subject) · `docs/ROADMAP.md:41,47,76` (inside
`## Identity shifts`) · `docs/GOTCHAS.md:150` (`%APPDATA%\Saci\thumb-cache`, a
real path that does not move) · `.claude/hooks/lib/architecture.test.mjs` (all
8 — `architecture.mjs` carries zero `saci`, so the pinned code did not change) ·
`.claude/hooks/lib/gate-yield.test.mjs:38` (tmpdir prefix) ·
`.claude/hooks/lib/telemetry.test.mjs` (all 10 — tmpdir prefixes, shim markers,
synthetic `repoRelative` paths) · `docs/explorations/dev-queue-board.md:74,88,
90,99,100,119,126` (external facts: the free Jira key, the board's seed name,
the Notion `SACI-n` Ref prefix, the live card titles) ·
`docs/explorations/task-manifest-format.md:11` (a block its own header declares
preserved verbatim) · `README.md:39,53,63,64` (v1 artifact names, true while
`productName` stays).

### Two exceptions inside preserved files
`gate-yield.test.mjs:294` **does** change: it passes `SACI_TELEMETRY_DIR`, which
`telemetry.mjs:28` declares and Edit 3 renames. It is the only hook fixture
whose subject code moves. And 11 of the 12 `docs/GOTCHAS.md` occurrences change,
not 1 — `G-NODE-2` names the live `@saci/*` scope, four cite
`~/.saci/token.json`, one is `saci report`; only line 150 is a frozen path.

### Judgment calls that go beyond substitution
- `README.md` needed **new prose**, not a rename: the "Por que 'Saci'?" and
  "Origem do nome" sections were built on the Saci-Pererê folklore, which does
  not transfer to an owl. The replacement etymology was approved at Pause 1.
- `docs/GIT_WORKFLOW.md:170` points at `github.com/rafaelsilvalor/saci`. It is
  renamed here, which makes it false until the owner runs `gh repo rename`. The
  other choice would have been false afterwards instead.
- `docs/explorations/task-manifest-format.md` keeps its verbatim block and
  gains a dated Changelog line recording the new filename.
- `SPREADSHEET_NAME_TEMPLATE` (`Saci report: {profile}`) sits in Edit 3, not
  Edit 2, because it changes the title of newly created spreadsheets. Existing
  reports are found by id in `~/.jacurutu/report.json`, so none break.
- The `argv.ts` usage text moves with the `bin` in Edit 2: it prints the
  command's own name, and the `bin` rename in that same commit is the larger
  behavior change of the two.
- `SACI_CORE_PHASE` is renamed in Edit 2 — it is exported from
  `packages/core/src/index.ts` and has **zero** importers in current code.

### Observation, not acted on
`docs/explorations/product-rename.md` still reads
`Disposition: promoted to brief`. Edit 4 does not ask for a disposition update
and none was invented; if the `docs/explorations/README.md` contract requires
marking it implemented, that is a follow-up brief.
