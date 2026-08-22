import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Globe, MagnifyingGlass, MapPin } from "@phosphor-icons/react/dist/ssr";

import { EventCard } from "@/components/event-card";
import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";
import type { EventCategory } from "@/generated/prisma/client";
import { getAuthUser } from "@/lib/auth";
import { getCityEventCounts, getFeedStats, getUpcomingEvents } from "@/lib/events";
import { getSavedEventIds } from "@/lib/saved-events";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Explore Tech Events in Pakistan | HackScout",
  description:
    "Browse hackathons, conferences, and developer meetups across Karachi, Lahore, Islamabad, and all of Pakistan.",
};

const CATEGORY_FILTERS: { label: string; value?: EventCategory }[] = [
  { label: "All categories" },
  { label: "Hackathons", value: "hackathon" },
  { label: "Conferences", value: "conference" },
  { label: "Meetups", value: "meetup" },
  { label: "Competitions", value: "competition" },
  { label: "Workshops", value: "workshop" },
];

const CITY_FILTERS = [
  { label: "All cities", slug: "all" },
  { label: "Karachi", slug: "karachi" },
  { label: "Lahore", slug: "lahore" },
  { label: "Islamabad", slug: "islamabad" },
  { label: "Online", slug: "online" },
  { label: "Peshawar", slug: "peshawar" },
  { label: "Faisalabad", slug: "faisalabad" },
  { label: "Multan", slug: "multan" },
  { label: "Quetta", slug: "quetta" },
  { label: "Hyderabad", slug: "hyderabad" },
];

interface PageProps {
  searchParams: Promise<{ city?: string; category?: string; q?: string }>;
}

