# Harness

Harness de orquestração — meta-tooling para trabalhar com agentes IA neste projeto (Claude Chat, Cowork, Code). Não é scaffolding programático; é doutrina, workflows e prompts.

> **Premissa:** o harness é o scaffolding de orquestração permanente
> deste repositório — workflows, prompts e doutrina pra trabalhar
> com agentes IA no Saci. O caso de uso primário é operar o projeto
> dia a dia; o bootstrap em projeto novo (seção secundária abaixo)
> reaproveita os mesmos artefatos como ponto de partida.

## Estrutura

```
harness/
├── README.md
├── init/
├── workflows/
└── skills-plan/
```

> **Nota:** `harness/prompts/` foi removido em 2026-05-23 (brief 015).
> Continha `task-brief-template.md` (superseded por
> `.claude/skills/brief-template/SKILL.md` desde brief 013) e seu
> README local. Sem outros artefatos, o diretório foi excluído.

## Como usar (em projeto já configurado)

Quando voltar pra projeto que já tem o sistema:

- **Sessão nova de chat:** cola `docs/workflows/setup-chat.md`
- **Sessão nova de Cowork:** cola `docs/workflows/setup-cowork.md`
- **Sessão nova de Code:** cola `docs/workflows/setup-code.md`
- **Tarefa nova:** invoca pipeline (planner → validator → executor) via main session do Claude Code, ou caminho B (`docs/AGENT_PLAYBOOK.md` Capítulo 6)

## Bootstrap em projeto novo (caso de uso secundário)

1. **Copia a pasta `harness/` pra raiz do seu projeto** e renomeia
   pra `docs/` (ou onde quiser que vivam as instruções)
2. **Abre Claude Chat** (claude.ai) — recomendo começar lá, é onde a
   discussão fica melhor
3. **Cola o conteúdo de `init/01-bootstrap-project.md`** no chat
4. **Conversa com o agente** — ele vai entrevistar você sobre o
   projeto e gerar os arquivos canônicos um por um
5. **Salva os arquivos gerados** na raiz do projeto e em `docs/`
6. **Faz primeiro commit** com toda a documentação gerada

A partir daí, você tem o sistema vivo. Workflows ficam em
`docs/workflows/`. Briefs futuros são autorados via o skill
`brief-template` em `.claude/skills/brief-template/SKILL.md`
e salvos em `docs/tasks/<NNN>-<slug>/brief.md`.

## Documentos canônicos que esse kit gera

Após rodar `init/`, seu projeto terá:

- **`CLAUDE.md`** (raiz) — regras técnicas do projeto
- **`docs/MENTOR_BRIEF.md`** — como agente atua como mentor sênior
- **`docs/GIT_WORKFLOW.md`** — fluxo Git e disciplina de commit
- **`docs/GOTCHAS.md`** — armadilhas conhecidas do stack
- **`docs/AGENT_PLAYBOOK.md`** — metodologia de orquestração

Cada um foi **gerado por entrevista**, não copiado de template.
Por isso reflete seu projeto, não um genérico.

## Princípio

**Documentos vivos > templates estáticos.** Templates envelhecem.
Documentos vivem porque foram criados pro contexto deles.

O harness te dá o **processo** de orquestração — workflows
copiáveis, prompts de bootstrap, doutrina de pausa. Os artefatos
canônicos (`CLAUDE.md`, `docs/MENTOR_BRIEF.md`, etc.) nascem desse
processo e evoluem com o projeto.

## Próximos passos quando começar projeto novo

Cola no chat:

```
Estou começando projeto novo. Quero usar o harness pra inicializar
documentação. Lê o arquivo init/01-bootstrap-project.md e segue as
instruções dele.
```

E pronto — o agente conduz a partir daí.
