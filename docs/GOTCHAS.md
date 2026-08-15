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
| `G-DRIVE` | Google Drive adapter — OAuth scopes, tokens, Drive API semantics |
| `G-JIRA` | Jira adapter — REST semantics, auth, search endpoint behavior |
| `G-HOOK` | Claude Code hooks — registration, project-dir resolution, branch-scoped availability |
| `G-GIT` | Git semantics — squash-merge consequences, containment checks, branch and worktree lifecycle |
| `G-SHEETS` | Google Sheets adapter — Sheets API enablement, A1 ranges, values semantics |

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

### G-NODE-2 — Worktree sessions silently resolve `@saci/*` imports to the main checkout

**Symptom:** In a Claude Code session worktree (created under `.claude/worktrees/`), `npm run build` fails with `TS2305` on a symbol that exists in the worktree's own source — e.g. `Module '"@saci/core"' has no exported member 'buildEditableStem'` — even though the worktree's `core` package compiles cleanly. Worse, when no new symbol is involved, build and tests pass while silently exercising stale code.

**Cause:** A fresh session worktree starts with an empty or absent `node_modules`. Node's module resolution walks up the directory tree, so `@saci/*` imports resolve to the main checkout's `node_modules` workspace symlinks — which point at the main checkout's `packages/*`, not the worktree's. `npm run build` and `npm test` in the worktree therefore compile and test against the main checkout's (potentially pre-change) `dist`. The root cause is Node resolution behavior, but the trap bites agent worktree sessions specifically — that is where fresh worktrees with empty `node_modules` appear routinely.

**Workaround:** Run `npm install` at the worktree root to materialize workspace symlinks against the worktree's own `packages/*`. Guard: after the install, `git status --short` must show no tracked-file changes (especially `package-lock.json`); if it does, STOP and report — no lockfile drift may land. Then re-run `npm run build` and the full `npm test` suite.

**Evidence:** Ruling 1 (2026-07-26) in `docs/tasks/042-template-naming-sanitization/notes.md`; discovered during task 042, which landed as PR #100 (merge commit `dc854d9` on `main`).

---

### G-DRIVE-1 — Changing the requested OAuth scopes silently reuses the old grant

**Symptom:** After editing `DRIVE_SCOPES`, Drive calls keep failing with 403 / `insufficient` or `invalid_scope`, and no browser consent appears.

**Cause:** `~/.saci/token.json` caches the grant issued for the *previous* scope set; the adapter finds a token file, reuses it, and never re-runs consent. Google enforces the granted scope string in the cached token, not the constant in the code.

**Workaround:** Delete `~/.saci/token.json` and re-run; authorize again in the browser. Every scope change requires this.

**Evidence:** `docs/tasks/046-spike-adapter-drive/run-instructions.md` §2 and `docs/explorations/drive-oauth.md` §4; adopted by brief 047.

---

### G-DRIVE-2 — Two `google-auth-library` copies make `OAuth2Client` types incompatible

**Symptom:** `tsc` rejects `google.drive({ version: "v3", auth })` with `TS2769: No overload matches this call`, reporting that `OAuth2Client` is not assignable to the expected auth type. The compiler then falls back to the next overload and complains about `drive_v2`, so the message reads like a Drive API version mismatch rather than a types problem.

**Cause:** `googleapis@173.0.0` asks for `google-auth-library@^10.2.0`, but its transitive `googleapis-common@8.0.3` pins `google-auth-library@10.5.0` exactly. npm therefore installs two copies — `10.9.1` at the root (the adapter's direct dependency, which also satisfies googleapis' range by dedupe) and `10.5.0` nested under `googleapis-common`. `OAuth2Client` declares a private field, so TypeScript compares the two classes nominally instead of structurally: an instance built from the root copy is not assignable to a parameter type generated against the nested copy. Aligning the direct pin to the nested version is not a durable fix — the transitive's exact pin moves on any of its patch bumps.

