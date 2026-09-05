import { Resend } from "resend";

import { createPublishToken, publishConfirmUrl } from "@/lib/publish-token";
import { absoluteUrl } from "@/lib/site";

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!,
  );
}

export async function sendPublishConfirmationEmail(input: {
  organizerEmail: string;
  eventTitle: string;
  eventId: string;
}) {
  const token = createPublishToken(input.eventId);
  const confirmUrl = publishConfirmUrl(token);

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.DEADLINE_EMAIL_FROM;
  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[publish-confirm] email not configured; use this link:", confirmUrl);
    }
    return { sent: false as const, reason: "email_not_configured" as const, confirmUrl };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: input.organizerEmail,
    subject: `Confirm & publish: ${input.eventTitle}`,
    html: `
      <p>You filed <strong>${escapeHtml(input.eventTitle)}</strong> on HackScout.</p>
      <p>Click below to verify this inbox and publish the listing. The link expires in 48 hours.</p>
      <p><a href="${escapeHtml(confirmUrl)}">Publish this event</a></p>
      <p>If you did not submit this, ignore the email.</p>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { sent: true as const, confirmUrl };
}

export async function notifyOrganizerOfRegistration(input: {
  organizerEmail: string;
  eventTitle: string;
  eventSlug: string;
  registrantEmail: string;
  registrantName?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.DEADLINE_EMAIL_FROM;
  if (!apiKey || !from) {
    return { sent: false as const, reason: "email_not_configured" as const };
  }

  const resend = new Resend(apiKey);
  const url = absoluteUrl(`/events/${encodeURIComponent(input.eventSlug)}`);
  const csvUrl = absoluteUrl(
    `/api/events/${encodeURIComponent(input.eventSlug)}/registrations?format=csv`,
  );
  const name = input.registrantName?.trim() || "A registrant";

  const { error } = await resend.emails.send({
    from,
    to: input.organizerEmail,
    subject: `New signup: ${input.eventTitle}`,
    html: `
      <p><strong>${escapeHtml(name)}</strong> (${escapeHtml(input.registrantEmail)}) registered for <strong>${escapeHtml(input.eventTitle)}</strong>.</p>
      <p><a href="${escapeHtml(url)}">View event</a> · <a href="${escapeHtml(csvUrl)}">Download CSV</a> (sign in with this organizer email)</p>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { sent: true as const };
}
