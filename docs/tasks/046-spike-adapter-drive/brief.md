# Brief: 046 — Google Drive access spike for adapter-drive

> **Category:** L
> **Plan required:** no — see "Plan required justification" below
> **Branch:** `docs/spike-adapter-drive`

---

## Context

This is a **directed research spike** on Google Drive access for the future
`adapter-drive` package. No product code is created or modified. The exit
artifact is a **decision note** (`notes.md`) that closes ROADMAP pending
decision #11 (Google Drive JS library) and unlocks the upcoming `ship` MVP
brief (mentor recap 2026-07-27, "Ship decomposition").

The mentor recap classifies this as a Category S research brief; it is
modeled here as a full brief despite that routing label, per the owner's
explicit instruction (mentor recap 2026-07-27, D6). The validator's C2
check requires an M/L header; the header reads L because the encoded
substance (five spike questions, seven closed decisions, five edits with
byte-exact find blocks) genuinely exceeds the M range — the research
nature, not the size class, is what "S" was signaling.

Context inputs (read all before starting):

1. `docs/explorations/drive-oauth.md` — validated OAuth proof-of-concept.
   Consumed per the contract in `docs/explorations/README.md`: the note is
   **possibilities, not spec** — except its credential-hygiene rules (§10),
   which are **binding**.
2. `docs/sessions/2026-07-27-mentor-ship-semantics.md` — D6 (spike scope),
   D3 and D4 (the ship-semantics decisions that spike questions 3 and 4
   serve).
3. `docs/ROADMAP.md` — pending decision #11 (the "Pending decisions" list).
4. `docs/tasks/037-evidence-close-protocol/brief.md` — precedent for the
   owner-runs-locally / evidence-pasted-back execution model this spike
   mirrors.

P4 slot evidence (three sources, checked 2026-07-27):

- `ls docs/tasks/` — highest existing slot: `045-gateway-manifest-shape`.
  Gaps 004-006 (burned, `CLAUDE.md` E5) and 034 are preserved, not free.
- `git log --oneline main` — newest commit `b26ddb7` (PR #106, ship-semantics
  recap) explicitly declares slot 046 free; no reference to any slot above
  045 as taken.
- `CLAUDE.md` E* — E1-E5 are v1-freeze exceptions; none reserves a forward
  slot.

### Spike questions

1. **Auth inventory — ALREADY ANSWERED, do not re-research.** User OAuth
   (Desktop app flow), not Service Account. Settled by
   `docs/explorations/drive-oauth.md` §1, §7 (validated in real execution).
   The decision note records this as a settled input with a pointer.
2. **Node library choice.** Hypothesis: `googleapis` + `google-auth-library`
   (unverified). Alternative: direct REST with raw `fetch`, in the spirit of
   `adapter-jira` (R2 minimal-stack pressure). The OAuth loopback flow must
   be **proven in Node**, not assumed from the Python PoC. The decision note
   weighs dependency footprint vs. implementation cost and picks one.
3. **Minimal viable scope — the central question.** Candidate combination to
   test: `drive.file` + `drive.metadata.readonly` (write only what is yours
   + read structure). Known gap to probe: reading manifest **content**
   written by another user under the same OAuth client ID (`drive.file` may
   not grant it). Fallback if the combination fails: broad `drive` scope
   with containment guaranteed by adapter-level code policy (only
   `derivePath`-produced paths are ever addressed). Also confirm: Drive
   offers no per-subtree OAuth scope (unverified).
4. **Four-operation proof** with the chosen library + scope: (a) resolve a
   folder by ID; (b) verify a child by name (the D3 verify-never-create
   policy depends on this); (c) upload a file; (d) read a file's content.
   Via a **throwaway script** — not product code.
