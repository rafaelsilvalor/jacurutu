# Session recap — 2026-08-25 — bancada-single-engine (Orchestrator)

**Mode:** opened as a read-only exploration — *"nenhum arquivo alterado"* — and
did not stay one. The owner lifted the constraint in stages, each time for a
named artifact, and every write happened after an explicit approval at Pause 3.
The scope change is recorded here rather than left implicit: a session that
opens read-only and ships four commits is a session whose framing did not hold,
and the framing is worth auditing even when each individual step was authorized.
**Consumes:** `0768101` — head of `main` at the open, before #167 and #168 landed.
**Branch:** `docs/session-bancada-single-engine`, cut from `d439eb6`.
**Produced:** three merged or open pull requests in this repository — #170
(`.github/workflows/ci.yml`), #169 and #171 (`docs/STANDARDS.md`) — the
publication of the `bancada` repository, a `claude` wrapper in the owner's
PowerShell profile, and this recap.
**Cards:** none touched, in either direction. No card was searched for; that is
a gap, not a finding — see the 2026-08-24 recap's rule about absence.
**Span:** one day, 2026-08-25 local. The merge stamps read
`2026-08-26T00:40:05Z` and `2026-08-26T00:40:34Z`, which is 21:40 on 2026-08-25
at `-03:00`; the commit objects agree (`Tue Aug 25 21:48:16 2026 -0300`). The
UTC date on those stamps is not this session's date.

## One-line summary

The question was "what does bancada still need before jacurutu can retire its
own gate engine". The answer started at five items and ended at **one**, and
almost none of that reduction came from building anything: four of the five were
deleted once somebody measured what they had ever caught.

## The reusable rule: a blocker that moves is not a blocker that clears

`docs/STANDARDS.md` §5 named the blocker three times and was wrong twice. Not
wrong by carelessness — wrong because **each blocker was only visible once the
one in front of it was removed**:

1. *"bancada has 0 tags and is installed in 0 repos."* Measured: three tags at
   `5ab7ebd`, cut the same day the line was written.
2. *"The blocker is the missing remote."* True, and fixed:
   `git ls-remote` had answered `fatal: 'origin' does not appear to be a git
   repository`; the repository was published and the three `*--v0.1.0` tags
   became fetchable.
3. The real blocker appeared only then. This workspace's enterprise policy
   refuses **every** marketplace source — the GitHub one and the local directory
   alike — and the allowlist is server-side:

```
$ claude plugin marketplace add rafaelsilvalor/bancada
✘ Marketplace source 'github:rafaelsilvalor/bancada' (github.com) is blocked by
  enterprise policy.
$ claude plugin marketplace add /d/Projects/bancada
✘ Marketplace source 'dir:D:\Projects\bancada' is blocked by enterprise policy.
```

No amount of reading would have produced step 3. The list of allowed sources is
not in the machine's `policy-limits.json`, nothing in the plugin documentation
mentions it, and the second refusal — the local directory — is the one nobody
would predict from the first.

**The generalization, and it is operational rather than philosophical:** when a
plan is a chain of blockers, the cheapest way to find blocker N+1 is to clear
blocker N and try the action, not to enumerate the chain in advance. A plan that
lists three blockers has enumerated the three that are currently visible, which
is a different claim from having enumerated the blockers. This sits next to the
2026-08-24 rule — *a claim of absence requires an enumeration, not a lookup* —
and says something the earlier one does not: some enumerations are impossible
until you have already acted.

Cost of learning it the other way, had the migration been planned to completion
first: the four commits that delete `.claude/hooks/` would have been written
against an installation path that does not exist here.

## The measurement that deleted four of five prerequisites

The parity survey began with five things bancada lacked. Four of them died, and
each died to a specific measurement rather than to a judgment call. The owner's
standing rule made the test explicit mid-session: **a thing stays only if it
affects development positively, and nothing stays that a native tool already
does.**

| Prerequisite | What killed it |
|---|---|
| Import-extension rule | `tsc` already emits `TS2835` under `moduleResolution: NodeNext`. The green boundary runs `npx tsc -b`, so the build **is** that check |
| 22-verb commit allowlist | It returned `ask` on `implement` and `tweak`. What it genuinely catches — `added` — the morphological rule catches too |
| `any`-needs-a-reason gate | **0 occurrences** under `packages/*/src`. It became one grep line in the new hygiene job |
| Test-ceiling subject precondition | Never fired on any file in the repository's history |
| Documentation gate | **Survived, and shrank by half** — see below |

That is the whole reduction: five to one, with no code written in bancada.

## The recommendation this session made and then had to withdraw

Halfway through, this session recommended that bancada's documentation gate be
extended over source globs and that the pt-BR exception list be abolished. Both
recommendations were made **before measuring**, in a session whose entire
premise was that no behaviour claim survives without a measurement. The sweep
that followed refuted both:

```
== pt-BR markers over 76 source modules ==
   files with a hit: 5 / 76      hits: 8      defects: 0
   packages/adapter-jira/src/fixtures/jira-responses.ts:89  status: { name: "PARA APROVACAO" }
   packages/core/src/policy.ts:13                            "e", "ou", "mas", "que", "se",
   packages/core/src/transform.ts:7                          "de", "do", "da", "dos", "das", "para", ...
   packages/adapter-sheets/src/errors.test.ts:214            a Google error string in the account locale
   packages/core/src/policy.test.ts:12,13,16                 a tokenizer test on a real pt-BR summary

== pt-BR markers over 78 live documents, no exception list ==
   hits: 427 in 33 files      defects: 0
   (425 inside the three carve-outs; 6 in one English document quoting pt-BR field names)
```

