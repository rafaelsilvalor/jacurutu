# Brief: 2026-08-08 — Consolidate the Python lane decision and queue the fetch guard

> **Category:** M
> **Plan required:** no
> **Branch:** `docs/python-lane-and-fetch-guard`

---

## Context

The Mentor session of 2026-08-08 closed a decision and surfaced a product
finding. Its two notes reached `main` as PR #126 (`4149c4a`), carrying no
implementation authority — `docs/explorations/` is the lowest tier of the
authority hierarchy. This brief is the consolidation the Orchestrator owns
(D11 of the mentor-lane note): projection upkeep, and moving a decision from a
note into the canonical docs that state it.

Three changes, in three files, from one decision and one finding.

The **decision**: the Python `automation/` repo does not migrate. It is both
v2's seed reference and a permanent laboratory lane, and this monorepo absorbs
proven mechanisms one at a time, as briefs. `CLAUDE.md` currently describes only
the first half.

The **finding**, measured against this repo on 2026-08-08 and confirmed while
authoring: Jira's `POST /rest/api/3/search/jql` answers `200` with an empty
list when the token has expired rather than `401`. `runFetch`
(`packages/cli/src/run-fetch.ts:110`) writes the payload unconditionally, so an
expired token overwrites a good payload with zero entries and the next export
ships empty. The Python lab carries two guards after a run went blind in
production; this repo carries none:

```
$ grep -rn 'myself\|verifyAuth\|verify_auth' packages/ --include='*.ts'
(no output)
```

The **consequence** for an older note: `docs/explorations/v1-v2-overlap.md`
holds the question "keep `automation/` untouched, or accept small patches?",
inherited from ROADMAP Pending decision #4. That question presupposes an
overlap that ends when Phase 4 lands. The decision says it does not end.

## Goal

State the permanent-lane decision in `CLAUDE.md`, queue the credential guard as
a ROADMAP item, and retire the overlap note whose premise the decision removed.

Out of scope:

- **Implementing the credential guard.** This brief queues it as a ROADMAP
  item. The guard is code in `packages/`, needs its own brief, and nothing
  here authorizes touching `run-fetch.ts` or any adapter.
- **The Saci → Nacurutu rename.** Recorded in
  `docs/explorations/rename-to-nacurutu.md` as `candidate`, not scheduled.
  Nothing here acts on it.
- **Editing either transported note.** Their changelogs still say the
  dispositions were proposed rather than ratified; writing the ratified line is
  the Mentor's, per `close-mentor-session.md` PASSO 3.
- **Any migration decision.** The lane stays Python; re-opening is governed by
  the trigger declared in `python-laboratory-lane.md`.

## Constraints

### Non-negotiable constraints

1. Only these paths may be modified:
   `docs/tasks/2026-08-08-python-lane-and-fetch-guard/`, `CLAUDE.md`,
   `docs/ROADMAP.md`, `docs/explorations/v1-v2-overlap.md`, and
   `docs/sessions/` for the recap. Anything else, **STOP and ask**.
2. Follow `CLAUDE.md`, R9 and R10 especially.
3. Branch `docs/python-lane-and-fetch-guard`, Conventional Commits (G-R3), no
   co-author trailer (G-A7), **do not push** (G-R5).
4. No `STATE.md` — single-session task.
5. `packages/` is not touched. If any edit seems to require it, **STOP**.

### Conventions

- English throughout (R9).
- The `### Commit sequence` heading is H3 — C7 anchors on it and an H2 makes
  the extraction return nothing.

### Architectural decisions already made (do not revisit)

#### D1 — The ROADMAP item is untagged

`docs/ROADMAP.md:118` fixes the notation: `[coord]` is coordination mode,
`[prod]` is production mode, and untagged items are foundational and serve
both. A credential guard on `fetch` is read/data-side and serves both, so it
carries no tag. Owner-closed on 2026-08-08.

#### D2 — It goes in Phase 3, not earlier

The `fetch` command already lives in Phase 3's primary command set. The guard
belongs beside what it guards.

