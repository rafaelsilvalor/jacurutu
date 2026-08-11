# Session recap — 2026-08-11 — gate-runtime-instrumentation (executor)

**Mode:** executor run — caminho B (Orchestrator-authored brief,
`validate-brief.mjs` APPROVED 11/11 at `989cb8a`, owner go at the Orchestrator
gate).
**Brief:** `docs/tasks/2026-08-11-gate-runtime-instrumentation/brief.md`
(Category L, Plan required: yes), branch `chore/gate-runtime-instrumentation`,
cut from the verified base `4b43cc8` (= `main` = `origin/main`, PR #130).
**Pairs with:**
`docs/sessions/2026-08-11-orchestrator-gate-runtime-instrumentation.md`.

First task to instrument the harness at runtime. The five hooks landed at
`4b43cc8` reaching a verdict on every commit and every write and throwing it
away; this run makes the verdict durable, so Finding 1 of
`docs/explorations/gate-economics.md` can be re-tested against runtime data
instead of against prose written by the sessions being measured.

Two commits existed before the run: the brief at `989cb8a` and the Orchestrator
recap at `8d12133`, both already pushed with PR #131 open against them. G-R6
governed the whole run — neither was amended, rebased or reordered, and all six
executor commits went on top.

## Run shape

- Pause transport: STOP-and-return, single-block presentations, owner approvals
  relayed as continuation messages. **Zero Pauses crossed without an explicit
  relayed go.** One Pause 1, one Pause 2, and **six Pause 3 presentations for
  six gated commits**.
- Six evidence-closes. Five were a verbatim `git log -1 --format=%B` pasted in
  the turn's final message block; the sixth is a lapse recorded under "How it
  ran" below.
- The no-debt precondition was honored literally and cost round trips twice:
  once after the reader commit, where the run stopped rather than opening
  Edit 6's Pause on top of an outstanding close, and once at the end before the
  recap. Work advanced during those turns; Pauses did not.
- Green boundary before all six commits — `npx tsc -b` plus `npm test` — run on
  the docs-only commits as well, because the rule is unconditional. Package
  tests held at 324 (323 pass, 1 skip) from first measurement to last.
- Hook tests **61 → 112**. No existing test block was edited at any point; every
  addition was appended.
- The retired actors were not invoked: no `brief-validator`, no `closer`, no
  `pre-commit-self-audit`. Their mechanical content ran as hooks, on every
  commit, without being asked.

### The guard-safety protocol

The run rewired five live hooks while those same hooks gated the commits doing
the rewiring, so Pause 1 committed to a protocol and the run followed it:

- **Probe, never infer.** Before relying on a guard for the next commit, the
  shipped executable was spawned with a fixed payload and its verdict read. A
  dead hook is invisible (G-HOOK-1) and looks exactly like a passing one.
- **Payload in a file, never inline.** A probe passed on the Bash command line
  contains the literal `git commit`, which trips `commit-guard` on the probe
  itself and lets it deny its own test. Payloads lived in the session
  scratchpad, outside the repository, so constraint 1 stayed untouched.
- **Re-probe after every change to the staged set.** A pre-flight that predates
  what it clears has cleared nothing. This fired for real: the staged set
  changed after a probe four separate times, and each was re-probed before the
  commit.
- **Probe streams redirected.** Every synthetic probe wrote to a scratchpad
  stream via `SACI_TELEMETRY_DIR`, so no invented event ever entered the
  measurement. The twelve records in the real stream are all genuine.

## Commits

| # | SHA | Subject | Files (+/-) |
|---|---|---|---|
| 1 | `8c7af75` | `docs(tasks): fix the D5 contradiction and record the Pause 1 rulings` | brief.md, notes.md (+176 / -20) |
| 2 | `5eca523` | `chore(hooks): add the telemetry emission seam` | telemetry.mjs, telemetry.test.mjs, .gitignore, notes.md (+750) |
| 3 | `a18d8a0` | `chore(hooks): add check identifiers to the hook verdicts` | 3 modules, 3 test files, notes.md (+281 / -9) |
| 4 | `3e00c1b` | `chore(hooks): wire telemetry into the five hooks` | 5 executables, telemetry.test.mjs, notes.md (+616 / -27) |
| 5 | `31c6071` | `chore(hooks): add the gate-yield reader CLI` | gate-yield ×3, CLAUDE.md, notes.md (+621) |
| 6 | `0379d26` | `docs(explorations): promote the gate-economics note` | gate-economics.md (+2 / -1) |

Commit 1 is not in the brief's sequence: the owner inserted it ahead of Edit 2
so the Pause 1 rulings would land in the artifacts before the code. Commit 3 was
amended once, from `df2ef7f`, changing one word in the body; the tree is
byte-identical and it was unpushed, so G-R6 was not in play.

Total against `4b43cc8`: 22 files, +3386 / -34. Every path on constraint 1's
list as amended. `packages/`, `.claude/settings.json` and
`.claude/hooks/lib/docs-checks.mjs` all return an empty diff.

## The four checkboxes that could not be met as written

Reported as findings, not failures. None was ticked by approximation.

**1 — E6's 800-line ceiling, `telemetry.test.mjs` at 823.** Not met. Escalated
at Edit 4's Pause 3 and ruled accepted by the owner. The cause is structural and
is recorded as F-8: each of the five executables opens with a top-level
`await readHookInput()` that blocks on stdin, so nothing can import them and
their tests can only spawn them. They cannot have 1:1 test files **at all**, and
415 of that file's lines are theirs. E6's precondition is unsatisfiable for them
by construction, which is not the diagnosis E6 assumes ("your subject does too
much" — `telemetry.mjs` is 297 lines and coherent). Named as a candidate for a
future documented exception, with no exception number reserved, because a bare
`(En)` with no entry in `CLAUDE.md` is a bug.

**2 — Edit 3's "every row of the D6 table has an asserting test".** Met, but in
Edit 4's commit rather than Edit 3's. Thirteen of fifteen rows were assertable
in Edit 3; `green-tsc` and `green-npm-test` are born in the executable and had
no lib module to assert against. Declared pending at Edit 3's Pause and closed
in Edit 4 as an explicit carried obligation, rather than ticked and forgotten.

**3 — D5's "exit code and stderr bytes are identical between the two runs".**
Unmeetable as originally written, and this is the one worth re-reading. D5's
first sentence requires the hook to write one stderr line naming the error when
a telemetry write fails, which is also R4. Its second bullet then required
stderr to be byte-identical between the writable and the unwritable run. The R4
line **is** a stderr byte difference; both could not hold. Ruled at Pause 1
(R-1), the brief was amended, and the test now asserts identity on the *verdict
channel* — stderr with whole `telemetry:`-prefixed lines removed — plus exactly
zero such lines in the writable run and exactly one in the unwritable run.
**The amended form is weaker than the words the brief originally used**, and
that is stated here rather than allowed to hide behind "met as amended".
Moving the diagnostic to stdout was rejected: a bare line there prepends to
`askOwner`'s JSON payload and destroys an `ask` escalation, so a telemetry
failure would change a verdict — the exact inversion D5 exists to prevent.

**4 — "No file outside the constraint-1 list was modified."** Met only because
constraint 1 was amended to add `notes.md`, which the executor protocol requires
for mid-run rulings and which the list did not name. Flagged rather than folded
in; the owner ruled the line added.

## Rulings taken mid-run

All four are in `docs/tasks/2026-08-11-gate-runtime-instrumentation/notes.md`,
byte-exact by construction rather than as chat pastes.

- **R-1** — D5 resolves on the verdict channel (above).
- **R-2** — the builtin import list closes at six: `node:fs`, `node:crypto`,
  `node:url`, `node:child_process`, `node:os`, `node:path`. This replaced an
  executor workaround that would have put test scratch inside the gitignored
  telemetry directory to avoid importing `node:os`. Rejected on the right
  ground: contaminating the surface the measurement reads to save an import is
  the wrong trade.
- **R-3** — the rulings land in the artifacts before the code, as their own
  commit.
- **R-4** — the secret-scanner fixtures escalate, and that is correct. Staging
  `architecture.test.mjs` makes `architecture-guard` answer `ask` with seven
  findings; five predate the run and two are byte-identical reuses. A test for a
  credential detector must contain something shaped like a credential.

## Findings recorded, not acted on

Ten entries, F-1 through F-10. The ones a future session will want:

- **F-1** — `.jsonl` is never extracted as a path reference. `PATH_REFERENCE`
  closes on an extension alternation that has no `jsonl`, so the backticked
  `.claude/telemetry/gates.jsonl` in `CLAUDE.md` is never checked. The
  load-bearing reference in that line is `.claude/hooks/gate-yield.mjs`, and the
  `.gitignore` entry is belt-and-braces rather than the load path.
- **F-5** — the architecture guard cannot see the architecture guard. Every
  check gates on `packages/**` TypeScript, so **R5, R24 and R25 have no
  mechanical enforcement anywhere in `.claude/hooks/`**. Both size judgments in
  this run were made by hand; nothing would have stopped either.
- **F-7** — three loose numbers in one run, consolidated into one entry because
  a finding about a pattern splitting across two places would have been the
  pattern.
- **F-9** — the stream already separates a main-session turn boundary from a
  subagent's tool call, free, via `agent`. Not acted on; the report sections are
  closed.
- **F-10** — the first session in the measurement window is the session that
  built the instrument.

## What the twelve events do NOT establish

The reader over the real stream, measured at the close of Edit 6 and **before
this recap's own commit**: 12 events, 1 distinct session, 0 unresolved sessions,
0 records with no inspected input, 0 unparseable lines, 3 recurring inputs,
window OPEN at 1 of 10 committing sessions and 12 of 150 events. The count is a
snapshot with a moving boundary — committing this file adds to it — and saying
so is cheaper than a reader later finding the number and the stream disagree.

- **Nothing about Finding 1.** All twelve are allows. A 0/12 denial rate
  supports no claim about self-inflicted denials in either direction; that is
  what the window exists to collect. Twelve events prove the pipe works.
- **The absence is as informative as the presence.** Dozens of Bash calls were
  made this session and only six commits produced records — four from
  `green-boundary` at turn boundaries, and the rest from the commits. That is
  D4's silence list holding on live input. A guard firing on every Bash call
  that recorded every invocation would have buried the real events and made
  itself the most expensive item in the turn.
- **`docs-guard`'s silence was verified live, not in a fixture.** During Edit 4
  it recorded nothing while the other three guards recorded, because the only
  staged markdown was under `docs/tasks/` and therefore historical. No unit test
  could have shown that.
- **F-10's contamination applies to every number above.** These records come
  from a session doing harness work, with the guards themselves changing between
  commits and an unusually dense Pause cadence. The instrument's first subject
  was its own construction.

## What actually caught the defects

Every serious defect in this run was found by **running the code, not by reading
it**. The brief, the mechanical validator and several careful reads found none
of them:

| Defect | Found by |
|---|---|
| V8's circular-structure message is three lines, and two carry no `telemetry:` prefix — it would have survived the D5 strip and read as a verdict-channel difference | a throwaway smoke script run before Pause 2 |
| An absent input hashed to the SHA-256 of the empty string, a real-looking digest two hooks would share, feeding a phantom recurring input into the section that carries the self-inflicted fraction | the owner running the module with `inspected` absent |
| Seven secret findings escalating on the test fixtures | the B6(d) pre-flight against the real index |
| `git status --porcelain` collapses an untracked directory, so the hook hashed `packages/` rather than `packages/a.ts` | the first run of the green-boundary test |
| A test expectation asserting `Committing sessions: 0` for a fixture that is a committing session by D8's own definition | running the reader |

The last one is the sharpest: **the code was right and the test was wrong.** It
was fixed by pinning both sides of the definition rather than the one side the
author happened to believe.

This is Finding 2 of `gate-economics.md` reproducing itself inside the task
built to measure it. The D5 contradiction is the same shape one layer up: the
brief mandated a test nobody could write, and it survived authoring, mechanical
validation at 11/11 APPROVED, and an Orchestrator gate, before an executor tried
to build the thing and found it in the first ten minutes.

## How it ran — the habits, and what they cost

Three habits were load-bearing, and each cost something:

- **Evidence-close discipline.** Six commits, six closes, each pasted in a final
  message block and confirmed before the next Pause opened. Cost: two extra
  round trips where the run stopped with work ready to go. Worth it — evidence
  emitted in an intermediate block does not reliably reach the chat, and a Pause
  presented inside one is a Pause that did not happen.
- **Re-probing after every change to the staged set.** Cost: four extra probe
  runs. Caught the case it exists for — after the R-4 note was written, the
  staged set differed from the one the earlier probe had cleared.
- **Refusing to classify the `ask`.** Seven findings at once is exactly where an
  agent talks itself into "these are obviously fine". They were fine. That does
  not make the classification the agent's, and the ruling is now recorded for
  whoever stages that file next.

**One lapse, recorded because a recap that only reports what worked teaches
nobody.** The amend of commit 3 (`df2ef7f` → `a18d8a0`) did not get its own
evidence-close paste in a final message block: the amended message appeared in a
tool result, and the next Pause opened in the same turn. The owner verified
`a18d8a0` independently afterwards, so nothing went unchecked — but that was the
owner's diligence, not the protocol's. The rule reads "no new Pause while a
prior evidence-close is outstanding", and an amend produces a new message that
needs closing exactly like a commit does.

Two smaller ones, both flagged in-run rather than found later: a test title that
claimed more than its assertions proved (F-6), carried to the next commit rather
than fixed under a set the pre-flight had already cleared; and a deletion count
carried across a change of scope into a commit body (F-7), amended once ruled.

## Handoff

- **Not pushed.** `origin/chore/gate-runtime-instrumentation` is at `8d12133`,
  six commits behind local HEAD. R17 / G-R5: the push is the owner's, every
  time.
- **PR #131 untouched.** It was opened against the brief and the Orchestrator
  recap only, and now needs rewriting.
- **The Orchestrator recap at `8d12133` is now false in three places** — it
  records that nothing was executed. Correcting it is the Orchestrator's, not
  this run's.
- **The window is open at 12 of 150 events and 1 of 10 committing sessions.**
  It closes at whichever comes first, after which
  `docs/explorations/gate-runtime-yield.md` is authored in a Mentor session
  through the write gate, and `gate-economics.md` gains one dated changelog line
  pointing at it. Read the stream any time with
  `node .claude/hooks/gate-yield.mjs`.
- **For the digest author:** read F-10 before treating the early records as
  representative, and F-9 for a grouping axis that already exists in the data.
