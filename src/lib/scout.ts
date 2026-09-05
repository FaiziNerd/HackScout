import { prisma } from "@/lib/db";

const SCOUT_SOURCES = ["community", "linkedin", "instagram"] as const;

/** Approved community/LinkedIn/Instagram submissions attributed to this user. */
export async function countScoutContributions(userId: string) {
  return prisma.event.count({
    where: {
      submittedByUserId: userId,
      reviewStatus: "approved",
      source: { in: [...SCOUT_SOURCES] },
    },
  });
}

export async function userHasScoutBadge(userId: string) {
  return (await countScoutContributions(userId)) >= 1;
}
