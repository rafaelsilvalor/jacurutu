# Session recap — 2026-08-02 — 047-adapter-drive (Orchestrator)

**Mode:** model a task (pipeline), then drive its execution across two
executor invocations.
**Consumes:** PR #107 at `main@d8426ce` (merge confirmed by P4 at session
open). Mid-session, `origin/main` was found to have advanced to `62e9afc`
— PRs #108 and #109, brief 048 — which changed the pipeline this session
was running. See "Doctrine absorbed mid-session".
**Pairs with:** the executor 047 recap in this same PR.

## One-line summary

`@saci/adapter-drive` exists and is proven: the `DriveGateway` port was
re-declared as five primitives and implemented over `googleapis` +
`google-auth-library` with user OAuth, all five confirmed live 6/6 against
real Drive — 20 task commits on `feat/adapter-drive`
(`--first-parent --no-merges`) plus an `origin/main` merge, nothing pushed, and
the first task in the project to face the new `closer` role. Two Phase A passes
and four remediation rounds followed the brief's own execution: they closed two
real credential leaks the pipeline had not seen, and corrected a third claim the
pipeline had produced while fixing the first.

## P4 slot evidence

Three sources at session open: `ls docs/tasks/` — highest slot
`046-spike-adapter-drive`; `git log --oneline main` — HEAD `d8426ce`
(#107); `grep -nE '^\*\*E[0-9]+' CLAUDE.md` — E1/E2/E3/E5, none reserving
a forward slot. Slot **047** assigned explicitly to the planner.

**Slot 048 was consumed mid-session** by a parallel session (brief 048,
the closer agent). The `ship` brief is therefore **049**, not 048.

## Pipeline record (orchestrator scope)

planner → brief `e9aec85` (Category L, 733 lines, `Plan required: yes`) →
brief-validator **APPROVED, 11/11 PASS** → orchestrator gate → executor
invocation 1 (Edits 2-5) → executor invocation 2 (Edits 6-10 + evidence
round) → executor recap.

**Gate outcome: approved, with three items surfaced to the owner.** Edit 1
was already satisfied by the planner's own commit (the brief assumed the
caminho B path where the owner pre-saves the brief); the run was split in
two invocations because nine Pause 3s under STOP-and-return transport plus
an owner-run smoke is a long single session; and the brief's declared size
deviation (~600 substance lines against the Category-L guide) was accepted
on its stated justification — the live smoke cannot close until the whole
adapter exists.

## Rulings ledger

Decisions closed with the owner, in order:

1. **Port surface: five primitives** (`resolveFolder`, `findChild` →
   `DriveItem | null`, `createFolder`, `uploadFile`, `readFileContent`),
   retiring `uploadFolder`, `readManifest` and the `TODO(2026-06-06)`.
   Composition — folder-tree walking, verify-never-create, manifest
   parsing — belongs to the ship layer, not to a port method.
2. **Evidence model: unit tests + owner-side live smoke**, the 046 D2
   shape. Everything decision-bearing is unit tested behind the injected
   `DriveFilesApi` seam; only the library wrapper and the OAuth flow are
   left to the smoke.
3. **`STATE.md` skipped.** G-R10 targets multi-*session* tasks; this split
   was two invocations inside one live session, and the brief's
   constraint-1 path list is the more specific instruction — creating it
   would have failed the task's own structural check.
4. **Two structural checks ruled unsatisfiable as written**, not
   implementation defects: the secret sweep matches its own regex inside
   `brief.md`, and the library grep matches the `googleapis.com` scope
   URLs that a D-closed decision put in `constants.ts`. Recorded as
   documented false positives.
5. **The `google.auth.OAuth2` fix accepted as implementation latitude** —
   required to compile, no cast, no structural change, both declared
   dependencies still genuinely used.
6. **`G-DRIVE-2` authorized**, widening Edit 7 beyond the brief's
   G-DRIVE-1-only spec.
7. **Edit 10 authorized**, admitting `CLAUDE.md` and `docs/ROADMAP.md`
   past the constraint-1 path list — and deliberately sequenced *after*
   the evidence round, so its wording could claim only what the six steps
   proved.
8. **URL redaction moved to the source** (smoke revision 2) and **the
   stale preamble suppressed** (revision 3), both implemented in the
   injected log sink with no product code touched.
9. **A8 exception accepted** for the sink's module-level `heldPreamble`,
   recorded with its reasoning rather than silently passed.
10. **Two commit subjects changed at Pause 3**: #7 to name both GOTCHAS
    entries (G-R4 — the approved subject had gone dishonest once the diff
    carried two), and #10 as `update` over `document`, because the ROADMAP
    clauses were false rather than merely unrecorded.
