# Session recap — 2026-08-14 — roadmap-operating-claim (Orchestrator)

**Mode:** Orchestrator, opened on a follow-up the owner queued at the close of
`2026-08-14-python-lab-of-record`. The note's shape was already ruled and marked
non-relitigable; two questions were open — placement and category. Category S,
so no brief and no `@executor`: the Orchestrator wrote the one note itself under
the write gate.
**Consumes:** `23bec62` — head of `docs/python-lab-of-record`, the branch of the
still-open PR #144. Not `main`.
**Branch:** `docs/roadmap-operating-claim`, cut from `23bec62`. Two commits.
**Produced:** the superseding note at `docs/ROADMAP.md:58-69`, and this recap.
**Pairs with:** nothing — one session, one role, no executor half.

## One-line summary

`ROADMAP.md`'s last false present-tense claim now carries a note beneath its
dated entry — and the measurement that placed it found the claim was not the
section's only stale sentence, only its only unsuperseded one.

## `main` was not a usable base

```
$ git log --oneline origin/main -1
4652d2a fix(adapter-jira): support block structure in ADF text extraction (#143)

$ gh pr view 144 --json state,mergeable,mergeStateStatus
{"mergeStateStatus":"CLEAN","mergeable":"MERGEABLE","state":"OPEN"}
```

PR #144 was still open, so `main` lacked `c4a3918` — the Phase 4 correction the
note has to cite. Both documents the follow-up told this session to read exist
only on that branch; reading them from `main` would have returned nothing. The
branch was cut from `23bec62` under the follow-up's own pre-authorization.

## The measurement that decided placement

The instruction was to measure whether other dated entries carry stale
present-tense claims before assuming line 49 was alone. It was not alone.
**1 of 4** false present-tense claims in the section has no later entry
contradicting it.

| Line | Claim, false on 2026-08-14 | Superseded in-section by |
|---|---|---|
| **49** | `automation/` "continues to operate as the live coordination pipeline" | **nothing** |
| 53 | "team consumes the Sheet" | 70–71, then 96–99 |
| 69–71 | coordination "fed unidirectionally… designers publish state" | 93–95, naming 2026-05-28 |
| 81–82 | "Sheets stays in the system as the aggregation surface" | 112, `adapter-sheets` parked |

That table is why the note went beneath the 2026-05-15 entry instead of becoming
a standing note atop the section. The section's mechanism — each entry restating
the prior framing and refining it — already works for three of the four. A
section-wide note would have restated three supersessions that are on disk and
functioning, and would still have needed a paragraph naming line 49 as the one
nothing covers.

## The blockquote is new to the section and old to the file

`## Identity shifts` carries **0** notes beneath an entry and two correction
devices *inside* one, both from the preceding two days: the external-document
supersession at 132–136 and the inline parenthetical at 140–144. But
`ROADMAP.md` already blockquotes at line 3 (`> **Living document.**`) and line
159 (`> **Notation:**`), both out-of-band notes on how to read the surrounding
content — this note's exact register. The Update protocol permits either shape;
its wording forbids only a **silent** rewrite, and all three devices are dated.

## Three deliberate choices in the note's text

- **It quotes its target rather than citing `ROADMAP.md:49`** — line numbers
  drift, the quotation survives reflow.
- **It does not claim the legacy pipeline stopped running.** D3 of the prior
  session recorded that as never measured. The note declares the gap in its last
  sentence instead of closing it silently: what it corrects is the
  *identification* of that pipeline with this repository's `automation/`.
- **`document`, not `fix`.** The false sentence is preserved on purpose, so
  nothing was repaired; `declare` would assert a position `c4a3918` and the
  2026-08-14 ruling already hold.

## Category S was measured, not assumed

1 file, 13 inserted lines, no rule change, no code, no test — against PR #144's
three files, rule change and four commits at Category M. Playbook Lesson #2
pushes S→M on constraint count and four constraints applied here, but the
owner's ruling had already fixed every one, so a brief would have carried
nothing new. Skipping it also removed #144's own defect mode: that brief shipped
a behavior check whose `operates` half could not be met without editing the line
the same brief excluded by name. With no brief, there was no second document to
contradict.

The gates did not scale with the category: write gate, Pause 2, Pause 3 with the
unconditional green boundary (`112 of 112` tests, `tsc -b` exit 0), and the
owner's push.

## What this session did not verify

- **No `buraqueira` checkout was read.** The note calls it the laboratory of
  record on the authority of `CLAUDE.md` and the 2026-08-14 ruling, not a fresh
  measurement.
- **`69 days` is arithmetic** from `8fada81`'s date, matching the prior
  session's figure. Not re-derived from `git log`.
- **The falsehood classification is reading, not execution.** No tool decides
  whether a present-tense sentence is false today; the table is judgment over
  four sentences, and another reader could score 53 or 81–82 differently.
- **Three adjacent items were left untouched, by scope.** `ROADMAP.md:101` names
  `automation/` where the subject is the legacy pipeline — the misattribution
  the D2 hunk fixed at line 140, but a different falsehood class from
  `operates`. `ROADMAP.md:47` predicts the desktop UI "within ~3-4 months" from
  2026-05-15, expiring ~2026-09-15 with Phase 1 still in progress.
  `ROADMAP.md:126` states Suindara's engine "is ported" while no arm package
  exists. None was edited; none is queued.
- **`notes.md` still reads as if the follow-up were pending.** Its queue entry
  is closed by this branch, and its three other open items are untouched. Not
  edited here: Category S was scoped to two commits, and the closure is recorded
  in this recap rather than in the queue entry.
