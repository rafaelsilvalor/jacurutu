"""
Funções puras de transformação: slug, parse de hora, parse de vertical, extração de URLs.
Sem I/O. Fácil de testar.
"""
from __future__ import annotations

import re
import unicodedata
from datetime import datetime
from typing import Optional

STOPWORDS_SLUG = {
    "criativo", "criativos", "clone", "artes", "tarefas", "avulsas",
    "performance", "parte", "concurso", "edital", "prefeitura",
    "de", "do", "da", "dos", "das", "para", "com", "por", "em",
    "remarketing", "copy", "design",
}

MC_PARENT_GENERIC_RE = re.compile(
    r"^\s*criativos\s+est[aá]ticos\s*\|\s*performance\s*-\s*parte\s+\d+",
    re.IGNORECASE,
)

DAYS_PT_RE = re.compile(
    r"\b(segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo)\b",
    re.IGNORECASE,
)


def normalize_text(s: str) -> str:
    """Lowercase + remove acentos."""
    if not s:
        return ""
    s = s.lower()
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s


def slug_nome_curto(parent_summary: str, child_summary: str = "") -> str:
    """
    Gera o nomeCurto (3-5 tokens) a partir do summary do pai.
    Fallback: usa child_summary se parent for genérico ou vazio.
    """
    base = parent_summary or ""

    # Se o pai é genérico (MC "Criativos Estáticos | Performance - Parte XXX"), usar o child
    if not base.strip() or MC_PARENT_GENERIC_RE.search(base):
        base = child_summary or base
        # Remover prefixo comum de CLONE
        base = re.sub(
            r"^clone\s*-\s*artes\s*-\s*criativos\s+est[aá]ticos\s*\|\s*performance\s*-\s*concurso\s+",
            "",
            base,
            flags=re.IGNORECASE,
        )

    # Remover [...], (...)
    base = re.sub(r"\[[^\]]*\]", " ", base)
    base = re.sub(r"\([^\)]*\)", " ", base)
    # Remover datas dd/mm e horários HHh
    base = re.sub(r"\b\d{1,2}/\d{1,2}(?:/\d{2,4})?\b", " ", base)
    base = re.sub(r"\b\d{1,2}h(?:\d{2})?\b", " ", base, flags=re.IGNORECASE)
    # Remover dias da semana
    base = DAYS_PT_RE.sub(" ", base)

    # Normalizar
    base = normalize_text(base)
    # Trocar não-alfanum por hífen
    base = re.sub(r"[^a-z0-9]+", "-", base)
    tokens = [t for t in base.split("-") if len(t) > 1 and t not in STOPWORDS_SLUG]
    if not tokens:
        tokens = [t for t in base.split("-") if len(t) > 1]

    joined = "-".join(tokens[:5])
    if len(joined) > 50:
        joined = joined[:50].rstrip("-")
    return joined or "demanda"


def parse_vertical(raw: Optional[str]) -> str:
    """customfield_10065 retorna algo como '[EC] Concursos' — extrair conteúdo entre []."""
    if not raw:
        return ""
    m = re.match(r"^\s*\[([^\]]+)\]", raw)
    return m.group(1).strip() if m else raw.strip()


def parse_entrega(iso_dt: Optional[str]) -> tuple[Optional[str], str]:
    """
    Recebe um ISO datetime (ex: '2026-05-13T19:30:00.000-0300' ou '2026-05-13').
    Retorna (data_str_YYYY-MM-DD, hora_formatada).
    Hora formatada: '19h' se minutos=0, '19h30' se minutos>0, '' se sem hora.
    """
    if not iso_dt:
        return None, ""

    # Se for só data (sem T), retornar sem hora
    if "T" not in iso_dt:
        try:
            d = datetime.strptime(iso_dt[:10], "%Y-%m-%d").date()
            return d.isoformat(), ""
        except ValueError:
            return None, ""

    # ISO completo
    try:
        # Aceita +HHMM, +HH:MM, Z, ou sem timezone
        s = iso_dt.replace("Z", "+00:00")
        # Atlassian usa +HHMM sem :; normalizar
        s = re.sub(r"([+-]\d{2})(\d{2})$", r"\1:\2", s)
        dt = datetime.fromisoformat(s)
    except ValueError:
        try:
            dt = datetime.strptime(iso_dt[:19], "%Y-%m-%dT%H:%M:%S")
        except ValueError:
            return None, ""

    data_str = dt.date().isoformat()
    if dt.hour == 0 and dt.minute == 0:
        hora_str = ""  # meia-noite normalmente significa "sem hora específica"
    elif dt.minute == 0:
        hora_str = f"{dt.hour}h"
    else:
        hora_str = f"{dt.hour}h{dt.minute:02d}"

    return data_str, hora_str


URL_DRIVE_RE = re.compile(
    r"https?://(?:drive\.google\.com|docs\.google\.com)/[^\s)>\"']+",
    re.IGNORECASE,
)


def extract_first_drive_url(text: str) -> Optional[str]:
    """Extrai a primeira URL Drive/Docs do texto. Limpa sufixos markdown ]( ou >."""
    if not text:
        return None
    m = URL_DRIVE_RE.search(text)
    if not m:
        return None
    url = m.group(0)
    # Limpar sufixos markdown
    url = re.split(r"[\])>\"']", url)[0]
    # Trim trailing pontuação
    url = url.rstrip(".,;")
    return url


# Stopwords adicionais pro pareamento de summaries irmãos (Regra 1 do copy)
STOPWORDS_PAIRING = STOPWORDS_SLUG | {
    "estatico", "estaticos", "estática", "estáticos",
}


def tokens_for_pairing(s: str) -> set[str]:
    s = normalize_text(s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return {t for t in s.split() if len(t) > 2 and t not in STOPWORDS_PAIRING}
