import { NextResponse } from "next/server";

import { appUserFromSupabase, ensureAppUser, safeNextPath } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  const appUser = appUserFromSupabase(data.user);
  if (appUser) {
    await ensureAppUser(appUser);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
