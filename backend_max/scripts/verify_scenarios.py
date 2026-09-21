"""
Проверка сценариев B2B Match против живого сервера.

Запуск (сервер должен быть поднят на localhost:8000):
    python backend_max\\scripts\\verify_scenarios.py

Другой адрес сервера:
    $env:B2B_BASE_URL="http://127.0.0.1:8000"; python backend_max\\scripts\\verify_scenarios.py

Работает в dev-режиме (вход через /auth/max с dev_max_user_id), создаёт
собственных пользователей и данные — повторные запуски не конфликтуют.
"""

from __future__ import annotations

import os
import sys
import time

import requests

BASE = os.environ.get("B2B_BASE_URL", "http://localhost:8000")
RUN_ID = int(time.time()) % 10_000_000

PASSED: list[str] = []
FAILED: list[str] = []

CALLED: set[tuple[str, str]] = set()


def _norm_path(path: str) -> str:
    """Нормализует путь: сегменты-идентификаторы заменяются на *."""
    return "/".join("*" if part.isdigit() else part for part in path.split("/"))


EXPECTED_ENDPOINTS: set[tuple[str, str]] = {
    ("GET", "/"),
    ("GET", "/health"),
    # auth
    ("POST", "/auth/max"),
    ("POST", "/api/auth/init"),
    ("GET", "/me"),
    ("GET", "/api/auth/me"),
    # companies
    ("GET", "/companies"),
    ("GET", "/companies/me"),
    ("PUT", "/companies/me"),
    ("GET", "/companies/*"),
    ("PATCH", "/companies/*"),
    # opportunities
    ("POST", "/ai/parse-opportunity"),
    ("POST", "/opportunities/preview"),
    ("POST", "/opportunities"),
    ("GET", "/opportunities"),
    ("GET", "/opportunities/mine"),
    ("GET", "/opportunities/*"),
    ("PATCH", "/opportunities/*"),
    ("POST", "/opportunities/*/publish"),
    ("POST", "/opportunities/*/close"),
    ("POST", "/opportunities/*/reopen"),
    ("GET", "/opportunities/*/matches"),
    ("GET", "/opportunities/*/comparison"),
    ("GET", "/opportunities/*/compare"),
    ("GET", "/opportunities/*/dealroom"),
    # proposals
    ("POST", "/opportunities/*/proposals"),
    ("POST", "/api/requests/*/proposals"),
    ("GET", "/opportunities/*/proposals"),
    ("GET", "/proposals/mine"),
    ("GET", "/proposals/*"),
    ("POST", "/proposals/*/shortlist"),
    ("POST", "/opportunities/*/shortlist"),
    ("POST", "/proposals/*/view"),
    ("POST", "/proposals/*/status"),
    # deals
    ("POST", "/deals"),
    ("GET", "/deals"),
    ("GET", "/deals/*"),
    # feed
    ("GET", "/me/recommendations"),
    ("POST", "/matches/*/feedback"),
    ("GET", "/feed"),
    # files
    ("POST", "/files"),
    ("GET", "/files/*"),
    # share (MAX :share / shareMaxContent)
    ("POST", "/share/company/*"),
    ("POST", "/share/opportunity/*"),
    ("GET", "/share/company/*/link"),
    ("GET", "/share/opportunity/*/link"),
    # notifications
    ("GET", "/notifications"),
    ("POST", "/notifications/*/read"),
    ("POST", "/notifications/read-all"),
    # dictionaries
    ("GET", "/dictionaries"),
    ("GET", "/dictionaries/categories"),
    ("GET", "/dictionaries/regions"),
    # admin
    ("POST", "/api/admin/seed"),
    ("POST", "/api/admin/reset"),
    ("GET", "/api/admin/stats"),
    ("POST", "/api/admin/companies/*/verify"),
    ("POST", "/api/admin/requests/*/moderate"),
    ("POST", "/api/admin/notify/deadlines"),
    ("GET", "/api/admin/notifications"),
}


def check(name: str, condition: bool, detail: str = "") -> None:
    if condition:
        PASSED.append(name)
        print(f"  [PASS] {name}")
    else:
        FAILED.append(name)
        print(f"  [FAIL] {name}  {detail}")


