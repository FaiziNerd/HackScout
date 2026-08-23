import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

import { MissingEventForm } from "@/components/missing-event-form";
import { SiteHeader } from "@/components/site-header";

import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Missing an event?",
  description:
    "Tip HackScout about a Pakistan hackathon, meetup, or campus event that is not on the radar yet.",
  path: "/missing",
});

export default function MissingEventPage() {
  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <header className="border-b-2 border-foreground pt-[4.5rem]">
        <div className="relative mx-auto max-w-[1500px] overflow-hidden px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
          <div aria-hidden className="paper-grid absolute inset-0 opacity-35" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-end">
            <div>
              <div className="border-y border-foreground py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                Gap report / community wire
              </div>
              <h1 className="mt-8 max-w-[12ch] font-heading text-[clamp(3.6rem,8vw,7.5rem)] font-medium leading-[0.78] tracking-[-0.06em]">
                Missing an
                <span className="block italic text-primary">event?</span>
              </h1>
            </div>
            <p className="border-l-4 border-primary pl-4 text-sm font-medium leading-relaxed">
              Scrapers miss campus posters, WhatsApp forwards, and LinkedIn posts. Send a name, city, and a
              link — the desk files the rest.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1500px] flex-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[16rem_1fr] lg:px-10 lg:py-16">
        <aside className="h-fit border-y-2 border-foreground py-5 lg:sticky lg:top-24">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            How tips work
          </p>
          <ol className="mt-5 space-y-5">
            {[
              ["01", "Name the event and the city."],
              ["02", "Paste a link, or write what you remember."],
              ["03", "We verify and publish if it belongs on the radar."],
            ].map(([number, text]) => (
              <li key={number} className="grid grid-cols-[2rem_1fr] gap-2 text-xs leading-relaxed">
                <span className="font-mono text-[10px] text-muted-foreground">{number}</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
          <Link
            href="/submit"
            className="mt-8 inline-flex min-h-11 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] underline underline-offset-4 hover:text-primary"
          >
            Have full details? File a listing
            <ArrowUpRight className="size-4" />
          </Link>
        </aside>

        <section className="border-2 border-foreground bg-card">
          <div className="border-b-2 border-foreground p-5 sm:p-7">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              Tip slip / 30 seconds
            </p>
            <h2 className="mt-2 font-heading text-4xl font-semibold tracking-[-0.04em]">Tell the desk.</h2>
          </div>
          <MissingEventForm />
        </section>
      </main>
    </div>
  );
}
