# Session recap — 2026-07-12 — 035-manifest-schema-v2 (mentor)

**Mode:** modelar tarefa — full pipeline run (ground-truth → split decision
→ planner delegation → validator → mentor gate → supervised execution).
**Consumes:** the D-set ratified in session 035
(`docs/sessions/2026-07-10-mentor-035-keyless-schemaversion-2.md`), D3 and
the core half of D4.
**Naming note:** this recap shares slot number 035 with the D-set session
recap; the slug (`manifest-schema-v2` vs. `keyless-schemaversion-2`)
disambiguates. Both are historical records per the derived-identifier rule
in GOTCHAS.
**Pairs with:** the executor 035 recap in this same PR.

## One-line summary

Modeled, validated, and fully executed brief 035 — `TaskManifest`
`schemaVersion 2` (nullable `jiraKey`/`localKey` pair, derived `displayKey`
helper, append-only `history` replacing the scalar timestamps, lazy v1→v2
migration) plus the extended `derivePath` month chain and the coupled
ROADMAP bullet — as 4 commits on `feat/manifest-schema-v2`, not pushed.

## Ground-truth results (pre-brief checklist from session 035)

1. **Manifest inventory — closed.** The type lives in
   `packages/core/src/workspace.ts` (no `manifest.ts` exists); v1 confirmed
   with scalar `startedAt: string` / `shippedAt: string | null` and a
   literal `schemaVersion: 1` gate in `parseManifest`.
2. **Jira project-key charset vs. RAF/ANA prefixes — still open.** Live
   Atlassian MCP check awaiting owner go. Does not block this brief (the
   parser does no key-format validation, per v1 precedent); it blocks the
   keyless `start` command brief.
3. **Canonical vertical list — closed.** None exists; verticals are
   free-form strings throughout core (`parseVertical` is purely syntactic).
   Resolves D4's open point: v0 validates nothing beyond presence.
4. **Drive rename item-ID preservation — deferred** to `adapter-drive`
   research (unchanged).

Also confirmed: session-035 recap merged via **PR #85 at `main@52473ac`**.

## Decisions taken this session

### D1 — Two-brief split (ratified)

Schema + migration (this brief, 035) separated from the keyless `start`
command (next brief, expected 036). Rationale: open checklist item 2 blocks
`localKey` *generation* (command layer) but not the schema that *stores* it
— the parser never validated key format in v1 and does not start in v2.

### D2 — Delegation must carry the slot-034 burn evidence (applied)

The planner's mechanical NNN formula (`highest directory + 1`) computes
034, but slot 034 is burned (brief-less docs session, gap preserved per
P4) and the burn lives only in recaps — invisible to the three P4 sources.
The delegation supplied slot 035 explicitly with the burn rationale; the
planner recorded it in the brief's Context. This is the pattern for any
future delegation following a burned slot.

### D3 — In-flight scope delta ratified: `run-start.ts` rides Edit 2

Planner discovery: `buildManifest` in `packages/cli/src/run-start.ts`
produces the v1 shape, so the core schema commit alone would break the
monorepo. Minimal v2 adaptation (plus stale-comment fixes) shares the
schema commit to keep every commit boundary green. No keyless mechanics
entered through this door — verified at the mentor gate and at Pause 2.

## Pipeline record

- **Brief:** `docs/tasks/035-manifest-schema-v2/brief.md`, branch
  `feat/manifest-schema-v2`, Category L (400 lines), Plan required: yes.
  Commit #1 `ba86ad0` (planner).
- **Validator:** 11/11 PASS, no violations. Verbs `add`/`migrate`/`update`
  confirmed against the allowlist SSOT.
- **Mentor gate:** approved after full-text review against the D-set;
  cosmetic notes only (camelCase `startedAt` in a commit subject describing
  the snake_case `started_at` field — accepted).
- **Execution:** Pause 1 (plan approved; guard decomposition
  `asHistoryEntry`/`asHistory`/`parseManifestV2`/`migrateManifestV1`),
  Pause 2 (`workspace.ts` reviewed; validate-before-construct order in the
  migration confirmed), Guard 1 (v1 fixture with the `localKey` property
  absent — not `null` — plus dist-REPL transcript), Guard 2 (add-only
  `derive-path.test.ts` diff, +36/−0, 13 pre-existing tests byte-identical),
  three evidence-closed Pause 3s.
