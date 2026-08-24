"use client";

import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { AuthNav } from "@/components/auth-nav";
import { SiteMobileIndex } from "@/components/site-mobile-index";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-200",
        solid
          ? "border-foreground bg-background"
          : "border-foreground/35 bg-background/90"
      )}
    >
      <div className="mx-auto grid h-[4.5rem] max-w-[1500px] grid-cols-[minmax(0,1fr)_auto] items-stretch px-4 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-10">
        <Link
          href="/"
          className="group flex min-w-0 min-h-11 items-center gap-2 border-r border-foreground/30 pr-3 sm:gap-3 sm:pr-4 lg:border-r-0"
        >
          <span className="grid size-8 shrink-0 place-items-center border border-foreground bg-primary font-mono text-[10px] font-semibold text-primary-foreground transition-transform group-hover:-rotate-3">
            HS
          </span>
          <span className="min-w-0">
            <span className="block truncate font-heading text-xl font-semibold leading-none tracking-[-0.03em]">
              HackScout
            </span>
            <span className="mt-1 hidden font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground md:block">
              Pakistan event intelligence
            </span>
          </span>
        </Link>
        <div className="hidden items-center border-x border-foreground/30 px-7 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground lg:flex">
          Issue 08.26&nbsp;&nbsp;/&nbsp;&nbsp;Live edition
        </div>
        <div className="flex items-center justify-end gap-2 pl-3 lg:pl-6">
          <nav className="hidden items-center gap-4 md:flex" aria-label="Primary">
            <Link
              href="/events"
              className="flex min-h-11 items-center px-2 text-xs font-semibold uppercase tracking-[0.12em] decoration-2 underline-offset-4 hover:underline"
            >
              Events
            </Link>
            <Link
              href="/cities"
              className="flex min-h-11 items-center px-2 text-xs font-semibold uppercase tracking-[0.12em] decoration-2 underline-offset-4 hover:underline"
            >
              Cities
            </Link>
            <AuthNav />
            <Link
              href="/submit"
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-11 rounded-none border border-foreground bg-foreground px-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-background hover:bg-primary hover:text-primary-foreground"
              )}
            >
              Submit
              <ArrowUpRight aria-hidden />
            </Link>
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/submit"
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-11 rounded-none border border-foreground bg-foreground px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-background hover:bg-primary hover:text-primary-foreground"
              )}
            >
              Submit
            </Link>
            <SiteMobileIndex />
          </div>
        </div>
      </div>
    </header>
  );
}
