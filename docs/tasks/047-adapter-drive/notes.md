# Notes: 047 — adapter-drive evidence and decisions

Companion to `brief.md`. Records the live evidence for the five `DriveGateway`
primitives, the R2 dependency justification for the future PR description, the
supersession of a brief-045 contract, and the watch items and observations
carried forward.

## 1. Live smoke — evidence round

### Provenance (deliberate deviation from D3, authorized in-session)

The brief's D3 execution model says the **owner** runs the smoke and pastes the
output. That is not what happened, and the difference is recorded here rather
than smoothed over:

- The smoke was **run by the Orchestrator session on the owner's Windows
  machine, under explicit owner instruction** given in-session. The owner
  instructed the run instead of performing it.
- The credential placement stayed with the owner: `oauth_client.json` and
  `token.json` were put into `~/.saci/` by hand by the owner. No agent handled
  credential material.
- The executor did not run the smoke, the OAuth flow, or any Drive call, and
  recorded nothing that is not in the transcript below.

What D3 protects — that no live result is claimed without a real run and a
verbatim transcript — holds. Who typed the command changed; the evidence
standard did not.

### Transcript (verbatim, 2026-08-02, exit code 0)

Targets are the 046 spike's own and already public in
`docs/tasks/046-spike-adapter-drive/notes.md`: the folder `TEST-APP` and the
human-created child `MINHA-PASTA-RAFAEL`. No token or client-secret material
appears in the output — the script prints paths, ids, names, scope strings and
byte counts only.

```
[smoke] brief 047 adapter-drive live smoke — 2026-08-02T22:52:41.663Z
[smoke] node v24.15.0 on win32 (x64)
[smoke] requested scopes:
[smoke]   https://www.googleapis.com/auth/drive.file
[smoke]   https://www.googleapis.com/auth/drive.metadata.readonly
[smoke] oauth client file: C:\Users\rafae\.saci\oauth_client.json (exists: true)
[smoke] token file: C:\Users\rafae\.saci\token.json (exists: true)
[smoke] target folder id: 1rdxsTkKBCh-a9eU7hDwcThxBzEj6_JBb
[smoke] expected existing child: "MINHA-PASTA-RAFAEL"
[drive-auth] reusing the token at C:\Users\rafae\.saci\token.json (no browser needed)
[drive-auth] refresh token present: true
[drive-auth] access token expiry: 2026-07-28T00:53:12.849Z
[drive-auth] granted scopes: https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly
[step-1] PASS — resolveFolder on the target folder: id=1rdxsTkKBCh-a9eU7hDwcThxBzEj6_JBb name="TEST-APP" mimeType=application/vnd.google-apps.folder
[step-2] PASS — findChild finds the human-created "MINHA-PASTA-RAFAEL": id=1YpGJkyKn9JYlCo6wuxyklClgr96YWsqf name="MINHA-PASTA-RAFAEL" mimeType=application/vnd.google-apps.folder
[step-3] PASS — findChild returns null for a name that cannot exist: null for "saci-047-absent-c6609c7e-2566-40f0-a3c7-1c8fa57fc453" (the absence answer the ship layer reads)
[step-4] PASS — createFolder — NEWLY EVIDENCED HERE (the 046 probe never ran it): id=11fvWHmt_eiIOvaL3J8hI-vLGksW4xVJz name="saci-047-smoke-2026-08-02T22-52-43-208Z" mimeType=application/vnd.google-apps.folder
[step-5] PASS — uploadFile into the created folder: id=1lynhHcSKYCLBr2nyeE9pH7SLNHktFkMq name="saci-047-smoke.txt" mimeType=text/plain from C:\Users\rafae\AppData\Local\Temp\saci-047-smoke.txt
[step-6] PASS — readFileContent round-trips the uploaded bytes: 58 bytes identical to what was uploaded, first line: "saci 047 adapter-drive smoke — 2026-08-02T22:52:43.966Z"
[smoke] RESULT: 6/6 steps passed
[smoke] CLEANUP — delete by hand: folder id=11fvWHmt_eiIOvaL3J8hI-vLGksW4xVJz name="saci-047-smoke-2026-08-02T22-52-43-208Z"
[smoke] CLEANUP — delete by hand: file id=1lynhHcSKYCLBr2nyeE9pH7SLNHktFkMq name="saci-047-smoke.txt"
```

