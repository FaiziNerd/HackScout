import { load } from "cheerio";

import type { ScrapedEventInput, ScraperResult } from "./types";

const TALENTSHOWCASE_URL = "https://www.talentshowcase.pk";
const API_URL =
  process.env.TALENTSHOWCASE_API_URL ??
  "https://bbrlvbmzrsepzoyodiqe.supabase.co/rest/v1";

// This is TalentShowcase's public, browser-side Supabase anon key. It may be
// overridden without a code change if the site rotates its public client key.
const API_KEY =
  process.env.TALENTSHOWCASE_API_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJicmx2Ym16cnNlcHpveW9kaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwODgwMTIsImV4cCI6MjA4NDY2NDAxMn0.ZKP9w_swl0cy_kyAaAKu_CcAXxlKPaV1QobAGaD9qbA";

const EVENT_TYPES = [
  "hackathon",
  "competition",
  "workshop",
  "event",
  "conference",
  "meetup",
  "seminar",
  "career_fair",
  "festival",
] as const;

interface TalentShowcaseRecord {
  id?: string;
  slug?: string;
  title?: string;
  short_description?: string | null;
  summary?: string | null;
  description?: string | null;
  type?: string | null;
  category?: string | null;
  organization_name?: string | null;
  organizer_name?: string | null;
  country?: string | null;
  location?: string | null;
  is_online?: boolean | null;
  geo_eligibility?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  deadline?: string | null;
  registration_deadline?: string | null;
  submission_deadline?: string | null;
  published_date?: string | null;
  created_at?: string | null;
  apply_url?: string | null;
  registration_link?: string | null;
  website_link?: string | null;
  image_url?: string | null;
  cover_image?: string | null;
  prize_amount?: number | string | null;
  prize_currency?: string | null;
  tags?: string[] | null;
  skills?: string[] | null;
}

function cleanText(value?: string | null): string {
  if (!value) return "";

  // Some imported records contain entity-escaped HTML, so decode before
  // stripping markup.
  const decoded = load(value).text();
  return load(decoded).text().replace(/\s+/g, " ").trim();
}

function validDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mapCategory(record: TalentShowcaseRecord): ScrapedEventInput["category"] {
  const value = `${record.type ?? ""} ${record.category ?? ""} ${record.title ?? ""}`.toLowerCase();

  if (/hackathon|hack day|codefest/.test(value)) return "hackathon";
  if (/conference|summit|congress|convention/.test(value)) return "conference";
  if (/workshop|bootcamp|training/.test(value)) return "workshop";
  if (/meetup|networking/.test(value)) return "meetup";
  if (/seminar|webinar|talk/.test(value)) return "seminar";
  if (/career.?fair|job.?fair/.test(value)) return "career_fair";
  if (/festival|fest|expo/.test(value)) return "festival";
  if (/competition|challenge|contest|olympiad|pitch/.test(value)) return "competition";
  return "other";
}

function isRelevant(record: TalentShowcaseRecord): boolean {
  const location = record.location ?? "";
  const country = record.country ?? "";
  const eligibility = record.geo_eligibility ?? "";
  const text = `${location} ${country} ${eligibility}`.toLowerCase();

  return (
    record.is_online === true ||
    /online|virtual|remote|pakistan|open_to_pakistan/.test(text) ||
    /karachi|lahore|islamabad|rawalpindi|faisalabad|multan|peshawar|quetta|hyderabad|sialkot|gujranwala|abbottabad|bahawalpur|sargodha|sukkur|mardan|mirpur|gilgit/.test(
      text
    )
  );
}

function isEventRecord(
  record: TalentShowcaseRecord,
  table: "listings" | "opportunities"
): boolean {
  const value = (table === "listings" ? record.category : record.type)
    ?.toLowerCase()
    .replace(/[\s-]+/g, "_");

  return EVENT_TYPES.some((type) => type === value);
}

