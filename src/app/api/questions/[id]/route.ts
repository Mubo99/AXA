import { q } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { parseId } from "@/lib/questions";
import { fail, json } from "@/lib/http";

export const runtime = "nodejs";

// Зөвхөн өөрийн нэмсэн асуултыг устгана.
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const u = await currentUser();
  if (!u) return fail("Нэвтрээгүй", 401);
  const id = parseId((await ctx.params).id);
  if (id === null) return fail("Олдсонгүй", 404);
  const r = await q("DELETE FROM questions WHERE id=$1 AND owner_id=$2 RETURNING id", [id, u.id]);
  if (r.length === 0) return fail("Олдсонгүй", 404);
  return json({ ok: true });
}
