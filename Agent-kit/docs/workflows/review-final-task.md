# Workflow: Review Final Task

## Quando usar

Agente reportou que tarefa está pronta (todos passos do plano
concluídos). Você revisa o **trabalho completo** antes de mergear.

Mais profunda que `review-pause3.md` — última camada de defesa
antes do merge.

## Pré-requisitos

- Agente reportou tarefa concluída
- Validações automáticas passaram
- Validação manual feita (se aplicável)

---

## Checklist de revisão final

### 1. Critério de pronto do brief

Volta no brief original (`BRIEF_<nome>.md`) e confirma cada item:

```
[ ] Cada item da seção "Critério de pronto" foi atendido?
[ ] Verificações automáticas passaram?
[ ] Verificações estruturais passaram?
[ ] Verificações de comportamento passaram?
```

Se algum ficou sem atender, **investiga antes**.

### 2. Histórico de commits

```bash
git log main..HEAD --oneline
```

Avalia:

```
[ ] Número de commits faz sentido pra tarefa?
[ ] Cada mensagem segue Conventional Commits?
[ ] Sequência conta uma história lógica?
[ ] Não há "fix typo do commit anterior"?
[ ] Não há mensagens "WIP" ou similar?
```

### 3. Diff total

```bash
git diff --stat origin/main
git diff origin/main
```

Avalia:

```
[ ] Apenas arquivos esperados foram modificados?
[ ] Volume bate com escopo da tarefa?
[ ] Nada foi deletado que não devia?
[ ] Não há código comentado deixado?
[ ] Não há console.log / debug deixado?
```

### 4. STATE.md

```
[ ] Status como `completed`?
[ ] Done so far cobre tudo?
[ ] Next steps vazio (ou pendências futuras intencionais)?
```

OU, se removido:

```
[ ] STATE.md foi removido com commit explicativo?
```

### 5. Documentação

```
[ ] Novo gotcha descoberto → adicionou em docs/GOTCHAS.md?
[ ] Nova regra/exceção → adicionou em CLAUDE.md?
[ ] Nova convenção → atualizou GIT_WORKFLOW ou AGENT_PLAYBOOK?
```

### 6. Revisão por sintomas (Capítulo 3 do AGENT_PLAYBOOK)

Varredura visual nos arquivos modificados procurando os sintomas
catalogados no playbook do projeto.

## Decisão final

### Aprovado

→ Segue pra `close-task.md` e `gitflow-merge-into-main.md`.

### Aprovado com pendências menores

Decide:
- **Resolve agora** (se rápido)
- **Anota como follow-up** (se for trabalho novo)

### Reprovado

→ Volta pro agente com lista de ajustes específicos. Não mergeia.

### Descarte total (raro)

Se a tarefa toda saiu errada e não vale ajustar:

```bash
git checkout main
git branch -D [nome]
git push origin --delete [nome]
```

E **reescreve o brief** com lições aprendidas. Custo do descarte
< custo de mergear coisa ruim.

## Princípio em jogo

**Última oportunidade de redirecionar barato.** Antes do merge,
mudanças custam revert. Após o merge, mudanças custam mais
commits e poluem o histórico.
