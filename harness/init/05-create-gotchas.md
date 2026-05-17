# Create GOTCHAS.md

> **Contexto:** você está em sessão de bootstrap. Já gerou
> `CLAUDE.md`, `MENTOR_BRIEF.md`, `GIT_WORKFLOW.md`. Agora vai
> gerar `docs/GOTCHAS.md`.

## O que é o `GOTCHAS.md`

Catálogo de **armadilhas técnicas conhecidas** do stack que o
projeto usa. Coisas como:

- Bug conhecido de uma biblioteca
- Comportamento inesperado de uma API
- Quirk de linguagem que pega gente
- Configuração que precisa ser exata pra funcionar

Diferente do `CLAUDE.md` (regras prescritivas), GOTCHAS é
**descritivo**: registra o que o stack faz que confunde, e como
contornar.

## Estrutura recomendada

```markdown
# Gotchas

> Catálogo de armadilhas técnicas conhecidas. Cada gotcha tem ID
> permanente (formato: G-CAT-N) pra referência em commits e issues.

## Categorias

[Lista das categorias usadas no projeto. Ex: G-LANG, G-API,
 G-BUILD, G-CSS]

## Formato fixo

Cada gotcha segue:
- ID e título
- **Symptom:** o que aparece na tela / no log
- **Cause:** por que acontece
- **Workaround:** o que fazer
- **Evidence:** link, hash de commit, ou referência

## Catálogo

[Cada gotcha aqui]
```

## Sua tarefa

Em projeto novo, **a maioria dos gotchas ainda não foi descoberta**.
Esse documento começa parcialmente vazio e cresce com uso.

Mas **algumas categorias podem ser pré-populadas** se o usuário já
conhece o stack.

### Passo 1 — Decidir categorias

Pergunta o usuário sobre o stack (ele já te disse na Fase 1, mas
revise):

- Linguagem(ns) principal(is)
- Framework principal (se houver)
- Ferramentas de build (esbuild, webpack, vite, etc.)
- Plataforma alvo (web, mobile, desktop, server, etc.)

Pra cada área, propõe uma categoria de gotcha. Exemplos:

| Stack | Categorias sugeridas |
|---|---|
| TypeScript + React + web | G-TS, G-REACT, G-CSS, G-BUILD |
| Python + Django + web | G-PY, G-DJANGO, G-DB, G-DEPLOY |
| Rust + WASM + web | G-RUST, G-WASM, G-JS-INTEROP |
| Plugin Photoshop UXP | G-UXP, G-SPC (Spectrum), G-CSS |

Pergunta ao usuário se concorda ou quer ajustar.

### Passo 2 — Pre-população opcional

Pergunta: "tem armadilha conhecida desse stack que você já bateu de
cara antes?"

Se ele souber, registre como gotcha completo. Se não souber, segue
com documento vazio.

**Não invente gotchas.** Documento que mente é pior que documento
vazio.

### Passo 3 — Estabelecer formato

Cada gotcha segue **rigorosamente** este formato:

```markdown
### G-CAT-N — Título descritivo curto

**Symptom:** O que você vê acontecer (mensagem de erro,
comportamento estranho, output inesperado). Concreto, observável.

**Cause:** Por que acontece. Explica o motivo técnico, não só
"é assim".

**Workaround:** Comando, código ou configuração que resolve.
Concreto.

**Evidence:** Link pra issue, commit que descobriu, doc oficial,
ou data + descrição se foi descoberto localmente.
```

Exemplo bom:

```markdown
### G-TS-1 — `tsc` não compila com `target: es2020` em projetos com Node 14

**Symptom:** Erro `Cannot find name 'globalThis'` durante build.

**Cause:** `globalThis` foi adicionado em Node 12, mas TypeScript
com `target: es2020` precisa de lib `dom` ou `esnext` declarada
explicitamente em `tsconfig.json`.

**Workaround:** Adicionar `"lib": ["es2020", "dom"]` no
`tsconfig.json` mesmo se o projeto não usa DOM.

**Evidence:** Discussão em microsoft/TypeScript#42789, descoberto
neste projeto em 2024-03-15.
```

Exemplo ruim:

```markdown
### G-TS-1 — TypeScript dá erro

Às vezes TypeScript dá erro estranho. Tenta limpar cache.
```

(Vago, sem causa, sem workaround específico, sem evidência.)

### Passo 4 — Criar arquivo semente

Mesmo se o usuário não souber gotchas pré-prontos, crie o arquivo
com:

- Lista de categorias acordadas
- Formato fixo documentado
- Seção "Catálogo" vazia ou com 1-2 gotchas que ele citou
- Nota de manutenção: "Adicione novos gotchas conforme descobrir"

### Passo 5 — Estabelecer fluxo de manutenção

Diga ao usuário:

> Daqui pra frente, sempre que você ou agente IA descobrir
> armadilha nova:
>
> 1. Reproduza com calma e entenda a causa
> 2. Descreva no formato fixo
> 3. Adicione ID na próxima vaga (G-TS-2, G-CSS-3, etc.)
> 4. Comita com mensagem `docs(gotcha): add G-CAT-N about <título>`

## Princípio do documento

**Gotchas pagam dividendos compostos.** Cada gotcha registrado evita
tempo perdido futuro. Mas só se forem **escritos com rigor** —
genéricos demais, ninguém consegue aplicar.

**Forma > volume.** 5 gotchas bem-escritos > 50 vagos.

## Após gerar

- Confirma com usuário se as categorias fazem sentido
- Cria `docs/GOTCHAS.md` (mesmo que catálogo esteja vazio)
- Avise: "Esse arquivo vai crescer rápido. Visita ele a cada 1-2
  semanas pra revisar e talvez agrupar gotchas relacionados."
- **Próximo:** lê `init/06-create-agent-playbook.md`
