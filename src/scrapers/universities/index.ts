import type { ScrapedEventInput, ScraperResult } from "../types";
import { scrapeComsats } from "./comsats";
import { scrapeFast } from "./fast";
import { scrapeGiki } from "./giki";
import { scrapeLums } from "./lums";
import { scrapeNust } from "./nust";

const UNIVERSITY_SCRAPERS = [
  scrapeNust,
  scrapeLums,
  scrapeFast,
  scrapeGiki,
  scrapeComsats,
] as const;

/**
 * Runs NUST, LUMS, FAST, GIKI, and COMSATS calendar scrapers and merges them
 * into a single `university` source result.
 */
export async function scrapeUniversity(): Promise<ScraperResult> {
  const results = await Promise.allSettled(UNIVERSITY_SCRAPERS.map((scraper) => scraper()));
  const events = new Map<string, ScrapedEventInput>();
  const errors: string[] = [];

  results.forEach((result, index) => {
    const name = UNIVERSITY_SCRAPERS[index].name.replace(/^scrape/, "");
    if (result.status === "rejected") {
      const message =
        result.reason instanceof Error ? result.reason.message : String(result.reason);
      errors.push(`Error running ${name} scraper: ${message}`);
      return;
    }

    for (const event of result.value.events) {
      events.set(event.sourceUrl, event);
    }
    if (result.value.errors?.length) {
      errors.push(...result.value.errors);
    }
  });

  return {
    source: "university",
    events: Array.from(events.values()),
    errors: errors.length ? errors : undefined,
  };
}

export { scrapeComsats, scrapeFast, scrapeGiki, scrapeLums, scrapeNust };
