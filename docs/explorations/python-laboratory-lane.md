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

The Python repo measured throughout this note is `buraqueira` — not this
repository's `automation/` snapshot, which is a different and much smaller
thing. It is not a temporary overlap awaiting Phase 4. It is a permanent
laboratory lane: it stays Python, and this monorepo absorbs proven mechanisms
one at a time, as briefs.

**What was measured (2026-08-08).** Of 12,532 lines in the Python repo: 3,750 are
pytest, 2,459 are `scripts/**` (debug, archive, maintenance), 1,082 are sentenced
(`sync.py`, `lib_sheets.py`), 367 are Sheets-side runners, and 160 are already
ported here as `transform.ts`. The portable surface was the remaining **4,714**
lines — the pure `core`, the query layer, the parent-map runner, and the two
small adapters.

At the one measured Py→TS ratio (`lib_transform.py` 160 → `transform.ts` 190 =
1.19), and 1.3-1.4 for the data layer (dynamic dicts, dotted-path resolution, a
hand-rolled `where` parser under `strict` with no `any`), a full migration is
**9,000-11,000 lines of TS** — about the size of this monorepo then (9,665, ~49%
of it test). At the measured ~200 TS lines per brief across 49 briefs, that is
roughly 30-45 briefs. Both figures remain 2026-08-08 and were deliberately not
refreshed; the reason is at the end of this section.

**The classification rule, recovered 2026-08-14.** The split above named files
for four of its five buckets and prose for the other two, which is why an earlier
pass dated the total instead of replacing it. The missing two are now recovered.
The rule is recorded here as file sets, so the next measurement reproduces
without reading prose:

| Bucket | Rule |
|---|---|
| denominator | `git ls-files '*.py'` |
| pytest | `tests/**` |
| scripts | `scripts/**` |
| local-run wiring | `run_local.py`, `notify.py` |
| already ported | `lib_transform.py` |
| **portable** | every other file at the repository root |

**How the two unnamed buckets were recovered.** The 2026-08-08 figures were taken
against `buraqueira` at `27ca450` (2026-08-06). That tree totals 12,532 lines and
reproduces all four named buckets to the unit, which makes them an oracle for the
other two. Of the nine root files left once the named buckets are removed,
exactly **one** of the 511 possible subsets sums to the recorded 367 —
`run_local.py` (184) + `notify.py` (183) — and its complement is 4,714 without
remainder. The semantics agree with the arithmetic: `run_local.py` orchestrates
`fetch.py` → `sync.py` → `notify.py` under the Windows Task Scheduler, and
`notify.py` renders `sync_report.json` into a log file. Both are wiring for local
execution, which is why the bucket is renamed — "Sheets-side runners" stopped
being true when the Sheets code was un-sentenced (below), while the lines it
covers still do not port.

The same reconstruction dissolves the "two small adapters" ambiguity: on
2026-08-06 the tree held **three** `adapter_*.py`, not the five present today —
`adapter_paths.py` and `adapter_esteira.py` were both created after the
measurement. The two small ones are `adapter_cache.py` (144) and
`adapter_receita.py` (87); `adapter_jira.py` (342) belongs to "the query layer".

**The lab's own `PORTING.md` cannot rebuild these buckets**, though its §6 PORT
MAP is the finer-grained classification and was tried first. It classifies
functions rather than lines and offers no line attribution; `run_local.py`,
`fetch.py` and `adapter_paths.py` have no row in it at all; its `—` destination
is polysemous — "evaluate at port time" and "do not port" today, and
`NEVER PORTS` as a third meaning until the lab applied this ruling on
2026-08-14; and its `wiring` kind would place `flow.py` — 1,345 lines that the
2026-08-08 arithmetic puts in the portable bucket — among the runners.

**Measured 2026-08-14**, at `buraqueira` `42c624b`, with the rule applied to both
dates so growth stays separable from the doctrine change below:

| Bucket | 2026-08-08 (`27ca450`) | 2026-08-14 (`42c624b`) |
|---|---|---|
| pytest | 3,750 | 4,656 |
| scripts | 2,459 | 2,712 |
| local-run wiring | 367 | 547 |
| already ported | 160 | 201 |
| **portable** | **5,796** | **7,251** |
| total | 12,532 | 15,367 |

The portable surface is **7,251 lines**. Against the 4,714 first published, 1,451
of the difference is the Sheets ruling and 1,086 is growth; under the rule applied
uniformly, growth alone is 5,796 → 7,251, **+1,455 (+25%) in six days**. The
4,714 and the 5,796 are the same tree read under two doctrines.

**The Sheets code is no longer sentenced (owner ruling, 2026-08-14).** `sync.py`
(858) and `lib_sheets.py` (593) were classified never-ports because the Sheet held
coordination state and the application took that role over. The ruling does not
restore the Sheet as a state surface; it adds a consumer the 2026-06-12 pivot did
not have. The spreadsheet becomes a **report for the team** — people who never run
Saci still need what it shows, the team has leaned on it heavily in recent months,
and Saci gains the ability to create spreadsheets and share them inside the Google
workspace. That is a one-way projection target, which is what the pivot already
said a spreadsheet should be. The 1,451 lines move to portable.

