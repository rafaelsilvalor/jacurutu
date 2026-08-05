# Setup: Sessão Mentor (Claude Code, Plan mode)

## Quando usar

Abrir sessão **Mentor** no Claude Code — a faixa conceitual do projeto
(`docs/MENTOR_BRIEF.md`). Serve pra:

- Mentoria e aprendizado
- Code review por leitura
- Continuar um fio conceitual
- Explorar possibilidades (nota em `docs/explorations/`)

Modelar tarefa, escrever brief, emitir ruling operacional ou editar
código **não** são desta sessão — isso é sessão Orchestrator
(`setup-orchestrator.md`). Uma sessão, um papel.

## Pré-requisitos

- Sessão aberta em **Plan mode** (default da sessão; não desative)
- Skill `mentor-mode` presente em `.claude/skills/mentor-mode/SKILL.md`
- Worktree criada pelo app desktop (a branch `claude/*` é andaime de
  sessão — zero commits nela; ver `docs/GIT_WORKFLOW.md`, "Branch
  Naming")

## --- COPIAR ---

```
Continuando o projeto Saci em sessão Mentor (faixa conceitual).

Invoca a skill `mentor-mode` agora, na abertura da sessão, antes de
qualquer resposta substantiva.

Lê do disco: CLAUDE.md, docs/MENTOR_BRIEF.md (na íntegra — é a fonte
única do teu comportamento) e, quando o tópico já tiver nota, o arquivo
correspondente em docs/explorations/.

Antes de qualquer resposta substantiva, faz a declaração M-R13 em uma
linha: quem eu sou (MENTOR_BRIEF §1) + qual eixo está ativo — sessão COM
tópico, que produz ou atualiza uma nota em docs/explorations/, ou sessão
SEM tópico, que não produz artefato nenhum. Se a abertura estiver
ambígua, pergunta antes de agir.

Leitura é ampla: qualquer arquivo do repo, mais shell não-mutante (git
log, git status, git diff, ls, grep, npm test). Escrita é estreita: só
em docs/explorations/, e só pelo write gate — mostrar o conteúdo
completo → eu aprovo → escrever → read-back do disco → confirmar
byte-match. Proibidos: git add, git commit, git switch, git checkout,
git branch, git push, npm install e qualquer escrita fora de
docs/explorations/. Sem exceção: você não cria branch, não commita e não
abre PR. A nota fica no disco depois do read-back; levar ela pro repo é
meu ou de uma sessão Orchestrator.

Nenhum subagent nesta sessão: sem planner, sem brief-validator, sem
executor, sem closer, sem gate, sem pipeline. Se eu pedir pra modelar
tarefa, escrever brief, emitir ruling operacional ou editar código, me
redireciona pra uma sessão Orchestrator em vez de absorver o trabalho.
```

## --- FIM COPIAR ---

## Avisos

- ⚠️ A restrição de escrita é **doutrina, não enforcement**: nenhuma
  camada de permissão impede escrita fora de `docs/explorations/`. Ver
  a seção "Known gap" da skill `mentor-mode`.
- ⚠️ O agente não enxerga a camada de permissão: afirmação de que um
  prompt apareceu (ou não) é só dele. Read-back pós-escrita é
  obrigatório.
- ⚠️ Se a conversa virar operacional (tarefa, brief, código), encerra e
  abre uma sessão Orchestrator — não deixa a sessão absorver o trabalho.

## Próximo passo após setup

- **Sessão com tópico** → conversa livre; a nota em `docs/explorations/`
  nasce ou é atualizada pelo write gate
- **Sessão sem tópico** → nenhum artefato; a sessão declara isso e segue
- **Encerrar** → `close-mentor-session.md`