5. **Refresh-token longevity in External + Testing consent mode.** Google
   policy may cap refresh tokens at ~7 days (unverified). Weekly re-consent
   is unacceptable for the unattended designer flow. Verify against Google's
   published documentation first; if the cap is confirmed, the decision note
   evaluates: Internal app (if the GCP project can live in the Estratégia
   org) or publishing the app. A live longevity observation spans days —
   this question closes on documented policy plus a **dated observation
   start**, not on a 7-day wait (see D5).

## Goal

Produce and commit, under `docs/tasks/046-spike-adapter-drive/`, the
throwaway probe script, its run instructions, and the decision note
answering spike questions 2-5; resolve ROADMAP pending decision #11 and
reconcile the stale "Workflow actions" map row; mark the exploration note
as promoted.

Out of scope:

- The `ship` command / MVP brief (next slot, after this spike).
- Any `adapter-drive` package scaffolding.
- The `saci config` write surface.
- Sheets scope / Service Account changes (Python pipeline untouched,
  ROADMAP decision #4 default).
- Editing `docs/explorations/drive-oauth.md` beyond the promotion status
  line + changelog entry (Edit 5).
- Any change under `core/`, `adapter-jira/`, `adapter-sheets/`, `cli/`,
  `packages/**`, or to any `package.json` / lockfile.

## Constraints

### Non-negotiable constraints

1. Only the following paths may be created or modified:
   `docs/tasks/046-spike-adapter-drive/**`, `docs/ROADMAP.md`,
   `docs/explorations/drive-oauth.md`. If anything else needs changing,
   **STOP and ask**.
2. **No product code.** The library evaluation happens inside the throwaway
   script only. Its dependencies are installed ad hoc on the owner's
   machine, in a directory **outside the repo** — never added to the repo
   manifests, never a `node_modules/` inside the repo.
3. **Credential hygiene (binding — `docs/explorations/drive-oauth.md` §10):**
   `oauth_client.json` and `token.json` are never committed, never logged,
   never pasted into chat. The run instructions must tell the owner to keep
   them outside the repo. Script text committed to the repo contains **no
   credentials, no tokens, no client secrets**. If a pasted evidence block
   accidentally contains a secret, STOP: do not echo it back, tell the owner
   to rotate/revoke, and continue only after confirmation.
4. **Execution model:** the Cowork sandbox blocks the relevant network
   paths; all live Google API calls run **locally on the owner's Windows
   machine**. The executor never attempts the OAuth flow or any Drive call
   itself (see D2).
5. Follow all rules in `CLAUDE.md` (especially R9, R10, R16, R17).
6. Follow the Git workflow in `docs/GIT_WORKFLOW.md` fully:
   - New branch: `docs/spike-adapter-drive` — **before Edit 1**, run
     `git switch -c docs/spike-adapter-drive` from the session worktree
     HEAD. Do not work on the `claude/*` worktree branch (fails R11 /
     G-R2 / validator C4).
   - Conventional Commits (G-R3)
   - No `Co-authored-by` trailer (G-A7)
   - Commit freely; **DO NOT push** (G-R5)
7. If the byte-exact find blocks in Edits 4 or 5 do not match the file on
   disk, **STOP and report** — do not adapt silently.

### Conventions

- Brief and all artifacts English-only (R9 — `docs/**` is agent-consumed
  surface).
- Commit scopes: `tasks` for files under `docs/tasks/046-spike-adapter-drive/`,
  `roadmap` for `docs/ROADMAP.md`, `explorations` for the exploration note.
- Named constants at module top of the probe script for policy values
  (SCOPES, folder IDs, file names) per R7.
- No silent `catch` in the probe script (R4) — every failure prints the
  error classification (mirror the taxonomy in the exploration note §6).

### Architectural decisions already made (do not revisit)

#### D1 — Auth mechanism: user OAuth (Desktop app flow)

Settled by the exploration note (§1, §7): the Estratégia Workspace allows
external OAuth Desktop apps; a Service Account cannot see the user's Drive
without per-folder sharing. Do not re-research. The decision note records
this as a settled input with a pointer to the note.

#### D2 — Evidence-round execution model (037 protocol shape)

The executor authors the throwaway script and step-by-step run
instructions; the owner runs them locally on Windows and pastes outputs
back; the executor interprets the evidence and writes the findings. The
executor never runs the OAuth flow or Drive calls. Evidence pastes follow
the 037 evidence-close discipline (final-message rule, single-block
packaging, no-debt precondition).

#### D3 — No product code; ad hoc script dependencies stay off-repo

The spike proves the library in a throwaway script preserved as a
historical record. See non-negotiable constraints 1-2; this decision is
closed, not revisitable at Pause time.

#### D4 — Category L header despite S-like research size

Owner routing (mentor recap 2026-07-27, D6): full brief with an M/L header
(validator C2), the research nature stated in Context. The header reads L
because the encoded substance exceeds the M range. Do not relitigate the
category.

#### D5 — Question 5 closes on documented policy + dated observation start

The decision note cites Google's published refresh-token policy (URL +
quoted excerpt) and records the date the test token was minted as the
observation start. The spike does **not** block on a 7-day live wait; a
longevity follow-up observation is noted in `notes.md` as an open watch
item with its check date.