Two things the ruling does not settle, recorded so no brief assumes them. The
destination is "ports", not "ports as written": most of `sync.py` is diff engine,
cell ownership and write-conditionals — machinery that exists because the Sheet
was reconciled cell by cell — and a report Saci creates and shares needs
create/write/share rather than diff, so these lines likely shrink sharply in
translation. And whether creating and sharing a spreadsheet exceeds
`adapter-drive`'s current OAuth scopes (`drive.file` + `drive.metadata.readonly`)
is open, not settled: `drive.file` is per-file access to files the app creates,
and a CSV-with-conversion path may stay inside it. The spike
`docs/tasks/2026-08-15-spike-sheets-report/` measures it before anything widens,
because a scope change forces every existing user through browser consent again
(`G-DRIVE-1`).

**Why the derived figures were not refreshed.** The 9,000-11,000 TS lines and
30-45 briefs are the portable surface times a factor this note never recorded.
The implied band — 1.91 to 2.33 — comes from dividing rounded endpoints by 4,714
and does not recover the reasoning behind them. With the base moved by growth
*and* by a doctrine change, rescaling would be arithmetic dressed as measurement.

One figure in that paragraph does re-measure cleanly. The rule
`git ls-files 'packages/**/*.ts'` minus `dist/` returns 9,665 at the 2026-08-08
commit, exactly as published, and **10,426 today (64 files, 50.1% of it test)**.
The Py→TS ratio is deliberately not recomputed: `lib_transform.py` grew to 201
while `transform.ts` stayed at 190, so 190/201 would measure a port that never
happened rather than a translation cost.

Re-measuring also settled one open question: `buraqueira`'s `.claude/` holds
46,101 lines of `.py`, but it is untracked and was never inside this denominator,
so no size comparison here understated the lab.

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
which is `core`; `adapter-sheets` was parked by the 2026-06-12 pivot and the
lab's Sheets code was marked NEVER PORTS in its own `PORTING.md` — both
superseded by the 2026-08-14 ruling above, which gives the Sheets projection the
concrete consumer the parking decision was waiting on. The asset the
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
- 2026-08-14 — named `buraqueira` in the body. The measurements were always
  buraqueira's, as the `Origin:` line said, but the body called it only "the
  Python repo" while `CLAUDE.md` named `automation/` as the lab — so a reader
  arriving from there read 12,532 lines as the snapshot's. The laboratory of
  record was ruled the same day; the doctrine correction is task
  `2026-08-14-python-lab-of-record`.
- 2026-08-14 — dated the 12,532 figure in place and added the freshness note. The
  figure was not replaced: four of the five buckets re-measure from the file sets
  this note names, the fifth names none, and the portable surface therefore cannot
  be re-derived. A raw `wc -l` total would have read as a refresh of a classified
  number while silently changing what it counted.
- 2026-08-14 — replaced the freshness note with the rebuilt classification, and
  recorded the rule as file sets. The two prose-only buckets were recovered by
  reconstruction against `27ca450`, the tree the 2026-08-08 figures were taken
  from: the four named buckets reproduce to the unit and act as an oracle, and
  exactly one subset of the residual sums to 367. The lab's `PORTING.md` §6 was
  tried first, as the finer-grained classification, and does not serve — the
  reasons are in the body so the next reader does not re-try it.
- 2026-08-14 — the owner un-sentenced the Sheets code: the spreadsheet becomes a
  team report and Saci gains spreadsheet creation and workspace sharing, so
  `sync.py` and `lib_sheets.py` moved to portable and the portable surface is
  7,251. `CLAUDE.md` and `docs/ROADMAP.md` carried the "never ported" and
  "parking lot" claims and were corrected in the same PR.
- 2026-08-14 — the lab applied the ruling in its own `PORTING.md`, the same day:
  `sync.py` and `lib_sheets.py` now carry `adapter-sheets` as their destination
  in §2 and §6, with both caveats — "ports, not as written" and the OAuth scope
  gap. The lifecycle tooling and the diagnostics were left sentenced, on their
  own grounds. The `—` destination lost one of its three meanings as a result.
- 2026-08-15 — downgraded the OAuth scope caveat from a certainty to an open
  question. Both this note and `CLAUDE.md` stated that create-and-share exceeds
  `adapter-drive`'s scopes; neither had measured it, and `drive.file` may already
  cover a spreadsheet the app creates and shares. The claim was load-bearing in
  the wrong direction — under `G-DRIVE-1` it justified forcing every user through
  consent again — so it now points at the spike that settles it,
  `docs/tasks/2026-08-15-spike-sheets-report/`.
