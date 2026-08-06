# Session recap — 2026-08-06 — 050-mentor-doctrine (Orchestrator)

**Mode:** task modeling via **caminho B** (`docs/AGENT_PLAYBOOK.md` "When NOT to
use the pipeline" — the task rewrites the pipeline's own doctrine). The
Orchestrator authored the brief under the owner's write gate; planner NOT
invoked; `brief-validator` invoked **seven times**; executor invoked once and
driven through Edits 2 to 11 across eleven relayed continuations.
**Consumes:** `main@418da64` — PR #119 (`d0c96b8`, task 049), PR #120
(`330ad29`, the false-P4 correction in the 049 recap) and PR #121 (`418da64`,
the recalibrated brief size guidance). All three merges confirmed by `git log`
at session open.
**Pairs with:** `2026-08-06-executor-050-mentor-doctrine.md` — the execution log
lives there.

## One-line summary

Task 050 shipped on `docs/mentor-doctrine`: the Mentor's doctrine was rewritten
for a lane that lives in Claude Code, and the brief that specified it accrued
fourteen authoring defects, every one surfaced by the executor during the run
rather than after the merge.

## P4 slot evidence — four sources, as the 049 recap required

| Source | Result |
|---|---|
| `ls docs/tasks/` | tops at `049-mentor-vehicle` |
| `git log --oneline main` | tops at `418da64`; #119/#120/#121 merged |
| `grep -nE '^\*\*E[0-9]+' CLAUDE.md` | E1, E2, E3, E5 — no forward slot reserved |
| `git branch -a` + `git worktree list` | **the fourth source, added after 049's collision** |

The fourth source earned its place immediately. Two branches looked like
claims and neither was: `docs/init-six-role-bootstrap` @ `0f93156` holds the
parked `049-init-six-role-bootstrap`, the known 049 collision; and
`claude/saci-mentor-doctrine-brief-a-050b04` has "050" in its name but is
session scaffolding at a detached `b22e304`, whose `docs/tasks/` tops at 049.
**050 free in all four.** Without source four, the second of those would have
cost a manual investigation mid-authoring rather than one at the open.

## Decisions closed with the owner

| # | Decision |
|---|---|
| D1 | The sweep is a full live-surface repair, not the note's literal A2 list. Three documents outside it — `PROCESS_MAP.md`, `GIT_WORKFLOW.md`, `AGENT_PLAYBOOK.md`'s Related-documents table — plus four lines inside `MENTOR_BRIEF.md` outside the named sections |
| D2 | `npm test` leaves the Mentor's read policy; removed, not caveated |
| D3 | M-R13 covers both lanes — the Mentor's two axes plus an explicit clause for operational sessions. One rule, one place |
| D4 | `docs/explorations/README.md` is the SSOT for the disposition set; the skill's §8 becomes a pointer; `close-mentor-session.md` keeps its operational copy |
| D5 | `MENTOR_BRIEF.md` owns behavior, the skill owns mechanics; no new duplication either way |
| D6 | The claude.ai cache-swap ritual dies with chat; two live workflows repaired |
| D7 | Three registration gaps repaired in passing, each on a line already being edited |
| D8 | Nothing here touches the identifier convention — `NNN`, P4 and §7 are brief C's |

Four more were ruled mid-run, as findings arrived: the wrap allowance (E4), the
`gitflow-emergency-recovery.md` heading (E8), the `closer.md` path entering
constraint 1 (E10), and dropping 11c's predicted count rather than correcting it
(E13).

## The fourteen authoring defects

Every one was mine as author. None came from execution. The executor found all
of them by measuring rather than trusting what was in front of it — including
E14, which was not in the brief at all but in a continuation message I wrote.

| # | Defect | Class |
|---|---|---|
| E1 | `grep -c 'six roles'` declared 1, is 2 | count declared without measuring |
| E2 | "four are added" where three are | count declared without measuring |
| E3 | "the two Related-documents hunks", three | count declared without measuring |
| E4 | Constraint 4 silent on line wrapping | ambiguous rule |
| E5 | 6a's "current" quote carried a `, which` the disk does not | wrong source for a quote |
| E6 | Edit 7's cb1 swept `docs/` with no exclusions; 58 hits | verification that cannot prove its claim |
| E7 | Edit 2's `promoted to brief` = 0 falsified by Edit 3c | count valid only at its own moment |
| E8 | 10b's table omitted the heading above the line it changed | surface enumerated from memory |
| E9 | `PROCESS_MAP.md` §12 kept the false R9 claim | surface enumerated from memory |
| E10 | `.claude/agents/closer.md` kept it too, and was out of scope | surface enumerated from memory |
| E11 | 11c's sweep tested co-occurrence, not assertion | verification that cannot prove its claim |
| E12 | 11b replaced a false claim with a different false claim | wrong source: memory, not disk |
| E13 | 11c predicted a count over a set its own Edit changes | count declared without measuring |
| E14 | A relayed instruction said thirteen of seventeen commits were Edits and four were amendments; it is ten and six | count declared without measuring |

