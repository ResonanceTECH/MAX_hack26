# B2B Match — спецификация решения (реализовано)

Версия: 0.2.0 · Стек: Python 3.9+/3.11, FastAPI, SQLAlchemy 2, PostgreSQL 15, JWT, Docker, Caddy

## 1. Назначение

B2B Match — двусторонний маркетплейс подбора B2B-контрагентов внутри MAX.
Компания один раз описывает бизнес-потребность (свободным текстом или формой),
платформа структурирует её, находит релевантных исполнителей с объяснением,
и доводит взаимодействие до shortlist, Deal Room и переговоров. Исполнители
получают персональную ленту релевантных заказов и откликаются заполненным профилем.
Одна компания совмещает обе роли: сегодня заказчик, завтра исполнитель.

Состав решения: бэкенд (FastAPI + PostgreSQL), бот (точка входа, long polling),
Caddy (HTTPS-вход и раздача фронтенда), фронтенд-заглушка (место под React + MAX Bridge + MAX UI).

## 2. Архитектура

```
┌─ КЛИЕНТЫ ───────────────────────────────────────────┐
│ Мини-приложение (React, WebView MAX)  →  HTTP/HTTPS │
│ Бот (bot.py, long polling к Bot API MAX)            │
└───────────────────────┬─────────────────────────────┘
                        │ 443/80 (Caddy, TLS)
┌─ СЕРВЕР ──────────────▼─────────────────────────────┐
│ Caddy     — TLS-терминация, раздача frontend/,      │
│             прокси API-путей на backend:8000        │
│ FastAPI   — авторизация, матчинг, отклики, сделки,  │
│             уведомления через Bot API MAX           │
│ PostgreSQL 15 — данные (JSON-колонки для списков)   │
└─────────────────────────────────────────────────────┘
```

Компоненты в `compose.yaml`: `db` (healthcheck `pg_isready`, volume `pgdata`),
`backend` (старт после БД, ретраи подключения 10×2с), `caddy` (volume
`caddy_data`/`caddy_config`, фронтенд из `frontend/`).

## 3. Авторизация

```
POST /auth/max   { init_data?: string, dev_max_user_id?, dev_first_name?, ... }
```

1. Фронтенд передаёт `initData` из MAX Bridge (`window.WebApp.initData`).
2. Бэкенд проверяет HMAC-подпись (схема «WebAppData»: секрет
   `HMAC-SHA256(b"WebAppData", BOT_TOKEN)`), контролирует `auth_date`
   (`INITDATA_MAX_AGE=86400`).
3. Пользователь находится/создаётся по `max_user_id`, выдаётся JWT
   (`JWT_SECRET`, TTL `JWT_TTL_HOURS=168`); дальше — `Authorization: Bearer <token>`.

`DEV_MODE=1` (авто-включение при отсутствии `BOT_TOKEN`): вход по `dev_max_user_id`
без initData — для локальной разработки, Postman и демо. В проде обязательно `0`
(иначе возможен вход под чужим id). Админы платформы — `MAX_ADMIN_USER_IDS`
(в демо: `7777001`).

Скрытые алиасы совместимости: `POST /api/auth/init`, `GET /api/auth/me`.

## 4. Роли и права

| Роль | Реализация | Права |
|---|---|---|
| Заказчик | режим работы компании | публикация/правка потребностей, просмотр откликов, shortlist, comparison, deal |
| Исполнитель | тот же аккаунт | `/me/recommendations`, отклики, `/proposals/mine`, сделки, feedback по матчам |
| Администратор платформы | `User.is_admin` (+ `MAX_ADMIN_USER_IDS`) | `/api/admin/*`: seed, reset, статистика, модерация, верификация, дедлайны, журнал |
| Администратор компании | владелец профиля | PUT/PATCH `/companies/me` и `/companies/{id}` (только своя) |
| Сотрудник компании | не реализован (1 пользователь ↔ 1 компания) | следующий этап; домен к этому готов |

Проверки прав (тестируются): автор запроса ↔ исполнитель ↔ посторонний (403),
админ ↔ обычный пользователь (403), владелец файла (403), участники сделки (403).

## 5. Модель данных (PostgreSQL)