export default async function EventsFeedPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const city = params.city || "all";
  const category = params.category as EventCategory | undefined;
  const search = params.q;

  const [events, stats, cityCounts, user] = await Promise.all([
    getUpcomingEvents({
      city: city === "all" ? undefined : city,
      category,
      search,
    }),
    getFeedStats(),
    getCityEventCounts(),
    getAuthUser(),
  ]);
  const savedIds = user ? await getSavedEventIds(user.id) : new Set<string>();

  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />

      <header className="border-b-2 border-foreground pt-[4.5rem]">
        <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_16rem] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-foreground py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
                <span className="text-primary">Live directory / Pakistan</span>
                <span>Updated continuously</span>
              </div>
              <h1 className="mt-7 max-w-[11ch] font-heading text-[clamp(3.6rem,8vw,7.5rem)] font-medium leading-[0.78] tracking-[-0.06em]">
                The open event index.
              </h1>
            </div>
            <div className="grid grid-cols-2 border-2 border-foreground bg-card">
              <div className="border-r border-foreground p-4">
                <span className="block font-heading text-5xl font-semibold text-primary">{stats.eventCount}</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em]">Open events</span>
              </div>
              <div className="p-4">
                <span className="block font-heading text-5xl font-semibold">{stats.cityCount}</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em]">City desks</span>
              </div>
            </div>
          </div>

          <form className="mt-10 border-y-2 border-foreground py-4" action="/events" method="get">
            <label htmlFor="event-search" className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
              Search the wire
            </label>
            <div className="relative mt-2 max-w-3xl">
              <MagnifyingGlass aria-hidden className="absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2" />
              <Input
                id="event-search"
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Event, university, organizer or keyword…"
                className="h-13 rounded-none border-2 border-foreground bg-card pl-12 pr-4 text-base placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-0"
              />
            </div>
            {city !== "all" && <input type="hidden" name="city" value={city} />}
            {category && <input type="hidden" name="category" value={category} />}
          </form>

          <div className="grid border-b border-foreground lg:grid-cols-[7rem_1fr]">
            <p className="flex min-h-12 items-center border-foreground font-mono text-[10px] font-semibold uppercase tracking-[0.14em] lg:border-r">
              City desk
            </p>
            <div className="flex flex-wrap items-center gap-2 py-3 lg:px-4">
              {CITY_FILTERS.map((item) => (
                <Link
                  key={item.slug}
                  href={`/events?city=${item.slug}${category ? `&category=${category}` : ""}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                  className={cn(
                    "flex min-h-11 items-center border px-3 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors",
                    city === item.slug
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground/35 hover:border-foreground hover:bg-card"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid border-b-2 border-foreground lg:grid-cols-[7rem_1fr]">
            <p className="flex min-h-12 items-center border-foreground font-mono text-[10px] font-semibold uppercase tracking-[0.14em] lg:border-r">
              Format
            </p>
            <div className="flex flex-wrap items-center gap-2 py-3 lg:px-4">
              {CATEGORY_FILTERS.map((item) => {
                const isActive = (item.value || undefined) === (category || undefined);
                return (
                  <Link
                    key={item.label}
                    href={`/events?${city !== "all" ? `city=${city}&` : ""}${item.value ? `category=${item.value}` : ""}${search ? `${item.value || city !== "all" ? "&" : ""}q=${encodeURIComponent(search)}` : ""}`}
                    className={cn(
                      "flex min-h-11 items-center border px-3 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-foreground/35 hover:border-foreground hover:bg-card"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        {cityCounts.length > 0 && (
          <section aria-labelledby="browse-by-city" className="mb-14 lg:mb-20">
            <div className="mb-5 flex flex-col justify-between gap-3 border-b-2 border-foreground pb-4 sm:flex-row sm:items-end">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Local frequencies / live from the index
                </p>
                <h2
                  id="browse-by-city"
                  className="mt-1 font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl"
                >
                  Browse by city.
                </h2>
              </div>
              <Link
                href="/cities"
                className="flex min-h-11 items-center gap-2 self-start text-[10px] font-semibold uppercase tracking-[0.12em] underline decoration-1 underline-offset-4 hover:text-primary sm:self-auto"
              >
                All city desks
                <ArrowUpRight aria-hidden className="size-4" />
              </Link>
            </div>

            <div className="grid border-l border-t border-foreground sm:grid-cols-2 lg:grid-cols-4">
              {cityCounts.map((cityItem, index) => {
                const isActive = city === cityItem.slug;
                const href = `/cities/${cityItem.slug}${category || search ? "?" : ""}${category ? `category=${category}` : ""}${category && search ? "&" : ""}${search ? `q=${encodeURIComponent(search)}` : ""}`;

                return (
                  <Link
                    key={cityItem.id}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex min-h-48 flex-col justify-between border-b border-r border-foreground p-5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                      isActive ? "bg-foreground text-background" : "bg-background hover:bg-card"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] opacity-60">
                        Desk {String(index + 1).padStart(2, "0")}
                      </span>
                      {cityItem.isVirtual ? (
                        <Globe aria-hidden className="size-5 text-primary" />
                      ) : (
                        <MapPin aria-hidden className="size-5 text-primary" weight="fill" />
                      )}
                    </div>

                    <div className="mt-8">
                      <p className="font-heading text-3xl font-semibold leading-none tracking-[-0.035em] transition-transform group-hover:translate-x-1">
                        {cityItem.name}
                      </p>
                      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] opacity-60">
                        {cityItem.isVirtual ? "Nationwide" : cityItem.province || "Pakistan"}
                      </p>
                    </div>

                    <div className="mt-5 flex items-end justify-between border-t border-current/35 pt-4">
                      <div>
                        <span className="font-heading text-4xl font-semibold text-primary">
                          {cityItem.eventCount}
                        </span>
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.1em]">
                          open
                        </span>
                      </div>
                      <span className="text-right font-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] opacity-65">
                        {cityItem.closingThisWeek} closing
                        <br />
                        this week
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section aria-labelledby="nationwide-feed">
        <div className="mb-6 flex flex-col justify-between gap-4 border-b-2 border-foreground pb-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              {city === "all" ? "Nationwide wire" : `${CITY_FILTERS.find((item) => item.slug === city)?.label || city} wire`}
            </p>
            <h2
              id="nationwide-feed"
              className="mt-1 font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl"
            >
              {city === "all" ? "All events in Pakistan." : "Filtered event feed."}
            </h2>
          </div>
          {(city !== "all" || category || search) && (
            <Link
              href="/events"
              className="flex min-h-11 items-center self-start border border-foreground px-4 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-foreground hover:text-background sm:self-auto"
            >
              Clear all filters
            </Link>
          )}
        </div>

        <div className="mb-5 flex items-center justify-between border-b border-foreground pb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <span>{events.length} results on this wire</span>
          <span className="hidden sm:block">Registration deadlines closing soonest first</span>
        </div>

        {events.length === 0 ? (
          <div className="paper-grid border-2 border-foreground bg-card p-8 text-center sm:p-16">
            <p className="font-heading text-4xl font-semibold">No signal on this frequency.</p>
            <p className="mx-auto mt-3 max-w-[50ch] text-sm leading-relaxed text-muted-foreground">
              Try a wider city or category filter, run the scrapers, or add an event that should be here.
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
              <EventCard
                key={event.id}
                event={event}
                index={index + 1}
                saved={savedIds.has(event.id)}
                signedIn={Boolean(user)}
              />
            ))}
          </div>
        )}
        </section>
      </main>
    </div>
  );
}
