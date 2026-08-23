import { load } from "cheerio";

import { normalizeCity, PAKISTAN_CITIES } from "@/lib/cities";
import type { ScrapedEventInput, ScraperResult } from "./types";

const HACKEREARTH_ORIGIN = "https://www.hackerearth.com";
const EVENTS_API_URL = `${HACKEREARTH_ORIGIN}/chrome-extension/events/`;
const LISTING_URLS = [
  `${HACKEREARTH_ORIGIN}/challenges/`,
  `${HACKEREARTH_ORIGIN}/challenges/hackathon/`,
];

const PAKISTAN_TERMS = [
  "pakistan",
  ...PAKISTAN_CITIES.filter((city) => !city.isVirtual).map((city) =>
    city.name.replace(/\s*\(.*\)\s*/g, "").trim().toLowerCase()
  ),
  "nust",
  "fast",
  "giki",
  "lums",
  "uet",
  "iba",
  "ned",
  "comsats",
];

interface HackerEarthEvent {
  title?: string | null;
  description?: string | null;
  url?: string | null;
  subscribe?: string | null;
  status?: string | null;
  college?: boolean | null;
  date?: string | null;
  end_date?: string | null;
  start_tz?: string | null;
  end_tz?: string | null;
  start_utc_tz?: string | null;
  end_utc_tz?: string | null;
  thumbnail?: string | null;
  challenge_type?: string | null;
  location?: string | null;
  is_hackerearth?: boolean | null;
}

interface HackerEarthEventsResponse {
  response?: HackerEarthEvent[];
  events?: HackerEarthEvent[];
}

