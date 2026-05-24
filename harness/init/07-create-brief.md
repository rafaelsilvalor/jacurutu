# Create BRIEF

> **Quando usar:** começo de tarefa M ou L. Você (usuário) descreve
> o que precisa fazer e este prompt guia a conversa pra produzir um
> brief adequado em `docs/tasks/<NNN>-<slug>/brief.md`.
>
> **Onde colar:** chat (claude.ai). É discussão, não execução.

---

## --- COPIAR PRA CHAT ---

```
Preciso criar um brief pra tarefa nova no projeto. Vou te descrever
o que quero fazer; me ajude a entender as necessidades reais e gerar
um brief adequado pro projeto em `docs/tasks/<NNN>-<slug>/brief.md`.

Antes de começar a entrevista:

1. Lê esses arquivos do projeto pra ter contexto:
   - CLAUDE.md
   - docs/MENTOR_BRIEF.md
   - docs/GIT_WORKFLOW.md
   - docs/GOTCHAS.md
   - docs/AGENT_PLAYBOOK.md

2. Confirma em uma frase quem eu sou (do MENTOR_BRIEF) e o estado
   do projeto.

Depois conduz a entrevista nesta ordem:

PASSO 1 — Descrição inicial:
Pergunta o que eu quero fazer. Eu vou descrever em texto livre.

PASSO 2 — Categorização:
Com base na descrição, classifica a tarefa como S, M, L ou XL
seguindo o AGENT_PLAYBOOK Capítulo 1. Diz a categoria e por quê.
Se for S, sugere fazer no chat sem brief. Se for XL, sugere
quebrar em tarefas L.

PASSO 3 — Refinamento (se M ou L):
Pergunta o que precisar pra entender:
- Qual o objetivo concreto e verificável?
- Quais restrições existem? (não mudar X, não quebrar Y)
- Tem decisões arquiteturais já tomadas?
- Qual o critério de pronto?
- Tem prazo ou só "quando ficar bom"?

Use perguntas com botões quando possível. Não despeje todas as
perguntas de uma vez — vai por seções.

PASSO 4 — Identificação de armadilhas:
Procura ativamente armadilhas no que descrevi:
- Tem mudança implícita de comportamento que eu não percebi?
- Tem dependência que eu esqueci?
- Tem teste/validação que eu não pensei?
- Tem conflito potencial com regra do CLAUDE.md?

Levanta as armadilhas como perguntas, não como acusações.

PASSO 5 — Compilação do brief:
- Determina o próximo número livre em `docs/tasks/` (NNN com
  zero-padding, ex.: 001, 002) e um slug curto descritivo em
  kebab-case
- Determina `Plan required: yes | no` baseado no critério em
  `harness/prompts/task-brief-template.md` (seção "Quando
  pular Pausa 1")
- Gera o brief seguindo o template de
  `harness/prompts/task-brief-template.md`. Use as decisões
  da entrevista pra preencher cada seção
- Caminho de saída: `docs/tasks/<NNN>-<slug>/brief.md`

PASSO 6 — Revisão final:
Mostra o brief gerado. Pergunta se há algo a ajustar. Quando
aprovado, salva como `docs/tasks/<NNN>-<slug>/brief.md`. Sugere
próximo passo: commitar o brief com mensagem
`docs(tasks): add brief for <NNN>-<slug>` e iniciar a tarefa
invocando o executor agent no Claude Code (caminho B — brief já
está salvo; ver `docs/AGENT_PLAYBOOK.md` Capítulo 6).

Princípios:
- Brief reflete MEU projeto, não template genérico
- Decisões importantes são tomadas por mim, não inventadas por
  você
- Quando eu não souber responder, marque como pendência em vez de
  fingir certeza
```

## --- FIM COPIAR ---

## O que esperar

A conversa vai durar 15-30 min dependendo do tamanho da tarefa.

Resultado: `docs/tasks/<NNN>-<slug>/brief.md`, pronto pra ser
referenciado pelo agente executor. O `plan.md` (se
`Plan required: yes`) e quaisquer `notes.md` ficam na mesma pasta.

## Variantes

### Pra tarefa pequena (categoria S)

Não precisa esse prompt. Cola direto no Claude Code:

```
Tarefa pequena: [descrição em 1-2 frases]. Lê CLAUDE.md e me
mostra plano antes de codar.
```

### Pra tarefa exploratória (categoria L mas sem direção clara)

Modifica o prompt pra incluir sessão de **diagnóstico antes do
brief**. Pergunta o que está incomodando, o que ele quer descobrir,
e gera tarefa de "investigar X" antes de gerar brief de
"implementar Y".

## Princípio em jogo

**Brief bom > tarefa boa.** Tempo gasto criando brief com mentor é
sempre menor que tempo gasto consertando trabalho mal-direcionado.

Quando você está cansado e quer "só pedir e ver acontecer", esse é
exatamente o momento de **fazer o brief com calma** em vez de pular.

## ❓ PERGUNTAS PRA REVISÃO FUTURA

- Vale criar variantes específicas (refactor brief, feature brief,
  fix brief)? Cada um focaria em armadilhas típicas do tipo.
- O passo 4 (identificação de armadilhas) é onde mentor agrega mais
  valor. Vale expandir esse passo com técnicas específicas?
