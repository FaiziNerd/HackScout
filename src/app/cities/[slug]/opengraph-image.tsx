import { PAKISTAN_CITIES } from "@/lib/cities";
import { getCityBySlug, getUpcomingEvents } from "@/lib/events";
import { createOgImage } from "@/lib/og";
import { citySeoDescription } from "@/lib/seo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "HackScout city event desk";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [city, events] = await Promise.all([getCityBySlug(slug), getUpcomingEvents({ city: slug })]);
  const fallback = PAKISTAN_CITIES.find((item) => item.slug === slug);
  const cityName = city?.name || fallback?.name || slug;

  return createOgImage({
    kicker: `City desk / ${cityName}`,
    title: `Events in ${cityName}`,
    description: citySeoDescription(cityName),
    chips: [`${events.length} open`, city?.province || fallback?.province || "Pakistan"],
  });
}
