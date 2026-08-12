# Run instructions: the 2026-08-12 art-chain probe

Owner-run procedure for `probe.mjs` (Windows). The executor never runs it: the
run needs Jira credentials, a Google consent round-trip, a real card key and a
Drive folder that only you can choose, and the Cowork sandbox cannot reach
`estrategia.atlassian.net` (`docs/explorations/drive-oauth.md` §8). You run it
locally and paste the labeled output back into the session.

**Credential hygiene (binding — `brief.md` D6):** the probe prints metadata
only. No brief body, no token and no client secret reaches stdout, so its
output is safe to paste as-is. What must never be pasted is in §6.

The spike runs in **two passes** and the first one does not render (D9). Pass 1
answers the read and scope questions; pass 2 answers the render question and
needs a different card. Both use the same command.

## 1. Preconditions

Two commands, in this order, from the repository root:

```powershell
npm install
npm run build
```

**In the worktree where this brief was executed both are already done** —
`node_modules` is materialized and `npx tsc -b` exits 0. Do not re-run
`npm install` there; there is nothing to fix and a lockfile change must never
land silently.

The step exists for the reader who arrives in a **fresh clone or a fresh
worktree**, which is the G-NODE-2 case. Without `npm install` at that
worktree's own root, the `@saci/*` workspace links point at the main checkout
instead of the local `packages/*`. The build then fails with errors that read
like real code breakage — `TS2305: Module '"@saci/core"' has no exported
member ...` on a symbol that plainly exists in the file you are looking at —
and, when no new symbol is involved, it passes while exercising stale code,
which is worse. After the install, `git status --short` must show no tracked
change (especially `package-lock.json`); if it does, stop and report.

`npm run build` is not optional: the probe imports the **compiled** adapters
from `packages/*/dist/index.js` (D1), so a stale or absent `dist` is either an
old measurement or an immediate module-resolution failure.

Pass 2 only: `render.mjs` drives the Chrome or Edge already installed on the
machine over CDP, so the render half needs a desktop with one of them present.
It installs nothing.

## 2. Environment

Three Jira variables, read by the probe on every run:

- `SACI_JIRA_BASE_URL` — e.g. `https://estrategia.atlassian.net`
- `SACI_JIRA_EMAIL` — your Atlassian account e-mail
- `SACI_JIRA_API_TOKEN` — your Atlassian API token

A missing one is named individually and the probe exits 2 before any call.

Drive needs no variables, only the credential files under `~/.saci`:

- `~/.saci/oauth_client.json` — the Desktop OAuth client, placed by hand and
  never in the repo. Required.
- `~/.saci/token.json` — created by the first consent flow. Do not create it
  by hand. If it is absent the probe prints an authorization URL; open it,
  authorize with the Estratégia account, and the run resumes by itself.

## 3. The three things you choose

**The card key.** Pass 1 uses `MC-1073960`, already verified to resolve a copy
document: parent `MC-1073953`, `vertical_raw = [EC] Geral`,
`copy_source = sister`, and a `docs.google.com/document/d/...` URL whose tail is
`rtpof=true&sd=true` — the signature of a file uploaded and converted on open,
most plausibly a `.docx`. That is exactly why stage 3 reads the `mimeType`
before stage 4 picks a read path (D2). Pass 2 needs a card whose copy is a real
carousel; choosing it is your call and is not part of this brief.

**The throwaway Drive folder id.** The tail of the folder's Drive URL. Stage 11
uploads every PNG plus `editables/spec.json` straight into it — one flat
folder, no tree. The verify-never-create folder walk is `ship`'s policy and a
later brief, so use a folder you do not mind filling with probe output. The
segments `derivePath` **would** have used are computed and printed, never
created.

**The scratch `--out` directory, outside the repo.** This is where the brief
text lands (`brief.txt`), plus `spec.json`, the render package `pkg/` and the
determinism re-render `pkg-recheck/`. Campaign copy is unpublished material
(`D:\Projects\suindara\PORTING.md` §8) and must not enter the repository, which
is why the probe takes the path from you instead of defaulting to one.

## 4. The invocation

One block, from the repository root. Replace the folder id and, for pass 2, the
key:

```powershell
node docs\tasks\2026-08-12-spike-art-chain\probe.mjs `
  --key MC-1073960 `
  --suindara D:\Projects\suindara `
  --template D:\Projects\suindara-tmpl-carrossel-concursos `
  --brand D:\Projects\suindara\brands\estrategia-educacao.json `
  --out D:\Scratch\saci-art-chain `
  --drive-folder <throwaway-folder-id>
```

