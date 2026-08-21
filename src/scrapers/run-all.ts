import { scrapeDevfolio } from "./devfolio";
import { scrapeDevpost } from "./devpost";
import { scrapeLuma } from "./luma";
import { scrapeTalentShowcase } from "./talentshowcase";
import type { ScraperResult } from "./types";

const SCRAPERS = [
  scrapeDevfolio,
  scrapeDevpost,
  scrapeTalentShowcase,
  scrapeLuma,
];

/** Runs all source scrapers and preserves partial results if a source fails. */
export async function runAllScrapers(): Promise<ScraperResult[]> {
  const results = await Promise.allSettled(SCRAPERS.map((scraper) => scraper()));

  return results.map((result, index) => {
    if (result.status === "fulfilled") return result.value;

    const source = SCRAPERS[index].name.replace(/^scrape/, "").toLowerCase();
    const message =
      result.reason instanceof Error ? result.reason.message : String(result.reason);

    return {
      source: source as ScraperResult["source"],
      events: [],
      errors: [`Error running ${source} scraper: ${message}`],
    };
  });
}