Five classes, and **not one of them is length**. Every defect here would have
occurred in a 400-line brief. Five of the fourteen are the same class — a count
declared without measuring — which is why the ledger below treats it as the
finding rather than as five incidents. The session opened asking whether the 350-650
range was calibrated; the run answered a different question.

**E12 is the one worth remembering.** Edit 11 existed to delete two false claims
about `harness/`. Its replacement text introduced a third: I flipped
`pt-BR prose wrapping an English payload` to `English prose wrapping a pt-BR
payload` without measuring, when `harness/` is in fact pt-BR throughout, prose
and payload alike. The flipped version also made the sentence self-contradictory
— `closer.md` *is* English prose wrapping a pt-BR payload, so it cannot invert
that pattern. It reached disk and was caught only because the executor read what
it had just written and did not believe it.

## What the brief proved, and what it nearly did not

The brief carried two claims. Only one had a sweep.

- **"No live document says the Mentor runs in chat."** Proven: Edit 10c returns
  empty.
- **"R9 and the repository agree about COPIAR block language."** Had **no**
  sweep. 10c's pattern matches `claude.ai` and `mentor` near `chat`; both
  surviving contradictions scored 0 against it. A behavior check named §3
  specifically and passed while §12 and `closer.md` contradicted it.

Edit 11 exists because of that gap, and 11c had to stop being a sweep at all:
a correct statement of R9 must name both languages in one sentence, so every
co-occurrence pattern matches correct text, and `CLAUDE.md:50` deliberately
records the historical false claim. The proof became a directed enumeration
with each line classified. **One sweep per goal is the floor; a brief with two
goals and one sweep ships an unproven half.**

## Deviations

- **Seventeen commits against a Commit sequence of eleven.** Seven are brief
  commits — the original plus six mid-run amendments, each followed by a fresh
  validation — and ten are Edit commits, items 2 through 11. The ten Edit
  subjects were used verbatim with zero drift.
- **Edit 11's commit was mine, not the executor's, and that was a slip.** For
  Edits 2 through 10 the owner's go was relayed and the executor committed and
  posted its own evidence-close. For Edit 11 I ran `git commit` directly after
  the go. The evidence-close exists and matched, but in the Orchestrator's turn
  rather than the executor's — so its execution log carries nine, not ten. The
  pattern should not have changed on the last Edit of the run.
- **The brief was amended six times after `Verdict: APPROVED`,** every time as a
  new commit and never an amend, and re-validated every time. Seven APPROVED
  verdicts: `5b5d88a`, `d322877`, `17a254f`, `e052e38`, `dae5a75`, `8207c0a`,
  `f6c8a70`.
- **Seven of the seventeen commits are the Orchestrator's by authorship** — the
  brief and its six amendments. The executor authored the other ten.
- **Category L, far above range.** Measured from git at every brief commit:
  915 → 915 → 930 → 981 → 1073 → 1115 → 1130, i.e. **41% over at authoring and
  74% at close**. Every increment was defect correction; none was prose.
- **No `STATE.md`.** Category L but single-session and docs-only; the path is
  not in constraint 1.
- **`npm test` never ran.** Constraint 3 inverted the green boundary; the
  substitute evidence was `git diff --name-only main..HEAD | grep -c '^packages/'`
  = 0, reported at all ten of the executor's Pause 3s.

## Rule-of-three ledger

- **Brief substance above the Category-L ceiling: 4th consecutive** (047 ~600,
  048 ~430, 049 ~480, 050 ~1130). The 049 recap already called the third
  occurrence a trigger to revisit the ceiling, and PR #121 did revisit it. This
  brief cleared the *new* ceiling by 74% on its first outing. See the handoff
  snippet below — the reformulation should not assume the number is the problem.
- **Declared count that nobody measured: 5 occurrences in one brief** (E1, E2,
  E3, E7, E13), plus one in my own verification during the run. Third-occurrence
  escalation under `AGENT_PLAYBOOK.md` chapter 5 means the rule is not being
  read; it belongs in the session-start checklist, not in a new rule. Candidate
  wording: *a brief declares no count it has not measured against the file at
  the moment of writing, and no count over a set its own Edits change.*