11. **`origin/main` merged into the branch, not rebased.** The closer's own
    definition (`.claude/agents/closer.md`) landed in `main` after this
    branch forked, so the branch had to take it before the role could be
    invoked at all. Merge over rebase, deliberately: both recaps cite
    commit SHAs nominally, and rewriting them would turn this task's own
    historical record into fiction. The merge is clean — `CLAUDE.md` was
    auto-merged, the two sides having edited different sections — and it
    makes `main` the comparison base, so `git diff main...HEAD` now shows
    exactly this task's files.
12. **A sanitized `cause` rather than no `cause`.** R4 wants the frames, and a
    stack string is frame text that carries no headers — so sanitizing loses
    nothing the rule asked for.
13. **The `mkdir` error is left unwrapped.** Node's `ErrnoException` already
    names the syscall and the absolute path; wrapping would trade `.code`,
    `.syscall` and `.path` for a generic hint. The 044 precedent applies where
    the adapter knows something the operating system does not — "create an
    OAuth client with user type Internal" is worth authoring, "could not create
    a directory" is not.
14. **`toConsentError` as a sibling of `toDriveError`, not a reuse of it.**
    Reusing it would mislead twice: the failure would read as a Drive call it is
    not, and 400 is unmapped in the status table, so the hint would say
    "unclassified" to a designer whose consent just failed for the ordinary
    reason. The composed message keeps Google's `error_description` — the one
    detail the classified path drops — and names the discriminator between the
    two candidate causes: failing every time rather than intermittently.
15. **`G-DRIVE-3` authorized, and not as a duplicate record.** The three
    surfaces answer different questions: the `errors.ts` comment answers "may I
    delete this function?" and is the only one that reaches a reader at the
    moment of the destructive act; `docs/GOTCHAS.md` answers "why is a
    credential in my logs?" for a reader who has a symptom and no location;
    `notes.md` §7 answers "how did the pipeline fail?" and is the weakest
    operational surface and the strongest process record.

## Deviations

- **D3 execution model deviated.** The owner instructed the Orchestrator
  session to run the smoke rather than running it themselves. Credential
  placement stayed with the owner; the executor ran nothing. What D3
  protects — no live claim without a real run and a verbatim transcript —
  held. Recorded in `notes.md` §1 with that provenance, never as
  "owner-run".
- **Edit 10 is not in the brief**, and two commit subjects differ from its
  declared sequence. All three by explicit in-session authorization.
- **The brief's structural check was executed three-dot**
  (`main...HEAD`), because local `main` advanced past this branch's base;
  the two-dot form now reports brief 048's files as if this task had
  touched them.
- **The brief's own window for surfacing the docs reconciliation was
  missed.** It allowed surfacing at Pause 2 — but Pause 2 fired at Edit 2,
  before the fourth package existed. Handled by the Edit 10 authorization
  instead. A brief that defers a decision to a Pause should name a Pause
  that occurs after the decision is knowable.

## Doctrine absorbed mid-session — the `closer`