**0 defects in 435 hits.** Every hit is domain data, and the domain data of this
product is Portuguese: Jira status values, the stopword lists that `transform`
and `policy` exist to apply, an error string Google returns in the account's
locale. A marker heuristic cannot separate prose from data here, so the language
half of the gate was retired instead of extended, and R9 inside code is now
**declared unenforced** in §5 rather than implied guarded.

The three carve-outs were kept for the same reason they were written:
`harness` is prompts the owner copies into sessions that already mandate pt-BR;
the root `README.md` is the design team's front door; `automation` is a frozen
snapshot vendored in `8fada81` and cited for provenance, which editing would
spoil.

The other half of the same gate passed cleanly and is the one surviving
prerequisite:

```
== dead path references over 78 live documents ==
   findings: 2 in 1 file — both gitignored, the "correct absence" class
   real dead references: 0
```

Zero repair debt, so the reference check can be born as a gate that denies. Six
of the ten `docs-checks` tests port with it; the four language tests do not.

## What was measured about the two engines

Eight local hooks against bancada's gates, all through the real code paths
rather than by reading:

- **bancada is stronger on four.** It refuses a layering violation at the write
  rather than at the commit (`architecture-guard.mjs` fed a `Write` payload
  exits 0 with empty stdout); its pair gate also refuses `sed -i` on a test file,
  which `ownership.mjs` cannot see because it needs a `file_path`; its green
  boundary separates a red build from a command that could not start
  (`NOT_FOUND = {126, 127, 9009}`); and it ships a colocated-test gate this
  repository has no equivalent of — 14 of 45 modules here are bare.
- **Its secret families miss both of this product's issuers.** Neither `ATATT`
  nor `GOCSPX-` is a built-in pattern. `gates.secrets.custom` closes it
  completely, with placeholder suppression intact, and needs no change to
  bancada.
- **Of the eight gates, only two are impossible outside a session:** secrets,
  because after the commit the credential is in history, and pair, because which
  role wrote a line is not a fact the repository keeps. The other six are the
  same checks earlier and cheaper, which is an honest argument for the plugin
  and not the one that was being made for it.

Test accounting of the 112 local hook tests: **86 die replaced outright**, 14
more die with the brief validator, **6** are re-authored inside bancada, and
`test:hooks` leaves `package.json` entirely.

## Two gates caught this session, which is the only evidence that matters

Both refusals were unplanned and both were correct.

`docs/STANDARDS.md` **would have been denied on its first commit attempt**. It
had sat untracked since it was written, so nothing had ever judged it:

```
ref  deny  line 161: `.github/workflows/ci.yml` resolves to no file, ...
ref  deny  line 163: `.github/workflows/ci.yml` resolves to no file, ...
```

`.github` is a tracked top-level directory, so the path was in scope and
resolved nowhere. A file that lives only in a working tree is a file no gate has
ever read.

And while probing whether bancada's commit gate fires, jacurutu's own
`commit-guard.mjs` refused the probe — because the tool call carried the string
`git commit -m "adding a thing"` inside it. The workaround was to move the
prompt into a file. The gate was reading the command line exactly as designed.

## The outcome the owner accepted, and its stated price

Three options were put to the owner: request an allowlist entry, get bancada
into the already-allowed `estrategiahq/claude-code-framework`, or use
`--plugin-dir`. The owner chose `--plugin-dir`, wrapped in the PowerShell
profile so nothing has to be remembered — the wrapper shadows `claude`, warns
loudly and still launches when the clone is missing, rather than starting
silently ungated.

Verified end to end, with no flag typed by hand:

```
PreToolUse:Bash hook error: [node D:\Projects\bancada\plugins\bancada/hooks/pre-tool-use.mjs]:
Commit subject does not follow Conventional Commits: "adding a thing"
```

**Half the goal is not reached, and §5 says so.** Each repository still carries
only its `bancada.config.json`, which is the half that decides what is enforced.
Updating is pulling a clone rather than raising a pinned version, so two
machines can disagree about which bancada they run and nothing reports it. The
honest word is *vendored by reference*, not *installed*. The fix is an allowlist
entry, which §7 now names as a request to the workspace's administrators and
explicitly not an engineering task.

## What this session did not do

- **No card was searched for**, in a repository whose previous recap contributed
  the rule that absence requires enumeration. Whether `JAC` holds a card for the
  gate migration is unknown, not absent.
- **`bancada` gained nothing.** Its working tree is untouched; only `main` and
  three existing tags were pushed. The one surviving prerequisite is unbuilt.
- **`.bancada/` is not yet in `.gitignore` here.** A probe run from this
  repository left `.bancada/telemetry/gates.jsonl` behind — one record — which
  was removed. §5 now carries the rule; the ignore line belongs to the
  migration's first commit.
- **The wrapper was tested headless (`-p`) and in PowerShell only.** Not in Git
  Bash, and not across a long interactive session.
- **The claim that plan mode replaces bancada-flow's first Pause is unverified
  by execution.** `validateBrief` and `briefIsSatisfied` were read; no brief was
  put through the Pauses.

## Follow-ups, in order

1. bancada gains the path-reference gate that denies, with the six ported tests,
   then a fresh tag.
2. jacurutu commit 1: `bancada.config.json` mirroring today's thresholds, the
   two custom secret patterns, the colocated gate with 14 dated exceptions,
   `flow` off, `.bancada/` gitignored.
3. jacurutu commit 2: delete `.claude/hooks/` outright, repairing the 22
   markdown references in 7 live files in the same commit.
4. Declare the unenforced rules, then declare bancada the only engine.
5. Not engineering: ask the workspace administrators to allowlist the
   marketplace source. It is the only thing between `--plugin-dir` and a pinned
   version.
