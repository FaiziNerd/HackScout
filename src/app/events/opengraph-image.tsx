import { createOgImage } from "@/lib/og";

export const alt = "Explore tech events in Pakistan on HackScout";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return createOgImage({
    kicker: "Live directory / Pakistan",
    title: "The open event index.",
    description: "Browse hackathons, conferences, and developer meetups in every city.",
    chips: ["Nationwide", "City desks", "Closing soonest first"],
  });
}
