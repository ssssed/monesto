# Codestyle и архитектура для новых приложений monesto

Feature-Sliced Design +
eslint-plugin-boundaries и предназначены для нового приложения с нуля. Задача — сразу
писать код в этой архитектуре и в этом стиле, не адаптируя её под то, что уже есть в
других приложениях монорепо.

## 1. Архитектура: Feature-Sliced Design

Код в `src/` делится на слои, каждый слой — папка верхнего уровня. Слой ниже не знает о
слоях выше. Импорт разрешён только вниз или в рамках одного слоя.

```
src/
  app/         — точки входа, роутинг, провайдеры, страницы (Next.js app router и т.п.)
  views/       — страницы приложения целиком (композиция widgets/features/entities)
  widgets/     — самостоятельные крупные блоки UI (header, footer, список сущностей)
  features/    — пользовательские сценарии/действия (edit-x, delete-x, add-x, confirm-x)
  entities/    — бизнес-сущности и данные о них (user, order, application, ...)
  kernel/      — сквозная инфраструктура домена: auth, api-клиент, контексты, доступные
                 всем нижним и себе подобным, но не выше
  shared/      — переиспользуемые технические примитивы без знания о домене: ui-кит,
                 хелперы, конфиг, форматирование, роутинг
```

Порядок слоёв сверху вниз: `app → views → widgets → features → entities → kernel →
shared`. Слой может импортировать только слои строго ниже себя (или `shared`/`kernel` из
любого места) — никогда выше.

### Правила границ (eslint-plugin-boundaries)

Прописать `eslint-plugin-boundaries` в конфиге нового приложения с такими правилами:

- `entry-point`: слои `views`, `widgets`, `features`, `entities`, `kernel` можно
  импортировать только через их `index.ts` (публичный экспорт). Прямой импорт файла из
  недр чужого слайса — запрещён. Слои `app`, `kernel`, `shared` открыты полностью (это
  инфраструктура, а не бизнес-слайсы). Исключение: `entities/*/@x/*` — специальный
  публичный API для кросс-импорта между сущностями.
- `element-types`: каждый слой не должен импортировать слои выше себя (см. таблицу):

  | Слой       | Не может импортировать                            |
  | ---------- | ------------------------------------------------- |
  | `views`    | `app`                                             |
  | `widgets`  | `app`, `views`                                    |
  | `features` | `app`, `views`, `widgets`                         |
  | `entities` | `app`, `views`, `widgets`, `features`             |
  | `kernel`   | `app`, `views`, `widgets`, `features`, `entities` |
  | `shared`   | всё вышеперечисленное                             |

- Горизонтальные запреты: `view` не импортирует другой `view`, `widget` не импортирует
  другой `widget`, `feature` не импортирует другую `feature`. Если двум фичам/виджетам
  нужен общий код — он выносится в `entities`, `kernel` или `shared`, а не тянется
  напрямую соседом.

### Внутренняя структура слайса

Каждый слайс (папка внутри `features/`, `entities/`, `widgets/`) — по возможности:

```
features/edit-application/
  index.ts        — публичный экспорт слайса (единственная точка входа снаружи)
  model/          — состояние, сторы, бизнес-логика, типы
  ui/             — React-компоненты
  api/            — обращения к бэкенду (если специфично для слайса)
  lib/            — вспомогательные чистые функции слайса
  config/         — константы/конфигурация слайса
```

`index.ts` реэкспортирует только то, что нужно снаружи — не `export *`.

## 2. Именование

