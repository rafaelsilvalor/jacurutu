# Gotchas

> Catalog of known technical traps in Saci's stack. Each entry has a permanent ID (`G-CAT-N`) for reference in commits, PRs, and issues.
> This file grows with use. Add a new entry whenever you (or an agent) lose time to a stack quirk that wasn't obvious from the code.

## How to add a new gotcha

1. Reproduce calmly and identify the cause.
2. Write the entry in the format below.
3. Pick the next free number in the appropriate category (e.g. `G-PSD-4`).
4. Commit with `docs(gotcha): add G-CAT-N — <short title>`.

## Format

```markdown
### G-CAT-N — Short descriptive title

**Symptom:** What you see (error message, weird behavior, unexpected output). Concrete and observable.

**Cause:** Why it happens. Explain the technical reason, not just "it's like that".

**Workaround:** Command, code, or config that resolves it. Concrete.

**Evidence:** Link, commit SHA, official doc, or date + description if discovered locally.
```

## Categories

| Code | Domain |
|---|---|
| `G-ELEC` | Electron — main/renderer/preload, IPC, security, lifecycle |
| `G-NODE` | Node.js runtime, `fs`, `worker_threads`, event loop |
| `G-PSD` | PSD/PSB parsing — `ag-psd`, binary format quirks |
| `G-WORKER` | Worker pool — concurrency, transfers, lifecycle |
| `G-CACHE` | Thumbnail cache — keys, invalidation, eviction |
| `G-PLAT` | Cross-platform behavior — Windows / macOS / Linux differences |
| `G-BUILD` | `electron-builder`, packaging, code signing, autoupdater |
| `G-I18N` | Internationalization — i18n layer, locale detection, fallbacks |
| `G-PROC` | Process/orchestration traps when working with AI agents on briefs |

Categories grow as needed. New category: lowercase shortcode, all-caps in IDs.

## Catalog

### G-CACHE-1 — Bumping `CACHE_VERSION` invalidates every user's thumbnail cache

**Symptom:** After a release, every user's app re-renders all thumbnails on next launch — first scan of a large folder takes minutes instead of seconds.

**Cause:** The thumbnail cache key is `sha1('v' + CACHE_VERSION + '|' + path + '|' + mtime + '|' + size)`. Bumping `CACHE_VERSION` changes the hash for every previously cached file, so cache hits become misses. This is intentional — it's how the cache is invalidated when the on-disk format changes — but trivial bumps are an unforced cost.

**Workaround:** Bump `CACHE_VERSION` only when the on-disk JPEG format or dimensions actually change. Refactors that produce byte-identical thumbnails do not bump it. If unsure, diff a sample cache file before vs. after.

**Evidence:** `main.js:361` (`const CACHE_VERSION = 4`), key construction at `main.js:363-367`. Mirrors `CLAUDE.md` A7.

---

### G-PSD-1 — `ag-psd` needs a stub Canvas/Image in worker threads

**Symptom:** Worker crashes with `TypeError: Cannot read properties of undefined (reading 'getContext')` when reading certain PSDs.

**Cause:** `ag-psd` is browser-first and calls into a DOM-like Canvas API during composite generation. Worker threads have no DOM, so `document.createElement('canvas')` is undefined.

**Workaround:** Call `agPsd.initializeCanvas(makeStubCanvas, makeStubImage)` once per worker before any `readPsd` call. The stubs return minimal `{ width, height, getContext }` shapes. See `psd-worker.js:16-47` for the exact stubs used.

**Evidence:** `psd-worker.js:38-47`. `ag-psd` README — "Using in Node.js".

---

### G-PSD-2 — Embedded JPEG thumbnail is inside the Image Resources block, not at offset 0

**Symptom:** Naïve "scan for `FFD8` (JPEG SOI marker)" heuristics misfire on PSDs because PSD files often contain multiple JPEG markers (in layers, smart objects, embedded previews).

**Cause:** The Adobe PSD format wraps the embedded thumbnail in an Image Resources block under resource ID `1036` (Photoshop ≥ 4.0) or `1033` (legacy). Each resource has a 28-byte header (format, width, height, widthBytes, totalSize, compressedSize, bitsPerPixel, planes) before the actual JPEG bytes.

**Workaround:** Walk the IR block sequentially, match `8BIM` magic + resource ID, skip the 28-byte header, then slice the JPEG. See `extractPsdThumbnailJpeg` at `main.js:293-347`. Limit reads to the first 16MB of the file — the embedded thumbnail is always near the head.

**Evidence:** Adobe Photoshop File Format Specification, "Image Resources Section" §1036/§1033. Implementation in `main.js`.

---