`--force` is optional and passes straight through to `render.mjs` (it renders
even when a diagnostic would abort the batch). All six other flags are
required.

`--template` names the template repo to render with **and** anchors the match
scan: stage 6 reads every `suindara-tmpl-*/template.json` in its parent
directory, which is the same sibling layout `render.mjs` itself assumes. If the
match picks a different template than the one you named, the probe prints
`[match] chosen=<id> dir=<path>` and renders that one, so the spec and the
served folder can never disagree.

**Pass 1 is expected to stop at the match and exit 0.** `MC-1073960`'s summary
is `Anúncio Estático - Lâmina Única`, which fits neither installed template, so
stage 6 should print `[match] no template applies; stopping before render (D9
pass 1)` and the criteria table should read S1 and S2 measured, S3-S5
`not measured`. That is the successful pass-1 outcome, not a failure — do not
retry it, and do not read the missing S3-S5 as breakage.

## 5. The two negative verdicts

They are deliberately distinct, because they lead somewhere different. Neither
is fixed by running the command again.

**`[drive] verdict SCOPE-BLOCKED`** — the grant does not reach the file. The
probe prints the verbatim Google error and its status first. This is the top
product risk of the whole chain: the copy document is authored by a copywriter,
and `docs/tasks/046-spike-adapter-drive/notes.md` (D7) records cross-user
content access under `drive.file` as explicitly **untested**. A 404 here with
the file plainly visible in the Drive UI is that gap confirmed, not a bug. The
fix is a decision with organizational consequences — widening to a broader
Drive scope, or a shared-drive or service-account arrangement — so bring the
output back and decide it; do not widen scopes on the spot. When scopes do
change, **delete `~/.saci/token.json` first**: a scope change silently reuses
the old grant, and the failure it produces is confusing (G-DRIVE-1).

**`[drive] verdict BINARY-NOT-TEXT`** — the grant worked and the content is
unusable. `alt=media` succeeded on a file that is not text (a `.docx` is a ZIP)
and returned bytes that would flow downstream as garbage and produce
plausible-and-wrong art, which is worse than a loud failure. Nothing about
permissions is involved and no scope change helps. The fix is upstream of Saci
or upstream of the read: convert the copy document to a native Google Doc so
`files.export` applies, or add an explicit conversion step to the chain. Which
of the two is the right answer is a product decision this spike is meant to
inform, so record the `mimeType` the line carries.

## 6. What must never be pasted back

Not into the session, not into the repository, not into a task note:

- **the brief body** — any line of the copy itself, and any screenshot of the
  document. The probe deliberately prints only counts, a first line truncated
  to 60 characters, and a truncated sha256; that truncated set is what travels.
- **the API token** and any `Authorization` header.
- **`oauth_client.json` or `token.json`**, in whole or in part, and the
  authorization URL the consent flow prints (it embeds the client id).

Paste the `[probe]`, `[jira]`, `[url]`, `[drive]`, `[norm]`, `[match]`,
`[render]`, `[pkg]`, `[det]`, `[upload]`, `[jira-close]` and `[verdict]` lines,
one fenced block per pass. If a paste accidentally carries credential material
anyway, the run stops and the credential is rotated before anything continues.

## 7. Where the results go

Into `notes.md` in this same folder, authored **after** the run and carrying
the measured numbers — the `mimeType` and the read path that worked, the
transport deltas (`bom`, `crlf`, `nbsp`, `lines`, `bytes`), the
`strongSignalMatches` count, the per-template match rows with their hits, the
render exit code, the PNG count and hashes, the `[det]` ratio, the returned
Drive ids, and the transitions. A verdict without its number is not a
measurement.

Two things the run is expected to confirm, both of them findings rather than
defects to tidy:

- **`diagnostics.json=no`.** Stage 9 reports it because `render.mjs` does not
  write one today. That line is the evidence for the change Suindara needs; the
  spike records it and changes nothing in `D:\Projects\suindara`.
- **`files.export` has no primitive on `DriveFilesApi`.** The port exposes
  `readFileContent`, which is `files.get` with `alt: "media"`, so the probe
  reaches the native-Docs export through the authorized client the adapter
  returns instead. That is direct evidence that the port needs two more
  primitives — an item read (`resolveItem`) and a text export
  (`exportFileText`) — which is a later brief to be designed from these
  numbers, not a workaround to be cleaned up here.

`notes.md` is what a promotion brief is written from, the way brief 047 was
promoted from `docs/explorations/drive-oauth.md`.
