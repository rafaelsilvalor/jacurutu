# Create CLAUDE.md

> **Contexto:** você está em sessão de bootstrap. Já fez Fase 1
> (diagnóstico). Agora vai gerar o `CLAUDE.md` desse projeto.

## O que é o `CLAUDE.md`

Documento **na raiz do projeto** que **toda sessão de agente IA
codando** carrega antes de tocar código. Ele:

- Define regras técnicas estritas (limites de tamanho, anti-patterns,
  convenções)
- Lista exceções documentadas
- Aponta documentos relacionados

## Estrutura recomendada

```markdown
# CLAUDE.md

> Project rules for AI agents. Read in full before any code change.

## Architecture
[1-2 parágrafos descrevendo o desenho geral do projeto]

## Hard Rules
[R1, R2, R3... regras numeradas, imperativas, verificáveis]

## Anti-patterns
[A1, A2, A3... padrões proibidos com motivo]

## Documented Exceptions
[E1, E2... exceções que valem por motivo específico]

## Related Documents
[Links pra docs/GOTCHAS.md, docs/GIT_WORKFLOW.md, etc.]
```

## Sua tarefa

Conduz o usuário a **gerar este documento por entrevista**. Não
copie template — descubra o que vale pra ESTE projeto.

### Passo 1 — Arquitetura

Pergunta:
- Como ele descreveria o desenho geral em 2-3 frases?
- Tem padrão arquitetural definido? (MVC? hexagonal? camadas? sem
  padrão?)
- Quais são os arquivos/pastas mais importantes?

**Você escreve a seção `## Architecture` baseado na resposta.**

### Passo 2 — Hard Rules

Pergunta um conjunto de áreas. Pra cada, decide se vira regra:

**Tamanho de funções/arquivos**
- Tem limites claros desejados? (ex: função ≤ 30 linhas, arquivo ≤
  500)
- Se não tem opinião, sugira padrão razoável pra linguagem dele

**Estilo de código**
- Tem linter configurado? (ESLint, ruff, etc.)
- Se sim, regra é "siga o linter, não burle"
- Se não, vale criar?

**Tratamento de erros**
- Erros silenciosos são tolerados? (geralmente não)
- Como deve fazer logging?

**Testes**
- Tem testes? Que tipo (unit, integration, e2e)?
- Cobertura mínima exigida?

**Dependências**
- Pode adicionar livremente ou precisa aprovação?
- Tem lista de bibliotecas preferidas/proibidas?

**Comentários**
- Quando comentar? (geralmente: "por quê", não "o quê")

**Qualquer outra área** que o usuário tenha forte opinião.

Escreve cada regra como **R1, R2, R3**, numerada, imperativa, com
critério verificável. Exemplo bom:

> **R3 — Funções públicas têm tamanho máximo de 40 linhas.**
> Verificável via `wc -l` ou contagem manual.

Exemplo ruim (vago):

> **R3 — Funções devem ser pequenas.**

### Passo 3 — Anti-patterns

Pergunta o que ele já viu dar errado em projetos anteriores OU em
projetos parecidos. Cada problema vira anti-pattern.

Pergunte sobre as áreas comuns:

- Try/catch silencioso (engole erro)
- Estado global mutável
- Magic numbers em vez de constantes nomeadas
- Comentários "TODO:" sem dono ou prazo
- Mixagem de responsabilidades em uma função/classe
- Cópia-cola em vez de extrair função

Pra cada, **só vira A1, A2...** se faz sentido pra este projeto. Não
imponha lista genérica.

### Passo 4 — Documented Exceptions

Pergunte: "tem algo que viola as regras acima mas precisa
permanecer?"

Geralmente projetos novos não têm exceções ainda. **Tudo bem deixar
vazio com `<!-- nenhuma exceção até agora -->`.** Vai crescer com
uso.

### Passo 5 — Geração do arquivo

Compile tudo num único `CLAUDE.md` e crie o arquivo. Mostre pro
usuário baixar.

Inclua no topo o trailer padrão de leitura obrigatória:

```markdown
# CLAUDE.md

> **Para agentes IA codando neste projeto:** leia este arquivo
> inteiro antes de qualquer mudança em código. As regras (R) são
> obrigatórias. Os anti-patterns (A) são proibidos. Exceções (E)
> são as únicas violações toleradas.
>
> Atualização: quando descobrir nova regra, adicione aqui. Quando
> uma regra virar inviável, adicione exceção em vez de remover —
> preserva histórico.
```

## Princípios pra escrever bem

- **Imperativo**, não descritivo. "Funções têm ≤ 40 linhas", não
  "Funções devem ser curtas"
- **Verificável**, não subjetivo. "Sem `try/catch` sem log", não
  "Trate erros adequadamente"
- **Conciso.** Cada regra cabe em 1-3 linhas. Detalhe vai pra
  documento auxiliar se necessário
- **Numerado** (R1, R2, A1, A2, E1, E2). Permite referência futura
  ("isso viola R3")

## Após gerar

- Confirme com o usuário se cobriu tudo importante
- Se sim, crie o arquivo, apresente pra download
- Se faltou algo, ajusta antes de finalizar
- **Próximo:** lê `init/03-create-mentor-brief.md` e continua
