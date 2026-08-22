"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SignOut } from "@phosphor-icons/react";

import { buttonVariants } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type HeaderUser = {
  email: string;
  name: string | null;
};

export function AuthNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setReady(true);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email;
      setUser(
        email
          ? {
              email,
              name:
                (data.user?.user_metadata?.full_name as string | undefined) ??
                (data.user?.user_metadata?.name as string | undefined) ??
                null,
            }
          : null
      );
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user.email;
      setUser(
        email
          ? {
              email,
              name:
                (session.user.user_metadata?.full_name as string | undefined) ??
                (session.user.user_metadata?.name as string | undefined) ??
                null,
            }
          : null
      );
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!ready) {
    return <div className="hidden h-11 w-[4.5rem] sm:block" aria-hidden />;
  }

  if (user) {
    const label = user.name?.split(" ")[0] ?? user.email.split("@")[0];

    return (
      <form action="/auth/sign-out" method="post" className="flex items-center gap-2">
        <Link
          href="/saved"
          className="flex min-h-11 items-center px-2 text-xs font-semibold uppercase tracking-[0.12em] decoration-2 underline-offset-4 hover:underline"
        >
          Saved
        </Link>
        <span
          className="hidden max-w-[8rem] truncate font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:inline"
          title={user.email}
        >
          {label}
        </span>
        <button
          type="submit"
          className="flex min-h-11 items-center gap-1 px-2 text-xs font-semibold uppercase tracking-[0.12em] decoration-2 underline-offset-4 hover:underline"
        >
          <SignOut aria-hidden className="size-3.5" />
          Out
        </button>
      </form>
    );
  }

  if (pathname === "/login") {
    return null;
  }

  return (
    <Link
      href="/login"
      className={cn(
        buttonVariants({ size: "sm", variant: "outline" }),
        "h-11 rounded-none border border-foreground bg-transparent px-3 text-[11px] font-semibold uppercase tracking-[0.1em] hover:bg-foreground hover:text-background"
      )}
    >
      Sign in
    </Link>
  );
}
