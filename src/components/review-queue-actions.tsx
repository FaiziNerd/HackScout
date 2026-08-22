"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface CityOption {
  id: string;
  name: string;
  slug: string;
}

interface ReviewQueueActionsProps {
  eventId: string;
  currentCityId: string;
  reviewStatus: "pending" | "approved" | "rejected";
  cities: CityOption[];
}

export function ReviewQueueActions({
  eventId,
  currentCityId,
  reviewStatus,
  cities,
}: ReviewQueueActionsProps) {
  const router = useRouter();
  const [cityId, setCityId] = useState(currentCityId);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: "approve" | "reject") {
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/admin/events/${eventId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, cityId }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(data.error || "Could not update this filing.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-5 space-y-3 border-t border-foreground/20 pt-4">
      <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        City
        <select
          value={cityId}
          onChange={(event) => setCityId(event.target.value)}
          disabled={pending}
          className="mt-1 min-h-11 w-full border-2 border-foreground bg-background px-3 text-sm text-foreground"
        >
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        {reviewStatus !== "approved" ? (
          <button
            type="button"
            onClick={() => run("approve")}
            disabled={pending}
            className="inline-flex min-h-11 items-center bg-foreground px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-background hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
          >
            {pending ? "Working…" : "Publish"}
          </button>
        ) : null}
        {reviewStatus !== "rejected" ? (
          <button
            type="button"
            onClick={() => run("reject")}
            disabled={pending}
            className="inline-flex min-h-11 items-center border-2 border-foreground px-4 text-[10px] font-semibold uppercase tracking-[0.14em] hover:bg-destructive hover:text-white disabled:opacity-50"
          >
            Reject
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
