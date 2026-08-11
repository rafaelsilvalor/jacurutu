# Notes — 2026-08-11-gate-runtime-instrumentation

Mid-run owner rulings and executor findings for this task. Rulings land here
rather than as a chat paste: byte-exact by construction, and a durable record
once the session closes (`docs/AGENT_PLAYBOOK.md`, "Subagent Pause transport").

## Owner rulings at Pause 1 — 2026-08-11

### R-1 — D5's byte-identity assertion resolves as Option A

**The defect.** D5 states two requirements that cannot both hold. Its first
sentence requires the hook to write one stderr line naming the error when the
telemetry write fails, which is also R4. Its second bullet, Edit 4's
verification checkbox and the Behavior check then require stderr to be
byte-identical between the writable and the unwritable run. The R4 diagnostic
line *is* a stderr byte difference, so satisfying either one violated the other.

**The ruling — Option A.** Keep the R4 line. The integration test asserts:

- the exit code is byte-identical between the two runs;
- stderr is byte-identical **over the verdict channel** — identical after whole
  lines carrying the `telemetry:` prefix are removed;
- the writable run produced exactly zero such lines and the unwritable run
  exactly one, naming the error.

The comparison stays on buffers, not substrings.

**Why the alternative was rejected.** Option B — literal whole-stderr identity —
forces the diagnostic off stderr, and the only other stream available is stdout.
A bare line on stdout prepends to `askOwner`'s JSON payload, which destroys an
`ask` escalation. A telemetry failure would then change a verdict: the exact
inversion D5 exists to prevent.

### R-2 — the builtin import list closes at six

`node:fs`, `node:crypto`, `node:url`, `node:child_process`, `node:os` and
`node:path`. Anything outside those six remains a STOP.

The two additions replace an executor workaround proposed at Pause 1, which
would have created test scratch directories under the gitignored
`.claude/telemetry/` rather than import `node:os`. It was rejected: it puts test
scratch inside the directory the measurement reads from, and contaminating the
data surface to save an import is the wrong trade. Test scratch uses
`os.tmpdir()`.

`node:path` is ratified for the same reason in reverse: R1 says "all paths via
`path.join`" in those words, and honouring the rule beats hand-rolled string
concatenation that only happens to work.

### R-3 — the rulings land in the artifacts before the code

This file plus the brief amendment are their own commit, ahead of Edit 2, so the
brief does not stay self-contradictory for whoever reads it after this session.
The amended brief must still validate: `node .claude/hooks/validate-brief.mjs`
returns APPROVED, or the run stops rather than reshaping the brief to satisfy
the validator.

### R-4 — the secret-scanner fixtures escalate, and that is correct

Ruled at Edit 3's Pause 3. Staging `.claude/hooks/lib/architecture.test.mjs`
makes `.claude/hooks/architecture-guard.mjs` answer `ask` with seven secret
findings. The commit proceeds; the escalation is not a defect in either file.

The findings are the secret scanner's own fixtures. A test for a credential
detector has to contain something shaped like a credential, so that file
escalates whenever it is staged and always will. Five of the seven were already
present at `4b43cc8` and stand accepted. The two added by Edit 3 — at lines 189
and 194 of the amended file — are byte-identical reuses of the literals at lines
159 and 165, driving the two code paths the new assertions cover: the deny tier
hiding the ask tier's rule, and the ask-only tier. No value is a real
credential; all are keyboard patterns.

Three properties of this ruling are worth keeping separate. It is about **this
file**, not about secret findings in general — a finding anywhere else is a new
event and gets its own ruling. It does **not** loosen `scanSecrets`, which is
working exactly as designed: `A3`-style special-casing of its own fixtures is
the change that would break it. And it was **not** the executor's to make: an
`ask` is the owner's ruling (`docs/AGENT_PLAYBOOK.md`, troubleshooting table),
and seven findings at once is precisely where an agent talks itself into "these
are obviously fine". That they were fine does not make deciding it the agent's.

For whoever stages that file next: expect the prompt, expect seven findings, and
compare against this entry rather than re-deriving the answer.

## Executor findings

### F-1 — `.jsonl` is never extracted as a path reference (2026-08-11)

Reported at Pause 1, verified by the owner against the code, and **not acted
on**: `.claude/hooks/lib/docs-checks.mjs` is outside constraint 1.

