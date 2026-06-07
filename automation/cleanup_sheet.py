"""
cleanup_sheet.py — limpa bandedRanges e tables da planilha que estao deixando
o metadata completo retornar 500.

Usa fetches narrow (campos especificos) pra contornar o bug do servidor que
quebra no fetch full. Depois faz batchUpdate pra deletar tudo.

Apos rodar, o sync.py vai recriar as tabelas/bandedRanges limpos.

Uso:
  python cleanup_sheet.py [--dry-run]

Flags:
  --dry-run  Lista o que seria deletado, mas nao deleta nada.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass

from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Nao deleta nada, so lista")
    parser.add_argument("--config", default="config.json")
    args = parser.parse_args()

    here = Path(__file__).resolve().parent
    cfg = json.loads((here / args.config).read_text(encoding="utf-8"))
    creds_path = here / cfg["credentials_path"]
    spreadsheet_id = cfg["spreadsheet_id"]

    print("=" * 60)
    print("Cleanup Sheet — remove bandedRanges e tables")
    print("=" * 60)
    print(f"  spreadsheet_id: {spreadsheet_id}")
    print(f"  dry-run: {args.dry_run}")
    print()

    creds = Credentials.from_service_account_file(str(creds_path), scopes=SCOPES)
    sheets = build("sheets", "v4", credentials=creds, cache_discovery=False)

    # Fetch narrow: so o que precisamos pra deletar
    print("[1/3] Lendo bandedRanges e tables (fetch narrow)...")
    try:
        meta = sheets.spreadsheets().get(
            spreadsheetId=spreadsheet_id,
            fields="properties.title,sheets(properties(sheetId,title),bandedRanges(bandedRangeId),tables(tableId,name))",
        ).execute()
    except HttpError as e:
        print(f"  FALHOU: {e}")
        print("  -> Ate o fetch narrow falhou. Vai precisar limpar manualmente:")
        print("     1. Abre a planilha")
        print("     2. Em cada aba: remove tabelas (clica > Excluir tabela)")
        print("     3. Formatar > Cores alternadas > Remover (em cada aba)")
        sys.exit(2)

    title = meta.get("properties", {}).get("title", "?")
    print(f"  OK — '{title}'")
    print()

    # Mapeia o que tem em cada aba
    delete_band_requests = []
    delete_table_requests = []
    total_bands = 0
    total_tables = 0

    print("[2/3] Inventario:")
    for sheet in meta.get("sheets", []):
        props = sheet.get("properties", {})
        sheet_id = props.get("sheetId")
        sheet_title = props.get("title")
        bands = sheet.get("bandedRanges", []) or []
        tables = sheet.get("tables", []) or []
        total_bands += len(bands)
        total_tables += len(tables)
        print(f"  - {sheet_title!r} (sheetId={sheet_id}): {len(bands)} bandedRanges, {len(tables)} tables")
        for b in bands:
            bid = b.get("bandedRangeId")
            if bid is not None:
                print(f"      bandedRangeId={bid}")
                delete_band_requests.append({"deleteBanding": {"bandedRangeId": bid}})
        for t in tables:
            tid = t.get("tableId")
            tname = t.get("name", "?")
            if tid:
                print(f"      tableId={tid} name={tname!r}")
                delete_table_requests.append({"deleteTable": {"tableId": tid}})

    print()
    print(f"  Total a remover: {total_bands} bandedRanges + {total_tables} tables")
    print()

    if total_bands == 0 and total_tables == 0:
        print("  -> Planilha ja esta limpa. Nada a fazer.")
        return

    if args.dry_run:
        print("  -> DRY-RUN: nao deletando. Roda sem --dry-run pra aplicar.")
        return

    # Aplica batchUpdate
    # Importante: deleta tables ANTES de bandedRanges (tables podem ter banded internos)
    requests = delete_table_requests + delete_band_requests

    print(f"[3/3] Aplicando batchUpdate com {len(requests)} requests...")
    try:
        result = sheets.spreadsheets().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body={"requests": requests},
        ).execute()
        n_replies = len(result.get("replies", []))
        print(f"  OK — {n_replies} replies recebidos")
    except HttpError as e:
        print(f"  FALHOU: {e}")
        print()
        print("  Tenta de novo em lotes menores ou limpa manualmente.")
        sys.exit(3)

    print()
    print("[4/4] Testando metadata completo agora...")
    try:
        full = sheets.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
        n_sheets = len(full.get("sheets", []))
        print(f"  OK — Sheets API respondeu com {n_sheets} aba(s). Planilha curada!")
    except HttpError as e:
        print(f"  AINDA FALHA: {e}")
        print("  Pode ter outro estado inconsistente. Investiga manualmente.")
        sys.exit(4)

    print()
    print("=" * 60)
    print("SUCESSO — agora roda 'python run_local.py' que o sync recria as")
    print("tabelas e formatacao do zero, sem o estado quebrado.")
    print("=" * 60)


if __name__ == "__main__":
    main()
