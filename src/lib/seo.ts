import { formatCategory } from "@/lib/events";
import { SITE_NAME, SITE_TAGLINE, absoluteUrl, truncateText } from "@/lib/site";
import type { EventCategory } from "@/generated/prisma/client";

export function websiteJsonLd() {
  const url = absoluteUrl("/");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}#organization`,
        name: SITE_NAME,
        url,
        description: SITE_TAGLINE,
        areaServed: { "@type": "Country", name: "Pakistan" },
      },
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        name: SITE_NAME,
        url,
        description: SITE_TAGLINE,
        publisher: { "@id": `${url}#organization` },
        inLanguage: "en-PK",
        potentialAction: {
          "@type": "SearchAction",
          target: `${absoluteUrl("/events")}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export function eventJsonLd(event: {
  slug: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date | null;
  registrationDeadline: Date | null;
  venue: string | null;
  isOnline: boolean;
  organizerName: string | null;
  coverImage: string | null;
  registrationUrl: string | null;
  sourceUrl: string;
  status: string;
  city: { name: string; slug: string };
}) {
  const url = absoluteUrl(`/events/${event.slug}`);
  const attendance = event.isOnline
    ? "https://schema.org/OnlineEventAttendanceMode"
    : "https://schema.org/OfflineEventAttendanceMode";
  const status =
    event.status === "closed"
      ? "https://schema.org/EventCancelled"
      : "https://schema.org/EventScheduled";

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: truncateText(event.description, 300),
    url,
    image: event.coverImage ? [event.coverImage] : [absoluteUrl(`/events/${event.slug}/opengraph-image`)],
    startDate: event.startDate.toISOString(),
    endDate: (event.endDate ?? event.startDate).toISOString(),
    eventStatus: status,
    eventAttendanceMode: attendance,
    location: event.isOnline
      ? { "@type": "VirtualLocation", url }
      : {
          "@type": "Place",
          name: event.venue || event.city.name,
          address: {
            "@type": "PostalAddress",
            addressLocality: event.city.name,
            addressCountry: "PK",
          },
        },
    organizer: {
      "@type": "Organization",
      name: event.organizerName || SITE_NAME,
    },
    offers: {
      "@type": "Offer",
      url: event.registrationUrl || event.sourceUrl || url,
      availability:
        event.registrationDeadline && event.registrationDeadline.getTime() < Date.now()
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
      validThrough: event.registrationDeadline?.toISOString(),
    },
  };
}

export function cityCollectionJsonLd(cityName: string, slug: string, eventCount: number) {
  const url = absoluteUrl(`/cities/${slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `All Events in ${cityName}, Pakistan`,
    description: `Hackathons, conferences, workshops, and meetups in ${cityName}. ${eventCount} open listings, sorted by registration deadline.`,
    url,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/") },
    about: {
      "@type": "City",
      name: cityName,
      containedInPlace: { "@type": "Country", name: "Pakistan" },
    },
  };
}

export function citySeoTitle(cityName: string, year = new Date().getFullYear()) {
  return `Hackathons in ${cityName} ${year}`;
}

export function citySeoDescription(cityName: string, year = new Date().getFullYear()) {
  return `All events in ${cityName}, Pakistan — hackathons, conferences, workshops, and meetups for ${year}. Sorted by registration deadline on HackScout.`;
}

export function eventShareText(event: {
  title: string;
  cityName: string;
  category: EventCategory;
  registrationDeadline: Date | null;
}) {
  const deadline = event.registrationDeadline
    ? event.registrationDeadline.toLocaleDateString("en-PK", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "soon";
  return `Found this on HackScout — ${event.title} (${formatCategory(event.category)}) in ${event.cityName}. Registration closes ${deadline}.`;
}
