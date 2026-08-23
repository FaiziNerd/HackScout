import { load } from "cheerio";

import { normalizeCity, PAKISTAN_CITIES } from "@/lib/cities";
import type { ScrapedEventInput, ScraperResult } from "./types";

const FACEBOOK_BASE_URL = "https://www.facebook.com";
const MAX_PAGE_FETCHES = Number(process.env.FACEBOOK_PAGE_FETCH_LIMIT ?? 20);
const MAX_EVENT_FETCHES = Number(process.env.FACEBOOK_EVENT_FETCH_LIMIT ?? 50);

const PAKISTAN_TERMS = [
  "pakistan",
  "pk",
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
  "gdg",
  "gdsc",
];

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

interface ParsedFacebookEvent {
  title?: string | null;
  description?: string | null;
  coverImage?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  rawLocation?: string | null;
  isOnline?: boolean;
  organizerName?: string | null;
}

function splitEnvList(value?: string): string[] {
  if (!value) return [];

  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanText(value?: string | null): string {
  if (!value) return "";
  return load(value).text().replace(/\s+/g, " ").trim();
}

function validDate(value?: string | number | null): Date | null {
  if (value == null || value === "") return null;
  const normalizedValue =
    typeof value === "number" && value < 9_999_999_999 ? value * 1000 : value;
  const date = new Date(normalizedValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeFacebookUrl(value: string): string | null {
  try {
    const url = new URL(value, FACEBOOK_BASE_URL);
    const host = url.hostname.replace(/^m\.|^mbasic\./, "www.");
    if (host !== "www.facebook.com" && host !== "facebook.com") return null;

    url.protocol = "https:";
    url.hostname = "www.facebook.com";
    url.hash = "";
    for (const param of ["fbclid", "mibextid", "__tn__", "refsrc"]) {
      url.searchParams.delete(param);
    }

    return url.toString();
  } catch {
    return null;
  }
}

function isFacebookEventUrl(value: string): boolean {
  const normalized = normalizeFacebookUrl(value);
  if (!normalized) return false;

  const { pathname } = new URL(normalized);
  return /^\/events\/(?:s\/[^/]+\/)?\d+\/?$/i.test(pathname);
}

function configuredEventUrls(): string[] {
  const urls = splitEnvList(process.env.FACEBOOK_EVENT_URLS)
    .map(normalizeFacebookUrl)
    .filter((url): url is string => Boolean(url))
    .filter(isFacebookEventUrl);

  return Array.from(new Set(urls));
}

function configuredPageUrls(): string[] {
  const urls = splitEnvList(process.env.FACEBOOK_PAGE_URLS)
    .map(normalizeFacebookUrl)
    .filter((url): url is string => Boolean(url));

  return Array.from(new Set(urls));
}

function facebookPageEventUrls(pageUrl: string): string[] {
  const url = new URL(pageUrl);
  if (/\/events\/?$/i.test(url.pathname)) return [url.toString()];

  url.pathname = `${url.pathname.replace(/\/+$/, "")}/events`;
  return [pageUrl, url.toString()];
}

async function fetchFacebookHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": "HackScout-Bot/1.0 (+https://hackscout.pk)",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.text();
}

function extractEventUrls(html: string): string[] {
  const normalizedHtml = html.replace(/\\\//g, "/").replace(/&amp;/g, "&");
  const urls = new Set<string>();
  const $ = load(normalizedHtml);

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;

    const normalized = normalizeFacebookUrl(href);
    if (normalized && isFacebookEventUrl(normalized)) {
      urls.add(normalized);
    }
  });

  const absoluteMatches = normalizedHtml.matchAll(
    /https?:\/\/(?:www\.|m\.|mbasic\.)?facebook\.com\/events\/(?:s\/[^"'<>\\\s]+\/)?\d+\/?/gi
  );
  for (const match of absoluteMatches) {
    const normalized = normalizeFacebookUrl(match[0]);
    if (normalized && isFacebookEventUrl(normalized)) urls.add(normalized);
  }

  const relativeMatches = normalizedHtml.matchAll(
    /\/events\/(?:s\/[^"'<>\\\s]+\/)?\d+\/?/gi
  );
  for (const match of relativeMatches) {
    const normalized = normalizeFacebookUrl(match[0]);
    if (normalized && isFacebookEventUrl(normalized)) urls.add(normalized);
  }

  return Array.from(urls);
}

function asRecord(value: JsonValue | undefined): Record<string, JsonValue> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, JsonValue>)
    : null;
}

function stringValue(value: JsonValue | undefined): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
}

function imageValue(value: JsonValue | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const image = imageValue(item);
      if (image) return image;
    }
  }

  const record = asRecord(value);
  return stringValue(record?.url) ?? stringValue(record?.contentUrl);
}

function nameValue(value: JsonValue | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(nameValue).filter(Boolean).join(", ") || null;
  }

  const record = asRecord(value);
  return stringValue(record?.name) ?? stringValue(record?.alternateName);
}

