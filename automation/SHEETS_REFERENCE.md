# Planilha "Avulsas Rafael — Auto-sync"

Referência técnica das abas **Demandas** e **Finalizadas** para consumo por agentes de IA. Cobre schema, semântica de cada coluna, regras de transição entre abas, automação vs. campos manuais, e as fórmulas vivas embutidas.

A planilha é alimentada pelo pipeline `fetch.py → sync.py → notify.py` (orquestrado por `run_local.py`). O Jira é a fonte de verdade; a planilha é uma projeção operacional.

---

## 1. Visão geral

| Aba | Propósito | Quem escreve |
|---|---|---|
| **Demandas** | Fila ativa: tasks de design pendentes ou em andamento que o Rafael precisa entregar. | `sync.py` (automatizado) + colunas manuais editadas pelo Rafael na UI. |
| **Finalizadas** | Histórico: tasks que saíram da fila ativa por terem sido concluídas/canceladas/entregues. | `sync.py` move linhas inteiras de Demandas para cá quando o status entra em `is_finished`. |

Ambas têm **o mesmo schema** (14 colunas, A–N). O que muda é o ciclo de vida da linha: nascem em Demandas, podem ir pra Finalizadas, e podem voltar manualmente se o Rafael desejar.

A planilha tem locale **pt_BR** — fórmulas usam `;` como separador de argumentos. As abas são formatadas como **tabelas nativas do Google Sheets** (`DemandasTable`, `FinalizadasTable`), o que dá filtros e cores alternadas automáticos.

---

## 2. Schema (idêntico nas duas abas)

| # | Letra | Coluna | Tipo | Automação | Conteúdo |
|---|---|---|---|---|---|
| 1 | A | `Vertical` | string | auto | Vertical do produto. Ex: `EC`, `CFC`, `Concursos`. Extraído de `customfield_10065` removendo os colchetes (`[EC]` → `EC`). |
| 2 | B | `Entrega` | date `YYYY-MM-DD` | auto | Data de entrega da task. Vem de `customfield_10031` (Data/hora do evento). Fallback: `customfield_11080`. |
| 3 | C | `HoraEntrega` | string | auto | Hora formatada: `19h`, `19h30`, ou `""` se sem hora/meia-noite. |
| 4 | D | `TaskPai` | hyperlink rich-text | auto | Key da task pai com link para o Jira (ex: `MCA-12340` → `https://estrategia.atlassian.net/browse/MCA-12340`). |
| 5 | E | `TaskFilha` | hyperlink rich-text | auto | Key da subtask de design (a própria task). **Esta é a chave de match** entre payload e linha existente. |
| 6 | F | `copy` | hyperlink rich-text | auto | Link para o copy (Google Drive/Docs). Pode ser: `copyDrive` (link real resolvido), ou `copyDescJira` (fallback de texto indicando que o copy está só na descrição). |
| 7 | G | `Demandante` | string | **manual** | Quem solicitou. Não preenchido automaticamente. |
| 8 | H | `nomeCurto` | string | auto (só na criação) | Slug curto (3–5 tokens, max 50 chars) baseado no summary do pai. Ex: `cfc-concurso-fim-de-ano`. Editável manualmente; sync não sobrescreve se já tiver valor. |
| 9 | I | `nomefinal` | **fórmula** | auto | Concatenação slugificada com ID da filha + vertical + data + nomeCurto + demandante. Recalculada pelo Sheets a cada mudança nas células referenciadas. Ver §5. |
| 10 | J | `status` | string | **manual** | Status operacional do Rafael. Valores reconhecidos pelo pipeline: ver §4 (move/delete logic). |
| 11 | K | `laminas` | string/número | **manual** | Quantidade ou descrição de lâminas/peças geradas. |
| 12 | L | `entregue` | string | **manual** | Marcador livre de entrega. |
| 13 | M | `linkDrive` | hyperlink ou texto | **manual** | Link para a arte entregue. Quando movida para Finalizadas, é preservada via `copyPaste` da API (mantém hyperlink rich-text). |
| 14 | N | `Última Sync` | string `dd/mm/yyyy HH:MM:SS` | auto | Timestamp do `jira_updated_at` da última sincronização, formatado pra leitura humana. Usado como guard de write-conditional. |

### Colunas manuais (NÃO sobrescritas pelo sync em linhas existentes)

```
MANUAL_COLS = {"Demandante", "status", "laminas", "entregue", "linkDrive"}
```

O `sync.py` só preenche essas colunas em linhas **novas** (vazias por padrão). Em linhas existentes, ele preserva o que o Rafael escreveu — mesmo que o Jira mude.

### Coluna `nomeCurto` — exceção parcial

