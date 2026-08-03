# Session recap — 2026-08-03 — Desktop UI host exploration (Mentor)

**Mode:** opened as mentoring (feasibility evaluation), switched mid-session
to **exploring possibilities** on owner instruction. No brief authored, no
slot consumed.
**Consumes:** `docs/sessions/2026-08-02-orchestrator-048-closer-agent.md`
and PR #108 at `main@69cf6e7` (merge recorded in that recap itself, per the
D5 duty; not re-confirmed this session — this was a chat session with no
`git` access). Whether the follow-up branch
`docs/closer-suppression-section` has landed since is **unconfirmed**.
**Slot state:** next free slot is **049**. 047-adapter-drive is
mid-execution on the unmerged branch `feat/adapter-drive` and holds its
slot; 048 shipped. Per the P4 gap logged at 048, the three canonical
sources do not see slot claims that live only on an unmerged branch.

## One-line summary

The owner asked whether a UI that opens in the browser but executes work on
the machine is feasible for Saci; the answer is yes, as a driving adapter
that costs nothing today — and the session's output is an exploration note
recording the browser-served versus Electron comparison, the
localhost-exposure trap, and seven open questions, with no decision taken.

## Findings recorded (no mandate)

All of the below lives in `docs/explorations/desktop-ui-host.md`. It is an
exploration note: lowest authority, no implementation mandate.

1. **Premise correction.** Insomnia is a packaged Electron application, not
   an instance of the pattern the owner described. The pattern is **local
   server plus browser front end** (Jupyter): a Node process holds all OS
   access, the browser is a rendering surface only.
2. **The architecture already leaves the door open.** A browser-served UI is
   a driving adapter — a new package exposing the same `core` and the same
   driven adapters over HTTP (R25). Adding it later costs nothing today, so
   no preparatory work is justified on "keep the option open" grounds. Open
   sub-question: reuse the `cli` composition root, or give the server its
   own.
3. **The deciding axis is launch, not architecture.** On OS-access boundary,
   artifact weight, and hexagonal fit the browser model is ahead or level.
   It loses on the thing that matters most for the target audience: a
   non-technical designer cannot be asked to start a server and open a URL.
   Electron's double-click is its whole case.
4. **Correction to this session's own first evaluation.** The mentor
   initially claimed the browser model gets its security boundary "for
   free". Half right: the front end genuinely cannot touch the OS, but a
   listening socket on `localhost` is reachable by **any page open in that
   browser** and by any local process. Local authentication (token in the
   launch URL, `Origin`/`Host` validation, bind to `127.0.0.1`) is
   therefore mandatory, not optional hardening — a different cost from
   Electron's, not a smaller one. Electron opens no listening socket, so it
   carries no equivalent concern.
