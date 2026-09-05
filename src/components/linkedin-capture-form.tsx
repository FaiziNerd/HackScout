import type { SubmitCityOption } from "@/components/submit-event-form";
import { SocialPostCaptureForm } from "@/components/social-post-capture-form";

const LINKEDIN_CONFIG = {
  source: "linkedin" as const,
  extractApiPath: "/api/events/linkedin/extract",
  platformLabel: "LinkedIn",
  postUrlLabel: "LinkedIn post URL",
  postUrlPlaceholder: "https://www.linkedin.com/posts/...",
  postTextLabel: "Or copied post text",
  postTextPlaceholder: "Paste the LinkedIn announcement, caption, dates and registration link here.",
  sourcePostUrlLabel: "Original LinkedIn post",
  sourcePostUrlPlaceholder: "https://www.linkedin.com/posts/...",
  submitLabel: "File LinkedIn event",
  reviewNote: "Saved as LinkedIn source. Confirm the organizer email we send to publish.",
};

export function LinkedInCaptureForm({ cities }: { cities: SubmitCityOption[] }) {
  return <SocialPostCaptureForm cities={cities} config={LINKEDIN_CONFIG} />;
}
