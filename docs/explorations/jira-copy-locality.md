# Where design-card copy actually lives — measured

Status: exploration — no implementation mandate
Disposition: candidate — 2026-08-13
Origin: probe run 2026-08-12 over 47 live design cards, from
`docs/tasks/2026-08-12-measure-jira-copy-share/`; follows the art-chain
spike (`docs/tasks/2026-08-12-spike-art-chain/notes.md`)
Roadmap link: none — informs the Drive-scope decision the art-chain spike
left open, and does not resolve it

The art-chain spike stopped at `SCOPE-BLOCKED`, and every remedy for that
is organizational: widen the OAuth scope, adopt the Google Picker, or buy
a service account with domain-wide delegation. Its notes closed with a
third path worth measuring first — `adfExtractText` already reads the Jira
issue body, so if some share of cards carry their copy there, those cards
need no Drive read at all.

This note is that measurement. **The answer is no.** It shrinks nothing.

---

## 1. What was measured

A JQL page of 47 design cards (`project IN (MCA, PMA, MC) AND issuetype =
DESIGN AND created >= -60d`), after the adapter's own filters dropped one
Template card and two in Backlog. For each card, five surfaces where copy
could live:

| # | Surface |
|---|---|
| 1 | the design card's own description |
| 2 | the design card's comments |
| 3 | the COPYWRITER sister's description |
| 4 | the COPYWRITER sister's comments |
| 5 | the parent's description |

Read-only: three JQL searches plus a field-catalog read. `JiraGateway` has
no write method, so no comment and no transition was structurally possible.
No Drive call was made anywhere.

The probe reuses the adapter's own extraction and the real sister-pairing
rule (`bestSisterMatch`) rather than reimplementing them, so it measures the
matcher Saci ships. URLs are stripped before measuring, so a description
containing only a Drive link measures as zero prose rather than as copy.

## 2. The headline

**0 of 47 cards carry card-specific copy text in Jira.**

Where the longest text on each card came from:

| Winning surface | Cards | Share |
|---|---|---|
| parent description | 44 | 94% |
| the card's own description | 3 | 6% |
| **COPYWRITER sister** | **0** | **0%** |

The three own-description winners are 161 characters each and **byte-identical
to one another** — a request-intake form, not content.

## 3. The instrument produced a wrong number first

Recorded because the wrong number is quotable from the probe's own output and
will resurface otherwise.

The probe's first classification read **94% jira-resolvable at a 200-character
threshold**. That number is an artifact of ranking surfaces by length. Parent
descriptions run 1,430–4,901 characters (campaign briefings) while a card's own
description runs ~95 (a form), so the parent always won — and the same briefing
was counted once per child card as though it were distinct copy.

The repeated-hash check caught it, which is the only reason this note says
what it says. **Text volume in Jira is not information in Jira.**

The `[class]` lines in any probe output measure volume, not specificity. They
are correct as to what they measure and misleading as to the question.

## 4. Findings

### F1 — The Jira-side text is inherited, not card-specific

47 cards resolve to **17 distinct texts**. Six of those 17 differ only
trivially (483–497 characters, one template with a field swapped), so the
genuinely distinct content is roughly **12 documents for 47 cards**.

| Cards sharing one identical text | Text length |
|---|---|
| **14** | 2,942 |
| 5 | 4,901 |
| 5 | 813 |
| 4 | 1,430 |
| 4 | 1,654 |
| 3 | 161 |
| 2 | 2,955 |

**37 of 47 cards (79%) share their text with at least one other card.**

The failure mode this implies is the dangerous kind. An automation reading the
parent would render 14 deliverables from one briefing and return them as 14
distinct results — a success carrying the wrong content, not a loud failure.

### F2 — COPYWRITER sisters are empty containers

**115 sister issues were read. Every one had an empty description.** A single
one carried comment text (223 characters).

The sister issue exists to hold a link. The copywriter's work lives in Drive;
Jira points at it, when it points at all.

This is the strongest single fact in the measurement, because the sister is the
surface the copy pipeline was designed around.

### F3 — A quarter of cards have no copy source at all

How the copy URL resolved, by the adapter's sister → parent → fallback
precedence:

