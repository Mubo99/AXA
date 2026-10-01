import { q } from "@/lib/db";
import { currentUser, isPlus } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { MAX_USER_TOPICS } from "@/lib/questions";
import { body, fail, json } from "@/lib/http";

export const runtime = "nodejs";

// Өөрийн сэдэв үүсгэх. id-г клиент үүсгэнэ (давхар дуудахад аюулгүй).
export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return fail("Нэвтрээгүй", 401);
  if (!isPlus(u) && !isAdminUser(u)) return fail("PLUS эрх шаардлагатай", 403);
  const b = await body<{ id?: string; name?: string; color?: string }>(req);
  const id = String(b.id ?? "");
  const name = String(b.name ?? "").trim().slice(0, 30);
  const color = String(b.color ?? "");
  if (!/^custom_[a-z0-9]{6,40}$/.test(id)) return fail("Сэдвийн код буруу");
  if (!name) return fail("Сэдвийн нэрийг оруулна уу");
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return fail("Өнгө буруу байна");
  const n = Number((await q("SELECT COUNT(*) AS n FROM user_topics WHERE owner_id=$1", [u.id]))[0].n);
  if (n >= MAX_USER_TOPICS) return fail(`Хамгийн ихдээ ${MAX_USER_TOPICS} сэдэв үүсгэж болно`);
  await q(
    "INSERT INTO user_topics (id, owner_id, name, color) VALUES ($1,$2,$3,$4) ON CONFLICT (owner_id, id) DO NOTHING",
    [id, u.id, name, color],
  );
  return json({ ok: true });
}