function cleanText(value?: string | null): string {
  if (!value) return "";
  return load(value).text().replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasPakistanTerm(text: string): boolean {
  return PAKISTAN_TERMS.some((term) => {
    const escaped = escapeRegExp(term);
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
  });
}

function validDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeHackerEarthUrl(value?: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value, HACKEREARTH_ORIGIN);
    if (!/hackerearth\.com$/i.test(url.hostname)) return null;
    url.protocol = "https:";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function mapCategory(event: HackerEarthEvent): ScrapedEventInput["category"] {
  const value = `${event.title ?? ""} ${event.challenge_type ?? ""} ${event.url ?? ""}`.toLowerCase();

  if (/hackathon|hack day|codefest|buildathon/.test(value)) return "hackathon";
  if (/hiring|recruit/.test(value)) return "competition";
  if (/workshop|bootcamp|training/.test(value)) return "workshop";
  if (/conference|summit/.test(value)) return "conference";
  if (/meetup/.test(value)) return "meetup";
  if (/competitive|contest|challenge|coding/.test(value)) return "competition";
  return "hackathon";
}

function isOnlineEvent(event: HackerEarthEvent, rawLocation: string): boolean {
  const text = `${event.title ?? ""} ${event.description ?? ""} ${event.challenge_type ?? ""} ${rawLocation}`;
  if (/online|virtual|remote|global/i.test(text)) return true;
  if (!rawLocation.trim()) return true;
  return /\/challenges\/hackathon\//i.test(event.url ?? "");
}

function isRelevantToPakistan(event: HackerEarthEvent): {
  isRelevant: boolean;
  rawLocation: string;
  isOnline: boolean;
} {
  const rawLocation = cleanText(event.location);
  const isOnline = isOnlineEvent(event, rawLocation);
  const cityMatch = normalizeCity(rawLocation);
  const searchable = [event.title, event.description, event.challenge_type, rawLocation]
    .filter(Boolean)
    .join(" ");

  if (cityMatch.matched && cityMatch.slug !== "online") {
    return { isRelevant: true, rawLocation, isOnline };
  }

  if (hasPakistanTerm(searchable)) {
    return {
      isRelevant: true,
      rawLocation: rawLocation || (isOnline ? "Online" : "Pakistan"),
      isOnline,
    };
  }

  if (isOnline) {
    return { isRelevant: true, rawLocation: "Online", isOnline: true };
  }

  return { isRelevant: false, rawLocation, isOnline };
}

function mapHackerEarthToScrapedInput(event: HackerEarthEvent): ScrapedEventInput | null {
  const title = cleanText(event.title);
  const sourceUrl = normalizeHackerEarthUrl(event.url || event.subscribe);
  const startDate =
    validDate(event.start_utc_tz) ?? validDate(event.start_tz) ?? validDate(event.date);
  if (!title || !sourceUrl || !startDate) return null;

  const status = (event.status ?? "").toUpperCase();
  if (status && /ENDED|EXPIRED|CLOSED|PAST/.test(status)) return null;

  const { isRelevant, rawLocation, isOnline } = isRelevantToPakistan(event);
  if (!isRelevant) return null;

  const category = mapCategory(event);
  const description = cleanText(event.description) || title;
  const endDate = validDate(event.end_utc_tz) ?? validDate(event.end_tz) ?? validDate(event.end_date);
  const tags = Array.from(
    new Set(
      ["hackerearth", category, event.challenge_type, event.college ? "college" : "", isOnline ? "online" : ""]
        .map((tag) => cleanText(tag).toLowerCase())
        .filter(Boolean)
    )
  );

  return {
    title,
    description,
    coverImage: event.thumbnail || null,
    category,
    source: "hackerearth",
    sourceUrl,
    startDate,
    endDate,
    registrationDeadline: endDate,
    rawLocation: rawLocation || (isOnline ? "Online" : "Pakistan"),
    venue: isOnline ? "Online" : rawLocation || null,
    isOnline,
    tags,
    organizerName: event.is_hackerearth ? "HackerEarth" : null,
    registrationType: "external",
    registrationUrl: sourceUrl,
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "HackScout-Bot/1.0 (+https://hackscout.pk)",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "HackScout-Bot/1.0 (+https://hackscout.pk)",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.text();
}

function eventsFromApiPayload(payload: unknown): HackerEarthEvent[] {
  if (Array.isArray(payload)) return payload as HackerEarthEvent[];
  if (!payload || typeof payload !== "object") return [];

  const record = payload as HackerEarthEventsResponse;
  if (Array.isArray(record.response)) return record.response;
  if (Array.isArray(record.events)) return record.events;
  return [];
}

function eventsFromListingHtml(html: string): HackerEarthEvent[] {
  const $ = load(html);
  const events = new Map<string, HackerEarthEvent>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    const url = normalizeHackerEarthUrl(href);
    if (!url || !/\/challenges\/(?:hackathon|competitive|hiring)\//i.test(url)) return;

    const title =
      cleanText($(element).attr("title")) ||
      cleanText($(element).find(".challenge-list-title, .challenge-name, h2, h3").first().text()) ||
      cleanText($(element).text());
    if (!title || title.length < 4) return;

    events.set(url, {
      title,
      url,
      description: cleanText($(element).closest("article, li, .challenge-card, .challenge-card-wrapper").text()),
      challenge_type: /hackathon/i.test(url) ? "hackathon" : "challenge",
    });
  });

  return Array.from(events.values());
}

function mergeEvent(base: HackerEarthEvent, extra: HackerEarthEvent): HackerEarthEvent {
  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(extra).filter(([, value]) => value != null && value !== "")
    ),
  };
}

/**
 * HackerEarth scraper.
 * Reads the public chrome-extension events JSON (live + upcoming hackathons),
 * then supplements with public listing-page links when the JSON feed is sparse.
 */
export async function scrapeHackerEarth(): Promise<ScraperResult> {
  const errors: string[] = [];
  const candidates = new Map<string, HackerEarthEvent>();

  try {
    const payload = await fetchJson(EVENTS_API_URL);
    for (const event of eventsFromApiPayload(payload)) {
      const url = normalizeHackerEarthUrl(event.url || event.subscribe);
      if (url) candidates.set(url, event);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Error fetching HackerEarth events API: ${message}`);
  }

  for (const listingUrl of LISTING_URLS) {
    try {
      const html = await fetchHtml(listingUrl);
      for (const event of eventsFromListingHtml(html)) {
        const url = normalizeHackerEarthUrl(event.url);
        if (!url) continue;
        const existing = candidates.get(url);
        candidates.set(url, existing ? mergeEvent(existing, event) : event);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Error fetching HackerEarth listing "${listingUrl}": ${message}`);
    }
  }

  const events = new Map<string, ScrapedEventInput>();
  for (const event of candidates.values()) {
    const mapped = mapHackerEarthToScrapedInput(event);
    if (mapped) events.set(mapped.sourceUrl, mapped);
  }

  return {
    source: "hackerearth",
    events: Array.from(events.values()),
    errors: errors.length ? errors : undefined,
  };
}
