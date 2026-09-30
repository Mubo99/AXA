import { currentUser, isPlus } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { isMock, payMode, PLUS_PRICE } from "@/lib/qpay";
import { json } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const u = await currentUser();
  return json({
    user: u ? { email: u.email, name: u.name } : null,
    isPlus: isPlus(u) || isAdminUser(u),
    isAdmin: isAdminUser(u),
    plusUntil: u?.plus_until || null,
    price: PLUS_PRICE,
    mock: isMock(),
    mode: payMode(),
  });
}
