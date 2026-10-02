# Архитектура apps/pwa

Модернизированный FSD (Feature-Sliced Design), как в `sotrudniki-front`, но с
одним главным приоритетом: **local-first**. Слой выше `views` существует
только для того, что реально используется больше чем в одном месте. Если
модуль нужен только одному экрану — он живёт внутри этого экрана, а не в
`entities`/`shared`/`kernel`, даже если выглядит «переиспользуемым».

## Слои

```
src/
  vite-env.d.ts   # ambient-типы vite, единственный файл вне слоёв
  app/            # точка входа, роутинг, корневой chrome, bootstrap
  views/          # один экран = одна папка; внутри своя ui/, lib/, model/
  entities/       # доменные модули, нужные 2+ views
  shared/         # generic, не знает о домене: ui-kit, lib
  kernel/         # сквозная инфраструктура: db, общие types, feature-флаги
```

Файлы — `kebab-case.ts(x)` без исключений (`AssetAvatar.tsx` →
`asset-avatar.tsx`, `calculateSalaryPayment.ts` → `calculate-salary-payment.ts`).
Имена экспортируемых компонентов/функций остаются как были (PascalCase для
компонентов, camelCase для функций) — переименовывается только файл.

### `app/`

Точка входа и всё, что раньше жило в file-based `routes/`. Роутинг —
**code-based** (`createRoute`/`createRootRoute`/`addChildren`), без кодогена:
никакого `routeTree.gen.ts`, никакого `TanStackRouterVite`-плагина в
`vite.config.ts`.

- `app/main.tsx` — точка входа (`index.html` грузит `/src/app/main.tsx`),
  собирает `router` (`createRouter({ routeTree, basepath, notFoundMode })`) и
  рендерит `<BootGate><RouterProvider /></BootGate>`.
- `app/index.css` — глобальные стили, импортируются из `main.tsx`.
- `app/routes.tsx` — конфиг роутов: каждый роут — плоский `createRoute` с
  полным путём из `ROUTES` (см. `shared/config/routes.ts` ниже), собранные в
  `rootRoute.addChildren([...])` → экспортируется как `routeTree`. Логика
  `beforeLoad`/`validateSearch`/`loader` (редирект на онбординг, фиче-флаг
  year-summary, поиск правила по id и т.д.) живёт прямо здесь — `component`
  каждого роута лениво (`lazyRouteComponent`) указывает на **mediator**
  нужного view (см. ниже), ничего кроме самого роутинга `routes.tsx` не
  делает.
- `app/guards/onboarding-guard.ts` — `requireIncompleteOnboarding`, роут-гвард
  для онбординг-роутов.
- `app/layouts/` — компоненты корневого chrome, у каждого ровно один
  потребитель:
  - `root-layout.tsx` — `RootLayout` (обёртка с `<Outlet/>` + таббар),
    `component` корневого роута в `routes.tsx`.
  - `glass-tab-bar.tsx` — нижний таббар, используется из `root-layout.tsx`.
  - `boot-gate.tsx` — гейт загрузки при старте (ждёт курс валют/БД),
    используется из `main.tsx`.
- `app/providers/` — зарезервировано под будущие React-провайдеры
  (`QueryClientProvider`, `ThemeProvider` и т.п.). Сейчас таких нет —
  `BootGate` уже выполняет роль единственного обёрточного компонента.

Никаких роут-адаптеров в `app/` больше нет — то, что ими было
(`getRouteApi(path)` + рендер экрана), переехало в `mediators/` внутри
каждого view (см. ниже). `app/` отвечает только за роутинг и корневой
chrome, ничего не знает о конкретных экранах.

Ни у `app/`, ни у его подпапок нет `index.ts` — ничего из `app/` не
импортируется снаружи него, реэкспортировать нечего и незачем.

### `views/`

Одна папка = один раздел приложения (который может обслуживать один или
несколько роутов). Внутри — `mediators/`, `ui/`, `lib/`, `model/` и
`index.ts` — **локальный** публичный API вида
`export { Assets } from './mediators/assets'`.

**`mediators/`** — компоненты, которые напрямую подключены к роуту в
`app/routes.tsx` (через `lazyRouteComponent`). Имя — без суффиксов
`Screen`/`Page` (`AssetDetailScreen` → `AssetDetail`, `AssetFormScreen` →
`AssetForm`). Если роуту нужны `search`/`params`/`loaderData` — mediator
сам достаёт их через `getRouteApi(ROUTES.x)`, это и есть то самое
«посредничество» между роутом и UI. Если один и тот же экран обслуживает
несколько роутов с разными данными (например `MoneyFlowScreen` — доход и
расход, онбординг и настройки), у каждого роута свой маленький mediator,
а сам переиспользуемый экран остаётся обычным файлом в корне view (не в
`mediators/`), потому что сам по себе он ни к одному роуту не привязан.

