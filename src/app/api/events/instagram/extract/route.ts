import { NextResponse } from "next/server";
import { z } from "zod";

import { extractSocialPostDraft } from "@/lib/extract-social-post";
import {
  extractInstagramEventDraft,
  fetchPublicInstagramText,
  isInstagramUrl,
} from "@/lib/instagram-capture";

const extractSchema = z
  .object({
    postUrl: z.union([z.string().trim().url(), z.literal("")]).optional(),
    postText: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.postUrl || data.postText), {
    message: "Paste an Instagram URL or the caption text.",
  });

function errorMessage(err: unknown) {
  if (err instanceof z.ZodError) {
    return err.issues[0]?.message || "Check the Instagram capture and try again.";
  }
  if (err instanceof Error) return err.message;
  return "Instagram capture failed.";
}

export async function POST(request: Request) {
  try {
    const body = extractSchema.parse(await request.json());
    let text = body.postText || "";
    let warning = "";

    if (body.postUrl) {
      if (!isInstagramUrl(body.postUrl)) {
        throw new Error("Use an Instagram post URL, or paste the caption text instead.");
      }

      try {
        const fetched = await fetchPublicInstagramText(body.postUrl);
        text = [text, fetched.text].filter(Boolean).join("\n\n");
      } catch (err) {
        warning = err instanceof Error ? err.message : "Public Instagram fetch failed.";
        if (!text) throw new Error(`${warning} Paste the caption text to continue.`);
      }
    }

    const { draft, usedAi } = await extractSocialPostDraft({
      text,
      sourcePostUrl: body.postUrl || undefined,
      heuristic: extractInstagramEventDraft,
    });

    return NextResponse.json({
      ok: true,
      draft,
      warning,
      usedAi,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: errorMessage(err) }, { status: 400 });
  }
}
