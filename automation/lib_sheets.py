"""
Camada de acesso ao Google Sheets via gspread.
Encapsula: autenticação, leitura/escrita de abas, formatação, criação de abas.
"""
from __future__ import annotations

import json
import os
import re as _re
from dataclasses import dataclass
from typing import Optional

import gspread
from google.oauth2.service_account import Credentials

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

# Separador de função na fórmula. pt-BR/es/fr/it/de usam ';' — en-US usa ','.
# Setado em open_spreadsheet() baseado no locale da planilha.
FORMULA_SEP = ","


def detect_formula_separator(spreadsheet) -> str:
    """Retorna ';' se a planilha está em locale que usa esse separador, senão ','."""
    try:
        locale = (spreadsheet.locale or "").lower()
    except Exception:
        locale = ""
    SEMI_LOCALES = ("pt", "es", "fr", "it", "de", "nl", "pl", "ru", "tr")
    if any(locale.startswith(p) for p in SEMI_LOCALES):
        return ";"
    return ","


# Ordem oficial de colunas (1-indexed na sheet, 0-indexed na lista interna)
COLUMNS = [
    "Vertical",         # A
    "Entrega",          # B
    "HoraEntrega",      # C
    "TaskPai",          # D
    "TaskFilha",        # E (chave de match)
    "copy",             # F
    "Demandante",       # G
    "nomeCurto",        # H
    "nomefinal",        # I
    "status",           # J
    "laminas",          # K
    "entregue",         # L
    "linkDrive",        # M
    "Última Sync",      # N (write conditional, guarda jira.updated formatado)
]

COL_INDEX = {name: i for i, name in enumerate(COLUMNS)}
COL_LETTER = {name: chr(ord("A") + i) for i, name in enumerate(COLUMNS)}
N_COLS = len(COLUMNS)

# Colunas manuais: NÃO sobrescrever em linhas existentes
MANUAL_COLS = {"Demandante", "status", "laminas", "entregue", "linkDrive"}


@dataclass
class Config:
    spreadsheet_id: str
    credentials_path: str
    tab_demandas: str = "Demandas"
    tab_finalizadas: str = "Finalizadas"
    tab_hub: str = "Hub"
    jira_user_id: str = ""
    atlassian_cloud_id: str = ""
    source_xlsx_for_bootstrap: str = ""

    @classmethod
    def load(cls, path: str) -> "Config":
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


def open_spreadsheet(cfg: Config) -> gspread.Spreadsheet:
    creds = Credentials.from_service_account_file(cfg.credentials_path, scopes=SCOPES)
    gc = gspread.authorize(creds)
    ss = gc.open_by_key(cfg.spreadsheet_id)
    # Detectar e setar o separador de fórmula globalmente baseado no locale
    global FORMULA_SEP
    FORMULA_SEP = detect_formula_separator(ss)
    print(f"[lib_sheets] Locale detectado: {ss.locale!r} -> separador '{FORMULA_SEP}'")
    return ss


def get_or_create_tab(
    ss: gspread.Spreadsheet, title: str, rows: int = 200, cols: int = N_COLS
) -> gspread.Worksheet:
    try:
        return ss.worksheet(title)
    except gspread.exceptions.WorksheetNotFound:
        return ss.add_worksheet(title=title, rows=rows, cols=cols)


def ensure_header(ws: gspread.Worksheet) -> None:
    """Garante que linha 1 é o header oficial e que a coluna "Última Sync" fica visivel."""
    current = ws.row_values(1)
    if current != COLUMNS:
        ws.update("A1", [COLUMNS])
        ws.format(
            f"A1:{COL_LETTER['linkDrive']}1",
            {
                "textFormat": {"bold": True},
                "backgroundColor": {"red": 0.93, "green": 0.93, "blue": 0.93},
                "horizontalAlignment": "CENTER",
            },
        )
        ws.freeze(rows=1)

    # Garante que a coluna "Última Sync" fica visivel (caso tenha sido oculta em runs antigas)
    last_col_idx = COL_INDEX["Última Sync"]
    try:
        ws.spreadsheet.batch_update({
            "requests": [{
                "updateDimensionProperties": {
                    "range": {
                        "sheetId": ws.id,
                        "dimension": "COLUMNS",
                        "startIndex": last_col_idx,
                        "endIndex": last_col_idx + 1,
                    },
                    "properties": {"hiddenByUser": False},
                    "fields": "hiddenByUser",
                }
            }]
        })
    except Exception as e:
        print(f"[lib_sheets] aviso ao desocultar coluna 'Última Sync': {e}")