**Workaround:** Construct the client through `google.auth.OAuth2` and derive the type from that value — `type DriveAuthClient = InstanceType<typeof google.auth.OAuth2>` — so the type comes from the copy googleapis itself uses. Never paper over it with a cast: a cast silences the compiler while leaving which copy is in play unknown. Importing `OAuth2Client` from `google-auth-library` into any signature that reaches googleapis reintroduces the failure.

**Evidence:** Brief 047 Edit 5 — `packages/adapter-drive/src/client.ts` (`DriveAuthClient`) and `packages/adapter-drive/src/auth.ts`; recorded in `docs/tasks/047-adapter-drive/notes.md`. Observed 2026-08-02; `npm ls google-auth-library --all` shows both copies.

---

### G-DRIVE-3 — gaxios redacts the `authorization` header but not `refresh_token`

**Symptom:** You are checking whether a Google library error can leak a credential. You look at the thrown error's `config.headers.authorization`, find `<<REDACTED> - See errorRedactor option ...>`, and conclude the library scrubs credentials before throwing. It does not: on a token-endpoint failure the same error object carries a **long-lived refresh token** — or, on the consent exchange, the authorization **code** — in clear under `config.data`. The redacted header is a false lead, and checking it first is how this trap survives a review.

**Cause:** gaxios installs `defaultErrorRedactor` on every request unless the caller passes its own function or `false`. That redactor rewrites headers matching `authentication` / `authorization` / `secret`, and in a `FormData` or `URLSearchParams` body **only** the keys `grant_type`, `assertion` and anything matching `secret`. `google-auth-library`'s `refreshTokenNoCache` posts `URLSearchParams({ refresh_token, client_id, client_secret, grant_type })` and `getTokenAsync` posts `{ client_id, code_verifier, code, grant_type, redirect_uri, client_secret }` — so `client_secret` and `grant_type` are scrubbed while `refresh_token` and `code` are not, and they remain own enumerable state on the thrown error. Node's default error printing walks the `[cause]` chain, so attaching the library's error as `cause` prints whatever rode on its request: one `console.error(err)` or one unhandled rejection is enough. The refresh happens inside an ordinary Drive call, so the error arrives at the adapter's normal failure seam, from a path nothing marks as auth-shaped.

**Workaround:** Never let a library error travel whole out of the adapter — concretely, never write `new Error(message, { cause: error })` with the library's own error. `toDriveError` and `toConsentError` (`packages/adapter-drive/src/errors.ts`) build a sanitized stand-in carrying the message, the classified status and the original stack string, and nothing else; nothing that leaves the module holds a reference to the library's error, and the library's error is never mutated. `errors.test.ts` (l) and (n) assert that a placeholder refresh token and a placeholder authorization code do not appear in `util.inspect(wrapped, { depth: null })`, each with an inline non-vacuity guard. Do not treat the redactor as the boundary — it is a helpful default, not a contract, and its coverage is where this trap lives.

**Evidence:** Brief 047's fourth remediation round — commits `1426950`, `6a3f99c`, `fbe46bc`; full account, including the false access-token claim this corrected, in `docs/tasks/047-adapter-drive/notes.md` §7. Verified 2026-08-03 against **real request errors** (a hand-built `GaxiosError` bypasses the pipeline that installs the redactor and proves nothing) on both installed gaxios copies — `7.1.3` nested under `googleapis-common`, `7.3.0` at the root — and `google-auth-library@10.5.0`, the copy that executes (G-DRIVE-2). Redactor source: `gaxios/build/cjs/src/common.js`, `defaultErrorRedactor`.

---

### G-JIRA-1 — Jira error messages are localized; key a guard on the status code

**Symptom:** A guard that classifies a Jira failure by reading its error text works on your machine and fails on someone else's. The check looks sound — the message it matches is right there in the response you captured — but on another machine, or another day, the same failure arrives worded in another language and the branch never fires. There is no error and no log: the guard silently answers "not that case" and the caller proceeds as if the request had succeeded.