Brief 048 (PRs #108, #109, merged today by a parallel session) added a
sixth role. The closer reads `git diff main...HEAD` on the task branch and
runs three checks — architecture against R18-R25, duplication against what
`core` exports, secret/path hygiene — then emits one report. Phase A is
read-only and its verdict is input to the owner's judgment, not a gate that
opens itself. **Phase B pushes and opens the PR on explicit per-branch
owner instruction.**

Brief 047 was written before the closer existed, so its "Expected output"
does not mention it. The gap was closed at the Orchestrator level, not by
amending the brief. **047 is the first task to pass through this role.**

## Remediation — two closer passes, four fix rounds (2026-08-02 → 2026-08-03)

The session crossed midnight. Commits through `1501303` are dated 2026-08-02;
the fourth round is 2026-08-03. Both recap filenames keep the opening date.

**First Phase A**, run after the brief was fully executed and before any push,
raised three findings. All were owner-authorized and fixed in one round:

1. A credential was reachable from a thrown error's `cause` chain — closed by a
   sanitized stand-in carrying message, classified status and the original stack
   (`1426950`).
2. `token.json` was written `0644` and `~/.saci` was never created — closed with
   `0o600` / `0o700` and a first-run `mkdir` (`d3d15f2`). The directory half was
   a real first-run bug for every instance after the owner's, not merely the
   hook the mode hung on. This finding had also surfaced in an earlier
   calibration round against `e3a4dbd` and never reached the owner: a review
   whose findings nobody receives did not happen.
3. The R2 paragraph claimed version-specific evidence for a
   `google-auth-library` copy that never executes — corrected in `1501303`.

**Second Phase A** caught something the first round produced *while fixing*
finding 1: the mechanism was misdiagnosed. gaxios installs
`defaultErrorRedactor` on every request, so an `authorization` header arrives
already redacted. The Orchestrator's confirming reproduction had hand-built a
`GaxiosError`, which never touches the pipeline that installs the redactor — it
proved the fixture, not the library, and the claim entered a source comment, a
commit body and `notes.md` each carrying "verified".

What is actually true is worse: the redactor covers no `refresh_token`, which
`refreshTokenNoCache` posts in a `URLSearchParams` body, so an `invalid_grant`
refresh — the ordinary expired-or-revoked case, running inside any Drive call —
threw carrying a long-lived refresh token in clear. The sanitizer closes it by
generality. The consent exchange leaked its authorization `code` the same way and
was the one library call still travelling whole; closed in `fbe46bc`.

Fourth round: `6a3f99c` (corrected rationale plus a regression test for the
verified threat), `fbe46bc` (consent exchange sanitized), `f4a6967` (§7
corrected), `1e74a9a` (`G-DRIVE-3`).

**Two patterns worth carrying.** Attention flowed to the secret already under
discussion: three revisions went into redacting an authorization URL carrying a
client id, in output nobody was going to paste, while a live credential rode out
of every adapter failure path untouched. And a verification that reproduces its
own fixture is worse than none, because the confirmation is what stops the next
look — nothing in this pipeline re-opens a verified claim, so it took a second
review pass over already-remediated code.

## Rule-of-three ledger (updated)

- **Brief-authored structural checks that cannot pass as written: 2
  occurrences**, both in this task (secret sweep; library grep). Both are
  bare substring greps where the intent was about imports or values.
  Candidate rule when a third appears: anchor structural greps on
  `^import`, or require a value after the colon.
- **A brief check that breaks when its base moves: 1st occurrence** (the
  two-dot `main..HEAD` form).
- **The measuring instrument lying rather than the thing measured: 4
  occurrences — threshold met.** The two-dot diff reporting unrelated files as
  in scope; a hand-built `GaxiosError` reporting an unredacted `authorization`
  header; `awk length` reporting 73 columns on a body whose widest line is
  exactly 72, because an em-dash is three bytes and one column; and
  `git rev-list --count` answering 21 / 20 / 19 / 18 depending on flags, all
  true. The first three are the same failure — a confident false positive
  stated as fact. The fourth is different in kind and harder to catch, because
  nobody was wrong: the number was simply unqualified, and an unqualified
  figure invites the next reader to extend it, which is how it gains the
  appearance of confirmation. **Doctrine candidate:** state the instrument with
  the measurement, and re-derive rather than inherit a figure you did not
  measure. Promotion into `CLAUDE.md` or the playbook is a separate brief's
  call, not this recap's.
- Recap policy divergence: unchanged (threshold met at 046; this session
  produced both recaps, per policy).

## Pending items (queue)

1. **This session's PR** — closer Phase A over the assembled diff, then
   push + PR on explicit owner instruction; owner squash-merges. The merge
   SHA is confirmed by the NEXT session.
2. **Queue front: the `ship` MVP brief — slot 049.** Payload: D1-D5 from
   the 2026-07-27 mentor recap, plus `docs/tasks/046-spike-adapter-drive/notes.md`
   and `docs/tasks/047-adapter-drive/notes.md` as Context inputs. The five
   primitives are its building blocks; three sentences in `CLAUDE.md` and
   `docs/ROADMAP.md` assert the adapter is unwired and each names `ship`,
   so a grep finds all three when they go false.

   **Four things the executor reported that are written nowhere else**, from
   four invocations inside the adapter:

   - **Do not generalize the error wrappers.** The shape that works is one
     wrapper per failure vocabulary, all sharing `sanitizedCause`. Drive calls
     have a status table, consent has a code-lifetime hint, and ship's failures
     are about policy — a folder that already exists, a manifest that will not
     parse — with no HTTP status at all. The hint text is the whole value and it
     does not factor (A3).
   - **`findChild` returning `null` is the highest-risk seam in the adapter, and
     it is not recorded as a risk anywhere.** It is the load-bearing contract of
     verify-never-create, and the one place a swallowed error and a legitimate
     absence would be indistinguishable. `gateway.ts` produces the `null` above
     the try, never inside a catch; any ship-layer wrapper that breaks that
     separation turns the policy into create-always, silently. The comment
     records the contract, not the failure mode.
   - **There is no retry anywhere, and two hints promise one** ("retry with
     backoff", for 429 and 5xx). If ship adds retry, those hints start telling
     the user to do what the code already did, and no test will fail.
   - **The refresh path is exercised by every Drive call and by no test.** It
     lives entirely inside the library, so there is nothing to unit test and
     nothing that would notice if it broke — which is exactly where the
     refresh-token leak lived. If ship has a smoke, make one call run against a
     deliberately expired access token; that is the only way this path is ever
     observed.

   **Process note that generalizes:** both real defects in this task were in
   code with no caller yet. Gates, tests and greps inspect what the code says; a
   leak that appears only when someone prints an error, and a file mode that
   matters only on an OS nobody ran, are invisible to that. Ship is the first
   caller — budget a pass for "what does this print when it fails", not only
   "what does it do when it works".
3. **Cross-user content-read gap (spike D7)** — still untested, needs a
   second `@estrategia.com` account. Must run before the D4 prefix check
   is implemented.
4. **Internal-mode refresh longevity** — partial evidence only. The
   2026-08-02 run refreshed an expired access token unattended at day 6,
   which a 7-day cap would also have allowed; a corroborating run after
   **~2026-08-04** is still required.
5. **Orphan remote branch** `origin/docs/explorations-desktop-ui-host`
   (`ef3551e`, "docs(explorations): add desktop-ui-host note") — pushed,
   no PR open, not in `main`. Decision pending.
6. **Two stale worktrees**: `closer-subagent-diff-review-c483dd` (its
   branch merged as #109) and `gifted-mccarthy-1330bc` (a `claude/*`
   branch at the old base).
7. **`CLAUDE.md` R25 adapter list** does not name `adapter-drive`. Its
   wording is non-exhaustive, so it is not false — but a third concrete
   adapter now exists. Candidate for a later edit.
8. **Playbook recap-policy reconciliation** (carried from 046;
   rule-of-three met there).
9. Parked (unchanged): local→Jira promotion (known common demand);
   manifest `variation` field (042 D4); multi-contributor naming;
   Jira-born manual overrides; `jira_updated_at` nullability.
10. Horizon: `@saci/*` → `@breu/*` rename; the `saci config` write
    surface.

## Next concrete action

A **third** Phase A over `feat/adapter-drive` — 20 task commits
(`--first-parent --no-merges`) plus the `origin/main` merge, 28 files against
the merge base, both recaps and four remediation commits aboard. Read its
report, decide, then instruct Phase B — push and PR — explicitly. The next
session confirms the merge SHA via P4 / `git log` before consuming anything.

The second pass earned the third: it found a defect the first pass had not
reached and a false claim the remediation itself had introduced. A pass that
confirms is cheap; a pass skipped because the previous one was clean is how
both of those would have shipped.

## Paste-ready snippet for the next Orchestrator session

Use `harness/workflows/setup-orchestrator.md` with:

```
Modo desta sessao: modelar tarefa (pipeline).
Ultima entrega: task 047 — @saci/adapter-drive implementado e provado ao
vivo. Porta DriveGateway redeclarada como cinco primitivas; adapter sobre
googleapis + google-auth-library com user OAuth (escopos drive.file +
drive.metadata.readonly, credenciais em ~/.saci/); smoke 6/6 em
2026-08-02, com createFolder ganhando a primeira evidencia viva do
projeto. 20 commits de tarefa (--first-parent --no-merges; os dois recaps
inclusos) mais um merge de origin/main no MESMO PR [preencher #]. Verifica
o merge via P4 / git log antes de consumir.
Tres passadas de Fase A do closer e quatro rodadas de remediacao fecharam
dois vazamentos reais de credencial (refresh token no refresh falho,
authorization code no consent) e corrigiram uma alegacao falsa que o
proprio pipeline produziu ao consertar o primeiro. Ver a secao
"Remediation" desta recap e a secao 7 do notes.md do 047 antes de mexer no
errors.ts: G-DRIVE-1/2/3 no GOTCHAS sao dessa tarefa.
ATENCAO: o slot 048 foi consumido por outra sessao (agente closer, sexto
papel do pipeline — revisa o diff montado antes do push, Fase B empurra e
abre a PR). O proximo slot livre e 049.
TEMA DESTA SESSAO: brief do ship MVP (Category M/L, caminho A pro
planner). Payload: D1-D5 do recap mentor 2026-07-27 + notes.md do 046 e do
047 como Context inputs. Watch items que viram Constraints: gap cross-user
nao testado (roda a rodada 2 antes do prefix check do D4) e corroboracao
de longevidade do refresh depois de ~2026-08-04.
```