| Сущность                        | Стиль                                         | Пример                                         |
| ------------------------------- | --------------------------------------------- | ---------------------------------------------- |
| Папка слайса                    | `kebab-case`, глагол-действие для features    | `edit-application`, `delete-draft-application` |
| Файл компонента                 | `kebab-case.tsx`                              | `confirm-change-active-member.tsx`             |
| Файл модели/стора               | `model.ts` внутри `model/`                    | `features/x/model/model.ts`                    |
| CSS-модуль                      | `<component>.module.css`, рядом с компонентом | `styles.module.css`                            |
| API-сервис                      | `<domain>.service.ts`, класс `XService`       | `users.service.ts` → `UsersService`            |
| Типы                            | `types.ts` внутри `model/`                    | `model/types.ts`                               |
| Тесты                           | рядом с файлом, `*.test.ts`                   | `language.test.ts`                             |
| React-компонент (идентификатор) | `PascalCase`                                  | `ConfirmChangeActiveMember`                    |
| Хуки                            | `use-kebab-case.ts`, экспорт `useCamelCase`   | `use-modal.tsx` → `useModal`                   |

Название feature-слайса — это глагол/действие (`add-`, `edit-`, `delete-`, `confirm-`,
`duplicate-`), не существительное — существительные (домены) идут в `entities`.

## 3. Форматирование (prettier/eslint)

```json
{
  "trailingComma": "none",
  "tabWidth": 2,
  "printWidth": 120,
  "useTabs": true,
  "semi": true,
  "singleQuote": true,
  "jsxSingleQuote": true,
  "arrowParens": "avoid",
  "quoteProps": "consistent",
  "bracketSameLine": false,
  "bracketSpacing": true,
  "singleAttributePerLine": true
}
```

- Отступ — таб, не пробелы.
- Кавычки одинарные везде, включая JSX-атрибуты.
- Без хвостовой запятой.
- Скобки у стрелочной функции с одним аргументом не ставятся: `x => x`.
- Один JSX-атрибут — одна строка, если атрибутов больше одного (`singleAttributePerLine`).
- `printWidth: 120`.

### Сортировка импортов (`eslint-plugin-simple-import-sort`)

Группы сверху вниз, пустая строка между группами:

1. `react`, `next`, внешние пакеты (`^@?\w`)
2. `test`/`tests`
3. `@/app/*`
4. `@/views/*`
5. `@/widgets/*`
6. `@/features/*`
7. `@/entities/*`
8. `@/kernel/*`
9. `@/shared/*`
10. Относительные вверх (`../`)
11. Относительные текущей папки (`./`)
12. Импорты стилей (`*.css`, `*.less`, `*.scss`)

Алиас `@/*` → `src/*`, прописать в `tsconfig.json`. Импорт всегда через алиас для чужих
слоёв, относительные импорты — только внутри одного слайса.

Дополнительно: `unused-imports/no-unused-imports: error`, `import/newline-after-import:
error`, `no-console` разрешён только для `warn`/`error`/`info`.

## 4. Компоненты

- Клиентские интерактивные компоненты — директива `'use client'` первой строкой файла
  (если фреймворк это поддерживает/требует).
- Компонент — стрелочная функция, экспортируемая константа:

  ```tsx
  export const ConfirmChangeActiveMember = () => {
    const opened = useStore(confirmChangeActiveMemberModal.opened);
    ...
    return (...);
  };
  ```

- Тип пропсов — инлайн в аргументе для маленьких компонентов, отдельный `type Props`
  для более сложных.
- Деструктуризация из сторов/контекстов в начале тела функции, до JSX.
- Условный рендер — тернарник `condition ? <X /> : null`, не `&&`.
- Стили — CSS-модуль рядом с компонентом (`styles.module.css`), импорт как `cl` или
  `styles`: `import cl from './styles.module.css'`.
- Никаких комментариев, объясняющих «что делает код» — только там, где не очевиден
  «почему» (скрытое ограничение, обход бага).

## 5. Состояние (nanostores-подобный паттерн)

Общее модальное/UI-состояние — через маленький класс-обёртку над атомами стора, не через
голый `useState`, если состояние нужно снаружи компонента (например, открыть модалку из
обработчика вне React-дерева):

