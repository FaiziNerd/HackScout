import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Events",
};

export default function EventsFeedPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            HackScout
          </Link>
          <Badge variant="secondary">Feed next</Badge>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">
          All events in Pakistan
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          City grid, search, and deadline-sorted listings land after the schema
          migrate and city seed. This is the app feed — the marketing page is
          at the home URL.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/cities" className={cn(buttonVariants())}>
            Cities
          </Link>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back to landing
          </Link>
        </div>
      </main>
    </div>
  );
}
