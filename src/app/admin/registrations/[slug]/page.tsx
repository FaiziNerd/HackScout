import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, DownloadSimple, LockKey } from "@phosphor-icons/react/dist/ssr";

import { SiteHeader } from "@/components/site-header";
import { getAdminUser } from "@/lib/admin";
import { getEventRegistrations } from "@/lib/registrations";
import { pageMetadata } from "@/lib/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return pageMetadata({
    title: `Signups · ${slug}`,
    description: "Admin registration export for a hosted HackScout event.",
    path: `/admin/registrations/${slug}`,
    noIndex: true,
  });
}

export default async function EventRegistrationsPage({ params }: PageProps) {
  const { slug } = await params;
  const admin = await getAdminUser();

  if (!admin) {
    return (
      <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="mx-auto w-full max-w-[720px] flex-1 px-4 pb-16 pt-[6.5rem]">
          <div className="border-2 border-foreground p-8">
            <LockKey className="size-6" />
            <h1 className="mt-4 font-heading text-3xl">Locked</h1>
            <Link href="/login" className="mt-4 inline-block underline">
              Sign in
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const data = await getEventRegistrations(slug);
  if (!data) notFound();

  const { event, fields, rows } = data;

  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-16 pt-[6.5rem] sm:px-6 lg:px-10">
        <Link
          href="/admin/registrations"
          className="inline-flex min-h-11 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em]"
        >
          <ArrowLeft className="size-4" />
          All hosted forms
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
              {event.city.name} · {rows.length} rows
            </p>
            <h1 className="mt-2 max-w-[20ch] font-heading text-4xl font-semibold tracking-[-0.04em]">
              {event.title}
            </h1>
          </div>
          <a
            href={`/api/events/${event.slug}/registrations?format=csv`}
            className="inline-flex min-h-11 items-center gap-2 border-2 border-foreground bg-foreground px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-background hover:bg-primary hover:text-primary-foreground"
          >
            <DownloadSimple className="size-4" />
            Export CSV
          </a>
        </div>

        {rows.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          <div className="mt-8 overflow-x-auto border-2 border-foreground">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="border-b-2 border-foreground bg-muted font-mono text-[10px] uppercase tracking-[0.12em]">
                <tr>
                  <th className="px-3 py-3">Filed</th>
                  {fields.map((field) => (
                    <th key={field.id} className="px-3 py-3">
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-foreground/30 align-top">
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px]">
                      {row.createdAt.toLocaleString("en-PK")}
                    </td>
                    {fields.map((field) => (
                      <td key={field.id} className="max-w-[16rem] px-3 py-3 break-words">
                        {row.payload[field.id] || (field.id === "email" ? row.email : "—")}
                      </td>
                    ))}
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
