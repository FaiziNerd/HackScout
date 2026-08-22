import { Resend } from "resend";

import { prisma } from "@/lib/db";

const DAY_MS = 24 * 60 * 60 * 1000;

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!,
  );
}

function eventUrl(slug: string) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${siteUrl}/events/${encodeURIComponent(slug)}`;
}

export async function sendDueDeadlineReminders(now = new Date()) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.DEADLINE_EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY and DEADLINE_EMAIL_FROM must be configured.");
  }

  const resend = new Resend(apiKey);
  const dueBefore = new Date(now.getTime() + 3 * DAY_MS);
  const saves = await prisma.savedEvent.findMany({
    where: {
      event: {
        reviewStatus: "approved",
        status: "upcoming",
        registrationDeadline: { gt: now, lte: dueBefore },
      },
    },
    select: {
      user: { select: { id: true, email: true, name: true } },
      event: {
        select: {
          id: true,
          slug: true,
          title: true,
          registrationDeadline: true,
          city: { select: { name: true } },
        },
      },
    },
  });

  let sent = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const save of saves) {
    const deadline = save.event.registrationDeadline;
    if (!deadline) continue;

    const daysBefore = deadline.getTime() - now.getTime() <= DAY_MS ? 1 : 3;
    const claimed = await prisma.deadlineReminder.createMany({
      data: [{ userId: save.user.id, eventId: save.event.id, daysBefore }],
      skipDuplicates: true,
    });

    if (claimed.count === 0) {
      skipped++;
      continue;
    }

    try {
      const url = eventUrl(save.event.slug);
      const deadlineText = deadline.toLocaleString("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Karachi",
      });
      const { data, error } = await resend.emails.send({
        from,
        to: save.user.email,
        subject: `${daysBefore === 1 ? "Tomorrow" : "3 days left"}: ${save.event.title}`,
        text: `Hi ${save.user.name ?? "there"}, registration for ${save.event.title} closes ${deadlineText}. View the event: ${url}`,
        html: `<p>Hi ${escapeHtml(save.user.name ?? "there")},</p><p>Registration for <strong>${escapeHtml(save.event.title)}</strong> in ${escapeHtml(save.event.city.name)} closes on ${escapeHtml(deadlineText)}.</p><p><a href="${url}">View event and register</a></p>`,
      });

      if (error) throw new Error(error.message);

      await prisma.deadlineReminder.update({
        where: {
          userId_eventId_daysBefore: {
            userId: save.user.id,
            eventId: save.event.id,
            daysBefore,
          },
        },
        data: { status: "sent", providerId: data?.id, sentAt: new Date() },
      });
      sent++;
    } catch (error) {
      await prisma.deadlineReminder.delete({
        where: {
          userId_eventId_daysBefore: {
            userId: save.user.id,
            eventId: save.event.id,
            daysBefore,
          },
        },
      });
      failures.push(
        `${save.user.email}: ${error instanceof Error ? error.message : "Unknown send error"}`,
      );
    }
  }

  return { due: saves.length, sent, skipped, failed: failures.length, failures };
}
