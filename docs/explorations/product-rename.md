# Rename: Saci -> Nacurutu

Status: exploration — no implementation mandate
Disposition: candidate — 2026-08-08
Origin: cost exploration run in the `buraqueira` repo, 2026-08-08; the *how* was
closed by the owner, the *when* was not. The `.saci` surface below was read from
the source in this session, not carried from the report.
Roadmap link: would be a fourth entry under ROADMAP Identity shifts

A rename of the product to **Nacurutu**, alongside a framing shift to "feature
orchestrator". Explored, not scheduled.

**Shape (owner-closed).** If it happens, it is an isolated `refactor:` — never
coupled to a larger merge, so that two sources of breakage are not mixed.

**Mechanical surface.** Five workspace `package.json` names, tsconfig project
references, imports across the packages, the `bin` name (`saci`),
electron-builder `appId` and `productName`, and the canonical docs. Historical
task briefs under `docs/tasks/**` keep the old name — they are the record.

**The trap, and why it is not one `refactor:`.** The string `.saci` names three
different runtime surfaces, and they do not carry the same risk:

- `CREDENTIALS_DIR_NAME` in `packages/adapter-drive/src/constants.ts` — the
  OAuth credentials directory. Renaming without a fallback read breaks every
  user who has already authenticated.
- `IDENTITY_DIR_NAME` in `packages/cli/src/identity.ts` — the task-036 identity
  file lives in the same `~/.saci`. Same failure mode, different consumer.
- `.saci.json` in `packages/core/src/workspace.ts` — the TaskManifest, written
  into every task folder by `saci start` and meant to be read back by `saci
  load` on another machine. These files already exist on disk and in Drive.

The third is not a refactor. Renaming a manifest filename that is already
deployed in task folders is a **data-format migration** with a
backward-compatible read path, and R14 says a `refactor:` produces identical
behavior for the same input — which this would not. The rename therefore splits
into at least two pieces of work with different rules, and treating it as one
mechanical pass is the way it goes wrong.

**Not decided.** Whether the rename happens, when, and whether the "feature
orchestrator" framing is adopted. That framing would be the fourth identity
shift; the previous three each cost dedicated doc-reconciliation work (briefs
024, 025, 051), and it would change what `core` is allowed to contain — a `core`
question, not a naming one.

## Changelog

- 2026-08-08 — authored from the `buraqueira` cost exploration; disposition
  proposed as `candidate`.
