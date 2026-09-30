import { q } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { body, fail, json } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const b = await body<{ email?: string; password?: string }>(req);
  const email = String(b.email ?? "").trim().toLowerCase();
  const u = (await q("SELECT id, pass_hash FROM users WHERE email = $1", [email]))[0];
  if (!u || !verifyPassword(String(b.password ?? ""), u.pass_hash))
    return fail("Имэйл эсвэл нууц үг буруу", 401);
  await createSession(Number(u.id));
  return json({ ok: true });
}
