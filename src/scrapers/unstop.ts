import { load } from "cheerio";

import { normalizeCity, PAKISTAN_CITIES } from "@/lib/cities";
import { FOCUSED_PAKISTAN_SEARCH_QUERIES } from "./queries";
import type { ScrapedEventInput, ScraperResult } from "./types";

const UNSTOP_API_URL = "https://unstop.com/api/public/opportunity/search-result";
const UNSTOP_ORIGIN = "https://unstop.com";
const MAX_PAGES = Number(process.env.UNSTOP_PAGE_LIMIT ?? 4);
const PER_PAGE = Number(process.env.UNSTOP_PER_PAGE ?? 50);

const OPPORTUNITY_TYPES = ["hackathons", "competitions", "workshops", "conferences"] as const;
const PRIMARY_TYPES = new Set(["hackathons", "competitions"]);

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

const CURRENCY_SYMBOLS: Record<string, string> = {
  "fa-rupee": "₹",
  "fa-inr": "₹",
  inr: "₹",
  "fa-dollar": "$",
  "fa-usd": "$",
  usd: "$",
  "fa-euro": "€",
  "fa-eur": "€",
  eur: "€",
  "fa-pound": "£",
  gbp: "£",
};

interface UnstopOrganisation {
  name?: string | null;
  logoUrl?: string | null;
  logoUrl2?: string | null;
  public_url?: string | null;
}

interface UnstopLocation {
  city?: string | null;
  name?: string | null;
  state?: string | null;
  country?: string | null;
}

interface UnstopAddress {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | { name?: string | null; code?: string | null } | null;
  country_code?: string | null;
}

interface UnstopPrize {
  rank?: string | null;
  cash?: number | string | null;
  max_cash?: number | string | null;
  currency?: string | null;
  others?: string | null;
}

interface UnstopFilter {
  name?: string | null;
  type?: string | null;
}

interface UnstopSkill {
  skill?: string | null;
  skill_name?: string | null;
}

interface UnstopRegistration {
  start_regn_dt?: string | null;
  end_regn_dt?: string | null;
  remain_days?: string | null;
  remaining_time?: number | string | null;
  eligibility?: string | Record<string, unknown> | null;
}

interface UnstopBanner {
  image_url?: string | null;
}

interface UnstopOpportunity {
  id?: number | string;
  title?: string | null;
  type?: string | null;
  subtype?: string | null;
  status?: string | null;
  region?: string | null;
  details?: string | null;
  seo_url?: string | null;
  public_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  logoUrl2?: string | null;
  thumb?: string | null;
  banner_mobile?: UnstopBanner | null;
  banner_desktop?: UnstopBanner | null;
  organisation?: UnstopOrganisation | null;
  locations?: UnstopLocation[] | null;
  address_with_country_logo?: UnstopAddress | null;
  prizes?: UnstopPrize[] | null;
  filters?: UnstopFilter[] | null;
  required_skills?: UnstopSkill[] | null;
  workfunction?: Array<{ name?: string | null }> | null;
  regnRequirements?: UnstopRegistration | null;
  regn_open?: number | boolean | null;
}