**Cause:** Not established — and that is exactly the point. What Jira keys the message language on was never determined, and this entry deliberately does not guess. What *was* observed (2026-08-09, `https://estrategia.atlassian.net`): the request asked for no language at all — the headers sent were `Accept`, `Authorization` and `Content-Type`, and this adapter sends no `Accept-Language` anywhere — and `POST /rest/api/3/search/jql` with an unbounded JQL answered `400` with its message in **Chinese** regardless. The status code was stable; only the prose moved. The obvious hypothesis is that the language follows the Atlassian account's own preference, but it is **unverified and this measurement cannot support it**: the probe ran with an invalid credential and, in one case, with no `Authorization` header at all, so there was no authenticated account for the response to follow. Treat the language of a Jira error as a value this codebase neither sets, nor reads, nor has any established way to predict. Anything downstream of `.includes(...)`, `.match(...)` or a regex over a Jira message body inherits that unpredictability as a control-flow decision.

**Workaround:** Key on HTTP status codes; never branch on response-body text. The live example is `packages/adapter-jira/src/http.ts`: it declares `CREDENTIAL_REJECTED_STATUSES = new Set([401, 403])` at module top, and `verifyCredentials` decides on set membership alone — it does not even parse the success body, precisely so no message-text dependency can grow there later. Response text is still fine in the message you *throw* (`Jira API error ${status}: ${detail}` carries it for the operator to read); it is never the thing you *test*. Enforce it with a test rather than prose alone: `http.test.ts` sends a `401` whose body is a Chinese `errorMessages` array and asserts the thrown message is still the English credential message.

**Evidence:** Measured live on 2026-08-09 by the Orchestrator against `https://estrategia.atlassian.net`, with an invalid Basic credential and, in one case, with no `Authorization` header at all. The raw fact: `POST /rest/api/3/search/jql` with the unbounded JQL `order by created DESC` answered `400`, **and that `400`'s message came back in Chinese**, on a request that carried only `Accept`, `Authorization` and `Content-Type` — no `Accept-Language`, nothing asking for a language. The machine's own locale was not recorded, so it is not offered here as an explanation either. The same measurement recorded that a *bounded* JQL answers `200 {"issues":[],"isLast":true}` to an unauthenticated caller while `GET /rest/api/3/myself` answers `401`, which is why the credential pre-flight exists at all. Adopted by brief `2026-08-09-fetch-credential-guard` as its constraint 4.

---

### G-HOOK-1 — A session worktree cut from `main` silently loses every hook

**Symptom:** A session opens in a fresh worktree, switches to the branch it was told to continue, and works normally — but no guard ever fires. A commit subject that violates R10 is accepted. A staged architecture violation goes through. The turn ends without `tsc -b` or `npm test` having run. There is no error, no warning, and no log line, because nothing failed: the hooks were never registered in the first place. The only observable is an absence, which reads exactly like "everything passed".

**Cause:** Hooks are registered in `.claude/settings.json` and resolved through `${CLAUDE_PROJECT_DIR}/.claude/hooks/`. `CLAUDE_PROJECT_DIR` is the session's project directory, fixed when the session opens — it is the worktree the session was *created in*, not the branch that worktree later checks out. A session worktree created from `main` (or any branch that predates the hooks) contains no `.claude/settings.json` and no `.claude/hooks/`, so the harness has nothing to register, and `git switch`ing that worktree onto the branch that does carry them changes nothing: settings are read at session start, not per branch. Because the five guards live as files on a branch, this applies to every session opened from `main` until that branch merges. The same worktree also starts without `node_modules`, so G-NODE-2 fires simultaneously — the green boundary would have verified the main checkout's `dist` even if it had been registered.

