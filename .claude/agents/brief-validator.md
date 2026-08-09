---
name: brief-validator
description: RETIRED on 2026-08-09. Do not invoke. C1-C11 now run as `node .claude/hooks/validate-brief.mjs <brief>`, which returns the same verdict without a subagent, a context window, or a round trip. This file remains only so existing references resolve.
model: inherit
tools: [Read]
---

# Brief validator — retired

Retired 2026-08-09 on `experiment/harness-redesign`. **Do not invoke this
agent.** Run the checks directly:

```bash
node .claude/hooks/validate-brief.mjs docs/tasks/<task-id>-<slug>/brief.md
```

Exit 0 is APPROVED; exit 1 is REJECTED or STOP.

## Why it was retired rather than improved

All eleven checks were already shell one-liners — `grep`, `awk`, `sed`,
`wc -L` — written in prose in a markdown table and executed by a model that
read the table. They are pure string operations, so the agent was a context
window and a round trip wrapped around a function call. It could also misread
its own output; a function cannot.

The decisive property is the one the agent never had: **fixtures**. The
implementation at `.claude/hooks/lib/brief-checks.mjs` ships 14 tests,
including one that runs the port against a brief the agent itself recorded as
APPROVED 11/11.

## Verification of the port

- The 2026-08-09 C7 cycle is a test case: a subject measuring 57 with a
  16-character trailer measures 73 as a line, fails, and the diagnostic quotes
  the measured string rather than claiming the subject is too long.
- Against every brief in `docs/tasks/`, the three post-cutover briefs — the
  only ones inside C1's contract — return APPROVED, matching the record. The
  50 pre-cutover briefs fail C1 on their numeric identifier, which is correct:
  C1 audits a brief in flight, and merged briefs keep their numeric folders.

## What moved where

| Was | Now |
|---|---|
| C1–C11 | `.claude/hooks/lib/brief-checks.mjs`, one function each |
| The "How C7 extracts" reasoning | comments on `extractCommitSubjects` and `c7`, where the implementation they explain lives |
| Verdict rules (FAIL → REJECTED, STOP → STOP) | `validateBrief` |
| Output format and deep-link emission | `.claude/hooks/validate-brief.mjs`, simplified to a per-check line plus a verdict |
| The verb allowlist SSOT | `.claude/hooks/lib/commit-message.mjs` (moved there when `pre-commit-self-audit` was retired) |

The STOP status survived the port intact. A verb on neither list is not a rule
violation and must not read as one — that distinction was the reason C11
existed, and collapsing it into FAIL would have quietly discarded it.

## What the port does NOT carry

The agent judged nothing beyond these checks, by design, and neither does the
script. APPROVED remains what `PROCESS_MAP.md` §6 says it is: mechanical drift
cleared. A brief can pass 11/11 and still be the wrong thing to build, and no
amount of porting changes that.

## Why this file still exists

References across the doctrine point here, and `.claude/agents/executor.md` and
`.claude/agents/closer.md` are queued for the same treatment. Sweeping every
reference now would mean sweeping them twice; this tombstone keeps each one
resolving to something true until that sweep happens once.

See `docs/explorations/gate-economics.md` for the measurement behind the change.
