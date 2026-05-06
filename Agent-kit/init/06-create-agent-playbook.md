# Create AGENT_PLAYBOOK.md

> **Contexto:** você está em sessão de bootstrap. Já gerou todos
> os outros documentos. Esse é o último: `docs/AGENT_PLAYBOOK.md`.

## O que é o `AGENT_PLAYBOOK.md`

Diferente dos outros docs, este é **pro usuário ler**, não pro
agente. É a metodologia dele pra **orquestrar agentes IA**.

Ensina:

1. Como categorizar tarefa (S/M/L/XL)
2. Como escrever brief
3. Como acompanhar execução (pausas, sinais)
4. Como revisar resultado
5. Como evitar armadilhas comuns de orquestração

## Estrutura recomendada

```markdown
# Agent Playbook

> Metodologia pra orquestrar agentes IA. Quem lê é o usuário, não
> o agente.

## Capítulo 1 — Antes da tarefa
## Capítulo 2 — Durante a tarefa
## Capítulo 3 — Depois da tarefa
## Capítulo 4 — Anti-patterns de orquestração
## Capítulo 5 — Crescimento contínuo
```

## Sua tarefa

Diferente dos outros documentos, **não é entrevista pesada**. O
playbook tem **conteúdo razoavelmente universal**.

Mas você precisa **adaptar exemplos** pro projeto específico do
usuário.

### Passo 1 — Pergunta o nível de detalhe desejado

O playbook pode ser:

- **Resumido (3-4 páginas):** princípios principais, sem muito
  exemplo
- **Médio (10-15 páginas):** princípios + exemplos do projeto +
  cheklists práticos
- **Completo (30+ páginas):** princípios + exemplos + checklists +
  capítulos de anti-patterns + meta-discussão de processo

Pergunta ao usuário qual versão quer começar. Recomenda **médio**
pra começar — pode crescer.

### Passo 2 — Estrutura conhecida

O playbook segue 5 capítulos. Vou descrever cada um. Você adapta o
conteúdo pro projeto do usuário.

#### Capítulo 1 — Antes da tarefa

Cobre:

- **Categorização S/M/L/XL** com tempo estimado e características
  - S: < 30 min, ajuste pontual
  - M: 30 min - 2h, mudança contida
  - L: 2-8h, multi-arquivo, multi-sessão possível
  - XL: > 1 dia, múltiplas sessões — quebrar em L
- **Tipos de tarefa** (refator, feature, fix, exploratory, doc)
- **Gabarito de brief de 4 partes**: Contexto / Objetivo /
  Restrições / Critério de pronto
- **Como passar referências** sem confundir (referência ≠ template)

#### Capítulo 2 — Durante a tarefa

Cobre:

- **3 pontos de pausa** (Pausa 1: antes do código; Pausa 2: após
  primeiro arquivo; Pausa 3: antes de cada commit)
- **5 sinais de deriva** (modo correção em cascata, escopo
  expandido, modo overconfident, etc.)
- **Como redirecionar** sem destruir trabalho

#### Capítulo 3 — Depois da tarefa (revisão por sintomas)

Esse é o **coração** do documento. Lista de **sintomas de código
ruim** organizados em 5 categorias:

- **A — Cheiros de instabilidade temporal** (timers, awaits, race
  conditions)
- **B — Cheiros de erro escondido** (catch silencioso, optional
  chaining em cadeia)
- **C — Cheiros de complexidade** (função grande, aninhamento,
  parâmetros demais)
- **D — Cheiros de inconsistência** (padrões diferentes em coisas
  similares)
- **E — Cheiros de escopo borrado** (arquivos modificados além do
  esperado)

Adapta os sintomas pro stack do usuário. Sintomas em Python são
diferentes de TypeScript ou Rust.

#### Capítulo 4 — Anti-patterns de orquestração (do usuário)

Comportamentos do orquestrador (não do agente) que estragam
sessões:

- **O1 — Mandar referência sem adaptação**
- **O2 — Sobre-explicar por insegurança**
- **O3 — Confiar sem verificar**
- **O4 — Pular o plano**
- **O5 — Continuar quando agente está em cascata**
- **O6 — Mudar objetivo no meio da sessão**
- **O7 — Aceitar resposta vaga porque "parece técnico"**
- **O8 — Não atualizar `STATE.md` ao pausar**
- **O9 — Não documentar aprendizado novo**

Inclui sinais de auto-detecção em cada um.

#### Capítulo 5 — Crescimento contínuo

Como o playbook (e os outros docs) evoluem com uso:

- Toda sessão deve ensinar algo
- Quando uma falha vira regra
- Quando expandir vs simplificar
- Meta do projeto

### Passo 3 — Adaptação ao stack

Pergunta:

- Qual o **stack do projeto**?
- Tem **frameworks específicos** que vão aparecer no código?
- Tem **padrões particulares** que valem mencionar?

Use isso pra adaptar exemplos. Em projeto Python: exemplos com
classes Python, async/await Python, gotchas Python. Em TS+React:
exemplos com hooks, JSX, etc.

### Passo 4 — Geração

Compile tudo num `docs/AGENT_PLAYBOOK.md`. Pode ser longo (1000+
linhas se versão completa).

Inclua **lições numeradas** ao longo do texto:

> **Lição #1 do orquestrador:** [princípio explicado em 1
> parágrafo]

Essas lições servem de "âncora" pra usuário se referir depois
("aquela lição #15 sobre escopo borrado").

## Princípio

Esse documento é **manual de operação do operador**. Os outros
documentos são pro agente. Esse é pra você (o orquestrador).

Foco em:
- **Princípios verificáveis** ("se acontecer X, faz Y")
- **Sinais detectáveis** ("quando vir X no chat, é sinal de Y")
- **Antídotos concretos** ("pra evitar X, faz Y")

Evita filosofia abstrata. Cada parágrafo deve dar uma ferramenta
de pensamento aplicável.

## Após gerar

- Confirma com usuário se quer revisar antes de salvar
- Cria `docs/AGENT_PLAYBOOK.md`
- **Próximo passo (e fim do bootstrap):** mostra resumo de tudo
  que foi gerado, sugere comitar tudo, e indica que a partir daí
  o usuário usa `docs/workflows/start-task.md` pra primeira tarefa
  real