#### D6 — ROADMAP reconciliation is bundled

Directed by the mentor recap's "Ground-truth notes": the "Product map at a
glance" row for "Workflow actions" is stale (036 shipped
`saci start --local`, smoke-confirmed 2026-07-26). Reconcile that row in
the same ROADMAP edit that resolves decision #11.

#### D7 — Escalation path when the scope probe is inconclusive

If the candidate scope combination fails **and** the broad-`drive` fallback
also proves unworkable, or if the cross-user manifest-content gap cannot be
tested (e.g. no second account available), the decision note records the
gap explicitly — never silently claims it tested — and, if the library +
scope decision cannot close at all, **STOP and report** to the owner
instead of writing an ambiguous note.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

The owner pre-saved this brief before invoking the executor (caminho B).
The executor verifies presence and commits.

- [ ] Branch `docs/spike-adapter-drive` created from the session worktree
      HEAD via `git switch -c docs/spike-adapter-drive` (constraint 6)
- [ ] File `docs/tasks/046-spike-adapter-drive/brief.md` exists; first line
      reads `# Brief: 046 — Google Drive access spike for adapter-drive`
- [ ] `git add docs/tasks/046-spike-adapter-drive/brief.md` staged
- [ ] Commit #1 subject: `docs(tasks): add brief for 046-spike-adapter-drive`

If the file is missing or the first line does not match, **STOP and
report**. Do not regenerate the brief from memory.

### Edit 2 — Author the throwaway probe script and run instructions

Create two files:

**`docs/tasks/046-spike-adapter-drive/drive-probe.mjs`** — standalone Node
script (throwaway, not product code) that:

- Declares `SCOPES` as a named constant at the top (R7), initially the
  candidate combination `drive.file` + `drive.metadata.readonly`, easily
  edited for the fallback run.
- Reads the paths to `oauth_client.json` and `token.json` from environment
  variables or CLI arguments pointing **outside the repo**. No secret value
  appears in the script text.
- Proves the OAuth loopback (installed-app) flow in Node with the
  hypothesis stack (`googleapis` + `google-auth-library`). If evidence
  forces a pivot to raw `fetch` REST, a second variant
  `drive-probe-fetch.mjs` may be added under the same hygiene rules.
- Performs the four operations, each printing a clearly labeled evidence
  line: (a) resolve folder by ID; (b) verify a child by name; (c) upload a
  file; (d) read a file's content.
- Never prints token or client-secret contents. Printing file *paths*,
  scope strings, and expiry metadata is allowed.
- Classifies failures per the error taxonomy of the exploration note §6
  (no silent catch, R4).