#### D3 — The ROADMAP states the problem, not the solution

The item names the failure and points at the evidence. Whether the guard is
`/myself` pre-flight, a non-destructive write, or both is a brief's decision,
not a roadmap entry's.

#### D4 — `v1-v2-overlap.md` becomes `discarded`, with reason

Ratified by the owner on 2026-08-08 over `deferred`. The question the note
holds presupposes a temporary overlap ending at Phase 4; a permanent lane is
maintained rather than frozen, so the question loses its premise rather than
its urgency. `deferred` was rejected because it requires a declared trigger and
no honest trigger exists for a question that stopped applying. Nothing is
deleted — the entry text and the changelog stay.

## Done criteria

### Edit 1 — Verify brief on disk and commit as commit #1

- [ ] `git branch --show-current` is `docs/python-lane-and-fetch-guard`, with
      no upstream (`git branch -vv` shows no `[origin/...]`)
- [ ] `docs/tasks/2026-08-08-python-lane-and-fetch-guard/brief.md` exists;
      first line matches the title above
- [ ] Commit #1 subject:
      `docs(tasks): add brief for 2026-08-08-python-lane-and-fetch-guard`

### Edit 2 — State the permanent lane in `CLAUDE.md`

Line 21 currently opens "The Python `automation/` codebase is the **seed
reference** of v2's core (its `lib_transform.py` was ported into `core` in
Phase 2). It carries no behavior-preserving mandate...". Replace the first
sentence with:

> The Python `automation/` codebase is both the **seed reference** of v2's core
> (its `lib_transform.py` was ported into `core` in Phase 2) and a **permanent
> laboratory lane** — it does not migrate. Proven mechanisms are absorbed here
> one at a time, as briefs; the lab stays Python (decided 2026-08-08,
> `docs/explorations/python-laboratory-lane.md`).

The rest of the paragraph is unchanged.

Verification:

- [ ] `grep -c 'permanent laboratory lane' CLAUDE.md` returns 1
- [ ] `grep -c 'seed reference' CLAUDE.md` still returns 1 — the old claim is
      extended, not replaced
- [ ] The sentence about `sync.py` / `lib_sheets.py` is byte-identical to
      before
- [ ] No other line of `CLAUDE.md` is touched

Commit: see Commit sequence #2.

### Edit 3 — Queue the credential guard in the ROADMAP

In Phase 3's `**Items:**` list, add as a new item. Untagged, per D1:

> - Credential guard on `fetch`. Jira's `POST /rest/api/3/search/jql` answers
>   `200` with an empty list when the token has expired, not `401`, and
>   `runFetch` writes the payload unconditionally — so an expired token
>   silently overwrites a good payload with zero entries and the next export
>   ships empty. The Python lab added two guards after a run went blind in
>   production; this repo has neither. Evidence and the lab's shape:
>   `docs/explorations/python-laboratory-lane.md`.

Verification:

- [ ] `grep -c 'Credential guard on' docs/ROADMAP.md` returns 1
- [ ] The item carries no `[prod]` or `[coord]` tag
- [ ] It sits inside Phase 3's `**Items:**` list, before `### Phase 4`
- [ ] `git diff --numstat docs/ROADMAP.md` shows only additions

Commit: see Commit sequence #3.

### Edit 4 — Retire `v1-v2-overlap.md`

Change line 4 from `Disposition: open — 2026-08-06` to:

> Disposition: discarded — 2026-08-08; the question presupposed a temporary
> overlap ending at Phase 4, and the Python repo is a permanent laboratory lane
> instead (`python-laboratory-lane.md`), so a lane that is maintained rather
> than frozen makes "untouched or patched?" moot

Append a dated changelog line recording the transition and its cause. Do not
touch the entry text on line 9 — it is the migrated ROADMAP wording and the
record of what was asked.

Verification:

- [ ] `grep -c 'Disposition: discarded' docs/explorations/v1-v2-overlap.md`
      returns 1
