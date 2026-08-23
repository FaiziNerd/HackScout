import Link from "next/link";
import { LinkedinLogo } from "@phosphor-icons/react/dist/ssr";

import { SiteHeader } from "@/components/site-header";
import { SubmitEventForm, SubmitPageHero } from "@/components/submit-event-form";
import { PAKISTAN_CITIES } from "@/lib/cities";
import { prisma } from "@/lib/db";

import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Submit an Event",
  description:
    "Add your hackathon, developer meetup, or tech conference to HackScout's Pakistan directory.",
  path: "/submit",
});

export default async function SubmitPage() {
  const cities = await prisma.city.findMany({
    select: { slug: true, name: true, province: true, isVirtual: true },
    orderBy: [{ isVirtual: "desc" }, { name: "asc" }],
  });

  const options = cities.length > 0 ? cities : PAKISTAN_CITIES;

  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <SubmitPageHero />
      <main className="mx-auto grid w-full max-w-[1500px] flex-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[16rem_1fr] lg:px-10 lg:py-16">
        <aside className="h-fit border-y-2 border-foreground py-5 lg:sticky lg:top-24">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            Filing notes
          </p>
          <ol className="mt-5 space-y-5">
            {[
              ["01", "Use the official event and registration links."],
              ["02", "Include the final registration deadline."],
              ["03", "The desk verifies each submission before publishing."],
            ].map(([number, text]) => (
              <li key={number} className="grid grid-cols-[2rem_1fr] gap-2 text-xs leading-relaxed">
                <span className="font-mono text-[10px] text-muted-foreground">{number}</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
          <Link
            href="/submit/linkedin"
            className="mt-6 flex min-h-11 items-center justify-between gap-3 border-2 border-foreground bg-card px-3 text-[10px] font-semibold uppercase tracking-[0.12em] hover:bg-muted"
          >
            Capture LinkedIn post
            <LinkedinLogo className="size-4" weight="fill" />
          </Link>
        </aside>
        <SubmitEventForm cities={options} />
      </main>
    </div>
  );
}
