"""
fetch.py — busca issues no Jira e monta payload.json para o sync.py.

Substitui os Passos 1 e 2 que antes o Claude fazia via Atlassian MCP.
Roda em Python puro contra a REST API do Jira Cloud, sem MCP.

Uso:
  python3 fetch.py --config config.json --output payload.json

Schema do payload.json gerado (v2.0):
{
  "schema_version": "2.0",
  "run_date": "2026-05-14",
  "generated_at": "2026-05-14T10:30:00-03:00",
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
      "copy_source": "sister",
      "jira_updated_at": "2026-05-14T08:15:30.123-0300"
    }
  ],
  "filtered_out": [{"key": "MCA-62108", "reason": "Backlog"}],
  "warnings": [
    {"key": "MCA-62200", "field": "entrega_iso", "issue": "customfield_10031 e fallback ausentes"}
  ]
}

Falhas graciosas: cada issue é processada num try/except isolado. Quando um campo
falha, ele recebe valor fallback (vazio ou null) e a issue continua sendo
incluida no payload, com o problema registrado em `warnings`.

Dependencias: requests (pip install requests).
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from typing import Optional, Iterable

import requests
from requests.auth import HTTPBasicAuth

# Forca UTF-8 no stdout/stderr pra rodar em Windows PowerShell (cp1252 default)
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass




SCHEMA_VERSION = "2.0"

# Default field list pra search/jql do Jira
JIRA_FIELDS = [
    "summary",
    "status",
    "parent",
    "updated",
    "customfield_10031",  # Data/hora do evento (entrega primaria)
    "customfield_10065",  # Vertical (array com .value)
    "customfield_11080",  # Fallback de entrega
    "customfield_11035",
    "customfield_10067",
]

# JQL do Passo 1 — duas lentes:
#  A) Avulsas DISPONIVEIS no quadro MCA (sem dono) — o "estoque" pra voce pegar
#  B) MINHAS tasks em qualquer projeto, ainda ativas
#     Filtros especificos do MC (livecast/evento) aplicados so quando project=MC
MAIN_JQL_TEMPLATE = (
    # Parte A: avulsas MCA+PMA em "Fila de Execucao", sem dono
    # (replica o board filter do quadro 333 + filtro de status pra so pegar
    # tasks realmente disponiveis pra puxar)
    '(project IN (MCA, PMA) '
    'AND issuetype = DESIGN '
    'AND "[EC] Esteira[Dropdown]" = AVULSAS '
    'AND status = "FILA DE EXECUCAO" '
    'AND assignee IS EMPTY '
    'AND summary !~ "Template") '

    'OR '

    # Parte B: minhas, mas APENAS dentro do escopo Avulsas:
    #  - MCA/PMA com esteira = AVULSAS, OU
    #  - MC (com filtros de livecast/evento)
    # Demais projetos/esteiras NAO entram.
    '(assignee IN ({user_id}) '
    'AND issuetype = DESIGN '
    'AND statusCategory != Done '
    'AND summary !~ "Template" '
    'AND ('
    '(project IN (MCA, PMA) AND "[EC] Esteira[Dropdown]" = AVULSAS) '
    'OR '
    '(project = MC '
    'AND status NOT IN (CANCELADO, FEITO, ARQUIVADO) '
    'AND "[EC] Data/hora entrada FINALIZADO" IS EMPTY '
    'AND "[EC] Data/hora entrada CANCELADO" IS EMPTY '
    'AND "[EC] Data/hora do evento" <= 20d)'
    ')) '

    'ORDER BY cf[10031] ASC, due DESC, cf[11080] ASC'
)

# Regex pra URLs do Google Drive/Docs (mesmo padrao do SKILL antigo)
DRIVE_URL_RE = re.compile(
    r'https?://(?:drive\.google\.com|docs\.google\.com)/[^\s)>"\]]+',
    re.IGNORECASE,
)

# Stopwords pra calculo de overlap entre summaries de design x copywriter
STOPWORDS_PT = {
    "a", "o", "as", "os", "um", "uma", "uns", "umas",
    "de", "do", "da", "dos", "das",
    "em", "no", "na", "nos", "nas",
    "e", "ou", "mas", "que", "se",
    "para", "por", "com", "sem", "sobre", "sob",
    "sua", "seu", "suas", "seus", "ele", "ela", "eles", "elas",
    "este", "esta", "isto", "esse", "essa", "isso", "aquele", "aquela", "aquilo",
    "ao", "aos", "à", "às",
    "-", "|", "–", "—", ":", ";", "(", ")", "[", "]",
    # tokens muito genericos do dominio
    "arte", "artes", "card", "lamina", "laminas", "design",
}


# ============================================================================
# CONFIGURACAO
# ============================================================================

def load_config(path: str) -> dict:
    """Le o config.json existente da automacao."""
    with open(path, "r", encoding="utf-8") as f:
        cfg = json.load(f)
    # Campos requeridos pro Jira
    required = ["jira_user_id"]
    for k in required:
        if not cfg.get(k):
            raise RuntimeError(
                f"config.json missing '{k}'. Adicione ao arquivo: {path}"
            )
    # Defaults opcionais
    cfg.setdefault("jira_api_base", "https://estrategia.atlassian.net")
    cfg.setdefault("jira_credentials_path", "./jira_credentials.json")
    cfg.setdefault("filtered_statuses", ["Backlog"])
    return cfg


def load_jira_credentials(path: str) -> tuple[str, str]:
    """Le email + token Atlassian do arquivo jira_credentials.json."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            creds = json.load(f)
    except FileNotFoundError:
        raise RuntimeError(
            f"Arquivo de credenciais Jira nao encontrado em {path}. "
            "Crie o arquivo com {{\"email\": \"seu@email.com\", \"api_token\": \"...\"}}. "
            "Pra gerar token: id.atlassian.com -> Security -> API tokens."
        )
    email = (creds.get("email") or "").strip()
    token = (creds.get("api_token") or creds.get("token") or "").strip()
    if not email or not token:
        raise RuntimeError(
            f"Credenciais Jira invalidas em {path}. Esperado JSON com 'email' e 'api_token'."
        )
    return email, token


