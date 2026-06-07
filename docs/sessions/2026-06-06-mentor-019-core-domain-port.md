# Mentor recap — 019 core domain port (Phase 2, first code brief)

Date: 2026-06-06 (BRT)
Mode: mentoring → task scoping → brief review → Pause reviews
Outcome: Brief 019 merged (PR #43 → `main@b7adcaf`). `@saci/core` now holds the
pure domain layer plus the type/port contracts. Execution detail lives in the
executor recap: `docs/sessions/2026-06-06-executor-019-core-domain-port.md`. This
recap captures the mentor-side rationale and the process learnings that the brief
and the executor recap do not hold.

## Architectural decisions (rationale)

### Scope: Option 2 + boundary refinement
Phase 2 ported `lib_transform.py`'s six pure functions AND the shape-independent
policy lifted out of `fetch.py` (`summaryTokens`, `bestMatchByTokenOverlap`,
`pickCopy`) — not `lib_transform.py` alone. Reading `fetch.py`'s bodies revealed
that `build_issue_entry` is the adapter's mapper (raw Jira → payload `Issue`), NOT
a core transform; what crosses into core is the policy plus the types. The
Jira-shape-coupled halves (`build_issue_entry`, `adf_extract_*`, `safe_get_*`, the
navigation halves of `resolve_copy` / `best_sister_match`) stay in the future Jira
adapter. The ROADMAP Phase 2 exit criterion was widened to acknowledge the split.

### Configurability seam (feeds the Phase 3 Jira adapter brief)
Rafael raised that Jira tasks change, esteiras get added, and users will want their
own filters and their own treatment of what those filters return. Resolution: the
FEATURE (editable filters/mapping inside the tool) is Phase 3 config; the SEAM that
makes it cheap is now. `customfield_*` ids are Jira-instance accidents, not domain —
they never enter core. The field-to-meaning mapping and the JQL/filter live at the
adapter boundary. `JiraGateway` returns clean payload-v2.0 `Issue`s; the adapter
owns the mapping. So a later editable `FieldMapping` + filter config is purely
additive and never reopens core. The named `FieldMapping` type stays deferred (no
second case yet — A3/R19); the `JiraIssue`/payload types landed now.

### CopySource home, barrel, placeholder (Pause 1)
`CopySource` lives in a leaf `types.ts`, not `policy.ts` — avoids a
payload(DTO) → policy(behavior) dependency inversion; both import the leaf. Barrel
evolves incrementally (every commit green). `SACI_CORE_PHASE` kept exported —
adapters import it; removing it would cross the package boundary (Flag 4). Its
cleanup is a future brief, when the adapters get real implementations.

### parseEntrega / isValidYmd
Wall-clock parse straight from the ISO string, never `new Date()` (which would
reinterpret the offset and shift hour/date for inputs like
`2026-05-13T19:30:00.000-0300`). `isValidYmd` reproduces Python
`strptime`/`fromisoformat` rejecting impossible calendar dates on BOTH branches
(date-only and full-ISO); its `Date.UTC` use is pure days-in-month arithmetic — no
I/O, no timezone hazard (Flag 1 held). Mentor added impossible-date tests
(`2026-13-40`, `2026-02-30` → `[null, ""]`).

## Process learnings

### Pipeline auto-advancement bit us concretely (recurrence)
The planner → brief-validator chain auto-advanced with no window to inject the
brief corrections (Edit 1 caminho-B framing, the verb, the nits) between planner
authoring and the validator. The main session even auto-fixed the verb and
re-validated on its own. Mitigations used this session: interrupt (Esc) to reclaim
control; apply corrections on-branch (verdict-handling option 2); re-validate.
Durable fix to consider: when a mentor-review gate is wanted, run the planner ALONE
and stop before the validator — the pipeline has no built-in planner→validator human
pause. Rule-of-three: this has now recurred enough to warrant an AGENT_PLAYBOOK note
introducing an explicit "mentor-review gate" entry point.

### Planner applied the caminho-B Edit-1 stub to a pipeline brief
The planner mechanically reused the briefs-009+ caminho-B Edit 1 ("user pre-saved;
executor commits #1") even though this brief was pipeline-authored (the planner
commits the brief). Caught in mentor review; fixed on-branch to "verify-only; do not
re-commit; executor runs #2–#5". Candidate `planner.md` refinement: when invoked via
the pipeline, Edit 1 is verify-only, not the caminho-B commit stub.

### The R25 structural check was naive
The delegation's `grep -rn 'from.*adapter' packages/core/` false-positived on a
JSDoc prose line ("...issues from Jira. The adapter maps..."), not an import. R25
held (zero adapter imports) but the checkbox could not be honestly marked. The
executor reworded the JSDoc. Future R25 checks should target imports specifically
(e.g. `grep -nE "from ['\"].*adapter"`), not a bare `from.*adapter`.

### Seed-vendor credential incident
While vendoring `automation/` into the repo, a `Copy-Item -Recurse` of the real
local folder pulled real secrets (`credentials.json`, `token.json`,
`oauth_client.json`, and likely `jira_credentials.json`) into the commit. GitHub
push protection blocked the push — nothing leaked. Recovery: removed the files,
added `automation/.gitignore`, collapsed the branch (`git reset --mixed main`), and
re-committed clean. Reinforces: never assume a copied folder lacks secrets; the
uploaded zip was not representative of the live folder. `automation/` is a frozen
reference whose README declares the R9 exemption.

## Carried-forward meta items (not touched this session)

- Document the `## Judgment flags` block convention on the mentor side
  (MENTOR_BRIEF / AGENT_PLAYBOOK).
- Grep orphaned `E4` references in `docs/` and `CLAUDE.md` (E4 is a genuine gap,
  not a slot reserve).
- Recap hygiene: the 2026-05-31 recap listed the C11 gap as open after #36 had
  closed it.
- `executor.md` STOP-guard calibration (observation, not yet a decision).
- "old 013" parking-lot item.
- New this session: AGENT_PLAYBOOK note for a planner→validator mentor-review gate;
  `planner.md` pipeline-vs-caminho-B Edit-1 rule; tighten the R25 grep.

## Next action

The Jira adapter brief (Phase 3/4) is the natural next brief: implement
`JiraGateway` / `SheetGateway` / `DriveGateway` and port the deferred
Jira-shape-coupled halves (`build_issue_entry`, ADF URL gathering, the navigation
halves of `resolve_copy` / `best_sister_match`). Those feed plain token sets and URL
lists into the core `bestMatchByTokenOverlap` / `pickCopy`, which are already waiting.
Carry the configurability seam (`FieldMapping` at the adapter boundary) into that
brief's scoping.
