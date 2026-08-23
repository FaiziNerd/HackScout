import type { ScrapedEventInput, ScraperResult } from "../types";
import {
  asRecord,
  collectJsonLdEvents,
  fetchHtml,
  fetchJson,
  isOnlineText,
  parseFlexibleDate,
  type JsonValue,
  universityEvent,
} from "./shared";

const GIKI_TRIBE_URL =
  process.env.GIKI_EVENTS_API_URL ?? "https://giki.edu.pk/wp-json/tribe/events/v1/events";
const GIKI_LIST_URLS = ["https://giki.edu.pk/events/list/"];

interface TribeVenue {
  venue?: string | null;
  address?: string | null;
  city?: string | null;
}

interface TribeEvent {
  title?: string | null;
  description?: string | null;
  url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  utc_start_date?: string | null;
  utc_end_date?: string | null;
  image?: { url?: string | null } | string | null;
  venue?: TribeVenue | TribeVenue[] | null;
  website?: string | null;
}

interface TribeResponse {
  events?: TribeEvent[];
}

function stringValue(value: JsonValue | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function mapJsonLdEvent(record: Record<string, JsonValue>): ScrapedEventInput | null {
  const title = stringValue(record.name);
  const sourceUrl = stringValue(record.url);
  const startDate = parseFlexibleDate(stringValue(record.startDate));
  if (!title || !sourceUrl || !startDate) return null;

  const location = asRecord(record.location);
  const venue =
    stringValue(location?.name) ||
    stringValue(asRecord(location?.address)?.name) ||
    "GIKI, Topi";
  const coverImage =
    stringValue(record.image) ||
    stringValue(asRecord(record.image)?.url) ||
    null;

  return universityEvent({
    title,
    description: stringValue(record.description),
    coverImage,
    sourceUrl,
    startDate,
    endDate: parseFlexibleDate(stringValue(record.endDate)),
    rawLocation: "Topi",
    venue,
    isOnline: /online/i.test(stringValue(record.eventAttendanceMode) ?? "") || isOnlineText(venue),
    tags: ["giki"],
    organizerName: "GIKI",
  });
}

function mapTribeEvent(event: TribeEvent): ScrapedEventInput | null {
  const title = event.title;
  const sourceUrl = event.url;
  const startDate = parseFlexibleDate(event.start_date) ?? parseFlexibleDate(event.utc_start_date);
  if (!title || !sourceUrl || !startDate) return null;

  const venues = Array.isArray(event.venue) ? event.venue : event.venue ? [event.venue] : [];
  const venue =
    venues
      .map((item) => [item.venue, item.address, item.city].filter(Boolean).join(", "))
      .filter(Boolean)
      .join("; ") || "GIKI, Topi";
  const coverImage = typeof event.image === "string" ? event.image : event.image?.url ?? null;

  return universityEvent({
    title,
    description: event.description,
    coverImage,
    sourceUrl,
    startDate,
    endDate: parseFlexibleDate(event.end_date) ?? parseFlexibleDate(event.utc_end_date),
    rawLocation: "Topi",
    venue,
    tags: ["giki"],
    organizerName: "GIKI",
    registrationUrl: event.website || sourceUrl,
  });
}

/**
 * GIKI events from The Events Calendar REST API, with JSON-LD on the public
 * list pages as a fallback when the upcoming bucket is empty.
 */
export async function scrapeGiki(): Promise<ScraperResult> {
  const errors: string[] = [];
  const events = new Map<string, ScrapedEventInput>();

  const start = new Date();
  start.setMonth(start.getMonth() - 1);
  const end = new Date();
  end.setFullYear(end.getFullYear() + 2);

  const apiUrl = new URL(GIKI_TRIBE_URL);
  apiUrl.searchParams.set("per_page", "50");
  apiUrl.searchParams.set("status", "publish");
  apiUrl.searchParams.set("start_date", start.toISOString().slice(0, 10));
  apiUrl.searchParams.set("end_date", end.toISOString().slice(0, 10));

  try {
    const { data } = await fetchJson<TribeResponse>(apiUrl.toString());
    for (const event of data.events ?? []) {
      const mapped = mapTribeEvent(event);
      if (mapped) events.set(mapped.sourceUrl, mapped);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Error fetching GIKI Tribe API: ${message}`);
  }

  for (const url of GIKI_LIST_URLS) {
    try {
      const html = await fetchHtml(url);
      for (const record of collectJsonLdEvents(html)) {
        const mapped = mapJsonLdEvent(record);
        if (mapped) events.set(mapped.sourceUrl, mapped);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Error fetching GIKI events page "${url}": ${message}`);
    }
  }

  return {
    source: "university",
    events: Array.from(events.values()),
    errors: errors.length ? errors : undefined,
  };
}
