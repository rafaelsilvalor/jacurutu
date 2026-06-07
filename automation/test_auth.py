"""
test_auth.py — diagnostico isolado pra descobrir se o erro 500 do sync.py
e auth (token/service account) ou se eh problema do lado do Google Sheets API
especificamente com a planilha.

Faz 4 testes em ordem:
  [1/4] Carrega credenciais do service account
  [2/4] Lista arquivos do Drive (testa Drive API + auth)
  [3/4] Tenta abrir a planilha com fetch metadata MINIMO (so titulo)
  [4/4] Tenta abrir a planilha com fetch metadata COMPLETO (igual o gspread faz)

Cada teste imprime OK ou erro detalhado. O ultimo a falhar indica a fonte.

Uso:
  python test_auth.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except (AttributeError, ValueError):
    pass


def main():
    print("=" * 60)
    print("Test Auth — diagnostico Google Sheets / Service Account")
    print("=" * 60)
    print()

    here = Path(__file__).resolve().parent
    cfg_path = here / "config.json"
    if not cfg_path.exists():
        print(f"ERRO: config.json nao encontrado em {cfg_path}")
        sys.exit(1)

    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    creds_path = here / cfg["credentials_path"]
    spreadsheet_id = cfg["spreadsheet_id"]
    print(f"  credentials_path: {creds_path}")
    print(f"  spreadsheet_id:   {spreadsheet_id}")
    print()

    # ---------------- [1/4] carrega credenciais ----------------
    print("[1/4] Carregando service account JSON...")
    try:
        from google.oauth2.service_account import Credentials
        SCOPES = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
        ]
        creds = Credentials.from_service_account_file(str(creds_path), scopes=SCOPES)
        sa_email = creds.service_account_email
        print(f"  OK — service account: {sa_email}")
    except Exception as e:
        print(f"  FALHOU: {e}")
        print()
        print("  -> Problema esta no JSON do service account ou no arquivo.")
        sys.exit(2)

    print()

    # ---------------- [2/4] lista Drive ----------------
    print("[2/4] Testando Drive API (lista 5 arquivos)...")
    try:
        from googleapiclient.discovery import build
        drive = build("drive", "v3", credentials=creds, cache_discovery=False)
        r = drive.files().list(pageSize=5, fields="files(id,name)").execute()
        files = r.get("files", [])
        print(f"  OK — Drive respondeu com {len(files)} arquivo(s) visiveis")
        for f in files:
            print(f"    - {f.get('name')}")
    except Exception as e:
        print(f"  FALHOU: {type(e).__name__}: {e}")
        print()
        print("  -> Se foi 401/403: service account sem permissao.")
        print("  -> Se foi 500/503: API do Google instavel.")
        sys.exit(3)

    print()

    # ---------------- [3/4] metadata minimo ----------------
    print("[3/4] Tentando ler so 'properties.title' da planilha (request leve)...")
    try:
        sheets = build("sheets", "v4", credentials=creds, cache_discovery=False)
        meta = sheets.spreadsheets().get(
            spreadsheetId=spreadsheet_id,
            fields="properties.title",
        ).execute()
        print(f"  OK — Planilha: {meta.get('properties', {}).get('title')!r}")
    except Exception as e:
        print(f"  FALHOU: {type(e).__name__}: {e}")
        print()
        if "404" in str(e):
            print("  -> Planilha nao encontrada ou service account nao tem acesso.")
            print(f"     Compartilha {sa_email} como Editor da planilha.")
        elif "403" in str(e):
            print("  -> Service account sem permissao na planilha.")
            print(f"     Compartilha {sa_email} como Editor.")
        elif "500" in str(e):
            print("  -> Sheets API com problema interno.")
        sys.exit(4)

    print()

    # ---------------- [4/4] metadata completo (o que o gspread faz) ----------------
    print("[4/4] Tentando ler metadata COMPLETO (igual gspread faz no open_by_key)...")
    try:
        meta_full = sheets.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
        n_sheets = len(meta_full.get("sheets", []))
        print(f"  OK — {n_sheets} aba(s) na planilha")
        for s in meta_full.get("sheets", []):
            p = s.get("properties", {})
            tables = s.get("tables", []) or []
            bands = s.get("bandedRanges", []) or []
            print(f"    - {p.get('title')!r}: tables={len(tables)}, bandedRanges={len(bands)}")
    except Exception as e:
        print(f"  FALHOU: {type(e).__name__}: {e}")
        print()
        print("  >>> ACHEI O CULPADO. <<<")
        print("  O metadata completo da planilha esta quebrando o servidor.")
        print("  Provavel causa: algum estado inconsistente entre bandedRanges/tables.")
        print()
        print("  Caminho de fix:")
        print("    1. Abre a planilha no navegador")
        print("    2. Inserir > tabela existente: remove as tabelas")
        print("    3. Remove tambem qualquer banded range manual (Formatar > Cores alternadas > Remover)")
        print("    4. Roda novamente. O sync.py recria a tabela limpa via API.")
        sys.exit(5)

    print()
    print("=" * 60)
    print("TUDO OK — auth, Drive, Sheets API e metadata da planilha funcionando.")
    print("Se o sync.py continua falhando, o problema esta em outro request")
    print("(provavelmente um batchUpdate especifico, nao no open_by_key).")
    print("=" * 60)


if __name__ == "__main__":
    main()