def call(method: str, path: str, token: str | None = None, expected: int = 200, **kwargs):
    headers = kwargs.pop("headers", {})
    if token:
        headers["Authorization"] = f"Bearer {token}"
    response = requests.request(method, BASE + path, headers=headers, timeout=30, **kwargs)
    CALLED.add((method.upper(), _norm_path(path)))
    if response.status_code != expected:
        raise AssertionError(
            f"{method} {path} -> {response.status_code} (ожидалось {expected}): {response.text[:300]}"
        )
    try:
        return response.json()
    except ValueError:
        return None


def login(max_user_id: int, first_name: str) -> str:
    body = call("POST", "/auth/max", expected=200, json={"dev_max_user_id": max_user_id, "dev_first_name": first_name})
    return body["access_token"]


def company_payload(name: str, industries: list[str], **overrides) -> dict:
    payload = {
        "name": name,
        "description": f"Компания {name} для проверки сценариев",
        "industries": industries,
        "services": [],
        "competencies": [],
        "regions": ["Москва"],
        "budget_min": 100_000,
        "budget_max": 1_000_000,
        "max_term_days": 60,
        "cases": [],
        "certificates": [],
    }
    payload.update(overrides)
    return payload


def scenario_reset_and_seed() -> None:
    print("Сценарий 0. Сброс базы и демо-seed (детерминированный прогон)")
    token = login(7777001, "Admin")
    check("POST /api/admin/reset", call("POST", "/api/admin/reset", token=token, expected=200)["reset"] is True)
    token = login(7777001, "Admin")
    stats = call("POST", "/api/admin/seed", token=token, expected=200)
    check("Seed после сброса", stats["companies"] == 8 and stats["requests"] == 3 and stats["matches"] > 0)


def scenario_health_and_auth() -> None:
    print("Сценарий 1. Здоровье сервера и авторизация")
    check("GET /health", call("GET", "/health", expected=200)["status"] == "ok")
    r = requests.get(BASE + "/me", timeout=10)
    check("GET /me без токена -> 401", r.status_code == 401, f"получено {r.status_code}")

    token = login(RUN_ID + 1, "Checker")
    me = call("GET", "/me", token=token, expected=200)
    check("Вход dev-пользователя", me["max_user_id"] == RUN_ID + 1 and me["company_id"] is None)
    check(
        "GET /me с чужим/битым токеном -> 401",
        requests.get(BASE + "/me", headers={"Authorization": "Bearer broken"}, timeout=10).status_code == 401,
    )
    check("GET /dictionaries", len(call("GET", "/dictionaries", expected=200)["categories"]) >= 7)
    check("GET /dictionaries/categories", bool(call("GET", "/dictionaries/categories", expected=200)))
    check("GET /dictionaries/regions", len(call("GET", "/dictionaries/regions", expected=200)) > 20)


def scenario_company() -> None:
    print("Сценарий 2. Профиль компании и каталог")
    owner = login(RUN_ID + 2, "Owner")
    stranger = login(RUN_ID + 3, "Stranger")

    company = call(
        "PUT", "/companies/me", token=owner, expected=200,
        json=company_payload("ПроверкаКом", ["Логистика"], services=["доставка по городу"]),
    )
    company_id = company["id"]
    check("PUT /companies/me создаёт профиль", company["name"] == "ПроверкаКом")

    patched = call(
        "PATCH", f"/companies/{company_id}", token=owner, expected=200,
        json={"description": "Описание обновлено", "budget_max": 900_000},
    )
    check("PATCH /companies/{id} (владелец)", patched["description"] == "Описание обновлено")

    forbidden = requests.patch(
        BASE + f"/companies/{company_id}",
        headers={"Authorization": f"Bearer {stranger}"},
        json={"name": "Взлом"},
        timeout=10,
    )
    check("PATCH чужой компании -> 403", forbidden.status_code == 403, f"получено {forbidden.status_code}")

    catalog = call("GET", "/companies", expected=200)
    check("Каталог содержит компанию", any(c["id"] == company_id for c in catalog))

    by_id = call("GET", f"/companies/{company_id}", expected=200)
    check("GET /companies/{id} со статистикой", by_id["id"] == company_id and "active_requests" in by_id)


