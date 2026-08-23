import { load } from "cheerio";

import { normalizeCity, PAKISTAN_CITIES } from "@/lib/cities";
import type { ScrapedEventInput, ScraperResult } from "./types";

const LUMA_BASE_URL = "https://lu.ma";
const LUMA_DISCOVER_PAGE_LIMIT = Number(process.env.LUMA_DISCOVER_PAGE_LIMIT ?? 30);
const REQUIRE_PAKISTAN_MATCH = process.env.LUMA_REQUIRE_PAKISTAN_MATCH !== "false";
const DEFAULT_LUMA_PAGE_URLS = ["https://lu.ma/genai-collective", "https://lu.ma/uetlahore?k=c"];
const MAX_DETAIL_FETCHES = Number(process.env.LUMA_DETAIL_FETCH_LIMIT ?? 500);

interface LumaGeoAddressInfo {
  city?: string | null;
  city_state?: string | null;
  country?: string | null;
  country_code?: string | null;
  region?: string | null;
  region_short?: string | null;
  full_address?: string | null;
  address?: string | null;
}

interface LumaEvent {
  api_id?: string;
  cover_url?: string | null;
  end_at?: string | null;
  location_type?: string | null;
  name?: string | null;
  social_image_url?: string | null;
  start_at?: string | null;
  timezone?: string | null;
  url?: string | null;
  geo_address_info?: LumaGeoAddressInfo | null;
  virtual_info?: Record<string, unknown> | null;
}

interface LumaHost {
  name?: string | null;
}

interface LumaCalendar {
  name?: string | null;
  slug?: string | null;
  description_short?: string | null;
  location?: string | null;
}

interface LumaCategory {
  name?: string | null;
  slug?: string | null;
}

interface LumaTicketType {
  valid_end_at?: string | null;
}

interface LumaFeaturedItem {
  api_id?: string;
  event?: LumaEvent | null;
  calendar?: LumaCalendar | null;
  hosts?: LumaHost[] | null;
  categories?: LumaCategory[] | null;
  ticket_types?: LumaTicketType[] | null;
  registration_availability?: string | null;
  description_mirror?: unknown;
}

interface LumaInitialData {
  event?: LumaEvent | null;
  calendar?: LumaCalendar | null;
  featured_items?: LumaFeaturedItem[] | null;
  hosts?: LumaHost[] | null;
  categories?: LumaCategory[] | null;
  ticket_types?: LumaTicketType[] | null;
  registration_availability?: string | null;
  description_mirror?: unknown;
}

interface LumaNextData {
  props?: {
    pageProps?: {
      initialData?: {
        data?: LumaInitialData;
      };
    };
  };
}

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

function slugToPageUrl(slugOrUrl: string): string {
  const value = slugOrUrl.trim();
  if (/^https?:\/\//i.test(value)) return value.replace("https://luma.com", LUMA_BASE_URL);

  return `${LUMA_BASE_URL}/${value.replace(/^\/+/, "")}`;
}

function configuredUrls(): string[] {
  const discoverPages = Array.from({ length: Math.max(1, LUMA_DISCOVER_PAGE_LIMIT) }, (_, index) => {
    const page = index + 1;
    return page === 1 ? `${LUMA_BASE_URL}/discover` : `${LUMA_BASE_URL}/discover?page=${page}`;
  });
  const extraUrls = [
    process.env.LUMA_PAGE_URLS,
    process.env.LUMA_CALENDAR_SLUGS?.split(",")
      .map((slug) => slug.trim())
      .filter(Boolean)
      .map(slugToPageUrl)
      .join(","),
  ]
    .filter(Boolean)
    .join(",")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  return Array.from(new Set([...discoverPages, ...DEFAULT_LUMA_PAGE_URLS, ...extraUrls]));
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

function normalizeLumaUrl(value?: string | null): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value.replace("https://luma.com", LUMA_BASE_URL);
  return `${LUMA_BASE_URL}/${value.replace(/^\/+/, "")}`;
}

function extractNextData(html: string): LumaInitialData | null {
  const $ = load(html);
  const raw = $("script#__NEXT_DATA__").text();
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as LumaNextData;
    return parsed.props?.pageProps?.initialData?.data ?? null;
  } catch {
    return null;
  }
}

