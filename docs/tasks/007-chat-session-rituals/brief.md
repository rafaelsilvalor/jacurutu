# Brief: Chat session lifecycle rituals (M-R13, M-R14, close-chat-session workflow)

> **Category:** M
> **Plan required:** no — see "Why Pause 1 is skipped" below
> **Branch:** `docs/chat-session-rituals`
>
> Paste this brief into the executor agent (Claude Code or Cowork)
> at task start.

---

## Context

`MENTOR_BRIEF.md` currently defines M-R1 through M-R12, covering style,
tone, and role separation between mentor (chat) and executor (Code/Cowork).
What is missing is the **lifecycle of a chat session**: how the mentor
opens (which §8 mode is active), and how the mentor closes (a recap that
survives into the next session).

The `harness/workflows/` catalog has `pause-task.md` and
`close-task.md` for code tasks but no equivalent for chat sessions
themselves. This task adds the two rules and the companion workflow.

## Goal

1. Append **M-R13** ("Confirm session mode before acting") and **M-R14**
   ("Session-close ritual") to `docs/MENTOR_BRIEF.md`.
2. Create `harness/workflows/close-chat-session.md`, mirroring
   the pattern of `pause-task.md` / `close-task.md`.
3. Index the new workflow in `harness/workflows/README.md`
   under the "Continuidade" section.

## Constraints

### Non-negotiable constraints

1. Do not modify M-R1 through M-R12 — append only.
2. `MENTOR_BRIEF.md` stays in English (M-R10). The new workflow follows
   the existing catalog pattern (Portuguese prose with English commands).
3. Follow all rules in `CLAUDE.md` and the full Git workflow in
   `docs/GIT_WORKFLOW.md` (new branch, Conventional Commits, commit
   freely, do not push, STATE.md at session end).
4. Only the following files may be touched:
   - `docs/MENTOR_BRIEF.md`
   - `harness/workflows/close-chat-session.md` (new)
   - `harness/workflows/README.md`
   If anything else needs changing, STOP and ask.

### Architectural decisions already made (do not revisit)

Closed in the design session (chat, 2026-05-12). Executor implements;
does not propose alternatives.

- **D1 — Two new rules, not more.** Other candidates (M-R15
  brief-self-update, M-R16 doc-conflict protocol) deferred until
  concrete pain emerges.
- **D2 — 13/14 exceeds the 8-12 ceiling from `init/03-create-mentor-brief.md`.**
  Conscious exception. Add a one-line note above M-R13 stating this.
- **D3 — Recap is always saved to `docs/sessions/YYYY-MM-DD-<slug>.md`.**
  No ephemeral mode. Slug is proposed by the mentor based on session
  topic; user may override.
- **D4 — Delivery: hybrid.** Mentor produces the recap as a
  copy-ready markdown block (default). Append an optional snippet for
  Code/Cowork users who want to automate saving.
- **D5 — Hybrid session protocol: sequential.** When a code task is
  active AND a chat session is closing, run `pause-task.md` FIRST
  (preserves code state), then `close-chat-session.md` (preserves
  meta). The new workflow's "Pré-requisitos" section must state this.
- **D6 — M-R14 trigger: hybrid.** Mentor proactively suggests the
  ritual when it detects ANY of:
    - explicit farewell ("tchau", "vou fechar", "até depois")
    - structural closure ("acho que era isso", "decidi", "ok, fechado")
    - topic shift away from the project
  Mentor asks "Vale rodar o ritual de encerramento agora?" and
  proceeds only with confirmation. Explicit user invocation
  ("encerrar sessão") bypasses the question.

## Pontos de pausa

- **Pausa 1 (plan before code):** **skipped** — see "Why Pause 1 is
  skipped" below.
- **Pausa 2 (after first modified file):** mandatory. Show the
  resulting `MENTOR_BRIEF.md` diff after M-R13 + M-R14 are added,
  before touching the workflow files.
- **Pausa 3 (before each commit):** mandatory. Show `git status` +
  `git diff --stat` + proposed message. Three commits expected (see
  suggested sequence below).

## Why Pause 1 is skipped

This brief specifies the exact text drafts for both rules, the exact
file paths, and the exact ordering. The executor has nothing
structural to invent. Pause 2 catches wording deviation; Pause 3
catches commit-level mistakes.

## Suggested content (drafts — refine wording, preserve meaning)

### Note above M-R13

> Note: M-R13 and M-R14 exceed the 8-12 guideline from
> `init/03-create-mentor-brief.md`. Conscious exception — session
> lifecycle rituals do not compress cleanly into the existing 12
> style/role rules.

### M-R13

> **M-R13 — Confirm session mode before substantive action.** Before
> any non-trivial response, declare in one line: (a) who the user is
> according to `MENTOR_BRIEF.md`, and (b) which of the five modes in
> §8 is active — mentoring, modeling a task, reviewing a plan, code
> review, or continuing. If ambiguous from the user's opening message,
> ask. This catches the most common chat failure: mentor enters
> "modeling" when the user wanted "review".