def scenario_ai_parse() -> None:
    print("Сценарий 3. AI-структуризация свободного текста")
    token = login(RUN_ID + 4, "Parser")

    it = call(
        "POST", "/ai/parse-opportunity", token=token, expected=200,
        json={"description": "Нужна разработка интернет-магазина. React, 1С, бюджет 400-600 тысяч, срок два месяца, Москва"},
    )
    check("IT: категория", it["category"] == "IT-разработка")
    check("IT: бюджет 400-600 тыс.", it["budget_min"] == 400_000 and it["budget_max"] == 600_000)
    check("IT: срок два месяца -> 60 дней", it["deadline_days"] == 60)
    check("IT: регион Москва", "Москва" in it["regions"])
    check("IT: требования react/1с", "react" in it["requirements"] and "1с" in it["requirements"])

    mkt = call(
        "POST", "/ai/parse-opportunity", token=token, expected=200,
        json={"description": "Требуется smm-продвижение и контекстная реклама, бюджет до 150 тысяч, Самара"},
    )
    check("Маркетинг: категория и бюджет", mkt["category"] == "Маркетинг и реклама" and mkt["budget_max"] == 150_000)

    prod = call(
        "POST", "/ai/parse-opportunity", token=token, expected=200,
        json={"description": "Нужен поставщик упаковки и полиграфии, от 100 до 300 тысяч, Новосибирск"},
    )
    check("Производство: категория и диапазон", prod["category"] == "Производство" and prod["budget_min"] == 100_000)

    bad = requests.post(
        BASE + "/ai/parse-opportunity",
        headers={"Authorization": f"Bearer {token}"},
        json={"description": ""},
        timeout=10,
    )
    check("Пустое описание -> 422", bad.status_code == 422, f"получено {bad.status_code}")


def scenario_draft_publish_patch() -> None:
    print("Сценарий 4. Draft -> PATCH -> Publish")
    owner = login(RUN_ID + 5, "Drafter")
    stranger = login(RUN_ID + 6, "Alien")
    call("PUT", "/companies/me", token=owner, expected=200, json=company_payload("ДрафтКом", ["IT-разработка"]))
    call("PUT", "/companies/me", token=stranger, expected=200, json=company_payload("ЧужакКом", ["Логистика"]))

    draft = call(
        "POST", "/opportunities", token=owner, expected=201,
        json={"description": "Нужен сайт, бюджет 200 тысяч, Москва", "publish": False},
    )
    oid = draft["id"]
    check("Создание draft", draft["status"] == "draft" and draft["matches"] == [])

    patched = call("PATCH", f"/opportunities/{oid}", token=owner, expected=200, json={"budget_max": 300_000, "title": "Сайт компании"})
    check("PATCH opportunity", patched["budget_max"] == 300_000 and patched["title"] == "Сайт компании")

    forbidden = requests.patch(
        BASE + f"/opportunities/{oid}",
        headers={"Authorization": f"Bearer {stranger}"},
        json={"title": "Взлом"},
        timeout=10,
    )
    check("PATCH чужой потребности -> 403", forbidden.status_code == 403, f"получено {forbidden.status_code}")

    published = call("POST", f"/opportunities/{oid}/publish", token=owner, expected=200)
    check("Publish draft", published["status"] == "published" and published["expires_at"] is not None)

    double = requests.post(
        BASE + f"/opportunities/{oid}/publish",
        headers={"Authorization": f"Bearer {owner}"},
        timeout=10,
    )
    check("Повторный publish -> 409", double.status_code == 409, f"получено {double.status_code}")


