---
name: closer
description: RETIRED on 2026-08-09. Do not invoke. Its mechanical checks now run as the architecture-guard hook at commit time; its judgment half has no successor, and that gap is declared rather than covered. Push and PR remain the owner's, unchanged.
model: inherit
tools: [Read]
---

# Closer — retired

Suspended 2026-08-09 for making development too slow, then retired the same day
on `experiment/harness-redesign` once the measurement explained why.
**Do not invoke this agent.**

## Why it was dissolved rather than rebuilt

Two findings decided it.

The `gate-economics` measurement found the closer's **owner gate does not
appear once** in 101 recaps and 10 task notes. The gate it existed to open was
never recorded as opening on anything.

And its Phase A checks split cleanly. R25 dependency direction, R21 import
extensions, R24 unjustified `any` and R5 file size are text operations — they
never needed an assembled branch, and waiting until push meant finding a
violation long after the commit that introduced it. Building a faster reviewer
would have answered the wrong question.

## Where each check went

| Was | Now |
|---|---|
| (a) R25 dependency direction | `.claude/hooks/architecture-guard.mjs` (deny) |
| (a) R21 import extensions | `.claude/hooks/architecture-guard.mjs` (deny) |
| (a) R24 `any` without rationale | `.claude/hooks/architecture-guard.mjs` (deny) |
| (a) R5 file size | `.claude/hooks/architecture-guard.mjs` (deny on source, ask on tests) |
| (c) secret hygiene | `.claude/hooks/architecture-guard.mjs` (ask — the match is probabilistic) |
| (a) R18 storage routing | **no successor** |
| (a) R19 registry dispatch under A3 | **no successor** |
| (a) R6 function size with its orchestration exception | **no successor** |
| (a) R4 silent catch, with N1 suppression | **no successor** |
| (b) duplication against `core` | **no successor** |
| Phase B — push and open the PR | the owner, exactly as before |

Calibration when the guard was built: 64 source files, 2 findings, both R5, both
pre-existing on `main`, zero false positives on the other four checks.

## The judgment half has no successor, on purpose

Five checks needed judgment, and encoding them badly is worse than not encoding
them (A3). They are not covered by anything today. That is a real reduction and
it is stated here rather than implied away.

What absorbs it: Pause 2 and Pause 3, which the same measurement found to be
the highest-yield gates in the system — at least twelve recorded catches,
including ones no mechanical check could make. The closer was reviewing at the
end what those gates already catch in flight.

## N1–N3 retire with it

The three finding-suppression rules existed to stop the closer reporting noise.
With no closer, they have nothing to suppress. `docs/PROCESS_MAP.md` §8 no
longer lists them as a live namespace.

## What did NOT change

Push and PR are the owner's call, per branch, every time — R17 = G-R5 = M-R11.
The closer never held that authority and retiring it grants nobody else any.

See `docs/explorations/gate-economics.md` for the measurement.
