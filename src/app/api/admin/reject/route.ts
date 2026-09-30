import { requireAdmin } from "@/lib/admin";
import { rejectPayment } from "@/lib/qpay";
import { body, fail, json } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await requireAdmin())) return fail("Админ эрх шаардлагатай", 403);
  const { paymentId } = await body<{ paymentId?: number }>(req);
  const done = await rejectPayment(Number(paymentId));
  return json({ ok: true, rejected: done });
}
