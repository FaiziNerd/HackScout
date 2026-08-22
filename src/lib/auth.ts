import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export { safeNextPath } from "@/lib/auth-paths";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

function displayName(meta: Record<string, unknown> | undefined, email: string) {
  const fullName = typeof meta?.full_name === "string" ? meta.full_name : null;
  const name = typeof meta?.name === "string" ? meta.name : null;
  return fullName || name || email.split("@")[0] || null;
}

export async function ensureAppUser(input: {
  id: string;
  email: string;
  name?: string | null;
}): Promise<AuthUser> {
  const name = input.name ?? null;
  const user = await prisma.user.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      email: input.email,
      name,
    },
    update: {
      email: input.email,
      ...(name ? { name } : {}),
    },
  });

  return { id: user.id, email: user.email, name: user.name };
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: displayName(user.user_metadata as Record<string, unknown>, user.email),
  };
}

export function appUserFromSupabase(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): AuthUser | null {
  if (!user.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: displayName(user.user_metadata, user.email),
  };
}
