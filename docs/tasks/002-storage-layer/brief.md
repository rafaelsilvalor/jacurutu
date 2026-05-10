# Brief: 002 — Storage layer refactor

> **Category:** L (refactor across `main.js` + 5 new files in a new directory; multi-step, behavior-preserving)
> **Plan required:** Yes — see "Plan required justification" below
> **Branch:** `refactor/storage-layer`
>
> Paste this brief into Claude Code at session start. **First action: save this brief verbatim as `docs/tasks/002-storage-layer/brief.md`** (creating the directory). All subsequent edits proceed from there.

---

## Context

`CLAUDE.md` R18 declares: *"Persistent application state goes through the `storage/` module."* E4 documents that the current code violates this — `main.js` and `psd-worker.js` use direct `fs.*` for `config.json` and `thumb-cache/<sha1>.jpg`. This brief implements the missing layer and routes the existing call sites through it. After merge, R18 holds and E4 is removed.

This is the first **code** brief for Saci. R14 ("`refactor:` means no behavior change") applies strictly: every byte of disk state, every cache key, every error path must remain functionally identical to before this PR. The user-visible behavior of opening Saci, picking a folder, browsing thumbnails, and clearing the cache must be indistinguishable.

The work prepares ground for the hybrid persistence (`storage/sqlite-catalog`, `storage/api-catalog`, `storage/api-annotations`) planned for ~6 months out (`MENTOR_BRIEF.md` §2). Today the only backend is file-based; the seam is what matters.

## Goal

After this task:

- A new `storage/` module exists with two domains (`config`, `thumb-cache`), each with a public interface and a single file-based implementation behind it.
- `main.js` no longer calls `fs.*` for config or thumb-cache concerns; all such state goes through `storage.config.*` or `storage.thumbCache.*`.
- `CLAUDE.md` E4 is removed (R18 is now satisfied).
- `main.js` line count drops by ~30–40 lines (helpers moved to `storage/`).
- Behavior is byte-identical to `main` before this branch: same disk paths, same cache keys, same error semantics, same `CACHE_VERSION` (4).

`psd-worker.js` is not touched. It does not handle config or thumb-cache persistence directly — it processes image buffers in worker threads.

## Constraints

### Files in scope

| # | File | Change type |
|---|---|---|
| 1 | `docs/tasks/002-storage-layer/brief.md` | New (this brief, verbatim) |
| 2 | `storage/index.js` | New — facade exposing `config` and `thumbCache` |
| 3 | `storage/config/index.js` | New — public interface for config domain |
| 4 | `storage/config/file.js` | New — file-based implementation (current logic, moved) |
| 5 | `storage/thumb-cache/index.js` | New — public interface for thumb-cache domain |
| 6 | `storage/thumb-cache/fs.js` | New — fs-based implementation (current logic, moved) |
| 7 | `main.js` | Modify — replace direct `fs.*` for config/thumbs with `storage.*` calls; delete moved helpers; add `require('./storage')` |
| 8 | `CLAUDE.md` | Modify — delete E4 |

### Out of scope

- `psd-worker.js` (does not handle persistence)
- `preload.js`, `renderer/**` (renderer talks to main via IPC; nothing changes from its perspective)
- `extractPsdThumbnailJpeg` and the PSD binary parser (reads PSD content, not persistence — different concern, will move when format registry brief 003 happens)
- `PsdWorkerPool` and worker-thread orchestration (not persistence)
- `bufferToDataUrl` helper (utility used in IPC responses; stays in `main.js`)
- IPC handler structure (handlers stay in `main.js`; only the bodies that touch persistence change)
- Adding tests (no test infrastructure yet; tests come in a separate brief — frente 3)
- Bumping `CACHE_VERSION` — explicitly forbidden (A7); the constant moves with its current value (4) and no semantic change
- Translating other pt-BR comments or identifiers in `main.js` outside the moved code (E3a is its own task)
- Touching E5 in `CLAUDE.md` (about dispatch registries — different debt, brief 003 territory)
- Removing or updating `E2` in `CLAUDE.md` (which lists `main.js ≈ 456` as legacy debt). Even if `main.js` line count drops below 400 after this brief, E2 stays — clarifying it is a separate `docs:` task
- Renumbering or moving any other rule, anti-pattern, or exception in `CLAUDE.md`
- Any `git push`

