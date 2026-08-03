# Session recap — 2026-08-02 — 047-adapter-drive (executor)

**Mode:** executor run — pipeline path (planner-authored brief,
brief-validator APPROVED; the brief landed as commit #1 `e9aec85` from
the **planner**, not from an executor and not via caminho B). Run in
**two executor invocations** against the same branch: invocation 1
delivered Edits 2-5, invocation 2 delivered Edits 6-10 plus the evidence
round. The executor role therefore owns commits #2-#10 — nine.
**Brief:** `docs/tasks/047-adapter-drive/brief.md` (Category L, Plan
required: yes), branch `feat/adapter-drive`, base `d8426ce`, executed in
the session worktree.
**Pairs with:** the Orchestrator 047 recap in this same PR.

**Provenance of this log.** Invocation 2 wrote it. Invocation 1's facts
are reconstructed only from what is verifiable — its five commits, their
diffs, the task artifacts, and the handoff it left. Where a detail of
invocation 1 could not be verified from those sources it is marked
rather than asserted; its Pause-by-Pause transport record lives in its
own turn history, not here.

## Run shape

- Pause transport: STOP-and-return, single-block presentations; owner
  approvals relayed as continuation messages. Zero Pauses crossed
  without an explicit relayed go, in either invocation.
- **Pause 1** was satisfied once, in invocation 1 (`Plan required: yes`);
  invocation 2 opened on specified work and did not re-plan. **Pause 2**
  fired in invocation 1, on its first modified file; which Edit it landed
  in is not verifiable from invocation 2's context. **Pause 3** before
  every executor commit, **nine** times — four in invocation 1 (#2-#5),
  five in invocation 2 (#6-#10). Commit #1 was the planner's and this
  recap's own commit is not counted: its Pause 3 is the tenth and lies
  outside the run this log describes.
- Evidence-closes pasted verbatim (`git log --format=%B -1`) in the
  turn's final message block after each executor commit; **9/9** matched
  the approved subjects, zero drift, zero amends. Invocation 1 handed over
  with zero evidence debt; invocation 2 opened no Pause over an
  outstanding close.
- Green boundary before every Pause 3: `npm run build` (tsc -b) exit 0
  and the full `npm test` suite. Counts as they moved: **257** (base,
  carried from the 046 run) → **286** after Edit 4 → **297** after
  Edit 5, unchanged through Edits 6-10. Corroborated by test-case count
  in the new files: credentials 11 + errors 10 + query 8 = 29 (257+29 =
  286), gateway 11 (286+11 = 297).
- The pre-commit hook is not wired in this clone, so build and tests were
  run manually before each of the nine Pause 3s.
- D3 execution model: the executor authored the smoke and interpreted its
  output; the executor ran no OAuth flow and no Drive call in either
  invocation. No credential material entered the repo or the chat.
- `STATE.md` not used: it sits outside the brief's constraint-1 path
  list, whose structural check requires the branch diff to contain only
  listed paths.

## Execution log

### Edit 1 — pre-satisfied, not re-run

Verified as already landed as `e9aec85`
`docs(tasks): add brief for 047-adapter-drive`, committed by the planner
on the pipeline path. No executor Pause 3 and no evidence-close belong to
it; invocation 2 did not re-verify or re-commit it.

### Invocation 1 — Edits 2-5 (commits #2-#5)

Recorded from the commits and artifacts; see the provenance note above.

- **Edit 2** — `DriveGateway` port revised in `@saci/core` to five
  primitives plus `DriveItem`; `uploadFolder`, `readManifest`, the
  `TaskManifest` import and the `TODO(2026-06-06)` removed; `DriveItem`
  exported from `index.ts`.
  → commit `6a2f128`
  `refactor(core): declare DriveGateway as five drive primitives`
  (2 files, +28/−13)
- **Edit 3** — `@saci/adapter-drive` scaffolded (package.json, tsconfig,
  placeholder `index.ts`), root `tsconfig.json` reference added,
  dependencies installed at the exact pinned versions
  `googleapis@173.0.0` and `google-auth-library@10.9.1` (D7). Lockfile
  drift was the carved-out, intended kind (constraint 8).
  → commit `a311ac3`
  `feat(adapter-drive): add package scaffold and dependencies`
  (5 files, +568/−49, of which `package-lock.json` is +587/−…)
- **Edit 4** — pure modules and their tests: `constants.ts`,
  `credentials.ts` + 11 tests, `errors.ts` + 10 tests, `query.ts` + 8
  tests.
  → commit `e3a4dbd`
  `feat(adapter-drive): add credential, error and query modules`
  (7 files, +682)
- **Edit 5** — the implementation: `client.ts` (the injected
  `DriveFilesApi` seam), `auth.ts` (OAuth loopback flow, token
  persistence, refresh persistence), `gateway.ts` + 11 tests against a
  fake, and the public `index.ts` with `createDriveGateway`.
  → commit `27aa2fe`
  `feat(adapter-drive): add the DriveGateway implementation`
  (5 files, +666/−3)

**Edit 5's dual-copy `OAuth2Client` trap.** `tsc` rejected
`google.drive({ version: "v3", auth })` with `TS2769`, then fell back to
the `drive_v2` overload so the error read as a Drive API version
mismatch rather than a types problem. Cause: `googleapis@173.0.0` asks
`google-auth-library@^10.2.0` while its transitive
`googleapis-common@8.0.3` pins `10.5.0` exactly, so the tree carries two
copies (`10.9.1` root, `10.5.0` nested); `OAuth2Client`'s private field
makes them nominally incompatible. Resolved **cast-free** with
`type DriveAuthClient = InstanceType<typeof google.auth.OAuth2>` —
deriving the type from the copy googleapis itself uses. Later recorded
as `G-DRIVE-2` in Edit 7.

### Invocation 2 — Edits 6-10 (commits #6-#10)

- **Edit 6** — `oauth_client.json` and `token.json` added to
  `.gitignore`, inserted after the `config.json` anchor rather than at
  end-of-file. `git check-ignore -v` confirmed both rules
  (`.gitignore:7`, `:8`).
  → Pause 3 #6 (audit 5/5 PASS) → commit `45f78a6`
  `chore: add Drive credential files to gitignore`
  → evidence-close confirmed.
- **Edit 7** — `G-DRIVE` category row plus **two** entries: `G-DRIVE-1`
  (scope change silently reuses the old grant) per the brief, and
  `G-DRIVE-2` (the dual-copy trap above) by owner authorization. Both in
  the file's four-field paragraph format; 25 insertions, 0 deletions, no
  existing entry modified. The version facts in `G-DRIVE-2` were read
  from the installed tree at write time, not recalled.
  **Subject changed by explicit owner approval at Pause 3.** The brief's
  `docs(gotcha): add G-DRIVE-1 — scope change needs token delete` would
  have named one of two entries, hiding the dual-copy trap from anyone
  bisecting for it (G-R4). The executor flagged it and proposed
  alternatives; the owner chose the one committed.
  → Pause 3 #7 (audit 5/5 PASS) → commit `e498ed3`
  `docs(gotcha): add G-DRIVE-1 and G-DRIVE-2 Drive adapter traps`
  → evidence-close confirmed.
- **Edit 8** — `drive-smoke.mjs` and `run-instructions.md`. **Three
  revisions before it landed**, each from an owner ruling at Pause 3:
  1. *Revision 1* — six labeled steps over the five primitives through
     the built adapter, targets via CLI args or env vars only, cleanup
     ids printed (the port has no delete primitive), plus the
     owner-facing procedure (Internal + Desktop app per D6, never-paste
     list, partial-result reading). Flagged: §5 asked the owner to delete
     the authorization-URL line at paste time.
  2. *Revision 2* — owner ruling: redact the URL at the source rather
     than rely on manual discipline. Implemented entirely in the injected
     `AuthorizeLog` sink (`createDriveGateway({ log })`) — no product
     code touched: the URL is written to a temp file and only its path is
     printed, with a `REDACTION FAILED` marker and the raw URL if the
     write fails.
  3. *Revision 3* — owner ruling: also suppress the adapter's "open the
     URL below … it carries the client id" preamble, but only when the
     redaction succeeded. Implemented by holding that line one line and
     dropping it on success, flushing it on failure and at the end of
     authorization so nothing is ever silently swallowed.
  **Bug found in revision 2 while producing the literal transcript:** the
  `REDACTION FAILED` marker printed from inside the write helper, i.e.
  *above* the flushed preamble, so "do not paste the next line" pointed
  at prose while the URL sat two lines down — the exact misdirection the
  marker exists to prevent, on the only path where a real URL is on
  screen. Fixed by returning the failure reason instead of printing it,
  so the caller orders preamble → marker → URL. Both paths were then
  exercised live with a placeholder client and no token (URL built
  locally, process killed before any token exchange): success path prints
  four lines with no preamble and no URL; failure path prints preamble,
  marker, then the URL.
  → Pause 3 #8, three presentations (audit 5/5 PASS each) → commit
  `81dc7c2`
  `docs(tasks): add drive smoke script and run instructions for 047`
  → evidence-close confirmed.
- **Evidence round** — 6/6 steps PASS, exit code 0, node v24.15.0 on
  win32, 2026-08-02. **Provenance:** the smoke was run by the
  **Orchestrator session on the owner's Windows machine under explicit
  owner instruction** — a deliberate deviation from D3's owner-run model,
  authorized in-session. Credential placement stayed with the owner
  (`oauth_client.json` and `token.json` placed by hand in `~/.saci/`).
  The executor ran nothing and recorded nothing outside the transcript.
  `createFolder` is live-evidenced for the first time in the project
  (step 4) — the reason the round existed. No revision round was needed;
  no `fix(adapter-drive)` commit was required.
- **Edit 9** — `notes.md`: transcript verbatim, per-primitive evidence
  table, four readings (createFolder newly evidenced; the unattended
  refresh worked, the printed expiry being in the past; the run does
  **not** close the Internal-mode longevity watch item, day 6 not
  discriminating Internal from a 7-day cap; the URL-redaction path never
  fired and stays unexercised against a real consent), the R2 paragraph
  transcribed per D8, the brief-045 supersession record, two watch items,
  six carry-forward observations including the accepted A8 exception for
  the sink's module-level `heldPreamble`.
  → Pause 3 #9 (audit 5/5 PASS) → commit `0f317c2`
  `docs(tasks): add drive adapter smoke evidence note for 047`
  → evidence-close confirmed.
- **Edit 10 — not in the brief.** Authorized by the owner in-session to
  reconcile the two canonical docs this task made stale: `CLAUDE.md`
  gains the `@saci/adapter-drive` package entry (+1 line), and
  `docs/ROADMAP.md` loses two now-false present-tense claims (the map
  row's "port interface with TODOs, no `adapter-drive`" and the Phase-3
  bullet's "JS library not yet researched (Pending decision)"). No
  freshness stamp bumped, no untouched paragraph reflowed. Three
  sentences asserting the adapter is unwired were kept deliberately, each
  naming `ship` so the ship brief's grep finds them. `CLAUDE.md` R25's
  adapter list was reported as a candidate and **not** touched — the
  authorization covered the Architecture section only.
  Subject proposed by the executor with its verb ranked against the
  `ALLOW=` line (`update` over `document`: the ROADMAP clauses were
  false, not merely unrecorded) and approved.
  → Pause 3 #10 (audit 5/5 PASS) → commit `7aa54af`
  `docs: update architecture and roadmap for @saci/adapter-drive`
  → evidence-close confirmed.

## Structural checks that could not be satisfied as written

Three, all reported rather than worked around:

1. **Secret sweep** — the brief's
   `grep -rnE "GOCSPX|ya29\.|\"refresh_token\"|\"client_secret\""` cannot
   return nothing: it matches `brief.md:602`, which *is* the sweep
   command, and `credentials.ts:118`, where `"client_secret"` is the JSON
   field name the parser reads. A third self-referential hit appeared in
   `notes.md` when that bullet described the second. All three are
   benign; the note names all three rather than rewording prose to make
   the sweep look clean.
2. **Library grep** — Edit 5's
   `grep -rn "googleapis\|google-auth-library" packages/adapter-drive/src/`
   also matches the two `googleapis.com` scope URLs in `constants.ts` and
   three prose comments. Only `client.ts` and `auth.ts` import either
   library, which is what the check meant. Recorded in `notes.md` as an
   observed pattern for the ship brief: structural greps must anchor on
   `^import` or require a value after the colon.
3. **Two-dot vs three-dot** — the brief's
   `git diff --name-only main..HEAD` now lists brief 048's files, which
   merged into `main` after this branch forked. Every Pause 3 used the
   merge-base form `main...HEAD` (equivalently `d8426ce...HEAD`), which
   returns exactly this task's files.

## Evidence summary

- pre-commit-self-audit, invocation 2: **35 PASS / 0 WARN / 0 FAIL** —
  seven runs of five checks for five landed commits (commit #8 audited at
  each of its three presentations; commits #7 and #10 audited multiple
  candidate subjects, all PASS). Invocation 1 reported its own audits
  clean for commits #2-#5; that outcome is carried from its handoff, not
  re-verified here.
- Evidence-closes: **9/9** verbatim against the approved subjects (the
  executor's commits #2-#10); zero drift, zero amends.
- Live evidence: five primitives, six steps, one round, 6/6 PASS —
  `resolveFolder`, `findChild` (present **and** absent), `createFolder`
  (new), `uploadFile`, `readFileContent` (58 bytes round-tripped).
- Scope: `git diff --name-only main...HEAD` = 26 files, all inside the
  brief's constraint-1 list except `CLAUDE.md` and `docs/ROADMAP.md`,
  admitted solely by the Edit-10 authorization. Nothing under
  `packages/cli/**`, `packages/adapter-jira/**`,
  `packages/adapter-sheets/**`, `harness/**`, or `.claude/**`. No
  credential file, `dist/`, or `node_modules/` tracked.
- Diff stats: 26 files changed, 3451 insertions(+), 66 deletions(-)
  (`d8426ce...HEAD`).
- Final green: build PASS, `npm test` 297 pass / 0 fail.
- Unmet checkboxes: none. Two qualifications recorded in `notes.md` §6
  (the three-dot correction; the two canonical docs the brief defers).
- Not claimed anywhere by this task: that the cross-user content read
  works or fails, or that Internal-mode no-cap behavior is confirmed.
- `git status` clean at run end. **No `git push` executed** (G-R5/R17);
  no PR opened; no remote branch contains HEAD. Push belongs to the
  `closer` role's Phase B on the owner's explicit instruction.

## Notes

- Per the recap policy, this recap cannot cite its own commit or the
  session PR's merge SHA; the next session confirms via P4 / `git log`.
