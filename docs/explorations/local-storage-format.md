# Local storage format

Status: exploration — no implementation mandate
Disposition: open — 2026-08-06
Origin: migrated from `docs/ROADMAP.md` Pending decisions #9 by brief 051
(2026-08-06); entry text preserved verbatim. Extended 2026-08-19 from an
exploration session on Jira credential storage.
Roadmap link: migrated from ROADMAP Pending decisions #9 — 2026-08-06

9. **Local storage format.** On-disk layout for the two data
   categories (Jira mirror — overwritable; production state — never
   overwritten by fetch). SQLite, JSON files per task, or a hybrid.
   Decided at Phase 3 start.

## 1. What is actually in the directory today

Measured 2026-08-19. Four files, and the entry above names two categories:

| File | Category | Written by | What losing it costs |
|---|---|---|---|
| `identity.json` | production state | hand-seeded; `jacurutu config` later (`JAC-5`) | designer prefix + `nextSeq` gone → **key collisions**, not recreatable from anywhere |
| `report.json` | production state | the app, on first `jacurutu report` | the shared spreadsheet link goes stale and a second sheet is created; the old one is orphaned, not recreatable |
| `oauth_client.json` | **credential** | hand-placed from the Google Cloud console | re-download from the console |
| `token.json` | **credential** | the app, from the OAuth consent flow | re-consent in a browser |

**There are three categories in that directory, not two.** The entry above names
the Jira mirror and production state. Credentials are neither: losing them
destroys no work, and they are not derived from Jira. They also carry a hygiene
contract the other two do not — never committed, never logged, and mode-bound at
creation (`CREDENTIALS_DIR_MODE = 0o700`, `TOKEN_FILE_MODE = 0o600` in
`packages/adapter-drive/src/credentials.ts`), which is a real distinction already
implemented in code and nowhere stated as a rule about the directory.

The mirror, the fourth thing, **has no file yet.** Nothing writes it. That is
what keeps the original question open.

## 2. What the three categories imply, that two did not

The categories differ on more than overwrite policy, and each difference is a
concrete instruction that the two-category framing cannot express:

| | Jira mirror | Production state | Credentials |
|---|---|---|---|
| Overwritten by `fetch` | every run | never | never |
| Recreatable | yes, from Jira | **no** | yes, from Google / Atlassian |
| Should be backed up | no — regenerable, and stale backups mislead | **yes** — it is the only copy | **no** — copying a secret spreads it |
| Should be synced between machines | no | maybe (`JAC-18`, shared backend) | **never** |
| File mode matters | no | no | yes (`0600` / `0700`) |
| Safe to delete to fix a problem | yes, always | no | yes — costs a re-auth |

The backup row is the one that bites. If a designer is ever told "back up
`~/.jacurutu/`", that instruction is simultaneously right for two files, useless
for one, and a security regression for two others. A single flat directory cannot
carry three different answers to "should I copy this?".

## 3. The trigger, and why this note moved today

[[jira-credentials]] proposes reading Jira credentials from a file under this
same directory. **That is the third credential file**, and it is what turns the
flat layout from a tolerable simplification into a rule that is missing:

