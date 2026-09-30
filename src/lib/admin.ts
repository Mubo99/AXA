import { currentUser, type User } from "./auth";

export async function requireAdmin(): Promise<User | null> {
  const u = await currentUser();
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return u && admins.includes(u.email) ? u : null;
}