| Resolution | Cards | Share |
|---|---|---|
| parent | 25 | 53% |
| sister (the designed path) | 10 | 21% |
| **none** | **12** | **26%** |

Two separate problems. The designed path carries 21% of cards. And 12 cards
carry no resolvable pointer anywhere — not a broken link, no link — while
looking identical to the others from the outside.

**Buying the Drive scope does not reach these 12.** They are outside every
remedy currently under discussion, and nobody had looked at them.

### F4 — The card's own description is an intake form

Own-description lengths cluster on 74, 90, 95, 96, 101, 130 and 161 characters
and repeat across unrelated cards. No card uses its description to convey what
the piece should say.

### F5 — No frame structure exists anywhere (0 of 47)

The production carousel template identifies frames by line markers (`L1:`,
`L2:`, …). **No card carries a single marker on any of the five surfaces.**

Even with the text in hand, the frame count would be unknown.

### F6 — The production frame regex cannot survive the ADF path

Independent of everything above, and true even if copy moves into Jira wholesale.

`adfExtractText` joins every text node with a single space
(`packages/adapter-jira/src/extract.ts`), so ADF-derived text contains no line
breaks. Measured against the compiled adapter on 2026-08-12: a two-frame
document yields one flat line, where the production regex `/^\s*L\d+\s*:/m`
counts **1** marker and an unanchored form counts **2**.

The anchored regex caps at one match per card however many frames the copy has.
A Jira-authored carousel would silently look like a one-frame piece.

**Closed 2026-08-14** by `docs/tasks/2026-08-14-adf-text-fidelity/`. Block
nodes and `hardBreak` now end a line in `adfExtractText`, and the anchored
count is a regression test. The measurement above is preserved as the record
of the 2026-08-12 run, not as current behavior.

## 5. Verdict

**Dead end — not a real alternative, and not a partial mitigation.**

The Jira-body path covers zero cards. The Drive-scope decision stands unchanged
in urgency and scope, now measured rather than assumed.

The value bought here is that the question is closed. It cost one read-only run,
and it would otherwise have sat under every plan as an untested "maybe we don't
need Drive at all".

## 6. What this changes

- The scope decision recorded in `docs/tasks/2026-08-12-spike-art-chain/notes.md`
  proceeds on its own merits. No option is cheapened or removed by this result.
- Any future "read the issue body instead" proposal is answered. Cite this note.
- F6 is a defect in the match step that no scope decision touches, and it is
  brief-shaped on its own.
- F3's twelve sourceless cards are a gap in the product's model, not in its
  permissions, and are brief-shaped on their own.

## 7. What stays open

- **Why 26% of cards carry no pointer.** Whether those cards need no copy, or
  their copy arrives through a channel nobody mapped, is unmeasured and cannot
  be inferred from Jira.
- **Whether 60 days is representative.** One window, one probe run. A different
  season of the board could differ, and re-running is one command.
- **Whether the parent briefing is useful for anything else.** It is not
  card-specific copy, but ~12 distinct campaign briefings may still carry
  vertical or tone signal worth extracting for template matching. Unexplored.
- **The process question.** Every remedy that would make Jira a real source —
  a canonical copy field, frame markers as a writing convention, native Google
  Docs instead of uploaded Word files — is a process change, and process changes
  are not this lane's to propose.

## Changelog

- 2026-08-12 — Authored from the probe run of the same date. Records the 0-of-47
  result, the six findings, and the `dead end` verdict; supersedes the untested
  "a share of cards may carry copy in the Jira body" hypothesis left open by
  `docs/tasks/2026-08-12-spike-art-chain/notes.md`.
- 2026-08-13 — Disposition ratified by the owner: `open` → `candidate`. The
  measurement itself is closed and needs no further exploration; what is shaped
  enough to become a brief are the two findings §6 names as brief-shaped — F6
  (the frame regex does not survive the ADF path) and F3 (26% of cards carry no
  copy pointer at all). Neither depends on the Drive-scope decision.
- 2026-08-14 — F6 closed by `2026-08-14-adf-text-fidelity`
  (`fix(adapter-jira)`): the ADF projection now ends a line at every block node
  and joins inline runs with nothing, and the anchored marker count is pinned
  by a regression test. F3 remains open and brief-shaped.
