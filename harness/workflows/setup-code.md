# Setup: Claude Code

## Quando usar

Iniciar sessão nova em **Claude Code** — geralmente pra:

- Implementar tarefa de código (feature, fix, refactor)
- Refatoração estrutural
- Debug com modificação de arquivos
- Operações Git complexas

Claude Code é o **executor padrão** pra trabalho de código.

## Pré-requisitos

- Claude Code instalado
- Está no diretório do projeto (`cd /path/to/projeto`)
- Projeto tem documentação canônica

---

## --- COPIAR ---

```
Estou começando sessão em Claude Code no projeto [NOME].

PASSO 1 — Leitura obrigatória dos arquivos canônicos:
- CLAUDE.md (regras de código)
- docs/GIT_WORKFLOW.md (disciplina Git)
- docs/GOTCHAS.md (armadilhas conhecidas)

PASSO 2 — Pre-flight:
git status
git branch
git log --oneline -5
git fetch origin

Se houver STATE.md na raiz, lê e reporta status da tarefa em
andamento.

PASSO 3 — Reporta em uma frase:
- Branch atual
- Último commit
- Há trabalho em andamento (STATE.md)?
- Working tree clean?

PASSO 4 — Aguarda:
- Não toca em arquivo nenhum
- Não roda comando que modifica estado
- Aguarda minha instrução específica

Padrões obrigatórios desta sessão:
1. Apresenta plano numerado antes de qualquer mudança em código
2. Pausa 3 antes de cada commit (mostra git status + git diff
   --stat + mensagem proposta, aguarda autorização)
3. NÃO faz git push sem minha autorização explícita
4. Mensagens de commit seguem Conventional Commits
5. Mensagens de commit incluem trailer
   "Co-authored-by: Claude <noreply@anthropic.com>"
```

## --- FIM COPIAR ---

## Configurações úteis do Claude Code

### Plan mode

Plan mode ativa pra tarefas grandes. Útil pra você ver os passos
antes de execução. Atalhos:

- `Shift + Tab` alterna entre modos
- Procurar opção "approve plan" quando aparecer

### Permission mode

Configurações de auto-approve. Recomendação:

- **Default (recomended)** pra projetos importantes — pede
  confirmação em ações destrutivas
- **Auto-approve** só em projetos exploratórios/throwaway

### Skip permissions

Existe flag pra rodar Claude Code sem pedir confirmação. **Não
recomendo** pra projetos reais — perde a Pausa 3 que protege contra
commits indesejados.

## Cuidados específicos

- ⚠️ **Claude Code pode "trabalhar em segundo plano"** mesmo
  parecendo travado. Sempre verifica `git log` antes de assumir
  que parou.
- ⚠️ **Plan mode pode prender o agente** esperando aprovação. Se
  travou, tenta `Shift + Tab` ou cola "aprovo o plano".
- ⚠️ **Sessões longas degradam.** Pra trabalho > 4h, considera
  pausar (`pause-task.md`) e retomar (`resume-session.md`) em
  sessão fresca.

## Próximo passo após setup

Cola o workflow específico:

- **Tarefa nova** → `start-task.md`
- **Continuar tarefa** → `resume-session.md`
- **Antes de mexer em algo** → `task-pre-flight.md`
- **Travou** → `recover-stuck-agent.md`

## ❓ PERGUNTAS PRA REVISÃO FUTURA

- A regra de Co-authored-by deveria ser configurada via
  `.git/config` em vez de exigir do agente toda vez?
- Vale documentar mais opções de configuração do Claude Code
  (model selection, context limits, etc.)?
