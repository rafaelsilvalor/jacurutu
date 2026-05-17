# Prompts — templates densos

Templates mais longos que workflows, geralmente usados **uma vez
por tarefa** em vez de "todo dia".

## Catálogo

- **`task-brief-template.md`** — template do brief
  (`docs/tasks/<NNN>-<slug>/brief.md`) pra criar antes de tarefa M
  ou L

## Diferença entre `prompts/` e `workflows/`

| `prompts/` | `workflows/` |
|---|---|
| Densos (100+ linhas) | Curtos (≤ 60 linhas) |
| Você adapta significativamente | Você cola quase sem mudar |
| Geram artefato (brief, doc) | Disparam ação |
| Uma vez por tarefa | Toda hora |

## Como gerar brief novo

Em vez de preencher template à mão, prefira usar
`init/07-create-brief.md` — agente entrevista você e gera o brief
adequado. Mais rápido e mais alinhado.

Use o template manual só se quiser revisar a estrutura ou começar
brief sem agente.
