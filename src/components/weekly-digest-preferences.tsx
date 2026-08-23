"use client";

import { useState } from "react";
import { EnvelopeSimple } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

type DigestCity = {
  id: string;
  slug: string;
  name: string;
  province: string | null;
  isVirtual: boolean;
};

interface WeeklyDigestPreferencesProps {
  cities: DigestCity[];
  initialCityIds: string[];
}

export function WeeklyDigestPreferences({
  cities,
  initialCityIds,
}: WeeklyDigestPreferencesProps) {
  const [selectedCityIds, setSelectedCityIds] = useState(initialCityIds);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const selected = new Set(selectedCityIds);

  function toggleCity(cityId: string) {
    setMessage(null);
    setError(null);
    setSelectedCityIds((current) =>
      current.includes(cityId)
        ? current.filter((id) => id !== cityId)
        : [...current, cityId],
    );
  }

  async function savePreferences() {
    setMessage(null);
    setError(null);
    setSaving(true);

    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityIds: selectedCityIds }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        cityIds?: string[];
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Could not update digest preferences.");
        return;
      }

      setSelectedCityIds(payload.cityIds ?? selectedCityIds);
      setMessage(
        selectedCityIds.length
          ? "Weekly digest cities updated."
          : "Weekly digests paused until you choose a city.",
      );
    } catch {
      setError("Could not update digest preferences.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-10 border-2 border-foreground bg-card">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[18rem_1fr]">
        <div>
          <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            <EnvelopeSimple aria-hidden className="size-4" />
            Weekly digest
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold leading-none tracking-[-0.04em]">
            Pick your city wire.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Mondays at 08:00 PKT, HackScout sends new approved listings from the cities you follow.
          </p>
        </div>

        <div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {cities.map((city) => {
              const active = selected.has(city.id);
              return (
                <button
                  key={city.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleCity(city.id)}
                  className={cn(
                    "min-h-16 border border-foreground bg-background p-3 text-left transition-colors hover:bg-foreground hover:text-background",
                    active && "bg-primary text-primary-foreground hover:bg-foreground",
                  )}
                >
                  <span className="block font-heading text-xl font-semibold leading-none tracking-[-0.03em]">
                    {city.name}
                  </span>
                  <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.13em] opacity-70">
                    {city.isVirtual ? "Virtual desk" : city.province ?? city.slug}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={savePreferences}
              disabled={saving}
              className="min-h-11 border-2 border-foreground bg-foreground px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-background hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save digest cities"}
            </button>
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
              {selectedCityIds.length} selected
            </p>
          </div>

          {message ? (
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-primary">{message}</p>
          ) : null}
          {error ? (
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-destructive">{error}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
