import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Crosshair, Globe, MapPin } from "@phosphor-icons/react/dist/ssr";

import { SiteHeader } from "@/components/site-header";
import { PAKISTAN_CITIES } from "@/lib/cities";

export const metadata: Metadata = {
  title: "Cities Directory | HackScout",
  description:
    "Browse tech, hackathon, and developer event hubs across all provinces and regions in Pakistan.",
};

const cityHighlights: Record<
  string,
  { events: number; tag: string; activeHackathons: string }
> = {
  karachi: { events: 18, tag: "Coastal Mega Hub", activeHackathons: "FAST, NED, IBA, TechJuice" },
  lahore: { events: 14, tag: "Startup & Dev Valley", activeHackathons: "LUMS, FAST, ITU, PUCIT" },
  islamabad: { events: 9, tag: "Federal AI & DeepTech", activeHackathons: "NUST, FAST, COMSATS" },
  rawalpindi: { events: 5, tag: "Twin Cities Circuit", activeHackathons: "Cyber & Security Sprints" },
  topi: { events: 4, tag: "GIKI Tech Oasis", activeHackathons: "ACM All-Pakistan Olympiad" },
  faisalabad: { events: 4, tag: "Industrial Tech Center", activeHackathons: "AgriTech & Youth Summits" },
  peshawar: { events: 3, tag: "Frontier Tech Hub", activeHackathons: "UET Peshawar, IM|Sciences" },
  multan: { events: 3, tag: "South Punjab Devs", activeHackathons: "Bahauddin Zakariya Univ" },
  quetta: { events: 2, tag: "Balochistan Tech Hub", activeHackathons: "BUITEMS & UOB Hack" },
  hyderabad: { events: 2, tag: "Sindh Univ Circuit", activeHackathons: "Mehran UET Circuit" },
  online: { events: 24, tag: "Nationwide Digital", activeHackathons: "Virtual Hackathons & Global" },
};

const provinces = [
  { code: "01", name: "Federal & Virtual", keys: ["online", "islamabad"] },
  { code: "02", name: "Punjab Hubs", keys: ["lahore", "rawalpindi", "faisalabad", "multan", "sialkot", "gujranwala"] },
  { code: "03", name: "Sindh Hubs", keys: ["karachi", "hyderabad", "sukkur"] },
  { code: "04", name: "Khyber Pakhtunkhwa", keys: ["peshawar", "topi", "abbottabad", "mardan", "swat"] },
  { code: "05", name: "Balochistan & Northern Regions", keys: ["quetta", "gwadar", "muzaffarabad", "gilgit"] },
];

