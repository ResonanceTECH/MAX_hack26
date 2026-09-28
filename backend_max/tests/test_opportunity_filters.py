from __future__ import annotations


def _seed(client, login):
    admin = login(7777001, "Админ")
    r = client.post("/api/admin/seed", headers=admin)
    assert r.status_code == 200, r.text


def test_opportunity_catalog_match_score_and_sort(client, login):
    _seed(client, login)
    owner = login(7777002, "Дмитрий")  # DigitalLab

    items = client.get("/api/opportunities?limit=100", headers=owner).json()
    assert items, "каталог пуст"
    assert all(i["match_score"] is not None for i in items), items

    by_match = client.get("/api/opportunities?sort=match_desc&limit=100", headers=owner).json()
    scores = [i["match_score"] for i in by_match]
    assert scores == sorted(scores, reverse=True), scores

    anon = client.get("/api/opportunities?limit=100").json()
    assert all(i["match_score"] is None for i in anon)

    newest = client.get("/api/opportunities?sort=newest&limit=100").json()
    dates = [i["published_at"] for i in newest]
    assert dates == sorted(dates, reverse=True), dates

    by_budget = client.get("/api/opportunities?sort=budget_asc&limit=100").json()
    budgets = [i["budget_min"] if i["budget_min"] is not None else float("inf") for i in by_budget]
    assert budgets == sorted(budgets), budgets


def test_opportunity_catalog_filters(client, login):
    _seed(client, login)
    owner = login(7777002, "Дмитрий")

    it = client.get("/api/opportunities?categories=IT-разработка&limit=100", headers=owner).json()
    assert it and all(i["category"] == "IT-разработка" for i in it)

    tech = client.get("/api/opportunities?technologies=react&limit=100", headers=owner).json()
    assert tech and all("react" in (i["requirements"] or []) for i in tech)

    budget = client.get("/api/opportunities?budget_max=300000&limit=100", headers=owner).json()
    assert all(i["budget_min"] is not None and i["budget_min"] <= 300_000 for i in budget)

    threshold = client.get("/api/opportunities?min_match_score=70&limit=100", headers=owner).json()
    assert all(i["match_score"] is not None and i["match_score"] >= 70 for i in threshold)

    q = client.get("/api/opportunities", params={"q": "интернет-магазин", "limit": 100}, headers=owner).json()
    assert all("интернет-магазин" in (i["title"] + (i["description_raw"] or "")).lower() for i in q)
