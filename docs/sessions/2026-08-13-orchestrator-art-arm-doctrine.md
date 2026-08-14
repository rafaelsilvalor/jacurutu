# Session recap — 2026-08-13 — art-arm-doctrine (Orchestrator)

**Mode:** Orchestrator, task modeling, then caminho B. Plan mode for the design
half; the Orchestrator wrote `docs/` only and never touched `packages/`.
**Consumes:** `4840da5` — head of `main` when the session opened, and the
verified base of the branch. Confirms the merge of PR #141 that the
2026-08-12 recaps could not cite.
**Branch:** `docs/art-arm-doctrine`, cut from `4840da5`. Six commits, plus the
two recaps. **Not pushed; no PR opened.**
**Produced:** `docs/tasks/2026-08-13-art-arm-doctrine/brief.md`, the fifth
identity shift, the art-arm and vocabulary declaration in `CLAUDE.md`, `R26`,
the `MENTOR_BRIEF.md` §2 reconciliation, and these recaps.
**Pairs with:** `docs/sessions/2026-08-13-executor-art-arm-doctrine.md`.

## One-line summary

The doctrinal gap the 2026-08-12 sessions left open is closed — Suindara went
from zero canonical documents to three — and the port brief it was supposed to
unblock is still blocked, on a scope question the session asked and did not get
answered.

## What the owner asked, and what the session delivered instead

The opening ask was to model the Suindara port at scope C and decide two things:
pipeline or caminho B, and whether doctrine comes as its own brief first.

Both were answered — caminho B, doctrine first — but measuring scope C before
writing anything turned up enough to change the shape of the port itself, so the
session shipped the doctrine brief and left the port unwritten. That is the
right outcome and it is also an incomplete one; see "Open items".

## Decisions closed with the owner

| # | Decision |
|---|---|
| D1 | `template` stays the source PSD/AI (142 sites); the incoming concept is **`artTemplate`**. The new word goes to the concept that arrives, because the rename cost is asymmetric |
| D2 | The doctrine brief **closes the surface policy** for absorbed laboratory code; the port brief only applies it |
| D3 | **Caminho B for both briefs** — doctrinal, and the port carries an Edit map a delegation prompt compresses badly |
| D4 | **Doctrine first, as its own brief.** It was already queued by the art-chain recap; D7 of 2026-08-13 gave it a third payload |
| D5 | `R26` names the **absorption rule**; the transport rule is deferred with its measurement |
| D6 | **No phase placement, no sequencing, no new row** in the ROADMAP map (rule of three) |
| D7 | **`E8` is not claimed** by this brief |
| D8 | The defective D6 checkbox is **corrected in the brief itself**, as a sixth commit, because an in-flight brief is mutable and a merged one is not |

## Three premises of the queued brief that did not survive measurement

The art-chain recap queued this brief with three claims. None held, and catching
them was most of the modeling work.

1. **"`R26` is already true and therefore cheap to freeze."** It is not true:
   four `console.warn` sites in `run-fetch.ts` and two `console.error` sites in
   `run-start.ts`. Worse, all six exist *because* R4 forbids silent swallowing —
   `run-start.ts:82-84` says so in a comment — so a transport rule phrased as
   "never writes to stdout" contradicts R4 rather than merely lagging it. It
   needs a diagnostics carve-out, which is design work, so it left this brief.
2. **"The *editable* / *art template* vocabulary split."** Off by one term.
   `editable` is already this repository's word for the *output* file
   (`buildEditableStem`, `editablePath`; 56 sites). The collision is between
   Saci's `template` — the source PSD/AI, 142 sites across 15 files — and
   Suindara's `template`, the HTML renderer.
3. **"The bundler exception for `@saci/web` is `E8`."** No `E8` entry exists on
   disk; `CLAUDE.md` still says `E8` is the next free number. A recap cannot
   reserve a namespace slot. This brief claimed nothing.

## What the scope-C measurement found, and did not act on

Measured during modeling, kept out of the brief deliberately, and the reason the
port brief is not written:

- **324 of scope C's 1,912 implementation lines arrive with no caller.**
  `matchTemplates`'s only production caller is `app/app.mjs`, which scope C
  excludes; `brief/registry.mjs` has zero production callers and
  `parseComManifesto` is called by nothing at all.
- **`brief/v1/parse.mjs` shipped two grammar versions in one day**, one of them
  a declared breaking change (`feat(brief)!`), on 2026-08-13 itself.
  `brief/registry.mjs` exists to absorb exactly that churn.