def read_rows(ws: gspread.Worksheet) -> list[dict]:
    """Lê todas as linhas (skip header) e retorna lista de dicts com chaves de COLUMNS."""
    all_values = ws.get_all_values()
    if len(all_values) <= 1:
        return []
    out = []
    for r_idx, row in enumerate(all_values[1:], start=2):
        row = row + [""] * (N_COLS - len(row))
        rec = {COLUMNS[i]: row[i] for i in range(N_COLS)}
        rec["_row_number"] = r_idx
        out.append(rec)
    return out


def extract_filha_key(cell_value: str) -> Optional[str]:
    """
    Extrai a chave de task da célula TaskFilha. Aceita:
      - HYPERLINK("...", "MCA-12345") -> 'MCA-12345'
      - HYPERLINK("..."; "MCA-12345") -> 'MCA-12345' (locale pt-BR)
      - texto puro 'MCA-12345' -> 'MCA-12345'
      - URL crua -> extrai a parte final
    """
    if not cell_value:
        return None
    s = cell_value.strip()
    # Caso HYPERLINK (aceita , ou ; como separador)
    m = _re.search(r'HYPERLINK\("[^"]*"[,;]\s*"([A-Z]+-\d+)"\)', s, _re.IGNORECASE)
    if m:
        return m.group(1)
    # Caso URL
    m = _re.search(r"/browse/([A-Z]+-\d+)", s)
    if m:
        return m.group(1)
    # Caso texto puro
    m = _re.match(r"^([A-Z]+-\d+)\s*$", s)
    if m:
        return m.group(1)
    return None


def hyperlink_formula(url: str, label: str) -> str:
    """[LEGADO] Monta fórmula HYPERLINK. Mantido para compatibilidade com migração.
    Prefira make_link_cell que é clicável de verdade."""
    url_esc = url.replace('"', '""')
    label_esc = label.replace('"', '""')
    return f'=HYPERLINK("{url_esc}"{FORMULA_SEP}"{label_esc}")'


def jira_browse_url(key: str) -> str:
    return f"https://estrategia.atlassian.net/browse/{key}"

def format_jira_timestamp(iso: str) -> str:
    """Converte ISO 8601 do Jira (ex '2026-05-14T08:15:30.123-0300') pra
    formato legivel 'dd/mm/yyyy HH:MM:SS'. Retorna string vazia se invalido.

    Mantem precisao de segundo — suficiente pra write conditional do sync.py
    e legivel pra inspecao humana na planilha.
    """
    if not iso or not isinstance(iso, str):
        return ""
    iso = iso.strip()
    if not iso:
        return ""
    try:
        from datetime import datetime
        # Python 3.11+ aceita "-0300"; 3.10- precisa "-03:00"
        dt = datetime.fromisoformat(iso)
        return dt.strftime("%d/%m/%Y %H:%M:%S")
    except (ValueError, TypeError):
        # Fallback: tenta sem timezone
        try:
            from datetime import datetime
            dt = datetime.fromisoformat(iso[:19])
            return dt.strftime("%d/%m/%Y %H:%M:%S")
        except Exception:
            return iso  # ultima opcao: devolve raw



# ============================================================================
# RICH-TEXT LINK API: produz células com link nativo clicável.
# É equivalente ao que o Sheets cria quando você faz Ctrl+K numa célula.
# ============================================================================

