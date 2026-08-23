import Link from "next/link";
import { ArrowLeft, ArrowUpRight, LockKey, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

import { MissingReportActions } from "@/components/missing-report-actions";
import { SiteHeader } from "@/components/site-header";
import { getAdminUser } from "@/lib/admin";
import { getMissingEventQueue } from "@/lib/missing-events";
import type { ReviewFilter } from "@/lib/submissions";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Missing-event tips",
  description: "Admin queue for missing-event reports.",
  path: "/admin/missing",
  noIndex: true,
});

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

function parseStatus(value?: string): ReviewFilter {
  if (value === "approved" || value === "rejected" || value === "pending") return value;
  return "pending";
}

export default async function AdminMissingPage({ searchParams }: PageProps) {
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
              Tip tray is locked.
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Sign in with an address listed in <code>ADMIN_EMAILS</code>.
            </p>
            <Link href="/login?next=%2Fadmin%2Fmissing" className="mt-6 inline-flex min-h-11 items-center underline">
              Sign in
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { reports, tally } = await getMissingEventQueue(status);

  const tabs: { id: ReviewFilter; label: string; count: number }[] = [
    { id: "pending", label: "Inbox", count: tally.pending },
    { id: "approved", label: "Logged", count: tally.approved },
    { id: "rejected", label: "Dismissed", count: tally.rejected },
  ];

  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-16 pt-[6.5rem] sm:px-6 lg:px-10">
        <Link
          href="/admin"
          className="inline-flex min-h-11 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em]"
        >
          <ArrowLeft className="size-4" />
          Review queue
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b-2 border-foreground pb-6">
          <div>
            <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              <ShieldCheck className="size-4" weight="fill" />
              Signed in as {admin.email}
            </p>
            <h1 className="mt-2 font-heading text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
              Missing-event tips
            </h1>
            <p className="mt-3 max-w-[54ch] text-sm text-muted-foreground">
              Community gap reports land here. Look up the event, file a listing if it is real, then mark
              the tip logged.
            </p>
          </div>
          <Link
            href="/submit"
            className="inline-flex min-h-11 items-center gap-2 border-2 border-foreground px-4 text-[10px] font-semibold uppercase tracking-[0.12em]"
          >
            File a listing
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Tip filters">
          {tabs.map((tab) => {
            const active = tab.id === status;
            return (
              <Link
                key={tab.id}
                href={tab.id === "pending" ? "/admin/missing" : `/admin/missing?status=${tab.id}`}
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

        {reports.length === 0 ? (
          <p className="mt-12 max-w-[48ch] border-l-4 border-primary pl-4 text-sm">
            {status === "pending"
              ? "No open tips. The Missing an event? form will land here."
              : `No ${status === "approved" ? "logged" : "dismissed"} tips in this tray.`}
          </p>
        ) : (
          <ul className="mt-10 grid gap-6 lg:grid-cols-2">
            {reports.map((report) => (
              <li key={report.id} className="border-2 border-foreground bg-card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                  <span>{report.cityName}</span>
                  <span>
                    {report.createdAt.toLocaleDateString("en-PK", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <h2 className="mt-3 font-heading text-2xl font-semibold tracking-[-0.03em]">{report.title}</h2>
                {report.description ? (
                  <p className="mt-3 text-sm leading-relaxed">{report.description}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-[0.12em]">
                  {report.sourceUrl ? (
                    <a
                      href={report.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4"
                    >
                      Source link
                    </a>
                  ) : null}
                  {report.pagePath ? <span className="text-muted-foreground">From {report.pagePath}</span> : null}
                </div>
                <MissingReportActions reportId={report.id} reviewStatus={report.status} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