**Workaround:** Move the branch into the session's own worktree instead of reaching across into another one: `git -C <other-worktree> switch --detach` (non-destructive — it only releases the branch), then `git switch <branch>`, then `npm install` at the worktree root with G-NODE-2's guard (`git status --short` must show no tracked changes, especially not `package-lock.json`). Then **probe** rather than assume, because a dead hook looks like a passing one: with nothing staged, run `git commit -m "bogus: probe"`. A live `commit-guard` denies it on the invalid type *before* git runs; a dead harness lets git answer "nothing to commit". The two outputs are unmistakable. Never treat the absence of a complaint as evidence that a guard ran.

**Evidence:** Hit on 2026-08-09 while continuing `experiment/harness-redesign`. The session opened in a worktree created from `main@073f2ea`, where the branch's five hooks and 61 hook tests exist but `.claude/settings.json` does not; the guards were confirmed dead, then confirmed live after the move, using the probe above. Recorded in `docs/sessions/2026-08-09-orchestrator-harness-redesign-continued.md`.

---

### G-GIT-1 — After a squash merge, no commit-level check can confirm containment

**Symptom:** You need to decide whether deleting a branch loses work. `git branch --merged main` does not list it. `git cherry -v main <branch>` marks **every** commit `+`. `git branch -d` refuses it — or deletes it over a `warning:` almost nobody reads, and which of those two you get is unrelated to whether the work is in `main`. Where the three agree — unmerged, unique content, deletion loses work — they can be wrong at once, with no warning that they are: the branch's content may be fully in `main`, and the branch may in fact be *behind* it. **Of `-d`'s two answers the dangerous one is success.** A refusal makes you stop and think; a `Deleted branch <name> (was <sha>)` reads as git having confirmed containment, when all it confirmed is that the local ref matched its remote-tracking ref — a thing equally true of a branch whose work never reached anywhere. **Git does tell you.** A `warning:` sits immediately above that line, quoted verbatim in the Cause below, naming the reference it actually checked. It goes to stderr, it wraps across two lines, and the reassuring `Deleted branch ...` lands directly underneath it — so the eye takes the confirmation and skips the correction. Read that warning as the signal and the success line as the noise; the reflex runs the other way. The two failure modes are both bad: an agent that believes the tools refuses a safe cleanup forever, or reaches for `-D` having "checked" and destroys real work the next time the answer differs.

**Cause:** Squash merging, which `docs/GIT_WORKFLOW.md` step 8 makes the default here. A branch's N commits land on `main` as **one** commit with a combined patch and a fresh SHA, and the originals are never referenced again. The three checks then fail for three different reasons, which is why agreeing does not make them corroborating:

- `git branch --merged` tests **reachability**. The original commits are not ancestors of `main` after a squash, so it reports "unmerged" — correctly, and uselessly. This is unconditional: it happens for every squash-merged branch regardless of size.
- `git branch -d` tests reachability too, but **not against `main`**. It asks whether the branch is merged into its *upstream*, falling back to `HEAD` when there is none — it never consults `main` unless `main` happens to be one of those. A branch whose `origin/<branch>` points at the same commit passes that check trivially, and `-d` deletes it while having verified nothing about containment. Strip the upstream away and the identical branch is refused. This is why the entry cannot state a single behaviour for `-d`: the 2026-08-09 branches had no matching upstream and were refused, the 2026-08-11 one had, and was not.

  Git states which reference it used, and the wording is worth memorising because it is the tell:

  ```
  warning: deleting branch 'docs/gotchas-squash-containment' that has been merged to
           'refs/remotes/origin/docs/gotchas-squash-containment', but not yet merged to HEAD
  Deleted branch docs/gotchas-squash-containment (was 8dcf0a6).
  ```

  Read it literally: **merged to `refs/remotes/origin/<branch>`, not yet merged to `HEAD`.** That is `-d` naming its own reference out loud, and the reference is neither `main` nor anything that implies containment. The warning appears *only* in this exact case — merged to upstream, not to `HEAD` — which makes its presence a positive signal that the check you wanted did not happen. A deletion with no warning means the branch really was reachable from `HEAD`; a deletion with this warning means the upstream answered and nothing else did.
