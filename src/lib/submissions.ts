import type { EventCategory } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { normalizeScrapedEvent, slugify } from "@/scrapers/normalizer";
import type { ScrapedEventInput } from "@/scrapers/types";

export interface CommunityEventInput {
  title: string;
  description: string;
  category: EventCategory;
  citySlug: string;
  venue?: string;
  isOnline?: boolean;
  startDate: string;
  endDate?: string;
  registrationDeadline: string;
  registrationUrl: string;
  organizerName: string;
  source: "community" | "linkedin";
  sourcePostUrl?: string;
}

export async function createPendingCommunityEvent(input: CommunityEventInput) {
  const city = await prisma.city.findUnique({ where: { slug: input.citySlug } });
  if (!city) {
    throw new Error(`Unknown city: ${input.citySlug}`);
  }

  const scrapedInput: ScrapedEventInput = {
    title: input.title,
    description: input.description,
    category: input.category,
    source: input.source,
    sourceUrl: input.registrationUrl,
    sourcePostUrl: input.sourcePostUrl,
    startDate: input.startDate,
    endDate: input.endDate || input.startDate,
    registrationDeadline: input.registrationDeadline,
    rawLocation: input.citySlug,
    venue: input.venue,
    isOnline: input.isOnline ?? input.citySlug === "online",
    organizerName: input.organizerName,
    registrationType: "external",
    registrationUrl: input.registrationUrl,
    tags: [input.source],
  };

  const normalized = normalizeScrapedEvent(scrapedInput);

  let uniqueSlug = normalized.slug;
  let counter = 1;
  while (await prisma.event.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${normalized.slug}-${counter}`;
    counter++;
  }

  return prisma.event.create({
    data: {
      slug: uniqueSlug,
      title: normalized.title,
      description: normalized.description,
      category: normalized.category,
      country: normalized.country,
      source: normalized.source,
      sources: [normalized.source],
      sourceUrl: normalized.sourceUrl,
      sourcePostUrl: normalized.sourcePostUrl,
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      registrationDeadline: normalized.registrationDeadline,
      cityId: city.id,
      venue: normalized.venue,
      isOnline: normalized.isOnline,
      tags: normalized.tags,
      organizerName: normalized.organizerName,
      registrationType: normalized.registrationType,
      registrationUrl: normalized.registrationUrl,
      status: "upcoming",
      reviewStatus: "pending",
    },
  });
}

export async function approveEvent(eventId: string) {
  const event = await prisma.event.update({
    where: { id: eventId },
    data: { reviewStatus: "approved" },
    include: { city: true },
  });

  await prisma.city.update({
    where: { id: event.cityId },
    data: { eventCount: { increment: 1 } },
  });

  return event;
}

export async function rejectEvent(eventId: string) {
  return prisma.event.update({
    where: { id: eventId },
    data: { reviewStatus: "rejected", status: "closed" },
  });
}

export { slugify };
