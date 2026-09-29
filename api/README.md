# B2B Match — бот MAX и клиент Bot API

> Часть решения **MAX_hack26**. Обзор стека: [`../README.md`](../README.md).  
> Backend (уведомления + бизнес-API): [`../backend_max/README.md`](../backend_max/README.md).  
> Mini App: [`../frontend/README.md`](../frontend/README.md).

Папка `api/` + корневой `bot.py` — **точка входа** в мини-приложение и long-polling клиент к [Bot API MAX](https://platform-api2.max.ru).  
Бизнес-логика маркетплейса здесь **не** живёт: подбор, матчи, Deal Room — в Backend.

## Содержание

- [Назначение](#1-назначение-решения)
- [Основной сценарий](#2-основной-пользовательский-сценарий)
- [Состав и архитектура](#3-состав-и-архитектура)
- [Запуск со стеком Docker](#4-одна-команда-docker-и-роль-бота)
- [Параметры окружения](#5-необходимые-параметры-окружения)
- [Переменные окружения](#6-переменные-окружения)
- [Порты](#7-используемые-порты)
- [Зависимости](#8-зависимости)
- [Внешние сервисы](#9-внешние-сервисы-и-интеграции)
- [Работа с данными](#10-описания-работы-с-данными)
- [Тестовые данные](#11-порядок-работы-с-тестовыми-данными)
- [Пошаговая проверка](#12-пошаговый-сценарий-проверки)
- [Ожидаемое поведение](#13-примеры-ожидаемого-поведения)
- [Известные ограничения](#14-известные-ограничения)
- [Остановка и перезапуск](#15-порядок-остановки-и-повторного-запуска)

---

## 1. Назначение решения

- Приветствие при `bot_started` и ответы на сообщения (`/start`, help).
- Выдача **deep-link** на Mini App: `https://max.ru/<botUsername>?startapp[=payload]`.
- Тонкий HTTP-клиент `MaxAPI` для `GET /me`, `GET /updates` (long poll), `POST /messages`.

Уведомления о матчах/откликах/сделках отправляет **Backend** (`backend_max/app/notifications.py`) тем же Bot API; бот нужен как интерактивная точка входа и канал диалога.

---

## 2. Основной пользовательский сценарий

1. Пользователь находит бота B2B Match в MAX / жмёт кнопку меню.
2. Событие `bot_started` → бот шлёт welcome + ссылку на Mini App.
3. Пользователь открывает ссылку → Frontend (HTTPS) → `initData` → Backend auth.
4. Дальнейшие события платформы (новый матч и т.д.) приходят сообщениями от Backend через Bot API; бот-процесс может параллельно читать updates и отвечать на текстовые команды.

---

## 3. Состав и архитектура

```
MAX_hack26/
├── bot.py              # long polling loop, handle_update
├── api/
│   ├── __init__.py
│   ├── max_api.py      # MaxAPI: platform-api2.max.ru
│   └── README.md       # этот файл
├── requirements.txt    # requests, python-dotenv
└── .env                # BOT_TOKEN, MAX_SSL_VERIFY
```

```
MAX Client ──updates──► bot.py ──MaxAPI──► platform-api2.max.ru
                │
                └── deep-link ──► Caddy/Frontend ──/api──► backend_max
                                         ▲
backend notifications ──POST /messages───┘
```

Бот **не** входит в `compose.yaml` — запускается отдельно на машине с Python и валидным `BOT_TOKEN`.

---

## 4. Одна команда Docker и роль бота

Стек Mini App + API + БД:

```bash
# из корня
docker compose up -d --build
```

Бот после этого (второй терминал):

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# BOT_TOKEN уже в корневом .env
python bot.py
```

См. также [`../README.md#одна-команда-запуска-docker`](../README.md#одна-команда-запуска-docker).

---

## 5. Необходимые параметры окружения

| Параметр | Зачем |
|----------|--------|
| `BOT_TOKEN` | обязателен для `MaxAPI` и `bot.py` |
| Python 3.9+ | runtime |
| Доступ к `platform-api2.max.ru` | long poll / send |
| Опционально: корневые CA Минцифры | чтобы поставить `MAX_SSL_VERIFY=1` |

Без токена бот не стартует (`ValueError: BOT_TOKEN не задан`). Backend при этом может работать в `DEV_MODE` без реальных пушей.

---

## 6. Переменные окружения

| Переменная | По умолчанию | Назначение |
|------------|--------------|------------|
| `BOT_TOKEN` | — | Authorization к Bot API |
| `MAX_SSL_VERIFY` | `0` | `0` — не проверять SSL (обход проблем сертификата); `1` после установки CA |

Те же переменные использует Backend для уведомлений — единый корневой `.env` / [`../backend_max/.env.example`](../backend_max/.env.example).

---

## 7. Используемые порты

Бот **не слушает** локальный порт: только исходящие HTTPS к `platform-api2.max.ru`.  
Связанные порты стека: 443 (Mini App), 8000 (API) — [`../README.md#используемые-порты`](../README.md#используемые-порты).

---

## 8. Зависимости

[`../requirements.txt`](../requirements.txt):

```
requests>=2.31.0
python-dotenv>=1.0.0
```

---

## 9. Внешние сервисы и интеграции

| Сервис | Использование |
|--------|----------------|
| `https://platform-api2.max.ru` | `/me`, `/updates`, `/messages` |
| Mini App URL | deep-link `https://max.ru/<username>?startapp` |
| Backend | независимо шлёт уведомления тем же API |

Методы клиента (`api/max_api.py`): `get_me`, `get_updates`, `send_message`.

---

## 10. Описания работы с данными

Бот **stateless**: не пишет в PostgreSQL. Хранит только marker long polling в памяти процесса.  
Персистентные уведомления и бизнес-данные — в Backend БД (`notification_log` и др.).

---

## 11. Порядок работы с тестовыми данными

1. Создайте бота на платформе партнёров MAX, получите `BOT_TOKEN`.
2. Пропишите токен в корневой `.env`.
3. Для проверки Mini App без бота используйте seed Backend (`7777001`…) — [`../backend_max/README.md`](../backend_max/README.md#10-тестовые-данные-seed).
4. Для e2e UI без MAX — Vite + mock/real API ([`../frontend/README.md`](../frontend/README.md)).

---

## 12. Пошаговый сценарий проверки

```bash
# 1. токен
grep BOT_TOKEN .env

# 2. кто я
python - <<'PY'
from api.max_api import MaxAPI
api = MaxAPI()
print(api.get_me())
PY

# 3. long poll
python bot.py
# в MAX: открыть бота → ожидается welcome + ссылка на Mini App

# 4. открыть ссылку → HTTPS UI → авторизация
```

Параллельно: `curl -s http://localhost:8000/health` после `docker compose up`.

---

## 13. Примеры ожидаемого поведения

| Событие | Ответ бота |
|---------|------------|
| `bot_started` | текст WELCOME + deep-link |
| текстовое сообщение пользователя | HELP / ссылка на приложение (не эхо бизнес-данных) |
| сообщение от самого бота | игнор (`sender.is_bot`) |
| пустой `BOT_TOKEN` | процесс падает при создании `MaxAPI` |
| `MAX_SSL_VERIFY=0` | SSL verify выключен, warning urllib3 подавлен |

---

## 14. Известные ограничения

- Нет webhook-режима — только long polling.
- Нет очереди/ретраев при падении сети кроме логики цикла в `bot.py`.
- Меню бота / кнопки Mini App настраиваются на стороне платформы MAX, не в этом репо.
- Дублирование канала уведомлений: Backend шлёт сам; бот не подписан на внутреннюю шину событий Backend.

---

## 15. Порядок остановки и повторного запуска

```bash
# в терминале bot.py
Ctrl+C
python bot.py

# стек приложения
docker compose down
docker compose up -d --build
```

---

## Связанные документы

| Документ | Ссылка |
|----------|--------|
| Корень | [../README.md](../README.md) |
| Backend / уведомления | [../backend_max/README.md](../backend_max/README.md) |
| Frontend | [../frontend/README.md](../frontend/README.md) |
| OpenAPI | [../docs/README.md](../docs/README.md) |
