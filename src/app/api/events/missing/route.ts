import { NextResponse } from "next/server";
import { z } from "zod";

import { createMissingEventReport } from "@/lib/missing-events";

const missingSchema = z
  .object({
    title: z.string().trim().min(3, "Event name needs at least 3 characters."),
    citySlug: z.string().min(1, "Choose a city."),
    customCityName: z.string().trim().optional(),
    sourceUrl: z.union([z.string().url("Enter a valid event or post URL."), z.literal("")]).optional(),
    description: z.string().trim().optional(),
    pagePath: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.citySlug === "other" && (!data.customCityName || data.customCityName.length < 2)) {
      ctx.addIssue({
        code: "custom",
        message: "Enter the city name if it is not in the list.",
        path: ["customCityName"],
      });
    }
    const hasLink = Boolean(data.sourceUrl);
    const hasNote = Boolean(data.description && data.description.length >= 8);
    if (!hasLink && !hasNote) {
      ctx.addIssue({
        code: "custom",
        message: "Add a link or a short note about the event.",
        path: ["description"],
      });
    }
  });

function errorMessage(err: unknown) {
  if (err instanceof z.ZodError) {
    return err.issues[0]?.message || "Check the form and try again.";
  }
  if (err instanceof Error) return err.message;
  return "Could not send this tip.";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = missingSchema.parse(body);

    await createMissingEventReport({
      title: data.title,
      citySlug: data.citySlug,
      customCityName: data.customCityName,
      sourceUrl: data.sourceUrl || undefined,
      description: data.description || undefined,
      pagePath: data.pagePath || undefined,
    });

    return NextResponse.json({
      ok: true,
      message: "Tip received. The desk will look it up and add it if it belongs on the radar.",
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: errorMessage(err) }, { status: 400 });
  }
}
