import { db } from "./db";
import { isInvoicePaid, markPaidAndGrant } from "./qpay";

type Payment = { id: number; user_id: number; qpay_invoice_id: string | null; amount: number; status: string };

export const getPayment = (id: number) =>
  db.prepare("SELECT id, user_id, qpay_invoice_id, amount, status FROM payments WHERE id=?").get(id) as
    | Payment
    | undefined;

// QPay баримт: төлөвийг байнга шалгаж болохгүй. Нэхэмжлэх тус бүрд хамгийн цөөн 15 сек тутам.
const MIN_CHECK_MS = 15_000;
const lastCheck = new Map<number, number>();

/**
 * QPay-ээс шалгаж, төлөгдсөн бол PLUS олгоно. Одоогийн төлөв буцаана.
 * force=true (QPay callback ирсэн үед) хугацааны хязгаарыг алгасна.
 */
export async function syncPayment(p: Payment, force = false): Promise<string> {
  if (p.status !== "pending" || !p.qpay_invoice_id || /^(mock|manual)_/.test(p.qpay_invoice_id))
    return p.status;
  const now = Date.now();
  if (!force && now - (lastCheck.get(p.id) ?? 0) < MIN_CHECK_MS) return p.status;
  lastCheck.set(p.id, now);
  if (await isInvoicePaid(p.qpay_invoice_id, p.amount)) {
    markPaidAndGrant(p.id);
    return "paid";
  }
  return p.status;
}
