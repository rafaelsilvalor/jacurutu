# STANDARDS.md — the engineering baseline, decided once

> **Why this file exists.** Every standard below was either adopted late
> somewhere in this ecosystem or is still missing, and late adoption was
> measured to cost real work: the `.githooks/pre-commit` that runs the test
> suite has existed since 2026-08-19 and has never run once, because
> `core.hooksPath` was never set; tyto shipped 218 passing tests with no CI to
> run them; 13 of the 30 measured traps in tyto's GOTCHAS catalog are guarded
> by no test at all. This file is the decision, made once, of what every repo
> in the ecosystem carries **from birth** — so that "should we adopt X?" is a
> conversation that happens here, one time, instead of per repo per year.
>
> Scope: jacurutu and its laboratory lanes (tyto, the suindara art lane,
> buraqueira). This file is the menu and the decision; each repo's own
> rulebook (`CLAUDE.md`) remains the law inside that repo. A standard becomes
> binding in a repo when its rulebook adopts it — adoption is one linked line,
> not a copy.

## 1. The lifecycle, and what is mandatory at each stage

A repo is born, grows code, gets tested, gets committed, gets merged, gets
released, gets documented, and (for laboratories) gets absorbed. Each stage has
a mandatory artifact. "Have" below is measured as of 2026-08-25.

| Stage | Mandatory artifact | jacurutu | tyto | suindara | bancada |
|---|---|---|---|---|---|
| Birth | `CLAUDE.md` rulebook | yes | yes | yes | yes (no IDs, by design) |
| Birth | Vocabulary fixed before first identifier | partial | **yes** (the table) | partial | yes |
| Code | Named pattern set (§4) | implicit | implicit | implicit | implicit |
| Code | Layering rule, enforced on write | commit-time only | no | no | **yes** (structure gate) |
| Test | Test taxonomy per layer (§2) | **no** | **no** | **no** | **no** |
| Test | Colocated-test rule with dated exceptions | no (14 of 45 modules bare) | rule only (TYTO-R3) | no | **yes** (gate on, 10 exceptions) |
| Test | Determinism proven by code, not by hand | partial | **manual only** (out/det-*) | no | yes |
| Commit | Conventional Commits + subject cap | yes | yes | yes | yes (gate) |
| Commit | In-session enforcement (hooks that actually run) | **yes** (.claude/settings.json) | no | no | yes (plugin) |
| Merge | CI: tests on 3 OSes + hygiene job | **no** | **no** | **no** | **yes** |
| Release | semver + tag discipline | rule only | rule only | yes (templates) | 3 tags at 0.1.0, **no remote** |
| Release | CHANGELOG | **no** | no | no | yes |
| Docs | GOTCHAS catalog, measured entries | yes (24) | yes (30) | no | no |
| Docs | Decision records (`docs/decisions/`) | sessions/tasks | no | no | yes (2 ADRs) |
| Absorb | Normalization-on-arrival rule | yes (R26) | n/a (is the lab) | n/a | n/a |

The empty cells are the debt. §7 is the ordered checklist that closes them.

## 2. The test baseline — which tests are mandatory, per layer

The taxonomy is decided by what the layer touches, not by taste:

- **Pure core** (data in, data out — jacurutu `packages/core`, tyto
  `press/core`): **unit tests colocated** (`x.ts` has `x.test.ts` beside it) and
  **determinism tests** (same input twice, deep-equal output). Instruments
  (rulers, clocks, filesystems) enter by parameter, so tests inject fakes.
- **Contracts** (manifests, config shapes, versions): **validation tests** for
  every field that can be wrong, including the error message naming the field.
  A contract without a rejection test is a contract only for valid input.
- **Adapters and renderers** (everything that opens a browser, a socket, a
  file): **integration tests**, plus — where the product is an image — **golden
  regression by hash**: render the sample inputs, compare against recorded
  hashes, fail on unexplained change. tyto's `out/det-*` folders prove the
  pixel is deterministic (4 of 4 pairs hash-identical); the standard is that
  this comparison is a script in CI, not an act of memory.