```
views/assets/
  mediators/
    assets.tsx              # export Assets — /assets
    asset-detail.tsx         # export AssetDetail — /assets/$slug, сам достаёт slug
    asset-form.tsx            # export AssetForm — /assets/new, сам достаёт search.from
  index.ts                    # export { Assets, AssetDetail, AssetForm }
  ui/
    asset-reorder-handle.tsx  # только assets-mediator
    asset-style-picker.tsx    # только экраны assets
    credit-detail-screen.tsx  # саб-экран, открывается только из asset-detail
    goal-progress-badge.tsx   # только экраны assets
  lib/
    asset-providers.ts        # только asset-form

views/money-flow/
  mediators/
    onboarding-income.tsx     # export OnboardingIncome — /onboarding/income
    onboarding-expenses.tsx   # export OnboardingExpenses — /onboarding/expenses
    income-settings.tsx       # export IncomeSettings — /settings/income, читает search._cycle
    expenses-settings.tsx     # export ExpensesSettings — /settings/expenses
  money-flow-screen.tsx       # переиспользуемый экран, НЕ mediator — 2 потребителя внутри view
  cycle-money-flow-preview.tsx  # переиспользуемый экран, НЕ mediator — 2 потребителя внутри view
  index.ts                    # export { OnboardingIncome, OnboardingExpenses, IncomeSettings, ExpensesSettings }
```

**Никакого общего `views/index.ts`** — у каждой view-папки свой локальный
барrel, агрегирующего барreля над всеми views нет. `app/routes.tsx`
импортирует конкретный mediator через `@/views/<name>` — лениво, через
`lazyRouteComponent`, и ничего больше из view не знает.

Полный список view-папок: `home`, `assets`, `money-flow`, `settings`
(включает `settings/rules`), `history`, `vacation`, `year-summary`,
`onboarding`.

### `entities/`

Доменная логика и доменно-окрашенный UI, который используют 2+ разных views.
У каждой — `index.ts`, публичный `export *` из всех своих `lib/`/`ui/`/`model/`
файлов (внутри самой entity файлы ссылаются друг на друга относительными
путями, не через свой же barrel).

- `entities/asset` — `lib/asset-icons.ts`, `lib/defaults.ts`,
  `ui/asset-avatar.tsx` (используется в assets, settings, home, year-summary).
- `entities/credit` — `lib/plan.ts` (кредитные графики; нужен onboarding,
  assets, kernel/db).
- `entities/report` — самый крупный: расчёт цикла/зарплаты/переноса остатка
  (`calculate-report`, `calculate-salary-payment`, `compute-cycle-history`,
  `resolve-carry-in`, `date-window`, `rules-budget`, `apply-rules`,
  `vacation`, `money-flow-entries`, `lib/calendar/*`), плюс
  `ui/report-cycle-switcher.tsx` и `ui/carryover-edit-sheet.tsx`
  (используются из home **и** money-flow).
- `entities/exchange` — курсы валют: `lib/*`, `model/store.ts`,
  `ui/exchange-rate-badge.tsx` (assets + home).
- `entities/goal` — `lib/describe-pace.ts`, `lib/goal-notifications.ts`
  (assets + home).
- `entities/year-summary` — `lib/compute-year-summary.ts` (home + свой экран).

### `shared/`

Generic, без знания о домене. Не импортирует ничего из `entities`/`views`.
Без общего `index.ts` — каждый модуль импортируется напрямую по своему
файлу (`@/shared/ui/page-header`, `@/shared/lib/format`): слайс плоский,
барrel добавил бы только лишний косвенный уровень.

- `ui/`: `page-header`, `page-transition`, `fade-in`, `error-page`,
  `undo-toast`, `swipe-to-delete`, `loader` — каждый используется в 3+
  несвязанных местах (`loader` — исключение по смыслу, а не по счётчику
  импортов: это универсальный спиннер, по природе он `shared`, хотя сейчас
  его рендерит только `app/layouts/boot-gate.tsx`).
- `lib/`: `format.ts` (только чистые форматтеры — `formatRub`, `formatUsd`,
  `formatMoney`, `toIsoDate`), `slug.ts`, `download-backup.ts`, `layout.ts`
  (константы отступов/`numeric()`-парсер).
- `config/routes.ts` — `ROUTES`, единственный источник правды для всех путей
  приложения (`ROUTES.assets.detail === '/assets/$slug'` и т.п., вложенность
  повторяет структуру урла). Используется **везде**, где в коде встречается
  путь: в `app/routes.tsx` (поле `path` и `redirect({ to })`), в
  `getRouteApi(...)` внутри mediator'ов, в `<Link to>`/`navigate({ to })` по
  всему `views/`. Нигде в проекте не должно быть захардкоженной строки вида
  `'/assets/$slug'` — вместо неё `ROUTES.assets.detail`.

> При первом варианте барреля `format.ts` тянул внутрь себя
> `entities/report`/`entities/exchange` (money-flow-entry хелперы вроде
> `incomesToEntries`, которые реально считают через `convertToRub` и
> `createEmptyBimonthlyTranches`) — это нарушало правило «shared ничего не
> знает про entities». Эти 5 функций переехали в
> `entities/report/lib/money-flow-entries.ts`, в `shared/lib/format.ts`
> остались только форматтеры без доменных зависимостей.