**`docs/tasks/046-spike-adapter-drive/run-instructions.md`** — step-by-step
instructions for the owner (Windows): OAuth client setup pointer
(exploration note §5); a scratch directory **outside the repo** for the ad
hoc `npm install`; where to keep `oauth_client.json` / `token.json`
(outside the repo); the scope-change trap (delete `token.json` when
`SCOPES` changes — note §4); how to run each probe round; exactly which
output to paste back (never credential file contents).

Verification:

- [ ] Both files exist under `docs/tasks/046-spike-adapter-drive/`
- [ ] `grep -n "SCOPES" docs/tasks/046-spike-adapter-drive/drive-probe.mjs`
      shows a top-level named constant
- [ ] No secret material in either file (see Structural checks sweep)
- [ ] Instructions place credentials and `node_modules` outside the repo

Commit: `docs(tasks): add drive probe script and run instructions for 046`

### Evidence rounds (process, between Edit 2 and Edit 3)

Owner runs the script locally per the instructions and pastes outputs
verbatim; executor interprets. Expected rounds: candidate scope combination
→ cross-user manifest-content gap probe (if testable) → fallback broad
`drive` run only if the candidate fails → longevity policy citation
(executor gathers it if the sandbox reaches Google documentation, otherwise
the owner pastes it). Script revisions forced by evidence are committed as
`docs(tasks): update drive probe script after evidence round`.

### Edit 3 — Write the decision note (`notes.md`)

Create `docs/tasks/046-spike-adapter-drive/notes.md` containing:

- First line: `# Notes: 046 — Drive spike decision note`
- Question 1 recorded as settled (pointer to the exploration note, per D1).
- Answers to questions 2-5, each with evidence excerpts from the pasted
  outputs (excerpts must contain no secrets).
- The chosen library and the chosen scope combination, stated as the
  decision that resolves ROADMAP pending decision #11, with the dependency
  footprint vs. implementation cost weighing (question 2).
- The per-subtree-scope confirmation (question 3) and the cross-user gap
  outcome — tested result, or the explicit untested record per D7.
- Question 5: policy citation (URL + excerpt), the consent-mode
  consequence, the chosen mitigation path if the cap is real, and the dated
  observation start (D5).

Verification:

- [ ] File exists; first line matches
- [ ] All five questions addressed (1 as settled pointer; 2-5 answered)
- [ ] A single unambiguous decision statement exists for #11
- [ ] No secret material (Structural checks sweep)

Commit: `docs(tasks): add drive spike decision note for 046`

### Edit 4 — Update ROADMAP: resolve decision #11 and reconcile the map row

Two find-block edits in `docs/ROADMAP.md`. If either find block does not
match byte-exact, STOP and report (constraint 7).

**Edit 4a.** Find:

```
11. **Google Drive JS library.** Equivalent for Drive read / write
    (templates, manifests, ship uploads). Not yet researched.
    Required before Phase 3 `adapter-drive` work; not blocking
    Phase 2.
```

Replace with (per the file's update protocol; fill `<date>` with the edit
date and `<outcome>` with a one-line summary of the decision in
`notes.md` — library + scope combination):

```
11. ~~**Google Drive JS library.** Equivalent for Drive read / write
    (templates, manifests, ship uploads). Not yet researched.
    Required before Phase 3 `adapter-drive` work; not blocking
    Phase 2.~~ — *resolved <date>: <outcome> (brief 046, see
    `docs/tasks/046-spike-adapter-drive/notes.md`)*
```

**Edit 4b.** Find:

```
| Workflow actions — start / close / drive upload | Loop | **Planned** — no commands; `DriveGateway` is a port interface with TODOs, no `adapter-drive`. |
```

Replace with:

```
| Workflow actions — start / close / drive upload | Loop | **In progress** — `saci start --local` shipped (036, smoke-confirmed 2026-07-26); `close` / `ship` not built; `DriveGateway` is a port interface with TODOs, no `adapter-drive`. |
```

Do not touch any other line of the file; do not bump any freshness stamp
not earned by these two edits.

