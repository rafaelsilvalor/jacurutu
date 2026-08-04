# Workflow: Close Mentor Session

## Quando usar

Encerrar sessão **Mentor** no Claude Code. Vale pros dois eixos: sessão
COM tópico (produziu ou atualizou nota em `docs/explorations/`) e sessão
SEM tópico (não produziu artefato).

## Pré-requisitos

- Sessão Mentor ativa, aberta via `setup-mentor.md`.
- Nenhuma tarefa de código roda nesta sessão (Mentor não usa pipeline).
  Se houver tarefa pausável em outra sessão, roda `pause-task.md` lá
  primeiro — código antes, conceito depois.

## Trigger

Disparo é híbrido:

- **Invocação explícita** ("encerrar sessão", "fechar sessão") — executa
  direto, sem perguntar.
- **Sinais detectados** — despedida ("tchau", "vou fechar"), encerramento
  estrutural ("acho que era isso", "decidi", "ok, fechado") ou mudança de
  tópico saindo do projeto. Nesse caso o Mentor pergunta *"Vale rodar o
  ritual de encerramento agora?"* e só prossegue com confirmação.

## --- COPIAR ---

```
Encerrando a sessão. Roda o ritual de encerramento do Mentor.

PASSO 1 — Declara o eixo em uma linha. Sessão COM tópico produz ou
atualiza uma nota em docs/explorations/. Sessão SEM tópico não produz
artefato: diz isso em uma linha e encerra aqui.

PASSO 2 — Escreve a nota pelo write gate: mostra o conteúdo completo →
eu aprovo → escreve → read-back do disco → confirma byte-match. Só em
docs/explorations/; nenhum outro caminho.

PASSO 3 — Propõe uma disposição pra cada nota que a sessão tocou, do
conjunto fechado:
  - open
  - candidate
  - deferred — exige gatilho declarado
  - discarded — exige razão declarada
  - promoted to brief <id>
Toda transição é datada. Nada é apagado, nunca. Eu ratifico; você
escreve o status ratificado, não o proposto.

PASSO 4 — Aplica a regra de split: o status vive no nível da nota. Item
interno cuja disposição diverge da nota vira nota própria.

PASSO 5 — Transporte, que não é teu. Você termina no read-back do PASSO
2, com a nota escrita no disco. Você não roda git mutante (skill
mentor-mode, seção 6): nada de branch, commit, push ou PR, nem com
aprovação. A nota viaja depois numa branch docs/<topic> com PR próprio,
criada por mim ou por uma sessão Orchestrator. Fecha reportando em uma
linha quais arquivos ficaram no disco esperando transporte.

Dois limites do ritual: você nunca toca docs/ROADMAP.md e nunca abre
brief — upkeep da projeção e promoção de nota pra brief são do
Orchestrator. E o recap do Mentor está aposentado: esta sessão não salva
nada em docs/sessions/; a nota do tópico é o único artefato.
```

## --- FIM COPIAR ---

## Princípio em jogo

**A sessão só fecha quando o estado de cada possibilidade está
declarado.** O que sobrevive de uma sessão Mentor não é o relato do que
foi dito — é a nota do tópico, com disposição datada e ratificada.

Preço aceito da aposentadoria do recap: `ls docs/sessions/` deixa de
listar toda sessão Mentor, e o índice temporal global some. Mitigação:
linhas `Origin` datadas, changelogs datados e `git log`.

## Próximo workflow

- Próxima sessão conceitual → `setup-mentor.md`
- Nota escrita esperando transporte → branch `docs/<topic>` + PR, por mim
  ou por uma sessão Orchestrator
- Tópico maduro pra virar tarefa → `setup-orchestrator.md`; modelagem,
  brief e promoção da nota são do Orchestrator
