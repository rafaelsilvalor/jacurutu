# Session recap — 2026-07-23 — 037-evidence-close-protocol (executor)

**Mode:** caminho-B execution (pipeline-modifying, M-R15; precedent 027 — no
planner, no validator; owner pre-saved the brief). Fully supervised: Pause 2
× 2 Edits, Pause 3 × 3 commits, one owner STOP with a pre-commit brief
amendment, two owner-ruled deviations, one caught no-debt violation, one
post-merge record reconciliation on executor git evidence.
**Executor:** Claude Code main session, Rafael as owner relaying mentor
rulings.
**Merged via:** PR #91, squash merge → `main@b73c311`.
**Pairs with:** `2026-07-23-mentor-037-evidence-close-protocol.md` (same PR).
**Date note:** session artifacts are dated 2026-07-23 (owner catch at recap
review; earlier uncommitted drafts were mis-dated 2026-07-15).

## One-line summary

Codified the evidence-close doctrine surfaced by the 036 run: executor
Pause 3 gains step 7 (evidence-close — `git log --format=%B -1` pasted
verbatim, confirmed against the approved message) plus a new subsection with
three mechanical transport rules (final-message, single-block packaging,
no-debt precondition), and the playbook gains Lesson #15 — 3 commits,
docs-only, +246 across 3 files, 232/0 at every boundary, with the run itself
reflexively bound to the rules it was writing.

## Pre-commit amendment (single event, no history rewrite)

At commit #1's first Pause 3 the owner STOPped to apply a ratified scope
addition: the **Single-block packaging** rule (every Pause presentation and
every evidence-close paste emitted as ONE fenced code block). Two find-block
amendments were applied to the brief on disk (207 → 214 lines) **before
commit #1 existed**; Edit 1 verification was re-run on the amended file,
Pause 3 was re-presented and approved, and commit #1 was created exactly
once (`09e0a02`). No amend, no rewrite — established post-merge by reflog,
SHA stability, and merged-file content (see "Post-merge reconciliation").

## Executed

- **Edit 1** — brief verified at
  `docs/tasks/037-evidence-close-protocol/brief.md` (exact path, first-line
  match), amended per the ruling above, committed as commit #1 on
  `docs/executor-evidence-protocol` (branched from `main@53c3bb0`, in sync
  with origin).
- **Edit 2** — `.claude/agents/executor.md`: step 7 (evidence-close)
  appended to Pause 3, new subsection "Evidence transport and Pause
  precondition" with the three transport rules. Both find blocks matched
  byte-exact. Verification greps 4/1/1/1 (`evidence-close`,
  `Final-message rule`, `Single-block packaging`, `No-debt precondition`);
  Pause 1/2 subsections and "What a Pause is (and is not)" untouched.
- **Edit 3** — `docs/AGENT_PLAYBOOK.md`: `Lesson #15` pre-grep guard clean
  (no numbering conflict), Lesson #6 find block matched byte-exact (single
  line on disk), Lesson #15 blockquote appended; `grep -c "Lesson #15"` = 1.

## Deviations (owner-ruled, committed brief untouched)

1. **Edit 2b intro line.** The packaging amendment left the brief's Edit 2b
   replace block reading "Two mechanical rules" over three bullets; the
   executor flagged the mismatch at Edit 2's Pause 2. The ruling as
   issued prescribed fixing the brief and amending commit #1; as
   executed, the corrected intro ("Three mechanical rules") landed in
   executor.md via Edit 2b inside commit #2 (`8d4ffa3`), the brief was
   never edited again, and no amend occurred — sanctioned as the
   reconciled record post-merge. The brief on `main` prescribing "Two" while
   executor.md reads "Three" is a recorded, owner-sanctioned deviation, not
   a defect.
2. **Lesson #15 enumeration.** Mentor-originated translation drift caught
   at Edit 3's Pause 2 gate: the brief's Lesson text labeled "three rules"
   as {evidence-close, final-message, no-debt} while executor.md's "Three
   mechanical rules" means {final-message, single-block packaging, no-debt}.
   Owner-ruled relabel: "the Pause 3 evidence-close step plus three
   mechanical transport rules". Annotated at that Pause 2, at commit #3's
   Pause 3, and in the final report.

## Reflexive requirement — outcome (one caught violation)

The run was bound to the rules it was codifying. Outcome, stated accurately:

