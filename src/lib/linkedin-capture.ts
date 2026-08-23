import { load } from "cheerio";

import type { EventCategory } from "@/generated/prisma/client";
import { normalizeCity, PAKISTAN_CITIES } from "@/lib/cities";

export type LinkedInEventDraft = {
  title: string;
  description: string;
  category: EventCategory;
  citySlug: string;
  venue: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  registrationUrl: string;
  organizerName: string;
  prizePool: string;
  sourcePostUrl: string;
  confidenceNotes: string[];
};

const CATEGORY_KEYWORDS: { category: EventCategory; keywords: string[] }[] = [
  { category: "hackathon", keywords: ["hackathon", "hackfest", "codefest", "coding competition"] },
  { category: "conference", keywords: ["conference", "summit", "congress", "symposium"] },
  { category: "workshop", keywords: ["workshop", "bootcamp", "training", "hands-on"] },
  { category: "meetup", keywords: ["meetup", "community night", "networking"] },
  { category: "competition", keywords: ["competition", "contest", "olympiad", "challenge"] },
  { category: "seminar", keywords: ["seminar", "webinar", "talk", "session"] },
  { category: "career_fair", keywords: ["career fair", "job fair", "recruitment drive"] },
  { category: "festival", keywords: ["festival", "expo", "fest"] },
];

const MONTHS: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
};

const LINKEDIN_HOST_RE = /(^|\.)linkedin\.com$/i;
const URL_RE = /https?:\/\/[^\s<>"')]+/gi;

export function isLinkedInUrl(value: string) {
  try {
    return LINKEDIN_HOST_RE.test(new URL(value).hostname);
  } catch {
    return false;
  }
}

export async function fetchPublicLinkedInText(url: string): Promise<{ text: string; image?: string }> {
  if (!isLinkedInUrl(url)) {
    throw new Error("Paste a valid LinkedIn URL.");
  }

  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
      "user-agent": "HackScoutBot/1.0 (+https://hackscout.local)",
    },
    signal: AbortSignal.timeout(7000),
  });

  if (!response.ok) {
    throw new Error("LinkedIn did not expose this post publicly. Paste the post text instead.");
  }

  const html = await response.text();
  const $ = load(html);
  const title = $('meta[property="og:title"]').attr("content") || $("title").text();
  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    "";
  const image = $('meta[property="og:image"]').attr("content");
  const bodyText = $("main").text() || $("body").text();
  const text = cleanText([title, description, bodyText].filter(Boolean).join("\n"));

  if (!text || /sign in|join linkedin|authwall/i.test(text)) {
    throw new Error("This LinkedIn post is behind a login wall. Paste the post text instead.");
  }

  return { text, image };
}

export function extractLinkedInEventDraft(input: { text: string; sourcePostUrl?: string }): LinkedInEventDraft {
  const cleaned = cleanText(input.text);
  const lines = cleaned
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const searchable = cleaned.toLowerCase();
  const urls = extractUrls(cleaned);
  const sourcePostUrl = input.sourcePostUrl?.trim() || urls.find(isLinkedInUrl) || "";
  const registrationUrl =
    urls.find((url) => !isLinkedInUrl(url) && /form|register|lu\.ma|eventbrite|devfolio|devpost|unstop/i.test(url)) ||
    urls.find((url) => !isLinkedInUrl(url)) ||
    "";
  const dateCandidates = extractDates(cleaned);
  const deadline = extractDeadline(cleaned, dateCandidates);
  const startDate = dateCandidates.find((date) => date !== deadline) || deadline || "";
  const endDate = dateCandidates.find((date) => date !== startDate && date !== deadline) || "";
  const city = normalizeCity(cleaned);
  const notes: string[] = [];

  if (!registrationUrl) notes.push("Registration link was not found. Add the official link before filing.");
  if (!deadline) notes.push("Deadline was not confidently detected. Please verify it from the post.");
  if (!startDate) notes.push("Event date was not confidently detected. Please enter it manually.");
  if (!city.matched) notes.push("City was guessed. Change it if the event is outside Karachi/online.");

  return {
    title: extractTitle(lines),
    description: extractDescription(lines),
    category: inferCategory(searchable),
    citySlug: city.slug,
    venue: extractVenue(lines),
    startDate,
    endDate,
    registrationDeadline: deadline || startDate,
    registrationUrl,
    organizerName: extractOrganizer(lines),
    prizePool: extractPrizePool(lines),
    sourcePostUrl,
    confidenceNotes: notes,
  };
}