`PATH_REFERENCE` closes on the alternation
`(?:md|ts|mts|cts|mjs|cjs|js|json|py|sh|yml|yaml)` followed immediately by the
closing backtick. A backticked `.claude/telemetry/gates.jsonl` matches as far as
`.json` and then dies on the trailing `l`, so no reference is extracted and
nothing about that path is ever checked.

Consequence for Edit 5, folded into the brief: the load-bearing reference in the
`CLAUDE.md` pointer line is `` `.claude/hooks/gate-yield.mjs` `` — `.mjs` *is*
in the alternation, so the guard resolves it, and it resolves only because that
file is staged in the same commit. The `.gitignore` entry from Edit 2 is
belt-and-braces rather than the load path. The mandated Edit 2 to Edit 5 order
stands regardless: it costs nothing, and the `.mjs` reference genuinely needs
same-commit staging.

Scope of the finding: it is about which references the guard sees, not about
whether the guard is right. No follow-up is proposed here; whoever picks it up
should weigh it against the design note in `docs-checks.mjs`, which argues that
a narrow extraction beats one that trains the reader to skim its output.

### F-2 — Edit 2's import checkbox was restated under R-2 (2026-08-11)

R-2 ratified `node:path` for path composition, and `telemetryPath()` is where
that composition happens, so `.claude/hooks/lib/telemetry.mjs` imports
`node:path`. Edit 2's verification checkbox named three imports and would have
been unmeetable as written. It was restated to four alongside the five
amendments R-3 lists, and surfaced at the Pause 3 for that commit rather than
folded in silently.

Ruled at that Pause 3: keep the amendment. The moment R-2 ratified `node:path`,
that checkbox could only ever fail, and a check whose finding has no available
remedy is worse than no check — the reasoning `E6` records in `CLAUDE.md`,
applied here unchanged.

### F-10 — the first session in the window is the one that built the instrument (2026-08-11)

Ruled recorded, not acted on. **The first records in `.claude/telemetry/gates.jsonl`
come from this session**, and this session is not a typical one.

They are real gate events — no fixture, no replay — and they count toward D8's
window exactly as specified. But the session that produced them was doing
harness work rather than product work: the five guards were themselves changing
between commits, the Pause cadence was far denser than a normal task's, every
commit was a documentation or hook commit, and a stretch of the session's own
tool calls were probes deliberately redirected away from the stream. Whatever
the first session says about denial rates says as much about the work being
harness work as about the gates.

No code change follows, and that is the ruling rather than an omission.
Hardcoding this session's identifier into the reader to exclude it would age
badly — the identifier is meaningless in three weeks, and the exclusion would
outlive its reason — and D8's report sections are closed. The window is also
built to absorb this: at 10 committing sessions or 150 events, one atypical
session is a minority of the sample, which is a different situation from the
baseline note, where the sessions being measured wrote the measurements.

What the digest author needs from this entry is the option: decide whether to
separate the first session, with the information available rather than
rediscovered from a commit log. The honest framing for the digest is that the
instrument's first subject was its own construction.

### F-9 — the stream already separates main-session turns from subagent calls (2026-08-11)

Observed by the owner in the first four real records, and recorded because
whoever writes the digest at window close will want it and will not find it in
the brief, which never anticipated it.

The two `green-boundary` records carry `agent: ""`; the two `PreToolUse` records
carry `agent: "executor"`. That is D13 behaving exactly as specified —
`agent_type` from the payload, empty string when absent — and the consequence is
free: **a turn boundary in the main session is distinguishable from a tool call
made by a subagent, on every record, with no additional field.**

Deliberately not acted on. The brief's report sections are closed, and adding an
agent breakdown to the reader would be scope creep. The distinction is in the
data; a future digest can group by it without any change to the emission side.

One caveat for whoever uses it: `agent: ""` means the payload carried no
`agent_type`, which today is the `Stop` event. It is evidence about the payload,
not a claim that no subagent was involved in the turn.

### F-8 — the hook executables cannot have 1:1 test files at all (2026-08-11)

Surfaced when `.claude/hooks/lib/telemetry.test.mjs` reached 823 lines, past
E6's ceiling of 800. Escalated to the owner, as E6 requires, and **the ceiling
was ruled accepted for this file**. Recorded here because the cause is
structural and will recur.

E6 assumes one diagnosis for an over-ceiling test: the subject does too much.
That is false here. `.claude/hooks/lib/telemetry.mjs` is 297 lines and coherent.
What the file acquired is a *second subject*: 415 of its lines test the five
hook executables rather than the module it is named for.

