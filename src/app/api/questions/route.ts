import { q } from "@/lib/db";
import { currentUser, isPlus } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import {
  MAX_USER_QUESTIONS,
  ensureSeed,
  insertQuestion,
  isOfficialTopic,
  toClient,
  userHasTopic,
  validate,
} from "@/lib/questions";
import { body, fail, json } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Албан ёсны асуултууд (бүгдэд) + ЗӨВХӨН нэвтэрсэн хэрэглэгчийн өөрийн асуулт, сэдэв.
export async function GET() {
  const u = await currentUser();
  if (!u) return fail("Нэвтрээгүй", 401);
  await ensureSeed();
  const cols = "id, owner_id, topic, q, a, c, e, diff";
  const official = await q(`SELECT ${cols} FROM questions WHERE owner_id IS NULL ORDER BY id`);
  const mine = await q(`SELECT ${cols} FROM questions WHERE owner_id=$1 ORDER BY id DESC`, [u.id]);
  const topics = await q("SELECT id, name, color FROM user_topics WHERE owner_id=$1 ORDER BY name", [u.id]);
  return json({
    official: official.map(toClient),
    mine: mine.map(toClient),
    topics,
  });
}

// Өөрийн асуулт нэмэх (PLUS). { items: [...] } хэлбэрээр олноор оруулж болно (хуучин төхөөрөмжөөс шилжүүлэх).
export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return fail("Нэвтрээгүй", 401);
  if (!isPlus(u) && !isAdminUser(u)) return fail("Өөрийн асуулт нэмэхэд PLUS эрх шаардлагатай", 403);
  await ensureSeed();
  const b = await body<{ items?: unknown[] }>(req);
  const items = Array.isArray(b.items) ? b.items.slice(0, 200) : [b];

  const count = Number((await q("SELECT COUNT(*) AS n FROM questions WHERE owner_id=$1", [u.id]))[0].n);
  if (count + items.length > MAX_USER_QUESTIONS) return fail(`Хамгийн ихдээ ${MAX_USER_QUESTIONS} асуулт нэмэх боломжтой`, 400);

  const created = [];
  let skipped = 0;
  for (const raw of items) {
    const v = validate(raw);
    if ("error" in v) {
      if (items.length === 1) return fail(v.error);
      skipped++;
      continue;
    }
    if (!isOfficialTopic(v.ok.topic) && !(await userHasTopic(u.id, v.ok.topic))) {
      if (items.length === 1) return fail("Сэдэв олдсонгүй");
      skipped++;
      continue;
    }
    created.push(await insertQuestion(u.id, v.ok));
  }
  if (Array.isArray(b.items)) return json({ created: created.length, skipped });
  return json({ question: created[0] });
}
