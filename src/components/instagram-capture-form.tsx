import type { SubmitCityOption } from "@/components/submit-event-form";
import { SocialPostCaptureForm } from "@/components/social-post-capture-form";

const INSTAGRAM_CONFIG = {
  source: "instagram" as const,
  extractApiPath: "/api/events/instagram/extract",
  platformLabel: "Instagram",
  postUrlLabel: "Instagram post URL",
  postUrlPlaceholder: "https://www.instagram.com/p/...",
  postTextLabel: "Or copied caption text",
  postTextPlaceholder: "Paste the Instagram caption, dates and registration link here.",
  sourcePostUrlLabel: "Original Instagram post",
  sourcePostUrlPlaceholder: "https://www.instagram.com/p/...",
  submitLabel: "File Instagram event",
  reviewNote: "Saved as Instagram source. Confirm the organizer email we send to publish.",
};

export function InstagramCaptureForm({ cities }: { cities: SubmitCityOption[] }) {
  return <SocialPostCaptureForm cities={cities} config={INSTAGRAM_CONFIG} />;
}