# ============================================================================
# JIRA REST API
# ============================================================================

class JiraClient:
    def __init__(self, base_url: str, email: str, api_token: str):
        self.base_url = base_url.rstrip("/")
        self.auth = HTTPBasicAuth(email, api_token)
        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "application/json",
            "Content-Type": "application/json",
        })

    def search_jql(self, jql: str, fields: list[str], max_results: int = 100) -> list[dict]:
        """Roda um JQL e retorna a lista de issues raw da API.

        Usa o endpoint POST /rest/api/3/search/jql (novo padrao da Atlassian
        Cloud — substituiu /rest/api/3/search em 2025). Paginacao via cursor
        (nextPageToken) em vez de offset (startAt).
        """
        url = f"{self.base_url}/rest/api/3/search/jql"
        all_issues = []
        next_token = None
        page_size = min(max_results, 100)

        while True:
            body = {
                "jql": jql,
                "fields": fields,
                "maxResults": page_size,
            }
            if next_token:
                body["nextPageToken"] = next_token

            resp = self.session.post(url, json=body, auth=self.auth, timeout=30)
            if resp.status_code != 200:
                raise RuntimeError(
                    f"Jira API erro {resp.status_code}: {resp.text[:500]}"
                )
            data = resp.json()
            issues = data.get("issues", [])
            all_issues.extend(issues)

            next_token = data.get("nextPageToken")
            is_last = data.get("isLast", next_token is None)

            if is_last or not next_token or len(all_issues) >= max_results:
                break

        if len(all_issues) >= max_results:
            print(
                f"[fetch.py] Aviso: JQL retornou >= {max_results} issues, podem haver mais.",
                file=sys.stderr,
            )
        return all_issues[:max_results]


# ============================================================================
# ADF WALKER — extracao de URLs e texto de descriptions/comments
# ============================================================================

def adf_extract_urls(node) -> Iterable[str]:
    """Walker recursivo do Atlassian Document Format (ADF). Yields todas as URLs
    encontradas em links, inlineCards, blockCards e texto cru.

    Filtragem pra Drive/Docs eh feita pelo chamador, nao aqui — queremos ser
    permissivos pra logging/debug.
    """
    if not isinstance(node, dict):
        return

    node_type = node.get("type")

    # inlineCard, blockCard, mediaSingle: URL fica em attrs.url
    if node_type in ("inlineCard", "blockCard", "embedCard", "mediaSingle"):
        attrs = node.get("attrs") or {}
        url = attrs.get("url")
        if url:
            yield url

    # text node: pode ter URL em marks tipo "link", ou texto cru
    if node_type == "text":
        text = node.get("text") or ""
        # Marks com type=link
        for mark in (node.get("marks") or []):
            if mark.get("type") == "link":
                href = (mark.get("attrs") or {}).get("href")
                if href:
                    yield href
        # URL crua no texto
        for m in DRIVE_URL_RE.finditer(text):
            yield m.group(0)

    # Recurse em content
    for child in (node.get("content") or []):
        yield from adf_extract_urls(child)


