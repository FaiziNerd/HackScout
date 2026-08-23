import { load } from "cheerio";

import type { ScrapedEventInput, ScraperResult } from "../types";
import {
  absoluteUrl,
  cleanText,
  dateFromDayMonth,
  fetchHtml,
  fetchJson,
  firstRegistrationUrl,
  parseDateRangeFromText,
  parseYyyymmdd,
  universityEvent,
} from "./shared";

const NUST_EVENTS_URL = "https://nust.edu.pk/events/";
const NUST_API_URL =
  process.env.NUST_EVENT_API_URL ?? "https://nust.edu.pk/wp-json/wp/v2/event";
const MAX_PAGES = Number(process.env.NUST_EVENT_PAGE_LIMIT ?? 3);

function scrapeNustHtml(html: string): ScrapedEventInput[] {
  const $ = load(html);
  const events: ScrapedEventInput[] = [];

  $(".events-card").each((_, element) => {
    const card = $(element);
    const title = cleanText(card.find(".news_item_title").first().text());
    const href = card.find(".news_item_title a, a[href*='/events/']").first().attr("href");
    const sourceUrl = absoluteUrl(href, NUST_EVENTS_URL);
    const coverImage =
      card.find("img").attr("data-lazy-src") ||
      card.find("noscript img").attr("src") ||
      card.find("img").attr("src") ||
      null;
    const day = Number(cleanText(card.find(".event-date span").first().text()));
    const month = cleanText(card.find(".event-date").first().clone().children().remove().end().text());
    const startDate = dateFromDayMonth(day, month);
    if (!title || !sourceUrl || !startDate) return;

    const { rawLocation, venue } = campusLocation(title);
    const mapped = universityEvent({
      title,
      description: title,
      coverImage,
      sourceUrl,
      startDate,
      rawLocation,
      venue,
      tags: ["nust"],
      organizerName: "NUST",
      registrationUrl: sourceUrl,
    });
    if (mapped) events.push(mapped);
  });

  return events;
}

interface NustRendered {
  rendered?: string;
}

interface NustEvent {
  id?: number;
  link?: string;
  slug?: string;
  date?: string;
  title?: NustRendered | string;
  content?: NustRendered | string;
  excerpt?: NustRendered | string;
  acf?: {
    start_date?: string | null;
    end_date?: string | null;
  } | null;
  featured_image?: {
    full?: string | null;
    large?: string | null;
  } | null;
}

function rendered(value?: NustRendered | string | null): string {
  if (!value) return "";
  return typeof value === "string" ? value : value.rendered ?? "";
}

function campusLocation(text: string): { rawLocation: string; venue: string } {
  const value = text.toLowerCase();
  if (/pnec|karachi/.test(value)) {
    return { rawLocation: "Karachi", venue: "NUST PNEC, Karachi" };
  }
  if (/\bmcs\b|rawalpindi|ceme|college of electrical and mechanical/.test(value)) {
    return { rawLocation: "Rawalpindi", venue: "NUST, Rawalpindi" };
  }
  if (/quetta/.test(value)) {
    return { rawLocation: "Quetta", venue: "NUST Quetta Campus" };
  }
  if (/risalpur|cae|mce/.test(value)) {
    return { rawLocation: "Peshawar", venue: "NUST, Risalpur" };
  }
  return { rawLocation: "Islamabad", venue: "NUST H-12, Islamabad" };
}

function mapNustEvent(record: NustEvent): ScrapedEventInput | null {
  const title = cleanText(rendered(record.title));
  const html = rendered(record.content) || rendered(record.excerpt);
  const description = cleanText(html);
  const sourceUrl =
    record.link ||
    (record.slug ? `https://nust.edu.pk/events/${record.slug}/` : null);
  if (!title || !sourceUrl) return null;

  const fromContent = parseDateRangeFromText(`${title} ${description}`);
  const startDate =
    fromContent.start ??
    parseYyyymmdd(record.acf?.start_date) ??
    (record.date ? new Date(record.date) : null);
  if (!startDate || Number.isNaN(startDate.getTime())) return null;

  const { rawLocation, venue } = campusLocation(`${title} ${description}`);

  return universityEvent({
    title,
    description,
    coverImage: record.featured_image?.full || record.featured_image?.large || null,
    sourceUrl,
    startDate,
    endDate: fromContent.end ?? parseYyyymmdd(record.acf?.end_date),
    rawLocation,
    venue,
    tags: ["nust"],
    organizerName: "NUST",
    registrationUrl: firstRegistrationUrl(html, sourceUrl),
  });
}

/**
 * NUST events from the public WordPress REST API (`/wp-json/wp/v2/event`).
 */
export async function scrapeNust(): Promise<ScraperResult> {
  const errors: string[] = [];
  const events = new Map<string, ScrapedEventInput>();

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = new URL(NUST_API_URL);
    url.searchParams.set("per_page", "50");
    url.searchParams.set("page", String(page));
    url.searchParams.set("status", "publish");

    try {
      const { data, headers } = await fetchJson<NustEvent[]>(url.toString());
      if (!Array.isArray(data)) {
        errors.push("NUST events API returned a non-array response");
        break;
      }

      for (const record of data) {
        const mapped = mapNustEvent(record);
        if (mapped) events.set(mapped.sourceUrl, mapped);
      }

      const totalPages = Number(headers.get("x-wp-totalpages") ?? 1);
      if (page >= totalPages || data.length === 0) break;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Error fetching NUST events page ${page}: ${message}`);
      break;
    }
  }

  if (events.size === 0) {
    try {
      for (const mapped of scrapeNustHtml(await fetchHtml(NUST_EVENTS_URL))) {
        events.set(mapped.sourceUrl, mapped);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Error fetching NUST events HTML: ${message}`);
    }
  }

  return {
    source: "university",
    events: Array.from(events.values()),
    errors: errors.length ? errors : undefined,
  };
}
