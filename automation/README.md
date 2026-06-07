# Python automation seed (frozen reference)

Snapshot of the Estratégia coordination automation that seeds the Saci v2 port.
Read-only reference for the TypeScript port (docs/ROADMAP.md Phase 2+).

- Do not edit or run as part of v2. Not subject to CLAUDE.md R9 — pt-BR content is
  preserved as-is, same posture as the v1 freeze.
- lib_transform.py = pure domain; fetch.py = Jira adapter (+ pure policy to be lifted
  into core); lib_sheets.py = Sheets adapter; payload.json = port-contract sample
  (schema_version 2.0); run_local.py / sync.py = composition root.
