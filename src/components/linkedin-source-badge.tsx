import type { EventSource } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

interface LinkedInSourceBadgeProps {
  source: EventSource;
  sources?: EventSource[];
  className?: string;
}

export function hasLinkedInSource(source: EventSource, sources: EventSource[] = []) {
  return source === "linkedin" || sources.includes("linkedin");
}

export function LinkedInSourceBadge({ source, sources = [], className }: LinkedInSourceBadgeProps) {
  if (!hasLinkedInSource(source, sources)) return null;

  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center border border-foreground/40 bg-background px-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-foreground",
        className,
      )}
    >
      Saw it on LinkedIn?
    </span>
  );
}
