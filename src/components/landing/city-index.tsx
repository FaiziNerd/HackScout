"use client";

import { ArrowUpRight, Crosshair } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";

const cities = [
  { name: "Karachi", slug: "karachi", province: "Sindh", coordinates: "24.8607° N / 67.0011° E", dispatch: "Mega coastal tech hub", types: ["Fintech", "Hackathons", "AI / ML"] },
  { name: "Lahore", slug: "lahore", province: "Punjab", coordinates: "31.5204° N / 74.3587° E", dispatch: "Startup and developer valley", types: ["University cups", "Web3", "Founders"] },
  { name: "Islamabad", slug: "islamabad", province: "ICT", coordinates: "33.6844° N / 73.0479° E", dispatch: "Federal AI and deep-tech desk", types: ["Robotics", "GovTech", "Open source"] },
  { name: "Rawalpindi", slug: "rawalpindi", province: "Punjab", coordinates: "33.5651° N / 73.0169° E", dispatch: "Twin-city technology grid", types: ["Cybersecurity", "Game dev"] },
  { name: "Faisalabad", slug: "faisalabad", province: "Punjab", coordinates: "31.4504° N / 73.1350° E", dispatch: "Industrial technology centre", types: ["E-commerce", "Youth meetups"] },
  { name: "Peshawar", slug: "peshawar", province: "Khyber Pakhtunkhwa", coordinates: "34.0151° N / 71.5249° E", dispatch: "Frontier technology circle", types: ["App innovation", "Bootcamps"] },
  { name: "Multan", slug: "multan", province: "Punjab", coordinates: "30.1575° N / 71.5249° E", dispatch: "South Punjab developer desk", types: ["Cloud", "Design sprints"] },
  { name: "Quetta", slug: "quetta", province: "Balochistan", coordinates: "30.1798° N / 66.9750° E", dispatch: "Emerging innovators bureau", types: ["Student hackathons", "Workshops"] },
  { name: "Hyderabad", slug: "hyderabad", province: "Sindh", coordinates: "25.3960° N / 68.3578° E", dispatch: "Sindh university circuit", types: ["Code competitions"] },
  { name: "Online", slug: "online", province: "Nationwide", coordinates: "REMOTE / PKT", dispatch: "National digital arena", types: ["Global hackathons", "Virtual summits", "Webinars"] },
];

export function CityIndex({ counts = {} }: { counts?: Record<string, number> }) {
  const [active, setActive] = useState(0);
  const current = cities[active] ?? cities[0];
  const currentCount = counts[current.slug] ?? 0;

  return (
    <section className="border-b-2 border-foreground">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid lg:grid-cols-[1.08fr_.92fr]">
          <div className="border-foreground px-4 py-14 sm:px-6 lg:border-r lg:px-10 lg:py-20">
            <div className="flex items-end justify-between gap-5 border-b-2 border-foreground pb-5">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  Regional wire / Pakistan
                </p>
                <h2 className="mt-2 font-heading text-5xl font-medium tracking-[-0.05em] sm:text-7xl">
                  City dispatches
                </h2>
              </div>
              <p className="hidden max-w-[24ch] text-right text-xs leading-relaxed text-muted-foreground sm:block">
                Select a desk for its active registrations and trending formats.
              </p>
            </div>

            <div className="grid sm:grid-cols-2">
              {cities.map((city, index) => {
                const isActive = index === active;
                return (
                  <button
                    key={city.slug}
                    type="button"
                    onClick={() => setActive(index)}
                    onMouseEnter={() => setActive(index)}
                    onFocus={() => setActive(index)}
                    aria-pressed={isActive}
                    className={cn(
                      "group grid min-h-20 grid-cols-[2rem_1fr_auto] items-center gap-2 border-b border-foreground px-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:odd:border-r",
                      isActive ? "bg-foreground text-background" : "hover:bg-card"
                    )}
                  >
                    <span className={cn("font-mono text-[10px]", isActive ? "text-background/55" : "text-muted-foreground")}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="block font-heading text-xl font-semibold leading-none">{city.name}</span>
                      <span className={cn("mt-1 block font-mono text-[9px] uppercase tracking-[0.12em]", isActive ? "text-background/55" : "text-muted-foreground")}>
                        {city.province}
                      </span>
                    </span>
                    <span className={cn("grid size-9 place-items-center border font-mono text-xs font-semibold", isActive ? "border-primary bg-primary text-primary-foreground" : "border-foreground")}>
                      {counts[city.slug] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="relative flex min-h-[35rem] flex-col justify-between overflow-hidden bg-primary p-5 text-primary-foreground sm:p-10 lg:p-12">
            <div aria-hidden className="paper-grid absolute inset-0 opacity-15" />
            <div className="relative flex items-start justify-between gap-4 border-b border-primary-foreground/50 pb-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em]">
                <Crosshair className="size-4" weight="bold" />
                Active city dossier
              </div>
              <span className="font-mono text-[10px] uppercase">Desk {String(active + 1).padStart(2, "0")}</span>
            </div>

            <div className="relative my-12">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary-foreground/70">
                {current.coordinates}
              </p>
              <h3 className="mt-3 font-heading text-[clamp(4rem,9vw,8rem)] font-medium leading-[0.78] tracking-[-0.065em]">
                {current.name}
              </h3>
              <p className="mt-5 max-w-[30ch] border-l-4 border-primary-foreground pl-4 text-sm font-semibold uppercase tracking-[0.06em]">
                {current.dispatch}
              </p>
            </div>

            <div className="relative">
              <div className="grid grid-cols-[auto_1fr] gap-5 border-y border-primary-foreground/50 py-5">
                <span className="font-heading text-6xl font-semibold">{currentCount}</span>
                <div>
                  <p className="text-sm font-semibold">Open registrations</p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-primary-foreground/70">
                    Verified and accepting entries now
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 py-5 font-mono text-[10px] uppercase tracking-[0.12em]">
                {current.types.map((type) => <span key={type}>#{type}</span>)}
              </div>
              <Link
                href={`/cities/${current.slug}`}
                className="editorial-shadow flex min-h-12 items-center justify-between border border-foreground bg-background px-5 text-xs font-semibold uppercase tracking-[0.12em] text-foreground transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                Open {current.name} index
                <ArrowUpRight />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
