"""
fetch_mc1044584.py — busca ONE-OFF de subtasks de DESIGN do parent MC-1044584,
atribuidas ao usuario OU sem dono. Faz append direto na aba Demandas, sem
passar pelo sync.py (evita logica de move-to-finalizadas).

Reutiliza:
  - JiraClient + helpers ADF de fetch.py (search_jql, adf_extract_drive_urls, ...)
  - lib_sheets pra escrita na planilha
  - sync.nomefinal_formula_for_row pra formula da coluna I

Regras especiais:
  - JQL: parent = MC-1044584 AND issuetype = DESIGN
         AND (assignee = currentUser OR assignee IS EMPTY)
  - nomeCurto: splits por " - " e descarta os 2 primeiros tokens
    Ex: "CLONE - Artes - Criativo 12 - Anuncio" -> "Criativo 12 - Anuncio"
  - dedupe: skipa keys que ja estao em Demandas OU Finalizadas

Uso:
  python fetch_mc1044584.py [--dry-run] [--config config.json]
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Optional

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass

import lib_sheets as ls
import lib_transform as lt
import fetch
from sync import nomefinal_formula_for_row


PARENT_KEY = "MC-1044584"

# Campos do Jira que vamos pedir nas subtasks
SUBTASK_FIELDS = [
    "summary",
    "status",
    "parent",
    "assignee",
    "updated",
    "customfield_10031",  # Data/hora do evento
    "customfield_10065",  # Vertical
    "customfield_11080",  # Fallback entrega
]


def special_nome_curto(summary: str) -> str:
    """Aplica a regra one-off: descarta 2 primeiros tokens separados por ' - '.

    'CLONE - Artes - Criativo 12 - Anuncio' -> 'Criativo 12 - Anuncio'
    'Algo simples' (sem ' - ') -> 'Algo simples' (fallback)
    """
    if not summary:
        return ""
    parts = [p.strip() for p in summary.split(" - ")]
    if len(parts) > 2:
        return " - ".join(parts[2:]).strip()
    return summary.strip()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="config.json")
    parser.add_argument("--dry-run", action="store_true",
                        help="So mostra o que seria adicionado, nao escreve")
    args = parser.parse_args()

    here = Path(__file__).resolve().parent
    cfg = fetch.load_config(str(here / args.config))
    email, token = fetch.load_jira_credentials(cfg["jira_credentials_path"])
    user_id = cfg["jira_user_id"]

    client = fetch.JiraClient(cfg["jira_api_base"], email, token)

    # ---------------- [1/4] busca subtasks de DESIGN ----------------
    jql = (
        f'parent = {PARENT_KEY} '
        f'AND issuetype = DESIGN '
        f'AND (assignee IN ({user_id}) OR assignee IS EMPTY)'
    )
    print(f"[1/4] JQL: {jql}")
    designs = client.search_jql(jql, SUBTASK_FIELDS, max_results=200)
    print(f"      Encontradas {len(designs)} subtasks.")

    if not designs:
        print("Nada pra fazer. Saindo.")
        return

    # ---------------- [2/4] busca tasks irmas (copywriters) ----------------
    sisters_jql = f"parent = {PARENT_KEY} AND issuetype = COPYWRITER"
    print(f"[2/4] Buscando copywriters irmas sob {PARENT_KEY}...")
    try:
        sisters_raw = client.search_jql(
            sisters_jql,
            ["summary", "parent", "description", "comment"],
            max_results=200,
        )
    except Exception as e:
        print(f"      WARN: falha {e}, copywriter resolution sera limitada")
        sisters_raw = []
    print(f"      {len(sisters_raw)} copywriters encontradas.")
    sisters_by_parent: dict[str, list[dict]] = {PARENT_KEY: sisters_raw}

    # ---------------- [3/4] busca descricao do parent ----------------
    print(f"[3/4] Buscando descricao do parent {PARENT_KEY}...")
    parents_by_key: dict[str, dict] = {}
    try:
        parents_raw = client.search_jql(
            f"key = {PARENT_KEY}",
            ["summary", "description"],
            max_results=5,
        )
        for p in parents_raw:
            parents_by_key[p.get("key")] = p
        print(f"      OK")
    except Exception as e:
        print(f"      WARN: falha {e}, copy via parent nao disponivel")

    # ---------------- [4/4] monta entradas + dedupe + append ----------------
    print(f"[4/4] Montando entradas e abrindo planilha...")
    cfg_obj = ls.Config.load(str(here / args.config))
    ss = ls.open_spreadsheet(cfg_obj)
    ws_d = ss.worksheet(cfg_obj.tab_demandas)
    ws_f = ss.worksheet(cfg_obj.tab_finalizadas)
    ls.ensure_header(ws_d)
    ls.ensure_header(ws_f)

    # Dedupe contra Demandas + Finalizadas
    existing_keys: set[str] = set()
    for r in ls.read_rows(ws_d):
        k = ls.extract_filha_key(r.get("TaskFilha", ""))
        if k:
            existing_keys.add(k)
    for r in ls.read_rows(ws_f):
        k = ls.extract_filha_key(r.get("TaskFilha", ""))
        if k:
            existing_keys.add(k)
    print(f"      {len(existing_keys)} keys ja na planilha (Demandas + Finalizadas)")

    new_rows = []
    skipped = []
    added_keys = []
    warnings: list[dict] = []

    for design in designs:
        key = design.get("key")
        if not key:
            continue
        if key in existing_keys:
            skipped.append(key)
            continue

        # Monta entry usando o builder padrao (resolve copy etc)
        entry = fetch.build_issue_entry(design, sisters_by_parent, parents_by_key, warnings)
        if not entry:
            continue

        # Sobrescreve parent_summary com o real (do parents_by_key)
        if PARENT_KEY in parents_by_key:
            p_summary = ((parents_by_key[PARENT_KEY].get("fields") or {}).get("summary") or "")
            entry["parent_summary"] = p_summary
            entry["parent_key"] = PARENT_KEY

        # Monta a linha do Sheets via funcao do sync, depois sobrescreve nomeCurto
        # com a regra special
        from sync import build_new_row
        row = build_new_row(entry)
        # nomeCurto special: regra dos 2 primeiros tokens
        row[ls.COL_INDEX["nomeCurto"]] = special_nome_curto(entry.get("summary", ""))
        new_rows.append((entry, row))
        added_keys.append(key)

    print()
    print(f"  Para adicionar: {len(new_rows)} subtasks")
    print(f"  Skipadas (ja existem): {len(skipped)}")
    if skipped:
        for k in skipped[:5]:
            print(f"    - {k}")
        if len(skipped) > 5:
            print(f"    ... +{len(skipped) - 5}")
    if warnings:
        print(f"  Warnings: {len(warnings)}")

    if not new_rows:
        print("\nNada novo pra adicionar.")
        return

    print("\n  Subtasks que serao adicionadas:")
    for entry, _row in new_rows:
        nc = special_nome_curto(entry.get("summary", ""))
        copy_src = entry.get("copy_source", "fallback")
        print(f"    {entry['key']:14}  nomeCurto={nc[:50]!r:55}  copy={copy_src}")

    if args.dry_run:
        print("\n  DRY-RUN: nao escrevendo na planilha.")
        return

    # Append no final de Demandas
    demandas_count = len(ls.read_rows(ws_d))
    start_row = demandas_count + 2  # +1 header, +1 1-indexed

    rows_to_write = []
    for idx, (_entry, row) in enumerate(new_rows):
        target_row = start_row + idx
        # Substitui placeholder de nomefinal pela formula com o numero certo da linha
        row[ls.COL_INDEX["nomefinal"]] = nomefinal_formula_for_row(target_row)
        rows_to_write.append(row)

    ls.write_rows_native(ws_d, start_row, rows_to_write)
    print(f"\n  OK — {len(rows_to_write)} linha(s) appendadas em '{cfg_obj.tab_demandas}' "
          f"a partir da linha {start_row}.")

    # Reordena e mantem tabela
    try:
        from sync import sort_demandas_by_entrega
        sort_demandas_by_entrega(ws_d)
        print("  OK — reordenado por Entrega.")
    except Exception as e:
        print(f"  WARN: falha no sort: {e}")

    try:
        ls.ensure_table(ws_d, "DemandasTable", len(ls.read_rows(ws_d)))
        print("  OK — tabela DemandasTable atualizada.")
    except Exception as e:
        print(f"  WARN: falha no ensure_table: {e}")

    print()
    print("=" * 60)
    print(f"DONE. Adicionadas: {len(added_keys)} | Skipadas: {len(skipped)}")
    print("=" * 60)


if __name__ == "__main__":
    main()
