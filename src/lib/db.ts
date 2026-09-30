import postgres from "postgres";

/**
 * Өгөгдлийн сан: DATABASE_URL (Supabase Postgres) байвал түүнийг, байхгүй бол
 * локал хөгжүүлэлтэд зориулсан PGlite (./data/pglite) ашиглана.
 */
export type Row = Record<string, any>;
export type Q = (text: string, params?: unknown[]) => Promise<Row[]>;

type Driver = { q: Q; tx: <T>(fn: (q: Q) => Promise<T>) => Promise<T> };

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    pass_hash TEXT NOT NULL,
    plus_until BIGINT NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at BIGINT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_invoice_no TEXT NOT NULL UNIQUE,
    qpay_invoice_id TEXT,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    note TEXT,
    last_check BIGINT,
    created_at BIGINT NOT NULL,
    paid_at BIGINT
  );
  ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_used BOOLEAN NOT NULL DEFAULT FALSE;
  ALTER TABLE payments ADD COLUMN IF NOT EXISTS trial_until BIGINT;
  ALTER TABLE payments ADD COLUMN IF NOT EXISTS prev_plus BIGINT;
`;

async function make(): Promise<Driver> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const sql = postgres(url, { prepare: false, max: 3, idle_timeout: 20, ssl: "require" });
    await sql.unsafe(SCHEMA);
    return {
      q: async (text, params = []) => [...(await sql.unsafe(text, params as never[]))] as Row[],
      tx: (fn) =>
        sql.begin((t) =>
          fn(async (text, params = []) => [...(await t.unsafe(text, params as never[]))] as Row[]),
        ) as never,
    };
  }
  // Локал: PGlite (Postgres-ийн WASM хувилбар). Production-д хэзээ ч ашиглагдахгүй.
  const modName = "@electric-sql/pglite";
  const { PGlite } = await import(/* webpackIgnore: true */ modName);
  const { mkdirSync } = await import("node:fs");
  mkdirSync("./data", { recursive: true });
  const db = new PGlite("./data/pglite");
  await db.exec(SCHEMA);
  return {
    q: async (text, params = []) => (await db.query(text, params)).rows as Row[],
    tx: (fn) =>
      db.transaction((t: any) =>
        fn(async (text, params = []) => (await t.query(text, params)).rows as Row[]),
      ),
  };
}

const g = globalThis as unknown as { __axaDb?: Promise<Driver> };
const driver = () => {
  if (!g.__axaDb) {
    // Холболт унавал кэшлэхгүй: дараагийн хүсэлт дахин оролдоно.
    g.__axaDb = make().catch((e) => {
      g.__axaDb = undefined;
      throw e;
    });
  }
  return g.__axaDb;
};

export const q: Q = async (text, params) => (await driver()).q(text, params);
export const tx = async <T,>(fn: (q: Q) => Promise<T>): Promise<T> => (await driver()).tx(fn);