- **Verification that cannot prove what it claims: 2nd and 3rd occurrences**
  (E6, E11), after 049's Edit 4 sweep. Candidate rule: *a brief with more than
  one sweep defines the exclusion set once and references it; a sweep proves an
  assertion only if its pattern can distinguish the assertion from its negation.*
- **Surface enumerated from memory: 3 occurrences** (E8, E9, E10) plus
  `setup-cowork.md` caught pre-execution. Candidate rule: *the in-scope file
  list is derived from a search, and the search is pasted into the brief.*
- **A "current" quote taken from a context copy rather than disk: 1st
  occurrence** (E5). Worth a line in the checklist now rather than waiting for a
  second: the `CLAUDE.md` rendered into an agent's context is not byte-identical
  to the file.
- **Recap transport in a multi-unit session:** unchanged, still pending an owner
  ruling, carried from the 2026-08-04 parallel session. This session was
  single-task, so it did not bite.

## An error that was not the brief's

The executor reported that an alternative regex returned empty. It did not — it
matches `CLAUDE.md:50`. I ran it myself and found the difference, and the
executor corrected itself in its next turn. Recorded because a recap that logs
only the author's mistakes is a worse record than one that logs both, and
because it is the single instance this session where a subagent's verification
claim was wrong. Every other claim it made survived independent re-measurement.

## Pending items (queue)

1. **This session's PR** — unopened. `@closer` Phase A has not run. Push and PR
   are the owner's call, per branch.
2. **`@closer` Phase A** on `docs/mentor-doctrine`. Note that `closer.md` is
   itself inside the diff under review, changed by Edit 11b.
3. **Brief-size reformulation** — a Mentor session, ruled this session to be a
   separate session and not this one. Handoff snippet below.
4. **Brief C (052)** — the identifier cutover, 16 convention files. Order was
   ruled A2 → C and A2 has now shipped, so C is unblocked once this merges.
5. **Brief B (051)** — the 22 ROADMAP entries migrate into notes. Depends on the
   note contract, which Edit 5 shipped.
6. **`049-init-six-role-bootstrap`** — still parked, re-authored after C under
   the dated identifier.
7. **Three notes carry the retired `Status:` header** — `desktop-ui-host.md`,
   `drive-oauth.md` and `mentor-lane-and-task-identity.md` still open with
   "possibilities only, NOT a commitment or spec", the line Edit 5 retired from
   the contract. Two also lack `Disposition:`. The contract applies forward by
   design; a retrofit brief is optional, not required.
8. **The C11 extraction defect** in `.claude/agents/brief-validator.md` — the
   `grep -oE 'ALLOW="[^"]+"'` matching two lines. Unfixed, impact nil, carried
   from 2026-08-04.
9. **The mechanical write deny** — whether skill-level `allowed-tools` can scope
   a restriction to one session. Untested; the skill's section 7 still says so.
10. **G-NODE-2 addendum candidate** — the gotcha does not cover `dist` absent
    entirely, where the glob matches zero files and the suite exits `0`.
    Carried from 049, and this brief's constraint 3 is the workaround in
    practice.
11. Parked, unchanged: local→Jira promotion; manifest `variation` field;
    multi-contributor naming; Jira-born manual overrides; `jira_updated_at`
    nullability. Horizon: `@saci/*` → `@breu/*`; `saci config` write surface.

## Next concrete action

Run `@closer` Phase A on `docs/mentor-doctrine`, read its report, then decide
push and PR. After the merge, brief C (052) is the queue front.

## Paste-ready snippet for the next Orchestrator session

