export const SCHEMA_VERSION = 3;

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS income_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  income_kind TEXT NOT NULL DEFAULT 'fixed',
  amount REAL,
  monthly_amount REAL,
  is_one_time INTEGER NOT NULL DEFAULT 0,
  recurrence TEXT NOT NULL DEFAULT 'monthly',
  payment_day INTEGER,
  is_primary INTEGER NOT NULL DEFAULT 0,
  primary_payment_day INTEGER,
  specific_date TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  recurrence TEXT NOT NULL DEFAULT 'monthly',
  due_day INTEGER,
  specific_date TEXT
);

CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'rub',
  purpose TEXT,
  goal_amount REAL,
  current_amount REAL NOT NULL DEFAULT 0,
  steam_inventory_url TEXT,
  icon TEXT NOT NULL DEFAULT 'wallet-outline',
  bg_color TEXT NOT NULL DEFAULT '#DBEAFE',
  icon_color TEXT NOT NULL DEFAULT '#2563EB',
  cost_basis_rub REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS asset_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  amount_delta REAL NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  cost_rub REAL,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS distribution_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  value REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'rub',
  target_asset_id INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (target_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS allocation_confirmations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_id INTEGER NOT NULL,
  cycle_key TEXT NOT NULL,
  confirmed_at TEXT NOT NULL,
  amount_rub REAL NOT NULL,
  UNIQUE(rule_id, cycle_key),
  FOREIGN KEY (rule_id) REFERENCES distribution_rules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS allocation_rejections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_id INTEGER NOT NULL,
  cycle_key TEXT NOT NULL,
  rejected_at TEXT NOT NULL,
  UNIQUE(rule_id, cycle_key),
  FOREIGN KEY (rule_id) REFERENCES distribution_rules(id) ON DELETE CASCADE
);
`;

export const MIGRATIONS: Record<number, string[]> = {
  2: [
    `ALTER TABLE assets ADD COLUMN icon TEXT NOT NULL DEFAULT 'wallet-outline'`,
    `ALTER TABLE assets ADD COLUMN bg_color TEXT NOT NULL DEFAULT '#DBEAFE'`,
    `ALTER TABLE assets ADD COLUMN icon_color TEXT NOT NULL DEFAULT '#2563EB'`,
    `ALTER TABLE assets ADD COLUMN cost_basis_rub REAL NOT NULL DEFAULT 0`,
    `ALTER TABLE asset_transactions ADD COLUMN cost_rub REAL`,
    `CREATE TABLE IF NOT EXISTS allocation_confirmations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_id INTEGER NOT NULL,
      cycle_key TEXT NOT NULL,
      confirmed_at TEXT NOT NULL,
      amount_rub REAL NOT NULL,
      UNIQUE(rule_id, cycle_key),
      FOREIGN KEY (rule_id) REFERENCES distribution_rules(id) ON DELETE CASCADE
    )`,
  ],
  3: [
    `CREATE TABLE IF NOT EXISTS allocation_rejections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_id INTEGER NOT NULL,
      cycle_key TEXT NOT NULL,
      rejected_at TEXT NOT NULL,
      UNIQUE(rule_id, cycle_key),
      FOREIGN KEY (rule_id) REFERENCES distribution_rules(id) ON DELETE CASCADE
    )`,
  ],
};
