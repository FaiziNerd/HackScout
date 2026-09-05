"use client";

import { Crosshair, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { findNearestCitySlug } from "@/lib/cities";
import { cn } from "@/lib/utils";

interface NearYouButtonProps {
  category?: string;
  search?: string;
  className?: string;
}

export function NearYouButton({ category, search, className }: NearYouButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  function buildHref(citySlug: string) {
    const params = new URLSearchParams();
    params.set("city", citySlug);
    if (category) params.set("category", category);
    if (search) params.set("q", search);
    return `/events?${params.toString()}`;
  }

  function locate() {
    if (!navigator.geolocation) {
      setStatus("error");
      setMessage("Location is not supported in this browser.");
      return;
    }

    setStatus("loading");
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const slug = findNearestCitySlug(position.coords.latitude, position.coords.longitude);
        if (!slug) {
          setStatus("error");
          setMessage("Could not match a nearby city desk.");
          return;
        }
        setStatus("idle");
        router.push(buildHref(slug));
      },
      (error) => {
        setStatus("error");
        if (error.code === error.PERMISSION_DENIED) {
          setMessage("Location permission denied — pick a city desk instead.");
        } else {
          setMessage("Could not read your location. Try again or pick a city.");
        }
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <button
        type="button"
        onClick={locate}
        disabled={status === "loading"}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 border border-foreground px-3 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors",
          "hover:border-foreground hover:bg-card disabled:opacity-60",
        )}
      >
        {status === "loading" ? (
          <SpinnerGap aria-hidden className="size-4 animate-spin" />
        ) : (
          <Crosshair aria-hidden className="size-4 text-primary" />
        )}
        Near you
      </button>
      {message ? (
        <p className="flex items-start gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
          <WarningCircle aria-hidden className="mt-0.5 size-3 shrink-0" />
          {message}
        </p>
      ) : null}
    </div>
  );
}
