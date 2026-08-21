import type { ScrapedEventInput, ScraperResult } from "./types";
import { normalizeCity } from "@/lib/cities";
import { PAKISTAN_SEARCH_QUERIES } from "./queries";

interface DevpostHackathonItem {
  id?: number | string;
  title?: string;
  tagline?: string;
  description?: string;
  thumbnail_url?: string;
  url?: string;
  time_left_to_submission?: string;
  submission_period_dates?: string;
  start_a_submission_url?: string;
  displayed_location?: {
    location?: string;
    icon?: string;
  } | string;
  open_state?: string;
  prize_amount?: string;
  registrations_count?: number;
  featured?: boolean;
  themes?: Array<{ id?: number; name?: string; slug?: string } | string>;
  managed_by_devpost?: boolean;
  organization_name?: string;
  winners_announced?: boolean;
}

interface DevpostApiResponse {
  hackathons?: DevpostHackathonItem[];
  meta?: {
    total_count?: number;
    per_page?: number;
  };
}

/**
 * Searches Devpost public hackathons API.
 * Devpost provides an open endpoint at https://devpost.com/api/hackathons
 * query parameters supported: search, status (upcoming, open, ended), challenge_type (online, in-person), sort_by
 */
async function fetchDevpostApi(
  searchQuery?: string,
  status: "open" | "upcoming" = "open",
  challengeType?: "online" | "in-person"
): Promise<DevpostHackathonItem[]> {
  const url = new URL("https://devpost.com/api/hackathons");
  if (searchQuery) {
    url.searchParams.set("search", searchQuery);
  }
  url.searchParams.set("status", status);
  if (challengeType) {
    url.searchParams.set("challenge_type[]", challengeType);
  }
  url.searchParams.set("sort_by", "submission_deadline");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "HackScout-Bot/1.0 (+https://hackscout.pk)",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as DevpostApiResponse;
    if (data && Array.isArray(data.hackathons)) {
      return data.hackathons;
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Extracts raw location string from Devpost displayed_location attribute.
 */
function extractLocationString(displayedLocation: DevpostHackathonItem["displayed_location"]): string {
  if (!displayedLocation) return "";
  if (typeof displayedLocation === "string") return displayedLocation;
  if (typeof displayedLocation === "object" && displayedLocation.location) {
    return displayedLocation.location;
  }
  return "";
}

/**
 * Parses Devpost date range string such as "Mar 15 - 17, 2026" or "Aug 20 - Sep 15, 2026"
 */
function parseDevpostDates(dateStr?: string): { startDate: Date; endDate: Date | null } {
  const now = new Date();
  if (!dateStr || !dateStr.trim()) {
    return { startDate: now, endDate: null };
  }

  try {
    const parts = dateStr.split("-").map((s) => s.trim());
    if (parts.length === 1) {
      const parsed = new Date(parts[0]);
      return {
        startDate: !isNaN(parsed.getTime()) ? parsed : now,
        endDate: null,
      };
    }

    // Handles formats like "Mar 15 - 17, 2026" or "Aug 20 - Sep 15, 2026"
    const endStr = parts[1];
    const parsedEnd = new Date(endStr);

    let parsedStart: Date;
    if (parts[0].match(/\d{4}$/)) {
      parsedStart = new Date(parts[0]);
    } else {
      // Extract year from end string if available
      const yearMatch = endStr.match(/\d{4}/);
      const year = yearMatch ? yearMatch[0] : String(now.getFullYear());
      parsedStart = new Date(`${parts[0]}, ${year}`);
    }

    return {
      startDate: !isNaN(parsedStart.getTime()) ? parsedStart : now,
      endDate: !isNaN(parsedEnd.getTime()) ? parsedEnd : null,
    };
  } catch {
    return { startDate: now, endDate: null };
  }
}

/**
 * Checks if a Devpost hackathon is relevant to Pakistan or open online globally.
 */
function isRelevantToPakistan(item: DevpostHackathonItem): {
  isRelevant: boolean;
  isOnline: boolean;
  rawLocation: string;
} {
  const locationStr = extractLocationString(item.displayed_location).trim();
  const titleAndDesc = `${item.title || ""} ${item.tagline || ""} ${item.description || ""}`.toLowerCase();

  const cityMatch = normalizeCity(locationStr);
  const isOnline = Boolean(
    cityMatch.slug === "online" ||
    /online|virtual|remote|global/i.test(locationStr)
  );

  // Directly matched a Pakistan city (other than online fallback)
  if (cityMatch.matched && cityMatch.slug !== "online") {
    return { isRelevant: true, isOnline, rawLocation: locationStr };
  }

  // Explicit mention of Pakistan or major Pakistani institutions
  if (
    /pakistan|karachi|lahore|islamabad|rawalpindi|faisalabad|multan|peshawar|quetta|hyderabad|giki|nust|fast|lums/i.test(
      locationStr
    ) ||
    /pakistan/i.test(titleAndDesc)
  ) {
    return { isRelevant: true, isOnline, rawLocation: locationStr || "Pakistan" };
  }

  // Online hackathons open globally
  if (isOnline) {
    return { isRelevant: true, isOnline: true, rawLocation: "Online" };
  }

  return { isRelevant: false, isOnline, rawLocation: locationStr };
}

/**
 * Converts a raw Devpost hackathon into standard ScrapedEventInput
 */
function mapDevpostToScrapedInput(
  item: DevpostHackathonItem,
  rawLocation: string,
  isOnline: boolean
): ScrapedEventInput | null {
  if (!item.title || !item.url) {
    return null;
  }

  const { startDate, endDate } = parseDevpostDates(item.submission_period_dates);
  const description = item.tagline || item.description || item.title;
  const coverImage = item.thumbnail_url?.startsWith("//")
    ? `https:${item.thumbnail_url}`
    : item.thumbnail_url || null;

  // Extract tags / themes
  const tags: string[] = ["devpost", "hackathon"];
  if (item.themes && Array.isArray(item.themes)) {
    for (const theme of item.themes) {
      if (typeof theme === "string") {
        tags.push(theme);
      } else if (theme && typeof theme === "object" && theme.name) {
        tags.push(theme.name);
      }
    }
  }

  // Prize pool format (e.g. "$10,000 in prizes")
  const prizePool = item.prize_amount && item.prize_amount.trim() ? item.prize_amount.trim() : null;

  return {
    title: item.title,
    description,
    coverImage,
    category: "hackathon",
    source: "devpost",
    sourceUrl: item.url,
    startDate,
    endDate,
    registrationDeadline: endDate, // Devpost hackathon submission end acts as deadline
    rawLocation,
    venue: isOnline ? "Online" : rawLocation,
    isOnline,
    tags,
    prizePool,
    organizerName: item.organization_name || null,
    registrationType: "external",
    registrationUrl: item.start_a_submission_url || item.url,
  };
}

/**
 * Devpost Scraper.
 * Fetches open and upcoming hackathons with Pakistan queries and global online filters.
 */
export async function scrapeDevpost(): Promise<ScraperResult> {
  const errors: string[] = [];
  const eventsMap = new Map<string, ScrapedEventInput>();

  const queries = PAKISTAN_SEARCH_QUERIES;

  const statuses: Array<"open" | "upcoming"> = ["open", "upcoming"];

  for (const query of queries) {
    for (const status of statuses) {
      try {
        const items = await fetchDevpostApi(query, status);
        for (const item of items) {
          const { isRelevant, isOnline, rawLocation } = isRelevantToPakistan(item);
          if (isRelevant) {
            const mapped = mapDevpostToScrapedInput(item, rawLocation, isOnline);
            if (mapped && !eventsMap.has(mapped.sourceUrl)) {
              eventsMap.set(mapped.sourceUrl, mapped);
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Error fetching Devpost (query: "${query}", status: "${status}"): ${msg}`);
      }
    }
  }

  return {
    source: "devpost",
    events: Array.from(eventsMap.values()),
    errors: errors.length > 0 ? errors : undefined,
  };
}
