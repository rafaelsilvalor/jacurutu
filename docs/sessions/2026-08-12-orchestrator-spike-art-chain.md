# Session recap — 2026-08-12 — spike-art-chain (Orchestrator)

**Mode:** Orchestrator, Plan mode for the design half, then delegation. The
Orchestrator wrote docs only; `packages/` is untouched end to end.
**Consumes:** `92c748a` — head of `main` when the session opened, which is *not*
where the session's own snapshot started. See "The stale-snapshot window".
**Branch:** `docs/spike-art-chain`, cut from `2d43122` (= `main` after this
session's own chore PR #137 merged). Three commits. **Pushed and PR opened at
the owner's explicit instruction**, per branch.
**Produced:** the pivot decisions, `docs/tasks/2026-08-12-spike-art-chain/`
(brief, probe, run instructions), the chore that unblocked it (PR #137), and
this recap.
**Pairs with:** `docs/sessions/2026-08-12-executor-spike-art-chain.md`.

## One-line summary

The product gained an art-generation arm; six decisions were closed, the topology
was re-cut along a different axis than the owner first proposed, and the first
artifact is a spike that measures the seam instead of a brief that assumes it.

## What the owner asked, and what changed in the asking

The owner opened with a pivot: the project had drawn attention from superiors and
needed to become a tool with a front and a backend that generates art from
structured briefs. Three arms were proposed — Jira×Google (Buraqueira/Saci), an
art generator (Suindara), and a UI panel (Nacurutu).

Three findings from reading the repos changed that framing, and the owner
accepted all three:

1. **"Nacurutu" was already taken.** No such directory exists anywhere; the name
   lives only in `docs/explorations/rename-to-nacurutu.md` as a proposed rename
   of *Saci itself*, and Suindara's docs already write "saci/nacurutu" for the
   orchestrator. Naming the UI Nacurutu would have made three repos ambiguous at
   once.
2. **"Buraqueira/Saci" as one arm would have reversed a three-day-old decision.**
   The Python lane was declared a permanent laboratory on 2026-08-08 (`b252d37`).
   And the Jira×Google arm already exists: `adapter-jira` works, `adapter-drive`
   has five live-verified primitives — wired to nothing.
3. **The missing piece was never a third arm.** It is the seam:
   `issue → brief → spec.json → PNG → Drive`. Suindara had already defined the
   whole contract; Saci had the ports. Nobody owned the join.

The topology adopted splits by **rate of change and owner**, not by layer.
Suindara is its own repo because templates are an installable versioned
ecosystem — an earned boundary. The UI changes with the orchestrator, so it is a
package inside the monorepo, which is what `desktop-ui-host.md` had already
concluded ("a driving adapter — a new package").

## Decisions closed with the owner

| # | Decision |
|---|---|
| D1 | Nacurutu names the **orchestrator**, not the UI. The rename itself is deferred. |
| D2 | The UI lives **inside** the Saci monorepo, as `adapter-http` + `web`. |
| D3 | **Spike first**, before doctrine reconciliation. Precedent: brief 046. |
| D4 | **Local-first**, with a real HTTP boundary from day one because a server host is coming. |
| D5 | Spike on **Windows first**; the container is a separate later spike. |
| D6 | **Buraqueira stays a laboratory**, not a deliverable arm. |

On D4 the owner asked directly whether local-first blocks server testing. It does
not, provided the boundary is HTTP from day one — which is what D2 already
guarantees. What actually decides server-vs-local is four things, none of them
this decision: Chrome in a container (a Dockerfile line), **licensed fonts on a
server** (a licensing question, not infra), determinism across environments, and
the Drive OAuth desktop loopback flow not working headless.

## The stale-snapshot window

The session's snapshot of `main` was `93fa448`. The owner said "muita coisa mudou
no harness" and was right: `main` had advanced seven commits to `92c748a`,
including #130 (mechanical gates ported into hooks) and #131 (runtime telemetry).
The branch had already been cut from the stale SHA and was recreated at the real
head after verifying it carried no commits.

What the harness change means for this line of work: **a gate is now executable
code with fixtures**, not prose an agent promises to honour. Six hooks are wired;
`brief-validator` and `closer` shrank by 240 and 402 lines respectively as their
mechanical halves moved into `architecture-guard`; `pre-commit-self-audit` is
retired; a `@test`/`@code` pair exists with hook-enforced file ownership.

The good news for the pivot, checked rather than assumed: `architecture.mjs`
hardcodes no package list and no port count. New packages and new ports are not
blocked.

## PR #137 — the chore that came first

The owner asked for the harness adjustment before the spike. Scope was cut in
half during the work: `split` and `extract` were added to `VERB_ALLOWLIST`
(needed by a scheduled `refactor:`), and the `V2_SOURCE` extension for the future
`@saci/web` was **dropped as premature (A3)** — extending a guard to cover a
package that does not exist yet. Merged as `2d43122`, cleaned up under the
G-GIT-1 tree-check protocol: `git diff origin/main` empty, both trees at
`6c9cf2df`, tip `e6b084b` recorded before deletion.

Two things the cleanup surfaced. `git switch -C <branch> origin/main` sets the
new branch's upstream to `origin/main` — a later `git push` would have gone
straight to `main`; the upstream was unset. And the local `main` was stale by
construction, which is exactly what G-GIT-1 names as this project's default
state.

## What this session got wrong

Five claims fell. **None fell by re-reading; all fell on contact with something
real.** Recorded because the pattern is more useful than the individual errors.

1. **`gate-yield.mjs` is not an unwired hook.** Claimed as a wiring defect on the
   evidence that it is absent from `settings.json`. Its own header says it is not
   a hook — it is the CLI over the telemetry stream, deliberately outside the
   hook set. Fell on opening the file.
2. **`GOTCHAS.md` already documented the case worth adding.** Claimed G-NODE-2
   described only the silent failure mode while a loud one had been hit. G-NODE-2
   *opens* with the loud mode, and its example is `buildEditableStem` — one of the
   twelve errors seen. Fell on reading the entry instead of the summary of it.
3. **The brief's D2 was inverted.** The chain was designed assuming the copy is a
   native Google Doc, where `alt=media` 403s and `files.export` is required. The
   owner ran a real card and its `copy_url` ends in `rtpof=true&sd=true` — the
   signature of an uploaded, converted-on-open file. If it is a `.docx`,
   `alt=media` **succeeds** and returns ZIP bytes. The original step 4 would have
   accepted that success and carried binary downstream as a brief. Fell on the
   owner running a verifier against `MC-1073960`.
4. **A contradiction inside the brief, reviewed three times unseen.** Raising the
   line cap from 200 to 240 moved the checkbox and left the prose at 200. The
   executor found it and fixed both.
5. **The line cap itself was a bad estimate.** 240 for twelve stages and four
   verdict paths; the real file is 382 after two compression passes.

Items 1 and 2 were asserted with the same confidence as everything else in the
session. That is the calibration lesson, not the errors themselves.

## What this session did NOT establish

- **S1 through S5 are all unmeasured.** The probe was never run; it needs
  credentials, a browser consent round-trip, and two choices only the owner can
  make. Everything proven about it is static: it compiles, it fails correctly
  with no flags, it leaks no path and no secret, and the three API signatures it
  uses exist.
- **Whether the copy is a native Doc or an uploaded binary.** The single
  highest-value line of the coming run is stage 3's `mimeType`.
- **Whether the current grant can read a file this client did not create.** The
  046 D7 gap is still untested and is still the top product risk.
- **Nothing about doctrine was written.** No identity shift, no `CLAUDE.md` edit,
  no `R26`. That is the next brief, and it is deliberately downstream of the
  spike's evidence.

## Open items carried forward

- The **fifth identity shift** in `ROADMAP.md` plus the `MENTOR_BRIEF.md` §2
  reconciliation, as one caminho B doctrinal brief. It must also settle the
  *editable* / *art template* vocabulary split before the first identifier is
  written, and add `R26` (composition functions are transport-agnostic), which is
  already true and therefore cheap to freeze.
- The bundler exception for `@saci/web` is **`E8`** — `E6` and `E7` are taken.
- Four contract gaps to report upstream to Suindara, recorded in the plan:
  `SUINDARA.filenameFor` required by `render.mjs` but absent from the contract;
  `match.signals` having two shapes in the wild; `CONTRATO.md` §3 documenting a
  `capture()` loop that does not work headless; and `COMO-REGERAR.txt` recording
  a command that is not the one that ran when Saci is the caller.
- `diagnostics.json` in the export package — a ~10-line Suindara change, needed
  before the render adapter can surface diagnostics without parsing pt-BR stdout.