def make_link_cell(label: str, url: str) -> dict:
    """Retorna um CellData (Sheets API) com texto + link nativo embarcado.

    Diferente de =HYPERLINK(...), esta forma é clicável em todos os contextos do Sheets.
    Estilo: azul (#1166DB) + sublinhado, aplicado APENAS no texto do link.
    """
    return {
        "userEnteredValue": {"stringValue": label},
        "textFormatRuns": [
            {
                "startIndex": 0,
                "format": {
                    "link": {"uri": url},
                    "foregroundColor": {"red": 0.067, "green": 0.40, "blue": 0.86},
                    "underline": True,
                },
            }
        ],
    }


def make_fallback_copy_cell(label: str = "copyDescJira") -> dict:
    """CellData para o fallback do campo copy: cinza #99999f, negrito, itálico.

    Usado quando nenhuma URL Drive/Docs foi encontrada na subtask irmã nem
    na descrição do pai — o usuário precisa olhar o Jira direto.
    """
    return {
        "userEnteredValue": {"stringValue": label},
        "textFormatRuns": [
            {
                "startIndex": 0,
                "format": {
                    "bold": True,
                    "italic": True,
                    # #99999f -> R=153/255, G=153/255, B=159/255
                    "foregroundColor": {"red": 0.600, "green": 0.600, "blue": 0.624},
                },
            }
        ],
    }


def make_cell(value) -> dict:
    """Converte um valor Python em CellData (Sheets API)."""
    if value is None or value == "":
        return {}
    if isinstance(value, dict):
        # Já é um CellData (ex: make_link_cell)
        return value
    if isinstance(value, str):
        if value.startswith("="):
            return {"userEnteredValue": {"formulaValue": value}}
        return {"userEnteredValue": {"stringValue": value}}
    if isinstance(value, bool):
        return {"userEnteredValue": {"boolValue": value}}
    if isinstance(value, (int, float)):
        return {"userEnteredValue": {"numberValue": value}}
    return {"userEnteredValue": {"stringValue": str(value)}}


def write_rows_native(
    ws,
    start_row: int,
    rows_data: list[list],
    fields: str = "userEnteredValue,textFormatRuns",
) -> None:
    """Escreve linhas via batch_update (Sheets API direta).

    Cada item de rows_data pode ser:
      - um CellData dict (ex: make_link_cell)
      - um valor primitivo (str/int/float/bool/None)
      - ou um dict vazio {} pra limpar célula

    Use fields="userEnteredValue,textFormatRuns" para escrever links rich-text.
    Use fields="userEnteredValue" para escrever apenas valores (sem mexer em formato).
    """
    if not rows_data:
        return
    n_cols = max(len(r) for r in rows_data)
    api_rows = []
    for row in rows_data:
        values = [make_cell(v) for v in row]
        while len(values) < n_cols:
            values.append({})
        api_rows.append({"values": values})

    end_row = start_row - 1 + len(api_rows)
    requests = []

    # Expande a aba se nao tiver linhas suficientes (Sheets API nao auto-expande
    # em updateCells; precisa appendDimension antes).
    current_rows = ws.row_count
    if end_row > current_rows:
        n_to_add = end_row - current_rows
        requests.append({
            "appendDimension": {
                "sheetId": ws.id,
                "dimension": "ROWS",
                "length": n_to_add,
            }
        })

    requests.append({
        "updateCells": {
            "range": {
                "sheetId": ws.id,
                "startRowIndex": start_row - 1,
                "endRowIndex": end_row,
                "startColumnIndex": 0,
                "endColumnIndex": n_cols,
            },
            "rows": api_rows,
            "fields": fields,
        }
    })
    ws.spreadsheet.batch_update({"requests": requests})


def parse_hyperlink_formula(formula_str: str) -> Optional[tuple[str, str]]:
    """Parse uma string =HYPERLINK(...) e devolve (url, label). Aceita , ou ; como sep."""
    if not formula_str or not isinstance(formula_str, str):
        return None
    m = _re.match(
        r'=HYPERLINK\("([^"]*)"[,;]\s*"([^"]*)"\)',
        formula_str.strip(),
        _re.IGNORECASE,
    )
    if m:
        return (m.group(1), m.group(2))
    return None


