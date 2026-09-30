import { getPayment, syncPayment } from "@/lib/payments";
import { json } from "@/lib/http";

export const runtime = "nodejs";

// QPay энд GET дууддаг. Query-д итгэхгүй: төлбөрийг QPay-ээс дахин шалгаж баталгаажуулна.
async function handle(req: Request) {
  const p = await getPayment(Number(new URL(req.url).searchParams.get("payment")));
  if (p) {
    try {
      await syncPayment(p, true);
    } catch (e) {
      console.error("[qpay] callback", e);
    }
  }
  return json({ ok: true });
}

export const GET = handle;
export const POST = handle;
