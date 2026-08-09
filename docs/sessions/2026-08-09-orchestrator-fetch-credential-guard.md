# Session recap — 2026-08-09 — fetch-credential-guard (Orchestrator)

**Mode:** full pipeline — planner → brief-validator → orchestrator gate →
executor. First task since the role model was adopted to run every stage
without substitution.
**Consumes:** `main@b252d37` — PR #127, the Python-lane consolidation. Merge
confirmed by `git log --oneline origin/main` before the branch was cut.
**Pairs with:** `docs/sessions/2026-08-09-executor-fetch-credential-guard.md`,
which carries the execution log. This file carries origin, decisions and queue.

## One-line summary

The credential guard queued by yesterday's ROADMAP item was measured, modelled,
built and catalogued — and the measurement it rested on turned out to be
half-right in a way that changed the brief's shape.

## The measurement that changed the premise

The ROADMAP item, written from `python-laboratory-lane.md`, said Jira answers
`200` with an empty list on an expired token. Before delegating, the read path
was probed live against `estrategia.atlassian.net` with an invalid credential
and with no `Authorization` header at all:

```
POST /rest/api/3/search/jql  "order by created DESC"        -> 400
POST /rest/api/3/search/jql  "project = ECJ ORDER BY ..."   -> 200 {"issues":[],"isLast":true}
GET  /rest/api/3/myself                                     -> 401
GET  /rest/api/3/field                                      -> 200, 28 entries, 0 customfield_*
```

Three things followed, none of which the item knew:

1. The premise holds, but only for **bounded** JQL — which is every JQL Saci
   issues. The `400` on the unbounded probe is a JQL rejection, not an auth one.
2. A guard already existed on the `fetch` path, **by accident**:
   `validateFieldMapping` throws first, because the configured `customfield_*`
   ids are absent from the anonymous 28-field catalog. Its message names field
   configuration when the cause is the token.
3. `/myself` answers `401`, so a pre-flight has a reliable signal.

The brief's rationale changed accordingly: the pre-flight does not add a
missing guard, it replaces an accidental one that lies about the cause.

## Decisions closed with the owner

1. **Both guards, one brief.** The pre-flight covers the credential; the
   non-destructive write covers every other route to an empty payload — wrong
   JQL, revoked permission. Cheap, and valid regardless of what Jira answers.
2. **The pre-flight lives on the port**, not inside the adapter. The
   composition root owns the call, the in-memory fakes keep it testable, and
   `start` inherits it when wired.
3. **`fetchIssueByKey` stays out of scope.** Consequence accepted and recorded:
   `saci start` under a bad token still names the wrong cause. Q4 in the task
   notes.
4. **The GOTCHAS entry ships with this task** (Edit 5 bundle question, approved
   at Pause 2), creating category `G-JIRA`.
5. **A catalog entry may not present inference as measurement.** The first
   `G-JIRA-1` draft explained the localized message by the Atlassian account's
   locale — which the probe cannot support, since it ran unauthenticated. Sent
   back and rewritten. Ruling 1 in the task notes.
6. **The `@closer` is suspended.** Its breadth made development too slow, and
   grading its findings (the 2026-08-08 ruling) was not enough containment. Not
   invoked this session and not to be invoked until a replacement approach
   exists. `docs/AGENT_PLAYBOOK.md` still documents six roles; amending that
   doctrine is its own task, deliberately not done in passing here.

## The pipeline, stage by stage

- **planner** authored a 758-line Category L brief, `Plan required: yes`, and
  closed five shape decisions (D4–D8) it labelled as its own and re-openable.
  P4 clean across all four sources.
- **brief-validator REJECTED** on first pass, C7 alone: a Commit sequence line
  measured 73 because of a `— Edits 3 + 4` annotation. The subject itself was
  57. This is the known `brief-template` gap, Q2 of the 2026-08-07 notes,
  costing a cycle for the first time. Fixed on the branch by removing the
  annotations from every measured line; the brief commit was amended
  (`762afbe` → `03a6471`) rather than stacked, per the pre-validation
  convention. Second pass APPROVED 11/11.
- **Orchestrator gate** held; the owner reviewed the brief, the verdict and the
  diff before the executor was invoked. D4–D8 were surfaced at the gate and
  again at Pause 1, and left closed.
- **executor** ran five commits across six Pause 3 presentations — commit #4
  was presented three times, twice because of the G-JIRA-1 rework and once for
  the four-word Symptom fix that followed from it.

Every executor claim of green, staging and message fidelity was re-verified
from this session before each approval, rather than accepted from the report.

## The unplanned half of the day

Before the guard, the session spent several hours on a question the owner
raised: whether Jira and Google auth could sit under one flow. Two corrections
were needed — it is not in any queue, and Google cannot authenticate Jira at
all, since Atlassian is its own identity provider. The real analogue is
Atlassian OAuth 2.0 3LO, and its feasibility gate was measured the same way the
Google one was in `drive-oauth.md` §1: by running it.

Result: **the gate is open.** A Resource-level 3LO app (`saci-jira-probe`)
reached a consent screen and completed the round trip, so the Estratégia org
permits user-created external OAuth apps. Captured along the way: `cloudId`
`9795b90e-d410-4737-a422-a7c15f9eadf0`; rotating refresh tokens are mandatory
for new integrations, which makes `adapter-drive`'s non-fatal token-write
failure (`auth.ts:149`) credential-losing under Atlassian rather than merely
suboptimal; and 3LO requires an exact pre-registered callback, so the Drive
flow's ephemeral port does not transfer.

None of this is code, and none of it belongs to this lane: it is Mentor
material for `docs/explorations/`. Recorded here so the finding is not lost
between sessions.

Two things this cost. The exploration ran *before* the two-minute measurement
that unblocked the brief, which is the wrong order for a day with a queued
task. And a client_id transcribed by eye from a screenshot was wrong — `I` for
`l` — which would have failed had the owner not used the console's own URL.
Identifiers get copied, never read.

## Deviations

- Session opened on `claude/tarefas-do-dia-2badf8`, which violates R11. The
  brief mandated cutting `fix/fetch-credential-guard` from `b252d37` before
  Edit 1; nothing was ever committed on the session branch.
- Two brief checkboxes counted by estimate rather than by running the command,
  reported and not force-fitted. Q6 in the task notes.

## Queue after this session

1. **Push + PR for `fix/fetch-credential-guard`** — owner instruction pending.
   No closer review; the role is suspended.
2. **The 3LO exploration note** — a Mentor session, carrying the five findings
   above.
3. **`saci-jira-probe` is live** with an active read-only grant on the owner's
   Atlassian account. Delete with the note, or revoke at `id.atlassian.com`.
4. **Six findings** in `docs/tasks/2026-08-09-fetch-credential-guard/notes.md`.
   Q4 (`start` inherits the port but not the guard) is the natural next brief.
5. **The `brief-template` verification-count class** — three counts written by
   estimate in one brief, one of which cost a REJECTED cycle. Worth one clause
   in the SKILL rather than three instance fixes.

## Next-session snippet

> Open a task closing Q4 of `docs/tasks/2026-08-09-fetch-credential-guard/notes.md`:
> wire `verifyCredentials` into `runStart` so `saci start` under a bad token
> names the credential instead of the issue count. The port method already
> exists (`packages/core/src/gateways.ts`, shipped `9abafb2`); the fake in
> `run-start.test.ts` throws on it by design and must move with the wiring.
> Invoke @planner.
