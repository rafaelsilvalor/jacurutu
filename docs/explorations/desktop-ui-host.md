# Desktop UI host — browser-served vs. Electron

Status: exploration — no implementation mandate
Disposition: open — 2026-08-06
Origin: mentor session 2026-08-03 (UI host evaluation; mode: exploring
possibilities). No source documents outside the conversation. Absorbed
pending decision #2 at its 2026-08-06 migration (brief 051).
Roadmap link: absorbed ROADMAP Pending decisions #2 (designer-friendly
packaging format) — 2026-08-06; Phase 3 packaging item; Phase 5 (Desktop UI
on top of CLI)

The question this note holds: when the desktop UI phase opens, what
**hosts** it — a local server the designer's own browser connects to, or
a packaged Electron application? Nothing here is decided. The note
exists so that the future spike or brief starts from this evidence
instead of from zero.

---

## 1. Terminology

The pattern under discussion is a **local server plus browser front
end**: a Node process runs on the designer's machine, exposes an HTTP
(and possibly WebSocket) surface on `localhost`, and the browser
connects to it. The browser is a rendering surface only — everything
that touches disk, spawns an editor, or calls Jira and Drive runs in the
local server process. Jupyter is the reference implementation of this
shape.

Insomnia is **not** an instance of this pattern; it is a packaged
Electron desktop application with its own window (high confidence, not
re-verified in this session). It was named as an example in the
originating conversation. The correction is recorded here so a future
reader does not inherit the wrong reference.

## 2. Why the current architecture already leaves this open

Hexagonal architecture: `core` defines the domain and the ports,
adapter packages implement ports, the composition root wires them (R25).
Today the only composition root is `cli`.

A browser-served UI is a **driving adapter** — a new package (`server` /
`adapter-http`; naming not decided) that exposes the same `core` and the
same driven adapters over HTTP, plus a front end that consumes it.

Consequence: adding this surface later costs nothing today. No
preparatory work is justified now on the grounds of "keeping the option
open" — the option is already open by construction.

Open sub-question: whether such a server reuses the `cli` composition
root or gets its own. Both satisfy R25; the trade-off (duplicated wiring
versus `cli` acquiring a non-CLI responsibility) is unexplored.

## 3. Comparison of the two hosts

| Criterion | Local server + browser | Electron |
|---|---|---|
| OS access boundary | Structural — the browser is a separate process with no Node access | Manual — IPC plus `contextIsolation` discipline (A5) |
| Local network exposure | New concern — see section 4 | None; no listening socket by default |
| Artifact weight | Light — reuses the browser already installed | Heavy — ships Chromium plus Node |
| Perceived product | A browser tab | A native window |
| Fit with hexagonal | A driving adapter, nothing more | Also an adapter, but the host is more coupled to the app shell |
| Launch for a non-technical designer | **The weak axis** — something must start the server and open the tab | **The strong axis** — double-click and it is open |
| Native file/folder picker with real paths | Not available — see section 5.6 | Available through Electron's dialog API (exact API surface unverified) |

The deciding axis is the launch row. On the others the two are roughly a
wash, or the browser model is ahead.

## 4. The trap the first evaluation understated

The originating conversation claimed the security boundary "comes for
free" in the browser model. That is half right, and the precise version
matters:

- **What does come for free:** the front end cannot touch the OS. There
  is no renderer process to harden, because the rendering process is a
  general-purpose browser holding no elevated privileges.
- **What is added:** an HTTP server listening on `localhost` is
  reachable by **any page the user has open in that same browser**, and
  by any other process on the machine. Without authentication, a
  malicious or merely careless page can issue requests to it. DNS
  rebinding widens the exposure further (mechanism unverified in
  detail).

This is why Jupyter puts a token in the URL it opens. Consequence for
any future design: local authentication is **mandatory**, not optional
hardening — a token in the launch URL, `Origin` / `Host` header
validation, and binding to `127.0.0.1` rather than `0.0.0.0`. It is a
different cost from Electron's, not a smaller one.

Electron carries no equivalent concern precisely because it opens no
listening socket by default.

## 5. Open questions

The reason this note exists. Each item states what is known and what is
not.

### 5.1 Packaging and launch for a non-technical designer

Candidates, none evaluated:

- a single-executable Node build (Node ships a single-executable-
  application facility; exact configuration, flags, and Windows
  viability **unverified**)
- a small tray or launcher application whose only job is to start the
  server and open the browser at the right URL
- `npx`-style invocation — rejected on sight for this audience, since it
  requires a terminal
- an Electron shell that merely hosts the same local server: a hybrid
  that would collapse the two options rather than choose between them

This is the axis the decision actually turns on. ROADMAP pending
decision #2 is the same question one level up.

### 5.2 Port allocation

Fixed port (memorable URL, collision risk) versus ephemeral port (no
collision, but the URL must be communicated to the user at launch).
Jupyter uses ephemeral plus auto-open. Interacts with 5.1: whoever
launches the server is also who surfaces the URL.

### 5.3 Local authentication

See section 4 — mandatory, shape unexplored. Options mentioned but not
evaluated: token in the launch URL, per-run secret file readable only by
the OS user, OS-user identity check.

### 5.4 Process lifecycle

Who starts the server and who stops it; what happens when the user
closes the tab (does the process keep running?); how a second launch
behaves (reuse the running instance or start another); how orphaned
processes are avoided on Windows. Unexplored.

### 5.5 Feedback on long-running operations

`ship` uploads are long. A plain request/response HTTP contract cannot
report progress, so server-sent events or WebSocket would enter the
adapter's contract. Worth knowing before the adapter's shape is fixed —
easier to design in than to retrofit.

### 5.6 File and folder selection

The browser cannot hand real filesystem paths to the server. Since the
server owns `fs`, a path-selection UI would have to be **served by the
server** — a path browser rendered from server-side directory listings —
rather than delegated to a native dialog. This is a concrete UX cost,
not a detail: the production loop involves choosing workspace roots and
inspecting task folders.

### 5.7 Paths not yet evaluated

- **TUI** (terminal user interface) as an intermediate rung between the
  bare CLI and a graphical host: lower packaging cost, but still a
  terminal, so it likely fails the same non-technical-designer test.
- **CLI plus a thin native wrapper** that only shells out to commands —
  narrower than either option compared above.

## 6. Doctrine touchpoints (observation, not instruction)

"Electron host" is currently recorded as a **closed** decision in two
places: `MENTOR_BRIEF.md` section 2 ("CLI-first, desktop-later … Desktop
UI (Electron host) reconnects on top") and the ROADMAP Phase 3 packaging
item ("Jacurutu-desktop (Electron) returns as a host for the CLI"). ROADMAP
Phase 5 is marked sketch-only, so those two records are the load-bearing
ones.

This note does not change them — notes carry no authority (see this
folder's README). Whether that decision is reclassified from closed to
open is an owner ruling, executed as a doctrine edit in an Orchestrator
session.

## Absorbed roadmap entry (2026-08-06, brief 051)

2. **Designer-friendly packaging format.** Installer? Portable? Per-OS variants? Deferred to Phase 3 planning.

## Changelog

- 2026-08-03 — Created from the 2026-08-03 mentor session (exploring
  possibilities). Records the browser-served versus Electron comparison,
  the localhost-exposure correction to that session's first evaluation,
  and seven open questions. No decision taken.
- 2026-08-06 — header updated to the 050 contract (disposition `open`);
  absorbed pending decision #2 at its migration (brief 051).