interface UnstopSearchPayload {
  data?: UnstopOpportunity[] | {
    data?: UnstopOpportunity[];
    current_page?: number;
    last_page?: number;
    total?: number;
    per_page?: number;
  };
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

function countryFromAddress(address?: UnstopAddress | null): string {
  if (!address) return "";
  if (typeof address.country === "string") return address.country;
  return address.country?.name ?? address.country?.code ?? address.country_code ?? "";
}

function locationFromItem(item: UnstopOpportunity): string {
  const locations = (item.locations ?? [])
    .map((location) => [location.city, location.name, location.state, location.country].filter(Boolean).join(", "))
    .filter(Boolean);
  if (locations.length) return locations.slice(0, 3).join("; ");

  const address = item.address_with_country_logo;
  if (address) {
    const parts = [
      address.address,
      address.city,
      address.state,
      countryFromAddress(address),
    ].filter(Boolean);
    if (parts.length) return parts.join(", ");
  }

  const region = (item.region ?? "").trim();
  return /^online|hybrid$/i.test(region) ? "" : region;
}

function eligibilityText(item: UnstopOpportunity): string {
  const eligibility = item.regnRequirements?.eligibility;
  if (!eligibility) return "";
  if (typeof eligibility === "string") return eligibility;
  try {
    return JSON.stringify(eligibility);
  } catch {
    return "";
  }
}

function isOnlineItem(item: UnstopOpportunity, rawLocation: string): boolean {
  const region = (item.region ?? "").toLowerCase();
  if (region === "online" || region === "hybrid") return true;
  return /online|virtual|remote|hybrid/i.test(`${rawLocation} ${item.subtype ?? ""} ${item.title ?? ""}`);
}

function isRelevantToPakistan(item: UnstopOpportunity): {
  isRelevant: boolean;
  rawLocation: string;
  isOnline: boolean;
} {
  const rawLocation = locationFromItem(item);
  const isOnline = isOnlineItem(item, rawLocation);
  const country = countryFromAddress(item.address_with_country_logo);
  const cityMatch = normalizeCity(rawLocation);
  const searchable = [
    item.title,
    item.details,
    rawLocation,
    country,
    item.organisation?.name,
    eligibilityText(item),
    ...(item.filters ?? []).map((filter) => filter.name),
  ]
    .filter(Boolean)
    .join(" ");

  if (/^pk$|^pakistan$/i.test(country.trim())) {
    return { isRelevant: true, rawLocation: rawLocation || "Pakistan", isOnline };
  }

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

function mapCategory(item: UnstopOpportunity): ScrapedEventInput["category"] {
  const value = `${item.type ?? ""} ${item.subtype ?? ""} ${item.title ?? ""}`.toLowerCase();

  if (/hackathon|hack day|codefest|buildathon/.test(value) || item.type === "hackathons") {
    return "hackathon";
  }
  if (/conference|summit|congress|convention/.test(value) || item.type === "conferences") {
    return "conference";
  }
  if (/workshop|bootcamp|training|masterclass/.test(value) || item.type === "workshops") {
    return "workshop";
  }
  if (/meetup|mixer|networking/.test(value)) return "meetup";
  if (/seminar|webinar|talk|lecture|panel/.test(value)) return "seminar";
  if (/career.?fair|job.?fair/.test(value)) return "career_fair";
  if (/festival|fest|expo/.test(value)) return "festival";
  if (/competition|challenge|contest|quiz|case.?study|pitch/.test(value) || item.type === "competitions") {
    return "competition";
  }
  return "other";
}

function prizePoolFromItem(item: UnstopOpportunity): string | null {
  const prizes = item.prizes ?? [];
  if (!prizes.length) return null;

  let total = 0;
  let symbol = "";
  const extras: string[] = [];

  for (const prize of prizes) {
    const cash = Number(prize.cash ?? prize.max_cash ?? 0);
    if (Number.isFinite(cash) && cash > 0) {
      total += cash;
      symbol ||= CURRENCY_SYMBOLS[(prize.currency ?? "").toLowerCase()] ?? prize.currency ?? "";
    } else if (prize.others) {
      extras.push(cleanText(prize.others));
    } else if (prize.rank) {
      extras.push(cleanText(prize.rank));
    }
  }

  if (total > 0) {
    return `${symbol}${total.toLocaleString()}`.trim();
  }
  return extras.filter(Boolean).slice(0, 3).join("; ") || null;
}

function sourceUrlFromItem(item: UnstopOpportunity): string | null {
  if (item.seo_url) {
    return item.seo_url.startsWith("http") ? item.seo_url : `${UNSTOP_ORIGIN}/${item.seo_url.replace(/^\/+/, "")}`;
  }
  if (item.public_url) {
    return item.public_url.startsWith("http")
      ? item.public_url
      : `${UNSTOP_ORIGIN}/${item.public_url.replace(/^\/+/, "")}`;
  }
  if (item.id && item.type) {
    return `${UNSTOP_ORIGIN}/${item.type}/${item.id}`;
  }
  return null;
}

function coverImageFromItem(item: UnstopOpportunity): string | null {
  return (
    item.banner_desktop?.image_url ||
    item.banner_mobile?.image_url ||
    item.logoUrl2 ||
    item.thumb ||
    item.organisation?.logoUrl2 ||
    item.organisation?.logoUrl ||
    null
  );
}

function tagsForItem(item: UnstopOpportunity, category: ScrapedEventInput["category"]): string[] {
  const raw = [
    "unstop",
    category,
    item.type,
    item.subtype,
    item.region,
    ...(item.workfunction ?? []).map((fn) => fn.name),
    ...(item.required_skills ?? []).map((skill) => skill.skill_name || skill.skill),
    ...(item.filters ?? [])
      .filter((filter) => filter.type === "eligible")
      .map((filter) => filter.name),
  ];

  return Array.from(new Set(raw.map((tag) => cleanText(tag).toLowerCase()).filter(Boolean)));
}

function mapUnstopToScrapedInput(item: UnstopOpportunity): ScrapedEventInput | null {
  const title = cleanText(item.title);
  const sourceUrl = sourceUrlFromItem(item);
  const startDate =
    validDate(item.start_date) ??
    validDate(item.regnRequirements?.start_regn_dt) ??
    validDate(item.end_date) ??
    validDate(item.regnRequirements?.end_regn_dt);
  if (!title || !sourceUrl || !startDate) return null;

  const { isRelevant, rawLocation, isOnline } = isRelevantToPakistan(item);
  if (!isRelevant) return null;

  const category = mapCategory(item);
  const description = cleanText(item.details) || title;

  return {
    title,
    description,
    coverImage: coverImageFromItem(item),
    category,
    source: "unstop",
    sourceUrl,
    startDate,
    endDate: validDate(item.end_date),
    registrationDeadline:
      validDate(item.regnRequirements?.end_regn_dt) ?? validDate(item.end_date),
    rawLocation: rawLocation || (isOnline ? "Online" : "Pakistan"),
    venue: isOnline ? "Online" : rawLocation || null,
    isOnline,
    tags: tagsForItem(item, category),
    prizePool: prizePoolFromItem(item),
    organizerName: cleanText(item.organisation?.name) || null,
    registrationType: "external",
    registrationUrl: sourceUrl,
  };
}

function parseSearchPayload(payload: UnstopSearchPayload): {
  items: UnstopOpportunity[];
  lastPage: number;
} {
  const data = payload.data;
  if (Array.isArray(data)) {
    return { items: data, lastPage: 1 };
  }
  if (data && Array.isArray(data.data)) {
    return { items: data.data, lastPage: Number(data.last_page) || 1 };
  }
  return { items: [], lastPage: 1 };
}

async function fetchUnstopPage(params: {
  opportunity: string;
  oppstatus: string;
  page: number;
  searchTerm?: string;
  region?: string;
}): Promise<{ items: UnstopOpportunity[]; lastPage: number }> {
  const url = new URL(UNSTOP_API_URL);
  url.searchParams.set("opportunity", params.opportunity);
  url.searchParams.set("oppstatus", params.oppstatus);
  url.searchParams.set("page", String(params.page));
  url.searchParams.set("per_page", String(PER_PAGE));
  if (params.searchTerm) url.searchParams.set("searchTerm", params.searchTerm);
  if (params.region) url.searchParams.set("region", params.region);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/plain, */*",
      Referer: `${UNSTOP_ORIGIN}/${params.opportunity}`,
      "User-Agent": "HackScout-Bot/1.0 (+https://hackscout.pk)",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as UnstopSearchPayload;
  return parseSearchPayload(payload);
}

async function collectUnstopPages(
  params: Omit<Parameters<typeof fetchUnstopPage>[0], "page">,
  errors: string[]
): Promise<UnstopOpportunity[]> {
  const items: UnstopOpportunity[] = [];
  let lastPage = 1;

  for (let page = 1; page <= Math.max(1, MAX_PAGES); page++) {
    try {
      const result = await fetchUnstopPage({ ...params, page });
      items.push(...result.items);
      lastPage = result.lastPage;
      if (page >= lastPage || result.items.length === 0) break;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const label = [
        params.opportunity,
        params.searchTerm && `q=${params.searchTerm}`,
        params.region && `region=${params.region}`,
        `page=${page}`,
      ]
        .filter(Boolean)
        .join(" ");
      errors.push(`Error fetching Unstop (${label}): ${message}`);
      break;
    }
  }

  return items;
}

/**
 * Unstop scraper.
 * Uses Unstop's public opportunity search API for open hackathons, competitions,
 * workshops, and conferences. Keeps Pakistan-located listings plus online events
 * that Pakistan students can join.
 */
export async function scrapeUnstop(): Promise<ScraperResult> {
  const errors: string[] = [];
  const events = new Map<string, ScrapedEventInput>();

  const queries = FOCUSED_PAKISTAN_SEARCH_QUERIES;

  for (const opportunity of OPPORTUNITY_TYPES) {
    const searchQueries = PRIMARY_TYPES.has(opportunity) ? queries : ["Pakistan"];

    for (const searchTerm of searchQueries) {
      const items = await collectUnstopPages(
        { opportunity, oppstatus: "open", searchTerm },
        errors
      );
      for (const item of items) {
        const mapped = mapUnstopToScrapedInput(item);
        if (mapped) events.set(mapped.sourceUrl, mapped);
      }
    }

    const onlineItems = await collectUnstopPages(
      { opportunity, oppstatus: "open", region: "online" },
      errors
    );
    for (const item of onlineItems) {
      const mapped = mapUnstopToScrapedInput(item);
      if (mapped) events.set(mapped.sourceUrl, mapped);
    }
  }

  return {
    source: "unstop",
    events: Array.from(events.values()),
    errors: errors.length ? errors : undefined,
  };
}
