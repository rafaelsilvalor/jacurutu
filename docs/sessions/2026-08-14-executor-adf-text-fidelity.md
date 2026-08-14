# Session recap — 2026-08-14 — adf-text-fidelity (executor)

**Mode:** Category M, caminho B — the brief was pre-saved and this session
executed it from disk. **Unusual:** the same session wrote the brief, acting as
Orchestrator, minutes earlier. The two halves are recorded separately anyway,
because a self-executed brief is exactly the case where an author's blind spot
survives into execution — and one did.
**Branch:** `fix/adf-text-fidelity`, created here with
`git switch -c fix/adf-text-fidelity 19bdafc` after reading the base SHA back.
The session opened on the `claude/*` scaffolding branch, which carries no work.
**Pairs with:** `docs/sessions/2026-08-14-orchestrator-adf-text-fidelity.md`.

## Commits

```
383e2a4  docs(tasks): add brief for 2026-08-14-adf-text-fidelity          (55 chars)
6013e65  fix(adapter-jira): support block structure in ADF text extraction (65 chars)
098eb18  docs(explorations): document the F6 fix in the copy-locality note (65 chars)
```

```
$ git diff --stat main...HEAD
 docs/explorations/jira-copy-locality.md          |   9 +
 docs/tasks/2026-08-14-adf-text-fidelity/brief.md | 320 +++++++++++++++++++++++
 packages/adapter-jira/src/extract.test.ts        |  78 +++++-
 packages/adapter-jira/src/extract.ts             |  63 ++++-
 4 files changed, 459 insertions(+), 11 deletions(-)
```

## Pause ledger

Four pauses, each released individually by the owner. No standing
pre-authorization was offered and none was assumed.

| Pause | Subject | Outcome |
|---|---|---|
| Pause 1 | — | Skipped, `Plan required: no` |
| Pause 2 | `extract.ts` | Released; the owner also ruled on the one extrapolation (below) |
| Pause 3 ×3 | one per commit | Released individually |

## The brief contradicted itself, and execution found it first

The brief placed Pause 2 "after the first modified file" and, four sections
earlier, made a green tree at every pause non-negotiable. Those cannot both
hold: with `extract.ts` rewritten and `extract.test.ts` still asserting the old
flattened output, `npm test` fails, and `green-boundary.mjs` is a **Stop** hook
— it blocks the end of the turn that would present the pause.

Resolved in favor of constraint 4, the more specific and the one declared
non-negotiable: both files were edited, the suite was run green, and Pause 2
was then presented with `extract.ts` as the file under review. Reported to the
owner at the Pause 3 that preceded it rather than patched into the brief
mid-flight.

The green boundary therefore never fired red. It shaped the commit structure
instead — which is what a gate that is designed correctly does.

## The one step beyond the specified scope

`extract.ts`'s file header opened with a behavior-preserving port claim and
listed `adf_extract_text` among the ported functions. The brief specified an
update to the *function's* doc comment and said nothing about the header, so
after this change the file would have carried a false statement three lines
from a true one.

Three lines were added recording the exception. This was shown at Pause 2 as an
extrapolation, with removal offered; the owner kept it.

## Verification, verbatim

```
$ npx tsc -b; echo "exit: $?"
exit: 0

$ npm test | grep -E "^ℹ (tests|pass|fail|skipped)"
ℹ tests 329      ← packages (base at 19bdafc: 324)
ℹ pass 328
ℹ fail 0
ℹ skipped 1
ℹ tests 112      ← hooks
ℹ pass 112
ℹ fail 0
ℹ skipped 0
```

```
$ grep -c 'join(" ")' packages/adapter-jira/src/extract.ts
0
$ grep -c 'concatenates text nodes with single spaces' packages/adapter-jira/src/extract.test.ts
0
$ wc -l packages/adapter-jira/src/extract.ts packages/adapter-jira/src/extract.test.ts
  257 packages/adapter-jira/src/extract.ts        (R5 budget 400)
  311 packages/adapter-jira/src/extract.test.ts   (E6 ceiling 800)
```

The F6 regression test is the one that matters:

```
✔ adfExtractText keeps one frame marker per line for an anchored regex
```

Three paragraphs opening `L1:`, `L2:`, `L3:` yield **3** matches under
`/^\s*L\d+\s*:/gm`. On 2026-08-12 the same shape with two frames yielded 1.

Commit 3 was additions only — 9 insertions, 0 deletions — which is how the
brief's "measurement paragraphs stay byte-identical" checkbox was proved.

## Every Done criterion was met

No checkbox went unmet. Two were satisfied differently than written and both
are recorded above: the Pause 2 ordering, and the header clause.

## Gates and hooks

`validate-brief.mjs` — APPROVED 11/11, first run, before execution.
`green-boundary.mjs` — ran at each turn end that touched `packages/`; never
red. Commit-message and architecture guards — no denial, no STOP.

## What this session got wrong

One item, small: the Pause 3 for commit 3 reported the subject as 63
characters. It is 65. Both are inside the 72 budget, so nothing shipped
differently, but a number offered at an approval gate should be counted rather
than eyeballed. The two other subjects were reported correctly.

## Push status

**No `git push` was executed.** No PR was opened. The branch sits at `098eb18`
plus this recap commit, `git status` clean, and pushing is the owner's call.