5. **Seven open questions** recorded for the future spike: packaging and
   launch for non-devs (the deciding axis, same question as ROADMAP pending
   decision #2), port allocation, local authentication shape, process
   lifecycle, progress feedback for long uploads (`ship`) forcing
   SSE/WebSocket into the adapter contract, filesystem path selection (the
   browser cannot hand real paths to the server, so a served path browser
   would be required), and two unevaluated paths (TUI; CLI plus a thin
   native wrapper).
6. **Doctrine touchpoint.** "Electron host" is recorded as a **closed**
   decision in two places, not one: `MENTOR_BRIEF.md` §2 ("CLI-first,
   desktop-later") and the ROADMAP Phase 3 packaging item. ROADMAP Phase 5
   is sketch-only. The note observes this; it has no authority to change
   it.

## Owner rulings this session

| Ruling | Target |
|---|---|
| Mode switched to exploring possibilities to consolidate the evaluation | this session |
| Note scope approved as proposed; filename `desktop-ui-host.md` | `docs/explorations/desktop-ui-host.md` |
| Mentor authors the byte-exact file; owner pre-saves (reaffirming the 2026-07-27 ruling for exploration-note artifacts) | caminho B |
| Session closed with a recap so the note's `Origin` pointer resolves; both files ride the same PR | this recap |

No product decision was taken. Exploring possibilities produces no mandate
by contract.

## Mentor errors caught by the owner

Three, all one failure mode — asserting state instead of grounding it.
Recorded because the discipline is already logged and kept recurring.

1. **Invented date.** The note was authored dated `2026-07-29`, inferred
   from the previous recap being 2026-07-27 rather than read from the actual
   current date (2026-08-03). Corrected in the delivered file.
2. **Dangling pointer.** The note's `Origin` cited a mentor session with no
   artifact on disk, unlike `drive-oauth.md` whose Origin resolves to a real
   recap. Resolved by producing this recap in the same PR. **Rule
   extracted:** an exploration note whose `Origin` cites a mentor session
   must ship with that session's recap, or carry a self-contained `Origin`.
3. **Stale state in the first draft of this recap.** It described slot 046
   as free, the adapter-drive spike as the queue front, and the explorations
   bootstrap merge as unconfirmed — all true on 2026-07-27 and all false on
   2026-08-03. The project-knowledge cache was current; the mentor had read
   a narrow slice of it (doctrine plus the explorations folder) and wrote
   state from that slice instead of searching for the newest recap first.
   **Rule extracted:** in a chat session, "read the state" means locating
   the most recent recap and the highest task slot before writing any
   state-bearing line — the cache being current is not the same as having
   read it.

## Artifacts generated

- `docs/explorations/desktop-ui-host.md` — second occupant of the
  explorations folder (the first, `drive-oauth.md`, carries a promotion
  status line to brief 046). Authored byte-exact by the mentor, delivered
  for owner pre-save.
- This recap.
- An Orchestrator caminho B snippet, delivered in chat and reissued twice:
  once for two files and two commits, once again to route the pre-push step
  through the `closer` (Phase A) now that the sixth role exists.

## Pending items (queue)

Items 3 onward are inherited from the 048 recap and are not this session's
work; they are carried so this recap is a usable entry point.

1. **This session's PR** — owner pre-saves both files; Orchestrator verifies
   on disk, commits two under Pause 3; `closer` Phase A before push; PR on
   owner instruction; owner squash-merges. Docs-only diff, so it will not
   exercise the closer's checks (a) and (b) — see item 4.
2. **Owner rulings pending from this session's findings**, both out of
   scope for this PR:
   - reclassify "Electron host" from closed to open/to-revisit in
     `MENTOR_BRIEF.md` §2 **and** the ROADMAP Phase 3 packaging item;
   - decide whether ROADMAP pending decision #2 gains a one-line pointer to
     `docs/explorations/desktop-ui-host.md`, per the ROADMAP update
     protocol.
3. **Queue front: 047-adapter-drive**, mid-execution on `feat/adapter-drive`
   (3 of 6 modules). Includes the OAuth token file mode in
   `packages/adapter-drive/src/credentials.ts` (`writeStoredToken` writes a
   refresh token with the default file mode), best folded into 047's
   remaining edits.
4. **Closer checks (a) and (b) never executed by the agent** — the first
   real test is a branch touching `packages/**`: 047 when it closes, or the
   `ship` MVP. The five-finding ceiling is also unexercised.
5. **Follow-up branch `docs/closer-suppression-section`** — carries the
   formalized "Examinado e não reportado" section and the 048 first-run
   record. Confirm whether it landed before consuming.
6. **`ship` MVP brief** — unblocked by the 046 spike; behind 047 in the
   queue. Payload: D1–D6 from the 2026-07-27 mentor recap plus
   `docs/tasks/046-spike-adapter-drive/notes.md` watch items as Constraints.
7. **Playbook recap-policy reconciliation** (rule-of-three met at 046) and
   **F3** (AGENT_PLAYBOOK still says the brief-validator runs 10 checks; it
   is 11 since C11).
8. Parked, unchanged: local→Jira promotion (known common demand); manifest
   `variation` field; multi-contributor naming; Jira-born manual overrides;
   `jira_updated_at` nullability. Horizon: `@saci/*` → `@breu/*` rename;
   `saci config` write surface.

## Next concrete action

Owner pre-saves `docs/explorations/desktop-ui-host.md` and this recap. An
Orchestrator session verifies both on disk under the docs write gate,
commits two (note, then recap) under Pause 3, runs `closer` Phase A, and
opens the PR on owner instruction. Then the queue returns to 047.

## Next-session starter

```
Olá. Estou continuando o projeto Saci.

Tipo de sessão: continuar um fio conceitual

Carrega os arquivos correspondentes na tabela §8 do MENTOR_BRIEF.md, mais o recap
2026-08-03 (desktop UI host).

Antes de qualquer afirmação sobre estado: localiza o recap mais recente em
docs/sessions/ e o maior slot em docs/tasks/. Em 2026-08-03 o estado era 048
mergeado (#108 / 69cf6e7), 047-adapter-drive em execução em branch não mergeado,
próximo slot livre 049.

Onde paramos: o PR da nota `desktop-ui-host.md` + recap foi aberto.

Pendência conceitual desta linha: item 2 do recap — reclassificar "Electron host"
de fechada para em aberto no MENTOR_BRIEF §2 e no item de packaging da Fase 3 do
ROADMAP, e decidir o ponteiro no pending decision #2.
```
