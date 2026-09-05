import { load } from "cheerio";

import type { ScrapedEventInput, ScraperResult } from "../types";
import {
  absoluteUrl,
  cleanText,
  fetchHtml,
  looksLikeEvent,
  parseDateRangeFromText,
  universityEvent,
} from "./shared";

const IBA_CEE_URL =
  process.env.IBA_EVENTS_URL ?? "https://cee.iba.edu.pk/program-calendar.php";
const IBA_CDC_URL = process.env.IBA_CDC_EVENTS_URL ?? "https://cdc.iba.edu.pk/events.php";

function locationFromText(text: string): { rawLocation: string; venue: string; isOnline: boolean } {
  const value = text.toLowerCase();
  if (/online|virtual|webinar|zoom/.test(value)) {
    return { rawLocation: "Online", venue: "IBA Online", isOnline: true };
  }
  if (/islamabad|nibaf|ogti/.test(value)) {
    return { rawLocation: "Islamabad", venue: "IBA Islamabad", isOnline: false };
  }
  return { rawLocation: "Karachi", venue: "IBA Karachi", isOnline: false };
}

function scrapeCeeCalendar(html: string): ScrapedEventInput[] {
  const $ = load(html);
  const events: ScrapedEventInput[] = [];

  $("table tr").each((_, row) => {
    const card = $(row);
    const titleLink = card.find("h3 a").first();
    const title = cleanText(titleLink.text());
    const dateText = cleanText(card.find("strong.date").first().text());
    if (!title || !dateText) return;

    const { start, end } = parseDateRangeFromText(dateText);
    if (!start) return;

    const href = titleLink.attr("href");
    const sourceUrl = absoluteUrl(href, IBA_CEE_URL) || `${IBA_CEE_URL}#${encodeURIComponent(title)}`;
    const place = locationFromText(dateText);

    const mapped = universityEvent({
      title,
      description: `${title} — IBA Center for Executive Education. ${dateText}`,
      categoryText: "workshop training program",
      sourceUrl,
      startDate: start,
      endDate: end,
      rawLocation: place.rawLocation,
      venue: place.venue,
      isOnline: place.isOnline,
      tags: ["iba", "cee", "workshop"],
      organizerName: "IBA Karachi — CEE",
      registrationUrl: sourceUrl,
    });
    if (mapped) events.push(mapped);
  });

  return events;
}

function scrapeCdcEvents(html: string): ScrapedEventInput[] {
  const $ = load(html);
  const events: ScrapedEventInput[] = [];

  $("table tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 1) return;

    const text = cleanText(cells.text());
    if (!text || text.length < 12) return;

    const title =
      cleanText(cells.find("a, h2, h3, h4, strong").first().text()) || text.slice(0, 120);
    if (!title || title.length < 4) return;
    if (!looksLikeEvent(text) && !/career|fair|recruit|session|talk|workshop/i.test(text)) return;

    const { start, end } = parseDateRangeFromText(text);
    if (!start) return;

    const href = cells.find("a[href]").first().attr("href");
    const sourceUrl = absoluteUrl(href, IBA_CDC_URL) || `${IBA_CDC_URL}#${encodeURIComponent(title)}`;
    const place = locationFromText(text);

    const mapped = universityEvent({
      title,
      description: text.slice(0, 500),
      categoryText: /fair|recruit/i.test(text) ? "career_fair" : "seminar",
      sourceUrl,
      startDate: start,
      endDate: end,
      rawLocation: place.rawLocation,
      venue: place.venue,
      isOnline: place.isOnline,
      tags: ["iba", "cdc"],
      organizerName: "IBA Career Development Center",
      registrationUrl: sourceUrl,
    });
    if (mapped) events.push(mapped);
  });

  return events;
}

/**
 * IBA Karachi public calendars: CEE open programs + CDC events listing.
 */
export async function scrapeIba(): Promise<ScraperResult> {
  const errors: string[] = [];
  const events = new Map<string, ScrapedEventInput>();

  for (const [label, url, parser] of [
    ["CEE", IBA_CEE_URL, scrapeCeeCalendar],
    ["CDC", IBA_CDC_URL, scrapeCdcEvents],
  ] as const) {
    try {
      const html = await fetchHtml(url);
      for (const event of parser(html)) {
        events.set(event.sourceUrl, event);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Error fetching IBA ${label}: ${message}`);
    }
  }

  return {
    source: "university",
    events: Array.from(events.values()),
    errors: errors.length ? errors : undefined,
  };
}
