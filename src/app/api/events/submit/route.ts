import { NextResponse } from "next/server";
import { z } from "zod";

import { createPendingCommunityEvent } from "@/lib/submissions";

const submitSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.enum([
    "hackathon",
    "conference",
    "workshop",
    "meetup",
    "competition",
    "seminar",
    "career_fair",
    "festival",
    "other",
  ]),
  citySlug: z.string().min(1),
  venue: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  registrationDeadline: z.string(),
  registrationUrl: z.string().url(),
  organizerName: z.string().min(2),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = submitSchema.parse(body);

    const event = await createPendingCommunityEvent({
      ...data,
      source: "community",
      isOnline: data.citySlug === "online",
    });

    return NextResponse.json({
      ok: true,
      eventId: event.id,
      slug: event.slug,
      message: "Event submitted for review. It will appear after admin approval.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Submission failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
