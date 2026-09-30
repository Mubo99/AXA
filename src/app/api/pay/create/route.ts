import crypto from "node:crypto";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { createInvoice, isMock, payMode, PLUS_PRICE } from "@/lib/qpay";
import { fail, json } from "@/lib/http";

export const runtime = "nodejs";

export async function POST() {
  const u = await currentUser();
  if (!u) return fail("Эхлээд нэвтэрнэ үү", 401);

  const senderInvoiceNo = `AXA-${u.id}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const r = db
    .prepare(
      "INSERT INTO payments (user_id, sender_invoice_no, amount, created_at) VALUES (?, ?, ?, ?)",
    )
    .run(u.id, senderInvoiceNo, PLUS_PRICE, Date.now());
  const paymentId = Number(r.lastInsertRowid);

  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  try {
    const inv = await createInvoice({
      senderInvoiceNo,
      amount: PLUS_PRICE,
      description: "AXA PLUS эрх",
      callbackUrl: `${appUrl}/api/pay/callback?payment=${paymentId}`,
    });
    db.prepare("UPDATE payments SET qpay_invoice_id=? WHERE id=?").run(inv.invoiceId, paymentId);
    return json({ paymentId, amount: PLUS_PRICE, mock: isMock(), mode: payMode(), code: `AXA-${paymentId}`, ...inv });
  } catch (e) {
    db.prepare("UPDATE payments SET status='failed' WHERE id=?").run(paymentId);
    console.error("[qpay] invoice", e);
    return fail("QPay нэхэмжлэх үүсгэж чадсангүй. Дараа дахин оролдоно уу.", 502);
  }
}
