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