Platform line: `node v24.15.0 on win32 (x64)`. Scope pair unchanged from 046 —
`drive.file` + `drive.metadata.readonly`, as printed and as granted.

### Per-primitive evidence record

Every line below traces to one transcript step above; nothing is inferred.

| Primitive | Step | Result | Evidence line |
|---|---|---|---|
| `resolveFolder` | 1 | PASS | resolved `TEST-APP`, mimeType is the folder type |
| `findChild` (present) | 2 | PASS | found the human-created `MINHA-PASTA-RAFAEL` |
| `findChild` (absent) | 3 | PASS | `null` for a name that cannot exist |
| `createFolder` | 4 | PASS | created `saci-047-smoke-2026-08-02T22-52-43-208Z` |
| `uploadFile` | 5 | PASS | uploaded `saci-047-smoke.txt`, mimeType `text/plain` |
| `readFileContent` | 6 | PASS | 58 bytes identical to what was uploaded |

All five port primitives are live-evidenced; `findChild` is evidenced on both
its answers, presence and absence.

### Reading 1 — `createFolder` is newly evidenced

Step 4 is the first live evidence of `createFolder` anywhere in the project.
The 046 probe ran four operations and never exercised folder creation, which
is precisely why this round existed. The coverage gap recorded in 046 is
closed.

### Reading 2 — the unattended refresh path works

`access token expiry: 2026-07-28T00:53:12.849Z` is **in the past** relative to
the run at `2026-08-02T22:52:41.663Z`. The stored access token was therefore
stale, and `google-auth-library` refreshed it silently before the six calls
succeeded. No browser opened, no consent was requested — the unattended
designer flow the adapter is built for.

### Reading 3 — what this run does NOT establish

It does **not** close 046 watch item 2 (Internal-mode refresh longevity). The
Internal-mode token was minted `2026-07-27T23:53:13.851Z` and this run is
2026-08-02 — **day 6**. A 7-day External + Testing cap would have let a day-6
refresh through just as well, so the run cannot discriminate Internal from
capped. This is **partial evidence** toward the watch item; the item stays
open, and the corroborating unattended run must happen **after ~2026-08-04**.
Nothing here confirms the no-cap behavior.

### Reading 4 — the URL-redaction path is still unexercised

`drive-smoke.mjs` redacts the authorization URL out of the terminal (writing it
to a temp file) so the whole output is safe to paste. That path never fired in
this run, exactly as expected with an existing token: no consent flow, no URL
line. It was verified before the round against a placeholder client with no
token file — both the success and the write-failure branch — but it remains
unexercised against a real consent flow.

## 2. R2 justification (ready to paste into the future PR description)

Transcribed per D8 from `docs/tasks/046-spike-adapter-drive/notes.md` question
2; not re-derived.

> **New runtime dependencies (R2):** `googleapis@173.0.0` and
> `google-auth-library@10.9.1`, both pinned exactly. What they buy is the two
> pieces of Google plumbing it would be unwise to hand-roll: OAuth refresh-token
> rotation (obtaining, persisting and silently refreshing an access token, with
> the loopback installed-app flow) and resumable media upload for files large
> enough that a single request is not an option. Both are well-specified,
> tediously stateful, and failure-prone to reimplement. The pair adds one
> effective dependency root, not two: `google-auth-library` is already a
> transitive dependency of `googleapis`; declaring it directly only makes the
> version we authorize against explicit. The versions are pinned without a caret
> because the evidence is version-specific — these exact versions are the ones
> proven live in the 046 spike and re-proven by the 047 smoke; a range would let
> the adapter drift away from what was actually exercised.

## 3. Supersession record — brief 045's `readManifest`

Merged brief 045 typed `DriveGateway.readManifest` as returning a
`TaskManifest`. Brief 047 retires `readManifest` (and `uploadFolder`) from the
port: the five primitives are one Drive call each, and manifest parsing is a
caller concern (D2).

The replacement path is `readFileContent(fileId): Promise<string>` — raw UTF-8
text — with the ship layer calling `parseManifest` over that string. The
`TaskManifest` contract is not lost; it moves up a layer.