### Conventions

- All new code in English (R9 — `storage/` is agent-consumed code surface)
- All `console.error` / `console.warn` messages in the new files are **English** (R9 — log/console messages are agent-consumed). Translate the equivalent pt-BR messages from the current `loadConfig` / `saveConfig` when moving them. This is consistent with R9; it does not violate R14 because log strings do not change observable user behavior.
- Conventional Commits (R10, G-R3); type for code commits in this brief is `refactor:` (G-R3 / R14 — no behavior change), except for the brief save (`docs(tasks):`) and the E4 removal (`docs(claude):`)
- No `Co-authored-by` trailer (G-R3)
- No `--no-verify` (G-R8); pre-commit hook is still not installed at the time of writing — will be exercised once it lands
- File size budget R5 applies — every new file should sit comfortably under 400 lines (largest predicted is `thumb-cache/fs.js`, < 100 lines)
- Function size budget R6 (≤ 50 lines) applies — preserve current decomposition where possible

---

## Done criteria

### Edit 1 — Save this brief

Create directory `docs/tasks/002-storage-layer/` and save this brief verbatim as `brief.md`.

- [ ] Directory exists
- [ ] `docs/tasks/002-storage-layer/brief.md` matches the brief content received

### Edit 2 — Introduce `storage/` module (5 new files)

Create the directory `storage/` at the repo root, with the structure:

```
storage/
  index.js
  config/
    index.js
    file.js
  thumb-cache/
    index.js
    fs.js
```

#### 2a. `storage/index.js` (facade)

Aggregates the two domains. The only thing `main.js` needs to know about.

Exports:
- `config` — re-export of `storage/config/index.js`
- `thumbCache` — re-export of `storage/thumb-cache/index.js`

```js
// storage/index.js
module.exports = {
  config: require('./config'),
  thumbCache: require('./thumb-cache'),
};
```

#### 2b. `storage/config/index.js` (public interface for config)

For the current single backend, this re-exports the file-based impl. When a second backend appears, this file owns the selection.

```js
// storage/config/index.js
module.exports = require('./file');
```

The public surface this exposes (must match what `file.js` exports):
- `get()` — returns the loaded config object; on read error or missing file, returns `{ rootPath: null }` (preserves current `loadConfig` semantics)
- `set(cfg)` — persists; returns `true` on success, `false` on failure (preserves current `saveConfig` semantics)

#### 2c. `storage/config/file.js` (file-based config impl)

Move the current `loadConfig` / `saveConfig` / `getConfigPath` logic from `main.js` here. Translate the two pt-BR `console.error` strings to English while moving (R9 — log messages are agent-consumed).

Required exports (the public interface):
- `get()` — equivalent to current `loadConfig()`
- `set(cfg)` — equivalent to current `saveConfig(cfg)`

Internal helpers (not exported):
- A function returning the absolute path to `config.json` under `app.getPath('userData')` — equivalent to current `getConfigPath()`

Behavior preservation:
- Same path: `path.join(app.getPath('userData'), 'config.json')`
- Same JSON formatting on write: `JSON.stringify(cfg, null, 2)` with `'utf-8'` encoding
- Same fallback shape on missing/unreadable file: `{ rootPath: null }`
- `console.error` messages in English equivalent to the pt-BR originals (e.g. "Error reading config:", "Error saving config:")

#### 2d. `storage/thumb-cache/index.js` (public interface for thumb-cache)

```js
// storage/thumb-cache/index.js
module.exports = require('./fs');
```

