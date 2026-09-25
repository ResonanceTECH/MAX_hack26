# B2B Match — Frontend

MAX Mini App для поиска B2B-контрагентов и сопоставления спроса и предложения между компаниями.

Роль пользователя: **Business User** (сотрудник, предприниматель, менеджер компании). Один и тот же аккаунт выступает и заказчиком, и исполнителем — без отдельных аккаунтов Customer / Contractor.

Текущий статус по аудиту Business User: **PARTIALLY_IMPLEMENTED**.

---

## Что это

Клиентское приложение B2B Match:

- работает как Mini App внутри мессенджера MAX;
- помогает компаниям публиковать бизнес-запросы;
- помогает находить исполнителей и поставщиков;
- показывает Match Score и объяснение «Почему подходит»;
- ведёт процесс от отклика до shortlist, переговоров и Deal Room.

Пока backend не подключён: данные живут в in-memory mock API (`src/shared/api` + `src/shared/mocks`). HTTP-запросы к FastAPI ещё не используются.

---



## Стек


| Слой             | Технологии                                     |
| ---------------- | ---------------------------------------------- |
| UI               | React 19, TypeScript, Vite 8, MUI 6, Hugeicons |
| Роутинг          | React Router 7                                 |
| Server state     | TanStack Query 5                               |
| Client state     | Zustand 5                                      |
| Формы            | React Hook Form + Zod                          |
| HTTP (заготовка) | Axios                                          |
| Unit / component | Vitest, Testing Library, jsdom                 |
| E2E              | Playwright                                     |
| A11y             | @axe-core/playwright                           |


Структура: Feature/domain-based.

```
src/
  app/           # providers, router, layout, theme
  pages/         # экраны маршрутов
  widgets/       # карточки, навигация
  features/      # auth session, favorites, create parsers, stores
  entities/      # query hooks по доменам
  shared/        # api, mocks, ui, config, lib/max
  test/          # setup и helpers для unit-тестов
e2e/             # Playwright-сценарии Business User
```

---



## Запуск



### Требования

- Node.js 20+ (проверено на 24)
- npm



### Установка

```bash
cd frontend
npm install
npx playwright install chromium
```



### Env

```bash
cp .env.example .env
```


| Переменная          | По умолчанию | Назначение                                              |
| ------------------- | ------------ | ------------------------------------------------------- |
| `VITE_API_BASE_URL` | `/api/v1`    | Базовый URL FastAPI                                     |
| `VITE_USE_MOCK_API` | `true`       | `true` — in-memory mocks; `false` — когда backend готов |


Сейчас `VITE_USE_MOCK_API=true`. Переключение на живой API ещё впереди.

### Dev-сервер

```bash
npm run dev
```

Откроется Vite (обычно `http://127.0.0.1:5173`).

### Production

```bash
npm run typecheck
npm run build
npm run preview
```



### Линт и формат

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
```



### Тесты

```bash
# unit + component
npm test

# e2e (сам поднимает Vite на 127.0.0.1:5174)
npm run test:e2e

# один e2e-файл
npx playwright test e2e/contractor-flow.spec.ts

