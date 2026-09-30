import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const g = globalThis as unknown as { __axaDb?: DatabaseSync };

function open(): DatabaseSync {
  const file = path.resolve(process.env.DATABASE_PATH || "./data/axa.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      pass_hash TEXT NOT NULL,
      plus_until INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sender_invoice_no TEXT NOT NULL UNIQUE,
      qpay_invoice_id TEXT,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      paid_at INTEGER
    );
  `);
  try { db.exec("ALTER TABLE payments ADD COLUMN note TEXT"); } catch {}
  return db;
}

export const db: DatabaseSync = (g.__axaDb ??= open());
