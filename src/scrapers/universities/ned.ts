import { load } from "cheerio";

import type { ScrapedEventInput, ScraperResult } from "../types";
import {
  absoluteUrl,
  cleanText,
  fetchHtml,
  looksLikeEvent,
  parseDateRangeFromText,
  parseFlexibleDate,
  universityEvent,
} from "./shared";

const NED_DIL_URL =
  process.env.NED_EVENTS_URL ?? "https://pl.neduet.edu.pk/notices/DIL_Notices.jsp";
const NED_CSIT_EVENTS_URL =
  process.env.NED_CSIT_EVENTS_URL ?? "https://cct.neduet.edu.pk/i_event";
const NED_TECHFEST_URL =
  process.env.NED_TECHFEST_URL ?? "https://cct.neduet.edu.pk/tfest_spring26";

function scrapeDilNotices(html: string): ScrapedEventInput[] {
  const $ = load(html);
  const events: ScrapedEventInput[] = [];

  $("table tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 2) return;

    const subject = cleanText(cells.eq(0).text());
    const issueDateText = cleanText(cells.eq(1).text());
    if (!subject) return;
    if (!looksLikeEvent(subject) && !/hackathon|career fair|internship|session|workshop|tech/i.test(subject)) {
      return;
    }

    const start =
      parseFlexibleDate(issueDateText) ||
      parseDateRangeFromText(`${subject} ${issueDateText}`).start;
    if (!start) return;

    const href = cells.eq(0).find("a[href]").attr("href");
    const sourceUrl = absoluteUrl(href, NED_DIL_URL) || `${NED_DIL_URL}#${encodeURIComponent(subject.slice(0, 40))}`;

    const mapped = universityEvent({
      title: subject,
      description: `${subject}. Posted by NED Directorate of Industrial Liaison (${issueDateText}).`,
      categoryText: /hackathon|tech/i.test(subject)
        ? "hackathon"
        : /career fair|recruit/i.test(subject)
          ? "career_fair"
          : "seminar",
      sourceUrl,
      startDate: start,
      rawLocation: "Karachi",
      venue: "NED University of Engineering & Technology",
      tags: ["ned", "dil"],
      organizerName: "NED University — DIL",
      registrationUrl: sourceUrl,
    });
    if (mapped) events.push(mapped);
  });

  return events;
}

function scrapeCsitActivities(html: string, pageUrl: string): ScrapedEventInput[] {
  const $ = load(html);
  const events: ScrapedEventInput[] = [];

  $("h2, h3, .views-row, article, .event-item").each((_, element) => {
    const card = $(element);
    const title = cleanText(card.find("a").first().text()) || cleanText(card.text()).slice(0, 140);
    if (!title || title.length < 8) return;
    if (!looksLikeEvent(title) && !/session|talk|workshop|hackathon|techfest|iconics|training/i.test(title)) {
      return;
    }

    const blockText = cleanText(card.parent().text()).slice(0, 400) || title;
    const { start, end } = parseDateRangeFromText(blockText);
    if (!start) return;

    const href = card.find("a[href]").first().attr("href") || card.attr("href");
    const sourceUrl =
      absoluteUrl(href, pageUrl) || `${pageUrl}#${encodeURIComponent(title.toLowerCase().slice(0, 40))}`;

    const mapped = universityEvent({
      title,
      description: blockText,
      categoryText: /hackathon|techfest|kombat|ctf/i.test(title) ? "hackathon" : "workshop",
      sourceUrl,
      startDate: start,
      endDate: end,
      rawLocation: "Karachi",
      venue: "NED CS & IT Department",
      tags: ["ned", "csit"],
      organizerName: "NED University — CS & IT",
      registrationUrl: sourceUrl,
    });
    if (mapped) events.push(mapped);
  });

  return events;
}

function scrapeTechFest(html: string): ScrapedEventInput[] {
  const $ = load(html);
  const title =
    cleanText($("h1").first().text()) ||
    cleanText($("title").text()).replace(/\s*\|.*$/, "") ||
    "NED CS&IT TechFest";
  const body = cleanText($("main, .content, body").first().text()).slice(0, 800);
  const { start, end } = parseDateRangeFromText(`${title} ${body} Spring 2026`);
  if (!start) return [];

  const mapped = universityEvent({
    title,
    description: body || `${title} at NED University CS & IT.`,
    categoryText: "festival",
    sourceUrl: NED_TECHFEST_URL,
    startDate: start,
    endDate: end,
    rawLocation: "Karachi",
    venue: "NED University of Engineering & Technology",
    tags: ["ned", "techfest", "csit"],
    organizerName: "NED University — CS & IT",
    registrationUrl: NED_TECHFEST_URL,
  });

  return mapped ? [mapped] : [];
}

/**
 * NED University public listings: DIL notices, CSIT activities, TechFest.
 */
export async function scrapeNed(): Promise<ScraperResult> {
  const errors: string[] = [];
  const events = new Map<string, ScrapedEventInput>();

  const jobs: Array<{ label: string; run: () => Promise<ScrapedEventInput[]> }> = [
    {
      label: "DIL",
      run: async () => scrapeDilNotices(await fetchHtml(NED_DIL_URL)),
    },
    {
      label: "CSIT",
      run: async () => scrapeCsitActivities(await fetchHtml(NED_CSIT_EVENTS_URL), NED_CSIT_EVENTS_URL),
    },
    {
      label: "TechFest",
      run: async () => scrapeTechFest(await fetchHtml(NED_TECHFEST_URL)),
    },
  ];

  for (const job of jobs) {
    try {
      for (const event of await job.run()) {
        events.set(event.sourceUrl, event);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Error fetching NED ${job.label}: ${message}`);
    }
  }

  return {
    source: "university",
    events: Array.from(events.values()),
    errors: errors.length ? errors : undefined,
  };
}
