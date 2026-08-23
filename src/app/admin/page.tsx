import Link from "next/link";
import { ArrowUpRight, LockKey, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

import { ReviewQueueActions } from "@/components/review-queue-actions";
import { SiteHeader } from "@/components/site-header";
import { getAdminUser } from "@/lib/admin";
import { formatCategory, formatEventDateRange, SOURCE_LABELS } from "@/lib/events";
import {
  getReviewQueue,
  listReviewCities,
  type ReviewFilter,
} from "@/lib/submissions";

import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Review queue",
  description: "Admin review queue for HackScout submissions.",
  path: "/admin",
  noIndex: true,
});

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

function parseStatus(value?: string): ReviewFilter {
  if (value === "approved" || value === "rejected" || value === "pending") return value;
  return "pending";
}

export default async function AdminPage({ searchParams }: PageProps) {
  const admin = await getAdminUser();
  const params = await searchParams;
  const status = parseStatus(params.status);

  if (!admin) {
    return (
      <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="mx-auto w-full max-w-[720px] flex-1 px-4 pb-16 pt-[6.5rem] sm:px-6">
          <div className="border-2 border-foreground bg-card p-8">
            <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              <LockKey className="size-4" />
              Restricted desk
            </p>
            <h1 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.04em]">
              Review queue is locked.
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Sign in with an address listed in <code>ADMIN_EMAILS</code>.
            </p>
            <Link href="/login?next=%2Fadmin" className="mt-6 inline-flex min-h-11 items-center underline">
              Sign in
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const [{ events, tally }, cities] = await Promise.all([getReviewQueue(status), listReviewCities()]);

  const tabs: { id: ReviewFilter; label: string; count: number }[] = [
    { id: "pending", label: "Inbox", count: tally.pending },
    { id: "approved", label: "Live", count: tally.approved },
    { id: "rejected", label: "Held", count: tally.rejected },
  ];

  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-16 pt-[6.5rem] sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-6">
          <div>
            <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              <ShieldCheck className="size-4" weight="fill" />
              Signed in as {admin.email}
            </p>
            <h1 className="mt-2 font-heading text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
              Review queue
            </h1>
            <p className="mt-3 max-w-[54ch] text-sm text-muted-foreground">
              Community filings wait here. Publish to put them on the public feed; reject to keep them off
              the map.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/missing"
              className="inline-flex min-h-11 items-center gap-2 border-2 border-foreground px-4 text-[10px] font-semibold uppercase tracking-[0.12em]"
            >
              Missing-event tips
              <ArrowUpRight className="size-4" />
            </Link>
            <Link
              href="/admin/registrations"
              className="inline-flex min-h-11 items-center gap-2 border-2 border-foreground px-4 text-[10px] font-semibold uppercase tracking-[0.12em]"
            >
              Signups ledger
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>

        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Queue filters">
          {tabs.map((tab) => {
            const active = tab.id === status;
            return (
              <Link
                key={tab.id}
                href={tab.id === "pending" ? "/admin" : `/admin?status=${tab.id}`}
                className={`inline-flex min-h-11 items-center gap-2 border-2 px-4 font-mono text-[10px] uppercase tracking-[0.14em] ${
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-foreground/40 hover:border-foreground"
                }`}
              >
                {tab.label}
                <span>{tab.count}</span>
              </Link>
            );
          })}
        </nav>

        {events.length === 0 ? (
          <p className="mt-12 max-w-[48ch] border-l-4 border-primary pl-4 text-sm">
            {status === "pending"
              ? "Inbox is clear. New /submit filings and missing-event tips wait in their trays."
              : `No ${status} events in this tray.`}
          </p>
        ) : (
          <ul className="mt-10 grid gap-6 lg:grid-cols-2">
            {events.map((event) => (
              <li key={event.id} className="border-2 border-foreground bg-card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                  <span>
                    {SOURCE_LABELS[event.source] ?? event.source} · {formatCategory(event.category)}
                  </span>
                  <span>{event.city.name}</span>
                </div>
                <h2 className="mt-3 font-heading text-2xl font-semibold tracking-[-0.03em]">{event.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatEventDateRange(event.startDate, event.endDate)}
                  {event.registrationDeadline
                    ? ` · closes ${event.registrationDeadline.toLocaleDateString("en-PK", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}`
                    : ""}
                </p>
                {event.organizerName ? (
                  <p className="mt-1 text-sm">Organizer: {event.organizerName}</p>
                ) : null}
                <p className="mt-3 line-clamp-4 text-sm leading-relaxed">{event.description}</p>
                <div className="mt-4 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-[0.12em]">
                  {event.registrationUrl || event.sourceUrl ? (
                    <a
                      href={event.registrationUrl || event.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4"
                    >
                      Source link
                    </a>
                  ) : null}
                  {event.sourcePostUrl ? (
                    <a href={event.sourcePostUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                      Original post
                    </a>
                  ) : null}
                  {event.reviewStatus === "approved" ? (
                    <Link href={`/events/${event.slug}`} className="underline underline-offset-4">
                      Public page
                    </Link>
                  ) : null}
                </div>
                <ReviewQueueActions
                  eventId={event.id}
                  currentCityId={event.cityId}
                  reviewStatus={event.reviewStatus}
                  cities={cities}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