def scenario_full_marketplace() -> None:
    print("Сценарий 5. Полный цикл: запрос -> матчи -> отклики -> shortlist -> deal")
    customer = login(RUN_ID + 7, "Customer")
    exec1 = login(RUN_ID + 8, "Exec1")
    exec2 = login(RUN_ID + 9, "Exec2")
    outsider = login(RUN_ID + 10, "Outsider")

    call("PUT", "/companies/me", token=customer, expected=200, json=company_payload("ЗаказчикКо", ["Производство"], services=["мебель на заказ"]))
    call("PUT", "/companies/me", token=outsider, expected=200, json=company_payload("МимоходКом", ["Логистика"]))
    call("PUT", "/companies/me", token=exec1, expected=200, json=company_payload(
        "АйТиОдин", ["IT-разработка"], services=["web-разработка", "интеграции"],
        competencies=["react", "python", "1с", "crm"], budget_min=300_000, budget_max=2_000_000,
        max_term_days=45, is_verified=True,
        cases=[{"title": "Интернет-магазин", "description": "React + 1С"}],
    ))
    call("PUT", "/companies/me", token=exec2, expected=200, json=company_payload(
        "АйТиДва", ["IT-разработка"], services=["web-разработка"],
        competencies=["react", "figma"], budget_min=100_000, budget_max=500_000,
    ))

    created = call(
        "POST", "/opportunities", token=customer, expected=201,
        json={"description": "Нужна разработка интернет-магазина. React, 1С, бюджет 400-600 тысяч, срок два месяца, Москва"},
    )
    oid = created["id"]
    check("Публикация запроса", created["status"] == "published")
    check("Матчи при публикации", len(created["matches"]) >= 1)
    check("Топ-матч имеет объяснение", len(created["matches"][0]["criteria"]) >= 5)

    inbox_exec1 = call("GET", "/notifications", token=exec1, expected=200)
    check(
        "Уведомление «Вам подошёл новый заказ на N%» у топ-матча",
        any("заказ" in n["text"] and "%" in n["text"] for n in inbox_exec1),
        str([n["text"][:50] for n in inbox_exec1[:3]]),
    )

    listing = call("GET", "/opportunities", expected=200)
    check("Витрина содержит запрос", any(r["id"] == oid for r in listing))

    recs = call("GET", "/me/recommendations", token=exec1, expected=200)
    item = next((i for i in recs if i["request"]["id"] == oid), None)
    check("Лента исполнителя содержит запрос", item is not None)
    if item:
        check("Лента содержит match_id и критерии", item["match_id"] > 0 and item["criteria"])
        fb = call("POST", f"/matches/{item['match_id']}/feedback", token=exec1, expected=200, json={"positive": True})
        check("Feedback положительный", fb["feedback"] is True)
        fb2 = call("POST", f"/matches/{item['match_id']}/feedback", token=exec1, expected=200, json={"positive": False})
        check("Feedback можно изменить", fb2["feedback"] is False)

    # отклики
    p1 = call("POST", f"/opportunities/{oid}/proposals", token=exec1, expected=201,
              json={"price": 480_000, "term_days": 45, "solution_text": "React + 1С, поэтапно"})
    p2 = call("POST", f"/opportunities/{oid}/proposals", token=exec2, expected=201,
              json={"price": 420_000, "term_days": 60, "solution_text": "React, дизайн, запуск"})
    check("Отклики двух исполнителей", p1["id"] != p2["id"])

    dup = requests.post(
        BASE + f"/opportunities/{oid}/proposals",
        headers={"Authorization": f"Bearer {exec1}"},
        json={"price": 1, "term_days": 1, "solution_text": "ещё раз"},
        timeout=10,
    )
    check("Повторный отклик -> 409", dup.status_code == 409, f"получено {dup.status_code}")

    own = requests.post(
        BASE + f"/opportunities/{oid}/proposals",
        headers={"Authorization": f"Bearer {customer}"},
        json={"price": 1, "term_days": 1, "solution_text": "себе"},
        timeout=10,
    )
    check("Отклик автора на свой запрос -> 422", own.status_code == 422, f"получено {own.status_code}")

    proposals = call("GET", f"/opportunities/{oid}/proposals", token=customer, expected=200)
    check("Список предложений (2 шт.)", len(proposals) == 2)

    check("GET /proposals/{id} (исполнитель)", call("GET", f"/proposals/{p1['id']}", token=exec1, expected=200)["id"] == p1["id"])
    hidden = requests.get(BASE + f"/proposals/{p1['id']}", headers={"Authorization": f"Bearer {outsider}"}, timeout=10)
    check("GET /proposals/{id} чужому -> 403", hidden.status_code == 403, f"получено {hidden.status_code}")

    comp = call("GET", f"/opportunities/{oid}/comparison", token=customer, expected=200)
    check("Comparison: 2 строки с ценой и матчем", len(comp["rows"]) == 2 and comp["rows"][0]["price"] > 0)

    # shortlist двумя способами
    sh1 = call("POST", f"/opportunities/{oid}/shortlist", token=customer, expected=200, json={"proposal_id": p1["id"]})
    check("Shortlist по proposal_id", sh1["status"] == "shortlisted")
    sh2 = call("POST", f"/opportunities/{oid}/shortlist", token=customer, expected=200,
               json={"company_id": next(r["company_id"] for r in comp["rows"] if r["company_id"] != sh1["company_id"])})
    check("Shortlist по company_id", sh2["status"] == "shortlisted")

    # недопустимый статус
    bad_status = requests.post(
        BASE + f"/proposals/{p1['id']}/status",
        headers={"Authorization": f"Bearer {customer}"},
        json={"status": "bogus"},
        timeout=10,
    )
    check("Недопустимый статус -> 422", bad_status.status_code == 422, f"получено {bad_status.status_code}")

    # deal
    deal = call("POST", "/deals", token=customer, expected=201, json={"opportunity_id": oid, "proposal_id": p1["id"]})
    check("Создание deal", deal["status"] == "negotiating")
    deal_again = call("POST", "/deals", token=customer, expected=201, json={"opportunity_id": oid, "proposal_id": p1["id"]})
    check("Deal идемпотентен", deal_again["id"] == deal["id"])

    foreign_deal = requests.post(
        BASE + "/deals",
        headers={"Authorization": f"Bearer {outsider}"},
        json={"opportunity_id": oid, "proposal_id": p2["id"]},
        timeout=10,
    )
    check("Deal чужим пользователем -> 403", foreign_deal.status_code == 403, f"получено {foreign_deal.status_code}")

    my_deals_exec = call("GET", "/deals", token=exec1, expected=200)
    my_deals_cust = call("GET", "/deals", token=customer, expected=200)
    check("Deal виден обеим сторонам", any(d["id"] == deal["id"] for d in my_deals_exec) and any(d["id"] == deal["id"] for d in my_deals_cust))

    # файл в сделке (Deal Room): загрузка с deal_id, доступ обеим сторонам
    up_deal = requests.post(
        BASE + "/files",
        headers={"Authorization": f"Bearer {customer}"},
        data={"deal_id": str(deal["id"])},
        files={"file": ("dogovor.pdf", b"%PDF-deal", "application/pdf")},
        timeout=30,
    )
    CALLED.add(("POST", "/files"))
    check("Загрузка файла в сделку -> 201", up_deal.status_code == 201, f"получено {up_deal.status_code}: {up_deal.text[:200]}")
    if up_deal.status_code == 201:
        deal_file_id = up_deal.json()["id"]
        deal_with_files = call("GET", f"/deals/{deal['id']}", token=customer, expected=200)
        check("Файл виден в Deal Room", any(f["id"] == deal_file_id for f in deal_with_files["files"]))
        dl_deal = requests.get(
            BASE + f"/files/{deal_file_id}",
            headers={"Authorization": f"Bearer {exec1}"},
            timeout=30,
        )
        CALLED.add(("GET", "/files/*"))
        check("Исполнитель скачивает файл сделки", dl_deal.status_code == 200 and dl_deal.content == b"%PDF-deal")
        dl_foreign = requests.get(
            BASE + f"/files/{deal_file_id}",
            headers={"Authorization": f"Bearer {outsider}"},
            timeout=30,
        )
        check("Посторонний не скачивает файл сделки -> 403", dl_foreign.status_code == 403, f"получено {dl_foreign.status_code}")

    dealroom = call("GET", f"/opportunities/{oid}/dealroom", token=customer, expected=200)
    check("Deal Room: shortlist и next_action", len(dealroom["shortlist"]) == 2 and dealroom["next_action"])

    # выбор исполнителя и закрытие приёма
    chosen = call("POST", f"/proposals/{p1['id']}/status", token=customer, expected=200, json={"status": "chosen"})
    check("Статус chosen", chosen["status"] == "chosen")

    closed = call("POST", f"/opportunities/{oid}/close", token=customer, expected=200)
    check("Закрытие запроса", closed["status"] == "closed")
    exec3 = login(RUN_ID + 11, "Exec3")
    call("PUT", "/companies/me", token=exec3, expected=200, json=company_payload("АйТиТри", ["IT-разработка"], services=["web-разработка"]))
    late = requests.post(
        BASE + f"/opportunities/{oid}/proposals",
        headers={"Authorization": f"Bearer {exec3}"},
        json={"price": 1, "term_days": 1, "solution_text": "опоздал"},
        timeout=10,
    )
    check("Отклик на закрытый запрос -> 409", late.status_code == 409, f"получено {late.status_code}")

    # статусы у исполнителя
    mine = call("GET", "/proposals/mine", token=exec1, expected=200)
    check("У исполнителя статус chosen", any(p["id"] == p1["id"] and p["status"] == "chosen" for p in mine))


