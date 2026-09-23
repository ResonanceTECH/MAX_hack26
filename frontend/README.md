# B2B Match — Frontend

MAX Mini App для поиска B2B-контрагентов.

## Стек

React · TypeScript · Vite · React Router · MUI · TanStack Query · Zustand · React Hook Form · Zod · Axios

## Запуск

```bash
cd frontend
npm install
npm run dev
```

## Скрипты

- `npm run dev` — локальная разработка
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript
- `npm run preview` — превью production-сборки

## Архитектура

Feature/domain-based структура: `app`, `pages`, `widgets`, `features`, `entities`, `shared`.

- Mock-данные: `src/shared/mocks/`
- API-слой (сейчас mock): `src/shared/api/` — позже заменить на FastAPI через `apiClient`
- MAX Bridge abstraction: `src/shared/lib/max/maxBridge.ts`

## Env

Скопируйте `.env.example` → `.env` при необходимости:

- `VITE_API_BASE_URL` — URL FastAPI
- `VITE_USE_MOCK_API=false` — когда backend готов