def adf_extract_drive_urls(node) -> list[str]:
    """Extrai apenas URLs do Google Drive/Docs, em ordem de aparicao, deduplicadas."""
    seen = set()
    out = []
    for url in adf_extract_urls(node):
        # Filtra pra Drive/Docs
        if not DRIVE_URL_RE.match(url):
            continue
        # Limpa sufixos markdown como ](... ou ) ou >
        clean = url
        for sep in (")", "]", ">", '"'):
            clean = clean.split(sep)[0]
        if clean and clean not in seen:
            seen.add(clean)
            out.append(clean)
    return out


def adf_extract_text(node) -> str:
    """Extrai texto plano de ADF — concatena todos os text nodes. Util pra fallback."""
    if not isinstance(node, dict):
        return ""
    parts = []
    if node.get("type") == "text":
        parts.append(node.get("text") or "")
    for child in (node.get("content") or []):
        parts.append(adf_extract_text(child))
    return " ".join(p for p in parts if p)


def extract_urls_from_comments(comments_field) -> list[str]:
    """Recebe o campo 'comment' do Jira (objeto com .comments[]) ou lista direta.
    Retorna URLs Drive/Docs de todos os comments, em ordem."""
    if not comments_field:
        return []
    if isinstance(comments_field, dict):
        comments = comments_field.get("comments") or []
    elif isinstance(comments_field, list):
        comments = comments_field
    else:
        return []
    urls = []
    seen = set()
    for c in comments:
        body = c.get("body") if isinstance(c, dict) else None
        for url in adf_extract_drive_urls(body):
            if url not in seen:
                seen.add(url)
                urls.append(url)
    return urls


# ============================================================================
# RESOLUCAO DE COPY (3 regras do Passo 2)
# ============================================================================

def tokenize_summary(text: str) -> set[str]:
    """Tokeniza summary pra calculo de overlap. Lowercase, remove stopwords,
    descarta tokens com 1 char."""
    if not text:
        return set()
    tokens = re.findall(r"\w+", text.lower(), flags=re.UNICODE)
    return {t for t in tokens if t not in STOPWORDS_PT and len(t) > 1}


def best_sister_match(design_issue: dict, candidates: list[dict]) -> Optional[dict]:
    """Dado um design e uma lista de copywriters do mesmo parent, retorna a copywriter
    com maior overlap de tokens. Se 1 design + 1 copywriter, escolhe direto.
    Se nenhum overlap > 0, retorna None.
    """
    if not candidates:
        return None
    if len(candidates) == 1:
        return candidates[0]

    design_summary = (design_issue.get("fields") or {}).get("summary") or ""
    d_tokens = tokenize_summary(design_summary)

    best = None
    best_score = 0
    for c in candidates:
        c_summary = (c.get("fields") or {}).get("summary") or ""
        c_tokens = tokenize_summary(c_summary)
        score = len(d_tokens & c_tokens)
        if score > best_score:
            best_score = score
            best = c

    return best if best_score > 0 else None


def resolve_copy(
    design_issue: dict,
    sisters_by_parent: dict[str, list[dict]],
    parents_by_key: dict[str, dict],
) -> tuple[Optional[str], str]:
    """Aplica as 3 regras de resolucao de copy em ordem.

    Retorna (copy_url, copy_source) onde copy_source eh 'sister' | 'parent' | 'fallback'.
    """
    fields = design_issue.get("fields") or {}
    parent = fields.get("parent") or {}
    parent_key = parent.get("key")

    # Regra 1: copywriter irma sob o mesmo parent
    if parent_key and parent_key in sisters_by_parent:
        candidates = sisters_by_parent[parent_key]
        sister = best_sister_match(design_issue, candidates)
        if sister:
            s_fields = sister.get("fields") or {}
            # Tenta extrair de description
            urls = adf_extract_drive_urls(s_fields.get("description"))
            # Tenta extrair de comments
            if not urls:
                urls = extract_urls_from_comments(s_fields.get("comment"))
            if urls:
                return urls[0], "sister"

    # Regra 2: descricao da task PAI
    if parent_key and parent_key in parents_by_key:
        p = parents_by_key[parent_key]
        p_fields = p.get("fields") or {}
        urls = adf_extract_drive_urls(p_fields.get("description"))
        if urls:
            return urls[0], "parent"

    # Regra 3: fallback
    return None, "fallback"