### M-R14

> **M-R14 — Session-close ritual.** When the user signals the end of
> a session — either explicitly ("encerrar", "fechar sessão") or via
> detected signals (farewell, structural closure, topic shift) with
> user confirmation — run the `close-chat-session.md` workflow.
> Produce a recap covering: decisions taken (with target file for each
> decision), open pending items, artifacts generated, concrete next
> action, and a paste-ready snippet for the next session. Default
> save path: `docs/sessions/YYYY-MM-DD-<slug>.md`. The mentor produces
> the content; the user or an executor writes the file (`CLAUDE.md`
> R17 still applies — never push proactively).

### `close-chat-session.md` — required structure

Mirror `pause-task.md` / `close-task.md`. Required sections:

1. **# Workflow: Close Chat Session**
2. **## Quando usar** — chat session ending in any §8 mode.
3. **## Pré-requisitos** — none for chat-only. **If hybrid session
   (code task active), run `pause-task.md` first** (D5). Make this
   prominent.
4. **## --- COPIAR ---** block with these steps:
    - PASSO 1 — Identify session mode (§8 do MENTOR_BRIEF).
    - PASSO 2 — Compile recap with five fields:
      `### Decisões tomadas` (each with → atualizar em: target file),
      `### Pendências abertas`,
      `### Artefatos gerados`,
      `### Próxima ação concreta`,
      `### Snippet pra colar na próxima sessão`.
    - PASSO 3 — Propose slug for the recap file based on session
      topic. Default save path: `docs/sessions/YYYY-MM-DD-<slug>.md`.
    - PASSO 4 — Deliver content as a copy-ready markdown block (D4
      default). Append an optional snippet that an executor
      (Code/Cowork) could use to create the file automatically.
    - PASSO 5 — List "vale commitar agora?" candidates: STATE.md,
      MENTOR_BRIEF.md (new pattern/rule?), GOTCHAS.md, CLAUDE.md,
      task brief. Do NOT commit — list only.
5. **## Trigger (M-R14)** — short paragraph stating D6 (hybrid trigger).
6. **## Princípio em jogo** — one-line: "session ends only when
   retomable".
7. **## Próximo workflow** — typically `resume-session.md` next time.

### `workflows/README.md` — catalog update

Under the existing "### Continuidade" heading, add:

```
- **`close-chat-session.md`** — encerrar sessão de chat (mentoria,
  modelar tarefa, revisar plano, code review) com recap salvo em
  docs/sessions/
```

Order: place above `resume-session.md` (natural lifecycle: close
before resume).

## Documentos de referência (leia antes de começar)

- `CLAUDE.md` — R9 (English on dev surface), R17 (no proactive push)
- `docs/MENTOR_BRIEF.md` — current M-R1 through M-R12, §7, §8
- `docs/GIT_WORKFLOW.md` — Conventional Commits, branch naming
- `harness/workflows/pause-task.md` — pattern reference
- `harness/workflows/close-task.md` — pattern reference
- `harness/workflows/README.md` — catalog to update

## Suggested commit sequence

1. `docs(mentor-brief): add M-R13 and M-R14 for session lifecycle`
2. `docs(workflows): add close-chat-session workflow`
3. `docs(workflows): catalog close-chat-session in README`

Executor may compress (2) and (3) into one commit if preferred. Keep
(1) separate — different document, different review surface.

## Critério de pronto

### Verificações automáticas

- N/A — this task is documentation-only. No build, no lint, no test.
  Markdown syntax must remain valid (visual check in Pausa 2).

### Verificações estruturais

- [ ] `MENTOR_BRIEF.md` contains M-R13 and M-R14 with wording
  matching the drafts (modulo executor wording refinement)
- [ ] One-line exception note added above M-R13 (per D2)
- [ ] `harness/workflows/close-chat-session.md` exists with
  all 7 required sections
- [ ] `close-chat-session.md` Pré-requisitos section explicitly
  states the sequential hybrid protocol (D5)
- [ ] `close-chat-session.md` PASSO 4 reflects hybrid delivery (D4)
- [ ] `close-chat-session.md` contains a Trigger section reflecting
  D6 (hybrid trigger)
- [ ] `harness/workflows/README.md` lists
  `close-chat-session.md` under "Continuidade", above `resume-session.md`

### Verificações de comportamento

- [ ] Sanity read: a fresh chat session reading the updated
  `MENTOR_BRIEF.md` would produce the recap structure described in
  D3 (no automated test possible)

### Verificações de processo

- [ ] Pausa 2 honored — diff of `MENTOR_BRIEF.md` shown before
  touching workflow files
- [ ] Pausa 3 honored — `git status` + `git diff --stat` + proposed
  message shown before each of the three commits
- [ ] All commits follow Conventional Commits

### Post-merge follow-up (not blocking the merge)

- [ ] Re-upload `MENTOR_BRIEF.md` and `workflows/README.md` to the
  Claude.ai project knowledge so subsequent chat sessions read the
  new rules. Optional but recommended same day.
