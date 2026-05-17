# Workflow: Close Chat Session

## Quando usar

Encerrar sessão de chat em qualquer um dos cinco modos do §8 do
`MENTOR_BRIEF.md` (mentoria, modelar tarefa, revisar plano, code
review, continuar tarefa). Garante que a próxima sessão retoma com
contexto.

## Pré-requisitos

- Sessão de chat ativa.
- **Sessão híbrida (tarefa de código também ativa):** roda
  `pause-task.md` **antes** desta. Ordem: código primeiro (preserva
  estado retomável), meta depois (preserva contexto). Sem essa ordem,
  o recap pode citar arquivos cujo estado ficou pendurado fora do Git.

## Trigger (M-R14)

Disparo é híbrido:

- **Invocação explícita** ("encerrar sessão", "fechar sessão") —
  executa direto, sem perguntar.
- **Sinais detectados** — despedida ("tchau", "vou fechar", "até
  depois"), encerramento estrutural ("acho que era isso", "decidi",
  "ok, fechado"), ou mudança de tópico saindo do projeto. Nesse caso o
  mentor pergunta *"Vale rodar o ritual de encerramento agora?"* e só
  prossegue com confirmação.

---

## --- COPIAR ---

```
Encerrando sessão. Antes de fechar, gera recap retomável.

PASSO 1 — Identifica modo da sessão (§8 do MENTOR_BRIEF.md):
mentoria | modelar tarefa | revisar plano | code review | continuar.
Reporta em uma linha.

PASSO 2 — Compila o recap com cinco campos:

### Decisões tomadas
- [decisão] → atualizar em: [arquivo-alvo]
- ...

### Pendências abertas
- [item pendente, com contexto suficiente pra retomar]

### Artefatos gerados
- [arquivos criados/modificados na sessão, ou "nenhum"]

### Próxima ação concreta
[uma frase: o que fazer no próximo touch do projeto]

### Snippet pra colar na próxima sessão
[bloco curto e copiável que recupera contexto sem reler o recap inteiro]

PASSO 3 — Propõe slug pro arquivo de recap baseado no tópico.
Caminho default: docs/sessions/YYYY-MM-DD-<slug>.md
Pede confirmação do slug antes de finalizar.

PASSO 4 — Entrega o recap como bloco markdown copiável (padrão).
Opcional, pra uso com Code/Cowork, anexa snippet de criação automática:

  cat > docs/sessions/YYYY-MM-DD-<slug>.md <<'EOF'
  [conteúdo do recap]
  EOF

PASSO 5 — Lista "vale commitar agora?" candidatos:
- STATE.md (se existir)
- MENTOR_BRIEF.md (novo padrão ou regra nasceu na sessão?)
- GOTCHAS.md (armadilha nova descoberta?)
- CLAUDE.md (regra ou exceção nasceu?)
- brief de tarefa em curso (correção de escopo?)
NÃO comita — só lista. Decisão e Pausa 3 são humanas (M-R3).
```

## --- FIM COPIAR ---

## Princípio em jogo

**Sessão só fecha quando retomável.** Recap salvo, próxima ação
explícita, contexto não vive só na cabeça.

## Próximo workflow

Geralmente `resume-session.md` na próxima sessão.
