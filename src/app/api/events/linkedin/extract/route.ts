import { NextResponse } from "next/server";
import { z } from "zod";

import {
  extractLinkedInEventDraft,
  fetchPublicLinkedInText,
  isLinkedInUrl,
} from "@/lib/linkedin-capture";

const extractSchema = z
  .object({
    postUrl: z.union([z.string().trim().url(), z.literal("")]).optional(),
    postText: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.postUrl || data.postText), {
    message: "Paste a LinkedIn URL or the post text.",
  });

function errorMessage(err: unknown) {
  if (err instanceof z.ZodError) {
    return err.issues[0]?.message || "Check the LinkedIn capture and try again.";
  }
  if (err instanceof Error) return err.message;
  return "LinkedIn capture failed.";
}

export async function POST(request: Request) {
  try {
    const body = extractSchema.parse(await request.json());
    let text = body.postText || "";
    let warning = "";

    if (body.postUrl) {
      if (!isLinkedInUrl(body.postUrl)) {
        throw new Error("Use a LinkedIn post URL, or paste the post text instead.");
      }

      try {
        const fetched = await fetchPublicLinkedInText(body.postUrl);
        text = [text, fetched.text].filter(Boolean).join("\n\n");
      } catch (err) {
        warning = err instanceof Error ? err.message : "Public LinkedIn fetch failed.";
        if (!text) throw new Error(`${warning} Paste the post text to continue.`);
      }
    }

    const draft = extractLinkedInEventDraft({
      text,
      sourcePostUrl: body.postUrl || undefined,
    });

    return NextResponse.json({
      ok: true,
      draft,
      warning,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: errorMessage(err) }, { status: 400 });
  }
}
