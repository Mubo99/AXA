import { currentUser, type User } from "./auth";

const adminEmails = () =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

export const isAdminUser = (u: User | null) => !!u && adminEmails().includes(u.email);

export async function requireAdmin(): Promise<User | null> {
  const u = await currentUser();
  return isAdminUser(u) ? u : null;
}
