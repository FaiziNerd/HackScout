import { formatDeadlineLabel } from "@/lib/events";
import { cn } from "@/lib/utils";

interface DeadlineBadgeProps {
  deadline: Date | null;
  className?: string;
}

export function DeadlineBadge({ deadline, className }: DeadlineBadgeProps) {
  const { label, isUrgent } = formatDeadlineLabel(deadline);

  return (
    <span
      className={cn(
        "deadline-stamp inline-flex min-h-7 items-center border-2 px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.1em]",
        isUrgent
          ? "border-primary bg-primary text-primary-foreground"
          : "border-foreground bg-background text-foreground",
        className
      )}
      aria-label={`Registration deadline: ${label}`}
      title={
        deadline
          ? `Registration deadline: ${deadline.toLocaleDateString("en-PK", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}`
          : "No registration deadline announced"
      }
    >
      {label}
    </span>
  );
}
