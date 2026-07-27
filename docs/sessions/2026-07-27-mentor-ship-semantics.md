# Session recap — 2026-07-27 — `ship` semantics exploration (Mentor)

**Mode:** explore horizon (Mentor surface) — conceptual shaping of the
`ship` command; no brief authored, no slot consumed. Slot 046 remains
free (front-runner: the adapter-drive spike, below).
**Consumes:** the orchestrator 045 recap and PR #105 at `main@42878db`
(merge confirmed via P4 this session — owner-run
`git log --oneline -3 origin/main`; recap rode the session PR, canonical
sequence held).

## One-line summary

The `ship` decision map closed in chat: D1–D5 fix the domain semantics
(repeatable event, deny-list upload with an omission ledger derived from
history, single-root anchor with a verify-never-create structure policy,
optimistic concurrency via history-prefix check, one code path for
Jira-born and local-born tasks), and D6 routed to a directed spike whose
scope collapsed after the owner surfaced a validated Drive OAuth
proof-of-concept from the Python-era environment.

## Closed decisions

### D1 — `ship` is repeatable, not terminal

Each `ship` appends a history event to the manifest. No local state
becomes "closed"; done-ness stays in Jira. The manifest records *what
happened*, not *what the task is*. Rationale: revisions are routine
(feedback → adjust → re-ship); a terminal model would force `reopen`
semantics on day 1, and `reopen` is explicitly a wait-for-real-case
secondary command.

### D2 — Whole folder minus deny-list; omissions always ledgered

1. **Base upload:** entire task folder minus a deny-list (editor junk:
   `.psd~`, swap/temp files; OS junk: `Thumbs.db`, `.DS_Store`). Named
   constant in `core` (R7); pure, testable exclusion predicate; the
   adapter only consumes it.
2. **Manifest is not part of the file sweep.** `ship` uploads files
   first, appends the `ship` event, writes the updated manifest to Drive
   **last** — a manifest on Drive never describes an upload that did not
   complete (fail-loud by construction).
3. **Data-economy requirements (owner):** two extensions, both designed
   now, neither in the MVP:
   - **Incremental upload** (primary economy direction): re-ship uploads
     only the delta (mtime/hash comparison). Adapter-layer concern,
     invisible to the user, no degraded mode.
   - **Lean mode** (explicit flag): uploads final deliverables only,
     omitting heavy sources. The `ship` event records mode + omitted
     list + the shipping designer's identity. `load` of a lean-shipped
     task warns loudly that sources are absent.
4. **Ratified principle:** omission is never silent — always recorded in
   the manifest, visible on both sides (Drive and local) through the
   same artifact. **Debt settlement is derived, not stored:** open debt
   = omissions in the history not yet covered by a later ship; the
   covering event's identity shows who settled. No `reconcile` command,
   no parallel debt ledger (state is a projection of events). `status`
   and `load` compute and surface pending-source debt.

**Sequencing:** the first `ship` brief delivers full upload + deny-list
only. Incremental and lean+reconciliation land later as designed
extensions; the manifest's `schemaVersion` absorbs the event-shape
evolution. Fixing omission fields now, before lean exists, would be
speculative shape (A3 spirit) — the principle is fixed, the shape is not.

### D3 — Root resolution: single configured anchor + verify-never-create

- The Drive anchor pointer lives in per-machine config (alongside the
  036 identity in `~/.saci/`); exact value shape (folder ID expected —
  **unverified**, spike confirms) depends on D6.
- `ship` with no configured root fails loud with an actionable message
  (044 missing-env DX precedent).
- **Resolution is an explicit seam:** a pure `core` function takes
  (derived segments, roots config) and returns
  `{ anchor, remainingSegments }`. Today config holds only `default`;
  accepting `byVertical` later is additional config plus this function —
  zero change to `derivePath`, `ship`, or the adapter. Per-vertical
  roots (owner concern: humans renaming/moving Drive structure) are
  bought cheap, not built speculatively.
- **Structure policy (the real defense):** the adapter creates only what
  derives from data (month folder, task folder); organizational
  structure (`AVULSAS`, verticals) is **verified, never created**. A
  renamed anchor child produces a loud ship failure naming what was
  expected and not found — never a silently recreated parallel tree.
- Semester turnover = manual config update, per designer, 2x/year.
  A central pointer file on Drive was considered and rejected as
  speculative (A3) for a 3-person team; promote if turnover proves to be
  a real error source.
- **MVP scope guard:** the `ship` brief needs only the *read* side of
  config (direct file read, fail-loud). The `saci config` write surface
  stays its own horizon item.

### D4 — Conflict: optimistic concurrency via history prefix; no lock

1. **Prefix check before upload:** `ship` reads the remote manifest
   first (first real consumer of `readManifest`, typed in 045). Pure
   rule in `core`: local history must be a prefix of (or equal to)
   remote. Remote-ahead → someone shipped since your last sync → fail
   loud naming who/when, suggesting `load` to reconcile or `--force`.
   Local-ahead is the normal case (your unshipped work).
