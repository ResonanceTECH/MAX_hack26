# B2B Match — сценарии проверки (вход / выход / эндпоинты)

Проверка выполняется против живого сервера (`http://localhost:8000`, dev-режим).
Автоматический прогон этих же сценариев: `python backend_max\scripts\verify_scenarios.py`.

**Обозначения:** `AUTH` = заголовок `Authorization: Bearer <access_token>`.
Токен получается запросом `POST /auth/max` с телом `{"dev_max_user_id": <id>, "dev_first_name": "..."}`.

**Подготовка (раз в прогон):**
- `POST /api/admin/reset` (AUTH админа) → `200 {"reset": true}` — сброс базы
- `POST /api/admin/seed` (AUTH админа `7777001`) → `200` со статистикой
  `companies: 8, requests: 3, matches: 9` — демо-данные

---

## Сценарий 1. Здоровье сервера и авторизация

| Шаг | Эндпоинт | Вход | Ожидаемый выход |
|---|---|---|---|
| 1.1 | `GET /health` | — | `200 {"status":"ok"}` |
| 1.2 | `GET /me` | без AUTH | `401` |
| 1.3 | `GET /me` | AUTH с `Bearer broken` | `401` |
| 1.4 | `POST /auth/max` | `{"dev_max_user_id": 90001, "dev_first_name": "Тester"}` | `200`, содержит `access_token`, `user.max_user_id == 90001`, `user.company_id == null` |
| 1.5 | `GET /me` | AUTH из шага 1.4 | `200`, тот же `max_user_id` |
| 1.6 | `GET /dictionaries` | — | `200`, `categories` (≥7), `regions` (>20), `budget_ranges`, `deadline_presets` |
| 1.7 | `GET /dictionaries/categories` | — | `200`, массив категорий с `services` |
| 1.8 | `GET /dictionaries/regions` | — | `200`, массив регионов |

## Сценарий 2. Профиль компании и каталог

Пользователь `90002` («Owner»), чужой `90003` («Stranger»).

| Шаг | Эндпоинт | Вход | Ожидаемый выход |
|---|---|---|---|
| 2.1 | `PUT /companies/me` | AUTH Owner, тело ниже | `200`, `name == "ПроверкаКом"`, есть `id` |
| 2.2 | `PATCH /companies/{id}` | AUTH Owner, `{"description": "Описание обновлено", "budget_max": 900000}` | `200`, обновлённые поля |
| 2.3 | `PATCH /companies/{id}` | AUTH Stranger, `{"name": "Взлом"}` | `403` |
| 2.4 | `GET /companies` | — | `200`, массив; содержит компанию из 2.1 |
| 2.5 | `GET /companies/{id}` | — | `200`, + `active_requests`, `proposals_count` |

Тело 2.1:
```json
{
  "name": "ПроверкаКом",
  "industries": ["Логистика"],
  "services": ["доставка по городу"],
  "competencies": ["доставка"],
  "regions": ["Москва"],
  "budget_min": 100000,
  "budget_max": 1000000,
  "max_term_days": 60
}
```

## Сценарий 3. AI-структуризация свободного текста

`POST /ai/parse-opportunity` (AUTH любого пользователя).

| Шаг | Вход `{"description": ...}` | Ожидаемый выход |
|---|---|---|
| 3.1 | `"Нужна разработка интернет-магазина. React, 1С, бюджет 400-600 тысяч, срок два месяца, Москва"` | `200`: `category: "IT-разработка"`, `subcategory: "web-разработка"`, `budget_min: 400000`, `budget_max: 600000`, `deadline_days: 60`, `regions: ["Москва"]`, `requirements` содержит `react` и `1с` |
| 3.2 | `"Требуется smm-продвижение и контекстная реклама, бюджет до 150 тысяч, Самара"` | `200`: `category: "Маркетинг и реклама"`, `budget_max: 150000`, регион `Самара` |
| 3.3 | `"Нужен поставщик упаковки и полиграфии, от 100 до 300 тысяч, Новосибирск"` | `200`: `category: "Производство"`, `budget_min: 100000`, `budget_max: 300000` |
| 3.4 | `""` (пусто) | `422` |

