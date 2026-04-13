export function initializeDatabase(db) {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS brands (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      website     TEXT,
      fonts       TEXT,
      colors      TEXT NOT NULL,
      tagline     TEXT,
      brand_values TEXT NOT NULL,
      aesthetic   TEXT NOT NULL,
      tone        TEXT NOT NULL,
      overview    TEXT NOT NULL,
      logo_path   TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id    INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      description TEXT,
      ad_type     TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS generations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      prompt      TEXT NOT NULL,
      image_path  TEXT NOT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe migration: add logo_path column if missing (for pre-existing DBs)
  const cols = db.prepare("PRAGMA table_info(brands)").all();
  if (!cols.some(c => c.name === 'logo_path')) {
    db.exec('ALTER TABLE brands ADD COLUMN logo_path TEXT');
  }
}
