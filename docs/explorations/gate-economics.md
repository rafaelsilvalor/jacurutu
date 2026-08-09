# Gate economics

Status: exploration — no implementation mandate
Disposition: open — 2026-08-09
Origin: 2026-08-09 harness-redesign session (`experiment/harness-redesign`), measured against `docs/sessions/` (101 recaps), `docs/tasks/*/notes.md` (10 files) and `git log main` (129 merges). Authored on the experiment branch rather than in a Mentor session through the write gate — an owner-approved deviation for this branch, recorded here rather than left implicit.
Roadmap link: none — this measures the process, not the product.

## Why this exists

The harness was rebuilt on the premise that it "costs more than it delivers".
That premise is quantifiable, and acting on it without measuring would have
produced a redesign by taste. This note is the **baseline**: the state of the
process before any change, and the evidence that redirected the redesign away
from its first, wrong conclusion.

## Volume baseline

| Surface | Lines |
|---|---:|
| Product source (`packages/**/*.ts`) | 10,191 |
| Briefs + notes (`docs/tasks/`) | 28,090 |
| Recaps (`docs/sessions/`) | 16,327 |
| `harness/` | 3,308 |
| Canonical docs + agents + skills | 3,890 |
| **Process prose total** | **51,615** |

Roughly five lines of process prose per line of shipped code.

## Flow baseline

Of 129 merges into `main`: 96 `docs`, 15 `feat`, 7 `chore`, 2 `refactor`,
2 `fix`. By surface touched, 45 commits change the process
(`harness/`, `.claude/`, PLAYBOOK, PROCESS_MAP, MENTOR_BRIEF, GIT_WORKFLOW,
CLAUDE.md) against 21 that change product code.

The bootstrap defence does not survive the trend:

| Window | `docs` | `feat` |
|---|---:|---:|
| First 40 merges | 33 | 0 |
| Last 40 merges | 32 | 4 |
| Last 30 days (process : product commits) | 16 | 8 |

The ratio held at roughly 2:1 across the entire life of the repository. It is
a steady state, not an amortizing curve. The largest briefs are briefs about
the process: 050 (1,375 lines), 051 (1,080), 015 (1,031), 012 (912), 014 (785),
052 (720), 013 (707).

## Finding 1 — the mechanical validator has low, partly self-inflicted yield

Approximately 38 `brief-validator` runs are recorded; 4 returned REJECTED.

| Event | What it caught | Class |
|---|---|---|
| C4 | the brief mandated work on a `claude/*` scaffolding branch | real process defect |
| C11 | commit verb `widen`, outside the allowlist | rule enforcement |
| C2 | an annotation on the `Category:` line | template artifact |
| C7 | an annotation inflated the measurement to 73; the subject was 57 | **false positive; cost a full cycle** |

Two of four rejections were the validator tripping over its own extraction
rules rather than over a defect in the work. The two legitimate catches are
both of a kind a script catches — which is the evidence behind moving these
checks into hooks.

## Finding 2 — Pauses 2 and 3 have high yield, and catch what no check could

At least 12 distinct catches are recorded, including: an R9 violation in
content, a substring collision, a `parseVertical` empty-return edge case, two
commit subjects corrected on semantics, and four Check-3 verb collisions
resolved in flight. One recap line states the case exactly:

> Caught at Pause 3 by reading the files, not by any check.

Cutting gates on intuition would have removed the highest-yield layer in the
system.

## Finding 3 — there is no such thing as "a gate"; there are three things

| Type | Instances | Yield | Disposition |
|---|---|---|---|
| Mechanical filter | validator C1–C11, pre-commit-self-audit, green boundary | low, ~50% self-inflicted | migrate to hooks |
| Semantic filter | Pause 2, Pause 3 | high, irreplaceable | keep, relieved of mechanical content |
| Decision point | Pause 1, write gate, orchestrator gate, push | filters no defect; ratifies a choice | keep; its cost is attention, not verification |

Pause 1 has **no recorded defect catch** — it has roughly eight recorded
decision ratifications (riders, rulings, questions closed). It is not a weak
filter; it is a different instrument. The write gate likewise records no catch:
it is protocol, and its one verifiable part (the byte-identical read-back) is
mechanizable. The closer's owner gate appears nowhere in the record.

## What this changes

The original premise stands, but its cause moves. The problem was not gate
count; it was that **semantic gates were carrying mechanical work**. The six
Pause-3 presentations of the 2026-08-09 credential-guard task were not six
judgments — they were one or two judgments and four verifications that a hook
now performs.

This also downgrades a `rule-retirement` line of work: if the bottleneck was
mechanical content inside semantic gates, retiring rules wholesale addresses
less than it appears to.

## What this does NOT establish

This measures what was **recorded**. Recaps are written by the same sessions
being evaluated, so they over-record dramatic catches and under-record silent
approvals. Three consequences:

1. The Pause catch count is a **floor**, not a total.
2. The "no recorded catch" results for Pause 1 and the write gate are weak
   evidence — absence in a narrative record is not absence in the world.
3. The ~38 validator runs are counted from recap mentions, which may
   double-count a verdict named in both the orchestrator and executor recap.
   Treat the rejection rate as approximate.

A stronger measurement would instrument the gates at runtime rather than read
their prose afterwards. That is possible now that hooks exist, and is the
natural successor to this note.

## Changelog

- 2026-08-09 — created; baseline measured during the harness-redesign session, disposition `open`.