`nomeCurto` é auto-gerada na criação, **mas só recebe novo valor de sync se estiver vazia**. Se o Rafael editar manualmente, o sync respeita.

---

## 3. Hyperlinks rich-text

Quatro colunas usam o formato nativo do Sheets de link em texto: `TaskPai` (D), `TaskFilha` (E), `copy` (F), `linkDrive` (M).

Internamente isso é representado via `textFormatRuns` na API do Sheets (não como fórmula `=HYPERLINK(...)`). Quando o `sync.py` move uma linha para Finalizadas, usa `copyPaste` da Sheets API com `PASTE_NORMAL` — isso preserva todos os hyperlinks rich-text, incluindo o `linkDrive` editado manualmente.

**Para extrair a key da task filha de uma célula** (ex: para match): existe `ls.extract_filha_key(cell_value)` que parse a string visível (`MCA-12345`) e retorna a key. Funciona tanto com rich-text quanto com fórmula `=HYPERLINK`.

---

## 4. Ciclo de vida: Demandas ↔ Finalizadas

A cada run do `sync.py`:

1. **Lê** todas as linhas de Demandas e Finalizadas.
2. **Indexa** por `TaskFilha` key (extraída da coluna E).
3. **Recebe** o payload com as issues atuais do Jira que matcham o JQL.
4. **Aplica diff** com a seguinte lógica:

```
Para cada linha em Demandas:
  - status ∈ {feito, concluído, entregue, done}  → MOVER para Finalizadas
  - key não está no payload + status ∈ {vazio, pendente, aguardando, todo}  → DELETAR
  - key não está no payload + status tem outro valor  → PRESERVAR (cautela)
  - key está no payload  → ATUALIZAR campos auto (com write-conditional)

Para cada key no payload:
  - já em Demandas  → ver acima (será atualizada)
  - já em Finalizadas  → SKIPAR (não re-adicionar; provavelmente foi feita e voltou ao JQL por algum motivo)
  - nova  → ADICIONAR em Demandas
```

### Status normalizados

```python
FINISHED_STATUSES = {"feito", "concluido", "concluído", "entregue", "done"}
PENDING_STATUSES  = {"", "pendente", "aguardando", "todo"}
```

A comparação é case-insensitive (passa por `.strip().lower()`). Status que não estão em nenhuma das duas listas são tratados como "em andamento" e preservados se desaparecerem do payload (proteção contra glitches do Jira).

### Move via `copyPaste`

Mover uma linha para Finalizadas usa um único request `copyPaste` da Sheets API que copia o range A:N inteiro, preservando formato, hyperlinks, cores e fórmulas. Isso é mais robusto que reconstruir célula por célula (que perdia o `linkDrive` manual).

---

## 5. Fórmula `nomefinal` (coluna I)

Auto-gerada por `sync.py:nomefinal_formula_for_row(r)`. A fórmula real escrita na célula da linha `r`:

```
=LOWER(REGEXREPLACE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(
  IFERROR(REGEXEXTRACT(E{r};"([A-Z]+-\d+)");E{r})
  &"_"&A{r}&"_"&IF(ISBLANK(B{r});"";TEXT(B{r};"dd-mm"))
  &"_"&H{r}&"_"&G{r}
;" ";"-");".";"-");"+";"-")
;"-+";"-"))
```

**O que ela monta**, em ordem: `<id_filha>_<vertical>_<dd-mm>_<nomeCurto>_<demandante>`, depois normaliza:

- Lowercase tudo
- Espaços, pontos e `+` viram `-`
- Runs múltiplos de `-` colapsam pra um só (evita `---` quando o source tinha ` - `)

**Exemplo de saída:** `mca-62177_cfc_26-05_criativo-14-anúncio-estático-acaba-hoje_rafael`

Como é fórmula viva (referencia A, B, E, G, H), **basta editar qualquer dessas células que o nomefinal recalcula sozinho**. Não precisa rodar sync pra atualizar.

---

## 6. Coluna `Última Sync` (N) e write-conditional

`Última Sync` guarda o `jira_updated_at` da issue, formatado como `dd/mm/yyyy HH:MM:SS` em horário local.

**Função de guard:** antes de tocar campos auto numa linha existente, `update_jira_fields_in_row` compara o `Última Sync` que está na planilha com o `jira_updated_at` que veio do payload. Se **iguais**, a linha é skipada por inteiro — nenhum write é feito, economizando dezenas de chamadas à API Sheets por run quando o Jira está calmo.

Quando a task é tocada no Jira, o `updated` muda → `Última Sync` antigo ≠ novo → sync escreve atualização e sobrescreve `Última Sync`.

---

## 7. Tabela nativa e ordenação