- [ ] `grep -c '^- 2026-' docs/explorations/v1-v2-overlap.md` is one higher
      than before
- [ ] Line 9's entry text is byte-identical to before
- [ ] The changelog's 2026-08-06 line survives — nothing is deleted (D10)

Commit: see Commit sequence #4.

### Automated checks (run before each commit)

- [ ] `npx tsc -b` passes — unconditional, no docs-only exemption
- [ ] `npm test` passes

Baseline at authoring: `tsc -b` clean, 305 tests / 304 pass / 0 fail /
1 skipped.

### Structural checks

- [ ] `git diff --name-only origin/main...HEAD` returns only paths from
      constraint 1
- [ ] `packages/` is untouched: `git diff --name-only origin/main...HEAD |
      grep -c '^packages/'` returns 0

### Behavior checks

- [ ] `CLAUDE.md` and `python-laboratory-lane.md` agree that the lab does not
      migrate. Read them side by side; if one says permanent and the other
      implies eventual migration, the consolidation shipped inconsistent.
- [ ] The ROADMAP item states a problem a future brief can act on without
      re-deriving it — a reader who has not seen the note learns what breaks
      and where.

### Git checks

- [ ] Branch `docs/python-lane-and-fetch-guard`, never `claude/*`
- [ ] Subjects ≤ 72 chars via `printf '%s' "<s>" | wc -L`
- [ ] Commit verbs in the `ALLOW=` SSOT — check before prescribing
- [ ] No co-author trailer (G-A7)
- [ ] `git log -1 --format=%B` matches the approved message after each commit
- [ ] **NO** `git push`

### Process checks

- [ ] Pause 1 skipped (`Plan required: no`)
- [ ] Pause 2 after Edit 2, the first fully changed file
- [ ] Pause 3 before every commit
- [ ] Any criterion not met was reported explicitly

### Commit sequence

1. `docs(tasks): add brief for 2026-08-08-python-lane-and-fetch-guard`
2. `docs(claude): declare the Python lane permanent`
3. `docs(roadmap): add the fetch credential guard to Phase 3`
4. `docs(explorations): declare the v1-v2 overlap question discarded`

Measure each with `printf '%s' "<subject>" | wc -L`. All four verbs were
checked against the `ALLOW=` SSOT during authoring, with the repaired C7
extraction, and commit 4 took two passes. `discard` is **absent** from the
allowlist, and the obvious substitute `drop` is present but wrong: D10 says
nothing is deleted, and this commit deletes nothing — the note, its entry text
and its changelog all survive. What the commit does is declare a disposition,
so `declare` is the verb. Recorded here so the substitution is not
re-litigated, and because the first draft of this list prescribed `discard`
while the prose beside it said `drop` — the enumeration disagreeing with its
own note, caught by the very check this repo repaired yesterday.

## Pause points

- **Pause 1 — skipped.** `Plan required: no`.
- **Pause 2 — required.** After Edit 2.
- **Pause 3 — required before every commit**, with `git status`,
  `git diff --stat`, the proposed message, `pre-commit-self-audit` output and
  both green-boundary results in one fenced block.

An assertion does not close Pause 3. The pasted output of
`git log --format=%B -1` does.

## Plan required justification

- Every change is specified above with its exact target and replacement text.
- All decisions are closed: D1-D4, with D4 ratified by the owner before
  authoring.
- The only judgment call — the disposition — was taken to the owner rather
  than defaulted.

## Reference documents (read before starting)

1. `CLAUDE.md` — R9, R10
2. `docs/ROADMAP.md` §Notation (line ~118) for the tag convention
3. `docs/explorations/python-laboratory-lane.md` — the evidence
4. `docs/explorations/README.md` — the disposition contract
5. `.claude/skills/pre-commit-self-audit/SKILL.md`

## Expected output (end of session)

1. Branch name and `git log --oneline main..HEAD`
2. `git diff --stat origin/main...HEAD`
3. Any verification checkbox not met, with the reason
4. Confirmation that no `git push` was executed
