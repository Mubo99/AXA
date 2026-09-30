import { q } from "./db";
import { isInvoicePaid, markPaidAndGrant } from "./qpay";

export type Payment = {
  id: number;
  user_id: number;
  qpay_invoice_id: string | null;
  amount: number;
  status: string;
};

export async function getPayment(id: number): Promise<Payment | undefined> {
  if (!Number.isInteger(id)) return undefined;
  const r = (
    await q("SELECT id, user_id, qpay_invoice_id, amount, status FROM payments WHERE id=$1", [id])
  )[0];
  return r
    ? {
        id: Number(r.id),
        user_id: Number(r.user_id),
        qpay_invoice_id: r.qpay_invoice_id,
        amount: Number(r.amount),
        status: r.status,
      }
    : undefined;
}

// QPay баримт: төлөвийг байнга шалгаж болохгүй. Нэхэмжлэх тус бүрд хамгийн цөөн 15 сек тутам.
// Serverless тул хугацааг санах ойд бус өгөгдлийн санд хадгална.
const MIN_CHECK_MS = 15_000;

/**
 * QPay-ээс шалгаж, төлөгдсөн бол PLUS олгоно. Одоогийн төлөв буцаана.
 * force=true (QPay callback ирсэн үед) хугацааны хязгаарыг алгасна.
 */
export async function syncPayment(p: Payment, force = false): Promise<string> {
  if (p.status !== "pending" || !p.qpay_invoice_id || /^(mock|manual)_/.test(p.qpay_invoice_id))
    return p.status;
  const now = Date.now();
  const claimed = await q(
    `UPDATE payments SET last_check=$2 WHERE id=$1 AND ($3::boolean OR last_check IS NULL OR last_check < $4)
     RETURNING id`,
    [p.id, now, force, now - MIN_CHECK_MS],
  );
  if (claimed.length === 0) return p.status;
  if (await isInvoicePaid(p.qpay_invoice_id, p.amount)) {
    await markPaidAndGrant(p.id);
    return "paid";
  }
  return p.status;
}
