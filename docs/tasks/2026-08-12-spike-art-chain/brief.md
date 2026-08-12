# Brief: 2026-08-12 — Spike the Jira → brief → art → Drive chain

> **Category:** L
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/spike-art-chain`

---

## Context

The product goal added on 2026-08-12 is to generate finished art from a Jira
task automatically: pull the card, resolve its brief, render PNGs from a
pre-built HTML template, upload to Drive. Three of the four pieces already
exist and none of them are joined. `adapter-jira` fetches issues and resolves
`copy_url`. `adapter-drive` has five live-verified primitives and is wired to
no command. `D:\Projects\suindara` renders deterministically from a spec with
zero npm dependencies, driving the machine's installed Chrome over CDP.

Nobody owns the seam between them, and the seam is where every unknown lives.
This spike measures it end to end on one real card before any production code
is written, following the brief 046 precedent: an out-of-tree probe that
produced `docs/explorations/drive-oauth.md`, which was then promoted to brief
047.

**Class.** Category L, research — the deliverable is measurement, not behavior.

**Size note.** This brief is caminho B but not doctrinal — it creates no rules
and rewrites no doctrine. It runs long for a research task because the probe's
step list is its specification, and a probe whose steps are left to judgment
measures something other than what was asked. It does not split: the probe and
its run instructions verify each other, and a sub-brief shipping the script
without the instructions would close on incomplete evidence.

## Goal

Prove, or disprove, that a real Jira card can be carried to rendered PNGs in
Drive using only the adapters that already exist plus the Suindara host. Record
what actually happened, with numbers, in a note that a later brief can be
promoted from.

Out of scope:

- **No production code.** Nothing under `packages/` is created or modified.
- **No new port, no new adapter, no new CLI command.** Those are later briefs
  and must be designed from this spike's evidence, not ahead of it.
- **No writes to Jira.** No transition, no comment. `JiraGateway` is read-only
  today and a spike must not mutate a live board.
- **No changes to `D:\Projects\suindara`.** The missing `diagnostics.json` is a
  finding this spike records, not a fix it applies.
- **No Drive folder-tree policy.** `ship`'s verify-never-create walk is a later
  brief. The probe uploads into one throwaway folder given to it.
- **No container, no Linux, no font licensing.** Windows only.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   - `docs/tasks/2026-08-12-spike-art-chain/brief.md`
   - `docs/tasks/2026-08-12-spike-art-chain/probe.mjs`
   - `docs/tasks/2026-08-12-spike-art-chain/run-instructions.md`

   If anything else needs changing, **STOP and ask**.
2. Follow all rules in `CLAUDE.md`, especially R1 (no hardcoded paths — every
   machine-specific path arrives as a flag), R4 (no silent catch), R7 (named
   constants), R8 (comments say why), R9 (English on this surface).
3. Follow `docs/GIT_WORKFLOW.md` fully:
   - Branch: `docs/spike-art-chain` (already created at `2d43122`)
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
4. **Credential hygiene is binding, not advisory.** The probe never prints a
   brief body, never prints a token, never writes a real brief into the repo.
   See D6.
5. The probe is a script, not a package. It is never imported, never added to
   any `tsconfig`, never referenced by `npm test`.

### Conventions

- English on every surface this brief touches (R9).
- Commit type `docs`, scope `tasks`.
- Output lines are prefixed by stage in square brackets — `[jira]`, `[drive]`,
  `[norm]`, `[match]`, `[render]`, `[pkg]`, `[det]`, `[upload]`, `[jira-close]`
  — matching the 046 probe's shape so two probes read alike.

### Architectural decisions already made (do not revisit)

#### D1 — The probe imports the compiled adapters; it does not reimplement them

It runs from the repo root and imports
`packages/adapter-jira/dist/index.js` and
`packages/adapter-drive/dist/index.js`. Brief 046 ran fully out-of-tree for
credential hygiene; that reason does not apply here, because credentials still
arrive from env and `~/.saci` either way. Reimplementing Jira and Drive access
would prove a chain Saci does not have.

Consequence: `npm run build` must succeed before the probe runs, and the
worktree must have its own `node_modules` (G-NODE-2).

#### D2 — The read branches on mimeType, and text is verified rather than assumed

Two read paths exist and the `mimeType` picks between them.
`DriveGateway.readFileContent` is `files.get({ alt: "media" })`
(`packages/adapter-drive/src/client.ts:98`), which Drive rejects for native
Docs Editors files — those need `files.export`. A file that was *uploaded*
rather than created in Docs is the mirror case: `alt=media` succeeds and
`files.export` fails.

Measured on 2026-08-12 against `MC-1073960`: `copy_source=sister`, and the
resolved URL ends in `rtpof=true&sd=true` — the signature of a file uploaded
and converted on open, most plausibly a `.docx`. The uploaded case is therefore
not hypothetical, and may be the common one. Only the `mimeType` from step 3
settles it, which is why that step exists.

This matters more than the 403 does. A native Doc read with `alt=media` fails
loudly and stops. An uploaded `.docx` read with `alt=media` **succeeds** and
returns ZIP bytes that are not text — the brief would flow downstream as garbage
and produce plausible-and-wrong art. A success carrying the wrong content is the
worse failure, so the probe verifies that what it received is text and never
infers it from an exit code.

The scope question is unchanged and remains the highest risk on either path: the
file is authored by a copywriter, and
`docs/tasks/046-spike-adapter-drive/notes.md` (D7) records cross-user content
access under `drive.file` as explicitly untested. The probe reaches this at step
4 and stops there, rather than discovering it after the render works.

#### D3 — Template and brand are passed as absolute paths, and `cwd` is set

`D:\Projects\suindara\tools\render.mjs:35` resolves the sibling template with
`resolve('..', 'suindara-tmpl-' + id)` and line 334 resolves the brand pack as
`brands/<id>.json` — both relative to `process.cwd()`. A spawn from any other
directory silently resolves the wrong template. The probe passes `--template`
and `--brand` as absolute paths **and** sets `cwd` to the Suindara root. Belt
and braces, deliberately.

#### D4 — The probe never mutates Jira

Step 12 reads the available transitions and prints the comment it *would* post.
It posts nothing and transitions nothing.

#### D5 — Determinism is measured through the spawn boundary, not inside Suindara

Suindara already proved 11/11 byte-identical PNGs internally. What is unproven
is whether that survives Saci spawning it as a subprocess. Step 10 re-renders
from the package's own saved spec into a second directory and compares hashes.

#### D6 — Copy is sensitive; the probe prints metadata, never content

`D:\Projects\suindara\PORTING.md` §8 treats unpublished campaign copy as
sensitive. The probe prints only `bytes=`, `lines=`, a `firstLine=` truncated to
60 characters, and `sha256[0..12]`. No brief body reaches stdout, and no real
brief is written anywhere under `docs/`. The rendered PNGs and the brief text go
to a scratch directory outside the repo, given by `--out`.

#### D7 — Match is evaluated with categorical rules, not a numeric score

Count `strong` / `medium` / `weak` hits per template and report the counts and
the hits. No weighted score. The reason is that the decision must be explainable
to a designer — "matched `/^\s*L\d+\s*:/` (strong)" is a reason; "scored 7" is
not. `alpha` status never yields a deterministic match on its own.

Known fragility to record, not to design around: the only `strong` signal of
the only production template is `^\s*L\d+\s*:`, and `D:\Projects\suindara\docs\BRIEF.md`
§5 R9 forbids copy from numbering frames. The probe reports how many times it
fired so the fragility is measured rather than assumed.

#### D8 — `STATE.md` is not required and must not be created

The executor's rule is conditional, not automatic: a Category L task needs
`STATE.md` only when it spans multiple sessions or carries structural
complexity (G-R10). This task is neither — three files in one directory, three
commits, one session. Briefs 046 and 047 are both Category L and neither
carries one.

Creating it anyway would add a `chore(state):` commit the "Commit sequence"
below does not list, and the mismatch surfaces as a scope divergence at Pause 3.
Do not create `STATE.md`. If the task unexpectedly spans a session boundary,
**STOP and report** rather than introducing it mid-flight.

#### D9 — The spike runs in two passes, and the first one does not render

The brief half and the render half need different cards. Pretending one card
does both would stall the run at step 6 and report a working pass as a failure.

**Pass 1** answers the read and scope questions, using a card with a resolved
`copy_url`. `MC-1073960` is verified for this (parent `MC-1073953`,
`vertical_raw = [EC] Geral`). Its summary is
`Anúncio Estático - Lâmina Única`, which matches neither installed template —
`carrossel-concursos` is 2-20 frames and `agenda-semana` is a paginated weekly
agenda. Pass 1 is therefore expected to reach a `manual` match decision and stop
there: S1 and S2 measured, S3-S5 not.

**Pass 2** answers the render question, using a card whose copy is actually a
carousel. Choosing that card is owner work and is not part of this brief.

Consequence for the probe: after step 6 it must treat "no template applies" as a
**successful, reportable outcome** — exit 0, with S3-S5 printed as
`not measured`. Treating it as an error would report a working pass 1 as broken.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The Orchestrator pre-saved this brief to disk before the executor was invoked
(caminho B). The executor verifies presence and commits.

- [ ] Directory `docs/tasks/2026-08-12-spike-art-chain/` exists
- [ ] File `brief.md` exists; first line is
      `# Brief: 2026-08-12 — Spike the Jira → brief → art → Drive chain`
