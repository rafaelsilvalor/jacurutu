# Jacurutu

Área de trabalho do time de design da Estratégia. Centraliza modelos, produção diária e diagnóstico de arquivos em uma única interface — abre PSDs, AIs, INDDs e imagens direto no app padrão (Photoshop, Illustrator, InDesign).

> *"O Jacurutu enxerga no escuro. Você cuida da arte."*

## Por que "Jacurutu"?

O jacurutu — nome brasileiro do maior corujão das Américas — caça no escuro e voa sem fazer barulho. Enxerga o que ninguém enxerga e chega sem que se perceba.

Aqui a metáfora é essa: o jacurutu atravessa a **burocracia** no escuro e em silêncio. Caminhos de pasta, convenções de nome, links entre Jira e Drive, transições de status, uploads — tudo que separa "vou criar uma arte" de "a arte está entregue" acontece fora do seu campo de visão. O designer vê a tarefa e o arquivo; a infraestrutura some.

É a mesma discrição, mirando o alvo certo.

## Funcionalidades atuais

- Configuração da pasta raiz na primeira execução (cada designer aponta para a sua cópia local).
- Sidebar com todas as marcas e categorias (ECJ, OAB, EC, Engenharia, Saúde, Blog, Mockups...).
- Grid de arquivos com **pré-visualização real**:
  - PSD: extrai a JPEG embutida (instantâneo); se não houver, renderiza o composite via `ag-psd` em **worker thread separada** (não trava a UI).
  - PNG, JPG, GIF, WEBP: preview nativo.
- Cache de thumbnails em disco, indexado por hash de caminho + data de modificação. Regeneração automática quando o arquivo muda.
- Busca rápida (atalho `Ctrl+F`).
- Botão **Abrir** — abre no app padrão.
- Botão **📁** — mostra no Windows Explorer.
- Recarregar lista (`⟳`) e trocar pasta a qualquer momento.

## Roadmap

Visão completa, fases e milestones: [`docs/ROADMAP.md`](docs/ROADMAP.md).

Resumo: o projeto está em transição de **navegador de assets** para **orquestrador de workflow** centrado em tasks (Jira → produção local → Drive → fechar task). A fundação (storage layer, registries, command palette, multi-source) precede as features de produção (M5.1 — tasks com import + cards; M5.2-5.5 — export, upload, fechar task). Os itens antes listados aqui (diagnóstico de PSD, auditoria em massa, favoritos) ficam preservados como nota de exploração (`docs/explorations/asset-browser-revival.md`).

## Arquitetura

- **Electron + worker_threads** — UI responsiva mesmo durante render de PSD pesado.
- **Pool de 2 workers** processando PSD em paralelo, com timeout e respawn automático.
- **ag-psd** + **jimp** + parser binário próprio para extrair a JPEG embutida em PSDs (sem precisar abrir o arquivo inteiro).
- **Cache em `%APPDATA%\Saci\thumb-cache`** — invisível ao usuário, regenera quando necessário.

## Como rodar em desenvolvimento

Pré-requisitos: [Node.js](https://nodejs.org/) 18+ instalado.

```bash
cd estrategia-dashboard
npm install
npm start
```

Na primeira vez, o app vai pedir pra selecionar a pasta `Modelos`. Aponte para `D:\Content\Trabalho\EstrategiaConcursos\Modelos` (ou onde estiver no PC do designer).

A configuração fica em `%APPDATA%\Saci\config.json` e persiste entre sessões.

## Variáveis de ambiente da CLI

A CLI `jacurutu` (v2) lê toda a sua configuração do ambiente — nenhum segredo fica no repositório. São cinco variáveis:

| Variável | Lida por | O que é |
|---|---|---|
| `JACURUTU_JIRA_BASE_URL` | `jacurutu fetch`, `jacurutu start <KEY>` | URL do site Jira, ex. `https://estrategia.atlassian.net` |
| `JACURUTU_JIRA_EMAIL` | `jacurutu fetch`, `jacurutu start <KEY>` | E-mail da conta Atlassian — metade do Basic auth |
| `JACURUTU_JIRA_API_TOKEN` | `jacurutu fetch`, `jacurutu start <KEY>` | Token de API da Atlassian — a outra metade |
| `JACURUTU_IDENTITY_FILE` | `jacurutu start` | Caminho do arquivo de identidade. Ausente ou vazia, cai no padrão `~/.jacurutu/identity.json` |
| `JACURUTU_TELEMETRY_DIR` | hooks de gate | Destino do stream `gates.jsonl`. Existe para os testes; em produção o caminho é derivado da localização do próprio módulo |

As três `JACURUTU_JIRA_*` são obrigatórias nos comandos que falam com o Jira. Faltando qualquer uma, o comando falha nomeando exatamente as que faltam — nunca as três em bloco, para que um erro de digitação no nome apareça.

`jacurutu export`, `jacurutu report` e `jacurutu start --local` não leem nenhuma delas.

O estado por usuário fica em `~/.jacurutu/`: credenciais OAuth do Google (`token.json`), identidade do designer (`identity.json`) e estado dos relatórios (`report.json`).

> Renomeadas de `SACI_*` e `~/.saci` em 2026-08-19. Não existe leitura compatível com os nomes antigos — quem já tem o diretório precisa movê-lo e reexportar as variáveis.

## Como gerar o instalador para a equipe

```bash
npm run build:win
```

Saídas em `dist/`:

- `Saci Setup x.x.x.exe` — instalador NSIS (cria atalho na área de trabalho).
- `Saci x.x.x.exe` — versão portable (não precisa instalar).

## Atalhos de teclado

- `Ctrl + F` — focar a busca
- `Esc` (com a busca focada) — limpar busca
- `Duplo clique` num card — abrir o arquivo

## Estrutura do projeto

```
estrategia-dashboard/
├── package.json
├── main.js               # Main process: scan, IPC, worker pool
├── preload.js            # Bridge segura entre main e renderer
├── psd-worker.js         # Worker thread: render PSD via ag-psd
├── renderer/
│   ├── index.html
│   ├── styles.css
│   └── app.js            # Front: busca, render, lazy load
└── README.md
```

## Origem do nome

Jacurutu — nome brasileiro do corujão-orelhudo (*Bubo virginianus*), a maior coruja das Américas. Noturno, silencioso, enxerga onde não há luz. Daí o nome.

## Licença

Uso interno — Estratégia.