Brief 045 stays **verbatim**. Retroactive edits to historical briefs are out of
scope (`brief.md`, Out of scope); this note is the record of the supersession.

## 4. Watch items carried forward (unchanged, unclaimed)

1. **Cross-user manifest-content gap — explicitly untested.** Reading file
   *content* written by another designer's account under the same OAuth client
   id was never tested, in 046 or here. Nothing in this task claims it works or
   that it fails. The recorded fallback (broad `drive` scope with
   adapter-level containment) is carried as a watch item and is **not
   implemented**. Test it when a second designer account exists, before the
   ship layer's prefix check is built (046 D7 / 047 constraint 5).
2. **Internal-mode refresh longevity — partially evidenced, still open.** See
   Reading 3 above: the day-6 refresh is consistent with Internal but does not
   discriminate it from a 7-day-capped client. Corroborate with an unattended
   run after ~2026-08-04.

## 5. Observations carried forward from this task

1. **Benign secret-sweep hit:** `brief.md:602` matches the sweep because it
   *contains the sweep's own regex literal*. Not a secret.
2. **Benign secret-sweep hit:** `credentials.ts:118` matches `"client_secret"`
   because that is the JSON **field name** the parser reads. No value is
   present, logged, or embedded. This very bullet is now a third hit of the
   same self-referential kind — describing the sweep reproduces its pattern,
   which is the point of item 4 below.
3. **Benign library-grep hits:** the Edit-5 check
   `grep -rn "googleapis\|google-auth-library" packages/adapter-drive/src/`
   also matches two `googleapis.com` scope URLs in `constants.ts` (the closed
   scope pair, D-closed) and three prose comments in Edit-4 files. Only
   `client.ts` and `auth.ts` actually import either library, which is what the
   check meant to assert.
4. **Observation for the future `ship` brief (pattern, not doctrine):**
   structural greps must anchor on `^import` lines, or require a value after
   the colon, or they are unsatisfiable by construction — a bare substring
   sweep matches the constants, comments and the brief's own prose. This bit
   twice in this task (items 2 and 3); recording it as an observed pattern.
5. **The dual-copy `OAuth2Client` trap** — now also `docs/GOTCHAS.md`
   `G-DRIVE-2`. `googleapis-common@8.0.3` pins `google-auth-library` at exactly
   `10.5.0` while `googleapis@173.0.0` asks `^10.2.0`, so the install tree
   carries two copies (`10.9.1` at the root, `10.5.0` nested).
   `OAuth2Client`'s private field makes the two classes nominally
   incompatible, and googleapis' generated signatures demand its own copy.
   Resolved **cast-free** in `client.ts` via
   `export type DriveAuthClient = InstanceType<typeof google.auth.OAuth2>` —
   deriving the type from the value googleapis itself uses.
6. **Accepted A8 exception in `drive-smoke.mjs`** (owner-adjudicated). The
   redacting log sink keeps `let heldPreamble = null` at module scope, which is
   a technical hit on `CLAUDE.md` A8 (no module-level mutable globals in new
   code). Accepted as written rather than wrapped in a closure factory: A8
   targets state management in product code, and this is a throwaway,
   non-product script under `docs/tasks/` with a single linear run, whose sink
   contract (`AuthorizeLog`) takes one plain function. Recorded so a future
   reader sees it was judged, not missed.

## 6. Done criteria not met

None. Every Done-criteria checkbox in `brief.md` was met, including the
behavior checks that required live evidence (`findChild` absence,
`createFolder`, and the `uploadFile` + `readFileContent` round trip).

Two clarifications on how criteria were met, neither a shortfall:

- The brief's Structural check quotes `git diff --name-only main..HEAD` (two
  dots). Local `main` has advanced past this branch's base (`d8426ce`) since
  the task started, so the two-dot form lists unrelated files from those
  commits. The three-dot form `git diff --name-only main...HEAD`, which diffs
  against the merge base, is what was verified at every Pause 3.
- `CLAUDE.md` and `docs/ROADMAP.md` are modified by this task, which the brief
  lists as deferred. Both edits were **explicitly authorized by the owner**
  after the fact — see Edit 10 — precisely because this task made their
  present-tense claims false.
