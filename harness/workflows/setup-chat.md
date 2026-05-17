# Setup: Chat (claude.ai)

## Quando usar

Iniciar sessão nova em **chat** (claude.ai) — geralmente pra:

- Mentoria/discussão sobre o projeto
- Modelar tarefa nova (gerar brief)
- Code review por leitura
- Decisão arquitetural
- Revisar trabalho do agente executor

Chat **não toca seu disco**. É espaço de pensamento.

## Pré-requisitos

- Projeto já tem documentação canônica (`CLAUDE.md`, `MENTOR_BRIEF`,
  etc. — gerados pelo `agent-kit/init/`)
- Você consegue colar texto longo e arquivos no chat

---

## --- COPIAR ---

```
Olá. Estou começando uma sessão de mentoria/discussão sobre o
projeto [NOME].

Preciso que você atue como meu mentor sênior técnico nessa relação.

Antes de qualquer resposta substantiva, leia esses arquivos do meu
projeto (vou colar o conteúdo deles na sequência ou eles estão
anexados):

1. CLAUDE.md
2. docs/MENTOR_BRIEF.md
3. docs/GIT_WORKFLOW.md
4. docs/GOTCHAS.md
5. docs/AGENT_PLAYBOOK.md (se relevante pra discussão)

Após ler:
1. Confirma em uma frase quem você entendeu que eu sou (do
   MENTOR_BRIEF) e o estado do projeto (do CLAUDE.md)
2. Aguarda meu primeiro pedido

Não toque em nenhum arquivo. Você não tem acesso ao meu disco
nessa interface — todo trabalho é discussão e geração de texto/docs
que eu salvo manualmente.

Se eu te pedir algo que requer execução real (rodar comando,
modificar arquivo), me redirecione pra Claude Code ou Cowork —
você não é o canal certo pra essas ações.
```

## --- FIM COPIAR ---

## Como anexar/colar arquivos

Claude.ai aceita:
- **Anexar arquivos** (clique no clipe ou arraste) — preferível
- **Colar conteúdo** dentro de blocos de código markdown
- **URL** se o arquivo está em GitHub público

Pra projetos privados, cola o conteúdo. Os 5 arquivos canônicos
juntos geralmente cabem em ~30-50 mil caracteres.

## Avisos

- ⚠️ Chat **não persiste** entre sessões. Cada nova janela é zero.
  Por isso o setup é necessário toda vez.
- ⚠️ Memória do chat (se ativada) ajuda mas não substitui leitura
  dos docs do projeto. Sempre cola.
- ⚠️ Pra discussão técnica longa, cola **só o necessário**. 5
  arquivos canônicos é razoável; 50 arquivos do projeto é demais.

## Próximo passo após setup

Depende do que você quer:

- **Modelar tarefa** → cola `init/07-create-brief.md`
- **Discutir decisão** → fala livremente, mentor pergunta
- **Revisar código** → cola o código que quer revisar
- **Aprender algo** → faz pergunta direta

## ❓ PERGUNTAS PRA REVISÃO FUTURA

- Vale incluir orientação de como usar memória do Claude (feature
  de personalização)?
- O setup está mais longo do que precisa? Vale versão minimum
  viable?
