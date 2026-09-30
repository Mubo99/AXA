import { currentUser, isPlus } from "@/lib/auth";
import { getPayment, syncPayment } from "@/lib/payments";
import { fail, json } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = await currentUser();
  if (!u) return fail("Нэвтрээгүй", 401);
  const p = getPayment(Number(new URL(req.url).searchParams.get("id")));
  if (!p || p.user_id !== u.id) return fail("Олдсонгүй", 404);
  try {
    const status = await syncPayment(p);
    const fresh = await currentUser();
    return json({ status, isPlus: isPlus(fresh) });
  } catch (e) {
    console.error("[qpay] check", e);
    return fail("Төлбөр шалгаж чадсангүй", 502);
  }
}
