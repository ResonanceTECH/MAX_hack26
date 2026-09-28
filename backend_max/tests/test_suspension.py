from __future__ import annotations

from backend_max.app.db import SessionLocal
from backend_max.app.models import Company, User


def _set_user_status(max_user_id: int, status_value: str) -> None:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.max_user_id == max_user_id).first()
        assert user is not None, f"user {max_user_id} not found"
        user.status = status_value
        db.commit()
    finally:
        db.close()


def _set_company_status(company_id: int, status_value: str) -> None:
    db = SessionLocal()
    try:
        company = db.get(Company, company_id)
        company.platform_status = status_value
        db.commit()
    finally:
        db.close()


def _seed(client, login):
    admin = login(7777001, "Админ")
    r = client.post("/api/admin/seed", headers=admin)
    assert r.status_code == 200, r.text


def test_suspended_user_read_only(client, login, company_payload_factory):
    _seed(client, login)
    owner = login(9701, "СуспендЮзер")
    client.put("/companies/me", json=company_payload_factory("СуспендКо", ["IT-разработка"]), headers=owner)

    assert client.get("/me", headers=owner).status_code == 200
    assert client.get("/companies/me", headers=owner).status_code == 200

    _set_user_status(9701, "SUSPENDED")

    assert client.get("/me", headers=owner).status_code == 200
    assert client.get("/opportunities", headers=owner).status_code == 200

    create = client.post(
        "/opportunities",
        json={"description": "Нужен сайт, 100 тысяч"},
        headers=owner,
    )
    assert create.status_code == 403, create.text
    assert "приостановлен" in create.json()["detail"].lower()

    patch = client.put("/companies/me", json=company_payload_factory("СуспендКо", ["IT-разработка"]), headers=owner)
    assert patch.status_code == 403

    relogin = client.post("/auth/max", json={"dev_max_user_id": 9701, "dev_first_name": "СуспендЮзер"})
    assert relogin.status_code == 200


def test_blocked_user_no_access(client, login, company_payload_factory):
    _seed(client, login)
    user = login(9702, "БлокЮзер")
    client.put("/companies/me", json=company_payload_factory("БлокКо", ["IT-разработка"]), headers=user)
    _set_user_status(9702, "BLOCKED")

    assert client.get("/me", headers=user).status_code == 403
    assert client.get("/companies/me", headers=user).status_code == 403
    assert client.get("/me/recommendations", headers=user).status_code == 403


def test_suspended_company_hidden_and_blocked(client, login):
    _seed(client, login)
    owner = login(7777002, "Дмитрий")  # владелец DigitalLab (COMPANY_ADMIN)
    other = login(7777003, "Ольга")  # владелец WebForge (BUSINESS_USER)

    company = client.get("/companies/me", headers=owner).json()
    assert company["name"] == "DigitalLab", company

    created = client.post(
        "/companies/me/services",
        json={"title": "Витринная услуга", "description": "Для проверки публичной витрины", "status": "published"},
        headers=owner,
    )
    assert created.status_code == 201, created.text
    assert created.json()["status"] == "published"

    public_before = client.get(f"/companies/{company['id']}/services").json()
    assert any(s["id"] == created.json()["id"] for s in public_before)

    assert any(c["id"] == company["id"] for c in client.get("/companies").json())
    assert client.get(f"/companies/{company['id']}").status_code == 200
    assert client.get(f"/companies/{company['id']}/cases").status_code == 200

    _set_company_status(company["id"], "SUSPENDED")

    catalog = client.get("/companies").json()
    assert all(c["id"] != company["id"] for c in catalog)

    assert client.get(f"/companies/{company['id']}").status_code == 404
    assert client.get(f"/companies/{company['id']}/services").status_code == 404
    assert client.get(f"/companies/{company['id']}/cases").status_code == 404

    assert client.get("/companies/me", headers=owner).status_code == 403
    assert client.post(
        "/opportunities",
        json={"description": "Нужен сайт"},
        headers=owner,
    ).status_code == 403

    # матчинг: суспенд-компания не попадает в рекомендации
    opportunity = client.post(
        "/opportunities",
        json={"description": "Нужна разработка интернет-магазина. React, 1С, бюджет 400-600 тысяч, Москва"},
        headers=other,
    )
    assert opportunity.status_code == 201, opportunity.text
    matches = opportunity.json()["matches"]
    assert all(m["company_id"] != company["id"] for m in matches), matches

    # снятие суспенда возвращает видимость
    _set_company_status(company["id"], "ACTIVE")
    assert client.get(f"/companies/{company['id']}").status_code == 200
    assert client.get("/companies/me", headers=owner).status_code == 200
