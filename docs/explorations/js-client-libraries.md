# JS client libraries (Jira REST, Google Sheets)

Status: exploration — no implementation mandate
Disposition: open — 2026-08-06
Origin: migrated from `docs/ROADMAP.md` Pending decisions #1 by brief 051
(2026-08-06); entry text preserved verbatim
Roadmap link: migrated from ROADMAP Pending decisions #1 — 2026-08-06

1. **JS libraries for Jira REST and Google Sheets.** Equivalents to Python's `requests` and `gspread` not yet researched. Required before Phase 4 starts; not blocking Phases 1-3. The Google Sheets (gspread-equivalent) half is no longer pre-Phase-4: after the 2026-06-12 pivot, Sheets is a parking-lot consumer, so its library choice is gated on that promotion, not on Phase 4 start.

Migration observation (2026-08-06): the Jira half is answered by shipped
code — `adapter-jira` implements `JiraGateway` against the REST API over raw
global `fetch`, no client library (`CLAUDE.md`, Architecture). The Sheets
half is gated on the [[sheets-projection]] promotion, as the entry already
states.

## Changelog

- 2026-08-06 — migrated from the ROADMAP Pending decisions #1 by brief 051;
  disposition set to `open`.