- [ ] `git add docs/tasks/2026-08-12-spike-art-chain/brief.md` is staged
- [ ] Commit #1 created

If the file is missing or the first line does not match, **STOP and report**.
Do not regenerate the brief from memory.

Commit: `docs(tasks): add brief for 2026-08-12-spike-art-chain`

### Edit 2 — Author `probe.mjs`

Create `docs/tasks/2026-08-12-spike-art-chain/probe.mjs`. No line budget — see the
checkbox below for why the one this brief carried was removed.
Node 22 ESM, no dependency outside `node:*` and the two compiled adapters.

Flags, all required except where noted:

```
--key <JIRA-KEY>            the card to carry
--suindara <abs path>       Suindara host root
--template <abs path>       the template repo directory
--brand <abs path>          the brand pack json
--out <abs path>            scratch directory, OUTSIDE the repo
--drive-folder <folder id>  a throwaway Drive folder
--force                     optional; passes through to render.mjs
```

A missing flag is named individually in the error (the `cli.ts` env-check
pattern), and the probe exits 2.

The twelve stages, in order. Each prints at least the line shown:

1. **Jira.** `verifyCredentials()`, then `fetchIssueByKey(key)`.
   `[jira] <KEY> vertical_raw="..." copy_source=<sister|parent|fallback> copy_url=<url|none>`
   A `copy_source` of `fallback` means no copy URL; print
   `[jira] no copy_url — verdict NO-BRIEF` and exit 1.
