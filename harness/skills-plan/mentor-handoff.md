# Skill candidata: mentor-handoff

> **Status:** rascunho pra discussão. Ainda não é Skill ativa.

## Quando essa Skill ativaria

Quando o agente percebe que tarefa ficou complexa demais e merece
discussão com mentor (chat) antes de continuar.

Triggers detectáveis:

- 3+ tentativas de resolver mesmo problema sem sucesso
- Decisão arquitetural não-prevista no plano original
- Conflito entre regras (ex: cumprir A viola B)
- Trade-off significativo identificado durante execução

## O que ela carregaria como contexto

Ao ativar, instrui o agente a:

1. **Pausar** antes de prosseguir
2. **Documentar** o impasse encontrado
3. **Sugerir** discussão com mentor (chat)
4. **NÃO** improvisar solução sozinho

## Como o SKILL.md ficaria

```markdown
---
name: mentor-handoff
description: Ativa quando você identifica que tarefa atual passou
  do escopo do agente executor — decisão arquitetural não-prevista,
  conflito entre regras, ou tentativas múltiplas sem sucesso. Use
  pra pausar e sugerir handoff pro mentor (Claude Chat) em vez de
  improvisar.
---

# Quando handoff pro mentor

Você é executor, não decisor de arquitetura. Quando tarefa
ultrapassa seu papel:

## Sinais de handoff necessário

- **3+ tentativas de mesmo problema sem sucesso** — modo cascata
- **Decisão arquitetural não-prevista no plano original** —
  brief não cobre
- **Conflito entre regras** — cumprir A viola B
- **Trade-off significativo durante execução** — escolha que
  afeta projeto inteiro

## Protocolo de handoff

Quando detectar um sinal:

1. **Para imediatamente.** Não improvise solução.
2. **Roda `git stash` ou `git status`** pra preservar trabalho
   atual sem comitar.
3. **Documenta o impasse** numa mensagem ao usuário:
   - O que estava tentando fazer
   - Onde travou (qual decisão)
   - Por que precisa de mentor
   - Opções que você considerou (se houver)
4. **Sugere ao usuário:**
   ```
   Esse caso ultrapassa minha capacidade de decisão como executor.
   Recomendo abrir Claude Chat (claude.ai), colar essa mensagem
   pra mentor sênior, e voltar com decisão tomada.

   Enquanto isso, preservo o estado atual sem comitar. Você pode
   continuar quando tiver direção.
   ```

## O que NÃO fazer

- ❌ Improvisar solução baseada em palpite
- ❌ "Tentar de novo" sem novo entendimento
- ❌ Comitar trabalho indeciso achando que decide depois
- ❌ Sugerir handoff em situações triviais (toda decisão pequena)
```

## Avaliação contra os 4 critérios

| Critério | Resposta |
|---|---|
| Situação se repete? | ⚠️ Médio — algumas tarefas, não todas |
| Trigger é detectável? | ⚠️ Médio — sinais sutis, fácil errar |
| Instrução é genérica? | ✅ Sim — vale pra qualquer projeto |
| Custo de errar baixo? | ⚠️ Médio — falso positivo interrompe trabalho desnecessariamente |

**Recomendação:** **prioridade baixa**. Útil mas tem risco real de
ativar em situações triviais. Vale criar **só após** ter `commit-discipline`
e `task-pauses-protocol` provados em uso.

## Riscos

- **Falso positivo alto:** ativar quando agente "se acha confuso"
  mas decisão é trivial. Resultado: trabalho parado sem motivo.
- **Falso negativo:** não ativar quando devia. Resultado: agente
  improvisa solução ruim.

## Mitigação

- Description **muito específica** pra reduzir falso positivo
- Critério "3+ tentativas" é objetivo (contável)
- Testar em projeto real antes de adotar
