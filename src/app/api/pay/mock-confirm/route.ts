import { currentUser } from "@/lib/auth";
import { getPayment } from "@/lib/payments";
import { isMock, markPaidAndGrant } from "@/lib/qpay";
import { body, fail, json } from "@/lib/http";

export const runtime = "nodejs";

// Зөвхөн QPay түлхүүргүй (MOCK) горимд, хөгжүүлэлтийн үед ажиллана.
export async function POST(req: Request) {
  if (!isMock() || process.env.NODE_ENV === "production") return fail("Боломжгүй", 404);
  const u = await currentUser();
  if (!u) return fail("Нэвтрээгүй", 401);
  const { paymentId } = await body<{ paymentId?: number }>(req);
  const p = await getPayment(Number(paymentId));
  if (!p || p.user_id !== u.id) return fail("Олдсонгүй", 404);
  await markPaidAndGrant(p.id);
  return json({ ok: true });
}
