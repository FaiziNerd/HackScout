import type { EventCategory, EventSource } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export interface EventFeedFilters {
  city?: string;
  category?: EventCategory;
  search?: string;
  limit?: number;
}

export async function getUpcomingEvents(filters: EventFeedFilters = {}) {
  const { city, category, search, limit } = filters;

  const where = {
    reviewStatus: "approved" as const,
    status: { in: ["upcoming" as const, "ongoing" as const] },
    ...(city && city !== "all" ? { city: { slug: city } } : {}),
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
            { organizerName: { contains: search, mode: "insensitive" as const } },
            { tags: { has: search.toLowerCase() } },
          ],
        }
      : {}),
  };

  return prisma.event.findMany({
    where,
    include: { city: true },
    orderBy: [{ registrationDeadline: { sort: "asc", nulls: "last" } }, { startDate: "asc" }],
    ...(limit ? { take: limit } : {}),
  });
}

export async function getFeedStats() {
  const [eventCount, cityCount] = await Promise.all([
    prisma.event.count({
      where: { reviewStatus: "approved", status: { in: ["upcoming", "ongoing"] } },
    }),
    prisma.city.count({
      where: {
        isVirtual: false,
        events: {
          some: { reviewStatus: "approved", status: { in: ["upcoming", "ongoing"] } },
        },
      },
    }),
  ]);

  return { eventCount, cityCount };
}

export async function getCityEventCounts() {
  const now = new Date();
  const weekFromNow = new Date(now);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const activeEventWhere = {
    reviewStatus: "approved" as const,
    status: { in: ["upcoming" as const, "ongoing" as const] },
  };

  const cities = await prisma.city.findMany({
    where: { events: { some: activeEventWhere } },
    select: {
      id: true,
      slug: true,
      name: true,
      province: true,
      isVirtual: true,
      _count: {
        select: {
          events: { where: activeEventWhere },
        },
      },
      events: {
        where: {
          ...activeEventWhere,
          registrationDeadline: { gte: now, lte: weekFromNow },
        },
        select: { id: true },
      },
    },
  });

  return cities
    .map(({ _count, events, ...city }) => ({
      ...city,
      eventCount: _count.events,
      closingThisWeek: events.length,
    }))
    .sort((a, b) => b.eventCount - a.eventCount || a.name.localeCompare(b.name))
    .slice(0, 8);
}

export async function getCityBySlug(slug: string) {
  return prisma.city.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      province: true,
      country: true,
      isVirtual: true,
    },
  });
}

const CATEGORY_LABELS: Record<EventCategory, string> = {
  hackathon: "Hackathon",
  conference: "Conference",
  workshop: "Workshop",
  meetup: "Meetup",
  competition: "Competition",
  seminar: "Seminar",
  career_fair: "Career Fair",
  festival: "Festival",
  other: "Other",
};

export function formatCategory(category: EventCategory): string {
  return CATEGORY_LABELS[category] || category;
}

export function formatEventDateRange(start: Date, end: Date | null): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const startStr = start.toLocaleDateString("en-PK", opts);
  if (!end) return startStr;
  const endStr = end.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
  if (start.toDateString() === end.toDateString()) return startStr;
  return `${startStr} - ${endStr}`;
}

export function formatDeadlineLabel(deadline: Date | null): { label: string; isUrgent: boolean } {
  if (!deadline) return { label: "Open", isUrgent: false };

  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: "Closed", isUrgent: false };
  if (diffDays === 0) return { label: "Today", isUrgent: true };
  if (diffDays === 1) return { label: "Tomorrow", isUrgent: true };
  if (diffDays <= 7) return { label: `${diffDays} days left`, isUrgent: true };
  return { label: `${diffDays} days left`, isUrgent: false };
}

export const SOURCE_LABELS: Partial<Record<EventSource, string>> = {
  devfolio: "Devfolio",
  devpost: "Devpost",
  talentshowcase: "TalentShowcase",
  eventbrite: "Eventbrite",
  facebook: "Facebook",
  university: "University",
  linkedin: "LinkedIn",
  community: "Community",
};
