# Python laboratory lane

Status: exploration — no implementation mandate
Disposition: deferred — 2026-08-08; trigger: the lab sustains a transfer rate on
the order of 4+ proven mechanisms per quarter
Origin: cost exploration run in the `buraqueira` repo, 2026-08-08; closed by the
owner in that session and carried here as a report. Totals, the Py→TS ratio and
the monorepo counts were re-measured in this session; the bucket split differs
from the report's by classification boundary and is the one below.
Roadmap link: refines ROADMAP Identity shifts 2026-05-15 (the Python
`automation/` as v2's seed); bears on [[v1-v2-overlap]]

The Python repo is not a temporary overlap awaiting Phase 4. It is a permanent
laboratory lane: it stays Python, and this monorepo absorbs proven mechanisms
one at a time, as briefs.

**What was measured.** Of 12,532 lines in the Python repo: 3,750 are pytest,
2,459 are `scripts/**` (debug, archive, maintenance), 1,082 are sentenced
(`sync.py`, `lib_sheets.py`), 367 are Sheets-side runners, and 160 are already
ported here as `transform.ts`. The portable surface is the remaining **4,714**
lines — the pure `core`, the query layer, the parent-map runner, and the two
small adapters.

At the one measured Py→TS ratio (`lib_transform.py` 160 → `transform.ts` 190 =
1.19), and 1.3-1.4 for the data layer (dynamic dicts, dotted-path resolution, a
hand-rolled `where` parser under `strict` with no `any`), a full migration is
**9,000-11,000 lines of TS** — about the size of this monorepo today (9,665,
~49% of it test). At the measured ~200 TS lines per brief across 49 briefs, that
is roughly 30-45 briefs.

**Why it was dropped.** The Python repo produces ~1,300 lines per active day;
this one ~220. The 6x gap is the brief pipeline, the PR gate and Pause-3 —
process, not language. Rewriting the lab in TypeScript would save only the
translation share of each future transfer; brief, tests, review and docs are
language-independent and are the expensive part. A lab under this process stops
being a lab. The opportunity cost is explicit: the migration window is a window
in which the greenfield production loop — the declared alpha — does not move.

**Ownership scope (owner-closed).** The owner's declared scope is the **data
layer** (`core` plus a query `cli`), not the three adapters. Measured rationale:
`adapter-jira` already exists here and the lab adds only breadth (board->JQL
resolution via `/rest/agile/1.0/board/{id}/configuration` and
`/rest/api/3/filter/{id}`, raw JQL as a source, lean field lists, a `truncated`
fact from pagination — order of 120 new lines); `adapter-drive` exists (brief
047) and the lab has no Drive adapter to contribute, only ADF URL extraction,
which is `core`; `adapter-sheets` is parked by the 2026-06-12 pivot and the
lab's Sheets code is marked NEVER PORTS in its own `PORTING.md`. The asset the
lab actually holds — the chainable verb layer, versioned recipes, aliases, query
hashing — belongs to `core` plus `cli`, not to any adapter. The proposed
ownership split did not cover the asset.

**One thing the lab has that this repo lacks.** The lab guards against Jira
answering `200` with an empty list on an expired token (`verify_auth` against
`/myself`, plus a non-destructive guard when an empty payload meets a populated
sheet). It learned this from a run that went blind in production. No equivalent
guard exists here — a grep for `myself` or `verifyAuth` across `packages/`
returns nothing. This is independent of any migration decision.

**If the migration is ever re-opened**, the first slice is `where` + `select` +
`tabela`: it is the nucleus the other verbs depend on, it carries the parser
(the highest-risk item), and the Python tests are a direct behavioral oracle.
Gate: if the parser exceeds ~3 briefs in TS, stop there.

**Disposition note for ratification:** `deferred` was chosen over `discarded`
because a re-open condition exists, and the closed set requires a declared
trigger with `deferred`. If the owner wants it firmer, `discarded` with the same
reason is the alternative.

## Changelog

- 2026-08-08 — authored from the `buraqueira` cost exploration; disposition
  proposed as `deferred` with trigger.
