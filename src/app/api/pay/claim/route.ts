import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getPayment } from "@/lib/payments";
import { body, fail, json } from "@/lib/http";

export const runtime = "nodejs";

// Гар баталгаажуулах горим: хэрэглэгч "Төлсөн" дарж төлбөрийн тэмдэглэл үлдээнэ.
export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return fail("Нэвтрээгүй", 401);
  const b = await body<{ paymentId?: number; note?: string }>(req);
  const p = getPayment(Number(b.paymentId));
  if (!p || p.user_id !== u.id) return fail("Олдсонгүй", 404);
  const note = String(b.note ?? "").trim().slice(0, 120);
  db.prepare("UPDATE payments SET status='claimed', note=? WHERE id=? AND status='pending'").run(
    note,
    p.id,
  );
  return json({ ok: true });
}
