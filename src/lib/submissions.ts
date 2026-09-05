import type { EventCategory } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { parseFormFields } from "@/lib/registration-form";
import { normalizeScrapedEvent, slugify } from "@/scrapers/normalizer";
import type { ScrapedEventInput } from "@/scrapers/types";

export interface CommunityEventInput {
  title: string;
  description: string;
  category: EventCategory;
  citySlug: string;
  customCityName?: string;
  venue?: string;
  isOnline?: boolean;
  startDate: string;
  endDate?: string;
  registrationDeadline: string;
  registrationUrl?: string;
  registrationType?: "external" | "native";
  formFields?: unknown;
  organizerName: string;
  organizerEmail: string;
  prizePool?: string;
  source: "community" | "linkedin" | "instagram";
  sourcePostUrl?: string;
  submittedByUserId?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseCalendarDate(value: string, hoursUtc = 12, minutes = 0) {
  if (!DATE_RE.test(value)) {
    throw new Error("Use dates in YYYY-MM-DD format.");
  }
  const date = new Date(`${value}T${String(hoursUtc).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Enter a valid date.");
  }
  return date;
}

export async function resolveSubmissionCity(citySlug: string, customCityName?: string) {
  if (citySlug === "other") {
    const name = customCityName?.trim();
    if (!name || name.length < 2) {
      throw new Error("Enter the city that is not in the directory.");
    }
    const slug = slugify(name);
    if (!slug) {
      throw new Error("Enter a valid city name.");
    }
    const existing = await prisma.city.findUnique({ where: { slug } });
    if (existing) return existing;
    return prisma.city.create({
      data: { slug, name, country: "Pakistan" },
    });
  }

  const city = await prisma.city.findUnique({ where: { slug: citySlug } });
  if (!city) {
    throw new Error(`Unknown city: ${citySlug}`);
  }
  return city;
}

export async function createPendingCommunityEvent(input: CommunityEventInput) {
  const city = await resolveSubmissionCity(input.citySlug, input.customCityName);

  const startDate = parseCalendarDate(input.startDate, 12);
  const endDate = parseCalendarDate(input.endDate || input.startDate, 16);
  const registrationDeadline = parseCalendarDate(input.registrationDeadline, 18, 59);

  if (endDate < startDate) {
    throw new Error("End date cannot be before the start date.");
  }

  const registrationType = input.registrationType === "native" ? "native" : "external";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const placeholderUrl = input.registrationUrl || `${siteUrl}/events/${slugify(input.title)}`;

  const scrapedInput: ScrapedEventInput = {
    title: input.title,
    description: input.description,
    category: input.category,
    source: input.source,
    sourceUrl: placeholderUrl,
    sourcePostUrl: input.sourcePostUrl,
    startDate,
    endDate,
    registrationDeadline,
    rawLocation: city.slug,
    venue: input.venue,
    isOnline: input.isOnline ?? (city.isVirtual || city.slug === "online"),
    organizerName: input.organizerName,
    prizePool: input.prizePool,
    registrationType,
    registrationUrl: registrationType === "external" ? input.registrationUrl : null,
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
      sourceUrl: registrationType === "native" ? `${siteUrl}/events/${uniqueSlug}` : normalized.sourceUrl,
      sourcePostUrl: normalized.sourcePostUrl,
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      registrationDeadline: normalized.registrationDeadline,
      cityId: city.id,
      venue: normalized.venue,
      isOnline: normalized.isOnline,
      tags: normalized.tags,
      organizerName: normalized.organizerName,
      organizerEmail: input.organizerEmail.trim().toLowerCase(),
      prizePool: normalized.prizePool,
      registrationType: normalized.registrationType,
      registrationUrl: registrationType === "native" ? null : normalized.registrationUrl,
      formFields: registrationType === "native" ? parseFormFields(input.formFields) : undefined,
      submittedByUserId: input.submittedByUserId || null,
      status: "upcoming",
      reviewStatus: "pending",
    },
  });
}

export type ReviewFilter = "pending" | "approved" | "rejected";

export async function getReviewQueue(status: ReviewFilter = "pending") {
  const [events, counts] = await Promise.all([
    prisma.event.findMany({
      where: { reviewStatus: status },
      include: { city: true },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.event.groupBy({
      by: ["reviewStatus"],
      _count: { _all: true },
    }),
  ]);

  const tally = { pending: 0, approved: 0, rejected: 0 };
  for (const row of counts) {
    tally[row.reviewStatus] = row._count._all;
  }

  return { events, tally };
}

export async function listReviewCities() {
  return prisma.city.findMany({
    orderBy: [{ isVirtual: "desc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true, isVirtual: true },
  });
}

async function syncCityCounts(fromCityId: string | null, toCityId: string | null) {
  if (fromCityId && fromCityId === toCityId) return;
  if (fromCityId) {
    await prisma.city.update({
      where: { id: fromCityId },
      data: { eventCount: { decrement: 1 } },
    });
  }
  if (toCityId) {
    await prisma.city.update({
      where: { id: toCityId },
      data: { eventCount: { increment: 1 } },
    });
  }
}

export async function approveEvent(eventId: string, cityId?: string) {
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) {
    throw new Error("Event not found.");
  }

  const nextCityId = cityId || existing.cityId;
  const wasApproved = existing.reviewStatus === "approved";

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      reviewStatus: "approved",
      status: existing.status === "closed" && existing.reviewStatus === "rejected" ? "upcoming" : existing.status,
      cityId: nextCityId,
    },
    include: { city: true },
  });

  if (!wasApproved) {
    await prisma.city.update({
      where: { id: nextCityId },
      data: { eventCount: { increment: 1 } },
    });
  } else if (existing.cityId !== nextCityId) {
    await syncCityCounts(existing.cityId, nextCityId);
  }

  return event;
}

export async function rejectEvent(eventId: string) {
  const existing = await prisma.event.findUnique({ where: { id: eventId } });
  if (!existing) {
    throw new Error("Event not found.");
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: { reviewStatus: "rejected", status: "closed" },
  });

  if (existing.reviewStatus === "approved") {
    await prisma.city.update({
      where: { id: existing.cityId },
      data: { eventCount: { decrement: 1 } },
    });
  }

  return event;
}

export { slugify };
