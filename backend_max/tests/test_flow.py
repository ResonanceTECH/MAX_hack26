from __future__ import annotations


def test_full_mvp_scenario(client, login, company_payload_factory):
    # 1. Заказчик и два исполнителя входят и создают профили
    customer = login(9201, "Заказчик")
    exec1 = login(9202, "ИсполнительОдин")
    exec2 = login(9203, "ИсполнительДва")

    client.put(
        "/companies/me",
        json=company_payload_factory(
            "ФабрикаМебели",
            ["Производство"],
            services=["мебель на заказ"],
            regions=["Казань", "Вся Россия"],
            budget_min=100_000,
            budget_max=1_500_000,
        ),
        headers=customer,
    )
    client.put(
        "/companies/me",
        json=company_payload_factory(
            "ТестЛаб",
            ["IT-разработка"],
            services=["web-разработка", "интеграции"],
            competencies=["react", "python", "1с", "crm"],
            regions=["Москва", "Вся Россия"],
            budget_min=300_000,
            budget_max=2_000_000,
            max_term_days=45,
            is_verified=True,
            cases=[{"title": "Интернет-магазин мебели", "description": "React + 1С"}],
        ),
        headers=exec1,
    )
    client.put(
        "/companies/me",
        json=company_payload_factory(
            "ТестФордж",
            ["IT-разработка"],
            services=["web-разработка"],
            competencies=["react", "figma"],
            regions=["Санкт-Петербург", "Вся Россия"],
            budget_min=100_000,
            budget_max=500_000,
        ),
        headers=exec2,
    )

    # 2. AI-структуризация свободного текста
    preview = client.post(
        "/ai/parse-opportunity",
        json={"description": "Нужна разработка интернет-магазина. React, интеграция с 1С, CRM, бюджет 400-600 тысяч, срок два месяца, Москва."},
        headers=customer,
    )
    assert preview.status_code == 200
    structured = preview.json()
    assert structured["category"] == "IT-разработка"
    assert structured["budget_min"] == 400_000

    # 3. Публикация потребности + матчинг
    created = client.post(
        "/opportunities",
        json={"description": "Нужна разработка интернет-магазина. React, интеграция с 1С, CRM, бюджет 400-600 тысяч, срок два месяца, Москва."},
        headers=customer,
    )
    assert created.status_code == 201, created.text
    detail = created.json()
    opportunity_id = detail["id"]
    assert detail["status"] == "published"
    assert detail["matches"], "матчи должны быть вычислены при публикации"
    top = detail["matches"][0]
    exec1_company = client.get("/companies/me", headers=exec1).json()
    assert top["score"] >= 60
    assert any(m["company_name"] == exec1_company["name"] for m in detail["matches"]), detail["matches"]
    assert any(c["key"] == "category" and c["passed"] for c in top["criteria"])

    # 4. Персональная лента исполнителя: релевантный заказ виден с объяснением
    feed = client.get("/me/recommendations", headers=exec1).json()
    assert any(item["request"]["id"] == opportunity_id for item in feed)
    item = next(i for i in feed if i["request"]["id"] == opportunity_id)
    assert item["score"] >= 60
    assert item["criteria"]

    # 5. Исполнитель отправляет предложение
    proposal = client.post(
        f"/opportunities/{opportunity_id}/proposals",
        json={"price": 480_000, "term_days": 45, "solution_text": "React + 1С, поэтапная сдача", "comment": "Готовы стартовать через неделю"},
        headers=exec1,
    )
    assert proposal.status_code == 201, proposal.text
    proposal_id = proposal.json()["id"]

    duplicate = client.post(
        f"/opportunities/{opportunity_id}/proposals",
        json={"price": 480_000, "term_days": 45, "solution_text": "ещё раз"},
        headers=exec1,
    )
    assert duplicate.status_code == 409

    self_proposal = client.post(
        f"/opportunities/{opportunity_id}/proposals",
        json={"price": 1, "term_days": 1, "solution_text": "себе"},
        headers=customer,
    )
    assert self_proposal.status_code == 422

    # 6. Заказчик видит предложения и сравнивает
    proposals = client.get(f"/opportunities/{opportunity_id}/proposals", headers=customer).json()
    assert len(proposals) == 1

    compare = client.get(f"/opportunities/{opportunity_id}/comparison", headers=customer).json()
    assert compare["rows"]
    assert compare["rows"][0]["price"] == 480_000
    assert compare["rows"][0]["company_name"] == "ТестЛаб"

    # 7. Shortlist (по потребности с company_id) и выбор исполнителя
    shortlisted = client.post(
        f"/opportunities/{opportunity_id}/shortlist",
        json={"company_id": compare["rows"][0]["company_id"]},
        headers=customer,
    )
    assert shortlisted.json()["status"] == "shortlisted"

    dealroom = client.get(f"/opportunities/{opportunity_id}/dealroom", headers=customer).json()
    assert len(dealroom["shortlist"]) == 1
    assert "переговоры" in dealroom["next_action"]

    chosen = client.post(f"/proposals/{proposal_id}/status", json={"status": "chosen"}, headers=customer)
    assert chosen.json()["status"] == "chosen"

    # 8. У исполнителя статус отклика обновился, предложение читается по id
    mine = client.get("/proposals/mine", headers=exec1).json()
    assert mine[0]["status"] == "chosen"
    assert mine[0]["request_title"]

    single = client.get(f"/proposals/{proposal_id}", headers=exec1)
    assert single.status_code == 200

    # 9. Уведомления в inbox заказчика
    inbox = client.get("/notifications", headers=customer).json()
    assert any("предложение" in n["text"] for n in inbox)

    # 10. Deal Room → сделка
    deal = client.post("/deals", json={"opportunity_id": opportunity_id, "proposal_id": proposal_id}, headers=customer)
    assert deal.status_code == 201, deal.text
    assert deal.json()["status"] == "negotiating"
    deal_id = deal.json()["id"]
    my_deals = client.get("/deals", headers=exec1).json()
    assert any(d["id"] == deal_id for d in my_deals)

    # 11. Файлы в сделке (Deal Room): загрузка с deal_id, доступ обеим сторонам
    upload = client.post(
        "/files",
        data={"deal_id": str(deal_id)},
        files={"file": ("dogovor.pdf", b"%PDF-contract", "application/pdf")},
        headers=customer,
    )
    assert upload.status_code == 201, upload.text
    file_id = upload.json()["id"]
    assert upload.json()["deal_id"] == deal_id

    deal_with_files = client.get(f"/deals/{deal_id}", headers=customer).json()
    assert any(f["id"] == file_id for f in deal_with_files["files"])

    dealroom_with_files = client.get(f"/opportunities/{opportunity_id}/dealroom", headers=customer).json()
    assert any(f["id"] == file_id for f in dealroom_with_files["files"])

    dl = client.get(f"/files/{file_id}", headers=exec1)
    assert dl.status_code == 200 and dl.content == b"%PDF-contract"
    assert client.get(f"/files/{file_id}", headers=exec2).status_code == 403

    # 12. Verified Business: дата регистрации — только при создании (BU не редактирует профиль)
    my_company = client.get("/companies/me", headers=customer).json()
    assert my_company["id"]
    denied = client.patch(
        f"/companies/{my_company['id']}",
        json={"registration_date": "2012-04-17", "company_status": "Действующая", "verification_source": "ЕГРЮЛ (тестовые данные)"},
        headers=customer,
    )
    assert denied.status_code == 403

    # 13. Шеринг из MAX (#9): диплинк :share и карточка через бота
    from urllib.parse import unquote

    share_link = client.get(f"/share/company/{compare['rows'][0]['company_id']}/link")
    assert share_link.status_code == 200
    assert "max.ru/:share" in share_link.json()["url"]
    assert "ТестЛаб" in unquote(share_link.json()["url"])

    opp_link = client.get(f"/share/opportunity/{opportunity_id}/link")
    assert opp_link.status_code == 200 and "max.ru/:share" in opp_link.json()["url"]

    share_card = client.post(f"/share/company/{compare['rows'][0]['company_id']}", headers=customer)
    assert share_card.status_code == 200
    body = share_card.json()
    assert body["sent"] is False  # BOT_TOKEN не задан в тестах
    assert "BOT_TOKEN" in (body["error"] or "")
    assert "ТестЛаб" in body["text"]

    share_opp = client.post(f"/share/opportunity/{opportunity_id}", headers=customer)
    assert share_opp.status_code == 200 and share_opp.json()["sent"] is False

    # 11. Feedback по матчу (исполнитель оценивает релевантность рекомендации)
    matches = client.get(f"/opportunities/{opportunity_id}/matches", headers=customer).json()
    digital_match = next(m for m in matches if m["company_name"] == "ТестЛаб")
    feedback = client.post(
        f"/matches/{digital_match['id']}/feedback",
        json={"positive": True},
        headers=exec1,
    )
    assert feedback.status_code == 200
    assert feedback.json()["feedback"] is True