### `kernel/`

Сквозная инфраструктура, от которой зависят все слои. Однофайловые модули
(`types.ts`, `features.ts`, `db/index.ts`) своего barrel не получают — им
нечего прятать, весь файл и так единственная точка входа.

- `kernel/db` — локальное хранилище (IndexedDB/localStorage-блоб).
- `kernel/types.ts` — общие доменные типы (36+ мест использования; слишком
  широко расползлись, чтобы дробить их по entities прямо сейчас — кандидат
  на будущий рефакторинг, см. ниже).
- `kernel/features.ts` — feature-флаги.

## Правило размещения (local-first)

> Размещай модуль в **самом узком слое, который покрывает всех его текущих
> потребителей**.
>
> - Все потребители внутри одного view → колокация в этом view
>   (`ui/`/`lib/`/`model/`).
> - Потребители в разных views, но это один домен → `entities/<domain>`.
> - Потребители в разных views, домена нет → `shared`.
> - Потребитель — инфраструктура (persistence, типы, флаги, роут-гварды) →
>   `kernel`/`app`.
>
> Когда у модуля появляется второй потребитель в другом view — **тогда**
> поднимаем его в `entities`/`shared`, не раньше.

### Пример: одинаковые по форме, разное место

`GoalProgressBadge` и `AssetAvatar` выглядят одинаково (маленький
доменно-окрашенный бейдж поверх актива). Но:

- `GoalProgressBadge` используется только на экранах `assets` (`Assets`,
  `AssetDetail`) → `views/assets/ui/goal-progress-badge.tsx`.
- `AssetAvatar` используется в `assets`, `settings`, `home`, `year-summary` →
  `entities/asset/ui/asset-avatar.tsx`.

Не угадывай «на будущее» — смотри на реальные импорты.

## Направление зависимостей

```
app → views → entities → shared
kernel доступен всем слоям
```

Импорт чужой **entity** или **view** — только через её `index.ts`
(`@/entities/asset`, `@/views/assets`), никогда напрямую в
`lib/`/`ui/`/`model/` чужого слайса — так entity/view может менять свою
внутреннюю раскладку файлов, не трогая чужой код. `shared/` и `kernel/`
барrelов не имеют — их модули плоские и самодостаточные, импортируются
напрямую по файлу (`@/shared/ui/page-header`, `@/kernel/db`). Внутри своего
слайса — обычные относительные импорты, а не через свой же `index.ts`.

`widgets/`/`features/` слои сейчас не созданы — ни один модуль не оказался
одновременно cross-view, доменно-окрашенным и не относящимся ни к одной
entity. Как только такой появится — заводи слой, не раньше.

**Осознанное исключение:** `kernel/db/index.ts` импортирует
`entities/credit` (пересчёт кредита при сохранении). Это нарушает «чистое»
направление `kernel` ниже `entities`, но это осознанный компромисс
persistence-слоя, а не ошибка, которую нужно чинить.

## Структура внутри слайса

Создавай только те подпапки, которые реально нужны:

- `ui/` — компоненты
- `lib/` — чистая логика/вычисления
- `model/` — состояние (store, контекст)

Не создавай пустые `ui/`/`lib/`/`model/` «на всякий случай». `index.ts` как
публичный API — только у `entities/*` и `views/*` (слои, которые реально
импортируют снаружи и которым есть что скрывать). У `shared/`, `kernel/` и
`app/` барrела нет — их не импортируют как единое целое, а только по
конкретному файлу.

## Чеклист: когда поднимать/опускать модуль

- **Поднять в `entities`/`shared`**, когда у view-локального модуля
  появляется второй потребитель в другом view. Спроси: это про домен
  (конкретное существительное — asset, report, exchange) или про generic UI?
  Отсюда и выбор между `entities/<x>` и `shared`.
- **Опустить обратно в `views/<name>`**, если в ходе рефакторинга у модуля
  остался только один потребитель.
- **Новый роут** добавляется в `app/routes.tsx`: путь — новое поле в
  `ROUTES` (`shared/config/routes.ts`), `component` — `lazyRouteComponent`
  на mediator нужного view. Если экран не требует `search`/`params`/
  `loaderData` — mediator просто рендерит его напрямую. Если требует —
  mediator сам достаёт данные через `getRouteApi(ROUTES.x)`. Так роут
  остаётся code-split (чанк тянется лениво через `views/<name>`), а
  `app/routes.tsx` не знает ничего, кроме путей и того, какой mediator на
  них отвечает.
- **`kernel/types.ts` на будущее**: по мере роста стоит распилить общий файл
  типов на `model/`-типы внутри каждого `entities/<x>`, оставив в
  `kernel/types.ts` только то, что реально нужно 3+ доменам сразу. Не делали
  это сейчас, чтобы не раздувать рефакторинг ради неполной выгоды.
