import { createHmac, timingSafeEqual } from "node:crypto";

import { absoluteUrl } from "@/lib/site";

/** Publish confirmation links expire after 48 hours. */
const TTL_MS = 48 * 60 * 60 * 1000;

function signingSecret() {
  const configured =
    process.env.PUBLISH_TOKEN_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV !== "production") {
    return "dev-publish-token-insecure";
  }
  throw new Error("Set PUBLISH_TOKEN_SECRET or CRON_SECRET to sign publish links.");
}

export function createPublishToken(eventId: string) {
  const exp = Date.now() + TTL_MS;
  const payload = `${eventId}.${exp}`;
  const sig = createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyPublishToken(token: string): { eventId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [eventId, expRaw, sig] = parts;
  const exp = Number(expRaw);
  if (!eventId || !Number.isFinite(exp) || Date.now() > exp) return null;

  const payload = `${eventId}.${expRaw}`;
  const expected = createHmac("sha256", signingSecret()).update(payload).digest("base64url");

  try {
    const left = Buffer.from(sig);
    const right = Buffer.from(expected);
    if (left.length !== right.length || !timingSafeEqual(left, right)) {
      return null;
    }
  } catch {
    return null;
  }

  return { eventId };
}

export function publishConfirmUrl(token: string) {
  return absoluteUrl(`/publish/confirm?token=${encodeURIComponent(token)}`);
}
