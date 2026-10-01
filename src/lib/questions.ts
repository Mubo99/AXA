import { q as query, tx, type Row } from "./db";
import { TOPIC_IDS } from "./topics";
import seed from "./seed-questions.json";

export type QuestionInput = {
  topic: string;
  q: string;
  a: string[];
  c: number;
  e: string | null;
  diff: number;
};

export type ClientQuestion = {
  id: string;
  topic: string;
  q: string;
  a: string[];
  c: number;
  e: string | null;
  diff: number;
  custom: boolean;
};

export const MAX_USER_QUESTIONS = 500;
export const MAX_USER_TOPICS = 30;

/** Албан ёсны асуултыг анх удаа өгөгдлийн санд нэг л удаа оруулна (дараа нь админ засна). */
let seeding: Promise<void> | null = null;
export function ensureSeed(): Promise<void> {
  if (!seeding) {
    seeding = doSeed().catch((e) => {
      seeding = null;
      throw e;
    });
  }
  return seeding;
}

async function doSeed() {
  await tx(async (q) => {
    const ins = await q(
      "INSERT INTO meta (key, value) VALUES ('official_seeded', '1') ON CONFLICT (key) DO NOTHING RETURNING key",
    );
    if (ins.length === 0) return;
    const now = Date.now();
    const rows = seed as { topic: string; q: string; a: string[]; c: number; e: string | null; diff: number }[];
    for (let i = 0; i < rows.length; i += 40) {
      const chunk = rows.slice(i, i + 40);
      const params: unknown[] = [];
      const values = chunk.map((r, j) => {
        const b = j * 7;
        params.push(r.topic, r.q, JSON.stringify(r.a), r.c, r.e, r.diff, now);
        return `(NULL, $${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7}, $${b + 7})`;
      });
      await q(
        `INSERT INTO questions (owner_id, topic, q, a, c, e, diff, created_at, updated_at) VALUES ${values.join(",")}`,
        params,
      );
    }
  });
}

export function toClient(r: Row): ClientQuestion {
  let a: string[] = [];
  try {
    a = JSON.parse(r.a);
  } catch {}
  const owned = r.owner_id != null;
  return {
    id: `${owned ? "u" : "o"}_${r.id}`,
    topic: r.topic,
    q: r.q,
    a,
    c: Number(r.c),
    e: r.e ?? null,
    diff: r.diff == null ? 2 : Number(r.diff),
    custom: owned,
  };
}

/** Хэрэглэгчээс ирсэн асуултыг шалгаж цэвэрлэнэ. Алдаа байвал мессеж буцаана. */
export function validate(raw: unknown): { ok: QuestionInput } | { error: string } {
  const b = (raw ?? {}) as Record<string, unknown>;
  const q = String(b.q ?? "").trim();
  if (q.length < 3 || q.length > 500) return { error: "Асуулт 3–500 тэмдэгт байх ёстой" };
  if (!Array.isArray(b.a)) return { error: "Хариултууд буруу байна" };
  const a = b.a.map((x) => String(x ?? "").trim());
  if (a.length < 2 || a.length > 6) return { error: "2–6 хариулт байх ёстой" };
  if (a.some((x) => x.length < 1 || x.length > 200)) return { error: "Хариулт бүр 1–200 тэмдэгт байх ёстой" };
  const c = Number(b.c);
  if (!Number.isInteger(c) || c < 0 || c >= a.length) return { error: "Зөв хариултыг сонгоно уу" };
  const eRaw = String(b.e ?? "").trim();
  if (eRaw.length > 500) return { error: "Тайлбар 500 тэмдэгтээс хэтэрсэн" };
  const diffN = b.diff == null || b.diff === "" ? 2 : Number(b.diff);
  if (![1, 2, 3].includes(diffN)) return { error: "Хүндрэл 1–3 байх ёстой" };
  const topic = String(b.topic ?? "").trim();
  if (!topic || topic.length > 60) return { error: "Сэдэв буруу байна" };
  return { ok: { topic, q, a, c, e: eRaw || null, diff: diffN } };
}

export const isOfficialTopic = (id: string) => TOPIC_IDS.includes(id);

export async function userHasTopic(userId: number, topic: string): Promise<boolean> {
  const r = await query("SELECT 1 FROM user_topics WHERE owner_id=$1 AND id=$2", [userId, topic]);
  return r.length > 0;
}

export async function insertQuestion(ownerId: number | null, v: QuestionInput): Promise<ClientQuestion> {
  const now = Date.now();
  const r = await query(
    `INSERT INTO questions (owner_id, topic, q, a, c, e, diff, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)
     RETURNING id, owner_id, topic, q, a, c, e, diff`,
    [ownerId, v.topic, v.q, JSON.stringify(v.a), v.c, v.e, v.diff, now],
  );
  return toClient(r[0]);
}

/** "u_12", "o_5", "12" → 12 */
export function parseId(raw: string): number | null {
  const m = /(\d+)$/.exec(raw);
  return m ? Number(m[1]) : null;
}
