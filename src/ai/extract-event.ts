import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";

import { PAKISTAN_CITIES } from "@/lib/cities";
import type { SocialPostEventDraft } from "@/lib/social-post-capture";

const CITY_SLUGS = PAKISTAN_CITIES.map((city) => city.slug);

const eventCategorySchema = z.enum([
  "hackathon",
  "conference",
  "workshop",
  "meetup",
  "competition",
  "seminar",
  "career_fair",
  "festival",
  "other",
]);

const aiDraftSchema = z.object({
  title: z.string().describe("Event title, concise"),
  description: z.string().describe("Event description in plain text, 1-4 short paragraphs"),
  category: eventCategorySchema,
  citySlug: z
    .string()
    .describe(`Pakistan city slug. Must be one of: ${CITY_SLUGS.join(", ")}. Use "online" for virtual events.`),
  venue: z.string().describe("Venue name or campus; empty string if unknown"),
  startDate: z.string().describe("Event start date as YYYY-MM-DD, or empty string if unknown"),
  endDate: z.string().describe("Event end date as YYYY-MM-DD, or empty string if unknown"),
  registrationDeadline: z
    .string()
    .describe("Registration deadline as YYYY-MM-DD, or empty string if unknown"),
  registrationUrl: z.string().describe("Official registration URL; empty string if not found"),
  organizerName: z.string().describe("Organizer, society, or host name"),
  prizePool: z.string().describe("Prize pool text if mentioned, else empty string"),
  confidenceNotes: z
    .array(z.string())
    .describe("Short notes about uncertain or missing fields the submitter should verify"),
});

function normalizeDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function normalizeCitySlug(value: string): string {
  const slug = value.trim().toLowerCase().replace(/\s+/g, "-");
  if (CITY_SLUGS.includes(slug)) return slug;
  const byName = PAKISTAN_CITIES.find(
    (city) => city.name.toLowerCase() === value.trim().toLowerCase(),
  );
  return byName?.slug ?? "karachi";
}

function toDraft(
  object: z.infer<typeof aiDraftSchema>,
  sourcePostUrl?: string,
): SocialPostEventDraft {
  return {
    title: object.title.trim().slice(0, 120),
    description: object.description.trim().slice(0, 1400),
    category: object.category,
    citySlug: normalizeCitySlug(object.citySlug),
    venue: object.venue.trim().slice(0, 120),
    startDate: normalizeDate(object.startDate),
    endDate: normalizeDate(object.endDate),
    registrationDeadline: normalizeDate(object.registrationDeadline),
    registrationUrl: object.registrationUrl.trim(),
    organizerName: object.organizerName.trim().slice(0, 80),
    prizePool: object.prizePool.trim().slice(0, 100),
    sourcePostUrl: sourcePostUrl?.trim() ?? "",
    confidenceNotes: object.confidenceNotes.map((note) => note.trim()).filter(Boolean),
  };
}

/** Extract structured event fields from social post text using Groq. Returns null when AI is unavailable. */
export async function extractEventFromText(
  text: string,
  options?: { sourcePostUrl?: string },
): Promise<SocialPostEventDraft | null> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;

  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length < 20) return null;

  try {
    const { object } = await generateObject({
      model: groq("llama-3.3-70b-versatile"),
      schema: aiDraftSchema,
      prompt: `You extract Pakistan tech/community event details from a social media post.

Rules:
- Focus on hackathons, conferences, workshops, meetups, competitions, seminars, career fairs, and festivals in Pakistan (or online events open to Pakistan participants).
- Dates must be YYYY-MM-DD. If only a month/day is given, assume year ${new Date().getFullYear()} unless context implies next year.
- citySlug must match the allowed list. Use "online" for virtual/remote events.
- registrationUrl should be the official signup link (Google Form, Luma, Devfolio, Eventbrite, etc.), not the social post URL.
- Add confidenceNotes when deadline, city, or registration link is unclear.

Post text:
"""
${cleaned.slice(0, 6000)}
"""`,
    });

    return toDraft(object, options?.sourcePostUrl);
  } catch {
    return null;
  }
}
