import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getSavedEventContext() {
  const user = await getAuthUser();
  if (!user) {
    return { signedIn: false as const, savedIds: new Set<string>() };
  }

  return {
    signedIn: true as const,
    savedIds: await getSavedEventIds(user.id),
  };
}

export async function getSavedEventIds(userId: string) {
  const rows = await prisma.savedEvent.findMany({
    where: { userId },
    select: { eventId: true },
  });

  return new Set(rows.map((row) => row.eventId));
}

export async function isEventSaved(userId: string, eventId: string) {
  const row = await prisma.savedEvent.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { eventId: true },
  });

  return Boolean(row);
}

export async function toggleSavedEvent(userId: string, eventId: string) {
  const existing = await prisma.savedEvent.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { eventId: true },
  });

  if (existing) {
    await prisma.savedEvent.delete({
      where: { userId_eventId: { userId, eventId } },
    });
    return { saved: false };
  }

  await prisma.savedEvent.create({
    data: { userId, eventId },
  });

  return { saved: true };
}

export async function getSavedEvents(userId: string) {
  const rows = await prisma.savedEvent.findMany({
    where: {
      userId,
      event: { reviewStatus: "approved" },
    },
    include: {
      event: { include: { city: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => row.event);
}