The reason they live there is not convenience. **Each of the five executables
opens with a top-level `await readHookInput()` that blocks on stdin, so nothing
can import them** — a test can only spawn them as a child process. They
therefore cannot have a 1:1 test file, and their tests must live beside some
other module's subject. E6's precondition, a 1:1 mapping, is unsatisfiable for
them by construction rather than by neglect.

That makes this a candidate for a future documented exception, and the shape of
one is already visible: an integration test file whose subject is a set of
executables, measured against a ceiling rather than against a mapping.
Deliberately **no exception number is cited here**. `CLAUDE.md` states that a
bare `(En)` with no entry in its list is a bug, and reserving a slot in a notes
file without writing the entry is exactly that. The gap is named; the number
belongs to whoever writes the entry.

Two properties of how this was found, both worth keeping. F-5 already
established that no hook enforces R5 or E6 anywhere in `.claude/hooks/` —
`V2_SOURCE` gates every check on `packages/**` TypeScript — so **nothing
stopped this file at any size**. The escalation happened because the rule was
applied by hand, in both directions: by hand when 412 lines were judged fine
under E6, and by hand again when 823 was judged the owner's call. An unenforced
rule was obeyed here; that is not a guarantee that it will be next time, which
is the argument for the exception being written down rather than re-derived.

### F-7 — a count carried across a change of scope (2026-08-11)

The Edit 3 commit body said "the nine deletions in the three modules". The three
modules carry eight; the ninth deletion is the F-6 title rename in
`.claude/hooks/lib/telemetry.test.mjs`. The number was taken from the staged
total at Pause 3 and not re-scoped when the sentence narrowed to the three
verdict modules, so it was true of the commit and false as written.

Amended rather than left, on the owner's ruling. The reasoning is worth more
than the digit: that commit's whole subject is a record that can be trusted
without re-deriving it, and the wrong number sits exactly where a future reader
decides whether to re-audit. Someone counting eight and reading "nine" goes
looking for a deletion that does not exist — in the one file set where "did any
`reason` string move?" is the load-bearing question. The commit was unpushed, so
G-R6 was not in play; only the digit and the word changed, and the tree is
byte-identical (`df2ef7f` became `a18d8a0`, 8 files, 281 insertions, 9
deletions).

**This is the loose-number entry for the run, and it has three occurrences.**
They are recorded together because the pattern is the finding; separately they
read as three typos.

1. The owner's Pause 2 wording, which said the `inputHash` sentinel eliminated
   the collision between two input-less records. It did not: both still carry
   one hash, and what changed is that the shared value became legible instead of
   plausible (F-4).
2. This entry's own subject: "nine deletions in the three modules", where the
   nine was the staged total and the three modules carry eight.
3. Edit 4's Pause 3 reported the green-boundary exit call sites as `3 -> 3`. The
   count is `4 -> 4` — lines 30, 31, 59 and 65 at `4b43cc8`, lines 31, 40, 86
   and 92 after the wiring. The owner's own first re-count said `4 -> 5`,
   because a grep counted the comment describing the one-character truthiness
   trap. Two wrong numbers, one right claim: not one exit was added or removed,
   which is what the number existed to support.

The general form, and the reason all three were hard to see: **a figure measured
against one boundary keeps looking right when the sentence around it moves to a
narrower one**, because nothing about the figure changes when its subject does.
In every case the claim underneath was sound, which is exactly what stops a
reader from checking the number — the sentence reads true. All three were caught
by re-counting rather than by re-reading.

### F-5 — the architecture guard cannot see the architecture guard (2026-08-11)

Surfaced while applying E6 by hand to a 412-line test file under
`.claude/hooks/lib/`, and verified by the owner to be broader than first framed.
Owner-ruled: record it, do not act on it.

`.claude/hooks/lib/architecture.mjs` gates every check on two patterns:

```
V2_SOURCE   = /^packages\/.+\.(ts|mts|cts)$/
TEST_SOURCE = /\.test\.(ts|mts|cts)$/
```

`checkFileSize`, `checkNoAny`, `checkImportExtensions` and
`checkDependencyDirection` all return early for anything that is not TypeScript
under `packages/`. Consequence: **R5, R24 and R25 have no mechanical enforcement
anywhere in `.claude/hooks/`**. Only `scanSecrets` runs on a harness file,
because it is the one check with no surface gate.

