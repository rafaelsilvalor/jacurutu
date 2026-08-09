# v1 ↔ v2 overlap coordination

Status: exploration — no implementation mandate
Disposition: discarded — 2026-08-08; the question presupposed a temporary
overlap ending at Phase 4, and the Python repo is a permanent laboratory lane
instead (`python-laboratory-lane.md`), so a lane that is maintained rather than
frozen makes "untouched or patched?" moot
Origin: migrated from `docs/ROADMAP.md` Pending decisions #4 by brief 051
(2026-08-06); entry text preserved verbatim
Roadmap link: migrated from ROADMAP Pending decisions #4 — 2026-08-06

4. **Coordination of v1 ↔ v2 during overlap.** While v2's Phase 4 is unfinished, Python `automation/` runs coord mode. Decide: keep automation untouched, or accept small patches? Default: untouched.

## Changelog

- 2026-08-06 — migrated from the ROADMAP Pending decisions #4 by brief 051;
  disposition set to `open`.
- 2026-08-08 — disposition moved from `open` to `discarded`. The Mentor session
  of 2026-08-08 closed that the Python repo does not migrate
  (`python-laboratory-lane.md`), which removes the premise this question rests
  on rather than answering it: there is no overlap period ending at Phase 4, so
  there is no window during which `automation/` is held still. `deferred` was
  considered and rejected — it requires a declared trigger, and no honest
  trigger exists for a question that stopped applying. The entry text above is
  preserved as the record of what was asked.