function addressValue(value: JsonValue | undefined): string | null {
  if (typeof value === "string") return value;
  const record = asRecord(value);
  if (!record) return null;

  const address = asRecord(record.address);
  const parts = [
    stringValue(record.name),
    address
      ? [
          stringValue(address.streetAddress),
          stringValue(address.addressLocality),
          stringValue(address.addressRegion),
          stringValue(address.addressCountry),
        ]
          .filter(Boolean)
          .join(", ")
      : null,
  ].filter(Boolean);

  return parts.join(", ") || null;
}

function schemaTypeMatches(record: Record<string, JsonValue>): boolean {
  const type = record["@type"];
  if (typeof type === "string") return /event/i.test(type);
  if (Array.isArray(type)) {
    return type.some((entry) => typeof entry === "string" && /event/i.test(entry));
  }
  return false;
}

function findEventSchema(value: JsonValue): Record<string, JsonValue> | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const match = findEventSchema(item);
      if (match) return match;
    }
    return null;
  }

  const record = asRecord(value);
  if (!record) return null;
  if (schemaTypeMatches(record)) return record;

  for (const key of ["@graph", "mainEntity", "event"]) {
    const match = findEventSchema(record[key]);
    if (match) return match;
  }

  return null;
}

function parseJsonLdEvent(html: string): ParsedFacebookEvent {
  const $ = load(html);

  for (const script of $("script[type='application/ld+json']").toArray()) {
    const raw = $(script).contents().text();
    if (!raw.trim()) continue;

    try {
      const parsed = JSON.parse(raw) as JsonValue;
      const event = findEventSchema(parsed);
      if (!event) continue;

      return {
        title: stringValue(event.name),
        description: stringValue(event.description),
        coverImage: imageValue(event.image),
        startDate: validDate(stringValue(event.startDate)),
        endDate: validDate(stringValue(event.endDate)),
        rawLocation: addressValue(event.location),
        organizerName: nameValue(event.organizer),
      };
    } catch {
      // Ignore malformed embedded data and fall back to meta tags below.
    }
  }

  return {};
}

function parseMetaEvent(html: string): ParsedFacebookEvent {
  const $ = load(html);
  const meta = (property: string) =>
    cleanText(
      $(`meta[property="${property}"]`).attr("content") ??
        $(`meta[name="${property}"]`).attr("content") ??
        null
    );
  const title = meta("og:title").replace(/\s*\|\s*Facebook\s*$/i, "");
  const description = meta("og:description");

  return {
    title,
    description,
    coverImage: meta("og:image") || null,
    startDate: validDate(meta("event:start_time")),
    endDate: validDate(meta("event:end_time")),
    rawLocation: meta("event:location"),
    organizerName: meta("event:organizer"),
  };
}

function parseTimestampFallback(html: string): Pick<ParsedFacebookEvent, "startDate" | "endDate"> {
  const start =
    html.match(/"start_timestamp"\s*:\s*(\d{10,13})/) ??
    html.match(/"startTime"\s*:\s*(\d{10,13})/);
  const end =
    html.match(/"end_timestamp"\s*:\s*(\d{10,13})/) ??
    html.match(/"endTime"\s*:\s*(\d{10,13})/);

  const fromMatch = (match: RegExpMatchArray | null) => {
    if (!match) return null;
    const value = Number(match[1]);
    if (!Number.isFinite(value)) return null;
    return validDate(value);
  };

  return {
    startDate: fromMatch(start),
    endDate: fromMatch(end),
  };
}

