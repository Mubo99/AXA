import crypto from "node:crypto";
import { cookies } from "next/headers";
import { q } from "./db";

const COOKIE = "axa_session";
const SESSION_DAYS = 30;

export type User = {
  id: number;
  email: string;
  name: string;
  plus_until: number;
  avatar: string | null;
};

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export async function createSession(userId: number): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + SESSION_DAYS * 86400_000;
  await q("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)", [
    sha(token),
    userId,
    expires,
  ]);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expires),
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await q("DELETE FROM sessions WHERE token_hash = $1", [sha(token)]);
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const rows = await q(
    `SELECT u.id, u.email, u.name, u.plus_until, u.avatar FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > $2`,
    [sha(token), Date.now()],
  );
  const r = rows[0];
  return r
    ? {
        id: Number(r.id),
        email: r.email,
        name: r.name,
        plus_until: Number(r.plus_until),
        avatar: r.avatar ?? null,
      }
    : null;
}

export const isPlus = (u: User | null) => !!u && u.plus_until > Date.now();