def test_draft_publish_patch(client, login, company_payload_factory):
    # draft → PATCH → publish
    customer = login(9401, "Заказчик")
    client.put(
        "/companies/me",
        json=company_payload_factory("ТестКом", ["IT-разработка"], regions=["Москва"]),
        headers=customer,
    )

    draft = client.post(
        "/opportunities",
        json={"description": "Нужен сайт, бюджет 200 тысяч, Москва", "publish": False},
        headers=customer,
    )
    assert draft.status_code == 201
    opportunity_id = draft.json()["id"]
    assert draft.json()["status"] == "draft"
    assert draft.json()["matches"] == []

    patched = client.patch(
        f"/opportunities/{opportunity_id}",
        json={"budget_max": 300_000, "title": "Сайт для компании"},
        headers=customer,
    )
    assert patched.status_code == 200
    assert patched.json()["budget_max"] == 300_000
    assert patched.json()["title"] == "Сайт для компании"

    published = client.post(f"/opportunities/{opportunity_id}/publish", headers=customer)
    assert published.status_code == 200
    assert published.json()["status"] == "published"

    # повторная публикация запрещена
    assert client.post(f"/opportunities/{opportunity_id}/publish", headers=customer).status_code == 409

    # чужая компания не может править
    stranger = login(9402, "Чужой")
    client.put(
        "/companies/me",
        json=company_payload_factory("ЧужаяКомпания", ["Логистика"]),
        headers=stranger,
    )
    assert client.patch(f"/opportunities/{opportunity_id}", json={"title": "Взлом"}, headers=stranger).status_code == 403


