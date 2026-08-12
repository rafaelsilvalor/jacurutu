# Run instructions: the 2026-08-12 copy-locality probe

Owner-run procedure for `probe.mjs` (Windows). The session never runs it: the
Cowork sandbox cannot reach `estrategia.atlassian.net`
(`docs/explorations/drive-oauth.md` §8), and the JQL that defines a
representative sample is your call. You run it locally and paste the labeled
output back.

**What it answers.** Over a page of real design cards, what share resolve usable
copy text from Jira alone, what share only have a Drive link, and what share
have neither. It exists because the 2026-08-12 art-chain spike stopped at
`SCOPE-BLOCKED` and every remedy for that is organizational. This number tells
you how much of the problem a scope purchase would actually be buying.

**Credential hygiene (binding).** The probe writes nothing to disk, makes no
Drive call at all, and never prints a token or an `Authorization` header. The
only copy content that reaches stdout is three heads truncated to 60
characters. What must never be pasted is in §7.

## 1. Preconditions

Two commands, in this order, from the repository root:

```bash
npm install && npm run build
```

**In the worktree where this was authored both are already done** — 443 packages
installed, `tsc -b` exit 0, and `git status --short` clean afterwards with no
lockfile drift. Do not re-run `npm install` there.

The step exists for a fresh clone or a fresh worktree (G-NODE-2): without an
install at that worktree's own root, `@saci/*` resolves to the main checkout and
the build either fails with errors that look like real code breakage or, worse,
passes while exercising stale code.

`npm run build` is not optional — the probe imports the **compiled** adapters
from `packages/adapter-jira/dist/`, including three deep imports
(`extract.js`, `navigation.js`, `http.js`) that are not on the package's public
surface. A stale `dist` is an old measurement.

The art-chain spike's pass 1 tripped here: `node_modules` existed but predated
`adapter-drive`. **Presence of the directory is not the precondition; being
current is.**

## 2. Environment

Three variables, read on every run:

- `SACI_JIRA_BASE_URL` — e.g. `https://estrategia.atlassian.net`
- `SACI_JIRA_EMAIL` — your Atlassian account e-mail
- `SACI_JIRA_API_TOKEN` — your Atlassian API token

A missing one is named individually and the probe exits 2 before any call.

**No Drive credentials are needed and none are read.** `~/.saci/` is not
touched. That is the point of this measurement.

## 3. The one thing you choose: the JQL

This is the whole methodology, and it is easy to get wrong in a way that
produces a confident false answer.

**The production JQL is the wrong sample.** `automation/fetch.py`'s
`MAIN_JQL_TEMPLATE` selects cards in `FILA DE EXECUCAO` with `assignee IS
EMPTY` — cards waiting to be pulled. Copy tends to arrive *during* the work, so
sampling the queue measures cards before the copywriter has attached anything
and will report "the copy is never in Jira" for a scheduling reason rather than
a real one. **Sample cards that have already been worked**, so the copy has had
time to land wherever it lands.

A reasonable starting point — illustrative, not prescribed:

```
project IN (MCA, PMA, MC) AND issuetype = DESIGN AND created >= -60d ORDER BY created DESC
```

Adjust the projects to the ones the design team actually runs on. Widen the
window if 60 days does not yield ~50 cards.

Two things the adapter does to your sample, so the denominator is understood:

- Cards in `Backlog` are dropped, and so is anything with `template` in its own
  or its parent's summary (`FILTERED_STATUSES` / `TEMPLATE_MARKER`). The
  `[jira] filtered before mapping:` line reports how many and why.
- `--max` (default 50) caps the **main** search. The sister and parent searches
  get four times that, because several COPYWRITER sisters can hang off one
  parent and a tighter cap would truncate the very surface being measured.

## 4. The invocation

One block, from the repository root:

```bash
node docs/tasks/2026-08-12-measure-jira-copy-share/probe.mjs --jql "project IN (MCA, PMA, MC) AND issuetype = DESIGN AND created >= -60d ORDER BY created DESC"
```

`--max <n>` is optional and defaults to 50. Quote the JQL — it contains spaces
and parentheses.

The run is read-only: three JQL searches, one field-catalog read, one
credential pre-flight. `JiraGateway` has no write method, so no comment and no
transition is structurally possible.

## 5. How to read the output