def get_link_uri_from_cell(ws, row: int, col: int) -> Optional[str]:
    """Lê o URI do link nativo de uma célula via Sheets API (consulta dispendiosa).

    Use só para casos específicos (ex: mover linha pra outra aba preservando link).
    """
    a1 = f"{COL_LETTER_FROM_INDEX(col)}{row}"
    try:
        meta = ws.spreadsheet.fetch_sheet_metadata(
            params={"ranges": [f"{ws.title}!{a1}"], "fields": "sheets/data/rowData/values(textFormatRuns(format/link))"}
        )
        sheets = meta.get("sheets", [])
        if not sheets:
            return None
        rows = sheets[0].get("data", [{}])[0].get("rowData", [])
        if not rows:
            return None
        cells = rows[0].get("values", [])
        if not cells:
            return None
        runs = cells[0].get("textFormatRuns", [])
        for run in runs:
            link = run.get("format", {}).get("link", {}).get("uri")
            if link:
                return link
    except Exception:
        return None
    return None


def COL_LETTER_FROM_INDEX(idx0: int) -> str:
    """0-indexed column -> letra. Suporta até ZZ."""
    if idx0 < 26:
        return chr(ord("A") + idx0)
    return chr(ord("A") + idx0 // 26 - 1) + chr(ord("A") + idx0 % 26)

# ============================================================================
# TABELAS NATIVAS (Format -> Convert to table do Google Sheets)
# ============================================================================

def ensure_table(ws, table_name: str, n_data_rows: int) -> None:
    """Garante que a aba `ws` tem uma tabela nativa cobrindo header + n_data_rows.

    Se uma tabela ja existe nesta aba: atualiza o `range` para o extent atual.
    Se nao existe: cria uma nova com nome `table_name`.
    Se n_data_rows < 1: skip.

    Idempotente. Preserva formatacao existente das celulas.
    """
    if n_data_rows < 1:
        return

    end_row = 1 + n_data_rows  # header(linha 1) + dados

    # Buscar tabelas existentes + bandedRanges desta aba (precisamos limpar
    # bandedRanges antes de criar tabela nova, senao API rejeita 400)
    meta = ws.spreadsheet.fetch_sheet_metadata(
        params={
            "fields": (
                "sheets(properties(sheetId),tables(tableId,name,range),"
                "bandedRanges(bandedRangeId,range))"
            )
        }
    )
    existing_table_id = None
    banded_range_ids = []
    for sheet in meta.get("sheets", []):
        if sheet.get("properties", {}).get("sheetId") == ws.id:
            tables = sheet.get("tables", []) or []
            if tables:
                existing_table_id = tables[0].get("tableId")
            for b in (sheet.get("bandedRanges") or []):
                bid = b.get("bandedRangeId")
                if bid is not None:
                    banded_range_ids.append(bid)
            break

    target_range = {
        "sheetId": ws.id,
        "startRowIndex": 0,
        "endRowIndex": end_row,
        "startColumnIndex": 0,
        "endColumnIndex": N_COLS,
    }

    requests = []

    if existing_table_id:
        # Atualiza so o range — nao precisa limpar bandedRanges (tabela ja existe)
        requests.append({
            "updateTable": {
                "table": {
                    "tableId": existing_table_id,
                    "range": target_range,
                },
                "fields": "range",
            }
        })
    else:
        # Limpa bandedRanges conflitantes antes de criar (tabela nativa aplica
        # alternating colors proprias — API rejeita addTable em range com banding)
        for bid in banded_range_ids:
            requests.append({"deleteBanding": {"bandedRangeId": bid}})

        requests.append({
            "addTable": {
                "table": {
                    "name": table_name,
                    "range": target_range,
                }
            }
        })

    try:
        ws.spreadsheet.batch_update({"requests": requests})
    except Exception as e:
        print(f"[lib_sheets] ensure_table({ws.title!r}) falhou: {e}")