### G-PSD-3 — Embedded JPEGs below 400×400 trigger a slow composite render

**Symptom:** Some PSDs are slow to thumbnail (seconds) even though they have an embedded preview.

**Cause:** Many PSDs ship a low-resolution embedded thumbnail (e.g. 160×160) that looks bad in the UI grid. The pipeline rejects embedded thumbnails below `MIN_EMBEDDED_DIM` (400px) on either axis and falls back to `ag-psd` composite render — slower but sharp.

**Workaround:** Intentional tradeoff (quality > speed). To bias toward speed, lower `MIN_EMBEDDED_DIM` in `main.js`. To bias toward quality, raise it. The fallback chain is: large embedded → composite render → small embedded as last resort.

**Evidence:** `main.js:411-417` (threshold + fallback chain). Decision logged here on 2026-05-06.

---

### G-WORKER-1 — A stuck worker can hang the queue without a timeout

**Symptom:** PSD files never thumbnail. UI shows perpetual `...` placeholders for affected files. Other files (raster, smaller PSDs) keep working.

**Cause:** `worker_threads` has no built-in per-task timeout. A pathological PSD or a hung `ag-psd` call can pin the worker indefinitely, and tasks behind it in the queue starve.

**Workaround:** Each dispatched task carries a 60-second timeout (`PSD_RENDER_TIMEOUT_MS`). On timeout, the pool calls `worker.terminate()`, removes it from the pool, and respawns a fresh worker after 500ms. The original task resolves to `null` (UI falls back to the file extension placeholder). See `PsdWorkerPool.dispatch` at `main.js:88-122`.

**Evidence:** `main.js:11` (constant), `main.js:93-108` (timeout + respawn).

---

### G-WORKER-2 — Buffers sent to a worker are copied unless transferred

**Symptom:** Memory pressure climbs faster than expected when batch-processing many large PSDs. Resident set size (RSS) doesn't return to baseline between tasks.

**Cause:** `worker.postMessage(data)` defaults to structured clone, which deep-copies `Buffer`/`ArrayBuffer` payloads. Sending a 50MB PSD buffer without a transfer list duplicates it in the worker's heap.

**Workaround:** Pass the underlying `ArrayBuffer` in the `transferList` argument: `worker.postMessage({ buffer: buf }, [buf.buffer])`. After transfer, the buffer is detached on the sender side and zero-copy on the receiver. See `PsdWorkerPool.dispatch` at `main.js:112-114`.

**Evidence:** Node.js docs — `MessagePort.postMessage(value[, transferList])`. Implementation `main.js:112-114`.

---

### G-ELEC-1 — `contextIsolation: false` or `nodeIntegration: true` is a security regression, not a convenience

**Symptom:** Tempting shortcut: "just enable nodeIntegration so the renderer can `require('fs')` directly". Then any script the renderer loads (including pasted clipboard content rendered as HTML) can read disk and exec processes.

**Cause:** Both flags broaden the renderer's capability surface. Saci's content-security model assumes the renderer is sandboxed and only reaches the main process via the `contextBridge`-exposed `window.api`.

**Workaround:** Keep `contextIsolation: true` and `nodeIntegration: false` (current defaults at `main.js:191-194`). New main↔renderer features always go through `ipcMain.handle` + `contextBridge.exposeInMainWorld`. Never widen the preload surface beyond the explicit handler list. Mirrors `CLAUDE.md` A5.

**Evidence:** `main.js:182-203`, `preload.js`. Electron docs — "Security: Process Sandboxing".

---

### G-NODE-1 — `fs.readFileSync` on the main thread blocks the event loop

**Symptom:** UI hitches briefly when the user opens a folder containing many PSDs.

**Cause:** Thumbnail extraction reads up to 16MB from the head of each PSD synchronously (`fs.readSync` on a fresh fd). Per file the cost is bounded; cumulative across a folder of 200 PSDs it adds up to a perceptible UI freeze on slow disks.

**Workaround:** Per-file IPC requests rate-limit the work naturally — the renderer's `IntersectionObserver` only requests thumbnails for visible cards. The 16MB cap (`Math.min(16 * 1024 * 1024, stat.size)` at `main.js:298`) bounds each call. For very large folders, the worker pool absorbs the heavy lifting; the embedded-JPEG extraction itself stays on the main thread but is bounded.

If folder sizes grow into thousands of files and the hitch becomes user-visible, move `extractPsdThumbnailJpeg` into the worker too. Tracked as a future optimization, not a blocker today.

**Evidence:** `main.js:296-302` (sync read), `renderer/app.js:49-68` (IntersectionObserver rate limiting).

---

### G-CACHE-2 — Thumbnail cache grows without bound

