import type { MetadataRoute } from "next";

import { PAKISTAN_CITIES } from "@/lib/cities";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/events"), lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: absoluteUrl("/cities"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/submit"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/submit/linkedin"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/missing"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  const cityRoutes: MetadataRoute.Sitemap = PAKISTAN_CITIES.map((city) => ({
    url: absoluteUrl(`/cities/${city.slug}`),
    lastModified: now,
    changeFrequency: "daily",
    priority: city.slug === "online" || ["karachi", "lahore", "islamabad"].includes(city.slug) ? 0.8 : 0.6,
  }));

  let eventRoutes: MetadataRoute.Sitemap = [];
  try {
    const events = await prisma.event.findMany({
      where: { reviewStatus: "approved", status: { in: ["upcoming", "ongoing"] } },
      select: { slug: true, updatedAt: true },
    });
    eventRoutes = events.map((event) => ({
      url: absoluteUrl(`/events/${event.slug}`),
      lastModified: event.updatedAt,
      changeFrequency: "daily",
      priority: 0.7,
    }));
  } catch {
    eventRoutes = [];
  }

  return [...staticRoutes, ...cityRoutes, ...eventRoutes];
}