The public surface this exposes (must match what `fs.js` exports):
- `get(key)` — returns a `Buffer` if the cache entry exists and is readable, `null` otherwise
- `put(key, buffer)` — writes; returns `true` on success, `false` on failure (silent failures preserved — current code uses `try { fs.writeFileSync(...) } catch {}`)
- `clear()` — removes all entries; returns `{ ok: true }` on success, `{ ok: false, error: <msg> }` on failure (preserves current `thumbnail:clearCache` handler semantics)
- `makeKey(filePath, mtime, size)` — pure function; returns the same SHA-1 hex string the current `thumbCacheKey` produces, including the same `CACHE_VERSION` prefix

#### 2e. `storage/thumb-cache/fs.js` (fs-based thumb-cache impl)

Move:
- `getThumbDir`, `ensureThumbDir` (`main.js` lines 145–152) — become internal
- `CACHE_VERSION` constant (currently `4`) — becomes a module-local constant; **value stays exactly `4`** (A7)
- `thumbCacheKey` (lines 363–367) — becomes the exported `makeKey`

Add the get/put/clear functions by extracting the inline `fs.*` calls from `main.js`'s `thumbnail:get` (cache hit at lines 384–389; cache writes at lines 398, 421, 428, 434) and `thumbnail:clearCache` (lines 443–455). The new functions encapsulate the directory-existence + file path construction + read/write/unlink with the same error-swallowing pattern.

Behavior preservation:
- Same disk path: `path.join(app.getPath('userData'), 'thumb-cache')`
- Same per-entry filename: `<key>.jpg`
- Same `CACHE_VERSION` value (`4`) and same hash composition (`sha1('v' + CACHE_VERSION + '|' + path + '|' + mtime + '|' + size)`)
- Same silent failure on `put` (current code wraps writes in `try { ... } catch {}`)
- Same `clear` return shape: `{ ok: true }` or `{ ok: false, error: <message> }`

#### Verification (Edit 2)

- [ ] All 5 files exist in the listed paths
- [ ] `storage/index.js` exports both `config` and `thumbCache`
- [ ] `storage/config/file.js` exports `get` and `set`; `storage/config/index.js` re-exports the same
- [ ] `storage/thumb-cache/fs.js` exports `get`, `put`, `clear`, `makeKey`; `storage/thumb-cache/index.js` re-exports the same
- [ ] `CACHE_VERSION` value is `4` in `storage/thumb-cache/fs.js`
- [ ] Each new file is under 100 lines (well within R5)
- [ ] Each function in the new files is under 50 lines (R6)
- [ ] No file imports from `main.js` (one-way dependency: `main.js` → `storage/`, never the reverse)

### Edit 3 — Route config persistence through `storage.config` in `main.js`

In `main.js`:

3a. Add `const storage = require('./storage');` near the top, alongside the other `require` lines.

3b. Replace the call sites of `loadConfig()` with `storage.config.get()`. Current call sites (search the file): inside the `config:get`, `config:pickFolder`, and `scan` IPC handlers.

3c. Replace the call site of `saveConfig(cfg)` with `storage.config.set(cfg)`. Current call site: inside the `config:pickFolder` IPC handler.

3d. Delete the `getConfigPath`, `loadConfig`, and `saveConfig` function definitions from `main.js` (now lives in `storage/config/file.js`).

#### Verification (Edit 3)

- [ ] `main.js` no longer defines `getConfigPath`, `loadConfig`, or `saveConfig`
- [ ] `main.js` no longer has `fs.readFileSync(<config path>)` or `fs.writeFileSync(<config path>, ...)`
- [ ] All previous call sites resolve via `storage.config.*`
- [ ] The app launches successfully and can load a previously saved `config.json` (manual test below)

### Edit 4 — Route thumb-cache persistence through `storage.thumbCache` in `main.js`

In `main.js`:

4a. Replace inline cache reads inside `thumbnail:get`. The current pattern (lines 384–389):

```js
if (fs.existsSync(cachePath)) {
  const data = fs.readFileSync(cachePath);
  return { url: bufferToDataUrl(data, 'image/jpeg'), cached: true };
}
```

becomes a single call to `storage.thumbCache.get(key)`. If the result is non-null `Buffer`, the code returns `{ url: bufferToDataUrl(data, 'image/jpeg'), cached: true }`.

