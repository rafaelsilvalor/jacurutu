# Session recap — 2026-08-12 — spike-art-chain (executor)

**Mode:** executor run — caminho B (Orchestrator-authored brief,
`validate-brief.mjs` APPROVED 11/11, owner go at the Orchestrator gate).
**Brief:** `docs/tasks/2026-08-12-spike-art-chain/brief.md` (Category L,
`Plan required: no`), branch `docs/spike-art-chain`, cut from the verified base
`2d43122` (= `main` = `origin/main`, PR #137).
**Assembled by:** the Orchestrator, from the executor's returned evidence. The
executor runs as a subagent, so its transcript is not this file; every number
below was pasted by it at a Pause and independently re-verified before the go.
**Pairs with:** `docs/sessions/2026-08-12-orchestrator-spike-art-chain.md`.

One commit existed before the run — the brief at `ce7e5f2`, written and twice
amended by the Orchestrator under the write gate. The executor verified it on
disk and did not touch it except where the owner ordered an amendment.

## Commits

```
6f82333  docs(tasks): add run instructions for the art-chain probe   (57 chars)
c14c0a7  docs(tasks): add the art-chain probe script                 (43 chars)
ce7e5f2  docs(tasks): add brief for 2026-08-12-spike-art-chain       (53 chars)
```

Three, matching the brief's declared commit sequence exactly. All verbs on the
allowlist, no trailers, no `--no-verify`. **No `STATE.md` was ever created** (D8),
so no `chore(state):` commit exists — the brief closed that judgment call in
advance precisely so an unpredicted fourth commit could not appear.

`git diff --stat origin/main...HEAD`: 3 files, 1070 insertions, all inside
`docs/tasks/2026-08-12-spike-art-chain/`.

## The one checkbox that was not met

`grep -c "" probe.mjs reports ≤ 240` **failed at 379.**

The executor compressed twice (507 → 430 → 379), then stopped and reported the
gap at Pause 2 with three options rather than cutting further into the "why"
comments. The owner ruled option A: raise the cap to 400. The reasoning is that
240 was an Orchestrator estimate and **no rule measures this file** — R5 governs
source, and `architecture-guard`'s `V2_SOURCE` matches only `packages/**`
TypeScript. Option B (strip comments) would have traded R8 for an invented
number; option C (split the file) would have added structure to a throwaway to
satisfy a self-imposed cap.

The brief was amended inside `c14c0a7`, so it never contradicted the file it
specifies, and re-validated at 11/11 after the amendment. Final count 382.

**This is a corrected brief, not a passed check.** Recording it as a clean pass
would misrepresent the evidence.

## What the executor caught that the brief had wrong

- **A stale line the Orchestrator had reviewed three times.** The owner ordered
  only the checkbox raised; the executor also found `Target ≤ 200 lines` in the
  same Edit-2 paragraph — left behind by an earlier 200 → 240 bump — and fixed
  both, flagging the extra touch rather than making it silently. Keeping only the
  checkbox would have reproduced the exact contradiction it was told to avoid,
  with a wider gap.
- **A gap in S1's own definition.** S1 requires the brief be obtained "under a
  **named** scope set", and the brief never said what makes it named. The
  executor added a header line printing `DRIVE_SCOPES`, which is that.
- **An unnamed failure path.** The brief did not say what happens when the render
  fails. The executor made exit ≠ 0, zero PNGs, or a missing `editables/spec.json`
  record S3 as FAIL and exit 1, rather than walking into an upload with nothing to
  upload.

## Judgment calls surfaced rather than buried

1. `templatesRoot = dirname(--template)` — the brief hands one template repo but
   stage 6 needs the root. This is the layout `render.mjs` itself assumes. The
   chosen manifest then wins over `--template`, which closes a hole the brief did
   not see: `spec.template` and the served directory cannot disagree.
2. Three additive output lines: the scopes header, `[match] chosen=`, and a
   `(re-render for D5)` label so the two renders are distinguishable.
3. A `§1` precondition beyond the brief's seven mandated sections — `render.mjs`
   drives the installed Chrome or Edge over CDP, so the render half needs a
   desktop with one present. The brief treated an installed browser as given,
   which does not hold in a document written to outlive this worktree.

All four (including the render-failure path) were approved rather than reverted.

## Two things written better than the brief asked

- **§6 catches that the consent-flow authorization URL embeds the client id** and
  must therefore not be pasted. The brief's hygiene list named the brief body, the
  token and the credential files, and missed it.
- **§5 states that a 404 with the file plainly visible in the Drive UI is the 046
  D7 gap confirmed, not a bug.** That is the non-obvious part of `drive.file`: it
  hides what the app did not create behind a 404 rather than a 403. A reader
  without that would hunt for the wrong file.

## Verification: execution versus reading

**Proved by running a command and reading its output:** `node --check` exit 0;
the no-flag path exiting 2 while naming all six flags and all three env vars;
`grep -c ""` at 382; the R1 path grep empty; the `ATATT|GOCSPX-` grep empty;
`npx tsc -b` exit 0 and `npm test` at 324 (323 pass, 1 skipped) + 112 pass before
both Pause 3s; `validate-brief.mjs` at 11/11; the three `dist` entry points
resolving with the exports used, and `google.auth.OAuth2#request` existing —
checked live, not assumed.

**Proved by reading only, because the probe was never run:** the `manual` path
exiting 0 (which is what the brief prescribes for that checkbox); no brief body
reaching a print call; and **every stage's live behaviour**. S1 through S5 are
unmeasured until the owner runs it. That is the brief's design, not a shortfall.

## Push status

**Not pushed by the executor.** No `git push` ran during the run;
`git ls-remote --heads origin docs/spike-art-chain` returned nothing at the end
of it. The push and the PR happened afterwards, on the owner's explicit
per-branch instruction.

## Out-of-scope observation, reported and not acted on

`DriveFilesApi` in `packages/adapter-drive/src/client.ts` has four calls and no
export primitive, so the probe reaches `files.export` through the authorized
client the adapter returns. That is not a workaround to tidy — it is the direct
evidence that the port needs `resolveItem` and `exportFileText`, which is a later
brief. Recorded in `run-instructions.md` §7.

## Suggested next step

The owner runs pass 1 against `MC-1073960` using `run-instructions.md` §4, then
authors `notes.md` in the same folder with the measured numbers. The highest-value
line in that run is stage 3's `mimeType`: it decides whether the copy is a native
Doc or an uploaded binary, and therefore whether the chain needs a conversion step
at all.
