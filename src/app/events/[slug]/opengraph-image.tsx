import { formatCategory, formatDeadlineLabel, getEventBySlug } from "@/lib/events";
import { createOgImage } from "@/lib/og";
import { truncateText } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "HackScout event listing";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return createOgImage({
      kicker: "Listing not found",
      title: "This event is not on the radar.",
      chips: ["HackScout"],
    });
  }

  return createOgImage({
    kicker: `${event.city.name} / ${formatCategory(event.category)}`,
    title: event.title,
    description: truncateText(event.description, 140),
    chips: [
      event.city.name,
      formatCategory(event.category),
      formatDeadlineLabel(event.registrationDeadline).label,
    ],
  });
}
