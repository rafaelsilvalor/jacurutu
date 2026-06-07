"""
run_local.py — orquestrador do pipeline completo, pra rodar via Windows Task Scheduler.

Executa em sequencia:
  1. fetch.py   → payload.json
  2. sync.py    → sync_report.json (stdout do sync.py)
  3. notify.py  → logs/sync-YYYY-MM-DD-HH-MM.txt

Loga tudo num arquivo de log diario (logs/run-YYYY-MM-DD.log) — append.
Sai com exit code 0 se OK, 1 se qualquer step falhar.

Uso:
  python run_local.py

Sem argumentos. Le config.json no diretorio do proprio script.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import traceback
from datetime import datetime
from pathlib import Path


# Forca UTF-8 no stdout/stderr pra rodar em Windows PowerShell (cp1252 default)
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass




# Diretorio onde os scripts vivem (mesmo lugar deste arquivo)
SCRIPT_DIR = Path(__file__).resolve().parent


def log_line(log_file: Path, msg: str) -> None:
    """Append uma linha de log com timestamp."""
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}\n"
    print(line, end="")
    with log_file.open("a", encoding="utf-8") as f:
        f.write(line)


def run_step(name: str, cmd: list[str], log_file: Path, capture_stdout: bool = False) -> tuple[bool, str, str]:
    """Roda um subprocess, loga inicio/fim, retorna (ok, stdout, stderr).

    Se capture_stdout=True, captura stdout pra retornar.
    stderr eh sempre capturado (e logado).
    """
    log_line(log_file, f"==> Iniciando: {name}")
    log_line(log_file, f"    cmd: {' '.join(cmd)}")
    try:
        result = subprocess.run(
            cmd,
            cwd=SCRIPT_DIR,
            capture_output=True,
            text=True,
            check=False,
            encoding="utf-8",
        )
    except FileNotFoundError as e:
        log_line(log_file, f"    ERRO: comando nao encontrado — {e}")
        return False, "", str(e)
    except Exception as e:
        log_line(log_file, f"    ERRO inesperado: {e}")
        return False, "", str(e)

    if result.stderr:
        for line in result.stderr.splitlines():
            log_line(log_file, f"    [stderr] {line}")

    if result.returncode != 0:
        log_line(log_file, f"    FALHOU com exit code {result.returncode}")
        return False, result.stdout, result.stderr

    log_line(log_file, f"    OK (exit 0)")
    return True, result.stdout, result.stderr


def main() -> int:
    # Cria pasta de logs se nao existir
    logs_dir = SCRIPT_DIR / "logs"
    logs_dir.mkdir(exist_ok=True)

    today = datetime.now().strftime("%Y-%m-%d")
    daily_log = logs_dir / f"run-{today}.log"

    log_line(daily_log, "")
    log_line(daily_log, "=" * 60)
    log_line(daily_log, "Run iniciado")
    log_line(daily_log, f"Script dir: {SCRIPT_DIR}")

    # Verifica arquivos requeridos
    required = ["config.json", "jira_credentials.json", "credentials.json", "fetch.py", "sync.py", "notify.py"]
    missing = [f for f in required if not (SCRIPT_DIR / f).exists()]
    if missing:
        log_line(daily_log, f"ABORTANDO — arquivos faltando: {missing}")
        return 1

    # Step 1 — fetch.py
    payload_path = SCRIPT_DIR / "payload.json"
    ok, _, _ = run_step(
        "fetch.py",
        [sys.executable, "fetch.py", "--config", "config.json", "--output", "payload.json"],
        daily_log,
    )
    if not ok:
        log_line(daily_log, "fetch.py falhou; abortando")
        return 1
    if not payload_path.exists():
        log_line(daily_log, "payload.json nao foi gerado; abortando")
        return 1

    # Step 2 — sync.py (captura stdout pro JSON do report)
    sync_report_path = SCRIPT_DIR / "sync_report.json"
    ok, stdout, _ = run_step(
        "sync.py",
        [sys.executable, "sync.py", "--config", "config.json", "--input", "payload.json"],
        daily_log,
        capture_stdout=True,
    )
    if not ok:
        log_line(daily_log, "sync.py falhou; abortando")
        return 1

    # Persiste o sync report (stdout do sync.py)
    try:
        # Valida que stdout eh JSON
        report_obj = json.loads(stdout)
        sync_report_path.write_text(
            json.dumps(report_obj, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        log_line(daily_log, f"sync_report.json salvo ({len(stdout)} bytes)")
    except json.JSONDecodeError as e:
        log_line(daily_log, f"sync.py stdout nao eh JSON valido: {e}")
        log_line(daily_log, f"stdout literal:\n{stdout[:500]}")
        return 1

    # Step 3 — notify.py (gera o relatorio em portugues)
    ok, notify_stdout, _ = run_step(
        "notify.py",
        [
            sys.executable, "notify.py",
            "--payload", "payload.json",
            "--sync-report", "sync_report.json",
            "--logs-dir", "logs",
        ],
        daily_log,
        capture_stdout=True,
    )
    if not ok:
        log_line(daily_log, "notify.py falhou (sync ja foi aplicado); continuando")

    # Log final
    log_line(daily_log, "Run concluido com sucesso")
    log_line(daily_log, "")

    # Imprime relatorio no stdout (Task Scheduler pode logar isso)
    if notify_stdout:
        print("\n" + "=" * 60)
        print("RELATORIO DO RUN")
        print("=" * 60)
        print(notify_stdout)

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nInterrompido pelo usuario", file=sys.stderr)
        sys.exit(130)
    except Exception:
        traceback.print_exc()
        sys.exit(1)
