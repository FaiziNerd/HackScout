import { PAKISTAN_CITIES } from "@/lib/cities";
import { prisma } from "@/lib/db";
import type { ReviewFilter } from "@/lib/submissions";

export interface MissingEventInput {
  title: string;
  citySlug: string;
  customCityName?: string;
  sourceUrl?: string;
  description?: string;
  pagePath?: string;
}

export function resolveTipCity(citySlug: string, customCityName?: string) {
  if (citySlug === "other") {
    const name = customCityName?.trim();
    if (!name || name.length < 2) {
      throw new Error("Enter the city that is not in the directory.");
    }
    return { citySlug: null, cityName: name };
  }

  const city = PAKISTAN_CITIES.find((item) => item.slug === citySlug);
  if (!city) {
    throw new Error("Choose a city.");
  }
  return { citySlug: city.slug, cityName: city.name };
}

export async function createMissingEventReport(input: MissingEventInput) {
  const title = input.title.trim();
  const sourceUrl = input.sourceUrl?.trim() || null;
  const description = input.description?.trim() || null;
  const pagePath = input.pagePath?.trim() || null;

  if (title.length < 3) {
    throw new Error("Event name needs at least 3 characters.");
  }
  if (!sourceUrl && !description) {
    throw new Error("Add a link or a short note about the event.");
  }
  if (description && description.length < 8) {
    throw new Error("Add a little more detail so the desk can find it.");
  }

  const city = resolveTipCity(input.citySlug, input.customCityName);

  return prisma.missingEventReport.create({
    data: {
      title,
      citySlug: city.citySlug,
      cityName: city.cityName,
      sourceUrl,
      description,
      pagePath,
      status: "pending",
    },
  });
}

export async function getMissingEventQueue(status: ReviewFilter = "pending") {
  const [reports, counts] = await Promise.all([
    prisma.missingEventReport.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.missingEventReport.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const tally = { pending: 0, approved: 0, rejected: 0 };
  for (const row of counts) {
    tally[row.status] = row._count._all;
  }

  return { reports, tally };
}

export async function resolveMissingEventReport(id: string, status: "approved" | "rejected") {
  const existing = await prisma.missingEventReport.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Tip not found.");
  }

  return prisma.missingEventReport.update({
    where: { id },
    data: { status },
  });
}
