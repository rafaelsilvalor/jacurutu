# Task 042 — mid-run owner rulings

## Ruling 1 — 2026-07-26 — worktree stale-resolution STOP (Edit 3 build failure)

Context: executor STOP during Edit 3 — the session worktree has an empty
`node_modules`, so `@saci/*` imports resolve up-tree to the main checkout's
workspace symlinks, compiling and testing the cli against a pre-042
`@saci/core` dist (TS2305 on `buildEditableStem`).

Ruling (owner-approved):

1. Approved: run `npm install` at the worktree root to materialize workspace
   symlinks against the worktree's own `packages/*`.
2. Guard: after the install, `git status --short` must show no tracked-file
   changes. If `package-lock.json` (or any tracked file) changes, STOP and
   report — no lockfile drift lands under this brief.
3. Re-run `npm run build` and the FULL `npm test` suite; carry that evidence
   into Pause 3 for commit #3. The full-suite re-run also retroactively
   exercises the cli-side resolution against the worktree core, covering the
   Edit-2 evidence gap.
4. Commit #2 (`33ab873`) stands as valid for Edit 2: cli behavior was
   unchanged there, and core's own surface was tested via relative imports
   against the worktree dist.
5. The `docs/GOTCHAS.md` entry is OUT of this brief's scope (constraint 1).
   Queued as a follow-up docs brief: "worktree sessions must `npm install`
   locally or cross-package imports silently resolve to the main checkout."