## Сценарий 4. Draft → PATCH → Publish

Пользователь `90004` («Drafter»), чужой `90005`.

| Шаг | Эндпоинт | Вход | Ожидаемый выход |
|---|---|---|---|
| 4.1 | `POST /opportunities` | AUTH Drafter, `{"description": "Нужен сайт, бюджет 200 тысяч, Москва", "publish": false}` | `201`: `status: "draft"`, `matches: []` |
| 4.2 | `PATCH /opportunities/{id}` | AUTH Drafter, `{"budget_max": 300000, "title": "Сайт компании"}` | `200`: `budget_max: 300000`, `title: "Сайт компании"` |
| 4.3 | `PATCH /opportunities/{id}` | AUTH чужого, `{"title": "Взлом"}` | `403` |
| 4.4 | `POST /opportunities/{id}/publish` | AUTH Drafter | `200`: `status: "published"`, `expires_at` заполнен |
| 4.5 | `POST /opportunities/{id}/publish` | AUTH Drafter (повторно) | `409` |

## Сценарий 5. Полный цикл: запрос → матчи → отклики → shortlist → deal

Участники: заказчик `90006` («ЗаказчикКо», Производство), исполнители
`90007` («АйТиОдин», IT, компетенции react/python/1с/crm, verified),
`90008` («АйТиДва», IT, react/figma), посторонний `90009` (Логистика).
У всех — профили через `PUT /companies/me`.

| Шаг | Эндпоинт | Вход | Ожидаемый выход |
|---|---|---|---|
| 5.1 | `POST /opportunities` | AUTH заказчика, `{"description": "Нужна разработка интернет-магазина. React, 1С, бюджет 400-600 тысяч, срок два месяца, Москва"}` | `201`: `status: "published"`; `matches` непустой; каждый матч содержит `id`, `company_id`, `score` (≥60), `criteria` с полями `key/label/passed/detail` |
| 5.2 | `GET /opportunities` | — | `200`, витрина содержит запрос из 5.1 |
| 5.3 | `GET /me/recommendations` | AUTH АйТиОдин | `200`, лента содержит запрос 5.1: `match_id`, `score`, `criteria` («почему подходит»), `feedback: null` |
| 5.4 | `POST /matches/{match_id}/feedback` | AUTH АйТиОдин, `{"positive": true}` | `200`, `feedback: true`; повторно `{"positive": false}` → `feedback: false` |
| 5.5 | `GET /notifications` | AUTH АйТиОдин | `200`, есть текст «Вам подошёл новый заказ на N%» |
| 5.6 | `POST /opportunities/{id}/proposals` | AUTH АйТиОдин, `{"price": 480000, "term_days": 45, "solution_text": "React + 1С, поэтапно"}` | `201`, `status: "sent"`, `company_name: "АйТиОдин"` |
| 5.7 | то же | AUTH АйТиОдин (повторно) | `409` |
| 5.8 | то же | AUTH заказчика (на свой запрос) | `422` |
| 5.9 | `POST /opportunities/{id}/proposals` | AUTH АйТиДва, `{"price": 420000, "term_days": 60, "solution_text": "..."}` | `201` |
| 5.10 | `GET /opportunities/{id}/proposals` | AUTH заказчика | `200`, 2 предложения |
| 5.11 | `GET /proposals/{id}` | AUTH АйТиОдин (участник) | `200` |
| 5.12 | `GET /proposals/{id}` | AUTH постороннего | `403` |
| 5.13 | `GET /opportunities/{id}/comparison` | AUTH заказчика | `200`, `rows` из 2 элементов: `company_name`, `price`, `term_days`, `match_score`, `cases_count`, `rating`, `requirements_met: "N/M"` |
| 5.14 | `POST /opportunities/{id}/shortlist` | AUTH заказчика, `{"proposal_id": <id1>}` | `200`, `status: "shortlisted"` |
| 5.15 | `POST /opportunities/{id}/shortlist` | AUTH заказчика, `{"company_id": <АйТиДва>}` | `200`, `status: "shortlisted"` |
| 5.16 | `POST /proposals/{id}/status` | AUTH заказчика, `{"status": "bogus"}` | `422` |
| 5.17 | `POST /deals` | AUTH заказчика, `{"opportunity_id": <id>, "proposal_id": <id1>}` | `201`, `status: "negotiating"`, `next_action` про переговоры |
| 5.18 | `POST /deals` (повторно) | тот же вход | `201`/`200`, тот же `id` (идемпотентно) |
| 5.19 | `POST /deals` | AUTH постороннего | `403` |
| 5.20 | `GET /deals` | AUTH АйТиОдин и AUTH заказчика | `200`, сделка видна обеим сторонам |
| 5.21 | `GET /opportunities/{id}/dealroom` | AUTH заказчика | `200`: `shortlist` из 2, `next_action` непустой |
| 5.22 | `POST /proposals/{id}/status` | AUTH заказчика, `{"status": "chosen"}` | `200`, `status: "chosen"` |
| 5.23 | `POST /opportunities/{id}/close` | AUTH заказчика | `200`, `status: "closed"` |
| 5.24 | `POST /opportunities/{id}/proposals` | AUTH нового исполнителя | `409` (приём закрыт) |
| 5.25 | `GET /proposals/mine` | AUTH АйТиОдин | `200`, его предложение со `status: "chosen"` |

