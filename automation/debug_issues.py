"""
debug_issues.py — consulta keys especificas no Jira e mostra os campos relevantes
pra entender por que o JQL nao esta pegando.

Uso:
  python debug_issues.py MCA-62177 MCA-62170 MCA-62165
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

import requests
from requests.auth import HTTPBasicAuth


def main():
    if len(sys.argv) < 2:
        print("Uso: python debug_issues.py KEY1 [KEY2 ...]")
        sys.exit(1)

    keys = sys.argv[1:]

    here = Path(__file__).resolve().parent
    cfg = json.load(open(here / "config.json", encoding="utf-8"))
    creds = json.load(open(here / "jira_credentials.json", encoding="utf-8"))

    jql = f"key IN ({','.join(keys)})"
    url = f"{cfg.get('jira_api_base', 'https://estrategia.atlassian.net')}/rest/api/3/search/jql"
    body = {
        "jql": jql,
        "fields": [
            "summary",
            "status",
            "assignee",
            "parent",
            "issuetype",
            "customfield_10065",  # Vertical
            "customfield_11119",  # Possivel Esteira (vamos ver)
            "customfield_10031",  # Data evento
        ],
        "maxResults": 100,
    }
    # Pede tambem todos os customfields pra inspecao
    body["fields"] = ["*all"]

    r = requests.post(
        url,
        json=body,
        auth=HTTPBasicAuth(creds["email"], creds["api_token"]),
        timeout=30,
    )
    if r.status_code != 200:
        print(f"ERRO {r.status_code}: {r.text[:500]}")
        sys.exit(2)

    data = r.json()
    issues = data.get("issues", [])
    print(f"\n=== Encontradas {len(issues)} issue(s) ===\n")

    for issue in issues:
        f = issue.get("fields", {})
        print(f"--- {issue.get('key')} ---")
        print(f"  Summary:    {f.get('summary')}")
        print(f"  Issuetype:  {(f.get('issuetype') or {}).get('name')}")
        print(f"  Status:     {(f.get('status') or {}).get('name')!r}")
        assignee = f.get("assignee")
        if assignee:
            print(f"  Assignee:   {assignee.get('displayName')} ({assignee.get('accountId')})")
        else:
            print(f"  Assignee:   <EMPTY>")
        parent = f.get("parent") or {}
        print(f"  Parent key: {parent.get('key')}")
        print(f"  Project:    {(f.get('project') or {}).get('key')}")
        # Procura customfields que possam ser Esteira
        for k, v in f.items():
            if k.startswith("customfield_") and v:
                # Identifica nome legivel via 'schema' se disponivel
                if isinstance(v, dict) and "value" in v:
                    print(f"  {k}: {v.get('value')}")
                elif isinstance(v, list) and v and isinstance(v[0], dict) and "value" in v[0]:
                    print(f"  {k}: {[item.get('value') for item in v]}")
                elif isinstance(v, str):
                    print(f"  {k}: {v[:80]}")
        print()


if __name__ == "__main__":
    main()
