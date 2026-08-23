import { prisma } from "@/lib/db";
import { formatPrizePool } from "@/lib/utils";
import type { NormalizedScrapedEvent } from "./types";
import type { Event } from "@/generated/prisma/client";

/**
 * Clean and normalize a title string for fuzzy comparison.
 */
export function normalizeTitleForFuzzy(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Computes Dice's Coefficient / Bigram similarity between two strings (0.0 to 1.0).
 */
export function stringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeTitleForFuzzy(str1);
  const s2 = normalizeTitleForFuzzy(str2);

  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0.0;

  const getBigrams = (str: string): Map<string, number> => {
    const bigrams = new Map<string, number>();
    for (let i = 0; i < str.length - 1; i++) {
      const bigram = str.substring(i, i + 2);
      const count = bigrams.get(bigram) || 0;
      bigrams.set(bigram, count + 1);
    }
    return bigrams;
  };

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);

  let intersection = 0;
  for (const [bigram, count1] of bigrams1.entries()) {
    const count2 = bigrams2.get(bigram);
    if (count2) {
      intersection += Math.min(count1, count2);
    }
  }

  const totalBigrams = (s1.length - 1) + (s2.length - 1);
  return (2.0 * intersection) / totalBigrams;
}

export interface DedupResult {
  isDuplicate: boolean;
  matchType?: "exact_url" | "exact_slug" | "fuzzy_title_date";
  existingEvent?: Event;
}

/**
 * Checks if a normalized scraped event is already present in the database.
 * Deduplication matching rules:
 * 1. Exact match on sourceUrl
 * 2. Exact match on slug
 * 3. Fuzzy match: startDate within +/- 3 days and title similarity >= 0.75
 */
export async function findDuplicateEvent(event: NormalizedScrapedEvent): Promise<DedupResult> {
  // 1. Exact match on sourceUrl
  const byUrl = await prisma.event.findFirst({
    where: {
      OR: [
        { sourceUrl: event.sourceUrl },
        { registrationUrl: event.sourceUrl },
      ],
    },
  });

  if (byUrl) {
    return { isDuplicate: true, matchType: "exact_url", existingEvent: byUrl };
  }

  // 2. Exact match on slug
  const bySlug = await prisma.event.findUnique({
    where: { slug: event.slug },
  });

  if (bySlug) {
    return { isDuplicate: true, matchType: "exact_slug", existingEvent: bySlug };
  }

  // 3. Fuzzy match: candidates with startDate within +/- 3 days
  const windowDays = 3;
  const minDate = new Date(event.startDate.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const maxDate = new Date(event.startDate.getTime() + windowDays * 24 * 60 * 60 * 1000);

  const candidates = await prisma.event.findMany({
    where: {
      startDate: {
        gte: minDate,
        lte: maxDate,
      },
    },
  });

  for (const candidate of candidates) {
    const similarity = stringSimilarity(event.title, candidate.title);
    if (similarity >= 0.75) {
      return {
        isDuplicate: true,
        matchType: "fuzzy_title_date",
        existingEvent: candidate,
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Upserts or merges a normalized scraped event.
 * If duplicate: merges sources array and updates lastScrapedAt & metadata if newer.
 * If new: inserts into DB and increments city eventCount.
 */
export async function saveOrMergeScrapedEvent(
  event: NormalizedScrapedEvent
): Promise<{ event: Event; isNew: boolean }> {
  // Resolve city
  const city = await prisma.city.findUnique({
    where: { slug: event.citySlug },
  });

  if (!city) {
    throw new Error(`City with slug "${event.citySlug}" not found in database`);
  }

  const dup = await findDuplicateEvent(event);

  if (dup.isDuplicate && dup.existingEvent) {
    const existing = dup.existingEvent;
    const existingSources = new Set(existing.sources || []);
    existingSources.add(existing.source);
    existingSources.add(event.source);

    // Merge tags
    const existingTags = new Set(existing.tags || []);
    for (const tag of event.tags) {
      existingTags.add(tag);
    }

    const updated = await prisma.event.update({
      where: { id: existing.id },
      data: {
        sources: Array.from(existingSources),
        tags: Array.from(existingTags),
        lastScrapedAt: new Date(),
        // Backfill empty fields if the new scrape provides them
        coverImage: existing.coverImage || event.coverImage,
        prizePool: formatPrizePool(existing.prizePool) || event.prizePool,
        organizerName: existing.organizerName || event.organizerName,
        venue: existing.venue || event.venue,
        registrationDeadline: existing.registrationDeadline || event.registrationDeadline,
      },
    });

    return { event: updated, isNew: false };
  }

  // Ensure unique slug if collision occurs with different event
  let uniqueSlug = event.slug;
  let counter = 1;
  while (await prisma.event.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${event.slug}-${counter}`;
    counter++;
  }

  const created = await prisma.$transaction(async (tx) => {
    const newEvent = await tx.event.create({
      data: {
        slug: uniqueSlug,
        title: event.title,
        description: event.description,
        coverImage: event.coverImage,
        category: event.category,
        country: event.country,
        source: event.source,
        sources: [event.source],
        sourceUrl: event.sourceUrl,
        sourcePostUrl: event.sourcePostUrl,
        startDate: event.startDate,
        endDate: event.endDate,
        registrationDeadline: event.registrationDeadline,
        cityId: city.id,
        venue: event.venue,
        isOnline: event.isOnline,
        tags: event.tags,
        prizePool: event.prizePool,
        organizerName: event.organizerName,
        registrationType: event.registrationType,
        registrationUrl: event.registrationUrl,
        status: "upcoming",
        lastScrapedAt: new Date(),
      },
    });

    await tx.city.update({
      where: { id: city.id },
      data: {
        eventCount: { increment: 1 },
      },
    });

    return newEvent;
  });

  return { event: created, isNew: true };
}
