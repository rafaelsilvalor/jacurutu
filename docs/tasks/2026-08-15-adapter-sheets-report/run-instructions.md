# Run instructions: the adapter-sheets live smoke

Owner-run procedure for `sheets-smoke.mjs` (Windows). The executor never runs these
steps — the sandbox cannot reach Google and OAuth needs a real browser. You run it
locally and paste the output back into the chat; the executor interprets it and
records the result in `notes.md`.

**Credential hygiene (binding — `docs/explorations/drive-oauth.md` §10):**
`oauth_client.json` and `token.json` never enter the repo, never appear in chat,
never get logged. The share recipient's address is a personal identifier and is
treated the same way.

## 1. Prerequisites

1. **`~/.saci/oauth_client.json` is in place.** The same Desktop OAuth client the
   Drive adapter already uses. If it is missing, follow
   `docs/explorations/drive-oauth.md` §5.
2. **The Google Sheets API is enabled in the Cloud project.** This is a
   project-level setting, not a scope — see `G-SHEETS-1` in `docs/GOTCHAS.md`. It
   is already enabled in this project (the 2026-08-15 spike enabled it), so nothing
   to do; the pointer is here for the next install, and because a `403` naming
   `has not been used in project` means this and nothing about your token.
3. **Dependencies and build**, from the repository root:

   ```powershell
   npm install
   npx tsc -b
   ```

   The smoke imports the **built** adapter from `packages/adapter-sheets/dist`, so
   an unbuilt or stale `dist` measures the wrong code.

## 2. What will and will not happen

**No browser consent is expected.** This task changed no scope: `DRIVE_SCOPES` is
untouched, and the spike measured that creating, writing and sharing a spreadsheet
all work under the pair already granted. The run should reuse `~/.saci/token.json`
and print `reusing the token at ...` without opening anything.

**If a consent screen appears anyway, that is a finding — report it, do not click
through it.** A consent prompt means something changed that this task did not
change, and clicking through would destroy the evidence of what. Stop, and paste
what the terminal printed up to that point.

The run **creates one spreadsheet in your My Drive root** and does not delete it.
Deleting is not on the port, so the script prints the id under
`CREATED — delete this by hand` — including when a step fails — and you remove it
manually afterwards.

## 3. Running it

From the repository root:

```powershell
node docs\tasks\2026-08-15-adapter-sheets-report\sheets-smoke.mjs --share-with=<address>
```

`--share-with` is required: without it, step 6 cannot be measured and the script
refuses to run. Use a real colleague's workspace address — the same kind of
recipient the report will actually have. The script never echoes it.

The six steps, and what each one is for:

| Step | What it does | What it proves |
|---|---|---|
| 1 | `createSpreadsheet` | the create call shape works under the current scopes |
| 2 | `writeGrid` with a header + 3 rows | the clear/update pair works on a fresh sheet |
| 3 | read back (instrument) | the 3-row grid is really there |
| 4 | `writeGrid` with a header + 1 row | the shrinking case |
| 5 | read back and assert exactly 2 rows | **closes `CLEAR_RANGE`** — no stale tail |
| 6 | `shareAsReader` | the grant works, as `type=user` / `role=reader` |

Step 5 is the one this whole round exists for. `CLEAR_RANGE` is the single literal
in the adapter that no measurement covers, and a pass here is what closes it.

## 4. What to paste back

Paste **only** the script's terminal output — the `[smoke]` and `[drive-auth]`
lines — as one fenced block. If the run failed partway, paste it anyway: a partial
map is data, and the `FAIL` lines are the most useful part of it.

**Never paste:**

- the contents of `oauth_client.json` or `token.json`;
- the authorization URL, if one is ever printed — it embeds the client id;
- the `--share-with` address, in the command line you paste or anywhere else;
- screenshots of the consent screen.

The script withholds the address by design, but that only covers what the script
prints. **The command line you typed contains it** — retype the command as
`--share-with=<address>` when quoting what you ran, or omit the line entirely. What
you paste is going into a committed `notes.md`.

If a paste accidentally includes credential material, say so immediately: the run
stops, the credential is rotated or revoked, and nothing continues until you
confirm.

## 5. If a step fails

Do not retry blindly, and do not adjust the script. Paste the output and let the
executor classify it. Three cases have known meanings:

- **`403 ... has not been used in project ...`** — the Sheets API is not enabled in
  the Cloud project (`G-SHEETS-1`). A project setting; your token is fine.
- **`STALE TAIL: ...` at step 5** — `CLEAR_RANGE` did not cover what was written.
  The fix is to narrow the range and re-run, recording both the rejected and the
  accepted form. The contract does not get weakened to "writes over the grid".
- **Anything mentioning scopes** — stop. The spike measured the current pair as
  sufficient; a scope failure contradicts a measurement and is the owner's call, not
  a thing to fix by widening `DRIVE_SCOPES`.
