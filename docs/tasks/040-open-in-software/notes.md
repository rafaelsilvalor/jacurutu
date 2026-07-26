# Notes — 040 open-in-software

Owner rulings issued mid-run (Orchestrator session, 2026-07-25). Numbered in
issue order; the executor consumes these as brief-level decisions.

## Ruling 1 — Pause 1: spawn includes `windowsHide: true`

The executor's Pause 1 plan flagged an open question (item 1e): whether the
spawn options include `windowsHide: true` to suppress the console-window
flash `cmd /c start` can produce on Windows. Not prescribed by D4.

**Ruling: yes.** Spawn options are
`{ detached: true, stdio: "ignore", windowsHide: true }`. Rationale: the
flash is user-visible roughness in the primary designer flow; the option is
ignored on non-Windows platforms and does not alter D4/D5 semantics.
Tests assert the full options object accordingly.