2. **`--force` records, never hides:** the appended event registers that
   it overrode, and what it overrode. History keeps telling the truth
   (same principle as D2 reconciliation).
3. **`claimed_by` is derived, not a lock:** current holder = identity of
   the last significant event (`start`/`load`/`ship`). This dissolves
   the ROADMAP open items — no claim expiry, no auto-release, because
   there is no claim *state*, only history. `status`/`load` display
   "last activity: <who>, <when>".

A real lock (lock file, lease/expiry) was rejected: distributed-systems
machinery for a 3-person team; it blocks the legitimate takeover case
and requires exactly the expiry semantics the ROADMAP flags as open.
Accepted trade-off: parallel unaware work is discovered at ship time;
real-time prevention needs shared central state — Phase 4 territory.

### D5 — Local-born tasks ship through the same path

Zero branching by origin. 036 already did the work: local-born tasks
have their own key (`RAF-1`), vertical, and title; the smoke of
2026-07-26 confirms the local scaffold already uses `derivePath`
segments. Origin is recorded in the manifest; per-designer key prefixes
prevent cross-machine collisions.

**Local→Jira promotion** ("this one-off became an official demand"):
own command, **parked with known demand** — the owner corrected the
mentor's assumption: this case is *common*, not hypothetical. Expect
early promotion after the `ship` MVP. The D5 design leaves the door open
for free: promotion becomes "create the issue and link the Jira key to
the manifest", no retrofit.

### D6 — Routed to a directed spike (slot 046 front-runner)

Category S research brief, no product code. Scope collapsed mid-session
when the owner surfaced a **validated OAuth proof-of-concept document**
from the Python-era `automation/` environment. Key findings absorbed:

- The Estratégia Google Workspace **allows external OAuth Desktop apps**
  for the user's account — tested in real execution. No Service Account
  dependency, no IT approval, no Drive Desktop install needed.
- The Sheets pipeline uses a **Service Account** (`credentials.json`);
  the Drive PoC uses **user OAuth** (`oauth_client.json` + `token.json`
  with refresh token; unattended runs work after first browser consent).
  The PoC doc itself concludes SA cannot see the user Drive without
  per-folder manual sharing → **user OAuth is the Drive path** (auth
  inventory question: answered by evidence).
- PoC validated scope `drive.metadata.readonly`; it recommends
  `drive.file` for a writer bot. Credential hygiene rules recorded:
  `token.json` / `oauth_client.json` never committed, never logged —
  enter `.gitignore` + GOTCHAS in the adapter implementation brief.
- Environment constraint reconfirmed: Jira/Drive automation executes
  locally on the user's Windows machine (sandbox blocks
  `estrategia.atlassian.net`) — already the executor's modus operandi.
- Python's existing Sheets SA stays untouched (ROADMAP pending decision
  #4 default holds). If the parked Sheets projection ever promotes in
  v2, the designer's OAuth can simply add the `spreadsheets` scope —
  door open for free, decide when the case exists.

**Spike questions (final scope):**

1. **Auth inventory** — answered by the PoC doc (see above).
2. **Node library** — hypothesis: `googleapis` + `google-auth-library`
   (**unverified**); alternative: direct REST with raw `fetch` in the
   adapter-jira spirit (R2 pressure). The OAuth loopback flow must be
   proven in Node, not assumed from the Python PoC.
3. **Minimal viable scope** — the central question. `drive.file` alone
   likely blinds the app to (a) human-created structure the D3
   verify-never-create policy must read, and (b) manifests created by
   another designer's instance (D4 prefix check, `load`). **Candidate
   combination to test: `drive.file` + `drive.metadata.readonly`**
   (write only what is yours + see structure read-only) — near-exact
   match for the owner's containment requirement. Known gap to probe:
   reading manifest *content* written by another user under the same
   client ID. Fallback if the combination fails: broad `drive` scope,
   with containment guaranteed by the code-level policy (adapter only
   addresses `derivePath`-produced paths; manual folders inside
   verticals are never addressed by any code path — Google scope then
   bounds blast radius on bugs, not designed behavior). Note: Drive
   offers no per-subtree OAuth scope (**unverified**, confirm in spike).
4. **Four-operation proof** with the chosen approach: resolve folder by
   ID; verify child by name (D3 policy depends on it); upload a file;
   read a file. Throwaway script.
5. **Refresh-token longevity** — External + Testing consent mode may cap
   refresh tokens at ~7 days (**unverified**; the PoC doc gives no
   duration). Weekly re-consent would be unacceptable for unattended
   designer flow. If the cap is real, evaluate: Internal app (if the GCP
   project can live in the Estratégia org) or publishing the app.

