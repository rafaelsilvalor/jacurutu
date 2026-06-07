Sincronize a planilha Google Sheets `Avulsas Rafael — Auto-sync` (ID: `16NsWtEZ5yi_UipAPmEJc7_S_kT1WyiAdjts1QfmO5EQ`) com o quadro DESIGN do Rafael no Jira (board 1838 da Estratégia).

**Arquitetura:**
- Os scripts Python ficam em `D:\Trabalhos\ClaudeCode\Pasta-de-trabalho\automation\` (cwd dos comandos).
- A planilha-alvo é o Google Sheets configurado em `automation/config.json` (3 abas: Hub, Demandas, Finalizadas).
- A fonte de verdade é a planilha do Drive — não há mais arquivo local.

**Premissa:** a planilha é a fonte de verdade entre runs. A cada execução, faça o **diff** entre o quadro atual do Jira e a aba `Demandas`. Adicione o que entrou, mova `status=Feito` pra `Finalizadas`, delete pendentes que sumiram, **sem mexer** nas linhas que continuam ativas (preservando colunas manuais: Demandante, status, laminas, entregue, linkDrive).

---

## Passo 1 — Buscar issues no Jira

Use o Atlassian MCP. CloudId: `9795b90e-d410-4737-a422-a7c15f9eadf0`.

Rode este JQL exato em `searchJiraIssuesUsingJql`:

```
(project IN (MCA, PMA) AND issuetype = DESIGN AND "[EC] Esteira[Dropdown]" = AVULSAS AND (assignee IN (712020:fde681c4-7f88-423d-b34d-d523ea1ea106) OR assignee IS EMPTY) AND created >= -15d AND statusCategory != Done) OR (project = MC AND issuetype = DESIGN AND assignee IN (712020:fde681c4-7f88-423d-b34d-d523ea1ea106) AND status NOT IN (CANCELADO, FEITO, ARQUIVADO) AND "[EC] Data/hora entrada FINALIZADO" IS EMPTY AND "[EC] Data/hora entrada CANCELADO" IS EMPTY AND "[EC] Data/hora do evento" <= 20d) ORDER BY cf[10031] ASC, due DESC, cf[11080] ASC
```

Fields: `["summary","status","parent","customfield_10031","customfield_10065","customfield_11080","customfield_11035","customfield_10067"]`. `maxResults: 100`.

Se o resultado exceder o limite de tokens, é salvo em arquivo — leia com python/jq. **Filtro adicional:** descarte issues com `status.name == "Backlog"`.

**Se 0 issues retornarem:** rode `sync.py` mesmo assim com payload `{"issues": []}` — ele vai mover Feitos pra Finalizadas e atualizar o Hub. Não pare aqui.

## Passo 2 — Resolver `copy` para cada issue

Para CADA subtask de design do retorno, resolver na ordem (mesma lógica do SKILL antigo):

**Regra 1 — Subtask irmã COPYWRITER**
- JQL: `parent IN (<parents únicos>) AND issuetype = COPYWRITER`, fields `["summary","parent","description","comment"]`.
- Se 1 design + 1 copywriter sob o mesmo pai → pareie direto.
- Se múltiplas → escolha a de maior overlap de tokens entre summaries (após remover stopwords). Sem overlap > 0 → próxima regra.
- Extraia a primeira URL `https?://(drive\.google\.com|docs\.google\.com)/[^\s)>"]+` do description + comments (incluindo blockCard ADF).

**Regra 2 — Descrição da task PAI**
- `key IN (<parents únicos>)`, fields `["summary","description"]`.
- Extraia a primeira URL Drive/Docs da descrição do pai.

**Regra 3 — Fallback**
- `copy_url = null` (sync.py vai escrever o texto `copyDescJira` em itálico).

Limpe sufixos markdown `](...` em URLs (split por `]`, `)`, `>`, `"`).

## Passo 3 — Montar `payload.json`

