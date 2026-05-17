# Workflow: Resume Session

## Quando usar

Retomar trabalho que foi pausado em sessão anterior. Funciona em
qualquer interface (Chat, Cowork, Code) — adapte conforme necessário.

Use quando:
- Você sabe que tem tarefa em andamento (existe `STATE.md` ou
  branch ativa que não é `main`/principal)
- Sessão foi pausada e quer voltar ao mesmo ponto

Se sessão é totalmente nova, use o `setup-*.md` correspondente.

## Pré-requisitos

- Sessão anterior atualizou `STATE.md` ou deixou commits descritivos
- Branch da tarefa ainda existe localmente

---

## --- COPIAR ---

```
Estamos retomando uma tarefa do dia/sessão anterior. Antes de
qualquer ação, faz verificação dupla — sua memória + estado real.

PASSO 1 — Memória:
Em uma frase, me reporta: qual foi a última ação que você executou
nessa sessão e onde paramos? Se não tiver na sua memória da sessão
atual, diga "não tenho contexto carregado" e pula pro passo 2.

PASSO 2 — Estado do disco (sempre executar):
git status
git branch
git log --oneline -10
git fetch origin
git log origin/main..HEAD --oneline  (se em branch que não é main)

Se existir STATE.md na raiz, lê e exibe conteúdo.

PASSO 3 — Reconciliação:
Compara o que você "lembra" (passo 1) com o que está no disco
(passo 2). Me reporta:
- Branch ativa
- Último commit feito
- Mudanças não-comitadas
- Status do STATE.md (se existir)
- Próximo passo pendente segundo STATE.md ou último commit

Não execute nada além dos comandos de leitura. Não comita, não
edita. Aguarda autorização explícita pra avançar.
```

## --- FIM COPIAR ---

## Como avaliar a resposta

✅ **Resposta válida:**
- Distinguiu memória de estado real
- Mostrou outputs reais
- Identificou alinhamento ou divergência

⚠️ **Atenção:**
- Memória do agente desatualizada → ok, segue o estado real
- `STATE.md` ausente mas branch ativa existe → reconstrua pelo
  `git log`

🚨 **Bloqueio:**
- Working tree não-clean com mudanças que você não fez
- Branch atual é principal mas você esperava estar em branch de
  tarefa
- Estado do disco diverge **catastroficamente** da memória do
  agente

## Princípio em jogo

**Estado do disco > memória do agente.** Você fecha e abre o chat
10x, o disco lembra. O agente, não.

## Próximo workflow

- Estado claro, continua tarefa → segue trabalho normalmente
- Trabalho concluído mas não fechado → `close-task.md`
- Estado confuso → `recover-stuck-agent.md`

## Adaptações por interface

- **Chat:** o passo 2 (comandos git) você roda no terminal e cola
  o output pro agente. Ele não tem acesso direto.
- **Cowork:** Cowork roda os comandos diretamente.
- **Code:** Claude Code roda os comandos diretamente.