function mirrorToText(node: unknown): string {
  if (!node || typeof node !== "object") return "";

  if (Array.isArray(node)) {
    return node.map(mirrorToText).filter(Boolean).join(" ");
  }

  const record = node as Record<string, unknown>;
  const ownText = typeof record.text === "string" ? record.text : "";
  const childText = mirrorToText(record.content);
  return [ownText, childText].filter(Boolean).join(" ");
}

function mapCategory(item: LumaFeaturedItem): ScrapedEventInput["category"] {
  const value = [
    item.event?.name,
    item.calendar?.name,
    item.calendar?.description_short,
    ...(item.categories ?? []).map((category) => `${category.name ?? ""} ${category.slug ?? ""}`),
    mirrorToText(item.description_mirror),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/hackathon|hack day|codefest|buildathon/.test(value)) return "hackathon";
  if (/conference|summit|congress|convention/.test(value)) return "conference";
  if (/workshop|bootcamp|training|masterclass/.test(value)) return "workshop";
  if (/meetup|mixer|networking|community/.test(value)) return "meetup";
  if (/seminar|webinar|talk|lecture|panel/.test(value)) return "seminar";
  if (/career.?fair|job.?fair/.test(value)) return "career_fair";
  if (/festival|fest|expo/.test(value)) return "festival";
  if (/competition|challenge|contest|pitch/.test(value)) return "competition";
  return "other";
}

function locationFromEvent(event: LumaEvent): string {
  const geo = event.geo_address_info;
  if (!geo) return "";

  return (
    geo.full_address ||
    geo.address ||
    geo.city_state ||
    [geo.city, geo.region, geo.country].filter(Boolean).join(", ")
  );
}

function isOnlineEvent(event: LumaEvent): boolean {
  const type = event.location_type?.toLowerCase() ?? "";
  return type !== "offline" && (/online|virtual|zoom|meet|remote/.test(type) || !event.geo_address_info);
}

