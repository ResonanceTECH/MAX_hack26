# Документация API (OpenAPI)

> Часть решения **MAX_hack26**.  
> Корень: [`../README.md`](../README.md) · Backend: [`../backend_max/README.md`](../backend_max/README.md) · Frontend: [`../frontend/README.md`](../frontend/README.md) · Бот: [`../api/README.md`](../api/README.md) (клиент Bot API; не путать с этой папкой).

## Назначение

Каталог `docs/` хранит **снимок** контракта Backend для ревью, генерации клиентов и сверки Frontend DTO:

| Файл | Описание |
|------|----------|
| [`openapi-current.json`](openapi-current.json) | Экспорт OpenAPI схемы B2B Match API |

Актуальная интерактивная документация всегда у живого сервиса:

- http://localhost:8000/docs  
- http://localhost:8000/redoc  
- http://localhost:8000/openapi.json  

В Docker UI + proxy: https://localhost/docs (через Caddy).

## Как обновить снимок

При запущенном Backend:

```bash
curl -s http://localhost:8000/openapi.json -o docs/openapi-current.json
```

Или скопировать из Swagger UI.

## Связь с префиксом `/api`

Приложение монтирует бизнес-роуты под `APIRouter(prefix="/api")` — см. [`../backend_max/app/main.py`](../backend_max/app/main.py).  
В снимке пути могут отображаться относительно приложения; при вызове из Frontend base URL = `/api` ([`../frontend/src/shared/config/env.ts`](../frontend/src/shared/config/env.ts)).

## Проверка контракта

1. `docker compose up -d --build` ([корневой README](../README.md)).
2. Открыть `/docs`, пройти сценарий из [backend § проверка](../backend_max/README.md#11-пошаговый-сценарий-проверки).
3. Postman: [`../backend_max/postman/`](../backend_max/postman/).
4. Авто: `pytest backend_max/tests`, `python backend_max/scripts/verify_scenarios.py`.

## Ограничения

- Файл `openapi-current.json` может отставать от кода — перед сдачей обновите снимок.
- Некоторые admin-пути в истории экспорта могли фигурировать с/без дублирующего префикса; источник истины — код роутеров + живой `/openapi.json`.
