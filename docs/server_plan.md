# План разработки серверной части (PCB FAD)

Итоговый документ: **docs/server_plan.md**. Структура: **docs/design_plan.md**; **docs/design/** — макеты (accounts-assets.html, dashboard.html, distribution-rules.html, modal-add-income.html, modal-add-expense.html, palette.css).

---

## 1. Запланированные API-запросы

**Авторизация:** логин и пароль; JWT без срока истечения. Все маршруты (кроме логина/регистрации) — в контексте текущего пользователя по токену.

### 1.0 Авторизация

| Метод    | Путь             | Назначение                                                                         |
| -------- | ---------------- | ---------------------------------------------------------------------------------- |
| **POST** | `/auth/login`    | Логин: body `login`, `password`. В ответ — JWT (без истечения).                    |
| **POST** | `/auth/register` | Регистрация: login, password (и при необходимости имя). После успеха — выдача JWT. |

Остальные эндпоинты требуют заголовок `Authorization: Bearer <token>`.

### 1.1 Дашборд и виджеты

| Метод   | Путь                            | Назначение                                                                                                                                     |
| ------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **GET** | `/dashboard/layout`             | Вернуть сохранённый layout дашборда: список виджетов с `id`, `widgetType`, `position`/`order`.                                                |
| **PUT** | `/dashboard/layout`             | Сохранить layout: body — массив `{ id, widgetType, position/order }`.                                                                          |
| **GET** | `/dashboard/widget/:widgetType` | Единая точка данных для виджета. Query: `month`, `year`. Ответ: `component` + `data`.                                                           |

Каждый ответ виджета обязательно содержит **component** (имя компонента на frontend) и **data** (payload).

- **income** — `component: 'IncomeWidget'`, `data`: `{ total, currency, breakdown: [{ label, amount, currency }] }`.
- **expenses** — `component: 'ExpensesWidget'`, `data`: `{ total, currency, breakdown }`.
- **balance** — `component: 'BalanceWidget'`, `data`: `{ amount, currency, trend: 'up'|'down'|'neutral' }`.
- **free-money** — `component: 'FreeMoneyWidget'`, `data`: `{ amount, currency, formulaDescription? }`.
- **asset-chart** — `component: 'AssetChart'`, `data`: `{ accountId, label, currency, currentSum, points }`. Query: `accountId`, `tag`.

### 1.2 Счета и активы

| Метод      | Путь            | Назначение                                    |
| ---------- | --------------- | ---------------------------------------------- |
| **GET**    | `/accounts`     | Список счетов и активов пользователя.         |
| **POST**   | `/accounts`     | Создать счёт/актив. Body: `name`, `type`, `currency`, `tagIds?`. |
| **PATCH**  | `/accounts/:id` | Обновить счёт/актив.                           |
| **DELETE** | `/accounts/:id` | Удалить счёт/актив.                            |

### 1.3 Теги

| Метод   | Путь    | Назначение                                                       |
| ------- | ------- | ---------------------------------------------------------------- |
| **GET** | `/tags` | Список тегов: `id`, `name`, `color`, `alias`.                     |
| **POST**| `/tags` | Создать тег. **PATCH/DELETE** `/tags/:id` — обновить/удалить.    |

### 1.4 Правила (цепочки триггер → действия)

| Метод      | Путь         | Назначение                                                         |
| ---------- | ------------ | ------------------------------------------------------------------ |
| **GET**    | `/rules`     | Список правил с шагами.                                            |
| **POST**   | `/rules`     | Создать правило. Body: `triggerIncomeTypeId`, `steps`, `showOnDashboard?`. |
| **PATCH**  | `/rules/:id` | Обновить правило.                                                  |
| **DELETE** | `/rules/:id` | Удалить правило.                                                   |

### 1.5 Доходы и типы доходов

| Метод      | Путь                | Назначение                          |
| ---------- | ------------------- | ----------------------------------- |
| **GET/POST/PATCH/DELETE** | `/income-types`     | Справочник типов доходов.           |
| **GET/POST/PATCH/DELETE** | `/incomes`          | Записи о доходах. Query: `year`, `month`. |

### 1.6 Расходы

| Метод      | Путь            | Назначение                          |
| ---------- | --------------- | ----------------------------------- |
| **GET/POST/PATCH/DELETE** | `/expenses`     | Расходы. Списание из единого пула.  |

---

## 2. Модель денег (один «пул»)

Все поступления — **единый пул**. Доход не зачисляется на счёт; расходы вычитаются из пула. Из пула можно переводить в актив и обратно из актива в пул.

---

## 3. Архитектура backend

- **Стек:** NestJS, Prisma, PostgreSQL. Приложение в **backend/** в корне репозитория, не связано с **server/**.
- **Модули:** `backend/src/modules/` (Auth, Dashboard, Accounts, Tags, Rules, Incomes, Expenses).
- **Валидация:** Zod.
- **Тесты:** unit/e2e по модулям и API.

---

## 4. Базовые действия в правилах

1. **take_percent** — взять процент. Параметры: `percent`.
2. **take_fixed** — взять фиксированную сумму. Параметры: `amount`, `currency`.
3. **transfer** — перевести на счёт/актив. Параметры: `targetAccountId`, опционально `amount`/`percent`.
4. **convert_and_transfer** — конвертировать и перевести. Параметры: `targetAccountId`, `targetCurrency`, опционально `amount`/`percent`.
5. **deduct_expense** — вычесть расход. Параметры: `expenseId`, опционально `amount`.
6. **set_remaining** — остаток передать дальше.

Валидация `params` через Zod по `actionType`.

---

## 5. Система тегов

Отдельная таблица **Tag**: `name`, `color`, `alias`. Связь Account ↔ Tag — many-to-many.

---

## 6. Модель данных (Prisma)

Схема в **backend/prisma/schema.prisma**.

- **User**: `id`, `login`, `passwordHash`.
- **Account**: `id`, `userId`, `name`, `type` (account|asset), `currency`; связь с Tag (many-to-many).
- **Tag**: `id`, `userId`, `name`, `color`, `alias`.
- **DashboardLayout**: `userId` (unique), `layoutJson`.
- **IncomeType**, **Income**, **Expense**, **Rule**, **RuleStep**.
- **Movement**: учёт движений пул↔актив (income, expense, pool_to_asset, asset_to_pool).

---

## 7. Этапы реализации

1. Создать приложение в `backend/`.
2. Модель и миграции (User, Account, Tag, DashboardLayout, IncomeType, Income, Expense, Rule, RuleStep, Movement).
3. Accounts + Tags CRUD.
4. Доходы и расходы.
5. Дашборд (layout + widget data).
6. Правила (CRUD + валидация Zod).
7. Графики по активам (asset-chart).
8. Настройки зарплаты (опционально).
9. Тесты.
10. Документация и макеты в **docs/** и **docs/design/**.