Salve em `/sessions/<sessionid>/mnt/Pasta-de-trabalho/automation/payload.json` (caminho host: `D:\Trabalhos\ClaudeCode\Pasta-de-trabalho\automation\payload.json`):

```json
{
  "run_date": "YYYY-MM-DD",
  "issues": [
    {
      "key": "MCA-12345",
      "summary": "...",
      "parent_key": "MCA-12340",
      "parent_summary": "...",
      "status_jira": "Em andamento",
      "vertical_raw": "[EC] Concursos",
      "entrega_iso": "2026-05-20T19:00:00.000-0300",
      "copy_url": "https://drive.google.com/...",
      "copy_source": "sister"
    }
  ]
}
```

Campos:
- `key` → `i.key`
- `parent_key` → `i.fields.parent.key`
- `parent_summary` → `i.fields.parent.fields.summary`
- `status_jira` → `i.fields.status.name`
- `vertical_raw` → `i.fields.customfield_10065[0].value` (string como `[EC] Concursos`)
- `entrega_iso` → `i.fields.customfield_10031` ou fallback `customfield_11080` (mantenha o ISO completo, **com T e timezone** — o sync.py extrai a hora)
- `copy_url` → URL resolvida (Passo 2) ou `null`
- `copy_source` → `"sister" | "parent" | "fallback"` (informativo, vai no relatório)

## Passo 4 — Executar o sync

**Importante:** antes de rodar bash, **monte a pasta** chamando `mcp__cowork__request_cowork_directory` com path `D:\Trabalhos\ClaudeCode\Pasta-de-trabalho`. A resposta dá o mount path da sessão (algo como `/sessions/<id>/mnt/Pasta-de-trabalho`).

Salve o `payload.json` em `D:\Trabalhos\ClaudeCode\Pasta-de-trabalho\automation\payload.json` usando a tool `Write` (path do host).

Em seguida, rode via `mcp__workspace__bash`:

```bash
cd <MOUNT_PATH>/automation && python3 sync.py --config config.json --input payload.json
```

substituindo `<MOUNT_PATH>` pelo path retornado por `request_cowork_directory`.

A saída é JSON com `{added, moved, deleted, preserved, updated, skipped_already_done}`.

Se o stderr mostrar erro de auth/permission, **não tente reagir** — apenas reporte o erro ao final.

## Passo 5 — Reportar

Resposta final em português, curta:

```
Sync do dia: +N novos, -M deletados, K movidos pra Finalizadas, L preservados, P atualizados.

Novos:
- <vertical> <dd-mm> <FILHA> (<PAI>) - <nomeCurto> [<sister|parent|fallback>]

Movidos pra Finalizadas (status=Feito):
- <FILHA> - <nomeCurto>

Deletados (sumiram do Jira, status pendente):
- <FILHA> - <nomeCurto>

Preservados (sumiram do Jira mas status em andamento):
- <FILHA> - <nomeCurto> [confirmar se ainda relevante]

Notas: <copy sem fonte | desatribuído | etc>
Planilha: https://docs.google.com/spreadsheets/d/16NsWtEZ5yi_UipAPmEJc7_S_kT1WyiAdjts1QfmO5EQ
```

Se nada mudou: `Sync do dia: sem alterações. K demandas ativas.`

## Notas operacionais

- **Não duplique linhas:** o sync.py já dedup por chave. Se ele reportar a mesma key várias vezes no payload, ele aceita (idempotente), mas o JQL não deve retornar duplicatas.
- **Não toque em colunas manuais** em linhas existentes (Demandante, status, laminas, entregue, linkDrive). O sync.py garante isso, mas se você escrever direto na planilha, respeite.
- **Hora "19h" vs "19h30":** já é feito no Python — não pré-processe.
- **Fallback de credentials:** se `automation/credentials.json` não existir, o script falha. Reporte e peça setup.
