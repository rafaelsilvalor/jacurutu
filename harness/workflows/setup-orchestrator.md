# Setup: Sessão Orchestrator (Claude Code, Plan mode)

## Quando usar

Abrir sessão **Orchestrator** no Claude Code — a main session do modelo
fundido (`docs/AGENT_PLAYBOOK.md` capítulo 6). Serve pra:

- Modelar tarefa nova (fechar decisões + delegar ao pipeline)
- Autorar brief doutrinário/pipeline-modificador via caminho B
- Dirigir o pipeline (planner → brief-validator → gate → executor)
- Fechar a sessão com recap

Uma tarefa por sessão. Trabalho conceitual (aprendizado, exploração
pré-tarefa, meta-discussão) fica com o Mentor no chat (`setup-chat.md`).

## Pré-requisitos

- Sessão aberta em **Plan mode** (default da sessão; não desative)
- Worktree criada pelo app desktop (a branch `claude/*` é andaime de
  sessão — zero commits nela; ver `docs/GIT_WORKFLOW.md`, "Branch
  Naming")

## --- COPIAR ---

```
Continuando o projeto Saci em sessão Orchestrator (modelo fundido,
docs/AGENT_PLAYBOOK.md capítulo 6).

Modo desta sessão: [modelar tarefa (pipeline) | modelar tarefa —
caminho B (brief doutrinário/pipeline-modificador; Orchestrator
autora, planner NÃO é invocado) | retomar tarefa pausada].

Lê do disco: CLAUDE.md, docs/MENTOR_BRIEF.md, docs/AGENT_PLAYBOOK.md
(capítulos 2 e 6), docs/GIT_WORKFLOW.md, docs/GOTCHAS.md e os recaps
mais recentes em docs/sessions/ (confirma o merge da sessão anterior
via git log antes de consumir).

Regras vigentes nesta sessão:
- Plan mode é o default. Escrita SÓ em docs/, por artefato, via write
  gate: mostrar conteúdo completo → eu aprovo → escrever → read-back
  do disco → confirmar byte-match.
- Código só via @executor. Você nunca edita source.
- Toda invocação de subagent: anuncia em 1 linha antes, resume em 1
  linha depois. Pauses do executor chegam como STOP-and-return em
  bloco único; minhas aprovações voltam como continuation message.
- Prompts de permissão: só "Accept"/"Allow once". "Accept and auto
  mode" e "Always allow" são proibidos.
- Criação de branch só com minha aprovação explícita, a partir de
  base SHA verificado. Push/PR só por instrução explícita minha, por
  branch; nunca main, nunca --force.
- Rulings meus no meio da run viram arquivo
  (docs/tasks/<NNN>-<slug>/notes.md), não paste de chat.
- Recaps Orchestrator + executor commitam na branch da sessão
  (docs(sessions):) e viajam no PR dela.

Antes de propor qualquer coisa: M-R13 em uma linha (quem eu sou +
modo da sessão), depois P4 pro slot do brief (ls docs/tasks/ +
git log --oneline main + reservas em briefs/CLAUDE.md E*).
```

## --- FIM COPIAR ---

## Avisos

- ⚠️ A sessão nunca executa trabalho de subagent inline — se a
  invocação falha, ela falha alto e reporta (fail-loud).
- ⚠️ O agente não enxerga a camada de permissão: afirmações sobre
  prompts terem aparecido (ou não) são só suas. Read-back pós-escrita
  é obrigatório.
- ⚠️ Uma tarefa por sessão; encerrar sem recap deixa a próxima sessão
  sem ponto de retomada.

## Próximo passo após setup

- **Modelar tarefa (pipeline)** → fecha as decisões com o agente, uma
  por vez; delega ao planner
- **Caminho B** → brief via write gate; depois @executor direto
- **Encerrar** → recap do Orchestrator via write gate, commit
  `docs(sessions):` na branch da sessão; push/PR só por sua instrução