def scenario_notifications_and_files() -> None:
    print("Сценарий 6. Уведомления и файлы")
    a = login(RUN_ID + 12, "NotifA")
    b = login(RUN_ID + 13, "NotifB")
    call("PUT", "/companies/me", token=a, expected=200, json=company_payload("НотифА", ["Производство"]))
    call("PUT", "/companies/me", token=b, expected=200, json=company_payload("НотифБ", ["IT-разработка"], services=["web-разработка"], competencies=["react"]))

    created = call("POST", "/opportunities", token=a, expected=201,
                   json={"description": "Нужен сайт, бюджет 100 тысяч, срок три недели, Москва"})
    call("POST", f"/opportunities/{created['id']}/proposals", token=b, expected=201,
         json={"price": 90_000, "term_days": 21, "solution_text": "Сделаем"})

    inbox_a = call("GET", "/notifications", token=a, expected=200)
    check("Inbox заказчика: есть «предложение»", any("предложение" in n["text"] for n in inbox_a), str([n["text"][:30] for n in inbox_a]))
    check("Inbox: поля is_read/ok", all("is_read" in n and "ok" in n for n in inbox_a))

    if inbox_a:
        marked = call("POST", f"/notifications/{inbox_a[0]['id']}/read", token=a, expected=200)
        check("Отметить прочитанным", marked["is_read"] is True)
    call("POST", "/notifications/read-all", token=a, expected=200)
    check("Read-all", all(n["is_read"] for n in call("GET", "/notifications", token=a, expected=200)))

    inbox_b = call("GET", "/notifications", token=b, expected=200)
    check("Inbox исполнителя доступен", isinstance(inbox_b, list))

    # файлы
    up = requests.post(
        BASE + "/files",
        headers={"Authorization": f"Bearer {a}"},
        files={"file": ("case.pdf", b"%PDF-1.4 fake", "application/pdf")},
        timeout=30,
    )
    CALLED.add(("POST", "/files"))
    check("Загрузка файла -> 201", up.status_code == 201, f"получено {up.status_code}: {up.text[:200]}")
    file_id = up.json()["id"] if up.status_code == 201 else None

    if file_id:
        down = requests.get(BASE + f"/files/{file_id}", headers={"Authorization": f"Bearer {a}"}, timeout=30)
        CALLED.add(("GET", "/files/*"))
        check("Скачивание файла владельцем", down.status_code == 200 and down.content == b"%PDF-1.4 fake")

        other = requests.get(BASE + f"/files/{file_id}", headers={"Authorization": f"Bearer {b}"}, timeout=30)
        check("Скачивание чужим -> 403", other.status_code == 403, f"получено {other.status_code}")

    big = requests.post(
        BASE + "/files",
        headers={"Authorization": f"Bearer {a}"},
        files={"file": ("big.bin", b"x" * (10 * 1024 * 1024 + 1), "application/octet-stream")},
        timeout=60,
    )
    check("Файл больше 10 МБ -> 413", big.status_code == 413, f"получено {big.status_code}")