- Demandas é re-ordenada por **Entrega ASC** ao final de cada sync (`sort_demandas_by_entrega`). Linhas sem data caem ao final.
- Após sort, `ensure_table` é chamada em ambas as abas. Isso cria/atualiza a tabela nativa (`DemandasTable`, `FinalizadasTable`) cobrindo do A1 até o último data row. A tabela nativa traz filtros, cores alternadas e validação de range automaticamente.

Se a tabela nativa ficar "quebrada" (estado inconsistente em bandedRanges/tables — sintoma: HTTP 500 do Sheets API ao abrir metadata), abrir a planilha no navegador → **clicar com botão direito na tabela → Converter para intervalo** → rodar `sync.py` que recria limpa.

---

## 8. Convenções para uma IA que vai operar nesta planilha

**Pode escrever em (com cautela):**
- `Demandante` (G), `status` (J), `laminas` (K), `entregue` (L), `linkDrive` (M) — colunas manuais.

**Não deve escrever em (vão ser sobrescritas no próximo sync):**
- `Vertical`, `Entrega`, `HoraEntrega`, `TaskPai`, `TaskFilha`, `copy`, `Última Sync` — colunas auto.
- `nomefinal` — é fórmula viva; substituir por valor literal quebra a recalculação.
- `nomeCurto` — auto na criação, manual depois. Se for editar, OK; o sync respeita.

**Match de linhas:** sempre por `TaskFilha` key (coluna E). Nunca por número de linha (pode mudar com sort) nem por `nomefinal` (mutável).

**Status reconhecidos:** se quiser mover uma task para Finalizadas, escrever `feito`, `concluido`, `concluído`, `entregue` ou `done` em `status`. O próximo sync move automaticamente. Para deletar uma task que sumiu do Jira, deixar `status` vazio ou em `pendente/aguardando/todo`.

**Hyperlinks:** ao escrever em `linkDrive` (M), preferir o formato nativo (clicar e colar URL) em vez de `=HYPERLINK(...)`. A sync.py preserva ambos via `copyPaste`, mas o formato nativo é o que o pipeline produz e fica mais consistente.

**Não duplicar:** antes de adicionar uma key, verificar se ela já está em Demandas OU Finalizadas. O sync já faz dedupe, mas operações manuais via API precisam respeitar.

**Ordenação:** não confiar na ordem das linhas. Após cada sync, Demandas é ordenada por Entrega ASC. Não escrever por offset de linha sem ler o sheet primeiro.

---

## 9. Esquema técnico (referência rápida)

| Item | Valor |
|---|---|
| Spreadsheet ID | `16NsWtEZ5yi_UipAPmEJc7_S_kT1WyiAdjts1QfmO5EQ` |
| Locale | `pt_BR` (separador de fórmula `;`) |
| Aba Demandas | título: `Demandas`, tabela: `DemandasTable` |
| Aba Finalizadas | título: `Finalizadas`, tabela: `FinalizadasTable` |
| Auth | Service Account (Google Cloud), credencial em `credentials.json` |
| Linha do header | 1, com freeze. Bold + fundo cinza claro. |
| Range das tabelas | A1:N{n_data_rows+1} (recalculado a cada sync) |

### Constantes-chave no código

```python
# lib_sheets.py
COLUMNS = [Vertical, Entrega, HoraEntrega, TaskPai, TaskFilha, copy,
           Demandante, nomeCurto, nomefinal, status, laminas, entregue,
           linkDrive, "Última Sync"]
MANUAL_COLS = {"Demandante", "status", "laminas", "entregue", "linkDrive"}
N_COLS = 14

# sync.py
FINISHED_STATUSES = {"feito", "concluido", "concluído", "entregue", "done"}
PENDING_STATUSES  = {"", "pendente", "aguardando", "todo"}
```

---

## 10. Exemplos de linha

**Demandas (linha típica em andamento):**

```
A: CFC
B: 2026-06-04
C: 14h
D: [MCA-62177] (link → jira.com/.../MCA-62177)
E: [MCA-62180] (link → jira.com/.../MCA-62180)
F: [copyDrive] (link → drive.google.com/.../doc-xyz)
G: Joana
H: cfc-fim-de-ano-encerramento
I: =LOWER(REGEXREPLACE(...))  → "mca-62180_cfc_04-06_cfc-fim-de-ano-encerramento_joana"
J: em andamento
K: 3
L:
M: [arte-v2] (link → drive.google.com/.../slide.pptx)
N: 04/06/2026 14:23:11
```

**Finalizadas (mesma linha após Rafael marcar `status = feito`):**

A linha é copiada inteira (com hyperlinks preservados) para o final de Finalizadas e removida de Demandas. `Última Sync` reflete o último timestamp do Jira no momento da movimentação.
