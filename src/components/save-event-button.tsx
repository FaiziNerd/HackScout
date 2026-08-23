"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BookmarkSimple } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

interface SaveEventButtonProps {
  slug: string;
  initialSaved?: boolean;
  signedIn?: boolean;
  variant?: "card" | "detail";
  className?: string;
}

export function SaveEventButton({
  slug,
  initialSaved = false,
  signedIn = false,
  variant = "card",
  className,
}: SaveEventButtonProps) {
  const router = useRouter();
  const [optimisticSaved, setOptimisticSaved] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isSaved = optimisticSaved ?? initialSaved;

  async function toggleSave() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(`/events/${slug}`)}`);
      return;
    }

    setError(null);
    const previous = isSaved;
    setOptimisticSaved(!previous);

    try {
      const response = await fetch(`/api/events/${slug}/save`, { method: "POST" });
      const payload = (await response.json()) as { saved?: boolean; error?: string };

      if (!response.ok) {
        setOptimisticSaved(previous);
        setError(payload.error ?? "Could not save this listing.");
        return;
      }

      setOptimisticSaved(Boolean(payload.saved));
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setOptimisticSaved(previous);
      setError("Could not save this listing.");
    }
  }

  const filled = isSaved && signedIn;
  const label = !signedIn ? "Sign in to save" : filled ? "Saved" : "Save event";

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={toggleSave}
        disabled={pending}
        aria-label={label}
        aria-pressed={signedIn ? isSaved : undefined}
        title={label}
        className={cn(
          "absolute top-4 right-4 z-10 grid size-10 place-items-center border-2 border-foreground bg-background text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-60",
          filled && "bg-primary text-primary-foreground hover:bg-foreground hover:text-background",
          className
        )}
      >
        <BookmarkSimple aria-hidden className="size-5" weight={filled ? "fill" : "regular"} />
      </button>
    );
  }

  return (
    <div className={cn("mt-4", className)}>
      <button
        type="button"
        onClick={toggleSave}
        disabled={pending}
        aria-pressed={signedIn ? isSaved : undefined}
        className={cn(
          "flex min-h-12 w-full items-center justify-center gap-2 border-2 border-foreground px-4 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-foreground hover:text-background disabled:opacity-60",
          filled
            ? "bg-primary text-primary-foreground hover:bg-foreground hover:text-background"
            : "bg-card"
        )}
      >
        <BookmarkSimple aria-hidden className="size-4" weight={filled ? "fill" : "regular"} />
        {pending ? "Updating…" : label}
      </button>
      {error ? (
        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-destructive">{error}</p>
      ) : (
        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
          {signedIn
            ? "Pins land on your saved desk. Deadline emails come later."
            : "Needs a desk pass. You will return to this listing after sign-in."}
        </p>
      )}
    </div>
  );
}