- **Every layer**: the **colocated-test rule** — a source file without its test
  is either in a dated exception list (`{path, reason, date}`) or the build is
  red. The exception list is the adoption path and it only shrinks.
- **Suite health**: a **mutation audit** (revert a documented fix, expect the
  suite to catch it) scripted and run before each release — it is the only
  measurement of test *quality* rather than quantity. Coverage is **reported,
  never gated**: an executed line is not a verified line.

What no tooling can promise: "all the tests we need". The stack above makes the
gap *visible and shrinking* instead — taxonomy says what kinds must exist, the
colocation gate says where one is missing, mutation says which existing ones
are decorative, and the GOTCHAS `Travado por` field says which known traps have
no guard.

## 3. The enforcement map — where a rule lives

One sentence each, because confusing these layers is how the pre-commit hook
went uninstalled for a week:

- **Rule text** (`CLAUDE.md`) — what is true here, and why. A request, not
  enforcement.
- **In-session gate** (bancada / `.claude/hooks`) — refuses the violation in
  the turn that writes it, which is the only moment the agent still has the
  context to fix it.
- **Merge gate** (CI) — the same checks, for changes that arrive around the
  session: merges, other editors, sessions with hooks off.
- **Measured traps** (`GOTCHAS.md`) — the defect, its number, and what locks it
  (`Travado por`: mutation-verified, test-named, or nothing-but-this-entry).
- **Decisions** (`docs/decisions/`) — why the alternative lost, so it is not
  re-proposed.

Principle: **a rule that only exists as text is a request.** Every rule that
can be checked mechanically gets a gate or a CI step in the same change that
writes the rule.

## 4. The named pattern set — five, plus the entry rule

These five are already in use across the ecosystem, unnamed. Naming them makes
them citable in review; the list being short is the point.

1. **Functional core, imperative shell.** All decisions live in pure modules
   (no disk, network, DOM, clock); all I/O lives at the edges. Lineage:
   SUINDARA-T3, TYTO-R1, jacurutu R23/R25. It is what makes a module testable
   in milliseconds and portable between languages without rewrite.
2. **Ports and adapters.** The core defines the interface (`gateways.ts`);
   adapters implement it and depend on core, never the reverse (R25).
3. **Component registry.** A visual or behavioral piece is a module with a
   `type` and a render/handle function; composition is a table. Adding a piece
   is adding a file, never adding an `if` to a growing function. Lineage:
   suindara S-guidelines, tyto components.
4. **Injected instruments.** Anything that measures the world (text ruler,
   clock, filesystem) enters as a parameter. The test hands in a fake; the
   runtime hands in the real one. Lineage: tyto's `measure`.
5. **Fail-loud diagnostics.** Errors are codes from a closed list, emitted
   structurally, never silent fallbacks — a plausible-but-wrong output is the
   worst outcome an unattended pipeline can produce. Lineage: SUINDARA-T6/T13,
   TYTO-R6/R8.

Cross-cutting invariant: **determinism by contract** — same input, same output,
verified by double-run tests in core and by hash comparison at the pixel.

**The entry rule for a sixth pattern:** it enters after the **third measured
use** (the SUINDARA-A7 lineage: two similar sites are cheaper than one wrong
abstraction), and it enters by editing this section with the measurement.
**Explicit non-adoptions**, so they are not re-proposed: the GoF catalog by
default; class inheritance hierarchies (composition tables instead); singletons
and module-level mutable state (hidden state breaks determinism); event buses
inside core (data flow becomes untraceable).

## 5. Tooling decisions

- **TypeScript strict** everywhere at each lab's conversion (R20). Until a
  `tsc` actually runs, `@ts-check` comments are decorative — measured in tyto:
  34 files carry the pragma, nothing checks it.