function mapCategory(text: string): ScrapedEventInput["category"] {
  const value = text.toLowerCase();

  if (/hackathon|hack day|codefest|buildathon/.test(value)) return "hackathon";
  if (/conference|summit|congress|convention|symposium/.test(value)) return "conference";
  if (/workshop|bootcamp|training|masterclass/.test(value)) return "workshop";
  if (/meetup|mixer|networking|community/.test(value)) return "meetup";
  if (/seminar|webinar|talk|lecture|panel/.test(value)) return "seminar";
  if (/career.?fair|job.?fair|recruitment/.test(value)) return "career_fair";
  if (/festival|fest|expo/.test(value)) return "festival";
  if (/competition|challenge|contest|pitch|olympiad/.test(value)) return "competition";
  return "other";
}

function isRelevantToPakistan(event: ParsedFacebookEvent): {
  isRelevant: boolean;
  rawLocation: string;
  isOnline: boolean;
} {
  const rawLocation = cleanText(event.rawLocation) || "";
  const searchable = [
    event.title,
    event.description,
    rawLocation,
    event.organizerName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const cityMatch = normalizeCity(rawLocation);
  const isOnline = /online|virtual|remote|webinar|zoom|google meet|microsoft teams/.test(searchable);

  if (cityMatch.matched && cityMatch.slug !== "online") {
    return { isRelevant: true, rawLocation, isOnline };
  }

  if (PAKISTAN_TERMS.some((term) => new RegExp(`(^|[^a-z0-9])${term}([^a-z0-9]|$)`, "i").test(searchable))) {
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

function parseFacebookEvent(html: string, sourceUrl: string): ScrapedEventInput | null {
  const schemaEvent = parseJsonLdEvent(html);
  const metaEvent = parseMetaEvent(html);
  const timestamps = parseTimestampFallback(html);
  const event: ParsedFacebookEvent = {
    title: schemaEvent.title || metaEvent.title,
    description: schemaEvent.description || metaEvent.description,
    coverImage: schemaEvent.coverImage || metaEvent.coverImage,
    startDate: schemaEvent.startDate || metaEvent.startDate || timestamps.startDate,
    endDate: schemaEvent.endDate || metaEvent.endDate || timestamps.endDate,
    rawLocation: schemaEvent.rawLocation || metaEvent.rawLocation,
    organizerName: schemaEvent.organizerName || metaEvent.organizerName,
  };

  if (!event.title || !event.startDate) return null;

  const { isRelevant, rawLocation, isOnline } = isRelevantToPakistan(event);
  if (!isRelevant) return null;

  const category = mapCategory(`${event.title} ${event.description ?? ""}`);
  const description = cleanText(event.description) || cleanText(event.title);
  const tags = Array.from(new Set(["facebook", category, ...(isOnline ? ["online"] : [])]));

  return {
    title: cleanText(event.title),
    description,
    coverImage: event.coverImage || null,
    category,
    source: "facebook",
    sourceUrl,
    sourcePostUrl: sourceUrl,
    startDate: event.startDate,
    endDate: event.endDate ?? null,
    registrationDeadline: null,
    rawLocation: rawLocation || (isOnline ? "Online" : "Pakistan"),
    venue: isOnline ? "Online" : rawLocation || null,
    isOnline,
    tags,
    organizerName: cleanText(event.organizerName) || null,
    registrationType: "external",
    registrationUrl: sourceUrl,
  };
}

/**
 * Facebook public events scraper.
 *
 * Reads explicitly configured public Facebook event URLs and optional page URLs.
 * It does not use credentials, private APIs, or login-required data; Facebook may
 * still return sparse or blocked markup, so missing public fields are skipped.
 */
export async function scrapeFacebook(): Promise<ScraperResult> {
  const errors: string[] = [];
  const eventUrls = new Set(configuredEventUrls());

  for (const pageUrl of configuredPageUrls().slice(0, MAX_PAGE_FETCHES)) {
    for (const url of facebookPageEventUrls(pageUrl)) {
      try {
        const html = await fetchFacebookHtml(url);
        for (const eventUrl of extractEventUrls(html)) {
          eventUrls.add(eventUrl);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`Error fetching Facebook page "${url}": ${message}`);
      }
    }
  }

  const events = new Map<string, ScrapedEventInput>();
  for (const eventUrl of Array.from(eventUrls).slice(0, MAX_EVENT_FETCHES)) {
    try {
      const html = await fetchFacebookHtml(eventUrl);
      const mapped = parseFacebookEvent(html, eventUrl);
      if (mapped) events.set(mapped.sourceUrl, mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Error fetching Facebook event "${eventUrl}": ${message}`);
    }
  }

  return {
    source: "facebook",
    events: Array.from(events.values()),
    errors: errors.length ? errors : undefined,
  };
}
