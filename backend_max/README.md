# B2B Match — бэкенд мини-приложения в MAX

Бэкенд мини-приложения **B2B Match** для мессенджера MAX (трек «Эффективный бизнес»,
хакатон MAX_hack26). FastAPI + PostgreSQL, полностью контейнеризован.

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
(React + MAX Bridge + MAX UI) разрабатывается отдельно, статику он кладёт
в `frontend/` (раздаётся Caddy) и обращается к этому API. Бот MAX — точка входа
в мини-приложение и канал уведомлений; уведомления отправляет сам бэкенд
через Bot API MAX (`POST https://platform-api2.max.ru/messages`).

## 2. Основной пользовательский сценарий (MVP)

1. Пользователь открывает B2B Match в MAX (кнопка меню бота) → фронтенд получает
   `initData` от MAX Bridge и авторизуется: `POST /auth/max`.
2. Создаёт профиль компании: `PUT /companies/me` (отрасли, услуги, компетенции,
   регионы, ценовой диапазон, сроки, кейсы, сертификаты).
3. Создаёт потребность свободным текстом: `POST /opportunities` (Smart Request Builder
   сам выделяет категорию, бюджет, срок, регион, требования; предпросмотр —
   `POST /ai/parse-opportunity`).
4. При публикации система **сразу** вычисляет матчи (в ответе `matches` с баллами
   и критериями), а подходящим исполнителям запрос появляется в персональной ленте
   `GET /me/recommendations` + приходит MAX-уведомление (inbox — `GET /notifications`).
5. Исполнитель отправляет отклик: `POST /opportunities/{id}/proposals`.
   Заказчик получает MAX-уведомление «поступило предложение».
6. Заказчик сравнивает предложения: `GET /opportunities/{id}/comparison`
   (Comparison Board), добавляет в shortlist: `POST /opportunities/{id}/shortlist`
   (или `POST /proposals/{id}/shortlist`).
7. Открывает Deal Room: `GET /opportunities/{id}/dealroom` — единый контекст
   (запрос + предложения + shortlist + следующее действие), фиксирует переход
   в переговоры: `POST /deals` и выбирает исполнителя (`POST /proposals/{id}/status`,
   статус `chosen`). Исполнитель получает уведомление.

## 2.1. Контракт API (соответствует ТЗ фронтенда)

| Домен | Эндпоинт |
|---|---|
| Auth | `POST /auth/max` |
| Current user | `GET /me` |
| Company | `GET /companies/{id}`, `PATCH /companies/{id}`, `PUT /companies/me`, `GET /companies/me` |
| Catalog | `GET /companies` |
| Opportunities | `GET /opportunities`, `POST /opportunities`, `GET /opportunities/{id}`, `PATCH /opportunities/{id}`, `GET /opportunities/mine` |
| Publish | `POST /opportunities/{id}/publish` (+ `close`, `reopen`) |
| Matches | `GET /opportunities/{id}/matches` |
| Personal feed | `GET /me/recommendations` |
| Match feedback | `POST /matches/{id}/feedback` |
| Proposal | `POST /opportunities/{id}/proposals`, `GET /proposals/{id}`, `GET /proposals/mine` |
| Proposals | `GET /opportunities/{id}/proposals` |
| Shortlist | `POST /opportunities/{id}/shortlist` (по `company_id` или `proposal_id`), `POST /proposals/{id}/shortlist` |
| Comparison | `GET /opportunities/{id}/comparison` |
| Deal | `POST /deals`, `GET /deals`, `GET /deals/{id}` |
| Notifications | `GET /notifications`, `POST /notifications/{id}/read`, `POST /notifications/read-all` |
| AI parsing | `POST /ai/parse-opportunity` |
| Upload | `POST /files` (≤10 МБ, опц. привязка к `opportunity_id`/`deal_id` — файлы сделки), `GET /files/{id}` |
| Share | `POST /share/company/{id}`, `POST /share/opportunity/{id}` (карточка через бота → mid для `shareMaxContent`), `GET /share/.../link` (диплинк `:share`) |
| Dictionaries | `GET /dictionaries`, `/dictionaries/categories`, `/dictionaries/regions` |
| Admin (внутреннее) | `/api/admin/*` — seed, reset, статистика, модерация, верификация, напоминания |

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

