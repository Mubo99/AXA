import { q } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { body, fail, json } from "@/lib/http";

export const runtime = "nodejs";

const AVATARS = ["🧠", "🦊", "🐯", "🦉", "🐺", "🐼", "🦁", "🐸", "🐵", "🐙", "🦄", "🐲", "🚀", "🎯", "📚", "⭐"];

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return fail("Нэвтрээгүй", 401);
  const b = await body<{ name?: string; avatar?: string }>(req);
  const name = String(b.name ?? "").trim().slice(0, 40);
  const avatar = String(b.avatar ?? "");
  if (!name) return fail("Нэрээ оруулна уу");
  if (!AVATARS.includes(avatar)) return fail("Зураг буруу байна");
  await q("UPDATE users SET name=$2, avatar=$3 WHERE id=$1", [u.id, name, avatar]);
  return json({ user: { email: u.email, name, avatar } });
}
