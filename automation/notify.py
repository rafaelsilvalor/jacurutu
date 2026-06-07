"""
notify.py — gera relatorio em portugues do sync, sem LLM, via template fixo.

Le payload.json (gerado por fetch.py) + sync_report.json (saida do sync.py) e
monta o texto do relatorio. Pode rodar como CLI ou ser importado.

Uso:
  python notify.py --payload payload.json --sync-report sync_report.json [--logs-dir logs]

O relatorio eh impresso no stdout E salvo em logs/sync-YYYY-MM-DD-HH-MM.txt.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional


# Forca UTF-8 no stdout/stderr pra rodar em Windows PowerShell (cp1252 default)
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass




SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/16NsWtEZ5yi_UipAPmEJc7_S_kT1WyiAdjts1QfmO5EQ"


def fmt_entrega(iso: Optional[str]) -> str:
    """Converte ISO para dd-mm. Retorna '??' se invalido."""
    if not iso:
        return "??"
    try:
        # Aceita 2026-05-20 ou 2026-05-20T19:00:00... ou ISO completo
        return datetime.fromisoformat(iso[:10]).strftime("%d-%m")
    except (ValueError, TypeError):
        return "??"


def fmt_vertical(raw: str, width: int = 25) -> str:
    """Trunca/pad o vertical pra ficar alinhado."""
    if not raw:
        return "(sem)".ljust(width)
    return raw[:width].ljust(width)


def build_report(payload: dict, sync_report: dict, run_time: Optional[datetime] = None) -> str:
    """Monta o texto do relatorio em portugues.

    payload: o JSON de payload.json (com issues, filtered_out, warnings)
    sync_report: o JSON de saida do sync.py (com added, moved, deleted, etc — listas de keys)
    """
    run_time = run_time or datetime.now()
    ts = run_time.strftime("%Y-%m-%d %H:%M")

    # Indexa payload.issues por key pra lookup rapido das novas
    issues_by_key = {i["key"]: i for i in payload.get("issues", [])}

    added = sync_report.get("added", [])
    moved = sync_report.get("moved", [])
    deleted = sync_report.get("deleted", [])
    preserved = sync_report.get("preserved", [])
    updated = sync_report.get("updated", [])
    skipped = sync_report.get("skipped_already_done", [])
    total_active = len(issues_by_key)  # aproximacao

    filtered_out = payload.get("filtered_out", [])
    warnings = payload.get("warnings", [])
    fallback_count = sum(1 for i in payload.get("issues", []) if i.get("copy_source") == "fallback")

    lines = []
    lines.append(f"Sync {ts} — +{len(added)} novos, -{len(deleted)} deletados, {len(moved)} movidos pra Finalizadas, {len(preserved)} preservados, {len(updated)} atualizados.")

    # Caso trivial: nada mudou
    if not added and not moved and not deleted and not preserved:
        if updated:
            lines.append(f"Sem novidades estruturais (so updates de campos).")
        else:
            lines.append(f"Sem alteracoes. {total_active} demandas ativas.")
        return _append_notes(lines, fallback_count, warnings, filtered_out, skipped)

    # Detalhe dos novos
    if added:
        lines.append("")
        lines.append(f"Novos ({len(added)}):")
        for key in added:
            issue = issues_by_key.get(key)
            if not issue:
                lines.append(f"  - {key} (sem detalhes — issue nao encontrada no payload)")
                continue
            vertical = issue.get("vertical_raw", "") or "(sem)"
            entrega = fmt_entrega(issue.get("entrega_iso"))
            parent = issue.get("parent_key", "?")
            summary = (issue.get("summary") or "")[:55]
            source = issue.get("copy_source", "?")
            lines.append(f"  - {vertical} | {entrega} | {key} ({parent}) | {summary} [{source}]")

    # Movidos
    if moved:
        lines.append("")
        lines.append(f"Movidos pra Finalizadas — status=Feito ({len(moved)}):")
        for key in moved:
            lines.append(f"  - {key}")

    # Deletados
    if deleted:
        lines.append("")
        lines.append(f"Deletados — sumiram do Jira, status pendente ({len(deleted)}):")
        for key in deleted:
            lines.append(f"  - {key}")

    # Preservados (com aviso)
    if preserved:
        lines.append("")
        lines.append(f"Preservados — sumiram do Jira mas com status manual ({len(preserved)}):")
        for key in preserved:
            lines.append(f"  - {key}  [confirmar se ainda relevante]")

    return _append_notes(lines, fallback_count, warnings, filtered_out, skipped)


def _append_notes(lines: list, fallback_count: int, warnings: list, filtered_out: list, skipped: list) -> str:
    """Apende a secao de notas + link da planilha."""
    notes = []
    if fallback_count:
        notes.append(f"{fallback_count} sem copy resolvido (fallback)")
    if warnings:
        notes.append(f"{len(warnings)} issues com campos parciais")
    if filtered_out:
        notes.append(f"{len(filtered_out)} filtradas (Backlog/etc)")
    if skipped:
        notes.append(f"{len(skipped)} ja finalizadas antes do sync (ignoradas)")

    if notes:
        lines.append("")
        lines.append("Notas:")
        for n in notes:
            lines.append(f"  - {n}")

    # Detalhe das warnings, se houver poucas
    if warnings and len(warnings) <= 10:
        lines.append("")
        lines.append("Warnings detalhados:")
        for w in warnings:
            lines.append(f"  - {w.get('key', '?')}: {w.get('field', '?')} — {w.get('issue', '?')}")

    lines.append("")
    lines.append(f"Planilha: {SPREADSHEET_URL}")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--payload", required=True, help="path to payload.json")
    parser.add_argument("--sync-report", required=True, help="path to sync_report.json (sync.py output)")
    parser.add_argument("--logs-dir", default="logs", help="folder para salvar o log .txt")
    parser.add_argument("--no-log", action="store_true", help="nao salva arquivo, so imprime")
    args = parser.parse_args()

    payload = json.load(open(args.payload, encoding="utf-8"))
    sync_report = json.load(open(args.sync_report, encoding="utf-8"))

    now = datetime.now()
    text = build_report(payload, sync_report, run_time=now)

    print(text)

    if not args.no_log:
        logs_dir = Path(args.logs_dir)
        logs_dir.mkdir(exist_ok=True)
        log_path = logs_dir / f"sync-{now:%Y-%m-%d-%H-%M}.txt"
        log_path.write_text(text, encoding="utf-8")
        print(f"\n[notify] Relatorio salvo em: {log_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
