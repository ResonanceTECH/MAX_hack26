#!/usr/bin/env python3
"""Wave B smoke: Manager/Viewer RBAC, invites, WebForge customer, reports.

Usage:
  python backend_max/scripts/smoke_wave_b.py
  BASE_URL=http://localhost:8000 python backend_max/scripts/smoke_wave_b.py
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
    "MANAGER": 7777010,
    "VIEWER": 7777011,
}

PENDING_TOKEN = "demo-invite-pending-digitallab"


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


def auth(max_user_id: int, first_name: str = "Smoke") -> str:
    status, data = req(
        "POST",
        "/auth/max",
        body={"dev_max_user_id": max_user_id, "dev_first_name": first_name, "dev_last_name": "Test"},
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

    # Manager 7777010
    mgr = auth(ROLES["MANAGER"], "Игорь")
    status, me = req("GET", "/me", token=mgr)
    ok(
        "manager /me member_role",
        status == 200 and (me or {}).get("member_role") == "MANAGER",
        str(me),
    )
    status, services = req("GET", "/companies/me/services", token=mgr)
    ok(
        "manager service list",
        status == 200 and isinstance(services, list) and len(services) >= 1,
        f"n={len(services) if isinstance(services, list) else services}",
    )
    status, _ = req(
        "POST",
        "/companies/me/members",
        token=mgr,
        body={
            "email": "smoke-denied@example.com",
            "first_name": "No",
            "last_name": "Invite",
            "role": "VIEWER",
        },
    )
    ok("manager invite denied", status == 403, f"status={status}")

    # Viewer 7777011
    viewer = auth(ROLES["VIEWER"], "Мария")
    status, me_v = req("GET", "/me", token=viewer)
    ok(
        "viewer /me member_role",
        status == 200 and (me_v or {}).get("member_role") == "VIEWER",
        str(me_v),
    )
    status, _ = req(
        "POST",
        "/companies/me/services",
        token=viewer,
        body={"title": "Blocked", "description": "x", "category": "IT"},
    )
    ok("viewer service create 403", status == 403, f"status={status}")

    # Invite get + accept (fresh user so pending token still available after re-seed)
    # Re-seed restores pending token; accept as new max_user_id
    invitee = auth(7777098, "Invitee")
    status, inv = req("GET", f"/company-invitations/{PENDING_TOKEN}", token=invitee)
    ok(
        "invite get",
        status == 200 and isinstance(inv, dict) and inv.get("token") == PENDING_TOKEN,
        str(inv),
    )
    if status == 200 and (inv or {}).get("status") == "pending":
        status, accepted = req(
            "POST",
            f"/company-invitations/{PENDING_TOKEN}/accept",
            token=invitee,
        )
        ok(
            "invite accept",
            status == 200 and (accepted or {}).get("status") == "accepted",
            str(accepted),
        )
    else:
        # Already accepted in prior smoke — create fresh invite as CA then accept
        ca = auth(ROLES["COMPANY_ADMIN"])
        status, member = req(
            "POST",
            "/companies/me/members",
            token=ca,
            body={
                "email": "smoke-invitee@example.com",
                "first_name": "Smoke",
                "last_name": "Invitee",
                "role": "VIEWER",
                "message": "smoke",
            },
        )
        ok("create invite fallback", status in (200, 201), str(member))
        # Look up token via members list is not exposed — accept by numeric id fallback
        mid = (member or {}).get("id")
        status, by_id = req("GET", f"/company-invitations/{mid}", token=invitee)
        token = (by_id or {}).get("token") or str(mid)
        status, accepted = req("POST", f"/company-invitations/{token}/accept", token=invitee)
        ok("invite accept fallback", status == 200, str(accepted))

    # WebForge customer: own opportunities + proposals
    bu = auth(ROLES["BUSINESS_USER"], "Ольга")
    status, opps = req("GET", "/opportunities/mine", token=bu)
    # Fallback path if /opportunities/mine missing — use list filter via dashboard
    if status == 404:
        status, dash = req("GET", "/me/dashboard", token=bu)
        mine = (dash or {}).get("my_requests") if isinstance(dash, dict) else None
        ok(
            "webforge customer opportunities",
            status == 200 and isinstance(mine, list) and any("Редизайн" in (o.get("title") or "") for o in mine),
            str(mine)[:200] if mine else str(dash),
        )
        redesign = next((o for o in (mine or []) if "Редизайн" in (o.get("title") or "")), None)
    else:
        ok(
            "webforge customer opportunities",
            status == 200
            and isinstance(opps, list)
            and any("Редизайн" in (o.get("title") or "") for o in (opps or [])),
            f"n={len(opps) if isinstance(opps, list) else opps}",
        )
        redesign = next((o for o in (opps or []) if "Редизайн" in (o.get("title") or "")), None)

    if redesign:
        oid = redesign["id"]
        status, props = req("GET", f"/opportunities/{oid}/proposals", token=bu)
        ok(
            "webforge see proposals",
            status == 200 and isinstance(props, list) and len(props) >= 1,
            f"n={len(props) if isinstance(props, list) else props}",
        )
    else:
        ok("webforge see proposals", False, "redesign opportunity not found")

    # Report create
    status, report = req(
        "POST",
        "/reports",
        token=bu,
        body={
            "target_type": "company",
            "target_id": "smoke-wave-b",
            "target_name": "Smoke Wave B",
            "type": "SPAM",
            "description": "smoke report",
        },
    )
    ok("report create", status in (200, 201) and isinstance(report, dict), str(report))

    print("\nWave B smoke OK")


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
