import { q } from "@/lib/db";
import { createSession, currentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { body, fail, json } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return fail("Нэвтрээгүй", 401);
  const b = await body<{ current?: string; next?: string }>(req);
  const current = String(b.current ?? "");
  const next = String(b.next ?? "");
  if (next.length < 6) return fail("Шинэ нууц үг хамгийн багадаа 6 тэмдэгт");
  if (next === current) return fail("Шинэ нууц үг хуучинтайгаа адил байна");
  const row = (await q("SELECT pass_hash FROM users WHERE id=$1", [u.id]))[0];
  if (!row || !verifyPassword(current, row.pass_hash)) return fail("Одоогийн нууц үг буруу байна", 401);
  await q("UPDATE users SET pass_hash=$2 WHERE id=$1", [u.id, hashPassword(next)]);
  // Бусад төхөөрөмж дээрх нэвтрэлтийг хүчингүй болгож, энэ төхөөрөмжид шинэ нэвтрэлт өгнө.
  await q("DELETE FROM sessions WHERE user_id=$1", [u.id]);
  await createSession(u.id);
  return json({ ok: true });
}