4b. Replace inline cache writes (lines 398, 421, 428, 434 — the `try { fs.writeFileSync(cachePath, ...) } catch {}` pattern, four occurrences) with `storage.thumbCache.put(key, <buffer>)`. The function already swallows errors silently — no need for the surrounding `try/catch` in `main.js`.

4c. Replace `thumbCacheKey(filePath, mtime || 0, size || 0)` with `storage.thumbCache.makeKey(filePath, mtime || 0, size || 0)`.

4d. Replace the body of the `thumbnail:clearCache` IPC handler to delegate to `storage.thumbCache.clear()` and return its result directly.

4e. Delete `getThumbDir`, `ensureThumbDir`, the `CACHE_VERSION` constant, and `thumbCacheKey` function from `main.js`. They live in `storage/thumb-cache/fs.js` now.

4f. The `cachePath` local variable in `thumbnail:get` is no longer needed (was just `path.join(dir, key + '.jpg')`); the storage interface keys by the cache key directly. Adjust the handler accordingly.

#### Verification (Edit 4)

- [ ] `main.js` no longer defines `getThumbDir`, `ensureThumbDir`, `thumbCacheKey`, or `CACHE_VERSION`
- [ ] `main.js` no longer references `cachePath` or constructs paths under `thumb-cache/`
- [ ] All previous call sites resolve via `storage.thumbCache.*`
- [ ] `main.js` line count is lower than before (target: ~30–40 fewer lines)
- [ ] `main.js` line count is closer to or under 400 lines after the refactor (currently 455; R5 currently violated as documented in E2; this brief reduces toward compliance but **does NOT remove E2 in this PR** — that is a separate cleanup)

### Edit 5 — Remove E4 from `CLAUDE.md`

E4 documented the violation of R18 that this brief just resolves. Now that `storage/` exists and `main.js` routes through it, E4 is no longer accurate. Remove it.

Find this exact block in `CLAUDE.md` (the entire E4 entry):

```
**E4 — Persistent state not yet routed through `storage/` (R18).** Current `main.js` and `psd-worker.js` use direct `fs.*` for `config.json` and `thumb-cache/<sha1>.jpg`. Migration: brief 001 (`refactor/storage-layer`).
```

