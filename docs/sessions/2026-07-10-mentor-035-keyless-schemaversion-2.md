# Session recap — 2026-07-10 — 035-keyless-schemaversion-2 (mentor)

**Mode:** mentoring — exploratory D-set session, no brief produced.
**Numbering note:** this session anticipates slot **035**; the first brief
consuming this D-set is expected at 035 and must still run P4 fresh
(three sources) at modeling time. If P4 lands elsewhere, this recap keeps
its name as a historical record (per the derived-identifier rule in
GOTCHAS).
**Pairs with:** no executor recap — no repository execution this session.

## One-line summary

Ratified the full D-set for keyless `start` and `TaskManifest`
`schemaVersion 2`: per-designer reserved key prefixes (D1), a
production-state local counter with fail-loud collision backstop (D2), a
two-field key model (`jiraKey` / `localKey`, both nullable, at least one
set) with an append-only `history` authorship log replacing the scalar
timestamps (D3, absorbing D5), and an extended month-fallback chain in
`derivePath` with manually supplied vertical (D4).

## D-set

### D1 — Local key identity: per-designer reserved prefix (ratified)

Local tasks are keyed `<PREFIX>-<seq>` (e.g. `RAF-1`, `ANA-7`), where the
prefix is reserved per designer and assigned per machine via the future
`saci config` identity step. Prefixes mimic Jira key structure so that
`derivePath`, file naming, and the manifest need no special casing.

- Prefix assignment is owner-coordinated (small team); at config time the
  prefix is validated against the live Jira instance's project keys.
  **Unverified (M-R4):** exact Jira project-key charset rules; verify
  against the real instance before the brief.
- Rejected alternatives: fixed prefix + per-machine counter (cross-designer
  collision detected only at `ship`); fixed prefix + date component (ugly
  as a folder/file segment; same-day collision remains).
- Accepted corner: the key permanently reveals the task's *creator* (as a
  Jira key reveals its project). "Who touched it last" is answered by
  `history` (D3), not by the key.

### D2 — Counter state: production-state local storage (ratified)

- The sequence counter lives in local storage, **production-state
  category** (never overwritten by `fetch`). Incremented at keyless
  `start`; never decremented. Gaps are cheap; key reuse is expensive.
- Counter is **instance state, not task state** — it does not enter the
  manifest or schemaVersion 2.
- Counter-loss recovery (reinstall/format), three layers:
  1. Fail-loud collision detection as backstop (`start` local check today;
     `ship` inherits a Drive-side check by contract). Reused keys never
     silently overwrite.
  2. On (re)config with a prefix that has history, the setup ritual asks
     for the next sequence number (manual entry in v0; a Drive scan could
     derive it later, but that depends on `adapter-drive`).
  3. Jumping high (e.g. restart at 100) is a valid, cheap recovery when
     the exact number is unknown — gaps are accepted by design.

### D3 — `schemaVersion 2` contract (ratified; absorbs D5)

Ground truth: a real v1 manifest (`.saci.json`, MCA-63821) was inspected
in-session; the shape below amends the initial proposal accordingly.

**Key model — two explicit nullable fields:**

- `jiraKey: string | null` — the Jira link, when it exists.
- `localKey: string | null` — the local identity, when the task was
  started keyless.
- Invariant: **at least one non-null.** Jira-born task: `jiraKey` set,
  `localKey: null`. Local-born: the inverse. Local task later linked to a
  card: **both** set.
- **Naming rule:** `displayKey = jiraKey ?? localKey` governs `drivePath`,
  the folder name, and the `<vertical>_<KEY>_...` file prefix. Rationale
  (owner): the Jira key in folder/file names is the human-facing bridge
  between Jira and Drive, including for non-designers; the local key is
  the traceability fallback so designers can track their own and their
  colleagues' card-less work.
- A discriminator field (`origin`) was considered and **rejected** —
  derivable from which key fields are set; one less field to desync.

**`history` — append-only authorship log** (replaces `startedAt` /
`shippedAt`):

- Entry shape: `{ event, actor, at }`; `event` enum
  `start | ship | load | handoff | link`; `actor: string | null` (from
  the per-machine identity config); `at` ISO 8601.
- No separate mutable `owner` field — "current holder" derives from the
  last entry. Entries are never edited or removed.
- `link` enters the enum now, even though the command that emits it is out
  of scope — the parser is fail-loud and retrofitting the enum would cost
  another schema bump.
- Known limit (accepted): the log records Saci commands only; direct Drive
  edits bypass it. Drive's native revision history is the secondary
  coverage.

**Migration and compatibility (`parseManifest`):**

- v1 remains parseable: in-memory upgrade on read; persisted as v2 on the
  next write (lazy migration, no mass rewrite).
- v1 `jiraKey` → v2 `jiraKey`; `localKey: null`.
- Witnessed v1 timestamps convert: `startedAt` →
  `{ event: "start", actor: null, at }`; non-null `shippedAt` → analogous
  `ship` entry. `actor: null` because the time was witnessed, the author
  was not — nothing is fabricated.
- Unknown `schemaVersion` (≥ 3) → fail-loud. `schemaVersion` stays the
  first gate in `parseManifest`.

**Consequences recorded:**

