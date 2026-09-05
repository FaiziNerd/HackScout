import { Resend } from "resend";

import type { ScrapeStatus } from "@/generated/prisma/client";

export interface ScraperRunAlert {
  source: string;
  status: ScrapeStatus;
  eventsFound: number;
  inserted: number;
  merged: number;
  errors: string[];
}

function adminRecipients(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(/[\n,]+/)
    .map((email) => email.trim())
    .filter(Boolean);
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!,
  );
}

/** Email admins when one or more scraper sources fail or only partially succeed. */
export async function notifyScraperFailures(summaries: ScraperRunAlert[]) {
  const failures = summaries.filter((summary) => summary.status === "failed" || summary.status === "partial");
  if (failures.length === 0) return { sent: false, reason: "no_failures" as const };

  const recipients = adminRecipients();
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.DEADLINE_EMAIL_FROM;
  if (!recipients.length || !apiKey || !from) {
    return { sent: false, reason: "missing_mail_config" as const };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const lines = failures.map((summary) => {
    const headline = `${summary.source}: ${summary.status} — found ${summary.eventsFound}, inserted ${summary.inserted}, merged ${summary.merged}`;
    const detail = summary.errors.slice(0, 3).join(" | ") || "No error detail recorded.";
    return `${headline}\n${detail}`;
  });

  const subject = `[HackScout] ${failures.length} scraper source${failures.length === 1 ? "" : "s"} need attention`;
  const text = `HackScout scraper run finished with issues.\n\n${lines.join("\n\n")}\n\nReview logs: ${siteUrl}/admin`;
  const html = `<p>HackScout scraper run finished with issues.</p><ul>${failures
    .map(
      (summary) =>
        `<li><strong>${escapeHtml(summary.source)}</strong> (${escapeHtml(summary.status)}) — found ${summary.eventsFound}, inserted ${summary.inserted}, merged ${summary.merged}<br>${escapeHtml(summary.errors.slice(0, 3).join(" | ") || "No error detail recorded.")}</li>`,
    )
    .join("")}</ul><p><a href="${siteUrl}/admin">Open admin review</a></p>`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: recipients,
    subject,
    text,
    html,
  });

  if (error) {
    console.error("[scrapers] failed to send alert email:", error.message);
    return { sent: false, reason: "send_failed" as const };
  }

  return { sent: true, reason: "sent" as const };
}

/** Warn when production scrapers lack optional URL configuration. */
export function scraperConfigWarnings(): string[] {
  const warnings: string[] = [];

  if (!process.env.FACEBOOK_EVENT_URLS?.trim() && !process.env.FACEBOOK_PAGE_URLS?.trim()) {
    warnings.push(
      "FACEBOOK_PAGE_URLS unset — using built-in university/GDG page defaults. Set FACEBOOK_PAGE_URLS to override.",
    );
  }

  if (!process.env.LUMA_PAGE_URLS?.trim() && !process.env.LUMA_CALENDAR_SLUGS?.trim()) {
    warnings.push("LUMA_PAGE_URLS and LUMA_CALENDAR_SLUGS are empty — relying on discover-page crawl only.");
  }

  return warnings;
}
