# MAX_hack26 — B2B Match: подбор B2B-контрагентов в мессенджере MAX

**B2B Match** — мини-приложение и бэкенд для трека «Эффективный бизнес» (хакатон MAX).  
Сервис помогает компаниям **один раз** описать бизнес-потребность (свободным текстом или формой), структурирует запрос, находит релевантных исполнителей и поставщиков, **объясняет, почему они подходят** (Explainable Matching), и доводит взаимодействие до shortlist, переговоров и Deal Room. Исполнители получают персональную ленту заказов и откликаются из заполненного профиля.

Один аккаунт = и заказчик, и исполнитель: сегодня компания публикует запрос, завтра откликается на чужой — без отдельных ролей Customer / Contractor.

## Содержание

- [Назначение решения](#назначение-решения)
- [Ключевой пользовательский сценарий](#ключевой-пользовательский-сценарий)
- [Команда](#команда)
- [Исходный код и точки входа](#исходный-код-и-точки-входа)
- [Состав и архитектура](#состав-и-архитектура)
- [Сервисы, порты и папки](#сервисы-порты-и-папки)
- [Одна команда запуска (Docker)](#одна-команда-запуска-docker)
- [Параметры окружения и переменные](#параметры-окружения-и-переменные)
- [Используемые порты](#используемые-порты)
- [Зависимости](#зависимости)
- [Внешние сервисы и интеграции](#внешние-сервисы-и-интеграции)
- [Работа с данными](#работа-с-данными)
- [Тестовые данные (seed)](#тестовые-данные-seed)
- [Пошаговый сценарий проверки](#пошаговый-сценарий-проверки)
- [Примеры ожидаемого поведения](#примеры-ожидаемого-поведения)
- [API (кратко)](#api-кратко)
- [Тестирование](#тестирование)
- [Известные ограничения](#известные-ограничения)
- [Остановка и повторный запуск](#остановка-и-повторный-запуск)
- [Структура репозитория](#структура-репозитория)
- [README модулей](#readme-модулей)

---

## Назначение решения

B2B Match закрывает разрыв между «нужен подрядчик / поставщик» и «есть релевантный исполнитель» внутри экосистемы MAX:

- публикация бизнес-запросов (Smart Request Builder: текст → структура);
- Explainable Matching: score + критерии «почему подходит / чего не хватает»;
- отклики, сравнение предложений, shortlist, Deal Room;
- уведомления в чат бота MAX и inbox мини-приложения;
- роли платформы: Business User, администратор компании, модератор, platform admin.

Подробнее по слоям:

| Модуль | README |
|--------|--------|
| Frontend (MAX Mini App) | [`frontend/README.md`](frontend/README.md) |
| Backend (FastAPI + PostgreSQL) | [`backend_max/README.md`](backend_max/README.md) |
| Бот MAX (long polling, точка входа) | [`api/README.md`](api/README.md) |
| OpenAPI-снимок | [`docs/README.md`](docs/README.md) |

---

## Ключевой пользовательский сценарий

1. Пользователь открывает B2B Match из меню бота MAX → Frontend получает `initData` (MAX Bridge) → `POST /api/auth/max` → JWT.
2. Заполняет / обновляет профиль компании: `PUT /api/companies/me` (отрасли, услуги, компетенции, регионы, бюджет, кейсы).
3. Создаёт потребность текстом: `POST /api/ai/parse-opportunity` (предпросмотр) → `POST /api/opportunities` (+ publish) → в ответе сразу `matches` с баллами и критериями.
4. Подходящим исполнителям запрос появляется в `GET /api/me/recommendations` и приходит уведомление в MAX + `GET /api/notifications`.
5. Исполнитель откликается: `POST /api/opportunities/{id}/proposals`.
6. Заказчик сравнивает: `GET /api/opportunities/{id}/comparison`, добавляет в shortlist, открывает Deal Room (`POST /api/deals`).

Полный сценарий с curl/dev-входом — в [`backend_max/README.md`](backend_max/README.md#11-пошаговый-сценарий-проверки).  
UI-сценарии Business User — в [`frontend/README.md`](frontend/README.md).

---

## Команда

| Участник | Роль | Зона ответственности |
|----------|------|----------------------|
| Дарья Чугунова | Frontend Developer, капитан команды | Mini App (React), MAX Bridge, экраны заказчика/исполнителя/админа, тесты UI, координация |
| Backend-команда (`back_dev` / `Back_feature`) | Backend Developer | публичное API `/api`, PostgreSQL, matching, seed, уведомления Bot API, Docker |
| Бот / интеграции | Bot / API client | long polling `bot.py`, клиент `api/max_api.py`, deep-link в мини-приложение |

Актуальные ветки разработки: `front_dev` (UI), `back_dev` / `Back_feature` (API), `main` (базовая линия).

---

## Исходный код и точки входа

**Репозиторий:** [https://github.com/ResonanceTECH/MAX_hack26](https://github.com/ResonanceTECH/MAX_hack26)

| Модуль | Папка / ветка | README |
|--------|---------------|--------|
| Frontend | `frontend/`, ветка `front_dev` | [frontend/README.md](frontend/README.md) |
| Backend | `backend_max/`, ветки `back_dev`, `Back_feature` | [backend_max/README.md](backend_max/README.md) |
| Бот | `bot.py` + `api/` | [api/README.md](api/README.md) |
| Compose / Caddy | `compose.yaml`, `Caddyfile`, `Dockerfile.caddy` | этот файл |
| OpenAPI | `docs/openapi-current.json` | [docs/README.md](docs/README.md) |

Основные компоненты контейнеризированы и поднимаются через Docker Compose. Локальная разработка Frontend — Vite; Backend можно гонять отдельно против сервиса `db`.

---

## Состав и архитектура

```
┌─────────────┐     HTTPS / SPA      ┌──────────────┐     /api/*      ┌────────────────┐
│  MAX Client │ ───────────────────► │    Caddy     │ ─────────────► │ backend (8000) │
│  (Mini App) │                      │  :80 / :443  │                │   FastAPI      │
└─────────────┘                      └──────────────┘                └───────┬────────┘
       │                                    │                                 │
       │ deep-link / уведомления            │ static frontend/dist            │ SQLAlchemy
       ▼                                    ▼                                 ▼
┌─────────────┐                      ┌──────────────┐                ┌────────────────┐
│  MAX Bot    │ ◄── Bot API MAX ───► │ platform-api │                │ PostgreSQL 15  │
│  bot.py     │                      │ 2.max.ru     │                │     :5432      │
└─────────────┘                      └──────────────┘                └────────────────┘
```

**Горячий путь:** Frontend никогда не ходит в БД напрямую. Запросы идут на same-origin `/api` (Caddy → Backend) или через Vite proxy в dev. Backend считает матчи при публикации, пишет в PostgreSQL, шлёт уведомления через Bot API MAX. Бот — точка входа и канал пушей, не бизнес-логика маркетплейса.

---

## Сервисы, порты и папки

| Сервис | Папка | Порт | Назначение |
|--------|-------|------|------------|
| Frontend (prod) | `frontend/` → сборка в образ Caddy | 80 / 443 | SPA (React 19, MUI, TanStack Query) за Caddy |
| Frontend (dev) | `frontend/` | 5173 | Vite + proxy `/api` → `localhost:8000` |
| Backend | `backend_max/` | 8000 | FastAPI, префикс `/api`, Swagger `/docs` |
| PostgreSQL | сервис `db` в compose | 5432 | профили, запросы, матчи, сделки, inbox |
| Caddy | `Caddyfile`, `Dockerfile.caddy` | 80, 443 | TLS, статика SPA, reverse_proxy API |
| Бот (вне compose) | `bot.py`, `api/` | — | long polling к Bot API MAX |

Health: `GET /health`, `GET /api/health` → `{"status":"ok"}`.  
Swagger: `http://localhost:8000/docs`.

---

## Одна команда запуска (Docker)

Из **корня** репозитория:

```bash
# 1) один раз: env
cp backend_max/.env.example .env
# впишите BOT_TOKEN (и при необходимости смените JWT_SECRET / пароли БД)

# 2) весь стек
docker compose up -d --build
docker compose ps
```

Поднимаются: `db` (PostgreSQL) → `backend` → `caddy` (сборка Frontend + HTTPS).

| Что открыть | Адрес |
|-------------|--------|
| Mini App (UI) | https://localhost |
| Backend напрямую | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| Health | http://localhost:8000/health |

Локально Caddy выдаёт сертификат локального CA — в браузере «Принять риск / продолжить».

Требования к машине: Docker Engine 24+ (Compose v2), 2+ CPU / 4+ ГБ RAM, свободные порты **80, 443, 8000, 5432**.

Детали Backend: [backend_max/README.md § Запуск](backend_max/README.md#4-запуск-одной-командой).  
Детали Frontend (dev без Docker): [frontend/README.md § Запуск](frontend/README.md#запуск).

---

## Параметры окружения и переменные

Шаблоны:

- корень / compose: скопировать [`backend_max/.env.example`](backend_max/.env.example) → `.env` в корне;
- Frontend (dev): `frontend/.env` — см. [frontend/README.md](frontend/README.md#переменные-окружения).

### Корневой `.env` / Backend

| Переменная | По умолчанию | Назначение |
|------------|--------------|------------|
| `BOT_TOKEN` | пусто | токен бота MAX: initData + уведомления |
| `JWT_SECRET` | `change_me` | подпись JWT (**сменить в проде**) |
| `JWT_TTL_HOURS` | `168` | TTL токена |
| `DATABASE_URL` | `postgresql+psycopg2://b2b:b2b_pass@localhost:5432/b2b_match` | SQLAlchemy; в compose переопределяется на хост `db` |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `b2b` / `b2b_pass` / `b2b_match` | сервис `db` |
| `DOMAIN` | `localhost` | хост Caddy / TLS |
| `ACME_EMAIL` | `admin@example.com` | Let's Encrypt |
| `MAX_SSL_VERIFY` | `0` | `0` — не проверять SSL (сертификат Минцифры); после CA → `1` |
| `DEV_MODE` | `1` без токена | `1` — вход с `dev_max_user_id`; в проде **`0`** |
| `INITDATA_MAX_AGE` | `86400` | макс. возраст initData, сек |
| `MIN_MATCH_SCORE` | `60` | порог матча, % |
| `TOP_MATCHES` | `5` | число рекомендаций в ответах |
| `MAX_ADMIN_USER_IDS` | `7777001` | MAX user id админов платформы |
| `LLM_API_URL` / `LLM_API_KEY` / `LLM_MODEL` | пусто | опц. LLM для Smart Request Builder |
| `FILES_DIR` | `./data/files` | загруженные файлы (volume `./data`) |
| `VITE_USE_MOCK_API` | `false` (в образе Caddy) | build-arg: mock vs real API |
| `VITE_API_BASE_URL` | `/api` (в образе) | base URL API во Frontend-сборке |

### Frontend (dev)

| Переменная | По умолчанию | Назначение |
|------------|--------------|------------|
| `VITE_API_BASE_URL` | `/api` (см. `src/shared/config/env.ts`) | base URL Axios; empty/`/api` + Vite proxy |
| `VITE_USE_MOCK_API` | `false` если не `'true'` | `true` — in-memory mocks |
| `VITE_PROXY_TARGET` | `http://localhost:8000` | цель Vite proxy |

Полный список Backend: [backend_max/README.md § Env](backend_max/README.md#5-параметры-и-переменные-окружения).

---

## Используемые порты

| Порт | Сервис |
|------|--------|
| 443 / 80 | Caddy (HTTPS / redirect) |
| 8000 | Backend FastAPI |
| 5432 | PostgreSQL |
| 5173 | Vite (только локальная разработка Frontend) |

---

## Зависимости

| Компонент | Стек / файл |
|-----------|-------------|
| Backend runtime | Python 3.11, FastAPI, Uvicorn, SQLAlchemy 2, psycopg2, Pydantic 2, PyJWT, requests — [`backend_max/requirements.txt`](backend_max/requirements.txt) |
| Backend tests | pytest, httpx — [`backend_max/requirements-dev.txt`](backend_max/requirements-dev.txt) |
| Frontend | Node.js 20+, React 19, Vite 8, MUI 6, TanStack Query 5, Zustand, RHF+Zod, Axios — [`frontend/package.json`](frontend/package.json) |
| Frontend tests | Vitest, Testing Library, Playwright, axe — devDependencies того же `package.json` |
| Бот | Python 3, `requests`, `python-dotenv` — корневой [`requirements.txt`](requirements.txt) |
| Инфра | Docker Compose, PostgreSQL 15 Alpine, Caddy 2.8, Node 22 (stage сборки SPA) |

---

## Внешние сервисы и интеграции

| Интеграция | Зачем | Где в коде |
|------------|-------|------------|
| **Bot API MAX** `https://platform-api2.max.ru` | уведомления `POST /messages`, long polling updates, deep-link | `backend_max/app/notifications.py`, `api/max_api.py`, `bot.py` |
| **MAX Bridge** (WebApp `initData`) | авторизация Mini App (HMAC) | `backend_max/app/security.py`, `frontend/src/shared/lib/max/` |
| **PostgreSQL 15** | основное хранилище | compose `db`, `backend_max/app/db.py` |
| **Caddy** | TLS + статика + proxy | `Caddyfile`, `Dockerfile.caddy` |
| **LLM** (опционально, OpenAI-compatible) | улучшение Smart Request Builder | `backend_max/app/structurizer.py` |
| ФНС / Госуслуги / платежи | **нет в MVP** | верификация модельная (админ `verify`) |

Без `BOT_TOKEN` уведомления пишутся в `notification_log` / inbox, наружу не уходят.

---

## Работа с данными

- **СУБД:** PostgreSQL, БД `b2b_match`, volume `pgdata`.
- **Схема:** создаётся при старте Backend (`init_db`), ретраи подключения к `db`.
- **Домен:** `User` → `Company` (+ members, cases, services, documents) → `Request` (opportunity) → `RequestMatch` → `Proposal` → `Deal`; плюс favorites, notifications, moderation/admin сущности.
- **Списки** (отрасли, компетенции, критерии матча и т.д.) — JSON-колонки.
- **Матчи** пересчитываются при publish и сохраняются с объяснением критериев.
- **Файлы** — диск `FILES_DIR` (в Docker том `./data`).
- Frontend в production ходит только в HTTP API; mocks — режим `VITE_USE_MOCK_API=true` (см. [frontend](frontend/README.md)).

---

## Тестовые данные (seed)

`POST /api/admin/seed` (нужны права admin / `DEV_MODE` + seed-админ):

- 8 компаний (МебельПро, DigitalLab, WebForge, …), MAX user id `7777001`–`7777008`;
- админ демо: `7777001` (Анна Смирнова / МебельПро);
- опубликованные запросы с предвычисленными матчами;
- доп. сущности Wave A — `seed_extras`.

Вход в dev:

```bash
curl -s -X POST http://localhost:8000/api/auth/max \
  -H 'Content-Type: application/json' \
  -d '{"dev_max_user_id": 7777001}'
```

Сброс: `POST /api/admin/reset` (осторожно: чистит данные).  
Подробности: [backend_max/README.md § Тестовые данные](backend_max/README.md#10-тестовые-данные-seed).

---

## Пошаговый сценарий проверки

### A. Docker-стенд

```bash
git clone https://github.com/ResonanceTECH/MAX_hack26.git
cd MAX_hack26
git checkout front_dev   # или нужная ветка со стеком
cp backend_max/.env.example .env
# BOT_TOKEN опционален при DEV_MODE=1

docker compose up -d --build
curl -s http://localhost:8000/health
# → {"status":"ok"}
```

1. Открыть https://localhost (UI) и http://localhost:8000/docs (Swagger).
2. Auth + seed:

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/max \
  -H 'Content-Type: application/json' \
  -d '{"dev_max_user_id": 7777001}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

curl -s -X POST http://localhost:8000/api/admin/seed \
  -H "Authorization: Bearer $TOKEN"
```

3. Лента исполнителя (`7777002`):

```bash
TOKEN2=$(curl -s -X POST http://localhost:8000/api/auth/max \
  -H 'Content-Type: application/json' \
  -d '{"dev_max_user_id": 7777002}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

curl -s http://localhost:8000/api/me/recommendations \
  -H "Authorization: Bearer $TOKEN2"
```

4. Parse + publish + proposal + comparison + deal — как в [backend §11](backend_max/README.md#11-пошаговый-сценарий-проверки).
5. Автопрогон сценариев: `python backend_max/scripts/verify_scenarios.py`.

### B. Frontend отдельно (dev)

См. [frontend/README.md](frontend/README.md): `npm ci && npm run dev`, при real API — сначала `docker compose up -d db backend` + seed.

### C. Бот

См. [api/README.md](api/README.md): `python bot.py` с `BOT_TOKEN` в `.env`.

---

## Примеры ожидаемого поведения

| Действие | Ожидание |
|----------|----------|
| `GET /health` | `200` `{"status":"ok"}` |
| `POST /api/auth/max` + `dev_max_user_id` при `DEV_MODE=1` | `200`, JWT |
| `POST /api/admin/seed` от админа | компании/запросы/матчи созданы идемпотентно |
| Publish opportunity | статус `published`, в ответе `matches[]` с `score` и критериями |
| `GET /api/me/recommendations` у релевантного исполнителя | запросы выше `MIN_MATCH_SCORE` |
| Proposal на чужой запрос | `201`, уведомление у заказчика |
| Proposal на свой запрос | отказ (бизнес-правило) |
| Коэффициенты матча | веса: category 25, requirements 20, budget 15, … (сумма 100) — [`matching.py`](backend_max/app/matching.py) |
| UI Contractor Flow (E2E) | PASS на mock/real по аудиту Frontend |
| UI без Backend при `VITE_USE_MOCK_API=true` | каталоги и флоу на in-memory данных |

Эталонные проверки API: `pytest backend_max/tests`, `verify_scenarios.py`.  
Эталон UI: `cd frontend && npm test && npm run test:e2e`.

---

## API (кратко)

Все бизнес-ручки под префиксом **`/api`**. Интерактивно: `/docs`, контракт-снимок: [`docs/openapi-current.json`](docs/openapi-current.json).

| Домен | Примеры |
|-------|---------|
| Auth / me | `POST /api/auth/max`, `GET /api/me` |
| Companies | `GET/PUT /api/companies/me`, каталог `GET /api/companies` |
| Opportunities | CRUD, publish/close/reopen, matches, comparison, dealroom, shortlist, invites |
| Proposals | create, mine, status, shortlist, view |
| Feed | `GET /api/me/recommendations`, `POST /api/matches/{id}/feedback` |
| Deals | `POST/GET /api/deals` |
| Notifications | `GET /api/notifications`, read / read-all |
| AI | `POST /api/ai/parse-opportunity` |
| Files / Share | `POST /api/files`, `POST /api/share/...` |
| Favorites | toggle / list / check |
| Moderation / Admin | `/api/moderation/*`, `/api/admin/*` |

Полная таблица и сценарии — [backend_max/README.md](backend_max/README.md#21-контракт-api-соответствует-тз-фронтенда).

---

## Тестирование

| Компонент | Набор | Запуск |
|-----------|-------|--------|
| Backend unit/API | `backend_max/tests/` | `docker compose up -d db && pytest backend_max/tests` |
| Backend E2E-сценарии | `scripts/verify_scenarios.py` | против живого `:8000` |
| Frontend unit | Vitest | `cd frontend && npm test` |
| Frontend E2E | Playwright | `cd frontend && npm run test:e2e` |
| Postman | `backend_max/postman/` | импорт коллекции |

Детали и статусы аудита Business User — [frontend/README.md § Тесты](frontend/README.md#тесты).

---

## Известные ограничения

- Матчинг — **правила с весами**, без ML-ранжирования и обучения на истории.
- Верификация бизнеса — **модельная** (нет ФНС/Госуслуг); verify делает админ.
- Один пользователь ↔ одна компания как базовый сценарий; командный RBAC есть в API workspace, продуктовая полнота — по мере фронта.
- Напоминания о дедлайнах — ручной `POST /api/admin/notify/deadlines` (в проде — cron).
- Уведомления MAX — best-effort; ошибки в `notification_log`.
- `shareMaxContent` вызывает Frontend (MAX Bridge); Backend отдаёт `mid` / link.
- Валидация `initData` по схеме HMAC «WebAppData» — сверить с актуальной докой MAX перед продом.
- Часть admin/moderation экранов Frontend может ещё опираться на mock при неполном real-слое — см. audit во Frontend README.
- Бот **не** входит в `docker compose` — запускается отдельно при необходимости пушей/меню.

---

## Остановка и повторный запуск

```bash
docker compose down              # стоп; volume pgdata сохраняется
docker compose up -d --build     # снова поднять
docker compose logs --tail=200 backend caddy
docker compose down -v           # полный сброс БД и томов Caddy
```

Бот: `Ctrl+C` в процессе `python bot.py`, повторный запуск той же командой.

Frontend dev: `Ctrl+C` в `npm run dev`.

---

## Структура репозитория

```
MAX_hack26/
├── README.md                 # этот файл
├── compose.yaml              # db + backend + caddy
├── Caddyfile / Dockerfile.caddy
├── .env / backend_max/.env.example
├── bot.py                    # long-polling бот
├── api/                      # клиент Bot API MAX → api/README.md
├── backend_max/               # FastAPI → backend_max/README.md
├── frontend/                 # React Mini App → frontend/README.md
├── docs/                     # OpenAPI snapshot → docs/README.md
├── data/                     # файлы загрузок (volume)
└── requirements.txt          # зависимости бота
```

---

## README модулей

| Раздел | Ссылка |
|--------|--------|
| Корень (этот документ) | [README.md](README.md) |
| Frontend | [frontend/README.md](frontend/README.md) |
| Backend | [backend_max/README.md](backend_max/README.md) |
| Бот / MAX API client | [api/README.md](api/README.md) |
| Документация API (OpenAPI) | [docs/README.md](docs/README.md) |

---

*Трек: «Эффективный бизнес» · платформа MAX · репозиторий ResonanceTECH/MAX_hack26*