- Three credential files (`oauth_client.json`, `token.json`, + Jira's) against
  two state files, with nothing in the name or the location saying which is
  which. `A3` says wait for the third use; for credentials, the third use is the
  moment that card lands.
- The naming gives no help. `report.json` and `token.json` are the same shape of
  name for opposite categories.
- The directory root is composed in **three** places today —
  `resolveIdentityFilePath` and `resolveReportStatePath` in
  `packages/cli/src/cli.ts:82-98`, and `defaultCredentialPaths` in
  `packages/adapter-drive/src/credentials.ts` — each independently joining
  `os.homedir()` with the `.jacurutu` leaf. A fourth is one card away.
- The override surface is already inconsistent: `identity.json` has
  `JACURUTU_IDENTITY_FILE`, `report.json` has nothing, Drive's credentials have
  nothing. Adding a per-file override for Jira's credentials would make three
  conventions for four files.

**`JAC-1` owns this, and was amended rather than duplicated.** It is the card
that carries the mirror-versus-state split and sits in `Wave: Next`. Widening its
body was the right move over opening a fourth card, which would have been the
duplicate `dev-queue-board.md` asks us to check for.

Done on 2026-08-20 and verified by JQL: the card now names three categories and
says the format has to declare which one a file belongs to, its title changed
from "duas categorias locais" to `Separar espelho, estado de produção e
credenciais no disco local` — the old one asserted a count that had stopped being
true — and its done-criteria block names the three questions a brief has to answer
beyond the format: which category each file belongs to and how that is visible,
whether the mirror shares a backup unit with production state, and whether the
env overrides stay one-per-file or become a single root. `Source`, `Wave` and its
three `Blocks` links were left untouched.

## 4. Two shapes, neither decided

Recorded so the decision starts from options rather than from zero. A note does
not decide this.

**Shape 1 — subdirectories.**

```
~/.jacurutu/
  credentials/   0700   oauth_client.json, token.json, jira.json
  state/                identity.json, report.json
  cache/                the Jira mirror (JAC-1) — regenerable, deletable
```

Backup guidance becomes one sentence per directory. `0700` binds on one
directory instead of per file. "Delete `cache/` and re-fetch" becomes safe
advice. Cost: a migration for every machine already set up — the owner's, plus
any designer from the 3+ that `JAC-5` assumes — and a migration for four files
on one machine is a lot of machinery for a small gain.

**Shape 2 — flat, with a naming convention.**

Credentials carry a prefix (`cred-token.json`, `cred-oauth-client.json`,
`cred-jira.json`); everything else does not. Zero migration for the state files,
one rename for two credential files, and no new path composition. Cost: the
convention is enforced by nothing, and a flat directory still cannot hold the
regenerable mirror without inviting someone to back it up.

**One thing worth closing regardless of shape:** the mirror does not belong in
the same directory as production state *if the directory is the backup unit*.
That is a constraint the original entry never stated and it survives either
choice — put the mirror somewhere a person can delete without reading
documentation first.

**One cheap simplification, independent of both:** one `JACURUTU_HOME` override
replacing the growing per-file env vars. `JACURUTU_IDENTITY_FILE` exists because
brief 036 needed testability for one file; four files with four overrides is the
wrong end state, and one root override is strictly more useful (it is also what
makes a second instance on one machine testable at all). Whether
`JACURUTU_IDENTITY_FILE` stays as a narrower override on top is a compatibility
question, not a design one.

## 5. What is still open, unchanged

The original question — SQLite, JSON per task, or hybrid — is **untouched** by
any of the above. Nothing here chooses a serialization format; it only says that
the mirror and production state should not share a backup unit, whatever format
each ends up in. `JAC-1`'s own note already fixes the durability requirement
("issues are recreatable from Jira, active tasks from their Drive manifests"),
which is the constraint a format has to satisfy.

Related: [[jira-credentials]] (the trigger), [[task-manifest-format]] (the
Phase 3 serialization half of the adjacent decision), [[drive-oauth]] §10
(the binding credential-hygiene rules this note's credential category inherits),
[[central-catalog]] and the shared-backend card `JAC-18` (where production state
goes when it stops being local-only).

## Changelog

- 2026-08-06 — migrated from the ROADMAP Pending decisions #9 by brief 051;
  disposition set to `open`.
- 2026-08-19 — extended from an exploration session on Jira credential storage.
  The four files in `~/.jacurutu/` were classified and the entry's two categories
  measured as **three**: credentials are neither the mirror nor production state,
  and differ from both on backup, sync and file mode. The trigger was recorded —
  [[jira-credentials]] adds the third credential file, which is `A3`'s third use.
  Two layouts and one `JAC-1` body amendment proposed, none decided; the three
  independent compositions of the directory root and the inconsistent env-override
  surface recorded as evidence. The original SQLite/JSON question is untouched, so
  the disposition stays `open`.
- 2026-08-20 — the owner ratified the third category and `JAC-1` was amended to
  carry it: three categories in the body, a title that no longer asserts two, and
  three questions named in its done-criteria block. §3 records what landed instead
  of what was proposed. The disposition stays `open` — the amendment moved the
  card, not the SQLite-or-JSON decision this note is about.