def scenario_admin() -> None:
    print("Сценарий 7. Админка: seed, модерация, статистика")
    admin = login(7777001, "Admin")
    stats = call("POST", "/api/admin/seed", token=admin, expected=200)
    check("Seed демо-данных", stats["companies"] >= 8 and stats["requests"] >= 3 and stats["matches"] > 0)
    check("GET /api/admin/stats", call("GET", "/api/admin/stats", token=admin, expected=200)["users"] > 0)

    regular = login(RUN_ID + 14, "Regular")
    forbidden = requests.get(BASE + "/api/admin/stats", headers={"Authorization": f"Bearer {regular}"}, timeout=10)
    check("Админ-эндпоинт для не-админа -> 403", forbidden.status_code == 403, f"получено {forbidden.status_code}")

    verify_company_id = call("GET", "/companies", expected=200)[0]["id"]
    verify = call("POST", f"/api/admin/companies/{verify_company_id}/verify", token=admin, expected=200, json={"verified": True})
    check("Верификация компании", verify["is_verified"] is True)

    moderate_request_id = call("GET", "/opportunities", expected=200)[0]["id"]
    moderate = call("POST", f"/api/admin/requests/{moderate_request_id}/moderate", token=admin, expected=200, json={"action": "block"})
    check("Модерация: block", moderate["status"] == "blocked")
    reopened = call("POST", f"/api/admin/requests/{moderate_request_id}/moderate", token=admin, expected=200, json={"action": "reopen"})
    check("Модерация: reopen", reopened["status"] == "published")

    deadlines = call("POST", "/api/admin/notify/deadlines", token=admin, expected=200, json={"days": 30})
    check("Напоминания о дедлайнах", "sent" in deadlines)


