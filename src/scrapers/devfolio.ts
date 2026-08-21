import type { ScrapedEventInput, ScraperResult } from "./types";
import { normalizeCity } from "@/lib/cities";
import { PAKISTAN_SEARCH_QUERIES } from "./queries";

interface DevfolioHackathonItem {
  slug?: string;
  name?: string;
  desc?: string;
  tagline?: string;
  hero_image?: string;
  cover_image?: string;
  starts_at?: string;
  ends_at?: string;
  reg_ends_at?: string;
  location?: string;
  is_online?: boolean;
  themes?: Array<{ name?: string } | string>;
  prizes?: Array<{ amount?: number; currency?: string; title?: string }>;
  organizer?: { name?: string };
  status?: string;
  apply_url?: string;
  url?: string;
}

interface DevfolioSearchResponse {
  hits?: Array<{
    _source?: DevfolioHackathonItem;
    fields?: Record<string, unknown>;
  } | DevfolioHackathonItem>;
  hackathons?: DevfolioHackathonItem[];
  result?: DevfolioHackathonItem[];
}

/**
 * Searches Devfolio API for hackathons matching given query terms or status filters.
 */
async function fetchDevfolioApi(query?: string, type: string = "application_open"): Promise<DevfolioHackathonItem[]> {
  const url = new URL("https://api.devfolio.co/api/hackathons");
  if (query) {
    url.searchParams.set("q", query);
  }
  if (type) {
    url.searchParams.set("type", type);
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "HackScout-Bot/1.0 (+https://hackscout.pk)",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      // Devfolio might return 404/empty or restrict queries
      return [];
    }

    const data = (await response.json()) as DevfolioSearchResponse | DevfolioHackathonItem[];

    if (Array.isArray(data)) {
      return data;
    }

    if (data.hackathons && Array.isArray(data.hackathons)) {
      return data.hackathons;
    }

    if (data.result && Array.isArray(data.result)) {
      return data.result;
    }

    if (data.hits && Array.isArray(data.hits)) {
      return data.hits.map((hit) => ("_source" in hit && hit._source ? hit._source : (hit as DevfolioHackathonItem)));
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Checks if the location or hackathon attributes associate it with Pakistan or open online participation.
 */
function isRelevantToPakistan(item: DevfolioHackathonItem): { isRelevant: boolean; isOnline: boolean; rawLocation: string } {
  const locationStr = (item.location || "").trim();
  const titleAndDesc = `${item.name || ""} ${item.desc || ""} ${item.tagline || ""}`.toLowerCase();
  
  const cityMatch = normalizeCity(locationStr);
  const isOnline = Boolean(item.is_online || cityMatch.slug === "online" || /online|virtual|remote/i.test(locationStr));

  // If directly matched a known Pakistan city (not fallback online)
  if (cityMatch.matched && cityMatch.slug !== "online") {
    return { isRelevant: true, isOnline, rawLocation: locationStr };
  }

  // If text or location explicitly mentions Pakistan
  if (
    /pakistan|karachi|lahore|islamabad|rawalpindi|faisalabad|multan|peshawar|quetta|hyderabad|giki|nust|fast|lums/i.test(
      locationStr
    ) ||
    /pakistan/i.test(titleAndDesc)
  ) {
    return { isRelevant: true, isOnline, rawLocation: locationStr || "Pakistan" };
  }

  // If online hackathon open globally
  if (isOnline) {
    return { isRelevant: true, isOnline: true, rawLocation: "Online" };
  }

  return { isRelevant: false, isOnline, rawLocation: locationStr };
}

/**
 * Converts a raw Devfolio item into standard ScrapedEventInput
 */
function mapDevfolioToScrapedInput(item: DevfolioHackathonItem, rawLocation: string, isOnline: boolean): ScrapedEventInput | null {
  if (!item.name || (!item.slug && !item.url)) {
    return null;
  }

  const slug = item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const sourceUrl = item.url || (item.slug ? `https://${item.slug}.devfolio.co` : `https://devfolio.co/hackathons/${slug}`);
  const description = item.desc || item.tagline || item.name;
  const coverImage = item.cover_image || item.hero_image || null;

  const startDate = item.starts_at ? new Date(item.starts_at) : new Date();
  const endDate = item.ends_at ? new Date(item.ends_at) : null;
  const registrationDeadline = item.reg_ends_at ? new Date(item.reg_ends_at) : null;

  // Extract tags / themes
  const tags: string[] = ["devfolio", "hackathon"];
  if (item.themes && Array.isArray(item.themes)) {
    for (const theme of item.themes) {
      if (typeof theme === "string") {
        tags.push(theme);
      } else if (theme && typeof theme === "object" && theme.name) {
        tags.push(theme.name);
      }
    }
  }

  // Prize pool
  let prizePool: string | null = null;
  if (item.prizes && Array.isArray(item.prizes) && item.prizes.length > 0) {
    const total = item.prizes.reduce((sum, p) => sum + (p.amount || 0), 0);
    if (total > 0) {
      const currency = item.prizes[0]?.currency || "USD";
      prizePool = `${currency} ${total.toLocaleString()}`;
    }
  }

  return {
    title: item.name,
    description,
    coverImage,
    category: "hackathon",
    source: "devfolio",
    sourceUrl,
    startDate,
    endDate,
    registrationDeadline,
    rawLocation,
    venue: isOnline ? "Online" : rawLocation,
    isOnline,
    tags,
    prizePool,
    organizerName: item.organizer?.name || null,
    registrationType: "external",
    registrationUrl: item.apply_url || sourceUrl,
  };
}

/**
 * Devfolio Scraper.
 * Pulls open and upcoming hackathons with Pakistan queries and city targets.
 */
export async function scrapeDevfolio(): Promise<ScraperResult> {
  const errors: string[] = [];
  const eventsMap = new Map<string, ScrapedEventInput>();

  const queries = PAKISTAN_SEARCH_QUERIES;

  const types = ["application_open", "upcoming"];

  for (const query of queries) {
    for (const type of types) {
      try {
        const items = await fetchDevfolioApi(query, type);
        for (const item of items) {
          const { isRelevant, isOnline, rawLocation } = isRelevantToPakistan(item);
          if (isRelevant) {
            const mapped = mapDevfolioToScrapedInput(item, rawLocation, isOnline);
            if (mapped && !eventsMap.has(mapped.sourceUrl)) {
              eventsMap.set(mapped.sourceUrl, mapped);
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Error fetching Devfolio (q: "${query}", type: "${type}"): ${msg}`);
      }
    }
  }

  return {
    source: "devfolio",
    events: Array.from(eventsMap.values()),
    errors: errors.length > 0 ? errors : undefined,
  };
}
