import { tx } from "./db";

const BASE = process.env.QPAY_BASE_URL || "https://merchant-sandbox.qpay.mn/v2";

export const PLUS_PRICE = Number(process.env.PLUS_PRICE || 20000);
export const PLUS_DAYS = Number(process.env.PLUS_DAYS || 30);

const hasApi = () =>
  !!process.env.QPAY_USERNAME && !!process.env.QPAY_PASSWORD && !!process.env.QPAY_INVOICE_CODE;

/**
 * api    — QPay merchant API (автомат баталгаажуулалт)
 * manual — MANUAL_QR тохируулсан: өөрийн QPay QR зураг, админ гараар батална
 * mock   — юу ч тохируулаагүй: туршилтын товчтой, жинхэнэ төлбөргүй
 */
export type PayMode = "api" | "manual" | "mock";
export const payMode = (): PayMode =>
  hasApi() ? "api" : process.env.MANUAL_QR ? "manual" : "mock";
export const isMock = () => payMode() === "mock";

export type Invoice = {
  invoiceId: string;
  qrImage: string | null; // base64 PNG
  qrUrl?: string | null; // manual горимын QR зургийн URL
  shortUrl: string | null;
  urls: { name: string; description: string; logo: string; link: string }[];
};

let cachedToken: { value: string; exp: number } | null = null;

async function token(): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.value;
  const basic = Buffer.from(`${process.env.QPAY_USERNAME}:${process.env.QPAY_PASSWORD}`).toString(
    "base64",
  );
  const res = await fetch(`${BASE}/auth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}` },
  });
  if (!res.ok) throw new Error(`QPay auth ${res.status}`);
  const j = await res.json();
  cachedToken = { value: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return cachedToken.value;
}

async function call(pathname: string, body: unknown) {
  const res = await fetch(`${BASE}${pathname}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`QPay ${pathname} ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function createInvoice(opts: {
  senderInvoiceNo: string;
  amount: number;
  description: string;
  callbackUrl: string;
}): Promise<Invoice> {
  if (payMode() === "manual") {
    return {
      invoiceId: `manual_${opts.senderInvoiceNo}`,
      qrImage: null,
      qrUrl: /^(https?:\/)?\//.test(process.env.MANUAL_QR!)
        ? process.env.MANUAL_QR!
        : `/${process.env.MANUAL_QR}`,
      shortUrl: null,
      urls: [],
    };
  }
  if (isMock()) {
    return { invoiceId: `mock_${opts.senderInvoiceNo}`, qrImage: null, shortUrl: null, urls: [] };
  }
  const j = await call("/invoice", {
    invoice_code: process.env.QPAY_INVOICE_CODE,
    sender_invoice_no: opts.senderInvoiceNo,
    invoice_receiver_code: opts.senderInvoiceNo,
    invoice_description: opts.description,
    amount: opts.amount,
    callback_url: opts.callbackUrl,
  });
  return {
    invoiceId: j.invoice_id,
    qrImage: j.qr_image ?? null,
    shortUrl: j.qPay_shortUrl ?? null,
    urls: j.urls ?? [],
  };
}

/** QPay-ээс тухайн нэхэмжлэх бүрэн төлөгдсөн эсэхийг шалгана (callback-д хэзээ ч итгэхгүй). */
export async function isInvoicePaid(invoiceId: string, amount: number): Promise<boolean> {
  const j = await call("/payment/check", {
    object_type: "INVOICE",
    object_id: invoiceId,
    offset: { page_number: 1, page_limit: 100 },
  });
  const rows: { payment_status?: string; payment_amount?: string | number }[] = j.rows ?? [];
  const paid = rows
    .filter((r) => r.payment_status === "PAID")
    .reduce((sum, r) => sum + Number(r.payment_amount ?? 0), 0);
  return paid >= amount;
}

/** pending/claimed → paid шилжилт нэг л удаа явагдаж, PLUS хугацааг нэг л удаа уртасгана. */
export async function markPaidAndGrant(paymentId: number): Promise<boolean> {
  if (!Number.isInteger(paymentId)) return false;
  const now = Date.now();
  return tx(async (q) => {
    const upd = await q(
      "UPDATE payments SET status='paid', paid_at=$2 WHERE id=$1 AND status IN ('pending','claimed') RETURNING user_id",
      [paymentId, now],
    );
    if (upd.length === 0) return false;
    const userId = Number(upd[0].user_id);
    const u = (await q("SELECT plus_until FROM users WHERE id=$1 FOR UPDATE", [userId]))[0];
    const from = Math.max(now, Number(u.plus_until));
    await q("UPDATE users SET plus_until=$2 WHERE id=$1", [userId, from + PLUS_DAYS * 86400_000]);
    return true;
  });
}
