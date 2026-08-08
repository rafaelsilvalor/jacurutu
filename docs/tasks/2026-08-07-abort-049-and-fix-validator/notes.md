# Notes — 2026-08-07 abort-049-and-fix-validator

Two kinds of entry. **Rulings** are owner decisions taken mid-run; the executor
consumes them as brief-level decisions. **Queued findings** are closer findings
the owner chose not to turn into commits, kept here so whoever picks the
subject up reads a list instead of rediscovering it.

## Ruling 1 — Closer findings are graded, and the grade decides the response

Adopted 2026-08-08, after this task ran two calendar days and eleven commits
for deliverables that were complete at `ada36e9`. What inflated it was not the
closer's breadth — that breadth is what caught the `trava` — but the response:
every finding became a commit, and each fix created the next round's findings.

- **`trava`** — fixed before push. It blocks.
- **`precisa da sua decisão`** — the owner rules, and the default is this file.
  It becomes a commit only when it changes what ships.
- **`observação`** — queued here, never a commit.

A queued finding is not a dismissed finding. This file merges with the task.

## Queued findings

### Q1 — The C1 paragraph is orphaned under the C7 heading

`.claude/agents/brief-validator.md:113`, section heading at `:83`

`f640aec` moved C7's rationale out of the table cell into a `### How C7
extracts` section, which was the right fix in the right container. It was
inserted between the table and the paragraph explaining C1's identifier
window, and that paragraph did not get a heading of its own. It now lives
under a heading that announces four things about C7 and carries five
paragraphs, the fifth about C1.

Before `f640aec` the paragraph sat correctly under `### Rule-to-pattern
table`. The fix is one heading line before `:113`.

Third occurrence of this class in this lineage: `AGENT_PLAYBOOK.md`'s "Recap
policy (three recaps)", `PROCESS_MAP.md`'s "Three naming facts", and now a
section whose stated count disagrees with what it contains. Worth noticing
that the class keeps recurring rather than fixing instances one at a time.

Graded `precisa da sua decisão`; queued because it changes navigation, not
behaviour.

### Q2 — `brief-template/SKILL.md` does not say a Commit sequence line carries the subject alone

`.claude/skills/brief-template/SKILL.md:278-280`

C7 measures the whole line after prefix and backtick removal, which equals the
subject only when the line carries nothing else. The SKILL says each item
carries the exact subject and that each *subject* is verified ≤ 72 — it never
says the line may carry nothing more. Brief 050 annotates its lines and
therefore measures 98 where its subject is 46.

`f640aec` made the validator state the SKILL's actual wording and name the
gap rather than assert a rule the SKILL lacks. Closing the gap belongs in the
SKILL — one clause — and the SKILL is outside this task's declared path list,
so it was deliberately not touched.

### Q3 — C7's length rule trips six subjects in five merged briefs

001 (77), 002 (81), 003 (83), 008 (87 and 74), 050 (98). Five are genuinely
long; 050's is an annotated line, not a long subject. All merged, and a merged
brief is never re-validated, so nothing is blocked.

### Q4 — C11 surfaces 20 out-of-allowlist verbs in briefs 000 to 016

`record`, `adopt`, `align`, `refine`, `translate`, `introduce`, `route` and
others, all predating the allowlist. Surfaced only because C7's repair made
C11 discriminate again. Historical; re-auditing merged briefs was scoped out
by the owner on 2026-08-07 and stays out.

### Q5 — `049` now names two folders on `main`

`049-mentor-vehicle` and `049-init-six-role-bootstrap`. Slugs are distinct, so
the four-source slug check stays clean and there is no sequence left to
puncture. But citing "049" in prose no longer identifies a task without its
slug. Permanent consequence of E4 preserving an aborted folder, not a defect.

### Q6 — A session spanning midnight has no stated recap date

This task was born 2026-08-07 at 17:17 and its last commits landed 2026-08-08.
The task id is the birth date, which E2 settles. The recap's date is the
*session's*, and the convention does not say which day a session that crosses
midnight takes. This recap kept its opening date. Worth deciding before it
recurs.
