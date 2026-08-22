import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookmarkSimple } from "@phosphor-icons/react/dist/ssr";

import { EventCard } from "@/components/event-card";
import { SiteHeader } from "@/components/site-header";
import { getAuthUser } from "@/lib/auth";
import { getSavedEvents } from "@/lib/saved-events";

export const metadata: Metadata = {
  title: "Saved events",
  description: "Listings you pinned on HackScout so registration deadlines do not slip.",
};

export default async function SavedEventsPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login?next=/saved");
  }

  const events = await getSavedEvents(user.id);

  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />

      <header className="border-b-2 border-foreground pt-[4.5rem]">
        <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-foreground py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
            <span className="text-primary">Personal desk / Saved</span>
            <span>Newest pin first</span>
          </div>
          <h1 className="mt-7 max-w-[12ch] font-heading text-[clamp(3.4rem,8vw,7rem)] font-medium leading-[0.8] tracking-[-0.06em]">
            Held for later.
          </h1>
          <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
            These listings stay on your desk until you unpin them. Deadlines still close on the
            organizer’s clock.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-10 sm:px-6 lg:px-10">
        {events.length === 0 ? (
          <div className="border-2 border-foreground bg-card p-8">
            <BookmarkSimple aria-hidden className="size-8 text-primary" />
            <h2 className="mt-4 font-heading text-3xl font-semibold tracking-[-0.04em]">
              No pins yet.
            </h2>
            <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
              Open any listing and save it. It will land here so you can come back before
              registration closes.
            </p>
            <Link
              href="/events"
              className="mt-6 inline-flex min-h-11 items-center border-2 border-foreground bg-foreground px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-background hover:bg-primary hover:text-primary-foreground"
            >
              Browse the index
            </Link>
          </div>
        ) : (
          <div className="grid border-l border-t border-foreground md:grid-cols-2 xl:grid-cols-3">
            {events.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                index={index + 1}
                saved
                signedIn
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
