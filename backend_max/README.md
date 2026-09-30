# B2B Match — бэкенд мини-приложения в MAX

> Часть решения **MAX_hack26**.  
> Корень (Docker, порты, стек): [`../README.md`](../README.md) ·  
> Frontend: [`../frontend/README.md`](../frontend/README.md) ·  
> Бот: [`../api/README.md`](../api/README.md) ·  
> OpenAPI-снимок: [`../docs/README.md`](../docs/README.md).

Бэкенд мини-приложения **B2B Match** для мессенджера MAX (трек «Эффективный бизнес»,
хакатон MAX_hack26). FastAPI + PostgreSQL, полностью контейнеризован. Все бизнес-ручки
под префиксом **`/api`** (см. `app/main.py`).

## Содержание

1. [Назначение решения](#1-назначение-решения)
2. [Основной пользовательский сценарий](#2-основной-пользовательский-сценарий-mvp)
3. [Состав и архитектура](#3-состав-и-архитектура)
4. [Одна команда запуска (Docker)](#4-запуск-одной-командой)
5. [Параметры и переменные окружения](#5-параметры-и-переменные-окружения)
6. [Порты](#6-порты)
7. [Зависимости](#7-зависимости)
8. [Внешние сервисы и интеграции](#8-внешние-сервисы-и-интеграции)
9. [Работа с данными](#9-работа-с-данными)
10. [Тестовые данные](#10-тестовые-данные-seed)
11. [Пошаговый сценарий проверки](#11-пошаговый-сценарий-проверки)
12. [Известные ограничения](#12-известные-ограничения)
13. [Остановка и повторный запуск](#13-остановка-и-повторный-запуск)
14. [Тесты](#14-тесты)

---

## 1. Назначение решения

B2B Match — двусторонний маркетплейс подбора B2B-контрагентов внутри MAX.
Компания описывает бизнес-потребность **один раз** (свободным текстом или формой),
платформа структурирует запрос, находит релевантных исполнителей/поставщиков,
**объясняет, почему они подходят** (Explainable Matching), и доводит взаимодействие
до shortlist и переговоров (Deal Room). Исполнители, в свою очередь, получают
персональную ленту релевантных заказов и откликаются, используя заполненный профиль.

Аккаунт не делится на «заказчика» и «исполнителя»: одна компания может сегодня
публиковать запрос, а завтра откликаться на чужой.

Папка `backend_max/` содержит только **бэкенд**. Фронтенд мини-приложения
(React + MAX Bridge) — [`../frontend/`](../frontend/README.md), статику отдаёт Caddy
и ходит на same-origin `/api`. Бот MAX — [`../api/README.md`](../api/README.md) + `bot.py`:
точка входа в мини-приложение; **уведомления** отправляет сам бэкенд через Bot API MAX
(`POST https://platform-api2.max.ru/messages`).

## 2. Основной пользовательский сценарий (MVP)

1. Пользователь открывает B2B Match в MAX (кнопка меню бота) → фронтенд получает
   `initData` от MAX Bridge и авторизуется: `POST /api/auth/max`.
2. Создаёт профиль компании: `PUT /api/companies/me` (отрасли, услуги, компетенции,
   регионы, ценовой диапазон, сроки, кейсы, сертификаты).
3. Создаёт потребность свободным текстом: `POST /api/opportunities` (Smart Request Builder
   сам выделяет категорию, бюджет, срок, регион, требования; предпросмотр —
   `POST /api/ai/parse-opportunity`).
4. При публикации система **сразу** вычисляет матчи (в ответе `matches` с баллами
   и критериями), а подходящим исполнителям запрос появляется в персональной ленте
   `GET /api/me/recommendations` + приходит MAX-уведомление (inbox — `GET /api/notifications`).
5. Исполнитель отправляет отклик: `POST /api/opportunities/{id}/proposals`.
   Заказчик получает MAX-уведомление «поступило предложение».
6. Заказчик сравнивает предложения: `GET /api/opportunities/{id}/comparison`
   (Comparison Board), добавляет в shortlist: `POST /api/opportunities/{id}/shortlist`
   (или `POST /api/proposals/{id}/shortlist`).
7. Открывает Deal Room: `GET /api/opportunities/{id}/dealroom` — единый контекст
   (запрос + предложения + shortlist + следующее действие), фиксирует переход
   в переговоры: `POST /api/deals` и выбирает исполнителя (`POST /api/proposals/{id}/status`,
   статус `chosen`). Исполнитель получает уведомление.

## 2.1. Контракт API (соответствует ТЗ фронтенда)

Все пути ниже относительно префикса **`/api`** (полный пример: `POST /api/auth/max`).  
Живой Swagger: `http://localhost:8000/docs`. Снимок: [`../docs/openapi-current.json`](../docs/openapi-current.json).

| Домен | Эндпоинт |
|---|---|
| Auth | `POST /api/auth/max` |
| Current user | `GET /api/me` |
| Company | `GET /api/companies/{id}`, `PATCH /api/companies/{id}`, `PUT /api/companies/me`, `GET /api/companies/me` |
| Catalog | `GET /api/companies` |
| Workspace | `/api/companies/me/members\|cases\|services\|documents\|activity\|settings\|verification` |
| Opportunities | `GET/POST /api/opportunities`, `GET /api/opportunities/{id}`, `PATCH …`, `GET /api/opportunities/mine` |
| Publish | `POST /api/opportunities/{id}/publish` (+ `close`, `reopen`) |
| Matches | `GET /api/opportunities/{id}/matches` |
| Personal feed | `GET /api/me/recommendations` |
| Match feedback | `POST /api/matches/{id}/feedback` |
| Proposal | `POST /api/opportunities/{id}/proposals`, `GET /api/proposals/{id}`, `GET /api/proposals/mine` |
| Proposals list | `GET /api/opportunities/{id}/proposals` |
| Shortlist | `POST /api/opportunities/{id}/shortlist`, `POST /api/proposals/{id}/shortlist` |
| Comparison / Deal Room | `GET /api/opportunities/{id}/comparison`, `…/dealroom` |
| Deal | `POST/GET /api/deals`, `GET /api/deals/{id}` |
| Notifications | `GET /api/notifications`, `POST …/read`, `POST …/read-all` |
| Favorites | `GET /api/favorites`, `POST /api/favorites/toggle`, `GET /api/favorites/check` |
| AI parsing | `POST /api/ai/parse-opportunity` |
| Upload | `POST /api/files` (≤10 МБ), `GET /api/files/{id}` |
| Share | `POST /api/share/company\|opportunity/{id}`, `GET …/link` |
| Dictionaries | `GET /api/dictionaries`, `/categories`, `/regions` |
| Moderation | `/api/moderation/*`, `/api/escalations/*`, `/api/reports/*` |
| Admin | `/api/admin/*` — seed, reset, stats, verify, notify/deadlines, platform admin |

## 3. Состав и архитектура

```
MAX_hack26/                     # корень репозитория
├── compose.yaml                # все компоненты: db (PostgreSQL), backend, caddy
├── Caddyfile                   # HTTPS-вход: фронтенд + прокси API
├── frontend/                   # статика мини-приложения (заглушка; сюда кладётся React-сборка)
├── .env                        # единый файл конфигурации (шаблон: backend_max/.env.example)
├── bot.py + api/               # бот: точка входа в мини-приложение (long polling)
└── backend_max/                # бэкенд
    ├── app/
    │   ├── main.py           # FastAPI-приложение, lifespan (ретраи БД), CORS
    │   ├── config.py         # настройки из переменных окружения
    │   ├── db.py             # SQLAlchemy engine/session (PostgreSQL), init_db
    │   ├── models.py         # User, Company, Request, RequestMatch, Proposal, Deal, UploadedFile, NotificationLog
    │   ├── schemas.py        # Pydantic-схемы (контракт API)
    │   ├── security.py       # валидация initData MAX (HMAC) + JWT
    │   ├── deps.py           # get_current_user, require_admin
    │   ├── services.py       # общая логика: матчи, сериализация, права доступа
    │   ├── matching.py       # Explainable Matching (взвешенные критерии)
    │   ├── structurizer.py   # Smart Request Builder (правила + опц. LLM)
    │   ├── notifications.py  # уведомления через Bot API MAX + inbox
    │   ├── seed.py           # демо-данные
    │   └── routers/
    │       ├── auth.py           # /auth/max, /me
    │       ├── companies.py      # каталог, профиль, PATCH
    │       ├── opportunities.py  # потребности, publish, матчи, сравнение, dealroom
    │       ├── proposals.py      # отклики, shortlist, статусы
    │       ├── deals.py          # Deal Room (сделки/переговоры)
    │       ├── feed.py           # /me/recommendations, /matches/{id}/feedback, dashboard
    │       ├── files.py          # загрузка/скачивание файлов
    │       ├── inbox.py          # /notifications
    │       ├── dictionaries.py   # справочники категорий/регионов/пресетов
    │       └── admin.py          # модерация, верификация, статистика, напоминания
    ├── scripts/              # verify_scenarios.py — проверка всех сценариев и эндпоинтов
    ├── tests/                # pytest: 20 тестов
    ├── postman/              # коллекция Postman
    ├── Dockerfile
    ├── .dockerignore
    ├── .env.example
    ├── README.md / SPEC.md / VERIFY.md
    └── requirements.txt / requirements-dev.txt
```

Домен: `User` (представитель в MAX) → `Company` (профиль; роли заказчик/исполнитель —
режимы работы, а не классы аккаунтов) → `Request` (Business Opportunity) → `RequestMatch`
(предвычисленные рекомендации, двусторонние) → `Proposal` (стандартизированный отклик)
→ `Deal` (зафиксированный переход в переговоры). Данные: PostgreSQL (JSON-колонки
для списков), файлы — на диске (каталог `FILES_DIR`).

### Роли

| Роль | Реализация |
|---|---|
| Заказчик | режим работы любой компании: публикация потребностей, предложения, shortlist, deal |
| Исполнитель | тот же аккаунт: персональная лента, отклики, статусы, сделки |
| Администратор платформы | `is_admin` (+ `MAX_ADMIN_USER_IDS`): `/api/admin/*` — модерация, верификация, статистика |
| Администратор компании | владелец профиля (PUT/PATCH `/companies`); командный RBAC — следующий этап (заложен в домен) |

## 4. Запуск (одной командой)

Одна команда поднимает **все локальные компоненты** решения (БД + Backend + Caddy/Frontend):

```bash
# из корня репозитория MAX_hack26 (compose.yaml и .env)
cp backend_max/.env.example .env   # один раз; впишите BOT_TOKEN
docker compose up -d --build
docker compose ps
```

Компоненты: `db` (PostgreSQL), `backend` (FastAPI), `caddy` (HTTPS-вход + SPA).  
Полный чеклист заказчика: [`../README.md#одна-команда-запуска-docker`](../README.md#одна-команда-запуска-docker).

- Бэкенд напрямую: `http://localhost:8000` (`/docs`, `/health`, `/api/health`)
- Через Caddy: `https://localhost` — Frontend, `/api*` проксируется на backend
  (локальный CA Caddy; в браузере — «Принять риск»)
- Продакшен: `DOMAIN=ваш-домен.ru` в `.env` → Let's Encrypt (нужны открытые 80/443).
  URL мини-приложения для MAX: `https://<домен>/`

Запуск без полного Docker (только БД в compose, API на хосте):

```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .\.venv\Scripts\Activate.ps1
pip install -r backend_max/requirements.txt -r backend_max/requirements-dev.txt
docker compose up -d db
export DATABASE_URL="postgresql+psycopg2://b2b:b2b_pass@localhost:5432/b2b_match"
export DEV_MODE=1
python -m uvicorn backend_max.app.main:app --port 8000
```

## 5. Параметры и переменные окружения

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `BOT_TOKEN` | пусто | токен бота MAX: валидация initData + уведомления |
| `JWT_SECRET` | `change_me` | подпись JWT бэкенда |
| `JWT_TTL_HOURS` | `168` | время жизни токена |
| `DATABASE_URL` | `postgresql+psycopg2://b2b:b2b_pass@localhost:5432/b2b_match` | строка подключения SQLAlchemy (в compose задаётся автоматически) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `b2b` / `b2b_pass` / `b2b_match` | параметры сервиса БД в compose |
| `MAX_SSL_VERIFY` | `1` | `0` — не проверять SSL-сертификат (Минцифры) |
| `DEV_MODE` | `1`, если нет `BOT_TOKEN` | `1` — вход без initData (`dev_max_user_id`) |
| `INITDATA_MAX_AGE` | `86400` | допустимый возраст initData, сек |
| `MIN_MATCH_SCORE` | `60` | порог релевантности матча, % |
| `TOP_MATCHES` | `5` | число рекомендаций в ответах |
| `MAX_ADMIN_USER_IDS` | пусто | id пользователей MAX с правами админа платформы |
| `LLM_API_URL` / `LLM_API_KEY` / `LLM_MODEL` | пусто | опц. LLM для Smart Request Builder (OpenAI-совместимый API) |
| `FILES_DIR` | `./data/files` | каталог хранения загруженных файлов |
| `DOMAIN` | `localhost` | домен для Caddy (HTTPS-вход мини-приложения) |
| `ACME_EMAIL` | `admin@example.com` | e-mail для Let's Encrypt (продакшен) |

## 6. Порты

- `8000` — HTTP API бэкенда (напрямую).
- `80` / `443` — Caddy: HTTP→HTTPS редирект и HTTPS-вход (фронтенд + API).
- `5432` — PostgreSQL (проброс наружу для отладки; внутри compose доступен только сервису backend).

## 7. Зависимости

См. `requirements.txt` (fastapi, uvicorn, sqlalchemy, psycopg2-binary, pydantic,
pyjwt, requests, python-dotenv, eval-type-backport для Python 3.9). Тестовые —
`requirements-dev.txt` (pytest, httpx). Версии зафиксированы диапазонами.

## 8. Внешние сервисы и интеграции

- **Bot API MAX** (`https://platform-api2.max.ru`): отправка уведомлений
  (`POST /messages`) и валидация `initData` мини-приложения (MAX Bridge).
  Без `BOT_TOKEN` уведомления складываются только в журнал `NotificationLog`
  (inbox пользователя — `GET /notifications`, журнал админа — `GET /api/admin/notifications`).
- **PostgreSQL 15** — основное хранилище (сервис `db` в compose).
- **Caddy** — HTTPS-терминация и раздача фронтенда мини-приложения
  (`frontend/`); MAX требует, чтобы мини-приложение работало по HTTPS.
- **LLM** (опционально): структуризация свободного текста. Если не настроен —
  работает правило-структуризатор на ключевых словах. **Модельная интеграция**,
  реального доступа к гос. реестрам (ФНС и т.п.) в MVP нет — см. «Тестовые данные».

## 9. Работа с данными

Все данные хранятся в PostgreSQL (БД `b2b_match`, volume `pgdata` в compose;
таблицы создаются автоматически при старте, при недоступности БД бэкенд делает
ретраи подключения). Списочные поля (отрасли, услуги, компетенции, регионы,
кейсы, сертификаты, критерии матча) — JSON-колонки. Матчи вычисляются в момент
публикации запроса и сохраняются в `request_matches` (объяснение критериев
хранится вместе с баллом). Журнал уведомлений — таблица `notification_log`.
Файлы — каталог `FILES_DIR` (volume `./data`).

## 10. Тестовые данные (seed)

`POST /api/admin/seed` (права админа) загружает идемпотентно:

- 8 компаний: МебельПро, DigitalLab, WebForge, ЛогистикГрупп, МаркетЛаб,
  СтройКомплект, ФинСервис, ПечатьЦентр (id пользователей `7777001`–`7777008`,
  админ — `7777001`; в dev-режиме вход под ними через `dev_max_user_id`);
- 3 опубликованных запроса с предвычисленными матчами.

Все данные синтетические. Верификация по ИНН — **модельная** (поле `inn`
заполняется вручную, верификацию проводит админ `POST /api/admin/companies/{id}/verify`).

## 11. Пошаговый сценарий проверки

### Примеры ожидаемого поведения (кратко)

| Шаг | Запрос | Ожидание |
|-----|--------|----------|
| Health | `GET /health` | `200` `{"status":"ok"}` |
| Dev-auth | `POST /api/auth/max` `{"dev_max_user_id":7777001}` | JWT |
| Seed | `POST /api/admin/seed` | идемпотентно компании + запросы + матчи |
| Recommendations | `GET /api/me/recommendations` под `7777002` | score ≥ `MIN_MATCH_SCORE`, критерии |
| Parse | `POST /api/ai/parse-opportunity` | категория, бюджет, срок, регион |
| Publish | `POST /api/opportunities` | `published` + `matches[]` |
| Proposal → Deal | proposals → comparison → shortlist → deals | статусы и inbox |

### По шагам

1. `docker compose up -d --build` → `GET /health` → `{"status":"ok"}`.
2. Вход админа и seed (dev-режим):
   `POST /api/auth/max` с `{"dev_max_user_id": 7777001}` → токен;
   `POST /api/admin/seed`.
3. Лента исполнителя: вход `dev_max_user_id: 7777002` (DigitalLab) →
   `GET /api/me/recommendations` → релевантный запрос со score и критериями «почему подходит».
4. Smart Request Builder: `POST /api/ai/parse-opportunity` с `description:
   "Нужна разработка интернет-магазина. React, 1С, бюджет 400-600 тысяч, срок два месяца, Москва"` →
   категория IT, бюджетный диапазон, срок, регион `Москва`.
5. `POST /api/opportunities` с тем же описанием → статус `published`, в ответе
   `matches`. Draft: `publish: false` → `PATCH /api/opportunities/{id}` →
   `POST /api/opportunities/{id}/publish`.
6. Отклик: от другого исполнителя `POST /api/opportunities/{id}/proposals` →
   у заказчика `GET /api/notifications`.
7. `GET /api/opportunities/{id}/comparison` → строки по цене/сроку/кейсам/матчу.
8. `POST /api/opportunities/{id}/shortlist` (`{"proposal_id": ...}`), затем
   `POST /api/deals`. Статус исполнителя: `POST /api/proposals/{id}/status`
   `{"status": "chosen"}` → `GET /api/opportunities/{id}/dealroom`.
9. Feedback: `POST /api/matches/{match_id}/feedback` `{"positive": true}`.
10. Файлы: `POST /api/files` (multipart) → `GET /api/files/{id}`.

Автотесты: `pytest backend_max/tests`.  
Postman: `backend_max/postman/`.  
Скрипт живого стенда (сценарии + покрытие эндпоинтов):

```bash
python backend_max/scripts/verify_scenarios.py
```

UI-проверка того же seed: [`../frontend/README.md`](../frontend/README.md#13-пошаговый-сценарий-проверки).

## 12. Известные ограничения

- Валидация `initData` реализована по схеме HMAC-SHA256 («WebAppData»), совместимой
  с форматом MAX Bridge; перед продакшеном сверьте алгоритм с актуальной документацией
  MAX. Для разработки предусмотрен `DEV_MODE`.
- Матчинг — на правилах с весами; нет ML-ранжирования и анализа истории.
- Один пользователь ↔ одна компания (командная работа/RBAC — следующий этап).
- Нет реальных интеграций с ФНС/Госуслугами и платёжной функциональности;
  данные синтетические (включая Verified Business: дата регистрации/статус/источник — модельные).
- Напоминания о дедлайнах запускаются вручную: `POST /api/admin/notify/deadlines`
  (в проде — cron).
- Уведомления отправляются best-effort; при ошибке фиксируются в `notification_log`.
- Шеринг `shareMaxContent` — фронтенд-метод MAX Bridge; бэкенд готовит карточку
  и возвращает `mid` (`POST /share/...`), сам вызов делает мини-приложение.

## 13. Остановка и повторный запуск

```bash
docker compose down              # стоп; volume pgdata сохраняется
docker compose up -d --build     # повторный запуск
docker compose logs --tail=200 backend
docker compose down -v           # полная очистка БД + томов Caddy
```

Файлы загрузок на хосте: каталог `./data` (не обязательно в volume compose — смотрите `FILES_DIR`).

## 14. Тесты

Тесты работают с PostgreSQL (тестовая БД `b2b_match_test` создаётся автоматически),
поэтому сначала поднимите БД:

```bash
docker compose up -d db
pytest backend_max/tests
# структуризатор, матчинг, MVP-flow, RBAC, фильтры, admin/seed, …
```

Связанные проверки UI: [`../frontend/README.md#тесты`](../frontend/README.md#тесты).  
Общий чеклист стенда: [`../README.md#тестирование`](../README.md#тестирование).

---

## Связанные README

| Модуль | Ссылка |
|--------|--------|
| Корень решения | [../README.md](../README.md) |
| Frontend | [../frontend/README.md](../frontend/README.md) |
| Бот / MaxAPI | [../api/README.md](../api/README.md) |
| OpenAPI | [../docs/README.md](../docs/README.md) |