- **Commits (4):**
  1. `ba86ad0` docs(tasks): add brief for 035-manifest-schema-v2
  2. `d429a30` feat: migrate TaskManifest to schemaVersion 2 with history log
  3. `57d422f` feat(core): add startedAt fallback to derivePath month chain
  4. `8b9b322` docs(roadmap): update derivePath bullet to extended
     month chain
- Suite at close: 206 pass / 0 fail; build clean; `payload.json` never
  staged; **no push executed**.
- Merged via: PR #86, squash merge → `main@ba908a0` (amended post-merge by
  the executor session).

## Process observations (recorded, not formalized)

1. **Pause-3 evidence-close lapse, caught and closed retroactively.**
   Commit 2's creation was authorized but its `git log` evidence was not
   presented until the next Pause 3 (owner catch). Post-033 doctrine held:
   the commit was closed retroactively with `--format=%B` verbatim
   verification. Occurrence noted for the evidence-close pattern's track
   record.
2. **Burned-slot delegation pattern worked first try** (see D2 above) —
   candidate doctrine for AGENT_PLAYBOOK if it recurs.

## Out-of-scope reports (from execution)

- `packages/core/src/gateways.ts` carries a 2026-06-06 TODO about the
  manifest shape — reported per the brief, not resolved. Candidate item for
  a future reconciliation or the `ship`/`adapter-drive` brief.

## Pending items (queue after this session)

1. **Open PR for `feat/manifest-schema-v2`** (owner go; title/body supplied
   by mentor at that moment; `--body-file` via here-string per the PR #83
   lesson). Then squash-merge, forced branch cleanup, cache-swap ritual
   (in: both 035-manifest recaps + brief 035; out: the 2026-07-10 mentor
   recap for the D-set session per the standing swap rule — owner confirms).
2. **Keyless `start` command brief (expected 036)** — consumes session-035
   D1/D2 + command UX decision. **Blocked on ground-truth item 2** (Jira
   project-key charset + existing keys vs. RAF/ANA), which the mentor can
   run read-only via Atlassian MCP on owner go.
3. Open-in-software (D3 of session 032) — small follow-up brief.
4. Template naming convention + sanitization unification.
5. Hygiene chores: `payload.json` in `.gitignore` (2nd occurrence),
   missing-env error DX — neither at rule-of-three.
6. `gateways.ts` manifest-shape TODO (new, from this session's report).
7. Parked cluster unchanged.

## Next concrete action

Executor commits both 035 recaps on a docs branch → docs PR → squash-merge
(after or alongside the feature PR per owner sequencing) → cache-swap. Next
mentor session: **Jira item-2 verification + model the keyless `start`
brief (036)**.

## Paste-ready snippet for next session

```
Ola. Continuando o projeto Saci. Modo: [modelar tarefa | mentoria | ...]
Ultima entrega: brief 035 manifest-schema-v2 executado integralmente — 4
commits em feat/manifest-schema-v2 (schema v2 com par jiraKey/localKey +
history append-only + migracao lazy v1->v2; cadeia de mes do derivePath
estendida com started_at; bullet do ROADMAP acoplado). Guards 1 e 2
honrados com evidencia; 206/0 na suite. Feature PR #86 mergeado a
main@ba908a0. [CONFIRMAR: recaps PR #NN a main@<sha>.]
TEMA DESTA SESSAO: [verificacao item 2 no Jira (charset de project keys
vs. prefixos RAF/ANA, via Atlassian MCP) + modelar brief 036 keyless
start (consome D1/D2 da sessao 035 + decisao de UX do comando) | outro].
Carrega CLAUDE.md, MENTOR_BRIEF.md, ROADMAP.md e os recaps
docs/sessions/2026-07-12-mentor-035-manifest-schema-v2.md e
docs/sessions/2026-07-12-executor-035-manifest-schema-v2.md.
Antes de propor proximo passo, confirma em uma frase quem sou e o modo.
```