So the E6 judgment on `telemetry.test.mjs` at 412 lines was the executor
applying a rule the guard cannot see, not the guard clearing the file. That
distinction is the finding: an unenforced rule that reads as enforced is worse
than one nobody claims to enforce.

No action, deliberately. `.claude/hooks/lib/architecture.mjs` is inside
constraint 1 for the `check` field only, and widening `V2_SOURCE` to the harness
surface would change what every future commit is measured against — a change
with consequences nobody has measured, which is not something to slip into a
telemetry task. It is also live material for the measurement this task builds:
a guard that does not measure itself is exactly the shape of gap the window
should expose.

### F-6 — a test title that claimed more than its assertions (2026-08-11)

`telemetry.test.mjs` carried the title `records from different hooks with no
input do not collide`. The assertions under it were correct — both records carry
`EMPTY_INPUT_HASH`, and the hook and input-kind pair differ — but the title
claimed the hashes differ, which they do not. It was wrong by exactly the error
the owner caught in the Edit 2 commit body: F-4's sentinel did not eliminate the
collision, it made the shared value legible. The comment directly above the
title already carried the qualifier ("on one legitimate-looking hash") that
makes the claim true; the title dropped it. Corrected to `records from different
hooks with no input share the empty sentinel, not a digest`.

Why it was carried to Edit 3 rather than fixed under Edit 2, which is the part
worth keeping: the Edit 2 set had already been cleared by the B6(d) index
pre-flight, and re-staging after that probe would have meant committing a set no
guard had inspected. A probe that predates the staged set it clears has cleared
nothing. Flagging the inaccuracy cost one message; the alternative silently
voids the pre-flight, and nobody notices, because the failure looks exactly like
success.

### F-4 — an absent input must not hash to the digest of nothing (2026-08-11)

Found by the owner at Pause 2, against the brief's own consistency rather than
against the code. D13 says `inputHash` is "first 12 hex chars of the SHA-256 of
the inspected input" and says nothing about an input that is not there, so the
first implementation hashed the empty string:

```
hashInput(undefined) = "e3b0c44298fc"
hashInput('')        = "e3b0c44298fc"
hashInput(null)      = "e3b0c44298fc"
record A (commit-guard,   no input) = "e3b0c44298fc"
record B (file-ownership, no input) = "e3b0c44298fc"   -> collide
```

`e3b0c44298fc` is the SHA-256 of the empty string — a real digest, and one that
reads as perfectly good data. Two records from different hooks with different
input kinds land
on one legitimate-looking value, and the reader's "inputs recurring at least
twice" section then reports a phantom recurring input — the section that carries
D1's self-inflicted fraction, which is the measure this whole task exists to
produce.

Not a live bug at any point: Edit 4 passes a real `inspected` from all five
hooks. It is a silent failure mode waiting for the first wiring path that
forgets, and the record it produces looks correct.

**Ruling — an explicit sentinel, counted and reported.** A missing or empty
input produces an empty `inputHash`, never a hash of nothing. `EMPTY_INPUT_HASH`
in `.claude/hooks/lib/telemetry.mjs` is the constant, and `hashInput` returns it
before touching `createHash`. The shape is D12's, one field over: D12 writes
`session: "unknown"`, counts it toward the window, excludes it from the distinct
count and has the reader say how many it saw, on the stated ground that "a
silent zero there would corrupt D8's window without anyone noticing". Same
argument.

Consequence for Edit 5, recorded here so it is not rediscovered then: the reader
counts and reports records carrying the empty hash the same way it reports
sessions that resolved to `"unknown"`.

### F-3 — this file was added to constraint 1 (2026-08-11)

Constraint 1 is a closed list of the paths this task may create or modify, and
`notes.md` was not on it. The file is created by protocol rather than by
improvisation — mid-run rulings become a file, per `docs/AGENT_PLAYBOOK.md`,
"Subagent Pause transport" — but protocol is not the same as scope, so the
executor flagged the gap at Pause 3 instead of folding it in, and proposed
reporting the structural check "No file outside the constraint-1 list was
modified" as met-with-qualification.

Owner ruling, same Pause 3: add the line. `notes.md` is a canonical task
artifact under `docs/PROCESS_MAP.md` §7, so one line makes the brief true about
itself; the met-with-qualification route would instead leave a permanent
asterisk that a later reader has to reconstruct from a chat that no longer
exists. This is the seventh amendment in the commit, and it is the one this
file caused by existing.