**Spike exit:** a decision note closing ROADMAP pending decision #11 and
unlocking the `ship` implementation brief.

## Ship decomposition (ratified)

(a) adapter-drive spike (slot 046 candidate) →
(b) `ship` MVP brief: full upload + deny-list + optimistic prefix check
+ fail-loud root/structure verification →
(c) extensions (incremental, lean + derived reconciliation) when real
cases arrive.

## Ground-truth notes for the future planner

- **ROADMAP staleness:** the "Product map at a glance" status table
  marks "Workflow actions — start / close / drive upload" as *Planned —
  no commands*, but 036 shipped `saci start --local` (smoke-confirmed
  2026-07-26). Reconcile that row next time ROADMAP is touched.
- **Manifest local write location unverified:** 031 designed the
  `TaskManifest` type; which task landed the local manifest *write* and
  its on-disk path was not confirmed this session. Verify before locking
  the `ship` brief (P4-style structure check).
- **`derive-path.ts` campaign branching unverified:** docs say
  `campaign` is null in alpha and parked; whether the function already
  branches on non-null campaign or merely carries the field was not
  read from source. Irrelevant to `ship` (opaque segments through the
  D3 seam) but flag it if campaign unparks.
- The OAuth PoC guide lives outside the v2 repo (Python-era
  environment). Its actionable findings are condensed above; if the
  spike planner needs the full document, the owner supplies it.

## Process decision — exploration notes (`docs/explorations/`)

Ratified this session (owner request): a third knowledge type joins the
system, between the parking lot's one-liners and session-recap state —
**exploration notes**: rich, agent-consumable insight accumulated from
brainstorm conversations, carrying **no implementation mandate**.

- **Folder:** `docs/explorations/`, one file per topic (kebab-case),
  living documents with an internal changelog — not dated snapshots.
- **Authority contract:** notes sit **below everything** in the conflict
  hierarchy (below briefs, doctrine, recaps). No agent implements from a
  note; notes become Context input when a brief is born from the topic.
  Contract codified in the folder's `README.md`; a mandatory header
  (`Status: exploration — possibilities only…`) marks every note.
- **Flow:** Mentor chat in a new conceptual mode — **exploring
  possibilities** (added to §8 and M-R13; distinct from horizon
  exploration, which shapes decisions toward briefs) → Mentor produces
  or updates the note → caminho B commit → Orchestrator/planner consume
  when the topic activates.
- **Relations:** parking lot stays the index (one line + pointer);
  rule-of-three still governs promotion into doctrine — a note is not
  doctrine, so it may be born on first occurrence. On promotion, the
  note gains a status line ("promoted to brief NNN"), never deleted.
  Notes stay out of the project-knowledge cache by default (canonical
  docs only); uploaded on demand when the topic is active. Notes are a
  sanctioned exception to M-R15's artifact-size signal — knowledge
  prose, not operational specs.
- **Seed note:** the Drive OAuth PoC guide (owner-supplied this session,
  Python-era environment) translated to English as
  `docs/explorations/drive-oauth.md` — first occupant, and the spike's
  Context input.
- **Owner ruling (this session):** for exploration-notes artifacts and
  this bootstrap, the Mentor authors the byte-exact files; the owner
  pre-saves them; the Orchestrator verifies on disk, applies the
  MENTOR_BRIEF edits, and runs commits + PR (explicit owner instruction
  overriding the M-R15 default authoring lane for this artifact class).

## Pending items (queue)

1. **This session's PR** (this recap + explorations bootstrap +
   MENTOR_BRIEF mode registration): owner pre-saves files; Orchestrator
   verifies, edits, commits, opens PR; owner squash-merges. Merge SHA
   recorded by the next session.
2. **Queue front: adapter-drive spike** (slot 046 candidate) — needs a
   caminho A delegation carrying the five spike questions above;
   `docs/explorations/drive-oauth.md` is its Context input.
3. **After spike: `ship` MVP brief** (D1–D5 closed here are its
   delegation payload).
4. Parked (updated): **local→Jira promotion — known common demand, early
   promotion expected post-ship-MVP**; manifest `variation` field
   (042 D4); multi-contributor naming package; Jira-born manual
   overrides; `jira_updated_at` nullability.
5. Horizon (remaining): `@saci/*` → `@breu/*` rename; `saci config`
   write surface (read side lands inside `ship` per D3).

## Next concrete action

Owner pre-saves the three files (this recap; `docs/explorations/README.md`;
`docs/explorations/drive-oauth.md`). An Orchestrator session runs the
bootstrap snippet: verify files on disk, apply the two MENTOR_BRIEF §8 /
M-R13 edits, three commits under Pause-3, push + PR on owner instruction;
owner squash-merges. The following session confirms the merge via P4 /
`git log` and models the adapter-drive spike as slot 046 (caminho A
delegation; the five spike questions, D3/D4 dependencies, and the
drive-oauth exploration note are the delegation payload).