- `git cherry` tests **patch-ids, commit by commit**. The squashed commit's patch-id is the id of the *combination*, which matches none of the N individual ids. But when N is 1 and the patch was not modified, the squashed patch *is* the original patch and `git cherry` answers correctly.

That last clause is the trap's real edge. `git cherry` is **conditionally** wrong — right on single-commit branches, silently wrong on multi-commit ones — which is more dangerous than always wrong, because it works often enough to earn trust. Measured on 2026-08-09 against this repo: a six-commit branch squashed into `073f2ea` reported `+` six times, while a one-commit branch squashed into `93fa448` reported `-`. Neither was an ancestor of `main`, so reachability called both unmerged. A third measurement on 2026-08-11 at **N=10** did exactly what the rule predicts — ten `+` marks on a branch whose content was already in `main` — so the conditional-wrongness claim now rests on three points, at N=1, N=6 and N=10, rather than on the two it was written from.

**Workaround:** Ask about **trees**, never about commits — and ask against `origin/main`, never the local `main`. `git diff --stat origin/main <branch>`: if empty, the trees are identical and there is nothing to lose. If it is not empty, do not stop there — read the *direction* of the difference, because `origin/main` being ahead looks exactly like the branch having unique work. Settle it in two parts, excluding the files `origin/main` is known to lead on:

```bash
git diff --stat origin/main <branch> -- . ':!path/to/led-file' ':!path/to/other'   # must be empty
git diff --numstat origin/main <branch> -- path/to/led-file path/to/other          # read added vs deleted
```

In the second command, `origin/main` → branch showing mostly **deletions** means the branch lacks a patch `origin/main` has, i.e. `origin/main` is ahead. Only then delete, and record the tip SHA in the commit message or recap so the reflog is not the only trace.

**The `origin/` prefix is the load-bearing part, not a stylistic preference.** `git fetch` advances `origin/main` and leaves the local `main` exactly where it was; nothing moves a local branch you never check out. In a worktree cut from a SHA that then does its work and merges on the server, the local `main` is stale **by construction** — and this project opens a fresh worktree per session, which makes stale the default state rather than an edge case. A stale reference fails in this entry's own worst shape: the diff comes back non-empty, the branch reads as carrying unique work, and what it is actually showing is the distance between two points on `main`. The direction paragraph above cannot save you here, because the difference is real — it is just a difference from the wrong place. `origin/main` is in turn only as fresh as your last fetch, so `git fetch origin` immediately before the check is part of the check, not preparation for it.

The two-part form above is for the non-empty case only, and that case is not the common one. After a clean squash of a branch that was not left behind, `git diff --stat` comes back empty outright and the answer is immediate — the direction question never arises. 2026-08-11 measured exactly that: empty diff, identical trees, done in one command. Reach for the exclusion pair when the first `git diff --stat` has output to explain, not before.

Do not use `git cherry`, `--merged` or `git branch -d` for this decision at all. For `cherry` and `--merged` the output is the same for a fully-merged branch and for one carrying unique work, so it conveys nothing. `-d` fails the other way and is the more insidious of the three: it answers a question about the *upstream* in a voice that sounds like confirmation, and it is precisely the check a reader reaches for once the first two have lost their trust — the one remaining commit-level signal, and the one that will silently agree with whatever you already wanted to do.

**Evidence:** Hit on 2026-08-09 during the harness-redesign cleanup, on `fix/fetch-credential-guard`. `git cherry -v main` marked all six of its commits `+` after their content had already shipped as PR #128, squashed to `073f2ea`. What proved deletion safe: excluding the two files touched by PR #129, `main` and the branch had identical trees; and on those two files, `main` → branch deleted 116 and 12 lines while adding back 6 and 6 of the pre-#129 state — the #129 patch being undone, so `main` was strictly ahead. Recorded in `docs/sessions/2026-08-09-orchestrator-harness-redesign-continued.md`.

