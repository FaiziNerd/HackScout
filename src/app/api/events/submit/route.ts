import { NextResponse } from "next/server";
import { z } from "zod";

import { createPendingCommunityEvent } from "@/lib/submissions";

const submitSchema = z
  .object({
    title: z.string().trim().min(3, "Event title needs at least 3 characters."),
    description: z.string().trim().min(20, "Add a short description (at least 20 characters)."),
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
    citySlug: z.string().min(1, "Choose a city."),
    customCityName: z.string().trim().optional(),
    venue: z.string().trim().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date is required."),
    endDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]).optional(),
    registrationDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Registration deadline is required."),
    registrationType: z.enum(["external", "native"]).default("external"),
    registrationUrl: z.union([z.string().url("Enter a valid registration URL."), z.literal("")]).optional(),
    formFields: z.unknown().optional(),
    organizerName: z.string().trim().min(2, "Organizer name is required."),
    prizePool: z.string().trim().optional(),
    source: z.enum(["community", "linkedin"]).default("community"),
    sourcePostUrl: z.union([z.string().url("Enter a valid source post URL."), z.literal("")]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.citySlug === "other" && (!data.customCityName || data.customCityName.length < 2)) {
      ctx.addIssue({
        code: "custom",
        message: "Enter the city name if it is not in the list.",
        path: ["customCityName"],
      });
    }
    if (data.registrationType === "external" && !data.registrationUrl) {
      ctx.addIssue({
        code: "custom",
        message: "Official registration URL is required for external signup.",
        path: ["registrationUrl"],
      });
    }
  });

function errorMessage(err: unknown) {
  if (err instanceof z.ZodError) {
    return err.issues[0]?.message || "Check the form and try again.";
  }
  if (err instanceof Error) return err.message;
  return "Submission failed";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = submitSchema.parse(body);

    const event = await createPendingCommunityEvent({
      ...data,
      endDate: data.endDate || undefined,
      venue: data.venue || undefined,
      prizePool: data.prizePool || undefined,
      customCityName: data.customCityName || undefined,
      registrationUrl: data.registrationUrl || undefined,
      source: data.source,
      sourcePostUrl: data.sourcePostUrl || undefined,
      isOnline: data.citySlug === "online",
    });

    return NextResponse.json({
      ok: true,
      eventId: event.id,
      slug: event.slug,
      message: "Event filed for review. It will appear on HackScout after the desk verifies it.",
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: errorMessage(err) }, { status: 400 });
  }
}
