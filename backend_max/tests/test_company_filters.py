from __future__ import annotations



def _seed(client, login):
    admin = login(7777001, "Админ")
    r = client.post("/api/admin/seed", headers=admin)
    assert r.status_code == 200, r.text


def test_catalog_server_filters(client, login):
    _seed(client, login)

    all_companies = client.get("/api/companies?limit=200").json()
    assert len(all_companies) >= 8

    it_only = client.get("/api/companies?categories=IT-разработка&limit=200").json()
    assert it_only and all("IT-разработка" in c["industries"] for c in it_only)
    assert "МебельПро" not in [c["name"] for c in it_only]

    prod_only = client.get("/api/companies?categories=Производство&limit=200").json()
    assert prod_only and all("Производство" in c["industries"] for c in prod_only)

    web = client.get("/api/companies?services=web-разработка&limit=200").json()
    assert web and all("web-разработка" in c["services"] for c in web)
    assert "DigitalLab" in [c["name"] for c in web]

    tech = client.get("/api/companies?technologies=react&limit=200").json()
    assert tech, "технологии не найдены"
    assert "DigitalLab" in [c["name"] for c in tech]
    assert all("react" in c["technologies"] for c in tech)

    tech_1c = client.get("/api/companies?technologies=1с&limit=200").json()
    assert "DigitalLab" in [c["name"] for c in tech_1c]
    assert all("1с" in c["technologies"] for c in tech_1c)

    kazan = client.get("/api/companies?region=Казань&limit=200").json()
    assert "МебельПро" in [c["name"] for c in kazan]
    assert all("Казань" in c["regions"] or "Вся Россия" in c["regions"] for c in kazan)

    price = client.get("/api/companies?max_price=500000&limit=200").json()
    assert price
    assert all(c["budget_min"] is not None and c["budget_min"] <= 500_000 for c in price)

    verified = client.get("/api/companies?verified_only=true&limit=200").json()
    assert verified and all(c["is_verified"] for c in verified)

    with_cases = client.get("/api/companies?has_cases=true&limit=200").json()
    assert with_cases and all(c["cases"] for c in with_cases)

    rated = client.get("/api/companies?min_rating=4&sort=rating_desc&limit=200").json()
    assert all((c["rating"] or 0) >= 4 for c in rated)
    ratings = [c["rating"] or 0 for c in rated]
    assert ratings == sorted(ratings, reverse=True)

    by_price = client.get("/api/companies?sort=price_asc&limit=200").json()
    prices = [c["budget_min"] if c["budget_min"] is not None else float("inf") for c in by_price]
    assert prices == sorted(prices)

    combo = client.get("/api/companies?categories=IT-разработка&technologies=1с&verified_only=true&limit=200").json()
    assert "DigitalLab" in [c["name"] for c in combo]
    assert all("IT-разработка" in c["industries"] and c["is_verified"] for c in combo)

    dl = next(c for c in all_companies if c["name"] == "DigitalLab")
    detail = client.get(f"/api/companies/{dl['id']}").json()
    assert "react" in detail["technologies"]