```ts
export class Modal<Data = never> {
  protected _opened = atom<boolean>(false);
  protected _data = atom<Data | undefined>();

  public open(data?: Data) {
    this._opened.set(true);
    if (data) this._data.set(data);
  }
  public close(data?: Data) {
    this._opened.set(false);
    if (data) this._data.set(data);
  }
  public get opened() {
    return this._opened;
  }
  public get data() {
    return this._data;
  }
}
```

В компоненте — `useStore(someModal.opened)` из `@nanostores/react`. Модалка/стор
создаётся один раз как экспортируемый инстанс в `model/model.ts` слайса, а не
пересоздаётся в компоненте.

Бизнес-логика, оборачивающая действие (например, «подтвердить, если пользователь на
определённой странице»), — отдельная функция-декоратор в `model/model.ts`, а не внутри
JSX-обработчика:

```ts
const withConfirmChangeActiveMember = (selectMember: SelectMemberHandler): SelectMemberHandler => {
  return async (member, reloadContext) => { ... };
};

export const enhancedSelectMember = withConfirmChangeActiveMember(selectMember);
```

## 6. API-слой

Один домен — один класс-неймспейс со статическими методами, без инстанцирования:

```ts
export class UsersService {
  static baseUrl = ApiUrls.USERS_ME;

  static async getMe(config?: AxiosRequestConfig) {
    return axiosInstance.get<UserData>(`${this.baseUrl}`, config);
  }

  static async patchUser(formData: FormData) {
    return axiosInstance.patch<PatchUser>(`${this.baseUrl}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
}
```

- Один экземпляр `axiosInstance` на приложение, настроенный в `kernel/api`.
- URL-константы — в отдельном месте (`ApiUrls`), не разбросаны строковыми литералами по
  сервисам.
- Типы ответов/запросов — в `model/types.ts` соответствующего слайса, не инлайн в
  сервисе.
- Ошибки API не проглатываются молча: минимум `console.error`, без избыточного
  try/catch там, где ошибка и так должна всплыть выше (в react-query/обработчик формы).

## 7. Views: mediator + view-model

Для крупных страниц (`views/*`) — разделение:

- `mediator/page.tsx` — сборка страницы из `ui/*`-секций, без собственной бизнес-логики,
  просто композиция.
- `ui/` — независимые секции страницы, каждая в своей папке со своим `.module.css`.
- `view-model/` — хуки, вычисляющие производное состояние специально для этой страницы
  (`use-animate-placeholder.ts`, `use-observer.ts`), не размещать такую логику в
  `entities`/`kernel`, если она нужна только одной странице.
- `index.ts` слайса реэкспортирует то, что нужно `app/`.

Если у страницы разная вёрстка под десктоп/мобайл — суффикс `.mobile.tsx` /
`.mobile.module.css` рядом с обычным файлом, а не отдельная параллельная папка.

## 8. Тесты

- Юнит-тесты — рядом с тестируемым файлом (`language.ts` → `language.test.ts`).
- `describe` — имя тестируемой функции, `it` — человекочитаемое описание кейса, не
  повтор сигнатуры.
- Формы/интеграционные сценарии — в отдельной папке `tests/` на уровне приложения
  (e2e/интеграционные, не юнит).

## 9. Общие принципы

- Публичный API слайса — только `index.ts`. Всё остальное внутри слайса — приватная
  деталь реализации, недоступная извне (и это должно быть зафиксировано линтером, а не
  только на словах).
- Не абстрагировать заранее и не добавлять обработку кейсов, которые не могут
  произойти — валидация только на границах системы.
- Один файл — одна ответственность: не смешивать вёрстку, стор и API-вызовы в одном
  файле — они разъезжаются по `ui/`, `model/`, `api/` слайса.
- Новый слайс всегда начинается с вопроса «это `feature` (действие), `entity` (данные о
  сущности) или `widget` (крупный самостоятельный блок)?» — от ответа зависит, в какую
  папку он ложится.
- Не тянуть код наверх по слоям «для удобства» — если тянет, значит общий код должен
  быть на уровень (или несколько) ниже.
