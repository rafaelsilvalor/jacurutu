# Session recap — 2026-05-28 — mentor — saci-repositioning-individual-prod-assistant

**Mode:** mentoring (chat-mode design conversation; no brief, no code, no PR).
**Mentor:** Claude Chat (this session).
**Continuation of:** `docs/sessions/2026-05-28-mentor-verb-allowlist-and-process-reset.md`
(closed via operational-hygiene PR; brief 016 monorepo bootstrap merged via PR #33).

Dense product-design session. User uploaded the full Python automation (`automation/` —
13 files, 3235 LOC) for chat to read, then walked through a series of decisions that
**reposition the entire system**: from "Jira→Sheets coordination pipeline with
production as an annex" to "individual local production assistant with coordination
as a secondary aggregation surface". Phase 2 of the ROADMAP, which was about to be
modeled, now requires upstream docs reconciliation before the technical port can
proceed. No artifact larger than this recap was produced (M-R15 respected).

## Decisões tomadas

### Sobre a identidade do sistema

- **Sistema é assistente individual de produção, não pipeline de coordenação.** A função
  principal do Saci v2 é automatizar as ações repetitivas em torno de uma task Jira
  (criar pasta, encontrar template, abrir Photoshop, subir pro Drive) pra que o designer
  só faça arte. Pipeline Jira→Sheets passa a ser caso de uso secundário (visão agregada
  pra gerência/coordenação não-designer). → atualizar em:
  `docs/ROADMAP.md` §Identity shifts (nova entrada datada 2026-05-28);
  `docs/MENTOR_BRIEF.md` §2 (reescrita parcial).

- **Aplicação é per-machine; tasks são portáveis via metadado leve no Drive.** Cada
  designer tem sua instância local — sem servidor, sem sync entre máquinas. Mas cada
  task carrega um `TaskManifest` (arquivo JSON leve) que vive na pasta dela no Drive e
  permite outra máquina dar `saci load <url>` e reconstituir o contexto (sem precisar
  refazer fetch do Jira). Caso de uso explícito: designer B retomar/alterar peça de
  designer A. → atualizar em: `docs/ROADMAP.md` §Phase 3 (handoff entra como caso de
  uso primário, sai do parking lot).

### Sobre as fases (inversão de prioridade)

- **Phase 2 escopo expandido:** além do port de `lib_transform.py` (puro), inclui
  desenho dos tipos `Workspace` e `TaskManifest` no `core` como interfaces TS.
  Continua sem I/O. Implementação dos comandos é Phase 3. → atualizar em:
  `docs/ROADMAP.md` §Phase 2.

- **Phase 3 reescrita pra núcleo do produto:** storage local (2 categorias de dado),
  comandos (`fetch`/`list`/`start`/`ship`/`load`/`status`), match de template (3
  níveis), derivação de caminho Drive (função pura), manifest read/write. → atualizar
  em: `docs/ROADMAP.md` §Phase 3.

- **Phase 4 redimensionada:** Sheets como visão agregada secundária, alimentada
  unidirecionalmente pela aplicação (designers publicam, não consomem). Granularidade
  (eventos? consolidados diários? snapshot?) fica em aberto pra decisão na modelagem
  de Phase 4. → atualizar em: `docs/ROADMAP.md` §Phase 4.

### Sobre conceitos centrais (entram em `core`/Phase 2)

- **Storage local é cache reproduzível**, não fonte de verdade. Duas categorias de
  dado:
  (a) espelho do Jira (sobrescrevível a cada fetch);
  (b) estado local de produção (nunca sobrescrito pelo fetch).
  Storage perdido não destrói trabalho: issues recriáveis do Jira; tasks ativas
  recriáveis do Drive via manifests. → entra no design de Phase 2/3.

- **`Workspace`** é a abstração central: chave Jira + pasta local + template aplicado
  + estado + caminho Drive + manifest. Cinco facetas amarradas por chave Jira. →
  entra como tipo TS em `packages/core/` em Phase 2.

- **`TaskManifest`** é a unidade portável: arquivo `.saci.json` (ou similar) na pasta
  Drive da task, contém snapshot da issue no `start`, template usado, drive_path,
  histórico de eventos (start/ship/load/handoff), opcionalmente `claimed_by` pra
  defesa contra edição concorrente. → entra como tipo TS em `packages/core/` em
  Phase 2; serialização em Phase 3.

- **Derivação de caminho Drive é função pura.** Dado uma issue, existe
  `derivePath(issue) → string` determinística baseada em vertical + campanha + data
  + nome. Conventional Drive hierarchy hoje é tácita; será formalizada como código
  (regra explícita) em Phase 3. → função pura em `packages/core/`.

- **Match de template em 3 níveis.** (1) Determinístico — sinais explícitos fortes →
  modelo certo, sem confirmação; (2) Sugestão com confirmação — sinais médios →
  sistema sugere, designer confirma/escolhe outro; (3) Manual — designer escolhe da
  lista. MVP cobre níveis 1 e 3; nível 2 entra quando heurísticas amadurecem.
  Bypass: `saci start <key> --template <name>`. → entra em Phase 3.

### Sobre o caminho operacional

- **Caminho A confirmado:** próxima sessão é `modelar tarefa` pro brief 017
  docs-only (ROADMAP + MENTOR_BRIEF reposicionamento). Phase 2 técnica vem numa
  terceira sessão. Rationale: separação limpa, aderente à hygiene operacional
  reforçada na sessão anterior; brief de docs estabiliza o desenho antes do código.

## Pendências abertas

### Alta prioridade — afeta próxima sessão

- **Brief 017 docs-only — escopo a fechar na modelagem.** Edits prováveis:
  (a) ROADMAP `§Identity shifts` nova entrada 2026-05-28;
  (b) ROADMAP §Phase 2 escopo expandido (workspace + manifest types);
  (c) ROADMAP §Phase 3 reescrita (núcleo do produto, comandos, storage local,
      match template, derivação Drive, manifest);
  (d) ROADMAP §Phase 4 redimensionada (Sheets agregada, granularidade aberta);
  (e) ROADMAP §Parking lot — handoff designer↔designer sai (entra em Phase 3);
  (f) MENTOR_BRIEF §2 reescrita parcial refletindo nova identidade;
  (g) `docs/MENTOR_BRIEF.md` §2 também precisa atualizar as integrações pendentes
      (Jira REST direto já estava lá; Drive vira integração de primeira classe;
      Sheets passa a secundária);
  (h) ROADMAP §Pending decisions — possíveis novas entradas (formato manifest,
      formato storage local, granularidade Sheets).
  Caminho B padrão; planner agent escreve o brief. Sessão futura define exatamente
  o conjunto de Edits.

- **P4 numbering verification a aplicar na próxima sessão.** Três fontes:
  `ls docs/tasks/`, `git log --oneline main`, reserves em CLAUDE.md E*. Slot 017
  é o próximo candidato natural (após 016 mergeado), mas confirmar antes de fixar.

### Decisões deferidas pra Phase 3 modeling (não bloqueiam brief 017)

- **Regra exata da hierarquia Drive.** Hoje convenção tácita: vertical + campanha
  + data + nome. Formalização vira código de domínio. Pode começar com proposta
  inicial e iterar.
- **Catálogo de templates:** onde mora, como é editado, formato dos metadados.
- **Regras determinísticas de match nível 1:** quais sinais determinam qual
  template, na forma código (não config — começa código, vira config quando
  estabilizar, regra-de-três).
- **Granularidade Sheets:** evento? consolidado diário? snapshot? — Phase 4.
- **Resolução de conflitos no `ship`:** sobrescreve / merge / sufixa _v2. Decisão
  no primeiro caso real, não antecipar.
- **`claimed_by` no manifest:** desenho fino — quanto tempo de "claim"? auto-libera?
  manual?
- **`saci ship` — o que sobe:** pasta inteira? filtros (sem `.psd~`, sem swaps)?
- **Renomeação local → Drive:** pasta local nome igual ao Drive, ou transformação?
- **Comandos secundários do MVP:** `cancel`, `reopen`, `archive`, `notes` — quais
  entram, quais ficam pra depois.

### Pendências carregadas — status

- **`ProductionFlow` / `Workspace` abstraction:** **endereçada nesta sessão.**
  Emergiu como `Workspace` + `TaskManifest`. Sai do "deferido até Phase 2 port" pra
  "tem desenho conceitual, vira tipos TS em Phase 2, implementação em Phase 3".
- **JS libraries pra Jira REST e Google Sheets adapters:** pré-Phase-4 ainda
  pendente. Drive adapter (nova primeira-classe) também precisa de research de lib
  JS (Google Drive API). Adicionar ao pendente.
- **"Old 013" carry-over** (executor memory placement, no-verbal-override pattern,
  draft skill promotion): segue deferido. Phase 2 técnica vai dar mais dados.
- **Brief 012 R10 subject-length errata:** histórico, sem urgência.

## Artefatos gerados

- **Este recap** — `docs/sessions/2026-05-28-mentor-saci-repositioning-individual-prod-assistant.md`
  (entregue em `/mnt/user-data/outputs/` ao final desta resposta; usuário salva via
  caminho B).

Nenhum brief, nenhum código, nenhum PR produzido nesta sessão. Conforme M-R15,
sessão de mentoria entrega prose; planner produz brief.

## Próxima ação concreta

Abrir nova sessão de chat em modo **modelar tarefa**. Target: **brief 017 —
docs reposicionamento (Saci como assistente individual de produção)**. Sessão vai
carregar contexto §8 modelar (CLAUDE.md, MENTOR_BRIEF.md, AGENT_PLAYBOOK.md,
GIT_WORKFLOW.md, GOTCHAS.md, brief-template skill) + este recap, e produzir
brief 017. Caminho B padrão. P4 (verificação de numeração) aplicado antes de
fixar 017.

Brief 017 NÃO inclui:
- Código (Phase 2 técnica é brief separado, depois de 017 mergeado).
- Implementação dos comandos (Phase 3, depois de Phase 2).
- Adapter Drive (Phase 3+).

## Snippet pra colar na próxima sessão

```
Olá. Modo: modelar tarefa.

Continuação de 2026-05-28-mentor-saci-repositioning-individual-prod-assistant.

Sessão produziu reposicionamento do Saci v2: deixa de ser pipeline
Jira→Sheets e vira assistente individual de produção. Sheets é caso
de uso secundário (visão agregada). Cada designer tem instância local;
tasks são portáveis via TaskManifest no Drive (handoff designer↔designer).

Phase 2 ganha escopo: além do port de lib_transform.py, desenha tipos
Workspace e TaskManifest em core. Phase 3 vira núcleo do produto.
Phase 4 redimensiona Sheets pra agregação.

Próxima ação: modelar brief 017 docs-only — atualizar ROADMAP §Identity
shifts (nova entrada 2026-05-28), §Phase 2/3/4 reescritas, §Parking lot,
e MENTOR_BRIEF §2. Caminho B. P4 aplicado antes de fixar 017.

Phase 2 técnica vem na sessão seguinte, depois de 017 mergeado.
```
