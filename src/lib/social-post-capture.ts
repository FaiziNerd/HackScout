import type { EventCategory } from "@/generated/prisma/client";

/** Structured draft from a pasted social post (LinkedIn, Instagram, etc.). */
export type SocialPostEventDraft = {
  title: string;
  description: string;
  category: EventCategory;
  citySlug: string;
  venue: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  registrationUrl: string;
  organizerName: string;
  prizePool: string;
  sourcePostUrl: string;
  confidenceNotes: string[];
};

export function mergeSocialPostDrafts(
  primary: SocialPostEventDraft,
  fallback: SocialPostEventDraft,
): SocialPostEventDraft {
  const pick = (primaryValue: string, fallbackValue: string) =>
    primaryValue.trim() ? primaryValue : fallbackValue;

  const notes = new Set([...primary.confidenceNotes, ...fallback.confidenceNotes]);

  return {
    title: pick(primary.title, fallback.title),
    description: pick(primary.description, fallback.description),
    category: primary.category !== "other" ? primary.category : fallback.category,
    citySlug: pick(primary.citySlug, fallback.citySlug) || "karachi",
    venue: pick(primary.venue, fallback.venue),
    startDate: pick(primary.startDate, fallback.startDate),
    endDate: pick(primary.endDate, fallback.endDate),
    registrationDeadline: pick(primary.registrationDeadline, fallback.registrationDeadline),
    registrationUrl: pick(primary.registrationUrl, fallback.registrationUrl),
    organizerName: pick(primary.organizerName, fallback.organizerName),
    prizePool: pick(primary.prizePool, fallback.prizePool),
    sourcePostUrl: pick(primary.sourcePostUrl, fallback.sourcePostUrl),
    confidenceNotes: Array.from(notes),
  };
}