function cleanText(value: string) {
  return value
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractUrls(text: string) {
  return Array.from(new Set(text.match(URL_RE) || [])).map((url) => url.replace(/[.,;:!?]+$/, ""));
}

function inferCategory(searchable: string): EventCategory {
  return CATEGORY_KEYWORDS.find((item) => item.keywords.some((keyword) => searchable.includes(keyword)))?.category || "other";
}

function extractTitle(lines: string[]) {
  const titleLine =
    lines.find((line) => {
      const lower = line.toLowerCase();
      return (
        line.length >= 4 &&
        line.length <= 90 &&
        !lower.startsWith("http") &&
        !lower.includes("register now") &&
        !lower.includes("deadline")
      );
    }) || "";

  return titleLine.replace(/^[-#*\s]+/, "").slice(0, 120);
}

function extractDescription(lines: string[]) {
  const withoutUrls = lines
    .filter((line) => !line.startsWith("http"))
    .join("\n")
    .replace(URL_RE, "")
    .trim();

  return withoutUrls.slice(0, 1400);
}

function extractOrganizer(lines: string[]) {
  const organizerLine = lines.find((line) => /organized by|hosted by|by\s+/i.test(line));
  if (!organizerLine) return "";
  return organizerLine
    .replace(/.*(?:organized by|hosted by)\s*:?\s*/i, "")
    .replace(/^by\s+/i, "")
    .slice(0, 80)
    .trim();
}

function extractVenue(lines: string[]) {
  const venueLine = lines.find((line) => /venue|location|where|campus/i.test(line));
  if (venueLine) {
    return venueLine.replace(/^(venue|location|where)\s*:?\s*/i, "").slice(0, 120).trim();
  }

  const city = PAKISTAN_CITIES.find((item) => !item.isVirtual && lines.some((line) => line.toLowerCase().includes(item.name.toLowerCase())));
  return city?.name || "";
}

function extractPrizePool(lines: string[]) {
  const prizeLine = lines.find((line) => /prize|pkr|rs\.?|rupees/i.test(line));
  return prizeLine?.slice(0, 100).trim() || "";
}

function extractDeadline(text: string, dates: string[]) {
  const deadlineMatch = text.match(
    /(?:deadline|last date|apply by|register by|registration closes|closes on)[^\n]{0,80}/i
  )?.[0];
  if (!deadlineMatch) return "";
  return extractDates(deadlineMatch)[0] || dates[0] || "";
}

function extractDates(text: string) {
  const dates = new Set<string>();
  const currentYear = new Date().getFullYear();

  for (const match of text.matchAll(/\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/g)) {
    dates.add(toIsoDate(Number(match[1]), Number(match[2]), Number(match[3])));
  }

  const monthNames = Object.keys(MONTHS).join("|");
  const dayMonth = new RegExp(`\\b(0?[1-9]|[12]\\d|3[01])\\s+(${monthNames})\\s*,?\\s*(20\\d{2})?\\b`, "gi");
  for (const match of text.matchAll(dayMonth)) {
    dates.add(toIsoDate(Number(match[3] || currentYear), Number(MONTHS[match[2].toLowerCase()]), Number(match[1])));
  }

  const monthDay = new RegExp(`\\b(${monthNames})\\s+(0?[1-9]|[12]\\d|3[01])(?:st|nd|rd|th)?\\s*,?\\s*(20\\d{2})?\\b`, "gi");
  for (const match of text.matchAll(monthDay)) {
    dates.add(toIsoDate(Number(match[3] || currentYear), Number(MONTHS[match[1].toLowerCase()]), Number(match[2])));
  }

  return Array.from(dates).filter(Boolean).sort();
}

function toIsoDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return "";
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
