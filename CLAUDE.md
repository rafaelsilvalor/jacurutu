# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # primeira vez
npm start          # roda o Electron em dev (electron .)
npm run build:win  # gera dist/ com NSIS installer + portable (x64)
```

There is no test suite, linter, or type checker configured. Don't invent commands for them.

User-facing strings are in **pt-BR** (the team is Brazilian). Match that when editing UI text or comments.

## Architecture

Electron app with the standard 3-process split. Files at the repo root are the whole app — `renderer/` is the front-end and `agent-skills/` is an unrelated vendored repo (its own `.git`, `CLAUDE.md`, etc.) that should be ignored when working on Saci.

```
main.js        Main process: IPC, folder scan, worker pool, thumbnail orchestration
preload.js     contextBridge — only exposes window.api with a fixed handler list
psd-worker.js  worker_threads runtime — handles 'render_psd', 'resize_buffer', 'resize_file'
renderer/      UI (vanilla JS, no framework, no bundler). app.js owns all state + DOM.
```

### Worker pool (the non-obvious part)

`PsdWorkerPool` in `main.js` is the heart of the app. It runs **2 worker threads** with:

- **60s per-task timeout** (`PSD_RENDER_TIMEOUT_MS`). On timeout the worker is `terminate()`d and respawned 500ms later — a stuck PSD must never block the UI.
- **Respawn on `error` event** with 1s backoff.
- Tasks are dispatched as `{type, ...}` payloads. `type` is one of `render_psd`, `resize_buffer`, `resize_file`. `task()` is the generic entry point; `render()` is the legacy alias for `render_psd`.
- When a payload carries a `Buffer`, its `ArrayBuffer` is added to the `transferList` for zero-copy.

`ag-psd` runs in Node (no DOM), so the worker calls `agPsd.initializeCanvas` with a stub canvas/image (see `makeStubCanvas`). Don't remove the stub — `ag-psd` calls into it during composite generation.

### Thumbnail pipeline

`ipcMain.handle('thumbnail:get', ...)` is the single entry point. The flow:

1. `.ai` / `.eps` / `.indd` → return `{unsupported: true}` immediately. No preview is possible.
2. Cache lookup: `sha1('v' + CACHE_VERSION + '|' + path + '|' + mtime + '|' + size)` keyed JPEG in `%APPDATA%\Saci\thumb-cache`. Hits return as `data:` URL.
3. Raster images (`png/jpg/jpeg/gif/webp`): hard 50MB skip, otherwise resized in the worker. Transparency is flattened to white because the cache format is JPEG.
4. PSD/PSB: `extractPsdThumbnailJpeg` is a **hand-rolled binary parser** that scans the Image Resources block for resource IDs `1036` (thumbnail) or `1033` (legacy thumbnail). It reads only the first 16MB of the file. If the embedded JPEG is **≥ 400×400** it's used directly (after a worker resize). Otherwise the worker calls `ag-psd` to render a full composite — slow but sharp. Embedded-small is used only as a last-resort fallback when render also fails.

**`CACHE_VERSION`** is at the top of the thumbnail section in `main.js`. **Bump it whenever the thumbnail output format or size changes** — old cache entries become unreachable automatically (the hash differs) so users get fresh thumbnails without manual cache clearing.

### Folder scan

`scanFolder` recurses up to **depth 4** from the configured root. Top-level subfolders are treated as "groups" (brands/categories) and rendered in the sidebar. `node_modules` and dotfiles are skipped. The supported extension set is `SUPPORTED_EXTS` in `main.js`.

### Renderer

`renderer/app.js` keeps everything in module-level globals (`allGroups`, `activeGroupName`, `searchQuery`, `rootPath`). No framework, no build step — just `<script src="app.js">`.

Thumbnails load via an `IntersectionObserver` on `.file-thumb[data-thumb]` with a 200px `rootMargin` so they pre-load just before scrolling into view. `thumbInflight` is a `Set` keyed by `filePath` to dedupe concurrent requests for the same file.

`index.html` has a strict CSP: `default-src 'self'; img-src 'self' data:`. Thumbnails are delivered as `data:image/jpeg;base64,...` from the main process — don't try to load them via `file://` (CSP will block) and don't add remote sources without updating the CSP.

### Security boundary

`webPreferences` uses `contextIsolation: true` + `nodeIntegration: false`. The renderer has no Node access — everything goes through `window.api` in `preload.js`. When adding a feature that needs filesystem/shell access, add an `ipcMain.handle` in `main.js` and a matching `ipcRenderer.invoke` wrapper in `preload.js`. Never widen the preload surface beyond the explicit handler list.

## State on disk (per user, Windows)

- `%APPDATA%\Saci\config.json` — `{ rootPath }`. Picked on first run via `dialog.showOpenDialog`.
- `%APPDATA%\Saci\thumb-cache\<sha1>.jpg` — thumbnail cache. Cleared via `thumbnail:clearCache` IPC, or just delete the folder.
