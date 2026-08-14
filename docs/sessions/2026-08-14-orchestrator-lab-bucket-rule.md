# Session recap — 2026-08-14 — lab-bucket-rule (Orchestrator)

**Mode:** Orchestrator, opened against the item PR #147 left open: the lab's
five-bucket line classification could not be re-run, so the note carried a dated
figure. Category S-to-M, no brief and no `@executor` — the Orchestrator measured
and wrote the edits itself under the Pause 2 / Pause 3 gates.
**Consumes:** `d251204` — `origin/main`, with #147 merged.
**Branch:** `docs/lab-bucket-rule`, cut from `d251204`.
**Produced:** six edits across five files, and this recap.
**Pairs with:** nothing — one session, one role, no executor half.

## One-line summary

The classification rebuilt exactly and uniquely — not from the lead the task
proposed, which is refutable by measurement, but by arithmetic reconstruction
against the tree the 2026-08-08 figures were taken from; and mid-session the owner
reversed the Sheets sentence, which moved 1,451 lines into the portable bucket and
falsified live claims in `CLAUDE.md` and `ROADMAP.md`.

## The proposed lead does not work, and the refutation is measured

The task named `buraqueira`'s `PORTING.md` §6 PORT MAP as the thing to try first:
a per-function table classifying each unit by layer (`pure` / `I/O` / `wiring`)
and destination, with the suggested rule "destination `—` is sentenced, `wiring`
is runner, `core` is portable". Four findings, the fourth decisive:

1. It classifies **functions, not lines**. `core.py` carries roughly 30 rows and
   2,665 lines; the rows do not partition the file.
2. **Coverage gaps.** `run_local.py`, `fetch.py` and `adapter_paths.py` have no
   row — 756 of the 6,347 residual lines. `adapter_paths.py` does not appear
   anywhere in `PORTING.md`:

```
$ cd /d/Projects/buraqueira && grep -c adapter_paths PORTING.md
0
```

3. **Destination `—` is polysemous**: `NEVER PORTS` (`sync.py`), "evaluate at
   port time" (`notify.py`), "do not port" (one-offs). The proposed rule would
   put `notify.py` in the sentenced bucket, where measurement shows it is not.
4. **`wiring` = runner contradicts the arithmetic.** `flow.py` carries six
   `wiring` rows and 1,345 lines, and the 2026-08-08 figures place it in the
   *portable* bucket. Under the proposed rule the complement cannot reach 4,714.

The lead was tried first as instructed, and reported dead rather than bent to fit.

## What did work: the four named buckets are an oracle

The note named files for four buckets and prose for two. The four reproduce **to
the unit** at `27ca450` (2026-08-06), the last commit before the 2026-08-08 run —
which both identifies the measured tree and makes the four a constraint on the
other two:

```
=== 27ca450  2026-08-06: 39 files, 12532 total  (note: 12532) ===
  tests/**         3750     (note: 3750)
  scripts/**       2459     (note: 2459)
  sync+lib_sheets  1082     (note: 1082)
  lib_transform     160     (note: 160)
  residual         5081  over 9 files   (note: 367 + 4714 = 5081)
```

Of the 511 non-empty subsets of those nine files, **exactly one** sums to 367:

```
  Subsets of the residual summing to exactly 367: 1
    notify.py=183 + run_local.py=184
    complement=4714 -> adapter_cache.py, adapter_jira.py, adapter_receita.py,
                       core.py, fetch.py, flow.py, map_parent.py
```

The complement is 4,714 without remainder, and the seven files map one-to-one
onto the note's prose: `core.py` (the pure core), `flow.py` + `fetch.py` +
`adapter_jira.py` (the query layer), `map_parent.py` (the parent-map runner),
`adapter_cache.py` + `adapter_receita.py` (the two small adapters).

**Semantics corroborate the arithmetic**, which is what separates this from a
numeric coincidence — both recovered files are wiring for the local sync run:

```
$ head -8 run_local.py
run_local.py — orquestrador do pipeline completo, pra rodar via Windows Task Scheduler.
Executa em sequencia:
  1. fetch.py   → payload.json
  2. sync.py    → sync_report.json (stdout do sync.py)
  3. notify.py  → logs/sync-YYYY-MM-DD-HH-MM.txt
```

## The "five adapters" ambiguity was an artifact of reading a 2026-08-08 sentence against today's tree