function isRelevantToPakistan(item: LumaFeaturedItem): { isRelevant: boolean; rawLocation: string; isOnline: boolean } {
  const event = item.event;
  if (!event) return { isRelevant: false, rawLocation: "", isOnline: false };

  const rawLocation = locationFromEvent(event).trim();
  const isOnline = isOnlineEvent(event);
  const cityMatch = normalizeCity(rawLocation);
  const geo = event.geo_address_info;
  const searchableText = [
    rawLocation,
    geo?.country,
    geo?.country_code,
    geo?.region,
    item.event?.name,
    item.calendar?.name,
    item.calendar?.description_short,
    mirrorToText(item.description_mirror),
  ]
    .filter(Boolean)
    .join(" ");

  if (geo?.country_code?.toUpperCase() === "PK" || /pakistan/i.test(geo?.country ?? "")) {
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

function registrationDeadlineFromTickets(ticketTypes?: LumaTicketType[] | null): Date | null {
  const dates = (ticketTypes ?? [])
    .map((ticket) => validDate(ticket.valid_end_at))
    .filter((date): date is Date => Boolean(date));

  if (!dates.length) return null;
  return new Date(Math.max(...dates.map((date) => date.getTime())));
}

function tagsForItem(item: LumaFeaturedItem, category: ScrapedEventInput["category"]): string[] {
  const rawTags = [
    "luma",
    category,
    item.calendar?.name,
    ...(item.categories ?? []).flatMap((categoryItem) => [categoryItem.name, categoryItem.slug]),
  ];

  return Array.from(
    new Set(rawTags.map((tag) => cleanText(tag).toLowerCase()).filter(Boolean))
  );
}

function mapLumaToScrapedInput(
  item: LumaFeaturedItem,
  rawLocation: string,
  isOnline: boolean
): ScrapedEventInput | null {
  const event = item.event;
  if (!event?.name || !event.start_at) return null;

  const sourceUrl = normalizeLumaUrl(event.url);
  if (!sourceUrl) return null;

  const startDate = validDate(event.start_at);
  if (!startDate) return null;

  const category = mapCategory(item);
  const description =
    cleanText(mirrorToText(item.description_mirror)) ||
    cleanText(item.calendar?.description_short) ||
    cleanText(event.name);
  const organizerName =
    item.hosts?.map((host) => cleanText(host.name)).filter(Boolean).join(", ") ||
    cleanText(item.calendar?.name) ||
    null;

  return {
    title: cleanText(event.name),
    description,
    coverImage: event.cover_url ?? event.social_image_url ?? null,
    category,
    source: "luma",
    sourceUrl,
    startDate,
    endDate: validDate(event.end_at),
    registrationDeadline: registrationDeadlineFromTickets(item.ticket_types),
    rawLocation: rawLocation || (isOnline ? "Online" : "Pakistan"),
    venue: isOnline ? "Online" : rawLocation || null,
    isOnline,
    tags: tagsForItem(item, category),
    organizerName,
    registrationType: "external",
    registrationUrl: sourceUrl,
  };
}

async function fetchLumaPage(url: string): Promise<string> {
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

function itemsFromInitialData(data: LumaInitialData | null): LumaFeaturedItem[] {
  if (!data) return [];

  const items = data.featured_items ?? [];
  if (data.event) {
    items.push({
      event: data.event,
      calendar: data.calendar ?? null,
      hosts: data.hosts ?? null,
      categories: data.categories ?? null,
      ticket_types: data.ticket_types ?? null,
      registration_availability: data.registration_availability ?? null,
      description_mirror: data.description_mirror,
    });
  }

  return items;
}

async function hydrateItem(item: LumaFeaturedItem): Promise<LumaFeaturedItem> {
  const sourceUrl = normalizeLumaUrl(item.event?.url);
  if (!sourceUrl) return item;

  const html = await fetchLumaPage(sourceUrl);
  const detailData = extractNextData(html);
  const detailItem = itemsFromInitialData(detailData)[0];
  if (!detailItem?.event) return item;

  return {
    ...item,
    ...detailItem,
    event: { ...item.event, ...detailItem.event },
    calendar: detailItem.calendar ?? item.calendar,
    hosts: detailItem.hosts ?? item.hosts,
    categories: detailItem.categories ?? item.categories,
    ticket_types: detailItem.ticket_types ?? item.ticket_types,
    description_mirror: detailItem.description_mirror ?? item.description_mirror,
  };
}

/**
 * Luma scraper.
 * Pulls event cards from public Luma discovery/calendar pages, hydrates event
 * details where possible, and keeps events tied to Pakistan or Pakistani cities.
 */
export async function scrapeLuma(): Promise<ScraperResult> {
  const errors: string[] = [];
  const candidates = new Map<string, LumaFeaturedItem>();
  let filteredOut = 0;
  let matchedPakistan = 0;
  let invalidMapped = 0;

  for (const url of configuredUrls()) {
    try {
      const html = await fetchLumaPage(url);
      for (const item of itemsFromInitialData(extractNextData(html))) {
        const sourceUrl = normalizeLumaUrl(item.event?.url ?? item.api_id);
        if (sourceUrl && !candidates.has(sourceUrl)) {
          candidates.set(sourceUrl, item);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Error fetching Luma page "${url}": ${message}`);
    }
  }

  const events = new Map<string, ScrapedEventInput>();
  let detailFetches = 0;

  for (const item of candidates.values()) {
    let hydrated = item;
    if (detailFetches < MAX_DETAIL_FETCHES) {
      try {
        hydrated = await hydrateItem(item);
        detailFetches++;
      } catch (err) {
        const sourceUrl = normalizeLumaUrl(item.event?.url) ?? item.event?.name ?? "unknown";
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`Error fetching Luma event "${sourceUrl}": ${message}`);
      }
    }

    const { isRelevant, rawLocation, isOnline } = isRelevantToPakistan(hydrated);
    if (REQUIRE_PAKISTAN_MATCH && !isRelevant) {
      filteredOut++;
      continue;
    }
    if (isRelevant) {
      matchedPakistan++;
    }

    const mapped = mapLumaToScrapedInput(hydrated, rawLocation, isOnline);
    if (mapped) events.set(mapped.sourceUrl, mapped);
    else invalidMapped++;
  }

  return {
    source: "luma",
    events: Array.from(events.values()),
    errors: errors.length ? errors : undefined,
    stats: {
      candidatesFound: candidates.size,
      detailHydrated: detailFetches,
      matchedPakistan,
      filteredOut,
      invalidMapped,
    },
  };
}
