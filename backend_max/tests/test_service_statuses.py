from __future__ import annotations


def _seed(client, login):
    admin = login(7777001, "Админ")
    r = client.post("/api/admin/seed", headers=admin)
    assert r.status_code == 200, r.text


def test_public_services_show_only_published(client, login):
    _seed(client, login)
    mgr = login(7777010, "Игорь")  # MANAGER компании DigitalLab (из seed)
    company = client.get("/companies/me", headers=mgr).json()
    assert company["name"] == "DigitalLab", company

    draft = client.post(
        "/companies/me/services",
        json={"title": "Услуга-черновик", "description": "Пока в работе"},
        headers=mgr,
    )
    assert draft.status_code == 201, draft.text
    draft_id = draft.json()["id"]
    assert draft.json()["status"] == "draft"

    published = client.post(
        "/companies/me/services",
        json={"title": "Услуга-витрина", "description": "Готово к продаже", "status": "published"},
        headers=mgr,
    )
    assert published.status_code == 201
    published_id = published.json()["id"]
    assert published.json()["status"] == "published"

    hidden = client.post(
        "/companies/me/services",
        json={"title": "Скрытая", "description": "Скрытая услуга", "status": "hidden"},
        headers=mgr,
    )
    assert hidden.status_code == 201
    hidden_id = hidden.json()["id"]
    assert hidden.json()["status"] == "hidden"

    archived = client.post(
        "/companies/me/services",
        json={"title": "Архивная", "description": "В архиве", "status": "archived"},
        headers=mgr,
    )
    assert archived.status_code == 201
    archived_id = archived.json()["id"]

    public = client.get(f"/companies/{company['id']}/services").json()
    public_ids = {s["id"] for s in public}
    assert published_id in public_ids, public
    assert draft_id not in public_ids and hidden_id not in public_ids and archived_id not in public_ids

    patched = client.patch(
        f"/companies/me/services/{draft_id}",
        json={"title": "Услуга-черновик", "description": "Пока в работе", "status": "published"},
        headers=mgr,
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["status"] == "published"
    public = client.get(f"/companies/{company['id']}/services").json()
    assert draft_id in {s["id"] for s in public}

    legacy = client.post(
        "/companies/me/services",
        json={"title": "Легаси", "description": "Со старым статусом", "status": "active"},
        headers=mgr,
    )
    assert legacy.status_code == 201
    assert legacy.json()["status"] == "published"

    bad = client.post(
        "/companies/me/services",
        json={"title": "Плохой", "description": "Невалидный статус", "status": "bogus"},
        headers=mgr,
    )
    assert bad.status_code == 422

    bad_patch = client.patch(
        f"/companies/me/services/{draft_id}",
        json={"title": "Услуга-черновик", "description": "Пока в работе", "status": "bogus"},
        headers=mgr,
    )
    assert bad_patch.status_code == 422

    viewer = login(7777011, "Мария")
    denied = client.post(
        "/companies/me/services",
        json={"title": "Нельзя", "description": "Без прав"},
        headers=viewer,
    )
    assert denied.status_code == 403