**`[card]` — one line per card.** Five surface lengths (`own.desc`, `own.cmt`,
`sis.desc`, `sis.cmt`, `par.desc`), the winning surface, whether a Drive link
also resolved, the line-marker count, and a `sha256[0..12]` of the winning text.

Lengths are **prose** lengths: URLs are stripped before counting, so a
description that is nothing but a bare Drive link measures 0, not 120. Without
that, links would count as copy and invert the answer.

**`[dist]` — the length distribution, printed before any classification.**
Deliberately so. Choosing a "usable copy" threshold before seeing the shape of
the data would manufacture the result.

**`[class]` — the answer, at three thresholds.** Categories are A
(jira-resolvable, needs no Drive read), B (drive-only), C (neither). Three
thresholds are printed because **the spread is the finding**: if A moves from
57% at 100 chars to 38% at 500, "the Jira body is a real alternative" is a much
weaker claim than any single percentage suggests.

**`[class] cross-tab` — the honesty check on category A.** How many A-cards also
carry a Drive link. A card with 800 characters of Jira text *and* a link is not
proof the text is the copy; it may be a summary sitting next to the real
document. A high number here means category A is soft and the headline
percentage is an upper bound.

**`[sample]` — three heads, plus repeated-sha detection.** Character counts
cannot tell real copy from a recurring delivery note, and that distinction
decides whether the number means anything. Read the three heads and judge. The
repeated-sha line catches boilerplate the three samples miss: identical text
across cards is boilerplate wearing copy's length.

**`[signal]` — the carousel line marker.** Reported with the relaxed regex
`\bL\d+\s*:`, not the production `^\s*L\d+\s*:`. Measured against the compiled
adapter on 2026-08-12: `adfExtractText` joins every text node with a single
space, so ADF-derived text has no line breaks and the anchored form caps at one
match per card however many frames the copy has. **This is a finding in its own
right** — even if the copy moves into Jira wholesale, the template matcher's
only strong signal does not survive the ADF path as written.

## 6. The failure paths

**`verdict NO-CARDS`** (exit 1) — the JQL matched nothing after the adapter's
filters. Not a defect; widen the JQL or the date window per §3.

**`[probe] FAILED — no body returned for <KEY>`** (exit 1) — the second read did
not return a body the first search promised. Deliberately fatal rather than
counted as "no text": treating a fetch gap as an empty description would move a
card into category B or C on the strength of a bug.

The `[verdict]` table prints on **every** path, including failures, so a late
stop never discards measurements that already cost a live run.

## 7. What must never be pasted back

Not into the session, not into the repository, not into a note:

- **copy content beyond the three truncated heads** the probe prints itself.
  Unpublished campaign copy is sensitive (suindara's `PORTING.md` §8).
- **the API token**, and any `Authorization` header.
- **Jira issue summaries in bulk** if they name unannounced campaigns — the
  probe prints keys only, never summaries, for this reason.

Paste the `[probe]`, `[jira]`, `[fetch]`, `[card]`, `[dist]`, `[class]`,
`[sample]`, `[signal]` and `[verdict]` lines as one fenced block. If a paste
carries credential material anyway, stop and rotate the credential before
continuing.

## 8. Where the results go

Into `docs/explorations/jira-copy-locality.md`, authored after the run with the
`Status:` / `Origin:` / `Roadmap link:` header and a `## Changelog`, per
`docs/explorations/README.md`. An exploration note rather than a task note
because this number has no implementation mandate — it exists to inform a scope
decision that is open, which is exactly what that directory is for, and it is
the shape brief 047 was promoted from.

The note must carry the numbers, not a verdict alone — a verdict without its
number is not a measurement. It must also answer the question behind the
question, in one of three shapes, chosen by the data and not by preference:

- **a real alternative** — a large A share that holds up at 500 chars, with a
  low cross-tab. The Jira-body path could carry most cards and the scope
  purchase shrinks to an exception case.
- **a partial mitigation** — a moderate A share, or a high cross-tab that makes
  A soft. Worth building a Jira-first path, but the Drive read still has to
  work, so the scope decision stands unchanged in urgency.
- **a dead end** — a small A share. Say so plainly: buy the scope change, and
  record that this was measured rather than assumed so nobody re-opens it.

The third outcome is as valuable as the first and must not be softened. It costs
one probe run to close a question that would otherwise sit under every plan.
