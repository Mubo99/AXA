import { q } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { isOfficialTopic, parseId, toClient, validate } from "@/lib/questions";
import { body, fail, json } from "@/lib/http";

export const runtime = "nodejs";

// Албан ёсны болон хэрэглэгчийн асуултыг засна.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return fail("Админ эрх шаардлагатай", 403);
  const id = parseId((await ctx.params).id);
  if (id === null) return fail("Олдсонгүй", 404);
  const cur = (await q("SELECT id, owner_id, topic FROM questions WHERE id=$1", [id]))[0];
  if (!cur) return fail("Олдсонгүй", 404);
  const v = validate(await body(req));
  if ("error" in v) return fail(v.error);
  // Албан ёсны асуултын сэдэв албан ёсны сэдэв хэвээр байх ёстой; хэрэглэгчийнхийг сэдвийг нь хөдөлгөхгүй.
  if (cur.owner_id == null && !isOfficialTopic(v.ok.topic)) return fail("Сэдэв буруу байна");
  if (cur.owner_id != null) v.ok.topic = cur.topic;
  const r = await q(
    `UPDATE questions SET topic=$2, q=$3, a=$4, c=$5, e=$6, diff=$7, updated_at=$8 WHERE id=$1
     RETURNING id, owner_id, topic, q, a, c, e, diff`,
    [id, v.ok.topic, v.ok.q, JSON.stringify(v.ok.a), v.ok.c, v.ok.e, v.ok.diff, Date.now()],
  );
  return json({ question: toClient(r[0]) });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return fail("Админ эрх шаардлагатай", 403);
  const id = parseId((await ctx.params).id);
  if (id === null) return fail("Олдсонгүй", 404);
  const r = await q("DELETE FROM questions WHERE id=$1 RETURNING id", [id]);
  if (r.length === 0) return fail("Олдсонгүй", 404);
  return json({ ok: true });
}
