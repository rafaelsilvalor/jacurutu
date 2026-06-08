# Notes — 020 Jira adapter

## parent_summary is empty in practice

The mapper (`buildIssueEntry`, port of the seed's `build_issue_entry`) reads
`parent_summary` from the design issue's inline parent field
(`fields.parent.fields.summary`), behavior-preserving with the seed.

The current Jira Cloud JQL-search endpoint (`POST /rest/api/3/search/jql`) does
NOT return the inline `parent.fields.summary` on the design issue — only
`parent.key` is present. As a result, `parent_summary` resolves to `""` in
practice for every issue, matching the `or ""` guard the seed already applies.

The adapter does run a separate parent search (`fetchParents`), but its result
feeds only the second Template filter (parent-summary `Template` exclusion), not
the payload's `parent_summary` field — preserving the seed's mapping exactly.

### Possible follow-up (out of scope for 020)

`parent_summary` could be populated from the separate parent-search result
(`parentsByKey`) instead of the absent inline field. This would change the
payload shape relative to the Python seed (the seed leaves it `""`), so it is a
behavior change, not a behavior-preserving port. Deferred to a future brief; out
of scope for 020.
