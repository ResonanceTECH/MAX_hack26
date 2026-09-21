from __future__ import annotations


def test_auth_dev_login_and_me(client, login):
    headers = login(9101, "Анна")
    response = client.get("/me", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["max_user_id"] == 9101
    assert body["first_name"] == "Анна"


def test_auth_requires_token(client):
    assert client.get("/me").status_code == 401
    assert client.get("/me/recommendations").status_code == 401


def test_auth_legacy_alias(client):
    response = client.post("/api/auth/init", json={"dev_max_user_id": 9104, "dev_first_name": "Legacy"})
    assert response.status_code == 200
    assert response.json()["access_token"]


def test_auth_me_has_company_after_upsert(client, login, company_payload_factory):
    headers = login(9102, "Борис")
    response = client.put("/companies/me", json=company_payload_factory("Ромашка", ["Производство"]), headers=headers)
    assert response.status_code == 200
    me = client.get("/me", headers=headers).json()
    assert me["company_id"] is not None
