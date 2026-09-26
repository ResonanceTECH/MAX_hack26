"""Wave B RBAC: Manager/Viewer membership, invites, reports, case ownership."""

from __future__ import annotations


def _seed(client, login):
    admin = login(7777001, "Админ")
    r = client.post("/api/admin/seed", headers=admin)
    assert r.status_code == 200, r.text
    return admin


def test_manager_can_list_and_create_services(client, login):
    _seed(client, login)
    mgr = login(7777010, "Игорь")
    me = client.get("/me", headers=mgr).json()
    assert me["member_role"] == "MANAGER"
    assert me["company_id"] is not None

    listed = client.get("/companies/me/services", headers=mgr)
    assert listed.status_code == 200
    assert isinstance(listed.json(), list)

    created = client.post(
        "/companies/me/services",
        json={"title": "Менеджерская услуга", "description": "test", "category": "IT-разработка"},
        headers=mgr,
    )
    assert created.status_code == 201, created.text


def test_manager_denied_invite_member(client, login):
    _seed(client, login)
    mgr = login(7777010, "Игорь")
    r = client.post(
        "/companies/me/members",
        json={
            "email": "newhire@example.com",
            "first_name": "Новый",
            "last_name": "Сотрудник",
            "role": "VIEWER",
        },
        headers=mgr,
    )
    assert r.status_code == 403


def test_viewer_denied_service_create(client, login):
    _seed(client, login)
    viewer = login(7777011, "Мария")
    me = client.get("/me", headers=viewer).json()
    assert me["member_role"] == "VIEWER"

    r = client.post(
        "/companies/me/services",
        json={"title": "Нельзя", "description": "x", "category": "IT"},
        headers=viewer,
    )
    assert r.status_code == 403


def test_business_user_denied_company_team(client, login):
    _seed(client, login)
    bu = login(7777003, "Ольга")
    me = client.get("/me", headers=bu).json()
    assert me.get("company_id") is not None, me
    assert me.get("member_role") in (None, "")
    r = client.post(
        "/companies/me/members",
        json={
            "email": "hack@example.com",
            "first_name": "X",
            "last_name": "Y",
            "role": "MANAGER",
        },
        headers=bu,
    )
    assert r.status_code == 403, r.text


def test_platform_admin_denied_create_opportunity(client, login, company_payload_factory):
    _seed(client, login)
    pa = login(7777001, "Анна")
    # PA owns МебельПро but marketplace create is intentionally denied
    r = client.post(
        "/opportunities",
        json={"description": "Нужна разработка сайта, бюджет 100-200 тысяч, Москва."},
        headers=pa,
    )
    assert r.status_code == 403


def test_invite_accept_flow_with_token(client, login):
    _seed(client, login)
    from backend_max.app.roles import SEED_PENDING_INVITE_TOKEN

    invitee = login(7777099, "Приглашённый")
    got = client.get(f"/company-invitations/{SEED_PENDING_INVITE_TOKEN}", headers=invitee)
    assert got.status_code == 200, got.text
    body = got.json()
    assert body["token"] == SEED_PENDING_INVITE_TOKEN
    assert body["status"] == "pending"
    assert body["company_name"] == "DigitalLab"
    assert body["role"] == "MANAGER"

    accepted = client.post(
        f"/company-invitations/{SEED_PENDING_INVITE_TOKEN}/accept",
        headers=invitee,
    )
    assert accepted.status_code == 200, accepted.text
    assert accepted.json()["status"] == "accepted"

    me = client.get("/me", headers=invitee).json()
    assert me["member_role"] == "MANAGER"
    assert me["company_id"] is not None


def test_report_duplicate_409(client, login):
    _seed(client, login)
    bu = login(7777003, "Ольга")
    payload = {
        "target_type": "company",
        "target_id": "dup-target-1",
        "target_name": "Dup Co",
        "type": "SPAM",
        "description": "spam",
    }
    r1 = client.post("/reports", json=payload, headers=bu)
    assert r1.status_code == 201, r1.text
    r2 = client.post("/reports", json=payload, headers=bu)
    assert r2.status_code == 409


def test_case_ownership_on_proposal(client, login, company_payload_factory):
    _seed(client, login)
    customer = login(9301, "ЗаказчикКейс")
    client.put(
        "/companies/me",
        json=company_payload_factory("КейсЗаказчик", ["Производство"]),
        headers=customer,
    )
    created = client.post(
        "/opportunities",
        json={
            "description": "Нужна разработка интернет-магазина. React, бюджет 400-600 тысяч, Москва."
        },
        headers=customer,
    )
    assert created.status_code == 201, created.text
    oid = created.json()["id"]

    # DigitalLab company admin proposes with foreign case title → 422
    ca = login(7777002, "Дмитрий")
    bad = client.post(
        f"/opportunities/{oid}/proposals",
        json={
            "price": 500_000,
            "term_days": 40,
            "solution_text": "ok",
            "case_ref": "Совершенно чужой кейс которого нет",
        },
        headers=ca,
    )
    assert bad.status_code == 422

    good = client.post(
        f"/opportunities/{oid}/proposals",
        json={
            "price": 500_000,
            "term_days": 40,
            "solution_text": "ok",
            "case_ref": "Интернет-магазин мебели",
        },
        headers=ca,
    )
    assert good.status_code == 201, good.text


def test_viewer_denied_shortlist(client, login):
    _seed(client, login)
    viewer = login(7777011, "Мария")
    # Viewer has no MANAGE_SHORTLIST — any shortlist call should 403
    r = client.post(
        "/opportunities/1/shortlist",
        json={"company_id": 1},
        headers=viewer,
    )
    assert r.status_code == 403
