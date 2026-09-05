import Link from "next/link";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr";

import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/db";
import { verifyPublishToken } from "@/lib/publish-token";
import { pageMetadata } from "@/lib/site";
import { approveEvent } from "@/lib/submissions";

export const metadata = pageMetadata({
  title: "Publish confirmation",
  description: "Confirm an organizer email to publish a HackScout event listing.",
  path: "/publish/confirm",
  noIndex: true,
});

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

type ConfirmResult =
  | { kind: "published"; title: string; slug: string }
  | { kind: "already"; title: string; slug: string }
  | { kind: "error"; message: string };

async function resolveConfirm(token: string | undefined): Promise<ConfirmResult> {
  if (!token) {
    return { kind: "error", message: "This publish link is missing a token." };
  }

  const verified = verifyPublishToken(token);
  if (!verified) {
    return {
      kind: "error",
      message: "This publish link is invalid or has expired. Submit the event again to get a new email.",
    };
  }

  const existing = await prisma.event.findUnique({
    where: { id: verified.eventId },
    select: { id: true, title: true, slug: true, reviewStatus: true },
  });

  if (!existing) {
    return { kind: "error", message: "That event listing no longer exists." };
  }

  if (existing.reviewStatus === "approved") {
    return { kind: "already", title: existing.title, slug: existing.slug };
  }

  if (existing.reviewStatus === "rejected") {
    return {
      kind: "error",
      message: "This listing was held and cannot be published from this link.",
    };
  }

  const event = await approveEvent(existing.id);
  return { kind: "published", title: event.title, slug: event.slug };
}

export default async function PublishConfirmPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const result = await resolveConfirm(params.token);
  const ok = result.kind === "published" || result.kind === "already";

  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 pb-16 pt-[6.5rem] sm:px-6">
        <div className="border-2 border-foreground bg-card p-8">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            Organizer confirm
          </p>
          <h1 className="mt-4 flex items-start gap-3 font-heading text-4xl font-semibold tracking-[-0.04em]">
            {ok ? (
              <CheckCircle className="mt-1 size-8 shrink-0 text-primary" weight="fill" />
            ) : (
              <WarningCircle className="mt-1 size-8 shrink-0 text-destructive" weight="fill" />
            )}
            {result.kind === "published"
              ? "Listing is live."
              : result.kind === "already"
                ? "Already published."
                : "Could not publish."}
          </h1>
          {ok ? (
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{result.title}</span> is on the HackScout
              directory.
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">{result.message}</p>
          )}
          <div className="mt-8 flex flex-wrap gap-4">
            {ok ? (
              <Link
                href={`/events/${result.slug}`}
                className="inline-flex min-h-11 items-center border-2 border-foreground bg-primary px-4 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground"
              >
                View event
              </Link>
            ) : null}
            <Link href="/submit" className="inline-flex min-h-11 items-center underline">
              Submit another
            </Link>
            <Link href="/events" className="inline-flex min-h-11 items-center underline">
              Browse events
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
