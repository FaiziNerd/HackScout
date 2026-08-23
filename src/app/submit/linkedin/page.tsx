import Link from "next/link";
import { ArrowLeft, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

import { LinkedInCaptureForm } from "@/components/linkedin-capture-form";
import { SiteHeader } from "@/components/site-header";
import { PAKISTAN_CITIES } from "@/lib/cities";
import { prisma } from "@/lib/db";

import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Capture LinkedIn Event",
  description:
    "Turn a public LinkedIn event announcement into a structured HackScout listing for review.",
  path: "/submit/linkedin",
});

const discoveryQueries = [
  "site:linkedin.com/posts hackathon Pakistan registration deadline",
  "site:linkedin.com/posts conference Karachi register",
  "site:linkedin.com/posts workshop Lahore registration open",
  "site:linkedin.com/posts university event Islamabad apply by",
];

export default async function LinkedInSubmitPage() {
  const cities = await prisma.city.findMany({
    select: { slug: true, name: true, province: true, isVirtual: true },
    orderBy: [{ isVirtual: "desc" }, { name: "asc" }],
  });
  const options = cities.length > 0 ? cities : PAKISTAN_CITIES;

  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <header className="border-b-2 border-foreground pt-[4.5rem]">
        <div className="relative mx-auto max-w-[1500px] overflow-hidden px-4 py-12 sm:px-6 sm:py-16 lg:px-10 lg:py-20">
          <div aria-hidden className="paper-grid absolute inset-0 opacity-35" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-end">
            <div>
              <Link
                href="/submit"
                className="inline-flex min-h-11 items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] hover:text-primary"
              >
                <ArrowLeft aria-hidden className="size-4" />
                Back to full form
              </Link>
              <div className="mt-5 border-y border-foreground py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                LinkedIn post capture / no login scraping
              </div>
              <h1 className="mt-8 max-w-[11ch] font-heading text-[clamp(4rem,9vw,8rem)] font-medium leading-[0.78] tracking-[-0.06em]">
                Catch posts before they vanish.
              </h1>
            </div>
            <p className="border-l-4 border-primary pl-4 text-sm font-medium leading-relaxed">
              Paste a LinkedIn URL or copied text. HackScout extracts a draft, then you verify it
              before it reaches the admin review queue.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1500px] flex-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[18rem_1fr] lg:px-10 lg:py-16">
        <aside className="h-fit border-y-2 border-foreground py-5 lg:sticky lg:top-24">
          <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            <MagnifyingGlass className="size-4" />
            Discovery searches
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Use public search results to find candidate posts. Open the post, then paste its URL or
            text here.
          </p>
          <div className="mt-5 grid gap-3">
            {discoveryQueries.map((query) => (
              <a
                key={query}
                href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
                target="_blank"
                rel="noreferrer"
                className="border border-foreground/40 p-3 text-xs leading-relaxed hover:border-foreground hover:bg-muted"
              >
                {query}
              </a>
            ))}
          </div>
        </aside>
        <LinkedInCaptureForm cities={options} />
      </main>
    </div>
  );
}
