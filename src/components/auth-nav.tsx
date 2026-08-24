"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SignOut } from "@phosphor-icons/react";

import { buttonVariants } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type HeaderUser = {
  email: string;
  name: string | null;
};

type AuthNavProps = {
  variant?: "bar" | "panel";
  onNavigate?: () => void;
};

const panelLinkClass =
  "flex min-h-14 items-center justify-between border-b border-foreground/30 px-1 text-sm font-semibold uppercase tracking-[0.14em] outline-none hover:bg-muted focus-visible:bg-muted";

export function AuthNav({ variant = "bar", onNavigate }: AuthNavProps) {
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<HeaderUser | null | undefined>(() =>
    supabase ? undefined : null
  );

  useEffect(() => {
    if (!supabase) {
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
  }, [supabase]);

  if (user === undefined) {
    if (variant === "panel") {
      return <div className="h-14 border-b border-foreground/30" aria-hidden />;
    }
    return <div className="hidden h-11 w-[4.5rem] md:block" aria-hidden />;
  }

  if (user) {
    const label = user.name?.split(" ")[0] ?? user.email.split("@")[0];

    if (variant === "panel") {
      return (
        <form action="/auth/sign-out" method="post" className="flex flex-col">
          <Link href="/saved" onClick={onNavigate} className={panelLinkClass}>
            Saved
            <span className="font-mono text-[10px] font-normal tracking-[0.16em] text-muted-foreground">
              Desk
            </span>
          </Link>
          <p className="border-b border-foreground/30 px-1 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Signed in as {label}
          </p>
          <button type="submit" className={cn(panelLinkClass, "w-full text-left")}>
            Sign out
            <SignOut aria-hidden className="size-4" />
          </button>
        </form>
      );
    }

    return (
      <form action="/auth/sign-out" method="post" className="flex items-center gap-2">
        <Link
          href="/saved"
          className="flex min-h-11 items-center px-2 text-xs font-semibold uppercase tracking-[0.12em] decoration-2 underline-offset-4 hover:underline"
        >
          Saved
        </Link>
        <span
          className="hidden max-w-[8rem] truncate font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground lg:inline"
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

  if (variant === "panel") {
    return (
      <Link href="/login" onClick={onNavigate} className={panelLinkClass}>
        Sign in
        <span className="font-mono text-[10px] font-normal tracking-[0.16em] text-muted-foreground">
          Account
        </span>
      </Link>
    );
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
