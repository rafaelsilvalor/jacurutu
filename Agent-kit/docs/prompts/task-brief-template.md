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
2. Salva como `BRIEF_<nome-curto>.md` na raiz do projeto
3. Preenche cada seção (instruções inline em `[colchetes]`)
4. Remove instruções e colchetes antes de finalizar
5. Comita o brief antes de iniciar a tarefa

---

## --- TEMPLATE PARA COPIAR ---

```markdown
# Brief: [Título curto da tarefa]

> Cole este brief inteiro no agente executor (Claude Code, Cowork)
> ao iniciar a tarefa. Tarefa categoria [M ou L].

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

- [ ] Antes de tocar código, plano em passos numerados foi
      apresentado e aprovado
- [ ] Pausa 3 (git status + git diff --stat) antes de cada commit
- [ ] Se algum critério não pôde ser atendido, foi reportado
      explicitamente

## Pontos de pausa obrigatórios

Pelo `AGENT_PLAYBOOK.md` Capítulo 2:

- **Pausa 1 (antes de qualquer código):** apresentar plano numerado
  e aguardar aprovação
- **Pausa 2 (após primeiro arquivo modificado):** mostrar resultado
  e aguardar revisão
- **Pausa 3 (antes de cada commit):** mostrar `git status` +
  `git diff --stat` + mensagem proposta

Em caso de:
- Bug não-relacionado encontrado → reportar e perguntar
- Limitação técnica que impede critério de pronto → reportar
- Gotcha não documentado descoberto → reportar e documentar

**NÃO siga em frente "consertando" sem permissão.**

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
