import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, LockKey, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminPage() {
  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex flex-1 items-stretch pt-[4.5rem]">
        <div className="mx-auto grid w-full max-w-[1500px] lg:grid-cols-[1.2fr_.8fr]">
          <section className="relative flex min-h-[34rem] flex-col justify-between overflow-hidden border-foreground px-4 py-12 sm:px-6 sm:py-16 lg:border-r lg:px-10 lg:py-20">
            <div aria-hidden className="paper-grid absolute inset-0 opacity-40" />
            <div className="relative">
              <div className="flex items-center gap-2 border-y border-foreground py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                <LockKey className="size-4" weight="bold" />
                Restricted desk / internal
              </div>
              <h1 className="mt-9 max-w-[9ch] font-heading text-[clamp(4rem,9vw,8rem)] font-medium leading-[0.78] tracking-[-0.06em]">
                Moderation
                <span className="block italic text-primary">coming soon.</span>
              </h1>
            </div>

            <p className="relative mt-12 max-w-[56ch] border-l-4 border-primary pl-4 text-sm font-medium leading-relaxed">
              The review queue, source verification tools and publishing controls are scheduled for
              a later release. Public event discovery remains fully available.
            </p>
          </section>

          <aside className="flex flex-col justify-between bg-foreground p-6 text-background sm:p-10 lg:p-12">
            <div>
              <div className="flex items-center justify-between border-b border-background/40 pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-primary-foreground" weight="fill" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
                    Desk status
                  </span>
                </div>
                <span className="border border-primary-foreground px-2 py-1 font-mono text-[9px] uppercase text-primary-foreground">
                  Locked
                </span>
              </div>

              <dl className="mt-8 divide-y divide-background/25 border-y border-background/40">
                {[
                  ["Review queue", "Planned"],
                  ["Source verification", "Planned"],
                  ["Publishing controls", "Planned"],
                ].map(([label, state], index) => (
                  <div key={label} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-5">
                    <span className="font-mono text-[9px] text-background/45">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <dt className="text-sm font-semibold">{label}</dt>
                    <dd className="font-mono text-[9px] uppercase tracking-[0.12em] text-background/55">
                      {state}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-12 space-y-3">
              <Link
                href="/events"
                className="flex min-h-12 items-center justify-between border border-background bg-background px-5 text-xs font-semibold uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Browse public index
                <ArrowUpRight />
              </Link>
              <Link
                href="/submit"
                className="flex min-h-12 items-center justify-between border border-background/50 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-background transition-colors hover:border-primary-foreground hover:text-primary-foreground"
              >
                File an event
                <ArrowUpRight />
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
