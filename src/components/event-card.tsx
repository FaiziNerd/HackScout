import Link from "next/link";
import { ArrowUpRight, CalendarBlank, Star } from "@phosphor-icons/react/dist/ssr";

import { CategoryBadge } from "@/components/category-badge";
import { CityBadge } from "@/components/city-badge";
import { DeadlineBadge } from "@/components/deadline-badge";
import type { City, Event } from "@/generated/prisma/client";
import { formatEventDateRange, SOURCE_LABELS } from "@/lib/events";

export type EventWithCity = Event & { city: City };

export interface EventCardProps {
  event: EventWithCity;
  index?: number;
}

export function EventCard({ event, index = 1 }: EventCardProps) {
  const sourceLabel = SOURCE_LABELS[event.source];

  return (
    <article className="group relative flex min-h-[27rem] flex-col border-b border-r border-foreground bg-background transition-colors hover:bg-card">
      <Link
        href={`/events/${event.slug}`}
        className="flex h-full flex-1 flex-col p-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:p-6"
        aria-label={`View ${event.title} details and registration`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-foreground pb-4">
          <span className="font-heading text-4xl italic leading-none text-muted-foreground/70">
            {String(index).padStart(2, "0")}
          </span>
          <DeadlineBadge deadline={event.registrationDeadline} />
        </div>

        <div className="flex-1 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={event.category} />
            <CityBadge cityName={event.city.name} />
          </div>

          <h2 className="mt-4 font-heading text-3xl font-semibold leading-[0.98] tracking-[-0.035em] transition-transform duration-200 group-hover:translate-x-1">
            {event.title}
          </h2>
          {event.organizerName && (
            <p className="mt-3 text-xs font-medium text-muted-foreground">
              Filed by {event.organizerName}
            </p>
          )}

          <dl className="mt-7 divide-y divide-foreground/35 border-y border-foreground/35 text-xs">
            <div className="grid grid-cols-[6rem_1fr] gap-3 py-3">
              <dt className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                <CalendarBlank aria-hidden className="size-4" />
                Date
              </dt>
              <dd className="text-right font-semibold">
                {formatEventDateRange(event.startDate, event.endDate)}
              </dd>
            </div>
            {event.prizePool && (
              <div className="grid grid-cols-[6rem_1fr] gap-3 py-3">
                <dt className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                  <Star aria-hidden className="size-4 text-primary" />
                  Prize
                </dt>
                <dd className="text-right font-semibold text-primary">{event.prizePool}</dd>
              </div>
            )}
          </dl>

          {event.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
              {event.tags.slice(0, 4).map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-t-2 border-foreground pt-4">
          <span className="text-xs font-semibold uppercase tracking-[0.1em]">
            View dispatch
          </span>
          <ArrowUpRight
            aria-hidden
            className="size-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </div>
        <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
          Source / {sourceLabel || event.source}
        </p>
      </Link>
    </article>
  );
}