#147 recorded that "the two small adapters" could not be resolved against five
`adapter_*.py`. On the measured tree there were **three**: `adapter_jira.py` (342,
the query layer), `adapter_cache.py` (144) and `adapter_receita.py` (87).
`adapter_paths.py` and `adapter_esteira.py` were created after the measurement —
`adapter_paths.py`'s own docstring dates its reason to `08/08/2026`.

## The owner reversed the Sheets sentence mid-session

Asked whether a Sheets port would carry `lib_sheets.py` only or both files, the
owner ruled **both**, with the reason: the spreadsheet becomes a report for the
team, including people who never run Saci; the team has used it heavily in recent
months; and Saci should also create spreadsheets and share them in the Google
workspace.

That does not restore state to the Sheet — it supplies the concrete consumer the
2026-06-12 parking decision was explicitly waiting for. The sentenced bucket
dissolves and its 1,451 lines move to portable.

Two facts were put to the owner before the ruling was written down, and neither
changed it — recorded so no brief assumes otherwise. Most of `sync.py`'s 858 lines
are diff engine, cell ownership and write-conditionals, machinery that existed
because the Sheet was reconciled cell by cell; a report Saci creates and shares
needs create/write/share instead, so the destination is "ports", not "ports as
written". And create-and-share exceeds `adapter-drive`'s current OAuth scopes
(`drive.file` + `drive.metadata.readonly`), so the first brief carries an
authorization change.

## The rebuilt figures

Same rule applied to both dates, so growth stays separable from doctrine:

| Bucket | Rule | 2026-08-08 | 2026-08-14 |
|---|---|---|---|
| pytest | `tests/**` | 3,750 | 4,656 |
| scripts | `scripts/**` | 2,459 | 2,712 |
| local-run wiring | `run_local.py`, `notify.py` | 367 | 547 |
| already ported | `lib_transform.py` | 160 | 201 |
| **portable** | every other root file | **5,796** | **7,251** |
| total | `git ls-files '*.py'` | 12,532 | 15,367 |

Growth alone is +1,455 (+25%) in six days; the 4,714 originally published and the
5,796 here are the same tree under two doctrines. The bucket was renamed from
"Sheets-side runners" to "local-run wiring": the old name stopped being true when
the Sheets code was un-sentenced, while the 547 lines it covers still do not port.

## What was deliberately not refreshed

- **The 9,000-11,000 TS and 30-45 brief estimates.** They are the portable
  surface times a factor the note never recorded; dividing rounded endpoints by
  4,714 implies a 1.91-2.33 band but does not recover the reasoning. With the base
  moved by growth *and* by doctrine, rescaling would be arithmetic dressed as
  measurement. Same principle #147 applied, one level up.
- **The 1.19 Py→TS ratio.** `lib_transform.py` grew to 201 while `transform.ts`
  stayed at 190. Recomputing 190/201 = 0.95 would measure a port that never
  happened rather than a translation cost.

The monorepo comparison in the same paragraph *does* re-measure: the rule
`git ls-files 'packages/**/*.ts'` minus `dist/` returns 9,665 at the 2026-08-08
commit `b252d37`, exactly as published, and 10,426 today (64 files, 50.1% test).

## `main` in the primary clone is behind `origin/main`

```
$ cd /d/Projects/saci && git rev-parse main origin/main
b63cbf68ee9a7a3368264ed02fa6212e81458f59
d251204714d7f6e560261f8f8824d1f6e6321202
```

The branch was cut from `d251204` — the merge commit of #147, the true `main` —
not from the stale local ref. No fast-forward was run: `main` is checked out in
the primary clone and updating another clone's working tree is not this session's
call. The next session on that clone should fast-forward before cutting.

## What this session did not verify

- **Whether the residual grew in kind or only in size.** The per-file counts were
  compared between the two trees, but no module was read to check whether its
  *character* changed.
- **The counting rule the original note used.** `wc -l` is assumed because it is
  the only rule that reproduces 12,532 and 15,367 exactly; the note never says.
- **Anything about the Sheets feature's design.** The ruling was recorded, not
  designed. No brief, no port plan, no scope for what `adapter-sheets` becomes.
- **The `grep -c` bullet in `docs/tasks/2026-08-14-python-lab-of-record/notes.md`.**
  Still open; explicitly out of scope again this session.
- **`buraqueira`'s own `PORTING.md`**, which still marks `sync.py` and
  `lib_sheets.py` as `NEVER PORTS`. It is a different repository and no commit was
  made there; it is now stale against this ruling.
