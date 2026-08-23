import Link from "next/link";
import {
  ArrowUpRight,
  BellRinging,
  CalendarDots,
  Code,
  GraduationCap,
  MicrophoneStage,
  Radio,
  Trophy,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";

import { CityIndex } from "@/components/landing/city-index";
import { HeroCopy, Reveal } from "@/components/landing/hero-motion";
import { SiteHeader } from "@/components/site-header";
import { buttonVariants } from "@/components/ui/button";
import { formatCategory, formatDeadlineLabel, getAllCityEventCounts, getFeedStats, getUpcomingEvents } from "@/lib/events";
import { pageMetadata } from "@/lib/site";
import { cn, formatPrizePool } from "@/lib/utils";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "HackScout — Pakistan's Developer & Tech Event Hub",
  description:
    "Every hackathon, developer conference, workshop, and meetup across Pakistan. Curated by city, sorted by registration deadlines.",
  path: "/",
});

const FALLBACK_CLOSING = [
  {
    number: "01",
    title: "FAST National Hackathon 2026",
    host: "ACM FAST-NUCES",
    city: "Lahore",
    type: "Hackathon",
    deadline: "03 days",
    detail: "PKR 500,000",
    href: "/events/fast-national-hackathon-2026",
  },
  {
    number: "02",
    title: "PyCon Pakistan Annual Summit",
    host: "Python PK",
    city: "Karachi",
    type: "Conference",
    deadline: "06 days",
    detail: "Keynotes + sprints",
    href: "/events/pycon-pakistan-2026",
  },
  {
    number: "03",
    title: "NUST Robotics & AI Challenge",
    host: "NUST SEECS",
    city: "Islamabad",
    type: "Competition",
    deadline: "09 days",
    detail: "PKR 350,000",
    href: "/events/nust-ai-summit-2026",
  },
  {
    number: "04",
    title: "GIKI Software Olympiad",
    host: "ACM GIKI",
    city: "Topi",
    type: "Hackathon",
    deadline: "15 days",
    detail: "PKR 400,000",
    href: "/events/giki-software-olympiad-2026",
  },
];

const feeds = [
  ["Devfolio PK", "12", "04m"],
  ["Luma Circles", "28", "01m"],
  ["Campus desks", "35", "verified"],
  ["Unstop + Devpost", "10", "08m"],
];

const capabilities = [
  {
    number: "I",
    kicker: "DISCOVERY",
    title: "One national signal.",
    body: "Devfolio, Luma, Unstop, Eventbrite and university societies are gathered into one continuously updated dispatch.",
  },
  {
    number: "II",
    kicker: "DEADLINES",
    title: "The cutoff comes first.",
    body: "Registration closing times, team requirements and early-bird limits are surfaced before the promotional noise.",
  },
  {
    number: "III",
    kicker: "ACTION",
    title: "Straight to the source.",
    body: "Every verified listing leads directly to the organizer, official form or host dashboard. No login and no detours.",
  },
];

const categories = [
  {
    name: "Hackathons",
    note: "Build fast. Ship something real.",
    count: "26 open",
    href: "/events?category=hackathon",
    icon: Code,
  },
  {
    name: "Conferences",
    note: "Big rooms, new ideas, useful people.",
    count: "14 open",
    href: "/events?category=conference",
    icon: MicrophoneStage,
  },
  {
    name: "Workshops",
    note: "Hands-on sessions for sharper skills.",
    count: "19 open",
    href: "/events?category=workshop",
    icon: GraduationCap,
  },
  {
    name: "Meetups",
    note: "Find your local developer circle.",
    count: "17 open",
    href: "/events?category=meetup",
    icon: UsersThree,
  },
  {
    name: "Competitions",
    note: "Code, robotics, ideas and prizes.",
    count: "09 open",
    href: "/events?category=competition",
    icon: Trophy,
  },
  {
    name: "Tech talks",
    note: "Focused conversations with practitioners.",
    count: "11 open",
    href: "/events?category=tech-talk",
    icon: CalendarDots,
  },
];

