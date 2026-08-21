import type { EventCategory } from "@/generated/prisma/client";
import { formatCategory } from "@/lib/events";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  category: EventCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center border border-primary bg-primary px-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-primary-foreground",
        className
      )}
    >
      {formatCategory(category)}
    </span>
  );
}
