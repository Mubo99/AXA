import { q } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { body, fail, json } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const b = await body<{ email?: string; name?: string; password?: string }>(req);
  const email = String(b.email ?? "").trim().toLowerCase();
  const name = String(b.name ?? "").trim().slice(0, 40);
  const password = String(b.password ?? "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Имэйл буруу байна");
  if (!name) return fail("Нэрээ оруулна уу");
  if (password.length < 6) return fail("Нууц үг хамгийн багадаа 6 тэмдэгт");
  const rows = await q(
    `INSERT INTO users (email, name, pass_hash, created_at) VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING RETURNING id`,
    [email, name, hashPassword(password), Date.now()],
  );
  if (rows.length === 0) return fail("Энэ имэйл бүртгэлтэй байна", 409);
  await createSession(Number(rows[0].id));
  return json({ ok: true });
}