const faqs = [
  {
    question: "How does HackScout verify an event?",
    answer:
      "We check the official organizer page, registration link, dates and location before a listing is marked verified.",
  },
  {
    question: "Is submitting an event free?",
    answer:
      "Yes. Community groups, universities and organizers can submit an event without paying or creating an account.",
  },
  {
    question: "Where does the event information come from?",
    answer:
      "HackScout scans public sources including Luma, Devfolio, Devpost, Unstop and community submissions, then normalizes each listing.",
  },
  {
    question: "Can I browse without signing in?",
    answer:
      "Yes. Discovery, city pages, deadlines and official registration links are open to everyone.",
  },
];

export default async function LandingPage() {
  const [stats, closingEvents, cityCountMap] = await Promise.all([
    getFeedStats(),
    getUpcomingEvents({ limit: 4 }),
    getAllCityEventCounts(),
  ]);
  const cityCounts = Object.fromEntries(cityCountMap);
  const closingSoon =
    closingEvents.length > 0
      ? closingEvents.map((event, index) => ({
          number: String(index + 1).padStart(2, "0"),
          title: event.title,
          host: event.organizerName || event.city.name,
          city: event.city.name,
          type: formatCategory(event.category),
          deadline: formatDeadlineLabel(event.registrationDeadline).label,
          detail: formatPrizePool(event.prizePool) || event.venue || "Open registration",
          href: `/events/${event.slug}`,
        }))
      : FALLBACK_CLOSING;
  const heroCount =
    stats.eventCount > 0
      ? `${stats.eventCount} open registrations / ${stats.cityCount} ${stats.cityCount === 1 ? "city" : "cities"}`
      : "Launching nationwide radar";
  return (
    <div className="editorial-shell flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />

      <main>
        <section className="relative border-b-2 border-foreground pt-[4.5rem]">
          <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[minmax(0,1.5fr)_minmax(19rem,.5fr)]">
            <div className="relative overflow-hidden border-foreground px-4 py-12 sm:px-6 sm:py-16 lg:border-r lg:px-10 lg:py-20">
              <div aria-hidden className="paper-grid absolute inset-0 opacity-40" />
              <HeroCopy>
                <div className="relative">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-y border-foreground py-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em]">
                    <span className="flex items-center gap-2 text-primary">
                      <Radio className="size-3" weight="fill" />
                      Live Pakistan event radar
                    </span>
                    <span> {heroCount}</span>
                  </div>

                  <div className="grid gap-8 py-10 md:grid-cols-[minmax(0,1fr)_11rem] md:items-end">
                    <h1 className="max-w-[12ch] font-heading text-[clamp(4rem,10vw,9rem)] font-medium leading-[0.78] tracking-[-0.065em]">
                      Har event,
                      <span className="block italic text-primary">har shehar.</span>
                    </h1>
                    <p className="max-w-[23ch] border-l-4 border-primary pl-4 text-sm font-medium leading-relaxed md:mb-2">
                      Pakistan&apos;s deadline-first field guide to hackathons, conferences,
                      campus competitions and developer meetups.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-foreground pt-5 sm:flex-row">
                    <Link
                      href="/events"
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "editorial-shadow h-12 rounded-none border border-foreground bg-primary px-6 text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-brand-hover"
                      )}
                    >
                      Open the live index
                      <ArrowUpRight />
                    </Link>
                    <Link
                      href="/submit"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "lg" }),
                        "h-12 rounded-none border-foreground bg-transparent px-6 text-xs font-semibold uppercase tracking-[0.12em] hover:bg-foreground hover:text-background"
                      )}
                    >
                      Submit a campus event
                    </Link>
                  </div>
                </div>
              </HeroCopy>
            </div>

            <aside className="bg-foreground px-5 py-8 text-background sm:px-8 lg:py-12">
              <div className="flex items-end justify-between border-b border-background/40 pb-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-background/65">
                    Incoming signal
                  </p>
                  <p className="mt-1 font-heading text-3xl italic">Source ledger</p>
                </div>
                <span className="font-mono text-[10px] text-primary-foreground">LIVE</span>
              </div>
              <div className="divide-y divide-background/25">
                {feeds.map(([source, count, sync], index) => (
                  <div key={source} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-5">
                    <span className="font-mono text-[10px] text-background/45">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{source}</p>
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-background/50">
                        Last scan {sync}
                      </p>
                    </div>
                    <span className="font-heading text-4xl text-primary-foreground">{count}</span>
                  </div>
                ))}
              </div>
              <p className="mt-8 border-t border-background/40 pt-4 font-mono text-[9px] uppercase leading-relaxed tracking-[0.12em] text-background/55">
                Automated collection with human verification for campus and community listings.
              </p>
            </aside>
          </div>
        </section>

        <section className="border-b-2 border-foreground bg-foreground text-background">
          <Reveal>
            <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[.78fr_1.22fr]">
              <div className="border-background/25 px-4 py-14 sm:px-6 lg:border-r lg:px-10 lg:py-20">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground">
                  The missed-signal problem
                </p>
                <h2 className="mt-4 max-w-[9ch] font-heading text-5xl font-medium leading-[0.9] tracking-[-0.05em] sm:text-7xl">
                  Great events hide in plain sight.
                </h2>
              </div>
              <div className="grid sm:grid-cols-2">
                <article className="border-b border-background/25 p-6 sm:border-r sm:p-10">
                  <span className="font-heading text-6xl italic text-primary-foreground">01</span>
                  <h3 className="mt-10 font-heading text-2xl font-semibold">The announcement is scattered.</h3>
                  <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-background/65">
                    One event lives on LinkedIn, another in a society WhatsApp group, and the next on a platform you do not check.
                  </p>
                </article>
                <article className="border-b border-background/25 p-6 sm:p-10">
                  <span className="font-heading text-6xl italic text-primary-foreground">02</span>
                  <h3 className="mt-10 font-heading text-2xl font-semibold">The deadline arrives first.</h3>
                  <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-background/65">
                    By the time the right post reaches your feed, team formation, early bird, or registration may already be closed.
                  </p>
                </article>
                <div className="p-6 sm:col-span-2 sm:p-10">
                  <p className="max-w-[52ch] font-heading text-3xl leading-tight tracking-[-0.02em] sm:text-4xl">
                    HackScout turns those scattered posts into one city-by-city, deadline-first index.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="border-b-2 border-foreground">
          <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
            <div className="flex flex-col justify-between gap-5 border-b-2 border-foreground pb-5 sm:flex-row sm:items-end">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  Deadline desk / urgent
                </p>
                <h2 className="mt-2 font-heading text-4xl font-medium tracking-[-0.04em] sm:text-6xl">
                  Closing before you scroll away.
                </h2>
              </div>
              <Link
                href="/events?sort=deadline"
                className="flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] underline decoration-2 underline-offset-4"
              >
                All deadlines <ArrowUpRight />
              </Link>
            </div>

            <div className="divide-y divide-foreground border-b border-foreground">
              {closingSoon.map((event) => (
                <Link
                  key={event.title}
                  href={event.href}
                  className="group grid min-h-24 grid-cols-[2.5rem_1fr_auto] items-center gap-3 py-4 transition-colors hover:bg-card sm:grid-cols-[3rem_1fr_8rem_8rem_auto] sm:gap-5"
                >
                  <span className="font-mono text-xs text-muted-foreground">{event.number}</span>
                  <div>
                    <p className="font-heading text-xl font-semibold leading-tight transition-transform group-hover:translate-x-1 sm:text-2xl">
                      {event.title}
                    </p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                      {event.host} / {event.city}
                    </p>
                  </div>
                  <span className="hidden text-xs font-semibold uppercase sm:block">{event.type}</span>
                  <span className="hidden font-mono text-[10px] text-muted-foreground sm:block">
                    {event.detail}
                  </span>
                  <span className="deadline-stamp border-2 border-primary px-2 py-1 font-mono text-[10px] font-semibold uppercase text-primary">
                    {event.deadline}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <CityIndex counts={cityCounts} />

        <section className="border-b-2 border-foreground">
          <div className="mx-auto max-w-[1500px] px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
            <div className="flex flex-col justify-between gap-5 border-b-2 border-foreground pb-5 sm:flex-row sm:items-end">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  Browse by format
                </p>
                <h2 className="mt-2 font-heading text-5xl font-medium tracking-[-0.05em] sm:text-7xl">
                  Pick your arena.
                </h2>
              </div>
              <p className="max-w-[30ch] text-sm leading-relaxed text-muted-foreground">
                From a two-hour workshop to a national build sprint—start with the room you want to enter.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Link
                    key={category.name}
                    href={category.href}
                    className="group relative min-h-64 border-b border-foreground p-6 transition-colors hover:bg-foreground hover:text-background sm:border-r sm:p-8 lg:[&:nth-child(3n)]:border-r-0"
                  >
                    <div className="flex items-start justify-between">
                      <Icon className="size-8 text-primary transition-transform group-hover:-rotate-6 group-hover:scale-110" />
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground group-hover:text-background/55">
                        {category.count}
                      </span>
                    </div>
                    <div className="absolute inset-x-6 bottom-6 sm:inset-x-8 sm:bottom-8">
                      <h3 className="font-heading text-3xl font-semibold tracking-[-0.03em]">{category.name}</h3>
                      <div className="mt-2 flex items-end justify-between gap-4">
                        <p className="max-w-[28ch] text-xs leading-relaxed text-muted-foreground group-hover:text-background/65">
                          {category.note}
                        </p>
                        <ArrowUpRight className="shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b-2 border-foreground bg-card">
          <Reveal>
            <div className="mx-auto max-w-[1500px] px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
              <div className="grid gap-10 lg:grid-cols-[.65fr_1.35fr]">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                    How the desk works
                  </p>
                  <h2 className="mt-3 max-w-[8ch] font-heading text-5xl font-medium leading-[0.9] tracking-[-0.05em] sm:text-7xl">
                    Signal over noise.
                  </h2>
                </div>
                <div className="border-t-2 border-foreground">
                  {capabilities.map((item) => (
                    <article
                      key={item.number}
                      className="grid gap-4 border-b border-foreground py-7 sm:grid-cols-[3rem_10rem_1fr] sm:items-start"
                    >
                      <span className="font-heading text-3xl italic text-primary">{item.number}</span>
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
                        {item.kicker}
                      </p>
                      <div>
                        <h3 className="font-heading text-2xl font-semibold tracking-[-0.02em]">
                          {item.title}
                        </h3>
                        <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-muted-foreground">
                          {item.body}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="border-b-2 border-foreground">
          <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[1.1fr_.9fr]">
            <div className="border-foreground px-4 py-14 sm:px-6 lg:border-r lg:px-10 lg:py-20">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                Verification ledger
              </p>
              <h2 className="mt-3 max-w-[11ch] font-heading text-5xl font-medium leading-[0.9] tracking-[-0.05em] sm:text-7xl">
                A listing you can act on.
              </h2>
              <p className="mt-6 max-w-[56ch] text-sm leading-relaxed text-muted-foreground">
                We do not manufacture popularity or sell placement as relevance. Every signal points back to an organizer-controlled source.
              </p>
            </div>
            <div className="grid grid-cols-2 bg-card">
              {[
                ["06H", "Source scan cycle"],
                ["05+", "Public event sources"],
                ["00", "Login walls to browse"],
                ["01", "Official link per listing"],
              ].map(([value, label]) => (
                <div key={label} className="grid min-h-44 content-between border-b border-r border-foreground p-5 sm:p-7">
                  <span className="font-heading text-5xl font-semibold text-primary sm:text-6xl">{value}</span>
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b-2 border-foreground bg-card">
          <div className="mx-auto grid max-w-[1500px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-10 lg:py-20">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                Field notes / FAQ
              </p>
              <h2 className="mt-3 max-w-[8ch] font-heading text-5xl font-medium leading-[0.9] tracking-[-0.05em] sm:text-7xl">
                Before you browse.
              </h2>
            </div>
            <div className="border-t-2 border-foreground">
              {faqs.map((faq, index) => (
                <details key={faq.question} className="group border-b border-foreground">
                  <summary className="flex min-h-20 cursor-pointer list-none items-center gap-4 py-5 outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-heading text-xl font-semibold sm:text-2xl">{faq.question}</span>
                    <span className="grid size-8 shrink-0 place-items-center border border-foreground font-mono text-lg group-open:bg-foreground group-open:text-background">
                      <span className="group-open:hidden">+</span>
                      <span className="hidden group-open:inline">−</span>
                    </span>
                  </summary>
                  <p className="max-w-[65ch] pb-6 pl-10 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b-2 border-foreground bg-foreground text-background">
          <div className="mx-auto grid max-w-[1500px] gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:px-10 lg:py-16">
            <BellRinging className="size-12 text-primary-foreground" weight="duotone" />
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground">
                Deadline alerts / weekly
              </p>
              <h2 className="mt-2 font-heading text-4xl font-medium tracking-[-0.04em] sm:text-5xl">
                Catch the cutoff before it catches you.
              </h2>
              <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-background/60">
                The alert desk is being prepared. Until it opens, browse the live deadline index for registrations closing soon.
              </p>
            </div>
            <Link
              href="/events?sort=deadline"
              className="flex min-h-12 items-center justify-between gap-8 border border-background bg-background px-5 text-xs font-semibold uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              View deadline desk <ArrowUpRight />
            </Link>
          </div>
        </section>

        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto grid max-w-[1500px] gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-10 lg:py-20">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]">
                Community wire / submissions open
              </p>
              <h2 className="mt-4 max-w-[16ch] font-heading text-4xl font-medium leading-[0.95] tracking-[-0.04em] sm:text-6xl">
                Put your event on Pakistan&apos;s radar.
              </h2>
              <p className="mt-4 max-w-[55ch] text-sm leading-relaxed text-primary-foreground/80">
                Send us the official link. We verify the listing and distribute it through city feeds,
                alerts and the weekly campus digest.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href="/submit"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 rounded-none border border-primary-foreground bg-primary-foreground px-6 text-xs font-semibold uppercase tracking-[0.12em] text-primary hover:bg-foreground hover:text-background"
                )}
              >
                File a listing <ArrowUpRight />
              </Link>
              <Link
                href="/missing"
                className="inline-flex min-h-11 items-center justify-center text-[10px] font-semibold uppercase tracking-[0.14em] underline underline-offset-4"
              >
                Missing an event?
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-foreground bg-foreground text-background">
        <div className="mx-auto grid max-w-[1500px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] md:items-end lg:px-10">
          <div>
            <p className="font-heading text-3xl font-semibold">HackScout</p>
            <p className="mt-2 max-w-[48ch] text-xs leading-relaxed text-background/60">
              Pakistan&apos;s independent index of developer, technology and campus events.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 font-mono text-[10px] uppercase tracking-[0.12em] text-background/70">
            <Link href="/events" className="hover:text-primary-foreground">Events</Link>
            <Link href="/cities" className="hover:text-primary-foreground">Cities</Link>
            <Link href="/submit" className="hover:text-primary-foreground">Submit</Link>
            <Link href="/missing" className="hover:text-primary-foreground">Missing an event?</Link>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
