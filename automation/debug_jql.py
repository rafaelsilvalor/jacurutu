"""
debug_jql.py — quebra o JQL principal em pedacos e roda cada um pra descobrir
qual clausula esta zerando os resultados.

Quando fetch.py retorna 0 issues e voce sabe que tem coisa la, alguma clausula
ficou inconsistente (nome de campo mudou, valor de dropdown renomeado, status
renomeado, etc).

Uso:
  python debug_jql.py
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


PROBES = [
    # nome -> JQL pra rodar
    ("project MCA basic",
     'project = MCA AND issuetype = DESIGN'),

    ("project MCA + AVULSAS (testa nome do campo Esteira)",
     'project = MCA AND issuetype = DESIGN AND "[EC] Esteira[Dropdown]" = AVULSAS'),

    ("project MCA + AVULSAS + sem dono",
     'project = MCA AND issuetype = DESIGN AND "[EC] Esteira[Dropdown]" = AVULSAS AND assignee IS EMPTY'),

    ("project MCA + AVULSAS + FILA DE EXECUCAO (testa nome do status)",
     'project = MCA AND issuetype = DESIGN AND "[EC] Esteira[Dropdown]" = AVULSAS AND status = "FILA DE EXECUCAO"'),

    ("minhas em qualquer projeto (testa user_id)",
     'assignee = currentUser() AND issuetype = DESIGN AND statusCategory != Done'),

    ("minhas com user_id do config",
     None),  # preenchido abaixo

    ("Part A completa (avulsas sem dono)",
     '(project IN (MCA, PMA) AND issuetype = DESIGN AND "[EC] Esteira[Dropdown]" = AVULSAS '
     'AND status = "FILA DE EXECUCAO" AND assignee IS EMPTY AND summary !~ "Template")'),
]


def main():
    here = Path(__file__).resolve().parent
    cfg = fetch.load_config(str(here / "config.json"))
    email, token = fetch.load_jira_credentials(cfg["jira_credentials_path"])
    client = fetch.JiraClient(cfg["jira_api_base"], email, token)

    print(f"Atlassian user_id no config: {cfg.get('jira_user_id')}")
    print(f"Jira base URL: {cfg.get('jira_api_base')}")
    print()

    # Preenche o probe que depende do user_id
    user_id = cfg["jira_user_id"]
    for i, (name, jql) in enumerate(PROBES):
        if jql is None:
            PROBES[i] = (name, f'assignee = {user_id} AND issuetype = DESIGN AND statusCategory != Done')

    for name, jql in PROBES:
        print(f"--- {name} ---")
        print(f"  JQL: {jql}")
        try:
            issues = client.search_jql(jql, ["summary", "status"], max_results=20)
            print(f"  -> {len(issues)} issues")
            for issue in issues[:3]:
                key = issue.get("key")
                summary = (issue.get("fields") or {}).get("summary", "")[:60]
                status = ((issue.get("fields") or {}).get("status") or {}).get("name", "")
                print(f"     {key}  [{status}]  {summary!r}")
            if len(issues) > 3:
                print(f"     ... +{len(issues) - 3}")
        except Exception as e:
            print(f"  ERRO: {e}")
        print()


if __name__ == "__main__":
    main()
