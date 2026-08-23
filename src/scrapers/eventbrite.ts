import { load } from "cheerio";

import { normalizeCity, PAKISTAN_CITIES } from "@/lib/cities";
import type { ScrapedEventInput, ScraperResult } from "./types";

const EVENTBRITE_BASE_URL = "https://www.eventbrite.com";
const MAX_PAGES = Number(process.env.EVENTBRITE_PAGE_LIMIT ?? 3);

/**
 * Eventbrite retired public search (`GET /v3/events/search/`) in 2019.
 * Discovery pages still server-render listings into `window.__SERVER_DATA__`.
 */
const DEFAULT_LOCATION_SLUGS = [
  "pakistan",
  "pakistan--karachi",
  "pakistan--lahore",
  "pakistan--islamabad",
  "pakistan--rawalpindi",
  "pakistan--faisalabad",
  "pakistan--multan",
  "pakistan--peshawar",
  "pakistan--quetta",
  "pakistan--hyderabad",
  "pakistan--sialkot",
  "pakistan--gujranwala",
  "pakistan--abbottabad",
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

interface EventbriteAddress {
  city?: string | null;
  country?: string | null;
  region?: string | null;
  address_1?: string | null;
  localized_address_display?: string | null;
  localized_area_display?: string | null;
}

interface EventbriteVenue {
  name?: string | null;
  address?: EventbriteAddress | null;
}

interface EventbriteTag {
  prefix?: string | null;
  display_name?: string | null;
  tag?: string | null;
}

interface EventbriteImage {
  url?: string | null;
}

interface EventbriteListing {
  id?: string | number | null;
  eventbrite_event_id?: string | null;
  eid?: string | null;
  name?: string | null;
  url?: string | null;
  summary?: string | null;
  full_description?: string | { html?: string | null; text?: string | null } | null;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  timezone?: string | null;
  is_online_event?: boolean | null;
  is_cancelled?: boolean | null;
  tickets_url?: string | null;
  primary_venue?: EventbriteVenue | null;
  primary_organizer?: { name?: string | null } | null;
  tags?: EventbriteTag[] | null;
  image?: EventbriteImage | null;
}

interface EventbritePagination {
  object_count?: number;
  page_count?: number;
  page_number?: number;
  page_size?: number;
}

interface EventbriteServerData {
  search_data?: {
    events?: {
      pagination?: EventbritePagination;
      results?: EventbriteListing[];
    };
  };
}

function splitEnvList(value?: string): string[] {
  if (!value) return [];

  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function configuredDiscoveryUrls(): string[] {
  const slugs = splitEnvList(process.env.EVENTBRITE_LOCATION_SLUGS);
  const locationUrls = (slugs.length ? slugs : DEFAULT_LOCATION_SLUGS).map(
    (slug) => `${EVENTBRITE_BASE_URL}/d/${slug.replace(/^\/+/, "")}/all-events/`
  );

  return Array.from(new Set([...locationUrls, ...splitEnvList(process.env.EVENTBRITE_PAGE_URLS)]));
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

function parseEventbriteDate(date?: string | null, time?: string | null, timezone?: string | null): Date | null {
  if (!date) return null;

  const clock = time && /^\d{1,2}:\d{2}/.test(time) ? time : "00:00";
  const normalizedClock = clock.length === 5 ? `${clock}:00` : clock.slice(0, 8);
  const offset = timezone === "Asia/Karachi" || !timezone ? "+05:00" : "";
  return validDate(`${date}T${normalizedClock}${offset}`) ?? validDate(`${date}T${normalizedClock}`);
}

function descriptionFromListing(listing: EventbriteListing): string {
  if (typeof listing.full_description === "string") {
    return cleanText(listing.full_description);
  }

  if (listing.full_description && typeof listing.full_description === "object") {
    return (
      cleanText(listing.full_description.text) ||
      cleanText(listing.full_description.html)
    );
  }

  return cleanText(listing.summary);
}

function normalizeEventbriteUrl(value?: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value, EVENTBRITE_BASE_URL);
    if (!/eventbrite\./i.test(url.hostname)) return null;

    url.protocol = "https:";
    url.hostname = "www.eventbrite.com";
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function extractJsonObject(html: string, marker: string): unknown | null {
  const start = html.indexOf(marker);
  if (start < 0) return null;

  let i = start + marker.length;
  while (i < html.length && html[i] !== "{") i++;
  if (html[i] !== "{") return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let j = i; j < html.length; j++) {
    const char = html[j];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') inString = false;
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") depth++;
    else if (char === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(i, j + 1)) as unknown;
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

function listingsFromServerData(html: string): {
  listings: EventbriteListing[];
  pagination: EventbritePagination | null;
} {
  const data = extractJsonObject(html, "window.__SERVER_DATA__") as EventbriteServerData | null;
  const events = data?.search_data?.events;
  return {
    listings: Array.isArray(events?.results) ? events.results : [],
    pagination: events?.pagination ?? null,
  };
}

function listingsFromJsonLd(html: string): EventbriteListing[] {
  const $ = load(html);
  const listings: EventbriteListing[] = [];

  for (const script of $("script[type='application/ld+json']").toArray()) {
    const raw = $(script).contents().text();
    if (!raw.trim()) continue;

    try {
      const parsed = JSON.parse(raw) as {
        itemListElement?: Array<{ item?: Record<string, unknown> }>;
      };
      for (const entry of parsed.itemListElement ?? []) {
        const item = entry.item;
        if (!item || typeof item !== "object") continue;

        const url = typeof item.url === "string" ? item.url : null;
        const name = typeof item.name === "string" ? item.name : null;
        if (!url) continue;

        listings.push({
          name: name ?? null,
          url,
          summary: typeof item.description === "string" ? item.description : null,
          start_date: typeof item.startDate === "string" ? item.startDate.slice(0, 10) : null,
          end_date: typeof item.endDate === "string" ? item.endDate.slice(0, 10) : null,
          start_time: typeof item.startDate === "string" && item.startDate.length > 10 ? item.startDate.slice(11, 16) : null,
          end_time: typeof item.endDate === "string" && item.endDate.length > 10 ? item.endDate.slice(11, 16) : null,
          image: typeof item.image === "string" ? { url: item.image } : null,
        });
      }
    } catch {
      // Ignore malformed JSON-LD blocks and rely on SERVER_DATA.
    }
  }

  return listings;
}

function mapCategory(listing: EventbriteListing): ScrapedEventInput["category"] {
  const value = [
    listing.name,
    listing.summary,
    ...(listing.tags ?? []).map((tag) => `${tag.prefix ?? ""} ${tag.display_name ?? ""} ${tag.tag ?? ""}`),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/hackathon|hack day|codefest|buildathon/.test(value)) return "hackathon";
  if (/conference|summit|congress|convention|symposium/.test(value)) return "conference";
  if (/workshop|bootcamp|training|masterclass|class, training/.test(value)) return "workshop";
  if (/meetup|mixer|networking|community|meeting or networking/.test(value)) return "meetup";
  if (/seminar|webinar|talk|lecture|panel|seminar or talk/.test(value)) return "seminar";
  if (/career.?fair|job.?fair|recruitment/.test(value)) return "career_fair";
  if (/festival|fest|expo/.test(value)) return "festival";
  if (/competition|challenge|contest|pitch|olympiad/.test(value)) return "competition";
  return "other";
}

function locationFromListing(listing: EventbriteListing): string {
  const address = listing.primary_venue?.address;
  return (
    address?.localized_address_display ||
    address?.localized_area_display ||
    [address?.city, address?.region, address?.country].filter(Boolean).join(", ")
  );
}

function isOnlineEvent(listing: EventbriteListing, rawLocation: string): boolean {
  if (listing.is_online_event) return true;
  const text = `${listing.name ?? ""} ${listing.summary ?? ""} ${rawLocation}`;
  return /online|virtual|remote|zoom|webinar/i.test(text);
}

function isRelevantToPakistan(listing: EventbriteListing): {
  isRelevant: boolean;
  rawLocation: string;
  isOnline: boolean;
} {
  const rawLocation = locationFromListing(listing).trim();
  const isOnline = isOnlineEvent(listing, rawLocation);
  const country = listing.primary_venue?.address?.country?.trim().toUpperCase() ?? "";
  const cityMatch = normalizeCity(rawLocation);
  const searchableText = [
    rawLocation,
    listing.name,
    listing.summary,
    ...(listing.tags ?? []).map((tag) => tag.display_name),
  ]
    .filter(Boolean)
    .join(" ");

  if (country && country !== "PK" && country !== "PAKISTAN") {
    return { isRelevant: false, rawLocation, isOnline };
  }

  if (country === "PK" || /pakistan/i.test(listing.primary_venue?.address?.country ?? "")) {
    return { isRelevant: true, rawLocation: rawLocation || "Pakistan", isOnline };
  }

  if (cityMatch.matched && cityMatch.slug !== "online") {
    return { isRelevant: true, rawLocation, isOnline };
  }

  if (hasPakistanTerm(searchableText)) {
    return {
      isRelevant: true,
      rawLocation: rawLocation || (isOnline ? "Online" : "Pakistan"),
      isOnline,
    };
  }

  return { isRelevant: false, rawLocation, isOnline };
}

function tagsForListing(listing: EventbriteListing, category: ScrapedEventInput["category"]): string[] {
  const rawTags = [
    "eventbrite",
    category,
    ...(listing.tags ?? []).map((tag) => tag.display_name),
  ];

  return Array.from(new Set(rawTags.map((tag) => cleanText(tag).toLowerCase()).filter(Boolean)));
}

function mapEventbriteToScrapedInput(listing: EventbriteListing): ScrapedEventInput | null {
  if (listing.is_cancelled) return null;

  const title = cleanText(listing.name);
  const sourceUrl = normalizeEventbriteUrl(listing.url);
  const startDate = parseEventbriteDate(listing.start_date, listing.start_time, listing.timezone);
  if (!title || !sourceUrl || !startDate) return null;

  const { isRelevant, rawLocation, isOnline } = isRelevantToPakistan(listing);
  if (!isRelevant) return null;

  const category = mapCategory(listing);
  const description = descriptionFromListing(listing) || title;

  return {
    title,
    description,
    coverImage: listing.image?.url ?? null,
    category,
    source: "eventbrite",
    sourceUrl,
    startDate,
    endDate: parseEventbriteDate(listing.end_date, listing.end_time, listing.timezone),
    registrationDeadline: null,
    rawLocation: rawLocation || (isOnline ? "Online" : "Pakistan"),
    venue: isOnline ? "Online" : listing.primary_venue?.name || rawLocation || null,
    isOnline,
    tags: tagsForListing(listing, category),
    organizerName: cleanText(listing.primary_organizer?.name) || null,
    registrationType: "external",
    registrationUrl: sourceUrl,
  };
}

function withPage(url: string, page: number): string {
  const parsed = new URL(url);
  if (page > 1) parsed.searchParams.set("page", String(page));
  else parsed.searchParams.delete("page");
  return parsed.toString();
}

async function fetchEventbritePage(url: string): Promise<string> {
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

/**
 * Eventbrite scraper.
 * Pulls public Pakistan listings from Eventbrite discovery pages (country +
 * major cities), then keeps events tied to Pakistan or Pakistani cities.
 */
export async function scrapeEventbrite(): Promise<ScraperResult> {
  const errors: string[] = [];
  const events = new Map<string, ScrapedEventInput>();

  for (const baseUrl of configuredDiscoveryUrls()) {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = withPage(baseUrl, page);
      try {
        const html = await fetchEventbritePage(url);
        const parsed = listingsFromServerData(html);
        const listings = parsed.listings.length ? parsed.listings : listingsFromJsonLd(html);

        if (!listings.length) break;

        for (const listing of listings) {
          const mapped = mapEventbriteToScrapedInput(listing);
          if (mapped) events.set(mapped.sourceUrl, mapped);
        }

        const pageCount = parsed.pagination?.page_count ?? 1;
        if (page >= pageCount) break;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`Error fetching Eventbrite page "${url}": ${message}`);
        break;
      }
    }
  }

  return {
    source: "eventbrite",
    events: Array.from(events.values()),
    errors: errors.length ? errors : undefined,
  };
}
