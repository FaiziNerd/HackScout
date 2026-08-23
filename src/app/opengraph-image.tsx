import { createOgImage } from "@/lib/og";

export const alt = "HackScout — Pakistan's developer and tech event hub";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return createOgImage({
    kicker: "National event radar",
    title: "Har event, har shehar.",
    description: "Hackathons, conferences, workshops, and meetups across Pakistan — sorted by deadline.",
    chips: ["Pakistan", "Deadline-first", "Open to browse"],
  });
}
