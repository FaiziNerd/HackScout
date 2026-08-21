import { MapPin } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";

interface CityBadgeProps {
  cityName: string;
  className?: string;
}

export function CityBadge({ cityName, className }: CityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 border border-foreground/40 bg-background px-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-foreground",
        className
      )}
    >
      <MapPin aria-hidden className="size-3 text-primary" />
      {cityName}
    </span>
  );
}
