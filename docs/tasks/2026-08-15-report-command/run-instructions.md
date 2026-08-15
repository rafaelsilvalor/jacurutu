# Run instructions: the `saci report` live smoke

Owner-run procedure for `report-smoke.md` (Windows). The executor never runs these
steps — the sandbox cannot reach Google and OAuth needs a real browser. You run them
locally and paste the output back into the chat; the executor interprets it and records
the result in `notes.md`.

**Credential hygiene (binding — `docs/explorations/drive-oauth.md` section 10):**
`oauth_client.json` and `token.json` never enter the repo, never appear in chat, never
get logged. The share recipient's address is a personal identifier and is treated the
same way.

## 1. Prerequisites

1. **`~/.saci/oauth_client.json` is in place.** The same Desktop OAuth client the Drive
   and Sheets adapters already use. If it is missing, follow
   `docs/explorations/drive-oauth.md` section 5.
2. **The Google Sheets API is enabled in the Cloud project.** A project-level setting,
   not a scope — `G-SHEETS-1` in `docs/GOTCHAS.md`. Already enabled by the 2026-08-15
   spike, so nothing to do; the pointer is here because a `403` naming
   `has not been used in project` means this and nothing about your token.
3. **Dependencies and build**, from the repository root:

   ```powershell
   npm install
   npx tsc -b
   ```

   The procedure drives the **built** CLI at `packages\cli\dist\cli.js`. That path is
   what the `saci` bin resolves to, so an unbuilt or stale `dist` measures the wrong
   code — and the whole point of this round is that the artifact under test is the
   command rather than a script written to exercise it.

## 2. What will and will not happen

**No browser consent is expected.** This task changed no scope: `DRIVE_SCOPES` is
untouched, and both the spike and the previous task's smoke measured creating, writing
and sharing as working under the pair already granted. The run should reuse
`~/.saci/token.json` silently.

**If a consent screen appears anyway, that is a finding — report it, do not click
through it.** A consent prompt means something changed that this task did not change,
and clicking through destroys the evidence of what.

**This run touches your real production state.** It creates
`~/.saci/report.json` if absent and writes an entry into it. The file was removed before
this round, so step 1 exercises the genuine absent-file path rather than a stale entry.
Step 6b deliberately leaves a dead entry there; the cleanup section of
`report-smoke.md` removes it.

**One spreadsheet is created in your My Drive root**, on step 1. Step 6 asks you to
delete it. If you stop before step 6, delete it by hand — deleting is not on the port,
so no step does it for you.

## 3. Running it

Follow `report-smoke.md` steps 1 to 6 **in order**. The order is not cosmetic:

- steps 2, 3 and 5 all need the spreadsheet step 1 creates;
- step 2 must run as its **own process**, because the property it proves is that the
  stored id survives process exit;
- **step 6 is destructive by design.** It deletes the report to prove that a stored id
  which no longer resolves fails loudly instead of silently creating a replacement. Run
  it last, after everything else is recorded. Running it early costs you the whole
  procedure and a second live round.

The six steps and what each one is for:

| Step | What it does | What it proves |
|---|---|---|
| 1 | first run, with the share flag | the factory composes; create + write + share work through the command |
| 2 | second run, separate process, trimmed payload | one identity across runs; state survives process exit; a run that creates nothing still shares |
| 3 | open the sheet and count rows | clear-then-write, through the command — no stale tail |
| 4 | unknown profile | a config typo fails before any authorization |
| 5 | share with a deliberately bad address, FULL payload | the grid is written anyway (1 row -> 3); the address is stripped from the message; the 400 is classified |
| 6a | trash the sheet, run again | a trashed file still accepts writes — the command reports success on a report the team can no longer open (`G-SHEETS-4`) |
| 6b | empty the trash, run again | D5: a dead id fails naming the fix and creates nothing |

Step 5 is a regression step for a regression that happened: on 2026-08-15 a mistyped
address aborted the run before the grid was written, left the report empty and
unshareable forever, and printed the address back in the failure. Three separate
observations, not one — read its entry in `report-smoke.md` before running it. It uses
the FULL payload deliberately: with the trimmed one the sheet would look the same
whether the grid was written or not, so the observation would prove nothing.

Step 6 has two halves and they answer differently. Trashing a Drive file is not deleting
it — 6a shows the write succeeding against a trashed report, which is the silent failure
`G-SHEETS-4` records; only 6b's permanent deletion produces the 404 that D5 is built on.

Step 1 is the one this round exists for in the largest sense: `createSpreadsheetGateway`
has never executed, anywhere, in this repository's history.

## 4. What to paste back

Paste **only** terminal output — the command's own stdout/stderr lines — as one fenced
block per step, and say which step each block came from. If a step failed, paste it
anyway: a partial map is data, and the failure lines are the most useful part of it.

For step 3, which has no terminal output, write two facts: how many rows the sheet
holds, and the first cell of its last row.

**Never paste:**

- the contents of `oauth_client.json` or `token.json`;
- the authorization URL, if one is ever printed — it embeds the client id;
- the share recipient's address, in the command line you paste or anywhere else;
- the real spreadsheet id — replace it with a placeholder;
- your home directory path — replace it with a placeholder;
- screenshots of the consent screen.

**The hole no code can close: the command line you type contains the address.** The
command never echoes the recipient, and the result line is built to exclude it — but
the invocation itself carries it in plain text, and the natural thing to paste is the
whole scrollback including what you typed. Retype the command with a placeholder where
the address goes, or omit the command line entirely and paste only its output.

Use the same placeholder convention as the previous task, so the two notes read alike:
a placeholder for the recipient, one for the created spreadsheet id, and one for the
home directory path. Apply them **before** the text reaches the chat — what you paste is
going into a committed `notes.md`, and redacting after the fact does not un-send it.

If a paste accidentally includes credential material, say so immediately: the run stops,
the credential is rotated or revoked, and nothing continues until you confirm.

## 5. If a step fails

Do not retry blindly, and do not edit the fixtures or the command to get past it. Paste
the output and let the executor classify it. Four cases have known meanings, and three
of them are STOP conditions rather than problems to solve at the terminal:

- **`403 ... has not been used in project ...`** — the Sheets API is not enabled in the
  Cloud project (`G-SHEETS-1`). A project setting; your token is fine.
- **Anything mentioning scopes — STOP.** Two independent measurements say the current
  pair suffices. A scope failure contradicts them, and it is the owner's call, never a
  thing to fix by widening `DRIVE_SCOPES`.
- **A second spreadsheet appearing on step 2 — STOP.** The one-identity design failed.
  The cause gets diagnosed before any fix is written.
- **The address appearing in step 5's failure message — STOP.** The adapter strips it;
  seeing it means the redaction did not cover the path that printed.
- **Step 5 leaving the sheet unchanged at one row — STOP.** The grid must be written
  before the share is attempted; an unchanged sheet means that ordering regressed.
- **Step 6b creating a replacement instead of failing — STOP.** D5 is not negotiable at
  the evidence round; a silent recreate is the exact failure the design exists to
  prevent.

A stale tail surviving at step 3 is the fourth interesting outcome. It would mean
`CLEAR_RANGE` does not cover what the command writes, which contradicts the previous
task's step-5 measurement. Report it with the row count; the contract does not get
weakened to "writes over the grid".
