import https from "node:https";
import { load } from "cheerio";

import type { ScrapedEventInput } from "../types";

export const SCRAPER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 HackScout-Bot/1.0 (+https://hackscout.pk)";

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const MONTH_PATTERN =
  "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept?|oct|nov|dec";

const EVENT_SIGNAL =
  /hackathon|hack day|codefest|buildathon|conference|summit|congress|symposium|workshop|bootcamp|training|masterclass|meetup|mixer|networking|seminar|webinar|talk|lecture|panel|career.?fair|job.?fair|recruitment|festival|fest\b|expo|competition|challenge|contest|pitch|olympiad|open house|convocation|orientation|homecoming|exhibition|info(?:rmation)? session|guest speaker/i;

const NOISE_SIGNAL =
  /\b(tender|rfq|procurement notice|job posting|research assistant hiring|admissions open|congratulat(?:es|ions)?|wins? (?:the |grand )?prize|selected for|obituary|closed for|university ranking|qs ranking)\b/i;

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export function splitEnvList(value?: string): string[] {
  if (!value) return [];
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function cleanText(value?: string | null): string {
  if (!value) return "";
  return load(value).text().replace(/\s+/g, " ").trim();
}

export function validDate(value?: string | number | null): Date | null {
  if (value == null || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function dateFromDayMonth(day: number, monthName: string, now = new Date()): Date | null {
  const month = MONTH_INDEX[monthName.toLowerCase().slice(0, 3)] ?? MONTH_INDEX[monthName.toLowerCase()];
  if (month == null || !day) return null;

  const currentYear = now.getFullYear();
  let date = karachiDate(currentYear, month, day);
  if (date && date.getTime() < now.getTime() - 180 * 24 * 60 * 60 * 1000) {
    date = karachiDate(currentYear + 1, month, day);
  }
  return date;
}

export function karachiDate(year: number, monthIndex: number, day: number): Date | null {
  if (!year || monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return null;
  const iso = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+05:00`;
  return validDate(iso);
}

export function parseYyyymmdd(value?: string | null): Date | null {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!match) return null;
  return karachiDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function parseFlexibleDate(value?: string | null): Date | null {
  if (!value) return null;
  const trimmed = cleanText(value);
  if (!trimmed) return null;

  const yyyymmdd = parseYyyymmdd(trimmed);
  if (yyyymmdd) return yyyymmdd;

  const iso = validDate(trimmed);
  if (iso) return iso;

  const dmy = trimmed.match(/^(\d{1,2})[/.\\-](\d{1,2})[/.\\-](\d{4})$/);
  if (dmy) {
    return karachiDate(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  }

  const monthName = trimmed.match(
    new RegExp(`^(?:\\w+,\\s*)?(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})$`, "i")
  );
  if (monthName) {
    const month = MONTH_INDEX[monthName[1].toLowerCase()];
    return karachiDate(Number(monthName[3]), month, Number(monthName[2]));
  }

  return null;
}

export function parseDateRangeFromText(text: string): { start: Date | null; end: Date | null } {
  const value = cleanText(text);
  if (!value) return { start: null, end: null };

  const isoDates = Array.from(value.matchAll(/\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})?)?/g))
    .map((match) => validDate(match[0]))
    .filter((date): date is Date => Boolean(date));
  if (isoDates.length) {
    return { start: isoDates[0], end: isoDates[1] ?? null };
  }

  const sameMonthRange = value.match(
    new RegExp(`(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s*[-–]\\s*(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})`, "i")
  );
  if (sameMonthRange) {
    const month = MONTH_INDEX[sameMonthRange[1].toLowerCase()];
    return {
      start: karachiDate(Number(sameMonthRange[4]), month, Number(sameMonthRange[2])),
      end: karachiDate(Number(sameMonthRange[4]), month, Number(sameMonthRange[3])),
    };
  }

  const twoMonthRange = value.match(
    new RegExp(
      `(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s*[-–]\\s*(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})`,
      "i"
    )
  );
  if (twoMonthRange) {
    const startMonth = MONTH_INDEX[twoMonthRange[1].toLowerCase()];
    const endMonth = MONTH_INDEX[twoMonthRange[3].toLowerCase()];
    return {
      start: karachiDate(Number(twoMonthRange[5]), startMonth, Number(twoMonthRange[2])),
      end: karachiDate(Number(twoMonthRange[5]), endMonth, Number(twoMonthRange[4])),
    };
  }

  const namedDates = Array.from(
    value.matchAll(
      new RegExp(`(?:\\w+,\\s*)?(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})`, "gi")
    )
  )
    .map((match) => karachiDate(Number(match[3]), MONTH_INDEX[match[1].toLowerCase()], Number(match[2])))
    .filter((date): date is Date => Boolean(date));
  if (namedDates.length) {
    return { start: namedDates[0], end: namedDates[1] ?? null };
  }

  const numericDates = Array.from(value.matchAll(/\b(\d{1,2})[/.\\-](\d{1,2})[/.\\-](\d{4})\b/g))
    .map((match) => karachiDate(Number(match[3]), Number(match[2]) - 1, Number(match[1])))
    .filter((date): date is Date => Boolean(date));
  if (numericDates.length) {
    return { start: numericDates[0], end: numericDates[1] ?? null };
  }

  return { start: parseFlexibleDate(value), end: null };
}

export function isOnlineText(...parts: Array<string | null | undefined>): boolean {
  return /online|virtual|remote|webinar|zoom|google meet|microsoft teams|facebook page/i.test(
    parts.filter(Boolean).join(" ")
  );
}

export function mapEventCategory(text: string): ScrapedEventInput["category"] {
  const value = text.toLowerCase();

  if (/hackathon|hack day|codefest|buildathon/.test(value)) return "hackathon";
  if (/conference|summit|congress|convention|symposium/.test(value)) return "conference";
  if (/workshop|bootcamp|training|masterclass/.test(value)) return "workshop";
  if (/meetup|mixer|networking|community/.test(value)) return "meetup";
  if (/seminar|webinar|talk|lecture|panel|info(?:rmation)? session/.test(value)) return "seminar";
  if (/career.?fair|job.?fair|recruitment/.test(value)) return "career_fair";
  if (/festival|fest\b|expo/.test(value)) return "festival";
  if (/competition|challenge|contest|pitch|olympiad/.test(value)) return "competition";
  return "other";
}

export function looksLikeNoise(text: string): boolean {
  return NOISE_SIGNAL.test(text) && !EVENT_SIGNAL.test(text);
}

export function looksLikeEvent(text: string): boolean {
  return EVENT_SIGNAL.test(text);
}

export function isStillRelevant(startDate: Date | null, endDate?: Date | null, deadline?: Date | null): boolean {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  if (deadline && deadline.getTime() >= cutoff) return true;
  if (endDate && endDate.getTime() >= cutoff) return true;
  if (startDate && startDate.getTime() >= cutoff) return true;
  return false;
}

export function absoluteUrl(href: string | undefined | null, base: string): string | null {
  if (!href) return null;
  try {
    const url = new URL(href, base);
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function firstRegistrationUrl(htmlOrText: string, fallback: string): string {
  const urls = Array.from(
    htmlOrText.matchAll(/https?:\/\/[^\s"'<>]+/gi),
    (match) => match[0].replace(/[).,;]+$/, "")
  );

  const preferred = urls.find((url) =>
    /forms\.gle|docs\.google\.com\/forms|forms\.cloud\.microsoft|forms\.office\.com|register|signup|apply/i.test(url)
  );
  return preferred || fallback;
}

interface FetchPageOptions {
  accept?: string;
  referer?: string;
  allowInsecureTls?: boolean;
  timeoutMs?: number;
}

function requestHeaders(url: string, accept: string, referer?: string): Record<string, string> {
  return {
    Accept: accept,
    "Accept-Language": "en-US,en;q=0.9",
    "User-Agent": SCRAPER_USER_AGENT,
    Referer: referer ?? new URL(url).origin + "/",
  };
}

function fetchViaNodeHttps(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
  rejectUnauthorized: boolean
): Promise<{
  status: number;
  statusText: string;
  body: string;
  headers: Headers;
}> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers, rejectUnauthorized, timeout: timeoutMs }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk as Buffer));
      res.on("end", () => {
        const rawHeaders = new Headers();
        for (const [key, value] of Object.entries(res.headers)) {
          if (typeof value === "string") rawHeaders.set(key, value);
          else if (Array.isArray(value)) rawHeaders.set(key, value.join(", "));
        }
        resolve({
          status: res.statusCode ?? 0,
          statusText: res.statusMessage ?? "",
          body: Buffer.concat(chunks).toString("utf8"),
          headers: rawHeaders,
        });
      });
    });
    req.on("timeout", () => req.destroy(new Error("Request timed out")));
    req.on("error", reject);
  });
}

async function fetchPage(url: string, options: FetchPageOptions = {}): Promise<{
  body: string;
  headers: Headers;
}> {
  const accept = options.accept ?? "text/html,application/xhtml+xml";
  const timeoutMs = options.timeoutMs ?? 30_000;
  const headers = requestHeaders(url, accept, options.referer);

  if (!options.allowInsecureTls) {
    try {
      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(timeoutMs),
        next: { revalidate: 3600 },
      });
      if (response.ok) {
        return { body: await response.text(), headers: response.headers };
      }
      if (response.status !== 403 && response.status !== 429) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/403|429|UNABLE_TO_VERIFY|fetch failed|certificate/i.test(message)) {
        throw error;
      }
    }
  }

  const attempts: Array<{ rejectUnauthorized: boolean }> = options.allowInsecureTls
    ? [{ rejectUnauthorized: false }]
    : [{ rejectUnauthorized: true }, { rejectUnauthorized: false }];

  let lastError: Error | null = null;
  for (const attempt of attempts) {
    try {
      const response = await fetchViaNodeHttps(url, headers, timeoutMs, attempt.rejectUnauthorized);
      if (response.status >= 200 && response.status < 300) {
        return { body: response.body, headers: response.headers };
      }
      lastError = new Error(`${response.status} ${response.statusText}`);
      if (response.status !== 403 && response.status !== 429) break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

export async function fetchHtml(url: string, options: FetchPageOptions = {}): Promise<string> {
  const { body } = await fetchPage(url, options);
  return body;
}

export async function fetchJson<T>(
  url: string,
  options: FetchPageOptions = {}
): Promise<{ data: T; headers: Headers }> {
  const { body, headers } = await fetchPage(url, {
    ...options,
    accept: options.accept ?? "application/json",
  });
  return { data: JSON.parse(body) as T, headers };
}

export function asRecord(value: JsonValue | undefined): Record<string, JsonValue> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, JsonValue>)
    : null;
}

export function collectJsonLdEvents(html: string): Record<string, JsonValue>[] {
  const $ = load(html);
  const events: Record<string, JsonValue>[] = [];

  const visit = (value: JsonValue | undefined) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    const record = asRecord(value);
    if (!record) return;

    const type = record["@type"];
    const isEvent =
      (typeof type === "string" && /event/i.test(type)) ||
      (Array.isArray(type) && type.some((entry) => typeof entry === "string" && /event/i.test(entry)));

    if (isEvent) events.push(record);
    visit(record["@graph"]);
    visit(record.mainEntity);
    visit(record.event);
  };

  for (const script of $("script[type='application/ld+json']").toArray()) {
    const raw = $(script).contents().text();
    if (!raw.trim()) continue;
    try {
      visit(JSON.parse(raw) as JsonValue);
    } catch {
      // Ignore malformed embedded JSON-LD.
    }
  }

  return events;
}

export function universityEvent(input: {
  title: string;
  description?: string | null;
  coverImage?: string | null;
  categoryText?: string;
  sourceUrl: string;
  startDate: Date;
  endDate?: Date | null;
  registrationDeadline?: Date | null;
  rawLocation: string;
  venue?: string | null;
  isOnline?: boolean;
  tags?: string[];
  organizerName: string;
  registrationUrl?: string | null;
}): ScrapedEventInput | null {
  const title = cleanText(input.title);
  if (!title || !input.startDate) return null;

  const description = cleanText(input.description) || title;
  const searchable = `${title} ${description} ${input.categoryText ?? ""}`;
  if (looksLikeNoise(searchable)) return null;
  if (!isStillRelevant(input.startDate, input.endDate, input.registrationDeadline)) return null;

  const isOnline = input.isOnline ?? isOnlineText(searchable, input.rawLocation, input.venue);
  const category = mapEventCategory(input.categoryText ? `${input.categoryText} ${searchable}` : searchable);

  return {
    title,
    description,
    coverImage: input.coverImage || null,
    category,
    source: "university",
    sourceUrl: input.sourceUrl,
    sourcePostUrl: input.sourceUrl,
    startDate: input.startDate,
    endDate: input.endDate ?? null,
    registrationDeadline: input.registrationDeadline ?? null,
    rawLocation: isOnline ? "Online" : input.rawLocation,
    venue: isOnline ? "Online" : input.venue || input.rawLocation,
    isOnline,
    tags: Array.from(new Set(["university", category, ...(input.tags ?? [])].map((tag) => tag.toLowerCase()))),
    organizerName: input.organizerName,
    registrationType: "external",
    registrationUrl: input.registrationUrl || input.sourceUrl,
  };
}
