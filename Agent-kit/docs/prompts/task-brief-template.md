# Template: Task Brief

## Quando usar

Criar `BRIEF_<nome>.md` pra tarefa nova de categoria M ou L.

> **Recomendação:** prefira usar `init/07-create-brief.md` —
> agente entrevista você e gera brief adequado. Use template manual
> só se preferir trabalhar sozinho.

Tarefas categoria S não precisam de brief — basta uma frase no
chat. Tarefas XL não devem ter brief ainda — quebra primeiro em
tarefas L.

## Como usar manualmente

1. Copia o template abaixo
2. Salva como `docs/tasks/<NNN>-<slug>/brief.md` (cria a pasta;
   numeração `NNN` zero-padded em ordem cronológica, slug
   curto-descritivo em kebab-case)
3. Preenche cada seção (instruções inline em `[colchetes]`)
4. Remove instruções e colchetes antes de finalizar
5. Comita o brief antes de iniciar a tarefa

---

## --- TEMPLATE PARA COPIAR ---

```markdown
# Brief: [Título curto da tarefa]

> **Categoria:** [M | L]
> **Plan required:** [yes | no] — ver "Quando pular Pausa 1" abaixo
> **Branch:** `[tipo]/[descricao-kebab]`
>
> Cole este brief inteiro no agente executor (Claude Code, Cowork)
> ao iniciar a tarefa.

---

## Contexto

[2-4 frases. Onde isso encaixa no projeto. Por que existe.
Estado atual relevante. Se já está claro pelo nome do arquivo
ou da tarefa, omite — não enche.]

## Objetivo

[1-2 frases imperativas. O que precisa estar diferente no fim.
Não como, só o quê.]

## Restrições

### Restrições não-negociáveis

1. [Comportamento que não pode mudar]
2. [API que não pode quebrar]
3. Seguir todas as regras do `CLAUDE.md` (especialmente
   [R-X], [A-Y])
4. Seguir o workflow Git de `docs/GIT_WORKFLOW.md` integralmente:
   - Branch nova: `[tipo]/[descricao-kebab]`
   - Conventional Commits
   - Pode comitar livremente; **NÃO empurre**
   - Atualizar `STATE.md` ao final da sessão
5. Apenas os arquivos diretamente relacionados à tarefa podem ser
   modificados. Se descobrir que precisa mexer em outra coisa,
   **PARE e pergunte**.

### Decisões arquiteturais já tomadas (não revisar)

[Liste decisões fechadas em sessão de design com mentor. O agente
implementa, não propõe alternativas. Se nenhuma decisão foi
pré-fechada, omita esta seção e o agente vai propor um plano —
você revisa em Pausa 1.]

#### [Decisão 1]

[Detalhe específico]

#### [Decisão 2]

[Detalhe específico]

## Critério de pronto

A tarefa só é concluída quando **todos** os itens forem verdadeiros:

### Verificações automáticas

- [ ] Build passa sem erros
- [ ] Linter passa sem warnings
- [ ] Testes passam (se aplicável)
- [ ] [Outras verificações automatizáveis]

### Verificações estruturais

- [ ] [Estrutura específica esperada]
- [ ] [Limites de tamanho]
- [ ] [Anti-patterns ausentes — `grep` ou similar]

### Verificações de comportamento

- [ ] [Comportamento testável]
- [ ] [Casos edge específicos]

### Verificações Git

- [ ] Branch usada: `[tipo]/[descricao]`
- [ ] Commits seguem Conventional Commits
- [ ] `git status` na branch limpo ao final
- [ ] **NÃO** foi feito `git push`
- [ ] `STATE.md` atualizado pra `completed` ou removido

### Verificações de processo

- [ ] Se `Plan required: yes` — plano em passos numerados foi
      apresentado e aprovado antes de qualquer mudança (Pausa 1)
- [ ] Pausa 2 — primeiro arquivo modificado mostrado pra revisão
      antes de seguir (sempre obrigatória)
- [ ] Pausa 3 — `git status` + `git diff --stat` + mensagem
      proposta antes de cada commit (sempre obrigatória)
- [ ] Se algum critério não pôde ser atendido, foi reportado
      explicitamente

## Pontos de pausa

Pelo `AGENT_PLAYBOOK.md` Capítulo 2:

- **Pausa 1 (antes de qualquer código):** apresentar plano numerado
  e aguardar aprovação. **Obrigatória se `Plan required: yes`;
  pulada se `Plan required: no`** (ver "Quando pular Pausa 1"
  abaixo).
- **Pausa 2 (após primeiro arquivo modificado):** mostrar resultado
  e aguardar revisão. **Sempre obrigatória.**
- **Pausa 3 (antes de cada commit):** mostrar `git status` +
  `git diff --stat` + mensagem proposta. **Sempre obrigatória.**

Em caso de:
- Bug não-relacionado encontrado → reportar e perguntar
- Limitação técnica que impede critério de pronto → reportar
- Gotcha não documentado descoberto → reportar e documentar

**NÃO siga em frente "consertando" sem permissão.**

## Quando pular Pausa 1 (`Plan required: no`)

Pausa 1 ("agente apresenta plano numerado antes de qualquer código") protege contra agente inventar abordagem que o brief não especificou. É overhead quando o brief **é** o plano — quando todas as decisões estão fechadas e o trabalho do agente é executar, não desenhar.

**Pular Pausa 1 só quando TODOS os critérios valem:**

- Todas as decisões arquiteturais estão registradas neste brief ou em docs canônicos (`CLAUDE.md`, `MENTOR_BRIEF.md`)
- Os critérios de pronto são concretos e verificáveis sem interpretação
- Não há ambiguidade sobre quais arquivos tocar nem como

**Tarefas típicas `Plan required: no`:**
- Atualizar docs com texto já especificado no brief
- Edições mecânicas (rename, format, mover arquivos)
- Adicionar regra a arquivo estruturado em local especificado

**Tarefas típicas `Plan required: yes`:**
- Refactor com escolhas de implementação a fazer
- Feature nova com decisões de design
- Bug fix onde causa raiz é hipótese, não confirmação

⚠️ **Pausa 2 (após primeiro arquivo) e Pausa 3 (antes de cada commit) são SEMPRE obrigatórias, independente de `Plan required`.** Elas pegam drift que o brief não previu (Lição #6 do `AGENT_PLAYBOOK.md`).

## Documentos de referência (leia antes de começar)

Em ordem de prioridade:

1. `CLAUDE.md` — todas as regras técnicas
2. `docs/GIT_WORKFLOW.md` — workflow operacional
3. `docs/GOTCHAS.md` — armadilhas conhecidas
4. [Outros arquivos específicos relevantes]

## Saída esperada

1. Branch `[tipo]/[descricao]` criada e working tree limpa
2. Commits descrevendo cada mini-marco da tarefa
3. `STATE.md` ao final indicando completed
4. [Arquivo principal da tarefa] reescrito conforme spec
5. Resumo curto reportado em mensagem final:
   - Quantos commits, quais
   - Linhas adicionadas/removidas
     (`git diff --stat origin/main`)
   - Qualquer item da checklist que não pôde ser atendido (com
     justificativa)
   - Sugestão de próximo passo
```

## --- FIM TEMPLATE ---

## Princípios pra preencher bem

### O que ENTRA no brief

- ✅ Restrições verificáveis
- ✅ Comportamentos exatos a preservar
- ✅ Decisões já tomadas que agente não deve revisar
- ✅ Critérios de pronto testáveis
- ✅ Referências a outros docs

### O que NÃO entra

- ❌ Soluções específicas ("use uma classe Foo...")
- ❌ Justificativas longas de por que a tarefa importa
- ❌ História do projeto que não é restrição ativa
- ❌ Especulação sobre futuro distante

## Tamanho ideal

- **Tarefa M:** 80-150 linhas
- **Tarefa L:** 200-400 linhas

Se passar disso, ou tarefa é XL disfarçada (quebra), ou brief
está sobre-explicando.