Verification:

- [ ] `grep -c "resolved" docs/ROADMAP.md` increased by exactly 1
- [ ] Decision #11 struck through, resolution line points to `notes.md`
- [ ] Map row shows `**In progress**` and the 036 reference
- [ ] `git diff --name-only` shows only `docs/ROADMAP.md`

Commit: `docs(roadmap): update decision 11 and workflow-actions map row`

### Edit 5 — Add promotion status to the exploration note

Two edits in `docs/explorations/drive-oauth.md`, per the explorations
README contract. No other change to the note. STOP on find-block mismatch.

**Edit 5a.** Immediately after the line
`Status: exploration — possibilities only, NOT a commitment or spec`,
insert:

```
Promotion: promoted to brief 046 — <date>
```

**Edit 5b.** Append to the `## Changelog` list:

```
- <date> — Promoted to brief 046 (adapter-drive spike); promotion status
  line added.
```

Fill `<date>` with the edit date.

Verification:

- [ ] `grep -c "promoted to brief 046" docs/explorations/drive-oauth.md`
      returns 2 (status line + changelog)
- [ ] `git diff docs/explorations/drive-oauth.md` shows only the two
      insertions
- [ ] `git diff --name-only` shows only `docs/explorations/drive-oauth.md`

Commit: `docs(explorations): promote drive-oauth note to brief 046`

### Automated checks (run before each commit)

- [ ] `npm test` passes (no source touched; sanity only — the pre-commit
      hook is not wired in this clone, run manually)
- [ ] `npm run build` passes (sanity only)

### Structural checks

- [ ] `git diff --name-only origin/main..HEAD` shows only:
      `docs/tasks/046-spike-adapter-drive/brief.md`,
      `docs/tasks/046-spike-adapter-drive/drive-probe.mjs`
      (plus `drive-probe-fetch.mjs` if the pivot happened),
      `docs/tasks/046-spike-adapter-drive/run-instructions.md`,
      `docs/tasks/046-spike-adapter-drive/notes.md`,
      `docs/ROADMAP.md`, `docs/explorations/drive-oauth.md`
- [ ] No file under `core/`, `adapter-jira/`, `adapter-sheets/`, `cli/`,
      `packages/**`, `harness/**`, `.claude/**`; no `package.json` or
      lockfile modified
- [ ] Secret sweep returns nothing:
      `grep -rnE "GOCSPX|ya29\.|\"refresh_token\":" docs/tasks/046-spike-adapter-drive/ docs/explorations/drive-oauth.md`
- [ ] No `oauth_client.json`, `token.json`, or `node_modules/` anywhere in
      the repo (`git status` clean; `ls docs/tasks/046-spike-adapter-drive/`
      shows only the four/five committed files)

### Behavior checks

- [ ] OAuth loopback flow proven in Node — evidence pasted by the owner,
      not assumed from the Python PoC
- [ ] Each of the four operations evidenced under the chosen scope
      combination
- [ ] Cross-user manifest-content gap: tested with evidence, or explicitly
      recorded as untested per D7 — never silently claimed
- [ ] Question 5 closed on documented policy + dated observation start (D5)
- [ ] The decision note names exactly one library choice and one scope
      combination

### Git checks

- [ ] Branch used: `docs/spike-adapter-drive` (created via
      `git switch -c` before Edit 1; not the `claude/*` worktree branch)
- [ ] Commits follow Conventional Commits (G-R3)
- [ ] Subject lines ≤ 72 chars
- [ ] No `Co-authored-by` trailer (G-A7)
- [ ] `git status` clean on branch at end
- [ ] **NO** `git push` was executed

### Process checks

- [ ] Pause 1 skipped (`Plan required: no`)
- [ ] Pause 2 — first modified file shown for review before proceeding
- [ ] Pause 3 — `git status` + `git diff --stat` + proposed message +
      `pre-commit-self-audit` output before each commit