# UI-раннер Playwright
npx playwright test --ui
```

Перед первым E2E нужен Chromium:

```bash
npx playwright install chromium
```

Результаты:

- unit: stdout Vitest
- e2e: `test-results/playwright.json`, скриншоты падений в `test-results/`

---



## Реализованный функционал



### Маршруты

Все обязательные маршруты Business User есть и рендерятся без runtime crash:


| Route                          | Экран                  |
| ------------------------------ | ---------------------- |
| `/`                            | Главная                |
| `/opportunities`               | Каталог возможностей   |
| `/opportunities/:id`           | Карточка запроса       |
| `/opportunities/create`        | Создание запроса       |
| `/opportunities/:id/propose`   | Отклик                 |
| `/opportunities/:id/proposals` | Предложения по запросу |
| `/opportunities/:id/compare`   | Сравнение              |
| `/companies`                   | Каталог компаний       |
| `/companies/:id`               | Карточка компании      |
| `/my`                          | Мои процессы           |
| `/my/requests`                 | Мои запросы            |
| `/my/proposals`                | Мои отклики            |
| `/my/shortlist`                | Shortlist              |
| `/my/negotiations`             | Переговоры             |
| `/proposals/:id`               | Карточка предложения   |
| `/deals/:id`                   | Deal Room              |
| `/favorites`                   | Избранное              |
| `/notifications`               | Уведомления            |
| `/profile/company`             | Профиль компании       |
| `/*`                           | 404                    |




### Работает end-to-end

- Один Business User (seed: Анна Смирнова, Digital Lab) без смены аккаунта.
- Главная: hero, быстрые действия, блок «Для вас», Match Score, «Почему подходит», свои запросы, ссылки «Продолжить работу».
- Каталог возможностей: поиск по названию, фильтры (категория, отрасль, регион, бюджет, технологии, match), reset, empty state, сортировка по дате.
- Карточка возможности: описание, бюджет, регион, сроки, требования, Match Score + explanation, переход к компании, CTA «Предложить решение».
- Создание отклика: валидация цены/срока/описания, success, появление в «Мои отклики» при холодном кэше.
- Критический Contractor Flow: чужой запрос → score → отклик → «Мои отклики».
- Создание запроса: parse текста → structured form → preview → publish → success.
- Каталог компаний и фильтры, карточка компании, match в контексте `fromOpportunity`.
- Мои процессы: счётчики совпадают с содержимым табов.
- Список предложений по запросу: open, shortlist/reject статуса, empty.
- Сравнение: таблица с score, ценой, сроком, rating, cases; usable на 390px.
- Shortlist: группировка по запросу, удаление в рамках сессии, открытие компании, старт переговоров → Deal Room.
- Deal Room: customer/contractor, request/proposal, цена/срок, статус negotiation, табы Overview / Proposal / Files / History, fallback «Открыть чат в MAX».
- Уведомления: типы и переходы по ссылкам.
- Профиль: имя, услуги, технологии, verified.
- Loading / Empty / Error / Retry на ключевых списках.
- Responsive: bottom nav на mobile, sidebar на desktop, без критичного horizontal overflow.
- Иконки: Hugeicons; Material / Lucide / FontAwesome / Heroicons в `src` не используются.
- API-слой для opportunities / companies / proposals / matching / notifications + TanStack Query.



### Критические сценарии


| Сценарий                                                | Статус |
| ------------------------------------------------------- | ------ |
| Smoke всех маршрутов (19/19)                            | PASS   |
| Contractor Flow (Business User как исполнитель)         | PASS   |
| Customer Flow (Business User как заказчик до Deal Room) | FAIL   |
| Production build + typecheck                            | PASS   |


Customer Flow сейчас: публикация запроса работает, дальше нет реальных recommended companies → нет сравнения / shortlist / сделки из нового запроса.

---



## Ещё не реализовано / сломано



### To-do (продукт)

Приоритет сверху вниз.

#### P0 — блокеры READY

- [ ] После публикации запроса показывать реальные recommended companies (score + «Почему подходит»), а не hardcoded «Найдено 8».
- [ ] Запретить отклик на собственный запрос на `/opportunities/:id/propose` (не только скрыть CTA на карточке).
- [ ] Запретить отклик на `EXPIRED` / `CLOSED`.
- [ ] Связать «В shortlist» с `/my/shortlist` (сейчас меняется только status proposal).
- [ ] Сравнение: выбор 2–3 предложений, требования / missing, add to shortlist, remove from comparison.
- [ ] Инвалидировать TanStack Query после create/publish (счётчики «Мои», списки откликов и запросов).
- [ ] Избранное: toggle с главной / карточки / каталога должен отражаться в `/favorites`.



#### P1 — ядро процесса

- [ ] Черновик запроса: «Сохранить черновик» не должен вызывать publish; черновики в отдельном табе.
- [ ] Сортировка opportunities по match (сейчас no-op).
- [ ] Поиск opportunities по технологиям (сейчас только title / description / shortName).
- [ ] Сортировка proposals по match / цене / сроку + фильтр shortlisted.
- [ ] Shortlist: персистентные заметки и удаление; защита от duplicate Deal при повторном «Начать переговоры».
- [ ] RBAC: нельзя менять чужой proposal и видеть чужой shortlist.
- [ ] Уведомления: отдельный тип negotiation; read state и unread badge должны сохраняться; колокольчик на desktop.
- [ ] Пригласить компанию в запрос: реальное состояние вместо `window.alert`.



#### P2 — контент и качество

- [ ] Вкладки «Кейсы» и «Документы» на карточке компании (сейчас заглушки).
- [ ] В профиле: отрасли, компетенции отдельно от технологий, кейсы.
- [ ] Роль без edit permission и проверка запрета действием (сейчас в сессии только `company_owner`, формы edit нет).
- [ ] «Не интересно» / feedback с персистентностью (сейчас page `useState`).
- [ ] Timeline Deal Room сортировать по дате.
- [ ] Страницы не импортировать raw mocks напрямую — только через API/service layer.
- [ ] Upload файлов в Deal Room.
- [ ] Подключить FastAPI (`VITE_USE_MOCK_API=false`), auth через MAX Bridge.
- [ ] A11y: visible focus outline; axe `list` / `aria-prohibited-attr`.
- [ ] Filter drawer на 390px не выходить за viewport.



### To-do (инфра)

- [ ] CI: `typecheck` + `lint` + `test` + `test:e2e` + `build`.
- [ ] Seed/reset механизм mock-данных между E2E (сейчас каждый browser context стартует с module state).
- [ ] MSW или HTTP mock, когда появится реальный `apiClient`.

---



## Тесты

Аудит Business User покрыт unit + E2E. Продуктовые дефекты не маскируются: отсутствуют действия помечаются `FAIL` / `NOT_IMPLEMENTED`.

Последний полный прогон:


| Набор                     | Total | Passed | Failed | Not implemented |
| ------------------------- | ----- | ------ | ------ | --------------- |
| E2E (Playwright)          | 192   | 148    | 29     | 15              |
| Unit / component (Vitest) | 39    | 34     | 5      | 0               |
| Вместе                    | 231   | 182    | 34     | 15              |


Критические:


| Flow              | Результат  |
| ----------------- | ---------- |
| Smoke SM-01…SM-19 | 19/19 PASS |
| Contractor Flow   | PASS       |
| Customer Flow     | FAIL       |




### Таблица E2E-файлов


| Файл                              | Что проверяет                 | Статус                                                                           |
| --------------------------------- | ----------------------------- | -------------------------------------------------------------------------------- |
| `e2e/business-user-smoke.spec.ts` | Все маршруты + 404            | PASS                                                                             |
| `e2e/business-user-home.spec.ts`  | Главная HOME-01…11            | Частично (HOME-07 FAIL)                                                          |
| `e2e/opportunities.spec.ts`       | Список, фильтры, sort, empty  | Частично (OPP-03, OPP-12 FAIL)                                                   |
| `e2e/opportunity-details.spec.ts` | Карточка OD-01…19             | Частично (OD-15, OD-19 FAIL)                                                     |
| `e2e/create-proposal.spec.ts`     | Форма отклика PRC-01…13       | Частично (PRC-13 FAIL)                                                           |
| `e2e/contractor-flow.spec.ts`     | Критический поток исполнителя | PASS                                                                             |
| `e2e/create-opportunity.spec.ts`  | Создание запроса CR-01…20     | Частично (черновик / recommendations NOT_IMPLEMENTED, список после publish FAIL) |
| `e2e/customer-flow.spec.ts`       | Критический поток заказчика   | FAIL                                                                             |
| `e2e/company-search.spec.ts`      | Каталог компаний COMP-01…12   | Частично (favorite FAIL)                                                         |
| `e2e/company-details.spec.ts`     | Карточка компании CD-01…16    | Частично (кейсы/документы/invite NOT_IMPLEMENTED)                                |
| `e2e/my-processes.spec.ts`        | Дашборд MY-01…10              | Частично (MY-10 FAIL)                                                            |
| `e2e/proposals.spec.ts`           | Предложения PROP-01…12        | Частично (sort/filter NOT_IMPLEMENTED)                                           |
| `e2e/comparison.spec.ts`          | Сравнение CMP-01…14           | Частично (выбор/требования/shortlist NOT_IMPLEMENTED)                            |
| `e2e/shortlist.spec.ts`           | Shortlist SHORT-01…09         | Частично (связь с status, notes, duplicate Deal FAIL)                            |
| `e2e/negotiations.spec.ts`        | Deal Room DEAL-01…11          | PASS (кроме DEAL-10 в unit)                                                      |
| `e2e/favorites.spec.ts`           | Избранное FAV-01…06           | Частично (cross-page save FAIL)                                                  |
| `e2e/notifications.spec.ts`       | Уведомления NOT-01…10         | Частично (read/badge FAIL)                                                       |
| `e2e/company-profile.spec.ts`     | Профиль PROF-01…09            | Частично                                                                         |
| `e2e/business-user-role.spec.ts`  | Один аккаунт, RBAC ROLE-01…10 | Частично (ROLE-08, 09 FAIL)                                                      |
| `e2e/matching.spec.ts`            | Match score + explanation     | PASS                                                                             |
| `e2e/states.spec.ts`              | Empty states                  | PASS                                                                             |
| `e2e/responsive.spec.ts`          | 375…1440                      | Частично (RESP-04 FAIL)                                                          |
| `e2e/accessibility.spec.ts`       | A11Y + axe                    | Частично                                                                         |
| `e2e/icons.spec.ts`               | Hugeicons                     | PASS                                                                             |
| `e2e/console.spec.ts`             | pageerror / console.error     | PASS                                                                             |




### Таблица unit / component


| Файл                              | Что проверяет                   | Статус                           |
| --------------------------------- | ------------------------------- | -------------------------------- |
| `OpportunityCard.test.tsx`        | Карточка возможности            | PASS                             |
| `CompanyCard.test.tsx`            | Карточка компании               | PASS                             |
| `ProposalCard.test.tsx`           | Карточка предложения            | PASS                             |
| `MatchScore.test.tsx`             | Score + dialog                  | PASS                             |
| `MatchExplanation.test.tsx`       | Причины / gaps                  | PASS                             |
| `StatusChip.test.tsx`             | Текстовые статусы               | PASS                             |
| `FilterDrawer.test.tsx`           | Drawer фильтров                 | PASS                             |
| `SearchInput.test.tsx`            | Поиск                           | PASS                             |
| `FavoriteButton.test.tsx`         | Toggle избранного               | PASS                             |
| `CreateOpportunityPage.test.tsx`  | Parse + structured form         | PASS                             |
| `CreateProposalPage.test.tsx`     | Validation отклика              | PASS                             |
| `OpportunityDetailsPage.test.tsx` | OD-17, OD-18                    | FAIL (EXPIRED/CLOSED)            |
| `DealRoomPage.test.tsx`           | DEAL-10 timeline sort           | FAIL                             |
| `NotificationsPage.test.tsx`      | Переход + NOT-05 type           | FAIL (тип negotiation)           |
| `async-states.test.tsx`           | Loading / empty / error / retry | PASS                             |
| `parseOpportunityText.test.ts`    | Parser + schema                 | PASS                             |
| `api-layer.test.ts`               | API-01…08                       | FAIL API-06 (pages import mocks) |
| `icons.test.ts`                   | Hugeicons / banned packs        | PASS                             |




### Как читать статусы в тестах

- **PASS** — действие пользователя реально меняет состояние.
- **FAIL** — UI есть, но поведение неверное или неполное.
- **NOT_IMPLEMENTED** — заглушка, alert, отсутствие контрола. Не подменяется зелёным тестом.

---



## Архитектура данных

```
Page / Widget
  → TanStack Query hooks (entities/*/api/queries)
    → shared/api/*Api
      → shared/mocks (in-memory)   # сейчас
      → apiClient → FastAPI        # позже
```

MAX Bridge: `src/shared/lib/max/maxBridge.ts` — абстракция поверх WebApp API с безопасным fallback вне MAX.

Известный архитектурный долг: часть страниц импортирует `@/shared/mocks` напрямую (`HomePage`, `OpportunitiesPage`, `FavoritesPage`, `MyProposalsPage`, `MyProcessesPage`, `ShortlistPage`, `MatchCard`). Это закрыто тестом API-06 как FAIL.

---



## Скрипты (кратко)


| Команда             | Назначение                   |
| ------------------- | ---------------------------- |
| `npm run dev`       | Dev-сервер Vite              |
| `npm run build`     | Typecheck + production build |
| `npm run preview`   | Превью сборки                |
| `npm run typecheck` | `tsc -b --noEmit`            |
| `npm run lint`      | ESLint                       |
| `npm run lint:fix`  | ESLint --fix                 |
| `npm run format`    | Prettier write               |
| `npm test`          | Vitest run                   |
| `npm run test:e2e`  | Playwright                   |


---



## Definition of Done (Business User)

READY только если одновременно:

- smoke 19/19;
- Contractor Flow и Customer Flow на одном аккаунте;
- matching = score + explanation;
- create / publish request;
- proposal create;
- comparison с выбором;
- shortlist связан с действиями;
- negotiation + Deal Room;
- favorites и notifications ведут в сущности;
- loading / empty / error;
- typecheck + lint + production build без ошибок;
- нет uncaught runtime errors.

Сейчас: **PARTIALLY_IMPLEMENTED**. До READY в первую очередь закрыть блок P0 в to-do.