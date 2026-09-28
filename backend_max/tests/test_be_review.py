from __future__ import annotations

from backend_max.app.db import SessionLocal
from backend_max.app.models import ModerationDecision, ModerationItem, User


def _seed(client, login):
    admin = login(7777001, "Админ")
    r = client.post("/api/admin/seed", headers=admin)
    assert r.status_code == 200, r.text
    return admin


def _moderator(client, login):
    return login(7777009, "Модератор")


def _item_for(db, entity_type: str, entity_id: int):
    item = (
        db.query(ModerationItem)
        .filter(ModerationItem.entity_type == entity_type, ModerationItem.entity_id == str(entity_id))
        .first()
    )
    return item


def test_moderation_decide_syncs_entity(client, login):
    _seed(client, login)
    mod = _moderator(client, login)
    owner = login(7777003, "Ольга")  # WebForge owner

    created = client.post(
        "/opportunities",
        json={"description": "Нужен сайт, 200 тысяч", "publish": True},
        headers=owner,
    )
    assert created.status_code == 201, created.text
    oid = created.json()["id"]
    assert created.json()["status"] == "published"

    db = SessionLocal()
    try:
        item = _item_for(db, "opportunity", oid)
        assert item is not None and item.status == "PENDING"
        item_id = item.id
    finally:
        db.close()

    rejected = client.post(
        f"/moderation/items/{item_id}/reject",
        json={"reason_code": "BAD_CONTENT", "comment": "Нарушает правила"},
        headers=mod,
    )
    assert rejected.status_code == 200, rejected.text
    assert rejected.json()["status"] == "REJECTED"

    # реальная сущность снята с публикации
    listing = client.get("/opportunities").json()
    assert all(o["id"] != oid for o in listing), listing
    mine = client.get("/opportunities/mine", headers=owner).json()
    target = next(o for o in mine if o["id"] == oid)
    assert target["status"] == "rejected"

    changes = client.post(
        f"/moderation/items/{item_id}/request-changes",
        json={"comment": "Доработайте описание"},
        headers=mod,
    )
    assert changes.status_code == 200
    resubmitted = client.post(f"/moderation/items/{item_id}/resubmit", headers=owner)
    assert resubmitted.status_code == 200
    approved = client.post(
        f"/moderation/items/{item_id}/approve",
        json={"comment": "Ок"},
        headers=mod,
    )
    assert approved.status_code == 200
    listing = client.get("/opportunities").json()
    assert any(o["id"] == oid and o["status"] == "published" for o in listing)

    # block снимает с публикации
    blocked = client.post(
        f"/moderation/items/{item_id}/block",
        json={"comment": "Бан"},
        headers=mod,
    )
    assert blocked.status_code == 200
    mine = client.get("/opportunities/mine", headers=owner).json()
    target = next(o for o in mine if o["id"] == oid)
    assert target["status"] == "blocked"


def test_decision_log_and_assign_exclusivity(client, login):
    _seed(client, login)
    mod = _moderator(client, login)
    owner = login(7777003, "Ольга")

    mod2_login = login(7777005, "Модератор2")
    db = SessionLocal()
    try:
        user2 = db.query(User).filter(User.max_user_id == 7777005).first()
        user2.role = "MODERATOR"
        db.commit()
    finally:
        db.close()

    created = client.post(
        "/opportunities",
        json={"description": "Нужен сайт, 300 тысяч"},
        headers=owner,
    )
    oid = created.json()["id"]

    db = SessionLocal()
    try:
        item = _item_for(db, "opportunity", oid)
        item_id = item.id
    finally:
        db.close()

    assigned = client.post(f"/moderation/items/{item_id}/assign", headers=mod)
    assert assigned.status_code == 200

    # другой модератор не может принять решение по чужому item
    conflict = client.post(
        f"/moderation/items/{item_id}/approve",
        json={"comment": "перехват"},
        headers=mod2_login,
    )
    assert conflict.status_code == 409, conflict.text

    decision = client.post(
        f"/moderation/items/{item_id}/approve",
        json={"comment": "Ок"},
        headers=mod,
    )
    assert decision.status_code == 200

    db = SessionLocal()
    try:
        rows = (
            db.query(ModerationDecision)
            .filter(ModerationDecision.item_id == item_id)
            .order_by(ModerationDecision.id)
            .all()
        )
        assert len(rows) >= 1
        assert rows[-1].action == "APPROVED"
        assert rows[-1].previous_status == "IN_REVIEW"
        assert rows[-1].new_status == "APPROVED"
    finally:
        db.close()


