import { q } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { TOPICS } from "@/lib/topics";
import { ensureSeed, insertQuestion, isOfficialTopic, toClient, validate } from "@/lib/questions";
import { body, fail, json } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE = 30;

// Жагсаалт + статистик. ?owner=official|user|all &topic= &search= &page=
export async function GET(req: Request) {
  if (!(await requireAdmin())) return fail("Админ эрх шаардлагатай", 403);
  await ensureSeed();
  const sp = new URL(req.url).searchParams;
  const owner = sp.get("owner") || "official";
  const topic = sp.get("topic") || "";
  const search = (sp.get("search") || "").trim().slice(0, 100);
  const page = Math.max(1, Number(sp.get("page")) || 1);

  const where: string[] = [];
  const params: unknown[] = [];
  if (owner === "official") where.push("x.owner_id IS NULL");
  else if (owner === "user") where.push("x.owner_id IS NOT NULL");
  if (topic) {
    params.push(topic);
    where.push(`x.topic = $${params.length}`);
  }
  if (search) {
    // LIKE-ийн тусгай тэмдэгтүүдийг (%, _, \) энгийн тэмдэгт болгоно
    const escaped = search.split("\\").join("\\\\").split("%").join("\\%").split("_").join("\\_");
    params.push(`%${escaped}%`);
    where.push(`x.q ILIKE $${params.length}`);
  }
  const W = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const total = Number((await q(`SELECT COUNT(*) AS n FROM questions x ${W}`, params))[0].n);
  const rows = await q(
    `SELECT x.id, x.owner_id, x.topic, x.q, x.a, x.c, x.e, x.diff, u.email AS owner_email
     FROM questions x LEFT JOIN users u ON u.id = x.owner_id
     ${W} ORDER BY x.id DESC LIMIT ${PAGE} OFFSET ${(page - 1) * PAGE}`,
    params,
  );

  const byTopic = await q(
    `SELECT topic, (owner_id IS NULL) AS official, COUNT(*) AS n FROM questions GROUP BY topic, (owner_id IS NULL)`,
  );
  const stats = TOPICS.map((t) => ({
    id: t.id,
    name: t.name,
    official: Number(byTopic.find((r) => r.topic === t.id && r.official)?.n ?? 0),
    user: Number(byTopic.find((r) => r.topic === t.id && !r.official)?.n ?? 0),
  }));
  const totalOfficial = stats.reduce((s, t) => s + t.official, 0);
  const totalUser = Number((await q("SELECT COUNT(*) AS n FROM questions WHERE owner_id IS NOT NULL"))[0].n);

  return json({
    rows: rows.map((r) => ({ ...toClient(r), ownerEmail: r.owner_email ?? null })),
    total,
    page,
    pageSize: PAGE,
    stats: { topics: stats, totalOfficial, totalUser },
  });
}

// Албан ёсны асуулт нэмэх. { items: [...] } (≤200) хэлбэрээр олноор оруулж болно.
export async function POST(req: Request) {
  if (!(await requireAdmin())) return fail("Админ эрх шаардлагатай", 403);
  await ensureSeed();
  const b = await body<{ items?: unknown[] }>(req);
  const bulk = Array.isArray(b.items);
  const items = bulk ? (b.items as unknown[]).slice(0, 200) : [b];
  const created = [];
  const errors: string[] = [];
  for (let i = 0; i < items.length; i++) {
    const v = validate(items[i]);
    if ("error" in v) {
      if (!bulk) return fail(v.error);
      errors.push(`#${i + 1}: ${v.error}`);
      continue;
    }
    if (!isOfficialTopic(v.ok.topic)) {
      if (!bulk) return fail("Сэдэв буруу байна");
      errors.push(`#${i + 1}: сэдэв буруу (${v.ok.topic})`);
      continue;
    }
    created.push(await insertQuestion(null, v.ok));
  }
  return bulk ? json({ created: created.length, errors }) : json({ question: created[0] });
}
