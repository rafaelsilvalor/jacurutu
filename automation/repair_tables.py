"""
repair_tables.py — diagnostica e cria as tabelas nativas do Google Sheets
nas abas Demandas e Finalizadas. Rode uma vez se notar que alguma aba esta
sem o formato de tabela.

Uso:
  python repair_tables.py [--config config.json]

Saida: lista o estado de cada aba e cria/atualiza a tabela conforme necessario.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

# UTF-8 stdout (Windows cp1252 fallback)
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass

import lib_sheets as ls


def diagnose_sheet(ss, ws, expected_table_name: str) -> dict:
    """Retorna {'sheet_id', 'title', 'tables': [...], 'data_rows': N}."""
    meta = ss.fetch_sheet_metadata(
        params={"fields": "sheets(properties(sheetId,title),tables(tableId,name,range))"}
    )
    sheet_info = {"sheet_id": ws.id, "title": ws.title, "tables": [], "data_rows": 0}
    for sheet in meta.get("sheets", []):
        if sheet.get("properties", {}).get("sheetId") == ws.id:
            sheet_info["tables"] = sheet.get("tables", []) or []
            break
    sheet_info["data_rows"] = len(ls.read_rows(ws))
    return sheet_info


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="config.json")
    args = parser.parse_args()

    cfg = ls.Config.load(args.config)
    ss = ls.open_spreadsheet(cfg)

    targets = [
        (cfg.tab_demandas, "DemandasTable"),
        (cfg.tab_finalizadas, "FinalizadasTable"),
    ]

    for tab_name, table_name in targets:
        print(f"\n{'=' * 60}")
        print(f"Aba: {tab_name}")
        print("=" * 60)
        try:
            ws = ss.worksheet(tab_name)
        except Exception as e:
            print(f"  ERRO: nao consegui abrir aba {tab_name}: {e}")
            continue

        info = diagnose_sheet(ss, ws, table_name)
        print(f"  sheetId: {info['sheet_id']}")
        print(f"  linhas de dados: {info['data_rows']}")
        print(f"  tabelas existentes: {len(info['tables'])}")
        for t in info["tables"]:
            print(f"    - {t.get('name')} (id={t.get('tableId')}, range={t.get('range')})")

        if info["data_rows"] < 1:
            print(f"  -> SEM DADOS, skip (tabela precisa de pelo menos 1 linha)")
            continue

        if info["tables"]:
            existing_name = info["tables"][0].get("name", "?")
            print(f"  -> ja tem tabela '{existing_name}'. Atualizando range...")
        else:
            print(f"  -> SEM TABELA. Criando '{table_name}' com {info['data_rows']} linhas...")

        try:
            ls.ensure_table(ws, table_name, info["data_rows"])
            print(f"  OK")
        except Exception as e:
            print(f"  FALHOU: {e}")

        # Re-checa pra confirmar
        info_after = diagnose_sheet(ss, ws, table_name)
        if info_after["tables"]:
            t = info_after["tables"][0]
            r = t.get("range", {})
            print(
                f"  CONFIRMADO: tabela '{t.get('name')}' cobre linhas "
                f"{r.get('startRowIndex', 0) + 1} a {r.get('endRowIndex', 0)}"
            )
        else:
            print(f"  AINDA SEM TABELA - investigue o erro acima")

    print("\nFeito.")


if __name__ == "__main__":
    main()