Exercised a third time on 2026-08-11, on `chore/gate-runtime-instrumentation` — ten commits, squashed into `d517144` as PR #131, tip `c4ebae3`. Two of the three commit-level symptoms reproduced exactly; the third did not:

| Signal | Answer | Correct? |
|---|---|---|
| `git diff --stat origin/main <branch>` | empty; trees identical on both sides | **yes** — nothing to lose |
| `git branch --merged origin/main` | branch not listed | no — reads as unmerged |
| `git cherry -v origin/main <branch>` | `+` on all ten commits | no — reads as unique content |
| `git branch -d <branch>` | `Deleted branch ... (was c4ebae3)`, first try | misleading — it checked the upstream, not `main` |

Both trees were `ae79eb91e32c226575dc3b0a03a075784902d4e8`. The branch had `origin/chore/gate-runtime-instrumentation` at the same commit, which is the entire reason `-d` succeeded. **These measurements cannot be re-run from this repository**: the branch was destroyed by the very command under measurement, and its tip `c4ebae329186b15e8d23e260cee38efcf15d6155` — content fully contained in `d517144` — now survives only in the reflog and in this entry. Recorded in `docs/sessions/2026-08-11-orchestrator-gate-runtime-instrumentation.md` and its executor pair.

The `origin/` requirement was measured the same day, on the session that wrote the correction above — by running this entry's own Workaround against that session's task branch, `docs/gotchas-squash-containment`, to check a claim its recap had already asserted. The claim was wrong. `git diff --stat main <branch>`, run literally, reported **21 insertions and 5 deletions** and read as unique work; the local `main` was one commit behind at `d517144`, because the merge happened on the server and `git fetch` had moved only `origin/main`. The same command against `origin/main` was empty, with both trees at `b7f8fcf2e9976d7755040b9f5fc06285a0dd08f4`. Nothing about the branch changed between the two commands — only the reference did. Unlike the measurements above, **this one reproduces**: check out any worktree cut from a SHA whose `main` has since advanced, and both answers are still there. Recorded in `docs/sessions/2026-08-11-orchestrator-gotchas-squash-containment.md` as F-3.

The warning quoted in the Cause was captured on 2026-08-11, cleaning up that same session — and the cleanup produced the entry's tightest demonstration, because it ran `git branch -d` over **three** branches in one command. All three had been verified contained by the tree check first: remainder empty against `origin/main`, and the led files showing `0/260` and `4/8` added-over-deleted, i.e. `origin/main` strictly ahead. `-d` then answered in opposite directions. `docs/gotchas-squash-containment` was deleted, over the warning above. `docs/session-recap-gotchas-squash-containment` and `docs/gotchas-origin-main-reference` were **refused** — `error: the branch '...' is not fully merged` — and needed `-D`. The variable was not containment, which was identical in all three: GitHub had auto-deleted the remote branches of the latter two on merge and a `git fetch --prune` had removed their remote-tracking refs, leaving `-d` to fall back to `HEAD`; the first still had its `origin/` ref alive. Same repository, same minute, same containment, three branches, two opposite verdicts. This measurement is recorded **here and nowhere else**: it was taken after that session's recap had already merged, so the recap does not contain it. The three tips were `8dcf0a6`, `f7e2ed6` and `4bbc897`.

---

### G-SHEETS-1 — A disabled Sheets API answers 403 and reads exactly like a scope failure

**Symptom:** The first `spreadsheets.values.update` against a Cloud project that has never used the Sheets API answers `403 Google Sheets API has not been used in project <project-number> before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=<project-number> then retry.` The status code is the same one an insufficient-scope denial carries, and everything around the call looks like an authorization problem: the token was just used successfully for a Drive call, the app is a Desktop OAuth client, the scope list is short. A classifier that treats every 403 as a scope signal files this as "the granted scopes are not enough" — and then the reader deletes `~/.saci/token.json`, re-consents in the browser, and gets the identical failure, because nothing about the grant was ever wrong.

