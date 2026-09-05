import { cn } from "@/lib/utils";

interface ScoutBadgeProps {
  className?: string;
}

export function ScoutBadge({ className }: ScoutBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center border border-primary bg-primary px-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-primary-foreground",
        className,
      )}
    >
      Scout
    </span>
  );
}