| Сущность | Ключевые поля | Связи |
|---|---|---|
| `User` | `max_user_id` (уник.), имя, `is_admin` | 1→1 `Company` |
| `Company` | имя, ИНН (уник.), описание, отрасли[], услуги[], компетенции[], регионы[], бюджет min/max, `max_term_days`, кейсы[], сертификаты[], сайт/контакты, рейтинг, `is_verified`, `registration_date`, `company_status`, `verification_source` (Verified Business) | владелец `User` |
| `Request` (Business Opportunity) | заголовок, `description_raw`, категория/подкатегория, требования[], `required_certificates[]`, бюджет, `deadline_days`, регионы[], `proposals_deadline_days`, статус, даты | автор `Company`; 1→N матчи/отклики |
| `RequestMatch` | `score`, `criteria[]` (JSON), `feedback` | уник. пара `Request`×`Company` |
| `Proposal` | цена, срок, решение, кейс, комментарий, статус, `viewed_at` | `Request` + исполнитель `Company` |
| `Deal` | стороны, статус `negotiating` | 1→1 `Proposal` |
| `UploadedFile` | имя, тип, размер, путь, `opportunity_id`, `deal_id` (файлы Deal Room) | владелец `User` |
| `NotificationLog` | текст, `target_user_id`, `ok`, `error`, `is_read` | inbox + журнал доставки |

Файлы хранятся в `FILES_DIR` (volume `./data`).

## 6. Статусные модели

- **Request**: `draft` → `published` → `closed` / `blocked` (модерация); `reopen`.
- **Proposal**: `sent` → `viewed` → `shortlisted` → `negotiating` → `chosen` | `rejected`.
  `negotiating` ставится также при создании Deal; `viewed` — авторским `/view`
  или первым изменением статуса.
- **Deal**: `negotiating` (создание идемпотентно по proposal).

## 7. Контракт API (55 эндпоинтов)

| Домен | Эндпоинты |
|---|---|
| Auth | `POST /auth/max`, `GET /me` (+ скрытые `/api/auth/init`, `/api/auth/me`) |
| Company | `GET /companies` (каталог: `q`, `category`, `region`, `verified_only`), `GET /companies/{id}` (+статистика), `PATCH /companies/{id}` (владелец/админ), `PUT /companies/me`, `GET /companies/me` |
| Opportunities | `GET /opportunities` (витрина), `POST /opportunities` (`publish: true|false`), `GET /opportunities/{id}`, `PATCH /opportunities/{id}`, `GET /opportunities/mine`, `POST /opportunities/{id}/publish\|close\|reopen`, `GET /opportunities/{id}/matches`, `GET /opportunities/{id}/comparison` (+ скрытый `/compare`), `GET /opportunities/{id}/dealroom` |
| Feed | `GET /me/recommendations` (match_id, score, criteria, feedback), `POST /matches/{id}/feedback` `{positive}`, `GET /feed?mode=executor\|customer` (dashboard) |
| Proposals | `POST /opportunities/{id}/proposals` (повторный отклик 409, автору 422; закрыт приём 409), `GET /opportunities/{id}/proposals` (автор), `GET /proposals/{id}` (участники), `GET /proposals/mine`, `POST /proposals/{id}/view\|shortlist\|status` |
| Shortlist | `POST /opportunities/{id}/shortlist` `{company_id \| proposal_id}` — toggle |
| Deal | `POST /deals` `{opportunity_id, proposal_id}`, `GET /deals`, `GET /deals/{id}` |
| Notifications | `GET /notifications` (inbox, непрочитанные сверху), `POST /notifications/{id}/read`, `POST /notifications/read-all` |
| AI parsing | `POST /ai/parse-opportunity` `{description}` (+ `POST /opportunities/preview`) |
| Files | `POST /files` (multipart ≤10 МБ; опц. Form-поля `opportunity_id`/`deal_id` — файл попадает в Deal Room), `GET /files/{id}` (владелец/админ/участники сделки) |
| Share | `POST /share/company/{id}`, `POST /share/opportunity/{id}` — бот шлёт карточку пользователю и возвращает `mid` для `shareMaxContent`; `GET /share/company/{id}/link`, `GET /share/opportunity/{id}/link` — диплинк `https://max.ru/:share?text=...` |
| Dictionaries | `GET /dictionaries`, `/dictionaries/categories`, `/dictionaries/regions` |
| Admin `/api/admin/*` | `POST /seed`, `POST /reset`, `GET /stats`, `POST /companies/{id}/verify`, `POST /requests/{id}/moderate` (`publish\|block\|close\|reopen`), `POST /notify/deadlines`, `GET /notifications` |
| Meta | `GET /`, `GET /health`, `/docs`, `/openapi.json` |

