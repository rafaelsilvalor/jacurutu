# Sheets projection

Status: exploration — no implementation mandate
Disposition: deferred — 2026-08-06; trigger: a concrete downstream consumer
exists (Looker Studio is the named candidate)
Origin: migrated from `docs/ROADMAP.md` Parking lot and Pending decisions #10
by brief 051 (2026-08-06); entry text preserved verbatim
Roadmap link: migrated from ROADMAP Parking lot and Pending decisions #10 —
2026-08-06

Two entries merged into one note: the granularity question designs a surface
that exists only if the push promotes.

- **Sheets one-way push** — publish a flat projection tab for a downstream
  reader; named future consumer: Looker Studio. Was the Phase 4 `adapter-sheets`
  item; demoted by the 2026-06-12 pivot. Promotes when a concrete consumer
  exists.
10. **Sheets aggregation granularity.** Per-event push, daily
    rollup, or point-in-time snapshot. Decided during Phase 4
    modeling when real usage data from Phase 3 informs the choice.

The Sheets half of [[js-client-libraries]] is gated on this promotion.

## Changelog

- 2026-08-06 — migrated from the ROADMAP Parking lot and Pending
  decisions #10 by brief 051; disposition set to `deferred`.
