# @monesto/pwa-server

Backend API for [`apps/pwa`](../pwa): email/Telegram authentication, feature flags with an admin surface, FX rates, and the finance domain (income sources, expenses, assets, distribution rules, vacation periods).

This is a **brand new, fully independent** service — it does not share code, a database, or conventions with `apps/server` or `apps/webapp`. `apps/pwa` is not wired up to it yet; this package only reads `apps/pwa/src/lib/types.ts` as the source of truth for the domain shape.

## Stack

NestJS 11, Prisma 7 (`@prisma/adapter-pg`) + PostgreSQL, `class-validator`/`class-transformer`, Jest for tests, Swagger for docs.

## Setup

```bash
# from the repo root
npm install

cd apps/pwa-server
cp .env .env.local   # or just edit .env directly — it's gitignored
```

1. Point `DATABASE_URL` at a Postgres database (any local instance works, e.g. `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16-alpine`).
2. Apply migrations: `npx prisma migrate dev`
3. Seed the initial admin user (reads `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` from `.env`): `npm run seed`
4. Start the server: `npm run dev` (default port `3001`)

Swagger UI: `http://localhost:3001/api/docs` (raw JSON at `/api/docs-json`).

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `PORT` | `3001` | HTTP port |
| `CORS_ORIGIN` | allow all | Comma-separated list of allowed origins |
| `TELEGRAM_BOT_TOKEN` | — | Bot behind the Telegram **Login Widget** (configure the widget's domain in @BotFather) |
| `SESSION_TTL_MS` | 30 days | User session lifetime |
| `EMAIL_OTP_TTL_MS` | 10 min | Email code validity window |
| `EMAIL_OTP_MAX_ATTEMPTS` | 5 | Wrong-code attempts before the code is invalidated |
| `EMAIL_OTP_RESEND_INTERVAL_MS` | 60 sec | Minimum time between two `request-code` calls for the same email |
| `MAIL_PROVIDER` | `console` | `console` (logs the code, no email sent) or `smtp` |
| `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM` | — | Used only when `MAIL_PROVIDER=smtp` |
| `DEV_FIXED_EMAIL_CODES` | unset | Dev-only: `email1:code1,email2:code2` — these emails always get the given code instead of a random one (and skip the resend throttle). Local `.env` defaults to `root@root.com:000000,test@test.com:111111`. **Never set this in production.** |
| `FX_REFRESH_CRON` | `0 * * * *` (hourly) | Cron expression for the FX refresh job |
| `FX_BASE_CURRENCIES` | `USD` | Comma-separated base currencies to refresh |
| `FX_QUOTE_CURRENCIES` | all quotes returned by the provider | Optional comma-separated allowlist of quote currencies to persist |
| `ADMIN_SESSION_TTL_MS` | 30 days | Admin session lifetime |
| `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` | — | Used only by `npm run seed` to upsert the first admin user |

## Auth model

Two independent, non-overlapping login flows for `User`, both issuing the same kind of bearer `Session` token:

- **Email OTP** (`POST /auth/email/request-code` → `POST /auth/email/verify-code`) — no password, a 6-digit code is emailed on every login.
- **Telegram Login Widget** (`POST /auth/telegram`) — for the website login button, *not* the Telegram Mini App `initData` scheme. Verification uses `secret_key = SHA256(bot_token)`, distinct from the Mini App's `HMAC-SHA256("WebAppData", token)` scheme.

A `User` may have `email`, `telegramId`, or both set independently — there is **no account-linking** between the two flows yet (documented limitation, not a bug: logging in with Telegram after having registered by email creates a second, separate account).

Admins (`AdminUser`) are a completely separate model/guard stack, authenticated by email+password (`POST /admin/auth/login`), used only for the feature-flags admin API consumed by `apps/pwa-admin`.

### Local dev accounts

`.env` ships with two conveniences so you don't have to read codes out of server logs while developing:

- `root@root.com` — seeded as the **admin** account (`npm run seed`, password `root12345` from `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD`), and also gets OTP code `000000` for the regular email-login flow (`DEV_FIXED_EMAIL_CODES`) — it's two separate records (`AdminUser` vs `User`), same email string.
- `test@test.com` — a plain `User`, always gets OTP code `111111`. Created on first `verify-code` call, no seeding needed.

## FX rates

`src/modules/fx` refreshes rates hourly via a provider abstraction (`FxProvider` interface + `FX_PROVIDERS` DI token). Today there is one provider (`open-er-api`, USD only); adding EUR or another data source later is one new provider class plus one line in `fx.module.ts` — no changes to the service, scheduler, or controller.

## Reports (salary/expense/asset calculation)

`src/modules/reports` is the server-side port of `apps/pwa`'s pay-cycle calculation logic (`apps/pwa/src/lib/report/*`, `credit/plan.ts`, `year-summary/computeYearSummary.ts`) — the future `apps/pwa` should become a pure display layer over these endpoints instead of computing anything itself locally:

- `GET /reports/current?today=&cyclePaymentDay=&cycleNominalDate=` — full pay-cycle report (income/expense lines, rule allocations, free money, per-asset summary). `today`/dates are optional `YYYY-MM-DD` query params — pass the client's own local date; omitted defaults to server time.
- `GET /reports/cycles?today=` — available pay cycles for a cycle-switcher UI.
- `GET /reports/year-summary?now=` — year-over-year growth per savings asset (credit assets excluded).
- `GET /reports/rules-budget?today=&excludeRuleId=` / `POST /reports/rules-budget/draft` — % of remainder consumed by distribution rules, for a rule-editing screen's live preview.
- `POST /reports/allocations/:ruleId/confirm` / `.../reject` (body `{cycleKey}`) — confirming **really moves money**: the allocation amount is recomputed server-side (never trusted from the client), then deposited into the target asset via `AssetsService.createTransaction` (credit assets re-run early-repayment math). Idempotent per `(ruleId, cycleKey)` via a DB unique constraint — repeat calls return `already_confirmed`/`already_rejected` instead of erroring.

The calculation itself lives in `src/modules/reports/calc/` as framework-free pure functions (ported 1:1 from the client's algorithms, field names translated from the client's `snake_case` to Prisma's `camelCase`). Two deliberate differences from the client version: the API returns **structured data, not pre-rendered Russian strings** (no `detail` fields — e.g. an allocation carries `ruleType`/`value`/`targetAssetName` instead of `"20% → Копилка"`), and every date-dependent calc function takes an explicit date parameter with **no hidden `new Date()` default** (the client version defaulted several credit-math helpers to browser-local "now", which has no equivalent on a server).

## Testing

```bash
npm run test        # unit tests (PrismaService mocked)
npm run test:cov     # with coverage
npm run test:e2e     # boots the app, hits a couple of public routes
```

## Known limitations (by design, for v1)

- No account-linking between email and Telegram logins.
- No password reset flow (email login is OTP-only, so there's no password to reset).
- FX rates are stored append-only with no retention/cleanup job yet.
