import { load } from "cheerio";

import type { ScrapedEventInput, ScraperResult } from "../types";
import { absoluteUrl, cleanText, fetchHtml, parseFlexibleDate, universityEvent } from "./shared";

const LUMS_EVENTS_URL = process.env.LUMS_EVENTS_URL ?? "https://lums.edu.pk/events";

function mapLumsCard(
  html: string,
  sourceUrl: string
): ScrapedEventInput | null {
  const $ = load(html);
  const title = cleanText($("h2").first().text());
  const times = $("time[datetime]")
    .toArray()
    .map((el) => parseFlexibleDate($(el).attr("datetime") || $(el).text()))
    .filter((date): date is Date => Boolean(date));
  const location = cleanText($(".event-location").first().text()) || "LUMS, Lahore";
  const category = cleanText($(".event-category").first().text());
  const coverImage = absoluteUrl($("img").first().attr("src"), LUMS_EVENTS_URL);
  const startDate = times[0];
  if (!title || !startDate) return null;

  const isOnline = /facebook page|online|virtual|webinar/i.test(location);

  return universityEvent({
    title,
    description: [title, category, location].filter(Boolean).join(" — "),
    coverImage,
    categoryText: category,
    sourceUrl,
    startDate,
    endDate: times[1] ?? null,
    rawLocation: isOnline ? "Online" : "Lahore",
    venue: location,
    isOnline,
    tags: ["lums", category.toLowerCase()].filter(Boolean),
    organizerName: "LUMS",
  });
}

/**
 * LUMS public events listing (Drupal). Upcoming cards use `.current-eventsz`.
 */
export async function scrapeLums(): Promise<ScraperResult> {
  const errors: string[] = [];
  const events = new Map<string, ScrapedEventInput>();

  try {
    const html = await fetchHtml(LUMS_EVENTS_URL);
    const $ = load(html);

    $(".current-eventsz").each((_, element) => {
      const card = $(element);
      const href =
        card.find("h2 a").attr("href") ||
        card.find("a[href*='/events/']").first().attr("href");
      const sourceUrl = absoluteUrl(href, LUMS_EVENTS_URL);
      if (!sourceUrl) return;

      const mapped = mapLumsCard(card.html() ?? "", sourceUrl);
      if (mapped) events.set(mapped.sourceUrl, mapped);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Error fetching LUMS events: ${message}`);
  }

  return {
    source: "university",
    events: Array.from(events.values()),
    errors: errors.length ? errors : undefined,
  };
}
