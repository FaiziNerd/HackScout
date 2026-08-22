import { getAuthUser, type AuthUser } from "@/lib/auth";

export function parseAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string) {
  return parseAdminEmails().includes(email.toLowerCase());
}

export async function getAdminUser(): Promise<AuthUser | null> {
  const user = await getAuthUser();
  if (!user || !isAdminEmail(user.email)) {
    return null;
  }
  return user;
}