2. **URL → file id.** Inline, ~10 lines, the future `parseDriveFileId`. Handles
   `docs.google.com/document/d/<ID>`, `drive.google.com/file/d/<ID>`,
   `drive.google.com/open?id=<ID>`, and **recognizes**
   `drive.google.com/drive/folders/<ID>` in order to refuse it — a folder link
   is a plausible paste and reading it as a brief fails confusingly.
   `[url] kind=<doc|binary|folder|unknown> id=<id>`
3. **Drive metadata.** `files.get` for `mimeType`.
   `[drive] mimeType=<mime>`
4. **The read experiment (D2).** Branch on the `mimeType` from step 3 — never
   try both blind:
   - **native Docs Editors** (`application/vnd.google-apps.*`):
     `files.export` with `text/plain`. `alt=media` is not attempted; it is known
     to fail here and the attempt would teach nothing.
   - **anything else**: `files.get alt=media`, then **verify the payload is
     text** before treating it as a brief. Reject when a NUL byte appears within
     the first `TEXT_PROBE_BYTES` (8192), or when the printable ratio of that
     window is below `MIN_PRINTABLE_RATIO` (0.85). A `.docx` is a ZIP and fails
     both.
   - **either path failing on permissions**: print the verbatim Google error,
     then `[drive] verdict SCOPE-BLOCKED` plus the instruction to delete
     `~/.saci/token.json` before widening `DRIVE_SCOPES` (G-DRIVE-1: a scope
     change silently reuses the old grant), and exit 1.
   - **`alt=media` succeeding with non-text**: print
     `[drive] verdict BINARY-NOT-TEXT mimeType=<mime>` and exit 1. A distinct
     verdict from `SCOPE-BLOCKED` on purpose — the grant worked and the content
     is unusable, which is a different problem with a different fix (convert the
     doc to a native one, or add a conversion step to the chain).

   `[drive] path=<export|media> -> <ok|HTTP nnn>`
   `[drive] textCheck=<pass|fail> printableRatio=<n.nn> nulByte=<true|false>`
