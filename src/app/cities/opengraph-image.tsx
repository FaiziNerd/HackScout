import { createOgImage } from "@/lib/og";

export const alt = "Browse HackScout city desks across Pakistan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return createOgImage({
    kicker: "Geographic wire",
    title: "Find your local tech signal.",
    description: "City desks from Karachi to Gilgit — university circuits, meetups, and open competitions.",
    chips: ["All provinces", "Online included"],
  });
}