- **Formatter**: Prettier, adopted at jacurutu first, labs at their TS
  conversion. **Linter**: typescript-eslint's recommended set at conversion,
  not before — a lint pass over code about to be rewritten is spent twice.
- **CI**: bancada's `ci.yml` is the template — a `test` job on
  ubuntu/windows/macos and a `hygiene` job (layering check, colocation check,
  docs checks). Labs drop the plugin-validation job.
- **In-session gates**: bancada adopted now in tyto and the suindara host
  (commit, secrets, size at 400/600, structure; `pair` off). jacurutu retires
  its whole local engine rather than reaching parity with it. Measured
  2026-08-25: bancada already covers seven of the eight hooks and is stronger on
  four — it refuses a layering violation at the write instead of at the commit,
  sees a test file edited by `sed -i`, tells a red build from a command that
  could not start, and ships a colocated-test gate this repository has no
  equivalent of. Of the four rules bancada lacked, each was dropped rather than
  ported: `tsc` already emits TS2835 for a relative import missing its
  extension, the morphological imperative rule catches everything a 22-verb
  allowlist caught while asking about ordinary subjects, `packages/` holds zero
  explicit `any`, and the test-ceiling precondition never fired. What bancada
  still has to gain is one check: a path reference that resolves.
- **The language half is not ported, and R9 inside code is unenforced.** Said
  plainly here because it was previously implied to be guarded. Over 76 source
  modules the pt-BR marker set produced 8 hits and 0 defects — a Jira status
  value, the Portuguese stopword lists in `core`, a Google error string in the
  account locale, a tokenizer test built on a real summary. A marker heuristic
  cannot separate prose from data in a product whose domain data is Portuguese,
  so the check is retired instead of extended, and the three pt-BR carve-outs
  stay: `harness` is prompts the owner copies into pt-BR sessions, the root
  README is the design team's front door, and `automation` is a frozen
  provenance snapshot that editing would spoil.
- **No remote, no adoption.** bancada cut 0.1.0 and carries three tags;
  `git ls-remote` answers `fatal: 'origin' does not appear to be a git
  repository`. It is installed in 0 repos and, as things stand, cannot be. That
  is sharper than the first draft of this line, which said "0 tags" and was
  already stale when it was written: a tag is local until something can fetch
  it, so the dependable unit is the remote plus the tag, never the tag alone
  (SUINDARA-T17 is the same rule for templates).

## 6. The documentation baseline

Every repo carries: the rulebook; a `GOTCHAS.md` whose entries have a number in
`Medida` and a `Travado por` field; `docs/decisions/` for choices with a
rejected alternative; a `CHANGELOG.md` from the first tag onward; and a stated
reading order in the README. The web reader (mirante, `D:\Projects\mirante`)
renders these files — it is a lens, never a second home for truth: editing a
page in the reader is editing the wrong file.

## 7. Adoption checklist, in order

- [ ] **tyto**: `bancada.config.json` (4 gates, size 400/600); a `ci.yml` under `.github/workflows`; colocation check with the 13 known gaps as dated exceptions; visual-hash regression script over `plates/` + `samples/`; tag `v0.1.0` at the TS conversion.
- [ ] **bancada**: publish — a remote, `main` pushed, the three 0.1.0 tags pushed; then the path-reference check as a gate that denies (measured 0 dead references on this repository's live surface, so it needs no repair window); then a fresh tag.
- [ ] **jacurutu**: link this file from `CLAUDE.md` and assign the test-taxonomy rule its number via the normal process; a `ci.yml` under `.github/workflows` (test matrix + hygiene, plus one grep for explicit `any`); `CHANGELOG.md` at the next release-worthy change; then delete `.claude/hooks` outright once bancada is published and carries the reference gate.
- [ ] **suindara host**: `bancada.config.json`; seed `GOTCHAS.md`; CI for `host/` tests.

Each checked box is a commit that cites this file. When a decision here proves
wrong, the fix is editing this file with the measurement that proved it — the
same contract as every rulebook in the ecosystem.