export default function CitiesPage() {
  const listedCities = provinces.reduce((total, province) => total + province.keys.length, 0);
  const activeEvents = Object.values(cityHighlights).reduce((total, city) => total + city.events, 0);

  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />

      <header className="border-b-2 border-foreground pt-[4.5rem]">
        <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[1.35fr_.65fr]">
          <div className="relative overflow-hidden border-foreground px-4 py-12 sm:px-6 sm:py-16 lg:border-r lg:px-10 lg:py-20">
            <div aria-hidden className="paper-grid absolute inset-0 opacity-35" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3 border-y border-foreground py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
                <span className="flex items-center gap-2 text-primary">
                  <Crosshair className="size-4" weight="bold" />
                  Geographic wire / all provinces
                </span>
                <span>Pakistan / PKT</span>
              </div>

              <h1 className="mt-9 max-w-[10ch] font-heading text-[clamp(4rem,9vw,8rem)] font-medium leading-[0.8] tracking-[-0.06em]">
                Find your local
                <span className="block italic text-primary">tech signal.</span>
              </h1>
              <p className="mt-8 max-w-[55ch] border-l-4 border-primary pl-4 text-sm font-medium leading-relaxed sm:text-base">
                Follow university circuits, independent communities, developer meetups and
                open competitions from Karachi to Gilgit—and every active desk between.
              </p>
            </div>
          </div>

          <aside className="flex flex-col justify-between bg-foreground p-6 text-background sm:p-10 lg:p-12">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/55">
                Directory ledger
              </p>
              <h2 className="mt-2 font-heading text-4xl italic">National coverage</h2>
            </div>
            <dl className="mt-12 divide-y divide-background/30 border-y border-background/40">
              <div className="flex items-end justify-between py-6">
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-background/60">
                  Listed city desks
                </dt>
                <dd className="font-heading text-6xl text-primary-foreground">{listedCities}</dd>
              </div>
              <div className="flex items-end justify-between py-6">
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-background/60">
                  Indexed events
                </dt>
                <dd className="font-heading text-6xl text-primary-foreground">{activeEvents}+</dd>
              </div>
            </dl>
            <p className="mt-8 font-mono text-[9px] uppercase leading-relaxed tracking-[0.13em] text-background/55">
              City counts reflect currently indexed registrations and update as source feeds are scanned.
            </p>
          </aside>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
        <div className="mb-12 flex flex-col justify-between gap-4 border-b-2 border-foreground pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              Regional desks / 05 editions
            </p>
            <h2 className="mt-2 font-heading text-4xl font-medium tracking-[-0.04em] sm:text-6xl">
              Browse the field.
            </h2>
          </div>
          <p className="max-w-[36ch] text-xs leading-relaxed text-muted-foreground sm:text-right">
            Each dispatch opens a live event feed filtered to that city or region.
          </p>
        </div>

        <div className="space-y-16">
          {provinces.map((province) => (
            <section key={province.name} aria-labelledby={`region-${province.code}`}>
              <div className="grid grid-cols-[3rem_1fr_auto] items-end gap-3 border-b-2 border-foreground pb-3">
                <span className="font-mono text-xs text-primary">{province.code}</span>
                <h2
                  id={`region-${province.code}`}
                  className="font-heading text-3xl font-semibold tracking-[-0.035em] sm:text-4xl"
                >
                  {province.name}
                </h2>
                <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground sm:block">
                  {province.keys.length} desks
                </span>
              </div>

              <div className="grid border-l border-foreground sm:grid-cols-2 lg:grid-cols-3">
                {province.keys.map((slug, index) => {
                  const cityMeta = PAKISTAN_CITIES.find((city) => city.slug === slug);
                  const info = cityHighlights[slug] || {
                    events: 1,
                    tag: "Active Tech Community",
                    activeHackathons: "Meetups & Workshops",
                  };
                  const name = cityMeta ? cityMeta.name : slug.charAt(0).toUpperCase() + slug.slice(1);
                  const isOnline = slug === "online";

                  return (
                    <article
                      key={slug}
                      className="group min-h-[18rem] border-b border-r border-foreground bg-background transition-colors hover:bg-card"
                    >
                      <Link
                        href={`/cities/${slug}`}
                        className="flex h-full min-h-[18rem] flex-col p-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:p-6"
                        aria-label={`View events in ${name}`}
                      >
                        <div className="flex items-start justify-between border-b border-foreground pb-4">
                          <span className="font-heading text-4xl italic text-muted-foreground/70">
                            {province.code}.{String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="grid size-11 place-items-center border border-foreground bg-card">
                            {isOnline ? (
                              <Globe aria-hidden className="size-5 text-primary" />
                            ) : (
                              <MapPin aria-hidden className="size-5 text-primary" weight="fill" />
                            )}
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col justify-between py-5">
                          <div>
                            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-primary">
                              {info.tag}
                            </p>
                            <h3 className="mt-3 font-heading text-4xl font-semibold leading-none tracking-[-0.04em] transition-transform group-hover:translate-x-1">
                              {name}
                            </h3>
                            <p className="mt-3 max-w-[30ch] text-xs leading-relaxed text-muted-foreground">
                              {info.activeHackathons}
                            </p>
                          </div>

                          <div className="mt-6 flex items-end justify-between border-t border-foreground/40 pt-4">
                            <div>
                              <span className="block font-heading text-4xl font-semibold text-primary">
                                {info.events}
                              </span>
                              <span className="font-mono text-[8px] uppercase tracking-[0.13em] text-muted-foreground">
                                Open {info.events === 1 ? "event" : "events"}
                              </span>
                            </div>
                            <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em]">
                              Open desk
                              <ArrowUpRight
                                aria-hidden
                                className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                              />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t-2 border-foreground bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6 lg:px-10">
          <p className="max-w-[38ch] font-heading text-3xl font-medium leading-tight">
            Don&apos;t see your local community?
          </p>
          <Link
            href="/submit"
            className="flex min-h-12 items-center justify-between gap-5 border border-primary-foreground bg-primary-foreground px-5 text-xs font-semibold uppercase tracking-[0.12em] text-primary transition-colors hover:bg-foreground hover:text-background"
          >
            File an event listing
            <ArrowUpRight />
          </Link>
        </div>
      </footer>
    </div>
  );
}