```
Continuando o projeto Saci em sessao Orchestrator (modelo fundido,
docs/AGENT_PLAYBOOK.md capitulo 6).

Modo desta sessao: [autorar Brief C (caminho B) | outro].

Consome: main@<SHA do merge do 050>. Confirma via git log antes de consumir —
esta recap nao pode citar o proprio merge.

Le do disco: CLAUDE.md, docs/PROCESS_MAP.md, docs/MENTOR_BRIEF.md (reescrito
pelo 050), docs/AGENT_PLAYBOOK.md (capitulos 2 e 6), docs/GIT_WORKFLOW.md,
docs/GOTCHAS.md, docs/explorations/README.md (contrato reescrito pelo 050) e
os dois recaps de 2026-08-06.

ATENCAO NO P4: roda as QUATRO fontes. A quarta (git branch -a + git worktree
list) pagou por si no 050 — a branch claude/saci-mentor-doctrine-brief-a-050b04
tem "050" no nome e NAO era reivindicacao de slot.

O 050 entregou a doutrina do Mentor. Brief C (052) e o cutover de
identificador, 16 arquivos de convencao. Brief B (051) migra as 22 entradas do
ROADMAP para notas. A tarefa init-six-role-bootstrap segue parada, reautorada
depois do C.

ANTES DE AUTORAR QUALQUER BRIEF, cinco coisas que o 050 custou caro pra
aprender:
1. Nao declare contagem que voce nao mediu contra o arquivo naquele momento —
   e nunca uma contagem sobre um conjunto que os proprios Edits alteram.
2. Derive a lista de arquivos em escopo de uma BUSCA e cole a busca no brief.
   Enumerar de memoria falhou quatro vezes no 050.
3. Citacao "current" se le do disco, nunca da copia do arquivo no contexto do
   agente — elas divergem.
4. Uma sweep por objetivo. Um brief com dois objetivos e uma sweep entrega
   metade nao provada.
5. Uma sweep so prova uma assercao se o padrao dela distingue a assercao da
   negacao dela. Co-ocorrencia nao distingue.
```

## Handoff snippet for the brief-size Mentor session

The owner ruled that the size guidance gets a complete review, in a Mentor
session and not this one. This is the material that session should start from.
It is evidence, not a conclusion; the note is the Mentor's to write.

```
Sessao Mentor, com topico: revisao completa da orientacao de tamanho de brief
(.claude/skills/brief-template/SKILL.md, secao "Size guidance"). Produz ou
atualiza uma nota em docs/explorations/.

O QUE MOTIVOU: o teto foi recalibrado em 2026-08-04 (PR #121) a partir de 46
briefs medidos, dando 350-650 de substancia pra brief doutrinario caminho B.
O brief seguinte, o 050, fechou em ~1130 — 74% acima — e a sessao que o
produziu levantou evidencia que contraria a premissa da recalibragem.

CINCO DADOS MEDIDOS, todos do 050:

1. Quatro estouros consecutivos: 047 ~600, 048 ~430, 049 ~480, 050 ~1130.

2. NENHUM DOS 11 CHECKS DO VALIDADOR MEDE TAMANHO. O teto nunca travou nada,
   nos quatro estouros. Ele e conselho lido por quem autora, nao gate.

3. O 050 acumulou 13 defeitos de autoria, e NENHUM tem relacao com
   comprimento. Cinco classes: contagem declarada sem medir (5x), superficie
   enumerada de memoria (3x), citacao lida do contexto e nao do disco (2x),
   verificacao que nao prova o que alega (2x), regra ambigua (1x). Todos
   teriam ocorrido num brief de 400 linhas.

4. Composicao do 050: ~280 linhas de texto literal (citacao do estado atual +
   prosa de substituicao + tabelas de reparo) e ~120 de checkbox. Uma passada
   de compressao recuperou 28 linhas antes de comecar a custar fidelidade.
   43% do brief nao comprime sem quebrar a execucao.

5. A substancia cresceu 981 -> 1130 DURANTE o run. Todo o crescimento foi
   correcao de defeito; nenhum foi prosa. Um brief doutrinario cresce ao ser
   executado, e a faixa e medida na autoria.

A PERGUNTA QUE A EVIDENCIA SUGERE, e que nao e a pergunta original:
nao "qual o teto certo", mas "que propriedades um brief precisa ter pra que
os proprios defeitos aparecam durante a execucao em vez de depois do merge".
No 050 apareceram os 13, antes do push, e o mecanismo foi um so: o brief
obrigar a medir, e o executor medir em vez de confiar na checkbox.

TRES SUB-QUESTOES ABERTAS, nenhuma decidida:
- O teto deve ganhar forca mecanica (um C12 no validador)? Isso o tornaria
  capaz de reprovar um brief por comprimento — decisao de doutrina, nao de
  numero.
- A faixa deve indexar por classe de brief, por numero de arquivos em escopo,
  ou por quantidade de texto literal citado? O 050 sugere que o preditor e o
  terceiro.
- Se um brief cresce durante o run por correcao, a medicao vale na autoria ou
  no fechamento? Hoje o brief-template nao diz.

NAO CONFUNDIR ESTA SESSAO COM: modelar a tarefa que implementa a mudanca.
A nota registra decisoes e disposicao; o brief e de uma sessao Orchestrator
(M-R12, M-R15).
```
