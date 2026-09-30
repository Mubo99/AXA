import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { fail, json } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return fail("Админ эрх шаардлагатай", 403);
  const rows = db
    .prepare(
      `SELECT p.id, p.amount, p.status, p.note, p.created_at, p.paid_at, u.email, u.name
       FROM payments p JOIN users u ON u.id = p.user_id
       WHERE p.status IN ('pending','claimed','paid')
       ORDER BY (p.status='claimed') DESC, p.created_at DESC LIMIT 200`,
    )
    .all();
  return json({ rows });
}