# ============================================================================
# MONTAGEM DO PAYLOAD
# ============================================================================

def safe_get_entrega(fields: dict) -> tuple[Optional[str], Optional[str]]:
    """Retorna (entrega_iso, source) tentando customfield_10031 e depois 11080.
    Retorna (None, None) se nenhum funciona."""
    primary = fields.get("customfield_10031")
    if primary:
        return primary, "customfield_10031"
    fallback = fields.get("customfield_11080")
    if fallback:
        return fallback, "customfield_11080"
    return None, None


def safe_get_vertical(fields: dict) -> Optional[str]:
    """Extrai customfield_10065[0].value de forma defensiva."""
    raw = fields.get("customfield_10065")
    if not raw:
        return None
    if isinstance(raw, list) and raw:
        first = raw[0]
        if isinstance(first, dict):
            return first.get("value")
    if isinstance(raw, dict):
        return raw.get("value")
    return None


def build_issue_entry(issue: dict, sisters_by_parent: dict, parents_by_key: dict,
                     warnings: list[dict]) -> Optional[dict]:
    """Monta uma entry do payload pra uma issue do Jira. Loga warnings parciais.
    Retorna None apenas se a issue eh nao processavel (ex: sem key)."""
    key = issue.get("key")
    if not key:
        return None

    fields = issue.get("fields") or {}
    summary = fields.get("summary") or ""

    # Parent
    parent = fields.get("parent") or {}
    parent_key = parent.get("key")
    parent_fields = parent.get("fields") or {}
    parent_summary = parent_fields.get("summary") or ""
    if not parent_key:
        warnings.append({"key": key, "field": "parent_key", "issue": "issue sem parent"})

    # Status
    status_obj = fields.get("status") or {}
    status_jira = status_obj.get("name") or ""

    # Vertical
    try:
        vertical_raw = safe_get_vertical(fields)
    except Exception as e:
        vertical_raw = None
        warnings.append({"key": key, "field": "vertical_raw", "issue": f"falha extracao: {e}"})

    # Entrega
    try:
        entrega_iso, _src = safe_get_entrega(fields)
    except Exception as e:
        entrega_iso = None
        warnings.append({"key": key, "field": "entrega_iso", "issue": f"falha extracao: {e}"})

    # Copy resolution
    try:
        copy_url, copy_source = resolve_copy(issue, sisters_by_parent, parents_by_key)
    except Exception as e:
        copy_url, copy_source = None, "fallback"
        warnings.append({"key": key, "field": "copy_url", "issue": f"falha resolucao: {e}"})

    # Jira updated_at (pra write conditional do sync.py)
    jira_updated_at = fields.get("updated") or ""

    return {
        "key": key,
        "summary": summary,
        "parent_key": parent_key or "",
        "parent_summary": parent_summary,
        "status_jira": status_jira,
        "vertical_raw": vertical_raw or "",
        "entrega_iso": entrega_iso,
        "copy_url": copy_url,
        "copy_source": copy_source,
        "jira_updated_at": jira_updated_at,
    }