def scenario_all_endpoints() -> None:
    print("Сценарий 8. Полное покрытие: каждый эндпоинт вызывается хотя бы раз")
    a = login(RUN_ID + 15, "CoverA")
    b = login(RUN_ID + 16, "CoverB")

    check("GET /", call("GET", "/", expected=200)["service"] == "B2B Match API")
    check("GET /api/auth/me (legacy)", call("GET", "/api/auth/me", token=a, expected=200)["max_user_id"] == RUN_ID + 15)
    legacy = call("POST", "/api/auth/init", expected=200, json={"dev_max_user_id": RUN_ID + 17, "dev_first_name": "Legacy"})
    check("POST /api/auth/init (legacy)", bool(legacy["access_token"]))

    call("PUT", "/companies/me", token=a, expected=200,
         json=company_payload("ПокрытиеА", ["IT-разработка"], services=["web-разработка"], competencies=["react"]))
    call("PUT", "/companies/me", token=b, expected=200,
         json=company_payload("ПокрытиеБ", ["IT-разработка"], services=["web-разработка"], competencies=["react"]))

    check("GET /companies/me", call("GET", "/companies/me", token=a, expected=200)["name"] == "ПокрытиеА")
    check("GET /opportunities/mine", isinstance(call("GET", "/opportunities/mine", token=a, expected=200), list))

    parsed = call("POST", "/opportunities/preview", token=a, expected=200,
                  json={"description": "Нужен сайт, 100 тысяч"})
    check("POST /opportunities/preview", parsed["category"] == "IT-разработка")

    draft = call("POST", "/opportunities", token=a, expected=201,
                 json={"description": "Нужен сайт, 100 тысяч", "publish": False})
    oid = draft["id"]
    check("GET /opportunities/{id}", call("GET", f"/opportunities/{oid}", token=a, expected=200)["id"] == oid)
    check("GET /opportunities/{id}/matches (draft пуст)",
          call("GET", f"/opportunities/{oid}/matches", token=a, expected=200) == [])

    call("POST", f"/opportunities/{oid}/publish", token=a, expected=200)
    check("Матчи после publish", len(call("GET", f"/opportunities/{oid}/matches", token=a, expected=200)) >= 1)

    check("GET /opportunities/{id}/compare (legacy)",
          "rows" in call("GET", f"/opportunities/{oid}/compare", token=a, expected=200))

    prop = call("POST", f"/api/requests/{oid}/proposals", token=b, expected=201,
                json={"price": 95_000, "term_days": 21, "solution_text": "legacy путь"})
    pid = prop["id"]
    check("POST /api/requests/{id}/proposals (legacy)", prop["status"] == "sent")

    call("POST", f"/proposals/{pid}/view", token=a, expected=200)
    check("POST /proposals/{id}/view", call("GET", f"/proposals/{pid}", token=a, expected=200)["status"] == "viewed")
    check("POST /proposals/{id}/shortlist",
          call("POST", f"/proposals/{pid}/shortlist", token=a, expected=200)["status"] == "shortlisted")

    deal = call("POST", "/deals", token=a, expected=201, json={"opportunity_id": oid, "proposal_id": pid})
    check("GET /deals/{id}", call("GET", f"/deals/{deal['id']}", token=a, expected=200)["id"] == deal["id"])

    check("GET /feed?mode=executor", "feed" in call("GET", "/feed", token=b, params={"mode": "executor"}, expected=200))
    check("GET /feed?mode=customer", "my_requests" in call("GET", "/feed", token=a, params={"mode": "customer"}, expected=200))

    check("POST /opportunities/{id}/close", call("POST", f"/opportunities/{oid}/close", token=a, expected=200)["status"] == "closed")
    check("POST /opportunities/{id}/reopen", call("POST", f"/opportunities/{oid}/reopen", token=a, expected=200)["status"] == "published")

    admin = login(7777001, "Admin")
    check("GET /api/admin/notifications",
          isinstance(call("GET", "/api/admin/notifications", token=admin, expected=200), list))

    # шеринг из MAX (#9): диплинки :share и карточки через бота
    catalog = call("GET", "/companies", expected=200)
    cid = catalog[0]["id"]
    link = call("GET", f"/share/company/{cid}/link", expected=200)
    check("GET /share/company/*/link", "max.ru/:share" in link["url"])
    opp_link = call("GET", f"/share/opportunity/{oid}/link", expected=200)
    check("GET /share/opportunity/*/link", "max.ru/:share" in opp_link["url"])

    card = call("POST", f"/share/company/{cid}", token=a, expected=200)
    check("POST /share/company/* (mid или ошибка)", ("mid" in card or "error" in card) and card["text"])
    opp_card = call("POST", f"/share/opportunity/{oid}", token=a, expected=200)
    check("POST /share/opportunity/* (mid или ошибка)", ("mid" in opp_card or "error" in opp_card) and opp_card["text"])