Ошибки: `401` (токен/initData), `403` (чужая сущность/не админ), `404`,
`409` (повторный отклик/публикация, закрытый приём, отклонённое предложение),
`422` (невалидные данные/статус), `413` (файл > 10 МБ).

## 8. Smart Request Builder (структуризация)

Вход — свободный текст; выход — `{title, category, subcategory, requirements[],
budget_min/max, deadline_days, regions[]}`.

- **Категории**: IT-разработка, Маркетинг и реклама, Производство, Логистика,
  Строительство и ремонт, Бухгалтерия и финансы, Дизайн (иначе «Прочее»);
  у каждой — услуги и подкатегории.
- **Бюджет**: `до X` → max; `от X до Y` → диапазон; `X–Y тыс/млн` → обе границы
  с множителем; `бюджет X` → 0.8X–X; множители тыс/т/к ×1000, млн ×10⁶; только
  при денежном контексте.
- **Срок**: `N дней/недель/месяцев`, числа прописью («два месяца» → 60).
- **Регионы**: словарь ~30 городов с синонимами («спб», «питер»).
- **Требования**: токены технологий (react, 1с, crm, api, ios, android…).
- **Опц. LLM** (`LLM_API_URL/KEY/MODEL`, OpenAI-совместимый): заменяет правила;
  при любой ошибке — фолбэк на правила.

## 9. Explainable Matching

Score = сумма весов пройденных критериев (порог `MIN_MATCH_SCORE=60`,
топ `TOP_MATCHES=5`):

| Критерий | Вес | Условие |
|---|---|---|
| Отрасль | 25 | категория ∈ отраслям компании |
| Услуга | 10 | подкатегория ∈ услугам (или не указана) |
| Компетенции | 20 | ≥50% требований покрыто компетенциями+услугами |
| Бюджет | 15 | диапазоны пересекаются |
| География | 10 | пересечение регионов или «Вся Россия» |
| Сроки | 5 | `max_term_days` ≤ `deadline_days` |
| Верификация | 5 | `is_verified` |
| Похожие кейсы | 5 | ≥1 кейс компании пересекается с требованиями запроса (деталь: «релевантные кейсы: N из M», пример кейса) |
| Сертификаты | 5 | все `required_certificates` запроса есть у компании (или сертификаты не требуются; деталь: «нет требуемых сертификатов: …») |

Сумма весов — 100. Каждый критерий возвращает `label/passed/detail` (объяснение).
Матчи вычисляются при публикации и хранятся двусторонне: заказчику — `matches`,
исполнителю — `/me/recommendations`; `PATCH` опубликованного запроса пересчитывает
матчи; `feedback` (релевант/нет) хранится для последующего тюнинга.

## 10. Уведомления (Bot API MAX + inbox)

| Событие | Получатель | Текст |
|---|---|---|
| Публикация запроса | топ-матчи | «Вам подошёл новый заказ на N%» |
| Новый отклик | заказчик | «На ваш запрос поступило предложение от …» |
| Shortlist | исполнитель | «Вас добавили в shortlist…» |
| Выбор/отказ | исполнитель | «Вы выбраны…» / «заказчик выбрал другого» |
| Deal | исполнитель | «Заказчик открыл переговоры…» |
| Дедлайн (admin) | стороны | «До окончания приёма осталось N дн.» |

Best-effort, журналируются в `NotificationLog` (= inbox). Без `BOT_TOKEN` —
только журнал.

## 11. Comparison / Shortlist / Deal Room / Шеринг

- **Comparison Board** (`/comparison`): строки по откликам — компания, match-score,
  цена, срок, кейсы, рейтинг, покрытие требований «N/M»; сортировка: shortlist →
  score desc → цена.
- **Shortlist**: toggle по `proposal_id` или `company_id` внутри потребности.
- **Deal Room** (`/dealroom`): запрос + предложения + shortlist + **файлы** +
  `next_action` («сравните и добавьте в shortlist» → «начните переговоры» →
  «исполнитель выбран»). Файлы привязываются при загрузке (`opportunity_id`/`deal_id`)
  и доступны обеим сторонам сделки.
