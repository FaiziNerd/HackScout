import { load } from "cheerio";

import type { ScrapedEventInput, ScraperResult } from "../types";
import {
  absoluteUrl,
  cleanText,
  fetchHtml,
  fetchJson,
  looksLikeEvent,
  parseDateRangeFromText,
  parseFlexibleDate,
  universityEvent,
} from "./shared";

const FAST_LAHORE_NEWS_URL = "https://lhr.nu.edu.pk/news/";
const FAST_ISLAMABAD_URL = "https://www.isb.nu.edu.pk/Announcements.php";
const FAST_KARACHI_POSTS_URL = "https://khi.nu.edu.pk/wp-json/wp/v2/posts";

interface WpRendered {
  rendered?: string;
}

interface WpPost {
  link?: string;
  date?: string;
  title?: WpRendered | string;
  content?: WpRendered | string;
  excerpt?: WpRendered | string;
}

function rendered(value?: WpRendered | string | null): string {
  if (!value) return "";
  return typeof value === "string" ? value : value.rendered ?? "";
}

function scrapeLahore(html: string): ScrapedEventInput[] {
  const $ = load(html);
  const events: ScrapedEventInput[] = [];

  $("#events .card-body").each((_, element) => {
    const card = $(element);
    const title = cleanText(card.find("h5").first().text());
    const description = cleanText(card.find("p").first().text());
    const href = card.find("a[href]").first().attr("href");
    const sourceUrl = absoluteUrl(href, FAST_LAHORE_NEWS_URL);
    const coverImage = absoluteUrl(card.find("img").first().attr("src"), FAST_LAHORE_NEWS_URL);
    if (!title || !sourceUrl) return;

    const searchable = `${title} ${description}`;
    const { start, end } = parseDateRangeFromText(searchable);
    if (!start) return;
    if (!looksLikeEvent(searchable) && !/softec|nascon|procom|nutech|hack/i.test(searchable)) return;

    const mapped = universityEvent({
      title,
      description,
      coverImage,
      sourceUrl,
      startDate: start,
      endDate: end,
      rawLocation: "Lahore",
      venue: "FAST-NUCES Lahore",
      tags: ["fast", "fast-lahore"],
      organizerName: "FAST-NUCES Lahore",
    });
    if (mapped) events.push(mapped);
  });

  return events;
}

function scrapeIslamabad(html: string): ScrapedEventInput[] {
  const $ = load(html);
  const events: ScrapedEventInput[] = [];

  $("#alumni .event, .upcoming-events .event").each((_, element) => {
    const card = $(element);
    const title = cleanText(card.find("h4").first().text());
    const description = cleanText(card.find("p").first().text());
    const href = card.find(".event-action a, a.btn-register").first().attr("href");
    const sourceUrl = absoluteUrl(href, FAST_ISLAMABAD_URL);
    const meta = cleanText(card.find(".event-meta").text());
    if (!title || !sourceUrl) return;

    const { start, end } = parseDateRangeFromText(`${title} ${meta} ${description}`);
    const eventDate = parseFlexibleDate(
      cleanText(card.find(".event-meta span").eq(1).text())
    );
    const startDate = eventDate ?? start;
    if (!startDate) return;

    const mapped = universityEvent({
      title,
      description,
      sourceUrl,
      startDate,
      endDate: end && end.getTime() !== startDate.getTime() ? end : null,
      rawLocation: "Islamabad",
      venue: "FAST-NUCES Islamabad",
      tags: ["fast", "fast-islamabad"],
      organizerName: "FAST-NUCES Islamabad",
    });
    if (mapped) events.push(mapped);
  });

  return events;
}

function mapKarachiPost(post: WpPost): ScrapedEventInput | null {
  const title = cleanText(rendered(post.title));
  const html = rendered(post.content) || rendered(post.excerpt);
  const description = cleanText(html);
  const sourceUrl = post.link;
  if (!title || !sourceUrl) return null;

  const searchable = `${title} ${description}`;
  if (!looksLikeEvent(searchable)) return null;

  const { start, end } = parseDateRangeFromText(searchable);
  const startDate = start ?? (post.date ? new Date(post.date) : null);
  if (!startDate || Number.isNaN(startDate.getTime())) return null;

  return universityEvent({
    title,
    description,
    sourceUrl,
    startDate,
    endDate: end,
    rawLocation: "Karachi",
    venue: "FAST-NUCES Karachi",
    tags: ["fast", "fast-karachi"],
    organizerName: "FAST-NUCES Karachi",
  });
}

/**
 * FAST-NUCES campus listings: Lahore news/events, Islamabad announcements,
 * and Karachi WordPress posts.
 */
export async function scrapeFast(): Promise<ScraperResult> {
  const errors: string[] = [];
  const events = new Map<string, ScrapedEventInput>();

  const add = (items: ScrapedEventInput[]) => {
    for (const item of items) events.set(item.sourceUrl, item);
  };

  try {
    add(scrapeLahore(await fetchHtml(FAST_LAHORE_NEWS_URL)));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Error fetching FAST Lahore events: ${message}`);
  }

  try {
    add(scrapeIslamabad(await fetchHtml(FAST_ISLAMABAD_URL)));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Error fetching FAST Islamabad announcements: ${message}`);
  }

  try {
    const url = new URL(FAST_KARACHI_POSTS_URL);
    url.searchParams.set("per_page", "20");
    url.searchParams.set("status", "publish");
    const { data } = await fetchJson<WpPost[]>(url.toString());
    if (Array.isArray(data)) {
      add(data.map(mapKarachiPost).filter((item): item is ScrapedEventInput => Boolean(item)));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Error fetching FAST Karachi posts: ${message}`);
  }

  return {
    source: "university",
    events: Array.from(events.values()),
    errors: errors.length ? errors : undefined,
  };
}