def main() -> None:
    print(f"B2B Match — проверка сценариев против {BASE}\n")
    scenarios = [
        scenario_reset_and_seed,
        scenario_health_and_auth,
        scenario_company,
        scenario_ai_parse,
        scenario_draft_publish_patch,
        scenario_full_marketplace,
        scenario_notifications_and_files,
        scenario_admin,
        scenario_all_endpoints,
    ]
    for scenario in scenarios:
        try:
            scenario()
        except Exception as exc:  # noqa: BLE001
            FAILED.append(f"{scenario.__name__} (исключение)")
            print(f"  [FAIL] {scenario.__name__}: {exc}")
        print()

    print("=" * 60)
    print(f"Итого: {len(PASSED)} пройдено, {len(FAILED)} не пройдено")

    missing = sorted(EXPECTED_ENDPOINTS - CALLED)
    if missing:
        FAILED.append("покрытие эндпоинтов")
        print(f"Покрытие эндпоинтов: {len(EXPECTED_ENDPOINTS) - len(missing)}/{len(EXPECTED_ENDPOINTS)}. Не вызваны:")
        for method, path in missing:
            print(f"  - {method} {path}")
    else:
        PASSED.append(f"покрытие всех {len(EXPECTED_ENDPOINTS)} эндпоинтов")
        print(f"Покрытие эндпоинтов: {len(EXPECTED_ENDPOINTS)}/{len(EXPECTED_ENDPOINTS)} — все вызваны")

    if FAILED:
        print("Не пройдено:")
        for name in FAILED:
            print(f"  - {name}")
        sys.exit(1)
    print("Все сценарии пройдены.")


if __name__ == "__main__":
    main()