function mapRecord(
  record: TalentShowcaseRecord,
  table: "listings" | "opportunities"
): ScrapedEventInput | null {
  if (!record.title || (!record.id && !record.slug)) return null;

  const startDate =
    validDate(record.start_date) ??
    validDate(record.registration_deadline) ??
    validDate(record.deadline) ??
    validDate(record.published_date) ??
    validDate(record.created_at);
  if (!startDate) return null;

  const location = record.location?.trim() || (record.is_online ? "Online" : "Pakistan");
  const isOnline =
    record.is_online === true || /online|virtual|remote/i.test(location);
  const identifier = record.slug ?? record.id;
  const sourceUrl =
    table === "opportunities"
      ? `${TALENTSHOWCASE_URL}/opportunities/${identifier}`
      : `${TALENTSHOWCASE_URL}/competitions/${record.id ?? identifier}`;
  const registrationUrl =
    record.apply_url ??
    record.registration_link ??
    record.website_link ??
    sourceUrl;
  const description =
    cleanText(record.description) ||
    cleanText(record.summary) ||
    cleanText(record.short_description) ||
    record.title;
  const rawTags = [...(record.tags ?? []), ...(record.skills ?? [])];
  const tags = Array.from(
    new Set([
      "talentshowcase",
      mapCategory(record),
      ...rawTags.map((tag) => cleanText(tag).toLowerCase()).filter(Boolean),
    ])
  );
  const prize =
    record.prize_amount != null && String(record.prize_amount).trim()
      ? `${record.prize_currency ?? "PKR"} ${Number(record.prize_amount).toLocaleString("en-PK")}`
      : null;

  return {
    title: cleanText(record.title),
    description,
    coverImage: record.image_url ?? record.cover_image ?? null,
    category: mapCategory(record),
    source: "talentshowcase",
    sourceUrl,
    startDate,
    endDate: validDate(record.end_date),
    registrationDeadline:
      validDate(record.registration_deadline) ??
      validDate(record.submission_deadline) ??
      validDate(record.deadline),
    rawLocation: isOnline ? "Online" : location,
    venue: isOnline ? "Online" : location,
    isOnline,
    tags,
    prizePool: prize,
    organizerName: record.organization_name ?? record.organizer_name ?? null,
    registrationType: "external",
    registrationUrl,
  };
}

async function fetchTable(
  table: "listings" | "opportunities"
): Promise<TalentShowcaseRecord[]> {
  const url = new URL(`${API_URL}/${table}`);
  url.searchParams.set("select", "*");
  url.searchParams.set("status", "eq.published");
  url.searchParams.set("limit", "1000");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      apikey: API_KEY,
      Authorization: `Bearer ${API_KEY}`,
      "User-Agent": "HackScout-Bot/1.0 (+https://hackscout.pk)",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    const detail = cleanText(await response.text());
    throw new Error(
      `${response.status} ${response.statusText}${detail ? `: ${detail}` : ""}`
    );
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("TalentShowcase returned a non-array response");
  }
  return data as TalentShowcaseRecord[];
}

/**
 * Pulls TalentShowcase's published event-like listings from its public data
 * API and normalizes them into HackScout's shared scraper shape.
 */
export async function scrapeTalentShowcase(): Promise<ScraperResult> {
  const errors: string[] = [];
  const events = new Map<string, ScrapedEventInput>();

  const results = await Promise.allSettled([
    fetchTable("listings"),
    fetchTable("opportunities"),
  ]);

  results.forEach((result, index) => {
    const table = index === 0 ? "listings" : "opportunities";
    if (result.status === "rejected") {
      const message =
        result.reason instanceof Error ? result.reason.message : String(result.reason);
      errors.push(`Error fetching TalentShowcase ${table}: ${message}`);
      return;
    }

    for (const record of result.value) {
      if (!isEventRecord(record, table) || !isRelevant(record)) continue;
      const mapped = mapRecord(record, table);
      if (mapped) events.set(mapped.sourceUrl, mapped);
    }
  });

  return {
    source: "talentshowcase",
    events: Array.from(events.values()),
    errors: errors.length ? errors : undefined,
  };
}
