import { extractEventFromText } from "@/ai/extract-event";
import type { SocialPostEventDraft } from "@/lib/social-post-capture";
import { mergeSocialPostDrafts } from "@/lib/social-post-capture";

export async function extractSocialPostDraft(input: {
  text: string;
  sourcePostUrl?: string;
  heuristic: (value: { text: string; sourcePostUrl?: string }) => SocialPostEventDraft;
}): Promise<{ draft: SocialPostEventDraft; usedAi: boolean }> {
  const heuristicDraft = input.heuristic({
    text: input.text,
    sourcePostUrl: input.sourcePostUrl,
  });

  const aiDraft = await extractEventFromText(input.text, {
    sourcePostUrl: input.sourcePostUrl,
  });

  if (!aiDraft) {
    return { draft: heuristicDraft, usedAi: false };
  }

  const merged = mergeSocialPostDrafts(aiDraft, heuristicDraft);
  if (!merged.confidenceNotes.some((note) => /ai/i.test(note))) {
    merged.confidenceNotes.unshift("Draft fields were AI-extracted. Verify dates, city, and registration link.");
  }

  return { draft: merged, usedAi: true };
}