5. **Transport measurement.** Count, then normalize (strip BOM, `\r\n`→`\n`,
   `\r`→`\n`, NBSP→space) and write `brief.txt` into `--out`.
   `[norm] bom=<true|false> crlf=<n> nbsp=<n> lines=<n> bytes=<n> sha256=<12>`
   `[norm] firstLine="<= 60 chars>"`
   `[norm] strongSignalMatches=<n>`  (count of `/^\s*L\d+\s*:/m`)
6. **Match.** Read every `<templatesRoot>/suindara-tmpl-*/template.json`,
   evaluate `match.signals` against `{ brief, summary, labels: [] }` — `labels`
   is empty because `Issue` carries no labels field — and print one row per
   template plus the decision.
   `[match] <id> strong=<n> medium=<n> weak=<n> status=<s> -> <deterministic|suggested(<reason>)|manual>`
   An invalid regex in a manifest throws, naming the template and the signal
   index (R4: never a silent skip, which would downgrade a deterministic match
   to a manual prompt with no explanation).

   When the decision is `manual` — no template applies — the probe prints
   `[match] no template applies; stopping before render (D9 pass 1)`, prints the
   S-criteria table with S3-S5 as `not measured`, and **exits 0**. This is the
   expected pass-1 outcome and is not an error.
7. **Spec.** Write `spec.json` into `--out`.
   `[render] spec=<path> template=<id> brand=<id> task=<KEY>`
8. **Render.** `spawn(process.execPath, [<suindara>/tools/render.mjs, '--spec',
   <abs>, '--template', <abs>, '--brand', <abs>, '--out', <abs>], { cwd:
   <suindara>, stdio: 'inherit' })`.
   `[render] exit=<n>`
9. **Package verification.**
   `[pkg] pngs=<n> editables/spec.json=<yes|no> diagnostics.json=<yes|no>`
   and one `sha256[0..12]` per PNG. The `diagnostics.json=no` line is the
   evidence for the upstream change Suindara needs; it is expected to be `no`.
10. **Determinism through the boundary (D5).** Re-run step 8 from
    `<out>/editables/spec.json` into a second directory; compare hashes.
    `[det] <n>/<n> identical`
11. **Drive upload.** Upload each PNG plus `editables/spec.json` into
    `--drive-folder` via the built adapter; print each returned id. Also print
    the segments `derivePath` **would** use — computed, never created.
    `[upload] <name> -> <id>` and `[upload] derivePath=<a>/<b>/<c>`
12. **Jira close, read-only (D4).** `GET /rest/api/3/issue/<key>/transitions`;
    print ids and names, and the comment body it *would* post.
    `[jira-close] transitions=<id:name, ...>` and `[jira-close] would-comment:` …

