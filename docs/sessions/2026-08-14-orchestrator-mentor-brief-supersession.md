# Session recap — 2026-08-14 — mentor-brief-supersession (Orchestrator)

**Mode:** Orchestrator, third work item of the same conversation, opened after
#149 merged. The owner asked for the smallest of three remaining open items — the
`grep -c` caveat — and the measurement surfaced a defect it was not looking for.
Category S, no brief and no `@executor`.
**Consumes:** `c3b3edf` — `origin/main`, with #149 merged.
**Branch:** `docs/mentor-brief-supersession`, cut from `c3b3edf`.
**Produced:** two edits and this recap.
**Pairs with:** nothing — one session, one role, no executor half.

## One-line summary

The `grep -c` caveat is methodologically real and changed no verdict — delta zero
across all four checks — but the sweep that verified it found that
`docs/MENTOR_BRIEF.md` still carried the "never ported" claim #148 corrected in
its two sibling documents.

## The caveat measured: delta zero, four for four

The open bullet said the brief's `grep -c` verifications count lines rather than
occurrences. Both counts were run against `bf057b0`, the tree the checks were
verified on:

```
FILE                     PATTERN                 grep -c  occurr.  delta
CLAUDE.md                buraqueira                    3        3      0
CLAUDE.md                automation/                   1        1      0
docs/ROADMAP.md          automation/                   4        4      0
docs/MENTOR_BRIEF.md     automation/                   2        2      0
```

No line carried two matches, so every check passed as stated and would have
passed identically under an occurrence count. **The caveat was correct and
inconsequential**, and both halves are now recorded rather than only the first.

It stays worth stating for future briefs, and the third check shows why: it
reasons in *sites* — "the three out-of-scope sites (lines 49, 101, 169) plus the
one introduced by 2c's parenthetical" — while measuring lines. The vocabulary
gap, not the command, is the hazard.

## The defect the measurement was not looking for

Verifying the four checks meant sweeping the same documents for claims of the
class #148 had corrected. One live site survived on `main`, outside the
historical surfaces:

```
$ sed -n '46,54p' docs/MENTOR_BRIEF.md
- **Pivot recorded 2026-06-12 (brief 023):** ... With no production users of the
  Python laboratory, `sync.py` / `lib_sheets.py` are legacy reference only — the
  sync diff engine is never ported; only the issue → row projection survives...
```

It is the exact twin of the `docs/ROADMAP.md` 2026-06-12 entry: a dated bullet
whose claims are written in the present tense. #148 corrected `CLAUDE.md` and gave
the ROADMAP entry a superseding blockquote, and missed this one — because that
session's search was scoped to `CLAUDE.md` and `ROADMAP.md` by name rather than
run across the repository.

**The fix is the shape the owner chose in #145**: the dated bullet keeps its own
prose, and a superseding blockquote sits beneath it. `docs/MENTOR_BRIEF.md` had no
prior supersession pattern in that list; the ROADMAP's was adopted rather than
inventing a second one.

## What the sweep found and deliberately left alone

Every other surviving occurrence of `never ported` / `legacy reference only` /
`NEVER PORTS` sits in `docs/sessions/**` or `docs/tasks/**`. Those are historical
surfaces — measured on 2026-08-14 as 120 of 120 recaps written in exactly one
commit, never edited afterwards — so an obsolete claim there is the record
working, not a defect. `docs/ROADMAP.md:116` also matches and is correct: it is
the dated entry that already carries its superseding note.

## What this session did not verify

- **Whether `docs/MENTOR_BRIEF.md` holds other stale claims.** Three patterns
  were searched, not the whole file read.
- **The `docs/tasks/**` briefs.** Treated as historical by the same convention as
  recaps. That boundary is assumed for briefs, not measured — only recaps were
  counted.
- **Why #148's search missed this file.** Inferred from that session's own recap,
  which names `CLAUDE.md` and `ROADMAP.md` as the search targets; no telemetry was
  consulted.
