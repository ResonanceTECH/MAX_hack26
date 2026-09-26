#!/usr/bin/env python3
"""Wave A smoke: auth + seed + role-scoped endpoints against live backend.

Usage:
  python backend_max/scripts/smoke_wave_a.py
  BASE_URL=http://localhost:8000 python backend_max/scripts/smoke_wave_a.py
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.environ.get("BASE_URL", "http://localhost:8000").rstrip("/")

ROLES = {
    "PLATFORM_ADMIN": 7777001,
    "COMPANY_ADMIN": 7777002,
    "BUSINESS_USER": 7777003,
    "MODERATOR": 7777009,
}


def req(method: str, path: str, token: str | None = None, body: dict | None = None):
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            payload = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            payload = raw
        return e.code, payload


def auth(max_user_id: int) -> str:
    status, data = req(
        "POST",
        "/auth/max",
        body={"dev_max_user_id": max_user_id, "dev_first_name": "Smoke", "dev_last_name": "Test"},
    )
    if status != 200 or not data or "access_token" not in data:
        raise SystemExit(f"auth failed for {max_user_id}: {status} {data}")
    return data["access_token"]


def ok(label: str, cond: bool, detail: str = "") -> None:
    mark = "PASS" if cond else "FAIL"
    print(f"[{mark}] {label}" + (f" — {detail}" if detail else ""))
    if not cond:
        raise SystemExit(1)


def main() -> None:
    status, health = req("GET", "/health")
    ok("health", status == 200 and (health or {}).get("status") == "ok", str(health))

    admin_tok = auth(ROLES["PLATFORM_ADMIN"])
    status, _ = req("POST", "/api/admin/seed", token=admin_tok)
    ok("seed", status in (200, 201), f"status={status}")

    # Platform admin
    status, users = req("GET", "/admin/users", token=admin_tok)
    ok("admin users", status == 200 and isinstance(users, list) and len(users) >= 4, f"n={len(users) if isinstance(users, list) else users}")
    status, companies = req("GET", "/admin/companies", token=admin_tok)
    ok("admin companies", status == 200 and isinstance(companies, list) and len(companies) >= 1)
    status, analytics = req("GET", "/admin/analytics/overview", token=admin_tok)
    ok(
        "admin analytics",
        status == 200 and isinstance(analytics, dict) and analytics.get("is_model_data") is False,
        str(analytics),
    )
    status, dicts = req("GET", "/admin/dictionaries", token=admin_tok)
    ok("admin dictionaries", status == 200 and isinstance(dicts, list) and len(dicts) > 0, f"n={len(dicts) if isinstance(dicts, list) else dicts}")

    # Company admin workspace
    ca = auth(ROLES["COMPANY_ADMIN"])
    status, services = req("GET", "/companies/me/services", token=ca)
    ok("company services", status == 200 and isinstance(services, list) and len(services) >= 1, f"n={len(services) if isinstance(services, list) else services}")
    status, cases = req("GET", "/companies/me/cases", token=ca)
    ok("company cases", status == 200 and isinstance(cases, list) and len(cases) >= 1)
    status, proposals = req("GET", "/proposals/mine", token=ca)
    ok("company proposals", status == 200 and isinstance(proposals, list) and len(proposals) >= 1, f"n={len(proposals) if isinstance(proposals, list) else proposals}")

    # Business user
    bu = auth(ROLES["BUSINESS_USER"])
    status, favs = req("GET", "/favorites", token=bu)
    ok("business favorites", status == 200 and isinstance(favs, list))
    status, recs = req("GET", "/me/recommendations", token=bu)
    ok("business recommendations", status == 200 and isinstance(recs, list))

    # Moderator
    mod = auth(ROLES["MODERATOR"])
    status, queue = req("GET", "/moderation/queue", token=mod)
    ok("moderation queue", status == 200 and isinstance(queue, list) and len(queue) >= 1, f"n={len(queue) if isinstance(queue, list) else queue}")
    status, reports = req("GET", "/reports", token=mod)
    ok("reports", status == 200 and isinstance(reports, list) and len(reports) >= 1, f"n={len(reports) if isinstance(reports, list) else reports}")
    status, esc = req("GET", "/escalations", token=mod)
    ok("escalations", status == 200 and isinstance(esc, list) and len(esc) >= 1)

    # Create report as business user
    status, created = req(
        "POST",
        "/reports",
        token=bu,
        body={
            "target_type": "company",
            "target_id": "1",
            "target_name": "Smoke report",
            "type": "OTHER",
            "description": "smoke wave a",
        },
    )
    ok("create report", status in (200, 201) and isinstance(created, dict), str(created))

    print("\nWave A smoke OK")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.URLError as e:
        print(f"FAIL cannot reach {BASE}: {e}", file=sys.stderr)
        sys.exit(1)