The probe ends by printing the five success criteria with a verdict each.

Verification:

- [ ] File exists at the stated path
- [ ] `node --check docs/tasks/2026-08-12-spike-art-chain/probe.mjs` exits 0
- [ ] Running it with no flags exits 2 and names every missing flag
- [ ] `grep -c "" probe.mjs` is **recorded, not bounded.** The budget was estimated three
      times — 200, then 240, then 400 — and was wrong three times, most recently because
      fixing the review findings added error-path structure. No rule measures this file:
      R5 governs source, and `architecture-guard`'s `V2_SOURCE` matches only `packages/**`
      TypeScript. `CLAUDE.md`'s own `E6` rationale applies — a check whose finding has no
      available remedy is worse than no check, because it trains you to ignore checks. The
      count is reported for the record and the judgment stays with the reader.
- [ ] No absolute machine path is hardcoded anywhere in the file (R1) —
      verify `grep -nE "[A-Za-z]:\\\\|/Users/|/home/" probe.mjs` is empty
- [ ] No brief body is ever passed to a print call — every stdout write in
      stage 4 and 5 carries metadata only (D6)
- [ ] `TEXT_PROBE_BYTES` and `MIN_PRINTABLE_RATIO` are module-top named
      constants (R7), not literals at the call site
- [ ] The `manual` match path exits **0**, not non-zero (D9) — verify by
      reading the exit call, since the path cannot be exercised without
      credentials

Commit: `docs(tasks): add the art-chain probe script`

### Edit 3 — Author `run-instructions.md`

Create `docs/tasks/2026-08-12-spike-art-chain/run-instructions.md`, following
`docs/tasks/046-spike-adapter-drive/run-instructions.md` in shape.

It must state, in order:

1. **Preconditions.** `npm install` in this worktree (G-NODE-2: without it,
   `@saci/*` resolves to the main checkout and `tsc -b` fails with errors that
   look like real code breakage), then `npm run build`.
2. **Environment.** `SACI_JIRA_BASE_URL`, `SACI_JIRA_EMAIL`,
   `SACI_JIRA_API_TOKEN`; `~/.saci/oauth_client.json` present.
3. **The three things the owner must choose** and why each matters: the card
   key, the throwaway Drive folder id, and a scratch `--out` directory outside
   the repo.
4. **The invocation**, as one copy-paste block.
5. **The `SCOPE-BLOCKED` path**: what it means, that the fix is a decision and
   not a retry, and that widening scopes requires deleting `~/.saci/token.json`
   first (G-DRIVE-1).
6. **What must never be pasted back into the session or the repo**: the brief
   body, the token, the `oauth_client.json`.
7. **Where the results go**: `notes.md` in this same folder, authored after the
   run, carrying the measured numbers.

Verification:

- [ ] File exists at the stated path
- [ ] Every one of the seven sections above is present
- [ ] The invocation block names every required flag from Edit 2
- [ ] `grep -nE "ATATT|GOCSPX-" run-instructions.md` is empty

Commit: `docs(tasks): add run instructions for the art-chain probe`

### Commit sequence

1. `docs(tasks): add brief for 2026-08-12-spike-art-chain` (53 chars)
2. `docs(tasks): add the art-chain probe script` (43 chars)
3. `docs(tasks): add run instructions for the art-chain probe` (57 chars)

All three ≤ 72 chars (R10). All three use `add`, on the verb allowlist.

### Automated checks (run before each commit)

- [ ] `npx tsc -b` — exit 0
- [ ] `npm test` — green, both `test:packages` and `test:hooks`

Neither is affected by this brief, which touches no compiled source. They run
because the Pause 3 green boundary is unconditional and has no docs-only
exemption.

### Structural checks

- [ ] Exactly three files exist under `docs/tasks/2026-08-12-spike-art-chain/`
- [ ] No file outside that directory was modified — verify via
      `git diff --name-only origin/main..HEAD`

### Behavior checks