```powershell
# из корня репозитория MAX_hack26 (там лежат compose.yaml и .env)
# один раз: если .env ещё нет — copy backend_max\.env.example .env и впишите BOT_TOKEN
docker-compose up --build
```

Компоненты: `db` (PostgreSQL), `backend` (FastAPI), `caddy` (HTTPS-вход).

- Бэкенд напрямую: `http://localhost:8000` (документация API — `/docs`, health-check — `/health`)
- Через Caddy: `https://localhost` — фронтенд из `frontend/`, API проксируется на те же пути
  (самоподписанный сертификат локально; в браузере — «Принять риск»)
- Продакшен: `DOMAIN=ваш-домен.ru` + удалите `tls internal` в `Caddyfile` →
  Caddy выпустит сертификат Let's Encrypt автоматически. URL мини-приложения
  для платформы MAX: `https://<домен>/`

Сборка занимает меньше минуты (плюс первая загрузка образов).

Запуск без Docker (для разработки, БД — PostgreSQL на `localhost:5432`):

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r backend_max\requirements.txt -r backend_max\requirements-dev.txt
docker-compose up -d db    # поднять только PostgreSQL
$env:DATABASE_URL="postgresql+psycopg2://b2b:b2b_pass@localhost:5432/b2b_match"; $env:DEV_MODE="1"
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

1. `docker compose up --build` → `GET /health` → `{"status":"ok"}`.
2. Вход админа и seed (dev-режим):
   `POST /auth/max` с `{"dev_max_user_id": 7777001}` → токен;
   `POST /api/admin/seed` → `companies: 8, requests: 3, matches: 9`.
3. Лента исполнителя: вход `dev_max_user_id: 7777002` (DigitalLab) →
   `GET /me/recommendations` → первый элемент «Нужна разработка
   интернет-магазина…» со score 95 и критериями `почему подходит`.
4. Smart Request Builder: `POST /ai/parse-opportunity` с `description:
   "Нужна разработка интернет-магазина. React, 1С, бюджет 400-600 тысяч, срок два месяца, Москва"` →
   категория `IT-разработка`, бюджет `400000–600000`, срок `60`, регион `Москва`.
5. `POST /opportunities` с тем же описанием → статус `published`, в ответе
   `matches` с компаниями и критериями. Draft-сценарий: `publish: false` →
   `PATCH /opportunities/{id}` → `POST /opportunities/{id}/publish`.
6. Отклик: от лица другого исполнителя `POST /opportunities/{id}/proposals` →
   заказчику приходит уведомление (`GET /notifications`).
7. `GET /opportunities/{id}/comparison` → строки сравнения по цене/сроку/кейсам/матчу.
8. `POST /opportunities/{id}/shortlist` (`{"proposal_id": ...}`), затем
   `POST /deals` → переговоры, у исполнителя в `GET /deals` появляется сделка.
   Выбор исполнителя: `POST /proposals/{id}/status` `{"status": "chosen"}` →
   `GET /opportunities/{id}/dealroom` показывает `next_action` про переговоры;
   у исполнителя `GET /proposals/mine` статус `chosen`.
9. Feedback: `POST /matches/{match_id}/feedback` `{"positive": true}`.
10. Файлы: `POST /files` (multipart) → `GET /files/{id}`.

Ожидаемое поведение полностью повторяет автотесты: `pytest backend_max\tests`
(25 тестов). Готовая коллекция Postman — `backend_max/postman/B2B_Match.postman_collection.json`.

Дополнительно — скрипт проверки сценариев против живого сервера
(98 проверок, 9 сценариев, детерминированный прогон с автосбросом БД
и отчётом о покрытии всех 59 эндпоинтов):

```powershell
python backend_max\scripts\verify_scenarios.py
```

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

```powershell
docker-compose down        # остановка (данные PostgreSQL сохраняются в volume pgdata)
docker-compose up --build  # повторный запуск
docker-compose down -v     # полная очистка (БД + файлы)
```

## 14. Тесты

Тесты работают с PostgreSQL (тестовая БД `b2b_match_test` создаётся автоматически),
поэтому сначала поднимите БД:

```powershell
docker-compose up -d db
pytest backend_max\tests   # 20 тестов: структуризатор, матчинг, полный сценарий MVP, контракт, admin/seed
```
