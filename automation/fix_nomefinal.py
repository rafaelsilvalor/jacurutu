"""
fix_nomefinal.py — reescreve a coluna 'nomefinal' (I) em Demandas e Finalizadas
usando a formula nova (que referencia coluna E TaskFilha, em vez de D TaskPai).

Rode uma vez apos mudar a regra. Depois disso o sync.py ja aplica a formula
nova nas novas linhas.

Uso:
  python fix_nomefinal.py            # aplica
  python fix_nomefinal.py --dry-run  # so mostra o que faria
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass

import lib_sheets as ls
from sync import nomefinal_formula_for_row


def fix_tab(ss, tab_name: str, dry_run: bool) -> int:
    print(f"\n=== Aba: {tab_name} ===")
    try:
        ws = ss.worksheet(tab_name)
    except Exception as e:
        print(f"  ERRO: nao consegui abrir aba: {e}")
        return 0

    rows = ls.read_rows(ws)
    n = len(rows)
    if n == 0:
        print(f"  (vazia, skip)")
        return 0

    col_i = ls.COL_INDEX["nomefinal"]
    requests = []
    for i, row in enumerate(rows):
        sheet_row = i + 2  # +1 header, +1 1-indexed
        new_formula = nomefinal_formula_for_row(sheet_row)
        # row e dict chaveado pelo nome da coluna
        old = str(row.get("nomefinal", "") or "")
        if i < 3:  # so loga os 3 primeiros pra nao poluir
            print(f"  linha {sheet_row}: {old[:60]!r} -> formula nova")
        requests.append({
            "updateCells": {
                "range": {
                    "sheetId": ws.id,
                    "startRowIndex": sheet_row - 1,
                    "endRowIndex": sheet_row,
                    "startColumnIndex": col_i,
                    "endColumnIndex": col_i + 1,
                },
                "rows": [{"values": [{"userEnteredValue": {"formulaValue": new_formula}}]}],
                "fields": "userEnteredValue",
            }
        })
    if n > 3:
        print(f"  ... +{n - 3} linhas")
    print(f"  Total: {n} linhas a atualizar")

    if dry_run:
        print(f"  DRY-RUN: nao aplicando")
        return n

    # Aplica em chunks de 50 pra nao estourar o batchUpdate
    chunk = 50
    for i in range(0, len(requests), chunk):
        ws.spreadsheet.batch_update({"requests": requests[i:i + chunk]})
    print(f"  OK")
    return n


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="config.json")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    cfg = ls.Config.load(args.config)
    ss = ls.open_spreadsheet(cfg)

    total = 0
    total += fix_tab(ss, cfg.tab_demandas, args.dry_run)
    total += fix_tab(ss, cfg.tab_finalizadas, args.dry_run)

    print(f"\n{'=' * 50}")
    print(f"Total geral: {total} linhas {'(dry-run)' if args.dry_run else 'corrigidas'}")
    print(f"{'=' * 50}")


if __name__ == "__main__":
    main()
