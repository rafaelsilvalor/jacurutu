# Session recap — 2026-08-17 — product-rename (Orchestrator)

**Mode:** Orchestrator, continuing the session that opened on 2026-08-16 with
the dev-queue board. Caminho B throughout: this session authored and committed
its own docs, and also executed board work that two chip sessions could not.
**Consumes:** `5ffbede` — head of `main` after #155, and the verified base of
the second branch.
**Branches:** `docs/jira-agent-tracker` (5 commits, merged as #155) and
`docs/product-rename` (3 commits, merged as #156).
**Produced:** the Notion board's post-seed shape, `docs/explorations/`'s
`product-rename.md` (renamed and rewritten), and
`docs/tasks/2026-08-17-product-rename/brief.md`.
**Pairs with:** `docs/sessions/2026-08-16-orchestrator-dev-queue-board.md`,
which covers the pilot's first arc. This recap covers the second.

## One-line summary

The rename went from an exploration note with an open *when* to an approved
Category L brief — and the session's most reusable output is not the brief but
the four instruments it found lying: two that said work was fine when it was
not, and two that said it was broken when it was not.

## Four instruments that lied, and what replaced each

Recorded together because the pattern is the finding. Each produced a confident
answer that was wrong, and each was caught only by a second instrument.

| Instrument | The lie | What discriminates |
|---|---|---|
| The MCP "requires authentication" banner | Listed three connectors as pending in the same turn a Notion call succeeded | Call the tool and read the result |
| A single connector probe | Found all three absent; minutes later all three were present, with no action taken | Re-probe across a few turns before concluding absence |
| `isRunning` plus a two-minute-old `lastActivityAt` | Read as "composing"; the session was hung | Compare against a session known to be live — siblings ticked every second while it sat 15 minutes |
| `ancestor-path` | Empty, read as "not in the teamspace"; a page inside the teamspace returned empty too | `notion-list-private-pages` — present means private, absent means elsewhere |

The connector case cost the most: two chip sessions opened during a window when
the parent session also had no connectors, reported a clean negative, and
produced a false diagnosis — "chip sessions do not receive connectors" — that
survived because the evidence looked solid. A diagnostic chip run later found
all three absent on first probe and present minutes after. **Connectors attach
late.** The briefings that told those sessions to treat one probe as final were
wrong, and that instruction was mine.

## What the board work actually cost

Three chip briefings were written for it and none executed it. The first was
superseded, the second handed the work back, the third was never opened —
because by then the parent session had both the Notion connector and the branch,
and did the whole thing in about ten minutes.

The lesson is not "chips are bad". It is that connector-dependent work belongs
wherever the connector already is, and that chipping out a separable task is
not free when the thing that makes it separable is also what makes it fail.

## The rename specification

The measurement reversed one premise and corrected four claims.

At `5ffbede`, over tracked files: **1273** occurrences, **938 (74%)** in
`docs/tasks/` + `docs/sessions/` + `automation/`, **335** live. An earlier
~1,308 was inflated by compiled `dist/`; an earlier 1259 predated #155, whose
own note added 12 live occurrences. The live surface grows with ordinary work,
which is its own argument for doing this early.

Four claims in the note were false and were corrected rather than extended: the
`.saci.json` location, the tsconfig-references claim (zero, measured), five
versus six `package.json` names, and two versus three consumers of `~/.saci`.
A fifth runtime class was missing entirely — five `SACI_*` environment
variables that live in a shell where no read path reaches, none of them in the
README.

**The clean break inverted an argument.** A fallback read would have been the
`refactor:`-compatible option, because it preserves behavior for existing state.
The clean break — correct on the owner's criterion — is the one R14 cannot
cover: an unchanged `~/.saci` yields a CLI that cannot find its credentials.
This session told the previous one the opposite before catching it, and the
correction reached that session before it wrote anything.

**D4 is the brief's load-bearing decision:** this is not a search-and-replace.
Four groups say `saci` deliberately — the rename note discussing its own
subject, the ROADMAP's dated identity shifts, GOTCHAS describing past incidents,
and hook test fixtures. A sweep passes every automated check while corrupting
exactly the files that hold the history the brief protects. `Plan required: yes`
exists for that list and nothing else.

## A commit sequence that saved history by accident of noticing

The note was renamed and rewritten in one staged change. Git reported the
similarity at **6%** — far below the 50% it needs — so `git log --follow` would
not have traversed to #126, and nothing would have announced the loss. Split
into a pure `git mv` at 100% and a separate content commit, the history follows.

**Generalizable:** moving and rewriting a file in one commit destroys rename
detection. It applies to any file the product rename itself moves.

## What the checks caught that the author did not

| Defect | Caught by |
|---|---|
| Brief title carried the full task id, not the date (C1) — the same defect as the 2026-08-14 lab-of-record session, now twice | `validate-brief.mjs` |
| No `### Commit sequence` section (C7) — without it C8 and C11 find zero subjects and **pass vacuously** | `validate-brief.mjs` |
| Two prescribed commit verbs outside the allowlist (`open`, `move`) | Reading the allowlist before writing |
| `record` proposed as a commit verb, twice in one session | Checking the allowlist at Pause 3 |
| The rollback procedure still naming the board by its old title | Reading the file back from disk after writing |

C7 is the instructive one: a brief without that section does not fail the
subject checks, it makes them inert. Green by absence of data.

## Process notes

- Two PRs, both squash-merged by the owner: #155 (board pilot) and #156 (rename
  specification).
- Nine worktrees reduced to two. The branches were left alone: after a squash
  merge no commit-level check proves containment (`G-GIT-1`), and content
  comparison was used instead.
- `AGENTS.md` was found to be an untracked, unreviewed copy of `CLAUDE.md` that
  has already drifted — it still says `SheetGateway`, renamed by #153. Queued
  as a follow-up rather than fixed in passing.
- The board took the product's new name before the repository did, deliberately,
  and its note records why.

## What this session did not verify

- Whether the rename brief survives contact with execution. Nothing has been
  renamed; the brief is a specification and the next session tests it.
- Whether the board pilot works. One card reached `Done`, and one transition in
  two days is not evidence. The window closes ~2026-09-06.
- Why the rename session hung. It was archived with a clean tree and no
  artifacts; the cause was not investigated.
- Whether the owner can rename the GitHub repository, and what that does to the
  five worktree paths beyond what `git worktree repair` is expected to fix.
