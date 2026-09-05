import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { origin } = new URL(request.url);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const redirectResponse = NextResponse.redirect(`${origin}/events`, { status: 303 });

  if (!url || !anonKey) {
    return redirectResponse;
  }

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

  await supabase.auth.signOut();

  return redirectResponse;
}