**Cause:** Enabling the Sheets API is a **project-level** setting, entirely separate from the OAuth grant. It was measured, not reasoned: the same cached token, carrying the same granted scope string, produced a failing call before the API was enabled and a passing one after — with no re-consent, no new token, and no edit to the requested scopes in between. The scopes were sufficient the whole time and the 403 was never about them. What the API rejects the request on internally, and whether it consults the grant at all before answering, was **not established** — and it does not need to be: the measurement rules out scopes as the variable, which is the only thing the reader has to know.

**Workaround:** Enable the Google Sheets API in the Cloud project (the console URL in the error message points straight at it). It does not touch the OAuth grant, does not invalidate `~/.saci/token.json`, and forces no existing user back through browser consent — `G-DRIVE-1` does not fire for this change.

In code, classify by **message signature before status**, and put the service-disabled signature first: match `has not been used in project` / `SERVICE_DISABLED` ahead of any insufficient-scope signature, and report a 401 or 403 that matches no signature as an authorization failure of unknown cause rather than borrowing the scope verdict. The live example is `MESSAGE_RULES` in `packages/adapter-sheets/src/errors.ts`; `errors.test.ts` pins the order with a message carrying **both** signatures, because a message carrying only one classifies correctly under either order and would not catch a reversal.

**Evidence:** The two transcripts in `docs/tasks/2026-08-15-spike-sheets-report/notes.md`, measured 2026-08-15 against the owner's Cloud project. Run 1: `STEP 2a: FAIL 403 Google Sheets API has not been used in project <PROJECT-NUMBER> before or it is disabled.` Run 2, after enabling the API: `STEP 2a: PASS — values.update wrote 51 cells at 'Página1'!A1:Q3`. Both runs reused the same cached token and both printed the granted scope string as `STEP 4` — `drive.file` + `drive.metadata.readonly`, identical — which is what makes the conclusion airtight: the scope list could not have been the variable, because it did not vary. The same note records that the spike's own probe mislabeled run 1 as a scope signal, and keeps that wrong label in the transcript rather than retouching it.

---

### G-SHEETS-2 — The default sheet is named in the account's locale

**Symptom:** A range qualified with a sheet name works on the machine of whoever wrote it and, on another account, addresses a sheet that is not there.

**Cause:** This entry has a measured half and an inferred half, and they are **not** the same claim.

- **Measured.** The default sheet of a newly created spreadsheet is named in the account's own language. A `values.update` sent with the unqualified range `A1` came back echoing `updatedRange = 'Página1'!A1:Q3` on a pt-BR account: Google resolved the unqualified range against the first sheet and reported that sheet's localized name back.
- **Inferred, never exercised.** That a range written `Sheet1!A1` would therefore *fail* on that same account is a reasonable reading of the echo above and nothing more. No qualified range was ever sent, by that run or any other, so the failure mode has no measurement behind it — not its error, not its status, not even that it fails at all. Do not let this half acquire the confidence of the one above it because the two sit in the same entry.

**Workaround:** Never qualify a range with a sheet name. An unqualified A1 range targets the first sheet, which is the only form this project has exercised — `VALUES_RANGE` and `CLEAR_RANGE` in `packages/adapter-sheets/src/constants.ts` both rely on it, and both say so where they are declared. A hardcoded English sheet name is the thing to avoid whether or not the inferred half is true: it can only ever be right by coincidence of locale.

**Evidence:** Run 2 of the spike, `docs/tasks/2026-08-15-spike-sheets-report/notes.md`, 2026-08-15: `STEP 2a: PASS — values.update wrote 51 cells at 'Página1'!A1:Q3`. That single echo is the whole of the measurement.

---

## Maintenance

Visit this file every 1–2 weeks during active development. Group related entries when the catalog grows past ~25 items. Promote frequent recurrences to `CLAUDE.md` rules so the next agent prevents them upfront instead of reacting.
