"""
debug_who.py — descobre quem voce e no Jira e o que voce ve.

Testa em ordem:
  1. /myself: confirma quem o token autentica como
  2. project = MCA sem nenhum outro filtro
  3. project = MCA com issuetype variations (DESIGN, Design, design)
  4. Lista os issuetypes que aparecem em MCA pra ver os nomes reais

Uso:
  python debug_who.py
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

import fetch


def main():
    here = Path(__file__).resolve().parent
    cfg = fetch.load_config(str(here / "config.json"))
    email, token = fetch.load_jira_credentials(cfg["jira_credentials_path"])
    client = fetch.JiraClient(cfg["jira_api_base"], email, token)

    # ---- [1] /myself ----
    print("[1] Quem o token autentica como (GET /rest/api/3/myself)?")
    try:
        url = f"{client.base_url}/rest/api/3/myself"
        r = client.session.get(url, auth=client.auth, timeout=30)
        if r.status_code == 200:
            me = r.json()
            print(f"  displayName: {me.get('displayName')}")
            print(f"  emailAddress: {me.get('emailAddress')}")
            print(f"  accountId: {me.get('accountId')}")
            print(f"  active: {me.get('active')}")
        else:
            print(f"  ERRO {r.status_code}: {r.text[:300]}")
    except Exception as e:
        print(f"  ERRO: {e}")
    print()

    # ---- [2] project = MCA sem filtro ----
    print("[2] 'project = MCA' (qualquer issuetype, qualquer status):")
    try:
        issues = client.search_jql("project = MCA ORDER BY updated DESC", ["summary", "issuetype", "status"], max_results=10)
        print(f"  -> {len(issues)} issues")
        for issue in issues:
            f = issue.get("fields") or {}
            itype = (f.get("issuetype") or {}).get("name", "?")
            stt = (f.get("status") or {}).get("name", "?")
            print(f"     {issue.get('key')}  type={itype!r}  status={stt!r}  {(f.get('summary') or '')[:50]!r}")
    except Exception as e:
        print(f"  ERRO: {e}")
    print()

    # ---- [3] variacoes de issuetype ----
    for variant in ["DESIGN", "Design", "design", "Subtask Design", "Design Subtask"]:
        print(f"[3] 'project = MCA AND issuetype = {variant!r}':")
        try:
            jql = f'project = MCA AND issuetype = "{variant}"'
            issues = client.search_jql(jql, ["summary"], max_results=3)
            print(f"  -> {len(issues)} issues")
        except Exception as e:
            print(f"  ERRO: {e}")
    print()

    # ---- [4] todos issuetypes disponíveis ----
    print("[4] Issuetypes que aparecem nas issues recentes de MCA:")
    try:
        issues = client.search_jql("project = MCA ORDER BY updated DESC", ["issuetype"], max_results=50)
        types = {}
        for issue in issues:
            itype = ((issue.get("fields") or {}).get("issuetype") or {}).get("name")
            if itype:
                types[itype] = types.get(itype, 0) + 1
        for t, n in sorted(types.items(), key=lambda x: -x[1]):
            print(f"  {n:3}  {t!r}")
    except Exception as e:
        print(f"  ERRO: {e}")
    print()

    # ---- [5] Tenta listar projetos visiveis ----
    print("[5] Projetos visiveis pro token (top 20):")
    try:
        url = f"{client.base_url}/rest/api/3/project/search?maxResults=20"
        r = client.session.get(url, auth=client.auth, timeout=30)
        if r.status_code == 200:
            data = r.json()
            for p in data.get("values", []):
                print(f"  {p.get('key'):8}  {p.get('name')}")
        else:
            print(f"  ERRO {r.status_code}: {r.text[:300]}")
    except Exception as e:
        print(f"  ERRO: {e}")


if __name__ == "__main__":
    main()
