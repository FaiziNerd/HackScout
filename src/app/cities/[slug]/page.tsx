import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Globe, MapPin } from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";

import { EventCard } from "@/components/event-card";
import { SiteHeader } from "@/components/site-header";
import { PAKISTAN_CITIES } from "@/lib/cities";
import { getCityBySlug, getUpcomingEvents } from "@/lib/events";

interface CityPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  const fallbackCity = PAKISTAN_CITIES.find((item) => item.slug === slug);

  if (!city && !fallbackCity) {
    return {
      title: "City Not Found | HackScout",
      description: "The requested city desk could not be found.",
    };
  }

  const cityName = city?.name || fallbackCity?.name || slug;

  return {
    title: `${cityName} Events | HackScout`,
    description: `Explore upcoming tech events in ${cityName}, sorted by registration deadlines.`,
  };
}

export default async function CityListingsPage({ params }: CityPageProps) {
  const { slug } = await params;

  const [city, events] = await Promise.all([getCityBySlug(slug), getUpcomingEvents({ city: slug })]);
  const fallbackCity = PAKISTAN_CITIES.find((item) => item.slug === slug);

  if (!city && !fallbackCity) {
    notFound();
  }

  const cityName = city?.name || fallbackCity?.name || slug;
  const province = city?.province || fallbackCity?.province;
  const isVirtual = city?.isVirtual ?? fallbackCity?.isVirtual ?? false;

  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />

      <header className="border-b-2 border-foreground pt-[4.5rem]">
        <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_16rem] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-foreground py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
                <span className="text-primary">City desk / {cityName}</span>
                <span>Registration deadlines closing soonest first</span>
              </div>
              <h1 className="mt-7 max-w-[11ch] font-heading text-[clamp(3.4rem,8vw,7rem)] font-medium leading-[0.8] tracking-[-0.06em]">
                {cityName} event index.
              </h1>
              <p className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {isVirtual ? (
                  <>
                    <Globe aria-hidden className="size-4 text-primary" />
                    <span>Online / Nationwide</span>
                  </>
                ) : (
                  <>
                    <MapPin aria-hidden className="size-4 text-primary" weight="fill" />
                    <span>{province || "Pakistan"}</span>
                  </>
                )}
              </p>
            </div>

            <div className="border-2 border-foreground bg-card p-4">
              <span className="block font-heading text-5xl font-semibold text-primary">{events.length}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em]">Open events</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <div className="mb-6 flex flex-col justify-between gap-4 border-b-2 border-foreground pb-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              Local wire / {cityName}
            </p>
            <h2 className="mt-1 font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Deadline-sorted listings.
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/events?city=${slug}`}
              className="flex min-h-11 items-center gap-2 border border-foreground px-4 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-foreground hover:text-background"
            >
              Open with filters
              <ArrowUpRight aria-hidden className="size-4" />
            </Link>
            <Link
              href="/cities"
              className="flex min-h-11 items-center text-[10px] font-semibold uppercase tracking-[0.12em] underline decoration-1 underline-offset-4 hover:text-primary"
            >
              All city desks
            </Link>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="paper-grid border-2 border-foreground bg-card p-8 text-center sm:p-16">
            <p className="font-heading text-4xl font-semibold">No open listings in this desk yet.</p>
            <p className="mx-auto mt-3 max-w-[50ch] text-sm leading-relaxed text-muted-foreground">
              This city feed is live but currently has no approved upcoming events. Check back soon or submit one.
            </p>
            <Link
              href="/submit"
              className="mt-6 inline-flex min-h-11 items-center border border-foreground bg-foreground px-5 text-xs font-semibold uppercase tracking-[0.12em] text-background hover:bg-primary"
            >
              Submit an event
            </Link>
          </div>
        ) : (
          <div className="grid border-l border-t border-foreground md:grid-cols-2 xl:grid-cols-3">
            {events.map((event, index) => (
              <EventCard key={event.id} event={event} index={index + 1} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
