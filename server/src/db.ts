import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** SQLite 单文件库；路径可用 env 覆盖（Docker 挂载卷） */
const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, '..', 'data', 'careeseek.db');

export function openDb(): Database.Database {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

export function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      plan_expires_at INTEGER,
      role TEXT NOT NULL DEFAULT 'user',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS llm_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      model TEXT NOT NULL,
      prompt_tokens INTEGER NOT NULL,
      completion_tokens INTEGER NOT NULL,
      prompt_cache_hit_tokens INTEGER NOT NULL DEFAULT 0,
      prompt_cache_miss_tokens INTEGER NOT NULL DEFAULT 0,
      cost_cent INTEGER NOT NULL,
      latency_ms INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_llm_usage_user_month ON llm_usage(user_id, created_at);

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      session_id TEXT NOT NULL,
      name TEXT NOT NULL,
      props_json TEXT NOT NULL,
      ts INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_events_user_ts ON events(user_id, ts);
    CREATE INDEX IF NOT EXISTS idx_events_name_ts ON events(name, ts);

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      plan TEXT NOT NULL,
      amount_cny INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      wx_order_id TEXT,
      qr_code TEXT,
      created_at INTEGER NOT NULL,
      paid_at INTEGER,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);

    CREATE TABLE IF NOT EXISTS prompts (
      key TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      updated_by TEXT,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS prompt_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL,
      content TEXT NOT NULL,
      version INTEGER NOT NULL,
      action TEXT NOT NULL DEFAULT 'update',
      created_by TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_prompt_versions_key ON prompt_versions(key);
  `);

  // 老库升级：users 表补 role 列（幂等）
  const cols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!cols.some((c) => c.name === 'role')) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
  }
}
