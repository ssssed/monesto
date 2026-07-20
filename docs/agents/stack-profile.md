# Stack profile

Repo-specific conventions for this mobile app. Skills `implement` and `tdd` read this before generic references when it exists.

## Mobile

- **Framework:** React Native with Expo (Expo Router)
- **Language:** TypeScript
- **Source path:** `app/` (screens/routes), `components/`, `hooks/`, `lib/`, `stores/`
- **Navigation:** Expo Router (file-based routing under `app/`)
- **Local database:** SQLite via `expo-sqlite`
- **DB layer path:** `lib/db/` (schema, migrations, queries)
- **Client state:** Zustand (`stores/`)

## Test runners

- **Unit / component:** Jest + `@testing-library/react-native` (Expo default)
- **E2E (optional):** Maestro or Detox

## Notes

- Prefer Expo-managed workflow unless a native module requires a dev build.
- SQLite schema changes: versioned migrations in `lib/db/migrations/`.
- Zustand stores live in `stores/` — one file per domain slice (e.g. `stores/auth-store.ts`).