def test_report_links_to_moderation_and_resolve_action(client, login):
    _seed(client, login)
    mod = _moderator(client, login)
    owner = login(7777003, "Ольга")
    reporter = login(7777004, "Жалобщик")

    created = client.post(
        "/opportunities",
        json={"description": "Нужен сайт, 250 тысяч"},
        headers=owner,
    )
    oid = created.json()["id"]

    report = client.post(
        "/reports",
        json={"target_type": "opportunity", "target_id": str(oid), "type": "SPAM", "description": "Спам"},
        headers=reporter,
    )
    assert report.status_code == 201, report.text
    report_id = report.json()["id"]

    db = SessionLocal()
    try:
        item = _item_for(db, "opportunity", oid)
        assert item is not None
        assert item.reports_count == 1
        assert report_id in (item.related_report_ids or [])
    finally:
        db.close()

    # повторная жалоба того же пользователя запрещена
    dup = client.post(
        "/reports",
        json={"target_type": "opportunity", "target_id": str(oid), "type": "SPAM"},
        headers=reporter,
    )
    assert dup.status_code == 409

    resolved = client.post(
        f"/reports/{report_id}/resolve",
        json={"resolution_code": "BLOCKED", "comment": "Подтверждено", "apply_action": "BLOCK"},
        headers=mod,
    )
    assert resolved.status_code == 200
    assert resolved.json()["status"] == "RESOLVED"

    mine = client.get("/opportunities/mine", headers=owner).json()
    target = next(o for o in mine if o["id"] == oid)
    assert target["status"] == "blocked"


def test_last_admin_protection(client, login):
    _seed(client, login)
    owner = login(7777002, "Дмитрий")  # DigitalLab owner

    members = client.get("/companies/me/members", headers=owner).json()
    manager = next((m for m in members if m["role"] == "MANAGER"), None)
    viewer = next((m for m in members if m["role"] == "VIEWER"), None)
    assert manager is not None, members
    assert viewer is not None, members

    # два не-владельца становятся админами
    promoted = client.patch(
        f"/companies/me/members/{manager['id']}",
        json={"role": "COMPANY_ADMIN"},
        headers=owner,
    )
    assert promoted.status_code == 200, promoted.text
    promoted2 = client.patch(
        f"/companies/me/members/{viewer['id']}",
        json={"role": "COMPANY_ADMIN"},
        headers=owner,
    )
    assert promoted2.status_code == 200, promoted2.text

    # одного из двух админов удалить можно
    removed = client.delete(f"/companies/me/members/{manager['id']}", headers=owner)
    assert removed.status_code == 200

    # последнего админа нельзя удалить/понизить/приостановить
    blocked = client.delete(f"/companies/me/members/{viewer['id']}", headers=owner)
    assert blocked.status_code == 409, blocked.text

    demote = client.patch(
        f"/companies/me/members/{viewer['id']}",
        json={"role": "VIEWER"},
        headers=owner,
    )
    assert demote.status_code == 409, demote.text

    suspend = client.patch(
        f"/companies/me/members/{viewer['id']}",
        json={"status": "suspended"},
        headers=owner,
    )
    assert suspend.status_code == 409, suspend.text


def test_auto_enqueue_company_case_document(client, login):
    _seed(client, login)
    owner = login(7777002, "Дмитрий")

    verification = client.post("/companies/me/verification", headers=owner)
    assert verification.status_code == 200

    case = client.post(
        "/companies/me/cases",
        json={
            "title": "Кейс для модерации",
            "industry": "IT",
            "description": "Описание кейса",
            "result": "Результат",
            "technologies": ["react"],
            "status": "published",
        },
        headers=owner,
    )
    assert case.status_code == 201, case.text

    doc = client.post(
        "/companies/me/documents",
        json={"name": "Свидетельство", "type": "CERTIFICATE", "file_name": "cert.pdf", "number": "123"},
        headers=owner,
    )
    assert doc.status_code == 201, doc.text

    company = client.get("/companies/me", headers=owner).json()

    db = SessionLocal()
    try:
        assert _item_for(db, "company", company["id"]) is not None
        assert _item_for(db, "case", case.json()["id"]) is not None
        assert _item_for(db, "document", doc.json()["id"]) is not None
    finally:
        db.close()

    # решение по документу меняет реальный статус
    mod = _moderator(client, login)
    db = SessionLocal()
    try:
        doc_item = _item_for(db, "document", doc.json()["id"])
        doc_item_id = doc_item.id
    finally:
        db.close()
    approved = client.post(f"/moderation/items/{doc_item_id}/approve", json={}, headers=mod)
    assert approved.status_code == 200
    docs = client.get("/companies/me/documents", headers=owner).json()
    target = next(d for d in docs if d["id"] == doc.json()["id"])
    assert target["status"] == "Verified"
