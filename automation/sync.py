"""
sync.py — sincronização incremental Jira → Google Sheets.

Uso (chamado pelo SKILL.md da scheduled task):
  python sync.py --config config.json --input payload.json [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime, timedelta
from typing import Optional

import gspread

import lib_sheets as ls
import lib_transform as lt


# Forca UTF-8 no stdout/stderr pra rodar em Windows PowerShell (cp1252 default)
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass




FINISHED_STATUSES = {"feito", "concluido", "concluído", "entregue", "done"}
PENDING_STATUSES = {"", "pendente", "aguardando", "todo"}


def normalize_status(s: str) -> str:
    return (s or "").strip().lower()


def is_finished(status: str) -> bool:
    return normalize_status(status) in FINISHED_STATUSES


def is_pending(status: str) -> bool:
    return normalize_status(status) in PENDING_STATUSES


def build_new_row(issue: dict) -> list:
    vertical = lt.parse_vertical(issue.get("vertical_raw", ""))
    entrega_date, hora_entrega = lt.parse_entrega(issue.get("entrega_iso"))
    nome_curto = lt.slug_nome_curto(
        issue.get("parent_summary", ""), issue.get("summary", "")
    )

    parent_key = issue.get("parent_key", "")
    filha_key = issue.get("key", "")

    task_pai = (
        ls.make_link_cell(parent_key, ls.jira_browse_url(parent_key))
        if parent_key
        else ""
    )
    task_filha = ls.make_link_cell(filha_key, ls.jira_browse_url(filha_key))

    copy_url = issue.get("copy_url")
    if copy_url:
        copy_cell = ls.make_link_cell("copyDrive", copy_url)
    else:
        copy_cell = ls.make_fallback_copy_cell()

    nomefinal_formula = "__NOMEFINAL_PLACEHOLDER__"

    row = [""] * ls.N_COLS
    row[ls.COL_INDEX["Vertical"]] = vertical
    row[ls.COL_INDEX["Entrega"]] = entrega_date or ""
    row[ls.COL_INDEX["HoraEntrega"]] = hora_entrega
    row[ls.COL_INDEX["TaskPai"]] = task_pai
    row[ls.COL_INDEX["TaskFilha"]] = task_filha
    row[ls.COL_INDEX["copy"]] = copy_cell
    row[ls.COL_INDEX["Demandante"]] = ""
    row[ls.COL_INDEX["nomeCurto"]] = nome_curto
    row[ls.COL_INDEX["nomefinal"]] = nomefinal_formula
    row[ls.COL_INDEX["status"]] = ""
    row[ls.COL_INDEX["laminas"]] = ""
    row[ls.COL_INDEX["entregue"]] = ""
    row[ls.COL_INDEX["linkDrive"]] = ""
    row[ls.COL_INDEX["Última Sync"]] = ls.format_jira_timestamp(issue.get("jira_updated_at", ""))
    return row


def nomefinal_formula_for_row(r: int) -> str:
    s = ls.FORMULA_SEP
    # REGEXREPLACE final colapsa runs de "-" (gerado por " - " virando "---") em
    # um unico "-". Preserva tracos originais isolados (ex: ids tipo MCA-1234).
    return (
        f'=LOWER(REGEXREPLACE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE('
        f'IFERROR(REGEXEXTRACT(E{r}{s}"([A-Z]+-\\d+)"){s}E{r})'
        f'&"_"&A{r}&"_"&IF(ISBLANK(B{r}){s}""{s}TEXT(B{r}{s}"dd-mm"))'
        f'&"_"&H{r}&"_"&G{r}'
        f'{s}" "{s}"-"){s}"."{s}"-"){s}"+"{s}"-")'
        f'{s}"-+"{s}"-"))'
    )


def update_jira_fields_in_row(ws, row_number, issue, existing):
    # Write conditional: skip integro se jira.updated nao mudou desde a ultima sync.
    # Economiza dezenas de chamadas a API do Sheets por run em horarios tranquilos.
    incoming_synced = ls.format_jira_timestamp(issue.get("jira_updated_at") or "")
    existing_synced = (existing.get("Última Sync") or "").strip()
    if incoming_synced and existing_synced and incoming_synced == existing_synced:
        return  # nada mudou no Jira; mantem celulas existentes intactas

    vertical = lt.parse_vertical(issue.get("vertical_raw", ""))
    entrega_date, hora_entrega = lt.parse_entrega(issue.get("entrega_iso"))
    nome_curto = lt.slug_nome_curto(
        issue.get("parent_summary", ""), issue.get("summary", "")
    )
    parent_key = issue.get("parent_key", "")
    filha_key = issue.get("key", "")
    task_pai = (
        ls.make_link_cell(parent_key, ls.jira_browse_url(parent_key))
        if parent_key
        else ""
    )
    task_filha = ls.make_link_cell(filha_key, ls.jira_browse_url(filha_key))

    updates = []

    cur_copy = existing.get("copy", "")
    if "copyDescJira" in cur_copy and issue.get("copy_url"):
        updates.append(("copy", ls.make_link_cell("copyDrive", issue["copy_url"])))

    field_updates = [
        ("Vertical", vertical),
        ("Entrega", entrega_date or ""),
        ("HoraEntrega", hora_entrega),
        ("TaskPai", task_pai),
        ("TaskFilha", task_filha),
        ("nomefinal", nomefinal_formula_for_row(row_number)),
        # Atualiza marker de write conditional — sempre escreve, com timestamp atual do Jira
        ("Última Sync", incoming_synced),
    ]
    if not (existing.get("nomeCurto") or "").strip():
        field_updates.append(("nomeCurto", nome_curto))
    for name, val in field_updates:
        if isinstance(val, dict) or existing.get(name, "") != val:
            updates.append((name, val))

    if not updates:
        return

    requests = []
    for name, val in updates:
        col_idx = ls.COL_INDEX[name]
        cell = ls.make_cell(val)
        requests.append({
            "updateCells": {
                "range": {
                    "sheetId": ws.id,
                    "startRowIndex": row_number - 1,
                    "endRowIndex": row_number,
                    "startColumnIndex": col_idx,
                    "endColumnIndex": col_idx + 1,
                },
                "rows": [{"values": [cell]}],
                "fields": "userEnteredValue,textFormatRuns",
            }
        })
    ws.spreadsheet.batch_update({"requests": requests})


def apply_diff(ss, cfg, payload, dry_run=False):
    ws_d = ls.get_or_create_tab(ss, cfg.tab_demandas)
    ws_f = ls.get_or_create_tab(ss, cfg.tab_finalizadas)
    ls.ensure_header(ws_d)
    ls.ensure_header(ws_f)

    demandas_rows = ls.read_rows(ws_d)
    finalizadas_rows = ls.read_rows(ws_f)

    demandas_by_key = {}
    for r in demandas_rows:
        k = ls.extract_filha_key(r["TaskFilha"])
        if k:
            r["_filha_key"] = k
            demandas_by_key[k] = r

    finalizadas_keys = set()
    for r in finalizadas_rows:
        k = ls.extract_filha_key(r["TaskFilha"])
        if k:
            finalizadas_keys.add(k)

    incoming_issues = {i["key"]: i for i in payload.get("issues", [])}
    incoming_keys = set(incoming_issues.keys())

    actions = {
        "to_move": [], "to_delete": [], "to_preserve": [],
        "to_add": [], "to_update": [], "to_skip_already_done": [],
    }

    for k, row in demandas_by_key.items():
        status = row.get("status", "")
        if is_finished(status):
            actions["to_move"].append(row)
        elif k not in incoming_keys:
            if is_pending(status):
                actions["to_delete"].append(row)
            else:
                actions["to_preserve"].append(row)
        else:
            actions["to_update"].append((row, incoming_issues[k]))

    for k, issue in incoming_issues.items():
        if k in demandas_by_key:
            continue
        if k in finalizadas_keys:
            actions["to_skip_already_done"].append(k)
            continue
        actions["to_add"].append(issue)

    report = {
        "added": [i["key"] for i in actions["to_add"]],
        "moved": [r["_filha_key"] for r in actions["to_move"]],
        "deleted": [r["_filha_key"] for r in actions["to_delete"]],
        "preserved": [r["_filha_key"] for r in actions["to_preserve"]],
        "updated": [r["_filha_key"] for (r, _) in actions["to_update"]],
        "skipped_already_done": actions["to_skip_already_done"],
    }

    if dry_run:
        return report

    if actions["to_move"]:
        # Usa copyPaste da Sheets API pra preservar TODA a formatacao da linha
        # (hyperlinks de TaskPai/TaskFilha/copy/linkDrive, cores, bold, etc).
        # Muito mais robusto que reconstruir cell por cell — pega ate hyperlinks
        # manuais que o usuario colocou na coluna linkDrive ou em qualquer outra.
        finalizadas_count = len(finalizadas_rows)
        copy_requests = []
        for idx, r in enumerate(actions["to_move"]):
            src_row = r["_row_number"]  # 1-indexed na planilha
            dest_row = finalizadas_count + 2 + idx
            copy_requests.append({
                "copyPaste": {
                    "source": {
                        "sheetId": ws_d.id,
                        "startRowIndex": src_row - 1,
                        "endRowIndex": src_row,
                        "startColumnIndex": 0,
                        "endColumnIndex": ls.N_COLS,
                    },
                    "destination": {
                        "sheetId": ws_f.id,
                        "startRowIndex": dest_row - 1,
                        "endRowIndex": dest_row,
                        "startColumnIndex": 0,
                        "endColumnIndex": ls.N_COLS,
                    },
                    "pasteType": "PASTE_NORMAL",
                    "pasteOrientation": "NORMAL",
                }
            })
        if copy_requests:
            ws_d.spreadsheet.batch_update({"requests": copy_requests})

    rows_to_remove = sorted(
        [r["_row_number"] for r in actions["to_move"] + actions["to_delete"]],
        reverse=True,
    )
    # Sheets API recusa "delete all non-frozen rows". Se as remocoes zerariam
    # a aba (caso raro: fetch retorna 0 e tudo vira to_delete/to_move),
    # garante buffer expandindo a aba antes.
    if rows_to_remove and ws_d.row_count - len(rows_to_remove) < 2:
        n_buffer = 2 - (ws_d.row_count - len(rows_to_remove))
        ws_d.spreadsheet.batch_update({
            "requests": [{
                "appendDimension": {
                    "sheetId": ws_d.id,
                    "dimension": "ROWS",
                    "length": n_buffer,
                }
            }]
        })
    for rn in rows_to_remove:
        ws_d.delete_rows(rn)

    demandas_rows_after = ls.read_rows(ws_d)
    current_count = len(demandas_rows_after)

    if actions["to_add"]:
        new_rows = []
        start_row = current_count + 2
        for idx, issue in enumerate(actions["to_add"]):
            target_row = start_row + idx
            row = build_new_row(issue)
            row[ls.COL_INDEX["nomefinal"]] = nomefinal_formula_for_row(target_row)
            new_rows.append(row)
        ls.write_rows_native(ws_d, start_row, new_rows)

    demandas_rows_after_add = ls.read_rows(ws_d)
    by_key_now = {ls.extract_filha_key(r["TaskFilha"]): r for r in demandas_rows_after_add if ls.extract_filha_key(r["TaskFilha"])}
    for (orig_row, issue) in actions["to_update"]:
        k = orig_row["_filha_key"]
        current = by_key_now.get(k)
        if not current:
            continue
        update_jira_fields_in_row(ws_d, current["_row_number"], issue, current)

    sort_demandas_by_entrega(ws_d)
    # update_hub desativado: a aba Hub eh mantida manualmente pelo usuario.
    # Pra reativar, descomentar a linha abaixo.
    # update_hub(ss, cfg, payload.get("run_date"))
    apply_base_formatting(ws_d)
    apply_base_formatting(ws_f)

    # Tabelas nativas — cria/atualiza o range a cada run para preservar formato
    demandas_count = len(ls.read_rows(ws_d))
    finalizadas_count = len(ls.read_rows(ws_f))
    ls.ensure_table(ws_d, "DemandasTable", demandas_count)
    ls.ensure_table(ws_f, "FinalizadasTable", finalizadas_count)

    return report


def sort_demandas_by_entrega(ws):
    rows = ls.read_rows(ws)
    if not rows:
        return

    body = {
        "requests": [{
            "sortRange": {
                "range": {
                    "sheetId": ws.id,
                    "startRowIndex": 1,
                    "endRowIndex": len(rows) + 1,
                    "startColumnIndex": 0,
                    "endColumnIndex": ls.N_COLS,
                },
                "sortSpecs": [{
                    "dimensionIndex": ls.COL_INDEX["Entrega"],
                    "sortOrder": "ASCENDING",
                }],
            }
        }]
    }
    ws.spreadsheet.batch_update(body)

    rows_after = ls.read_rows(ws)
    requests = []
    for i, _ in enumerate(rows_after, start=2):
        requests.append({
            "updateCells": {
                "range": {
                    "sheetId": ws.id,
                    "startRowIndex": i - 1,
                    "endRowIndex": i,
                    "startColumnIndex": ls.COL_INDEX["nomefinal"],
                    "endColumnIndex": ls.COL_INDEX["nomefinal"] + 1,
                },
                "rows": [{"values": [
                    {"userEnteredValue": {"formulaValue": nomefinal_formula_for_row(i)}}
                ]}],
                "fields": "userEnteredValue",
            }
        })
    if requests:
        ws.spreadsheet.batch_update({"requests": requests})


def apply_base_formatting(ws):
    n_rows = ws.row_count
    ws.format(
        f"{ls.COL_LETTER['status']}2:{ls.COL_LETTER['status']}{n_rows}",
        {"horizontalAlignment": "CENTER"},
    )
    ws.format(
        f"{ls.COL_LETTER['Entrega']}2:{ls.COL_LETTER['Entrega']}{n_rows}",
        {"numberFormat": {"type": "DATE", "pattern": "dd-mm"}},
    )


def update_hub(ss, cfg, run_date_iso):
    ws_hub = ls.get_or_create_tab(ss, cfg.tab_hub, rows=80, cols=12)
    ws_d = ss.worksheet(cfg.tab_demandas)
    ws_f = ss.worksheet(cfg.tab_finalizadas)

    demandas = ls.read_rows(ws_d)
    finalizadas = ls.read_rows(ws_f)

    today = date.fromisoformat(run_date_iso) if run_date_iso else date.today()

    from collections import Counter
    status_counts = Counter()
    for r in demandas:
        s = (r.get("status") or "").strip().lower() or "pendente"
        status_counts[s] += 1
    total_active = len(demandas)

    vertical_counts = Counter(r.get("Vertical", "(sem)") for r in demandas)

    proximos = []
    for r in demandas:
        ent = r.get("Entrega", "")
        try:
            d = date.fromisoformat(ent[:10])
        except Exception:
            continue
        delta = (d - today).days
        if -3 <= delta <= 7:
            proximos.append((d, delta, r))
    proximos.sort(key=lambda x: x[0])

    throughput = Counter()
    for r in finalizadas:
        ent = r.get("entregue") or r.get("Entrega") or ""
        try:
            d = date.fromisoformat(ent[:10])
        except Exception:
            continue
        if (today - d).days <= 30:
            throughput[d] += 1
    last_7d = sum(v for d, v in throughput.items() if (today - d).days <= 7)
    last_30d = sum(throughput.values())
    avg_per_day_30d = last_30d / 30 if last_30d else 0

    demandantes = Counter(
        (r.get("Demandante") or "").strip() for r in demandas if (r.get("Demandante") or "").strip()
    )
    hora_dist = Counter(
        (r.get("HoraEntrega") or "") for r in demandas if (r.get("HoraEntrega") or "")
    )

    ws_hub.clear()
    rows = []
    rows.append(["Dashboard — Avulsas Design"] + [""] * 11)
    rows.append([f"Última atualização: {datetime.now().isoformat(timespec='minutes')}"] + [""] * 11)
    rows.append([""] * 12)
    rows.append(["📌 Status", "Qtd", "", "🎯 Por vertical", "Qtd", "", "📅 Próximos 7 dias", "", "", "", "", ""])
    rows.append(["Total ativo", total_active, "", "", "", "", "Data", "Vertical", "Demanda", "Hora", "Status", ""])

    status_order = ["pendente", "em andamento", "aguardando", "bloqueado", "feito"]
    status_lines = []
    for s in status_order:
        if status_counts.get(s):
            status_lines.append((s.capitalize(), status_counts[s]))
    for s, c in status_counts.items():
        if s not in status_order:
            status_lines.append((s.capitalize() or "(sem)", c))

    vertical_lines = sorted(vertical_counts.items(), key=lambda x: -x[1])

    proximos_lines = []
    for d, delta, r in proximos[:15]:
        hora = r.get("HoraEntrega") or ""
        flag = "🔴 ATRASADA" if delta < 0 else ("🟡 HOJE" if delta == 0 else f"{delta}d")
        proximos_lines.append([d.strftime("%d-%m"), r.get("Vertical", ""), r.get("nomeCurto", ""), hora, flag])

    max_extra = max(len(status_lines), len(vertical_lines), len(proximos_lines), 1)
    for i in range(max_extra):
        row = [""] * 12
        if i < len(status_lines):
            row[0] = status_lines[i][0]; row[1] = status_lines[i][1]
        if i < len(vertical_lines):
            row[3] = vertical_lines[i][0]; row[4] = vertical_lines[i][1]
        if i < len(proximos_lines):
            p = proximos_lines[i]
            row[6] = p[0]; row[7] = p[1]; row[8] = p[2]; row[9] = p[3]; row[10] = p[4]
        rows.append(row)

    rows.append([""] * 12)
    rows.append(["📈 Throughput (últimos 30 dias)", "", "", "👥 Top demandantes", "Qtd", "", "⏰ Distribuição de hora", "Qtd", "", "", "", ""])
    rows.append(["Entregues últimos 7 dias", last_7d] + [""] * 10)
    rows.append(["Entregues últimos 30 dias", last_30d] + [""] * 10)
    rows.append(["Média por dia (30d)", round(avg_per_day_30d, 2)] + [""] * 10)

    top_demandantes = demandantes.most_common(5)
    top_horas = sorted(hora_dist.items(), key=lambda x: -x[1])[:5]
    max_extra = max(len(top_demandantes), len(top_horas), 1)
    for i in range(max_extra):
        row = [""] * 12
        if i < len(top_demandantes):
            row[3] = top_demandantes[i][0]; row[4] = top_demandantes[i][1]
        if i < len(top_horas):
            row[6] = top_horas[i][0]; row[7] = top_horas[i][1]
        rows.append(row)

    rows.append([""] * 12)
    rows.append(["💡 Insights de produtividade"] + [""] * 11)
    hoje_count = sum(1 for d, _, r in proximos if d == today)
    if hoje_count == 0:
        rows.append([f"Nenhuma entrega para hoje ({today.strftime('%d-%m')})"] + [""] * 11)
    else:
        rows.append([f"⚡ {hoje_count} entrega(s) para hoje ({today.strftime('%d-%m')})"] + [""] * 11)

    atrasadas = [r for d, delta, r in proximos if delta < 0]
    if atrasadas:
        rows.append([f"🔴 {len(atrasadas)} demanda(s) ATRASADAS — priorizar"] + [""] * 11)

    by_day = Counter()
    for r in demandas:
        ent = r.get("Entrega", "")
        try:
            d = date.fromisoformat(ent[:10])
            if d >= today:
                by_day[d] += 1
        except Exception:
            continue
    sobrecarga = [(d, c) for d, c in by_day.items() if c >= 5]
    sobrecarga.sort()
    for d, c in sobrecarga[:5]:
        rows.append([f"⚠️ Dia {d.strftime('%d-%m')} tem {c} demandas — considerar redistribuir"] + [""] * 11)

    if rows:
        rng = f"A1:L{len(rows)}"
        ws_hub.update(rng, rows, value_input_option="USER_ENTERED")

    ws_hub.format("A1:L1", {"textFormat": {"bold": True, "fontSize": 14}})
    ws_hub.format("A4:L4", {"textFormat": {"bold": True}, "backgroundColor": {"red": 0.93, "green": 0.93, "blue": 0.93}})
    ws_hub.format("A5:L5", {"textFormat": {"bold": True}})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True, help="path to config.json")
    parser.add_argument("--input", required=True, help="path to payload.json")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    cfg = ls.Config.load(args.config)
    with open(args.input, "r", encoding="utf-8") as f:
        payload = json.load(f)

    ss = ls.open_spreadsheet(cfg)
    report = apply_diff(ss, cfg, payload, dry_run=args.dry_run)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