Delete it (along with the blank line that follows, if any). Do **not** renumber E5 — exception numbering is permanent (per the implicit convention used elsewhere in the doc and noted in the file's header trailer about preserving history).

#### Verification (Edit 5)

- [ ] E4 no longer appears in `CLAUDE.md`
- [ ] E5 still exists, untouched (still references the old brief numbering "brief 002 / 004 / 005" — that mismatch is acknowledged debt, fixed in a future brief, not this one)
- [ ] No other rule, anti-pattern, or exception was modified

---

## Behavior preservation (R14) — manual test plan

Before each commit on Edits 3 and 4, and once at the end before reporting, run this manual test in a fresh app launch (Windows is fine — primary platform). Report each as ✓ or ✗ with details if ✗:

1. **Cold start with no config.** Delete `config.json` under `userData`. Launch app. Expect: empty/welcome state with the folder picker available. (Equivalent to `loadConfig()` returning `{ rootPath: null }`.)
2. **Pick a folder.** Use the folder picker, select a directory containing PSDs. Expect: folder is scanned, groups appear. `config.json` is written.
3. **Restart with saved config.** Close app, reopen. Expect: same folder is loaded automatically (config persistence works through the new path).
4. **Thumbnail cache hit.** Restart and observe a previously scanned folder. Expect: thumbnails appear quickly from cache (cache is read through `storage.thumbCache.get`).
5. **Thumbnail cache miss → write.** Add a new file to a scanned folder, scan again. Expect: new thumbnail is generated and persisted (cache is written through `storage.thumbCache.put`).
6. **Clear cache.** Trigger the `thumbnail:clearCache` IPC (UI action — "limpar cache" or equivalent). Expect: `thumb-cache/` directory is emptied; subsequent scans regenerate thumbnails.
7. **Cache version unchanged.** Verify `CACHE_VERSION` in `storage/thumb-cache/fs.js` equals `4`. Verify a hash spot-check: take an arbitrary file path, mtime, size; compute the key in both old code (mentally / from git history) and new code; confirm identical hex.

If any of 1–6 produces visibly different behavior than `main` before this branch, **stop and report**. R14 is strict.

---

## Plan required

**Yes.**

Justification: although the file-by-file changes are specified above, the agent operating on the live `main.js` may discover details I did not see (subtle exception paths, IPC handler ordering, comments that should move with the code, Windows-specific path handling). A numbered plan at Pause 1 lets the user (Rafael) confirm the agent's reading of the code matches the brief's intent before any byte is written.

The plan should include:
1. The exact list of new files and what each will contain (top-level structure of each file's exports and one-line summary)
2. The order of file creation (recommend bottom-up: `file.js` and `fs.js` first, then their `index.js` re-exports, then top-level `storage/index.js`, then `main.js` edits)
3. Which `main.js` lines/regions are touched (line ranges from a fresh `cat -n main.js`)
4. Which manual test cases (from the list above) will be run and at which points
5. Any deviation the agent recommends from the brief, with rationale

Pause 1 happens after the plan is presented. Pause 2 happens after the **first new file** is created (suggest `storage/config/file.js` since it is the simplest), to validate naming, exports, and style. Pause 3 happens before each commit (5 commits planned).

---

## Git workflow

### Branch

```bash
git checkout main
git pull --ff-only origin main
git checkout -b refactor/storage-layer
```

### Commit sequence

Five commits, in this order. Each is a single thematic change.

```
1. docs(tasks): add brief for 002-storage-layer
   — touches only docs/tasks/002-storage-layer/brief.md (new file)

2. refactor(storage): introduce storage/ module with config and thumb-cache backends
   — touches only the 5 new files under storage/

3. refactor(main): route config persistence through storage.config
   — touches only main.js; config-related changes only

4. refactor(main): route thumb-cache persistence through storage.thumbCache
   — touches only main.js; thumb-cache-related changes only

5. docs(claude): remove E4 (R18 satisfied by storage/)
   — touches only CLAUDE.md
```

For commits 3 and 4, R14 is the bar — body must explicitly state "no behavior change" and reference the manual test cases run.

### Push

**Do not push.** The user authorizes push explicitly per `GIT_WORKFLOW.md` G-R5 / `CLAUDE.md` R17. Stop after the fifth commit and report.

---

## Output expected at the end of the session

A single message reporting:

1. Branch name and `git log --oneline main..HEAD` (5 commits)
2. `git diff --stat origin/main...HEAD` (line counts per file; expect `main.js` net negative)
3. Manual test results — pass/fail for each of the 7 cases above
4. New `main.js` line count (`wc -l main.js`)
5. Any verification checkbox from this brief that **could not** be met, with explanation
6. Confirmation that no `git push` was executed
7. Suggested next step: open PR on GitHub against `main`; once merged, proceed to brief 003 (format registry — first surface of R19)

---

## References (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules (especially R5, R6, R9, R10, R13, R14, R17, R18; A1, A4, A5, A7, A8; E4 itself, which Edit 5 removes)
2. `main.js` — the live code to be refactored. The agent should `cat -n main.js` first and base the plan on the actual line numbers, not the brief's approximations
3. `docs/GIT_WORKFLOW.md` — operational discipline (G-R3, G-R5, G-R8, PR template)
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points, drift signals); Lessons #1, #4, #6
5. `docs/MENTOR_BRIEF.md` — context on the user; especially M-R3, M-R4, M-R6
6. `docs/GOTCHAS.md` — `G-CACHE-1` is directly relevant (do not bump `CACHE_VERSION`)

If anything in the references contradicts a specific instruction in this brief, **stop and report** rather than choosing a side. Special attention to:

- A7 (do not bump `CACHE_VERSION` for non-format reasons) — the value `4` moves intact
- R14 (refactor: no behavior change) — the manual test plan is the bar
- E5 in `CLAUDE.md` — references the old brief numbering ("brief 002 / 004 / 005"); do **not** correct it in this PR (out of scope)
