# Agent Kit

Kit de inicialização pra orquestrar agentes IA (Claude Chat, Claude
Cowork, Claude Code) em qualquer projeto de software.

> **Premissa:** este kit não te dá documentos prontos. Te dá
> **prompts que fazem o agente gerar os documentos certos pro seu
> projeto específico**. O que você ganha é metodologia + sequência —
> os arquivos finais nascem da sua primeira conversa com o agente.

## Estrutura

```
agent-kit/
├── README.md                  ← este arquivo
├── init/                      ← prompts de inicialização (use 1x por projeto)
│   ├── 01-bootstrap-project.md
│   ├── 02-create-claude-md.md
│   ├── 03-create-mentor-brief.md
│   ├── 04-create-git-workflow.md
│   ├── 05-create-gotchas.md
│   ├── 06-create-agent-playbook.md
│   └── 07-create-brief.md
└── docs/                      ← funciona pra qualquer projeto
    ├── workflows/             ← prompts pra ações recorrentes
    ├── prompts/               ← templates densos
    └── skills-plan/           ← plano de skills
```

## Como usar (primeira vez no projeto)

1. **Copia a pasta `agent-kit/` pra raiz do seu projeto** e renomeia
   pra `docs/` (ou onde quiser que vivam as instruções)
2. **Abre Claude Chat** (claude.ai) — recomendo começar lá, é onde a
   discussão fica melhor
3. **Cola o conteúdo de `init/01-bootstrap-project.md`** no chat
4. **Conversa com o agente** — ele vai entrevistar você sobre o
   projeto e gerar os arquivos canônicos um por um
5. **Salva os arquivos gerados** na raiz do projeto e em `docs/`
6. **Faz primeiro commit** com toda a documentação gerada

A partir daí, você tem o sistema vivo. Workflows ficam em
`docs/workflows/`, briefs futuros em `docs/prompts/`, etc.

## Como usar (em projeto já configurado)

Quando voltar pra projeto que já tem o sistema:

- **Sessão nova de chat:** cola `docs/workflows/setup-chat.md`
- **Sessão nova de Cowork:** cola `docs/workflows/setup-cowork.md`
- **Sessão nova de Code:** cola `docs/workflows/setup-code.md`
- **Tarefa nova:** segue `docs/workflows/start-task.md`

## Documentos canônicos que esse kit gera

Após rodar `init/`, seu projeto terá:

- **`CLAUDE.md`** (raiz) — regras técnicas do projeto
- **`docs/MENTOR_BRIEF.md`** — como agente atua como mentor sênior
- **`docs/GIT_WORKFLOW.md`** — fluxo Git e disciplina de commit
- **`docs/GOTCHAS.md`** — armadilhas conhecidas do stack
- **`docs/AGENT_PLAYBOOK.md`** — metodologia de orquestração

Cada um foi **gerado por entrevista**, não copiado de template.
Por isso reflete seu projeto, não um genérico.

## Princípio do kit

**Documentos vivos > templates estáticos.** Templates envelhecem.
Documentos vivem porque foram criados pro contexto deles.

Esse kit te dá o **processo**. Os artefatos vêm depois.

## Próximos passos quando começar projeto novo

Cola no chat:

```
Estou começando projeto novo. Quero usar o agent-kit pra inicializar
documentação. Lê o arquivo init/01-bootstrap-project.md e segue as
instruções dele.
```

E pronto — o agente conduz a partir daí.