**Symptom:** Over months of use, `%APPDATA%\Saci\thumb-cache` (or the platform equivalent) consumes hundreds of megabytes. Source files deleted from the user's folders leave orphan cache entries forever.

**Cause:** No eviction policy. Cache entries are written on miss and never removed except by the manual `thumbnail:clearCache` IPC handler (or the user nuking the folder).

**Workaround:** Today: document the location and expose the "clear cache" UI action. Long-term: add LRU eviction (oldest by access time) or size-based pruning (cap at e.g. 500MB). Tracked as future task.

**Evidence:** `main.js:443-455` (clear handler exists, no eviction).

---

### G-PLAT-1 — Hardcoded Windows path leaks into the onboarding UI

**Symptom:** A macOS or Linux user sees the first-run screen suggest `D:\Content\Trabalho\EstrategiaConcursos\Modelos`, which is non-existent on their machine and confusing.

**Cause:** The hint in `renderer/index.html:15` is a Windows-only string literal. Predates the cross-platform target (`CLAUDE.md` R1).

**Workaround:** Generalize the hint when the i18n migration runs (`feat/i18n-bilingual-ui`). Either omit the absolute path ("the Modelos folder on your design drive") or render an OS-specific suggestion based on `process.platform`. Tracked under E3b.

**Evidence:** `renderer/index.html:15`.

---

### G-PLAT-2 — `shell.showItemInFolder` and `shell.openPath` are platform-specific in their failure modes

**Symptom:** "Reveal in folder" / "Open" buttons silently fail on macOS or Linux for some file types where they work on Windows.

**Cause:** `shell.openPath` returns a string (empty on success, error message on failure) — but on macOS, "no app registered for this MIME type" returns differently than on Windows ("no association found"). `shell.showItemInFolder` is fire-and-forget and has no error channel at all on Linux desktop environments without a default file manager.

**Workaround:** Always check the return value of `shell.openPath` (already done at `main.js:276-278`). For `shell.showItemInFolder`, the existing `try/catch` in `file:reveal` (`main.js:281-289`) covers most failure modes. Test the buttons on macOS and Linux as part of the cross-platform validation pass.

**Evidence:** Electron docs — `shell.openPath`, `shell.showItemInFolder`. Implementation in `main.js`.

---

### G-PROC-1 — Literal sweeps collide with derived identifiers and meta-discourse in briefs

**Symptom:** A find-and-replace sweep prescribed in a brief corrupts files that should be left intact. Three concrete failure modes:

1. Task folder name `010-agent-kit-to-harness/` becomes `010-harness-to-harness/` after a literal `agent-kit → harness` pass.
2. Branch name `refactor/agent-kit-to-harness` becomes `refactor/harness-to-harness`.
3. Prose in the brief itself describing the rename — e.g. "rename agent-kit to harness" — gets rewritten to "rename harness to harness", losing the historical record.

**Cause:** Two failure modes share a root: literal sweeps cannot distinguish between (a) the object of the operation (the rename target — mutate) and (b) meta-discourse about the operation (identifiers derived from the operation; the brief's own prose describing what it does — preserve verbatim). Find-and-replace operates on raw strings without semantic context.

**Workaround:**

1. Before declaring a sweep complete, enumerate the operation's own artifacts (task folder, branch name, brief filename, brief self-references) and exclude them from the sweep explicitly.
2. For derived identifiers (task folders, branches, prior recap filenames): treat as verbatim records of history; never mutate. Relax the final verification grep to allow them.
3. For meta-discourse in the brief: list the literal phrases to preserve in a "Do not rewrite" subsection of the brief's "Architectural decisions already made". Or rephrase the brief itself to avoid embedding the old term in normative prose.
4. When the brief operates on names that appear inside it, distinguish in writing between "the old name" and "the new name" using stable referents (e.g. quote the literal old name with backticks; never let the brief say "rename X to X" after sweep).
5. When the sweep targets historical artifacts that must be renamed (e.g. retroactive recap rename), enumerate each source-target pair in a table inside the brief. The executor verifies the enumeration matches reality (`ls`) and stops if unexpected files appear; the brief never operates against a generative rule on derived identifiers.

**Evidence:** Brief 010 (`010-agent-kit-to-harness/`), session recap `2026-05-17-mentor-010-harness-rename.md`. Executor's Pausa 3 caught both failure modes before merge. Workaround #5 added during brief 012 modeling, applied immediately in Edit 5 of that same brief.

---

## Maintenance

Visit this file every 1–2 weeks during active development. Group related entries when the catalog grows past ~25 items. Promote frequent recurrences to `CLAUDE.md` rules so the next agent prevents them upfront instead of reacting.
