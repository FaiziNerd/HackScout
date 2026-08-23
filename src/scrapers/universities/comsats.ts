import { load } from "cheerio";

import type { ScrapedEventInput, ScraperResult } from "../types";
import {
  absoluteUrl,
  cleanText,
  fetchHtml,
  looksLikeEvent,
  parseDateRangeFromText,
  universityEvent,
} from "./shared";

const COMSATS_ALUMNI_EVENTS_URL =
  process.env.COMSATS_EVENTS_URL ?? "https://ww5.comsats.edu.pk/alumni/allevents.aspx";
const COMSATS_LAHORE_NEWS_URL = "https://lahore.comsats.edu.pk/news.aspx";

function campusFromText(text: string): { rawLocation: string; venue: string } {
  const value = text.toLowerCase();
  if (/lahore/.test(value)) return { rawLocation: "Lahore", venue: "COMSATS University Lahore" };
  if (/\bwah\b/.test(value)) return { rawLocation: "Wah Cantt", venue: "COMSATS University Wah" };
  if (/abbottabad/.test(value)) {
    return { rawLocation: "Abbottabad", venue: "COMSATS University Abbottabad" };
  }
  if (/sahiwal/.test(value)) return { rawLocation: "Sahiwal", venue: "COMSATS University Sahiwal" };
  if (/vehari/.test(value)) return { rawLocation: "Multan", venue: "COMSATS University Vehari" };
  if (/attock/.test(value)) return { rawLocation: "Islamabad", venue: "COMSATS University Attock" };
  if (/virtual|online/.test(value)) return { rawLocation: "Online", venue: "COMSATS Virtual Campus" };
  return { rawLocation: "Islamabad", venue: "COMSATS University Islamabad" };
}

function scrapeAlumni(html: string): ScrapedEventInput[] {
  const $ = load(html);
  const events: ScrapedEventInput[] = [];

  $("a.list-group-item[href*='ArticleId=']").each((_, element) => {
    const card = $(element);
    const title = cleanText(card.find("h5").first().text());
    const dateText = cleanText(card.find("small").first().text());
    const sourceUrl = absoluteUrl(card.attr("href"), COMSATS_ALUMNI_EVENTS_URL);
    if (!title || !sourceUrl) return;

    const { start, end } = parseDateRangeFromText(`${title} ${dateText}`);
    if (!start) return;

    const campus = campusFromText(title);
    const mapped = universityEvent({
      title,
      description: `${title}. ${dateText}`.trim(),
      sourceUrl,
      startDate: start,
      endDate: end,
      rawLocation: campus.rawLocation,
      venue: campus.venue,
      tags: ["comsats", "cui"],
      organizerName: "COMSATS University Islamabad",
    });
    if (mapped) events.push(mapped);
  });

  return events;
}

function scrapeLahore(html: string): ScrapedEventInput[] {
  const $ = load(html);
  const events: ScrapedEventInput[] = [];

  $(".news-item-box").each((_, element) => {
    const card = $(element);
    const category = (card.attr("data-category") ?? "").toLowerCase();
    const title =
      cleanText(card.attr("data-title")) || cleanText(card.find(".news-title").first().text());
    const dateText = cleanText(card.find(".news-date-badge").first().text());
    const href =
      card.find(".news-title a").attr("href") ||
      card.find("a.btn-news-link").attr("href") ||
      card.find("a[href]").first().attr("href");
    const coverImage = absoluteUrl(card.find("img").first().attr("src"), COMSATS_LAHORE_NEWS_URL);
    if (!title) return;

    const searchable = `${title} ${category} ${dateText}`;
    if (!looksLikeEvent(searchable) && !/workshop|training|event|conference|seminar/.test(category)) {
      return;
    }
    if (/hiring|job posting|research assistant/.test(searchable)) return;

    const { start, end } = parseDateRangeFromText(searchable);
    if (!start) return;

    const hrefUrl = absoluteUrl(href, COMSATS_LAHORE_NEWS_URL);
    const sourceUrl =
      hrefUrl && !/facebook\.com/i.test(hrefUrl)
        ? hrefUrl
        : `${COMSATS_LAHORE_NEWS_URL}?event=${encodeURIComponent(title.slice(0, 80))}`;

    const mapped = universityEvent({
      title,
      description: title,
      coverImage,
      categoryText: category,
      sourceUrl,
      startDate: start,
      endDate: end,
      rawLocation: "Lahore",
      venue: "COMSATS University Lahore",
      tags: ["comsats", "comsats-lahore", category].filter(Boolean),
      organizerName: "COMSATS University Lahore",
      registrationUrl: hrefUrl || sourceUrl,
    });
    if (mapped) events.push(mapped);
  });

  return events;
}

/**
 * COMSATS events from the alumni events board and Lahore campus news cards.
 */
export async function scrapeComsats(): Promise<ScraperResult> {
  const errors: string[] = [];
  const events = new Map<string, ScrapedEventInput>();

  try {
    for (const item of scrapeAlumni(await fetchHtml(COMSATS_ALUMNI_EVENTS_URL))) {
      events.set(item.sourceUrl, item);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Error fetching COMSATS alumni events: ${message}`);
  }

  try {
    for (const item of scrapeLahore(await fetchHtml(COMSATS_LAHORE_NEWS_URL))) {
      events.set(item.sourceUrl, item);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Error fetching COMSATS Lahore news: ${message}`);
  }

  return {
    source: "university",
    events: Array.from(events.values()),
    errors: errors.length ? errors : undefined,
  };
}