- **Four of scope C's five files were born within 72 hours** and never touched
  after their birth commit. That is absence of evidence, not stability.
- **R5 is violated twice in scope C, not four times.** The 458- and 596-line
  files are the two scope C already excludes.
- **R9 is the largest cost and was absent from the owner's list** — 305 comment
  lines of which 158 carry pt-BR, 17 comment lines citing Suindara's own
  `R`/`T`/`A` namespace with three colliding head-on with rules of the same
  number here, plus pt-BR identifiers, log strings and test descriptions.
- **Suindara's own `PORTING.md`, written 2026-08-12, argues against the port
  en bloc** and sets a parser-migration trigger (three consecutive unchanged
  real briefs) that `parse.mjs` measurably fails. It is another repository's
  document and does not enter this one's authority hierarchy, so it did not
  reopen the owner's decision — but it agrees with scope C on two points and is
  worth reading before the port brief is written.

## Gate outcome

`validate-brief.mjs` returned APPROVED 11/11 after one rejection: **C10 denied
the brief's own R9 checkbox**, which spelled out a pt-BR word pattern and
thereby put pt-BR on an English-only surface. The check was right.

The owner reviewed brief, verdict and artifact at the orchestrator gate and gave
an explicit go. The executor then ran six Pause 3 gates, each released
individually; the owner declined a standing pre-authorization when offered.

One STOP: the executor found Edit 3's D6 checkbox unsatisfiable and refused to
edit `R1`/`A4` to force it. The check was defective at the brief's own base —
2 matches at `4840da5` — because `R1` and `A4` quote example paths in order to
forbid them, and a path pattern cannot tell a prohibition from a violation.
Measured against the diff, 0 of the 23 added lines locate Suindara. Ruled met on
that measurement; the brief's text corrected as commit #6.

## What this session got wrong

1. **Estimated the brief at 419 lines; it is 526.** Estimated instead of
   counting, which is the same lapse the 2026-08-12 recap recorded as its own
   first error.
2. **Wrote the D6 checkbox without verifying it.** Five of the brief's six
   count-based checks were run against disk before writing. The sixth was not,
   and the sixth is the one that was broken.
3. **Three of four ad-hoc verifications against the executor were false
   accusations.** A degenerate `grep -c $'\r$'` pattern reported every line as
   CRLF and nearly accused the executor of a mixed-ending file it had not
   created; a hand-counted `sed` range, wrong by two lines, reported a verbatim
   block as divergent when it was byte-identical. The one check that found a
   real defect was the executor's, not the Orchestrator's — and the one
   Orchestrator check that held was the one anchored on `git show <base>:<path>`
   rather than on a pattern written in the moment.
4. **The brief violated R9 inside its own R9 verification.** Caught by C10, not
   by review.

Items 1 and 2 share a root: the checks that failed are the ones nobody ran
before trusting them.

## Open items carried forward

- **The port brief is blocked, and not for lack of modeling.** The question that
  gates it — *what runs first after this port?* — was asked twice and is
  unanswered. Lesson #13 applies: the pipeline runs on closed decisions, and so
  does caminho B. Three candidate re-cuts of scope C are recorded in the session
  transcript and summarized above.
- **The transport rule** — composition functions transport-agnostic — needs a
  diagnostics carve-out reconciling it with R4, and the next free rule number.
  Its `R26` citation in the 2026-08-12 recap is superseded by `R26`'s own text.
- **`E8` remains free and unwritten.** The `@saci/web` bundler exception is
  still only a recap's intention.
- **F6** (the frame regex does not survive the ADF path) and **F3** (26% of
  cards carry no copy pointer) remain brief-shaped and independent of everything
  above.
- **The Drive-scope decision** remains the owner's, unchanged in urgency.

## Next session

Open an Orchestrator session for the port brief only after the scope question is
answered. Suggested opener:

> Continuing Saci in an Orchestrator session. Mode: task modeling — the Suindara
> engine port. Read `docs/sessions/2026-08-13-orchestrator-art-arm-doctrine.md`
> and `CLAUDE.md`'s art-arm paragraphs plus `R26` first; the doctrine is closed
> and is not to be relitigated. The open question is the scope re-cut: which
> units port first, given that `match.mjs` and `registry.mjs` arrive callerless
> and `parse.mjs`'s grammar is still moving. Answer that before any brief.
