import crypto from "node:crypto";
import { q } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { createInvoice, isMock, payMode, PLUS_PRICE } from "@/lib/qpay";
import { fail, json } from "@/lib/http";

export const runtime = "nodejs";

export async function POST() {
  const u = await currentUser();
  if (!u) return fail("Эхлээд нэвтэрнэ үү", 401);

  const senderInvoiceNo = `AXA-${u.id}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const ins = await q(
    "INSERT INTO payments (user_id, sender_invoice_no, amount, created_at) VALUES ($1, $2, $3, $4) RETURNING id",
    [u.id, senderInvoiceNo, PLUS_PRICE, Date.now()],
  );
  const paymentId = Number(ins[0].id);

  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  try {
    const inv = await createInvoice({
      senderInvoiceNo,
      amount: PLUS_PRICE,
      description: "AXA PLUS эрх",
      callbackUrl: `${appUrl}/api/pay/callback?payment=${paymentId}`,
    });
    await q("UPDATE payments SET qpay_invoice_id=$2 WHERE id=$1", [paymentId, inv.invoiceId]);
    return json({
      paymentId,
      amount: PLUS_PRICE,
      mock: isMock(),
      mode: payMode(),
      code: `AXA-${paymentId}`,
      ...inv,
    });
  } catch (e) {
    await q("UPDATE payments SET status='failed' WHERE id=$1", [paymentId]);
    console.error("[qpay] invoice", e);
    return fail("QPay нэхэмжлэх үүсгэж чадсангүй. Дараа дахин оролдоно уу.", 502);
  }
}
