import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { appUserFromSupabase, ensureAppUser, safeNextPath } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  // Cookies must be set on this redirect response — cookies().set() alone
  // does not attach Set-Cookie headers to a separate NextResponse.redirect().
  const redirectResponse = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("[auth/callback] exchangeCodeForSession failed", {
      message: error?.message,
      status: error?.status,
      name: error?.name,
    });
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  const appUser = appUserFromSupabase(data.user);
  if (appUser) {
    await ensureAppUser(appUser);
  }

  return redirectResponse;
}
