# Session recap — 2026-08-12 — measure-jira-copy-share (Orchestrator)

**Mode:** Category S — no brief, no `validate-brief.mjs`, no subagent. One actor
in the main session did the modeling and the execution, with Pauses 1/2/3 and
the green boundary honored throughout.
**Branches:** `docs/measure-jira-copy-share` (5 commits, merged as `664195d`,
PR #140), then `docs/ratify-copy-locality-disposition` for the ratification and
these recaps.
**Span:** the work ran on 2026-08-12; the ratification and the close landed
2026-08-13. The recap keeps the start date, per the task it describes.
**Pairs with:** `docs/sessions/2026-08-12-executor-measure-jira-copy-share.md`.

## One-line summary

Measured what share of design cards carry their copy inside Jira — the third
path the art-chain spike left open — and the answer is **0 of 47**, which closes
the question without shrinking the problem.

## What the owner asked

A number, with evidence, and a note recording it. The framing was explicit and
correct: the useful output is not a percentage but whether the Jira-body path is
a real alternative, a partial mitigation, or a dead end — "including the case
where the answer is almost never, buy the scope change."

That framing is why this session could report a bad result cleanly. The owner
had already named the outcome that would be unwelcome, so there was nothing to
soften.

## Decisions closed with the owner

| # | Decision |
|---|---|
| D1 | **Category S** — probe and run instructions authored directly, no brief, no pipeline |
| D2 | The result lands in `docs/explorations/`, not the task's `notes.md` |
| D3 | `--max` default of 50 cards |
| D4 | Keep the 3-card first-line sample — bounded content exposure, enough to judge real copy from boilerplate |
| D5 | Internal presentation reports live in a gitignored `reports/`, in pt-BR |
| D6 | Disposition ratified `open` → `candidate` after reading the measurement |
| D7 | **Suindara is to be ported, not integrated** — see below |

## The measurement, and the instrument that lied first

The probe's own first classification read **94% jira-resolvable at a
200-character threshold**. It was wrong, and catching that was the session's
real work.

The probe ranked five candidate surfaces by prose length. Parent descriptions
run 1,430–4,901 characters — campaign briefings inherited by every child card —
while a design card's own description runs ~95, an intake form. So the parent
always won, and one briefing was counted once per child as though it were
distinct copy. One text served **14 cards**.

The repeated-hash check caught it. That check was added during authoring
specifically to detect boilerplate wearing copy's length, and it is the only
reason the session did not ship a confident false positive.

**Generalizable lesson: text volume in Jira is not information in Jira.** The
`[class]` lines remain correct as to what they measure and misleading as to the
question, so §3 of the note exists to travel with them.

## Findings the session did not go looking for

Both survive the Drive-scope decision entirely, and both are brief-shaped:

- **26% of cards carry no copy pointer at all** (12 of 47, all
  `copy_source=fallback` with no Drive URL). They are outside every remedy under
  discussion — widening the OAuth scope does not reach them — and nobody had
  looked at them.
- **The production frame regex cannot survive the ADF path.**
  `adfExtractText` joins text nodes with a single space, so `/^\s*L\d+\s*:/m`
  counts 1 marker on a two-frame document instead of 2. Verified empirically
  against the compiled adapter, not by reading. True whether or not copy ever
  moves into Jira.

Neither was acted on.

## D7 — the Suindara reversal, and why it needs a home

Late in the session the owner asked whether Suindara is being ported or
interlinked. The recorded answer was **interlinked**: the 2026-08-12 art-chain
recap justifies a separate repo as "an earned boundary" because templates are an
installable versioned ecosystem, and the art-chain probe spawns `render.mjs` as
a subprocess with its contract gaps reported "upstream".

The owner reversed it: **port, not integrate** — Suindara does not carry Saci's
level of control and is closer to a test bench than to the product. That is
authority level 1 and it stands.

Measured before estimating, and the owner's argument holds up:

```
9 files, 3,833 lines (2,966 implementation, 867 tests), zero dependencies
R5 (≤400 lines): 4 of 7 implementation files violate — 458, 576, 596, 693
R23 (node:test): already satisfied
R2 (no new runtime deps): no package.json anywhere
```

Scope chosen: **C — engine only.** `app.mjs` (596) and `serve.mjs` (458) are
dropped, because they are the brief UI and D2 of the art-chain session already
plans `adapter-http` + `web` to replace it. Porting 1,054 lines with a planned
substitute would be work done to be deleted.

**The doctrinal gap this exposes is real and unclosed.** Suindara appears in zero
canonical documents — not `CLAUDE.md`, not `docs/ROADMAP.md`, not
`docs/explorations/`. The topology lived only in a session recap, which is
authority level 6, and there is now a decision contradicting it. The owner had to
ask because there was nowhere to read.

## What this session got wrong

Five errors, all caught and corrected in-session, listed because the pattern in
the first one is the useful part:

1. **Estimated three commit-subject lengths instead of counting them** (44/48/57
   claimed, 45/52/66 actual). None breached the 72 limit, so nothing shipped
   wrong — but the habit is exactly the one this project's evidence discipline
   exists to prevent. Corrected mid-session; the last two subjects were counted.
2. **Claimed the anchored frame regex would report zero markers.** It reports
   one. Found by running it rather than reasoning about it.
3. **Shipped a double-print defect** in the probe — `run` and `main` both called
   `printCriteria`. Invisible on every failing path because they throw first, so
   only the live run exposed it. Fixed in `f1c533d`.
4. **First measurement of Suindara's size read 15,455 lines** — the sweep
   included the repo's own `.claude/worktrees/`. Real number is 3,833.
5. **Asserted `/estilo-bancada` would not work until the next session**, on the
   evidence of an `Unknown skill` error. The catalog reloaded mid-session. The
   evidence was right; the inference about the future was not.

## Open items carried forward

- **The Suindara port, scope C.** Needs a brief. Handed to a fresh session.
- **Doctrine for Suindara's place in the architecture.** No canonical document
  names it. D7 makes this urgent rather than tidy.
- **The 26% with no copy source.** Unmeasured why. Brief-shaped.
- **F6, the frame regex.** Brief-shaped, independent of everything else.
- **The Drive-scope decision** remains the owner's, unchanged in urgency.
