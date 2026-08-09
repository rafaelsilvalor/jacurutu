# Notes — 2026-08-09 fetch-credential-guard

Two kinds of entry, following the convention set by
`docs/tasks/2026-08-07-abort-049-and-fix-validator/notes.md`. **Rulings** are
owner decisions taken mid-run; they shaped what shipped. **Queued findings**
are things this task surfaced and deliberately did not fix, kept here so
whoever picks the subject up reads a list instead of rediscovering it.

## Rulings

### Ruling 1 — A catalog entry may not present inference as measurement

The first draft of `G-JIRA-1` explained the localized error message as
Atlassian rendering error bodies "in the account's language preference". The
measurement it cited cannot support that: the probe ran with an invalid
credential and, in one case, with no `Authorization` header at all, so there
was no authenticated account for the response to follow. A second claim —
that the request came "from an English-locale developer machine" — was never
measured either.

Both were rewritten before the commit. The entry now states that the
mechanism is *not established*, records the account-preference story as an
explicitly unverified hypothesis, and says why that matters: a reader who
believes it also believes that controlling the account controls the message,
which is the exact coupling the entry forbids.

The general rule: in `docs/GOTCHAS.md`, the Cause section states the observed
mechanism or says it is unknown. Plausible reconstruction is labelled as
hypothesis or left out.

### Ruling 2 — A prescribed artifact is not silently improved

Edit 6 printed the exact replacement text for the ROADMAP line, and that text
wraps badly — `answers` ends up alone on its own line. Re-wrapping the bullet
would have produced cleaner source, but only by reflowing lines 227 onward,
which the same Edit declares untouched. The ragged source shipped.

The executor raised it rather than fixing it, and that was the right call:
substituting a better artifact for the prescribed one, without asking, is a
silent structural deviation regardless of the improvement.

### Ruling 3 — The GOTCHAS entry ships with the task that discovered it

Edit 5 was a confirm-point, not a mandate. Approved at Pause 2: the entry
ships as its own `docs(gotchas):` commit ahead of the ROADMAP commit, and
`docs/GOTCHAS.md` joined the brief's allowed-path list by the same approval.
The stale `JiraHttpClient` doc comment ("one method, `searchJql`", wrong
since brief 029) was bundled into commit #2 under the same Pause, because
this task's diff is what made the sentence more wrong.

## Queued findings

### Q1 — The ROADMAP says "when the token has expired" without a measurement

`docs/ROADMAP.md`, the Phase 3 credential-guard item. Inherited from brief
`2026-08-08-python-lane-and-fetch-guard`. The 2026-08-09 measurement covered
an **invalid** Basic credential and the total absence of an `Authorization`
header. An **expired** token was never tested — the same class of defect
Ruling 1 removed from `G-JIRA-1`.

Deliberately not fixed: Edit 6 marks the item shipped and changes nothing
else. This task's own brief already carries the correct formulation ("with an
invalid Basic credential and with no Authorization header at all"), so the
repair has a good sentence one citation away. Measuring it properly needs a
genuinely expired token, or a valid token whose project permission was
revoked.

### Q2 — `packages/cli/src/argv.test.ts` sits at 398 of the 400-line R5 budget

Two lines from the ceiling after this task. Nothing is blocked; the next test
anyone adds to that file breaks R5. The fix is a split by responsibility in a
`refactor:` PR, not feature work.

### Q3 — What decides a Jira error message's language is still unknown

`G-JIRA-1` records the account-preference story as an unverified hypothesis
(Ruling 1). Closing it needs one measurement: valid credentials from two
accounts whose Atlassian locales differ, against the same endpoint. The entry
has a slot ready for the result.

### Q4 — `start` inherits the port but not the guard

`verifyCredentials` lives on the `JiraGateway` port, so `runStart` gains it
for free once wired — but nothing wires it today. `run-start.ts` was out of
scope by D3, and its in-memory fake throws on the method on purpose. So
`saci start` under a bad token still dies with `expected exactly one issue,
got 0`, naming the issue when the cause is the credential. This is the next
brief in this line.

### Q5 — The GOTCHAS category table has no declared order

Not alphabetical, not chronological — `G-BUILD` and `G-I18N` are declared
with zero catalog entries, so there is no creation date to sort them by.
`G-JIRA` was appended at the end, following the `G-PROC` / `G-DRIVE`
precedent. Whether the table should have a declared order is open; this
commit did not invent one.

### Q6 — Two checkboxes in this brief counted by estimate, not by measurement

Edit 2 asked that `MYSELF_PATH` appear "used once"; it appears three times
(declaration, URL composition, error message). Edit 4 asked that
`grep -c 'allow-empty'` return 3 in `argv.ts`; it returns 4, and the fourth
line is one the same Edit prescribes. Neither file was adjusted to fit its
number.

Both are defects in the checkbox text. Together with the C7 rejection this
brief took on its first validation — the known `brief-template` gap recorded
as Q2 of the 2026-08-07 notes — that is three verification counts in one
brief written by estimate rather than by running the command. Worth treating
as a class in the brief-template, not as three instances.