## Сценарий 6. Уведомления и файлы

| Шаг | Эндпоинт | Вход | Ожидаемый выход |
|---|---|---|---|
| 6.1 | `GET /notifications` | AUTH заказчика из сценария 5 | `200`, есть «На ваш запрос … поступило предложение от …» |
| 6.2 | `POST /notifications/{id}/read` | AUTH владельца уведомления | `200`, `is_read: true` |
| 6.3 | `POST /notifications/read-all` | AUTH | `200`; после — все `is_read: true` |
| 6.4 | `POST /files` | AUTH, multipart `file=case.pdf` (≤10 МБ) | `201`, `{id, name, content_type, size}` |
| 6.5 | `GET /files/{id}` | AUTH владельца | `200`, те же байты |
| 6.6 | `GET /files/{id}` | AUTH чужого | `403` |
| 6.7 | `POST /files` | AUTH, файл > 10 МБ | `413` |

## Сценарий 7. Администрирование

Админ — пользователь `7777001` (задан в `MAX_ADMIN_USER_IDS`).

| Шаг | Эндпоинт | Вход | Ожидаемый выход |
|---|---|---|---|
| 7.1 | `POST /api/admin/reset` | AUTH админа | `200 {"reset": true}` |
| 7.2 | `POST /api/admin/seed` | AUTH админа | `200`: `companies: 8`, `requests: 3`, `matches: 9` |
| 7.3 | `GET /api/admin/stats` | AUTH обычного пользователя | `403` |
| 7.4 | `POST /api/admin/companies/{id}/verify` | AUTH админа, `{"verified": true}` | `200`, `is_verified: true` |
| 7.5 | `POST /api/admin/requests/{id}/moderate` | AUTH админа, `{"action": "block"}` | `200`, `status: "blocked"` |
| 7.6 | `POST /api/admin/requests/{id}/moderate` | AUTH админа, `{"action": "reopen"}` | `200`, `status: "published"` |
| 7.7 | `POST /api/admin/notify/deadlines` | AUTH админа, `{"days": 30}` | `200`, `{"sent": N}` |
| 7.8 | `GET /api/admin/notifications` | AUTH админа | `200`, журнал с `target_user_id`, `ok`, `error` |

## Сводка кодов ошибок

| Код | Когда |
|---|---|
| `401` | нет токена / невалидный токен / невалидный initData |
| `403` | чужая сущность, не админ, чужой файл/сделка/предложение |
| `404` | сущность не найдена |
| `409` | повторный отклик, повторная публикация, отклик на закрытый запрос, отклонённое предложение |
| `422` | невалидное тело (пустое описание, недопустимый статус, отклик на свой запрос) |
| `413` | файл больше 10 МБ |
