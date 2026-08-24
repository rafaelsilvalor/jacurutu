# Session recap — 2026-08-21 — oauth-client-distribution (Orchestrator)

**Mode:** discussion session, opened in Plan mode under an explicit
no-implementation mandate. The owner lifted the mandate mid-session and
authorized three items; the plan was approved before any of them ran.
**Consumes:** `2327690` — head of `main` after #164.
**Branch:** `docs/oauth-client-distribution`, one commit, merged as `2b81a8c` (#165).
**Produced:** `docs/explorations/oauth-client-distribution.md`, the `JAC-35` card,
and a rewritten `JAC-34` description.
**Cards:** `JAC-34` corrected, left `To Do`. `JAC-35` opened, `blocks JAC-34`,
`Wave` empty — waves are the owner's.
**Span:** 2026-08-21 to 2026-08-24, four days, with multi-day gaps between turns.
That span is the subject of the session's worst error.

## One-line summary

A card filed as a credential problem was measured into a distribution problem —
but the session's reusable output is not that result. It is a discipline failure
committed after the same failure had been denounced in others: **inferring where
a measurement was one API call away.**

## The question, and the measurement that closed it

`JAC-34` asked whether a designer could stop downloading `oauth_client.json`
from the Google Cloud Console. The cheap answer would have been to drop the
secret and embed only the `client_id` as a named constant, which is not a secret.

Measured live, on the owner's machine, against the spike's Internal Desktop
client:

```
HTTP 400

{
  "error": "invalid_request",
  "error_description": "client_secret is missing."
}
```

`token.json` was byte-untouched before and after, and the exchange failed before
any token was issued. **The secret is mandatory and PKCE does not substitute** —
and Google's own native-app documentation marks the field *Optional*, which is
wrong and was still unanswered on Google's developer forum.

Two things that made this measurement worth designing rather than skipping: it
cost one browser round trip, and desk research had it 2 to 1 in the wrong
direction. The documentation said Optional; only the endpoint said otherwise.

## What the answer did to the card

`JAC-34` stopped being a credential card. A designer's onboarding has four manual
steps, and the largest — obtaining the CLI at all — had no card, which repeats
the exact discovery that produced `JAC-34` one layer up. Its own done-criteria
also held a contradiction: "without opening the console" costs no engineering,
while "the README does not ask for a manual download" needs a build artifact
whose format is deferred.

`JAC-35` was opened for packaging, update channel, code signing and the
production OAuth client, and it now blocks `JAC-34`. The "no manual download"
criterion moved there.

## Three instrument denunciations, and why each earned its words

1. **`WebFetch` paraphrases.** The load-bearing "Optional" claim arrived through
   a summarizing model rather than as page text. Flagged *before* the findings,
   not after — and the endpoint later contradicted exactly that claim.
2. **The console page failed to render**, and Google named "excessive automated
   requests" as one of two causes. The automation was this session. Stopped after
   one reload instead of retrying, because under that hypothesis retrying is the
   thing that makes it worse.
3. **A development credential was priced as production.** The recap records this
   one because the correction came from the owner, not from the session: the
   secret in `~/.jacurutu/` belongs to a probe client with no release and no
   dependents, so guarding it urgently was ceremony in the wrong place. The
   requirement moved to `JAC-35`, where the production client is born.

## The failure this session actually contributes

The dates, in order:

1. The note was written stamped `2026-08-21` throughout. **Correct.**
2. Later, the machine clock read `2026-08-24` and the note's own commit
   `2026-08-23T21:20`. Concluded the stamps were wrong.
3. Asked the owner which day the probe ran. He answered that he did not
   remember, and that the merge was today and the commit yesterday.
4. Inferred `2026-08-23`, applied it to the note and to one card description.
5. `JAC-35`'s `created` field — `2026-08-21T20:26:24-0300` — settled it in the
   opposite direction. One API call, of a kind already made twice in this
   session for other fields.
6. Reverted both. Nothing wrong was committed and nothing was pushed.

Two generalizations, and the second is the load-bearing one:

- **"I don't remember" is a signal to go measure, not a licence to infer.**
- **A long session's own timestamps are evidence.** Reading a multi-day gap
  between turns as clock skew inverts the data: the gaps were real, the clock was
  fine, and the card's birth date was never today.

The rhyme is uncomfortable and belongs in the record. The 2026-08-20 session
named the class "a sentence goes false when the thing it points at changes,
without the sentence being edited". Here the author took a true sentence and
moved it to false deliberately, having read that recap the same session.

## Two findings about our own guards

1. **`record` is not in `VERB_ALLOWLIST`**, yet `6bec1f2` on `main` carries
   `docs(explorations): record that the Notion board was frozen`. Either that
   commit predates the list or the hook did not fire for it. Used `document`
   instead and reported it in the PR rather than routing around it.
2. **`core.hooksPath` is unset in this worktree**, so `.githooks/pre-commit`
   never fired — the gap `PROCESS_MAP.md` §6 warns about, observed rather than
   assumed. The equivalents were run by hand (`tsc -b` plus `npm test` at
   112/112, and `checkLanguage` at 0 findings) and the PR's hook checkbox was
   left **unticked** with the reason in the body. An unticked box that says why
   beats a ticked box that is false.

## The gates, and the one ruling

The write gate ran twice: once for the note, once for this recap. Pause 3 ran
once, with `git status`, `git diff --cached --stat`, a subject measured at 68 of
72 characters by `wc -c`, and the green boundary pasted.

One hook finding was a `decision: "ask"` — a Portuguese verbatim quote of the
Google console on an English-only surface (R9). Ruled by the owner rather than by
the session. Resolved by rewriting in English with a pointer to `G-SHEETS-3`,
which is better on the merits than an override would have been: that console
prose arrives in the account's locale, so a verbatim quote pins the sentence to
one reader's language.

**One declared process deviation.** `docs/explorations/` is the Mentor lane's to
write (`docs/explorations/README.md` rule 3, `PROCESS_MAP.md` §4) and this was
not a Mentor session. The owner's instruction in the current session outranks
that (§9.1); the deviation was named before executing rather than discovered
afterwards.

## What this session did not verify

- **No designer machine was touched.** Every measurement came from the owner's,
  the only machine that has ever run this CLI. Second consecutive session with
  this same gap.
- **The `report` command's dependency on the file was read, not run.** The chain
  `createSpreadsheetGateway → authorize → readOAuthClient` was traced through
  source; the command was never executed to see it fail.
- **Whether a client secret expires on its own.** Not measured.
- **The consent screen's displayed app name.** User-facing, and both the project
  and client are named after the probe. Never inspected.
- **Whether the legacy console surface's download still yields a secret.** Not
  measured, and now low-stakes.

## Queue state

`JAC-34` is blocked and stays `To Do`. `JAC-35` is next and is larger than the
card that produced it. The note's disposition is `candidate` and is **proposed,
not ratified** (M-R14).

Two follow-ups this session created and did not act on: the `README.md` line
that omits `oauth_client.json` from the `~/.jacurutu/` inventory, and its
installer section still describing v1's frozen Electron build under the
pre-rename product name.

## Next session

Ratify or change the note's disposition, then decide whether `JAC-35` gets a
brief. Two corrections belong to other owners and were reported rather than
made: `local-storage-format.md` §1 and §2 (`JAC-1`), and the two `README.md`
defects above.
