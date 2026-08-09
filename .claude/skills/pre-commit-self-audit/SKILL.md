---
name: pre-commit-self-audit
description: RETIRED on 2026-08-09. Do not invoke. Checks 1-4 now run as the commit-guard hook, which fires on every git commit whether or not anyone remembers it. This file remains only so existing references resolve; it describes where each part went.
---

# Pre-commit self-audit — retired

Retired 2026-08-09 on `experiment/harness-redesign`. **Do not invoke this
skill.** Nothing here needs running; the checks it described now execute
themselves.

## Where each check went

| Was | Now |
|---|---|
| Check 1 — subject length ≤ 72 | `.claude/hooks/commit-guard.mjs` (deny) |
| Check 2 — Conventional Commits type | `.claude/hooks/commit-guard.mjs` (deny) |
| Check 3 — imperative verb allow/deny | `.claude/hooks/commit-guard.mjs` (deny / ask) |
| Check 4 — no `Co-authored-by` trailer | `.claude/hooks/commit-guard.mjs` (deny) |
| Check 5 — staged scope = edit scope | **no successor** — see below |
| `ALLOW=` / `DENY=` verb lists | `.claude/hooks/lib/commit-message.mjs`, as `VERB_ALLOWLIST` / `VERB_DENYLIST` |

The skill's three-valued outcome survives intact: PASS became `allow`, FAIL
became `deny`, and STOP — a verb on neither list — became `ask`, which puts the
decision in front of the owner instead of letting a model classify it.

## The verb SSOT moved

`.claude/hooks/lib/commit-message.mjs` is now the single source. The lists are
data pinned by tests, not prose recovered by a regex from this file. Both
consumers read the new location; `brief-validator` C11 extracts it with:

```bash
node --input-type=module -e "import {VERB_ALLOWLIST} from './.claude/hooks/lib/commit-message.mjs'; console.log(VERB_ALLOWLIST.join(' '))"
```

Transcription was verified by set comparison against this file before it was
reduced: 20 allowlist verbs and 17 denylist verbs, same order, no drift.

## Check 5 has no successor, deliberately

Check 5 compared the staged file list against `EDIT_SCOPE`, the files an Edit
block declared. It is mechanical, but its input comes from the brief, and a
hook has no brief to read.

- **In the `@test` / `@code` lane** it is not needed. The `file-ownership` hook
  denies out-of-domain writes at the moment they are attempted, which is a
  stronger guarantee than comparing two lists after the fact.
- **In the executor lane** it falls back to the owner's Pause 3 review. That is
  a real reduction in mechanical coverage, recorded here rather than papered
  over. The 2026-08-09 gate-economics measurement found Pause 3 to be the
  highest-yield gate in the system, which is why the fallback is acceptable
  rather than merely tolerable.

## Why this file still exists

The doctrine sweep ran later the same day, so the live references are gone and
what points here now is history: the recaps and task notes that recorded the
skill while it was in use, which are never rewritten. `brief-validator` and
`closer` were retired alongside it and carry their own tombstones. The
executor survives — it still carries docs work, which the `@test`/`@code` pair
cannot — and no longer preloads any skill.

See `docs/explorations/gate-economics.md` for the measurement behind the change.
