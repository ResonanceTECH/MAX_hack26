from __future__ import annotations


def _seed(client, login):
    admin = login(7777001, "Админ")
    r = client.post("/api/admin/seed", headers=admin)
    assert r.status_code == 200, r.text


def test_competencies_crud(client, login):
    _seed(client, login)
    owner = login(7777002, "Дмитрий")

    added = client.post(
        "/api/companies/me/competencies",
        json={"value": "kubernetes"},
        headers=owner,
    )
    assert added.status_code == 200, added.text
    assert "kubernetes" in added.json()["competencies"]

    # дубль не создаётся
    again = client.post(
        "/api/companies/me/competencies",
        json={"value": "kubernetes"},
        headers=owner,
    )
    assert again.status_code == 200
    assert again.json()["competencies"].count("kubernetes") == 1

    bad = client.post("/api/companies/me/competencies", json={"value": "  "}, headers=owner)
    assert bad.status_code == 422

    removed = client.delete("/api/companies/me/competencies/kubernetes", headers=owner)
    assert removed.status_code == 200, removed.text
    assert "kubernetes" not in removed.json()["competencies"]

    missing = client.delete("/api/companies/me/competencies/not-exists", headers=owner)
    assert missing.status_code == 404

    viewer = login(7777011, "Мария")
    denied = client.post("/api/companies/me/competencies", json={"value": "x"}, headers=viewer)
    assert denied.status_code == 403