- **One no-debt violation occurred mid-run.** Commit #1's evidence-close
  did not reach the chat, and the next turn opened Edit 2's Pause 2 over
  the outstanding debt. It was caught by the mentor, the Pause was
  REJECTED, and the debt was settled by the verbatim `%B` paste of
  commit #1, confirmed in chat, before the run advanced. A caught
  violation recovered by the mechanism being codified — evidence FOR the
  patch, not a clean checkbox.
- **One stale Pause 2 re-emission** (1st occurrence for the ledger): a
  pre-ruling artifact was re-sent instead of reflecting current on-disk
  state. Caught by owner, rejected, superseded by the complete Edit 2
  presentation.
- From the packaging rule's ratification onward, every Pause presentation
  and every evidence-close arrived as one fenced code block; commits #2 and
  #3 evidence-closed clean, and the final report shipped only after
  commit #3's evidence-close was confirmed.

## Verification — the done criteria

- `npm run build` exit 0 and `npm test` **232 pass / 0 fail** before each
  of the 3 commits (docs-only change; sanity runs).
- Structural: `git diff --name-only origin/main..HEAD` showed exactly the
  brief, `.claude/agents/executor.md`, and `docs/AGENT_PLAYBOOK.md`
  (+246/−0); nothing under `packages/**` or `harness/**`.
- `pre-commit-self-audit`: **15 PASS / 0 FAIL** (5 checks × 3 commits;
  commit #1 audited twice, pre- and post-amendment, both clean).
- All three commit messages verified verbatim via `git log --format=%B -1`
  after each commit — no drift, no trailers, no amends. STATE.md not
  created (Category M, single session).

## Green mechanism (record integrity)

The pre-commit hook is not wired in this clone (`core.hooksPath` unset), so
green was proven by running build + full suite manually before each commit.
The PR template's hook checkbox carried that note rather than a false tick
(same discipline as 031–036).

## Post-merge reconciliation (executor STOP, upheld)

At close-out, a mentor-issued binding correction claimed commit #1 had been
amended (`--amend --no-edit`) to carry the intro fix. The executor STOPped
with three independent git evidences: reflog (commit #1 appears once, plain
commit, no amend entry), SHA stability (`09e0a02` unchanged from creation
through the merged PR), and merged brief content (the Edit 2b intro on
`main@b73c311` still reads "Two mechanical rules"). **The STOP was upheld
and the amend narrative retracted**; Deviation 1 above is the reconciled
record. Symmetric correction accepted on the executor side: the final
report's sentence "no history rewrite needed since nothing was committed"
was wrong in its reasoning (commit #1 WAS committed and its evidence-close
was outstanding at that point mid-run) though right in its conclusion (no
rewrite occurred). Ledger seed: message-evidence is not operation-evidence —
`%B` output cannot distinguish an amend that preserves the message.

## Commits (PR #91, squash-merged)

- `09e0a02` `docs(tasks): add brief for 037-evidence-close-protocol`
  (amended pre-commit with the packaging rule).
- `8d4ffa3` `docs(agents): add evidence-close rules to executor Pause 3`.
- `cb3ffad` `docs(playbook): document evidence-close doctrine as Lesson 15`.

Squashed to `main@b73c311` as
`docs: add evidence-close protocol to executor and playbook (brief 037)
(#91)`. Push and PR executed only on explicit owner authorization ("go");
merge by owner.

## Post-merge cleanup (this session)

Checked out `main`, pulled `53c3bb0 → b73c311` (squash landed exactly the 3
in-scope files), force-deleted the local branch (`-D`, expected: squash
merge does not mark it merged), remote ref auto-deleted by GitHub. Working
tree clean but for the pre-existing untracked `payload.json`.

## Carried items (no action this session)

- **Hygiene batch now actionable:** `payload.json` → `.gitignore`
  (rule-of-three reached in 036, resighted at every Pause of this run);
  missing-env error DX stays out (2nd occurrence).
- Open-in-software (D3 of session 032) — small follow-up brief.
- Template naming convention + sanitization unification; `gateways.ts`
  manifest-shape TODO; parked cluster unchanged.
- Horizon: `ship` command, `@saci/*` → `@breu/*` rename, `saci config`.

## Next step

Owner merges the docs PR (these two recaps + the PR #90 provenance-date
fix), then the queue per the mentor recap — recommendation: hygiene batch
(smallest item, rule-of-three reached).
