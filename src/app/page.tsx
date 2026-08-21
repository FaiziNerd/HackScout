import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const cities = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Hyderabad",
  "Online",
];

const sources = [
  "Devfolio",
  "Devpost",
  "Luma",
  "Eventbrite",
  "Unstop",
  "LinkedIn",
  "Universities",
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            HackScout
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/events"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Events
            </Link>
            <Link
              href="/submit"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Submit
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-20 px-4 py-16">
        <section className="space-y-6">
          <Badge variant="secondary">Pakistan ka event hub</Badge>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Har event, har shehar
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Hackathons, conferences, workshops, and meetups across Pakistan —
            listed by city, with registration deadlines in one place. No login
            needed to browse.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/events"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Browse events
            </Link>
            <Link
              href="/submit"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Submit an event
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Scattered feeds</CardTitle>
              <CardDescription>
                Events show up on LinkedIn, Devfolio, Luma, and campus posters —
                then the deadline passes.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>One city map</CardTitle>
              <CardDescription>
                Every listing has a city. Browse Karachi, Lahore, Islamabad, or
                Online — then open what is closing this week.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Register in time</CardTitle>
              <CardDescription>
                Countdown on each event. Native signup for community events, or
                a tracked link out to Devfolio and the rest.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Cities</h2>
          <p className="text-muted-foreground">
            Full directory and live counts land after city seed. These are the
            first stop.
          </p>
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => (
              <Badge key={city} variant="outline">
                {city}
              </Badge>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            Pulled from everywhere
          </h2>
          <Card>
            <CardContent className="flex flex-wrap gap-2 pt-6">
              {sources.map((source) => (
                <Badge key={source} variant="secondary">
                  {source}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>HackScout — if it is happening in Pakistan, it should be here.</span>
          <Link href="/events" className="underline-offset-4 hover:underline">
            Go to the event feed
          </Link>
        </div>
      </footer>
    </div>
  );
}