- **Deal** (`POST /deals`): фиксирует переход в переговоры; обеим сторонам виден
  в `GET /deals`; `GET /deals/{id}` включает привязанные файлы.
- **Шеринг из MAX**: `GET /share/.../link` — диплинк `https://max.ru/:share?text=...`
  (экран «Отправить в MAX»); `POST /share/...` — бот отправляет карточку пользователю
  и возвращает `mid`, который фронтенд передаёт в `window.WebApp.shareMaxContent({mid, chatType})`
  для пересылки карточки в выбранный чат.

## 12. Демо-данные и администрирование

- `POST /api/admin/seed` — 8 компаний (пользователи `7777001`–`7777008`, админ
  `7777001`) + 3 запроса с матчами; идемпотентно. У верифицированных компаний
  заполнены Verified Business-поля (дата регистрации, статус, источник — модельные).
- `POST /api/admin/reset` — полная очистка БД (для повторяемых прогонов).
- Верификация по ИНН — модельная (админ ставит `verified`).

## 13. Конфигурация

Единый `.env` в корне репозитория (шаблон — `backend_max/.env.example`):

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `BOT_TOKEN` | пусто | валидация initData + уведомления + bot.py |
| `DEV_MODE` | `1` без токена | вход без initData (`dev_max_user_id`) |
| `MAX_ADMIN_USER_IDS` | пусто | админы платформы (демо: `7777001`) |
| `JWT_SECRET` / `JWT_TTL_HOURS` | `change_me` / 168 | JWT |
| `DATABASE_URL` | `postgresql+psycopg2://b2b:b2b_pass@localhost:5432/b2b_match` | БД (в compose задаётся автоматически) |
| `POSTGRES_USER/PASSWORD/DB` | `b2b` / `b2b_pass` / `b2b_match` | сервис БД в compose |
| `MAX_SSL_VERIFY` | 1 | 0 — пропуск проверки SSL (Минцифры) |
| `INITDATA_MAX_AGE` | 86400 | валидность initData, сек |
| `MIN_MATCH_SCORE` / `TOP_MATCHES` | 60 / 5 | рекомендации |
| `LLM_API_URL/KEY/MODEL` | пусто | опц. LLM |
| `FILES_DIR` | `./data/files` | файлы |
| `DOMAIN` / `ACME_EMAIL` | `localhost` / `admin@example.com` | Caddy: домен и e-mail Let's Encrypt |

Порты: `8000` (API), `80/443` (Caddy), `5432` (PostgreSQL наружу для отладки).
Запуск: `docker-compose up --build` из корня. Продакшен: `DOMAIN=домен.ru`,
убрать `tls internal` из Caddyfile → автоматический Let's Encrypt; URL
мини-приложения в MAX — `https://<домен>/`.

## 14. Проверка

- Автотесты: `pytest backend_max\tests` — 25 тестов (структуризатор, матчинг
  с 9 критериями, полный сценарий, контракт, файлы сделки, шеринг, права доступа,
  seed/админка); БД — PostgreSQL (`b2b_match_test` создаётся автоматически).
- Живой сервер: `python backend_max\scripts\verify_scenarios.py` — 98 проверок,
  9 сценариев, детерминированный прогон (reset+seed), отчёт о покрытии
  всех 59 эндпоинтов.
- Postman: `backend_max/postman/B2B_Match.postman_collection.json`
  (`base_url=http://localhost:8000` или `https://localhost` с отключённой
  проверкой SSL).
- Пошаговый чек-лист вход/выход — `backend_max/VERIFY.md`.

## 15. Ограничения (MVP)

- initData-валидация по схеме HMAC («WebAppData») — перед продом сверить
  с актуальной документацией MAX Bridge; для разработки — `DEV_MODE`.
- Матчинг — правила с фиксированными весами (без ML/истории).
- 1 пользователь ↔ 1 компания; командный RBAC (сотрудники, роли) — следующий этап.
- Нет реальных интеграций с ФНС/Госуслугами и платёжной функциональности;
  данные синтетические (включая Verified Business-поля).
- Напоминания о дедлайнах запускаются вручную (в проде — cron).
- Миграции схемы — лёгкие ALTER IF NOT EXISTS на старте; для прода — Alembic.
- `shareMaxContent` — фронтенд-метод MAX Bridge; бэкенд готовит карточку и `mid`.
