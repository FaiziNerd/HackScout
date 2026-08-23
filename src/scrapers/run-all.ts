import "dotenv/config";
import { pathToFileURL } from "node:url";
import { prisma } from "@/lib/db";
import type { RunAllScrapersJobResult } from "@/lib/scraper-queue";
import { scrapeDevfolio } from "./devfolio";
import { scrapeDevpost } from "./devpost";
import { scrapeEventbrite } from "./eventbrite";
import { scrapeFacebook } from "./facebook";
import { scrapeHackerEarth } from "./hackerearth";
import { scrapeLuma } from "./luma";
import { scrapeTalentShowcase } from "./talentshowcase";
import { scrapeUniversity } from "./universities";
import { scrapeUnstop } from "./unstop";
import { saveOrMergeScrapedEvent } from "./dedup";
import { normalizeScrapedEvent } from "./normalizer";
import type { EventSource, ScrapeStatus } from "@/generated/prisma/client";
import type { ScraperResult } from "./types";

const SCRAPERS: ReadonlyArray<{
  source: EventSource;
  scrape: () => Promise<ScraperResult>;
}> = [
  { source: "devfolio", scrape: scrapeDevfolio },
  { source: "devpost", scrape: scrapeDevpost },
  { source: "talentshowcase", scrape: scrapeTalentShowcase },
  { source: "eventbrite", scrape: scrapeEventbrite },
  { source: "luma", scrape: scrapeLuma },
  { source: "unstop", scrape: scrapeUnstop },
  { source: "hackerearth", scrape: scrapeHackerEarth },
  { source: "facebook", scrape: scrapeFacebook },
  { source: "university", scrape: scrapeUniversity },
];

export interface SourceRunSummary {
  source: EventSource;
  status: ScrapeStatus;
  eventsFound: number;
  inserted: number;
  merged: number;
  errors: string[];
  stats?: ScraperResult["stats"];
}

export function toRunAllScrapersJobResult(
  summaries: SourceRunSummary[],
): RunAllScrapersJobResult {
  return {
    sources: summaries.length,
    eventsFound: summaries.reduce((total, summary) => total + summary.eventsFound, 0),
    inserted: summaries.reduce((total, summary) => total + summary.inserted, 0),
    merged: summaries.reduce((total, summary) => total + summary.merged, 0),
    failedSources: summaries.filter((summary) => summary.status === "failed").length,
  };
}

/** Runs all source scrapers and preserves partial results if a source fails. */
export async function runAllScrapers(): Promise<ScraperResult[]> {
  const results = await Promise.allSettled(SCRAPERS.map(({ scrape }) => scrape()));

  return results.map((result, index) => {
    if (result.status === "fulfilled") return result.value;

    const source = SCRAPERS[index].source;
    const message =
      result.reason instanceof Error ? result.reason.message : String(result.reason);

    return {
      source,
      events: [],
      errors: [`Error running ${source} scraper: ${message}`],
    };
  });
}

/**
 * Runs every scraper, persists normalized events, and records one ScrapeLog per source.
 * A bad source or event does not prevent the remaining work from completing.
 */
export async function runAllAndPersist(): Promise<SourceRunSummary[]> {
  const startedAt = new Date();
  const results = await runAllScrapers();
  const summaries: SourceRunSummary[] = [];

  for (const result of results) {
    const errors = [...(result.errors ?? [])];
    let inserted = 0;
    let merged = 0;

    for (const input of result.events) {
      try {
        const normalized = normalizeScrapedEvent(input);
        if (
          !normalized.title ||
          !normalized.slug ||
          !normalized.sourceUrl ||
          Number.isNaN(normalized.startDate.getTime())
        ) {
          throw new Error("Event has invalid required fields");
        }

        const saved = await saveOrMergeScrapedEvent(normalized);
        if (saved.isNew) inserted += 1;
        else merged += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to persist "${input.title || "untitled event"}": ${message}`);
      }
    }

    const persisted = inserted + merged;
    const status: ScrapeStatus =
      errors.length === 0 ? "success" : persisted > 0 ? "partial" : "failed";

    await prisma.scrapeLog.create({
      data: {
        source: result.source,
        startedAt,
        finishedAt: new Date(),
        status,
        eventsFound: result.events.length,
        error: errors.length > 0 ? errors.join("\n").slice(0, 10_000) : null,
      },
    });

    summaries.push({
      source: result.source,
      status,
      eventsFound: result.events.length,
      inserted,
      merged,
      errors,
      stats: result.stats,
    });
  }

  return summaries;
}

async function main() {
  const summaries = await runAllAndPersist();

  for (const summary of summaries) {
    const statsSuffix = summary.stats
      ? `, stats ${JSON.stringify(summary.stats)}`
      : "";
    console.log(
      `${summary.source}: ${summary.status} — found ${summary.eventsFound}, inserted ${summary.inserted}, merged ${summary.merged}, errors ${summary.errors.length}${statsSuffix}`,
    );
  }

  if (summaries.some(({ status }) => status === "failed")) {
    process.exitCode = 1;
  }
}

const isDirectRun =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