- Retroactive linking **implies rename**: folder `ANA-7_slug` →
  `MCA-99999_slug`, file prefixes likewise, plus `drivePath` update and a
  `link` history entry. The future `link` command owns this; the schema
  merely permits it. **Unverified (M-R4):** Drive folder rename preserves
  the item ID (shared links / revision history survive) — verify when
  `adapter-drive` is researched.
- `claimed_by` open item (ROADMAP Phase 3): `history` now answers
  authorship by derivation; the remaining discussion is *conflict*
  (two people holding a task), not authorship. ROADMAP gets a note; the
  claim/lock semantics stay open.
- D5 (local→Jira promotion) is **absorbed**: promotion = fill `jiraKey` +
  append `link` + rename per the naming rule. No separate decision left.

### D4 — `derivePath` without Jira (ratified)

- **Month fallback chain extended** with one explicit link:
  `entrega_iso` → `jira_updated_at` → `startedAt` → `undated`.
  `DerivePathInput` gains an optional field; Jira-born tasks are
  unaffected in practice (`jira_updated_at` always present). Keyless
  tasks: designer-supplied delivery date enters as `entrega_iso` when
  known; otherwise the start month. `undated` returns to being
  theoretical, not a dumping ground.
- Rejected: smuggling the start date into `entrega_iso` /
  `jira_updated_at` (a lying field — the class of debt session 034 just
  paid off).
- **Vertical** is mandatory manual input at keyless `start`; missing →
  fail-loud in the command, no default. Core unchanged on this point.
  **Unverified (M-R4):** whether a canonical vertical list exists in code
  to validate against; v0 may validate format only.
- **Slug** derives from the designer-typed description through the
  existing leaf-slug sanitization. Nothing new.
- **Docs coupling:** the implementing brief must update the ROADMAP
  Phase 3 derivePath bullet (the one session 034 just aligned) in the
  same PR — the documented chain changes.

## Pre-brief ground-truth checklist (M-R4 hygiene)

1. Inventory `manifest.ts` (and `parseManifest` / `serializeManifest`) on
   disk — the D3 shape was ratified against one sample manifest, not the
   type source.
2. Jira project-key charset rules + existing project keys vs. the chosen
   designer prefixes (live instance check).
3. Canonical vertical list in code: exists or not.
4. Drive rename item-ID preservation — deferred to `adapter-drive`
   research; flag stays open, does not block the schema brief.

## Scope explicitly out (parked by name)

- Command UX for keyless start (`saci start --local "<desc>"` vs.
  subcommand) — brief-time decision.
- The `link` command (rename mechanics, Jira validation at link time).
- `saci config` implementation (identity + prefix assignment ritual).
- Claim/lock conflict semantics (`claimed_by` residue).

## Pending items (queue after this session)

1. **Commit this recap** — docs-only PR via caminho B. Note: second
   occurrence of the brief-less docs-PR shape (first: session 034 D1
   amendment); one more and it's a rule-of-three candidate for a formal
   docs fast path in AGENT_PLAYBOOK.
2. **Model the schemaVersion 2 brief** (expected 035; P4 fresh) consuming
   D1–D4. Likely split candidate: schema + migration first; keyless
   `start` command second — split decision at modeling time.
3. Open-in-software (D3 of session 032) — small follow-up brief.
4. Template naming convention + sanitization unification.
5. Hygiene chore candidates: `payload.json` in `.gitignore` (2nd
   occurrence), missing-env error DX — neither at rule-of-three.
6. Parked cluster unchanged.

## Next concrete action

Save this recap to `docs/sessions/2026-07-10-mentor-035-keyless-schemaversion-2.md`,
commit on a docs branch, PR, squash-merge, cache-swap ritual (in: this
recap; out: both 034 recaps). Next mentor session: **model the
schemaVersion 2 brief** (mode: modelar tarefa) starting from the
pre-brief ground-truth checklist above.

## Paste-ready snippet for next session

```
Ola. Continuando o projeto Saci. Modo: [modelar tarefa | mentoria | ...]
Ultima entrega: sessao 035 keyless-schemaversion-2 — D-set completo
ratificado em chat, sem brief: D1 prefixo reservado por designer
(RAF-1/ANA-7, validado contra project keys do Jira na config); D2 contador
em production state local, buracos aceitos, recuperacao manual, colisao
fail-loud como backstop; D3 par jiraKey/localKey nullable (minimo um) +
displayKey = jiraKey ?? localKey governando pasta/arquivo + history
append-only (start|ship|load|handoff|link, actor string|null) substituindo
startedAt/shippedAt, migracao lazy v1->v2, fail-loud em schema >= 3, D5
absorvido (promocao = preencher jiraKey + evento link + rename); D4 cadeia
de mes estendida (entrega_iso -> jira_updated_at -> startedAt -> undated),
vertical manual obrigatoria, brief implementador atualiza o bullet do
ROADMAP no mesmo PR. [CONFIRMAR: recap 035 mergeado via PR #NN a
main@<sha>.]
TEMA DESTA SESSAO: [modelar brief schemaVersion 2 (consome D1-D4; comeca
pelo checklist de ground-truth do recap 035) | open-in-software | outro].
Carrega CLAUDE.md, MENTOR_BRIEF.md, ROADMAP.md e o recap
docs/sessions/2026-07-10-mentor-035-keyless-schemaversion-2.md.
Antes de propor proximo passo, confirma em uma frase quem sou e o modo.
```