- [ ] Evidence rounds followed the 037 discipline: pastes in the turn's
      final message block, single-block packaging, no new Pause over
      outstanding evidence debt
- [ ] If any criterion could not be met, it was reported explicitly

## Git workflow

### Branch

`docs/spike-adapter-drive` — created via `git switch -c` from the session
worktree HEAD before Edit 1 (non-negotiable constraint 6; the `claude/*`
worktree branch must not carry the commits).

### Commit sequence

1. `docs(tasks): add brief for 046-spike-adapter-drive`
2. `docs(tasks): add drive probe script and run instructions for 046`
3. `docs(tasks): add drive spike decision note for 046`
4. `docs(roadmap): update decision 11 and workflow-actions map row`
5. `docs(explorations): promote drive-oauth note to brief 046`

Conditional (only if evidence forces script revision, between 2 and 3, may
repeat): `docs(tasks): update drive probe script after evidence round`

All subjects verified ≤ 72 chars; all leading verbs (`add`, `update`,
`promote`) are on the Check 3 allowlist in
`.claude/skills/pre-commit-self-audit/SKILL.md`.

## Pause points

From `docs/AGENT_PLAYBOOK.md` Chapter 2:

- **Pause 1 (before any code):** **skipped** — `Plan required: no` (see
  justification below).
- **Pause 2 (after the first modified file):** show the result and wait
  for review. **Always required.**
- **Pause 3 (before each commit):** show `git status` + `git diff --stat`
  + proposed message + `pre-commit-self-audit` output. **Always required.**

In case of:

- Unrelated bug found → report and ask. Do not fix.
- Technical limitation preventing a done criterion → report (D7 covers the
  known inconclusive-probe case).
- Undocumented gotcha discovered → report; document in `docs/GOTCHAS.md`
  as a follow-up brief.

**DO NOT proceed "fixing" things without permission.**

## Plan required justification

- Every edit is specified above with exact paths, byte-exact find blocks
  (Edits 4-5), and verification checkboxes; STOP guards cover every
  mismatch case.
- All architectural decisions are closed (D1-D7); the research outcomes
  fill templated slots (`<date>`, `<outcome>`) whose format is fixed here.
- The judgment calls (scope probe inconclusive, secret leak in evidence,
  cross-user gap untestable) have explicit STOP-and-report fallbacks
  (constraints 3, 7; D7).

**Pause 2 and Pause 3 remain required** regardless of `Plan required` —
Lesson #6 of `docs/AGENT_PLAYBOOK.md`.

## Reference documents (read before starting)

In priority order:

1. `CLAUDE.md` — all technical rules
2. `docs/GIT_WORKFLOW.md` — operational discipline
3. `docs/GOTCHAS.md` — known traps
4. `docs/AGENT_PLAYBOOK.md` — Chapter 2 (pause points), Lesson #6,
   Lesson #15 (evidence-close)
5. `.claude/skills/brief-template/SKILL.md` — template reference
6. `.claude/skills/pre-commit-self-audit/SKILL.md` — self-audit (Pause 3)
7. `docs/explorations/README.md` — the note-consumption contract
8. `docs/explorations/drive-oauth.md` — the OAuth PoC (binding §10)
9. `docs/sessions/2026-07-27-mentor-ship-semantics.md` — D3, D4, D6
10. `docs/tasks/037-evidence-close-protocol/brief.md` — evidence protocol
    precedent

## Expected output (end of session)

A single summary message reporting:

1. Branch name and `git log --oneline main..HEAD` (commit count, ordered)
2. `git diff --stat origin/main...HEAD` (line counts per file)
3. The decision that resolves ROADMAP #11, in one line
4. Any verification checkbox from this brief that could not be met, with
   explanation (including any D7 untested record)
5. Confirmation that no `git push` was executed
6. Suggested next step: open PR; then the `ship` MVP brief (mentor recap
   D1-D5 are its delegation payload)
