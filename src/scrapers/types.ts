import type { EventCategory, EventSource, RegistrationType } from "@/generated/prisma/client";

/**
 * Raw scraped event data before DB normalization and deduplication.
 */
export interface ScrapedEventInput {
  title: string;
  description: string;
  coverImage?: string | null;
  category: EventCategory;
  source: EventSource;
  sourceUrl: string;
  sourcePostUrl?: string | null;
  startDate: Date | string;
  endDate?: Date | string | null;
  registrationDeadline?: Date | string | null;
  rawLocation?: string | null;
  venue?: string | null;
  isOnline?: boolean;
  tags?: string[];
  prizePool?: string | null;
  organizerName?: string | null;
  registrationType?: RegistrationType;
  registrationUrl?: string | null;
}

/**
 * Result returned by an individual source scraper.
 */
export interface ScraperResult {
  source: EventSource;
  events: ScrapedEventInput[];
  errors?: string[];
}

/**
 * Normalized event ready for DB insertion or deduplication matching.
 */
export interface NormalizedScrapedEvent {
  title: string;
  slug: string;
  description: string;
  coverImage?: string | null;
  category: EventCategory;
  country: string;
  source: EventSource;
  sourceUrl: string;
  sourcePostUrl?: string | null;
  startDate: Date;
  endDate?: Date | null;
  registrationDeadline?: Date | null;
  citySlug: string;
  venue?: string | null;
  isOnline: boolean;
  tags: string[];
  prizePool?: string | null;
  organizerName?: string | null;
  registrationType: RegistrationType;
  registrationUrl?: string | null;
}