The probe is not run as part of this brief. Its execution needs credentials, a
real card key and a Drive folder that only the owner can choose, and the Cowork
sandbox cannot reach `estrategia.atlassian.net` (`docs/explorations/drive-oauth.md`
§8). The run is a separate, owner-driven step using Edit 3's instructions, and
its results land in `notes.md` afterwards.

- [ ] `node --check` passes on the probe
- [ ] The probe's no-flag path exits 2 with every missing flag named

### Git checks

- [ ] Branch used: `docs/spike-art-chain`
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] `Plan required: no` — Pause 1 skipped
- [ ] Pause 2 — first modified file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed commit message
      shown before each commit
- [ ] Staged set confirmed to match the current Edit's scope before each
      Pause 3 submission
- [ ] If any criterion could not be met, it was reported explicitly

## Success criteria for the spike itself

These are measured when the probe runs, not when this brief closes. Per D9 they
are split across two passes, and pass 1 closing with S3-S5 unmeasured is a
success, not a partial failure.

| id | criterion | Pass |
|---|---|---|
| S1 | brief text obtained from the real copy doc, under a **named** scope set, and **verified to be text** | 1 |
| S2 | match reaches a decision on a real card, with the hits that produced it | 1 |
| S3 | `render.mjs` exits 0 and produces N PNGs plus `editables/spec.json` | 2 |
| S4 | re-render from the saved spec is byte-identical **through the spawn boundary** | 2 |
| S5 | PNGs upload to Drive and return ids | 2 |

Pass 1 runs against `MC-1073960`, already verified to resolve a `copy_url`.
Pass 2 needs a card whose copy is a real carousel; choosing it is owner work.

**Resolves:** whether the copy file is a native Doc or an uploaded binary, and
which read path each needs; whether the current grant can read a file the client
did not create; the exact transport-damage delta, with numbers; whether the
coarse spawn boundary carries enough information without parsing stdout; whether
match is deterministic on a real brief and whether the strong signal survives
one.

**Leaves open:** Linux fonts and font licensing; Drive OAuth on a headless
server; Jira write-back; `ship`'s folder-tree policy; per-entity assets
(`carrossel-concursos` declares `assets.kind: "none"`, so that whole path is
untested here); the panel-assisted mode.

## Pause points

- **Pause 1:** skipped (`Plan required: no`).
- **Pause 2:** after `probe.mjs` is fully written, before Edit 3. Always required.
- **Pause 3:** before each of the three commits. Always required.

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report.
- Undocumented gotcha discovered → report; document as a follow-up brief.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

- Every file is specified above with its exact path, and the probe's twelve
  stages are enumerated with their required output lines.
- All architectural decisions are closed (D1–D9).
- The judgment calls have explicit fallbacks: a missing flag exits 2, an absent
  `copy_url` exits 1 as `NO-BRIEF`, a failed export exits 1 as `SCOPE-BLOCKED`,
  an invalid manifest regex throws.

Pause 2 and Pause 3 remain required regardless (`docs/AGENT_PLAYBOOK.md`
Lesson #6).

## Reference documents (read before starting)

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — G-NODE-2 (worktree resolution), G-DRIVE-1 (scope change
   reuses the grant), G-JIRA-1 (Jira errors are localized; key on status codes)
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2, Lesson #6
5. `docs/tasks/046-spike-adapter-drive/` — the precedent: `drive-probe.mjs`,
   `run-instructions.md`, `notes.md` (especially D7)
6. `packages/adapter-drive/src/client.ts` — `getText` and its `alt: "media"`
7. `D:\Projects\suindara\docs\CONTRATO.md` — the spec and manifest contract
8. `D:\Projects\suindara\tools\render.mjs` — the CLI being spawned

## Expected output (end of session)

1. Branch name and `git log --oneline main..HEAD`
2. `git diff --stat origin/main...HEAD`
3. Any verification checkbox that could not be met, with explanation
4. Confirmation that no `git push` was executed
5. Suggested next step