def test_company_patch_and_catalog(client, login, company_payload_factory):
    user = login(9501, "Владелец")
    created = client.put("/companies/me", json=company_payload_factory("КаталогКом", ["Логистика"]), headers=user)
    company_id = created.json()["id"]

    patched = client.patch(f"/companies/{company_id}", json={"description": "Обновлено", "budget_max": 900_000}, headers=user)
    assert patched.status_code == 403

    stranger = login(9502, "Чужой")
    assert client.patch(f"/companies/{company_id}", json={"name": "Хак"}, headers=stranger).status_code == 403

    catalog = client.get("/companies", headers=user).json()
    assert any(c["id"] == company_id for c in catalog)

    one = client.get(f"/companies/{company_id}", headers=user).json()
    assert one["name"] == "КаталогКом"


def test_files_and_notifications(client, login, company_payload_factory):
    user = login(9601, "Файловик")
    client.put("/companies/me", json=company_payload_factory("ФайлоКом", ["Логистика"]), headers=user)
    upload = client.post(
        "/files",
        files={"file": ("case.txt", b"our case data", "text/plain")},
        headers=user,
    )
    assert upload.status_code == 201, upload.text
    file_id = upload.json()["id"]
    assert upload.json()["name"] == "case.txt"

    download = client.get(f"/files/{file_id}", headers=user)
    assert download.status_code == 200
    assert download.content == b"our case data"

    # чужой пользователь не может скачать
    stranger = login(9602, "Чужой")
    client.put("/companies/me", json=company_payload_factory("ЧужойКом", ["Логистика"]), headers=stranger)
    assert client.get(f"/files/{file_id}", headers=stranger).status_code == 403

    # файл, привязанный к потребности: автор и откликнувшийся имеют доступ
    customer = login(9603, "ЗаказчикФайл")
    executor = login(9604, "ИсполнительФайл")
    client.put("/companies/me", json=company_payload_factory("ЗаказчикФайлКом", ["IT-разработка"]), headers=customer)
    client.put(
        "/companies/me",
        json=company_payload_factory("ИсполФайлКом", ["IT-разработка"], services=["web-разработка"]),
        headers=executor,
    )
    created = client.post("/opportunities", json={"description": "Нужен сайт, 100 тысяч"}, headers=customer).json()
    opp_id = created["id"]
    client.post(
        f"/opportunities/{opp_id}/proposals",
        json={"price": 90_000, "term_days": 20, "solution_text": "сделаем"},
        headers=executor,
    )
    attached = client.post(
        "/files",
        data={"opportunity_id": str(opp_id)},
        files={"file": ("tz.pdf", b"%PDF-tz", "application/pdf")},
        headers=customer,
    )
    assert attached.status_code == 201, attached.text
    attached_id = attached.json()["id"]
    assert attached.json()["opportunity_id"] == opp_id

    dealroom = client.get(f"/opportunities/{opp_id}/dealroom", headers=customer).json()
    assert any(f["id"] == attached_id for f in dealroom["files"])

    dl_exec = client.get(f"/files/{attached_id}", headers=executor)
    assert dl_exec.status_code == 200 and dl_exec.content == b"%PDF-tz"
    assert client.get(f"/files/{attached_id}", headers=stranger).status_code == 403


def test_dictionaries(client, login):
    user = login(9701, "Словарь")
    full = client.get("/dictionaries", headers=user).json()
    assert full["categories"] and full["regions"] and full["budget_ranges"]
    assert client.get("/dictionaries/categories", headers=user).json()
    assert client.get("/dictionaries/regions", headers=user).json()


def test_seed_and_admin(client, login, company_payload_factory):
    admin = login(7777001, "Админ")
    response = client.post("/api/admin/seed", headers=admin)
    assert response.status_code == 200, response.text
    stats = response.json()
    assert stats["companies"] >= 8
    assert stats["requests"] >= 3
    assert stats["matches"] > 0

    listing = client.get("/opportunities", headers=admin)
    assert listing.status_code == 200
    assert len(listing.json()) >= 3

    verify = client.post("/api/admin/companies/1/verify", json={"verified": True}, headers=admin)
    assert verify.status_code == 200

    regular = login(9301, "Обычный")
    forbidden = client.get("/api/admin/stats", headers=regular)
    assert forbidden.status_code == 403