# ============================================================================
# FLUXO PRINCIPAL
# ============================================================================

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True, help="path to config.json")
    parser.add_argument("--output", default="payload.json", help="path to write payload.json")
    parser.add_argument("--max-results", type=int, default=200)
    args = parser.parse_args()

    cfg = load_config(args.config)
    email, token = load_jira_credentials(cfg["jira_credentials_path"])

    client = JiraClient(cfg["jira_api_base"], email, token)

    # === PASSO 1: search principal ===
    main_jql = MAIN_JQL_TEMPLATE.format(user_id=cfg["jira_user_id"])
    print(f"[fetch.py] Rodando JQL principal...", file=sys.stderr)
    designs_raw = client.search_jql(main_jql, JIRA_FIELDS, max_results=args.max_results)
    print(f"[fetch.py] Retornaram {len(designs_raw)} issues.", file=sys.stderr)

    # Filtra Backlog (e outros statuses configurados) + tasks de Template
    # O filtro de Template aqui pega casos onde "template" aparece no parent.summary
    # mesmo que o summary da propria issue nao tenha (JQL so filtra o summary direto).
    filtered_out = []
    designs = []
    filtered_statuses = set(cfg.get("filtered_statuses", ["Backlog"]))
    for issue in designs_raw:
        fields = issue.get("fields") or {}
        status_name = (fields.get("status") or {}).get("name") or ""
        if status_name in filtered_statuses:
            filtered_out.append({"key": issue.get("key"), "reason": status_name})
            continue

        # Filtro Template: verifica summary proprio e o do parent
        own_summary = (fields.get("summary") or "").lower()
        parent = fields.get("parent") or {}
        parent_summary = ((parent.get("fields") or {}).get("summary") or "").lower()
        if "template" in own_summary or "template" in parent_summary:
            filtered_out.append({"key": issue.get("key"), "reason": "Template"})
            continue

        designs.append(issue)

    # Parents unicos
    parent_keys = set()
    for d in designs:
        p = ((d.get("fields") or {}).get("parent") or {}).get("key")
        if p:
            parent_keys.add(p)

    # === PASSO 2a: copywriters irmas ===
    sisters_by_parent: dict[str, list[dict]] = {}
    if parent_keys:
        parent_list = ",".join(parent_keys)
        sisters_jql = (
            f"parent IN ({parent_list}) AND issuetype = COPYWRITER"
        )
        print(f"[fetch.py] Buscando copywriters irmas...", file=sys.stderr)
        try:
            sisters_raw = client.search_jql(
                sisters_jql,
                ["summary", "parent", "description", "comment"],
                max_results=args.max_results,
            )
            for s in sisters_raw:
                pk = ((s.get("fields") or {}).get("parent") or {}).get("key")
                if pk:
                    sisters_by_parent.setdefault(pk, []).append(s)
        except Exception as e:
            print(f"[fetch.py] Falha ao buscar copywriters: {e}", file=sys.stderr)

    # === PASSO 2b: descricoes dos parents ===
    parents_by_key: dict[str, dict] = {}
    if parent_keys:
        parent_list = ",".join(parent_keys)
        parents_jql = f"key IN ({parent_list})"
        print(f"[fetch.py] Buscando descricoes dos parents...", file=sys.stderr)
        try:
            parents_raw = client.search_jql(
                parents_jql,
                ["summary", "description"],
                max_results=args.max_results,
            )
            for p in parents_raw:
                parents_by_key[p.get("key")] = p
        except Exception as e:
            print(f"[fetch.py] Falha ao buscar parents: {e}", file=sys.stderr)

    # === Segundo filtro de Template usando parent.summary REAL ===
    # O endpoint novo /rest/api/3/search/jql nao retorna parent.fields.summary
    # automaticamente — entao precisamos checar contra parents_by_key (que vem
    # da query separada acima). Filtra designs cujo parent tem "template" no nome.
    designs_after_parent_filter = []
    for issue in designs:
        parent = (issue.get("fields") or {}).get("parent") or {}
        pk = parent.get("key")
        parent_summary = ""
        if pk and pk in parents_by_key:
            parent_summary = ((parents_by_key[pk].get("fields") or {}).get("summary") or "").lower()
        if "template" in parent_summary:
            filtered_out.append({"key": issue.get("key"), "reason": "Template (no parent)"})
            continue
        designs_after_parent_filter.append(issue)
    if len(designs_after_parent_filter) < len(designs):
        print(
            f"[fetch.py] Filtrou {len(designs) - len(designs_after_parent_filter)} issues "
            f"com 'template' no nome do parent.",
            file=sys.stderr,
        )
    designs = designs_after_parent_filter

    # === Montar payload ===
    warnings: list[dict] = []
    issues_payload = []
    for design in designs:
        try:
            entry = build_issue_entry(design, sisters_by_parent, parents_by_key, warnings)
            if entry:
                issues_payload.append(entry)
        except Exception as e:
            # Falha catastrofica numa issue — registra mas nao para o run
            warnings.append({
                "key": design.get("key", "?"),
                "field": "ALL",
                "issue": f"falha processamento: {e}",
            })

    now = datetime.now().astimezone()
    payload = {
        "schema_version": SCHEMA_VERSION,
        "run_date": now.date().isoformat(),
        "generated_at": now.isoformat(timespec="seconds"),
        "issues": issues_payload,
        "filtered_out": filtered_out,
        "warnings": warnings,
    }

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    # Resumo no stderr (stdout fica pro JSON quando vier o caso)
    print(
        f"[fetch.py] OK: {len(issues_payload)} issues, "
        f"{len(filtered_out)} filtradas, {len(warnings)} warnings. "
        f"Output: {args.output}",
        file=sys.stderr,
    )

    # Imprime resumo JSON no stdout pro Claude consumir no relatorio final
    summary = {
        "issues": len(issues_payload),
        "filtered_out": len(filtered_out),
        "warnings": len(warnings),
        "fallback_copies": sum(1 for i in issues_payload if i.get("copy_source") == "fallback"),
    }
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
