import { q } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { fail, json } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return fail("Админ эрх шаардлагатай", 403);
  const rows = await q(
    `SELECT p.id, p.amount, p.status, p.note, p.created_at, p.paid_at, u.email, u.name
     FROM payments p JOIN users u ON u.id = p.user_id
     WHERE p.status IN ('pending','claimed','paid')
     ORDER BY (p.status='claimed') DESC, p.created_at DESC LIMIT 200`,
  );
  return json({
    rows: rows.map((r) => ({
      ...r,
      id: Number(r.id),
      amount: Number(r.amount),
      created_at: Number(r.created_at),
      paid_at: r.paid_at == null ? null : Number(r.paid_at),
    })),
  });
}
