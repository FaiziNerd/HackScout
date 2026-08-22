import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarBlank,
  LinkSimple,
  MapPin,
  ShareNetwork,
  Star,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import { notFound } from "next/navigation";

import { CategoryBadge } from "@/components/category-badge";
import { CityBadge } from "@/components/city-badge";
import { CountdownTimer } from "@/components/countdown-timer";
import { DeadlineBadge } from "@/components/deadline-badge";
import { EventCard } from "@/components/event-card";
import { RegistrationCta } from "@/components/registration-cta";
import { SaveEventButton } from "@/components/save-event-button";
import { SiteHeader } from "@/components/site-header";
import { getAuthUser } from "@/lib/auth";
import { formatEventDateRange, getEventBySlug, getRelatedCityEvents, SOURCE_LABELS } from "@/lib/events";
import { prisma } from "@/lib/db";
import { parseFormFields } from "@/lib/registration-form";
import { getSavedEventIds } from "@/lib/saved-events";

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return {
      title: "Event not found",
      description: "This listing is not in the HackScout index.",
    };
  }

  return {
    title: event.title,
    description: event.description.slice(0, 160),
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const [related, user] = await Promise.all([
    getRelatedCityEvents(event.cityId, event.id),
    getAuthUser(),
  ]);
  const savedIds = user ? await getSavedEventIds(user.id) : new Set<string>();
  const saved = savedIds.has(event.id);
  const formFields = parseFormFields(event.formFields);
  const alreadyRegistered = user
    ? Boolean(
        await prisma.registration.findFirst({
          where: {
            eventId: event.id,
            OR: [{ userId: user.id }, { email: user.email.toLowerCase() }],
          },
          select: { id: true },
        }),
      )
    : false;
  const sourceLabel = SOURCE_LABELS[event.source] || event.source;
  const shareText = `Found this on HackScout — ${event.title} in ${event.city.name}`;
  const extraSources = event.sources.filter((item) => item !== event.source);

  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-16 pt-[6.5rem] sm:px-6 lg:px-10">
        <Link
          href="/events"
          className="inline-flex min-h-11 items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] hover:text-primary"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Back to the wire
        </Link>

        <div className="mt-6 grid gap-8 border-t-2 border-foreground pt-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <article>
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={event.category} />
              <Link href={`/cities/${event.city.slug}`} className="hover:opacity-80">
                <CityBadge cityName={event.city.name} />
              </Link>
              <DeadlineBadge deadline={event.registrationDeadline} />
            </div>

            <h1 className="mt-6 max-w-[18ch] font-heading text-[clamp(2.6rem,6vw,5.4rem)] font-medium leading-[0.86] tracking-[-0.055em]">
              {event.title}
            </h1>

            {event.organizerName && (
              <p className="mt-4 text-sm text-muted-foreground">Filed by {event.organizerName}</p>
            )}

            {event.coverImage && (
              <div className="relative mt-8 aspect-[16/8] overflow-hidden border-2 border-foreground bg-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.coverImage}
                  alt=""
                  className="size-full object-cover"
                />
              </div>
            )}

            <dl className="mt-8 divide-y divide-foreground/35 border-y-2 border-foreground text-sm">
              <div className="grid gap-2 py-4 sm:grid-cols-[10rem_1fr]">
                <dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <CalendarBlank aria-hidden className="size-4" />
                  Dates
                </dt>
                <dd className="font-semibold">{formatEventDateRange(event.startDate, event.endDate)}</dd>
              </div>
              <div className="grid gap-2 py-4 sm:grid-cols-[10rem_1fr]">
                <dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <MapPin aria-hidden className="size-4" />
                  Place
                </dt>
                <dd>
                  <Link href={`/cities/${event.city.slug}`} className="font-semibold underline underline-offset-4 hover:text-primary">
                    {event.city.name}
                  </Link>
                  {event.venue ? ` · ${event.venue}` : event.isOnline ? " · Online" : null}
                </dd>
              </div>
              {event.prizePool && (
                <div className="grid gap-2 py-4 sm:grid-cols-[10rem_1fr]">
                  <dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <Star aria-hidden className="size-4 text-primary" />
                    Prize
                  </dt>
                  <dd className="font-semibold text-primary">{event.prizePool}</dd>
                </div>
              )}
              <div className="grid gap-2 py-4 sm:grid-cols-[10rem_1fr]">
                <dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <LinkSimple aria-hidden className="size-4" />
                  Source
                </dt>
                <dd className="font-semibold">
                  {sourceLabel}
                  {extraSources.length > 0
                    ? ` · also ${extraSources.map((item) => SOURCE_LABELS[item] || item).join(", ")}`
                    : null}
                </dd>
              </div>
            </dl>

            <section className="mt-10">
              <h2 className="border-b-2 border-foreground pb-3 font-heading text-3xl font-semibold tracking-[-0.04em]">
                Dispatch
              </h2>
              <div className="mt-5 max-w-[68ch] space-y-4 text-base leading-relaxed whitespace-pre-wrap">
                {event.description}
              </div>
            </section>

            {event.tags.length > 0 && (
              <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {event.tags.map((tag) => `#${tag}`).join("  ")}
              </p>
            )}
          </article>

          <aside className="lg:sticky lg:top-24">
            <CountdownTimer deadline={event.registrationDeadline?.toISOString() ?? null} />

            <RegistrationCta
              slug={event.slug}
              source={event.source}
              sourceUrl={event.sourceUrl}
              registrationUrl={event.registrationUrl}
              registrationType={event.registrationType}
              registrationDeadline={event.registrationDeadline}
              status={event.status}
              formFields={formFields}
              signedIn={Boolean(user)}
              defaultEmail={user?.email}
              alreadyRegistered={alreadyRegistered}
            />
            <SaveEventButton
              slug={event.slug}
              initialSaved={saved}
              signedIn={Boolean(user)}
              variant="detail"
            />

            <div className="mt-6 border-2 border-foreground bg-card p-4">
              <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
                <ShareNetwork aria-hidden className="size-4" />
                Share this listing
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${event.sourceUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 items-center justify-center gap-2 border border-foreground text-[10px] font-semibold uppercase tracking-[0.12em] hover:bg-foreground hover:text-background"
                >
                  <WhatsappLogo aria-hidden className="size-4" />
                  WhatsApp
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(event.sourceUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 items-center justify-center border border-foreground text-[10px] font-semibold uppercase tracking-[0.12em] hover:bg-foreground hover:text-background"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16 border-t-2 border-foreground pt-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                  Same desk / {event.city.name}
                </p>
                <h2 className="mt-1 font-heading text-4xl font-semibold tracking-[-0.04em]">More nearby.</h2>
              </div>
              <Link
                href={`/cities/${event.city.slug}`}
                className="hidden min-h-11 items-center text-[10px] font-semibold uppercase tracking-[0.12em] underline underline-offset-4 hover:text-primary sm:flex"
              >
                Full city index
              </Link>
            </div>
            <div className="grid border-l border-t border-foreground md:grid-cols-2 xl:grid-cols-3">
              {related.map((item, index) => (
                <EventCard
                  key={item.id}
                  event={item}
                  index={index + 1}
                  saved={savedIds.has(item.id)}
                  signedIn={Boolean(user)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
