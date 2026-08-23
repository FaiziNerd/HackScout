import { Resend } from "resend";

import { prisma } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_EVENTS_PER_DIGEST = 12;

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!,
  );
}

function siteUrl(path = "") {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${origin}${path}`;
}

function startOfIsoWeek(date: Date) {
  const weekOf = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = weekOf.getUTCDay() || 7;
  weekOf.setUTCDate(weekOf.getUTCDate() - day + 1);
  return weekOf;
}

async function resolvePreferredCityIds(preferences: string[]) {
  if (preferences.length === 0) return [];

  const cities = await prisma.city.findMany({
    where: {
      OR: [
        { id: { in: preferences } },
        { slug: { in: preferences } },
      ],
    },
    select: { id: true },
  });

  return Array.from(new Set(cities.map((city) => city.id)));
}

export async function sendWeeklyDigests(now = new Date()) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.DEADLINE_EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY and DEADLINE_EMAIL_FROM must be configured.");
  }

  const resend = new Resend(apiKey);
  const weekOf = startOfIsoWeek(now);
  const addedAfter = new Date(now.getTime() - 7 * DAY_MS);
  const users = await prisma.user.findMany({
    where: { preferredCityIds: { isEmpty: false } },
    select: {
      id: true,
      email: true,
      name: true,
      preferredCityIds: true,
    },
  });

  let sent = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const user of users) {
    const preferredCityIds = await resolvePreferredCityIds(user.preferredCityIds);
    if (preferredCityIds.length === 0) {
      skipped++;
      continue;
    }

    const events = await prisma.event.findMany({
      where: {
        cityId: { in: preferredCityIds },
        createdAt: { gte: addedAfter, lte: now },
        reviewStatus: "approved",
        status: { in: ["upcoming", "ongoing"] },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        startDate: true,
        city: { select: { name: true } },
      },
      orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
      take: MAX_EVENTS_PER_DIGEST,
    });

    if (events.length === 0) {
      skipped++;
      continue;
    }

    const claimed = await prisma.weeklyDigest.createMany({
      data: [{ userId: user.id, weekOf, eventCount: events.length }],
      skipDuplicates: true,
    });
    if (claimed.count === 0) {
      skipped++;
      continue;
    }

    try {
      const cityNames = [...new Set(events.map((event) => event.city.name))];
      const eventLines = events.map((event) => {
        const date = event.startDate.toLocaleDateString("en-PK", {
          dateStyle: "medium",
          timeZone: "Asia/Karachi",
        });
        return `${event.title} — ${event.city.name}, ${date}: ${siteUrl(`/events/${encodeURIComponent(event.slug)}`)}`;
      });
      const eventItems = events
        .map((event) => {
          const date = event.startDate.toLocaleDateString("en-PK", {
            dateStyle: "medium",
            timeZone: "Asia/Karachi",
          });
          const url = siteUrl(`/events/${encodeURIComponent(event.slug)}`);
          return `<li style="margin-bottom:16px"><a href="${url}" style="font-weight:700;color:#111">${escapeHtml(event.title)}</a><br><span>${escapeHtml(event.city.name)} · ${escapeHtml(date)}</span></li>`;
        })
        .join("");

      const { data, error } = await resend.emails.send({
        from,
        to: user.email,
        subject: `${events.length} new ${events.length === 1 ? "event" : "events"} in ${cityNames.join(", ")}`,
        text: `Hi ${user.name ?? "there"},\n\nHere are this week's new events:\n\n${eventLines.join("\n")}\n\nBrowse all events: ${siteUrl("/events")}`,
        html: `<p>Hi ${escapeHtml(user.name ?? "there")},</p><p>Here are this week’s new events in the cities you follow.</p><ul style="padding-left:20px">${eventItems}</ul><p><a href="${siteUrl("/events")}">Browse all events</a></p>`,
      });
      if (error) throw new Error(error.message);

      await prisma.weeklyDigest.update({
        where: { userId_weekOf: { userId: user.id, weekOf } },
        data: { status: "sent", providerId: data?.id, sentAt: new Date() },
      });
      sent++;
    } catch (error) {
      await prisma.weeklyDigest.delete({
        where: { userId_weekOf: { userId: user.id, weekOf } },
      });
      failures.push(
        `${user.email}: ${error instanceof Error ? error.message : "Unknown send error"}`,
      );
    }
  }

  return {
    users: users.length,
    sent,
    skipped,
    failed: failures.length,
    failures,
    weekOf: weekOf.toISOString(),
  };
}
