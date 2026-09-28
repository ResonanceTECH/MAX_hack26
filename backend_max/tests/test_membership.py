from __future__ import annotations

from backend_max.app.db import SessionLocal
from backend_max.app.models import CompanyMember


def test_non_owner_member_gets_company(client, login, company_payload_factory):
    owner = login(9901, "Владелец")
    company = client.put(
        "/companies/me",
        json=company_payload_factory("КомандаКо", ["IT-разработка"]),
        headers=owner,
    ).json()

    # MANAGER
    manager = login(9902, "Менеджер")
    manager_me = client.get("/me", headers=manager).json()
    db = SessionLocal()
    try:
        db.add(
            CompanyMember(
                company_id=company["id"],
                user_id=manager_me["id"],
                first_name="Менеджер",
                last_name="",
                email="manager@team.test",
                member_role="MANAGER",
                status="active",
            )
        )
        db.commit()
    finally:
        db.close()

    mine = client.get("/companies/me", headers=manager)
    assert mine.status_code == 200, mine.text
    assert mine.json()["id"] == company["id"]

    # VIEWER
    viewer = login(9903, "Вьюер")
    viewer_me = client.get("/me", headers=viewer).json()
    db = SessionLocal()
    try:
        db.add(
            CompanyMember(
                company_id=company["id"],
                user_id=viewer_me["id"],
                first_name="Вьюер",
                last_name="",
                email="viewer@team.test",
                member_role="VIEWER",
                status="active",
            )
        )
        db.commit()
    finally:
        db.close()

    viewer_mine = client.get("/companies/me", headers=viewer)
    assert viewer_mine.status_code == 200, viewer_mine.text
    assert viewer_mine.json()["id"] == company["id"]

    # пользователь без компании и членства
    stranger = login(9904, "Странник")
    assert client.get("/companies/me", headers=stranger).status_code == 422


def test_member_feed_and_recommendations(client, login, company_payload_factory):
    owner = login(9911, "Владелец2")
    company = client.put(
        "/companies/me",
        json=company_payload_factory("КомандаДва", ["IT-разработка"], services=["web-разработка"]),
        headers=owner,
    ).json()

    member = login(9912, "Сотрудник")
    member_me = client.get("/me", headers=member).json()
    db = SessionLocal()
    try:
        db.add(
            CompanyMember(
                company_id=company["id"],
                user_id=member_me["id"],
                first_name="Сотрудник",
                last_name="",
                email="staff@team.test",
                member_role="MANAGER",
                status="active",
            )
        )
        db.commit()
    finally:
        db.close()

    created = client.post(
        "/opportunities",
        json={"description": "Нужен сайт, бюджет 150 тысяч", "publish": False},
        headers=member,
    )
    assert created.status_code == 201, created.text
    assert created.json()["company_id"] == company["id"]

    mine = client.get("/opportunities/mine", headers=member).json()
    assert any(r["id"] == created.json()["id"] for r in mine)

    feed = client.get("/me/recommendations", headers=member)
    assert feed.status_code == 200
