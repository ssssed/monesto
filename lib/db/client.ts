import * as SQLite from 'expo-sqlite';

import { CREATE_TABLES_SQL, MIGRATIONS, SCHEMA_VERSION } from '@/lib/db/schema';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndMigrate();
  }
  return dbPromise;
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('monesto.db');
  await db.execAsync(CREATE_TABLES_SQL);

  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    ['schema_version'],
  );

  if (!row) {
    await db.runAsync('INSERT INTO app_meta (key, value) VALUES (?, ?)', [
      'schema_version',
      String(SCHEMA_VERSION),
    ]);
    await db.runAsync('INSERT INTO app_meta (key, value) VALUES (?, ?)', [
      'onboarding_completed',
      'false',
    ]);
    return db;
  }

  let version = Number(row.value);
  while (version < SCHEMA_VERSION) {
    const next = version + 1;
    const statements = MIGRATIONS[next] ?? [];
    for (const sql of statements) {
      try {
        await db.execAsync(sql);
      } catch {
        // column/table may already exist on partial migrate
      }
    }
    version = next;
    await db.runAsync(
      'INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      ['schema_version', String(version)],
    );
  }

  return db;
}

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}

export async function isOnboardingCompleted(): Promise<boolean> {
  return (await getMeta('onboarding_completed')) === 'true';
}

export async function completeOnboarding(): Promise<void> {
  await setMeta('onboarding_completed', 'true');
}

/** Удаляет все пользовательские данные и сбрасывает онбординг. */
export async function clearAllData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM allocation_confirmations;
    DELETE FROM asset_transactions;
    DELETE FROM distribution_rules;
    DELETE FROM assets;
    DELETE FROM expenses;
    DELETE FROM income_sources;
  `);
  await setMeta('onboarding_completed', 'false');
}
