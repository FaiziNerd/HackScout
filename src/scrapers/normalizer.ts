import { normalizeCity } from "@/lib/cities";
import type { ScrapedEventInput, NormalizedScrapedEvent } from "./types";

/**
 * Generate a URL-friendly slug from title and optional date.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

/**
 * Normalizes scraped event input into standard DB-compatible representation.
 */
export function normalizeScrapedEvent(input: ScrapedEventInput): NormalizedScrapedEvent {
  const startDate = input.startDate instanceof Date ? input.startDate : new Date(input.startDate);
  const endDate = input.endDate ? (input.endDate instanceof Date ? input.endDate : new Date(input.endDate)) : null;
  const registrationDeadline = input.registrationDeadline
    ? input.registrationDeadline instanceof Date
      ? input.registrationDeadline
      : new Date(input.registrationDeadline)
    : null;

  // Normalize city
  const cityResult = normalizeCity(input.rawLocation || (input.isOnline ? "online" : ""));
  const isOnline = input.isOnline || cityResult.slug === "online";

  // Base slug
  const baseSlug = slugify(input.title);
  const year = startDate.getFullYear() || new Date().getFullYear();
  const slug = `${baseSlug}-${year}`;

  return {
    title: input.title.trim(),
    slug,
    description: input.description.trim(),
    coverImage: input.coverImage || null,
    category: input.category,
    country: "Pakistan",
    source: input.source,
    sourceUrl: input.sourceUrl,
    sourcePostUrl: input.sourcePostUrl || null,
    startDate,
    endDate,
    registrationDeadline,
    citySlug: cityResult.slug,
    venue: input.venue || null,
    isOnline,
    tags: input.tags || [],
    prizePool: input.prizePool || null,
    organizerName: input.organizerName || null,
    registrationType: input.registrationType || "external",
    registrationUrl: input.registrationUrl || input.sourceUrl,
  };
}
