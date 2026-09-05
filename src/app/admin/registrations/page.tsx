import Link from "next/link";
import { ArrowLeft, Table } from "@phosphor-icons/react/dist/ssr";

import { AdminLocked } from "@/components/admin-locked";
import { SiteHeader } from "@/components/site-header";
import { getAdminUser } from "@/lib/admin";
import { getNativeEventsWithCounts } from "@/lib/registrations";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Signups desk",
  description: "Admin desk for native event registrations.",
  path: "/admin/registrations",
  noIndex: true,
});

export default async function AdminRegistrationsPage() {
  const admin = await getAdminUser();

  if (!admin) {
    return <AdminLocked title="Signups desk is locked." nextPath="/admin/registrations" />;
  }

  const events = await getNativeEventsWithCounts();

  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-16 pt-[6.5rem] sm:px-6 lg:px-10">
        <Link
          href="/admin"
          className="inline-flex min-h-11 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em]"
        >
          <ArrowLeft className="size-4" />
          Admin
        </Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-6">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              Native registration
            </p>
            <h1 className="mt-2 font-heading text-5xl font-semibold tracking-[-0.05em]">Signups ledger</h1>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {events.length} hosted forms
          </p>
        </div>

        {events.length === 0 ? (
          <p className="mt-10 max-w-[52ch] text-sm text-muted-foreground">
            No on-site forms yet. Community submitters can choose “HackScout form” on /submit.
          </p>
        ) : (
          <div className="mt-8 overflow-x-auto border-2 border-foreground">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b-2 border-foreground bg-muted font-mono text-[10px] uppercase tracking-[0.12em]">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Review</th>
                  <th className="px-4 py-3">Signups</th>
                  <th className="px-4 py-3">Open</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-t border-foreground/30">
                    <td className="px-4 py-4 font-semibold">{event.title}</td>
                    <td className="px-4 py-4">{event.city.name}</td>
                    <td className="px-4 py-4 font-mono text-[10px] uppercase">{event.reviewStatus}</td>
                    <td className="px-4 py-4">{event._count.registrations}</td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/registrations/${event.slug}`}
                        className="inline-flex items-center gap-1 underline underline-offset-4"
                      >
                        <Table className="size-4" />
                        Table
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
